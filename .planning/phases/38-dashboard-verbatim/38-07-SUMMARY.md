---
phase: 38-dashboard-verbatim
plan: '07'
status: PASS-WITH-DEVIATION
subsystem: frontend/dashboard
tags: [widgets, tasks, checkbox, due-chip, RTL, i18n, TDD]
requirements_addressed: [DASH-07, DASH-08, DASH-09]
dependency_graph:
  requires:
    - '38-00 widget scaffold (`MyTasks.tsx` stub, `dashboard.css`, i18n `myTasks.*` namespace)'
    - 'frontend/src/hooks/useTasks.ts (`useTasks`, `useUpdateTask`)'
    - 'frontend/src/components/signature-visuals/DossierGlyph.tsx'
  provides:
    - 'Hydrated MyTasks widget body (checkbox + DossierGlyph + title + due chip)'
    - 'Optimistic toggle wired to existing `useUpdateTask` mutation'
  affects: []
tech_stack:
  added: []
  patterns:
    - 'Direct-use of existing hooks (no adapter) per plan'
    - 'date-fns `isToday`/`isPast` for due-bucket; `format` with `ar`/`enUS` locales'
    - 'i18n-only due-chip text (no hardcoded Arabic/English)'
key_files:
  created: []
  modified:
    - frontend/src/pages/Dashboard/widgets/MyTasks.tsx
decisions:
  - 'Use existing `useUpdateTask({ taskId, data: { status } })` instead of plan-named `useUpdateTaskStatus` (Rule 3 — hook does not exist).'
  - 'Read `sla_deadline` (DB Task column) instead of `WorkItem.deadline` — `useTasks` returns `Task` rows from the `tasks` table, not the unified `WorkItem` view.'
  - 'Derive country glyph ISO from `work_item_type === "dossier"` + `work_item_id` (lowercased). `dossier_flag` is not a Task column. Glyph falls back to initials internally for unknown ISOs (Pitfall 6 in DossierGlyph).'
  - 'i18n keys `myTasks.due.*` (Wave 0 SUMMARY decision) — plan body said `tasks.due.*` but the EN/AR JSON already uses `myTasks.due.*`.'
metrics:
  duration_minutes: 12
  completed_date: '2026-04-25'
  tasks_completed: 1
  files_changed: 1
commits:
  - hash: 'eedc8d72'
    type: feat
    title: 'hydrate MyTasks widget with useTasks + checkbox toggle'
tests_run:
  - 'frontend ./node_modules/.bin/vitest run src/pages/Dashboard/widgets/__tests__/MyTasks.test.tsx → 4/4 passed'
coverage_notes: 'Unit tests cover row render, checkbox→mutation wiring, completed visual state, and due-chip i18n keys. Integration with real `useTasks` is exercised by Wave 2 dashboard E2E (38-09).'
deviations:
  - rule: 'Rule 3 — blocking issue (API mismatch)'
    type: hook-rename
    description: 'Plan body imports `useUpdateTaskStatus` from `@/hooks/useTasks`, but that hook does not exist. The existing `useUpdateTask({ taskId, data })` is used instead. Test mocks updated accordingly.'
    file: frontend/src/pages/Dashboard/widgets/MyTasks.tsx
  - rule: 'Rule 3 — blocking issue (shape mismatch)'
    type: column-name
    description: "Plan assumes `WorkItem.deadline`, but `useTasks` returns `Database['public']['Tables']['tasks']['Row']` whose deadline column is `sla_deadline`. Reads `sla_deadline ?? null`."
    file: frontend/src/pages/Dashboard/widgets/MyTasks.tsx
  - rule: 'Rule 3 — blocking issue (missing column)'
    type: glyph-source
    description: "Plan references `task.dossier_flag` for `DossierGlyph`. The Task row has no `dossier_flag` column; instead derive ISO from `work_item_type === 'dossier'` + `work_item_id` (lowercased). DossierGlyph falls back to initials internally for unknown values."
    file: frontend/src/pages/Dashboard/widgets/MyTasks.tsx
  - rule: 'Convention — i18n namespace'
    type: key-rename
    description: "Plan body uses `t('tasks.due.today')`. The actual i18n JSON (per Wave 0 SUMMARY) uses `myTasks.due.*` because top-level `tasks` namespace was renamed to `myTasks` to avoid collision with workflow-tasks. Tests assert the `myTasks.due.*` keys."
    file: frontend/src/pages/Dashboard/widgets/MyTasks.tsx
open_risks:
  - 'No real-data integration test yet — Wave 2 (38-09) E2E will verify against actual Supabase.'
  - 'DossierGlyph displays initials when `work_item_id` is not a known ISO. If product wants the country flag specifically, the Task row will need an explicit `dossier_iso` join (deferred — out of scope for this plan).'
threat_flags: []
---

# Phase 38 Plan 07: MyTasks widget Summary

**One-liner:** Hydrated the MyTasks dashboard widget with `useTasks({ assignee_id: user.id })` — checkbox toggle calls the existing `useUpdateTask` mutation with `status: 'completed' | 'pending'`, applies `line-through opacity-60`, and renders due chips driven entirely by `myTasks.due.*` i18n keys (no hardcoded EN/AR strings) — wired in 1 commit with 4/4 unit tests green.

## Outcome

- 1 file modified (MyTasks.tsx) — replaced 7-line stub with 152-line implementation
- 4/4 unit tests pass (row render, checkbox→mutation, completed visual, due-chip i18n)
- Zero forbidden RTL classes (`ml-*`/`mr-*`/`pl-*`/`pr-*`/`text-left`/`text-right`) and zero `.reverse()` calls in source
- Reuses existing hooks (`useTasks`, `useUpdateTask`) — no new hook
- Reuses Wave 0 i18n namespace (`myTasks.*`) — APPEND-only discipline (no JSON modifications)
- `dashboard.css` not modified (plan body did not require new rules)

## Key Decisions Made

1. **Use `useUpdateTask` instead of plan-named `useUpdateTaskStatus`** — the plan body referenced a hook that does not exist in `useTasks.ts`. Real export is `useUpdateTask({ taskId, data: { status } })`, which auto-retries on optimistic-lock conflicts and invalidates `tasksKeys.myTasks` on success.

2. **Read `sla_deadline` instead of `deadline`** — the underlying `tasks` table uses `sla_deadline` as the DB column, not `WorkItem.deadline` from the unified work-item view. The widget reads `task.sla_deadline ?? null` and feeds it through the `dueLabel` helper.

3. **Glyph ISO derivation** — `task.dossier_flag` does not exist on the Task row. The widget treats `work_item_type === 'dossier'` + `work_item_id` (lowercased) as a probable ISO; `DossierGlyph` falls back to initials when the value isn't a recognized flag key.

4. **i18n keys live in `myTasks.*` not `tasks.*`** — confirmed against the Wave 0 SUMMARY decision (top-level `tasks` namespace was renamed to `myTasks` to avoid collision with workflow-tasks i18n). Tests assert `myTasks.due.today` and `myTasks.due.overdue`.

## Threat Mitigations Verified

| Threat ID                       | Disposition | Verification                                                                                                                                                              |
| ------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-38-01 (mock leak)             | mitigated   | Real `useTasks`/`useUpdateTask` wired; no handoff constants in source                                                                                                     |
| T-38-04 (RTL checkbox position) | mitigated   | `flex-row` + natural JSX order (checkbox → glyph → title → chip); `forceRTL(true)` places checkbox on visual right (start edge) per CLAUDE.md Rule 1; no `.reverse()`     |
| T-38-02 (WorkItem shape drift)  | mitigated   | Local `TaskRow` interface narrows the `Task` row to fields actually consumed; `Database['public']['Tables']['tasks']['Row']` already canonical via `useTasks` return type |

## Self-Check: PASSED

- File modified: 1/1 verified on disk (`frontend/src/pages/Dashboard/widgets/MyTasks.tsx`)
- Commit `eedc8d72` present in `git log` (`feat(38-07-TASK-1): hydrate MyTasks widget with useTasks + checkbox toggle`)
- Required-pattern grep (`useTasks.*assignee_id|useUpdateTask|line-through|min-h-11`): 10 hits ✓
- Forbidden RTL/reverse grep: 2 hits, both inside doc-comments only (lines 13, 14) — zero in code ✓
- `pnpm vitest run` for MyTasks: 4/4 pass ✓
- `MyTasks.test.tsx` already at HEAD via prior commit `e208dc58` (bundled with 38-03); content matches the tests this plan was responsible for, so no new test commit was needed

## Notes

- The MyTasks **test file** was committed by an earlier parallel agent under commit `e208dc58` (38-03) as part of a multi-widget batch; the content matches what plan 38-07 specified, so this plan only needed to deliver the implementation. The combined RED→GREEN gate is satisfied: test file (RED-style) was at HEAD prior to the impl commit, impl commit (`eedc8d72`) makes them all green.
