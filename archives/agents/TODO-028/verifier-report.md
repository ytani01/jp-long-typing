# TODO-028 確認報告（verifier）

- 条件: 1280x800 の 1 条件。Chromium（Playwright、node から読み込み）。`http://localhost:8080/` を各ケースごとに読み直して開始
- 入力: `#typing-input` に `page.keyboard.insertText()` → Enter
- 実行: `node archives/agents/TODO-028/verify.mjs`、終了コード 0
- 対象: 未コミットの `index.html`（`git diff` で確認。`TODO.md` は節のチェック変更のみ）
- お手本の初め 5 字: 日 本 語 長 文

## 結果

| ケース | 結果 | 測った値 |
|---|---|---|
| 1. s0 s1 s2 を 1 回で確定 | 期待どおり | 0〜2 が `char done`、`.typed` に `<span class="ok">` 日/本/語。3 が `char active`（長）、4・5 は `pending` で空 |
| 2. s0 s1 s3 s4 | 期待どおり | 2（語）の `.typed` は空。0,1,3,4 は ok の 日/本/長/文。`#stat-mistakes` = 1 |
| 3. s0 X s2 | 期待どおり | 1（本）の `.typed` = `<span class="ng">X</span>`。0,2 は ok |
| 4. s0 s1 → Z s2 | 期待どおり | 2（語）の `.typed` = `<span class="ng">Z</span><span class="ok">語</span>`。active は 3（長） |
| 5. 色（ケース 4 の後） | 期待どおり | `.char.done` の color = `color(srgb 0.4745 0.5294 0.6314 / 0.6)`（`--text-muted` 60%）、opacity = 1。`.typed .ok` の color = `rgb(52, 211, 153)`（`--success-color` #34d399）、`.typed .ng` の color = `rgb(248, 113, 113)`（`--error-color` #f87171）。`.char.active` の box-shadow = `rgb(56, 189, 248) 0px 0px 0px 2px` |
| 6. 入力欄の位置（ケース 4 の後） | 期待どおり | active.bottom 302.89 / typed.top 302.89, typed.bottom 327.64。input.top 330.78, input.bottom 351.97。次行の先頭（練）の top 356.97。判定: input.top ≥ typed.bottom は true、input.bottom ≤ 次行 top は true |
| 画面（case4.png） | 期待どおり | 緑の 日 本、赤の Z と緑の 語 が 2 列目の下に見える。入力欄は字と重なっていない。済んだ字は薄い灰色、今の字 長 に枠 |

## 補足

- ケース 4 で、Z と 語 は同じ 語 の列の下に並ぶ（`.typed` は 1 つの span に入り、中央そろえ）。依頼の「並ぶ」「詰める」に当たると読んだ。
- ケース 5 の `.char.done` の opacity は 1 で、薄さは color 側で付けている。依頼の「薄い灰色」に当たると読んだ。
- 狭い画面・他の幅、IME の変換中の表示、行末の字の下に入力した字が出るときの折り返しは確かめていない（依頼の対象外）。
- 実害は未確認。食い違いは見つからなかった。

## 判断が要る点

- なし。
