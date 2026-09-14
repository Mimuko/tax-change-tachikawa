import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const BASE = "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/015";

const files = {
  elemStudents: "7-3-2shogakko-gakunenbetsudanjobetsujidosu1.csv",
  junStudents: "7-4-2chugakko-gakunenbetsudanjobetsuseitosu1.csv",
  elemClasses: "7-3-1shogakko-gakkousutogakkyusu1.csv",
  junClasses: "7-4-1chugakko-gakkosutogakkyusu1.csv",
  elemStaff: "7-3-3shogakko-kyosyokuinsu_21.csv",
  junStaff: "7-4-4chugakko-kyosyokuinsu1.csv",
  consultation: "7-1-1-2kyoikusodankensu2014-1.csv",
};

function parseNum(s) {
  if (s == null || s === "") return null;
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

async function fetchText(file) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`fetch ${file}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const decoded = new TextDecoder("shift_jis").decode(buf);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  return { decoded, sha256, url: `${BASE}/${file}` };
}

function yearRows(rows) {
  return rows.filter((r) => r[0] && /^\d{4}$/.test(String(r[0]).trim()));
}

const fetched = {};
for (const [key, file] of Object.entries(files)) {
  fetched[key] = await fetchText(file);
  console.log("fetched", key, fetched[key].sha256.slice(0, 8));
}

const elemStudents = yearRows(parseCsv(fetched.elemStudents.decoded))
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[1]) }))
  .filter((p) => p.value != null);

const junStudents = yearRows(parseCsv(fetched.junStudents.decoded))
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[1]) }))
  .filter((p) => p.value != null);

const elemClassRows = yearRows(parseCsv(fetched.elemClasses.decoded));
const elemClasses = elemClassRows
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[2]) }))
  .filter((p) => p.value != null);
const elemSpecialSupportClasses = elemClassRows
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[r.length - 1]) }))
  .filter((p) => p.value != null);

const junClasses = yearRows(parseCsv(fetched.junClasses.decoded))
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[2]) }))
  .filter((p) => p.value != null);

const elemStaff = yearRows(parseCsv(fetched.elemStaff.decoded))
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[1]) }))
  .filter((p) => p.value != null);

const junStaff = yearRows(parseCsv(fetched.junStaff.decoded))
  .map((r) => ({ year: Number(r[0]), value: parseNum(r[1]) }))
  .filter((p) => p.value != null);

const consultRows = parseCsv(fetched.consultation.decoded).filter(
  (r) => r[0] && /^\d{4}$/.test(r[0]) && (r[1] === "男" || r[1] === "女"),
);
const byYear = new Map();
for (const r of consultRows) {
  const y = Number(r[0]);
  const v = parseNum(r[2]) || 0;
  byYear.set(y, (byYear.get(y) || 0) + v);
}
const educationConsultationCases = [...byYear.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([year, value]) => ({ year, value }));

const latestFiscalYear = Math.max(...elemStudents.map((p) => p.year));

const dashboard = {
  generatedAt: new Date().toISOString(),
  latestFiscalYear,
  sourcePage: "https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007015.html",
  place: {
    municipalityCode: "132021",
    municipalityLabel: "立川市",
    prefectureLabel: "東京都",
    links: {
      tokyoEducationExpenseSurvey:
        "https://www.kyoiku.metro.tokyo.lg.jp/about/statistics_and_research/expense_per_area/report2024/report2024_csv",
      mextSchoolRefusalSurvey: "https://www.e-stat.go.jp/stat-search/files?toukei=00400304",
    },
  },
  series: {
    elemStudents,
    junStudents,
    elemClasses,
    elemSpecialSupportClasses,
    junClasses,
    elemStaff,
    junStaff,
    educationConsultationCases,
  },
  provenance: {
    elemStudents: {
      title: "市立小学校児童数",
      definition: "市立小学校の学年別児童数合計。各年5月1日現在。",
      unit: "persons",
      periodKind: "as_of",
      asOfRule: "各年5月1日現在",
      sha256: fetched.elemStudents.sha256,
      sourceUrl: fetched.elemStudents.url,
    },
    junStudents: {
      title: "市立中学校生徒数",
      definition: "市立中学校の学年別生徒数合計。各年5月1日現在。",
      unit: "persons",
      periodKind: "as_of",
      asOfRule: "各年5月1日現在",
      sha256: fetched.junStudents.sha256,
      sourceUrl: fetched.junStudents.url,
    },
    elemClasses: {
      title: "市立小学校通常学級数",
      definition: "市立小学校の通常学級総数。各年5月1日現在。",
      unit: "classes",
      periodKind: "as_of",
      asOfRule: "各年5月1日現在",
      sha256: fetched.elemClasses.sha256,
      sourceUrl: fetched.elemClasses.url,
    },
    elemSpecialSupportClasses: {
      title: "市立小学校特別支援学級数",
      definition: "市立小学校の特別支援学級数。各年5月1日現在。通常学級と分離。",
      unit: "classes",
      periodKind: "as_of",
      asOfRule: "各年5月1日現在",
      sha256: fetched.elemClasses.sha256,
      sourceUrl: fetched.elemClasses.url,
    },
    junClasses: {
      title: "市立中学校学級数",
      definition: "市立中学校の学級総数。各年5月1日現在。",
      unit: "classes",
      periodKind: "as_of",
      asOfRule: "各年5月1日現在",
      sha256: fetched.junClasses.sha256,
      sourceUrl: fetched.junClasses.url,
    },
    elemStaff: {
      title: "市立小学校教職員数",
      definition: "教員・養護教諭等を含む教職員数。各年5月1日現在。",
      unit: "persons",
      periodKind: "as_of",
      asOfRule: "各年5月1日現在",
      sha256: fetched.elemStaff.sha256,
      sourceUrl: fetched.elemStaff.url,
    },
    junStaff: {
      title: "市立中学校教職員数",
      definition: "教員・養護教諭等を含む教職員数。各年5月1日現在。小学校と合算しない。",
      unit: "persons",
      periodKind: "as_of",
      asOfRule: "各年5月1日現在",
      sha256: fetched.junStaff.sha256,
      sourceUrl: fetched.junStaff.url,
    },
    educationConsultationCases: {
      title: "教育相談件数",
      definition:
        "年度内の教育相談件数（男女合算）。時点値系列と混在禁止。2014年度以降ファイルを使用。",
      unit: "cases",
      periodKind: "annual_cumulative",
      asOfRule: "各年度内の相談件数",
      sha256: fetched.consultation.sha256,
      sourceUrl: fetched.consultation.url,
    },
  },
  gaps: [
    {
      id: "non_attendance_school_refusal",
      kind: "wrong_geography",
      metricId: "non_attendance_school_refusal",
      title: "不登校は、この街の年次変化としては並べられない。",
      reason:
        "文科省の調査は都道府県・指定都市の表章で、立川市の行はありません。東京都全体の値を立川市の実績にはしません。",
      note: "市の不就学の件数は、不登校の代わりにはしません。",
    },
    {
      id: "per_student_education_cost",
      kind: "unavailable_for_comparison",
      metricId: "elem_per_student_education_cost",
      title: "1人あたりの教育費は、いまは年次の変化として示していません。",
      reason:
        "東京都の地方教育費調査に立川市の表はあります。同じ定義で複数年を並べられることの確認が終わっていないため、本編の推移には載せていません。",
      note: "会計年度の実績です。5月1日現在の児童生徒数を分母にして再計算しません。",
    },
  ],
};

const out = path.join(root, "data/processed/tachikawa/education/dashboard.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(dashboard, null, 2) + "\n");
console.log("wrote", out);
console.log("elemStudents", elemStudents[0], "->", elemStudents.at(-1), `(${elemStudents.length})`);
console.log("consultation", educationConsultationCases[0], "->", educationConsultationCases.at(-1));
console.log("special", elemSpecialSupportClasses[0], "->", elemSpecialSupportClasses.at(-1));
