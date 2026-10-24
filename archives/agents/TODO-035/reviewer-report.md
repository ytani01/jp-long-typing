# TODO-035 reviewer の報告

対象: 未コミットの `git diff`（`notes.py`、`docs/update-release-notes.md`、`update-notes.sh`、`TODO.md`）。

要修正: 0 件。検討: 4 件。好みの範囲: 1 件。

## 問題なし（1 行ずつ）

- 訳し直しの分岐: google が `sys.exit` → claude で訳して書く、最後の 1 つの失敗は `SystemExit` のまま上がる（終了コード 1、メッセージも従来どおり）。関数を差し替えて実測した
- 前の失敗の途中で書かない: `attempt` は戻り値を返すだけで、`work.json` を書くのはループを抜けた後。google 失敗・両方失敗・最後が失敗のどれでも `work.json` は書き換わらなかった（実測）。`index.html` は `apply` まで届かない
- `--by` 省略・`--by claude` 単独: 既定 `['claude']` で 1 周だけ回り、出力・挙動は従来と同じ（argparse は文字列でない既定値に `type` を掛けない）
- 不正な値: `''`、`google,`、`Google` は argparse のエラーで止まる（実測）
- crontab の行: `%` は無い。`$HOME` は cron の `/bin/sh` で展開される。`{ ...; } >> log 2>&1` で `date` と本体の標準出力・標準エラーがどちらもログへ行く。`~/tmp` は在る。cronie は動いている
- cron と同じ環境（`env -i HOME=... PATH=/usr/bin:/bin` の上で行の `PATH=...;` を実行）で、`claude`・`node`・`python3`・`git`・`curl`・`ssh` が見つかり、`#!/usr/bin/env python3` の `sys.executable` も `/usr/bin/python3` になった（実測）
- 文書の `update-notes.sh google,claude` と `notes.py run [--by claude|google[,...]]` は実装と合っている
- テスト: このリポジトリにテストの仕組みは無く、分岐は verifier が差し替えで測る分担。足りている

## 検討

### 1. `docs/update-release-notes.md`（cron の節）/ push が失敗した日の扱いが書かれていない

- 何が: `update-notes.sh` は `git commit` の後に `git push` する。push だけ落ちる（6 時に回線や GitHub が落ちている）と、commit はローカルに残る。次の日は `git diff --quiet HEAD` を通るので止まらないが、その日が「変更なし」だと `git diff --quiet ... && exit 0` で push まで行かずに終わる。push されないまま、次に変更がある日まで残る
- 根拠: `update-notes.sh:11`、`:21`、`:28` を読んだ。実際の push の失敗は試していない（未確認）
- 文書の cron の節の最後の注意は `check` で落ちたときの話だけ。push の失敗にも 1 行あると足りる（ログに `git push` のエラーが出るので、見たら手で push する、など）。挙動を変えるかは範囲外なので報告だけ

### 2. `notes.py:3-9`（docstring）と `docs/update-release-notes.md:61` / 使い方の行が古い

- 何が: docstring の `run [--by claude|google]`、`translate [--by claude|google]` と、文書の段の表の `translate [--by claude\|google] 作業用.json` が並べる書き方になっていない。docstring は `usage=__doc__` で `--help` やエラーの表示にそのまま出る
- 根拠: 差分で直したのは docstring の 3 行目と文書の 43 行目だけ。`rg -n -e 'claude\|google'` で残りを確かめた
- あわせて `docs/update-release-notes.md:15`「`--by claude` で訳すときは `claude` コマンド」は、`google,claude` でも（落ちたときに）要る。cron の例は `google,claude` なので、cron の節の 1 つ目の注意で `claude` を PATH に入れる理由には書いてある。直すかは好み寄り

### 3. `docs/update-release-notes.md`（cron の節、1 つ目の注意）/「mise で入れた `python3`」は実態と違う

- 何が: mise には python の global の版が設定されておらず（`mise ERROR No version is set for shim: python3`）、mise の shim は `/usr/bin/python3` に落ちて動いている。対話のシェルでも `python3` は `/usr/bin/python3`。`/usr/bin/node`（v26.11.1）もあり、mise の shims を足して変わるのは `node` が mise の v26.12.1 になることだけ
- 根拠: 実測。cron と同じ環境で `python3` は 3.14.8（`/usr/bin/python3`）、`node` は shim 経由で v26.12.1
- 動きはするので、文書の言い方を「mise で入れた `node`」にするか、shims を外して `/usr/bin` のものを使うか。どちらにするかは判断が要る（Playwright がどちらの node で動くかは測っていない。未確認）

### 4. `notes.py:183-191` / claude を先に並べたとき、claude のタイムアウトでは次へ移らない

- 何が: 訳し直しは `SystemExit` だけを拾う。`by_claude` の `subprocess.run(..., timeout=900)` の `TimeoutExpired` と、`claude` が PATH に無いときの `FileNotFoundError` はそのまま上がる。`--by claude,google` では google へ移らない
- 根拠: 差し替えで実測（`claude,google` で claude が `TimeoutExpired` → そのまま上がり、`work.json` は書かれない）
- 文書と cron の例は `google,claude` の順で、google 側の失敗（curl の失敗、JSON でない応答、形の違い）はすべて `SystemExit` になるので、例の使い方では起きない。文書の「前のもので訳すのに失敗したとき」は順を問わない書き方なので、気にするなら文書か実装のどちらかで揃える。実害は未確認

## 好みの範囲

### 5. `docs/update-release-notes.md:89` / crontab の行の `PATH=...;` は、cron が PATH を環境に入れていることに頼っている

- `export` が無いので、`PATH` が元々環境に無いと子プロセスに渡らない。cronie は `PATH=/usr/bin:/bin` を環境に入れるので実際の cron では問題ない
- verifier への注意: `env -i HOME=$HOME /bin/sh -c 'PATH=...; ...'` のように **`env -i` で PATH を渡さずに**試すと、`PATH` が export されず、`/usr/bin/env python3` で起動した Python の `sys.executable` が空になり、`check` の `http.server` 起動が `PermissionError: ''` で落ちる（実測）。cron の再現には `env -i HOME=$HOME PATH=/usr/bin:/bin ...` と PATH を渡すこと。偽の失敗なので、文書を直す理由にはならない

## 作り込みすぎ

作り込みすぎ: なし（`attempt`・`by_list`・ループはそれぞれ 1 か所で要るだけの大きさ。Lean already. Ship.）

## 範囲

`TODO.md` の項目が「`update-notes.sh` に足す」から「`notes.py` の `--by` を並べる」に変わり、crontab の項目が文書の項目にまとめられている。依頼の目的と合っており、指示に無い変更は無い。

---

# 2 回目（作りを `update-notes.sh` のループに変えた後）

対象: `git diff`（`update-notes.sh`、`docs/update-release-notes.md`、`TODO.md`）。`notes.py` は差分なし。

要修正: 0 件。検討: 2 件。好みの範囲: 1 件。前回の 1〜5 は解消した（3・4 は `notes.py` を戻したので消え、`notes.py run [--by claude|google]` の表記も実装と合う）。

分岐は、偽の `notes.py`（`--by` ごとに成功・変更なし・translate で失敗・`index.html` と `last-source.json` に書いてから失敗、を切り替える）を使い、remote の無い使い捨てのリポジトリで実測した。push は remote が無いので必ず落ちる。

## 問題なし（1 行ずつ）

- `set -e` と `cmd | tee "$log" && break`: `&&` の左が落ちても `set -e` では止まらず、`pipefail` で `notes.py` の失敗が拾われて次へ進む（実測）
- google が check で失敗 → 戻す → claude 成功: commit されたのは claude の分だけ（2 行の追加。google の書いた分は残らない）（実測）
- google が translate で失敗・claude が check で失敗、両方 check で失敗、`claude` 単独で check で失敗: どれも `index.html` と `last-source.json` は HEAD に戻り、exit 1、commit なし（実測）
- google が「変更なし」: claude は流れず exit 0（実測）
- `tee "$log"` は毎回上書きなので、commit のメッセージを決める `grep` は最後に成功した run の出力を見る
- `exit 1` でも `trap ... EXIT` が働き、一時ファイルは消える
- crontab の行は `export PATH=...` になり、PATH が環境に無いときも子プロセスに渡る。前回の 5（`env -i` で PATH を渡さないと偽の失敗が出る）もこれで起きない
- 文書の「mise で入れた `node`」、push だけ落ちた日の注意は実態と合う
- 作り込みすぎ: なし（ループ 6 行、`IFS=, read -ra` で分けるだけ。Lean already. Ship.）
- 範囲: 指示に無い変更なし

## 検討

### 6. `update-notes.sh:23` / 戻す元が HEAD でなく index なので、冒頭の確認をすり抜ける状態がある

- 何が: 冒頭の確認は `git diff --quiet HEAD`（作業ツリーと HEAD の比較）で、戻す処理は `git checkout -- files`（index から戻す）。`index.html` に変更を `git add` した後、作業ツリーだけ HEAD に戻した状態（`MM`）だと、冒頭の確認は通り、失敗して戻した後の作業ツリーに **stage してあった内容が書き出される**
- 根拠: 実測。上の状態で両方 translate で失敗させると、終わった後の `index.html` の末尾が stage した行になり、状態が `M ` になった
- 普段の使い方（cron、手で add しない）では起きない。HEAD に揃えるなら `git checkout HEAD -- "${files[@]}"`（stage も HEAD に戻す）か、冒頭で `git diff --cached --quiet` も見る。直すかは判断が要る

### 7. `docs/update-release-notes.md`「使い方」の 2 つ目の注意と「失敗したとき」の節 / 戻すのが並べたときだけに読める

- 何が: 「`google,claude` のように `,` で並べると、…戻し、…最後のものも落ちたら、戻してから止まる」は、並べたときだけ戻すように読める。実装は `./update-notes.sh`（`claude` 1 つ）でも、落ちたら戻して exit 1（実測）。cron の節の「`run` が落ちたときは戻してから止まる」は並べ方を問わない書き方で、2 か所の書き方が揃っていない
- 「失敗したとき」の節の「`run` で `check` が落ちたときは、`apply` が書いた…が残る。やり直すなら戻してから流す」は `notes.py run` の話としては正しいが、`update-notes.sh` を使う人には当てはまらない。「使い方」の 1 つ目の注意は `notes.py run` と書き分けたのに、こちらは `run` のまま
- 直すなら、「使い方」で「`run` が落ちたら、`index.html` と `last-source.json` を戻して止まる。並べると次で流し直す」のように 1 つで書くか、「失敗したとき」の bullet の頭を「`notes.py run` で…」にして、`update-notes.sh` は自分で戻すと 1 行足す

## 好みの範囲

### 8. `update-notes.sh:9` / 綴りを間違えても、毎日後ろのもので通ってしまう

- `gogle,claude` のように前の名前を間違えると、`notes.py` の argparse が exit 2 で落ち、戻して claude で流し直すので、cron は毎日成功する（ログには argparse のエラーが残る）。偽のスクリプトでの実測なので、argparse のエラーで次へ移るところは読んで確かめただけ（未確認）。cron の例は正しい綴りなので実害は小さい

## 補足

前回の確認で `notes.py` を import した際に、`.claude/skills/update-release-notes/__pycache__/` を作ってしまっていた（未追跡）。この確認の担当が作ったものなので消した。

---

# 3 回目（訳し方の名前を先に確かめる処理）

対象: `update-notes.sh` の差分のうち、名前を確かめる処理（9〜13 行）と、空の要素を渡したときの挙動だけ。
9〜13 行を `set -euo pipefail` 付きで切り出して実測した（bash 5.3.20）。

要修正: 0 件。検討: 0 件。好みの範囲: 2 件。

## 問題なし（1 行ずつ）

- `,claude`、`,`、`,,`、`google,,claude`: 空の要素があると「訳し方は claude か google: 」（コロンの後が空）で exit 1。冒頭の未 commit の確認より前なので、何も書かない（実測）
- 引数なし・`''`: `${1:-claude}` で `claude` 1 つ（実測）
- `google,claude`: `(google claude)`。` google`（前に空白）は弾く（実測）
- 書き方: `[[ ... ]] || { echo ...; exit 1; }` をループで回すだけで足りている。コメントも「なぜ」を書いている。作り込みすぎ: なし

## 好みの範囲

### 9. `update-notes.sh:9` / 末尾の `,` は黙って捨てられる

- `google,` は `read -ra` が末尾の空の要素を作らないので `(google)` になり、エラーにならずに google だけで流れる（実測）。`,claude` は弾くので、前後で扱いが揃っていない。意図どおり 1 つで流れるだけなので実害は無い
- 同じく `read` は 1 行目しか読まないので、改行を含む引数（`$'google\nclaude'`）は `(google)` になる（実測）。手で打つ引数ではまず起きない

### 10. `update-notes.sh:12` / 名前の一覧が `notes.py` の `choices` と 2 か所になる

- `notes.py` の `--by` の `choices=['claude', 'google']` と同じ一覧を持つので、訳し方を足すときは両方を直す必要がある。コメントに理由があり、今は 2 つだけなので、そのままでよい
