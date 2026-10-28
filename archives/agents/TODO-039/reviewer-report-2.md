# TODO-039 reviewer 報告（2 回目）

対象: `git show 3fb1ff0`。要修正 1 件、検討 1 件、好みの範囲 2 件。

## 前回の指摘
- 1（`run` の図と段数）: 直った。図は `fetch → (translate → apply) → nhk → check / 終える` で、`notes.py` の `__main__` と合う
- 2（SKILL.md の「変更なし」で終える）: 直った。`git status` で判断する形になり、docs のログ例にも NHK の行が入った
- 3（他の分の失敗が NHK を巻き込む）: 利用者の決定どおりに直った（下の「分岐の実測」）
- 4（`</script>`）: 直った（下の「`</` の置き換え」）
- 5（件数・U+FEFF）: 直った。見出しが空の扱いは依頼どおり見ていない
- 6（`check` が NHK の中身を見ない）・7（`FALLBACK_NHK_NEWS` の注記）: 変わっていない（依頼の範囲外とのこと）
- 8（`fetch` の説明に NHK）: 直った

## 要修正

### 1. `docs/update-release-notes.md:29, 33-34, 98` — 「落ちたら止まる・commit しない」の記述が古い
- 29 行「『変更なし』や `check` の失敗のときは commit しない」: `run` の `check` が落ちた日でも、
  あとで流す `nhk` と `check` が通れば NHK の分を commit・push する（`update-notes.sh:35-39`。実測の場面 s1）
- 33-34 行「最後のものも落ちたら止まる」: 今は止まらず、NHK だけの更新に進む（`update-notes.sh:29` が `exit 1` から `break` になった）
- 98 行（cron の mermaid）「途中で落ちた → 戻して止まる。次の日に流し直される」: NHK の分は push 済みになる
- 新しい挙動は 210-212 行に書いてあるので、上の 3 か所と食い違っている
- 根拠: 読んだコードと下の実測

## 検討

### 2. NHK の内容でページが壊れた日は、訳もまとめて戻る（前回 3 の残り）
- `run` の `check` が NHK の内容で落ちると、訳し方を変えて流し直しても同じく落ち、
  NHK だけの流し直しの `check` も落ちて全部戻る。その日の訳（claude の分を含む）は commit されない
- `</` の置き換えで起きる見込みはさらに下がった。他にページを壊す入力があるかは未確認。実害は未確認

## 好みの範囲

### 3. `update-notes.sh:37` — NHK が変わっていなくても `check` を流す
- `notes.py nhk` は「変更なし」「取得できず」でも終了コード 0 なので、`&&` の後の `check`（Playwright）が毎回走る。
  HEAD のままの `index.html` を確かめるだけで、結果は捨てられる（落ちても `git checkout` は空振り）。害は無い

### 4. `notes.py` `trim` — U+001C〜U+001F と U+0085 は Python だけが消す
- 実測: `trim('\x1cx\x85')` → `'x'`。Python の `re` の `\s` はこれらに当たり、JS の `\s` は当たらない。
  RSS に出る見込みは低い。U+FEFF と全角空白は揃った（実測: `trim('﻿　 x 　﻿')` → `'x'`）

## 問題の無かった観点

### 分岐の実測（`update-notes.sh`）
一時リポジトリ（bare の origin つき）に今の `update-notes.sh` と、場面ごとに振る舞いを変える偽の `notes.py` を置いて流した
（`run` は毎回 `index.html` に行を足し `last-source.json` を書く。`nhk` は変わる / 変更なし / 取得失敗、`check` は通る / 落ちる）。
スクリプトは `/tmp/claude-649/-home-ytani-work-jp-long-typing/5811a3c6-a1fd-4b2e-9eb2-e407733dc31d/scratchpad/sim/one.sh` と `/tmp/claude-649/-home-ytani-work-jp-long-typing/5811a3c6-a1fd-4b2e-9eb2-e407733dc31d/scratchpad/sim/stub.py`。

| 場面 | 訳し方・run の結果 | NHK / check | 終了コード | push されたもの | 作業ツリー |
|---|---|---|---|---|---|
| s1 | google,claude 両方落ちる | 変わる / 通る | 1 | `NHK ニュースを …`。`index.html` は NHK の行だけ、`last-source.json` は元のまま | きれい |
| s2 | claude 落ちる | 変わる / 落ちる | 1 | なし | きれい |
| s3 | claude 落ちる | 取得失敗 / 通る | 1 | なし | きれい |
| s3b | claude 落ちる | 変更なし / 通る | 1 | なし | きれい |
| s4 | google 落ちる → claude 通る | 変わる / 通る | 0 | 訳と NHK（google の apply は残っていない） | きれい |
| s5・s6 | claude 通る | 変更なし・変わる | 0 | 今までどおりの文面 | きれい |

- 戻し忘れ・意図しない commit は無かった。落ちた日に `apply` が書いた訳や `last-source.json` は commit に入らない（s1）
- 「全部変更なし」は `failed=0` で、変わっていない `git diff --quiet && exit "$skipped"` に届く（読んだコード）
- 落ちた日のメッセージは `(( failed ))` で訳の分を飛ばすので、`$log` を上書きしても前の `run` の行が混ざらない

### `</` の置き換え（`notes.py` `dump`）
- 今の `index.html` の 5 つの定数すべてで `dump(json.loads(元))` が元の文字列と一致（実測）。どの定数にも `<` は無いので、
  今回の変更で既存の埋め込みは書き換わらない
- `current()`・`check()` は `json.loads` で読むので `<\/` は `</` に戻り、`fetch` の題名の比較と `CHECK_JS` の本文の比較は変わらない
  （実測: `dump` の出力を `json.loads` すると `a</script>b` に戻る）。`last-source.json` は `json.dumps` で書くので関係ない
- `<` はエスケープの一部にならないので、`</` の前に `\` を足しても既存のエスケープは壊れない（実測: 元の文字列 `<\/x>` は `<\\/x>` と出て、そのまま元に戻る）

### その他
- `parse_nhk` の 1〜5 件の受け入れ: 読んだコードどおり。docs の表と「失敗したとき」も合う
- 範囲: 指示に無い変更なし

## 作り込みすぎ
なし
