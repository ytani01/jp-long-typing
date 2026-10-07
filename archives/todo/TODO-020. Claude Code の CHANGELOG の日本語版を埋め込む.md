# TODO-020. Claude Code の CHANGELOG の日本語版を埋め込む

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 54 | 17,108 | 74,321 | 1,889,906 | 69% |
| reviewer | Opus 5.5 | high | 24 | 2,816 | 54,729 | 421,317 | 17% |
| verifier | Sonnet 5.5 | medium | 30 | 156 | 34,730 | 391,839 | 15% |
| 合計 |  |  | 108 | 20,080 | 163,780 | 2,703,062 | 計 2,887,030 |

- reviewer と verifier は、Agent ツールでモデルと effort を見込みどおりに指定した
- 集計の範囲には、途中で利用者が実行した `/update-release-notes`（取得して比べただけで、変更なし）の分も入っている

## きっかけ

Claude ニュースの Claude Code の CHANGELOG は英語版しか無かった。日本語でも
練習できるよう、訳を埋め込む。利用者と決めたこと: 英語版は残す / 日本語版は
最新 3 版 / 「Claudeニュースまとめ」には含めない。

## やったこと

- `index.html`: `CLAUDE_CODE_JA` を足し、2.1.293〜2.1.291 の先頭 8 項目（英語版の取得と同じ上限）の訳を埋め込んだ。`title` は履歴で英語版と見分けられるよう「Claude Code 2.1.293（日本語）」の形にした
- `index.html`: `applyClaudeData` で英語版の後に value `code-ja-N` の option を 3 つ足し、`bindEvents` に選んだときの分岐を足した。このアプリの特徴の文章（`PRESETS[0]`）と、CLAUDE NEWS のコメントを直した
- `update-release-notes` skill: CHANGELOG の取得・選び方・訳の形・書き換え・確かめ方を足し、片方だけ変わらないときは片方を飛ばすこと、片方だけ更新したときのコミットメッセージを書いた
- `README.md`、`CLAUDE.md`: 日本語版を埋め込んでいること、更新の手順を書いた

## 確かめたこと

- reviewer: 18 項目の訳を原文と突き合わせ、分岐とまとめへの干渉、文書と実装の食い違いを見た。要修正 0 件、検討 4 件・好みの範囲 2 件で、すべて直した（[reviewer-report.md](../agents/TODO-020/reviewer-report.md)）
- verifier: Playwright で、起動直後と英語版の取得後の option の並び、`code-ja-0` の本文と作者表示、まとめに訳が入らないこと、全文を入力したあとの履歴の題名が「Claude Code 2.1.293（日本語）」になること、pageerror が 0 件であることを実測した。食い違いなし（[verifier-report.md](../agents/TODO-020/verifier-report.md)）

## 分担の振り返り

- reviewer は、履歴の `title` が英語版と同じになる点と、skill の「何も変えずに終える」の読み違いを見つけた。どちらも実装した main は気づいていなかった。訳の直訳 2 か所も拾った。verifier は食い違いを見つけなかったが、履歴の題名を実測で確かめたのは reviewer の指摘を直した後の裏付けになった
- 見込みと食い違わなかった
- 次に同じ規模（データの埋め込みと選択欄の数行）なら同じ組み方にする。verifier の確認項目は 5 つで足りた。reviewer への依頼に「履歴など、title を使う箇所への影響」を最初から書けば、指摘を待たずに実装時に決められる
