---
phase: 1
slug: dead-code-toolchain
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                 |
| ---------------------- | --------------------------------------------------------------------- | -------- |
| **Framework**          | CLI tools (knip, eslint, prettier, pnpm build)                        |
| **Config file**        | `eslint.config.mjs`, `knip.json`, `.prettierrc` (created in phase)    |
| **Quick run command**  | `pnpm exec eslint --max-warnings 0 . 2>&1                             | tail -5` |
| **Full suite command** | `pnpm exec knip && pnpm exec eslint --max-warnings 0 . && pnpm build` |
| **Estimated runtime**  | ~30 seconds                                                           |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec eslint --max-warnings 0 .`
- **After every plan wave:** Run `pnpm exec knip && pnpm exec eslint --max-warnings 0 . && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                                  | File Exists | Status     |
| -------- | ---- | ---- | ----------- | --------- | -------------------------------------------------- | ----------- | ---------- | ---------- |
| 01-01-xx | 01   | 1    | TOOL-01     | cli       | `pnpm exec knip --no-exit-code`                    | ❌ W0       | ⬜ pending |
| 01-02-xx | 02   | 1    | TOOL-02     | cli       | `pnpm exec eslint --max-warnings 0 .`              | ❌ W0       | ⬜ pending |
| 01-03-xx | 03   | 2    | TOOL-03     | cli       | `git commit --allow-empty -m "test" && git log -1` | ❌ W0       | ⬜ pending |
| 01-04-xx | 04   | 2    | TOOL-04     | cli       | `pnpm build`                                       | ✅ exists   | ⬜ pending |
| 01-05-xx | 05   | 3    | TOOL-05     | cli       | `pnpm outdated 2>&1                                | head -20`   | ✅ exists  | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `knip.json` — workspace-aware Knip config at monorepo root
- [ ] `eslint.config.mjs` — ESLint 9 flat config at root
- [ ] `.prettierrc` — single unified Prettier config
- [ ] Install: `knip@^6.0.2`, `husky@^9`, `lint-staged@^15`

---

## Manual-Only Verifications

| Behavior                 | Requirement | Why Manual                 | Test Instructions                                                              |
| ------------------------ | ----------- | -------------------------- | ------------------------------------------------------------------------------ |
| Git hook fires on commit | TOOL-03     | Requires actual git commit | 1. Stage a file 2. `git commit -m "test"` 3. Verify lint-staged output appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
