# データ定義

調査更新日: 2026-09-13

## 基本原則

- 原典の正式定義を優先し、実人数、延べ人数、件数、利用回数、定員、事業所数、常勤人数、常勤換算、給付費、決算歳出、保険料収入、保険料基準額を相互変換しない。
- `null` と0を区別する。推測補完はしない。
- 年度・暦年・基準日時点・期間値と、地域粒度を明示する。
- 行政上の正式サービス分類 `official_category` とUI分類 `display_category` を分離する。
- 広域値には `reference_only: true` を必須とし、立川市値として扱えない構造にする。

## UI受け渡しレコード v2

```ts
type MetricRecord = {
  metric_id: string;
  display_name: string;
  act: "demand" | "money" | "capacity" | "workforce" | "wage" | "citizen_cost";
  official_category?: string;
  display_category?: "住む" | "通う" | "自宅で受ける" | "地域密着・複合" | "その他";
  source_name: string;
  source_url: string;
  publisher: string;
  geography: "tachikawa" | "tokyo" | "tama" | "national";
  geography_code?: string;
  geography_label: string;
  reference_only: boolean;
  period: { kind: "fiscal_year" | "calendar_year" | "as_of" | "plan_period"; year: number; label: string };
  value: number | null;
  unit: "persons" | "yen" | "yen_per_month" | "establishments" | "capacity_persons" | "fte" | "percent";
  source_definition: string;
  normalized_definition: string;
  comparison_group: string;
  comparable: boolean;
  comparability_note?: string;
  base_year: number | null;
  index_value: number | null;
  status: "available" | "no_data" | "not_comparable" | "definition_changed" | "fetch_failed" | "not_published" | "needs_review";
  retrieved_at: string;
  license: string;
  source_value: string | number | null;
  transformation_note: string;
};
```

## 指数化

```text
index_value = current_value / base_year_value * 100
```

以下を全て満たす系列だけ指数化する。

1. 基準年値が存在し0ではない。
2. 同一 `metric_id`、`comparison_group`、地域、単位、期間種別である。
3. 定義・集計方法・地域粒度が途中で変わっていない。
4. 欠損年や制度上の不連続がない。

満たさない場合は `index_value: null`, `comparable: false` と理由を保持する。丸めは表示時に行い、JSONには小数第6位まで保持する。

## 指標固有定義

### 第1号被保険者

- 各年度末時点の65歳以上の第1号被保険者総数。
- 認定者総数の分母としては使わない。認定者総数に第2号被保険者が含まれるため。

### 要支援・要介護認定者

- 各年度末時点の認定結果保有者総数。
- 第2号被保険者を含む。第1号被保険者だけの認定率を算出する場合は、分子から第2号認定者を除く。
- 推奨派生値: `(認定者総数 - 第2号認定者数) / 第1号被保険者数 * 100`。

### 介護保険給付費

- 立川市統計年報CSVの給付総額。原資料は「介護保険事業状況報告」の**保険給付決定状況の給付費**であり、支払日ベースの支給額とは呼ばない。決算の介護保険事業歳出とも別指標。
- サービス別給付「件数」は利用者実人数ではないため供給力に転用しない。

### 受け皿

- 単一の異種単位合算は作らず、サービス別供給プロファイルとして保持する。
- 入所系: 定員数、通所系: 利用定員、訪問系: 稼働事業所数、地域密着・複合: 登録定員を第一選択とする。
- 2020年12月末と2024年12月末の実CSVで、全24列のヘッダーが一致することを確認した。従業者列・休止廃止状態列は収録されない。
- `定員` は全サービスに列として存在するが、通所介護・介護老人福祉施設・小規模多機能型居宅介護の立川市行でも0または空欄が混在し、0が実定員か未保有値かを識別できない。2020〜2024の定員合計系列は作らない。
- 受け皿のMVP指標は、毎年12月末の `service_unit_count`（サービスコード×事業所番号の一意組合せ数）とする。「施設数」ではなく「介護サービスの提供単位数」と表示する。

### 職員数

- 実人数、常勤、非常勤、常勤換算を別metric_idにする。
- 介護サービス情報公表システムODには従業者列がない。介護サービス施設・事業所調査の公開表は都道府県×サービス×職種×勤務形態であり、立川市の連続表章ではない。
- 東京都のサービス別実人数・常勤換算数は2020〜2024で参照できるが、サービス表を足し上げた「介護職員総数」は作らない。東京都参考指標に限定し `reference_only: true` を設定する。

### 賃金

- 一般労働者の「きまって支給する現金給与額」「所定内給与額」「年間賞与その他特別給与額」を分ける。
- 東京都・職種別値のみを使い、`geography: "tokyo"`, `reference_only: true` を固定する。
- 実質化する場合は東京都区部または東京都の消費者物価指数の系列・基準年を別メタデータとして保持する。名目値と混在させない。
- e-Stat DB `0004007961`（令和2年以降・一般労働者・都道府県別・職種特掲）で、東京都×「介護職員（医療・福祉施設等）」の2020年以降を同一定義で比較する。企業規模計（10人以上）・男女計に固定する。e-Stat DB の時間軸は取得時点で 2020–2023。2024年は同 DB 未収録のため、令和6年調査の公開表（役職者を除く、statInfId=`000040247966`）から同一定義セルを追記する。
- 2020年に調査票・復元方法・職種分類が変更されたため、2019年以前とは接続しない。

### 介護保険料基準額

- 第1号被保険者の標準的な保険料算定基礎となる月額。個人の実際の支払額ではない。
- 3年の計画期間ごとに設定されるため `period.kind: "plan_period"` とする。
- 第8期は5,880円/月、第9期は6,183円/月。年次実績のように扱わず、計画期間内は同額の制度値として表示する。
- 保険料収入は財政規模の指標として残せるが、市民負担指標からは除外する。

## サービス分類

| UI分類 | 正式分類の例 | 優先供給指標 |
|---|---|---|
| 住む | 介護老人福祉施設、介護老人保健施設、介護医療院、特定施設 | 定員数 |
| 通う | 通所介護、地域密着型通所介護、通所リハビリ | 利用定員 |
| 自宅で受ける | 訪問介護、訪問入浴、訪問看護、訪問リハビリ | 稼働事業所数 |
| 地域密着・複合 | 小規模多機能、看護小規模多機能、認知症共同生活、定期巡回 | 登録定員または定員。なければサービス単位数 |

## 掲載しない指標（DataGap）

比較不能・欠測も情報として扱う。推測で補完せず、別指標や広域値を代理にしない。公開文言では実装用語（未接続、取得不可、見つからなかった、データなし、未取得）を使わない。

### 原則

1. **比較不能も情報** — 掲載しない理由を明示し、読者が判断できる状態にする。
2. **推測禁止** — 欠損を0や推定値で埋めない。
3. **代理禁止** — 定義・地域・期間が異なる指標を代わりに並べない（例: 不就学を不登校の代理にしない）。
4. **他地理を自治体実績にしない** — 都道府県・全国の値を市区町村の実績として扱わない（`reference_only: true` と同趣旨）。
5. **公開で実装用語を使わない** — UI では市民向けの日本語のみ。内部の監査・接続状態は docs / processed JSON に残す。
6. **掲載判断を伝える** — なぜ掲載しないか、何が比較できないか、参照できる原典があるかを公開文言で示す（`kind` のデフォルト + `title` / `reason` / `note` / 出典リンク）。
7. **欠測を品質分類する** — DataGap は単なる欠損フラグではなく、公開範囲・定義差・期間差・比較条件などによる品質分類（下記 `kind`）として扱う。

### kind 一覧

| kind | 意味 |
|---|---|
| `not_published` | 原典に当該地域の表・値が公開されていない |
| `wrong_geography` | 表はあるが地域粒度が合わない（都・指定都市など）。自治体実績にしない |
| `single_point_only` | 単年・一点のみで推移比較に使えない |
| `definition_break` | 定義・集計方法の変更で系列が途切れた |
| `not_equivalent` | 名前は近いが別指標。代理にしない |
| `incompatible_period` | 基準日・期間種別が異なり同一グラフに載せられない |
| `unavailable_for_comparison` | 原典に地域の表はあるが、複数年の同一定義比較が未確認 |

### 公開文言

- デフォルトは `kind` に対応する title / body（`src/lib/data-gap-copy.ts`）。
- `gap.title` / `gap.reason` で上書き可。`gap.note` は body の末尾に連結。
- プレースホルダ `{place}`（自治体ラベル）、`{label}`（指標の短い表示名）を展開する。

**文体（公開UI）**

1. 結論を先に書く（「今回は掲載していません」「確認中です」）。
2. 内部作業の言い方を避ける（未接続、取得不可、表章、行がありません、確認が終わっていない 等）。
3. 「〜しません」だけで終わらせず、理由と代替しない判断を短く添える。
4. 1ブロックは結論1文＋理由1〜2文まで。原典リンクは別行でよい。
5. 行政文書っぽい言い回し（表章、当該、年次系列、原典の市表 等）は避け、必要な専門用語だけ残す。

### MetricRecord.status との対応

`MetricRecord.status` の union は変更しない。DataGap は UI 向けの掲載判断を表し、次のように対応する。

| DataGap.kind | 主な MetricRecord.status | 備考 |
|---|---|---|
| `not_published` | `not_published` | 原典に表・値なし |
| `wrong_geography` | `not_comparable` | 広域値を自治体代理にしない |
| `single_point_only` | `not_comparable` | 推移に使わない |
| `definition_break` | `definition_changed` | 系列接続しない |
| `not_equivalent` | `not_comparable` | 別指標の代理禁止 |
| `incompatible_period` | `not_comparable` | 期間種別混在禁止 |
| `unavailable_for_comparison` | `needs_review` | 監査・定義確認待ち |

**介護 Act 3 Case B（都道府県参考のみ）**: `gaps` レコードは作らない。`reference.prefecture` の `referenceOnly: true` 系列を都道府県参考として表示し、意味は `wrong_geography` 相当（都道府県値を市区町村実績にしない）。UI 分岐は `resolveSupportAvailability` が正本。

## フィールド監査結果（2026-09-13）

| 監査対象 | 実データ確認 | 連続比較の結論 |
|---|---|---|
| 介護サービス情報公表システムOD | 2020・2024の訪問介護、通所介護、介護老人福祉施設、小規模多機能型居宅介護を確認。24列は一致。定員は0・空欄が混在、従業者・稼働状態列なし | `service_unit_count` は2020〜2024可。定員・職員は不可。2019は公開なし |
| 立川市の介護保険給付額 | CSV、統計年報PDF、原資料注記を照合。「介護保険事業状況報告」保険給付決定状況の給付費 | 2019〜2023可。支給額へ読み替えない。2024は現行CSV未収録 |
| 賃金構造基本統計調査 | e-Stat DB `0004007961` の年・地域・職種・賃金項目を確認 | 東京都参考として2020年以降可（DB は取得時点 2020–2023。2024は公開表で補完）。2019との接続不可 |
