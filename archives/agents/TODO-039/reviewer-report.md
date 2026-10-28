# TODO-039 reviewer 報告

対象: `git show c0776b1`。要修正 2 件、検討 5 件、好みの範囲 1 件。

## 要修正

### 1. `docs/update-release-notes.md:54-60` — `run` の流れの図と「4 段」が古い
- 図は `fetch -->|変更なし| 終える`、`translate → apply → check` のままで、`nhk` が無い。
  本文も「`run` は次の 4 段を続けて行う」のまま（表は 5 行になった）
- 実装（`notes.py` の `__main__`）は、`fetch` が変更なしでも `nhk()` を呼び、
  NHK が変わっていれば `check` まで進む。図の「変更なし → 終える」は今の挙動と違う
- 根拠: 読んだコード。`notes.py` の docstring は `fetch → translate → apply → nhk → check` に直してあり、文書だけ残った

### 2. `.claude/skills/update-release-notes/SKILL.md:32` と `docs/update-release-notes.md:130-146` — 「変更なし」で終える判断が NHK の更新を落とす
- SKILL.md の手順 2 は「『変更なし』なら何もせずに終える」。`run` のログでは、`fetch` の最後の
  `変更なし` の行の**後に** `FALLBACK_NHK_NEWS: 最新 6 件に更新した` と `check` の結果が続く。
  `/update-release-notes` で main が `変更なし` の行を見て止まると、NHK の書き換えが commit されないまま残る
  （次の `update-notes.sh` は「commit していない変更がある」で止まる。`update-notes.sh:16-19`）
- docs の「変更が無かった日（最後が『変更なし』）」の例のログにも `FALLBACK_NHK_NEWS: …` の行が無い。
  NHK はほぼ毎日変わるので、今は「変更が無かった日」の例そのものがまれになる
- 実害は未確認（skill を流していない）。食い違いは文面と `run` の流れから読める

## 検討

### 3. 他の分の失敗が NHK の更新を巻き込む（implementer の懸念の評価）
- 起きる場面（読んだコード）:
  - `fetch` が「全部取得できなかった」で `sys.exit` → `nhk()` は呼ばれない（`notes.py` `run`）
  - `translate` / `apply` / `check` が落ちる → `run` が 0 以外 → `update-notes.sh:25-28` が
    `git checkout HEAD -- index.html last-source.json` で戻すので、NHK の書き換えも消える
- **`run` の中で `nhk()` を先に呼ぶだけでは直らない。** どの失敗でも `update-notes.sh` が
  `index.html` ごと戻すため。NHK を独立させるなら `update-notes.sh`（戻し方か、`notes.py nhk` を
  別に流すか）まで変えることになる
- TODO の文面は「NHK の取得失敗が他を止めない」方向だけで、逆向きは書かれていない。
  意図に反するかは利用者の判断（判断が要る点）
- 逆向きの穴: NHK の取得・解析は通ったが、ページを壊す内容（下の 4）だと `check` が落ち、
  その日の訳（claude で訳した分）もまとめて戻される。実害は未確認

### 4. `notes.py` `dump`（NHK の見出し）— `</script>` を備えていない
- `json.dumps` で `"`・`\`・改行・制御文字は正しくエスケープされる（実測: `a"b\c` と `l1\nl2` を
  `dump` して `node` で読み戻し、元と一致）。U+2028 も ES2019 以降は文字列リテラル中で可
- `</script>` はそのまま出る（実測: `dump` の出力に `</script>` が残る）。HTML では script がそこで終わる
- 要約は `<[^>]*>` で消えるが、**見出しにはタグ除去が無い**。RSS の `&lt;/script&gt;` は
  ET が `</script>` に戻すので、見出しに入れば効く
- `check` の `pageerror` で SyntaxError として落ちるはずなので、壊れたまま push はされない見込み
  （ブラウザでは未確認）。その場合は 3 のとおり他の分も戻る。起きる見込みは低い。既存の定数も同じ `dump` を使う

### 5. `notes.py` `parse_nhk` — `fetchNhkNews` との違い（整形の結果は一致）
- 実測: 今日の `cat0.xml`（item 7 件）を `parse_nhk` と、`fetchNhkNews` の整形部分を写した `node` の
  スクリプトに同じ title / description を渡して比べた → 6 件すべて一致
- 作った入力 7 種（前後の全角空白、`&amp;hellip;`、`...`、タグ、「。」なし、要約が空、`"`・`\`）も一致
- 違いが出たもの・出るもの:
  - **件数:** JS は 1 件以上で受け入れる（`slice(0, 6)`）。Python は 6 件ちょうど未満なら取得失敗。
    RSS が 5 件以下の日は、ブラウザなら 5 件、cron は更新しない
  - **見出しが空:** JS は受け入れ、Python は取得失敗
  - **U+FEFF:** JS の `\s` は消し、Python の `strip()` は残す（実測で差分）。実害は未確認（RSS に出るかは不明）
- ブラウザは rss2json 経由、Python は RSS を直接読むので、rss2json の変換（description 内の改行
  `\n\n` を残すか、実体参照の戻し方）と同じかは**未確認**（curl からの rss2json は Cloudflare の 403）。
  今日の description は途中に `\n\n` を含む。最後の「。」が 2 段落目にあると、埋め込む `text` に空行が入る（JS も同じ処理）

### 6. `notes.py` `check` — NHK の中身を確かめていない
- `run` は NHK だけ変わった日も `check` を流すが、`CHECK_JS` が見るのは CLAUDE_NOTES / CLAUDE_CODE_JA /
  CACHYOS だけ。NHK は「ページが壊れていない（コンソールにエラーが無い）」までしか確かめられない
  （選択欄の「(6本)」やまとめの本文は見ない）
- `SKILL.md:20`「`check` の結果を main が見てコミットする」は、NHK については表示の確認にならない。
  `parse_nhk` を確かめるスクリプトやテストも無い（このプロジェクトにはテストの仕組み自体が無い）

### 7. `index.html:918-921` — `FALLBACK_NHK_NEWS` に「skill が書き換える」の注記が無い
- 他の埋め込み（`index.html:963,982,1006,1025`）は `// update-release-notes skill が書き換える（日付…）` があり、
  手で直すと上書きされることと、いつの内容かが分かる。NHK の見出しは「オフライン / 通信エラー時用」のままで、
  `notes.py` も日付を書かない
- 設計の揃えの問題。毎日変わるので日付は不要という判断もありうる

## 好みの範囲

### 8. `docs/update-release-notes.md:184-187` — `fetch` の説明に NHK の名前が入った
- 「ただし `fetch` は、…どれかが取れない…（人向けの名前は … / NHK ニュース）」。NHK を扱うのは
  `fetch` ではなく `nhk`。`nhk` の失敗時の行は表（67 行）に書いてあるので、ここでは別の文にした方が正確

## 問題の無かった観点
- 埋め込み（`"`・`\`・改行）: 問題なし（4 を除く。実測）
- NHK の取得・解析の失敗で他の分が止まらないか: 止まらない。`CalledProcessError` / `ValueError`
  （`ET.ParseError` は `ValueError` に包む。`UnicodeDecodeError` も `ValueError` の子）を捕まえて `False` を返し、`index.html` に触れない
- コミットメッセージ: 偽のログで 5 通り試し、自然な文面（`update-notes.sh` の該当部分を `sed` で切り出して実行）
  - NHK だけ → `NHK ニュースを …`、他だけ → `リリースノートと CHANGELOG と CachyOS ブログの訳を …`、
    両方 → `NHK ニュースと、リリースノートと CHANGELOG と CachyOS ブログの訳を …`、
    NHK 取得失敗 → NHK が入らない、他が一部取得失敗 → その分が抜ける
  - 全部「変更なし」だと `を …` になるが、その前の `git diff --quiet` で終わるので届かない
- `skipped` と終了コード: 判定式は変わっていない。**変わった点は 1 つ**: NHK だけ取得に失敗した日も、
  `': 取得できず更新しなかった'` に当たるので、commit・push のあと終了コード 1 になる（docs 187-190 の記述どおり）
- 引数の検査（`check`・`nhk` は WORK.json を取らない）: 問題なし
- 範囲: 指示に無い変更なし。`index.html` のキーが引用なし→ありに変わるのは `dump` を共用した結果で、他の定数と揃う
- README・CLAUDE.md の追記: 実装と合っている

## 作り込みすぎ
なし

## 備考
- 試験のために `notes.py` を import したら `.claude/skills/update-release-notes/__pycache__/` ができた（`-I` で
  `PYTHONDONTWRITEBYTECODE` が効かなかった）。消して `git status` が clean に戻ったのを確かめた
- 試験に使ったスクリプトはスクラッチパッドに置いた（リポジトリには残していない）
