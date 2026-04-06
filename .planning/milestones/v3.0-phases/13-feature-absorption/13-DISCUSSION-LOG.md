# Phase 13: Feature Absorption - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 13-feature-absorption
**Areas discussed:** Cmd+K Quick Switcher, Analytics Placement, Network Graph Embedding, Standalone Page Removal

---

## Cmd+K Quick Switcher

### Q1: Search Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All entity types | Countries, organizations, forums, engagements, topics, working groups, persons, elected officials | ✓ |
| Recent items | Show recently viewed dossiers/pages | ✓ |
| Commands & actions | App-level commands like 'Create engagement', 'Generate briefing', 'Switch language' | ✓ |
| Global text search | Full-text search across dossier content | ✓ |

**User's choice:** All four scopes selected (multi-select)
**Notes:** Full-featured switcher — every search category included

### Q2: Results Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped by category | Sections: Recent -> Entities -> Commands -> Search Results. Sub-grouped by dossier type | ✓ |
| Flat ranked list | Single list ranked by relevance score, no sections | |
| Tab-filtered | Tabs at top to filter: All, Dossiers, Commands, Recent | |

**User's choice:** Grouped by category
**Notes:** Similar to VS Code/Linear command palettes. Previewed with ASCII mockup

### Q3: Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Recent items + top commands | Show 5 most recent dossiers + 5 most-used commands before typing | ✓ |
| Just recent items | Only recent dossiers, commands appear after typing | |
| Placeholder only | Empty with placeholder text | |

**User's choice:** Recent items + top commands
**Notes:** Immediately useful without typing

### Q4: Search Page Fate

| Option | Description | Selected |
|--------|-------------|----------|
| Replace entirely | Cmd+K becomes THE search. No separate search page | ✓ |
| Keep filters page | Cmd+K for quick nav, advanced filters available separately | |
| You decide | Claude picks based on existing search infrastructure | |

**User's choice:** Replace entirely
**Notes:** Matches ABSORB-03 requirement

---

## Analytics Placement

### Q1: Dashboard Content

| Option | Description | Selected |
|--------|-------------|----------|
| Summary widgets | High-level KPI cards: total dossiers, active engagements, deadlines, work items | ✓ |
| Full analytics panels | Richer charts and graphs directly on dashboard | |
| You decide | Claude picks based on existing content | |

**User's choice:** Summary widgets
**Notes:** Glanceable overview only, no deep drill-down on dashboard

### Q2: Dossier Overview Analytics

| Option | Description | Selected |
|--------|-------------|----------|
| Context-specific metrics | Tailored cards per dossier type (country: engagements + topics, org: members + meetings, etc.) | ✓ |
| Uniform stats card | Same card across all types: activity count, last activity, related entities | |
| You decide | Claude picks based on available data | |

**User's choice:** Context-specific metrics
**Notes:** Each dossier type gets relevant, tailored analytics cards

---

## Network Graph Embedding

### Q1: Embedding Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Inline mini-graph + expand to modal | Small preview in sidebar + full-screen modal on expand | ✓ |
| Expandable panel overlay | Toggle slides graph as wide overlay panel (50-70% width) | |
| Full-screen modal only | No inline preview, just a "View Graph" button | |

**User's choice:** Inline mini-graph + expand to modal
**Notes:** Previewed with ASCII mockup. Best of both worlds — at-a-glance + full interaction

---

## Standalone Page Removal

### Q1: Old URL Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to new location | Old routes redirect to contextual locations (e.g., /analytics -> /dashboard) | ✓ |
| Remove routes entirely | Delete old routes, users get 404 | |
| You decide | Claude picks per route | |

**User's choice:** Redirect to new location
**Notes:** Graceful migration, no broken links

### Q2: Feature Discoverability

| Option | Description | Selected |
|--------|-------------|----------|
| Contextual + Cmd+K commands | Features in context AND launchable via Cmd+K commands | ✓ |
| Contextual only | Features only from hub-and-spoke location | |
| You decide | Claude picks per feature | |

**User's choice:** Contextual + Cmd+K commands
**Notes:** Dual-access for best discoverability

---

## Claude's Discretion

- Keyboard navigation patterns within Cmd+K
- Bilingual search matching strategy
- Result count limits per category
- Chart types for dashboard widgets
- Analytics card refresh intervals
- Mini-graph node interactions
- Full-screen modal graph controls
- Redirect target mapping for edge cases
- ABSORB-05 and ABSORB-06 implementation details

## Deferred Ideas

None — discussion stayed within phase scope
