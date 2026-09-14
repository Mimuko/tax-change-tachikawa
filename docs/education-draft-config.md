# 立川市×教育 草稿 config

MY-155 の成果物。実ファイルは `config/` に配置し、`story-registry` に **登録済み**（`/tachikawa/education`）。

- [`config/topics/education.json`](../config/topics/education.json)
- [`config/data-sources/tachikawa/education.json`](../config/data-sources/tachikawa/education.json)
- [`config/stories/tachikawa-education.json`](../config/stories/tachikawa-education.json)

以下はスナップショット。差分が出たら `config/` 側を正本とする。

## `config/topics/education.json`

```json
{
  "id": "education",
  "label": "教育",
  "metrics": {
    "elem_student_count": {
      "label": "市立小学校児童数",
      "unit": "人",
      "definition": "市立小学校の学年別児童数合計。各年5月1日現在",
      "comparison": "同一地域・5月1日・市立小のみ。時点値同士のみ指数化",
      "periodKind": "as_of"
    },
    "jun_student_count": {
      "label": "市立中学校生徒数",
      "unit": "人",
      "definition": "市立中学校の学年別生徒数合計。各年5月1日現在",
      "comparison": "同一地域・5月1日・市立中のみ。小と中の合算禁止",
      "periodKind": "as_of"
    },
    "elem_class_count": {
      "label": "市立小学校通常学級数",
      "unit": "学級",
      "definition": "市立小学校の通常学級総数。各年5月1日現在",
      "comparison": "特別支援学級数と分離",
      "periodKind": "as_of"
    },
    "jun_class_count": {
      "label": "市立中学校学級数",
      "unit": "学級",
      "definition": "市立中学校の学級総数。各年5月1日現在",
      "comparison": "同上",
      "periodKind": "as_of"
    },
    "elem_special_support_class_count": {
      "label": "市立小学校特別支援学級数",
      "unit": "学級",
      "definition": "市立小学校の特別支援学級数。各年5月1日現在",
      "comparison": "通常学級と分離",
      "periodKind": "as_of"
    },
    "elem_staff_count": {
      "label": "市立小学校教職員数",
      "unit": "人",
      "definition": "教員・養護教諭等を含む教職員数。各年5月1日現在",
      "comparison": "中学校教職員と合算しない",
      "periodKind": "as_of"
    },
    "jun_staff_count": {
      "label": "市立中学校教職員数",
      "unit": "人",
      "definition": "同上（中学校）",
      "comparison": "同上",
      "periodKind": "as_of"
    },
    "education_consultation_cases": {
      "label": "教育相談件数",
      "unit": "件",
      "definition": "年度内の教育相談件数（男女合算）",
      "comparison": "年間累計同士のみ。時点値系列と混在禁止",
      "periodKind": "annual_cumulative"
    },
    "elem_per_student_education_cost": {
      "label": "小学校 児童1人あたり学校教育費",
      "unit": "円",
      "definition": "東京都地方教育費調査 第7表。公費・使途別",
      "comparison": "会計年度実績。5月1日児童数を分母に使わない",
      "periodKind": "fiscal_year"
    },
    "jun_per_student_education_cost": {
      "label": "中学校 生徒1人あたり学校教育費",
      "unit": "円",
      "definition": "同上（中学校）",
      "comparison": "同上",
      "periodKind": "fiscal_year"
    }
  }
}
```

## `config/data-sources/tachikawa/education.json`

```json
{
  "sourcePage": "https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007015.html",
  "license": "CC BY 4.0",
  "pageUpdatedAt": "2026-03-26",
  "publicationNotes": {
    "odLag": "ODページ更新とCSV最終年に差がある。2026-09-14監査時点で児童生徒系CSV最終年は2023。",
    "encoding": "Shift_JIS (CP932)"
  },
  "links": {
    "statisticalYearbookEducation": "https://www.city.tachikawa.lg.jp/shisei/tokei/1007012/1028306.html",
    "tokyoEducationExpenseSurvey": "https://www.kyoiku.metro.tokyo.lg.jp/about/statistics_and_research/expense_per_area/report2024/report2024_csv",
    "mextSchoolRefusalSurvey": "https://www.e-stat.go.jp/stat-search/files?toukei=00400304"
  },
  "sources": [
    {
      "file": "elem-students.csv",
      "metricIds": ["elem_student_count"],
      "periodKind": "as_of",
      "asOfRule": "各年5月1日現在",
      "url": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/015/7-3-2shogakko-gakunenbetsudanjobetsujidosu1.csv"
    },
    {
      "file": "jun-students.csv",
      "metricIds": ["jun_student_count"],
      "periodKind": "as_of",
      "asOfRule": "各年5月1日現在",
      "url": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/015/7-4-2chugakko-gakunenbetsudanjobetsuseitosu1.csv"
    },
    {
      "file": "elem-schools-classes.csv",
      "metricIds": ["elem_class_count", "elem_special_support_class_count"],
      "periodKind": "as_of",
      "asOfRule": "各年5月1日現在",
      "url": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/015/7-3-1shogakko-gakkousutogakkyusu1.csv"
    },
    {
      "file": "jun-schools-classes.csv",
      "metricIds": ["jun_class_count"],
      "periodKind": "as_of",
      "asOfRule": "各年5月1日現在",
      "url": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/015/7-4-1chugakko-gakkosutogakkyusu1.csv"
    },
    {
      "file": "elem-staff.csv",
      "metricIds": ["elem_staff_count"],
      "periodKind": "as_of",
      "asOfRule": "各年5月1日現在",
      "url": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/015/7-3-3shogakko-kyosyokuinsu_21.csv"
    },
    {
      "file": "jun-staff.csv",
      "metricIds": ["jun_staff_count"],
      "periodKind": "as_of",
      "asOfRule": "各年5月1日現在",
      "url": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/015/7-4-4chugakko-kyosyokuinsu1.csv"
    },
    {
      "file": "education-consultation-2014.csv",
      "metricIds": ["education_consultation_cases"],
      "periodKind": "annual_cumulative",
      "asOfRule": "各年度内の相談件数",
      "url": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/015/7-1-1-2kyoikusodankensu2014-1.csv"
    },
    {
      "file": "education-consultation-to2013.csv",
      "metricIds": ["education_consultation_cases"],
      "periodKind": "annual_cumulative",
      "asOfRule": "各年度内の相談件数",
      "url": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/007/015/7-1-1-1kyoikusodankensu2012-20131.csv",
      "note": "2014以降ファイルと分割。接続前に定義突合"
    }
  ],
  "externalSources": [
    {
      "id": "tokyo_education_expense_table7",
      "metricIds": ["elem_per_student_education_cost", "jun_per_student_education_cost"],
      "periodKind": "fiscal_year",
      "publisher": "東京都教育委員会",
      "url": "https://www.kyoiku.metro.tokyo.lg.jp/about/statistics_and_research/expense_per_area/report2024/report2024_csv",
      "table": "第7表 区市町村別学校教育費（公費）使途別園児・児童・生徒一人当たり支出額",
      "publicationTiming": "会計年度確定後、翌年3月頃",
      "status": "needs_implementation_audit"
    }
  ]
}
```

## `config/stories/tachikawa-education.json`

```json
{
  "id": "tachikawa-education",
  "municipality": "tachikawa",
  "topic": "education",
  "renderer": "tachikawa-education",
  "status": "draft",
  "note": "MY-155 草稿。story-registry 未登録。",
  "opening": [
    {
      "metricId": "elem_student_count",
      "seriesKey": "elemStudents",
      "shortLabel": "小学校児童数",
      "color": "var(--series-1)"
    },
    {
      "metricId": "jun_student_count",
      "seriesKey": "junStudents",
      "shortLabel": "中学校生徒数",
      "color": "var(--series-2)"
    }
  ],
  "acts": [
    {
      "id": "act1_students",
      "metrics": ["elem_student_count", "jun_student_count"],
      "periodKind": "as_of"
    },
    {
      "id": "interlude_classes",
      "metrics": ["elem_class_count", "elem_special_support_class_count"],
      "periodKind": "as_of"
    },
    {
      "id": "act2_staff",
      "metrics": ["elem_staff_count", "jun_staff_count"],
      "periodKind": "as_of"
    },
    {
      "id": "interlude_data_gap_refusal",
      "type": "data_gap",
      "reason": "non_attendance_school_refusal_unavailable_at_municipality"
    },
    {
      "id": "act3_consultation",
      "metrics": ["education_consultation_cases"],
      "periodKind": "annual_cumulative"
    },
    {
      "id": "act4_per_student_cost",
      "metrics": ["elem_per_student_education_cost", "jun_per_student_education_cost"],
      "periodKind": "fiscal_year"
    }
  ]
}
```
