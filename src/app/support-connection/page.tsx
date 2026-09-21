import type { Metadata } from "next";
import SupportConnectionSection from "../../components/support-connection-section";
import { careSupportConnectionExample } from "../../lib/support-connection";

export const metadata: Metadata = {
  title: "支援への接続｜UI検討",
  robots: { index: false, follow: false },
};

export default function SupportConnectionPreviewPage() {
  return (
    <main id="main" tabIndex={-1} className="sc-preview">
      <header className="sc-preview-hero">
        <p className="eyebrow">machinohenka · 共通セクション検討</p>
        <h1 className="sc-preview-title">「支援への接続」UI案</h1>
        <p className="sc-preview-lead">
          制度や予算が「存在すること」と、支援が必要な人に「実際に届いていること」を分けて可視化するための共通セクションです。「制度はある →
          でも、つまずきがある → 全体像はまだ測れない」という流れで読ませ、最後の DataGap
          を結論として置きます。テーマ（介護・教育・子育て・障害福祉・生活困窮など）ごとに中身を差し替える前提で、ここでは具体例として介護テーマのデータを使用しています。
        </p>
      </header>

      <div className="sc-preview-block">
        <SupportConnectionSection id="story" data={careSupportConnectionExample} />
      </div>
    </main>
  );
}
