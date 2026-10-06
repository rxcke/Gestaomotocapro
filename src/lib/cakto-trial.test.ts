import { test } from "node:test";
import assert from "node:assert/strict";
import { readCaktoSubscriptionFacts, trialDaysLeft } from "./cakto-trial";

test("trial only when Cakto reports subscription.status = trial", () => {
  const facts = readCaktoSubscriptionFacts({ status: "trial", next_payment_date: "2026-10-13T12:00:00Z", amount: "29.90" });
  assert.equal(facts.isTrial, true);
  assert.equal(facts.trialEndsAt, "2026-10-13T12:00:00.000Z");
  assert.equal(facts.amount, 29.9);
});

test("active subscription is not a trial", () => {
  const facts = readCaktoSubscriptionFacts({ status: "active", next_payment_date: "2026-11-06T12:00:00Z" });
  assert.equal(facts.isTrial, false);
  assert.equal(facts.trialEndsAt, null);
});

test("missing subscription never creates a trial", () => {
  assert.equal(readCaktoSubscriptionFacts(null).isTrial, false);
});

test("7 trial days counted from Cakto createdAt when next_payment_date is absent", () => {
  const facts = readCaktoSubscriptionFacts({ status: "trial", trial_days: 7, createdAt: "2026-10-06T10:00:00Z" });
  assert.equal(facts.trialEndsAt, "2026-10-13T10:00:00.000Z");
});

test("days left is null after the trial end", () => {
  const now = new Date("2026-10-08T10:00:00Z");
  assert.equal(trialDaysLeft("2026-10-13T10:00:00Z", now), 5);
  assert.equal(trialDaysLeft("2026-10-07T10:00:00Z", now), null);
});
