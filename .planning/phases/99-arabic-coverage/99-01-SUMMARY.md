**RULING CLOSURE — RULING-P99-48. No worker ran for this record. This file exists so the compiler's sibling-summary pre-mark records the task done; the evidence it points to is journal- and git-recorded, not produced here.**

# Phase 99 Plan 01 — rendered-oracle delivery record

Status: closed as already delivered by `RULING-P99-48`.

## Delivered artifacts

- `tests/e2e/helpers/settle.ts`
- `tests/e2e/99-ar02-dates.spec.ts` — exactly 8 tests
- `tests/e2e/99-ar03-leak.spec.ts` — exactly 10 tests
- `tests/e2e/fixtures/99-positions-seed.mjs` — three ruled position statuses with database preflight

## Evidence map

- Engine run `run-20260818-213332-0000000000000015` executed P99-01 through all seven gates and recorded `task-done`; its consolidated merge `117511875` is an ancestor of current HEAD.
- Product commit `c857de7f8` delivered the settle helper and both specs. Fixture follow-up commits `3f3566157` and `223dbec50` made environment resolution fail closed inside worktrees.
- The original run-0015 summary is preserved at `.planning/phases/_archive-99-01-unevidenced-260819/99-01-SUMMARY.md`. It was archived by `f507c7770` because its rendered-red observation came from web-server startup rather than application assertions.
- RULING-P99-27 repaired the red assertion so zero-spec, hook, and fixture failures cannot qualify. The engine then executed the full P99-02/P99-03 rendered command chains at baseRef in runs 0020 and 0021; their `baseline-warning kind:vacuous-oracle` rows are recorded exit-0 observations, not static matches.
- `.tickmarkr/overseer/P99-RECOVERY-REPORT-R2.md` §5.2 independently observed the mounted worktree dates spec run 8 tests with 4 in-body Arabic failures and the required titles.

## Boundaries

This record adds no product evidence and does not restore the archived summary over history. The red-first oracles are expected to become false after downstream repair lanes make the suites green; P99-01 must not be reopened without a new ruling naming the changed premise. Nothing here grades P99-07…41.
