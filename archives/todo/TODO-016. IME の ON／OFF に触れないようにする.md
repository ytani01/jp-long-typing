# TODO-016. IME の ON/OFF に触れないようにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ verifier（Sonnet 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 10 | 1,250 | 3,144 | 248,243 | 60% |
| verifier | Sonnet 5.5 | medium | 16 | 92 | 19,698 | 150,269 | 40% |
| 合計 |  |  | 26 | 1,342 | 22,842 | 398,512 | 計 422,722 |

- ファイル名は、見出しの `/` がパスの区切りになるので全角の `／` にした

## きっかけ

IME を ON にするかは利用者が判断することなので、アプリと文書では言及しない、と利用者から指示があった。

## やったこと

- `index.html` の入力欄の placeholder を「入力すると計測が始まります」にした
- `index.html` の内蔵のアプリの説明文から「IME をオンにしたまま、」を削った
- `README.md` の主な特徴を「入力・変換・確定をくり返して長文を打ち進める…」にした

## 確かめたこと

verifier が `README.md` と `index.html` に `IME` の語が残っていないこと、placeholder と説明文の表示、コンソールにエラーが無いことを Playwright で確かめた（[報告](../agents/TODO-016/verifier-report.md)）。

## 分担の振り返り

- verifier は食い違いを見つけなかった。サーバーを kill したときに自分のシェルが終了コード 144 で落ちた（サーバーは止まった）
- 見込みどおりの分担で、食い違いは無い
- 次に同じ規模の文言だけの項目をやるなら、同じく main の実装と Sonnet の verifier 1 回で組む。Playwright での確認は placeholder の読み出しだけで足りるので、説明文は `rg` での確認に留めてよい
