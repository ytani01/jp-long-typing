# TODO-034. リリースノートの更新を 1 コマンドで commit・push まで通す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 34 | 6,943 | 18,850 | 1,143,369 | 63% |
| verifier | Haiku 5.5 | medium | 26 | 10,993 | 42,214 | 382,152 | 23% |
| reviewer | Opus 5.5 | high | 14 | 10,328 | 46,414 | 204,972 | 14% |
| 合計 |  |  | 74 | 28,264 | 107,478 | 1,730,493 | 計 1,866,309 |

- reviewer と verifier は定義のまま（上書きなし）

## きっかけ

利用者から、`notes.py run` を手軽に流すスクリプトがほしいと頼まれた。commit と push まで自動にする、
置き場所はリポジトリの直下にする、と決めた。もう 1 つ、NHK ニュースの CORS エラーで毎回 `check` が
落ちていたので、`check` の側で無視することにした。

## やったこと

- `update-notes.sh [google]` を足した。`notes.py run` を流し、変わっていれば commit して push する。
  「変更なし」のときと `check` が落ちたときは commit しない。始める前に、対象の 2 ファイルに commit
  していない変更があれば止まる。片方だけ変わったときは、変わった方だけをメッセージに書く
- `notes.py` の `CHECK_JS`: api.rss2json.com のコンソールエラーを数えないようにした（本文か location の URL で見分ける）
- `docs/update-release-notes.md`: 使い方に `update-notes.sh` を足し、止まる条件と push だけ落ちたときの
  手順を書いた。CORS の行は「失敗したとき」から「check で確かめること」へ移した

## 確かめたこと

- main: `notes.py check` が `OK` で終わる（以前は CORS のエラー 2 件で落ちていた）。引数を間違えると argparse が exit 2 で止める
- verifier: 一時的に作った bare リポジトリと clone で 4 つのケースを試し、すべて合っていた（[報告](../agents/TODO-034/verifier-report.md)）

## 分担の振り返り

- reviewer: 要修正は 0 件で、検討が 4 件だった。`tee` を通すと出力がバッファに溜まること（実測で確かめていた）、push だけ失敗したときの戻し方、
  文書の書き漏れ、引数の判定が冗長なこと。4 件とも取り入れた
- verifier: 食い違いは無かった。偽の `node` で `check` を落とす方法と、bare リポジトリへの push で、本物のリポジトリに触らずに分岐を全部通せた
- 見込みとの食い違いは無かった。次に同じ規模のシェルスクリプトを作るときも、この組み方でよい。reviewer の依頼に「一時ファイルのバッファを実測する」を
  最初から入れておけば、指摘が検討のまま残らずに済む
