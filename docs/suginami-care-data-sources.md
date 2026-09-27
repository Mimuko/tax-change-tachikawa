# 杉並区×介護 データソース調査

調査日: 2026-09-27（MY-238）。`/suginami/care` 公開用の監査正本。

## 結論サマリ

| 指標 | 原典 | 5年比較 | 基準日 | 判定 |
|---|---|---|---|---|
| 第1号被保険者数 | 統計書 9-9-1-1 CSV | 令和2–6 | 各年度末 | **採用** |
| 要支援・要介護認定者数 | 9-9-1-2 CSV | 令和2–6 | 各年度末 | **採用**（認定率は非算出） |
| 介護保険給付総額 | 9-9-4 CSV | 令和2–6 | 年度実績（総数金額） | **採用** |
| 提供単位数 | 厚労省 OD | 2020–2024 | 12月末 | **そのまま再利用** |
| 職員・賃金 | e-Stat 東京都参考 | 2020–2024 | 年次 | **reference_only** |
| 保険料基準月額 | 区公式・都資料 | 第8期・第9期 | 計画期間値 | **採用** |
| 保険料収入 | 9-9-3 CSV | あり | 年度実績 | **MVP外**（立川/練馬と同趣旨） |

## 原典 URL

| ファイル | URL |
|---|---|
| 統計書索引 | https://www.city.suginami.tokyo.jp/s016/25286.html |
| 第1号被保険者 CSV | https://www.city.suginami.tokyo.jp/documents/25286/r7-09-09-01-01.csv |
| 認定者 CSV | https://www.city.suginami.tokyo.jp/documents/25286/r7-09-09-01-02.csv |
| 給付 CSV | https://www.city.suginami.tokyo.jp/documents/25286/r7-09-09-04.csv |
| 保険料（制度値） | https://www.city.suginami.tokyo.jp/s040/1938.html |
| 第8期基準月額（6,200円） | 東京都 https://www.spt.metro.tokyo.lg.jp/tosei/hodohappyo/press/2021/03/31/documents/10_01.pdf |
| 第9期基準月額（6,400円） | 区公式ページ第5段階 年76,800円（月6,400円） |

## 立川・練馬との差分

| 項目 | 立川市 | 練馬区 | 杉並区 |
|---|---|---|---|
| 需要系 | OD CSV | 統計書 Excel（local-only） | **統計書 CSV（CC BY）** |
| 認定者基準日 | 年度末 | **9月末** | **年度末** |
| 給付費 | 円 | 千円合算 | **円（総数金額列）** |
| 第9期基準月額 | 6,183 | 6,670 | **6,400** |

## ライセンス

統計書 CSV はページ上で **CC BY 4.0** 表示。`data/raw/suginami/care/` に原本をコミットし、provenance に SHA-256 を記録する。

## 更新頻度

杉並区統計書は年次（R7 版で令和2–6年度を収録）。CSV URL は年度版更新時に `config/data-sources/suginami/care.json` の path/URL を再監査する。
