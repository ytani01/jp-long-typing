# TODO-010 verifier 報告

計測: `archives/agents/TODO-010/verify.js`（Playwright 1.63、1280x800）。コードは変更していない。
未コミットの変更は index.html / README.md（指示範囲）。TODO.md と archives/agents/TODO-010/ も変更・未追跡だが、確認対象外。

1. 本物の rss2json（応答 200 を 1 回）: option は `news-summary | 📰 NHK主要ニュースまとめ (6本)` の 1 つだけ。まとめの `fullText` に「…」「...」なし。一致。
   - 参考: ニュース1〜3 は要約が外れて見出しだけ（実データ上「。」の無い要約）。
2. 差し替え a〜d: `fullText` は次のとおりで、すべて期待どおり。一致。
   `"【ニュース1】タイトルa。\n一文目。\n\n【ニュース2】タイトルb。\n\n【ニュース3】タイトルc。\n一文目。\n\n【ニュース4】タイトルd。\n全文です。"`
   option は `(4本)`。
3. rss2json を abort: option は `news-summary | 📰 NHK主要ニュースまとめ (3本)`。まとめは開け、fullText は 331 字（先頭「【ニュース1】国内の大手ビールメーカー4社…」）。pageerror なし。一致。
4. 別の練習文（value `1`）からまとめに戻す: 開けた（「【ニュース1】」を含む内蔵の本文）。応答を 3 秒遅らせ、取得前にまとめを開いて何も打たない状態では、取得後に fullText が差し替わった（上の a〜d の文に変化、select は news-summary のまま）。一致。
   - 打ち始めた後の差し替え防止は指示に無いので未確認。
5. スクリーンショット ~/tmp/playwright-mcp/todo-010.png: 練習文の欄は「📰 NHK主要ニュースまとめ (6本)」で、文字化け・欠けなし。本文の見出し行・要約も正常に表示。

全項目で pageerror なし。食い違いなし。判断が要る点なし（実害は未確認の指摘も無し）。
