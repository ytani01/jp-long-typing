# TODO-013 verifier 報告

手段: `archives/agents/TODO-013/verify.js`（Playwright、8080 は既に動いていたものを使用。止めていない）。コードは変更していない。

- 1 一致: `.controls-bar` の子は btn-fetch-news / controls-sep / time-limit-select / btn-sound / btn-theme。ヘッダーに `#btn-restart` 無し。親は `.input-field-wrapper`。
  リセット top 813.8125 / bottom 867、入力欄 top 813.8125 / bottom 867（一致）。入力欄 right 964.9 < リセット left 976.9（右隣）。
- 2 一致: 「あいう」入力で進捗 3/10 → リセット押下後 0/10、currentIndex 0、入力値 空、`document.activeElement.id` = typing-input。
- 3 一致: select の背景は rgba(0, 0, 0, 0)（ライト・ダークとも）。
  - ダーク: select 文字 rgb(226, 232, 240) / option 文字 rgb(226, 232, 240) / option 背景 rgb(27, 32, 44)
  - ライト: select 文字 rgb(15, 23, 42) / option 文字 rgb(15, 23, 42) / option 背景 rgb(255, 255, 255)
  - 補足: テーマ切替直後は border に transition があり旧色が読める。500ms 待って測った値を載せた。
  - 注意: option の背景は Playwright では computedStyle の確認のみ。ドロップダウン自体の描画は headless では撮れず、見ていない。
- 4 一致: 390x844 でリセット top 778.1 > 入力欄 bottom 766.1（下の行）、left 45（入力欄と左端が揃う）。
  入力欄 clientWidth 296（TODO-012 の報告と同じ）、scrollWidth 296。placeholder はスクリーンショットで欠けていない。
  `.controls-sep` は display: none。横スクロール無し（documentElement.scrollWidth 390）。
- 5 注意: コンソールエラーは 3 件、すべて `Failed to load resource: net::ERR_FAILED`。route で外部通信を abort したためで、JS の例外（pageerror）は 0 件。
- 6 一致: todo013-1280-dark.png / todo013-1280-light.png / todo013-390.png を目視。欠け・重なり・余計なものは無い。
  区切りは 1 本。ライトは切替後 500ms 待った画像で確認（待たないと transition 途中の色が写る）。

## 変更ファイル
`git status`: M TODO.md、M index.html、?? archives/agents/TODO-013/。index.html の差分は区切り・select・リセット移動・狭い画面の折り返しのみで、指示の範囲と合う。

## 確かめていないこと・判断
- option のドロップダウンを実際に開いた見た目（headless では撮れない）。実害は未確認。
- 判断が要る点は無い。
