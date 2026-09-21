import Link from "next/link";

import { stories, type StoryContext } from "../lib/story-registry";

type MunicipalityGroup = {
  municipality: StoryContext["municipality"];
  items: StoryContext[];
};

const TOPIC_BLURB: Record<string, string> = {
  care: "高齢化が進むなかで、認定者数・給付・保険料・担い手はどう動いたか。支える側と支えられる側の変化を追う。",
  education:
    "児童生徒数、学級、教職員、子ども一人あたりの学校教育費。まちの子どもをめぐる数字の推移をたどる。",
};

// Group the registry into municipality blocks so the directory reads as
// 「自治体 × テーマ」 and grows automatically as new pairs are registered.
function groupByMunicipality(): MunicipalityGroup[] {
  const groups = new Map<string, MunicipalityGroup>();
  for (const context of stories) {
    const key = context.municipality.id;
    const group = groups.get(key);
    if (group) {
      group.items.push(context);
    } else {
      groups.set(key, { municipality: context.municipality, items: [context] });
    }
  }
  return [...groups.values()];
}

export default function HomeHub() {
  const groups = groupByMunicipality();
  const municipalityCount = groups.length;
  const topicCount = stories.length;

  return (
    <>
      <nav className="topbar" aria-label="サイト内のページ">
        <Link className="wordmark" href="/">
          machinohenka
        </Link>
        <ul className="topbar-nav">
          <li>
            <Link href="#directory" className="topbar-nav-link">
              テーマ一覧
            </Link>
          </li>
          <li>
            <Link href="#about" className="topbar-nav-link">
              このサイトについて
            </Link>
          </li>
        </ul>
      </nav>

      <main id="main" className="hub-main">
        <header className="hub-hero">
          <p className="eyebrow">
            <span className="dot" aria-hidden="true" />
            公開行政データ・地域の変化
          </p>
          <h1>
            税金で、
            <br />
            何が<em>変わった</em>？
          </h1>
          <p className="hub-lead">
            自治体が公開する行政データから、あなたの街がこの数年でどう変わったのかをたどります。<br />
            政策の良し悪しを採点するのではなく、観測された変化と、その根拠となる数字を示します。
          </p>
          <p className="hub-note">
            現在 {municipalityCount} 自治体・{topicCount} テーマを公開中。テーマは監査済みのデータから順次追加します。
          </p>
        </header>

        <section id="directory" className="hub-directory" aria-labelledby="directory-title">
          <div className="hub-directory-inner">
            <div className="hub-directory-head">
              <p className="eyebrow">自治体 × テーマ</p>
              <h2 id="directory-title">街とテーマの組み合わせを選ぶ</h2>
              <p>
                このサイトは「自治体 × テーマ」を一つの単位として構成しています。それぞれの組み合わせが
                独立したデータストーリーのページ（例:{" "}
                <code className="hub-inline-path">/tachikawa/care/</code>）になっています。
              </p>
            </div>

            {groups.map((group) => (
              <section key={group.municipality.id} className="hub-muni">
                <div className="hub-muni-head">
                  <h3 className="hub-muni-name">{group.municipality.municipalityLabel}</h3>
                  <span className="hub-muni-pref">{group.municipality.prefectureLabel}</span>
                  <span className="hub-muni-count">{group.items.length} テーマ</span>
                </div>

                <div className="hub-cards">
                  {group.items.map((context) => {
                    const metricCount = Object.keys(context.topic.metrics).length;
                    const blurb =
                      TOPIC_BLURB[context.topic.id] ??
                      `${context.municipality.municipalityLabel}の${context.topic.label}に関する公開データの推移をたどります。`;
                    return (
                      <article key={context.topic.id} className="hub-card">
                        <span className="hub-card-path">
                          /{context.municipality.id}/{context.topic.id}/
                        </span>
                        <h4 className="hub-card-title">
                          <Link className="hub-plain" href={context.href}>
                            {context.topic.label}
                          </Link>
                        </h4>
                        <p className="hub-card-blurb">{blurb}</p>
                        <div className="hub-card-foot">
                          <span className="hub-card-meta">{metricCount} 指標を収録</span>
                          <Link className="hub-card-sub" href={context.dataHref}>
                            データと出典
                          </Link>
                        </div>
                        <span className="hub-card-cta hub-plain" aria-hidden="true">
                          物語を読む →
                        </span>
                      </article>
                    );
                  })}

                  <article className="hub-card hub-card--pending" aria-label="追加予定のテーマ">
                    <span className="hub-card-path">/{group.municipality.id}/…/</span>
                    <h4 className="hub-card-title">テーマを順次追加</h4>
                    <p className="hub-card-blurb">
                      医療・子育て・防災・財政など、監査済みのデータがそろったテーマから並列に公開していきます。
                    </p>
                    <div className="hub-card-foot">
                      <span className="hub-card-meta">準備中</span>
                    </div>
                  </article>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section id="about" className="hub-about" aria-labelledby="about-title">
          <div className="hub-about-inner">
            <p className="eyebrow">このサイトについて</p>
            <h2 id="about-title">数字を、街の物語として読む</h2>
            <div className="hub-about-grid">
              <div className="hub-about-item">
                <h3>何を示すか</h3>
                <p>
                  公開されている行政データを収集・整理し、同じ定義・同じ時点でつながる数字だけを指数化して、
                  変化の向きと大きさを示します。
                </p>
              </div>
              <div className="hub-about-item">
                <h3>何を示さないか</h3>
                <p>
                  政策や自治体の採点はしません。異なる定義や時点の数字を安易につなげず、断定的な因果の説明も避けます。
                </p>
              </div>
              <div className="hub-about-item">
                <h3>どう確かめるか</h3>
                <p>
                  各テーマのページには「データと出典」を用意し、定義・加工方法・原典へのリンクをたどれるようにしています。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <p className="footer-mark">税金で、何が変わった？</p>
          <span>公開行政データから、街の変化をたどるデータストーリー。</span>
        </div>
        <div>
          <p className="ui-label">データと注意事項</p>
          <p>
            本サイトは特定の行政機関が提供・運営する公式サービスではありません。公開されている行政データを独自に収集・整理・可視化しています。
          </p>
          <p>原典の数値・定義等に関するお問い合わせは、各データの掲載元へお願いいたします。</p>
        </div>
      </footer>
    </>
  );
}
