# Phase 66: Overview Error Contract & Timeline Cross-Links - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 30+ (service, hook, 19 overview cards, 7 overview tabs, timeline components, edge functions, routes, tests, i18n)
**Analogs found:** every work surface has at least one in-repo honest-error or guarded-navigation analog

## Headline Finding: Error Swallowing Is Two-Layered

OVRERR-01 cannot be fixed at the card layer alone. Errors are swallowed at TWO independent layers:

1. **Service layer** — `frontend/src/services/dossier-overview.service.ts` per-section fetchers either ignore the Supabase `error` entirely or `console.error` it and continue with `(data || [])`. A failed section returns a zeroed, **valid-looking** section object, so TanStack Query resolves successfully and even error-aware consumers (`DossierOverview.tsx`, which DOES read `isError`) never see section failures. Only `fetchDossierCore` (lines 291–321) throws.
2. **Card layer** — all 19 files in `frontend/src/pages/dossiers/overview-cards/` destructure `{ data, isLoading }` and never read `isError`, then render trustworthy empty copy ("No data available", "No recent activity").

The plans must decide where the contract lives. The cleanest precedent-aligned shape: make section fetchers **throw or return a section-level `error` marker** (per-section error fields mirroring ExportDossierDialog's `failedSections` D-08 pattern), and have every card read + render `isError`.

## File Classification

| File To Modify                                                                                                                      | Role                    | Data Flow                  | Closest Analog                                                                                                                                                                                                              | Match Quality |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `frontend/src/services/dossier-overview.service.ts` (section fetchers)                                                              | service                 | request-response aggregate | `useDossierExport` failed-sections contract (`frontend/src/hooks/useDossierExport.ts` consumer: `ExportDossierDialog.tsx` D-08) + its own `fetchDossierCore` throw pattern (lines 291–321)                                  | role-match    |
| All 19 cards in `frontend/src/pages/dossiers/overview-cards/*.tsx`                                                                  | component               | request-response display   | `frontend/src/components/analytics/DossierAnalyticsCard.tsx` lines 43–68 (same grid, same visual language, already handles `isError`)                                                                                       | exact         |
| 7 overview tabs `frontend/src/pages/dossiers/{Country,Organization,Forum,Topic,WorkingGroup,Person,ElectedOfficial}OverviewTab.tsx` | component (composition) | none (pass-through)        | `CountryOverviewTab.tsx` (no change expected — cards self-contain error UI)                                                                                                                                                 | exact         |
| `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts` (dead `/mous/$id`, `/documents/$id`)                                | hook (URL mapping)      | request-response           | `ActivityTimelineItem.tsx` lines 124–140 (per-type switch with only-mounted targets)                                                                                                                                        | exact         |
| `frontend/src/pages/DossierSearchPage.tsx` (dead `/mous/$id`)                                                                       | page                    | request-response           | same as above                                                                                                                                                                                                               | exact         |
| `supabase/functions/unified-timeline/index.ts` (dead `navigation_url` values)                                                       | edge function           | request-response           | `supabase/functions/_shared/dossier-routes.ts` `getDossierDetailPath` (emits mounted paths)                                                                                                                                 | role-match    |
| `frontend/src/components/activity-feed/ActivityList.tsx` (if guard is extended)                                                     | component               | request-response display   | its own R-05 guard, lines 98–115                                                                                                                                                                                            | exact         |
| New/updated unit tests                                                                                                              | test                    | n/a                        | `frontend/src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx` (error-flip mock) + `frontend/src/pages/dossiers/overview-cards/__tests__/SharedRecentActivityCard.test.tsx` (hoisted mock state, barrel-mock) | exact         |

## Swallowed-Error Inventory (OVRERR-01)

### Layer 1 — `frontend/src/services/dossier-overview.service.ts`

| Fetcher                           | Lines   | Swallow Mechanism                                                                                                              |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `fetchDossierCore`                | 291–321 | **Throws** `DossierOverviewAPIError` — the only honest fetcher; the analog for the rest                                        |
| `fetchRelatedDossiers`            | 329–364 | `if (outError \|\| inError) console.error(...)` then proceeds with `(outgoing \|\| [])` / `(incoming \|\| [])` → empty section |
| `fetchDocuments` (position links) | 466–477 | `console.error` then `((positionLinks \|\| []) ...)`                                                                           |
| `fetchDocuments` (MoUs)           | 491–505 | `console.error(mous1Error ?? mous2Error)` then `(mous1 \|\| [])`/`(mous2 \|\| [])`                                             |
| `fetchWorkItems` (links)          | 607–611 | `const { data: links }` — `error` never destructured; `(links \|\| [])`                                                        |
| `fetchWorkItems` (tasks)          | 633     | `const { data: tasks }` — error ignored                                                                                        |
| `fetchWorkItems` (assignees)      | 643–647 | error ignored                                                                                                                  |
| `fetchWorkItems` (commitments ×2) | 686–701 | error ignored on both queries                                                                                                  |
| `fetchWorkItems` (intakes)        | 736–740 | error ignored                                                                                                                  |
| `fetchCalendarEvents`             | 807–815 | `const { data: events }` — error ignored; `((events \|\| []) ...)`                                                             |
| `fetchKeyContacts`                | 860–864 | `const { data: contacts }` — error ignored                                                                                     |
| `fetchActivityTimeline`           | 892–917 | `try/catch` → `console.error` → returns `{ total_count: 0, recent_activities: [], ... }`                                       |

Downstream blast radius of layer 1: `useDossierOverview` (`frontend/src/hooks/useDossierOverview.ts`) exposes `isError` correctly but it only fires for `fetchDossierCore`; consumers `DossierOverview.tsx`, `DossierDrawer` (`frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx` → `RecentActivitySection.tsx` "empty.recent_activity"), and all stats-deriving cards show zeros/empties on section failure.

### Layer 2 — cards that never read `isError`

All hooks below DO expose `isError`/`error` (verified) — the cards just drop it.

| Card (`frontend/src/pages/dossiers/overview-cards/`) | Destructure Line | Hook                                                      | Trustworthy-Looking Empty Copy                                                                       |
| ---------------------------------------------------- | ---------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `SharedSummaryStatsCard.tsx`                         | 31               | `useDossierOverview`                                      | `overview.noData` "No data available" (also `allZero` collapses real zeros and failures, line 58/79) |
| `SharedRecentActivityCard.tsx`                       | 53               | `useDossierActivityTimeline`                              | `overview.noRecentActivity` "No recent activity" (line 79–82)                                        |
| `BilateralSummaryCard.tsx`                           | 25               | `useDossierOverview`                                      | `overview.bilateral.empty` (line 76–79)                                                              |
| `ConnectedAnchorsCard.tsx`                           | 42               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `DeliverablesTrackerCard.tsx`                        | 30               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `EngagementHistoryCard.tsx`                          | 30               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `EngagementsByStageCard.tsx`                         | 38               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `ForumMetadataCard.tsx`                              | 29               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `ForumSessionsCard.tsx`                              | 27               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `KeyContactsCard.tsx`                                | 26               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `KeyRepresentativesCard.tsx`                         | 27               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `MeetingScheduleCard.tsx`                            | 27               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `MemberListCard.tsx`                                 | 30               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `MembershipStructureCard.tsx`                        | 24               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `PersonMetadataCard.tsx`                             | 32               | `useDossierOverview`                                      | analogous empty                                                                                      |
| `MoUStatusCard.tsx`                                  | 40               | direct `useQuery` (queryFn throws, line 49)               | empty summary                                                                                        |
| `PositionTrackerCard.tsx`                            | 33               | `useDossierPositionLinks` (exposes `error`, hook line 86) | analogous empty                                                                                      |
| `ElectedOfficialOfficeCard.tsx`                      | 29               | `useElectedOfficial`                                      | analogous empty                                                                                      |
| `ElectedOfficialCommitteesCard.tsx`                  | 26               | `useElectedOfficial`                                      | analogous empty                                                                                      |

Card-to-tab composition (all 7 tabs follow `CountryOverviewTab.tsx`'s grid): `SharedSummaryStatsCard` + `SharedRecentActivityCard` appear on all 7; `DossierAnalyticsCard` (already honest) sits beside them; each per-type card appears on exactly one tab.

## Dead-Link Inventory (OVRERR-02)

Mounted-route ground truth: `frontend/src/routeTree.gen.ts` (`fullPath:` entries). Relevant mounted routes: `/tasks/$id`, `/commitments`, `/intake/tickets/$id`, `/engagements/$engagementId`, `/calendar`, `/calendar/new`, `/mous` (list only), `/positions/$id`, `/dossiers/{countries,organizations,forums,topics,working_groups,persons,elected-officials,engagements}/$id[...]`, `/dossiers/organizations/$id/mous`.

| #   | Emitter                                                                                             | Target Emitted          | Mounted?                                       | Live Exposure                                                                          | Suggested Real Destination                                                                   |
| --- | --------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts:98` (`getWorkItemUrl`, case `'mou'`) | `/mous/${id}`           | **NO** (only `/mous` list)                     | **LIVE** — consumed by `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` | `/mous` list (or owning dossier's `/dossiers/organizations/$id/mous` tab when context known) |
| 2   | `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts:100` (case `'document'`)             | `/documents/${id}`      | **NO** (no `/documents/*` route exists at all) | **LIVE** via CommandPalette                                                            | suppress or route to owning dossier `/docs` tab                                              |
| 3   | `frontend/src/pages/DossierSearchPage.tsx:152` (case `'mou'`)                                       | `/mous/${id}`           | **NO**                                         | **LIVE** — mounted at `frontend/src/routes/_protected/search.tsx`                      | `/mous` list or dossier mous tab                                                             |
| 4   | `supabase/functions/unified-timeline/index.ts:178` (calendar entries)                               | `/calendar/${event.id}` | **NO** (only `/calendar`, `/calendar/new`)     | currently **DORMANT** — see note below                                                 | `/calendar` (optionally with date search param)                                              |
| 5   | `supabase/functions/unified-timeline/index.ts:360` (MoUs)                                           | `/mous/${mou.id}`       | **NO**                                         | currently **DORMANT**                                                                  | `/mous`                                                                                      |

**Dormant-consumer note (suspects #4/#5):** the `navigation_url` consumers `frontend/src/components/timeline/TimelineEventCard.tsx:119`, `frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx:197` (and wrappers `UnifiedVerticalTimeline`, `EnhancedVerticalTimeline`, `EngagementTimeline`, plus `frontend/src/hooks/useUnifiedTimeline.ts`) have **no consumers outside `components/timeline/`** — the only live import from `@/components/timeline` is `InteractiveTimeline` in `frontend/src/pages/engagements/EngagementDetailPage.tsx:55`. The other live `navigation_url` reader, `frontend/src/components/activity-feed/ActivityList.tsx:107` (rendered by `frontend/src/pages/activity/ActivityPage.tsx` at `/activity`), receives data from `supabase/functions/activity-feed/` which **never emits `navigation_url`** (verified by grep) — so its rows are non-interactive today. Fixing the edge-fn emit sites (#4/#5) is still in scope per OVRERR-02 ("never dead-end"), but the user-visible dead links right now are #1–#3.

**Verified-good timeline targets (do not touch):** `frontend/src/components/dossier/ActivityTimelineItem.tsx:124–140` — `/tasks/$id`, `/commitments` + `search: s({ id })`, `/intake/tickets/$id`, all mounted; `frontend/src/pages/Dashboard/components/TimelineEventCard.tsx:56` → `/engagements/${id}` mounted; `supabase/functions/unified-timeline/index.ts:239,306` → `getDossierDetailPath()` bases are mounted (but see secondary issue).

**Secondary cross-link smell:** query strings embedded in the `to:` path string — `useQuickSwitcherSearch.ts:94` and `DossierSearchPage.tsx:147` use `'/commitments?id=...'`, and `unified-timeline/index.ts:239,306` append `?tab=...`. The correct TanStack Router pattern is `ActivityTimelineItem.tsx:131–134`: `navigate({ to: '/commitments', search: s({ id }) })` using the `p`/`s` helpers from `frontend/src/lib/navigation`. If a plan touches these lines anyway, normalize them.

## Pattern Assignments

### 1. Card-level error state — copy `DossierAnalyticsCard`

**Analog:** `frontend/src/components/analytics/DossierAnalyticsCard.tsx` (lines 43–68). It lives on the SAME overview grids beside the broken cards, uses the same skeleton/header structure, and already implements the contract.

```tsx
const { metrics, isLoading, isError } = useAnalyticsForDossier(dossierId, dossierType)

if (isLoading) {
  /* skeleton, lines 45–55 */
}

if (isError) {
  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.analytics', { defaultValue: 'Analytics' })}
      </h3>
      <p className="text-sm text-muted-foreground text-start">
        {t('overview.analyticsError', { defaultValue: 'Unable to load analytics' })}
      </p>
    </div>
  )
}
```

To match the phase-65 contract, prefer the harsher danger treatment for the error line (see Shared Patterns): `role="alert"` + `text-[var(--danger)]` rather than `text-muted-foreground`, per `TasksTab.tsx:160–166`. Order matters: **error check BEFORE empty check** (the `CalendarTab` ScheduledEventsSection ordering, lines 371–374).

### 2. Inline per-stat error line — copy `OverviewTab` task-progress stat

**Analog:** `frontend/src/pages/engagements/workspace/OverviewTab.tsx` lines 208–212 (for `SharedSummaryStatsCard`-style stat grids where one section failed but others are fine):

```tsx
{kanbanLoading ? (
  <Skeleton className="mt-1 h-6 w-16" />
) : kanbanError != null ? (
  // A failed kanban fetch must not read as 0%/0/0 (WR-01).
  <p className="text-xs text-[var(--danger)]">{t('error.tabLoad')}</p>
) : ( /* real numbers */ )}
```

### 3. Full-surface error state — copy `TasksTab` (tab) or `DossierOverview` (page)

**Analog A (minimal, phase-65 canonical):** `frontend/src/pages/engagements/workspace/TasksTab.tsx` lines 157–166:

```tsx
// Error state — a failed kanban fetch must not masquerade as "No tasks yet"
if (error != null) {
  return (
    <div role="alert" className="px-4 py-16 text-center text-sm text-[var(--danger)]">
      {t('error.tabLoad')}
    </div>
  )
}
```

**Analog B (with retry):** `frontend/src/components/dossier/dossier-overview/DossierOverview.tsx` lines 226–243 — `Card className="border-destructive"` + `AlertCircle` + `t('error.title')`/`t('error.description')` (namespace `dossier-overview`) + `refetch()` button. Use when a retry affordance is wanted.

### 4. Error-prop threading into a presentational section — copy `CalendarTab`

**Analog:** `frontend/src/pages/engagements/workspace/CalendarTab.tsx`. Reader hook exposes error (lines 67–71), container threads `hasError={entriesError !== null}` + `errorLabel={t('calendar.entriesError')}` (lines 282–292), and the presentational section renders error-before-empty (lines 371–374):

```tsx
{hasError ? (
  <p className="text-xs text-[var(--danger)]">{errorLabel}</p>
) : !isLoading && entries.length === 0 ? (
  <p className="text-sm text-muted-foreground">{emptyLabel}</p>
) : ( /* rows */ )}
```

This is the pattern for `RecentActivitySection.tsx` in the drawer (`frontend/src/components/dossier/DossierDrawer/`), which is purely presentational and currently only has `empty.recent_activity` (line 56, namespace `dossier-drawer`).

### 5. "Unusable lookups = error" collapse — copy `NewPositionDialog` WR-04

**Analog:** `frontend/src/components/positions/NewPositionDialog.tsx` lines 164–170 + 393–396. Relevant if a plan treats error-or-impossible states identically:

```tsx
// Resolved-but-EMPTY lookups are as unusable as errored ones ... (WR-04)
const typesUnavailable = typesQuery.error != null || (!typesQuery.isLoading && types.length === 0)
...
{typesUnavailable ? (
  <p className="text-xs text-[var(--danger)]">{t('positions:create_dialog.lookup_error')}</p>
) : ( /* form field */ )}
```

Caution for overview cards: do NOT copy the "empty == error" collapse blindly — OVRERR-01 requires the opposite distinction (empty must stay empty, error must look like error). The reusable part is the render shape, not the boolean.

### 6. Section-level partial-failure contract — copy `ExportDossierDialog` D-08

**Analog:** `frontend/src/components/dossier/ExportDossierDialog.tsx` lines 253–280. The export pipeline already models "aggregate succeeded but sections failed" — exactly the shape `fetchDossierOverview` needs:

```tsx
{/* Failed-sections warning (D-08) — below the success banner */}
{isReady && failedSections.length > 0 && (
  <div role="alert"
    className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--warn)] bg-[var(--warn-soft)] p-4">
    <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--warn)]" />
    <span className="text-sm text-[var(--ink)] text-start">
      {t('warning.failedSections', { ... sections: failedSectionNames(failedSections) })}
    </span>
  </div>
)}

{/* Error State */}
{error && (
  <div role="alert"
    className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--danger-soft)] p-4">
    <AlertCircle className="h-5 w-5 shrink-0 text-[var(--danger)]" />
    <span className="text-sm text-[var(--danger)]">{t('error', { defaultValue: 'Export failed. Please try again.' })}</span>
  </div>
)}
```

Service-side application: extend `DossierOverviewResponse` with per-section error markers (e.g., `section_errors: DossierOverviewSection[]` or `error: string | null` per section) instead of zeroed sections; throw style follows `fetchDossierCore` lines 298–305 (`DossierOverviewAPIError(message, status, code, details)`). Types live in `frontend/src/types/dossier-overview.types.ts`.

### 7. Per-type navigation switch with mounted targets — copy `ActivityTimelineItem`

**Analog:** `frontend/src/components/dossier/ActivityTimelineItem.tsx` lines 124–140 — every case targets a verified-mounted route, search params passed via `search:` not string concat:

```tsx
const handleClick = () => {
  switch (activity.work_item_type) {
    case 'task':
      void navigate({ to: '/tasks/$id', params: p({ id: activity.work_item_id }) })
      break
    case 'commitment':
      void navigate({ to: '/commitments', search: s({ id: activity.work_item_id }) })
      break
    case 'intake':
      void navigate({ to: '/intake/tickets/$id', params: p({ id: activity.work_item_id }) })
      break
  }
}
```

Apply to: `useQuickSwitcherSearch.ts` `getWorkItemUrl` (lines 85–104) and `DossierSearchPage.tsx` handler (lines ~140–160). For the suppression alternative, see pattern 8.

### 8. Suppress-instead-of-dead-end guard — copy `ActivityList` R-05

**Analog:** `frontend/src/components/activity-feed/ActivityList.tsx` lines 98–130. Rows whose navigation target fails a guard are rendered fully non-interactive (no role/tabIndex/onClick):

```tsx
const navUrl = a.metadata?.navigation_url
const safeNavUrl =
  typeof navUrl === 'string' &&
  navUrl.startsWith('/') &&
  !navUrl.startsWith('//') &&
  !navUrl.includes('\\')
    ? navUrl
    : null
const interactive = safeNavUrl !== null
const onClickHandler = interactive
  ? (): void => {
      void navigate({ to: safeNavUrl })
    }
  : undefined
```

OVRERR-02's "suppressed" option = extend this guard shape with a mounted-route allowlist (or fix the emitters to only produce mounted paths — preferable, since the route inventory lives server-side in `supabase/functions/_shared/dossier-routes.ts` for dossier paths).

### 9. Edge-function route emission — copy `_shared/dossier-routes.ts`

**Analog:** `supabase/functions/_shared/dossier-routes.ts` (full file, 39 lines) — `getDossierDetailPath(dossierId, type)` → `/dossiers/{segment}/{id}`, mirroring `frontend/src/lib/dossier-routes.ts`. The fix for `unified-timeline/index.ts:178,360` is to emit mounted paths the same way (`/calendar`, `/mous`), keeping frontend/edge route knowledge in this one shared module. Edge functions deploy via Supabase CLI (per project memory).

## Shared Patterns

### Error-state visual contract (phase-65 canonical)

- Inline line: `text-xs text-[var(--danger)]` — `OverviewTab.tsx:212`, `CalendarTab.tsx:372`, `NewPositionDialog.tsx:394`
- Full surface: `role="alert"` + `text-[var(--danger)]` — `TasksTab.tsx:162`
- Banner: `role="alert"` + `border-[var(--danger)] bg-[var(--danger-soft)]` + `AlertCircle` — `ExportDossierDialog.tsx:270–280`
- Tokens only — never raw hex, never `text-red-*`. `text-destructive` (used in `DossierOverview.tsx:230`, `SharedRecentActivityCard.tsx:38`) is the @theme-mapped legacy alias; new phase-66 code should follow the phase-65 `var(--danger)` form for consistency with the most recent contract.
- RTL: all error copy via i18n keys with `text-start`; container `dir={isRTL ? 'rtl' : 'ltr'}` as in the cards.

### i18n key ownership

- `workspace:error.tabLoad` exists (en `frontend/src/i18n/en/workspace.json:75`, ar `:79`) — engagement workspace surfaces ONLY; do not reuse for dossier overview.
- `dossier-overview:error.title` / `error.description` exist (en `frontend/src/i18n/en/dossier-overview.json:42`, ar `:42`) — used by `DossierOverview.tsx`.
- Cards translate from the **`dossier`** namespace under `overview.*` with inline `defaultValue` (e.g., `overview.analyticsError` in `DossierAnalyticsCard`). New per-card error keys belong in `frontend/src/i18n/{en,ar}/dossier.json` under `overview.*` (e.g., `overview.sectionError`), added to BOTH languages — unregistered/missing ar keys silently fall back to English (project memory: i18n is static-bundled in `frontend/src/i18n/index.ts`; both `dossier` and `dossier-overview` are registered).
- Elected-official cards use the `elected-officials` namespace; drawer section uses `dossier-drawer`.

### Forced-error unit test pattern

**Analog:** `frontend/src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx` lines 75–94 (mutable hoisted mock state) + 196–201 (the WR-01 assertion):

```tsx
// Mutable kanban query state — error flipped for the WR-01 error-state test.
const kanbanState = { error: null as Error | null }
vi.mock('@/domains/engagements/hooks/useEngagementKanban', () => ({
  useEngagementKanban: () => ({ ..., error: kanbanState.error }),
}))
...
it('TasksTab renders an error state, not the empty state, when the kanban query fails (WR-01)', () => {
  kanbanState.error = new Error('engagements-kanban-get 404')
  ...
  expect(screen.getByRole('alert')).toHaveTextContent('error.tabLoad')
})
```

Card-level companion: `frontend/src/pages/dossiers/overview-cards/__tests__/SharedRecentActivityCard.test.tsx` — `vi.hoisted` mock state, i18n echo mock honouring `defaultValue` (lines 7–16), and **barrel-path mocking** (`@/hooks/useDossierActivityTimeline` re-exports the domain hook; mock the barrel, line 21 comment). Extend its hook mock with `isError: true` flips for the new error-state tests. For `useDossierOverview` consumers, mock `@/hooks/useDossierOverview` the same way.

### Route-mountedness verification

Ground truth is `frontend/src/routeTree.gen.ts` `fullPath:` literals (generated — never edit). Any plan adding/changing a navigation target must name the exact `fullPath` it resolves to.

## No Analog Found

| Work Item                                                  | Role                  | Reason / Fallback                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-section error markers inside `DossierOverviewResponse` | type/service contract | No existing aggregate response carries per-section errors client-side; nearest shape is the export pipeline's `failedSections` (server-computed, `ExportDossierDialog.tsx:254`). Design the type extension in `frontend/src/types/dossier-overview.types.ts` mirroring that naming. |
| Mounted-route allowlist for data-driven `navigation_url`   | utility               | `ActivityList.tsx` R-05 guards URL _shape_ only. If suppression-by-mountedness is chosen, it is a new small utility; prefer fixing emitters instead.                                                                                                                                |

## Metadata

**Analog search scope:** `frontend/src/{services,hooks,domains,pages,components,routes,i18n,types}`, `supabase/functions/{unified-timeline,activity-feed,_shared}`, `frontend/src/routeTree.gen.ts`
**Key greps:** `isError` destructure across overview-cards (zero hits before this phase), `navigation_url` emit/consume sites, `fullPath:` route inventory
**Pattern extraction date:** 2026-06-13
