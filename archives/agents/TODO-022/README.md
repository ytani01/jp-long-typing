# TODO-022 の分担

- main: 実装（`index.html` 1 ファイルの HTML・CSS・JS の組み替えで、込み入った設計は無いため）
- reviewer（Opus 5.5 / high）: 挙動（Esc でのリセット、ボタンの文字の扱い）が変わるため → [reviewer-report.md](reviewer-report.md)
- verifier（Sonnet 5.5 / medium）: Playwright での実測。手順が決まっているため → [verifier-report.md](verifier-report.md)、スクリプトは [verify.mjs](verify.mjs)、画面は [narrow.png](narrow.png)

reviewer を先、verifier を後に回した。
