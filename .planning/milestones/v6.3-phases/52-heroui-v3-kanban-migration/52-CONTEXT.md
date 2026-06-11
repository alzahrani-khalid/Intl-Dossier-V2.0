# Phase 52: HeroUI v3 Kanban Migration - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate the two kibo-ui kanban consumers (`frontend/src/pages/engagements/workspace/TasksTab.tsx` and `frontend/src/components/assignments/EngagementKanbanDialog.tsx`) off the vendored `@/components/kibo-ui/kanban` primitive onto a new shared, design-token-compliant Kanban primitive built on `@dnd-kit/core` + `@dnd-kit/sortable` + existing `@/components/ui/card`. Behavior parity (drag/drop/column transitions, mouse + touch + keyboard) is mandatory per KANBAN-01 / KANBAN-02. After both call sites are migrated, the local `frontend/src/components/kibo-ui/kanban/` directory is deleted, the existing ESLint `no-restricted-imports` ban is widened to cover the deleted local path, and the Phase 48 narrowing comment + `index.tsx` carve-out are cleaned up. EN + AR Playwright visual baselines are regenerated for both surfaces; the full `kanban-*.spec.ts` suite must stay green.

Phase 52 is born design-token-compliant per Phase 51 D-01 / D-12: the migrated surfaces ship with ZERO new `eslint-disable-next-line no-restricted-syntax` directives, AND the 5 existing Tier-C disables in `TasksTab.tsx` (lines 35-44, STAGE_COLORS bg-slate/blue/amber/emerald/red 50/950) are resolved in-phase by dropping bespoke per-stage backgrounds.

**Out of phase boundary (do NOT attempt in Phase 52):**

- Migrating `frontend/src/pages/WorkBoard/WorkBoard.tsx` or the `/kanban` route — already runs `@dnd-kit/core` directly, no kibo-ui dependency, out of KANBAN-01/02 named scope.
- Refactoring `frontend/src/components/assignments/KanbanTaskCard.tsx` inner content beyond what's required to remove any Tier-C disable it carries.
- Replacing `@/components/ui/card` (shadcn-style) with HeroUI v3 Card primitive across the surfaces — primitive choice locked to existing `@/components/ui/card` for narrow-blast-radius migration.
- Bundle ceiling tightening — Phase 53 owns BUNDLE-05 after this migration shifts vendor chunk composition.
- New Kanban capabilities (new columns, swimlanes, WIP limits, drag-by-handle) — not in KANBAN-01..04.
- Chart palette token migration — Phase 51 Tier-B deferred to a future "chart palette tokens" phase.

</domain>

<decisions>
## Implementation Decisions

### Migration shape

- **D-01 (Shared primitive at `frontend/src/components/kanban/`):** New module exposes five components — `KanbanProvider`, `KanbanBoard`, `KanbanHeader`, `KanbanCards`, `KanbanCard` — mirroring the kibo-ui API surface verbatim (same prop names: `columns`, `data`, `onDragEnd`, `onDragOver`, `onDragStart`, `onDataChange`, render-prop `children`, `id`, `name`, `column`). Single source of truth for both surfaces; minimizes call-site diff (one import path swap). Easier to add to ESLint ban later because deletion targets are co-located.
- **D-02 (Mirror kibo-ui API exactly + drop `tunnel-rat` dep — Claude discretion):** The shared primitive does NOT re-export `tunnel-rat`. Replace the `tunnel.In` / `tunnel.Out` portal-bridge for DragOverlay with native `@dnd-kit/core` `DragOverlay` child wired directly inside `KanbanProvider`. Removes one external npm dep from `frontend/package.json` (line 134 `"tunnel-rat": "^0.1.2"`). Same external behavior; smaller bundle.
- **D-03 (Preserve live reorder on `onDragOver` via `arrayMove`):** The current kibo-ui `handleDragOver` mutates `data` via `@dnd-kit/sortable` `arrayMove` so a card visually crosses into the hovered column WHILE dragging (not just on drop). Preserved verbatim — KANBAN-01 explicitly states "drag/drop/column transitions… preserved". WorkBoard's drop-only model is NOT adopted here.
- **D-04 (WorkBoard sensor configuration):** The shared `KanbanProvider` ships with the WorkBoard-proven sensor stack:
  - `useSensor(MouseSensor, { activationConstraint: { distance: 8 } })` — prevents accidental drags on click
  - `useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })` — long-press to drag on touch
  - `useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })` — proper keyboard drag with `@dnd-kit/sortable` helpers
    Replaces kibo-ui's constraint-less sensors (which permit accidental drags). Mirrors `frontend/src/pages/WorkBoard/WorkBoard.tsx:132-139`.

### Stage backgrounds (token compliance)

- **D-05 (Drop bespoke `STAGE_COLORS` entirely):** TasksTab `STAGE_COLORS` constant (lines 34-45) is deleted. The new shared `KanbanBoard` ships flat across all stages. Eliminates ALL 5 Tier-C `eslint-disable-next-line no-restricted-syntax` directives that Phase 51 left in `TasksTab.tsx`. Aligns with CLAUDE.md `§Design rules` "No gradient backgrounds. Surfaces are flat." and Phase 51 D-12 zero-net-new-disable posture (migrated code is born compliant).
- **D-06 (Shared primitive defaults: column `bg-muted/30 border-muted`, header `bg-muted/50 border-b`):** `EngagementKanbanDialog` already uses these token-compliant classes; the new `KanbanBoard` defaults to them. Both surfaces consume defaults; per-surface `className` overrides reserved for layout (min-width, gap, padding) — NOT color. Single visual source for both surfaces.
- **D-07 (Cancelled column cue: border-only):** When the cancelled column is rendered (TasksTab only renders it when non-empty per existing `activeStages` logic at lines 59-63), it gets a `border-danger/30` 1px outline; column BODY background stays `bg-muted/30`. No `bg-danger/10` body tint. Reads as muted-but-flagged; preserves flat-surface rule.
- **D-08 (Mobile-stacked branch matches desktop tokens):** `MobileStageSection` (TasksTab lines 261-342) drops `STAGE_COLORS[stage]` from its outer `<div className={rounded-lg border ${STAGE_COLORS[stage]} ...}>`. Replaces with `bg-muted/30 border-muted` (or `border-danger/30` for cancelled). Visual parity desktop → mobile; one fewer mental model. Mobile mobile-stacked accordion behavior (collapse/expand + "Move to" select) preserved verbatim.

### Card primitive

- **D-09 (Reuse `@/components/ui/card` for `KanbanCard` wrapper):** Inner draggable shell wraps in the existing shadcn-style `<Card>` already imported by kibo-ui (`frontend/src/components/kibo-ui/kanban/index.tsx:26`). The `hover:shadow-md` Tailwind class currently applied in `KanbanCard` is STRIPPED — violates CLAUDE.md "No drop-shadows on cards". `KanbanTaskCard` (the inner content component) is unchanged. HeroUI v3 Card primitive is NOT introduced here; the primitive cascade preference is overridden because (a) WorkBoard's `KCard` also uses `@/components/ui/card`, (b) `KanbanTaskCard` is already designed against shadcn Card APIs, (c) narrowing blast radius — Phase 52 is a migration, not a redesign.
- **D-10 (Hover state: `bg-surface-raised` + `border-line-soft`):** Card hover replaces `hover:shadow-md` with `hover:bg-surface-raised` + `hover:border-line-soft`. Matches IntelDossier prototype's hovered-list-row pattern (CLAUDE.md `§Design rules`: shadow reserved for drawers/hovered list rows; "hovered list rows" interpreted token-wise as a `bg-surface-raised` shift, not a box-shadow).
- **D-11 (Drag overlay: `ring-2 ring-accent`):** Drag overlay card carries `ring-2 ring-accent` instead of kibo-ui's `ring-2 ring-primary`. Accent is the IntelDossier interactive token used for focus indicators across the prototype; consistent semantic. No `box-shadow` on the overlay either — the ring + position offset is enough visual lift.
- **D-12 (Drop-target ring: `ring-2 ring-accent` on column dragOver):** `KanbanBoard` `useDroppable.isOver` state applies `ring-2 ring-accent` (replaces kibo-ui's `ring-primary`). Keeps the column-hover signal for keyboard users (KeyboardSensor moves don't trigger pointer events, so the ring is the only signal).
- **D-13 (`KanbanTaskCard` left untouched):** Phase 52 does not edit `frontend/src/components/assignments/KanbanTaskCard.tsx` UNLESS `rg "no-restricted-syntax" frontend/src/components/assignments/KanbanTaskCard.tsx` returns rows. If it does, the executor fixes those disables in-phase (born compliant); otherwise it stays. Narrows blast radius.

### Visual baseline matrix + Playwright gate

- **D-14 (Two new spec files, one per surface):**
  - `frontend/tests/e2e/tasks-tab-visual.spec.ts` — navigates to a seeded engagement's tasks tab (`/engagements/{seed-id}` then activates tab via existing UI hint or direct route param if available), screenshots full board (desktop) and full page (mobile-stacked branch).
  - `frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts` — opens `EngagementKanbanDialog` from its trigger entry point, screenshots dialog content (board portion masked from progress bar values).
  - Existing `frontend/tests/e2e/kanban-visual.spec.ts` (WorkBoard at `/kanban`) is NOT modified — different surface, different code path, stays green as a regression anchor.
- **D-15 (Viewport matrix — `{1280 × 800, 768 × 1024} × {EN, AR}`):** 4 baselines per surface (LTR @ 1280, RTL @ 1280, LTR @ 768, RTL @ 768). Mirrors the existing `kanban-visual.spec.ts` matrix shape at lines 3-8. The 768 viewport is REQUIRED for `tasks-tab-visual.spec.ts` to cover the `<md` mobile-stacked branch (TasksTab `lines 234-253` `<div className="block md:hidden ...">`). Dialog spec also includes 768 for completeness even though dialog is desktop-primary.
- **D-16 (Fixture-engagement seeding):** Both new specs seed a known engagement ID with a fixed assignment shape: `todo: 2`, `in_progress: 2`, `review: 1`, `done: 2`, `cancelled: 1` (so cancelled column renders, exercising D-07 border-only cue). Uses the existing supabase test-fixture pattern from other dossier visual specs (NOT mocked at the network layer; NOT a production-code test branch). Reproducible across local + CI.
- **D-17 (Full `kanban-*.spec.ts` suite must stay green):** Phase 52 CI gate covers BOTH the new visual specs AND every existing `kanban-*.spec.ts` file (`kanban-a11y`, `kanban-dnd`, `kanban-filters`, `kanban-render`, `kanban-responsive`, `kanban-rtl`, `kanban-search`, `kanban-visual`, `keyboard-navigation-kanban`, `drag-task-between-kanban-columns`, `open-kanban-board`, `realtime-kanban-updates-two-windows`, `performance/kanban-drag-drop-latency`). All 12 existing specs target `/kanban` (WorkBoard) which is not migrated in Phase 52, so they should stay green by default — green status is the regression signal that the migration didn't accidentally break WorkBoard via shared deps (`@dnd-kit/core` version bumps, etc.).

### Kibo-ui deletion + ESLint posture

- **D-18 (Delete order: migrate → smoke-build → delete → widen ban):** Plan ordering: (1) write new `frontend/src/components/kanban/*`, (2) swap imports in `TasksTab.tsx` + `EngagementKanbanDialog.tsx`, (3) run `pnpm --filter frontend build && pnpm --filter frontend lint && pnpm --filter frontend type-check` clean, (4) `rm -rf frontend/src/components/kibo-ui/kanban/`, (5) widen `eslint.config.mjs` `no-restricted-imports.patterns` to include `'@/components/kibo-ui/*'` AND drop the line 332 carve-out for `frontend/src/components/**/index.tsx` (no longer needed once `kibo-ui/kanban/index.tsx` is gone — Phase 48 D-02 carve-out was specifically for that path). Final commit also removes the multi-line 48-02 narrowing comment block (`eslint.config.mjs:125-132`) since the constraint it documented is resolved.
- **D-19 (Remove `tunnel-rat` from `frontend/package.json`):** After D-02 lands the native DragOverlay, `pnpm remove tunnel-rat --filter frontend` strips the dep + updates `pnpm-lock.yaml`. Verified by `pnpm --filter frontend ls tunnel-rat` returning empty. Bundle ceiling impact deferred to Phase 53 BUNDLE-05 measurement.
- **D-20 (`51-DESIGN-AUDIT.md` row closeout):** The Phase 51 audit row for `TasksTab.tsx` (5 Tier-C disables) gets updated as part of Phase 52 — strike-through the row or move to a "Resolved during Phase 52 migration" subsection. Documented in `52-SUMMARY.md`. Anchors traceability per Phase 51 D-04.

### Claude's Discretion

- **D-02:** Confirmed Claude-discretion choice on API shape — user picked "you decide"; default chose "mirror exactly + drop tunnel-rat". If planner finds a parity bug in the native DragOverlay swap during research, falling back to keeping tunnel-rat as a transitive dep is acceptable (D-19 becomes conditional).
- **D-09 hover-row interpretation:** CLAUDE.md `§Design rules` lists "hovered list rows" as a shadow-permitted surface. Phase 52 interprets this as a `bg-surface-raised` token shift (D-10), not a box-shadow utility — matches the flat-surface elsewhere in the prototype. If prototype `dashboard.jsx` shows actual `var(--shadow-lg)` on hovered rows, executor may swap to `hover:shadow-sm` with token-mapped shadow var.
- **D-14 trigger discovery:** The exact entry point for `EngagementKanbanDialog` (which page/button opens it) is for the researcher/planner to confirm via `rg "EngagementKanbanDialog"`. Spec writer may need to render the dialog component directly in a test harness route if there's no production trigger that's easy to drive headlessly.
- **D-15 viewport breakpoints:** Sticking with 1280/768 to match `kanban-visual.spec.ts`. Planner may add 1024 if the responsive collapse boundary surfaces a regression during dry-run; not required up-front.
- **D-18 sequencing:** The exact wave-split (single plan that does all 5 steps vs multi-plan with checkpoints between migration and deletion) is the planner's call. Phase 48 D-01 pattern (rule-config + violation-fix in one phase, separate plans) is the precedent; either shape works.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope + requirements

- `.planning/ROADMAP.md` §"Phase 52: HeroUI v3 Kanban Migration" — Goal, depends-on (Phase 50 + Phase 51), KANBAN-01..04 success criteria.
- `.planning/REQUIREMENTS.md` §"Kanban migration (KANBAN)" — KANBAN-01..04 verbatim; §"Out of Scope" line 56 ("Migrating to a different Kanban primitive than HeroUI v3 + `@dnd-kit/core` — primitive cascade locked per CLAUDE.md").
- `.planning/STATE.md` — milestone v6.3 progress (5/5 phases sealed pre-52); Phase 51 close summary (Tier-C disables + zero-net-new-disable posture inherited).

### Prior phase context (carry-forward decisions)

- `.planning/phases/51-design-token-compliance-gate/51-CONTEXT.md` D-01 (tri-tier triage), D-12 (zero net-new `eslint-disable` outside audit-traced Tier-C), D-04 (`51-DESIGN-AUDIT.md` row format) — informs D-05 (drop STAGE_COLORS), D-13 (KanbanTaskCard audit), D-20 (audit row closeout).
- `.planning/phases/48-lint-config-alignment/48-CONTEXT.md` — Phase 48 D-02 (`components/**/index.tsx` carve-out narrowing context), 48-02 multi-line comment block at `eslint.config.mjs:125-132` documenting why the local `kibo-ui` path is NOT yet banned (Phase 52 D-18 resolves this).
- `.planning/phases/50-test-infrastructure-repair/50-CONTEXT.md` — green test infra precondition; D-13 smoke-PR pattern (NOT required for Phase 52 since no branch-protection PUT, but precedent for "real CI exits green before declaring done").

### Project conventions (non-negotiable)

- `CLAUDE.md §"Visual Design Source of Truth (READ BEFORE ANY UI WORK)"` — IntelDossier prototype path; `frontend/design-system/inteldossier_handoff_design/src/dashboard.jsx` is the canonical Card / list-row pattern reference.
- `CLAUDE.md §"Design rules — non-negotiable"` — "Borders are `1px solid var(--line)`. No drop-shadows on cards. Shadow is reserved for drawers (`var(--shadow-lg)`) and hovered list rows." — anchors D-09 / D-10.
- `CLAUDE.md §"Component Library Strategy"` — HeroUI v3 → Radix → custom cascade; "Banned without explicit user request: Aceternity UI, Kibo UI". D-09 documents the explicit override-with-rationale for staying on `@/components/ui/card` instead of HeroUI v3 Card.
- `CLAUDE.md §"Responsive Design"` — desktop-primary 1280-1400; mobile <768 read-only. Drives D-15 viewport matrix.
- `CLAUDE.md §"Arabic RTL Support Guidelines (MANDATORY)"` — RTL-safe Tailwind logical properties (`ms-*`, `pe-*`, `start-*`, `end-*`); the new `KanbanBoard` must NOT introduce `left`/`right`/`ml-`/`mr-` physical properties.

### Source files to modify or read before planning

- `frontend/src/components/kibo-ui/kanban/index.tsx` (317 lines) — the primitive being replaced; new module preserves prop shapes from this file's exports.
- `frontend/src/pages/engagements/workspace/TasksTab.tsx` (342 lines, lines 34-45 STAGE_COLORS Tier-C disables, lines 234-253 mobile branch, lines 261-342 `MobileStageSection`) — KANBAN-01 surface.
- `frontend/src/components/assignments/EngagementKanbanDialog.tsx` (206 lines) — KANBAN-02 surface.
- `frontend/src/components/assignments/KanbanTaskCard.tsx` — inner card content shared by both surfaces; reviewed in D-13.
- `frontend/src/pages/WorkBoard/WorkBoard.tsx` (266 lines, lines 32-41 dnd-kit imports, lines 131-141 sensors) — in-repo reference pattern for `@dnd-kit/core` direct use; D-04 sensor config is copied from here.
- `frontend/src/components/ui/card.tsx` — Card primitive D-09 keeps; needs to read before stripping `hover:shadow-md`.
- `frontend/src/hooks/useEngagementKanban.ts` (and `frontend/src/domains/engagements/hooks/useEngagementKanban.ts`) — data hook contracts that both surfaces consume; their interface MUST NOT change in Phase 52.

### ESLint config

- `eslint.config.mjs:122-165` (`no-restricted-imports` block) — current ban shape; D-18 widens patterns to include `'@/components/kibo-ui/*'`.
- `eslint.config.mjs:125-132` (48-02 narrowing comment block) — multi-line comment documenting the temporary carve-out for `@/components/kibo-ui/*`; deleted in D-18.
- `eslint.config.mjs:332` (`'frontend/src/components/**/index.tsx'` files entry under index.tsx carve-out) — Phase 48 D-02 line referenced in D-18 cleanup; carve-out may be removed once `kibo-ui/kanban/index.tsx` is deleted.
- `eslint.config.mjs:170-198` (`no-restricted-syntax` RTL selectors) — pattern for the design-token gate from Phase 51 D-05; informs how the new primitive's classes must be authored.

### Playwright

- `frontend/tests/e2e/kanban-visual.spec.ts` (28 lines) — viewport matrix shape mirrored by D-14 / D-15.
- `frontend/tests/e2e/kanban-dnd.spec.ts`, `kanban-rtl.spec.ts`, `kanban-a11y.spec.ts`, `keyboard-navigation-kanban.spec.ts`, `drag-task-between-kanban-columns.spec.ts`, `kanban-render.spec.ts`, `kanban-responsive.spec.ts`, `kanban-filters.spec.ts`, `kanban-search.spec.ts`, `realtime-kanban-updates-two-windows.spec.ts`, `open-kanban-board.spec.ts`, `performance/kanban-drag-drop-latency.spec.ts` — 12 existing specs; D-17 gate requires they stay green.
- `frontend/playwright.config.ts` (or equivalent) — reads before writing fixture seeding (D-16) to confirm whether `globalSetup` already seeds engagements.

### Token system (where the gate's implicit allowlist lives)

- `frontend/src/index.css` `@theme` block (lines 43-110, per Phase 51 D-06) — token names used by D-06/D-10/D-11/D-12 (`bg-muted/30`, `border-muted`, `bg-surface-raised`, `border-line-soft`, `ring-accent`, `border-danger`). Every class in this CONTEXT.md must resolve to a name in `@theme`.
- `frontend/src/design-system/inteldossier_handoff_design/handoff/app.css` — production prototype stylesheet; cross-reference for card / hover / drag-overlay precedents.
- `frontend/src/design-system/inteldossier_handoff_design/src/dashboard.jsx` — canonical Card pattern (D-09 hover-row interpretation reference).
- `frontend/src/lib/semantic-colors.ts` — Phase 51 D-11 anchor; NOT extended in Phase 52 (D-05 drops bespoke per-stage colors entirely rather than centralizing them in semantic-colors).

### Tests + types

- `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` — existing dnd-kit test pattern; reference for any unit tests added around the new shared primitive.
- `frontend/src/types/work-item.types.ts` `WorkflowStage` / `WorkSource` / `Priority` — shared types; both surfaces depend on them via `useEngagementKanban`.

### Dependencies to remove

- `frontend/package.json` line 134 (`"tunnel-rat": "^0.1.2"`) — D-19 removes.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`frontend/src/pages/WorkBoard/WorkBoard.tsx`** (266 lines) — already runs `@dnd-kit/core` direct without kibo-ui; sensor config (lines 132-139) is the D-04 source. `handleDragEnd` shape (lines 143-180) is a working in-repo precedent.
- **`@/components/ui/card`** — already used by kibo-ui KanbanCard AND WorkBoard KCard; D-09 reuses it for new `KanbanCard`. No new primitive needed.
- **`@/components/ui/scroll-area`** + **`@/components/ui/dialog`** + **`@/components/ui/progress`** + **`@/components/ui/badge`** + **`@/components/ui/button`** — already imported by both target surfaces; new primitive doesn't add wrapping requirements.
- **`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`** — already in `frontend/package.json`; no new deps for the shared primitive.
- **`useEngagementKanban` hook + `KanbanColumns` / `KanbanAssignment` / `WorkflowStage` types** — data contracts unchanged in Phase 52; D-13 leaves them.
- **Existing `kanban-visual.spec.ts` shape** — `addInitScript` for `i18nextLng`, `addStyleTag` for animation-disable, `setViewportSize`, `page.fonts.ready` wait — copy-paste pattern for D-14 specs.

### Established Patterns

- **`@dnd-kit/core` direct use over wrapper libs** — WorkBoard already proves the pattern works in this codebase with TanStack Router routes, i18n, and TanStack Query. Phase 52 generalizes it as a shared primitive instead of an inline composition.
- **Tier-C `eslint-disable` resolution by deletion-of-need (NOT by suppression)** — Phase 51 D-12 / Phase 52 D-05 / D-08: when migrating code that carried Tier-C disables, the preferred fix is removing the literal entirely (drop `STAGE_COLORS`), not migrating the literal to a token in-place. This shrinks `51-DESIGN-AUDIT.md` rows organically.
- **Visual-baseline spec shape from `kanban-visual.spec.ts`** — `localStorage.setItem('i18nextLng', dir === 'rtl' ? 'ar' : 'en')` via `addInitScript`, all-animations-zero via `addStyleTag`, `toHaveScreenshot` with `maxDiffPixelRatio: 0.01, fullPage: true`. D-14 specs follow this exact shape.
- **ESLint `no-restricted-imports.patterns` glob ban** — Phase 48 D-05 + D-06 precedent for path-based ban on local dirs. D-18 widens this; no new mechanism.
- **Per-file rule overrides via `files`-blocks** (not global `ignores`) — Phase 51 D-13 pattern; D-18's `index.tsx` carve-out removal follows the same `files`-block structure.

### Integration Points

- **`frontend/src/components/kanban/index.ts`** (new) — barrel export for the five new components. Re-exports `DragEndEvent` type for consumer ergonomics (matches kibo-ui pattern at line 32).
- **`frontend/src/components/kanban/KanbanProvider.tsx`** (new) — owns sensors + DndContext + DragOverlay; replaces tunnel-rat with native `<DragOverlay>` child.
- **`frontend/src/components/kanban/KanbanBoard.tsx`** (new) — owns `useDroppable` + drop-target `ring-2 ring-accent`.
- **`frontend/src/components/kanban/KanbanCard.tsx`** (new) — owns `useSortable` + `@/components/ui/card` wrapper; hover/drag styles per D-10/D-11.
- **`frontend/src/components/kanban/KanbanCards.tsx`** (new) — owns `SortableContext` + `<ScrollArea>` (kibo-ui pattern preserved).
- **`frontend/src/components/kanban/KanbanHeader.tsx`** (new) — owns column header chrome with `bg-muted/50 border-b`.
- **`frontend/src/pages/engagements/workspace/TasksTab.tsx`** — single import-path swap (`@/components/kibo-ui/kanban` → `@/components/kanban`) + STAGE_COLORS deletion + 5 Tier-C disables removed + mobile section className updated per D-08.
- **`frontend/src/components/assignments/EngagementKanbanDialog.tsx`** — single import-path swap. No other content changes (already token-compliant).
- **`frontend/src/components/kibo-ui/kanban/` dir** — DELETED at D-18 step 4.
- **`eslint.config.mjs`** — D-18 widens patterns + drops 48-02 comment + drops `index.tsx` carve-out for the deleted path.
- **`frontend/package.json` + `pnpm-lock.yaml`** — `pnpm remove tunnel-rat --filter frontend` (D-19).
- **`frontend/tests/e2e/tasks-tab-visual.spec.ts`** (new, D-14) — 4 baselines (2 viewports × 2 dirs).
- **`frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts`** (new, D-14) — 4 baselines (2 viewports × 2 dirs).
- **Phase 51 `51-DESIGN-AUDIT.md`** — TasksTab row updated/struck-through per D-20.

### Sweep delta (current state, 2026-05-16)

- **kibo-ui consumers:** 2 files only — `frontend/src/components/assignments/EngagementKanbanDialog.tsx` and `frontend/src/pages/engagements/workspace/TasksTab.tsx` (confirmed via `grep -rln "from '@/components/kibo-ui" frontend/src`).
- **`@heroui/react` installed at v3.0.3** (`frontend/package.json`) — primitives in use: Modal, Button, Drawer, Card (heroui-card.tsx wrapper), Skeleton, Forms, Chip, Switch, Tabs. Confirmed HeroUI v3 has no shipped Kanban primitive — composition over `@dnd-kit/core` is the correct interpretation of "HeroUI v3 + @dnd-kit/core" in KANBAN-01/02.
- **`tunnel-rat`** present only as a kibo-ui transitive dep (`grep -rln "tunnel-rat" frontend/src` returns only `components/kibo-ui/kanban/index.tsx`). Safe to remove post-migration.
- **`TasksTab.tsx` Tier-C disables:** exactly 5 at lines 35, 37, 39, 41, 43 — all on `STAGE_COLORS` palette literals. No other Tier-C disables in either target file (`grep -n "eslint-disable" frontend/src/components/assignments/EngagementKanbanDialog.tsx frontend/src/pages/engagements/workspace/TasksTab.tsx`).

</code_context>

<specifics>
## Specific Ideas

- **"HeroUI v3 Kanban" framing in ROADMAP is a composition statement, not a primitive request.** HeroUI v3.0.3 ships no Kanban component (confirmed against `@heroui/react` exports). The phase intent — confirmed across CLAUDE.md primitive cascade + REQUIREMENTS Out-of-Scope line 56 — is: build a Kanban using the HeroUI-cascade-compliant primitives we already have (Card via shadcn primitive is acceptable under the cascade because it's a token-bound custom layer; HeroUI Card is not added here per D-09 narrow-blast-radius reasoning) plus `@dnd-kit/core` directly. The "HeroUI v3" framing IS a CLAUDE.md primitive cascade reminder, not "find a HeroUI Kanban export".
- **WorkBoard is the in-repo reference implementation.** D-04 sensors + D-03 live-reorder vs WorkBoard's drop-only model is the key delta. Phase 52 picks live-reorder because KANBAN-01 explicitly says "behavior parity" with kibo-ui; WorkBoard's drop-only model would be a behavior regression for users of TasksTab.
- **Born-compliant inheritance from Phase 51 is mechanical.** TasksTab's 5 Tier-C disables exist only because Phase 51 hit a deadline-driven Tier-A/Tier-B/Tier-C split. Phase 52 closes them not by writing a token map but by deleting `STAGE_COLORS` entirely (D-05) — the FLAT surface posture (CLAUDE.md) was the right answer all along; STAGE_COLORS was kibo-ui-inherited skin, not a deliberate IntelDossier design decision.
- **kibo-ui ban widening is the cleanest cleanup.** D-18 walks the staircase: rule narrowing comment (48-02) → widening (52-D-18) → carve-out removal. Mirrors Phase 48 D-09's "TODO(Phase 2+)" → "Phase 51 fully fires" arc.

</specifics>

<deferred>
## Deferred Ideas

- **HeroUI v3 Card migration.** D-09 keeps `@/components/ui/card` for narrow-blast-radius. A future "primitive cascade alignment" phase could swap all shadcn Card consumers (KanbanCard, KCard, dashboard cards) to HeroUI v3 Card simultaneously. Out of Phase 52 scope.
- **Bundle ceiling tightening.** Removing `tunnel-rat` (D-19) shifts the vendor chunk; the measured delta belongs in Phase 53 BUNDLE-05's "lowered 349 → ~285 KB gz" calibration step. Phase 52 records the removal, Phase 53 measures the impact.
- **Migrating WorkBoard to use the new shared `@/components/kanban` primitive.** WorkBoard runs inline `DndContext` today. Could be refactored to compose the new shared primitive for cross-surface consistency. Not in KANBAN-01..04; future polish.
- **`KanbanTaskCard` prototype-alignment refactor.** D-13 leaves it; the inner card content is functional but doesn't fully match prototype dashboard.jsx card patterns (priority chip + SLA chip + 2-line title layout). Future "kanban polish" phase.
- **Visual baseline 1024 viewport.** D-15 sticks with 1280/768. If the responsive collapse boundary (CLAUDE.md 1024-1399 band) surfaces a regression after launch, a third viewport row gets added; not pre-emptive.
- **Fixture seeding for the WHOLE `kanban-*.spec.ts` suite.** D-16 fixtures only the two new specs. Bringing the other 12 specs onto the same fixture engagement would make CI more deterministic but is a separate hardening effort.
- **Strict-mode keyboard drag indicator.** A "you can drag this card" affordance for keyboard users (small grip icon, focus-visible outline color shift). Functional today via the announcements API but visually invisible; a future a11y polish phase.
- **Reviewed Todos** — none folded or reviewed this phase (no `cross_reference_todos` matches surfaced).

</deferred>

---

_Phase: 52-heroui-v3-kanban-migration_
_Context gathered: 2026-05-16_
