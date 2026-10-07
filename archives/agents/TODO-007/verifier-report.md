# TODO-007 verifier 報告

## 1. 静的な突き合わせ（PRESETS[0].text と README）
全文が README と一致。食い違い・README に無い主張は無し。
- 単一 HTML・外部ライブラリ/ビルド不要: README 冒頭と一致
- IME・文節や句読点ごとの確定、全角半角の判定: 一致
- 取得元（Claude Platform リリースノート・Claude Code CHANGELOG）、起動時と「ニュース更新」で取得、失敗時は内蔵データ: 一致
- お手本の種類（Claude/NHK/Claude Code 抜粋/青空文庫/貼り付け）: 一致
- 制限時間 30秒/1分/3分/5分/無制限: 一致
- 測る項目（経過時間・CPM・進捗率・正確率・ミス打鍵数）: 一致
- ランク SS/S/A/B/C: README と一致（index.html 1617-1621 行の閾値も表と一致。文章は閾値を書いていない）
- ダークモード/ライトモード、打鍵音・確定音の Web Audio API: 一致
- README の差分 2 行（プリセットに 1 行、起動時の既定）: 実装と一致（実測は下）

## 2. 実測（archives/agents/TODO-007/verify.mjs、1280x800、外部通信は abort）
- 起動 1.5 秒後: value="0"、選択中 option="日本語長文タイピングの特徴"、#article-title="日本語長文タイピングの特徴"、cleanText 先頭 20 字="日本語長文タイピングは、ブラウザで開くだ"、改行 4 個（全 501 字）、pageerror []
- 選択欄の先頭 option: value="0"、"日本語長文タイピングの特徴"（一致）
- insertText で先頭 10 字「日本語長文タイピング」: currentIndex=10、mistakesCount=0（一致）
- value=1 → タイトル「Claude Code 概要」、value=6 → 「羅生門」（一致）
- スクリーンショット: archives/agents/TODO-007/startup.png（見ていない。撮影のみ）

## 変更ファイル
README.md、TODO.md、index.html（未コミット）と archives/agents/TODO-007/ の新規。指示の範囲内。
index.html の差分は option 追加（optgroup「このアプリ」）、value の 1 ずつの繰り下げ、PRESETS[0] 追加、起動時の `loadClaudeSummary()` を `loadArticle(PRESETS[0], '0')` に置換のみ。

## 確かめていないこと・判断が要る点
- verify.mjs の初回は miss の取得にプロパティ名の推測（正規表現）を使い空配列になった。`mistakesCount` に直して再実測済み（上の値）。
- 境界線上: `loadClaudeSummary` が起動以外から呼ばれているか、PRESETS の添字（'0'、1〜6）に依存する他の箇所が無いかは、指示に無いので調べていない。
- 起動時に Claude ニュースまとめを既定にしなくなったことで、`fetchClaudeNews` 完了後の表示が既定の選択を上書きしないかは、外部通信を abort した条件でしか見ていない。
