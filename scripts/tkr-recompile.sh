#!/bin/bash
# Recompile WITH the completion-contract guard in front of it — RULING-P99-483.
#
# The guard existed as a committed script with ZERO callers. A guard nothing invokes is not a guard;
# it is the belief that PRODUCT ENTRY 36 is handled. This is the wiring: recompiling through this
# script means the check runs, because recompile is the exact moment the defect bites — a task that
# passed 7/7 but wrote no `status: complete` marker silently reverts to `pending` here, and the loss
# is invisible until someone wonders why a finished lane is being redone.
#
#   usage: tkr-recompile.sh <specDir> [--force]
# Refuses on a breach unless --force, and a --force is meant to be reported, not used quietly.
set -u
SPEC="${1:?usage: tkr-recompile.sh <specDir> [--force]}"
FORCE="${2:-}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO" || exit 3

# TKR_RECOMPILE_RUN pins which run is checked. Without it the guard can only ever be exercised
# on whatever run happens to be latest, so its REFUSE branch would never be drillable — and an
# untested refuse branch is the same shape as the guard it replaces.
if [ -n "${TKR_RECOMPILE_RUN:-}" ]; then LATEST="$REPO/.tickmarkr/runs/$TKR_RECOMPILE_RUN"
else LATEST=$(ls -1dt "$REPO"/.tickmarkr/runs/run-* 2>/dev/null | head -1); fi
if [ -z "$LATEST" ] || [ ! -f "$LATEST/journal.jsonl" ]; then
  echo "completion-contract: no prior run journal — nothing to check (this is not a pass, it is an empty population)"
else
  RUN=$(basename "$LATEST")
  REF="tickmarkr/$RUN"
  git rev-parse --verify --quiet "$REF" >/dev/null || REF=HEAD
  echo "completion-contract: checking $RUN against $REF"
  if ! node "$REPO/scripts/completion-contract-check.mjs" "$LATEST/journal.jsonl" "$REF" "$SPEC"; then
    rc=$?
    echo ""
    echo "⚠ BREACH: at least one task the run finished carries no 'status: complete' marker."
    echo "  Recompiling now would SILENTLY revert it to pending and a later run would redo finished work."
    echo "  This is PRODUCT ENTRY 36. Fix the SUMMARY, or re-run with --force and REPORT that you did."
    [ "$FORCE" = "--force" ] || exit 1
    echo "  --force given: proceeding despite the breach."
  fi
fi
echo ""
exec tickmarkr compile "$SPEC"
