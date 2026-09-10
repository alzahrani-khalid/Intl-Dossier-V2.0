---
phase: 102
slug: staging-data-debt-tail
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-09-10
---

# Phase 102 — Validation Architecture

Required by `.planning/config.json` `workflow.nyquist_validation: true` and by `GATESTD-02`'s own rule (a
config-enabled step leaves an artifact or an explicit waiver). Written by the planner seat 2026-09-10; every
number is re-derived in `102-PLAN-INDEX.md` (drilled-oracle table) and the oracle bodies live verbatim in the
plans. This file says WHICH instrument proves WHICH criterion and where the RED-at-HEAD evidence is.

## Test infrastructure

| property | value |
|---|---|
| command oracles | plain `bash -lc` blocks in `must_haves.truths` (`oracle: command`), each with its own PATH pin and `.env.test` sourcing; exit 1 = FAIL, exit 3 = `INSTRUMENT-CANNOT-RUN` |
| database oracles | `psql "$SUPABASE_DB_URL"` (staging `zkrcjzdemdmwhearhfgg`), heredoc/temp-file for multi-statement or long generated SQL (argv is too small for the all-column sweep) |
| HTTP oracles | `curl` with the test user's password-grant JWT; `pdftotext` for the produced-artifact leg |
| browser legs | Playwright through `scripts/pw-run-reaped.mjs` (Phase 101's leased runner), reading the published `test-results/pw-reaped-*.json` `stats` - NOT `oracle: test` (the test gate dispatches vitest only, `.tickmarkr/config.yaml` GATEFIX-3) |
| unit oracle | one `oracle: test` (vitest, frontend workspace): PARALLEL-TRUTH-01's leaf title verbatim |
| judge oracles | read the DIFF and must cite changed hunks; used for source-only obligations (copy edits, function bodies, C1 wording) |
| fail-closed drill | every oracle family run once from an empty directory without `.env.test` -> exit 3 with a named reason (index table, column 6) |

## Criterion -> oracle -> RED evidence

| plan | criterion | instrument | RED at HEAD (index row) |
|---|---|---|---|
| 102-01 | GATESTD-01/02/03/05 | O01a-d (executed C9b line; enabled=8 + P93 waiver; total=5 fixture; nested=4/selfref=5) | exit 1 each: no case line / script absent / total=3 / 0,0 |
| 102-01 | GATESTD-04 | judge on the C1 hunk | — |
| 102-02 | COPY-09 instrument | O02 (controls 4/4, 129 NS lines, carve-out data rows >= 1 header excluded, every NS carved==carve_rows at HEAD with the non-candidate ns:key list on failure - rev-2 G-02/G-06) | script absent |
| 102-03 | DELEG-02, SEED-DELEG-01 | O03a (deployed 200/total=3, then active_only=true -> total=2, no revoked row), O03b (1/1/1/3 rows), O03c (4 slug versions > HEAD) | 500 (both calls); 0 0 0 0; advanced=0/4 |
| 102-04 | INSERT-SYNC-01, WRITER-ROUTE-01 | O04a (triggerdef), O04b (rolled-back INSERT), O04c (2 slug versions > HEAD), judge (executor authors STATUS_TO_STAGE) | BEFORE UPDATE; [pending review]; advanced=0/2 |
| 102-05 | P52FIXTURE-01, ENGREAD-01 | O05a (5==5, seeded pair, rename), O05b (render probe via wrapper) | 5 3 0 0; spec absent |
| 102-06 | DATA-02 | O06a (1,929-column sweep, BOUNDED class regex + lowercase `\ye2e-` clause, control-bounded), O06b (rename 10/6/3/1 of 16) | 7 / 204 / control 2 (rev-2; 66 at rev-1 without the e2e- clause); 0 0 0 0 16 |
| 102-07 | DATA-01 clause 2 | O07a, O07b (spec run + timestamp-scoped census) | accidental run: 1 person + 1 MoU left; user-management timed out |
| 102-08 | GUIDE-HOLLOW-01, PARALLEL-TRUTH-01, COPY-09 dossier | O08a (8/8 x 4 leaves x 2 locales), `test:` leaf title, O08c (census: candidates==carved==carve_rows), judge (authored Arabic, delegation hunk) | en=1/8 ar=1/8; no test; instrument absent |
| 102-09..12 | COPY-09 lanes | O09/O10/O11/O12 (candidates==carved AND carved==carve_rows, ar_missing_keys=0) | instrument absent; scratch census counts in each plan |
| 102-13 | EDGECOPY-01 | O13 (produced PDF magnitudes with Priority control; EMBED-CAUSE on non-200), O13b (6 slug versions > HEAD), judge (embed repair + six functions) | real id 404 <- PGRST200 observed; advanced=0/6; storage untouched |
| 102-14 | PREVIEW-HOLLOW-01 | O14 (0 tables/0 functions/0 types, dossiers present) | 3 5 3 1 |
| 102-15 | CARRY-06 | O15a (3/3 + 5/5 in window), O15b (two-clock run), judge (mask == .week-date only, three titles visible, no baseline regeneration) | 0 0 3 5; no such test title |
| 102-16 | CARRY-08, ROUTE-ORPHAN-01 | O16a (9/9/7 verdict rows), O16b (14 rows class+ruling) | files absent |
| 102-17 | CARRY-07 | O17 (entry path/gzip unchanged, assert-size-limit-matches 0, size-limit exit 0 AND limit < 500 KB) | shape ok / 500 KB / exit 1 / 516.25 kB |
| 102-18 | DATA-01 clause 1 | O18 (13/13/13/13), O18b (export CSV rows == deleted with a trailing newline ordered, mtime <= first delete, population left 0 - rev-2 G-05) | 415 13 415 415; export_dir=absent |
| 102-19 | closure | O19 (18/18 summaries complete, 22 register rows) | 0/18, 0 |

## Sampling rate

- After every task: the plan's own command oracles (all are seconds-to-minutes; the pw-family ones ~1-2 min each).
- After wave 2: 102-06's sweep and 102-08..12's census re-run by hand from the checkout to catch a namespace two
  lanes both touched (they should not - D-27).
- Before the phase closes: 102-19 re-runs EVERY oracle from the closing worktree (D-28) - closure is a
  re-derivation, not a recital.

## Wave 0 / instruments-before-repairs

102-01 (gate-standard instruments) and 102-02 (title-case census + carve-outs) are wave 1 with no deps; every
COPY-09 lane depends on 102-02. The purge (102-18) is last among repairs and additionally gated on Phase 101
being CLOSED (D-04) - a precondition the worker checks, not a human gate.

## Manual-only verifications

None planned. The two things a human might do (view /delegations, view the type-guide popover) are covered by
the deployed-function oracle and the bundle oracle respectively; a render sign-off is the overseer's option, not
a plan obligation.

## Known limits, stated

- O05b/O15b browser legs were not launched at planning (brief rule 4); their RED is "spec/test absent".
- O07a/O07b were launched by mistake (index, Side effects); the oracle text was then rewritten to parse the
  wrapper report and only `bash -n` checked.
- O13 was re-drilled in revision 1 on the REAL record 905b6a3a: 404 caused by the `commitments(*)` embed
  (PGRST200 - `aa_commitments` carries the FK), observed directly; no storage object was written because the
  function fails before writing. 102-13 repairs the embed before the copy.
- Revision 1 (2026-09-10) re-drilled every changed oracle; the index's drilled-oracle table marks them `re-drilled rev-1`.
- The DATA-02 class sweep excludes jsonb/metadata columns by construction (text/varchar only).
