# Data licensing and provenance

このディレクトリのデータにはルートのMIT Licenseを適用しません。各原典のライセンスと利用条件が引き続き適用されます。

## 再配布可否による raw 管理基準

| 区分 | 条件 | Git に置くもの | 置かないもの |
|---|---|---|---|
| 再配布可 | CC BY 等で再配布が明示されている | 原典 raw + processed/curated | — |
| local-only | 許諾なし／不明／サイトポリシーで転載禁止 | 取得手順・URL・期待 SHA・最小限の加工済み curated | 原典ファイル本体（XLSX/PDF 等） |

許諾を確認していない自治体・資料は、原則 **local-only** として扱う。区・市から許諾を得た場合、または適用される利用条件の根拠を記録できた場合に限り raw の Git 管理へ切り替える。

## 立川市オープンデータ（再配布可）

| 項目 | 内容 |
|---|---|
| 出典 | 立川市オープンデータ「統計年報・社会福祉」 |
| 掲載ページ | https://www.city.tachikawa.lg.jp/shisei/tokei/1007009/1007020.html |
| ライセンス | Creative Commons Attribution 4.0 International (CC BY 4.0) |
| クレジット | 出典名・原典URL・ライセンスを表示する |
| 加工 | 許可（帰属表示等の条件に従う） |
| 再配布 | 許可（帰属表示等の条件に従う） |

`raw/tachikawa/` は取得したCSV、`processed/dashboard.json` はその派生物です。取得URL・取得日時・SHA-256・加工処理を追跡可能にします。利用者は原典の最新条件も確認してください。

出典表示例: 「出典: 立川市オープンデータ（CC BY 4.0）、加工して作成」

## 練馬区統計書（local-only）

| 項目 | 内容 |
|---|---|
| 出典 | 練馬区統計書 R7 福祉 Excel `hyo08.xlsx` |
| 掲載ページ | https://www.city.nerima.tokyo.jp/kusei/tokei/tokeisho/R7toukeisho.html |
| サイトポリシー | https://www.city.nerima.tokyo.jp/aboutweb/sitepolicy.html |
| 再配布 | **不可（許諾未確認）** — 原典 XLSX は Git 非管理 |
| Git 管理 | 取得手順（`data/raw/nerima/care/README.md`）、期待 SHA、`data/curated/nerima/care/` の加工済み系列 |
| ローカル再抽出 | 原典を手動配置後 `npm run data:extract-nerima` |
