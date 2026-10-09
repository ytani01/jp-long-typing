# TODO-027 reviewer 報告

対象: `git diff index.html`（index.html:1448-1461 の window capture keydown）。ブラウザでの実測はしていない（依頼どおり）。

要修正: なし

## 検討

- **index.html:1458-1460 / 2070-2072: 結果モーダルを Esc で閉じたあとのフォーカスが × と違う（実害は未確認）**
  - `closeResultModal()` はフォーカスを動かさない。`endGame()` も blur・focus・disabled をしていない（`rg` で確認）ので、最後の字を打った入力欄にフォーカスが残っているはず
  - × をクリックしたときは、フォーカスが × ボタン（その後に隠れる）へ移る。Esc ではフォーカスが入力欄のまま
  - そのため、Esc で結果を閉じてからもう 1 度 Esc を押すと、入力欄の Esc（`restart()`、index.html:1413）が動く。キーボードだけで「閉じる → やり直す」ができる一方、「× と同じ動き」とは少し違う。意図した動きかの判断は管理者に任せる

- **index.html:1451: Esc の押しっぱなし（`e.repeat`）を見ていない（実害は未確認）**
  - 自作テキストや履歴を Esc で閉じると、`closeCustomModal()` / `closeHistoryModal()` が入力欄にフォーカスを移す（index.html:2028, 2081）。キーリピートが始まるまで押し続けると、次の keydown は入力欄の Esc に届き、`restart()` が動くことになる
  - 普通の 1 回押しではリピートは出ないので、起きるのは長押ししたときだけ。入力欄の Esc（TODO-022）も `e.repeat` を見ていない

## 確認して問題なしとしたもの

- 分岐: `key !== 'Escape'`、`isComposing`、`keyCode === 229` は入力欄の Esc（index.html:1413）と同じ見分け方。入力欄にだけある局所変数 `isComposing` が無いが、モーダルが開いている間に入力欄で変換が続いている経路は見当たらない（`endGame` は確定の処理から呼ばれる）
- 入力欄の Esc との干渉: window の capture で `stopPropagation()` するので、target の入力欄の keydown は動かない。モーダルが開いていなければ何もせず return するので、TODO-022 のリセットはそのまま
- ほかの Esc 処理: `rg -n "Escape" index.html` で見つかるのは入力欄と今回の 2 か所だけ
- 2 つ重なる場合: `endGame()` は履歴を外してから結果を付ける（index.html:2014-2015）ので、通常の操作で 2 つが同時に active にはならない。仮に重なっても配列の先頭が結果で、DOM でも結果が自作テキストより後（上に描かれる）なので、見えている方から閉じる
- フォーカスの戻り（自作テキスト・履歴）: 既存の close 関数が入力欄へ戻す。自作テキストは選択欄も `loadedSelectValue` に戻り、キャンセルと同じ
- コメントは「なぜ capture か」「なぜ 229 を見るか」を書いている。範囲外の変更なし（TODO.md はチェックだけ）。テストの仕組みはこのリポジトリに無いので、確認は verifier の実測で足りる

## 作り込みすぎ

- index.html:1452-1457: shrink（好みの範囲）: 組と find で 6 行。`const btn = document.querySelector('.modal-overlay.active .modal-close');` と `btn.click()` にすれば、文字どおり「× と同じ」で 4 行ほど減る。ただし選ばれる順が DOM の順（自作テキスト → 結果 → 履歴）になり、重なったときに下の方を閉じる。上記のとおり重なる経路は通常無いので、今の形のままでもよい

net: -4 lines possible.
