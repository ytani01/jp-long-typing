# TODO-032. update-release-notes を取得から確認までスクリプトで通す（訳は Claude / Google を選べる）

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 76 | 21,767 | 40,608 | 3,304,403 | 82% |
| reviewer | Opus 5.5 | high | 20 | 6,584 | 60,209 | 362,484 | 10% |
| verifier | Haiku 5.5 | medium | 24 | 2,791 | 36,956 | 294,080 | 8% |
| 合計 |  |  | 120 | 31,142 | 137,773 | 3,960,967 | 計 4,130,002 |

- main の集計には、項目を立ててから着手するまでのやり取り（Google 翻訳の口についての質問など）も入っている
- ファイル名の「/」は、パスの区切りにならないよう全角の「／」にした

## きっかけ

利用者の要望。

- 訳を Google 翻訳でも作れるようにしたい
- Claude Code の外から、取得から確認までをスクリプト 1 本で通したい
- skill は、そのスクリプトを呼ぶだけにする

決めたこと:

- 公式 API はキーと課金設定が要るので使わない
- `translate.google.com` の画面操作は、遅く壊れやすいので使わない
- 非公式の口は予告なく止まることがあるので、既定は `claude` にする
- `google` では「です・ます」調と製品名をそのまま残すことは保証しない

## やったこと

- `notes.py` に `translate [--by claude|google]` と `run [--by claude|google]` を足した
  - `run` は fetch → translate → apply → check を続けて行う。「変更なし」なら fetch で終える
- `claude` の訳し方
  - 空の一時ディレクトリで `claude -p` を起動する
  - 訳し方の決まり（`RULES`）と `en` を渡し、JSON の配列の配列で受け取る
- `google` の訳し方
  - `clients5.google.com/translate_a/t?client=dict-chrome-ex` を使う
  - `translate.googleapis.com`（`client=gtx`）は着手時に curl から試すと 429 で止められた（ブラウザからは通る）
  - 送る前に Markdown のリンクと `**` を外す。バッククォートは残して送り（中が訳されない）、訳した後に外す
- 訳の形（数・空・文字列か）が合わなければ、WORK.json に何も書かずに止める
- 引数の解析を `argparse` にした（reviewer の指摘。`run --by` で `--by` が WORK.json と扱われていた）
- 訳し方の決まりを SKILL.md から `notes.py` の `RULES` に移した
- SKILL.md を `run` を呼ぶ手順に書き換え、`run` で check が落ちたときの戻し方を書いた
- README に `notes.py run` の呼び方を足した

## 確かめたこと

verifier が本物を複製し、`last-source.json` から 2 項目を消して changed を作って流した（`archives/agents/TODO-032/verifier-report.md`）。

- `run --by google` / `run --by claude`
  - どちらも translate → apply → check まで進み、`ja` と `en` の数が合った
  - Claude Code の Bash から子の `claude -p` を起動しても拒まれなかった
- `HTTPS_PROXY=http://127.0.0.1:9` で translate を失敗させた
  - 終了コード 1 で、WORK.json と index.html の sha256 は変わらなかった
- check は既知の NHK ニュースの CORS エラーで終了コード 1 になる（範囲外）

## 残ること

- `run --by claude` のとき、check が一度 `page.goto` で `ERR_CONNECTION_REFUSED` になった
  - main が同じ複製で check を流し直すと再現しなかった
  - サーバーの起動待ち（5 秒で黙って抜ける）が足りなかった可能性がある。実害は未確認
- check が NHK ニュースの CORS エラーで毎回落ちるので、`run` は終了コード 1 で終わる。許すかは別に決める
- Google 翻訳は、バッククォートの中でも文頭に見える位置を大文字にすることがある（`capabilities. Thinking`）

## 分担の振り返り

- reviewer
  - 引数解析の穴（`run --by` で利用上限を使い、index.html を書き換える）を stub で実測して見つけた
  - 空の訳や、文字列でない要素が translate を通ることを指摘した。main が translate の 1 か所で弾くようにした
- verifier
  - 失敗経路で何も書かないことを sha256 で確かめた
  - check の一度きりの失敗を拾った
- 見込みとの食い違いは無い
- 次に同じ規模の項目では、同じ組み方にする。verifier への依頼には「check が既知の理由以外で落ちたら、check だけ 1 回流し直す」と書き、main が流し直す分を省く
