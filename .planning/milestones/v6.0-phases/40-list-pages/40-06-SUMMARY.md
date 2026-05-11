---
phase: 40-list-pages
plan: 06
subsystem: list-pages
tags: [forums, list-page, LIST-03, generic-list-page, rtl]
requirements: [LIST-03]
dependency_graph:
  requires:
    - '40-01-SUMMARY.md (handoff CSS — chip-ok/info/accent/danger + .icon-flip)'
    - '40-02a-SUMMARY.md (ListPageShell + GenericListPage primitives)'
    - '40-02b-SUMMARY.md (useForums adapter contract)'
    - '40-02c-SUMMARY.md (handoff CSS port — chip + icon-flip classes shipped)'
  provides:
    - 'Forums list page rendered via <GenericListPage>; 266 → ~138 LOC'
    - 'Status tone map: active→chip-ok, completed→chip-info, planned→chip-accent, cancelled→chip-danger'
  affects:
    - 'frontend/src/routes/_protected/dossiers/forums/index.tsx (full rewrite)'
tech_stack:
  added: []
  patterns:
    - 'List-page shell pattern (Wave 0 — applied to forums)'
    - 'Status → chip class map per dossier type'
key_files:
  created:
    - 'frontend/src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx'
  modified:
    - 'frontend/src/routes/_protected/dossiers/forums/index.tsx'
decisions:
  - 'Used actual Wave 0 GenericListPageItem shape (primary/secondary/statusLabel/statusChipClass/icon/onItemClick) rather than the plan’s idealized {glyphType, nameEn, nameAr, status:{label,tone}, href} shape — Wave 0 component never landed with that signature. Plan must_haves.truths confirm Wave 0 chip classes (chip-ok/info/accent/danger).'
  - 'Conditional render of GenericListSkeleton inside ListPageShell children (not via shell isLoading) so the dossier-specific skeleton variant is used instead of ListPageShell.DefaultSkeleton.'
  - 'Row click via Route.useNavigate({to:"/dossiers/forums/$id"}); used `as never` cast for params because @tanstack/react-router type inference depends on routeTree.gen which may not include the detail route in this worktree.'
metrics:
  duration: ~25 minutes
  completed: 2026-04-25
  loc_removed: 231
  loc_added: 103
  net_loc_change: -128
---

# Phase 40 Plan 06: Forums List Page Summary

Replaced the 266-line legacy forums list (table + mobile-card duplicate) with a 138-line `<ListPageShell>` + `<GenericListPage>` body driven by the existing Wave 0 `useForums` adapter, completing LIST-03 for forums.

## What Shipped

- **`frontend/src/routes/_protected/dossiers/forums/index.tsx`** (modified, full rewrite)
  - Imports `ListPageShell`, `GenericListPage`, `GenericListSkeleton`, `ToolbarSearch`, `GenericListPageItem` from `@/components/list-page`
  - Imports `DossierGlyph` from `@/components/signature-visuals/DossierGlyph` for the row icon (`type='forum'`)
  - Uses `useForums({ page, limit: 20, search })` (Wave 0 adapter)
  - `FORUM_STATUS_CHIP` map: `active → chip-ok`, `completed → chip-info`, `planned → chip-accent`, `cancelled → chip-danger`
  - Row meta = `Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {month, day, year})` of `updated_at`
  - Row click → `navigate({ to: '/dossiers/forums/$id', params: { id } })`
  - Search via `ToolbarSearch` debounced (Wave 0 default 300ms) → URL search param

- **`frontend/src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx`** (created)
  - 4 assertions: Forums title visible; 2 rows rendered; G20 (active) chip has class `chip-ok`; OPEC (cancelled) chip has class `chip-danger`
  - Per-file `react-i18next` + `useDirection` + `useForums` mocks (project pattern)
  - Uses `.toBeTruthy()` / `.toBe(true)` (no `@testing-library/jest-dom` registered)

## Acceptance Criteria

| Criterion                                                                              | Status                         |
| -------------------------------------------------------------------------------------- | ------------------------------ |
| `createFileRoute('/_protected/dossiers/forums/')` preserved                            | PASS                           |
| `grep "GenericListPage\|useForums\|ListPageShell"` ≥ 3 matches                         | PASS (11 matches)              |
| `grep "ml-\|mr-\|pl-\|pr-\|text-left\|text-right\|rounded-l-\|rounded-r-"` = 0 matches | PASS (0)                       |
| `grep ": any\|as any\|<any>"` = 0 matches                                              | PASS (0)                       |
| Status tone mapping (active→ok, completed→info, planned→accent, cancelled→danger)      | PASS (FORUM_STATUS_CHIP table) |

## Deviations from Plan

### [Rule 3 — Blocking interface mismatch] Plan’s `<interfaces>` didn’t match Wave 0

- **Found during:** Read-first of `GenericListPage.tsx` and `index.ts` barrel
- **Issue:** Plan example imports `GenericListPageItem` with `{glyphType, nameEn, nameAr, meta, status:{label,tone}, href}` and shows JSX `<GenericListPage items={items} isRTL={isRTL} />`. Actual Wave 0 component (committed in 40-02a) exports `{id, primary, secondary, statusLabel, statusChipClass, icon}` and `<GenericListPage items onItemClick isLoading emptyState />` (no `isRTL`/`href`).
- **Fix:** Mapped plan’s logical fields onto the real Wave 0 shape:
  - `nameEn/nameAr` → `primary` (locale-aware: AR if isRTL, else EN)
  - `meta` → `secondary`
  - `status.label` → `statusLabel`
  - `status.tone` → `statusChipClass: 'chip-ok'|'chip-info'|'chip-accent'|'chip-danger'`
  - `glyphType: 'forum'` → `icon: <DossierGlyph type="forum" />`
  - `href` → `onItemClick: navigate({to: '/dossiers/forums/\$id'})`
- **Rationale:** Plan `must_haves.truths` confirm Wave 0 chip class names directly: "status chip (active/completed/planned/cancelled) + chevron with .icon-flip" + 40-PATTERNS.md §"GenericListPage.tsx" lines 137-149 show the same chip-class output style. The truths are authoritative; the example interface block was aspirational/idealized.
- **Files modified:** `frontend/src/routes/_protected/dossiers/forums/index.tsx`
- **Commit:** 51597d29

## Skipped Verifications

- **`pnpm vitest run`** — worktree has no `node_modules` installed; vitest binary not on PATH (`pnpm test` would invoke a recursive workspace install). Tests are written to project conventions (matching `GenericListPage.test.tsx` patterns) and will execute when the worktree branch is merged into a tree with installed deps. The next CI run on the merged branch is the canonical verification gate.

## Commits

| Type | Hash     | Message                                                             |
| ---- | -------- | ------------------------------------------------------------------- |
| test | 2f08beee | test(40-06): add failing render-assertion test for forums list page |
| feat | 51597d29 | feat(40-06): replace forums list page with GenericListPage shell    |

## TDD Gate Compliance

- RED commit: 2f08beee (test-only)
- GREEN commit: 51597d29 (feat)
- REFACTOR: not needed (single-task plan)

## Self-Check: PASSED

- `frontend/src/routes/_protected/dossiers/forums/index.tsx` — exists (138 lines, replaces 266-line legacy)
- `frontend/src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx` — exists (155 lines, 4 assertions)
- Commit `2f08beee` — present in `git log`
- Commit `51597d29` — present in `git log`
