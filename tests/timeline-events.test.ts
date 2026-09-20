import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  filterTimelineEvents,
  resolveChartEvents,
  validateTimelineEventCatalog,
} from "../src/lib/timeline-events-core.ts";

const root = resolve(import.meta.dirname, "..");
const json = async (path: string) => JSON.parse(await readFile(resolve(root, path), "utf8"));

test("介護イベント catalog が chart binding を解決する", async () => {
  const catalog = await json("config/events/tachikawa-care.json");
  validateTimelineEventCatalog(catalog);

  const opening = resolveChartEvents({
    catalog,
    chartId: "opening",
    chartYears: [2019, 2020, 2021, 2022, 2023],
  });
  assert.equal(opening.length, 2);
  assert.deepEqual(
    opening.map((event) => event.id),
    ["covid-19-2020", "care-plan-period-2021"],
  );
});

test("教育イベントは chart 年度に一致するものだけ返す", async () => {
  const catalog = await json("config/events/tachikawa-education.json");
  validateTimelineEventCatalog(catalog);

  const classes = resolveChartEvents({
    catalog,
    chartId: "act-classes",
    chartYears: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
  });
  assert.deepEqual(
    classes.map((event) => event.id),
    ["special-needs-education-2018", "covid-19-school-2020"],
  );

  const opening = resolveChartEvents({
    catalog,
    chartId: "opening",
    chartYears: [2019, 2020, 2021, 2022, 2023],
  });
  assert.deepEqual(opening.map((event) => event.id), ["covid-19-school-2020"]);
});

test("初期表示では自治体イベントのみ、トグルで policy / societal を表示できる", () => {
  const events = [
    {
      id: "local",
      year: 2020,
      scope: "municipality",
      category: "自治体",
      title: "例",
      description: "説明",
      source: { label: "出典", url: "https://example.com" },
    },
    {
      id: "policy",
      year: 2021,
      scope: "policy",
      category: "制度",
      title: "例2",
      description: "説明2",
      source: { label: "出典2", url: "https://example.org" },
    },
  ];

  assert.deepEqual(
    filterTimelineEvents(events, { municipality: true, policy: false, societal: false }).map(
      (event) => event.id,
    ),
    ["local"],
  );
  assert.equal(
    filterTimelineEvents(events, { municipality: true, policy: true, societal: false }).length,
    2,
  );
});

test("同じ chartId の binding を重複登録できない", () => {
  const catalog = {
    events: [],
    bindings: [
      { chartId: "opening", eventIds: [] },
      { chartId: "opening", eventIds: [] },
    ],
  };

  assert.throws(
    () => validateTimelineEventCatalog(catalog),
    /Duplicate timeline event chart binding: opening/,
  );
});

test("不正なscopeとbinding内のイベント重複を拒否する", () => {
  const baseEvent = {
    id: "event",
    year: 2020,
    scope: "municipality",
    category: "分類",
    title: "出来事",
    description: "説明",
    source: { label: "出典", url: "https://example.com" },
  };

  assert.throws(
    () => validateTimelineEventCatalog({ events: [{ ...baseEvent, scope: "other" }], bindings: [] }),
    /Unknown timeline event scope: event/,
  );
  assert.throws(
    () => validateTimelineEventCatalog({
      events: [baseEvent],
      bindings: [{ chartId: "opening", eventIds: ["event", "event"] }],
    }),
    /Duplicate timeline event in binding opening: event/,
  );
});
