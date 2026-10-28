# TODO

**残っている項目: TODO-042。** これまでに 41 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-043` から。**

---

## TODO-042. データを配るサーバーを自宅に立てる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

- [ ] worktree `~/work/jp-long-typing-server`（ブランチ `server`）を作り、場所・ブランチ名・取り込み方を `CLAUDE.md` に書く
- [ ] 案の形を書き出して利用者に聞く: どの機械で動かすか、取得・訳（`notes.py`）をどう動かすか、ブラウザが読む JSON の形と CORS、取れないときの内蔵データの扱い
- [ ] サーバー側と、`index.html` が JSON を読む部分を作る
- [ ] 要らなくなる仕組み（cron の git push、一時 worktree、2 つの hook）を外す

**無駄を省く工夫:** リバースプロキシ経由で JSON が届くか・CORS が通るかは、実装の前に 1 回だけ測る。確認は変えた読み込みの経路だけにし、練習画面の他の機能は見ない。

- 決まっていること: 自宅に立てる。外への公開は既存のリバースプロキシ経由で、SSL なども用意済み。Cloudflare Workers・VPS は採らない
- worktree にする理由: トップのツリーで別ブランチを checkout すると、`update-notes.sh` が更新を見送り続ける（TODO-041）。master には cron の commit が積まれるので、取り込む前に 1 回 rebase する
- きっかけ: git push でデータを更新すると、データとコードの履歴が混ざり、未 push の判定や hook などの守りが増える。今の方式を数日動かして比べる手順は省いた（利用者が立てると決めた）
- implementer は定義の sonnet を Opus 5.5 に上書きする（サーバーと読み込みの設計が込み入るため）

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

