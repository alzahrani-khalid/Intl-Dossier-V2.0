# Phase 13: Feature Absorption - Research

**Researched:** 2026-04-02
**Domain:** Frontend component absorption, command palette enhancement, route cleanup
**Confidence:** HIGH

## Summary

Phase 13 absorbs 6 standalone feature pages (analytics, AI briefings, network graph, search, availability polling, export/import) into their contextual locations within the hub-and-spoke architecture established in Phases 10-12. The existing `CommandPalette.tsx` (already wired to Cmd+K via `KeyboardShortcutProvider`) needs enhancement from a navigation/shortcut palette into a full-featured quick switcher that replaces the standalone search page entirely.

The codebase is well-prepared: `MiniRelationshipGraph` already exists with React Flow rendering and sidebar-compatible sizing, `DocsTab` already has "Generate Briefing" action via `useGenerateEngagementBrief`, and the dashboard `OperationsHub` uses a zone-based grid that can accept analytics widgets. The dossier overview tabs follow a simple card grid pattern (e.g., `CountryOverviewTab` with `SharedSummaryStatsCard`, `BilateralSummaryCard`, etc.) where analytics cards can be added.

**Primary recommendation:** Extend (not rebuild) existing components. The CommandPalette already has grouped results, cache-first hybrid search, and mobile full-screen support. Analytics absorption requires new dashboard widgets and per-dossier-type metric cards. Route removal must include redirects to preserve bookmarks and external links.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Search scope covers ALL four categories: all 8 dossier entity types, recent items, commands/actions, and global full-text search
- **D-02:** Results organized in grouped categories: Recent -> Entities (sub-grouped by dossier type) -> Commands -> Search Results. Similar to VS Code/Linear command palettes
- **D-03:** Empty state (before typing) shows 5 most recent dossiers visited + 5 most-used commands. Results replace this as user types
- **D-04:** Cmd+K completely replaces the standalone advanced search page (ABSORB-03). No separate search page remains
- **D-05:** Dashboard gets summary KPI widgets: total dossiers by type, active engagements, upcoming deadlines, work item stats. High-level glanceable overview only -- no deep drill-down charts on dashboard itself
- **D-06:** Individual dossier overview pages get context-specific metric cards tailored per dossier type
- **D-07:** RelationshipSidebar gets inline mini-graph preview (reusing existing MiniRelationshipGraph component). Click "Expand" to open full-screen modal with full graph controls and interactions
- **D-08:** Full graph modal provides the complete interactive experience previously on the standalone network graph page
- **D-09:** Old standalone routes redirect to their new contextual locations. No broken links or 404s
- **D-10:** Absorbed features accessible BOTH from their contextual location AND via Cmd+K commands (dual-access)
- **D-11:** Analytics (ABSORB-01) -> Dashboard summary widgets + dossier overview context-specific cards
- **D-12:** AI Briefings (ABSORB-02) -> Engagement workspace DocsTab "Generate" action
- **D-13:** Search (ABSORB-03) -> Enhanced Cmd+K quick switcher (replaces standalone page entirely)
- **D-14:** Network Graph (ABSORB-04) -> RelationshipSidebar inline mini-graph + expand-to-modal
- **D-15:** Availability Polling (ABSORB-05) -> CalendarTab "Schedule" action
- **D-16:** Export/Import (ABSORB-06) -> List view action buttons

### Claude's Discretion
- Keyboard navigation patterns within Cmd+K (arrow keys, enter, escape behavior)
- Bilingual search matching strategy (Arabic + English simultaneous fuzzy matching)
- Result count limits per category in Cmd+K
- Chart types for dashboard summary widgets
- Analytics card refresh intervals
- Mini-graph node interaction behavior (hover, click)
- Full-screen modal graph controls and filters
- Redirect target mapping for edge cases (e.g., /briefing-books when no engagement context exists)
- Polling and Export absorption details (ABSORB-05, ABSORB-06) -- follow established workspace tab patterns

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ABSORB-01 | Analytics content absorbed into dashboard widgets and dossier overview cards -- standalone analytics page removed | Dashboard OperationsHub zone grid supports adding analytics widget zone; dossier overview tabs use card grid pattern (CountryOverviewTab etc.); analytics.repository.ts provides data layer; recharts 3.8.1 available for charts |
| ABSORB-02 | AI Briefings absorbed into workspace Docs tab "Generate" action -- standalone briefing pages removed | DocsTab already has full "Generate Briefing" action via useGenerateEngagementBrief; BriefingBooksPage standalone can be redirected; BriefingPackGenerator component exists for reuse |
| ABSORB-03 | Search enhanced into Cmd+K quick switcher with entity search, recent items, and command palette -- advanced search page removed | CommandPalette.tsx already has grouped results (Recents, Dossiers, Pages, Work Items, Commands), cache-first hybrid search via useQuickSwitcherSearch, mobile full-screen mode; needs empty-state enhancement per D-03 and full-text search results group |
| ABSORB-04 | Network graph absorbed into RelationshipSidebar expandable visualization view -- standalone network pages removed | MiniRelationshipGraph component ready with React Flow (@xyflow/react 12.10.2), circular layout, hover preview; RelationshipSidebar has clear insertion point above tier groups; needs full-screen modal wrapper for expanded view |
| ABSORB-05 | Availability polling absorbed into Calendar tab "Schedule" action -- standalone polling page removed | AvailabilityPollingPage exists at pages/availability-polling/; CalendarTab has placeholder structure for adding schedule action button |
| ABSORB-06 | Export/Import absorbed into action buttons on list views -- standalone export page removed | ExportDialog component exists at components/export/ExportDialog.tsx; DossierListPage is absorption target; export-import route is dev-mode gated |

</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cmdk | 1.1.1 | Command palette primitives | Already used for CommandPalette; Command.Group for grouped results |
| @xyflow/react | 12.10.2 | Network graph visualization | Already powers MiniRelationshipGraph and RelationshipGraphPage |
| recharts | 3.8.1 | Chart rendering for analytics widgets | Already installed; used for AnalyticsDashboardPage charts |
| @radix-ui/react-dialog | (installed) | Dialog/modal for full-screen graph | Already wraps CommandDialog; reuse for graph modal |
| framer-motion | (installed) | Animations for graph node transitions | Already used in MiniRelationshipGraph (m.div) |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | v5 | Data fetching for analytics widgets | Query key factory pattern from Phase 10 |
| @tanstack/react-router | v5 | Route redirects for absorbed pages | createFileRoute with redirect |

### No New Dependencies Required
This phase exclusively uses existing installed packages. No new npm installs needed.

## Architecture Patterns

### Recommended Structure for New Components
```
frontend/src/
  components/
    analytics/
      DashboardAnalyticsWidget.tsx    # KPI summary widget for dashboard
      DossierAnalyticsCard.tsx        # Per-type analytics card for overview tabs
    graph/
      FullScreenGraphModal.tsx        # Full graph in AdaptiveDialog modal
  pages/
    Dashboard/
      components/
        AnalyticsWidget.tsx           # Dashboard zone widget (new)
    dossiers/
      overview-cards/
        AnalyticsMetricCard.tsx       # Reusable metric card for overview tabs
```

### Pattern 1: Dashboard Zone Integration (ABSORB-01)
**What:** Add analytics KPI widgets to OperationsHub using existing zone pattern
**When to use:** Dashboard analytics absorption
**Example:**
```typescript
// In OperationsHub.tsx, add analytics zone after existing zones
// Follows ZoneCollapsible + data hook pattern from Phase 10
import { AnalyticsWidget } from './components/AnalyticsWidget'

// Inside the zone grid:
<ZoneCollapsible
  title={t('zones.analytics.title')}
  zoneKey="analytics"
  className={getZoneColSpan(role, 'analytics', zoneIndex)}
>
  <AnalyticsWidget role={role} />
</ZoneCollapsible>
```

### Pattern 2: Dossier Overview Card Pattern (ABSORB-01)
**What:** Add per-type analytics cards to dossier overview tab grids
**When to use:** Dossier-specific analytics absorption
**Example:**
```typescript
// CountryOverviewTab.tsx - add analytics card to existing grid
import { CountryAnalyticsCard } from './overview-cards/CountryAnalyticsCard'

// Inside the grid:
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
  <SharedSummaryStatsCard dossierId={dossierId} />
  <CountryAnalyticsCard dossierId={dossierId} />  {/* NEW */}
  <BilateralSummaryCard dossierId={dossierId} />
  {/* ... existing cards */}
</div>
```

### Pattern 3: CommandPalette Enhancement (ABSORB-03)
**What:** Extend existing CommandPalette with D-02/D-03 requirements
**When to use:** Quick switcher enhancement
**Example:**
```typescript
// In CommandPalette.tsx, enhance empty state (D-03)
// Before typing: show 5 recent dossiers + 5 most-used commands
const emptyStateRecents = recentNavItems.slice(0, 5)
const emptyStateCommands = mostUsedCommands.slice(0, 5)

// When searching: grouped results per D-02
// Recent -> Entities (sub-grouped by type) -> Commands -> Search Results
<CommandGroup heading="Recent">
  {filteredRecents.map(...)}
</CommandGroup>
<CommandSeparator />
<CommandGroup heading="Countries">
  {dossiersByType.country.map(...)}
</CommandGroup>
// ...per dossier type sub-groups
```

### Pattern 4: Mini-Graph + Full-Screen Modal (ABSORB-04)
**What:** Embed MiniRelationshipGraph in RelationshipSidebar, add expand-to-modal
**When to use:** Network graph absorption
**Example:**
```typescript
// In RelationshipSidebar.tsx, add above tier groups:
<MiniRelationshipGraph
  dossier={currentDossier}
  maxHeight="160px"
  className="mx-2 mb-2"
/>
<Button onClick={() => setGraphModalOpen(true)}>
  {t('sidebar.expandGraph')}
</Button>

// Full-screen modal uses AdaptiveDialog:
<AdaptiveDialog open={graphModalOpen} onOpenChange={setGraphModalOpen}>
  <ReactFlowProvider>
    <FullGraphView dossierId={dossierId} />
  </ReactFlowProvider>
</AdaptiveDialog>
```

### Pattern 5: Route Redirect (All Absorbed Routes)
**What:** Replace standalone route files with redirects
**When to use:** All absorbed standalone routes
**Example:**
```typescript
// In _protected/analytics.tsx (replacement)
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/analytics')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
```

### Anti-Patterns to Avoid
- **Creating new route pages for absorbed features:** Features must live inside existing contextual locations (dashboard zones, dossier overview cards, workspace tabs, sidebar), not new standalone pages
- **Duplicating data fetching logic:** Reuse existing domain repositories (analytics.repository.ts, briefings.repository.ts) and hooks (useAnalyticsDashboard, useGenerateEngagementBrief)
- **Breaking lazy-loading budget:** All new components must be lazy-loaded to stay within 200KB bundle budget; use React.lazy() for analytics widgets and graph modal
- **Using physical CSS properties:** Must use logical properties (ms-*, me-*, ps-*, pe-*, text-start, text-end) per CLAUDE.md RTL requirements
- **Removing routes without redirects:** Old URLs must redirect, not 404

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command palette search/filter | Custom fuzzy search | cmdk built-in filtering | cmdk handles filter, sort, keyboard nav, ARIA automatically |
| Graph layout algorithm | Custom node positioning | @xyflow/react layout engine | Already handles circular layout, zoom, pan, edge routing |
| Analytics charts | Custom SVG charts | recharts components | Already installed; handles responsive, RTL, accessibility |
| Route redirects | Manual redirect middleware | TanStack Router `redirect()` | Built-in, type-safe, handles search params |
| Modal dialog | Custom portal/overlay | AdaptiveDialog (existing wrapper) | Already handles mobile bottom-sheet vs desktop dialog |
| Search debouncing | Custom debounce | useQuickSwitcherSearch (200ms debounce built-in) | Already implemented with cache-first hybrid strategy |

## Common Pitfalls

### Pitfall 1: React Flow in RelationshipSidebar Width
**What goes wrong:** ReactFlow requires a container with explicit dimensions; sidebar width transitions (280px <-> 48px) cause graph to render incorrectly during animation
**Why it happens:** ReactFlow reads container dimensions on mount; CSS transition changes width after mount
**How to avoid:** Only render MiniRelationshipGraph when sidebar is fully expanded (`open === true`); use `key={open}` to force remount; set explicit height via `maxHeight` prop
**Warning signs:** Graph nodes clustered at origin, edges not visible, "fitView" warning in console

### Pitfall 2: Route Tree Regeneration After Route File Changes
**What goes wrong:** TanStack Router uses codegen route tree; deleting/replacing route files without regenerating causes build errors
**Why it happens:** Route tree file references deleted components
**How to avoid:** After changing route files, run `pnpm exec tsr generate` to regenerate route tree; verify with `pnpm typecheck`
**Warning signs:** "Module not found" errors pointing to old route paths

### Pitfall 3: cmdk Group Visibility with Empty Groups
**What goes wrong:** Empty CommandGroup components still render headings, creating visual clutter
**Why it happens:** cmdk renders group headings even when no items match the search
**How to avoid:** Conditionally render CommandGroup only when the group has items: `{items.length > 0 && <CommandGroup>...}`
**Warning signs:** Empty section headers appearing in search results

### Pitfall 4: Bundle Size from Graph Modal
**What goes wrong:** Importing full RelationshipGraphPage into RelationshipSidebar bloats the dossier detail bundle
**Why it happens:** React Flow and its dependencies are ~100KB+; eager import defeats lazy-loading
**How to avoid:** Lazy-load the full-screen graph modal: `const FullScreenGraph = lazy(() => import('./FullScreenGraphModal'))`; render inside Suspense only when modal is open
**Warning signs:** Bundle analyzer shows @xyflow chunk in main dossier bundle

### Pitfall 5: Navigation Config Inconsistency
**What goes wrong:** Sidebar still shows "Analytics", "Briefing Books", "Search" nav items pointing to removed routes
**Why it happens:** `navigation-config.ts` defines nav items separately from routes; removing routes without updating nav config creates dead links
**How to avoid:** Update `createNavigationGroups` in `navigation-config.ts` to remove absorbed nav items (analytics, briefing-books, advanced-search, availability-polling)
**Warning signs:** Clicking sidebar items triggers redirect loop or 404

### Pitfall 6: Dual useRelationshipsForDossier Hook Imports
**What goes wrong:** Two different `useRelationshipsForDossier` exist -- one in `@/hooks/useRelationships` (used by MiniRelationshipGraph) and one in `@/domains/relationships/hooks/useRelationships` (used by RelationshipSidebar)
**Why it happens:** Legacy hook file vs domain-structured hook
**How to avoid:** Verify both hooks use the same query key pattern so TanStack Query deduplicates correctly; when embedding MiniRelationshipGraph in RelationshipSidebar, data may already be fetched
**Warning signs:** Duplicate API calls for same dossier relationships

## Code Examples

### Enhanced CommandPalette Empty State (D-03)
```typescript
// When search query is empty, show default state
const isEmptyQuery = searchQuery.trim().length < 2

// Empty state content
{isEmptyQuery && (
  <>
    <CommandGroup heading={tQs('groups.recent')}>
      {recentNavItems.slice(0, 5).map((item) => (
        <CommandItem
          key={item.path}
          value={`recent-${item.path}`}
          onSelect={() => navigateTo(item.path)}
        >
          <Clock className="me-2 h-4 w-4" />
          <span>{item.title}</span>
        </CommandItem>
      ))}
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading={tQs('groups.commands')}>
      {mostUsedCommands.slice(0, 5).map((cmd) => (
        <CommandItem key={cmd.id} value={cmd.id} onSelect={cmd.action}>
          <cmd.icon className="me-2 h-4 w-4" />
          <span>{cmd.label}</span>
          {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
        </CommandItem>
      ))}
    </CommandGroup>
  </>
)}
```

### Full-Screen Graph Modal
```typescript
// FullScreenGraphModal.tsx
import { ReactFlowProvider } from '@xyflow/react'
import { AdaptiveDialog, AdaptiveDialogBody } from '@/components/ui/adaptive-dialog'

interface FullScreenGraphModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dossierId: string
  dossierType: string
}

export function FullScreenGraphModal({
  open,
  onOpenChange,
  dossierId,
}: FullScreenGraphModalProps): ReactElement {
  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('graph.fullScreen')}
    >
      <AdaptiveDialogBody className="h-[80vh] p-0">
        <ReactFlowProvider>
          {/* Reuse graph logic from RelationshipGraphPage */}
          <FullGraphInner dossierId={dossierId} />
        </ReactFlowProvider>
      </AdaptiveDialogBody>
    </AdaptiveDialog>
  )
}
```

### Route Redirect Pattern
```typescript
// Replace each absorbed route file with a redirect
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/analytics')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
```

### Dashboard Analytics KPI Widget
```typescript
// AnalyticsWidget.tsx - follows ZoneCollapsible content pattern
import { useAnalyticsDashboard } from '@/domains/analytics/hooks/useAnalyticsDashboard'

export function AnalyticsWidget({ role }: { role: DashboardRole }): ReactElement {
  const { data, isLoading } = useAnalyticsDashboard()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KpiCard label={t('kpi.totalDossiers')} value={data?.totalDossiers} />
      <KpiCard label={t('kpi.activeEngagements')} value={data?.activeEngagements} />
      <KpiCard label={t('kpi.upcomingDeadlines')} value={data?.upcomingDeadlines} />
      <KpiCard label={t('kpi.openWorkItems')} value={data?.openWorkItems} />
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Standalone feature pages | Feature absorption into contextual locations | Phase 13 (this phase) | Eliminates 6 standalone routes; features discoverable in context |
| Separate search page | Cmd+K universal quick switcher | Phase 13 (this phase) | Single entry point for all search/navigation |
| Full graph page at /relationships/graph | Sidebar mini-graph + expand-to-modal | Phase 13 (this phase) | Graph always visible in context |

**Deprecated/outdated:**
- `/analytics` route: Redirect to `/dashboard`
- `/briefing-books` route: Redirect to nearest engagement workspace
- `/search` route: Redirect to `/dashboard` (Cmd+K replaces)
- `/relationships/graph` route: Redirect to `/dossiers`
- `/availability-polling` route: Redirect to `/calendar`
- `/export` and `/export-import` routes: Redirect to `/dossiers`

## Existing Components Inventory

### Standalone Pages to Absorb (with route files)
| Page | Route File | Absorption Target | Redirect To |
|------|-----------|-------------------|-------------|
| AnalyticsDashboardPage | `_protected/analytics.tsx` | Dashboard widgets + dossier cards | `/dashboard` |
| BriefingBooksPage | `_protected/briefing-books.tsx` | DocsTab (already has Generate action) | `/dashboard` |
| DossierSearchPage | `_protected/search.tsx` | Cmd+K quick switcher | `/dashboard` |
| RelationshipGraphPage | `_protected/relationships/graph.tsx` | RelationshipSidebar modal | `/dossiers` |
| AvailabilityPollingPage | `_protected/availability-polling.tsx` | CalendarTab schedule action | `/calendar` |
| ExportDialog | `_protected/export.tsx` | List view action buttons | `/dossiers` |
| ExportImportPage | `_protected/export-import.tsx` (dev-gated) | List view action buttons | `/dossiers` |

### Sidebar Navigation Items to Remove
From `navigation-config.ts` `createNavigationGroups`:
- `briefing-books` (id, path: `/briefing-books`)
- `analytics` (id, path: `/analytics`, secondary: true)
- `advanced-search` (id, path: `/search`, secondary: true)
- `availability-polling` (id, path: `/availability-polling`, secondary: true)

### CommandPalette Quick Actions to Update
From `CommandPalette.tsx` `quickActions`:
- `nav-analytics`: Change path from `/analytics` to open dashboard analytics zone
- `nav-relationships`: Change from navigating to `/relationships` to opening graph modal
- `nav-briefing-books`: Change path from `/briefing-books` to engagement context action
- Remove or update: `nav-intelligence`, `nav-reports`, `nav-sla` if routes don't exist

### Reusable Assets Already Available
| Component | Location | Reuse Strategy |
|-----------|----------|---------------|
| CommandPalette + cmdk | `keyboard-shortcuts/CommandPalette.tsx` | Extend with D-02/D-03 empty state and grouped entity results |
| MiniRelationshipGraph | `Dossier/MiniRelationshipGraph.tsx` | Embed in RelationshipSidebar above tier groups |
| RelationshipSidebar | `Dossier/RelationshipSidebar.tsx` | Add graph section + expand button |
| DocsTab | `workspace/DocsTab.tsx` | Already has Generate Briefing -- minimal changes needed |
| CalendarTab | `workspace/CalendarTab.tsx` | Add Schedule action button for polling |
| ExportDialog | `export/ExportDialog.tsx` | Embed as action button in list views |
| OperationsHub | `Dashboard/OperationsHub.tsx` | Add analytics widget zone |
| overview-cards/* | `dossiers/overview-cards/` | Pattern to follow for new analytics cards |
| useQuickSwitcherSearch | `domains/dossiers/` | Already provides dossier + work item search |
| useAnalyticsDashboard | `domains/analytics/hooks/` | Data source for analytics widgets |
| useGenerateEngagementBrief | `domains/engagements/hooks/` | Already wired in DocsTab |
| BriefingPackGenerator | `positions/BriefingPackGenerator.tsx` | Can expose via Cmd+K command |

## Open Questions

1. **Geographic Visualization Page**
   - What we know: `geographic-visualization.tsx` route and `GeographicVisualizationPage.tsx` exist as standalone pages
   - What's unclear: Whether this page should also be absorbed in Phase 13 (not listed in ABSORB requirements)
   - Recommendation: Leave as-is unless explicitly requested; it's not in ABSORB-01 through ABSORB-06

2. **Briefing Books redirect target**
   - What we know: D-09 says old routes redirect to new contextual locations; D-12 says briefings go to DocsTab
   - What's unclear: DocsTab requires an engagement ID in the URL (`/engagements/$engagementId/docs`); what does `/briefing-books` redirect to when there's no engagement context?
   - Recommendation: Redirect to `/dashboard` as safe fallback; add "Generate Briefing" as Cmd+K command that opens engagement picker

3. **Most-used commands tracking for D-03**
   - What we know: D-03 requires "5 most-used commands" in empty state
   - What's unclear: No existing usage tracking mechanism for commands
   - Recommendation: Use localStorage to track command usage frequency; simple counter per command ID; fallback to predetermined popular commands until enough data collected

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + @testing-library/react 16.3.2 |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `cd frontend && pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ABSORB-01 | Analytics widgets render on dashboard; dossier overview cards show metrics | unit | `cd frontend && pnpm vitest run tests/unit/components/AnalyticsWidget.test.tsx -x` | Wave 0 |
| ABSORB-02 | Briefing generation accessible from DocsTab; standalone page redirects | unit | `cd frontend && pnpm vitest run tests/unit/components/DocsTab.test.tsx -x` | Wave 0 |
| ABSORB-03 | Cmd+K shows grouped results, empty state with recents+commands, entity search | unit | `cd frontend && pnpm vitest run tests/unit/components/CommandPalette.test.tsx -x` | Wave 0 |
| ABSORB-04 | Mini-graph renders in sidebar; expand opens full modal | unit | `cd frontend && pnpm vitest run tests/unit/components/FullScreenGraphModal.test.tsx -x` | Wave 0 |
| ABSORB-05 | Schedule action available in CalendarTab | unit | `cd frontend && pnpm vitest run tests/unit/components/CalendarTab.test.tsx -x` | Wave 0 |
| ABSORB-06 | Export/import buttons on list views | unit | `cd frontend && pnpm vitest run tests/unit/components/DossierListActions.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/components/AnalyticsWidget.test.tsx` -- covers ABSORB-01 dashboard widget rendering
- [ ] `tests/unit/components/CommandPalette.test.tsx` -- covers ABSORB-03 enhanced search behavior
- [ ] `tests/unit/components/FullScreenGraphModal.test.tsx` -- covers ABSORB-04 graph modal
- [ ] Framework is already installed (Vitest 4.1.2)

## Project Constraints (from CLAUDE.md)

- **RTL-First:** All new components must use logical CSS properties (ms-*, me-*, ps-*, pe-*, text-start, text-end). No physical left/right properties.
- **Mobile-First:** Start with mobile layout (320px+), scale up via breakpoints. Minimum 44x44px touch targets.
- **HeroUI v3 Priority:** Check HeroUI v3 first for any needed UI components, then Aceternity, Kibo-UI, shadcn/ui.
- **No explicit `any`:** TypeScript strict mode; `@typescript-eslint/no-explicit-any: error`.
- **Explicit return types:** Required on all functions.
- **200KB bundle budget:** All absorbed components must be lazy-loaded.
- **Semicolons off:** Code style has semicolons disabled.
- **Single quotes:** Strings use single quotes.
- **Trailing commas:** All trailing commas (ES5 compatible).
- **Work management terminology:** Use unified terms (assignee, deadline, priority, status, source).
- **Dossier-centric:** Everything connects to dossiers; use `work_item_dossiers` junction table.

## Sources

### Primary (HIGH confidence)
- Codebase exploration: CommandPalette.tsx (400+ lines), RelationshipSidebar.tsx (517 lines), MiniRelationshipGraph.tsx (730+ lines), DocsTab.tsx (270 lines), CalendarTab.tsx, OperationsHub.tsx, route files, navigation-config.ts, analytics.repository.ts
- Package versions verified via `npm view`: cmdk@1.1.1, @xyflow/react@12.10.2, recharts@3.8.1, vitest@4.1.2

### Secondary (MEDIUM confidence)
- [cmdk documentation](https://cmdk.paco.me/) - Command.Group API, filtering, keyboard navigation
- Phase 10/11/12 CONTEXT.md files - prior architecture decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages already installed and verified
- Architecture: HIGH - all absorption targets exist and patterns are established from Phases 10-12
- Pitfalls: HIGH - identified from actual codebase analysis (dual hook imports, route tree regeneration, ReactFlow sizing)

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- no external dependencies changing)
