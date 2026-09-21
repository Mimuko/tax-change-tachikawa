import type { StoryContext } from "../lib/story-registry";
import SiteFooter from "../components/site-footer";
import SiteTopbar from "../components/site-topbar";

export default function SourcePage({ context }: { context: StoryContext }) {
  const { data } = context;
  return (
    <>
      <SiteTopbar variant="story" active="data" context={context} />
      <main id="main" tabIndex={-1} className="data-page">
        <section className="data-content">
          <header className="data-intro">
            <p className="eyebrow">データの根拠</p>
            <h1>定義と加工方法</h1>
            <p>{context.municipality.municipalityLabel}の{context.topic.label}に関する公開データを扱います。原典ごとの形式と定義に沿って加工し、欠損記号「-」は0ではなく欠損として扱います。都道府県の参考値は自治体値と区別します。</p>
            <p><a className="button-primary" href={data.sourcePage} target="_blank" rel="noopener noreferrer" aria-label="原典の掲載ページを開く（外部サイト）">原典の掲載ページを開く ↗</a></p>
            <p><a href={context.href}>物語へ戻る</a></p>
          </header>
          <div className="data-sources">
            {Object.entries(context.topic.metrics).map(([id, metric]) => (
              <article key={id}>
                <h2>{metric.label}</h2>
                <p>{metric.definition}</p>
                <p>比較ルール: {metric.comparison}</p>
              </article>
            ))}
            {Object.entries(data.provenance).map(([key, source]) => (
              <article key={key}>
                <h2>{source.title}</h2>
                <p>{source.definition}</p>
                <p>単位: {source.unit}</p>
                {source.sha256 ? <details>
                  <summary>取得ファイルの照合情報</summary>
                  <code>SHA-256: {source.sha256}</code>
                </details> : null}
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter data={data} context={context} />
    </>
  );
}
