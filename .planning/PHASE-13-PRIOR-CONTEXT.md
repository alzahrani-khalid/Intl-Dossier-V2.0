# Phase 13 Planning: Prior Context Extraction
Generated: 2026-04-02

## 1. PROJECT.MD - VISION & PRINCIPLES

### Core Value
Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

### Non-Negotiables (Constraints)
- Tech stack: React 19, Express, Supabase, TanStack, HeroUI v3, Tailwind v4 — no migrations
- Bilingual: Arabic (RTL) and English (LTR) must work correctly after every change
- Database: Supabase managed PostgreSQL with migrations
- Deployment: DigitalOcean Docker Compose
- Quality gates: All v2.0 gates must stay green (ESLint, Prettier, Knip, size-limit, pre-commit hooks)

### Current Milestone: v3.0 Connected Workflow
Goal: Transform disconnected pages into hub-and-spoke architecture reflecting how diplomatic staff work.

Target features (active):
- Navigation & Route Consolidation (hub-based sidebar, eliminate duplicates, remove demos)
- Operations Hub (dashboard redesign with attention zones, role-adaptive filters)
- Engagement Workspace (lifecycle bar, tabbed workspace, scoped kanban/calendar)
- Dossier Hub enriched detail pages (tier-specific views, RelationshipSidebar)
- **Feature Absorption** (analytics, AI, network graph absorbed into contextual locations) ← PHASE 13
- Lifecycle Engine (DB lifecycle_stage, stage transitions, forum sessions)

### Key Decisions from Prior Phases
- Full stack scope: Backend and frontend both need quality pass
- Quality before features: Fragile foundation makes new features risky
- Supabase-first auth with RBAC
- Domain repository pattern (13 domains, zero raw fetch in hooks)
- useDirection() for RTL/LTR (no prop drilling)
- size-limit as hard CI gate (200KB bundle budget)
- ESLint strict rules deferred (4500+ violations too large)
- rtl-friendly at warn level (Error-level no-restricted-syntax covers it)

---

## 2. REQUIREMENTS.MD - PHASE 13 FOCUS (ABSORB-01 through ABSORB-06)

### Feature Absorption Requirements (Phase 13)
All currently marked "Pending" — these are your Phase 13 scope:

| Req ID | Requirement | Details |
|--------|-------------|---------|
| ABSORB-01 | Analytics Absorption | Analytics content absorbed into dashboard widgets and dossier overview cards — **standalone analytics page removed** |
| ABSORB-02 | AI Briefings Absorption | AI Briefings absorbed into workspace Docs tab "Generate" action — **standalone briefing pages removed** |
| ABSORB-03 | Search Enhancement | Search enhanced into Cmd+K quick switcher with entity search, recent items, and command palette — **advanced search page removed** |
| ABSORB-04 | Network Graph Absorption | Network graph absorbed into RelationshipSidebar expandable visualization view — **standalone network pages removed** |
| ABSORB-05 | Availability Polling Absorption | Availability polling absorbed into Calendar tab "Schedule" action — **standalone polling page removed** |
| ABSORB-06 | Export/Import Absorption | Export/Import absorbed into action buttons on list views — **standalone export page removed** |

### Related Active Requirements (prerequisites already built)
- NAV-01 through NAV-06: Hub-based sidebar, route cleanup, Cmd+K (Phase 8 ✓)
- LIFE-01 through LIFE-06: Lifecycle engine (Phase 9 ✓)
- OPS-01 through OPS-07: Operations Hub dashboard (Phase 10 ✓)
- WORK-01 through WORK-10: Engagement Workspace (Phase 11, some pending)
- DOSS-01 through DOSS-10: Enriched dossier pages (Phase 12 ✓)

**Important:** Phase 13 is reorganization and enrichment, not new capabilities. Absorption moves existing features to contextual locations.

---

## 3. KEY DECISIONS FROM PHASES 8-12

### Phase 8: Navigation & Route Consolidation
**Decisions affecting Phase 13:**
- Import.meta.env.DEV as fallback in devModeGuard — demos never blocked during local dev
- Only converted simple leaf entity routes to redirects; left engagements/persons untouched
- Mapped useWorkQueueCounts intake/waiting to tasks/approvals until hook extended
- Kept backward-compat createNavigationSections wrapper for transition safety
- Separated page-level recents (useRecentNavigation) from entity-level recents (useQuickSwitcherSearch)

**Deferred idea flagged for Phase 13:**
- "Start absorbing standalone pages earlier" — User expressed interest in moving analytics/briefs/network-graph into contextual locations. This is now Phase 13 scope.

### Phase 9: Lifecycle Engine
**Decisions affecting Phase 13:**
- Forum sessions queried via parent_forum_id filter on existing list endpoint
- Intake promotion records initial lifecycle transition with null from_stage
- Used TicketDetailResponse as promotion dialog prop type
- Used EngagementListResponse.data for forum sessions
- SECURITY DEFINER on all RPC functions for consistent access control

### Phase 10: Operations Hub
**Decisions affecting Phase 13:**
- Attention zone detects stalled engagements via LATERAL join on lifecycle_transitions
- Query key factory centralized in useAttentionItems.ts, shared across all hooks
- Officer 2-column pairing only for Timeline+Engagements; Leadership/Analyst use full-width
- ZoneCollapsible pass-through on desktop (no wrapper div) to avoid DOM nesting
- Attention zone realtime uses 1s debounce on tasks+lifecycle_transitions tables
- Legacy project-management route redirects to /dashboard (not deleted)

**Dashboard transition:** Operations Hub completely replaces current dossier-centric dashboard at /dashboard. Existing dashboard components (DossierQuickStatsCard, ChartDossierDistribution, ChartWorkItemTrends, RecentDossiersTable) are deleted — Git history preserves. Phase 12 built dossier-specific stats fresh (relevant to ABSORB-01).

### Phase 11: Engagement Workspace
**Decisions affecting Phase 13:**
- LifecycleStepperBar transitions array passed empty in WorkspaceShell — wired in Plan 02
- Completed stages use Popover (not Tooltip) for rich transition summaries with revert action
- OverviewTab uses useEngagementKanban stats.progressPercentage for task progress
- ContextTab extracts linked dossiers from profile host_country, host_organization, participant dossier_info
- Dossier tier classification: Anchors, Activities, Threads, Contacts
- Used Kibo-UI KanbanProvider for TasksTab
- Extracted brief card pattern from EngagementBriefsSection for DocsTab inline use (relevant to ABSORB-02)
- CalendarTab uses engagement own dates since Events API lacks engagement_id filter

### Phase 12: Enriched Dossier Pages
**Decisions affecting Phase 13:**
- Used AdaptiveDialog (not AlertDialog) and BottomSheet (not Sheet) for RelationshipSidebar
- Relationship tier classification: Strategic (bilateral/partnership/cooperation), Operational (member/participant/host), Informational (related/discusses/affiliate)
- Elected officials query persons table with person_subtype=elected_official — no separate table
- Overview tabs use useDossier hook (TanStack Query deduplicates with DossierShell fetch)
- Integrated overview tabs into existing detail components instead of separate route files
- Country default tab changed from intelligence to overview for enriched first impression
- Route files simplified to pass dossierId prop instead of full dossier object

**Dossier Shell Architecture:** Shared shell across all dossier types with header bar, tab bar, collapsible RelationshipSidebar. Mobile: sidebar hidden, replaced by sheet/drawer pattern.

---

## 4. STATE.MD - CURRENT POSITION & FLAGS

### Current Status
- Phase: 12 (enriched-dossier-pages) — EXECUTING
- Status: Phase complete — ready for verification
- Last activity: 2026-03-31
- Milestone: v3.0 Connected Workflow

### Performance Metrics (recent phases)
| Phase | Plans | Avg Duration |
|-------|-------|--------------|
| Phase 12 P01 | 11min | 3 tasks |
| Phase 12 P02 | 15min | 2 tasks |
| Phase 12 P03 | 9min | 2 tasks |
| Phase 12 P04 | 9min | 2 tasks |
| Phase 12 P05 | 8min | 1 task |

### Accumulated Decisions (all phases)
All tracked in STATE.md lines 74-113. Includes routing structure, RTL handling, modal patterns, component choices, query key factories.

---

## 5. DEFERRED IDEAS FOR PHASE 13

### From Phase 8 Deferred
- "Start absorbing standalone pages earlier" — User interest in moving analytics/briefs/network-graph into contextual locations. **This is now Phase 13 scope.**

### From Phase 10 Deferred
- **Process analytics widgets** — Avg time per lifecycle stage, bottleneck detection, throughput metrics. Mentioned for future phase (could enhance ABSORB-01).
- **"Show team" toggle** — Deferred to future phase (for filtering dashboards by team)
- **Configurable thresholds** — Hardcoded default for attention zones. Configurable threshold deferred.
- **Stage-specific thresholds** — Uniform across stages. Stage-specific thresholds deferred.

### From Phase 12 Deferred
- None — discussion stayed within phase scope

---

## 6. USER PREFERENCES & "I WANT IT LIKE X" MOMENTS

### From prior phases:
- User expressed interest in moving analytics/briefs/network-graph into contextual locations (Phase 8, escalated to Phase 13)
- Default tab for countries changed to overview (not intelligence) for enriched first impression — user preference for discovery over analytics
- RelationshipSidebar on mobile as sheet/drawer (user experience preference over sidebar)
- Lifecycle bar progression left-to-right across all languages (LtrIsolate wrapper decision)

---

## 7. BUNDLE BUDGET & PERFORMANCE CONSTRAINTS

- **200KB budget:** All new workspace tabs and dashboard zones must be lazy-loaded
- Pre-commit hooks enforce: lint + format + build + dead-code detection
- Knip enforces no unused imports/exports
- ESLint strict rules deferred (4500+ violations) — but "no physical CSS properties" enforced
- rtl-friendly at warn level

**Implication for Phase 13:** Feature absorption must lazy-load analytics, AI briefing, network graph components to stay within bundle budget.

---

## 8. COMPONENT REUSE PATTERNS FROM PHASES 8-12

### From Phase 8 (Navigation)
- `createNavigationSections` wrapper (backward-compat, can be refactored)
- `useRecentNavigation` hook
- `useQuickSwitcherSearch` hook
- Modal dialogs for Cmd+K switcher

### From Phase 9 (Lifecycle)
- `LifecycleStepperBar` component
- Intake promotion dialog pattern (AdaptiveDialog)
- Query key factories for lifecycle data

### From Phase 10 (Operations Hub)
- `ZoneCollapsible` component (pass-through on desktop, wrapper on mobile)
- `useAttentionItems` hook with centralized query key factory
- Role-adaptive component rendering patterns
- Realtime subscription with 1s debounce

### From Phase 11 (Engagement Workspace)
- `WorkspaceShell` component (persistent tab nav)
- Brief card pattern from `EngagementBriefsSection`
- Kibo-UI `KanbanProvider` for tasks
- Tab content components (OverviewTab, ContextTab, DocsTab, CalendarTab, AuditTab)

### From Phase 12 (Dossier Pages)
- `DossierShell` component (shared across all 8 dossier types)
- `RelationshipSidebar` component (collapsible, expandable)
- Dossier-specific enrichment components (for Country, Organization, Topic, etc.)
- `useDossier` hook (deduplicated query)

---

## 9. KEY ARCHITECTURAL PATTERNS TO LEVERAGE

### Domain Repository Pattern
- 13 domains with centralized API logic
- Zero raw fetch in React hooks
- Apply this to absorption features

### Query Key Factory Pattern
- Centralized in hooks (e.g., useAttentionItems.ts)
- Reuse for analytics, briefing, network queries
- Enables shared cache invalidation

### Component Composition Patterns
- Tabs drive nested routes (deep-linking enabled)
- Lazy-loaded tab content via React.lazy()
- Mobile adaptation via useResponsive hook

### RTL/LTR Considerations
- useDirection() hook for all directional state
- LtrIsolate wrapper for left-to-right indicators (lifecycle bar)
- Zero physical CSS properties (logical properties only)
- Bilingual testing required for every change

---

## 10. CRITICAL PATHS FOR PHASE 13

### ABSORB-01: Analytics
- Remove: `/analytics`, `/dossier/:id/analytics` routes
- Add: Dashboard analytics widgets (lazy-loaded)
- Add: Dossier overview cards (stats extracted from phase 12 built components)

### ABSORB-02: AI Briefings
- Remove: `/briefings`, `/briefing/new` routes
- Add: DocsTab "Generate Briefing" action (reuse brief card pattern from Phase 11)
- Lazy-load: AI briefing generation modal

### ABSORB-03: Search Enhancement
- Extend: Cmd+K quick switcher (from Phase 8)
- Remove: `/search`, advanced search page
- Add: Entity search, command palette to Cmd+K

### ABSORB-04: Network Graph
- Remove: `/network`, `/dossier/:id/network` routes
- Add: RelationshipSidebar expandable visualization (reuse from Phase 12)
- Lazy-load: Network rendering library

### ABSORB-05: Availability Polling
- Remove: `/polling`, `/engagement/:id/polling` routes
- Add: CalendarTab "Schedule" action for polling UI
- Lazy-load: Polling modal

### ABSORB-06: Export/Import
- Remove: `/export`, `/import` routes
- Add: Action buttons on list views (dossier lists, work items, etc.)
- Lazy-load: Export/import modals

---

## References

- `.planning/PROJECT.md` — Updated 2026-03-29
- `.planning/REQUIREMENTS.md` — Updated 2026-03-28
- `.planning/STATE.md` — Updated 2026-03-31
- `.planning/phases/08-12/*/CONTEXT.md` — Phase-specific decisions
- `.planning/phases/08-12/*/DISCUSSION-LOG.md` — Deferred ideas and rationales

