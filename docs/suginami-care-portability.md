# 杉並区×介護 移植性監査

MY-238 成果物。`/suginami/care` 公開時の metric / UI 再利用判定。

## metricId 別

| metricId | 判定 | 備考 |
|---|---|---|
| `ltc_first_insured_persons` | そのまま再利用 | CSV 9-9-1-1 |
| `care_certified_persons` | そのまま再利用 | 年度末。`periodKind: fiscal_year_end` |
| `ltc_benefit_total_yen` | そのまま再利用 | 総数金額（円） |
| `service_unit_count` | そのまま再利用 | OD × 131156 |
| `ltc_premium_standard_monthly` | 値差し替え | 第8期 6,200 / 第9期 6,400 |
| `care_worker_*` | 都参考のみ | Act 3 Case B（練馬と同一） |
| `ltc_premium_revenue_yen` | 非採用 | DataGap 相当（MVP外） |

## 共通 UI / 機能

| 部品 | 判定 |
|---|---|
| `CareStory` / scrolly opening | 可（年度末認定者） |
| `ActSupportSection` + DataGap | 可（都参考） |
| `PremiumStandardSection` | 可 |
| `GeographyChip` | 可 |
| `DetailAccordion` | 可 |
| `TimelineEventsPanel` | **今回未実装**（events config 未監査） |
| `SupportConnectionSection` | **今回未実装**（原典未監査） |

## 実装漏れ vs データ不足

| 機能 | 分類 | 対応 |
|---|---|---|
| タイムライン | 原典未監査 | 無理に補完しない |
| 支援への接続 | 原典未監査 | 無理に補完しない |
| Act 3 都参考 | データ仕様 | 立川/練馬と同じ Case B |
