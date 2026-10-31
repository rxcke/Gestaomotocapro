/** Display helpers for the admin modules; the server owns every number. */
export const ADMIN_PAGE_SIZE = 20;

export function adminPage(value: unknown): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function adminSearch(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

export type OverviewPeriod = "7d" | "30d" | "all";

export function overviewPeriod(value: unknown): OverviewPeriod {
  return value === "7d" || value === "30d" ? value : "all";
}

export function overviewPeriodStart(period: OverviewPeriod, now: Date): Date | null {
  if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

export function planLabel(plan: string): string {
  return (
    ({ monthly: "Start · Mensal", quarterly: "Pro · Trimestral", annual: "Elite · Anual" }) as Record<string, string>
  )[plan] ?? plan;
}

export function subscriptionStatusLabel(status: string): string {
  return (
    ({
      pending: "Pendente",
      trial: "Trial",
      active: "Ativa",
      canceled: "Cancelada",
      expired: "Expirada",
      refunded: "Reembolsada",
      chargeback: "Chargeback",
      paused: "Pausada",
      late: "Inadimplente",
    }) as Record<string, string>
  )[status] ?? "Pendente";
}

export type AdminAccessKind = "admin" | "ambassador" | "subscriber" | "demo" | "demo_expired" | "none";

export function accessKind(
  user: { admin: boolean; ambassador: boolean; subscribed: boolean; demo: boolean; demoExpiresAt: string | null },
  now: number,
): AdminAccessKind {
  if (user.admin) return "admin";
  if (user.ambassador) return "ambassador";
  if (user.subscribed) return "subscriber";
  if (user.demo && user.demoExpiresAt)
    return new Date(user.demoExpiresAt).getTime() > now ? "demo" : "demo_expired";
  return "none";
}

export function accessLabel(kind: AdminAccessKind): string {
  return (
    ({
      admin: "Admin",
      ambassador: "Embaixador",
      subscriber: "Assinante",
      demo: "Demonstração",
      demo_expired: "Demonstração expirada",
      none: "Sem assinatura ativa",
    }) as Record<AdminAccessKind, string>
  )[kind];
}

export function adminAccessFilter(value: unknown): "all" | AdminAccessKind {
  return value === "admin" || value === "ambassador" || value === "subscriber" || value === "demo" || value === "demo_expired" || value === "none"
    ? value
    : "all";
}

export function adminSubscriptionFilter(value: unknown): string {
  return typeof value === "string" && ["active", "trial", "pending", "canceled", "expired", "refunded", "chargeback", "none"].includes(value)
    ? value
    : "all";
}

export function adminPlanFilter(value: unknown): string {
  return typeof value === "string" && ["monthly", "quarterly", "annual"].includes(value) ? value : "all";
}

export function webhookNeedsAttention(event: { processed: boolean; error_message: string | null }): boolean {
  return !event.processed || event.error_message !== null;
}

export function adminWebhookStatusFilter(value: unknown): "all" | "processed" | "attention" {
  return value === "processed" || value === "attention" ? value : "all";
}
