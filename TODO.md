# TODO

**残っている項目: TODO-015、TODO-016。** これまでに 14 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-017` から。**

---

## TODO-015. お手本で行の頭に句読点が来ないようにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5.5 / medium） |

- [ ] 「。」「、」や閉じかっこなどを、直前の文字と一緒に折り返す（行の頭に来ないようにする）

お手本は 1 字ずつ `inline-block` の span なので、ブラウザの禁則処理が効かない。
TODO-014 で英字の文字間隔を詰めたあと、1280px の既定の文章で「。」が行の頭に来た。
英単語をまとめる `.word`（TODO-005）や改行（TODO-006）との組み合わせに気を付ける。

---

## TODO-016. IME の ON/OFF に触れないようにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ verifier（Sonnet 5.5 / medium） |

- [ ] 入力欄の placeholder、内蔵の練習文（アプリの説明）、`README.md` から、IME を ON にする旨の記述を削る

IME を ON にするかは利用者が判断することなので、アプリと文書では言及しない。
文言だけの変更で分岐は変わらないので、reviewer は入れない。

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

