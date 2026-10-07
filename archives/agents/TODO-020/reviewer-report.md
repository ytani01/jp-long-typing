# TODO-020 reviewer 報告

対象: 未コミットの差分（`index.html`、`.claude/skills/update-release-notes/SKILL.md`、
`README.md`、`CLAUDE.md`、`TODO.md`）。訳は
`scratchpad/cl/CHANGELOG.md` の 2.1.293〜2.1.291 の先頭 8 項目と突き合わせた。
ブラウザでの実測はしていない（verifier の担当）。

## 要修正

なし。

## 検討

1. **`.claude/skills/update-release-notes/SKILL.md:44-50` / 片方だけ変わらないときの終え方があいまい**
   - 「今の `CLAUDE_NOTES` と同じ 3 日分で…何も変えずに終える」と「今の `CLAUDE_CODE_JA` と
     同じ 3 版なら、何も変えずに終える」が並んでいる。冒頭（:12-14）で「1〜4 を両方で行い、
     5 と 6 は 1 回にまとめる」としたので、片方だけ変わらないときに「終える」が skill 全体を
     終えるのか、その片方を飛ばすのかが読み取れない。リリースノートを先に処理すると、
     変わっていなければ CHANGELOG を見ずに終わる読み方ができる
   - あわせて、6 のコミットメッセージ（:97）が「リリースノートと CHANGELOG の訳を…更新する」
     に固定されたので、片方だけ更新したときの書き方が無い
   - 根拠: 文書を読んだ範囲。実際にこの読み違いが起きるかは未確認
   - 小さい点: リリースノート側は「中身も変わっていなければ」と内容の変化も見るが、
     CHANGELOG 側は「同じ 3 版なら」で、最新版に項目が書き足されたときの扱いが違う。
     意図した違いかは未確認

2. **`index.html:1757`（既存の行）と `index.html:860,865,870` / 履歴で英語版と日本語版が見分けられない**
   - 履歴は `this.article.title` を保存する（TODO-018）。日本語版の `title` は
     `"Claude Code 2.1.293"` で、取得した英語版の `title`（`Claude Code ${heading}`、:1334）と
     同じ版なら同じ文字列になる。「（英語）」「（日本語）」は選択欄のラベルにだけ付く（:1353-1354）
   - CPM は英語と日本語で大きく違うので、履歴の一覧で同じ題名の行が混ざると比べにくい
   - 根拠: 読んだコード。skill の 3（:64-65）も `title` を `"Claude Code 2.1.293"` と
     決めているので、変えるなら skill も対で直すことになる。実害は未確認

3. **`index.html:860` の 3 項目め / 訳が直訳で分かりにくい**
   - 原文: `false` lists the tool's schema in the prompt from the start instead of behind tool search
   - 訳: 「ツールのスキーマをtool searchの後ろではなく、最初からプロンプトに載せます」
   - 「behind tool search」は「tool search で探すまで出さない」の意味で、「後ろ」では
     位置の話に読める。skill の 3「自然な日本語」（:69）に照らすと直したほうがよい
     （例:「tool searchで探されるまで隠さず、最初からプロンプトに載せます」）

4. **`index.html:865` の 6 項目め / 「実行と番号付きで」が不自然**
   - 原文: Added workflow agents to the `agent.spawn` mod hook, with their run and index, so a mod can refuse them
   - 訳: 「agent.spawnのmodフックに、ワークフローのエージェントを実行と番号付きで渡すようにしました。」
   - 「実行と番号付きで」は日本語として切れ目が分かりにくい
     （例:「ワークフローのエージェントも、その実行と番号を添えて渡すようにしました」）。
     意味は合っている

## 好みの範囲

1. **`index.html:860` の 4 項目め / 主語が無く、誰の操作か読み取りにくい**
   - 「コンテキストの圧縮の直前に自分が行った操作を…」。原文は Claude が主語なので、
     文頭に「Claudeが」を足すと利用者の操作と読み違えない。意味は合っている

2. **`README.md:15` / 参照の順番**
   - 新しい行が「リリースノートと同じく `/update-release-notes` で行う」と書くが、
     リリースノートの埋め込みの説明はその次の行（:16）に出てくる。行を入れ替えると
     先に出たものを参照する形になる

## 作り込みすぎ

作り込みすぎ: なし（`code-ja-` の分岐は 1 行、選択欄の追加も既存の `opts` に 1 行足しただけ）。
Lean already. Ship.

## 問題なしの点

- 訳の意味: 2.1.293・2.1.292 の各 8 項目、2.1.291 の 2 項目すべて原文と意味が合う（上の 3・4・好み 1 は表現の問題）
- 項目数: 3 版とも原文の先頭からの 8 項目（2.1.291 は 2 項目しかない）で、`parseSections(..., 1, 8)` と同じ上限
- skill の 3 の規則: です・ます調、識別子・製品名は訳さない、バッククォートを外す、`$0.10/$0.50` は原文のまま、`<source>` `←` `~` は原文にあるものだけ
- `bindEvents` の分岐: `code-ja-` は `claude-` で始まらないので既存の `claude-` 系の分岐と重ならず、末尾の `PRESETS` の分岐より前にある
- `applyClaudeData`: `fetchClaudeNews` 後の再構築でも `code-ja-N` が作り直されるので、`prevValue` による選択の復元が効く
- まとめ: `loadClaudeSummary` は `this.claudeNotes` だけを使うので、日本語版は入らない
- `refreshNews` が `claude-code` に切り替える動きは変わっていない
- `PRESETS[0]` の説明: 「リリースノートと CHANGELOG の最新 3 版は内蔵、CHANGELOG の英語版と NHK は取得」が実装と合う
- `CLAUDE.md` の追記: 実装と合い、TODO 番号で参照している
- `index.html` 冒頭のコメント（:833-834）と `CLAUDE_CODE_JA` の上のコメントが skill の 4 の「（YYYY-MM-DD 時点の内容…）」の形に合う
- skill の 1・4・5 の CHANGELOG の手順は書いたとおりに追える（curl の URL は `CLAUDE_CODE_URL` と同じ）
- 範囲: 指示に無い変更は無い（`TODO.md` はチェックを入れただけ）
- `index.html` 1 ファイルのまま、外部ライブラリの追加も無い
