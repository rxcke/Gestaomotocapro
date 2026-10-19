import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextBrasiliaDayDelay } from "./points-access";

describe("agendamento do próximo dia em Brasília", () => {
  it("não usa a virada UTC como virada de Brasília", () => {
    assert.equal(nextBrasiliaDayDelay(new Date("2026-10-20T00:00:00Z")), 10_801_000);
  });
  it("retoma um segundo após a meia-noite de Brasília", () => {
    assert.equal(nextBrasiliaDayDelay(new Date("2026-10-20T02:59:59Z")), 2000);
  });
  it("na meia-noite agenda o próximo dia, sem loop imediato", () => {
    assert.equal(nextBrasiliaDayDelay(new Date("2026-10-20T03:00:00Z")), 86_401_000);
  });
});