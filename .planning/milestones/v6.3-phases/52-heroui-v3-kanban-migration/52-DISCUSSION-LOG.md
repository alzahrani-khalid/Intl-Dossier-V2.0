# Phase 52: HeroUI v3 Kanban Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 52-heroui-v3-kanban-migration
**Areas discussed:** Migration shape, Stage backgrounds, Card primitive, Visual baseline matrix

---

## Migration shape

### Q1 — Primitive location

| Option                              | Description                                                                                                                                                              | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Shared primitive                    | Extract a single composition at `frontend/src/components/kanban/` exposing the same five-component API surface kibo-ui exposed today. Call sites change one import line. | ✓        |
| Inline per surface                  | Replace each call site with its own DndContext+SortableContext wiring (mirrors WorkBoard.tsx structure).                                                                 |          |
| Hybrid — extract only the dnd shell | Tiny KanbanShell that owns DndContext+sensors+SortableContext but no Card/Header chrome. Each surface composes its own column/card markup.                               |          |

**User's choice:** Shared primitive
**Notes:** Drives D-01.

### Q2 — API shape

| Option                   | Description                                                                                                                         | Selected              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Mirror exactly           | `frontend/src/components/kanban/{KanbanProvider,KanbanBoard,KanbanHeader,KanbanCards,KanbanCard}.tsx` — same prop shapes.           |                       |
| Mirror + drop tunnel-rat | Same API but replace tunnel-rat DragOverlay portal with a native dnd-kit DragOverlay child. Removes one npm dep.                    | ✓ (Claude discretion) |
| Align to WorkBoard shape | Drop render-prop, expose `<KanbanShell sensors onDragEnd>{children}</KanbanShell>` + `<KanbanColumn id stage>` + `<KanbanCard id>`. |                       |

**User's choice:** "you decide" → Claude picked "Mirror + drop tunnel-rat"
**Notes:** Rationale captured in D-02. Smallest call-site diff matches KANBAN-01/02 parity. tunnel-rat removal is a clean bundle win deferred-measured to Phase 53.

### Q3 — Drag model

| Option                        | Description                                                                       | Selected |
| ----------------------------- | --------------------------------------------------------------------------------- | -------- |
| Preserve live reorder         | Keep arrayMove on dragOver — card visually moves between columns while dragging.  | ✓        |
| onDragEnd only                | Card stays in source column visually until drop. Lighter render load.             |          |
| Live reorder + drop-zone snap | Live reorder PLUS a visible drop-zone indicator (ring/outline on hovered column). |          |

**User's choice:** Preserve live reorder
**Notes:** Drives D-03. WorkBoard's drop-only model is NOT adopted because KANBAN-01 says "behavior parity".

### Q4 — Sensor configuration

| Option                            | Description                                                                                                       | Selected |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| WorkBoard sensors                 | `MouseSensor(distance:8)` + `TouchSensor(delay:200,tolerance:5)` + `KeyboardSensor(sortableKeyboardCoordinates)`. | ✓        |
| kibo-ui defaults                  | Plain sensors with no activation constraints.                                                                     |          |
| WorkBoard sensors + announcements | WorkBoard sensors PLUS kibo-ui's Announcements callbacks.                                                         |          |

**User's choice:** WorkBoard sensors
**Notes:** Drives D-04. The announcements callback can still be preserved verbatim from kibo-ui because the API shape is mirrored (D-01); the question was about sensor constraints, not announcements.

---

## Stage backgrounds

### Q1 — STAGE_COLORS disposition

| Option                    | Description                                                                                                                 | Selected |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| Drop bespoke colors       | Single flat token (bg-surface or bg-muted/30) for every column — matches WorkBoard's flat .kcard posture.                   | ✓        |
| Map to semantic tokens    | Per-stage token: todo→bg-surface, in_progress→bg-info/10, review→bg-warning/10, done→bg-success/10, cancelled→bg-danger/10. |          |
| Extend semantic-colors.ts | Add statusBg map to `frontend/src/lib/semantic-colors.ts` mirroring statusColors pattern.                                   |          |

**User's choice:** Drop bespoke colors
**Notes:** Drives D-05. Eliminates all 5 Tier-C disables. Aligns with CLAUDE.md "Surfaces are flat".

### Q2 — Column/header tokens

| Option        | Description                                                                                  | Selected |
| ------------- | -------------------------------------------------------------------------------------------- | -------- |
| Match dialog  | Shared primitive defaults: column bg-muted/30 + border-muted, header bg-muted/50 + border-b. | ✓        |
| Token-cleaner | bg-surface for column + bg-surface-raised for header.                                        |          |
| Bare column   | No column background; only header carries a divider line.                                    |          |

**User's choice:** Match dialog
**Notes:** Drives D-06. EngagementKanbanDialog already shipped these tokens — single source of truth across both surfaces.

### Q3 — Cancelled-column cue

| Option            | Description                                                                       | Selected |
| ----------------- | --------------------------------------------------------------------------------- | -------- |
| Border-only cue   | Same bg-muted/30 column body, border-danger/30 around the column (1px).           | ✓        |
| Header badge only | Column body identical; cancelled column header shows a Badge variant=destructive. |          |
| Header text color | Column header text uses text-danger; body stays bg-muted/30.                      |          |

**User's choice:** Border-only cue
**Notes:** Drives D-07. Reads as muted-but-flagged while preserving flat-surface rule.

### Q4 — Mobile-stacked branch backgrounds

| Option                    | Description                                                                           | Selected |
| ------------------------- | ------------------------------------------------------------------------------------- | -------- |
| Same as desktop           | Mobile sections use bg-muted/30 + border (cancelled gets border-danger/30).           | ✓        |
| Mobile bare               | Drop the column-body background entirely (just border-line divider between sections). |          |
| Keep stage tint on mobile | Mobile keeps subtle per-stage backgrounds (mapped to /10 token utilities).            |          |

**User's choice:** Same as desktop
**Notes:** Drives D-08. Visual parity desktop→mobile; one fewer mental model.

---

## Card primitive

### Q1 — Card wrapper choice

| Option                           | Description                                                                         | Selected |
| -------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| @/components/ui/card             | Reuse existing shadcn-style Card; strip hover:shadow-md.                            | ✓        |
| HeroUI v3 Card (heroui-card.tsx) | Wrap content in HeroUI v3 Card primitive.                                           |          |
| Bare div + border-line           | No Card primitive at all; raw `<div className="rounded border border-line bg-bg">`. |          |

**User's choice:** @/components/ui/card
**Notes:** Drives D-09. Narrow blast radius; WorkBoard's KCard uses the same primitive; KanbanTaskCard already designed against it. CLAUDE.md primitive cascade preference for HeroUI v3 is explicitly overridden here with rationale.

### Q2 — Hover/drag visual state

| Option                           | Description                                                                                   | Selected |
| -------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Border + bg shift                | Hover: bg-surface-raised + border-line-soft. Drag overlay: ring-2 ring-accent. No box-shadow. | ✓        |
| Border-only hover                | Hover: border-accent (1px). Drag overlay: ring-2 ring-accent. No bg change.                   |          |
| Keep shadow on drag overlay only | Hover: bg-surface-raised. DragOverlay portal renders with shadow-lg.                          |          |

**User's choice:** Border + bg shift
**Notes:** Drives D-10/D-11. Prototype-faithful; matches "shadow reserved for drawers" rule from CLAUDE.md.

### Q3 — KanbanTaskCard treatment

| Option                 | Description                                                                    | Selected |
| ---------------------- | ------------------------------------------------------------------------------ | -------- |
| Leave untouched        | Phase 52 changes only the dnd-kit shell and column chrome.                     | ✓        |
| Audit and fix in-phase | rg KanbanTaskCard.tsx for raw hex / palette literals; fix any Tier-C disables. |          |
| Full refactor          | Rewrite KanbanTaskCard to match prototype dashboard.jsx card pattern.          |          |

**User's choice:** Leave untouched
**Notes:** Drives D-13. Conditional audit: planner runs rg first; if disables found, executor fixes them. Otherwise file is untouched.

### Q4 — Drop-target ring

| Option            | Description                                            | Selected |
| ----------------- | ------------------------------------------------------ | -------- |
| ring-accent       | ring-2 ring-accent when dragging over a column.        | ✓        |
| Keep ring-primary | ring-2 ring-primary (current kibo-ui behavior).        |          |
| Drop the ring     | No ring; only card drag overlay indicates drop intent. |          |

**User's choice:** ring-accent
**Notes:** Drives D-12. Accent is the IntelDossier interactive token used across the prototype for focus.

---

## Visual baseline matrix

### Q1 — Spec file structure

| Option               | Description                                                                                                      | Selected |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| Two new spec files   | tasks-tab-visual.spec.ts + engagement-kanban-dialog-visual.spec.ts. kanban-visual.spec.ts (WorkBoard) untouched. | ✓        |
| Extend existing spec | Add tests to kanban-visual.spec.ts so all three surfaces share one file.                                         |          |
| Single combined spec | kanban-migration-visual.spec.ts covers both new surfaces.                                                        |          |

**User's choice:** Two new spec files
**Notes:** Drives D-14. Clear ownership per surface; WorkBoard regression anchor stays unchanged.

### Q2 — Viewport matrix

| Option                    | Description                                                            | Selected |
| ------------------------- | ---------------------------------------------------------------------- | -------- |
| 1280 + 768 × EN+AR        | 4 baselines per surface. Matches existing kanban-visual.spec.ts shape. | ✓        |
| 1280 only × EN+AR         | 2 baselines per surface. Loses mobile-stacked branch coverage.         |          |
| 1280 + 1024 + 768 × EN+AR | 6 baselines per surface. Adds 1024 collapse-boundary.                  |          |
| 1400 + 1024 + 768 × EN+AR | Anchors at CLAUDE.md's actual analyst-workstation widths.              |          |

**User's choice:** 1280 + 768 × EN+AR
**Notes:** Drives D-15. 768 viewport is required to capture TasksTab's `<md` mobile-stacked branch.

### Q3 — Test data seeding

| Option               | Description                                                                                | Selected |
| -------------------- | ------------------------------------------------------------------------------------------ | -------- |
| Fixture engagement   | Known seeded engagement ID with fixed assignments per stage via supabase test fixtures.    | ✓        |
| Mock the hook layer  | Playwright intercepts useEngagementKanban responses via route fulfillment with fixed JSON. |          |
| Test-only route flag | ?fixture=kanban-baseline query param swaps the hook for fixed dataset in test mode.        |          |

**User's choice:** Fixture engagement
**Notes:** Drives D-16. Reproducible across local + CI; no production-code test branch.

### Q4 — Playwright gate scope

| Option                      | Description                                                                | Selected |
| --------------------------- | -------------------------------------------------------------------------- | -------- |
| All kanban-\*.spec.ts green | Every kanban-\*.spec.ts (12 specs) AND the two new visual specs must pass. | ✓        |
| Only new + RTL/a11y/dnd     | Narrower CI surface focused on parity-critical behavior.                   |          |
| Only new visual specs       | Phase 52 gate is JUST tasks-tab-visual + engagement-kanban-dialog-visual.  |          |

**User's choice:** All kanban-\*.spec.ts green
**Notes:** Drives D-17. Existing specs target /kanban (WorkBoard) which is not migrated in Phase 52; staying green is the regression signal that shared deps didn't break WorkBoard.

---

## Claude's Discretion

- **D-02 — API shape:** User picked "you decide" → Claude chose "Mirror kibo-ui five-component API + native dnd-kit DragOverlay (drop tunnel-rat dep)". Rationale: smallest call-site diff matches KANBAN-01/02 parity goal; tunnel-rat removal is a clean bundle win.
- **D-09 hover-row interpretation:** CLAUDE.md's "shadow reserved for hovered list rows" is interpreted as a `bg-surface-raised` token shift, not a literal box-shadow utility. Aligns with the flat-surface rule. Executor may swap to a token-mapped shadow var if `dashboard.jsx` prototype uses an explicit `var(--shadow-lg)` on hover.
- **D-14 dialog trigger discovery:** Exact entry point for `EngagementKanbanDialog` left to researcher/planner via `rg`. Test harness route may be needed if no production trigger is headlessly drivable.
- **D-15 viewport breakpoints:** 1280/768 only. Planner may add 1024 if responsive collapse boundary surfaces a regression during dry-run.
- **D-18 plan slicing:** Single plan vs multi-plan with checkpoints between migration and deletion — planner's call. Phase 48 D-01 precedent supports either.

## Deferred Ideas

- HeroUI v3 Card migration across all shadcn Card consumers — future "primitive cascade alignment" phase.
- Bundle ceiling tightening — Phase 53 BUNDLE-05 measures the post-tunnel-rat-removal vendor chunk delta.
- WorkBoard.tsx adoption of the new shared `@/components/kanban` primitive — future cross-surface consistency phase.
- KanbanTaskCard prototype-alignment refactor (priority chip + SLA chip + 2-line title) — future kanban polish phase.
- Visual baseline 1024 viewport row — added reactively only if collapse-boundary regression surfaces.
- Fixture seeding for the whole `kanban-*.spec.ts` suite — separate CI hardening effort.
- Strict-mode keyboard drag indicator (grip icon, focus-visible affordance) — future a11y polish phase.
