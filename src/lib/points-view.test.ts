import { test } from "node:test";
import assert from "node:assert/strict";
import { rankingPage, weeklyBonusPercent } from "./points-view";

test("weekly five-day bonus progress displays three of five as 60 percent", () => {
  assert.equal(weeklyBonusPercent(3), 60);
});
test("five days complete the weekly bonus progress without exceeding 100 percent", () => {
  assert.equal(weeklyBonusPercent(5), 100);
  assert.equal(weeklyBonusPercent(7), 100);
});
test("invalid ranking pages cannot create negative or fractional offsets", () => {
  for (const value of [-1, 0, 1.5, "bad", Infinity]) assert.equal(rankingPage(value), 1);
  assert.equal(rankingPage("2"), 2);
});