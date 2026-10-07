# TODO-015 の分担

- **main**: 実装と、レビューの指摘への対応
- **reviewer（Opus 5.5 / high）**: renderText の分岐が変わるので入れた。報告は [reviewer-report.md](reviewer-report.md)、試したスクリプトは `reviewer-rendertext-check.js`
- **verifier（Sonnet 5.5 / medium）**: reviewer の指摘を直したあとに、Playwright で行頭の文字を 3 幅で測った。報告は [verifier-report.md](verifier-report.md)、スクリプトは `verify-linestart.js`、画像は `shot-1280.png`

項目の記録は [archives/todo/TODO-015](../../todo/TODO-015.%20お手本で行の頭に句読点が来ないようにする.md)。
