---
phase: 102-staging-data-debt-tail
closed_by: 102-19
dated: 2026-09-12
register_rows: 22
closed: 17
open: 4
not_reproduced: 1
---

# Phase 102 closing register

Every command oracle in plans 102-01 through 102-18 was re-run sequentially from this closing
worktree on 2026-09-12. The output column contains the verbatim last meaningful line from each
re-run; multiple oracle legs are separated with `<br>`. A failed or unavailable closing re-run is
not silently promoted to CLOSED. Judge-only GATESTD-04 was re-read against the completed 102-01
summary and source diff. The five roadmap success criteria are identified beside DATA-01, DATA-02,
CARRY-06, CARRY-07 and CARRY-08.

The final sibling census now finds all 18 exact `status: complete` markers. The upstream correction
to `102-18-SUMMARY.md` landed before this closing re-check; no sibling summary was modified by
102-19.

| register id | plan | oracle | re-run output (verbatim last line) | verdict |
| --- | --- | --- | --- | --- |
| DATA-01 | 102-07 + 102-18 (roadmap criterion 1) | O07a, O07b, O18a, O18b | `FAIL: the elected-officials spec did not pass 5/5 - the create test must run for the teardown to have a subject`<br>`FAIL: user-management (1 test) and mou-create (2 tests) did not pass 3/3 - on 2026-09-10 the user-management create test timed out at 30 s before creating its account, so the teardown had no subject`<br>`PASS purge`<br>`PASS export-before-delete` | OPEN:Playwright wrapper process census is denied by this sandbox (`wrapper_rc=90`); database cleanup is green |
| DATA-02 | 102-06 (roadmap criterion 2) | O06a, O06b | `PASS sweep`<br>`PASS rename` | CLOSED |
| SEED-DELEG-01 | 102-03 | O03a, O03b | `PASS my-delegations`<br>`PASS seed` | CLOSED |
| DELEG-02 | 102-03 | O03a, O03c + judge | `PASS my-delegations`<br>`PASS deploy-versions` | CLOSED |
| WRITER-ROUTE-01 | 102-04 | O04b, O04c + judge | `PASS born-consistent`<br>`PASS deploy-versions` | CLOSED |
| INSERT-SYNC-01 | 102-04 | O04a, O04b | `PASS trigger-insert`<br>`PASS born-consistent` | CLOSED |
| P52FIXTURE-01 | 102-05 | O05a | `PASS p52` | CLOSED |
| CARRY-06 | 102-15 (roadmap criterion 3) | O15a, O15b + judge | `PASS window`<br>`FAIL: the week-ahead visual is not invariant to the calendar date - a skip means the FIXTURE_BLOCKED guard still fires, a failure means the two clocks disagree` | OPEN:Playwright wrapper process census is denied by this sandbox (`wrapper_rc=90`) |
| CARRY-07 | 102-17 (roadmap criterion 4) | O17 | `PASS budget` | CLOSED |
| CARRY-08 | 102-16 (roadmap criterion 5) | O16a + judge | `PASS quick-summaries` | CLOSED |
| GUIDE-HOLLOW-01 | 102-08 | O08a + judge | `PASS guide` | CLOSED |
| EDGECOPY-01 | 102-13 | O13, O13b + judge | `PASS pdf`<br>`PASS deploy-versions` | CLOSED |
| COPY-09 | 102-02, 102-08..12 | O02, O08c, O09, O10, O11, O12 | `FAIL: 128 namespaces reported, expected all 129 en files`<br>`PASS lane`<br>`PASS lane`<br>`PASS lane`<br>`PASS lane`<br>`PASS lane` | OPEN:the planned 102-14 deletion removed `preview-layouts.json`, so the live census is 128 while immutable O02 expects 129 |
| GATESTD-01 | 102-01 | O01a | `PASS c9b` | CLOSED |
| GATESTD-02 | 102-01 | O01b | `PASS csa` | CLOSED |
| GATESTD-03 | 102-01 | O01c | `PASS dcov` | CLOSED |
| GATESTD-04 | 102-01 | judge | `CONFIRMED — three instances` | CLOSED |
| GATESTD-05 | 102-01 | O01d | `PASS gdrill` | CLOSED |
| ENGREAD-01 | 102-05 | O05b + recorded verdict | `FAIL: the render probe did not pass in both locales - the PW lines above name the cause (an error-chrome render, a locale not asserted, or a row count other than 5)` | NOT-REPRODUCED |
| PREVIEW-HOLLOW-01 | 102-14 | O14 | `PASS preview-dropped` | CLOSED |
| ROUTE-ORPHAN-01 | 102-16 | O16b + judge | `PASS dispositions` | CLOSED |
| PARALLEL-TRUTH-01 | 102-08 | O08b (`test:`) | `}` | OPEN:Vitest startup EPERM while Vite tried to write through the harness-owned `node_modules` symlink |

## Census re-derived at close

The fixed top-15 namespace set is the set ruled in 102-CONTEXT D-17: `dossier`, `common`,
`assignments`, `dossiers`, `committees`, `empty-states`, `user-management`, `legislation`,
`dashboard-widgets`, `workflow-automation`, `compliance`, `contacts`, `advanced-search`, `positions`,
and `working-groups`. The shipped instrument was run with its controls and carve-out table, and an
`awk` reducer summed only that named set.

```text
EN_FILES=128 EN_STRINGS=16946 TITLECASE_CANDIDATES=2355 PCT=13.9
P102-19-COPY09 top15_namespaces=15 top15_sum=31 outside_top15_residue=2324 dated=2026-09-12
```

Thus the dated residue outside the ruled top-15 is **2,324 candidates on 2026-09-12**. The top-15
sum of 31 is exactly the enumerated carve-out population remaining after the five lane passes. The
128-file census is one below O02's historical 129-file population because 102-14 intentionally
deleted the `preview-layouts` namespace later in the phase.

## Accidental drill-row deletion

The exact 102-06 sweep re-run line was:

```text
P102-06-SWEEP text_columns=1922 named_string_cells=0 class_regex_cells=0 control_cells=2 expected columns>=1000 named=0 class=0 control>=1
```

The bounded class sweep includes both `E2E` and lowercase `e2e-`. Its zero class cells therefore
confirms deletion of the accidental 2026-09-10 `e2e-97-01` person and E2E MoU; `control_cells=2`
proves the same database-wide text-column instrument could see non-zero matches.

## Open-state ownership

- DATA-01 and CARRY-06 require a later run where the Playwright wrapper can execute its required
  process census. The closing sandbox rejects `ps`, so the wrapper correctly refuses with rc 90.
- COPY-09 requires reconciling O02's historical 129-file expectation with the authorized
  `preview-layouts` namespace deletion.
- PARALLEL-TRUTH-01 requires a Vitest environment whose Vite temp path does not write through the
  harness-owned `node_modules` symlink.
- ENGREAD-01 retains 102-05's explicit NOT-REPRODUCED-AT-RENDER verdict and is never described as
  fixed; this closing rerun could not supersede that evidence because the same wrapper refused.
