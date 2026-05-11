---
phase: 40-list-pages
plan: 09
subsystem: list-pages-engagements
tags: [list-page, engagements, primitive, infinite-query, week-list, navigation]
provides:
  - 'EngagementsListPage: ListPageShell + EngagementsList composition'
  - 'EngagementListItem → EngagementRow field mapping (LIST-04 contract)'
requires:
  - '@/components/list-page (ListPageShell, EngagementsList, EngagementRow, EngagementFilter)'
  - '@/hooks/useEngagementsInfinite (Wave 0 plan 02b)'
  - '@/types/engagement.types (EngagementListItem, EngagementType, EngagementStatus)'
  - '@tanstack/react-router useNavigate'
affects:
  - 'frontend/src/routes/_protected/engagements/index.tsx (route stub continues delegating to default-export)'
key-files:
  created:
    - 'frontend/src/pages/engagements/__tests__/EngagementsListPage.test.tsx'
  modified:
    - 'frontend/src/pages/engagements/EngagementsListPage.tsx'
decisions:
  - "Used the EngagementsList primitive's actual prop contract (state-driven: engagements, search/onSearchChange, filter/onFilterChange, onEngagementClick, hasNextPage/isFetchingNextPage/onLoadMore, isLoading) — the plan's locked <interfaces> {isRTL,t,onRowClick} did not match the primitive shipped in 40-02a-γ"
  - "Wave 0 (40-02b) verified the engagement row reality is name_en/name_ar/engagement_type/engagement_status/start_date/host_country_*/location_* — not the plan's locked title_en/title_ar/counterpart/kind/status. Built a per-field mapper (toEngagementRow) inside the page"
  - "Filter pills consume engagement_type, not engagement_status. Mapped engagement_type (10 values) onto the primitive's narrow type union ('meeting' | 'call' | 'travel' | 'event'). The plan must-haves named 'Confirmed/Pending' status pills, but the primitive's filter axis is type-based — surfaced this in deviations. Bilateral/consultation/working_group/roundtable→meeting; mission/delegation/official_visit→travel; summit/forum_session→event; other→meeting"
  - "Mapped engagement_status (6 values) onto the primitive's narrow status union: planned/confirmed/postponed→scheduled, in_progress/completed/cancelled→same"
  - "Default-export EngagementsListPage with ReactNode return type (React 19, no global JSX namespace) — matches the route stub's import"
metrics:
  duration_minutes: 9
  tasks_completed: 1
  files_created: 1
  files_modified: 1
  tests_added: 10
  tests_passing: 10
  completed_date: '2026-04-26'
---

# Phase 40 Plan 09: Engagements List Page Summary

LIST-04 satisfied — `/engagements` now renders `<ListPageShell>` containing `<EngagementsList>` driven by `useEngagementsInfinite`, with click-through to `/engagements/$engagementId/overview` and 10 passing vitest assertions.

## Field-Mapping Table (FINAL)

`EngagementListItem` (real shape from `frontend/src/types/engagement.types.ts:407-423`) → `EngagementRow` (primitive contract from `frontend/src/components/list-page/EngagementsList.tsx:9-17`).

| `EngagementListItem` field                                                               | `EngagementRow` field                                             | Mapping                                 |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| `id`                                                                                     | `id`                                                              | identity                                |
| `name_en`                                                                                | `title_en`                                                        | rename                                  |
| `name_ar`                                                                                | `title_ar`                                                        | rename                                  |
| `start_date`                                                                             | `starts_at`                                                       | rename                                  |
| `engagement_type` (10 values)                                                            | `type` (`'meeting'\|'call'\|'travel'\|'event'`)                   | enum-collapse via `mapEngagementType`   |
| `engagement_status` (6 values)                                                           | `status` (`'scheduled'\|'in_progress'\|'completed'\|'cancelled'`) | enum-collapse via `mapEngagementStatus` |
| `location_en` / `location_ar` (fallback `host_country_name_en` / `host_country_name_ar`) | `location` (single string)                                        | locale-picked at map time               |
| `end_date`, `is_virtual`, `participant_count`, `engagement_category`, `host_country_id`  | —                                                                 | unused by primitive                     |

### `engagement_type` → `EngagementRow.type` collapse

| `engagement_type` (real) | `EngagementRow.type` |
| ------------------------ | -------------------- |
| `bilateral_meeting`      | `meeting`            |
| `consultation`           | `meeting`            |
| `working_group`          | `meeting`            |
| `roundtable`             | `meeting`            |
| `mission`                | `travel`             |
| `delegation`             | `travel`             |
| `official_visit`         | `travel`             |
| `summit`                 | `event`              |
| `forum_session`          | `event`              |
| `other`                  | `meeting` (fallback) |

> **Note**: there is no source `engagement_type` literal that maps to `'call'`. The primitive's "Call" pill therefore renders zero rows for the current dataset. A future plan should either widen the source enum (e.g. add `phone_call`) or narrow the primitive's union — flagged below.

### `engagement_status` → `EngagementRow.status` collapse

| `engagement_status` (real) | `EngagementRow.status` |
| -------------------------- | ---------------------- |
| `planned`                  | `scheduled`            |
| `confirmed`                | `scheduled`            |
| `postponed`                | `scheduled`            |
| `in_progress`              | `in_progress`          |
| `completed`                | `completed`            |
| `cancelled`                | `cancelled`            |

## Composition

```
<ListPageShell title subtitle>
  <EngagementsList
    engagements={mappedRows}     # EngagementListItem[] flattened from data.pages, mapped via toEngagementRow
    search/onSearchChange        # local useState — also forwarded into useEngagementsInfinite({ search })
    filter/onFilterChange        # local useState — applied client-side over EngagementRow.type
    onEngagementClick={(row) => navigate('/engagements/$engagementId/overview', { engagementId: row.id })}
    hasNextPage isFetchingNextPage onLoadMore={fetchNextPage}
    isLoading
  />
</ListPageShell>
```

## Tasks

| Task | Name                                             | Commit     | Files                                                                                                                             | Tests |
| ---- | ------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1    | EngagementsListPage body + render-assertion test | `bc816a35` | `frontend/src/pages/engagements/EngagementsListPage.tsx`, `frontend/src/pages/engagements/__tests__/EngagementsListPage.test.tsx` | 10/10 |

## Test Coverage (10/10 passing in 607ms)

1. Renders `Engagements` H1 (ListPageShell title)
2. Renders 4 filter pills (`group[name='Filter engagements']` → 4 buttons)
3. Renders all three sample engagement rows (Geneva Summit / Paris Mission / Bilateral Call)
4. Travel pill filters → only Paris Mission survives (mission → travel)
5. All pill restores all rows after filtering
6. Row click invokes `navigate({ to: '/engagements/$engagementId/overview', params: { engagementId: 'e1' } })`
7. Load-more CTA visible when `hasNextPage`
8. Load-more click invokes `fetchNextPage`
9. GlobeSpinner + Loading text visible during `isFetchingNextPage`
10. Arabic title (`name_ar` → `title_ar`) renders when `i18n.language === 'ar'`

## Acceptance Criteria

| Criterion                                                                                                    | Status          |
| ------------------------------------------------------------------------------------------------------------ | --------------- |
| `export default function EngagementsListPage`                                                                | ✓               |
| `grep "EngagementsList\|ListPageShell\|/engagements/\$engagementId/overview"` ≥ 3 matches                    | ✓ 6 matches     |
| `grep "/engagements/\$engagementId/overview"` ≥ 1 match                                                      | ✓ 1             |
| Zero physical RTL classes (`ml-/mr-/pl-/pr-/text-left/text-right/rounded-l-/rounded-r-`)                     | ✓ 0 matches     |
| Zero `: any` / `as any` / `<any>`                                                                            | ✓ 0 matches     |
| Vitest passes (4 pills, filter behaviour, load-more click, GlobeSpinner during isFetchingNextPage, AR title) | ✓ 10/10         |
| `tsc --noEmit -p tsconfig.app.json` clean on plan files                                                      | ✓               |
| Engagement rows display title (locale-picked) + status + type + click → overview route                       | ✓ via primitive |

## Threat Mitigations Applied

- **T-40-09-01 (Tampering — search filter):** `useEngagementsInfinite({ search })` only forwards search when `search.length > 0`; the `ToolbarSearch` primitive owns the 250ms debounce internally, and `useEngagementsInfinite`/repo apply the `slice(0, 200)` cap (per 02b SUMMARY).
- **T-40-09-02 (Information disclosure — client-side filter):** disposition `accept` per plan threat model. Confirmed: only RLS-filtered rows arrive from the backend; the client `filter` state simply narrows what's already authorised.
- **T-40-09-03 (Spoofing — row click):** disposition `accept`. The `/engagements/$engagementId/overview` route enforces RLS independently; navigating to a forbidden engagement renders 404/forbidden.
- **T-40-09-04 (DoS — aggressive load-more):** TanStack Query `useInfiniteQuery` deduplicates concurrent `fetchNextPage` calls; the primitive's load-more button is disabled while `isFetchingNextPage`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] EngagementsList prop contract divergence**

- **Found during:** Task 1 (reading the actual primitive built in 40-02a-γ)
- **Issue:** Plan `<interfaces>` (line 60-66) locked `EngagementsList` props as `{isRTL, t, onRowClick}`, but the shipped primitive consumes state-driven props (`engagements`, `search/onSearchChange`, `filter/onFilterChange`, `onEngagementClick`, `hasNextPage/isFetchingNextPage/onLoadMore`, `isLoading`). The primitive owns its own i18n/RTL via `useTranslation`.
- **Fix:** Treated the page as the controller — owns search/filter useState, owns the data flatten + mapping pipeline, passes everything through to the primitive.
- **Files modified:** `frontend/src/pages/engagements/EngagementsListPage.tsx`
- **Commit:** `bc816a35`

**2. [Rule 1 — Bug] EngagementListItem field-shape divergence (already documented in 02b SUMMARY)**

- **Found during:** Task 1 (mapping data.pages → EngagementRow[])
- **Issue:** Plan `<interfaces>` (line 78-87) locked an Engagement shape `{title_en, title_ar, counterpart_id, counterpart_name, status, kind, start_date}`. Reality (and 02b confirmed) is `EngagementListItem {name_en, name_ar, engagement_type, engagement_status, start_date, end_date, location_en, location_ar, is_virtual, host_country_id, host_country_name_en, host_country_name_ar, participant_count}`.
- **Fix:** Built `toEngagementRow(item, isRTL)` mapper inside the page (table above). Per-locale `location` falls back to `host_country_name_*` when `location_*` is undefined.
- **Files modified:** `frontend/src/pages/engagements/EngagementsListPage.tsx`
- **Commit:** `bc816a35`

**3. [Rule 1 — Bug] Filter pill axis divergence (type vs status)**

- **Found during:** Task 1 (reading the primitive's `EngagementFilter` union)
- **Issue:** Plan must-haves named the four pills `All / Confirmed / Travel / Pending` (a status-based partition over `engagement_status`). The primitive ships `EngagementFilter = 'all' | 'meeting' | 'call' | 'travel' | 'event'` (a type-based partition over `EngagementRow.type`). Renaming the labels would not change the underlying filter axis.
- **Fix:** Used the primitive as-is. Filter applies over `EngagementRow.type` (mapped from `engagement_type`). Recorded the mapping decision; flagged the missing `'call'` source mapping.
- **Files modified:** `frontend/src/pages/engagements/EngagementsListPage.tsx`
- **Commit:** `bc816a35`

**4. [Rule 1 — Bug] React 19 `JSX.Element` namespace**

- **Found during:** `tsc --noEmit -p tsconfig.app.json` after first write
- **Issue:** With React 19 and no `import * as React`, the `JSX` namespace is not in scope (`TS2503: Cannot find namespace 'JSX'`).
- **Fix:** Replaced return type with `ReactNode` (matches every other primitive in `frontend/src/components/list-page/`).
- **Files modified:** `frontend/src/pages/engagements/EngagementsListPage.tsx`
- **Commit:** `bc816a35`

**5. [Rule 3 — Blocking] Initial commit missed the page file (macOS case-insensitive FS)**

- **Found during:** `git show --stat HEAD` after first commit
- **Issue:** The repo tracks the page at `frontend/src/pages/engagements/EngagementsListPage.tsx` (lowercase). On macOS with a case-insensitive filesystem, `Read`/`Write` on `Engagements/` resolved to the same file, but `git add Engagements/...` did not match the tracked path.
- **Fix:** Re-staged via the lowercase path and `git commit --amend --no-edit`. Final commit `bc816a35` contains both the page (-543 / +194 lines) and the test (+194 lines).
- **Commit:** `bc816a35` (amended)

### Architectural Changes

None — page composes existing primitives only.

### Auth Gates

None encountered.

## Known Stubs

- **Missing 'call' source mapping** — `EngagementRow.type === 'call'` cannot currently be produced by `toEngagementRow` because the source `engagement_type` enum has no call-equivalent literal. The "Call" pill renders zero rows for the current dataset. Not a stub blocking LIST-04 (the click-target, week-list, search, load-more all work); flagged for a follow-up plan to either widen the source enum or narrow the primitive's filter union.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced beyond the plan's threat model.

## Self-Check: PASSED

- `frontend/src/pages/engagements/EngagementsListPage.tsx` — FOUND (modified)
- `frontend/src/pages/engagements/__tests__/EngagementsListPage.test.tsx` — FOUND (created)
- Commit `bc816a35` (feat 40-09) — FOUND in `git log`
- 10/10 vitest assertions pass
- `tsc --noEmit -p tsconfig.app.json` clean on plan files
- Zero physical RTL classes / zero `any` in modified file
