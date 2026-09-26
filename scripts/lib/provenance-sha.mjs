/**
 * processed dashboard の provenance.sha256 が raw 実バイトと一致するか検証する。
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const CARE_PROVENANCE_CHECKS = [
  {
    dashboard: "data/processed/tachikawa/care/dashboard.json",
    series: {
      insured: "data/raw/tachikawa/care/insured.csv",
      certified: "data/raw/tachikawa/care/certified.csv",
      benefits: "data/raw/tachikawa/care/benefits.csv",
      premiumRevenue: "data/raw/tachikawa/care/premium-revenue.csv",
    },
  },
  {
    dashboard: "data/processed/nerima/care/dashboard.json",
    series: {
      insured: "data/raw/nerima/care/hyo08.xlsx",
      certified: "data/raw/nerima/care/hyo08.xlsx",
      benefits: "data/raw/nerima/care/hyo08.xlsx",
    },
  },
];

async function sha256Of(root, relativePath) {
  const bytes = await readFile(resolve(root, relativePath));
  return createHash("sha256").update(bytes).digest("hex");
}

async function loadJson(root, relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}

/**
 * @returns {{ ok: boolean, results: Array<{ dashboard: string, key: string, ok: boolean, expected?: string, actual?: string, rawPath?: string }> }}
 */
export async function verifyCareProvenanceShas(root, checks = CARE_PROVENANCE_CHECKS) {
  const results = [];
  for (const check of checks) {
    const data = await loadJson(root, check.dashboard);
    for (const [key, rawPath] of Object.entries(check.series)) {
      const expected = await sha256Of(root, rawPath);
      const actual = data.provenance?.[key]?.sha256;
      const ok = actual === expected;
      results.push({
        dashboard: check.dashboard,
        key,
        ok,
        expected,
        actual,
        rawPath,
      });
    }
  }
  return { ok: results.every((row) => row.ok), results };
}
