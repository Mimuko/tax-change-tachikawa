import type { ReactNode } from "react";
import { resolveDataGapCopy } from "../lib/data-gap-copy";
import type {
  SupportConnectionData,
  SupportConnectionIndicator,
} from "../types/support-connection";

type SupportConnectionFraming = {
  existence: { label: string; body: string };
  delivery: { label: string; body: string };
};

type SupportConnectionSectionProps = {
  data: SupportConnectionData;
  place: string;
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  framing: SupportConnectionFraming;
  readingNote?: string;
  children?: ReactNode;
};

function formatValue(indicator: SupportConnectionIndicator): string | null {
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
  return `${value}${unit}`;
}

function indicatorContextKey(indicator: SupportConnectionIndicator): string {
  return `${indicator.population}\u0000${indicator.provenance.definition}`;
}

function buildSharedIndicatorContext(indicators: SupportConnectionIndicator[]) {
  const groups = new Map<string, SupportConnectionIndicator[]>();
  for (const indicator of indicators) {
    const key = indicatorContextKey(indicator);
    groups.set(key, [...(groups.get(key) ?? []), indicator]);
  }

  const sharedGroups = [...groups.entries()].filter(([, group]) => group.length > 1);
  return {
    sharedKeys: new Set(sharedGroups.map(([key]) => key)),
    notes: sharedGroups.map(([, group]) => {
      const labels = group.map((indicator) => `「${indicator.label}」`).join("、");
      const first = group[0];
      return `${labels}は共通して、${first.population}。${first.provenance.definition}`;
    }),
  };
}

function indicatorMeaning(
  indicator: SupportConnectionIndicator,
  sharedKeys: Set<string>,
): string | null {
  if (sharedKeys.has(indicatorContextKey(indicator))) {
    return indicator.caveat ?? null;
  }
  const caveat = indicator.caveat ? ` ${indicator.caveat}` : "";
  return `${indicator.population}。${indicator.provenance.definition}${caveat}`;
}

function DataGapBlock({
  title,
  body,
  sourceUrl,
  sourceLabel,
}: {
  title: string;
  body: string;
  sourceUrl?: string;
  sourceLabel?: string;
}) {
  return (
    <aside className="sc-datagap" aria-label={title}>
      <p className="sc-datagap-title">
        <span className="sc-datagap-mark" aria-hidden="true">
          ?
        </span>
        {title}
      </p>
      <p className="sc-datagap-body">{body}</p>
      {sourceUrl ? (
        <p className="sc-source">
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            {sourceLabel ?? "関連する原典"}を見る ↗
          </a>
        </p>
      ) : null}
    </aside>
  );
}

export default function SupportConnectionSection({
  data,
  place,
  id,
  eyebrow,
  title,
  lead,
  framing,
  readingNote,
  children,
}: SupportConnectionSectionProps) {
  if (!data.indicators.length && !data.gaps.length) return null;

  const sources = Array.from(
    new Map(
      data.indicators.map((indicator) => [
        indicator.provenance.sourceUrl,
        indicator.provenance,
      ]),
    ).values(),
  );
  const sharedContext = buildSharedIndicatorContext(data.indicators);
  const readingNotes = [...sharedContext.notes, readingNote].filter(
    (note): note is string => Boolean(note),
  );

  return (
    <section id={id} className="support-connection sc-story">
      <div className="support-connection-inner">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="sc-title">{title}</h2>
        <p className="sc-lead">{lead}</p>
        {children}

        <div className="sc-story-framing">
          <p className="sc-story-framing-line sc-story-framing-line--exists">
            <span className="sc-story-framing-label">{framing.existence.label}</span>
            {framing.existence.body}
          </p>
          <p className="sc-story-framing-line sc-story-framing-line--delivery">
            <span className="sc-story-framing-label">{framing.delivery.label}</span>
            {framing.delivery.body}
          </p>
        </div>

        {data.indicators.length > 0 ? (
          <ol className="sc-story-steps" role="list">
            {data.indicators.map((indicator, index) => {
              const value = formatValue(indicator);
              const meaning = indicatorMeaning(indicator, sharedContext.sharedKeys);
              return (
                <li key={indicator.metricId} className="sc-story-step">
                  <span className="sc-story-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="sc-story-body">
                    <p className="sc-story-headline">
                      <span className="sc-story-value">
                        {value ?? <span className="sc-story-value--none">測定なし</span>}
                      </span>
                    </p>
                    <p className="sc-story-label">{indicator.label}</p>
                    {meaning ? <p className="sc-story-meaning">{meaning}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}

        {readingNotes.length ? <p className="sc-reading-note">{readingNotes.join(" ")}</p> : null}

        {data.gaps.length > 0 ? (
          <div className="sc-story-close">
            {data.gaps.map((gap) => {
              const copy = resolveDataGapCopy(gap, { place, label: "支援への到達" });
              return (
                <DataGapBlock
                  key={gap.id}
                  title={copy.title}
                  body={copy.body}
                  sourceUrl={gap.sourceUrl}
                  sourceLabel={gap.sourceLabel}
                />
              );
            })}
          </div>
        ) : null}

        {sources.length > 0 ? (
          <p className="sc-source">
            {sources.map((source, index) => (
              <span key={source.sourceUrl}>
                {index > 0 ? " / " : null}
                <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </section>
  );
}
