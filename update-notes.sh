#!/bin/bash
# リリースノート・CHANGELOG・CachyOS ブログの訳と、内蔵の NHK ニュースを更新し、commit と push まで行う（TODO-034）
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
failed=1
for i in "${!bys[@]}"; do
  PYTHONUNBUFFERED=1 .claude/skills/update-release-notes/notes.py run --by "${bys[i]}" "$work" | tee "$log" && { failed=0; break; }
  # check で落ちると apply の書いた分が残り、次の run が「変更なし」で終わってしまう
  git checkout HEAD -- "${files[@]}"
  (( i + 1 < ${#bys[@]} )) || break
  echo "${bys[i + 1]} で流し直す" >&2
done

# run が落ちた日も、訳と関係の無い NHK ニュースだけは更新して commit する。終了コードは 1 のまま（TODO-039）。
# ページを壊す内容だったときのために、check が落ちたら NHK も戻す
if (( failed )); then
  echo "NHK ニュースだけ更新する" >&2
  { .claude/skills/update-release-notes/notes.py nhk | tee "$log" && .claude/skills/update-release-notes/notes.py check; } \
    || git checkout HEAD -- "${files[@]}"
fi

# 取得できず更新しなかったものがあれば、取れた分の commit・push を済ませてから 0 以外で終わる（TODO-037）
skipped=$failed
grep -q ': 取得できず更新しなかった' "$log" && skipped=1
git diff --quiet -- "${files[@]}" && exit "$skipped"

# 変わったものだけをメッセージに書く（docs/update-release-notes.md の「終わったら」）。
# 名前は notes.py が出す「<const 名>: 変更なし」「<const 名>（…）: 取得できず更新しなかった…」の行で判定する
what=
# 落ちた日は log に NHK の行しか無いので、訳の分は入れない
(( failed )) || for pair in CLAUDE_NOTES:リリースノート "CLAUDE_CODE_JA: CHANGELOG " "CACHYOS_JA: CachyOS ブログ"; do
  grep -Eq "^${pair%%:*}(（.*）)?: (変更なし|取得できず更新しなかった)" "$log" || what+="${what:+と}${pair#*:}"
done
what=${what# }  # 英数字の前後の半角空白のうち、先頭の分は外す
# NHK ニュースは訳ではないので、「の訳を」の前には入れない（TODO-039）
nhk=NHK\ ニュース
grep -Eq "^FALLBACK_NHK_NEWS(（.*）)?: (変更なし|取得できず更新しなかった)" "$log" && nhk=
if [[ -z $what ]]; then
  msg="${nhk}を"
else
  msg="${what}の訳を"
  [[ -z $nhk ]] || msg="${nhk}と、${msg}"
fi
git commit -m "chore(news): ${msg} $(date +%F) 時点に更新する" -- "${files[@]}"
git push
exit "$skipped"
