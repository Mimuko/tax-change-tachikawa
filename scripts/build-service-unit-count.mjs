/**
 * 厚労省 介護サービス情報公表システムOD（各年12月末）から
 * 立川市（132021）の service_unit_count を算出し
 * data/curated/service-unit-count.json を書き出す。
 *
 * キー: サービスコード（ファイル名） × 事業所番号
 * 全国CSV/ZIPは保持せず、集計結果のみ curated へ保存する。
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { datasetContext } from "./lib/dataset-context.mjs";

const root = resolve(import.meta.dirname, "..");
const dataset = await datasetContext(root, process.argv.slice(2));
const MUNICIPALITY = dataset.config.municipalityCode;
const MUNICIPALITY_LABEL = dataset.config.municipalityLabel ?? dataset.config.municipalityName;
const BASE = "https://www.mhlw.go.jp";
const YEARS = [2020, 2021, 2022, 2023, 2024];

function parseCsvLine(line) {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(value);
      value = "";
    } else value += char;
  }
  cells.push(value);
  return cells;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "tax-change-tachikawa/0.1 (+public-data-research)" },
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

function linksForDecemberYear(html, year) {
  const marker = `${year}年12月末時点`;
  const start = html.indexOf(marker);
  if (start < 0) return [];
  const rest = html.slice(start + marker.length);
  const endMatch = rest.search(/\d{4}年\s*[6６]月末時点|\d{4}年\s*12月末時点|利用規約/);
  const slice = endMatch >= 0 ? rest.slice(0, endMatch) : rest.slice(0, 25000);
  const hrefs = [...slice.matchAll(/href="(\/content\/[^"]+\.(?:csv|zip))"/g)].map((match) => match[1]);
  // Prefer year-stamped archives when both plain and stamped exist
  const byCode = new Map();
  for (const href of hrefs) {
    const code = serviceCodeFromHref(href);
    if (!code) continue;
    const prev = byCode.get(code);
    if (!prev || href.includes("_all_")) byCode.set(code, href);
  }
  return [...byCode.values()];
}

function serviceCodeFromHref(href) {
  const match = href.match(/jigyosho_(\d+)/);
  return match?.[1] ?? null;
}

async function countUnitsFromCsvStream(stream, serviceCode, keys) {
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let header = null;
  let codeIdx = 0;
  let officeIdx = -1;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    if (!header) {
      header = cells;
      codeIdx = header.findIndex((h) => h.includes("市町村コード") || h.includes("都道府県コード"));
      officeIdx = header.findIndex((h) => h.includes("事業所番号"));
      if (codeIdx < 0) codeIdx = 0;
      if (officeIdx < 0) officeIdx = 15;
      continue;
    }
    if ((cells[codeIdx] ?? "").trim() !== MUNICIPALITY) continue;
    const office = (cells[officeIdx] ?? "").trim();
    if (!office) continue;
    keys.add(`${serviceCode}:${office}`);
  }
}

async function downloadToTemp(url, ext) {
  const response = await fetch(url, {
    headers: { "user-agent": "tax-change-tachikawa/0.1 (+public-data-research)" },
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const path = join(tmpdir(), `kaigo-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(path));
  return path;
}

async function countFromCsvUrl(url, serviceCode, keys) {
  const response = await fetch(url, {
    headers: { "user-agent": "tax-change-tachikawa/0.1 (+public-data-research)" },
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  await countUnitsFromCsvStream(Readable.fromWeb(response.body), serviceCode, keys);
}

async function countFromZipUrl(url, serviceCode, keys) {
  const zipPath = await downloadToTemp(url, "zip");
  const listed = spawnSync("unzip", ["-Z1", zipPath], { encoding: "utf8" });
  if (listed.status !== 0) throw new Error(`unzip list failed: ${url}`);
  const csvName = listed.stdout.split(/\r?\n/).find((name) => name.toLowerCase().endsWith(".csv"));
  if (!csvName) throw new Error(`no csv in zip: ${url}`);
  const extracted = spawnSync("unzip", ["-p", zipPath, csvName], { encoding: "buffer", maxBuffer: 80 * 1024 * 1024 });
  if (extracted.status !== 0) throw new Error(`unzip -p failed: ${url}`);
  await countUnitsFromCsvStream(Readable.from(extracted.stdout), serviceCode, keys);
}

const html = await fetchText(`${BASE}/stf/kaigo-kouhyou_opendata.html`);
const points = [];

for (const year of YEARS) {
  const hrefs = linksForDecemberYear(html, year);
  if (!hrefs.length) {
    throw new Error(`${year}: no December links found`);
  }
  if (hrefs.length < 30) {
    throw new Error(`${year}: expected ~35 service files, got ${hrefs.length}`);
  }
  const keys = new Set();
  console.log(`${year}: ${hrefs.length} files`);
  for (const href of hrefs) {
    const serviceCode = serviceCodeFromHref(href);
    if (!serviceCode) continue;
    const url = `${BASE}${href}`;
    if (href.endsWith(".zip")) await countFromZipUrl(url, serviceCode, keys);
    else await countFromCsvUrl(url, serviceCode, keys);
    process.stdout.write(".");
  }
  console.log(`\n${year}: ${keys.size} units`);
  if (keys.size < 1) throw new Error(`${year}: zero service units for ${MUNICIPALITY}`);
  points.push({ year, value: keys.size });
}

if (points.length !== YEARS.length || points.some((point) => !point.value)) {
  throw new Error(`service_unit_count: need all years ${YEARS.join(",")}, got ${points.map((p) => p.year).join(",")}`);
}

const curated = {
  metricId: "service_unit_count",
  label: "介護サービスの提供単位数",
  unit: "単位",
  baseYear: 2020,
  points,
  provenance: {
    title: "介護サービス情報公表システムオープンデータ（各年12月末）",
    definition: `サービスコード×事業所番号の一意組合せ数。市区町村コード${MUNICIPALITY}（${MUNICIPALITY_LABEL}）。定員は用いない。`,
    unit: "establishments",
    note: `厚労省ODの全国ファイルから${MUNICIPALITY_LABEL}行のみ集計。休廃止列はないため公表スナップショット掲載数として扱う。`,
  },
};

const outDir = resolve(root, dataset.curatedPath);
await mkdir(outDir, { recursive: true });
const outPath = resolve(outDir, "service-unit-count.json");
await writeFile(outPath, JSON.stringify(curated, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath}`);
