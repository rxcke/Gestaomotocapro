import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubscriptionPlan = "monthly" | "quarterly" | "annual";
export type SubscriptionStatus = "pending" | "active" | "canceled" | "expired" | "refunded" | "chargeback";
export type ProviderSubscriptionStatus = SubscriptionStatus | "paused" | "late";

export type SubscriptionView = {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  providerStatus: ProviderSubscriptionStatus;
  startedAt: string | null;
  expiresAt: string | null;
  canceledAt: string | null;
  subscriptionId: string | null;
};

export type SubscriptionAccess = {
  active: boolean;
  admin: boolean;
  ambassador: boolean;
  hasAppAccess: boolean;
  subscription: SubscriptionView | null;
};

const CheckoutInput = z.object({ plan: z.enum(["monthly", "quarterly", "annual"]) });

export const getSubscriptionAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionAccess> => {
    const [accessResult, roleResult, ambassadorResult, appAccessResult, subscriptionResult] = await Promise.all([
      context.supabase.rpc("has_active_subscription", { _user_id: context.userId }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "ambassador" }),
      context.supabase.rpc("has_app_access", { _user_id: context.userId }),
      context.supabase
        .from("subscriptions")
        .select("id,plan,status,provider_status,started_at,expires_at,canceled_at,cakto_subscription_id")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);

    if (accessResult.error || roleResult.error || ambassadorResult.error || appAccessResult.error || subscriptionResult.error) {
      throw new Error("Não foi possível consultar sua assinatura.");
    }

    const row = subscriptionResult.data;
    return {
      active: Boolean(accessResult.data),
      admin: Boolean(roleResult.data),
      ambassador: Boolean(ambassadorResult.data),
      hasAppAccess: Boolean(appAccessResult.data),
      subscription: row
        ? {
            id: row.id,
            plan: row.plan,
            status: row.status,
            providerStatus: (row.provider_status === "pending" && row.status !== "pending"
              ? row.status
              : row.provider_status) as ProviderSubscriptionStatus,
            startedAt: row.started_at,
            expiresAt: row.expires_at,
            canceledAt: row.canceled_at,
            subscriptionId: row.cakto_subscription_id,
          }
        : null,
    };
  });

export const getCheckoutUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data }) => {
    const key = data.plan === "monthly"
      ? "CAKTO_MONTHLY_CHECKOUT_URL"
      : data.plan === "quarterly"
        ? "CAKTO_QUARTERLY_CHECKOUT_URL"
        : "CAKTO_ANNUAL_CHECKOUT_URL";
    const configuredUrl = process.env[key];
    if (!configuredUrl) return { configured: false as const, url: null };

    let checkout: URL;
    try {
      checkout = new URL(configuredUrl);
    } catch {
      throw new Error("O link de checkout configurado é inválido.");
    }
    if (checkout.protocol !== "https:" || checkout.hostname !== "pay.cakto.com.br") {
      throw new Error("O checkout configurado não pertence ao domínio oficial da Cakto.");
    }

    return { configured: true as const, url: checkout.toString() };
  });
