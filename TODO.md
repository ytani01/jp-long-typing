# TODO

**残っている項目: TODO-035。** これまでに 34 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-036` から。**

---

## TODO-035. リリースノートの更新を cron で毎日、push まで自動で流す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |

- [ ] 訳は google で試し、失敗したら claude で訳し直す（`update-notes.sh` に足す）
- [ ] crontab に毎日 1 回の行を足す（PATH に `~/.local/bin` と mise の node を入れ、ログはファイルへ）
- [ ] `docs/update-release-notes.md` に cron での使い方を書き足す

**無駄を省く工夫:** push の鍵（`id_ed25519_github`）にパスフレーズが無いことは確かめ済み。
verifier は cron と同じ環境（`env -i` で PATH を絞る）で 1 回流すだけにし、`check` の中身は測り直さない

- 決まったこと: 頻度は毎日 1 回。訳は google を先に、落ちたら claude
- `check` で落ちたときは `index.html` が書き換わったまま残るので、次の日の cron は「commit していない変更」で止まる。直すのは手で

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

