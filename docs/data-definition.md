# データ定義

## 基本原則

- 原典の正式定義を優先し、AIや実装都合で異なる概念を統合しない。
- `null` は欠損として保持し、0と区別する。
- 実人数、延べ人数、月平均、年間累計、常勤人数、常勤換算、定員、利用者数、給付件数を別概念として扱う。
- 行政分類 `officialCategory` と表示分類 `displayCategory` を分離する。
- 年度と暦年、時点値と期間値を明示する。

## 正規化レコード

```ts
type Observation = {
  id: string;
  municipalityCode: "132021";
  theme: "long-term-care";
  metricId: string;
  period: { kind: "fiscal-year" | "calendar-year" | "as-of"; value: string };
  value: number | null;
  unit: string;
  status: "available" | "no-data" | "not-comparable" | "definition-changed" | "fetch-failed" | "not-published";
  officialCategory?: string;
  displayCategory?: "住む" | "通う" | "自宅で受ける" | "地域密着・複合" | "その他";
  source: {
    title: string;
    url: string;
    retrievedAt: string;
    sourceValue: string | number | null;
    sourceUnit: string;
  };
  definition: string;
  transform: string;
  notes?: string[];
};
```

## 派生値

- 前年比率: `(当年値 - 前年値) / 前年値 * 100`。前年値が0または欠損なら比較不可。
- 5年前比率: 原則 `(最新値 - 5年前値) / 5年前値 * 100`。データが5年度分しかない場合は「最古年比」とし、5年前比と誤記しない。
- 認定率: 分子・分母が同一時点または同一年度で整合する場合のみ算出。分母候補は第1号被保険者数。第2号被保険者の認定者を含む場合は注記し、O-03解消まで確定指標にしない。
- 実質賃金: 使用する物価指数、基準年、季節調整の有無を確定するまで算出しない。

## 状態表示

| status | 市民向け表示 |
|---|---|
| no-data | この項目のデータはありません |
| not-comparable | 定義や期間が揃わないため比較できません |
| definition-changed | 集計方法が変わっているため、前後を単純比較できません |
| fetch-failed | 現在、確認済みデータを表示しています |
| not-published | 原典側でまだ公開されていません |

## 分類マッピング

正式サービス分類は原文を保存する。市民向け分類は別ファイルの明示的な対応表でのみ付与し、未確認サービスは「その他」とする。複合サービスを恣意的に分割しない。

## 要確認

- 各立川市CSVの基準日、年度表記、給付件数の集計期間。
- 認定者数に第2号被保険者を含むか。
- サービス別給付額が審査決定額・支給額等のどの金額か。
- 過年度CSV間の定義変更・列変更。
