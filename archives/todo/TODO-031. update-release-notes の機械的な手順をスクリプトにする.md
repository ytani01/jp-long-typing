# TODO-031. update-release-notes の機械的な手順をスクリプトにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 42 | 17,515 | 32,906 | 2,022,568 | 64% |
| reviewer | Opus 5.5 | high | 34 | 3,231 | 65,589 | 737,435 | 25% |
| verifier | Sonnet 5.5 | medium | 22 | 328 | 40,272 | 316,149 | 11% |
| 合計 |  |  | 98 | 21,074 | 138,767 | 3,076,152 | 計 3,236,091 |

- verifier は定義のモデルが haiku。壊したときに落ちるかを状況を作って確かめるので Sonnet 5.5 に上書きした
- verifier の分は少なめに出ている可能性がある（`token-usage.py` の制約）

## きっかけ

2026-10-10 の update-release-notes で、確認のスクリプトをその場で書いて作り直す
（`select` の取り違え、`textContent` が `<script>` を含む）、`pgrep -f` で自分の
シェルを止める、といった手戻りがあった。訳以外の機械的な手順をスクリプトにする。
訳は Claude が続けて行う（API キーや `claude -p` で自動にはしない。利用者と決めた）。

## やったこと

- `.claude/skills/update-release-notes/notes.py` を足した
  - `fetch`: curl で取得し、リリースノートは日付ごとにまとめて 3 日分、CHANGELOG は 3 版の
    先頭 8 項目を作業用の JSON に書く。`last-source.json`（前回の英語）と比べて
    `same` / `changed` / `new` を付ける。3 つ読めない、項目 0 件のものがあるときはエラーで止まる
  - `apply`: `ja` の数が `en` と合わなければ何も書かずに止まる。`same` は今の訳を使う。
    日付のコメントは変わった側だけ直し、`last-source.json` を書き換える
  - `check`: 空いているポートで配信し、Playwright で件数・並び・訳の表示・まとめの本文・
    コンソールのエラーを確かめる
- `last-source.json` を、今の埋め込みの元になった 2026-10-10 の英語で作った
- `SKILL.md` をスクリプトを使う手順に書き直した
- 利用者の依頼で `~/bin/update-release-notes` にシンボリックリンクを張った（リポジトリの外）

urllib の既定の User-Agent では platform.claude.com が 403 を返すので、取得は curl にした。
古い見出しに `April 9th, 2025` の形があるので、日付は月名の一覧と正規表現で読む。

## 確かめたこと

- `apply` で書き直しても、`index.html` は 1 バイトも変わらない（reviewer・main）
- verifier がリポジトリの写しで、`fetch` の「変更なし」、`ja` の数違いで止まって何も書かないこと、
  片方だけ変えたときにその側の日付だけ変わること、`CLAUDE_NOTES` を 2 件にすると `check` が
  落ちること、書式の検査と同じ日付のまとめを確かめた
  （[verifier-report.md](../agents/TODO-031/verifier-report.md)）

## 残ること

- `check` は期待値を `index.html` の埋め込みから読むので、訳の中身が誤っていても落ちない。
  確かめるのはページが埋め込みどおりに出るかまで

## 分担の振り返り

- reviewer は、`check` が件数を見ていない（`CLAUDE_NOTES` を空にしても OK）、`fetch` が
  0 件でも「変更なし」と出す、の 2 件を実測で見つけた。どちらも main は気づいていなかった。
  日付のコメントを両方直してしまう件も拾った
- verifier は食い違いを見つけなかった。reviewer の指摘を直した後の確認として働いた
- 見込みどおりの編成で動いた。reviewer は取得を依頼の 1 回より多く行い、`check` を 5 回回したので
  25% を占めた。次に同じ規模のスクリプトをやるなら、reviewer には「`check` は 2 回まで」と
  回数を書き、壊して落ちるかの実測は verifier に寄せる
