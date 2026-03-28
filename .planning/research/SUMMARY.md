# Project Research Summary

**Project:** Intl-Dossier v3.0 — "Connected Workflow" Hub-and-Spoke Architecture
**Domain:** Diplomatic dossier management / enterprise CRM-style workflow redesign
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

This milestone transforms Intl-Dossier from a collection of standalone feature pages into a cohesive hub-and-spoke system. The three architectural centers are: an Operations Hub (role-adaptive home screen surfacing what needs attention now), Engagement Workspaces (tabbed, lifecycle-aware detail pages replacing dialog-based navigation), and Enriched Dossier Detail Pages (consistent shell across all 8 entity types with a collapsible RelationshipSidebar). The approach is conservative on new dependencies — only one new package is required (`react-resizable-panels`, ~5KB) because the existing stack already covers every need. The recommended build order pulls the Lifecycle Engine DB migration forward (before the Operations Hub and Workspace phases) since both depend on the `lifecycle_stage` column, contradicting the original spec's sequencing which placed Lifecycle Engine last.

The feature set is deliberately restrained. Research across CRM and enterprise UX patterns confirms that 14 table-stakes features (grouped kanban, tabbed workspaces, scoped calendar/docs/audit, Cmd+K, hub navigation, audit tab) account for ~65% of milestone effort, while 4–5 differentiators (lifecycle-stage-grouped kanban columns, role-adaptive dashboard defaults, "What's Next" action card, tier-specific dossier enrichments) provide genuine domain value without requiring new infrastructure. Eight explicit anti-features are documented — most critically: no drag-to-rearrange dashboard, no real-time notification system, no rigid lifecycle stage-gating, and no AI suggestions beyond existing briefing generation.

The primary risks are infrastructure, not product: the existing codebase has 129 route files with duplicates and three competing navigation implementations that must be cleaned up before any new features land. The 200KB initial JS bundle is already at its limit, meaning every new workspace tab must use route-based code splitting. Lifecycle transitions must be server-side atomic operations with audit logging — client-only state will create ghost states across multi-user sessions.

---

## Key Findings

### Recommended Stack

The stack requires no significant additions. All major UI primitives (TanStack Router v5, HeroUI v3 Tabs, @dnd-kit, cmdk, motion, recharts, Zustand, react-hook-form+zod) are installed. The single new dependency is `react-resizable-panels` for the RelationshipSidebar — the only component requiring simultaneous resize, collapse-to-zero, and keyboard accessibility. XState was explicitly rejected (6 linear lifecycle stages do not warrant a statechart library, saving ~15KB). react-grid-layout was rejected (Operations Hub zones are fixed, not user-rearrangeable, saving ~25KB).

**Core technologies:**

- `react-resizable-panels` v4.7.6: RelationshipSidebar — only library providing resize + collapse + min/max + a11y simultaneously (~5KB gzipped)
- HeroUI v3 Tabs (installed): WorkspaceShell tab bar — React Aria accessible, compound components, RTL-aware
- Zustand v5 (installed): lifecycle stage client state — sufficient for 6 linear stages, avoids XState overhead
- TanStack Router v5 nested routes (installed): workspace tab routing — `$id.tsx` layout route + `$id/` child routes for code splitting
- `@radix-ui/react-progress` (installed): LifecycleBar base primitive — accessible progress semantics
- Tailwind CSS v4 grid (installed): Operations Hub 3-zone layout — zero JS overhead, no react-grid-layout needed

### Expected Features

**Must have (table stakes) — ~65% of milestone effort:**

- Operations Hub: Attention Needed zone (overdue/due-within-48h items) — every CRM surfaces this front-and-center
- Operations Hub: Upcoming Timeline (next 7 days calendar events) — temporal orientation is standard
- Operations Hub: Active Engagements by lifecycle stage — pipeline stage grouping is the defining CRM pattern
- Engagement Workspace: Lifecycle Bar (6-stage horizontal stepper, clickable, non-gating)
- Engagement Workspace: Tabbed shell (Overview, Context, Tasks, Calendar, Docs, Audit) with URL-driven tab state
- Engagement Workspace: Scoped Kanban, Calendar, Documents, Audit (filter existing components by engagement)
- Enriched Dossier Detail Pages: Shared DossierDetailShell + RelationshipSidebar across all 8 types
- Quick Switcher (Cmd+K): search dossiers, engagements, work items, recent pages
- Hub-based sidebar navigation: 3 sections (Operations, Dossiers, Admin) replacing 7 flat sections

**Should have (differentiators) — ~25% of milestone effort:**

- Lifecycle-stage-grouped Kanban columns (diplomatic workflow innovation — no off-the-shelf tool does this)
- Role-adaptive dashboard defaults (Leadership/Officer/Analyst filter presets, not hard-gated)
- "What's Next" action card on workspace Overview (highest-priority pending task in current stage, simple heuristic not AI)
- Tier-specific dossier enrichments: Anchors first (Countries get bilateral summaries, Organizations get MoU trackers)
- Intake-to-Engagement promotion flow (pre-populated fields, lifecycle starting at 'intake')

**Defer (post-v3.0 launch):**

- Forum recurring sessions as mini-workspaces (highest complexity, most niche use case)
- Network graph embedded in RelationshipSidebar (existing full-page graph works; relocate after sidebar ships)
- Calendar conflict detection across engagements (convenience feature, add after scoped calendar is working)
- Tier-specific enrichments for Thread + Contact tiers (do Anchors first, extend pattern to others)
- Availability polling absorption (lowest priority absorbed feature)

### Architecture Approach

The architecture reuses the existing TanStack Router layout route pattern (already proven by `_protected.tsx`) to build WorkspaceShell: `$id.tsx` becomes the layout route rendering the persistent shell (header, lifecycle bar, tabs), while `$id/index.tsx`, `$id/tasks.tsx`, `$id/calendar.tsx`, etc. render in `<Outlet />` as independently code-split chunks. Non-workspace dossier types (Countries, Organizations, Topics, etc.) use client-side tab state within the existing `DossierDetailLayout` — not nested routes — to avoid 8 types x 6 tabs = 48 unnecessary route files. Lifecycle state lives exclusively in the database with a dedicated `PATCH /api/engagements/:id/transition` endpoint for atomic transitions with audit logging.

**Major components:**

1. `WorkspaceShell` + `LifecycleBar` + `WorkspaceTabs` — engagement/forum layout, route-driven tabs, persistent across navigation
2. `DossierDetailLayout` (extended) + `RelationshipSidebar` — shared shell for all 8 dossier types with sidebar slot using `react-resizable-panels`
3. `DashboardPage` (redesigned) — 3-zone Tailwind grid: Action Bar (full-width), Left Column (Attention + Engagements by stage), Right Column (Timeline + Recent Activity)
4. `navigation-config.ts` (rewritten) — 3 hub sections replacing 7 flat sections; AppSidebar.tsx needs minimal changes
5. Lifecycle Engine — `engagement_lifecycle_stage` enum in DB, `useLifecycleTransition` hook, server-side transition endpoint with audit entries
6. `elected-officials` domain — new domain following existing 20-domain pattern (types, repository, hooks, barrel)

### Critical Pitfalls

1. **Route tree breaks on file moves** — TanStack Router auto-generates `routeTree.gen.ts` with hardcoded path strings. Moving files without running `pnpm tsr generate` causes silent 404s across 129 routes. Prevention: batch moves by tier, run generator after each batch, keep old routes as redirect stubs for one release cycle, audit all hardcoded route strings before deletion.

2. **Dual navigation system collision** — Three competing nav implementations exist (`Sidebar.tsx`, `AppSidebar.tsx`, `NavigationShell.tsx`). Adding a new hub sidebar without removing old ones causes double-render, broken active states, and ~30–50KB bundle bloat. Prevention: delete demo nav routes first, confirm AppSidebar.tsx is sole implementation, use Knip to catch dead imports.

3. **Workspace tabs render all content eagerly** — Mounting all 6 tabs (including the 80KB Kanban chunk) on workspace load blows the 200KB initial JS budget. Prevention: route-based code splitting per tab via TanStack Router file-based routes; consider React 19.2 `<Activity>` component for hide/show without unmount.

4. **Lifecycle ghost states from client-only transitions** — Optimistic stage transitions without server-side atomic writes cause state divergence between users and a missing audit trail. Prevention: dedicated `PATCH /api/engagements/:id/transition` endpoint with allowed-transitions validation and single-transaction audit log write; use `useMutation` with `onError` rollback, no optimistic updates for stage transitions.

5. **Feature absorption silently breaks absorbed components** — Standalone pages rely on route search params, full-page error boundaries, and standalone query keys that break when embedded in tabs/widgets. Prevention: create dedicated "embedded" variants (e.g., `AnalyticsWidget` vs `AnalyticsPage`), wrap each in its own `ErrorBoundary`, convert `useSearch()` dependencies to props, keep standalone pages until embedded variants are verified.

---

## Implications for Roadmap

Based on combined research, a 6-phase structure is recommended. The spec's original ordering placed Lifecycle Engine last — this is incorrect given the dependency chain and must be corrected.

### Phase 1: Navigation and Route Consolidation

**Rationale:** Pure cleanup with no new features. Must be done first because duplicate routes, three competing navigation implementations, and 10+ demo pages actively impede all subsequent phases. Adding workspace routes on top of existing chaos guarantees pitfalls 1 and 2.
**Delivers:** Clean route tree, single navigation implementation, hub-based sidebar (3 sections), working redirects from old paths, demo pages gated behind VITE_DEV_MODE, working_groups renamed to working-groups.
**Addresses:** Sidebar hub grouping (table stakes feature), route naming consistency.
**Avoids:** Pitfall 1 (route tree breaks), Pitfall 2 (dual nav collision), Pitfall 6 (RTL sidebar direction — audit physical CSS properties now).

### Phase 2: Lifecycle Engine

**Rationale:** A schema-only phase (~1–2 days) that unblocks both Operations Hub and Engagement Workspace. Both depend on `lifecycle_stage` on engagements and work_items. Doing this first keeps subsequent phases unblocked. Small scope reduces risk.
**Delivers:** `engagement_lifecycle_stage` enum in DB (Supabase migration via MCP), `lifecycle_stage` columns on engagements + work_items, `LifecycleStage` TypeScript types, `useLifecycleTransition` hook, `transitionLifecycleStage` repository function, dedicated transition API endpoint with audit logging.
**Uses:** Supabase MCP for migrations, Zustand for client stage state, existing audit log system.
**Avoids:** Pitfall 4 (ghost states — server-side atomic transitions designed in from the start).

### Phase 3: Operations Hub

**Rationale:** Delivers the new "home screen" that justifies the entire redesign. Requires lifecycle_stage (Phase 2) for engagement grouping. Three new hooks needed (useAttentionItems, useDashboardStats, useEngagementsByStage). Role-adaptive defaults ship with this phase.
**Delivers:** Redesigned DashboardPage with 3-zone Tailwind grid, Attention Needed zone, Upcoming Timeline, Active Engagements by stage, Quick Stats, role-adaptive filter defaults.
**Implements:** AttentionCard component, EngagementsByStage grouped list, role-to-filter-preset mapping.
**Avoids:** Pitfall 8 (monolithic dashboard chunk — zone-based lazy loading, share existing charts-vendor chunk).

### Phase 4: Engagement Workspace

**Rationale:** The heart of the redesign. Requires route consolidation (Phase 1) for clean nested route structure, and lifecycle_stage (Phase 2) for LifecycleBar. WorkspaceShell pattern established here is reused for Forums and enriched dossier pages.
**Delivers:** WorkspaceShell, LifecycleBar, WorkspaceTabs components; $id.tsx converted to layout route; $id/ child routes (index, context, tasks, calendar, docs, audit); scoped Kanban, Calendar, Documents, Audit views; "What's Next" action card; react-resizable-panels installed.
**Uses:** TanStack Router nested routes, HeroUI v3 Tabs, motion for transitions, react-resizable-panels.
**Avoids:** Pitfall 3 (eager tab rendering — route-split per tab), Pitfall 7 (LifecycleBar RTL — use LtrIsolate), Pitfall 9 (scoped vs global divergence — scope prop on existing components), Pitfall 10 (mobile tab bar conflict — scrollable pill bar on mobile).

### Phase 5: Enriched Dossier Detail Pages

**Rationale:** Reuses patterns from Phases 1–4. RelationshipSidebar uses react-resizable-panels installed in Phase 4. DossierDetailShell generalizes WorkspaceShell patterns. Elected Officials domain completes 8-type coverage.
**Delivers:** DossierDetailLayout with sidebar slot, RelationshipSidebar (grouped by tier, collapsible), Elected Officials domain + page + route, tier-specific enrichments for Anchor types (Countries, Organizations), shared DossierDetailShell component.
**Avoids:** Pitfall 14 (N+1 relationship queries — dedicated batch endpoint `GET /api/dossiers/:id/relationships`).

### Phase 6: Feature Absorption and Quick Switcher

**Rationale:** Must come last. Absorbed features (Analytics, AI Briefings, Network Graph, Search) depend on their destination locations (dashboard widgets, workspace tabs, sidebar panels) being stable. Building destinations first then moving features into them eliminates the absorption pitfall.
**Delivers:** Analytics absorbed into dashboard widgets, AI Briefing generation moved into workspace Docs tab, Network Graph embedded as expandable RelationshipSidebar view, enhanced Cmd+K Quick Switcher (search across all 8 dossier types + work items + recent pages), removal of standalone absorbed pages.
**Avoids:** Pitfall 5 (silent feature absorption regression — embedded variants + ErrorBoundary per absorbed component), Pitfall 11 (stale Quick Switcher index — derive from route tree).

### Phase Ordering Rationale

- Phases 1 then 2 are sequential prerequisites: route consolidation reveals the full scope of what needs updating; lifecycle schema must exist before any UI that references it is built.
- Phase 2 (Lifecycle Engine) must precede Phases 3 and 4: both Operations Hub and Engagement Workspace query `lifecycle_stage`. Building the column after the UI that depends on it creates a broken intermediate state.
- Phase 4 (Workspace) before Phase 5 (Dossier Pages): WorkspaceShell patterns established in Phase 4 are directly reused in Phase 5; react-resizable-panels is installed in Phase 4 for RelationshipSidebar use in Phase 5.
- Phase 6 (Absorption) must be last: feature destinations must be stable before moving features into them.

### Research Flags

Phases likely needing extra validation during planning:

- **Phase 4 (Engagement Workspace):** RTL decision for LifecycleBar direction (LtrIsolate vs natural RTL flip) must be documented as an explicit product decision before implementation begins.
- **Phase 4 (Engagement Workspace):** React 19.2 `<Activity>` component availability — verify it is stable in this project's React version before committing to it as the tab-hide solution.
- **Phase 6 (Feature Absorption):** Each absorbed feature needs an "embedded variant audit" before absorption — identify all `useSearch()`, `useNavigate()`, and route-dependent calls in each component being absorbed.

Phases with standard, well-documented patterns (skip research-phase):

- **Phase 1 (Navigation):** File moves, redirects, and nav refactors are well-understood operations in this codebase.
- **Phase 2 (Lifecycle Engine):** Supabase enum migrations + TanStack Query mutation pattern are established and documented.
- **Phase 3 (Operations Hub):** Dashboard zone layout with Tailwind grid + recharts is the existing pattern.
- **Phase 5 (Dossier Pages):** Follows Phase 4 patterns directly. Elected Officials domain follows 20 existing domain templates exactly.

---

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                                                                                      |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | All decisions verified against installed package.json. react-resizable-panels verified on npm (v4.7.6, published 2026-03-27). XState/react-grid-layout rejection is well-reasoned with bundle savings documented.          |
| Features     | MEDIUM     | Table stakes derived from CRM industry patterns (HubSpot, Salesforce, Jira). Domain-specific features (lifecycle-stage kanban, forum sessions) are inferences about diplomatic workflow with no direct comparable product. |
| Architecture | HIGH       | Based on direct codebase analysis of existing route tree (129 files), 20 domains, 3 navigation implementations, and existing TanStack Router layout route usage in `_protected.tsx`. No speculation.                       |
| Pitfalls     | HIGH       | All 5 critical pitfalls are grounded in specific existing code artifacts: duplicate routes confirmed, three nav files confirmed, bundle budget confirmed at limit, no lifecycle endpoint confirmed in backend.             |

**Overall confidence:** HIGH

### Gaps to Address

- **Elected Officials table existence:** Verify via Supabase MCP before Phase 5 planning — if the `elected_officials` table does not exist, a migration is needed alongside the Phase 2 lifecycle migration.
- **Calendar engagement-scoped filter:** Verify `GET /api/calendar-events` supports engagement_id filtering before Phase 4 planning — if not, a backend extension is needed before the scoped calendar tab can be built.
- **LifecycleBar RTL direction policy:** An explicit product decision (LtrIsolate vs natural RTL flip) is required before Phase 4 begins. This is not technical — make the decision during planning, not during implementation.
- **Forum workspace scope:** The line between "forum workspace" (in scope for Phase 4) and "forum recurring sessions mini-workspace" (deferred) needs explicit definition before Phase 4 planning starts.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase analysis — route tree (129 files), 20 domain repositories, AppSidebar.tsx (189 lines), navigation-config.ts (301 lines), engagement domain (repository 383 lines, types 190 lines, hooks 341 lines)
- [react-resizable-panels npm](https://www.npmjs.com/package/react-resizable-panels) — v4.7.6, published 2026-03-27, maintained by bvaughn
- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/routing/file-based-routing) — layout route + Outlet pattern, routeTree.gen.ts generation
- [HubSpot Lifecycle Stages](https://knowledge.hubspot.com/object-settings/create-and-customize-lifecycle-stages) — pipeline stage patterns
- [Salesforce Lightning Page Layouts](https://trailhead.salesforce.com/content/learn/modules/lex_customization/lex_customization_page_layouts) — CRM record page patterns
- [Notification UX Guidelines — Smashing Magazine](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/) — anti-feature justification for no notification center
- [shadcn/ui Resizable](https://ui.shadcn.com/docs/components/radix/resizable) — built on react-resizable-panels, validates choice

### Secondary (MEDIUM confidence)

- [CRM UX Design Best Practices — Aufait UX](https://www.aufaitux.com/blog/crm-ux-design-best-practices/) — table stakes feature validation
- [Enterprise UX Design Guide 2026 — FuseLab](https://fuselabcreative.com/enterprise-ux-design-guide-2026-best-practices/) — workspace shell patterns
- [Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1) — Cmd+K design decisions
- [State Management in React 2026 — pkgpulse](https://www.pkgpulse.com/blog/state-of-react-state-management-2026) — Zustand vs XState analysis
- [React Bundle Size Code Splitting — dev.to](https://dev.to/gouranga-das-khulna/how-we-cut-our-react-bundle-size-by-40-with-smart-code-splitting-2chi) — dashboard zone splitting strategy
- [Tab Lazy Loading in React — learnersbucket](https://learnersbucket.com/examples/interview/tab-component-with-lazy-loading-in-react/) — render-on-first-visit pattern
- [shadcn/ui Sidebar RTL Support](https://ui.shadcn.com/docs/components/radix/sidebar) — dir prop patterns for RTL sidebars

### Tertiary (LOW confidence — validate during implementation)

- [React 19.2 Activity Component](https://react.dev/blog/2025/10/01/react-19-2) — tab hide/show without unmount; verify availability in project's React version before committing
- [Stakeholder Engagement Software — Jambo](https://www.jambo.cloud/) — comparable product reference for diplomatic workflow features

---

_Research completed: 2026-03-28_
_Ready for roadmap: yes_
