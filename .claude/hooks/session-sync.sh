#!/bin/bash
# SessionStart: origin/master と比べ、遅れていれば「先に pull」、先に進んでいれば「cron は見送り中」を知らせる。どちらでもなければ何も出さない（TODO-041）
st=$("${CLAUDE_PROJECT_DIR:-.}/githooks/sync-state.sh") || exit 0
read -r behind ahead <<< "$st"
msg=
(( behind == 0 )) || msg="origin/master より ${behind} 件遅れている。先に git pull する。"
(( ahead == 0 )) || msg+="未 push のコミットが ${ahead} 件ある。push するまで cron の更新（update-notes.sh）は見送られる。"
[[ -n $msg ]] || exit 0
printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$msg" "$msg"
