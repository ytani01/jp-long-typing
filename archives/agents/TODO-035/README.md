# TODO-035 の分担

- main: `notes.py` の `--by` を並べられるようにし、`docs/update-release-notes.md` に crontab の設定例を書いた
- reviewer: 訳し直しの分岐と、crontab の例が cron（`/bin/sh`）で意図どおり動くかを見る。分岐が変わる項目なので入れた
- verifier: 訳し直しを関数の差し替えで実測し、cron と同じ環境で必要なコマンドと SSH が通るかを見る。commit・push はさせない
