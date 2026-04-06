---
phase: 10
slug: operations-hub
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-30
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Framework**          | TypeScript compiler (tsc --noEmit)                  |
| **Config file**        | `frontend/tsconfig.json`                            |
| **Quick run command**  | `pnpm --filter frontend exec tsc --noEmit --pretty` |
| **Full suite command** | `pnpm --filter frontend exec tsc --noEmit --pretty` |
| **Estimated runtime**  | ~20 seconds                                         |

**Note:** All plan `<automated>` verify commands use TypeScript compilation checks (`tsc --noEmit`), not vitest test suite runs. This is a valid <30s automated verification that catches type errors, missing imports, and contract violations. Vitest unit tests can be added in a future testing phase.

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend exec tsc --noEmit --pretty`
- **After every plan wave:** Run full tsc compilation
- **Before `/gsd:verify-work`:** Full compilation must be clean
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                                   | Status     |
| -------- | ---- | ---- | ----------- | --------- | --------------------------------------------------- | ---------- |
| 10-01-01 | 01   | 1    | OPS-01      | tsc       | `pnpm --filter frontend exec tsc --noEmit --pretty` | ⬜ pending |
| 10-01-02 | 01   | 1    | OPS-02      | tsc       | `pnpm --filter frontend exec tsc --noEmit --pretty` | ⬜ pending |
| 10-02-01 | 02   | 2    | OPS-01-04   | tsc       | `pnpm --filter frontend exec tsc --noEmit --pretty` | ⬜ pending |
| 10-02-02 | 02   | 2    | OPS-01-04   | tsc       | `pnpm --filter frontend exec tsc --noEmit --pretty` | ⬜ pending |
| 10-03-01 | 03   | 3    | OPS-05-07   | tsc       | `pnpm --filter frontend exec tsc --noEmit --pretty` | ⬜ pending |
| 10-03-02 | 03   | 3    | OPS-05-07   | tsc       | `pnpm --filter frontend exec tsc --noEmit --pretty` | ⬜ pending |
| 10-04-01 | 04   | 4    | OPS-01,06   | tsc       | `pnpm --filter frontend exec tsc --noEmit --pretty` | ⬜ pending |
| 10-04-02 | 04   | 4    | OPS-01,06   | human     | Human verification checkpoint                       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] No separate Wave 0 plan needed — all tasks use `tsc --noEmit` as their automated verification command, which runs in <20s and validates type contracts, imports, and interface compliance without requiring test stubs.

_Existing TypeScript strict mode configuration provides sufficient automated verification._

---

## Manual-Only Verifications

| Behavior                      | Requirement | Why Manual                     | Test Instructions                                                                 |
| ----------------------------- | ----------- | ------------------------------ | --------------------------------------------------------------------------------- |
| Role-adaptive zone reordering | OPS-05      | Visual layout verification     | Switch role dropdown → verify zone order changes per D-09                         |
| Mobile collapsible cards      | OPS-02      | Responsive breakpoint behavior | Resize to <640px → verify stacked cards with collapse/expand                      |
| Realtime attention updates    | OPS-01      | Requires Supabase Realtime     | Insert overdue work_item → verify it appears in Attention zone within 5s          |
| RTL layout correctness        | OPS-02      | Visual RTL verification        | Switch to Arabic → verify all zones use logical properties and read right-to-left |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (tsc compilation checks)
- [x] Sampling continuity: every task has automated verify
- [x] Wave 0 not needed — tsc approach provides valid automated checks
- [x] No watch-mode flags
- [x] Feedback latency < 30s (~20s for tsc)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated
