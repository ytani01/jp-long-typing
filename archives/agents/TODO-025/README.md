# TODO-025 の分担

| 担当 | 受け持ち | 理由 |
|------|----------|------|
| main | 実装 | `index.html` 1 ファイルの CSS と 2 つの関数で済む規模 |
| reviewer | 差分のレビュー（2 回） | 入力欄の DOM 上の位置と、今の文字の判定（`activeIndex()`）が変わるため |
| verifier | Playwright での実測（3 回） | 位置の重なりは画面で測らないと分からない |

- [reviewer-report.md](reviewer-report.md)
- [verifier-report.md](verifier-report.md)
- 計測スクリプト: [measure.mjs](measure.mjs)（[smoke.mjs](smoke.mjs) はそのたたき台）
