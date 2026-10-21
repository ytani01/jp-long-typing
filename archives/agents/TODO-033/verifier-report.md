# TODO-033 確認報告（verifier）

対象: `docs/update-release-notes.md`（未追跡）。実行は複製 `/tmp/claude-649/-home-ytani-work-jp-long-typing/8a915d7b-dd55-461a-9215-22e0bb4f9c7c/scratchpad/verify33/repo`（本物は未変更。`git status` は着手前と同じ）。

準備: 複製の `last-source.json` の `notes[0].en` 末尾を削除。`$D/bin/update-release-notes` を複製の `notes.py` へ張った（`~/bin` は触っていない）。

## 1. `run --by google`（`/` から）: 不一致あり

- コマンド: `cd / && $D/bin/update-release-notes run --by google $D/w.json` 終了コード 1
- fetch: 6 件すべて `changed`。期待は 1 件（10 月 20 日の更新）。原因は下の A
- translate（google）、apply は完了
- check の出力（終了 1）は CORS の 2 行だけ。既知の NHK 取得失敗で、想定どおり:
  ```
  コンソールのエラー: Access to fetch at 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.nhk.or.jp%2Frss%2Fnews%2Fcat0.xml' from origin 'http://127.0.0.1:38081' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  コンソールのエラー: Failed to load resource: net::ERR_FAILED
  ```
  ほかの失敗行は無し

## 2. 「失敗したとき」の `git checkout`: 不一致あり

- `git checkout index.html .claude/skills/update-release-notes/last-source.json` 終了 0。`git status --short` で `index.html` と複製の `last-source.json` は戻った
- 戻した後、`last-source.json` をもう一度 1 件消し、文書どおりの `update-release-notes fetch $D/w2.json`（symlink 経由）を流すと終了 0 で「変更なし」:
  ```
  same     2026年10月20日の更新（3 項目）
  ...
  CLAUDE_NOTES: 変更なし
  ...
  CLAUDE_CODE_JA: 変更なし
  変更なし
  ```
- 同じ状態で実体のパスから `python3 -I .../notes.py fetch $D/w3.json`（終了 0）を流すと、期待どおり 1 件だけ changed:
  ```
  changed  2026年10月20日の更新（3 項目）
  same     2026年10月15日の更新（4 項目）
  ...
  訳すもの: 1 件
  ```

### A. 原因（実測で再現。コードを読んでの推定を含む）

`notes.py` の `ROOT` は `Path(__file__).resolve()` から作るが、`LAST`（24 行目）は `Path(__file__).with_name('last-source.json')` で、`resolve()` していない。symlink 経由では `LAST` が `~/bin/last-source.json` を指す。実測:

- symlink 経由の `run` の後、`$D/bin/last-source.json`（7361 バイト）が作られた。複製リポジトリの `last-source.json` は 2 件のまま（読まれも書かれもしていない）
- 文書の `ln -s` 手順どおりだと、(a) 毎回全件 changed になる、(b) 状態が `~/bin` 側に溜まり、「終わったら」でコミットする `last-source.json` が古いままになる、(c) 失敗時の `git checkout` では戻らず、次の `run` が「変更なし」で終わる。
- 実環境: `~/bin/update-release-notes` は既に `/home/ytani/work/jp-long-typing/.claude/skills/update-release-notes/notes.py` へ張られている（読み取りのみで確認）。`~/bin/last-source.json` はまだ無い。今の状態で `run` や `fetch` を流すと、同じ問題が起きる。
- 直すかどうかは管理者が決める。直すなら `LAST` も `resolve()` する、または文書と張り方を見直す、の 2 つが考えられる（提案のみ）。

## 3. 「使い方」の表と `--help`: 一致

- `notes.py --help` 終了 0、引数なし 終了 2。どちらも 5 行の使い方（`run` / `fetch` / `translate` / `apply` / `check`）を出す
- 表の書き方（`fetch 作業用.json`、`translate [--by claude|google] 作業用.json`、`apply 作業用.json`、`check`）と一致

## 4. リンク: 一致

- `README.md` の `docs/update-release-notes.md`: 実在（`$D/repo/docs/update-release-notes.md`）
- `.claude/skills/update-release-notes/SKILL.md` の `../../../docs/update-release-notes.md`: 実在

## 5. 読み合わせ（`CHECK_JS` / `GOOGLE_URL` / `RULES` / `by_claude` / `fetch` / `translate`）

一致:
- `claude`（既定）は `claude -p`、`google` は `clients5.google.com/translate_a/t?client=dict-chrome-ex`（文書の表と一致）
- 訳し方の決まりは `RULES` で、`by_claude` だけが `claude -p` に渡す（文書の「claude -p にそのまま渡す」と一致）
- `translate` の数が合わない場合の失敗、`fetch` の「3 つ読めない」の失敗（文書と一致）
- check の 1 番目（コンソールエラー）、2 番目（選択欄の 3 件）、4 番目（まとめに 【タイトル】本文、CHANGELOG 無し）は `CHECK_JS` と一致

食い違い:
- (a) 「check で確かめること」の 3 番目の「・Claude Code 2.1.xxx（英語）」の文言は、`CHECK_JS` が確かめていない（`claude-code` の値で位置を探すだけ）。軽微
- (b) 文書は「コンソールにエラーが無い」と「OK と出れば済み」と書いているが、NHK 取得の CORS エラーは必ず出るので、この条件は今の環境では満たされない（既知）。文書にその注記が無い。文書の「失敗したとき」の説明とも食い違う。実害は、利用者が既知の CORS 失敗を別の失敗と取り違えること（推定）
- (c) 文書の「index.html の場所はスクリプトの置き場所から決まるので、どのディレクトリから呼んでもよい」は `ROOT` について正しい。ただし状態ファイル（A）の場所は symlink で変わることを文書は触れていない

## 確かめられなかったこと / 判断が要る点

- 訳の質、`--by claude`、文章の良し悪しは対象外（依頼どおり）
- `run` の check の OK 側（CORS が無い環境での成功）は確かめていない。NHK の CORS は既知なので、`CHECK_JS` の本体の確かめ方は読み合わせにとどめた
- 判断が要る点: A の原因を直すか、文書の `ln -s` 手順を変えるか。実環境の `~/bin` が既に実物を指しているので、早めに決めたほうがよい

## 追補: LAST の resolve() 修正後の再確認

- `notes.py` 24 行目は `LAST = Path(__file__).resolve().with_name('last-source.json')` になっている（読み取りで確認）
- 複製を作り直し（`\cp -r`）、`last-source.json` の `notes[0].en` 末尾を 1 件削除。`$D/bin` は作り直し、`$D/bin/update-release-notes` を複製の notes.py へ張った
- `cd / && $D/bin/update-release-notes fetch $D/w4.json` 終了 0。changed は 1 件だけ（2026年10月20日の更新、3 項目）。ほかは same、CLAUDE_CODE_JA は「変更なし」
- `$D/bin/last-source.json` は作られていない（`test -e` で確認）
- run・check・ほかの項目は流し直していない
