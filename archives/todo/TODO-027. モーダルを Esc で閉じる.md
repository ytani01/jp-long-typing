# TODO-027. モーダルを Esc で閉じる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 56 | 9,643 | 57,120 | 1,658,389 | 73% |
| verifier | Haiku 5.5 | medium | 32 | 4,910 | 60,993 | 427,639 | 21% |
| reviewer | Opus 5.5 | high | 10 | 53 | 30,880 | 101,772 | 6% |
| 合計 |  |  | 98 | 14,606 | 148,993 | 2,187,800 | 計 2,351,497 |

- 立ててから着手まで TODO-026 などが挟まったので `--since '2026-10-10 01:50:00'`（このセッションの開始）で切った
- 同じセッションで ~/.claude の TODO-034 も並行して進めたので、main と verifier にはその分も混ざっている
- reviewer は定義が `opus` / `high`、verifier は `haiku` / `medium`。Agent ツールで同じ値を明示した

## きっかけ

- 結果・自作テキスト・履歴のモーダルは × ボタンでしか閉じられなかった

## やったこと

- `index.html`: window の keydown を capture で受け、開いているモーダルを Esc で閉じる（× と同じ `closeXxxModal` を呼ぶ）。`stopPropagation` で入力欄の Esc（リセット、TODO-022）まで届かせない。変換中（`isComposing` / `keyCode 229`）は IME に任せる
- 入力欄の Esc は `e.repeat` を見ないようにした。モーダルを Esc で閉じたあと押しっぱなしにすると、キーリピートでリセットが動くため（reviewer の指摘）

## 確かめたこと

- verifier が Playwright で実測（`archives/agents/TODO-027/verifier-report.md`）。3 つのモーダルが Esc で閉じる、結果を閉じても入力はリセットされない、自作テキスト・履歴を閉じるとフォーカスが入力欄へ戻る、変換中の Esc では閉じない、モーダルが無いときの Esc は従来どおりリセットし `repeat` ではしない、をすべて確かめた

## 残ること

- 結果を Esc で閉じたあとは入力欄にフォーカスが残るので、もう一度 Esc でリセットになる（× をクリックしたときはならない）。Esc 2 回でやり直せる動きとして、そのままにした

## 分担の振り返り

- reviewer: 長押しのキーリピートでリセットが動く件と、結果を閉じたあとの 2 回目の Esc の件を見つけた。前者を直した
- verifier: 6 項目すべて一致。`app.finish()` を直接呼ぶとフォーカスが body に外れることを見つけた（実際に打ち終えたときは未確認）
- 見込みと食い違いは無かった
- 次に同じ規模（1 か所のイベント処理）なら同じ組み方でよい。verifier の依頼にはキーリピートのような reviewer の指摘を含められるよう、reviewer を先に終えてから依頼を書く今の順を保つ
