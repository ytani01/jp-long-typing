# TODO-010 本文の取れるニュースのソースを測った結果（main、2026-10-07）

`curl --max-time 15` で、`Origin: http://localhost:8080` を付けて測った。

| 候補 | 結果 |
|---|---|
| NHK 記事ページ（`news.web.nhk/newsweb/na/...`） | `Access-Control-Allow-Origin` 無し。HTML の本文は要約の後が「…」で、NHK ONE の「ご利用意向の確認」の後ろにある |
| NHK 記事の JSON（`api.web.nhk/r8/t/newsarticle/...json`） | 認証無しでは `description`・`abstract` の 100 字だけ。CORS ヘッダー無し |
| NHK やさしいことばニュース（`news.web.nhk/news/easy/news-list.json`） | 401 |
| Google ニュース RSS（rss2json 経由） | `description` は関連記事の見出しとリンクの列だけ。本文は各社のサイト |
| GIGAZINE・GIZMODO・Publickey・ITmedia の RSS | 70〜240 字の要約だけ |
| livedoor・Yahoo! ニュースの RSS（rss2json 経由） | 500 / 422 |
| 公開 CORS プロキシ（allorigins・codetabs・corsproxy.io） | タイムアウト、または 401（キーが必要） |
| X（`x.com/explore/tabs/news`、`api.x.com/2/news/search`、trends） | ログインへ転送（307）、401、400。X API は有料のキーが要る |
| Wikinews（`ja.wikinews.org/w/api.php`） | 2026-05-04 に閉鎖 |
| 47NEWS（`www.47news.jp`、利用者の追加の依頼） | 記事ページの HTML に本文がある（例: 速報 1 本で約 100 字）が、`Access-Control-Allow-Origin` 無し。RSS（`/rss/...`）は 403。allorigins 経由は 522 |
| **Wikipedia「Portal:最近の出来事/2026年10月」**（`ja.wikipedia.org/w/api.php`、`origin=*`、`prop=extracts`、`explaintext=1`） | `access-control-allow-origin: *`。認証不要。`=== 2026年10月6日 ===` の見出しの下に、1 件 50〜150 字の文が 1 日 1〜4 件。月のページ全体で 883 字（10 月、6 日まで）・3222 字（9 月）。前日までの分が載る |

利用者は一度「NHK を Wikipedia に置き換える」を選んで実装したが、1 日分が短いため NHK に戻した。
