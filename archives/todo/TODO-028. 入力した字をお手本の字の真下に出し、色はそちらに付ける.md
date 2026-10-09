# TODO-028. 入力した字をお手本の字の真下に出し、色はそちらに付ける

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high、2 回）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 68 | 17,422 | 74,194 | 2,402,897 | 69% |
| reviewer | Opus 5.5 | high | 36 | 4,717 | 66,746 | 728,008 | 22% |
| verifier | Haiku 5.5 | medium | 26 | 6,117 | 40,988 | 300,075 | 10% |
| 合計 |  |  | 130 | 28,256 | 181,928 | 3,430,980 | 計 3,641,294 |

- 立ててから TODO-026・TODO-027 を先に済ませたので、TODO-027 のコミット時刻からの `--since` で集計した
- main の分には、途中で立てた TODO-029 のやり取りも入っている
- reviewer は再レビューで同じ担当に続けて頼んだ

## きっかけ

- 正誤をお手本の字の色で示していたので、何を打ったかが画面に残らなかった

## やったこと

- `index.html`
  - 各 `.char` に `.typed` の span を持たせ、確定した字を `.ok`（緑）/`.ng`（赤）で真下に出す
    - 抜かした字の下は空き、余計な字は直後の字の下に赤で詰める
  - お手本は済んだ字を薄い灰色にする（opacity でなく色で。opacity だと下の字まで薄くなる）。今の字の枠は残す
  - TODO-026 の `.char.done.missed`（お手本を赤くする表示）と `this.missed` を外した
  - 行の高さを 3→4（狭い画面 3.4→4.4）にし、`placeInput` は `.typed` の下に入力欄を置く
  - `.typed` は空でも高さを取り、余計な字の有無で入力欄の位置が変わらない

## 確かめたこと

- reviewer: `textContent` / `firstChild` に頼る箇所、改行・本文末尾を超えた入力の対応に問題なし。行末の手前で入力欄が打った字を隠す件などを直し、再レビューで解消を実測（`archives/agents/TODO-028/reviewer-report.md`）
- verifier: Playwright で 6 ケース（一致・抜かし・置き換え・余計な字・色・入力欄の位置）を実測し、すべて期待どおり（`archives/agents/TODO-028/verifier-report.md`）

## 分担の振り返り

- reviewer: 1 回目で、空の `.typed` が高さ 0 になり行末の手前で入力欄が打った字を隠す件（実測で 7〜9 字）、`opacity` が下の字にも効く件、入力欄の高さが確定ごとに変わる件を見つけた。2 回目で 3 点の解消を実測した
- verifier: 食い違いは見つけなかった。1 条件・6 ケースに絞った依頼で 1 回で済んだ
- 見込みとの食い違いは reviewer が 2 回になったことだけ。原因は main が行末の手前（入力欄が左に寄る位置）を自分で測らなかったこと
- 次に入力欄の位置を変える項目では、main の確認に行末の手前を入れる。そうすれば reviewer は 1 回で済む
