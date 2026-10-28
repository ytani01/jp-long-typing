# TODO-040 の分担

- implementer（Sonnet 5.5）: `index.html` の日時の表示と `toIsoDate`、`notes.py` の `pubDate` の埋め込み、文書を直した。手順が決まった実装なので Sonnet にした
- reviewer（Opus 5.5）: 日時の解析とタイムゾーン、日時が無いときの表示、TODO-039 の埋め込みの流儀を壊していないかを見る。分岐が変わる項目なので入れた
- verifier（Haiku 5.5）: ブラウザのタイムゾーンを New York にして、内蔵データ・取得の差し替え・日時なしの 3 通りの表示を Playwright で見る
- main: rss2json の実物の `pubDate`（Cloudflare で curl・Playwright は 403）を Claude in Chrome で確かめた

報告: `implementer-report.md`・`implementer-report-2.md`・`reviewer-report.md`・`reviewer-report-2.md`・`verifier-report.md`
