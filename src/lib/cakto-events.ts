/**
 * Pure helpers for Cakto webhook deliveries, following docs.cakto.com.br/conceitos/webhooks:
 * header `X-Cakto-Signature: v1=<hex hmac-sha256 of "{timestamp}.{raw body}">`, keyed by the secret.
 */
export const MAX_TIMESTAMP_DRIFT_SECONDS = 300;

type EventDates = {
  paidAt?: string | null | undefined;
  refundedAt?: string | null | undefined;
  chargedbackAt?: string | null | undefined;
  canceledAt?: string | null | undefined;
};

function iso(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Business time used to order events. Uses the event-specific Cakto date when present,
 * otherwise the signed delivery timestamp (seconds). Never invents a date.
 */
export function caktoEventTime(event: string, order: EventDates, deliveryTimestamp: string | null): string | null {
  const specific =
    event === "refund" ? order.refundedAt
    : event === "chargeback" ? order.chargedbackAt
    : event === "subscription_canceled" ? order.canceledAt
    : event === "purchase_approved" || event === "subscription_renewed" ? order.paidAt
    : null;
  const fromOrder = iso(specific);
  if (fromOrder) return fromOrder;
  const seconds = Number(deliveryTimestamp);
  return Number.isInteger(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function hexToBytes(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return null;
  const bytes = new Uint8Array(new ArrayBuffer(value.length / 2));
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export async function hasValidCaktoSignature(
  rawBody: string,
  timestamp: string | null,
  signatureHeader: string | null,
  secret: string,
  nowSeconds: number = Date.now() / 1000,
): Promise<boolean> {
  if (!timestamp || !signatureHeader) return false;
  const ts = Number(timestamp);
  if (!Number.isInteger(ts) || Math.abs(nowSeconds - ts) > MAX_TIMESTAMP_DRIFT_SECONDS) return false;
  // During algorithm transitions Cakto may send several comma-separated versions; only v1 is known.
  const v1 = signatureHeader.split(",").map((part) => part.trim()).find((part) => part.startsWith("v1="));
  const bytes = v1 ? hexToBytes(v1.slice(3)) : null;
  if (!bytes) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, bytes, encoder.encode(`${timestamp}.${rawBody}`));
}
