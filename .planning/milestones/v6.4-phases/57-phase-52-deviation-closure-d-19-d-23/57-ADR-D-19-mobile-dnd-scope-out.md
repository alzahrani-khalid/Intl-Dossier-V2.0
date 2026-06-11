---
phase: 57-phase-52-deviation-closure-d-19-d-23
plan: 01
artifact: phase-adr
closes_deviation: D-19-MOBILE-TOUCH-DND-SCOPE-OUT
top_level_adr: docs/adr/0001-mobile-dnd-scope-out.md
references_decisions: [D-57-01, D-57-02, D-57-05]
status: accepted
date: 2026-05-18
---

# 0001 (phase 57) — Mobile DnD scope-out for TasksTab (D-19 closure trail)

## Status

Accepted (2026-05-18)

This phase-scoped ADR records the deviation-closure trail for
D-19-MOBILE-TOUCH-DND-SCOPE-OUT. The architectural rule itself lives in
the top-level ADR at
[`docs/adr/0001-mobile-dnd-scope-out.md`](../../../docs/adr/0001-mobile-dnd-scope-out.md);
this artifact captures the Phase 57 plan 01 closure evidence and links
the deviation row in Phase 52 to its closing commit.

## Context

Intl-Dossier is a desktop-primary analyst workstation. The CLAUDE.md
"Responsive Design" section codifies the target as follows:

> IntelDossier is a **desktop-primary analyst workstation**. The default
> target is 1280–1400px. Mobile is a secondary surface for read-only
> review.

Phase 52 migrated the engagement-workspace TasksTab Kanban surface to a
shared `@dnd-kit/core` primitive at `frontend/src/components/kanban/*`.
The 768×1024 viewport cells of `frontend/tests/e2e/tasks-tab-dnd.spec.ts`
and `frontend/tests/e2e/tasks-tab-keyboard.spec.ts` were left as
`test.skip()` because TasksTab's mobile branch renders a `<select>`
"Move to" picker rather than a DnD surface. The skip rationales noted
this, but Phase 52 had no positive assertion that the mobile branch
worked — it carried PASS-WITH-DEVIATION as D-19.

Phase 57 closes D-19 via documentation plus a single new e2e assertion
that drives the mobile `<select>` picker programmatically. No
production code change. The 768×1024 skips remain skips, with sharper
rationale strings pointing to the top-level ADR.

## Decision

TasksTab keeps the existing `<select>` "Move to" picker as the canonical
mobile workflow-stage interaction on the `<lg` breakpoint. The shared
`KanbanProvider`'s `TouchSensor` remains wired
(`frontend/src/components/kanban/KanbanProvider.tsx:99-101`,
`{ delay: 200, tolerance: 5 }`) for future consumers but is not
exercised by TasksTab on mobile.

The phase 57 plan 01 closure adds one new Playwright test under
`frontend/tests/e2e/tasks-tab-dnd.spec.ts` that:

1. Sets viewport to 768×1024.
2. Navigates to the seeded fixture engagement.
3. Locates the mobile `<select>` whose `aria-label` matches the
   "Move to" picker.
4. Calls `selectOption('in_progress')` on a row whose current stage is
   `todo`.
5. Reloads and asserts the same row's selected value is now
   `in_progress`.

The 768×1024 cells in `tasks-tab-dnd.spec.ts` and
`tasks-tab-keyboard.spec.ts` keep their `test.skip()` posture. Their
rationale strings cite
[`docs/adr/0001-mobile-dnd-scope-out.md`](../../../docs/adr/0001-mobile-dnd-scope-out.md)
so the next reader can recover the policy from a single greppable
reference rather than re-deriving it from skip wording.

## Consequences

D-19-MOBILE-TOUCH-DND-SCOPE-OUT is closed:

- The mobile `<select>` branch has explicit Playwright coverage that
  asserts `workflow_stage` persists across reload.
- The 768×1024 skips are defensible architectural posture rather than
  unfinished work.
- The shared `@dnd-kit/core` primitive retains full sensor coverage
  (mouse, touch, keyboard) so future consumers can opt in to touch DnD
  without re-wiring sensors.

Reopen clause: revisiting requires explicit UX research surfacing
analyst demand for touch DnD on the TasksTab mobile surface. A reopen
lands as a successor ADR that supersedes the top-level
`docs/adr/0001-mobile-dnd-scope-out.md`.

## Deviation Closure Trail

The original deviation row from
`.planning/phases/52-heroui-v3-kanban-migration/52-VERIFICATION.md`
(verbatim):

> - id: D-19-MOBILE-TOUCH-DND-SCOPE-OUT
>   summary: 'TasksTab mobile branch (`<lg`) uses a `<select>`-based "Move to" picker instead of DnD. The 768×1024 cells of `tasks-tab-dnd.spec.ts` and `tasks-tab-keyboard.spec.ts` are `test.skip()`. Visual + a11y coverage still extend to mobile.'
>   impact: 'No goal regression — KANBAN-01 requires DnD on the desktop primary surface; mobile is read-mostly per CLAUDE.md responsive rules.'

Closure evidence:

- Top-level architectural rule:
  [`docs/adr/0001-mobile-dnd-scope-out.md`](../../../docs/adr/0001-mobile-dnd-scope-out.md)
  (Status: Accepted, 2026-05-18).
- Phase-scoped closure trail (this file).
- Positive mobile-branch assertion: new test in
  `frontend/tests/e2e/tasks-tab-dnd.spec.ts` under the `Phase 57: Tasks tab mobile <select> Move to picker (D-19 scope-out closure)`
  describe block.
- Skip-rationale strings in `tasks-tab-dnd.spec.ts` and
  `tasks-tab-keyboard.spec.ts` updated to cite the top-level ADR.

The Phase 52 `52-VERIFICATION.md` D-19 row flips from
`passed_with_deviation` to `passed` at Phase 57 close per
`.planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-CONTEXT.md`
decision D-57-21.

## References

- Top-level ADR: [`docs/adr/0001-mobile-dnd-scope-out.md`](../../../docs/adr/0001-mobile-dnd-scope-out.md)
- Phase 52 deviation row:
  `.planning/phases/52-heroui-v3-kanban-migration/52-VERIFICATION.md`
  (frontmatter `deviations_acknowledged` block, id
  `D-19-MOBILE-TOUCH-DND-SCOPE-OUT`)
- Phase 57 context decisions: `57-CONTEXT.md` D-57-01, D-57-02, D-57-05
- `frontend/src/components/kanban/KanbanProvider.tsx:99-101` —
  `TouchSensor` `{ delay: 200, tolerance: 5 }`
- `frontend/src/pages/engagements/workspace/TasksTab.tsx:310-329` —
  mobile `<select>` "Move to" picker
- `CLAUDE.md` §"Responsive Design"
