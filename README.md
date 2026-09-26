# 税金で、何が変わった？（仮称）

## 自治体×テーマ構成

現在の公開ストーリーは `/tachikawa/care/`、出典は `/tachikawa/care/data/` です。既存の `/`・`/data/` も利用できます。

自治体情報は `config/municipalities/`、テーマの指標定義は `config/topics/`、ストーリーの指標参照は `config/stories/`、原典設定は `config/data-sources/` で管理します。画面の組み合わせとコピーは `src/stories/`、共通部品は `src/components/` に置きます。

```bash
npm run data:fetch -- tachikawa care
npm run data:normalize -- tachikawa care
npm test
npm run dev
# 本番用静的出力
npm run build
```

引数省略時は `tachikawa care`。未対応の組み合わせはエラーになります。新規自治体・テーマの追加手順と今回の移行範囲は [architecture.md](docs/architecture.md) を参照してください。

立川市の介護に関する公開行政データを、一般市民が「自分の街で何が変わったか」として理解できるよう再編集する、オープンソースのData Storytellingプロジェクトです。

> [!IMPORTANT]
> 本プロジェクトおよびWebサイトは立川市その他の行政機関が提供・運営する公式サービスではありません。

## なぜ作るのか

行政支出は「何に使われたか」だけでなく、その期間に社会がどう変化したかまで見ないと理解しづらいものです。本プロジェクトは政策を採点せず、公開データの増減・差・関係性と根拠を、市民が自分で確かめられる形にします。

## MVPの対象

- 自治体: 東京都立川市（`config/data-sources/tachikawa/care.json` でラベル・出典を分離）
- テーマ: 介護
- 期間: 各指標で比較可能な直近年度
- ホスティング: Netlify（静的エクスポート）
- 仕様正本: [`docs/requirements.md`](docs/requirements.md)
- 構成: [`docs/architecture.md`](docs/architecture.md)

物語の流れは、需要とお金（Scrollytelling）→ 受け皿 → 支える人・待遇 → 保険料 → 振り返りです。支える人・待遇（Act 3）は、市区町村データと都道府県参考の**可用性に応じて表示を分岐**します。都道府県値を市区町村の代理として扱いません。

## データソース

| 区分 | 出典 | 主な指標 |
|---|---|---|
| 市区町村 | [立川市オープンデータ「統計年報・社会福祉」](https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007020.html) | 第1号被保険者、認定者、保険料収入、介護保険給付 |
| 市区町村 | 厚労省 介護サービス情報公表システム OD | 提供単位数（受け皿） |
| 都道府県参考 | [賃金構造基本統計調査](https://www.mhlw.go.jp/toukei/list/chinginkouzou_a.html)（e-Stat） | 介護職員の所定内給与（東京都・`referenceOnly`） |

採否・定義・ライセンスは [`docs/data-sources.md`](docs/data-sources.md)、[`docs/metrics.md`](docs/metrics.md)、[`data/README.md`](data/README.md) を参照してください。

## 必要環境

- Node.js 22
- npm（`package-lock.json` を使用）

## セットアップとローカル開発

```bash
git clone https://github.com/Mimuko/tax-change-tachikawa
cd tax-change-tachikawa
npm ci
npm run data:build
npm run dev
```

`<PUBLIC_REPOSITORY_URL>` はGitHub公開後に実URLへ置き換えます。ブラウザで `http://localhost:3000` を開いてください。

リポジトリに含まれる `data/processed/tachikawa/care/dashboard.json` でも開発できますが、データ更新後は `npm run data:build` を実行してください。

## データ更新

```bash
npm run data:fetch
npm run data:service-units
npm run data:tokyo-reference   # 要 E_STAT_APP_ID（任意。.env 可）
npm run data:normalize
```

- `data:fetch` … [`config/data-sources/tachikawa/care.json`](config/data-sources/tachikawa/care.json) のURLから原本を `data/raw/tachikawa/care/` へ保存
- `data:service-units` … 提供単位数を `data/curated/` へ生成
- `data:tokyo-reference` … 都道府県参考の賃金系列を curated へ生成（未設定時は既存 curated を維持）
- `data:normalize` / `data:build` … `data/processed/tachikawa/care/dashboard.json` を生成（`place`・市区町村系列・`reference.prefecture` を含む）
- `data:extract-nerima` … ローカルの練馬区統計書 Excel から curated 系列を再生成（原典は Git 非管理）
- `data:check` … processed の provenance SHA-256 を検証（再配布可 raw は実バイト、local-only は記録 SHA）
- `data:stable` … `data:build` 後に processed が `generatedAt` 以外でドリフトしていないことを検証（CI 用）
- `data:history-check` … base..HEAD で local-only 対象の XLSX/PDF が履歴に追加されていないことを検証

e-Stat 再取得用のアプリIDが必要な場合だけ `.env` に `E_STAT_APP_ID` を置いてください（コミットしない）。変数名のみスクリプト先頭コメントと docs に記載します。

## ビルド

```bash
npm run build
```

静的サイトは `out/` に生成されます。ビルド時にも `data:build` を実行します。

## Netlifyへのデプロイ

1. 公開GitHubリポジトリをNetlifyへ接続します。
2. Build commandを `npm run build`、Publish directoryを `out` にします。
3. Node.js 22を使用します。
4. Deploy Previewでデータ差分、出典リンク、モバイル表示を確認してから公開します。
5. OGP・SNS共有用に、Netlify の環境変数 `NEXT_PUBLIC_SITE_URL`（例: `https://your-site.netlify.app`）を本番サイトの URL に設定します。未設定時は Netlify が注入する `URL` をビルド時に利用します。

設定は [`netlify.toml`](netlify.toml) に定義しています。本番ビルドに e-Stat API キーは必須ではありません（検証済み JSON / curated をリポジトリに含めます）。

## 他自治体への展開（方針）

自治体名・都道府県名・出典URLは `config/*.json` → `dashboard.json` の `place` に載せ、UI にハードコードしません。市区町村の職員・給与時系列が揃えば Act 3 は Gap なしで表示し、無い場合のみ都道府県参考を明示します。詳細は [`docs/architecture.md`](docs/architecture.md) と [`docs/requirements.md`](docs/requirements.md) の Act 3 節を参照してください。

## ライセンス

- ソースコード: [MIT License](LICENSE)
- データ: 原典ごとのライセンスが適用されます。ソースコードのMIT Licenseには含まれません。

主要依存関係はNext.js / React（MIT）、TypeScript（Apache-2.0）で、コードのMIT公開と整合することを確認しています。

## データ利用上の注意

本サイトは公開されている行政データを独自に収集・整理・可視化するものです。原典の数値・定義等に関するお問い合わせは、各データの掲載元へお願いいたします。

欠損値は0として扱いません。表示結果を再利用するときは、原典のライセンス、対象年度、定義、加工方法を必ず確認してください。

## コントリビューション

不具合、データ・指標・自治体の追加、UIや文書の改善を歓迎します。先に [CONTRIBUTING.md](CONTRIBUTING.md) を読み、該当するIssueテンプレートを利用してください。セキュリティ上の問題は公開Issueへ投稿せず、[SECURITY.md](SECURITY.md) の手順に従ってください。
