# TODO-004 の分担

| 担当 | 範囲 | 理由 |
|------|------|------|
| main | 実装 | 1 ファイルの小さな変更で、実装まで分けるほどではない |
| reviewer | 差分のレビュー | 起動時の取得後に差し替える条件、`applyNewsData()` で選択を戻す分岐が変わるため |
| verifier | Playwright での実測 | 既定値・プリセット・差し替えの条件を実際に動かして確かめる |

reviewer を先に、verifier を後に回す。

- [reviewer-report.md](reviewer-report.md)
- [verifier-report.md](verifier-report.md)
