import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertBenefitReconciliation } from "../scripts/lib/benefit-reconciliation.mjs";
import { datasetContext } from "../scripts/lib/dataset-context.mjs";
import { parseNerimaHyo08 } from "../scripts/lib/parse-nerima-hyo08.mjs";
import { verifyCareProvenanceShas } from "../scripts/lib/provenance-sha.mjs";
const root = resolve(import.meta.dirname, "..");
const json = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));

test("データセットの入出力は自治体×テーマに閉じる", async () => {
  for (const args of [
    ["tachikawa", "care"],
    ["nerima", "care"],
  ]) {
    const context = await datasetContext(root, args);
    assert.equal(context.config.municipalityCode, args[0] === "nerima" ? "131202" : "132021");
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

test("練馬区の最終収録年度は2024", async () => {
  const data = await json("data/processed/nerima/care/dashboard.json");
  assert.equal(data.latestFiscalYear, 2024);
});

test("練馬区給付費は構成要素監査記録と一致する", async () => {
  const reconciliation = await json("data/curated/nerima/care/benefit-reconciliation.json");
  const dataSources = await json("config/data-sources/nerima/care.json");
  const parsed = await parseNerimaHyo08(
    resolve(root, "data/raw/nerima/care", dataSources.statsBook.file),
    dataSources.statsBook.sheets,
  );
  const audited = assertBenefitReconciliation(reconciliation, parsed.benefits);
  const data = await json("data/processed/nerima/care/dashboard.json");
  assert.equal(audited.length, 5);
  assert.equal(reconciliation.auditScope.crossMunicipalityReconciliation, false);
  for (const expected of audited) {
    const actual = data.series.benefits.find((row) => row.year === expected.year);
    assert.equal(actual?.value, expected.valueYen, `benefits ${expected.year}`);
  }
});

test("練馬区給付費監査は年集合の過不足・重複・縮小を拒否する", () => {
  const meta = {
    source: "test",
    auditedAt: "2026-09-26",
    sumDefinition: "test sum",
    note: "test note",
  };
  const makeYear = (year) => ({
    year,
    componentsThousandYen: {
      homeServices: 1,
      facilityServices: 2,
      communityServices: 3,
      highCostServices: 4,
      reviewFee: 5,
      specificAdmission: 6,
    },
    handSumThousandYen: 21,
    valueYen: 21000,
  });
  const makeParsed = (year) => ({
    year,
    value: 21000,
    components: {
      homeServicesThousandYen: 1,
      facilityServicesThousandYen: 2,
      communityServicesThousandYen: 3,
      highCostServicesThousandYen: 4,
      reviewFeeThousandYen: 5,
      specificAdmissionThousandYen: 6,
    },
  });
  assert.throws(
    () =>
      assertBenefitReconciliation(
        {
          ...meta,
          auditScope: {
            yearsRequired: [2020, 2021, 2022, 2023],
            crossMunicipalityReconciliation: false,
            rationale: "test",
          },
          years: [2020, 2021, 2022, 2023, 2024].map(makeYear),
        },
        [2020, 2021, 2022, 2023, 2024].map(makeParsed),
      ),
    /yearsRequired must be exactly \[2020,2021,2022,2023,2024\]/,
  );
  assert.throws(
    () =>
      assertBenefitReconciliation(
        {
          ...meta,
          auditScope: {
            yearsRequired: [2020, 2021, 2022, 2023, 2024],
            crossMunicipalityReconciliation: false,
            rationale: "test",
          },
          years: [2020, 2021, 2022, 2023].map(makeYear),
        },
        [2020, 2021, 2022, 2023, 2024].map(makeParsed),
      ),
    /years must be exactly \[2020,2021,2022,2023,2024\]/,
  );
  assert.throws(
    () =>
      assertBenefitReconciliation(
        {
          ...meta,
          auditScope: {
            yearsRequired: [2020, 2021, 2022, 2023, 2024],
            crossMunicipalityReconciliation: false,
            rationale: "test",
          },
          years: [...[2020, 2021, 2022, 2023].map(makeYear), makeYear(2020)],
        },
        [2020, 2021, 2022, 2023, 2024].map(makeParsed),
      ),
    /duplicate years/,
  );
});

test("介護 processed の provenance SHA は raw 実バイトと一致する", async () => {
  const { ok, results } = await verifyCareProvenanceShas(root);
  for (const row of results) {
    assert.equal(row.actual, row.expected, `${row.dashboard}#${row.key}`);
  }
  assert.equal(ok, true);
});

test("練馬区は介護保険料収入を公開系列に含めない", async () => {
  const data = await json("data/processed/nerima/care/dashboard.json");
  assert.equal(data.series.premiumRevenue, undefined);
  assert.equal(data.provenance.premiumRevenue, undefined);
});
