import type { DataGap } from "../types/dashboard";

/** 誤読防止の注意書きは、gapメタデータが欠落しても残す。 */
export function resolveChildcareGaps(gaps: DataGap[]): { waitlist: DataGap; reach: DataGap } {
  return {
    waitlist: gaps.find((gap) => gap.id === "childcare_waitlist") ?? {
      id: "childcare_waitlist",
      kind: "not_published",
      title: "待機児童の変化は、この原表からは分かりません。",
      reason: "この原表には待機児童の年次系列がありません。",
      note: "定員と実施児童数の差は、待機児童数として扱いません。",
    },
    reach: gaps.find((gap) => gap.id === "childcare_support_reach_rate") ?? {
      id: "childcare_support_reach_rate",
      kind: "not_measurable",
      reason: "公表されているのは相談の延べ件数で、支援を必要とする家庭の総数は含まれていません。",
      note: "保育の実施児童数や定員を分母にして、支援が届いた割合を作ることはしていません。",
    },
  };
}
