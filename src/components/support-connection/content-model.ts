/**
 * 「支援への接続」共通セクションのコンテンツ・モデル。
 *
 * 目的は2つの問いを分けて可視化すること:
 *   1. provision  … 制度・予算・サービスが「存在する」か
 *   2. reach      … それが必要な人に「届いている」か
 *
 * どのテーマ（介護・教育・子育て・障害福祉・生活困窮 …）でも、この同じ型に
 * 中身を差し替えて使う。指標数が増減しても、DataGap しか無くても成立する。
 *
 * 重要な前提（すべての variant が守る）:
 *   - 未利用＝問題 とは言い切らない
 *   - 支援を利用していない人＝未接続 とは言い切らない
 *   - 複数回答の障壁を足し合わせて「未接続率」にはしない
 *   - 接続状況を測れない場合は、そのこと自体を情報として表示する
 */

export type ProvisionStatus = "exists" | "expanding" | "unknown";

/** 「存在する」側の事実。数値の断定ではなく状態を示す。 */
export type ProvisionFact = {
  id: string;
  label: string;
  detail: string;
  status: ProvisionStatus;
};

export type ReachUnit = "percent" | "persons" | "cases";

/**
 * 「届いているか」側の指標。
 * value が null のときは「この項目は測れていない」ことを表す。
 */
export type ReachBarrier = {
  id: string;
  label: string;
  /** 表示例の値。測定できない場合は null。 */
  value: number | null;
  unit: ReachUnit;
  /** この数字が「示さないこと」。誤読を防ぐ一文。 */
  doesNotMean: string;
};

export type ReachDataGap = {
  id: string;
  title: string;
  body: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type SupportConnectionContent = {
  theme: string;
  place: string;
  /** 「存在する」側の一文サマリ。 */
  provisionSummary: string;
  /** 「届いているか」側の一文サマリ。 */
  reachSummary: string;
  provision: ProvisionFact[];
  /** 障壁指標が共有する母集団の説明（複数回答である旨を含む）。 */
  populationScope: string;
  barriers: ReachBarrier[];
  /** 合算・単純化への注意。 */
  combineWarning: string;
  gaps: ReachDataGap[];
  /** UI 検討用の仮値かどうか。true のとき各値に「表示例」を付す。 */
  isSample: boolean;
};

export const PROVISION_STATUS_LABEL: Record<ProvisionStatus, string> = {
  exists: "用意されている",
  expanding: "増えている",
  unknown: "確認中",
};

const REACH_UNIT_SUFFIX: Record<ReachUnit, string> = {
  percent: "%",
  persons: "人",
  cases: "件",
};

export function formatReachValue(barrier: ReachBarrier): string | null {
  if (barrier.value === null) return null;
  const digits = barrier.unit === "percent" ? 1 : 0;
  return `${barrier.value.toLocaleString("ja-JP", { maximumFractionDigits: digits })}${REACH_UNIT_SUFFIX[barrier.unit]}`;
}

/**
 * 介護テーマの表示サンプル。
 * 数値はレイアウト確認のための仮の値であり、公表された実データではない。
 */
export const careSampleContent: SupportConnectionContent = {
  theme: "介護",
  place: "立川市",
  provisionSummary: "介護保険の制度も、給付も、サービスの提供体制も「ある」。",
  reachSummary: "ただし、それが必要な人にきちんと届いているかは、別の問いです。",
  provision: [
    {
      id: "benefit",
      label: "介護保険サービスの給付",
      detail: "給付は続き、総額も年々増えています（本編 Act 1 参照）。",
      status: "expanding",
    },
    {
      id: "capacity",
      label: "市内で提供されるサービスの量",
      detail: "提供されるサービスの単位数も増えています（本編 Act 2 参照）。",
      status: "expanding",
    },
    {
      id: "window",
      label: "相談・手続きの窓口",
      detail: "地域包括支援センターなど、制度上の相談先は用意されています。",
      status: "exists",
    },
  ],
  populationScope:
    "在宅の要支援・要介護認定者のうち、介護保険サービスを利用していない人が挙げた「利用しない理由」です（複数回答）。",
  barriers: [
    {
      id: "unavailable",
      label: "利用したいサービスが利用できない・身近にない",
      value: 21.4,
      unit: "percent",
      doesNotMean: "供給や立地の問題を指すもので、本人が支援を必要としていないことを意味するわけではありません。",
    },
    {
      id: "navigation",
      label: "手続きや利用方法が分からない",
      value: 15.8,
      unit: "percent",
      doesNotMean: "情報や案内が届いていない可能性を示すもので、制度が無いことを意味するわけではありません。",
    },
    {
      id: "cost",
      label: "利用料を支払うのが難しい",
      value: 11.2,
      unit: "percent",
      doesNotMean: "費用が障壁になっている人がいることを示すもので、全員の負担感を表すわけではありません。",
    },
  ],
  combineWarning:
    "これらは同じ人が複数選べる「複数回答」です。足し合わせて「未接続率」とは表現できません。また「利用していない＝支援が必要なのに届いていない」とも限りません。",
  gaps: [
    {
      id: "reach-total",
      title: "地域全体で何人に支援が届いているかは、この数字では分かりません。",
      body: "上の割合は「サービスを利用していない人が挙げた理由の内訳」です。支援を必要とする人が地域に何人いて、そのうち何人が実際に相談や制度につながれたのかを、分けて確認できる公表データは見つかっていません。",
      sourceLabel: "立川市 介護保険事業計画・ニーズ調査",
      sourceUrl: "https://www.city.tachikawa.lg.jp/",
    },
  ],
  isSample: true,
};
