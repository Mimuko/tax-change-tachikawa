# 立川市×教育 ストーリー設計

調査更新日: 2026-09-14。本書は MY-155 の成果物。`/tachikawa/education` は **公開済み**（`story-registry` 登録）。1人あたり教育費は推移未掲載（DataGap: `unavailable_for_comparison`）。不登校は `wrong_geography`。

## 設計の順序

監査結果から Act を確定した。Input / Output / Outcome / Plan（IOOP）は **事前固定せず**、採用指標の関係性が見えた後に整理用語として後付けした。

```text
データ監査 → 指標採否 → 関係性整理 → Act 確定 → IOOP ラベル（任意）
```

## 監査から読み取れる変化（2013→2023、断定は事実のみ）

| 指標 | 2013 | 2023 | 方向 |
|---|---:|---:|---|
| 市立小児童数（5/1） | 8,620 | 8,586 | → 微減 |
| 市立中生徒数（5/1） | 3,827 | 3,783 | → 微減 |
| 市立小教職員数（5/1） | 541 | 650 | ↑ |
| 市立中教職員数（5/1） | 294 | 309 | ↑ |
| 市立小 特別支援学級数（5/1） | 14 | 25 | ↑ |
| 教育相談件数（年度累計） | —（2014:302） | 632 | ↑（2014基準） |

因果・評価語は使わない。「同じ期間に観測された変化」として提示する。

## 確定 Act 構造

介護の「需要→受け皿→支える人→保険料」は **流用しない**。期間種別が異なる系列は Act を分ける。

### Act 1 — 市立小中の児童・生徒（時点値）

- **指標**: `elem_student_count`, `jun_student_count`
- **期間種別**: 時点値（各年5月1日）
- **GeographyChip**: 立川市
- **Scrollytelling 候補**: 同一グラフに小・中の2系列を累積（単位同じ・基準日同じ）
- **見出し方向（草案）**:
  - 「市立小中学校の児童・生徒数は、大きくは減っていない。」
  - 「小と中で、変化の幅は異なる。」

### Interlude — 学級と特別支援

- **指標**: `elem_class_count`, `elem_special_support_class_count`（必要なら `students_per_elem_class`）
- **期間種別**: 時点値
- **橋渡し**: 人数横ばい〜微減のなか、学級構成・支援学級がどう変わったか
- **見出し方向**: 「児童の数より、クラスの数と支援の形が変わっている。」

### Act 2 — 教職員（時点値）

- **指標**: `elem_staff_count`, `jun_staff_count`
- **期間種別**: 時点値（5月1日）
- **注意**: 小と中は **別系列**。合算しない
- **見出し方向**: 「支える側の人数は、増えている。」

### Interlude — DataGap（不登校）

- **理由**: 文科省「問題行動・不登校等調査」は都・指定都市粒度。立川市の継続公表系列を確認できず
- **不就学との区別**: 不就学 CSV（5月1日・数人規模）は **不登校の代理にしない**
- **見出し（公開文言）**: 「立川市だけの不登校の年次推移を確認できるデータはありません。」（`resolveDataGapCopy` / gap override）

### Act 3 — 教育相談（年間累計）

- **指標**: `education_consultation_cases`
- **期間種別**: 年間累計（年度内件数）
- **Act 1 との分離**: 別 Act。同一 scrolly グラフに児童生徒数を載せない
- **見出し方向**: 「教育相談の件数は、増えている。」

### Act 4 — 1人あたりの教育費（年度実績）

- **指標**: `elem_per_student_education_cost`, `jun_per_student_education_cost`
- **期間種別**: 年度実績（会計年度）
- **注意**: 5月1日児童数との時点がずれる。ラベルで明示
- **見出し方向**: 「1人あたりの公費支出は、どう変わったか。」

### Act 5 — 振り返り

- **Recap グループ案**:
  1. 児童・生徒（小・中）
  2. 学級・特別支援
  3. 教職員
  4. 相談件数
  5. 1人あたり教育費
- DataGap（不登校・1人あたり教育費）は振り返りグループ「年次推移として掲載していないもの」に短い公開向け1行で残す

### 詳細アコーディオン

- 各指標の定義・基準日・期間種別・出典
- 不就学 / 不登校 / 教育相談の定義差を表で明示

## IOOP 後付けラベル（整理用）

| Act | 後付け IOOP | 根拠 |
|---|---|---|
| Act 1–2 | Outcome | 市立小中にいる子ども・学級・教職員の観測状態 |
| Act 3 | Output | 相談対応件数（サービス利用に近い行政 output） |
| Act 4 | Input | 公費支出（税・交付金等の使途。詳細は第7表定義に従う） |
| DataGap | — | kind 別（`wrong_geography` / `unavailable_for_comparison` 等） |

Plan（将来目標値）は今回の監査では **採用指標なし**。教育振興計画 PDF は後続調査。

## Story primitive 再利用評価

| 部品 | 判定 | 備考 |
|---|---|---|
| `config/municipalities/tachikawa.json` | **そのまま再利用** | 自治体コード 132021 |
| `GeographyChip` | **再利用** | 立川市ラベル |
| `StoryExperience` / `StoryAct` | **再利用** | opening 系列は2〜3本に調整 |
| `StoryInterlude` | **再利用** | 学級橋渡し + DataGap |
| `StoryRecap` | **再利用** | グループ定義は education 固有 |
| `DetailAccordion` | **再利用** | 定義・出典 |
| `SimpleSeriesChart` | **再利用** | 指数化ルールは同一定義・連続年のみ |
| `PremiumStandardSection` | **非流用** | 介護保険料専用 |
| `ActSupportSection` / `resolveSupportAvailability` | **非流用** | 介護の支える人・待遇分岐 |
| `DashboardData`（介護 series 形） | **非流用** | education 用 processed 形を別途設計 |
| `care-story.tsx` renderer | **非流用** | `education-story.tsx` を新設 |

## 草稿 config との対応

以下を配置・登録済み。

- 指標定義: [`config/topics/education.json`](../config/topics/education.json)
- 原典 URL: [`config/data-sources/tachikawa/education.json`](../config/data-sources/tachikawa/education.json)
- opening 参照: [`config/stories/tachikawa-education.json`](../config/stories/tachikawa-education.json)
- processed: [`data/processed/tachikawa/education/dashboard.json`](../data/processed/tachikawa/education/dashboard.json)
- renderer: [`src/stories/education-story.tsx`](../src/stories/education-story.tsx)

## 後続 Issue

1. 地方教育費調査 第7表の年度連続監査と fetch/normalize（完了後に DataGap `per_student_education_cost` を外し series を載せる）
2. 特別支援学級**児童数**の年報 PDF 監査（OD 未公開）
3. 2013以前の教育相談 CSV との定義突合（必要なら系列延長）
