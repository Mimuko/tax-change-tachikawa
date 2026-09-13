# 税金で、何が変わった？（仮称）

立川市の介護に関する公開行政データを、一般市民が「自分の街で何が変わったか」として理解できるよう再編集する、オープンソースのData Storytellingプロジェクトです。

> [!IMPORTANT]
> 本プロジェクトおよびWebサイトは立川市その他の行政機関が提供・運営する公式サービスではありません。

## なぜ作るのか

行政支出は「何に使われたか」だけでなく、その期間に社会がどう変化したかまで見ないと理解しづらいものです。本プロジェクトは政策を採点せず、公開データの増減・差・関係性と根拠を、市民が自分で確かめられる形にします。

## MVPの対象

- 自治体: 東京都立川市
- テーマ: 介護
- 期間: 各指標で比較可能な直近5年度
- ホスティング: Netlify
- 仕様正本: [`docs/requirements.md`](docs/requirements.md)

## データソース

現在の実装は、[立川市オープンデータ「統計年報・社会福祉」](https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007020.html)に掲載された介護保険第1号被保険者、要介護認定者、保険料収入、介護保険給付、サービス別給付のCSVを使用します。詳しい採否・定義・ライセンス状況は [`docs/data-sources.md`](docs/data-sources.md) と [`data/README.md`](data/README.md) を参照してください。

## 必要環境

- Node.js 22
- npm（`package-lock.json` を使用）

## セットアップとローカル開発

```bash
git clone <PUBLIC_REPOSITORY_URL>
cd tax-change-tachikawa
npm ci
npm run dev
```

`<PUBLIC_REPOSITORY_URL>` はGitHub公開後に実URLへ置き換えます。ブラウザで `http://localhost:3000` を開いてください。

## データ更新

```bash
npm run data:fetch
npm run data:normalize
npm test
```

`data:fetch` は立川市固有設定を [`config/tachikawa.json`](config/tachikawa.json) から読み、原本を `data/raw/tachikawa/` に保存します。`data:normalize` はShift_JISのCSVを検証し、`data/processed/dashboard.json` を生成します。

## ビルド

```bash
npm run build
```

静的サイトは `out/` に生成されます。ビルド時にも正規化を再実行します。

## Netlifyへのデプロイ

1. 公開GitHubリポジトリをNetlifyへ接続します。
2. Build commandを `npm run build`、Publish directoryを `out` にします。
3. Node.js 22を使用します。
4. Deploy Previewでデータ差分、出典リンク、モバイル表示を確認してから公開します。

設定は [`netlify.toml`](netlify.toml) に定義しています。現在のMVPは外部APIキーを必要としません。

## ライセンス

- ソースコード: [MIT License](LICENSE)
- データ: 原典ごとのライセンスが適用されます。ソースコードのMIT Licenseには含まれません。

主要依存関係はNext.js / React（MIT）、TypeScript（Apache-2.0）で、コードのMIT公開と整合することを確認しています。

## データ利用上の注意

本サイトは公開されている行政データを独自に収集・整理・可視化するものです。原典の数値・定義等に関するお問い合わせは、各データの掲載元へお願いいたします。

欠損値は0として扱いません。表示結果を再利用するときは、原典のライセンス、対象年度、定義、加工方法を必ず確認してください。

## コントリビューション

不具合、データ・指標・自治体の追加、UIや文書の改善を歓迎します。先に [CONTRIBUTING.md](CONTRIBUTING.md) を読み、該当するIssueテンプレートを利用してください。セキュリティ上の問題は公開Issueへ投稿せず、[SECURITY.md](SECURITY.md) の手順に従ってください。
