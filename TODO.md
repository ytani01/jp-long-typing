# TODO

**残っている項目: TODO-006、TODO-007。** これまでに 5 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-008` から。**

---

## TODO-006. お手本の改行を画面でも改行にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |

- [x] 改行の span（`.char.linebreak`）の後ろの文字が、次の行の先頭に出るようにする
- [ ] 日本語のお手本（NHK まとめ）と英文（Claude Code の CHANGELOG）の両方で、改行の前後の位置を測って確かめる

TODO-005 の確認で見つけた（2026-10-07）。`.char.linebreak` は `inline-block` で幅 0 のため、
`::after` の `"\A"` が span の中で改行するだけで、外の行は改行しない。変更前の index.html でも
NHK まとめの `。【ニュース2】` が同じ行に続いていた。

---

## TODO-007. アプリの特徴を説明する文章をプリセットに足す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ verifier（Sonnet / medium） |

- [ ] 「日本語長文タイピング」の特徴を文章にしたお手本を `PRESETS` に足し、選択欄に出す
- [ ] `README.md` の「長文プリセット内蔵」にその 1 行を足す

利用者の依頼（2026-10-07）。README は箇条書き、お手本は文章にし、中身は README と食い違わないようにする。
プリセットの一つとして足し、起動時の既定（Claude ニュースまとめ）は変えない。
文章の追加だけで分岐は変わらないので reviewer は入れない。verifier には、お手本の文章と README の
突き合わせと、選択して表示・入力できることを見させる。

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

