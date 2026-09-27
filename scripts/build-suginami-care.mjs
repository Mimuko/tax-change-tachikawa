import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { datasetContext } from "./lib/dataset-context.mjs";
import {
  parseCsv,
  parseSuginamiBenefits,
  parseSuginamiCertified,
  parseSuginamiInsured,
} from "./lib/parse-suginami-care-csv.mjs";

const root = resolve(import.meta.dirname, "..");
const dataset = await datasetContext(root, ["suginami", "care"]);
const municipality = dataset.config;

async function loadRaw(name) {
  const path = resolve(root, dataset.rawPath, name);
  const bytes = await readFile(path);
  const text = new TextDecoder("shift_jis").decode(bytes);
  return {
    rows: parseCsv(text),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

async function loadOptionalJson(relativePath) {
  try {
    return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
  } catch {
    return null;
  }
}

const insured = await loadRaw("insured.csv");
const certified = await loadRaw("certified.csv");
const benefits = await loadRaw("benefits.csv");

const insuredSeries = parseSuginamiInsured(insured.rows);
const certifiedSeries = parseSuginamiCertified(certified.rows);
const benefitsSeries = parseSuginamiBenefits(benefits.rows);

const latestFiscalYear = Math.max(...insuredSeries.map((row) => row.year));

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
    insured: insuredSeries,
    certified: certifiedSeries,
    benefits: benefitsSeries,
  },
  provenance: {
    insured: {
      title: "介護保険（被保険者加入状況 第1号被保険者）",
      sha256: insured.sha256,
      definition: "各年度末現在の第1号被保険者総数",
      unit: "人",
      note: "出典: 杉並区統計書 R7 9-9-1-1 CSV（CC BY 4.0）",
    },
    certified: {
      title: "介護保険（被保険者加入状況 要介護（要支援）認定者）",
      sha256: certified.sha256,
      definition: "各年度末現在の要支援・要介護認定者総数（第2号被保険者を含む）",
      unit: "人",
      note: "原典は最新年度のみ第1号/第2号内訳行あり。5年分の認定率は算出しない。",
    },
    benefits: {
      title: "介護保険（保険給付状況）",
      sha256: benefits.sha256,
      definition: "各年度の介護保険給付総数金額（区分合算）",
      unit: "円",
      note: "出典: 杉並区統計書 R7 9-9-4 CSV（CC BY 4.0）",
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
