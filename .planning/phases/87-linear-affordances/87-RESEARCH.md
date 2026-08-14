# Phase 87: Linear Affordances - Research

**Researched:** 2026-07-07
**Domain:** React 19 / TanStack Router v5 UI affordances on an existing Linear design system — drawer paging, filter/display popovers, cmdk audit, empty states
**Confidence:** HIGH (every claim below verified by direct codebase read this session unless tagged otherwise)

## Summary

Phase 87 extends four existing component families; nothing is greenfield. The research question was the integration seams, and the headline findings are: **(1)** the 8 dossier list pages are NOT uniform — 5 share the Phase-40 `ListPageShell` + URL-search-param pattern, but persons/engagements keep search in local `useState`, elected-officials bypasses `ListPageShell` entirely, and kanban holds mode+search in local state — so F23/F24 must first normalize state-to-URL on 4 surfaces. **(2)** `useDossierDrawer` knows only `{dossier, dossierType}` URL params and the drawer mounts at the `_protected.tsx` layout level, above any list route — prev/next paging is net-new plumbing that needs a cross-tree channel (a Zustand store is the codebase-precedented choice; 5 stores already exist in `src/store/`). Critically, **no list page currently opens the drawer on row click** — all 8 navigate to full detail routes — so F23 changes row-click behavior, not just the drawer. **(3)** The ⌘K audit found 5 concretely dead/broken commands (all `?action=create|export` targets are consumed nowhere in the repo; `cmd-view-network` is a literal no-op on dossier routes; `nav-analytics` routes to `/dashboard` although `/analytics` exists), 3 advertised-but-unregistered key glyphs (⌘N/⇧⌘I/⇧⌘D), 8 silently-dead suggested-action ids, and zero EN/AR key drift (verified programmatically across all 7 phase namespaces). **(4)** `ListEmptyState` has ZERO consumers — the rich-empty-state infra exists but was never wired; all 8 core list pages render bare text.

The phase needs no new dependencies (locked by UI-SPEC Registry Safety): cmdk 1.1.1, @radix-ui/react-popover 1.1.15, zustand 5.0.13, and the Sheet/LtrIsolate primitives are already installed and token-wired.

**Primary recommendation:** Plan the phase as (Wave A) URL-state normalization + peek-list registry store, (Wave B) the four features on the normalized seams, with the F25 audit and F26 copy matrix as parallelizable content work. Use the Radix `ui/popover.tsx` wrapper for F24 (its `--color-popover` already maps to `--surface-3`).

<user_constraints>

## User Constraints (from 87-UI-SPEC.md — no CONTEXT.md exists this phase; the approved UI-SPEC is the authoritative contract)

### Locked Decisions (orchestrator session, 2026-07-07)

1. **F23 peek = augment `DossierDrawer`.** Extend `frontend/src/components/dossier/DossierDrawer/` + `frontend/src/hooks/useDossierDrawer.ts` — do NOT invent a parallel slide-over. Peek carries a `1 / 15` counter, up/down chevrons, and the existing "Open full dossier" action. Full-page route stays reachable.
2. **Surface scope = core set.** F23 + F24 apply to the 8 dossier-type list pages (countries, organizations, forums, engagements, topics, working-groups, persons, elected-officials) + the unified work-item / kanban list. **intake, commitments, positions, and mous lists are DEFERRED to a later phase.**
3. **F24 Display popover = full Linear Display.** Filter popover = which rows (chips + builder, live counts). Display popover (separate) = how arranged (grouping + ordering + property/column visibility). Live result counts where applicable.
4. **No new dependencies** (Registry Safety): no `shadcn add`, no third-party registries. If a primitive gap appears, STOP and ask.
5. All copywriting, color, typography, spacing, and interaction contracts in 87-UI-SPEC.md are locked (approved by gsd-ui-checker 2026-07-07, 5 PASS / 1 non-blocking FLAG).

### Claude's Discretion (explicitly delegated to planner by the UI-SPEC)

- Per-surface filter property sets for F24 ("status, type, priority, owner, date — per-surface set is planner scope")
- URL param schema for filter/display persistence ("planner decides param schema")
- Additional ⌘K commands beyond the minimum set ("planner may add more from `analyze-commands.ts` context patterns")

### Deferred Ideas (OUT OF SCOPE)

- intake / commitments / positions / mous list toolbars and peek behavior
- destructive actions of any kind ("Phase 87 ships no destructive actions")
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                      | Research Support                                                                                                                                                                                                                                                     |
| ------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AFF-01 | Open a list row in a right-peek panel with prev/next paging without leaving the list (F23)                       | §F23 seam map: `useDossierDrawer.ts` has no sibling knowledge (net-new plumbing); drawer mounts at `_protected.tsx:83`; Sheet `side="right" size="wide"` + `LtrIsolate` + `DrawerHead` insertion point all verified; pagination-total availability verified per hook |
| AFF-02 | Split Filter and Display popovers with live result counts on list pages (F24)                                    | §F24 seam map: `ActiveFiltersBar`/`useActiveFilters` reusable chips logic; URL-state divergence table for the 9 surfaces; facet-count patterns (`count:'exact', head:true` + `get_kanban_column_counts` RPC precedents); Radix popover primitive verified            |
| AFF-03 | ⌘K command menu passes an audit — every advertised command works, missing high-value commands added, EN+AR (F25) | §F25 audit: full command inventory with per-command dead/alive verdicts and file:line evidence; EN/AR drift = 0 verified; seams for the 4 required additions located                                                                                                 |
| AFF-04 | Rich empty states across list pages and dossier tabs, replacing bare "no data" text (F26)                        | §F26 inventory: all 9 bare-text sites cited with file:line; `ListEmptyState` zero-consumer finding; `EntityType` union gaps; empty-states.json voice-debt lines cited                                                                                                |

</phase_requirements>

## Architectural Responsibility Map

| Capability                            | Primary Tier                                         | Secondary Tier                                             | Rationale                                                                                          |
| ------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Peek panel open/close/deep-link (F23) | Browser/Client (URL search params)                   | —                                                          | Existing D-02 pattern: `?dossier=&dossierType=` validated at `_protected.tsx`, browser back closes |
| Peek prev/next + counter (F23)        | Browser/Client (client state + TanStack Query cache) | Database (page totals via `count:'exact'`)                 | Sibling list lives in the already-fetched query page; totals come from existing pagination meta    |
| Filter/display state (F24)            | Browser/Client (URL search params)                   | —                                                          | URL-as-state per project patterns; shareable views mandated by spec                                |
| Live facet counts (F24)               | Database (Supabase count queries / RPC)              | Browser/Client (kanban only — full dataset is client-side) | Lists are server-paginated (20/page) so client-side counting is impossible except on kanban        |
| Command execution (F25)               | Browser/Client (router navigation + store actions)   | —                                                          | All commands are navigations or store calls; no backend surface                                    |
| Empty-state rendering (F26)           | Browser/Client                                       | —                                                          | Pure presentation on settled queries                                                               |

## Standard Stack

### Core (all already installed — verified in `frontend/package.json`)

| Library                   | Version   | Purpose                                                 | Why Standard                                                                                                     |
| ------------------------- | --------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `@tanstack/react-router`  | ^1.170.7  | URL search-param state (F23 deep-link, F24 persistence) | Existing router; `validateSearch` composition already proven for drawer params [VERIFIED: package.json:79]       |
| `@tanstack/react-query`   | ^5.100.14 | List queries, facet counts, peek prefetch               | Every list hook already uses it [VERIFIED: package.json:77]                                                      |
| `cmdk`                    | ^1.1.1    | F25 command menu (existing `ui/command.tsx` wrapper)    | Already powers the palette [VERIFIED: package.json:95]                                                           |
| `@radix-ui/react-popover` | ^1.1.15   | F24 Filter/Display popovers via `ui/popover.tsx`        | Wrapper exists; `--color-popover` maps to `--surface-3` per frontend/CLAUDE.md [VERIFIED: package.json:58]       |
| `zustand`                 | ^5.0.13   | F23 peek-list registry (cross-tree channel)             | 5 stores exist in `src/store/`; `useCopilotDrawer` is the drawer-adjacent precedent [VERIFIED: package.json:140] |
| `lucide-react`            | installed | Icons (ListFilter, SlidersHorizontal, ChevronUp/Down)   | Only icon library permitted by UI-SPEC                                                                           |

### Supporting (existing internal modules — the real "stack" of this phase)

| Module                                    | Location                                         | Purpose                                                                     |
| ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `Sheet`/`SheetContent`                    | `components/ui/sheet.tsx` (side variants :37-57) | Peek shell — `side="right"` is already logical (`end-0`), RTL-safe          |
| `LtrIsolate`                              | `components/ui/ltr-isolate.tsx`                  | `dir="ltr"` isolation for the mono counter (block-level div; see Pitfall 4) |
| `ListPageShell`                           | `components/list-page/ListPageShell.tsx`         | Toolbar slot (:57-61) is where Filter/Display triggers land                 |
| `ActiveFiltersBar` + `useActiveFilters`   | `components/active-filters/`                     | Chip rendering + remove/clear logic — reusable, needs Linear token reskin   |
| `EmptyState`                              | `components/empty-states/EmptyState.tsx`         | F26 Pattern A/B host (variants default/card/inline/compact already exist)   |
| `ListEmptyState`                          | `components/empty-states/ListEmptyState.tsx`     | Entity-keyed wrapper — currently ZERO consumers                             |
| `formatShortcut` / `useKeyboardShortcuts` | `hooks/useKeyboardShortcuts.ts`                  | Key-glyph formatting + global bindings                                      |
| `useMode`                                 | `design-system/hooks/useMode.ts`                 | "Toggle theme" command target (Topbar.tsx:161 precedent)                    |
| `switchLanguage`                          | `i18n/index.ts:586`                              | "Switch language" command target                                            |

**Installation:** none. No new packages are authorized (UI-SPEC Registry Safety).

## Package Legitimacy Audit

**No new packages are installed this phase** — the UI-SPEC explicitly locks the dependency set ("No new dependencies are authorized by this contract"). All libraries referenced above are pre-existing entries in `frontend/package.json` verified this session. slopcheck not run — nothing to check.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## The Nine Core Surfaces — Seam Inventory (answers integration question 1)

This is the load-bearing table. "URL state" means TanStack Router `validateSearch` + `Route.useSearch`.

| #   | Surface             | Route file                                                                                       | Shell                                                                                  | Data hook (source)                                                                                              | Search/filter state                                                                                           | Pagination + total                                                                | Row click today                                                                                                 | Empty state today                                           |
| --- | ------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Countries           | `routes/_protected/dossiers/countries/index.tsx`                                                 | `ListPageShell` + `DossierTable`                                                       | `useCountries` — Supabase direct, `count:'exact'` (hooks/useCountries.ts:58-74)                                 | URL `{page, search}` (:20-27)                                                                                 | server, 20/page, `pagination.total` (:128-134)                                    | `navigate` to detail (:47-55)                                                                                   | bare `empty-hint` div (:117-132)                            |
| 2   | Organizations       | `routes/_protected/dossiers/organizations/index.tsx`                                             | `ListPageShell` + `DossierTable`                                                       | `useOrganizations` (mirrors useForums shape, `{data, pagination}`)                                              | URL `{page, search}` (:26)                                                                                    | server, 20/page, total ✓                                                          | navigate to detail (:75-84)                                                                                     | bare `empty-hint` (:102-110)                                |
| 3   | Forums              | `routes/_protected/dossiers/forums/index.tsx`                                                    | `ListPageShell` + `GenericListPage`                                                    | `useForums` — Supabase, `count:'exact'` (hooks/useForums.ts:34)                                                 | URL `{page, search}` (:51)                                                                                    | server, 20/page, total ✓                                                          | navigate to detail (:96)                                                                                        | bare `empty-hint` (:118-129)                                |
| 4   | Engagements         | `routes/_protected/dossiers/engagements/index.tsx` → `pages/engagements/EngagementsListPage.tsx` | `ListPageShell` + `EngagementsList` (has its own `FilterPill` type filter + load-more) | `useEngagementsInfinite` — infinite query, `getNextPageParam` (hooks/useEngagementsInfinite.ts:43-47)           | **LOCAL `useState`** search + filter (EngagementsListPage.tsx:95-99)                                          | infinite (no numeric total surfaced)                                              | navigate to detail                                                                                              | (list component `emptyState` prop)                          |
| 5   | Topics              | `routes/_protected/dossiers/topics/-TopicsListPage.tsx`                                          | `ListPageShell` + `GenericListPage`                                                    | `useTopics` → `useDossiersByType('topic')` (API repo, domains/dossiers/hooks/useDossier.ts:180-192)             | URL `{page, search}` (:33-35)                                                                                 | server, 20/page, `total?` on response                                             | navigate to detail (:92-95)                                                                                     | bare `empty-hint` (:112-118)                                |
| 6   | Working groups      | `routes/_protected/dossiers/working_groups/index.tsx`                                            | `ListPageShell` + `GenericListPage`                                                    | `useWorkingGroups` — RPC + separate `count:'exact', head:true` query (hooks/useWorkingGroups.ts:77-91)          | URL `{page, search}` (:29)                                                                                    | server, 20/page, total ✓                                                          | navigate to detail                                                                                              | bare text, `data-testid="working-groups-empty"` (:89-98)    |
| 7   | Persons             | `routes/_protected/dossiers/persons/-PersonsListPage.tsx`                                        | `ListPageShell` + `PersonsGrid`                                                        | `usePersons` (domains repo → API; `PersonListResponse.pagination.total` exists — types/person.types.ts:423-431) | **LOCAL `useState`** + `useDebouncedValue` (:68-70); route `validateSearch` exists but is IGNORED by the page | API supports offset/limit + total, page does not paginate                         | navigate to detail (:77-79)                                                                                     | bare centered text (:94-99)                                 |
| 8   | Elected officials   | `routes/_protected/dossiers/elected-officials/index.tsx`                                         | **NOT ListPageShell** — `PageHeader` + `ElectedOfficialListTable`                      | `useElectedOfficials` (domains repo; `data.total` — ElectedOfficialListTable.tsx:105)                           | **LOCAL `useState`** filters (:61-66); route `validateSearch` ignored                                         | client `currentPage / totalPages` (:334-349)                                      | (table-internal)                                                                                                | bare `h3` `t('list.empty')` (:162-167)                      |
| 9   | Work board / kanban | `routes/_protected/kanban.tsx` → `pages/WorkBoard/WorkBoard.tsx`                                 | Custom (BoardToolbar + BoardColumn)                                                    | `useUnifiedKanban` — full dataset client-side; client-side search filter (D-07, WorkBoard.tsx:119-137)          | **LOCAL `useState`** mode + search (:114-115)                                                                 | all items loaded; `get_kanban_column_counts` RPC exists (useUnifiedKanban.ts:183) | routes by source: task→`/tasks/$id`, commitment→`/commitments` (list!), intake→`/intake/tickets/$id` (:236-251) | per-column `col-empty` "No items" (BoardColumn.tsx:175-177) |

**Conclusion:** surfaces 1/2/3/5/6 share one abstraction and one URL-state idiom (`DossierListSearch {page, search}` — the identical interface is copy-pasted per route). Surfaces 4/7/8/9 each diverge and need state lifted to URL before F23/F24 can hook in uniformly. The `/dossiers` hub (`pages/dossiers/DossierListPage.tsx` — the only current `ActiveFiltersBar` consumer) is NOT in the core set.

## F23 — Peek panel seams (answers integration question 2)

**`useDossierDrawer` has NO notion of sibling rows.** The full hook (hooks/useDossierDrawer.ts:29-68) reads/writes exactly two search params (`dossier`, `dossierType`) via `useSearch({strict:false})` + navigate reducers. `openDossier` uses `replace:false` (history entry per open), `closeDossier` uses `replace:true`. Prev/next paging is net-new plumbing.

**Mounting topology is the design constraint.** `DossierDrawer` mounts once at the `_protected` layout route (routes/\_protected.tsx:83), and `_protected.tsx:38-44` whitelists the drawer params so they survive on ANY child route. The drawer therefore renders OUTSIDE the list route's component tree — it cannot call the list's `Route.useSearch()` or reach its query data through props/context local to the route. Three viable channels for "the current list's ordered rows + position + total":

1. **Zustand peek-registry store (recommended — codebase precedent).** List page registers `{orderedIds: string[], types, total, page, pageSize, fetchNeighborPage?}` on row click (or continuously via effect); drawer reads it. Precedent: `useCopilotDrawer` zustand store consumed by both the palette (CommandPalette.tsx:430) and the drawer mounted in `_protected.tsx`. Existing stores: `src/store/{authStore,dossierStore,entityHistoryStore,pinnedEntitiesStore,uiStore}.ts`.
2. URL params (`?peekPos=&peekTotal=`): shareable but stale after data changes and pollutes the whitelist; the spec's counter is defined against the _live_ filtered list, so URL-frozen values are wrong after any refetch.
3. React context above `_protected`'s Outlet: equivalent to (1) with more ceremony and no devtools.

**Pagination boundary is the real design decision.** All 5 uniform lists fetch server-side pages of 20 (`.range(offset, offset+limit-1)`, `count:'exact'` — e.g. useCountries.ts:72). The counter total (`3 / 15`) can use `pagination.total` (the FULL filtered count), but only the current page's 20 row ids are in memory. At a page boundary, "next" must either (a) be disabled at page edges (counter still shows global position `(page-1)*20+idx`), or (b) fetch the neighbor page via `queryClient.fetchQuery` with the same query key family and splice. Engagements (infinite query) and kanban (full client dataset) differ again. **The UI-SPEC's boundary rule ("First row: prev disabled; last row: next disabled") does not say whether "first/last" means page or full list — planner must decide** (see Open Questions).

**Row-click rewiring:** today ZERO list pages call `openDossier` — the only `openDossier` consumers are 3 dashboard widgets + `calendar.tsx` (verified by repo-wide grep). F23 changes `onRowClick` on the 8 lists from `navigate(detail)` to `openDossier(...)` (+ registry write). The full detail route stays reachable via the drawer's existing `cta.open_full_dossier` (DrawerCtaRow, key verified in dossier-drawer.json).

**Insertion point for counter + chevrons:** `DrawerHead` (components/dossier/DossierDrawer/DrawerHead.tsx:84-118) — the chip row / close-button flex at :86-105 is where the `n / total` mono counter + chevron pair land. The close button there is the icon-button precedent: plain `<button className="btn-ghost">` with explicit min-size styles (:95-104) — NOT HeroUI Button (which drops aria attrs via filterDOMProps, Phase-79 lesson).

**Work-item rows (kanban):** the "equivalent work-item drawer infra" is `CommitmentDrawer` (`?commitment=` param, hooks/useCommitmentDrawer.ts, mounted `_protected.tsx:86`) — it exists ONLY for commitments. Tasks and intakes have full-page details, no drawer. Kanban row click currently routes commitments to the `/commitments` LIST (WorkBoard.tsx:242-244 — weak UX). Planner scope: kanban peek = wire commitment cards to `CommitmentDrawer` with the same counter pattern; task/intake cards keep navigation (building new drawers would violate "extend, don't invent").

**Skeleton/error/exit states:** all already exist in the shell — `DrawerSkeleton` (DossierDrawer.tsx:120-121), `role="alert"` error branch with retry (:105-119), Escape/scrim close via Radix Sheet `onOpenChange` (:92-94).

## F24 — Filter/Display popover seams

**Where triggers live:** `ListPageShell`'s `toolbar` slot (ListPageShell.tsx:57-61) currently holds `ToolbarSearch` (+ `FilterPill`s on engagements). The two `.btn-ghost` triggers go there for surfaces 1-7; elected-officials needs either migration onto `ListPageShell` or a parallel toolbar row; kanban's `BoardToolbar` (WorkBoard) replaces its filter-pills row.

**Filter state → URL:** the 5 uniform lists already validate `{page, search}` — F24 extends each route's `validateSearch` with the planner-chosen filter/display params. TanStack Router composes parent+child `validateSearch`, so the reserved parent params `dossier`/`dossierType` (and `commitment`) must not be reused. Persons/engagements/kanban/EO must first lift local state to URL (persons even has a dead `validateSearch` already in its route shell — routes/\_protected/dossiers/persons/index.tsx:11).

**Chips:** `useActiveFilters` (components/active-filters/useActiveFilters.ts:78-292) already converts a filter object + field configs into `FilterChipConfig[]` with per-chip remove and clear-all — reuse the hook logic. `ActiveFiltersBar` itself (ActiveFiltersBar.tsx) is framer-motion-animated and styled in pre-Linear tokens (`bg-secondary`, `rounded-xl`, `border-border/50`, warning washes) — it needs a Linear reskin pass (chips at `--radius-sm`, no scale animations per "never lift, never scale") or a slim Linear-native chip row that consumes `useActiveFilters` output. Its only live consumer is the out-of-scope `/dossiers` hub, so reskinning it carries low regression risk.

**Live counts — two working precedents, no generic facet infra:**

- Server-paginated lists: per-option `supabase.from('dossiers').select('*', {count:'exact', head:true})` with the other active filters applied — exact pattern at useWorkingGroups.ts:84-91. One head-count query per option, fired only while the popover is open (`enabled` gating precedent: DossierDrawer.tsx:38-40) with a `staleTime`. Option sets are small (status has ~4 values), so N stays single-digit per surface.
- Kanban: dataset is fully client-side (WorkBoard `visibleItems`) — count with `Array.filter`; a `get_kanban_column_counts` RPC also exists (useUnifiedKanban.ts:183) if server truth is preferred.
- "Showing N of M": M = unfiltered total (one extra head-count without filters), N = `pagination.total` of the current filtered query — both already available shapes.

**Display popover:**

- _Group by_: only kanban has grouping today — `columnMode` with `'status'` wired and By dossier/By owner as deliberate `aria-disabled` stubs (D-06, BoardToolbar.tsx:44-84). The spec folds this toggle into Display without duplication. Flat lists get "No grouping" default.
- _Sort by_: currently hard-coded per hook (countries `updated_at desc` — useCountries.ts:72; forums `name_en asc` — useForums.ts:51). Exposing sort requires threading an `orderBy` param into each hook's Supabase `.order()` call — a small, mechanical hook change per surface.
- _Display properties_: NO column-visibility infra exists anywhere. `DossierTable` renders a fixed grid (`auto 1fr auto auto auto` — DossierTable.tsx:41) with columns glyph/name/engagements/last-touch/sensitivity; `GenericListPage` rows have primary/secondary/status/icon (GenericListPage.tsx:5-12). Property toggles = net-new, mapping to these existing columns only.

**Popover primitive:** use `components/ui/popover.tsx` (Radix wrapper, exists, kebab-case ui file). HeroUI v3 has a Popover but no HeroUI popover is used anywhere in `components/ui/` today (only heroui-button/chip/card/forms/skeleton wrappers exist) — Radix is the in-repo precedent and Radix logical placement handles RTL mirroring per the spec.

## F25 — Command menu audit findings (answers integration question 3)

**Registration model (how commands exist):** three disjoint sources rendered by `CommandPalette.tsx`:

1. `createActions` (12 hard-coded items, CommandPalette.tsx:617-708) + `quickActions` (17 + dynamic analyze/copilot items, :711-873) — inline `useMemo` arrays with `action: () => navigateTo(path)`.
2. Registered keyboard shortcuts via `KeyboardShortcutProvider` → `getAllShortcuts()` (searched as the "Commands" group, :572-584).
3. Dynamic: `getAnalyzeCommandActions(pathname)` (analyze-commands.ts:103-115, dossier-route-gated) and `getCopilotCommandAction`.

i18n: labels via `t('keyboard-shortcuts:…', fallback)`; group headings via `quickswitcher` ns. Dossier/work-item type badges use HARD-CODED EN/AR label maps (CommandPalette.tsx:173-198) bypassing i18n — functional, but a drift risk to note.

### Dead / broken commands (verified)

| #   | Command (id)                                                                                                                                                                                                                        | Evidence                                                                                                                                                                                                                      | Verdict                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | `create-task` → `/tasks?action=create` (:623)                                                                                                                                                                                       | Repo-wide grep: `?action=create` consumed NOWHERE (only match is an unrelated `log.action === 'create'` in admin/field-permissions.tsx:620)                                                                                   | **Half-dead** — navigates but never opens a create form. Advertised "Create New Task" does not create |
| 2   | `create-intake` → `/my-work/intake?action=create` (:631)                                                                                                                                                                            | same grep                                                                                                                                                                                                                     | Half-dead                                                                                             |
| 3   | `create-commitment` → `/commitments?action=create` (:647)                                                                                                                                                                           | same grep                                                                                                                                                                                                                     | Half-dead                                                                                             |
| 4   | `create-position` → `/positions?action=create` (:654)                                                                                                                                                                               | same grep                                                                                                                                                                                                                     | Half-dead                                                                                             |
| 5   | `cmd-export-dossiers` → `/dossiers?action=export` (:846-851)                                                                                                                                                                        | `action=export` consumed nowhere                                                                                                                                                                                              | **Dead**                                                                                              |
| 6   | `cmd-view-network` (:762-774)                                                                                                                                                                                                       | On `/dossiers/*` it navigates to `location.pathname` — a literal no-op; elsewhere → `/dossiers`. `/relationships/graph` exists (analyze deep-links target it)                                                                 | **Broken** — never shows a network                                                                    |
| 7   | `nav-analytics` (:748-754)                                                                                                                                                                                                          | Label "Go to Analytics" but navigates `/dashboard`; `/analytics` route EXISTS (routes/\_protected/analytics.tsx) and the Alt+A keyboard shortcut correctly targets `/analytics` (useKeyboardShortcuts.ts:361-369)             | **Wrong target** + internal inconsistency with the key binding                                        |
| 8   | Advertised key glyphs ⌘N / ⇧⌘I / ⇧⌘D on create-task/intake/dossier (:624,632,640 via `formatShortcut`)                                                                                                                              | `KeyboardShortcutProvider` registers ONLY `command-palette` (⌘K) + `show-shortcuts` (⇧?) + calls `useNavigationShortcuts()` (Alt+D/W/O/C/T/A/S + Alt+arrows — these DO work). No action-shortcut registration exists anywhere | **Advertised-but-unbound** glyphs — pressing them does nothing                                        |
| 9   | Suggested-action ids that resolve to nothing (routeContexts :217-299 vs the resolver :894-931): `view-relationships`, `create-event`, `export-report`, `view-profile`, `view-help`, `view-users`, `view-monitoring`, `create-brief` | Resolver looks up `createActions`, then `nav-*`, then full id — none match                                                                                                                                                    | Silently dropped (suggestions never render) — dead config, not user-visible breakage                  |

### Missing high-value commands (spec minimum set + found gaps)

| Command                             | Seam (verified)                                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create MoU                          | `CreateMouDialog` is opened by LOCAL state in `pages/MoUs/MousPage.tsx:89,217` (`createOpen`) — no URL/store seam exists. Command needs either a `?action=create`-style param the page actually consumes, or navigation + a small store. Planner scope |
| Create user (admin-gated)           | Route `/users/create` exists (routes/\_protected/users/create.tsx). No frontend admin-gate hook surfaced in the create page itself — gating pattern is an open question (see Assumptions A2)                                                           |
| Toggle theme                        | `useMode()` → `setMode(mode === 'dark' ? 'light' : 'dark')` — exact precedent Topbar.tsx:161-165                                                                                                                                                       |
| Switch language                     | `switchLanguage` exported from `i18n/index.ts:586`; persists under `id.locale`                                                                                                                                                                         |
| Create elected official (bonus gap) | i18n key `createActions.newElectedOfficial` EXISTS (en/keyboard-shortcuts.json:29) and route `/dossiers/elected-officials/create` EXISTS, but NO command is registered — an obvious omission the audit should close                                    |

### Copy + EN/AR state

- **Zero EN↔AR key drift** in all 7 phase namespaces (keyboard-shortcuts 90/90, empty-states 318/318, dossier-drawer 30/30, active-filters 21/21, quickswitcher 48/48, unified-kanban 124/124, list-pages 13/13 — programmatic flatten-and-diff this session).
- **Title Case violations throughout** en/keyboard-shortcuts.json ("Create New Task", "Go to Dashboard", "Show Keyboard Shortcuts"…) — the spec mandates a sentence-case pass across EN + AR.
- `quickswitcher.groups.*` already has all 8 dossier-type headings + recent/commands/searchResults (verified).

## F26 — Empty-state site inventory (answers integration question 4)

**Infrastructure status:** `EmptyState` (4 variants, 3 sizes, primary/secondary actions, icon wash wrapper — components/empty-states/EmptyState.tsx) is consumed by exactly 2 pages, both OUT of core scope (`pages/advanced-search/AdvancedSearchPage.tsx`, `pages/dossiers/DossierListPage.tsx`). **`ListEmptyState` has ZERO consumers** — its entity-keyed copy system was built and never wired. `EntityType` union (ListEmptyState.tsx:21-34) is missing `topic`, `working_group`, `elected_official` exactly as the spec says; `empty-states.json` `list.*` mirrors the same gaps (has generic/document/dossier/engagement/commitment/organization/country/forum/event/task/person/position/mou/relationship/brief).

**Bare-text sites in scope (all 9 core surfaces are non-compliant):**

| Surface           | Site                                                                                | Current rendering                                                              |
| ----------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Countries         | dossiers/countries/index.tsx:117-132                                                | `empty-hint` div, two `<p>`, no icon/CTA                                       |
| Organizations     | dossiers/organizations/index.tsx:102-110                                            | same pattern                                                                   |
| Forums            | dossiers/forums/index.tsx:118-129                                                   | same pattern                                                                   |
| Topics            | dossiers/topics/-TopicsListPage.tsx:112-118                                         | same pattern                                                                   |
| Working groups    | dossiers/working_groups/index.tsx:89-98                                             | text block, `data-testid="working-groups-empty"` (test dependency!)            |
| Persons           | dossiers/persons/-PersonsListPage.tsx:94-99                                         | centered two-line text                                                         |
| Engagements       | pages/engagements/EngagementsListPage.tsx (via `EngagementsList` `emptyState` prop) | prop-driven, currently minimal                                                 |
| Elected officials | components/elected-officials/ElectedOfficialListTable.tsx:162-167                   | `<h3>{t('list.empty')}</h3>`                                                   |
| Kanban            | pages/WorkBoard/BoardColumn.tsx:175-177                                             | per-column `col-empty` "No items" (board-level all-empty state does not exist) |

**Filtered-empty vs no-data:** NO surface distinguishes them today; all show the same copy regardless of active filters. The spec's ghost "Clear filters" recovery requires the F24 clear-all wiring — F26's filtered-empty branch depends on F24 state.

**Dossier tabs (Pattern B):** the overview sections already carry structured empties with i18n title+description (ActivityTimelineSection.tsx:254-256, KeyContactsSection.tsx:184-186, CalendarEventsSection.tsx:195, DocumentsSection.tsx:131 — all in the `dossier-overview` ns) and the drawer sections use compliant one-liners (`dossier-drawer:empty.*`). Tab routes are thin lazy wrappers (e.g. countries/$id/engagements.tsx) around `components/dossier/tabs/*` which delegate to those sections. The Pattern-B pass is therefore mostly a copy-audit + style alignment, not structural work.

**Copy debt (cited):** en/empty-states.json:10 "We couldn't find anything matching your search criteria.", :18 "We encountered an error while searching." — first-person plural; Title Case across `list.*` ("No Countries", "Add Your First Country", "Get Started", "Start Your Search", "No Results Found"). Spec's per-surface matrix (§F26) replaces the core-set copy wholesale.

**Loading discipline:** `ListPageShell` already gates `isEmpty` behind `!query.isLoading` on every consumer (e.g. countries/index.tsx:116) — the "never flash empty while loading" rule is structurally satisfied on shell surfaces; verify on EO table + kanban.

**CTA permission gating:** the spec requires "if the user cannot create, render without CTA". No list page currently gates its create affordance (countries has no Add button at all; EO's Add button is ungated — dossiers/elected-officials/index.tsx:38-44). No obvious `useCanCreate`-style hook exists. See Assumptions A2/A3.

## Architecture Patterns

### System Architecture Diagram (F23/F24 data flow)

```
                     URL search params (?page&search&filters…&dossier&dossierType)
                              ▲                     ▲
              validateSearch  │                     │  validateSearch (_protected.tsx:38 — drawer params)
                              │                     │
  ┌───────────────────────────┴───────┐   ┌─────────┴────────────────────────────┐
  │ List route (1 of 9 surfaces)      │   │ _protected layout                    │
  │  Route.useSearch → filters/sort   │   │  <DossierDrawer/> (:83)              │
  │  data hook (useCountries…)        │   │  <CommitmentDrawer/> (:86)           │
  │   └─ Supabase/API: page of rows   │   │   └─ useDossierDrawer (URL only)     │
  │      + count:'exact' total        │   │   └─ NEW: read peek registry ────┐   │
  │  Filter/Display popovers          │   │      counter n/total, prev/next  │   │
  │   └─ facet head-counts (enabled   │   └──────────────────────────────────┼───┘
  │      only while open)             │                                      │
  │  onRowClick → openDossier(...)  ──┼── writes ──► Zustand peek registry ◄─┘
  │      + register {orderedIds,      │             (orderedIds, position, total,
  │        total, position}           │              neighbor-page fetch strategy)
  └───────────────────────────────────┘
```

### Recommended structure for new code

```
frontend/src/
├── components/list-controls/          # F24 (new kebab-case folder, PascalCase files)
│   ├── FilterPopover.tsx
│   ├── DisplayPopover.tsx
│   └── useListControls.ts             # URL param read/write helpers per surface
├── store/peekStore.ts                 # F23 registry (matches src/store/ naming)
├── i18n/{en,ar}/list-controls.json    # NEW ns — MUST be registered in i18n/index.ts
└── (extensions in place: DossierDrawer/, empty-states/, keyboard-shortcuts/)
```

### Pattern 1: URL-driven overlay + registry (F23)

**What:** URL params own open/which; a store owns the ephemeral list context (ordering is a UI concern, not shareable state).
**When:** any overlay that must deep-link but also know its launch context.

```tsx
// Source: codebase precedent — hooks/useDossierDrawer.ts + components/copilot/useCopilotDrawer (zustand)
// list page, on row click:
peekStore.getState().register({
  ids: rows.map((r) => r.id),
  type: 'country',
  total: pagination.total ?? rows.length,
  pageOffset: (page - 1) * 20,
})
openDossier({ id: row.id, type: 'country' })
// drawer paging (spec: replace:true — no history spam):
void navigate({ search: (prev) => ({ ...prev, dossier: nextId }), replace: true } as never)
```

### Pattern 2: enabled-gated facet counts (F24)

```tsx
// Source: codebase precedents — useWorkingGroups.ts:84-91 (head count) + DossierDrawer.tsx:38-40 (enabled gating)
useQuery({
  queryKey: ['facet-count', surface, option, otherFilters],
  queryFn: async () => {
    const { count } = await supabase
      .from('dossiers')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'country')
      .neq('status', 'deleted')
      .eq('status', option) // the option being counted
    /* + apply other active filters */
    return count ?? 0
  },
  enabled: popoverOpen,
  staleTime: 30_000,
})
```

### Pattern 3: mono LTR isolation inline (F23 counter, F25 glyphs)

```tsx
// Source: frontend/DESIGN.md §RTL cascade (:218-232) + BoardToolbar.tsx:87-89 (LtrIsolate usage)
<span dir="ltr" className="font-mono text-sm text-ink-mute">
  {t('dossier-drawer:peek.counter', { position, total })}
</span>
```

### Anti-Patterns to Avoid

- **`isRTL`-flipping Sheet `side`** — PR #95 lesson; `side="right"` variant is already logical (`end-0`, sheet.tsx:44). Locked in the UI-SPEC.
- **HeroUI Button for icon-only aria buttons** — filterDOMProps drops aria (Phase-79); use plain `<button className="btn-ghost">` per DrawerHead.tsx:95-104.
- **Dot-form namespace addressing** — `t('list-controls.filter.trigger')` leaks raw keys; use `t('list-controls:filter.trigger')`.
- **Client-side facet counting on server-paginated lists** — only page 1 of 20 is in memory; counts would lie.
- **Duplicating the kanban Group-by toggle** — spec: the Display popover REPLACES the pills, never renders both.

## Don't Hand-Roll

| Problem                         | Don't Build            | Use Instead                                                       | Why                                                            |
| ------------------------------- | ---------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| Popover positioning/RTL/focus   | custom positioned div  | `components/ui/popover.tsx` (Radix)                               | collision detection, logical placement, focus trap done        |
| Command list filtering/keyboard | custom listbox         | existing `ui/command.tsx` (cmdk)                                  | already the palette's engine; cmdk owns aria/ids               |
| Chip generation from filters    | new chip mapper        | `useActiveFilters` (useActiveFilters.ts:78)                       | array/date/boolean/dateRange chip logic exists, tested in prod |
| Filtered totals                 | manual count endpoints | Supabase `count:'exact', head:true` / existing `pagination.total` | every hook already returns totals                              |
| Drawer shell/URL behavior       | new slide-over         | `DossierDrawer` + `useDossierDrawer`                              | LOCKED decision; skeleton/error/deep-link done                 |
| Empty-state layout              | per-page divs          | `EmptyState` (+ extended `ListEmptyState`)                        | variants/sizes/actions exist; F26 = wire + reskin + copy       |
| Key-glyph formatting            | manual ⌘/Ctrl strings  | `formatShortcut` (useKeyboardShortcuts.ts)                        | mac/win + RTL aware                                            |

**Key insight:** every F23/F24/F26 primitive already exists in-repo; the phase's engineering weight is state-plumbing (URL normalization + peek registry) and content (copy matrices, audit fixes), not component construction.

## Common Pitfalls (answers integration question 5)

### Pitfall 1: Peek counter vs server pagination

**What goes wrong:** counter says `3 / 247` but "next" dies at row 20, or paging fires a full page fetch per keypress.
**Why:** lists hold one 20-row page; total is the full filtered count.
**Avoid:** decide the boundary semantics up front (Open Question 1); if crossing pages, prefetch the neighbor page when the user reaches slot 18-20 via `queryClient.fetchQuery` on the same key family.
**Warning signs:** chevrons enabled at indices ≥ current page length.

### Pitfall 2: New i18n namespace silently English-only in Arabic

**What goes wrong:** `list-controls` ns added as JSON but not registered in `src/i18n/index.ts` → falls back EN in BOTH languages (looks fine in EN, breaks AR).
**Avoid:** register in the same commit; `pnpm --dir frontend lint` runs `check-i18n-namespaces.mjs` and catches drift — run it in every plan's verify step.

### Pitfall 3: cmdk hardcoded listbox id

**What goes wrong:** attempts to re-wire `aria-controls`/listbox ids for the audit fight cmdk internals (project memory, Phase 79).
**Avoid:** the UI-SPEC pre-authorizes leaving cmdk's ids alone ("don't fight it for aria wiring").

### Pitfall 4: `LtrIsolate` is a block div

**What goes wrong:** wrapping the inline peek counter in `LtrIsolate` breaks the DrawerHead flex row layout.
**Avoid:** use an inline `dir="ltr"` span (Pattern 3); reserve `LtrIsolate` for standalone chips (BoardToolbar precedent).

### Pitfall 5: ESLint gates that WILL fire on this exact work

- physical Tailwind (`ml/mr/pl/pr`, `text-left/right`) → error; use logical (`ms/me/ps/pe`, `text-start`).
- raw hex / palette literals (`text-blue-500`) → error; tokens only. NOTE: `ActiveFiltersBar` and `EmptyState` currently use legacy shadcn-mapped tokens (`bg-secondary`, `bg-muted`, `text-muted-foreground`) — these are mapped and pass lint, but the UI-SPEC's color contract wants surface-ladder tokens on NEW/reskinned code.
- `@typescript-eslint/explicit-function-return-type`, `strict-boolean-expressions`, `no-floating-promises` → all error-level.
- Filename case: `components/**` PascalCase files/kebab folders, `ui/**` kebab, `hooks/**` camel — CI lints the whole repo even if pre-commit misses it.

### Pitfall 6: Kanban Display fold-in vs D-06 stubs

**What goes wrong:** Display popover renders By dossier/By owner as selectable options — but D-06 (Phase 39) deliberately made them dead stubs; `useUnifiedKanban` supports `columnMode` values the board never wired.
**Avoid:** Display popover's Group-by section should expose only working options (status) or the planner explicitly scopes wiring dossier/owner modes (they'd need `resolveBoardStage` equivalents). Do not render dead radio options — that recreates the F25 problem inside F24.

### Pitfall 7: `working-groups-empty` testid and drawer tests

**What goes wrong:** replacing bare empties / extending DrawerHead breaks existing tests: `data-testid="working-groups-empty"` (route test), the 9-file DossierDrawer test suite, `useDossierDrawer.test.tsx`, `CommandPalette.analyze.test.tsx`.
**Avoid:** keep/port testids; run the targeted suites per task (commands in Validation Architecture).

### Pitfall 8: framer-motion in reskinned chips

**What goes wrong:** porting `ActiveFiltersBar`'s scale/opacity chip animations into the Linear surfaces violates "hover = background fade; never lift, never scale".
**Avoid:** strip motion during the reskin; keep `AnimatePresence` out of new popover internals.

### Pitfall 9: Search-param reducer type casts

**What goes wrong:** TanStack Router's strict `NavigateOptions` rejects loose search reducers; naive typing fails typecheck.
**Avoid:** follow the codebase idiom (`as unknown as Parameters<typeof navigate>[0]` — useDossierDrawer.ts:40-48) or type per-route via `Route.useNavigate()` like countries/index.tsx:35-45.

## Project Constraints (from CLAUDE.md)

- Linear DS locked: tokens only (`var(--*)` / mapped utilities), borders `1px solid var(--line)`, no card shadows (drawer shadow only), no gradients, radii via `--radius-sm/--radius/--radius-lg` (6/8/12), row heights `var(--row-h)`.
- Buttons: `.btn-primary` / `.btn-ghost` recipes only; no new variants.
- Voice: sentence case, no emoji, no marketing voice, no "we", no `!`; dates `Tue 28 Apr`; Latin digits both locales via `lib/format-locale`.
- Component cascade: HeroUI v3 → Radix → build-it-yourself; Aceternity/Kibo/shadcn-defaults banned.
- RTL: logical properties only (ESLint-enforced); `dir` from i18n; never `.reverse()`; `ui/**` wrappers exempt from the logical-props lint.
- Responsive: desktop-primary 1280-1400px; 44×44 touch targets only <768px; test at 1024 and 1400.
- Required reading order honored: frontend/DESIGN.md → src/design-system/CLAUDE.md → closest component (this research cites the closest components per feature).
- GSD workflow: edits only through GSD phases (this is Phase 87).
- i18n: static bundle; register namespaces in `src/i18n/index.ts`; colon-form keys.
- Coding style: no semicolons, single quotes, explicit return types, no `any`, 100-char width; TDD with 80% coverage target; code review after writing.

## Environment Availability

Phase is frontend-code-only against the existing dev stack. No new external tools, services, or runtimes are required.

| Dependency                     | Required By             | Available                 | Version                        | Fallback |
| ------------------------------ | ----------------------- | ------------------------- | ------------------------------ | -------- |
| Node + pnpm monorepo toolchain | build/test/lint         | ✓ (in daily use)          | Node 22.x / pnpm 10.29.1       | —        |
| Supabase (staging)             | facet counts, list data | ✓ (existing hooks hit it) | project zkrcjzdemdmwhearhfgg   | —        |
| Vitest / Playwright            | validation              | ✓                         | vitest 4.1.7 / playwright 1.60 | —        |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 4.1.7 (unit, jsdom) + Playwright 1.60 (E2E/a11y, `--project=a11y`)                                         |
| Config file        | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`                                                      |
| Quick run command  | `pnpm --dir frontend exec vitest run <path>`                                                                      |
| Full suite command | `pnpm --dir frontend exec vitest run` then `pnpm --dir frontend lint` and `pnpm --dir frontend exec tsc --noEmit` |

### Phase Requirements → Test Map

| Req ID | Behavior                                                                       | Test Type           | Automated Command                                                                   | File Exists?                                                                         |
| ------ | ------------------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| AFF-01 | Peek registry position/total math + boundary disable                           | unit                | `pnpm --dir frontend exec vitest run src/store/__tests__/peekStore.test.ts`         | ❌ Wave 0                                                                            |
| AFF-01 | Drawer head renders counter + chevrons; paging swaps `?dossier=` with replace  | unit (RTL)          | `pnpm --dir frontend exec vitest run src/components/dossier/DossierDrawer`          | ✅ suite exists (9 files) — extend `DrawerHead.test.tsx`                             |
| AFF-01 | `useDossierDrawer` open/close semantics unchanged                              | unit                | `pnpm --dir frontend exec vitest run src/hooks/__tests__/useDossierDrawer.test.tsx` | ✅                                                                                   |
| AFF-02 | URL param round-trip per surface (validateSearch extension)                    | unit                | `pnpm --dir frontend exec vitest run src/components/list-controls`                  | ❌ Wave 0                                                                            |
| AFF-02 | Chips derive/remove/clear from filter object                                   | unit                | `pnpm --dir frontend exec vitest run src/components/active-filters`                 | ✅ hook logic exists; add cases for new field configs                                |
| AFF-03 | Every registered command's target resolves (route exists / store action fires) | unit (table-driven) | `pnpm --dir frontend exec vitest run src/components/keyboard-shortcuts`             | ✅ `CommandPalette.analyze.test.tsx` precedent — add `CommandPalette.audit.test.tsx` |
| AFF-03 | EN/AR label parity for changed keys                                            | lint script         | `pnpm --dir frontend lint` (check-i18n-namespaces.mjs)                              | ✅                                                                                   |
| AFF-04 | Per-entity empty state renders heading/body/CTA; filtered-empty branch         | unit                | `pnpm --dir frontend exec vitest run src/components/empty-states`                   | ✅ dir exists (1 test) — extend                                                      |
| all    | RTL render + a11y on touched surfaces                                          | e2e                 | `pnpm --dir frontend test:a11y` (targeted spec)                                     | ✅ qa-sweep infra exists                                                             |

### Sampling Rate

- **Per task commit:** targeted `vitest run` on the touched directory + `tsc --noEmit`
- **Per wave merge:** `pnpm --dir frontend exec vitest run` (full unit, ~1488 tests green baseline per STATE.md) + `pnpm --dir frontend lint`
- **Phase gate:** full suite + build + Playwright a11y project green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/store/__tests__/peekStore.test.ts` — covers AFF-01 math/boundaries
- [ ] `src/components/list-controls/__tests__/` — covers AFF-02 param round-trip + facet-count gating
- [ ] `src/components/keyboard-shortcuts/__tests__/CommandPalette.audit.test.tsx` — regression-locks the audit verdicts (dead targets stay dead-listed or fixed)

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies        | Standard Control                                                                                                                                                                                                                                                                 |
| --------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no (unchanged) | `_protected.tsx` beforeLoad gate untouched                                                                                                                                                                                                                                       |
| V3 Session Management | no             | —                                                                                                                                                                                                                                                                                |
| V4 Access Control     | yes (narrow)   | F26 CTA permission gating ("never a disabled accent button") + "Create user" command must be admin-gated in the UI AND remain server-enforced (RLS/roles are the real gate — UI hiding is UX, not security)                                                                      |
| V5 Input Validation   | yes            | All new URL search params validated in `validateSearch` (whitelist pattern, `_protected.tsx:38-44` precedent); search strings already length-capped + passed to PostgREST builders, never string-concatenated SQL (useCountries.ts:55-65 `.or(ilike)` builder pattern — keep it) |
| V6 Cryptography       | no             | —                                                                                                                                                                                                                                                                                |

### Known Threat Patterns for this stack

| Pattern                                                              | STRIDE                            | Standard Mitigation                                                                                           |
| -------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Deep-link param injection (`?dossier=`, new filter params)           | Tampering                         | validateSearch whitelisting + RLS on every Supabase read (existing)                                           |
| Info leak via facet counts (counting rows the user can't read)       | Information disclosure            | Facet head-counts run through the same Supabase client → RLS applies; do NOT add service-role count endpoints |
| Dead-command laundering (commands that navigate to privileged pages) | Elevation of privilege (UX-level) | Audit rule: command visibility ≠ authorization; target pages keep their own gates                             |
| XSS via rendered titles in palette/peek                              | Tampering                         | React JSX escaping only; no `dangerouslySetInnerHTML` anywhere in touched files (verified in read files)      |

## State of the Art (internal)

| Old Approach                    | Current Approach                      | When Changed | Impact                                                                         |
| ------------------------------- | ------------------------------------- | ------------ | ------------------------------------------------------------------------------ |
| Legacy per-page list bodies     | `ListPageShell` + adapters (Phase 40) | 2026         | F24 triggers have one toolbar slot on 7/9 surfaces                             |
| Bureau/4-direction token engine | Linear single-direction (Phase 77)    | 2026-07      | all new chrome uses surface ladder + 6/8/12 radii                              |
| shadcn chrome                   | HeroUI/Radix token-reskinned wrappers | Phase 79-85  | `ui/popover.tsx`/`ui/command.tsx`/`ui/sheet.tsx` are the sanctioned primitives |

**Deprecated/outdated:** `frontend/public/locales/` (dead — static bundle only); IntelDossier handoff prototype (superseded 2026-07); `pages/dossiers/DossierListPage.tsx` hub patterns (pre-Linear tokens — reference only, out of scope).

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                                    | Section       | Risk if Wrong                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | A Zustand registry is the intended channel for peek sibling context (spec doesn't name a mechanism) [ASSUMED]                                                                                                                            | F23 seams     | Low — alternatives (context) are isomorphic; URL-only would conflict with the live-list counter semantics                                                       |
| A2  | Frontend admin-gating for the "Create user" command can reuse whatever gate `/users/create` page enforces; no dedicated `useIsAdmin` hook was found in the frontend read this session [ASSUMED]                                          | F25 additions | Command could render for non-admins (server still blocks); planner should locate/confirm the role source (`public.users.role` per project memory) before wiring |
| A3  | No create-permission model exists for dossier lists (no gate found on any list page), so F26 CTAs will render for all authenticated users unless the planner adds a role check [ASSUMED]                                                 | F26           | CTA might violate "respects permissions" spec row if some roles cannot create; needs a decision                                                                 |
| A4  | `useEngagementsInfinite` exposes no numeric grand total (none found in the hook read) — engagements peek counter may need `count:'exact'` added or a "n / many" degradation [ASSUMED — hook read, response type not exhaustively traced] | F23           | Counter total wrong/absent on one surface; small hook change fixes it                                                                                           |

## Open Questions (RESOLVED)

1. **Peek paging across page boundaries** — page-bounded (chevrons disable at row 20 even when `total` > 20) vs neighbor-page fetch?
   - What we know: spec says counter total = full filtered list; boundary rule says "first/last row" disable without defining scope; all uniform lists can prefetch via queryClient.
   - Recommendation: cross-page fetch with prefetch-at-edge (matches the counter's full-list semantics); accept page-bounded as a fallback if plan-checker flags complexity.
   - **RESOLVED (87-01):** cross-page fetch with prefetch-at-edge — `usePeekPaging` computes position/canPrev/canNext from the GLOBAL total and fires a guarded neighbor-page fetch when within 2 rows of the loaded window edge.
2. **Kanban peek scope** — commitments-only via `CommitmentDrawer` (tasks/intakes keep navigation)?
   - What we know: only commitments have drawer infra; building task/intake drawers violates "extend, don't invent"; current commitment click goes to a LIST (broken-ish UX worth fixing regardless).
   - Recommendation: commitment cards → CommitmentDrawer with counter; task/intake cards unchanged; document as a spec-conformant narrowing.
   - **RESOLVED (87-09):** commitments-only via the existing CommitmentDrawer (`?commitment=` param); task/intake cards keep their navigation — documented spec-conformant narrowing of UI-SPEC §F23's work-item row.
3. **Display "properties" scope on GenericListPage surfaces** — DossierTable has 5 real columns; GenericListPage rows have only primary/secondary/status. What do property toggles control there?
   - Recommendation: DossierTable surfaces get column toggles; GenericListPage surfaces get secondary-line + status-chip toggles only (or omit the section where <2 toggleable properties exist).
   - **RESOLVED (87-02 + 87-07):** as recommended — DossierTable surfaces get column toggles; GenericListPage surfaces get secondary-line + status-chip toggles; the Display-properties section is omitted whenever a config has < 2 PropertyDef entries (enforced in the DisplayPopover contract).
4. **MoU-create seam for the ⌘K command** — URL param the MousPage consumes vs navigate-only.
   - Recommendation: add `?action=create` handling INSIDE MousPage (finally giving one page the pattern the palette always assumed) — smallest diff, and it template-fixes the four half-dead create commands if the planner extends the same treatment to tasks/intake/commitments/positions pages (or re-targets those commands at surfaces that already have create UIs, e.g. work-creation palette `openPalette('task')` used by WorkBoard:259-265).
   - **RESOLVED (87-03):** MousPage consumes `?action=create` (the palette's Create MoU command targets it); task/intake/commitment create commands are re-targeted at the unified work-creation palette (`useWorkCreation().openPalette`); `create-position` is removed (no positions create route or dialog exists — positions are created from dossier context only).

## Sources

### Primary (HIGH confidence — direct file reads this session)

- `87-UI-SPEC.md` (full), `.planning/REQUIREMENTS.md:19-22,91-94`, `.planning/STATE.md` (skim), `.planning/config.json`
- `hooks/useDossierDrawer.ts`, `components/dossier/DossierDrawer/{DossierDrawer,DrawerHead}.tsx`, `routes/_protected.tsx:8-90`
- All 9 surface files listed in the seam table (+ `ListPageShell.tsx`, `DossierTable.tsx`, `GenericListPage.tsx`, `EngagementsList.tsx`, `BoardToolbar.tsx`, `WorkBoard.tsx`, `BoardColumn.tsx`, `ElectedOfficialListTable.tsx`)
- `components/keyboard-shortcuts/{CommandPalette.tsx (1620 lines, 3 chunks),KeyboardShortcutProvider.tsx,analyze-commands.ts}`, `hooks/useKeyboardShortcuts.ts:290-400`
- `components/active-filters/{ActiveFiltersBar,useActiveFilters}.ts(x)`, `components/empty-states/{EmptyState,ListEmptyState}.tsx`
- Hooks: `useCountries`, `useForums` (grep), `useOrganizations` (grep), `useWorkingGroups` (grep), `useTopics`, `useDossiersByType`, `usePersons`+`PersonListResponse` (types/person.types.ts:423-431), `useEngagementsInfinite` (grep), `useUnifiedKanban` (grep), `useCommitmentDrawer` (grep)
- i18n: `{en,ar}` key-set diffs for 7 namespaces (programmatic), `en/keyboard-shortcuts.json` (full), `en/dossier-drawer.json` (full), `en/empty-states.json` (samples + grep), `en/quickswitcher.json` groups, `i18n/index.ts` registration greps
- Primitives: `ui/{sheet,popover,command,ltr-isolate}.tsx`, `frontend/package.json`, `frontend/DESIGN.md` §RTL cascade (:218-232)
- Repo-wide greps: `openDossier` consumers, `?action=create|export` consumers, `ListEmptyState`/`EmptyState` consumers, `empty-hint` sites

### Secondary (MEDIUM confidence)

- Project memory (MEMORY.md): PR #95 Sheet-side lesson, cmdk listbox-id gotcha, HeroUI filterDOMProps aria drop, i18n colon-form + `id.locale` — each independently consistent with code read this session

### Tertiary (LOW confidence)

- none (no external web research needed — phase is entirely internal integration)

## Metadata

**Confidence breakdown:**

- Surface/seam inventory: HIGH — every row read directly with line numbers
- F25 audit verdicts: HIGH — dead targets proven by repo-wide negative greps + provider registration read; the only softer item is A2 (admin gate location)
- F23 pagination strategy: HIGH on facts, MEDIUM on the recommended resolution (planner decision, Open Q1)
- F24 facet-count approach: HIGH on precedents, MEDIUM on per-surface option sets (explicitly planner scope)

**Research date:** 2026-07-07
**Valid until:** 2026-08-06 (internal codebase research — invalidated earlier by any merge touching the listed files)
