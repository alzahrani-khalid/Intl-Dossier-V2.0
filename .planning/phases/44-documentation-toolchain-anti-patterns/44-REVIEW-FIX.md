# Phase 44 Code Review Fixes

**Initial review:** `166b7da9` (`docs(44): add code review report`)
**Fix commit:** `f40088fc` (`fix(44): address code review findings`)

## Findings Addressed

- `CR-01` fixed: size-limit entry and signature-visual globs are now unambiguous, with singleton match-count checks in `frontend/scripts/assert-size-limit-matches.mjs`.
- `WR-01` fixed: Phase 44 Playwright checks now assert concrete EN/AR route direction and rendered dashboard, drawer, and tasks surfaces before running axe.
- `WR-02` fixed: CI `PNPM_VERSION` now matches the root `packageManager` value (`10.29.1`).
- `WR-03` fixed: selected calendar participant removal controls now have a localized accessible name, hidden decorative icon, and 44px target dimensions.

## Re-Review Warning Addressed

- Final re-review found a stale hook dependency in `CalendarEntryForm` where `handleReschedule` called `handleGenerateSuggestions` from an empty dependency array. The callback now depends on `handleGenerateSuggestions`, preserving current form state for conflict rescheduling.

## Verification

- `git diff --check -- .github/workflows/ci.yml frontend/.size-limit.json frontend/scripts/assert-size-limit-matches.mjs frontend/src/components/calendar/CalendarEntryForm.tsx frontend/src/i18n/ar/calendar.json frontend/src/i18n/en/calendar.json frontend/tests/e2e/phase-44-antipatterns.spec.ts frontend/vite.config.ts` - PASS.
- `node frontend/scripts/assert-size-limit-matches.mjs` - PASS:
  - Initial JS: 1 file
  - React vendor: 1 file
  - TanStack vendor: 1 file
  - Total JS: 281 files
  - signature-visuals/d3-geospatial: 1 file
  - signature-visuals/static-primitives: 1 file
- `node -e "JSON.parse(...)"` for `.size-limit.json` and calendar locale files - PASS.
- `pnpm -C frontend size-limit` - PASS:
  - Initial JS: 414.93 kB / 517 kB
  - React vendor: 348.12 kB / 349 kB
  - TanStack vendor: 50.1 kB / 51 kB
  - Total JS: 2.42 MB / 2.43 MB
  - signature-visuals/d3-geospatial: 54.15 kB / 55 kB
  - signature-visuals/static-primitives: 9 kB / 64 kB
- `pnpm -C frontend exec vitest run src/pages/Dashboard/widgets/__tests__/OverdueCommitments.test.tsx` - PASS, 11 tests.
- `pnpm -C frontend exec eslint ...` for touched Phase 44 source/test/script files - PASS with 0 errors and the pre-existing CalendarEntryForm restricted import warning.
- `pnpm -C frontend exec playwright test phase-44-antipatterns.spec.ts --project=chromium` - PASS, 6 tests.
- Commit hooks on `166b7da9` and `f40088fc` ran the repo build successfully; known warnings remain limited to existing PostCSS import ordering, dynamic import/chunk-size notices, and the backend pdfkit namespace warning.
- Post-re-review focused checks after the callback dependency fix:
  - `pnpm -C frontend exec eslint src/components/calendar/CalendarEntryForm.tsx tests/e2e/phase-44-antipatterns.spec.ts scripts/assert-size-limit-matches.mjs` - PASS with 0 errors and the pre-existing restricted import warning.
  - `pnpm -C frontend exec vitest run src/pages/Dashboard/widgets/__tests__/OverdueCommitments.test.tsx --reporter=dot` - PASS, 11 tests.
  - `node frontend/scripts/assert-size-limit-matches.mjs` - PASS.
