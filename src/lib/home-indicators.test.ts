import { test } from "node:test";
import assert from "node:assert/strict";
import { financeSummary, variation } from "./calc";
import type { Expense, Income } from "./types";

const inc = (date: string, amount: number, extra: Partial<Income> = {}) =>
  ({ id: `${date}-${amount}`, user_id: "u1", motorcycle_id: "m1", work_session_id: null, category: "Entrega", amount, date, time: null, description: null, created_at: date, ...extra }) as Income;
const exp = (date: string, amount: number, extra: Partial<Expense> = {}) =>
  ({ id: `${date}-${amount}`, user_id: "u1", motorcycle_id: "m1", work_session_id: null, fuel_record_id: null, maintenance_record_id: null, category: "Combustível", group_name: "Moto", amount, date, description: null, created_at: date, ...extra }) as Expense;

const oct = { start: "2026-10-01", end: "2026-10-31" };
const sep = { start: "2026-09-01", end: "2026-09-30" };
const today = { start: "2026-10-13", end: "2026-10-13" };

// Mirrors the audited account: Oct 143/86, today 93/21, Sep 641/225.
const incomes = [inc("2026-10-08", 50), inc("2026-10-13", 50, { motorcycle_id: null }), inc("2026-10-13", 43, { work_session_id: "s1" }),
  ...[15, 8, 8, 50, 50, 10].map((a) => inc("2026-09-22", a)), inc("2026-09-30", 500)];
const expenses = [exp("2026-10-08", 15, { maintenance_record_id: "mt" }), exp("2026-10-08", 50, { fuel_record_id: "f" }), exp("2026-10-13", 21),
  ...[25, 50, 25, 50, 5, 50, 5, 15].map((a) => exp("2026-09-24", a))];

test("month: faturados, gastos and resultado", () => {
  const m = financeSummary(incomes, expenses, oct);
  assert.equal(m.totalIncome, 143);
  assert.equal(m.totalExpense, 86);
  assert.equal(m.net, 57);
});

test("today uses only today's entries (72 differs from month legitimately)", () => {
  assert.equal(financeSummary(incomes, expenses, today).net, 72);
});

test("day without movement is zero", () => {
  const d = financeSummary(incomes, expenses, { start: "2026-10-10", end: "2026-10-10" });
  assert.deepEqual([d.totalIncome, d.totalExpense, d.net], [0, 0, 0]);
});

test("variation compares current month to full previous month: -86%", () => {
  const prev = financeSummary(incomes, expenses, sep).net;
  assert.equal(prev, 416);
  assert.equal(Math.round(variation(57, prev)!), -86);
});

test("previous month zero gives no variation; negative base uses absolute value", () => {
  assert.equal(variation(57, 0), null);
  assert.equal(variation(-50, -100), 50);
});

test("month without incomes or without expenses", () => {
  assert.equal(financeSummary([], expenses, oct).net, -86);
  assert.equal(financeSummary(incomes, [], oct).net, 143);
});

test("month boundary: Sep 30 does not leak into October", () => {
  assert.equal(financeSummary([inc("2026-09-30", 500)], [], oct).totalIncome, 0);
});

test("fuel and maintenance linked expenses count once", () => {
  const m = financeSummary([], expenses.filter((e) => e.date === "2026-10-08"), oct);
  assert.equal(m.totalExpense, 65);
});
