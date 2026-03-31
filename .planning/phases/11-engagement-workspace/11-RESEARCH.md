# Phase 11: Engagement Workspace - Research

**Researched:** 2026-03-31
**Domain:** TanStack Router nested layouts, tabbed workspace architecture, lifecycle visualization, RTL-aware UI composition
**Confidence:** HIGH

## Summary

Phase 11 transforms the current single-page `EngagementDetailPage` into a persistent, tabbed workspace with URL-driven nested routes. The existing codebase already has all major building blocks: `useLifecycleHistory`, `useLifecycleTransition`, `useEngagementKanban`, `useEngagementBriefs`, `useEngagementRecommendations`, `LifecycleStepperBar`, `EngagementKanbanDialog`, and the `Tabs` UI component. The primary work is **route restructuring** (converting the `$engagementId.tsx` flat route into a layout route with 6 child tab routes) and **building the WorkspaceShell** container component.

The events API (`GET /api/events`) does NOT currently support `engagement_id` filtering -- this is a confirmed blocker from STATE.md. The Calendar tab will need either a backend endpoint extension or client-side filtering of engagement dates. The activity stream table also lacks an engagement-scoped query endpoint.

**Primary recommendation:** Restructure the TanStack Router file tree so `$engagementId.tsx` becomes a layout route rendering `WorkspaceShell` with `<Outlet />`, and create 6 lazy-loaded child route files (`overview.tsx`, `context.tsx`, `tasks.tsx`, `calendar.tsx`, `docs.tsx`, `audit.tsx`). Reuse existing hooks and components rather than building new data-fetching logic.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- D-01: Overview tab is a summary dashboard -- key metrics at top (stage, dates, task progress), participants list, recent activity feed, and quick-action buttons (transition stage, log after-action). Not a migration of the current detail page.
- D-02: Context tab is the intelligence/prep sheet -- linked dossier badges, country/org positions on the topic, AI-generated recommendations (reuse `useEngagementRecommendations`), and talking points.
- D-03: Tasks tab is a full Kanban board embedded in the workspace (reuse `useEngagementKanban` hook with columns + drag-and-drop). Replaces the current dialog-based `EngagementKanbanDialog` with an inline tab view.
- D-04: Calendar, Docs, and Audit tabs are Claude's discretion -- Calendar: engagement dates + linked events; Docs: briefs (AI + legacy via `useEngagementBriefs`) + uploaded files; Audit: lifecycle transition history (`useLifecycleHistory`) + activity log.
- D-05: Stage summaries shown via popover on click -- displays who transitioned, when, transition note, time spent in stage.
- D-06: Stage transitions via click any stage -- click any future or past stage chip opens a confirmation dialog with optional note field. Uses `useLifecycleTransition` mutation hook.
- D-07: Canonical workspace URL is `/engagements/$id/...` with nested tab routes: overview, context, tasks, calendar, docs, audit. Default route redirects to overview.
- D-08: `/dossiers/engagements/$id` redirects to `/engagements/$id` -- the dossier route becomes a redirect, not a duplicate.
- D-09: Build a new WorkspaceShell component specifically for engagements. `DossierDetailLayout` stays untouched for Phase 12.
- D-10: Workspace tabs on mobile use horizontal scroll -- all 6 tabs in a horizontally scrollable row that sticks below the lifecycle bar.
- D-11: LifecycleBar on mobile uses compact chips -- abbreviated labels (Int, Prep, Brf, Exec, F/U, Cls) in a scrollable row.

### Claude's Discretion

- Calendar tab content and layout
- Docs tab content and layout (briefs + files)
- Audit tab content and layout (lifecycle history + activity)
- Loading skeletons per tab
- Empty states per tab

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                              | Research Support                                                                                                                                                                                                                                                         |
| ------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WORK-01 | WorkspaceShell with persistent tab navigation (Overview, Context, Tasks, Calendar, Docs, Audit)          | TanStack Router layout route pattern with `<Outlet />` + sticky tab bar. Existing `Tabs` component (heroui-tabs.tsx) provides visual tab primitives, but workspace tabs will be `<Link>` elements for URL routing instead of Radix tab triggers.                         |
| WORK-02 | LifecycleBar at top of workspace showing all 6 stages with current stage highlighted                     | Existing `LifecycleStepperBar` component (fully built in Phase 9) handles this completely. Already has LtrIsolate wrapper, mobile scroll, tooltips, and transition logic.                                                                                                |
| WORK-03 | Click completed lifecycle stages to see summary; click current stage to see pending items                | Existing stepper has tooltips for completed stages. Decision D-05 upgrades these to popovers. Existing `Popover` component available at `components/ui/popover.tsx`.                                                                                                     |
| WORK-04 | Overview tab shows engagement summary, participants, key decisions, and "what's next" action card        | Current `EngagementDetailPage` has overview, participants, agenda, outcomes tabs that can be distilled into a single summary dashboard. Reuse `useEngagement` hook data.                                                                                                 |
| WORK-05 | Context tab shows linked dossiers organized by tier with [+ Link Dossier] action                         | `useEngagementRecommendations` hook exists. `useDossier` fetches linked dossiers. `DossierContextBadge` component available.                                                                                                                                             |
| WORK-06 | Tasks tab shows scoped kanban filtered to this engagement, with columns grouped by lifecycle stage       | `useEngagementKanban(engagementId)` hook returns columns, stats, handleDragEnd. `EngagementKanbanDialog` has full kanban UI that can be extracted into inline component. Multiple kanban board components exist (`UnifiedKanbanBoard`, `KanbanBoard`, `kibo-ui/kanban`). |
| WORK-07 | Calendar tab shows events for this engagement only, with conflict detection and [+ Add Event] pre-linked | **BLOCKER**: Events API (`GET /api/events`) does NOT support `engagement_id` filter. Need backend extension. Conflict detection endpoint (`POST /api/events/conflicts`) exists.                                                                                          |
| WORK-08 | Docs tab shows documents organized by stage with upload capability and "Generate Briefing" AI action     | `useEngagementBriefs` hook fully implemented. `useGenerateEngagementBrief` mutation available. `EngagementBriefsSection` component already renders brief list.                                                                                                           |
| WORK-09 | Audit tab shows activity timeline scoped to this engagement with stage transitions logged                | `useLifecycleHistory(engagementId)` returns transition records. `LifecycleTimeline` component renders transitions. Activity stream table exists but lacks engagement-scoped endpoint.                                                                                    |
| WORK-10 | Workspace tabs are URL-driven (nested routes) enabling deep-linking to specific tabs                     | TanStack Router file-based routing supports this via layout route pattern. Existing `_protected.tsx` and `engagements.tsx` demonstrate the `<Outlet />` pattern.                                                                                                         |

</phase_requirements>

## Standard Stack

### Core (Already in Project)

| Library                 | Version | Purpose                                    | Why Standard                                                                            |
| ----------------------- | ------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| @tanstack/react-router  | v5      | URL-driven tab routes via nested layouts   | Already the project router; file-based routing with layout routes is the native pattern |
| @tanstack/react-query   | v5      | Data fetching for all tab content          | Already used by all engagement hooks                                                    |
| @radix-ui/react-tabs    | latest  | Visual tab component primitives            | Already wrapped in `heroui-tabs.tsx`                                                    |
| @radix-ui/react-popover | latest  | Stage summary popovers                     | Already available as `components/ui/popover.tsx`                                        |
| @dnd-kit/core           | latest  | Kanban drag-and-drop in Tasks tab          | Already used by existing kanban boards                                                  |
| lucide-react            | latest  | Icons throughout workspace                 | Already the project icon library                                                        |
| react-i18next           | latest  | Bilingual labels for all workspace content | Already the i18n framework                                                              |

### Supporting

| Library                  | Version | Purpose                             | When to Use                         |
| ------------------------ | ------- | ----------------------------------- | ----------------------------------- |
| class-variance-authority | latest  | Tab and stage chip variants         | Already used by LifecycleStepperBar |
| sonner                   | latest  | Toast notifications for transitions | Already used by lifecycle hooks     |

### Alternatives Considered

| Instead of                  | Could Use        | Tradeoff                                                                                                   |
| --------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| URL-driven tabs (router)    | Radix Tabs state | Radix tabs are simpler but lose deep-linking and code-splitting -- decision D-07 locks URL-driven approach |
| Popover for stage summaries | Dialog/Modal     | Dialog is heavier, popover is lighter and keeps context -- decision D-05 locks popover                     |

**Installation:** No new packages needed. All libraries already installed.

## Architecture Patterns

### Recommended Route Structure

```
frontend/src/routes/_protected/
  engagements.tsx                        # Layout: <Outlet /> (unchanged for list)
  engagements/
    index.tsx                            # /engagements → EngagementsListPage (unchanged)
    $engagementId.tsx                    # CONVERT to layout: WorkspaceShell + <Outlet />
    $engagementId/
      index.tsx                          # /engagements/:id → redirect to overview
      overview.tsx                       # /engagements/:id/overview (lazy)
      context.tsx                        # /engagements/:id/context (lazy)
      tasks.tsx                          # /engagements/:id/tasks (lazy)
      calendar.tsx                       # /engagements/:id/calendar (lazy)
      docs.tsx                           # /engagements/:id/docs (lazy)
      audit.tsx                          # /engagements/:id/audit (lazy)
      after-action.tsx                   # /engagements/:id/after-action (KEEP existing)
```

### Recommended Component Structure

```
frontend/src/components/workspace/
  WorkspaceShell.tsx          # Layout shell: header + lifecycle bar + tab nav + <Outlet />
  WorkspaceTabNav.tsx         # Horizontal tab navigation using <Link> elements
  LifecycleBar.tsx            # Enhanced LifecycleStepperBar with popover summaries
frontend/src/pages/engagements/workspace/
  OverviewTab.tsx             # Summary dashboard tab content
  ContextTab.tsx              # Intelligence/prep sheet tab content
  TasksTab.tsx                # Inline kanban board tab content
  CalendarTab.tsx             # Engagement calendar tab content
  DocsTab.tsx                 # Briefs + files tab content
  AuditTab.tsx                # Lifecycle transitions + activity log tab content
```

### Pattern 1: Layout Route with WorkspaceShell

**What:** The `$engagementId.tsx` route becomes a layout route that renders the WorkspaceShell (header, lifecycle bar, tab navigation) and uses `<Outlet />` for active tab content.
**When to use:** For any entity workspace that needs persistent chrome with nested tab content.
**Example:**

```typescript
// frontend/src/routes/_protected/engagements/$engagementId.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'

export const Route = createFileRoute('/_protected/engagements/$engagementId')({
  component: EngagementWorkspaceLayout,
})

function EngagementWorkspaceLayout(): React.ReactElement {
  const { engagementId } = Route.useParams()

  return (
    <WorkspaceShell engagementId={engagementId}>
      <Outlet />
    </WorkspaceShell>
  )
}
```

### Pattern 2: URL-Driven Tab Navigation with <Link>

**What:** Tab navigation uses TanStack Router `<Link>` components instead of Radix tab triggers. The active tab is determined by the current URL path, not component state.
**When to use:** When tabs correspond to distinct routes and need deep-linking.
**Example:**

```typescript
// WorkspaceTabNav.tsx
import { Link, useMatchRoute } from '@tanstack/react-router'

const TABS = [
  { key: 'overview', labelKey: 'workspace.tabs.overview', path: 'overview' },
  { key: 'context', labelKey: 'workspace.tabs.context', path: 'context' },
  { key: 'tasks', labelKey: 'workspace.tabs.tasks', path: 'tasks' },
  { key: 'calendar', labelKey: 'workspace.tabs.calendar', path: 'calendar' },
  { key: 'docs', labelKey: 'workspace.tabs.docs', path: 'docs' },
  { key: 'audit', labelKey: 'workspace.tabs.audit', path: 'audit' },
] as const

function WorkspaceTabNav({ engagementId }: { engagementId: string }): ReactElement {
  const matchRoute = useMatchRoute()

  return (
    <nav className="flex overflow-x-auto gap-1 border-b bg-muted/50 px-4 sticky top-[header-height] z-10">
      {TABS.map((tab) => {
        const isActive = matchRoute({
          to: '/engagements/$engagementId/' + tab.path,
          params: { engagementId },
        })

        return (
          <Link
            key={tab.key}
            to={`/engagements/$engagementId/${tab.path}`}
            params={{ engagementId }}
            className={cn(
              'whitespace-nowrap px-3 py-2 text-sm font-medium min-h-11 min-w-11',
              'snap-center rounded-t-md transition-colors',
              isActive
                ? 'border-b-2 border-primary text-primary bg-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(tab.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
```

### Pattern 3: Lazy-Loaded Tab Routes

**What:** Each tab route file uses `React.lazy()` to code-split tab content.
**When to use:** All workspace tabs to meet the 200KB bundle budget constraint.
**Example:**

```typescript
// frontend/src/routes/_protected/engagements/$engagementId/tasks.tsx
import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const TasksTab = lazy(() => import('@/pages/engagements/workspace/TasksTab'))

export const Route = createFileRoute('/_protected/engagements/$engagementId/tasks')({
  component: () => (
    <Suspense fallback={<TabSkeleton type="kanban" />}>
      <TasksTab />
    </Suspense>
  ),
})
```

### Pattern 4: Dossier Route Redirect

**What:** The existing `/dossiers/engagements/$id` route becomes a redirect to `/engagements/$id/overview`.
**When to use:** Per decision D-08.
**Example:**

```typescript
// frontend/src/routes/_protected/dossiers/engagements/$id.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/engagements/$id')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/engagements/$engagementId/overview',
      params: { engagementId: params.id },
    })
  },
})
```

### Pattern 5: LifecycleBar Popover Enhancement

**What:** Upgrade completed stage tooltips to popovers showing transition details (who, when, note, time spent).
**When to use:** Per decision D-05.
**Example:**

```typescript
// Replace Tooltip with Popover for completed stages
<Popover>
  <PopoverTrigger asChild>{stageButton}</PopoverTrigger>
  <PopoverContent className="w-64 p-3">
    <div className="space-y-2">
      <p className="text-sm font-medium">{t(`stages.${stage}`)}</p>
      <p className="text-xs text-muted-foreground">
        {t('lifecycle.transitionedBy', { name: transition.user_name })}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatEntryDate(transition.transitioned_at)}
      </p>
      {transition.note && (
        <p className="text-xs italic">{transition.note}</p>
      )}
      {transition.duration_in_stage_seconds && (
        <p className="text-xs">
          {t('lifecycle.timeInStage', { duration: formatDuration(transition.duration_in_stage_seconds) })}
        </p>
      )}
    </div>
  </PopoverContent>
</Popover>
```

### Anti-Patterns to Avoid

- **Client-side tab state instead of routes:** Decision D-07 explicitly requires URL-driven tabs. Do NOT use `useState` for active tab -- use TanStack Router nested routes.
- **Loading all tabs eagerly:** Each tab must be lazy-loaded via `React.lazy()` to keep bundle size within budget. Current page loads everything at once.
- **Duplicating data-fetching logic:** All engagement domain hooks (`useEngagementKanban`, `useEngagementBriefs`, `useLifecycleHistory`, etc.) already exist. Do NOT create new API calls.
- **Modifying DossierDetailLayout:** Decision D-09 explicitly says leave it untouched for Phase 12.
- **Breaking after-action route:** The `/engagements/$engagementId/after-action` child route must continue working in the new nested route structure.

## Don't Hand-Roll

| Problem                   | Don't Build                   | Use Instead                                                | Why                                                                        |
| ------------------------- | ----------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| Kanban board              | Custom drag-and-drop grid     | `useEngagementKanban` hook + existing kanban UI components | Hook already handles columns, stats, drag-end mutation, query invalidation |
| AI briefing generation    | Custom API integration        | `useGenerateEngagementBrief` + `useEngagementBriefs`       | Full mutation with toast notifications, cache invalidation already built   |
| Lifecycle transitions     | Custom stage mutation logic   | `useLifecycleTransition(engagementId)`                     | Handles mutation, cache invalidation, toast, error handling                |
| Lifecycle history display | Custom timeline renderer      | `LifecycleTimeline` component                              | Already renders transitions with user info, dates, notes                   |
| AI recommendations        | Custom recommendation fetcher | `useEngagementRecommendations`                             | Infinite query support, stats, filtering, feedback mutations               |
| Tab primitives            | Custom tab styling            | `heroui-tabs.tsx` exports                                  | Radix-based, accessible, RTL-aware, dark mode ready                        |
| Popover UI                | Custom overlay                | `components/ui/popover.tsx`                                | Already has Radix Popover with proper positioning                          |
| LTR isolation for stepper | Custom direction wrapper      | `LtrIsolate` component                                     | Already handles the LTR rendering for lifecycle bars                       |

**Key insight:** Phase 9 and 10 built nearly all the data hooks and visual components needed. Phase 11's primary work is **composition and routing**, not building new features.

## Common Pitfalls

### Pitfall 1: Route Parameter Name Mismatch

**What goes wrong:** The existing route uses `$engagementId` as the param name, but the dossier route uses `$id`. When redirecting, the param name must match the target route's definition.
**Why it happens:** Two different route trees (`engagements/$engagementId` vs `dossiers/engagements/$id`) use different param names.
**How to avoid:** In the redirect from `/dossiers/engagements/$id`, explicitly map `params.id` to `engagementId` in the redirect target.
**Warning signs:** "Missing required param" errors during navigation.

### Pitfall 2: WorkspaceShell Re-rendering on Tab Switch

**What goes wrong:** If the WorkspaceShell fetches engagement data inside itself, it re-fetches on every tab navigation because the component re-renders.
**Why it happens:** TanStack Router re-renders the layout route component when child routes change.
**How to avoid:** Use TanStack Query with appropriate `staleTime` (30s+) so the engagement data query returns from cache during tab switches. The layout component should memoize appropriately.
**Warning signs:** Flicker on tab switch, repeated API calls in network tab.

### Pitfall 3: Sticky Tab Navigation Z-Index Conflicts

**What goes wrong:** The sticky header, lifecycle bar, and tab navigation stack vertically. If z-index values conflict, elements overlap incorrectly during scroll.
**Why it happens:** The existing header uses `sticky top-0 z-10`. Adding two more sticky elements (lifecycle bar, tab nav) requires careful z-index layering.
**How to avoid:** Use a single sticky container for the entire workspace chrome (header + lifecycle + tabs) with one z-index, or use explicit z-index values: header z-20, lifecycle z-15, tabs z-10.
**Warning signs:** Tab bar disappearing behind content, lifecycle bar overlapping header on scroll.

### Pitfall 4: Mobile Horizontal Scroll Tab Not Showing Active Tab

**What goes wrong:** On mobile, the 6 tabs are in a horizontal scroll container. When deep-linking to a tab like `/engagements/123/audit`, the active tab (Audit, the 6th) is off-screen.
**Why it happens:** The scroll container doesn't auto-scroll to the active tab on mount.
**How to avoid:** Use `scrollIntoView({ behavior: 'smooth', inline: 'center' })` on the active tab element via a `useEffect` that runs when the active tab changes. Decision D-10 explicitly requires this.
**Warning signs:** User navigates via URL to a tab, but the tab bar shows the first few tabs with the active one hidden to the right.

### Pitfall 5: After-Action Route Breaking

**What goes wrong:** The existing `/engagements/$engagementId/after-action` child route stops working after restructuring.
**Why it happens:** When `$engagementId.tsx` becomes a layout route, its children change. The after-action route must remain a valid child.
**How to avoid:** Keep `after-action.tsx` in the `$engagementId/` directory. It renders WITHOUT the workspace tabs (it's a full-page form). This may require conditional tab navigation hiding in WorkspaceShell, or the after-action route can opt out of the workspace layout by using a different rendering approach.
**Warning signs:** After-action form shows with workspace tabs visible (incorrect), or navigating to after-action throws a route error.

### Pitfall 6: Events API Missing Engagement Filter

**What goes wrong:** Calendar tab cannot show engagement-scoped events because `GET /api/events` has no `engagement_id` filter parameter.
**Why it happens:** Events API was built for general event management, not engagement-scoped views.
**How to avoid:** Either (a) extend the backend `eventFiltersSchema` to accept `engagement_id` and add a WHERE clause in EventService, or (b) use the engagement's own dates (start_date, end_date) as the calendar's primary content and show linked events as secondary items fetched via date range.
**Warning signs:** Calendar tab shows all events or no events instead of engagement-specific ones.

### Pitfall 7: RTL Tab Order

**What goes wrong:** Tab navigation renders in wrong order on RTL.
**Why it happens:** The project uses `I18nManager.forceRTL(true)` concepts (web equivalent: `dir="rtl"` on containers). If tab nav uses `flexDirection: row`, tabs will flow right-to-left.
**How to avoid:** Tab navigation should use `dir` from `useDirection()` hook. The first tab (Overview) should appear at the reading start (right in RTL). Since tabs are navigation links, the natural flex-row with RTL direction should work correctly. Use logical properties (`ps-*`, `pe-*`) for padding.
**Warning signs:** Tab order appears reversed, or Overview tab is on the left in RTL mode.

## Code Examples

### Existing Hooks Available for Reuse

```typescript
// All from frontend/src/domains/engagements/hooks/

// Kanban board (Tasks tab)
import { useEngagementKanban } from '@/domains/engagements/hooks/useEngagementKanban'
const { columns, stats, handleDragEnd, isLoading } = useEngagementKanban(engagementId)

// Briefs (Docs tab)
import {
  useEngagementBriefs,
  useGenerateEngagementBrief,
} from '@/domains/engagements/hooks/useEngagementBriefs'
const { data: briefs, isLoading } = useEngagementBriefs(engagementId)
const generateBrief = useGenerateEngagementBrief()

// AI Recommendations (Context tab)
import { useEngagementRecommendations } from '@/domains/engagements/hooks/useEngagementRecommendations'
const { data: recommendations } = useEngagementRecommendations({ target_dossier_id: engagementId })

// Lifecycle (LifecycleBar + Audit tab)
import {
  useLifecycleHistory,
  useLifecycleTransition,
} from '@/domains/engagements/hooks/useLifecycle'
const { data: transitions } = useLifecycleHistory(engagementId)
const { mutate: transitionStage } = useLifecycleTransition(engagementId)

// Engagement data (WorkspaceShell header)
import { useEngagement } from '@/hooks/useEngagements'
const { data: engagementData, isLoading } = useEngagement(engagementId)
```

### Existing Components Available for Reuse

```typescript
// Lifecycle stepper (already built in Phase 9)
import { LifecycleStepperBar } from '@/components/engagements/LifecycleStepperBar'

// Lifecycle transition timeline (already built)
import { LifecycleTimeline } from '@/components/engagements/LifecycleTimeline'

// Briefs section (already built)
import { EngagementBriefsSection } from '@/components/engagements/EngagementBriefsSection'

// Kanban board (existing dialog content can be extracted)
import { EngagementKanbanDialog } from '@/components/assignments/EngagementKanbanDialog'

// Interactive timeline (for audit tab)
import { InteractiveTimeline } from '@/components/timeline'

// UI primitives
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
```

### i18n Namespace Pattern

```typescript
// Create new namespace: workspace.json (en + ar)
{
  "tabs": {
    "overview": "Overview",
    "context": "Context",
    "tasks": "Tasks",
    "calendar": "Calendar",
    "docs": "Docs",
    "audit": "Audit"
  },
  "overview": {
    "whatsNext": "What's Next",
    "keyMetrics": "Key Metrics",
    "participants": "Participants",
    "recentActivity": "Recent Activity"
  },
  "empty": {
    "tasks": "No tasks for this engagement",
    "calendar": "No events scheduled",
    "docs": "No documents yet",
    "audit": "No activity recorded"
  },
  "mobile": {
    "stageAbbrev": {
      "intake": "Int",
      "preparation": "Prep",
      "briefing": "Brf",
      "execution": "Exec",
      "follow_up": "F/U",
      "closed": "Cls"
    }
  }
}
```

## State of the Art

| Old Approach                 | Current Approach                     | When Changed          | Impact                                                           |
| ---------------------------- | ------------------------------------ | --------------------- | ---------------------------------------------------------------- |
| `useState` for active tab    | URL-driven nested routes             | TanStack Router v5    | Deep-linking, code-splitting per tab, browser back/forward works |
| Monolithic detail page       | Layout route + child tab routes      | Current best practice | Each tab lazy-loaded, shell persists across tabs                 |
| Dialog-based kanban          | Inline embedded kanban               | Decision D-03         | Better UX, full-width kanban, no modal context loss              |
| Tooltip for completed stages | Popover with full transition details | Decision D-05         | Richer information display without leaving page                  |

## Open Questions

1. **Calendar tab data source**
   - What we know: Events API has no `engagement_id` filter. Engagement has `start_date` and `end_date` fields.
   - What's unclear: Should we extend the backend events API, or show engagement dates + linked events via date-range query, or build a lightweight engagement-specific calendar from engagement dates only?
   - Recommendation: Extend `eventFiltersSchema` in `backend/src/api/events.ts` to accept `engagement_id` param. This is a small backend change (add to zod schema + WHERE clause). Alternatively, for MVP, show engagement's own dates as the primary calendar content.

2. **Activity stream for audit tab**
   - What we know: `activity_stream` table exists in database types but no engagement-scoped endpoint is exposed.
   - What's unclear: Whether to build a new endpoint or use `useLifecycleHistory` as the sole audit data source.
   - Recommendation: For MVP, use `useLifecycleHistory` + `LifecycleTimeline` as the primary audit view. The `InteractiveTimeline` component (already used on current detail page) can supplement this. A dedicated activity stream endpoint can be added later.

3. **After-action route within workspace**
   - What we know: `/engagements/$engagementId/after-action` exists as a child route. It's a full-page form, not a tab.
   - What's unclear: Should it render within the WorkspaceShell (with tabs hidden) or bypass the workspace layout entirely?
   - Recommendation: Keep it as a child route of `$engagementId`. In WorkspaceShell, detect when the current route is `after-action` and hide the tab navigation. The lifecycle bar can remain visible for context.

4. **Operations Hub link updates**
   - What we know: Dashboard components link to `/engagements/${engagement.id}` (no tab suffix). These will hit the index route which should redirect to `/overview`.
   - What's unclear: Should we update all existing links to include `/overview`, or rely on the index redirect?
   - Recommendation: Use the index redirect pattern. This is cleaner and means existing links work without modification. Only update links if they need to target a specific tab.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). This phase is purely frontend code/config changes reusing existing libraries. All required packages are already installed.

## Validation Architecture

### Test Framework

| Property           | Value                                               |
| ------------------ | --------------------------------------------------- |
| Framework          | Vitest + @testing-library/react                     |
| Config file        | `frontend/vitest.config.ts`                         |
| Quick run command  | `cd frontend && pnpm vitest run --reporter=verbose` |
| Full suite command | `cd frontend && pnpm test`                          |

### Phase Requirements to Test Map

| Req ID  | Behavior                                                  | Test Type   | Automated Command                                                                | File Exists? |
| ------- | --------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------- | ------------ |
| WORK-01 | WorkspaceShell renders with tab navigation                | unit        | `cd frontend && pnpm vitest run src/__tests__/workspace/WorkspaceShell.test.tsx` | Wave 0       |
| WORK-02 | LifecycleBar shows all 6 stages                           | unit        | `cd frontend && pnpm vitest run src/__tests__/workspace/LifecycleBar.test.tsx`   | Wave 0       |
| WORK-03 | Popover shows transition summary on completed stage click | unit        | `cd frontend && pnpm vitest run src/__tests__/workspace/LifecycleBar.test.tsx`   | Wave 0       |
| WORK-04 | Overview tab renders summary dashboard                    | unit        | `cd frontend && pnpm vitest run src/__tests__/workspace/OverviewTab.test.tsx`    | Wave 0       |
| WORK-05 | Context tab shows linked dossiers                         | unit        | `cd frontend && pnpm vitest run src/__tests__/workspace/ContextTab.test.tsx`     | Wave 0       |
| WORK-06 | Tasks tab shows kanban board                              | unit        | `cd frontend && pnpm vitest run src/__tests__/workspace/TasksTab.test.tsx`       | Wave 0       |
| WORK-07 | Calendar tab shows engagement events                      | unit        | `cd frontend && pnpm vitest run src/__tests__/workspace/CalendarTab.test.tsx`    | Wave 0       |
| WORK-08 | Docs tab shows briefs with generate action                | unit        | `cd frontend && pnpm vitest run src/__tests__/workspace/DocsTab.test.tsx`        | Wave 0       |
| WORK-09 | Audit tab shows lifecycle transitions                     | unit        | `cd frontend && pnpm vitest run src/__tests__/workspace/AuditTab.test.tsx`       | Wave 0       |
| WORK-10 | Tab routes are URL-driven and deep-linkable               | integration | `cd frontend && pnpm vitest run src/__tests__/workspace/routing.test.tsx`        | Wave 0       |

### Sampling Rate

- **Per task commit:** `cd frontend && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `cd frontend && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/__tests__/workspace/WorkspaceShell.test.tsx` -- covers WORK-01
- [ ] `frontend/src/__tests__/workspace/LifecycleBar.test.tsx` -- covers WORK-02, WORK-03
- [ ] `frontend/src/__tests__/workspace/OverviewTab.test.tsx` -- covers WORK-04
- [ ] `frontend/src/__tests__/workspace/ContextTab.test.tsx` -- covers WORK-05
- [ ] `frontend/src/__tests__/workspace/TasksTab.test.tsx` -- covers WORK-06
- [ ] `frontend/src/__tests__/workspace/CalendarTab.test.tsx` -- covers WORK-07
- [ ] `frontend/src/__tests__/workspace/DocsTab.test.tsx` -- covers WORK-08
- [ ] `frontend/src/__tests__/workspace/AuditTab.test.tsx` -- covers WORK-09
- [ ] `frontend/src/__tests__/workspace/routing.test.tsx` -- covers WORK-10
- [ ] Test setup for TanStack Router mocking in workspace tests

## Project Constraints (from CLAUDE.md)

- **RTL-first:** All components must use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`). Never use `ml-*`, `mr-*`, `text-left`, `text-right`.
- **Mobile-first:** Tailwind breakpoints base -> sm -> md -> lg. Min 44x44px touch targets (`min-h-11 min-w-11`).
- **HeroUI v3 priority:** Check HeroUI v3 components first, then Aceternity, Kibo-UI, shadcn/ui.
- **Explicit return types:** Required by ESLint rule `@typescript-eslint/explicit-function-return-type`.
- **No explicit any:** Error-level `@typescript-eslint/no-explicit-any`.
- **No floating promises:** Error-level `@typescript-eslint/no-floating-promises`.
- **Single quotes, no semicolons:** Prettier config enforced.
- **Named exports for functions:** Default exports only for React page components.
- **i18n namespace pattern:** Feature-specific namespaces (`workspace`, `lifecycle`, `engagements`).
- **200KB bundle budget:** All workspace tabs must be lazy-loaded via route-based code splitting.
- **LifecycleBar LtrIsolate:** Progress indicators read left-to-right in all languages (already implemented).
- **Work terminology:** Use "Work Item" not "Task/Assignment", "Assignee" not "Owner", "Deadline" not "Due Date", "Priority: urgent" not "critical".

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `frontend/src/routes/_protected/engagements/` -- existing route structure
- Codebase analysis: `frontend/src/domains/engagements/hooks/` -- all reusable hooks verified
- Codebase analysis: `frontend/src/components/engagements/LifecycleStepperBar.tsx` -- existing component verified
- Codebase analysis: `backend/src/api/events.ts` -- confirmed no `engagement_id` filter
- Codebase analysis: `frontend/src/routes/_protected.tsx` -- TanStack Router layout pattern verified

### Secondary (MEDIUM confidence)

- [TanStack Router Routing Concepts](https://tanstack.com/router/latest/docs/routing/routing-concepts) -- layout route patterns
- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/routing/file-based-routing) -- file naming conventions

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already in project, verified in package.json and codebase
- Architecture: HIGH -- TanStack Router layout route pattern verified against existing `_protected.tsx` and `engagements.tsx`
- Pitfalls: HIGH -- based on direct codebase analysis of existing routes, API endpoints, and component structure
- Reusable hooks: HIGH -- all hooks read and verified, signatures documented

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable stack, no upcoming migrations)
