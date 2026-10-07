# TODO-020 verifier 報告

スクリプト: `archives/agents/TODO-020/verify.mjs`（8080 は既に動いていたものを使用。コードは変更していない）。各項目 1 回。

| # | 確認 | 結果 |
|---|---|---|
| 1a | 起動直後の並び | 一致。まとめ → claude-0..2 → claude-code（英語、この時点では 2.1.292）→ code-ja-0..2 |
| 1b | 取得後（5 秒待ち）の並び | 一致。claude-code が `Claude Code 2.1.293（英語）` に変わり、code-ja-0..2 は `Claude Code 2.1.293 / 2.1.292 / 2.1.291（日本語）` のまま。「（日本語）」の二重なし。選択中の値の保持は見ていない |
| 2 | code-ja-0 の本文 | 一致。先頭 `Claude Haiku 5.5（claude-haiku-5-5）を追加しまし…`。題名表示の要素は画面に無い（`id*=title` は custom-title-input と res-modal-title のみ）。#article-author = `Claude Code CHANGELOG （文字数: 719字）`。CLAUDE_CODE_JA.length = 3、title は `Claude Code 2.1.293（日本語）` / `2.1.292（日本語）` / `2.1.291（日本語）` |
| 3 | まとめに Code の訳が無い | 一致。全 2267 字のうち `Claude Haiku 5.5（claude-haiku-5-5）を追加しました` を含まない（false）、`Claude Code` も含まない（false）。なお `claude-haiku-5-5` 単体は含む（Platform 側のリリースノートの語。実害は未確認） |
| 4 | 全文入力 → 結果画面 → 履歴 | 一致。719/719 文字、モーダル表示、履歴 n=1 の last.title = `Claude Code 2.1.293（日本語）`（timeLimit 0, rank SS, accuracy 100） |
| 5 | pageerror | 0 件。console error（resource 含む）も 0 件 |

## 食い違い・判断できないこと

食い違いなし。

- 補足（スクリプトの話で実装の問題ではない）: 入力文は `#text-display .char` から作る必要がある。空白を除いた textContent だと半角スペースの所で止まる。
- 履歴は新しい localStorage で n=1 のため、「最後の 1 件」の順序（古い履歴がある場合）は見ていない。
