# アーキテクチャ

## 方針

MVPは静的生成を中心にし、DBを導入しない。取得元の不安定さをユーザー画面へ伝播させず、検証済みJSONをデプロイ単位に含める。

```text
立川市・公的データ
  -> scripts/fetch（原本保存・取得ログ）
  -> scripts/parse（出典固有の構造を読む）
  -> scripts/normalize（共通Observationへ変換）
  -> schema validation + quality checks
  -> data/processed/*.json
  -> Next.js static pages
  -> Netlify
```

## ディレクトリ案

```text
docs/                 仕様の正本
data/raw/             取得した原本（取得日・ハッシュ付き）
data/processed/       検証済みJSON
data/mappings/        正式分類から表示分類への対応
scripts/sources/      出典別取得・parse
config/               自治体固有のコード・URL・出典設定
scripts/lib/          共通normalize・validation・logging
src/app/              Next.js UI
src/components/       Story、Chart、SourceDisclosure等
tests/                parser、schema、派生値、UI
logs/                 取得結果（原本はGit方針を別途判断）
```

## 更新処理

1. HTTPSで取得し、取得日時、URL、HTTP情報、SHA-256を記録する。
2. 原本を上書きせず取得日付きで保存する。
3. 出典固有parserで読み、定義変更を検知したら失敗させる。
4. 共通Observationへ変換し、schemaと業務ルールを検証する。
5. 前回値との差が極端、年が欠落、単位変更の場合は警告または失敗とする。
6. 全検証成功時だけprocessedデータを更新する。失敗時は直近成功版を維持する。

## JSON

`data-definition.md` のObservation配列と、指標メタデータ、ビルドメタデータを分離する。将来は `metric`, `observation`, `source`, `category_mapping` テーブルへほぼ1:1で移行できる。

## UI / IA

1. ヒーロー「自分の街はどう変わった？」
2. **Act 1 需要とお金** — Scrollytelling（被保険者・認定者・給付総額の3系列）
3. **Interlude Pause** — 人とお金の変化から「支える側」への橋渡し
4. **Act 2 受け皿** — 立川市の提供単位数（`service_unit_count`、厚労省OD集計）
5. **Interlude Gap** — 立川市単位で継続比較できる公開データを確認できなかった支える人・待遇を明示
6. **Act 3 支える人と待遇** — 東京都参考値（`docs/metrics.md` 確定 ID。curated / e-Stat 接続後に表示）
7. **Act 4 市民との接点** — 保険料基準月額の期ごと表示
8. **Act 5 振り返り** — 3地域グループの要約と共有導線
9. 詳細アコーディオン（定義・出典）
10. フッター

各Actは GeographyChip で地域スコープを明示する。Act 1 のScrollytellingは左の説明ステップをIntersection Observerで検知し、右の単一SVGへ系列を累積表示する。異単位比較のため表示座標のみ初年度=100へ指数化し、元値はprocessed JSONから変更せず保持する。JavaScriptが無効でも説明文と詳細表は読める構造にする。

## Netlify

- Next.jsの公式Netlify対応を使う。
- PR Deploy Previewで視覚・リンク・データ差分を確認する。
- 定期更新はNetlify Scheduled Functionsまたは外部CIからBuild Hookを起動する案をO-08確定後に選ぶ。
- 更新失敗時はビルドを失敗させ、直近の本番デプロイを維持する。通知先は未確定。

## 監視・品質

- 取得成功率、最終成功日時、schema error、原典URLのHTTP状態を管理ログへ記録。
- UIでは技術エラーを出さず、データ鮮度と状態を表示する。
- 単体テスト: CSV parser、和暦/年度、数値、欠損、派生値。
- 結合テスト: raw fixtureからprocessed JSONまで。
- UI: キーボード、スクリーンリーダー名、色以外の符号、モバイル幅。

## セキュリティ・運用

- 取得対象を許可リスト化し、リダイレクト先とcontent-typeを検証する。
- rawデータをHTMLとして実行せず、表示文字列をエスケープする。
- 秘密情報をデータ・リポジトリへ保存しない。

## 公開・再現性

- `npm ci -> npm run data:fetch -> npm run data:normalize -> npm run build` を標準手順とする。
- 取得元URLとメタデータは `config/tachikawa.json`、共通CSV処理は `scripts/` に分離する。
- rawファイルとprocessedファイルには出典・取得日時・SHA-256を結び付ける。
- GitHub Actions導入時は、データ更新PRに加工後JSONと検証結果を含め、人が定義変更を確認してからマージする。
- 公開リポジトリ作成、Branch protection、Netlify連携はO-10確定後に実施する。

## 将来DB移行

指標・観測値・出典・分類対応を独立IDで保持する。JSON依存のネストを浅くし、PostgreSQL/Supabase等へ移す際に履歴・出典証跡を失わない。MVPでは接続層の抽象化を先行実装しない。
