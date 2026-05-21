# 0001 — Mobile DnD scope-out for TasksTab

## Status

Accepted (2026-05-18)

## Context

Intl-Dossier is a desktop-primary analyst workstation. The CLAUDE.md
"Responsive Design" section codifies the target as follows:

> IntelDossier is a **desktop-primary analyst workstation**. The default
> target is 1280–1400px. Mobile is a secondary surface for read-only
> review.

The breakpoint table in the same section reinforces that the `320–767`
band is "Read-only mobile: stacked, no edit forms, no drag-and-drop".

Phase 52 migrated the engagement-workspace TasksTab Kanban surface to a
shared `@dnd-kit/core` primitive at `frontend/src/components/kanban/*`.
The 768×1024 viewport cells of `frontend/tests/e2e/tasks-tab-dnd.spec.ts`
and `frontend/tests/e2e/tasks-tab-keyboard.spec.ts` were left as
`test.skip()` with rationale strings noting that mobile uses a `<select>`
"Move to" picker instead of touch drag. Phase 52 closed with deviation
D-19-MOBILE-TOUCH-DND-SCOPE-OUT
(`.planning/phases/52-heroui-v3-kanban-migration/52-VERIFICATION.md`)
because there was no positive evidence that the mobile branch works —
only a skip rationale.

The shared `@dnd-kit/core` primitive ships with a `TouchSensor` already
wired at `frontend/src/components/kanban/KanbanProvider.tsx:99-101` with
the standard mobile tuning `{ delay: 200, tolerance: 5 }`. The TasksTab
consumer chooses not to exercise that sensor on `<lg` — it renders a
mobile-stacked accordion with a `<select>` "Move to" picker per row
instead.

## Decision

TasksTab keeps the existing `<select>` "Move to" picker as the canonical
mobile workflow-stage interaction on the `<lg` breakpoint.

The shared `KanbanProvider`'s `TouchSensor` remains wired
(`frontend/src/components/kanban/KanbanProvider.tsx:99-101`,
`{ delay: 200, tolerance: 5 }`) so future consumers of the primitive
can exercise touch DnD if they choose to. TasksTab does not.

The 768×1024 `test.skip()` cells in
`frontend/tests/e2e/tasks-tab-dnd.spec.ts` and
`frontend/tests/e2e/tasks-tab-keyboard.spec.ts` remain skips and will
not be un-skipped without UX research that surfaces analyst demand for
touch DnD on the TasksTab mobile surface.

Positive coverage of the mobile branch comes from a separate Playwright
test in `frontend/tests/e2e/tasks-tab-dnd.spec.ts` (added under Phase 57
plan 01) that drives the `<select>` "Move to" picker programmatically
and asserts that `workflow_stage` persists across a reload.

## Consequences

What becomes easier:

- The TasksTab mobile branch has explicit, documented behavior — a
  `<select>` picker — rather than an implicit "DnD is desktop-only"
  contract scattered across skip rationales.
- The 768×1024 skips are now defensible: they are not "we did not get
  to it" — they are "this surface is not in scope".
- The shared `@dnd-kit/core` primitive retains full sensor coverage,
  so future consumers (for example, a non-analyst mobile-first
  workflow) can opt in without re-wiring sensors.

What becomes harder:

- A future analyst-mobile feature that wants touch DnD on TasksTab must
  first establish UX research demand and then explicitly supersede this
  ADR. Adding a touch DnD path silently is now an ADR violation.

Reopen clause: this ADR should be revisited if UX research surfaces
explicit analyst demand for touch DnD on the TasksTab mobile surface.
A reopen lands as a successor ADR that marks this one
`Superseded by NNNN`.

## References

- `CLAUDE.md` §"Responsive Design" — desktop-primary analyst
  workstation target (1280–1400px); 320–767 band is read-only
- `.planning/phases/52-heroui-v3-kanban-migration/52-VERIFICATION.md`
  — D-19-MOBILE-TOUCH-DND-SCOPE-OUT deviation row
- `.planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-ADR-D-19-mobile-dnd-scope-out.md`
  — phase-scoped deviation-closure trail
- `frontend/src/components/kanban/KanbanProvider.tsx:99-101` —
  `TouchSensor` activation constraint `{ delay: 200, tolerance: 5 }`
- `frontend/src/pages/engagements/workspace/TasksTab.tsx:310-329` —
  mobile `<select>` "Move to" picker render path
- `frontend/tests/e2e/tasks-tab-dnd.spec.ts` — 768×1024 skip cell +
  Phase 57 mobile `<select>` assertion
- `frontend/tests/e2e/tasks-tab-keyboard.spec.ts` — 768×1024 skip cell
