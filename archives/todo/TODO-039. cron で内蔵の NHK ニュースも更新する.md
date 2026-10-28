# TODO-039. cron で内蔵の NHK ニュースも更新する

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 83 | 11,314 | 68,583 | 2,335,002 | 39% |
| implementer | Sonnet 5.5 | medium | 56 | 24,719 | 79,295 | 1,586,173 | 27% |
| reviewer | Opus 5.5 | high | 46 | 30,246 | 89,416 | 1,308,307 | 23% |
| verifier | Haiku 5.5 | medium | 38 | 9,991 | 40,983 | 639,915 | 11% |
| 合計 |  |  | 223 | 76,270 | 278,277 | 5,869,397 | 計 6,224,167 |

- 各担当のモデルと effort は定義（`~/.claude/agents/*.md`）のまま。reviewer は Agent ツールでも `opus` / `high` を指定したが、定義と同じ値
- main の分には、途中で利用者に頼まれた TODO-040（NHK ニュースの更新日時の表示）の相談が少し入っている

## きっかけ

内蔵の NHK ニュース（`FALLBACK_NHK_NEWS`）は手で入れたまま古くなっていた。毎朝 6:00 の cron（`update-notes.sh`）で、訳と一緒に更新したい。ほぼ毎日 commit・push するようになるのは承知のうえ。

## やったこと

- `notes.py` に `nhk` を足し、NHK の RSS（`cat0.xml`）を直接取得して `FALLBACK_NHK_NEWS` を最新 6 件（1〜5 件の日はその件数）で書き換える。訳さない。`run` からも呼ぶ
- 整形はブラウザの `fetchNhkNews` に揃えた（タグと前後の空白・U+FEFF を除く、「…」で切れた要約は最後の「。」まで、`text` は `見出し。\n要約`）。見出しが空の記事は取得失敗として扱う
- 埋め込む JSON の `</` を `<\/` にし、本文に `</script>` があってもページが壊れないようにした（埋め込み全体に効く）
- `update-notes.sh`: コミットメッセージに、変わったときだけ「NHK ニュース」を入れる。NHK の取得に失敗したら NHK だけ更新しない。利用者の決定で、**訳・check が失敗した日も NHK の分だけは更新して commit・push し、終了コード 1 で終わる**ようにした（以前は `index.html` ごと戻していた）
- `docs/update-release-notes.md`（`run` の流れと cron の図、失敗したとき）、`SKILL.md`、`README.md`、`CLAUDE.md` に NHK の更新を書き足した

## 確かめたこと

- implementer: `notes.py nhk` を 1 回流して 6 件に置き換わること、取得失敗（404、XML でない応答）、`</script>` の置き換えと `json.loads` での復元、RSS 0・1・5・7 件。`update-notes.sh` は git の wrapper で commit・push を止めた clone で、check 失敗の日に NHK だけ commit されることを試した
- reviewer: 一時リポジトリで `update-notes.sh` の 7 場面（訳し方の流し直し、check 失敗、NHK の取得失敗、NHK が変わらない日、通常の日など）を流し、戻し忘れや意図しない commit が無く、終了コードが決定どおりなこと。`</` の置き換えで既存の 5 つの定数が 1 文字も変わらないこと。今日の RSS と作った入力 7 種で、整形がブラウザと一致すること
- verifier: 内蔵の 6 件の形と見出しの一致、rss2json を止めた状態でまとめに 6 件の本文が出ること、JS の例外が無いこと（`archives/agents/TODO-039/verifier.png`）

## 残ること

- NHK の内容で `check` が落ちた日は、訳も NHK もまとめて戻る（`</` の置き換えで起きる見込みは低い。実害は未確認）
- `check` は NHK の中身を見ていない（reviewer の指摘 6。範囲外として見送り）
- `notes.py` を流すと `__pycache__` ができ、`.gitignore` に入っていない

## 分担の振り返り

- implementer は指示どおり実装し、自分では「他の分が失敗すると NHK も更新されない」点を懸念として挙げた。reviewer はその懸念の直し方（`update-notes.sh` の戻し方まで変える必要がある）と、文書の古い記述を 2 回にわたって見つけた。verifier は実装の問題を見つけず、依頼文の誤り（選択欄に個別記事が並ぶと書いた）を指摘した
- 見込みどおりの編成で済んだ。食い違ったのは回数で、文書の直しが 2 巡になった。1 回目の直しの依頼で「文書全体を新しい挙動に合わせる」と書かず、指摘の箇所だけを頼んだため
- 次に同じ規模で失敗時の挙動を変えるときは、直しの依頼に「挙動を書いた文書の箇所を `rg` で洗い出して全部合わせる」と書き、レビューを 1 巡で済ませる。verifier の依頼は、画面の構成を書く前に `index.html` の該当箇所を読んでから書く
