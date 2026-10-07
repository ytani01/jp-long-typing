# TODO-021 の分担

- main: 実装（`index.html` 1 ファイルの中の記録・集計・表示と README なので分けなかった）
- reviewer: 記録する位置（改行の読み飛ばし、誤りが残ったままの入力）、0 除算、履歴の大きさ、アドバイスの文と実際の挙動の食い違いを見るため。分岐と条件式が増える項目なので入れた → [reviewer-report.md](reviewer-report.md)
- verifier: Playwright での実測 → [verifier-report.md](verifier-report.md)、スクリプトは [verify.mjs](verify.mjs)、画面は [history.png](history.png)

reviewer を先に回し、要修正 1 件・検討 8 件・好みの範囲を直してから verifier に回した。verifier の報告の 2 点（前の 5 回の CPM が 0 のときの文、詰まった語の重複）を直し、同じ verifier にスクリプトを走らせ直してもらった。
