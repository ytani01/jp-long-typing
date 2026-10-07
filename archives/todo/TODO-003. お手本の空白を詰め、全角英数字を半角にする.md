# TODO-003. お手本の空白を詰め、全角英数字を半角にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 34 | 5,659 | 12,595 | 1,012,027 | 73% |
| reviewer | Opus 5.5 | high | 16 | 99 | 31,431 | 174,095 | 15% |
| verifier | Sonnet 5.5 | medium | 14 | 84 | 28,265 | 140,306 | 12% |
| 合計 |  |  | 64 | 5,842 | 72,291 | 1,326,428 | 計 1,404,625 |

- reviewer・verifier とも、定義（`~/.claude/agents/`）のモデルと effort のまま。上書きしていない
- サブエージェントの分は `token-usage.py` の仕様で少なめに出ている

## きっかけ

利用者の依頼。お手本の空白を詰め、英数字を半角にする（記号はそのまま）。

## やったこと

`index.html` の `loadArticle()` で `this.cleanText` を作る行を変えた。
ニュース・青空文庫・カスタム文章のすべてがここを通る。

- 改行（`\r\n`・単独の `\r`・U+2028/2029）を `\n` に揃える
- 改行以外の空白（半角・全角・NBSP など）を取り除く
- 全角英数字（`Ａ-Ｚ` `ａ-ｚ` `０-９`）を半角にする。記号は変えない

利用者と決めたこと:

- 英単語の間の空白も詰める（`New York` → `NewYork`）。改行は残す
- カスタム文章にも同じ変換をかける
- 入力の判定（`isCharMatch()`）は変えない。全角で確定した英数字はミスになる

## 確かめたこと

verifier が `node` から Playwright（headless Chromium、1280x800）で実測した
（`archives/agents/TODO-003/verifier-report.md`、スクリプトは `verify.mjs`）。

- カスタム文章の変換結果、文字数表示、プリセットに空白・全角英数字が残らないこと
- 最後まで打って完了すること。全角 `１` はミス、半角 `1` は正解
- コンソールのエラーが無いこと

## 分担の振り返り

- reviewer は、単独の `\r` と U+2028/2029 が `[^\S\n]` で消えて前後の行がつながることを見つけた。
  改行に揃える修正を入れてから verifier に回した。`isCharMatch()` の空白の分岐が
  通らなくなった点も挙げたが、変えないと決め済みなので見送った
- verifier は食い違いを見つけなかった。見込みどおりの編成で、食い違いは無い
- 次に同じ規模（1 か所の文字列処理）なら、同じ編成でよい。reviewer は effort medium に
  下げてよい（差分が 3 行で、指摘はどれも正規表現の読み合わせで出せる範囲だった）
