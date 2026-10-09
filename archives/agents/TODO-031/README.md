# TODO-031 の分担

| 担当 | モデル | 担当したこと |
|------|--------|--------------|
| main | Opus 5.5 | `notes.py` と `SKILL.md` の実装 |
| reviewer | Opus 5.5 / high | 差分のレビュー（[reviewer-report.md](reviewer-report.md)） |
| verifier | Sonnet 5.5 / medium | `notes.py` の 3 つのコマンドを実際に動かして確かめる（[verifier-report.md](verifier-report.md)） |

- スクリプトは 1 本で小さいので、実装は main が行った
- 変更の有無の判定や、訳の数の検査といった分岐があるので reviewer を入れた
- verifier は定義では Haiku。壊したときに落ちるかを、状況を作って確かめる必要があるので Sonnet 5.5 に上書きした
- reviewer を先、verifier を後に回す
