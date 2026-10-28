#!/bin/bash
# TODO-041 確認: pre-commit と SessionStart の警告・commit が止まらないこと・fetch の上限 5 秒を、
# 一時ディレクトリの bare リポジトリを origin にした clone で確かめる（本物の origin・core.hooksPath には触れない）。
SRC=/home/ytani/work/jp-long-typing
T=$(mktemp -d "${SCRATCH:-/tmp}/hooktest.XXXX")
git clone -q --bare "$SRC" "$T/origin.git"
cl() { git clone -q "$T/origin.git" "$T/$1" && git -C "$T/$1" config core.hooksPath githooks; }
push_other() { git clone -q "$T/origin.git" "$T/o$1" && git -C "$T/o$1" commit -q --allow-empty -m "other $1" && git -C "$T/o$1" push -q origin master; }
echo "== A 遅れ: origin に先に 1 件入ってから commit する"
cl a; push_other a
( cd "$T/a" && echo x >> A.txt && git add A.txt && git commit -q -m "local a" ; echo "commit exit=$?" )
echo "HEAD: $(git -C "$T/a" log --oneline -1)"
echo "== B SessionStart（遅れ・先行の両方）"
( cd "$T/a" && CLAUDE_PROJECT_DIR="$T/a" "$T/a/.claude/hooks/session-sync.sh"; echo "hook exit=$?" )
echo "== C 先行のみ（origin と同じ所から commit し、未 push）"
cl c && ( cd "$T/c" && echo y >> C.txt && git add C.txt && git commit -q -m "local c"; echo "commit exit=$?" )
( cd "$T/c" && CLAUDE_PROJECT_DIR="$T/c" "$T/c/.claude/hooks/session-sync.sh"; echo "hook exit=$?" )
echo "== D 同じ状態（遅れ 0・先行 0）: SessionStart は何も出さない"
cl d && ( cd "$T/d" && CLAUDE_PROJECT_DIR="$T/d" "$T/d/.claude/hooks/session-sync.sh"; echo "hook exit=$?" )
echo "== E fetch できない: commit は通る・警告なし"
cl e && git -C "$T/e" remote set-url origin /nonexistent && ( cd "$T/e" && echo z >> E.txt && git add E.txt && git commit -q -m "local e"; echo "commit exit=$?" )
( cd "$T/e" && CLAUDE_PROJECT_DIR="$T/e" "$T/e/.claude/hooks/session-sync.sh"; echo "hook exit=$?" )
echo "== F fetch が止まる（届かない先）: 上限 5 秒で戻る"
cl f && git -C "$T/f" remote set-url origin http://10.255.255.1/none.git && ( cd "$T/f" && s=$(date +%s.%N); ./githooks/sync-state.sh; echo "sync-state exit=$?"; e=$(date +%s.%N); echo "経過秒: $(echo "$e - $s" | bc)" )
echo T=$T
