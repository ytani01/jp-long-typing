# TODO-040 implementer 報告

## 測った pubDate

- NHK の RSS（`cat0.xml`、`curl -L`、301 の先）: `Wed, 28 Oct 2026 22:22:06 +0900`（RFC 2822、+0900）。item は 7 件で、並びは配信日時の順ではない（先頭 6 件は 20:53, 18:15, 22:14:55, 20:12, 20:59:49, 22:22:06）。だから一番新しいものは「先頭 6 件の最大」を取る
- **rss2json は測れなかった。** curl でも Playwright（`page.goto`・`fetch`）でも Cloudflare の「Just a moment...」で 403 になる（`fetch` は CORS で `Failed to fetch`）。形式とタイムゾーンは未確認。rss2json の公開仕様の記憶（`YYYY-MM-DD HH:MM:SS`、UTC）に頼り、そう見なす。それ以外の形（RSS の書式など）は `Date.parse` に任せ、読めなければ日時なしにする

## 変更点

- `index.html:1278` `toIsoDate`: rss2json の `YYYY-MM-DD HH:MM:SS` は UTC と見なして、他は `Date.parse` で、ISO 8601 にする。読めなければ `''`
- `index.html` `fetchNhkNews`: 各記事に `pubDate: toIsoDate(item.pubDate)` を持たせた
- `index.html` `applyNewsData`: 記事の `pubDate` の最大を日本時間（UTC+9 を足して `getUTC*`）にし、`(6本・10/28 22:22)` の形で出す。読める日時が無ければ今の `(6本)`
- `index.html` `FALLBACK_NHK_NEWS`: 各記事に `pubDate`（日本時間の ISO 8601）を持たせた（`notes.py nhk` を 1 回流して更新）
- `.claude/skills/update-release-notes/notes.py` `parse_nhk`: `pubDate` を RFC 2822 から日本時間の ISO 8601 にして記事に入れる（読めなければ `''`）。`JST` と import を足した。`nhk()`・`dump()` は変えていない（`dump` が辞書のキーをそのまま出す）
- `docs/update-release-notes.md`（`nhk` の行）と `SKILL.md`（17 行目）に、`pubDate` も埋め込むことを足した
- `TODO.md`: TODO-040 のチェックを入れた

## 確かめた結果

- `python3 notes.py nhk` を 1 回: `FALLBACK_NHK_NEWS: 最新 6 件に更新した`。`git diff index.html` は text 以外の差が各記事の `pubDate` の追加だけ。最大は `2026-10-28T22:22:06+09:00`
- 簡易確認（Playwright、`api.rss2json.com` を abort／差し替え。確認用でスクリプトは残していない）:
  - abort（内蔵データ）: `📰 NHK主要ニュースまとめ (6本・10/28 22:22)`
  - rss2json 形式 `2026-10-27 21:00:00` と `2026-10-28 06:00:00`（UTC と見なす）: `(2本・10/28 15:00)`
  - `pubDate: 'xx'`: `(1本)`、`pageerror` なし
- `update-notes.sh` は流していない

## 判断が要る点・残る懸念

- rss2json の `pubDate` のタイムゾーン（UTC と見なした）が未確認。ずれていると、ブラウザで取得したときだけ日時が数時間ずれる。実際の応答を一度見られる環境（ブラウザの DevTools など）で、`items[0].pubDate` と NHK の RSS の同じ記事を比べるのが確実。規約では決まらず、この環境から測れなかったため判断に出す
- 内蔵データの日時は `notes.py nhk` を流した時点のもの。次に cron が流すまで古くなる（仕様どおり）
