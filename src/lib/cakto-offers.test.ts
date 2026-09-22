import { describe, expect, test } from "bun:test";
import { hasDistinctWebhookOfferIds, resolveCaktoPlan, webhookOfferId } from "./cakto-offers";

const offers = {
  start: "9bnu895_1126693",
  pro: "wyjkmbe",
  elite: "39vyq8b",
};

describe("Cakto offer mapping", () => {
  test("uses the real Start offer id received by the webhook", () => {
    expect(webhookOfferId(offers.start)).toBe("9bnu895");
    expect(resolveCaktoPlan("9bnu895", offers)).toBe("monthly");
  });

  test("keeps Pro and Elite mapped by exact identifiers", () => {
    expect(resolveCaktoPlan("wyjkmbe", offers)).toBe("quarterly");
    expect(resolveCaktoPlan("39vyq8b", offers)).toBe("annual");
  });

  test("rejects unknown, missing, partial, and checkout identifiers", () => {
    expect(resolveCaktoPlan("unknown", offers)).toBeNull();
    expect(resolveCaktoPlan(null, offers)).toBeNull();
    expect(resolveCaktoPlan("9bnu", offers)).toBeNull();
    expect(resolveCaktoPlan("9bnu895_1126693", offers)).toBeNull();
  });

  test("detects conflicting normalized configuration", () => {
    expect(hasDistinctWebhookOfferIds(offers)).toBe(true);
    expect(hasDistinctWebhookOfferIds({ ...offers, pro: "9bnu895_other" })).toBe(false);
  });
});