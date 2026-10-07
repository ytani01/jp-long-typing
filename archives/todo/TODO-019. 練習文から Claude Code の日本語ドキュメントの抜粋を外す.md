# TODO-019. 練習文から Claude Code の日本語ドキュメントの抜粋を外す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 36 | 4,283 | 46,354 | 1,015,753 | 73% |
| reviewer | Opus 5.5 | high | 14 | 68 | 33,375 | 165,599 | 14% |
| verifier | Sonnet 5.5 | medium | 16 | 105 | 24,381 | 172,312 | 13% |
| 合計 |  |  | 66 | 4,456 | 104,110 | 1,353,664 | 計 1,462,296 |

- reviewer と verifier は、Agent ツールでモデルと effort を見込みどおりに指定した
- 立ててから着手まで TODO-017 の改訂と TODO-018 を挟んだので、`--since` に TODO-018 の決着コミットの時刻を渡して集計した

## きっかけ

練習文に Claude Code の日本語ドキュメントの抜粋（概要、クイックスタート、
一般的なワークフロー）を入れていたが、外すことにした。2026-10-08 に
利用者と決めたこと: 消すのは抜粋 3 本だけ。Claude ニュースの Claude Code の
CHANGELOG（英語）は残す。

## やったこと

- `index.html`: `PRESETS` から抜粋 3 本を消し、選択欄の「Claude Code ドキュメント」の optgroup を消した。文学 3 本の option の value を 4〜6 から 1〜3 に振り直した
- `index.html`: このアプリの特徴の文章（`PRESETS[0]`）と、`PRESETS` の上のコメントから抜粋の記述を消した
- `README.md`: 「長文プリセット内蔵」から抜粋の行を消した

「次の文章」は `% PRESETS.length` で回るのでコードは変えていない。
履歴（TODO-018）は題名を保存していて添字を持たないので、古い履歴にも影響しない。

## 確かめたこと

- reviewer: value と添字の対応、添字に依存する箇所、抜粋への言及の残り、`PRESETS[0]` の文章を確かめ、指摘は 0 件（[reviewer-report.md](../agents/TODO-019/reviewer-report.md)）
- verifier: Playwright で、option の一覧、value 0〜3 を選んだときの作者と本文の冒頭、value 3 の結果画面から「次の文章」で value 0 に戻ること、JS の例外が無いことを実測した。console の error は外部取得の `ERR_HTTP2_PROTOCOL_ERROR` 1 件だけ（[verifier-report.md](../agents/TODO-019/verifier-report.md)）

## 分担の振り返り

- reviewer は指摘 0 件。履歴が添字を保存しないことを確かめたのは、value を振り直す項目では要る点だった。verifier も食い違い 0 件
- 見込みと実施は食い違わなかった
- 次に同じ規模（データの削除と添字の振り直しだけ）なら、reviewer を外し、verifier の依頼に「履歴が添字を持たないこと」の確認を 1 行足せば足りる。reviewer の分（全体の 14%）を減らせる。ただし分岐や保存の形が変わるなら reviewer は残す
