---
phase: 11
slug: engagement-workspace
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                  |
| ---------------------- | -------------------------------------- |
| **Framework**          | vitest                                 |
| **Config file**        | `frontend/vitest.config.ts`            |
| **Quick run command**  | `pnpm --filter frontend test -- --run` |
| **Full suite command** | `pnpm --filter frontend test -- --run` |
| **Estimated runtime**  | ~30 seconds                            |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- --run`
- **After every plan wave:** Run `pnpm --filter frontend test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type   | Automated Command                      | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | -------------------------------------- | ----------- | ---------- |
| 11-01-01 | 01   | 1    | WORK-01     | unit        | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 11-01-02 | 01   | 1    | WORK-02     | unit        | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 11-02-01 | 02   | 1    | WORK-03     | unit        | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 11-03-01 | 03   | 2    | WORK-04     | unit        | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 11-04-01 | 04   | 2    | WORK-07     | integration | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 11-05-01 | 05   | 3    | WORK-09     | unit        | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Test stubs for WorkspaceShell layout route rendering
- [ ] Test stubs for LifecycleBar stage display and interaction
- [ ] Test stubs for tab navigation and URL sync
- [ ] Test stubs for scoped data filtering per tab
- [ ] Shared test fixtures for engagement mock data

_Existing vitest infrastructure covers framework needs — no new framework install required._

---

## Manual-Only Verifications

| Behavior                             | Requirement | Why Manual                                                | Test Instructions                                                           |
| ------------------------------------ | ----------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Tab lazy-loading via route splitting | WORK-10     | Code splitting verified by bundle analysis, not unit test | Check network tab — navigating to a tab loads its chunk on first visit      |
| Mobile tab scrolling                 | WORK-01     | Touch interaction                                         | Swipe horizontally on mobile viewport to scroll tabs                        |
| RTL tab order                        | WORK-01     | Visual direction                                          | Switch to Arabic, verify tabs flow right-to-left                            |
| Deep-link URL sharing                | WORK-09     | Full browser navigation                                   | Copy `/engagements/123/tasks` URL, paste in new tab, verify Tasks tab opens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
