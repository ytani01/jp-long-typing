# TODO-042. データを配るサーバーを自宅に立てる（対応しない）

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 160 | 39,927 | 149,884 | 4,857,840 | 55% |
| impl-042（implementer） | Opus 5.5 | medium | 86 | 42,515 | 140,969 | 4,004,456 | 45% |
| 合計 |  |  | 246 | 82,442 | 290,853 | 8,862,296 | 計 9,235,837 |

- implementer は定義のモデルが sonnet。見込みどおり Opus 5.5 に上書きした
- impl-042 は worktree `~/work/jp-long-typing-server`（ブランチ `server`）で `server.py` などを作りかけたが、別リポジトリにすると決めたので捨てた（報告ファイルは無い）
- 範囲は最初に立てたコミット（4e3beb9「立てるか決める」）からで、書き換える前のやり取りも含む

## きっかけ

NHK ニュースなどのデータを cron の git push で更新すると（TODO-041）、データとコードの
履歴が混ざり、未 push の判定や hook などの守りが増える。自宅のサーバーから JSON で配る案として立てた。

## やらないと決めた理由

サーバー版は、プロジェクトもリポジトリも分けて、別リポジトリで開発を始めることにした。
このリポジトリではサーバー版に関する作業を何もしない。

途中まで進めたものは、すべて取り消した。

- master に載せた TODO-042 の commit 4 つ（8d5911e〜6c2c8ae。worktree の書き方、作り方の案）は push 前に a5e0e9c へ戻した
- worktree `~/work/jp-long-typing-server` と `server` ブランチは消した。origin にも上げていない
- impl-042 が試しに動かした `server.py`（ポート 8090）は止まっている。一時ファイルも消した

立てたときに決めていたこと（新しいリポジトリで使える）:

- 自宅に立てる。外への公開は既存のリバースプロキシ経由で、SSL なども用意済み。Cloudflare Workers・VPS は採らない
- 聞く予定だったこと: どの機械で動かすか、取得・訳（`notes.py`）をどう動かすか、ブラウザが読む JSON の形と CORS、取れないときの内蔵データの扱い
