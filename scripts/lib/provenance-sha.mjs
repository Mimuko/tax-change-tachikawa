/**
 * processed dashboard の provenance.sha256 を検証する。
 * - 再配布可能な raw: リポジトリ内ファイルの実バイトと突合
 * - local-only 原典: 記録した expectedSha256 と突合（ファイルがあれば実バイトも確認）
 */
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function sha256Of(root, relativePath) {
  const bytes = await readFile(resolve(root, relativePath));
  return createHash("sha256").update(bytes).digest("hex");
}

async function loadJson(root, relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}

async function fileExists(root, relativePath) {
  try {
    await access(resolve(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function loadCareProvenanceChecks(root) {
  const nerima = await loadJson(root, "config/data-sources/nerima/care.json");
  const stats = nerima.statsBook;
  const recorded = {
    kind: "recorded-sha",
    expectedSha256: stats.expectedSha256,
    localPath: stats.localPath,
    curatedPath: stats.curatedSeriesPath,
  };
  return [
    {
      dashboard: "data/processed/tachikawa/care/dashboard.json",
      series: {
        insured: { kind: "raw-file", path: "data/raw/tachikawa/care/insured.csv" },
        certified: { kind: "raw-file", path: "data/raw/tachikawa/care/certified.csv" },
        benefits: { kind: "raw-file", path: "data/raw/tachikawa/care/benefits.csv" },
        premiumRevenue: { kind: "raw-file", path: "data/raw/tachikawa/care/premium-revenue.csv" },
      },
    },
    {
      dashboard: "data/processed/nerima/care/dashboard.json",
      series: {
        insured: recorded,
        certified: recorded,
        benefits: recorded,
      },
    },
  ];
}

/**
 * @returns {{ ok: boolean, results: Array<object> }}
 */
export async function verifyCareProvenanceShas(root, checks) {
  const resolvedChecks = checks ?? (await loadCareProvenanceChecks(root));
  const results = [];
  for (const check of resolvedChecks) {
    const data = await loadJson(root, check.dashboard);
    for (const [key, spec] of Object.entries(check.series)) {
      const actual = data.provenance?.[key]?.sha256;
      if (spec.kind === "raw-file") {
        const expected = await sha256Of(root, spec.path);
        const ok = actual === expected;
        results.push({
          dashboard: check.dashboard,
          key,
          ok,
          expected,
          actual,
          rawPath: spec.path,
          mode: "raw-file",
        });
        continue;
      }

      if (spec.kind === "recorded-sha") {
        const curated = await loadJson(root, spec.curatedPath);
        const curatedSha = curated.source?.sha256;
        let ok = actual === spec.expectedSha256 && curatedSha === spec.expectedSha256;
        let localSha;
        if (await fileExists(root, spec.localPath)) {
          localSha = await sha256Of(root, spec.localPath);
          ok = ok && localSha === spec.expectedSha256;
        }
        results.push({
          dashboard: check.dashboard,
          key,
          ok,
          expected: spec.expectedSha256,
          actual,
          curatedSha,
          localSha,
          rawPath: spec.localPath,
          mode: "recorded-sha",
        });
        continue;
      }

      results.push({
        dashboard: check.dashboard,
        key,
        ok: false,
        actual,
        mode: `unknown:${spec.kind ?? "missing"}`,
      });
    }
  }
  return { ok: results.every((row) => row.ok), results };
}
