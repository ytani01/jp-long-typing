# TODO-040. NHK ニュースの更新日時を表示する

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 90 | 10,753 | 110,334 | 3,596,691 | 62% |
| implementer | Sonnet 5.5 | medium | 46 | 14,850 | 60,413 | 990,550 | 18% |
| reviewer | Opus 5.5 | high | 34 | 13,972 | 57,372 | 624,618 | 12% |
| verifier | Haiku 5.5 | medium | 28 | 8,312 | 39,478 | 444,120 | 8% |
| 合計 |  |  | 198 | 47,887 | 267,597 | 5,655,979 | 計 5,971,661 |

- 各担当のモデルと effort は定義（`~/.claude/agents/*.md`）のまま。reviewer は Agent ツールでも `opus` / `high` を指定したが、定義と同じ値
- main の分には、`.gitignore` に `__pycache__/` を足した小さな変更（`cd077fe`）と、Chrome 拡張をつなぐまでの待ちが入っている

## きっかけ

TODO-039 の作業中に、利用者から NHK ニュースの更新日時を出したいと頼まれた。出す日時は最新記事の配信日時、出す場所は選択欄のまとめの行と決めた。

## やったこと

- 選択欄のまとめの行に、記事の `pubDate` のうち一番新しいものを日本時間で出す（`📰 NHK主要ニュースまとめ (6本・10/28 22:22)`）。日時が取れないときは今までどおり `(6本)`
- ブラウザ: rss2json の `pubDate`（`YYYY-MM-DD HH:MM:SS`、UTC）を `toIsoDate` で読む。ブラウザのタイムゾーンによらず日本時間で出す
- 内蔵データ: `notes.py` の NHK の更新で、`FALLBACK_NHK_NEWS` の各記事に `pubDate`（日本時間の ISO 8601）を埋め込む。時差の無い日時は日本時間、`-0000` は RFC 5322 どおり UTC として読む（cron を流す機械の時刻に頼らない）
- `README.md`・`SKILL.md`・`docs/update-release-notes.md` に書き足した

## 確かめたこと

- rss2json の実物: curl と Playwright は Cloudflare に 403 で止められたため、main が Claude in Chrome で開いた（ボット確認は利用者が通した）。同じ記事が NHK の RSS では `Wed, 28 Oct 2026 22:22:06 +0900`、rss2json では `2026-10-28 13:22:06` で、UTC と分かった。記事は日時順に並んでいない
- implementer: `notes.py nhk` を流して内蔵データに `pubDate` が入ること。`TZ=America/New_York` で、時差なし・`-0000` などの書式が意図した日本時間になること
- reviewer: 解析とタイムゾーン、日時が無いときの表示、TODO-039 の埋め込み（`</` の置き換え、変更なしの判定）を壊していないこと。2 巡目で要修正 0 件
- verifier: ブラウザのタイムゾーンを New York にして、内蔵データ `(6本・10/28 22:22)`、取得を差し替えて `(2本・10/28 22:22)`、日時が空で `(2本)` になり、JS の例外が無いこと（`archives/agents/TODO-040/verifier.png`）

## 残ること

- 見出しも要約も同じで配信日時だけ変わった日にも、`update-notes.sh` が commit・push する（表示が変わるので、そのままにした）
- rss2json は Cloudflare のボット確認を出すことがあり、そのときブラウザでは NHK ニュースを取れず内蔵データを使う。内蔵データは cron で毎朝新しくなる（TODO-039）

## 分担の振り返り

- implementer は rss2json を測れなかったことを、見立てのまま実装したと明記して返した。reviewer は `TODO.md` のチェック漏れ、README の書き漏れ、UTC と見なす形が狭いこと、`-0000` の読み方（main の指示の誤り）を見つけた。verifier は食い違いを見つけなかった
- 見込みどおりの編成で済んだ。直しが 2 巡になったのは、`-0000` を日本時間として読むよう main が誤って指示したため
- 次に外部の API の形式に頼る項目では、立てるときか着手前に main が実物を取得して、依頼文に実際の値を書く。Cloudflare で止まる先は、初めから Claude in Chrome で開く。タイムゾーンの扱いを指示するときは、RFC の定めを確かめてから書く
