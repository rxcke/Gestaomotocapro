import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { financeSummary, maintenanceStatus } from "./calc";
import { normalizeMaintenanceInput } from "./maintenance";
import type { Expense, MaintenanceRecord } from "./types";

const minimum = {
  category: "Óleo" as const,
  cost: 80,
  description: null,
  km: null,
  nextKm: null,
  nextDate: null,
  workshop: null,
};

describe("normalizeMaintenanceInput", () => {
  test("accepts only type and positive cost", () => {
    assert.equal(normalizeMaintenanceInput(minimum).success, true);
  });

  test("accepts current mileage", () => {
    assert.equal(normalizeMaintenanceInput({ ...minimum, km: 125430 }).success, true);
  });

  test("accepts a description", () => {
    assert.equal(normalizeMaintenanceInput({ ...minimum, description: "Troca de óleo" }).success, true);
  });

  test("accepts all optional details", () => {
    assert.equal(normalizeMaintenanceInput({
      ...minimum,
      description: "Troca de óleo e filtro",
      km: 125430,
      nextKm: 130430,
      nextDate: "2026-12-22",
      workshop: "Oficina Central",
    }).success, true);
  });

  test("rejects a missing cost", () => {
    assert.equal(normalizeMaintenanceInput({ ...minimum, cost: Number.NaN }).success, false);
  });

  test("rejects zero cost", () => {
    assert.equal(normalizeMaintenanceInput({ ...minimum, cost: 0 }).success, false);
  });

  test("rejects negative cost", () => {
    assert.equal(normalizeMaintenanceInput({ ...minimum, cost: -80 }).success, false);
  });

  test("allows optional details to be cleared during editing", () => {
    const edited = normalizeMaintenanceInput({ ...minimum, category: "Pneus", cost: 120 });
    assert.equal(edited.success, true);
    if (edited.success) assert.equal(edited.data.description, null);
  });

  test("keeps the history status safe without optional details", () => {
    const record: MaintenanceRecord = {
      id: "maintenance-1",
      user_id: "user-1",
      motorcycle_id: null,
      category: "Óleo",
      description: null,
      date: "2026-09-22",
      km: null,
      cost: 80,
      next_km: null,
      next_date: null,
      workshop: null,
      created_at: "2026-09-22T14:00:00Z",
    };
    assert.deepEqual(maintenanceStatus(record, 0), {
      status: "ok",
      label: "Sem previsão",
      kmLeft: null,
      daysLeft: null,
    });
  });

  test("counts the generated maintenance expense in financial totals", () => {
    const expense: Expense = {
      id: "expense-1",
      user_id: "user-1",
      motorcycle_id: null,
      work_session_id: null,
      category: "Manutenção",
      group_name: "Moto",
      amount: 80,
      date: "2026-09-22",
      description: "Óleo",
      created_at: "2026-09-22T14:00:00Z",
    };
    const summary = financeSummary([], [expense], { start: "2026-09-01", end: "2026-09-30" });
    assert.equal(summary.totalExpense, 80);
    assert.equal(summary.net, -80);
  });
});