import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const recordAppAccessPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("record_app_access_points");
    if (error) throw new Error("Não foi possível registrar os pontos deste acesso.");
    return data?.[0] ?? null;
  });

export const getMyPoints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [summary, history] = await Promise.all([
      context.supabase.rpc("get_my_points_summary"),
      context.supabase.from("points_events")
        .select("id,event_type,points,reference_date,week_start,granted_at")
        .eq("user_id", context.userId).order("granted_at", { ascending: false }).limit(100),
    ]);
    if (summary.error || history.error) throw new Error("Não foi possível consultar sua pontuação.");
    return { summary: summary.data?.[0] ?? null, history: history.data ?? [] };
  });

const RankingInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const getPointsRanking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RankingInput.parse(input))
  .handler(async ({ context, data }) => {
    const result = await context.supabase.rpc("get_points_ranking", { _limit: data.limit, _offset: data.offset });
    if (result.error) throw new Error("Não foi possível consultar o ranking.");
    return result.data ?? [];
  });