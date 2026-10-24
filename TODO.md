# TODO

**残っている項目: TODO-037。** これまでに 36 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-038` から。**

---

## TODO-037. CachyOS のブログを練習文に足す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（設計）+ implementer（Sonnet / medium）+ reviewer（Opus / high）+ verifier（Haiku 5.5 / medium） |

- [ ] `notes.py` に CachyOS ブログの新しい 3 件の取得を足す（本文の全部。コードと表は外す）。変わった記事だけ訳す
- [ ] `index.html` に英語版と日本語版を埋め込み、練習文の選択欄に並べる
- [ ] `check` と `docs/update-release-notes.md` を合わせる（cron の更新にそのまま乗る）

**無駄を省く工夫:** 着手時に、本文を取る場所（`CachyOS/website` の Markdown のパス）と書式を先に実測してから設計する。
訳の経路（google → claude）と cron は TODO-035 で確かめ済みなので測り直さない

- 決まったこと: 英語と日本語の両方、新しい 3 件、本文の全部。RSS（`cachyos.org/rss.xml`）は題名とキーワードだけで本文が無く、CORS も無いので、ブラウザでは取らず埋め込む

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

