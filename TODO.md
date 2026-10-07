# TODO

**残っている項目: TODO-017。** これまでに 16 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-018` から。**

---

## TODO-017. リリースノートの取得で、CORS の中継を順に試す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |

- [ ] 中継を複数並べ、失敗したら次を試す形にする
- [ ] 1 つの中継に待たされすぎないよう、時間の上限を見直す

Claude Platform リリースノート（`CLAUDE_NOTES_URL`）は、CORS ヘッダーを
返さないので `api.allorigins.win` を中継にしている。2026-10-08 に
allorigins が 500 やタイムアウトを返し、「Claudeニュースの取得に失敗した」
の alert が出た。CHANGELOG（raw.githubusercontent.com）は CORS を許して
いるので対象外。

同じ日に代わりを curl で試したが、`api.codetabs.com` は 503、
`corsproxy.io` は 401（キーが要る）で、どれも使えなかった。

**決めること:** どの中継を並べるか。着手時に各中継を測り直し、
使えるものが無ければ利用者に聞く（このまま待つか、見送るか）。

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

