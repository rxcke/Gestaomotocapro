import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.rpc("start_demo");
    if (error) throw new Error("Não foi possível começar a demonstração.");
    return { ok: true };
  });

export const recordSignupAttribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ campaign: z.record(z.string().max(200)).refine(value => Object.keys(value).length <= 10) }).parse(input))
  .handler(async ({ context, data }) => {
    const allowed = ["ref", "ambassador", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
    const campaign = Object.fromEntries(Object.entries(data.campaign).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(campaign).length) return { ok: true };
    const { data: existing, error: readError } = await context.supabase.from("signup_attribution").select("user_id").eq("user_id", context.userId).maybeSingle();
    if (readError) throw new Error("Não foi possível guardar sua indicação.");
    if (!existing) {
      const { error } = await context.supabase.from("signup_attribution").insert({ user_id: context.userId, referral_code: campaign["ref"] ?? campaign["ambassador"] ?? null, campaign });
      if (error && error.code !== "23505") throw new Error("Não foi possível guardar sua indicação.");
    }
    return { ok: true };
  });