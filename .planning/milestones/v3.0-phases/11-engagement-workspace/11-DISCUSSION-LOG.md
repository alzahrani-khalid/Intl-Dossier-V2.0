# Phase 11: Engagement Workspace - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 11-engagement-workspace
**Areas discussed:** Tab content & composition, LifecycleBar design, Route consolidation, Mobile workspace

---

## Tab Content & Composition

### Overview Tab

| Option                         | Description                                                                       | Selected |
| ------------------------------ | --------------------------------------------------------------------------------- | -------- |
| Summary dashboard              | Key metrics at top, participants list, recent activity feed, quick-action buttons | ✓        |
| Current detail page (migrated) | Move existing EngagementDossierDetail as-is into Overview tab                     |          |
| Briefing-first view            | Lead with latest AI briefing summary, followed by key facts                       |          |

**User's choice:** Summary dashboard
**Notes:** Purpose-built landing view, not a migration of the existing detail page

### Context Tab

| Option                      | Description                                                                       | Selected |
| --------------------------- | --------------------------------------------------------------------------------- | -------- |
| Positions + Recommendations | Linked dossiers, positions, AI recommendations, talking points — the "prep sheet" | ✓        |
| Agenda + Objectives only    | Simpler: engagement objectives, agenda items, linked dossier badges               |          |
| You decide                  | Claude has discretion                                                             |          |

**User's choice:** Positions + Recommendations
**Notes:** Intelligence layer for the engagement, reuses useEngagementRecommendations hook

### Tasks Tab

| Option                 | Description                                                         | Selected |
| ---------------------- | ------------------------------------------------------------------- | -------- |
| Kanban board           | Full Kanban as default view, reusing useEngagementKanban hook       | ✓        |
| List view with filters | Table/list with status badges, assignee, deadline, priority filters |          |
| Toggle between both    | Default Kanban with toggle to list view                             |          |

**User's choice:** Kanban board
**Notes:** Replaces the current dialog-based EngagementKanbanDialog with embedded workspace tab

### Calendar, Docs, Audit Tabs

| Option              | Description                            | Selected |
| ------------------- | -------------------------------------- | -------- |
| Claude decides      | Standard patterns using existing hooks | ✓        |
| Let me specify each | User describes each tab specifically   |          |

**User's choice:** Claude decides
**Notes:** Calendar: dates + events. Docs: briefs + files. Audit: lifecycle history + activity log.

---

## LifecycleBar Design

### Stage Summary Display

| Option           | Description                                                    | Selected |
| ---------------- | -------------------------------------------------------------- | -------- |
| Popover          | Click completed stage → popover with who, when, note, duration | ✓        |
| Slide-out panel  | Right panel slides in with full transition history             |          |
| Inline expansion | Stage row expands downward below the bar                       |          |

**User's choice:** Popover
**Notes:** Lightweight, doesn't leave the page

### Stage Transition UX

| Option                        | Description                                                          | Selected |
| ----------------------------- | -------------------------------------------------------------------- | -------- |
| Click any stage to transition | Click any future/past stage → confirmation dialog with optional note | ✓        |
| Next/Previous buttons only    | Separate Advance/Revert buttons in header                            |          |
| Dropdown on current stage     | Click current stage → dropdown of all other stages                   |          |

**User's choice:** Click any stage to transition
**Notes:** System suggests next stage but never blocks. Skipping stages shows "(skipping X)" in confirmation.

---

## Route Consolidation

### Canonical URL Pattern

| Option                        | Description                                              | Selected |
| ----------------------------- | -------------------------------------------------------- | -------- |
| /engagements/$id/...          | Standalone path as workspace root, tabs as nested routes | ✓        |
| /dossiers/engagements/$id/... | Dossier-scoped URLs, consistent with other types         |          |
| Both as aliases               | Both paths render same workspace, no redirects           |          |

**User's choice:** /engagements/$id/...
**Notes:** /dossiers/engagements/$id redirects to /engagements/$id

### Shell Design

| Option                     | Description                                                       | Selected |
| -------------------------- | ----------------------------------------------------------------- | -------- |
| New WorkspaceShell         | Engagement-specific shell with header + lifecycle + tabs + Outlet | ✓        |
| Extend DossierDetailLayout | Add tab bar and lifecycle bar to existing layout                  |          |

**User's choice:** New WorkspaceShell
**Notes:** DossierDetailLayout stays untouched for other dossier types. Phase 12 will unify.

---

## Mobile Workspace

### Mobile Tab Strategy

| Option                 | Description                                                 | Selected |
| ---------------------- | ----------------------------------------------------------- | -------- |
| Horizontal scroll tabs | All 6 tabs in scrollable row, active auto-scrolls into view | ✓        |
| Dropdown selector      | Current tab shown as dropdown button                        |          |
| Bottom sheet with tabs | Tabs in a bottom sheet on tab icon tap                      |          |

**User's choice:** Horizontal scroll tabs
**Notes:** Follows Jira/Linear mobile pattern

### Mobile LifecycleBar

| Option                      | Description                                                 | Selected |
| --------------------------- | ----------------------------------------------------------- | -------- |
| Compact chips               | Abbreviated labels (Int, Prep, Brf, etc.) in scrollable row | ✓        |
| Current stage only + expand | Show only current stage pill, tap to expand                 |          |
| Stepper dots                | Numbered circles replacing labels                           |          |

**User's choice:** Compact chips
**Notes:** Active stage shows full label on mobile, others abbreviated. Desktop shows full labels for all.

---

## Claude's Discretion

- Calendar tab content and layout
- Docs tab content and layout
- Audit tab content and layout
- Loading skeletons per tab
- Empty states per tab

## Deferred Ideas

None — discussion stayed within phase scope
