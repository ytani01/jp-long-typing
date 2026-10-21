# TODO

**残っている項目: TODO-032。** これまでに 31 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-033` から。**

---

## TODO-032. update-release-notes を取得から確認までスクリプトで通す（訳は Claude / Google を選べる）

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |

- [ ] `notes.py translate --by claude|google WORK.json` を足す。`changed` / `new` の `en` を訳して `ja` に書く。既定は `claude`
  - `claude`: `claude -p` に訳し方の決まり（今の skill の「2. 訳す」）と `en` を渡し、JSON で受け取る
  - `google`: Google 翻訳の非公式エンドポイント（`translate.googleapis.com`、キー不要）。送る前に Markdown のリンク・`**` を外し、バッククォートの中の識別子は訳されないように保護する
- [ ] 失敗したら（通信エラー・制限・応答の形が違う・`ja` の数が合わない）何も書かずにエラーで止める
- [ ] `notes.py run [--by claude|google] WORK.json` で fetch → translate → apply → check を続けて行う。`~/bin/update-release-notes run …` でも呼べる。「変更なし」なら fetch で終える
- [ ] 訳し方の決まりはスクリプトに 1 か所だけ置き、skill からはそこを参照する（2 か所に書かない）
- [ ] skill を `run` を呼ぶ手順に書き換える。`/update-release-notes google` なら `--by google`、引数が無ければ `--by claude`

**無駄を省く工夫:**

- `apply` と `check` は変えないので、確かめるのは `translate` の出力と、`run` の通し 1 回ずつ（`claude` と `google`）だけにする
- 訳の質は評価しない。識別子が残っているか、`ja` と `en` の数が合うか、失敗で何も書かないか、だけを見る

背景（決めたこと）:

- 主な使い方は Claude Code の外から `update-release-notes run …` を叩くこと。skill はこのスクリプトを呼ぶだけにする（skill の中で main が訳す手順は残さない）
- 公式 API はキーと課金設定が要るので使わない。`translate.google.com` の画面操作は遅く壊れやすいので使わない
- 非公式エンドポイントは規約上グレーで、予告なく止まることがある。だから既定は `claude` にする
- `google` では「です・ます」調と製品名をそのまま残すことは保証しない
- `claude -p` は利用上限を使う（今までの main が訳すのと同程度）

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

