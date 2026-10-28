# TODO-041 implementer の報告

## 実装の前に確かめたこと

- GitHub のリリース日時: `curl https://api.github.com/repos/anthropics/claude-code/releases?per_page=5` が取れた（認証なし。`x-ratelimit-limit: 60`/時）。`v2.1.312` → `published_at` `2026-10-27T20:24:20Z`。CHANGELOG の見出し `## 2.1.312` と `v` + 版で突き合わせられる。→ 採用。取れなければ、前に埋め込んだ日時、無ければ取得した日時
- CachyOS の RSS（`cachyos.org/rss.xml`）の各 item に `pubDate` がある（`Sun, 09 Aug 2026 17:46:32 GMT`）。→ 採用
- Claude Platform の見出しは日付だけ（時刻なし）

## 変更

- `index.html`: ブラウザでの取得（`fetchNhkNews`・`fetchClaudeNews`・`refreshNews`・`fetchText`・`toIsoDate`・`parseSections`・`stripMarkdown`・`CLAUDE_CODE_URL`）と alert、ボタン「ニュース更新」（`#btn-fetch-news`、CSS、アイコン）を削除。`formatAt`・`atLabel` を足し、選択欄の各行（Platform・Claude Code 英語/日本語・CachyOS 英語/日本語）の末尾に ` (10/28 05:24)` を出す。NHK のまとめの行（`(6本・10/28 22:22)`）はそのまま。`pubDate` が無い・読めないデータは日時を出さない
  - `FALLBACK_CLAUDE_CODE` はオブジェクトから 1 件の配列に変えた（`block()` が配列を読むため。const 名は同じ）。使う側は `[0]`
- `notes.py`: `pubDate` の取得（Platform は見出しの日付、Claude Code は GitHub のリリース日時、CachyOS は RSS、NHK は従来どおり。読めなければ前の日時 → 取得日時）。英語版の Claude Code（最新 1 版）を `FALLBACK_CLAUDE_CODE` に埋め込む。`apply` は訳が無い日も流し、変わったか（True/False）を返し、`run` は `apply | nhk` が変えたときだけ `check`。`check` は選択欄の各行を日時つきで突き合わせ、NHK のまとめの行・英語版の本文・ブラウザが外へ通信しないことも確かめる（api.rss2json.com を数えない例外は削除）。`last-source.json` は変わらない
- `update-notes.sh`: 始めに fetch（`githooks/sync-state.sh`、20 秒の上限）。master でない／未 push／分岐 → `見送り: …` を出して 0 で終了。遅れていれば `merge --ff-only`。fetch 失敗は 1。push は `git push origin $(git rev-parse HEAD):refs/heads/master`。配信日時だけが変わった日のコミットメッセージは `記事の日時を …`
- 新規: `githooks/sync-state.sh`（遅れ・先行の件数）、`githooks/pre-commit`（遅れていれば警告、常に 0）、`.claude/hooks/session-sync.sh` と `.claude/settings.json`（SessionStart。出力は `systemMessage` と `additionalContext`）
- 文書: `README.md`（ニュース・日時・cron と開発・`core.hooksPath` の節）、`SKILL.md`、`docs/update-release-notes.md`（見送り・日時の取り方・3 時間ごと・check の項目）、`CLAUDE.md`「守ること」
- `TODO.md`: 6 項目のうち crontab 以外の 5 つにチェック
- データ: `notes.py run` を実際に流したので、`index.html` に各記事の `pubDate`・英語版・NHK の最新 6 件（2026-10-29 01:44 時点）が入っている

## 確かめた結果

- `notes.py check`: `OK: 選択欄・日時・訳の表示・まとめ・外への通信なし・コンソール`（rc=0）。`notes.py run` を 2 回: 1 回目は書き換えて OK、2 回目は「変更なし」（再実行で差分が出ない）
- Playwright（`archives/agents/TODO-041/check-display.mjs`）: 代表行
  - `📰 NHK主要ニュースまとめ (6本・10/29 01:44)`
  - `・2026年10月23日の更新 (10/23)`
  - `・Claude Code 2.1.312（英語） (10/28 05:24)` / `・Claude Code 2.1.312（日本語） (10/28 05:24)`
  - `・CachyOS August 2026 Release（英語） (8/10 02:46)` / `（日本語）` も同じ
  - JS の例外 0、ダイアログ 0、外への通信 0、`#btn-fetch-news` なし
- `update-notes.sh`（一時ディレクトリの bare を origin にした clone。`sync-test.sh` はスクラッチパッド。NHK を古くしてから流し、commit・push が起きる形）:
  - 同じ: commit・push（origin == clone HEAD、親は元の先頭）。exit 0
  - 先: `見送り: …未 push のコミットがある（遅れ 0、先行 1）`、origin・HEAD 変わらず。exit 0
  - 遅れ: ff-only で取り込み、commit・push（origin == clone HEAD、親は他者の commit）。exit 0
  - 分岐: `見送り: …分岐している（遅れ 1、先行 1）`、変わらず。exit 0
  - 追加: master でない → 見送り・exit 0、fetch できない → exit 1
- hooks（一時 clone）: 遅れ → pre-commit が警告し commit は通る（rc 0）。SessionStart は遅れ／先／分岐で文言が出て、同じ・fetch 失敗では出力なし（rc 0）。`.claude/settings.json` は JSON として読める
- 足した検証が、外すと落ちること:
  - `atLabel` を `return ''` にすると `notes.py check` が選択欄の不一致で落ちる
  - 起動時に `fetch('https://example.com/')` を足すと `check` が「ブラウザが外へ取りに行った」で落ちる
  - `update-notes.sh` の `(( ahead > 0 ))` を `> 99` にすると、先の場合（2）に push までされ、分岐の場合（4）は `git merge --ff-only` で失敗（exit 128）。元に戻すと見送りになる
- GitHub のリリース日時が取れない場合: `get` を差し替えて `parse_code` が `['', '', '']` を返し、ログに理由を出して続くこと（fetch で前の日時 → 取得日時になる）

## 判断が要る点

1. **NHK の選択欄は、今までどおりまとめ 1 行のまま**にした（`(6本・日時)`）。依頼の例 `・スペイン 列車どうしの衝突事故… (10/28 23:50)` は NHK の個別記事の行に見えるが、選択欄に個別記事は無い（TODO-010 で、短いのでまとめだけにした）。個別行を足すなら TODO-010 の設計を変えることになり、「NHK のまとめの行は保つ」とも合わせて決まらないので足していない
2. **ボタン「ニュース更新」を削除した**。ブラウザで取得をやめるとやることが無くなるため（依頼に明記は無い）。戻すなら、ページの再読み込みにするなどの別の動きを決める必要がある
3. Claude Platform の行は日付だけ（`・2026年10月23日の更新 (10/23)`）。見出しの日付と重なるが、配信日時として取れるのが見出しの日付だけだったため。取得日時にする案もある（その日の最初の取得時刻になるので、配信日時としては不正確）

## 範囲外・残る懸念

- 配信日時だけが変わった初回（今回のコミットの後、cron の最初の回）は、`update-notes.sh` の判定で `CLAUDE_NOTES: 変更なし` の行が出ないため、メッセージは `リリースノートと CHANGELOG と CachyOS ブログの訳を …` になる。実際の訳は変えていない（一度だけ）。今回の `index.html` に `pubDate` を埋め込み済みなので、通常は起きない
- 開発しているマシンで cron が走ると、未 push の commit がある間は見送られる（意図どおり）。この clone は `core.hooksPath` を設定していない（マシンごとの設定）
- `FALLBACK_CLAUDE_CODE` の名前は「取得できないとき用」でなくなったが、const 名は変えない指示のためそのまま（コメントは書き直した）
- GitHub API は認証なしで 1 時間 60 回まで。3 時間ごとなら足りる
- 本物の `update-notes.sh` は流していない。本物の origin へは push していない

## 直し（利用者の答えに沿って）

- NHK: まとめの行の下に、記事ごとの行 `・見出し (10/28 23:50)` を足した（`index.html` の `applyNewsData`、値は `news-N`、RSS の順）。選ぶとその記事（見出し＋要約）だけが練習文になる。日時が無いデータは日時を付けない（`atLabel`）
- Claude Platform: 選択欄の行から日時を外した（`・2026年10月23日の更新`）。データの `pubDate` は残してある（選択欄では使わない）
- 「ニュース更新」ボタンの削除は、そのまま
- `notes.py check`: Platform は日時なしの行、NHK は記事ごとの行を RSS の順に日時つきで突き合わせ、`news-0` を選んで本文が出ることも見る
- 文書: `README.md`、`docs/update-release-notes.md` の NHK・Platform の記述と check の項目を直した

### 確かめた結果

- `notes.py check`: `OK`（rc=0）
- Playwright（`archives/agents/TODO-041/check-nhk-rows.mjs`）: NHK の行は `news-summary  📰 NHK主要ニュースまとめ (6本・10/29 01:44)` の下に `news-0`〜`news-5` が `・【地震情報】千葉県北東部で震度5弱 津波の心配なし (10/29 01:00)` のように並ぶ。`claude-0` は `・2026年10月23日の更新`。`news-2` を選ぶと、その記事の本文が出て、ほかの記事の本文・まとめの印（【ニュース1】）は出ない。JS の例外 0、ダイアログ 0
- 足した検証が、外すと落ちること: 記事ごとの行を作る `appendChild` を無効にすると、`check` が落ちる（node の例外で異常終了）

## レビュー後の直し

reviewer の指摘（`reviewer-report.md`）と、利用者の決定に沿って直した。

- 要修正 1（push の範囲）: `update-notes.sh` を、始めの判定（master でない・未 push・分岐は見送り。fetch 失敗は 1）のあと、`origin/master` から `mktemp -d` の下に作った一時的な worktree（`git worktree add --detach`）の中で notes.py の実行・戻す処理・`google,claude` の流し直し・NHK だけの更新・commit・push を行う形にした。手元の作業ツリーと master には触れない。push は worktree の commit の SHA。終わり（EXIT trap）に `git worktree remove --force` と `prune`、そのあと、手元が master・`git diff --quiet HEAD`（未コミットの変更なし）・手元 HEAD が push した SHA（または見送り時は fetch した origin/master）の祖先、のときだけ `git merge --ff-only`。できなければ `手元に取り込まなかった: …` をログに出すだけ。「commit していない変更がある」の確認は、worktree が clean なので不要になり消した（検討 4 はこれで解消）。`update-notes.sh:74` のコメントも実際の条件に直した（検討 5）。見送りの文言は `見送り: 未 push のコミットがある（origin/master より遅れ 0、先行 1）`（好みの指摘）
- 要修正 2: `index.html` の `PRESETS[0]` の説明を「CHANGELOG の英語版と NHK ニュースも内蔵していて、内蔵のデータは 3 時間ごとに更新されます。」にした
- hook: `sync-state.sh` の fetch の上限を 5 秒（起動・commit とも）。`.claude/settings.json` の SessionStart に `matcher: "startup|clear"`（compact・resume では動かない）。時間切れ・失敗は何も出さず 0
- 検討 6: GitHub の応答が `null`・書式違い・版なし・JSON の形違いのとき、`parse_code` が `''` にし、`fetch` が前の日時か取得日時にする。ほかの更新は止めない
- 検討 7: NHK は同じ見出しを 1 本にまとめ（最初の記事を残す）、重複を除いて最新 6 本にする
- 検討 8: 試すスクリプトを `archives/agents/TODO-041/update-notes-test.sh` に置いた（作業ツリーの今の内容を一時 clone に重ね、本物の origin には push しない）
- 文書: README・`docs/update-release-notes.md`（worktree、手元に取り込まなかった行、push が落ちたら捨てられて次の回が流し直す、GitHub、NHK の重複）・CLAUDE.md を直した

### 確かめた結果

- `update-notes-test.sh`（実行結果）: 1 同じ（push、origin==手元 HEAD、親は元の先頭、exit 0）／2 先・4 分岐・5 master でない（`見送り: …`、origin・HEAD 変わらず、exit 0）／3 遅れ（親が他者の commit、origin==手元 HEAD）／6 fetch できない（exit 1）／**7 notes.py の実行中に手元の master へ commit（`during`）: origin に `during` が無く、origin の親は元の先頭、手元に `during` が残り、`手元に取り込まなかった: 手元の master に commit が増えていて、早送りできない`、exit 0**／8 手元に commit していない変更: push され、手元は取り込まず README の変更が残る。どの場合も worktree は 1 個（残らない）
- ケース 7 は、直す前の `update-notes.sh`（`git show HEAD:update-notes.sh`）に差し替えると、origin に `during` が入って落ちる（`origin に during が無い: no`）
- 単体: NHK の RSS を差し替えて `AABCDEFGH` → `ABCDEF`。GitHub の応答を `null`・`{"x":1}`・`"bad"` に差し替えても `parse_code` は `['', '', '']` を返して落ちない
- `notes.py check`: `OK`（rc=0）。表示は前の確認から変わらないので Playwright は測り直していない

### 残る懸念

- worktree と trap の中身は、cron の実機では確かめていない（一時 clone でのみ）。`kill -9` などで trap が走らなかったときは、`/tmp` に worktree が残り、`.git/worktrees` にも記録が残る（次の `git worktree prune` で消える。`update-notes.sh` は流す前に prune していない）
