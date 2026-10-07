# TODO-018 レビュー（reviewer）

対象: `git diff`（index.html、README.md、TODO.md）。コードは直していない。
確かめに使ったスクリプト: `archives/agents/TODO-018/reviewer-check.cjs`
（`python3 -m http.server 8091` で配信し、
`NODE_PATH=<Playwright 1.63 の node_modules> node reviewer-check.cjs`）。

## 要修正

### 1. 1 回の結果が 2 件保存されることがある

- `index.html:1621-1624`（`handleInputCommit`）、`index.html:1679`
  （`updateTimerAndStats`）、`index.html:1759`（`finish` の保存）
- 何が: 制限時間ありで、最後の文字の確定が制限時間を過ぎた直後
  （250ms ごとのタイマーより先）に来ると、`handleInputCommit` の中の
  `updateTimerAndStats()` が `finish(true)` を呼び、戻ったあと
  `currentIndex >= cleanText.length` で `finish()` をもう一度呼ぶ。
  `finish` に `isFinished` のガードが無いので、履歴に 2 件積まれる。
- 根拠（実測）: タイマーを止め、`startTime` を 31 秒前にして 30 秒の
  制限で全文を確定させたところ、履歴は 2 件（`time` が `00:30` と
  `00:31`）、結果のモーダルの見出しは「制限時間内にクリア！」に上書き
  された。
- 補足: 二重の `finish` 自体は以前からある（見出しの上書き、効果音 2 回）。
  今回の保存で、それが履歴に残る形になった。起きる幅は制限時間を
  過ぎてから最大 250ms の間の確定だけで、頻度は低い。
  `finish` の入口に 1 か所ガードを置けば、呼び出し元 3 か所すべてに
  効く（直し方の判断は管理者に任せる）。

## 検討

### 2. 配列の中に壊れた要素があると、履歴が開けなくなる

- `index.html:945-951`（`loadHistory`）、`index.html:1828` 以降
  （`renderHistory`）
- 何が: `loadHistory` は JSON でない値・配列でない値は `[]` にするが、
  配列の要素は見ていない。要素が `null` だと `r.timeLimit` で TypeError に
  なり、`openHistoryModal` が `active` を付ける前に落ちる。モーダルが
  開かないので、画面から削除して直すこともできない。
- 根拠（実測）: `localStorage` に `[null]` を入れて `openHistoryModal()`
  を呼ぶと `TypeError: Cannot read properties of null (reading
  'timeLimit')`、モーダルは開かなかった。`{bad` と `{"a":1}` は 0 行で
  開いた（こちらは問題なし）。
- 実害: このアプリ自身は壊れた要素を書かないので、手で書き換えたとき
  くらいしか起きない。直すかは判断が要る（境界線上）。

### 3. 別のタブで履歴を変えると、違う行が消える

- `index.html:1848-1852`（削除ボタンの click）
- 何が: 削除は「表を描いたときの添字 `i`」で、押したときに読み直した
  配列を `splice(i, 1)` する。描いたあとに別のタブで削除・追加があると、
  添字がずれて別の結果を消す。同じタブで結果が増える場合は末尾への
  追加なので、ずれない（コードを読んで確認）。
- 実害は未確認（2 タブで同時に使う場面がどれだけあるか次第）。
  境界線上なので報告だけ。

### 4. 練習の途中で履歴を開くと、タイマーが進んだまま

- `index.html:1244`（`btnHistory` の click）
- 何が: 開いても計時は止まらず、入力欄からフォーカスが外れる。
  開いている間に時間切れになると `finish(true)` が走り、結果のモーダルが
  履歴のモーダルの下に出る（どちらも z-index 1000 で、履歴の方が DOM で
  後ろにあるため。重なり方は未確認）。
- 決めたことに「途中で開いたとき」の扱いは無い。開くのを止める・計時を
  止める・このまま、のどれにするかは利用者の判断（報告だけ）。

## 好みの範囲

### 5. README の「リセットで中断したもの」

- `README.md:47`
- リセット以外に、文章や制限時間を切り替えたときも途中の結果は残らない
  （どちらも `restart` / `loadArticle` を通る）。「リセットや文章の
  切り替えで中断したものは残さない」とすると実装と揃う。

## 問題なしの観点

- 保存のタイミング: `history.push` は `finish` の中だけ。`restart` には無い。
- 削除の添字: 新しい順に逆から回し、保存した並びの添字 `i` で消しており、
  同じタブの中では正しい。
- localStorage が使えないとき: `getItem` / `setItem` とも try の中。
  `localStorage` への参照自体が投げる場合も含めて落ちない。
- XSS: 文章名を含め、セルはすべて `textContent`。`innerHTML` は使っていない。
- CLAUDE.md の守ること: `index.html` 1 ファイルのまま、外部ライブラリ無し。
- README と実装: 保存する項目・上限なし・1 件ずつ削除・新しい順が一致
  （上の 5 を除く）。
- コメント: 「なぜ」が書いてある（上限なし、保存できなくても続けられる、
  添字の扱い）。
- 範囲: 指示に無い変更は無い。TODO.md はチェックを入れただけ。
- テスト: このプロジェクトにテストの仕組みは無く、確認は verifier の担当。

## 作り込みすぎ

作り込みすぎ: なし（Lean already. Ship.）
