# TODO

**残っている項目: TODO-039。** これまでに 38 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-040` から。**

---

## TODO-039. cron で内蔵の NHK ニュースも更新する

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / medium） |

- [ ] `notes.py` で NHK の RSS（`cat0.xml`）を直接取得し、`FALLBACK_NHK_NEWS` を最新 6 件で書き換える（訳さない）
- [ ] 整形はブラウザの `fetchNhkNews` に揃える（「見出し。\n要約（最後の「。」まで）」）
- [ ] `update-notes.sh` のコミットメッセージに、変わったときだけ「NHK ニュース」を入れる
- [ ] 取得に失敗したら NHK だけ更新せず、他の分は今までどおり進める

**無駄を省く工夫:** 訳の処理（claude / google）は変えないので確かめ直さない。確認は `notes.py` で NHK の分を 1 回流し、`index.html` の差分とブラウザでの表示を見るだけにする（push はしない）

- cron は毎朝 6:00。ニュースは毎日変わるので、ほぼ毎日 commit・push するようになる（承知のうえ）

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

