import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { datasetContext } from "../scripts/lib/dataset-context.mjs";
const root = resolve(import.meta.dirname, "..");
const json = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));

test("データセットの入出力は自治体×テーマに閉じる", async () => {
  for (const args of [
    ["tachikawa", "care"],
    ["nerima", "care"],
  ]) {
    const context = await datasetContext(root, args);
    assert.equal(context.config.municipalityCode, args[0] === "nerima" ? "131203" : "132021");
    assert.equal(context.outputPath, `data/processed/${args[0]}/${args[1]}/dashboard.json`);
  }
  for (const args of [["tachikawa", "education"], ["../", "care"]]) {
    await assert.rejects(datasetContext(root, args), /Unsupported dataset/);
  }
});

test("ストーリーの指標参照がテーマ定義と実データに解決する", async () => {
  for (const storyPath of ["config/stories/tachikawa-care.json", "config/stories/nerima-care.json"]) {
    const story = await json(storyPath);
    const topic = await json(`config/topics/${story.topic}.json`);
    const place = await json(`config/municipalities/${story.municipality}.json`);
    const data = await json(`data/processed/${story.municipality}/${story.topic}/dashboard.json`);
    assert.equal(data.place.municipalityCode, place.municipalityCode);
    assert.equal(new Set(story.opening.map((s) => s.metricId)).size, story.opening.length);
    for (const step of story.opening) {
      assert.ok(topic.metrics[step.metricId]?.definition);
      assert.ok(topic.metrics[step.metricId]?.comparison);
      assert.ok(data.series[step.seriesKey]?.length >= 2);
    }
  }
});

test("練馬区の認定者は9月末基準を processed JSON に保持する", async () => {
  const data = await json("data/processed/nerima/care/dashboard.json");
  assert.match(data.provenance.certified.definition, /9月末/);
  assert.doesNotMatch(data.provenance.certified.definition, /年度末/);
});
