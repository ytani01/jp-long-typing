# TODO-035. リリースノートの更新を cron で毎日、push まで自動で流す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high、3 回）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 66 | 16,260 | 38,125 | 2,484,767 | 66% |
| reviewer | Opus 5.5 | high | 50 | 26,325 | 66,603 | 986,693 | 28% |
| verifier | Haiku 5.5 | medium | 16 | 6,490 | 31,241 | 181,862 | 6% |
| 合計 |  |  | 132 | 49,075 | 135,969 | 3,653,322 | 計 3,838,498 |

- モデルと effort は `~/.claude/agents/` の定義のまま（上書きしていない）
- reviewer は同じ担当に続けて 3 回頼んだ（作りの変更、指摘の修正、綴りの確かめの追加）

## きっかけ

TODO-034 で `update-notes.sh` 1 本で commit・push まで通るようになったので、cron で毎日、全自動で流したい。

## やったこと

- `update-notes.sh`: `google,claude` のように訳し方を `,` で並べられるようにした。`run` が落ちたら（translate でも check でも）
  `index.html` と `last-source.json` を HEAD に戻し、次の訳し方で流し直す。最後も落ちたら戻して exit 1。
  `claude` / `google` 以外の名前があれば、何もせずに止まる
- `docs/update-release-notes.md`: 「cron で毎日流す」節に crontab の設定例と注意（PATH、ログ、SSH の鍵、push だけ落ちた日）を書いた
- crontab への登録は利用者が行う（利用者の指示）
- 初めは `notes.py` の `--by` を並べられるようにしたが、check で落ちたときも戻して流し直す指示を受け、
  シェルのループ 1 つで translate の失敗もまとめて拾えるので `notes.py` の変更は戻した

## 確かめたこと

- reviewer: 偽の notes.py と使い捨てのリポジトリで、google が check で落ちて claude で成功、最後まで落ちて HEAD に戻る、を実測。
  名前の確かめで `,claude` などの空の要素が何も書かずに止まることも実測（[reviewer-report.md](../agents/TODO-035/reviewer-report.md)）
- verifier: クローンと bare リポジトリで、文書の crontab の行を `env -i` で cron の環境にして流し、google で訳して check が OK、
  commit と bare への push まで通った。決着の後に、google を名前解決で落として claude -p で流し直す経路も同じ形で通し、push まで通った。`ssh -T git@github.com` の認証も通った（[verifier-report.md](../agents/TODO-035/verifier-report.md)）
- main: `gogle,claude` で何もせず exit 1 になること

## 残ること

- 末尾の `,`（`google,`）は黙って捨てられ、google だけで流れる。1 つで流れるだけで実害が無いので直していない
- 訳し方の名前の一覧が `notes.py` の `choices` と `update-notes.sh` の 2 か所にある。訳し方を足すときは両方を直す

## 分担の振り返り

- reviewer は 1 回目で、文書の抜け（push だけ落ちた日）と実態との食い違い（python3 は mise でなく `/usr/bin`）を見つけた。
  2 回目で戻し先が index になっている点を、3 回目で空の要素の扱いを見つけた。verifier は食い違いを見つけなかった
- 見込みとの差は reviewer の回数。着手後に利用者の指示（check で落ちたときの自動の修復、綴りの確かめ）が 2 回足され、そのたびに頼み直した
- 次に同じ規模なら: 失敗時の振る舞い（どこまで自動で戻すか）は、項目を立てるときに利用者と決めてから reviewer を起こす。
  verifier の実測はクローンと bare リポジトリの形がそのまま使えるので、push まで流す確認ではこれを依頼に書く
