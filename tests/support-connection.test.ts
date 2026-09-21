import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function loadDashboard(relativePath: string) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

test("support-connection: 介護の本人選択と明確な障壁を混同しない", () => {
  const data = loadDashboard("../data/processed/tachikawa/care/dashboard.json");
  const indicators = data.supportConnection.indicators;
  const ids = indicators.map((indicator: { metricId: string }) => indicator.metricId);

  assert.deepEqual(ids.slice(0, 3), [
    "care_service_cost_barrier_nonuser_pct",
    "care_service_unavailable_nonuser_pct",
    "care_service_navigation_barrier_nonuser_pct",
  ]);
  assert.equal(ids.includes("care_service_nonuser_pct"), false);
  assert.equal(
    indicators.some((indicator: { label: string }) => indicator.label.includes("本人にサービス利用の希望がない")),
    false,
  );
  assert.equal(
    indicators.every((indicator: { multipleResponse?: boolean }) => indicator.multipleResponse === true),
    true,
  );
});

test("support-connection: supportNetwork は dimension と分離する", () => {
  const data = loadDashboard("../data/processed/tachikawa/care/dashboard.json");
  const noListener = data.supportConnection.indicators.find(
    (indicator: { metricId: string }) => indicator.metricId === "older_adult_no_listener_pct",
  );

  assert.equal(noListener.dimension, "consultation");
  assert.equal(noListener.supportNetwork, "none");
});

test("support-connection: 教育相談件数から接続率を作らない", () => {
  const data = loadDashboard("../data/processed/tachikawa/education/dashboard.json");
  const indicator = data.supportConnection.indicators[0];
  const latestSeries = data.series.educationConsultationCases.at(-1);
  const latestReach = indicator.observations.at(-1);

  assert.equal(indicator.metricId, "education_consultation_cases");
  assert.deepEqual(
    { year: latestReach.year, value: latestReach.value },
    latestSeries,
  );
  assert.equal(indicator.observations.some((observation: object) => "denominator" in observation), false);
  assert.equal(data.supportConnection.gaps[0].kind, "not_measurable");
});

test("support-connection: Outcome フィールドを持たない", () => {
  for (const path of [
    "../data/processed/tachikawa/care/dashboard.json",
    "../data/processed/tachikawa/education/dashboard.json",
  ]) {
    const data = loadDashboard(path);
    const serialized = JSON.stringify(data.supportConnection);
    assert.equal(/outcome|improvement|satisfaction/i.test(serialized), false);
  }
});
