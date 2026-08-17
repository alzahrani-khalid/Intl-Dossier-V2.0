---
phase: 96-real-numbers
plan: 01
subsystem: database
tags: [postgres, rls, supabase, playwright, security-definer, postgrest]

# Dependency graph
requires:
  - phase: 95-honest-surfaces
    provides: tests/e2e/95-sandbox-error.spec.ts (the C9b consumer whose natural arm this plan flips) and the QueryErrorState failure branch it asserts
  - phase: 94-write-paths
    provides: 20260816500001_p94_report_rls_recursion.sql + scripts/probe-report-rls.mjs — the definer-boolean fix shape and the two-sided proof protocol, copied here name-for-name
provides:
  - public.is_scenario_owner(uuid) — SECURITY DEFINER STABLE single-row boolean owner check, pinned empty search_path
  - scenario_collaborators SELECT/INSERT/DELETE policies with the EXISTS-over-scenarios clause substituted
  - scripts/probe-scenario-rls.mjs — the two-sided (owner/collaborator/stranger) row-set-invariance oracle
  - a non-500 scenario-sandbox on staging; /scenario-sandbox renders a truthful empty state
affects:
  [97-reachability, 101-e2e-credentials, any phase touching scenarios RLS or the sandbox surface]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'definer-boolean RLS recursion break: replace the EXISTS on the DEPENDENT side, never the owning side'
    - "two-sided row-set proof with TWO owner fixtures so 'collaborator sees 1 row' cannot be satisfied by a wide-open policy"

key-files:
  created:
    - supabase/migrations/20260817500001_p96_scenario_rls_recursion.sql
    - scripts/probe-scenario-rls.mjs
  modified:
    - tests/e2e/95-sandbox-error.spec.ts

key-decisions:
  - "The sandbox's WORKING state is empty-but-200: staging holds ZERO scenarios rows, so the truthful render is the empty state (RESEARCH Open Q1 resolution), not content"
  - 'Cleanup asserts against a baseline captured at run start rather than hardcoded 0, so a concurrently-seeded row does not read as a leaked fixture'
  - 'A second, non-collaborated fixture scenario is created on purpose — the negative half is unprovable with one fixture'

patterns-established:
  - "Pattern 1: break ONE direction of an RLS cycle on the dependent table; the owning table's policy stays byte-identical and is re-derived from pg_policy after the migration to prove it"
  - "Pattern 2: drill a probe's exit-code contract by flipping one assertion in a scratch copy — proves the script CAN go red before its green is trusted"

requirements-completed: [SANDBOX-500-01]

# Metrics
duration: ~45min
completed: 2026-08-17
---

# Phase 96 Plan 01: SANDBOX-500-01 — the working sandbox

**The scenarios ↔ scenario_collaborators 42P17 RLS recursion is broken by a SECURITY DEFINER boolean owner check on the collaborators side; the deployed scenario-sandbox went 500 → 200 and /scenario-sandbox now renders a truthful empty state, with row visibility proven unchanged across three identity classes.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-08-17
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 annotated)

## Accomplishments

- The 42P17 cycle is broken by an applied migration. `GET /rest/v1/scenarios` as a real authenticated user answers **HTTP 200 `[]`** where it answered `42P17 infinite recursion` before.
- `scripts/probe-edge-auth.sh scenario-sandbox`: **`scenario-sandbox -> 500` → `scenario-sandbox -> 200`**, observed both directions this run.
- Row visibility proven UNCHANGED two-sided, live, through PostgREST: owner sees her own two, collaborator sees exactly the one collaborated to them, stranger sees none.
- `tests/e2e/95-sandbox-error.spec.ts` re-run in the SAME task as the fix (D-12): **2/2 passed**, forced arm still green — the P95 error state remains the failure branch.

## Task Commits

1. **Task 1: Break the 42P17 cycle by migration; show the 95 spec still-sound in the same task** — `21e6cf799` (fix)
2. **Task 2: Two-sided row-set proof + deploy-tier probe evidence** — `edcd6f740` (test)

## Files Created/Modified

- `supabase/migrations/20260817500001_p96_scenario_rls_recursion.sql` — `is_scenario_owner(uuid)` definer + the three re-created `scenario_collaborators` policies, each carrying a `-- was:` comment quoting the live qual it replaces
- `scripts/probe-scenario-rls.mjs` — the two-sided row-set-invariance oracle (346 lines, exit 0/1/2)
- `tests/e2e/95-sandbox-error.spec.ts` — header annotation only (+6 lines); **no assertion moved**

---

## The live pg_policy quals, as re-derived at execution time

Re-derived via `mcp__supabase__execute_sql` on staging `zkrcjzdemdmwhearhfgg`, 2026-08-17, BEFORE authoring the migration (the analog's discipline: the research copy is evidence, not a substitute).

<!-- prettier-ignore -->
| table | policy | cmd | qual / withcheck (BEFORE) |
| --- | --- | --- | --- |
| scenario_collaborators | `scenario_collaborators_select` | SELECT | `((user_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM scenarios WHERE ((scenarios.id = scenario_collaborators.scenario_id) AND (scenarios.created_by = auth.uid())))))` |
| scenario_collaborators | `scenario_collaborators_insert` | INSERT | withcheck: `(EXISTS ( SELECT 1 FROM scenarios WHERE ((scenarios.id = scenario_collaborators.scenario_id) AND (scenarios.created_by = auth.uid()))))` |
| scenario_collaborators | `scenario_collaborators_delete` | DELETE | `(EXISTS ( SELECT 1 FROM scenarios WHERE ((scenarios.id = scenario_collaborators.scenario_id) AND (scenarios.created_by = auth.uid()))))` |
| scenarios | `scenarios_select_own_or_collaborated` | SELECT | `((created_by = auth.uid()) OR (EXISTS ( SELECT 1 FROM scenario_collaborators WHERE ((scenario_collaborators.scenario_id = scenarios.id) AND (scenario_collaborators.user_id = auth.uid())))))` |
| scenarios | `scenarios_update_owner_or_editor` | UPDATE | `((created_by = auth.uid()) OR (EXISTS ( SELECT 1 FROM scenario_collaborators WHERE (… AND (scenario_collaborators.role = ANY (ARRAY['owner'::text, 'editor'::text]))))))` |
| scenarios | `scenarios_insert_authenticated` | INSERT | withcheck: `(created_by = auth.uid())` |
| scenarios | `scenarios_delete_owner` | DELETE | `(created_by = auth.uid())` |

All three collaborators policies are PERMISSIVE with `polroles = PUBLIC` (no `TO` clause) — live-verified and re-created the same way.

**AFTER the migration**, re-derived by the same query:

<!-- prettier-ignore -->
| table | policy | qual / withcheck (AFTER) |
| --- | --- | --- |
| scenario_collaborators | `scenario_collaborators_select` | `((user_id = auth.uid()) OR is_scenario_owner(scenario_id))` |
| scenario_collaborators | `scenario_collaborators_insert` | withcheck: `is_scenario_owner(scenario_id)` |
| scenario_collaborators | `scenario_collaborators_delete` | `is_scenario_owner(scenario_id)` |
| scenarios | **all four** | **byte-identical to the BEFORE table above — untouched, as Pitfall 1 requires** |

The scenarios-side rows in the AFTER read were compared against the BEFORE read and are character-for-character unchanged. That is the mechanical evidence that the fix broke the collaborators direction only.

## Per-gate red→green records

### Task 1 gate

- **RED** — observed on the undone tree before any edit: `TASK1_GATE_EXIT=1`. Attribution: first `test -f` fails; the migration file is this task's product, so the subject was absent.
- **GREEN** — observed on the finished tree: `TASK1_GATE_EXIT=0`. All seven pins hold, including `scenarios_select_own_or_collaborated` appearing on exactly **1** line (the header line stating it is untouched) and 3 `-- was:` comments.
- The plan labelled the **Playwright re-run half UNPROVEN pre-execution** (needs the migration applied). Drilled at execution — see below.

### Task 2 gate

- **RED** — observed on the undone tree: `TASK2_GATE_EXIT=1`. Attribution: `test -f scripts/probe-scenario-rls.mjs` fails; the script is this task's product.
- **GREEN** — observed on the finished tree: `TASK2_GATE_EXIT=0` (static pins + `node --check` + live probe exit 0 + the non-500 probe line, all in one command).
- The plan labelled the **live-run and probe halves UNPROVEN pre-execution**. Both drilled at execution:
  - **probe-edge-auth half — genuine right-reason red→green, observed this run:** `scenario-sandbox -> 500` before the migration, `scenario-sandbox -> 200` after. This is the defect the gate's `! grep 'scenario-sandbox -> 500'` clause pins, measured at the deployed tier in both directions.
  - **probe-script half — green observed (exit 0, all 6 assertions).** Its _right-reason_ red (a live 42P17 from the script itself) was **not observable**: the plan's own task ordering lands the fix in Task 1, so the recursion was already gone when the Task 2 script came into existence. Reproducing it would mean restoring the defect on shared staging via out-of-plan DDL, which rules 6 and D-22 forbid, and other lanes are reading that DB concurrently. Recorded rather than manufactured.
  - **Vacuity drill run in its place** (the available right-reason red for the script's own contract): a scratch copy at `/tmp/p96-vacuity.mjs` with `seenC.length === 0` flipped to `=== 1` → **exit 1**, printing `FAIL  C (stranger) sees NO scenario — the row set did not widen — 0 row(s)`, with the `finally` cleanup still running and the baseline check still passing. This establishes the probe is not a vacuous pass: a failed assertion really does produce exit 1.
  - **Exit-2 posture drill:** the script run with the three credentials absent → **exit 2**, printing `UNABLE TO MEASURE — missing credential(s): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY`. GATE-STANDARD C2 holds: a labelled state, not a silent pass and not a red.

## The probe-edge-auth line, verbatim

Before the migration:

```
scenario-sandbox -> 500
```

After the migration:

```
scenario-sandbox -> 200
```

## probe-scenario-rls run result

`node scripts/probe-scenario-rls.mjs` → **exit 0**, all six assertions PASS:

```
[0] pre-run service-role baseline: {"scenarios":0,"scenario_collaborators":0}
  A sees scenarios: [942fdcfc-cc81-4101-a2d4-605f76a83805, d3c50dd6-264c-4832-aa2e-27df776a501a]
  B sees scenarios: [942fdcfc-cc81-4101-a2d4-605f76a83805]
  C sees scenarios: []
  PASS  A (owner) sees exactly her own two scenarios — 2 row(s)
  PASS  B (collaborator) sees EXACTLY the collaborated scenario — not A's other one — 1 row(s)
  PASS  C (stranger) sees NO scenario — the row set did not widen — 0 row(s)
  PASS  A sees the collaborator row (is_scenario_owner path — the substituted clause) — 1 row(s)
  PASS  B sees the collaborator row (user_id path — the preserved clause) — 1 row(s)
  PASS  C sees NO collaborator row — 0 row(s)
  service-role row counts after cleanup: {"scenarios":0,"scenario_collaborators":0}
  PASS  fixtures cleaned — both tables back to the pre-run baseline
PROBE PASSED — no 42P17; A=2 / B=1 (the collaborated one) / C=0; fixtures cleaned
```

Fixture ids printed above; three `p96-rlsproof-*@probe.invalid` seats minted and deleted (HTTP 200 each); no key, password or JWT was echoed at any point.

**POPULATION DEFINITION (printed by the script itself):** SELECT visibility on `scenarios` + `scenario_collaborators` for owner / collaborator / stranger. **FALLS OUTSIDE:** INSERT/UPDATE/DELETE row behaviour (those policies had the same clause substituted clause-for-clause, so their row sets are preserved by construction, not by measurement here — though the INSERT path is exercised incidentally, since A must pass `scenario_collaborators_insert` WITH CHECK to create the fixture), and service-role access, which bypasses RLS and is used only for minting and cleanup.

## Spec colours

<!-- prettier-ignore -->
| spec | C9b class | colour | note |
| --- | --- | --- | --- |
| `tests/e2e/95-sandbox-error.spec.ts` | REAL (live-login CDP) | **2/2 PASSED** (6.5s) | Existence asserted first; `--list` hardcoded-checked at 2 tests; run with `--project=chromium-en --no-deps`. Forced arm green (error branch intact); natural arm green (settled, no spinner). |
| `frontend/tests/scenario-sandbox-verification.spec.ts` | REAL by content, **NON-ORACLE in fact** | **NOT COLLECTED** | See the finding below. |

Both arms of the 95 spec were run against the post-fix staging DB with the dev server at `:5173` (the spec's own oracle population — the route carries `devModeGuard`).

## Did the sandbox render content or truthful-empty?

**Truthful EMPTY — and that is a WORKING state** (RESEARCH Open Question 1 resolution, D-12).

Measured directly as the authenticated test user after the migration:

```
GET /rest/v1/scenarios?select=id&limit=5   -> HTTP 200   []
GET /functions/v1/scenario-sandbox          -> HTTP 200   {"data":[],"pagination":{"limit":20,"offset":0,"has_more":false,"total":0}}
```

The emptiness is not an RLS denial dressed up as data: `scenarios` holds **zero rows for anyone** — the service-role (RLS-bypassing) count is 0. There is nothing to show, so the truthful render is the empty state. The 95 spec's natural arm confirms the DOM settled (panel visible, `.animate-spin` count 0, no internal string leaked) rather than spinning.

## Decisions Made

- **Cleanup asserts a captured baseline, not a hardcoded 0.** Both tables were live-empty when written, but other Phase 96 lanes run against this same staging DB concurrently; a hardcoded 0 would red this probe for someone else's fixture. One extra line, correct on the edge case.
- **Two owner fixtures, not one.** With a single scenario, "B sees 1 row" is also satisfied by a policy that returns everything — the probe would certify the exact defect it exists to catch. The second, non-collaborated scenario is what makes the negative half discriminating. Recorded in the script header.
- **The 95 spec was annotated, not rewritten.** Its header already accepted both truthful outcomes, so the flip needed no assertion change; the annotation states the flip and that no line below moved.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 7 — instrument] The plan's `--no-deps` Playwright invocation for the second C9b consumer could not collect the file**

- **Found during:** Task 2 (the plan's `<verification>` item "frontend/tests/scenario-sandbox-verification.spec.ts run once, colour recorded")
- **Issue:** The spec is collected by **neither** Playwright config, so it cannot be run at all — it is not a filter problem. Root config: `testDir: './tests/e2e'`, which excludes `frontend/tests/` entirely. Frontend config: `testDir: frontend/tests` but `testMatch: ['e2e/**/*.spec.ts', 'accessibility/**/*.spec.ts']`, and the file sits directly in `tests/`, matching neither glob.
- **Fix:** No code change — the plan does not own this file, and moving it would be scope the plan did not authorize. Recorded as the honest colour (NOT COLLECTED) plus a finding below.
- **Verification:** The zero was instrument-tested per rule 7 — the identical command form against a known-collected spec (`tests/e2e/95-sandbox-error.spec.ts`) returned `Total: 2 tests in 1 file`, so the instrument works and the zero is real. A full unfiltered listing under the frontend config also contains zero occurrences of `scenario-sandbox-verification`.
- **Committed in:** n/a (no file changed)

---

**Total deviations:** 1 auto-fixed (1 instrument/verification-item adaptation)
**Impact on plan:** None on the success criterion. The plan's REAL oracle for this criterion is `tests/e2e/95-sandbox-error.spec.ts`, which ran 2/2 green. The second consumer was a triage item, and its triage verdict is recorded rather than skipped.

## Issues Encountered

- **`frontend/tests/scenario-sandbox-verification.spec.ts` is an orphaned spec — a NON-ORACLE under D-19.** No Playwright project in either config collects it (mechanism above). It has therefore defended nothing since it was written, and must not be counted in any defence total. Not fixed here: relocating it to `frontend/tests/e2e/` or widening `testMatch` is a change to a file this plan does not own, and it needs its own decision about whether the assertions are still wanted. **Flagged for phase-level triage.**
- **The frontend Playwright suite additionally fails collection wholesale**, pre-existing and unrelated to this plan: `ReferenceError: __dirname is not defined in ES module scope` at `frontend/tests/e2e/ai-extraction.spec.ts:20`, `attachment-limit.spec.ts:11`, and `file-size-limit.spec.ts:11`. Observed while establishing the point above; untouched, as it is outside this plan's files.
- **`HUSKY=0` did not skip the pre-commit hook** — the hook ran a full Turbo build on both commits (slow but non-blocking, consistent with the known "pre-commit build does NOT block" behaviour). Both commits were verified to have landed with `git show HEAD --stat` showing exactly the intended pathspecs.

## User Setup Required

None — no external service configuration required. The migration is already applied to staging `zkrcjzdemdmwhearhfgg` via the Supabase MCP.

## Next Phase Readiness

- SANDBOX-500-01 is closed on the WORKING sandbox: PostgREST answers scenarios reads without 42P17, the deployed function answers 200, row visibility is proven unchanged two-sided, and the P95 error state remains the failure branch.
- `public.is_scenario_owner(uuid)` is available to any later policy needing a non-recursing scenarios owner check.
- **Not covered by this close (population, D-15):** production (the droplet is untouched — this migration is staging-only so far); the child-table policies (`scenario_variables` / `scenario_outcomes` / `scenario_snapshots` / `scenario_comparisons`), which were left untouched because they terminate through the fixed collaborators side; and whether any user sees scenario _content_ — staging holds zero scenarios, so only the empty branch was exercised end-to-end.
- **Open for phase triage:** the orphaned `frontend/tests/scenario-sandbox-verification.spec.ts`, and the pre-existing `__dirname` ESM collection failure in the frontend suite.

## BLOCKED

None.

---

_Phase: 96-real-numbers_
_Completed: 2026-08-17_

SUMMARY-END
