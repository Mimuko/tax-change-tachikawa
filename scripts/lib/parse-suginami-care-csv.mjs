/**
 * 杉並区統計書 CSV（9-9 介護保険）から介護系列を抽出する。
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(value);
      value = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

const number = (raw) => {
  const value = raw?.replaceAll(",", "").trim();
  if (!value || value === "-") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** 令和N年度(末) → 西暦年度（2020–2024 系列） */
export function fiscalYearFromReiwaLabel(label) {
  const normalized = label.normalize("NFKC");
  const match = normalized.match(/^令和(\d+)年度/);
  if (!match) return null;
  return 2018 + Number(match[1]);
}

export function parseSuginamiInsured(rows) {
  const data = [];
  for (const row of rows.slice(1)) {
    const year = fiscalYearFromReiwaLabel(row[0] ?? "");
    if (year == null || !row[0]?.includes("年度末") || row[0].includes("第")) continue;
    const value = number(row[1]);
    if (value == null) throw new Error(`insured: invalid total at ${row[0]}`);
    data.push({ year, value });
  }
  if (data.length !== 5) throw new Error(`insured: expected 5 fiscal years, got ${data.length}`);
  return data;
}

export function parseSuginamiCertified(rows) {
  const data = [];
  const secondByYear = new Map();
  for (const row of rows.slice(1)) {
    const label = row[0] ?? "";
    const normalized = label.normalize("NFKC");
    if (normalized.includes("第２号被保険者") || normalized.includes("第2号被保険者")) {
      const year = fiscalYearFromReiwaLabel(label);
      if (year != null) secondByYear.set(year, number(row[1]));
      continue;
    }
    const year = fiscalYearFromReiwaLabel(label);
    if (year == null || !label.includes("年度末") || label.includes("第")) continue;
    const total = number(row[1]);
    if (total == null) throw new Error(`certified: invalid total at ${label}`);
    const entry = { year, value: total };
    const second = secondByYear.get(year);
    if (second != null) entry.secondInsured = second;
    data.push(entry);
  }
  if (data.length !== 5) throw new Error(`certified: expected 5 fiscal years, got ${data.length}`);
  return data;
}

export function parseSuginamiBenefits(rows) {
  const data = [];
  for (const row of rows.slice(1)) {
    const year = fiscalYearFromReiwaLabel(row[0] ?? "");
    if (year == null) continue;
    const value = number(row[2]);
    if (value == null) throw new Error(`benefits: invalid total amount at ${row[0]}`);
    data.push({ year, value });
  }
  if (data.length !== 5) throw new Error(`benefits: expected 5 fiscal years, got ${data.length}`);
  return data;
}
