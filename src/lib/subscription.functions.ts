import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubscriptionPlan = "monthly" | "annual";
export type SubscriptionStatus = "pending" | "active" | "canceled" | "expired" | "refunded" | "chargeback";

export type SubscriptionView = {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: string | null;
  expiresAt: string | null;
  canceledAt: string | null;
  subscriptionId: string | null;
};

export type SubscriptionAccess = {
  active: boolean;
  admin: boolean;
  subscription: SubscriptionView | null;
};

const CheckoutInput = z.object({ plan: z.enum(["monthly", "annual"]) });

export const getSubscriptionAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionAccess> => {
    const [accessResult, roleResult, subscriptionResult] = await Promise.all([
      context.supabase.rpc("has_active_subscription", { _user_id: context.userId }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase
        .from("subscriptions")
        .select("id,plan,status,started_at,expires_at,canceled_at,kiwify_subscription_id")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);

    if (accessResult.error || subscriptionResult.error) {
      throw new Error("Não foi possível consultar sua assinatura.");
    }

    const row = subscriptionResult.data;
    return {
      active: Boolean(accessResult.data),
      admin: Boolean(roleResult.data),
      subscription: row
        ? {
            id: row.id,
            plan: row.plan,
            status: row.status,
            startedAt: row.started_at,
            expiresAt: row.expires_at,
            canceledAt: row.canceled_at,
            subscriptionId: row.kiwify_subscription_id,
          }
        : null,
    };
  });

export const getCheckoutUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = data.plan === "monthly" ? "KIWIFY_MONTHLY_CHECKOUT_URL" : "KIWIFY_ANNUAL_CHECKOUT_URL";
    const configuredUrl = process.env[key];
    if (!configuredUrl) return { configured: false as const, url: null };

    let checkout: URL;
    try {
      checkout = new URL(configuredUrl);
    } catch {
      throw new Error("O link de checkout configurado é inválido.");
    }
    if (checkout.protocol !== "https:") throw new Error("O checkout precisa usar uma conexão segura.");

    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("email,name")
      .eq("id", context.userId)
      .single();
    if (error) throw new Error("Não foi possível preparar o checkout.");

    if (profile.email) checkout.searchParams.set("email", profile.email);
    if (profile.name) checkout.searchParams.set("name", profile.name);
    return { configured: true as const, url: checkout.toString() };
  });
