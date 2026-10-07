# TODO

**残っている項目: TODO-005、TODO-006。** これまでに 4 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-007` から。**

---

## TODO-005. 「ニュース更新」で Claude Platform のリリースノートも取得する

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |

- [ ] 使える公開の CORS プロキシを実測で選ぶ（着手時に、取得できるか・応答の形を測る）
- [ ] 「ニュース更新」と起動時の取得で、`https://platform.claude.com/docs/ja/release-notes/overview.md`
      を取得し、新しい日付から数件をお手本にして選択欄に新しい optgroup で出す
- [ ] 取得に失敗したときは内蔵のフォールバックを使う（`FALLBACK_NHK_NEWS` と同じ考え方）
- [ ] 選択欄の先頭（NHK ニュースの上）に「Claude ニュース」として出し、起動時の既定を
      Claude ニュースのまとめにする（NHK まとめから切り替える。起動時の取得後の
      差し替えも Claude ニュースのまとめで行う）
- [ ] Claude Code の最新版の変更点も取得する。`https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md`
      の先頭の版（`## 2.1.292` など）の項目を英文のままお手本にし、「Claude ニュース」の
      optgroup に入れる（CORS を許しているのでプロキシは通さない。失敗時は内蔵のフォールバック）
- [ ] README.md に書き足す

利用者の依頼（2026-10-07）。Claude 公式で日本語の取得元はこのリリースノートだけで、
Anthropic のニュース（英語のみ・RSS 無し）は入れないと利用者が決めた。Claude Code の
CHANGELOG は日本語版が無い（`code.claude.com/docs/ja/changelog.md` は GitHub へ転送される）が、
英語のまま入れると後から決めた（2026-10-07）。リリースノートは CORS を許していないので、公開の CORS
プロキシを経由する（利用者が選んだ）。Markdown のリンク・コード・表記をどこまで
整えて打ちやすくするかは、着手時に実物を見て決める。

---

## TODO-006. お手本の改行を画面でも改行にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus / high）+ verifier（Sonnet / medium） |

- [ ] 改行の span（`.char.linebreak`）の後ろの文字が、次の行の先頭に出るようにする
- [ ] 日本語のお手本（NHK まとめ）と英文（Claude Code の CHANGELOG）の両方で、改行の前後の位置を測って確かめる

TODO-005 の確認で見つけた（2026-10-07）。`.char.linebreak` は `inline-block` で幅 0 のため、
`::after` の `"\A"` が span の中で改行するだけで、外の行は改行しない。変更前の index.html でも
NHK まとめの `。【ニュース2】` が同じ行に続いていた。

---

## 完了済み

決着した項目は `archives/todo/` に置く（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。

- [TODO-002. NHKニュース自動取得機能と時間制限モード（30秒／1分／3分／5分）を追加する](archives/todo/TODO-002.%20NHK%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%B9%E8%87%AA%E5%8B%95%E5%8F%96%E5%BE%97%E6%A9%9F%E8%83%BD%E3%81%A8%E6%99%82%E9%96%93%E5%88%B6%E9%99%90%E3%83%A2%E3%83%BC%E3%83%89%EF%BC%8830%E7%A7%92%EF%BC%8F1%E5%88%86%EF%BC%8F3%E5%88%86%EF%BC%8F5%E5%88%86%EF%BC%89%E3%82%92%E8%BF%BD%E5%8A%A0%E3%81%99%E3%82%8B.md)
- [TODO-001. 長文タイピング練習ソフトのHTML1ファイルを実装する](archives/todo/TODO-001.%20%E9%95%B7%E6%96%87%E3%82%BF%E3%82%A4%E3%83%94%E3%83%B3%E3%82%B0%E7%B7%B4%E7%BF%92%E3%82%BD%E3%83%95%E3%83%88%E3%81%AEHTML1%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%82%92%E5%AE%9F%E8%A3%85%E3%81%99%E3%82%8B.md)
