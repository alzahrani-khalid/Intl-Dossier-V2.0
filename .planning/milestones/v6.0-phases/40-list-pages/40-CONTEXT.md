# Phase 40: list-pages — Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild all 7 dossier-type list pages — **Countries / Organizations / Persons / Forums / Topics / Working Groups / Engagements** — pixel-aligned to handoff (`/tmp/inteldossier-handoff/inteldossier/project/`) using Phase 33 tokens, Phase 36 AppShell, Phase 37 `<DossierGlyph>` + `<GlobeSpinner>`. Introduce a **two-layer shared abstraction**: a `ListPageShell` (chrome) consumed by every list page, and a `GenericListPage` (rows variant) used by Forums/Topics/Working Groups (LIST-03). Tables (LIST-01), Persons grid (LIST-02), and Engagements (LIST-04) stay bespoke bodies but consume `ListPageShell`.

**In scope:**

- 7 list-view `index.tsx` children mounted under existing `_protected/{type}.tsx` `<Outlet/>` layout routes (countries, organizations, persons, forums, working-groups, engagements) — plus a NEW `_protected/topics.tsx` layout route + child mirroring the `forums.tsx` pattern
- `ListPageShell` primitive — header, search input slot, filter-pills slot, body slot, empty state, skeleton, load-more row
- `GenericListPage` (rows variant) — name + meta + status chip → consumed by Forums/Topics/Working Groups; visually identical via the same component
- `DossierTable` (LIST-01) — Countries + Organizations: `DossierGlyph` + EN/AR names + engagement count + last-touch + sensitivity chip + chevron (RTL: `scaleX(-1)`)
- `PersonsGrid` (LIST-02) — 44px circular initial avatar + name + glyph + VIP chip + role + org; card aesthetic cribbed from existing `dashboard.png`
- `EngagementsList` (LIST-04) — search input (250ms debounce, client-side filter), 4 filter pills (All/Confirmed/Travel/Pending — all wired client-side), week-list rendering, `useInfiniteQuery` with cursor pagination, load-more row showing `<GlobeSpinner>` + bilingual "Loading more engagements…"
- Thin adapter hooks: `useCountries`, `useOrganizations`, `useEngagementsInfinite` (mirror Phase 38 D-08 thin-adapter pattern; researcher locates `domains/countries/`, `domains/organizations/` repository methods first)
- Per-page `<Skeleton>` shape-matching loading states
- Click target: each row/card → existing entity detail route (drawer overlays in Phase 41 without changing Phase 40 wiring)
- Responsive 320 / 768 / 1280 px with card-view fallbacks on mobile and ≥44×44 px touch targets; chips/meta flow RTL via logical properties only
- i18n namespaces: `list-pages` shared namespace + per-entity sub-namespaces (existing `engagements`, `forums`, `persons`, `working-groups`, `countries`, `organizations` extended; new `topics`)
- Visual regression baselines: 7 pages × LTR + AR @ 1280 px = 14 snapshots, 2% maxDiffPixelRatio
- Playwright E2E (smoke + filter + load-more + RTL chevron flip), axe-core a11y gate, size-limit budget update

**Out of scope (deferred):**

- Dossier drawer wiring (Phase 41 — drawer overlays click target without changing Phase 40 nav)
- Briefs / After-actions / Tasks / Activity / Settings list-style pages (Phase 42 — PAGE-01..05)
- Cleanup of legacy table components (`AuditLogTable`, `SLAComplianceTable`, `ElectedOfficialListTable`, `AdvancedDataTable`, `SelectableDataTable`, `ResponsiveTable`, `EntityComparisonTable`, `DataTable`) — defer to Phase 43 QA sweep
- Server-side filter pills, server-side search, schema migrations for sensitivity/last-touch fields
- Mobile-breakpoint visual regression snapshots (768 / 320 covered by render assertions only — Phase 38 precedent)
- Global RTL/a11y/responsive sweep (Phase 43)

</domain>

<decisions>
## Implementation Decisions

### Area 1: GenericListPage scope + route shells

- **D-01:** **Two-layer abstraction.** `ListPageShell` (chrome: header, search slot, filter-pills slot, body slot, empty, skeleton, load-more) is consumed by every list page. `GenericListPage` (rows variant: name + meta + status chip) wraps `ListPageShell` and is consumed only by Forums/Topics/Working Groups (LIST-03). Tables, Persons grid, and Engagements consume `ListPageShell` directly with bespoke bodies.
- **D-02:** **Add `index.tsx` children to existing `<Outlet/>` layout routes.** Keep `countries.tsx`, `organizations.tsx`, `persons.tsx`, `forums.tsx`, `working-groups.tsx`, `engagements.tsx` as-is (layout shells with `<Outlet/>`). Each gets a sibling `index.tsx` that mounts at `/{type}` and renders the list view. This preserves the existing `dossiers/{type}/$id/engagements.tsx` child-route pattern and leaves room for future detail child routes.
- **D-03:** **Topics route created from scratch.** New `routes/_protected/topics.tsx` (Outlet layout) + `topics/index.tsx` (list view), mirroring `forums.tsx` exactly. Updates router tree generation if needed.

### Area 2: Handoff parity for missing PNGs

- **D-04:** **Persons grid (LIST-02): REQUIREMENTS verbatim + dashboard.png card aesthetic.** REQUIREMENTS is prescriptive (44px circular initial avatar, name, glyph, VIP chip, role, org). Card visuals (radius, shadow, padding tokens) cribbed from shipped `dashboard.png` cards. Researcher distills exact tokens during research.
- **D-05:** **Working-Groups + Topics rows (LIST-03): identical visual to forums.png.** All 3 entity types render through `GenericListPage` with the same row height, padding, and chip slot. Only the data source and status chip semantics (entity-type-specific status enums) differ.
- **D-06:** **Visual regression baselines for all 7 pages × LTR+AR @ 1280px.** 14 snapshots total at 2% maxDiffPixelRatio. Mobile breakpoints (320/768) covered by render assertions only — keeps CI fast (Phase 38 D-13 precedent).

### Area 3: Engagements interactions (LIST-04)

- **D-07:** **All 4 filter pills wired client-side.** `All` resets, `Confirmed`/`Travel`/`Pending` filter the loaded engagements client-side via `status === 'confirmed'`, `kind === 'travel'`, `status === 'pending'`. Mirrors handoff `pages.jsx` behavior. No backend changes.
- **D-08:** **Pagination via `useInfiniteQuery` with cursor.** New `useEngagementsInfinite` adapter wraps the existing engagement repo using TanStack Query `useInfiniteQuery`. Cursor based on last `engagement_date` (researcher confirms exact column). Load-more button triggers `fetchNextPage()`; `<GlobeSpinner>` overlays during `isFetchingNextPage`.
  > **SUPERSEDED by RESEARCH §3 (2026-04-25):** OFFSET pagination via useInfiniteQuery + getNextPageParam (engagementsRepo has no cursor support). See 40-RESEARCH.md.
- **D-09:** **Search input: client-side filter with 250ms debounce.** Filters loaded engagements by title/counterpart. Matches Phase 39 search pattern.
- **D-10:** **Row click navigates to existing engagement detail route.** Phase 41 dossier-drawer overlays this without changing the Phase 40 wiring. Researcher confirms exact target route (likely `/dossiers/{type}/{id}/engagements/{engId}` based on existing tree). Mirrors Phase 39 D-09.

### Area 4: Data gaps + legacy cuts + waves

- **D-11:** **`useCountries` + `useOrganizations` thin adapters.** Researcher locates `domains/countries/` and `domains/organizations/` repository methods first; adapter hooks wrap repo calls with TanStack Query (mirrors Phase 38 D-08 `useWeekAhead` / `usePersonalCommitments`). New top-level hooks land at `frontend/src/hooks/useCountries.ts` and `useOrganizations.ts`.
- **D-12:** **Sensitivity chip + last-touch field mapping resolved by researcher.** Researcher reads dossiers schema, locks the actual column names (likely `sensitivity_level` + `updated_at` or `last_engagement_at`) and chip label/color mapping in `RESEARCH.md`. Planner consumes those locks. No schema migrations.
- **D-13:** **Defer legacy table cleanup to Phase 43 QA.** Phase 40 keeps `ui/table.tsx` primitive and adds new `ListPageShell`/`DossierTable`. Existing `AuditLogTable`, `SLAComplianceTable`, `ElectedOfficialListTable`, `AdvancedDataTable`, `SelectableDataTable`, `ResponsiveTable`, `EntityComparisonTable`, `DataTable` stay if still imported. Phase 43 audits and cuts dead tables.
- **D-14:** **3-wave parallel structure (Phase 38/39 pattern).**
  - **Wave 0 (infra):** `ListPageShell` + `GenericListPage` + `DossierTable` + `PersonsGrid` + `EngagementsList` primitives + adapter hooks (`useCountries`, `useOrganizations`, `useEngagementsInfinite`) + locale namespace scaffold (incl. new `topics` namespace) + `topics.tsx` layout route + size-limit budget update
  - **Wave 1 (pages, parallel):** 7 list pages — countries, organizations, persons, forums, topics, working-groups, engagements — each with Skeleton + empty state + RTL chevron flip
  - **Wave 2 (gates):** Playwright E2E (smoke + filter pills + load-more + RTL chevron + click-target navigation) + visual regression baselines (14 snapshots) + axe-core a11y + size-limit gate + human checkpoint
- **D-15:** **Test gates per Phase 38 D-13:** 2% maxDiffPixelRatio, axe-core zero violations, size-limit budget enforced, ≥44×44 px touch targets verified by Playwright.

### RTL & Responsive (carried from prior phases)

- **D-16:** **Logical properties only** (`ms-*/me-*/ps-*/pe-*/start-*/end-*`, `inline-start/inline-end`). Chevrons mirror via `scaleX(-1)` on `[dir="rtl"]` (LIST-01). No `ml/mr/pl/pr/left/right`. Arabic locale uses Tajawal cascade from Phase 35.
- **D-17:** **Card-view fallback for tables on mobile (<768 px).** Countries/Organizations tables collapse to row cards under 768; persons grid reflows from multi-column to single column under 640.
- **D-18:** **All interactive elements ≥44×44 px** (rows, chevrons, filter pills, load-more button, search input).

### Claude's Discretion

- **Skeleton anatomy** — researcher matches each page's skeleton to its body shape (table rows for tables, card grid for persons, row strip for GenericListPage, week-list for engagements).
- **Empty state copy** — bilingual; concise; per-entity-type messaging (e.g., "No countries yet" / "لا توجد دول بعد").
- **Filter pill active styling** — uses `--accent` token + `--accent-soft` background per Phase 33 utilities; researcher confirms exact pill anatomy from handoff `pages.jsx`/`app.css`.
- **Cursor pagination column** — researcher chooses between `engagement_date` and `created_at` based on what the existing list query already orders by.

### Folded Todos

_None — no pending todos folded into Phase 40 scope._

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Handoff source of truth (verbatim port targets)

- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx` — `CountriesPage` / `OrganizationsPage` / `PersonsPage` / `ForumsPage` / `EngagementsPage` JSX (researcher locates exact line ranges + extracts toolbar, row anatomy, filter pill markup, week-list rendering, load-more shape)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` — list-page CSS rules (search input, filter pills, table rows, person cards, row strips, week-list, load-more)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/countries.png` — LIST-01 LTR baseline (Countries)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/organizations.png` — LIST-01 LTR baseline (Organizations)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/forums.png` — LIST-03 LTR baseline (Forums; Topics + Working Groups parity)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/engagements.png` — LIST-04 LTR baseline (Engagements with filter pills + week list)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/dashboard.png` — Persons card aesthetic source (LIST-02 has no dedicated PNG; persons cards crib radius/shadow/padding from dashboard cards)

### Project requirements + roadmap

- `.planning/REQUIREMENTS.md` §"List Pages (LIST)" — LIST-01..04 acceptance criteria (verbatim)
- `.planning/ROADMAP.md` §"Phase 40: list-pages" — goal, dependencies, success criteria

### Prior phase context (locked decisions feeding Phase 40)

- `.planning/phases/33-token-engine/33-CONTEXT.md` — D-12/D-16 token utilities (`bg-accent-soft`, `text-accent-ink`, `text-ink-mute`, `bg-warn-soft`, `border-line`, `border-line-soft`) consumed by chips, rows, table cells
- `.planning/phases/36-shell-chrome/36-CONTEXT.md` — AppShell wrapper (Phase 40 routes mount inside; classification chrome stays untouched)
- `.planning/phases/37-signature-visuals/37-CONTEXT.md` — `<DossierGlyph flag={iso} size={N}/>` consumed by every row/card; `<GlobeSpinner/>` consumed by Engagements load-more (D-09..D-12 fallback chain already shipped)
- `.planning/phases/38-dashboard-verbatim/38-CONTEXT.md` — D-08 thin-adapter hook pattern (`useWeekAhead`, `usePersonalCommitments`) replicated for `useCountries`/`useOrganizations`/`useEngagementsInfinite`; D-09 wave structure (infra → widgets → E2E + legacy cut); D-11 per-widget Skeleton; D-13 visual regression at 1280 px only
- `.planning/phases/39-kanban-calendar/39-CONTEXT.md` — D-09 click-target precedent (open existing detail surface; drawer overlays in Phase 41); search input + filter pill aesthetics; week-list mobile pattern reused for engagements rendering

### Existing codebase entry points (reuse — do NOT rebuild)

- `frontend/src/components/signature-visuals/index.ts` — `GlobeSpinner`, `DossierGlyph` (Phase 37 barrel)
- `frontend/src/components/ui/table.tsx` — base table primitive (kept; not deleted)
- `frontend/src/hooks/useEngagements.ts` — existing engagements query (wrap in `useEngagementsInfinite` adapter)
- `frontend/src/hooks/useForums.ts` — existing forums query
- `frontend/src/hooks/useTopics.ts` — existing topics query
- `frontend/src/hooks/useWorkingGroups.ts` — existing working-groups query
- `frontend/src/hooks/usePersons.ts` — existing persons query
- `frontend/src/domains/countries/` — researcher locates repository methods (basis for `useCountries` adapter)
- `frontend/src/domains/organizations/` — researcher locates repository methods (basis for `useOrganizations` adapter)
- `frontend/src/routes/_protected/{countries,organizations,persons,forums,working-groups,engagements}.tsx` — existing `<Outlet/>` layout routes (kept as-is; receive `index.tsx` children)
- `frontend/src/lib/dossier-routes.ts` — `getDossierRouteSegment` for click-target route generation
- `frontend/public/locales/{en,ar}/{countries,organizations,persons,forums,working-groups,engagements}.json` — existing namespaces (extended); new `topics.json` created
- `frontend/src/utils/toArDigits` (or equivalent) — Arabic-Indic digit rendering for engagement counts + last-touch + week-list dates (researcher confirms current location)

### Existing dependencies (already installed — do NOT add new)

- `@tanstack/react-query` (`useInfiniteQuery`)
- `@tanstack/react-router`
- `react-i18next`
- `axe-core` + Playwright (Phase 38 gates)
- `size-limit` (Phase 37 budget gate)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`<DossierGlyph>` + `<GlobeSpinner>`** (Phase 37 barrel): consumed by every row/card and engagements load-more
- **`ui/table.tsx`** primitive: base table; new `DossierTable` composes it
- **5 entity hooks** (`useEngagements`, `useForums`, `useTopics`, `useWorkingGroups`, `usePersons`): wrap or extend; do not duplicate
- **AppShell** (Phase 36): all 7 routes mount inside; classification chrome stays untouched
- **Token utilities** (Phase 33): chips/rows/cells consume `bg-accent-soft`, `text-accent-ink`, `text-ink-mute`, `bg-warn-soft`, `border-line`, `border-line-soft`
- **Tajawal cascade** (Phase 35): Arabic locale typography
- **`getDossierRouteSegment`** (`lib/dossier-routes.ts`): click-target route generation

### Established Patterns

- **Verbatim port** (Phase 35/37/38/39): 1:1 preservation of handoff markup, classes, timings — no improvisation
- **Thin adapter hooks** (Phase 38 D-08): wrap repo methods with TanStack Query; new hooks land in `frontend/src/hooks/`
- **Two-layer shell + variant body** (NEW for Phase 40): `ListPageShell` chrome + bespoke or shared body
- **Logical properties only** (CLAUDE.md mandate): `ms-*/me-*/ps-*/pe-*/start-*/end-*`; never `ml/mr/pl/pr/left/right`
- **RTL chevron via `scaleX(-1)`** (Phase 37 D-05 precedent for Sparkline): mirror via CSS at the row/cell level
- **Per-widget/page Skeleton** (Phase 38 D-11): shape-matching loading states
- **Mobile card-view fallback** (CLAUDE.md mobile-first mandate): tables collapse to row cards under 768 px
- **Visual regression at 1280 px only** (Phase 38 D-13): mobile breakpoints covered by render assertions
- **Click → existing detail surface** (Phase 39 D-09): drawer overlays in next phase without changing wiring

### Integration Points

- **Phase 41 dossier-drawer** consumes the click-target route configured in D-10 (no Phase 40 changes needed when drawer ships)
- **Phase 42 remaining-pages** may consume `ListPageShell` for After-actions/Tasks if shape matches (decision deferred to Phase 42)
- **Phase 43 QA sweep** owns the legacy-table cleanup (D-13)

</code_context>

<specifics>
## Specific Ideas

- **`DossierTable` row anatomy** (LIST-01): `<DossierGlyph>` + EN name (top) + AR name (bottom, smaller, `text-ink-mute`) + engagement count column + last-touch column + sensitivity chip column + chevron column. Chevron rotates via `[dir="rtl"] .chevron { transform: scaleX(-1) }`.
- **`PersonsGrid` card** (LIST-02): 44 px circular initial avatar (background = accent-soft, foreground = accent-ink) + name (bold) + `<DossierGlyph>` (size 14) + VIP chip (only if `is_vip === true`) + role + org. Card variant from `dashboard.png`: `rounded-[var(--radius-md)] border border-line shadow-sm p-4`.
- **`GenericListPage` row** (LIST-03): name + meta line + status chip (right edge in LTR, left edge in RTL via logical properties). Row height ~64 px to satisfy ≥44 px touch target with padding.
- **`EngagementsList`** (LIST-04): top toolbar = search input (`me-3` from filter pills) + 4 filter pills inline. Body = week-list grouped by ISO week, each week header = "Week of {date}" / "أسبوع {date}". Each engagement row = title + counterpart + glyph + status chip. Load-more row = `<GlobeSpinner>` (centered) + bilingual "Loading more engagements…" / "جارٍ تحميل المزيد من الارتباطات…".
- **Visual regression**: 14 snapshots captured by Playwright `toHaveScreenshot` at 1280 px viewport. AR snapshots taken with `i18n.changeLanguage('ar')` + `dir="rtl"` set on `<html>`. 2% maxDiffPixelRatio.
- **Skeleton shape match**: Tables → 8 row skeletons; persons grid → 6 card skeletons; rows → 6 row skeletons; engagements → 1 week skeleton with 3 row skeletons.
- **Empty state copy**: each page gets bilingual empty-state copy (concise; per-entity-type messaging).

</specifics>

<deferred>
## Deferred Ideas

- **Server-side filter pills + URL state for Engagements** — would enable shareable filtered URLs but adds search-param plumbing. Defer to a future polish pass once usage tells us it matters.
- **Mobile breakpoint visual regression** — 768 + 320 snapshots could catch reflow regressions but triple CI cost. Phase 38 precedent says render assertions are enough.
- **Server-side search** — only matters above ~200 items per entity. Client-side filter with 250 ms debounce ships now; reassess if persons/engagements grow.
- **Migrating legacy tables (`AuditLogTable`, `SLAComplianceTable`, `ElectedOfficialListTable`, `AdvancedDataTable`, `SelectableDataTable`, `ResponsiveTable`, `EntityComparisonTable`, `DataTable`) to `ListPageShell`** — out of Phase 40 scope; Phase 43 QA sweep audits and cuts dead tables, may migrate the live ones if shape matches.
- **Persons designer shot** — REQUIREMENTS + dashboard.png parity covers Phase 40; a dedicated `persons.png` from designer would let us tighten visual baselines later.
- **Schema migrations for sensitivity / last-touch** — out of scope; if columns are missing the researcher flags it as a blocker, not a Phase 40 task.

</deferred>

---

_Phase: 40-list-pages_
_Context gathered: 2026-04-25_
