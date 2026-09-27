import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = "data/raw/tachikawa/childcare";
const sourcePage = "https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007020.html";
const urlBase = "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/020/";
const files = {
  nursery: { local: "nurseries.csv", remote: "6-2-3hoikuenbetsuteiin_hoikunojisshijidosutoshokuinsu8.csv" },
  consultation: { local: "consultations.csv", remote: "6-2-5kodomokateishiensenta-riyojokyo8.csv" },
};

function parseCsv(bytes) {
  const content = new TextDecoder("shift_jis", { fatal: true }).decode(bytes).replace(/\r\n/g, "\n");
  return content.trimEnd().split("\n").map((line) => {
    const cells = [];
    let cell = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && quoted && line[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { cells.push(cell); cell = ""; }
      else cell += char;
    }
    if (quoted) throw new Error("Unclosed CSV quote");
    cells.push(cell);
    return cells;
  });
}

function number(value, label) {
  const clean = value?.replaceAll(",", "");
  if (!/^\d+$/.test(clean ?? "")) throw new Error(`Missing or invalid ${label}: ${value}`);
  return Number(clean);
}

const bytes = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readFileSync(join(root, file.local))]));
const nurseryRows = parseCsv(bytes.nursery);
const consultationRows = parseCsv(bytes.consultation);
const headers = nurseryRows[2];
const allNurseries = nurseryRows.find((row) => row[0] === "全園");
if (!allNurseries) throw new Error("All-nursery total row missing");

const nurseryFields = {
  capacity: "定員の総数（人）",
  enrolled: "保育の実施児童数の総数（人）",
  staff: "職員数（人）",
};
const series = Object.fromEntries(Object.entries(nurseryFields).map(([key, field]) => {
  const points = [];
  for (let year = 2019; year <= 2023; year++) {
    const index = headers.indexOf(`${year}年${field}`);
    if (index < 0) throw new Error(`Missing header: ${year}年${field}`);
    points.push({ year, value: number(allNurseries[index], `${year} ${field}`) });
  }
  return [key, points];
}));
const consultationHeader = consultationRows[2];
const consultationIndex = consultationHeader.indexOf("子育て相談事業相談件数（件）");
if (consultationIndex < 0) throw new Error("Consultation header missing");
series.consultations = consultationRows.slice(3).filter((row) => /^20\d\d$/.test(row[0]) && Number(row[0]) >= 2019).map((row) => ({
  year: Number(row[0]), value: number(row[consultationIndex], `${row[0]} consultations`),
}));
if (series.consultations.length !== 5 || series.consultations.at(-1).year !== 2023) throw new Error("Consultation year coverage changed");

function provenance(fileKey, title, definition, unit, note) {
  const file = files[fileKey];
  return { title, definition, unit, sourceUrl: urlBase + file.remote, retrievedAt: "2026-09-27", sha256: createHash("sha256").update(bytes[fileKey]).digest("hex"), note };
}

const output = {
  generatedAt: "2026-09-27", latestFiscalYear: 2023, sourcePage,
  place: { municipalityCode: "132021", municipalityLabel: "立川市", prefectureLabel: "東京都" },
  series,
  provenance: {
    capacity: provenance("nursery", "立川市統計年報・保育園別定員等の推移", "全園行の定員総数。幼保連携型認定こども園（保育認定）を含む。", "人", "各年の公表値。原表は基準日を明記していないため、年度末値とは扱わない。"),
    enrolled: provenance("nursery", "立川市統計年報・保育園別定員等の推移", "全園行の保育の実施児童数の総数。市内受託児童を含む。", "人", "定員との差は待機児童数ではない。"),
    staff: provenance("nursery", "立川市統計年報・保育園別定員等の推移", "全園行の職員数。常勤換算ではない。", "人", "保育の質や人員充足を示す指標ではない。"),
    consultations: provenance("consultation", "立川市統計年報・子ども家庭支援センター利用状況", "子育て相談事業の年度内相談件数。延べ件数であり、相談した世帯数ではない。", "件", "各年度末現在。保育園の年次値とは期間種別が異なる。"),
  },
  gaps: [
    { id: "childcare_waitlist", kind: "unavailable_for_comparison", reason: "同じ原表に待機児童の年次系列はないため、定員と実施児童数の差から推計しない。" },
    { id: "childcare_support_reach_rate", kind: "not_measurable", metricId: "childcare_support_reach_rate", reason: "公表されているのは相談の延べ件数で、支援を必要とする家庭の総数は含まれていません。", note: "保育の実施児童数や定員を分母にして、支援が届いた割合を作ることはしていません。", sourceUrl: urlBase + files.consultation.remote },
  ],
};
const target = "data/processed/tachikawa/childcare";
mkdirSync(target, { recursive: true });
writeFileSync(join(target, "dashboard.json"), JSON.stringify(output, null, 2) + "\n");
console.log(`Built ${target}/dashboard.json`);
