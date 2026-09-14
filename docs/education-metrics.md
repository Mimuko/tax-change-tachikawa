# 立川市×教育 指標採用計画

調査更新日: 2026-09-14。「必須」「MVP採用」はストーリー主系列候補、「参考指標」は補足または DataGap 明示、「MVP外」は FINALE 主系列に含めない。DataGap の kind と公開文言は `docs/data-definition.md` §掲載しない指標が正本。

期間種別: `as_of` = 時点値 / `annual_cumulative` = 年間累計 / `fiscal_year` = 年度実績

| 指標ID | 表示名 | 出典 | 定義・地域 | 期間種別 | 基準日・年度 | 年度範囲 | 単位 | 更新頻度 | 公表タイミング | 正規化 | 判定・理由 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `elem_student_count` | 市立小学校児童数 | 立川市 OD | 市立小・学年別合計、立川市 | `as_of` | 各年5月1日 | 2013–2023 | persons | 年次 | 統計年報→OD（遅延あり） | 同一定義なら指数化 | **必須**。11年連続 |
| `jun_student_count` | 市立中学校生徒数 | 立川市 OD | 市立中・学年別合計、立川市 | `as_of` | 各年5月1日 | 2013–2023 | persons | 年次 | 同上 | 同上 | **必須**。同上 |
| `elem_class_count` | 市立小学校学級数 | 立川市 OD | 通常学級総数 | `as_of` | 各年5月1日 | 2013–2023 | classes | 年次 | 同上 | 同上 | **必須**。1学級あたり児童数の派生可 |
| `jun_class_count` | 市立中学校学級数 | 立川市 OD | 学級総数 | `as_of` | 各年5月1日 | 2013–2023 | classes | 年次 | 同上 | 同上 | **必須** |
| `elem_special_support_class_count` | 市立小 特別支援学級数 | 立川市 OD | 特別支援学級数（小） | `as_of` | 各年5月1日 | 2013–2023 | classes | 年次 | 同上 | 同上 | **MVP採用**。2013:14 → 2023:25 |
| `elem_staff_count` | 市立小学校教職員数 | 立川市 OD | 教員・養護等含む | `as_of` | 各年5月1日 | 2013–2023 | persons | 年次 | 同上 | 同上 | **必須** |
| `jun_staff_count` | 市立中学校教職員数 | 立川市 OD | 同上 | `as_of` | 各年5月1日 | 2013–2023 | persons | 年次 | 同上 | 同上 | **必須** |
| `education_consultation_cases` | 教育相談件数 | 立川市 OD | 年度内相談件数（男女合算） | `annual_cumulative` | 年度内 | 2014–2023 | cases | 年次 | 同上 | 件数そのもの | **MVP採用**。時点値系列と分離 |
| `elem_per_student_education_cost` | 小 1人あたり学校教育費 | 東京都 地方教育費調査 第7表 | 公費・使途別、立川市 | `fiscal_year` | 会計年度 | 要実装時監査 | yen_per_student | 年次 | 翌年3月頃 | 名目 | **MVP採用**。推移は DataGap `unavailable_for_comparison` まで未掲載 |
| `jun_per_student_education_cost` | 中 1人あたり学校教育費 | 同上 | 同上 | `fiscal_year` | 会計年度 | 要実装時監査 | yen_per_student | 年次 | 翌年3月頃 | 名目 | **MVP採用**。同上 |
| `students_per_elem_class` | 小 1学級あたり児童数 | 派生 | 児童総数÷通常学級総数 | `as_of` | 各年5月1日 | 2013–2023 | persons | — | — | 率 | **MVP採用（派生）**。定義を明示 |
| `elem_non_attendance_count` | 不就学児童数 | 立川市 OD | 不就学届出等 | `as_of` | 各年5月1日 | 2013–2023 | persons | 年次 | 同上 | 指数化不適 | **参考**。不登校と混同禁止 |
| `jun_non_attendance_count` | 不就学生徒数 | 立川市 OD | 同上 | `as_of` | 各年5月1日 | 2013–2023 | persons | 年次 | 同上 | 同上 | **参考** |
| `non_attendance_school_refusal` | 不登校児童生徒数 | 文科省調査 | 30日以上等 | `annual_cumulative` | 年度内 | — | persons | 年次 | 翌年10月頃 | — | **DataGap** `wrong_geography`（都・指定都市表章のみ） |
| `elem_special_support_student_count` | 特別支援学級児童数 | 統計年報 PDF | 学年別 | `as_of` | 5月1日 | 未監査 | persons | 年次 | 年報公表 | — | **要追加調査**。OD 未公開 |
| `library_loans` | 図書館貸出冊数 | 立川市 OD | 図書館 | `annual_cumulative` | 年度 | あり | volumes | 年次 | 同上 | — | **MVP外**（テーマ外） |
| `municipal_education_budget_yen` | 教育関係歳出 | 市決算 PDF | 一般会計 | `fiscal_year` | 会計年度 | 未監査 | yen | 年次 | 決算後 | — | **可能なら（詳細）**。1人あたり調査と別 |

## 主系列採用（監査時点）

ストーリー opening 候補（いずれも **時点値・5月1日・2013–2023**）:

1. 市立小児童数
2. 市立中生徒数
3. 市立小教職員数

別 Act（**年間累計**）:

4. 教育相談件数

別 Act（**年度実績**）:

5. 小・中 1人あたり学校教育費（実装時に年度連続を確定）

DataGap（`dashboard.json` の `gaps`）:

- 不登校 — `wrong_geography`。公開例: 「立川市だけの不登校の年次推移を確認できるデータはありません。」
- 1人あたり教育費 — `unavailable_for_comparison`。公開例: 「立川市の教育費データはありますが、複数年を同じ条件で比較できるか確認中のため、今回は推移には掲載していません。」

## 地域粒度の結論

- 児童生徒・学級・教職員・相談件数: **立川市**（市立小中）
- 1人あたり教育費: **立川市**（東京都調査の区市町村別表だが、reference_only ではない）
- 不登校: **立川市値として公表なし** → 東京都参考も不登校については今回未採用（都全体では立川の状況を表さない）

## 期間種別混在の禁止（再掲）

| 混在例 | 判定 |
|---|---|
| 5月1日児童数 + 年度内相談件数を同一 scrolly グラフ | **禁止** → Act 分割 |
| 5月1日児童数 ÷ 会計年度教育費から1人あたりを再計算 | **禁止** → 第7表の公表値を使用 |
| 不就学児童数を不登校の代理 | **禁止** → DataGap |

## 派生指標

| 派生ID | 式 | 条件 |
|---|---|---|
| `students_per_elem_class` | `elem_student_count / elem_class_count` | 同じ5月1日時点のみ |
| `staff_per_student_elem` | `elem_staff_count / elem_student_count` | 同上。解釈は「配置」であって「担当」ではない |

小教職員+中教職員の単純合算は、学校種別定義が異なるため **MVPでは行わない**。
