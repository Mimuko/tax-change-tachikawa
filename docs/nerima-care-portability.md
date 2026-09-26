# 練馬区×介護 移植性監査（MY-156）

調査更新日: 2026-09-17。立川市版（`tachikawa/care`）で採用した指標について、練馬区への移植可否を判定する。正本は `config/topics/care.json` の `metricId` と `docs/metrics.md`。データ可用性の詳細は `docs/nerima-care-data-sources.md`。

## 判定凡例

| 判定 | 意味 |
|---|---|
| **そのまま再利用** | 定義・粒度・取得処理をほぼ変更せず、設定差し替えで使える |
| **定義調整が必要** | 指標概念は共通だが、基準日・単位・合算ルール等の調整が必須 |
| **代替指標** | 立川と同名ではないが、同 Act で別 metricId / 原典を使う |
| **取得不可** | 連続比較に使える原典がない、または DataGap 固定 |

## 指標別移植性

| metricId | 表示名（立川版） | 判定 | 練馬区での原典 | 主な差分・注意 |
|---|---|---|---|---|
| `ltc_first_insured_persons` | 介護保険第1号被保険者数 | **定義調整が必要** | 統計書 表110(1) | 定義（年度末）は一致。**取得経路**が OD CSV→統計書 Excel。系列は令和2–6（5年）のみ確認 |
| `care_certified_persons` | 要支援・要介護認定者数 | **定義調整が必要** | 統計書 表110(5) | 基準日が **9月末**（立川は**年度末**）。R7統計書で過去分の基準日も改訂 |
| `care_certification_rate_first_insured` | 第1号被保険者の認定率 | **定義調整が必要** | 派生（表110(1)+(5)） | 分子9月末・分母年度末の **期間不一致**。立川式の自動移植は禁止 |
| `ltc_benefit_total_yen` | 介護保険給付総額 | **定義調整が必要** | 統計書 表110(7) 合算 | 単位**千円**・四捨五入。総額列なし。立川 CSV 総額列との横断突合は**監査対象外**（構成要素自己整合） |
| `ltc_benefit_by_service_yen` | サービス別給付費 | **定義調整が必要** | 同上（区分別） | 立川 OD の正式サービス分類 CSV とは列構造が異なる。表示分類マッピング要監査 |
| `service_unit_count` | 介護サービスの提供単位数 | **そのまま再利用** | 厚労省 OD | `132021`→`131202` のみ。2020–2024・12月末・24列構造は立川監査と同一 |
| `care_worker_headcount` | 介護職員数（実人数） | **そのまま再利用** | e-Stat 都調査 | 東京都参考。`reference_only: true`。市区町村値なし |
| `care_worker_fte` | 介護職員 常勤換算 | **そのまま再利用** | 同上 | 同上 |
| `care_worker_scheduled_salary` | 介護職員の所定内給与 | **そのまま再利用** | e-Stat 賃金構造 DB | 東京都参考。2020年以降のみ。立川の `care_worker_scheduled_salary_tokyo` と同趣旨 |
| `ltc_premium_standard_monthly` | 介護保険料基準月額 | **そのまま再利用** | 区公式・第9期計画 | **UI・metric 定義**は共通。**値**は区固有（第9期 6,670 円/月） |
| `ltc_premium_revenue_yen` | 介護保険料収入 | **取得不可**（MVP外） | 統計書 表110(3) | 立川版と同様、市民負担指標には採用しない |

## Act / UI 構造の移植性

| Act（立川版） | 移植 | 備考 |
|---|---|---|
| Act 1 需要とお金（被保険者・認定者・給付） | **部分可** | 被保険者・給付は年度ベース。認定者は **9月末** のため同一 scrolly への無注記混在は不可 |
| Act 2 受け皿（提供単位数） | **可** | OD パイプライン流用。ラベルは `place.municipalityLabel` から解決 |
| Interlude Gap + Act 3 支える人 | **可（都参考）** | 市区町村系列なし → `resolveSupportAvailability` Case B。`reference.prefecture` + Gap 表示 |
| Act 4 保険料基準月額 | **可** | `premiumStandard.periods` を練馬区値に差し替え |
| Act 5 振り返り | **可** | 可用性分岐は立川版ロジックを継承 |

## DataGap / reference_only 挙動

| 状況 | 立川版 | 練馬区（監査結論） |
|---|---|---|
| 市区町村の職員・賃金時系列 | なし | **なし**（同一） |
| 都道府県参考（`referenceOnly: true`） | あり（東京都） | **あり**（同一データ源） |
| Act 3 Case B（Gap + 都参考） | 表示 | **表示**（変更なし） |
| Act 3 Case C（非表示） | 参考も不可のとき | 想定外（都参考は取得可） |
| 定員・事業所単時点一覧 | DataGap / 不採用 | 区 OD 事業所一覧は **単時点** → 5年系列の代理禁止 |
| 認定率（期間不一致） | 算出して表示 | **そのまま移植しない** → 実装時は別 Act または DataGap `incompatible_period` を検討 |

公開文言・`kind` の正本は引き続き `docs/data-definition.md` §掲載しない指標。練馬区固有の Gap 文案は `{place}` を「練馬区」に展開するだけで足りる（職員・賃金 Gap は立川版 copy を流用可）。

## 実装前チェックリスト（MY-230 時点）

1. [x] `config/municipalities/nerima.json`（`131202`）と `config/data-sources/nerima/care.json` を追加。
2. [x] 統計書 Excel 用パーサー（`parse-nerima-hyo08.mjs`）を追加。欠損セルは null 扱いでビルド停止。
3. [x] 認定者 **9月末** を UI・詳細表・Act 構成に明示。
4. [x] 給付費合算を `benefit-reconciliation.json` で監査（2020–2024年集合・構成要素・手計算合計。立川 CSV 横断突合は対象外）。
5. [x] `dataset-context` に `nerima/care` を登録。
6. [x] 指標参照・DataGap・静的ビルドを `tests/architecture.test.mjs` に追加。

## 監査結論（MY-156）

- **全面そのまま公開は不可**。最大の差は **認定者の基準日（9月末 vs 年度末）** と **需要・給付の取得経路（OD CSV なし）**。
- **全国 OD・都参考・保険料基準 UI** は移植コストが低い。
- ストーリー公開は、上記チェックリスト完了後の別 Issue とする（本 Issue は監査ドキュメントが成果物）。
