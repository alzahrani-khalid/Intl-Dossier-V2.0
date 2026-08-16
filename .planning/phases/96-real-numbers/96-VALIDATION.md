---
phase: 96
slug: real-numbers
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-17
---

# Phase 96 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from
> `96-RESEARCH.md` §Validation Architecture (live-verified 2026-08-17). The Per-Task
> Verification Map is completed by the planner (P95 precedent).

---

## Test Infrastructure

| Property               | Value                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (root + frontend workspaces) for unit; Playwright for e2e (root `playwright.config.ts`)                                                             |
| **Config file**        | `vitest.config.ts`, `frontend/vitest.config.ts`, `playwright.config.ts`                                                                                    |
| **Quick run command**  | `pnpm --filter frontend exec vitest run <file> --reporter=basic`; Playwright: `pnpm exec playwright test tests/e2e/<spec> --project=chromium-en --no-deps` |
| **Full suite command** | `pnpm test -- --continue` (Turbo — `--continue` mandatory, CONTEXT D-23)                                                                                   |
| **Estimated runtime**  | ~5 min full suite; per-spec e2e ~30-90s                                                                                                                    |

**Standing constraints:** no oracle depends on the e2e `setup` project (CONTEXT D-18 —
`--no-deps` + inline auth); Playwright paths are FILTERS (existence asserted first, counts
hardcoded, CONTEXT D-17); single app instance at `:5173` for behavioural oracles.

---

## Sampling Rate

- **After every task commit:** the touched surface's vitest file(s) + the task's own spec with `--no-deps`
- **After every plan wave:** `pnpm test -- --continue` + the phase's e2e specs (`--project=chromium-en --no-deps`)
- **Before `/gsd:verify-work`:** full suite green + all 9 requirement oracles + `scripts/gate-drill.mjs` both directions
- **Max feedback latency:** ~120 seconds per task-level check

---

## Phase Requirements → Test Map (from RESEARCH — planner refines into per-task rows)

| Req ID         | Behavior                                                                                       | Test Type                                         | Automated Command                                                                                                                                                                        | File Exists                     |
| -------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| SANDBOX-500-01 | `/scenario-sandbox` renders content; error state remains failure branch                        | e2e (CDP) + probe                                 | `pnpm exec playwright test tests/e2e/95-sandbox-error.spec.ts --project=chromium-en --no-deps` (updated same-task) + `bash scripts/probe-edge-auth.sh scenario-sandbox` (expect non-500) | ✅ exists — updated in fix task |
| COUNT-03       | STAGE_TO_STATUS parity with live CASE; zero divergent rows post-writer-fix                     | unit + SQL oracle                                 | new `frontend/src/pages/WorkBoard/__tests__/stage-status-parity.test.ts` + recorded SQL                                                                                                  | ❌ Wave 0                       |
| COUNT-04       | INSERT of past-due row carries `overdue`; chip == badged cards same-clock                      | SQL + e2e DOM count                               | new `tests/e2e/96-overdue-badge.spec.ts`                                                                                                                                                 | ❌ Wave 0                       |
| COUNT-01       | Enumerated surfaces agree same-clock                                                           | e2e single-DOM snapshot + one-statement SQL batch | new `tests/e2e/96-count-agreement.spec.ts`                                                                                                                                               | ❌ Wave 0                       |
| COUNT-02       | Fixture dossier (no extension row) renders in list AND hub count                               | e2e + SQL fixture                                 | new spec + fixture insert/clean via MCP (CHECKs verified)                                                                                                                                | ❌ Wave 0                       |
| DEAD-05        | No sample/preview strings in DOM; real charts render                                           | e2e                                               | new `tests/e2e/96-analytics-real.spec.ts` (branch-invariant oracle per UI-SPEC)                                                                                                          | ❌ Wave 0                       |
| DEAD-06        | EventsWidget renders rows; trend row ABSENT under blocked comparison                           | e2e CDP (narrowed block)                          | new `tests/e2e/96-custom-dashboard-truth.spec.ts`                                                                                                                                        | ❌ Wave 0                       |
| DEAD-07        | Grid renders empty month; `/calendar/new` mounts form; `/events` offset+nav; badge three-state | e2e                                               | new `tests/e2e/96-calendar-family.spec.ts`                                                                                                                                               | ❌ Wave 0                       |
| TRIGSWEEP-01   | Instrument catches synthetic writer, ignores synthetic non-writer; residual hand-classified    | script + both-direction drill                     | recorded SQL + drill artifact on disk                                                                                                                                                    | ❌ Wave 0                       |

Existing unit anchors to keep green: `WorkBoard.test.tsx:546` (chip == filter count — extend,
don't duplicate), `KCard.test.tsx` (overdue class), `BoardColumn.test.tsx`.

---

## Per-Task Verification Map

_Completed by the planner — one row per task, threat refs from each plan's `<threat_model>`._

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status     |
| ------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ----------------- | ----------- | ---------- |
| —       | —    | —    | —           | —          | —               | —         | —                 | —           | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/e2e/96-*.spec.ts` family (6 specs above) — COUNT-01/02/04, DEAD-05/06/07
- [ ] `frontend/src/pages/WorkBoard/__tests__/stage-status-parity.test.ts` — COUNT-03
- [ ] TRIGSWEEP instrument script + both-direction drill artifact — TRIGSWEEP-01
- [ ] Framework install: none needed

---

## Manual-Only Verifications

| Behavior                       | Requirement     | Why Manual                            | Test Instructions                   |
| ------------------------------ | --------------- | ------------------------------------- | ----------------------------------- |
| Arabic naturalness + pixel RTL | (operator park) | ORCH-BRIEF §3 — no plan claims either | Operator sign-off outside the phase |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
