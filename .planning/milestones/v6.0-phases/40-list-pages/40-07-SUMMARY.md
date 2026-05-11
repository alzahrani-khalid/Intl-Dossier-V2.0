---
phase: 40-list-pages
plan: 07
subsystem: list-pages/topics
tags: [list-page, topics, dossiers, tdd]
requires: [40-01, 40-02a, 40-02b, 40-02c]
provides: [LIST-03/topics, useTopics-list-hook]
affects:
  - frontend/src/hooks/useTopics.ts
  - frontend/src/routes/_protected/dossiers/topics/index.tsx
  - frontend/src/routes/_protected/dossiers/topics/__tests__/TopicsListPage.test.tsx
tech-stack:
  added: []
  patterns: [ListPageShell + GenericListPage adapter, runtime list-shape extraction]
key-files:
  created:
    - frontend/src/routes/_protected/dossiers/topics/__tests__/TopicsListPage.test.tsx
  modified:
    - frontend/src/hooks/useTopics.ts
    - frontend/src/routes/_protected/dossiers/topics/index.tsx
decisions:
  - "Added useTopics list-hook shim wrapping useDossiersByType('topic') because it did not exist in @/domains/topics — only useTopicSubtopics was exported"
  - 'Adapted plan to actual GenericListPage API (primary/secondary/statusChipClass/icon/onItemClick) rather than the plan-described shape (nameEn/nameAr/glyphType/status.tone/href)'
  - 'Status tone map: active→chip-ok, archived→chip-info, draft→chip-warn (default→chip-info)'
metrics:
  duration: ~10min
  completed: 2026-04-25
---

# Phase 40 Plan 07: Topics List Page Summary

LIST-03 covered for topics: `/dossiers/topics` now renders `<ListPageShell>` + `<GenericListPage>` driven by a new `useTopics` list-hook adapter.

## What was built

- `frontend/src/hooks/useTopics.ts` — added named export `useTopics(params)` that wraps `useDossiersByType('topic', page, limit)` and returns the standard TanStack `UseQueryResult` whose `data` carries `{ data: Topic[], total? }`. The previous `topicKeys` / `useTopicSubtopics` re-exports are preserved.
- `frontend/src/routes/_protected/dossiers/topics/index.tsx` — replaced the 266-line legacy `useDossiersByType` + Table + cards body with `<ListPageShell>` + `<GenericListPage>` + `<ToolbarSearch>`. Items map to `{ id, primary, secondary (formatted updated_at), statusLabel, statusChipClass, icon: <BookOpen /> }`. Row click navigates to `/dossiers/topics/$id`. RTL primary picks `name_ar`; date formatter uses `ar-SA` vs `en-US` locale.
- `frontend/src/routes/_protected/dossiers/topics/__tests__/TopicsListPage.test.tsx` — render-assertion test mocking `@/hooks/useTopics` + `@/hooks/useDirection` + `@tanstack/react-router`. Asserts page title, 2 row `<li>`s, chip class `chip-ok` on the active row, chip class `chip-warn` on the draft row, and chevron presence.

## Status chip mapping (topics)

| Status   | Class       |
| -------- | ----------- |
| active   | `chip-ok`   |
| archived | `chip-info` |
| draft    | `chip-warn` |
| default  | `chip-info` |

## useTopics return shape (encountered)

The new hook returns the standard TanStack `UseQueryResult<{ data: Array<Record<string, unknown>>; total?: number }, Error>`. The list page still uses the runtime list-extraction guard from plan 05 (handles `Topic[]`, `{ items }`, `{ data }`) for forward-compatibility if `@/domains/topics` later gains its own canonical list hook.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `useTopics` list hook did not exist**

- **Found during:** Task 1 (read-first checks)
- **Issue:** Plan instructs `import { useTopics } from '@/hooks/useTopics'`, but `@/hooks/useTopics` was a re-export shim exposing only `topicKeys` and `useTopicSubtopics` — there was no list-hook in `@/domains/topics`. Importing `useTopics` would fail.
- **Fix:** Added a new named export `useTopics(params)` in `@/hooks/useTopics.ts` that wraps the existing `useDossiersByType('topic', page, limit)` and returns the standard `UseQueryResult`. This matches the plan's `useTopics({ page, limit, search })` call shape (search param accepted but currently passed through unchanged — `useDossiersByType` does not yet support server-side search; client filtering happens in the component if desired in a follow-up).
- **Files modified:** `frontend/src/hooks/useTopics.ts`
- **Commit:** e1801ca1

**2. [Rule 1 - Bug] Plan's GenericListPageItem shape did not match actual component API**

- **Found during:** Task 1 (read-first of `GenericListPage.tsx`)
- **Issue:** Plan 06 (referenced as the analog) describes `GenericListPageItem` as `{ glyphType, nameEn, nameAr, meta, status: { label, tone }, href }` and assumes `<GenericListPage isRTL={...}>` and `chip-ok|chip-warn|chip-info|chip-accent|chip-danger` plus an `icon-flip` chevron class. The actual implementation of `GenericListPage` in `@/components/list-page` (Wave 0 final) uses `{ id, primary, secondary, statusLabel, statusChipClass, icon }` with `onItemClick` (no `href`), reads RTL from `useTranslation` internally (no `isRTL` prop), uses `rotate-180` (no `icon-flip` class), and passes `statusChipClass` straight through.
- **Fix:** Adapted the implementation to the real API while preserving plan intent: `chip-ok / chip-info / chip-warn` are valid (consistent with `sensitivity.ts`); `<BookOpen>` icon stands in for `glyphType: 'topic'`; `onItemClick` performs the navigation that `href` would have. Test was written against the real component (`generic-list-page-row` / `generic-list-page-status` testids).
- **Files modified:** `frontend/src/routes/_protected/dossiers/topics/index.tsx`, `frontend/src/routes/_protected/dossiers/topics/__tests__/TopicsListPage.test.tsx`
- **Commit:** 00349700, e1801ca1

## Acceptance criteria

- [x] File exists with `createFileRoute('/_protected/dossiers/topics/')`
- [x] `grep -c "GenericListPage|useTopics|ListPageShell"` returns 11 (≥ 3)
- [x] `grep -nE "ml-|mr-|pl-|pr-|text-left|text-right|rounded-l-|rounded-r-"` returns 0 matches
- [x] `grep -nE ": any|as any|<any>"` returns 0 matches
- [x] Vitest passes (1 test, 1 file)

## Threat surface

No new surface — uses existing RLS-enforced `useDossiersByType('topic')` path. `validateSearch` continues to coerce URL params. No new endpoints, schema changes, or auth paths.

## Self-Check: PASSED

- FOUND: `frontend/src/routes/_protected/dossiers/topics/index.tsx`
- FOUND: `frontend/src/hooks/useTopics.ts` (with new `useTopics` export)
- FOUND: `frontend/src/routes/_protected/dossiers/topics/__tests__/TopicsListPage.test.tsx`
- FOUND: commit `00349700` (RED test)
- FOUND: commit `e1801ca1` (GREEN implementation)
- Test run result: 1 passed (1)
