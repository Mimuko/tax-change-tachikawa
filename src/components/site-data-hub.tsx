import Link from "next/link";

import SiteHubFooter from "./site-hub-footer";
import SiteTopbar from "./site-topbar";
import { formatStoryTitle } from "../lib/site-hub";
import { stories } from "../lib/story-registry";

export default function SiteDataHub() {
  return (
    <>
      <SiteTopbar variant="hub" active="data" />
      <main id="main" tabIndex={-1} className="data-page">
        <section className="data-content">
          <header className="data-intro">
            <p className="eyebrow">Data Policy</p>
            <h1>データ方針</h1>
            <p>
              各ストーリーは原典ごとの形式と定義に沿って加工しています。欠損記号「-」は0ではなく欠損として扱い、都道府県の参考値は自治体値と区別します。詳細な定義と加工方法は、各ストーリーのページで確認できます。
            </p>
            <p>
              <Link href="/">TOPへ戻る</Link>
            </p>
          </header>

          <div className="data-sources hub-data-list">
            {stories.map((story) => (
              <article key={story.story.id}>
                <h2>{formatStoryTitle(story)}</h2>
                <p>
                  {story.municipality.municipalityLabel}の{story.topic.label}データ。指標の定義、比較ルール、出典、取得ファイルの照合情報を掲載しています。
                </p>
                <p>
                  <Link className="button-primary" href={story.dataHref}>
                    定義と加工方法を見る
                  </Link>{" "}
                  <Link href={story.href}>物語を読む</Link>
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteHubFooter />
    </>
  );
}
