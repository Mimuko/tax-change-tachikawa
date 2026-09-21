import type { SupportConnectionData } from "../types/support-connection";

export type SupportConnectionDetailItem = {
  id: "support-connection";
  title: "支援への接続";
  kind: "support-connection";
  placeLabel: string;
  data: SupportConnectionData;
};

export function buildSupportConnectionDetailItem(
  data: SupportConnectionData | undefined,
  placeLabel: string,
): SupportConnectionDetailItem | null {
  if (!data || (!data.indicators.length && !data.gaps.length)) return null;

  return {
    id: "support-connection",
    title: "支援への接続",
    kind: "support-connection",
    placeLabel,
    data,
  };
}
