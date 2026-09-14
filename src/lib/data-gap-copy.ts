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
    title: "{label}は、公開されている表では確認できていません。",
    body: "原典を確認しましたが、{place}の値を掲載している表は見当たりませんでした。",
  },
  wrong_geography: {
    title: "{label}は、この街の年次変化としては並べられない。",
    body: "公開されている表は、{place}より広い地域の集計です。その値を{place}の実績にはしません。",
  },
  single_point_only: {
    title: "{label}は、年次の変化としては示していません。",
    body: "公開されているのは単年または一点の値だけです。推移の比較には使いません。",
  },
  definition_break: {
    title: "{label}は、年次の変化としては示していません。",
    body: "途中で定義や集計方法が変わったため、同じ系列として並べません。",
  },
  not_equivalent: {
    title: "{label}は、この指標と同じ意味では扱いません。",
    body: "名前は近い別の指標です。代理にはしません。",
  },
  incompatible_period: {
    title: "{label}は、他の指標と同じ期間としては示していません。",
    body: "基準日や期間の種別が異なるため、同一のグラフには載せません。",
  },
  unavailable_for_comparison: {
    title: "{label}は、いまは年次の変化として示していません。",
    body: "原典に{place}の表はあります。同じ定義で複数年を並べられることの確認が終わっていないため、本編の推移には載せていません。",
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
