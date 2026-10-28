# TODO-040 確認報告（verifier）

スクリプト: `archives/agents/TODO-040/verifier-check.mjs`（node + Playwright、`timezoneId: America/New_York`、`python3 -m http.server 8080` で配信）
実行: `node archives/agents/TODO-040/verifier-check.mjs` → 終了コード 0

## 結果

| # | 条件 | 表示された選択欄の文字 | 期待 | 判定 |
|---|------|------------------------|------|------|
| 1 | 内蔵データ（rss2json を abort） | `📰 NHK主要ニュースまとめ (6本・10/28 22:22)` | 内蔵 `pubDate` の最新 `2026-10-28T22:22:06+09:00` → `10/28 22:22` | 一致 |
| 2 | rss2json を指定 JSON に差し替え | `📰 NHK主要ニュースまとめ (2本・10/28 22:22)` | `(2本・10/28 22:22)` | 一致 |
| 3 | 同、`pubDate` を両方 `""` | `📰 NHK主要ニュースまとめ (2本)` | `(2本)`、JS 例外なし | 一致（pageerror 0 件） |

- 1 の内蔵データの `pubDate`（ブラウザ内で読んだ値）: 20:53 / 18:15 / 22:14 / 20:12 / 20:59:49 / 22:22:06（すべて +09:00）。
- 1 の例外・ダイアログ: `pageerror` 0 件、dialog 0 件。
- 2・3 の例外・ダイアログ: いずれも 0 件。

## 画面

`archives/agents/TODO-040/verifier.png`（条件 1 の状態、1280×720）を見た。
- 文章欄・ヘッダー・ボタン・選択欄が崩れていない。文字数表示（520字）も正常。
- 選択欄は既定の「日本語長文タイピングの特徴」を表示している。NHK の行はドロップダウンを開かないと見えないので、画像には出ていない。文字の値は DOM から読んで確かめた。
- ページ幅は `scrollWidth` 1280 = `innerWidth` 1280（横スクロールなし）。

## 食い違い

無し。

## 補足（確かめていないこと）

- `notes.py` / `update-notes.sh` は流していない（指示どおり）。`d124357` で変わった `-0000` の扱いは、今回の確認の対象外。
- 選択欄が開いた状態の見た目は見ていない（値の読み出しで足りると判断）。
- `verifier-check.mjs` の `shot` 引数は使っていない（lint の警告のみ、動作には影響しない）。
- `reviewer-report-2.md`（未追跡）は既存のもので、今回の確認では触れていない。

## 変更ファイルの範囲（TODO-040 のコミット 557d5c8・c5b642a・d124357）

- `index.html`: `pubDate` の追加、`toIsoDate`、`applyNewsData` の日時表示。指示の範囲内。
- `.claude/skills/update-release-notes/notes.py`、`SKILL.md`、`docs/update-release-notes.md`、`README.md`: 内蔵データの `pubDate` を書くための変更と文書。TODO-040 の範囲と思われるが、この確認では中身を検証していない（コードの正しさは未確認）。
- `TODO.md`、`archives/agents/TODO-040/*.md`: 管理用。
- 今回の確認で作ったもの: `verifier-check.mjs`、`verifier.png`、本報告。コードは変更していない。コミットもしていない。
- 作業ツリーの tracked ファイルに未コミットの変更は無い。

## 判断が要る点

無し。
