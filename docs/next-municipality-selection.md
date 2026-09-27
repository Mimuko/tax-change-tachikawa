# MY-238 次の自治体選定と府中市×介護の横展開

調査日: 2026-09-27。既存の公開単位は立川市×介護、立川市×教育、練馬区×介護。次の1件には **府中市×介護** を選定した。介護は自治体別の被保険者・認定者・給付費と全国共通の提供単位数・東京都参考を既存 renderer に載せられ、教育より初期移植の指標対応を検証しやすい。

## 候補比較

| 候補 | 公開データ量・継続年数 | 定義・機械取得・既存 metric | DataGap / 将来比較 | 判定 |
|---|---|---|---|---|
| 府中市 | [統計書オープンデータ](https://www.city.fuchu.tokyo.jp/gyosei/opendata/toukeisyo-opendata.html)に介護3 CSV。被保険者・認定者は2001–2025年度、給付費も同期間を確認 | 年度末・円建ての列が明確。固定 URL の CSV を直接取得。主要3 metric と対応し、各年の内訳整合も検査可能 | 職員・賃金は市粒度の連続系列を確認できず東京都参考。23区・多摩市部と比較する際の規模差検証に有用 | **採用** |
| 武蔵野市 | [市勢統計オープンデータ](https://www.city.musashino.lg.jp/shiseijoho/tokeishiryo/shiseitokei/1046163.html)に第1号被保険者、認定者、給付額、サービス種類別額等の Excel 6表 | 介護の指標候補は豊富。Excel の表構造・基準日・直近連続年のセル検証が追加で必要 | 小規模市の比較対象として有用だが、今回の CSV 取得性では府中市が優位 | 見送り |
| 八王子市 | [統計八王子・福祉社会保障](https://www.city.hachioji.tokyo.jp/shisei/002/006/tokehachihkakunen/toukeihachiojih06/p035257.html)に給付状況・認定者数の Excel 表 | 年次刊行物を継続公開。第1号被保険者系列の同表での所在、年度横断の列定義とライセンスの監査が追加で必要 | 大規模市との比較に有用。主要3 metric が直ちに揃う府中市を優先 | 見送り |

府中市の CSV は公式[オープンデータ利用条件](https://www.city.fuchu.tokyo.jp/gyosei/opendata/index.html)で CC BY 4.0。上表の他候補は公開ページと形式の一次確認であり、セル値・連続年数まで確定した評価ではない。

## 採用データと定義

| 指標 | 原典 | 掲載期間 | 加工・注意 |
|---|---|---|---|
| 第1号被保険者 | [介護保険適用状況 CSV](https://www.city.fuchu.tokyo.jp/gyosei/opendata/toukeisyo-opendata.files/fuc22a07ltc01longtermcare_insurance.csv) | 2021–2025年度 | 各年度末の第1号列。3月31日の日付を前年度に対応。総数 = 第1号 + 第2号認定者を検証 |
| 認定者 | [介護度別有効認定者数 CSV](https://www.city.fuchu.tokyo.jp/gyosei/opendata/toukeisyo-opendata.files/fuc22a07ltc02longtermcare_insurance.csv) | 2021–2025年度 | 各年度末の総数。第2号を含むため第1号認定率は算出しない |
| 給付総額 | [保険給付状況 CSV](https://www.city.fuchu.tokyo.jp/gyosei/opendata/toukeisyo-opendata.files/fuc22a07ltc03longtermcare_insurance.csv) | 2021–2025年度 | 円建ての総額。居宅 + 施設 + その他との一致を各年検証。立川・練馬とは区分の範囲を同一視しない |
| 提供単位数 | [厚労省 介護サービス情報公表 OD](https://www.mhlw.go.jp/stf/kaigo-kouhyou_opendata.html) | 2020–2024年12月末 | 市区町村コード132063でサービスコード×事業所番号を重複除去。稼働施設数や定員ではない |
| 職員・賃金 | 既存の東京都参考系列 | 2020–2024年 | `referenceOnly: true`、`geography: tokyo`。府中市の実績として表示しない |
| 保険料基準月額 | [府中市 介護保険料](https://www.city.fuchu.tokyo.jp/kenko/hoken/kaigohokennryo/hokenryoukaisei2021.html) | 第8・9期 | 両期5,995円/月。第9期は据え置き。個人の実支払額ではない |

原典 CSV の末尾にある `1/0/1900,0,…` 等のゼロ埋め行は実績ではないため除外する。原典のバイト列は CC BY 表示付きで `data/raw/fuchu/care/` に保存し、processed の SHA-256 と照合する。更新時は `npm run data:fetch-fuchu`、`node scripts/build-service-unit-count.mjs fuchu care`、`node scripts/build-fuchu-care.mjs` の順。自動ビルドは検証済み raw と curated を使い、ネットワークに依存しない。

## 共通機能の差分監査

| 機能 | 府中市×介護での扱い |
|---|---|
| Story primitive / 共通 UI・レスポンシブ・アクセシビリティ | `CareStory` と既存 components を共有。自治体・テーマ・ストーリー config を登録して静的生成 |
| 時系列イベント | 2024年度の第9期開始を公式出典付きで `opening` と提供単位数グラフに表示。年度範囲外のイベントは共通 resolver が除外 |
| DataGap・geography・reference_only | 市粒度の職員・賃金系列は未掲載、東京都参考のみを Act 3 と振り返りに表示。第1号認定率は分母範囲が異なるため掲載しない |
| 出典・定義・年度・更新情報 | 指標ごとの原典 URL、定義、単位、SHA、利用条件を data ページに表示。最終収録年度と生成日も表示 |
| 支援への接続 | 府中市の在宅介護実態調査から既存指標と同定義の回答を検証できていないため未掲載。立川の調査値は流用しない |
| 保険料・受け皿の固定コピー | 据え置きと提供単位数の増減をデータから表示。立川だけを想定した固定の「上がった」「増えた」を解消 |

Mimu の確認論点: 府中市の介護保険料を「据え置き」とする編集表現と、府中市の支援への接続を調査完了まで非表示にする方針。いずれも公開データの欠落を推計で補うものではない。
