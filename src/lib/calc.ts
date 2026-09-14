import { MOTO_EXPENSE_GROUP, KM_ALERT_THRESHOLD, DAYS_ALERT_THRESHOLD } from "./constants";
import type { Expense, FuelRecord, Income, MaintenanceRecord, Motorcycle } from "./types";

export const sum = (values: number[]) => values.reduce((a, b) => a + Number(b || 0), 0);

export const sumAmount = (rows: { amount: number }[]) => sum(rows.map((r) => Number(r.amount)));

export type Period = { start: string; end: string };

export function monthPeriod(offset = 0): Period {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { start: iso(start), end: iso(end) };
}

export function daysAgoPeriod(days: number): Period {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);
  return { start: iso(start), end: iso(now) };
}

export function iso(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function inPeriod<T extends { date: string }>(rows: T[], p: Period) {
  return rows.filter((r) => r.date >= p.start && r.date <= p.end);
}

export function daysBetween(a: string, b: string) {
  const d1 = new Date(`${a}T12:00:00`).getTime();
  const d2 = new Date(`${b}T12:00:00`).getTime();
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
}

export function daysUntil(date: string) {
  const target = new Date(`${date}T12:00:00`).getTime();
  return Math.ceil((target - Date.now()) / 86400000);
}

/** Consumo médio (km/L) a partir de abastecimentos sucessivos do mesmo veículo. */
export function fuelStats(records: FuelRecord[]) {
  const sorted = [...records].sort((a, b) => Number(a.km) - Number(b.km));
  let distance = 0;
  let liters = 0;
  let cost = 0;
  const history: { from: number; to: number; distance: number; liters: number; kmL: number }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (!prev || !cur) continue;
    const d = Number(cur.km) - Number(prev.km);
    const l = Number(cur.liters);
    if (d > 0 && l > 0) {
      distance += d;
      liters += l;
      cost += Number(cur.total);
      history.push({ from: Number(prev.km), to: Number(cur.km), distance: d, liters: l, kmL: d / l });
    }
  }


  return {
    distance,
    liters,
    cost,
    avgKmL: liters > 0 ? distance / liters : 0,
    fuelCostPerKm: distance > 0 ? cost / distance : 0,
    history: history.reverse(),
  };
}

/** Distância percorrida no período, estimada pelos abastecimentos. */
export function distanceInPeriod(records: FuelRecord[], p: Period) {
  const sorted = [...records].sort((a, b) => Number(a.km) - Number(b.km));
  const inside = sorted.filter((r) => r.date >= p.start && r.date <= p.end);
  if (inside.length === 0) return 0;
  const first = inside[0];
  const last = inside[inside.length - 1];
  if (!first || !last) return 0;
  const before = sorted.filter((r) => Number(r.km) < Number(first.km)).pop();
  const startKm = before ? Number(before.km) : Number(first.km);
  return Math.max(0, Number(last.km) - startKm);

}

export function motoExpenses(expenses: Expense[]) {
  return expenses.filter((e) => e.group_name === MOTO_EXPENSE_GROUP);
}

export function financeSummary(incomes: Income[], expenses: Expense[], p: Period) {
  const i = inPeriod(incomes, p);
  const e = inPeriod(expenses, p);
  const totalIncome = sumAmount(i);
  const totalExpense = sumAmount(e);
  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    incomes: i,
    expenses: e,
  };
}

export type MaintenanceStatus = "ok" | "soon" | "late";

export function maintenanceStatus(
  record: MaintenanceRecord,
  currentKm: number,
): { status: MaintenanceStatus; label: string; kmLeft: number | null; daysLeft: number | null } {
  const kmLeft = record.next_km != null ? Number(record.next_km) - currentKm : null;
  const daysLeft = record.next_date ? daysUntil(record.next_date) : null;

  let status: MaintenanceStatus = "ok";
  if ((kmLeft != null && kmLeft <= 0) || (daysLeft != null && daysLeft < 0)) status = "late";
  else if (
    (kmLeft != null && kmLeft <= KM_ALERT_THRESHOLD) ||
    (daysLeft != null && daysLeft <= DAYS_ALERT_THRESHOLD)
  )
    status = "soon";

  const parts: string[] = [];
  if (kmLeft != null) parts.push(kmLeft > 0 ? `Faltam ${Math.round(kmLeft)} km` : `${Math.abs(Math.round(kmLeft))} km atrasada`);
  if (daysLeft != null) parts.push(daysLeft >= 0 ? `vence em ${daysLeft} dias` : `venceu há ${Math.abs(daysLeft)} dias`);

  return { status, label: parts.join(" · ") || "Sem previsão", kmLeft, daysLeft };
}

export function upcomingMaintenance(records: MaintenanceRecord[], currentKm: number) {
  return records
    .filter((r) => r.next_km != null || r.next_date != null)
    .map((r) => ({ record: r, ...maintenanceStatus(r, currentKm) }))
    .filter((r) => r.status !== "ok" || (r.kmLeft ?? Infinity) > 0 || (r.daysLeft ?? Infinity) > 0)
    .sort((a, b) => {
      const ak = a.kmLeft ?? (a.daysLeft ?? 9999) * 30;
      const bk = b.kmLeft ?? (b.daysLeft ?? 9999) * 30;
      return ak - bk;
    });
}

export function costPerKm(expenses: Expense[], distance: number) {
  if (distance <= 0) return 0;
  return sumAmount(motoExpenses(expenses)) / distance;
}

export function activeMotoKm(moto: Motorcycle | null | undefined, fuel: FuelRecord[]) {
  const maxFuelKm = fuel.length ? Math.max(...fuel.map((f) => Number(f.km))) : 0;
  return Math.max(Number(moto?.current_km ?? 0), maxFuelKm);
}

export function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(999, (part / total) * 100);
}

export function variation(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
