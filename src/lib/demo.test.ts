import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { accessMode, demoExpiry, demoRemainingLabel } from "./demo";
const base = { active: false, admin: false, ambassador: false, demoActive: false, demoExpired: false };
describe("demonstração de 24 horas", () => {
  test("dura exatamente 24 horas corridas, sem usar meia-noite", () => {
    assert.equal(demoExpiry(new Date("2026-10-08T13:30:00Z")).toISOString(), "2026-10-09T13:30:00.000Z");
  });
  test("demonstração ativa e expirada não são assinatura", () => {
    assert.equal(accessMode({ ...base, demoActive: true }), "demo_active");
    assert.equal(accessMode({ ...base, demoExpired: true }), "demo_expired");
    assert.equal(accessMode({ ...base, active: true, demoActive: true }), "subscriber");
    assert.equal(accessMode(base), "blocked");
  });
  test("contador mostra horas restantes, aviso final e encerramento", () => {
    const exp = "2026-10-09T13:30:00Z"; const t = new Date(exp).getTime();
    assert.equal(demoRemainingLabel(exp, t - (18 * 60 + 42) * 60_000)?.text, "Você tem 18h 42min restantes");
    assert.equal(demoRemainingLabel(exp, t - 80 * 60_000)?.text, "Sua demonstração termina em 1h 20min.");
    assert.equal(demoRemainingLabel(exp, t)?.text, "DEMONSTRAÇÃO ENCERRADA");
  });
});
