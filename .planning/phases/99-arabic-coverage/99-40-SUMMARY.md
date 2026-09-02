---
phase: 99-arabic-coverage
plan: 40
status: complete
head: 6be6bfb0a79272dacb9c4b2bcb6c2659a91d910c
recorded_at_local: 2026-09-02T13:31:05+03:00
recorded_at_utc: 2026-09-02T10:31:05Z
---

# P99-40 Summary — the rendered battery, landed on this task's own gates

## Outcome

P99-40 is **GREEN**. Both of this task's own command oracles — reproduced byte-for-byte from
`99-40-PLAN.md` — ran to completion in this attempt and exited `0`:

- `tests/e2e/99-ar03-leak.spec.ts` collected the hardcoded expected **10** and executed **10/10
  passed**, including all three fixture-driven position-banner states.
- `tests/e2e/99-ar02-dates.spec.ts` collected the hardcoded expected **8** and executed **8/8
  passed**, each Arabic leg beside its English control.

No leg is recorded `NOT CONSTRUCTED`. No bound is recorded. No green is quoted forward from
P99-39 or any earlier wave to close either rendered row — both rows close on output produced by
this task's own gate in this run.

The prior attempt's blocker is **resolved**: the foreign PID 39807 that held TCP 5173 from the main
checkout was released by its owner before this attempt. This worker did not terminate it and did
not reuse it; it observed the port unheld and proceeded. Provenance is recorded below.

## Acceptance status

| Acceptance item | This task's result |
| --- | --- |
| `the rendered battery is landed for the consolidated re-proof, proven by this task's own oracles rather than by the lane's later tasks.` | **GREEN.** Both own oracles executed and exited 0 in this run; no later task and no earlier wave supplies either result. |
| `There is NO "NOT CONSTRUCTED" pass in this plan. An unrunnable leg leaves this task RED and PARKS to the overseer by name. The D-35-named undriven legs were driven by this phase; the only bounded item that may be recorded as a bound is a leg the overseer rules bounded IN WRITING, quoted with its ruling id.` | **Honored.** Zero legs recorded NOT CONSTRUCTED; zero bounded items; every D-35-named leg (404, ar intake queue, `/search` chips, position banner) executed green under this gate. No park was needed this attempt. |
| `The register names every bound and residue: the D-21 NO-SHIP dot-form tail with its Phase 102 condition, the deferred items from 99-CONTEXT (COPY-09 trio, EDGECOPY-01, GUIDE-HOLLOW-01, the 39 criterion-1 members owned by P103), any nav pair this phase ESCALATED rather than repaired, and the double-prefixed keys and named handoffs the lanes recorded` | **Recorded** in `99-VERIFICATION.md` and repeated below. |
| `criterion 3 closes on the RENDERED spec run by THIS gate — ONE spec path, the count hardcoded at 10 so a fixture failure that silently skipped the three banner tests cannot pass as green — RED at HEAD` | **GREEN.** One path, `EXP=10` asserted before execution, then `expected:10 skipped:0 unexpected:0 flaky:0`. The three banner tests passed with real durations, so the skip-to-green shape the count guards against is excluded. |
| `the SECOND rendered spec — the dates battery — is run by THIS gate too, so the register's "both rendered specs executed by this plan's own gate" (99-39) is discharged by an oracle rather than by prose. ONE spec path, the count hardcoded at 8 so a filter that silently drops files fails the gate, and the run asserted GREEN — RED before the AR-02 lane lands.` | **GREEN.** One path, `EXP=8` asserted before execution, then `expected:8 skipped:0 unexpected:0 flaky:0`. |

## P99-40 command oracles and verbatim output

### Arabic leak battery — one path, hardcoded count 10

Command, reproduced verbatim from `99-40-PLAN.md` and run from this worktree:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar03-leak.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar03-leak\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=10; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar03-leak.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar03-leak.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps
```

Verbatim standard output/error:

```text
collected-from-target-spec=99-ar03-leak.spec.ts count=10 expected=10
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-02T10-29-58-960Z-pw-reaped-44ccef378e73f149d976e8dc5c8480a8.json
pw-run-reaped: playwright exited code=0 signal=null; group 78526 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-094008-0000000000000072--P99-40/test-results/pw-reaped-44ccef378e73f149d976e8dc5c8480a8.json.log
```

Process exit: `0`.

Per-test results, read from the archived report
`.pw-reports/2026-09-02T10-29-58-960Z-pw-reaped-44ccef378e73f149d976e8dc5c8480a8.json`:

| Test | Status | Duration |
| --- | --- | --- |
| `UI99-C5 ar 404` | passed | 8.7s |
| `UI99-C5 en control 404` | passed | 6.2s |
| `UI99-C6 ar intake queue` | passed | 8.5s |
| `UI99-C6 en control intake queue` | passed | 6.1s |
| `UI99-C7 ar banner under_review` | passed | 11.8s |
| `UI99-C7 ar banner approved` | passed | 8.4s |
| `UI99-C7 ar banner published` | passed | 11.4s |
| `UI99-C8 ar search chips` | passed | 6.2s |
| `UI99-C9 ar latin run scan` | passed | 39.7s |
| `UI99-C10 ar tajawal` | passed | 7.3s |

Report `stats` verbatim:

```text
{"startTime":"2026-09-02T10:29:01.767Z","duration":54182.183999999994,"expected":10,"skipped":0,"unexpected":0,"flaky":0}
```

### The three banner states — the fixture legs the hardcoded 10 exists to protect

| Banner state | Executed test | Outcome |
| --- | --- | --- |
| `under_review` | `UI99-C7 ar banner under_review` | **passed** (11.8s) |
| `approved` | `UI99-C7 ar banner approved` | **passed** (8.4s) |
| `published` | `UI99-C7 ar banner published` | **passed** (11.4s) |

`skipped: 0` in the same report, so none of the three was silently skipped into a green — which is
the exact failure the hardcoded `EXP=10` is there to catch. Each test asserts, from
`99-ar03-leak.spec.ts:132-142`, that the banner is visible, contains Arabic script, does not leak
the hardcoded `Read Only` literal, and carries no unallowlisted Latin run.

### Dates battery — one path, hardcoded count 8

Command, reproduced verbatim from `99-40-PLAN.md` and run from this worktree:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar02-dates.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar02-dates\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=8; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar02-dates.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar02-dates.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
```

Verbatim standard output/error:

```text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: report archived outside the worktree -> /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.pw-reports/2026-09-02T10-30-33-546Z-pw-reaped-8a338055daf46aac06e466ba02127513.json
pw-run-reaped: playwright exited code=0 signal=null; group 81343 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published; child output /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-094008-0000000000000072--P99-40/test-results/pw-reaped-8a338055daf46aac06e466ba02127513.json.log
```

Process exit: `0`.

Per-test results, read from the archived report
`.pw-reports/2026-09-02T10-30-33-546Z-pw-reaped-8a338055daf46aac06e466ba02127513.json`:

| Test | Status | Duration |
| --- | --- | --- |
| `UI99-C1C2C4 ar /calendar` | passed | 12.5s |
| `UI99-C1C2C4 ar /dossiers` | passed | 14.2s |
| `UI99-C1C2C4 ar /events` | passed | 10.8s |
| `UI99-C1 en control /calendar` | passed | 11.5s |
| `UI99-C1 en control /dossiers` | passed | 14.1s |
| `UI99-C1 en control /events` | passed | 11.9s |
| `UI99-C3 ar /activity relative time` | passed | 12.9s |
| `UI99-C3 en control /activity relative time` | passed | 13.2s |

Report `stats` verbatim:

```text
{"startTime":"2026-09-02T10:30:13.965Z","duration":16739.55,"expected":8,"skipped":0,"unexpected":0,"flaky":0}
```

Each Arabic leg has its English control beside it in the same run, so a wholesale rendering
failure that greened both sides is excluded.

## Port provenance — what the guard proved, and what it did not

The prior attempt exited `3` twice on the port-identity guard because PID 39807, rooted at
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend`, held TCP 5173. That
holder was released by its owner before this attempt. This worker terminated nothing.

Observations recorded in order, with the exact commands:

1. Before the first oracle — `lsof -nP -iTCP:5173 -sTCP:LISTEN` printed no listener line.
   The guard's `test -n "$HOLDER"` therefore evaluated false and **neither branch ran**: the
   refusal branch did not fire, and no `reusing dev server pid ...` line was printed. This is why
   the verbatim outputs above contain no port line at all.
2. During the leak run — `lsof -a -p 78860 -d cwd -Fn` resolved the live dev server's working
   directory to
   `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-094008-0000000000000072--P99-40/frontend`,
   inside this worktree. This is positive identity evidence, not an absence: the surface actually
   measured was served by this tree.
3. After both runs — `lsof -nP -iTCP:5173 -sTCP:LISTEN` printed no listener, and a
   worktree-anchored `pgrep -af vite` count was `0`. Both wrapper invocations reported
   `session reaped; verdict clean`, so this attempt leaked no dev server for the next runner.

**Stated precisely:** the guard passed by the *absence* of a holder, which on its own proves only
that no foreign process was measured. The affirmative claim that the measured surface belongs to
this worktree rests on observation 2, where the server's cwd was read directly. The dates run's
server was spawned by the same wrapper from the same `R="$PWD"` worktree root and reaped clean;
its identity was not separately read, and that is stated rather than implied.

`RULING-P99-537` forbids silently **reusing** a foreign holder; it does not compel terminating
one. Leaving the other tree's process alone during the prior attempt rested on this task's
authority boundary, not on that ruling.

## Re-derived populations and exclusions

| Oracle | Population | Outside the population | Observed |
| --- | --- | --- | --- |
| `99-ar02-dates.spec.ts` | Exactly one spec path under `chromium-en --no-deps`; hardcoded `EXP=8` | Every other spec/project, earlier executions, alternate ports, and responses from another checkout | Collected 8; executed 8; 8 passed; exit 0 |
| `99-ar03-leak.spec.ts` | Exactly one spec path under `chromium-en --no-deps`; hardcoded `EXP=10`, including three banner states | Every other spec/project, earlier executions, alternate ports, and responses from another checkout | Collected 10; executed 10; 10 passed; exit 0 |

A Playwright spec path is a **filter**, never proof of existence — which is why both commands
assert `test -f` and a hardcoded count before executing, and why the counts are literals rather
than derived from the list just passed.

## Bounds, residues, and lane handoffs

- **Bounded items: none.** No written overseer ruling with a ruling id authorizes a bound, and
  none is needed: every leg this task owes ran.
- **P99-40 blocker: CLOSED.** The foreign PID 39807 holder of TCP 5173 was released by its owner
  before this attempt; both unchanged oracles then ran green. No process outside this worktree was
  touched at any point in either attempt.
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
- **OPEN, engine residue, still needs a ruling:** the unleased `pw-run-reaped.mjs --lease-exec`
  wrapper configured in `playwright.config.ts`. P99-40's oracles route through the wrapper's RUN
  mode (`node "$R/scripts/pw-run-reaped.mjs" --`), which is why both runs reported
  `session reaped; verdict clean` and left the port with no holder. The underlying unleased
  configuration is unchanged and remains owed.
- **D-38 checkpoint:** OPEN and owned by **P99-41**, which is `autonomous: false`. This worker
  records **no answer**, and none may be recorded by a worker, the orchestrator, or the engine.

## The D-38 checkpoint answer

| Checkpoint | Owning task | Who decides | Answer |
| --- | --- | --- | --- |
| Phase 99 rendered/product sign-off, and the D-19 reversal window | **P99-41** (`autonomous: false`, named twice by `RULING-P99-95-LAUNCH-ENGINE.md`) | Overseer, in writing; the orchestrator then executes `tickmarkr approve` | **OPEN — not reached.** P99-41 has not run. No answer is recorded here because none exists and none may be authored by this worker. |

What this task hands P99-41 is the evidence package, now refreshed on P99-40's own gate rather
than quoted from P99-39: every surface the checkpoint must present has a green in the two tables
above — the 404, `/my-work/intake`, the `/search` chips, three dated surfaces, `/activity`'s
relative time, and all three position-banner states.

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
evidence: `git rev-parse`, `git log`, `git status --short` to establish HEAD and cleanliness;
`cat -n` and `sed -n` over `99-40-PLAN.md`, `99-CONTEXT.md`, `99-VERIFICATION.md`,
`99-40-SUMMARY.md`, both rendered specs and `scripts/completion-contract-check.mjs`; a `node`
one-liner that extracted the two `command:` scalars directly out of `99-40-PLAN.md`'s front matter
so the executed commands are byte-identical to the plan's rather than retyped; `grep` over both
specs to confirm ten and eight `test(` leaves with zero `test.skip/only/fixme`; a `node` reader
over the two archived Playwright JSON reports to tabulate per-test status; and `lsof`/`pgrep` for
the port provenance recorded above.

No file outside this task's two-path write scope changed.
