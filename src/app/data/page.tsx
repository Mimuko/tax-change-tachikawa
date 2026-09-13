import data from "../../lib/dashboard-data";
import SiteFooter from "../../components/site-footer";
import SiteTopbar from "../../components/site-topbar";

export default function DataPage() {
  return (
    <>
      <SiteTopbar active="data" />
      <main id="main" tabIndex={-1} className="data-page">
        <section className="data-content">
          <header className="data-intro">
            <p className="eyebrow">データの根拠</p>
            <h1>定義と加工方法</h1>
            <p>すべて立川市オープンデータのCSVをShift_JISとして読み取り、カンマ区切りの数値を数値型へ変換し、各系列の最新5年度を抽出しています。欠損記号「-」は0ではなく欠損として扱います。</p>
            <p><a className="button-primary" href={data.sourcePage} target="_blank" rel="noopener noreferrer" aria-label="原典の掲載ページを開く（外部サイト）">原典の掲載ページを開く ↗</a></p>
            <p><a href="/">トップへ戻る</a></p>
          </header>
          <div className="data-sources">
            {Object.values(data.provenance).map((source) => (
              <article key={source.sha256}>
                <h2>{source.title}</h2>
                <p>{source.definition}</p>
                <p>単位: {source.unit}</p>
                <details>
                  <summary>取得ファイルの照合情報</summary>
                  <code>SHA-256: {source.sha256}</code>
                </details>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
