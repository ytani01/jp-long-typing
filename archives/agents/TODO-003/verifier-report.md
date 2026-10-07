# TODO-003 verifier 報告

手段: `python3 -m http.server 8765`（PID 40807 を確かめて kill 済み）+ Playwright headless Chromium 1280x800。
スクリプト: `archives/agents/TODO-003/verify.mjs`（`node verify.mjs 8765`、終了コード 0）。コードは変更していない。

変更ファイル: `git status` は TODO.md、index.html（変更）、CLAUDE.md、archives/agents/（未追跡）。`git diff index.html` は `loadArticle()` の `cleanText` 1 か所のみ。指示の範囲内。

1. カスタム文章: 一致。入力 `ＡＢＣ　ｘｙｚ １２３\r\nNew York。\r単独 行\n「全角！？」＄ 末尾`
   -> `cleanText` = `"ABCxyz123\nNewYork。\n単独行\n「全角！？」＄\n末尾"`（33 字）。
   表示「文字数: 33字」、`char-total-count` も 33。空白・全角英数・`\r` は残っていない。記号は不変。
2. プリセット（走れメロス）: 一致。490 字、表示も 490。空白・全角英数字なし。
3. 打鍵: 一致。`ABC` で idx 3・ミス 0。`xyz` + 全角 `１` で idx 6・ミス 1（全角はミス）。半角 `1` で idx 7。
   残りを `insertText` で 1 文字ずつ打ち、idx 33/33、`isFinished` true、result-modal 表示。
4. コンソールエラー・pageerror: 無し（`[]`）。

確かめられなかったこと・判断が要る点: 無し。
補足（実害の確認なし）: `fetchNhkNews` はネットワーク取得を行うが、エラーは出ていない。ニュース記事の変換は未測定（同じ `loadArticle()` を通る）。
