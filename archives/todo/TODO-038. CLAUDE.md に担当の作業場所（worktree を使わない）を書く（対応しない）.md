# TODO-038. CLAUDE.md に担当の作業場所（worktree を使わない）を書く（対応しない）

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main のみ |
| 実施 | Opus 5.5 / effort medium | main のみ |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 10 | 731 | 3,295 | 288,461 | 100% |
| 合計 |  |  | 10 | 731 | 3,295 | 288,461 | 計 292,497 |

## きっかけ

- `~/.claude/CLAUDE.md` の TODO-043（07dcd54）で、worktree の作り方・取り込み方はプロジェクトの `CLAUDE.md` に書くことになった
- このプロジェクトでは worktree を使わない（担当は 1 人ずつトップの作業ツリーで動かす）と書く項目として立てた

## やらないと決めた理由

- `~/.claude/CLAUDE.md` の TODO-044（e18009d）で、worktree を使わないのが全体の既定になった
- このプロジェクトは worktree を使う基準（実装の並行、トップの作業ツリーを途中の状態にできない、生成物の衝突）のどれにも当たらないので、プロジェクトの `CLAUDE.md` には何も書かない
- 並行させたくなったら、そのときに meltype-fcitx5-dev の `CLAUDE.md` の形に合わせて足す
