# TODO-032 確認報告（verifier）

対象: `.claude/skills/update-release-notes/notes.py` の `run` / `translate`（未コミットの差分）

## 準備

- 作業場所: `/tmp/claude-649/-home-ytani-work-jp-long-typing/8a915d7b-dd55-461a-9215-22e0bb4f9c7c/scratchpad/verify/repo`（複製。本物の `index.html` と `last-source.json` は触っていない）
- 複製の `last-source.json` で `notes[0].en` の最後の項目（「We've added organization webhooks …」）と `code[0].en` の最後の項目（「Fixed an API error being replaced by …」）を消した。両方とも changed になった。
- 以後の実行はすべて複製側の `notes.py` を呼んだ。
- 各項目の前に複製を作り直した（`pristine_trim` から `cp -r`）。

## 1. `run --by google`（一回目）

- コマンド: `python3 .../notes.py run --by google $D/g.json`
- 終了コード: **1**
- 出力（全 12 行）の要点:
  ```
  コンソールのエラー: Access to fetch at 'https://api.rss2json.com/v1/api.json?rss_url=...' from origin 'http://127.0.0.1:59865' has been blocked by CORS policy: ...
  コンソールのエラー: Failed to load resource: net::ERR_FAILED
  changed  2026年10月20日の更新（3 項目）
  same     2026年10月15日の更新（4 項目）
  same     2026年10月14日の更新（2 項目）
  changed  Claude Code 2.1.306（日本語）（2 項目）
  same     Claude Code 2.1.305（日本語）（8 項目）
  same     Claude Code 2.1.304（日本語）（8 項目）
  訳すもの: 2 件 → .../g.json
  2 件を google で訳す
  .../g.json に訳を書いた
  index.html と last-source.json を書き換えた（2026-10-21 時点）
  ```
- fetch で changed が 2 件（notes 1 版、code 1 版）出た。translate、apply まで進んだ。
- 終了コード 1 は既知の CORS エラー（check の NHK 取得）によるもの。ほかの失敗行は無かった。
- `g.json` の数と文字の確認（python で一括読み出し）:

| 項目 | en 件数 | ja 件数 | ja のバッククォート | ja の `**` | ja の `](` |
|---|---|---|---|---|---|
| notes 2026年10月20日の更新 | 3 | 3 | 0 | 0 | 0 |
| code Claude Code 2.1.306（日本語） | 2 | 2 | 0 | 0 | 0 |

- en のバッククォート内の識別子が ja に残っているか:
  - notes: `/v1/organizations/webhooks` 残存、`/v1/user_profiles` 残存、`ant` 残存（部分一致）、`webhooks-2026-10-07` 残存。4 件すべて残存。
  - code: `claude -p` 残存（1 件）。
- 大文字小文字の変化: 今回の en（`Inference hooks`、`claude -p` など）では、確認範囲で識別子の大小変化は見つからなかった。
- 注意: 依頼にあった `sandbox.allowNestedUserNamespaces` は、今回の changed の en には含まれていなかった（今回の 2 件に存在しない）。残存の確認はできていない。

## 2. `run --by claude`

- コマンド: `python3 .../notes.py run --by claude $D/c.json`（複製を作り直してから実行）
- 終了コード: **1**
- Claude Code の中の Bash から流したが、子の `claude -p` は起動を拒まれなかった。出力に「2 件を claude で訳す」→「c.json に訳を書いた」が出て、`ja` が両項目に入った。
- ただし check が失敗した。出力の該当部分（Node のエラーを要約せず引用）:
  ```
  node:internal/modules/run_main:111
      triggerUncaughtException(
      ^

  page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:52205/
  Call log:
    - navigating to "http://127.0.0.1:52205/", waiting until "load"
  ...
  Node.js v26.12.0
  ```
  - 失敗箇所: check の Playwright が `page.goto` で配信先に接続できなかった。
  - 推定（検証していない）: 配信サーバーの起動が間に合わなかった競合。google 版の check は同じ手順で通っているので、race の可能性はある。ただし裏付けは無い。
  - 実害は未確認。index.html は apply 済みのまま残っている。
- 数の確認（c.json、python で一括読み出し）:
  - notes 2026年10月20日の更新: en 3 / ja 3。バッククォート・`**`・`](` は 0。en の識別子 4 件（`/v1/organizations/webhooks`、`/v1/user_profiles`、`ant`、`webhooks-2026-10-07`）はすべて ja に残存。
  - code 2.1.306: en 2 / ja 2。バッククォート・`**`・`](` は 0。en の `claude -p` は ja に残存。
- google 版との比較: ja は両方とも件数が揃っていて記号も残っていないが、文面は一致しない（`notes google vs claude ja equal: False`、`code ... False`）。訳の質は評価していない。

## 3. 失敗時（translate の失敗経路）

- 手順: 準備した複製で `fetch $D/f.json`（終了コード 0）→ 両方の sha256 を取る → `HTTPS_PROXY=http://127.0.0.1:9 notes.py translate --by google $D/f.json`
- translate の終了コード: **1**
- 出力（要点）:
  ```
  2 件を google で訳す
  Google 翻訳に失敗した（2026年10月20日の更新）: Command '['curl', '-sfL', '--max-time', '30', 'https://clients5.google.com/translate_a/t?...']' returned non-zero exit status 7.
  ```
- sha256 の前後比較:
  - f.json: `818247d6...8af8da5` → `818247d6...8af8da5`（変化なし）
  - repo/index.html: `34149e92...02688` → `34149e92...02688`（変化なし）
- 結論: エラーで止まり、終了コード非 0、2 つのファイルとも変わらなかった。

## 4. 本物のリポジトリ

- `git status --short` は開始時と同じ（`index.html`、`last-source.json` は変わっていない）。

## 確かめられなかったこと・判断が要る点

- check の失敗（`run --by claude`）が一回きりの race か、常に起きるかは判断できない。確かめるには check だけを再実行する必要があるが、今回は各項目 1 回の指示のため流していない。再実行の要否は管理者が決める。
- `sandbox.allowNestedUserNamespaces` の残存は、今回の changed 項目に出てこなかったため確かめられなかった。
- 訳の質、です・ます調、誤訳は評価していない。
- 識別子の大文字小文字の変化は件数の確認のみ。今回の範囲では見つからなかった。
