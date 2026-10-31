# MY-242 保育イベントと共通機能の差分監査

監査日: 2026-10-21。比較対象は立川市×介護・教育、練馬区×介護、府中市×介護。
設計原則は MY-152 と `docs/requirements.md`、掲載基準は `docs/timeline-events.md`。

## 掲載イベントと根拠

| 出来事 | 時点・一次資料 | 掲載先と理由 |
|---|---|---|
| 幼児教育・保育の無償化 | 2019年10月。[広報たちかわ2019年8月10日号3面](https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/005/730/20190810.pdf#page=3) | 表示保留（catalogに2019年の根拠を保持、bindingなし）。保育の利用を読む背景として確認したが、原表の基準日不明による前後関係の誤読を減らすためグラフへ重ねない。2020年への付け替えは実際の開始年と異なるため行わない。 |
| 柴崎保育園の民営化 | 2020年4月。[立川市「民営化の経過等」](https://www.city.tachikawa.lg.jp/kosodate/m-kosodate/1004946/1005092/1005101/1005105.html)、更新2024年4月17日。「民営化の経緯」と対象園の見出しで確認 | `opening` の自治体イベント。受け皿の運営体制の背景として掲載。公立・私立を含む全園集計と単一園を区別し、政策効果は示さない。`staff` は全園職員数の変化を読むのに必須な背景という根拠が弱く、掲載基準2を踏まえてbindingを削除。民営化で職員数が増減しないとも断定しない。 |

一次資料は上記日に閲覧し、事実を要約した。PDF・HTMLの原本は再配布しない。
資料の文章・画像は転載せず、引用元へのリンクを掲載する。数値CSVのCC BY 4.0表記とイベント資料の権利を混同しない。
イベントは年単位の位置に置き、正確な開始月は見出しに残す。数値との前後関係や因果関係を推定しない。
初期表示は既存仕様どおり自治体イベントのみ。現在の保育グラフには制度イベントをbindしていないため、国・制度checkboxは表示しない。無償化は原表基準日の確認、または数値の観測点と出来事の位置を区別する共通UIが整った段階で再検討する。

`consultation` には binding を置かない。今回確認した資料では、相談の延べ件数の推移に直接必要な背景として掲載基準を満たすイベントを確定できなかった。
感染症、学校休業、介護保険制度を他テーマから流用せず、相談への影響も推測しない。保育料の無償化を職員数・相談件数へ機械的に適用しない。

## 共通機能との差分

| 確認対象 | 分類 | 監査結果・対応 |
|---|---|---|
| イベントレイヤー | 実装漏れ | `StoryExperience` と `ChartWithTimelineEvents` は既設。欠けていた自治体×テーマのcatalogと共通resolverの登録を追加。storyのchart IDは既存と一致し、追加のstory登録は不要。 |
| Story primitive / 共通UI | テーマ固有 | Topbar、Experience、Act、Interlude、Recap、Detail、Footerを利用済み。介護の保険料・支援接続、教育の学級規模等の章立ては保育へ移植しない。CSSや共通部品の変更は不要。 |
| DataGap | 実装漏れ | 配列先頭への依存と詳細欄の独立した固定説明を修正。gapをIDで取得し、共通の `resolveDataGapCopy` / `formatDataGapPublicText` を利用する。待機児童は生成元で `not_published` と原表に限定したtitle/reason/noteを設定。「市全体でデータがない」と広げない。欠落時も注意書きを残し、到達率のActと詳細は同じcopyを利用する。 |
| reference_only / geography | テーマ固有・データ不足 | 今回の4系列はすべて立川市の値。Recapに自治体区分あり。介護の東京都賃金参考値は保育の代替値ではないため追加しない。待機児童・相談到達率も推測補完しない。 |
| 出典・定義・年度・更新 | 差分なし | topicの定義・単位・比較ルール、provenanceの原典URL・取得日・SHA、SourcePageの生成日・最終年度、Footerの注意書きを確認。保育の年次値と相談の年度累計を分離する仕様を維持。 |
| Detail / Source | 差分なし | 年度別の値、定義、原典、加工方法への導線あり。イベントの個別出典は共通popoverに表示。数値出典ページをイベント一覧へ作り替えない。 |
| responsive / accessibility | 共通仕様を再利用 | 既存のcheckbox、SVGマーカーのキーボード選択、閉じるボタン、出典リンクを確認。色・フォーカス表現を追加CSSで上書きしない。 |
| topic / story / municipality config | 差分なし | 指標意味はtopic、表示系列はstory、自治体情報はmunicipality、出来事とchart bindingはevents catalog。共通resolverの未知catalog・未知chart・範囲外年度は空配列。 |

## 検証

- `npm test`: レビュー対応後のビルド後検証では30件成功。追加テストで保育のchart binding、収録年限定、初期表示、無償化の非表示・実際の発生年保持、未登録グラフとgap欠落・順序を確認。通常のWindows checkoutへ復元した最終状態では29件成功・既存介護provenanceの1件がSHA不一致（下記の環境課題）。
- `npm run lint` / `npx tsc --noEmit` / `npm run build`: 成功。14静的ページ出力。Google Fonts取得とNode子プロセスに必要なsandbox外実行で再検証。
- Chromeの本番静的出力 `/tachikawa/childcare/` を1440×1000、768×1000、390×1000で確認。Enterでマーカー選択、説明・出典、閉じるボタンを確認。レビュー後は職員グラフのレイヤー・制度checkboxが出ないことと、gap文言・詳細の表示も再確認。横overflowなし。ローカル `.cache/childcare-<width>.png` に証拠を保存。
- 同じ3幅で変更後を再確認。既存CSSの変更・追加、重複wrapperの追加なし。別途のCSS refactorは不要。
- 立川介護・教育、練馬介護、府中介護、保育SourcePageをChromeで巡回しmainの描画とタイトルを確認。JavaScript例外なし。既存ページの全操作・全ブラウザ検証までは行っていない。
- Lighthouse 11.7.1、Chrome headless、mobile既定条件、Python静的サーバー（localhost:3100）: レビュー対応後 Performance 35 / Accessibility 96 / Best Practices 96 / SEO 92。初回は37 / 96 / 96 / 92。性能2点の差の原因は未判定で、厳密な条件統制をした比較ではない。
- Lighthouseの指摘は既存Hero/eyebrow等の色コントラスト、Footerの可視テキストとaria-label不一致、canonical未設定、favicon/RSCテキストのローカル404、描画時間・blocking。イベントデータ追加の範囲を超える共通品質調整は行っていない。ローカル配信条件を本番と同一とみなさない。

## Windows環境での再現性

初回の `data:stable` は立川介護4系列のSHA差で失敗した。HEADのrawバイトとcheckout後のrawを比較し、CRLF/LFの差だけであることを確認した。
ローカル検証用に4つのrawをHEAD保存済みバイトへ戻して再生成し、`data:stable` と `data:check` は成功した。生成日時だけの差分や他テーマのSHA更新は本PRに含めない。
原本の改行保存方針と共通品質監査の恒久対応は [MY-339](https://linear.app/myworkspace1126/issue/MY-339) で調査し、イベント追加へ混入させない。

## PRレビューへの対応

| 指摘 | 判断・対応 |
|---|---|
| gap欠落で注意書きが消える | 妥当。IDで解決し、欠落時も待機児童・相談到達率の説明を維持。欠落・片側欠落・逆順を回帰テスト。 |
| kindとstoryのtitle上書き | 妥当。原表に対象値がないことを `not_published` で示し、限定したtitleを生成元へ移動。storyの上書きを削除。 |
| 公開文の句点・内部文体・重複 | 妥当。句点付きタイトルと丁寧な本文にし、相談Actと詳細が同じcopyを参照。 |
| 民営化のstaff binding | 掲載基準2の根拠が弱い指摘を採用して削除。ただし「民営化では全園職員数が変わらない」という因果の断定は採用しない。 |
| 無償化の2019年マーカー | 2019年表示自体は年単位イベント仕様の違反ではない。誤読リスクを抑えるためbindingを保留。2020年への移動は事実と異なるので不採用。再表示条件は上記。 |
| chartYearsがcapacity由来 | 妥当。staffとconsultationはそれぞれの実系列の年を使用。 |
| WindowsのSHA既知失敗 | PR本文への明記は対応済み。前commitのGitHub CI verifyも成功。原本保存方針の恒久対応をこのPRへ拡張せずMY-339で扱う。 |

独立したレビュー担当が実装差分を再確認し、上記方針と実装の整合を確認した。共通CSSや原本バイトの変更はない。
