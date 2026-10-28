#!/bin/bash
# origin/master と比べた「遅れ 先行」の件数を出す（TODO-041）。fetch に失敗したら（時間の上限は 20 秒）何も出さずに 1 で終わる
cd "$(dirname "$0")/.."
timeout "${FETCH_TIMEOUT:-20}" git fetch --quiet origin master 2>/dev/null || exit 1
git rev-list --left-right --count origin/master...HEAD
