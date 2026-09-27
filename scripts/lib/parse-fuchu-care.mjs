import { createHash } from "node:crypto";

const decoder = new TextDecoder("shift_jis", { fatal: true });
const expectedHeaders = {
  insured: ["時点", "被保険者数", "第1号被保険者", "第2号被保険者(認定者)"],
  certified: ["時点", "総数", "要支援", "要支援1", "要支援2", "要介護1", "要介護2", "要介護3", "要介護4", "要介護5"],
  benefits: ["年度", "総額(円)", "居宅サービス(円)", "施設サービス(円)", "その他(円)"],
};

const integer = (value, context) => {
  if (!/^\d+$/.test(value)) throw new Error(`${context}: expected nonnegative integer, got ${value}`);
  return Number(value);
};

export function parseFuchuCareCsv(bytes, key) {
  const expected = expectedHeaders[key];
  if (!expected) throw new Error(`Unknown Fuchu care source: ${key}`);
  const lines = decoder.decode(bytes).replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
  const header = lines.shift().split(",");
  if (expected.some((name, index) => header[index] !== name)) {
    throw new Error(`${key}: CSV header changed: ${header.join(",")}`);
  }
  const rows = new Map();
  for (const line of lines) {
    const cells = line.split(",");
    if (!cells[0] || cells[0] === "0" || cells[0] === "1/0/1900") continue;
    let year;
    if (key === "benefits") {
      year = integer(cells[0], `${key} year`);
    } else {
      const date = /^3\/31\/(\d{4})$/.exec(cells[0]);
      if (!date) throw new Error(`${key}: unexpected reference date ${cells[0]}`);
      year = Number(date[1]) - 1;
    }
    if (rows.has(year)) throw new Error(`${key}: duplicate fiscal year ${year}`);
    const value = integer(cells[key === "insured" ? 2 : 1], `${key} ${year}`);
    if (value <= 0) throw new Error(`${key} ${year}: nonpositive value`);
    if (key === "insured") {
      const total = integer(cells[1], `${key} ${year} total`);
      const second = integer(cells[3], `${key} ${year} second insured`);
      if (total !== value + second) throw new Error(`${key} ${year}: insured components mismatch`);
    }
    if (key === "benefits") {
      const sum = cells.slice(2, 5).reduce((acc, cell) => acc + integer(cell, `${key} ${year} component`), 0);
      if (sum !== value) throw new Error(`${key} ${year}: benefit components mismatch`);
    }
    rows.set(year, { year, value });
  }
  const sorted = [...rows.values()].sort((a, b) => a.year - b.year);
  if (sorted.length < 5 || sorted.at(-1).year < 2024) throw new Error(`${key}: fewer than five recent years`);
  const latest = sorted.at(-1).year;
  const recent = sorted.filter(({ year }) => year >= latest - 4);
  if (recent.length !== 5 || recent.some((row, index) => row.year !== latest - 4 + index)) {
    throw new Error(`${key}: recent fiscal years are not consecutive`);
  }
  return {
    points: recent,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
