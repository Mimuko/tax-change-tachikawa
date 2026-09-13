import test from "node:test";
import assert from "node:assert/strict";
import data from "../data/processed/dashboard.json" with { type: "json" };

const requiredSeries = ["insured", "certified", "benefits", "premiumRevenue"];

test("主要系列は連続した最新5年度を持つ", () => {
  for (const key of requiredSeries) {
    const series = data.series[key];
    assert.equal(series.length, 5);
    for (let i = 1; i < series.length; i++) assert.equal(series[i].year, series[i - 1].year + 1);
    assert.ok(series.every((point) => Number.isFinite(point.value)));
  }
});

test("premiumStandard の期データが含まれる", () => {
  assert.ok(data.premiumStandard);
  assert.ok(Array.isArray(data.premiumStandard.periods));
  assert.ok(data.premiumStandard.periods.length >= 1);
  assert.ok(data.premiumStandard.periods.every((period) => Number.isFinite(period.value)));
});

test("place と reference.prefecture が存在する", () => {
  assert.ok(data.place);
  assert.equal(data.place.municipalityLabel, "立川市");
  assert.equal(data.place.prefectureLabel, "東京都");
  assert.ok(Array.isArray(data.reference?.prefecture));
});

test("reference.prefecture の賃金系列は2020以降の円建て実値を持つ", () => {
  const salary = data.reference.prefecture.find(
    (metric) => metric.metricId === "care_worker_scheduled_salary_tokyo",
  );
  assert.ok(salary, "care_worker_scheduled_salary_tokyo が必要");
  assert.equal(salary.geography, "tokyo");
  assert.equal(salary.referenceOnly, true);
  assert.ok(salary.points.length >= 5);
  assert.ok(salary.points.some((point) => point.year === 2024 && point.value === 294200));
  for (const point of salary.points) {
    assert.ok(point.year >= 2020);
    assert.ok(Number.isFinite(point.value));
    assert.ok(point.value > 1000, "千円のままではなく円換算されている想定");
  }
});

test("serviceUnitCount は立川市の提供単位数時系列を持つ", () => {
  const series = data.series.serviceUnitCount;
  assert.ok(Array.isArray(series));
  assert.ok(series.length >= 2);
  assert.ok(series.every((point) => Number.isFinite(point.value) && point.value > 0));
});
