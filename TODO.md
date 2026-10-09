# TODO

**残っている項目: TODO-031。** これまでに 30 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-032` から。**

---

## TODO-031. update-release-notes の機械的な手順をスクリプトにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5.5 / medium） |

- [ ] `.claude/skills/update-release-notes/` にスクリプトを置く
  - `fetch`: リリースノートと CHANGELOG を取得し、新しい 3 日分・3 版（各版の先頭 8 項目）を英語の JSON で出す。今の埋め込みと同じ日付・版なら「変更なし」と出す
  - `apply`: 訳した JSON を受け取り、`CLAUDE_NOTES` / `CLAUDE_CODE_JA` と日付のコメントを書き換える
  - `check`: 配信して Playwright で `SKILL.md` の手順 5 を確かめる
- [ ] `SKILL.md` をスクリプトを使う手順に書き直す

背景:

- 翻訳は Claude が続けて行う（API キーや `claude -p` で自動にはしない。利用者と決めた）
- 2026-10-10 の更新で、確認スクリプトの作り直し（`select` の取り違え、`textContent` が `<script>` を含む）や、`pkill` 相当で自分のシェルを止める、といった手戻りがあった
- verifier は定義が Haiku。訳との突き合わせや Playwright の結果を読むので Sonnet 5.5 に上書きする

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

