# TODO-008 verifier-report

結果: 3 項目とも一致。

- git status: `TODO.md`、`index.html` が変更。`index.html` の差分は `#btn-result-next` の文言 1 行のみ（指示どおり）
- 項目 1: `rg -n '別の文章を選ぶ' . -g '!archives'` の一致は `./TODO.md:9`（項目の見出し）だけ。`index.html` や他のファイルに旧文言は無い
- 項目 2: 1280x800、`app.cleanText`（改行除く）を `insertText` で入れて結果モーダルを表示（`active=true`）
  - `#btn-result-next` textContent = 「次の文章」、`isVisible()` = true、visibility = visible
  - 並び（boundingBox）: next x=643.94 w=85.16（右端 729.09）、retry x=741.09 w=142.72（右端 883.81）。間隔 12px で重ならない
  - 親 `.modal-actions` x=396.19〜883.81、カード x=360〜920。両ボタンとも内側で、はみ出さない
- 項目 3: クリック前の `#preset-select` = '0'、クリック後 = '1'、`#result-modal` の `active` = false（閉じた）
- 確かめられなかったこと・判断が要る点: 無し
- 測定スクリプト: scratchpad の `t.js`（Playwright 1.63.0）。`app.cleanText` を使ったのは、`PRESETS[0].text` では整形差で完走しなかったため（測定上の話で、アプリの不具合かは未確認）
