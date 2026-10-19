import { describe, expect, it } from "bun:test";
import { nextBrasiliaDayDelay } from "./points-access";

describe("agendamento do próximo dia em Brasília", () => {
  it("não usa a virada UTC como virada de Brasília", () => {
    expect(nextBrasiliaDayDelay(new Date("2026-10-20T00:00:00Z"))).toBe(10_801_000);
  });
  it("retoma um segundo após a meia-noite de Brasília", () => {
    expect(nextBrasiliaDayDelay(new Date("2026-10-20T02:59:59Z"))).toBe(2000);
  });
  it("na meia-noite agenda o próximo dia, sem loop imediato", () => {
    expect(nextBrasiliaDayDelay(new Date("2026-10-20T03:00:00Z"))).toBe(86_401_000);
  });
});