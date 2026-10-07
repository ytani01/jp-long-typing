# TODO-017 verifier 報告

実行: `node archives/agents/TODO-017/verify.mjs`（Playwright 1.63.0 Chromium、1280x800、各確認 1 回）。
配信: 8080 には起動前から別の `python3 -m http.server 8080`（PID 456539、cwd は jp-long-typing）が動いていたので、それを使った。自分では起動しておらず、止めていない。コードは変更していない。

| # | 結果 | 測った値 |
|---|------|----------|
| 1 | 一致 | 全リクエスト 3 件。allorigins 0 件、platform.claude.com 0 件、`https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md` 1 件 |
| 2 | 一致 | console の error / warning ともに 0 件 |
| 3 | 一致 | `claude-summary`「🤖 Claudeニュースまとめ (3本)」、「・2026年10月8日の更新」「・2026年10月7日の更新」「・2026年10月6日の更新」、`claude-code`「・Claude Code 2.1.293（英語）」 |
| 4 | 一致 | `#text-display` が「【2026年10月8日の更新】Compliance APIのチャットのエンドポイ…」で始まる。【…】の見出しは 10/8、10/7、10/6 の 3 つ |
| 5 | 一致 | 選択欄の値 `claude-code`。練習文は「Added Claude Haiku 5.5 (claude-haiku-5-5), now the default Haiku model on the Anthropic API — 1M context, $0.10/$0.50 pe…」（英語）。alert は 0 件（取得成功のため） |
| 6 | 文言の空白だけ依頼文と異なる | alert: 「Claude Code CHANGELOGの取得に失敗したため、内蔵のデータか前回取得したデータを使います。」。選択欄の値 `claude-code`。選択欄の表示は「・Claude Code 2.1.292（英語）」、練習文は「Added --marketplace <source> to claude plugin install: …」（英語） |
| 7 | 一致 | 起動直後の練習文（`#text-display`）に「リリースノートは日本語に訳して内蔵しています」を含む |

## 食い違い・補足

- 6: 依頼文は「Claude Code CHANGELOG の取得に…」と空白があるが、実際の alert は「CHANGELOGの取得に…」で空白が無い（index.html 1263 行のテンプレートどおり）。日本語として空白の有無が仕様かどうかは判断しない。実害は未確認。
- 3 と 6 で CHANGELOG のバージョンが違う（取得成功時 2.1.293、失敗時は内蔵の 2.1.292）。取得の成否による想定どおりの差。
- 確かめていないこと: NHK の取得（見なくてよい指定）。
