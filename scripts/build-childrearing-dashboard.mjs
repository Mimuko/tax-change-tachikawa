import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const files = {
  handbook: "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/025/5-1-9boshikenkotechokofu8.csv",
  nurseryChildren: "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/020/6-2-1hoikunojisshigeninbetsuhoikuenjisu8.csv",
  nurseryCapacity: "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/020/6-2-3hoikuenbetsuteiin_hoikunojisshijidosutoshokuinsu8.csv",
  afterschool: "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/020/6-2-4gakudouhoikushotourokujidosu8.csv",
  supportCenter: "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/020/6-2-5kodomokateishiensenta-riyojokyo8.csv",
};

function parseNum(s) {
  if (s == null || s === "" || s === "-") return null;
  const n = Number(String(s).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const decoded = new TextDecoder("shift_jis").decode(buf);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  return { decoded, sha256, url };
}

function yearRows(rows) {
  return rows.filter((r) => r[0] && /^\d{4}$/.test(String(r[0]).trim()));
}

function findWideColumn(headerRow, year, suffix) {
  const target = `${year}年${suffix}`;
  const idx = headerRow.findIndex((cell) => String(cell).trim() === target);
  if (idx === -1) throw new Error(`Missing column ${target}`);
  return idx;
}

const fetched = {};
for (const [key, url] of Object.entries(files)) {
  fetched[key] = await fetchText(url);
  console.log("fetched", key, fetched[key].sha256.slice(0, 8));
}

const handbookRows = yearRows(parseCsv(fetched.handbook.decoded));
const pregnancyNotifications = handbookRows
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[r.length - 1]) }))
  .filter((p) => p.value != null);
const maternityHandbookDeliveries = handbookRows
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[1]) }))
  .filter((p) => p.value != null);

const nurseryChildRows = parseCsv(fetched.nurseryChildren.decoded);
const nurseryChildren = nurseryChildRows
  .filter((r) => /^\d{4}$/.test(String(r[0]).trim()) && String(r[1]).trim() === "全て")
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[2]) }))
  .filter((p) => p.value != null);

const capacityRows = parseCsv(fetched.nurseryCapacity.decoded);
const capacityHeader = capacityRows[2];
const totalNurseryRow = capacityRows.find((r) => String(r[0]).trim() === "全園");
if (!totalNurseryRow) throw new Error("Missing 全園 row in nursery capacity CSV");

const nurseryCapacityTotal = [];
const nurseryStaffCount = [];
for (let year = 2016; year <= 2023; year++) {
  const capIdx = findWideColumn(capacityHeader, year, "定員の総数（人）");
  const staffIdx = findWideColumn(capacityHeader, year, "職員数（人）");
  nurseryCapacityTotal.push({ year, value: parseNum(totalNurseryRow[capIdx]) });
  nurseryStaffCount.push({ year, value: parseNum(totalNurseryRow[staffIdx]) });
}

const afterschoolRows = parseCsv(fetched.afterschool.decoded);
const afterschoolHeader = afterschoolRows[2];
const afterschoolTotalRow = afterschoolRows.find((r) => String(r[0]).trim().startsWith("全保育所"));
if (!afterschoolTotalRow) throw new Error("Missing 全保育所 row");

const afterschoolRegistrations = [];
for (let year = 2013; year <= 2023; year++) {
  const idx = findWideColumn(afterschoolHeader, year, "総数");
  afterschoolRegistrations.push({ year, value: parseNum(afterschoolTotalRow[idx]) });
}

const supportRows = yearRows(parseCsv(fetched.supportCenter.decoded));
const childrearingConsultationCases = supportRows
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[1]) }))
  .filter((p) => p.value != null);

const latestFiscalYear = Math.max(...pregnancyNotifications.map((p) => p.year));

const dashboard = {
  generatedAt: new Date().toISOString(),
  latestFiscalYear,
  sourcePage: "https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007020.html",
  place: {
    municipalityCode: "132021",
    municipalityLabel: "立川市",
    prefectureLabel: "東京都",
    links: {
      healthOpenData: "https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007025.html",
      welfareOpenData: "https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007020.html",
    },
  },
  series: {
    pregnancyNotifications,
    maternityHandbookDeliveries,
    nurseryChildren,
    nurseryCapacityTotal,
    nurseryStaffCount,
    afterschoolRegistrations,
    childrearingConsultationCases,
  },
  provenance: {
    pregnancyNotifications: {
      title: "妊娠届出者数",
      definition: "母子健康手帳交付表の妊娠届出者数。各年度。出生数そのものではない。",
      unit: "persons",
      periodKind: "annual_cumulative",
      asOfRule: "各年度",
      sha256: fetched.handbook.sha256,
      sourceUrl: fetched.handbook.url,
    },
    maternityHandbookDeliveries: {
      title: "母子健康手帳交付数",
      definition: "母子健康手帳の交付総数。各年度。",
      unit: "deliveries",
      periodKind: "annual_cumulative",
      asOfRule: "各年度",
      sha256: fetched.handbook.sha256,
      sourceUrl: fetched.handbook.url,
    },
    nurseryChildren: {
      title: "保育園児数",
      definition: "保育の実施原因別表・年齢=全ての園児総数。各年4月1日現在。",
      unit: "persons",
      periodKind: "as_of",
      asOfRule: "各年4月1日現在",
      sha256: fetched.nurseryChildren.sha256,
      sourceUrl: fetched.nurseryChildren.url,
    },
    nurseryCapacityTotal: {
      title: "保育所等定員",
      definition: "保育園別定員表・全園行の定員総数。各年4月1日現在。2016年以降。",
      unit: "persons",
      periodKind: "as_of",
      asOfRule: "各年4月1日現在",
      sha256: fetched.nurseryCapacity.sha256,
      sourceUrl: fetched.nurseryCapacity.url,
    },
    nurseryStaffCount: {
      title: "保育職員数",
      definition: "保育園別定員表・全園行の職員数。各年4月1日現在。常勤換算ではない。",
      unit: "persons",
      periodKind: "as_of",
      asOfRule: "各年4月1日現在",
      sha256: fetched.nurseryCapacity.sha256,
      sourceUrl: fetched.nurseryCapacity.url,
    },
    afterschoolRegistrations: {
      title: "学童保育登録児童数",
      definition: "学童保育所登録児童数表・全保育所行の総数。各年度。",
      unit: "persons",
      periodKind: "annual_cumulative",
      asOfRule: "各年度",
      sha256: fetched.afterschool.sha256,
      sourceUrl: fetched.afterschool.url,
    },
    childrearingConsultationCases: {
      title: "子育て相談件数",
      definition: "子ども家庭支援センターの子育て相談事業相談件数。各年度末現在。",
      unit: "cases",
      periodKind: "annual_cumulative",
      asOfRule: "各年度末現在",
      sha256: fetched.supportCenter.sha256,
      sourceUrl: fetched.supportCenter.url,
    },
  },
  supportConnection: {
    indicators: [
      {
        metricId: "childrearing_consultation_cases",
        label: "子育て相談として受け付けた件数",
        dimension: "consultation",
        supportNetwork: "public_or_professional",
        connectionState: "connected",
        observations: childrearingConsultationCases.map(({ year, value }) => ({
          periodLabel: `${year}年度`,
          year,
          value,
          unit: "cases",
        })),
        population: "立川市の子ども家庭支援センターで年度内に受け付けた子育て相談",
        geography: "tachikawa",
        referenceOnly: false,
        provenance: {
          title: "立川市オープンデータ『子ども家庭支援センター利用状況』",
          sourceUrl: fetched.supportCenter.url,
          definition: "子育て相談事業の相談件数。相談した世帯数や人数ではない。",
        },
        caveat:
          "同じ家庭による複数回の相談を含み得るため、支援が必要なすべての家庭に届いた割合には換算できません。",
      },
    ],
    gaps: [
      {
        id: "childrearing_support_reach_rate",
        kind: "not_measurable",
        metricId: "childrearing_support_reach_rate",
        title: "子育て支援が必要な家庭のうち、相談へ到達できた割合は分かりません。",
        reason:
          "公表されているのは相談の受付件数で、支援を必要とする家庭の総数や、相談に至らなかった家庭の数は含まれていません。",
        note: "妊娠届出者数や保育園児数で割って接続率を作ることはしていません。",
        sourceUrl: fetched.supportCenter.url,
        sourceLabel: "立川市オープンデータ『子ども家庭支援センター利用状況』",
      },
    ],
  },
  gaps: [
    {
      id: "nursery_waiting_children",
      kind: "unavailable_for_comparison",
      metricId: "nursery_waiting_children",
      title: "待機児童数の年次推移を、単一の市区町村系列として確認できていません。",
      reason:
        "PoC 時点では立川市オープンデータの社会福祉ページで、待機児童の単純な推移 CSV を確認できませんでした。",
      note: "保育園児数や定員から待機数を推計することはしていません。",
    },
    {
      id: "child_allowance_unified_trend",
      kind: "definition_change",
      metricId: "child_allowance_unified_trend",
      title: "児童手当の支給額を、制度改定前後でつないだ単一系列として掲載していません。",
      reason:
        "児童手当 CSV には児童育成手当条例・児童手当法・子ども手当法など複数制度の列が混在し、改定前後の定義が一致しません。",
      note: "支給世帯数から独自に1人あたり支給額を計算することはしていません。",
    },
  ],
};

const out = path.join(root, "data/processed/tachikawa/childrearing/dashboard.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(dashboard, null, 2) + "\n");
console.log("wrote", out);
console.log("pregnancy", pregnancyNotifications[0], "->", pregnancyNotifications.at(-1));
console.log("nursery", nurseryChildren[0], "->", nurseryChildren.at(-1));
console.log("consult", childrearingConsultationCases[0], "->", childrearingConsultationCases.at(-1));
