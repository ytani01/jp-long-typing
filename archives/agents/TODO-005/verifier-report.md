# TODO-005 verifier 報告

最新の index.html（全角英数記号を半角にする変更後）で verify.mjs を最初から 1 回走らせた結果。
スクリプト: `archives/agents/TODO-005/verify.mjs`（node 終了コード 0）。
外部通信は page.route で全部差し替え。外に出ようとした URL は allorigins / raw.githubusercontent / rss2json の 3 つだけ（すべて差し替え済み）。コードは直していない。

## 結果

1. 一致。選択欄 `claude-summary`、option は `claude-summary | 🤖 Claudeニュースまとめ (3本)`、`claude-0〜2 | ・2026年9月28日の更新` など、`claude-code | ・Claude Code 2.1.292（英語）`。`#optgroup-claude` が最初の optgroup。pageerror 0。
2. 一致。本文が `【2026年10月1日の更新】…` に差し替わった。`claude-code` は `Claude Code 9.9.9（英語）`、本文 8 行（先頭 8 項目）。`` ` `` `**` `](` は summary・claude-code とも 0。
3. 一致。1 文字打って startTime が立ち、1.5 秒遅れの取得後も本文は元のまま（10月1日を含まない）。option 側は更新されていた（`claude-0 | 2026年10月1日`）。
4. 一致。alert 1 回「Claudeニュースの取得に失敗したため、内蔵のデータか前回取得したデータを使います。」（NHK を含まない）。選択欄 `claude-summary`、`claude-code` は 9.9.9 のまま、日付 option は 10月1日のまま（ボタン前と完全一致）。
5. 一致。option 13 件（custom 除く）で空白 2 個連続・日本語の隣の半角スペース・行頭行末の空白・空白以外の空白文字は 0 件（食い違いの例なし）。`claude-code` に `Added --marketplace <source> to` あり。概要（値 0）に `Claude Code` あり。
   件数（長さ/半角スペース数）: claude-summary 2007/51, claude-0 927/42, claude-1 772/7, claude-2 259/2, claude-code 1090/164, news-summary 17/0, news-0 10/0, 0:452/5, 1:386/3, 2:449/1, 3:490/0, 4:447/0, 5:440/0。
7. 一致。
   (a) 13 option で U+FF01〜U+FF5E と “”‘’ の残りは 0 件。`、。「」` は合計 344 個残っている。
   (b) カスタムの cleanText は `ABC(テスト)[1]、です。`。
   (c) 全角のまま `ＡＢＣ（` を入力: currentIndex 4、mistakesCount 0。pageerror 0。

## 6. 表示（検討 1）

測った値（claude-code、164 個の空白 span）:
- 空白 span の幅: 最小・最大とも 13.453125 px（英字 span の幅も 13.453125 px。等幅）
- 単語の途中の折り返し: 0 箇所（隣り合う英数字 span の top が違う箇所を数えた）。行数 18
- span の white-space は `pre`

スクリーンショット `archives/agents/TODO-005/claude-code.png`（同じ範囲の全体は `claude-code-full.png`）を目で見た:
- 単語の間の空白が見える。文字の欠け・重なりは無い。折り返しは単語の区切りで行われている。
- 気になった点（実害は未確認、判断は管理者）: 項目の境目は改行で、行末に来ると `from it` と `Added an` の間（`itAdded`）の隙間がほとんど無く、続いて見える。また 4 行目の行頭に空白 1 個分の字下げ（` effort`）がある。これは折り返し位置の空白が次の行頭に回ったものに見える（推定）。

## 変更されたファイル

`git status`: M README.md, M TODO.md, M index.html、?? archives/agents/TODO-005/。
管理者の指示（TODO-005 と、途中で追加された全角半角の変更）の範囲かは、diff の中身（index.html 240 行追加・62 行削除）を逐一は照合していない。範囲外のファイルは無い。

## 確かめられなかったこと

- 実ネットワークでの取得（要件どおり外には出ていない）。
- IME 変換（Playwright では再現できない）。
- 変更前に戻してテストが落ちるかの確認は、依頼に無いので行っていない。

---

# 2 回目（renderText の .word、isCharMatch、toHalfWidth の追加後）

verify.mjs に 8〜10 を足し、最初から 1 回走らせた（pageerror は全ケース 0）。外部通信は 1 回目と同じく全部差し替え。コードは直していない。

## 結果

- 1〜5、7: 1 回目と同じ値で一致（5 の件数も同じ: 13 option、問題 0 件、claude-code 1090 字/空白 164）。
- 6（1 回目の測り方）: 空白幅 13.453125 px、行数 18、単語の途中の折り返し 1 箇所（`310:L|O`）。1 回目は 0 だった。8 と同じ箇所（下記）。
- 8（1280x800、claude-code）: 行頭が空白 span の行 0。空白幅 13.453125 px（最小・最大とも）。`.word` 171 個。単語の途中の折り返しは 1 箇所。それは `CLAUDE_CODE_OVERLOADED_RETRY_BASE_DELAY_MS`（43 字、20 字超なので `.word` にまとまらない）の `L|O` の位置（index 310）。この単語以外では 0。
- 9（375x800、claude-code）: scrollWidth 325 / clientWidth 325（横スクロール無し）。`CLAUDE_CODE_OVERLOADED_RETRY_BASE_DELAY_MS` の左 45.0、右端の最大 329.53。#text-display の右 351（left 24、width 327）。はみ出し無し。行頭が空白の行 0。空白幅 11.234375 px。単語の途中の折り返し 2 箇所（`295:L|A`、`320:R|Y`。どちらも同じ長い単語の中）。行数 50。
  - スクリーンショット `claude-code-375.png`: 見えているのは本文の先頭 4 行（#text-display が縦にスクロールする固定高で、長い単語の行は画面外）。見えた範囲に欠け・重なりは無い。長い単語が画面で折り返された行は、スクリーンショットには映っていない（数値でのみ確認）。
- 10: cleanText は `2026-04-07 "a" 1~3`（期待どおり）。`2026ー04ー07　「a」` を insertText で入力 → currentIndex 14（cleanText 長 18、入力した 14 字分が進んだ）、mistakesCount 0。

## 判断が要る点

- 1 回目の 6 は「単語の途中の折り返し 0」だったが、今回は 1 箇所（1280 幅）。20 字超の単語を `.word` にまとめない変更による意図した動きに見えるが、仕様として許容するかは管理者の判断。実害は未確認。
- 変更ファイル: git status は前回と同じ（M README.md, TODO.md, index.html、?? archives/agents/TODO-005/）。

---

# 3 回目（全角・半角を変えない cleanText、isCharMatch の toSameShape）

verify.mjs の 7 と 10 を置き換え、最初から 1 回走らせた（pageerror は全ケース 0、外部通信は全部差し替え）。コードは直していない。

## 結果

- 1〜6、8、9: 2 回目と同じ値で一致（1: 選択欄 claude-summary、cleanText の先頭が全角括弧 `（` に戻った以外は同じ。5: 13 option、問題 0 件。6・8・9: 長い単語の途中の折り返し 1 箇所/2 箇所、空白幅 13.453125/11.234375 px、行頭が空白の行 0、375 幅で scrollWidth 325 = clientWidth 325、長い単語の右端 329.53 < #text-display の右 351）。
- 7': 一致。13 option すべてで、cleanText から空白を除いたものが元の本文（改行を揃えたもの）から空白を除いたものと同じ、かつ全角の英数字・記号（U+FF01〜FF5E、“”‘’−‐‑）の数も同じ。0 件の食い違い。全角を含むプリセットは 4 つ: claude-summary 12 個、claude-0 8 個、claude-1 4 個、概要（値 0）1 個。
- 10': 一致。
  - cleanText は入力と文字単位で同じ（`ＡＢＣ（テスト）［１］2026-04-07 “a” 1〜3、です。`、true）。
  - `ABC(テスト)[1]２０２６ー04－07　"a"　1~3、です。` を insertText → currentIndex 33 / 長さ 33、mistakesCount 0、isFinished true。
  - 形が違う字: お手本 `ＡＢ、` に `AB,` を打つと currentIndex 2、mistakesCount 1（`、` と `,` は不一致でミスになる）。

## 判断が要る点

- 前回と同じ: 20 字超の単語の途中の折り返し（実害は未確認）。
- 前回から変わらず、変更ファイルは README.md、TODO.md、index.html と archives/agents/TODO-005/。
