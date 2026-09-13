import data from "../../data/processed/dashboard.json";
import StoryExperience from "../components/story-experience";

export default function Home() {
  const series = [
    { id: "insured", label: "介護保険第1号被保険者数", shortLabel: "加入者", unit: "人", color: "#e65d38", points: data.series.insured },
    { id: "certified", label: "要支援・要介護認定者数", shortLabel: "認定者", unit: "人", color: "#147d74", points: data.series.certified },
    { id: "benefits", label: "介護保険給付総額", shortLabel: "給付総額", unit: "円", color: "#5b63b7", points: data.series.benefits },
    { id: "premium", label: "介護保険料（現年分）収入額", shortLabel: "保険料収入", unit: "円", color: "#b24972", points: data.series.premiumRevenue },
  ];

  return <main>
    <header className="hero">
      <nav aria-label="サイト情報"><span>立川市 × 介護</span><a href="/data/">データと出典</a></nav>
      <div className="hero-copy"><p className="eyebrow">PUBLIC DATA STORY / 2019—2023</p><h1>街の変化を、<br /><em>一本ずつ重ねる。</em></h1><p>介護を必要とする人。そこに使われたお金。別々の数字を同じ時間軸に置くと、立川市の5年間が少し違って見えてきます。</p><a className="start-link" href="#story">スクロールしてたどる <span aria-hidden="true">↓</span></a></div>
      <div className="hero-index"><span>2019</span><i /><span>2023</span></div>
    </header>
    <StoryExperience series={series} />
    <section className="reflection"><p className="eyebrow">WHAT DO YOU NOTICE?</p><h2>4本の線のあいだに、<br />何が見えましたか。</h2><p>このグラフにまだない「サービスの受け皿」や「支える人の待遇」も、次に確かめたいデータです。</p><a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("立川市の介護、この5年で何が変わった？ #税金で何が変わった")}`}>気づきを共有する ↗</a></section>
    <footer><div><p className="footer-mark">税金で、<br />何が変わった？</p></div><div><h2>データと注意事項</h2><p>本サイトは公開されている行政データを独自に収集・整理・可視化するものです。原典の数値・定義等に関するお問い合わせは、各データの掲載元へお願いいたします。</p><p>出典: <a href={data.sourcePage}>立川市オープンデータ「統計年報・社会福祉」</a>。最終収録年度: {data.latestFiscalYear}年度。</p><p><a href="/data/">定義・加工方法を見る →</a></p></div></footer>
  </main>;
}
