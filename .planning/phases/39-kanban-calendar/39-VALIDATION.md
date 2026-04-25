---
phase: 39
slug: kanban-calendar
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-25
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `39-RESEARCH.md ## Validation Architecture` (BOARD-01/02/03 → 18 testable assertions).

---

## Test Infrastructure

| Property               | Value                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (unit/component) + Playwright (E2E + visual regression) + axe-core (a11y)                                      |
| **Config file**        | `frontend/vitest.config.ts`, `tests/playwright.config.ts`                                                             |
| **Quick run command**  | `pnpm --filter frontend test --run`                                                                                   |
| **Full suite command** | `pnpm --filter frontend test --run && pnpm --filter frontend exec playwright test tests/e2e/kanban-calendar*.spec.ts` |
| **Estimated runtime**  | ~90 seconds (vitest ~25s, playwright ~65s)                                                                            |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test --run` (vitest only)
- **After every plan wave:** Run full suite (vitest + playwright)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~25 seconds (vitest quick run)

---

## Per-Task Verification Map

> Plan-level verification mapping (each plan's `<verification>` block contains task-level commands).

| Plan  | Wave | Requirement        | Test Type                 | Quick Verify Command                                                                                                                                                    | Status     |
| ----- | ---- | ------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 39-00 | 0    | BOARD-01/02/03     | scaffold                  | `pnpm --filter frontend test --run src/lib/i18n/__tests__/toArDigits.test.ts && pnpm --filter frontend exec playwright test --list`                                     | ⬜ pending |
| 39-01 | 1    | BOARD-01, BOARD-02 | unit + E2E                | `pnpm --filter frontend test --run KCard && pnpm --filter frontend exec playwright test tests/e2e/kanban-render.spec.ts`                                                | ⬜ pending |
| 39-02 | 1    | BOARD-01           | unit + E2E                | `pnpm --filter frontend test --run BoardColumn && pnpm --filter frontend exec playwright test tests/e2e/kanban-dnd.spec.ts`                                             | ⬜ pending |
| 39-03 | 1    | BOARD-01           | unit + E2E                | `pnpm --filter frontend test --run BoardToolbar && pnpm --filter frontend exec playwright test tests/e2e/kanban-{search,filters}.spec.ts`                               | ⬜ pending |
| 39-04 | 1    | BOARD-01, BOARD-02 | E2E                       | `pnpm --filter frontend exec playwright test tests/e2e/kanban-render.spec.ts tests/e2e/kanban-rtl.spec.ts`                                                              | ⬜ pending |
| 39-05 | 1    | BOARD-03           | unit + E2E                | `pnpm --filter frontend test --run CalendarMonthGrid && pnpm --filter frontend exec playwright test tests/e2e/calendar-render.spec.ts tests/e2e/calendar-rtl.spec.ts`   | ⬜ pending |
| 39-06 | 1    | BOARD-03           | unit                      | `pnpm --filter frontend test --run CalendarEventPill`                                                                                                                   | ⬜ pending |
| 39-07 | 1    | BOARD-01, BOARD-03 | unit + E2E                | `pnpm --filter frontend test --run WeekListMobile && pnpm --filter frontend exec playwright test tests/e2e/calendar-mobile.spec.ts tests/e2e/kanban-responsive.spec.ts` | ⬜ pending |
| 39-08 | 1    | BOARD-01, BOARD-03 | unit                      | `pnpm --filter frontend test --run Skeleton && node -e 'JSON.parse(...)' on locale files`                                                                               | ⬜ pending |
| 39-09 | 2    | BOARD-01/02/03     | E2E + visual + a11y + cut | `pnpm --filter frontend exec playwright test tests/e2e/kanban-*.spec.ts tests/e2e/calendar-*.spec.ts && bash scripts/check-deleted-components.sh`                       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

> Wave 0 must land BEFORE Wave 1 widgets so widget plans can attach `<automated>` verify commands referencing live test files.

**E2E (Playwright) — 13 skipped spec stubs created in Wave 0; Wave 1/2 plans fill assertions in-place:**

- [ ] `frontend/tests/e2e/kanban-render.spec.ts` — BOARD-01 (kcard anatomy: kind chip + priority chip + title + glyph + due + owner avatar)
- [ ] `frontend/tests/e2e/kanban-rtl.spec.ts` — BOARD-01 + BOARD-02 (RTL scroll direction; `border-inline-start: 3px solid var(--danger)` flips edge correctly; AR digits)
- [ ] `frontend/tests/e2e/kanban-visual.spec.ts` — Playwright `toHaveScreenshot()` baseline for `/kanban` (LTR + RTL)
- [ ] `frontend/tests/e2e/kanban-search.spec.ts` — D-07 client-side filtering (title/title_ar/dossier/assignee)
- [ ] `frontend/tests/e2e/kanban-filters.spec.ts` — D-06 'By status' wired + 'By dossier'/'By owner' aria-disabled with "Coming soon"
- [ ] `frontend/tests/e2e/kanban-responsive.spec.ts` — 320/640/768/1024/1280 layouts; ≥44×44 touch targets
- [ ] `frontend/tests/e2e/kanban-a11y.spec.ts` — axe-core (color contrast, focus rings, semantic landmarks)
- [ ] `frontend/tests/e2e/kanban-dnd.spec.ts` — D-03 DnD enabled only when columnMode='status'
- [ ] `frontend/tests/e2e/calendar-render.spec.ts` — BOARD-03 (7×5 grid + day-of-week header + `.cal-cell.today` accent + `.cal-cell.other` opacity 0.4)
- [ ] `frontend/tests/e2e/calendar-rtl.spec.ts` — RTL day-of-week order + AR digits in day numbers
- [ ] `frontend/tests/e2e/calendar-visual.spec.ts` — `toHaveScreenshot()` baseline for `/calendar` (LTR + RTL)
- [ ] `frontend/tests/e2e/calendar-mobile.spec.ts` — D-15 pageable single-week list <640px (prev/next/Today)
- [ ] `frontend/tests/e2e/calendar-a11y.spec.ts` — axe-core for calendar grid + event pills

**Vitest unit-test stubs:**

- [ ] `frontend/src/lib/i18n/__tests__/toArDigits.test.ts` — Latin → Arabic-Indic conversion incl. mixed strings

**Other Wave 0 artifacts:**

- [ ] `frontend/src/pages/WorkBoard/index.ts` — barrel scaffold for WorkBoard, KCard, BoardColumn, BoardToolbar
- [ ] `frontend/src/lib/i18n/toArDigits.ts` — utility ported from handoff `data.jsx`
- [ ] `frontend/public/locales/{en,ar}/unified-kanban.json` — extended with filter pills, "Coming soon", overdueChip, "+ New item"
- [ ] `frontend/public/locales/{en,ar}/calendar.json` — extended with day-of-week short labels, "+ New event", week-list nav
- [ ] `scripts/check-deleted-components.sh` — Phase 39 block appended in commented form (uncommented in 39-09)

---

## Manual-Only Verifications

| Behavior                          | Requirement    | Why Manual                                                                                              | Test Instructions                                                                                                                                                                                                |
| --------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual-regression snapshot review | BOARD-01/02/03 | Baselines must be eyeballed once before being committed as the source of truth                          | After Wave 0 captures `/kanban` + `/calendar` screenshots in EN + AR, open `tests/e2e/__snapshots__/` and visually confirm against `/tmp/inteldossier-handoff/.../reference/{kanban,kanban-arabic,calendar}.png` |
| RTL kcard.overdue edge            | BOARD-02       | `border-inline-start` + flexDirection swap behavior on real Chromium needs human verification first run | In RTL mode (`?lang=ar`), confirm the 3px danger edge sits on the visual RIGHT (Arabic reading start), NOT the left                                                                                              |
| Touch-momentum horizontal scroll  | BOARD-01       | iOS Safari touch-momentum cannot be reliably automated                                                  | On a real iOS Safari (iPhone simulator OK), swipe the kanban horizontally and confirm momentum + RTL scroll direction (first column on right edge in AR)                                                         |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (13 stubs above)
- [ ] No watch-mode flags (vitest `--run`, never bare `vitest`)
- [ ] Feedback latency < 30s for vitest quick run
- [ ] `nyquist_compliant: true` set in frontmatter once planner fills the verification map

**Approval:** pending
