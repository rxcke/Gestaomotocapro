/**
 * Reads trial facts exclusively from the Cakto `data.subscription` object.
 * A trial exists only when Cakto reports `subscription.status === "trial"`;
 * signup dates, URL parameters and page visits never create one.
 */
export type CaktoSubscriptionFacts = {
  status: string | null;
  isTrial: boolean;
  trialEndsAt: string | null;
  amount: number | null;
};

function text(record: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function validDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function readCaktoSubscriptionFacts(
  subscription: Record<string, unknown> | null | undefined,
): CaktoSubscriptionFacts {
  const status = text(subscription, "status");
  const isTrial = status === "trial";
  let trialEndsAt: string | null = null;
  if (isTrial) {
    trialEndsAt = validDate(text(subscription, "next_payment_date"));
    const days = subscription?.["trial_days"];
    const created = validDate(text(subscription, "createdAt"));
    if (!trialEndsAt && typeof days === "number" && Number.isInteger(days) && days > 0 && created) {
      const end = new Date(created);
      end.setUTCDate(end.getUTCDate() + days);
      trialEndsAt = end.toISOString();
    }
  }
  const rawAmount = subscription?.["amount"];
  const parsed = typeof rawAmount === "number" ? rawAmount : typeof rawAmount === "string" ? Number(rawAmount) : NaN;
  return { status, isTrial, trialEndsAt, amount: Number.isFinite(parsed) && parsed > 0 ? parsed : null };
}

/** Whole days left until the Cakto-reported trial end; null when unknown or over. */
export function trialDaysLeft(trialEndsAt: string | null, now: Date = new Date()): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end) || end <= now.getTime()) return null;
  return Math.ceil((end - now.getTime()) / 86_400_000);
}
