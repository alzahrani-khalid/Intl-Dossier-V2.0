# Phase 40: list-pages — Research

**Researched:** 2026-04-25
**Domain:** Front-end list pages — 7 dossier-typed pages built on Phase 33 tokens / Phase 36 AppShell / Phase 37 signature visuals, ported verbatim from `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx`
**Confidence:** HIGH (handoff source extracted line-by-line; routes/hooks/CSS verified in repo)

## Summary

Phase 40 ports four handoff page archetypes — `DossierListPage` (LIST-01 tables for Countries/Organizations), `PersonsPage` (LIST-02 card grid), `GenericListPage` (LIST-03 row strip for Forums/Topics/Working-Groups), and `EngagementsPage` (LIST-04 search + filter pills + week-list + load-more) — into the V2 React 19 + TanStack Router app while introducing a thin two-layer `ListPageShell` + `GenericListPage` abstraction.

**Two pivotal corrections to CONTEXT.md** that the planner MUST honor:

1. **Route topology** — CONTEXT.md D-02/D-03 incorrectly assumes `countries.tsx`, `forums.tsx`, `working-groups.tsx`, `topics.tsx` are `<Outlet/>` layout shells needing `index.tsx` children. **Reality:** `_protected/{countries,organizations,forums,working-groups}.tsx` are 6-line REDIRECTS to `/dossiers/{type}`. The actual list page slots already live at `_protected/dossiers/{countries,organizations,forums,topics,working_groups}/index.tsx` (full 266-300 line implementations), plus `_protected/persons/index.tsx` and `_protected/engagements/index.tsx` (14-line stubs delegating to `@/pages/{persons,engagements}/{Persons,Engagements}ListPage`). **All 7 list page slots already exist** — Phase 40 work is REPLACEMENT of those file contents, not creation of new layout/index splits. No `topics.tsx` layout route is needed (existing tree already mounts under `/dossiers/topics`).

2. **Locale namespaces** — CONTEXT.md `<canonical_refs>` lists 7 entity namespaces as "existing"; **none of them exist** in `frontend/public/locales/{en,ar}/`. The current namespaces with relevant strings are `dossier.json` and `translation.json`. Phase 40 must **create** all 7 (`countries.json`, `organizations.json`, `persons.json`, `forums.json`, `topics.json`, `working-groups.json`, `engagements.json`) plus the shared `list-pages.json` namespace.

**Primary recommendation:** Replace the seven existing `index.tsx` (or page component) bodies with new `<ListPageShell>`-driven implementations, building all chrome + GenericListPage + DossierTable + PersonsGrid + EngagementsList in Wave 0, populating the 7 pages in Wave 1, and gating with Playwright + axe + size-limit + 14 visual baselines in Wave 2. Use the existing `engagementsRepo.getEngagements({ page, limit, sort_by, sort_order })` REST repo for `useEngagementsInfinite` (offset-pagination via `useInfiniteQuery`, NOT cursor — the repo has no cursor support); use the existing `useForums`/`useWorkingGroups` Supabase queries (`from('dossiers').eq('type','forum'|'working_group')`) for LIST-03; create `useCountries`/`useOrganizations` as new Supabase-backed hooks following the same `from('dossiers').eq('type','country'|'organization')` pattern (no `domains/countries/` or `domains/organizations/` directories exist).

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Area 1: GenericListPage scope + route shells**

- **D-01:** Two-layer abstraction. `ListPageShell` (chrome) consumed by every list page; `GenericListPage` (rows variant) wraps `ListPageShell` and is consumed only by Forums/Topics/Working-Groups (LIST-03). Tables, Persons grid, Engagements consume `ListPageShell` directly.
- **D-02:** _(SUPERSEDED — see Pivotal Correction 1)_ Original intent: add `index.tsx` children to `<Outlet/>` layout routes. Actual repo state: list pages already exist; replace bodies in place.
- **D-03:** _(SUPERSEDED — see Pivotal Correction 1)_ Original intent: create `topics.tsx` layout route from scratch. Actual repo state: `_protected/dossiers/topics/index.tsx` already exists.

**Area 2: Handoff parity for missing PNGs**

- **D-04:** Persons grid (LIST-02): REQUIREMENTS verbatim + dashboard.png card aesthetic (44px circular initial avatar, name, glyph, VIP chip, role, org). Card visuals (radius/shadow/padding tokens) cribbed from dashboard cards.
- **D-05:** Working-Groups + Topics rows (LIST-03): identical visual to forums.png. All 3 entity types render through `GenericListPage` with the same row height/padding/chip slot.
- **D-06:** Visual regression baselines for all 7 pages × LTR+AR @ 1280px = 14 snapshots, 2% maxDiffPixelRatio. Mobile breakpoints (320/768) covered by render assertions only.

**Area 3: Engagements interactions (LIST-04)**

- **D-07:** All 4 filter pills wired client-side. `All` resets; `Confirmed`/`Travel`/`Pending` filter by `status === 'confirmed'`, `kind === 'travel'`, `status === 'pending'`. No backend changes.
- **D-08:** Pagination via `useInfiniteQuery`. _(REVISED — see §"Engagements pagination column" below)_ Use **offset-based pagination via `page`/`limit` params** wrapping `engagementsRepo.getEngagements()`; existing repo has no cursor support and orders server-side via `sort_by` (default unknown — confirm with backend; fallback `start_date desc`).
- **D-09:** Search input with 250ms debounce, client-side filter on title + counterpart.
- **D-10:** Row click → existing engagement detail route. _(LOCKED — see §"Engagement row click target" below)_ Target: `/engagements/$engagementId/overview` (verified at `frontend/src/routes/_protected/engagements/$engagementId.tsx`).

**Area 4: Data gaps + legacy cuts + waves**

- **D-11:** `useCountries` + `useOrganizations` thin adapters. _(REVISED)_ `domains/countries/` and `domains/organizations/` directories DO NOT EXIST. New hooks land at `frontend/src/hooks/useCountries.ts` and `useOrganizations.ts`, querying `supabase.from('dossiers').eq('type', 'country' | 'organization').neq('status', 'deleted')` mirroring the existing `useForums` pattern.
- **D-12:** Sensitivity chip + last-touch field mapping. _(LOCKED — see §"Sensitivity chip + last-touch column mapping")_ `sensitivity_level: number (1-4)` + `updated_at: timestamptz`. Chip mapping in §below.
- **D-13:** Defer legacy table cleanup (`AuditLogTable`, `SLAComplianceTable`, `ElectedOfficialListTable`, `AdvancedDataTable`, `SelectableDataTable`, `ResponsiveTable`, `EntityComparisonTable`, `DataTable`) to Phase 43 QA.
- **D-14:** 3-wave parallel structure (Phase 38/39 pattern):
  - **Wave 0 (infra):** `ListPageShell` + `GenericListPage` + `DossierTable` + `PersonsGrid` + `EngagementsList` primitives + adapter hooks (`useCountries`, `useOrganizations`, `useEngagementsInfinite`) + 8 locale namespace files (`countries`, `organizations`, `persons`, `forums`, `topics`, `working-groups`, `engagements`, `list-pages`) × LTR+AR + size-limit budget update + Playwright fixtures
  - **Wave 1 (pages, parallel):** Replace bodies of all 7 existing `index.tsx`/page components with new implementations
  - **Wave 2 (gates):** Playwright E2E (smoke + filter pills + load-more + RTL chevron + click-target navigation) + 14 visual regression baselines + axe-core a11y + size-limit gate + human checkpoint
- **D-15:** Test gates per Phase 38 D-13: 2% maxDiffPixelRatio, axe-core zero violations, size-limit budget enforced, ≥44×44 px touch targets verified by Playwright.

**RTL & Responsive (carried)**

- **D-16:** Logical properties only (`ms-*/me-*/ps-*/pe-*/start-*/end-*`). Chevrons mirror via `[dir="rtl"] .icon-flip { transform: scaleX(-1) }` (already shipped in handoff `app.css:667`). No `ml/mr/pl/pr/left/right`.
- **D-17:** Card-view fallback for tables on mobile (<768 px). Persons grid reflows from multi-column to single column under 640.
- **D-18:** All interactive elements ≥44×44 px (rows, chevrons, filter pills, load-more button, search input).

### Claude's Discretion

- **Skeleton anatomy** — match each page's skeleton to body shape: tables → 8 row skeletons; persons → 6 card skeletons; rows → 6 row skeletons; engagements → 1 week skeleton with 3 row skeletons.
- **Empty state copy** — bilingual; concise; per-entity-type messaging.
- **Filter pill active styling** — uses handoff `.btn.btn-primary` pattern (`background: var(--ink); color: var(--surface); border-color: var(--ink)`) per `app.css:222-225`. Dir-variant overrides at `app.css:226,228,553,664` MAY be ignored (Phase 40 ships single direction `bureau`); planner confirms.
- **Cursor pagination column** — _(LOCKED — see §"Engagements pagination column")_ Offset (`page`/`limit`), not cursor.

### Deferred Ideas (OUT OF SCOPE)

- Server-side filter pills + URL state for Engagements
- Mobile breakpoint visual regression (768/320 snapshots)
- Server-side search
- Migrating legacy tables to `ListPageShell`
- Persons designer shot
- Schema migrations for sensitivity / last-touch (use existing `sensitivity_level` + `updated_at`)

## Phase Requirements

| ID      | Description                                                                                                                                                        | Research Support                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LIST-01 | Countries + Organizations tables: `DossierGlyph` + EN/AR names + engagement count + last-touch + sensitivity chip + chevron; chevron flips via `scaleX(-1)` in RTL | `DossierTable` primitive composed on existing `ui/table.tsx` (`Table`, `TableContainer` already accept `className` + standard `<table>` semantics); chevron uses `class="icon-flip"` already wired in handoff `app.css:667`; data via new `useCountries`/`useOrganizations` Supabase hooks (pattern: `from('dossiers').eq('type','country'/'organization').neq('status','deleted')`); engagement count + last-touch = `dossiers.engagement_count` (verify) + `dossiers.updated_at`; sensitivity chip = `sensitivity_level` numeric → label/color mapping below |
| LIST-02 | Persons page as grid of cards (44px circular initial avatar + name + glyph + VIP chip + role + org)                                                                | `PersonsGrid` primitive consuming existing `usePersons` hook (re-exported via `@/hooks/usePersons.ts`); card radius/shadow/padding cribbed from handoff `.card` rule (`app.css:233`: `border: 1px solid var(--line); border-radius: var(--radius); padding: var(--pad)`); avatar bg/fg = `--accent-soft` / `--accent-ink` (Phase 33 tokens); VIP chip = `chip-accent`                                                                                                                                                                                          |
| LIST-03 | Forums/Topics/Working-Groups as rows: name + meta + status chip via shared `GenericListPage`                                                                       | `GenericListPage` wraps `ListPageShell`; row markup verbatim from handoff `pages.jsx:614-630` using `.forum-row` grid (`grid-template-columns: auto 1fr auto auto`, `padding: 14px`, `border-bottom: 1px solid var(--line-soft)`); status chip palette mapping per entity type below; data via existing `useForums`/`useTopics`/`useWorkingGroups` Supabase hooks                                                                                                                                                                                              |
| LIST-04 | Engagements: search input + 4 filter pills (All/Confirmed/Travel/Pending) + week-list rendering + load-more row with `<GlobeSpinner>` + bilingual loading text     | `EngagementsList` primitive: `Toolbar` (handoff `pages.jsx:15-17`) + `FilterPill` (handoff `pages.jsx:19-25`, uses `.btn` + `.btn-primary` toggle) + `.week-list` body (handoff `app.css:309-322`, grid `72px 1fr auto`) + `LoadMoreRow` (handoff `pages.jsx:90-111`, `.spinner-row` + `<GlobeSpinner size={16}/>`); `useEngagementsInfinite` adapter wraps `useInfiniteQuery` over `engagementsRepo.getEngagements({ page, limit, sort_by: 'start_date', sort_order: 'desc' })`; client-side debounce via `useDebouncedValue(q, 250)`                         |

## Project Constraints (from CLAUDE.md)

| Directive                                                                      | Source                                                              | Phase 40 Application                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HeroUI v3 component hierarchy (HeroUI → Aceternity → Kibo → shadcn)            | CLAUDE.md "UI Component Guidelines"                                 | Audit per primitive in §"HeroUI v3 vs custom decision" — most Phase 40 primitives are bespoke wrappers because handoff CSS classes (`.tbl`, `.week-list`, `.forum-row`, `.tb-search`, `.chip*`) require verbatim port                  |
| RTL logical properties only (no `ml/mr/pl/pr/left/right/text-left/text-right`) | CLAUDE.md "Arabic RTL Support Guidelines (MANDATORY)"               | All Phase 40 markup uses `ms-*/me-*/ps-*/pe-*/start-*/end-*`; handoff CSS already uses `margin-inline-start`, `padding-inline-end`, `border-inline-end`, `text-align: start/end` — port as-is                                          |
| Mobile-first 320 → 2xl with ≥44×44 touch targets                               | CLAUDE.md "Mobile-First & Responsive Design (MANDATORY)"            | Tables collapse to row cards under 768; persons grid reflows from multi-col to 1-col under 640; all rows/chips/buttons ≥44×44 enforced via Playwright assertion                                                                        |
| Work-item terminology (`assignee_id`, `deadline`, `priority` enum, etc.)       | CLAUDE.md "Work Management Terminology"                             | Not directly applicable — no work-item rendering in Phase 40; engagements/forums/topics are dossier-typed entities, not work items                                                                                                     |
| Dossier-centric: every feature ties to a dossier                               | CLAUDE.md "Dossier-Centric Development Patterns"                    | All 7 entity types ARE dossier subtypes (`dossiers.type IN ('country','organization','person','forum','topic','working_group','engagement')`); rows click through to existing dossier detail routes via `getDossierRouteSegment(type)` |
| GSD workflow enforcement; surgical changes (Karpathy)                          | CLAUDE.md "GSD Workflow Enforcement" + "Karpathy Coding Principles" | Replace existing index/page bodies in place; do NOT touch legacy tables (D-13); do NOT improve adjacent code                                                                                                                           |
| `pnpm` package manager; Turborepo monorepo                                     | CLAUDE.md "Commands"                                                | All install commands use `pnpm add`; size-limit gate runs in `frontend` workspace                                                                                                                                                      |
| Bilingual EN/AR (i18next); Tajawal cascade in AR                               | CLAUDE.md "Project"                                                 | All page strings in `i18next` namespaces; AR text uses `font-family: 'Tajawal', var(--font-body), system-ui, sans-serif` (Phase 35)                                                                                                    |

## Architectural Responsibility Map

| Capability                                          | Primary Tier                                    | Secondary Tier                 | Rationale                                                                                                                                                         |
| --------------------------------------------------- | ----------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List page route registration                        | Frontend (TanStack Router)                      | —                              | Routes already mounted at `_protected/dossiers/{type}/index.tsx` + `_protected/{persons,engagements}/index.tsx`; replacement-only                                 |
| Entity data fetching (Forums/Topics/Working-Groups) | Frontend (TanStack Query → Supabase)            | —                              | Existing `useForums`/`useTopics`/`useWorkingGroups` use `supabase.from('dossiers')` directly — no API hop                                                         |
| Entity data fetching (Engagements)                  | Frontend (TanStack Query → Backend REST)        | Backend (`/engagements` route) | `engagementsRepo.getEngagements()` calls backend REST API at `/engagements?page=&limit=&sort_by=&sort_order=`; backend reads `engagements` table (NOT `dossiers`) |
| Entity data fetching (Countries/Organizations)      | Frontend (TanStack Query → Supabase)            | —                              | NEW hooks; same `from('dossiers').eq('type', X)` pattern as `useForums`                                                                                           |
| Entity data fetching (Persons)                      | Frontend (TanStack Query → existing usePersons) | —                              | Existing `@/domains/persons` repository (per CONTEXT.md `lib/dossier-routes.ts` mention); thin re-export at `@/hooks/usePersons.ts`                               |
| Filter / search state                               | Browser (component-local React state)           | —                              | All client-side per D-07/D-09; no URL state                                                                                                                       |
| Click → detail navigation                           | TanStack Router                                 | —                              | Use `useNavigate()` + `getDossierRouteSegment(type)` for non-engagement entities; use literal `/engagements/$engagementId/overview` for engagements               |
| Visual regression assertions                        | Playwright @ 1280px viewport                    | —                              | Phase 38 precedent; mobile breakpoints render-asserted only                                                                                                       |
| a11y enforcement                                    | axe-core via Playwright                         | —                              | Phase 38 gate reused                                                                                                                                              |
| Bundle budget enforcement                           | size-limit (CI gate)                            | —                              | Phase 37 gate; Phase 40 budget delta estimated below                                                                                                              |

## Standard Stack

### Core (already installed — DO NOT add)

| Library                                                      | Version   | Purpose                                                                       | Why Standard                                                                                                                        |
| ------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `@tanstack/react-query`                                      | (current) | `useInfiniteQuery` for engagements pagination, `useQuery` for everything else | Already pervasive (Phase 38 D-08 thin-adapter pattern) [VERIFIED: imports across `frontend/src/hooks/` and `frontend/src/domains/`] |
| `@tanstack/react-router`                                     | (current) | File-based routing; `useNavigate` for click-through                           | Already routes whole app [VERIFIED: `frontend/src/routes/_protected/`]                                                              |
| `react-i18next`                                              | (current) | Bilingual EN/AR, namespace loading                                            | Already pervasive [VERIFIED: `useTranslation` calls across codebase]                                                                |
| `axe-core` + `@axe-core/playwright`                          | (current) | a11y gate                                                                     | Phase 38 precedent [VERIFIED: `frontend/package.json`]                                                                              |
| `size-limit` + `@size-limit/preset-app` + `@size-limit/file` | `^12.0.1` | Bundle budget gate                                                            | Phase 37 precedent [VERIFIED: `frontend/package.json:124-125`, `frontend/.size-limit.json`]                                         |
| `@playwright/test`                                           | (current) | E2E + visual regression                                                       | Phase 38 precedent [VERIFIED: `frontend/package.json`]                                                                              |

### Supporting

| Library                                                                 | Version | Purpose                                                                       | When to Use                                                                                                                                   |
| ----------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing `frontend/src/lib/i18n/toArDigits.ts`                          | —       | Arabic-Indic digit rendering                                                  | Engagement counts, last-touch dates, week-list dates [VERIFIED: file exists at that path]                                                     |
| Existing `frontend/src/lib/dossier-routes.ts`                           | —       | `getDossierRouteSegment(type)` returns plural route segment                   | Click-target route generation for Countries/Organizations/Persons/Forums/Topics/Working-Groups/Engagements [VERIFIED: full mapping inspected] |
| Existing `frontend/src/components/signature-visuals/` (Phase 37 barrel) | —       | `<DossierGlyph flag={iso} type={kind} size={N}/>`, `<GlobeSpinner size={N}/>` | Every row/card glyph + Engagements load-more spinner [VERIFIED: barrel at `index.ts`]                                                         |
| Existing `frontend/src/components/ui/table.tsx`                         | —       | Base `Table`/`TableContainer` primitives                                      | `DossierTable` composes on top [VERIFIED: file inspected, exports `Table`, `TableContainer`]                                                  |

### Alternatives Considered

| Instead of             | Could Use                                                                     | Tradeoff                                                                                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HeroUI v3 `<Table>`    | Bespoke `DossierTable` on existing `ui/table.tsx`                             | Handoff CSS (`table.tbl`, `.tbl th`, `.tbl td`) is verbatim-port targeted; HeroUI v3 Table imposes its own styling system + compound components — would force re-styling and break parity with reference PNGs. **Decision: bespoke.** |
| HeroUI v3 `<Card>`     | Bespoke `<div className="card">` from handoff                                 | Same — handoff `.card` rule (`app.css:233`) is the parity target; HeroUI Card adds compound components (`Card.Header`, `Card.Content`) not in handoff. **Decision: plain div with handoff class.**                                    |
| HeroUI v3 `<Chip>`     | Bespoke `<span className="chip ...">`                                         | Handoff `.chip` + variants (`chip-accent`, `chip-warn`, `chip-danger`, `chip-ok`, `chip-info`) lock font-size 11px, padding 2px 8px, border-radius 99px; HeroUI Chip would need style overrides to match. **Decision: bespoke span.** |
| HeroUI v3 `<Skeleton>` | Existing `frontend/src/components/ui/heroui-skeleton.tsx` (already a wrapper) | Existing wrapper renders as `animate-pulse` div — fine for shape-matching. **Decision: reuse `heroui-skeleton.tsx` wrapper.**                                                                                                         |
| HeroUI v3 `<Input>`    | Bespoke `<input>` inside `.tb-search` div                                     | Handoff `.tb-search` is a styled wrapper around bare `<input>`; HeroUI Input has its own slot anatomy. **Decision: bespoke input inside `.tb-search` per handoff.**                                                                   |
| Cursor pagination      | Offset pagination via `page`/`limit`                                          | Existing engagements REST API has no cursor support — would require backend change (out of scope). **Decision: offset.**                                                                                                              |

**Installation:** No new dependencies required. All Phase 40 work uses already-installed packages.

**Version verification:** Skipped — no new packages added.

## Architecture Patterns

### System Architecture Diagram

```
                          ┌──────────────────────────────────┐
                          │  TanStack Router file tree       │
                          │  _protected/dossiers/{type}/     │
                          │  + _protected/{persons,          │
                          │      engagements}/index.tsx      │
                          └────────────┬─────────────────────┘
                                       │ mounts
                                       ▼
                          ┌──────────────────────────────────┐
                          │  ListPageShell (chrome)          │
                          │  - PageHead (title/sub/action)   │
                          │  - Toolbar slot                  │
                          │  - Body slot                     │
                          │  - Skeleton state                │
                          │  - Empty state                   │
                          └────────────┬─────────────────────┘
                                       │
                ┌──────────────────────┼─────────────────────────┬──────────────────────┐
                ▼                      ▼                         ▼                      ▼
     ┌──────────────────┐   ┌──────────────────┐    ┌──────────────────┐   ┌────────────────────┐
     │  DossierTable    │   │  PersonsGrid     │    │  GenericListPage │   │  EngagementsList   │
     │  (LIST-01)       │   │  (LIST-02)       │    │  (LIST-03 rows)  │   │  (LIST-04)         │
     │  countries +     │   │  persons grid    │    │  forums/topics/  │   │  search + 4 pills  │
     │  organizations   │   │  of cards        │    │  working-groups  │   │  + week-list +     │
     │                  │   │                  │    │                  │   │  load-more         │
     └────────┬─────────┘   └────────┬─────────┘    └────────┬─────────┘   └─────────┬──────────┘
              │                      │                       │                       │
              ▼                      ▼                       ▼                       ▼
     ┌──────────────────┐   ┌──────────────────┐    ┌──────────────────┐   ┌────────────────────┐
     │ useCountries     │   │  usePersons      │    │  useForums       │   │ useEngagementsInf. │
     │ useOrganizations │   │  (existing)      │    │  useTopics       │   │ (NEW adapter wraps │
     │ (NEW Supabase    │   │                  │    │  useWorkingGroups│   │  engagementsRepo   │
     │  hooks)          │   │                  │    │  (existing)      │   │  via               │
     │                  │   │                  │    │                  │   │  useInfiniteQuery) │
     └────────┬─────────┘   └────────┬─────────┘    └────────┬─────────┘   └─────────┬──────────┘
              │                      │                       │                       │
              ▼                      ▼                       ▼                       ▼
     ┌──────────────────────────────────────────────────────────┐    ┌────────────────────────┐
     │           supabase.from('dossiers').eq('type', X)        │    │  engagementsRepo       │
     │           .neq('status','deleted')                       │    │   .getEngagements()    │
     │           .range(offset, offset+limit-1)                 │    │   → backend REST API   │
     │           .order('updated_at', { ascending: false })     │    │   /engagements?page=…  │
     └──────────────────────────────────────────────────────────┘    └────────────────────────┘
                                                                                │
                                                                                ▼
                                                                     ┌────────────────────────┐
                                                                     │  PostgreSQL            │
                                                                     │  engagements table     │
                                                                     └────────────────────────┘

   Cross-cutting (all bodies):
     - DossierGlyph (Phase 37)            → flag/type icon per row/card
     - GlobeSpinner (Phase 37)            → engagements load-more spinner only
     - toArDigits (frontend/src/lib/i18n) → Arabic-Indic digit rendering
     - getDossierRouteSegment             → click-through navigation
     - icon-flip class                    → RTL chevron mirror via scaleX(-1)
     - logical properties (ms/me/ps/pe)   → CLAUDE.md mandate
```

### Recommended Project Structure

```
frontend/src/
├── components/
│   └── list-pages/                            # NEW (Phase 40)
│       ├── ListPageShell.tsx                  # chrome: PageHead + Toolbar + body slot + skeleton + empty
│       ├── ListPageShell.skeleton.tsx         # shape-matched skeleton variants
│       ├── GenericListPage.tsx                # row strip variant for forums/topics/working-groups
│       ├── DossierTable.tsx                   # countries/organizations table body
│       ├── PersonsGrid.tsx                    # persons card grid body
│       ├── EngagementsList.tsx                # engagements: search + pills + week-list + load-more
│       ├── FilterPill.tsx                     # shared filter pill (handoff pages.jsx:19-25)
│       ├── ToolbarSearch.tsx                  # `.tb-search` input wrapper
│       └── index.ts                           # barrel
├── hooks/
│   ├── useCountries.ts                        # NEW Supabase adapter (D-11)
│   ├── useOrganizations.ts                    # NEW Supabase adapter (D-11)
│   └── useEngagementsInfinite.ts              # NEW useInfiniteQuery adapter
├── routes/_protected/
│   ├── dossiers/
│   │   ├── countries/index.tsx                # REPLACE body
│   │   ├── organizations/index.tsx            # REPLACE body
│   │   ├── forums/index.tsx                   # REPLACE body
│   │   ├── topics/index.tsx                   # REPLACE body
│   │   └── working_groups/index.tsx           # REPLACE body
│   ├── persons/index.tsx                      # KEEP (delegates to PersonsListPage)
│   └── engagements/index.tsx                  # KEEP (delegates to EngagementsListPage)
└── pages/
    ├── persons/PersonsListPage.tsx            # REPLACE body
    └── engagements/EngagementsListPage.tsx    # REPLACE body

frontend/public/locales/
├── en/                                         # CREATE all 8
│   ├── countries.json
│   ├── organizations.json
│   ├── persons.json
│   ├── forums.json
│   ├── topics.json
│   ├── working-groups.json
│   ├── engagements.json
│   └── list-pages.json                         # shared chrome strings
└── ar/                                         # CREATE all 8 (parity)
    └── (same files)
```

### Pattern 1: ListPageShell composition

**What:** Single chrome component consumed by all 4 body variants.
**When to use:** Every list page in Phase 40 (and Phase 42 candidates).
**Example (handoff `pages.jsx:3-26` reference):**

```tsx
// Source: handoff /tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx:3-12 (PageHead)
//         + lines 15-17 (Toolbar) + lines 19-25 (FilterPill)
type ListPageShellProps = {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  toolbar?: ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyState?: ReactNode
  skeleton?: ReactNode
  children: ReactNode
}

export function ListPageShell({
  title,
  subtitle,
  action,
  toolbar,
  isLoading,
  isEmpty,
  emptyState,
  skeleton,
  children,
}: ListPageShellProps) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <div className="page-sub">{subtitle}</div>}
        </div>
        {action}
      </div>
      {toolbar && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 'var(--gap)',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {toolbar}
        </div>
      )}
      {isLoading ? skeleton : isEmpty ? emptyState : children}
    </div>
  )
}
```

### Pattern 2: Thin adapter hook (Phase 38 D-08 precedent)

**What:** Wrap an existing repository or Supabase query with TanStack Query, exposing a stable hook interface for the page body.
**When to use:** All 3 new hooks: `useCountries`, `useOrganizations`, `useEngagementsInfinite`.
**Example (mirrors `frontend/src/hooks/useForums.ts:25-50`):**

```tsx
// Source: existing pattern in frontend/src/hooks/useForums.ts (verified)
export function useCountries(filters: { search?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['countries', filters],
    queryFn: async () => {
      const { search, page = 1, limit = 50 } = filters
      const offset = (page - 1) * limit
      let q = supabase
        .from('dossiers')
        .select('*', { count: 'exact' })
        .eq('type', 'country')
        .neq('status', 'deleted')
      if (search) q = q.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`)
      const { data, error, count } = await q
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (error) throw error
      return { items: data ?? [], total: count ?? 0 }
    },
    staleTime: 30_000,
  })
}
```

### Pattern 3: useInfiniteQuery for engagements (D-08 revised)

**What:** Wrap `engagementsRepo.getEngagements({ page, limit, sort_by, sort_order })` in `useInfiniteQuery` with offset-based `getNextPageParam`.
**When to use:** Engagements page only (LIST-04).

```tsx
// Source: synthesized from frontend/src/domains/engagements/hooks/useEngagements.ts:45-58
//         and TanStack Query useInfiniteQuery docs [CITED: tanstack.com/query]
import { useInfiniteQuery } from '@tanstack/react-query'
import { engagementsRepo } from '@/domains/engagements/repositories/engagements.repository'

export function useEngagementsInfinite(params: { search?: string; limit?: number } = {}) {
  const limit = params.limit ?? 20
  return useInfiniteQuery({
    queryKey: ['engagements-infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      engagementsRepo.getEngagements({
        page: pageParam,
        limit,
        sort_by: 'start_date',
        sort_order: 'desc',
        search: params.search,
      }),
    getNextPageParam: (lastPage, allPages) =>
      (lastPage.items?.length ?? 0) < limit ? undefined : allPages.length + 1,
    initialPageParam: 1,
    staleTime: 30_000,
  })
}
```

[ASSUMED] `engagementsRepo.getEngagements` returns `{ items: [...], total?: number }`. Planner must verify return shape against `engagements.repository.ts` and adjust `getNextPageParam` accordingly. Risk: low (offset pagination is forgiving).

### Anti-Patterns to Avoid

- **Don't compose HeroUI v3 Card/Chip/Table** — handoff CSS classes are the parity contract; using HeroUI primitives forces re-styling and breaks visual regression baselines.
- **Don't add `ml-*`/`mr-*`/`pl-*`/`pr-*`/`text-left`/`text-right`** — CLAUDE.md mandate; use logical properties (`ms-*`/`me-*`/`ps-*`/`pe-*`/`text-start`/`text-end`).
- **Don't `.reverse()` arrays for RTL** — `forceRTL` (and HTML `dir="rtl"`) handle direction.
- **Don't write `chevron-left` for "go deeper"** — RTL flips it; use the existing `.icon-flip` class (handoff `app.css:667`) which mirrors `chevron-right` via `transform: scaleX(-1)`.
- **Don't recreate `useEngagements`** — use `engagementsRepo` directly for the infinite variant; existing `useEngagements` in `domains/engagements/hooks/` stays untouched.
- **Don't touch legacy tables** (`AuditLogTable`, `SLAComplianceTable`, `ElectedOfficialListTable`, `AdvancedDataTable`, `SelectableDataTable`, `ResponsiveTable`, `EntityComparisonTable`, `DataTable`) — D-13 defers cleanup to Phase 43.
- **Don't add new dependencies** — every package needed is already installed.
- **Don't use unsafe HTML injection APIs anywhere in Phase 40** — React's default JSX escaping handles all dossier name fields safely; raw HTML insertion is forbidden.

## Don't Hand-Roll

| Problem            | Don't Build                         | Use Instead                                                                                       | Why                                                       |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Debounced search   | Custom `setTimeout` + `useRef`      | Existing `useDebouncedValue(value, 250)` if already in repo, else 8-line custom hook (acceptable) | Debouncing is trivial; no library needed                  |
| Infinite scroll    | IntersectionObserver wiring         | TanStack Query `useInfiniteQuery` + manual "Load more" button (handoff uses button, not observer) | Phase 40 explicitly uses button per handoff `LoadMoreRow` |
| Pagination state   | Custom React state for offset       | TanStack Query `useInfiniteQuery` `pageParam`                                                     | Cache + refetch handled                                   |
| Locale switching   | Custom i18n                         | `react-i18next` already wired                                                                     | Project-wide pattern                                      |
| RTL detection      | `useEffect` checking `document.dir` | `useTranslation().i18n.language === 'ar'`                                                         | CLAUDE.md pattern                                         |
| Arabic digits      | Manual `.replace()` per call        | `toArDigits()` from `frontend/src/lib/i18n/toArDigits.ts`                                         | Already exists; tested                                    |
| Icon flipping      | Conditional `rotate-180` per icon   | `<Icon className="icon-flip"/>` + handoff `app.css:667` rule                                      | One CSS rule, RTL-aware globally                          |
| Skeleton primitive | Custom `animate-pulse` div          | Existing `@/components/ui/heroui-skeleton.tsx` wrapper                                            | Already a re-export wrapper                               |

**Key insight:** Phase 40 is a verbatim port — every "do it from scratch" temptation is a parity break. Reach for handoff CSS class, then existing hook/util, then last-resort new code.

## Runtime State Inventory

This phase is a UI rebuild — no rename/refactor/migration. Section omitted per researcher protocol.

## Common Pitfalls

### Pitfall 1: Misreading the route topology

**What goes wrong:** Planner creates new `_protected/topics.tsx` layout route per CONTEXT.md D-03; or creates new `index.tsx` files per D-02 thinking the existing `countries.tsx` etc. are `<Outlet/>` shells.
**Why it happens:** CONTEXT.md was drafted assuming a layout/index split that doesn't exist. The actual list pages live under `_protected/dossiers/{type}/index.tsx`; the `_protected/{type}.tsx` files are 6-line redirects.
**How to avoid:** Replace bodies in the EXISTING `index.tsx` (or `PersonsListPage.tsx`/`EngagementsListPage.tsx`) files; do NOT add new layout routes.
**Warning signs:** Routegen produces duplicate route paths or "missing index" warnings.

### Pitfall 2: Using cursor pagination for engagements

**What goes wrong:** Builder writes `useInfiniteQuery` with cursor-based `getNextPageParam` per CONTEXT.md D-08; existing `engagementsRepo.getEngagements()` ignores cursor params and returns first page repeatedly.
**Why it happens:** CONTEXT.md D-08 says "cursor based on last `engagement_date`"; the actual repo has only `page`/`limit` parameters (verified at `frontend/src/domains/engagements/repositories/engagements.repository.ts:68-69, 246, 308, 329-330`).
**How to avoid:** Use offset-based pagination (`pageParam = 1`, increment by 1, stop when `items.length < limit`).
**Warning signs:** Load-more button keeps loading the same engagements.

### Pitfall 3: Calling `i18next.t()` with missing namespace

**What goes wrong:** `useTranslation('countries')` returns string keys verbatim because `countries.json` doesn't exist in `frontend/public/locales/{en,ar}/`.
**Why it happens:** CONTEXT.md `<canonical_refs>` lists the namespaces as "existing" but they don't.
**How to avoid:** Wave 0 task creates all 8 namespace files (`countries`, `organizations`, `persons`, `forums`, `topics`, `working-groups`, `engagements`, `list-pages`) × LTR+AR before Wave 1 pages start.
**Warning signs:** Page renders raw keys like `engagements.title` instead of "Engagements" / "المشاركات".

### Pitfall 4: `sensitivity_level` is numeric, not string

**What goes wrong:** Builder writes `r.sens === 'restricted'` per handoff `pages.jsx:283`; reality is `sensitivity_level: number (1-4)`.
**Why it happens:** Handoff demo data uses string sensitivity; Supabase schema uses numeric tier.
**How to avoid:** Map `sensitivity_level` numeric → string label in chip render: `1 → 'public' (no chip class)`, `2 → 'internal' (no chip class)`, `3 → 'restricted' (chip-warn)`, `4 → 'confidential' (chip-danger)`. Confirm tier semantics with backend before coding.
**Warning signs:** All sensitivity chips render without color, or render `[object Object]`.

### Pitfall 5: Forgetting `icon-flip` on chevrons

**What goes wrong:** Builder hand-rolls `rotate-180` Tailwind class on chevrons; misses some, RTL renders inconsistently.
**Why it happens:** Handoff `app.css:667` rule (`html[dir="rtl"] .icon-flip { transform: scaleX(-1) }`) is the canonical mirror; using ad-hoc Tailwind breaks the contract.
**How to avoid:** Every chevron = `<Icon name="chevron-right" className="icon-flip" size={14}/>` per handoff `pages.jsx:284, 626`.
**Warning signs:** Some chevrons mirror, others don't.

### Pitfall 6: AR locale snapshots failing on font-loading race

**What goes wrong:** Playwright AR baseline captures snapshot before Tajawal loads; minor pixel deltas exceed 2% maxDiffPixelRatio.
**Why it happens:** `i18n.changeLanguage('ar')` triggers font swap.
**How to avoid:** Wait for `document.fonts.ready` + 200ms before screenshotting (Phase 38 precedent — verify in `frontend/tests/e2e/visual-regression/`).
**Warning signs:** Flaky AR baselines.

## Code Examples

### Example 1: DossierTable row (LIST-01)

```tsx
// Source: handoff /tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx:275-286
//         CSS: handoff app.css:260-265 (.tbl), 245-250 (.chip*), 667 (.icon-flip)
<table className="tbl">
  <thead>
    <tr>
      <th>{t('countries:columns.name')}</th>
      <th>{t('countries:columns.code')}</th>
      <th>{t('countries:columns.nameAr')}</th>
      <th>{t('countries:columns.engagements')}</th>
      <th>{t('countries:columns.lastUpdated')}</th>
      <th>{t('countries:columns.sensitivity')}</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {rows.map((r) => (
      <tr
        key={r.id}
        style={{ cursor: 'pointer' }}
        onClick={() => navigate({ to: `/dossiers/countries/${r.id}` })}
      >
        <td style={{ fontWeight: 500 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <DossierGlyph flag={r.iso_code} type="country" size={18} /> {r.name_en}
          </span>
        </td>
        <td className="mono" style={{ color: 'var(--ink-mute)' }}>
          {r.iso_code}
        </td>
        <td
          style={{
            color: 'var(--ink-mute)',
            direction: 'rtl',
            fontFamily: "'Tajawal', var(--font-body), system-ui, sans-serif",
          }}
        >
          {r.name_ar}
        </td>
        <td>
          <span className="mono">{isAr ? toArDigits(r.engagement_count) : r.engagement_count}</span>
        </td>
        <td className="mono" style={{ color: 'var(--ink-mute)' }}>
          {formatLastTouch(r.updated_at, isAr)}
        </td>
        <td>
          <span className={`chip ${sensitivityChipClass(r.sensitivity_level)}`}>
            {t(`countries:sensitivity.${sensitivityLabel(r.sensitivity_level)}`)}
          </span>
        </td>
        <td style={{ textAlign: 'end' }}>
          <Icon name="chevron-right" size={14} className="icon-flip" />
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Example 2: PersonsGrid card (LIST-02)

```tsx
// Source: handoff pages.jsx:572-590, dashboard.png card aesthetic distillation
<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'var(--gap)',
  }}
>
  {people.map((p) => (
    <div
      key={p.id}
      className="card"
      style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer' }}
      onClick={() => navigate({ to: `/persons/${p.id}` })}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--accent-soft)',
          color: 'var(--accent-ink)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {initials(p.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 14 }}
        >
          <DossierGlyph flag={p.flag} type="person" size={18} /> {p.name}
          {p.is_vip && <span className="chip chip-accent">{t('persons:vip')}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>{p.role}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
          {p.organization_name}
        </div>
      </div>
    </div>
  ))}
</div>
```

### Example 3: EngagementsList — toolbar + filter pills (LIST-04)

```tsx
// Source: handoff pages.jsx:45-55 (Toolbar) + 19-25 (FilterPill)
<Toolbar>
  <div className="tb-search" style={{ flex: '0 1 320px' }}>
    <Icon name="search" size={14} />
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder={t('engagements:search.placeholder')}
    />
  </div>
  <FilterPill
    label={t('engagements:filters.all')}
    active={filter === 'all'}
    onClick={() => setFilter('all')}
    count={counts.all}
  />
  <FilterPill
    label={t('engagements:filters.confirmed')}
    active={filter === 'confirmed'}
    onClick={() => setFilter('confirmed')}
    count={counts.confirmed}
  />
  <FilterPill
    label={t('engagements:filters.travel')}
    active={filter === 'travel'}
    onClick={() => setFilter('travel')}
    count={counts.travel}
  />
  <FilterPill
    label={t('engagements:filters.pending')}
    active={filter === 'pending'}
    onClick={() => setFilter('pending')}
    count={counts.pending}
  />
  <span style={{ marginInlineStart: 'auto', fontSize: 12, color: 'var(--ink-mute)' }}>
    {isAr ? toArDigits(rows.length) : rows.length} {t('list-pages:shownCount')}
  </span>
</Toolbar>
```

### Example 4: LoadMoreRow with GlobeSpinner (LIST-04)

```tsx
// Source: handoff pages.jsx:90-111
function LoadMoreRow({ onClick, isFetching }: { onClick: () => void; isFetching: boolean }) {
  if (isFetching) {
    return (
      <div
        className="spinner-row"
        style={{ justifyContent: 'center', borderTop: '1px solid var(--line-soft)' }}
      >
        <GlobeSpinner size={16} />
        <span>{t('engagements:loadMore.loading')}</span>
      </div>
    )
  }
  return (
    <button
      className="spinner-row"
      onClick={onClick}
      style={{
        justifyContent: 'center',
        borderTop: '1px solid var(--line-soft)',
        width: '100%',
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        minHeight: 44,
      }}
    >
      {t('engagements:loadMore.label')}
    </button>
  )
}
```

### Example 5: GenericListPage row (LIST-03)

```tsx
// Source: handoff pages.jsx:619-628
<div className="forums-list">
  {rows.map((r) => (
    <div
      key={r.id}
      className="forum-row"
      style={{ gridTemplateColumns: '1fr auto auto', minHeight: 44, cursor: 'pointer' }}
      onClick={() => navigate({ to: `/dossiers/${routeSegment}/${r.id}` })}
    >
      <div>
        <div className="forum-name">{r.name_en /* or name per locale */}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{r.metaLine}</div>
      </div>
      <span className={`chip ${chipClassForStatus(r.status)}`}>
        {t(`${ns}:status.${r.status}`)}
      </span>
      <Icon name="chevron-right" size={14} className="icon-flip" />
    </div>
  ))}
</div>
```

## State of the Art

| Old Approach                              | Current Approach                                                                                    | When Changed       | Impact                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `useState` + manual offset for pagination | `useInfiniteQuery` with `pageParam`                                                                 | TanStack Query v4+ | Built-in cache + refetch + dedup [VERIFIED: tanstack.com/query/v5/docs/framework/react/guides/infinite-queries] |
| `react-window`/`react-virtualized`        | Native scroll for lists ≤200 rows; load-more button                                                 | —                  | Phase 40 lists ≤50 visible, no virtualization needed                                                            |
| `dir="rtl"` polyfills                     | Native CSS logical properties (`margin-inline-start`, `border-inline-end`, `text-align: start/end`) | Baseline 2022      | Universally supported [CITED: handoff app.css:312, 322 already uses logical properties]                         |
| Custom RTL flip per icon                  | Single `[dir="rtl"] .icon-flip { transform: scaleX(-1) }` rule                                      | —                  | One CSS rule, app-wide [VERIFIED: handoff app.css:667]                                                          |

**Deprecated/outdated:**

- Cursor pagination via `engagement_date` — not supported by existing repo; offset is the path of least resistance.
- Separate `<CountriesPage>` + `<OrganizationsPage>` files — handoff uses single `DossierListPage({ kind })`; mirror that with shared `<DossierTable>` body.

## Architecture-specific Resolutions (Researcher Locks)

The 15 numbered questions from the additional_context, answered:

### 1. Handoff JSX/CSS line ranges

**`pages.jsx` page bodies (verbatim port targets):**

| Page              | JSX Lines | Notes                                                                                                                                 |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `EngagementsPage` | 28-86     | search + 4 filter pills + week-list + LoadMoreRow                                                                                     |
| `LoadMoreRow`     | 90-111    | `.spinner-row` + `<GlobeSpinner size={16}/>` + bilingual loading text                                                                 |
| `DossierListPage` | 238-292   | Single component for both Countries (`kind='countries'`) and Organizations (`kind='organizations'`); table with 6-7 columns + chevron |
| `PersonsPage`     | 562-590   | Card grid `repeat(auto-fill, minmax(280px, 1fr))`                                                                                     |
| `GenericListPage` | 594-633   | Row strip used by Forums/Topics/Working-Groups via `kind` prop                                                                        |
| `PageHead`        | 3-12      | Shared header (title + sub + action)                                                                                                  |
| `Toolbar`         | 15-17     | Shared `display:flex` toolbar wrapper                                                                                                 |
| `FilterPill`      | 19-25     | `.btn` toggling `.btn-primary` when active                                                                                            |

**`app.css` rules (verbatim port targets):**

| Rule                                                                                                                                                        | Lines                               | Purpose                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------- |
| `.tb-search`, `.tb-search input`, `.tb-search input::placeholder`                                                                                           | 115-117                             | Toolbar search input wrapper      |
| `.btn`, `.btn-primary`                                                                                                                                      | 222-228                             | Filter pill base + active state   |
| `.card`                                                                                                                                                     | 233                                 | Persons card + table card wrapper |
| `.chip`, `.chip-accent`, `.chip-danger`, `.chip-warn`, `.chip-ok`, `.chip-info`                                                                             | 245-250                             | Status/sensitivity chips          |
| `table.tbl`, `.tbl th`, `.tbl td`, `.tbl tr:last-child td`, `.tbl tr:hover td`                                                                              | 260-265                             | DossierTable body                 |
| `.week-list`, `.week-row`, `.week-date`, `.week-day`, `.week-dd`, `.week-time`, `.week-body`, `.week-title`, `.week-meta`, `.week-meta .sep`, `.week-right` | 309-322                             | Engagements week-list body        |
| `.forums-list`, `.forum-row`, `.forum-row:last-child`, `.forum-name`                                                                                        | 435-440                             | GenericListPage row strip         |
| `.empty-hint`, `.empty-hint .sub`                                                                                                                           | 457-458                             | Shared empty state                |
| `html[dir="rtl"] .icon-flip { transform: scaleX(-1) }`                                                                                                      | 667                                 | Chevron mirror for RTL            |
| `.page`, `.page-head`, `.page-title`, `.page-sub`                                                                                                           | 201-208                             | Page chrome shared by all 7 pages |
| `.spinner-row` (referenced — verify exact line)                                                                                                             | ~625-660 (approximate, not in grep) | LoadMoreRow base                  |

**ACTION FOR PLANNER:** Wave 0 task includes copying all listed CSS rules into `frontend/src/styles/list-pages.css` (or extending Phase 33 token CSS) so handoff classes are available app-wide. Verify `.spinner-row` exact CSS lines during Wave 0.

### 2. Persons card tokens (LIST-02)

Distilled from handoff `.card` rule (`app.css:233`) + dashboard.png matched cards:

| Property        | Value                                                                  | Source                   |
| --------------- | ---------------------------------------------------------------------- | ------------------------ |
| Background      | `var(--surface)`                                                       | `app.css:233`            |
| Border          | `1px solid var(--line)`                                                | `app.css:233`            |
| Border-radius   | `var(--radius)` (Phase 33 token)                                       | `app.css:233`            |
| Padding         | `var(--pad)` (Phase 33 token)                                          | `app.css:233`            |
| Shadow          | None default; rely on border (matches dashboard.png subtle aesthetic)  | dashboard.png inspection |
| Internal layout | `display:flex; gap:14px; align-items:center`                           | `pages.jsx:577`          |
| Avatar size     | `width:44; height:44; borderRadius:50%`                                | `pages.jsx:578`          |
| Avatar bg       | `var(--accent-soft)`                                                   | `pages.jsx:578`          |
| Avatar fg       | `var(--accent-ink)`                                                    | `pages.jsx:578`          |
| Avatar font     | `var(--font-display)`, weight 600, size 16                             | `pages.jsx:578`          |
| Name font       | weight 500, size 14                                                    | `pages.jsx:582`          |
| Role font       | size 12, color `var(--ink-mute)`, marginTop 2                          | `pages.jsx:583`          |
| Org font        | size 11, color `var(--ink-faint)`, marginTop 2                         | `pages.jsx:584`          |
| VIP chip        | `.chip.chip-accent` (only when `is_vip === true`)                      | `pages.jsx:582`          |
| Glyph size      | 18                                                                     | `pages.jsx:582`          |
| Grid gap        | `var(--gap)` (Phase 33 token)                                          | `pages.jsx:575`          |
| Min card width  | 280px (`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`) | `pages.jsx:575`          |

[VERIFIED: handoff source]

### 3. `useCountries` + `useOrganizations` repository methods (D-11)

**Finding:** No `frontend/src/domains/countries/` or `frontend/src/domains/organizations/` directories exist [VERIFIED: `find frontend/src/domains/`]. Countries and Organizations are stored in the unified `dossiers` table with `type IN ('country', 'organization')`, accessed via direct Supabase queries (mirroring `useForums.ts:25-50` and `useWorkingGroups.ts:62`).

**Recommended adapter pattern** (mirrors `useForums`):

- New file: `frontend/src/hooks/useCountries.ts`
- Query: `supabase.from('dossiers').select('*', { count: 'exact' }).eq('type', 'country').neq('status', 'deleted')`
- Filters: `search` → `.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`)` (verify column names against `dossiers` schema)
- Sort: `.order('updated_at', { ascending: false })` (driving the "Last updated" column)
- Pagination: offset via `.range(offset, offset + limit - 1)`
- TanStack Query options: `staleTime: 30_000`, `gcTime: 5 * 60_000` (mirrors `useEngagements.ts:54-55`)
- Cache key: `['countries', filters]`
- Return shape: `{ items: Dossier[]; total: number }` (mirrors `useForums` `ForumListResponse`)

**Identical pattern for `useOrganizations.ts`** with `eq('type', 'organization')`.

[VERIFIED: existing pattern in `frontend/src/hooks/useForums.ts` and `useWorkingGroups.ts`]

[ASSUMED] Column names `name_en`, `name_ar`, `iso_code`, `engagement_count` exist on `dossiers`. Planner verifies via `dossier-api.ts` types or direct Supabase MCP query before Wave 0 hook implementation.

### 4. Sensitivity chip + last-touch column mapping (D-12)

**Last-touch column:** `dossiers.updated_at` (`timestamptz`). [VERIFIED: pervasive in `dossier-api.ts`]. Format with `Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })` for EN; Arabic-Indic digits via `toArDigits` for AR. Phase 41 may swap to `last_engagement_at` if such a column is added; not required for Phase 40.

**Sensitivity chip:** `dossiers.sensitivity_level: number (1-4)` [VERIFIED: `dossier-api.ts:345, 358, 367`, `dossier-search.types.ts:24`, `forum.types.ts:56`, `retention-policy.types.ts:64,102` (comment confirms `1-4` range)].

**Recommended numeric → label/chip class mapping** (planner confirms with backend / existing UI before locking):

| Level | Label key                  | Chip class          | Color intent |
| ----- | -------------------------- | ------------------- | ------------ |
| 1     | `sensitivity.public`       | `chip` (no variant) | Neutral      |
| 2     | `sensitivity.internal`     | `chip` (no variant) | Neutral      |
| 3     | `sensitivity.restricted`   | `chip-warn`         | Amber        |
| 4     | `sensitivity.confidential` | `chip-danger`       | Red          |

[ASSUMED] 4-tier semantics. Risk: Mid (existing UI elsewhere may render different labels; planner runs `grep -rn "sensitivity_level" frontend/src` to find existing label mapping, e.g., in `dossier-search.types.ts` or any retention-policy UI, and reuses).

### 5. Engagements pagination column (D-08) — REVISED

**Finding:** `engagementsRepo.getEngagements()` accepts `{ page, limit, sort_by, sort_order, search, ... }` (offset-based). [VERIFIED: `frontend/src/domains/engagements/repositories/engagements.repository.ts:68-69, 308, 329-330`]. **No cursor support.** D-08 must be implemented as offset pagination, not cursor pagination.

**Recommended sort:** `sort_by: 'start_date', sort_order: 'desc'`. The engagement entity has `start_date` and `end_date` fields [VERIFIED: `engagement.types.ts:230-231, 280-281`]. There is no `engagement_date` column — CONTEXT.md guess was wrong.

[ASSUMED] Backend default sort matches the handoff's chronological week-list display when sorted by `start_date desc`. Risk: low.

### 6. Filter pill active styling anatomy

| State    | Class              | Style                                                                                                                                      |
| -------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Inactive | `.btn`             | `padding:5px 12px; fontSize:12; background:var(--surface); border:1px solid var(--line); color:var(--ink); border-radius:var(--radius-sm)` |
| Active   | `.btn.btn-primary` | Above + `background:var(--ink); color:var(--surface); border-color:var(--ink)`                                                             |

[VERIFIED: handoff `pages.jsx:21` (inline padding/fontSize) + `app.css:222-225` (base + primary)]

**Note:** CONTEXT.md's "uses `--accent`/`--accent-soft`" claim is INCORRECT for the bureau direction handoff ships. The active pill uses `--ink` background. The `--accent`-based override only applies to `dir-situation` and `dir-chancery` directions (`app.css:226, 228`). Phase 40 ships bureau direction, so `--ink` is correct. Planner should verify Phase 33 / Phase 36 actually loaded the bureau direction class on `<html>`.

### 7. Engagement row click target (D-10)

**Target route:** `/engagements/$engagementId/overview`.

[VERIFIED: `frontend/src/routes/_protected/dossiers/engagements/$id.tsx:18-20` redirects `/dossiers/engagements/$id` → `/engagements/$engagementId/overview`. The canonical detail surface is the engagement workspace at `/engagements/$engagementId/overview`.]

Use `useNavigate()`: `navigate({ to: '/engagements/$engagementId/overview', params: { engagementId: row.id } })`.

### 8. `toArDigits` utility location

`frontend/src/lib/i18n/toArDigits.ts` [VERIFIED: file exists; tested at `frontend/src/lib/i18n/__tests__/toArDigits.test.ts`; in active use at `frontend/src/components/calendar/WeekListMobile.tsx`, `CalendarMonthGrid.tsx`, `frontend/src/pages/WorkBoard/KCard.tsx`].

Import: `import { toArDigits } from '@/lib/i18n/toArDigits'`.

Apply to: engagement counts, last-touch dates, week-list dates, and any numeric in AR locale (`isAr ? toArDigits(value) : value`).

### 9. Existing entity hooks contracts

| Hook               | File                                                                        | Return shape                                                         | Pagination                                                  | Notes                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `useEngagements`   | `frontend/src/hooks/useEngagements.ts` (re-exports `@/domains/engagements`) | `EngagementListResponse` (page-based)                                | `{ page, limit, sort_by, sort_order, search }` via REST API | NOT for the infinite list — wrap `engagementsRepo.getEngagements` in new `useEngagementsInfinite`                                       |
| `useForums`        | `frontend/src/hooks/useForums.ts`                                           | `ForumListResponse` (`{ items, total, page, limit }` shape inferred) | offset (`page`/`limit`) via Supabase `.range()`             | Direct Supabase `from('dossiers').eq('type','forum').neq('status','deleted')` [VERIFIED]                                                |
| `useTopics`        | `frontend/src/hooks/useTopics.ts` (re-exports `@/domains/topics`)           | (verify in domain)                                                   | (verify)                                                    | File is 4-line re-export only; planner inspects `@/domains/topics` for actual signature                                                 |
| `useWorkingGroups` | `frontend/src/hooks/useWorkingGroups.ts`                                    | (similar to `useForums`)                                             | offset via Supabase                                         | Direct `from('dossiers').eq('type','working_group')` [VERIFIED via grep — uses `from('dossiers')` + `from('working_groups')` for joins] |
| `usePersons`       | `frontend/src/hooks/usePersons.ts`                                          | (verify in domain)                                                   | (verify)                                                    | Re-export expected; planner inspects `@/domains/persons`                                                                                |

**ACTION FOR PLANNER:** Wave 0 first task = "Inspect each existing hook's exact return shape" — produce a 1-page contract sheet so adapter integration is mechanical.

### 10. Existing `<Outlet/>` layout routes

| File                                                                                                       | Type                                             | Body                                                   |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| `frontend/src/routes/_protected/countries.tsx`                                                             | Redirect                                         | `redirect({ to: '/dossiers/countries' })` [VERIFIED]   |
| `frontend/src/routes/_protected/organizations.tsx`                                                         | Redirect                                         | (assume same pattern; verify)                          |
| `frontend/src/routes/_protected/forums.tsx`                                                                | Redirect                                         | `redirect(...)` [VERIFIED via head]                    |
| `frontend/src/routes/_protected/working-groups.tsx`                                                        | Redirect                                         | `redirect(...)` [VERIFIED via head]                    |
| `frontend/src/routes/_protected/topics.tsx`                                                                | DOES NOT EXIST                                   | —                                                      |
| `frontend/src/routes/_protected/persons.tsx`                                                               | Layout (`<Outlet/>`)                             | "Persons Layout Route" comment [VERIFIED via head]     |
| `frontend/src/routes/_protected/engagements.tsx`                                                           | Layout (`<Outlet/>`)                             | "Engagements Layout Route" comment [VERIFIED via head] |
| `frontend/src/routes/_protected/dossiers/{countries,organizations,forums,topics,working_groups}/index.tsx` | List page (266-300 lines each)                   | EXISTING FULL IMPLEMENTATIONS [VERIFIED via wc -l]     |
| `frontend/src/routes/_protected/persons/index.tsx`                                                         | Stub → `@/pages/persons/PersonsListPage`         | EXISTS (14 lines) [VERIFIED]                           |
| `frontend/src/routes/_protected/engagements/index.tsx`                                                     | Stub → `@/pages/engagements/EngagementsListPage` | EXISTS (14 lines) [VERIFIED]                           |

**Decision:** Phase 40 work is REPLACEMENT of bodies in existing files:

- `_protected/dossiers/countries/index.tsx` ← new DossierTable consumer
- `_protected/dossiers/organizations/index.tsx` ← new DossierTable consumer
- `_protected/dossiers/forums/index.tsx` ← new GenericListPage consumer
- `_protected/dossiers/topics/index.tsx` ← new GenericListPage consumer
- `_protected/dossiers/working_groups/index.tsx` ← new GenericListPage consumer
- `frontend/src/pages/persons/PersonsListPage.tsx` ← new PersonsGrid consumer
- `frontend/src/pages/engagements/EngagementsListPage.tsx` ← new EngagementsList consumer

**No new layout routes required.** `_protected/topics.tsx` does not need creation.

### 11. Locale namespace state

| Namespace                                 | EN file exists? | AR file exists? | Action |
| ----------------------------------------- | --------------- | --------------- | ------ |
| `countries.json`                          | NO              | NO              | CREATE |
| `organizations.json`                      | NO              | NO              | CREATE |
| `persons.json`                            | NO              | NO              | CREATE |
| `forums.json`                             | NO              | NO              | CREATE |
| `topics.json`                             | NO              | NO              | CREATE |
| `working-groups.json`                     | NO              | NO              | CREATE |
| `engagements.json`                        | NO              | NO              | CREATE |
| `list-pages.json` (shared chrome strings) | NO              | NO              | CREATE |

[VERIFIED: `ls frontend/public/locales/{en,ar}/` shows none of the 7 entity namespaces exist. Existing namespaces: activity, admin, ai-admin, ai-brief, ai-chat, ai-interactions, calendar, commitments, deliverables, dossier-context, dossier-dashboard, dossier-export, dossier-search, dossier, entity-linking, graph, intake, lifecycle, my-work, operations-hub, preview-layouts, quickswitcher, relationship, themes, translation, unified-kanban, work-creation.]

**Recommended namespace contents (per entity):**

```jsonc
// countries.json (EN)
{
  "title": "Countries",
  "subtitle": "National entities with diplomatic relations",
  "createCta": "Create dossier",
  "search": { "placeholder": "Search countries…" },
  "columns": {
    "name": "Name",
    "code": "Code",
    "nameAr": "Name (Arabic)",
    "engagements": "Engagements",
    "lastUpdated": "Last updated",
    "sensitivity": "Sensitivity",
  },
  "sensitivity": {
    "public": "public",
    "internal": "internal",
    "restricted": "restricted",
    "confidential": "confidential",
  },
  "empty": {
    "title": "No countries yet",
    "sub": "Create the first country dossier to start tracking diplomatic engagements.",
  },
}
```

(Equivalent AR file with بالعربية translations; same structure.)

`list-pages.json` holds shared strings: `shownCount`, `loadingMore`, `loadMore`, `dossierCountSuffix`, etc.

### 12. Validation Architecture

See dedicated section below.

### 13. Size-limit budget delta

**Current size-limit config:** `frontend/.size-limit.json` [VERIFIED]

| Bucket                              | Current limit |
| ----------------------------------- | ------------- |
| Initial JS (entry)                  | 200 KB gzip   |
| React vendor                        | 50 KB gzip    |
| TanStack vendor                     | 80 KB gzip    |
| Total JS                            | 800 KB gzip   |
| signature-visuals/d3-lazy-chunk     | 100 KB gzip   |
| signature-visuals/static-primitives | 15 KB gzip    |

**Estimated Phase 40 delta** (gzip):

| Asset                                                                                                                                             | Estimated +KB                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `ListPageShell` + `GenericListPage` + `FilterPill` + `Toolbar` + `LoadMoreRow` + `PageHead`                                                       | ~3 KB                                   |
| `DossierTable`                                                                                                                                    | ~2 KB                                   |
| `PersonsGrid`                                                                                                                                     | ~2 KB                                   |
| `EngagementsList` (incl. week-list grouping logic)                                                                                                | ~4 KB                                   |
| `useCountries` + `useOrganizations` + `useEngagementsInfinite` adapters                                                                           | ~1 KB                                   |
| 8 locale namespace JSON × 2 langs (lazy-loaded by i18next, NOT in entry chunk; budget impact only if eagerly imported)                            | ~0 KB to entry; ~1-2 KB per route chunk |
| 7 page entry replacements (route-level chunks; net delta vs. existing 266-300 line implementations should be NEGATIVE since new pages are leaner) | ~−5 to +3 KB                            |

**Net estimate: +5 to +10 KB gzip to Total JS bucket.** Recommend bumping `Total JS` from 800 KB to **815 KB** as a safety margin; leave Initial JS at 200 KB (route chunks are lazy-loaded by TanStack Router file-based routing).

**Action for Wave 0:** `pnpm build && pnpm size` baseline run before code changes; re-run after Wave 1 to measure actual delta and adjust.

### 14. Existing `ui/table.tsx` primitive contract

[VERIFIED: file inspected]

| Export                                                                    | Signature                                   | Notes                                                                                                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `TableContainer`                                                          | `(props: HTMLAttributes<HTMLDivElement>)`   | Wrapper with `w-full overflow-x-auto scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0`; provides horizontal scroll fallback for narrow viewports |
| `Table`                                                                   | `(props: HTMLAttributes<HTMLTableElement>)` | Base `<table>` element                                                                                                                    |
| (likely) `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | Standard wrappers                           | Verify via full file read in Wave 0                                                                                                       |

**`DossierTable` composition:** Wrap with `<TableContainer>` for mobile fallback; use raw `<table className="tbl">` inside (per handoff parity) instead of the Table wrapper's default classes — handoff `.tbl` styles override anyway. Alternatively, extend `Table` with `className="tbl"` if its default classes don't conflict.

### 15. HeroUI v3 vs custom decision per primitive

| Primitive                   | HeroUI v3 wrapper exists?                                                   | Decision                                                                                              | Rationale                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Card`                      | `frontend/src/components/ui/heroui-card.tsx` (re-export) [VERIFIED]         | **Use bespoke `<div className="card">`** per handoff `app.css:233`                                    | Handoff `.card` rule is the parity contract; existing wrapper renders as plain divs anyway, so no HeroUI dependency |
| `Chip` (Badge)              | `frontend/src/components/ui/heroui-chip.tsx` (re-export) [VERIFIED]         | **Use bespoke `<span className="chip chip-X">`** per handoff `app.css:245-250`                        | Same — handoff `.chip` + variants are the parity contract                                                           |
| `Skeleton`                  | `frontend/src/components/ui/heroui-skeleton.tsx` [VERIFIED]                 | **Use existing wrapper**                                                                              | Animate-pulse is generic; wrapper exposes shadcn-compatible API                                                     |
| `Input`                     | `frontend/src/components/ui/input.tsx` [VERIFIED] (raw `<input>` wrapper)   | **Use bespoke `<input>` inside `.tb-search` div** per handoff `app.css:115-117` and `pages.jsx:46-49` | Handoff `.tb-search` style requires the input to be inside a wrapper; raw `<input>` keeps the contract              |
| `Table`                     | `frontend/src/components/ui/table.tsx` [VERIFIED] (raw wrappers, no HeroUI) | **Compose on top with `className="tbl"`**                                                             | Handoff `.tbl` rules are the contract                                                                               |
| `Modal` (not used Phase 40) | `heroui-modal.tsx` exists                                                   | N/A                                                                                                   | Phase 41 dossier drawer                                                                                             |
| `Button`                    | `heroui-button.tsx` exists [VERIFIED]                                       | **Use bespoke `<button className="btn">` / `.btn-primary`** for filter pills + create CTA             | Handoff `.btn`/`.btn-primary` styles are the contract; using HeroUI Button forces re-styling                        |

**Summary:** Phase 40 leans heavily on bespoke primitives because the handoff CSS classes (`tbl`, `chip`, `card`, `tb-search`, `forum-row`, `week-list`, `btn`/`btn-primary`) are the verbatim parity contract. CLAUDE.md's HeroUI hierarchy is honored at the architectural level (HeroUI v3 wrappers exist for Card/Chip/Skeleton/Modal/Button/Tabs/Switch and are the canonical surface for NEW primitives) — but Phase 40 deliberately ports handoff classes in place per the verbatim-port discipline established by Phases 35/37/38/39. Document this exception in the page header comments so reviewers don't flag it.

## Validation Architecture

### Test Framework

| Property                  | Value                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Framework                 | Vitest (unit/integration) + Playwright (E2E + visual regression + axe a11y) [VERIFIED: `frontend/package.json` deps] |
| Config file               | `frontend/vitest.config.ts`, `frontend/playwright.config.ts` (planner verifies exact paths in Wave 0)                |
| Quick run command         | `pnpm --filter frontend test --run path/to/file.test.tsx` (Vitest)                                                   |
| Full suite command        | `pnpm --filter frontend test && pnpm --filter frontend e2e && pnpm --filter frontend size`                           |
| Visual regression command | `pnpm --filter frontend e2e -- --update-snapshots` (baseline) / `pnpm --filter frontend e2e --grep visual` (verify)  |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                                                  | Test Type                               | Automated Command                                                                  | File                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| LIST-01 | Countries table renders rows with glyph + EN/AR + count + last-touch + sensitivity chip + chevron         | unit (RTL render assertion)             | `pnpm --filter frontend test --run components/list-pages/DossierTable.test.tsx`    | `frontend/src/components/list-pages/__tests__/DossierTable.test.tsx` (Wave 0 creates) |
| LIST-01 | Chevron flips in RTL via `scaleX(-1)`                                                                     | E2E + computed-style assertion          | `pnpm --filter frontend e2e -- --grep "chevron RTL"`                               | `frontend/tests/e2e/list-pages/rtl-chevron.spec.ts`                                   |
| LIST-01 | Visual baseline LTR + AR @ 1280px                                                                         | Playwright `toHaveScreenshot`           | `pnpm --filter frontend e2e -- --grep "visual countries\|visual organizations"`    | `frontend/tests/e2e/list-pages/visual.spec.ts`                                        |
| LIST-02 | Persons grid renders cards with 44px avatar + glyph + VIP chip when `is_vip`                              | unit (RTL render)                       | `pnpm --filter frontend test --run components/list-pages/PersonsGrid.test.tsx`     | `frontend/src/components/list-pages/__tests__/PersonsGrid.test.tsx`                   |
| LIST-02 | Visual baseline LTR + AR @ 1280px                                                                         | Playwright                              | (above) `--grep "visual persons"`                                                  | (above)                                                                               |
| LIST-03 | Forums/Topics/Working-Groups all render via `GenericListPage` with identical row markup                   | unit (3 render tests vs same component) | `pnpm --filter frontend test --run components/list-pages/GenericListPage.test.tsx` | `frontend/src/components/list-pages/__tests__/GenericListPage.test.tsx`               |
| LIST-03 | Visual baseline LTR + AR for all 3 pages                                                                  | Playwright                              | `--grep "visual forums\|visual topics\|visual working-groups"`                     | (above)                                                                               |
| LIST-04 | Search input debounces 250ms then filters                                                                 | unit (fake timers)                      | `pnpm --filter frontend test --run components/list-pages/EngagementsList.test.tsx` | `frontend/src/components/list-pages/__tests__/EngagementsList.test.tsx`               |
| LIST-04 | All 4 filter pills toggle and reflect counts                                                              | unit + E2E                              | `pnpm --filter frontend e2e -- --grep "engagements filter"`                        | `frontend/tests/e2e/list-pages/engagements-filters.spec.ts`                           |
| LIST-04 | Load-more button calls `fetchNextPage`; spinner appears during fetch                                      | E2E with mocked network                 | `pnpm --filter frontend e2e -- --grep "engagements load-more"`                     | `frontend/tests/e2e/list-pages/engagements-loadmore.spec.ts`                          |
| LIST-04 | LoadMoreRow shows `<GlobeSpinner>` + bilingual loading text                                               | unit                                    | (above EngagementsList test)                                                       | (above)                                                                               |
| LIST-04 | Visual baseline LTR + AR @ 1280px                                                                         | Playwright                              | `--grep "visual engagements"`                                                      | (above)                                                                               |
| All     | ≥44×44 px touch targets on rows/chips/buttons/inputs                                                      | E2E (assert `boundingBox()`)            | `pnpm --filter frontend e2e -- --grep "touch target"`                              | `frontend/tests/e2e/list-pages/touch-targets.spec.ts`                                 |
| All     | axe-core zero violations per page (LTR+AR)                                                                | Playwright + `@axe-core/playwright`     | `pnpm --filter frontend e2e -- --grep "a11y"`                                      | `frontend/tests/e2e/list-pages/a11y.spec.ts`                                          |
| All     | Logical properties only (no `ml/mr/pl/pr/text-left/text-right`)                                           | Lint rule                               | `pnpm --filter frontend lint` (extend ESLint config in Wave 0 if not enforced)     | (lint config)                                                                         |
| All     | size-limit gate passes                                                                                    | CI gate                                 | `pnpm --filter frontend size`                                                      | `frontend/.size-limit.json` (budget bumped per §13)                                   |
| All     | Click target navigates to detail route (per entity type, incl. engagements → `/engagements/$id/overview`) | E2E                                     | `pnpm --filter frontend e2e -- --grep "click navigation"`                          | `frontend/tests/e2e/list-pages/navigation.spec.ts`                                    |

### Sampling Rate

- **Per task commit:** Vitest unit suite for the touched component (`pnpm --filter frontend test --run path/...`)
- **Per wave merge:** Full Vitest + Playwright smoke suite (skip visual regression to keep CI fast)
- **Phase gate:** Full suite green, including 14 visual baselines, axe-core zero violations, size-limit pass

### Wave 0 Gaps

- [ ] `frontend/src/components/list-pages/__tests__/DossierTable.test.tsx`
- [ ] `frontend/src/components/list-pages/__tests__/PersonsGrid.test.tsx`
- [ ] `frontend/src/components/list-pages/__tests__/GenericListPage.test.tsx`
- [ ] `frontend/src/components/list-pages/__tests__/EngagementsList.test.tsx`
- [ ] `frontend/src/components/list-pages/__tests__/ListPageShell.test.tsx`
- [ ] `frontend/tests/e2e/list-pages/visual.spec.ts` (14 baselines)
- [ ] `frontend/tests/e2e/list-pages/rtl-chevron.spec.ts`
- [ ] `frontend/tests/e2e/list-pages/engagements-filters.spec.ts`
- [ ] `frontend/tests/e2e/list-pages/engagements-loadmore.spec.ts`
- [ ] `frontend/tests/e2e/list-pages/touch-targets.spec.ts`
- [ ] `frontend/tests/e2e/list-pages/a11y.spec.ts`
- [ ] `frontend/tests/e2e/list-pages/navigation.spec.ts`
- [ ] ESLint rule for logical properties (extend `frontend/eslint.config.*` if not present — verify in Wave 0)
- [ ] `frontend/.size-limit.json` Total JS budget bumped to 815 KB

### Visual regression baseline strategy

- **Viewport:** 1280 × 800 px (Phase 38 D-13 precedent)
- **Snapshots:** 14 total = 7 pages × {LTR, AR}
- **Tolerance:** `maxDiffPixelRatio: 0.02` (2%)
- **Pre-screenshot stabilization:** await `document.fonts.ready`, then `page.waitForTimeout(200)` to allow Tajawal swap to settle in AR
- **Storage:** `frontend/tests/e2e/list-pages/visual.spec.ts-snapshots/`
- **Update workflow:** `pnpm e2e -- --update-snapshots` (manual baseline update only when intentional changes)

### axe-core enforcement

- **Rules:** Default `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `best-practice` rule sets (per `@axe-core/playwright` defaults)
- **Threshold:** Zero violations per page (Phase 38 D-15)
- **Exclusions:** None for Phase 40
- **Coverage:** All 7 pages × {LTR, AR} = 14 axe runs

### Touch target enforcement

- **Targets to verify:** Each table row, each card, each filter pill, load-more button, search input, every chevron's clickable parent
- **Assertion:** `expect(await locator.boundingBox()).toMatchObject({ width: expect.toBeGreaterThanOrEqual(44), height: expect.toBeGreaterThanOrEqual(44) })`
- **Viewports:** 320 (mobile), 1280 (desktop) — covers worst case

## Environment Availability

Skipped — Phase 40 is a frontend code/config-only change with no new external dependencies. All tooling (`pnpm`, `node 20`, `vite`, `vitest`, `playwright`, `axe-core`, `size-limit`) verified available via `frontend/package.json`.

## Security Domain

Phase 40 is a list-page rendering layer; no auth/session/cryptography changes. Applicable ASVS items:

| ASVS Category         | Applies | Standard Control                                                                                                                                                                                                                                                                               |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no      | Routes already protected via `_protected` wrapper (Phase 36)                                                                                                                                                                                                                                   |
| V3 Session Management | no      | Existing Supabase session                                                                                                                                                                                                                                                                      |
| V4 Access Control     | partial | RLS enforces dossier visibility per `sensitivity_level`; Phase 40 must not bypass — every Supabase query goes through the authenticated `supabase` client (no service-role keys)                                                                                                               |
| V5 Input Validation   | yes     | Search input is client-only (no server side-effect); however, when passed to `supabase.from('dossiers').or(...)` the `search` value MUST be sanitized to prevent ILIKE-pattern injection — escape `%` and `_` before interpolating, OR use parameterized `.ilike()` with `%${escape(search)}%` |
| V6 Cryptography       | no      | None                                                                                                                                                                                                                                                                                           |

**Threat patterns specific to Phase 40:**

| Pattern                                                       | STRIDE                 | Mitigation                                                                                                                                                 |
| ------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ILIKE pattern injection via search input                      | Tampering              | Escape `%` and `_` in search value before `.or()` interpolation; pattern: `const safe = search.replace(/[%_]/g, '\\$&')`                                   |
| XSS via dossier `name_en`/`name_ar` rendered without escaping | Tampering              | React auto-escapes `{r.name}`; do NOT use any raw-HTML insertion API anywhere in Phase 40                                                                  |
| Sensitivity-level leakage to unauthorized users               | Information Disclosure | Trust RLS — server filters rows the user cannot see; do NOT add client-side filtering on `sensitivity_level` (it's a render hint, not a security boundary) |
| Visual-regression baselines committing real user data         | Information Disclosure | Use mock fixtures (NOT live Supabase data) for Playwright runs; ensure `.env.test` test user has only synthetic dossiers                                   |

## Assumptions Log

| #   | Claim                                                                                                                                                                                                             | Section                           | Risk if Wrong                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `dossiers` table has columns `name_en`, `name_ar`, `iso_code`, `engagement_count`, `updated_at`, `sensitivity_level`                                                                                              | Pattern 2, Example 1, §3, §4      | Mid — adapter hooks won't return expected fields; planner verifies via Supabase MCP `list_tables` or read `dossier-api.ts` types fully                         |
| A2  | `sensitivity_level: 1=public, 2=internal, 3=restricted (chip-warn), 4=confidential (chip-danger)`                                                                                                                 | §4, Code Example 1                | Mid — labels may differ from existing UI elsewhere; planner greps for prior usage and reuses the locked mapping                                                |
| A3  | `engagementsRepo.getEngagements()` returns `{ items, total }` shape                                                                                                                                               | Pattern 3                         | Low — adjusting `getNextPageParam` is mechanical                                                                                                               |
| A4  | Backend default sort for engagements list matches `start_date desc` chronological week-list display                                                                                                               | §5                                | Low — verifiable by inspecting one API response in Wave 0                                                                                                      |
| A5  | `useTopics` and `usePersons` (re-exported from `@/domains/`) follow the same paginated `{ items, total }` return shape as `useForums`                                                                             | §9                                | Mid — planner reads each domain's `index.ts` in Wave 0 and locks the contracts                                                                                 |
| A6  | Existing `_protected/{persons,engagements}.tsx` actually render `<Outlet/>` (not a redirect)                                                                                                                      | §10                               | Low — already verified via `head` showing layout-route comments                                                                                                |
| A7  | Phase 33 `--ink`, `--accent-soft`, `--accent-ink`, `--surface`, `--line`, `--line-soft`, `--ink-mute`, `--ink-faint`, `--font-display`, `--radius`, `--radius-sm`, `--pad`, `--gap` tokens are loaded on `<html>` | All Code Examples                 | Low — Phase 33 ships these; visible in Phase 36 AppShell                                                                                                       |
| A8  | `forceRTL` is NOT used in this app (CLAUDE.md `forceRTL` rules are React Native-specific); RTL handled via `<html dir="rtl">` only                                                                                | §"Common Pitfalls", Anti-Patterns | Low — verified pattern in `useTranslation().i18n.language === 'ar'` + `dir={isRTL ? 'rtl' : 'ltr'}`                                                            |
| A9  | `signature-visuals/index.ts` exports `<DossierGlyph>` accepting `flag` (string), `type` (entity type), `size` (number) and `<GlobeSpinner>` accepting `size` (number)                                             | All Code Examples                 | Low — Phase 37 ships these; planner verifies barrel exports in Wave 0                                                                                          |
| A10 | `engagement_count` exists as a denormalized column on `dossiers` (or is computed via a view)                                                                                                                      | LIST-01, §3                       | Mid — if not present, `useCountries`/`useOrganizations` must compute via a join + count subquery, OR the column reads `0` in Phase 40 (acceptable degradation) |

## Open Questions (RESOLVED)

1. **`engagement_count` column existence on `dossiers`**
   - What we know: Handoff renders `r.engagements` per row; `dossier-api.ts` shows `CountryExtension`/`OrganizationExtension` interfaces but exact engagement-count column not searched
   - What's unclear: Is there a denormalized `engagement_count` integer, or do we need to join `engagements` and aggregate?
   - **RESOLVED (2026-04-25):** Plan 02c Wave 0 verification task MUST run Supabase MCP `list_columns` (project `zkrcjzdemdmwhearhfgg`, table `dossiers`) to verify column existence. **Branching contract:** (a) if `engagement_count` column exists on `dossiers` → `useCountries`/`useOrganizations` read it directly via `.select('*')`; (b) if absent → Plan 02c creates a SQL view `dossier_engagement_counts` defined as `SELECT dossier_id, COUNT(*)::int AS engagement_count FROM engagements GROUP BY dossier_id` (applied via Supabase MCP), and the adapter hooks join via `.select('*, engagement_count:dossier_engagement_counts(engagement_count)')`. The adapter hooks normalize the result to a flat `engagement_count: number` field on every row regardless of branch. DossierTable consumes the flat field. Default `0` when null.

2. **`useTopics` and `usePersons` actual signatures**
   - What we know: Both are 4-line re-exports from `@/domains/{topics,persons}`
   - What's unclear: Pagination params, return shape, whether they query `dossiers` or have their own table
   - **RESOLVED (2026-04-25):** Plan 02c Wave 0 verification task MUST grep-verify `frontend/src/hooks/useTopics.ts` and `frontend/src/hooks/usePersons.ts`. **Locked default contract:** both return `{ data, isLoading, error }` mirroring `useForums.ts`. If actual return shape diverges, Plan 02c records the verified shape in its SUMMARY; Wave 1 plans 05 (Persons) and 07 (Topics) MUST adapt page bodies in their first task by reading the Plan 02c SUMMARY note. Page bodies use `data` for the rendered list and `isLoading` for the ListPageShell skeleton gate.

3. **`.spinner-row` exact CSS rule lines**
   - What we know: Class is referenced in handoff `pages.jsx:99, 106` for engagements load-more
   - What's unclear: Did not appear in our grep — exact lines and properties unverified
   - **RESOLVED (2026-04-25):** Plan 02c CSS port task copies `.spinner-row` verbatim from handoff `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` (executor runs `grep -n "\.spinner-row" /tmp/inteldossier-handoff/inteldossier/project/src/app.css` and copies the matching rule block). **Fallback canonical** (use only if grep returns 0 matches in handoff app.css): `.spinner-row { display: flex; align-items: center; gap: 12px; padding: 16px; min-height: 44px; border-top: 1px solid var(--line-soft); }`. Plan 02c records which branch was taken in its SUMMARY.

4. **`useDebouncedValue` import path**
   - **RESOLVED (2026-04-25):** Plan 02c Wave 0 verification task MUST run `grep -rn "useDebouncedValue" frontend/src/hooks/` to lock the exact path. **Branching contract:** (a) if `frontend/src/hooks/useDebouncedValue.ts` exists → primitives import from `@/hooks/useDebouncedValue` (default Plan 02a contract); (b) if absent → Plan 02c CREATES `frontend/src/hooks/useDebouncedValue.ts` using the standard 8-line pattern below, then primitives import from `@/hooks/useDebouncedValue`:
     ```ts
     import { useEffect, useState } from 'react'
     export function useDebouncedValue<T>(value: T, delayMs: number): T {
       const [debounced, setDebounced] = useState<T>(value)
       useEffect((): (() => void) => {
         const id = setTimeout((): void => setDebounced(value), delayMs)
         return (): void => clearTimeout(id)
       }, [value, delayMs])
       return debounced
     }
     ```

5. **Existing handoff CSS port location + `list-page/` vs `list-pages/` directory name**
   - **RESOLVED (2026-04-25):** Directory name LOCKED as **singular** `frontend/src/components/list-page/` per PATTERNS.md recommendation (matches React component naming convention — directory holds primitives, plural-named CSS file `list-pages.css` documents the cross-page concern). All Plan 02a/02b/02c paths and Wave 1 imports use singular `@/components/list-page`.

6. **`r.metaLine` / `r.status` field source for Forums/Topics/Working-Groups**
   - What we know: Handoff demo data has `meta` (e.g., `"Co-chair · 12 members"`) and `chip` (e.g., `"active"`) per row
   - What's unclear: Real `dossiers`-typed Forums/Topics/Working-Groups don't have `meta` or `chip` columns; the meta line must be composed from real fields (e.g., for working_groups: `${role} · ${memberCount} members`)
   - Recommendation: Wave 1 task per page — read existing detail page (`_protected/dossiers/{type}/$id.tsx`) for inspiration on what fields render as the meta line; lock per-entity meta-line composition formulas in PLAN.md.

## Sources

### Primary (HIGH confidence)

- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx` lines 1-639 — verbatim port targets (PageHead, Toolbar, FilterPill, EngagementsPage, LoadMoreRow, DossierListPage, PersonsPage, GenericListPage)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` lines 115-117, 201-208, 222-228, 233, 245-252, 260-265, 309-322, 435-440, 457-458, 667 — handoff styling
- `frontend/src/routes/_protected/` — actual route topology (verified file listings)
- `frontend/src/routes/_protected/dossiers/{countries,organizations,forums,topics,working_groups}/index.tsx` — existing list page implementations (verified via `wc -l`)
- `frontend/src/routes/_protected/{persons,engagements}/index.tsx` — stub pages (verified)
- `frontend/src/pages/{persons,engagements}/{Persons,Engagements}ListPage.tsx` — replacement targets
- `frontend/src/hooks/useForums.ts`, `useWorkingGroups.ts`, `useEngagements.ts` — existing hook patterns
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` lines 62, 68-69, 246, 308, 329-330 — engagements REST signature
- `frontend/src/services/dossier-api.ts` lines 27-28, 44-56, 345, 358, 367, 691 — dossier types and `sensitivity_level: number`
- `frontend/src/types/dossier-search.types.ts` line 24, `forum.types.ts` line 56, `retention-policy.types.ts` lines 64,102 — sensitivity numeric tier
- `frontend/src/lib/dossier-routes.ts` lines 12-21 — route segment mapping
- `frontend/src/lib/i18n/toArDigits.ts` — Arabic-Indic digit utility (verified path exists)
- `frontend/src/components/ui/table.tsx` — `Table` + `TableContainer` exports
- `frontend/.size-limit.json` — current bundle budget
- `frontend/package.json` lines 21-23, 124-125 — size-limit + @size-limit/file present
- `frontend/public/locales/{en,ar}/` directory listings — proves namespace files DO NOT exist

### Secondary (MEDIUM confidence)

- TanStack Query v5 `useInfiniteQuery` docs [CITED: tanstack.com/query/v5 — `getNextPageParam`, `pageParam`, `initialPageParam`]
- `.planning/REQUIREMENTS.md` lines 77-80, 186-189 — LIST-01..04 acceptance criteria
- `.planning/ROADMAP.md` lines 102, 267-277, 415, 433 — Phase 40 entry, success criteria, dependency on Phase 33/36/37

### Tertiary (LOW confidence)

- `engagement_count` denormalized column existence — assumption, planner verifies in Wave 0 (Open Question 1)
- `sensitivity_level` 4-tier label semantics — assumption, planner verifies via existing UI grep (Open Question on §4)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every package verified in `frontend/package.json`; no new deps
- Architecture: HIGH — handoff source extracted line-by-line; existing route topology verified via file listings
- Pitfalls: HIGH — pivotal corrections to CONTEXT.md (route topology + locale namespaces) caught by direct repo inspection
- Schema details (sensitivity, engagement_count, exact column names): MEDIUM — planner must verify via Supabase MCP in Wave 0 task #1 before adapter hooks are written
- Engagements repo contract: HIGH — repo file inspected, signature confirmed offset-based
- Validation architecture: HIGH — Phase 38 D-13/D-15 precedent reused; specific file paths laid out
- Bundle delta estimate: LOW — `+5 to +10 KB` is an educated guess; Wave 0 baseline + Wave 1 measurement will replace estimate with actuals

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (frontend stack stable; would only need refresh if Phase 41-43 introduce conflicting patterns)
