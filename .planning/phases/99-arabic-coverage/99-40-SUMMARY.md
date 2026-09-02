---
phase: 99-arabic-coverage
plan: 40
status: blocked
head: f8034ff533aee4370e2c9716f855054ca596cc22
recorded_at_local: 2026-09-02T13:16:38+03:00
recorded_at_utc: 2026-09-02T10:16:38Z
---

# P99-40 Summary — rendered battery blocked by a foreign dev server

## Outcome

P99-40 is **RED and PARKED to OVERSEER by name**. Both of this task's own command oracles
re-derived their one-file populations successfully: `99-ar02-dates.spec.ts` collected the
hardcoded expected 8 tests and `99-ar03-leak.spec.ts` collected the hardcoded expected 10 tests.
Both commands then exited 3 before Playwright execution because PID 39807 holds TCP 5173 from
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend`, outside this worktree.

The holder was neither reused nor terminated, and no alternate-port or earlier-wave run is
substituted. Therefore this task has no fresh 8/8 result, no fresh 10/10 result, and no fresh
outcome for the three banner fixtures. The front matter intentionally does not say
`status: complete`; the completion contract must continue to read P99-40 as pending.

The repair re-attempt reran both unchanged commands at 13:16 local. They again collected 8 and 10
and again exited 3 on PID 39807 before execution. A five-check, 40-second port recheck observed the
same PID and foreign cwd throughout. No newer written overseer ruling authorizes a bound or gives
this worker authority to terminate the other tree's process.

There is no constructed-status waiver. No unrunnable leg is called a pass, and no bound is
recorded: the only permitted bound would require an overseer's written ruling quoted with its
ruling id, and P99-40 has no such ruling. Owner release of the foreign process followed by the
unchanged two command oracles is the required continuation.

## Acceptance status

| Acceptance item | This task's result |
| --- | --- |
| `the rendered battery is landed for the consolidated re-proof, proven by this task's own oracles rather than by the lane's later tasks.` | **RED.** Neither own oracle reached Playwright execution. |
| `There is NO "NOT CONSTRUCTED" pass in this plan. An unrunnable leg leaves this task RED and PARKS to the overseer by name. The D-35-named undriven legs were driven by this phase; the only bounded item that may be recorded as a bound is a leg the overseer rules bounded IN WRITING, quoted with its ruling id.` | **Honored fail-closed:** RED and PARKED to **OVERSEER**; zero bounded items; zero substituted passes. |
| `The register names every bound and residue: the D-21 NO-SHIP dot-form tail with its Phase 102 condition, the deferred items from 99-CONTEXT (COPY-09 trio, EDGECOPY-01, GUIDE-HOLLOW-01, the 39 criterion-1 members owned by P103), any nav pair this phase ESCALATED rather than repaired, and the double-prefixed keys and named handoffs the lanes recorded` | **Recorded** in `99-VERIFICATION.md` and repeated below. |
| `criterion 3 closes on the RENDERED spec run by THIS gate — ONE spec path, the count hardcoded at 10 so a fixture failure that silently skipped the three banner tests cannot pass as green — RED at HEAD` | **RED.** One target path collected 10; execution was refused with exit 3. |
| `the SECOND rendered spec — the dates battery — is run by THIS gate too, so the register's "both rendered specs executed by this plan's own gate" (99-39) is discharged by an oracle rather than by prose. ONE spec path, the count hardcoded at 8 so a filter that silently drops files fails the gate, and the run asserted GREEN — RED before the AR-02 lane lands.` | **RED.** One target path collected 8; execution was refused with exit 3. |

## P99-40 command oracles and verbatim output

### Dates battery — one path, hardcoded count 8

Command, reproduced verbatim from `99-40-PLAN.md` and run from this worktree:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar02-dates.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar02-dates\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=8; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar02-dates.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar02-dates.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
```

Verbatim standard output/error:

```text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
INSTRUMENT-CANNOT-RUN: port 5173 held by pid 39807 rooted at /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend, which is NOT this worktree; refusing to measure a foreign tree
```

Process exit: `3`.

### Arabic leak battery — one path, hardcoded count 10

Command, reproduced verbatim from `99-40-PLAN.md` and run from this worktree:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar03-leak.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar03-leak\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=10; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar03-leak.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar03-leak.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps
```

Verbatim standard output/error:

```text
collected-from-target-spec=99-ar03-leak.spec.ts count=10 expected=10
INSTRUMENT-CANNOT-RUN: port 5173 held by pid 39807 rooted at /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend, which is NOT this worktree; refusing to measure a foreign tree
```

Process exit: `3`.

The ten-test source population includes all three required fixture leaves:
`UI99-C7 ar banner under_review`, `UI99-C7 ar banner approved`, and
`UI99-C7 ar banner published`. Collection is not an execution verdict, so none is assigned an
outcome here.

### Persistent holder check

Command:

```sh
for i in 1 2 3; do HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -z "$HOLDER"; then echo "port-free check=$i"; exit 0; fi; HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep '^n' | head -1 | cut -c2-); echo "port-held check=$i pid=$HOLDER cwd=$HCWD"; test "$i" -eq 3 || sleep 10; done; exit 1
```

Verbatim output:

```text
port-held check=1 pid=39807 cwd=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
port-held check=2 pid=39807 cwd=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
port-held check=3 pid=39807 cwd=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
```

Process exit: `1`. This is blocker provenance, not a product-test result.

## Re-derived populations and exclusions

| Oracle | Population | Outside the population | Observed |
| --- | --- | --- | --- |
| `99-ar02-dates.spec.ts` | Exactly one spec path under `chromium-en --no-deps`; hardcoded `EXP=8` | Every other spec/project, earlier executions, alternate ports, and responses from another checkout | Collected 8; executed 0; exit 3 |
| `99-ar03-leak.spec.ts` | Exactly one spec path under `chromium-en --no-deps`; hardcoded `EXP=10`, including three banner states | Every other spec/project, earlier executions, alternate ports, and responses from another checkout | Collected 10; executed 0; exit 3 |

## Bounds, residues, and lane handoffs

- **Bounded items: none.** No written overseer ruling with a ruling id authorizes a bound.
- **P99-40 blocker:** foreign PID 39807 owns TCP 5173 from the main checkout. This is an
  unrunnable instrument condition, not a bounded pass. It requires owner release and a rerun.
- **D-21 / Phase 102 condition:** the working approximately 7,086-site dot-form tail is
  NO-SHIP-THIS-PHASE. Wholesale conversion is new Phase 102 scope, sequenced after the completed
  `common` flatten and guarded by resolution checks.
- **Other Phase 102 residues:** COPY-09's trio (`HelpPage:166`,
  `useBriefingBooks:164-165`, `PositionTrackerCard:93`), EDGECOPY-01's two edge functions, and
  GUIDE-HOLLOW-01's seven hollow dossier-type guide bodies.
- **Phase 103 residue:** the 39 criterion-1 members triaged by reading in Phase 98.
- **Nav/title escalations:** `navigation.admin`, `navigation.taskQueue`, and
  `navigation.newEvent` remain value-locked escalations to the overseer, never repaired or counted
  as agreements.
- **Double-prefixed source-key population, closed rather than deferred:** the 37 historical
  `common:common.*` keys were `about`, `actions.approve`, `actions.complete`, `actions.copy`,
  `actions.dismiss`, `actions.generate`, `actions.moveUp`, `actions.next`, `actions.openMenu`,
  `actions.previous`, `actions.refresh`, `actions.reject`, `actions.remove`, `actions.test`,
  `actions.thumbsDown`, `actions.thumbsUp`, `actions.toggleSection`, `actions.toggleWatch`,
  `actions.viewDetails`, `back`, `cancel`, `clear`, `close`, `delete`, `edit`, `error`, `export`,
  `loading`, `next`, `notYetAvailable`, `previous`, `reorder`, `save`, `saving`, `select`,
  `success`, and `view`. Later source repointing drove the live double-prefix count to zero; the
  prior result is lineage only, not a P99-40 rendered green.
- **Named common/positions handoffs:** `common:optional`; `common:tasks.sla.approaching`;
  `common:afterActions.decisions.item`; `common:afterActions.confidence`;
  `common:afterActions.commitments.{tracking,statuses,priorities}.*`; `common:contributors`;
  `common:days`; the scalar/object reminder-shape clash at
  `common:waitingQueue.reminder.{noAssignee,success,error}`; `WorkItemLinker.tsx`'s eight raw-key
  `common` sites; and `positions:draftBanner`. These remain named exactly as handoffs, not silently
  converted into P99-40 bounds.
- **D-38:** P99-41 owns the rendered captures, presentation, and written overseer sign-off. This
  worker records no answer.

## Historical double-prefix derivation run in this task

Command (read-only, against the fixed pre-flatten source commit):

```sh
git grep -h -o -E "t\(['\"]common:common\.[^'\"]+['\"]" 4cdfdf28725f4c48d00ccb6f7aec2084f032d6cb -- 'frontend/src/**/*.ts' 'frontend/src/**/*.tsx' | sed -E "s/^t\(['\"]common:common\.//; s/['\"]$//" | sort | uniq -c
```

Verbatim output:

```text
   2 about
   1 actions.approve
   1 actions.complete
   1 actions.copy
   1 actions.dismiss
   1 actions.generate
   1 actions.moveUp
   1 actions.next
   7 actions.openMenu
   1 actions.previous
   7 actions.refresh
   1 actions.reject
  18 actions.remove
   1 actions.test
   1 actions.thumbsDown
   1 actions.thumbsUp
   3 actions.toggleSection
   1 actions.toggleWatch
   1 actions.viewDetails
   2 back
   4 cancel
   3 clear
   5 close
   2 delete
   2 edit
   2 error
   1 export
   4 loading
   1 next
  11 notYetAvailable
   1 previous
   1 reorder
   1 save
   2 saving
   1 select
   2 success
   4 view
```

This historical population is outside the two rendered-spec populations. It is included because
the acceptance register requires the lanes' double-prefixed keys to remain named.

## Read and navigation ledger

Commands used only to read or navigate are named without treating their output as acceptance
evidence: `git status --short --branch`; `wc -l`; `sed -n` over `99-40-PLAN.md`,
`99-CONTEXT.md`, `99-RESEARCH.md`, `99-VERIFICATION.md`, both rendered specs, both named scripts,
and lineage summaries; `rg` over phase summaries for bounds, residues, handoffs, escalations, and
double-prefix records; `git log --follow` and `git show` to read P99-39's earlier blocked-record
precedent; and `lsof` to resolve PID 39807's working directory before refusing it.

No file outside this task's two-path write scope changed.
