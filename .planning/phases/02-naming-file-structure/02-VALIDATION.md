---
phase: 2
slug: naming-file-structure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Framework**          | vitest + ESLint 9 flat config + TypeScript compiler |
| **Config file**        | `frontend/vitest.config.ts`, `eslint.config.js`     |
| **Quick run command**  | `pnpm typecheck && pnpm lint`                       |
| **Full suite command** | `pnpm typecheck && pnpm lint && pnpm test`          |
| **Estimated runtime**  | ~45 seconds                                         |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck && pnpm lint`
- **After every plan wave:** Run `pnpm typecheck && pnpm lint && pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type      | Automated Command                                             | File Exists | Status     |
| -------- | ---- | ---- | ----------- | -------------- | ------------------------------------------------------------- | ----------- | ---------- |
| 02-01-01 | 01   | 1    | ARCH-01     | lint           | `pnpm lint -- --rule 'check-file/filename-naming-convention'` | ❌ W0       | ⬜ pending |
| 02-01-02 | 01   | 1    | ARCH-01     | typecheck      | `pnpm typecheck`                                              | ✅          | ⬜ pending |
| 02-02-01 | 02   | 1    | ARCH-01     | lint+typecheck | `pnpm typecheck && pnpm lint`                                 | ✅          | ⬜ pending |
| 02-03-01 | 03   | 2    | ARCH-01     | lint+typecheck | `pnpm typecheck && pnpm lint`                                 | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `eslint-plugin-check-file` — install and configure in ESLint 9 flat config
- [ ] ESLint rules for `check-file/filename-naming-convention` and `check-file/folder-naming-convention` — per-directory patterns
- [ ] Verify TypeScript path aliases resolve after renames

_Existing vitest and TypeScript infrastructure covers compilation and test validation._

---

## Manual-Only Verifications

| Behavior                       | Requirement | Why Manual                                        | Test Instructions                                |
| ------------------------------ | ----------- | ------------------------------------------------- | ------------------------------------------------ |
| macOS case-insensitive renames | ARCH-01     | git tracks case changes only with two-step rename | Verify `git status` shows renames, not new files |
| Import paths in IDE            | ARCH-01     | IDE index refresh not automatable                 | Open 3 renamed files, verify no red squiggles    |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
