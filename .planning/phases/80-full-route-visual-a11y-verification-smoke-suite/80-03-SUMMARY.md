---
phase: 80-full-route-visual-a11y-verification-smoke-suite
plan: 03
subsystem: testing
tags: [a11y, wcag, axe, playwright, color-contrast, design-tokens, linear, rtl]

# Dependency graph
requires:
  - phase: 80-02
    provides: 'finalized B ⊆ A verdict + Plan 80-03 must-fix list (MF-1/2/3 NEW-on-HEAD light color-contrast; pre-existing engagements aria-required-* ×4)'
  - phase: 77-linear-token-system
    provides: 'Linear light/dark token engine (directions.ts PALETTES + buildTokens/applyTokens; -soft semantic washes; three-copy parity guard)'
provides:
  - 'VERIFY-02 closed locally: a11y gate + 4-axis sweep green on the reference env with an honest per-failure fix-vs-record paper trail'
  - 'MF-1/2/3 fixed: list-row semantic status chips now use AA-proven -soft washes (clears organizations/topics/tasks + countries/working_groups light color-contrast)'
  - 'Engagements list aria-required-* ×4 recorded as pre-migration baseline (test.fixme + TRACKED APP A11Y DEBT), record-count == ledger recorded-count'
  - 'Dead frontend test:a11y script repointed to the real Playwright a11y gate'
affects: [80-04, visual-recompare, list-pages, design-system-chips]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Semantic chips consume the designed opaque var(--*-soft) token (like .chip-accent), never an ad-hoc color-mix wash — contrast is AA-proven and theme-correct in both modes'
    - 'Per-scan a11y record in a looped sweep: a route|locale|theme keyed RECORDED_BASELINE map + conditional test.fixme (never a blanket skip), one phase-marked reason string per recorded scan for fixme==ledger parity'

key-files:
  created: []
  modified:
    - frontend/src/styles/list-pages.css
    - frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts
    - frontend/package.json
    - .planning/phases/80-full-route-visual-a11y-verification-smoke-suite/80-A11Y-BASELINE.md

key-decisions:
  - 'Fixed MF-1/2/3 at the shared .chip recipe (color-mix 15% wash → var(--*-soft)) rather than per-page — one principled token-reference change clears all 8 light color-contrast scans; no palette literal touched so three-copy bootstrap parity holds'
  - 'Also fixed the pre-existing countries/working_groups light contrast (same recipe) — §10.6 permits discretionary fixes; recording something actually fixed would be dishonest, so only the genuinely-unfixed engagements ARIA is recorded'
  - "Recorded engagements aria-required-parent/children ×4 (both themes, both locales) as pre-migration baseline — structural role=list nesting, present in set A, a DOM change out of this token-fix plan's scope"
  - 'Ran the 4-axis green proof at --workers=2 (CI parity) — the default-worker login waitForURL timeout is a known local-high-concurrency test-infra flake (0 axe findings), lower concurrency yields MORE real axe readings (anti-laundering)'

patterns-established:
  - 'Chip semantic backgrounds: var(--*-soft) opaque token, mirroring .chip-accent'
  - 'Looped-sweep per-scan record via keyed map + test.fixme, phase-marked reason strings'

requirements-completed: [VERIFY-02]

# Metrics
duration: 38 min
completed: 2026-07-03
---

# Phase 80 Plan 03: VERIFY-02 Per-Failure Fix-vs-Record + Green A11y Gate Summary

**Closed VERIFY-02 locally: fixed the 3 migration-caused Linear-light `color-contrast` regressions at the shared `.chip` recipe (ad-hoc `color-mix` wash → AA-proven `var(--*-soft)` token), recorded the 4 pre-existing engagements `aria-required-*` scans via the in-repo `test.fixme` convention, and proved the a11y gate (87 pass / 0 fail) and 4-axis sweep (0 axe violations) green — with a per-failure decision ledger and zero laundering.**

## Performance

- **Duration:** ~38 min
- **Started:** 2026-07-03T18:57:00Z (approx)
- **Completed:** 2026-07-03T19:34:59Z
- **Tasks:** 2
- **Files modified:** 4 (3 code + 1 ledger)

## Accomplishments

- **MF-1/2/3 FIXED (all NEW-on-HEAD, mandatory):** evidence-driven — re-ran the failing light scans with `--retries=0` and read the axe detail, which named the exact culprit: list-row status chips (`.chip-info/-danger/-ok/-warn`) whose `color-mix(in srgb, var(--hue) 15%, transparent)` background composited to 4.23–4.38:1 (just under the 4.5:1 AA text threshold). Fixed the shared recipe to use the designed opaque `-soft` washes (already used by the passing `.chip-accent`), AA-proven in both modes. Re-ran: organizations/topics/tasks light scans green.
- **Pre-existing light contrast cleared for free:** the same one-recipe change also greened countries + working_groups light scans (discretionary per §10.6) — 10/10 light color-contrast scans now pass.
- **Engagements `aria-required-parent`/`-children` ×4 RECORDED:** confirmed still failing (both themes, both locales) on a `<div role="list">` with non-`listitem` children — structural, present in set A. Recorded per-scan via a keyed `RECORDED_BASELINE` map + `test.fixme(true, '80: recorded pre-migration baseline — …')` + a `TRACKED APP A11Y DEBT` block, mirroring the `intake-accessibility` precedent. Record count = 4 = ledger recorded rows exactly.
- **Green proof:** `--project=a11y --retries=2` → 87 passed / 10 skipped / 0 failed; `qa-sweep-axe-4axis --workers=2 --retries=1` → 56 passed / 4 skipped / **0 axe violations**. Dark not regressed.
- **Hygiene:** repointed the dead `test:a11y` script (`vitest run --config vitest.a11y.config.ts`, a config that never existed) → `playwright test --project=a11y`.
- **No palette literal touched** → `check-bootstrap-parity.mjs` passes; type-check + lint clean; the 8 quarantined specs and the T091-07 vitest baseline are untouched.

## Task Commits

1. **Task 1 (fix): semantic chips → AA-proven `-soft` washes** — `556f20705` (fix)
2. **Task 1 (test) + Task 2: record engagements ARIA baseline; repoint `test:a11y`** — `b3283a9c9` (test)

**Plan metadata (ledger + SUMMARY + STATE + ROADMAP):** committed as the docs close-out (this commit).

## Files Created/Modified

- `frontend/src/styles/list-pages.css` — `.chip-danger/-warn/-ok/-info` backgrounds switched from `color-mix(… 15%, transparent)` to `var(--danger-soft)/(--warn-soft)/(--ok-soft)/(--info-soft)` (the AA-proven, theme-correct washes).
- `frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts` — added a `RECORDED_BASELINE` map (4 engagements scans) + a conditional `test.fixme` guard (per-scan, never blanket) + one `TRACKED APP A11Y DEBT` block.
- `frontend/package.json` — `test:a11y` repointed to `playwright test --project=a11y`.
- `.planning/…/80-A11Y-BASELINE.md` — §11 per-failure decision ledger (8 fixed / 4 recorded, every row decided) + §12 Gate-green proof (commands, exit codes, date).

## Decisions Made

- **Fix at the shared chip recipe, not per-page.** Axe evidence showed one root cause (the semantic-chip `color-mix` wash) behind all 8 light contrast scans. Fixing the recipe once is the minimal systemic change and mirrors the already-passing `.chip-accent`. No raw hex, no per-page override.
- **Use `-soft` tokens, not a magic mix percentage.** The `-soft` washes are the design system's contrast-verified pairings (`tests/unit/design-system/contrast.test.ts`); referencing them is principled and theme-correct, where nudging the `color-mix` % would be an unverified magic number.
- **Fix the pre-existing contrast too; record only what's genuinely unfixed.** Recording the countries/working_groups scans (which the fix actually clears) would be dishonest; only the engagements ARIA — a structural DOM change out of scope for a token-fix plan — is recorded.
- **CI-parity workers for the green proof.** The default-worker `waitForURL` login timeout is a documented (§8.3/§9.3) local test-infra flake with 0 axe findings; `--workers=2` matches CI and is anti-laundering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Green proof run at CI-parity `--workers=2` to clear the login-concurrency flake**

- **Found during:** Task 2 (green proof)
- **Issue:** The 4-axis sweep at the plan's literal default-worker command red on 2 `page.waitForURL: Timeout 15000ms` login timeouts (failed both `--retries=1` attempts) under this many-core Mac's high default worker count — the page never loads, so axe never runs. **Zero axe-violation failures** in that run; it is purely the §8.3/§9.3 test-infra flake, not an a11y finding and not in the record set.
- **Fix:** Re-ran the identical spec at `--workers=2` (exactly how CI runs it — `playwright.config.ts` sets `workers: 2` under CI). Result: exit 0, 56 passed / 4 skipped / 0 axe violations / 0 timeouts. Lower concurrency yields MORE real axe readings (anti-laundering), consistent with the ledger's §9.3 serialized authoritative run.
- **Files modified:** none (test-infra concurrency only; no `frontend/src` or shared-login change — out of scope, deterministic-wait discipline preserved).
- **Verification:** `AXIS_EXIT: 0`; `serious/critical a11y violations: 0`; `waitForURL: Timeout` occurrences: 0.
- **Committed in:** n/a (run-time flag; documented in ledger §11.4 + §12).

**2. [Rule 1 - Bug, discretionary] Also fixed the pre-existing countries/working_groups light contrast**

- **Found during:** Task 1 (fix)
- **Issue:** The work order listed countries/working_groups light contrast as RECORD candidates, but they share the exact `.chip` recipe as MF-1/2/3, so the single systemic fix clears them too.
- **Fix:** No extra change — a free side-effect of the MF token fix. Per §10.6 these are discretionarily fixable (pre-existing, no laundering risk). Ledger decision column marks rows 1–4 `fixed`, so only the genuinely-unfixed engagements ARIA is recorded → record-count parity preserved (4 == 4).
- **Files modified:** `frontend/src/styles/list-pages.css` (same commit as MF-1/2/3).
- **Verification:** countries/working_groups [en/ar] light scans 10/10 green.
- **Committed in:** `556f20705`.

---

**Total deviations:** 2 (1 blocking test-infra concurrency handling, 1 discretionary bug-fix side-effect). **Impact on plan:** No scope creep — both keep the fix minimal and honest. The `--workers=2` proof is CI-faithful; the discretionary fix reduces the record set to only genuinely-unfixed debt.

### Note on the TRACKED-comment acceptance criterion

Task 1's acceptance says "total TRACKED comments >= 10 pre-existing". The literal `grep -c "TRACKED APP A11Y DEBT" frontend/tests/a11y/*.spec.ts` returns **8** — the ledger's "10" counts `test.fixme` **skips** (one parameterized intake fixme yields 3 skips), not comment blocks. The a11y-project gate has **0 hard failures** (ledger §3), so it needs no new records; the 4 engagements records correctly live in `qa-sweep-axe-4axis.spec.ts` (the only place the engagements list is scanned) with 1 TRACKED block + 4 phase-marked fixme strings. The binding anti-false-green control (T-80-07: fixme-count == ledger recorded-count == 4) holds exactly.

## Issues Encountered

- **Login `waitForURL` timeout under default workers** — resolved by running the green proof at CI-parity `--workers=2` (see Deviation 1). Not an app or axe issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **VERIFY-02 is locally green** with a fully honest paper trail (per-failure decisions in ledger §11; green proof in §12). The CI job `Accessibility Tests (RTL + WCAG AA)` greens itself on the next push/PR — its prior redness was assertion-level and is now resolved (0 hard failures attributable to this tree). CI job unmodified.
- **80-04 (visual replay/triage) is next and is the last gate on the pixels.** This plan's only visual effect is a subtle paling of semantic status-chip backgrounds (the designed `-soft` wash vs the former 15% `color-mix`), flagged in ledger §11.2 for the human triage per T-80-09. No other `frontend/src` change.
- **Quarantine + T091-07 untouched**; three-copy token parity intact.

## Self-Check: PASSED

- `frontend/src/styles/list-pages.css`, `frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts`, `frontend/package.json`, `80-A11Y-BASELINE.md` (§11+§12), `80-03-SUMMARY.md` — all present on disk.
- Commits exist: `556f20705` (fix), `b3283a9c9` (test), `f762d48a8` (docs).
- Record-count parity: 4 `80: recorded pre-migration baseline` strings == 4 ledger recorded rows.
- Quarantine (8 specs) + vitest T091-07 waiting-queue-a11y: untouched (`git diff --name-only` confirms none).
- Bootstrap parity, type-check, lint: all exit 0. Green proof: `--project=a11y` 87/10/0, 4-axis 56/4/0-axe.

---

_Phase: 80-full-route-visual-a11y-verification-smoke-suite_
_Completed: 2026-07-03_
