# TODO-009 verifier 報告（2 回目、前回の確認項目は無効）

スクリプト: archives/agents/TODO-009/verify.mjs（node + Playwright、終了コード 0）。サーバー（8080）は停止済み。
スクリーンショット: ~/tmp/playwright-mcp/todo-009-1280.png、todo-009-375.png（補足: todo-009-*-custom.png、todo-009-375-input.png）。
変更ファイル: README.md、TODO.md、index.html（README.md の内容は確認対象外）。

## 食い違い（2 件、どちらも 375 幅）
1. **placeholder が欠ける。** 入力欄の scrollWidth 281 == clientWidth 281 で値は一致するが、input の placeholder は scrollWidth に出ない。実際の幅は canvas で測ると文字 331px に対して内側 254px で、はみ出す。
   スクリーンショット（todo-009-375-input.png）で「ここに入力を始めると計測が始」までしか見えず、「まります」が欠ける。1280 幅は文字 389px / 内側 851px で問題なし。
2. **label「練習文」が縦に 3 行へ割れる。** 375 幅で label の width 25.77、height 65.25（行高 21.76 の 3 行分）。「練 / 習 / 文」と縦に並ぶ（todo-009-375.png）。
   原因は推定: select が `max-width:100%` で幅いっぱいに広がり、label が押し縮められる。label が select の左の同じ行には並ぶ（label y 338-403、select y 354-387 で重なる）が、見た目は崩れている。実害（使えなくなるか）は未確認。

## 合っていたもの
- 1: `#article-title` と `.start-hint` は無い。header に `#preset-select` は無い。main の `.article-info` 内に label「練習文」と select がある（両サイズ）。
  1280 は label x 174-215、select x 221-672 で同じ行。`#article-author` は表示（1280: x 848-1106、375: x 24-282、幅 > 0）。
- 2: 1280 は select 右 671.8、`.preset-group` 右 671.8、main 右 1130、docSW 1280 <= 1280。375 は select 右 351、group 右 351、main 右 375、docSW 375 <= 375。前回 390 幅の 474.6 は直っている。
- 3: placeholder の文言は「ここに入力を始めると計測が始まります」（両サイズ）。欠けるのは上記 1 のとおり 375 のみ。
- 4: 「フォーカス維持」は本文に無く、footer 要素も無い（両サイズ）。
- 5: 題名 80 字（「あ」×80）のカスタムを適用。select の value が custom-text、選択肢の文字数 83（「✏️ 」+ 80 字 + 省略なし）。select 右端は 1280: 1106 <= main 1130、375: 351 <= 375、docSW も画面幅以内。
  練習文 4 を選んだ後に custom-text を選び直すと、本文先頭が「メロスは激怒した。必」から「カスタム本文のテスト」に戻った（両サイズ）。
- 6: insertText で「日」を 1 文字入れると stat-time が 00:30 から 00:28（2.2 秒後）へ動いた（両サイズ）。
- 7: pageerror は 0 件。
- スクリーンショット目視: 1280 は欠け・重なり・余計な表示無し。375 は上記 1・2 以外に問題無し（375 の画面は 812 高でスクロールが要り、入力欄は 1 枚目に入らないため別撮り）。

## 確かめなかったこと
- 色、ニュース取得、他のボタン（指示により除外）。

---
# 追記: 375 幅の 2 件の再確認（verify2.mjs、サーバー停止済み）

食い違いは残っていない。
- label 1 行: 375 幅で label 幅 40.8、高さ 21.75（1 行）。select の高さは 33.4 で、label の縦 344-366 は select の縦 338-372 の内側。label 右 64.8 < select 左 71.2 で左の同じ行。todo-009-375-info.png でも 1 行。
- select 右端 351 <= main 右端 375。docSW 375 <= 375 で横スクロール無し。
- placeholder 全文: ::placeholder の font（13.6px）で測った幅 244.7 <= 入力欄の内側 253.8（余り 9.1px）。todo-009-375-input.png で「ここに入力を始めると計測が始まります」が全部見える。余りは小さい（実害は未確認）。
- 1280 幅: ::placeholder の computed font-size は 21.6px（入力欄と同じ。375 幅は 13.6px）。幅 388.7 <= 内側 850.8。
