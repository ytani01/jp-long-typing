# TODO

**残っている項目: TODO-032。** これまでに 31 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-033` から。**

---

## TODO-032. update-release-notes の訳を Google 翻訳でも作れるようにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |

- [ ] `notes.py translate WORK.json` を足す。`changed` / `new` の `en` を Google 翻訳の非公式エンドポイント（`translate.googleapis.com`、キー不要）で訳し、`ja` に書く
- [ ] 送る前に Markdown のリンク・`**` を外す。バッククォートの中の識別子は訳されないように保護し、訳文ではバッククォートを外す
- [ ] 失敗したら（通信エラー・制限・応答の形が違う）何も書かずにエラーで止める
- [ ] skill の手順に、訳し方を 2 通り書く。既定は今までどおり Claude が訳し、`translate` は必要なときだけ使う
- [ ] スクリプトだけで通せるようにする。`notes.py run --google WORK.json` で fetch → translate → apply → check を続けて行う（Claude を介さない。`~/bin/update-release-notes run --google …` でも呼べる）。`--google` が無ければ、fetch の後で止めて Claude の訳を待つ
- [ ] skill の引数で切り替えられるようにする。`/update-release-notes google` なら `run --google` を使い、引数が無ければ Claude が訳す

**無駄を省く工夫:**

- `apply` と `check` は変えないので、確かめるのは `translate` の出力だけにする。`check` は通し確認で 1 回
- 訳の質は評価しない。識別子が残っているか、`ja` と `en` の数が合うか、失敗で何も書かないか、だけを見る

背景（決めたこと）:

- 公式 API はキーと課金設定が要るので使わない。`translate.google.com` の画面操作は遅く壊れやすいので使わない
- 非公式エンドポイントは規約上グレーで、予告なく止まることがある。だから Claude の訳を既定のまま残す
- 「です・ます」調と製品名をそのまま残すことは保証しない

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

