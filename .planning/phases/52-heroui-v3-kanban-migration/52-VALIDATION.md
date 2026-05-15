---
phase: 52
slug: heroui-v3-kanban-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 52 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | vitest 1.x (unit), @playwright/test 1.4x (E2E + visual), axe-core (a11y)                                                     |
| **Config file**        | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`                                                                 |
| **Quick run command**  | `pnpm --filter frontend test:unit -- src/components/kanban`                                                                  |
| **Full suite command** | `pnpm --filter frontend test:unit && pnpm --filter frontend test:e2e -- tests/e2e/kanban tests/e2e/engagement-kanban-dialog` |
| **Estimated runtime**  | ~180 seconds (unit ~20s + e2e+visual ~160s)                                                                                  |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test:unit -- src/components/kanban`
- **After every plan wave:** Run `pnpm --filter frontend test:unit && pnpm --filter frontend lint && pnpm --filter frontend type-check`
- **Before `/gsd:verify-work`:** Full suite must be green (unit + e2e + visual baselines committed)
- **Max feedback latency:** 30 seconds for unit; 180 seconds for full suite

---

## Per-Task Verification Map

> Plan IDs are TBD; planner fills the Task ID column. Rows below are the validation slots that every plan MUST cover by REQ-ID. Planner attaches `<automated>` blocks for each.

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior                                                  | Test Type | Automated Command                                                                                      | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | ---------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------ | ----------- | ---------- |
| 52-XX-01 | TBD  | 1    | KANBAN-01   | —          | Tasks tab board renders + drag persists                          | unit      | `pnpm --filter frontend test:unit -- src/components/kanban/__tests__/KanbanBoard.test.tsx`             | ❌ W0       | ⬜ pending |
| 52-XX-02 | TBD  | 1    | KANBAN-01   | —          | Sortable column accepts pointer/touch/keyboard sensor events     | unit      | `pnpm --filter frontend test:unit -- src/components/kanban/__tests__/KanbanProvider.test.tsx`          | ❌ W0       | ⬜ pending |
| 52-XX-03 | TBD  | 1    | KANBAN-01   | —          | KanbanCard renders Chip + Avatar + token-bound surface           | unit      | `pnpm --filter frontend test:unit -- src/components/kanban/__tests__/KanbanCard.test.tsx`              | ❌ W0       | ⬜ pending |
| 52-XX-04 | TBD  | 2    | KANBAN-01   | —          | TasksTab drag mouse → persists via mutation                      | e2e       | `pnpm --filter frontend test:e2e -- tests/e2e/kanban/tasks-tab-drag.spec.ts`                           | ❌ W0       | ⬜ pending |
| 52-XX-05 | TBD  | 2    | KANBAN-01   | —          | TasksTab drag keyboard (Space, Arrow, Space) → persists          | e2e       | `pnpm --filter frontend test:e2e -- tests/e2e/kanban/tasks-tab-keyboard.spec.ts`                       | ❌ W0       | ⬜ pending |
| 52-XX-06 | TBD  | 2    | KANBAN-01   | —          | TasksTab drag touch (mobile emulation) → persists                | e2e       | `pnpm --filter frontend test:e2e -- tests/e2e/kanban/tasks-tab-touch.spec.ts`                          | ❌ W0       | ⬜ pending |
| 52-XX-07 | TBD  | 2    | KANBAN-02   | —          | EngagementKanbanDialog open + drag mouse parity                  | e2e       | `pnpm --filter frontend test:e2e -- tests/e2e/engagement-kanban-dialog/drag.spec.ts`                   | ❌ W0       | ⬜ pending |
| 52-XX-08 | TBD  | 2    | KANBAN-02   | —          | EngagementKanbanDialog keyboard parity                           | e2e       | `pnpm --filter frontend test:e2e -- tests/e2e/engagement-kanban-dialog/keyboard.spec.ts`               | ❌ W0       | ⬜ pending |
| 52-XX-09 | TBD  | 2    | KANBAN-02   | —          | EngagementKanbanDialog touch parity                              | e2e       | `pnpm --filter frontend test:e2e -- tests/e2e/engagement-kanban-dialog/touch.spec.ts`                  | ❌ W0       | ⬜ pending |
| 52-XX-10 | TBD  | 3    | KANBAN-03   | —          | `@/components/kibo-ui/kanban` directory removed                  | cli       | `test ! -d frontend/src/components/kibo-ui/kanban`                                                     | ✅          | ⬜ pending |
| 52-XX-11 | TBD  | 3    | KANBAN-03   | —          | kibo-ui dependency removed from package.json                     | cli       | `! grep -q '\"kibo-ui\"' frontend/package.json`                                                        | ✅          | ⬜ pending |
| 52-XX-12 | TBD  | 3    | KANBAN-03   | —          | `no-restricted-imports` bans both paths                          | cli       | `pnpm --filter frontend lint -- --no-cache 2>&1 \| grep -c 'kibo-ui' \|\| true`                        | ✅          | ⬜ pending |
| 52-XX-13 | TBD  | 3    | KANBAN-03   | —          | Lint regression fixture asserts the ban fires                    | unit      | `pnpm --filter frontend test:unit -- src/components/kanban/__tests__/eslint-ban.test.ts`               | ❌ W0       | ⬜ pending |
| 52-XX-14 | TBD  | 3    | KANBAN-03   | —          | `pnpm lint` exits 0                                              | cli       | `pnpm --filter frontend lint`                                                                          | ✅          | ⬜ pending |
| 52-XX-15 | TBD  | 3    | KANBAN-03   | —          | `pnpm type-check` exits 0                                        | cli       | `pnpm --filter frontend type-check`                                                                    | ✅          | ⬜ pending |
| 52-XX-16 | TBD  | 4    | KANBAN-04   | —          | EN visual baselines for both surfaces (1280×800, 768×1024)       | visual    | `pnpm --filter frontend test:e2e -- tests/e2e/kanban/visual-en.spec.ts --update-snapshots` then commit | ❌ W0       | ⬜ pending |
| 52-XX-17 | TBD  | 4    | KANBAN-04   | —          | AR visual baselines for both surfaces (1280×800, 768×1024)       | visual    | `pnpm --filter frontend test:e2e -- tests/e2e/kanban/visual-ar.spec.ts --update-snapshots` then commit | ❌ W0       | ⬜ pending |
| 52-XX-18 | TBD  | 4    | KANBAN-04   | —          | axe-core a11y assertion on both surfaces (zero serious/critical) | e2e       | `pnpm --filter frontend test:e2e -- tests/e2e/kanban/a11y.spec.ts`                                     | ❌ W0       | ⬜ pending |
| 52-XX-19 | TBD  | 4    | KANBAN-04   | —          | 12 existing kanban-\*.spec.ts regression anchor still green      | e2e       | `pnpm --filter frontend test:e2e -- tests/e2e/kanban-*.spec.ts`                                        | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/kanban/__tests__/KanbanBoard.test.tsx` — unit stub for board composition (KANBAN-01)
- [ ] `frontend/src/components/kanban/__tests__/KanbanProvider.test.tsx` — sensor + sortable list stub (KANBAN-01)
- [ ] `frontend/src/components/kanban/__tests__/KanbanCard.test.tsx` — token-bound card stub (KANBAN-01)
- [ ] `frontend/src/components/kanban/__tests__/eslint-ban.test.ts` — assertion that `import 'kibo-ui'` and `import '@/components/kibo-ui/...'` are flagged (KANBAN-03)
- [ ] `tests/e2e/kanban/tasks-tab-drag.spec.ts`, `tasks-tab-keyboard.spec.ts`, `tasks-tab-touch.spec.ts` — Playwright skeletons for KANBAN-01
- [ ] `tests/e2e/engagement-kanban-dialog/drag.spec.ts`, `keyboard.spec.ts`, `touch.spec.ts` — Playwright skeletons for KANBAN-02
- [ ] `tests/e2e/kanban/visual-en.spec.ts`, `visual-ar.spec.ts` — baseline-generation specs covering both surfaces, both viewports (KANBAN-04)
- [ ] `tests/e2e/kanban/a11y.spec.ts` — axe-core injection across both surfaces (KANBAN-04)
- [ ] Fixture engagement seed (idempotent) confirming `todo:2 / in_progress:2 / review:1 / done:2 / cancelled:1` exists in staging via Supabase MCP — Phase 40-12 precedent

---

## Manual-Only Verifications

| Behavior                                                                                               | Requirement          | Why Manual                                                                                                | Test Instructions                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mid-drag DragOverlay render-strategy parity vs kibo-ui (`tunnel-rat` portal vs native `<DragOverlay>`) | KANBAN-01, KANBAN-02 | Mid-drag visual cannot be deterministically snapshotted in CI (timing-sensitive overlay frame)            | Reviewer captures a mid-drag screenshot on TasksTab and EngagementKanbanDialog before merge, compares against pre-migration screenshot; sign off in PR. Escape hatch (D-02): retain `tunnel-rat` if parity fails. |
| EN+AR visual baseline review                                                                           | KANBAN-04            | Pixel diffs require human-eye judgment on intentional Phase 51 token changes vs unintentional regressions | Reviewer opens each new baseline PNG in `tests/e2e/**/__screenshots__/`, confirms no unintentional drift, then approves baseline commit                                                                           |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
