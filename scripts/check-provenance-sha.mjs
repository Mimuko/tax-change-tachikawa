/**
 * コミット済み processed の provenance.sha256 を検証する。
 * generatedAt は毎回変わるため、SHA 突合で監査証跡のドリフトを検知する。
 */
import { resolve } from "node:path";
import { verifyCareProvenanceShas } from "./lib/provenance-sha.mjs";

const root = resolve(import.meta.dirname, "..");
const { ok, results } = await verifyCareProvenanceShas(root);

let failed = 0;
for (const row of results) {
  if (row.ok) {
    console.log(`ok ${row.dashboard}#${row.key} (${row.mode})`);
  } else {
    failed += 1;
    console.error(`${row.dashboard} provenance.${row.key}.sha256 mismatch (${row.mode})`);
    console.error(`  committed: ${row.actual ?? "(missing)"}`);
    console.error(`  expected:  ${row.expected ?? "(n/a)"}`);
    if (row.curatedSha !== undefined) {
      console.error(`  curated:   ${row.curatedSha ?? "(missing)"}`);
    }
    if (row.localSha !== undefined) {
      console.error(`  local file:${row.localSha}`);
    }
    if (row.rawPath) {
      console.error(`  raw path:  ${row.rawPath}`);
    }
  }
}

if (!ok) {
  console.error(`\n${failed} provenance SHA mismatch(es).`);
  console.error("For redistributable raw: run npm run data:build and commit processed JSON.");
  console.error("For local-only sources: align expectedSha256 / curated series / local file.");
  process.exit(1);
}

console.log("\nAll provenance SHAs match recorded expectations.");
