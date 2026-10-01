import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { requiresConsent } from "./marketing-consent";

describe("regional marketing consent", () => {
  test("defaults unknown locations to opt-in before tracking", () => {
    assert.equal(requiresConsent("XX"), true);
    assert.equal(requiresConsent(""), true);
  });
  test("requires a choice in Brazil, EEA, UK and Switzerland", () => {
    for (const region of ["BR", "DE", "PT", "NO", "GB", "CH"]) assert.equal(requiresConsent(region), true);
  });
  test("allows non-opt-in locations without an explicit acceptance", () => {
    assert.equal(requiresConsent("US"), false);
  });
});