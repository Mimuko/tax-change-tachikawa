/**
 * 練馬区統計書 hyo08.xlsx（表110）から介護系列を抽出する。
 * 表110(1)(5)(7) の行位置は R7 版 hyo08.xlsx 監査時点の固定レイアウトを前提とする。
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
  const rowMap = cells.get(row);
  if (!rowMap?.has(col)) return null;
  const raw = rowMap.get(col);
  if (raw == null || String(raw).trim() === "" || String(raw).trim() === "-") return null;
  const value = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function requireAt(cells, row, col, label) {
  const value = numberAt(cells, row, col);
  if (value == null) {
    throw new Error(`${label}: missing or invalid cell at row ${row} col ${col}`);
  }
  return value;
}

function leadingRowTotal(cells, row, firstRow, label) {
  if (row === firstRow) return requireAt(cells, row, "K", `${label} total`);
  const primary = numberAt(cells, row, "H");
  if (primary != null) return primary;
  return requireAt(cells, row, "G", `${label} total`);
}

function blockTotal(cells, row, firstRow, label) {
  return requireAt(cells, row, row === firstRow ? "J" : "G", label);
}

function extractInsured(cells) {
  const rows = [9, 10, 11, 12, 13];
  return rows.map((row, index) => {
    const value = requireAt(cells, row, "P", "insured");
    if (value < 150_000 || value > 200_000) {
      throw new Error(`insured: unexpected value ${value} at row ${row}`);
    }
    return { year: 2020 + index, value };
  });
}

function extractCertified(cells) {
  const rows = [21, 22, 23, 24, 25];
  const firstRow = rows[0];
  return rows.map((row, index) => {
    const value = leadingRowTotal(cells, row, firstRow, "certified");
    if (value < 30_000 || value > 50_000) {
      throw new Error(`certified: unexpected value ${value} at row ${row}`);
    }
    const secondInsured = numberAt(cells, row, "T");
    return {
      year: 2020 + index,
      value,
      ...(secondInsured != null ? { secondInsured } : {}),
    };
  });
}

function extractBenefitsFromSheet(cells) {
  const homeRows = [9, 10, 11, 12, 13];
  const facilityRows = [39, 40, 41, 42, 43];
  const communityRows = [49, 50, 51, 52, 53];
  const otherRows = [69, 70, 71, 72, 73];
  const labels = ["home", "facility", "community", "highCost", "reviewFee", "specificAdmission"];

  return homeRows.map((row, index) => {
    const home = blockTotal(cells, row, homeRows[0], `benefits.${labels[0]}`);
    const facility = blockTotal(cells, facilityRows[index], facilityRows[0], `benefits.${labels[1]}`);
    const community = blockTotal(cells, communityRows[index], communityRows[0], `benefits.${labels[2]}`);
    const otherRow = otherRows[index];
    const highCost = blockTotal(cells, otherRow, otherRows[0], `benefits.${labels[3]}`);
    const reviewFee = requireAt(cells, otherRow, "N", `benefits.${labels[4]}`);
    const specificAdmission = requireAt(cells, otherRow, "W", `benefits.${labels[5]}`);
    const totalThousands = home + facility + community + highCost + reviewFee + specificAdmission;
    if (totalThousands < 50_000_000) {
      throw new Error(`benefits: unexpectedly low total ${totalThousands} at year index ${index}`);
    }
    return {
      year: 2020 + index,
      value: totalThousands * 1000,
      components: {
        homeServicesThousandYen: home,
        facilityServicesThousandYen: facility,
        communityServicesThousandYen: community,
        highCostServicesThousandYen: highCost,
        reviewFeeThousandYen: reviewFee,
        specificAdmissionThousandYen: specificAdmission,
      },
    };
  });
}

function assertFivePoints(label, rows) {
  if (rows.length !== 5 || rows.some((row) => row.value == null)) {
    throw new Error(`${label}: expected 5 comparable points, got ${JSON.stringify(rows)}`);
  }
}

function validateLayout(cellsBySheet, sheetNames) {
  requireAt(cellsBySheet.insured, 9, "P", "layout.insured anchor");
  requireAt(cellsBySheet.certified, 21, "K", "layout.certified anchor");
  requireAt(cellsBySheet.benefits, 9, "J", "layout.benefits home anchor");
  requireAt(cellsBySheet.benefits, 39, "J", "layout.benefits facility anchor");
  if (!sheetNames.insured || !sheetNames.certified || !sheetNames.benefits) {
    throw new Error("layout: sheet mapping incomplete");
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

  const cellsBySheet = {
    insured: readSheet(sheetNames.insured),
    certified: readSheet(sheetNames.certified),
    benefits: readSheet(sheetNames.benefits),
  };
  validateLayout(cellsBySheet, sheetNames);

  const insured = extractInsured(cellsBySheet.insured);
  const certified = extractCertified(cellsBySheet.certified);
  const benefits = extractBenefitsFromSheet(cellsBySheet.benefits);

  for (const [label, rows] of [
    ["insured", insured],
    ["certified", certified],
    ["benefits", benefits],
  ]) {
    assertFivePoints(label, rows);
  }

  return { insured, certified, benefits };
}
