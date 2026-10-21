import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveChildcareGaps } from "../src/stories/childcare-copy.ts";
import { formatDataGapPublicText, resolveDataGapCopy } from "../src/lib/data-gap-copy.ts";
import type { DataGap } from "../src/types/dashboard.ts";

function copies(gaps: DataGap[]) {
  const resolved = resolveChildcareGaps(gaps);
  return {
    waitlist: resolveDataGapCopy(resolved.waitlist, { place: "立川市", label: "待機児童" }),
    reach: resolveDataGapCopy(resolved.reach, { place: "立川市", label: "相談の到達率" }),
  };
}

const data = JSON.parse(readFileSync("data/processed/tachikawa/childcare/dashboard.json", "utf8"));

test("保育の注意書きはgapの順序と欠落に依存しない", () => {
  const expected = copies(data.gaps);
  assert.deepEqual(copies([...data.gaps].reverse()), expected);
  for (const gaps of [[], data.gaps.slice(0, 1), data.gaps.slice(1)]) {
    assert.deepEqual(copies(gaps), expected);
  }
  assert.match(formatDataGapPublicText(expected.waitlist), /分かりません。 この原表/);
  assert.match(expected.waitlist.body, /差は、待機児童数として扱いません/);
  assert.match(expected.reach.body, /分母にして/);
});

test("保育の注意書きは生成元のタイトル・理由・注記を尊重する", () => {
  const copy = copies([
    { id: "childcare_waitlist", kind: "not_published", title: "原表の説明。", reason: "原表の理由。", note: "注記。" },
  ]);
  assert.deepEqual(copy.waitlist, { title: "原表の説明。", body: "原表の理由。 注記。" });
});
