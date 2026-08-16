---
phase: 94-write-paths
plan: 05
subsystem: database
tags: [rls, postgres, supabase, playwright, security, reports]

requires:
  - phase: 93-trust-surfaces
    provides: tests/e2e/93-report-notfound.spec.ts (the two-armed 404 oracle this plan tightens)
provides:
  - 'public.is_report_owner(uuid) — SECURITY DEFINER, STABLE, search_path pinned to empty'
  - 'report_shares SELECT / INSERT-WITH-CHECK / DELETE policies rewritten acyclic'
  - 'scripts/probe-report-rls.mjs — the D-22 two-sided visibility oracle'
  - 'tests/e2e/93-report-notfound.spec.ts — single-arm 404 assertion (ARMA-01)'
affects: [94-09 (WRITE-06 generate half), 96-analytics, reports UI, scheduled reports]

tech-stack:
  added: []
  patterns:
    - 'SECURITY DEFINER single-row owner check as the RLS recursion breaker (get_user_clearance_level precedent, plus a pinned search_path)'
    - 'Two-sided RLS oracle: three minted identities, namespaced fixtures, printed ledger, cleanup in a finally'

key-files:
  created:
    - supabase/migrations/20260816500001_p94_report_rls_recursion.sql
    - scripts/probe-report-rls.mjs
  modified:
    - tests/e2e/93-report-notfound.spec.ts

key-decisions:
  - 'Candidate 1 (definer owner-check helper) applied as planned; candidates 2 and 3 stayed refused'
  - 'The helper body is the plan/research form verbatim (SELECT created_by = auth.uid() FROM ... WHERE id = $1) — no EXISTS rewrite'
  - "custom_reports' and report_executions' policies deliberately untouched: with report_shares acyclic, every path terminates"

patterns-established:
  - 'A recursion fix ships with a negative half: a third identity that must see NOTHING'

requirements-completed: [WRITE-06, ARMA-01]

duration: ~20 min
completed: 2026-08-16
---

# Phase 94 Plan 05: Report RLS recursion + ARMA-01 Summary

**The `custom_reports` ↔ `report_shares` 42P17 recursion is broken by a pinned-search_path
`SECURITY DEFINER` owner check, proven two-sided against staging (A=1 / B=1 / C=0, no widening),
and the report-404 spec now asserts the 404 arm alone.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-16T13:58Z (approx.)
- **Completed:** 2026-08-16T14:18Z
- **Tasks:** 3
- **Files modified:** 3 (2 created, 1 edited)

## Task Commits

1. **Task 1: the recursion migration, applied via MCP** — `71677297f` (fix)
2. **Task 2: the D-22 two-sided probe + criterion-5 schedule oracle** — `2ffd0e6b2` (test)
3. **Task 3: ARMA-01 — delete arm (b), assert 404 alone** — `d48be4937` (test)

Scope diff confirms exactly three paths changed vs the phase tag:

```
$ git diff --name-only phase-94-base -- supabase/migrations/20260816500001_p94_report_rls_recursion.sql scripts/probe-report-rls.mjs tests/e2e/93-report-notfound.spec.ts
scripts/probe-report-rls.mjs
supabase/migrations/20260816500001_p94_report_rls_recursion.sql
tests/e2e/93-report-notfound.spec.ts
```

## THE GATE DRILL — every gate, both directions, real output

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| --- | --- | --- | --- |
| `94-05_g1` (plan:109) | `bash -c "test -f supabase/migrations/20260816500001_p94_report_rls_recursion.sql && grep -q 'SECURITY DEFINER' … && grep -q \"search_path\" … && grep -q 'is_report_owner' …"` → no stdout, **`g1 exit=1`** (migration file absent — this gate's subject IS the file, so C2 holds) | same command verbatim after the file landed → **`g1 exit=0`**; re-run again from the committed tree → **`g1 exit=0`** | File-shape gate. Its behavioural counterpart is `g2`; the DB-side evidence required by the acceptance criterion (MCP apply + post-apply `pg_policies`) is pasted below. See GATE CONCERN. |
| `94-05_g2` (plan:142) | (i) literal: `bash -c "test -f scripts/probe-report-rls.mjs && node scripts/probe-report-rls.mjs"` → **`g2 exit=1`** (script absent). (ii) **substantive, and irreplaceable** — probe authored FIRST and run BEFORE the migration, as three real authenticated identities: `HARD FAIL — 42P17 RECURSION at custom_reports INSERT as A (HTTP 500): {"code":"42P17","details":null,"hint":null,"message":"infinite recursion detected in policy for relation \"custom_reports\""}` … `PROBE FAILED — 1 assertion(s)` → **`probe exit=1`** | same command verbatim after the migration → full ledger (below) ending `PROBE PASSED — no 42P17; A=1 / B=1 / C=0; schedule created; fixtures cleaned` → **`g2 exit=0`** (captured directly, never through a pipe) | The `42P17` baseline as `authenticated` had never been observed — research could only infer it (Management API denies `SET ROLE authenticated`). Observed here, live, before the migration made it unobservable. |
| `94-05_g3` (plan:166) | `bash -c "test -f tests/e2e/93-report-notfound.spec.ts && test \"\$(grep -c 'query-error-state' …)\" -eq 0 && OUT=\$(pnpm exec playwright test … --no-deps 2>&1) && echo \"\$OUT\" \| grep -qE '(^\|[^0-9])1 passed'"` → **`g3 exit=1`**; the arm-(b) residue count was `3` (lines 17 / 74 / 88) | same command verbatim after the deletion → **`g3 exit=0`**. Evidence run of the same Playwright invocation, output printed: `✓ 1 [chromium-en] › tests/e2e/93-report-notfound.spec.ts:49:7 › … absent report id renders the 404 page, never a fresh builder (3.5s)` / `1 passed (3.8s)` | Ran strictly AFTER the migration (D-02). Count hardcoded (D-26); `--no-deps` + the spec's inline auth (D-27) — no dependence on the `setup` project (E2ECRED-01). |

**Instrument tests run before believing any zero** (trap 1 and trap 10):

- `grep -c 'notFoundPage' tests/e2e/93-report-notfound.spec.ts` → `2` (present), alongside
  `grep -c 'query-error-state' …` → `0` (absent). A grep that finds the positive control and not
  the negative one is discriminating; a bare `0` is not.
- The C9b sweep's `find`-derived roots were re-run under `bash` after the zsh no-word-split trap
  (#9) produced `bfs: error: ./tests\n./e2e/tests…: No such file or directory` — the first form's
  empty result would have read as "no consumers".
- Exit codes captured directly, never through a pipe (trap 2). One `${PIPESTATUS[0]}` read came
  back empty under zsh mid-run; `g2`'s recorded `exit=0` is from a re-run with **no pipe at all**.

### `g2` GREEN — the full printed ledger (post-migration)

```
[1] mint three identities (service-role)
  A p94-probe-a@probe.invalid -> 848a687a-5eaa-4f03-811c-47214145812a
  B p94-probe-b@probe.invalid -> bc844770-5e1b-4690-bb0d-ae2880703848
  C p94-probe-c@probe.invalid -> 42878d01-eb88-4bf5-b89e-b486a6a3e48d

[2] as A: create a report, then share it to B
  report  p94-probe-report -> 7f4fe4ad-190b-4273-8205-963d2f98af70 (access_level=private)
  share   report 7f4fe4ad-… -> B bc844770-… = 766522dc-2fc7-473f-b6a2-96d04285a1a9

[3] D-22 two-sided visibility (the negative half is the point)
  A sees custom_reports: [7f4fe4ad-190b-4273-8205-963d2f98af70]
  B sees custom_reports: [7f4fe4ad-190b-4273-8205-963d2f98af70]
  C sees custom_reports: []
  PASS  A sees exactly her own report — 1 row(s)
  PASS  B sees exactly the row shared with them — 1 row(s)
  PASS  C (stranger) sees NO report — the row set did not widen — 0 row(s)
  A sees report_shares: [766522dc-…]   B sees report_shares: [766522dc-…]   C sees report_shares: []
  PASS  A sees the share row (is_report_owner / shared_by path)
  PASS  B sees the share row (shared_with path)
  PASS  C sees NO share row — 0 row(s)

[4] criterion 5 — a scheduled report against a real custom_reports row
  schedule p94-probe-schedule -> 35721294-065a-4ec4-bfcc-c8728d97443f (is_active=false, next_run_at=null)
  PASS  A reads her schedule back, bound to the real report — HTTP 200

[5] cleanup (reverse order) — both report tables were live-empty; leave them so
  schedule … deleted -> HTTP 204 | share … deleted -> HTTP 204 | report … deleted -> HTTP 204
  user p94-probe-{a,b,c}@probe.invalid deleted -> HTTP 200 (×3)
  service-role row counts after cleanup: {"custom_reports":0,"report_shares":0,"report_schedules":0}
  PASS  fixtures cleaned — custom_reports / report_shares / report_schedules all back to 0

PROBE PASSED — no 42P17; A=1 / B=1 / C=0; schedule created; fixtures cleaned
```

**Why the negative half is not vacuous:** A and B reached the row through the same code path that C
was refused on, so a blanket "everything is empty" defect would have shown as `A=0 / B=0`, not as
`C=0`. `next_run_at=null` is **printed and asserted about by nothing** (D-34/F4: the trigger derives
it and an inactive schedule legitimately has it NULL).

## MCP evidence — point-in-time, staging `zkrcjzdemdmwhearhfgg`, 2026-08-16

**Pre-apply re-derivation** (D-17-class law: research's copies are evidence, not a substitute).
`pg_policies` matched research §6 exactly — `report_shares`' SELECT / INSERT-WITH-CHECK / DELETE
each carried `EXISTS (SELECT 1 FROM custom_reports WHERE custom_reports.id = report_shares.report_id
AND custom_reports.created_by = auth.uid())`, and `custom_reports`' SELECT carried the reciprocal
`EXISTS` over `report_shares`.

**Apply:** `mcp__supabase__apply_migration(project_id=zkrcjzdemdmwhearhfgg, name=p94_report_rls_recursion)`
→ `{"success":true}`. This is the phase's **only** schema-level change; no ad-hoc DDL through
`execute_sql` (D-21).

**Post-apply re-derivation** — `report_shares` quals, verbatim:

<!-- prettier-ignore -->
| policy | cmd | qual / with_check |
| --- | --- | --- |
| Users can view shares for their reports | SELECT | `((shared_with = auth.uid()) OR (shared_by = auth.uid()) OR is_report_owner(report_id))` |
| Users can share their own reports | INSERT | with_check `((shared_by = auth.uid()) AND is_report_owner(report_id))` |
| Users can delete shares for their reports | DELETE | `((shared_by = auth.uid()) OR is_report_owner(report_id))` |

Counted rather than eyeballed:
`report_shares_quals_referencing_custom_reports = 0` of `report_shares_policies = 3`.

**Helper properties, read back from the catalog:** `prosecdef = true`, `provolatile = s` (STABLE),
`proconfig = {"search_path=\"\""}`, `owner = postgres`. Ownership matters and was checked before
applying: `custom_reports` is owned by `postgres` with `relforcerowsecurity = false` and
`rolbypassrls = true`, so the definer's one-row read does not re-enter RLS — that is the mechanism,
not an assumption.

## Files Created/Modified

- `supabase/migrations/20260816500001_p94_report_rls_recursion.sql` — the helper + the three
  rewritten `report_shares` policies. Each policy carries the pre-image of the clause it replaced
  as a comment, so the "every other clause preserved verbatim" claim is checkable in the file.
- `scripts/probe-report-rls.mjs` — the D-22 oracle. No new dependencies (global `fetch`), reads
  `.env.test`, prints every id it acts on, cleans up in a `finally` so a FAILED run also leaves the
  tables empty (the pre-migration RED run did exactly that), and never prints a key, password or
  JWT. Exit `2` = UNABLE TO MEASURE on missing credentials (C2 — a labelled state, not a red).
- `tests/e2e/93-report-notfound.spec.ts` — arm (b) deleted: the `query-error-state` locator, the
  `expect.poll` disjunction and the arm-recording block are gone, replaced by
  `await expect(notFoundPage).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })`. Kept: the
  `crypto.randomUUID()` absent id, the `notFoundPage` locator, the unconditional `builderHeading`
  conjunct, the inline auth, and `RETRY_BACKOFF_TIMEOUT` with a rewritten rationale. The test title
  lost "or the error state" — it would have been a stale description of a single-arm assertion.

## C9b consumer sweep (roots derived, never named)

Roots derived: `./frontend/tests`, `./tests`, `./backend/tests`, `./e2e/tests`.

- Specs referencing `custom_reports|report_shares|is_report_owner`: **only**
  `tests/e2e/93-report-notfound.spec.ts` — the file this plan edits, in the same task.
- Specs asserting `query-error-state` elsewhere: `frontend/tests/e2e/analytics-dashboard.spec.ts`,
  `tests/e2e/93-{tasks-queue,admin-surfaces,dossier-notfound,analytics,degraded-engagement}-*.spec.ts`
  — **NAMED non-consumers**: their surfaces (tasks queue → 95, analytics → 96, delegations → 102,
  dossiers, engagements) are untouched by a `report_shares` policy rewrite, and each belongs to the
  intended-broken register this leg must not repair.
- Specs matching `42P17|infinite recursion`: `93-admin-surfaces-error.spec.ts` (uses the SQLSTATE
  only inside a **negative** "internals must not reach the DOM" pattern, on edge functions this plan
  does not touch — a correct fix cannot red it) and this plan's own spec.

## Decisions Made

- **Helper body kept literal.** The planned body reads one `custom_reports` row by id and returns
  `created_by = auth.uid()`, so it yields NULL when the row is absent, where the `EXISTS` clause it
  replaces returns FALSE. In `USING`, `WITH CHECK` and any boolean qual these are indistinguishable
  (NULL is not-satisfied), so an `EXISTS` rewrite would have been a style deviation with no
  behavioural gain. Left as planned.
- **`custom_reports` and `report_executions` policies untouched.** Breaking one direction is
  sufficient and is the minimum change that satisfies D-22 — every remaining path terminates at the
  helper.
- **The probe asserts `report_shares` visibility too** (A/B see the share, C does not). The rewritten
  policies ARE `report_shares`', so an oracle that only read `custom_reports` would never exercise
  the thing that changed.

## Deviations from Plan

None — plan executed as written. (Task 2's artifact was **authored** before Task 1 so its
pre-migration RED could be observed, then committed in task order after Task 1. The plan's own
acceptance criterion asks for that RED, and once the migration lands the baseline is unrecoverable.)

## Threat Flags

<!-- prettier-ignore -->
| Flag | File | Description |
| --- | --- | --- |
| threat_flag: definer-exposed-to-anon | supabase/migrations/20260816500001_p94_report_rls_recursion.sql | Supabase's security advisor WARNs, verbatim: "Function `public.is_report_owner(p_report_id uuid)` can be executed by the `anon` role as a `SECURITY DEFINER` function via `/rest/v1/rpc/is_report_owner`." The default PUBLIC EXECUTE grant was left in place (the plan specifies `GRANT EXECUTE … TO authenticated` and nothing more). Impact assessed: for `anon`, `auth.uid()` is NULL, so the function returns NULL whether or not the row exists — **no information**. For an authenticated caller it distinguishes `false` (row exists, not theirs) from `null` (no such row), i.e. an existence oracle on a 122-bit random id. **333 functions in this schema already carry this exact WARN** (`is_platform_admin`, `auth_has_role`, …), so revoking PUBLIC EXECUTE is a repo-wide posture change, not this plan's scope. Recommended as a follow-up; NOT applied here (a second schema change is a park, not a file). |

T-94-08 mitigation held as designed: STABLE, `search_path` pinned empty, one-row read, boolean
return, and the D-22 probe proves the row set did not widen. T-94-09 held: fixtures namespaced,
deleted, and both report tables re-counted to 0 by the service role. T-94-SC: zero package installs.

## GATE CONCERN

**None.** No gate was edited and none was found unpassable-when-done. One observation, recorded for
the record rather than as a request for a ruling:

`94-05_g1` is a **file-shape** gate — `test -f` plus three greps. It cannot distinguish a written
migration from an applied one, so on its own it would go green for a migration that never reached
staging. It is not vacuous (it was genuinely red before the file existed and its subject is the
file), and the gap is covered twice over: the task's `<acceptance_criteria>` demands the MCP apply
result and the post-apply `pg_policies` paste (both above), and `94-05_g2` fails outright if the
policies are not actually deployed. Noted only so the next author does not read `g1 exit=0` as
evidence of a deployed policy.

## Issues Encountered

- **Shared-tree index contention.** Concurrent lanes held `.git/index.lock`; the first `git add`
  failed with `fatal: Unable to create '…/.git/index.lock': File exists`. Resolved by waiting for
  the lock to clear before each staging step. All three commits used explicit pathspecs
  (`git commit … -- <path>`) and each landed **exactly one file**, verified with `git show --stat`
  — no other lane's staged work was swept in.
- **zsh does not word-split `$ROOTS`.** The C9b sweep's first run errored under zsh; re-run under
  `bash`. Recorded because an unnoticed error there returns an empty consumer list that reads as
  clean.

## Intended-broken register — untouched

`/delegations` (102), `/admin/data-retention` legal holds (100), `/tasks/queue` (95), `/analytics`
(96), the 22-mask floor, `DEAD-09` (95), `COPY-06` (98), `COUNT-03`/`COUNT-04` (96) — none inspected
for repair, none repaired. `GRANT SELECT ON auth.users` was never proposed or applied; the probe
reaches `auth.users` only through the GoTrue admin API with the service-role key.

## Next Phase Readiness

- WRITE-06's **policy** half is closed and behaviourally proven. Its **generate-surface** half
  (template→type + terminal state) remains Plan 94-09's.
- Downstream unblocked: `useAvailableReports` (the scheduled-report picker) and every by-id report
  read now resolve instead of rejecting.
- Arabic naturalness and pixel RTL remain OPERATOR parks — nothing in this plan claims either; the
  plan authored no user-facing copy.

## BLOCKED

None.

---

_Phase: 94-write-paths_
_Completed: 2026-08-16_
