# TODO-012 レビュー（reviewer）

対象: `git diff -- index.html`（未コミット）。
実測: `node archives/agents/TODO-012/reviewer-measure.mjs`（`python3 -m http.server 8080` を起動しておく）。
Playwright で `app.loadArticle()` に短い文を渡し、`page.keyboard.insertText()` で入力した。

## 要修正

なし。

## 検討

### 1. `index.html:1448`（既存の `slice`）と `index.html:1471` の組み合わせ: 入力欄が空なのに赤い印が残る

- **何が問題か**: 1 回の確定で改行をまたいで一致し、その後ろが誤りのとき、
  入力欄は空になるのに `.miss` が付いたままになる。
- **根拠（実測）**: お手本 `あい\nうえ` に `あいX` を入れると
  `{"idx":3,"val":"","miss":[3]}`。入力欄は空だが、お手本の「う」は赤い。
  次に何か入力するまで消えない。
- **原因**: `matchedCount` は読み飛ばした改行も数えるので、
  `inputVal.slice(matchedCount)` が誤った文字 `X` まで削る（差分の外の既存の
  動き）。そこに今回の `markMiss(hasMismatch)` が `true` で乗る。
  TODO-012 の「誤入力のあいだ赤くする」の意味からは外れる。
- 実際の入力で起きる頻度（改行をまたいで一度に確定して、末尾が誤り）は
  未確認。実害は未確認。直すなら差分の外（`slice` の数え方）に及ぶので、
  管理者の判断が要る。

### 2. `index.html:1543` `finish()`（時間切れ）: 印が残ったまま終わる

- **何が問題か**: 誤入力のまま時間切れになると、`.miss` が残る。結果の画面を
  閉じても残り、入力欄を消しても `isFinished` で `handleInputCommit` が
  先に返るので消えない。やり直しかテキスト切替（`restart` → `renderText`）
  まで残る。
- **根拠（実測）**: `X` を入れて `app.finish(true)` → `{"val":"","miss":[0]}`。
  `closeResultModal()` のあと全消去しても `{"miss":[0]}`。
- 結果の画面の下に隠れるので、目に入るのは画面を閉じたときだけ。
  実害は未確認（終わった画面の表示の問題）。

## 好みの範囲

### 3. `README.md:34` 「進捗率」

- 統計パネルの数値が `8/501` の件数になったので、README の「進捗率」と
  ずれる（バーは割合のまま）。README は差分に入っていない。

## 確認して問題が無かったもの（1 行ずつ）

- 部分一致のあと誤り: `あX` → `{"idx":1,"val":"X","miss":[1],"active":[1]}`。印は進んだ先の文字に付く
- 全部消す（Ctrl+A → Backspace）と Backspace 1 回: どちらも `miss:[]`
- 誤りのあとにさらに入力（`Y` → `い`）: `miss:[1]` のまま
- 改行の読み飛ばし直後の誤り: お手本 `あい\nうえ` で `あい` → `X` → `{"idx":3,"miss":[3],"active":[3]}`。
  `markMiss` 内の `updateCharClasses()` で `active` が改行から「う」へ移っている。消すと `miss:[]`
- restart（`app.restart()`）とテキスト切替（`loadArticle`）: `miss:[]`（`renderText` で span を作り直すため）。
  制限時間の変更・ニュース更新・カスタム適用・結果画面の「次へ」はどれも `restart` か `loadArticle` を通る（コードで確認）
- `markMiss(true)` の対象は常に `currentIndex` の文字。`currentIndex` が動くのは読み飛ばし（印を付ける前）か一致
  （`updateCharClasses` が `className` を書き直して印を消す）だけなので、古い位置に印が取り残される経路は無い
- `updateTargetPreview` / `targetPreviewText` / `target-preview` / `input-instruction` の参照: `rg` で 0 件。README にも無い
- `compositionupdate` の削除: やっていた `sound.init()` と `ensureTimerStarted()` は `compositionstart` でも呼ばれるので、抜けは無い
- 統計パネルの padding:
  - 計算: `body` は padding 無しの flex 列なので、`100%` は表示幅 W。`main` は `box-sizing: border-box`、
    `width: 100%`、`max-width: 980px`、左右 `margin: auto`、`padding: 0 1.5rem`。
    W > 980px のとき本文の左端は `(W - 980px) / 2 + 1.5rem`、W ≤ 980px のとき `1.5rem`。
    パネルの式 `max(1.5rem, (100% - 980px) / 2 + 1.5rem)` はどちらの場合も同じ値になる（右も対称）
  - 実測（本文の左右端 / パネルの中身の左右端、px）: 1440 → 254/1186 と 254/1186、1280 → 174/1106 と 174/1106、
    1000 → 34/966 と 34/966、980 → 24/956 と 24/956、800 → 24/776 と 24/776、500 → 24/476 と 24/476。すべて一致
- 規約: 1 ファイルのまま、外部ライブラリの追加なし。コメントは「なぜ」を書いている
- 範囲: 指示に無い変更は無い（`compositionupdate` の削除は入力目安の削除に伴うもの）
- テスト: このプロジェクトに自動テストは無く、確認は verifier の実測で行う運用。足りないとは言えない

## 作り込みすぎ

- `index.html:146`: shrink: `max()` の中の `calc()` は要らない。`max(1.5rem, (100% - 980px) / 2 + 1.5rem)`。好みの範囲
- それ以外は無し。`markMiss` 内の `updateCharClasses()` 呼び出しは、上の実測（改行の読み飛ばし直後）で要ると確かめた

net: -0 lines possible.
