# TODO-006 verifier 報告（実測）

スクリプト: `archives/agents/TODO-006/verify.mjs`（Playwright、viewport 1280x800、外部は route で abort。CHANGELOG のみ自前の Markdown を返す）。pageerror は全ケースで 0 件。

## 1. 日本語（news-summary、フォールバック）: 一致
cleanText 331 字、`\n` 4 か所、不一致 0。直後の span は直前より下で、left は行頭（203）と同じ。
- i=107: 直前 top 389.19 / left 989.84、直後 top 434.94 / left 203（行頭 top 297.69 / left 203）
- i=108: 直前 top 389.19 / left 1013.69、直後 top 480.69 / left 203
- i=216: 直前 top 572.19 / left 966、直後 top 617.94 / left 203
- 注: 107 と 108 は `\n` が 2 連続（空行）。107 の「直後」は改行の span(108) 自身。測り方は指示どおりで、不一致にはならなかった。

## 2. 英文（claude-code、自前の CHANGELOG）: 一致
158 字、`\n` 2 か所、不一致 0。
- i=59: 直前 top 297.69 / left 983.28、直後 top 343.44 / left 203
- i=114: 直前 top 343.44 / left 916.02、直後 top 389.19 / left 203
- 注: CHANGELOG が実物でなく自前の応答。行は短く、`\n` の位置は固定。

## 3. 入力: 一致
改行（107）の直前まで insertText → currentIndex=107（改行の span が active、isLinebreak=true）。
続けて 109 の文字（108 も `\n` なので最初の非改行）を insertText → currentIndex=110、active は 110。
改行を 107・108 の 2 つとも飛ばして進んだ。
active（110）の top 391.69 は 109 の top 391.69 と同じ。106 の top は 300.19 で、109 は 106 より 91.5 下（=2 行分）の、次の行にある（スクロール後の座標）。

## 4. 見た目（画像を見た）
- `before-linebreak.png`（改行の span が active）: 行末「ます。」の右に、縦長の細い枠が 1 つ出ている。四辺とも欠けていない。幅は細いが輪郭は見える。余計な文字や記号は映っていない。次行頭に「↵」のような表示も無い。
- `after-linebreak.png`（改行の直後が active）: 「ニ」の文字を囲む枠が欠けずに出ている。余計なものは映っていない。上の行は枠なしで空行が 1 行ある（`\n` 2 連続のため）。
- 判断: 枠の欠け・見えなさ・余計な表示は見当たらない。

## 判断が要る点・確かめられなかったこと
- 実際の NHK / CHANGELOG 取得時の内容では測っていない（フォールバックと自前データのみ）。
- 他の画面幅、`\n` 直前が折り返し位置にあるケースは測っていない。実害は未確認。
