/**
 * base..HEAD の全コミットで、local-only 対象の原典バイナリが追加されていないことを検査する。
 * 現行ツリーだけでは「追加後に削除」を検知できないため、公開 PR 履歴の再発防止用。
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

/** 再配布許諾未確認のため Git に置いてはならないパス（追加差分を拒否） */
const FORBIDDEN_ADD_PATTERNS = [
  /^data\/raw\/nerima\/.+\.(xlsx|xls|pdf)$/i,
];

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function resolveBase() {
  if (process.env.HISTORY_BASE) return process.env.HISTORY_BASE;
  try {
    git(["rev-parse", "--verify", "origin/master"]);
    return "origin/master";
  } catch {
    return "master";
  }
}

const base = resolveBase();
const head = process.env.HISTORY_HEAD || "HEAD";
const range = `${base}..${head}`;

let addedFiles = [];
try {
  const out = git(["log", range, "--diff-filter=A", "--name-only", "--pretty=format:"]);
  addedFiles = [...new Set(out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
} catch (error) {
  console.error(`Failed to list added files for ${range}`);
  console.error(error.stderr?.toString?.() || error.message);
  process.exit(1);
}

const forbiddenAdds = addedFiles.filter((path) => FORBIDDEN_ADD_PATTERNS.some((re) => re.test(path)));

let objectHits = [];
try {
  const objects = git(["rev-list", "--objects", range]);
  objectHits = objects
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const space = line.indexOf(" ");
      return space === -1 ? null : line.slice(space + 1);
    })
    .filter((path) => path && FORBIDDEN_ADD_PATTERNS.some((re) => re.test(path)));
  objectHits = [...new Set(objectHits)];
} catch (error) {
  console.error(`Failed to list objects for ${range}`);
  console.error(error.stderr?.toString?.() || error.message);
  process.exit(1);
}

if (forbiddenAdds.length === 0 && objectHits.length === 0) {
  console.log(`ok: no local-only raw binaries in ${range}`);
  process.exit(0);
}

console.error(`local-only raw binaries found in history ${range}`);
if (forbiddenAdds.length) {
  console.error("\nAdded paths:");
  for (const path of forbiddenAdds) console.error(`  ${path}`);
}
if (objectHits.length) {
  console.error("\nObjects reachable from range:");
  for (const path of objectHits) console.error(`  ${path}`);
}
console.error(
  "\nRemove these blobs from the branch history (rewrite + force-push or open a clean PR).",
);
console.error("Do not rely on a later delete commit; the blob would remain publicly fetchable.");
process.exit(1);
