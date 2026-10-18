#!/bin/sh
# Kho Bau auto-runner trigger - installed by Claude (Cowork) at the repo owner's request.
# Fires ONCE when docs/opencode/state/ARMED exists: after the next commit it opens
# docs/opencode/CHAY_TU_DONG.bat, which runs the OpenCode task queue (docs/opencode/queue).
# Delete this file to disable it.
[ -n "$P42_RUNNER" ] && exit 0
top=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$top" || exit 0
[ -f docs/opencode/state/ARMED ] || exit 0
mv -f docs/opencode/state/ARMED docs/opencode/state/FIRED 2>/dev/null || exit 0
win=$(pwd -W 2>/dev/null) || win=$(cygpath -m "$PWD" 2>/dev/null) || exit 0
bat=$(printf '%s/docs/opencode/CHAY_TU_DONG.bat' "$win" | tr '/' '\\')
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_PREFIX GIT_EDITOR GIT_REFLOG_ACTION
explorer.exe "$bat" >/dev/null 2>&1 </dev/null
exit 0
