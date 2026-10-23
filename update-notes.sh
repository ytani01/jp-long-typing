#!/bin/bash
# リリースノートと CHANGELOG の訳を更新し、commit と push まで行う（TODO-034）
# 使い方: ./update-notes.sh [google]   引数が無ければ claude で訳す
set -euo pipefail
cd "$(dirname "$0")"

files=(index.html .claude/skills/update-release-notes/last-source.json)
by=${1:-claude}  # 正しい値かは notes.py の argparse が見る

# 手で直した分まで commit してしまわないように
if ! git diff --quiet HEAD -- "${files[@]}"; then
  echo "${files[*]} に commit していない変更がある" >&2
  exit 1
fi

work=$(mktemp --suffix=.json)
log=$(mktemp)
trap 'rm -f "$work" "$log"' EXIT
PYTHONUNBUFFERED=1 .claude/skills/update-release-notes/notes.py run --by "$by" "$work" | tee "$log"

git diff --quiet -- "${files[@]}" && exit 0

# 片方だけ変わったときは、変わった方だけをメッセージに書く（docs/update-release-notes.md の「終わったら」）
what='リリースノートと CHANGELOG の訳'
grep -q '^CLAUDE_NOTES: 変更なし' "$log" && what='CHANGELOG の訳'
grep -q '^CLAUDE_CODE_JA: 変更なし' "$log" && what='リリースノート'
git commit -m "chore(news): ${what}を $(date +%F) 時点に更新する" -- "${files[@]}"
git push
