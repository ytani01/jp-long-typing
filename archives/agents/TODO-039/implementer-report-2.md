# TODO-039 implementer 報告（2 回目: レビューの直し）

## 変更点
- 要修正 1・2:
  - `docs/update-release-notes.md`: `run` の流れの mermaid と「5 段」を今の動き（`fetch` が変更なしでも `nhk` が流れる）に直した。
    「変更が無かった日」のログ例に NHK の行を足し、「その後に NHK の行が続く」と注記。`fetch` の失敗の説明から NHK を外し、`nhk` の失敗を別の文にした（レビューの 8 も同時に直った）
  - `SKILL.md` 手順 2: 「変更なし」で終えず、`git status` で `index.html` の差分が無いときだけ終える
- 決定 2（`update-notes.sh`）: `run` が全部の訳し方で落ちた日（`failed=1`）は、戻したあとに `notes.py nhk` と `check` を流す。
  `check` が落ちたら NHK も戻す。NHK に差分があれば commit・push し、終了コードは 1 のまま。
  落ちた日のメッセージは `NHK ニュースを …` だけ（log に NHK の行しか無いので訳の分は入れない）。
  `google,claude` の流し直しは今までどおり（途中で落ちたら戻して次へ。最後の 1 つが落ちたときだけ新しい分岐に入る）。
  docs の「失敗したとき」に追記。
- 決定 3: `notes.py` の `dump` の最後で `</` を `<\/` にした（全定数が通る共通の箇所）。JSON としては同じ値（`json.loads` で戻る）。
- 決定 4: `parse_nhk` は 1〜5 件も受け入れる（0 件は失敗）。前後の空白の除去を `trim()`（`\s` と U+FEFF）にした。
  見出しが空の item は、今までどおり取得失敗にしている（ブラウザは `。` だけの見出しを受け入れるが、意味のある記事ではないため。変えるなら 1 行）。

## 確かめた結果
- `dump` に `a</script>b` を渡し、出力に `</` が無く `<\/script>` になり、`json.loads` で元に戻ることを assert（`replace` を外すと `'</' not in d` で落ちる）。
- 作った RSS（先頭に U+FEFF と全角空白、要約が「…」で終わる）で `parse_nhk`: 1 件 → 1、5 件 → 5、7 件 → 6、0 件 → ValueError。`text` は `見出し。\n要約です。`、title の FEFF・全角空白は消えた。
- `update-notes.sh` の落ちた日の再現: リポジトリを `scratchpad/clone` に clone し、NHK の見出しを 1 つ古くして commit、`check` が 1 回目だけ落ちるように細工（テストだけの変更）。`git` は commit・push だけ表示して実行しない wrapper を PATH 先頭に置いた。
  - `./update-notes.sh claude`: ログは `check` 失敗 → `NHK ニュースだけ更新する` → `FALLBACK_NHK_NEWS: 最新 6 件に更新した` → `OK`。
    `FAKE git commit -m chore(news): NHK ニュースを 2026-10-28 時点に更新する -- …`、`FAKE git push`、終了コード 1。
  - `google,claude` で `check` が 1 回目だけ落ちる場合: 1 つ目が落ちて `claude で流し直す` → 2 つ目で通り、従来の流れのまま `NHK ニュースを …` で commit・push（終了コード 0）。
  - `check` が必ず落ちるようにして `claude`: NHK も戻り、commit・push は呼ばれず、終了コード 1、作業ツリーはきれい。
- 本物のリポジトリで `notes.py nhk`: 変更なし／差分なし（`dump` の変更で既存の定数の文字列は変わらない）。
- `bash -n update-notes.sh`、`notes.py` の構文確認（`ast.parse`）は成功。実際の `update-notes.sh` は流していない。

## 残る懸念
- レビューの 5（rss2json と直接取得の違い）、6（`check` が NHK の中身を見ない）、7（`FALLBACK_NHK_NEWS` に注記が無い）は依頼に無いので触っていない。
- `fetch` が「全部取得できなかった」で止まる日は、`nhk()` が `run` の中で流れないが、決定 2 の再実行で NHK だけは更新される。
