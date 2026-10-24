# TODO-037. CachyOS のブログを練習文に足す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（設計）+ implementer（Sonnet / medium）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実測・設計）+ implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 292 | 62,391 | 210,004 | 13,172,975 | 69% |
| implementer | Sonnet 5.5 | medium | 98 | 39,162 | 166,669 | 2,883,916 | 16% |
| reviewer | Opus 5.5 | high | 74 | 31,337 | 184,171 | 2,300,970 | 13% |
| verifier | Haiku 5.5 | medium | 24 | 12,277 | 44,117 | 325,513 | 2% |
| 合計 |  |  | 488 | 145,167 | 604,961 | 18,683,374 | 計 19,433,990 |

- どの担当も定義（`~/.claude/agents/*.md`）のモデルと effort のまま。上書きしていない
- 終点は決着のコミットの直前（現在時刻まで）で数えた

## きっかけ

CachyOS のブログ（リリースの告知）を、英語と日本語の練習文に足したい。RSS（`cachyos.org/rss.xml`）には題名とキーワードしか無く、CORS も無いので、ブラウザでは取らず `update-release-notes` skill で埋め込む。

## やったこと

分担と設計は [archives/agents/TODO-037/](../agents/TODO-037/README.md)。

- `notes.py` に kind `cachy` を足した。RSS（`xml.etree.ElementTree` で読む）の先頭 3 件の slug から `CachyOS/website` の `src/content/post/<slug>.md` を取る。frontmatter、コードブロック、表の行は除く。段落とリストの項目を 1 行ずつにし、自動リンクの URL は残す（利用者の判断）。閉じていないコードブロックがあれば止める
- `index.html` に `CACHYOS_EN`・`CACHYOS_JA` を置き、選択欄に「🐧 CachyOS」を作って英語 3 件・日本語 3 件を並べた
- 取れない・読めないものは、3 種のどれでも更新せずに前の内容を残し、`<const 名>（<名前>）: 取得できず更新しなかった。前の内容のまま残す（理由: …）` を出す（利用者の判断）。全部取れないときは終了コード 1
- `update-notes.sh`: コミットメッセージを、変わったものの名前を「と」でつなぐ形にした。取れないものがあった日は、取れた分を commit・push してから終了コード 1 で終わる
- `check` で、CachyOS の選択欄 6 件と、英語・日本語を 1 件ずつ選んだときの本文の全部を見る
- `SKILL.md`・`docs/update-release-notes.md`・`README.md`・`CLAUDE.md` を合わせた

## 確かめたこと

- implementer: `run --by google` が通り、`check` が OK。番号の対応を壊すと `check` が落ちる。取れない場合（1 つ・全部）、`link` の形が違う RSS、コミットメッセージと終了コードの組み合わせを、写しや抜き出しで流した
- reviewer: 4 回見た。`check` が弱い（本文の 1 行目が 3 件とも同じ）こと、RSS の `item` をまたいで 4 件目を拾うこと、取れない日に全体が止まることなどを見つけ、直したあとを確かめた
- verifier: `check` が OK、`bash -n` が通る、埋め込んだ英語の本文に欠けた行・余計な行が無く、frontmatter とコードブロックが入っていない
- verifier の「`CACHYOS_JA` の本文を入れ替えても `check` が通る」は、依頼した試し方の誤り（`check` は index.html を正として見る）。`[文字](URL)` の URL が消えるのは既存の `unmd` と同じ扱い

## 残ること

- `~~~` のコードブロック、番号付きリスト、画像、HTML、改行した段落には対応していない（今の記事に無い）
- Google 翻訳に 1 記事を 1 回の GET で送る（URL が 8,000 字前後）。落ちても claude で流し直すので直していない
- cron では終了コードがどこにも残らない。取れなかった日は、ログの「取得できず更新しなかった」の行で気付く

## 分担の振り返り

- implementer は 6 回に分けて直した。reviewer の指摘と利用者の判断が 1 つずつ届いたため。reviewer は `check` の弱さを実際に壊して見つけた。verifier は文言の照合で食い違いを見つけなかった。1 件の指摘は依頼側の試し方の誤りだった
- 見込みと担当は同じ。食い違ったのは回数で、取得に失敗したときの扱いと、cron のコミットメッセージを、着手前に決めていなかった。どちらも、レビューで出てから利用者に聞いた
- 次に取得先を足すときは、設計を出す時点で「取れない日にどうするか」「cron のメッセージと終了コード」を決めておく。そのうえで implementer に一度で渡す。verifier に壊して試させる依頼では、`check` が何を正として見るかを書いておく
