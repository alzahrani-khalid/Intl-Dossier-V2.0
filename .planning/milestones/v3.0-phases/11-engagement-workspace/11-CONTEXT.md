# Phase 11: Engagement Workspace - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the current single-page engagement detail into a persistent, tabbed engagement workspace with lifecycle awareness, scoped views, and URL-driven tabs. Users work within a WorkspaceShell that provides lifecycle stage visibility, tab-based navigation between engagement concerns, and deep-linkable URLs for each tab.

</domain>

<decisions>
## Implementation Decisions

### Tab Content & Composition

- **D-01:** Overview tab is a **summary dashboard** — key metrics at top (stage, dates, task progress), participants list, recent activity feed, and quick-action buttons (transition stage, log after-action). Not a migration of the current detail page — a purpose-built landing view.
- **D-02:** Context tab is the **intelligence/prep sheet** — linked dossier badges, country/org positions on the topic, AI-generated recommendations (reuse `useEngagementRecommendations`), and talking points.
- **D-03:** Tasks tab is a **full Kanban board** embedded in the workspace (reuse `useEngagementKanban` hook with columns + drag-and-drop). Replaces the current dialog-based `EngagementKanbanDialog` with an inline tab view.
- **D-04:** Calendar, Docs, and Audit tabs are **Claude's discretion** — Calendar: engagement dates + linked events; Docs: briefs (AI + legacy via `useEngagementBriefs`) + uploaded files; Audit: lifecycle transition history (`useLifecycleHistory`) + activity log.

### LifecycleBar Design

- **D-05:** Stage summaries shown via **popover** on click — displays who transitioned, when, transition note, time spent in stage. Lightweight overlay, doesn't leave the page.
- **D-06:** Stage transitions via **click any stage** — click any future or past stage chip opens a confirmation dialog with optional note field. System suggests next stage but never blocks. Uses `useLifecycleTransition` mutation hook.

### Route Consolidation

- **D-07:** Canonical workspace URL is **`/engagements/$id/...`** with nested tab routes: `/engagements/:id/overview`, `/engagements/:id/context`, `/engagements/:id/tasks`, `/engagements/:id/calendar`, `/engagements/:id/docs`, `/engagements/:id/audit`. Default route (`/engagements/:id/`) redirects to overview.
- **D-08:** `/dossiers/engagements/$id` **redirects** to `/engagements/$id` — the dossier route becomes a redirect, not a duplicate.
- **D-09:** Build a **new WorkspaceShell component** specifically for engagements: header with name + lifecycle bar + tab navigation + `<Outlet />` for active tab content. `DossierDetailLayout` stays untouched for other dossier types (Phase 12 will unify them).

### Mobile Workspace

- **D-10:** Workspace tabs on mobile use **horizontal scroll** — all 6 tabs in a horizontally scrollable row that sticks below the lifecycle bar. Active tab auto-scrolls into view.
- **D-11:** LifecycleBar on mobile uses **compact chips** — abbreviated labels (Int, Prep, Brf, Exec, F/U, Cls) in a scrollable row. Active stage shows full label. Desktop shows full labels for all stages.

### Claude's Discretion

- Calendar tab content and layout
- Docs tab content and layout (briefs + files)
- Audit tab content and layout (lifecycle history + activity)
- Loading skeletons per tab
- Empty states per tab

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Lifecycle Engine (Phase 9 foundations)

- `frontend/src/types/lifecycle.types.ts` — 6-stage lifecycle type definitions, bilingual labels, transition types
- `frontend/src/domains/engagements/hooks/useLifecycle.ts` — Hooks for stage transitions, history, intake promotion, forum sessions

### Engagement Domain

- `frontend/src/domains/engagements/types/index.ts` — Engagement types, kanban types, brief types
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` — Repository functions for API calls
- `frontend/src/domains/engagements/hooks/useEngagements.ts` — Core engagement CRUD hooks
- `frontend/src/domains/engagements/hooks/useEngagementKanban.ts` — Kanban board hooks (columns, drag-and-drop)
- `frontend/src/domains/engagements/hooks/useEngagementBriefs.ts` — AI + legacy brief hooks
- `frontend/src/domains/engagements/hooks/useEngagementRecommendations.ts` — AI recommendation hooks

### Current Engagement Routes (to be refactored)

- `frontend/src/routes/_protected/engagements/$engagementId.tsx` — Current standalone route with after-action child
- `frontend/src/routes/_protected/dossiers/engagements/$id.tsx` — Current dossier detail route (will become redirect)
- `frontend/src/pages/dossiers/EngagementDossierPage.tsx` — Current detail page using DossierDetailLayout

### Shared Layout (reference, not modified)

- `frontend/src/components/dossier/DossierDetailLayout.tsx` — Existing dossier layout (keep untouched for Phase 12)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `useEngagementKanban` — Full kanban with columns, stats, drag-and-drop handler. Directly reusable for Tasks tab.
- `useEngagementBriefs` — AI + legacy brief listing and generation. Reusable for Docs tab.
- `useEngagementRecommendations` — AI recommendations. Reusable for Context tab.
- `useLifecycleHistory` / `useLifecycleTransition` — Stage history and transition mutations. Reusable for LifecycleBar and Audit tab.
- `useForumSessions` — Forum session listing. Reusable for forum-type engagements.
- `EngagementKanbanDialog` — Existing dialog-based kanban (will be replaced by embedded tab, but logic/styling can be referenced).
- `tabs.tsx` — Existing Tabs UI component.
- `useDossier` hook — Fetches engagement data with stats, owners, contacts.
- `useDirection` hook — RTL/LTR detection for layout.

### Established Patterns

- **Lazy loading:** Routes use `React.lazy()` with dynamic imports (see current engagement detail route).
- **Domain structure:** `domains/{feature}/hooks/`, `domains/{feature}/repositories/`, `domains/{feature}/types/` pattern.
- **Route structure:** TanStack Router file-based routing under `_protected/`.
- **Mobile-first:** Tailwind breakpoints base → sm → md → lg with min-h-11 touch targets.
- **RTL:** `useDirection` hook + logical properties (ms-_, me-_, ps-_, pe-_).
- **i18n:** `useTranslation` with feature-specific namespaces.

### Integration Points

- **Operations Hub (Phase 10):** Dashboard links into engagement workspaces. URL change from `/dossiers/engagements/$id` to `/engagements/$id` means Operations Hub links need updating.
- **Sidebar navigation (Phase 8):** Engagements appear under Dossiers group. May need a direct workspace entry point.
- **After-action route:** Currently at `/engagements/$engagementId/after-action`. Must be preserved or integrated into workspace.

</code_context>

<specifics>
## Specific Ideas

- Overview tab layout follows the summary dashboard pattern with metric cards at top, two-column layout below (participants + activity)
- LifecycleBar uses popover-on-click for completed stages, confirmation dialog for transitions
- Mobile uses the Jira/Linear pattern of horizontally scrollable tabs
- WorkspaceShell is engagement-specific now, Phase 12 will create a shared DossierDetailShell

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 11-engagement-workspace_
_Context gathered: 2026-03-31_
