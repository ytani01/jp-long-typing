# TODO-014 verifier-report

実行: `NODE_PATH=... node archives/agents/TODO-014/verify.js`（8080 は既に動いていたものを使用、起動・停止はしていない）。
変更ファイル: `git status` は TODO.md と index.html のみ（指示の範囲内）。コードは直していない。

1. 一致。既定の練習文で英数字 91 字は computed letter-spacing が `normal`（Chromium は `0` を `normal` と返す）、日本語 362 字は `1.04px`（20.8px x 0.05em）。
   `abcdefghijklmnopqrstuvwxyz あいう`: 26 字とも `normal`、`.word` に入っていない（長い単語の経路）、「あいう」は `1.04px`。
2. 一致。「Cla」入力後は `char done`x3 / `char active`、「ude 」入力後も英字は全て `normal`。日本語の「練」「習」は `1.04px` のまま。
3. 一致（ただし下記の注記あり）。`.brand-icon` は `svg`、⌨ は innerHTML・textContent のどちらにも無い。サイズは 27.59x27.59 px。
   - ダーク: svg color `rgb(56, 189, 248)` = `--accent-color`（#38bdf8）と同じ。
   - ライト: svg color `rgb(2, 132, 199)` = `--accent-color`（#0284c7）と同じ。
   - 注記: ヘッダーのボタンのアイコンの色は、ダークでは `rgb(226, 232, 240)`（文字色）で `--accent-color` ではない。ライトでは `rgb(2, 132, 199)` で一致したが、これはテーマ切替ボタンが hover/focus の状態だったためと思われる（推定、未検証）。つまりロゴは常に accent、ボタンは通常は文字色。依頼の「ボタンのアイコンと同じ系統」は、ロゴが `--accent-color` であることを基準に見て一致とした。
4. 一致。コンソールのエラーは `Failed to load resource: net::ERR_FAILED` が 3 件のみ（外部通信の abort）。JS の例外（pageerror）なし。
5. スクリーンショット（~/tmp/playwright-mcp/todo014-1280-dark.png, -1280-light.png, -390.png）を目視。ロゴ（キーボードの線画）は欠けなく表示、ダーク・ライトとも accent 色。英字の重なりなし。
   - 気づき（実害は未確認）: letter-spacing は 0 だが、英字（Claude、abc…）は等幅フォントのため、見た目の字間はまだ広い。「単語がまとまって見える」かどうかは見た目の判断なので判断できない。

判断が要る点: 上記 5 の見た目のみ。
