import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync("data/processed/tachikawa/childcare/dashboard.json", "utf8"));

test("子育て PoC は同じ5年を比較し原本を照合できる", () => {
  assert.equal(data.place.municipalityCode, "132021");
  for (const [key, file] of Object.entries({
    capacity: "nurseries.csv", enrolled: "nurseries.csv", staff: "nurseries.csv", consultations: "consultations.csv",
  })) {
    assert.deepEqual(data.series[key].map(({ year }) => year), [2019, 2020, 2021, 2022, 2023]);
    assert.ok(data.series[key].every(({ value }) => Number.isFinite(value)));
    const sha = createHash("sha256").update(readFileSync(`data/raw/tachikawa/childcare/${file}`)).digest("hex");
    assert.equal(data.provenance[key].sha256, sha);
    assert.ok(data.provenance[key].sourceUrl.startsWith("https://www.city.tachikawa.lg.jp/"));
  }
  assert.equal(data.series.capacity.at(-1).value, 3853);
  assert.equal(data.series.enrolled.at(-1).value, 3617);
  assert.equal(data.series.consultations.at(-1).value, 17302);
  assert.equal(data.gaps.find(({ id }) => id === "childcare_waitlist")?.kind, "unavailable_for_comparison");
  assert.equal(data.gaps.find(({ id }) => id === "childcare_support_reach_rate")?.kind, "not_measurable");
});
