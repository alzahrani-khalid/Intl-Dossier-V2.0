---
phase: 76
slug: rtl-infrastructure-bridge-shadcn-logical-properties
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-02
---

# Phase 76 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | vitest (unit) + Playwright (E2E) + node scripts (`scripts/check-*.mjs`)                                                                                                                                                                        |
| **Config file**        | `frontend/vitest.config.ts` / `frontend/playwright.config.ts`                                                                                                                                                                                  |
| **Quick run command**  | `cd frontend && pnpm type-check && pnpm exec vitest run src/components/ui/__tests__/direction.test.tsx && cd .. && node scripts/check-duplicate-rtl.mjs frontend/src`                                                                          |
| **Full suite command** | `cd frontend && pnpm run lint && pnpm type-check && pnpm exec vitest run && pnpm exec playwright test tests/e2e/rtl-switching.spec.ts tests/e2e/direction-portals.spec.ts tests/e2e/dossier-drawer-rtl.spec.ts tests/e2e/calendar-rtl.spec.ts` |
| **Estimated runtime**  | quick ~60s; full ~6–10 min (lint+tsc ~3 min, playwright RTL set ~3–5 min incl. webServer boot)                                                                                                                                                 |

---

## Sampling Rate

- **After every task commit:** Run the quick run command (scope the vitest/check-script target to the touched area)
- **After every plan wave:** Run the full suite command
- **Before `/gsd:verify-work`:** Full suite must be green, plus `pnpm exec playwright test tests/e2e/dashboard-rtl.spec.ts tests/e2e/list-pages-rtl.spec.ts` as the extended RTL regression set
- **Max feedback latency:** 600 seconds (full-suite wave gate)

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement      | Threat Ref | Secure Behavior                    | Test Type     | Automated Command                                                                                                                                            | File Exists | Status     |
| -------- | ---- | ---- | ---------------- | ---------- | ---------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------- |
| 76-01-01 | 01   | 1    | RTLB-01          | T-76-SC    | pinned+audited dep install         | unit          | `cd frontend && pnpm exec vitest run src/components/ui/__tests__/direction.test.tsx`                                                                         | ❌ W0       | ⬜ pending |
| 76-01-02 | 01   | 1    | RTLB-01          | —          | N/A                                | grep + e2e    | single-writer greps + `pnpm exec playwright test tests/e2e/rtl-switching.spec.ts`                                                                            | ✅          | ⬜ pending |
| 76-02-01 | 02   | 2    | SRTL-03          | T-76-03/04 | read-only script + fixture-proven  | script        | `node scripts/check-duplicate-rtl.mjs frontend/src && ! node scripts/check-duplicate-rtl.mjs tools/rtl-fixtures`                                             | ❌ W0       | ⬜ pending |
| 76-02-02 | 02   | 2    | SRTL-03          | T-76-04    | guard live in lint chain + CI      | script        | `cd frontend && pnpm run lint`                                                                                                                               | ✅ (02-01)  | ⬜ pending |
| 76-03-01 | 03   | 2    | RTLB-01          | —          | N/A                                | unit + type   | `grep -rn getDocDir frontend/src` = 0 hits; type-check; direction.test.tsx rerun                                                                             | ✅          | ⬜ pending |
| 76-03-02 | 03   | 2    | RTLB-01, RTLB-02 | —          | N/A                                | e2e           | `cd frontend && pnpm exec playwright test tests/e2e/direction-portals.spec.ts tests/e2e/rtl-switching.spec.ts tests/e2e/dossier-drawer-rtl.spec.ts`          | ❌ W0       | ⬜ pending |
| 76-04-01 | 04   | 3    | SRTL-01          | T-76-06/07 | scoped, reviewed, isolated codemod | script + unit | `node scripts/check-duplicate-rtl.mjs frontend/src && cd frontend && pnpm type-check && pnpm exec vitest run src/components/ui/__tests__/direction.test.tsx` | ✅ (02-01)  | ⬜ pending |
| 76-04-02 | 04   | 3    | SRTL-01          | —          | N/A                                | script        | `node -e "const c=require('./frontend/components.json'); if(c.rtl!==true) process.exit(1)"`                                                                  | ✅          | ⬜ pending |
| 76-05-01 | 05   | 4    | SRTL-02          | T-76-08    | test-data-only screenshots         | e2e + grep    | `cd frontend && pnpm exec playwright test tests/e2e/calendar-rtl.spec.ts` + hand-patch greps + evidence-file count                                           | ✅          | ⬜ pending |
| 76-05-02 | 05   | 4    | SRTL-02          | —          | N/A                                | manual        | checkpoint:human-verify (visual sign-off; see Manual-Only table)                                                                                             | manual      | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/ui/__tests__/direction.test.tsx` — RTLB-01 owner derivation + same-commit flip (created test-first inside Plan 76-01 Task 1)
- [ ] `scripts/check-duplicate-rtl.mjs` + `tools/rtl-fixtures/duplicate-rtl-bad.tsx` — SRTL-03 guard + SRTL-01 recurrence gate (created fixture-first inside Plan 76-02 Task 1)
- [ ] `frontend/tests/e2e/direction-portals.spec.ts` — RTLB-02 same-frame + per-portal edge, EN and AR (created inside Plan 76-03 Task 2)

All three Wave 0 artifacts are phase deliverables built test-first within the plan that needs them; no separate Wave 0 plan required.

---

## Manual-Only Verifications

| Behavior                                          | Requirement | Why Manual                                                                                         | Test Instructions                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar/Pagination/Sidebar RTL-correct in Arabic | SRTL-02     | CLI-exempt components; no existing Pagination/Sidebar visual spec; requirement mandates human eyes | Switch to Arabic via topbar ع (or seeded `id.locale=ar`) on :5173. Calendar (/calendar): mirrored chevrons, next advances to later month. Pagination (dossiers list): mirrored prev/next, aria-current intact. Sidebar: rail + collapse on inline-start (right) edge, toggle icon mirrored. Evidence PNGs in `evidence/`; sign-off in 76-SRTL02-VERIFICATION.md via Plan 76-05 Task 2 checkpoint. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (only 76-05-02 is manual, preceded by automated 76-05-01)
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (all vitest invocations use `vitest run`; playwright non-watch)
- [x] Feedback latency < 600s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
