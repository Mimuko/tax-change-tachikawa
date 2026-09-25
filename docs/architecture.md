# アーキテクチャ

## MY-152: 自治体×テーマへの段階移行（2026-09-14）

実装済みの公開単位は `tachikawa/care`。自治体とテーマの直積を自動公開せず、検証済みの組み合わせだけを `src/lib/story-registry.ts` に登録する。

| 責務 | 正本 |
|---|---|
| 自治体コード・名称・都道府県 | `config/municipalities/tachikawa.json` |
| 指標の意味・単位・比較ルール | `config/topics/care.json` |
| 原典URL・取得条件・自治体の制度値 | `config/data-sources/tachikawa/care.json` |
| ストーリー識別・指標参照・冒頭の順序 | `config/stories/tachikawa-care.json` |
| コピー・表示条件・部品の組み合わせ | `src/stories/care-story.tsx`, `care-copy.ts` |
| 共通のスクロール表現・Act・Interlude・Recap・Detail等 | `src/components/` |
| 取得・加工先の解決と未対応データセットの拒否 | `scripts/lib/dataset-context.mjs` |
| 自治体×テーマのデータ | `data/{raw,curated,processed}/tachikawa/care/` |

ストーリーはテーマのmetricIdを参照する。旧データのseriesKeyとの対応はストーリー側のアダプターで保持し、テーマ定義には入れない。原典固有の説明は各データのprovenanceに残す。起動時に自治体コード・テーマ・指標参照の整合性を確認する。

`/[municipality]/[topic]/` とその `data/` を登録一覧から静的生成する。未知の組み合わせは404。`/` と `/data/` は立川市×介護への互換エントリーであり、将来のハブ化はここだけで実施できる。共通ナビゲーションは現在のストーリーのURLを受け取る。

介護固有の構成は共通テンプレートとして固定しない。別テーマ追加時には新しいstory rendererが共通部品を組み合わせる。現行DashboardDataおよび介護パーサーは介護用アダプターとして維持し、教育データにこの形を強制しない。

### 次の組み合わせを追加する手順

1. 自治体またはテーマの正本を追加し、指標定義・比較可能性・出典を監査する。
2. 原典設定とパーサーを追加し、dataset-contextで対応を明示する。`dataset-context` が許可した組み合わせのみ実行する。
3. raw・curated・processedを自治体×テーマ配下へ生成する。
4. metricIdを参照するストーリーとrendererを実装し、登録する。
5. 指標参照、未知ルート、欠損・参考値の表示、静的ビルドを検証する。

練馬区×介護は **MY-156/MY-230 で公開済み**（下記）。立川市×教育は MY-155 で公開済み（下記）。介護の職員/賃金表示は既存の可用性判定を引き継いでいる。掲載しない指標の共通ルールは `docs/data-definition.md` §掲載しない指標（DataGap）。

## MY-156 / MY-230: 練馬区×介護 移植性監査・公開（2026-09-17 / 2026-09-25）

`/nerima/care` は **公開済み**（`story-registry` 登録）。監査の正本:

| 責務 | 正本 |
|---|---|
| 原典・可用性・5年比較・立川との差分 | `docs/nerima-care-data-sources.md` |
| metricId 別の移植判定（再利用/定義調整/代替/不可） | `docs/nerima-care-portability.md` |
| 指標意味・DataGap 共通ルール | `config/topics/care.json`, `docs/data-definition.md` |

監査で確定した要点: 第1号被保険者（年度末）は統計書 Excel で取得可能だが OD CSV なし。認定者は **9月末** 基準で立川（年度末）と非同等。給付費は千円・区分合算。提供単位数・都参考の職員/賃金・保険料基準 UI は立川版をほぼ流用可。Act 3 は Case B（都参考 + Gap）を継承。

| 責務 | 正本 |
|---|---|
| 自治体コード・名称 | `config/municipalities/nerima.json`（統計書 131203、厚労省 OD 131202） |
| 原典・制度値 | `config/data-sources/nerima/care.json` |
| 統計書 Excel パーサー | `scripts/lib/parse-nerima-hyo08.mjs`, `scripts/build-nerima-care.mjs` |
| ストーリー | `config/stories/nerima-care.json`, `src/stories/care-story.tsx`（共有 renderer） |
| processed | `data/processed/nerima/care/dashboard.json` |

実装判断（MY-230）: 監査内容に矛盾なし。認定者9月末は provenance と scrolly コピーで明示。認定率は算出しない。支援への接続は原典未確認のため未掲載。

## MY-155: 立川市×教育 データ調査・ストーリー設計（2026-09-14）

`/tachikawa/education` は **公開済み**（`story-registry` 登録）。調査・設計の正本は `docs/education-*.md`。掲載しない指標（DataGap）の共通ルールは `docs/data-definition.md` §掲載しない指標。1人あたり教育費は推移未掲載（DataGap: `unavailable_for_comparison`）。不登校は `wrong_geography`。

| 責務 | 正本 |
|---|---|
| データソース監査・更新頻度・公表タイミング | `docs/education-data-sources.md` |
| 指標採否・期間種別（時点値/年間累計/年度実績） | `docs/education-metrics.md` |
| Act 構造・DataGap・primitive 再利用 | `docs/education-story.md` |
| config / processed / renderer | `config/topics/education.json`, `config/data-sources/tachikawa/education.json`, `config/stories/tachikawa-education.json`, `data/processed/tachikawa/education/dashboard.json`, `src/stories/education-story.tsx` |

監査で確定した主系列: 市立小中児童生徒数（5月1日）→ 学級・特別支援 → 教職員 → DataGap（不登校）→ 教育相談（年間累計）→ 1人あたり教育費（会計年度）。期間種別の異なる系列は同一 Act に混在しない。

## 支援への接続（立川市×介護・教育の先行実装）

テーマ固有の `series` は維持したまま、各 dashboard に任意の `supportConnection` を追加する。共通なのは「相談・制度・サービス等への到達」という意味と表示部品であり、全テーマへ同一指標を要求しない。内部設計では **Need → Input → Output → Reach → Outcome** の Reach に位置づけるが、既存 UI の Act 名・コピー・順序には自動反映しない。支援後の状態改善を表す Outcome は含めない。

- 介護: 在宅介護実態調査の非利用理由から、費用、サービス不足、手続き・利用方法の障壁を個別表示する。複数回答を合算しない。相談相手の有無は `supportNetwork` で支援経路を区別する。
- 教育: 教育相談件数を「確認できた相談接点」として表示する。件数は人数・接続率ではないため、ニーズ母数に対する到達割合は `not_measurable` として明示する。

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

## 初期構想（下記のMY-152実装で段階移行）

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
5. **Interlude Gap** — 市区町村単位の支える人・待遇がなく、都道府県参考のみある場合に表示（`resolveSupportAvailability` の `showDataGap`）
6. **Act 3 支える人と待遇** — データ可用性で分岐（`ActSupportSection` + `src/lib/support-availability.ts`）
   - **Case A（市区町村）**: `series.careWorkerSalary` または `series.careWorkerWorkforce` に比較可能な2点以上 → Gap なし・市区町村 chip
   - **Case B（都道府県参考）**: 市区町村系列なし・`reference.prefecture` に `referenceOnly: true` の比較可能系列 → Gap + 都道府県参考 chip（都道府県値を市区町村の代理にしない）
   - **Case C（非表示）**: 上記いずれもなし → Act 3 全体を非表示
   - `dashboard.json` の `place`（`config/*.json` 由来）でラベルと出典リンクを解決。UI コンポーネントに自治体名のハードコードは置かない
7. **支援への接続** — 既存 Act のコピーと順序を保ったまま `SupportConnectionSection` を追加
8. **Act 4 市民との接点** — 保険料基準月額の期ごと表示
9. **Act 5 振り返り** — 3地域グループの要約と共有導線
10. 詳細アコーディオン（定義・出典）
11. フッター

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
- 取得元URLとメタデータは `config/data-sources/tachikawa/care.json`、共通CSV処理は `scripts/` に分離する。
- rawファイルとprocessedファイルには出典・取得日時・SHA-256を結び付ける。
- GitHub Actions導入時は、データ更新PRに加工後JSONと検証結果を含め、人が定義変更を確認してからマージする。
- 公開リポジトリ作成、Branch protection、Netlify連携はO-10確定後に実施する。

## 将来DB移行

指標・観測値・出典・分類対応を独立IDで保持する。JSON依存のネストを浅くし、PostgreSQL/Supabase等へ移す際に履歴・出典証跡を失わない。MVPでは接続層の抽象化を先行実装しない。
