---
phase: 80-full-route-visual-a11y-verification-smoke-suite
verified: 2026-07-03T21:59:51Z
status: passed
score: 3/3 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: none
  note: initial verification
deferred: # Intentional, overseer-recorded deferrals to the milestone-close / v8.0 PR lifecycle — NOT phase gaps
  - truth: 'test-rtl-smokes promoted to a required branch-protection status check (build gated, not advisory)'
    addressed_in: 'v8.0 PR / milestone close (repo-admin action)'
    evidence: "80-06-SUMMARY §Deviations #2 + 80-CONTEXT decision 'CI smoke gating (FOUC-02)': roadmap SC3 explicitly permits 'scoping the new smokes as a separate, green-from-birth job'; the honest gating record lists the 8 current required contexts and confirms 'RTL Portal + Component Smokes' is NOT among them (not silently claimed as gating). Overseer/user pre-decision 2026-07-03."
  - truth: 'CI birth-certificate — first green GitHub-Actions run of test-rtl-smokes + the a11y job greening on push'
    addressed_in: 'v8.0 PR (main is local-ahead; cannot run on GitHub until pushed)'
    evidence: "80-06-SUMMARY §Next Phase Readiness: 'Local 9/9 green is the phase-exit proof.' A11Y-BASELINE §12 CI follow-on: the a11y job greens on next push (assertion-level redness resolved, 0 hard failures on this tree)."
  - truth: 'calendar-rtl CI organizer-RLS parity (E2E_ADMIN_* == kazahrani, the SRTL-02 seed organizer)'
    addressed_in: 'v8.0 PR CI bring-up (advisory, non-blocking; documented resolution path — re-seed SRTL-02 rows with the CI account as organizer via Supabase MCP)'
    evidence: '80-06-SUMMARY §Issues Encountered (W2 contingency, advisory).'
---

# Phase 80: Full-Route Visual + A11y Verification & Smoke Suite — Verification Report

**Phase Goal:** The whole migration is proven correct across every baselined surface and all four axes (dark/light × LTR/RTL), with the RTL/portal/FOUC guarantees locked into CI so they cannot silently regress.
**Verified:** 2026-07-03T21:59:51Z
**Status:** passed
**Re-verification:** No — initial verification

This is a verification / CI-hardening phase (no product features). Goal-backward: the deliverable IS the recorded proof machinery (specs, recorded A/B baseline, human-triaged visual recapture, advisory CI job). Every claim below was checked against the codebase and git history — SUMMARY narrative was treated as unproven until confirmed on disk.

## Goal Achievement

### Observable Truths (= ROADMAP Success Criteria = VERIFY-01 / VERIFY-02 / FOUC-02)

| #   | Truth                                                                                                                                                                                                                  | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **VERIFY-01** — all 43 baselined surfaces re-compared vs the Phase-77 pre-token baseline; every diff is intended-Linear (human-reviewed) or fixed; zero unexplained regressions; coverage expansion noted, not assumed | ✓ VERIFIED | 80-VISUAL-RECOMPARE.md §5 = 43 adjudicated rows (39 intended-Linear + 4 within-tolerance + **0 regression**); §10 APPROVED line (user, via overseer blocking checkpoint, 2026-07-03). Recapture committed AFTER approval as `799ef3c44` = **exactly 39 PNGs + the ledger**. `playwright.config.ts` thresholds untouched (`git diff 14191cb85..HEAD` on the config = no maxDiffPixel/threshold delta; not in the recapture diff). Bureau lineage recoverable at `14191cb85` (51 committed baseline PNGs). §7 states the 4 exclusions verbatim (no silent expansion).                                                                                                                                                                                                                                                     |
| 2   | **VERIFY-02** — axe 4-axis sweep passes with no NEW violations vs a RECORDED pre-migration baseline; the pre-existing red/flaky set fixed or recorded before comparison                                                | ✓ VERIFIED | `qa-sweep-axe-4axis.spec.ts` exists; imports the shared `runAxe` (real export at `helpers/qa-sweep.ts:39`), **0 inline AxeBuilder**; Playwright enumerates **60 scans**. 80-A11Y-BASELINE.md records set A @`14191cb85` + set B @HEAD, same-day, byte-identical harness; **B⊆A verdict = FALSE → 4 NEW-on-HEAD light `color-contrast` scans** (§10.1). All 4 NEW + 4 discretionary pre-existing **FIXED** by `556f20705` (chips → `var(--*-soft)`, `color-mix` removed; **only `list-pages.css` touched**, no palette-literal file changed → parity guard intact). 4 pre-existing engagements ARIA scans **RECORDED** via `test.fixme` + `TRACKED APP A11Y DEBT` (record-count parity = 4). a11y project = **97 tests / 5 files**; 10 pre-existing `test.fixme` skips present (intake 4 stmts→6 + positions 4 stmts→4). |
| 3   | **FOUC-02** — CI runs portal + Calendar/Pagination/Sidebar RTL smoke tests, scoped as a separate green-from-birth job (the roadmap-sanctioned alternative to gating the pre-existing red)                              | ✓ VERIFIED | `rtl-component-smokes.spec.ts` (Popover/Pagination/Sidebar, DOM + computed-style only, **0 real `toHaveScreenshot`** — 1 comment mention) + `calendar-rtl.spec.ts` (**constructor-only `Date` override**, `Date.now()` stays real; **0 real `page.clock` calls** — 2 comment mentions; no screenshots). `test-rtl-smokes` job in **`.github/workflows/ci.yml`** (verbatim `test-a11y` pattern + 3 documented deltas; `needs: [lint, type-check]`; **no `E2E_BASE_URL`**; **not** in `e2e.yml`), runs `direction-portals + calendar-rtl + rtl-component-smokes`. FOUC specs = **4 tests / 2 files**. Committed `7014fdba1`.                                                                                                                                                                                              |

**Score:** 3/3 truths verified.

### Deferred Items (Step 9b — intentional, overseer-recorded; do not affect status)

| #   | Item                                                                             | Addressed In                           | Evidence                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Promote `test-rtl-smokes` to a required branch-protection check (gate the build) | v8.0 PR / milestone close (repo-admin) | Roadmap SC3 explicitly permits the separate green-from-birth job; 80-06-SUMMARY §Dev #2 shows the 8 current required contexts and confirms the job is NOT among them (honest, not silently claimed) |
| 2   | CI birth-certificate (first green GitHub run)                                    | v8.0 PR (main is local-ahead)          | 80-06-SUMMARY §Next Phase Readiness; local 9/9 is the phase-exit proof                                                                                                                              |
| 3   | calendar-rtl CI organizer-RLS parity (`E2E_ADMIN_*` == SRTL-02 seed organizer)   | v8.0 PR CI bring-up (advisory)         | 80-06-SUMMARY §Issues (W2 contingency, non-blocking, documented resolution)                                                                                                                         |

### Required Artifacts

| Artifact                                           | Expected                                                          | Status     | Details                                                                                                                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts`    | 4-axis (60-scan) sweep via shared runAxe, recorded fixme baseline | ✓ VERIFIED | Exists (5411 B); `runAxe`/`settlePage`/`waitForRouteReady` imports resolve; 0 AxeBuilder; theme pinned via `addInitScript`; 4 `RECORDED_BASELINE` engagements entries |
| `frontend/tests/e2e/rtl-component-smokes.spec.ts`  | Popover/Pagination/Sidebar RTL smokes, screenshot-free            | ✓ VERIFIED | Exists (6307 B, 130 lines); `getComputedStyle`/`getBoundingClientRect` assertions; 0 real `toHaveScreenshot`                                                          |
| `frontend/tests/e2e/calendar-rtl.spec.ts`          | Evergreen constructor-clock (no page.clock)                       | ✓ VERIFIED | `FakeDate extends RealDate` constructor override; `static now()` returns real time; 0 real `page.clock` calls; `FROZEN_TIME_ISO='2026-07-15T12:00:00Z'`               |
| `.github/workflows/ci.yml` (`test-rtl-smokes` job) | Separate green-from-birth job, local-dev pattern                  | ✓ VERIFIED | Job at L380; verbatim `test-a11y` + 3 deltas; no `E2E_BASE_URL`; runs the 3 RTL specs; distinct `rtl-smokes-report` artifact                                          |
| `frontend/src/styles/list-pages.css` (chip fix)    | Contrast repair via `-soft` tokens, no palette literal            | ✓ VERIFIED | `556f20705` diff: `color-mix(...)` → `var(--danger/warn/ok/info-soft)`; only file in commit; parity guard untouched                                                   |
| 80-A11Y-BASELINE.md                                | Recorded set A + set B + B⊆A verdict + fix/record ledger          | ✓ VERIFIED | §1–§12 complete, internally consistent; verdict FALSE (4 NEW), MF-1/2/3 fixed, 4 recorded (parity)                                                                    |
| 80-VISUAL-RECOMPARE.md                             | 43-row human triage + APPROVED + recapture close                  | ✓ VERIFIED | §5 43 rows, §10 approval, §11 recapture/replay-proof/lineage closed                                                                                                   |

### Key Link Verification

| From                         | To                          | Via                                                                   | Status  | Details                                                              |
| ---------------------------- | --------------------------- | --------------------------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| `qa-sweep-axe-4axis.spec.ts` | `helpers/qa-sweep.ts`       | `import { runAxe }` → `runAxe(page,{include:'main'})`                 | ✓ WIRED | Real export at qa-sweep.ts:39; no inline scanner                     |
| `qa-sweep-axe-4axis.spec.ts` | `helpers/v6-routes.ts`      | `import { V6_ROUTES }` → 15×2×2 loop                                  | ✓ WIRED | 60 scans enumerated by Playwright                                    |
| `556f20705` chip fix         | `--*-soft` design tokens    | `background: var(--*-soft)`                                           | ✓ WIRED | AA-proven washes; dark unaffected (0 axe on 30 dark scans per §11.2) |
| `ci.yml test-rtl-smokes`     | 3 RTL specs                 | `playwright test direction-portals+calendar-rtl+rtl-component-smokes` | ✓ WIRED | Local-dev-server pattern, no base-URL override                       |
| `799ef3c44` recapture        | new Linear baseline lineage | 39 rewritten PNGs, thresholds untouched                               | ✓ WIRED | After approval; Bureau lineage preserved at 14191cb85                |

### Behavioral Spot-Checks (no server started — Playwright `--list` only)

| Behavior                                 | Command                                                    | Result                                                                                                                             | Status                                           |
| ---------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 4-axis sweep topology                    | `playwright test qa-sweep-axe-4axis.spec.ts --list`        | 60 scans discovered                                                                                                                | ✓ PASS (matches ledger)                          |
| a11y project topology                    | `playwright test --project=a11y --list`                    | 97 tests / 5 files                                                                                                                 | ✓ PASS (matches ledger)                          |
| FOUC smokes topology                     | `playwright test rtl-component-smokes calendar-rtl --list` | 4 tests / 2 files                                                                                                                  | ✓ PASS (matches ledger)                          |
| Runtime green (a11y 87/10/0; smokes 9/9) | full run needs seeded local dev + staging auth             | not re-run here (methodology: don't start servers); corroborated by exact topology + present code fix + raw-log-referenced ledgers | ? SKIP → deferred CI birth-certificate (v8.0 PR) |

### Requirements Coverage

| Requirement | Source Plan         | Description                                                      | Status      | Evidence                                                |
| ----------- | ------------------- | ---------------------------------------------------------------- | ----------- | ------------------------------------------------------- |
| VERIFY-01   | 80-04, 80-05        | Re-capture + re-compare baselined surfaces; expansion called out | ✓ SATISFIED | 43 human verdicts / 0 regressions / recapture 799ef3c44 |
| VERIFY-02   | 80-01, 80-02, 80-03 | Axe sweep vs RECORDED baseline; red/flaky fixed-or-recorded      | ✓ SATISFIED | set A/B + B⊆A + 8 fixed / 4 recorded                    |
| FOUC-02     | 80-06               | Portal + Calendar/Pagination/Sidebar RTL smokes in CI            | ✓ SATISFIED | 3 specs + advisory ci.yml job (7014fdba1)               |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact                                                                                                                                                                                                                                                                                                                                          |
| ---- | ---- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —    | —    | none    | —        | No debt markers (TBD/FIXME/XXX comments) in any of the 5 new/modified files. `test.fixme(true, reason)` is the Playwright recorded-skip API (intentional, record-count-parity baseline convention), not a debt marker. No real `toHaveScreenshot` in smokes, no real `page.clock` in calendar, no inline AxeBuilder, no palette-literal change. |

### Human Verification Required

None blocking. The only outstanding external confirmations are the three **deferred** items above (branch-protection promotion, CI birth-certificate, calendar-rtl CI-organizer parity) — all explicitly deferred to the v8.0 PR / milestone-close lifecycle by a recorded overseer/user decision, and all honestly documented (the SUMMARY even prints the current 8 required contexts to prove gating is not silently claimed). Per the phase's locked decisions these are NOT gaps.

### Gaps Summary

No gaps. All three requirements are proven in the codebase, not merely in the summaries:

- **VERIFY-01** — the recapture commit contains **exactly 39 PNGs + the ledger** (not more, not fewer), the recapture is chronologically after the §10 approval (anti-laundering order held: replay → triage → recapture), config thresholds are byte-untouched vs the pre-token baseline, and the Bureau lineage remains recoverable at `14191cb85`.
- **VERIFY-02** — the recorded A/B baseline is a real dual-tree run (worktree @`14191cb85`), the honest `B⊆A = FALSE` verdict names 4 NEW-on-HEAD scans, those 4 (plus 4 discretionary pre-existing) are **fixed** by a reference-only CSS change that leaves all three byte-matched palette copies untouched (parity guard intact), and the 4 genuinely pre-existing engagements-ARIA scans are **recorded** with exact `test.fixme` record-count parity.
- **FOUC-02** — the two smokes assert on DOM/computed-style only (no screenshots, no `page.clock`), and the `test-rtl-smokes` job is a verbatim clone of the proven local-dev `test-a11y` pattern in `ci.yml` (not the red `e2e.yml` deployed-app class), shipping advisory by the roadmap-sanctioned separate-green-from-birth path.

The whole v8.0 Linear migration is proven correct across every baselined surface and all four axes, with the RTL/portal/FOUC guarantees wired into a green-from-birth CI job. Phase goal achieved.

---

_Verified: 2026-07-03T21:59:51Z_
_Verifier: Claude (gsd-verifier)_
