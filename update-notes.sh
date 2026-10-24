#!/bin/bash
# リリースノートと CHANGELOG の訳を更新し、commit と push まで行う（TODO-034）
# 使い方: ./update-notes.sh [google|google,claude]   引数が無ければ claude で訳す
# google,claude のように並べると、落ちたら index.html などを戻して次で流し直す（TODO-035）
set -euo pipefail
cd "$(dirname "$0")"

files=(index.html .claude/skills/update-release-notes/last-source.json)
IFS=, read -ra bys <<< "${1:-claude}"
# 綴りを間違えると argparse で落ち、黙って次の訳し方に移ってしまうので先に止める
for b in "${bys[@]}"; do
  [[ $b == claude || $b == google ]] || { echo "訳し方は claude か google: $b" >&2; exit 1; }
done

# 手で直した分まで commit してしまわないように
if ! git diff --quiet HEAD -- "${files[@]}"; then
  echo "${files[*]} に commit していない変更がある" >&2
  exit 1
fi

work=$(mktemp --suffix=.json)
log=$(mktemp)
trap 'rm -f "$work" "$log"' EXIT
for i in "${!bys[@]}"; do
  PYTHONUNBUFFERED=1 .claude/skills/update-release-notes/notes.py run --by "${bys[i]}" "$work" | tee "$log" && break
  # check で落ちると apply の書いた分が残り、次の run が「変更なし」で終わってしまう
  git checkout HEAD -- "${files[@]}"
  (( i + 1 < ${#bys[@]} )) || exit 1
  echo "${bys[i + 1]} で流し直す" >&2
done

git diff --quiet -- "${files[@]}" && exit 0

# 片方だけ変わったときは、変わった方だけをメッセージに書く（docs/update-release-notes.md の「終わったら」）
what='リリースノートと CHANGELOG の訳'
grep -q '^CLAUDE_NOTES: 変更なし' "$log" && what='CHANGELOG の訳'
grep -q '^CLAUDE_CODE_JA: 変更なし' "$log" && what='リリースノート'
git commit -m "chore(news): ${what}を $(date +%F) 時点に更新する" -- "${files[@]}"
git push
