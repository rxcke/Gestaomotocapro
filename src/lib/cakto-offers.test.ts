import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { hasDistinctWebhookOfferIds, resolveCaktoPlan, webhookOfferId } from "./cakto-offers";

const offers = {
  start: "9bnu895_1126693",
  pro: "wyjkmbe",
  elite: "39vyq8b",
};

describe("Cakto offer mapping", () => {
  test("uses the real Start offer id received by the webhook", () => {
    assert.equal(webhookOfferId(offers.start), "9bnu895");
    assert.equal(resolveCaktoPlan("9bnu895", offers), "monthly");
  });

  test("keeps Pro and Elite mapped by exact identifiers", () => {
    assert.equal(resolveCaktoPlan("wyjkmbe", offers), "quarterly");
    assert.equal(resolveCaktoPlan("39vyq8b", offers), "annual");
  });

  test("rejects unknown, missing, partial, and checkout identifiers", () => {
    assert.equal(resolveCaktoPlan("unknown", offers), null);
    assert.equal(resolveCaktoPlan(null, offers), null);
    assert.equal(resolveCaktoPlan("9bnu", offers), null);
    assert.equal(resolveCaktoPlan("9bnu895_1126693", offers), null);
  });

  test("detects conflicting normalized configuration", () => {
    assert.equal(hasDistinctWebhookOfferIds(offers), true);
    assert.equal(hasDistinctWebhookOfferIds({ ...offers, pro: "9bnu895_other" }), false);
  });
});