---
phase: 4
slug: rtl-ltr-consistency
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x + @testing-library/react 16.x |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `pnpm --filter frontend test -- --run --reporter=verbose` |
| **Full suite command** | `pnpm --filter frontend test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- --run --reporter=verbose`
- **After every plan wave:** Run `pnpm --filter frontend test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | RTL-01 | unit | `grep -rn 'dir=' frontend/src --include='*.tsx' \| grep -v 'node_modules' \| wc -l` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | RTL-02 | lint | `grep -rPn '\b(ml-|mr-|pl-|pr-|text-left|text-right)\b' frontend/src --include='*.tsx' \| wc -l` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 1 | RTL-03 | visual | Manual: switch AR/EN + dark/light, check for layout shifts | N/A | ⬜ pending |
| 04-02-02 | 02 | 2 | RTL-04 | integration | `pnpm --filter frontend test -- --run -t "RTL"` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | RTL-05 | unit | `grep -rn 'useDirection' frontend/src --include='*.tsx' \| wc -l` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/tests/rtl-compliance.test.tsx` — stubs for RTL-01, RTL-02 (zero physical CSS, zero per-component dir)
- [ ] `frontend/src/tests/rtl-third-party.test.tsx` — stubs for RTL-04 (React Flow, Recharts, DnD-kit, TanStack Table in RTL)
- [ ] ESLint plugin verification — confirm `eslint-plugin-rtl-friendly` works with ESLint 9 flat config

*Existing vitest infrastructure covers test runner needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Theme+direction switching produces no visual bugs | RTL-03 | Visual regression requires human eye or screenshot comparison | 1. Switch to AR, 2. Toggle dark/light, 3. Navigate 5 key pages, 4. Check for layout shifts |
| React Flow graph nodes render correctly in RTL | RTL-04 | Canvas rendering not capturable via DOM tests | 1. Open network graph in AR mode, 2. Verify node positions and edge directions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
