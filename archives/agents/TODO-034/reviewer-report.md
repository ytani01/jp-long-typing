# TODO-034 reviewer の報告

対象: `git diff`（notes.py の CHECK_JS、docs/update-release-notes.md、TODO.md）と新しいファイル `update-notes.sh`。
実行と push はしていない（実測は verifier）。

## 要修正

なし。

## 検討

### 1. update-notes.sh:24 / パイプの先では notes.py の出力が溜まり、訳の間は何も出ない

- 何が: `notes.py run … | tee` で、Python の stdout がブロックバッファになる。`fetch` の
  `new / changed` の一覧も「訳す 件を claude で訳す」も、終わるまで端末に出ない。
  `claude -p` は最大 900 秒待つので、その間は止まって見える。さらに、Python の行は
  `check`（node が直接 fd に書く）の出力の**後に**まとめて出て、順序が逆になる
- 根拠（実測）: `python3 -c 'print("A"); sleep 2; subprocess.run(["echo","B"])' | tee` で、
  1 秒の時点では何も出ず、`B` の後に `A` が出た
- `grep` で見るログの中身は揃うので、commit メッセージの切り替えには影響しない
- 直すなら `PYTHONUNBUFFERED=1`（または `python3 -u` で呼ぶ）の 1 か所

### 2. update-notes.sh:34 / push だけ落ちると、次の実行では push されない

- 何が: commit の後で `git push` が落ちると（通信エラーなど）、`set -e` で止まる。
  `last-source.json` は commit 済みなので、流し直すと `fetch` が「変更なし」で `exit 0` になり、
  未 push の commit が残ったまま黙って終わる
- 根拠: コードを読んだ（26 行目で抜ける）。実害は未確認
- 文書に「push が落ちたら `git push` だけ流す」と 1 行あれば足りる

### 3. update-notes.sh:34 / 関係のない未 push の commit も一緒に push される

- 何が: `git push` は今のブランチをまるごと送る。いまも `master...origin/master [ahead 1]`
  （TODO-034 を立てた commit）で、このまま流すとそれも push される
- 利用者が流すスクリプトなので規約違反ではない。文書に一言あるかどうかの判断。実害は未確認

### 4. docs/update-release-notes.md:25-27, 82-83 / 事前の止まり方が書かれていない

- 何が: スクリプトは `index.html` と `last-source.json` に commit していない変更があると
  止まる（update-notes.sh:16-19）が、文書の説明は「『変更なし』や `check` の失敗のときは
  commit しない」だけ。また、`check` が落ちた後に `./update-notes.sh` を流し直すと、
  「失敗したとき」に書いてある「次の `run` は『変更なし』で終わる」ではなく、この事前の確認で止まる
- 「失敗したとき」の `git checkout …` で戻せば済む点は変わらないので、1 行足す程度

## 好みの範囲

### 5. docs/update-release-notes.md:25-32 / スクリプトの流れの図が無い

- 利用者全体の `CLAUDE.md`（分岐は flowchart を添える）。分岐は「未 commit の変更で止まる /
  変更なし / check 失敗 / commit・push」の 4 つ。既存の図は `run` の 4 段だけ

## 問題なしの観点（1 行ずつ）

- `set -euo pipefail` と `grep -q … && what=…` / `git diff --quiet … && exit 0`: `&&` の左の失敗では `set -e` は止めない。最後のコマンドでもないので終了コードにも出ない
- `| tee`: `pipefail` で notes.py の失敗（`sys.exit`、`check` の `sys.exit(r.returncode)`）がそのまま止まる理由になり、commit に進まない
- 「変更なし」: `fetch` が 0 を返すと `run` は何も書かない → 26 行目で `exit 0`
- 事前の確認: `git diff --quiet HEAD` で index と作業ツリーの両方を見ており、後の 26 行目（作業ツリー対 index）と食い違わない。`last-source.json` は追跡済み（`git ls-files` で確認）
- commit メッセージ: notes.py:115 の `print(f'{CONSTS[kind]}: 変更なし')` が行頭から出るので `^CLAUDE_NOTES: 変更なし` / `^CLAUDE_CODE_JA: 変更なし` と合う。両方出るのは `todo == 0` のときだけで、そのときは 26 行目で抜けるので矛盾しない。文言は文書の「終わったら」と一致
- `git commit -- files`: パス指定は `--only` の扱いで、ほかに stage されたものを巻き込まない
- `mktemp` の空ファイルを WORK.json に渡す: `fetch` は読まずに `write_text` で上書きするだけ。途中で止まっても `trap` で消える
- コンソールの除外: ページ自身の NHK 失敗は `console.warn`（index.html:1591）で元から数えていない。除外は text か location の URL に `api.rss2json.com` を含むものだけで、`pageerror` と他のリソース（raw.githubusercontent.com など）のエラーは今までどおり数える。除外が実際に効くか（Chromium の CORS のメッセージに URL が入るか）は未確認（verifier の実測で）
- SKILL.md は `notes.py run` を呼ぶままで、push は利用者が行うと書いてある。Claude から push しない決まりと合っている
- README.md:20-21 は文書へのリンクだけで、食い違いなし
- コメント: CHECK_JS の除外と update-notes.sh の事前の確認は「なぜ」を書いている
- 範囲: 指示に無い変更は無い

## 作り込みすぎ

- update-notes.sh:L8-13: shrink: 引数の `case`（6 行）。`by=${1:-claude}` の 1 行にし、値の確かめは notes.py の argparse（`choices=['claude', 'google']`、不正なら exit 2）に任せる。重大度は好みの範囲（使い方の文言は argparse のものになる）
- update-notes.sh:L32-33: shrink: `commit -q` と `git log --oneline -1`。`-q` を外せば commit 自身が 1 行目を出す。好みの範囲

net: -6 lines possible.
