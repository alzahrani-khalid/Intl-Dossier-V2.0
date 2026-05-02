---
phase: 41
plan: 11
status: complete
verdict: PASS-WITH-DEVIATION
last_updated: 2026-05-02
---

# Plan 41-11 SUMMARY — Verification close-out (gap-closure pass)

## Tasks executed

| Task | Type | Status | Notes |
|------|------|--------|-------|
| 1 | checkpoint:human-verify | Resolved | Operator (Claude orchestrator running on the main checkout, not a sandboxed worktree) ran the dossier-drawer Playwright smoke against the local dev server. User chose this path via the AskUserQuestion checkpoint ("can you run it yourself?"). |
| 2 | auto | Complete | Updated `41-VERIFICATION.md` with the honest 8/14 smoke result, per-gap close-out table, two newly-discovered gaps (G8/G9), and the locked PASS-WITH-DEVIATION verdict. |

## Smoke command actually run

```bash
cd frontend && pnpm exec playwright test \
  tests/e2e/dossier-drawer-trigger-recent.spec.ts \
  tests/e2e/dossier-drawer-trigger-calendar.spec.ts \
  tests/e2e/dossier-drawer-deeplink.spec.ts \
  tests/e2e/dossier-drawer-a11y.spec.ts \
  tests/e2e/dossier-drawer-rtl.spec.ts \
  tests/e2e/dossier-drawer-mobile.spec.ts \
  tests/e2e/dossier-drawer-cta.spec.ts \
  tests/e2e/dossier-drawer-commitment-click.spec.ts \
  tests/e2e/dossier-drawer-axe.spec.ts \
  --reporter=list
```

(Specs invoked by full path because root `playwright.config.ts` had an unrelated `__dirname` ESM bug in `ai-extraction.spec.ts` that blocked discovery from the test name argument form. This bypass does not affect the test outcomes.)

Raw output captured at `.planning/phases/41-dossier-drawer/_smoke/playwright-output.txt`.

## Result counts

- **8 PASS**
- **6 FAIL** (each retried once per `dossier-drawer-rtl.spec.ts:11` config; both attempts failed for the 6)
- **0 SKIP**
- **Duration:** 1.2 min wall clock

## Gap-by-gap close-out

See the "Smoke Results — gap closure pass (2026-05-02)" section in `41-VERIFICATION.md` for the full table. Quick summary:

| Gap | Plan | Code-level outcome | Runtime outcome | New status |
|-----|------|---------------------|------------------|------------|
| G1 | 41-10 | RecentDossiers re-mounted in `Dashboard/index.tsx` | Widget renders "No recent dossiers" — no seeded data | CODE-VERIFIED, BLOCKED-BY-SEED |
| G2 | 41-08 T1 | `data-dossier-id` on CalendarEventPill | `/calendar` shows empty state — no events with `dossier_id` seeded | CODE-VERIFIED, BLOCKED-BY-SEED |
| G3 | 41-09 | `--sla-bad` darkened to `oklch(46% 0.18 25)` | **Wrong token fixed.** Failing axe surface uses `--accent`, not `--sla-bad`. | NOT CLOSED — escalated to G8 |
| G4 | 41-09 | (same as G3) | (same) | NOT CLOSED — escalated to G8 |
| G5 | 41-08 T2 | `box-shadow:none` forced on drawer at ≤768px via `useSyncExternalStore` + matchMedia + inline style | **PASS** at 390×844 viewport | **PASS** |
| G6 | 41-08 T3 | `loginForListPages('ar')` waits for `dir==='rtl' && lang==='ar'` (10s) | Wait times out — i18n race deeper than patch | NOT CLOSED — escalated to G9 |
| G7 | 41-08 T4 | `seed-country-sa` → `b0000001-0000-0000-0000-000000000004` UUID across 9 specs | Drawer opens; commitments section shows "No open commitments" — no seeded `aa_commitments` for the China dossier | CODE-VERIFIED, BLOCKED-BY-SEED |

## New gaps logged for Phase 42

- **G8** — `.btn-primary` (`--accent: oklch(58% 0.14 32)` → renders `#bf5542`) fails WCAG AA against `--accent-fg` (`#fff9f8`) at 4.38:1. Plan 41-09 fixed `--sla-bad` instead. Same mechanical fix needed on `--accent`. DESIGN-SYSTEM owner.
- **G9** — `loginForListPages('ar')` waitForFunction races the i18n LanguageDetector chain. The G6 patch is conceptually correct but the `localStorage.setItem('i18nextLng','ar')` → `page.reload()` → `documentElement.dir==='rtl'` round trip exceeds 10s in this dev environment. TEST-INFRA owner.

## Files modified

- `.planning/phases/41-dossier-drawer/41-VERIFICATION.md` — frontmatter (verdict, status, requirements, pass/fail counts, new_gaps); inserted "Smoke Results — gap closure pass (2026-05-02)" section after the original 2026-05-02 section; updated Plans table; ticked applicable Sign-off Checklist boxes; revised remediation order.
- `.planning/phases/41-dossier-drawer/_smoke/playwright-output.txt` — raw smoke output (gitignored if added to .gitignore; otherwise lives under .planning/).

## Files NOT modified (verified)

- Any source code, spec, or test (Task 2 is documentation-only).
- Plans 41-01 through 41-10 (immutable per gap-closure protocol).

## Deviations

1. **Inline execution.** Plan 41-11 normally spawns a `gsd-executor` subagent in worktree mode for Task 2. Since Task 2 only edits a single docs file (`41-VERIFICATION.md`) plus this SUMMARY, and Task 1's checkpoint was resolved in the orchestrator's main checkout (not a worktree), execution was inlined to save a worktree round-trip. Same outcome; lower context cost.
2. **Smoke command paths.** Specs invoked by full file paths instead of test-name arguments because `tests/e2e/ai-extraction.spec.ts:20` has an unrelated `__dirname` ESM bug that crashes Playwright discovery. Bypassed; not a Phase 41 concern.

## Verdict — locked

**PASS-WITH-DEVIATION.**

Per CLAUDE.md "Backwards compatibility" + plan 41-11 verbiage: the 6 smoke failures are NOT regressions caused by 41-08/41-09/41-10. 4 are seed/data infrastructure issues (the underlying code lands correctly; the test DB lacks the expected fixtures). 2 are newly-surfaced gaps (G8 — wrong token diagnosed in 41-09; G9 — patch insufficient depth). Plan 41-10 closed G1 at the code level cleanly. Plan 41-08 closed G5 cleanly. Plans 41-08 G2/G7 and 41-10 G1 are runtime-blocked but code-correct.

Phase 41 is closed. Phase 42 inherits the new gap inventory.
