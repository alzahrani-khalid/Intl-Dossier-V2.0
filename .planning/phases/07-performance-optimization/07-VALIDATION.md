---
phase: 7
slug: performance-optimization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Framework**          | vitest                                                   |
| **Config file**        | `frontend/vitest.config.ts` / `backend/vitest.config.ts` |
| **Quick run command**  | `pnpm test --run`                                        |
| **Full suite command** | `pnpm test && pnpm typecheck && pnpm lint`               |
| **Estimated runtime**  | ~30 seconds                                              |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test && pnpm typecheck && pnpm lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                                 | File Exists | Status     |
| -------- | ---- | ---- | ----------- | --------- | ------------------------------------------------- | ----------- | ---------- |
| 07-01-01 | 01   | 1    | PERF-01     | build     | `pnpm build && node scripts/check-bundle-size.js` | ✅          | ⬜ pending |
| 07-01-02 | 01   | 1    | PERF-01     | build     | `pnpm build --analyze`                            | ❌ W0       | ⬜ pending |
| 07-02-01 | 02   | 1    | PERF-02     | metric    | `pnpm test --run`                                 | ✅          | ⬜ pending |
| 07-02-02 | 02   | 2    | PERF-03     | query     | `pnpm test --run`                                 | ✅          | ⬜ pending |
| 07-02-03 | 02   | 2    | PERF-04     | profile   | Manual React DevTools                             | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `size-limit` config in `frontend/package.json` — enforce 200KB gzipped budget per entry
- [ ] Lighthouse CI config (`.lighthouserc.js`) — CWV assertion thresholds
- [ ] Bundle analyzer script update — replace loose 2.5MB threshold with size-limit

_If none: "Existing infrastructure covers all phase requirements."_

---

## Manual-Only Verifications

| Behavior                               | Requirement | Why Manual                                         | Test Instructions                                                                                  |
| -------------------------------------- | ----------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| No unnecessary re-renders on key pages | PERF-04     | Requires React DevTools Profiler visual inspection | Open dashboard/dossier-list/dossier-detail, enable Profiler, interact, verify no redundant renders |
| Core Web Vitals in production          | PERF-02     | Requires real browser on deployed site             | Run Lighthouse on deployed URL, verify LCP < 2.5s, INP < 200ms, CLS < 0.1                          |

_If none: "All phase behaviors have automated verification."_

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
