# TODO-032 の分担

- main: 実装（notes.py の translate / run、SKILL.md と README の書き換え）。1 ファイルの追加が中心で、分けるほどの規模ではない
- reviewer（Opus / high）: 挙動が変わる（run の分岐、失敗時に何も書かない条件）のでレビューを入れる
- verifier（Haiku 5.5 / medium）: 実際に run を claude / google で 1 回ずつ流し、失敗時の挙動を確かめる。reviewer の後に回す
