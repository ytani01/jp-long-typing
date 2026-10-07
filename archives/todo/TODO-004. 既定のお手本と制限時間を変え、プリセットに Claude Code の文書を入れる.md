# TODO-004. 既定のお手本と制限時間を変え、プリセットに Claude Code の文書を入れる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high、3 回）+ verifier（Sonnet 5.5 / medium、途中で 1 回止めてやり直し） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 108 | 31,547 | 73,364 | 5,139,463 | 80% |
| reviewer | Opus 5.5 | high | 42 | 5,679 | 67,471 | 837,623 | 14% |
| verifier | Sonnet 5.5 | medium | 26 | 198 | 40,678 | 348,255 | 6% |
| 合計 |  |  | 176 | 37,424 | 181,513 | 6,325,341 | 計 6,544,454 |

- reviewer・verifier とも定義のモデル・effort のまま（上書きなし）
- main の分には、同じ時間帯に TODO-005 を立てるための調査（Claude 公式の取得元と CORS の実測）が入っている
- verifier はサブエージェントのログが欠けやすく、実際より少なく出ている可能性がある

## きっかけ

利用者の依頼（2026-10-07）。作業の途中で次の指示が順に足された。

- 起動時のお手本を NHK ニュース、制限時間を 30 秒にする
- プリセットに Claude の日本語公式ドキュメントを入れ、青空文庫は「走れメロス」「吾輩は猫である」「羅生門」だけにする
- アプリ名「速打」をやめ、「日本語長文タイピング」にする
- お手本の並びを Claude ニュース → NHK ニュース → Claude ドキュメント → 青空文庫にし、既定を Claude ニュースにする（Claude ニュースの部分は TODO-005 へ回した）

利用者が選んだこと: Claude Code の文書は `index.html` に埋め込む。ページは概要・クイックスタート・一般的なワークフローの 3 本。起動時の取得後は、打ち始める前ならお手本を最新ニュースに差し替える。

## やったこと

`index.html`

- 起動時に `loadNewsSummary()` を読む。制限時間の選択欄の `30` に `selected` を付け、`this.timeLimit` は起動時に選択欄から読む（既定を 1 か所に持つ）
- 起動時の取得が成功し、表示中のお手本がニュースまとめで、打ち始めておらず終わってもいなければ、最新のまとめに差し替える。判定は `isNewsSummary`（`loadArticle()` で false、`loadNewsSummary()` で true）で行う。初めは選択欄の値で判定したが、カスタムを適用した直後に差し替わってしまった（reviewer の指摘）
- `applyNewsData()` でニュースの optgroup を作り直す前の選択を覚え、作り直した後に戻す（選択中の option が消えて先頭に戻っていた）
- `closeCustomModal()` は、選択欄を `currentArticleIndex` ではなく、最後に `loadArticle()` したときの値（`loadedSelectValue`）へ戻す
- `PRESETS` を Claude Code 文書 3 本（0〜2）→ 青空文庫 3 本（3〜5）にした。「山月記」「注文の多い料理店」を外した。Claude Code 文書は `https://code.claude.com/docs/ja/{overview,quickstart,common-workflows}.md` の地の文から段落を選び、リンクやコードの記号を外して 400〜460 字にした
- 選択欄を NHK ニュース → Claude Code ドキュメント → 文学名作 → カスタムの順にした
- `<title>`・見出し・フッターから「速打 (Hayauchi)」を外し、「日本語長文タイピング」にした。フッターの使用テキストに Claude Code 文書の抜粋を足した

`README.md` と `CLAUDE.md`: 名前、プリセットの一覧、起動時の既定を書き直した。

## 確かめたこと

- reviewer が 3 回見て、最後は要修正 0 件（`archives/agents/TODO-004/reviewer-report.md`）
- verifier が Playwright で、rss2json への通信を差し替えて実測した。全項目が期待どおりだった（`archives/agents/TODO-004/verifier-report.md`、スクリプトは `verify.mjs`）
  - 起動時の既定（ニュースまとめ・30 秒）、選択欄の順と value と `PRESETS` の対応、名前
  - 取得後の差し替え: 何もしなければ差し替わる。1 文字打った後、カスタムを適用した後は差し替わらない。`news-0` を選んでいれば選択はそのまま
  - カスタムを開いてキャンセルすると選択欄が `news-summary` に戻る。制限時間を 60 に変えられる

## 残ること

- カスタムの文章を表示している間も、選択欄は直前のお手本を指したまま（変更前からある。利用者の判断で今回は直さない）
- ニュースの表示中に結果画面の「次へ」を押すと、`PRESETS` の 2 番目へ進む（利用者の判断でそのまま）
- 起動時の取得でニュースの記事が減り、選んでいた `news-N` が消えると、その後カスタムを開いて閉じたときに選択欄が空白になる（条件が狭く、実害は未確認）

## 分担の振り返り

- **見つけたこと**: reviewer は 1 回目に README の書き漏らしと、既定の変更で表に出た既存のずれ（カスタムのキャンセル）を、2 回目に main の修正が入れた不具合（カスタム適用後の差し替え）を、Playwright で再現して見つけた。verifier は食い違いを見つけなかったが、CLAUDE.md の言い回しの重なりを拾った
- **見込みとの食い違い**: 担当の組み方は見込みどおり。ずれたのは回数で、利用者の指示が作業中に 3 回足され、reviewer が 3 回、verifier が 1 回止めてやり直しになった
- **次に同じ規模なら**: 組み方は同じでよい。利用者の指示が続いている間は verifier を起こさない（今回は並び替えの指示で止めた分が無駄になった）。修正のたびの再レビューは同じ reviewer に続けて頼むと、1 回あたり 5 万トークン前後で済んだ
