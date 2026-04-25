# Phase 40: list-pages — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 40-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 40-list-pages
**Areas discussed:** GenericListPage scope + route shells, Handoff parity for missing PNGs, Engagements interactions (LIST-04), Data gaps + legacy cuts + waves

---

## Area 1: GenericListPage scope + route shells

### Q1.1 — GenericListPage scope

| Option              | Description                                                                        | Selected                |
| ------------------- | ---------------------------------------------------------------------------------- | ----------------------- |
| Rows-only (LIST-03) | GLP handles forums/topics/working-groups only; bespoke for tables/grid/engagements |                         |
| Rows + tables       | GLP variant prop covers LIST-03 + LIST-01                                          |                         |
| Universal layout    | One GLP with all variants                                                          |                         |
| GLP + ListPageShell | Two-layer: shell chrome + GLP rows-variant                                         | ✓ (clarified follow-up) |

**User's choice:** "comprehensive" → clarified as **Two-layer: ListPageShell + GenericListPage**
**Notes:** ListPageShell consumed by every list page; GenericListPage (rows variant) wraps shell and is consumed only by Forums/Topics/Working Groups. Tables, persons grid, engagements consume ListPageShell directly with bespoke bodies.

### Q1.2 — Existing layout-route hydration

| Option                             | Description                                                           | Selected |
| ---------------------------------- | --------------------------------------------------------------------- | -------- |
| Add index.tsx children             | Keep `<Outlet/>` shells; add `index.tsx` siblings rendering list view | ✓        |
| Rewrite layout files               | Replace `<Outlet/>` with list view; lose extension point              |          |
| Hybrid (single-file route + index) | Colocate; non-idiomatic for project                                   |          |

**User's choice:** Add index.tsx children
**Notes:** Matches existing `dossiers/{type}/$id/engagements.tsx` child-route convention; Phase 41 detail child routes drop in alongside.

### Q1.3 — Topics route scaffold

| Option                   | Description                                            | Selected |
| ------------------------ | ------------------------------------------------------ | -------- |
| Match forums.tsx pattern | New `topics.tsx` Outlet + `topics/index.tsx` list view | ✓        |
| Single-file route        | One file, no layout shell — inconsistent               |          |
| Defer to Phase 42        | Skip topics — breaks LIST-03 contract                  |          |

**User's choice:** Match forums.tsx pattern

---

## Area 2: Handoff parity for missing PNGs

### Q2.1 — Persons grid source of truth

| Option                                           | Description                                                           | Selected |
| ------------------------------------------------ | --------------------------------------------------------------------- | -------- |
| REQUIREMENTS verbatim + dashboard.png card style | Spec from REQUIREMENTS LIST-02 + crib card visuals from dashboard.png | ✓        |
| Pause for designer                               | Block Phase 40 until persons.png ships                                |          |
| Claude derives + human checkpoint                | Iterate via review checkpoints in Wave 1                              |          |

**User's choice:** REQUIREMENTS verbatim + dashboard.png card style

### Q2.2 — Working-Groups + Topics rows

| Option                             | Description                                                                         | Selected |
| ---------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| Identical visual to forums.png     | All 3 render identically through GenericListPage; only data + chip semantics differ | ✓        |
| Forums.png + per-type chip palette | Same layout, divergent chip palette                                                 |          |
| Bespoke each                       | Drop the shared component                                                           |          |

**User's choice:** Identical visual to forums.png

### Q2.3 — Visual regression baselines

| Option                     | Description                          | Selected                |
| -------------------------- | ------------------------------------ | ----------------------- |
| LTR+AR × 1280px for all 7  | 14 snapshots, 2% maxDiffPixelRatio   | ✓ (Claude's discretion) |
| Only 4 PNG-backed pages    | Skip persons/wg/topics — risks drift |                         |
| All 7 + mobile breakpoints | 42 snapshots, heavy CI               |                         |

**User's choice:** "you decide the best for the project" → **Claude's discretion: LTR+AR × 1280px for all 7**
**Rationale:** Matches Phase 38 D-13 cap; full coverage with controlled CI cost.

---

## Area 3: Engagements interactions (LIST-04)

### Q3.1 — Filter pills

| Option                          | Description                                     | Selected                |
| ------------------------------- | ----------------------------------------------- | ----------------------- |
| All 4 wired client-side         | Local filter, mirrors handoff `pages.jsx`       | ✓ (Claude's discretion) |
| All 4 wired server-side         | Push to query                                   |                         |
| Visual stubs (Phase 39 pattern) | aria-disabled + tooltip — loses LIST-04 wording |                         |
| All wired + URL state           | Server-side + search-param plumbing             |                         |

**User's choice:** "you decide" → **Claude's discretion: All 4 wired client-side**
**Rationale:** Mirrors handoff behavior; no backend changes; Phase 40 stays scoped.

### Q3.2 — Pagination

| Option                       | Description                                         | Selected                |
| ---------------------------- | --------------------------------------------------- | ----------------------- |
| useInfiniteQuery with cursor | Idiomatic TanStack Query; cursor on engagement_date | ✓ (Claude's discretion) |
| useInfiniteQuery with offset | Risks duplicates on insert                          |                         |
| Extend useEngagements        | Less idiomatic                                      |                         |
| Researcher decides           | Defer                                               |                         |

**User's choice:** "you decide the best for the project" → **Claude's discretion: useInfiniteQuery with cursor**
**Rationale:** Idiomatic; safer than offset under concurrent inserts.

### Q3.3 — Click target

| Option                                       | Description                                      | Selected |
| -------------------------------------------- | ------------------------------------------------ | -------- |
| Navigate to existing engagement detail route | Phase 41 drawer overlays without changing wiring | ✓        |
| Stub with TODO for Phase 41                  | No-op + console.log                              |          |
| Open work-item detail dialog                 | Wrong fit                                        |          |

**User's choice:** Navigate to existing engagement detail route

### Q3.4 — Search

| Option                                  | Description                      | Selected |
| --------------------------------------- | -------------------------------- | -------- |
| Client-side filter, 250ms debounce      | Snappy, matches Phase 39 pattern | ✓        |
| Server-side query param, 400ms debounce | Better at scale                  |          |
| Client-side, no debounce                | Render thrash risk               |          |

**User's choice:** Client-side filter, 250ms debounce

---

## Area 4: Data gaps + legacy cuts + waves

### Q4.1 — useCountries / useOrganizations

| Option                                            | Description                     | Selected |
| ------------------------------------------------- | ------------------------------- | -------- |
| Researcher locates in domains/, then thin adapter | Mirror Phase 38 D-08 pattern    | ✓        |
| New top-level hooks from scratch                  | Risks duplication               |          |
| Inline queries in route component                 | Couples list page to data layer |          |

**User's choice:** Researcher locates in domains/, then thin adapter

### Q4.2 — Sensitivity + last-touch field mapping

| Option                                | Description                                | Selected |
| ------------------------------------- | ------------------------------------------ | -------- |
| Researcher confirms from schema       | Lock columns + chip mapping in RESEARCH.md | ✓        |
| Assume sensitivity_level + updated_at | Risk if names differ                       |          |
| Add sensitivity column if missing     | Out of scope (data phase)                  |          |

**User's choice:** Researcher confirms from schema

### Q4.3 — Legacy table fate

| Option                                       | Description           | Selected |
| -------------------------------------------- | --------------------- | -------- |
| Keep ui/table.tsx; defer cleanup to Phase 43 | Minimize blast radius | ✓        |
| Cut unused tables now                        | Adds Phase 40 risk    |          |
| Migrate everyone to ListPageShell            | Out of scope          |          |

**User's choice:** Keep ui/table.tsx, defer cleanup to Phase 43 QA

### Q4.4 — Wave structure

| Option                                | Description                                                         | Selected |
| ------------------------------------- | ------------------------------------------------------------------- | -------- |
| 3-wave parallel (Phase 38/39 pattern) | Wave 0 infra → Wave 1 7 pages parallel → Wave 2 E2E + visual + a11y | ✓        |
| 2-wave (skip infra wave)              | Build primitives inline; abstraction thrash                         |          |
| 5-wave (over-decompose)               | More serial; loses parallelism                                      |          |

**User's choice:** 3-wave parallel (Phase 38/39 pattern)

---

## Claude's Discretion

- **Q2.3** — Visual regression scope (LTR+AR × 1280px × 7)
- **Q3.1** — Filter pills wiring (all 4 client-side)
- **Q3.2** — Pagination (useInfiniteQuery cursor-based)
- Skeleton anatomy per page
- Bilingual empty-state copy
- Filter pill active styling tokens (researcher confirms exact pill anatomy from handoff)
- Cursor pagination column choice (researcher locks based on existing query order)

## Deferred Ideas

- Server-side filter pills + URL state for Engagements (future polish)
- Mobile breakpoint visual regression (768 + 320) — render assertions enough
- Server-side search (reassess above ~200 items)
- Legacy table migration to ListPageShell (Phase 43 QA owns)
- Designer-supplied persons.png (REQUIREMENTS + dashboard.png parity covers Phase 40)
- Schema migrations for sensitivity/last-touch (out of scope; researcher flags blocker if missing)
