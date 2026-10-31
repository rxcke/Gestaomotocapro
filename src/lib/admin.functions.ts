import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { ADMIN_PAGE_SIZE, accessKind, overviewPeriodStart, webhookNeedsAttention, type AdminAccessKind, type OverviewPeriod } from "./admin-view";

type AdminClient = SupabaseClient<Database>;

type AdminContext = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: unknown; error: unknown }> }; userId: string };

/** Every admin function re-verifies the role server-side; the route gate is only UX. */
async function requireAdmin(context: AdminContext) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !isAdmin) throw new Error("Acesso administrativo não autorizado.");
}

function paginate<T>(rows: T[], page: number): { rows: T[]; total: number } {
  const start = (page - 1) * ADMIN_PAGE_SIZE;
  return { rows: rows.slice(start, start + ADMIN_PAGE_SIZE), total: rows.length };
}

// ---------- Visão geral ----------

const OverviewInput = z.object({ period: z.enum(["7d", "30d", "all"]).default("all") });

export type AdminOverview = {
  totalUsers: number;
  activeSubscriptions: number;
  newSignups: number;
  canceledSubscriptions: number;
  expiredSubscriptions: number;
  webhookAttention: number;
  pendingRedemptions: number;
  recentUsers: Array<{ id: string; name: string | null; email: string | null; created_at: string }>;
  recentEvents: Array<{ id: string; event_type: string; processed: boolean; error_message: string | null; created_at: string }>;
};

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OverviewInput.parse(input ?? {}))
  .handler(async ({ context, data }): Promise<AdminOverview> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const start = overviewPeriodStart(data.period as OverviewPeriod, now);

    const count = async (build: () => PromiseLike<{ count: number | null; error: unknown }>) => {
      const { count: value, error } = await build();
      if (error) throw new Error("Não foi possível carregar a visão geral.");
      return value ?? 0;
    };

    let signupsQuery = supabaseAdmin.from("profiles").select("id", { count: "exact", head: true });
    if (start) signupsQuery = signupsQuery.gte("created_at", start.toISOString());

    const [totalUsers, activeSubscriptions, newSignups, canceledSubscriptions, expiredSubscriptions, webhookAttention, pendingRedemptions, recentUsersResult, recentEventsResult] = await Promise.all([
      count(() => supabaseAdmin.from("profiles").select("id", { count: "exact", head: true })),
      count(() => supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active").gt("expires_at", now.toISOString())),
      count(() => signupsQuery),
      count(() => supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "canceled")),
      count(() => supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired")),
      count(() => supabaseAdmin.from("webhook_events").select("id", { count: "exact", head: true }).or("processed.eq.false,error_message.not.is.null")),
      count(() => supabaseAdmin.from("reward_redemptions").select("id", { count: "exact", head: true }).eq("status", "pending")),
      supabaseAdmin.from("profiles").select("id,name,email,created_at").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("webhook_events").select("id,event_type,transaction_id,processed,error_message,created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    if (recentUsersResult.error || recentEventsResult.error) throw new Error("Não foi possível carregar a visão geral.");

    return {
      totalUsers,
      activeSubscriptions,
      newSignups,
      canceledSubscriptions,
      expiredSubscriptions,
      webhookAttention,
      pendingRedemptions,
      recentUsers: recentUsersResult.data ?? [],
      recentEvents: (recentEventsResult.data ?? []).map(({ id, event_type, processed, error_message, created_at }) => ({ id, event_type, processed, error_message, created_at })),
    };
  });

// ---------- Usuários ----------

const UsersInput = z.object({
  search: z.string().trim().max(120).default(""),
  access: z.enum(["all", "admin", "ambassador", "subscriber", "demo", "demo_expired", "none"]).default("all"),
  subscription: z.enum(["all", "active", "trial", "pending", "canceled", "expired", "refunded", "chargeback", "none"]).default("all"),
  page: z.number().int().min(1).default(1),
});

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  admin: boolean;
  ambassador: boolean;
  subscribed: boolean;
  demo: boolean;
  demoStartedAt: string | null;
  demoExpiresAt: string | null;
  referral: string | null;
  createdAt: string;
  plan: string | null;
  subscriptionStatus: string | null;
  access: AdminAccessKind;
};

async function loadUserRows(supabaseAdmin: AdminClient): Promise<AdminUserRow[]> {
  const [profilesResult, rolesResult, subscriptionsResult, demoResult, attributionResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("id,name,email,phone,created_at").order("created_at", { ascending: false }).limit(1000),
    supabaseAdmin.from("user_roles").select("user_id,role").in("role", ["admin", "ambassador"]).limit(1000),
    supabaseAdmin.from("subscriptions").select("user_id,plan,status,provider_status,expires_at,created_at").order("created_at", { ascending: false }).limit(1000),
    supabaseAdmin.from("demo_usage").select("user_id,demo_started_at,demo_expires_at").limit(1000),
    supabaseAdmin.from("signup_attribution").select("user_id,referral_code").limit(1000),
  ]);
  const error = profilesResult.error ?? rolesResult.error ?? subscriptionsResult.error ?? demoResult.error ?? attributionResult.error;
  if (error) throw new Error("Não foi possível carregar os usuários.");

  const now = Date.now();
  const admins = new Set((rolesResult.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
  const ambassadors = new Set((rolesResult.data ?? []).filter((r) => r.role === "ambassador").map((r) => r.user_id));
  const subscribers = new Set(
    (subscriptionsResult.data ?? [])
      .filter((row) => row.status === "active" && row.expires_at && new Date(row.expires_at).getTime() > now)
      .map((row) => row.user_id),
  );
  type SubRow = { user_id: string; plan: string; status: string; provider_status: string; expires_at: string | null; created_at: string };
  const latestSub = new Map<string, SubRow>();
  for (const sub of subscriptionsResult.data ?? []) if (!latestSub.has(sub.user_id)) latestSub.set(sub.user_id, sub);
  const demoByUser = new Map((demoResult.data ?? []).map((row) => [row.user_id, row]));
  const referralByUser = new Map((attributionResult.data ?? []).map((row) => [row.user_id, row.referral_code]));
  const blocked = new Set(
    (subscriptionsResult.data ?? [])
      .filter((row) => ["active", "trial", "canceled", "expired", "refunded", "chargeback"].includes(row.status) || ["late", "paused"].includes(row.provider_status))
      .map((row) => row.user_id),
  );

  return (profilesResult.data ?? []).map((profile) => {
    const sub = latestSub.get(profile.id);
    const base = {
      admin: admins.has(profile.id),
      ambassador: ambassadors.has(profile.id),
      subscribed: subscribers.has(profile.id),
      demo: !admins.has(profile.id) && !ambassadors.has(profile.id) && !blocked.has(profile.id),
      demoExpiresAt: demoByUser.get(profile.id)?.demo_expires_at ?? null,
    };
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      ...base,
      demoStartedAt: demoByUser.get(profile.id)?.demo_started_at ?? null,
      referral: referralByUser.get(profile.id) ?? null,
      createdAt: profile.created_at,
      plan: sub?.plan ?? null,
      subscriptionStatus: sub ? (sub.provider_status === "pending" && sub.status !== "pending" ? sub.status : sub.provider_status) : null,
      access: accessKind(base, now),
    };
  });
}

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UsersInput.parse(input ?? {}))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const all = await loadUserRows(supabaseAdmin);
    const term = data.search.toLowerCase();
    const filtered = all.filter((user) => {
      if (term && !(user.name ?? "").toLowerCase().includes(term) && !(user.email ?? "").toLowerCase().includes(term)) return false;
      if (data.access !== "all" && user.access !== data.access) return false;
      if (data.subscription === "none" && user.subscriptionStatus !== null) return false;
      if (data.subscription !== "all" && data.subscription !== "none" && user.subscriptionStatus !== data.subscription) return false;
      return true;
    });
    return paginate(filtered, data.page);
  });

// ---------- Assinaturas ----------

const SubscriptionsInput = z.object({
  search: z.string().trim().max(120).default(""),
  status: z.enum(["all", "active", "trial", "pending", "canceled", "expired", "refunded", "chargeback"]).default("all"),
  plan: z.enum(["all", "monthly", "quarterly", "annual"]).default("all"),
  page: z.number().int().min(1).default(1),
});

export const getAdminSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubscriptionsInput.parse(input ?? {}))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [subscriptionsResult, profilesResult] = await Promise.all([
      supabaseAdmin.from("subscriptions").select("id,user_id,email,plan,status,provider_status,cakto_transaction_id,started_at,expires_at,created_at,trial_started_at,trial_ends_at,recurring_amount").order("created_at", { ascending: false }).limit(1000),
      supabaseAdmin.from("profiles").select("id,name,email").limit(1000),
    ]);
    if (subscriptionsResult.error || profilesResult.error) throw new Error("Não foi possível carregar as assinaturas.");
    const owners = Object.fromEntries((profilesResult.data ?? []).map((p) => [p.id, { name: p.name, email: p.email }]));
    const term = data.search.toLowerCase();
    const filtered = (subscriptionsResult.data ?? []).filter((sub) => {
      if (data.status !== "all" && sub.status !== data.status) return false;
      if (data.plan !== "all" && sub.plan !== data.plan) return false;
      if (term && !sub.email.toLowerCase().includes(term) && !(owners[sub.user_id]?.name ?? "").toLowerCase().includes(term)) return false;
      return true;
    });
    const distribution = { monthly: 0, quarterly: 0, annual: 0 };
    for (const sub of subscriptionsResult.data ?? []) if (sub.plan in distribution) distribution[sub.plan as keyof typeof distribution]++;
    const page = paginate(filtered, data.page);
    return { ...page, distribution, rows: page.rows.map((sub) => ({ ...sub, owner: owners[sub.user_id] ?? null })) };
  });

// ---------- Financeiro (agregados dos registros dos usuários) ----------

export type AdminFinancial = {
  incomeTotal: number;
  incomeCount: number;
  expenseTotal: number;
  expenseCount: number;
  fuelTotal: number;
  fuelCount: number;
  motorcycleCount: number;
  userCount: number;
};

async function sumAmounts(
  supabaseAdmin: AdminClient,
  table: "incomes" | "expenses" | "fuel_records",
  column: "amount" | "total",
): Promise<{ total: number; count: number }> {
  let total = 0;
  let count = 0;
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabaseAdmin.from(table).select(column).range(offset, offset + 999);
    if (error) throw new Error("Não foi possível carregar os dados financeiros.");
    for (const row of data ?? []) {
      total += Number((row as Record<string, unknown>)[column]) || 0;
      count++;
    }
    if (!data || data.length < 1000) break;
  }
  return { total, count };
}

export const getAdminFinancial = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminFinancial> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [incomes, expenses, fuel, motorcyclesResult, profilesResult] = await Promise.all([
      sumAmounts(supabaseAdmin, "incomes", "amount"),
      sumAmounts(supabaseAdmin, "expenses", "amount"),
      sumAmounts(supabaseAdmin, "fuel_records", "total"),
      supabaseAdmin.from("motorcycles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    if (motorcyclesResult.error || profilesResult.error) throw new Error("Não foi possível carregar os dados financeiros.");
    return {
      incomeTotal: incomes.total,
      incomeCount: incomes.count,
      expenseTotal: expenses.total,
      expenseCount: expenses.count,
      fuelTotal: fuel.total,
      fuelCount: fuel.count,
      motorcycleCount: motorcyclesResult.count ?? 0,
      userCount: profilesResult.count ?? 0,
    };
  });

// ---------- Webhooks ----------

const WebhooksInput = z.object({
  search: z.string().trim().max(120).default(""),
  eventType: z.string().trim().max(80).default("all"),
  status: z.enum(["all", "processed", "attention"]).default("all"),
  page: z.number().int().min(1).default(1),
});

export const getAdminWebhooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WebhooksInput.parse(input ?? {}))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: events, error } = await supabaseAdmin
      .from("webhook_events")
      .select("id,event_id,event_type,transaction_id,processed,error_message,created_at,event_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error("Não foi possível carregar os eventos.");
    const all = events ?? [];
    const eventTypes = [...new Set(all.map((event) => event.event_type))].sort();
    const term = data.search.toLowerCase();
    const filtered = all.filter((event) => {
      if (data.eventType !== "all" && event.event_type !== data.eventType) return false;
      if (data.status === "processed" && !event.processed) return false;
      if (data.status === "attention" && !webhookNeedsAttention(event)) return false;
      if (term && !(event.transaction_id ?? "").toLowerCase().includes(term) && !event.event_id.toLowerCase().includes(term)) return false;
      return true;
    });
    return { ...paginate(filtered, data.page), eventTypes };
  });

const WebhookDetailInput = z.object({ id: z.string().uuid() });

export const getAdminWebhookDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WebhookDetailInput.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: event, error } = await supabaseAdmin
      .from("webhook_events")
      .select("id,event_id,event_type,transaction_id,processed,processed_at,error_message,created_at,event_at,payload")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !event) throw new Error("Evento não encontrado.");
    return event;
  });

// ---------- Ações administrativas existentes (inalteradas) ----------

const AmbassadorInput = z.object({ userId: z.string().uuid(), grant: z.boolean() });

export const setAmbassadorAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AmbassadorInput.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
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
    await requireAdmin(context);
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

const ReprocessInput = z.object({ eventId: z.string().uuid() });

/** P-04: admin-only retry of a pending Cakto purchase; the owner comes only from the stored buyer hash. */
export const reprocessCaktoEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReprocessInput.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("admin_reprocess_cakto_event", { _event_row_id: data.eventId });
    if (error) throw new Error("Não foi possível reprocessar o evento.");
    const value = result && typeof result === "object" && "result" in result ? String(result["result"]) : "unknown";
    return { result: value };
  });
