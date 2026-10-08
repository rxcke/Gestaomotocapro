import { test } from "node:test";
import assert from "node:assert/strict";
import { filterByMotorcycle, ALL_ENTRIES, NO_MOTO } from "./money-filter";
import { financeSummary } from "./calc";
const rows = [{ id: "a", motorcycle_id: "m1" }, { id: "b", motorcycle_id: null }, { id: "c", motorcycle_id: "m2" }];
test("todas as motos inclui lançamentos sem moto", () => assert.deepEqual(filterByMotorcycle(rows, ALL_ENTRIES).map(r => r.id), ["a", "b", "c"]));
test("moto específica não recebe lançamentos sem moto", () => assert.deepEqual(filterByMotorcycle(rows, "m1").map(r => r.id), ["a"]));
test("sem moto mostra só lançamentos sem moto", () => assert.deepEqual(filterByMotorcycle(rows, NO_MOTO).map(r => r.id), ["b"]));
test("totais incluem lançamentos sem moto", () => {
  const d = new Date().toISOString().slice(0, 10);
  const r = financeSummary([{ amount: 100, date: d, motorcycle_id: null }, { amount: 50, date: d, motorcycle_id: "m1" }] as never, [{ amount: 30, date: d, motorcycle_id: null }] as never, { start: d, end: d });
  assert.equal(r.totalIncome, 150); assert.equal(r.totalExpense, 30); assert.equal(r.net, 120);
});
