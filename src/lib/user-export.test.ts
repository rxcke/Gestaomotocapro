import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
const expect = (a: unknown) => ({ toBe: (b: unknown) => assert.equal(a, b), toEqual: (b: unknown) => assert.deepEqual(a, b) });
import { buildCsv, crmWhatsapp, demoStatus, periodRange } from "./user-export";

describe("user export", () => {
  test("today uses Brazilian midnight", () => {
    // 01:21 UTC on Oct 9 is still Oct 8 in São Paulo
    expect(periodRange("today", new Date("2026-10-09T01:21:00Z"))).toEqual({ start: "2026-10-08T03:00:00.000Z", end: "2026-10-09T03:00:00.000Z" });
  });
  test("7 days covers today plus 6 previous days", () => {
    expect(periodRange("7d", new Date("2026-10-09T15:00:00Z"))?.start).toBe("2026-10-03T03:00:00.000Z");
  });
  test("custom period includes the whole end day", () => {
    expect(periodRange("custom", new Date(), "2026-10-01", "2026-10-02")).toEqual({ start: "2026-10-01T03:00:00.000Z", end: "2026-10-03T03:00:00.000Z" });
  });
  test("whatsapp never invents numbers", () => {
    expect(crmWhatsapp("(31) 99999-8888")).toBe("+5531999998888");
    expect(crmWhatsapp(null)).toBe("");
    expect(crmWhatsapp("99999-8888")).toBe("");
  });
  test("demo status", () => {
    const now = new Date("2026-10-09T00:00:00Z");
    expect(demoStatus("2026-10-10T00:00:00Z", now)).toBe("Ativa");
    expect(demoStatus("2026-10-08T00:00:00Z", now)).toBe("Expirada");
  });
  test("csv starts with BOM and keeps accents", () => {
    const csv = buildCsv([["joão@x.com", "João Ação", "", "", "", "", "", "", "", "", ""]]);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes('"João Ação"'));
  });
});
