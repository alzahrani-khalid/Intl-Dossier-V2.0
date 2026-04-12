---
phase: 25
slug: deferred-audit-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Framework**          | vitest (unit) + Playwright (E2E)                    |
| **Config file**        | `frontend/vitest.config.ts`, `playwright.config.ts` |
| **Quick run command**  | `pnpm --filter frontend test -- --run`              |
| **Full suite command** | `pnpm test && pnpm typecheck`                       |
| **Estimated runtime**  | ~45 seconds                                         |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- --run`
- **After every plan wave:** Run `pnpm test && pnpm typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement                 | Threat Ref | Secure Behavior                            | Test Type | Automated Command                      | File Exists | Status     |
| -------- | ---- | ---- | --------------------------- | ---------- | ------------------------------------------ | --------- | -------------------------------------- | ----------- | ---------- |
| 25-01-01 | 01   | 1    | C-12                        | —          | N/A                                        | unit      | `pnpm typecheck`                       | ✅          | ⬜ pending |
| 25-01-02 | 01   | 1    | D-10                        | —          | N/A                                        | unit      | `pnpm --filter frontend test -- --run` | ✅          | ⬜ pending |
| 25-02-01 | 02   | 1    | D-11                        | —          | N/A                                        | unit      | `pnpm typecheck`                       | ✅          | ⬜ pending |
| 25-02-02 | 02   | 1    | C-20                        | —          | N/A                                        | unit      | `pnpm --filter frontend test -- --run` | ✅          | ⬜ pending |
| 25-03-01 | 03   | 2    | D-41                        | T-25-01    | Optimistic lock prevents silent overwrites | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 25-04-01 | 04   | 2    | D-32, D-33                  | —          | N/A                                        | manual    | Browser URL check                      | —           | ⬜ pending |
| 25-04-02 | 04   | 2    | D-34                        | —          | N/A                                        | manual    | Browser URL check                      | —           | ⬜ pending |
| 25-05-01 | 05   | 3    | N-20, N-04                  | —          | N/A                                        | visual    | Browser navigation check               | —           | ⬜ pending |
| 25-05-02 | 05   | 3    | breadcrumb/skeleton rollout | —          | N/A                                        | visual    | Browser navigation check               | —           | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Existing vitest and Playwright infrastructure covers automated verification
- [ ] TypeScript strict mode catches type regressions from context splitting

_Existing infrastructure covers most phase requirements. Manual browser checks needed for URL state and breadcrumb visual verification._

---

## Manual-Only Verifications

| Behavior                              | Requirement        | Why Manual                           | Test Instructions                                             |
| ------------------------------------- | ------------------ | ------------------------------------ | ------------------------------------------------------------- |
| Pagination state preserved on refresh | D-32, D-33         | URL param behavior requires browser  | Navigate to list, change page, refresh — page param preserved |
| Kanban filter state shareable         | D-34               | URL sharing requires copy-paste test | Apply filter, copy URL, open in new tab — same filter applied |
| Breadcrumbs on all 8 dossier types    | breadcrumb rollout | Visual verification across 8 pages   | Visit each dossier type list, verify breadcrumb trail         |
| Type tab active state highlighted     | N-04               | Visual verification                  | Navigate dossier types, verify active tab styling             |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
