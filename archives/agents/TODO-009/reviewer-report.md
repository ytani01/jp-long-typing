# TODO-009 reviewer 報告

対象: `git diff`（README.md・TODO.md・index.html）。「フォーカス維持」と footer を消した追加分を含めて見直した。重大度の順。

## 要修正

### 1. footer の見出しコメントが残っている

- 場所: `index.html:628`
- 内容: `<footer>` を消したが、直前の `<!-- Footer -->` が残り、`<!-- Custom Text Modal -->` と並んでいる。
- なぜ問題か: 無い要素を指すコメントで、読む人が footer を探すことになる。消し忘れ（読んだコードで確認）。

## 検討

### 2. カスタム文章を適用すると、選択欄が前の練習文の名前のまま残る

- 場所: `index.html:1622-1643`（`closeCustomModal` / `applyCustomText`）
- 内容: `applyCustomText` は `closeCustomModal()` で選択欄を `loadedSelectValue`
  （直前の練習文）に戻してから、`selectValue` なしで `loadArticle` を呼ぶ。
  このため、カスタム文章を練習しているあいだも、選択欄には前の練習文の名前が出る。
- 根拠（実測、Playwright、`#preset-select` で custom を選び、タイトル「私の文章」・本文「あいうえお」で適用）:
  `{"value":"0","shown":"日本語長文タイピングの特徴","author":"私の文章 （文字数: 5字）","display":"あいうえお"}`
- なぜ問題か: この動きは差分の前からあったが、前は `#article-title` にカスタムの
  タイトルが出ていたので食い違いが目に入らなかった。今回タイトルの表示を消し、
  選択欄がその位置で唯一の題名表示になったため、「練習文 [日本語長文タイピングの特徴]」と
  著者の欄「私の文章」が並び、何を練習しているのかが分かりにくい。
  加えて、ブラウザでは同じ選択肢を選び直しても `change` が起きないので、
  表示中の「日本語長文タイピングの特徴」へ戻すには別の練習文を一度選ぶ必要があると
  見込まれる（Playwright の `selectOption` は同じ値でも `change` を送るので、
  実ブラウザでの挙動は未確認）。
- 「カスタム文章のタイトルは著者の欄に出す」は TODO の決定どおり。選択欄の表示を
  どうするか（「✏️ 自分で文章を貼り付ける...」を選んだままにする等）は判断が要る。

### 3. 狭い画面で選択欄がはみ出す可能性（未確認）

- 場所: `index.html:210-230`（`.article-info` / `.preset-group`）
- 内容: `select` の幅は一番長い選択肢で決まる（NHK の記事名は「・」+24 字+「…」、
  0.9rem）。見積もりで 400px 前後になり、幅 375px の画面（`main` の左右 padding
  1.5rem を引くと約 327px）には収まらない。`main` は `overflow: hidden` なので、
  はみ出た分は横スクロールにならず切れると見込まれる。
- ヘッダーにあったときも同じ制約はあった（`.controls-bar` も `flex-wrap`）ので、
  今回の差分で悪くなったかは未確認。実害は未確認。verifier に幅 375px で
  フォールバックの NHK データを読み込んだ状態を測ってもらうとよい。
- 広い画面では、`flex-wrap` + `justify-content: space-between` + `align-items: center`
  で、選択欄（padding 付き）と著者の欄（0.85rem の文字）は縦の中央で揃い、
  折り返したときは著者の欄が次の行の左に寄る。読んだ範囲で崩れる見込みはない。

### 4. footer にあった出典の表示が画面から無くなった

- 場所: `index.html` の削除した `<footer>`（元は「青空文庫パブリックドメインテキストと Claude Code 日本語ドキュメントの抜粋を使用」）
- 内容: 画面上の出典の表示が無くなった。各プリセットを選ぶと著者の欄に「Claude Code ドキュメント」「太宰治」などは出るが、
  「青空文庫」の語は画面のどこにも出なくなる（README の 26 行目には残る）。
- 青空文庫の作品はパブリックドメインで表示の義務は無い。Claude Code ドキュメントの抜粋の出典表示が要るかは
  確認していない。実害は未確認。消してよいかは利用者の判断。

## 好みの範囲

### 5. README の「練習文として練習可能」

- 場所: `README.md:19`
- 内容: 「お手本テキストとして練習可能」を置き換えた結果、「練習文として練習」と
  同じ語が重なる。意味は通る。「即座に練習可能」などにすれば重ならない。

## 問題なしの観点

- `article-title` / `articleTitle` の参照: `rg` で 0 件。CSS の `.article-title` も消えている。
- `this.dom.presetSelect` を使う処理（`change`、`applyClaudeData` / `applyNewsData` の作り直し、
  「次の文章」、`closeCustomModal` の戻し、`refreshNews`、`isUntouchedSummary`）:
  すべて `getElementById('preset-select')` 経由で、要素の位置に依存する処理（親要素の参照、
  `.controls-bar select` のようなセレクタ）は無い。CSS の `select` の指定も要素名だけ。挙動は変わらない。
- `author` の他の用途: `author` を読むのは `loadArticle` の著者の欄だけ。結果画面は使っていない。
  タイトル省略時は「カスタムテキスト （文字数: N字）」になり自然。
- 「お手本」→「練習文」: README・index.html に残りなし（TODO.md の項目文のみ）。archives/ は変わっていない。
  プリセット本文・コメントの置き換えで意味のおかしくなった文はない（下の 5 を除く）。
- footer を消したあとの body のレイアウト: `body` は `height: 100vh; display: flex; flex-direction: column; overflow: hidden`、
  `main` は `flex: 1; min-height: 0`。footer（`flex-shrink: 0`）が抜けた分は `main` が伸びて埋め、
  `.text-display-card`（`flex: 1`）が高くなるだけ。`main` の `margin: 0.75rem auto` で下端の余白も残る。崩れる見込みはない。
  幅 640px 以下の `.text-display-card { max-height: 320px }` も footer に依存していない。
- `.input-instruction` が span 1 つ: `display: flex; justify-content: space-between` の子が 1 つなら左寄せになるだけで崩れない。
  `span.kbd` を使う所は他に無い（`rg -n kbd index.html` で 0 件）。
- 「フォーカス維持」「footer」の説明は README・CLAUDE.md に無い（`rg` で 0 件）ので、文書の直し漏れは無い。
- placeholder「ここに入力を始めると計測が始まります」: `ensureTimerStarted` が入力で始まるのと合っている。
- 範囲: 差分は TODO-009 の 5 項目と TODO.md の書き換えだけ。指示に無い変更は無い。
- テスト: このプロジェクトにテストの仕組みは無く、確認は verifier の実測で行う方針。

## 作り込みすぎ

- `index.html:227-235`: shrink: `.preset-label` は `.article-author` と同じ指定（0.85rem・muted）。
  `.preset-label, .article-author { ... }` にまとめれば 4 行減る。好みの範囲。
- `index.html:570`: delete: `title="文章を選択"` は `<label>` が付いたので重複。好みの範囲。
- `index.html:306-312`: shrink: `.input-instruction` は子が 1 つになったので `display: flex; justify-content: space-between; align-items: center;` の 3 行は効いていない。消せる。好みの範囲。

net: -9 lines possible（上の要修正 1 のコメント 1 行を含む）.

---

## 追記: 指摘を受けた修正分の再レビュー（custom まわり）

対象: `git diff index.html` の `#opt-custom-text`・`change` の `custom-text`・`applyCustomText`。
`<!-- Footer -->` は消えている（`rg -n Footer index.html` で 0 件）。上の要修正 1 は解消。上の検討 2 も解消（下の実測）。

### 実測（Playwright、幅 1280px、外部取得は遮断）

一致したもの:

- 適用前に custom を開いてキャンセル・×で閉じる → 選択欄は `0` に戻る。`#opt-custom-text` は hidden のまま
- 本文が空で適用 → alert でモーダルが残り、キャンセルすると `0` に戻る
- 題名A で適用 → `custom-text`「✏️ 題名A」、著者の欄「ユーザー設定 （文字数: 5字）」、本文あいうえお
- 適用後に custom を開いてキャンセル → `custom-text` のまま（`loadedSelectValue` が `custom-text`）
- 走れメロスへ移ってから `custom-text` を選び直す → カスタム文章に戻る
- 結果画面の「次の文章」→ `5`（吾輩は猫である）。そのあと `custom-text` を選び直す → カスタム文章に戻る
- 2 回目の適用（題名B）→ 選択肢の文字と本文が B に替わる。NHK まとめを経て選び直しても B
- 題名を省略 →「✏️ カスタムテキスト」
- pageerror は 0 件

### 検討

#### 6. カスタムの題名が長いと、選択欄が本文の幅を超える

- 場所: `index.html:1647-1649`（`opt.textContent = \`✏️ ${title}\``）
- 内容: 題名を切り詰めていないので、選択欄の幅が題名の長さで決まる。
- 根拠（実測）: 題名 80 字で `#preset-select` の幅 1254px、`main` の幅 980px（幅 1280px の画面）。
  NHK の記事名は `slice(0, 24)` + 「…」で切っている（`applyNewsData`）ので、同じ扱いにするかは判断が要る。
  はみ出た分が画面でどう見えるか（`main` の `overflow: hidden` で切れるか）は見ていない。

#### 3 の補足（狭い画面）

- 既定の状態（カスタムなし）でも `#preset-select` の幅は 451px（実測）。幅 375px の画面の `main` の幅（375px）を
  超えるので、3 の「はみ出す見込み」は数値の上では確定。見え方は verifier の確認に任せる。

### 好みの範囲

- `index.html:1647`: `document.getElementById('opt-custom-text')` を毎回引いている。ほかの要素
  （`optgroupNews` など）は `this.dom` にまとめて持つ作りなので、そちらに揃えると一貫する。

### 問題なしの観点

- `custom-text` の `change` で `this.customArticle` が未設定のまま呼ばれる経路: 選択肢は適用までは hidden で、
  適用で `customArticle` を入れてから表示するので、マウスでは選べない。キーボード操作で hidden の選択肢を飛ばすかは未確認。
- `applyNewsData` / `applyClaudeData` の作り直しは別の optgroup だけを消すので、`#opt-custom-text` と選択（`custom-text`）は残る。
- 作り込みすぎ: なし（追加は 6 行ほどで、既存の `loadArticle(art, selectValue)` を使っている）。
