# 立川市×子育て データソース調査

調査日: 2026-09-27。PoC 正本: `config/data-sources/tachikawa/childrearing.json`, `data/processed/tachikawa/childrearing/dashboard.json`。

## 採用系列

| metricId | 原典表 | 基準 | 連続年（監査） | 期間種別 |
|---|---|---|---|---|
| `pregnancy_notifications` | 母子健康手帳の交付の推移 | 各年度 | 2013–2023 | `annual_cumulative` |
| `maternity_handbook_deliveries` | 同上（交付総数） | 各年度 | 2013–2023 | `annual_cumulative` |
| `nursery_children_count` | 保育の実施原因別保育園児数（年齢=全て） | 各年4月1日現在 | 2013–2023 | `as_of` |
| `nursery_capacity_total` | 保育園別定員…（行=全園） | 各年4月1日現在 | 2016–2023 | `as_of` |
| `nursery_staff_count` | 同上（職員数） | 各年4月1日現在 | 2016–2023 | `as_of` |
| `afterschool_registrations` | 学童保育所登録児童数（行=全保育所） | 各年度 | 2013–2023 | `annual_cumulative` |
| `childrearing_consultation_cases` | 子ども家庭支援センター利用状況 | 各年度末現在 | 2013–2023 | `annual_cumulative` |

## DataGap

| id | kind | 理由 |
|---|---|---|
| `nursery_waiting_children` | `unavailable_for_comparison` | 立川市 OD 社会福祉ページで、待機児童の単純な年次推移 CSV を PoC 時点で未確認 |
| `child_allowance_unified_trend` | `definition_change` | 児童手当 CSV は児童育成手当条例・児童手当法・子ども手当法が混在し、制度改定前後を単一系列として接続しない |

## ライセンス

立川市統計年報 OD（保健・社会福祉）は **CC BY 4.0**（各ファイルリンク横の表示に準拠）。

## 5年比較

- 市町村合併なし（132021 継続）。
- 保育園児数（4月1日）と妊娠届出（年度）は **同じ「年」ラベルでも基準日が異なる**。同一 Act に混在させない。
- 定員・職員の園別 CSV は **2016年列から**。2013–2015 は園児総数系列のみ使用。

## 出典ページ

- 保健: https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007025.html
- 社会福祉: https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007020.html
