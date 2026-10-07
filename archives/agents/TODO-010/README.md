# TODO-010 の分担

- **main**: 本文を取れるソースの実測と実装。`index.html` の 1 ファイルで規模が小さいので分けなかった。測定の結果は [main-measurement.md](main-measurement.md)
- **reviewer（Opus 5.5 / high）**: 取得した文の加工（途切れの扱い）と選択欄の作り方が変わるので入れた。報告は [reviewer-report.md](reviewer-report.md)
- **verifier（Sonnet 5.5 / medium）**: Playwright で rss2json の応答を差し替え、途切れの 4 形・取得失敗・まとめの差し替えを測った。報告は [verifier-report.md](verifier-report.md)、スクリプトは `verify.js`
- `wikipedia-*` は、一度実装して捨てた Wikipedia「最近の出来事」案のレビューと確認

項目の記録は [archives/todo/TODO-010](../../todo/TODO-010.%20NHK%20ニュースの個別記事の本文を長くする.md)。
