# TODO-041 確認報告（verifier）

対象: HEAD `980ce3e`。作業ツリーは `archives/agents/TODO-041/reviewer-report.md` 以外に変更なし（確認で作ったファイルのみ未追跡）。

使ったスクリプト（同じディレクトリ）:
- `update-notes-test.sh`（指示どおりそのまま。出力は `update-notes-test.out`。一時ディレクトリは既定で `/tmp` 下に作られる）
- `verifier-display.mjs`（Playwright、`node` から実行）
- `verifier-hook-test.sh`（pre-commit と SessionStart の確認。一時ディレクトリ）

## 1. update-notes.sh の判定（食い違い 0）

| ケース | 結果 | 確かめた値 |
|---|---|---|
| 1 同じ | commit・push、手元も早送り | origin の親 = 前の tip、origin = 手元 HEAD。worktree 1（残らず） |
| 2 先（未 push） | 見送り。`見送り: 未 push のコミットがある（origin/master より遅れ 0、先行 1）` | origin・HEAD とも不変 |
| 3 遅れ | 取り込んで commit・push（`other 3` の上に載る） | origin の親 = other 3、origin = 手元 HEAD。worktree 1 |
| 4 分岐 | 見送り。`分岐している（遅れ 1、先行 1）` | origin・HEAD とも不変 |
| 5 master でない | 見送り。`master でない（feat）` | origin 不変 |
| 6 fetch できない | `origin を fetch できなかった`、exit=1 | push なし |
| 7 notes.py 実行中に手元へ commit | 手元の `during` は残り、origin には来ない | 手元 HEAD `0a63457` (during)。origin へは `3d03e48..23cc640` の push（worktree の commit）。`0a63457` は origin の object に無い（`cat-file -e` が失敗）。origin の親 = 前の tip。手元の master には取り込まず `手元に取り込まなかった: 手元の master に commit が増えていて、早送りできない` |
| 8 手元に未 commit の変更 | push はされ、手元は取り込まない | origin の親 = 前の tip。手元に ` M README.md` が残る。`手元に取り込まなかった: commit していない変更がある`。worktree 1 |

ケース 2・4・5 の `見送り` と、ケース 7・8 の `手元に取り込まなかった` は、ログに出ることを確認した。

## 2. 表示（食い違い 0）

`verifier-display.mjs` で `http://localhost:8080/` を開いて読み出した（確認後、http server は止めた）。

| 項目 | 測った値 | 期待 | 判定 |
|---|---|---|---|
| NHK まとめ | `📰 NHK主要ニュースまとめ (6本・10/29 01:44)` | `(N本・M/D HH:MM)` | 合う |
| NHK 記事ごとの先頭 | `・【地震情報】千葉県北東部で震度5弱 津波の心配なし (10/29 01:00)` | 末尾 `(M/D HH:MM)` | 合う |
| Claude Code（英語） | `・Claude Code 2.1.312（英語） (10/28 05:24)` | 末尾 `(M/D HH:MM)` | 合う |
| Claude Code（日本語） | `・Claude Code 2.1.312（日本語） (10/28 05:24)` | 同上 | 合う |
| CachyOS（英語） | `・CachyOS August 2026 Release（英語） (8/10 02:46)` | 同上 | 合う |
| CachyOS（日本語） | `・CachyOS August 2026 Release（日本語） (8/10 02:46)` | 同上 | 合う |
| Claude Platform | `・2026年10月23日の更新` | 日付なし | 合う |
| Claude まとめ | `🤖 Claudeニュースまとめ (3本)` | 日時なし | 合う |

- JS の例外（pageerror・console の error）: 0 件
- alert（dialog）: 0 件
- ブラウザ外への通信（localhost 以外の request）: 0 件。rss2json・api.github.com・raw.githubusercontent.com いずれも 0
- 「更新」を含むボタン: 0 件（`ニュース更新` は無い）

## 3. 記事ごとの練習文（食い違い 0）

`news-0` を選ぶと、`app.fullText` が `FALLBACK_NHK_NEWS[0].text.trim()` と完全に一致（85 字 = 85 字）。`app.article.title` は `【地震情報】千葉県北東部で震度5弱 津波の心配なし`、`author` は `NHKニュース`、`isSummary` は false。表示の先頭は `【地震情報】千葉県北東部で震度5弱津波の心配なし。 29日午`。
まとめ（`news-summary`）では、全 6 記事の本文の先頭 20 字がすべて `fullText` に入り、長さは 706 字。

## 4. hook（食い違い 0）

- `.claude/settings.json`: SessionStart の matcher は `startup|clear`。hook の timeout は 10（秒）。
- pre-commit（`githooks/pre-commit`）は `githooks/sync-state.sh` を呼ぶ。`sync-state.sh` は `timeout "${FETCH_TIMEOUT:-5}" git fetch` で上限 5 秒。SessionStart（`.claude/hooks/session-sync.sh`）も同じ `sync-state.sh` を使う。

一時 clone（`core.hooksPath githooks`、origin は一時 bare）での結果:

| ケース | 結果 |
|---|---|
| A 遅れで commit | 警告 `警告: origin/master より 1 件遅れている…` が出る。commit は exit 0 で通る |
| B SessionStart、遅れ + 先行 | 「先に git pull する」と「未 push のコミットが 1 件…見送られる」の両方の JSON |
| C 先行のみで commit | pre-commit は何も出さず commit exit 0。SessionStart は「未 push…見送られる」のみ |
| D 同じ状態 | SessionStart は何も出さない（exit 0） |
| E fetch できない | commit exit 0。警告なし。SessionStart も何も出さない |
| F 届かない先への fetch | `sync-state exit=1`、経過 5.00 秒（上限どおり） |

本物のリポジトリでは `git config --get core.hooksPath` が未設定だった（確認用の clone でだけ設定した）。pre-commit はこの作業ツリーでは動かない。README の手順（`git config core.hooksPath githooks`）を流した clone でだけ効く。これは仕様どおりで、食い違いではない。

## 確かめられなかったこと・判断できなかったこと

- 本物の `update-notes.sh`、本物の origin への push、cron の実行は、指示どおり行っていない。
- ネットワークの実環境（RSS・GitHub）への通信は、`notes.py` の実行を含めて test の範囲で行われた。内容の正しさ（訳の質）は見ていない。
- 「未 push 4 件」（SessionStart の知らせ）は、この作業ツリーの実際の状態として出たもの。確認の対象外だが、push されるまで cron の更新は見送られる（設計どおり）。
- 実害の有無は未確認。判断は管理者に任せる。判断が要る点は無い。
