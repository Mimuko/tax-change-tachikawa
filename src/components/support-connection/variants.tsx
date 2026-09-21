import type { ReactNode } from "react";
import {
  formatReachValue,
  PROVISION_STATUS_LABEL,
  type ProvisionFact,
  type ReachBarrier,
  type ReachDataGap,
  type SupportConnectionContent,
} from "./content-model";

function SampleTag({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="sc-sample-tag">表示例</span>;
}

function GapSource({ gap }: { gap: ReachDataGap }) {
  if (!gap.sourceUrl) return null;
  return (
    <p className="sc-gap-source">
      <a href={gap.sourceUrl} target="_blank" rel="noopener noreferrer">
        {gap.sourceLabel ?? "関連する原典"}を見る ↗
      </a>
    </p>
  );
}

function SectionHead({
  content,
  titleId,
}: {
  content: SupportConnectionContent;
  titleId: string;
}) {
  return (
    <header className="sc-head">
      <p className="eyebrow">
        支援への接続 — {content.place}・{content.theme}
      </p>
      <h2 id={titleId} className="sc-title">
        サービスがあることと、届いていることは、別。
      </h2>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* 案A — 静かな説明型                                                   */
/* ------------------------------------------------------------------ */

export function QuietVariant({ content }: { content: SupportConnectionContent }) {
  return (
    <section className="sc sc-quiet" aria-labelledby="sc-quiet-title">
      <div className="sc-quiet-inner">
        <p className="eyebrow">支援への接続 — {content.place}・{content.theme}</p>
        <h2 id="sc-quiet-title" className="sc-title">
          サービスがあることと、届いていることは、別。
        </h2>

        <div className="sc-quiet-split">
          <div className="sc-quiet-side">
            <span className="sc-side-label">あるもの</span>
            <p>{content.provisionSummary}</p>
            <ul className="sc-quiet-provision">
              {content.provision.map((fact: ProvisionFact) => (
                <li key={fact.id}>
                  <span>{fact.label}</span>
                  <small>{fact.detail}</small>
                </li>
              ))}
            </ul>
          </div>
          <div className="sc-quiet-side">
            <span className="sc-side-label sc-side-label--reach">届いているか</span>
            <p>{content.reachSummary}</p>
            <p className="sc-quiet-scope">{content.populationScope}</p>
          </div>
        </div>

        {content.barriers.length ? (
          <dl className="sc-quiet-list">
            {content.barriers.map((barrier: ReachBarrier) => {
              const value = formatReachValue(barrier);
              return (
                <div className="sc-quiet-row" key={barrier.id}>
                  <dt>{barrier.label}</dt>
                  <dd>
                    <span className="sc-quiet-value">
                      {value ?? "—"}
                      <SampleTag show={content.isSample && value !== null} />
                    </span>
                    <span className="sc-quiet-means">
                      {value === null ? "この項目を測れる公表データは確認できていません。" : barrier.doesNotMean}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}

        <p className="sc-quiet-warning">{content.combineWarning}</p>

        {content.gaps.map((gap) => (
          <div className="act-note act-pending" key={gap.id}>
            <p>
              <strong>{gap.title}</strong>
            </p>
            <p>{gap.body}</p>
            <GapSource gap={gap} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 案B — 指標カード型                                                   */
/* ------------------------------------------------------------------ */

export function CardsVariant({ content }: { content: SupportConnectionContent }) {
  return (
    <section className="sc sc-cards" aria-labelledby="sc-cards-title">
      <div className="sc-cards-inner">
        <SectionHead content={content} titleId="sc-cards-title" />

        <div className="sc-provision-strip">
          <span className="sc-strip-label">あるもの</span>
          <ul>
            {content.provision.map((fact) => (
              <li key={fact.id}>
                <strong>{fact.label}</strong>
                <em className={`sc-status sc-status--${fact.status}`}>{PROVISION_STATUS_LABEL[fact.status]}</em>
                <small>{fact.detail}</small>
              </li>
            ))}
          </ul>
        </div>

        <div className="sc-reach-head">
          <span className="sc-side-label sc-side-label--reach">届いているか</span>
          <p>{content.populationScope}</p>
        </div>

        <div className="sc-card-grid">
          {content.barriers.map((barrier) => {
            const value = formatReachValue(barrier);
            return (
              <article className={`sc-card${value === null ? " sc-card--nodata" : ""}`} key={barrier.id}>
                <p className="sc-card-label">{barrier.label}</p>
                {value === null ? (
                  <p className="sc-card-nodata">測れる公表データなし</p>
                ) : (
                  <p className="sc-card-value">
                    {value}
                    <SampleTag show={content.isSample} />
                  </p>
                )}
                <p className="sc-card-means">
                  <span>この数字が示さないこと</span>
                  {value === null
                    ? "この項目自体が測定できないため、割合として扱っていません。"
                    : barrier.doesNotMean}
                </p>
              </article>
            );
          })}

          {content.gaps.map((gap) => (
            <article className="sc-card sc-card--gap" key={gap.id}>
              <p className="sc-card-label">測れないこと自体の記録</p>
              <p className="sc-card-gap-title">{gap.title}</p>
              <p className="sc-card-gap-body">{gap.body}</p>
              <GapSource gap={gap} />
            </article>
          ))}
        </div>

        <p className="sc-card-warning">{content.combineWarning}</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 案C — ストーリー型                                                   */
/* ------------------------------------------------------------------ */

function Step({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="sc-step">
      <span className="sc-step-index" aria-hidden="true">
        {index}
      </span>
      <div className="sc-step-body">
        <h3>{title}</h3>
        {children}
      </div>
    </li>
  );
}

export function StoryVariant({ content }: { content: SupportConnectionContent }) {
  return (
    <section className="sc sc-story" aria-labelledby="sc-story-title">
      <div className="sc-story-inner">
        <p className="eyebrow">支援への接続 — {content.place}・{content.theme}</p>
        <h2 id="sc-story-title" className="sc-title">
          「ある」から「届いている」までを、順にたどる。
        </h2>

        <ol className="sc-steps">
          <Step index="1" title="制度も予算も、サービスも「ある」">
            <p>{content.provisionSummary}</p>
            <ul className="sc-story-provision">
              {content.provision.map((fact) => (
                <li key={fact.id}>
                  {fact.label}
                  <small>（{fact.detail}）</small>
                </li>
              ))}
            </ul>
          </Step>

          <Step index="2" title="でも「使っていない＝困っていない」ではない">
            <p>{content.reachSummary}</p>
            <p>
              サービスを利用していないことは、支援が要らないことも、支援が届いていないことも、どちらも意味しません。だから「未接続」と決めつけずに、利用していない人が挙げた理由を見ます。
            </p>
          </Step>

          <Step index="3" title="利用していない人が挙げた「壁」">
            <p className="sc-story-scope">{content.populationScope}</p>
            <ul className="sc-story-barriers">
              {content.barriers.map((barrier) => {
                const value = formatReachValue(barrier);
                return (
                  <li key={barrier.id}>
                    <span className="sc-story-barrier-label">{barrier.label}</span>
                    <span className="sc-story-barrier-value">
                      {value ?? "測れる公表データなし"}
                      <SampleTag show={content.isSample && value !== null} />
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="sc-story-warning">{content.combineWarning}</p>
          </Step>

          {content.gaps.map((gap) => (
            <Step index="4" title={gap.title} key={gap.id}>
              <p>{gap.body}</p>
              <GapSource gap={gap} />
            </Step>
          ))}
        </ol>
      </div>
    </section>
  );
}
