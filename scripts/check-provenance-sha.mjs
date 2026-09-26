/**
 * コミット済み processed の provenance.sha256 が raw 実バイトと一致することを検証する。
 * generatedAt は毎回変わるため、SHA 突合で監査証跡のドリフトを検知する。
 */
import { resolve } from "node:path";
import { verifyCareProvenanceShas } from "./lib/provenance-sha.mjs";

const root = resolve(import.meta.dirname, "..");
const { ok, results } = await verifyCareProvenanceShas(root);

let failed = 0;
for (const row of results) {
  if (row.ok) {
    console.log(`ok ${row.dashboard}#${row.key}`);
  } else {
    failed += 1;
    console.error(`${row.dashboard} provenance.${row.key}.sha256 mismatch`);
    console.error(`  committed: ${row.actual ?? "(missing)"}`);
    console.error(`  raw file:  ${row.expected}`);
    console.error(`  raw path:  ${row.rawPath}`);
  }
}

if (!ok) {
  console.error(`\n${failed} provenance SHA mismatch(es). Run npm run data:build and commit processed JSON.`);
  console.error("If on Windows, ensure data/raw/** is checked out without CRLF conversion (.gitattributes).");
  process.exit(1);
}

console.log("\nAll provenance SHAs match raw bytes.");
