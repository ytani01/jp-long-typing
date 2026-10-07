# TODO-006. お手本の改行を画面でも改行にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 38 | 7,321 | 52,776 | 1,061,656 | 75% |
| verifier | Sonnet 5.5 | medium | 14 | 926 | 33,704 | 153,400 | 13% |
| reviewer | Opus 5.5 | high | 14 | 90 | 32,097 | 152,758 | 12% |
| 合計 |  |  | 66 | 8,337 | 118,577 | 1,367,814 | 計 1,494,794 |

- 集計は `--since '2026-10-07 19:46:00'`（立てたのは前のセッション）。main の分には、途中で受けた TODO-007 を立てるやり取りと、TODO.md の完了済みの目次を消した分も入っている
- reviewer・verifier は定義（`~/.claude/agents/`）のモデルと effort のまま

## きっかけ

TODO-005 の確認で見つけた（2026-10-07）。`.char.linebreak` は `inline-block` で幅 0 のため、
`::after` の `"\A"` が span の中で改行するだけで、外の行は改行しなかった。NHK まとめの
`。【ニュース2】` が同じ行に続いていた。

## やったこと

`index.html` だけを変えた。

- `.char.linebreak::after` の規則を消した
- `renderText()` で、改行の span の直後に `<br>` を置くようにした。span は残す
  （`charElements` の添字と、改行の位置での active 表示のため）。`<br>` は `charElements` に入れない

## 確かめたこと

- reviewer: 添字・改行の読み飛ばし・完了判定・スクロールに影響が無いこと、`\n` が `.word` に入る経路が無いことをコードで確かめた（[reviewer-report.md](../agents/TODO-006/reviewer-report.md)）
- verifier: Playwright で、NHK まとめ（改行 4 か所）と英文の CHANGELOG（自前の Markdown、改行 2 か所）の改行の前後の位置を測り、どれも次の行の行頭に出た。改行を挟んだ入力で `currentIndex` が改行を飛ばして進み、active が次の行に移った。改行の前後のスクリーンショットで、カーソルの枠の欠けは無かった（[verifier-report.md](../agents/TODO-006/verifier-report.md)）

## 残ること

- 画面の折り返しと改行が重なる位置と、1280 以外の画面幅は測っていない
- `.char.linebreak` の `width: 0` と `margin-right: 0.1em` は `::after` のころの名残かもしれない。見た目に問題が無いので残した

## 分担の振り返り

- reviewer は要修正なし。名残の CSS と、改行の span の高さが 1 行になった点を懸念として挙げた。verifier は食い違いなし
- 見込みどおりの編成で、食い違いは無かった
- 数行の DOM の変更なら、次も reviewer と verifier を 1 回ずつで組む。reviewer の観点（添字・`.word`）は依頼で絞ったので短く済んだ。同じ形で絞る
