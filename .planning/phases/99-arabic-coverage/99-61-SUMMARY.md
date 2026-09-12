---
status: complete
---

# P99-61 Summary — intake queue draft status

## Outcome

GREEN. Added the single reachable missing intake queue-status leaf to both locale bundles:
`en:queue.status.draft` is `Draft` and `ar:queue.status.draft` is `مسودة`. Every value in the
eight-member `TicketStatus` union now has a translation in both locales.

Exactly two leaf keys changed across the task range:
`ar:queue.status.draft` and `en:queue.status.draft`. No existing string changed, no source file
changed, and no file outside the two locale bundles and this summary changed. The three struck keys
from RULING-P99-465 were not written or queued. No other coverage gap was observed.

## Population before the change

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-queue-status-coverage.mjs" "$R"
```

Exit: `1` (expected RED).

Verbatim output:

```text
union=8 assigned,closed,converted,draft,in_progress,merged,submitted,triaged
en=7 assigned,closed,converted,in_progress,merged,submitted,triaged missing=1 extra=0
FAIL en: unreachable-key coverage gap, missing=[draft]
FAIL en: queue.status.draft absent or empty
ar=7 assigned,closed,converted,in_progress,merged,submitted,triaged missing=1 extra=0
FAIL ar: unreachable-key coverage gap, missing=[draft]
FAIL ar: queue.status.draft absent or empty
```

The union and locale key sets before the change were therefore:

- Union (8): `assigned`, `closed`, `converted`, `draft`, `in_progress`, `merged`, `submitted`,
  `triaged`.
- English (7): `assigned`, `closed`, `converted`, `in_progress`, `merged`, `submitted`, `triaged`.
- Arabic (7): `assigned`, `closed`, `converted`, `in_progress`, `merged`, `submitted`, `triaged`.
- Difference in both locales: only `draft`; unreachable extras: zero.

The unchanged task range also proved the diff oracle RED at HEAD.

Verbatim output:

```text
task-base=05140a4d23eccffe37d5874fcaebe800be338de2 non-locale-files-changed=0
changed-leaf-keys=0
FAIL: expected exactly the two draft leaf keys and nothing else, got: changed-leaf-keys=0
```

## Population after the change

### Coverage oracle

Exact command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-queue-status-coverage.mjs" "$R"
```

Exit: `0`.

Verbatim output:

```text
union=8 assigned,closed,converted,draft,in_progress,merged,submitted,triaged
en=8 assigned,closed,converted,draft,in_progress,merged,submitted,triaged missing=0 extra=0
ar=8 assigned,closed,converted,draft,in_progress,merged,submitted,triaged missing=0 extra=0
```

The union and both locale key sets after the change are set-equal at eight members:
`assigned`, `closed`, `converted`, `draft`, `in_progress`, `merged`, `submitted`, and `triaged`.
The Arabic draft value contains Arabic script.

### Task-range diff oracle

Exact command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" || { echo "INSTRUMENT-CANNOT-RUN: repo root unreadable"; exit 3; }; BR=$(git -C "$R" rev-parse --abbrev-ref HEAD) || { echo "INSTRUMENT-CANNOT-RUN: cannot read the current branch"; exit 3; }; RUNBR="${BR%--*}"; test "$RUNBR" != "$BR" || { echo "INSTRUMENT-CANNOT-RUN: branch $BR is not a tickmarkr task branch, so the task base cannot be derived; refusing to compare against an assumed base"; exit 3; }; git -C "$R" rev-parse --verify --quiet "$RUNBR" >/dev/null || { echo "INSTRUMENT-CANNOT-RUN: run branch $RUNBR not found"; exit 3; }; TASKBASE=$(git -C "$R" merge-base HEAD "$RUNBR") || { echo "INSTRUMENT-CANNOT-RUN: merge-base failed"; exit 3; }; case "$TASKBASE" in "") echo "INSTRUMENT-CANNOT-RUN: derived an empty task base"; exit 3;; esac; SRC=$(git -C "$R" diff --name-only "$TASKBASE"..HEAD -- . ":(exclude)frontend/src/i18n/en/intake.json" ":(exclude)frontend/src/i18n/ar/intake.json" ":(exclude).planning") || { echo "INSTRUMENT-CANNOT-RUN: git diff over the task range failed"; exit 3; }; NS=$(printf "%s" "$SRC" | command grep -c . || true); echo "task-base=$TASKBASE non-locale-files-changed=$NS"; test "$NS" -eq 0 || { echo "FAIL: this task changed $NS file(s) outside the two locale bundles: $SRC"; exit 1; }; CK=$(node "$R/scripts/i18n-queue-status-coverage.mjs" "$R" --changed-keys "$TASKBASE") || { echo "INSTRUMENT-CANNOT-RUN: the changed-keys probe exited nonzero, so its key list cannot be trusted"; exit 3; }; echo "$CK"; test "$CK" = "changed-leaf-keys=2 ar:queue.status.draft en:queue.status.draft" || { echo "FAIL: expected exactly the two draft leaf keys and nothing else, got: $CK"; exit 1; }
```

Exit: `0`.

Verbatim output:

```text
task-base=05140a4d23eccffe37d5874fcaebe800be338de2 non-locale-files-changed=0
changed-leaf-keys=2 ar:queue.status.draft en:queue.status.draft
```

## Scope

Implementation commit `79491a3f6` changes only:

- `frontend/src/i18n/en/intake.json`
- `frontend/src/i18n/ar/intake.json`

This summary is the only planning artifact added. No `t()` call, fallback argument, component,
type declaration, coverage probe, or other source file was edited.
