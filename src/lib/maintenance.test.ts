import { describe, expect, test } from "bun:test";
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
    expect(normalizeMaintenanceInput(minimum).success).toBe(true);
  });

  test("accepts current mileage", () => {
    expect(normalizeMaintenanceInput({ ...minimum, km: 125430 }).success).toBe(true);
  });

  test("accepts a description", () => {
    expect(normalizeMaintenanceInput({ ...minimum, description: "Troca de óleo" }).success).toBe(true);
  });

  test("accepts all optional details", () => {
    expect(normalizeMaintenanceInput({
      ...minimum,
      description: "Troca de óleo e filtro",
      km: 125430,
      nextKm: 130430,
      nextDate: "2026-12-22",
      workshop: "Oficina Central",
    }).success).toBe(true);
  });

  test("rejects a missing cost", () => {
    expect(normalizeMaintenanceInput({ ...minimum, cost: Number.NaN }).success).toBe(false);
  });

  test("rejects zero cost", () => {
    expect(normalizeMaintenanceInput({ ...minimum, cost: 0 }).success).toBe(false);
  });

  test("rejects negative cost", () => {
    expect(normalizeMaintenanceInput({ ...minimum, cost: -80 }).success).toBe(false);
  });

  test("allows optional details to be cleared during editing", () => {
    const edited = normalizeMaintenanceInput({ ...minimum, category: "Pneus", cost: 120 });
    expect(edited.success).toBe(true);
    if (edited.success) expect(edited.data.description).toBeNull();
  });
});