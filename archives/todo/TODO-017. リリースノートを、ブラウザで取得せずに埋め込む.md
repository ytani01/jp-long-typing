# TODO-017. リリースノートを、ブラウザで取得せずに埋め込む

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high、2 回）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 68 | 17,068 | 78,761 | 2,348,464 | 73% |
| reviewer | Opus 5.5 | high | 32 | 152 | 117,222 | 570,784 | 21% |
| verifier | Sonnet 5.5 | medium | 18 | 98 | 28,541 | 186,971 | 6% |
| 合計 |  |  | 118 | 17,318 | 224,524 | 3,106,219 | 計 3,348,179 |

- 立ててから着手まで別の項目（TODO-018、TODO-019）を挟んだので、`--since '2026-10-08 04:03:00'` で集計した
- reviewer と verifier は定義（`~/.claude/agents/`）のモデル・effort と同じ値を Agent ツールでも指定した
- サブエージェントの output は少なめに出ている（`token-usage.py` の既知の制約）

## きっかけ

Claude Platform リリースノートは CORS ヘッダーを返さないので
`api.allorigins.win` を中継にしていた。2026-10-08 に allorigins が 500 や
タイムアウトを返し、「Claudeニュースの取得に失敗した」の alert が出た。
代わりの中継も使えなかった（`api.codetabs.com` は 503、`corsproxy.io` は 401）。

着手時に確かめると、日本語版は 9 月 28 日までで、英語版（10 月 8 日まで）より
10 日ほど遅れていた。利用者と決めたこと:

- リリースノートは skill で取得・翻訳・埋め込みし、コミットと push で反映する
- 英語版から訳す。埋め込むのは新しい 3 日分
- 「ニュース更新」ボタンは残す（CHANGELOG と NHK の更新に使う）。
  更新の後は CHANGELOG を開く（レビューの指摘を受けて決めた）
- 既定の練習文「日本語長文タイピングの特徴」の記述もこの項目で直す
- skill での定期のデータ更新は、TODO 項目を立てず、確認の担当も分けない

## やったこと

- `index.html`: `CLAUDE_NOTES_URL`（allorigins 経由）を消し、
  `FALLBACK_CLAUDE_NOTES` を `CLAUDE_NOTES` に改めて常に使う。
  `fetchClaudeNews` は CHANGELOG だけを取る。「ニュース更新」の後は
  CHANGELOG を開き、失敗の alert は「Claude Code CHANGELOG」と出す。
  既定の練習文の説明を直した
- `CLAUDE_NOTES` を英語版の 10/8・10/7・10/6 の訳に差し替えた
  （10/7 は見出しが 5 つあり、1 日分にまとめた）
- `.claude/skills/update-release-notes/SKILL.md` を作った
- `README.md` と `CLAUDE.md` の記述を直した

## 確かめたこと

- reviewer: 1 回目で要修正 1 件（既定の練習文の記述）と検討 5 件。
  反映後の 2 回目は問題なし。訳は英語原文と突き合わせて欠け・取り違えなし
  （`archives/agents/TODO-017/reviewer-report.md`）
- verifier: Playwright で 7 項目を実測し、すべて意図どおり。
  allorigins・platform.claude.com へのリクエストは 0 件、
  CHANGELOG の取得を失敗させると alert が出て内蔵のデータのまま
  （`archives/agents/TODO-017/verifier-report.md`）

## 分担の振り返り

- reviewer は、既定の練習文に古い説明が残っていること、まとめの差し替えが
  何も変えていない（まとめに CHANGELOG が入らない）ことを見つけた。
  どちらも利用者の判断を挟んで直した。verifier は食い違いを見つけなかった
  （alert の空白の違いは依頼文の書き方の差）
- 見込みとの食い違いは reviewer の 2 回目だけ。指摘で挙動が変わったため
- 次に同じ規模でやるなら、着手前に既定の練習文（`PRESETS`）の記述も
  `rg` の対象に入れておく。そうすれば 2 回目のレビューが要らなかった
