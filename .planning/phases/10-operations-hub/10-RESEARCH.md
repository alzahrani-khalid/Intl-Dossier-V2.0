# Phase 10: Operations Hub - Research

**Researched:** 2026-03-30
**Domain:** Dashboard UI, Supabase RPC, Role-Adaptive Layout, Realtime Subscriptions
**Confidence:** HIGH

## Summary

Phase 10 replaces the existing dossier-centric dashboard (`DashboardPage.tsx`) with a role-adaptive Operations Hub featuring 4 zones: Attention Needed, Timeline, Active Engagements, and Quick Stats + Activity Feed. The existing dashboard uses a Supabase Edge Function (`dossier-dashboard`) with TanStack Query hooks -- the new hub follows the same architecture but with new RPC functions optimized for operations-focused data.

The codebase already provides all necessary infrastructure: `lifecycle_stage` column and `lifecycle_transitions` table (Phase 9), `WorkItem.is_overdue` and `days_until_due` fields, `useResponsive()` hook for responsive layout, `useWorkCreation()` for action bar buttons, `useUnifiedWorkRealtime()` as the realtime subscription pattern, and the `useAuthStore` with `user.role` for role detection. The primary new work is 4 Supabase RPC functions, new frontend zone components, a role-preference system with localStorage, and new i18n translations.

**Primary recommendation:** Build the data layer (RPC functions + backend endpoints) first, then zone components bottom-up (StatCard reuse for Quick Stats, then Timeline, Engagements, Attention), then the orchestrating OperationsHub page with role-adaptive zone ordering, and finally cleanup of old dashboard components.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Priority grid layout on desktop -- Attention Needed spans full width at top, then 2-column row: Timeline (left) + Active Engagements (right), then Quick Stats + Activity Feed at bottom
- **D-02:** Mobile (< 640px) uses stacked collapsible cards in priority order: Attention -> Timeline -> Engagements -> Quick Stats -> Activity. Attention zone always expanded by default
- **D-03:** Empty Attention zone shows compact green success banner
- **D-04:** Quick Stats: 4 metric cards (Active Engagements, Open Tasks, SLA At Risk, Upcoming This Week). Clickable.
- **D-05:** Timeline zone: day-grouped list (Today, Tomorrow, This Week, Next Week). Max 3-5 per section with "Show all"
- **D-06:** Active Engagements: grouped by lifecycle stage with collapsible sections, count badges, top 3-5 per stage
- **D-07:** Recent Activity feed: action-focused items, max 10, reverse chronological
- **D-08:** Page header: title + greeting/date left, action buttons + role switcher right. Sticky on desktop, scrolls on mobile
- **D-09:** Role-based zone ordering: Leadership (Engagements first), Officer (Attention first), Analyst (Timeline first)
- **D-10:** Auto-detect role from `user.role` in auth store. Mapping: admin/manager -> Leadership, officer/user -> Officer, analyst -> Analyst, viewer/undefined -> Officer. Persist in localStorage
- **D-11:** Officer view filters to current user's assigned items only. Leadership and Analyst show all items
- **D-12:** Four Attention item types: overdue work items (red), due-soon 48h (yellow), SLA-at-risk intake (yellow), stalled engagements 14+ days (orange)
- **D-13:** Attention items sorted by severity: Overdue (red) -> SLA At Risk -> Stalled (orange) -> Due Soon (yellow)
- **D-14:** Due soon threshold: 48 hours (hardcoded)
- **D-15:** Stalled threshold: 14 days in any non-terminal stage (uniform, excludes closed)
- **D-16:** Operations Hub completely replaces current dashboard at `/dashboard`. No coexistence
- **D-17:** Delete old dashboard components. Git history preserves them
- **D-18:** New Supabase RPC functions: `get_attention_items`, `get_upcoming_events`, `get_engagement_stage_counts`, `get_dashboard_stats`
- **D-19:** Realtime subscriptions for Attention zone only. Other zones: TanStack Query with staleTime tiers (Timeline/Engagements/Stats 5min, Activity 2min). Refetch on window focus

### Claude's Discretion

- Exact responsive breakpoint for 2-column -> 1-column transition (sm vs md)
- Color palette for severity indicators (exact red/yellow/orange shades)
- Animation/transition for zone collapse/expand on mobile
- Whether stalled engagements show progress bar or text
- Greeting text format (time-of-day aware)
- Whether Quick Stats cards use icons, trend arrows, or just numbers
- Exact RPC function signatures and return types
- How "Show all" links navigate (inline expand vs full page)

### Deferred Ideas (OUT OF SCOPE)

- Configurable "due soon" threshold
- Stage-specific stall thresholds
- "Show team" toggle for Officer view
- Process analytics widgets
- Dashboard widgets drag-and-drop
- Notification integration
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                          | Research Support                                                                                                                                                                                              |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OPS-01 | Attention Needed zone with overdue (red) and due-soon (yellow) items | `WorkItem.is_overdue`, `days_until_due` fields exist; new `get_attention_items` RPC combines overdue + due-soon + SLA risk + stalled; `lifecycle_transitions.duration_in_stage_seconds` for stalled detection |
| OPS-02 | Timeline zone with chronological upcoming events grouped by day      | Existing `GET /api/events/upcoming` and `GET /api/events/calendar` endpoints; new `get_upcoming_events` RPC for engagement-based events; calendar repository pattern                                          |
| OPS-03 | Active Engagements grouped by lifecycle stage with counts            | `engagement_dossiers.lifecycle_stage` column (Phase 9); new `get_engagement_stage_counts` RPC; `LIFECYCLE_STAGES` ordered array and `LIFECYCLE_STAGE_LABELS` bilingual labels                                 |
| OPS-04 | Quick Stats + Recent Activity feed                                   | New `get_dashboard_stats` RPC for counts; adapt `RecentDossierActivity` component pattern for engagement-focused activity; `dossier-dashboard` Edge Function as architecture reference                        |
| OPS-05 | Role-adaptive dashboard defaults with dropdown switcher              | `useAuthStore.user.role` field; role mapping logic; localStorage persistence; zone reordering via dynamic component array                                                                                     |
| OPS-06 | Click-through navigation to relevant entities                        | TanStack Router `useNavigate()` already used in current dashboard; dossier route helpers (`getDossierRouteSegment`)                                                                                           |
| OPS-07 | Action bar with [+ New Engagement], [+ New Request], [Cmd+K]         | `useWorkCreation().openPalette()` already in current dashboard; Cmd+K palette from Phase 8                                                                                                                    |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **RTL/LTR**: Use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`). Never `ml-*`, `mr-*`, `text-left`, `text-right`. Set `dir={isRTL ? 'rtl' : 'ltr'}` on containers
- **Mobile-first**: Start with base (320px+), scale up through breakpoints
- **Touch targets**: Min 44x44px (`min-h-11 min-w-11`)
- **HeroUI v3 first**: Check HeroUI -> Aceternity -> Kibo-UI -> shadcn order for components
- **Code style**: No semicolons, single quotes, trailing commas, 100 char width, explicit return types
- **Explicit return types**: Required on all functions
- **No `any`**: Error-level
- **i18n**: Use `useTranslation` with namespaces
- **Bundle budget**: 200KB -- all dashboard zones must be lazy-loaded (from v3.0 roadmap decision)
- **Work terminology**: Use `WorkItem`, `assignee`, `deadline`, `priority`, `status` per glossary

## Standard Stack

### Core (Already Installed)

| Library         | Version | Purpose                                       | Why Standard                 |
| --------------- | ------- | --------------------------------------------- | ---------------------------- |
| React           | 19+     | UI framework                                  | Project standard             |
| TanStack Query  | v5      | Server state with staleTime tiers             | Phase 7 performance patterns |
| TanStack Router | v5      | URL-driven routing, `useNavigate`             | Project standard             |
| Supabase JS     | latest  | RPC calls, Realtime subscriptions             | Project standard             |
| i18next         | latest  | Bilingual translations (en/ar)                | Project standard             |
| Zustand         | latest  | Auth store (`useAuthStore`)                   | Already stores user role     |
| Tailwind CSS    | v4      | Utility-first styling with logical properties | Project standard             |
| lucide-react    | latest  | Icons for zones, severity, stats              | Already used throughout      |
| motion/react    | latest  | Collapse/expand animations                    | Already in timeline.tsx      |

### Supporting (Already Installed)

| Library                  | Version | Purpose                            | When to Use           |
| ------------------------ | ------- | ---------------------------------- | --------------------- |
| clsx                     | latest  | Conditional classnames             | Severity color logic  |
| class-variance-authority | latest  | Variant management (cva)           | Zone card variants    |
| date-fns                 | latest  | Date grouping, relative formatting | Timeline day grouping |

### No New Dependencies Needed

All required libraries are already installed. This phase is purely new components + RPC functions using existing stack.

## Architecture Patterns

### Recommended Project Structure

```
frontend/src/
  domains/operations-hub/           # NEW domain folder
    types/
      operations-hub.types.ts       # Dashboard zone types, role types
    repositories/
      operations-hub.repository.ts  # API calls (RPC + backend)
    hooks/
      useOperationsHub.ts           # Combined dashboard data hook
      useAttentionItems.ts          # Attention zone query + realtime
      useUpcomingEvents.ts          # Timeline zone query
      useEngagementStages.ts        # Engagement grouping query
      useDashboardStats.ts          # Quick stats query
      useRolePreference.ts          # Role detection + localStorage
  pages/Dashboard/
    OperationsHub.tsx               # Main page component (replaces DashboardPage)
    components/
      ActionBar.tsx                 # Header with greeting + actions + role switcher
      AttentionZone.tsx             # Overdue/due-soon/SLA/stalled items
      AttentionItem.tsx             # Individual attention item card
      TimelineZone.tsx              # Day-grouped upcoming events
      TimelineEventCard.tsx         # Individual event card
      EngagementsZone.tsx           # Lifecycle stage groups
      EngagementStageGroup.tsx      # Collapsible stage section
      QuickStatsBar.tsx             # 4 metric cards row
      QuickStatCard.tsx             # Individual metric card (adapt StatCard)
      ActivityFeed.tsx              # Recent activity list
      ActivityFeedItem.tsx          # Individual activity item
      ZoneCollapsible.tsx           # Mobile collapsible wrapper
      EmptyAttention.tsx            # Green success banner
supabase/migrations/
  20260330000001_operations_hub_rpcs.sql  # RPC functions
frontend/public/locales/
  en/operations-hub.json            # New i18n namespace
  ar/operations-hub.json            # Arabic translations
```

### Pattern 1: Domain Repository Pattern (Established)

**What:** API calls in `domains/{feature}/repositories/` with typed responses
**When to use:** All new data fetching for dashboard zones
**Example:**

```typescript
// Source: Existing dossier-dashboard.service.ts pattern
import { supabase } from '@/lib/supabase'
import type { AttentionItem } from '../types/operations-hub.types'

export async function getAttentionItems(
  userId: string | null,
  thresholdHours: number = 48,
): Promise<AttentionItem[]> {
  const { data, error } = await supabase.rpc('get_attention_items', {
    p_user_id: userId,
    p_threshold_hours: thresholdHours,
  })
  if (error) throw new Error(error.message)
  return data ?? []
}
```

### Pattern 2: TanStack Query Hooks with staleTime Tiers (Phase 7)

**What:** Different staleTime per data freshness requirement
**When to use:** Each zone has its own query hook with appropriate cache settings
**Example:**

```typescript
// Source: Existing useDossierDashboard.ts pattern
export const operationsHubKeys = {
  all: ['operations-hub'] as const,
  attention: (userId?: string) => [...operationsHubKeys.all, 'attention', userId] as const,
  timeline: (userId?: string) => [...operationsHubKeys.all, 'timeline', userId] as const,
  stages: (userId?: string) => [...operationsHubKeys.all, 'stages', userId] as const,
  stats: (userId?: string) => [...operationsHubKeys.all, 'stats', userId] as const,
  activity: () => [...operationsHubKeys.all, 'activity'] as const,
}

export function useAttentionItems(userId?: string): UseQueryResult<AttentionItem[]> {
  return useQuery({
    queryKey: operationsHubKeys.attention(userId),
    queryFn: () => getAttentionItems(userId ?? null),
    staleTime: 30 * 1000, // 30s — most time-sensitive
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}
```

### Pattern 3: Realtime Subscription (Attention Zone Only, D-19)

**What:** Supabase Realtime channel with debounced query invalidation
**When to use:** Attention zone subscribes to `work_items` + `lifecycle_transitions` tables
**Example:**

```typescript
// Source: Existing useUnifiedWorkRealtime.ts pattern
supabase
  .channel(`attention:${userId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tasks',
      ...(userId && { filter: `assignee_id=eq.${userId}` }),
    },
    () => queueInvalidation('attention'),
  )
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'lifecycle_transitions',
    },
    () => queueInvalidation('attention'),
  )
  .subscribe()
```

### Pattern 4: Role-Adaptive Zone Ordering

**What:** Dynamic component array based on role preference
**When to use:** OperationsHub page renders zones in role-determined order
**Example:**

```typescript
type DashboardRole = 'leadership' | 'officer' | 'analyst'

const ZONE_ORDER: Record<DashboardRole, string[]> = {
  leadership: ['engagements', 'stats', 'attention', 'timeline', 'activity'],
  officer: ['attention', 'timeline', 'stats', 'engagements', 'activity'],
  analyst: ['timeline', 'activity', 'attention', 'engagements', 'stats'],
}

function useRolePreference(): { role: DashboardRole; setRole: (r: DashboardRole) => void } {
  const userRole = useAuthStore((s) => s.user?.role)
  const [override, setOverride] = useState<DashboardRole | null>(
    () => localStorage.getItem('ops-hub-role') as DashboardRole | null,
  )
  const mapped = mapUserRole(userRole)
  return {
    role: override ?? mapped,
    setRole: (r) => {
      setOverride(r)
      localStorage.setItem('ops-hub-role', r)
    },
  }
}
```

### Pattern 5: Mobile Collapsible Zones (D-02)

**What:** Zones wrapped in collapsible containers on mobile (< 640px)
**When to use:** Each zone gets a `ZoneCollapsible` wrapper that detects viewport
**Example:**

```typescript
// Uses useResponsive() hook from Phase 5
function ZoneCollapsible({
  title,
  defaultExpanded = false,
  children,
  badgeCount,
}: ZoneCollapsibleProps): React.ReactElement {
  const { isMobile } = useResponsive()
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (!isMobile) return <>{children}</>
  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className="min-h-11 ...">
        {title} {badgeCount && <span className="...">{badgeCount}</span>}
      </button>
      {expanded && children}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Fetching all data in one mega-query:** Each zone has independent queries so they load progressively. Do NOT combine into a single RPC that blocks rendering.
- **Client-side filtering for role-based scope:** The `user_id` parameter should be passed to RPC functions to filter at the database level, not filter client-side after fetching all items.
- **Using `textAlign: "right"` for RTL:** Use `text-start` / `text-end` logical properties only.
- **Non-lazy-loaded zones:** All zone components must be lazy-imported to stay within 200KB bundle budget.
- **Polling instead of Realtime:** For the Attention zone, use Supabase Realtime channels (already established pattern) instead of short polling intervals.

## Don't Hand-Roll

| Problem                                  | Don't Build                    | Use Instead                                                      | Why                                     |
| ---------------------------------------- | ------------------------------ | ---------------------------------------------------------------- | --------------------------------------- |
| Date grouping (Today/Tomorrow/This Week) | Custom date comparison logic   | `date-fns` (`isToday`, `isTomorrow`, `isThisWeek`, `startOfDay`) | Timezone-aware, battle-tested           |
| Responsive breakpoint detection          | Custom `window.matchMedia`     | `useResponsive()` hook                                           | Already exists, RAF-debounced           |
| Collapsible sections                     | Custom height animation        | `motion/react` `AnimatePresence` + `m.div`                       | Already used in timeline.tsx            |
| Work item creation palette               | New dialog system              | `useWorkCreation().openPalette()`                                | Already wired in current dashboard      |
| Command palette                          | New search UI                  | Cmd+K palette from Phase 8                                       | Already global, keyboard-accessible     |
| Auth role detection                      | Direct Supabase auth call      | `useAuthStore((s) => s.user?.role)`                              | Already cached in Zustand               |
| Severity color mapping                   | Inline conditionals everywhere | cva (class-variance-authority) variant                           | Consistent, type-safe severity system   |
| Stalled engagement detection             | Client-side duration calc      | Supabase RPC using `duration_in_stage_seconds`                   | Database has the trigger-computed value |

**Key insight:** This phase is almost entirely UI composition + new RPCs. Every reusable utility, hook, and pattern already exists from Phases 5-9. The main creative work is the zone component design and the 4 RPC functions.

## Common Pitfalls

### Pitfall 1: Role Filtering Leaking Across Zones

**What goes wrong:** Officer view filters attention items to "my items" but forgets to filter timeline events, creating inconsistent scoping.
**Why it happens:** Each zone has its own query hook, and the `userId` parameter needs to be threaded through consistently.
**How to avoid:** Create a single `useDashboardScope()` hook that returns `{ userId: string | null }` based on role. Officer returns current user ID; Leadership/Analyst returns null (all items). Pass this to every zone hook.
**Warning signs:** Officer sees their own attention items but all engagements in the engagements zone.

### Pitfall 2: Stalled Detection Missing Closed Stage Exclusion

**What goes wrong:** Closed engagements appear as "stalled" because they've been in closed stage for 14+ days.
**Why it happens:** The RPC query forgets to exclude `lifecycle_stage = 'closed'` from stalled detection.
**How to avoid:** D-15 explicitly states: "Closed stage is excluded (terminal)." Add `WHERE lifecycle_stage != 'closed'` to the stalled detection query.
**Warning signs:** Completed engagements showing up in the Attention zone.

### Pitfall 3: Timeline Zone Using Wrong Data Source

**What goes wrong:** Timeline shows generic calendar events instead of engagement-related events with lifecycle context.
**Why it happens:** The existing `GET /api/events/upcoming` returns basic events without engagement metadata. The `engagement_dossiers` table has `start_date`/`end_date` which are the primary timeline source.
**How to avoid:** The `get_upcoming_events` RPC should query `engagement_dossiers` joined with `dossiers` for the primary timeline, supplemented by `calendar_entries` for additional events. Each item needs `engagement_id`, `engagement_name`, `engagement_type`, and `lifecycle_stage`.
**Warning signs:** Timeline events lack engagement context or show events unrelated to engagements.

### Pitfall 4: Realtime Subscription Memory Leak

**What goes wrong:** Multiple Supabase channels created on re-renders without cleanup.
**Why it happens:** Channel creation in `useEffect` without proper cleanup, or missing dependency array.
**How to avoid:** Follow `useUnifiedWorkRealtime.ts` pattern exactly: store channel in `useRef`, clean up with `supabase.removeChannel()` in effect cleanup. Debounce invalidations.
**Warning signs:** Multiple `unified-work:` channels visible in Supabase dashboard, increasing memory usage.

### Pitfall 5: Bundle Size Exceeding 200KB Budget

**What goes wrong:** Dashboard page becomes a monolithic import that blocks initial render.
**Why it happens:** Importing all zone components synchronously in the OperationsHub page.
**How to avoid:** Keep the existing `lazy()` pattern in `_protected/dashboard.tsx` route. Each zone component should be reasonably sized. Consider lazy-loading the charting/animation-heavy components if needed.
**Warning signs:** `vite build` shows dashboard chunk > 200KB.

### Pitfall 6: Old Dashboard Components Not Fully Cleaned Up

**What goes wrong:** Dead imports, stale types, or orphaned i18n keys remain after replacing the dashboard.
**Why it happens:** The old dashboard has components in both `components/Dashboard/` and `pages/Dashboard/components/` with their own types and services.
**How to avoid:** Comprehensive deletion list: `components/Dashboard/` barrel + 4 components, `pages/Dashboard/components/` barrel + 8 components, `hooks/useDossierDashboard.ts`, `services/dossier-dashboard.service.ts`, `types/dossier-dashboard.types.ts`. Run `pnpm typecheck` after deletion to catch dangling imports.
**Warning signs:** TypeScript errors referencing deleted files, unused `dossier-dashboard` i18n namespace.

## Code Examples

### Supabase RPC: get_attention_items

```sql
-- Source: Research recommendation based on existing schema
CREATE OR REPLACE FUNCTION get_attention_items(
  p_user_id UUID DEFAULT NULL,
  p_threshold_hours INTEGER DEFAULT 48
)
RETURNS TABLE (
  id UUID,
  item_type TEXT,           -- 'overdue_work', 'due_soon_work', 'sla_at_risk', 'stalled_engagement'
  severity TEXT,            -- 'red', 'orange', 'yellow'
  title TEXT,
  title_ar TEXT,
  entity_id UUID,           -- work_item or engagement id
  entity_type TEXT,          -- 'task', 'commitment', 'intake', 'engagement'
  deadline TIMESTAMPTZ,
  days_overdue NUMERIC,
  days_in_stage NUMERIC,
  lifecycle_stage TEXT,
  engagement_name TEXT,
  engagement_name_ar TEXT
) AS $$
BEGIN
  -- 1. Overdue work items (red)
  RETURN QUERY
  SELECT wi.id, 'overdue_work'::TEXT, 'red'::TEXT, wi.title, wi.title_ar,
    wi.id, wi.source::TEXT, wi.deadline,
    EXTRACT(EPOCH FROM (NOW() - wi.deadline)) / 86400, NULL::NUMERIC,
    NULL::TEXT, NULL::TEXT, NULL::TEXT
  FROM unified_work_items_view wi
  WHERE wi.is_overdue = true
    AND wi.status NOT IN ('completed', 'cancelled')
    AND (p_user_id IS NULL OR wi.assignee_id = p_user_id);

  -- 2. Due-soon work items (yellow, within threshold_hours)
  RETURN QUERY
  SELECT wi.id, 'due_soon_work'::TEXT, 'yellow'::TEXT, wi.title, wi.title_ar,
    wi.id, wi.source::TEXT, wi.deadline,
    NULL::NUMERIC, NULL::NUMERIC,
    NULL::TEXT, NULL::TEXT, NULL::TEXT
  FROM unified_work_items_view wi
  WHERE wi.is_overdue = false
    AND wi.deadline IS NOT NULL
    AND wi.deadline <= NOW() + (p_threshold_hours || ' hours')::INTERVAL
    AND wi.status NOT IN ('completed', 'cancelled')
    AND (p_user_id IS NULL OR wi.assignee_id = p_user_id);

  -- 3. SLA-at-risk intake tickets (yellow)
  RETURN QUERY
  SELECT it.id, 'sla_at_risk'::TEXT, 'yellow'::TEXT, it.subject, it.subject_ar,
    it.id, 'intake'::TEXT, it.sla_deadline,
    NULL::NUMERIC, NULL::NUMERIC,
    NULL::TEXT, NULL::TEXT, NULL::TEXT
  FROM intake_tickets it
  WHERE it.tracking_type = 'sla'
    AND it.sla_deadline IS NOT NULL
    AND it.sla_deadline <= NOW() + (p_threshold_hours || ' hours')::INTERVAL
    AND it.status NOT IN ('resolved', 'closed', 'cancelled')
    AND (p_user_id IS NULL OR it.assigned_to = p_user_id);

  -- 4. Stalled engagements (orange, 14+ days in non-terminal stage)
  RETURN QUERY
  SELECT ed.id, 'stalled_engagement'::TEXT, 'orange'::TEXT,
    d.name_en, d.name_ar,
    ed.id, 'engagement'::TEXT, NULL::TIMESTAMPTZ,
    NULL::NUMERIC,
    EXTRACT(EPOCH FROM (NOW() - lt.transitioned_at)) / 86400,
    ed.lifecycle_stage, d.name_en, d.name_ar
  FROM engagement_dossiers ed
  JOIN dossiers d ON d.id = ed.id
  LEFT JOIN LATERAL (
    SELECT transitioned_at FROM lifecycle_transitions
    WHERE engagement_id = ed.id ORDER BY transitioned_at DESC LIMIT 1
  ) lt ON true
  WHERE ed.lifecycle_stage != 'closed'
    AND d.status = 'active'
    AND lt.transitioned_at IS NOT NULL
    AND lt.transitioned_at <= NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Role Mapping Utility

```typescript
// Source: Research recommendation based on D-10 spec
type UserRole = string | undefined
type DashboardRole = 'leadership' | 'officer' | 'analyst'

const ROLE_MAP: Record<string, DashboardRole> = {
  admin: 'leadership',
  manager: 'leadership',
  officer: 'officer',
  user: 'officer',
  analyst: 'analyst',
  viewer: 'officer', // default fallback
}

export function mapUserRole(role: UserRole): DashboardRole {
  if (role == null || role === '') return 'officer'
  return ROLE_MAP[role] ?? 'officer'
}
```

### Severity Color System (cva)

```typescript
// Source: Research recommendation using project's cva pattern
import { cva } from 'class-variance-authority'

export const attentionItemVariants = cva(
  'rounded-lg border p-3 sm:p-4 transition-colors cursor-pointer min-h-11',
  {
    variants: {
      severity: {
        red: 'border-destructive/50 bg-destructive/5 hover:bg-destructive/10',
        orange: 'border-warning/50 bg-warning/5 hover:bg-warning/10',
        yellow: 'border-yellow-500/50 bg-yellow-500/5 hover:bg-yellow-500/10',
      },
    },
    defaultVariants: {
      severity: 'yellow',
    },
  },
)
```

### Timeline Day Grouping

```typescript
// Source: Research recommendation using date-fns
import { isToday, isTomorrow, isThisWeek, isNextWeek, parseISO } from 'date-fns'

type TimelineGroup = 'today' | 'tomorrow' | 'this_week' | 'next_week'

export function groupEventsByDay<T extends { start_date: string }>(
  events: T[],
): Record<TimelineGroup, T[]> {
  const groups: Record<TimelineGroup, T[]> = {
    today: [],
    tomorrow: [],
    this_week: [],
    next_week: [],
  }

  for (const event of events) {
    const date = parseISO(event.start_date)
    if (isToday(date)) groups.today.push(event)
    else if (isTomorrow(date)) groups.tomorrow.push(event)
    else if (isThisWeek(date)) groups.this_week.push(event)
    else if (isNextWeek(date)) groups.next_week.push(event)
  }

  return groups
}
```

## State of the Art

| Old Approach                | Current Approach                 | When Changed  | Impact                                                      |
| --------------------------- | -------------------------------- | ------------- | ----------------------------------------------------------- |
| Dossier-centric dashboard   | Operations-focused hub           | Phase 10      | Shifts from "browse dossiers" to "what needs attention now" |
| Flat metric cards           | Severity-grouped attention zones | Phase 10      | Priority-driven information hierarchy                       |
| No role awareness           | Role-adaptive zone ordering      | Phase 10      | Different users see different defaults                      |
| No lifecycle awareness      | Engagement stage grouping        | Phase 9 -> 10 | Lifecycle stage drives engagement organization              |
| Supabase Edge Function only | RPC functions (direct Supabase)  | Phase 10      | Simpler, lower latency for dashboard queries                |

**Deprecated/outdated:**

- `DashboardPage.tsx` with tabs: Replaced by OperationsHub with zones
- `DossierQuickStatsCard`, `ChartDossierDistribution`, `ChartWorkItemTrends`, `DossierSuccessMetrics`, `RecentDossiersTable`: All deleted
- `useDossierDashboard.ts`, `dossier-dashboard.service.ts`, `dossier-dashboard.types.ts`: All deleted
- `components/Dashboard/` barrel (`MyDossiersSection`, `RecentDossierActivity`, `PendingWorkByDossier`, `DossierQuickStatsCard`): All deleted

## i18n Strategy

### New Namespace: `operations-hub`

Create `frontend/public/locales/en/operations-hub.json` and `ar/operations-hub.json`:

```json
{
  "greeting": {
    "morning": "Good morning",
    "afternoon": "Good afternoon",
    "evening": "Good evening"
  },
  "zones": {
    "attention": { "title": "Attention Needed", "empty": "All clear -- nothing needs attention" },
    "timeline": {
      "title": "Upcoming",
      "today": "Today",
      "tomorrow": "Tomorrow",
      "this_week": "This Week",
      "next_week": "Next Week",
      "show_all": "Show all"
    },
    "engagements": { "title": "Active Engagements", "show_all": "Show all" },
    "stats": {
      "active_engagements": "Active Engagements",
      "open_tasks": "Open Tasks",
      "sla_at_risk": "SLA At Risk",
      "upcoming_week": "Upcoming This Week"
    },
    "activity": { "title": "Recent Activity" }
  },
  "roles": { "leadership": "Leadership", "officer": "Officer", "analyst": "Analyst" },
  "actions": { "new_engagement": "New Engagement", "new_request": "New Request" },
  "severity": {
    "overdue": "Overdue",
    "due_soon": "Due Soon",
    "sla_at_risk": "SLA At Risk",
    "stalled": "Stalled"
  }
}
```

### Existing namespace `dashboard` in `translation.json`

The current dashboard uses `t('dashboard:title')` which maps to `translation.json` -> `dashboard.title`. The new Operations Hub should use its own `operations-hub` namespace to avoid conflicts during transition. The old `dashboard` keys in `translation.json` can be cleaned up after old components are deleted.

## Data Layer Architecture

### RPC vs Edge Function Decision

**Use Supabase RPC functions** (not Edge Functions) for the new dashboard data. Rationale:

1. The existing `dossier-dashboard` Edge Function pattern works but adds HTTP overhead
2. RPC calls go directly through Supabase client, lower latency
3. RPC functions support RLS natively
4. The `dossier-dashboard.service.ts` already has RPC fallback methods showing this pattern works
5. Simpler deployment (migration SQL vs Edge Function deployment)

### Four RPC Functions Needed

| Function                      | Purpose                                   | Params                                  | Returns                                                               |
| ----------------------------- | ----------------------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `get_attention_items`         | Overdue + due-soon + SLA risk + stalled   | `p_user_id UUID, p_threshold_hours INT` | Array of attention items with severity                                |
| `get_upcoming_events`         | Events for timeline grouped by engagement | `p_user_id UUID, p_days_ahead INT`      | Array of upcoming engagement events                                   |
| `get_engagement_stage_counts` | Engagements grouped by lifecycle stage    | `p_user_id UUID`                        | Stage counts + top engagements per stage                              |
| `get_dashboard_stats`         | Aggregate counts for Quick Stats          | `p_user_id UUID`                        | Active engagement count, open tasks, SLA at risk, upcoming week count |

### Realtime Strategy (D-19)

- **Attention zone**: Supabase Realtime channel subscribing to `tasks`, `aa_commitments`, `intake_tickets`, and `lifecycle_transitions` tables. Debounced invalidation (300ms). Pattern: `useUnifiedWorkRealtime.ts`.
- **Timeline/Engagements/Stats**: TanStack Query with `staleTime: 5 * 60 * 1000` (5 min), `refetchOnWindowFocus: true`.
- **Activity Feed**: TanStack Query with `staleTime: 2 * 60 * 1000` (2 min), `refetchOnWindowFocus: true`.

## Deletion Inventory

### Files to Delete (D-16, D-17)

Components in `frontend/src/components/Dashboard/`:

- `DossierQuickStatsCard.tsx`
- `MyDossiersSection.tsx`
- `RecentDossierActivity.tsx`
- `PendingWorkByDossier.tsx`
- `index.ts` (barrel)

Components in `frontend/src/pages/Dashboard/components/`:

- `ChartDossierDistribution.tsx`
- `ChartWorkItemTrends.tsx`
- `DashboardDateRangePicker.tsx`
- `DashboardExportButton.tsx`
- `DashboardMetricCards.tsx`
- `DossierSuccessMetrics.tsx`
- `RecentDossiersTable.tsx`
- `UpcomingEvents.tsx` (exists but unused -- check)
- `StatCard.tsx` (may be adapted for QuickStatCard -- check reuse)
- `index.ts` (barrel)

Services/Hooks/Types to delete:

- `frontend/src/hooks/useDossierDashboard.ts`
- `frontend/src/services/dossier-dashboard.service.ts`
- `frontend/src/types/dossier-dashboard.types.ts`

i18n keys to clean:

- `frontend/public/locales/en/dossier-dashboard.json` (entire file)
- `frontend/public/locales/ar/dossier-dashboard.json` (entire file)
- `translation.json` -> `dashboard` section (after verifying no other consumers)

**StatCard.tsx reuse assessment:** The existing `StatCard` component renders a metric card with title, value, change indicator, and trend. This pattern is very close to what Quick Stats needs. **Recommendation:** Adapt (not delete) `StatCard.tsx` into `QuickStatCard.tsx` with click navigation and severity badge support.

## Open Questions

1. **Engagement events vs calendar events for Timeline**
   - What we know: `engagement_dossiers` has `start_date`/`end_date`. The `events` API has generic calendar events. The `calendar_entries` table (used by calendar domain) has engagement-linked events.
   - What's unclear: Should the Timeline zone show only engagement dates, or also standalone calendar events?
   - Recommendation: Primary source is `engagement_dossiers.start_date` for engagement-related events. Supplement with `calendar_entries` that have `dossier_id` linked to engagements. The RPC should join both sources.

2. **Existing "UpcomingEvents.tsx" in dashboard components**
   - What we know: File exists in `pages/Dashboard/components/` but is not exported from the barrel `index.ts`.
   - What's unclear: Is it functional or stub?
   - Recommendation: Inspect before deleting -- may have useful rendering patterns for the new TimelineZone.

3. **RPC function security: SECURITY DEFINER vs INVOKER**
   - What we know: RPC functions need to access data across tables with RLS enabled.
   - What's unclear: Whether existing RLS policies are sufficient for the dashboard queries or if SECURITY DEFINER is needed.
   - Recommendation: Start with SECURITY INVOKER (respects caller's RLS). Only use SECURITY DEFINER if RLS policies block legitimate dashboard queries, and add explicit auth checks inside the function.

## Validation Architecture

### Test Framework

| Property           | Value                                               |
| ------------------ | --------------------------------------------------- |
| Framework          | Vitest (installed)                                  |
| Config file        | `frontend/vitest.config.ts`                         |
| Quick run command  | `cd frontend && pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm test`                                         |

### Phase Requirements -> Test Map

| Req ID | Behavior                                                       | Test Type | Automated Command                                                                               | File Exists? |
| ------ | -------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- | ------------ |
| OPS-01 | Attention zone renders overdue (red) + due-soon (yellow) items | unit      | `cd frontend && pnpm vitest run src/pages/Dashboard/__tests__/AttentionZone.test.tsx`           | Wave 0       |
| OPS-02 | Timeline zone groups events by Today/Tomorrow/This Week        | unit      | `cd frontend && pnpm vitest run src/domains/operations-hub/__tests__/groupEventsByDay.test.ts`  | Wave 0       |
| OPS-03 | Engagements zone groups by lifecycle stage                     | unit      | `cd frontend && pnpm vitest run src/pages/Dashboard/__tests__/EngagementsZone.test.tsx`         | Wave 0       |
| OPS-04 | Quick Stats shows 4 metric cards + Activity Feed renders       | unit      | `cd frontend && pnpm vitest run src/pages/Dashboard/__tests__/QuickStatsBar.test.tsx`           | Wave 0       |
| OPS-05 | Role preference maps user role and persists                    | unit      | `cd frontend && pnpm vitest run src/domains/operations-hub/__tests__/useRolePreference.test.ts` | Wave 0       |
| OPS-06 | Dashboard items navigate to correct routes on click            | unit      | `cd frontend && pnpm vitest run src/pages/Dashboard/__tests__/OperationsHub.test.tsx`           | Wave 0       |
| OPS-07 | Action bar renders buttons and triggers work creation          | unit      | `cd frontend && pnpm vitest run src/pages/Dashboard/__tests__/ActionBar.test.tsx`               | Wave 0       |

### Sampling Rate

- **Per task commit:** `cd frontend && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm test && pnpm typecheck`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/pages/Dashboard/__tests__/` directory -- does not exist, create it
- [ ] `frontend/src/domains/operations-hub/__tests__/` directory -- does not exist, create it
- [ ] Test fixtures for mock attention items, timeline events, engagement stage data
- [ ] i18n test setup (mock `useTranslation` for zone component tests)

## Sources

### Primary (HIGH confidence)

- Codebase files read directly:
  - `frontend/src/pages/Dashboard/DashboardPage.tsx` -- current dashboard structure
  - `frontend/src/store/authStore.ts` -- role field (`user.role`)
  - `frontend/src/types/lifecycle.types.ts` -- LifecycleStage, LIFECYCLE_STAGES, labels
  - `frontend/src/types/work-item.types.ts` -- WorkItem with `is_overdue`, `days_until_due`
  - `frontend/src/types/engagement.types.ts` -- EngagementDossier with `lifecycle_stage`
  - `frontend/src/hooks/useResponsive.ts` -- responsive breakpoint detection
  - `frontend/src/hooks/useUnifiedWorkRealtime.ts` -- realtime subscription pattern
  - `frontend/src/hooks/useDossierDashboard.ts` -- TanStack Query hook pattern
  - `frontend/src/services/dossier-dashboard.service.ts` -- Supabase RPC call pattern
  - `frontend/src/components/work-creation/index.ts` -- useWorkCreation exports
  - `frontend/src/components/layout/navigation-config.ts` -- sidebar nav config
  - `frontend/src/routes/_protected/dashboard.tsx` -- lazy-loaded route pattern
  - `supabase/migrations/20260329000001_add_lifecycle_stage.sql` -- DB schema
  - `backend/src/api/events.ts` -- events API routes
  - `frontend/src/domains/calendar/repositories/calendar.repository.ts` -- calendar data access

### Secondary (MEDIUM confidence)

- `.planning/phases/10-operations-hub/10-CONTEXT.md` -- all user decisions
- `.planning/REQUIREMENTS.md` -- phase requirement IDs
- `.planning/STATE.md` -- project decisions and accumulated context

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already installed, no new dependencies
- Architecture: HIGH -- follows established domain/repository/hook patterns from Phases 5-9
- Pitfalls: HIGH -- based on direct codebase analysis and real schema inspection
- Data layer: MEDIUM -- RPC function SQL is recommended design, exact column names need verification against current schema
- Deletion scope: HIGH -- comprehensive file list from direct inspection

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable, no external dependency changes expected)
