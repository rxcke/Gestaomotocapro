import { describe, expect, test } from "bun:test";
import { requiresConsent } from "./marketing-consent";

describe("regional marketing consent", () => {
  test("defaults unknown locations to opt-in before tracking", () => {
    expect(requiresConsent("XX")).toBe(true);
    expect(requiresConsent("")).toBe(true);
  });
  test("requires a choice in Brazil, EEA, UK and Switzerland", () => {
    for (const region of ["BR", "DE", "PT", "NO", "GB", "CH"]) expect(requiresConsent(region)).toBe(true);
  });
  test("allows non-opt-in locations without an explicit acceptance", () => {
    expect(requiresConsent("US")).toBe(false);
  });
});