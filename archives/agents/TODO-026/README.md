# TODO-026 の分担

- main: 実装（`index.html` 1 ファイルの小さな変更なので分けない）
- reviewer（Opus 5.5 / high）: 照合の分岐が変わるので入れた。指摘を直した後、同じ担当に再レビューを頼んだ → `reviewer-report.md`
- verifier（Haiku 5.5 / medium）: reviewer の後に、Playwright で 6 ケースを実測 → `verifier-report.md`、`verify.mjs`、`case2.png`
