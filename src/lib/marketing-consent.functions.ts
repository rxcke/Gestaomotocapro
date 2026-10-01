import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { NOTICE_VERSION } from "@/lib/marketing-consent";

const Choice = z.object({ visitorId: z.string().uuid(), accepted: z.boolean(), region: z.string().min(2).max(2), decidedAt: z.string().datetime(), noticeVersion: z.literal(NOTICE_VERSION) });

export const recordMarketingChoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Choice.parse(input))
  .handler(async ({ context, data }) => {
    const { data: latest, error: readError } = await context.supabase.from("marketing_consent_choices")
      .select("id,decided_at,accepted").eq("user_id", context.userId).order("decided_at", { ascending: false }).limit(1).maybeSingle();
    if (readError) throw readError;
    if (latest && new Date(latest.decided_at).getTime() >= new Date(data.decidedAt).getTime()) return { recorded: false };
    const { error } = await context.supabase.from("marketing_consent_choices").insert({
      user_id: context.userId, visitor_id: data.visitorId, accepted: data.accepted,
      region: data.region, decided_at: data.decidedAt, notice_version: data.noticeVersion,
      previous_choice_id: latest?.id ?? null,
    });
    if (error) throw error;
    return { recorded: true };
  });