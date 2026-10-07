# TODO-006 reviewer 報告

対象: `git diff -- index.html`（`::after` の規則を削除、`renderText()` で改行の span の直後に `<br>` を追加）。
実測はしていない（verifier の担当）。以下はコードを読んだ結果。

## 指摘

要修正: なし

### 検討

- `index.html:280-284` / `.char.linebreak` に残った `margin-right: 0.1em` と `width: 0` は、`::after` で
  改行していたころの見た目合わせの名残の可能性がある。今は span が行末に 1 つ置かれ、直後の `<br>` で
  改行するだけなので、行末の active の枠（`box-shadow` と `.char` の `padding: 0 1px`）の見え方を決めて
  いるのはこの規則だけになる。消す・残すの判断は verifier の行末の見た目の結果次第。実害は未確認。

## 問題なしの観点

- charElements の添字: `<br>` は fragment にだけ足し、`charElements` には push しない（1385-1387 行）。添字と `cleanText` の対応は変わらない。
- DOM を順に辿るコード: `childNodes` / `children` / `nextSibling` / `querySelectorAll` / `textDisplay.textContent` の利用は無い（`rg` で確認）。`<br>` が子要素に混ざっても影響しない。
- `updateCharClasses()`: `charElements` の span の `className` だけを書き換える。`<br>` は対象外。
- 入力の照合: `handleInputCommit()` の改行の読み飛ばし（1444、1461 行）は `cleanText` だけを見ており、DOM に依存しない。
- 完了判定: `currentIndex >= cleanText.length` で判定（1497 行）。DOM に依存しない。
- スクロール位置: `charElements[currentIndex].getBoundingClientRect()` を使う。active が改行の span のときは行末の位置になり、従来どおり。
- `\n` が `.word` に入る経路: `isWordSide('\n')` は `/\s/` で false（834 行）、空白の分岐は `char === ' '` のみ。`\n` は必ず最後の `else` に入り fragment の直下に置かれる。長い単語（`inLongWord`）の経路も同じ。
- 連続する改行: `\n\n`（1235、1272 行の `join('\n\n')`）は span, br, span, br になり、空行 1 行。間の空白は 1288 行の置換で消えるので `\n \n` も同じ形になる。
- 文末・行頭の改行: `loadArticle()` が `art.text.trim()` してから置換するため、先頭・末尾に `\n` は残らない（`trim` は `\r`・U+2028・U+2029 も除く）。行頭の改行は連続する改行の 2 つ目としてだけ現れる。
- コメント（1384 行）: なぜ span の外に置くかを書いている。
- 範囲: index.html の差分は上の 2 か所だけ。指示外の変更なし。
- 規約: 1 ファイルのまま、外部ライブラリなし。
- テスト: このリポジトリに自動テストは無く、確認は verifier の Playwright で行う運用。

## 作り込みすぎ

作り込みすぎ: なし（差分は 5 行削除・2 行追加。span を残すのは `charElements` と active 表示に要るため）。

## 残る懸念

- 行末の active の枠が幅 0 の span に付くため、改行の手前で止まったときのカーソルの見え方が細い可能性。従来も同じ span だったが、`::after` で 2 行分の高さがあった点が変わる。実害は未確認（verifier の見た目確認で拾える）。
