import type { CaktoPlan } from "@/lib/cakto-offers";

const names: Record<CaktoPlan, string> = { monthly: "Start", quarterly: "Pro", annual: "Elite" };

/** Called only after the existing Cakto RPC confirms a newly processed approved purchase. */
export async function sendConfirmedPurchase(input: { transactionId: string; userId: string; plan: CaktoPlan; price: number | string | null | undefined }) {
  if (process.env['MARKETING_TRACKING_ENABLED'] !== 'true') return;
  const token = process.env['META_CAPI_ACCESS_TOKEN'];
  const pixelId = process.env['META_PIXEL_ID'];
  // No configured token means no delivery attempt and no claim: allow a later verified replay.
  if (!token || !pixelId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: consent, error: consentError } = await supabaseAdmin.from("marketing_consent_choices")
    .select("accepted,decided_at,visitor_id").eq("user_id", input.userId)
    .order("decided_at", { ascending: false }).limit(1).maybeSingle();
  if (consentError || !consent?.accepted) return;
  const eventId = `cakto:${input.transactionId}`;
  const value = typeof input.price === "number" ? input.price : typeof input.price === "string" ? Number(input.price.replace(",", ".")) : NaN;
  const amount = Number.isFinite(value) && value > 0 ? value : null;
  const { data: claimed, error } = await supabaseAdmin.from("meta_purchase_deliveries").upsert({
    transaction_id: input.transactionId, event_id: eventId, user_id: input.userId,
    plan: names[input.plan], value: amount, status: "pending",
  }, { onConflict: "transaction_id", ignoreDuplicates: true }).select("transaction_id").maybeSingle();
  if (error || !claimed) return;
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(consent.visitor_id));
    const externalId = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    const response = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(pixelId)}/events`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ access_token: token, data: [{
        event_name: "Purchase", event_time: Math.floor(Date.now() / 1000), event_id: eventId,
        action_source: "website", user_data: { external_id: [externalId] },
        custom_data: { currency: "BRL", transaction_id: input.transactionId, plan: names[input.plan], content_name: names[input.plan], content_type: "product", ...(amount === null ? {} : { value: amount }) },
      }] }),
    });
    if (response.ok) await supabaseAdmin.from("meta_purchase_deliveries").update({ status: "sent", sent_at: new Date().toISOString() }).eq("transaction_id", input.transactionId);
  } catch { /* Cakto confirmation must not fail because advertising is unavailable. */ }
}