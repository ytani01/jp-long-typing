# TODO-033. リリースノート更新スクリプトの使い方を文書にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（下書き）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（下書き・バグ修正）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 34 | 10,789 | 18,511 | 2,025,772 | 76% |
| verifier | Haiku 5.5 | medium | 32 | 2,829 | 53,774 | 589,953 | 24% |
| 合計 |  |  | 66 | 13,618 | 72,285 | 2,615,725 | 計 2,701,694 |

- main の集計には、途中で受けた質問（Claude と Google の訳の比較）の分も入っている

## きっかけ

TODO-032 で `notes.py run` を Claude Code の外から使えるようにしたので、その使い方を文書にしたいという利用者の要望。
置き場所は、独立した文書にして README からリンクする形を利用者が選んだ。

## やったこと

- `docs/update-release-notes.md` を新しく書いた
  - 必要なもの、シンボリックリンクの張り方、`run` と各サブコマンド、`--by` の使い分け、check で確かめること、失敗したとき、終わった後のコミット
- README の「更新は …」の行から、この文書へリンクした
- SKILL.md の使い方の説明をこの文書に移し、SKILL.md には skill から呼ぶ手順（引数と `--by` の対応、スクラッチパッド、コミット）だけを残した
- verifier が見つけたバグを直した: `notes.py` の `LAST` がシンボリックリンクをたどらず、`~/bin/update-release-notes` 経由で呼ぶと `last-source.json` を `~/bin/` 側で読み書きしていた。`.resolve()` を足した
- 文書の「失敗したとき」に、check が NHK ニュースの CORS エラーで落ちる件を書いた

## 確かめたこと

verifier が複製したリポジトリで、文書のとおりに流した（`archives/agents/TODO-033/verifier-report.md`）。

- `/` からリンク経由で `run --by google`: fetch → translate → apply → check と進んだ。check の失敗は既知の CORS エラーだけ
- 文書の `git checkout …` で index.html と last-source.json が戻った
- サブコマンドの書き方、リンク先、check と `--by` の説明が notes.py と食い違っていなかった
- 修正後、リンク経由の fetch で changed が 1 件だけになり、リンクの側に `last-source.json` ができなかった

## 分担の振り返り

- verifier: 文書のとおりにリンク経由で流したことで、TODO-032 のバグ（`LAST` がリンクをたどらない）を見つけた。TODO-032 では本物のパスから流していたので、見つけられなかった
- 見込みとの食い違い: バグ修正が入ったが、1 行なので reviewer は足さず、同じ verifier にリンク経由の fetch を 1 回だけ流し直させた
- 次に同じ規模の項目では、同じ組み方にする。スクリプトを足す項目の確認には、最初から「利用者が実際に呼ぶ経路（`~/bin` のリンクなど）」で流すよう書く
