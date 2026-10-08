import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { accessMode, canDemoWrite, demoResult } from "./demo";
const none = { incomeUsed: false, expenseUsed: false, welcomed: true };
describe("demonstração", () => {
  test("permite somente 1 ganho e 1 gasto", () => {
    assert.equal(canDemoWrite("incomes", "insert", none), true);
    assert.equal(canDemoWrite("incomes", "insert", { ...none, incomeUsed: true }), false);
    assert.equal(canDemoWrite("expenses", "insert", { ...none, expenseUsed: true }), false);
  });
  test("bloqueia combustível, manutenção, edição e exclusão", () => {
    assert.equal(canDemoWrite("fuel_records", "insert", none), false);
    assert.equal(canDemoWrite("maintenance_records", "insert", none), false);
    assert.equal(canDemoWrite("incomes", "update", none), false);
    assert.equal(canDemoWrite("incomes", "delete", none), false);
  });
  test("demonstração não é assinatura", () => {
    assert.equal(accessMode({ active: false, trial: false, admin: false, ambassador: false, demo: true }), "demo");
    assert.equal(accessMode({ active: true, trial: false, admin: false, ambassador: false, demo: false }), "subscriber");
  });
  test("calcula 80 - 20 = 60", () => {
    assert.deepEqual(demoResult([{ amount: 80 }], [{ amount: 20 }]), { income: 80, expense: 20, profit: 60 });
  });
});
