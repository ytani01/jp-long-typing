---
name: update-release-notes
description: Claude Platform リリースノートの新しい 3 日分と、Claude Code の CHANGELOG の最新 3 版を curl で取得し、日本語に訳して index.html の CLAUDE_NOTES と CLAUDE_CODE_JA に埋め込む。CachyOS ブログの最新 3 件も英語・日本語で埋め込む（`CACHYOS_EN`・`CACHYOS_JA`）。リリースノートや CHANGELOG の練習文を新しくしたいとき、利用者の /update-release-notes で使う（引数 google で Google 翻訳を使う）。
---

# リリースノートの埋め込み

ブラウザでは何も取得しない。この手順（普段は cron の `update-notes.sh`）で
`index.html` の `CLAUDE_NOTES` を書き換え、コミットと push で反映する（TODO-017、TODO-041）。

Claude Code の CHANGELOG は、日本語版を訳して `CLAUDE_CODE_JA` に、最新版の英語（先頭 8 項目）を `FALLBACK_CLAUDE_CODE` に埋め込む（TODO-020、TODO-041）。
各記事には配信日時 `pubDate` も埋め込む。選択欄の各行に出る（Claude Code の版の日時は GitHub のリリース日時）。

CachyOS ブログ（RSS の最新 3 件）は、本文を英語のまま `CACHYOS_EN`、訳を `CACHYOS_JA` に埋め込む（TODO-037）。

内蔵の NHK ニュース（RSS の最新 6 件）は、訳さずに、配信日時（`pubDate`）と一緒に `FALLBACK_NHK_NEWS` へ埋め込む。`run` が一緒に更新する。単独では `notes.py nhk`（TODO-039）。

訳と埋め込みだけの定期のデータ更新なので、TODO 項目は立てず、確認の
担当も分けない。`run` の中の `check` の結果を main が見てコミットする。

取得から確認までを `notes.py run` が続けて行う（TODO-031、TODO-032）。この skill はそれを呼ぶだけにする。
使い方・各段の中身・失敗したときの戻し方は [docs/update-release-notes.md](../../../docs/update-release-notes.md) にある（TODO-033）。

1. 作業用の JSON はスクラッチパッドに置き、`notes.py run` を流す。skill の引数が `google` なら `--by google`、
   無ければ `--by claude` にする

   ```bash
   .claude/skills/update-release-notes/notes.py run [--by claude|google] <スクラッチパッド>/work.json
   ```

2. `git status` で `index.html` に差分が無ければ終える。ログの「変更なし」は訳の分だけの話で、その後に NHK ニュースの行（`最新 6 件に更新した` か `変更なし`）が続くので、最後まで読む。ログに「取得できず更新しなかった」の行が出たら、どれが取れなかったかを利用者に知らせる。`check` が `OK` 以外で終わったら、文書の「失敗したとき」を見る
3. 文書の「終わったら」のメッセージでコミットする。push は利用者が行う（`update-notes.sh` は origin と比べてから自分の commit だけを push する。文書の「cron で 3 時間ごとに流す」）
