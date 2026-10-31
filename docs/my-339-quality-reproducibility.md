# MY-339 共通品質とWindows原本SHAの調査

調査日: 2026-10-31（JST）。対象Issue: [MY-339](https://linear.app/myworkspace1126/issue/MY-339)。
変更前baselineは `ba017a5895c9115ec8564bce5dbc52e0be786323`。この調査ではアプリ、原本、依存関係、配信設定を変更しない。

## 判断と推奨順序

1. 原本CSVを `.gitattributes` の `-text` で保護する後続実装を推奨する。原本のSHA計算は実バイト照合のまま維持する。既存4系列の検証失敗と、検証対象外の `service-benefits.csv` の改行変換を確認した。
2. 共通Footerのaccessible name、canonicalの絶対URL化、faviconを、それぞれ既存品質の最小修正として扱う。
3. コントラストは失敗箇所と色の組合せを記録した。既存トークンで満たせる範囲を検討し、配色変更はMimuの承認後に実装する。
4. 性能は今回の計測を後続改善前baselineとして残す。単発スコアを目標値やイベント追加の影響量として使わず、同一条件の複数回計測とリソース分析から着手する。

測定値の抜粋、SHA、HTTP、72画面条件の記録は [evidence.json](my-339/evidence.json) に保存した。計測用スクリプト・全Lighthouse JSON・画像・ビルドログはローカルの `.cache/my-339/` にある（Git非管理）。

## 環境と配信先の確定

| 項目 | 条件 |
|---|---|
| OS / runtime | Windows、Node.js 22.13.1、npm 10.9.2。package.jsonのVolta指定22.23.4とは異なるため、追試ではruntimeを揃える |
| アプリ | Next.js 16.3.5、React 19.1.1、`output: "export"`、`trailingSlash: true` |
| Git | システム設定 `core.autocrlf=true`。開始時の作業ツリーはclean |
| ローカル | `npm run build` 成功、14静的ページ出力。`python -m http.server 3100 --bind 127.0.0.1 --directory out` |
| 公開URL | `https://tax-change-tachikawa.vercel.app`。GitHub repositoryのhomepageと応答の `server: Vercel` で確認 |
| deployment | GitHub deployment ID `7455413685`、Production / success、SHAは上記baselineと一致。deployment URLは `https://tax-change-tachikawa-mow98tdbs-mimus-projects-a9fc45df.vercel.app` |
| Netlify | READMEとnetlify.tomlには設定があるが、今回確認できた実配信はVercel。NetlifyのURL・稼働・設定は未確認で、Netlify固有の成否は結論しない |
| ブラウザ | Chrome 156.0.8078.79、Playwright 1.58.2、headless |
| Lighthouse | 11.7.1。既存npmキャッシュから実行し、package.json / lockfileに追加なし |

公開URLはブラウザとHTTPで実際に取得した。GitHubの情報は `gh api repos/Mimuko/tax-change-tachikawa`、`.../deployments?per_page=3`、`.../deployments/7455413685/statuses` の読取結果による。本番設定は変更していない。

Next.js同梱の `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` と `03-api-reference/04-functions/generate-metadata.md` を確認した。静的出力とmetadataの判断はこの版のガイドと実出力を優先する。

## WindowsのSHA差

### 再現条件と結果

通常のWindows checkoutを用い、次の順で確認した。元のrawバイトは書き換えていない。

```powershell
git config --show-origin --get core.autocrlf
git ls-files --eol data/raw
npm run data:check
npm run data:build
npm run data:stable
```

`data:check` は再生成前のコミット済みJSONに対して立川介護4系列のSHA不一致で失敗する。`data:build` は成功するが、`data:stable` は立川介護の4つのSHA差で失敗する。練馬・府中のcareはgeneratedAtだけの差だった。再生成後に `data:check` が成功しても、CRLFのローカルrawに合わせたSHAになっただけで、環境間の再現性が直ったことにはならない。

初回のsandbox内 `data:stable` は `spawnSync git EPERM` で実行不能だった。子プロセスを実行できる条件で再実行し、実際のSHAドリフトによる失敗を確認した。環境の実行制限とデータ不一致を区別する。

| 立川介護CSV | Git HEADバイト数 → checkout後 | SHA検証への影響 |
|---|---:|---|
| insured.csv | 648 → 665 | insuredで不一致 |
| certified.csv | 1376 → 1395 | certifiedで不一致 |
| benefits.csv | 1050 → 1067 | benefitsで不一致 |
| premium-revenue.csv | 843 → 861 | premiumRevenueで不一致 |
| service-benefits.csv | 8565 → 8587 | 現在の `loadCareProvenanceChecks` の対象外。潜在的な原本保存問題 |

5ファイルとも `git ls-files --eol` は `i/lf w/crlf attr/`。HEADとcheckout後のバイト列は不一致だが、比較用メモリ上でCRLFだけをLFにしたバイト列は一致した。文字コード変換はしていない。したがって今回のcheckout差は改行差で説明できる。原典サイトで現在配信されるバイトとの一致や、過去の取り込み時点の正規化有無までは検証していない。

府中の3CSVは `i/crlf w/crlf` で実バイト一致。立川保育の2CSVも既存の `-text -diff` により実バイト一致だった。全10CSVのHEAD / working tree SHAとバイト数はevidence.jsonに記録した。

### 原本を書き換えない対照実験

`.cache/my-339/head-byte-fixture/` にscripts・config・dataの隔離コピーを作り、rawとprocessedだけを `git show HEAD:<path>` のBufferで配置した。PowerShellのテキストリダイレクトは使わず、文字コードや改行を介さず保存した。そこで各buildスクリプトと `check-provenance-sha.mjs` を実行すると10項目のSHA照合が成功した。

再生成結果は、追跡されている5つのprocessed dashboardすべてでgeneratedAtを除いてHEADと一致した。fixture内はGit追跡パスではないため、`data:stable` 成功とは表現せず、JSON構造の比較結果として記録する。元のraw、Git設定、indexは変更していない。

### 恒久案の比較

| 案 | 評価・採否 |
|---|---|
| raw CSVを `-text` にする | **推奨**。Git保存済みバイトの変換を防ぎ、LFの立川介護・CRLFの府中・CP932の保育を一律LF化しない。例: `data/raw/**/*.csv -text`。既存の保育 `-diff` は別属性として維持可能 |
| `text eol=lf` で統一 | 不採用。作業ツリーを揃えられてもCRLF原本を変える方針になり、原本実バイト照合の目的と異なる |
| 個人の `core.autocrlf=false` | 診断・一時回避には使えるが、各開発者とCIの設定に依存し、配布される恒久ルールにならない |
| SHA計算前に改行正規化 | 不採用。実バイトSHAと正規化後SHAを混同し、原本の改変検出を弱める |
| Windows再生成SHAをコミット | 不採用。Linux側で再び不一致になり、環境依存を反転させるだけ |

[`-text` は改行変換を無効化するGit属性](https://git-scm.com/docs/gitattributes)である。属性追加だけでは既存checkoutのCRLFを戻せないため、後続実装では未保存変更を保護した上で対象rawだけを再checkoutし、fresh cloneでも検証する。`git add --renormalize .` やraw一括置換を解決策として実行しない。

推奨の段階は「Git保存済みバイトを保護する」まで。もし原典の再取得結果とHEADが改行以外でも違う場合は、データ更新と保存方針を分けて判断する。

`data:stable` の対象はcareの3dashboardのみで、保育・教育は含まれない。今回のfixtureでは5つとも比較したが、恒久的な検証対象拡張は別途範囲を明示する。

取得経路もコードで確認した。`scripts/fetch-data.mjs` は `response.arrayBuffer()` を `Uint8Array` にして `writeFile` へ渡し、`scripts/fetch-fuchu-care.mjs` は同じ応答を `Buffer.from` で保存している。これらのraw保存処理には文字列化・改行置換がなく、現状は応答バイトを保持する実装である。今回ネットワーク再取得による上書きは行っていないため、配信元の現在のバイトとの一致までは検証していない。保育は共通 `data:fetch` の対応対象外なので、後続では保育を含む手動取得経路も確認し、10CSVすべてについて取得からGit保存・checkoutまでバイトを保つことを受入条件にする。

## 共通品質の変更前baseline

### 主要ルートと3幅

以下12ルートをローカル静的出力と公開URLの両方で、390×1000・768×1000・1440×1000で巡回した（計72条件）。すべてHTTP 200、main描画あり、`documentElement.scrollWidth > innerWidth` はfalse、`pageerror` は0だった。

```text
/
/data/
/tachikawa/care/
/nerima/care/
/fuchu/care/
/tachikawa/education/
/tachikawa/childcare/
/tachikawa/care/data/
/nerima/care/data/
/fuchu/care/data/
/tachikawa/education/data/
/tachikawa/childcare/data/
```

保育の全ページスクリーンショットを両環境3幅で保存した。Hero 390 / 1440とFooter 768の画像を目視確認し、既存の大きな見出しの折返しとFooter描画を確認した。この巡回は全操作、全ブラウザ、全サイトWCAG適合の確認ではない。

### Lighthouse条件

全10回ともLighthouse 11.7.1。mobile既定は412×823・DPR1.75・simulate・RTT150ms・throughput1638.4Kbps・CPU slowdown4。上の390px巡回とは異なる幅であり、evidence.jsonには**実際のscreenEmulation**を保存している。

768 / 1440は高さ1000・DPR1・formFactor desktopのカスタム測定で、通信とCPUのthrottlingは上記を維持した。通常のdesktop presetではないため、mobileとの性能スコア比較には使わない。GTM等の外部通信は有効のまま。各条件1回で、最初のローカル2回はブラウザ巡回と一部時間が重なる。性能評価には追試が必要。

| 配信・ページ | 画面条件 | P | A | BP | SEO |
|---|---|---:|---:|---:|---:|
| local / | mobile既定 | 58 | 95 | 96 | 92 |
| local 立川介護 | mobile既定 | 55 | 96 | 96 | 92 |
| local 練馬介護 | mobile既定 | 52 | 96 | 96 | 92 |
| local 府中介護 | mobile既定 | 57 | 96 | 96 | 92 |
| local 立川教育 | mobile既定 | 52 | 96 | 96 | 92 |
| local 立川保育 | mobile既定 | 58 | 96 | 96 | 92 |
| local 保育の出典 | mobile既定 | 77 | 100 | 96 | 92 |
| local 立川保育 | custom 768 | 51 | 96 | 96 | 90 |
| local 立川保育 | custom 1440 | 42 | 96 | 96 | 90 |
| public 立川保育 | mobile既定 | 52 | 96 | 96 | 92 |

MY-242の過去記録はmobileで初回37 / 96 / 96 / 92、レビュー後35 / 96 / 96 / 92だった。今回はChrome版・計測日時・Next.js版等を厳密に統制した過去commitの再計測ではない。今回の58を改善量と解釈せず、今回のコードを変更する前のbaselineとして使う。

追試は上記commitのclean checkoutで `npm ci`、`npm run build` を行い、別ターミナルで上記Pythonサーバーを起動する。既存Lighthouseを使わない環境では、以下のように版とChromeを固定できる（npxの初回は取得が発生する）。

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npx --yes --package=lighthouse@11.7.1 lighthouse http://127.0.0.1:3100/tachikawa/childcare/ --chrome-flags="--headless=new --disable-extensions" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=./childcare-local.json
npx --yes --package=lighthouse@11.7.1 lighthouse https://tax-change-tachikawa.vercel.app/tachikawa/childcare/ --chrome-flags="--headless=new --disable-extensions" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=./childcare-public.json
```

公開URLのdeploymentが進む可能性があるため、比較前にGitHub deploymentのSHAを再確認する。今回のカスタム幅を再現する場合はNode APIのflagsで `formFactor: "desktop"` と `screenEmulation: { mobile: false, width: 768 /* または1440 */, height: 1000, deviceScaleFactor: 1, disabled: false }` を指定し、throttlingはevidence.jsonと照合する。

### 再現した指摘と帰属

| 指摘 | 確認した根拠 | 分類・最小方針 |
|---|---|---|
| コントラスト | `color-contrast` 失敗。Hero `h1 > em` の `#e57443 / #f5f0e7` は2.67、必要3。step-eyebrowやdetail-numの `#b84a22 / #e9e4d9` は4.09、必要4.5。教育Heroの補助ラベル等も検出 | 既存共通CSS。背景別に失敗selectorを棚卸しし、既存トークンの適用案から確認。新色・配色変更は承認後 |
| Footerの名前不一致 | `label-content-name-mismatch`。表示「立川市の公開データ」に対し `aria-label="原典を開く（外部サイト）"`。他自治体でも同じ部品 | 既存SiteFooter。可視ラベルを含むaccessible nameへ最小修正。自治体名を固定しない |
| canonical | local / publicとも `canonical` 失敗。理由は `Is not an absolute URL (/tachikawa/childcare/)`。`/data/` はタグ自体なし | 既存metadataとビルド環境。`getSiteUrl` は `NEXT_PUBLIC_SITE_URL ?? URL` の順に参照し、Netlifyの `URL` に依存するfallbackを持つ。Vercel側の `NEXT_PUBLIC_SITE_URL` 設定は未確認。共有URL・OGへの波及も後続案Bで確認する |
| favicon | local / publicとも `/favicon.ico` が404 | 既存の欠落。承認済み資産の有無を確認し、ある場合のみ最小追加。新しいロゴを無断生成しない |
| RSC txt | Pythonでprefetchのflattened pathが404、Vercelで同一pathが200 | 配信条件差。公開障害とは扱わない。次節参照 |
| 初回描画・blocking | local保育 FCP6.70s / LCP12.98s / TBT137ms。public保育 FCP6.02s / LCP10.84s / TBT269.5ms | 共通リソースと配信差を要分析。イベント追加の性能影響と断定しない |

コントラストの数値は今回のLighthouseノード診断による。canonicalについては[Chrome公式の監査説明](https://developer.chrome.com/docs/lighthouse/seo/canonical)と今回の `explanation` を照合した。

canonicalの原因候補をコードから絞ると、`src/lib/site-url.ts` の `getSiteUrl()` は `process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL` だけを参照する。`src/app/layout.tsx` はその戻り値を `metadataBase` に渡し、`src/lib/story-metadata.ts` はcanonicalと `openGraph.url` に相対パスを設定する。`URL` は[Netlifyのビルド環境変数](https://docs.netlify.com/build/configure-builds/environment-variables/)であり、[Vercelの標準変数](https://vercel.com/docs/environment-variables/system-environment-variables)は `VERCEL_URL` 等の別名で、この関数はそれらを参照しない。したがってVercelで `NEXT_PUBLIC_SITE_URL` と独自設定の `URL` がともに未設定なら、`getSiteUrl()` と `metadataBase` はundefinedになる。今回の実出力が相対canonicalであることと整合する原因候補だが、Vercelプロジェクトの環境変数の有無・値・適用環境は未確認であり、「未設定だった」と確定しない。

同じファイルの `buildShareUrl()` も `getSiteUrl()` を使い、戻り値がない場合はX共有リンクへ `url` パラメータを追加しない。呼出元はcare・education・childcareの各storyである。共有URLの欠落とOG URLの不適切な解決は波及候補として扱い、現在の公開ページでの発生有無は未検証とする。後続案BではVercel Project Settingsの `NEXT_PUBLIC_SITE_URL` の有無・Production / Previewへの適用、生成HTMLのcanonical / `og:url`、共有リンクの `url` パラメータをそれぞれ確認する。環境変数の未設定をコードの推測だけで断定したり、previewのホストをそのまま正規URLに採用したりしない。

MY-242の `1cf8054^..42fc995` の差分には共通CSS、SiteFooter、metadata、layout、raw CSVの変更がない。変更は保育イベントcatalog、resolver登録、保育story/copy、gap生成文言、関連tests/docsだった。共通ページでも同じ指摘が再現するため、上記をイベント変更の新規不具合と分類する根拠はない。ただしイベント追加前commitの性能を同条件で再ビルドしていないので、イベントの性能影響ゼロとは結論しない。

保育localでrender-blocking CSSは約189KBと32KB（HTTP非圧縮）、unused CSS推計196KiB、unused JS推計294KiB。GTM / gtagもunused JSに含まれた。未使用量は初期表示に対する推計であり、フォントのunicode範囲や後続操作に必要なCSS/JSを機械的に削除しない。計測タグの停止やフォント変更も別判断とする。

## 404の配信条件差

次の同一リクエストを両環境に送り、statusとContent-Typeも保存した。

| path（保育配下は `/tachikawa/childcare/`） | Python static | 公開Vercel |
|---|---|---|
| `/favicon.ico` | 404 HTML | 404 HTML |
| `index.txt` | 200 text/plain | 200 text/plain |
| `__next.$d$municipality.$d$topic.__PAGE__.txt` | 404 HTML | 200 text/plain |
| `__next.$d$municipality/$d$topic/__PAGE__.txt` | 200 text/plain | 404 HTML |

Python側の実ファイルはディレクトリを含む形式だが、クライアントはflattened形式を要求している。Vercelはその要求に応答しており、今回のpublic巡回でもRSC 404は観測されなかった。localの `errors-in-console` はfaviconとRSC、public保育の同auditはfaviconのみだった。

後続の性能検証は公開deploymentまたはNext.js静的出力に対応した配信を用いる。単純なSPA fallbackでtxtリクエストにHTML 200を返す方法は採用しない。Netlifyは未検証のため、将来使う場合はDeploy Previewでtxtのstatus・Content-Type・内容を再確認する。

## Cursor向け後続実装案

以下は調査の引継ぎ案であり、このIssueでは実装していない。独立したIssueへ移す場合も5項目を維持する。

### A. 原本CSVのバイト保存とWindows再現性

- **実装対象**: `.gitattributes` で全raw CSVの `-text` を指定し、既存保育属性を維持。Windows fresh checkoutとLinuxでSHA・再生成を確認。`data:fetch` 系のraw書込みがBuffer / Uint8Arrayのままであることと、保育の手動取得経路も確認する。service-benefitsの検証方針とcare以外の検証対象拡張は必要性を明記して範囲を確定する。
- **非対象**: 原本の一括LF化、文字コード変換、原典再取得によるデータ更新、SHA計算の正規化、系列値や定義の変更。
- **守る既存仕様**: raw実バイトとprovenanceの一致、local-only原典のexpectedSha256、府中CRLF・保育CP932の保存、自治体/topic/story責務分離。
- **完了条件**: `core.autocrlf=true` のWindows fresh checkoutとLinuxで `data:check`、`data:build`、`data:check`、`data:stable` が成功。`git ls-files --eol data/raw` で全10CSVが `attr/-text` になり、checkoutバイトがGit保存済みバイトと一致する。取得処理が文字列化・改行変換せず応答バイトを保存することを確認し、processedがgeneratedAt以外で変化せず、rawの意図しない差分がない。
- **停止条件**: 原典との差が改行だけでは説明できない、原典・ライセンス・意味への影響がある、未保存のraw編集がある場合はMimuへ戻す。

### B. Footerとcanonicalの最小修正

- **実装対象**: SiteFooterのaccessible nameに可視自治体名と公開データの文言を含める。原因候補である `getSiteUrl()` の `NEXT_PUBLIC_SITE_URL ?? URL` という優先順位とNetlify前提のfallbackを、Vercelのビルド環境と照合する。Vercel Project Settingsで `NEXT_PUBLIC_SITE_URL` の有無・Production / Previewの適用範囲を確認する（現時点では未確認）。確定したoriginから全公開ルートの絶対canonicalと旧 `/data/` の正規URLを定義し、同じ関数を使う共有URLとOGへの波及も確認する。
- **非対象**: 配色・レイアウト・本文再設計、公開環境変数の無断変更、テーマ別のmetadata重複実装。
- **守る既存仕様**: municipalityから自治体名を取得、外部リンクのrelとtarget、既存パスと出典導線、設定値優先順位、自治体/topic/story責務分離。
- **完了条件**: 全自治体のFooterに可視ラベルを含む読み上げ名があり、`label-content-name-mismatch` が解消。Vercelの `NEXT_PUBLIC_SITE_URL` 設定状況・適用環境とoriginの優先順位を記録し、確定した公開originでのビルドとProduction / Previewの生成HTMLでcanonical・`og:url` が意図した絶対URLになることを確認する。care・education・childcareの共有リンクに意図したstory絶対URLの `url` パラメータが含まれ、公開URLで `canonical` auditを通過し、既存ルートの遷移が維持される。
- **停止条件**: 正規の公開originや旧 `/data/` の扱いが未確定、複数ホストのindex方針が衝突する、本番設定変更が必要な場合はMimuへ戻す。

### C. コントラストとfavicon

- **実装対象**: evidenceのselectorと背景色の組を全5story・TOP・出典で確認。既存トークンによる最小案を提示し、Mimu承認後に配色を修正。faviconは承認済み資産を確認して追加する。
- **非対象**: 新デザイン、ロゴの新規生成、全サイトWCAG適合の断言、イベント固有CSSでの上書き。
- **守る既存仕様**: 既存の見た目の承認境界、共通トークン、地理区分と系列色の意味、focus表示、responsive構造。
- **完了条件**: 対象selectorのコントラスト指摘が3幅・公開相当配信で解消し、見た目の差分が承認範囲内。faviconが実公開で200かつ正しいContent-Type。全12ルートの回帰確認を記録。
- **停止条件**: 新色・新資産・装飾の意味変更が未承認、グラフ色やfocusとの識別が損なわれる場合はMimuへ戻す。

### D. 配信と初回描画の追加検証

- **実装対象**: 確定deploymentと同一Chrome / Lighthouse版で保育と代表careを各3回、中央値で比較。圧縮・cache・font CSS・GTM・hydrationの寄与を測定し、最小案と期待効果を記録。Netlify利用時はPreviewでRSC応答も検証。
- **非対象**: 推計unusedだけを根拠とした削除、計測タグ停止、依存更新、大規模構造変更、Pythonだけの404を本番障害とする修正。
- **守る既存仕様**: 静的export、既存の計測要件、フォントと承認済み表示、prefetchとクライアント遷移、データ定義とイベント操作。
- **完了条件**: runtime・通信・CPU・origin・commitを固定したbaselineと候補を示し、改善対象のボトルネックを特定。RSCがHTML fallbackではなく正しいtext応答であることを確認。実装修正を行う場合は先に対象を絞った別Issueにする。
- **停止条件**: 実ホストや対象deploymentが確定しない、計測・配信設定変更や共通アーキテクチャの大幅変更が必要ならMimuへ戻す。

## 完了確認と残る範囲

調査成果物として、Windows改行差の再現、5つの影響ファイル、恒久案比較、主要ルート3幅、現行変更前baseline、実公開での再計測、共通UIと配信条件の切り分け、後続案を記録した。実装・依存更新・本番変更は行っていない。調査中に生成されたprocessed差分は元のcheckout状態へ戻し、成果物へ含めない。

Netlify固有の動作、過去MY-242直前commitの統制した性能再測定、複数回の性能中央値、全操作・全ブラウザのアクセシビリティ確認は未実施。これらを検証済みとして引き継がない。
