# TODO-030 の分担

- main: 実装（`missTop` の `slice(0, 10)` → `slice(0, 5)` の 1 行）
- reviewer（Opus 5.5 / high）: `missTop` の使い道と、10 個を前提にした記述が残っていないかを見る。報告は [reviewer-report.md](reviewer-report.md)
- verifier（Haiku 5.5 / medium）: 履歴を localStorage に入れ、`verify.mjs` で「よく誤る字」の件数と並びを読み出す。報告は [verifier-report.md](verifier-report.md)

件数を決める条件が変わるので、規則どおり reviewer を入れた。
