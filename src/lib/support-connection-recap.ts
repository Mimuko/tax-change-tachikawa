import type { SupportConnectionData } from "../types/support-connection";

export function formatSupportConnectionRecapItems(data: SupportConnectionData): string[] {
  return data.indicators.flatMap((indicator) => {
    const latest = indicator.observations.at(-1);
    if (!latest) return [];

    const value = latest.value.toLocaleString("ja-JP", {
      maximumFractionDigits: latest.unit === "percent" ? 1 : 0,
    });
    const unit =
      latest.unit === "percent"
        ? "%"
        : latest.unit === "cases"
          ? "件"
          : latest.unit === "households"
            ? "世帯"
            : "人";
    const sampleSize = latest.sampleSize
      ? `・回答母数 n=${latest.sampleSize.toLocaleString("ja-JP")}`
      : "";

    return [`${indicator.label} ${value}${unit}（${latest.periodLabel}${sampleSize}）`];
  });
}
