# TODO-019 の分担

- main: 実装（index.html と README.md の削除と、value の振り直しだけなので分けなかった）
- reviewer: 選択欄の value と `PRESETS` の添字の対応、「次の文章」の巡回、履歴の保存が添字に依存しないかを見るため。分岐の前提（添字）が変わる項目なので入れた → [reviewer-report.md](reviewer-report.md)
- verifier: Playwright での実測 → [verifier-report.md](verifier-report.md)、スクリプトは [verify.mjs](verify.mjs)

reviewer を先に回し、指摘が無かったので、そのまま verifier に回した。
