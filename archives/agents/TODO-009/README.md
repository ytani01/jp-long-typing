# TODO-009 の分担

- **main**: 実装。HTML と CSS が中心で、JS の変更は数行なので分けなかった
- **reviewer（Opus 5.5 / high）**: 選択欄の移動とカスタム文章の処理で JS の分岐が変わったので入れた。報告は [reviewer-report.md](reviewer-report.md)
- **verifier（Sonnet 5.5 / medium）**: Playwright で表示と動作を測った。報告は [verifier-report.md](verifier-report.md)。スクリプトは `verify.mjs`（1 回目・2 回目）、`verify2.mjs`（375 幅の再確認）

項目の記録は [archives/todo/TODO-009](../../todo/TODO-009.%20練習文の選択欄をタイトルの位置へ移し、計測の始まりを入力欄に書く.md)。
