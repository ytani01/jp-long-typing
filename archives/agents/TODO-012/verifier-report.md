# verifier 報告（TODO-012）

計測スクリプト: `archives/agents/TODO-012/verify.js`（Playwright 1.63、8080 は既に動いていたものを使用。外部通信は abort）。
変更ファイルは `TODO.md`、`index.html`（未追跡の `archives/agents/TODO-012/` は報告用）。指示の範囲内。コードは直していない。

## 食い違い

### 6. 統計パネルの右端がお手本のカードの右端と揃わない（NG）
1280x900 の実測:
- 最初の項目の左端 174、カードの左端 174 → 一致
- 最後の項目（ミス打鍵）の右端 948.66、カードの右端 1106 → 約 157px 足りない
- grid-template-columns は `145.328px` が 6 列。項目は 5 個で、6 列目が空いたまま
- 推定（未検証）: `.progress-bar-container` が `grid-column: 1 / -1` で全列にまたがるため、`auto-fit` が空の列を潰さず 6 列になる。結果、右に空きができ、項目が左に寄る
- 項目ごとの left/right: 174-319, 331-477, 489-634, 646-791, 803-949、プログレスバーは 174-1106
- 実害は未確認（見た目が左寄りになるだけ）。直すかどうかは管理者の判断

## 一致（1 行ずつ）
1. 誤入力 `X` で idx0 に `.miss`。computed は background `rgba(240, 116, 119, 0.89)`、color `rgb(251, 252, 253)`、box-shadow `rgb(248, 113, 113) 0px 0px 0px 2px`。transition の途中の値と見られる（実害は未確認）。空にすると miss は空。`あ` で確定すると idx1・入力欄空・miss なし
2. `あい\nうえ` に `あいX` を入れると idx3、入力欄 `X`、miss は [3]（「う」）。入力欄を `う` にすると idx4、入力欄空、miss なし
3. 制限時間 30 秒、`X` を入れたまま `page.clock.runFor(31000)` で isFinished=true、miss 0 件。`closeResultModal()` 後も miss 0 件
4. `#target-preview-text`・`.input-instruction` は DOM に無い。console error は `Failed to load resource: net::ERR_FAILED` 3 件だけ（route の abort による外部通信）。pageerror は無し
5. placeholder は「IMEをONにして入力すると計測が始まります」。390px では入力欄の `scrollWidth` 296 = `clientWidth` 296。ただし input の scrollWidth は placeholder を含まないので、文字幅も測った。placeholder の font-size は 13.6px、本文幅は 268.8px。入力欄のフォントでの幅 358.6px から換算すると約 265px で、3.8px の余裕がある。スクリーンショットでも欠けていない
   - 余裕が小さいので、フォントが変わる環境では欠ける可能性がある（実害は未確認）
6. （一致部分）進捗は `2/5` の形（初期値は `0/0`、読み込み後は `0/5`）
7. スクリーンショットを `~/tmp/playwright-mcp/todo012-1280.png` と `todo012-390.png` に保存して見た。欠け・重なり・余計な要素は無い。ただし 1280 では統計の項目が左に寄っている（上の 6 の件）。390 では 3 列 + 2 列で収まっている

## 判断できなかったこと
- 1 の背景色が `0.89` なのは transition の途中かどうか（時間を置いての再測定はしていない）

## 再確認（`repeat(5, 1fr)` に直した後、項目 6・7 のみ）
- 6: 一致。1280x900 で最初の項目の左端 174 = カードの左端 174、最後の項目の右端 1106 = カードの右端 1106。進捗は `2/5`
- 7: 一致。`todo012-1280.png`・`todo012-390.png` を撮り直して見た。1280 は 5 項目が幅いっぱいに並び、欠け・重なり・余計な要素は無い。390 は従来どおり 3 列 + 2 列で崩れていない
