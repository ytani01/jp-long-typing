# TODO

**残っている項目: TODO-036。** これまでに 35 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-037` から。**

---

## TODO-036. cron の設定方法を手順として文書に書く

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（文書）+ verifier（Haiku 5.5 / medium） |

- [ ] `docs/update-release-notes.md` の「cron で毎日流す」節を手順にする: 事前の確認（cronie、`~/tmp`、鍵）、`crontab -e` での登録と直す所、ログで成功を見分ける例（「変更なし」の日と push した日）、止め方。流れを `flowchart` で添える

**無駄を省く工夫:** crontab の行が cron の環境で通ることは TODO-035 で確かめ済み。verifier は事前の確認のコマンドを流すのと、
ログの例が `update-notes.sh` の出力と合うかを TODO-035 の verifier-report.md と突き合わせるだけにし、crontab は変えない

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

