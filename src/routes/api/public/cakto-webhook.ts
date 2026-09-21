import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

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
  offer: z.object({ id: z.string().min(1).max(255) }).nullable().optional(),
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
type Plan = "monthly" | "quarterly" | "annual";

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
  return { event, data: order as unknown as Json };
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

async function processOrder(event: string, order: Order, plan: Plan) {
  const subscription = subscriptionFields(order);
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
    _expires_at: nullableRpcString(subscription.expiresAt),
    _canceled_at: nullableRpcString(subscription.canceledAt),
    _payload: sanitizedPayload(event, order),
  });
  if (error) throw new Error(error.message);
  return data;
}

export const Route = createFileRoute("/api/public/cakto-webhook")({
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
        const monthlyProductId = process.env["CAKTO_MONTHLY_PRODUCT_ID"];
        const quarterlyProductId = process.env["CAKTO_QUARTERLY_PRODUCT_ID"];
        const annualProductId = process.env["CAKTO_ANNUAL_PRODUCT_ID"];
        if (!webhookSecret || !monthlyProductId || !quarterlyProductId || !annualProductId) {
          return Response.json({ error: "webhook_not_configured" }, { status: 503 });
        }

        const parsedPayload = payloadSchema.safeParse(parsedJson);
        if (!parsedPayload.success) {
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
          return Response.json({ error: "invalid_signature" }, { status: 401 });
        }

        const { event } = parsedPayload.data;
        if (!supportedEvents.has(event)) {
          return Response.json({ received: true, ignored: "unsupported_event" });
        }

        const orders = Array.isArray(parsedPayload.data.data)
          ? parsedPayload.data.data
          : [parsedPayload.data.data];

        try {
          const results = [];
          for (const order of orders) {
            const plan: Plan | null = order.product.id === monthlyProductId
              ? "monthly"
              : order.product.id === quarterlyProductId
                ? "quarterly"
              : order.product.id === annualProductId
                ? "annual"
                : null;
            if (!plan) {
              await recordRejectedEvent(event, order, "unknown_product");
              results.push({ id: order.id, result: "unknown_product" });
              continue;
            }
            results.push({ id: order.id, result: await processOrder(event, order, plan) });
          }
          return Response.json({ received: true, results });
        } catch (error) {
          console.error("[Cakto webhook] Processing failed", error);
          return Response.json({ error: "processing_failed" }, { status: 500 });
        }
      },
    },
  },
});