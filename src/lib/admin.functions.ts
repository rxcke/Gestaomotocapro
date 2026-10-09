import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AdminOwner = {
  name: string | null;
  email: string | null;
};

export type AdminData = {
  users: Array<{ id: string; name: string | null; email: string | null; phone: string | null; admin: boolean; ambassador: boolean; subscribed: boolean; demo: boolean; demoStartedAt: string | null; demoExpiresAt: string | null; referral: string | null }>;
  subscriptions: Array<{
    id: string;
    user_id: string;
    email: string;
    plan: "monthly" | "quarterly" | "annual";
    status: "trial" | "pending" | "active" | "canceled" | "expired" | "refunded" | "chargeback";
    provider_status: string;
    trial_started_at: string | null;
    trial_ends_at: string | null;
    recurring_amount: number | null;
    cakto_transaction_id: string | null;
    started_at: string | null;
    expires_at: string | null;
    created_at: string;
  }>;
  webhookEvents: Array<{
    id: string;
    event_type: string;
    transaction_id: string | null;
    processed: boolean;
    error_message: string | null;
    created_at: string;
  }>;
  motorcycles: Array<{
    id: string;
    user_id: string;
    brand: string;
    model: string;
    year: number | null;
    plate: string | null;
    current_km: number;
    created_at: string;
  }>;
  incomes: Array<{
    id: string;
    user_id: string;
    motorcycle_id: string | null;
    category: string;
    amount: number;
    date: string;
    description: string | null;
  }>;
  expenses: Array<{
    id: string;
    user_id: string;
    motorcycle_id: string | null;
    category: string;
    group_name: string;
    amount: number;
    date: string;
    description: string | null;
  }>;
  fuelRecords: Array<{
    id: string;
    user_id: string;
    motorcycle_id: string | null;
    date: string;
    km: number | null;
    liters: number | null;
    price_per_liter: number | null;
    total: number;
    station: string | null;
  }>;
  owners: Record<string, AdminOwner>;
};

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminData> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    if (roleError || !isAdmin) throw new Error("Acesso administrativo não autorizado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [motorcyclesResult, incomesResult, expensesResult, fuelResult, profilesResult, rolesResult, subscriptionsResult, eventsResult, demoResult, attributionResult] =
      await Promise.all([
        supabaseAdmin
          .from("motorcycles")
          .select("id,user_id,brand,model,year,plate,current_km,created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("incomes")
          .select("id,user_id,motorcycle_id,category,amount,date,description")
          .order("date", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("expenses")
          .select("id,user_id,motorcycle_id,category,group_name,amount,date,description")
          .order("date", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("fuel_records")
          .select("id,user_id,motorcycle_id,date,km,liters,price_per_liter,total,station")
          .order("date", { ascending: false })
          .limit(500),
        supabaseAdmin.from("profiles").select("id,name,email,phone").limit(500),
        supabaseAdmin.from("user_roles").select("user_id,role").in("role", ["admin", "ambassador"]).limit(500),
        supabaseAdmin.from("subscriptions").select("id,user_id,email,plan,status,provider_status,cakto_transaction_id,started_at,expires_at,created_at,trial_started_at,trial_ends_at,recurring_amount").order("created_at", { ascending: false }).limit(500),
        supabaseAdmin.from("webhook_events").select("id,event_type,transaction_id,processed,error_message,created_at").order("created_at", { ascending: false }).limit(100),
        supabaseAdmin.from("demo_usage").select("user_id,demo_started_at,demo_expires_at").limit(500),
        supabaseAdmin.from("signup_attribution").select("user_id,referral_code").limit(500),
      ]);

    const error =
      motorcyclesResult.error ??
      incomesResult.error ??
      expensesResult.error ??
      fuelResult.error ??
      profilesResult.error ??
      rolesResult.error ??
      subscriptionsResult.error ??
      eventsResult.error ?? demoResult.error ?? attributionResult.error;
    if (error) throw new Error("Não foi possível carregar os dados administrativos.");

    const owners = Object.fromEntries(
      (profilesResult.data ?? []).map((profile) => [
        profile.id,
        { name: profile.name, email: profile.email },
      ]),
    );
    const ambassadors = new Set((rolesResult.data ?? []).filter((role) => role.role === "ambassador").map((role) => role.user_id));
    const admins = new Set((rolesResult.data ?? []).filter((role) => role.role === "admin").map((role) => role.user_id));
    const subscribers = new Set((subscriptionsResult.data ?? []).filter((row) => row.status === "active" && row.expires_at && new Date(row.expires_at).getTime() > Date.now()).map((row) => row.user_id));

    const demoByUser = new Map((demoResult.data ?? []).map(row => [row.user_id,row]));
    const referralByUser = new Map((attributionResult.data ?? []).map(row => [row.user_id,row.referral_code]));
    const blocked = new Set((subscriptionsResult.data ?? []).filter(row => ["active","trial","canceled","expired","refunded","chargeback"].includes(row.status) || ["late","paused"].includes(row.provider_status)).map(row => row.user_id));
    return {
      users: (profilesResult.data ?? []).map((profile) => ({ ...profile, admin: admins.has(profile.id), ambassador: ambassadors.has(profile.id), subscribed: subscribers.has(profile.id), demo: !admins.has(profile.id) && !ambassadors.has(profile.id) && !blocked.has(profile.id), demoStartedAt: demoByUser.get(profile.id)?.demo_started_at ?? null, demoExpiresAt: demoByUser.get(profile.id)?.demo_expires_at ?? null, referral: referralByUser.get(profile.id) ?? null })),
      motorcycles: motorcyclesResult.data ?? [],
      incomes: incomesResult.data ?? [],
      expenses: expensesResult.data ?? [],
      fuelRecords: fuelResult.data ?? [],
      subscriptions: subscriptionsResult.data ?? [],
      webhookEvents: eventsResult.data ?? [],
      owners,
    };
  });

const AmbassadorInput = z.object({ userId: z.string().uuid(), grant: z.boolean() });

export const setAmbassadorAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AmbassadorInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Acesso administrativo não autorizado.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("id").eq("id", data.userId).maybeSingle();
    if (profileError || !profile) throw new Error("Usuário não encontrado.");
    if (data.grant) {
      const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "ambassador" }, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (error) throw new Error("Não foi possível conceder o acesso.");
    } else {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "ambassador");
      if (error) throw new Error("Não foi possível remover o acesso.");
    }
    return { ok: true };
  });
const ExportInput = z.object({
  period: z.enum(["all", "today", "7d", "30d", "custom"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  subscription: z.enum(["all", "active", "none"]),
  demo: z.enum(["all", "active", "expired", "none"]),
  countOnly: z.boolean(),
});

export const exportUsersCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExportInput.parse(input))
  .handler(async ({ context, data }): Promise<{ count: number; csv: string | null }> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !isAdmin) throw new Error("Acesso administrativo não autorizado.");
    const { periodRange, crmWhatsapp, brDateTime, demoStatus, buildCsv } = await import("./user-export");
    const now = new Date();
    const range = periodRange(data.period, now, data.from, data.to);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    type P = { id: string; name: string | null; email: string | null; phone: string | null; created_at: string; auth_provider: string };
    const profiles: P[] = [];
    for (let offset = 0; ; offset += 1000) {
      let q = supabaseAdmin.from("profiles").select("id,name,email,phone,created_at,auth_provider").order("created_at", { ascending: false }).range(offset, offset + 999);
      if (range) q = q.gte("created_at", range.start).lt("created_at", range.end);
      const { data: page, error } = await q;
      if (error) throw new Error("Não foi possível ler os usuários.");
      profiles.push(...(page ?? []));
      if (!page || page.length < 1000) break;
    }

    const ids = profiles.map((p) => p.id);
    const subs: Array<{ user_id: string; plan: string; status: string; provider_status: string; expires_at: string | null; created_at: string }> = [];
    const demos = new Map<string, { demo_started_at: string | null; demo_expires_at: string | null }>();
    const referrals = new Map<string, string | null>();
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const [s, d, a] = await Promise.all([
        supabaseAdmin.from("subscriptions").select("user_id,plan,status,provider_status,expires_at,created_at").in("user_id", chunk),
        supabaseAdmin.from("demo_usage").select("user_id,demo_started_at,demo_expires_at").in("user_id", chunk),
        supabaseAdmin.from("signup_attribution").select("user_id,referral_code").in("user_id", chunk),
      ]);
      if (s.error || d.error || a.error) throw new Error("Não foi possível ler os dados de acesso.");
      subs.push(...(s.data ?? []));
      (d.data ?? []).forEach((r) => demos.set(r.user_id, r));
      (a.data ?? []).forEach((r) => referrals.set(r.user_id, r.referral_code));
    }
    const latestSub = new Map<string, (typeof subs)[number]>();
    for (const s of subs) { const cur = latestSub.get(s.user_id); if (!cur || s.created_at > cur.created_at) latestSub.set(s.user_id, s); }
    const isActive = (s?: (typeof subs)[number]) => !!s && s.status === "active" && !!s.expires_at && new Date(s.expires_at) > now;
    const planName: Record<string, string> = { monthly: "Start", quarterly: "Pro", annual: "Elite" };
    const statusName: Record<string, string> = { pending: "Pendente", trial: "Trial", active: "Ativa", canceled: "Cancelada", expired: "Expirada", refunded: "Reembolsada", chargeback: "Chargeback", paused: "Pausada", late: "Inadimplente" };

    const rows = profiles.filter((p) => {
      const active = isActive(latestSub.get(p.id)) || subs.some((s) => s.user_id === p.id && isActive(s));
      if (data.subscription === "active" && !active) return false;
      if (data.subscription === "none" && active) return false;
      const ds = demoStatus(demos.get(p.id)?.demo_expires_at, now);
      if (data.demo === "active" && ds !== "Ativa") return false;
      if (data.demo === "expired" && ds !== "Expirada") return false;
      if (data.demo === "none" && ds !== "Sem demonstração") return false;
      return true;
    });
    if (data.countOnly || rows.length === 0) return { count: rows.length, csv: null };

    const csv = buildCsv(rows.map((p) => {
      const s = latestSub.get(p.id);
      const demo = demos.get(p.id);
      const st = s ? (s.provider_status === "pending" && s.status !== "pending" ? s.status : s.provider_status) : null;
      return [
        p.email ?? "", p.name ?? "", crmWhatsapp(p.phone), brDateTime(p.created_at),
        p.auth_provider === "google" ? "Google" : p.auth_provider === "email" ? "E-mail" : p.auth_provider ?? "",
        referrals.get(p.id) ?? "",
        s ? planName[s.plan] ?? "" : "", st ? statusName[st] ?? st : "Sem assinatura",
        demoStatus(demo?.demo_expires_at, now), brDateTime(demo?.demo_started_at), brDateTime(demo?.demo_expires_at),
      ];
    }));
    return { count: rows.length, csv };
  });
