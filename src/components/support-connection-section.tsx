import type {
  SupportConnectionData,
  SupportConnectionDataGap,
  SupportConnectionIndicator,
} from "../lib/support-connection";

type SupportConnectionSectionProps = {
  data: SupportConnectionData;
  /** アンカー用 id。 */
  id?: string;
};

function formatValue(indicator: SupportConnectionIndicator): string | null {
  if (indicator.value === null || !Number.isFinite(indicator.value)) return null;
  return `${indicator.value.toLocaleString("ja-JP")}${indicator.unit ?? "%"}`;
}

function DataGapBlock({ gap }: { gap: SupportConnectionDataGap }) {
  return (
    <aside className="sc-datagap" aria-label={gap.title}>
      <p className="sc-datagap-title">
        <span className="sc-datagap-mark" aria-hidden="true">
          ?
        </span>
        {gap.title}
      </p>
      <p className="sc-datagap-body">{gap.body}</p>
    </aside>
  );
}

/**
 * 「支援への接続」共通セクション（ストーリー型）。
 * 「制度はある → でも、つまずきがある → 全体像はまだ測れない」という流れで読ませ、
 * 最後の DataGap を結論として置く。
 */
export default function SupportConnectionSection({ data, id }: SupportConnectionSectionProps) {
  return (
    <section id={id} className="support-connection sc-story">
      <div className="support-connection-inner">
        <p className="eyebrow">{data.eyebrow}</p>
        <h2 className="sc-title">{data.title}</h2>
        <p className="sc-lead">{data.lead}</p>

        <div className="sc-story-framing">
          <p className="sc-story-framing-line sc-story-framing-line--exists">
            <span className="sc-story-framing-label">{data.framing.existence.label}</span>
            {data.framing.existence.body}
          </p>
          <p className="sc-story-framing-line sc-story-framing-line--delivery">
            <span className="sc-story-framing-label">{data.framing.delivery.label}</span>
            {data.framing.delivery.body}
          </p>
        </div>

        {data.indicators.length > 0 ? (
          <>
            {data.basisNote ? <p className="sc-story-basis-note">{data.basisNote}</p> : null}
            <ol className="sc-story-steps" role="list">
              {data.indicators.map((indicator, index) => {
                const value = formatValue(indicator);
                return (
                  <li key={indicator.id} className="sc-story-step">
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
                      <p className="sc-story-meaning">
                        {value ? indicator.meaning : indicator.unavailableReason ?? indicator.meaning}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        ) : null}

        {data.readingNote ? <p className="sc-reading-note">{data.readingNote}</p> : null}
        {data.dataGap ? (
          <div className="sc-story-close">
            <DataGapBlock gap={data.dataGap} />
          </div>
        ) : null}

        {data.source ? (
          <p className="sc-source">
            {data.source.href ? (
              <a href={data.source.href} target="_blank" rel="noopener noreferrer">
                {data.source.label}
              </a>
            ) : (
              data.source.label
            )}
          </p>
        ) : null}
      </div>
    </section>
  );
}
