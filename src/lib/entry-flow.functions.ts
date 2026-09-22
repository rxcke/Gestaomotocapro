import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidBrazilianMobile } from "@/lib/phone";

const EntryInput = z.object({ intendedPath: z.string().max(500).optional() });

function safeIntendedPath(value: string | undefined): string | null {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;
  if (value === "/auth" || value.startsWith("/auth/") || value === "/onboarding" || value === "/planos" || value === "/pagamento") return null;
  return value.startsWith("/app") || value === "/admin" ? value : null;
}

export const getEntryDestination = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EntryInput.parse(input))
  .handler(async ({ context, data }) => {
    const [accessResult, roleResult, profileResult] = await Promise.all([
      context.supabase.rpc("has_active_subscription", { _user_id: context.userId }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.from("profiles").select("onboarding_completed,phone").eq("id", context.userId).maybeSingle(),
    ]);

    if (accessResult.error || roleResult.error || profileResult.error) {
      throw new Error("Não foi possível preparar sua entrada no aplicativo.");
    }

    const hasAccess = Boolean(accessResult.data || roleResult.data);
    const intendedPath = safeIntendedPath(data.intendedPath);
    if (!isValidBrazilianMobile(profileResult.data?.phone)) return "/onboarding";
    if (!hasAccess) {
      return intendedPath === "/app/perfil" ? "/app/perfil" : "/planos";
    }
    if (!profileResult.data?.onboarding_completed) return "/onboarding";
    if (intendedPath === "/admin" && !roleResult.data) return "/app";
    return intendedPath ?? "/app";
  });