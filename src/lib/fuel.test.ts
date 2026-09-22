import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { fuelStats } from "./calc";
import { normalizeFuelMeasurements } from "./fuel";
import type { FuelRecord } from "./types";

const measurements = (liters: number | null, pricePerLiter: number | null, km: number | null) =>
  normalizeFuelMeasurements({ total: 80, liters, pricePerLiter, km });

describe("registro simplificado de abastecimento", () => {
  test("aceita somente o valor total sem inventar detalhes", () => {
    assert.deepEqual(measurements(null, null, null), { total: 80, liters: null, pricePerLiter: null, km: null });
  });

  test("aceita litros e calcula o preço derivado", () => {
    assert.deepEqual(measurements(10, null, null), { total: 80, liters: 10, pricePerLiter: 8, km: null });
  });

  test("aceita litros e preço sem quilometragem", () => {
    assert.deepEqual(measurements(10, 8, null), { total: 80, liters: 10, pricePerLiter: 8, km: null });
  });

  test("aceita todos os detalhes", () => {
    assert.deepEqual(measurements(10, 8, 125430), { total: 80, liters: 10, pricePerLiter: 8, km: 125430 });
  });

  test("rejeita valor total vazio", () => {
    assert.equal(normalizeFuelMeasurements({ total: null, liters: null, pricePerLiter: null, km: null }), null);
  });

  test("permite limpar todos os detalhes na edição", () => {
    assert.deepEqual(measurements(null, null, null), { total: 80, liters: null, pricePerLiter: null, km: null });
  });

  test("ignora registros incompletos nas métricas sem perder o valor total", () => {
    const records = [
      { id: "1", user_id: "u", motorcycle_id: "m", date: "2026-09-20", km: null, liters: null, price_per_liter: null, total: 80, station: null, description: null, created_at: "2026-09-20" },
      { id: "2", user_id: "u", motorcycle_id: "m", date: "2026-09-21", km: 1000, liters: 10, price_per_liter: 8, total: 80, station: null, description: null, created_at: "2026-09-21" },
      { id: "3", user_id: "u", motorcycle_id: "m", date: "2026-09-22", km: 1300, liters: 10, price_per_liter: 8, total: 80, station: null, description: null, created_at: "2026-09-22" },
    ] satisfies FuelRecord[];

    assert.deepEqual(fuelStats(records), {
      distance: 300,
      liters: 10,
      cost: 80,
      avgKmL: 30,
      fuelCostPerKm: 80 / 300,
      history: [{ from: 1000, to: 1300, distance: 300, liters: 10, kmL: 30 }],
    });
  });
});