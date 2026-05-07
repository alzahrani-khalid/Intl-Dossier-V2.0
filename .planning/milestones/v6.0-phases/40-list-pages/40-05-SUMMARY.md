---
phase: 40-list-pages
plan: 05
subsystem: frontend.routes.dossiers.persons
tags: [list-page, persons, vip-chip, list-02]
requires:
  - '@/components/list-page (ListPageShell, PersonsGrid, ToolbarSearch, PersonCard)'
  - '@/hooks/usePersons (re-export of @/domains/persons.usePersons)'
  - '@/hooks/useDirection'
  - '@/hooks/useDebouncedValue'
provides:
  - 'frontend/src/routes/_protected/dossiers/persons/index.tsx (Route + default PersonsListPage)'
affects:
  - '/dossiers/persons URL — replaced legacy DossiersByType table with unified card grid'
tech-stack:
  added: []
  patterns:
    - 'Defensive list-shape extraction ({data} | {items} | T[])'
    - 'VIP-from-importance-level mapping (>=4)'
key-files:
  created:
    - frontend/src/routes/_protected/dossiers/persons/__tests__/index.test.tsx
  modified:
    - frontend/src/routes/_protected/dossiers/persons/index.tsx
decisions:
  - 'Mapped legacy file path: plan referenced frontend/src/pages/Persons/PersonsListPage.tsx (does not exist). Used the actual route file at frontend/src/routes/_protected/dossiers/persons/index.tsx, which already hosted the legacy inline component.'
  - 'VIP detection uses importance_level >= 4 (PersonListItem has no is_vip field; ImportanceLevel ∈ 1..5).'
  - 'PersonsGrid public API uses props {persons, onPersonClick} — not the {items, isRTL, t} shape sketched in plan; the component internally consumes useTranslation. Used the actual component API.'
  - 'Card click navigates to /dossiers/persons/$id via useNavigate (matches existing detail route at $id.tsx).'
metrics:
  duration: ~6m
  completed: '2026-04-25'
---

# Phase 40 Plan 05: Persons List Page Summary

Replaced the dossiers/persons route body with the unified `<ListPageShell>` + `<PersonsGrid>` pattern, driving cards from the existing `usePersons` TanStack Query hook. Mobile-first 1/2/3-col grid with 44px circular initial avatar, conditional VIP chip (importance_level ≥ 4), and role · organization meta. Search wired through ToolbarSearch with 250ms debounce.

## What Changed

- **Route file** (`frontend/src/routes/_protected/dossiers/persons/index.tsx`): replaced legacy `useDossiersByType` table/card hybrid (~340 LOC) with ~120 LOC composing list-page primitives.
- **Test** (`__tests__/index.test.tsx`): 4 assertions — title render, 2-card render with VIP conditional, 44px avatar geometry (`size-11 rounded-full`), empty state, array-shape data fallback.
- **Default export** preserved (`export default PersonsListPage`) — TanStack Router accepts the inline `Route.component` reference.

## Verification

```
$ vitest run src/routes/_protected/dossiers/persons/__tests__/index.test.tsx --reporter=dot
Test Files  1 passed (1)
Tests       4 passed (4)
```

Acceptance gates:

- `grep -E 'PersonsGrid|usePersons|ListPageShell' index.tsx` → 8 matches
- `grep -E 'ml-|mr-|pl-|pr-|text-left|text-right|rounded-l-|rounded-r-' index.tsx` → 0 matches
- `grep -E ': any|as any|<any>' index.tsx` → 0 matches

## usePersons Return Shape (Observed)

`usePersons(params?: PersonSearchParams)` returns standard TanStack `useQuery` shape. `data` resolves to `PersonListResponse` from `frontend/src/types/person.types.ts`:

```ts
interface PersonListResponse {
  data: PersonListItem[]
  pagination: { total, limit, offset, has_more }
}

interface PersonListItem {
  id, name_en, name_ar, title_en?, title_ar?, photo_url?,
  organization_id?, organization_name?, importance_level: 1..5, email?, phone?
}
```

The `extractList` helper handles `{data}`, `{items}`, and bare `T[]` — defensively guarding against future shape drift.

## Deviations from Plan

### Auto-fixed (deviation rules)

**1. [Rule 3 — Path Mismatch] Plan referenced non-existent file `frontend/src/pages/Persons/PersonsListPage.tsx`.**

- **Found during:** Task 1 setup
- **Issue:** Plan task action and `files_modified` frontmatter both pointed at `frontend/src/pages/Persons/PersonsListPage.tsx`, but no `frontend/src/pages/Persons/` directory exists. The user-facing prompt instead targeted `frontend/src/routes/_protected/dossiers/persons/index.tsx` — which already hosted the legacy inline `PersonsListPage` component. Re-pointed to the actual route file (matching the prompt and the running `/dossiers/persons` route).
- **Files modified:** `frontend/src/routes/_protected/dossiers/persons/index.tsx` (replace), `frontend/src/routes/_protected/dossiers/persons/__tests__/index.test.tsx` (new).
- **Commit:** 853ec333

**2. [Rule 1 — API Shape] PersonsGrid component API differs from plan.**

- **Issue:** Plan sketched `<PersonsGrid items={cards} isRTL={isRTL} t={t} />`, but the Wave 0 component (`frontend/src/components/list-page/PersonsGrid.tsx`) exposes `{persons, onPersonClick, isLoading, emptyState}`. The component internally calls `useTranslation` — passing `t`/`isRTL` would have been ignored.
- **Fix:** Used the actual component API — `<PersonsGrid persons={items} onPersonClick={handlePersonClick} />`. Loading + empty handled by ListPageShell's existing `isLoading`/`isEmpty`/`emptyState` slots so PersonsGrid only renders the populated grid.

**3. [Rule 2 — VIP Detection] Plan assumed `is_vip` field; PersonListItem has none.**

- **Issue:** Plan: `is_vip: p.is_vip === true`. Actual `PersonListItem` shape uses `importance_level: 1..5` (no `is_vip`). Returning `is_vip: false` for every card would have rendered no VIP chips, breaking LIST-02.
- **Fix:** Map `importance_level >= 4` → `is_vip: true` (high + critical levels). Also tolerate explicit `is_vip === true` for forward compatibility if the API ever surfaces it.

## Known Stubs

None.

## Self-Check: PASSED

- `[FOUND]` `frontend/src/routes/_protected/dossiers/persons/index.tsx`
- `[FOUND]` `frontend/src/routes/_protected/dossiers/persons/__tests__/index.test.tsx`
- `[FOUND]` commit `853ec333`
