import data from "../../data/processed/dashboard.json";
import StoryExperience from "../components/story-experience";

export default function Home() {
  const series = [
    { id: "insured", label: "介護保険第1号被保険者数", shortLabel: "加入者", unit: "人", color: "#789985", points: data.series.insured },
    { id: "certified", label: "要支援・要介護認定者数", shortLabel: "認定者", unit: "人", color: "#e57443", points: data.series.certified },
    { id: "benefits", label: "介護保険給付総額", shortLabel: "給付総額", unit: "円", color: "#163b32", points: data.series.benefits },
    { id: "premium", label: "介護保険料（現年分）収入額", shortLabel: "保険料収入", unit: "円", color: "#7194a0", points: data.series.premiumRevenue },
  ];

  return <main>
    <header className="topbar"><a className="wordmark" href="#top">TACHIKAWA / 介護の5年間</a><div><span>DATA STORY</span><a href="/data/">データと出典</a></div></header>
    <header className="hero" id="top">
      <div className="hero-copy"><p className="eyebrow"><span className="dot" />立川市の変化をたどる</p><h1>自分の街は、<br /><em>どう変わった？</em></h1><p>数字を覚えるためではなく、<br />変化に気づくための5年間です。</p></div>
      <div className="hero-bottom"><div><span>対象</span><strong>立川市 / 介護 / 直近5年間</strong></div><a className="circle-button" href="#story">変化<br />を見る <b aria-hidden="true">↓</b></a></div>
      <div className="hero-mark" aria-hidden="true">05<span>YEARS</span></div>
    </header>
    <StoryExperience series={series} />
    <section className="pause-section"><p className="eyebrow">気づきのための間</p><h2>人の変化と、<br />お金の変化。</h2><p>同じ時間軸に重ねたとき、何が見えたでしょうか。</p><span aria-hidden="true">↓</span></section>
    <section className="reflection"><span className="closing-number">04</span><h2>あなたは、<br /><em>何が気になりましたか？</em></h2><p>このグラフにまだない「サービスの受け皿」や「支える人の待遇」も、次に確かめたいデータです。</p><a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("立川市の介護、この5年で何が変わった？ #税金で何が変わった")}`}>気づきを共有する ↗</a></section>
    <footer><div><p className="footer-mark">税金で、何が変わった？</p><span>立川市の介護をめぐるデータストーリー</span></div><div><h2>データと注意事項</h2><p>本サイトは公開されている行政データを独自に収集・整理・可視化するものです。原典の数値・定義等に関するお問い合わせは、各データの掲載元へお願いいたします。</p><p>出典: <a href={data.sourcePage}>立川市オープンデータ「統計年報・社会福祉」</a>。最終収録年度: {data.latestFiscalYear}年度。</p><p><a href="/data/">定義・加工方法を見る →</a></p></div></footer>
  </main>;
}
