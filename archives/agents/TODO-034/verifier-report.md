# TODO-034 verifier 報告

## 環境

- 本物のリポジトリでは commit・push していない。
- 作業場所: `/tmp/claude-649/-home-ytani-work-jp-long-typing/23d78aaa-26fc-483b-9205-1db457c2f73d/scratchpad/v034/`
  - `remote.git`（`git clone --bare` の bare リポジトリ）、`work`（作業用 clone）、`fakebin/node`（exit 1 する偽の node）
- `work` には本物の未コミットの `update-notes.sh`、`notes.py`、`docs/update-release-notes.md` を写した。
- 訳は `google` で行った。`claude` は使っていない。
- 開始時点の HEAD は `7876ce2`（remote も同じ）。

## 結果

| ケース | 実行 | exit | commit 数（local / remote） | 結果 |
|---|---|---|---|---|
| 1 変更なし | `./update-notes.sh google` | 0 | 87 → 87 / 87 → 87 | 合う |
| 2 片方だけ変わった | 英語を書き換えて commit → `./update-notes.sh google` | 0 | 88 → 89 / 87 → 89 | 合う |
| 3 check が落ちる | 英語を書き換えて commit → `PATH=fakebin:$PATH ./update-notes.sh google` | 1 | 90 → 90 / 89 → 89 | 合う |
| 4 事前に変更あり | `index.html` に 1 行足して `./update-notes.sh google` | 1 | 90 → 90 / 89 → 89 | 合う |

### ケース 1 の出力（実物）

```
same     2026年10月22日の更新（2 項目）
same     2026年10月21日の更新（4 項目）
same     2026年10月20日の更新（6 項目）
CLAUDE_NOTES: 変更なし
same     Claude Code 2.1.309（日本語）（8 項目）
same     Claude Code 2.1.308（日本語）（1 項目）
same     Claude Code 2.1.307（日本語）（8 項目）
CLAUDE_CODE_JA: 変更なし
変更なし
```

「変更なし」で終わり、`check` と commit は行われなかった。

### ケース 2 の出力（実物）

clone で `last-source.json` の「2026年10月22日の更新」の英語 1 項目の末尾に ` (verifier test)` を足して commit した（`b3ff1db`）。

```
changed  2026年10月22日の更新（2 項目）
same     2026年10月21日の更新（4 項目）
same     2026年10月20日の更新（6 項目）
same     Claude Code 2.1.309（日本語）（8 項目）
same     Claude Code 2.1.308（日本語）（1 項目）
same     Claude Code 2.1.307（日本語）（8 項目）
CLAUDE_CODE_JA: 変更なし
訳すもの: 1 件 → /tmp/tmp.0msYck0ZoI.json
1 件を google で訳す
/tmp/tmp.0msYck0ZoI.json に訳を書いた
index.html と last-source.json を書き換えた（2026-10-24 時点）
OK: 選択欄・訳の表示・まとめ・コンソール
[master d99da3c] chore(news): リリースノートを 2026-10-24 時点に更新する
 2 files changed, 3 insertions(+), 3 deletions(-)
To .../remote.git
   7876ce2..d99da3c  master -> master
```

- 追加された commit は `d99da3c` の 1 つ。メッセージは `chore(news): リリースノートを 2026-10-24 時点に更新する`（`docs/update-release-notes.md` の形どおり）。
- bare（remote）にも `d99da3c` が届いた。remote は 87 → 89 で、増えた 2 つは `b3ff1db`（テスト用の書き換え）と `d99da3c`。`b3ff1db` は script ではなく verifier が作った commit で、script の push に一緒に載った。
- 訳す前の `訳すもの:` 行は、check の `OK` より前に出ている。順序は正しい。

### ケース 3 の出力（実物）

clone で `last-source.json` の「2026年10月21日の更新」の英語 1 項目に ` (verifier test 2)` を足して commit した（作業 clone の HEAD で、ケース 2 の `d99da3c` の上に乗る）。`PATH` の先頭に、exit 1 だけする偽の `node` を置いて実行した。

```
same     2026年10月22日の更新（2 項目）
changed  2026年10月21日の更新（4 項目）
same     2026年10月20日の更新（6 項目）
same     Claude Code 2.1.309（日本語）（8 項目）
same     Claude Code 2.1.308（日本語）（1 項目）
same     Claude Code 2.1.307（日本語）（8 項目）
CLAUDE_CODE_JA: 変更なし
訳すもの: 1 件 → /tmp/tmp.bzkVS8Hhkh.json
1 件を google で訳す
/tmp/tmp.bzkVS8Hhkh.json に訳を書いた
index.html と last-source.json を書き換えた（2026-10-24 時点）
fake node: forced failure
```

- exit 1。commit は増えず、remote への push も無かった。
- 偽の node の出力（`fake node: forced failure`）が出ており、`check` が偽の node を呼んでいることは確かめられた。
- 失敗後、作業ツリーには `index.html` と `last-source.json` の書き換えが残る（`git checkout` で戻した）。`docs/update-release-notes.md` の「失敗したとき」の手順と合う。

### ケース 4 の出力（実物）

`index.html` の末尾に `<!-- verifier uncommitted line -->` を 1 行足して実行した。

```
index.html .claude/skills/update-release-notes/last-source.json に commit していない変更がある
```

- exit 1。`notes.py` の出力（取得・訳・check）は一切無い。commit は増えず、remote への push も無かった。
- 作業ツリーの `index.html` は足した 1 行のまま残った（script は触っていない）。

## 合わなかったもの

- 食い違いは無し。

## 補足（判断は要らない。見たことだけ）

- ケース 2 で作った書き換えの commit `b3ff1db` は、script の push で bare に届いた。本物のリポジトリとは無関係。
- ケース 3 の失敗時、script はエラーメッセージを出さない。`set -o pipefail` と `set -e` で `notes.py` の exit 1 がそのまま返る。exit 1 の理由は `check` の出力を見るまで分からない（今回は偽の node なので `fake node: forced failure` が見えた）。
- 本物のリポジトリは確認の前後で変わっていない（`git status` の内容・HEAD `7876ce2` とも同じ）。

## 確かめていないこと

- `git push` が失敗したときの動き（`docs/update-release-notes.md` は「流し直さず `git push` を手で流す」と書いている）。今回の依頼の範囲外なので確かめていない。
- 本物の Playwright による `check` の失敗（ブラウザ側の失敗）。失敗は偽の node で代えた。
- 訳の中身、rss2json の除外、引数の誤り、文書の書式（依頼どおり確かめていない）。
- 実際の remote（GitHub）への push。bare で代えた。

## 判断が要る点

- 無し。4 ケースとも依頼どおり動いた。
