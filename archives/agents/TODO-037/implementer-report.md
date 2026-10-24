# TODO-037 implementer 報告

## 変更点
- `.claude/skills/update-release-notes/notes.py`: kind `cachy` を追加（`CONSTS['cachy']='CACHYOS_JA'`、`EN_CONST='CACHYOS_EN'`、`parse_cachy`、`fetch` の `out` に追加、`block` が `cachy_en` を受ける、`apply` が英語版も書く、`CHECK_JS` と `check` に CachyOS の確認）
- `index.html`: `CACHYOS_EN`・`CACHYOS_JA`、optgroup「🐧 CachyOS」（Claude の次）、`applyCachyosData`、change ハンドラの `cachy-en-` / `cachy-ja-`
- `.claude/skills/update-release-notes/SKILL.md`、`docs/update-release-notes.md`: CachyOS の分を追記
- `TODO.md`: TODO-037 の 3 つのチェックボックスに x
- `last-source.json`: 既存のキーはそのまま、`cachy` を追加（`run` が書いた）

## 検証
- `notes.py run --by google <scratchpad>/work.json`: 終了 0。new 3 件（50 / 70 / 72 項目）を訳し、`OK: 選択欄・訳の表示・まとめ・コンソール`
- 続けて `fetch`: 全部 same、`CACHYOS_JA: 変更なし`、`変更なし`（既存の notes・code も変更なし）
- 埋め込んだ英語（August 2026 Release）: 先頭は `Hello CachyOS Enthusiasts,` / `This is our fifth release of the year.` 、末尾は `Patreon: https://www.patreon.com/CachyOS` / `Thank you for your continued support!` / `The CachyOS Team`。3 件とも ``` ・`excerpt:`・`<http` を含まない
- 壊すと落ちるか: `index.html` の `cachy-en-` の分岐を壊すと `check` は rc=1（`cachy-en-0 を選んでも本文が出ない`）。戻すと rc=0

## 判断が要る点・懸念
- `update-notes.sh:37` のコミットメッセージは `CLAUDE_NOTES` / `CLAUDE_CODE_JA` の「変更なし」行だけで文面を決める。CachyOS だけ変わった日も「リリースノートと CHANGELOG の訳を…」になる（範囲外なので未変更）
- 英語版の本文は 1 行が長い段落が多く、1 件が 50〜72 行。Download 節の URL 行（`Patreon: https://…`）も残している（設計どおり）
- 英語版 `CACHYOS_EN` は `apply` のたびに書き直す（`last-source.json` との比較は日本語側のみ）。コメントの日付は変わったときだけ更新

## 追記: update-notes.sh のコミットメッセージ
- `update-notes.sh:34-39`: `CLAUDE_NOTES` / `CLAUDE_CODE_JA` / `CACHYOS_JA` の「<const 名>: 変更なし」行が無いものを「と」でつなぎ、`chore(news): <それ>の訳を <日付> 時点に更新する` にした。`docs/update-release-notes.md` の「終わったら」も合わせた
- 確かめ方: ログを手で作り、`what=` から `done` までを抜いて流した（commit・push は流さず）。`bash -n` は OK

| 「変更なし」の行 | 出たメッセージ |
|---|---|
| NOTES と CODE | `chore(news): CachyOS ブログの訳を 2026-10-24 時点に更新する` |
| CACHYOS_JA | `chore(news): リリースノートとCHANGELOGの訳を 2026-10-24 時点に更新する` |
| CODE | `chore(news): リリースノートとCachyOS ブログの訳を 2026-10-24 時点に更新する` |
| 無し（3 つ変わった） | `chore(news): リリースノートとCHANGELOGとCachyOS ブログの訳を 2026-10-24 時点に更新する` |

- 懸念: 「と」の前後に空白を入れない（以前の `リリースノートと CHANGELOG の訳` から、CHANGELOG 前後の空白が無くなった）。空白を入れたいなら指示してください

## 追記 2: 空白を前の書き方に合わせた
- `update-notes.sh:37-40`: CHANGELOG と CachyOS の名前に半角空白を付け、先頭の空白だけ外す。docs の「終わったら」の例も合わせた。`bash -n` は OK。同じ手順で流し直した（commit・push は流さず）

| 「変更なし」の行 | 出たメッセージ |
|---|---|
| NOTES と CODE | `chore(news): CachyOS ブログの訳を 2026-10-24 時点に更新する` |
| CACHYOS_JA | `chore(news): リリースノートと CHANGELOG の訳を 2026-10-24 時点に更新する` |
| CODE | `chore(news): リリースノートと CachyOS ブログの訳を 2026-10-24 時点に更新する` |
| NOTES と CACHYOS_JA | `chore(news): CHANGELOG の訳を 2026-10-24 時点に更新する` |
| 無し | `chore(news): リリースノートと CHANGELOG と CachyOS ブログの訳を 2026-10-24 時点に更新する` |

## 追記 3: reviewer 報告への対応
1. `check` の強さ（`notes.py` の CHECK_JS）: 英語・日本語とも、1 行目でなく本文の全部（空白を除く）が画面に出ているかで判定。スクラッチパッドの写しで分岐の番号を取り違えると落ちる:
   - `CACHYOS_EN[...]` を `CACHYOS_EN[2]` に: `cachy-en-0 を選んでも本文が出ない` rc=1
   - `CACHYOS_JA[...]` を `CACHYOS_JA[1]` に: `cachy-ja-0 を選んでも本文が出ない` rc=1
   - 写しを戻す: `OK: 選択欄・訳の表示・まとめ・コンソール` rc=0
2. 閉じていないコードブロックは `sys.exit`（上の 3 により CachyOS を飛ばす）。確かめ: `a: コードブロックが閉じていない（書式が変わったかも）`。
   見送り: `~~~`、番号付きリスト、画像、HTML、改行した段落（今の記事に無い。docs の「対応していない書式」に書いた）
3. 取れない・読めないものは飛ばす（`fetch`）。行は `<const 名>: 変更なし（飛ばした: 理由）` なので、`update-notes.sh` の判定（行頭の `<const 名>: 変更なし`）にそのまま乗り、メッセージに入らない。`apply` と `translate` は飛ばした kind を触らず、`last-source.json` は飛ばした kind のキーを前のまま残す。全部取れないときは `全部取得できなかった` で終了コード 1
   - スクラッチパッドの写し（`scratchpad/repo`）で、取得先を差し替えるスクリプト（`scratchpad/skip.py`）から流した:
   - CachyOS だけ取れない（notes を changed にして最後まで）: `CACHYOS_JA: 変更なし（飛ばした: 取得に失敗 https://invalid.invalid/x）`、notes を訳して apply、check は `OK` rc=0。`CACHYOS_EN`・`CACHYOS_JA`・`CLAUDE_CODE_JA` は写しの前後で同じ、`last-source.json` のキーは `['notes','code','cachy']` のまま
   - 3 つとも取れない:
     ```
     CLAUDE_NOTES: 変更なし（飛ばした: 取得に失敗 https://invalid.invalid/x）
     CLAUDE_CODE_JA: 変更なし（飛ばした: 取得に失敗 https://invalid.invalid/x）
     CACHYOS_JA: 変更なし（飛ばした: 取得に失敗 https://invalid.invalid/x）
     exit 全部取得できなかった   （rc=1）
     ```
   - 存在しない URL でも cachyos.org は 200 を返すので、そのときは `3 つ読めない、または項目が 0 件…` の理由で飛ばす（同じ扱い）
   - 後始末: リポジトリの `index.html`・`last-source.json` は触っていない。`git diff --stat` は実装後のまま（index.html +62、last-source.json +209）。リポジトリで `check` は OK
4. 古い文書: `README.md`（CachyOS の特徴）、`docs/update-release-notes.md`（ログの例に CachyOS、`fetch` の説明、書式の説明、`CACHYOS_EN` の書き直し、失敗したときの飛ばす挙動）、`update-notes.sh:2` のコメント、`CLAUDE.md` の「守ること」に 1 行（TODO-037）
- 見送り（reviewer の 3・5 と「作り込みすぎ」）: RSS の `item` またぎ、Google への長い GET、`block` の引数の整理は直していない

## 追記 4: 残りの reviewer 指摘
- 3（RSS の item またぎ）: `parse_cachy` を `xml.etree.ElementTree` に変え、`item` ごとに `link` を読む。形の違う `link` や XML として読めない RSS は `sys.exit` で、「飛ばす」の仕組みに乗る
  - 確かめ: 1 件目の `link` の末尾 `/` を外した RSS で `exit: RSS の item の link が読めない: 'https://cachyos.org/blog/2608-august-release'（書式が変わったかも）`。4 件目は取らない
  - 本物の RSS では `fetch` が全部 same、`check` は `OK: 選択欄・訳の表示・まとめ・コンソール` rc=0
- 作り込みすぎ: `block(src, name)` が const 名を受ける形にし、偽の kind `cachy_en` を無くした。`check` の `cachy_en` は `json.loads(block(src, EN_CONST).group(1))` をそのまま渡す。`index.html` の opts はそのまま
- 5（Google への長い GET）: 直さない。失敗しても `google,claude` の流し直しで claude に回るため

## 追記 5: 「飛ばした」があるときの update-notes.sh と文書
- `update-notes.sh:34-37,50`: ログに `（飛ばした:` の行があれば `skipped=1`。差分が無くて終わる道は `exit "$skipped"`、commit・push の後は最後に `exit "$skipped"`。飛ばした分はメッセージに入らない（既存の「変更なし」行の判定）
- `SKILL.md` の手順 2 に、「飛ばした」の行が出たら利用者に知らせる旨を足した。`docs/update-release-notes.md` の失敗したときの節にも書いた
- 確かめ方: 該当部分だけを抜き、`git diff --quiet` を差分の有無の変数に、`git commit` と `git push` を echo に差し替えて流した（`bash -n` も OK）

| 場合 | ログ | 出力 | 終了コード |
|---|---|---|---|
| 飛ばしあり・差分あり | CODE と CACHYOS_JA が変更なし（CACHYOS_JA は飛ばした） | `COMMIT: chore(news): リリースノートの訳を X 時点に更新する`、`PUSH` | 1 |
| 飛ばしあり・差分なし | NOTES・CODE・CACHYOS_JA が変更なし（CACHYOS_JA は飛ばした） | 何も出ない | 1 |
| 飛ばしなし・差分あり | NOTES と CACHYOS_JA が変更なし | `COMMIT: chore(news): CHANGELOG の訳を X 時点に更新する`、`PUSH` | 0 |
| 飛ばしなし・差分なし | NOTES が変更なし | 何も出ない | 0 |

## 追記 6: 「飛ばした」をやめ、行の文言を変えた
- `notes.py`: `NAMES`（リリースノート / CHANGELOG / CachyOS ブログ）を足し、行を `<const 名>（<人向けの名前>）: 取得できず更新しなかった。前の内容のまま残す（理由: <why>）` に変更。コメントも直した
- `update-notes.sh`: 終了コード 1 の判定は `: 取得できず更新しなかった`、コミットメッセージから外す判定は `^<const 名>(（…）)?: (変更なし|取得できず更新しなかった)`
- `docs/update-release-notes.md`（flowchart、CachyOS の節、失敗したときの節）、`SKILL.md` の手順 2 を合わせた
- `rg -uu -n '飛ば' --glob '!archives/**' --glob '!TODO.md' .` の残りは `index.html:1853` の「読み飛ばす」（打つ文字の処理。無関係）だけ。`rg -n '飛ばし' --glob '!archives/**' .` は隠しディレクトリを見ないので、`-uu` で確かめた

実際の行（取得先を `https://invalid.invalid/x` にした写しで、CachyOS だけ取れない場合）:
```
CACHYOS_JA（CachyOS ブログ）: 取得できず更新しなかった。前の内容のまま残す（理由: 取得に失敗 https://invalid.invalid/x）
```

update-notes.sh の判定（commit・push は echo に差し替え）:

| 場合 | 出力 | 終了コード |
|---|---|---|
| 取れないものあり・差分あり（CODE 変更なし、CACHYOS_JA 取れず） | `COMMIT: chore(news): リリースノートの訳を X 時点に更新する`、`PUSH` | 1 |
| あり・差分なし | 何も出ない | 1 |
| なし・差分あり（NOTES・CACHYOS_JA 変更なし） | `COMMIT: chore(news): CHANGELOG の訳を X 時点に更新する`、`PUSH` | 0 |
| CODE が取れず NOTES 変更なし・差分あり（CACHYOS_JA は更新） | `COMMIT: chore(news): CachyOS ブログの訳を X 時点に更新する`、`PUSH` | 1 |
