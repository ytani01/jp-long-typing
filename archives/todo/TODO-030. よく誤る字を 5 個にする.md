# TODO-030. よく誤る字を 5 個にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 28 | 2,941 | 35,902 | 625,827 | 63% |
| verifier | Haiku 5.5 | medium | 20 | 4,532 | 32,242 | 228,352 | 25% |
| reviewer | Opus 5.5 | high | 10 | 52 | 28,781 | 90,784 | 11% |
| 合計 |  |  | 58 | 7,525 | 96,925 | 944,963 | 計 1,049,471 |

- reviewer・verifier とも、Agent ツールでモデルと effort を定義と同じ値で指定した（定義との差は無い）

## きっかけ

履歴の分析の「よく誤る字」は上位 10 個を出していたが、多すぎるので 5 個に減らす。

## やったこと

- `index.html` の `missTop` を `slice(0, 10)` から `slice(0, 5)` にした
- 記録側（誤った字の上位 20 字の保存）は変えていない

## 確かめたこと

- reviewer: `missTop` の使い道はアドバイス文の `missTop[0]` と一覧の表示だけで、件数に依存しない。README・画面の説明文に 10 個を前提にした記述は無い
- verifier: 誤った字 8 種類（回数 9〜2）の履歴で 5 件（あ 9、い 8、う 7、え 6、お 5）、3 種類で 3 件出た。10 のままなら 8 件出るので、変更前なら落ちる確認になっている

## 分担の振り返り

- reviewer は指摘 0 件、verifier は件数と並びを実測で確かめた。見込みとの食い違いは無い
- 1 行の定数変更に reviewer（Opus / high）を入れたが、見たのは使い道 2 か所と文書の検索だけだった。次に同じ規模の定数変更なら、reviewer の依頼を「`rg` の結果の使い道だけ」と絞り、effort を medium に下げてよい
- verifier の output が main より多い。履歴の形を index.html から読み解く分で、依頼に localStorage のキーと記録の形を書いて渡せば減らせる
