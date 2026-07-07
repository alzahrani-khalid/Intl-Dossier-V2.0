---
phase: 87-linear-affordances
plan: 06
subsystem: ui
tags:
  [react, tanstack-router, tanstack-query, zustand, i18n, peek-drawer, filter, display, rtl, vitest]

# Dependency graph
requires:
  - phase: 87-linear-affordances
    provides: 87-01 peekStore/usePeekPaging + useDossierDrawer.pageDossier; 87-02 useListControls/FilterPopover/DisplayPopover/FilterChipsRow + list-controls i18n; 87-04 ListEmptyState (rich + filtered branches)
provides:
  - DossierTable visibleColumns capability (computed --dossier-cols grid template; glyph+name always on)
  - Countries list fully wired with F23 peek + F24 Filter/Display popovers + F26 empty states (the template surface)
  - Organizations list mirroring countries exactly (surfaces 1–2 of the 9 core surfaces)
  - useCountries/useOrganizations extracted fetchers (fetchCountriesPage/fetchOrganizationsPage) + status/sensitivity/orderBy/dir params
  - lib/dossier-facet-count — shared RLS-scoped head-count for live facet counts
  - useListControls chip-value translation fix (was leaking the raw i18n key)
  - list-controls i18n status/sensitivity/sort/property option labels (en+ar)
affects: [87-07-wiring, 87-08-wiring, 87-09-kanban, 87-10-consolidated-signoff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Column visibility via a computed --dossier-cols custom property read only by the desktop .dossier-row media rule (mobile template + all no-prop consumers byte-identical)'
    - 'Peek fetchPage closes over queryClient.fetchQuery against the SAME query key family the list hook uses (extracted module-level fetcher — no divergent duplicate query)'
    - 'Router→URL param engine seam: Route.useSearch/useNavigate feed useListControls via a cast setSearch applier (replace:true); validateSearch composes parseListControlsSearch whitelist over page/search'
    - 'Shared facet-count head-count helper (dossierType + field + other-active-filters) applied per option, gated on popover open through the anon client so RLS applies'

key-files:
  created:
    - frontend/src/lib/dossier-facet-count.ts
  modified:
    - frontend/src/components/list-page/DossierTable.tsx
    - frontend/src/components/list-page/index.ts
    - frontend/src/components/list-page/__tests__/DossierTable.test.tsx
    - frontend/src/styles/list-pages.css
    - frontend/src/components/list-controls/useListControls.ts
    - frontend/src/hooks/useCountries.ts
    - frontend/src/hooks/useOrganizations.ts
    - frontend/src/routes/_protected/dossiers/countries/index.tsx
    - frontend/src/routes/_protected/dossiers/organizations/index.tsx
    - frontend/src/routes/_protected/dossiers/countries/__tests__/CountriesListPage.test.tsx
    - frontend/src/routes/_protected/dossiers/organizations/__tests__/OrganizationsListPage.test.tsx
    - frontend/src/i18n/en/list-controls.json
    - frontend/src/i18n/ar/list-controls.json

key-decisions:
  - 'Column template driven by a --dossier-cols custom property read only by the @768 media rule; mobile base template and every no-prop consumer stay byte-identical (zero regression for the default case)'
  - "Peek fetchPage reuses the list hook's extracted fetcher via queryClient.fetchQuery with an identical query key — cross-page paging hits the same cache, never a second query definition"
  - 'dossierFacetCount lives in lib/ (pure supabase helper, kebab-case) not components/ — satisfies the filename-case gate and is reusable by 87-07/08/09 dossier surfaces'
  - 'Fixed the shared useListControls.formatValue to translate the option label (t(opt.labelKey)) — chips previously rendered the raw i18n key; the fix benefits all Wave-2 surfaces'
  - 'AFF-01/AFF-02 remain Pending — this plan wires 2 of 9 core surfaces; they complete only when 87-07/08/09 wire the rest (+ 87-10 consolidated sign-off), mirroring the 87-01/02 honesty'

patterns-established:
  - 'DossierTable column visibility: optional cols computed to --dossier-cols, cells conditionally rendered in header + body, glyph+name always present'
  - 'Uniform dossier-list surface recipe (the countries template the other uniform surfaces copy): config + validateSearch whitelist + useListControls + peek-on-click + popovers + chips + ListEmptyState'

requirements-completed: [AFF-04]

# Metrics
duration: 35 min
completed: 2026-07-07
---

# Phase 87 Plan 06: DossierTable surfaces — F23/F24/F26 wiring Summary

**Wired the full Linear affordance set (peek + prev/next paging, split Filter/Display popovers with live counts + URL persistence, rich + filtered empty states) into the two DossierTable surfaces — countries done first as the reusable template, organizations mirroring it — plus the DossierTable column-visibility capability they need.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-07-07T14:50:00Z
- **Completed:** 2026-07-07T15:23:00Z
- **Tasks:** 3
- **Files modified:** 14 (1 created, 13 modified)

## Accomplishments

- **DossierTable `visibleColumns`** — optional `ReadonlyArray<'engagements'|'lastTouch'|'sensitivity'>` prop drives a computed grid template via a `--dossier-cols` custom property (glyph + name always on; one `auto` track per visible optional column). Header + body cells render conditionally. Applied through a CSS var read only by the `@768` `.dossier-row` rule, so the mobile template and every existing no-prop consumer are byte-identical. `DossierTableColumn` exported from the barrel.
- **Countries (the template)** — `validateSearch` extended via `parseListControlsSearch` (status/sensitivity/sort/dir/cols whitelisted, unknown → undefined). Row click now `register`s the loaded id window in the peek store (with a cross-page `fetchPage`) and calls `openDossier` — the detail-route navigate is gone. Toolbar carries `ToolbarSearch + FilterPopover + DisplayPopover`; a `FilterChipsRow` sits above the table. `ListEmptyState` replaces the bare `empty-hint` (rich create CTA when truly empty; "no matching rows" + ghost Clear filters when filtered-empty). Create CTA verified against `/dossiers/countries/create`.
- **Organizations** — mirrors countries exactly (country → organization swaps; no ISO/flag merge). Near-identical diff aids review (the Phase-40 copy-paste symmetry).
- **Hooks** — `useCountries`/`useOrganizations` gained an extracted module-level fetcher (`fetchCountriesPage`/`fetchOrganizationsPage`) plus `status`/`sensitivity`/`orderBy`/`dir`/`nameColumn` params threaded into the single `.order()` seam (default preserves legacy `updated_at DESC`); the new params flow into the queryKey. The extracted fetcher is what the peek `fetchPage` re-invokes through `queryClient.fetchQuery`.
- **Shared facet counts** — `lib/dossier-facet-count.ts` head-counts `dossiers` of a type matching one option's predicate plus the other active filters (Linear-style narrowing), anon client only (RLS applies, T-87-16).

## Task Commits

Each task committed atomically:

1. **Task 1: DossierTable visibleColumns capability** — `6f7791dd` (feat)
2. **Task 2: Countries — full F23/F24/F26 wiring (the template)** — `47b2480f` (feat)
3. **Task 3: Organizations — mirror the countries template** — `8198c453` (feat)

**Plan metadata:** this SUMMARY commit (docs).

## Files Created/Modified

- `components/list-page/DossierTable.tsx` — `visibleColumns` prop + computed `--dossier-cols` template + conditional cells
- `components/list-page/index.ts` — export `DossierTableColumn`
- `styles/list-pages.css` — desktop `.dossier-row` reads `var(--dossier-cols, …5-col default)`
- `components/list-controls/useListControls.ts` — `formatValue` now translates the option label (chip no longer leaks the raw key)
- `hooks/useCountries.ts`, `hooks/useOrganizations.ts` — extracted fetcher + filter/sort params
- `routes/_protected/dossiers/countries/index.tsx` — the template surface (config + validateSearch + peek + popovers + chips + empty)
- `routes/_protected/dossiers/organizations/index.tsx` — mirrors countries
- `lib/dossier-facet-count.ts` — shared RLS-scoped facet head-count (created)
- `i18n/{en,ar}/list-controls.json` — status/sensitivity/sort/property option labels
- `**/__tests__/{DossierTable,CountriesListPage,OrganizationsListPage}.test.tsx` — column-visibility cases; route tests rewritten to render the wired route (QueryClient + LanguageProvider + router mock) asserting title, populated row, F23 peek registration on click, and the F26 empty state

## Decisions Made

- **Zero-regression column visibility** via a CSS custom property scoped to the desktop media rule (not inline `gridTemplateColumns`), so the default no-prop path and the mobile template are untouched.
- **No divergent peek query** — the fetcher was extracted so `fetchPage` reuses it through `queryClient.fetchQuery` with the identical key family the hook uses.
- **AFF-01/AFF-02 stay Pending** — 2 of 9 core surfaces wired here; the end-to-end requirement lands when 87-07/08/09 wire the rest (+ 87-10 consolidated sign-off). Mirrors the 87-01/02 foundation honesty. AFF-04 (empty states) was already completed by 87-04 and is re-exercised live here.

## Deviations from Plan

### Auto-fixed / structural additions

**1. [Rule 2 - Missing critical] Shared `useListControls.formatValue` translated the option label**

- **Found during:** Task 2 (countries chips)
- **Issue:** The 87-02 foundation's `formatValue` returned `opt.labelKey` verbatim, so Filter chips rendered the raw i18n key (e.g. `list-controls:sensitivity.3`) as their value — an i18n leak in user-visible copy, and worse in AR.
- **Fix:** Added `useTranslation('list-controls')` to `useListControls` and changed `formatValue` to `t(opt.labelKey)`. Root-cause fix in the shared hook — benefits all Wave-2 surfaces; no sibling plan depends on the raw-key behaviour (none have run).
- **Files modified:** `components/list-controls/useListControls.ts`
- **Verification:** `list-controls` suite 14/14 green; tsc + lint 0.
- **Committed in:** `47b2480f` (Task 2)

**2. [Rule 3 - Blocker] New shared helper `lib/dossier-facet-count.ts` (not in files_modified)**

- **Found during:** Task 2 (facet counts)
- **Issue:** The per-option head-count logic is non-trivial and reused by both surfaces (and 87-07/08/09). Inlining it twice violates DRY; placing it under `components/**` tripped the PascalCase filename gate.
- **Fix:** Extracted to `lib/dossier-facet-count.ts` (pure supabase helper, kebab-case) — one home, filename-gate clean, reusable.
- **Files modified:** `lib/dossier-facet-count.ts` (created)
- **Verification:** lint 0 (filename-case), tsc 0.
- **Committed in:** `47b2480f` (Task 2)

**3. [Rule 1 - Test alignment] Route tests rewritten for the new wiring**

- **Found during:** Tasks 2 & 3
- **Issue:** The countries route dropped the standalone presentational `CountriesListPage` export the old test imported; both routes now use router + QueryClient + peek/list-controls hooks that the old bare renders didn't provide.
- **Fix:** Both route tests now render the wired `Route.component` under `QueryClientProvider` + `LanguageProvider` with a `@tanstack/react-router` mock, asserting title, populated row + chip, F23 peek registration on click, and the F26 empty-state testid.
- **Verification:** dossiers route suite 20/20; plan `<verification>` suite 222/222.
- **Committed in:** `47b2480f` / `8198c453`

**Total deviations:** 3 (1 shared-kit correctness fix, 1 shared helper extraction, 1 test alignment). **Impact:** all additive/corrective; no scope or behaviour change beyond the plan objective. The `useListControls` fix improves every Wave-2 surface.

## Issues Encountered

None blocking. Pre-commit auto-format (prettier) rewrapped a few long lines on commit — expected, no content change. `pnpm exec tsc` from the repo root surfaces PRE-EXISTING agent-runtime/backend errors unrelated to this plan; frontend-scoped `tsc --noEmit` is clean.

## Deferred (self-verification boundary)

- **Live visual / RTL render sign-off** of the two wired surfaces (both locales × dark/light, popovers open, peek drawer counter + chevrons, filtered-empty) rolls into the **87-10 consolidated human render sign-off** — consistent with 87-04's deferral. Unit + type + lint gates are green; pixel parity is a human gate this executor cannot self-certify.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Ready for **87-07** (forums / topics / working-groups). It reuses the same recipe: `ListControlsConfig` + `parseListControlsSearch` in `validateSearch` + `useListControls` + peek-on-click + popovers + `ListEmptyState`, and can reuse `lib/dossier-facet-count.ts`. The countries file is the clean template to copy.
- No blockers.

## Self-Check: PASSED

- Key file exists: `[ -f frontend/src/lib/dossier-facet-count.ts ]` ✓
- Commits present: `git log --grep="87-06"` returns `6f7791dd` + `47b2480f` + `8198c453` ✓
- Task acceptance criteria re-run: `empty-hint` grep 0 on both routes; `openDossier|usePeekStore` 5 (countries) / 3 (organizations); `.order(` reads params; DossierTable 5-col default / 3-col subset test; validateSearch whitelist ✓
- Plan `<verification>` re-run: `vitest run src/components/list-page src/components/list-controls src/store src/hooks src/components/dossier/DossierDrawer src/components/empty-states` → 32 files / 222 tests pass; frontend `tsc --noEmit` 0; `pnpm lint --max-warnings 0` 0 ✓

---

_Phase: 87-linear-affordances_
_Completed: 2026-07-07_
