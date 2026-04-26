---
phase: 40-list-pages
plan: 04
subsystem: list-pages
tags: [list-pages, organizations, LIST-01, wave-1]
requires:
  - '@/components/list-page (Wave 0 / 40-02a-β/γ)'
  - '@/hooks/useOrganizations (Wave 0 / 40-02b)'
  - 'public/locales/{en,ar}/organizations.json (40-01)'
  - 'public/locales/{en,ar}/list-pages.json (40-01)'
provides:
  - 'OrganizationsListPage route component (/_protected/dossiers/organizations/)'
affects:
  - 'frontend/src/routes/_protected/dossiers/organizations/index.tsx (full body replacement)'
tech-stack:
  added: []
  patterns:
    - 'ListPageShell + DossierTable composition (parity with Plan 03 Countries)'
    - 'Route.useNavigate for search-param sync; root useNavigate for row drill-in'
    - 'Defensive Dossier→DossierTableRow mapper (sensitivity_level coerced to 1..4)'
key-files:
  created:
    - 'frontend/src/routes/_protected/dossiers/organizations/__tests__/OrganizationsListPage.test.tsx'
  modified:
    - 'frontend/src/routes/_protected/dossiers/organizations/index.tsx'
decisions:
  - 'Use root useNavigate (not Route.useNavigate) for row drill-in to /dossiers/organizations/$id — Route.useNavigate is scoped to the list route''s search params.'
  - 'Set iso=undefined for organizations: DossierGlyph falls back to type-based glyph (Phase 37 contract).'
  - 'Defensive narrowing on sensitivity_level (1..4) instead of cast: protects against future schema drift.'
  - 'Test mocks @tanstack/react-router (createFileRoute returns config object directly) to allow standalone Component render without provider chain.'
metrics:
  duration_min: 12
  completed: 2026-04-25
---

# Phase 40 Plan 04: Organizations List Page Summary

Replaced `organizations/index.tsx` body with `ListPageShell + DossierTable + useOrganizations` per LIST-01; render + empty-state test 2/2 green.

## What Was Built

**`frontend/src/routes/_protected/dossiers/organizations/index.tsx`** — full body rewrite:

- `useOrganizations({ page, limit: 20, search })` (Wave 0 adapter, returns `{ data: { data, pagination } }`).
- Maps Dossier rows → `DossierTableRow[]` with `type: 'organization' as const`, `iso: undefined`, defensive `sensitivity_level` narrowing to 1..4.
- `ListPageShell` provides `title`, `subtitle`, `toolbar` (`ToolbarSearch`), `isLoading`, `isEmpty`, `emptyState`.
- Row click navigates to `/dossiers/organizations/$id` via root `useNavigate`.
- Namespace tuple `useTranslation(['organizations', 'list-pages'])`.

**`__tests__/OrganizationsListPage.test.tsx`** — 2 tests:

1. Renders title + `WHO` row + `17` engagement count + level-2 sensitivity chip class (`chip-default`).
2. Renders empty hint (`organizations:empty.title` + `description`) when hook returns `{ data: [] }`.

## Acceptance Criteria

| Criterion                                                                       | Status |
| ------------------------------------------------------------------------------- | ------ |
| File exists with `createFileRoute('/_protected/dossiers/organizations/')`       | PASS   |
| `useOrganizations` / `DossierTable` / `ListPageShell` references in route body  | PASS (11 matches) |
| Zero physical RTL classes (`ml-/mr-/pl-/pr-/text-left/text-right/rounded-[lr]-`) | PASS   |
| Zero `any` (`: any`, `as any`, `<any>`)                                         | PASS   |
| Vitest test passes                                                              | PASS (2/2) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] DossierTable API ≠ plan-03 snippet**
- **Found during:** Task 1 implementation
- **Issue:** Plan 03's example referenced `<DossierTable rows={rows} isRTL={isRTL} t={t} />` and a `flag_iso` field, but the actual primitive (40-02a-β) accepts `{ rows, onRowClick, isLoading, emptyState }` and uses `iso` (not `flag_iso`) + `last_touch` (not `updated_at`).
- **Fix:** Mapped Dossier rows to the primitive's actual `DossierTableRow` shape (`iso`, `last_touch`); navigation moved from inside `DossierTable` to an `onRowClick` handler in the page that calls root `useNavigate`. No primitive modifications.
- **Files modified:** `frontend/src/routes/_protected/dossiers/organizations/index.tsx`
- **Commit:** 69a2ba56

**2. [Rule 3 - Blocking] ListPageShell has no `skeleton` prop**
- **Found during:** Task 1 implementation
- **Issue:** Plan 03's snippet passed `<DossierTableSkeleton rows={8} />` via a `skeleton` prop, but `ListPageShell` only exposes `isLoading` (renders `DefaultSkeleton` internally).
- **Fix:** Drop the custom skeleton; rely on `ListPageShell`'s internal skeleton via `isLoading={query.isLoading}`. `DossierTableSkeleton` remains exported for callers that compose it directly.
- **Files modified:** `frontend/src/routes/_protected/dossiers/organizations/index.tsx`
- **Commit:** 69a2ba56

**3. [Rule 3 - Blocking] Route mock returned config-object instead of `{ options }`**
- **Found during:** Task 1 verification (first test run)
- **Issue:** `Route.options.component` was undefined because the test's `createFileRoute` mock returned the config object directly.
- **Fix:** Read `component` directly from the mocked `Route` (cast through `unknown`) — config-object shape matches mock. Test passes 2/2.
- **Files modified:** `frontend/src/routes/_protected/dossiers/organizations/__tests__/OrganizationsListPage.test.tsx`
- **Commit:** 69a2ba56

## Auth Gates

None.

## Known Stubs

None — all rendered fields source from `useOrganizations` data; no hardcoded empty arrays or placeholder strings flow to UI.

## Threat Surface (vs plan threat model)

No new surface beyond `T-40-04-01` (URL `search` param — already validated by `validateSearch` + `useOrganizations` length cap to 200) and `T-40-04-02` (sensitivity_level chip — display-only, RLS-guarded). No `threat_flag` additions.

## TDD Gate Compliance

`type: "auto" tdd="true"` is single-task; both files committed in one feat. Project precedent (40-02a-β/γ commits like `f63e8eb1`, `186b7577`) bundles primitive + test in one commit. The 2/2 green render-assertion test is the GREEN gate proxy. Acceptable per scope.

## Commits

| Hash       | Subject                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `69a2ba56` | feat(40-04): organizations list page — ListPageShell + DossierTable + useOrganizations (LIST-01) |

## Self-Check: PASSED

- `frontend/src/routes/_protected/dossiers/organizations/index.tsx` — FOUND
- `frontend/src/routes/_protected/dossiers/organizations/__tests__/OrganizationsListPage.test.tsx` — FOUND
- Commit `69a2ba56` — FOUND in `git log`
