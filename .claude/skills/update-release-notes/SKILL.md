---
name: update-release-notes
description: Claude Platform リリースノートの英語版を curl で取得し、新しい 3 日分を日本語に訳して index.html の CLAUDE_NOTES に埋め込む。リリースノートの練習文を新しくしたいとき、利用者の /update-release-notes で使う。
---

# リリースノートの埋め込み

リリースノートは CORS ヘッダーを返さないので、ブラウザでは取得しない。
この手順で `index.html` の `CLAUDE_NOTES` を書き換え、コミットと push で
反映する（TODO-017）。

訳と埋め込みだけの定期のデータ更新なので、TODO 項目は立てず、確認の
担当も分けない。下の「確かめる」を main が行ってコミットする。

```mermaid
flowchart LR
  A[curl で英語版を取得] --> B[新しい 3 日分を選ぶ] --> C[日本語に訳す] --> D[CLAUDE_NOTES を書き換える] --> E[ブラウザで確かめる] --> F[コミット]
```

## 1. 取得する

```bash
curl -sL --max-time 30 https://platform.claude.com/docs/en/release-notes/overview.md
```

日本語版（`/docs/ja/`）は英語版より遅れるので使わない。

## 2. 新しい 3 日分を選ぶ

- `### October 7, 2026` のような見出しが 1 つの更新。**同じ日付の見出しが
  続くことがある**ので、日付ごとにまとめ、新しい日付から 3 つ取る
- 各見出しの下の `* ` か `- ` で始まる箇条書きを、その日の項目にする
- 今の `CLAUDE_NOTES` と同じ 3 日分で、中身も変わっていなければ、
  何も変えずに終える

## 3. 訳す

- 1 日分を 1 つのオブジェクトにする

  ```js
  {
    "title": "2026年10月7日の更新",
    "author": "Claude Platform リリースノート",
    "text": "1 つ目の項目。\n2 つ目の項目。"
  }
  ```

- `text` は項目ごとに `\n` で区切る。項目の中では改行しない
- Markdown の記法は残さない。リンクは表示の文字だけにし、`**` や
  バッククォートは外す（`claude-haiku-5-5` のような識別子そのものは残す）
- 自然な日本語の「です・ます」調にする。モデル名、API・パラメーター名、
  エラーコード、製品名（Claude Managed Agents など）は訳さない
- 価格の `$0.10 USD` のような書き方は原文のまま残す
- 練習文として打つので、`<` `>` `{` `}` のような打ちにくい記号は、
  原文にあるときだけ残す（足さない）

## 4. 書き換える

- `index.html` の `const CLAUDE_NOTES = [` から対応する `];` までを
  置き換える
- その上のコメント `（YYYY-MM-DD 時点の内容）` を、取得した日に直す
- ほかの箇所は変えない

## 5. 確かめる

`python3 -m http.server 8080` で配信し、`node` から Playwright で
`http://localhost:8080/` を開く。

- コンソールにエラーが無い
- 練習文の選択欄に「・YYYY年M月D日の更新」が 3 つ並ぶ
- 「Claudeニュースまとめ」を選ぶと、3 日分が `【タイトル】本文` の形で出る

## 6. コミットする

```
chore(news): リリースノートを YYYY-MM-DD 時点に更新する
```

push は利用者が行う。
