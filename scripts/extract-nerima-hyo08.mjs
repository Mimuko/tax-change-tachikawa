/**
 * ローカルの hyo08.xlsx から curated の加工済み系列を再生成する。
 * 原典 XLSX は再配布不可のため Git に含めない。取得手順は data/raw/nerima/care/README.md。
 */
import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseNerimaHyo08 } from "./lib/parse-nerima-hyo08.mjs";

const root = resolve(import.meta.dirname, "..");
const curatedPath = resolve(root, "data/curated/nerima/care/stats-book-series.json");
const dataSources = JSON.parse(
  await readFile(resolve(root, "config/data-sources/nerima/care.json"), "utf8"),
);
const stats = dataSources.statsBook;
const localPath = resolve(root, stats.localPath);

try {
  await access(localPath);
} catch {
  console.error(`Missing local source: ${stats.localPath}`);
  console.error("See data/raw/nerima/care/README.md for fetch instructions.");
  process.exit(1);
}

const bytes = await readFile(localPath);
const sha256 = createHash("sha256").update(bytes).digest("hex");
if (sha256 !== stats.expectedSha256) {
  console.error(`SHA-256 mismatch for ${stats.localPath}`);
  console.error(`  expected: ${stats.expectedSha256}`);
  console.error(`  actual:   ${sha256}`);
  console.error("Update expectedSha256 in config and curated only after re-audit.");
  process.exit(1);
}

const parsed = await parseNerimaHyo08(localPath, stats.sheets);
const previous = JSON.parse(await readFile(curatedPath, "utf8"));
const next = {
  ...previous,
  source: {
    ...previous.source,
    pageUrl: dataSources.sourcePage,
    fileUrl: stats.url,
    fileName: stats.file,
    localPath: stats.localPath,
    sha256,
    sitePolicyUrl: dataSources.sitePolicyUrl ?? previous.source.sitePolicyUrl,
    redistribution: "local-only",
  },
  sheets: stats.sheets,
  series: {
    insured: parsed.insured,
    certified: parsed.certified,
    benefits: parsed.benefits,
  },
};

await writeFile(curatedPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
console.log(`Wrote ${curatedPath}`);
console.log(`sha256 ${sha256}`);
