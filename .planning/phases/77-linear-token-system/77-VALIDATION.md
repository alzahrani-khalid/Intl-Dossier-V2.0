---
phase: 77
slug: linear-token-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-02
---

# Phase 77 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Substantive dimensions derive from `77-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property               | Value                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | vitest (unit) + Playwright (e2e / visual regression) + node check scripts (`scripts/check-*.mjs`)                           |
| **Config file**        | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`                                                                |
| **Quick run command**  | `cd frontend && pnpm type-check && pnpm run lint` (lint includes the Design-Token-Check + FOUC byte-match guard once wired) |
| **Full suite command** | `cd frontend && pnpm exec vitest run && pnpm exec playwright test`                                                          |
| **Estimated runtime**  | quick ~30–90s; full ~several min (Playwright)                                                                               |

---

## Sampling Rate

- **After every task commit:** Run the quick command (type-check + lint/Design-Token-Check + FOUC byte-match guard).
- **After every plan wave:** Run the full suite.
- **Before `/gsd:verify-work`:** Full suite green AND the VERIFY-01 pre-swap visual baseline captured (gates the token PR — no baseline laundering; re-compare is Phase 80).
- **Max feedback latency:** ~90s for the quick gate.

---

## Per-Task Verification Map

> Populated by the planner from each plan's `<acceptance_criteria>`. Every behavior-adding task maps to an
> automated command (or a Wave-0 stub / Manual-Only row below).

| Task ID   | Plan | Wave | Requirement | Threat Ref  | Secure Behavior   | Test Type       | Automated Command | File Exists | Status     |
| --------- | ---- | ---- | ----------- | ----------- | ----------------- | --------------- | ----------------- | ----------- | ---------- |
| {N}-01-01 | 01   | 1    | TOKEN-0X    | T-77-0X / — | {expected or N/A} | unit/e2e/script | `{command}`       | ✅ / ❌ W0  | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] FOUC byte-match guard (`scripts/check-*.mjs`) — fails the build when `bootstrap.js` palette/font literals diverge from `directions.ts` (FOUC-01, TOKEN-02); positive-failure fixture proves it fires (mirror Phase-76 `check-duplicate-rtl` precedent).
- [ ] WCAG-AA contrast assertion for the TOKEN-03 gap palettes (form-error/warning + 6 status tags) in the Linear dark-surface band.
- [ ] `id.dir` legacy-coercion regression (bootstrap.js + DesignProvider both coerce retired directions → `linear`; first paint never loses tokens).

_Existing infra (vitest/Playwright/ESLint Design-Token-Check) covers the rest; no new framework install._

---

## Manual-Only Verifications

| Behavior                                                                     | Requirement   | Why Manual                                                                                                             | Test Instructions                                                                     |
| ---------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| VERIFY-01 pre-swap visual baseline (EN+AR × dark+light, ~15–20 specs)        | TOKEN-01 gate | `Visual Regression (Phase 46)` CI job is red on main (issue #31 class) — capture/replay follows the Phase-46 precedent | Seeded dev machine + human review; capture before ANY `directions.ts` literal changes |
| Linear primitive re-skin visual fidelity (button/card/input, dark canonical) | TOKEN-06      | Recipe fidelity (no shadows, hairline borders, surface ladder) is a visual judgment                                    | Human review against the Linear reference in `.planning/research/STACK.md`            |

---

## Validation Sign-Off

- [ ] All behavior-adding tasks have `<automated>` verify or a Wave-0 dependency / Manual-Only row
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (FOUC guard, WCAG assertion, id.dir coercion)
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s (quick gate)
- [ ] `nyquist_compliant: true` set in frontmatter (planner/checker flips once the map is complete)

**Approval:** pending
