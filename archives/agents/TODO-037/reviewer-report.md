# TODO-037 reviewer 報告

対象: `git diff`（notes.py・index.html・update-notes.sh・SKILL.md・docs/update-release-notes.md・TODO.md・last-source.json）。
手を入れたのはスクラッチパッドの写しだけで、リポジトリのファイルは変えていない。

## 要修正

なし。

## 検討

### 1. `check` が、記事の取り違えを捕まえられない
- 場所: `.claude/skills/update-release-notes/notes.py:281-284`（CHECK_JS の `cachy-en-0` / `cachy-ja-0` の確認）
- 内容: 本文の 1 行目が出ているかで判定しているが、今の 3 件は 1 行目が全部同じ
  （英語は `Hello CachyOS Enthusiasts,`、日本語は `CachyOS 愛好家の皆さん、こんにちは。`。index.html から読み出して確かめた）。
  記事の番号を取り違えても通る
- 根拠（実測）: スクラッチパッドに写した index.html で `CACHYOS_EN[parseInt(...)]` を `CACHYOS_EN[2]`、
  `CACHYOS_JA[...]` を `CACHYOS_JA[1]` に変えて `notes.py check` を流すと `OK`・rc=0 になった。
  英語と日本語を入れ替えたときと、分岐を消したときは落ちる（implementer の確認どおり）
- 補足: CHANGELOG の `code-ja-0` は版ごとに 1 行目が違うので、この弱さは無い。記事ごとに違う行
  （題名か、2 行目以降）で判定すれば捕まえられる

### 2. 書式が少し変わったとき、止まらずに `en` へ混ざる・欠ける
- 場所: `.claude/skills/update-release-notes/notes.py:96-106`
- 内容: 止まるのは「3 件読めない・`title` が無い・`en` が 0 件・CRLF などで frontmatter が読めない」ときだけ。
  次は止まらずに通る（作った Markdown を `parse_cachy` に通して確かめた）
  - コードブロックが閉じていない: それより後ろが黙って全部消える
  - `~~~` のコードブロック、4 字下げのコード: 中身が `en` に入る
  - 段落が途中で改行されている: 1 段落が別々の項目になる（訳が文の途中で切れる）。
    docs の「段落を 1 行ずつ」とも食い違う。今の 3 件には無かった（URL の行のほかに、続きの行らしいものは無い）
  - `1. ` の番号付きリスト、`+ ` のリスト、`> ` の引用、`***` の区切り、`|` で始まらない表（`a | b` と `--- | ---`）:
    記号のまま入る
  - 画像 `![alt](url)`: `plain` を通ると `!alt` が残る。`<img …>` などの HTML はそのまま入る
- 実害は未確認（今の 3 件には `<`・`![`・`~~~`・番号付きリストのどれも無い）。閉じていないコードブロックは
  数で検出できる（` ``` ` の数が奇数なら止める）

### 3. RSS の `item` が 1 件崩れると、黙って 4 件目を取る
- 場所: `.claude/skills/update-release-notes/notes.py:87`
- 内容: `<item>.*?<link>…/blog/<slug>/</link>` は最短一致だが `item` をまたぐ。`link` の末尾の `/` が無いなど
  形の違う `item` があると、その記事を飛ばして次を拾う（作った RSS で確かめた）。全部の形が変われば 0 件で止まる
- 実害は未確認

### 4. CachyOS が取れない日は、リリースノートと CHANGELOG の更新も止まる
- 場所: `.claude/skills/update-release-notes/notes.py:126`
- 内容: `fetch` は 3 つを続けて取得し、どれかの `curl` が落ちると `CalledProcessError` で全体が止まる。
  cron では `google,claude` の流し直しでも同じ所で落ちる。今までも CHANGELOG とリリースノートは同じ扱いなので、
  決めの話（取れないものだけ飛ばすか）。境界線上なので報告だけ

### 5. Google 翻訳への要求が長い
- 場所: `.claude/skills/update-release-notes/notes.py:164`
- 内容: 1 記事を 1 回の GET で送るので、URL が 5,950 / 8,680 / 7,954 文字になる（実測。リリースノートは最大 3,585、
  CHANGELOG は 1,590）。今回は通っているが、上限は確かめていない。長い記事で 414 などになれば claude の流し直しに回る
- 実害は未確認

### 6. 文書の古い記述
- `README.md:17-22`: 「主な特徴」に CachyOS ブログの練習文が無い（Claude の 2 つは書いてある）
- `docs/update-release-notes.md:130-140`: 「変更が無かった日」のログの例に、CachyOS の `same` 行と `CACHYOS_JA: 変更なし` が無い。
  今のログにはこれが出る
- `docs/update-release-notes.md:63`: `fetch` の説明が「日・版ごとに」のまま（記事が無い）
- `docs/update-release-notes.md:170`: 「リストの `* ` は外す」とあるが、実装は `- ` と見出しの `#` と字下げも外す。
  見出しの行も `en` に入ることが書かれていない
- `docs/update-release-notes.md:171`: 「変わったかの判定は他の 2 つと同じ」とあるが、`CACHYOS_EN` は判定によらず `apply` のたびに書き直す
- `update-notes.sh:2`: 冒頭のコメントが「リリースノートと CHANGELOG の訳を更新し」のまま
- `CLAUDE.md:11-15`: 「守ること」に、Claude の 2 つと並べて「CachyOS も skill で取得して埋め込む」の 1 行が無い。
  書くかどうかは管理者の判断

## 好みの範囲

- `update-notes.sh:37`: 区切りの空白を値の側（`" CHANGELOG "`）に持たせ、40 行目で先頭だけ外す作り。8 通りを流して、
  文面はどれも docs の「終わったら」と合っていた。読み手には分かりにくい

## 問題の無かった観点

- frontmatter・コードブロック（` ``` `）・`|` で始まる表・入れ子リスト・`<https://…>` の扱い: 設計どおり（作った Markdown で確かめた。入れ子の `*` / `-` は字下げごと外れ、自動リンクは URL だけ残る）
- 変わったかの判定（`last-source.json`）: 既存の仕組みに `cachy` が乗っている。`last-source.json` の差分は追加だけ（209 行、削除 0）
- 選択欄の並び: optgroup「🐧 CachyOS」が Claude の次、英語 3 件 → 日本語 3 件。`check` が値と表示を完全一致で見ている
- 既存の `CLAUDE_NOTES`・`CLAUDE_CODE_JA`: `block` の名前の引き方と日付コメントの置換が変わっただけで、挙動は同じ。`claude-` の分岐より前に `cachy-` を置いているが、接頭辞が違うので食い違わない。`applyClaudeData` の作り直しでも、選んでいる `cachy-*` の値は残る
- `update-notes.sh` のコミットメッセージ: 「変更なし」の 8 通りを流して確かめた。全部「変更なし」だと `chore(news): の訳を…` になるが、`run` はそのとき `apply` しないので差分が出ず、commit まで行かない
- 範囲: 指示に無い変更は無い

## 作り込みすぎ

- `notes.py:111-116`: shrink: 偽の kind `'cachy_en'` で `block` の中を分岐している。`block(src, name)` が const 名を受け取るようにして、呼び出し側で `CONSTS[kind]` / `EN_CONST` を渡せば分岐が消える
- `notes.py:303`: shrink: `cachy_en` の辞書を作り直さず、`json.loads(block(...).group(1))` をそのまま渡せる（`author` が付いていても CHECK_JS は読まない）
- `index.html:1684-1694`: shrink: `opts` の配列を作ってから回している。2 つの `forEach` の中で直接 `option` を足せば数行減る（`applyClaudeData` の書き方に合わせたのなら、このままでよい）

net: -6 lines possible.

## 再レビュー（implementer 報告の追記 3・4 のあと）

範囲: 前の指摘が直ったかと、直しで入った分。5（長い GET）と、見送った書式は見ていない。
確かめるときに使ったのはスクラッチパッドの写しと、`get` を差し替えたスクリプト（`scratchpad/rv.py`）だけ。

### 前の指摘

- 1（`check` の強さ）: 直った。本文の全部で判定している（`notes.py:310`）。写しで `CACHYOS_EN[2]` に壊すと `cachy-en-0 を選んでも本文が出ない`、rc=1（実測）
- 2（閉じていないコードブロック）: 直った（`notes.py:117`）。ほかの書式は見送りとして docs に書かれた
- 3（RSS の item またぎ）: 直った。`xml.etree` で `item` ごとに `link` を読み、形が違えば止まる（`notes.py:89-96`）
- 4（取れない日の扱い）: 「飛ばす」になった。下の検討 R1 を参照
- 6（文書）: README・docs のログの例・`fetch` の説明・書式の説明・`CACHYOS_EN` の書き直し・`update-notes.sh:2`・`CLAUDE.md` は全部直った
- 作り込みすぎ: `block(src, name)` になり、偽の kind が無くなった。`check` の `cachy_en` もそのまま渡している

### 要修正

なし。

### 検討

#### R1. 書式が読めなくても終了コードが 0 になった（リリースノートと CHANGELOG も含む）
- 場所: `.claude/skills/update-release-notes/notes.py:139-152`
- 内容: 飛ばす対象が CachyOS だけでなく 3 つ全部になった。前は、リリースノートや CHANGELOG の書式が変わると
  `fetch` が rc=1 で止まっていた（もともとのコメントは「『変更なし』で黙って終わらないように」）。今は、ほかが same なら
  `変更なし（飛ばした: …）` の行を出したうえで、最後に `変更なし` を出して rc=0 で終わる。cron では、ログを見なければ
  気付かず、飛ばされたままの日が何日も続きうる
- 根拠（実測、`get` を差し替えて `fetch` を流した）:
  - リリースノートを `### Not a date` にしたとき: `CLAUDE_NOTES: 変更なし（飛ばした: 日付の見出しとして読めない: ### Not a date）` … `変更なし`、todo=0（`run` は rc=0）
  - CachyOS が取れないとき・RSS が XML として壊れているとき: 同じく `CACHYOS_JA: 変更なし（飛ばした: …）` の行を出して rc=0
  - 3 つとも取れないとき: `全部取得できなかった`、rc=1（docs のとおり）
- 判断が要る点: 飛ばすのを CachyOS だけにするか、3 つ全部にするか。飛ばしたときに rc を 0 以外にする（commit はする）か。
  境界線上なので報告だけにする。docs（「失敗したとき」）は今の挙動と合っている

#### R2. skill の手順が、飛ばした行に触れていない
- 場所: `.claude/skills/update-release-notes/SKILL.md:30`
- 内容: 「『変更なし』なら何もせずに終える」とだけある。`/update-release-notes` から流したとき、`（飛ばした: …）` の行を
  main が見落としうる。飛ばした行があれば利用者に伝える、の 1 句があるとよい。実害は未確認

### 好みの範囲

- `notes.py:89` と `notes.py:105`: 同じ関数の中で `items` を RSS の item と本文の行の両方に使っている。今は `slugs` を先に作るので害は無い

### 問題の無かった観点

- 飛ばしたときの書き込み: `translate` は `data.get(k, [])`、`apply` は飛ばした kind を触らず、`last-source.json` は前の値に `update` で重ねるので、飛ばしたキーが残る
- 「変更なし（飛ばした: …）」の行と `update-notes.sh` の判定: 行頭が `<const 名>: 変更なし` なので、`grep -q "^CONST: 変更なし"` に掛かり、メッセージに入らない。飛ばしたものは `out` に入らないので、普段の `CONST: 変更なし` の行と 2 重には出ない
- 理由の文字列: `CalledProcessError` は URL、`sys.exit` はその文言が出る（実測した 4 通り）
- docs の「CachyOS を飛ばす」（`docs/update-release-notes.md:176`）には、RSS が読めない・`link` の形が違う、の 2 つが書かれていない。止まる・飛ばすの扱いは同じなので、好みの範囲

### 作り込みすぎ

なし。

## 再々レビュー（implementer 報告の追記 5 のあと）

範囲: `update-notes.sh` の、飛ばした日の終了コードと、SKILL.md・docs の記述だけ。

### 要修正

なし。

### 流し直しの道と「飛ばした」の判定（食い違いは無い）

`update-notes.sh:24-35` を読んで確かめた。

- `tee "$log"` は `-a` が無いので、試すたびにログを作り直す。ループを抜けたときの `$log` は、通った回の出力だけになる。
  だから `skipped` は、実際に `apply` された回で飛ばしたかどうかと一致する
  - 1 回目が「飛ばした」のうえで `check` で落ち、2 回目は全部取れて通ったとき: `skipped=0`。2 回目の内容が commit されるので正しい
  - 逆に 1 回目は全部取れて落ち、2 回目が飛ばして通ったとき: `skipped=1`。これも正しい
- `run` が rc=1 のとき（全部取れない、`check` で落ちる）: 戻して次で流し直す。最後の回も落ちれば 28 行目で `exit 1` となり、
  34 行目の判定までは行かない。飛ばしたかどうかにかかわらず 1 なので、食い違いは無い
- `grep -q … && skipped=1` と `git diff --quiet … && exit`: `set -e` の下でも、`&&` の左が落ちたところでは止まらない（41 行目の `||` と同じ形）

### 検討

#### RR1. cron では、終了コードの 1 を見るものが無い
- 場所: `docs/update-release-notes.md:115`（crontab の行）、`docs/update-release-notes.md:184-185`
- 内容: crontab の行は出力をログへ流すだけで、終了コードはどこにも残らない（`MAILTO` も無く、出力はリダイレクト済み）。
  「cron のログで気づける」のは `（飛ばした: …）` の行が出るからで、rc=1 が効いているからではない。
  rc=1 は、手で流したときと、ほかから呼んだときにだけ意味がある。害は無い。ただ R1 の「気付けない」は、
  今の cron の設定ではこの直しでは変わらない。ログに rc を残すなら、crontab の行で `echo "rc=$?"` を足す方法がある
- 境界線上なので報告だけにする

#### RR2. 図の分かれ道に「飛ばした」が無い
- 場所: `docs/update-release-notes.md:93-97`（「cron で毎日流す」の flowchart）
- 内容: 図の分かれ道は「途中で落ちた → 戻して止まる」と「push だけ落ちた」だけ。飛ばした日は、取れた分を commit・push して rc=1 で終わる。
  図からは、戻して止まる道と区別がつかない。本文（184-185 行）は合っている

### 好みの範囲

- `update-notes.sh:28` と `update-notes.sh:46`: 「落ちて戻した」も「commit したが飛ばしたものがある」も、同じ rc=1 になる。呼び出し側で区別したくなったら分ける

### 問題の無かった観点

- SKILL.md の手順 2: skill は `notes.py run` を直接流す。rc は飛ばしても 0 のままなので、行を見て知らせる、とした書き方で合っている
- docs 181-185 行: `notes.py` の挙動（飛ばす・全部取れないと rc=1）と `update-notes.sh` の挙動（commit・push の後に rc=1、差分が無くても 1）が、実装と合っている
- 飛ばしたものがメッセージに入らないこと: 前の再レビューで確かめた判定のまま、変わっていない

### 作り込みすぎ

なし。

## 追記 6 のレビュー

範囲: `update-notes.sh` の 2 つの判定が新しい行と合っているかと、`notes.py` の行と docs・SKILL.md が一致しているか。

### 要修正

なし。

### 確かめたこと

- `notes.py:152` が出す行: `<const 名>（<NAMES>）: 取得できず更新しなかった。前の内容のまま残す（理由: …）`。docs（`docs/update-release-notes.md:184-185`）の書式と、人向けの名前の一覧（リリースノート / CHANGELOG / CachyOS ブログ、`notes.py:34`）が一致している
- `update-notes.sh` の 2 つの判定（実測）: 実際の行の形のログ（CACHYOS_JA は取得できず、CLAUDE_CODE_JA は変更なし）に対して、
  `skipped` から `what` までを抜き出して流した。結果は `skipped=1`、`what=[リリースノート]`。
  `LC_ALL=C.UTF-8` と `LC_ALL=C` のどちらでも同じ（cron のロケールに左右されない）
  - 終了コードの判定 `': 取得できず更新しなかった'`: 行の中の `）: 取得できず…` に掛かる。この文字列を出すのは `fetch` の 1 か所だけ
  - メッセージから外す判定 `^CONST(（.*）)?: (変更なし|取得できず更新しなかった)`: 普段の `CONST: 変更なし` と新しい行の両方に掛かる。`same …（日本語）（8 項目）` の行には掛からない
- SKILL.md の手順 2、docs の flowchart（96 行）、CachyOS の節（177 行）、「失敗したとき」（181-188 行）: どれも「取得できず更新しなかった」の文言で、実装と合っている。「飛ばした」の残りが無いことは implementer の `rg -uu` のとおり

### 検討

なし（前回の RR1・RR2 は、この追記では扱っていない。RR2 の図の分かれ道は 96 行で足された）。

### 作り込みすぎ

なし。
