# TODO-017 reviewer 報告

対象: `git diff`（index.html, README.md, CLAUDE.md, TODO.md）と `.claude/skills/update-release-notes/SKILL.md`。
コードは直していない。英語原文は 2026-10-08 に `curl -sL --max-time 30 .../docs/en/release-notes/overview.md` で取得して突き合わせた。

## 要修正

### 1. index.html:789 / 練習文「このアプリの特徴」がリリースノートも取得すると書いたまま

- 問題: `PRESETS[0]` の本文に「Claude のニュースは Claude Platform のリリースノートと Claude Code の CHANGELOG です。ニュースは起動時と「ニュース更新」で最新のものを取得し、取得できないときは内蔵のデータを使います。」とある。リリースノートはもう取得しないので、実装と食い違う
- 根拠: 読んだコード（`fetchClaudeNews` は CHANGELOG だけを取る）。README.md:14-15 は直してあり、同じ主張の 2 か所目だけが残っている
- 判断が要る点: 直すと起動時の既定の練習文（文字数）が変わる。TODO-017 の項目は「README.md と CLAUDE.md」だけなので、範囲に入れるかは管理者が決める

## 検討

### 2. index.html:1316-1318 / CHANGELOG の取得成功時の「まとめの差し替え」は中身が変わらない

- 問題: `loadClaudeSummary()`（index.html:1345-1346）は `this.claudeNotes` だけで本文を作り、`claudeCode` を含まない。`fetchClaudeNews` は `this.claudeNotes` をそのまま渡すので、`untouched` のときに `loadClaudeSummary()` を呼んでも同じ本文を読み直すだけ
- 根拠: 読んだコード。旧コードではリリースノートが差し替わり得たので意味があった
- 依頼文の「成功時はまとめを開いていれば差し替え」は、今の作りでは何も起きない。CHANGELOG の個別項目（`claude-code`）を開いたままのときに差し替えないのは旧コードから同じ。実害は未確認（読み直しで入力欄の状態が変わる程度）

### 3. index.html:1254-1260 / 「ニュース更新」の後にまとめを出しても、Claude 側は何も変わって見えない

- 問題: `refreshNews` は取得後に必ず `claude-summary` を選んで `loadClaudeSummary()` を出す。まとめは埋め込みのリリースノートだけなので、ボタンを押して変わり得るもの（CHANGELOG・NHK）がまとめに映らない。冒頭のコメント「両方を取り直して Claude ニュースのまとめを出す」も、出すものと取り直すものがずれた
- 根拠: 読んだコード。TODO.md の決定は「ボタンは残す（CHANGELOG と NHK の更新に使う）」まで
- 判断が要る点: 更新後に何を出すか（今のまま / CHANGELOG / NHK まとめ）。実害は未確認

### 4. SKILL.md「2. 新しい 3 日分を選ぶ」/ 箇条書きを `* ` だけと書いている

- 問題: 英語原文の 122 行目（August 27, 2026 の 2 項目目）は `- ` で始まる。同じ見出しの下で `* ` と `- ` が混ざる例が実在する。書いたとおりに `* ` だけ拾うと、その項目を落とす
- 根拠: 実測（`rg -n '^- You can now create' en.md` → 122 行目）。旧コードの `parseSections` は `/^[*-] /` で両方拾っていた
- 今の 3 日分（10/8, 10/7, 10/6）は `* ` だけなので、今回の埋め込みに影響は無い

### 5. SKILL.md「2.」の「中身も変わっていなければ、何も変えずに終える」の判断材料が無い

- 問題: 埋め込みは日本語訳だけで、訳した元の英語を残していない。英語の項目が後から書き換えられたか（リリースノートは同じ日付に追記・改稿されることがある）を、訳文と見比べて判断することになる。日付が同じ 3 日分なら項目数の比較くらいしかできない
- 根拠: 読んだ SKILL.md と index.html。実害は未確認

### 6. SKILL.md「6. コミットする」/ 利用者全体の `CLAUDE.md` の TODO 運用との関係が書かれていない

- 問題: 利用者全体の `CLAUDE.md` は「ソースコードを直す作業は、着手前に TODO.md へ項目を足してから」「コードやファイルを変える項目では確認の担当を必ず別のサブエージェントに分ける」としている。この skill は `index.html` を書き換えて `chore(news)` でコミットする手順で、TODO 項目と確認の担当の扱いに触れていない
- 判断が要る点: 定期のデータ更新を TODO 項目の対象外とするなら、そう SKILL.md（かプロジェクトの CLAUDE.md）に書いておくと、実行のたびに迷わない。対象にするなら手順に足す

## 好みの範囲

- SKILL.md「2.」: 古い項目には入れ子の箇条書き（`  * `）、箇条書きでない段落（699・707 行目）、`\_` のようなエスケープがある。今の 3 日分には無い。日付内の項目の順（原文の上から）も明記していない
- README.md:13 の見出し「Claudeニュース自動取得機能」は、リリースノートが自動取得でなくなったので、見出しと中身が少しずれる

## 問題なしの観点

- fetchClaudeNews の分岐: 失敗（fetch 失敗・HTTP エラー・見出しなし）は `catch` で `this.claudeCode` のまま `false`、成功は `true`。`fetchNhkNews` と同じ形で、旧コードから壊れた分岐は無い
- 起動時: `applyClaudeData(CLAUDE_NOTES, FALLBACK_CLAUDE_CODE)` → `fetchClaudeNews()`。問題なし
- alert の文言（`Claude Code CHANGELOG`）: 実装と合う
- 旧名の取り残し: `rg` の結果は TODO.md（項目の文面と背景）と archives だけ。コードと README・CLAUDE.md には無い
- SKILL.md の置き換え範囲とコメントの形: `const CLAUDE_NOTES = [` 〜 `];`、`（2026-10-08 時点の内容）` とも今の index.html と合う。本文中の `["example.com"]` は文字列の中なので `];` と取り違えない
- 同じ日付の見出しの扱い: 原文は 10/7 が 5 見出し。SKILL.md は日付ごとにまとめる規則で、埋め込みも 10/7 を 1 つにまとめ、7 項目を原文の順で入れている（旧コードの `parseSections(..., '### ', 3, ...)` なら 10/8, 10/7, 10/7 になっていた）
- 訳の突き合わせ: 10/8（1 項目）、10/7（7 項目）、10/6（1 項目）とも欠け・取り違えなし。価格（$0.20 USD → $0.10 USD、0.1 倍 → 0.05 倍）、対応プラットフォーム 5 つ、`allowed_hosts` の一致規則も原文どおり
- CLAUDE.md・TODO.md の記述: 実装と合う。`.claude/skills/...` は gitignore の対象でない（`settings.local.json` だけが対象）ので、README の `/update-release-notes` の案内はコミットすれば成り立つ
- テスト: このリポジトリに自動テストは無く、ブラウザの確認は verifier の担当

## 作り込みすぎ

- index.html:1316-1318: delete: `untouched` の判定と `loadClaudeSummary()` の呼び出し（上の 2）。まとめに CHANGELOG が入らないので、`this.applyClaudeData(this.claudeNotes, code);` の 1 行で足りる（検討）
- index.html:1326-1328: yagni: `applyClaudeData(notes, code)` の `notes` は常に `CLAUDE_NOTES`。`this.claudeNotes` ごと `CLAUDE_NOTES` を直接使えば引数が 1 つ減る。触る箇所が 5 か所ほどに広がるので、今回の範囲で直すほどではない（好みの範囲）

net: -2 lines possible.

---

## 2 回目

対象は前回の指摘を反映した部分だけ（PRESETS[0] の文、refreshNews、fetchClaudeNews、SKILL.md の追記）。コードは直していない。

要修正: なし。検討: なし。

- PRESETS[0]（index.html:789）: 「リリースノートは日本語に訳して内蔵」「CHANGELOG と NHK ニュースは起動時と「ニュース更新」で取得」となり、実装（起動時に `fetchNhkNews` と `fetchClaudeNews`、リリースノートは `CLAUDE_NOTES`）と合う。README.md:14-15 とも食い違いなし
- refreshNews（index.html:1254-1264）: `presetSelect.value = 'claude-code'` のあと `loadArticle(this.claudeCode)` で、選択欄で `claude-code` を選んだときの分岐（index.html:1139-1140）と同じ読み込み方。取得に失敗しても `this.claudeCode` は内蔵か前回の値なので、空にはならない。冒頭のコメントも「CHANGELOG を出す」に直っている
- fetchClaudeNews: `isUntouchedSummary` / `loadClaudeSummary` を外し、成功で `applyClaudeData(this.claudeNotes, code)` して `true`、失敗で `false`。分岐は意図どおり
- 取り残し: `rg -n -e isUntouchedSummary -e loadClaudeSummary -e claude-code index.html` の結果、`isUntouchedSummary` は NHK 側（index.html:1296）だけ、`loadClaudeSummary` は選択欄の分岐（1138）と定義（1343）だけで、不要になった呼び出しは無い
- SKILL.md: 12-13 行目に「TODO 項目は立てず、確認の担当も分けない。「確かめる」を main が行う」と追記されていて、利用者と決めた内容と合う。2. の箇条書きは `* ` か `- ` になっていて、旧 `parseSections` の `/^[*-] /` と同じ
- 作り込みすぎ: なし
