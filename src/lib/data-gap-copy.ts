import type { DataGap, DataGapKind } from "../types/dashboard";

export type DataGapCopyOptions = {
  place: string;
  label: string;
};

export type DataGapCopy = {
  title: string;
  body: string;
};

type DataGapCopyTemplate = {
  title: string;
  body: string;
};

const KIND_DEFAULTS: Record<DataGapKind, DataGapCopyTemplate> = {
  not_published: {
    title: "{place}の{label}について、公表されているデータを確認できませんでした。",
    body: "今回は掲載していません。",
  },
  wrong_geography: {
    title: "{place}だけの{label}の年次推移を確認できるデータはありません。",
    body: "公表単位が{place}より広い地域の集計のため、その値は{place}の実績としては扱っていません。",
  },
  single_point_only: {
    title: "{label}は、今回は年次推移として掲載していません。",
    body: "公表されているのは単年または一点の値だけで、複数年を同じ条件で比較できません。",
  },
  definition_break: {
    title: "{label}は、今回は年次推移として掲載していません。",
    body: "途中で定義や集計方法が変わったため、同じ推移としてつなげていません。",
  },
  not_equivalent: {
    title: "名前の近い別指標は、{label}の代わりには使っていません。",
    body: "定義が異なるため、代替指標としては使用していません。",
  },
  incompatible_period: {
    title: "{label}は、他の指標と同じ期間としては示していません。",
    body: "基準日や期間の種別が異なるため、同じグラフには載せていません。",
  },
  unavailable_for_comparison: {
    title: "{place}の{label}データはありますが、今回は推移には掲載していません。",
    body: "複数年を同じ条件で比較できるか確認中です。",
  },
};

function fillTemplate(template: string, { place, label }: DataGapCopyOptions): string {
  return template.replaceAll("{place}", place).replaceAll("{label}", label);
}

export function resolveDataGapCopy(gap: DataGap, options: DataGapCopyOptions): DataGapCopy {
  const defaults = KIND_DEFAULTS[gap.kind];
  const title = fillTemplate(gap.title ?? defaults.title, options);
  const bodyBase = fillTemplate(gap.reason ?? defaults.body, options);
  const note = gap.note ? fillTemplate(gap.note, options) : null;
  const body = note ? `${bodyBase} ${note}` : bodyBase;
  return { title, body };
}

/** Interlude 以外で title + body を1段落として使うとき */
export function formatDataGapPublicText(copy: DataGapCopy): string {
  return `${copy.title} ${copy.body}`;
}
