import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import {
  hasDistinctWebhookOfferIds,
  resolveCaktoPlan,
  type CaktoPlan,
} from "@/lib/cakto-offers";

const MAX_BODY_BYTES = 256_000;
const MAX_TIMESTAMP_DRIFT_SECONDS = 300;

const supportedEvents = new Set([
  "purchase_approved",
  "subscription_created",
  "subscription_renewed",
  "subscription_resumed",
  "subscription_late_recovered",
  "subscription_canceled",
  "subscription_late",
  "subscription_renewal_refused",
  "subscription_paused",
  "refund",
  "chargeback",
]);

const orderSchema = z.object({
  id: z.string().min(1).max(255),
  customer: z.object({ email: z.string().email().max(320) }),
  product: z.object({ id: z.string().min(1).max(255) }),
  offer: z.object({
    id: z.string().min(1).max(255),
    name: z.string().max(500).nullable().optional(),
    price: z.union([z.number().finite(), z.string().max(100)]).nullable().optional(),
  }).nullable().optional(),
  subscription: z.record(z.unknown()).nullable().optional(),
  createdAt: z.string().datetime({ offset: true }).nullable().optional(),
  paidAt: z.string().datetime({ offset: true }).nullable().optional(),
  canceledAt: z.string().datetime({ offset: true }).nullable().optional(),
});

const payloadSchema = z.object({
  secret: z.string().optional(),
  event: z.string().min(1).max(100),
  data: z.union([orderSchema, z.array(orderSchema).min(1).max(20)]),
});

type Order = z.infer<typeof orderSchema>;

function hexToBytes(value: string): ArrayBuffer | null {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    const pair = value.slice(index * 2, index * 2 + 2);
    bytes[index] = Number.parseInt(pair, 16);
  }
  return bytes.buffer;
}

async function hasValidSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!timestamp || !signature?.startsWith("v1=")) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isInteger(timestampSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > MAX_TIMESTAMP_DRIFT_SECONDS) return false;

  const signatureBytes = hexToBytes(signature.slice(3));
  if (!signatureBytes) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(`${timestamp}.${rawBody}`),
  );
}

function hasValidBodySecret(received: unknown, expected: string): boolean {
  if (typeof received !== "string") return false;
  const encoder = new TextEncoder();
  const receivedBytes = encoder.encode(received);
  const expectedBytes = encoder.encode(expected);
  if (receivedBytes.length !== expectedBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) {
    const receivedByte = receivedBytes.at(index) ?? 0;
    const expectedByte = expectedBytes.at(index) ?? 0;
    difference |= receivedByte ^ expectedByte;
  }
  return difference === 0;
}

function readString(record: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function subscriptionFields(order: Order) {
  const subscription = order.subscription;
  return {
    id: readString(subscription, "id"),
    startedAt: readString(subscription, "createdAt") ?? order.paidAt ?? order.createdAt ?? null,
    expiresAt: readString(subscription, "next_payment_date"),
    canceledAt: order.canceledAt ?? readString(subscription, "canceledAt"),
  };
}

function sanitizedPayload(event: string, order: Order): Json {
  const subscription = subscriptionFields(order);
  return {
    event,
    data: {
      id: order.id,
      product_id: order.product.id,
      offer_id: order.offer?.id ?? null,
      offer_name: order.offer?.name ?? null,
      offer_price: order.offer?.price ?? null,
      subscription_id: subscription.id,
      started_at: subscription.startedAt,
      expires_at: subscription.expiresAt,
      canceled_at: subscription.canceledAt,
    },
  };
}

function fallbackExpiration(event: string, plan: CaktoPlan, startedAt: string | null, expiresAt: string | null) {
  if (expiresAt) return expiresAt;
  const initialEvent = event === "purchase_approved" || event === "subscription_created";
  const base = initialEvent && startedAt ? new Date(startedAt) : new Date();
  if (Number.isNaN(base.getTime())) return null;
  if (plan === "monthly") base.setUTCMonth(base.getUTCMonth() + 1);
  else if (plan === "quarterly") base.setUTCMonth(base.getUTCMonth() + 3);
  else base.setUTCFullYear(base.getUTCFullYear() + 1);
  return base.toISOString();
}

async function recordRejectedEvent(
  event: string,
  order: Order,
  reason: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("webhook_events").upsert(
    {
      event_id: `${event}:${order.id}`,
      event_type: event,
      transaction_id: order.id,
      payload: sanitizedPayload(event, order),
      processed: false,
      error_message: reason,
    },
    { onConflict: "event_id", ignoreDuplicates: true },
  );
}

function logWebhook(
  level: "info" | "warn" | "error",
  details: Record<string, unknown>,
): void {
  const entry = { source: "cakto-webhook", ...details };
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

async function processOrder(event: string, order: Order, plan: CaktoPlan) {
  const subscription = subscriptionFields(order);
  const effectiveExpiration = fallbackExpiration(event, plan, subscription.startedAt, subscription.expiresAt);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // PostgREST accepts null for these nullable SQL parameters, while generated RPC types omit null.
  const nullableRpcString = (value: string | null) => value as unknown as string;
  const { data, error } = await supabaseAdmin.rpc("process_cakto_subscription_event", {
    _event_id: `${event}:${order.id}`,
    _event_type: event,
    _transaction_id: order.id,
    _buyer_email: order.customer.email,
    _plan: plan,
    _product_id: order.product.id,
    _offer_id: nullableRpcString(order.offer?.id ?? null),
    _subscription_id: nullableRpcString(subscription.id),
    _started_at: nullableRpcString(subscription.startedAt),
    _expires_at: nullableRpcString(effectiveExpiration),
    _canceled_at: nullableRpcString(subscription.canceledAt),
    _payload: sanitizedPayload(event, order),
  });
  if (error) throw new Error(error.message);
  return data;
}

export const Route = createFileRoute("/api/public/cakto-webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
          return Response.json({ error: "content_type_not_supported" }, { status: 415 });
        }

        const declaredLength = Number(request.headers.get("content-length") ?? 0);
        if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
          return Response.json({ error: "payload_too_large" }, { status: 413 });
        }

        const rawBody = await request.text();
        if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
          return Response.json({ error: "payload_too_large" }, { status: 413 });
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawBody);
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }

        const webhookSecret = process.env["CAKTO_WEBHOOK_SECRET"];
        const productId = process.env["CAKTO_PRODUCT_ID"];
        const startOfferId = process.env["CAKTO_START_OFFER_ID"];
        const proOfferId = process.env["CAKTO_PRO_OFFER_ID"];
        const eliteOfferId = process.env["CAKTO_ELITE_OFFER_ID"];
        if (!webhookSecret || !productId || !startOfferId || !proOfferId || !eliteOfferId) {
          logWebhook("error", { outcome: "webhook_not_configured" });
          return Response.json({ error: "webhook_not_configured" }, { status: 503 });
        }
        const offerConfiguration = {
          start: startOfferId,
          pro: proOfferId,
          elite: eliteOfferId,
        };
        if (!hasDistinctWebhookOfferIds(offerConfiguration)) {
          logWebhook("error", { outcome: "offer_configuration_conflict" });
          return Response.json({ error: "webhook_not_configured" }, { status: 503 });
        }

        const parsedPayload = payloadSchema.safeParse(parsedJson);
        if (!parsedPayload.success) {
          logWebhook("warn", { outcome: "invalid_payload" });
          return Response.json({ error: "invalid_payload" }, { status: 400 });
        }

        const signatureIsValid = await hasValidSignature(
          rawBody,
          request.headers.get("x-cakto-timestamp"),
          request.headers.get("x-cakto-signature"),
          webhookSecret,
        );
        const bodySecretIsValid = hasValidBodySecret(parsedPayload.data.secret, webhookSecret);
        if (!signatureIsValid && !bodySecretIsValid) {
          logWebhook("warn", { outcome: "invalid_signature" });
          return Response.json({ error: "invalid_signature" }, { status: 401 });
        }

        const { event } = parsedPayload.data;
        if (!supportedEvents.has(event)) {
          logWebhook("info", { event, outcome: "unsupported_event" });
          return Response.json({ received: true, ignored: "unsupported_event" });
        }

        const orders = Array.isArray(parsedPayload.data.data)
          ? parsedPayload.data.data
          : [parsedPayload.data.data];

        try {
          const results = [];
          for (const order of orders) {
            if (order.product.id !== productId) {
              await recordRejectedEvent(event, order, "unknown_product");
              logWebhook("warn", { event, eventId: order.id, outcome: "unknown_product" });
              results.push({ id: order.id, result: "unknown_product" });
              continue;
            }

            const offerId = order.offer?.id ?? null;
            const plan = resolveCaktoPlan(offerId, offerConfiguration);
            if (!plan) {
              await recordRejectedEvent(event, order, "unknown_offer");
              logWebhook("warn", { event, eventId: order.id, outcome: "unknown_offer" });
              results.push({ id: order.id, result: "unknown_offer" });
              continue;
            }
            const result = await processOrder(event, order, plan);
            if (event === "purchase_approved" && result && typeof result === "object" && "result" in result && result['result'] === "processed" && "user_id" in result && typeof result['user_id'] === "string") {
              // Advertising is best-effort; it never controls subscription status or webhook acknowledgement.
              try {
                const { sendConfirmedPurchase } = await import("@/lib/meta-purchase.server");
                await sendConfirmedPurchase({ transactionId: order.id, userId: result['user_id'], plan, price: order.offer?.price });
              } catch { /* Never disclose the provider token or reject a valid Cakto purchase. */ }
            }
            logWebhook("info", { event, eventId: order.id, plan, outcome: result });
            results.push({ id: order.id, result });
          }
          return Response.json({ received: true, results });
        } catch (error) {
          logWebhook("error", {
            event,
            outcome: "processing_failed",
            message: error instanceof Error ? error.message : "unknown_error",
          });
          return Response.json({ error: "processing_failed" }, { status: 500 });
        }
      },
    },
  },
});