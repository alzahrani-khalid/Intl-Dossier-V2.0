---
phase: 5
slug: responsive-design
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react + Playwright |
| **Config file** | `frontend/vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm --filter frontend test -- --run` |
| **Full suite command** | `pnpm test && pnpm --filter frontend test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- --run`
- **After every plan wave:** Run `pnpm test && pnpm --filter frontend test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | RESP-04 | visual + unit | `pnpm --filter frontend test -- --run` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | RESP-03 | unit | `pnpm --filter frontend test -- --run` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | RESP-01, RESP-02 | visual + e2e | `pnpm exec playwright test` | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 4 | RESP-05 | unit + visual | `pnpm --filter frontend test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/test/responsive-utils.ts` — viewport resize helpers for vitest/testing-library
- [ ] `tests/e2e/responsive/` — Playwright viewport test directory
- [ ] `vaul` package install — required for bottom-sheet.tsx mobile modals

*Existing vitest + Playwright infrastructure covers framework needs. Wave 0 adds responsive-specific test utilities.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Touch target feel on real device | RESP-02 | Physical touch interaction | Test on iOS/Android device at each breakpoint, verify 44x44px targets are comfortable |
| Bottom sheet drag-to-dismiss | RESP-05 | Gesture interaction | Open modal on mobile viewport, verify drag gesture works smoothly |
| Keyboard handling in mobile forms | RESP-05 | Virtual keyboard behavior | Fill form fields on mobile, verify no viewport overflow when keyboard appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
