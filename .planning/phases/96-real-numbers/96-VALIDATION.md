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

<!-- prettier-ignore -->
| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
| ------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ----------------- | ----------- | ------ |
| 96-01-T1 | 96-01 | 1 | SANDBOX-500-01 | T-96-01/02 | RLS cycle broken collaborators-side only; row sets preserved | migration pins + e2e re-run | `96-01_g1` (gate-drill id) + `pnpm exec playwright test tests/e2e/95-sandbox-error.spec.ts --project=chromium-en --no-deps` | ✅ spec exists | ⬜ pending |
| 96-01-T2 | 96-01 | 1 | SANDBOX-500-01 | T-96-02/03 | two-sided visibility proof; non-500 probe | script + probe | `96-01_g2`: `node scripts/probe-scenario-rls.mjs` + `bash scripts/probe-edge-auth.sh scenario-sandbox` | ❌ Wave 0 (this task creates it) | ⬜ pending |
| 96-02-T1 | 96-02 | 1 | COUNT-04 | T-96-05/06 | INSERT-time coercion; population-scoped touch | migration pins + recorded SQL (MCP) | `96-02_g1` + recorded INSERT-RETURNING batch | ❌ Wave 0 (migration) | ⬜ pending |
| 96-02-T2 | 96-02 | 1 | COUNT-04, COUNT-03, DEAD-05 | T-96-04 | live-prosrc base; grants re-stated | migration pins + recorded SQL (MCP) | `96-02_g2` + same-clock fulfillment parity batch | ❌ Wave 0 (migration) | ⬜ pending |
| 96-03-T1 | 96-03 | 1 | DEAD-06 | T-96-07 | no fabricated trend can be computed | grep pins + type-check | `96-03_g1` | n/a (edit) | ⬜ pending |
| 96-03-T2 | 96-03 | 1 | DEAD-06 | T-96-08 | absent trend renders as absence | grep pins + type-check | `96-03_g2` | n/a (edit) | ⬜ pending |
| 96-03-T3 | 96-03 | 1 | DEAD-06 | T-96-07/08 | trend row ABSENT under narrowed CDP block | e2e (CDP) | `96-03_g3`: `pnpm exec playwright test tests/e2e/96-custom-dashboard-truth.spec.ts --project=chromium-en --no-deps` (2 tests) | ❌ Wave 0 | ⬜ pending |
| 96-04-T1 | 96-04 | 1 | DEAD-07 | T-96-09 | child route reachable in render | structural pins + type-check | `96-04_g1` | ❌ Wave 0 (index.tsx) | ⬜ pending |
| 96-04-T2 | 96-04 | 1 | DEAD-07 | T-96-09 | grid always renders; shared error state | grep pins + type-check + C9b runs | `96-04_g2` + 6 shipped calendar consumer specs | n/a (edit) | ⬜ pending |
| 96-04-T3 | 96-04 | 1 | DEAD-07 | T-96-10 | real offset; quoted params kept | grep pins + type-check | `96-04_g3` | n/a (edit) | ⬜ pending |
| 96-05-T1 | 96-05 | 2 | DEAD-07 | T-96-11/12 | badge never connected without 2xx; both locales same commit | JSON parse + grep pins + type-check | `96-05_g1` | n/a (edit + keys) | ⬜ pending |
| 96-05-T2 | 96-05 | 2 | DEAD-07 | T-96-11 | four surfaces behaviourally truthful | e2e (CDP) | `96-05_g2`: `pnpm exec playwright test tests/e2e/96-calendar-family.spec.ts --project=chromium-en --no-deps` (4 tests) | ❌ Wave 0 | ⬜ pending |
| 96-06-T1 | 96-06 | 2 | DEAD-05 | T-96-14 | edge repoint; throw-shape kept | grep pins + type-check | `96-06_g1` | n/a (edit) | ⬜ pending |
| 96-06-T2 | 96-06 | 2 | DEAD-05 | T-96-13 | zero fabricated visuals reachable | grep pins + type-check | `96-06_g2` | n/a (edit/delete) | ⬜ pending |
| 96-06-T3 | 96-06 | 2 | DEAD-05 | T-96-13/14 | branch-invariant fabrication absence; consumers triaged | e2e + shipped-consumer runs | `96-06_g3`: 96-analytics-real.spec.ts (2 tests) + 93-analytics-error.spec.ts | ❌ Wave 0 (96 spec) / ✅ (93 spec) | ⬜ pending |
| 96-07-T1 | 96-07 | 2 | COUNT-01 | T-96-16 | one population per KPI; seams documented | migration pins + recorded SQL (MCP) | `96-07_g1` + same-clock KPI==list batch | ❌ Wave 0 (migration) | ⬜ pending |
| 96-07-T2 | 96-07 | 2 | COUNT-01 | T-96-18 | stored notion in tabs; one response per surface | grep pins + type-check | `96-07_g2` | n/a (edit) | ⬜ pending |
| 96-07-T3 | 96-07 | 2 | COUNT-01 | T-96-17/18 | same-clock DOM + one-statement SQL agreement | e2e + SQL batch | `96-07_g3`: 96-count-agreement.spec.ts (3 tests) | ❌ Wave 0 | ⬜ pending |
| 96-08-T1 | 96-08 | 2 | COUNT-03 | T-96-20/21 | verify-not-build; three-way parity; scoped repair | unit + migration pins + recorded SQL | `96-08_g1`: stage-status-parity.test.ts via vitest | ❌ Wave 0 (test + migration) | ⬜ pending |
| 96-08-T2 | 96-08 | 2 | COUNT-03 | T-96-19 | intent routed through validated stage values | grep pins + probe + C9b run | `96-08_g2` + 06-work-item-crud.spec.ts | n/a (edits + redeploys) | ⬜ pending |
| 96-09-T1 | 96-09 | 3 | COUNT-04 | T-96-22/23 | one signal; P94 subjects stay green | unit (4 files, one run) | `96-09_g1`: WorkBoard/KCard/BoardColumn/parity via vitest | ✅ 3 exist / ❌ parity from 96-08 | ⬜ pending |
| 96-09-T2 | 96-09 | 3 | COUNT-04 | T-96-22 | chip==badges one snapshot; Done never badged; c9b swept | e2e + c9b-sweep.sh | `96-09_g2`: 96-overdue-badge.spec.ts (2 tests) + `bash scripts/c9b-sweep.sh phase-96-base` | ❌ Wave 0 | ⬜ pending |
| 96-10-T1 | 96-10 | 1 | COUNT-02 | T-96-26 | no drop-capable list path; population classified | scoped-grep invariant + type-check | `96-10_g1` (drilled both directions at authoring) | n/a (classification) | ⬜ pending |
| 96-10-T2 | 96-10 | 1 | COUNT-02 | T-96-24/25 | CHECK-verified namespaced fixture; finally-cleanup | e2e + SQL fixture | `96-10_g2`: 96-extension-rows.spec.ts (2 tests) | ❌ Wave 0 | ⬜ pending |
| 96-11-T1 | 96-11 | 1 | TRIGSWEEP-01 | T-96-27 | fail-closed classifier; six rewrites invariant | node --check + grep pins | `96-11_g1` | ❌ Wave 0 (script) | ⬜ pending |
| 96-11-T2 | 96-11 | 1 | TRIGSWEEP-01 | T-96-27/28 | both-direction control before any count believed | drill artifact pins + MCP DDL control | `96-11_g2` | ❌ Wave 0 (artifact) | ⬜ pending |

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
