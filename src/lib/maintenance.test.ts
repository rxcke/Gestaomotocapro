import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalizeMaintenanceInput } from "./maintenance";

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
});