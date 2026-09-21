import Link from "next/link";

import SiteHubFooter from "./site-hub-footer";
import SiteTopbar from "./site-topbar";
import {
  formatStoryTitle,
  groupStoriesByMunicipality,
  groupStoriesByTopic,
} from "../lib/site-hub";

export default function SiteHome() {
  const byTopic = groupStoriesByTopic();
  const byMunicipality = groupStoriesByMunicipality();

  return (
    <>
      <SiteTopbar variant="hub" active="home" />
      <main id="main" tabIndex={-1}>
        <header className="hero hub-hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" />
              machinohenka
            </p>
            <h1>
              税金で、
              <br />
              <em>何が変わった？</em>
            </h1>
            <p>
              行政支出の使途だけでなく、その期間に社会で観測された変化を、公開データからたどります。政策の採点ではなく、根拠とともに「自分の街はどう変わった？」を問いかけます。
            </p>
          </div>
          <div className="hero-bottom">
            <div>
              <span>入口</span>
              <strong>テーマまたは自治体を選んで、データストーリーを読む</strong>
            </div>
            <a className="circle-button" href="#stories">
              ストーリー
              <br />
              を選ぶ <b aria-hidden="true">↓</b>
            </a>
          </div>
          <div className="hero-mark" aria-hidden="true">
            MH<span>DATA</span>
          </div>
        </header>

        <section className="hub-section" id="stories" aria-labelledby="hub-stories-heading">
          <div className="hub-section-inner">
            <header className="hub-section-header">
              <p className="eyebrow">Stories</p>
              <h2 id="hub-stories-heading">公開中のデータストーリー</h2>
              <p>
                監査済みの「自治体 × テーマ」の組み合わせだけを掲載しています。テーマごとの見方と、自治体ごとのまとまりの両方から選べます。
              </p>
            </header>

            <div className="hub-group" id="topics">
              <h3 className="hub-group-title">テーマから見る</h3>
              <ul className="hub-card-list">
                {byTopic.map((topic) =>
                  topic.stories.map((story) => (
                    <li key={story.story.id}>
                      <article className="hub-card">
                        <p className="hub-card-eyebrow">{topic.label}</p>
                        <h4>{formatStoryTitle(story)}</h4>
                        <p className="hub-card-copy">
                          {story.municipality.prefectureLabel}
                          {story.municipality.municipalityLabel}の{story.topic.label}に関する公開データの変化を、物語形式でたどります。
                        </p>
                        <div className="hub-card-links">
                          <Link className="button-primary" href={story.href}>
                            物語を読む
                          </Link>
                          <Link href={story.dataHref}>定義と加工方法</Link>
                        </div>
                      </article>
                    </li>
                  )),
                )}
              </ul>
            </div>

            <div className="hub-group" id="municipalities">
              <h3 className="hub-group-title">自治体から見る</h3>
              <ul className="hub-card-list">
                {byMunicipality.map((municipality) => (
                  <li key={municipality.id}>
                    <article className="hub-card hub-card-municipality">
                      <p className="hub-card-eyebrow">
                        {municipality.prefectureLabel}
                        {municipality.label}
                      </p>
                      <h4>{municipality.label}のストーリー</h4>
                      <ul className="hub-topic-links">
                        {municipality.stories.map((story) => (
                          <li key={story.story.id}>
                            <Link href={story.href}>{story.topic.label}</Link>
                            <span aria-hidden="true">·</span>
                            <Link href={story.dataHref}>データ</Link>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="hub-about" id="about" aria-labelledby="hub-about-heading">
          <div className="hub-section-inner">
            <p className="eyebrow">About</p>
            <h2 id="hub-about-heading">このサイトについて</h2>
            <p>
              machinohenka は、自治体が公開する統計・行政データを市民が読みやすい順序で再編集し、数年間の変化と根典までたどれるようにするプロジェクトです。結論を与えるのではなく、観測された事実から自分の疑問を持てる状態を目指します。
            </p>
            <p>
              <Link className="button-primary" href="/data/">
                データ方針を読む
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteHubFooter />
    </>
  );
}
