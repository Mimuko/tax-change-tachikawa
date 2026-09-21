import Link from "next/link";

export default function SiteHubFooter() {
  return (
    <footer>
      <div>
        <p className="footer-mark">税金で、何が変わった？</p>
        <span>machinohenka — 公開行政データから街の変化をたどるデータストーリー</span>
      </div>
      <div>
        <p className="ui-label">データと注意事項</p>
        <p>本サイトは自治体その他の行政機関が提供・運営する公式サービスではありません。</p>
        <p>
          本サイトは公開されている行政データを独自に収集・整理・可視化するものです。原典の数値・定義等に関するお問い合わせは、各データの掲載元へお願いいたします。
        </p>
        <p>
          <Link href="/data/">データ方針・定義と加工方法 →</Link>
        </p>
      </div>
    </footer>
  );
}
