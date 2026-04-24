---
phase: 38-dashboard-verbatim
plan: 04
subsystem: dashboard-widgets
tags: [widget, digest, signature-visual, globe-spinner, activity-feed, rtl]
requirements: [DASH-04, DASH-08, DASH-09]
dependency_graph:
  requires: [38-00, 37 signature-visuals]
  provides: ['Digest widget (feed rows + refresh overlay pattern)']
  affects: [Dashboard.tsx (consumer of Digest)]
tech_stack:
  added: []
  patterns:
    - 'refresh-overlay: clicked-state flag + <GlobeSpinner> overlay in absolutely-positioned layer'
    - 'field-mapping adapter: ActivityItem -> DigestRow local shape'
key_files:
  created:
    - frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
  modified:
    - frontend/src/pages/Dashboard/widgets/Digest.tsx
    - frontend/src/pages/Dashboard/widgets/dashboard.css
decisions:
  - 'Data source = useActivityFeed (Option A, human checkpoint 2026-04-25)'
  - 'source field mapped to actor_name — semantic compromise deferred for later phase'
  - 'Busy state tracked via local clicked-flag (useActivityFeed has no isFetching)'
metrics:
  duration_minutes: ~20
  tasks_completed: 2
  tests_added: 6
  files_touched: 3
completed_date: 2026-04-25
---

# Phase 38 Plan 04: Digest Widget Summary

Hydrated the DASH-03 right-panel Digest widget with real-data feed rows backed by `useActivityFeed`, plus the first domain-code consumer of the Phase 37 `<GlobeSpinner>` — refresh click triggers a backdrop-blurred overlay while the button icon rotates. Resolved via human checkpoint: chose `useActivityFeed` (Option A) with a documented semantic compromise on the `source` field.

## Tasks completed

| Task | Name                                                 | Commit     | Files                                                            |
| ---- | ---------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| 1    | Digest unit tests (RED)                              | `cad36f13` | `Digest.test.tsx`                                                |
| 2    | Digest implementation + GlobeSpinner overlay (GREEN) | `17e01f70` | `Digest.tsx`, `dashboard.css`, `Digest.test.tsx` (i18n mock fix) |

## Human checkpoint outcome

**Question:** What hook powers the Digest widget?
**Choice:** A — `useActivityFeed` (existing hook; zero new infra)
**Hook file:** `frontend/src/hooks/useActivityFeed.ts`
**Return shape:** `ActivityItem` from `frontend/src/types/activity-feed.types.ts`

**Field mapping applied:**

| Digest row field | ActivityItem source                  | Transform                                                                                    |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `id`             | `id`                                 | direct                                                                                       |
| `tag`            | `entity_type`                        | `.toUpperCase()` (e.g., `ENGAGEMENT`, `POSITION`)                                            |
| `headline`       | `description_ar` \| `description_en` | language-aware: `i18n.language === 'ar' ? description_ar ?? description_en : description_en` |
| `source`         | `actor_name`                         | direct — **semantic compromise**                                                             |
| `timestamp`      | `created_at`                         | ISO string                                                                                   |

## Deviations from Plan

### Rule-3 (semantic compromise documented)

**1. `source = actor_name` is a semantic mismatch**

- **Found during:** Task 2 (implementation)
- **Issue:** Handoff `dashboard.jsx` mocks `source: 'Reuters' | 'Al Sharq'` (publication/news outlet). `ActivityItem.actor_name` is the internal user who performed the action (e.g., "Khalid Alzahrani"). This is not a bug — it's a semantic mismatch accepted per user decision to avoid creating a new `intelligence_digest` table in Phase 38.
- **Fix:** Mapped `source ← actor_name` verbatim. Field-mapping adapter (`mapActivityToRow`) isolates the compromise so future migration is a one-line swap.
- **Files modified:** `frontend/src/pages/Dashboard/widgets/Digest.tsx`
- **Commit:** `17e01f70`
- **Follow-up:** Logged to `deferred-items.md` for future phase.

**2. `useActivityFeed` has no `isFetching` flag**

- **Found during:** Task 2 (implementation)
- **Issue:** Plan template used `const { data, isLoading, isError, refetch, isFetching } = ...`. Actual `UseActivityFeedReturn` exposes `activities`, `isLoading`, `error`, `refetch`, `isFetchingNextPage` — no `isFetching`.
- **Fix:** Tracked refresh busy-state via local `clicked` flag (set true on click → await `refetch()` → set false). Plan's `busy = isFetching || clicked` collapsed to `busy = clicked`. Achieves the same visual contract (overlay visible while refetch is pending).
- **Files modified:** `frontend/src/pages/Dashboard/widgets/Digest.tsx`
- **Commit:** `17e01f70`

**3. `error` is `Error | null`, not a boolean `isError`**

- **Found during:** Task 2 (implementation)
- **Fix:** Used `if (error !== null)` instead of `if (isError)`.

**4. i18n assertions adapted to test-harness convention**

- **Found during:** Task 2 test fixup
- **Issue:** Sibling widget tests (OverdueCommitments, MyTasks, etc.) mock `react-i18next` to return the raw key as the translated string. Plan template assumed real translations were loaded, which would have required wiring `<I18nextProvider>` in tests.
- **Fix:** Adopted the sibling-widget mock pattern: `t: (k) => k`. Assertions check for key names (`digest.empty`, `error.load_failed`) rather than literal English strings.
- **Files modified:** `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`

## Known stubs / open risks

- **Open risk:** Digest currently reflects internal audit-style activity (task updates, comments, status changes), **not** external intelligence signals as implied by the handoff design ("Intelligence Digest" title + news-outlet-style sources). Users will see rows like `ENGAGEMENT | <Khalid's description> | Khalid Alzahrani · Apr 24, 10:00 AM` rather than the handoff's `GEOPOLITICS | <headline> | Reuters · Apr 24, 10:00 AM`. This is an accepted product compromise for Phase 38 — see `deferred-items.md`.

## i18n keys

No new keys added in this plan — `digest.title`, `digest.refresh`, `digest.empty`, `error.load_failed` were already pre-seeded in `dashboard-widgets.json` (both EN and AR) by plan 38-00.

## Shared-file discipline

- `dashboard.css`: **append-only** — added `.digest-overlay` rule at bottom with a clear `Plan 38-04` section header. No other widget sections touched.
- `i18n/{en,ar}/dashboard-widgets.json`: **not modified** — all required keys were pre-seeded.

## Must-haves verified

- [x] Digest renders feed rows with tag chip + headline + source + timestamp
- [x] Refresh button shows GlobeSpinner overlay while refetching — button itself rotates (`animate-spin` class toggles)
- [x] GlobeSpinner honors `prefers-reduced-motion` (inherited from Phase 37 VIZ-03 — no custom animation)
- [x] Data source hook CONFIRMED by user via checkpoint (no Claude's-discretion guess)
- [x] `frontend/src/pages/Dashboard/widgets/Digest.tsx` ≥ 80 lines: **145 lines**
- [x] `GlobeSpinner` imported from `@/components/signature-visuals`
- [x] RTL-safe: no `ml-/mr-/pl-/pr-/text-left/text-right` (unit-test-asserted)

## Verification

```bash
pnpm -C frontend vitest run src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
# Test Files  1 passed (1)
#      Tests  6 passed (6)
```

## Commits

- `cad36f13` — test(38-04-TASK-1): add failing Digest widget tests (RED)
- `17e01f70` — feat(38-04-TASK-2): hydrate Digest widget with useActivityFeed + GlobeSpinner (GREEN)

## Self-Check: PASSED

- [x] `frontend/src/pages/Dashboard/widgets/Digest.tsx` exists (145 lines)
- [x] `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` exists (172 lines)
- [x] `frontend/src/pages/Dashboard/widgets/dashboard.css` modified (digest-overlay rule appended)
- [x] Commit `cad36f13` present in git log
- [x] Commit `17e01f70` present in git log
- [x] 6/6 tests pass
