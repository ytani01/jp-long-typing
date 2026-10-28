# TODO-039 の分担

- implementer（Sonnet 5.5）: `notes.py` に NHK の取得と埋め込みを足し、`update-notes.sh` のメッセージと戻し方、文書を直した。手順が決まった実装なので Sonnet にした
- reviewer（Opus 5.5）: 失敗時の分岐と終了コード、ブラウザとの整形の一致、埋め込みの壊れ方を見る。分岐が変わる項目なので入れた
- verifier（Haiku 5.5）: 内蔵データの形と、取得失敗時のブラウザでの表示を Playwright で見る。`update-notes.sh` は流させない

報告: `implementer-report.md`・`implementer-report-2.md`・`reviewer-report.md`・`reviewer-report-2.md`・`verifier-report.md`
