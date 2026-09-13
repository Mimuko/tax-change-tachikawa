/**
 * 東京都参考指標を curated へ書き出す。
 *
 * Phase 1: care_worker_scheduled_salary_tokyo（賃金構造基本統計調査 DB 0004007961）のみ。
 * care_worker_fte / care_worker_headcount はサービス×職種の代表セル未確定のため出さない
 * （サービス横断合計は禁止。docs/metrics.md）。
 *
 * 使い方:
 *   set -a && source .env && set +a && npm run data:tokyo-reference
 *   または E_STAT_APP_ID=xxxxx npm run data:tokyo-reference
 *
 * CLASS コードは getMetaInfo の名称完全一致で解決する（推測コード禁止）。
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outPath = resolve(root, "data/curated/tokyo-reference.json");
const STATS_DATA_ID = "0004007961";
const API = "https://api.e-stat.go.jp/rest/3.0/app/json";

const REQUIRED_NAMES = {
  tab: "所定内給与額",
  cat01: "男女計",
  cat02: "介護職員（医療・福祉施設等）",
  area: "東京都",
};

async function loadDotEnv() {
  try {
    const text = await readFile(resolve(root, ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function fetchJson(operation, url) {
  const response = await fetch(url, {
    headers: { "user-agent": "tax-change-tachikawa/0.1 (+public-data-research)" },
  });
  if (!response.ok) throw new Error(`${operation}: HTTP ${response.status}`);
  return response.json();
}

function resolveCode(classObjs, dimId, exactName) {
  const obj = classObjs.find((item) => item["@id"] === dimId);
  if (!obj) fail(`getMetaInfo: CLASS_OBJ ${dimId} がありません`);
  const classes = asArray(obj.CLASS);
  const hits = classes.filter((item) => item["@name"] === exactName);
  if (hits.length === 0) {
    fail(`getMetaInfo: ${dimId} に名称「${exactName}」がありません`);
  }
  if (hits.length > 1) {
    fail(`getMetaInfo: ${dimId} の「${exactName}」が複数あります`);
  }
  return { code: hits[0]["@code"], unit: hits[0]["@unit"] ?? "" };
}

function yearFromTimeCode(timeCode) {
  const match = String(timeCode).match(/^(\d{4})/);
  if (!match) return null;
  return Number(match[1]);
}

function toYen(raw, unit) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (unit === "千円") return Math.round(n * 1000);
  if (unit === "円") return Math.round(n);
  return null;
}

await loadDotEnv();
const appId = process.env.E_STAT_APP_ID?.trim();
if (!appId) {
  console.log(
    [
      "skip: E_STAT_APP_ID が未設定です。",
      "確定 metric_id: care_worker_fte, care_worker_headcount, care_worker_scheduled_salary_tokyo",
      "接続後に data/curated/tokyo-reference.json を生成してください。スキーマは data/curated/README.md を参照。",
    ].join("\n"),
  );
  process.exit(0);
}

const metaUrl = `${API}/getMetaInfo?appId=${encodeURIComponent(appId)}&statsDataId=${STATS_DATA_ID}`;
const meta = await fetchJson("getMetaInfo", metaUrl);
const metaStatus = meta.GET_META_INFO?.RESULT;
if (String(metaStatus?.STATUS) !== "0") {
  fail(`getMetaInfo failed: ${metaStatus?.STATUS} ${metaStatus?.ERROR_MSG ?? ""}`);
}

const classObjs = asArray(meta.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ);
const tab = resolveCode(classObjs, "tab", REQUIRED_NAMES.tab);
const cat01 = resolveCode(classObjs, "cat01", REQUIRED_NAMES.cat01);
const cat02 = resolveCode(classObjs, "cat02", REQUIRED_NAMES.cat02);
const area = resolveCode(classObjs, "area", REQUIRED_NAMES.area);

const statsUrl =
  `${API}/getStatsData?appId=${encodeURIComponent(appId)}` +
  `&statsDataId=${STATS_DATA_ID}` +
  `&cdTab=${encodeURIComponent(tab.code)}` +
  `&cdCat01=${encodeURIComponent(cat01.code)}` +
  `&cdCat02=${encodeURIComponent(cat02.code)}` +
  `&cdArea=${encodeURIComponent(area.code)}` +
  `&metaGetFlg=Y&cntGetFlg=N&sectionHeaderFlg=1`;

const stats = await fetchJson("getStatsData", statsUrl);
const statsStatus = stats.GET_STATS_DATA?.RESULT;
if (String(statsStatus?.STATUS) !== "0") {
  fail(`getStatsData failed: ${statsStatus?.STATUS} ${statsStatus?.ERROR_MSG ?? ""}`);
}

const values = asArray(stats.GET_STATS_DATA.STATISTICAL_DATA?.DATA_INF?.VALUE);
const points = [];
const seenYears = new Set();
for (const row of values) {
  const year = yearFromTimeCode(row["@time"]);
  if (year == null || year < 2020) continue;

  if (row["@tab"] !== tab.code) {
    fail(`VALUE行の@tabが解決コードと一致しません: year=${year}`);
  }
  if (row["@cat01"] !== cat01.code) {
    fail(`VALUE行の@cat01が解決コードと一致しません: year=${year}`);
  }
  if (row["@cat02"] !== cat02.code) {
    fail(`VALUE行の@cat02が解決コードと一致しません: year=${year}`);
  }
  if (row["@area"] !== area.code) {
    fail(`VALUE行の@areaが解決コードと一致しません: year=${year}`);
  }
  if (seenYears.has(year)) {
    fail(`重複する年があります: ${year}`);
  }
  seenYears.add(year);

  const unit = row["@unit"] || tab.unit;
  const yen = toYen(row["$"], unit);
  if (yen == null) {
    fail(`単位が不明または数値でないため変換できません: year=${year} unit=${unit} raw=${row["$"]}`);
  }
  points.push({ year, value: yen });
}

points.sort((a, b) => a.year - b.year);
const years = new Set(points.map((p) => p.year));
if (points.length === 0) fail("賃金系列の points が空です");
if ([2020, 2021, 2022, 2023].some((y) => !years.has(y))) {
  fail(`2020–2023 の連続値が揃いません: ${[...years].join(",")}`);
}

/**
 * DB 0004007961 の meta 時間軸は取得時点で「時間軸（2020～2023）」のみ。
 * 令和6年調査の結果は公開済みだが、同 DB/API には未反映。
 * 公開 Excel（一般労働者・都道府県×職種（特掲）・性別・産業計・役職者を除く）の同一定義セルで補完する。
 * 2023年クロスチェック: 同公開表シリーズの令和5年表と DB 値が 266.4千円で一致。
 * 出典: e-Stat statInfId=000040247966（千葉～愛知）、１３東京 × 介護職員（医療・福祉施設等） × 男女計 × 所定内給与額 294.2千円。
 */
const PUBLISHED_TABLE_2024 = {
  year: 2024,
  value: 294_200,
  note:
    "2024年は e-Stat DB 0004007961（時間軸 2020–2023）に未収録のため、令和6年賃金構造基本統計調査の公開表（一般労働者・都道府県別・職種（特掲）・性別・産業計・役職者を除く、statInfId=000040247966）から、東京都×介護職員（医療・福祉施設等）×男女計×所定内給与額（294.2千円）を円換算して追記。役職者を含む本表（000040247953）は用いない。2023年は同系列の公開表と DB が一致することを確認済み。",
};

let supplementedFromPublishedTable = false;
if (!years.has(2024)) {
  points.push({ year: PUBLISHED_TABLE_2024.year, value: PUBLISHED_TABLE_2024.value });
  years.add(2024);
  points.sort((a, b) => a.year - b.year);
  supplementedFromPublishedTable = true;
}

const payload = {
  metrics: [
    {
      metricId: "care_worker_scheduled_salary_tokyo",
      label: "介護職員の所定内給与（東京都）",
      unit: "円",
      referenceOnly: true,
      geography: "tokyo",
      points,
      provenance: {
        title: `賃金構造基本統計調査 DB ${STATS_DATA_ID}`,
        definition:
          "一般労働者・企業規模10人以上・男女計・東京都・介護職員（医療・福祉施設等）・所定内給与額。2020年改定後のみ。千円表記を円に換算。",
        unit: "yen_per_month",
        note: supplementedFromPublishedTable ? PUBLISHED_TABLE_2024.note : undefined,
      },
    },
  ],
};

await mkdir(resolve(root, "data/curated"), { recursive: true });
await writeFile(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(
  `Wrote ${outPath} (${points.map((p) => `${p.year}:${p.value}`).join(", ")})`,
);
console.log(
  "note: care_worker_fte / care_worker_headcount は代表セル未確定のため未収録（横断合計禁止）。",
);
