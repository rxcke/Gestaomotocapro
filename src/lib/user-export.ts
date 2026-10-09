// Pure helpers for the admin CRM export. Brazil (America/Sao_Paulo) has no DST since 2019: fixed UTC-3.
export const BR_OFFSET_HOURS = 3;

export type ExportPeriod = "all" | "today" | "7d" | "30d" | "custom";
export type SubscriptionFilter = "all" | "active" | "none";
export type DemoFilter = "all" | "active" | "expired" | "none";

/** Returns [startISO, endISO) in UTC for a Brazilian calendar period, or null for "all". */
export function periodRange(period: ExportPeriod, now: Date, from?: string, to?: string): { start: string; end: string } | null {
  if (period === "all") return null;
  const brNow = new Date(now.getTime() - BR_OFFSET_HOURS * 3_600_000);
  const todayStr = brNow.toISOString().slice(0, 10);
  const startOf = (day: string) => new Date(`${day}T00:00:00-03:00`);
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
  const tomorrow = addDays(startOf(todayStr), 1);
  if (period === "today") return { start: startOf(todayStr).toISOString(), end: tomorrow.toISOString() };
  if (period === "7d") return { start: addDays(tomorrow, -7).toISOString(), end: tomorrow.toISOString() };
  if (period === "30d") return { start: addDays(tomorrow, -30).toISOString(), end: tomorrow.toISOString() };
  if (!from || !to || from > to) throw new Error("Período personalizado inválido.");
  return { start: startOf(from).toISOString(), end: addDays(startOf(to), 1).toISOString() };
}

/** E.164 only when the stored number is a valid Brazilian mobile; never invents DDI/DDD. */
export function crmWhatsapp(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  const local = digits.length === 13 && digits.startsWith("55") ? digits.slice(2) : digits;
  return /^[1-9]{2}9\d{8}$/.test(local) ? `+55${local}` : "";
}

export function brDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - BR_OFFSET_HOURS * 3_600_000).toISOString();
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)} ${d.slice(11, 16)}`;
}

export function demoStatus(expiresAt: string | null | undefined, now: Date): "Ativa" | "Expirada" | "Sem demonstração" {
  if (!expiresAt) return "Sem demonstração";
  return new Date(expiresAt).getTime() > now.getTime() ? "Ativa" : "Expirada";
}

export const CSV_HEADERS = ["E-mail", "Nome completo", "WhatsApp", "Data de cadastro", "Origem do cadastro", "Código de indicação", "Plano atual", "Status da assinatura", "Status da demonstração", "Início da demonstração", "Término da demonstração"];

function cell(value: string): string {
  // Neutralize spreadsheet formulas and quote everything.
  const safe = /^[=+\-@\t\r]/.test(value) && !/^\+\d+$/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** UTF-8 BOM + semicolon-separated (Excel pt-BR friendly) CSV. */
export function buildCsv(rows: string[][]): string {
  return "\uFEFF" + [CSV_HEADERS, ...rows].map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}
