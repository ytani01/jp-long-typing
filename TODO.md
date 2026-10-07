# TODO

**残っている項目: TODO-017〜TODO-019。** これまでに 16 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-020` から。**

---

## TODO-017. リリースノートを、ブラウザで取得せずに埋め込む

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |

- [ ] ブラウザからリリースノート（`CLAUDE_NOTES_URL`）を取得する処理と、allorigins の中継をやめる
- [ ] 埋め込んだリリースノート（今の `FALLBACK_CLAUDE_NOTES`）を常に使う
- [ ] プロジェクトの skill を作る。curl で取得し、AI が日本語に訳して `index.html` に埋め込む
- [ ] `README.md` と `CLAUDE.md` の記述を直す

Claude Platform リリースノートは CORS ヘッダーを返さないので
`api.allorigins.win` を中継にしていた。2026-10-08 に allorigins が 500 や
タイムアウトを返し、「Claudeニュースの取得に失敗した」の alert が出た。
代わりの中継も使えなかった（`api.codetabs.com` は 503、`corsproxy.io` は
401）。

2026-10-08 に利用者と決めたこと:

- リリースノートは、この skill で取得・翻訳・埋め込みし、コミットと
  push で反映する。「ニュース更新」ボタンでは取得しない
- Claude Code の CHANGELOG（CORS を許している）と NHK は、今のまま
  ブラウザで取得する。CHANGELOG は英語のまま

**着手時に確かめること:** 今の取得元は日本語版（`/docs/ja/`）なので、
訳すのは英語のまま残る部分だけで足りるか。日本語版が英語版より遅れて
いるなら英語版から訳すか、利用者に聞く。

---

## TODO-018. 結果を保存し、履歴の画面で一覧にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |

- [ ] 結果のモーダルを出すときに、1 件を `localStorage` へ保存する
- [ ] ヘッダーに「履歴」ボタンを足し、モーダルで一覧を表で出す（新しい順）
- [ ] 1 件ずつ削除できるようにする
- [ ] `README.md` の機能の説明に足す

2026-10-08 に利用者と決めたこと:

- 一覧はヘッダーのボタンから開くモーダル。結果のモーダルの作りに揃える
- 1 件に残すのは、結果の 5 項目（ランク・所要時間・CPM・入力文字数・
  正確率）と、日時・文章名・制限時間
- 件数の上限は設けない。全件削除は置かず、1 件ずつ削除する
- 保存するのは結果のモーダルが出たもの（完走か時間切れ）だけ。
  リセットで捨てたものは残さない

---

## TODO-019. 練習文から Claude Code の日本語ドキュメントの抜粋を外す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |

- [ ] `PRESETS` から「概要」「クイックスタート」「一般的なワークフロー」の 3 本と、選択欄の「Claude Code ドキュメント」の optgroup を消す
- [ ] 選択欄の値（`PRESETS` の添字）と「次の文章」の巡回を、残る文章に合わせる
- [ ] このアプリの特徴の文章（`PRESETS[0]`）と `README.md` から、抜粋の記述を消す

2026-10-08 に利用者と決めたこと: 消すのは抜粋 3 本だけ。Claude ニュースの
Claude Code の CHANGELOG（英語）は残す。

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

