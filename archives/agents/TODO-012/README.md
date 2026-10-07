# TODO-012 の分担

- **main**: 実装。`index.html` の 1 ファイルで規模が小さいので分けなかった
- **reviewer（Opus 5.5 / high）**: 誤入力の印の付け外しで分岐が変わるので入れた。報告は [reviewer-report.md](reviewer-report.md)、スクリプトは `reviewer-measure.mjs`
- **verifier（Sonnet 5.5 / medium）**: Playwright で印の付け外し、placeholder の幅、統計の端の位置を測った。報告は [verifier-report.md](verifier-report.md)、スクリプトは `verify.js`

項目の記録は [archives/todo/TODO-012](../../todo/TODO-012.%20入力中の画面を見やすくする（誤入力の表示・入力目安・操作の説明・統計の位置）.md)。
