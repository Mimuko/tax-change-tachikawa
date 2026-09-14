# curated データ

`scripts/build-data.mjs` が任意で読み込み、`data/processed/tachikawa/care/dashboard.json` へマージする。

## service-unit-count.json

生成: `npm run data:service-units`（厚労省ODから立川市を集計）。

## tokyo-reference.json

生成: `npm run data:tokyo-reference`（要 `E_STAT_APP_ID`。.env 可）。

[`docs/metrics.md`](../../docs/metrics.md) で確定した `metric_id` のみを載せる。UIは配列をそのまま表示し、系列の独自選定をしない。

- Phase 1: `care_worker_scheduled_salary_tokyo` のみ実値（千円→円）。
- `care_worker_fte` / `care_worker_headcount` はサービス×職種の代表セルが決まるまで未収録（横断合計禁止）。

```json
{
  "metrics": [
    {
      "metricId": "care_worker_fte",
      "label": "介護職員 常勤換算数（東京都・サービス×職種）",
      "unit": "fte",
      "referenceOnly": true,
      "geography": "tokyo",
      "points": [],
      "provenance": {
        "title": "介護サービス施設・事業所調査",
        "definition": "都道府県×サービス×職種。サービス横断合計はしない。",
        "unit": "fte"
      }
    },
    {
      "metricId": "care_worker_headcount",
      "label": "介護職員 実人数（東京都）",
      "unit": "人",
      "referenceOnly": true,
      "geography": "tokyo",
      "points": [],
      "provenance": {
        "title": "介護サービス施設・事業所調査",
        "definition": "常勤専従・常勤兼務・非常勤別。サービス横断合計はしない。",
        "unit": "persons"
      }
    },
    {
      "metricId": "care_worker_scheduled_salary_tokyo",
      "label": "介護職員の所定内給与（東京都）",
      "unit": "円",
      "referenceOnly": true,
      "geography": "tokyo",
      "points": [],
      "provenance": {
        "title": "賃金構造基本統計調査 DB 0004007961",
        "definition": "一般労働者・企業規模10人以上・男女計・東京都・介護職員（医療・福祉施設等）。2020年以降のみ。",
        "unit": "yen_per_month"
      }
    }
  ]
}
```

架空の数値は置かない。`points` に実値がある metric だけが dashboard へ渡る。
