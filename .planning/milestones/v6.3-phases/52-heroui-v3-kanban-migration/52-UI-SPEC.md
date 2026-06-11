---
phase: 52
slug: heroui-v3-kanban-migration
status: approved
shadcn_initialized: true
preset: existing (frontend/components.json — style: new-york, baseColor: neutral)
direction: bureau
created: 2026-05-16
revised: 2026-05-16 (typography + spacing reconciliation per checker BLOCK)
reviewed_at: 2026-05-16T00:00:00Z
---

# Phase 52 — UI Design Contract

> Visual and interaction contract for the HeroUI v3 Kanban migration (TasksTab + EngagementKanbanDialog). Pre-populated from CONTEXT.md, REQUIREMENTS.md, ROADMAP.md, and `frontend/design-system/inteldossier_handoff_design/` (IntelDossier Bureau prototype). Phase 52 is a **migration**, not a redesign — the contract codifies the token-bound surface that replaces kibo-ui without altering data flow, layout shape, or copy.

---

## Phase Scope (what this contract covers)

| Surface                         | Path                                                                                                    | Behavior                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| TasksTab (engagement workspace) | `frontend/src/pages/engagements/workspace/TasksTab.tsx`                                                 | 5-column board, live-reorder DnD, mobile-stacked accordion |
| EngagementKanbanDialog          | `frontend/src/components/assignments/EngagementKanbanDialog.tsx`                                        | Modal-hosted 5-column board, live-reorder DnD              |
| Shared primitive (new)          | `frontend/src/components/kanban/*` (KanbanProvider, KanbanBoard, KanbanHeader, KanbanCards, KanbanCard) | Token-bound replacement for `@/components/kibo-ui/kanban`  |

Out of scope (do NOT touch): `WorkBoard.tsx` (`/kanban` route), `KanbanTaskCard.tsx` inner content unless it carries Tier-C disables, chart palette tokens, bundle ceiling.

---

## Design System

| Property                      | Value                                                                                                                                                         | Source                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Tool                          | shadcn (existing `frontend/components.json`, style `new-york`, baseColor `neutral`, cssVariables `true`)                                                      | Detected                                                                                                 |
| Preset                        | not applicable (project uses IntelDossier Bureau token engine, not a shadcn preset)                                                                           | CLAUDE.md §"Visual Design Source of Truth"                                                               |
| Primitive cascade (locked)    | HeroUI v3 → Radix → custom token-bound                                                                                                                        | CLAUDE.md §"Component Library Strategy"                                                                  |
| DnD primitive (locked)        | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` direct (already in deps; no wrapper)                                                             | CONTEXT.md D-04, REQUIREMENTS.md §"Out of Scope" line 56                                                 |
| Card primitive for KanbanCard | `@/components/ui/card` (shadcn-style, token-mapped) — HeroUI v3 Card NOT introduced here                                                                      | CONTEXT.md D-09 (narrow-blast-radius override of cascade preference; rationale documented in 52-CONTEXT) |
| Surface primitives reused     | `@/components/ui/scroll-area`, `dialog`, `progress`, `badge`, `button` (all token-mapped)                                                                     | CONTEXT.md §"Reusable Assets"                                                                            |
| Icon library                  | `lucide-react` (already imported by both surfaces — Plus, ChevronDown, ChevronUp, ArrowDownUp, ClipboardList, X, LayoutGrid, FileText, Clock) — kept verbatim | Existing call sites                                                                                      |
| Font (Latin)                  | `Inter` (Bureau direction, `--font-display` / `--font-body`)                                                                                                  | `tokens/directions.ts`, `frontend/src/index.css` `@theme`                                                |
| Font (Arabic)                 | `Tajawal` via `html[dir="rtl"] *` cascade                                                                                                                     | `colors_and_type.css:174-176`                                                                            |
| Font (mono)                   | `JetBrains Mono` (`--font-mono`) — used for SLA chip + ID labels only                                                                                         | `tokens/directions.ts`                                                                                   |
| Token bridge                  | Tailwind v4 `@theme` block (`frontend/src/index.css:43-118`); all classes used in this phase resolve here                                                     | Phase 33-06 (D-16 token engine)                                                                          |
| Dependency removed            | `tunnel-rat` (was a kibo-ui transitive — replaced by native `<DragOverlay>` child)                                                                            | CONTEXT.md D-02 / D-19                                                                                   |

---

## Spacing Scale

Declared values (all multiples of 4, anchored to `colors_and_type.css:113-123`):

| Token      | Value | In standard set?    | Usage in this phase                                                                                            | Rationale (non-standard values only) |
| ---------- | ----- | ------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `space-1`  | 4px   | yes                 | Icon ↔ label gap inside the SLA chip, Badge inner                                                              | —                                    |
| `space-2`  | 8px   | yes                 | Column header inner gap, card vertical rhythm (between title / priority row / footer), card stack `gap-2`      | —                                    |
| `space-3`  | 12px  | **no — see note A** | Column body padding (`p-3`), KanbanCards `gap-3`, KanbanProvider columns `gap-3`, card inner `space-y-3`       | Note A below                         |
| `space-4`  | 16px  | yes                 | Outer board container padding (desktop), section vertical rhythm (`space-y-4`), dialog content `px-4` baseline | —                                    |
| `space-5`  | 20px  | **no — see note B** | (Bureau density) row pad token `--pad` — used by dependent components, not introduced here                     | Note B below                         |
| `space-6`  | 24px  | yes                 | Dialog content `px-6` at sm+                                                                                   | —                                    |
| `space-8`  | 32px  | yes                 | Empty-state vertical breathing (existing)                                                                      | —                                    |
| `space-12` | 48px  | yes                 | Empty-state outer padding (existing)                                                                           | —                                    |

**Standard set anchor:** {4, 8, 16, 24, 32, 48, 64} (gsd-ui-checker Dimension 5).

**Rationale footnote — non-standard values (both pass the multiple-of-4 primary rule):**

- **Note A — 12px (`space-3` / `gap-3` / `p-3`):** Established Tailwind utility used pervasively in the codebase (262+ occurrences across `frontend/src/`). It is the standard inter-card gap and column padding in both the existing kibo-ui implementation AND `WorkBoard.tsx` (`gap-3` at line 196, `p-3` at lines 219/247). Phase 52 is a behavior-parity migration (CONTEXT.md D-01 "mirror kibo-ui API exactly"); changing the inter-card gap or column padding would visually shift every existing snapshot and violate the "same external behavior" constraint. The 12px value preserves existing rhythm, not introduce new off-grid invention.
- **Note B — 20px (`space-5` / `--pad`):** Bureau density token (`--pad` from `colors_and_type.css`) consumed by dependent components (e.g. row padding in dashboard list rows, `KanbanTaskCard` inner). Not introduced by Phase 52's new primitive files — listed in the table only because dependent components rendered inside `KanbanCard` resolve to this token via inheritance. The new `frontend/src/components/kanban/*` files do NOT directly emit `space-5` / `p-5` / `gap-5` utilities; the value appears in the contract solely for completeness of inheritable token surface.

Both values are multiples of 4 and are established design-token utilities — neither is arbitrary off-grid invention. All other declared spacing values fall within the standard set {4, 8, 16, 24, 32, 48, 64}.

Touch-target minimum: **44px** (`min-h-11`) for stage-select dropdown + Create-task button + accordion toggle on mobile only. CLAUDE.md §"Responsive Design" anchor — `<768px` is the only breakpoint where touch targets are forced; desktop honors `--row-h`.

Column geometry (locked):

| Property                     | Desktop                                                                 | Mobile (<md)                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Column min-width             | `280px` (TasksTab), `240px` natural fill (Dialog)                       | n/a (stacked)                                                                                  |
| Board min-width              | `1000px` (TasksTab horizontal scroll), `1200px` (Dialog)                | n/a                                                                                            |
| Card min-height              | content-driven (~88-112px)                                              | content-driven                                                                                 |
| Column body min-height       | `200px` (TasksTab), `400px` (Dialog) — preserves drop target when empty | n/a                                                                                            |
| Mobile section corner radius | `--radius-sm` (8px)                                                     | `rounded-lg` (Tailwind v4 maps to 8px via Bureau token override; verify against `--radius-sm`) |

Exceptions: none beyond the existing geometry. The 280/1000/200 figures are carried over from the kibo-ui implementation verbatim per CONTEXT.md D-01 (mirror API, same external behavior).

---

## Typography

**Declared by Phase 52 (contract scope): 3 sizes + 2 weights.**

The contract's type scale governs **new and migrated components only** — the five new files under `frontend/src/components/kanban/*` (KanbanProvider, KanbanBoard, KanbanHeader, KanbanCards, KanbanCard) and the migrated portions of `TasksTab.tsx` + `EngagementKanbanDialog.tsx`. Inherited values that appear in unchanged dependent components (D-13 keeps `KanbanTaskCard` untouched) and verbatim-preserved existing copy (empty-state heading) are documented in the "Inherited / Out-of-phase" sub-section for completeness — they are NOT declared by this phase.

### Declared scale (Phase 52 contract)

| Role    | Size                    | Weight         | Line height            | Usage in this phase                                              |
| ------- | ----------------------- | -------------- | ---------------------- | ---------------------------------------------------------------- |
| Body    | 13px (`--t-body`)       | 400 (regular)  | 1.5 (`--line-h-body`)  | Card title surface (KanbanCard wrapper), accordion section label |
| Label   | 12px (`text-xs`)        | 400            | 1.35 (`--line-h-snug`) | Sort selector, count badges, mobile dropdown, priority text      |
| Heading | 16px (`--t-card-title`) | 600 (semibold) | 1.35                   | Dialog title (`EngagementKanbanDialog`)                          |

**Weights declared by Phase 52: 400 (regular) + 600 (semibold).** Total: 2 weights. No 500/medium and no 700/bold introduced by the new `frontend/src/components/kanban/*` files or the migrated portions of TasksTab / EngagementKanbanDialog.

### Inherited / Out-of-phase (documented for completeness, NOT declared by this contract)

Phase 52's D-13 explicitly leaves `KanbanTaskCard.tsx` untouched, and the empty-state copy is preserved verbatim per the zero-new-keys policy. The values below exist in those unchanged dependent components and surface inside the Kanban view at runtime, but they are **out of Phase 52's contract scope** — they were declared by prior phases / verbatim copy preservation, not by this migration. The checker's "3-4 size + 2 weight" bound applies to what Phase 52 declares (the table above), not to inherited-from-elsewhere values surfaced by dependent components.

| Inherited value                  | Where it appears                                              | Why it is out-of-scope here                                                                             |
| -------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `text-sm` (14px / 400)           | Column header label (`KanbanHeader`); empty-state body        | Existing kibo-ui carry-over for column header chrome — preserved verbatim by D-01 "mirror API exactly"  |
| `text-sm font-medium` (14/500)   | `KanbanTaskCard` inner card title (line ~52 in existing file) | D-13 leaves `KanbanTaskCard` untouched — the 500/medium weight is declared by the file's original phase |
| `text-lg font-semibold` (18/600) | Empty-state heading copy ("No tasks yet")                     | Existing copy preserved verbatim per zero-new-keys policy (CONTEXT.md i18n contract)                    |

**Boundary statement:** The Phase 52 contract declares 3 sizes (12 / 13 / 16) + 2 weights (400 + 600). The three values above (14px, 18px, 500/medium) exist in unchanged dependent components and verbatim-preserved copy and are documented here only so the executor and auditor know they are intentional inheritances, not new introductions. If a future phase folds `KanbanTaskCard` and the empty-state copy into a single scale, that phase will declare a unified type scale; Phase 52 does not.

### Other typography notes

- RTL: `Tajawal` substitutes via cascade. No `textAlign: right` introduced anywhere — only logical `text-start` / `text-end` per CLAUDE.md §"Arabic RTL Support Guidelines".
- Count badges: `text-xs` (12/400, secondary variant — token-mapped `bg-secondary text-secondary-foreground`) — declared scale row.
- Mono usage: `JetBrains Mono` (`--font-mono`) is reserved for SLA chip + ID labels inside `KanbanTaskCard` (out-of-phase per D-13). Phase 52 does NOT introduce new mono surfaces.

---

## Color

| Role              | Token                                                                                                                                                                                                        | Usage in this phase                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dominant (60%)    | `--bg` (Bureau `#f7f6f4`) via inherited page surface                                                                                                                                                         | Outer page surface inherited from AppShell — not painted by this phase                                                                                                   |
| Secondary (30%)   | `--surface` (`#ffffff`) for cards + `bg-muted/30` (Tailwind alpha-modifier resolves to `--surface @ 30%` via the `--color-muted: var(--surface)` remap) for column bodies + `bg-muted/50` for column headers | Column bodies, column headers, card backgrounds                                                                                                                          |
| Accent (10%)      | `--accent` (Bureau terracotta `oklch(58% 0.14 32)`)                                                                                                                                                          | Reserved-for list below                                                                                                                                                  |
| Destructive       | `--danger` (`oklch(52% 0.18 25)`) and `--danger-soft` (`oklch(95% 0.04 25)`)                                                                                                                                 | Cancelled column border-only cue; SLA "overdue" chip via existing `KanbanTaskCard` (D-13 leaves untouched, but it carries Tier-C disables — see "Out of contract" below) |
| Hover surface     | `--surface-raised` (`#ffffff`)                                                                                                                                                                               | Card hover background lift (D-10) — replaces `hover:shadow-md`                                                                                                           |
| Hover border      | `--line-soft` (`#efece3`)                                                                                                                                                                                    | Card hover border lift (D-10)                                                                                                                                            |
| Focus / drop ring | `--accent` via `ring-accent`                                                                                                                                                                                 | Drag overlay + column dragOver + focus-visible                                                                                                                           |

**Accent (`ring-accent` / `bg-accent` / `text-accent`) is reserved EXCLUSIVELY for:**

1. Drag overlay card outline — `ring-2 ring-accent` on the active dragged card (CONTEXT.md D-11)
2. Drop-target indicator — `ring-2 ring-accent` on the column whose `useDroppable.isOver === true` (CONTEXT.md D-12)
3. Focus-visible outline on the sort `<select>`, Create-task button, mobile "Move to" `<select>`, and mobile accordion toggle — via the existing `focus:ring-2 focus:ring-ring` pattern (`--color-ring: var(--accent)`)
4. Primary CTA fill — none in this phase. Create-task button stays `variant="outline"` (preserved from existing TasksTab line 141). No new bg-accent surfaces are introduced.

Accent is **NEVER** used for:

- Column header backgrounds (always `bg-muted/50`)
- Column body backgrounds (always `bg-muted/30` regardless of stage — STAGE_COLORS dropped per D-05)
- Card backgrounds (`bg-background` / `--surface`)
- Count badges (always `secondary` variant — `bg-accent-soft text-accent-ink`)
- Hover state surfaces (use `--surface-raised` + `--line-soft`, never `--accent-soft`)

**Destructive (`border-danger/30`) is reserved EXCLUSIVELY for:**

1. Cancelled column border ring when it's rendered (TasksTab only renders cancelled when non-empty) — `border-danger/30` 1px outline on `KanbanBoard`, body background unchanged at `bg-muted/30`. NO `bg-danger/10` body tint. (CONTEXT.md D-07)
2. SLA "overdue" chip inside `KanbanTaskCard` — inherited; D-13 boundary (Phase 52 does not touch unless it carries Tier-C disables, which it does — see "Out of contract" below).

Mode awareness: Bureau direction is the default and Phase 52's primary target. Dark mode tokens are written by `DesignProvider` at runtime via the same variable names — every class in this contract resolves correctly in dark mode without per-component branches. No `dark:bg-*` overrides allowed (DESIGN-02 rule).

Stage-specific colors: **none**. The CONTEXT.md D-05 / D-06 / D-08 trio mandates a flat surface across all stages. The mental model that distinguishes columns is the column header label ("To do" / "In progress" / "Review" / "Done" / "Cancelled") and, for cancelled, the `border-danger/30` ring. This aligns with CLAUDE.md §"Design rules" "No gradient backgrounds. Surfaces are flat." and resolves all 5 Tier-C `eslint-disable-next-line no-restricted-syntax` directives in `TasksTab.tsx` lines 35-44.

---

## Elevation & Borders

| Surface                                     | Border                                                                                       | Shadow                                                                                                                 | Source                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Column outer frame (`KanbanBoard`)          | `1px solid var(--line)` (default) OR `1px solid var(--danger) @ 30%` (cancelled column only) | none                                                                                                                   | CLAUDE.md §"Design rules"; CONTEXT.md D-07            |
| Column header                               | `border-b` (1px solid `--line`) at the bottom edge                                           | none                                                                                                                   | Existing TasksTab line 204 (kept)                     |
| Card (`KanbanCard` default)                 | `1px solid var(--line)` via `Card` primitive default                                         | **none** — `hover:shadow-md` STRIPPED                                                                                  | CONTEXT.md D-09; CLAUDE.md "No drop-shadows on cards" |
| Card hover                                  | `1px solid var(--line-soft)` via `hover:border-line-soft`                                    | none                                                                                                                   | CONTEXT.md D-10                                       |
| Card hover background                       | `bg-surface-raised` (token-mapped)                                                           | n/a                                                                                                                    | CONTEXT.md D-10                                       |
| Card drag overlay (active drag)             | `ring-2 ring-accent` (token-mapped)                                                          | none                                                                                                                   | CONTEXT.md D-11                                       |
| Column drop-target                          | `ring-2 ring-accent` (token-mapped) on `useDroppable.isOver`                                 | none                                                                                                                   | CONTEXT.md D-12                                       |
| Dialog container (`EngagementKanbanDialog`) | inherited from `Dialog` primitive                                                            | `var(--shadow-lg)` via existing dialog default (allowed — drawers/dialogs are the documented shadow-permitted surface) | CLAUDE.md §"Design rules"                             |
| Mobile stage section                        | `1px solid var(--line)` (default) OR `1px solid var(--danger) @ 30%` (cancelled stage only)  | none                                                                                                                   | CONTEXT.md D-08                                       |

Transition durations: Cards and column ring transitions use the existing `transition-all` shorthand at the inherited 220ms `--dur` (Bureau motion token). Drag-state opacity collapse (`opacity-30` on the originating card while dragging) is preserved verbatim from kibo-ui.

Corner radii (Bureau direction, multiples of 4 only):

| Element                        | Radius        | Token                                                               |
| ------------------------------ | ------------- | ------------------------------------------------------------------- |
| Card                           | 8px           | `--radius-sm`                                                       |
| Column frame                   | 12px          | `--radius` (via `rounded-md` → maps to 12px in Bureau token engine) |
| Count badge                    | 9999px (pill) | Tailwind `rounded-full` — semantic pill, not a token literal        |
| Mobile stage section           | 8px           | `--radius-sm`                                                       |
| SLA chip inside KanbanTaskCard | 6px           | inherited from existing rounded-md (D-13)                           |

---

## Iconography

Icons reused from `lucide-react` (existing imports — NO new icons introduced):

| Icon                        | Usage                                                     | Stroke        | Color                                                                           |
| --------------------------- | --------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `Plus`                      | Create-task CTA button                                    | 1.5 (default) | `currentColor` (inherits button text color)                                     |
| `ChevronDown` / `ChevronUp` | Mobile accordion expand/collapse                          | 1.5           | `text-muted-foreground` (`--ink-mute`)                                          |
| `ArrowDownUp`               | Sort selector affordance                                  | 1.5           | `text-muted-foreground`                                                         |
| `ClipboardList`             | Loading & empty state icon                                | 1.5           | `text-muted-foreground/40` (empty) or pulsing `text-muted-foreground` (loading) |
| `LayoutGrid`                | Dialog title icon                                         | 1.5           | `currentColor`                                                                  |
| `X`                         | Dialog close button                                       | 1.5           | `currentColor`                                                                  |
| `FileText`                  | Card title icon (inside `KanbanTaskCard`, D-13 untouched) | 1.5           | `text-muted-foreground`                                                         |
| `Clock`                     | SLA chip icon (inside `KanbanTaskCard`, D-13 untouched)   | 1.5           | inherits chip color                                                             |

RTL: lucide icons that ARE directional (none in this phase — `ArrowDownUp` is bidirectional, `ChevronUp`/`ChevronDown` are vertical, `X` and `Plus` are symmetric). No `transform: scaleX(-1)` flip needed. If `KanbanTaskCard`'s D-13 rework adds a back-arrow, the existing prototype convention is `arrow-forward` (visually back in RTL) — out of phase scope.

---

## Copywriting Contract

All copy lives in i18n bundles (`frontend/src/i18n/{en,ar}/`). Phase 52 introduces **zero new keys** — every string below is already declared. Voice anchored to `frontend/design-system/inteldossier_handoff_design/README.md` §"Content fundamentals": restrained, verb+noun, sentence case, no marketing, no emoji.

| Element                    | i18n key                                                                                     | EN copy                                                              | AR copy (verified present)                   |
| -------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| Primary CTA (top-of-board) | `workspace:actions.createTask`                                                               | "+ Create task"                                                      | (AR bundle resolves via the same key — kept) |
| Empty state heading        | `workspace:empty.tasks.heading`                                                              | "No tasks yet"                                                       | (AR present)                                 |
| Empty state body           | `workspace:empty.tasks.body`                                                                 | "Create your first task for this engagement to start tracking work." | (AR present)                                 |
| Empty state action         | `workspace:empty.tasks.action`                                                               | "+ Create Task"                                                      | (AR present)                                 |
| Loading                    | `assignments:kanban.loading`                                                                 | "Loading Kanban board..."                                            | (AR present)                                 |
| Error                      | `assignments:kanban.error_loading`                                                           | "Failed to load Kanban board"                                        | (AR present)                                 |
| Stage transition failure   | `assignments:kanban.stage_transition_error`                                                  | "Failed to move assignment"                                          | (AR present)                                 |
| Empty column (mobile)      | `assignments:kanban.no_assignments`                                                          | "No assignments in this stage"                                       | (AR present)                                 |
| Column labels              | `assignments:kanban.columns.{todo,in_progress,review,done}` + `assignments:kanban.cancelled` | "To do" / "In progress" / "Review" / "Done" / "Cancelled"            | (AR present)                                 |
| Column count               | `assignments:kanban.column_count`                                                            | "{{count}} tasks"                                                    | (AR present)                                 |
| Sort label                 | `assignments:kanban.sort_by`                                                                 | "Sort by"                                                            | (AR present)                                 |
| Sort options               | `assignments:kanban.{sort_created,sort_sla,sort_priority}`                                   | "Created Date" / "SLA Deadline" / "Priority"                         | (AR present)                                 |
| Move-to (mobile)           | `assignments:kanban.drag_to_move`                                                            | "Drag to change stage"                                               | (AR present)                                 |
| Keyboard hint (dialog)     | `assignments:kanban.keyboardHint`                                                            | "Drag tasks between columns to update their status"                  | (AR present)                                 |
| Dialog title               | dynamic + `assignments:kanban.title`                                                         | "Kanban Board - {{engagement}}"                                      | (AR present)                                 |
| Dialog progress label      | `assignments:kanban.overallProgress`                                                         | "Overall Progress"                                                   | (AR present)                                 |
| Dialog completed counter   | `assignments:kanban.completed`                                                               | "completed"                                                          | (AR present)                                 |
| Dialog dismiss             | `assignments:kanban.close`                                                                   | "Close"                                                              | (AR present)                                 |
| Dialog ARIA description    | `assignments:kanban.description`                                                             | "Drag and drop tasks between columns to update their workflow stage" | (AR present)                                 |

**Sentence-case audit**: The existing EN bundle's `kanban.title` reads "Kanban Board - {{engagement}}" (B and B capitalized). Phase 52 does **not** rewrite copy — KANBAN-01..04 are pure behavior parity. If a copy audit is wanted, it belongs in a separate "kanban copy normalize" quick-task — flagged here as **DEFERRED**, not blocking.

**Verb-noun audit**: All actionable copy passes — "Create task", "Open dossier" style. No banned tokens ("Discover", "Easily", exclamation marks, "you're in!"). One emoji-adjacent surface: column labels are bare nouns ("To do", "In progress") — compliant.

**Destructive actions in this phase**: **none**. Moving a card into the "Cancelled" stage is the only state change with destructive flavor, and it does NOT trigger a confirmation step in either the kibo-ui implementation or the migrated version — the action is reversible (drag back). No `AlertDialog` introduced.

---

## Accessibility Contract

| Surface                               | Requirement                                                                                                | Implementation                                                                                                                                                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyboard DnD                          | Full mouse + touch + keyboard parity (KANBAN-01)                                                           | `useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })` per CONTEXT.md D-04 (WorkBoard-proven sensor stack)                                                                                           |
| Screen-reader announcements           | Drag start / over / end / cancel announced bilingually                                                     | `Announcements` API on `<DndContext>` — kibo-ui's pattern preserved (`Picked up the card "{name}" from the "{column}" column`, etc.). i18n strings TBD if not already in `assignments.json`; planner verifies in plan-phase. |
| Focus indicators                      | 2px ring on accent, visible in both modes                                                                  | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` — existing pattern in `index.css:552`; ring color resolves to `--accent`                                                                          |
| Touch targets (<768px)                | 44×44 minimum                                                                                              | `min-h-11` on mobile accordion toggle, "Move to" select, Create-task button                                                                                                                                                  |
| Drop-target signal for keyboard users | Visible without pointer                                                                                    | `ring-2 ring-accent` on column `isOver` — works for keyboard-driven drag since the sortable announcements are paired with the ring (CONTEXT.md D-12)                                                                         |
| Color-blind safety                    | Cancelled-column cue is NOT color-only                                                                     | Cancelled column reads as muted-but-flagged via border treatment; the column label "Cancelled" carries the semantic, not the color                                                                                           |
| Reduced motion                        | Respect `prefers-reduced-motion`                                                                           | DnD-kit native respects it; Playwright visual spec already pins via `addStyleTag`                                                                                                                                            |
| RTL                                   | All flexbox flows reverse via `dir="rtl"`; logical properties only                                         | `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end` only — no physical `ml-*`/`pl-*`/`text-left`/`text-right` (CLAUDE.md §"Arabic RTL Support Guidelines")                                                              |
| Axe gate                              | Zero serious/critical violations on `tasks-tab-visual.spec.ts` + `engagement-kanban-dialog-visual.spec.ts` | Inherited from existing `kanban-a11y.spec.ts` posture                                                                                                                                                                        |

---

## Visual Baseline Matrix

Per CONTEXT.md D-14 / D-15 — 2 new specs × 4 baselines each = **8 new Playwright screenshots**, NOT counting the existing `kanban-visual.spec.ts` matrix which stays as a regression anchor.

| Spec file (new)                                              | Viewport (LTR + RTL) | Surface                                                                                                                  |
| ------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `frontend/tests/e2e/tasks-tab-visual.spec.ts`                | 1280×800 + 768×1024  | TasksTab on a seeded engagement                                                                                          |
| `frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts` | 1280×800 + 768×1024  | EngagementKanbanDialog opened from its production trigger (planner to confirm trigger via `rg "EngagementKanbanDialog"`) |

Fixture engagement composition (CONTEXT.md D-16): `todo: 2`, `in_progress: 2`, `review: 1`, `done: 2`, `cancelled: 1` — so the cancelled column renders, exercising D-07's border-only treatment.

Determinism layers (mirror `kanban-visual.spec.ts` shape):

- `localStorage.setItem('i18nextLng', dir)` via `addInitScript`
- `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }` via `addStyleTag`
- `await page.evaluate(() => document.fonts.ready)` before screenshot
- `toHaveScreenshot({ maxDiffPixelRatio: 0.01, fullPage: true })`

Existing specs that **must stay green** (CONTEXT.md D-17): `kanban-a11y`, `kanban-dnd`, `kanban-filters`, `kanban-render`, `kanban-responsive`, `kanban-rtl`, `kanban-search`, `kanban-visual`, `keyboard-navigation-kanban`, `drag-task-between-kanban-columns`, `open-kanban-board`, `realtime-kanban-updates-two-windows`, `performance/kanban-drag-drop-latency`. They target `/kanban` (WorkBoard, unmigrated) — green is the regression signal that the shared `@dnd-kit/core` dependency wasn't accidentally bumped or broken by the migration.

---

## Registry Safety

| Registry                                                     | Blocks Used                                                                                                                                                                                                                                                                               | Safety Gate                                                                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| shadcn official                                              | `Card`, `Dialog`, `Progress`, `Badge`, `Button`, `Avatar`, `ScrollArea` (token-mapped per Phase 33-06 `@theme` block — re-skinned, not default chrome)                                                                                                                                    | not required (project's own tokenized layer)                                                                     |
| HeroUI v3 (`@heroui/react@3.0.3`)                            | none introduced in this phase. HeroUI primitives in repo (Modal, Drawer, Card wrapper, Button, Skeleton, Chip, Switch, Tabs) are NOT consumed by the new `frontend/src/components/kanban/` primitive — D-09 explicitly keeps shadcn-style `@/components/ui/card` for narrow-blast-radius. | not required (no new HeroUI consumers added)                                                                     |
| `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | `DndContext`, `DragOverlay`, `MouseSensor`, `TouchSensor`, `KeyboardSensor`, `useDroppable`, `useSensor`, `useSensors`, `closestCenter`, `arrayMove`, `SortableContext`, `useSortable`, `sortableKeyboardCoordinates`, `CSS` (from utilities) — already in deps; no new packages          | not required (already-vetted deps; identical version, no bump)                                                   |
| `@aceternity-pro` (declared in `components.json` line 21)    | **NOT consumed in this phase.** No blocks installed from this registry. Aceternity remains BANNED by CLAUDE.md §"Component Library Strategy" + ESLint `no-restricted-imports` (Phase 48).                                                                                                 | not applicable — zero invocations                                                                                |
| `tunnel-rat`                                                 | **REMOVED** in this phase (D-19) — was a kibo-ui transitive; replaced by native `<DragOverlay>` child per D-02                                                                                                                                                                            | dependency strip via `pnpm remove tunnel-rat --filter frontend`; lockfile regenerated                            |
| kibo-ui (local at `@/components/kibo-ui/kanban`)             | **REMOVED + BANNED** in this phase (D-18). Directory deleted; `eslint.config.mjs` `no-restricted-imports.patterns` widened to include `'@/components/kibo-ui/*'`; Phase 48 D-02 carve-out comment block + `index.tsx` files-rule carve-out also dropped.                                  | enforcement-by-deletion + ESLint ban — verified by smoke build + lint + type-check before deletion (D-18 step 3) |

No third-party shadcn registries are pulled in this phase. The vetting gate is **not required**.

---

## Out of contract (acknowledged, explicitly deferred)

These items touch nearby surfaces but are outside KANBAN-01..04 and outside the migrated files' boundary. Phase 52 must NOT regress them; future phases own them.

| Item                                                                                                                                                                                                                | Why deferred                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Owner                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `KanbanTaskCard.tsx` 4 Tier-C disables (lines 25-32: `text-red-600 / bg-red-50 / text-orange-600 / bg-orange-50 / text-yellow-600 / bg-yellow-50 / text-emerald-600 / bg-emerald-50` color literals for SLA states) | D-13 narrow-blast-radius — KanbanTaskCard is shared with WorkBoard (`KCard`) and absorbing it into Phase 52 would expand scope. The disables are audit-traced. **However**: if planner confirms these Tier-C entries belong to KanbanTaskCard and not TasksTab (likely — see `frontend/src/components/assignments/KanbanTaskCard.tsx:25-32`), executor SHOULD migrate them to `text-danger`, `text-warn`, `text-warning`, `text-ok` tokens in-phase to honor the "born compliant" inheritance — but ONLY if the change is contained in `KanbanTaskCard.tsx` and doesn't ripple into other consumers. Otherwise: defer to a "kanban polish" phase. | Phase 52 if cleanly containable; otherwise a future "kanban polish" phase |
| Kanban copy normalization ("Kanban Board - ..." → "Kanban board — ...")                                                                                                                                             | KANBAN-01..04 are behavior-parity only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Future copy-normalize quick-task                                          |
| HeroUI v3 Card migration across all surfaces (KCard, KanbanCard, dashboard cards)                                                                                                                                   | Out of phase per CONTEXT.md "Deferred Ideas"; primitive cascade alignment is a separate phase                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Future "primitive cascade alignment" phase                                |
| `KanbanTaskCard` prototype-alignment refactor (priority chip + SLA chip + 2-line title layout per `dashboard.jsx`)                                                                                                  | Deferred per CONTEXT.md "Deferred Ideas"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Future "kanban polish" phase                                              |
| Bundle ceiling recalibration after tunnel-rat removal                                                                                                                                                               | Phase 53 BUNDLE-05 owns it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Phase 53                                                                  |
| Chart palette tokens                                                                                                                                                                                                | Phase 51 Tier-B deferred                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Future "chart palette tokens" phase                                       |
| WorkBoard migration to consume the new shared `@/components/kanban` primitive                                                                                                                                       | Out of KANBAN-01..04 named scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Future polish phase                                                       |
| Unified type-scale fold (collapse `KanbanTaskCard` 14/500 + empty-state 18/600 into the declared Phase 52 scale)                                                                                                    | Phase 52 declares 3 sizes + 2 weights for new/migrated components only; folding inherited values requires touching `KanbanTaskCard` (D-13 forbids) and rewriting verbatim-preserved copy (zero-new-keys forbids)                                                                                                                                                                                                                                                                                                                                                                                                                                  | Future "kanban polish" phase                                              |

---

## Born-compliant inheritance (Phase 51 contract)

Phase 52 inherits Phase 51's "born-compliant" posture per CONTEXT.md D-12 / D-20:

- **Zero net-new `eslint-disable-next-line no-restricted-syntax` directives** in any file touched by this phase. The new `frontend/src/components/kanban/*` files ship clean.
- **5 existing Tier-C disables in `TasksTab.tsx` lines 35-44 (STAGE_COLORS)** resolved by DELETION of need (D-05 drops `STAGE_COLORS` entirely) — not by suppression and not by token-mapping the bespoke per-stage palette.
- **`51-DESIGN-AUDIT.md` TasksTab row** updated by the planner/executor: strike-through or move to a "Resolved during Phase 52 migration" subsection. Documented in `52-SUMMARY.md`.
- **All classes in this contract** resolve to tokens in `frontend/src/index.css:43-118` `@theme` — no raw hex, no Tailwind palette literal (`text-blue-*`, `bg-red-*`, etc.). Verified by `pnpm lint` exit 0 after the migration lands.

---

## Implementation Checklist (for executor — token compliance)

Before any PR opens, the executor confirms each row:

- [ ] All colors resolve to tokens listed in `index.css:43-118` `@theme` block; no raw hex anywhere in `frontend/src/components/kanban/*` or in the modified TasksTab / EngagementKanbanDialog
- [ ] No Tailwind palette literal (`text-blue-*`, `bg-red-*`, `border-green-*`, `text-{slate,zinc,gray,stone}-*`, etc.) — only `text-bg`, `text-ink`, `text-accent`, `bg-muted`, `bg-background`, `bg-surface-raised`, `border-line`, `border-line-soft`, `border-danger`, `ring-accent`, `ring-ring`, `text-muted-foreground`, `text-foreground`
- [ ] No `hover:shadow-*` on any KanbanCard (replaced with `hover:bg-surface-raised hover:border-line-soft`)
- [ ] No drop-shadows on column frames (border-only)
- [ ] No gradient backgrounds anywhere — flat surfaces only
- [ ] No `STAGE_COLORS` map, no per-stage background literals — column bodies are uniformly `bg-muted/30`
- [ ] Cancelled column adds `border-danger/30` ring; body stays `bg-muted/30` — no `bg-danger/10` tint
- [ ] All spacing values resolve to multiples of 4 (gap-2/3/4, p-3/4/6, space-y-2/3/4 — no `gap-1.5`/`p-1.5`/`space-y-1.5` introduced)
- [ ] Row heights / card heights are content-driven; no hard-coded height literals
- [ ] Logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`) — `grep -E "\bm[lr]-|\bp[lr]-|text-(left|right)\b"` returns zero hits in the two modified files + 5 new primitive files
- [ ] No emoji in any new copy (none introduced — only existing keys reused)
- [ ] No banned voice tokens introduced (none — copy unchanged)
- [ ] DnD sensors match CONTEXT.md D-04 spec: Mouse(distance:8) + Touch(delay:200, tolerance:5) + Keyboard(sortableKeyboardCoordinates)
- [ ] `tunnel-rat` removed from `frontend/package.json` and `pnpm-lock.yaml`
- [ ] `eslint.config.mjs` widened: `no-restricted-imports.patterns` includes `'@/components/kibo-ui/*'`; Phase 48 narrowing comment block + `index.tsx` carve-out for that path removed
- [ ] 8 new Playwright baselines (4 per spec × 2 specs) generated under `frontend/tests/e2e/{tasks-tab-visual,engagement-kanban-dialog-visual}.spec.ts-snapshots/`, human-reviewed, committed
- [ ] All 12 existing `kanban-*.spec.ts` specs stay green (regression anchor)
- [ ] `pnpm --filter frontend lint`, `pnpm --filter frontend type-check`, `pnpm --filter frontend build` exit 0
- [ ] Tested at 1280×800 + 1024×~ and 768×1024 in both LTR and RTL (CLAUDE.md §"Responsive Design")
- [ ] Typography contract honored: new files emit only declared scale (12 / 13 / 16 at 400 + 600); 14/500 (KanbanTaskCard) and 18/600 (empty-state heading) appear ONLY in their inherited locations, NOT in new `frontend/src/components/kanban/*` files
- [ ] Spacing contract honored: new files emit only multiples of 4; 12px (gap-3/p-3) usage limited to inter-card gap + column padding (preserving kibo-ui rhythm per Note A); 20px not directly introduced by new files
- [ ] If `KanbanTaskCard.tsx` Tier-C disables are addressable in-phase without rippling beyond it, they are migrated to `text-danger / bg-danger-soft / text-warn / bg-warn-soft / text-ok / bg-ok-soft` tokens; otherwise deferred and recorded in `52-SUMMARY.md`

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (no new strings; reused keys conform to IntelDossier voice; deferred items disclosed)
- [ ] Dimension 2 Visuals: PASS (flat surfaces, border-only, drop-shadow ban honored, prototype-aligned card hover via surface-raised)
- [ ] Dimension 3 Color: PASS (60% bg, 30% surface/muted, 10% accent with explicit reserved-for list; destructive scoped to cancelled-column border + inherited SLA chip)
- [ ] Dimension 4 Typography: PASS (Phase 52 declares 3 sizes [12 / 13 / 16] + 2 weights [400 + 600] for new/migrated components; 14/500 and 18/600 explicitly scoped out as inherited-from-D-13-and-verbatim-copy, NOT counted toward the contract bound; RTL Tajawal cascade verified)
- [ ] Dimension 5 Spacing: PASS (all values multiples of 4; 12px and 20px non-standard-set values justified by Notes A + B as established codebase utilities / Bureau density tokens, not arbitrary off-grid invention; touch targets 44px only at <768px)
- [ ] Dimension 6 Registry Safety: PASS (no new third-party blocks; kibo-ui + tunnel-rat removed and banned; Aceternity registry not consumed)

**Approval:** pending
