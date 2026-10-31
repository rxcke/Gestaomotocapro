import { test } from "node:test";
import assert from "node:assert/strict";
import { monthlyBonusPercent, rankingPage, rankingPeriod, weeklyBonusPercent } from "./points-view";

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
test("monthly twenty-day bonus progress displays ten of twenty as 50 percent", () => {
  assert.equal(monthlyBonusPercent(10), 50);
});
test("twenty days complete the monthly bonus progress without exceeding 100 percent", () => {
  assert.equal(monthlyBonusPercent(20), 100);
  assert.equal(monthlyBonusPercent(25), 100);
});
test("unknown ranking periods fall back to the all-time classification", () => {
  assert.equal(rankingPeriod("week"), "week");
  assert.equal(rankingPeriod("month"), "month");
  for (const value of ["yearly", "", 1, null, undefined]) assert.equal(rankingPeriod(value), "all");
});