import test from "node:test";
import assert from "node:assert/strict";
import { resolveDataGapCopy } from "../src/lib/data-gap-copy.ts";

test("data-gap-copy: kind デフォルトのプレースホルダを展開する", () => {
  const copy = resolveDataGapCopy(
    { id: "g1", kind: "wrong_geography" },
    { place: "立川市", label: "不登校" },
  );
  assert.equal(copy.title, "立川市だけの不登校の年次推移を確認できるデータはありません。");
  assert.match(copy.body, /立川市より広い地域/);
  assert.equal(copy.body.includes("{place}"), false);
});

test("data-gap-copy: override 内のプレースホルダも展開する", () => {
  const copy = resolveDataGapCopy(
    {
      id: "g2",
      kind: "unavailable_for_comparison",
      title: "{label}（{place}）は今回掲載していません。",
      reason: "{place}のデータはありますが、{label}の比較条件は確認中です。",
      note: "{place}の値として代理には使っていません。",
    },
    { place: "立川市", label: "教育費" },
  );
  assert.equal(copy.title, "教育費（立川市）は今回掲載していません。");
  assert.equal(
    copy.body,
    "立川市のデータはありますが、教育費の比較条件は確認中です。 立川市の値として代理には使っていません。",
  );
});
