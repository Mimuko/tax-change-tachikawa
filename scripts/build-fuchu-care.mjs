import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { datasetContext } from "./lib/dataset-context.mjs";
import { parseFuchuCareCsv } from "./lib/parse-fuchu-care.mjs";

const root = resolve(import.meta.dirname, "..");
const dataset = await datasetContext(root, ["fuchu", "care"]);
const config = dataset.config;
const parsed = Object.fromEntries(await Promise.all(config.files.map(async (file) => {
  const bytes = await readFile(resolve(root, dataset.rawPath, file.file));
  return [file.key, parseFuchuCareCsv(bytes, file.key)];
})));
const years = parsed.insured.points.map(({ year }) => year);
for (const key of ["certified", "benefits"]) {
  if (JSON.stringify(parsed[key].points.map(({ year }) => year)) !== JSON.stringify(years)) {
    throw new Error(`fuchu/care ${key}: fiscal years differ from insured`);
  }
}

const provenance = Object.fromEntries(config.files.map((file) => [file.key, {
  title: {
    insured: "介護保険第1号被保険者数（府中市統計書オープンデータ）",
    certified: "要支援・要介護認定者総数（府中市統計書オープンデータ）",
    benefits: "介護保険給付総額（府中市統計書オープンデータ）",
  }[file.key],
  sha256: parsed[file.key].sha256,
  sourceUrl: file.url,
  definition: {
    insured: "各年度末（翌年3月31日）現在の第1号被保険者数。住所地特例対象者を含む。",
    certified: "各年度末（翌年3月31日）現在の要支援・要介護認定者総数。第2号被保険者を含む。",
    benefits: "介護保険給付費の年度総額。原典の居宅サービス・施設サービス・その他の合計と一致する円額。",
  }[file.key],
  unit: file.key === "benefits" ? "円" : "人",
  note: "出典: 府中市（CC BY 4.0）。原典のゼロ埋め行は除外。",
}]));

const data = {
  generatedAt: new Date().toISOString(),
  latestFiscalYear: years.at(-1),
  sourcePage: config.sourcePage,
  place: {
    municipalityCode: config.municipalityCode,
    municipalityLabel: config.municipalityLabel,
    prefectureLabel: config.prefectureLabel,
    links: config.links,
  },
  series: Object.fromEntries(config.files.map(({ key }) => [key, parsed[key].points])),
  provenance,
  premiumStandard: config.premiumStandard,
  reference: { prefecture: [] },
};

const reference = JSON.parse(await readFile(resolve(root, "data/curated/tachikawa/care/tokyo-reference.json"), "utf8"));
data.reference.prefecture = reference.metrics.filter((metric) => {
  if (metric.referenceOnly !== true || metric.geography !== "tokyo") throw new Error("Tokyo reference scope changed");
  return metric.points?.some((point) => Number.isFinite(point.value));
});
try {
  const service = JSON.parse(await readFile(resolve(root, `${dataset.curatedPath}/service-unit-count.json`), "utf8"));
  if (service.points?.length >= 2) {
    data.series.serviceUnitCount = service.points.map(({ year, value }) => ({ year, value }));
    data.provenance.serviceUnitCount = service.provenance;
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const output = resolve(root, dataset.outputPath);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Wrote ${output}`);
