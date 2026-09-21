import type { ReactNode } from "react";
import { resolveDataGapCopy } from "../lib/data-gap-copy";
import type {
  SupportConnectionData,
  SupportConnectionIndicator,
  SupportNetwork,
} from "../types/support-connection";
import GeographyChip from "./geography-chip";
import StoryAct from "./story-act";

const NETWORK_LABELS: Record<SupportNetwork, string> = {
  public_or_professional: "公的・専門的な支援",
  informal: "家族・友人・地域など身近な支え",
  mixed: "公的支援と身近な支え",
  none: "相談できる相手なし",
  unknown: "支援経路は不明",
};

function formatValue(indicator: SupportConnectionIndicator) {
  const latest = indicator.observations.at(-1);
  if (!latest) return null;
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
  return { ...latest, formatted: `${value}${unit}` };
}

export default function SupportConnectionSection({
  data,
  place,
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  data: SupportConnectionData;
  place: string;
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  if (!data.indicators.length && !data.gaps.length) return null;

  return (
    <StoryAct
      id={id}
      eyebrow={eyebrow}
      title={title}
      chip={<GeographyChip scope="municipality" label={place} />}
    >
      {children}
      <p>{lead}</p>

      {data.indicators.length ? (
        <table>
          <caption>支援への到達を示す指標</caption>
          <thead>
            <tr>
              <th scope="col">確認できること</th>
              <th scope="col">値</th>
              <th scope="col">対象・時点</th>
            </tr>
          </thead>
          <tbody>
            {data.indicators.map((indicator) => {
              const latest = formatValue(indicator);
              if (!latest) return null;
              return (
                <tr key={indicator.metricId}>
                  <th scope="row">
                    {indicator.label}
                    <small>（{NETWORK_LABELS[indicator.supportNetwork]}）</small>
                  </th>
                  <td>{latest.formatted}</td>
                  <td>
                    {latest.periodLabel}
                    {latest.sampleSize ? `・回答母数 n=${latest.sampleSize.toLocaleString("ja-JP")}` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}

      {data.indicators.map((indicator) => (
        <div className="act-note" key={`${indicator.metricId}-note`}>
          <p>
            <strong>{indicator.label}:</strong> {indicator.population}
          </p>
          {indicator.multipleResponse ? <p>複数回答のため、ほかの項目とは合算できません。</p> : null}
          {indicator.caveat ? <p>{indicator.caveat}</p> : null}
          <p>
            <a href={indicator.provenance.sourceUrl} target="_blank" rel="noopener noreferrer">
              出典を見る ↗
            </a>
          </p>
        </div>
      ))}

      {data.gaps.map((gap) => {
        const copy = resolveDataGapCopy(gap, { place, label: "支援への到達" });
        return (
          <div className="act-note act-pending" key={gap.id}>
            <p>
              <strong>{copy.title}</strong>
            </p>
            <p>{copy.body}</p>
            {gap.sourceUrl ? (
              <p>
                <a href={gap.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {gap.sourceLabel ?? "関連する原典"}を見る ↗
                </a>
              </p>
            ) : null}
          </div>
        );
      })}
    </StoryAct>
  );
}
