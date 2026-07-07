---
phase: 87
slug: linear-affordances
status: draft
shadcn_initialized: false
preset: none
created: 2026-07-07
---

# Phase 87 — UI Design Contract

> Visual and interaction contract for the four Linear affordances F23–F26 (AFF-01..AFF-04).
> The foundational design system is LOCKED (Linear, Phase 77) — this contract transcribes it
> from `frontend/DESIGN.md` and spends its specification budget on the copywriting and
> interaction contracts for the four features.

**Source spec:** `DESIGN-REFINEMENT-PLAN-260704.md` §3F rows F23/F24/F25/F26 + §4 Phase 6.
**Locked product decisions (orchestrator session, 2026-07-07):**

1. **F23 peek = augment `DossierDrawer`.** Extend `frontend/src/components/dossier/DossierDrawer/` + `frontend/src/hooks/useDossierDrawer.ts` — do NOT invent a parallel slide-over. Peek carries a `1 / 15` counter, up/down chevrons, and the existing "Open full dossier" action. Full-page route stays reachable.
2. **Surface scope = core set.** F23 + F24 apply to the 8 dossier-type list pages (countries, organizations, forums, engagements, topics, working-groups, persons, elected-officials) + the unified work-item / kanban list. **intake, commitments, positions, and mous lists are DEFERRED to a later phase.**
3. **F24 Display popover = full Linear Display.** Filter popover = which rows (chips + builder, live counts). Display popover (separate) = how arranged (grouping + ordering + property/column visibility). Live result counts where applicable.

---

## Design System

| Property          | Value                                                                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tool              | Linear design-system token engine (`frontend/src/design-system/`, spec `frontend/DESIGN.md`) — NOT shadcn. `frontend/components.json` exists only for legacy API-compat wrappers; shadcn defaults are BANNED per `/CLAUDE.md`. Do not run `shadcn init` or `shadcn add`. |
| Preset            | not applicable                                                                                                                                                                                                                                                           |
| Component library | HeroUI v3 + Radix primitives, token-reskinned (primitive cascade: HeroUI v3 → Radix → build-it-yourself, per `/CLAUDE.md`)                                                                                                                                               |
| Icon library      | lucide-react (only)                                                                                                                                                                                                                                                      |
| Font              | `'Inter Variable'` (EN display/body) · `'JetBrains Mono Variable'` (mono: counters, key glyphs, SLA windows) · Tajawal 400/500/700 (AR, forced on `dir="rtl"`) — registered-family strings are load-bearing (`frontend/DESIGN.md` §Typography)                           |

**Existing components to reuse/extend this phase (do not re-invent):**

| Feature | Existing infra                                                                                                                                                                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F23     | `components/dossier/DossierDrawer/` (Radix Sheet shell, `DrawerHead`, `DrawerCtaRow` with `cta.open_full_dossier`, `DrawerSkeleton`, error branch) + `hooks/useDossierDrawer.ts` (URL `?dossier=<id>&dossierType=<type>` mounting) + i18n `dossier-drawer.json` |
| F24     | `components/active-filters/ActiveFiltersBar.tsx` (`FilterChipConfig` chips, `showingFiltered` copy) + i18n `active-filters.json`; kanban grouping toggle (`unified-kanban.json` `columnModes.label` "Group by", `sorting.label` "Sort by")                      |
| F25     | `components/keyboard-shortcuts/CommandPalette.tsx` (cmdk-based, 1620 lines, grouped: Recents / per-dossier-type / Pages / Create New / Commands / Suggested) + `analyze-commands.ts` + i18n `keyboard-shortcuts.json`                                           |
| F26     | `components/empty-states/EmptyState.tsx` (variants default/card/inline/compact, sizes sm/md/lg) + `ListEmptyState.tsx` (`EntityType` union) + i18n `empty-states.json` (EN drives AR)                                                                           |

---

## Spacing Scale

Spacing is **density-token-driven**, not a free 8-point scale. Source: `frontend/src/design-system/tokens/densities.ts` (upstream-locked, Phase 33/41).

| Token          | comfortable (default) | compact | dense | Usage                                         |
| -------------- | --------------------- | ------- | ----- | --------------------------------------------- |
| `--row-h`      | 52px                  | 40px    | 32px  | Every list row, table row, popover option row |
| `--pad-inline` | 20px                  | 14px    | 10px  | Horizontal container padding                  |
| `--pad-block`  | 16px                  | 12px    | 8px   | Vertical container padding                    |
| `--gap`        | 16px                  | 12px    | 8px   | Inner gaps between stacked elements           |

Ad-hoc gaps inside new popover/panel internals use Tailwind 4px-grid utilities only: 4 / 8 / 12 / 16 / 24 px (`gap-1/2/3/4/6`, logical `ps-*`/`pe-*`/`ms-*`/`me-*` — never physical `pl/pr/ml/mr`).

Radii (token-driven, never hard-coded px — `frontend/DESIGN.md` §Radius):

| Token         | Value | Used on this phase                                   |
| ------------- | ----- | ---------------------------------------------------- |
| `--radius-sm` | 6px   | filter chips, icon buttons, key-glyph badges, inputs |
| `--radius`    | 8px   | Filter/Display popovers, ⌘K menu, menu items         |
| `--radius-lg` | 12px  | peek panel (drawer), empty-state cards               |

Exceptions: `compact --pad-inline` 14px and `--row-h` values are upstream-locked density literals from `densities.ts` — pre-existing design-system values, not Phase-87 decisions. Touch targets 44×44 apply only below 768px (`/CLAUDE.md` responsive rules); above that, density tokens drive sizing.

---

## Typography

The full type ramp is upstream-locked in `src/index.css` (`--text-3xs`..`--text-3xl`); this phase USES exactly the four roles below. Family: `'Inter Variable'` EN / Tajawal AR; mono `'JetBrains Mono Variable'`.

| Role         | Size                            | Weight | Line Height | Used on                                                                             |
| ------------ | ------------------------------- | ------ | ----------- | ----------------------------------------------------------------------------------- |
| Body         | 13px (`--text-base`, 0.8125rem) | 400    | 1.5         | popover option labels, empty-state body, peek section content                       |
| Label / meta | 12px (`--text-sm`, 0.75rem)     | 400    | 1.4         | result counts, chips, group headers (muted), key glyphs (mono), peek counter (mono) |
| Heading      | 14px (`--text-lg`, 0.875rem)    | 600    | 1.2         | empty-state titles, popover section titles, drawer head title row                   |
| Display      | 16px (`--text-xl`, 1rem)        | 600    | 1.2         | peek panel dossier name (DrawerHead), large empty-state title (`size="lg"`)         |

Weights: **exactly two — 400 (regular) and 600 (semibold).** Do not introduce 500/700 in new Phase-87 code (Tajawal maps 400→400, 600→700 at the font-cascade level; that is the font stack's business, not a declared weight).

Mono usage contract: peek counter (`3 / 15`), key glyphs (`⌘K`, `G` `D`), and any `T-3`/`T+2` windows render in `'JetBrains Mono Variable'` inside a `dir="ltr"` isolation span in AR (per `frontend/DESIGN.md` §RTL cascade).

Voice attached to type (non-negotiable, `frontend/DESIGN.md` + `/CLAUDE.md`): sentence case for all titles, buttons, menu items, group headers. UPPERCASE only for classification ribbons, mono labels, table-column headers (the drawer's existing `SUMMARY`/`UPCOMING` mono section labels stay). No emoji, no exclamation marks, no "Discover/Easily/Unleash", no first-person plural.

---

## Color

All values are `var(--*)` tokens / `@theme` utilities (`bg-bg`, `bg-surface`, `bg-surface-3`, `bg-surface-4`, `text-ink`, `text-ink-mute`, `text-ink-faint`, `border-line`, `border-line-strong`, `bg-accent`, `bg-accent-hover`, `text-danger`) — **no raw hex, no Tailwind palette literals** (ESLint errors). Hex below is documentation of the dark-canonical values from `frontend/DESIGN.md`; light mode derives automatically via the token engine.

| Role            | Value (dark canonical)                                                                                                                                                                                      | Usage                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Dominant (60%)  | `--bg` `#010102` / `--surface` `#0f1011`                                                                                                                                                                    | canvas + cards/topbar/list rows                                                           |
| Secondary (30%) | surface ladder: `--surface-raised` `#141516` · `--surface-3` `#18191a` (Filter/Display popovers, ⌘K menu) · `--surface-4` `#191a1b` (peek panel) + hairlines `--line` `#23252a` / `--line-strong` `#34343a` | layering — borders express elevation, never card shadows                                  |
| Accent (10%)    | `--accent` `#5e6ad2` (hover `--accent-hover` `#828fff`, on-accent `--accent-fg` `#ffffff`)                                                                                                                  | see reserved-for list below                                                               |
| Destructive     | `--danger` `#e86154` dark / `#be241f` light                                                                                                                                                                 | error text in peek/popover error states only — **no destructive actions ship this phase** |

**Accent reserved for (exhaustive for Phase 87):**

1. The ONE `.btn-primary` CTA per rich empty state (F26)
2. Focus rings (`--focus-ring`) on every new interactive element
3. Active/on states: checked Display-popover toggles, selected Filter-builder options, active filter-trigger indicator dot
4. The existing `.btn-primary` recipes untouched elsewhere

Accent is **never** used for: popover surfaces, chips at rest, group headers, counters, chevrons, hover fills (hover = `--line-soft` background fade per `frontend/DESIGN.md` §Elevation).

**Elevation contract for the new surfaces:**

- Peek panel (F23): `--surface-4` + `1px solid var(--line)` + `--shadow-drawer` — the ONLY shadow this phase.
- Filter/Display popovers + ⌘K menu (F24/F25): `--surface-3` + `1px solid var(--line)`, **no shadow**, radius `--radius`.
- Empty states (F26): on `--surface` (or transparent inside cards); icon wrapper wash on `--surface-raised`; no shadow, no gradient.
- Hovered option rows / list rows: background fades to `--line-soft`. Never lift, never scale.

---

## Copywriting Contract

Global rules: sentence case; Latin digits in BOTH locales (project digit policy D, `lib/format-locale`); unit/label text localized; no marketing voice; no `!`; no "we". EN keys drive AR — every new/changed key lands in `src/i18n/{en,ar}/<ns>.json` AND the namespace stays registered in `src/i18n/index.ts`. Address namespaces with the COLON form (`t('dossier-drawer:peek.counter')`) — the dot form leaks raw keys.

### Template-required baseline

| Element                              | Copy                                                                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary CTA (representative)         | "Add country" (per-surface verb + noun — full matrix below)                                                                                               |
| Empty state heading (representative) | "No country dossiers"                                                                                                                                     |
| Empty state body (representative)    | "Country dossiers track diplomatic relations, engagements, and commitments per state."                                                                    |
| Error state (representative)         | "Could not load this dossier" + "Try refreshing the page or open the full dossier." + button "Retry" (existing `dossier-drawer:error.*` — reuse verbatim) |
| Destructive confirmation             | none — Phase 87 ships no destructive actions                                                                                                              |

### F23 — Peek panel (namespace `dossier-drawer`, extend existing)

| Key (proposed)          | EN copy                    | Notes                                                |
| ----------------------- | -------------------------- | ---------------------------------------------------- |
| `peek.counter`          | `{{position}} / {{total}}` | Latin digits, JetBrains Mono, `dir="ltr"` span in AR |
| `peek.prev`             | "Previous row"             | aria-label on the up chevron                         |
| `peek.next`             | "Next row"                 | aria-label on the down chevron                       |
| `cta.open_full_dossier` | "Open full dossier"        | EXISTS — reuse, do not duplicate                     |
| `error.*`, `empty.*`    | existing keys              | reuse verbatim                                       |

### F24 — Filter + Display popovers (new namespace `list-controls`; reuse `active-filters` keys where noted)

| Key (proposed)              | EN copy                                  | Notes                                                                                                                                                                           |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filter.trigger`            | "Filter"                                 | trigger button label, lucide `ListFilter` icon                                                                                                                                  |
| `filter.trigger_active`     | "Filter · {{count}}"                     | active-filter count, Latin digits                                                                                                                                               |
| `filter.search_placeholder` | "Filter by..."                           | builder search input                                                                                                                                                            |
| `filter.option_count`       | `{{count}}`                              | per-option live result count, `text-ink-faint`, inline-end aligned                                                                                                              |
| `filter.no_matches`         | "No filters match"                       | builder search empty                                                                                                                                                            |
| `filter.clear_all`          | "Clear all"                              | reuse `active-filters:clearAll`                                                                                                                                                 |
| `filter.showing`            | "Showing {{count}} of {{total}} results" | reuse `active-filters:showingFiltered`                                                                                                                                          |
| `display.trigger`           | "Display"                                | trigger button label, lucide `SlidersHorizontal` icon                                                                                                                           |
| `display.grouping`          | "Group by"                               | reuse the kanban wording (`unified-kanban:columnModes.label`) — the Display popover GENERALIZES that toggle; on kanban the standalone toggle folds into Display, not duplicated |
| `display.grouping_none`     | "No grouping"                            | default on flat lists                                                                                                                                                           |
| `display.ordering`          | "Sort by"                                | mirrors `unified-kanban:sorting.label`                                                                                                                                          |
| `display.order_direction`   | "Ascending" / "Descending"               | `display.asc` / `display.desc`                                                                                                                                                  |
| `display.properties`        | "Display properties"                     | section title above column/property toggle chips                                                                                                                                |
| `display.reset`             | "Reset to default"                       | ghost action, end of popover                                                                                                                                                    |

### F25 — Command menu (namespace `keyboard-shortcuts`, audit + extend existing)

| Element                            | Contract                                                                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Group headers                      | Sentence case, muted (`text-ink-faint`, 12px): "Recent", "Suggested", "Create", "Navigate", "Countries" … (the 8 `quickswitcher.groups.*` dossier-type headings), "Commands"             |
| Command labels                     | **Sentence-case pass required** — existing Title Case ("Create New Task", "Go to Dashboard") becomes "Create task", "Go to dashboard", etc. across `keyboard-shortcuts.json` EN + AR     |
| Key glyphs                         | Inline-end aligned, JetBrains Mono, 12px, `--surface-raised` badge at `--radius-sm`, `dir="ltr"`-isolated in AR (`⌘K`, `⇧⌘I`, `G` `D`)                                                   |
| Empty state                        | "No results found." + "Try a different search term." (existing `noResults`/`tryDifferentSearch` — keep, already compliant)                                                               |
| Working-command audit              | Every rendered command must navigate/execute — commands whose routes/actions are dead are removed or fixed, not hidden                                                                   |
| High-value additions (minimum set) | "Create MoU" (Phase-86 route), "Create user" (admin-gated), "Toggle theme", "Switch language" — each with EN+AR labels; planner may add more from `analyze-commands.ts` context patterns |

### F26 — Empty states (namespace `empty-states`, extend + copy-edit existing)

Pattern A — **rich** (list pages, `EmptyState` `variant="default|card"`, `size="md|lg"`): glyph cluster + heading + one-sentence purpose body + ONE accent CTA (`.btn-primary`). Pattern B — **minimal** (dossier-detail tabs, drawer sections, `variant="compact"`): single glyph + one line, no accent CTA (optional ghost action).

Per-surface matrix (Pattern A; keys under `empty-states:list.<entity>.*`):

| Surface                             | Heading                    | Body                                                                                         | CTA (accent)                                                            |
| ----------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Countries                           | "No country dossiers"      | "Country dossiers track diplomatic relations, engagements, and commitments per state."       | "Add country"                                                           |
| Organizations                       | "No organization dossiers" | "Organization dossiers cover international bodies, agencies, and ministries."                | "Add organization"                                                      |
| Forums                              | "No forum dossiers"        | "Forum dossiers track multi-party conferences and summits."                                  | "Add forum"                                                             |
| Engagements                         | "No engagements"           | "Engagements record meetings, consultations, and visits, and feed after-action commitments." | "Log engagement"                                                        |
| Topics                              | "No topic dossiers"        | "Topic dossiers follow policy areas and strategic initiatives."                              | "Add topic"                                                             |
| Working groups                      | "No working groups"        | "Working-group dossiers track committees and task forces."                                   | "Add working group"                                                     |
| Persons                             | "No person dossiers"       | "Person dossiers track VIPs and key contacts."                                               | "Add person"                                                            |
| Elected officials                   | "No elected officials"     | "Elected-official dossiers hold office and term details for government contacts."            | "Add elected official"                                                  |
| Work items / kanban                 | "No work items"            | "Work items collect tasks, commitments, and intake requests across dossiers."                | "Create work item"                                                      |
| Filtered-empty (all core-set lists) | "No matching rows"         | "No rows match the current filters."                                                         | ghost "Clear filters" (NOT accent — clearing is recovery, not creation) |

Dossier-detail tabs (Pattern B, one line each — extend `dossier-drawer:empty.*` style): "No engagements recorded for this dossier." / "No positions linked to this dossier." / "No MoUs linked to this dossier." / "No commitments open for this dossier." / "No documents attached to this dossier." / "No relationships mapped for this dossier."

**Required copy-edit debt:** existing `empty-states.json` violates the voice rules — Title Case ("No Results Found", "Start Your Search", "Get Started"), first-person plural ("We couldn't find anything…", "We encountered an error…"). The F26 pass sentence-cases and de-"we"s every key it touches on the core-set surfaces. `ListEmptyState`'s `EntityType` union gains `topic`, `working_group`, `elected_official` (currently missing).

---

## Interaction Contract

States every feature must implement. All new interactive elements: focus ring in `--accent`, keyboard reachable, `aria-label`s from i18n.

### F23 — Right-peek panel (AFF-01)

| State             | Contract                                                                                                                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger           | Row click on a core-set list row opens the peek (URL param via `useDossierDrawer.openDossier` — browser back closes, refresh restores; work-item rows use the equivalent work-item drawer infra mounted in `_protected.tsx` with the same head pattern)                     |
| Open              | Sheet `side="right"` with the existing logical `end-0` variant — mirrors to inline-start in RTL automatically. **Never `isRTL`-flip the `side` prop** (PR #95 lesson). `--surface-4`, `--shadow-drawer`, width `min(720px, 92vw)`, full-screen below 768px (existing shell) |
| Counter           | `3 / 15` = 1-based position within the CURRENT filtered+sorted list (the list the user clicked from, including active F24 filters). Mono, Latin digits, `dir="ltr"` isolated in AR, placed in `DrawerHead`                                                                  |
| Prev/next         | Chevron-up / chevron-down icon buttons (vertical — no RTL icon flip needed), `.btn-ghost` recipe, adjacent to the counter. Paging swaps `?dossier=` params with `replace: true` (no history spam per step)                                                                  |
| Boundary          | First row: prev disabled (`disabled` + `aria-disabled`, `text-ink-tertiary`); last row: next disabled. No wrap-around                                                                                                                                                       |
| Loading           | Existing `DrawerSkeleton` while the overview query loads; counter + chevrons stay interactive during body load                                                                                                                                                              |
| Error             | Existing `role="alert"` branch: `error.load_failed_heading` + body + "Retry" — reuse verbatim                                                                                                                                                                               |
| Exit to full page | Existing "Open full dossier" CTA navigates to the detail route; Escape and scrim-click close the peek                                                                                                                                                                       |
| Deferred          | intake / commitments / positions / mous list rows do NOT get the peek this phase                                                                                                                                                                                            |

### F24 — Filter + Display popovers (AFF-02)

| State           | Contract                                                                                                                                                                                                                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Triggers        | Two separate `.btn-ghost` buttons in the list-page toolbar: "Filter" (lucide `ListFilter`) and "Display" (lucide `SlidersHorizontal`). Filter shows "Filter · N" when N > 0 filters active                                                                                                                                                             |
| Popover surface | `--surface-3`, `1px solid var(--line)`, `--radius`, no shadow, anchored inline-end of the trigger, mirrors in RTL via logical positioning (Radix/HeroUI popover primitive handles placement — no manual flip)                                                                                                                                          |
| Filter builder  | Option list grouped by property (status, type, priority, owner, date — per-surface set is planner scope); each option row at `var(--row-h)` shows label (start) + live result count (end, `text-ink-faint`, Latin digits). Selecting applies immediately (no Apply button) and emits a chip                                                            |
| Chips           | Reuse the `ActiveFiltersBar` chip pattern (`FilterChipConfig`): label + value + per-chip remove (×), `--radius-sm`, "Clear all" when ≥ 2 chips. Chip bar shows "Showing N of M results"                                                                                                                                                                |
| Live counts     | Counts reflect the CURRENT other-filter selection (facet counts); when a count is 0 the option stays selectable but renders `text-ink-tertiary`                                                                                                                                                                                                        |
| Display popover | Three stacked sections: "Group by" (radio-style options; kanban's existing By status / By dossier / By owner toggle FOLDS INTO this — do not render both), "Sort by" (field + Ascending/Descending), "Display properties" (toggle chips per column/property; toggled-off columns hide from the list/table). "Reset to default" ghost action at the end |
| Persistence     | Filter + display selections persist in URL search params (URL-as-state per project patterns) so views are shareable; planner decides param schema                                                                                                                                                                                                      |
| Empty           | Builder search with no matches: "No filters match" one-liner (Pattern B)                                                                                                                                                                                                                                                                               |
| Deferred        | intake / commitments / positions / mous toolbars unchanged this phase                                                                                                                                                                                                                                                                                  |

### F25 — Command menu audit (AFF-03)

| State                | Contract                                                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open                 | `⌘K` / `Ctrl+K` + topbar affordance (existing). Menu on `--surface-3`, `--radius`, `1px solid var(--line)`                                                                                            |
| Grouped default view | Context-aware sections in order: Recent → Suggested (route-context patterns from `analyze-commands.ts`) → Create → Navigate; muted 12px sentence-case headers                                         |
| Search view          | Grouped results: dossier-type groups (8), Pages, Work items, Commands; option rows at `var(--row-h)` (compact acceptable)                                                                             |
| Key glyphs           | Inline-end aligned mono badges (see Copywriting F25); in AR the glyph badge keeps `dir="ltr"` while the row layout mirrors                                                                            |
| Audit gate           | Every advertised command executes its navigation/action — verified per command; dead commands fixed or removed (no hidden rows). Note: cmdk hardcodes the listbox id — don't fight it for aria wiring |
| Additions            | Minimum set per Copywriting F25, each grouped correctly with EN+AR labels                                                                                                                             |
| Empty / error        | Existing `noResults` + `tryDifferentSearch`; command execution failures surface via the target surface's own error handling (the menu closes on execute)                                              |

### F26 — Rich empty states (AFF-04)

| State                                             | Contract                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List-page empty (no data at all)                  | Pattern A rich state, centered in the list area: glyph cluster (entity lucide icon in a `--surface-raised` `rounded-full` wash — extend `EmptyState`'s existing wrapper), heading (14–16px / 600), one-sentence body (13px / 400, `text-ink-mute`, `max-w-md`), ONE `.btn-primary` CTA. CTA respects permissions — if the user cannot create, render without CTA (never a disabled accent button) |
| Filtered-empty (data exists, filters exclude all) | Distinct from no-data: "No matching rows" + ghost "Clear filters" wired to the F24 clear-all. Never show the create-CTA state when filters are the cause                                                                                                                                                                                                                                          |
| Dossier-detail tabs / drawer sections             | Pattern B minimal: single glyph (16–20px, `text-ink-faint`) + one line (13px, `text-ink-mute`). No accent, no card chrome                                                                                                                                                                                                                                                                         |
| Loading                                           | Skeletons (existing per-surface) — an empty state must never flash while a query is in flight; render only on settled-empty                                                                                                                                                                                                                                                                       |
| Error                                             | Error states are NOT empty states: `role="alert"`, heading + recovery line + "Retry" ghost button (mirror the drawer's error branch)                                                                                                                                                                                                                                                              |
| RTL                                               | `EmptyState` is already logical-property based; body text uses `text-start`-neutral centered layout; icons are non-directional                                                                                                                                                                                                                                                                    |

---

## Registry Safety

| Registry        | Blocks Used | Safety Gate                                                                                                                                |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| shadcn official | none        | not applicable — no `shadcn add` permitted this phase (Linear engine + HeroUI/Radix cascade only; shadcn defaults banned per `/CLAUDE.md`) |
| third-party     | none        | not applicable — no third-party registries declared; vetting gate not triggered (2026-07-07)                                               |

No new dependencies are authorized by this contract. If a primitive gap appears (e.g. a popover behavior HeroUI v3/Radix cannot cover), STOP and ask — do not install.

---

## Checker Notes (pre-baked resolutions for recurring false-positives)

1. **Typography ≤ 4 sizes:** the `src/index.css` ramp (`--text-3xs..3xl`) is upstream design-system infrastructure, not this phase's declaration. Phase 87 declares and uses exactly the 4 roles in §Typography. Do not flag the ramp.
2. **Spacing multiples-of-4:** density literals (`compact --pad-inline: 14px`, `--row-h: 52px`) are upstream-locked tokens from `tokens/densities.ts` (Phase 33/41), listed as exceptions. New Phase-87 spacing stays on the 4px grid.
3. **Hex values in this document** are transcriptions from `frontend/DESIGN.md` for reference; implementation uses `var(--*)` tokens exclusively (ESLint-enforced).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
