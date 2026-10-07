# TODO-005 の分担

| 担当 | 範囲 | 理由 |
|------|------|------|
| main | 実装 | 1 ファイルの変更で、実装まで分けるほどではない |
| reviewer | 差分のレビュー | 取得・差し替えの条件、失敗時の扱い、空白の詰め方の分岐が変わるため |
| verifier | Playwright での実測 | 外部の応答を route で差し替え、既定・選択欄・失敗時・英文の空白を実際に動かして確かめる |

reviewer を先に、verifier を後に回す。CORS プロキシの実測は auto mode に拒否されたため、利用者が
`!` で実行した（allorigins だけがヘッダーを返したが、本文の途中で接続を切られた。corsproxy.io は 401、
cors.eu.org は 429、codetabs は時間切れ、thingproxy は名前解決できない）。

- [reviewer-report.md](reviewer-report.md)
- [verifier-report.md](verifier-report.md)
