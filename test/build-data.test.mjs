import test from "node:test";
import assert from "node:assert/strict";
import data from "../data/processed/dashboard.json" with { type: "json" };

test("各主要系列は連続した最新5年度を持つ", () => {
  for (const series of Object.values(data.series)) {
    assert.equal(series.length, 5);
    for (let i = 1; i < series.length; i++) assert.equal(series[i].year, series[i - 1].year + 1);
    assert.ok(series.every((point) => Number.isFinite(point.value)));
  }
});
