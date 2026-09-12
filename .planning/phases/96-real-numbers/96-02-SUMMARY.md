---
phase: 96-real-numbers
plan: 02
subsystem: database
tags: [postgres, supabase, triggers, rpc, plpgsql, kanban, commitments, overdue]

# Dependency graph
requires:
  - phase: 94-write-paths
    provides: the BEFORE-trigger sweep that structurally identified commitment_overdue_check as UPDATE-only
  - phase: 96-real-numbers
    provides: 96-RESEARCH Derivation 2 (trigger census + six-formula overdue table), Derivation 3 (Done starvation), Pitfall 3 (history re-fire), RULING-P96-01 (keep refusal + state the winning notion)
provides:
  - commitment_overdue_check re-timed to BEFORE INSERT OR UPDATE — a past-due commitment is now stored overdue at INSERT
  - the 2 past-due pending staging rows coerced to overdue by the trigger (10 stored overdue at close)
  - get_commitment_fulfillment's overdue bucket counting the STORED status (was blind to all stored overdue rows)
  - get_unified_work_kanban + get_kanban_column_counts admitting completed rows so the Done column can fill
  - the commitments kanban arm's is_overdue reading the stored status
  - ONE intake SLA formula (urgency-scaled) shared by the kanban RPC and the unified_work_items view
  - the SC4 reconciliation rule (the kanban leg compares column_key <> 'done') stated at the point the population changed
affects:
  [
    96-06 analytics fulfillment chart,
    96-07 count agreement SC4,
    96-08 Done-column oracle + workflow_stage repair,
    96-09 overdue badge/chip,
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Trigger re-timing under an UNCHANGED name (alphabetical BEFORE-fire order is load-bearing)'
    - 'Data migration that writes no status literal — the trigger performs the coercion'
    - 'CREATE OR REPLACE re-created from LIVE pg_proc prosrc, never from a stale migration copy'
    - 'Same-statement parity oracle calling the DEPLOYED function beside its own stored fact'

key-files:
  created:
    - supabase/migrations/20260817500002_p96_commitment_overdue_insert_gap.sql
    - supabase/migrations/20260817500003_p96_rpc_count_truth.sql
  modified: []

key-decisions:
  - 'COMMITMENTS: the STORED aa_commitments.status=overdue wins on every surface (RULING-P96-01 condition 3)'
  - 'TASKS / INTAKE: the COMPUTED comparison wins — no stored notion exists; intake unifies on the urgency-scaled SLA'
  - 'SC5 Done semantics: the board SHOWS completed work (status <> cancelled), no recency bound'
  - 'The 2 existing past-due pending rows ARE migrated in-migration by a touch-UPDATE'
  - 'The COUNT-04 refusal interaction ships byte-unchanged (branch (a), D-10)'

patterns-established:
  - 'Winning-notion record: a unification states which signal wins on which surface, in the migration header'
  - 'SC4 reconciliation rule stated where the population changes, measured by the downstream plan that compares'

requirements-completed: [COUNT-04, COUNT-03, DEAD-05]

# Metrics
duration: 22min
completed: 2026-08-17
---

# Phase 96 Plan 02: DB Count Truth Summary

**The overdue INSERT gap is closed at the trigger, the fulfillment chart counts the stored fact instead of a class the fix empties, and the kanban Done column is no longer structurally starved — two migrations, applied to staging with same-clock recorded evidence.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-08-17T00:10Z (approx — first live catalog pull)
- **Completed:** 2026-08-17T00:32Z
- **Tasks:** 2
- **Files created:** 2 (both migrations; no source files modified)

## Accomplishments

- `commitment_overdue_check` fires on INSERT — a probe row submitted `pending` with a past
  `due_date` came back **`overdue`** from the DB, not from any client.
- The two past-due `pending` rows the register named are gone: `aa_commitments` now holds
  **10 overdue / 0 pending**, with zero past-due pending remaining.
- `get_commitment_fulfillment`'s overdue bucket and the stored fact are **equal in one
  statement** (10 == 10) — measured by calling the deployed function, never by re-deriving it.
- The kanban board admits completed rows: **3 completed tasks now reach the board query** that
  previously excluded them outright, proving the Done column can fill.
- `get_kanban_column_counts` agrees with the board rows **by construction** (todo 7 / in_progress
  4 / overdue 10, both RPCs, one authenticated session).

## Task Commits

1. **Task 1: Re-time commitment_overdue_check to BEFORE INSERT OR UPDATE** — `77c4c6e60` (fix)
2. **Task 2: RPC count truth — fulfillment bucket, Done semantics, stored-overdue arm, one intake SLA** — `0e1da64ec` (fix)

## Files Created/Modified

- `supabase/migrations/20260817500002_p96_commitment_overdue_insert_gap.sql` — trigger re-timing
  under the unchanged name + the population-scoped touch-UPDATE that lets the trigger coerce the
  two existing rows. Carries the `-- was:` record of both the live trigger definition and the full
  `check_commitment_overdue()` prosrc, plus the POPULATION DEFINITION.
- `supabase/migrations/20260817500003_p96_rpc_count_truth.sql` — three `CREATE OR REPLACE`
  functions re-created from live prosrc with the four decided truth changes, re-stated GRANTs, and
  a header carrying the winning-notion record, every filter seam before/after, the SC5 Done
  decision and the SC4 reconciliation rule.

---

## 1. The winning-notion table (RULING-P96-01 condition 3)

<!-- prettier-ignore -->
| Surface | Source type | Winning notion | Formula at close |
| --- | --- | --- | --- |
| Kanban card badge + toolbar chip | commitment | **STORED** | `aa_commitments.status = 'overdue'` |
| `/commitments` tabs | commitment | **STORED** | `aa_commitments.status = 'overdue'` |
| Analytics fulfillment chart | commitment | **STORED** | `COUNT(*) FILTER (WHERE status = 'overdue')` |
| Kanban board + `/my-work` | task | **COMPUTED** | `sla_deadline < NOW() AND status NOT IN ('completed','cancelled')` |
| Kanban board + `/my-work` | intake | **COMPUTED** | urgency-scaled SLA (critical 24h / high 48h / medium 72h / low 7d / else 72h) `< NOW()` AND `status NOT IN ('converted','closed','merged')` |

The trigger is what makes the stored notion authoritative for commitments: bidirectional on
UPDATE (its `ELSIF` reverts `overdue → in_progress` when a due date is extended) and, as of this
plan, INSERT-time as well. No stored overdue notion exists for tasks or intake, so the computed
comparison wins there — unified to ONE formula per source type.

**The refusal interaction ships byte-unchanged** (branch (a), D-10). A future allow-and-reflect
revisit is a post-close mutation that must NAME the gates whose subjects it changes — at minimum
this plan's two gates and 96-09's badge/chip oracles.

## 2. The was-prosrc of all four DB objects

### 2.1 `commitment_overdue_check` (trigger) — was

```
CREATE TRIGGER commitment_overdue_check BEFORE UPDATE ON public.aa_commitments
  FOR EACH ROW EXECUTE FUNCTION check_commitment_overdue()
```

Now: `BEFORE INSERT OR UPDATE`, name unchanged (re-read from `pg_get_triggerdef` after apply —
recorded in §4.1).

### 2.2 `check_commitment_overdue()` — was (unchanged by this plan)

```sql
CREATE OR REPLACE FUNCTION public.check_commitment_overdue()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- If commitment is past due date and status is pending or in_progress, mark as overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending', 'in_progress') THEN
    NEW.status := 'overdue';
    NEW.updated_at := NOW();
  -- If commitment was overdue but due_date has been extended, revert to in_progress
  ELSIF NEW.status = 'overdue' AND NEW.due_date >= CURRENT_DATE THEN
    NEW.status := 'in_progress';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$function$
```

**A1 CONFIRMATION (96-RESEARCH Assumptions Log):** the full prosrc was pulled from `pg_proc`
BEFORE authoring. The body references **`NEW` only — `OLD` appears nowhere**, and there is no
`TG_OP` branch. The re-timing to `BEFORE INSERT OR UPDATE` therefore needs **no body change and
no `TG_OP` guard**. A1 is CONFIRMED, not assumed. (Had `OLD` been referenced, the plan's
contingency was to guard the branch with `TG_OP` checks and record the deviation — not needed.)

### 2.3 `get_commitment_fulfillment` — was (overdue bucket only; the rest is byte-identical)

```sql
COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND due_date < NOW()) AS overdue_count,
```

Now:

```sql
COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count,
```

Full was-signature preserved verbatim: `SECURITY DEFINER`, `LANGUAGE plpgsql`, params
`(p_start_date timestamptz DEFAULT now() - '30 days', p_end_date timestamptz DEFAULT now())`,
11-column `RETURNS TABLE`. Outer filter `WHERE status != 'cancelled' AND created_at <=
p_end_date` unchanged. The other four buckets (`on_time`, `late`, `pending_count`, `completed`),
`trend_data`, `by_tracking` and the final SELECT are byte-identical to the live prosrc.

**Why this had to land in the same change set:** the old filter counted only past-due
`pending`/`in_progress`. Task 1 empties that class permanently, so the chart's overdue series
would have gone to **0 forever, silently** — reported as a fact. It read 2 against 8 stored
before this plan; it reads 10 against 10 after.

### 2.4 `get_unified_work_kanban` — was (the changed expressions; ~250 lines otherwise byte-identical)

```sql
-- tasks arm filter
      AND t.status NOT IN ('completed', 'cancelled')
-- commitments arm filter
      AND c.status NOT IN ('completed', 'cancelled')
-- commitments arm is_overdue
      c.due_date < CURRENT_DATE AND c.status NOT IN ('completed', 'cancelled') as is_overdue,
-- intake arm deadline / is_overdue / days_until_due (flat 3-day, all three)
      i.submitted_at + INTERVAL '3 days' as deadline,
      (i.submitted_at + INTERVAL '3 days') < NOW()
        AND i.status NOT IN ('converted', 'closed', 'merged') as is_overdue,
      CASE WHEN i.submitted_at IS NULL THEN NULL
           ELSE EXTRACT(DAY FROM (i.submitted_at + INTERVAL '3 days') - NOW())::INT END as days_until_due,
```

Now: both filters become `status <> 'cancelled'`; the commitments `is_overdue` becomes
`c.status = 'overdue'`; all three intake expressions adopt the urgency-scaled `CASE` copied from
the `unified_work_items` view. Signature, `SECURITY DEFINER`, the 21-column `RETURNS TABLE`, the
`ranked_items` window and the final ORDER BY are preserved verbatim.

### 2.5 `get_kanban_column_counts` — was (the changed expressions only)

```sql
-- tasks arm
      AND t.status NOT IN ('completed', 'cancelled')
-- commitments arm
      AND c.status NOT IN ('completed', 'cancelled')
```

Now both `status <> 'cancelled'`, matching the board arms so per-column counts agree with the
board rows **by construction rather than by authorship**. Its intake arm carries no overdue
expression, so the SLA change does not apply to it.

## 3. Gate records — every half observed

<!-- prettier-ignore -->
| Gate | RED observed | GREEN observed | Notes |
| --- | --- | --- | --- |
| Task 1 static gate (5 pins) | `TASK1_GATE_EXIT=1` on the undone tree — `test -f` fails, the subject file is this task's own product | `TASK1_GATE_EXIT=0` after authoring | Run verbatim from the plan, byte-identical to plan-accept HEAD `b4072302a` |
| Task 1 behavioural half | labelled UNPROVEN by the plan (staging state cannot be constructed in scratch) | **PROVEN at execution** — §4.1 | Recorded same-clock MCP SQL |
| Task 2 static gate (6 pins) | `TASK2_GATE_EXIT=1` on the undone tree — `test -f` fails, subject absent | `TASK2_GATE_EXIT=0` after authoring | Run verbatim; gate text unedited |
| Task 2 behavioural half (a) parity | labelled UNPROVEN by the plan | **PROVEN at execution** — §4.2 | Deployed function called beside its stored fact, one statement |
| Task 2 behavioural half (b) done-column | labelled UNPROVEN by the plan | **PROVEN at execution** — §4.3 | Authenticated TEST_USER supabase-js client |

No gate text was edited. No gate was folded into a pass.

## 4. Recorded same-clock evidence

### 4.1 Task 1 — INSERT returns overdue

Probe INSERT (submitted `status = 'pending'`, `due_date = CURRENT_DATE - 5`), namespaced
`P96-INSERTGAP-CHECK`. `aa_commitments`' CHECK list was derived from `pg_constraint` FIRST per
house rule — the probe satisfies `valid_owner` (`owner_type='internal'` + `owner_user_id` +
`owner_contact_id IS NULL`), `valid_tracking` (`automatic`+`internal`), `aa_commitments_status_check`
(five values) and `aa_commitments_description_check` (1–2000 chars).

```
id                                   | title                | due_date   | status_observed_after_insert
076bfe6b-e3e1-4873-9f80-ca455c1c5e33 | P96-INSERTGAP-CHECK  | 2026-08-12 | overdue
```

**Submitted `pending`, stored `overdue`.** The probe row was DELETEd in the same session
(`probe_rows_remaining = 0`, verified).

Population after apply, one statement:

```
status  | n  | past_due
overdue | 10 | 10
```

```
history_rows_after = 4 | past_due_pending_remaining = 0 | probe_rows_remaining = 0
trigger_now = CREATE TRIGGER commitment_overdue_check BEFORE INSERT OR UPDATE ON
              public.aa_commitments FOR EACH ROW EXECUTE FUNCTION check_commitment_overdue()
```

Before: `overdue 8 (8 past-due) / pending 2 (2 past-due)`. After: `overdue 10 / pending 0`. The
migration wrote no status literal — the trigger performed both coercions.

**POPULATION DEFINITION, re-derived at apply time (D-15):** rows with `status = 'pending' AND
due_date < CURRENT_DATE` — **2 rows**, matching the register's floor. Falls outside: rows already
stored `overdue` (8, nothing to do); past-due `in_progress` rows (0 at apply); rows whose
`due_date` passes later with no write (previously the permanent gap, now covered at INSERT and on
every UPDATE); `completed`/`cancelled` rows (terminal, never coerced by the function).

### 4.2 Task 2 verify (a) — the fulfillment parity batch

The DEPLOYED function is called beside the stored count in **one statement**, so the observation
measures the RPC's own overdue bucket and never a plain-SQL re-derivation of it. Legitimate under
MCP because `get_commitment_fulfillment` is `SECURITY DEFINER` and references no `auth.uid()`.

```sql
SELECT (SELECT overdue FROM get_commitment_fulfillment()) AS a_rpc_overdue_bucket,
       (SELECT count(*) FROM aa_commitments WHERE status='overdue') AS b_stored_overdue,
       (SELECT overdue FROM get_commitment_fulfillment()) = (SELECT count(*) FROM aa_commitments WHERE status='overdue') AS parity_a_eq_b,
       now() AS observed_at;
```

```
a_rpc_overdue_bucket = 10 | b_stored_overdue = 10 | parity_a_eq_b = true
observed_at = 2026-08-17 00:30:11.981073+00
```

**a == b.** Before this migration the same comparison would have read `a=2, b=10`.

### 4.3 Task 2 verify (b) — the done-column readback, authenticated

`get_unified_work_kanban` reads `auth.uid()`, RAISEs `'Not authenticated'` when NULL, and carries
**no `p_user_id` parameter** — MCP SQL and a bare service-role call cannot execute it. The
readback therefore ran through an **authenticated supabase-js client signed in as the `.env.test`
TEST_USER** (D-18 inline auth; no password or key echoed anywhere). Scratch script, not committed.

**Client identity, stated with the result:** `kazahrani@stats.gov.sa`,
`auth.uid() = de2734cf-f962-4e05-bf62-bc9e92efff96`. Single call, so there is no cross-call seam.

```
OBSERVED_AT=2026-08-17T00:31:26.489Z
TOTAL_ROWS=21
DONE_COLUMN_ROWS=0
ACTIVE_POPULATION_ROWS=21
BY_COLUMN={"in_progress":4,"overdue":10,"todo":7}
BY_COLUMN_SOURCE_STATUS={"in_progress|task|status=in_progress":2,"in_progress|intake|status=in_progress":1,
                         "in_progress|intake|status=assigned":1,"overdue|commitment|status=overdue":10,
                         "todo|task|status=pending":4,"todo|task|status=completed":3}
COMPLETED_ROWS_ON_BOARD=3
IS_OVERDUE_TRUE_ROWS=16
COLUMN_COUNTS_RPC=[{"column_key":"overdue","total_count":10},{"column_key":"todo","total_count":7},
                   {"column_key":"in_progress","total_count":4}]
```

**The observed done-column row count is 0.** Recorded, not asserted — and the mechanism is
derived rather than assumed, because a 0 that is not explained is indistinguishable from a
migration that did nothing:

- The filter change **is live**: `COMPLETED_ROWS_ON_BOARD = 3`. Those three rows
  (`todo|task|status=completed`) were excluded outright by the old
  `status NOT IN ('completed','cancelled')` and now reach the board. Before this migration
  TEST_USER's `todo` column held 4 rows; it holds 7.
- They land in `todo`, not `done`, because their `workflow_stage` is stale `'todo'` while
  `status` is `completed` — the COUNT-03 invariant violation 96-RESEARCH Derivation 3 measured
  (3 rows, and these are the only completed tasks in the whole `tasks` table). `column_key =
COALESCE(workflow_stage, status)`, so once 96-08 repairs `workflow_stage → 'done'` these same
  three rows land in Done with no further RPC change.
- There are **zero completed commitments** on staging (`aa_commitments` is 10 overdue, 0 of
  anything else), so the commitments arm contributes nothing to Done either.

So Done is no longer _structurally_ starved — the mapping is live and reachable; the population
that would fill it is still mis-staged, and repairing it is 96-08's job (producer before
consumer, as planned).

**Cross-RPC agreement, same session, same clock:** `get_kanban_column_counts` returns exactly the
board's per-column row counts (todo 7 / in_progress 4 / overdue 10). They agree by construction.

## 5. SC4 reconciliation rule (stated here and in the Task 2 migration header)

This filter change makes the board's TOTAL population structurally UNEQUAL to the SC4 active-work
surfaces — the board now holds completed rows in Done that no other compared surface counts.

**THE RULE:** the SC4 kanban leg compares the board's **ACTIVE population** — rows in columns
excluding Done (`column_key <> 'done'`; cancelled is never returned) — the same-work subset,
measured same-clock by 96-07 Task 3's kanban leg (Test 4), with the completed-rows-in-Done seam
and the client-identity seam stated in its capture (ACCEPTANCE condition 7's seam-stated branch).
Comparing the board's TOTAL against an active-work surface would be a false disagreement
manufactured by this migration.

At this plan's close `ACTIVE_POPULATION_ROWS = 21` and `TOTAL_ROWS = 21` for TEST_USER — they
coincide today only because Done is empty. 96-07 must use the rule, not the coincidence.

## 6. Stated seams and observations (named so silence is not read as a finding)

1. **A commitment stored `overdue` maps to `column_key = 'overdue'`**, which is not one of the
   board's columns (todo / in_progress / review / done / cancelled). All 10 of TEST_USER's
   commitments sit there. This CASE is **pre-existing and byte-unchanged** by this plan — the plan
   names four changes and this is not one of them. Flagged for 96-07 / 96-09, which will meet it.
2. **Intake lifecycle filtering is unchanged** (`status NOT IN ('converted','closed','merged')`).
   The `unified_work_items` view uses `('resolved','closed','cancelled')` in its own `is_overdue`
   predicate. Only the _SLA formula_ was unified, per the plan; the lifecycle seam remains.
3. **The `unified_work_items` view bodies are not touched** by this plan, and `/custom-dashboard`'s
   direct view reads stay outside the SC4 set.
4. **Pre-existing EXECUTE grants are broader than `authenticated`.** All three RPCs already carried
   `PUBLIC` + `anon` + `authenticated` + `service_role`. `CREATE OR REPLACE` preserves the ACL and
   the re-stated `GRANT ... TO authenticated` is additive, so nothing was widened or narrowed here.
   The two kanban RPCs self-block anon (they RAISE on NULL `auth.uid()`); `get_commitment_fulfillment`
   does not. Revoking is **out of this plan's scope** and belongs to `FUNC-GRANT-01` (P100) — recorded,
   not silently fixed.
5. **`commitment_status_history` is never read as user-intent evidence** (condition 8). BEFORE
   triggers fire alphabetically and the audit reads the REWRITTEN status by design.
6. **No client-side re-implementation of what the trigger enforces** (condition 8) — this plan
   touched only DB objects. Zero frontend/backend source files were modified.
7. **Zero package installs** (T-96-SC).

## Decisions Made

- The two existing past-due `pending` rows were **migrated in-migration** rather than left to the
  next touch (Pitfall 3's fork) — the touch-UPDATE writes no status literal, so the trigger remains
  the only author of the value.
- The re-stated GRANTs target `authenticated` only and do **not** revoke the pre-existing
  broader grants (see seam 4) — revocation is P100's requirement, not this plan's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Plan expectation contradicted by DB mechanics] The touch-UPDATE produced NO `commitment_status_history` row**

- **Found during:** Task 1 (trigger re-timing + data touch)
- **Issue:** The plan's action text states the touch-UPDATE causes `commitment_status_audit` to
  "record the coercion". Measured: `commitment_status_history` held **4 rows before and 4 rows
  after** — the audit did not fire. Mechanism: `commitment_status_audit` is
  `BEFORE UPDATE **OF status**`, and Postgres fires a column-scoped trigger from the UPDATE
  statement's **target column list**, not from which values actually changed. The mandated
  statement targets only `updated_at`, so `status` is not in the list even though the overdue
  trigger rewrites `NEW.status`.
- **Fix:** None required — the plan's mandated ACTION was executed verbatim and the coercion
  landed (2 rows → overdue). Only the plan's parenthetical _expectation_ about the audit differs
  from what the DB does. Recorded rather than engineered around; no attempt was made to force a
  history row.
- **Consequence:** favourable — 96-RESEARCH Pitfall 3's concern ("oracles that count history rows
  get confused") does **not** materialize. Downstream oracles can treat `commitment_status_history`
  as untouched by this migration.
- **Verification:** `history_rows_before = 4`, `history_rows_after = 4`, measured by MCP SQL either
  side of the apply.
- **Committed in:** `77c4c6e60` (Task 1 commit — migration text unchanged by this finding)

**2. [Rule 1 — Internal coherence] The intake arm's `deadline` and `days_until_due` adopted the urgency-scaled formula alongside `is_overdue`**

- **Found during:** Task 2 (RPC count truth)
- **Issue:** The plan's action names the intake arm's _overdue expression_ as the thing that adopts
  the urgency-scaled SLA. All three intake expressions (`deadline`, `is_overdue`, `days_until_due`)
  share the same flat `submitted_at + 3 days` rule. Changing only `is_overdue` would print a card
  whose shown deadline contradicts its own overdue badge — the confident-lie class this phase
  exists to remove.
- **Fix:** All three adopt the same urgency-scaled `CASE`, copied verbatim from the
  `unified_work_items` view. This is what the plan's own must-have truth requires — "the kanban
  intake arm and the `unified_work_items` view compute overdue with ONE formula (the flat 3-day
  divergence is gone)".
- **Files modified:** `supabase/migrations/20260817500003_p96_rpc_count_truth.sql`
- **Verification:** stated explicitly in the migration header's filter-seam block; the RPC executes
  and returns intake rows in the authenticated readback (§4.3, 2 intake rows in `in_progress`).
- **Committed in:** `0e1da64ec` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 plan-expectation correction with no code impact, 1 internal
coherence elaboration within the plan's own stated truth)
**Impact on plan:** No scope creep. Neither changes plan semantics: deviation 1 changes nothing at
all and is recorded because the plan asserted a mechanism the DB does not have; deviation 2 is the
minimal change that makes the plan's own "ONE formula" truth hold on the rendered card.

## Issues Encountered

- The probe INSERT needed a valid `dossier_id` (NOT NULL, and `aa_commitments` has **no FK** to
  `dossiers` — an arbitrary UUID would have inserted but left the `sync_commitment_dossier_link`
  AFTER trigger pointing at nothing). Resolved by selecting a real dossier id inline. The probe was
  deleted in the same session and its absence verified.

## User Setup Required

None — no external service configuration required. Both migrations are applied to staging
`zkrcjzdemdmwhearhfgg`; no edge-function deploy and no secret change.

## Next Phase Readiness

- **96-06** (analytics fulfillment chart): can repoint safely — the overdue series now reads the
  stored fact and will not be silently zeroed by the INSERT-gap fix.
- **96-07** (SC4 count agreement): **must** use the §5 reconciliation rule for its kanban leg
  (`column_key <> 'done'`), and must state the client-identity seam — the kanban RPCs are per-user
  through `auth.uid()`.
- **96-08** (Done oracle + `workflow_stage` repair): the DB precondition is met. The three
  `status=completed / workflow_stage=todo` tasks are the exact population whose repair moves them
  into Done; no further RPC change is needed after that repair.
- **96-09** (badge/chip): the commitments badge signal is now a single stored fact. Note seam 6.1 —
  stored-`overdue` commitments carry `column_key = 'overdue'`, which is not a board column.

## BLOCKED

None.

---

_Phase: 96-real-numbers_
_Plan: 02_
_Completed: 2026-08-17_

SUMMARY-END
