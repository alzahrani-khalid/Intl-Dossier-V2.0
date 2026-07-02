---
phase: 76
slug: rtl-infrastructure-bridge-shadcn-logical-properties
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-02
---

# Phase 76 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| **Framework**          | vitest (unit) + Playwright (E2E) + node scripts (`scripts/check-*.mjs`) |
| **Config file**        | `frontend/vitest.config.ts` / `frontend/playwright.config.ts`           |
| **Quick run command**  | `{planner fills: targeted vitest / check-script command}`               |
| **Full suite command** | `{planner fills: pnpm test + pnpm lint + pnpm typecheck}`               |
| **Estimated runtime**  | ~{N} seconds                                                            |

---

## Sampling Rate

- **After every task commit:** Run `{quick run command}`
- **After every plan wave:** Run `{full suite command}`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** {N} seconds

---

## Per-Task Verification Map

| Task ID   | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status     |
| --------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ----------------- | ----------- | ---------- |
| {N}-01-01 | 01   | 1    | RTLB-01     | —          | N/A             | unit      | `{command}`       | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] {planner fills from RESEARCH.md Validation Architecture}

_If none: "Existing infrastructure covers all phase requirements."_

---

## Manual-Only Verifications

| Behavior                                          | Requirement | Why Manual                                       | Test Instructions                               |
| ------------------------------------------------- | ----------- | ------------------------------------------------ | ----------------------------------------------- |
| Calendar/Pagination/Sidebar RTL-correct in Arabic | SRTL-02     | Visual RTL verification of CLI-exempt components | {planner fills: browser steps in Arabic locale} |

_Planner completes this table from RESEARCH.md Validation Architecture._

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < {N}s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
