# Domain Pitfalls

**Domain:** Hub-and-spoke architecture redesign for existing diplomatic dossier management app
**Researched:** 2026-03-28
**Codebase:** 129 route files, 100+ protected routes, 8 dossier types, bilingual RTL/LTR, 200KB bundle budget

---

## Critical Pitfalls

Mistakes that cause rewrites, broken navigation, or major regressions.

### Pitfall 1: Route Restructuring Breaks TanStack Router's Generated Route Tree

**What goes wrong:** Moving route files from flat `_protected/countries.tsx` to nested `_protected/dossiers/countries/index.tsx` invalidates the auto-generated `routeTree.gen.ts`. Every `createFileRoute` call contains a hardcoded path string that TanStack Router's bundler plugin manages. Moving files without running the route generator creates mismatches between the path string in the file and the actual file location, causing silent 404s or build failures.

**Why it happens:** The codebase currently has **duplicate routes** -- both `_protected/countries.tsx` AND `_protected/dossiers/countries/index.tsx` exist for countries, engagements, forums, organizations, persons, and working groups. The spec calls for consolidating under `/dossiers/{type}/`, but deleting the old flat routes while keeping the new nested ones requires careful coordination with the route tree generator.

**Consequences:**

- Build failures from route tree mismatches (129 route files to reconcile)
- Broken deep links and bookmarks (users have saved `/countries/123`, now it is `/dossiers/countries/123`)
- Navigation shell hardcoded links pointing to old paths
- `_protected.tsx` has hardcoded navigation paths in `handleCitationClick` (lines 30-43) that will break

**Prevention:**

1. Run `pnpm tsr generate` (TanStack Router CLI) after every file move to regenerate `routeTree.gen.ts`
2. Create redirect routes from old paths to new paths BEFORE removing old route files -- use TanStack Router's `redirect` in `beforeLoad`
3. Audit all hardcoded route strings project-wide with `grep -r "to: '/" | grep -v node_modules` before removing old routes
4. Move routes in batches by tier (anchors first, then activities, threads, contacts) -- not all at once
5. Keep old route files as thin redirect stubs for one release cycle

**Detection:** Build failures mentioning `routeTree.gen.ts`, 404s in navigation, broken sidebar links, Sentry errors with "Route not found"

**Phase to address:** Phase 1 (Navigation & Route Consolidation)

---

### Pitfall 2: Dual Navigation System Collision

**What goes wrong:** The codebase already has THREE navigation implementations: `components/layout/Sidebar.tsx`, `components/layout/AppSidebar.tsx`, and `components/modern-nav/NavigationShell/NavigationShell.tsx`. Adding a new hub-based sidebar without fully removing the old ones creates conflicts -- multiple sidebars rendering, inconsistent active-state highlighting, and competing mobile drawers.

**Why it happens:** The existing `MainLayout.tsx` wraps the protected layout and uses one sidebar system. The `NavigationShell` was built as a demo/experiment (`modern-nav-demo.tsx`, `modern-nav-standalone.tsx`). Developers add the new hub-based sidebar to `MainLayout` but forget to remove or guard the old components, causing double-renders.

**Consequences:**

- Two sidebars visible on certain routes
- Active route highlighting broken (each sidebar has its own route-matching logic)
- Mobile bottom tab bar conflicts with sidebar drawer
- Bundle bloat from shipping all three navigation implementations (~30-50KB wasted)
- Accessibility issues: multiple `nav` landmarks confuse screen readers

**Prevention:**

1. Audit all three navigation components BEFORE starting: `Sidebar.tsx`, `AppSidebar.tsx`, `NavigationShell.tsx`
2. Choose ONE as the base to modify (likely `AppSidebar.tsx` since it is the newest shadcn-compatible one)
3. Delete demo routes (`modern-nav-demo.tsx`, `modern-nav-standalone.tsx`) as the very first commit
4. Use Knip (already configured) to catch unused navigation component imports after deletion
5. Single `MainLayout.tsx` should be the sole location where the sidebar renders

**Detection:** Visual regression (two sidebars), Knip reporting unused exports from old nav components, bundle analysis showing dead navigation code

**Phase to address:** Phase 1 (Navigation & Route Consolidation) -- must be first action

---

### Pitfall 3: Engagement Workspace Tabs Render All Content Eagerly

**What goes wrong:** The `WorkspaceShell` component renders all 6 tabs (Overview, Context, Tasks, Calendar, Docs, Audit) on mount, even though only one is visible. Each tab contains heavy components -- Kanban board (80KB chunk), Calendar, React Flow graph, Document manager. Initial load of the engagement workspace becomes 300KB+, blowing through the 200KB budget.

**Why it happens:** The natural React pattern `{activeTab === 'tasks' && <TasksTab />}` unmounts and remounts on tab switch, losing state. Developers avoid this by keeping all tabs mounted but hidden with CSS (`display: none`). This loads all tab JavaScript eagerly.

**Consequences:**

- Engagement workspace initial load exceeds 200KB budget (Tasks chunk alone is 80KB)
- `size-limit` CI gate fails on `build:ci`
- Slow Time-to-Interactive on engagement pages, especially on mobile
- Memory pressure from 6 mounted-but-hidden heavy components

**Prevention:**

1. Use `React.lazy()` + `Suspense` for each tab content component -- TanStack Router already does this for routes, extend the pattern to workspace tabs
2. Implement "render on first visit, keep mounted after" pattern:
   ```tsx
   const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['overview']))
   // On tab change: setVisitedTabs(prev => new Set([...prev, newTab]))
   // Render: visitedTabs.has(tabId) && <Suspense><LazyTabContent /></Suspense>
   ```
3. Consider using the React 19.2 `<Activity>` component which supports hide/show without unmount -- it is designed for exactly this pattern
4. Split workspace tabs into separate route-based code-split chunks: `/dossiers/engagements/:id/tasks` already in the spec, use TanStack Router's file-based routing to auto-split each tab into its own chunk
5. Run `pnpm build:ci` (which includes `size-limit`) after every workspace component addition

**Detection:** `size-limit` CI failure, Lighthouse performance score drop, bundle analyzer showing workspace chunk > 100KB

**Phase to address:** Phase 3 (Engagement Workspace) -- design decision needed before building any tabs

---

### Pitfall 4: Lifecycle State Machine Without Proper Persistence Creates Ghost States

**What goes wrong:** The lifecycle engine (Intake -> Preparation -> Briefing -> Execution -> Follow-up -> Closed) is implemented as client-side state only, without atomic database transitions. If a user advances from "Preparation" to "Briefing" but the API call fails silently, the UI shows "Briefing" while the database says "Preparation". Other users see a different state. The engagement is in a "ghost state."

**Why it happens:** The spec says stage transitions are "driven by task completion" and "not rigid -- staff can skip stages or move backward." This flexibility tempts developers to handle transitions purely in React state (or TanStack Query optimistic updates) without server-side validation. The `lifecycle_stage` enum on the `engagements` table becomes a dumb column that gets updated as an afterthought.

**Consequences:**

- State divergence between users viewing the same engagement
- Lost audit trail (the spec requires stage transitions to be logged in the Audit tab)
- Impossible to query "all engagements in Briefing stage" reliably for the Operations Hub
- Optimistic UI updates that never reconcile on network failure
- The "guide, not gate" philosophy is misinterpreted as "no validation" -- leading to invalid transitions (e.g., jumping from Intake to Closed)

**Prevention:**

1. Server-side transition validation: create a dedicated `PATCH /api/engagements/:id/transition` endpoint that validates allowed transitions, updates the column, and writes an audit log entry -- all in a single database transaction
2. Define allowed transitions as a simple adjacency map (no XState needed for 6 linear stages):
   ```typescript
   const ALLOWED_TRANSITIONS: Record<Stage, Stage[]> = {
     intake: ['preparation'],
     preparation: ['briefing', 'intake'], // backward allowed
     briefing: ['execution', 'preparation'],
     execution: ['follow_up', 'briefing'],
     follow_up: ['closed', 'execution'],
     closed: ['follow_up'], // reopen allowed
   }
   ```
3. Keep it simple: do NOT introduce XState for this. Six linear stages with backward allowed is a lookup table, not a state machine library. XState adds ~15KB to the bundle for no benefit here.
4. Use TanStack Query's `useMutation` with `onError` rollback, NOT optimistic updates for stage transitions
5. Add a `lifecycle_transitions` audit table or use the existing audit log system

**Detection:** Different lifecycle stages shown to different users, audit tab missing transition entries, Operations Hub engagement counts do not match reality

**Phase to address:** Phase 6 (Lifecycle Engine) -- but the DB schema must be designed in Phase 3 when the workspace is built

---

### Pitfall 5: Feature Absorption Breaks Existing Functionality Silently

**What goes wrong:** When absorbing standalone pages (analytics, briefings, network graph, etc.) into contextual locations (dashboard widgets, workspace tabs, sidebar panels), the absorbed components lose their standalone data-fetching, routing, and state management. They were built to be full pages with their own query params, error boundaries, and loading states. Embedding them inside a tab strips all of that.

**Why it happens:** The spec lists 10+ pages to absorb. Developers copy the page component into a tab or widget, remove the route wrapper, and the component breaks because it relied on:

- Route search params (`useSearch()` from TanStack Router) that do not exist in a tab context
- Full-page error boundaries that are now nested inside a workspace
- Standalone TanStack Query keys that conflict with the parent workspace's queries
- Page-level loading skeletons that look wrong inside a card/tab

**Consequences:**

- Analytics charts that worked standalone now show empty states inside dashboard widgets (lost query param context)
- Network graph that expected full viewport now renders in a 300px sidebar panel (layout break)
- AI briefing generation that navigated to `/briefings/:id` on success now has nowhere to navigate
- Duplicated API calls (parent workspace and embedded component both fetch similar data)
- Error in one absorbed component crashes the entire workspace (no granular error boundary)

**Prevention:**

1. Create "embedded" variants of each component, not just move the page component:
   - `AnalyticsPage.tsx` (standalone, full page) vs `AnalyticsWidget.tsx` (embedded, card-sized)
   - Each variant manages its own scope (props-driven, not route-driven)
2. Wrap every absorbed component in its own `ErrorBoundary` -- a crash in the network graph sidebar must NOT crash the dossier detail page
3. Replace `useSearch()` route dependencies with props: `<AnalyticsWidget dossierType="country" dossierId={id} />`
4. Audit all `useNavigate()` calls in absorbed components -- they need to be converted to callbacks or removed
5. Test each absorption in isolation: render the embedded variant without a route context and verify it works
6. Do NOT delete standalone pages until the embedded variant is verified -- keep both for one release

**Detection:** Empty states in embedded components, console errors about missing route context, workspace crashes on specific tabs, duplicate network requests in DevTools

**Phase to address:** Phase 5 (Feature Absorption) -- but embedded variant interfaces should be designed during Phase 2 (dashboard widgets) and Phase 3 (workspace tabs)

---

## Moderate Pitfalls

### Pitfall 6: RTL Sidebar and RelationshipSidebar Panel Direction Inversion

**What goes wrong:** The new hub-based sidebar (left in LTR) must appear on the RIGHT in RTL. The `RelationshipSidebar` (right panel in LTR) must appear on the LEFT in RTL. If either uses physical CSS properties (`left`, `right`, `margin-left`) instead of logical properties (`inset-inline-start`, `ms-*`, `me-*`), the panels render on the wrong side in Arabic.

**Why it happens:** The codebase has `eslint-plugin-rtl-friendly` but it is at WARN level (not ERROR). Developers can ship physical properties without build failure. The existing `Sidebar.tsx` and `AppSidebar.tsx` were built before the RTL hardening in v2.0 Phase 4 and may contain legacy physical properties.

**Prevention:**

1. Audit existing sidebar components for physical CSS properties before modifying them
2. Use Tailwind logical properties exclusively: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`
3. For collapsible panels, use `inset-inline-start` / `inset-inline-end` for positioning, NOT `left` / `right`
4. The `RelationshipSidebar` must use `end-0` (not `right-0`) for positioning -- in RTL this resolves to physical left
5. Test every sidebar state (expanded, collapsed, mobile drawer) in BOTH Arabic and English
6. Consider promoting `eslint-plugin-rtl-friendly` to ERROR level for new files in `components/layout/`

**Detection:** Sidebar on wrong side in Arabic, overlapping panels, `eslint-plugin-rtl-friendly` warnings in CI output

**Phase to address:** Phase 1 (sidebar) and Phase 4 (RelationshipSidebar)

---

### Pitfall 7: LifecycleBar Stage Indicator Renders Backwards in RTL

**What goes wrong:** The 6-stage lifecycle bar (Intake -> Preparation -> Briefing -> Execution -> Follow-up -> Closed) is a horizontal stepper. In LTR it flows left-to-right. In RTL with `dir="rtl"`, `flexDirection: "row"` reverses to right-to-left. If the JSX order is `[Intake, Preparation, ..., Closed]`, Arabic users see Closed on the right and Intake on the left -- the OPPOSITE of the intended temporal flow.

**Why it happens:** The global RTL rules state "the FIRST JSX child in a row renders on the RIGHT" in RTL. For a lifecycle bar, Arabic readers should still see progression from right (start) to left (end). BUT -- if the lifecycle represents temporal progression (universally left-to-right in progress bars), then the RTL flip produces a confusing result. This is an ambiguous UX decision that gets decided wrong by default.

**Prevention:**

1. Make an explicit UX decision BEFORE building: should the lifecycle bar flip in RTL?
   - **Option A (Recommended):** Use `dir="ltr"` on the lifecycle bar container and wrap with the existing `LtrIsolate` component. Progress bars are universally left-to-right. Arabic text labels still render RTL within each stage bubble.
   - **Option B:** Let it flip naturally. First stage (Intake) on the right, last stage (Closed) on the left. Follows Arabic reading order.
2. Document the decision in the component's JSDoc
3. Test with both languages before merging
4. Use CSS `direction: ltr` with `unicode-bidi: isolate` for the container, letting text inside each stage bubble inherit RTL

**Detection:** Lifecycle bar looks "backwards" in one language, user confusion about which stage is first/current

**Phase to address:** Phase 3 (Engagement Workspace) -- decision needed in planning, not during implementation

---

### Pitfall 8: Operations Hub Dashboard Becomes a Monolithic Chunk

**What goes wrong:** The Operations Hub redesign adds 3 zones with 5+ widget types (AttentionCard, EngagementsByStage, Timeline, RecentActivity, QuickStats). Each widget imports its own charting library, date utilities, and data transformers. The existing `DashboardPage` chunk is already 72KB. Adding new widgets without code-splitting pushes it past the budget.

**Why it happens:** The dashboard is the home screen -- developers assume it should load fast and therefore eagerly import everything. But "load fast" and "import everything" are contradictory. The existing `charts-vendor` chunk is already 152KB (gzipped); if dashboard widgets import charting libraries that are not in the shared vendor chunk, they create new separate chunks.

**Prevention:**

1. Each dashboard zone should be a separate lazy-loaded component with its own `Suspense` boundary
2. "Above the fold" content (Action Bar + Attention Needed) loads eagerly; below-fold (Timeline, Activity) loads lazily
3. Share the existing `charts-vendor` chunk -- do NOT import alternative charting libraries
4. Use skeleton placeholders per zone (not one big skeleton for the whole page)
5. Run `pnpm analyze` (Vite bundle analyzer, already configured) after adding each widget
6. Widget data queries should use TanStack Query's `staleTime` tiers (already established in v2.0)

**Detection:** `size-limit` CI failure on "Initial JS" entry, Lighthouse LCP regression, bundle analyzer showing new vendor chunks

**Phase to address:** Phase 2 (Operations Hub)

---

### Pitfall 9: Scoped Kanban/Calendar Lose Global Functionality

**What goes wrong:** The workspace Tasks and Calendar tabs show engagement-scoped views of the existing Kanban and Calendar components. Developers create scoped versions by filtering the existing query, but the scoped version loses features: bulk actions, cross-engagement drag-and-drop, export, and filter persistence that the global versions had.

**Why it happens:** The global Kanban (`/tasks`) fetches all work items and has complex filter state in URL search params. The scoped workspace version needs to filter by engagement ID but still support the same interactions. If the scoped version is a copy-paste with a filter added, it diverges immediately. If it is a prop-based filter on the original, the original's assumptions about global scope break.

**Prevention:**

1. Refactor the Kanban component to accept an optional `scope` prop: `{ type: 'engagement', id: string } | { type: 'global' }`
2. The scope prop controls the query filter, available columns, and which actions are shown
3. Do NOT create a separate `ScopedKanban` component -- keep one component with scope awareness
4. Same pattern for Calendar: `scope` prop controls the query
5. URL search params for filters should be namespaced per scope to avoid conflicts
6. Test both global (`/tasks`) and scoped (workspace tab) variants after every change

**Detection:** Missing features in scoped view compared to global, filter state leaking between global and scoped views, drag-and-drop broken in scoped view

**Phase to address:** Phase 3 (workspace tabs reference existing components)

---

### Pitfall 10: Mobile Bottom Tab Bar Conflicts with Workspace Tab Bar

**What goes wrong:** The spec adds a mobile bottom tab bar (Dashboard, Dossiers, Tasks, More) AND workspace tabs (Overview, Context, Tasks, Calendar, Docs, Audit). On mobile, users see TWO horizontal tab bars -- the workspace tabs at the top and the bottom navigation. The "Tasks" label appears in both bars but navigates to different views. Confusion and wasted vertical space on small screens.

**Why it happens:** Bottom tab bars and workspace tabs serve different purposes (app-level nav vs page-level nav) but look identical on a small screen. The spec does not address how they coexist on mobile.

**Prevention:**

1. On mobile, workspace tabs should become a scrollable horizontal pill bar (not a tab bar) with distinct styling from the bottom navigation
2. Alternatively, workspace tabs could become a dropdown/select on mobile (< 640px breakpoint)
3. The bottom tab bar's "Tasks" navigates to `/tasks` (global); workspace Tasks tab is clearly labeled "Engagement Tasks" or scoped with the engagement name
4. Minimum 44px touch targets on both bars (already enforced in codebase)
5. Test on 320px viewport width -- both bars must be usable simultaneously without overlapping

**Detection:** User testing shows confusion between the two tab levels, vertical space complaints on mobile, touch target overlap

**Phase to address:** Phase 3 (Engagement Workspace) mobile responsive design

---

## Minor Pitfalls

### Pitfall 11: Cmd+K Quick Switcher Search Index Stale After Route Changes

**What goes wrong:** If the Cmd+K quick switcher has a hardcoded list of navigable routes, it becomes stale after route consolidation. Users search for "Analytics" (absorbed page) and get a dead link or no result.

**Prevention:**

1. Quick switcher index should be derived from the route tree, not hardcoded
2. Add entity search (dossiers, engagements by name) alongside route search
3. Update the index in Phase 5 when pages are absorbed

**Phase to address:** Phase 1 (initial), Phase 5 (update after absorption)

---

### Pitfall 12: Forum Sessions Create Deeply Nested Routes

**What goes wrong:** Forums with sessions create routes like `/dossiers/forums/:forumId/sessions/:sessionId/tasks` which is 4 levels deep. TanStack Router handles this fine technically, but the breadcrumb, URL length, and mental model become unwieldy for users.

**Prevention:**

1. Sessions should be handled within the forum workspace as state/tabs, not as additional route nesting
2. URL pattern: `/dossiers/forums/:forumId?session=sessionId&tab=tasks` (search params, not path params)
3. This keeps the route tree flat while still being deep-linkable

**Phase to address:** Phase 3 or Phase 6 (Forum workspace)

---

### Pitfall 13: i18n Namespace Explosion from New Components

**What goes wrong:** Each new shared component (LifecycleBar, DossierCard, RelationshipSidebar, WorkspaceShell, AttentionCard, StageKanban) needs translation keys. If each creates its own i18n namespace, the number of translation files doubles and Arabic translations lag behind English.

**Prevention:**

1. Group new component translations under existing namespaces: `engagement-workspace`, `operations-hub`, `dossier-hub`
2. Create all Arabic translation keys AT THE SAME TIME as English -- not as a follow-up task
3. Use the existing `unified-kanban` namespace for scoped kanban translations
4. Add a CI check that Arabic and English namespace files have the same keys

**Phase to address:** All phases -- enforce from Phase 1

---

### Pitfall 14: Relationship Sidebar Causes N+1 Query Problem

**What goes wrong:** The RelationshipSidebar appears on every dossier detail page and shows linked dossiers grouped by tier. If it fetches each linked dossier individually, a country with 20 linked engagements + 10 persons + 5 organizations triggers 35 API calls on page load.

**Prevention:**

1. Create a dedicated `GET /api/dossiers/:id/relationships` endpoint that returns all linked dossiers in one query with a JOIN
2. Use TanStack Query's `staleTime` from the existing tier system (likely "reference data" tier with longer stale time)
3. The sidebar should show compact cards with pre-joined data, not fetch full dossier objects
4. Paginate if a dossier has more than 20 relationships per tier

**Phase to address:** Phase 4 (Dossier Hub enriched detail pages)

---

## Phase-Specific Warnings

| Phase                | Likely Pitfall                                 | Mitigation                                         | Severity |
| -------------------- | ---------------------------------------------- | -------------------------------------------------- | -------- |
| Phase 1: Navigation  | Route tree breaks on file moves (#1)           | Batch moves by tier, run `tsr generate` after each | Critical |
| Phase 1: Navigation  | Dual sidebar collision (#2)                    | Delete old nav components first                    | Critical |
| Phase 1: Navigation  | RTL sidebar direction (#6)                     | Logical properties only, test both languages       | Moderate |
| Phase 2: Ops Hub     | Dashboard monolithic chunk (#8)                | Lazy-load zones, share charts-vendor               | Moderate |
| Phase 3: Workspace   | Tab eager rendering (#3)                       | Route-based code splitting per tab                 | Critical |
| Phase 3: Workspace   | Lifecycle bar RTL direction (#7)               | Explicit UX decision + LtrIsolate                  | Moderate |
| Phase 3: Workspace   | Scoped vs global component divergence (#9)     | Scope prop pattern, one component                  | Moderate |
| Phase 3: Workspace   | Mobile tab bar conflict (#10)                  | Distinct styling, scrollable pills                 | Moderate |
| Phase 4: Dossier Hub | N+1 relationship queries (#14)                 | Dedicated batch endpoint                           | Minor    |
| Phase 5: Absorption  | Silent feature regression (#5)                 | Embedded variants + ErrorBoundary                  | Critical |
| Phase 5: Absorption  | Quick switcher stale index (#11)               | Derive from route tree                             | Minor    |
| Phase 6: Lifecycle   | Ghost states from client-only transitions (#4) | Server-side transition endpoint                    | Critical |
| Phase 6: Lifecycle   | Forum deep nesting (#12)                       | Search params instead of path nesting              | Minor    |
| All Phases           | i18n namespace explosion (#13)                 | Grouped namespaces, simultaneous AR/EN             | Minor    |

## Bundle Budget Risk Assessment

Current state (gzipped, from size-limit config):

- **Initial JS entry:** 200KB limit (currently at the limit)
- **React vendor:** 50KB limit
- **TanStack vendor:** 80KB limit
- **Charts vendor:** 152KB (separate chunk, own budget)

New components and their bundle risk:

| Component                    | Estimated Size (gzipped)        | Mitigation                                |
| ---------------------------- | ------------------------------- | ----------------------------------------- |
| LifecycleBar                 | ~5KB                            | Small, safe to eagerly load               |
| WorkspaceShell + 6 tabs      | ~80-120KB total                 | MUST be route-split per tab               |
| RelationshipSidebar          | ~15KB                           | Lazy-load (collapsible panel)             |
| Dashboard widgets (5 types)  | ~40-60KB total                  | Zone-based lazy loading                   |
| StageKanban                  | ~10KB on top of existing Kanban | Scope prop on existing, not new component |
| Quick Switcher (Cmd+K)       | ~20KB                           | Already exists, enhancement only          |
| XState (if mistakenly added) | ~15KB                           | DO NOT ADD -- use lookup table instead    |

**Total new JS:** ~170-230KB spread across lazy-loaded chunks.

**Key risk:** The initial entry point budget (200KB) is already at the limit. ANY new code that lands in the entry chunk (not lazy-loaded) will break CI. Every new component MUST be behind `React.lazy()` or route-based code splitting. The only safe eager additions are tiny components (< 5KB) like LifecycleBar and the sidebar navigation structure itself.

## Sources

- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/routing/file-based-routing) -- route restructuring patterns, auto-generated path strings
- [TanStack Router Routing Concepts](https://tanstack.com/router/latest/docs/routing/routing-concepts) -- layout routes, pathless routes
- [Large App Route Migration Discussion](https://www.answeroverflow.com/m/1443596813851427007) -- strangler pattern for 250+ route migration
- [React State Management 2025](https://www.developerway.com/posts/react-state-management-2025) -- XState complexity vs simpler alternatives
- [XState Guidelines](https://kyleshevlin.com/guidelines-for-state-machines-and-xstate/) -- when state machines are overkill
- [React 19.2 Activity Component](https://react.dev/blog/2025/10/01/react-19-2) -- hide/show without unmount for tab patterns
- [shadcn/ui Sidebar RTL Support](https://ui.shadcn.com/docs/components/radix/sidebar) -- dir prop patterns for RTL sidebars
- [React Bundle Size Code Splitting](https://dev.to/gouranga-das-khulna/how-we-cut-our-react-bundle-size-by-40-with-smart-code-splitting-2chi) -- dashboard widget splitting strategies
- [Tab Lazy Loading in React](https://learnersbucket.com/examples/interview/tab-component-with-lazy-loading-in-react/) -- render-on-first-visit pattern
- [FreeCodeCamp Tab Performance](https://www.freecodecamp.org/news/build-a-high-performance-tab-component/) -- tab component optimization patterns

---

_Researched: 2026-03-28 for v3.0 "Connected Workflow" milestone_
