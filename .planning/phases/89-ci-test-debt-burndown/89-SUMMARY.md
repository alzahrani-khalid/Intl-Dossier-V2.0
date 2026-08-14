# Phase 89 — CI & Test-Debt Burn-Down — SUMMARY

**Status: PARTIALLY DELIVERED. Phase NOT closed.** Three of five success criteria remain open, two of
them held on an operator-only act.

Authored from git evidence at `d8c102df` on `milestone/v9.0-drover`. **Nothing was re-executed to
produce this document.** Executor: tickmarkr (not GSD plans — the phase carried `Plans: TBD`).

## What landed

Range `15e8abd7..d8c102df`, 12 files, +363 / −352.

| task    | commits                                  | subject                                                                                                                  |
| ------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **T7**  | `cf83a8bb`, merge `786dd1b4`             | Un-quarantine the 8 repaired a11y specs — `playwright.config.ts` quarantine block replaced by an explicit admit list     |
| **T3**  | `8592183b`, merge `df3cf97a`             | 4 quarantined specs navigating to placeholder identifiers — shared auth + seeded identifiers                             |
| **T5**  | `4bb296a3`, `6d149a55`, merge `dcd7f98c` | Bilingual screen-reader spec — inherit project session, restore navigation                                               |
| **T6**  | `f49da6f6`, merge `6dfba97b`             | Comprehensive WCAG-AA audit spec — inherit shared audit session                                                          |
| landing | `46a88500`                               | T7+T3+T5+T6 → milestone                                                                                                  |
| **T4**  | `e7f6226e`, merge `4c85aee9`             | 2 quarantined keyboard-navigation specs — session inheritance, credentials removed, WCAG-named known-failure annotations |
| **T1**  | `0a373041`, `8297f3b3`                   | Both mixed static/dynamic imports ended (Sentry entry import, engagements empty-state) + test mock coverage              |
| landing | `6e8bd7c1`, `6941e969`, `d8c102df`       | T4 + T1 → milestone                                                                                                      |

Observable end state on milestone: `test.fixme` annotations now carry named accessibility rules —
`positions-keyboard-nav` 12, `editor-keyboard-nav` 8, `intake-accessibility` 4,
`positions-a11y-en`/`-ar` 2 each.

## Success criteria — honest status

| #   | criterion                                                                    | status                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | E2E suite green against the deployed app                                     | **NOT MET — held.** CI-01 was deliberately out of scope; it targets the final credential pattern, which depends on the operator's Phase 88 rotation                                                                                                                                                                                                                         |
| 2   | Integration suite green incl. the 2 interaction-note failures                | **NOT MET.** Scoping found the premise wrong: that file is in the _unit_ job, not the integration suite, and the integration suite is broadly red for one environmental reason — 235 files expect a database at `localhost:54321`. Recorded as decision **D-3**; CI cannot do better today (`ci.yml:214-235` has `continue-on-error: true`, no `env:`, no Supabase service) |
| 3   | a11y suites green — intake `fixme` debt fixed + 8 quarantined specs restored | **PARTIALLY MET.** The 8 specs are repaired and un-quarantined (T3/T4/T5/T6/T7). The intake-form `fixme` debt (button-name / aria-prohibited-attr / target-size) was **not** addressed. ORCH-2 (2026-08-13) measured the suite: 126 passed / 26 failed / 30 skipped, 6 of 13 specs fully green — **CI-03 not met**                                                          |
| 4   | Visual-regression baselines regenerated + suite green                        | **NOT MET — held.** ORCH-3 is `humanGate: true`; never self-answered                                                                                                                                                                                                                                                                                                        |
| 5   | `test-rtl-smokes` promoted to a required branch-protection context           | **NOT MET — held.** Sequenced last by the roadmap, and promotion touches branch protection on `main`                                                                                                                                                                                                                                                                        |

## Routed-in defects from Phase 90's close

- **`sentry.ts` dual-import Rollup smell — FIXED** (T1, `0a373041`). This was the named source of a
  nondeterministic build-warning fingerprint that false-failed test gates across two vendors in Phase 90.
- **`queue-processor` un-deployable** (`supabase/functions/queue-processor/index.ts:11` imports a
  non-existent `backend/src/services/queue.service.ts`) — **NOT addressed.** Surfaced during scoping as
  **F-4**, a design-level decision rather than an import fix, and never authored into a task.

## Verification at the landing

Both merge preconditions were satisfied before `d8c102df`, and both are independent of T1's acceptance
oracle and of the two runs voided by mid-run version changes:

- `tickmarkr verify` on the exact merge candidate — **green 5/5** (build, test, lint, evidence, scope),
  wholly inside one version bracket: `1.90.8 → 1.90.8`, `dist_sha256` byte-identical at both ends.
- Pinned-interpreter (`v24.5.0`) hand-vitest — **turbo 6 successful / 6 total**, exit 0:
  `agent-runtime` 49/49 · `intake-backend` 255/255 (25 files) · `intake-frontend` 1550 passed,
  1 skipped, 25 todo (208 files passed, 4 skipped).

## Carried forward

- **ORCH-2** — RUN 2026-08-13 under the pinned interpreter, bracket 1.90.8 → 1.90.8: **NOT green** —
  126 passed / 26 failed / 30 skipped across the 13 admitted specs; 6 specs fully green. 22 failures are
  spec debt (three `data-testid`s that exist nowhere in `frontend/src`), 3 are real app debt (58 axe
  contrast violations, a keyboard trap, no reachable first focusable on positions), 1 undecided.
  **It never depended on the credential rotation** — `.env.test` has carried working credentials since
  May; that blocker was asserted and repeated without being checked. See
  `.tickmarkr/overseer/ORCH-2-RESULT.md`. **Formerly recorded here as owed-and-never-run, and as blocked
  on the rotation — both wrong.** It was the closing evidence for CI-03; it has now been produced, and it
  says CI-03 is not met.
- **ORCH-3** — visual-baseline regeneration (`humanGate: true`).
- **CI-01 / CI-05** — held on the operator's Phase 88 credential rotation and on branch protection.
- **D-3** — how 235 integration test files get a database.
- **F-4** — `queue-processor`'s design.
- **The interaction-note "failures" are a timezone flake**, not code debt: the test derives "tomorrow"
  via `toISOString()` (UTC) while the service compares local end-of-day, so it fails only between 00:00
  and 03:00 local. Four sibling test files share the shape and are unverified.

SUMMARY-END
