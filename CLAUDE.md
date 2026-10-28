# CLAUDE.md（jp-long-typing）

日本語長文タイピング練習アプリ。`index.html` 1 ファイルで動き、
外部ライブラリもビルド工程も無い。概要は `README.md`。

## 守ること

- **`index.html` 1 ファイルのまま保つ。** JS・CSS を別ファイルに分けない。
  外部ライブラリ・CDN を足さない（音も Web Audio API で作っている）
- NHK ニュースは、埋め込んだ `FALLBACK_NHK_NEWS` で動く（ブラウザでは取得しない。TODO-041）
- Claude Platform リリースノートはブラウザで取得しない。`update-release-notes`
  skill で訳して `CLAUDE_NOTES` に埋め込む（TODO-017）
- Claude Code の CHANGELOG の日本語版も同じ skill で訳して `CLAUDE_CODE_JA` に
  埋め込む（TODO-020）。英語版（最新版）も `FALLBACK_CLAUDE_CODE` に埋め込む。
  **ブラウザでは何も取得しない**。rss2json の NHK も GitHub の CHANGELOG も取らず、
  取得失敗の alert も無い（TODO-041）
- CachyOS ブログの最新 3 件も同じ skill で、英語の本文を `CACHYOS_EN`、訳を `CACHYOS_JA` に埋め込む（TODO-037）
- 内蔵の NHK ニュース（`FALLBACK_NHK_NEWS`）も同じ `notes.py` が RSS から取って最新 6 件に書き換える。訳さない（TODO-039）
- 各記事の配信日時（`pubDate`）も埋め込み、選択欄の各行に日本時間で出す（TODO-040、TODO-041）
- `update-notes.sh` は、master でない・未 push・分岐しているときは何もせず終わる。
  更新は origin/master から作った一時的な worktree で行い、手元の作業ツリーと master に触れない。
  push は worktree で作った commit の SHA だけ送る（TODO-041）

## 確認の手順

- ブラウザでの確認は **`node` から Playwright を使う**（Playwright 1.63 と
  Chromium は導入済み）。playwright MCP はこのプロジェクトでは使わない
  （`.claude/settings.local.json` で無効にしてある）
- Playwright は `~/.local/lib/playwright/` に入れてある。探さずに、スクリプトの
  先頭でこう読み込む

  ```js
  import { chromium } from '/home/ytani/.local/lib/playwright/node_modules/playwright/index.mjs';
  ```
- ページは `python3 -m http.server 8080` で配信して `http://localhost:8080/` を開く
- IME の変換は Playwright では再現できない。確定後の文字の入力は
  `page.keyboard.insertText()` で代える
