# TODO-027 verifier 報告（モーダルを Esc で閉じる）

対象: `git diff index.html`（index.html:1413-1414 の入力欄 Esc に `!e.repeat` を追加、1448-1461 の window capture keydown）。
実測: `archives/agents/TODO-027/verify.mjs`（node + Playwright、1280x800）。全出力は `archives/agents/TODO-027/verify-output.txt`。

## 配信について

- 8080 番は既に別の `python3 -m http.server 8080`（PID 7675、cwd は同じプロジェクト、起動から約 20 分）が使っていた。自分の起動は Address already in use で失敗したため、PID 7675 をそのまま使った。ファイルは毎回ディスクから読まれるので、現在の index.html が対象になる。
- PID 7675 は自分のものではないので止めていない。止めるかは管理者が決める。
- 自分の起動分（PID 338832）は既に終わっていて残っていない。

## 結果

| # | 項目 | 実測（抜粋） | 判定 |
|---|------|-------------|------|
| 1 | 自作テキスト Esc | open: `active:["custom-modal"]` → Esc後: `active:[]` | 一致 |
| 1 | 履歴 Esc | open: `active:["history-modal"]` → Esc後: `active:[]` | 一致 |
| 1 | 結果 Esc | open（`app.finish()` 後にフォーカスを入力欄へ戻した）: `active:["result-modal"]` → Esc後: `active:[]` | 一致 |
| 2 | 結果を開いた状態で Esc（フォーカスは入力欄） | Esc前 `progress:"3/520", focus:"typing-input"`、Esc後 `progress:"3/520", active:[]` | 一致（閉じる、リセットされない） |
| 3 | 自作テキスト Esc後のフォーカス | `focus:"typing-input"` | 一致 |
| 3 | 履歴 Esc後のフォーカス | `focus:"typing-input"` | 一致 |
| 4 | 変換中 Esc（`isComposing:true`） | Esc後 `active:["custom-modal"], focus:"custom-textarea"` | 一致（閉じない） |
| 4 | 変換中 Esc（`keyCode:229`） | Esc後 `active:["custom-modal"]` | 一致（閉じない） |
| 4 | 変換中でない Esc（比較） | Esc後 `active:[]`、`focus:"typing-input"`、`progress:"3/520"` | 一致（閉じ、入力欄へ戻る、リセットされない） |
| 5 | モーダル無しの Esc | 3字入力後 `progress:"3/520"` → Esc後 `progress:"0/520"` | 一致（リセット） |
| 5 | `repeat: true` の Esc | 3字入力後 Esc（repeat）後 `progress:"3/520"` | 一致（リセットしない） |
| 6 | 結果を Esc で閉じる | 前後で `progress` 同じ（3/520）、`value` 同じ（""）、`result-modal` は閉じた | 一致（再スタートしない） |

- 9 行目の `console/page errors`: `[]`（pageerror も console error も無し）。

## 食い違い・注意

- 食い違いは無し。
- `app.finish()` を直接呼ぶと、フォーカスが `body` に外れる（`focus:""`）。そこで検証では入力欄へ `focus()` を戻してから Esc を押した。本当に最後の字を打って結果が出た場合にフォーカスが残るかは、この確認では実測していない。
- 入力欄の `value` は正しく打った字の後ですぐ空になる（`value:""` が常態）。リセットの判定は `stat-progress`（進み具合）で見た。`value` は判定材料になっていない。
- 項目 5 の `repeat` は `dispatchEvent` の合成 keydown（`isTrusted: false`）で再現した。本物のキーリピートは使っていない。

## 実害は未確認（reviewer 報告の件。判断は管理者）

- reviewer が挙げた「結果を Esc で閉じたあと、フォーカスが入力欄に残るので、もう一度 Esc で `restart()` が動く」は、今回の確認範囲の外。試していない。
- 同じく「自作テキスト・履歴を閉じたあとに Esc の押しっぱなし（長押し）で `restart()` が動く」も試していない（項目 5 は合成の `repeat` を 1 回だけ見た）。

## 確かめられなかったこと・判断できなかったこと

- 「変更前に戻して落ちるか」（分岐を壊す確認）は依頼に無かったので未実施。
- 終了コードは `node ... | tee` で取ったため、`PIPESTATUS` の値が取れなかった。ただし全項目の出力は最後の `9 console/page errors` まで出ており、途中で例外終了はしていない。
- 見た目・レイアウトは見ていない（依頼どおり）。
- 判断は要らない。今回の確認の範囲では、項目 1〜6 は依頼どおりに動いた。
