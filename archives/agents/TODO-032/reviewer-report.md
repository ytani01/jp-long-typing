# TODO-032 reviewer 報告

対象: `git diff`（未コミット分）の `notes.py`、`SKILL.md`、`README.md`。
Google と `claude -p` は呼んでいない。`by_claude` の `subprocess.run` と `__main__` の
各関数を差し替えて、引数解析と `translate` の分岐だけを実測した
（`/tmp/claude-649/-home-ytani-work-jp-long-typing/8a915d7b-dd55-461a-9215-22e0bb4f9c7c/scratchpad/h.py`）。

## 要修正

### 1. `notes.py:276-284` `run --by`（値を書き忘れたとき）が既定の claude で全段を流す

- 問題: `args[:1] == ['--by'] and len(args) > 1` が偽になると `--by` がそのまま WORK.json の
  パスとして残る。実測で `run --by` は `fetch('--by')` → `translate('--by', 'claude')` →
  `apply('--by')` → `check()` を呼んだ。カレントに `--by` というファイルを書き、`claude -p`
  （利用上限）を使い、`index.html` と `last-source.json` を書き換える。`translate --by`、
  `fetch --by` も同じく `--by` をファイル名として扱う
- 根拠: 実測。ほかの崩れ方（`run W --by google`、`--by=google`、`fetch --by google W`、
  `check --by google`、`--by x`）は使い方の表示かエラーで止まり、何も呼ばなかった
- 補足: `argparse`（`choices=['claude', 'google']`、`default='claude'`）にすれば値の書き忘れ・
  位置・`--by=google` がまとめて塞がる。行数はほぼ同じ

## 検討

### 2. `notes.py:138` / `notes.py:171-175` 文字列の検査が `by_google` にしか無い

- 問題: `claude -p` が `[[1,2]]` を返すと `plain(s)` で `TypeError`、`[1]` を返すと
  エラー文を組み立てる `len(j)` で `TypeError` になり、どちらもトレースバックで落ちる
- 根拠: 実測。どちらも WORK.json には書いていない（書き込みはループの後なので）。実害は
  メッセージが分かりにくいことだけ
- 要素が `str` かの検査を `translate` の数の検査（171 行）に移せば、`by_google` の 138 行は
  消せて両方に効く

### 3. `notes.py:155-159` `claude -p` の応答の読み取り

- 問題は「壊れた応答を通す」ではなく「正しい JSON を落とす」側にある。最初の `[` から
  最後の `]` までを切り出すので、前置きや後書きに角かっこがあると読めずに止まる
- 実測（WORK.json に書いたか）:

  | 応答 | 結果 |
  |---|---|
  | `[["あ","い"]]`、` ```json ` で囲んだもの、項目内の改行 | 通る（改行は空白に） |
  | `以下です [2 件]:` + JSON | 止まる・書かない |
  | JSON + `注: [補足]` | 止まる・書かない |
  | 数が違う、`{"A":[...]}`、`[{"title":..,"ja":[..]}]`、`no json`、終了コード 1 | 止まる・書かない |
  | `[["", "い"]]`（空の訳） | **通って書く**。`apply` の `not all(ja)` で止まる |

- 空の訳は `run` なら `apply` で止まるので `index.html` は守られるが、`translate` 単体では
  成功扱いで WORK.json に空文字を書く。TODO の完了条件（数が合わないとき何も書かない）には
  反しないので、`translate` 側でも空を弾くかは判断が要る
- 前置き・後書きによる取りこぼしは、下の 5 のとおり子の `claude` に利用者全体の設定や
  プラグインが載ると起きやすくなる（実害は未確認）

### 4. `notes.py:280-284` と `SKILL.md:41` `check` が失敗しても `apply` の書き換えは残る

- 問題: `run` は `apply` で `index.html` と `last-source.json` を書いてから `check` する。
  `check` が落ちても書き換えは残り、`last-source.json` が今回の英語になっているので、
  もう一度 `run` すると `fetch` が「変更なし」で終わる。戻すには `git checkout` が要る
- 根拠: コードを読んだ（`apply` 211-213 行で書き、`check` 269 行で終了コードを返すだけ）。
  既知のとおり今は `check` が CORS で必ず落ちるので、`run` は毎回「書き換えたうえで
  終了コード 1」になる
- `SKILL.md:41`「どの段も、失敗すると何も書かずにエラーで止まる」は段ごとには正しいが、
  `run` の通しでは誤解を招く。`check` が落ちたときの戻し方を 1 行書くかどうか

### 5. `notes.py:150-152` 子の `claude -p` が引き継ぐもの（未確認）

- 空のディレクトリで起動しても避けられるのはプロジェクトの `CLAUDE.md` とフックだけで、
  コメントの範囲どおり。ただし次は載る（どれも実害は未確認）
  - 利用者全体の `~/.claude/CLAUDE.md`、プラグイン、ユーザー設定のフック
    （ponytail の SessionStart は「コードの後に短い説明」を指示する。3 の後書きの原因になりうる）
  - skill から（Claude Code の中から）呼ぶと、環境変数 `CLAUDECODE=1`、
    `CLAUDE_CODE_CHILD_SESSION=1`、`CLAUDE_CODE_MESSAGING_SOCKET`、`CLAUDE_CODE_PLUGIN_DIRS`
    などをそのまま渡す（この担当の環境で `env` を見て確認）。入れ子の起動を拒まれるか、
    `mods/` の Mod が子を担当として扱うかは確かめていない
  - 起動のたびに `~/.claude/projects/-tmp-tmpXXXXXXXX` ができる可能性がある（同じ形の
    ディレクトリが既に複数あるのは見たが、どこから作られたかは未確認）
- verifier の `run --by claude` を Claude Code の Bash から流せば、入れ子の起動が通るかは
  分かる。外から叩く主な使い方と、skill から呼ぶ使い方は条件が違う点を依頼に書くとよい

## 好みの範囲

### 6. 文書の細かな食い違い

- `SKILL.md:32` は google の注意を「『です・ます』調や識別子の大文字小文字は保証しない」、
  `TODO.md:33` は「『です・ます』調と製品名をそのまま残すことは保証しない」。どちらかに揃える
- `README.md:21` の CHANGELOG の行は「リリースノートと同じく `/update-release-notes` で行う」
  のままで、20 行目に足した `notes.py run` に触れていない（「同じく」で読めなくはない）
- `SKILL.md` に、skill から流すとき `claude -p` が最大 900 秒かかりうる（Bash ツールの
  既定は 120 秒）ことの注意が無い。自動でバックグラウンドに回るので止まりはしない

## 作り込みすぎ

- `notes.py:125-126`: shrink: 1 か所でしか使わない `plain`。175 行で `unmd(s).replace('`', '')` に、-3 行
- `notes.py:138`: delete: `by_google` だけの形の検査。`translate` の 171 行へ `str` の検査を移す（2 と同じ）、-2 行
- `notes.py:272-294`: shrink: `run` / `translate` は `args`、`fetch` / `apply` / `check` は
  `sys.argv` を見ていて揃っていない。1 の `argparse` にするなら一緒に解消する

net: -5 lines possible.

## 指摘なし

- 訳し方の決まりは `RULES` 1 か所だけ。`SKILL.md` の旧「2. 訳す」の箇条は消えて参照に変わった
- `by_google` は 1 件でも通信・JSON・形で失敗すると、書く前に `sys.exit` する
- `run` は `fetch` が 0 件なら後段を呼ばない（実測）
- 範囲外の変更は無い。`fetch` は表示の文言と `return todo` だけの変更
- テスト: このプロジェクトに単体テストは無く、項目の方針で verifier の実測に任せている
