# 練馬区統計書 Excel（ローカル専用）

このディレクトリの `hyo08.xlsx` は **Git 管理しません**。
練馬区サイトポリシー上、無断転載・複製が原則禁止であり、統計書 Excel に再配布許諾（CC 等）が明示されていないためです。

## 取得手順（開発者・監査者向け）

1. [令和7年 練馬区統計書](https://www.city.nerima.tokyo.jp/kusei/tokei/tokeisho/R7toukeisho.html) を開く
2. 福祉・社会保障の Excel `hyo08.xlsx` をダウンロード  
   直リンク: https://www.city.nerima.tokyo.jp/kusei/tokei/tokeisho/R7toukeisho.files/hyo08.xlsx
3. このディレクトリへ `hyo08.xlsx` として保存する
4. SHA-256 が次と一致することを確認する（`npm run data:check` でも検証可）

```
63f53f0ee209f17c612795c299c58ae1d235f65cbdd3c9a190f5e5115ca73fe9
```

5. 原典を更新して加工済み系列を再生成する場合:

```bash
npm run data:extract-nerima
npm run data:build
```

公開リポジトリにコミットされるのは、取得手順・URL・期待 SHA・`data/curated/nerima/care/` の加工済み系列のみです。
サイトポリシー: https://www.city.nerima.tokyo.jp/aboutweb/sitepolicy.html
