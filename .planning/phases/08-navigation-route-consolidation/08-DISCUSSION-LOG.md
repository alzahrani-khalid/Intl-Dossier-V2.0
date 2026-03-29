# Phase 8: Navigation & Route Consolidation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 08-navigation-route-consolidation
**Areas discussed:** Sidebar group mapping, Mobile bottom tab bar, Route cleanup strategy, Cmd+K quick switcher

---

## Sidebar Group Mapping

### Q1: How should the current 6 categories map into the 3 sidebar groups?

| Option                          | Description                                                                                                                                                    | Selected |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Merge by function (Recommended) | Operations = Dashboard + Tasks + Engagements + After-Actions + Calendar. Dossiers = All 8 dossier types. Administration = Admin pages + Settings + Audit Logs. | Y        |
| Keep Operations lean            | Operations = Dashboard + Tasks only. Dossiers = All 8 types + Engagements + After-Actions. Administration = Admin + Settings + Analytics + Audit.              |          |
| You decide                      | Claude picks the best grouping                                                                                                                                 |          |

**User's choice:** Merge by function
**Notes:** None

### Q2: Should sidebar groups be collapsible, and what's the default state on first visit?

| Option                        | Description                                                   | Selected |
| ----------------------------- | ------------------------------------------------------------- | -------- |
| All expanded by default       | User sees full nav tree. Can collapse. State in localStorage. |          |
| Dossiers collapsed by default | Operations/Admin expanded, Dossiers collapsed (7+ items).     |          |
| You decide                    | Claude picks based on item count per group                    | Y        |

**User's choice:** You decide
**Notes:** None

### Q3: When sidebar is in icon-rail mode (768-1023px), how should groups appear?

| Option                 | Description                                               | Selected |
| ---------------------- | --------------------------------------------------------- | -------- |
| 3 group icons + flyout | Show 3 group icons. Hover/click opens flyout panel.       |          |
| Flat icon list         | Show top-level item icons directly without group headers. |          |
| You decide             | Claude picks based on existing NavigationShell patterns   | Y        |

**User's choice:** You decide
**Notes:** None

### Q4: Where should standalone pages (Analytics, Activity, Advanced Search, Polling) live?

| Option              | Description                                                                 | Selected |
| ------------------- | --------------------------------------------------------------------------- | -------- |
| Under Operations    | All go under Operations as secondary items under 'Tools' subheading.        | Y        |
| Hide from sidebar   | Access via Cmd+K or direct URL only.                                        |          |
| Split across groups | Analytics + Activity -> Operations. Search -> Cmd+K. Polling -> Operations. |          |

**User's choice:** Under Operations
**Notes:** None

### Q5: Should the Dossiers group show engagement as a dossier type?

| Option                        | Description                                         | Selected |
| ----------------------------- | --------------------------------------------------- | -------- |
| Operations only (Recommended) | Engagements only in Operations group.               |          |
| Both groups                   | Engagements in Operations AND Dossiers. Cross-link. | Y        |
| Dossiers only                 | Move engagements entirely to Dossiers.              |          |

**User's choice:** Both groups
**Notes:** None

### Q6: Should the sidebar show badge counts?

| Option              | Description                                                           | Selected |
| ------------------- | --------------------------------------------------------------------- | -------- |
| Yes, key items only | Counts on Tasks (pending), Approvals (pending), Engagements (active). | Y        |
| No badges           | Keep sidebar clean. Counts on respective pages.                       |          |
| You decide          | Claude picks based on existing badge patterns.                        |          |

**User's choice:** Yes, key items only
**Notes:** None

### Q7: Brand/logo area at sidebar top?

| Option              | Description                                                      | Selected |
| ------------------- | ---------------------------------------------------------------- | -------- |
| Keep current design | GASTAT Dossier logo + workspace label.                           |          |
| Add user avatar     | Logo + small user avatar/name at top. User menu moves to header. | Y        |
| You decide          | Claude picks.                                                    |          |

**User's choice:** Add user avatar
**Notes:** None

### Q8: After-Actions — own sidebar item or nested under Engagements?

| Option                   | Description                                                | Selected |
| ------------------------ | ---------------------------------------------------------- | -------- |
| Own sidebar item         | Separate item under Operations, alongside Engagements.     |          |
| Nested under Engagements | Only accessible from engagement detail. Less discoverable. |          |
| You decide               | Claude picks based on workflow patterns.                   | Y        |

**User's choice:** You decide
**Notes:** None

---

## Mobile Bottom Tab Bar

### Q1: What should the 'More' tab reveal on mobile?

| Option                     | Description                                                         | Selected |
| -------------------------- | ------------------------------------------------------------------- | -------- |
| Bottom sheet with full nav | Full scrollable list grouped by Operations/Dossiers/Administration. |          |
| Simple menu list           | Flat list without group headers.                                    |          |
| You decide                 | Claude picks based on mobile UX patterns and item count.            | Y        |

**User's choice:** You decide
**Notes:** None

### Q2: How should the 'Dossiers' tab work on the bottom bar?

| Option                        | Description                                                  | Selected |
| ----------------------------- | ------------------------------------------------------------ | -------- |
| Navigate to dossiers hub page | Goes to /dossiers/ showing all 8 types as cards.             |          |
| Expand inline type picker     | Shows popover/sheet above tab bar with 8 dossier type icons. |          |
| You decide                    | Claude picks the best mobile UX pattern.                     | Y        |

**User's choice:** You decide
**Notes:** None

### Q3: Bottom tab bar active state indicator?

| Option               | Description                                                            | Selected |
| -------------------- | ---------------------------------------------------------------------- | -------- |
| Filled icon + label  | Active tab has filled icon and colored label. Standard mobile pattern. | Y        |
| Top border indicator | Colored top border line. Icons stay same style.                        |          |
| You decide           | Claude picks.                                                          |          |

**User's choice:** Filled icon + label
**Notes:** None

### Q4: Should the bottom tab bar hide on scroll?

| Option                   | Description                                    | Selected |
| ------------------------ | ---------------------------------------------- | -------- |
| Yes, auto-hide on scroll | Slides down on scroll, reappears on scroll up. | Y        |
| No, always visible       | Fixed at bottom.                               |          |

**User's choice:** Yes, auto-hide on scroll
**Notes:** None

### Q5: Safe area padding for notch/home indicator?

| Option                          | Description                   | Selected |
| ------------------------------- | ----------------------------- | -------- |
| Yes, with padding (Recommended) | Standard for iOS/Android PWA. | Y        |
| You decide                      | Claude handles automatically. |          |

**User's choice:** Yes, with padding
**Notes:** None

---

## Route Cleanup Strategy

### Q1: How should demo pages be gated?

| Option                          | Description                                                   | Selected |
| ------------------------------- | ------------------------------------------------------------- | -------- |
| Route-level guard (Recommended) | `beforeLoad` checks `VITE_DEV_MODE`, redirects to /dashboard. | Y        |
| Separate route tree             | Move all demos to `_protected/_dev/` subfolder.               |          |
| You decide                      | Claude picks.                                                 |          |

**User's choice:** Route-level guard
**Notes:** None

### Q2: What happens when user navigates to old/duplicate route?

| Option                      | Description                                | Selected |
| --------------------------- | ------------------------------------------ | -------- |
| Redirect to canonical route | Old paths redirect to new canonical paths. |          |
| Show 404 page               | Old routes removed, users get 404.         |          |
| You decide                  | Claude picks based on impact.              | Y        |

**User's choice:** You decide
**Notes:** None

### Q3: Standalone feature pages — keep or absorb?

| Option                 | Description                                                    | Selected |
| ---------------------- | -------------------------------------------------------------- | -------- |
| Keep as routes for now | Phase 13 handles absorption. Phase 8 just adds sidebar access. |          |
| Start absorbing now    | Begin moving to contextual locations during Phase 8.           | Y        |
| You decide             | Claude picks.                                                  |          |

**User's choice:** Start absorbing now
**Notes:** Redirected to deferred — Feature Absorption is Phase 13 scope. Phase 8 ensures sidebar accessibility only.

### Q4: modern-nav-standalone.tsx treatment?

| Option               | Description                      | Selected |
| -------------------- | -------------------------------- | -------- |
| Yes, gate it as demo | Add VITE_DEV_MODE guard.         |          |
| Remove entirely      | Delete the file.                 |          |
| You decide           | Claude investigates and decides. | Y        |

**User's choice:** You decide
**Notes:** None

---

## Cmd+K Quick Switcher

### Q1: What entities should Cmd+K search across?

| Option            | Description                                                            | Selected |
| ----------------- | ---------------------------------------------------------------------- | -------- |
| All dossier types | Countries, orgs, persons, forums, topics, working groups, engagements. | Y        |
| Navigation pages  | Dashboard, Tasks, Settings, Analytics — fuzzy match on page names.     | Y        |
| Work items        | Tasks, commitments, intake tickets — search by title or assignee.      | Y        |
| Commands          | Actions like 'Create engagement', 'Switch language', 'Toggle theme'.   | Y        |

**User's choice:** All options + "everything you can think of"
**Notes:** User wants comprehensive search across all searchable content in the app.

### Q2: Show recents when palette opens?

| Option                          | Description                                      | Selected |
| ------------------------------- | ------------------------------------------------ | -------- |
| Yes, show recents (Recommended) | Last 5-10 visited items. Stored in localStorage. | Y        |
| No, empty until typed           | Palette opens empty.                             |          |
| You decide                      | Claude picks.                                    |          |

**User's choice:** Yes, show recents
**Notes:** None

### Q3: Results grouped by type or single ranked list?

| Option                        | Description                                                                      | Selected |
| ----------------------------- | -------------------------------------------------------------------------------- | -------- |
| Grouped by type (Recommended) | Sections: Recents, Dossiers, Pages, Work Items, Commands. VS Code/Raycast style. | Y        |
| Single ranked list            | All results mixed, sorted by relevance.                                          |          |
| You decide                    | Claude picks.                                                                    |          |

**User's choice:** Grouped by type
**Notes:** None

### Q4: Data source for search results?

| Option                     | Description                                                    | Selected |
| -------------------------- | -------------------------------------------------------------- | -------- |
| API search with debounce   | Hit backend search endpoint. Always fresh.                     |          |
| TanStack Query cache first | Search local cache, fall back to API. Faster for recent items. |          |
| You decide                 | Claude picks based on dataset size and query patterns.         |          |

**User's choice:** "The most performant design"
**Notes:** User wants hybrid: cache-first for speed, API fallback for completeness.

### Q5: Cmd+K on mobile?

| Option                     | Description                                        | Selected |
| -------------------------- | -------------------------------------------------- | -------- |
| Yes, search icon in header | Opens same command palette as full-screen overlay. | Y        |
| No, desktop only           | Keyboard-only.                                     |          |
| You decide                 | Claude picks.                                      |          |

**User's choice:** Yes, search icon in header
**Notes:** None

---

## Claude's Discretion

- Sidebar collapse default state
- Icon-rail behavior (768-1023px)
- After-Actions placement (own item vs nested)
- "More" tab content format on mobile
- "Dossiers" tab expansion behavior on mobile
- Old/duplicate route redirect strategy
- modern-nav-standalone.tsx treatment

## Deferred Ideas

- **Start absorbing standalone pages earlier** — User wanted to begin Feature Absorption during Phase 8 but this is Phase 13 scope.
