# TODO-022 verifier 報告

スクリプト: `archives/agents/TODO-022/verify.mjs`（`node` 1 回、終了コード 0）。1280×800 と 390×844、ダーク。
食い違いは無し。実害は未確認の点も無し。

| # | 項目 | 1280 | 390 |
|---|------|------|-----|
| 1 | ヘッダーのボタン | btn-history, btn-sound, btn-theme のみ | 同左 |
| 1 | 入れ物 | .time-item 内に select と restart、.preset-group 内に fetch-news: すべて true | 同左 |
| 2 | scrollWidth / 画面幅 | 1280 / 1280 | 390 / 390 |
| 2 | ヘッダー子要素の top | brand 11, controls-bar 10（ボタン 3 つは 10,10,10） | brand 11, controls-bar 8（ボタン 8,8,8） |
| 2 | .time-row の 3 要素 top | 89, 93, 93 | 58, 58, 58 |
| 2 | #article-author と #preset-select | author 175-197、select 169-202（同じ行） | author 178-199、select 172-205（同じ行） |
| 3 | .btn-label | 対象外（ヘッダー「履歴」「効果音: ON」は表示、幅 29/72） | ヘッダー・fetch-news は display:none（幅 0）、#btn-restart は block（幅 51、「リセット」） |
| 3 | .text-display-card の高さ | 459.03 px | 510.69 px |
| 4 | 時間設定 60 | #stat-time = 01:00 | 01:00 |
| 4 | 「日本語」を insertText 後 Esc | 3/520 → 0/520、入力欄 空、focus = typing-input | 同じ |
| 4 | #btn-restart | 3/520 → 0/520、入力欄 空、focus = typing-input | 同じ |
| 5 | keyCode 229 の Escape | 3/520 のまま（リセットされない） | 同じ |
| 6 | #btn-sound の aria-pressed | true → false | true → false |
| 7 | #btn-fetch-news の disabled | 押した直後 true、終了後 false（alert は出ず） | 同じ |
| 8 | #article-author | 「文字数: 1024字」（取得後。形は合う） | 同じ |
| 9 | コンソールエラー | 0 件 | 0 件 |

## 390 幅のスクリーンショット（narrow.png）
要素の重なりや欠けは見当たらない。ヘッダー 1 行、時間の行 1 行、練習文の select・更新ボタン・文字数が 1 行。

## メモ
- 項目 8 の文字数は、項目 7 の取得後（Claude Code CHANGELOG に変わっていた）の値。項目 4 では 520 字の文章だった。取得で文章が切り替わるのは元からの挙動と思われるが、確かめていない。
- 項目 3 の 1280 幅の .btn-label は、指示が 390 幅だけだったので参考値。
