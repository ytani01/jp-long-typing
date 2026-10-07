# CLAUDE.md（jp-long-typing）

日本語長文タイピング練習アプリ。`index.html` 1 ファイルで動き、
外部ライブラリもビルド工程も無い。概要は `README.md`。

## 守ること

- **`index.html` 1 ファイルのまま保つ。** JS・CSS を別ファイルに分けない。
  外部ライブラリ・CDN を足さない（音も Web Audio API で作っている）
- NHK ニュースの取得に失敗しても、内蔵のフォールバック（`FALLBACK_NHK_NEWS`）で
  動くようにする
- Claude Platform リリースノートはブラウザで取得しない。`update-release-notes`
  skill で訳して `CLAUDE_NOTES` に埋め込む（TODO-017）
- Claude Code の CHANGELOG の日本語版も同じ skill で訳して `CLAUDE_CODE_JA` に
  埋め込む。英語版はこれまでどおりブラウザで取得する（TODO-020）

## 確認の手順

- ブラウザでの確認は **`node` から Playwright を使う**（Playwright 1.63 と
  Chromium は導入済み）。playwright MCP はこのプロジェクトでは使わない
  （`.claude/settings.local.json` で無効にしてある）
- ページは `python3 -m http.server 8080` で配信して `http://localhost:8080/` を開く
- IME の変換は Playwright では再現できない。確定後の文字の入力は
  `page.keyboard.insertText()` で代える
