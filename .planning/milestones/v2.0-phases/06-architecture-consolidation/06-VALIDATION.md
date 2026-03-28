---
phase: 6
slug: architecture-consolidation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Framework**          | vitest (frontend), vitest (backend)                     |
| **Config file**        | `frontend/vitest.config.ts`, `backend/vitest.config.ts` |
| **Quick run command**  | `pnpm test --filter frontend -- --run`                  |
| **Full suite command** | `pnpm test`                                             |
| **Estimated runtime**  | ~30 seconds                                             |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --filter frontend -- --run`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                      | File Exists | Status     |
| -------- | ---- | ---- | ----------- | --------- | -------------------------------------- | ----------- | ---------- |
| 06-01-XX | 01   | 1    | ARCH-02     | unit      | `pnpm test --filter frontend -- --run` | ⬜ W0       | ⬜ pending |
| 06-02-XX | 02   | 1    | ARCH-03     | unit      | `pnpm test --filter frontend -- --run` | ⬜ W0       | ⬜ pending |
| 06-03-XX | 03   | 2    | ARCH-04     | unit      | `pnpm test --filter frontend -- --run` | ⬜ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Verify existing test infrastructure supports domain repository testing
- [ ] Add test stubs for apiClient and repository base patterns

_If none: "Existing infrastructure covers all phase requirements."_

---

## Manual-Only Verifications

| Behavior                   | Requirement | Why Manual              | Test Instructions                                                                                 |
| -------------------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| No raw fetch() in hooks    | ARCH-02     | Grep-based verification | `grep -r "fetch(" frontend/src/hooks/ --include="*.ts" --include="*.tsx"` should return 0 results |
| No duplicate service files | ARCH-03     | File system check       | Each domain directory has exactly one service/repository file                                     |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
