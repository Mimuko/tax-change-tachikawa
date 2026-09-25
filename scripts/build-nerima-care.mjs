import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { datasetContext } from "./lib/dataset-context.mjs";
import { parseNerimaHyo08 } from "./lib/parse-nerima-hyo08.mjs";

const root = resolve(import.meta.dirname, "..");
const dataset = await datasetContext(root, ["nerima", "care"]);
const municipality = dataset.config;

async function loadOptionalJson(relativePath) {
  try {
    return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
  } catch {
    return null;
  }
}

const statsPath = resolve(root, dataset.rawPath, municipality.statsBook.file);
const statsBytes = await readFile(statsPath);
const statsHash = createHash("sha256").update(statsBytes).digest("hex");
const parsed = await parseNerimaHyo08(statsPath, municipality.statsBook.sheets);

const data = {
  generatedAt: new Date().toISOString(),
  latestFiscalYear: Math.min(...parsed.insured.map((row) => row.year)),
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
    benefits: parsed.benefits,
    premiumRevenue: parsed.premiumRevenue,
  },
  provenance: {
    insured: {
      title: "介護保険第1号被保険者数（統計書 表110(1)）",
      sha256: statsHash,
      definition: "各年度末現在の第1号被保険者総数",
      unit: "人",
    },
    certified: {
      title: "要支援・要介護認定者数（統計書 表110(5)）",
      sha256: statsHash,
      definition: "各年9月末現在の認定者総数（第2号被保険者を含む）",
      unit: "人",
      note: "第1号被保険者数（各年度末）と基準日が異なります。認定率は算出しません。",
    },
    benefits: {
      title: "介護保険給付費（統計書 表110(7) 合算）",
      sha256: statsHash,
      definition:
        "居宅・施設・地域密着型・高額介護等サービス費等の区分合算。原典は千円単位（四捨五入）のため、円へ換算して保持",
      unit: "円",
      note: "区分合算のため、原典注記どおり合計と区分の端数が一致しない場合があります。",
    },
    premiumRevenue: {
      title: "介護保険料収入（統計書 表110(3) 収納額）",
      sha256: statsHash,
      definition: "各年度の収入済額から還付未済額を引いた収納額。市民負担の代表値ではない",
      unit: "円",
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
await writeFile(output, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Wrote ${output}`);
