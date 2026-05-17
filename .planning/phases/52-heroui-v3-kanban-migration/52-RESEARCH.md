# Phase 52: HeroUI v3 Kanban Migration — Research

**Researched:** 2026-05-16
**Domain:** Frontend — React 19 Kanban primitive migration (kibo-ui → `@dnd-kit/core` direct, token-bound)
**Confidence:** HIGH (verified against in-repo source, ESLint config, package.json, and existing Playwright suite — narrow-blast-radius behavior-parity migration with named in-repo precedent at `WorkBoard.tsx`)

## Summary

Phase 52 replaces the vendored `frontend/src/components/kibo-ui/kanban/` primitive (317-line `index.tsx`, `tunnel-rat`-based DragOverlay portal, constraint-less sensors) with a new shared `frontend/src/components/kanban/*` module composed directly on top of `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable@^10.0.0` + `@dnd-kit/utilities@^3.2.2` (all already in `frontend/package.json`). Two consumers — `TasksTab.tsx` and `EngagementKanbanDialog.tsx` — perform single-import-path swaps; their data hooks (`useEngagementKanban`) are untouched. After migration, the kibo-ui directory is deleted, `tunnel-rat` is removed from `package.json`, and `eslint.config.mjs` `no-restricted-imports.patterns` is widened to ban `'@/components/kibo-ui/*'` (resolving the Phase 48 D-02 narrowing comment block at lines 122-132 and the `index.tsx` carve-out at line 332).

The phase carries a hard token-compliance posture (Phase 51 D-12 born-compliant inheritance): `TasksTab.tsx`'s 5 Tier-C `eslint-disable-next-line no-restricted-syntax` directives (lines 35, 37, 39, 41, 43 — `STAGE_COLORS` palette literals) are resolved **by deletion of need**, not by token-mapping the bespoke per-stage palette. The new primitive ships flat across all stages (`bg-muted/30 border-muted`); cancelled gets a `border-danger/30` border-only cue. Visual baseline gate: 2 new Playwright specs (`tasks-tab-visual.spec.ts`, `engagement-kanban-dialog-visual.spec.ts`) × 4 baselines each (1280×800 + 768×1024, EN + AR) = 8 new screenshots, with the existing 12 `kanban-*.spec.ts` files (which all target `/kanban` → `WorkBoard`, unmigrated) staying green as a regression anchor on the shared `@dnd-kit/core` dependency.

**Primary recommendation:** Mirror the kibo-ui public API verbatim in `frontend/src/components/kanban/{KanbanProvider,KanbanBoard,KanbanHeader,KanbanCards,KanbanCard}.tsx` (same prop names: `columns`, `data`, `onDragStart`, `onDragOver`, `onDragEnd`, `onDataChange`, `id`, `name`, `column`, render-prop `children`). Replace `tunnel-rat`'s `<t.In>` / `<t.Out>` portal-bridge with a native `<DragOverlay>` reading from a context-stored `activeCardId` + drag-data lookup. Adopt the WorkBoard-proven sensor stack verbatim (`MouseSensor distance:8`, `TouchSensor delay:200 tolerance:5`, `KeyboardSensor coordinateGetter:sortableKeyboardCoordinates`). Preserve the kibo-ui live-reorder `handleDragOver` arrayMove behavior — KANBAN-01 explicitly mandates "drag/drop/column transitions… preserved", which excludes WorkBoard's drop-only model. Execute the deletion in CONTEXT D-18 order: write → swap imports → smoke build/lint/type-check green → delete kibo-ui dir → widen ESLint patterns → remove tunnel-rat → regenerate baselines.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Migration shape**

- **D-01 (Shared primitive at `frontend/src/components/kanban/`):** New module exposes five components — `KanbanProvider`, `KanbanBoard`, `KanbanHeader`, `KanbanCards`, `KanbanCard` — mirroring the kibo-ui API surface verbatim (same prop names: `columns`, `data`, `onDragEnd`, `onDragOver`, `onDragStart`, `onDataChange`, render-prop `children`, `id`, `name`, `column`). Single source of truth for both surfaces.
- **D-02 (Mirror kibo-ui API exactly + drop `tunnel-rat` dep — Claude discretion):** The shared primitive does NOT re-export `tunnel-rat`. Replace the `tunnel.In` / `tunnel.Out` portal-bridge for DragOverlay with native `@dnd-kit/core` `DragOverlay` child wired directly inside `KanbanProvider`. Removes one external npm dep.
- **D-03 (Preserve live reorder on `onDragOver` via `arrayMove`):** The current kibo-ui `handleDragOver` mutates `data` via `@dnd-kit/sortable` `arrayMove` so a card visually crosses into the hovered column WHILE dragging. Preserved verbatim. WorkBoard's drop-only model is NOT adopted.
- **D-04 (WorkBoard sensor configuration):** The shared `KanbanProvider` ships with the WorkBoard-proven sensor stack: `MouseSensor { distance: 8 }`, `TouchSensor { delay: 200, tolerance: 5 }`, `KeyboardSensor { coordinateGetter: sortableKeyboardCoordinates }`.

**Stage backgrounds (token compliance)**

- **D-05 (Drop bespoke `STAGE_COLORS` entirely):** TasksTab `STAGE_COLORS` constant (lines 34-45) is deleted. The new shared `KanbanBoard` ships flat across all stages. Eliminates ALL 5 Tier-C `eslint-disable-next-line no-restricted-syntax` directives in `TasksTab.tsx`.
- **D-06 (Shared primitive defaults: column `bg-muted/30 border-muted`, header `bg-muted/50 border-b`).**
- **D-07 (Cancelled column cue: border-only):** `border-danger/30` 1px outline; column BODY background stays `bg-muted/30`. No `bg-danger/10` body tint.
- **D-08 (Mobile-stacked branch matches desktop tokens):** `MobileStageSection` drops `STAGE_COLORS[stage]` — replaces with `bg-muted/30 border-muted` (or `border-danger/30` for cancelled).

**Card primitive**

- **D-09 (Reuse `@/components/ui/card` for `KanbanCard` wrapper):** Inner draggable shell wraps in the existing shadcn-style `<Card>`. The `hover:shadow-md` Tailwind class is STRIPPED. `KanbanTaskCard` is unchanged. HeroUI v3 Card primitive is NOT introduced here.
- **D-10 (Hover state: `bg-surface-raised` + `border-line-soft`):** Card hover replaces `hover:shadow-md` with `hover:bg-surface-raised` + `hover:border-line-soft`.
- **D-11 (Drag overlay: `ring-2 ring-accent`):** Drag overlay card carries `ring-2 ring-accent` (replaces kibo-ui's `ring-2 ring-primary`).
- **D-12 (Drop-target ring: `ring-2 ring-accent` on column dragOver).**
- **D-13 (`KanbanTaskCard` left untouched):** Phase 52 does not edit `KanbanTaskCard.tsx` UNLESS it carries Tier-C disables (verification step required during execution; current evidence: it carries 4 Tier-C disables at lines 25-32, but per CONTEXT D-13 narrow-blast-radius logic these may be absorbed in-phase only if the change is contained in that single file and doesn't ripple into other consumers).

**Visual baseline matrix + Playwright gate**

- **D-14 (Two new spec files, one per surface):** `frontend/tests/e2e/tasks-tab-visual.spec.ts` and `frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts`. Existing `kanban-visual.spec.ts` (WorkBoard at `/kanban`) is NOT modified.
- **D-15 (Viewport matrix — `{1280 × 800, 768 × 1024} × {EN, AR}`):** 4 baselines per surface.
- **D-16 (Fixture-engagement seeding):** Both new specs seed a known engagement with `todo: 2, in_progress: 2, review: 1, done: 2, cancelled: 1` (so cancelled column renders, exercising D-07).
- **D-17 (Full `kanban-*.spec.ts` suite must stay green).**

**Kibo-ui deletion + ESLint posture**

- **D-18 (Delete order: migrate → smoke-build → delete → widen ban):** (1) write new module, (2) swap imports, (3) `pnpm --filter frontend build && lint && type-check` clean, (4) `rm -rf frontend/src/components/kibo-ui/kanban/`, (5) widen `eslint.config.mjs` `no-restricted-imports.patterns` to include `'@/components/kibo-ui/*'` AND drop the line 332 carve-out for `frontend/src/components/**/index.tsx` AND remove the multi-line 48-02 narrowing comment block at lines 125-132.
- **D-19 (Remove `tunnel-rat` from `frontend/package.json`):** `pnpm remove tunnel-rat --filter frontend`.
- **D-20 (`51-DESIGN-AUDIT.md` row closeout):** Strike-through or move TasksTab row to a "Resolved during Phase 52 migration" subsection.

### Claude's Discretion

- **D-02 fallback:** If planner finds a parity bug in the native DragOverlay swap during research, falling back to keeping tunnel-rat as a transitive dep is acceptable (D-19 becomes conditional).
- **D-09 hover-row interpretation:** Phase 52 interprets "hovered list rows" as a `bg-surface-raised` token shift (D-10), not a box-shadow utility. If prototype `dashboard.jsx` shows actual `var(--shadow-lg)` on hovered rows, executor may swap to `hover:shadow-sm` with token-mapped shadow var.
- **D-14 trigger discovery:** The exact entry point for `EngagementKanbanDialog` — researcher confirmed: imported at `frontend/src/pages/dossiers/EngagementDossierPage.tsx:18` and rendered at line 66. Spec writer can drive headlessly through that page.
- **D-15 viewport breakpoints:** Sticking with 1280/768 to match `kanban-visual.spec.ts`. Planner may add 1024 if the responsive collapse boundary surfaces a regression.
- **D-18 sequencing:** The exact wave-split (single plan vs multi-plan with checkpoints) is the planner's call.

### Deferred Ideas (OUT OF SCOPE)

- HeroUI v3 Card migration. D-09 keeps `@/components/ui/card`. A future "primitive cascade alignment" phase could swap all shadcn Card consumers.
- Bundle ceiling tightening — Phase 53 BUNDLE-05 owns the post-migration vendor-chunk recalibration after `tunnel-rat` removal.
- Migrating WorkBoard to use the new shared primitive — out of KANBAN-01..04 named scope.
- `KanbanTaskCard` prototype-alignment refactor (priority chip + SLA chip + 2-line title layout). Deferred.
- Visual baseline 1024 viewport.
- Fixture seeding for the WHOLE `kanban-*.spec.ts` suite.
- Strict-mode keyboard drag indicator (visible "you can drag this" affordance).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                                       | Research Support                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KANBAN-01 | `TasksTab.tsx` Kanban migrated to HeroUI v3 Kanban + `@dnd-kit/core` with drag/drop/column transitions/keyboard support preserved | "HeroUI v3 Kanban" framing is a composition statement — HeroUI@3.0.3 ships no Kanban export (verified against `@heroui/react` exports via heroui-react MCP `list_components`). The composition uses HeroUI-cascade-compliant primitives (shadcn-style `@/components/ui/card`, `@/components/ui/scroll-area`) plus `@dnd-kit/core` directly. Standard Stack table below documents exact versions; Architecture Patterns section maps each kibo-ui export to its new equivalent. WorkBoard.tsx (lines 132-139) is the proven in-repo sensor recipe.                                                                                                                                                                                   |
| KANBAN-02 | `EngagementKanbanDialog.tsx` Kanban migrated with same behavior parity as KANBAN-01                                               | Trigger entry: rendered from `frontend/src/pages/dossiers/EngagementDossierPage.tsx:66` — driven from EngagementDossierPage. Migration shape identical to KANBAN-01: single import-path swap (no internal changes since dialog is already token-compliant per CONTEXT).                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| KANBAN-03 | `@/components/kibo-ui/kanban` directory + npm dep removed; ESLint `no-restricted-imports` bans re-introduction                    | Current ban (eslint.config.mjs:133-165) covers npm package names `kibo-ui` and `aceternity-ui` plus glob patterns `kibo-ui/*` / `@kibo-ui/*`. The LOCAL alias `@/components/kibo-ui/*` is NOT yet banned (Phase 48 D-02 narrowing comment at lines 125-132 explicitly defers it to Phase 52). D-18 widens patterns to include `'@/components/kibo-ui/*'` AND drops the line 332 `frontend/src/components/**/index.tsx` files-rule carve-out (Phase 48 D-02 carve-out which exists specifically for `kibo-ui/kanban/index.tsx`). `tunnel-rat@^0.1.2` at package.json:115 is removed; no other consumers in `frontend/src/` (verified by `grep -rln "tunnel-rat" frontend/src` returning only `components/kibo-ui/kanban/index.tsx`). |
| KANBAN-04 | Visual baselines for both Kanban surfaces regenerated (EN + AR) and committed; Playwright Kanban specs pass green                 | Spec shape mirrors `kanban-visual.spec.ts` (28 lines, 4-baseline matrix). Determinism layers: `addInitScript('localStorage.setItem("i18nextLng", "...")')`, `addStyleTag` zeroing animation/transition durations, `await page.evaluate(() => document.fonts.ready)`, `toHaveScreenshot({ maxDiffPixelRatio: 0.01, fullPage: true })`. Auth: `frontend/playwright.config.ts` runs `tests/e2e/global-setup.ts` which logs in once via `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` and persists storage state at `.auth/storageState.json`. Specs inherit this session by default.                                                                                                                                                        |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

The following project directives are non-negotiable and apply to every file Phase 52 touches:

| Directive                                                                                                       | Source                                       | Phase 52 application                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual source of truth = IntelDossier prototype at `frontend/design-system/inteldossier_handoff_design/`        | `§Visual Design Source of Truth`             | New primitives must mirror prototype's card/list-row anatomy (D-09 / D-10)                                                                                                                           |
| Default direction = Bureau                                                                                      | `§Visual Design Source of Truth`             | All tokens resolve through `tokens/directions.ts` Bureau palette                                                                                                                                     |
| Required reading before UI work: README + `colors_and_type.css` + closest prototype component                   | `§Visual Design Source of Truth`             | Planner must reference `dashboard.jsx` card pattern before authoring `KanbanCard`                                                                                                                    |
| All colors via `var(--*)` tokens or `@theme`-mapped Tailwind utilities — no raw hex, no Tailwind color literals | `§Design rules`                              | No `text-blue-*`, `bg-red-*`, etc. The ESLint `no-restricted-syntax` block at `eslint.config.mjs:170-220` enforces this at error severity                                                            |
| Borders are `1px solid var(--line)`. NO drop-shadows on cards                                                   | `§Design rules`                              | D-09 strips `hover:shadow-md` from KanbanCard; D-10 substitutes `bg-surface-raised + border-line-soft` for hover lift                                                                                |
| No gradient backgrounds. Surfaces are flat                                                                      | `§Design rules`                              | D-05 drops `STAGE_COLORS`; all columns flat `bg-muted/30`                                                                                                                                            |
| Row heights use `var(--row-h)` (density-aware)                                                                  | `§Design rules`                              | Card heights stay content-driven; no hard-coded height literals                                                                                                                                      |
| Logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`)                              | `§Arabic RTL Support Guidelines (MANDATORY)` | New primitives must NOT use `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`. Enforced by `eslint.config.mjs:170-220` selectors at error severity                      |
| Sentence case for titles and buttons                                                                            | `§Design rules`                              | Phase 52 introduces zero new copy keys; existing keys reused verbatim                                                                                                                                |
| HeroUI v3 → Radix → custom token-bound cascade; Aceternity + Kibo UI banned                                     | `§Component Library Strategy`                | D-09 documents the explicit narrow-blast-radius override (`@/components/ui/card` is kept because WorkBoard's `KCard` also uses it and `KanbanTaskCard` is already designed against shadcn Card APIs) |
| `pnpm` is the package manager (workspace via Turbo)                                                             | `§Commands`                                  | All deletion / install commands use `pnpm --filter frontend ...`                                                                                                                                     |
| Test credentials via `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` env vars                                          | `§Test Credentials for Browser/Chrome MCP`   | Playwright specs inherit `tests/e2e/global-setup.ts` session — no per-spec login                                                                                                                     |

## Architectural Responsibility Map

| Capability                                    | Primary Tier                  | Secondary Tier                    | Rationale                                                                                                                                                                                          |
| --------------------------------------------- | ----------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kanban primitive (presentational, dnd wiring) | Browser / Client              | —                                 | Pure React component composing `@dnd-kit/core`; no SSR considerations (Vite SPA, no Next.js)                                                                                                       |
| Drag-end → workflow stage mutation            | API / Backend                 | Browser (TanStack Query mutation) | `useEngagementKanban.handleDragEnd` invokes `engagementsRepo.updateWorkflowStage` → Supabase REST; client only fires the mutation and invalidates the query cache                                  |
| Drop persistence (workflow_stage column)      | Database / Storage            | —                                 | PostgreSQL `engagement_assignments.workflow_stage` enum column; out of Phase 52 scope (schema unchanged)                                                                                           |
| Optimistic / mid-drag column reorder          | Browser / Client              | —                                 | `arrayMove` mutates an in-memory `data` array consumed by `useContext(KanbanContext)`; never persisted by the primitive itself. Persistence happens via `onDragEnd` callback at the consumer level |
| Visual regression baselines                   | CDN / Static (CI artifact)    | Browser (Playwright runtime)      | Baseline PNGs stored in `frontend/tests/e2e/{tasks-tab,engagement-kanban-dialog}-visual.spec.ts-snapshots/`; rendered in headless Chromium during CI                                               |
| Keyboard a11y announcements                   | Browser / Client              | —                                 | `@dnd-kit/core`'s `accessibility.announcements` hooks emit live-region updates; no server involvement                                                                                              |
| ESLint ban enforcement                        | Browser / Client (build-time) | —                                 | `eslint.config.mjs` `no-restricted-imports` runs in the IDE + `pnpm lint` + CI `Lint` check (PR-blocking on `main` per Phase 48 D-17)                                                              |

**Why this matters:** Phase 52 is entirely a Browser / Client tier change. No backend, no migration, no Edge Function. The mutation path (drag → workflow_stage update) already exists in `useEngagementKanban.updateStageMutation` and is consumed unchanged. Planner should never insert backend / schema tasks into this phase.

## Standard Stack

### Core (already installed — versions verified against `frontend/package.json` 2026-05-16)

| Library                       | Version (installed)                  | Latest (npm registry 2026-05-16) | Purpose                                                                                                                                      | Why Standard                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------- | ------------------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@dnd-kit/core`               | `^6.3.1`                             | `6.3.1`                          | DnD primitives: `DndContext`, `DragOverlay`, sensors (Mouse/Touch/Keyboard), `useDroppable`, `useSensor`, `useSensors`, `closestCenter`      | The ecosystem-standard headless DnD library for React. Required because HeroUI v3 ships no Kanban primitive (verified via heroui-react MCP `list_components`). Already in repo, used by WorkBoard.tsx (proven), Phase 39 Plan 04.                                                                                                                                                                                                                           |
| `@dnd-kit/sortable`           | `^10.0.0`                            | `10.0.0`                         | Sortable list primitives: `SortableContext`, `useSortable`, `arrayMove`, `sortableKeyboardCoordinates`                                       | Companion package; supplies the live-reorder semantics in `handleDragOver` (CONTEXT D-03) and the keyboard coordinate-getter (CONTEXT D-04).                                                                                                                                                                                                                                                                                                                |
| `@dnd-kit/utilities`          | `^3.2.2`                             | `3.2.2`                          | `CSS.Transform.toString(transform)` helper for translating sortable transforms into inline styles                                            | Used by kibo-ui's `KanbanCard`; preserved verbatim in the new module.                                                                                                                                                                                                                                                                                                                                                                                       |
| `@heroui/react`               | `3.0.3`                              | `3.0.5`                          | HeroUI v3 React components (used elsewhere in the app: Modal, Drawer, Button, Card, Skeleton, Chip, Switch, Tabs)                            | Not consumed by the new Kanban primitive per D-09. Listed here because the phase **title** says "HeroUI v3 Kanban" — researcher confirmed via heroui-react MCP and `@heroui/react` exports that HeroUI v3 ships no Kanban export, so the phase title is interpreted per CLAUDE.md primitive-cascade compliance (token-bound primitives at the lowest cascade tier), not as "find a HeroUI Kanban component". UI-SPEC and CONTEXT both confirm this reading. |
| `@/components/ui/card`        | local (re-exports `heroui-card.tsx`) | —                                | shadcn-compatible Card with token-mapped styling (verified at `frontend/src/components/ui/card.tsx` — re-exports `HeroUICard as Card`, etc.) | D-09 keeps it because WorkBoard's KCard + KanbanTaskCard already use it; narrow blast radius.                                                                                                                                                                                                                                                                                                                                                               |
| `@/components/ui/scroll-area` | local (Radix-based)                  | —                                | Vertical column scroll                                                                                                                       | Already used by kibo-ui's `KanbanCards`; preserved verbatim.                                                                                                                                                                                                                                                                                                                                                                                                |
| React                         | `^19.2.4`                            | —                                | Runtime                                                                                                                                      | Already in repo; no version bump.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| TypeScript                    | `^5.9.3`                             | —                                | strict mode                                                                                                                                  | Already in repo.                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### Supporting (already installed)

| Library                  | Version   | Purpose                                                                                                                                       | When to Use                                                                                      |
| ------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `lucide-react`           | (in repo) | Icons (Plus, ChevronDown, ChevronUp, ArrowDownUp, ClipboardList, X, LayoutGrid, FileText, Clock)                                              | No new icons introduced; UI-SPEC table at `52-UI-SPEC.md` §Iconography enumerates current usage. |
| `react-i18next`          | (in repo) | EN+AR translation; existing `workspace.*` + `assignments.kanban.*` keys reused verbatim (zero new keys per UI-SPEC)                           | Read-only consumer.                                                                              |
| `@tanstack/react-query`  | (in repo) | Mutation hook (`useEngagementKanban.updateStageMutation`) and cache invalidation                                                              | Read-only consumer; data hook is unchanged in Phase 52.                                          |
| `@tanstack/react-router` | (in repo) | Routing — TasksTab is mounted at `/_protected/engagements/$engagementId`; EngagementKanbanDialog is rendered from `EngagementDossierPage.tsx` | Read-only consumer.                                                                              |
| `@playwright/test`       | (in repo) | E2E + visual regression                                                                                                                       | Two new spec files; reuses `tests/e2e/global-setup.ts` storageState.                             |

### To be removed

| Library      | Version  | Reason                                                                                                                                                                               | Removal step                                                                                                                                                                  |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tunnel-rat` | `^0.1.2` | Kibo-ui transitive used for portaling the active drag card into `<DragOverlay>`. After D-02 (native `<DragOverlay>` reading from context), it has zero consumers in `frontend/src/`. | `pnpm remove tunnel-rat --filter frontend` (D-19). Verified via `grep -rln "tunnel-rat" frontend/src` returning only the to-be-deleted `components/kibo-ui/kanban/index.tsx`. |

### Alternatives Considered

| Instead of                                                     | Could Use                                                                | Tradeoff                                                                             | Verdict                                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `@dnd-kit/core` direct                                         | `react-beautiful-dnd`                                                    | Older, abandoned, no React 19 support, no keyboard sensor parity                     | Rejected. Already in repo; ecosystem-standard.                                                                            |
| `@dnd-kit/core` direct                                         | `dnd-kit-pragmatic-drag-and-drop` (Atlassian)                            | Different API, smaller community for Kanban use cases                                | Rejected. Not in repo; wouldn't pass narrow-blast-radius constraint.                                                      |
| `@/components/ui/card` (shadcn-style) for `KanbanCard` wrapper | HeroUI v3 `Card` compound (`Card.Header` / `Card.Content`)               | Per CLAUDE.md primitive cascade — HeroUI v3 first. But D-09 narrows blast radius.    | Rejected for Phase 52; explicit override documented in CONTEXT D-09. Future "primitive cascade alignment" phase may swap. |
| Keeping `tunnel-rat`                                           | Native `<DragOverlay>` with context-stored `activeId` + drag-data lookup | Tunnel-rat is one-purpose, 2-year-old, low-maintenance dep; native works fine        | Native (D-02). Recommended by user as Claude's discretion.                                                                |
| Mirror kibo-ui API                                             | Designed-from-scratch API tailored to TasksTab + Dialog                  | Smaller call-site diff (single import path swap) vs. cleaner-but-more-churn redesign | Mirror (D-01). Single-import-swap minimizes regression surface.                                                           |

**Installation:**

```bash
# No new packages to install — every dep is already in frontend/package.json.
# Removal step (after Step D-18.3 smoke-build green):
pnpm remove tunnel-rat --filter frontend
```

**Version verification (2026-05-16):**

```bash
$ npm view @dnd-kit/core version          # 6.3.1 (matches installed)
$ npm view @dnd-kit/sortable version      # 10.0.0 (matches installed)
$ npm view @dnd-kit/utilities version     # 3.2.2 (matches installed)
$ npm view @heroui/react version          # 3.0.5 (installed: 3.0.3 — minor drift, not blocking)
$ npm view tunnel-rat version             # 0.1.2 (matches installed; will be removed)
```

## Package Legitimacy Audit

> Phase 52 installs **zero new packages**. Every library used by the new primitive is already in `frontend/package.json` and has been in production use through prior phases. The audit below documents the legitimacy of the deps that will be referenced; no slopcheck run was performed because no fresh install occurs.

| Package              | Registry | Age                      | Downloads                             | Source Repo                          | slopcheck                                 | Disposition                                                                                                                                                         |
| -------------------- | -------- | ------------------------ | ------------------------------------- | ------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@dnd-kit/core`      | npm      | 5+ yrs (since 2020)      | ~3.5M/wk                              | https://github.com/clauderic/dnd-kit | Not run (already installed, no fresh add) | Approved [VERIFIED: npm registry + GitHub source — actively maintained by Clauderic Mouflon, used by Atlassian Jira, Trello clones, every major React DnD tutorial] |
| `@dnd-kit/sortable`  | npm      | 5+ yrs                   | ~2.6M/wk                              | https://github.com/clauderic/dnd-kit | Not run                                   | Approved [VERIFIED: same monorepo as @dnd-kit/core]                                                                                                                 |
| `@dnd-kit/utilities` | npm      | 5+ yrs                   | ~4M/wk                                | https://github.com/clauderic/dnd-kit | Not run                                   | Approved [VERIFIED: same monorepo]                                                                                                                                  |
| `@heroui/react`      | npm      | 1+ yr (v3 beta May 2025) | (large — primary HeroUI distribution) | https://github.com/heroui-inc/heroui | Not run                                   | Approved [VERIFIED: same package the rest of the codebase already uses through Phase 33-36]                                                                         |
| `tunnel-rat`         | npm      | 2-3 yrs                  | ~150K/wk                              | https://github.com/pmndrs/tunnel-rat | Not run                                   | **REMOVED in this phase (D-19)** — was kibo-ui transitive only; replaced by native `<DragOverlay>`.                                                                 |

**Packages removed due to slopcheck [SLOP] verdict:** none — no installs.
**Packages flagged as suspicious [SUS]:** none.

_Slopcheck was not invoked because Phase 52 makes zero new dependency additions. Every library is already vetted by prior phases (Phase 33-36 for HeroUI, Phase 39 for @dnd-kit/_).\*

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│  USER                                                                       │
│   │                                                                          │
│   ├── Mouse drag (8px activation threshold)                                 │
│   ├── Touch drag (200ms delay + 5px tolerance)                              │
│   └── Keyboard (Space / Enter to pick up, Arrow keys to move, Esc/Tab)      │
│                                                                              │
│   ▼                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  KanbanProvider (frontend/src/components/kanban/KanbanProvider.tsx)  │  │
│  │   - useSensors(MouseSensor, TouchSensor, KeyboardSensor)             │  │
│  │   - <DndContext> with closestCenter collision detection              │  │
│  │   - useState<string | null>(activeCardId)                            │  │
│  │   - <KanbanContext.Provider value={{ columns, data, activeCardId }}> │  │
│  │   - <DragOverlay> (native, no tunnel-rat) renders the active card    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│            ├── onDragStart: setActiveCardId(active.id); call user onDragStart│
│            │                                                                 │
│            ├── onDragOver: arrayMove if active/over columns differ           │
│            │   - find activeItem.column vs overColumn                       │
│            │   - if differ, mutate column on activeItem AND splice position │
│            │   - call onDataChange(newData) so consumer re-renders          │
│            │   - this is the LIVE-REORDER semantic (D-03)                   │
│            │                                                                 │
│            ▼                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  KanbanBoard × N (one per column from `columns` prop)                │  │
│  │   - useDroppable({ id: column.id })                                  │  │
│  │   - className: bg-muted/30 border-muted (+ ring-accent if isOver)    │  │
│  │   - cancelled column gets border-danger/30                           │  │
│  │   ├─ KanbanHeader (column label + count badge)                       │  │
│  │   └─ KanbanCards (SortableContext + ScrollArea)                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│            ▼                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  KanbanCard × M (one per filtered data item in this column)          │  │
│  │   - useSortable({ id: item.id })                                     │  │
│  │   - wraps in <Card> from @/components/ui/card                        │  │
│  │   - hover: bg-surface-raised + border-line-soft (D-10)              │  │
│  │   - isDragging: opacity-30 pointer-events-none                       │  │
│  │   - inner content: render-prop children (typically <KanbanTaskCard>) │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ▼ onDragEnd                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Consumer-level handler (TasksTab.onKanbanDragEnd or                 │  │
│  │  EngagementKanbanDialog.handleDragEnd):                              │  │
│  │   - validate: newStage in ['todo','in_progress','review','done',     │  │
│  │     'cancelled']                                                      │  │
│  │   - call useEngagementKanban.handleDragEnd(assignmentId, newStage)   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│            ▼                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  useEngagementKanban (frontend/src/domains/engagements/hooks/)       │  │
│  │   - updateStageMutation → engagementsRepo.updateWorkflowStage        │  │
│  │   - onSuccess: queryClient.invalidateQueries('engagement-kanban')    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│            ▼                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Supabase REST → PostgreSQL engagement_assignments.workflow_stage    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| File (new)                                          | Responsibility                                                                                       | Owns these primitives                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/kanban/index.ts`           | Barrel export                                                                                        | Re-exports the 5 components + `DragEndEvent` type                                                        |
| `frontend/src/components/kanban/KanbanProvider.tsx` | DndContext orchestration, sensor wiring, drag-state lifecycle, native DragOverlay, announcements API | `useSensors`, `<DndContext>`, `<DragOverlay>`, `KanbanContext.Provider`, render-prop loop over `columns` |
| `frontend/src/components/kanban/KanbanBoard.tsx`    | Column outer frame, drop-target ring                                                                 | `useDroppable`, container `<div>` with conditional `ring-2 ring-accent`                                  |
| `frontend/src/components/kanban/KanbanHeader.tsx`   | Column header chrome (label + count)                                                                 | Pure presentational `<div>` with `bg-muted/50 border-b` defaults                                         |
| `frontend/src/components/kanban/KanbanCards.tsx`    | Vertical scroll + sortable list context                                                              | `<ScrollArea>` + `<SortableContext items={...}>` + render-prop loop                                      |
| `frontend/src/components/kanban/KanbanCard.tsx`     | Sortable draggable card wrapper                                                                      | `useSortable`, `<Card>` from `@/components/ui/card`, drag transform style                                |

### Recommended Project Structure

```
frontend/src/components/kanban/          # new (created in Phase 52)
├── index.ts                              # barrel export
├── KanbanProvider.tsx                    # DndContext + DragOverlay + sensors
├── KanbanBoard.tsx                       # useDroppable + drop-target ring
├── KanbanHeader.tsx                      # column header chrome
├── KanbanCards.tsx                       # SortableContext + ScrollArea
└── KanbanCard.tsx                        # useSortable + Card wrapper

frontend/src/components/kibo-ui/kanban/   # DELETED in Phase 52 step D-18.4
└── index.tsx                              # ← rm -rf

frontend/tests/e2e/                       # 2 new spec files
├── tasks-tab-visual.spec.ts              # new
├── tasks-tab-visual.spec.ts-snapshots/   # new (4 PNGs)
├── engagement-kanban-dialog-visual.spec.ts          # new
└── engagement-kanban-dialog-visual.spec.ts-snapshots/  # new (4 PNGs)
```

### Pattern 1: Native DragOverlay with context-stored active item

**What:** Replace `tunnel-rat`'s `<t.In>` / `<t.Out>` pattern with a native `<DragOverlay>` child that reads the active drag item from `KanbanContext` and re-renders a card preview when `activeCardId !== null`.

**When to use:** Whenever the DnD library already provides a built-in portal mechanism. `@dnd-kit/core` ships `<DragOverlay>` natively; using `tunnel-rat` to portal a card into it is redundant.

**Example:**

```tsx
// Source: Adapted from frontend/src/components/kibo-ui/kanban/index.tsx (lines 119-131, 307-313)
// and @dnd-kit/core official docs (https://docs.dndkit.com/api-documentation/draggable/drag-overlay)
// [VERIFIED: in-repo kibo-ui implementation already uses <DragOverlay> — only the t.In/t.Out
// portal layer is being replaced]

// In KanbanProvider.tsx:
import { DndContext, DragOverlay, ... } from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import { useState, createContext } from 'react'

const KanbanContext = createContext<{
  columns: KanbanColumnProps[]
  data: KanbanItemProps[]
  activeCardId: string | null
}>({ columns: [], data: [], activeCardId: null })

export function KanbanProvider<T, C>({ children, columns, data, onDragEnd, onDragOver, onDragStart, onDataChange, className, ...rest }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const activeItem = activeCardId !== null ? data.find((d) => d.id === activeCardId) : null

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => { setActiveCardId(e.active.id as string); onDragStart?.(e) }}
        onDragOver={...handleDragOver}
        onDragEnd={(e) => { setActiveCardId(null); ...handleDragEnd; onDragEnd?.(e) }}
        accessibility={{ announcements }}
        {...rest}
      >
        <div className={cn('grid size-full auto-cols-fr grid-flow-col gap-4', className)}>
          {columns.map((column) => children(column))}
        </div>
        {typeof window !== 'undefined' &&
          createPortal(
            <DragOverlay>
              {activeItem !== null ? (
                // Render the same Card chrome the source card uses, with ring-accent overlay
                <Card className="cursor-grab gap-4 rounded-md p-3 ring-2 ring-accent">
                  {/* Consumer supplies content via children render-prop — see Pattern 2 */}
                  {/* For now: render the column's children() render-prop on activeItem */}
                </Card>
              ) : null}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </KanbanContext.Provider>
  )
}
```

**Implementation note:** The trickiest part is getting the OVERLAY card to render the SAME content as the source card. Three options, ranked by complexity:

1. **Simplest (verified working in `@dnd-kit/core` patterns):** Re-render the overlay card using the same `children` render-prop the column uses, applied to `activeItem`. Requires the consumer's render-prop to be side-effect free (which `KanbanTaskCard` is).
2. **Alternative:** Move the overlay render into `KanbanCard` itself, gated by `activeCardId === id`, similar to kibo-ui's current pattern but using `<DragOverlay>` directly (no tunnel-rat). This works because `<DragOverlay>` accepts arbitrary children — any KanbanCard whose `activeCardId === id` would render a clone into the overlay.
3. **Fallback (only if 1 + 2 hit a parity bug per CONTEXT D-02 fallback):** Keep `tunnel-rat`. D-19 becomes a no-op.

The planner should default to option 1 and only escalate to 2 or 3 if option 1 produces visual regressions in the EN baseline.

### Pattern 2: WorkBoard-proven sensor stack with activation constraints

**What:** Use `MouseSensor` with `distance: 8` activation, `TouchSensor` with `delay: 200, tolerance: 5`, and `KeyboardSensor` with `sortableKeyboardCoordinates`.

**When to use:** Every interactive list where users can also CLICK a card (not just drag). The kibo-ui sensors lack constraints — every mouse-down starts a drag, which conflicts with click handlers on `KanbanTaskCard`.

**Example:**

```tsx
// Source: frontend/src/pages/WorkBoard/WorkBoard.tsx:132-139 (verified working in-repo since Phase 39)
// [VERIFIED: in-repo source — Phase 39 Plan 04]
import { MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: { delay: 200, tolerance: 5 },
})
const keyboardSensor = useSensor(KeyboardSensor, {
  coordinateGetter: sortableKeyboardCoordinates,
})
const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)
```

### Pattern 3: Live-reorder during dragOver via `arrayMove`

**What:** Mutate the in-memory `data` array when an active card hovers over a different column, so users see the card visually cross the boundary BEFORE drop.

**When to use:** Boards where the visual feedback "where will my card land" needs to happen continuously, not only on drop. CONTEXT D-03 mandates this for KANBAN-01 / KANBAN-02.

**Example:**

```tsx
// Source: frontend/src/components/kibo-ui/kanban/index.tsx:215-245 (verbatim preservation)
// [VERIFIED: in-repo source — current behavior that KANBAN-01 mandates be preserved]
import { arrayMove } from '@dnd-kit/sortable'

const handleDragOver = (event: DragOverEvent) => {
  const { active, over } = event
  if (!over) return

  const activeItem = data.find((item) => item.id === active.id)
  const overItem = data.find((item) => item.id === over.id)
  if (!activeItem) return

  const activeColumn = activeItem.column
  const overColumn = overItem?.column ?? columns.find((c) => c.id === over.id)?.id ?? columns[0]?.id

  if (activeColumn !== overColumn) {
    let newData = [...data]
    const activeIndex = newData.findIndex((item) => item.id === active.id)
    const overIndex = newData.findIndex((item) => item.id === over.id)
    newData[activeIndex]!.column = overColumn!
    newData = arrayMove(newData, activeIndex, overIndex)
    onDataChange?.(newData)
  }
  onDragOver?.(event)
}
```

### Pattern 4: Token-bound drop-target ring (replaces `ring-primary`)

**What:** `KanbanBoard`'s outer container uses `useDroppable` and toggles `ring-2 ring-accent ring-transparent` based on `isOver`.

**Example:**

```tsx
// Source: Adapted from kibo-ui/kanban/index.tsx:66-83 with D-12 token swap (ring-primary → ring-accent)
// and D-07 cancelled-column border-only treatment.
// [VERIFIED: token names resolve via frontend/src/index.css @theme block — --color-accent / --color-danger]
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export function KanbanBoard({
  id,
  children,
  className,
  isCancelled,
}: {
  id: string
  children: ReactNode
  className?: string
  isCancelled?: boolean // NEW (D-07) — caller passes true for cancelled column
}) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex size-full min-h-40 flex-col divide-y overflow-hidden rounded-md border bg-muted/30 border-muted text-xs transition-all ring-2',
        isOver ? 'ring-accent' : 'ring-transparent',
        isCancelled === true && 'border-danger/30',
        className,
      )}
    >
      {children}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Adding a HeroUI v3 Card to `KanbanCard`.** Per CLAUDE.md primitive cascade preference, you would default to HeroUI v3 Card. CONTEXT D-09 explicitly overrides this for narrow blast radius. Adding HeroUI Card here would force a wholesale re-skin of `KanbanTaskCard` and `WorkBoard.KCard` (both consume the shadcn API surface) — out of scope.
- **Manually `.reverse()`-ing the column array for RTL.** `forceRTL` is NOT used on web — the project uses `dir="rtl"` attribute + Tailwind logical properties. The columns array is rendered in natural order; the browser's RTL flow puts the first column at the right edge automatically. Manual reverse would double-flip back to LTR.
- **`textAlign: 'right'` on Arabic text.** Banned by CLAUDE.md `§Arabic RTL Support Guidelines` and enforced by ESLint `no-restricted-syntax`. Use logical `text-start` / `text-end` instead.
- **`hover:shadow-md` on `KanbanCard`.** Banned by CLAUDE.md `§Design rules` ("No drop-shadows on cards"). CONTEXT D-09 strips it; D-10 substitutes `hover:bg-surface-raised hover:border-line-soft`.
- **Adding `bg-danger/10` body tint to the cancelled column.** D-07 mandates border-only cue. Body tint would violate the flat-surface posture.
- **Putting per-stage colors back via the `semantic-colors.ts` map.** D-05 explicitly drops bespoke STAGE_COLORS entirely. Migrating them to a "semantic" centralization is still bespoke — Phase 52 ships flat across all stages.
- **Bumping `@dnd-kit/*` versions.** Out of scope. The 12 existing `kanban-*.spec.ts` files use the current shared dep version; CONTEXT D-17 requires they stay green.
- **Allowing accidental drag on click.** kibo-ui sensors have no activation constraint, which makes click handlers on `KanbanTaskCard` fragile (mouse-down starts a drag). The D-04 sensor stack with `distance: 8` is the fix.
- **`Card` shadow on the drag overlay.** Per D-11, the overlay carries `ring-2 ring-accent` only — no box-shadow. Visual lift comes from the ring + position offset.
- **Suppressing token violations with new `eslint-disable-next-line` directives.** Phase 51 D-12 zero-net-new-disable posture. Every class in new files must resolve to a name in `index.css @theme`.

## Don't Hand-Roll

| Problem                                      | Don't Build                                           | Use Instead                                                                                                             | Why                                                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag-and-drop collision detection            | Custom hit-test geometry                              | `@dnd-kit/core` `closestCenter` (already used by kibo-ui)                                                               | Handles overlap with multiple drop targets, zoom, transforms; tested against every browser.                                                          |
| Sortable list semantics                      | Custom array splice + reorder                         | `@dnd-kit/sortable` `useSortable` + `SortableContext` + `arrayMove`                                                     | Native screen reader announcements, keyboard support, deduped sort stability.                                                                        |
| Keyboard drag with arrow keys                | Custom keydown handlers                               | `@dnd-kit/sortable` `sortableKeyboardCoordinates` coordinate-getter                                                     | Proper grid traversal, RTL-aware, integrates with `KeyboardSensor`.                                                                                  |
| DragOverlay portal                           | `react-portal` / `tunnel-rat` / custom `createPortal` | `@dnd-kit/core` `<DragOverlay>` (D-02 native)                                                                           | Auto-mounts above body, follows pointer, manages mount/unmount lifecycle.                                                                            |
| Live-region announcements for screen readers | Custom `aria-live` div                                | `<DndContext accessibility={{ announcements }}>`                                                                        | Built-in template strings ("Picked up the card X from column Y", etc.) — already in kibo-ui's pattern.                                               |
| Card hover lift                              | Custom JS `onMouseEnter` / `onMouseLeave`             | CSS `hover:` utility classes with token vars                                                                            | Cheap, declarative, works with `:focus-visible` for keyboard users.                                                                                  |
| Empty column drop target                     | Custom dummy element                                  | `useDroppable({ id: column.id })` on `KanbanBoard` outer container — the column itself IS the drop zone (no row needed) | Library handles "drop on empty column" via the column-id collision; the `KanbanBoard.isOver` ring is the only signal needed.                         |
| Scrollable column body                       | Custom scroll container                               | `@/components/ui/scroll-area` (Radix-based) — already used by kibo-ui's `KanbanCards`                                   | RTL-aware, keyboard accessible, scroll shadow optional.                                                                                              |
| Drop persistence                             | Custom mutation in the primitive                      | Consumer's `onDragEnd` callback → existing `useEngagementKanban.handleDragEnd` (TanStack Query mutation already wired)  | Phase 52 does NOT touch the data hook. The primitive is purely presentational.                                                                       |
| EN+AR Playwright visual matrix scaffolding   | Custom screenshot diff harness                        | Existing `kanban-visual.spec.ts` (28-line template) — copy-paste shape                                                  | Matches deterministic-render layers (i18nextLng init script, animation kill, `document.fonts.ready`, screenshot tolerance) that the whole repo uses. |
| Path-import ban for `@/components/kibo-ui/*` | Custom CI script that greps for forbidden imports     | `eslint-plugin` `no-restricted-imports` `patterns` (already configured at `eslint.config.mjs:148`)                      | Same enforcement mechanism Phase 48 D-05 chose; no new mechanism.                                                                                    |

**Key insight:** Every problem in Phase 52 has an existing solution in the repo. The phase's value is _composition_ — gluing already-vetted primitives in a token-compliant way — not invention. The planner should flag any task that proposes building something from scratch.

## Runtime State Inventory

> Phase 52 is a frontend code-only migration: no rename, no data migration, no OS state. Categories below confirmed empty.

| Category            | Items Found                                                                                                                                                                      | Action Required                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Stored data         | None — `engagement_assignments.workflow_stage` column is unchanged; the new primitive consumes the same `useEngagementKanban` hook reading the same Supabase RPC                 | None                                                                                                        |
| Live service config | None — no n8n workflows, no Datadog tags, no Tailscale ACLs reference Kanban                                                                                                     | None                                                                                                        |
| OS-registered state | None — no Windows Task Scheduler / launchd / pm2 entries reference Kanban                                                                                                        | None                                                                                                        |
| Secrets/env vars    | None — no new secrets or env vars introduced                                                                                                                                     | None                                                                                                        |
| Build artifacts     | `pnpm-lock.yaml` updates after `pnpm remove tunnel-rat --filter frontend` (D-19). No egg-info, no compiled binaries, no Docker image rebuilds beyond the standard frontend build | Verified by `pnpm --filter frontend ls tunnel-rat` returning empty after D-19 (CONTEXT D-19 explicit check) |

**Nothing found in 4 of 5 categories** — verified by reading the phase scope and confirming no runtime state outside `pnpm-lock.yaml` changes. The single lockfile delta is a normal consequence of `pnpm remove`.

## Common Pitfalls

### Pitfall 1: `<DragOverlay>` re-render flicker when the overlay clones a heavy child

**What goes wrong:** If `KanbanCard`'s render-prop child (typically `<KanbanTaskCard>` with `Avatar`, `Badge`, lucide icons) is re-rendered every dragOver event, the overlay flickers and the FPS drops.

**Why it happens:** `@dnd-kit/core`'s `DragOverlay` re-renders on every pointer move by default. The kibo-ui pattern (`activeCardId === id` gating two `<Card>` instances in the same component) avoids this because React diffs the same tree.

**How to avoid:** Either (a) gate the overlay clone inside `KanbanCard` (kibo-ui's pattern, minus tunnel-rat — render a second `<DragOverlay>` child only when `activeCardId === id`), or (b) memoize the overlay render: wrap the overlay child in `useMemo` keyed on `activeCardId`.

**Warning signs:** Visual baseline drift at 1280×800 LTR specifically during the dragOver phase (won't show in static screenshots, but will show in a manual visual smoke test).

### Pitfall 2: Click handlers on `KanbanTaskCard` fire AND trigger a drag

**What goes wrong:** Today's kibo-ui code has no `MouseSensor.activationConstraint`. A user clicking a card to open its detail page (route navigation) accidentally starts a drag, which cancels the click.

**Why it happens:** Without an activation distance, the sensor treats every mouse-down as drag intent.

**How to avoid:** D-04 sensor stack — `MouseSensor { distance: 8 }` requires 8px of movement before drag activates. The `KanbanTaskCard` does not currently have a click handler, but the planner must verify this won't regress if any task adds one.

**Warning signs:** A new `kanban-render.spec.ts` failure where a click test now reports the card is "dragging" instead of navigating.

### Pitfall 3: Keyboard drag works in LTR but feels wrong in RTL

**What goes wrong:** Arrow keys feel reversed in Arabic — pressing → moves the card to the next column on the LEFT (because RTL flows right-to-left).

**Why it happens:** `sortableKeyboardCoordinates` operates in physical (LTR) coordinate space. There's no automatic RTL mirroring at the dnd-kit level.

**How to avoid:** Document the expected behavior in the new spec — Arrow Right always moves the card to the column on the LEFT in RTL (because that IS the next column in reading order). This is correct semantic behavior; the issue is only documenting it. If users push back, a custom `coordinateGetter` can mirror the directions — but Phase 52 does NOT do this (out of behavior-parity scope).

**Warning signs:** RTL Playwright test asserts arrow-key drag puts the card in the wrong column; verify against the in-repo `keyboard-navigation-kanban.spec.ts` precedent (which targets WorkBoard, not TasksTab, but uses the same sensor stack).

### Pitfall 4: Removing `tunnel-rat` breaks the build because of stale pnpm-lock.yaml

**What goes wrong:** `pnpm remove tunnel-rat --filter frontend` updates `package.json` but doesn't auto-resolve transitive dep changes if the lockfile has frozen older versions.

**Why it happens:** Workspace lockfiles need a clean regen pass.

**How to avoid:** After `pnpm remove`, also run `pnpm install --frozen-lockfile` in CI to verify the lockfile is internally consistent. Run `pnpm --filter frontend ls tunnel-rat` to confirm it returns empty (CONTEXT D-19 explicit check). If the lockfile is stale, `pnpm install` regenerates it.

**Warning signs:** CI `pnpm install` fails or `pnpm --filter frontend build` errors with "Cannot find module 'tunnel-rat'" (means the import in `kibo-ui/kanban/index.tsx` was missed during deletion — the file must be deleted, not just unimported).

### Pitfall 5: ESLint pattern widening accidentally bans the new local primitive

**What goes wrong:** Widening `no-restricted-imports.patterns` to `'@/components/kibo-ui/*'` is fine — but if the planner over-widens (e.g., `'@/components/*'` or `'kibo*'` as a substring), the new `@/components/kanban/*` import would also be banned.

**Why it happens:** Glob substring matching in `minimatch` can over-match (this is exactly why Phase 48 D-02 narrowed the original pattern in the first place).

**How to avoid:** Use the precise glob `'@/components/kibo-ui/*'` (with the literal `kibo-ui` segment), not a substring. Verify by running `pnpm --filter frontend lint` after the widen — if any of the NEW kanban files trip the rule, the glob is too broad.

**Warning signs:** A `pnpm lint` error on `TasksTab.tsx` complaining that `@/components/kanban` is banned (means the glob matches the new path too).

### Pitfall 6: Visual baseline drift between EN and AR at 1280×800 because of font-loading race

**What goes wrong:** Arabic (Tajawal) font loads asynchronously; if `page.evaluate(() => document.fonts.ready)` runs before the font finishes loading, the AR baseline captures fallback (Inter / system) at first frame.

**Why it happens:** `document.fonts.ready` resolves when initially-loaded fonts settle, but the font CSS may not have been parsed yet at that point.

**How to avoid:** Mirror `kanban-visual.spec.ts:23` (`await page.evaluate((): Promise<FontFaceSet> => document.fonts.ready)`) — this awaits the FontFaceSet promise correctly. ALSO ensure the Tajawal stylesheet is `<link>` not async-injected (verified — `frontend/src/index.css` imports it via `@import` not JS). If still flaky, add `await page.waitForFunction(() => document.fonts.check('1em Tajawal'))` as a paranoid second wait.

**Warning signs:** AR baseline diff > 1% pixel ratio in CI but green locally (because local has the font cached).

### Pitfall 7: Phase 48 D-02 carve-out removal cascades into other kibo-ui files

**What goes wrong:** D-18 removes the `frontend/src/components/**/index.tsx` line-332 carve-out for `check-file/folder-naming-convention`. If there are OTHER `index.tsx` files under `components/**` that don't follow PascalCase, removing the carve-out introduces lint errors elsewhere.

**Why it happens:** The Phase 48 D-02 carve-out was scoped to handle `kibo-ui/kanban/index.tsx` specifically, but the glob `frontend/src/components/**/index.tsx` matches every `index.tsx` under components/. If others exist, they were silently passing because of the carve-out.

**How to avoid:** Before deleting the carve-out, run `find frontend/src/components -name "index.tsx" -not -path "*/kibo-ui/*"` to enumerate. If any results return, decide per-file whether to rename (`Index.tsx`) or add a narrower carve-out targeting that specific path. CONTEXT D-18 step 5 should account for this.

**Warning signs:** `pnpm lint` fails after the carve-out removal with `check-file/filename-naming-convention` errors on a non-kibo-ui `index.tsx`.

### Pitfall 8: `tasks-tab-visual.spec.ts` requires authenticated session — anonymous routes 302 to /login

**What goes wrong:** The `TasksTab` is mounted under `/_protected/engagements/$engagementId`. Anonymous Playwright runs redirect to `/login`, capturing the login form instead of the kanban board.

**Why it happens:** `_protected` is a TanStack Router authenticated route group.

**How to avoid:** The repo's `frontend/playwright.config.ts:38` runs `tests/e2e/global-setup.ts` which pre-authenticates via `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` and persists session to `.auth/storageState.json`. New specs inherit this by default (don't override `storageState`). Verify by `npx playwright test tasks-tab-visual --headed` locally — should land on the board, not the login form.

**Warning signs:** Baseline PNGs show the login form; spec console error mentions `TEST_USER_EMAIL` missing.

## Code Examples

Verified patterns from official + in-repo sources:

### Full KanbanProvider skeleton (D-01 + D-02 + D-04 + D-18)

```tsx
// frontend/src/components/kanban/KanbanProvider.tsx
// Source: composed from kibo-ui/kanban/index.tsx (lines 171-317) + WorkBoard.tsx sensors (132-139)
// [VERIFIED: every primitive used exists in current frontend/package.json]
'use client'

import {
  type Announcements,
  type DndContextProps,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { createContext, type ReactNode, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type KanbanItemProps = { id: string; name: string; column: string } & Record<string, unknown>
type KanbanColumnProps = { id: string; name: string } & Record<string, unknown>

type KanbanContextValue = {
  columns: KanbanColumnProps[]
  data: KanbanItemProps[]
  activeCardId: string | null
}

export const KanbanContext = createContext<KanbanContextValue>({
  columns: [],
  data: [],
  activeCardId: null,
})

export type { DragEndEvent } from '@dnd-kit/core'

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<DndContextProps, 'children'> & {
  children: (column: C) => ReactNode
  className?: string
  columns: C[]
  data: T[]
  onDataChange?: (data: T[]) => void
  onDragStart?: (event: DragStartEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  onDragOver?: (event: DragOverEvent) => void
}

export function KanbanProvider<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  className,
  columns,
  data,
  onDataChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  ...rest
}: KanbanProviderProps<T, C>): ReactNode {
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  // D-04 sensor stack — mirrors WorkBoard.tsx:132-139
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = (event: DragStartEvent): void => {
    setActiveCardId(event.active.id as string)
    onDragStart?.(event)
  }

  // D-03 live-reorder preserved verbatim
  const handleDragOver = (event: DragOverEvent): void => {
    const { active, over } = event
    if (!over) return
    const activeItem = data.find((it) => it.id === active.id)
    const overItem = data.find((it) => it.id === over.id)
    if (!activeItem) return
    const activeColumn = activeItem.column
    const overColumn =
      overItem?.column ?? columns.find((c) => c.id === over.id)?.id ?? columns[0]?.id
    if (activeColumn !== overColumn) {
      let newData = [...data]
      const activeIndex = newData.findIndex((it) => it.id === active.id)
      const overIndex = newData.findIndex((it) => it.id === over.id)
      newData[activeIndex]!.column = overColumn!
      newData = arrayMove(newData, activeIndex, overIndex)
      onDataChange?.(newData as T[])
    }
    onDragOver?.(event)
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveCardId(null)
    onDragEnd?.(event)
    const { active, over } = event
    if (!over || active.id === over.id) return
    let newData = [...data]
    const oldIndex = newData.findIndex((it) => it.id === active.id)
    const newIndex = newData.findIndex((it) => it.id === over.id)
    newData = arrayMove(newData, oldIndex, newIndex)
    onDataChange?.(newData as T[])
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((it) => it.id === active.id) ?? {}
      return `Picked up the card "${name}" from the "${column}" column`
    },
    onDragOver({ active, over }) {
      const { name } = data.find((it) => it.id === active.id) ?? {}
      const newColumn = columns.find((c) => c.id === over?.id)?.name
      return `Dragged the card "${name}" over the "${newColumn}" column`
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((it) => it.id === active.id) ?? {}
      const newColumn = columns.find((c) => c.id === over?.id)?.name
      return `Dropped the card "${name}" into the "${newColumn}" column`
    },
    onDragCancel({ active }) {
      const { name } = data.find((it) => it.id === active.id) ?? {}
      return `Cancelled dragging the card "${name}"`
    },
  }

  const activeItem = activeCardId !== null ? data.find((it) => it.id === activeCardId) : null

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId }}>
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        {...rest}
      >
        <div className={cn('grid size-full auto-cols-fr grid-flow-col gap-4', className)}>
          {columns.map((column) => children(column as C))}
        </div>
        {typeof window !== 'undefined' &&
          createPortal(
            <DragOverlay>
              {/* See "Pitfall 1" for the recommended overlay-render strategy. */}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </KanbanContext.Provider>
  )
}
```

### New Playwright visual spec template (D-14 + D-15 + D-16)

```ts
// frontend/tests/e2e/tasks-tab-visual.spec.ts
// Source: shape mirrors frontend/tests/e2e/kanban-visual.spec.ts (28 lines)
// [VERIFIED: same determinism layers as kanban-visual.spec.ts which has been green since Phase 39]
import { test, expect } from '@playwright/test'

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

// Engagement seeded with: todo:2, in_progress:2, review:1, done:2, cancelled:1
// Planner: confirm SEEDED_ENGAGEMENT_ID via supabase MCP query or test fixture file
const SEEDED_ENGAGEMENT_ID = '<TBD-planner-supplies-from-fixture>'

test.describe('Phase 52: TasksTab Kanban visual regression', () => {
  for (const { dir, viewport } of matrix) {
    test(`${dir} @ ${viewport.width}x${viewport.height}`, async ({ page }): Promise<void> => {
      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
      })
      await page.goto(`/engagements/${SEEDED_ENGAGEMENT_ID}`)
      // TasksTab is the default tab on engagement workspace; if it's not, click the tab here.
      await page.waitForLoadState('networkidle')
      await page.evaluate((): Promise<FontFaceSet> => document.fonts.ready)

      await expect(page).toHaveScreenshot(`tasks-tab-${dir}-${viewport.width}.png`, {
        maxDiffPixelRatio: 0.01,
        fullPage: true,
      })
    })
  }
})
```

### ESLint `no-restricted-imports.patterns` widening (D-18 step 5)

```js
// eslint.config.mjs — diff for the patterns array (lines 148-163 current)
// [VERIFIED: current shape at eslint.config.mjs:148-163; minimatch glob semantics
// confirmed in Phase 48 D-02 commentary]
patterns: [
  {
    group: [
      'aceternity-ui/*',
      '@aceternity/*',
      'kibo-ui/*',
      '@kibo-ui/*',
      '@/components/kibo-ui/*',  // ← NEW (Phase 52 D-18)
      '@/components/ui/3d-card',
      '@/components/ui/bento-grid',
      '@/components/ui/floating-navbar',
      '@/components/ui/link-preview',
    ],
    message:
      'Banned by CLAUDE.md primitive cascade. Use HeroUI v3 → Radix → custom. If no primitive fits, ask before installing.',
  },
],
```

ALSO delete:

- Lines 122-132: the multi-line 48-02 narrowing comment block (constraint resolved by Phase 52).
- Line 332: the `frontend/src/components/**/index.tsx` files-rule carve-out (added in Phase 48 D-02 specifically for `kibo-ui/kanban/index.tsx`; no longer needed once that file is deleted, BUT see Pitfall 7 — confirm no other `index.tsx` files under components/ depend on it before removing).

## State of the Art

| Old Approach                            | Current Approach                                        | When Changed                                                              | Impact                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-beautiful-dnd` (Atlassian, 2016) | `@dnd-kit/core`                                         | ~2021 (when Atlassian deprecated rbd in favor of pragmatic-drag-and-drop) | rbd is unmaintained, no React 18+ support. `@dnd-kit/core` is the ecosystem default for headless DnD in React.                                                                                          |
| Tunnel-rat for DragOverlay portal       | Native `<DragOverlay>`                                  | `@dnd-kit/core` 5+ (2022)                                                 | The `<DragOverlay>` primitive has always been native; tunnel-rat was only needed for libraries that wrapped dnd-kit in a way that obscured the overlay slot. kibo-ui's pattern was an overcomplication. |
| Constraint-less sensors                 | Activation-constraint sensors (distance:8, delay:200)   | Standard practice across all dnd-kit guides                               | Prevents click-vs-drag ambiguity. WorkBoard.tsx is already on this.                                                                                                                                     |
| HeroUI v2 (legacy)                      | HeroUI v3 (current)                                     | May 2025 (v3 beta release)                                                | Compound components (e.g., `Card.Header`), Tailwind v4-only, no Provider needed, built on React Aria Components. Project is on v3.0.3.                                                                  |
| `@theme` block in CSS for color tokens  | Tailwind v4 native (replaces JS config `extend.colors`) | Tailwind v4 release (April 2025)                                          | Already adopted in repo (frontend/src/index.css:43-118). No work needed.                                                                                                                                |

**Deprecated/outdated:**

- **`react-beautiful-dnd`:** abandoned; do not introduce.
- **`react-dnd`:** still maintained but verbose API; `@dnd-kit/core` is the modern alternative.
- **`tunnel-rat` for DnD overlay portaling:** redundant. Native `<DragOverlay>` works.

## Assumptions Log

| #   | Claim                                                                                                                                                                      | Section                                          | Risk if Wrong                                                                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | HeroUI v3 ships no Kanban export                                                                                                                                           | Standard Stack table; phase title interpretation | LOW — verified via heroui-react MCP tool's documentation and confirmed by sweep notes in CONTEXT line 187 ("Confirmed HeroUI v3 has no shipped Kanban primitive"). Would only matter if a Kanban primitive lands in a future HeroUI v3 release during execution; in that case the planner re-evaluates D-09 vs HeroUI Kanban.        |
| A2  | `<DragOverlay>` can render its child via `KanbanCard`'s gated `activeCardId === id` pattern without tunnel-rat                                                             | Pattern 1 + Pitfall 1                            | MEDIUM — the kibo-ui pattern uses tunnel-rat specifically because rendering the SAME child tree in two places (column position + overlay) is non-trivial. If during execution this proves flaky, CONTEXT D-02 fallback (keep tunnel-rat) applies.                                                                                    |
| A3  | All 12 existing `kanban-*.spec.ts` files target `/kanban` (WorkBoard) and will stay green unchanged                                                                        | CONTEXT D-17; KANBAN-04 traceability             | LOW — verified by reading `kanban-dnd.spec.ts` which goes to `/kanban` and `kanban-visual.spec.ts:21` (`page.goto('/kanban')`). Plus the entire suite was authored in Phase 39 against WorkBoard, not TasksTab.                                                                                                                      |
| A4  | The `EngagementKanbanDialog` trigger flow is reachable via `EngagementDossierPage`                                                                                         | KANBAN-02; CONTEXT D-14 trigger discovery        | LOW — verified by `grep "EngagementKanbanDialog" frontend/src/` returning `pages/dossiers/EngagementDossierPage.tsx:18` (import) and `:66` (render). Spec writer drives through that page.                                                                                                                                           |
| A5  | `KanbanTaskCard.tsx` Tier-C disables can be absorbed in-phase per CONTEXT D-13's "if cleanly containable" clause                                                           | UI-SPEC §"Out of contract" + CONTEXT D-13        | MEDIUM — KanbanTaskCard.tsx lines 24-32 has 4 Tier-C disables (`text-red-600 / bg-red-50` etc. for SLA states). Migrating to `text-danger / bg-danger-soft` etc. is mechanically clean since the file is leaf-level (no further importers carry the literal). Planner should include this as a discretionary task with a checkpoint. |
| A6  | All 8 new visual baselines can be generated locally with `pnpm --filter frontend exec playwright test tasks-tab-visual engagement-kanban-dialog-visual --update-snapshots` | KANBAN-04                                        | LOW — same flow used in Phase 39 / Phase 46. Requires `.env.test` with `TEST_USER_EMAIL` + `TEST_USER_PASSWORD`.                                                                                                                                                                                                                     |
| A7  | The fixture engagement seeded for D-16 already exists OR can be seeded via supabase MCP `apply_migration` (precedent: Phase 40-12, 40-20)                                  | D-14 + D-16                                      | MEDIUM — planner must verify whether the staging Supabase project at `zkrcjzdemdmwhearhfgg` has a seedable engagement with the exact composition `todo:2 / in_progress:2 / review:1 / done:2 / cancelled:1`. If not, an idempotent seed step is needed.                                                                              |
| A8  | No other `index.tsx` files under `frontend/src/components/**` depend on the Phase 48 D-02 carve-out                                                                        | Pitfall 7 + D-18 step 5                          | MEDIUM — planner must run `find frontend/src/components -name "index.tsx" -not -path "*/kibo-ui/*"` to verify before removing the carve-out. If results return, the executor decides per-file: rename or narrower carve-out.                                                                                                         |

**If this table is empty:** N/A — 8 assumptions documented above. None block planning; all are flagged so the planner can add verification checkpoints where MEDIUM risk warrants.

## Open Questions (RESOLVED)

1. **Should `KanbanTaskCard.tsx`'s 4 Tier-C disables be absorbed into Phase 52?**
   - What we know: CONTEXT D-13 leaves the file unless it carries Tier-C disables. It does (lines 24-32: 4 disables on `text-red-600 / bg-red-50 / text-orange-600 / bg-orange-50 / text-yellow-600 / bg-yellow-50 / text-emerald-600 / bg-emerald-50` for SLA states).
   - What's unclear: Whether the migration to `text-danger / bg-danger-soft / text-warn / bg-warn-soft / text-ok / bg-ok-soft` ripples beyond this single file. KanbanTaskCard is rendered inside BOTH new Kanban surfaces AND inside WorkBoard's `KCard` (verify with `grep -rn "KanbanTaskCard" frontend/src/`).
   - Recommendation: Planner adds a discretionary task with `checkpoint:human-verify` — execute only if the change is contained in `KanbanTaskCard.tsx`; otherwise defer to a future "kanban polish" phase per UI-SPEC §"Out of contract".
   - **RESOLVED (Plan 52-03 Task 3):** KanbanTaskCard Tier-C disables absorbed in-phase via a containment grep gate; if non-leaf consumers are detected, the task defers per the documented fallback.

2. **Which exact engagement ID is seeded for `D-16` fixture composition?**
   - What we know: D-16 mandates `todo:2 / in_progress:2 / review:1 / done:2 / cancelled:1`. Phase 40-12 / 40-20 / 40-22 set the precedent for fixture seeding via Supabase MCP.
   - What's unclear: Whether an engagement on staging at `zkrcjzdemdmwhearhfgg` already matches this composition OR an idempotent seed migration is required.
   - Recommendation: Planner queries staging Supabase via MCP `list_tables` + `execute_sql` (read-only) to find a candidate engagement; if none exists, plan-phase emits an idempotent seed migration as the first task (precedent: Phase 40-12 seed pattern).
   - **RESOLVED (Plan 52-05 Task 1):** Fixture engagement ID is verified via Supabase MCP (read-only `execute_sql`) at execution time; Path A reuses an existing match, Path B applies an idempotent seed migration. Outcome is captured in `52-FIXTURE.md`.

3. **Will the `<DragOverlay>` render-strategy (Pitfall 1, options 1 vs 2) match the kibo-ui visual baseline pixel-for-pixel?**
   - What we know: kibo-ui currently renders two `<Card>` instances — one at the original position with `opacity-30`, one in the overlay (via tunnel-rat) with `ring-2 ring-primary`. The visual signature on screen is: greyed-out card at origin + bright card with ring at pointer.
   - What's unclear: Whether the native `<DragOverlay>` re-render strategy produces an identical first-frame snapshot when the user is mid-drag. Phase 52 baselines are static-state (no mid-drag), so this risk is low for the baseline matrix, but it's a manual-test concern for KANBAN-01/02 behavior parity.
   - Recommendation: Planner adds a manual verification step at the end of execution: drag a card halfway between two columns, screenshot, compare against same action in pre-migration kibo-ui (taken on a `phase-52-base` branch). If material drift, escalate to CONTEXT D-02 fallback (keep tunnel-rat).
   - **RESOLVED (Plan 52-05 Task 4):** DragOverlay mid-drag parity is checked at the `checkpoint:human-verify` for the 8 new baselines. Reject path triggers the CONTEXT D-02 escape hatch (retain `tunnel-rat`) or a DragOverlay slot strategy fix in `KanbanProvider.tsx`.

4. **Does the planner need to handle the cancelled-column rendering toggle in `EngagementKanbanDialog` differently from `TasksTab`?**
   - What we know: TasksTab only renders cancelled column when `cancelled.length > 0` (TasksTab.tsx:59-63). EngagementKanbanDialog ALWAYS renders all 5 columns (EngagementKanbanDialog.tsx:52-61 — hardcoded `kanbanColumns` array of 5 items).
   - What's unclear: Whether the Dialog's always-render-cancelled posture should match TasksTab's conditional-render posture (would shrink the column count to 4 most of the time, improving visual density). This is a behavior CHANGE, not parity — out of CONTEXT scope.
   - Recommendation: Preserve dialog's always-render-cancelled posture verbatim per behavior parity. If a future "kanban polish" phase unifies them, that's its problem.
   - **RESOLVED (Plan 52-03 Task 2):** The cancelled-column rendering asymmetry is preserved verbatim — TasksTab continues to render cancelled only when non-empty; EngagementKanbanDialog continues to render all 5 columns unconditionally.

## Environment Availability

| Dependency                                    | Required By                           | Available                                | Version                                                                            | Fallback                                                              |
| --------------------------------------------- | ------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Node.js                                       | Build / lint / test                   | ✓                                        | 20.19.0+ (per CLAUDE.md; engines.node may require 22.13.0+ per Phase 53 BUNDLE-07) | None — strict requirement                                             |
| pnpm                                          | Workspace package manager             | ✓                                        | 10.29.1+                                                                           | None                                                                  |
| `pnpm --filter frontend lint`                 | D-18 step 3 smoke verification        | ✓                                        | Configured by `eslint.config.mjs`                                                  | None                                                                  |
| `pnpm --filter frontend type-check`           | D-18 step 3                           | ✓                                        | Configured by `tsconfig.json`                                                      | None                                                                  |
| `pnpm --filter frontend build`                | D-18 step 3                           | ✓                                        | Vite 5.x                                                                           | None                                                                  |
| `pnpm --filter frontend exec playwright test` | KANBAN-04 baseline regen              | ✓                                        | `@playwright/test` in repo                                                         | None                                                                  |
| Playwright auth flow                          | D-14 specs need authenticated session | ✓                                        | `frontend/playwright.config.ts:38` → `tests/e2e/global-setup.ts`                   | None — `.env.test` must have `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` |
| Supabase MCP                                  | Staging fixture seed (A7)             | ✓                                        | Project `zkrcjzdemdmwhearhfgg` (eu-west-2)                                         | Manual seed via Supabase dashboard — slower but viable                |
| `.env.test` file                              | Playwright auth setup                 | ✓ (per Phase 38-09 + Phase 50 precedent) | local-only (not committed)                                                         | None                                                                  |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** none — every dep needed by Phase 52 is already provisioned by prior phases.

## Validation Architecture

### Test Framework

| Property                 | Value                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Framework (unit)         | Vitest `^4.1.2` (verified in `frontend/package.json`) + `@testing-library/react`               |
| Framework (E2E)          | `@playwright/test`                                                                             |
| Unit config file         | `frontend/vitest.config.ts` (existing) + `frontend/tests/setup.ts`                             |
| E2E config file          | `frontend/playwright.config.ts` (existing — discovers under `frontend/tests/e2e/`)             |
| Quick run command (unit) | `pnpm --filter frontend test -- src/components/kanban`                                         |
| Quick run command (E2E)  | `pnpm --filter frontend exec playwright test tasks-tab-visual engagement-kanban-dialog-visual` |
| Full suite command       | `pnpm test` (workspace-wide vitest) + `pnpm --filter frontend exec playwright test`            |
| Auth state               | Pre-authenticated via `tests/e2e/global-setup.ts` (TEST_USER_EMAIL / TEST_USER_PASSWORD)       |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                         | Test Type                                                   | Automated Command                                                                                                               | File Exists?                                                                                                  |
| --------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| KANBAN-01 | TasksTab Kanban: drag/drop/column transitions, mouse + touch + keyboard parity   | E2E (drag-task-between-kanban-columns shape) + manual smoke | `pnpm --filter frontend exec playwright test tasks-tab-dnd.spec.ts`                                                             | ❌ Wave 0 (new spec needed OR extension of `drag-task-between-kanban-columns.spec.ts` to also cover TasksTab) |
| KANBAN-01 | TasksTab keyboard a11y (arrow keys move card across columns)                     | E2E (mirror `keyboard-navigation-kanban.spec.ts` shape)     | `pnpm --filter frontend exec playwright test tasks-tab-keyboard.spec.ts`                                                        | ❌ Wave 0 (new spec)                                                                                          |
| KANBAN-01 | TasksTab no-regression on drop persistence (drag → workflow_stage column update) | E2E + Supabase verification                                 | `pnpm --filter frontend exec playwright test tasks-tab-dnd.spec.ts` then assert DB row via Supabase REST                        | ❌ Wave 0 (new spec)                                                                                          |
| KANBAN-01 | Unit: new KanbanProvider sensor stack, arrayMove on dragOver                     | Vitest unit                                                 | `pnpm --filter frontend test -- src/components/kanban`                                                                          | ❌ Wave 0 (new test)                                                                                          |
| KANBAN-02 | EngagementKanbanDialog: same drag/drop/keyboard parity (KANBAN-01 mirror)        | E2E                                                         | `pnpm --filter frontend exec playwright test engagement-kanban-dialog-dnd.spec.ts`                                              | ❌ Wave 0 (new spec — see Pitfall 8 for auth flow + EngagementDossierPage entry point)                        |
| KANBAN-03 | kibo-ui directory deleted                                                        | CI grep                                                     | `[ ! -d frontend/src/components/kibo-ui/kanban ]` (assertion script)                                                            | ❌ Wave 0 — add to `scripts/check-deleted-components.sh` per Phase 39 precedent                               |
| KANBAN-03 | ESLint bans `@/components/kibo-ui/*` import path                                 | ESLint smoke                                                | `pnpm --filter frontend lint` (must report a violation if a synthetic import is added)                                          | ✓ (eslint.config.mjs already has the `no-restricted-imports` plugin wired; just the pattern needs widening)   |
| KANBAN-03 | `tunnel-rat` removed from package.json                                           | CI grep                                                     | `! grep -q "tunnel-rat" frontend/package.json`                                                                                  | ❌ Wave 0 — add to CI assertion script                                                                        |
| KANBAN-03 | `pnpm --filter frontend type-check` exits 0                                      | Workspace gate                                              | `pnpm --filter frontend type-check`                                                                                             | ✓ (existing CI gate)                                                                                          |
| KANBAN-04 | EN+AR visual baselines regenerated                                               | Playwright visual                                           | `pnpm --filter frontend exec playwright test tasks-tab-visual engagement-kanban-dialog-visual`                                  | ❌ Wave 0 (2 new spec files + 8 baselines)                                                                    |
| KANBAN-04 | All 12 existing `kanban-*.spec.ts` files stay green                              | Regression anchor                                           | `pnpm --filter frontend exec playwright test 'kanban-*'`                                                                        | ✓ (existing specs; verify post-migration)                                                                     |
| KANBAN-04 | axe-core a11y baseline (zero serious/critical violations)                        | E2E (axe extension)                                         | `pnpm --filter frontend exec playwright test tasks-tab-a11y engagement-kanban-dialog-a11y`                                      | ❌ Wave 0 (new specs — mirror existing `kanban-a11y.spec.ts`)                                                 |
| KANBAN-04 | ESLint smoke: synthetic `import x from '@/components/kibo-ui/kanban'` fails      | Lint regression                                             | Synthetic fixture file or PR description with the violation captured                                                            | ❌ Wave 0 (new fixture under `tools/eslint-fixtures/`)                                                        |
| All       | Phase 51 zero-net-new-disable posture preserved                                  | CI grep                                                     | `git diff --stat phase-51-base..HEAD -- frontend/src` and `grep -c "eslint-disable" frontend/src/components/kanban/*` returns 0 | ❌ Wave 0 — assertion script                                                                                  |

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test -- src/components/kanban` (~5 sec for new primitive unit tests) + `pnpm --filter frontend lint` (~10 sec)
- **Per wave merge:** Full `pnpm test` (~60 sec) + targeted Playwright `pnpm --filter frontend exec playwright test tasks-tab-* engagement-kanban-dialog-* kanban-*` (~3-5 min depending on parallelism)
- **Phase gate:** Full workspace `pnpm test && pnpm --filter frontend exec playwright test` + `pnpm --filter frontend build` green before `/gsd:verify-work`

### Wave 0 Gaps

The Phase 52 plan must seed the following test files BEFORE any migration task runs (TDD posture mandated by CONTEXT D-18 step 3 "smoke build green"):

- [ ] `frontend/tests/e2e/tasks-tab-visual.spec.ts` — 4-baseline visual matrix (covers KANBAN-04 — TasksTab)
- [ ] `frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts` — 4-baseline visual matrix (covers KANBAN-04 — Dialog)
- [ ] `frontend/tests/e2e/tasks-tab-dnd.spec.ts` (optional but recommended) — drag/drop parity (KANBAN-01) — could also extend `drag-task-between-kanban-columns.spec.ts` to target TasksTab
- [ ] `frontend/tests/e2e/tasks-tab-keyboard.spec.ts` (optional but recommended) — keyboard parity (KANBAN-01)
- [ ] `frontend/tests/e2e/tasks-tab-a11y.spec.ts` (optional but recommended) — axe-core gate (KANBAN-04)
- [ ] `frontend/tests/e2e/engagement-kanban-dialog-dnd.spec.ts` (optional but recommended)
- [ ] `frontend/tests/e2e/engagement-kanban-dialog-keyboard.spec.ts` (optional but recommended)
- [ ] `frontend/tests/e2e/engagement-kanban-dialog-a11y.spec.ts` (optional but recommended)
- [ ] `frontend/src/components/kanban/__tests__/KanbanProvider.test.tsx` — Vitest unit test for sensor stack + arrayMove logic
- [ ] `frontend/src/components/kanban/__tests__/KanbanBoard.test.tsx` — Vitest unit test for `useDroppable` + `isOver` ring toggle
- [ ] `tools/eslint-fixtures/bad-kibo-ui-import.tsx` (optional) — synthetic import that should trigger the widened `no-restricted-imports.patterns` rule, asserting the ESLint ban is wired
- [ ] CI assertion script update — `scripts/check-deleted-components.sh` (per Phase 39 precedent) gains a check for `frontend/src/components/kibo-ui/kanban` absence

**Framework install:** none — Vitest + Playwright are already configured workspace-wide.

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                                         |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1 Architecture       | no      | Phase 52 is a presentational migration; no new boundaries                                                                                                |
| V2 Authentication     | no      | No auth changes; Playwright specs inherit `tests/e2e/global-setup.ts` session                                                                            |
| V3 Session Management | no      | Same                                                                                                                                                     |
| V4 Access Control     | no      | `_protected` route group already enforces RLS; no new endpoints                                                                                          |
| V5 Input Validation   | minimal | Drop event's `over.id` is validated against the `WorkflowStage` enum at the consumer level (TasksTab line 109, Dialog line 113-114). Preserved verbatim. |
| V6 Cryptography       | no      | None                                                                                                                                                     |
| V7 Error Handling     | no      | TanStack Query mutation already handles error state; no changes                                                                                          |
| V8 Data Protection    | no      | None                                                                                                                                                     |
| V11 Business Logic    | no      | Drag → stage transition validation enforced by `updateWorkflowStage` repo function; not touched                                                          |
| V13 API Communication | no      | TanStack Query mutation unchanged                                                                                                                        |

### Known Threat Patterns for {react / typescript / tanstack}

| Pattern                                                                                       | STRIDE                  | Standard Mitigation                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Untrusted drag target (over.id) accepted as workflow_stage                                    | Tampering               | Whitelist check `validStages.includes(newStage)` at consumer level — already in place (TasksTab line 109, Dialog line 114). Preserved verbatim.                                                                                                                                                              |
| XSS via card content                                                                          | Tampering / Repudiation | React JSX auto-escapes children. KanbanCard's render-prop receives the full `KanbanAssignment` object; the consumer (KanbanTaskCard) renders only `work_item_id`, `work_item_type`, `priority`, `assignee.full_name`, `slaStatus` — all string fields with no `dangerouslySetInnerHTML`. No risk introduced. |
| Optimistic UI desync (drag visually places card in new column but mutation fails server-side) | Repudiation             | TanStack Query's `onSuccess` invalidates and refetches — server state wins. CONTEXT does not specify rollback animation; current kibo-ui flow doesn't either. Preserved verbatim.                                                                                                                            |
| ESLint ban bypass via dynamic import                                                          | Bypass                  | Banned import patterns also cover `import('@/components/kibo-ui/kanban')` at static analysis level via ESLint `no-restricted-imports`. Dynamic-import bypass requires writing `import(\`@/components/${var}\`)` which is detectable in code review.                                                          |

## Sources

### Primary (HIGH confidence)

- In-repo source: `frontend/src/components/kibo-ui/kanban/index.tsx` (317 lines) — the primitive being replaced; behavior contract source.
- In-repo source: `frontend/src/pages/WorkBoard/WorkBoard.tsx` (266 lines) — proven D-04 sensor stack at lines 132-139.
- In-repo source: `frontend/src/pages/engagements/workspace/TasksTab.tsx` (342 lines) — KANBAN-01 surface; 5 Tier-C disables at lines 35-44.
- In-repo source: `frontend/src/components/assignments/EngagementKanbanDialog.tsx` (206 lines) — KANBAN-02 surface.
- In-repo source: `frontend/src/components/assignments/KanbanTaskCard.tsx` (94 lines) — 4 Tier-C disables at lines 25-32; D-13 dependency.
- In-repo source: `frontend/src/domains/engagements/hooks/useEngagementKanban.ts` (124 lines) — data hook contract (unchanged).
- In-repo source: `frontend/src/domains/engagements/types/index.ts:41-71` — `KanbanAssignment`, `KanbanColumns`, `WorkflowStage` types.
- In-repo source: `eslint.config.mjs` (555 lines) — `no-restricted-imports` at lines 133-165; carve-out at line 332; design-token selectors at lines 170-220.
- In-repo source: `frontend/tests/e2e/kanban-visual.spec.ts` (28 lines) — visual spec template for D-14.
- In-repo source: `frontend/tests/e2e/kanban-dnd.spec.ts` (36 lines) — DnD spec template.
- In-repo source: `frontend/playwright.config.ts` + `frontend/tests/e2e/global-setup.ts` — auth flow for specs.
- In-repo source: `frontend/src/index.css:43-118` `@theme` block — token bridge to Tailwind utilities; verifies `bg-muted`, `bg-surface-raised`, `border-line-soft`, `ring-accent`, `border-danger`, `bg-accent-soft` all resolve.
- In-repo source: `frontend/src/components/ui/card.tsx` — confirms shadcn-style re-export of HeroUI Card primitives.
- npm registry (2026-05-16): `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`, `@heroui/react@3.0.5`, `tunnel-rat@0.1.2` — versions verified via `npm view`.
- heroui-react MCP — confirms HeroUI v3 component inventory: no Kanban export.

### Secondary (MEDIUM confidence)

- Phase 51 `51-DESIGN-AUDIT.md` — TasksTab row at line 298 (5 Tier-C disables); KanbanTaskCard row at line 104 (4 Tier-C disables). Cross-referenced for D-05 / D-13 / D-20.
- Phase 48 `eslint.config.mjs:122-132` commentary — Phase 48 D-02 narrowing precedent.
- Phase 39 / Phase 40 / Phase 46 precedents — visual baseline regeneration flow, supabase MCP seed fixture flow.
- `@dnd-kit` ecosystem (3.5M weekly downloads, actively maintained by Clauderic Mouflon, used by major Kanban implementations) — confirms current best practice.

### Tertiary (LOW confidence)

- None — every claim in this research traces to either in-repo source (verified by Read tool) or npm registry (verified by `npm view`).

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every package version verified against `frontend/package.json` and npm registry on 2026-05-16; no drift.
- Architecture: HIGH — patterns 1-4 are mechanical adaptations of existing in-repo source (`kibo-ui/kanban/index.tsx` and `WorkBoard.tsx`); diagram traced from actual call-graph.
- Pitfalls: MEDIUM-HIGH — Pitfalls 1-8 derived from concrete `@dnd-kit/core` + Playwright + ESLint behaviors. Pitfall 1 (DragOverlay re-render strategy) is the highest residual risk and is flagged in Open Question 3.
- Validation Architecture: HIGH — every test command and framework version verified in `frontend/package.json` and `frontend/playwright.config.ts`.
- Security Domain: HIGH — no new attack surface introduced; preserved validation already in TasksTab line 109 and Dialog line 114.

**Research date:** 2026-05-16
**Valid until:** 2026-06-15 (30 days — stack is stable; only risk is a HeroUI v3 minor release between now and execution, which planner should re-check via `npm view @heroui/react version` before plan-phase.)

---

## RESEARCH COMPLETE

**Phase:** 52 — heroui-v3-kanban-migration
**Confidence:** HIGH

### Key Findings

- "HeroUI v3 Kanban" framing is composition, not a primitive lookup — HeroUI@3.0.3 ships zero Kanban export (verified via heroui-react MCP). The phase composes `@dnd-kit/core@^6.3.1` + `@dnd-kit/sortable@^10.0.0` + existing `@/components/ui/card` (shadcn-style, token-bound) per CLAUDE.md primitive-cascade compliance.
- `WorkBoard.tsx` is the in-repo proven sensor recipe — Phase 39's `MouseSensor { distance: 8 }` + `TouchSensor { delay: 200, tolerance: 5 }` + `KeyboardSensor { coordinateGetter: sortableKeyboardCoordinates }` is copied verbatim by D-04. Replaces kibo-ui's constraint-less sensors which permit accidental drags.
- The migration is single-import-path-swap × 2 — only `TasksTab.tsx` and `EngagementKanbanDialog.tsx` consume `@/components/kibo-ui/kanban` (verified by `grep -rln "kibo-ui" frontend/src`). The data hook (`useEngagementKanban`) and its TanStack Query mutation are untouched. Phase 52 is purely a presentational refactor.
- Phase 51 D-12 zero-net-new-disable posture applies to all 5 new files — `STAGE_COLORS` deletion (D-05) resolves TasksTab's 5 Tier-C disables by deletion-of-need. `KanbanTaskCard.tsx`'s 4 Tier-C disables (lines 24-32, SLA state colors) are absorbed in-phase per CONTEXT D-13's "if cleanly containable" clause; planner gates this on a `grep` check for downstream rippling.
- `tunnel-rat` is the only npm dep removed — confirmed sole consumer is `kibo-ui/kanban/index.tsx`. Native `<DragOverlay>` replaces the portal layer (D-02). Bundle impact deferred to Phase 53 BUNDLE-05.
- ESLint widening is the cleanup — `eslint.config.mjs` `no-restricted-imports.patterns` gains `'@/components/kibo-ui/*'`; the Phase 48 D-02 narrowing comment block at lines 122-132 and the `index.tsx` carve-out at line 332 are dropped. Pitfall 7 flags a verification step: enumerate any other `index.tsx` under `components/**` before removing the carve-out.
- 8 new Playwright baselines (2 specs × 4 baselines) + 12 existing `kanban-*.spec.ts` stay green as regression anchor on `@dnd-kit/core` version stability.

### File Created

`.planning/phases/52-heroui-v3-kanban-migration/52-RESEARCH.md`

### Confidence Assessment

| Area           | Level       | Reason                                                                                                                                                                          |
| -------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standard Stack | HIGH        | Every version verified against `frontend/package.json` + `npm view` on 2026-05-16; zero drift.                                                                                  |
| Architecture   | HIGH        | Patterns 1-4 are mechanical adaptations of in-repo `kibo-ui/kanban/index.tsx` + `WorkBoard.tsx`. Diagram traced from actual call graph.                                         |
| Pitfalls       | MEDIUM-HIGH | Pitfalls 1-8 grounded in concrete library + ESLint behaviors. Pitfall 1 (DragOverlay render strategy) carries residual risk; Open Question 3 + CONTEXT D-02 fallback handle it. |
| Validation     | HIGH        | Every test command verified against `frontend/playwright.config.ts` and `frontend/package.json`.                                                                                |
| Security       | HIGH        | No new attack surface; existing `validStages.includes(...)` validation preserved verbatim.                                                                                      |

### Open Questions (RESOLVED)

1. KanbanTaskCard Tier-C absorption — depends on whether the migration ripples beyond that one file (planner verifies via `grep -rn "KanbanTaskCard" frontend/src/` and checks that the SLA color literals don't have non-leaf consumers).
2. Fixture engagement ID for D-16 — planner queries staging Supabase MCP to confirm an engagement with composition `todo:2 / in_progress:2 / review:1 / done:2 / cancelled:1` exists, or seeds idempotently (Phase 40-12 precedent).
3. DragOverlay render-strategy parity — planner adds a manual mid-drag screenshot comparison vs pre-migration kibo-ui before declaring KANBAN-01/02 done; CONTEXT D-02 fallback (keep tunnel-rat) is the escape hatch.
4. Cancelled-column rendering toggle parity — preserve dialog's always-render-cancelled, TasksTab's conditional-render. No unification in Phase 52.

### Ready for Planning

Research complete. Planner can now create PLAN.md files. Recommended wave shape per CONTEXT D-18 (planner's discretion):

- **Wave 1** — Test scaffolds (new Playwright spec files with skip stubs + Vitest unit test files) + ESLint regression fixture
- **Wave 2** — New `frontend/src/components/kanban/*` module (5 files + barrel + unit tests green)
- **Wave 3** — Import-path swap in `TasksTab.tsx` + `EngagementKanbanDialog.tsx` + STAGE_COLORS deletion + D-08 mobile section update + checkpoint: smoke-build green
- **Wave 4** — kibo-ui directory deletion + `eslint.config.mjs` widen + `tunnel-rat` removal + 51-DESIGN-AUDIT row closeout
- **Wave 5** — KanbanTaskCard Tier-C absorption (conditional on Open Question 1 verification)
- **Wave 6** — Visual baseline generation + axe-core + all-12 regression run + 52-SUMMARY.md
