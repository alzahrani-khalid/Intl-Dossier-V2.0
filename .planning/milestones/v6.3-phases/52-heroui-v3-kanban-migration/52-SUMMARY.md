---
phase: 52
slug: heroui-v3-kanban-migration
milestone: v6.3
status: shipped
verdict: PASS-WITH-DEVIATION
plans_completed: 5
plans_total: 5
requirements: [KANBAN-01, KANBAN-02, KANBAN-03, KANBAN-04]
deviations: 5
follow_ups: 3
created: 2026-05-16
completed: 2026-05-16
---

# Phase 52 — heroui-v3-kanban-migration

**Verdict: PASS-WITH-DEVIATION.** All 5 plans landed. kibo-ui Kanban deleted, `tunnel-rat` removed, shared `@dnd-kit/core` primitive in place at `frontend/src/components/kanban/`, TasksTab consumer migrated, 8 visual baselines committed, and the orphan `EngagementKanbanDialog` retired. Live Playwright execution of the four `tasks-tab-*.spec.ts` files is deferred to a host operator (D-23).

## §1 Phase verdict

| Verdict aspect              | State                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code-level invariants       | ✅ green (lint, type-check, build, CI gate `scripts/check-deleted-components.sh`, Playwright `--list` enumeration)                                |
| Unit tests                  | ✅ green (Plan 52-01..02 fixtures + KanbanBoard / KanbanCard / KanbanProvider)                                                                    |
| Live E2E execution          | ⚠️ deferred to host operator (D-23)                                                                                                               |
| Mid-drag DragOverlay parity | ✅ TasksTab captured at `frontend/tests/e2e/__phase52-mid-drag__/tasks-tab-mid-drag.png`; dialog capture not reproducible (D-20 — dialog deleted) |
| Visual baselines            | ✅ 4 PNGs committed for `tasks-tab-visual.spec.ts`; LTR/RTL pairs share bytes pending render-time language flip (D-22)                            |
| Regression anchor           | ⏭ 8 Phase 39 `kanban-*.spec.ts` files deferred to Phase 39 follow-up (D-21)                                                                      |

## §2 Requirement closures

| REQ-ID                                                            | Closure mechanism                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **KANBAN-01** — Shared `@dnd-kit/core` primitive replaces kibo-ui | Plan 52-02 (`46e16c98`) added `frontend/src/components/kanban/{KanbanBoard,KanbanCard,KanbanProvider}.tsx`. Token-bound; pointer + keyboard sensors registered. Unit suite green.                                                                                                                                                                                          |
| **KANBAN-02** — Engagement context Kanban parity                  | Satisfied by TasksTab (KANBAN-01). The originally-planned `EngagementKanbanDialog` surface was deleted as dead code in Plan 52-05 close-out (D-20). Route `/dossiers/engagements/$id` is redirect-only; `EngagementDossierPage` was orphaned. The shared primitive is consumed once by the workspace TasksTab; that path covers both "engagement-scoped Kanban" use cases. |
| **KANBAN-03** — kibo-ui deletion                                  | Plan 52-04 (`a53e4452`, `5eb3c63c`, `f0246c39`, `472dcf92`): `frontend/src/components/kibo-ui/kanban/` deleted, `tunnel-rat` removed from `frontend/package.json` + `pnpm-lock.yaml`, ESLint `no-restricted-imports` bans `@/components/kibo-ui/*`, CI gate `scripts/check-deleted-components.sh` asserts filesystem absence.                                              |
| **KANBAN-04** — Visual baselines + axe a11y                       | Plan 52-05 worktree merge (`7c52b4b9`) + responsive fix (`da89f932`). 4 tasks-tab PNGs committed; axe spec at `frontend/tests/e2e/tasks-tab-a11y.spec.ts` enumerates cleanly (live run deferred per D-23).                                                                                                                                                                 |

## §3 Plan-by-plan ledger

| Plan  | Status                 | Commit anchor                                                                                                                                                                      | Notes                                                                 |
| ----- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 52-01 | ✅ PASS                | `234ae34f` (unit seeds), `695cda70` (e2e scaffold), `0418cfed` (kibo-ui import ban fixture), `314c1910` (SUMMARY)                                                                  | Kanban test scaffold; eslint-ban fixture                              |
| 52-02 | ✅ PASS                | `46e16c98` (primitive), `8776cb39` (SUMMARY)                                                                                                                                       | Shared `@dnd-kit/core` primitive at `frontend/src/components/kanban/` |
| 52-03 | ✅ PASS                | `6f20264c` (TasksTab migration), `50662a06` (SUMMARY)                                                                                                                              | TasksTab consumer rewired to shared primitive                         |
| 52-04 | ✅ PASS                | `a53e4452` (kibo + tunnel-rat delete), `5eb3c63c` (lint ban), `f0246c39` (CI gate), `472dcf92` (SUMMARY)                                                                           | kibo-ui deletion, ESLint ban, CI gate                                 |
| 52-05 | ✅ PASS-WITH-DEVIATION | `bbd7d5e8` (fixture doc), `9daf899e` (6 fixme→real), `310b01d5` (worktree SUMMARY), `7c52b4b9` (worktree merge), `da89f932` (responsive fix), close-out commit (this commit range) | Baselines + a11y + close-out; dialog dead-code retired                |

## §4 Deviations

1. **D-19 — Mobile touch DnD scoped out.** TasksTab mobile branch (`<lg`) uses a `<select>`-based "Move to" picker, not DnD. The 768×1024 cells of `tasks-tab-dnd.spec.ts` and `tasks-tab-keyboard.spec.ts` are `test.skip()`. Visual + a11y still cover mobile.
2. **D-20 — `EngagementKanbanDialog` deleted as dead code.** Verification: `grep -rn "EngagementDossierPage" frontend/src` returned 1 self-match; the route file at `frontend/src/routes/_protected/dossiers/engagements/$id.tsx` is a pure `redirect` to `/engagements/$engagementId/overview` (workspace TasksTab). Deleted files: `frontend/src/components/assignments/EngagementKanbanDialog.tsx`, `frontend/src/pages/dossiers/EngagementDossierPage.tsx`. Deleted specs: 4 dialog files + 4 orphan modal-trigger specs. `scripts/check-deleted-components.sh` extended.
3. **D-21 — Phase 39 regression anchor deferred.** 8 of the 12 originally-listed regression specs target `/kanban` (Phase 39 WorkBoard primitive) — different fixture, different route. Their state (4 failures observed during 52-05 anchor run) belongs to a Phase 39 follow-up, not Phase 52.
4. **D-22 — LTR/RTL visual baseline byte-identity.** `addInitScript` on `localStorage.i18nextLng` does not flip language pre-render. Baselines are correct geometry but identical between LTR and RTL. Phase 53 follow-up: switch to `?lng=ar` URL param or render-after-language-load gate.
5. **D-23 — Live Playwright run deferred.** The four `tasks-tab-*.spec.ts` files enumerate cleanly (30 tests across 12 files including the 8 Phase 39 anchor specs). Live run requires dev server + Doppler-managed `.env.test` + seeded staging fixture (52-FIXTURE.md). Compile-time + type-check + enumeration all pass.

## §5 Open follow-ups (non-blocking)

1. **Phase 53 D-22 closure** — RTL render-time flip on visual specs (replace localStorage seed with URL gate).
2. **Phase 39 follow-up** — triage 8 `kanban-*.spec.ts` failures; re-baseline `kanban-visual.spec.ts` if WorkBoard primitive shifted; verify `kanban-dnd.spec.ts` + `kanban-a11y.spec.ts` against current `/kanban` route.
3. **Host operator** — execute the four `tasks-tab-*.spec.ts` specs against staging once the seeded fixture is in `.env.test` (52-FIXTURE.md). Capture mid-drag PNG for tasks-tab archived already at `frontend/tests/e2e/__phase52-mid-drag__/tasks-tab-mid-drag.png`.

## §6 Inheritance to Phase 53 (bundle-tightening-tag-provenance)

- `tunnel-rat` is gone from `pnpm-lock.yaml`; bundle ceiling re-baseline in Phase 53 can drop the vendor-chunk slot it previously occupied.
- HeroUI v3 import paths inside the shared Kanban primitive use `@heroui/react` directly; no new vendor chunks introduced (verified via `vite build` chunk inventory — `react-vendor`, `radix-vendor`, `dnd-vendor` budgets unchanged at this phase boundary).
- Visual baselines under `frontend/tests/e2e/tasks-tab-visual.spec.ts-snapshots/` are size-stable; CI gate `Bundle Size Check (size-limit)` is unaffected.

---

_Phase 52 ships PASS-WITH-DEVIATION on 2026-05-16. Phase 53 (bundle-tightening-tag-provenance) unblocked._
