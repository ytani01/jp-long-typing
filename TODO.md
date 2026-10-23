# TODO

**残っている項目: TODO-034。** これまでに 33 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-035` から。**

---

## TODO-034. リリースノートの更新を 1 コマンドで commit・push まで通す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |

- [ ] リポジトリ直下に `update-notes.sh [google]` を置く
  - 作業用の JSON は `mktemp` で作り、`notes.py run --by claude|google` を流す
  - 「変更なし」なら何もしないで終える。`check` が落ちたら commit しない
  - 通ったら `index.html` と `last-source.json` を commit して push する。メッセージは `docs/update-release-notes.md` の「終わったら」の形
- [ ] `notes.py check` が api.rss2json.com の CORS エラー（NHK の取得失敗。内蔵のニュースで動く）を数えないようにする
- [ ] `docs/update-release-notes.md` に `update-notes.sh` を足し、「失敗したとき」の CORS の行を直す

**無駄を省く工夫:** 訳の中身は確かめない。verifier には `check` の判定と、「変更なし」で終わる流れだけを見せる。push の確認には、実際の remote ではなく一時的な bare リポジトリを使う

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

