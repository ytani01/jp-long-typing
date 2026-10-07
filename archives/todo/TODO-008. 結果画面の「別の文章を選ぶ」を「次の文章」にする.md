# TODO-008. 結果画面の「別の文章を選ぶ」を「次の文章」にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 14 | 1,964 | 3,536 | 365,598 | 53% |
| verifier | Sonnet 5.5 | medium | 28 | 217 | 28,749 | 300,724 | 47% |
| 合計 |  |  | 42 | 2,181 | 32,285 | 666,322 | 計 700,830 |

- verifier は定義の `model: sonnet` のまま上書きしていない。見込みでは Sonnet 5 と書いたが、実際は Sonnet 5.5 で動いた

## きっかけ

結果画面のボタン「別の文章を選ぶ」は、押しても文章を選ぶ画面にならず、
選択欄の次のプリセットを読み込む（最後の次は先頭に戻る）。ラベルが動きと
合っていなかった。

## やったこと

- `index.html` の `#btn-result-next` の文言を「次の文章」にした。動きは変えていない

## 確かめたこと

verifier が Playwright で確かめた（`archives/agents/TODO-008/verifier-report.md`）。

- `archives/` 以外に旧文言が残っていない（`TODO.md` の見出しだけで、決着で消える）
- 結果モーダルでボタンの文言が「次の文章」で、2 つのボタンが重ならず、はみ出さない
- 押すと選択欄の値が 1 つ進み、モーダルが閉じる

## 分担の振り返り

- verifier は 3 項目とも一致を確かめた。不具合は見つからなかった
- 見込みとの差はモデルの版だけ（定義の `sonnet` が Sonnet 5.5 に解決された）
- 文言 1 行の変更でも、verifier の分が全体の約半分を占めた。次に同じ規模なら、
  確認を「旧文言の `rg` と、モーダルでの textContent・boundingBox」に絞り、
  クリックで次へ進む動作の確認（変えていないコード）は外す
