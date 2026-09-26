import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { assertBenefitReconciliation } from "./lib/benefit-reconciliation.mjs";
import { datasetContext } from "./lib/dataset-context.mjs";

const root = resolve(import.meta.dirname, "..");
const dataset = await datasetContext(root, ["nerima", "care"]);
const municipality = dataset.config;

async function loadJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}

async function loadOptionalJson(relativePath) {
  try {
    return await loadJson(relativePath);
  } catch {
    return null;
  }
}

const stats = municipality.statsBook;
if (!stats?.curatedSeriesPath || !stats.expectedSha256) {
  throw new Error("nerima/care statsBook.curatedSeriesPath and expectedSha256 are required");
}

const curatedSeries = await loadJson(stats.curatedSeriesPath);
if (curatedSeries.source?.sha256 !== stats.expectedSha256) {
  throw new Error(
    `curated series sha256 ${curatedSeries.source?.sha256 ?? "(missing)"} != expectedSha256 ${stats.expectedSha256}`,
  );
}
if (curatedSeries.source?.redistribution !== "local-only") {
  throw new Error("nerima stats-book-series.json must declare redistribution: local-only");
}

const localPath = resolve(root, stats.localPath ?? `${dataset.rawPath}/${stats.file}`);
try {
  await access(localPath);
  console.log(`Note: local ${stats.file} is present but not required for build (redistribution: local-only).`);
} catch {
  // Expected in CI and most clones.
}

const parsed = curatedSeries.series;
if (!parsed?.insured?.length || !parsed?.certified?.length || !parsed?.benefits?.length) {
  throw new Error(`${stats.curatedSeriesPath}: series.insured/certified/benefits are required`);
}

const reconciliation = await loadOptionalJson(`${dataset.curatedPath}/benefit-reconciliation.json`);
if (!reconciliation) {
  throw new Error("benefit-reconciliation.json is required before publishing nerima/care");
}
assertBenefitReconciliation(reconciliation, parsed.benefits);

const statsHash = stats.expectedSha256;
const latestFiscalYear = Math.max(...parsed.insured.map((row) => row.year));

const data = {
  generatedAt: new Date().toISOString(),
  latestFiscalYear,
  sourcePage: municipality.sourcePage,
  place: {
    municipalityCode: municipality.municipalityCode,
    municipalityLabel: municipality.municipalityLabel ?? municipality.municipalityName,
    prefectureLabel: municipality.prefectureLabel,
    links: municipality.links ?? {},
  },
  series: {
    insured: parsed.insured,
    certified: parsed.certified,
    benefits: parsed.benefits.map(({ year, value }) => ({ year, value })),
  },
  provenance: {
    insured: {
      title: "介護保険第1号被保険者数（統計書 表110(1)）",
      sha256: statsHash,
      definition: "各年度末現在の第1号被保険者総数",
      unit: "人",
      note: "原典 XLSX は再配布不可のため Git 非管理。期待 SHA と加工済み系列は curated を正本とする。",
    },
    certified: {
      title: "要支援・要介護認定者数（統計書 表110(5)）",
      sha256: statsHash,
      definition: "各年9月末現在の認定者総数（第2号被保険者を含む）",
      unit: "人",
      note: "第1号被保険者数（各年度末）と基準日が異なります。認定率は算出しません。原典 XLSX は再配布不可のため Git 非管理。",
    },
    benefits: {
      title: "介護保険給付費（統計書 表110(7) 合算）",
      sha256: statsHash,
      definition: reconciliation.sumDefinition,
      unit: "円",
      note: `${reconciliation.note} ${reconciliation.auditScope.rationale} 監査: ${reconciliation.source}（${reconciliation.auditedAt}） 原典 XLSX は再配布不可のため Git 非管理。`,
    },
  },
  premiumStandard: {
    metricId: municipality.premiumStandard.metricId,
    sourceUrl: municipality.premiumStandard.sourceUrl,
    definition: municipality.premiumStandard.definition,
    periods: municipality.premiumStandard.periods,
  },
  reference: { prefecture: [] },
};

const serviceUnitCount = await loadOptionalJson(`${dataset.curatedPath}/service-unit-count.json`);
if (serviceUnitCount?.points?.length) {
  const validPoints = serviceUnitCount.points.filter((point) => point.value !== null && Number.isFinite(point.value));
  if (validPoints.length > 0) {
    data.series.serviceUnitCount = validPoints.map(({ year, value }) => ({ year, value }));
    data.provenance.serviceUnitCount = {
      title: serviceUnitCount.provenance?.title ?? serviceUnitCount.label,
      definition: serviceUnitCount.provenance?.definition ?? "",
      unit: serviceUnitCount.provenance?.unit ?? serviceUnitCount.unit,
      note: serviceUnitCount.provenance?.note,
    };
  }
}

const prefectureReference =
  (await loadOptionalJson(`${dataset.curatedPath}/tokyo-reference.json`)) ??
  (await loadOptionalJson("data/curated/tachikawa/care/tokyo-reference.json"));
const allowedReferenceIds = new Set([
  "care_worker_fte",
  "care_worker_headcount",
  "care_worker_scheduled_salary_tokyo",
  "care_worker_scheduled_salary",
]);
if (prefectureReference?.metrics?.length) {
  data.reference.prefecture = prefectureReference.metrics.filter((metric) => {
    if (!allowedReferenceIds.has(metric.metricId)) {
      throw new Error(`prefecture reference: unexpected metricId ${metric.metricId}`);
    }
    if (metric.referenceOnly !== true) {
      throw new Error(`prefecture reference: ${metric.metricId} must be referenceOnly=true`);
    }
    if (!metric.geography) {
      throw new Error(`prefecture reference: ${metric.metricId} must set geography`);
    }
    return metric.points?.some((point) => point.value !== null && Number.isFinite(point.value));
  });
}

const output = resolve(root, dataset.outputPath);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Wrote ${output}`);
