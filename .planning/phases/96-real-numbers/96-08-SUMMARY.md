---
phase: 96-real-numbers
plan: 08
subsystem: database
tags: [postgres, supabase, triggers, edge-functions, kanban, tasks, vitest, audit-log]

requires:
  - phase: 96-02
    provides: the decided kanban Done semantics (get_unified_work_kanban admits completed rows) and the re-timed commitment_overdue_check
provides:
  - the three-way stage→status parity record (live trigger prosrc | exported client map | tasks-update in-fn copy)
  - a vitest parity oracle pinning the client copy to the five trigger pairs
  - cause-attributed repair of the 3 divergent staging rows (audit_log changed-column derivation, recorded BEFORE the rows were touched)
  - status-direct writers routed through workflow_stage in tasks-update (deployed) and tasks.service.ts (2 sites, one census-found)
  - the Overdue-widget invariant closed by a BOTH-DIRECTION live control, not a vacuous zero
affects: [96-09, COUNT-01, COUNT-04]

tech-stack:
  added: []
  patterns:
    - 'Writer intent is expressed as workflow_stage; the DB trigger derives status (never a TS re-derivation of status from stage)'
    - 'Data-repair migrations write no status literal — the trigger performs the coercion (inherited from 96-02)'
    - 'Cause attribution via audit_log changed-column signatures before any row is touched'

key-files:
  created:
    - frontend/src/pages/WorkBoard/__tests__/stage-status-parity.test.ts
    - supabase/migrations/20260817500005_p96_task_stage_status_repair.sql
  modified:
    - frontend/src/pages/WorkBoard/WorkBoard.tsx
    - supabase/functions/tasks-update/index.ts
    - backend/src/services/tasks.service.ts

key-decisions:
  - 'assignments-my-assignments is a READER, not a writer — no vacuous STATUS_TO_STAGE token was added to satisfy the gate; the gate is recorded RED in BLOCKED'
  - 'The repair WHERE uses IS DISTINCT FROM (NULL-safe) instead of the plan literal NOT IN — same population on live data, no latent NULL hole'
  - 'tasks.service.updateTaskStatusFromCommitment (census-found, unnamed by the plan) fixed in the same task — the named three were a floor'
  - 'assignments-my-assignments NOT redeployed: deployed v22 is substantively identical to repo source and unchanged by this plan'

patterns-established:
  - 'Both-direction invariant control: same row, same past deadline, flipped completeness — the widget count must move by exactly 1'
  - 'Behavioural writer proof against the DEPLOYED artifact (mint JWT, PUT the status-only payload, read the stage back from the DB)'

requirements-completed: [COUNT-03]

duration: 38min
completed: 2026-08-17
---

# Phase 96 Plan 08: COUNT-03 — VERIFY-not-build Summary

**The stage/status pair is pinned three ways, its 3 live violations are repaired with the causing writer named from `audit_log` before a row was touched, and both status-direct writers now route intent through `workflow_stage` — with a completed task observed landing in kanban Done and staying out of the Overdue widget on a both-direction control.**

## Performance

- **Duration:** ~38 min
- **Started:** 2026-08-17T00:22Z
- **Completed:** 2026-08-17T01:00Z
- **Tasks:** 2 (both executed; both gates recorded RED for causes outside the subject — see BLOCKED)
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- **Cause attributed BEFORE the repair** (ACCEPTANCE-P96-EXEC condition 8): the 3 divergent rows were written by the `tasks-update` status-only branch, driven by the /my-work and dashboard MyTasks done-checkboxes. Four candidate writers eliminated by `audit_log` changed-column signature, a fifth by reachability.
- **Repair applied and re-derived:** zero divergence across all 9 task rows.
- **Writer fix proven behaviourally on the deployed function**, not by code reading: a `{"status":"completed"}`-only PUT now returns `workflow_stage: done`, with the pre-fix shape reproduced first as a negative control.
- **A completed task observed in kanban Done** via `get_unified_work_kanban` under the real user's claims.
- **The Overdue-widget clause closed by a targeted falsification** — a completed _and_ past-deadline task (a shape live data does not contain) was constructed and shown excluded, then flipped to prove the count moves.

## Task Commits

1. **Task 1: Parity oracle + invariant repair** — `8701920eb` (fix)
2. **Task 2: Status-direct writers route intent through workflow_stage** — `7a6838d46` (fix)

**Plan metadata:** this SUMMARY (docs).

## Files Created/Modified

- `frontend/src/pages/WorkBoard/WorkBoard.tsx:86` — `STAGE_TO_STATUS` exported (the ONLY edit in this file; 96-09 owns render edits)
- `frontend/src/pages/WorkBoard/__tests__/stage-status-parity.test.ts` — 7 assertions over the five hardcoded trigger pairs
- `supabase/migrations/20260817500005_p96_task_stage_status_repair.sql` — data repair, population + cause stated in the header
- `supabase/functions/tasks-update/index.ts:47` (`STATUS_TO_STAGE`), `:220-224` (the status-intent branch) — **deployed**
- `backend/src/services/tasks.service.ts:87` (`STATUS_TO_STAGE`), `:378-381` (`updateTask`), `:719-720` (`updateTaskStatusFromCommitment`)

## The three-way parity record (POPULATION: the five `workflow_stage` values)

Live `prosrc` re-pulled this session (staging `zkrcjzdemdmwhearhfgg`, 2026-08-17):

```sql
SELECT t.tgname, pg_get_triggerdef(t.oid), p.prosrc FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.tasks'::regclass AND NOT t.tgisinternal;
-- trg_sync_task_status BEFORE UPDATE ON public.tasks FOR EACH ROW
--   EXECUTE FUNCTION sync_task_status_from_workflow_stage()
```

```plpgsql
IF NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage THEN
  CASE NEW.workflow_stage
    WHEN 'todo'        THEN NEW.status := 'pending';
    WHEN 'in_progress' THEN NEW.status := 'in_progress';
    WHEN 'review'      THEN NEW.status := 'review';
    WHEN 'done'        THEN NEW.status := 'completed';
      IF NEW.completed_at IS NULL THEN NEW.completed_at := NOW(); END IF;
    WHEN 'cancelled'   THEN NEW.status := 'cancelled';
    ELSE NULL;
  END CASE;
END IF;
```

<!-- prettier-ignore -->
| stage | live trigger CASE (prosrc) | WorkBoard.tsx:86 (exported) | tasks-update/index.ts:208 (in-fn copy) | agree |
| --- | --- | --- | --- | --- |
| `todo` | `pending` | `pending` | `pending` | yes |
| `in_progress` | `in_progress` | `in_progress` | `in_progress` | yes |
| `review` | `review` | `review` | `review` | yes |
| `done` | `completed` (+`completed_at := NOW()` when null) | `completed` | `completed` | yes |
| `cancelled` | `cancelled` | `cancelled` | `cancelled` | yes |

All three copies agree cell-for-cell on all five pairs. **OUTSIDE this population:** INSERT-time
(tasks carry no INSERT-time sync — only `set_task_sla_deadline` fires BEFORE INSERT), mitigated by
the writer rule, not by a new trigger (verify-not-build); the Deno copy is not importable by vitest,
so its parity is this recorded side-by-side, not the unit test.

The client half is now machine-enforced: `stage-status-parity.test.ts` — **7 passed (7)**.

## Cause attribution — recorded BEFORE the rows were touched

The three rows (`b0000004-…-0001`, `-0002`, `-0005`, all titled from the `handoff-demo` seed) each
carry ONE `audit_log` UPDATE. Changed-column set, per row, identically:

```
{ status: pending -> completed, updated_at, updated_by: null -> de2734cf…, completed_at: null -> <ms-precision>, completed_by: null -> de2734cf… }
```

`workflow_stage` is absent from all three — so the trigger's `IS DISTINCT FROM OLD` guard never
fired. That signature eliminates the candidates:

<!-- prettier-ignore -->
| candidate writer | verdict | why |
| --- | --- | --- |
| `tasks-update/index.ts` status-only branch | **ATTRIBUTED** | writes exactly {status, updated_by, last_modified_by, updated_at} + auto-stamps completed_at/completed_by |
| `tasks.service.ts:updateTask` | eliminated (reachability) | column-signature IDENTICAL; but no frontend surface calls the Express /tasks routes — every `baseUrl: 'express'` caller is ai / elected-officials / analytics / notifications / monitoring |
| `tasks.service.ts:updateTaskStatusFromCommitment` | eliminated | writes no `updated_by` / `completed_by` |
| `workflow-executor` `executeUpdateStatus` | eliminated | writes only {status, updated_at} |
| `useUnifiedKanban.ts:398-426` drag | eliminated | writes `workflow_stage` too (benign dual-write) |
| `tasks-api.ts:completeTask` | eliminated | sends `workflow_stage: 'done'` |

**Front-end origin of the intent:** `pages/MyTasks.tsx:117` and
`pages/Dashboard/widgets/MyTasks.tsx:113-116` both send `{ status }` alone through `useUpdateTask`
→ `tasksAPI.updateTask` (`tasks-api.ts:443`) → `PUT functions/v1/tasks-update/:id`.
**Corroboration:** the audit author `de2734cf-f962-4e05-bf62-bc9e92efff96` is the `.env.test`
account (`kazahrani@stats.gov.sa`) — the three writes are spread over Apr 30 / May 30 / Jul 02,
the shape of a developer toggling the done-checkbox, not a batch job.

## Data repair — BEFORE / AFTER census

BEFORE (`SELECT workflow_stage, status, count(*) FROM tasks GROUP BY 1,2 ORDER BY 1,2`):

```
in_progress | in_progress | 2
todo        | pending     | 4
todo        | completed   | 3   <- POPULATION (completed, still bucketed Todo)
```

Applied `20260817500005_p96_task_stage_status_repair.sql` via Supabase MCP `apply_migration`
(name `p96_task_stage_status_repair`, project `zkrcjzdemdmwhearhfgg`) → `{"success": true}`.
The migration writes **no status literal**; the trigger derives status and stamps `completed_at`.

AFTER — the zero-divergence GROUP BY, joined to the five-pair table in one statement:

```
workflow_stage | status      | n | matches_trigger_table
done           | completed   | 3 | true
in_progress    | in_progress | 2 | true
todo           | pending     | 4 | true
```

**Zero rows diverge.** (Re-run after the probe scratch row was deleted: identical.)

## Per-file status-write census (the named three were a FLOOR)

Enumerated with `command grep -n` per file, every write site classified:

<!-- prettier-ignore -->
| file | site | kind | verdict |
| --- | --- | --- | --- |
| `supabase/functions/tasks-update/index.ts` | `:180` `updateData.status = body.status` → `.update()` `:229` | status write | **FIXED** — carries `STATUS_TO_STAGE[body.status]` when no stage sent |
| `supabase/functions/tasks-update/index.ts` | `:206-214` stage→status B-3 derivation | writes BOTH | untouched (benign; no new call sites) |
| `backend/src/services/tasks.service.ts` | `:352` `updateTask` → `.update()` `:372` | status write | **FIXED** |
| `backend/src/services/tasks.service.ts` | `:695` `updateTaskStatusFromCommitment` | status write, no stage | **FIXED — census-found, NOT named by the plan** |
| `backend/src/services/tasks.service.ts` | `:127/:142` `createTask` insert | writes both (`status:'pending'`, stage from input ?? `'todo'`) | left as-is; INSERT-time is outside the parity population — flagged below |
| `backend/src/services/tasks.service.ts` | `:630/:645` `createTaskFromCommitment` insert | writes both, hardcoded `pending`/`todo` | clean |
| `backend/src/services/tasks.service.ts` | `:418` `deleteTask` | soft delete, no status | clean |
| `supabase/functions/assignments-my-assignments/index.ts` | `:122-123` `.from('tasks').select(...)` | **READ** | **NOT A WRITER** — the file has zero `.update/.insert/.upsert`; the deployed v22 artifact is read-only too |
| `frontend/src/services/tasks-api.ts` | `:469-476` `completeTask`; `:484`/`:502` soft delete/undelete | dual-write / no status | clean |
| `frontend/src/hooks/useUnifiedKanban.ts` | `:398-426` drag | dual-write | clean (the benign precedent) |
| `supabase/functions/tasks-create/index.ts` | `:195-196` insert | writes both (`status:'pending'`, stage from body ?? `'todo'`) | INSERT-time — flagged below |
| `supabase/functions/workflow-executor/index.ts` | `:550` `executeUpdateStatus` | **status write, no stage, generic over `getTableName(entity_type)`** | **OUT OF `files_modified`** — filed below |

Repo-wide population: the 15 files containing `from('tasks')` were each swept for
`.update(`/`.insert(`/`.upsert(`; the 9 with zero writes are readers.

## Overdue-widget invariant (SC5's second clause)

**The named widget:** /my-work `WorkSummaryHeader.tsx:40-45` renders `summary.overdue_count`.

Chain, each link read live this session:

1. `unified_work_items` **tasks arm** (`pg_get_viewdef`, verbatim):
   `CASE WHEN (t.status::text <> ALL (ARRAY['completed','cancelled','done'])) AND t.sla_deadline IS NOT NULL AND t.sla_deadline < now() THEN true ELSE false END AS is_overdue`
   — byte-for-byte the formula pinned at `20260610000001_capture_unified_work_stack.sql:79-82`.
   Commitments arm: `(c.status <> ALL (ARRAY['completed','cancelled'])) AND c.due_date < CURRENT_DATE`.
   Intake arm: `(i.status <> ALL (ARRAY['resolved','closed','cancelled'])) AND <urgency-derived deadline> < now()`.
2. `user_work_summary.overdue_count` = `count(*) FILTER (WHERE is_overdue = true)` (the `:142` pin, confirmed live).
3. → `unified-work-list` edge fn → `useUnifiedWork.ts` → the stat card.

**Mandated assertion**, one statement, same clock:

```sql
SELECT source, count(*) FROM unified_work_items WHERE status = 'completed' AND is_overdue GROUP BY source;
-- []  (zero rows)
```

**That zero is instrument-tested** (a zero over an empty population proves nothing) — same-clock,
one statement:

<!-- prettier-ignore -->
| source | rows_total | status_completed_rows | overdue_rows | completed_and_overdue | terminal_and_overdue |
| --- | --- | --- | --- | --- | --- |
| commitment | 10 | 0 | 10 | 0 | 0 |
| intake | 2 | 0 | 0 | 0 | 0 |
| task | 9 | 3 | 6 | 0 | 0 |

The task arm carries BOTH completed rows (3) and overdue rows (6) and their intersection is empty —
non-vacuous. `terminal_and_overdue` generalises to each arm's OWN terminal set. **Stated honestly:**
for the commitment and intake arms the `status='completed'` filter is vacuous today (0 such rows;
`completed` is not even in the intake lifecycle) — those arms are covered by `terminal_and_overdue`,
not by the mandated statement.

**Targeted falsification (both directions, same row, same past deadline)** — because the live data
contains no completed-AND-past-deadline task, the invariant was tested by constructing one:

<!-- prettier-ignore -->
| arm | row state | `is_overdue` | widget `overdue_count` |
| --- | --- | --- | --- |
| A | completed + `sla_deadline = now() - 1 day` | **false** | 16 |
| B | same row, same deadline, flipped to `pending`/`todo` | **true** | **17** |

The count moves by exactly 1, and completeness is the only thing that changed — the widget
provably excludes a completed task, rather than being presumed to "by construction". (Arm B also
re-proved the trigger: the flip wrote `workflow_stage='todo'` only, and `status` became `pending`.)
The scratch row was deleted afterwards; the post-cleanup census is the AFTER table above.

**Falls outside (stated):** commitments-only widgets (`OverdueCommitments.tsx` — the stored notion,
96-02); /custom-dashboard's separate computed metric (96-03's population); `MyTasks.tsx` per-row due
labels (per-task date state, not an overdue-count widget).

## "Lands in kanban Done" — observed

Under the real user's claims (`set_config('request.jwt.claims', …)` + `SET LOCAL ROLE authenticated`),
`get_unified_work_kanban('personal', NULL, 'status', ARRAY['task','commitment'], NULL, 50)`:

```
column_key  | source     | n  | scratch_row_here
done        | task       | 4  | 1
in_progress | task       | 2  | 0
overdue     | commitment | 10 | 0
todo        | task       | 4  | 0
```

The `done` column holds the 3 repaired rows plus the scratch task completed through the deployed
function. Pre-repair this column was empty of these rows (they sat in `todo`). The 96-02 semantics
are what admit them; this plan's repair and writer fix are what put truthful rows there.

## Deployed-artifact writer proof (behavioural, not code-reading)

Negative control first — the pre-fix writer shape, reproduced on demand on a scratch row:

```
UPDATE tasks SET status='completed' (no workflow_stage)  ->  status=completed, workflow_stage=todo, completed_at=NULL
```

Then the deployed function, same row reset to `pending`/`todo`:

```
PUT tasks-update/fa246d6d-… {"status":"completed"} -> 200
returned status= completed workflow_stage= done completed_at= 2026-08-17T00:49:41.238+00:00
```

(JWT minted from `.env.test` inside a throwaway script under `/tmp`, never committed; no credential
was printed — the script reports only `token: minted (len N chars, not printed)`.)

## Deploy + probe evidence

`supabase functions deploy tasks-update --project-ref zkrcjzdemdmwhearhfgg` → exit 0,
`Deployed Functions on project zkrcjzdemdmwhearhfgg: tasks-update`.

`bash scripts/probe-edge-auth.sh tasks-update assignments-my-assignments`, verbatim:

```
tasks-update -> 500
assignments-my-assignments -> 200
```

Exit 0; no `-> 401`, no `404-kind: gateway`. **The 500 is the probe's request shape, not a
regression:** the probe issues a bare GET with no body; `tasks-update` takes the last path segment
as the task id (`'tasks-update'`, truthy → passes the 400 guard) and then `await req.json()` throws
on the empty body → the catch-all 500. That happens at `:100`, long before the status/stage logic at
`:180`+. Auth passed, which is the probe's verdict rule.

## Gate records (red → green, per half)

**Task 1 gate — RED on the undone tree (exit 1), RED after the work (exit 1).**
Cause of the residual red is NOT the subject — see BLOCKED #1. Per-conjunct after the work:

<!-- prettier-ignore -->
| conjunct | result |
| --- | --- |
| `command grep -q 'export const STAGE_TO_STATUS' …WorkBoard.tsx` | exit 0 (was 1 — the export did not exist) |
| `test -f …stage-status-parity.test.ts` | exit 0 (was 1) |
| `test -f …20260817500005_p96_task_stage_status_repair.sql` | exit 0 (was 1) |
| `command grep -qi 'POPULATION' <migration>` | exit 0 (was 1) |
| `pnpm exec vitest run …stage-status-parity.test.ts --reporter=basic` | **exit 1 — `Error: Failed to load custom Reporter from basic`** |
| same command WITHOUT `--reporter=basic` | exit 0 — `Test Files 1 passed (1)`, `Tests 7 passed (7)` |

**Task 2 gate — RED on the undone tree (exit 1), RED after the work (exit 1).**
Cause of the residual red is NOT the subject — see BLOCKED #2. Per-conjunct after the work:

<!-- prettier-ignore -->
| conjunct | result |
| --- | --- |
| `grep STATUS_TO_STAGE supabase/functions/tasks-update/index.ts` | exit 0 (was 1) |
| `grep STATUS_TO_STAGE backend/src/services/tasks.service.ts` | exit 0 (was 1) |
| `grep STATUS_TO_STAGE supabase/functions/assignments-my-assignments/index.ts` | **exit 1 — the file is a READER** |
| probe half (positive shape pin + no 401 + no gateway-404) | exit 0 |

Instrument tests (D-23): `command grep` proven against known-present tokens
(`STAGE_TO_STATUS` → 2 hits in each of the two files carrying it; `updateTaskStatusFromCommitment`
→ 1 hit) before any zero was believed. All loops ran under `bash` (zsh does not word-split — an
unquoted `--include=*.ts` sweep failed with `no matches found` and was re-run under bash). Exit
codes captured directly, never through a pipe (a first attempt read `${PIPESTATUS[0]}` under zsh
and returned empty — re-run with redirection + `$?`).

## C9b consumer: `tests/e2e/06-work-item-crud.spec.ts` — **RED, cause outside this plan**

Existence asserted first (`test -f` → 0); `--list --no-deps` → `Total: 1 test in 1 file` (hardcoded
expectation, not list-derived); run as
`pnpm exec playwright test tests/e2e/06-work-item-crud.spec.ts --project=chromium-en --no-deps`.

**Colour: RED.** Failure is at the FIRST step (`getByRole('button', {name: /new task…/})`, 30s
timeout) and the captured page snapshot is the **Sign In screen** — the stale `admin/analyst.json`
storage states (dated Jun 4) with `--no-deps` skipping the `setup` project. This is E2ECRED-01 /
D-18 territory, not a defect of this change: the failure occurs before any task is created, let
alone a status written. **Not repaired in-task** — it is not red for a change of mine, and repairing
the shared auth fixture is outside this plan's `files_modified`. The behavioural coverage the spec
would have given is supplied instead by the deployed-artifact writer proof and the kanban Done
observation above.

## Other checks

- `backend` `tsc --noEmit` → exit 0; `frontend` `tsc --noEmit` → exit 0
- `eslint` on all three changed TS files → exit 0; `prettier --check` on all four → exit 0

## Decisions Made

- **No vacuous token.** The Task 2 gate could have been turned green by writing `STATUS_TO_STAGE`
  into a comment in `assignments-my-assignments`. That is a vacuous guard (D-14) and improvising
  around a gate (execution rule 5). The gate stays red and the fact is filed.
- **`IS DISTINCT FROM 'done'`** in the repair instead of the plan's literal `NOT IN ('done')` —
  identical on the live population (no NULL stages exist), NULL-safe if one ever appears.
- **`assignments-my-assignments` not redeployed.** The plan said "redeploy both"; that premise was
  the (incorrect) claim it is a writer. Its deployed v22 was fetched and is substantively identical
  to repo source, so a redeploy would be a version bump with zero delta and non-zero risk.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] A third status-direct writer, unnamed by the plan**

- **Found during:** Task 2 (the mandated per-file census)
- **Issue:** `tasks.service.ts:695` `updateTaskStatusFromCommitment` writes `status` with no
  `workflow_stage` — the exact defect shape the plan set out to close, at a site the plan's writer
  list did not carry. The plan itself declares the named three a floor.
- **Fix:** carries `workflow_stage: STATUS_TO_STAGE[newStatus]`.
- **Files modified:** `backend/src/services/tasks.service.ts`
- **Verification:** `tsc` exit 0; the token pinned by the same gate conjunct.
- **Committed in:** `7a6838d46`

**2. [Rule 1 — Trivial] NULL-safe repair predicate** — `IS DISTINCT FROM 'done'` for
`NOT IN ('done')`. Same rows on live data. **Committed in:** `8701920eb`

**3. [Rule 1 — Trivial] One redeploy, not two** — see Decisions.

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 trivial)
**Impact on plan:** no scope creep; the missing-critical fix is inside the plan's own
`files_modified` and its stated intent.

## Issues Encountered

- The first census sweep ran under zsh and died on `--include=*.ts` (`no matches found`) — re-run
  under `bash`. The D-23 instrument facts earned their place.
- A `${PIPESTATUS[0]}` exit-code read returned empty under zsh; re-run capturing `$?` directly.

## BLOCKED

**1. Task 1's gate cannot exit 0: `--reporter=basic` was removed in Vitest 4.**

- Observed: the gate's final conjunct fails with
  `Error: Failed to load custom Reporter from basic` (`loadCustomReporterModule`), i.e. Vitest 4.1.7
  no longer resolves `basic` as a built-in and tries to import it as a module.
- **Discriminating control run:** the SAME flag on a PRE-EXISTING, otherwise-green test —
  `pnpm exec vitest run src/pages/WorkBoard/__tests__/commitment-stage-guard.test.ts --reporter=basic`
  → exit 1, identical error; without the flag → exit 0, `Tests 14 passed (14)`. **The flag, not the
  subject, is what is red.**
- The subject itself is green: the parity test passes 7/7 and all four other conjuncts exit 0.
- Not improvised around, not edited (gates must stay byte-identical to `b4072302a`).
- **Blast radius beyond this plan:** `96-09-PLAN.md:126` carries the same flag, and
  `96-VALIDATION.md:24` / `96-RESEARCH.md:1000` prescribe it as the phase's "quick run command" —
  every plan that copied it inherits an unsatisfiable gate. Needs a phase-level ruling
  (drop the flag, or pin `--reporter=default`).

**2. Task 2's gate cannot exit 0: `assignments-my-assignments` is a READER, not a writer.**

- Observed: the file (222 lines) contains zero `.update(` / `.insert(` / `.upsert(` calls. The
  plan's `:122` is `.from('tasks')` immediately followed by `.select(id, title, …)` at `:123` — the
  research grep matched the table reference, not a write.
- **Confirmed on the deployed artifact too** (not just repo source): `get_edge_function` returned
  slug `assignments-my-assignments` version 22, ACTIVE — same read-only body.
- There is therefore no status write to route, and no honest edit that introduces
  `STATUS_TO_STAGE` into it. Adding the token to satisfy the grep would be a vacuous guard (D-14).
- The gate's other conjuncts are green (the two real writers carry the token; the probe half exits
  0), and the plan's substantive `must_have` — "no writer updates `tasks.status` without the
  matching `workflow_stage`" — holds across the census, including a writer the plan did not name.
- Needs a ruling: re-point the third conjunct at a real writer (`tasks.service.ts` already covered;
  the open one is `workflow-executor`, below) or drop it.

**3. FILED, out of `files_modified`: `supabase/functions/workflow-executor/index.ts:550`.**

- `executeUpdateStatus` writes `{ status, updated_at }` on `getTableName(execution.entity_type)` —
  when that resolves to `tasks`, it is a fourth status-direct writer with the same divergence shape.
- Not fixed here: the file is outside this plan's `files_modified`, and the fix needs a
  table-conditional map (the generic writer also serves non-task entities).
- Related, same class, also filed: INSERT-time divergence — `tasks.service.ts:127` and
  `tasks-create/index.ts:195` both hardcode `status:'pending'` while accepting a caller-supplied
  `workflow_stage`, and tasks have no INSERT trigger. Today no caller supplies a non-`todo` stage at
  create, so no live rows diverge, but the hole is structural.

## User Setup Required

None.

## Next Phase Readiness

- 96-09 can proceed: `STAGE_TO_STATUS` is exported and `stage-status-parity.test.ts` exists (its
  gate lists that file) — **but 96-09's gate carries the same `--reporter=basic` defect**; it will
  hit BLOCKED #1 unless the phase rules on the flag first.
- COUNT-04 inherits a clean pair: no live task row diverges, and both reachable status-direct
  writers route through the stage.

---

_Phase: 96-real-numbers_
_Completed: 2026-08-17_

SUMMARY-END
