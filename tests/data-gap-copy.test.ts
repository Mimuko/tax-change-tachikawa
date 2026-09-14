import test from "node:test";
import assert from "node:assert/strict";
import { resolveDataGapCopy } from "../src/lib/data-gap-copy.ts";

test("data-gap-copy: kind デフォルトのプレースホルダを展開する", () => {
  const copy = resolveDataGapCopy(
    { id: "g1", kind: "wrong_geography" },
    { place: "立川市", label: "不登校" },
  );
  assert.equal(copy.title, "不登校は、この街の年次変化としては並べられない。");
  assert.match(copy.body, /立川市より広い地域/);
  assert.equal(copy.body.includes("{place}"), false);
});

test("data-gap-copy: override 内のプレースホルダも展開する", () => {
  const copy = resolveDataGapCopy(
    {
      id: "g2",
      kind: "unavailable_for_comparison",
      title: "{label}（{place}）は今回示していません。",
      reason: "{place}の表はあるが、{label}の連続確認が未了です。",
      note: "{place}では代理しません。",
    },
    { place: "立川市", label: "教育費" },
  );
  assert.equal(copy.title, "教育費（立川市）は今回示していません。");
  assert.equal(
    copy.body,
    "立川市の表はあるが、教育費の連続確認が未了です。 立川市では代理しません。",
  );
});
