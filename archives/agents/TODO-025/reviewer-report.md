# TODO-025 reviewer 報告

対象: `git diff -- index.html`（未コミット）。ブラウザは動かしていない（コードを読んだだけ）。

## 要修正

なし。

## 検討

### 1. `index.html:595-597` 狭い画面で入力欄の文字が 16px 未満になり、iOS Safari が入力欄に触れたときに拡大する（実害は未確認）

- 狭い画面の `#typing-input` が `font-size: 0.9rem`（14.4px）になった。前は `1.15rem`（18.4px）
- iOS Safari は、16px 未満の入力欄にフォーカスすると画面を拡大する。`index.html:5` の viewport に
  `maximum-scale` が無いので抑えられない。拡大されると、お手本と入力欄の位置関係が崩れる
- 根拠は iOS Safari の挙動として知られている話で、実機では確かめていない。広い画面は `1rem` = 16px なので当たらない

### 2. `index.html:346-351, 595-597` 案内文「入力すると計測が始まります」が欠けるおそれ（実害は未確認）

- 前の差分では、狭い画面用に `#typing-input::placeholder { font-size: 0.85rem }`
  （「案内文が狭い入力欄でも欠けないようにする」）があった。これを消している
- 今の欄は `min-width: 12em` で、`* { box-sizing: border-box }`（`index.html:41-42`）なので、
  文字を置ける幅は 12em から左右の padding 0.7rem と枠 2px を引いた残り。案内文は全角 13 字で、
  約 13em 要る。`size` 属性から決まる既定の幅が 12em を超えない限り、末尾が欠ける計算になる
- 既定の幅はフォントで変わるので未確認。verifier の撮った画面で、案内文が最後まで見えるかを見てほしい

### 3. `index.html:1717, 1733-1735` 今の文字が改行のとき、スクロールの基準が 1 行下になった（既存の挙動の変化）

- 前は `this.charElements[this.currentIndex]`（行末の改行の span）を真ん中に寄せていた。
  今は `placeInput()` が改行を読み飛ばした先の span を返し、それでスクロールする
- 行末まで打ち終えた時点で、お手本が 1 行早く上へ流れる。入力欄が次の行の下に動くので、
  それに合わせるのは筋が通っているが、TODO.md の項目には書かれていない変化
- 光っている文字（`.active`）は行末の改行のまま、入力欄とスクロールは次の行、という食い違いが
  次の確定まで続く。意図どおりかは管理者の判断

### 4. `index.html:1695` `replaceChildren(fragment, input)` は入力欄をいったん文書から外す

- `replaceChildren` は子をすべて取り除いてから入れ直すので、入力欄はフォーカスを失う。
  変換中なら変換も打ち切られる（どちらも DOM の仕様どおり。ブラウザでは未確認）
- **今の呼び出し元では実害の経路は見つからなかった。** `renderText()` を呼ぶのは `restart()`
  （`index.html:1623`）だけで、`restart()` は直前に値を空にし（1601）、直後にフォーカスし直す（1624）。
  `restart()` の呼び出し元も追った:
  - Esc（1385）: 変換中は除外済み
  - 制限時間の選択・リセット・結果画面のボタン・選択欄・ニュース更新: フォーカスはすでにそちらへ移っている
  - 裏の取得（`fetchNhkNews` などの `isUntouchedSummary` → `loadArticle`）: `!this.startTime` が条件で、
    `compositionstart` と `input` が `ensureTimerStarted()` を呼ぶので、打ち始めた後（変換中を含む）は通らない
- 残る心配は、今後 `renderText()` を打っている途中に呼ぶ箇所が増えたとき。文字だけを入れる
  子要素（例: `<div id="text-chars">`）を `#text-display` の中に置き、そこだけ `replaceChildren(fragment)`
  すれば入力欄を動かさずに済む。今の作りで足りるなら、`index.html:1694` のコメントに
  「入力欄はいったん外れるので、呼び出し元がフォーカスし直す」と書いておく程度でよい

## 好みの範囲

### 5. `index.html:360-361` コメントの根拠

- 「親の user-select: none を受け継ぐと Safari で打てない」。`user-select` は継承されない
  プロパティで、Safari が問題にするのは `-webkit-user-select: none` の祖先。親の
  `.text-display-card` は接頭辞なしの `user-select: none` だけを書いている。指定そのものは
  害が無いので残してよいが、コメントの理由が実測かどうかは未確認

## 確かめて問題が無かったもの

- `offsetTop` / `offsetLeft` の基準: `.text-display-card` が `position: relative`（`index.html:290`）で、
  `.char` と `.word` は位置指定なし。`.char` の offsetParent と、絶対配置の入力欄の基準は
  どちらも `#text-display` の padding の縁で一致する。スクロールしても値は変わらず、入力欄も中身と一緒に動く
- 右端に寄せる計算: `clientWidth`（padding を含み、スクロールバーを含まない）から `paddingRight` と
  入力欄の幅を引いており、文字を置ける右端と合っている。`Math.max(0, …)` が効くのは
  `maxLeft < 0`（`#text-display` の中身の幅が入力欄より狭い）ときだけで、そのときは欄が右へはみ出し、
  横スクロールが出る（`overflow-y: auto` で `overflow-x` も `auto` になるため）。幅 12em を割る画面
  なので実害は小さい
- 縦の位置（計算のみ）: 広い画面で、入力欄は今の文字の中心から +15.6〜+40px、次の行の字の上端は
  約 +47.8px。狭い画面では +12.6〜+34.8px と約 +38.6px（`.active` の影 2px を入れると +36.6px）。
  重ならないが、狭い画面の隙間は 2px 程度
- 最後の文字の後: `currentIndex === length` なら `placeInput()` は `null` を返し、入力欄は最後の字の下に
  残る。スクロールしないのは前と同じ。`finish()` は値を空にして blur するだけで、位置には触れない
- 打鍵の判定（`handleInputCommit`）、`markMiss`、`restart` の中身は変わっていない
- 文字の太さが変わる（`.done` 500、`.active` 700）のはクラスを付けた後で、`placeInput()` がその後に
  offset を読むので、位置は新しいレイアウトに合う
- 入力欄の上のクリックは `#text-display` の click に上がって `focus()` を呼ぶだけで、害は無い
- resize のハンドラは `constructor` の中で `loadArticle` より前に登録されるが、同じ同期処理の中で
  `cleanText` が入るので、未定義のまま呼ばれる経路は無い
- 消した `.typing-input-card` / `.input-field-wrapper` を参照する箇所は残っていない。README にも
  入力欄の位置の記述は無い
- テスト: このプロジェクトには自動テストが無く、確認は Playwright の手作業。範囲外の変更は無い

## 作り込みすぎ

- `index.html:1736`: delete: `|| this.charElements[this.currentIndex]`。`cleanText` は `trim()` 済みで末尾が
  改行にならないので、`charElements[i]` が無いときは `charElements[currentIndex]` も無い。
  `const el = this.charElements[i];` で足りる。重さは好みの範囲
- `index.html:1740, 1743`: shrink: `getComputedStyle(container)` を 2 回呼んでいる。
  `const cs = getComputedStyle(container);` にまとめると 1 回で済む。重さは好みの範囲

net: -1 lines possible.

---

# 2 回目

対象: 前回からの追加差分。`activeIndex()` の追加と、それを使う `updateCharClasses()` / `placeInput()` / `markMiss()`。前回の指摘 1・2・4 と、作り込みすぎ 2 件への直し。ブラウザは動かしていない。

## 要修正

なし。

## 検討

### 2-1. `index.html:350` 幅 320px より狭い画面では、入力欄が右へはみ出す（実害は未確認）

- `min-width: 15em` を 16px で計算すると 240px（`box-sizing: border-box` なので枠と padding を含む）
- 狭い画面には `main` の padding の上書きが無いので、左右 1.5rem ずつ残る。幅 320px の画面では、
  `#text-display` の `clientWidth` は 320 − 48 − 枠 2 = 約 270px で、`paddingRight` 20px を引くと
  `maxLeft` = 270 − 20 − 240 = 10px。ここまではぎりぎり収まる。画面がもう少し狭いか、スクロールバーが
  幅を取る環境では `maxLeft < 0` になり、欄が右の padding へはみ出す。さらに広く出ると横スクロールが出る
  （`overflow-y: auto` で `overflow-x` も `auto` になるため）
- 360px 以上の画面では起きない計算。どの幅まで面倒を見るかは管理者の判断

### 2-2. 狭い画面で、入力欄と次の行の隙間が約 1.6px しか無い（計算のみ。実害は未確認）

- 狭い画面の入力欄の文字が 1rem（16px）に戻ったので（前回の指摘 1 への直し）、欄の高さは
  16 × 1.4 + 枠 2 = 24.4px。欄の上端は今の文字の中心から +12.6px（0.75 × 16.8）なので、下端は +37px
- 次の行の字の上端は、行の高さ 2.8 × 16.8 = 47px から、中心 +23.5 + (47 − 16.8) / 2 = 約 +38.6px
- 重なりはしないが、隙間は約 1.6px。字形によっては次の行の上端に触れて見える。verifier の画面で確かめてほしい

## 消した行（`markMiss()` の `updateCharClasses()` 呼び出し）について

**消してよい。** 根拠は次のとおり。

- 消した行は、「先頭の改行を読み飛ばして `currentIndex` が進んだのに、`.active` がまだ改行に残っている」
  ずれを直すためのものだった（旧コメントのとおり）
- 今は `updateCharClasses()` が `.active` を `activeIndex()`（改行を読み飛ばした先）に付ける。
  `handleInputCommit()` の先頭の読み飛ばし（`index.html:1763` あたりの while）は `currentIndex` を
  改行の上から次の改行でない字まで進めるだけなので、`activeIndex()` の値は前後で変わらない。
  `.active` を付け直す必要が無い
- `currentIndex` を変えるほかの経路も、すべて直後に `updateCharClasses()` を通る:
  - `restart()`: 0 にしたあと `renderText()` → `updateCharClasses()`
  - `handleInputCommit()` の確定（`matchedCount > 0`）: `updateCharClasses()` を呼んでから `markMiss()` へ進む
- `finish()` の `markMiss(false)`: 最後まで打ったときは `activeIndex()` が `length` で、`el` が無いので何もしない
  （前と同じ）。時間切れのときは `.miss` を付けた字と同じ `activeIndex()` の字から外すので、付け外しの
  対象が食い違わない
- `markMiss(true)` の対象と `recordMiss()` の対象: 不一致の時点では `currentIndex` は改行の上にいない
  （先頭は while で、途中は内側の while で読み飛ばし済み）ので、`activeIndex() === currentIndex`。
  赤くする字と、誤りとして数える字は一致する

## 進捗・結果・履歴の数字への影響

**無い。** 数字はすべて `currentIndex`、`correctChars`、`mistakesCount`、`this.stats` から作っており、
`.done` / `.active` のクラスを読む箇所は無い（`querySelector` や `classList.contains` でクラスを読むのは、
消した `markMiss()` の 1 行だけだった）。今回の差分はクラスの付け方だけを変え、これらの値には触れていない。

見た目の上でだけ、行末で「改行の字は `.done`、進捗の数字はまだ改行を数えていない」という状態になる。
改行は打たずに読み飛ばす字なので、数字に出るのは 1 字分で、次の確定で揃う。

## 範囲外（既存の挙動。今回の差分とは関係ない）

- `handleInputCommit()` で、改行は読み飛ばす場所によって `correctChars` に入ったり入らなかったりする。
  確定の途中で読み飛ばした改行は `matchedCount` に足され、そのまま `correctChars` に入る。
  先頭の while で読み飛ばした改行は入らない。打った字が行をまたいだかどうかで CPM と正確率が
  1 字ずれる。今回の項目とは別の話なので、要るなら別の項目にする

## 前回の指摘への対応

- 1（iOS の拡大）: 狭い画面の `font-size` の上書きを消し、どの画面でも 1rem（16px）になった。解消
- 2（案内文が欠ける）: `min-width: 15em`。文字を置ける幅は 240 − 11.2 − 2 = 約 226.8px で、13 字（208px）は収まる計算。ただし 2-1 の幅の話に変わった
- 3（スクロールの基準）: 利用者の判断どおり、`.active`、入力欄、スクロールがどれも `activeIndex()` で揃った
- 4（`replaceChildren`）: コメントに「呼び出し元でフォーカスし直す」と書き足した。解消
- 作り込みすぎ 2 件: どちらも直った

## 作り込みすぎ

なし。`activeIndex()` は 3 か所から呼ばれ、前に `placeInput()` の中にあった while を移しただけなので、行は増えていない。
