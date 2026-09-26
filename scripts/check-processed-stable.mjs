/**
 * data:build 後に processed dashboard が generatedAt 以外でドリフトしていないことを検証する。
 * provenance SHA / 系列値のコミット漏れを CI で検知する。
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const targets = [
  "data/processed/tachikawa/care/dashboard.json",
  "data/processed/nerima/care/dashboard.json",
];

function significantDiffLines(diffText) {
  return diffText.split(/\r?\n/).filter((line) => {
    if (!line.startsWith("+") && !line.startsWith("-")) return false;
    if (line.startsWith("+++") || line.startsWith("---")) return false;
    if (/"generatedAt"\s*:/.test(line)) return false;
    return true;
  });
}

let failed = 0;
for (const relativePath of targets) {
  const diff = execFileSync("git", ["diff", "--", relativePath], {
    cwd: root,
    encoding: "utf8",
  });
  if (!diff.trim()) {
    console.log(`ok ${relativePath} (no diff)`);
    continue;
  }
  const significant = significantDiffLines(diff);
  if (significant.length === 0) {
    console.log(`ok ${relativePath} (generatedAt-only drift)`);
    continue;
  }
  failed += 1;
  console.error(`${relativePath} drifted beyond generatedAt after data:build:`);
  for (const line of significant.slice(0, 40)) {
    console.error(`  ${line}`);
  }
}

if (failed > 0) {
  console.error(
    `\n${failed} processed file(s) changed after data:build. Commit regenerated JSON (or fix raw/SHA).`,
  );
  process.exit(1);
}

console.log("\nProcessed care dashboards are stable (ignoring generatedAt).");
