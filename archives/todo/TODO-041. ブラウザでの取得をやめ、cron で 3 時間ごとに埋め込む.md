# TODO-041. ブラウザでの取得をやめ、cron で 3 時間ごとに埋め込む

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| implementer | Sonnet 5.5 | medium | 128 | 80,657 | 182,923 | 7,542,153 | 54% |
| main | Opus 5.5 | medium | 96 | 22,590 | 40,170 | 4,244,996 | 30% |
| reviewer | Opus 5.5 | high | 42 | 26,024 | 105,641 | 1,303,606 | 10% |
| verifier | Haiku 5.5 | medium | 34 | 15,667 | 62,509 | 730,642 | 6% |
| 合計 |  |  | 300 | 144,938 | 391,243 | 13,821,397 | 計 14,357,878 |

- 各担当のモデルと effort は定義（`~/.claude/agents/*.md`）のまま
- 立てる前の相談（取得先の調査、A〜C 案の比較）は範囲の外で、main の分に入っていない

## きっかけ

NHK ニュースの取得に失敗し、「内蔵のデータか前回取得したデータを使います」の alert が出た。調べると次のとおりで、ブラウザから確実に取る経路が無かった。

- rss2json は Cloudflare に止められる
- CORS を許す `www3.nhk.or.jp` の RSS は 2026-08-08 で更新が止まっている
- 最新の `news.web.nhk` は CORS を許さない
- 中継サービスは、jina 以外は全滅か不安定だった

そこで、リアルタイムの取得はやめ、cron で頻繁に埋め込むと決めた。公開の方法は、GitHub Actions（C 案）は採らず、手元の cron と git push（A 案）にした。

## やったこと

- ブラウザでの取得（rss2json の NHK、GitHub の Claude Code CHANGELOG 英語版）と、失敗の alert、「ニュース更新」ボタンを無くした。英語版も `notes.py` で埋め込む
- 選択欄の各行に日時を出す
  - NHK はまとめの行の下に記事ごとの行を足し、1 本ずつも練習できるようにした
  - Claude Code は GitHub のリリース日時、CachyOS は投稿日時を使う
  - Claude Platform は名前に日付があるので付けない
- `notes.py` の取得まわり
  - GitHub の日時が取れなくても、ほかの更新は止めない
  - NHK の同じ見出しは 1 本にまとめる
- `update-notes.sh`
  - 始めに fetch し、master でない・未 push・分岐のときは見送る
  - 更新・commit・push は origin/master から作った一時 worktree で行い、その commit の SHA だけを送る
  - 手元には、早送りできるときだけ取り込む
- 知らせる仕組み（止めはしない）
  - SessionStart hook（startup・clear のときだけ）: origin より遅れていれば「先に pull」、未 push なら「cron は見送り中」と出す
  - `githooks/pre-commit`: origin より遅れていれば警告する
  - どちらも fetch の上限は 5 秒
- このマシンでは `git config core.hooksPath githooks` を設定し、crontab を `0 */3 * * *` にした（main）
- `README.md`・`CLAUDE.md`・`SKILL.md`・`docs/update-release-notes.md` を今の動きに合わせた

## 確かめたこと

詳細は `archives/agents/TODO-041/verifier-report.md`。

- `update-notes.sh`: 一時 bare リポジトリを origin にして 8 通りを試し、すべて想定どおりだった
  - 試したのは、同じ・未 push・遅れ・分岐・master でない・fetch できない・実行中に手元へ commit・未 commit の変更あり
  - 実行中に手元へ入れた commit は origin に送られなかった（`cat-file -e` で確認）
  - どの場合も worktree は残らなかった
- 表示
  - JS の例外・alert は 0 件で、localhost 以外への通信も 0 件だった
  - 種類ごとに代表 1 行の日時が期待どおりだった
  - NHK の記事の行を選ぶと、その記事の本文だけが練習文になった
- hook: 遅れた一時 clone で、警告が出て commit が通ること、SessionStart が 2 つの知らせを出すことを確かめた
- reviewer: 1 巡目の要修正は 2 件（push の範囲、起動時の説明文）で、2 巡目は 0 件だった

## 残ること

- cron が呼ぶ `update-notes.sh` は手元の版だが、`notes.py` は worktree にある origin/master の版が動く。手元が遅れたまま、どちらか片方だけログの書式を変えると、メッセージと終了コードがずれる（reviewer の検討 9。今は実害なし）
- SIGKILL・OOM・電源断のときは `/tmp` に worktree が残る。約 3 MB で再起動で消え、次の回には支障が無い
- 別のマシンでは `git config core.hooksPath githooks` を手で設定する必要がある（README に記載）
- データを git push で更新すること自体を見直し、自宅にサーバーを立てるかを検討する。まだ決めていない

## 分担の振り返り

- **各担当が見つけたこと**
  - implementer: GitHub のリリース日時が curl で取れることを、実装の前に確かめた。依頼に無かった「ニュース更新」ボタンの削除と、NHK に記事ごとの行が無いことを、判断が要る点として上げた
  - reviewer: 判定と push の間に入った commit も送られる穴と、残っていた古い説明文を見つけた。2 巡目は worktree と notes.py で版がずれうることを挙げた
  - verifier: 食い違いは見つけなかった。8 通りと表示を値つきで示した
- **見込みとの食い違い**: 担当の組み方は見込みどおりだった。implementer が 54% と重くなった理由は 2 つある
  - 依頼の「日時を各行に」が NHK の選択欄の作りと合っておらず、直しが 1 巡増えた
  - reviewer の指摘で worktree 方式に変わり、さらに 1 巡増えた
- **次に同じ規模なら**
  - 表示を変える依頼では、選択欄の今の行を `evaluate` で読ませ、その行の形で例を書く
  - git の push の範囲を決める項目は、判定と操作の間の競合まで依頼に書き、最初から worktree などの分離を指示する
  - そうすれば implementer の 2 巡分を減らせる見込み
