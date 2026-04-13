---
phase: 24-browser-inspection-fixes
plan: 01
subsystem: frontend
tags: [i18n, postgrest, edge-functions, bugfix]
dependency_graph:
  requires: []
  provides: [calendar-i18n-fix, settings-406-fix, analytics-dns-fix]
  affects: [calendar-page, settings-page, analytics-dashboard]
tech_stack:
  added: []
  patterns: [maybeSingle-for-optional-rows, try-catch-graceful-fallback, i18n-namespace-alignment]
key_files:
  created: []
  modified:
    - frontend/src/routes/_protected/calendar.tsx
    - frontend/src/i18n/en/calendar.json
    - frontend/src/i18n/ar/calendar.json
    - frontend/src/pages/settings/SettingsPage.tsx
    - frontend/src/domains/analytics/repositories/analytics.repository.ts
decisions:
  - Use maybeSingle + upsert pattern for settings page to handle missing user rows
  - Use try-catch fallback for analytics since Express backend routes do not exist yet
  - Route analytics through Express baseUrl to avoid Edge Function DNS failures
metrics:
  duration: 114s
  completed: 2026-04-09
  tasks: 3/3
  files: 5
---

# Phase 24 Plan 01: Browser Inspection Fixes Summary

Three targeted fixes for browser-visible runtime issues: calendar i18n raw keys, settings 406 PostgREST errors, and analytics Edge Function DNS failures.

## Tasks Completed

| Task | Name                                                | Commit   | Files                                            |
| ---- | --------------------------------------------------- | -------- | ------------------------------------------------ |
| 1    | Fix calendar i18n namespace and missing keys        | 76d1fdab | calendar.tsx, en/calendar.json, ar/calendar.json |
| 2    | Fix settings page 406 PostgREST error               | 33d5a7b0 | SettingsPage.tsx                                 |
| 3    | Route analytics calls through Express with fallback | 5af686ea | analytics.repository.ts                          |

## What Changed

### Task 1: Calendar i18n (FIX-01)

- Changed `useTranslation('dossiers')` to `useTranslation('calendar')` to use the correct namespace
- Updated all key paths: `calendar.view_mode.*` to `view.*`, `calendar.page.*` to `page.*` and `form.*`
- Added missing `page.title` and `page.description` keys to both EN and AR calendar.json files

### Task 2: Settings 406 (FIX-02)

- Replaced `.single()` with `.maybeSingle()` on the users query to prevent 406 when no row exists
- Added null guard returning `defaultUserSettings` when data is null
- Changed `.update().eq('id', user.id)` to `.upsert({ id: user.id, ... })` so first-time saves create the row

### Task 3: Analytics DNS (FIX-03)

- Added `{ baseUrl: 'express' }` to all three `apiGet` calls to route through Express instead of Edge Functions
- Wrapped each call in try/catch with `console.warn` and `{ data: null }` fallback since Express backend analytics routes do not exist yet
- Left `useNotificationCenter.ts` untouched as its existing fallback already works correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Analytics Express routes do not exist**

- **Found during:** Task 3
- **Issue:** Plan suggested routing to Express backend, but `backend/src/api/` has no analytics-dashboard or organization-benchmarks routes
- **Fix:** Used the plan's alternative approach: wrapped all apiGet calls in try/catch with graceful fallback returning `{ data: null }`
- **Files modified:** frontend/src/domains/analytics/repositories/analytics.repository.ts
- **Commit:** 5af686ea

**2. [Rule 2 - Missing critical functionality] Settings save mutation used .update() instead of .upsert()**

- **Found during:** Task 2
- **Issue:** If user row doesn't exist, `.update()` affects 0 rows silently, meaning settings would never persist on first save
- **Fix:** Changed to `.upsert({ id: user.id, ... })` to create row on first save
- **Files modified:** frontend/src/pages/settings/SettingsPage.tsx
- **Commit:** 33d5a7b0

## Decisions Made

1. **maybeSingle + upsert pattern** for settings: Handles both read (no 406) and write (creates row if missing) cases cleanly
2. **Try-catch fallback over Express routing** for analytics: Since no Express routes exist, graceful degradation is the correct approach until analytics backend is implemented
3. **No changes to notifications or auth** per plan: The existing fallback in useNotificationCenter.ts works, and auth retry noise resolves once DNS errors stop

## Self-Check: PASSED

- All 5 modified files verified on disk
- All 3 task commits verified in git log (76d1fdab, 33d5a7b0, 5af686ea)
