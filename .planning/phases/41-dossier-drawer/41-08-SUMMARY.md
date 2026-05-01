---
phase: 41
plan: 08
subsystem: dossier-drawer
tags: [drawer, calendar, rtl, e2e-fixtures, mobile-shadow, gap-closure]
requires:
  - Phase 41-06 (CalendarEventPill onEventClick wiring)
  - Phase 41-07 (Wave 2 spec scaffolding incl. dossier-drawer-fixture.ts helper)
provides:
  - data-dossier-id DOM attribute on CalendarEventPill button root
  - Inline-style box-shadow override on DossierDrawer at viewport ≤768px
  - Deterministic AR locale dir-rtl wait in loginForListPages helper
  - Single source of truth FIXTURE_DOSSIER_ID/FIXTURE_DOSSIER_TYPE constants
affects:
  - frontend/src/components/calendar/CalendarEventPill.tsx
  - frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx
  - frontend/tests/e2e/support/list-pages-auth.ts
  - frontend/tests/e2e/support/dossier-drawer-fixture.ts
  - 8 dossier-drawer-*.spec.ts files (a11y, axe, commitment-click, cta, deeplink, mobile, rtl, visual)
tech-stack:
  added: []
  patterns:
    - useSyncExternalStore for matchMedia tracking (G5)
    - Conditional spread for optional DOM data attributes (G2)
    - page.waitForFunction for live-DOM convergence after reload (G6)
    - Centralized fixture constants exported from support helper (G7)
key-files:
  created: []
  modified:
    - frontend/src/components/calendar/CalendarEventPill.tsx
    - frontend/src/components/calendar/__tests__/CalendarEventPill.test.tsx
    - frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx
    - frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx
    - frontend/tests/e2e/support/list-pages-auth.ts
    - frontend/tests/e2e/support/dossier-drawer-fixture.ts
    - frontend/tests/e2e/dossier-drawer-a11y.spec.ts
    - frontend/tests/e2e/dossier-drawer-axe.spec.ts
    - frontend/tests/e2e/dossier-drawer-commitment-click.spec.ts
    - frontend/tests/e2e/dossier-drawer-cta.spec.ts
    - frontend/tests/e2e/dossier-drawer-deeplink.spec.ts
    - frontend/tests/e2e/dossier-drawer-mobile.spec.ts
    - frontend/tests/e2e/dossier-drawer-rtl.spec.ts
    - frontend/tests/e2e/dossier-drawer-visual.spec.ts
decisions:
  - Inline-style box-shadow override (vs CSS module / [&]:max-md:!shadow-none) chosen for deterministic specificity (inline > class) — independent of Tailwind class ordering and tailwind-merge behavior. Sheet primitive untouched; minimum blast radius (only DossierDrawer affected, AppShell sidebar still gets shadow).
  - Conditional spread `{...dossierIdAttr}` (vs `data-dossier-id={event.dossier_id ?? ''}`) chosen so the attribute is fully absent from the DOM when null — Playwright's `[data-dossier-id]` selector requires attribute presence, not value match.
  - 768px breakpoint (vs handoff app.css's 640px) chosen to match Tailwind `max-md` already on the className and CLAUDE.md responsive ladder. Equivalent at the failing 390×844 assertion viewport.
  - Centralize FIXTURE_DOSSIER_ID in support helper (vs per-spec env var) chosen to eliminate the 9-file drift surface. Single source of truth points at b0000001-0000-0000-0000-000000000004 (China dossier — sensitivity_level=3 + 3 overdue commitments).
metrics:
  duration: ~22 min
  completed: 2026-05-01T23:39Z
  tasks-completed: 4/4
  unit-tests-added: 5 (3 CalendarEventPill + 2 DossierDrawer)
---

# Phase 41 Plan 08: Wave 0 Gap Closure (G2 + G5 + G6 + G7) Summary

Closed 4 of 7 Phase 41 smoke gaps in a single file-disjoint batch: CalendarEventPill now emits `data-dossier-id`; DossierDrawer forces `box-shadow: none` at ≤768px via inline-style override beating the cva-base Sheet shadow; `loginForListPages('ar')` blocks until `documentElement.dir === 'rtl'` after reload; all 8 dossier-drawer specs now share a single `FIXTURE_DOSSIER_ID` pointing at the real seeded China UUID.

## Per-Task Results

### Task 1: G2 — `data-dossier-id` on CalendarEventPill root

- **Files modified:** `frontend/src/components/calendar/CalendarEventPill.tsx` (+11 lines), `frontend/src/components/calendar/__tests__/CalendarEventPill.test.tsx` (+23 lines)
- **Behavior added:** `<button>` root carries `data-dossier-id={event.dossier_id}` only when the value is a non-empty string; attribute is fully absent from the DOM otherwise.
- **Implementation point:** `frontend/src/components/calendar/CalendarEventPill.tsx:54-57` declares `const dossierIdAttr = typeof event.dossier_id === 'string' && event.dossier_id.length > 0 ? { 'data-dossier-id': event.dossier_id } : undefined`, then spreads `{...dossierIdAttr}` onto the `<button>` JSX (line ~67). Conditional spread keeps the attribute out of the DOM when null/undefined so Playwright's `[data-dossier-id]` selector cannot accidentally match.
- **Tests added:** 3 — positive (UUID), `null`, `undefined`. All 11 CalendarEventPill tests green.
- **Gap closure:** `dossier-drawer-trigger-calendar.spec.ts` was timing out waiting for `[data-dossier-id]` on `/calendar`; the locator now resolves once a CalendarEventPill mounts for an event with a dossier_id.
- **Commit:** `bc08e995`

### Task 2: G5 — DossierDrawer mobile box-shadow override

- **Files modified:** `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx` (+22 lines), `frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx` (+58 lines)
- **Behavior added:** A `useSyncExternalStore` hook tracks `window.matchMedia('(max-width: 768px)')` and feeds the result into a viewport-conditional inline `style={{ boxShadow: isMobileNarrow ? 'none' : undefined }}` on the SheetContent. Inline style wins over the cva-base `shadow-[var(--shadow-drawer)]` at the cascade level (specificity 1,0,0,0 vs single-class).
- **matchMedia hook strategy:** `useSyncExternalStore` was chosen over `useEffect` + `useState` because it gives React 19 a synchronous read of the matchMedia state on every render (avoids a flash of shadow on first paint). The hook is guarded against missing `window.matchMedia` (jsdom default + SSR pass) — falls back to `false` (desktop default) so unit tests and SSR don't throw.
- **Tests added:** 2 — mobile match → `style.boxShadow === 'none'`; desktop → `style.boxShadow === ''`. All 7 DossierDrawer tests green.
- **Why not change `sheet.tsx`:** removing `shadow-[var(--shadow-drawer)]` from the cva base would break every other `<Sheet />` consumer (notably the AppShell mobile sidebar). Targeted inline override on the drawer is minimum blast radius.
- **Gap closure:** `dossier-drawer-mobile.spec.ts` asserts `expect(computed.boxShadow).toBe('none')` at viewport 390×844 — now satisfied.
- **Commit:** `ea8ff557`

### Task 3: G6 — AR locale wait in loginForListPages

- **Files modified:** `frontend/tests/e2e/support/list-pages-auth.ts` (+17 / -1 lines)
- **Behavior added:** After `page.reload()` in the `locale === 'ar'` branch, a `page.waitForFunction` blocks (10s timeout) until both `document.documentElement.getAttribute('dir') === 'rtl'` and `getAttribute('lang') === 'ar'` are true in the live DOM.
- **Why this works:** the i18n languageChanged handler at `frontend/src/i18n/index.ts:486-488` sets `document.documentElement.dir = 'rtl'` asynchronously after React mount. The previous helper returned immediately after reload, racing the i18n bootstrap. Pre-seeding `i18nextLng=ar` in localStorage BEFORE reload lets the LanguageDetector pick up AR on the next load; the explicit wait then bridges the async mount-to-attribute hop.
- **Cross-suite impact:** Phase 40 list-pages AR specs that already use `loginForListPages(page, 'ar')` will be slightly slower per test (≈100–200ms — i18n loads quickly) but fully deterministic; if i18n bootstrap is genuinely broken the helper now fails loudly with a clear timeout message pointing at this helper.
- **Gap closure:** `dossier-drawer-rtl.spec.ts` AR test (and `dossier-drawer-axe.spec.ts` AR test) no longer race `dir=rtl` settling.
- **Commit:** `4784a697`

### Task 4: G7 — FIXTURE_DOSSIER_ID centralization

- **Files modified:** `frontend/tests/e2e/support/dossier-drawer-fixture.ts` (+22 / -1 lines, exports `FIXTURE_DOSSIER_ID` + `FIXTURE_DOSSIER_TYPE`); 8 spec files now import from the helper instead of declaring a local fallback (`dossier-drawer-{a11y,axe,commitment-click,cta,deeplink,mobile,rtl,visual}.spec.ts`).
- **Single grep proof:** `find frontend/tests/e2e -type f \( -name '*.spec.ts' -o -name '*.ts' \) | xargs grep -l 'seed-country-sa'` returns 0 results.
- **UUID rationale:** `b0000001-0000-0000-0000-000000000004` is `v_d_china` in `supabase/seed/060-dashboard-demo.sql:21,49` — a `country` dossier with `sensitivity_level=3` and 3 overdue `aa_commitments` rows linked via dossier_id (lines 105-107). This satisfies both the CONFIDENTIAL chip threshold and the OpenCommitmentsSection mount precondition.
- **Trigger specs:** `dossier-drawer-trigger-recent.spec.ts` and `dossier-drawer-trigger-calendar.spec.ts` were listed in the plan's `files_modified` for completeness but neither declared the constant — they exercise widget-driven open paths (clicking RecentDossiers / CalendarEventPill) that read the dossier_id from rendered data, so no import was needed.
- **Gap closure:** `dossier-drawer-commitment-click.spec.ts` will now see `useDossierOverview` return rows for the seeded UUID, mounting `OpenCommitmentsSection` so the `dossier-drawer-commitments` testid resolves.
- **Commit:** `8247eec0`

## must_haves Verification

| Truth | Status | Evidence |
|-------|--------|----------|
| CalendarEventPill exposes data-dossier-id when event.dossier_id is non-empty string | ✅ | `frontend/src/components/calendar/CalendarEventPill.tsx:54-57,67` + 3 unit tests pass |
| DossierDrawer renders box-shadow exactly "none" at viewport ≤768px | ✅ | `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx:55-72` + DossierDrawer mobile test asserts `drawer.style.boxShadow === 'none'` |
| loginForListPages('ar') returns only after documentElement.dir === 'rtl' observed | ✅ | `frontend/tests/e2e/support/list-pages-auth.ts:53-65` adds `page.waitForFunction` |
| All 7 specs that hard-coded 'seed-country-sa' now share a single FIXTURE_DOSSIER_ID = b0000001-0000-0000-0000-000000000004 | ✅ | `grep -l 'seed-country-sa'` returns 0 across `frontend/tests/e2e/`; 8 spec files import from helper (note: 8 specs had the constant, not 7 — `dossier-drawer-a11y.spec.ts` was an additional file beyond the plan's listed 7) |

## artifacts Verification

| path | provides | contains | Status |
|------|----------|----------|--------|
| frontend/src/components/calendar/CalendarEventPill.tsx | data-dossier-id attribute when dossier_id non-empty | `data-dossier-id` | ✅ |
| frontend/tests/e2e/support/dossier-drawer-fixture.ts | FIXTURE_DOSSIER_ID + FIXTURE_DOSSIER_TYPE | `export const FIXTURE_DOSSIER_ID` | ✅ |
| frontend/tests/e2e/support/list-pages-auth.ts | AR locale helper waiting for dir=rtl | `waitForFunction` | ✅ |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Guard `window.matchMedia` against undefined in unit-test harness**
- **Found during:** Task 2 unit-test execution
- **Issue:** `useSyncExternalStore` runs the snapshot getter immediately on mount — including from existing DossierDrawer tests that don't mock `window.matchMedia`. jsdom does NOT provide `window.matchMedia` by default, so all 5 pre-existing tests crashed with `TypeError: window.matchMedia is not a function`.
- **Fix:** Added a `typeof window.matchMedia !== 'function'` guard in both the subscribe and snapshot legs of the hook; falls back to `false` (desktop default).
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx` (the inline guard inside the hook).
- **Why this is harmless in production:** real browsers always have `matchMedia`, so the guard branch is unreachable in the actual app. The guard is purely a test-environment + SSR fallback.
- **Commit:** `ea8ff557` (folded into Task 2 commit)

**2. [Rule 3 — Tooling] Symlinked node_modules into worktree to access vitest**
- **Found during:** Task 1 unit-test execution
- **Issue:** The parallel-executor worktree was created without `node_modules`; vitest binary was unavailable.
- **Fix:** Symlinked `frontend/node_modules` → `<repo>/frontend/node_modules` so vitest could resolve. The symlink at the worktree root was removed after tests passed; the frontend symlink is gitignored already and was left in place for any subsequent reruns. Neither symlink is staged in git.
- **No commit** — purely a local environment workaround.

### Architectural Changes

None. All changes were surgical edits within the planned files; no Sheet primitive modifications, no new dependencies.

## Auth Gates

None encountered.

## Test Results

- `vitest --run CalendarEventPill DossierDrawer`: **98 passed (98)**, 11 test files, duration 2.16s.
- E2E suite NOT executed in this plan (plan 41-11 will run the live smoke per the plan's `<verification>` block).
- `tsc --noEmit`: 0 new errors on any modified file.

## Self-Check: PASSED

All claimed files exist on disk and all four task commits exist in git history:

- `frontend/src/components/calendar/CalendarEventPill.tsx` — FOUND
- `frontend/src/components/calendar/__tests__/CalendarEventPill.test.tsx` — FOUND
- `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx` — FOUND
- `frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx` — FOUND
- `frontend/tests/e2e/support/list-pages-auth.ts` — FOUND
- `frontend/tests/e2e/support/dossier-drawer-fixture.ts` — FOUND
- 8 `dossier-drawer-*.spec.ts` files — FOUND
- Commits `bc08e995`, `ea8ff557`, `4784a697`, `8247eec0` — FOUND in `git log`
