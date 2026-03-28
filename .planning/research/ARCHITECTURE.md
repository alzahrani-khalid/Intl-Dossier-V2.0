# Architecture Patterns

**Domain:** Hub-and-spoke navigation redesign for diplomatic dossier management system
**Researched:** 2026-03-28
**Confidence:** HIGH (based on direct codebase analysis of existing patterns)

## Current Architecture Snapshot

### Route Tree (TanStack Router v5, file-based)

```
__root.tsx                          # ErrorBoundary, KeyboardShortcutProvider, DossierContextProvider
  _protected.tsx                    # Auth guard (Supabase session), MainLayout shell, ChatDock
    dashboard.tsx                   # Lazy-loaded DashboardPage
    dossiers/
      index.tsx                     # All-dossiers hub
      countries/index.tsx           # Country list
      countries/$id.tsx             # Country detail
      engagements/index.tsx         # Engagement list
      engagements/$id.tsx           # Engagement detail (EngagementDossierPage)
      forums/$id.tsx                # Forum detail
      organizations/$id.tsx         # Org detail
      persons/$id.tsx               # Person detail
      topics/$id.tsx                # Topic detail
      working_groups/$id.tsx        # Working group detail
    engagements.tsx                 # DUPLICATE: flat engagement list
    engagements/$engagementId.tsx   # DUPLICATE: flat engagement detail
    engagements/$engagementId/after-action.tsx
    calendar.tsx                    # Global calendar
    kanban.tsx                      # Global kanban
    intake/                         # Intake queue (index, new, queue, tickets.$id)
    my-work/                        # My work (index, board, assignments, intake, waiting)
    tasks/                          # Tasks (index, $id, escalations, queue)
    ... ~40 more flat routes (analytics, briefs, intelligence, demos, etc.)
```

**Key observations:**

- Dossier routes already live under `/dossiers/{type}/` -- aligns with spec
- Duplicate routes exist: `/engagements.tsx` AND `/dossiers/engagements/` (both render same data)
- `/persons.tsx` AND `/dossiers/persons/` are also duplicated
- ~10 demo pages (`*-demo.tsx`) pollute production navigation
- No `elected-officials` route or domain exists anywhere
- `working_groups` uses underscore (spec wants `working-groups` with hyphen)
- No nested layout routes under engagement detail (no `$id/tasks`, `$id/calendar`, etc.)

### Domain Repository Pattern (20 domains)

Each domain follows this exact structure:

```
frontend/src/domains/{name}/
  types/index.ts          # Re-exports from @/types + domain-specific interfaces
  repositories/{name}.repository.ts  # Plain function exports using apiGet/apiPost/apiPatch/apiDelete
  hooks/use{Name}.ts      # TanStack Query hooks with query key factory
  index.ts                # Barrel re-export
```

**Existing domains:** ai, analytics, audit, briefings, calendar, documents, dossiers, engagements, import, intake, misc, persons, positions, relationships, search, shared, tags, topics, work-items

**NOT existing:** elected-officials (the 8th dossier type has no domain)

### Navigation Structure (current)

`navigation-config.ts` defines 6+ sections:

1. **Dossiers Hub** -- All Dossiers, Recent Activity
2. **My Work** -- List View, Board View
3. **Requests** -- Incoming Requests (with badge), Awaiting Response (with badge)
4. **Main** -- Dashboard, Custom Dashboard, Approvals, Positions, After Actions
5. **Tools** -- Calendar, Briefs, Briefing Books, Intelligence, Analytics, Reports, SLA Monitoring
6. **Documents** -- Data Library, Word Assistant
7. **Admin** (conditional) -- System, Approvals, AI Usage/Settings, Users, Monitoring, Export, Tags, Webhooks, Workflow

`AppSidebar.tsx` renders these via `NavMain` component with collapsible groups, plus SidebarSearch, QuickNavigationMenu, ThemeSelector, LanguageToggle, NavUser.

### Component Architecture

- **Pages:** `frontend/src/pages/dossiers/{Type}DossierPage.tsx` -- 7 type-specific pages exist (no elected officials)
- **Detail components:** `frontend/src/components/dossier/{Type}DossierDetail.tsx` -- renders actual content
- **Layout wrapper:** `DossierDetailLayout.tsx` -- shared header, grid layout, actions slot
- **Route files:** thin wrappers that validate dossier type + lazy-load page component via `React.lazy`
- **Dialog pattern:** Features like Kanban open as dialogs (`EngagementKanbanDialog`) from the detail page, not as separate routes

### Data Flow

```
Route ($id.tsx) --> useDossier(id) --> DossierPage.tsx --> DossierDetailLayout --> {Type}DossierDetail
                                                       --> Feature dialogs (Kanban, AfterAction)
```

Engagement domain already has: CRUD, participants, agenda, kanban, briefs, recommendations -- all as repository functions with corresponding TanStack Query hooks.

---

## Recommended Architecture for v3.0

### 1. Route Restructuring Strategy

#### Step A: Consolidation (prerequisite -- zero new features)

**Delete duplicate flat routes** that are superseded by `/dossiers/{type}/`:

| Delete                                       | Canonical Route                      |
| -------------------------------------------- | ------------------------------------ |
| `engagements.tsx`                            | `/dossiers/engagements/index.tsx`    |
| `engagements/$engagementId.tsx`              | `/dossiers/engagements/$id.tsx`      |
| `engagements/$engagementId/after-action.tsx` | Absorbed into workspace              |
| `persons.tsx`                                | `/dossiers/persons/index.tsx`        |
| `persons/$personId.tsx`                      | `/dossiers/persons/$id.tsx`          |
| `contacts.tsx`                               | Already served by persons            |
| `countries.tsx`                              | `/dossiers/countries/index.tsx`      |
| `organizations.tsx`                          | `/dossiers/organizations/index.tsx`  |
| `forums.tsx`                                 | `/dossiers/forums/index.tsx`         |
| `working-groups.tsx`                         | `/dossiers/working_groups/index.tsx` |

**Rename `working_groups` to `working-groups`** in route directories for URL consistency.

**Gate demo pages behind `VITE_DEV_MODE`:** Move 10+ `*-demo.tsx` routes to a `_dev` layout route that checks the env flag.

**Add redirect routes** from old paths to new canonical paths for any bookmarked URLs.

#### Step B: Engagement Workspace -- Nested Layout Route

This is the most architecturally significant change. TanStack Router v5 supports nested layout routes perfectly -- the project already uses this pattern with `_protected.tsx` wrapping all authenticated routes via `<Outlet />`.

**New route structure:**

```
routes/_protected/dossiers/engagements/
  index.tsx                     # Engagement list (existing, unchanged)
  $id.tsx                       # BECOMES layout route with WorkspaceShell + Outlet
  $id/
    index.tsx                   # Overview tab (default)
    context.tsx                 # Context tab (linked dossiers)
    tasks.tsx                   # Tasks tab (scoped kanban)
    calendar.tsx                # Calendar tab (scoped events)
    docs.tsx                    # Docs tab (with AI briefing action)
    audit.tsx                   # Audit tab (scoped timeline)
```

**Key pattern -- `$id.tsx` becomes a layout route:**

```typescript
// routes/_protected/dossiers/engagements/$id.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import { LifecycleBar } from '@/components/workspace/LifecycleBar'
import { useEngagement } from '@/domains/engagements/hooks/useEngagements'

export const Route = createFileRoute('/_protected/dossiers/engagements/$id')({
  component: EngagementWorkspaceLayout,
})

function EngagementWorkspaceLayout() {
  const { id } = Route.useParams()
  const { data: engagement, isLoading } = useEngagement(id)

  if (isLoading) return <WorkspaceSkeleton />
  if (!engagement) return <NotFound />

  return (
    <WorkspaceShell
      engagement={engagement}
      lifecycleBar={
        <LifecycleBar stage={engagement.lifecycle_stage} engagementId={id} />
      }
      tabs={[
        { id: 'overview', path: '.', label: 'Overview' },
        { id: 'context', path: './context', label: 'Context' },
        { id: 'tasks', path: './tasks', label: 'Tasks' },
        { id: 'calendar', path: './calendar', label: 'Calendar' },
        { id: 'docs', path: './docs', label: 'Docs' },
        { id: 'audit', path: './audit', label: 'Audit' },
      ]}
    >
      <Outlet />
    </WorkspaceShell>
  )
}
```

**Why this works:** TanStack Router v5 file-based routing treats `$id.tsx` as a layout when a `$id/` directory also exists. The layout component wraps `<Outlet />` which renders the child route. The workspace shell (header, lifecycle bar, tabs) persists across tab navigation with zero re-mount.

**Same pattern applies to Forums:**

```
routes/_protected/dossiers/forums/
  $id.tsx                       # Forum workspace layout
  $id/
    index.tsx                   # Forum overview (sessions list)
    sessions/$sessionId.tsx     # Session mini-workspace layout
    sessions/$sessionId/
      index.tsx                 # Session overview
      tasks.tsx                 # Session tasks
```

#### Step C: Enriched Dossier Detail Pages

Non-workspace dossier types (countries, organizations, topics, working-groups, persons, elected-officials) keep the current `$id.tsx` pattern but add tab-based navigation within the page component (NOT nested routes).

**Rationale for NOT using nested routes for non-workspace types:**

- Workspace types (engagements, forums) have heavy tab content (kanban, calendar) worth code-splitting
- Anchor/thread/contact types have lightweight tabs (overview, engagements list, docs) better served by client-side tab state
- Keeps the route tree manageable (avoiding 8 types x 6 tabs = 48 route files)
- Existing `DossierDetailLayout` already supports this with an actions slot

**Add RelationshipSidebar** rendered inside `DossierDetailLayout`:

```typescript
interface DossierDetailLayoutProps {
  dossier: Dossier
  children: React.ReactNode
  headerActions?: React.ReactNode
  sidebar?: React.ReactNode // NEW: RelationshipSidebar slot
  gridClassName?: string
}
```

#### Step D: Operations Hub Route Changes

The dashboard route stays at `/dashboard` (no change). The page component gets redesigned:

```
routes/_protected/
  dashboard.tsx                 # Same route, new DashboardPage internals
  tasks/index.tsx               # Already exists -- becomes "My Tasks"
  calendar.tsx                  # Already exists -- unchanged
  intake/index.tsx              # Already exists -- unchanged
```

No route restructuring needed for Operations Hub. The work is all in the page components.

#### Step E: Admin Route Consolidation

```
routes/_protected/admin/
  audit-logs.tsx                # Move from top-level audit-logs.tsx
  compliance.tsx                # Move/rename from existing compliance-demo.tsx
  settings.tsx                  # Move from top-level settings.tsx
```

### 2. New Domain: `elected-officials`

**Create the full domain structure:**

```
frontend/src/domains/elected-officials/
  types/index.ts
  repositories/elected-officials.repository.ts
  hooks/useElectedOfficials.ts
  index.ts
```

**Type definition extends the person pattern:**

```typescript
// domains/elected-officials/types/index.ts
export interface ElectedOfficial {
  id: string
  dossier_id: string
  person_id?: string
  full_name_en: string
  full_name_ar: string
  title_en: string
  title_ar: string
  office: string
  term_start: string
  term_end?: string
  party?: string
  committees: Committee[]
  contact_info?: ContactInfo
  created_at: string
  updated_at: string
}

export interface Committee {
  id: string
  name_en: string
  name_ar: string
  role: 'chair' | 'member' | 'observer'
}
```

**Repository follows existing pattern exactly** (apiGet/apiPost/apiPatch/apiDelete).

**Hook follows engagement hook pattern** (query key factory, CRUD mutations with toast).

**Update `dossier-routes.ts`:**

```typescript
export const DOSSIER_TYPE_TO_ROUTE: Record<string, string> = {
  // ... existing entries
  elected_official: 'elected-officials', // ADD
}
```

**Backend:** Needs new API routes at `/api/elected-official-dossiers` following existing dossier endpoint patterns. Must verify `elected_officials` table exists in Supabase via MCP -- if not, needs a migration.

### 3. New Shared Components

#### WorkspaceShell

The core workspace layout component for engagements and forums.

```
frontend/src/components/workspace/
  WorkspaceShell.tsx          # Layout: header + lifecycle bar + tabs + content area
  LifecycleBar.tsx            # 6-stage progress indicator
  WorkspaceHeader.tsx         # Engagement title, metadata, action buttons
  WorkspaceTabs.tsx           # Tab navigation using TanStack Router Links
  WorkspaceSkeleton.tsx       # Loading state
```

**WorkspaceShell architecture:**

```typescript
interface WorkspaceShellProps {
  engagement: EngagementFullProfile
  lifecycleBar: React.ReactNode
  tabs: Array<{ id: string; path: string; label: string; badge?: number }>
  children: React.ReactNode // Outlet content
}
```

**Tab implementation uses TanStack Router `<Link>` components** with `activeProps` for active state, NOT client-side tab state. This gives:

- URL-driven tab state (shareable, bookmarkable)
- Browser back/forward works across tabs
- Each tab content is its own route (code-split independently)

#### LifecycleBar

Horizontal stepper showing the 6 engagement stages.

```typescript
type LifecycleStage = 'intake' | 'preparation' | 'briefing' | 'execution' | 'follow_up' | 'closed'

interface LifecycleBarProps {
  stage: LifecycleStage
  engagementId: string
  onStageClick?: (stage: LifecycleStage) => void
  canTransition?: boolean
  suggestedNextStage?: LifecycleStage
}
```

Build with HeroUI stepper or custom component. Each stage is clickable. Current stage is filled, completed stages have checkmarks, future stages are dimmed. Must be responsive (horizontal on desktop, vertical or compressed on mobile) and RTL-safe (stage flow direction reverses).

#### RelationshipSidebar

Collapsible right panel for all dossier detail pages.

```typescript
interface RelationshipSidebarProps {
  dossierId: string
  dossierType: string
  isOpen: boolean
  onToggle: () => void
}
```

Uses existing `useRelationships` hook from the relationships domain. Groups linked dossiers by tier (anchors, activities, threads, contacts). Each linked dossier renders as a `DossierCard` (compact variant).

**Integration point:** Add to `DossierDetailLayout` as an optional right panel. Use CSS grid for the two-column layout when sidebar is open.

#### AttentionCard

Used in Operations Hub for overdue/due-soon items.

```typescript
interface AttentionCardProps {
  item: WorkItem | IntakeTicket | Commitment
  severity: 'overdue' | 'due_soon' | 'at_risk'
  onClick: () => void
}
```

#### StageKanban

Lifecycle-aware variant of the existing kanban that groups columns by lifecycle stage instead of workflow stage.

```typescript
interface StageKanbanProps {
  engagementId: string
  groupBy: 'workflow_stage' | 'lifecycle_stage'
}
```

Extends existing `useEngagementKanban` hook. Adds `lifecycle_stage` as an optional grouping dimension.

### 4. Sidebar Refactor

**Replace `navigation-config.ts` contents** with new hub-based structure:

```typescript
export const createNavigationSections = (
  counts: { intake: number; waiting: number; attention: number },
  isAdmin: boolean,
): NavigationSection[] => [
  {
    id: 'operations',
    label: 'navigation.operations',
    items: [
      { id: 'dashboard', label: 'navigation.dashboard', path: '/dashboard', icon: LayoutDashboard },
      { id: 'my-tasks', label: 'navigation.myTasks', path: '/tasks', icon: CheckSquare },
      { id: 'calendar', label: 'navigation.calendar', path: '/calendar', icon: CalendarDays },
      {
        id: 'intake',
        label: 'navigation.intake',
        path: '/intake',
        icon: Inbox,
        badgeCount: counts.intake,
      },
    ],
  },
  {
    id: 'dossiers',
    label: 'navigation.dossiers',
    items: [
      // Anchors
      { id: 'countries', path: '/dossiers/countries', icon: Globe },
      { id: 'organizations', path: '/dossiers/organizations', icon: Building2 },
      // Activities
      { id: 'engagements', path: '/dossiers/engagements', icon: Handshake },
      { id: 'forums', path: '/dossiers/forums', icon: Users },
      // Threads
      { id: 'topics', path: '/dossiers/topics', icon: Tag },
      { id: 'working-groups', path: '/dossiers/working-groups', icon: Network },
      // Contacts
      { id: 'persons', path: '/dossiers/persons', icon: User },
      { id: 'elected-officials', path: '/dossiers/elected-officials', icon: Crown },
    ],
  },
  ...(isAdmin
    ? [
        {
          id: 'administration',
          label: 'navigation.administration',
          items: [
            { id: 'audit-logs', path: '/admin/audit-logs', icon: ScrollText },
            { id: 'compliance', path: '/admin/compliance', icon: Shield },
            { id: 'settings', path: '/admin/settings', icon: Settings },
          ],
        },
      ]
    : []),
]
```

**What gets removed from sidebar:**

- Custom Dashboard, Approvals, Positions, After Actions (absorbed into dossier context)
- Briefs, Briefing Books, Intelligence (absorbed into workspace Docs tab)
- Analytics, Reports, SLA Monitoring (absorbed into dashboard widgets)
- Data Library, Word Assistant (moved to admin or contextual actions)

**`AppSidebar.tsx` changes are minimal** -- it already delegates to `createNavigationSections` via `NavMain`. Add tier sub-labels within the Dossiers section (visual grouping). Keep Search, QuickNavigation, Theme/Language controls, NavUser unchanged.

### 5. Lifecycle State Flow

```
                     +---------+
                     | Supabase|
                     | DB      |
                     +----+----+
                          |
                  engagements.lifecycle_stage (enum)
                          |
              +-----------+-----------+
              |                       |
     Backend API                  Realtime
     PATCH /engagement-dossiers/:id   subscription
     { lifecycle_stage: 'preparation' }
              |                       |
              v                       v
     engagements.repository.ts    Supabase channel
     updateEngagement(id,          on('UPDATE')
       { lifecycle_stage })           |
              |                       |
              v                       v
     useUpdateEngagement()        queryClient.invalidateQueries
     mutation                     (['engagements', 'detail', id])
              |
              v
     LifecycleBar component
     (reads from engagement.lifecycle_stage)
     (onClick triggers useUpdateEngagement)
```

**Stage transition logic** lives in a new hook within the engagements domain:

```typescript
// domains/engagements/hooks/useLifecycleTransition.ts
const STAGE_ORDER: LifecycleStage[] = [
  'intake',
  'preparation',
  'briefing',
  'execution',
  'follow_up',
  'closed',
]

export function useLifecycleTransition(engagementId: string) {
  const { data: engagement } = useEngagement(engagementId)
  const { data: kanban } = useEngagementKanban(engagementId)
  const updateEngagement = useUpdateEngagement()

  const canAdvance = useMemo(() => {
    // Check if current stage tasks are complete
    const currentIndex = STAGE_ORDER.indexOf(engagement?.lifecycle_stage ?? 'intake')
    // All tasks tagged with current stage should be done
    return true // Simplified -- real logic checks task completion
  }, [kanban, engagement?.lifecycle_stage])

  const advanceStage = () => {
    const current = engagement?.lifecycle_stage ?? 'intake'
    const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(current) + 1]
    if (nextStage) {
      updateEngagement.mutate({
        id: engagementId,
        updates: { lifecycle_stage: nextStage },
      })
    }
  }

  return { currentStage: engagement?.lifecycle_stage, canAdvance, advanceStage }
}
```

**Database changes required:**

```sql
-- Migration 1: Add lifecycle_stage to engagements
CREATE TYPE engagement_lifecycle_stage AS ENUM (
  'intake', 'preparation', 'briefing', 'execution', 'follow_up', 'closed'
);
ALTER TABLE engagements
  ADD COLUMN lifecycle_stage engagement_lifecycle_stage NOT NULL DEFAULT 'intake';

-- Migration 2: Add lifecycle_stage reference to work_items
ALTER TABLE work_items
  ADD COLUMN lifecycle_stage engagement_lifecycle_stage;

-- Migration 3: Verify/create elected_officials table with RLS
```

### 6. Data Flow Changes

#### Operations Hub (Dashboard)

New data requirements:

| Widget             | Data Source                                                                       | Query                                           |
| ------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| Attention Needed   | work_items WHERE deadline < NOW() + interval '48h' AND assignee_id = current_user | New: `useAttentionItems()`                      |
| Active Engagements | engagements WHERE lifecycle_stage NOT IN ('closed') GROUP BY lifecycle_stage      | Extend: `useEngagements()` with groupBy         |
| Timeline           | calendar_events WHERE date BETWEEN NOW() AND NOW() + interval '7d'                | Existing: `useCalendarEvents()` with date range |
| Recent Activity    | audit_logs ORDER BY created_at DESC LIMIT 20                                      | Existing: `useAuditLogs()`                      |
| Quick Stats        | COUNT queries across engagements, work_items, intake                              | New: `useDashboardStats()`                      |

**New hooks needed:**

- `useAttentionItems()` -- cross-entity overdue/at-risk query
- `useDashboardStats()` -- aggregated counts
- `useEngagementsByStage()` -- engagements grouped by lifecycle

#### Engagement Workspace Tabs

Each workspace tab uses existing domain hooks with engagement-scoped filters:

| Tab      | Hook                                                   | Filter                                 |
| -------- | ------------------------------------------------------ | -------------------------------------- |
| Overview | `useEngagement(id)`                                    | Existing, no change                    |
| Context  | `useRelationships(dossierId)`                          | Existing, no change                    |
| Tasks    | `useEngagementKanban(id)`                              | Existing, add lifecycle_stage grouping |
| Calendar | `useCalendarEvents({ engagementId })`                  | Extend with engagement filter          |
| Docs     | `useDocuments({ entityId, entityType: 'engagement' })` | Existing filter                        |
| Audit    | `useAuditLogs({ entityId, entityType: 'engagement' })` | Existing filter                        |

**Most workspace data needs are already served by existing hooks.** The main new work is:

1. Lifecycle stage grouping for kanban
2. Calendar events filtered by engagement (verify backend API supports this)
3. The WorkspaceShell layout component itself

### 7. Suggested Build Order (Dependency-Aware)

The spec orders phases as: Navigation -> Ops Hub -> Workspace -> Dossier Hub -> Feature Absorption -> Lifecycle Engine.

**Problem:** The spec puts Lifecycle Engine last, but Ops Hub and Workspace both depend on `lifecycle_stage`. Pull the DB migration forward.

**Recommended build order:**

```
Phase 1: Navigation & Route Consolidation      (no new features, pure cleanup)
  |
  +-- 1a: Delete duplicate routes, add redirects
  +-- 1b: Gate demo pages behind VITE_DEV_MODE
  +-- 1c: Rename working_groups -> working-groups
  +-- 1d: Rewrite navigation-config.ts (3 hub sections)
  |
Phase 2: Lifecycle Engine (DB + types + hooks)  (small scope, prerequisite)
  |
  +-- 2a: Supabase migration (lifecycle_stage on engagements + work_items)
  +-- 2b: Add LifecycleStage type to engagement types
  +-- 2c: Add useLifecycleTransition hook
  +-- 2d: Extend updateEngagement to handle lifecycle_stage
  |
Phase 3: Operations Hub                         (needs lifecycle_stage for grouping)
  |
  +-- 3a: New dashboard page components (AttentionZone, TimelineZone, EngagementsByStage)
  +-- 3b: New hooks (useAttentionItems, useDashboardStats, useEngagementsByStage)
  +-- 3c: Role-adaptive filter logic
  |
Phase 4: Engagement Workspace                   (needs lifecycle + route consolidation done)
  |
  +-- 4a: WorkspaceShell, LifecycleBar, WorkspaceTabs components
  +-- 4b: Convert $id.tsx to layout route, create $id/ child routes
  +-- 4c: Migrate existing EngagementDossierPage content to overview tab
  +-- 4d: Build scoped tabs (tasks, calendar, docs, audit)
  +-- 4e: Forum workspace (same pattern + sessions)
  |
Phase 5: Enriched Dossier Pages                 (reuses workspace patterns)
  |
  +-- 5a: RelationshipSidebar component
  +-- 5b: DossierDetailLayout sidebar slot integration
  +-- 5c: Type-specific enrichments (anchor, thread, contact tiers)
  +-- 5d: Elected Officials domain + pages + routes
  |
Phase 6: Feature Absorption                     (must come last)
  |
  +-- 6a: Analytics -> dashboard widgets
  +-- 6b: AI Briefings -> workspace Docs tab "Generate" action
  +-- 6c: Network Graph -> RelationshipSidebar expandable view
  +-- 6d: Search -> enhanced Cmd+K quick switcher
  +-- 6e: Remove absorbed standalone pages
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Over-nesting Routes

**What:** Creating nested route directories for every dossier type's tabs
**Why bad:** 8 types x 6 tabs = 48 route files. Most tabs are lightweight.
**Instead:** Use nested routes ONLY for workspace types (engagements, forums) where tabs have heavy, independently-splittable content (kanban, calendar). Other types use client-side tab state within the page component.

### Anti-Pattern 2: Duplicating Data Fetching Across Tabs

**What:** Each workspace tab independently fetching the engagement
**Why bad:** 6 tabs = 6 redundant queries for the same engagement
**Instead:** Fetch engagement once in the layout route (`$id.tsx`). Child tab routes only fetch their specific data (tasks, calendar events, etc.). TanStack Query deduplication helps, but avoiding the calls entirely is better.

### Anti-Pattern 3: Breaking Navigation During Migration

**What:** Removing old routes before new ones are stable
**Why bad:** Users lose bookmarks, notification links break, ChatDock citations break
**Instead:** Phase 1 adds redirect stubs from old paths to new canonical paths. The `_protected.tsx` file already has `handleCitationClick` referencing `/engagements/$engagementId` -- this must be updated to `/dossiers/engagements/$id`. Old route files become redirect-only stubs. Remove stubs after confirming no external references.

### Anti-Pattern 4: Lifecycle State in Client Only

**What:** Managing lifecycle transitions as client-side state or local storage
**Why bad:** Multiple users on same engagement = state drift, no audit trail
**Instead:** Lifecycle state lives in database. Transitions are API calls. Realtime subscription propagates changes to all connected clients. Client always reads server state.

### Anti-Pattern 5: Giant God Components

**What:** Building WorkspaceShell as a single 500+ line component
**Why bad:** Hard to test, hard to code-split, RTL/responsive complexity compounds
**Instead:** Compose from focused sub-components (WorkspaceHeader, LifecycleBar, WorkspaceTabs), each independently testable and memoizable.

## Patterns to Follow

### Pattern 1: Layout Route for Workspace Shell

**What:** TanStack Router `$id.tsx` renders persistent shell, child routes render in `<Outlet />`
**When:** Engagement and forum detail pages
**Why:** Workspace chrome (header, lifecycle bar, tabs) persists across tab navigation. No re-mount, no layout shift. Already proven by `_protected.tsx` in this codebase.

### Pattern 2: Domain Repository Extension (not new domain)

**What:** Add lifecycle methods to existing engagement repository, not a separate lifecycle domain
**When:** Lifecycle is an engagement concern, not a cross-cutting domain
**Example:**

```typescript
// Add to engagements.repository.ts
export async function transitionLifecycleStage(
  id: string,
  stage: LifecycleStage,
): Promise<EngagementFullProfile> {
  return apiPatch<EngagementFullProfile>(`/engagement-dossiers/${id}`, { lifecycle_stage: stage })
}
```

### Pattern 3: Scoped Query Keys for Tab Data

**What:** Engagement-scoped query keys enable targeted invalidation
**When:** Workspace tabs fetch engagement-scoped data
**Example:**

```typescript
export const workspaceKeys = {
  tasks: (engagementId: string) => ['workspace', 'tasks', engagementId] as const,
  calendar: (engagementId: string) => ['workspace', 'calendar', engagementId] as const,
  docs: (engagementId: string) => ['workspace', 'docs', engagementId] as const,
  audit: (engagementId: string) => ['workspace', 'audit', engagementId] as const,
}
```

### Pattern 4: Sidebar Config as Single Source of Truth

**What:** All navigation items defined in `navigation-config.ts`, sidebar renders declaratively
**When:** Always -- this pattern already exists and should be preserved
**Why:** Adding/removing nav items is a data change, not a component change.

## Scalability Considerations

| Concern               | At current scale          | At 100 engagements                | At 1000 engagements                        |
| --------------------- | ------------------------- | --------------------------------- | ------------------------------------------ |
| Dashboard queries     | Single query per widget   | Add pagination to Attention items | Virtual scrolling, server-side aggregation |
| Lifecycle transitions | Direct API call           | Same                              | Add optimistic updates with rollback       |
| RelationshipSidebar   | Fetch all linked dossiers | Same (usually <20 links)          | Paginate if >50 links                      |
| Workspace tab data    | Fetch on tab mount        | Same                              | Prefetch adjacent tabs on hover            |
| Route tree size       | ~80 routes                | ~90 routes (workspace tabs)       | Same (scale is in data, not routes)        |

## Integration Points Summary

| Integration Point     | Current State                            | Required Change                                     | Scope          |
| --------------------- | ---------------------------------------- | --------------------------------------------------- | -------------- |
| Route tree            | Flat + dossiers/ nesting                 | Add workspace nested routes, delete duplicates      | Major          |
| navigation-config.ts  | 7 sections, tools-focused                | 3 sections, hub-focused                             | Rewrite        |
| AppSidebar.tsx        | Renders NavMain                          | Minimal (tier sub-labels)                           | Small          |
| \_protected.tsx       | MainLayout + ChatDock + citation handler | Update citation paths                               | Small          |
| DossierDetailLayout   | Header + grid + actions                  | Add sidebar slot                                    | Small          |
| dossier-routes.ts     | 7 types mapped                           | Add elected_official, rename working_groups         | Small          |
| EngagementDossierPage | Dialog-based kanban                      | Becomes layout route with Outlet                    | Major refactor |
| engagements domain    | CRUD + participants + kanban + briefs    | Add lifecycle types + hooks                         | Extension      |
| work-items domain     | Standard CRUD                            | Add lifecycle_stage filter                          | Extension      |
| calendar domain       | Global events                            | Add engagement scope filter                         | Extension      |
| Dashboard page        | Metric cards                             | Full redesign to 3-zone ops hub                     | Rewrite        |
| Backend API           | No lifecycle endpoints                   | lifecycle_stage on PATCH, new aggregation endpoints | Extension      |
| Database              | No lifecycle_stage column                | 2-3 Supabase migrations                             | Migration      |

## Sources

- Direct codebase analysis of TanStack Router v5 file-based routing patterns (verified `_protected.tsx` uses layout route + `<Outlet />` pattern)
- Existing domain repository pattern verified across 20 domains in `frontend/src/domains/`
- Navigation config inspected at `frontend/src/components/layout/navigation-config.ts` (301 lines)
- AppSidebar inspected at `frontend/src/components/layout/AppSidebar.tsx` (189 lines)
- Engagement domain inspected: repository (383 lines), types (190 lines), hooks (341 lines)
- Route tree enumerated: 100+ route files under `routes/_protected/`
- Dossier route utility inspected at `frontend/src/lib/dossier-routes.ts`
- 7 type-specific dossier pages confirmed at `frontend/src/pages/dossiers/`
- Backend API structure verified: no lifecycle or elected-official endpoints exist
