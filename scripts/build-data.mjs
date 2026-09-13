import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const municipality = JSON.parse(await readFile(resolve(root, "config/tachikawa.json"), "utf8"));
const sourcePage = municipality.sourcePage;

function parseCsv(text) {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(value); value = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

const number = (raw) => {
  const value = raw?.replaceAll(",", "").trim();
  if (!value || value === "-") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

async function load(name) {
  const path = resolve(root, "data/raw/tachikawa", name);
  const bytes = await readFile(path);
  return {
    rows: parseCsv(new TextDecoder("shift_jis").decode(bytes)),
    hash: createHash("sha256").update(bytes).digest("hex"),
  };
}

async function loadOptionalJson(relativePath) {
  try {
    const path = resolve(root, relativePath);
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

function latestFive(rows, headerRow, yearColumn = 0) {
  const data = rows.slice(headerRow + 1).filter((row) => /^20\d{2}/.test(row[yearColumn] ?? ""));
  return data.slice(-5);
}

const insured = await load("insured.csv");
const benefits = await load("benefits.csv");
const premium = await load("premium-revenue.csv");
const certified = await load("certified.csv");

const insuredRows = latestFive(insured.rows, 2);
const benefitRows = latestFive(benefits.rows, 2);
const premiumRows = latestFive(premium.rows, 2);
const certifiedHeader = certified.rows.findIndex((row) => row[0] === "区分");
const years = certified.rows[certifiedHeader].slice(1);
const certifiedTotal = certified.rows.find((row) => row[0]?.startsWith("総数"));
const certifiedSecond = certified.rows.find((row) => row[0]?.includes("第2号"));
const certificationRows = years.slice(-5).map((year, i) => {
  const column = years.length - 5 + i + 1;
  return {
    year: Number(year.replace("年度", "")),
    total: number(certifiedTotal[column]),
    secondInsured: number(certifiedSecond[column]),
  };
});

const data = {
  generatedAt: new Date().toISOString(),
  latestFiscalYear: Math.min(
    ...[insuredRows, benefitRows, premiumRows, certificationRows].map((rows) => Number(rows.at(-1)[0] ?? rows.at(-1).year)),
  ),
  sourcePage,
  series: {
    insured: insuredRows.map((row) => ({ year: number(row[0]), value: number(row[2]) })),
    certified: certificationRows.map((row) => ({ year: row.year, value: row.total, secondInsured: row.secondInsured })),
    benefits: benefitRows.map((row) => ({ year: number(row[0]), value: number(row[1]) })),
    premiumRevenue: premiumRows.map((row) => ({ year: number(row[0]), value: number(row[2]) })),
  },
  provenance: {
    insured: { title: "介護保険第1号被保険者の推移", sha256: insured.hash, definition: "各年度末現在の第1号被保険者総数", unit: "人" },
    certified: { title: "要介護（要支援）認定状況の推移（認定者数）", sha256: certified.hash, definition: "各年度末現在の認定者総数（第2号被保険者を含む）", unit: "人" },
    benefits: { title: "介護保険給付状況の推移", sha256: benefits.hash, definition: "各年度末現在として掲載された介護保険給付総額", unit: "円" },
    premiumRevenue: { title: "介護保険料（現年分）収入状況の推移", sha256: premium.hash, definition: "各年度末現在の現年分収入額", unit: "円" },
  },
  premiumStandard: {
    metricId: municipality.premiumStandard.metricId,
    sourceUrl: municipality.premiumStandard.sourceUrl,
    definition: municipality.premiumStandard.definition,
    periods: municipality.premiumStandard.periods,
  },
  reference: { tokyo: [] },
};

const requiredSeries = ["insured", "certified", "benefits", "premiumRevenue"];
for (const key of requiredSeries) {
  const rows = data.series[key];
  if (rows.length !== 5 || rows.some((row) => row.value === null)) throw new Error(`${key}: 最新5点を検証できません`);
}

const serviceUnitCount = await loadOptionalJson("data/curated/service-unit-count.json");
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

const tokyoReference = await loadOptionalJson("data/curated/tokyo-reference.json");
const allowedTokyoIds = new Set([
  "care_worker_fte",
  "care_worker_headcount",
  "care_worker_scheduled_salary_tokyo",
]);
if (tokyoReference?.metrics?.length) {
  data.reference.tokyo = tokyoReference.metrics.filter((metric) => {
    if (!allowedTokyoIds.has(metric.metricId)) {
      throw new Error(`tokyo reference: unexpected metricId ${metric.metricId}`);
    }
    if (metric.geography !== "tokyo" || metric.referenceOnly !== true) {
      throw new Error(`tokyo reference: ${metric.metricId} must be geography=tokyo and referenceOnly=true`);
    }
    return metric.points?.some((point) => point.value !== null && Number.isFinite(point.value));
  });
}

const output = resolve(root, "data/processed/dashboard.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Wrote ${output}`);
