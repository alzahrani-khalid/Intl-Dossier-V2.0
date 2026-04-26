---
phase: 40-list-pages
plan: 08
subsystem: list-pages
tags: [route, list-page, working-groups, LIST-03]
requires:
  - '@/components/list-page (ListPageShell, GenericListPage, GenericListSkeleton)'
  - '@/hooks/useWorkingGroups'
  - '@/lib/dossier-routes (getDossierRouteSegment)'
  - '@/components/signature-visuals (DossierGlyph)'
  - '@/hooks/useDirection'
provides:
  - 'WorkingGroupsListPage (named export, testable inner component)'
  - 'WorkingGroupsListPageRoute (file-route component)'
  - 'WG_STATUS_TONE chip-class map'
  - 'Route export at /_protected/dossiers/working_groups/'
affects:
  - 'frontend/src/routes/_protected/dossiers/working_groups/index.tsx'
  - 'frontend/src/routes/_protected/dossiers/working_groups/__tests__/WorkingGroupsListPage.test.tsx'
tech-stack:
  added: []
  patterns:
    - 'Phase 40 list-page primitives (ListPageShell + GenericListPage)'
    - 'TanStack Router file-route + validateSearch'
    - 'Inner-component-export pattern for direct render-tests (avoids mocking Route.useSearch)'
key-files:
  created:
    - 'frontend/src/routes/_protected/dossiers/working_groups/__tests__/WorkingGroupsListPage.test.tsx'
  modified:
    - 'frontend/src/routes/_protected/dossiers/working_groups/index.tsx'
decisions:
  - 'Route segment is "working_groups" (underscore), per source-of-truth `dossier-routes.ts` DOSSIER_TYPE_TO_ROUTE — plan claim of hyphenated "working-groups" was inaccurate; called via `getDossierRouteSegment(''working_group'')`'
  - 'Status tone map locked: active -> chip-ok, completed -> chip-info, on_hold -> chip-warn (matches existing CSS classes in `frontend/src/styles/list-pages.css`)'
  - 'Inner `WorkingGroupsListPage` exported alongside route component to enable render-tests without mocking the file-route bound `Route.useSearch()`'
  - 'No icon-flip class on chevron — existing `GenericListPage.tsx` uses `rotate-180` (RTL); test asserts component shape, not plan-spec which would have failed against current primitive'
metrics:
  duration: '~25 min'
  completed: '2026-04-25'
  tasks: 1
  files: 2
  tests: '5/5 passing'
---

# Phase 40 Plan 08: Working groups list page Summary

Replaced the legacy `useDossiersByType('working_group')` list with the new Phase 40 primitives: `ListPageShell` chrome + `GenericListPage` rows + `useWorkingGroups`. LIST-03 covered for working groups.

## What Changed

### Route component (`frontend/src/routes/_protected/dossiers/working_groups/index.tsx`)

- Replaced 269-line legacy body with 121-line composition over Phase 40 primitives
- Imports from `@/components/list-page` barrel (`ListPageShell`, `GenericListPage`, `GenericListSkeleton`, `GenericListPageItem`)
- Hook: `useWorkingGroups({ search, page, limit: 20 })` — Supabase RPC pattern
- Glyph: `<DossierGlyph type="working_group" />` per row (resolves to initials fallback per Phase 37 spec)
- Translation namespaces: `useTranslation(['working-groups', 'list-pages'])` — matches locale file `working-groups.json`
- Status chip mapping (`WG_STATUS_TONE`):
  - `active` → `chip-ok` (green)
  - `completed` → `chip-info` (blue)
  - `on_hold` → `chip-warn` (amber)
  - default fallback → `chip-default`
- Empty state: localized 'No working groups yet' + description from `working-groups.json`
- Loading: `<GenericListSkeleton rows={6} />`
- Click target: `/dossiers/${getDossierRouteSegment('working_group')}/${id}` → resolves to `/dossiers/working_groups/${id}`
- Architecture split:
  - `WorkingGroupsListPage` (named export) — pure component taking `{ page, search, onItemNavigate }`
  - `WorkingGroupsListPageRoute` (internal) — wires `Route.useSearch()` + `useNavigate` to the inner component

### Test (`__tests__/WorkingGroupsListPage.test.tsx`)

5 tests, all passing:

1. **Title visible** — `'Working Groups'` rendered
2. **Row count + chip mapping** — 2 `<li>` rows; `AI Ethics WG` row has `chip-ok`; `Trade Sanctions WG` row has `chip-warn`
3. **Glyph type** — every row has `data-testid="glyph-working_group"`
4. **Click navigation** — `fireEvent.click` on row 0 invokes `onItemNavigate('wg1')`
5. **Touch target** — every row has `style.minHeight === '44px'`

Per-file mocks: `react-i18next` (with key→string map), `@/hooks/useDirection` (`isRTL: false`), `@/hooks/useWorkingGroups` (2-row fixture), `@/components/signature-visuals` (DossierGlyph stub).

## Acceptance Criteria

| Criterion | Status |
| --- | --- |
| File at expected route path | PASS — `createFileRoute('/_protected/dossiers/working_groups/')` (1 match) |
| `GenericListPage`/`useWorkingGroups`/`ListPageShell` references ≥3 | PASS — 11 matches |
| `getDossierRouteSegment` or hyphenated link ≥1 | PASS — 4 matches |
| Zero physical RTL classes (`ml-/mr-/pl-/pr-/text-left/text-right/rounded-l-/rounded-r-`) | PASS — 0 matches |
| Zero `any` (`: any`/`as any`/`<any>`) | PASS — 0 matches |
| Vitest passes | PASS — 5/5 in 694ms |

## Deviations from Plan

### [Rule 1 - Bug] Plan-spec test would fail against actual `GenericListPage`

- **Found during:** Test authoring
- **Issue:** Plan asks test to assert chevron has class `icon-flip`. Actual `GenericListPage.tsx` (line 129) uses `rotate-180` for RTL chevron, not `icon-flip`. The CSS class `icon-flip` exists in `list-pages.css` but is unused by the primitive. Asserting `icon-flip` would always fail.
- **Fix:** Test was rewritten to assert what the component actually renders. The 5 tests verify functionality (title, row count, status chips, glyph type, click navigation, touch target). Chevron RTL flip is exercised by `GenericListPage`'s own tests, so this page-level test does not duplicate that.
- **Files modified:** `frontend/src/routes/_protected/dossiers/working_groups/__tests__/WorkingGroupsListPage.test.tsx`
- **Commit:** `3f4dd098`

### [Rule 1 - Bug] Plan claim of hyphenated route segment is inaccurate

- **Found during:** Reading `frontend/src/lib/dossier-routes.ts`
- **Issue:** Plan repeatedly states `getDossierRouteSegment('working_group')` returns `'working-groups'` (hyphen). Source of truth (`DOSSIER_TYPE_TO_ROUTE` map) returns `'working_groups'` (underscore).
- **Fix:** Implementation calls `getDossierRouteSegment('working_group')` and lets the helper produce the actual segment. The route directory `working_groups/` (filesystem) and the click target match (`/dossiers/working_groups/$id`).
- **Files modified:** `frontend/src/routes/_protected/dossiers/working_groups/index.tsx`
- **Commit:** `3f4dd098`

### [Rule 3 - Blocker fix] Inner-component-export pattern for testability

- **Found during:** Test setup
- **Issue:** The plan's test mocks `useWorkingGroups` and `useDirection` but not `Route.useSearch()`/`useNavigate` from TanStack Router. Calling those outside an `<Outlet>` throws.
- **Fix:** Refactored the page into two components — `WorkingGroupsListPage` (pure, takes `{ page, search, onItemNavigate }`, named export for tests) and `WorkingGroupsListPageRoute` (route wrapper that wires router hooks). Test renders the pure inner component directly.
- **Files modified:** `frontend/src/routes/_protected/dossiers/working_groups/index.tsx`
- **Commit:** `3f4dd098`

## Self-Check: PASSED

- File `frontend/src/routes/_protected/dossiers/working_groups/index.tsx` exists — FOUND
- File `frontend/src/routes/_protected/dossiers/working_groups/__tests__/WorkingGroupsListPage.test.tsx` exists — FOUND
- Commit `3f4dd098` exists in `git log` — FOUND
- Vitest run on the test file: 5/5 PASS
