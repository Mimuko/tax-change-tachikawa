import Link from "next/link";
import type { StoryContext } from "../lib/story-registry";

type FooterData = {
  sourcePage: string;
  latestFiscalYear: number;
};

export default function SiteFooter({ data, context }: { data: FooterData; context: StoryContext }) {
  return (
    <footer>
      <div>
        <p className="footer-mark">税金で、何が変わった？</p>
        <span>{context.municipality.municipalityLabel}の{context.topic.label}をめぐるデータストーリー</span>
      </div>
      <div>
        <p className="ui-label">データと注意事項</p>
        <p>本サイトは公開されている行政データを独自に収集・整理・可視化するものです。原典の数値・定義等に関するお問い合わせは、各データの掲載元へお願いいたします。</p>
        <p>
          出典:{" "}
          <a
            href={data.sourcePage}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="原典を開く（外部サイト）"
          >
            {context.municipality.municipalityLabel}の公開データ
          </a>
          。最終収録年度: {data.latestFiscalYear}年度。
        </p>
        <p><Link href={context.dataHref}>定義・加工方法を見る →</Link></p>
      </div>
    </footer>
  );
}
