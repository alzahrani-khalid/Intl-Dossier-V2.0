---
phase: 87-linear-affordances
plan: 02
subsystem: ui
tags: [react, tanstack-query, tanstack-router, i18n, filter, display, popover, rtl, vitest]

# Dependency graph
requires:
  - phase: 41-dossier-drawer
    provides: ui/popover.tsx Radix wrapper (surface-raised/shadow default overridden here)
  - phase: 40-list-pages
    provides: active-filters/useActiveFilters.ts (chip derive/remove/clear, reused wholesale)
provides:
  - useListControls — router-agnostic URL-param engine (filter keys + sort/dir/cols/group) + parseListControlsSearch whitelist
  - ListControlsConfig contract (FilterFieldDef / SortFieldDef / PropertyDef / GroupingDef) consumed by Wave-2 wiring plans
  - FilterPopover — surface-3/no-shadow filter builder, immediate-apply options, live facet counts, 'Filter · N' trigger + accent dot
  - useFacetCounts — enabled-gated per-option head-count queries (RLS-scoped anon client only, 30s staleTime)
  - FilterChipsRow — Linear-native chip row (no animation library) consuming useActiveFilters output
  - DisplayPopover — group by / sort by / display properties / reset, config-gated sections
  - list-controls i18n namespace (en+ar) registered in i18n/index.ts
affects: [87-06, 87-07, 87-08, 87-09, list-page-filter-display-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Router-agnostic URL-param hook: (config, search, setSearch) in → reducers out; unit-tests without a router by capturing the emitted reducer'
    - 'Whitelist-at-the-boundary: parseListControlsSearch validates every param against config-declared values/ids inside validateSearch (T-87-04)'
    - 'Enabled-gated facet counts via useQueries (dynamic array), fired only while the popover is open, through the anon Supabase client so RLS applies (T-87-06)'
    - 'Shared ui/popover wrapper overridden per Phase-87 elevation contract with className="bg-surface-3 shadow-none" (tailwind-merge last-wins) — no shared-wrapper edit'
    - 'Optional controlled open on both popovers so behavior unit-tests without simulating Radix pointer events'

key-files:
  created:
    - frontend/src/components/list-controls/useListControls.ts
    - frontend/src/components/list-controls/useFacetCounts.ts
    - frontend/src/components/list-controls/FilterPopover.tsx
    - frontend/src/components/list-controls/FilterChipsRow.tsx
    - frontend/src/components/list-controls/DisplayPopover.tsx
    - frontend/src/components/list-controls/__tests__/useListControls.test.ts
    - frontend/src/components/list-controls/__tests__/FilterPopover.test.tsx
    - frontend/src/components/list-controls/__tests__/DisplayPopover.test.tsx
    - frontend/src/i18n/en/list-controls.json
    - frontend/src/i18n/ar/list-controls.json
  modified:
    - frontend/src/i18n/index.ts

key-decisions:
  - 'AFF-02 left Pending — this is the F24 FOUNDATION (surface-agnostic components + hook); Wave-2 plans 87-06..09 wire the popovers into the nine core surfaces. Not deliverable end-to-end by the foundation (mirrors 87-01/AFF-01).'
  - 'Chip derivation delegates to useActiveFilters wholesale (composed inside useListControls); FilterChipsRow stays presentational, consuming that output via props — no duplicate chip/remove/clear logic.'
  - 'cols is the explicit visible-property list when present; absent = surface defaults; toggling back to the default set clears cols entirely (clean, shareable URL).'
  - 'User-visible copy passes defaultValue mirroring the UI-SPEC (the countries-route idiom) so the global react-i18next test mock resolves real strings; the JSON namespace remains the runtime source of truth.'

requirements-completed: [AFF-02]

# Metrics
duration: 15 min
completed: 2026-07-07
---

# Phase 87 Plan 02: F24 Filter + Display foundation Summary

**The surface-agnostic Filter + Display popover kit: a router-agnostic `useListControls` URL-param engine, an enabled-gated RLS-scoped facet-count hook, a Linear-native chip row, and the split Filter/Display popovers — all driven by a per-surface `ListControlsConfig`, ready for Wave-2 to wire into the nine core surfaces.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-07T10:17:04Z
- **Completed:** 2026-07-07T10:32:42Z
- **Tasks:** 3
- **Files modified:** 11 (10 created, 1 modified)

## Accomplishments

- **list-controls i18n namespace** (`i18n/{en,ar}/list-controls.json` + `i18n/index.ts`): the exact UI-SPEC §F24 keys (`filter.*` / `display.*`), 13 keys with byte-identical en/ar key sets and real AR translations. `clear-all` and the showing-count REUSE `active-filters:clearAll` / `active-filters:showingFiltered` (not duplicated). Namespace registered (imports + both resources blocks) in the same commit — `check-i18n-namespaces.mjs` passes.
- **useListControls** (`components/list-controls/useListControls.ts`): router-agnostic `(config, search, setSearch)` engine exporting the `ListControlsConfig` type family plus `setFilter`/`clearAll`/`setSort`/`setDir`/`toggleProperty`/`setGroup`/`resetDisplay`. Every filter change resets `page: 1`; display params round-trip through `sort`/`dir`/`cols`/`group`; `cols` clears to a clean URL when visibility equals the defaults. Standalone `parseListControlsSearch` whitelists every param against config-declared values/ids for `validateSearch` (T-87-04). Chips compose `useActiveFilters` wholesale.
- **FilterPopover** (`FilterPopover.tsx`): `.btn-ghost` trigger with lucide `ListFilter` flipping to `Filter · N` + an accent indicator dot; content overrides the shared wrapper to `bg-surface-3 shadow-none`; option rows at `var(--row-h)` with the label (start) + live count (inline-end, `text-ink-faint`, Latin digits), builder search with the `no_matches` empty line, immediate apply (no Apply button), accent check on selected, zero-count options selectable but `text-ink-tertiary`.
- **useFacetCounts** (`useFacetCounts.ts`): `useQueries` over each option's `buildCountQuery`, `enabled: open` + `staleTime: 30_000` — counts fire only while the popover is open and only through the anon Supabase client so RLS applies (T-87-06; never a service-role endpoint).
- **FilterChipsRow** (`FilterChipsRow.tsx`): slim chip row at `--radius-sm` with per-chip remove (`.btn-ghost` ×), `Clear all` at ≥ 2 chips, `Showing N of M results` — **no animation library**, hover = background fade only (Pitfall 8). ActiveFiltersBar left untouched.
- **DisplayPopover** (`DisplayPopover.tsx`): config-gated Group by / Sort by / Display properties / Reset sections (surface-3, 1px hairlines). Group by renders only working options (no dead stubs, Pitfall 6); Display properties omitted below 2 entries (Open Q3); accent only on checked/toggled states; all state controlled via `useListControls` handlers passed as props.

## Task Commits

Each task committed atomically:

1. **Task 1: list-controls i18n namespace + useListControls URL-state hook** — `d4092e80` (feat, TDD)
2. **Task 2: FilterPopover + FilterChipsRow + useFacetCounts** — `c6db81a9` (feat)
3. **Task 3: DisplayPopover (group by / sort by / display properties / reset)** — `0db7534e` (feat)

## Files Created/Modified

- `components/list-controls/useListControls.ts` — URL-param engine + `parseListControlsSearch` whitelist + config types (created)
- `components/list-controls/useFacetCounts.ts` — enabled-gated per-option head-count queries (created)
- `components/list-controls/FilterPopover.tsx` — filter builder popover, live counts, immediate apply (created)
- `components/list-controls/FilterChipsRow.tsx` — Linear-native chip row (created)
- `components/list-controls/DisplayPopover.tsx` — group/sort/properties/reset popover (created)
- `components/list-controls/__tests__/useListControls.test.ts` — 7 cases: parse whitelist, setFilter+page:1, clearAll, toggleProperty round-trip, resetDisplay, count (created)
- `components/list-controls/__tests__/FilterPopover.test.tsx` — 3 cases: counts gated on open, immediate apply, `Filter · 2` trigger (created)
- `components/list-controls/__tests__/DisplayPopover.test.tsx` — 4 cases: properties gate, grouping gate, reset once, toggle (created)
- `i18n/en/list-controls.json`, `i18n/ar/list-controls.json` — F24 copy contract (created)
- `i18n/index.ts` — `list-controls` namespace registered (imports + en/ar resources)

## Decisions Made

- **AFF-02 stays Pending (foundation-only):** this plan ships the surface-agnostic kit; Wave-2 (87-06..09) mounts the popovers + wires route search on the nine core surfaces. Marking AFF-02 complete now would be dishonest — mirrors the 87-01/AFF-01 treatment.
- **Compose useActiveFilters, don't reimplement:** `useListControls` composes it for chip derive/remove/clear; `FilterChipsRow` is presentational. The `clear-all`/`showing` copy reuses the `active-filters` namespace — no duplicate keys.
- **Override the wrapper, not the shared file:** the Phase-87 `--surface-3`/no-shadow contract is applied via `className="bg-surface-3 shadow-none"` (tailwind-merge last-wins); `ui/popover.tsx` is untouched so other consumers keep the raised default (PATTERNS correction).
- **Optional controlled `open`** on both popovers keeps behavior deterministically testable (facet-count gating, section rendering) without simulating Radix pointer events.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0. **Impact:** none — all three tasks landed as specified.

## Verification

- `pnpm --dir frontend exec vitest run src/components/list-controls` — **3 files / 14 tests pass** (Wave-0 `__tests__/` gap closed).
- `pnpm --dir frontend exec tsc --noEmit` — **exit 0**.
- `pnpm --dir frontend lint` — **exit 0** (eslint `--max-warnings 0` + i18n namespace guard + duplicate-rtl + bootstrap parity + date-format guard all green; en/ar parity 13/13; no physical properties; no palette literals; no animation library in list-controls).
- Acceptance greps: `bg-surface-3 shadow-none` present in FilterPopover; no `framer-motion`/`motion.`; `list-controls` registration count 5 (≥ 4).

## Self-Check: PASSED

- All 8 created files + 1 modified exist on disk.
- `git log --oneline --grep="87-02"` returns 3 task commits (`d4092e80`, `c6db81a9`, `0db7534e`).
- All task `<acceptance_criteria>` re-run and pass; plan `<verification>` commands re-run green (vitest 14/14, tsc 0, lint 0).

## Next Phase Readiness

Ready for **87-03** (next F25/F26 or Wave-2 plan). The F24 kit is complete and surface-agnostic; a Wave-2 plan can mount both popovers on any surface with only a `ListControlsConfig` + route search wiring (`parseListControlsSearch` in `validateSearch`, `useListControls` in the component). No blockers.
