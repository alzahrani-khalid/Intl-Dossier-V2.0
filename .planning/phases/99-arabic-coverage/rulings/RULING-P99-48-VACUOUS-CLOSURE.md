# RULING-P99-48 — P99-01…06 closed as already delivered

**Decision:** P99-01 through P99-06 are closed by explicit ruling and compiler sibling-summary pre-mark. They are not re-dispatched. The `baseline-warning kind:vacuous-oracle` rows are expected post-delivery observations and are recorded here rather than hidden.

## Basis

1. P99-01, P99-04, P99-05, and P99-06 were engine-executed through the full seven-gate battery in `run-20260818-213332-0000000000000015`, which has a recorded `run-end`. Their work landed through consolidated merge `117511875`, an ancestor of current HEAD `8bc16a0f5`. The nine product paths reviewed in `.tickmarkr/overseer/CONSULT-VACUOUS-P99-R1-REPORT.md` are byte-identical to that merge except `tests/e2e/fixtures/99-positions-seed.mjs`, which later received the in-scope environment-resolution fixes `3f3566157` and `223dbec50`.
2. P99-02 and P99-03 were engine-executed to `task-done` in `run-20260819-011350-0000000000000019`. Their merge commits `e1c15789e` and `725a0ef53` were intentionally not retained in the protected branch. Their workers contributed no new product bytes: the inherited oracle files were already present. Their useful output is the journal-recorded gate observation that the current specs collect at exactly 8 and 10 and execute rendered-red.
3. P99-01's original run-0015 red was not acceptable evidence: it came from web-server startup. Commit `f507c7770` therefore archived the original summary to force re-execution. That evidentiary gap is now closed by the crash-proof oracle from RULING-P99-27, which rejects zero-spec, hook, and fixture failures. The engine executed the full P99-02 and P99-03 command-oracle chains at baseRef in both runs 0020 and 0021; the four rendered warnings are recorded exit-0 observations. The independent worktree drill in `.tickmarkr/overseer/P99-RECOVERY-REPORT-R2.md` §5.2 additionally observed 8 tests run, 4 application-body failures, and the required Arabic titles.
4. The GSD compiler's only workerless done mechanism is the sibling summary (`dist/compile/gsd.js`: summary existence sets `status: done`). P99-04/05/06 already use it. P99-01/02/03 receive disclosure-stamped ruling records at the same paths. Those records do not claim a worker produced new work.
5. Requiring a changed hunk now would manufacture churn against already-delivered artifacts. For P99-01…03 it would also be self-defeating: their red-first oracles are expected to become false after the downstream repairs make the rendered suites green.

## Operative order

- Author `99-01-SUMMARY.md`, `99-02-SUMMARY.md`, and `99-03-SUMMARY.md` as ruling-closure records. Their first line must disclose that no worker ran for the record and that the evidence is journal/git evidence.
- Leave the archived original `99-01-SUMMARY.md` in `.planning/phases/_archive-99-01-unevidenced-260819/`; it is the historical record of why the first closure was revoked.
- Keep all six plans and their dependency edges. Do not delete or re-root them.
- After the ruling records are committed, recompile. The graph must show P99-01…06 `done` and P99-07 pending before any run.
- Closure is FINAL for this phase. P99-01…03 must not be reopened after repair lanes make the red-first oracles false unless a new ruling names the changed premise.
- This ruling makes no claim about P99-07…41 and does not release a run.

## Evidence limits

This ruling relies on journal rows, git ancestry/content comparisons, the engine's baseline execution mechanism, and the recorded worktree drill. It does not re-run the six task gates at this commit, does not grade P99-07…41, and does not resolve the separate unsafe session-reaper draft.

Independent review: `.tickmarkr/overseer/CONSULT-VACUOUS-P99-R1-REPORT.md` (`VACUITY-VERDICT-END`).
