# TODO-020 の分担

- main: 実装（訳の埋め込みと選択欄の 2 行、文書の修正だけなので分けなかった）
- reviewer: 訳と原文の突き合わせ、選択欄の value の分岐、文書と実装の食い違いを見るため。分岐が増える項目なので入れた → [reviewer-report.md](reviewer-report.md)
- verifier: Playwright での実測 → [verifier-report.md](verifier-report.md)、スクリプトは [verify.mjs](verify.mjs)

reviewer を先に回した。検討 4 件・好みの範囲 2 件をすべて直してから（日本語版の title に「（日本語）」を付ける、skill の片方だけ更新するときの扱い、訳 3 か所、README の行の順）、verifier に回した。
