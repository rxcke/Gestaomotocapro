import { distanceInPeriod, financeSummary, inPeriod, sum, variation, type Period } from "./calc";
import type { Expense, FuelRecord, Income, WorkSession } from "./types";

/** Datas financeiras são DATEs locais; a semana começa na segunda-feira local. */
export function weekPeriod(reference = new Date(), offset = 0): Period {
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { start: localDate(start), end: localDate(end) };
}

type WeeklyRows = { incomes: Income[]; expenses: Expense[]; fuel: FuelRecord[]; sessions: WorkSession[] };

export function weeklyReport(rows: WeeklyRows, period: Period) {
  // expenses já contém o gasto automático de combustível e manutenção: nunca somar os custos da origem ao total novamente.
  const finances = financeSummary(rows.incomes, rows.expenses, period);
  const fuel = inPeriod(rows.fuel, period);
  const finished = rows.sessions.filter((session) => {
    if (!session.end_time) return false;
    const localEnd = new Date(session.end_time);
    if (Number.isNaN(localEnd.getTime())) return false;
    const date = `${localEnd.getFullYear()}-${String(localEnd.getMonth() + 1).padStart(2, "0")}-${String(localEnd.getDate()).padStart(2, "0")}`;
    return date >= period.start && date <= period.end;
  });
  // Pausas ainda são apenas estado local da tela de Jornada: não existe duração persistida para subtrair.
  const hours = sum(finished.map((session) => Math.max(0, new Date(session.end_time ?? session.start_time).getTime() - new Date(session.start_time).getTime()))) / 3600000;

  // Preferir distâncias medidas no começo e fim de jornadas encerradas. Sem elas, usar
  // pares de odômetros de abastecimento da mesma moto (nunca cruzar veículos distintos).
  const sessionDistances = finished.flatMap((s) => s.start_km != null && s.end_km != null && Number(s.end_km) > Number(s.start_km)
    ? [Number(s.end_km) - Number(s.start_km)] : []);
  const fuelByMoto = new Map<string, FuelRecord[]>();
  for (const record of rows.fuel) {
    if (!record.motorcycle_id) continue;
    fuelByMoto.set(record.motorcycle_id, [...(fuelByMoto.get(record.motorcycle_id) ?? []), record]);
  }
  const fuelDistances = [...fuelByMoto.values()].flatMap((records) => {
    const valid = records.filter((record) => record.km != null && Number.isFinite(Number(record.km)));
    const inside = valid.filter((record) => record.date >= period.start && record.date <= period.end);
    // Uma única leitura sem anterior não prova distância percorrida.
    if (inside.length < 2 && !inside.some((record) => valid.some((other) => other.date < record.date && Number(other.km) < Number(record.km)))) return [];
    return [distanceInPeriod(valid, period)];
  });
  const distance = finished.length > 0 && sessionDistances.length === finished.length
    ? sum(sessionDistances) : fuelDistances.length ? sum(fuelDistances) : null;

  return {
    income: finances.totalIncome,
    expenses: finances.totalExpense,
    profit: finances.net,
    hours,
    profitPerHour: hours > 0 ? finances.net / hours : null,
    distance,
    fuel: sum(fuel.map((record) => Number(record.total))),
    hasActivity: finances.incomes.length > 0 || finances.expenses.length > 0 || finished.length > 0,
  };
}

export function weeklyComparison(current: ReturnType<typeof weeklyReport>, previous: ReturnType<typeof weeklyReport>) {
  if (!previous.hasActivity) return null;
  return {
    income: variation(current.income, previous.income),
    expenses: variation(current.expenses, previous.expenses),
    profit: variation(current.profit, previous.profit),
    hours: variation(current.hours, previous.hours),
    profitPerHour: current.profitPerHour != null && previous.profitPerHour != null
      ? variation(current.profitPerHour, previous.profitPerHour) : null,
  };
}