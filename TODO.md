# TODO

**残っている項目: TODO-020。** これまでに 19 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-021` から。**

---

## TODO-020. Claude Code の CHANGELOG の日本語版を埋め込む

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |

- [ ] `index.html`: `CLAUDE_CODE_JA`（最新 3 版の訳）を足し、選択欄の英語版の後に
      「・Claude Code 2.1.xxx（日本語）」を 3 つ並べる
- [ ] 英語版はこれまでどおりブラウザで取得する。「Claudeニュースまとめ」には入れない
- [ ] `update-release-notes` skill に CHANGELOG の取得・訳・埋め込みの手順を足す
- [ ] 既定の練習文の説明、`README.md`、`CLAUDE.md` の記述を直す

利用者と決めたこと: 英語版は残す / 日本語版は最新 3 版 / まとめには含めない

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

