---
phase: 66-overview-error-contract-timeline-cross-links
reviewed: 2026-06-13T02:55:00Z
depth: standard
files_reviewed: 45
files_reviewed_list:
  - frontend/src/components/activity-feed/ActivityList.tsx
  - frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx
  - frontend/src/components/dossier/DossierActivityTimeline.tsx
  - frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx
  - frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx
  - frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx
  - frontend/src/components/dossier/dossier-overview/DossierOverview.tsx
  - frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
  - frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx
  - frontend/src/components/timeline/TimelineEventCard.tsx
  - frontend/src/components/timeline/__tests__/TimelineEventCard.test.tsx
  - frontend/src/domains/dossiers/hooks/__tests__/useQuickSwitcherSearch.test.ts
  - frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts
  - frontend/src/i18n/ar/dossier.json
  - frontend/src/i18n/en/dossier-overview.json
  - frontend/src/i18n/en/dossier.json
  - frontend/src/lib/__tests__/timeline-navigation.test.ts
  - frontend/src/lib/timeline-navigation.ts
  - frontend/src/pages/DossierSearchPage.tsx
  - frontend/src/pages/dossiers/overview-cards/BilateralSummaryCard.tsx
  - frontend/src/pages/dossiers/overview-cards/ConnectedAnchorsCard.tsx
  - frontend/src/pages/dossiers/overview-cards/DeliverablesTrackerCard.tsx
  - frontend/src/pages/dossiers/overview-cards/ElectedOfficialCommitteesCard.tsx
  - frontend/src/pages/dossiers/overview-cards/ElectedOfficialOfficeCard.tsx
  - frontend/src/pages/dossiers/overview-cards/EngagementHistoryCard.tsx
  - frontend/src/pages/dossiers/overview-cards/EngagementsByStageCard.tsx
  - frontend/src/pages/dossiers/overview-cards/ForumMetadataCard.tsx
  - frontend/src/pages/dossiers/overview-cards/ForumSessionsCard.tsx
  - frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx
  - frontend/src/pages/dossiers/overview-cards/KeyRepresentativesCard.tsx
  - frontend/src/pages/dossiers/overview-cards/MeetingScheduleCard.tsx
  - frontend/src/pages/dossiers/overview-cards/MemberListCard.tsx
  - frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx
  - frontend/src/pages/dossiers/overview-cards/MoUStatusCard.tsx
  - frontend/src/pages/dossiers/overview-cards/PersonMetadataCard.tsx
  - frontend/src/pages/dossiers/overview-cards/PositionTrackerCard.tsx
  - frontend/src/pages/dossiers/overview-cards/SharedRecentActivityCard.tsx
  - frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx
  - frontend/src/pages/dossiers/overview-cards/__tests__/OverviewCardErrorStates.test.tsx
  - frontend/src/pages/dossiers/overview-cards/__tests__/SharedRecentActivityCard.test.tsx
  - frontend/src/pages/dossiers/overview-cards/__tests__/TypeCardErrorStates.test.tsx
  - frontend/src/services/__tests__/dossier-overview.service.test.ts
  - frontend/src/services/dossier-overview.service.ts
  - supabase/functions/contextual-suggestions/index.ts
  - supabase/functions/unified-timeline/index.ts
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 66: Code Review Report

**Reviewed:** 2026-06-13T02:55:00Z
**Depth:** standard
**Files Reviewed:** 45
**Status:** issues_found

## Summary

Reviewed the full `main...HEAD` diff for Phase 66 (overview error contract + timeline cross-links): the fail-the-query service rewrite, the `resolveTimelineNavUrl` mounted-route guard and its four consumers, the 19-card `role="alert"` sweep, the drawer error branch, the quick-switcher/search dead-link retargets, the two edge-function emission fixes, and i18n additions.

What holds up under adversarial inspection:

- **Guard URL-safety matrix is sound.** `resolveTimelineNavUrl` rejects non-strings, empty strings, non-`/`-prefixed input (kills `https:`, `javascript:`, `mailto:`, `data:`), protocol-relative `//`, and any literal backslash anywhere in the string (`/\evil` variants). Everything accepted is a same-origin relative path; query strings survive only on allowlisted prefixes. I probed hash-fragment, percent-encoded-backslash (`%5C`), embedded-newline, and dot-segment inputs — none escape the origin or loosen R-05/WR-01.
- **Allowlist mountedness verified against `routeTree.gen.ts`.** All 11 prefixes (incl. all 8 dossier segments — `working_groups` underscore, `elected-officials` hyphen) match real `fullPath` entries. No false-accepts found; recents written by `getDossierDetailPath`/`getWorkItemUrl` all pass the guard, so no false suppression of legitimate recent entities.
- **Card error gating matches each hook's data-unavailable shape.** Verified per hook: `useDossierOverview` returns `data: query.data || null` → 16 cards check `data === null` (correct); `useElectedOfficial`/`MoUStatusCard` are raw `useQuery` → `=== undefined` (correct); `useDossierPositionLinks` exposes `error` + `positions` defaulting `[]` → `error != null && !hasPositions` (correct); `useDossierActivityTimeline` flattens to `[]` → `isError && recentActivities.length === 0` (correct). No card has a permanently-stuck or never-firing alert; no early return shadows any error branch. Stale-while-error is implemented consistently across all 19 cards and the drawer.
- **i18n parity holds**: `overview.sectionError` exists in both `en/dossier.json` and `ar/dossier.json`; drawer `error.load_failed_*`/`error.retry` keys exist in both `dossier-drawer.json` files; `dossier-context` `timeline.error/retry` exist in both; EO cards correctly use the colon namespace form (`dossier:overview.sectionError`). Raw PostgREST messages are no longer rendered anywhere in the changed surface.
- All 98 tests in the changed/new test files pass locally. No remaining `/documents/<id>`, `/mous/<id>`, or `/calendar/<id>` emitters exist in frontend src or edge functions.

What does not hold up: one dead-link retarget reintroduces the exact defect class this phase exists to remove (CR-01), the shared edge route helper silently fabricates wrong-type links for two dossier types (WR-01), and the command-palette merge trims results before suppression (WR-02). Details below.

## Critical Issues

### CR-01: DossierSearchPage retargets engagement-context documents to an UNMOUNTED route — dead-end navigation reintroduced

**File:** `frontend/src/pages/DossierSearchPage.tsx:136-141`
**Issue:** The `document` case now builds `/dossiers/${getDossierRouteSegment(item.dossier_context.type)}/${item.dossier_context.id}/docs`. `DossierContext.type` is the full `DossierType` union, which includes `'engagement'` (`frontend/src/lib/dossier-type-guards.ts:33`). For an engagement-context document this produces `/dossiers/engagements/<id>/docs`, which is **unmounted** — `routeTree.gen.ts` has `/dossiers/engagements/$id` with no `/docs` child. Clicking such a result dead-ends on notFound — the exact OVRERR-02/A-8 failure this phase removes elsewhere. The sibling implementation in the same diff (`getWorkItemUrl`, `useQuickSwitcherSearch.ts:107-112`) explicitly documents and suppresses this case ("Mounted docs tabs exist for the 7 dossier types but NOT under /dossiers/engagements — suppress those"), so the two retargets shipped in this phase contradict each other.
**Fix:** Mirror the quick-switcher disposition. Since a click handler must do something, fall back to the mounted engagement-dossier detail page rather than the unmounted docs tab:

```tsx
case 'document': {
  // /documents/$id is UNMOUNTED. Engagement dossiers have no /docs tab —
  // fall back to the mounted engagement dossier detail (A-8).
  const ctx = item.dossier_context
  navigate({
    to:
      ctx.type === 'engagement'
        ? `/dossiers/engagements/${ctx.id}`
        : `/dossiers/${getDossierRouteSegment(ctx.type)}/${ctx.id}/docs`,
  })
  break
}
```

## Warnings

### WR-01: Edge `_shared/dossier-routes.ts` silently emits wrong-type links for `elected_official` and camel-case types — undermines the guarded emission contract

**File:** `supabase/functions/_shared/dossier-routes.ts:12-32` (consumed by the changed emission lines `supabase/functions/unified-timeline/index.ts:240,307`)
**Issue:** Two gaps in the helper that the phase's interaction/intelligence `navigation_url` emissions now route through:

1. `DOSSIER_TYPE_TO_ROUTE` is missing `elected_official: 'elected-officials'` (the frontend twin in `frontend/src/lib/dossier-routes.ts` has it).
2. Normalization is `type.toLowerCase().replace(/\s+/g, '_')`, so the PascalCase value `'WorkingGroup'` (a legal `dossierType` in `useUnifiedTimeline`'s union) becomes `'workinggroup'`, misses the map, and hits the `?? 'countries'` fallback.
   In both cases the helper fabricates `/dossiers/countries/<non-country-id>` — a wrong-type link the client guard ACCEPTS (it matches the countries prefix), so the user lands on a country detail page with a foreign id instead of being suppressed. Latent today (no live caller currently passes `WorkingGroup`/`elected_official` into `unified-timeline` — verified callers pass `Engagement`/`Country`/`Person`/`Organization`), but the silent-fallback design defeats the suppress-don't-dead-end contract the moment a new timeline consumer appears.
   **Fix:** Add the `elected_official` entry; insert an underscore between camel humps before lowercasing (`type.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()`); and have `getDossierDetailPath` return `null` (caller emits `navigation_url: null` → client suppresses) instead of falling back to `'countries'`.

### WR-02: CommandPalette `relatedWork` slices to 3 BEFORE suppression-filtering — suppressed items consume display slots

**File:** `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:471-485`
**Issue:** The memo builds `merged = [...api, ...cacheExtras].slice(0, 3)` and only then applies `.filter((item) => getWorkItemUrl(item) !== null)`. Suppressed items (documents without context / engagement-context documents) occupy the 3 result slots, so the palette can show 0-2 related-work rows — or none at all — while valid items beyond index 2 were silently discarded. Additionally, the rewrite moved `new Set(apiRelatedWork.map(...))` **inside** the filter callback, rebuilding the set per cached item (the pre-diff code hoisted it).
**Fix:**

```tsx
const seen = new Set(apiRelatedWork.map((a) => a.id))
const merged =
  apiRelatedWork.length > 0
    ? [...apiRelatedWork, ...cachedResults.cachedWorkItems.filter((w) => !seen.has(w.id))]
    : cachedResults.cachedWorkItems
return merged.filter((item) => getWorkItemUrl(item) !== null).slice(0, 3)
```

### WR-03: Uncommitted working-tree edits to a deployed edge function

**File:** `supabase/functions/contextual-suggestions/index.ts` (working tree vs HEAD)
**Issue:** `git status` shows uncommitted modifications to this file — a format-only sweep (semicolon removal, interface reformatting) on top of the committed `action_route: '/mous'` fix. The phase records this function as "(deployed)"; Supabase CLI deploys from disk, so the deployed artifact and the committed source now differ, and the format diff risks riding into an unrelated future commit or being clobbered (`git checkout` on a dirty file is unrecoverable — this repo has prior history of exactly that loss mode).
**Fix:** Commit the formatting change deliberately (e.g. `chore(66): format contextual-suggestions`) or revert the working tree to HEAD before the orchestrator's commit step.

### WR-04: "Recent Entities" group can render as an empty labeled group when every visible recent is suppressed

**File:** `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:1124,1131-1132`
**Issue:** The group renders when `entityRecentItems.length > 0`, but the per-item guard (`resolveTimelineNavUrl(item.url)` → `return null`) is applied inside the `.slice(0, 5).map(...)`. If all of the first 5 persisted recents are stale dead targets (the precise localStorage state T-66-04 anticipates after this phase ships), the palette renders the "Recent Entities" heading + separator with zero rows. Items 6-10 that would pass the guard never get a chance to fill the 5 slots either.
**Fix:** Pre-filter before gating and slicing:

```tsx
const safeRecents = entityRecentItems
  .map((item) => ({ item, safeUrl: resolveTimelineNavUrl(item.url) }))
  .filter((r): r is { item: RecentItem; safeUrl: string } => r.safeUrl !== null)
// render gate: safeRecents.length > 0; map over safeRecents.slice(0, 5)
```

## Info

### IN-01: Up to 6+ simultaneous identical `role="alert"` announcements on a single failure

**File:** `frontend/src/pages/dossiers/overview-cards/*.tsx` (all 19 error lines)
**Issue:** Overview tabs mount many cards whose queries fail together when the backend is down (several share the same underlying service). Each emits its own `role="alert"` with identical copy, so screen readers receive a burst of duplicate assertive announcements.
**Fix:** Consider `role="alert"` only on the first/primary card per tab and `role="status"`/`aria-live="polite"` on the rest, or a single page-level alert region.

### IN-02: `navigate()` floating promises in the two timeline cards — inconsistent with ActivityList

**File:** `frontend/src/components/timeline/TimelineEventCard.tsx:123-127`, `frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx:200-205`
**Issue:** Both `handleNavigate` bodies call `navigate({ to: navUrl })` without `void`, while the same-diff `ActivityList.tsx:124` uses `void navigate(...)`. The project enforces `@typescript-eslint/no-floating-promises` at error level; these files are evidently exempt today, but the changed lines perpetuate the inconsistency.
**Fix:** `void navigate({ to: navUrl })` in both handlers.

### IN-03: `timeline-navigation.ts` — dead `?? raw` and unstripped hash fragments

**File:** `frontend/src/lib/timeline-navigation.ts:33-34`
**Issue:** `raw.split('?')[0] ?? raw` — `split` always returns at least one element, so `?? raw` is dead code. Hash fragments are not stripped, so `#`-suffixed URLs on exactly-anchored routes (e.g. `/mous#section`) are rejected as unmounted — a benign false-negative, but undocumented in the guard's contract comment.
**Fix:** `const pathOnly = raw.split(/[?#]/)[0]!` (and drop the `?? raw`), or document that fragments are intentionally treated as unmounted.

### IN-04: Server now emits `navigation_url: null` but the frontend type says `navigation_url?: string`

**File:** `supabase/functions/unified-timeline/index.ts:179` vs `frontend/src/types/timeline.types.ts:56`
**Issue:** The calendar-event suppression emits an explicit `null`, while `UnifiedTimelineEvent['metadata']['navigation_url']` is typed `string | undefined`. Runtime is safe (`resolveTimelineNavUrl` takes `unknown` and rejects non-strings), but the type now lies about the wire shape, and any future consumer trusting the type (`navUrl.startsWith(...)` after a truthiness-free narrow) would be misled.
**Fix:** Widen the type to `navigation_url?: string | null`.

---

_Reviewed: 2026-06-13T02:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
