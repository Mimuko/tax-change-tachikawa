import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseFuchuCareCsv } from "../scripts/lib/parse-fuchu-care.mjs";

const root = resolve(import.meta.dirname, "..");

test("府中市の原典 CSV と公開系列は直近5年度で一致する", async () => {
  const data = JSON.parse(await readFile(resolve(root, "data/processed/fuchu/care/dashboard.json"), "utf8"));
  for (const key of ["insured", "certified", "benefits"]) {
    const bytes = await readFile(resolve(root, `data/raw/fuchu/care/${key}.csv`));
    const parsed = parseFuchuCareCsv(bytes, key);
    assert.deepEqual(data.series[key], parsed.points);
    assert.equal(data.provenance[key].sha256, parsed.sha256);
    assert.deepEqual(parsed.points.map(({ year }) => year), [2021, 2022, 2023, 2024, 2025]);
  }
  assert.equal(data.place.municipalityCode, "132063");
  assert.equal(data.premiumStandard.periods[0].value, data.premiumStandard.periods[1].value);
  assert.equal(data.reference.prefecture.every((metric) => metric.referenceOnly && metric.geography === "tokyo"), true);
  assert.deepEqual(data.series.serviceUnitCount.map(({ year }) => year), [2020, 2021, 2022, 2023, 2024]);
});

test("府中市 CSV の列変更と内訳不整合を拒否する", async () => {
  const bytes = await readFile(resolve(root, "data/raw/fuchu/care/benefits.csv"));
  const headerChanged = Buffer.from(bytes);
  headerChanged[0] = 0x41;
  assert.throws(() => parseFuchuCareCsv(headerChanged, "benefits"), /header changed/);
  const changed = Buffer.from(bytes.toString("binary").replace("16318156194", "16318156195"), "binary");
  assert.throws(() => parseFuchuCareCsv(changed, "benefits"), /components mismatch/);
});
