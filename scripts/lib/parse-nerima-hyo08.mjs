/**
 * 練馬区統計書 hyo08.xlsx（表110）から介護系列を抽出する。
 * 表110(1)(3)(5)(7) の行位置は R7 版 hyo08.xlsx 監査時点の固定レイアウトを前提とする。
 */
import { readFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";

function colRow(ref) {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return [ref, 0];
  return [match[1], Number(match[2])];
}

async function readZipEntries(path) {
  const buffer = await readFile(path);
  const entries = new Map();
  let offset = 0;
  while (offset < buffer.length - 4) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;
    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLength);
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const payload = compression === 0 ? compressed : inflateRawSync(compressed);
    entries.set(fileName, payload);
    offset = dataStart + compressedSize;
  }
  return entries;
}

function readSharedStrings(zipEntries) {
  const xml = zipEntries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const sharedStrings = [];
  for (const match of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts = [...match[1].matchAll(/<t(?:[^>]*)>([\s\S]*?)<\/t>/g)].map((part) => part[1]);
    sharedStrings.push(parts.join("").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
  }
  return sharedStrings;
}

function readSheetMap(zipEntries) {
  const relsText = zipEntries.get("xl/_rels/workbook.xml.rels")?.toString("utf8") ?? "";
  const ridToTarget = new Map();
  for (const match of relsText.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    ridToTarget.set(match[1], match[2].replace(/^\//, ""));
  }
  const wbText = zipEntries.get("xl/workbook.xml")?.toString("utf8") ?? "";
  const sheetMap = new Map();
  for (const match of wbText.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    const target = ridToTarget.get(match[2]);
    if (target) sheetMap.set(match[1], target.startsWith("xl/") ? target : `xl/${target}`);
  }
  return sheetMap;
}

function readSheetCells(xmlText, sharedStrings) {
  const cells = new Map();
  for (const match of xmlText.matchAll(/<c[^>]*r="([^"]+)"([^>]*)>([\s\S]*?)<\/c>/g)) {
    const [, ref, attrs, body] = match;
    const valueMatch = body.match(/<v>([\s\S]*?)<\/v>/);
    if (!valueMatch) continue;
    let value = valueMatch[1];
    if (/t="s"/.test(attrs)) value = sharedStrings[Number(value)] ?? value;
    const [col, row] = colRow(ref);
    if (!cells.has(row)) cells.set(row, new Map());
    cells.get(row).set(col, value);
  }
  return cells;
}

function numberAt(cells, row, col) {
  const raw = cells.get(row)?.get(col);
  const value = Number(String(raw ?? "").replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function leadingRowTotal(cells, row, firstRow) {
  if (row === firstRow) return numberAt(cells, row, "K");
  return numberAt(cells, row, "H") ?? numberAt(cells, row, "G");
}

function blockTotal(cells, row, firstRow) {
  return numberAt(cells, row, row === firstRow ? "J" : "G");
}

function extractInsured(cells) {
  const rows = [9, 10, 11, 12, 13];
  return rows.map((row, index) => ({
    year: 2020 + index,
    value: numberAt(cells, row, "P"),
  }));
}

function extractCertified(cells) {
  const rows = [21, 22, 23, 24, 25];
  const firstRow = rows[0];
  return rows.map((row, index) => ({
    year: 2020 + index,
    value: leadingRowTotal(cells, row, firstRow),
    secondInsured: numberAt(cells, row, "T") ?? undefined,
  }));
}

function extractBenefitsFromSheet(cells) {
  const homeRows = [9, 10, 11, 12, 13];
  const facilityRows = [39, 40, 41, 42, 43];
  const communityRows = [49, 50, 51, 52, 53];
  const otherRows = [69, 70, 71, 72, 73];
  return homeRows.map((row, index) => {
    const home = blockTotal(cells, row, homeRows[0]) ?? 0;
    const facility = blockTotal(cells, facilityRows[index], facilityRows[0]) ?? 0;
    const community = blockTotal(cells, communityRows[index], communityRows[0]) ?? 0;
    const otherRow = otherRows[index];
    const high = blockTotal(cells, otherRow, otherRows[0]) ?? 0;
    const review = numberAt(cells, otherRow, "N") ?? 0;
    const tokutei = numberAt(cells, otherRow, "W") ?? 0;
    return { year: 2020 + index, value: (home + facility + community + high + review + tokutei) * 1000 };
  });
}

function extractPremiumRevenue(cells) {
  const rows = [66, 67, 68, 69, 70];
  const firstRow = rows[0];
  return rows.map((row, index) => ({
    year: 2020 + index,
    value: leadingRowTotal(cells, row, firstRow),
  }));
}

function assertFivePoints(label, rows) {
  if (rows.length !== 5 || rows.some((row) => row.value == null)) {
    throw new Error(`${label}: expected 5 comparable points, got ${JSON.stringify(rows)}`);
  }
}

export async function parseNerimaHyo08(path, sheetNames) {
  const zipEntries = await readZipEntries(path);
  const sharedStrings = readSharedStrings(zipEntries);
  const sheetMap = readSheetMap(zipEntries);

  const readSheet = (name) => {
    const entry = sheetMap.get(name);
    if (!entry) throw new Error(`Sheet not found: ${name}`);
    const xml = zipEntries.get(entry)?.toString("utf8");
    if (!xml) throw new Error(`Sheet payload missing: ${name}`);
    return readSheetCells(xml, sharedStrings);
  };

  const insured = extractInsured(readSheet(sheetNames.insured));
  const certified = extractCertified(readSheet(sheetNames.certified));
  const benefits = extractBenefitsFromSheet(readSheet(sheetNames.benefits));
  const premiumRevenue = extractPremiumRevenue(readSheet(sheetNames.insured));

  for (const [label, rows] of [
    ["insured", insured],
    ["certified", certified],
    ["benefits", benefits],
    ["premiumRevenue", premiumRevenue],
  ]) {
    assertFivePoints(label, rows);
  }

  return { insured, certified, benefits, premiumRevenue };
}
