import type { Metadata } from "next";
import SupportConnectionSection from "../../components/support-connection-section";
import {
  careSupportConnectionExample,
  unmeasuredSupportConnectionExample,
} from "../../lib/support-connection";

export const metadata: Metadata = {
  title: "支援への接続｜UI検討",
  robots: { index: false, follow: false },
};

const patterns = [
  {
    id: "quiet",
    variant: "quiet" as const,
    name: "A. 静かな説明型",
    summary:
      "紙面の本文にそのまま溶け込む方向。数字は控えめに置き、まず「何を意味するか」を言葉で読ませる。指標が少ないテーマや、慎重に扱いたいテーマ向き。",
  },
  {
    id: "cards",
    variant: "cards" as const,
    name: "B. 指標カード型",
    summary:
      "指標をひとつずつ独立したカードに分ける方向。合算しないという構造が見た目にも表れる。指標数が増えても横並びで破綻しない。",
  },
  {
    id: "story",
    variant: "story" as const,
    name: "C. ストーリー型",
    summary:
      "「制度はある → でも、つまずきがある → 全体像はまだ測れない」という流れで読ませる方向。最後の DataGap を結論として置く。",
  },
];

export default function SupportConnectionPreviewPage() {
  return (
    <main id="main" tabIndex={-1} className="sc-preview">
      <header className="sc-preview-hero">
        <p className="eyebrow">machinohenka · 共通セクション検討</p>
        <h1 className="sc-preview-title">「支援への接続」UI案</h1>
        <p className="sc-preview-lead">
          制度や予算が「存在すること」と、支援が必要な人に「実際に届いていること」を分けて可視化するための共通セクションです。テーマ（介護・教育・子育て・障害福祉・生活困窮など）ごとに中身を差し替える前提で、方向性を3パターン用意しました。ここでは具体例として介護テーマのデータを使用しています。
        </p>
        <nav className="sc-preview-nav" aria-label="パターン一覧">
          <ul>
            {patterns.map((pattern) => (
              <li key={pattern.id}>
                <a href={`#${pattern.id}`}>{pattern.name}</a>
              </li>
            ))}
            <li>
              <a href="#datagap-only">D. DataGapのみ</a>
            </li>
          </ul>
        </nav>
      </header>

      {patterns.map((pattern) => (
        <div key={pattern.id} className="sc-preview-block">
          <div className="sc-preview-caption">
            <p className="sc-preview-caption-name">{pattern.name}</p>
            <p className="sc-preview-caption-summary">{pattern.summary}</p>
          </div>
          <SupportConnectionSection
            id={pattern.id}
            data={careSupportConnectionExample}
            variant={pattern.variant}
          />
        </div>
      ))}

      <div className="sc-preview-block">
        <div className="sc-preview-caption">
          <p className="sc-preview-caption-name">D. DataGapのみ（接続状況を測れない場合）</p>
          <p className="sc-preview-caption-summary">
            指標がひとつも無くても、セクションとして成立することを確認するための例です。「測れないこと」自体を情報として表示します（静かな説明型で表示）。
          </p>
        </div>
        <SupportConnectionSection
          id="datagap-only"
          data={unmeasuredSupportConnectionExample}
          variant="quiet"
        />
      </div>
    </main>
  );
}
