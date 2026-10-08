# TODO-022 reviewer 報告

対象: `git diff`（index.html、README.md、TODO.md）。実測は `node` + Playwright 1.63
（`localhost:8080`、1280×800 と 390×844）。スクリプトは scratchpad に置いた（リポジトリには残していない）。

要修正: 0 件。

## 判断が要る点

### 1. TODO.md:33（配置の図）と実装・項目の記述が食い違う — 任意

- 図は「本文の上 : 練習文メニュー | ニュース更新 | **著者**・文字数」。項目（TODO.md:20）は
  「題名を外し、文字数だけにする」。実装（index.html:752、1587）は `文字数: N字` だけで、
  外したのは `art.author`（「太宰治」「NHKニュース」「ユーザー設定」など）。題名（`art.title`）は元から出していない。
- 実装は項目の記述どおりだが、項目は外すものを「題名」と書き、図は「著者」を残すと書いている。
  利用者の意図が「著者の表示を外す」で合っているかの確認と、図の直しが要る。実害は未確認。

## 検討（任意）

### 2. index.html:624（幅 640px 以下）: 取得中の表示が消える — 任意

- `#btn-fetch-news .btn-label` を隠すので、`refreshNews()` の `'取得中...'` も見えない。
  390×844 で `setButton(..., '取得中...')` 後の状態: `.btn-label` の display は `none`、ボタンの `innerText` は空。
- ボタンは取得中も押せる（`disabled` にしていない。変更前から）。広い画面では「取得中...」が見えて
  待てたが、狭い画面では何も変わらないため、続けて押すと `fetchNhkNews`/`fetchClaudeNews` が並んで走り、
  失敗時は `alert` が 2 回出ることがありうる。実害は未確認。

### 3. index.html:624（幅 640px 以下）: サウンドのボタンの ON/OFF が名前から消える — 任意

- 390×844 の ariaSnapshot: `button "これまでの結果を見る"` / `button "サウンド切替"` / `button "テーマ切替"` /
  `button "Claude・NHKの最新ニュースを取得・更新"`。title が名前になるので、ボタンの名前としては足りている。
- ただしサウンドは「効果音: ON / OFF」の文字が隠れ、状態はアイコン（`aria-hidden`）だけになる。
  読み上げでは状態が分からない。タッチ端末では title が出ないので、目で見る人もアイコンだけで判断する
  （テーマは変更前からアイコンだけ）。実害は未確認。

### 4. index.html:1401: macOS Safari では変換の取り消しの Esc でリセットされるおそれ — 任意（未確認）

- 判定は `!isComposing && !e.isComposing`。Chromium で、`compositionstart` 後の Esc、`isComposing: true` の
  keydown はどちらもリセットしないことを確かめた（進捗 `3/520` のまま）。
- Safari は変換の確定・取り消しで `compositionend` を keydown より先に出し、その keydown は
  `isComposing: false`・`keyCode: 229` になることが知られている。この順だと上の判定を素通りする。
  Chromium で `{key:'Escape', keyCode:229}`（フラグ無し）を送るとリセットされた（`0/520`、`startTime: null`）。
  Safari 実機では確かめていない。README:24 の「変換中の Esc は変換の取り消しになる」が Safari で成り立つかは未確認。

### 5. README.md:24: 「残り時間の横」 — 任意

- 「時間無制限」では欄の名前が「経過時間」になる（index.html:1620）。「時間の表示の横」などのほうが実装に合う。
  それ以外（Esc は入力欄で効く、変換中は取り消し）は実装と合っている。

## 問題なし

- 移した要素の参照: `rg` の全参照（index.html:1272-1280、1314-1317、1358-1367、1464-1466、1587）は id で引いており、
  置き場所に依存しない。`char-total-count` / `charTotalCount` / `controls-sep` の参照は残っていない。pageerror 0 件。
- `setButton` の span 包み: ボタンの文字を読み書きしているのは `setButton` の呼び出しだけ（1316-1320、1445、1452、1464、1466）。
  `btn.textContent = '削除'`（2128）は `setButton` を通らない別のボタン。`textContent` で読む場合も文字は変わらない。
- Esc のリセット後の状態: 打鍵中に Esc で `0/520`、入力欄は空、`startTime: null`、タイマー停止、フォーカスは入力欄。
  Esc の分岐が `ensureTimerStarted()` より前で `return` するので、Esc でタイマーが走り出すことはない（待機中の Esc でも `startTime: null`）。
- 結果のダイアログ: `finish()` が入力欄を `blur()` するので、ダイアログが出ている間の Esc は届かない（実測: ダイアログは出たまま、状態も変わらない）。
  履歴・カスタムのダイアログでもフォーカスは入力欄に無い。
- 「練習文」を見た目だけ隠す書き方: 1px・`overflow: hidden`・`clip` で隠れ、`label for` は効いている（ariaSnapshot で `combobox "練習文"`）。
  `white-space: nowrap` は元の `.preset-label` にある。
- 狭い画面でリセットは「リセット」の文字を残している（`#btn-restart .btn-label` は `block`。隠す対象は header と `#btn-fetch-news` だけ）。
- 狭い画面の `.text-display-card` の `max-height: 320px` を消したのは、「本文が広く見えるよう詰める」（TODO.md:19）の範囲。
- コメントはどれも理由を書いている。範囲外の変更は無い。

## 作り込みすぎ

- `index.html:352-357: delete: .input-field-wrapper の display: flex / align-items / gap。子が入力欄 1 つになったので効かない。3 行消せる。` — 任意
- `index.html:870-906 ほか: delete: 記事の author。表示から外したので、読む箇所が無くなった（rg で .author の読み出し 0 件）。`
  ただし `update-release-notes` skill（SKILL.md:61、67）が `author` を書くよう指示しており、消すなら skill と対で直す必要がある。
  この項目の範囲を超えるので、消すなら別項目。 — 任意

net: -3 lines possible（author は別項目にした場合 -10 行前後と skill の記述）.
