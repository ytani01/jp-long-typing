# TODO-014. お手本の英字の文字間隔を詰め、ロゴをモノクロにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ verifier（Sonnet 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 12 | 3,204 | 8,935 | 765,176 | 85% |
| verifier | Sonnet 5.5 | medium | 12 | 367 | 26,564 | 114,403 | 15% |
| 合計 |  |  | 24 | 3,571 | 35,499 | 879,579 | 計 918,673 |

- TODO-012〜014 を 1 つのコミットで立てたので、`--since '2026-10-08 02:41:54'`（TODO-013 を決着させたコミットの時刻）で集計した

## きっかけ

UI のレビュー（2026-10-08）で出た案。お手本の `letter-spacing` で英字がばらけて（「C l a u d e」）読みにくく、ロゴの ⌨️ だけ TODO-011 のモノクロのアイコンと揃っていなかった。

## やったこと

`index.html` のみ。

- 英数字（`isWordSide` が真）の span に、`renderText` でインラインの `letter-spacing: 0` を付けた。`updateCharClasses` が className を丸ごと書き換えるので、class ではなくインラインの style にした
- ロゴを、キーボードの形のインラインの SVG にした（色は `--accent-color`）

## 確かめたこと

verifier が Playwright で、英字と日本語の span の letter-spacing、`.word` にまとめない 21 字を超える英単語、入力して class が変わった後の letter-spacing、ロゴの色と大きさを測った。すべて一致した。
詳細は [archives/agents/TODO-014/](../agents/TODO-014/README.md)。

## 残ること

- 等幅のフォントなので、英字の字間は文字間隔を 0 にしてもそれなりに空いて見える
- お手本の文字は 1 字ずつ inline-block なので、行頭に「。」や「、」が来ることがある（禁則処理が効かない）。この項目の前からあった

## 分担の振り返り

- **verifier**: 指示した項目はすべて一致した。新しい食い違いは見つけていない。等幅フォントで字間が空いて見える点を挙げた
- **見込みとの食い違い**: 無い
- **次に同じ規模なら**: 同じ組み方でよい。CSS と表示だけの変更なので、確かめる項目を 5 つに絞った依頼で足りた
