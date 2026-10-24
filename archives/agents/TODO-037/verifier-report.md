# TODO-037 確認報告（verifier）

確認日: 2026-10-24。コードとファイルは変更していない（写しの index.html だけ変更し、写しは scratchpad にある）。

## 1. `notes.py check`（リポジトリ本体）

コマンド: `python3 .claude/skills/update-release-notes/notes.py check`
```
OK: 選択欄・訳の表示・まとめ・コンソール
EXIT=0
```
判定: 一致（OK、終了コード 0）。

## 2. 壊すと check が落ちるか（写しで確かめた）

- 写し: `/tmp/claude-649/-home-ytani-work-jp-long-typing/0586c381-fda4-4389-b2a3-0cdd8be86d1e/scratchpad/todo037-qcoQ`（`\cp -r` で作成）
- 操作: 写しの `index.html` で `CACHYOS_JA` の 1 件目と 2 件目の `text` を入れ替え（`title` は入れ替えていない）。入れ替わったことは diff で確認（1015 行と 1020 行が変わった）。
- 写しで `python3 .claude/skills/update-release-notes/notes.py check` を実行。
```
OK: 選択欄・訳の表示・まとめ・コンソール
EXIT=0
```

**食い違い（check が落ちなかった）**: 入れ替えを検出できなかった。
推定（根拠は読んだ範囲だけ。実行で確かめてはいない）: `check` は `CACHYOS_JA` を `index.html` から読み、同じファイルの内容がページに出るかを見る。入れ替えは「題名と本文の組」がずれるだけで、ファイル内では一貫しているので落ちない。設計の「英語・日本語を 1 件ずつ選んで本文が出る」は、題名と本文が元記事どおり対応しているかまでは見ていない。
判断が要る点: 題名と本文の対応を check で見るかどうか。見るなら、どう見るかは管理者が決める（報告だけ。直していない）。

## 3. 埋め込んだ本文（`CACHYOS_EN[0].text` と記事本文）

- 元: `https://raw.githubusercontent.com/CachyOS/website/master/src/content/post/2608-august-release.md`（curl 終了コード 0、85 行）
- 埋め込み: `index.html` の `CACHYOS_EN` 1 件目の `text`（50 行、空行を除く）
- 方法: frontmatter と ``` の区切り、コードブロック（`sudo pacman -Syu`）、表を除き、行頭の `* `、`**`、`` ` `` と `<url>` の山括弧を外して、元の段落とリストを 1 行ずつ並べた（50 行）。埋め込みと行ごとに突き合わせた。

結果:
- 欠けた行: なし
- 余計な行: なし
- frontmatter の混入: なし。コードブロックの `sudo pacman -Syu`: 入っていない（一致）
- `<https://…>` の自動リンク: 山括弧を外して URL が残っている（38〜45 行、48 行）。一致

食い違い（この突き合わせでは出ない。手で確かめて見つけた）:
- 元の 28 行目は `... but can still be found [here](https://github.com/CachyOS/proton-cachyos#proton-cachyos-config-options). ...` だが、埋め込みは `... can still be found here. ...` で、リンクの URL（`https://github.com/CachyOS/proton-cachyos#proton-cachyos-config-options`）が消えている。
- 同じく、`**太字**` の `**`、`` `コード` `` の `` ` `` は埋め込みから消えている（埋め込みに `**` と `` ` `` は 0 件）。
- 注意: 上の突き合わせスクリプトは、インラインリンクを「文字だけ」にする変換を私の側でも入れていたため、URL の欠落を差分として出せなかった。上の食い違いは、そのあとの目視で見つけた。
- 設計 README は「行頭の `* ` と字下げを外す」「自動リンクは山括弧だけ外す」と書いていて、インラインリンクの URL と太字・コードの記号の扱いは書いていない。「本文の全部を残す」とも書いているので、URL が消えるのが設計どおりかは判断が要る。判断は管理者に任せる。

## 4. `bash -n update-notes.sh`

```
EXIT=0
```
判定: 一致（構文エラーなし）。

## 変更されたファイルと指示の範囲

`git status` と `git diff --stat`（9 files, +417 −39）と、未追跡の `archives/agents/TODO-037/`。

- 設計の範囲に入るもの: `.claude/skills/update-release-notes/notes.py`、`index.html`、`docs/update-release-notes.md`、`.claude/skills/update-release-notes/SKILL.md`
- 設計 README に書かれていないが、差分がある:
  - `CLAUDE.md`（+1 行。CachyOS の訳の埋め込みを 1 行足す。TODO-037 と番号あり）
  - `README.md`（+1 行。CachyOS の説明。内容は設計と矛盾しない）
  - `TODO.md`（見込みの 3 項目にチェックが入った。進め方の規則どおり）
  - `update-notes.sh`（21 行。飛ばしたときの終了コードと、コミットメッセージの組み立てを変えた。利用者の指示で「飛ばす挙動とコミットメッセージは確かめ済み」なので中身は見ていない）
  - `.claude/skills/update-release-notes/last-source.json`（+209 行。`cachy` の項目が増えた。`notes.py` の出力として想定される状態ファイル）
- 判断が要る点: 上の 5 つを設計の範囲に含めてよいか。文書や状態ファイルの増減は範囲外とは言い切れない。

## 確かめられなかったこと・判断できなかったこと

- 訳の品質、画面、`notes.py run` の流し直しは対象外（指示どおり）。
- 項目 2 の「check が落ちない」理由は推定。check の中身を読んで、実行で裏付けてはいない（別の入れ替え方や、題名だけを変えた場合は未確認）。
- 項目 3 は、元記事の本文の全部が設計どおりに入るかの判断を含む。インラインリンクの URL を残すかどうかは判断できなかったので、管理者に任せる。
