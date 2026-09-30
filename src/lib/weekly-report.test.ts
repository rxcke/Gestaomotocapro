import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { weekPeriod, weeklyComparison, weeklyReport } from "./weekly-report";
import type { Expense, FuelRecord, Income, WorkSession } from "./types";

const income = (date: string, amount: number): Income => ({ id: crypto.randomUUID(), user_id: "owner", motorcycle_id: "m1", work_session_id: null, category: "Entrega", amount, date, time: null, description: null, created_at: date });
const expense = (date: string, amount: number, link: "fuel" | "maintenance" | "manual" = "manual"): Expense => ({ id: crypto.randomUUID(), user_id: "owner", motorcycle_id: "m1", work_session_id: null, fuel_record_id: link === "fuel" ? "f1" : null, maintenance_record_id: link === "maintenance" ? "t1" : null, category: "Moto", group_name: "Moto", amount, date, description: null, created_at: date });
const fuel = (date: string, total: number, km: number | null = null, motorcycle_id = "m1"): FuelRecord => ({ id: crypto.randomUUID(), user_id: "owner", motorcycle_id, work_session_id: null, date, total, km, liters: null, price_per_liter: null, station: null, description: null, created_at: date });
const session = (end: string | null, startKm: number | null = null, endKm: number | null = null): WorkSession => ({ id: crypto.randomUUID(), user_id: "owner", motorcycle_id: "m1", start_time: "2026-09-28T12:00:00Z", end_time: end, start_km: startKm, end_km: endKm, total_income: 0, total_expense: 0, net_profit: 0, created_at: "2026-09-28T12:00:00Z" });
const period = { start: "2026-09-28", end: "2026-10-04" };
const empty = () => ({ incomes: [] as Income[], expenses: [] as Expense[], fuel: [] as FuelRecord[], sessions: [] as WorkSession[] });

describe("resumo semanal", () => {
  test("semana local começa segunda e termina domingo, inclusive na virada do mês", () => {
    assert.deepEqual(weekPeriod(new Date(2026, 8, 30)), period);
    assert.deepEqual(weekPeriod(new Date(2026, 8, 30), -1), { start: "2026-09-21", end: "2026-09-27" });
  });
  test("sem dados e sem semana anterior", () => {
    const current = weeklyReport(empty(), period);
    assert.equal(current.profitPerHour, null);
    assert.equal(current.distance, null);
    assert.equal(weeklyComparison(current, current), null);
  });
  test("ganhos e gastos consideram apenas a semana", () => {
    const result = weeklyReport({ ...empty(), incomes: [income(period.start, 200), income("2026-09-27", 900)], expenses: [expense(period.end, 40), expense("2026-09-27", 80)] }, period);
    assert.deepEqual([result.income, result.expenses, result.profit], [200, 40, 160]);
  });
  test("combustível e manutenção não são somados duas vezes", () => {
    const result = weeklyReport({ ...empty(), incomes: [income(period.start, 200)], expenses: [expense(period.start, 40, "fuel"), expense(period.start, 20, "maintenance"), expense(period.start, 10)], fuel: [fuel(period.start, 40)] }, period);
    assert.deepEqual([result.expenses, result.profit, result.fuel], [70, 130, 40]);
  });
  test("somente jornadas encerradas entram nas horas e no KM comprovado", () => {
    const result = weeklyReport({ ...empty(), incomes: [income(period.start, 200)], sessions: [session("2026-09-28T14:00:00Z", 1000, 1040), session(null, 1040, null)] }, period);
    assert.deepEqual([result.hours, result.profitPerHour, result.distance], [2, 100, 40]);
  });
  test("KM de jornadas incompletas não é apresentado como total da semana", () => {
    const result = weeklyReport({ ...empty(), sessions: [session("2026-09-28T14:00:00Z", 1000, 1040), session("2026-09-28T15:00:00Z")] }, period);
    assert.equal(result.distance, null);
  });
  test("jornadas encerradas fora da semana não entram", () => {
    const result = weeklyReport({ ...empty(), sessions: [session("2026-09-27T14:00:00Z")] }, period);
    assert.equal(result.hours, 0);
  });
  test("odômetros de motos diferentes nunca formam um par", () => {
    const result = weeklyReport({ ...empty(), fuel: [fuel(period.start, 40, 1000, "m1"), fuel(period.end, 40, 3000, "m2")] }, period);
    assert.equal(result.distance, null);
  });
  test("pares de odômetros da mesma moto permitem estimativa sem jornada", () => {
    const result = weeklyReport({ ...empty(), fuel: [fuel("2026-09-27", 30, 1000), fuel(period.end, 40, 1100)] }, period);
    assert.equal(result.distance, 100);
  });
  test("comparação exige atividade anterior e denominador válido", () => {
    const previous = weeklyReport({ ...empty(), incomes: [income(period.start, 100)], sessions: [session("2026-09-28T14:00:00Z")] }, period);
    const current = weeklyReport({ ...empty(), incomes: [income(period.start, 120)], sessions: [session("2026-09-28T14:00:00Z")] }, period);
    assert.equal(weeklyComparison(current, previous)?.profit, 20);
    assert.equal(weeklyComparison(current, previous)?.profitPerHour, 20);
    const noHours = weeklyReport({ ...empty(), incomes: [income(period.start, 100)] }, period);
    assert.equal(weeklyComparison(current, noHours)?.hours, null);
    assert.equal(weeklyComparison(current, noHours)?.profitPerHour, null);
  });
  test("pausa não persistida não é subtraída como se fosse dado real", () => {
    const result = weeklyReport({ ...empty(), sessions: [session("2026-09-28T14:00:00Z")] }, period);
    assert.equal(result.hours, 2);
  });
});