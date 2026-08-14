---
phase: 87-linear-affordances
plan: 05
subsystem: ui
tags: [tanstack-router, url-state, validateSearch, list-pages, react]

# Dependency graph
requires:
  - phase: 87-linear-affordances
    provides: 87-PATTERNS assignment 5 — the countries validateSearch + navigate-reducer idiom the three bespoke surfaces copy
provides:
  - Persons list search lifted into validated URL params (dead validateSearch shell activated; -PersonsListPage made presentational)
  - Engagements list search + type filter lifted into validated URL params (shared validateEngagementsListSearch across both mounts; page made controlled)
  - Elected-officials list filters (search/office_type/term) + pagination lifted into validated URL params (ElectedOfficialListTable made controlled)
  - Uniform validateSearch + Route.useSearch/useNavigate-reducer seam on all three surfaces for 87-08 peek (F23) + filter/display popovers (F24) to hook into
affects: [87-08-peek-and-popovers, 87-09-kanban-normalization, 87-10-consolidated-signoff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Bespoke list surfaces copy the countries URL-state idiom: route owns validateSearch (whitelist per param) + Route.useSearch/useNavigate reducers (replace:true, page reset on filter change); the page/table is a controlled presentational consumer'
    - 'Shared URL-search contract exported from the page module (validateEngagementsListSearch) so a double-mounted route pair validates identically from one source'
    - 'type/office_type param whitelists are source-visible enumerations anchored to their union (satisfies guard / OFFICE_TYPES array), not bare typeof checks — unknown values coerce to undefined'

key-files:
  created: []
  modified:
    - frontend/src/routes/_protected/dossiers/persons/index.tsx
    - frontend/src/routes/_protected/dossiers/persons/-PersonsListPage.tsx
    - frontend/src/routes/_protected/dossiers/persons/__tests__/index.test.tsx
    - frontend/src/routes/_protected/dossiers/engagements/index.tsx
    - frontend/src/routes/_protected/engagements/index.tsx
    - frontend/src/pages/engagements/EngagementsListPage.tsx
    - frontend/src/pages/engagements/__tests__/EngagementsListPage.test.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/index.tsx
    - frontend/src/components/elected-officials/ElectedOfficialListTable.tsx

key-decisions:
  - 'Persons "debounce the URL write" resolved via ToolbarSearch''s built-in 300ms debounce (the onChange→URL write is already debounced); useDebouncedValue kept feeding the usePersons query — byte-identical timing to the prior double-debounce, and zero search useState (satisfies the hard no-search-useState acceptance gate)'
    - 'Engagements page controlled via props; both mounts (/dossiers/engagements + the intentional /engagements double-mount) share one validateEngagementsListSearch — the second mount was NOT in the plan file list but had to move too or the build would not compile (Rule 1 deviation)'
    - 'Elected-officials KEEPS PageHeader (no ListPageShell migration — planner decision in objective); table becomes controlled, sorting/enrichment/empty/error/loading branches untouched'
    - 'AFF-01/AFF-02 left Pending in REQUIREMENTS.md — this plan is the ENABLER slice only; the user-facing peek panel (F23) and filter/display popovers (F24) that those requirements describe land in 87-08'

patterns-established:
  - 'Controlled-table lift: internal useState/useCallback filter state moves to the route as URL params; the component gains onXChange props and reads filters from a prop (ElectedOfficialListTable)'
  - 'Presentational-page split: the route file becomes the stateful wrapper (Route.useSearch/useNavigate), the -Page file takes search/onSearchChange/onClick props (PersonsListPage)'

requirements-completed: []  # AFF-01/AFF-02 advanced (URL-state enabler only); feature completion is 87-08 — see Requirements note below

# Metrics
duration: 20 min
completed: 2026-07-07
---

# Phase 87 Plan 05: Bespoke list surfaces → URL-state idiom Summary

**Persons, engagements, and elected-officials lift their local `useState` filter/search state into validated TanStack Router URL params (the countries `validateSearch` + navigate-reducer idiom), with zero user-visible behavior change — the enabler seam 87-08 peek/popovers hook into.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-07T11:26Z (approx.)
- **Completed:** 2026-07-07T11:45Z
- **Tasks:** 3 completed
- **Files modified:** 9 (2 routes + 2 pages/tables + 2 tests for the named surfaces, plus the /engagements double-mount route)

## Accomplishments

### Task 1 — Persons (AFF-01 enabler)

- Activated the previously-dead `validateSearch` shell in `persons/index.tsx` ({page, search}) and moved the URL wiring into a `PersonsListRoute` wrapper (`Route.useSearch`/`Route.useNavigate`, reducer `replace:true` + `page:1` reset).
- `-PersonsListPage` became presentational: takes `search`/`onSearchChange`/`onPersonClick` props, no local `useState`. `useDebouncedValue(search, 250)` still debounces the `usePersons` query; `ToolbarSearch`'s internal 300ms debounce debounces the URL write.
- Existing route test updated mechanically (pass the three props). 4/4 green.

### Task 2 — Engagements (AFF-02 enabler)

- `EngagementsListPage` became controlled (`search`/`filter`/`onSearchChange`/`onFilterChange` props; both local `useState` removed). Row-click navigation (F23 territory) left untouched.
- A shared `validateEngagementsListSearch` + `EngagementsListSearch` type exported from the page; the `type` param is whitelist-validated against the non-`all` FilterPill values (`ENGAGEMENT_TYPE_VALUES` with a `satisfies EngagementTypeParam[]` drift guard). `all` clears the param.
- Both mounts — `/dossiers/engagements` and the intentional `/engagements` double-mount — wrap the page with `Route.useSearch`/`useNavigate` reducers over the shared validator.
- Test wraps the page in a stateful `Harness` mirroring the route; all 10 page cases + the 3 sibling workspace specs green (35/35 in `src/pages/engagements`).

### Task 3 — Elected officials (AFF-01 enabler)

- `ElectedOfficialListTable` became controlled: `filters` + 5 change handlers via props; internal `useState`/`useCallback` removed; sorting/enrichment/empty/error/loading branches untouched (empty branch explicitly not touched per plan).
- Route owns `validateSearch` whitelisting `page`/`search`/`office_type` (against the now-exported `OFFICE_TYPES`) + `term` (`current`|`expired` → `is_current_term`), with `Route.useSearch`/`useNavigate` reducers (`replace:true`, `page:1` reset on filter change). `filters` memoized on the primitives to keep a stable ref.
- `PageHeader` kept (no `ListPageShell` migration — planner decision). EO test file is `it.todo` only; unaffected.

## Verification

| Check                           | Command                                                                                                    | Result                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Named-surface suites            | `vitest run src/routes/_protected/dossiers/persons src/components/elected-officials src/pages/engagements` | **exit 0** — 39 passed \| 6 todo (5 files passed, 1 skipped)                             |
| Type-check                      | `tsc --noEmit`                                                                                             | **exit 0**                                                                               |
| Lint (repo, `--max-warnings 0`) | `pnpm --dir frontend lint --max-warnings 0`                                                                | **exit 0** — eslint + i18n + duplicate-rtl + bootstrap-parity + date-format gates all OK |

Acceptance criteria (all met):

- Persons: no search/filter `useState` in `-PersonsListPage.tsx`; `validateSearch` validates page(≥1) + search(non-empty→undefined); route tests exit 0.
- Engagements: no search/type-filter `useState` in `EngagementsListPage.tsx`; `type` whitelisted against the source-visible FilterPill value set; pill→filter behavior preserved (page test), URL wiring by the route wrapper + tsc.
- Elected-officials: `validateSearch` whitelists every prior-`useState` filter key (`office_type`, `term`↔`is_current_term`) + page/search; no filter `useState` in the route; table signature exposes the controlled props; tsc + lint exit 0.

## Deviations from Plan

**[Rule 1 — Missing critical] `/engagements` double-mount also required the controlled-page migration** — Found during: Task 2 tsc gate. Issue: `EngagementsListPage` is mounted at two routes (`_protected/dossiers/engagements/index.tsx` — named in the plan — AND `_protected/engagements/index.tsx`, the intentional double-mount per project memory). Making the page controlled broke `component: EngagementsListPage` at the second mount (`{}` props ≠ required props), so `tsc` failed. Fix: applied the identical route-wrapper + shared `validateEngagementsListSearch` to the second route; extracted the validator to the page module so both mounts validate from one source (no tampering-whitelist drift). Files modified: `frontend/src/routes/_protected/engagements/index.tsx` (+ the shared validator export in `EngagementsListPage.tsx`). Verification: tsc exit 0, `src/pages/engagements` 35/35 green.

**Total deviations:** 1 auto-fixed (1× Rule 1 missing-critical consumer). **Impact:** none on scope — both engagement mounts now share one URL-state contract, which is strictly better than the plan's single-file assumption; behavior identical for users.

### Interpretation note (not a deviation)

- Persons "debounce the URL write" (plan `<action>` prose) vs "no search/filter useState" (hard acceptance gate) were reconciled by leaning on `ToolbarSearch`'s existing 300ms internal debounce for the URL write and keeping `useDebouncedValue` for the query. Net timing is byte-identical to the prior behavior and no search `useState` remains. A local input buffer (the only way to debounce the write with a separate state) would have violated the acceptance gate.

## Requirements

- **AFF-01 (F23 right-peek panel)** and **AFF-02 (F24 filter/display popovers)** remain **Pending** in `.planning/REQUIREMENTS.md`. This plan is the enabler slice its own objective describes ("plan 87-08 wires the features on top of these seams"); it delivers only the URL-driven, route-validated state those features require, not the peek panel or the popovers. Marking them complete here would misreport user-facing capability that does not yet exist. `requirements-completed` is intentionally empty.

## Next Phase Readiness

- Ready for **87-06 / 87-07** (per phase plan order). The three bespoke surfaces + the 5 uniform routes now share one `validateSearch` + navigate-reducer idiom, so **87-08** can register peek (`register({ ids, type, total, pageOffset })`) and mount Filter/Display popovers uniformly against a stable URL-param source. Kanban's equivalent normalization stays in **87-09**.
- No blockers. No schema/i18n/token changes in this plan (pure state relocation).

## Self-Check: PASSED

- `key-files.modified` all exist on disk (9 files) and are committed.
- `git log --grep="87-05"` → 3 production commits (5b7ea4e4 persons, e0544408 engagements, c1528f45 elected-officials).
- All `<acceptance_criteria>` re-run and pass (see Verification).
- Plan-level `<verification>` re-run: vitest exit 0, tsc exit 0, lint exit 0.
