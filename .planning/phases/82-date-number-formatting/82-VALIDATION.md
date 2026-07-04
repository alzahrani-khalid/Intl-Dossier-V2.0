---
phase: 82
slug: date-number-formatting
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-04
---

# Phase 82 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from
> `82-RESEARCH.md` § Validation Architecture. Task-level rows are filled once `82-*-PLAN.md` exist.

---

## Test Infrastructure

| Property               | Value                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| **Framework**          | Vitest (frontend workspace, jsdom)                                     |
| **Config file**        | `frontend/vitest.config.ts` (existing)                                 |
| **Quick run command**  | `cd frontend && pnpm vitest run src/lib/__tests__/format-date.test.ts` |
| **Full suite command** | `cd frontend && pnpm vitest run`                                       |
| **Estimated runtime**  | ~quick <5s / full ~minutes                                             |

---

## Sampling Rate

- **After every task commit:** the touched files' vitest specs (e.g. `pnpm vitest run src/pages/WorkBoard/__tests__/`)
- **After every plan wave:** `cd frontend && pnpm vitest run` + `pnpm lint` (picks up the guard once wired)
- **Before `/gsd:verify-work`:** full suite + `node scripts/check-date-formatting.mjs` green + the AR-render (no-Indic-digit) check
- **Max feedback latency:** quick <5s

---

## Requirements → Test Map

| Req ID                 | Behavior (observable)                                                                                                                                                                                      | Test Type                                                               | Automated Command                                                                                                                                 | Wave-0?          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **FMT-01**             | `formatDayFirst('2026-04-28','ar') === 'Tue 28 Apr'` (Latin, byte-equal to en); `formatTime` → `/^\d{2}:\d{2} GST$/` @ `Asia/Dubai`; `—` placeholder; any new `formatDayFirstYear`/`formatDateTime` shapes | unit                                                                    | `cd frontend && pnpm vitest run src/lib/__tests__/format-date.test.ts`                                                                            | ✅ new test      |
| **FMT-02**             | No ad-hoc `toLocaleDateString` for user-visible dates outside the allowlist (`lib/format-date.ts`, `components/ui/calendar.tsx` data attr)                                                                 | grep gate                                                               | `rg -n "toLocaleDateString" frontend/src -g '!**/__tests__/**' \| grep -v "lib/format-date.ts" \| grep -v "components/ui/calendar.tsx"` → 0 lines | command          |
| **FMT-03**             | Guard passes on clean tree, fails (exit 1) on a seeded offender fixture                                                                                                                                    | script self-test                                                        | `node scripts/check-date-formatting.mjs` (exit 0) + fixture arg (exit 1)                                                                          | ✅ new script    |
| **FMT-04**             | `formatRelativeTimeShort(…,'ar')` returns Latin-digit unit; KCard AR overdue chip reads `متأخر 62 يوم` (Latin digits + Arabic unit, no bare Latin `d`); `rg -c "toArDigits" frontend/src` → 0              | unit + grep                                                             | `cd frontend && pnpm vitest run src/lib/i18n/__tests__/relativeTime.test.ts src/pages/WorkBoard/__tests__/`                                       | update ~12 tests |
| **FMT-01/04 (render)** | AR dashboard + kanban + calendar at 1400 & 1024: page text matches **no** `/[٠-٩]/` Arabic-Indic digit; greeting reads day-first no-comma; digest day-first                                                | manual (agent-browser CDP) — bidi/visual, not jsdom-assertable app-wide | per D-82-06 render-verification convention                                                                                                        | manual           |

---

## Wave 0 Requirements

- [ ] `frontend/src/lib/__tests__/format-date.test.ts` — FMT-01 (shape + Latin-in-ar + `—` placeholder + any new helpers)
- [ ] `scripts/check-date-formatting.mjs` + a positive-failure fixture — FMT-03
- Framework install: none needed (Vitest already configured)

---

## Manual-Only Verifications

| Behavior                                                                      | Requirement      | Why Manual                                                                                | Test Instructions                                                                                                                                 |
| ----------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| AR UI shows zero Arabic-Indic digits (`٠-٩`) across dashboard/kanban/calendar | FMT-04 / D-82-05 | Whole-app bidi/visual render can't be jsdom-asserted; needs a real browser at 1400 & 1024 | Dedicated headless Chrome, AR (`?lng=ar`), dark: assert `!/[٠-٩]/.test(document.body.textContent)`; kanban overdue chip reads `متأخر <Latin> يوم` |
| Dashboard greeting + Intelligence Digest read day-first no-comma              | FMT-01/FMT-02    | Rendered composition of multiple date sites                                               | Same session, EN + AR: greeting matches `/^[A-Z][a-z]{2} \d{2} [A-Z][a-z]{2}/`-style day-first                                                    |

---

_Validation strategy created 2026-07-04 from 82-RESEARCH.md § Validation Architecture. Task rows populated after planning._
