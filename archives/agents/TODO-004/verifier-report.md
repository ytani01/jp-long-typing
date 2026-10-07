# TODO-004 verifier 報告（差分更新後の再実測）

手段: `archives/agents/TODO-004/verify.mjs`（Playwright、Chromium 1280x800、rss2json を route で差し替え）。終了コード 0。コードは変更していない。

## 結果

- 1 取得失敗で起動: 一致。sel=`news-summary`、時間の選択欄=`30`、`app.timeLimit`=30、残り表示 `00:30`、題「NHK主要ニュースまとめ」
- 2 optgroup の順と value: 一致。NHK(news-*) → Claude Code(0〜2) → 文学名作(3〜5) → カスタム。0・2・3・5 を選ぶと題が `PRESETS[v].title` と一致、本文も `PRESETS[v].text.trim()` と完全一致
- 2' 名称: 一致。`document.title`=`h1`=「日本語長文タイピング」。HTML 全体に「速打」「Hayauchi」なし
- 3a 一致。2 秒遅れの取得後、本文が「【ニュース1】記事AAA。…【ニュース2】記事BBB…」に変わった
- 3b 一致。1 文字打った後は取得後も本文は元のまま（startTime あり）
- 3c 一致。カスタム適用後は取得後も「マイ」のまま
- 3d 一致。`news-0` を選んでおくと取得後も `news-0`、本文も同じ
- 4 一致。起動直後にカスタムを開いてキャンセルすると `news-summary`
- 5 一致。制限時間 60 で `app.timeLimit`=60、選択欄も 60
- 6 README/CLAUDE.md 読み合わせ: README のプリセット一覧（Claude Code 3 本、青空文庫 3 本）と既定（NHK まとめ・30 秒）は実装と一致。README 内に旧名なし

## 変更ファイル（git diff --stat）
CLAUDE.md、README.md、TODO.md、index.html。指示の範囲内（TODO.md は項目の記録）。

## 気づいた点（境界線上。実害は未確認）
- CLAUDE.md 1 行目が「日本語長文タイピング練習アプリ「日本語長文タイピング」。」と、名前の重複で読みにくい
- 3c: カスタム適用後、選択欄の値は `news-summary` のまま（表示はカスタムの文章）。`closeCustomModal()` が `loadArticle()` の前に選択欄を戻すため。変更前も同様に別の値へ戻っていたはずだが、変更前は未測定

## 確かめられなかったこと
- 変更前に戻してテストが落ちるか: テストが無い項目のため未実施
