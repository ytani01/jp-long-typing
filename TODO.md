# TODO

**残っている項目: TODO-023。** これまでに 22 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-024` から。**

---

## TODO-023. README にプレー動画を載せる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ verifier（Sonnet 5.5 / medium） |

- [ ] 録画スクリプト `tools/record-demo.mjs` を書く（Playwright の `recordVideo`、1280×800、ライトモード）
  1. 練習文の切り替え: プリセットを開いて 1 つ選ぶ
  2. 打ち進める様子: `insertText` で語ごとに人の速さで入力し、ミスを 1 回入れる
  3. 結果画面: 時間切れか短いカスタム文章の完走でランクを出す
  4. 履歴と苦手の分析: `localStorage` に見本の履歴を先に入れ、履歴を開く
- [ ] webm を ffmpeg で MP4（H.264）にする。GitHub の添付の上限に合わせ 10 MB 未満
- [ ] MP4 は `.gitignore` に入れてコミットしない。スクリプトは残して撮り直せるようにする
- [ ] 利用者が MP4 を GitHub に添付し、`user-attachments` の URL を README に入れる
- [ ] 動画の下に「IME の変換は映らず、確定後の字を流し込んでいる」と添える

背景: 撮り方は Playwright で自動、載せ方は GitHub に添付した MP4、
場面は上の 4 つと利用者が決めた（2026-10-08）。

分担: verifier は定義のモデルが haiku。フレームを抜いて場面が映っているか・
欠けや余計なものが無いかを見る判断が要るので Sonnet 5.5 に上書きする。
アプリの挙動は変わらないので reviewer は付けない。

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

