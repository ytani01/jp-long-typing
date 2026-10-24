# TODO-037 の分担

- main: 本文を取る場所と書式を実測して設計した（下の「設計」）
- implementer（Sonnet）: `notes.py`・`index.html`・`docs/update-release-notes.md` を設計どおりに直す。3 ファイルにまたがるので分けた
- reviewer（Opus）: 抜き出しの分岐、変わったかの判定、選択欄の並びが変わるので入れた
- verifier（Haiku 5.5）: `notes.py run --by google` と `check` を流し、壊すと `check` が落ちるかを確かめる

## 実測（2026-10-24）

- 本文: `https://raw.githubusercontent.com/CachyOS/website/master/src/content/post/<slug>.md`。frontmatter に `title` があり、日付は無い
- 新しい順: `https://cachyos.org/rss.xml` の `item` の並び。`link` が `https://cachyos.org/blog/<slug>/`
- 書式: 段落と `*` の入れ子リスト、コードブロック（`sudo pacman -Syu`）。表は最新の記事には無い。Download 節に `<https://…>` の自動リンクが並ぶ

## 設計

- `notes.py` に kind `cachy` を足す。RSS の先頭 3 件の slug で Markdown を取り、frontmatter・コードブロック・表の行（`|` で始まる）を除き、段落とリストの項目を 1 行ずつ `en` にする（リストの `* ` と字下げは外す）
- 自動リンク `<https://…>` は山括弧だけ外して URL を残す（利用者の判断。本文の全部を残す）
- 変わったかの判定・訳・`apply` の検証は今の仕組みに乗せる。題名は記事の `title`、日本語版は `title（日本語）`
- `index.html` に `CACHYOS_EN`・`CACHYOS_JA`（どちらも `{title, author, text}` の配列）を置き、選択欄に optgroup「CachyOS」を作って英語 3 件・日本語 3 件を並べる
- `check` に、選択欄の 6 件と、英語・日本語を 1 件ずつ選んで本文が出ることを足す
- `docs/update-release-notes.md` と `SKILL.md` に CachyOS の分を足す

## main の判断（確認の後）

- verifier の 1（`CACHYOS_JA` の text を入れ替えても `check` が通る）は、依頼の試し方の誤り。`check` は index.html の中身を正として、選んだ番号どおりに出るかを見る（番号の取り違えは reviewer が壊して落ちるのを確かめた）。中身と題名の組は `apply` が work.json から作る
- verifier の 2（`[here](URL)` の URL が消える）は、既存の `unmd` と同じ扱いで設計どおり。残すと決めたのは自動リンク `<https://…>` だけ
- verifier の 3（範囲外のファイル）は、レビューの指摘と利用者の判断で範囲に入れたもの
- reviewer の RR1（cron の終了コードがどこにも残らない）は直さない。docs の手順どおり、ログの「飛ばした」の行で気付く
