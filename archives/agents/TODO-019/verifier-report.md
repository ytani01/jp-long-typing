# TODO-019 verifier 報告

手段: 既に 8080 で配信中だった `python3 -m http.server`（cwd は本リポジトリ、PID 456539）を使用。
自分では起動していないので止めていない。`verify.mjs`（Playwright 1.x、`~/.npm/_npx/...` のものを絶対パスで import）を 1 回実行。

1. 一致 optgroup: このアプリ(0) / Claudeニュース / NHKニュース / 文学名作(1 走れメロス, 2 吾輩は猫である, 3 羅生門) / カスタム。
   「Claude Code ドキュメント」optgroup、概要・クイックスタート・一般的なワークフローは無し。
2. 一致 value 0〜3 の作者・冒頭:
   - 0 日本語長文タイピング / 「日本語長文タイピングは、ブラウザで開く…」
   - 1 太宰治 / 「メロスは激怒した。必ず、かの邪智…」
   - 2 夏目漱石 / 「吾輩は猫である。名前はまだ無い。…」
   - 3 芥川龍之介 / 「ある日の暮方の事である。一人の下人が、羅生門の…」
3. 一致 value 3 の全文を insertText で入力 → 結果画面「🎉 制限時間内にクリア！」、btnResultNext 表示。
   押した後 select.value = "0"、表示は「日本語長文タイピング （文字数: 464字）」「日本語長文タイピングは、…」。
4. console error は 1 件: `Failed to load resource: net::ERR_HTTP2_PROTOCOL_ERROR`
   （外部ニュース取得の失敗と推定。ネットワーク取得の成否は問わない指示のため対象外。JS の例外・pageerror は 0 件）。

食い違い: なし。
判断が要る点: なし（実害は未確認だが、上記の network error は本差分と無関係と推定）。
