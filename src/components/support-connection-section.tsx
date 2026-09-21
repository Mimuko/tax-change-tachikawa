import type { ReactNode } from "react";
import type {
  ExistenceDeliveryFraming,
  SupportConnectionData,
  SupportConnectionDataGap,
  SupportConnectionIndicator,
} from "../lib/support-connection";

export type SupportConnectionVariant = "quiet" | "cards" | "story";

type SupportConnectionSectionProps = {
  data: SupportConnectionData;
  /** 表示の方向性。 */
  variant?: SupportConnectionVariant;
  /** アンカー用 id。 */
  id?: string;
};

function formatValue(indicator: SupportConnectionIndicator): string | null {
  if (indicator.value === null || !Number.isFinite(indicator.value)) return null;
  return `${indicator.value.toLocaleString("ja-JP")}${indicator.unit ?? "%"}`;
}

function Framing({
  framing,
  className,
}: {
  framing: ExistenceDeliveryFraming;
  className?: string;
}) {
  return (
    <div className={["sc-framing", className].filter(Boolean).join(" ")}>
      <div className="sc-framing-side sc-framing-side--exists">
        <p className="sc-framing-label">{framing.existence.label}</p>
        <p className="sc-framing-body">{framing.existence.body}</p>
      </div>
      <div className="sc-framing-divider" aria-hidden="true" />
      <div className="sc-framing-side sc-framing-side--delivery">
        <p className="sc-framing-label">{framing.delivery.label}</p>
        <p className="sc-framing-body">{framing.delivery.body}</p>
      </div>
    </div>
  );
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

function SectionShell({
  data,
  variantClass,
  id,
  children,
}: {
  data: SupportConnectionData;
  variantClass: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={["support-connection", variantClass].filter(Boolean).join(" ")}>
      <div className="support-connection-inner">
        <p className="eyebrow">{data.eyebrow}</p>
        <h2 className="sc-title">{data.title}</h2>
        <p className="sc-lead">{data.lead}</p>
        {children}
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

/* ------------------------------------------------------------------ */
/* Variant A — 静かな説明型                                            */
/* ------------------------------------------------------------------ */

function QuietVariant({ data, id }: { data: SupportConnectionData; id?: string }) {
  return (
    <SectionShell data={data} variantClass="sc-quiet" id={id}>
      <Framing framing={data.framing} />

      {data.indicators.length > 0 ? (
        <dl className="sc-quiet-list">
          {data.indicators.map((indicator) => {
            const value = formatValue(indicator);
            return (
              <div key={indicator.id} className="sc-quiet-item">
                <dt className="sc-quiet-term">
                  <span className="sc-quiet-basis">{indicator.basis}</span>
                  <span className="sc-quiet-label">{indicator.label}</span>
                </dt>
                <dd className="sc-quiet-desc">
                  <span className="sc-quiet-value">
                    {value ?? <span className="sc-quiet-value--none">測定なし</span>}
                  </span>
                  <span className="sc-quiet-meaning">
                    {value ? indicator.meaning : indicator.unavailableReason ?? indicator.meaning}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}

      {data.readingNote ? <p className="sc-reading-note">{data.readingNote}</p> : null}
      {data.dataGap ? <DataGapBlock gap={data.dataGap} /> : null}
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Variant B — 指標カード型                                            */
/* ------------------------------------------------------------------ */

function CardsVariant({ data, id }: { data: SupportConnectionData; id?: string }) {
  return (
    <SectionShell data={data} variantClass="sc-cards" id={id}>
      <Framing framing={data.framing} className="sc-framing--compact" />

      {data.indicators.length > 0 ? (
        <ul className="sc-card-grid" role="list">
          {data.indicators.map((indicator) => {
            const value = formatValue(indicator);
            return (
              <li key={indicator.id} className="sc-card">
                <p className="sc-card-basis">{indicator.basis}</p>
                <p className="sc-card-value">
                  {value ?? <span className="sc-card-value--none">測定なし</span>}
                </p>
                <p className="sc-card-label">{indicator.label}</p>
                <p className="sc-card-meaning">
                  {value ? indicator.meaning : indicator.unavailableReason ?? indicator.meaning}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}

      {data.readingNote ? <p className="sc-reading-note">{data.readingNote}</p> : null}
      {data.dataGap ? <DataGapBlock gap={data.dataGap} /> : null}
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Variant C — ストーリー型                                            */
/* ------------------------------------------------------------------ */

function StoryVariant({ data, id }: { data: SupportConnectionData; id?: string }) {
  return (
    <SectionShell data={data} variantClass="sc-story" id={id}>
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
                    {value ? (
                      <span className="sc-story-basis-inline">{indicator.basis}</span>
                    ) : null}
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
      ) : null}

      {data.readingNote ? <p className="sc-reading-note">{data.readingNote}</p> : null}
      {data.dataGap ? (
        <div className="sc-story-close">
          <DataGapBlock gap={data.dataGap} />
        </div>
      ) : null}
    </SectionShell>
  );
}

export default function SupportConnectionSection({
  data,
  variant = "quiet",
  id,
}: SupportConnectionSectionProps) {
  if (variant === "cards") return <CardsVariant data={data} id={id} />;
  if (variant === "story") return <StoryVariant data={data} id={id} />;
  return <QuietVariant data={data} id={id} />;
}
