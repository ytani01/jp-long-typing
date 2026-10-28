# TODO

**残っている項目: TODO-041。** これまでに 40 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-042` から。**

---

## TODO-041. ブラウザでの取得をやめ、cron で 3 時間ごとに埋め込む

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

- [x] ブラウザでの取得（rss2json の NHK、GitHub の Claude Code CHANGELOG 英語版）と失敗の alert をやめる。英語版も `notes.py` で埋め込む
- [x] 記事ごとの日時を選択欄の各行に出す（NHK・Claude Platform・Claude Code・CachyOS）。配信日時があればそれ、無ければ取得した日時。Claude Code は GitHub のリリース日時が取れるか先に確かめる
- [x] `update-notes.sh`: 始める前に `git fetch`。master でない・origin より先に進んでいる（未 push）・分岐している、ならログに残して何もせず終わる。遅れていれば `--ff-only` で取り込む。push は自分の commit の SHA だけ送る
- [x] Claude の起動時（このプロジェクトの SessionStart hook）に fetch し、origin より遅れていれば「先に pull」、未 push で cron が見送り中ならそれを知らせる
- [x] commit 時（リポジトリに置く pre-commit hook。`core.hooksPath` はマシンごとに設定）に、origin より遅れていれば警告する。止めはしない
- [ ] crontab を `0 */3 * * *` にする（main が書き換える）。README・skill の文書を直す

**無駄を省く工夫:** `update-notes.sh` の判定は、一時ディレクトリの bare リポジトリを origin にした clone で 4 通り（同じ・先・遅れ・分岐）を 1 回ずつ確かめ、本物の origin には push しない。表示の確認は種類ごとに代表 1 行。

- 背景: rss2json は Cloudflare に止められ、CORS を許す `www3.nhk.or.jp` の RSS は 2026-08-08 で止まっている。最新の `news.web.nhk` は CORS を許さない。jina・allorigins などの中継は使わないと決めた
- 開発は cron のマシンでする前提。GitHub Actions（C 案）は採らず、手元の cron のまま（A 案）にした

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

