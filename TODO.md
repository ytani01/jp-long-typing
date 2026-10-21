# TODO

**残っている項目: TODO-033。** これまでに 32 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-034` から。**

---

## TODO-033. リリースノート更新スクリプトの使い方を文書にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（下書き）+ verifier（Haiku 5.5 / medium） |

- [ ] `docs/update-release-notes.md` を作る。`notes.py run [--by claude|google]` と各サブコマンド、作業用 JSON、`~/bin/update-release-notes` の張り方、終わった後のコミット、check が落ちたときの戻し方、`--by` の使い分けと注意
- [ ] README の「更新は …」の行から、この文書へリンクを張る
- [ ] SKILL.md と食い違わないようにする（同じ説明を 2 か所に書かず、SKILL.md からもこの文書を参照する）

**無駄を省く工夫:**

- verifier には、書いたコマンド例を複製したリポジトリで流すことだけを頼む。Google / Claude の訳は TODO-032 で確かめ済みなので、`run` は `--by google` の 1 回で足りる

背景:

- 主な使い方は Claude Code の外から呼ぶこと（TODO-032）。README からは 1 行のリンクだけにする

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

