import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { datasetContext } from "../scripts/lib/dataset-context.mjs";
const root = resolve(import.meta.dirname, "..");
const json = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));

test("データセットの入出力は自治体×テーマに閉じる", async () => {
  const context = await datasetContext(root, ["tachikawa", "care"]);
  assert.equal(context.config.municipalityCode, "132021");
  assert.equal(context.outputPath, "data/processed/tachikawa/care/dashboard.json");
  for (const args of [["nerima", "care"], ["tachikawa", "education"], ["../", "care"]]) {
    await assert.rejects(datasetContext(root, args), /Unsupported dataset/);
  }
});
test("ストーリーの指標参照がテーマ定義と実データに解決する", async () => {
  const story = await json("config/stories/tachikawa-care.json");
  const topic = await json(`config/topics/${story.topic}.json`);
  const place = await json(`config/municipalities/${story.municipality}.json`);
  const data = await json(`data/processed/${story.municipality}/${story.topic}/dashboard.json`);
  assert.equal(data.place.municipalityCode, place.municipalityCode);
  assert.equal(new Set(story.opening.map(s => s.metricId)).size, story.opening.length);
  for (const step of story.opening) {
    assert.ok(topic.metrics[step.metricId]?.definition);
    assert.ok(topic.metrics[step.metricId]?.comparison);
    assert.ok(data.series[step.seriesKey]?.length >= 2);
  }
});
