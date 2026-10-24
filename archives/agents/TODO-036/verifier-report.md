# TODO-036 確認報告（docs/update-release-notes.md「cron で毎日流す」）

文書は直していない。流したのは確認用の一時クローンと bare リポジトリだけ。

## 結論

- 事前の確認の 3 コマンドは、書いたとおりの結果が出た。
- ログの例は、「更新した日」の行の文言と順は実際の出力と合う。「変更が無かった日」の例は、行の文言は合うが、実際の出力のごく一部しか載っていない（下の食い違い 1）。
- 図と本文は、流れの骨組みは合う。ただし「エラーで止まった」の扱いに言葉の食い違いがある（判断は報告だけ。下の 3）。

## 1. 事前の確認（3 コマンドを 1 回ずつ流した）

- `systemctl is-active cronie` → `active`（終了コード 0）。一致。
- `mkdir -p ~/tmp` → 終了コード 0。一致。
- `ssh -T git@github.com` → `Hi ytani01! You've successfully authenticated, but GitHub does not provide shell access.`（終了コード 1）。`successfully authenticated` は一致。終了コードは文書に書かれていないので、食い違いではない（GitHub の `ssh -T` は通常 1 になる）。

## 2. ログの例と実際の出力

### 変更が無かった日（食い違い 1）

文書の例:

```
CLAUDE_NOTES: 変更なし
CLAUDE_CODE_JA: 変更なし
変更なし
```

実際の出力（一時クローンで cron の行を 2 回目に流した分。全部 same のとき）:

```
Sat Oct 24 13:25:05 JST 2026
same     2026年10月22日の更新（2 項目）
same     2026年10月21日の更新（4 項目）
same     2026年10月20日の更新（7 項目）
CLAUDE_NOTES: 変更なし
same     Claude Code 2.1.310（日本語）（8 項目）
same     Claude Code 2.1.309（日本語）（8 項目）
same     Claude Code 2.1.308（日本語）（1 項目）
CLAUDE_CODE_JA: 変更なし
変更なし
```

- 食い違い: 文書の例は 3 行だけなので、実際には `date` の行と `same` の行（項目ごと）が入る。例の「変更なし」の 3 行は、実際にもこの順で（間に `same` が挟まって）出る。
- 注意: `CLAUDE_NOTES: 変更なし` は、リリースノート 3 項目が全部 same のあとに出る。`CLAUDE_CODE_JA: 変更なし` は CHANGELOG 3 項目の後。文書の例のように 2 行が続けて出るわけではない。
- 添え: 例に「抜粋」と書くか、実際の全体を載せると食い違いが無くなる。

### 更新した日

文書の例と実際の出力（一時クローンで 1 回目に流した分、google で訳した）:

```
訳すもの: 2 件 → /tmp/tmp.as3DTYmWzl.json            … 一致（件数の値は見ない）
2 件を google で訳す                                   … 一致
/tmp/tmp.as3DTYmWzl.json に訳を書いた                 … 文書の例には無い（抜粋）
index.html と last-source.json を書き換えた（2026-10-24 時点） … 一致
OK: 選択欄・訳の表示・まとめ・コンソール               … 一致
[master 79f40b9] chore(news): リリースノートと CHANGELOG の訳を 2026-10-24 時点に更新する … 行の形・順は一致（ハッシュは見ない）
To <URL>                                              … 下の注
   86d3674..79f40b9  master -> master                 … 行の形は一致（値は見ない）
```

- 注（push の URL）: 文書は `To github.com:ytani01/jp-long-typing.git`。実際の remote は `git@github.com:…` だが、git は表示のときに `git@` を落とす。一時的な scp 形式の remote（`git@github.com:<パス>`）に、ssh の代わりのラッパーを使って空コミットを push して確かめた。出力は `To github.com:<パス>` だった。よって文書の表示は合う。
- 文書の例は `google` の成功だけなので、`/tmp/… に訳を書いた` の行と `date` の行が無い。例として抜粋なら問題ない。
- 「Google 翻訳が落ちた日」の行（文書 144 行目）: TODO-035 の 2 回目で実際に出たのは `Google 翻訳に失敗した（2026年10月20日の更新）: Command … returned non-zero exit status 6.` → `claude で流し直す` → `2 件を claude で訳す` の順。文書の「`Google 翻訳に失敗した（…）` と `claude で流し直す` の後に、claude で同じ流れが続く」と合う。

## 3. 図と本文（判断は報告だけ）

図:

```
A[事前の確認] → B[crontab -e で登録] → C[次の日にログを見る]
C -->|変更なし / push まで済んだ| D[そのまま]
C -->|エラーで止まった| E[ログを見て手で直す] → D
```

- 骨組み（事前の確認 → 登録 → ログを見る）は本文の 1・2・3 節と合う。
- 食い違いの候補: 図は「エラーで止まった」→「手で直す」としている。本文 3 節は、途中で落ちたときは `index.html` と `last-source.json` を戻して止まり、次の日にそのまま流し直される（手で直す必要は無い）とする。手で直すのは「push だけ落ちた日」（`git push` を手で流す）。図の「エラーで止まった」が、run の失敗（自動で流し直し）と push の失敗（手で push）のどちらを指すかが読み取れない。図を「push だけ落ちた」にする、または「途中で落ちた」は次の日に自動で流し直すと書き分けると、本文と合う。これは境界線上の判断なので、直すかどうかは管理者が決める。

## 4. 確かめられなかったこと

- 「変更が無かった日」の例は、本物のリポジトリでは出せていない（本物の `fetch` は今の HEAD に対して変更ありだった）。代わりに一時クローンで cron の行を 2 回流した 2 回目の出力を使った。
- 本物の cron デーモン（crontab 登録、6 時の実行）は確かめていない（TODO-035 と同じく対象外）。
- 文書の「最後に commit と push の行が出る」は、ログが `commit` の行で終わるかどうかまでは見ていない（push は 1 回目の出力で確認）。

## 5. 後始末と本物のリポジトリ

- `fetch` は本物のリポジトリで 1 回流した（書き出しは一時ファイルのみ）。`index.html` と `last-source.json` は変えていない。
- 一時クローン・bare・一時 json（`todo036`）は削除済み。
- 本物のリポジトリの `git status` は、確認の前後で `M TODO.md` / `M docs/update-release-notes.md` / `?? archives/agents/TODO-036/` のまま（変わったのは今回の報告ファイルだけ）。HEAD は変えていない。
- 一時クローンの元になった HEAD は 86d3674 だった（TODO-035 のときの fc55ddd より新しい）。その差の中身は見ていない。
