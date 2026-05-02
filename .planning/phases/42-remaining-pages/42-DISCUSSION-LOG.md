# Phase 42: remaining-pages - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 42-remaining-pages
**Areas discussed:** After-actions data source · Briefs — AI panel & filters placement · Settings — section anatomy & form pattern · Activity & Tasks — keep tabs/filters or strip

---

## After-actions data source

### Q1 — How should the new global After-actions table be wired to data?

| Option                                           | Description                                                                                                                                                                                                                                                                    | Selected |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| New `after-actions-list-all` Edge Function       | Backend: create a new Supabase Edge Function returning aggregated after-action records across all dossiers the user has access to (RLS-gated). Mirrors existing `after-actions-list` shape but without `dossier_id` filter. ~80 lines backend + new `useAfterActionsAll` hook. | ✓        |
| Direct Supabase client query in the page         | Frontend-only: skip the Edge Function and query `after_actions` table directly via the Supabase JS client. Faster to ship; risks bypassing edge-function logic and creating an inconsistent pattern.                                                                           |          |
| Ship chrome + empty-state, defer wiring          | Render the handoff after-actions table layout with an empty/loading state and a 'Wiring pending' note. Visual close-out for PAGE-02 with deferred wiring.                                                                                                                      |          |
| Reuse existing per-engagement after-action route | Keep `/after-actions` as a stub listing engagements with after-action records and link into per-engagement detail. Would relax PAGE-02 acceptance.                                                                                                                             |          |

**User's choice:** New `after-actions-list-all` Edge Function (Recommended)
**Notes:** Locks D-01 in CONTEXT.md.

### Q2 — What scope of records should the new function return by default?

| Option                                        | Description                                                                                                                                                                               | Selected |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| All accessible records, status=published only | Default returns published after-action records across every dossier the caller has RLS access to. Matches handoff intent (finalized records). Status filter overrideable via query param. | ✓        |
| All accessible records, all statuses          | Returns published + draft + edit_requested. Mixes WIP with finalized records.                                                                                                             |          |
| User-scoped (author/contributor only)         | Personal queue feel; doesn't align with handoff's org-wide framing.                                                                                                                       |          |
| All accessible records, paginated default 50  | Same as Recommended but with explicit cursor pagination as default.                                                                                                                       |          |

**User's choice:** All accessible records, status=published only (Recommended)
**Notes:** Locks D-02 in CONTEXT.md.

### Q3 — Table columns and row click behavior?

| Option                                              | Description                                                                                                                                          | Selected |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Handoff verbatim + row click → detail route         | Engagement / Date / Dossier chip / Decisions / Commitments / chevron with `icon-flip` for RTL. Row click → existing `/after-actions/$afterActionId`. | ✓        |
| Handoff columns + author column                     | Adds author initials/name before chevron. Useful but adds visual density.                                                                            |          |
| Handoff columns + open in dossier drawer (Phase 41) | Bypasses per-record detail surface. Likely not what users want for after-actions.                                                                    |          |
| Handoff columns + status chip                       | Only useful if Q2 returned all-statuses; with published-only default it's dead UI.                                                                   |          |

**User's choice:** Handoff verbatim + row click → detail route (Recommended)
**Notes:** Locks D-03 in CONTEXT.md.

### Q4 — Filters, search, empty/loading states?

| Option                                             | Description                                                                         | Selected |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| No filters, no search, skeleton + empty state only | Handoff verbatim — pure card grid, no filter chrome. Bilingual concise empty state. | ✓        |
| Search input only (matches Phase 40 engagements)   | 250ms debounced client-side search by title + dossier name.                         |          |
| Search + dossier filter pill                       | More flexibility, deviates from verbatim port.                                      |          |
| Date range filter (year/quarter)                   | Useful retrospectively but not in handoff.                                          |          |

**User's choice:** No filters, no search, skeleton + empty state only (Recommended)
**Notes:** Locks D-04 in CONTEXT.md.

---

## Briefs — AI panel & filters placement

### Q1 — Where should AI BriefGenerationPanel and BriefViewer live in the new card grid?

| Option                                                                         | Description                                                                                                                                                         | Selected |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Card click → BriefViewer dialog; AI generation moves to PageHead action button | Card grid is primary surface. Card click opens BriefViewer dialog. "New brief" in `.page-head` opens BriefGenerationPanel as dialog/sheet. Zero feature regression. | ✓        |
| Strip AI panel + viewer; ship card grid only                                   | Pure verbatim. Regresses two shipped features.                                                                                                                      |          |
| Keep AI panel above the card grid in same view                                 | Breaks handoff layout (handoff has nothing above the grid).                                                                                                         |          |
| Move AI panel to dedicated `/briefs/generate` route                            | Clean separation but risks scope creep into Phase 42.                                                                                                               |          |

**User's choice:** Card click → BriefViewer dialog; AI generation moves to PageHead action button (Recommended)
**Notes:** Locks D-05 in CONTEXT.md.

### Q2 — How should the brief status chip (ready/draft/review/awaiting) be derived?

| Option                                          | Description                                                                                                                                                         | Selected |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Map existing fields with sensible defaults      | `is_published=true` → ready; `published_date` set + approver pending → awaiting; review-stage → review; else draft. Lossless if review/awaiting fields don't exist. | ✓        |
| Add a real `status` column to the briefs schema | Backend change with migration. Cleanest semantics but adds scope.                                                                                                   |          |
| Use only `is_published` boolean                 | Lossy: ready vs draft only.                                                                                                                                         |          |
| Researcher-decides                              | Defer mapping to research output.                                                                                                                                   |          |

**User's choice:** Map existing fields with sensible defaults (Recommended)
**Notes:** Locks D-06 in CONTEXT.md.

### Q3 — What should happen to the existing search input + category select?

| Option                                  | Description                                                       | Selected |
| --------------------------------------- | ----------------------------------------------------------------- | -------- |
| Strip both — handoff has neither        | Pure verbatim. Reintroduce later if usage demands.                | ✓        |
| Keep search only, drop category select  | Compromise.                                                       |          |
| Keep both                               | Lowest disruption to current workflow but most chrome divergence. |          |
| Move search to a global command palette | Out of scope.                                                     |          |

**User's choice:** Strip both — handoff has neither (Recommended)
**Notes:** Locks D-07 in CONTEXT.md.

### Q4 — Card field surface and bilingual title/summary handling?

| Option                                                                  | Description                                                                                                                                      | Selected |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Handoff verbatim: status chip + page count + serif title + author + due | Top: status chip (start) + `N pp` mono (end). Title: display-font 16px 500 locale-aware. Bottom: author (start) + due/published mono date (end). | ✓        |
| Handoff + reference number badge                                        | Adds `reference_number` mono badge near page count.                                                                                              |          |
| Handoff + summary excerpt                                               | Adds 2-line summary; breaks card density at narrow widths.                                                                                       |          |
| Handoff + tags chip row                                                 | Adds tags chips; would unbalance auto-fill grid.                                                                                                 |          |

**User's choice:** Handoff verbatim (Recommended)
**Notes:** Locks D-08 in CONTEXT.md.

---

## Settings — section anatomy & form pattern

### Q1 — How should existing 7 sections reconcile with handoff's 6-section nav?

| Option                                                         | Description                                                                                                                                                                    | Selected |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Keep all 7 sections, extend handoff nav vertically             | Profile / General / Appearance / Notifications / Access & Security / Accessibility / Data & Privacy. Renames "Security" → "Access & Security". Preserves shipped a11y feature. | ✓        |
| Strict handoff 6 sections; fold Accessibility into Appearance  | Loses dedicated a11y entry point.                                                                                                                                              |          |
| Strict handoff 6 sections; fold Accessibility into General     | Less semantic fit.                                                                                                                                                             |          |
| Strict handoff 6 sections; defer Accessibility to its own page | Significant scope churn; loses discoverability.                                                                                                                                |          |

**User's choice:** Keep all 7 sections, extend handoff nav vertically (Recommended)
**Notes:** Locks D-09 in CONTEXT.md.

### Q2 — Form pattern for the right-side content card?

| Option                                                      | Description                                                                                   | Selected |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Keep existing inline forms; restyle to match handoff tokens | Preserves react-hook-form + zod with single Save action per section. Restyle only via tokens. | ✓        |
| Convert all sections to handoff edit-row + dialog pattern   | Each setting renders as edit-row → opens dialog with form field. Regresses form ergonomics.   |          |
| Hybrid — simple edit-row + dialog, complex inline           | Halfway approach.                                                                             |          |
| Edit-rows everywhere with inline expansion                  | Custom interaction not in handoff or current code; net-new design work.                       |          |

**User's choice:** Keep existing inline forms; restyle to match handoff tokens (Recommended)
**Notes:** Locks D-10 in CONTEXT.md.

### Q3 — How should Phase 33/34 design controls (direction, density, hue, light/dark) be surfaced?

| Option                                                                     | Description                                                                                                | Selected |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| Move all theme controls into the Appearance section                        | Appearance becomes canonical control surface. TweaksDrawer stays as topbar quick-access; both share hooks. | ✓        |
| Keep theme controls only in TweaksDrawer; Appearance shows light/dark only | Keeps small scope; doesn't match handoff intent.                                                           |          |
| Mirror controls in both Settings and TweaksDrawer                          | Two surfaces share hooks — but adds duplication.                                                           |          |
| Defer theme controls migration to Phase 43                                 | Cleanest small-scope option but ships a section that's mostly stubs.                                       |          |

**User's choice:** Move all theme controls into the Appearance section (Recommended)
**Notes:** Locks D-11 in CONTEXT.md.

### Q4 — How should the two-column layout collapse on mobile (≤768px)?

| Option                                                                                    | Description                                            | Selected |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------- |
| Nav collapses to horizontal pill row above the card; active accent bar flips to underline | Per success criteria #4 verbatim.                      | ✓        |
| Nav collapses to a `<select>` dropdown above the card                                     | Loses visual continuity; contradicts success criteria. |          |
| Nav stays vertical above the card (full-width column)                                     | Page becomes very tall.                                |          |
| Hide nav behind a sheet trigger; show current section only                                | Adds navigation step on every section switch.          |          |

**User's choice:** Nav collapses to a horizontal row of pills above the card; active accent bar flips to underline (Recommended)
**Notes:** Locks D-12 in CONTEXT.md.

---

## Activity & Tasks — keep tabs/filters or strip

### Q1 — How should Activity reconcile its tabs/statistics/settings sheet with handoff timeline?

| Option                                                                               | Description                                                                                                                     | Selected |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Keep All/Following tabs above handoff `.act-list`; strip statistics + settings sheet | Tabs preserve shipped follow feature; statistics and settings sheet are non-handoff chrome with no analyst value at page level. | ✓        |
| Strip tabs entirely; render single global all-activity feed                          | Regresses Following filter as a primary affordance.                                                                             |          |
| Keep all existing chrome (tabs + statistics + settings sheet) above handoff list     | Highest preservation; most chrome divergence.                                                                                   |          |
| Collapse tabs into a segmented control inside `.page-head` actions                   | Frees vertical space; integrates with `.page-head` action slot.                                                                 |          |

**User's choice:** Keep All/Following tabs above the handoff `.act-list`; strip statistics + settings sheet (Recommended)
**Notes:** Locks D-13 in CONTEXT.md.

### Q2 — How should each Activity row render the "who action what in where" payload?

| Option                                                                          | Description                                                                                                                                                                        | Selected |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Locale-aware composition: bilingual templates per `event_type`                  | Researcher locks `ActivityItem.event_type` enum + per-type bilingual templates. `who` 500-weight, `what` ink-mute (entity strong + ink), `where` accent-ink. Icon map per handoff. | ✓        |
| Single generic template `{actor} {action} {entity} in {context}`                | Reads awkwardly in Arabic with verb conjugation.                                                                                                                                   |          |
| Keep existing EnhancedActivityFeed row component; restyle to match handoff grid | Risk: existing row may not have `where` accent-ink emphasis.                                                                                                                       |          |
| Defer composition rules to researcher                                           | Same pattern as Phase 40 D-12.                                                                                                                                                     |          |

**User's choice:** Locale-aware composition: bilingual templates per `event_type` (Recommended)
**Notes:** Locks D-14 in CONTEXT.md.

### Q3 — How should Tasks ("My desk") handle Assigned/Contributed tabs + work-creation FAB?

| Option                                                                         | Description                                                                                                    | Selected |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------- |
| Keep Assigned/Contributed tabs; strip FAB; row click opens existing TaskDetail | Tabs preserve Feature 025 US2. "New task" lives in `.page-head` action slot per handoff. Row anatomy verbatim. | ✓        |
| Strip tabs; render single Assigned-only list                                   | Regresses Feature 025 US2.                                                                                     |          |
| Keep tabs + FAB unchanged; only restyle row anatomy                            | Lowest disruption; FAB inconsistent with handoff.                                                              |          |
| Replace tabs with a filter pill row (Assigned/Contributed/All)                 | Adds an All scope; visual consistency with engagements.                                                        |          |

**User's choice:** Keep Assigned/Contributed tabs; strip FAB; row click opens existing TaskDetail (Recommended)
**Notes:** Locks D-15 in CONTEXT.md.

### Q4 — Test gates and wave structure?

| Option                                                                                | Description                                                                                                                                         | Selected |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Phase 38/40/41 precedent: 3 waves, 10 visual baselines, axe + size-limit + Playwright | Wave 0 infra (Edge Function, hook, i18n, fixtures, size-limit) → Wave 1 5 page reskins → Wave 2 gates. Defers legacy primitive cleanup to Phase 43. | ✓        |
| Lighter gates: 5 visual baselines (LTR only) + smoke E2E                              | Halves visual regression scope; weakens bilingual guarantee.                                                                                        |          |
| Heavier gates: include 768px + 320px breakpoint snapshots                             | 20 baselines; slows CI.                                                                                                                             |          |
| Recommended gates + cut Phase 43 legacy primitive sweep into this phase               | Bundles Phase 43 work; risks scope creep.                                                                                                           |          |

**User's choice:** Phase 38/40/41 precedent: 3 waves, 10 visual baselines (Recommended)
**Notes:** Locks D-16 in CONTEXT.md.

---

## Claude's Discretion

Areas the user implicitly delegated by selecting "Recommended" with researcher hand-offs:

- Brief schema field locations for status chip mapping (D-06) — researcher confirms exact `is_published / published_date / approver / review-stage` fields.
- `useActivityFeed` `event_type` enum + matching bilingual templates per type (D-14) — researcher locks during research.
- After-actions Edge Function pagination strategy + cursor design — researcher confirms record volume and proposes default limit.
- HeroUI v3 Tabs `classNames` integration with handoff tokens — researcher confirms primitive supports the styling shape.
- i18n namespace strategy (extend existing vs page-scoped new namespaces) — researcher proposes; planner finalizes.
- Empty-state bilingual copy phrasing per page — researcher proposes; planner locks.
- Skeleton anatomy per page — researcher matches each body shape.
- Settings forms inline restyle spacing/typography exact tokens — researcher proposes; planner locks.
- Activity row event-type fallback icon for unknown types (`dot` icon proposed).
- Task `.task-box` checkbox toggle backend persistence vs optimistic local state — researcher confirms whether existing `useUpdateTask` mutation is wired here.

## Deferred Ideas

See `42-CONTEXT.md` `<deferred>` section for the canonical list. Highlights:

- After-actions: search/filters, date range, drafts/edit-requested status views.
- Briefs: reference number badge, summary excerpt, tags chip row, inline search/category filter, dedicated `/briefs/generate` route, schema migration adding `status` enum column.
- Settings: edit-row + dialog-per-field pattern (rejected), dedicated `/settings/accessibility` route (rejected).
- Tasks: FAB (stripped), redirect to `/kanban` (rejected).
- Activity: statistics panel (stripped), settings sheet trigger (stripped).
- Cross-cutting: legacy primitive cleanup (Phase 43), mobile breakpoint visual regression snapshots (precedent), `lucide-react` → Phase 37 `<Icon/>` migration (Phase 43), global RTL/a11y/responsive sweep (Phase 43).
