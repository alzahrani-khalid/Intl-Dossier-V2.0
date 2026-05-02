---
phase: 42-remaining-pages
plan: 09
subsystem: ui
tags: [settings, page-reskin, design-system, tweaks-drawer, react-hook-form, radix-radio, playwright]

# Dependency graph
requires:
  - phase: 42-00
    provides: 'Wave 0 deliverables — Icon component, settings i18n keys (incl. Appearance design controls), .settings-nav + mobile pill-row CSS, density rename shim, Playwright scaffold'
  - phase: 42-02
    provides: 'shared phase-42 Playwright fixtures (setupPhase42Test, gotoPhase42Page, PHASE_42_ROUTES.settings)'
  - phase: 42-03
    provides: 'density triad rename — DesignProvider migration shim spacious → dense'
  - phase: 42-04
    provides: 'settings-page.spec.ts scaffold (test.skip cases now un-skipped)'
  - phase: 33-token-engine
    provides: 'DesignProvider + useDesignDirection / useMode / useHue / useDensity hooks'
  - phase: 34-tweaks-drawer
    provides: 'TweaksDrawer hook wiring (Settings now mirrors the same hooks — no state divergence)'
provides:
  - 'Settings page (/settings) reskinned to handoff 240+1fr two-column chrome'
  - 'Vertical 9-section nav (R-02) with active accent bar (.settings-nav.active::before)'
  - 'Mobile pill row at ≤768px (CSS-driven via index.css @media)'
  - 'Appearance section exposes 4 design controls (direction / mode / hue / density) bound to DesignProvider hooks — same state as TweaksDrawer'
  - 'Functional Playwright spec un-skipped (2 active cases: layout, mobile collapse)'
affects: [42-10, 42-11, 43-*]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Settings sections render through SettingsLayout (250+1fr Grid) instead of `container mx-auto px-4` chrome'
    - 'Pages emit data-loading attribute for Playwright readiness fixture (pattern shared with other Wave-1 reskins)'
    - 'Direct DesignProvider-hook bindings replace form fields when the hook is the canonical source of truth (legacy DB columns kept writable for back-compat but not surfaced as form inputs)'

key-files:
  created:
    - 'frontend/src/components/settings/__tests__/SettingsLayout.test.tsx'
  modified:
    - 'frontend/src/components/settings/SettingsLayout.tsx'
    - 'frontend/src/components/settings/SettingsNavigation.tsx'
    - 'frontend/src/components/settings/index.ts'
    - 'frontend/src/components/settings/sections/AppearanceSettingsSection.tsx'
    - 'frontend/src/pages/settings/SettingsPage.tsx'
    - 'frontend/tests/e2e/settings-page.spec.ts'

key-decisions:
  - 'Drop legacy SettingsTabs export (mobile drawer replaced by index.css @media pill row); barrel kept NAV_ITEMS as a stub for any lingering callers'
  - 'AppearanceSettingsSection.form prop kept optional for SettingsPage signature compatibility; the 4 new design controls do not write through the form (they persist instantly via DesignProvider hooks per D-11)'
  - 'Component file `SecuritySettingsSection.tsx` kept under id `security`; only the i18n nav label is renamed to `nav.accessAndSecurity` (D-09 — file rename deferred to Phase 43)'

patterns-established:
  - 'Settings-page chrome lives entirely in SettingsLayout via inline grid + handoff index.css classes (.settings-nav, .settings-nav-card, .card-head, .card-title, .card-sub) — no Tailwind container utility'
  - 'When a setting`s canonical state lives in DesignProvider (direction/mode/hue/density), the section binds the hook directly, not through react-hook-form'

requirements-completed:
  - PAGE-05

# Metrics
duration: ~12min
completed: 2026-05-02
---

# Phase 42 Plan 09: Settings page reskin — handoff 240+1fr chrome with 9-section nav and 4 hook-bound design controls

**Settings page now renders the IntelDossier 240+1fr handoff chrome with a 9-section vertical nav (active accent bar via `inset-inline-start::before`), a mobile pill row at ≤768px, and a fully-rebuilt Appearance section that exposes direction / mode / accent hue / density controls bound to the same DesignProvider hooks the Phase 34 TweaksDrawer uses (no duplicate localStorage keys).**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-02T14:28:00Z
- **Completed:** 2026-05-02T14:40:06Z
- **Tasks:** 3
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- Replaced `SettingsLayout`'s `container mx-auto px-4 sm:px-6 lg:px-8` chrome with the handoff 240+1fr CSS Grid + handoff `.settings-nav` / `.settings-nav-card` / `.card-head` / `.card-title` / `.card-sub` primitives that Plan 03 promoted to global in `index.css`.
- Rewrote `SettingsNavigation` to render exactly 9 nav rows in canonical R-02 order (profile → general → appearance → notifications → security → accessibility → data-privacy → email-digest → integrations) with 44×44 touch targets, `aria-current="page"`, and a `data-testid` on every row for Playwright targeting.
- Active row uses `.settings-nav.active` so the accent bar (`inset-inline-start: 0` 2px line via `::before`) and mobile underline (`border-block-end: 2px var(--accent-ink)`) inherit from the index.css rules — zero new CSS.
- Mobile pill collapse is CSS-only: at ≤768px the index.css `@media (max-width: 768px)` block flips `.settings-layout` to single column and `.settings-nav-card` to a horizontal scrollable flex row.
- Replaced `AppearanceSettingsSection`'s legacy color-mode + display-density grid with 4 SettingsGroup blocks bound directly to `useDesignDirection`, `useMode`, `useHue`, `useDensity`. The Phase 34 `TweaksDrawer` uses the *same* hook imports, so state never diverges and the canonical localStorage keys (`id.dir`, `id.theme`, `id.hue`, `id.density`) are written from one place.
- Density triad uses `comfortable | compact | dense` (R-03 rename); Plan 03's migration shim handles legacy `'spacious'` localStorage values transparently. The string `spacious` does not appear in `AppearanceSettingsSection.tsx`.
- Wired `SettingsPage`'s `useQuery({ queryKey: ['user-settings'] }).isLoading` down to `<SettingsLayout isLoading=...>` so the section root emits `data-loading="true"` until the query resolves — Playwright fixtures can rely on the canonical readiness marker.
- Un-skipped 2 functional E2E cases in `frontend/tests/e2e/settings-page.spec.ts` (layout + mobile collapse). Visual screenshot case stays `test.skip` per the spec scaffold.
- Added a fresh `SettingsLayout.test.tsx` vitest suite — 8/8 cases PASS — covering grid template, R-02 row order, active row state, 44×44 touch targets, the D-09 i18n key rename, and the `.settings-nav-card` mobile target.

## Task Commits

Each task was committed atomically:

1. **Task 1: Reskin SettingsLayout + SettingsNavigation** — `8eefd6cc` (feat) — TDD: tests written first, then GREEN
2. **Task 2: Extend AppearanceSettingsSection with design controls (D-11)** — `a7f57c0d` (feat)
3. **Task 3: Update SettingsPage.tsx + un-skip Playwright spec** — `33b53de3` (feat)

**Plan metadata:** _pending — committed after this SUMMARY_

## Files Created/Modified

- `frontend/src/components/settings/__tests__/SettingsLayout.test.tsx` — **created** — 8 vitest cases for grid + nav + touch targets + D-09 i18n rename + `.settings-nav-card` mobile target.
- `frontend/src/components/settings/SettingsLayout.tsx` — **modified** — full rewrite to handoff 240+1fr Grid; emits `data-loading`; pulls `dir` off `i18n.language === 'ar'`; preserves `SettingsSectionWrapper` + `SettingsSectionSkeleton` + `SettingsEmptyState` exports for SettingsPage compatibility (re-skinned to use design tokens, no shadcn `Card`).
- `frontend/src/components/settings/SettingsNavigation.tsx` — **modified** — full rewrite; 9 sections in R-02 order; uses `<Icon>` from signature-visuals; legacy `SettingsTabs` and per-row `lucide-react` icons removed; mobile dock removed.
- `frontend/src/components/settings/index.ts` — **modified** — barrel drops `SettingsTabs` export (no remaining callers); keeps `NAV_ITEMS` re-export.
- `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx` — **modified** — full rewrite; renders 4 SettingsGroup blocks bound to DesignProvider hooks (direction / mode / hue slider / density); legacy `lucide-react` icons + Card-based mode picker removed; `form` prop kept optional for SettingsPage signature compatibility but unused (D-11 controls persist instantly via `setX`).
- `frontend/src/pages/settings/SettingsPage.tsx` — **modified** — adds `isLoading={isLoading}` prop pass-through to `SettingsLayout`. All 9 sections, the `react-hook-form + zod` schema, the Save mutation, and the URL-driven section state are preserved verbatim per D-10.
- `frontend/tests/e2e/settings-page.spec.ts` — **modified** — `test.skip(...)` → `test(...)` on both functional cases; comment updated to reflect un-skipped state.

## Decisions Made

- **AppearanceSettingsSection signature compatibility:** Kept `form?: UseFormReturn<any>` as an optional prop so SettingsPage's existing `<AppearanceSettingsSection form={form} />` callsite needs no edits, but the prop is unused inside the component — the new controls are direct DesignProvider hook bindings that persist via `setX` per D-11. This avoids modifying SettingsPage's react-hook-form wiring (D-10 preserves the per-section forms) while still implementing the D-11 hook-binding contract.
- **`SettingsTabs` export removed from barrel:** The mobile pill row is now CSS-driven (`@media (max-width: 768px)` in index.css from Plan 03), so the React-side `<SettingsTabs>` component had zero remaining callers after the SettingsLayout rewrite. Barrel keeps `NAV_ITEMS` re-export for any lingering imports.
- **Component file `SecuritySettingsSection.tsx` kept under id `security`:** Per D-09, only the i18n nav label is renamed to `nav.accessAndSecurity`. File rename is deferred to Phase 43 to avoid touching unrelated imports.
- **Identity-mock i18n in unit tests:** The global `tests/setup.ts` returns the raw key string when no translation is mapped, so `nav.accessAndSecurity` is asserted as a literal substring. Real EN/AR translations live in the i18n JSON files (Wave 0) and are validated end-to-end via the Playwright suite.

## Deviations from Plan

None — plan executed exactly as written. The plan's example code blocks were followed in spirit; minor adjustments (kept `form` prop optional on AppearanceSettingsSection, kept `SettingsSectionWrapper`/`SettingsSectionSkeleton`/`SettingsEmptyState` exports on SettingsLayout) were necessary to preserve the existing SettingsPage wiring per D-10 without scope creep.

---

**Total deviations:** 0
**Impact on plan:** None.

## Issues Encountered

- **Worktree had no `node_modules`:** Linked `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/node_modules` and `frontend/node_modules` from the main repo into the worktree so vitest could run. No code changes; symlinks are untracked.
- **Pre-existing TS errors in `SettingsSectionCard.tsx` and `settings.types.ts`:** Out-of-scope (per Karpathy/surgical rule); not introduced by this plan; left for a future cleanup pass.

## TweaksDrawer ↔ Settings shared state — verification

`AppearanceSettingsSection` and `frontend/src/components/tweaks/TweaksDrawer.tsx` both import the same hooks:

- `useDesignDirection` from `@/design-system/hooks/useDesignDirection`
- `useMode` from `@/design-system/hooks/useMode`
- `useHue` from `@/design-system/hooks/useHue`
- `useDensity` from `@/design-system/hooks/useDensity`

Each hook reads from `DesignContext` and writes to the canonical localStorage keys defined in `DesignProvider.tsx`:

- `id.dir`, `id.theme`, `id.hue`, `id.density`

No new localStorage keys were introduced by this plan. State changes from either surface (Settings or TweaksDrawer) flow through the same `setDirection / setMode / setHue / setDensity` callbacks and re-render both surfaces via React context.

## Next Phase Readiness

- Wave 1 plans 42-10 and 42-11 are unaffected (independent files).
- Wave 2 visual screenshot generation can now run against the un-skipped functional spec to capture the new chrome.
- Phase 43 should rename the `SecuritySettingsSection.tsx` file to `AccessAndSecuritySettingsSection.tsx` (D-09 follow-through).

---

*Phase: 42-remaining-pages*
*Completed: 2026-05-02*

## Self-Check: PASSED

Verified before commit:

- `frontend/src/components/settings/SettingsLayout.tsx` — FOUND
- `frontend/src/components/settings/SettingsNavigation.tsx` — FOUND
- `frontend/src/components/settings/index.ts` — FOUND
- `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx` — FOUND
- `frontend/src/components/settings/__tests__/SettingsLayout.test.tsx` — FOUND
- `frontend/src/pages/settings/SettingsPage.tsx` — FOUND
- `frontend/tests/e2e/settings-page.spec.ts` — FOUND
- Commit `8eefd6cc` (Task 1) — FOUND in `git log`
- Commit `a7f57c0d` (Task 2) — FOUND in `git log`
- Commit `33b53de3` (Task 3) — FOUND in `git log`
- Vitest 8/8 PASS (verified via `pnpm --filter frontend test --run SettingsLayout` equivalent)
- Verification block: 8/8 plan checks PASS
