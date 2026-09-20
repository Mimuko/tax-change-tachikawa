# 時系列グラフ上の背景イベント（MY-171）

## 目的

時系列グラフに、数値変化を読むための参考情報として「その時期に起きた出来事」を重ねて表示する。イベントは数値変化の**原因**として扱わない。

## データ構造

正本は `src/types/timeline-event.ts` と `config/events/<municipality>-<topic>.json`。

| フィールド | 説明 |
|---|---|
| `id` | イベント識別子（binding 参照用） |
| `year` | グラフ横軸の年度と揃える |
| `scope` | `municipality` / `policy` / `societal` |
| `category` | 分類ラベル（UI 表示用） |
| `title` | 出来事の名称 |
| `description` | 中立な説明（因果・評価語を避ける） |
| `source.label` | 出典名 |
| `source.url` | 一次情報または公的資料への HTTPS URL |

`bindings` で `chartId` と `eventIds` を結び、指標ごとに掲載対象を限定する。イベント未登録の chart は従来どおり表示する。

画面側では `resolveTimelineEvents` に自治体 ID・テーマ ID・グラフ ID・表示系列を渡す。横軸の正本である先頭系列からの年度抽出と、未登録時の空配列化は共通処理が担うため、自治体やテーマごとに同じ解決処理を実装しない。

## 他の自治体・テーマへの追加手順

1. `config/events/<municipality>-<topic>.json` にイベントとグラフ binding を定義する
2. `src/lib/timeline-events.ts` の `catalogs` にカタログを登録する
3. 対象グラフを `ChartWithTimelineEvents` で描画するか、`StoryExperience` の `events` に解決結果を渡す
4. `resolveTimelineEvents` の `chartId` と JSON の binding を一致させる

カタログや binding がない自治体・テーマ・グラフでは空配列となり、出来事 UI とフォーカスレイヤーは表示されない。

## スコープ分類

| scope | 意味 | UI ラベル例 |
|---|---|---|
| `municipality` | 自治体固有の出来事 | 立川市 |
| `policy` | 都道府県・国レベルの制度・政策 | 国・制度 |
| `societal` | 広域・社会全体の出来事 | 広域・社会 |

初期表示では `municipality` を優先表示する。`policy` と `societal` は利用者が表示切替でオンにできる（PoC ではトグル UI を提供）。

## 掲載基準

以下をすべて満たす場合のみ掲載する。

1. その指標の変化を読むうえで背景情報として有用である
2. その出来事を知らないとグラフの変化を誤読する可能性がある
3. 発生日・開始時期を公的資料または信頼できる一次情報で確認できる
4. 指標との因果関係を断定せずに提示できる

## 非対象

- イベントを数値変化の原因として断定する表現
- 首長・政党・自治体施策の評価やランキング
- 指標と関係の薄い地域イベントの網羅的掲載
- 出典を確認できないイベント
- グラフをイベント情報で過密にすること

## UI・文言

- 見出しは「この時期に起きたこと」等、中立的な文言を用いる
- 注記: 「同時期に起きた出来事の参考情報です。数値の変化の原因を示すものではありません。」
- スコープは chip 色・線種で区別する（自治体 / 国・制度 / 広域・社会）
- 詳細から出典 URL へリンクする

## 既存仕様との関係

- municipality / topic / story の責務分離を維持する（イベント config は自治体×テーマ単位）
- geography / provenance / reference_only / DataGap の既存ルールを変更しない
- イベント未登録時は既存グラフ表示に影響しない

## PoC（2026-09）

対象:

- 立川市×介護: Act 1 累積グラフ（`opening`）、Act 2 サービス数（`act2-service-units`）
- 立川市×教育: Act 1 累積グラフ（`opening`）、学級数（`act-classes`）、教育相談（`act3-consultation`）

残課題:

- 自治体固有イベントの監査と追加（一次情報確認後）
- 他 chart / 他自治体への横展開
- 表示密度のユーザーテストに基づく調整
