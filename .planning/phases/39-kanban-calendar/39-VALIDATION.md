---
phase: 39
slug: kanban-calendar
status: draft
nyquist_compliant: false
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

> Populated by gsd-planner during Phase 39 planning. Map every task to `automated` (with command) or `Wave 0` dependency.
>
> Rows below are placeholders — planner replaces.

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ----------------- | ----------- | ---------- |
| 39-XX-XX | XX   | X    | BOARD-0X    | —          | N/A             | unit/E2E  | `{command}`       | ✅ / ❌ W0  | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

> Wave 0 must land BEFORE Wave 1 widgets so widget plans can attach `<automated>` verify commands referencing live test files.

- [ ] `tests/e2e/kanban-board.spec.ts` — stubs for BOARD-01 (kcard anatomy + horizontal scroll + RTL scroll direction)
- [ ] `tests/e2e/kanban-overdue-done.spec.ts` — stubs for BOARD-02 (`border-inline-start: 3px solid var(--danger)` overdue + `opacity: 0.55` done — both LTR & RTL)
- [ ] `tests/e2e/calendar-grid.spec.ts` — stubs for BOARD-03 (7×5 grid + day-of-week header + `.cal-ev` default + today accent + other-month opacity)
- [ ] `tests/e2e/kanban-calendar-axe.spec.ts` — axe-core a11y stubs (44×44 touch targets, color-contrast, focus rings)
- [ ] `tests/e2e/kanban-calendar-visual.spec.ts` — Playwright `toHaveScreenshot()` baselines for `/kanban` (LTR + RTL) and `/calendar` (LTR + RTL)
- [ ] `frontend/src/pages/WorkBoard/__tests__/KCard.test.tsx` — unit-test stub (renders kind chip + priority chip + glyph + due format)
- [ ] `frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx` — unit-test stub (header count = items.length, `+` button)
- [ ] `frontend/src/pages/WorkBoard/__tests__/BoardToolbar.test.tsx` — unit-test stub (filter pill aria-disabled, search filters client-side, overdue chip count)
- [ ] `frontend/src/components/calendar/__tests__/CalendarGrid.test.tsx` — unit-test stub (7×5 grid math, other-month padding count, today highlight)
- [ ] `frontend/src/components/calendar/__tests__/CalendarEventPill.test.tsx` — unit-test stub (default variant + console.warn fallback per D-13)
- [ ] `frontend/src/components/calendar/__tests__/MobileWeekList.test.tsx` — unit-test stub (one week, prev/next, "Today" jumps to active week)
- [ ] `frontend/src/lib/i18n/__tests__/toArDigits.test.ts` — unit-test stub (Latin → Arabic-Indic conversion incl. mixed)
- [ ] `scripts/check-deleted-components.sh` — CI gate extension stub for legacy file deletion enforcement

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
