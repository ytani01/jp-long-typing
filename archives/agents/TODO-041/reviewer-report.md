# TODO-041 reviewer の報告

範囲: `git diff a65a1f9..HEAD`（`befed7f`・`78a89fa`）。静的に読んだだけで、本物の `update-notes.sh` は流していない。

## 要修正

### 1. `update-notes.sh:24-80` — 判定から push までの間に入った commit・ブランチの切り替えが、そのまま origin/master へ送られる

- master・先行 0 の判定（24-30 行）は始めに 1 回だけ。その後 `notes.py run`（claude の訳なら数分かかる）が終わってから `git commit -- files`（79 行）と `git push origin "$(git rev-parse HEAD):refs/heads/master"`（81 行）を流す
- 途中で利用者が master に commit すると、cron の commit の親がその commit になる。SHA を 1 つ送っても祖先は全部送られるので、作業中の commit が push される。「自分の commit の SHA だけ」にはなっていない
- 途中で別のブランチに切り替えると、cron の commit はそのブランチに載り、そのブランチの中身ごと `refs/heads/master` へ送られる（push の前にブランチを見直していない）
- 根拠: コードを読んだ範囲での推論。実害は未確認。CLAUDE.md の「開発は cron のマシンでする前提」と、回数が 1 日 1 回から 8 回に増えることで、起きやすくなる
- 決まっていること「判定と push の間に commit が入った場合も含む」に当たる

### 2. `index.html:898` — 起動時に出る練習文（`PRESETS[0]`「日本語長文タイピングの特徴」）の説明が古い

- 「CHANGELOG の英語版と NHK ニュースは起動時と「ニュース更新」で最新のものを取得し、取得できないときは内蔵のデータを使います。」とある。ボタンもブラウザでの取得も無くなった
- 起動時に既定で表示される文（README の「起動時の既定」）なので、利用者が最初に見る

## 検討

### 3. `.claude/hooks/session-sync.sh`・`githooks/pre-commit` — 遅い回線だと、起動のたび・commit のたびに最大 20 秒待つ

- `sync-state.sh` の上限は `FETCH_TIMEOUT` の既定 20 秒で、hook からも同じ値で呼んでいる。pre-commit は cron 自身の commit（`update-notes.sh:79`）でも走るので、その回は fetch が 2 回になる
- SessionStart に `matcher` が無いので、startup だけでなく `/clear`・compact・resume のたびにも fetch する
- オフラインですぐ失敗する場合は問題ない。名前解決や ssh が詰まる回線だと 20 秒待つ。SessionStart が起動を止めて待つかは未確認

### 4. `update-notes.sh:29` と `:31-35` — ff-only の取り込みが、手で直した分の確認より先に走る

- 戻す処理（`git checkout HEAD -- …`、43・50 行）は取り込んだ後の HEAD に戻すので、順番は正しい
- ただ、`index.html` に commit していない変更があり、取り込む側も `index.html` を変えていると、`git merge --ff-only` が git のエラー（終了コード 128）で止まり、33 行の「commit していない変更がある」が出ない。取り込む側が触れない場合は、取り込んでから 1 で終わる（作業ツリーが動いた上で止まる）。変更が消えることは無い

### 5. `update-notes.sh:74` — コメント「配信日時だけが変わった日は NHK も訳も無い」が合っていない

- `notes.py fetch`（209-211 行）は、配信日時が前と違えばその種類に「変更なし」を出さない。すると `update-notes.sh:66` がその種類を `what` に足し、メッセージは「CHANGELOG の訳を …」になる。配信日時だけが変わった日に `記事の日時を` は出ない
- `記事の日時` になるのは、どの種類も「変更なし」か「取得できず」なのに差分がある場合だけで、ほぼ起きない（英語版の本文だけがずれていた、など）
- メッセージが実際の変更と合わない（訳は変えていないのに「訳を」）。実装の報告の「残る懸念」の 1 つ目も同じ話で、初回に限らず、配信日時だけが変わった回はいつもそうなる

### 6. `notes.py:109-117` — GitHub の応答が想定と違うと、`run` 全体が落ちる

- `rel.get(f'v{v}', '')` は、`published_at` が `null` なら `None` を返し、`.replace` で `AttributeError` になる。書式が違えば `fromisoformat` が `ValueError` を出す。どちらもループの中で、try（110-113 行）の外
- `fetch` の try（183-190 行）は `CalledProcessError`・`SystemExit` しか捕まえないので、Claude Code だけでなく、リリースノートと CachyOS の更新まで止まる（`update-notes.sh` は NHK だけ更新する側に回る）。「取れなかった分は更新しない」（TODO-037）の範囲が広がる
- 認証なしで `null` が返るか（下書きのリリースは見えないはず）は未確認

### 7. `notes.py:169-170`（`existing`）と `check()` — NHK に同じ見出しが 2 本あると、`check` が必ず落ちる

- `existing` は見出しをキーにした dict なので、同じ見出しが重なると 1 本になる。`check` に渡る `nhk` は 5 件、ページは 6 件になり、「まとめの行が違う」「記事ごとの行が違う」で落ちる。落ちると `update-notes.sh` は全部戻すので、その RSS が続く間は何も更新されない
- 前は `check` が NHK を見ていなかったので、TODO-041 で新しくできた落ち方。NHK の RSS に同じ見出しが並ぶことがあるかは未確認

### 8. `update-notes.sh` の 4 通りを試すスクリプトが残っていない

- 実装の報告では `sync-test.sh` はスクラッチパッドにあり、`archives/agents/TODO-041/` に置かれていない。verifier が 4 通りを試すとき、作り直しになる（CLAUDE.md（全体）「計測スクリプトは 1 本だけ作らせ、`archives/agents/TODO-NNN/` に残して使い回させる」）

## 好みの範囲

- `update-notes.sh:27` — `見送り: origin/master と未 push のコミットがある` は「と」の続きが不自然（「分岐している」の方は自然）。例: `見送り: 未 push のコミットがある（…）`。docs の例（`docs/update-release-notes.md` の「見送った回」）も同じ文

## 問題が無かったところ

- 使われなくなったコード: `fetchText`・`toIsoDate`・`parseSections`・`stripMarkdown`・`refreshNews`・`isUntouchedSummary`・`fetchNhkNews`・`fetchClaudeNews`・`CLAUDE_CODE_URL`・`ICONS.news`・`#btn-fetch-news` とその CSS・`api.rss2json.com` の例外は残っていない（`rg` で確かめた）。`.btn-outline`・`.preset-group` はほかで使っている
- fetch に失敗したときに 1 で終わる扱いは、docs（`docs/update-release-notes.md` の 3 段目の箇条）と合っている。push が落ちたら commit が残り、次から見送られることも docs に書いてある
- `git rev-list --left-right --count origin/master...HEAD` の左右（遅れ・先行）の読み方は正しい
- 「変更なし」の判定（配信日時も比べる）、取得できなかった種類を `apply` が飛ばすこと、NHK だけの更新の流れは保たれている。今の訳を書き換える経路は無い
- `notes.py check` が外への通信を数えるようになり、`atLabel` を外すと落ちることは実装の報告で確かめてある
- 文書（README・SKILL.md・docs・CLAUDE.md）は、上の 2 の `index.html:898` を除き、古い記述が残っていない（`rg` で「ニュース更新」「rss2json」「CORS」「毎日」「オフライン」を見た）

## 作り込みすぎ

- 作り込みすぎ: なし（強いて言えば、`applyClaudeData` の `innerHTML = ''` は「ニュース更新」で何度も呼ぶための作りで、今は 1 回しか呼ばない。害は無いので消さなくてよい）
