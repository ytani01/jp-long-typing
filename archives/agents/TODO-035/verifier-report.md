# TODO-035 確認報告

## 結論

crontab の行を `env -i HOME=$HOME PATH=/usr/bin:/bin /bin/sh -c` で流すと、最後まで通った。
「変更なし」ではなく、google で訳して check が OK になり、クローンで commit され、bare へ push された。
終了コードは 0。SSH の認証も通った。

ただし、`claude` で訳す経路（google が落ちたときの流し直し）は今回通していない。

## 準備

- 一時ディレクトリに `git clone /home/ytani/work/jp-long-typing` して作業用クローンにした。
- `git clone --bare` で別の bare リポジトリを作り、クローンの origin を向けた。bare の HEAD は 22b4cc6（空ではない）。
- 未 commit の `update-notes.sh` と `docs/update-release-notes.md` を写して commit した（クローン上で e17506a）。`index.html` と `last-source.json` は HEAD のまま。

## 流したコマンド

文書の crontab 行から時刻 5 欄を外し、`$HOME/work/jp-long-typing` と `$HOME/tmp/update-notes.log` を一時ディレクトリのパスに置き換えた。

```
env -i HOME=$HOME PATH=/usr/bin:/bin /bin/sh -c 'export PATH=$HOME/.local/bin:$HOME/.local/share/mise/shims:/usr/bin:/bin; { date; <一時>/work/update-notes.sh google,claude; } >> <一時>/update-notes.log 2>&1'
```

- 終了コード: 0（所要 6.2 秒）
- ログの要点:
  - `2 件 → /tmp/tmp.mP26rf8jkA.json`
  - `2 件を google で訳す`
  - `index.html と last-source.json を書き換えた（2026-10-24 時点）`
  - `OK: 選択欄・訳の表示・まとめ・コンソール`
  - `[master f7a6f72] chore(news): リリースノートと CHANGELOG の訳を 2026-10-24 時点に更新する`（2 files changed）
  - `To …/remote.git  22b4cc6..f7a6f72  master -> master`
- クローンの HEAD は f7a6f72、作業ツリーは clean。bare の HEAD も f7a6f72。

## SSH 認証

`env -i HOME=$HOME PATH=/usr/bin:/bin timeout 60 ssh -T git@github.com </dev/null`

- 出力: `Hi ytani01! You've successfully authenticated, but GitHub does not provide shell access.`
- 終了コード: 1（GitHub の `ssh -T` は shell を出さないので 1 になるのが通常。認証の成否は出力で見た）

## 変更ファイルと範囲

- 文書の「cron で毎日流す」の行は、流したとおりの形で書かれている（確認した範囲）。
- 本物のリポジトリの `git status` は、確認の前後で変わっていない。
  - ` M TODO.md` / ` M docs/update-release-notes.md` / ` M update-notes.sh` / `?? archives/agents/TODO-035/`
  - HEAD は 22b4cc6 のまま。commit も push もしていない。

## 確かめられなかったこと

- `claude` で訳す経路（google が落ちた後の流し直し）と、その後の check。google が通ったので使われなかった。
- cron の本物の実行（`crontab` への登録、cron デーモン下での動作）。今回は `env -i` で再現しただけ。
- 本物の SSH 鍵での push。今回の push は手元の bare リポジトリへのもので、SSH は認証の確認だけ。
- 訳の中身、check の中身、ループの分岐（対象外の指示どおり）。

## 後始末

一時ディレクトリ（clone・bare・ログ）は削除済み。

## 2 回目（google 失敗から claude で流し直す経路）

HEAD は fc55ddd（cron 登録の文書と update-notes.sh を含む版）から、使い捨てのクローンと bare で流した。

- クローンの `.claude/skills/update-release-notes/notes.py` の `GOOGLE_URL` を `https://clients5.invalid/…` に書き換えて commit（2c387a5）。google は必ず落ちる。
- 流したコマンド: 1 回目と同じ形。`env -i HOME=$HOME PATH=/usr/bin:/bin /bin/sh -c '<crontab の行、パスは一時ディレクトリへ置換>'`（`google,claude`、`timeout 1200`）
- 終了コード: 0（タスクの出力 `EXIT=0`）

ログの要点（流れの順）:

1. `2 件 → /tmp/tmp.EcYVMr1dYR.json` / `2 件を google で訳す`
2. `Google 翻訳に失敗した（2026年10月20日の更新）: Command '['curl', '-sfL', '--max-time', '30', 'https://clients5.invalid/translate_a/t?…'] returned non-zero exit status 6.`（exit status 6 は curl の名前解決失敗）
3. `claude で流し直す`
4. `2 件を claude で訳す` / `/tmp/tmp.EcYVMr1dYR.json に訳を書いた` / `index.html と last-source.json を書き換えた（2026-10-24 時点）`
5. `OK: 選択欄・訳の表示・まとめ・コンソール`（check が OK）
6. `[master d63193e] chore(news): リリースノートと CHANGELOG の訳を 2026-10-24 時点に更新する`（2 files changed）
7. `To …/remote.git  fc55ddd..d63193e  master -> master`

push された commit（bare の d63193e）の index.html:

- 新しく入った訳（Claude Tag API、Inference hooks、user profiles、web fetch など）は日本語。英語のまま残っている箇所は無し（目視の範囲）。
- 「Claude Code 2.1.310（日本語）」の本文も日本語。

食い違い: 無し。claude 経路は今回初めて通り、流れは指示どおり（google 失敗、流し直し、check、commit、push）。

後始末: 一時ディレクトリ（todo035b と 1 回目の todo035）は削除済み。本物のリポジトリの `git status` は空（変更なし）、HEAD は fc55ddd のまま。commit も push もしていない。
