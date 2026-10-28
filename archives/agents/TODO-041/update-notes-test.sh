#!/bin/bash
# update-notes.sh の見送り・取り込み・push を、一時ディレクトリの bare リポジトリを origin にした clone で確かめる（TODO-041）。
# 本物の origin には push しない。作業ツリーの今の内容（commit 前の分も）を clone に重ねて試す。
# 使い方: archives/agents/TODO-041/update-notes-test.sh   （ネットワークと Playwright を使う。数分）
set -u
SRC=$(cd "$(dirname "$0")/../../.." && pwd)
PY=$(python3 -c 'import sys; print(sys.executable)')  # mise の shim でなく、実体
T=$(mktemp -d)
git clone -q --bare "$SRC" "$T/origin.git"
mk() {  # mk NAME : 新しい clone を作り、今の作業ツリーの分を重ねて origin に push する。NHK を古くして、更新・commit・push が起きるようにする
  git clone -q "$T/origin.git" "$T/$1"
  ( cd "$SRC" && tar c index.html update-notes.sh githooks .claude/hooks .claude/settings.json .claude/skills/update-release-notes/notes.py .claude/skills/update-release-notes/last-source.json ) | tar x -C "$T/$1"
  sed -i '0,/"pubDate": "2026-10-[^"]*"/s//"pubDate": "2000-01-01T00:00:00+09:00"/' "$T/$1/index.html"
  git -C "$T/$1" add -A && git -C "$T/$1" commit -q -m wip 2>/dev/null; git -C "$T/$1" push -q origin master 2>/dev/null
}
other() { git clone -q "$T/origin.git" "$T/other$1" && git -C "$T/other$1" commit -q --allow-empty -m "other $1" && git -C "$T/other$1" push -q origin master; }
run() { ( cd "$T/$1" && ./update-notes.sh google >"$T/$1.log" 2>&1; echo "exit=$?" >>"$T/$1.log" ); }
tip() { git -C "$T/origin.git" rev-parse master; }
msgs() { git -C "$T/origin.git" log --format=%s -3 master | paste -sd'|'; }
wts() { echo "worktree の数（1 のはず）: $(git -C "$T/$1" worktree list | wc -l)"; }
grepk() { rg -e '^見送り' -e '^手元に' -e '^exit=' "$T/$1.log"; }
mk base
echo "== 1 同じ（commit・push、手元も早送り）"; before=$(tip); run base; grepk base
echo "origin 親==前: $([[ $(git -C $T/origin.git rev-parse master^) == $before ]] && echo yes || echo no)  origin==手元 HEAD: $([[ $(tip) == $(git -C $T/base rev-parse HEAD) ]] && echo yes || echo no)"; wts base
echo "== 2 先（未 push）"; mk ahead; git -C $T/ahead commit -q --allow-empty -m local; before=$(tip); h=$(git -C $T/ahead rev-parse HEAD); run ahead; grepk ahead
[[ $(tip) == $before && $(git -C $T/ahead rev-parse HEAD) == $h ]] && echo "origin・HEAD 変わらず"
echo "== 3 遅れ（取り込んで commit・push）"; mk behind; other 3; new=$(tip); run behind; grepk behind
echo "origin 親==other: $([[ $(git -C $T/origin.git rev-parse master^) == $new ]] && echo yes || echo no)  origin==手元 HEAD: $([[ $(tip) == $(git -C $T/behind rev-parse HEAD) ]] && echo yes || echo no)"; wts behind
echo "== 4 分岐"; mk div; git -C $T/div commit -q --allow-empty -m local; other 4; before=$(tip); h=$(git -C $T/div rev-parse HEAD); run div; grepk div
[[ $(tip) == $before && $(git -C $T/div rev-parse HEAD) == $h ]] && echo "origin・HEAD 変わらず"
echo "== 5 master でない"; mk br; git -C $T/br checkout -q -b feat; before=$(tip); run br; grepk br; [[ $(tip) == $before ]] && echo "origin 変わらず"
echo "== 6 fetch できない"; mk nf; git -C $T/nf remote set-url origin /nonexistent; run nf; cat $T/nf.log
echo "== 7 判定のあと、notes.py の実行中に手元の master へ commit する"
mk dur; before=$(tip)
mkdir $T/bin; cat > $T/bin/python3 <<EOS
#!/bin/bash
[[ -e $T/done ]] || { touch $T/done; git -C $T/dur commit -q --allow-empty -m during; }
exec $PY "\$@"
EOS
chmod +x $T/bin/python3
( cd $T/dur && PATH=$T/bin:$PATH ./update-notes.sh google >$T/dur.log 2>&1; echo "exit=$?" >>$T/dur.log ); grepk dur
echo "手元に during がある: $(git -C $T/dur log --format=%s -1)"
echo "origin に during が無い: $(git -C $T/origin.git log --format=%s master | rg -q '^during$' && echo no || echo yes)  origin 親==前: $([[ $(git -C $T/origin.git rev-parse master^) == $before ]] && echo yes || echo no)  origin の先頭: $(git -C $T/origin.git log --format=%s -1 master)"; wts dur
echo "== 8 手元に commit していない変更がある（push はされ、手元は取り込まない）"
mk dirty; before=$(tip); echo x >> $T/dirty/README.md; run dirty; grepk dirty
echo "origin 親==前: $([[ $(git -C $T/origin.git rev-parse master^) == $before ]] && echo yes || echo no)  手元の変更が残る: $(git -C $T/dirty status --short | tr '\n' ' ')"; wts dirty
echo T=$T
