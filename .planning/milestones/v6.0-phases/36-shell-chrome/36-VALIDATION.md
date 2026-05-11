---
phase: 36
slug: shell-chrome
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `.planning/phases/36-shell-chrome/36-RESEARCH.md` §"Validation Architecture"

---

## Test Infrastructure

| Property               | Value                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 4.1.2 (unit + component) + Playwright 1.58.2 (E2E + visual smoke) + axe-core 4.11.1 (a11y)       |
| **Config files**       | `frontend/vitest.config.ts`, `frontend/vitest.a11y.config.ts`, `frontend/playwright.config.ts`          |
| **Quick run command**  | `pnpm -C frontend test -- src/components/layout`                                                        |
| **Full suite command** | `pnpm -C frontend test && pnpm -C frontend test:a11y && pnpm -C frontend test:e2e -- --grep "Phase 36"` |
| **Estimated runtime**  | ~20s (quick, component-only) / ~180s (full with E2E + a11y + visual smoke)                              |

---

## Sampling Rate

- **After every task commit:** Run `pnpm -C frontend test -- src/components/layout` (~20s)
- **After every plan wave:** Run full Vitest + a11y suites + `--grep "Phase 36"` E2E
- **Before `/gsd-verify-work`:** Full Vitest green + a11y green + 8-screenshot visual smoke green + `bash scripts/check-deleted-components.sh` exit 0
- **Max feedback latency:** 20 seconds for per-task, 180 seconds for wave-gate

---

## Per-Task Verification Map

> Task IDs are provisional — planner locks final `{N}-{plan}-{task}` IDs in PLAN.md frontmatter.
> Wave column reflects the research's recommended 6-task / 3-wave decomposition:
> Wave 0 = test scaffolding + GastatLogo, Wave 1 = Sidebar/Topbar/ClassificationBar/AppShell, Wave 2 = `_protected.tsx` swap + deletion + CI gate + visual smoke.

| Task ID  | Plan | Wave | Requirement  | Threat Ref | Secure Behavior                                                                                | Test Type        | Automated Command                                                                                    | File Exists | Status     |
| -------- | ---- | ---- | ------------ | ---------- | ---------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 36-00-01 | 00   | 0    | Wave 0       | —          | N/A                                                                                            | scaffold         | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx`                                   | ❌ W0       | ⬜ pending |
| 36-00-02 | 00   | 0    | SHELL-05     | —          | inline SVG, no innerHTML                                                                       | unit             | `pnpm -C frontend test -- src/components/brand/GastatLogo.test.tsx`                                  | ❌ W0       | ⬜ pending |
| 36-00-03 | 00   | 0    | SHELL-05     | T-36-03    | `color: var(--accent)` tint via currentColor                                                   | component        | `pnpm -C frontend test -- src/components/brand/GastatLogo.test.tsx -t "accent tint"`                 | ❌ W0       | ⬜ pending |
| 36-01-01 | 01   | 1    | SHELL-01     | —          | N/A                                                                                            | component        | `pnpm -C frontend test -- src/components/layout/Sidebar.test.tsx`                                    | ❌ W0       | ⬜ pending |
| 36-01-02 | 01   | 1    | SHELL-01     | —          | N/A                                                                                            | component        | `pnpm -C frontend test -- src/components/layout/Sidebar.test.tsx -t "active accent bar"`             | ❌ W0       | ⬜ pending |
| 36-01-03 | 01   | 1    | SHELL-01     | T-36-06    | `isAdmin === false` hides Administration (UI defense-in-depth; backend RLS is source of truth) | component        | `pnpm -C frontend test -- src/components/layout/Sidebar.test.tsx -t "admin gate"`                    | ❌ W0       | ⬜ pending |
| 36-02-01 | 02   | 1    | SHELL-02     | —          | 7-item JSX order in LTR                                                                        | component        | `pnpm -C frontend test -- src/components/layout/Topbar.test.tsx -t "item order"`                     | ❌ W0       | ⬜ pending |
| 36-02-02 | 02   | 1    | SHELL-02     | —          | `lg:inline hidden` ⌘K visibility                                                               | component        | `pnpm -C frontend test -- src/components/layout/Topbar.test.tsx -t "kbd hint responsive"`            | ❌ W0       | ⬜ pending |
| 36-02-03 | 02   | 1    | SHELL-02     | —          | `useTweaksOpen()` callable from Topbar                                                         | component        | `pnpm -C frontend test -- src/components/layout/Topbar.test.tsx -t "tweaks trigger"`                 | ❌ W0       | ⬜ pending |
| 36-03-01 | 03   | 1    | SHELL-03     | T-36-05    | classification level visible only when `useClassification()` true                              | component        | `pnpm -C frontend test -- src/components/layout/ClassificationBar.test.tsx -t "visibility gate"`     | ❌ W0       | ⬜ pending |
| 36-03-02 | 03   | 1    | SHELL-03     | —          | N/A                                                                                            | component        | `pnpm -C frontend test -- src/components/layout/ClassificationBar.test.tsx -t "chancery marginalia"` | ❌ W0       | ⬜ pending |
| 36-03-03 | 03   | 1    | SHELL-03     | —          | N/A                                                                                            | component        | `pnpm -C frontend test -- src/components/layout/ClassificationBar.test.tsx -t "situation ribbon"`    | ❌ W0       | ⬜ pending |
| 36-03-04 | 03   | 1    | SHELL-03     | —          | N/A                                                                                            | component        | `pnpm -C frontend test -- src/components/layout/ClassificationBar.test.tsx -t "chip variants"`       | ❌ W0       | ⬜ pending |
| 36-04-01 | 04   | 1    | SHELL-04     | T-36-02    | hamburger-only nav at ≤1024px (no dual nav surface)                                            | component        | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx -t "responsive drawer mode"`       | ❌ W0       | ⬜ pending |
| 36-04-02 | 04   | 1    | SHELL-04     | T-36-02    | React Aria FocusScope contain — ESC dismiss                                                    | component + a11y | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx -t "drawer open close"`            | ❌ W0       | ⬜ pending |
| 36-04-03 | 04   | 1    | SHELL-04     | —          | N/A                                                                                            | component        | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx -t "drawer rtl flip"`              | ❌ W0       | ⬜ pending |
| 36-04-04 | 04   | 1    | SHELL-04     | —          | N/A                                                                                            | component        | `pnpm -C frontend test -- src/components/layout/AppShell.test.tsx -t "phone layout"`                 | ❌ W0       | ⬜ pending |
| 36-05-01 | 05   | 2    | SHELL-01..05 | T-36-01    | no unauthenticated access path introduced (`_protected.tsx` auth gate preserved)               | E2E              | `pnpm -C frontend test:e2e -- --grep "shell no remount"`                                             | ❌ W0       | ⬜ pending |
| 36-05-02 | 05   | 2    | SHELL-04     | —          | N/A                                                                                            | E2E              | `pnpm -C frontend test:e2e -- --grep "direction atomic"`                                             | ❌ W0       | ⬜ pending |
| 36-05-03 | 05   | 2    | Phase DoD    | —          | delete-list enforced (defense-in-depth against regression)                                     | CI shell         | `bash scripts/check-deleted-components.sh`                                                           | ✅ (extend) | ⬜ pending |
| 36-05-04 | 05   | 2    | a11y         | T-36-04    | axe-core no serious/critical in 4 directions × 2 locales                                       | a11y             | `pnpm -C frontend test:a11y -- src/components/layout/AppShell.a11y.test.tsx`                         | ❌ W0       | ⬜ pending |
| 36-05-05 | 05   | 2    | a11y         | —          | tab order preserved across shell                                                               | E2E              | `pnpm -C frontend test:e2e -- --grep "shell tab order"`                                              | ❌ W0       | ⬜ pending |
| 36-05-06 | 05   | 2    | visual       | —          | 8-screenshot classification chrome smoke (4 directions × 2 locales)                            | visual-smoke     | `pnpm -C frontend test:e2e -- --grep "shell chrome smoke"`                                           | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_
_Threat refs correspond to RESEARCH.md §Security Domain threat patterns T-36-01..T-36-06._

---

## Wave 0 Requirements

- [ ] `frontend/src/components/layout/AppShell.test.tsx` — SHELL-04 integration, drawer responsive + RTL flip + phone layout
- [ ] `frontend/src/components/layout/Sidebar.test.tsx` — SHELL-01 sections + active accent bar + admin gate
- [ ] `frontend/src/components/layout/Topbar.test.tsx` — SHELL-02 item order + kbd visibility + Tweaks trigger
- [ ] `frontend/src/components/layout/ClassificationBar.test.tsx` — SHELL-03 visibility gate + 4 direction variants
- [ ] `frontend/src/components/brand/GastatLogo.test.tsx` — SHELL-05 viewBox + currentColor + accent tint
- [ ] `frontend/src/components/layout/AppShell.a11y.test.tsx` — axe-core in 8 direction×locale combos
- [ ] `frontend/tests/e2e/phase-36-shell.spec.ts` — route stability, direction atomic re-paint, drawer open/close, tab order
- [ ] `frontend/tests/e2e/phase-36-shell-smoke.spec.ts` — 8-screenshot visual smoke (4 directions × 2 locales)
- [ ] `scripts/check-deleted-components.sh` — extend with `MainLayout.tsx`, `AppSidebar.tsx`, `SiteHeader.tsx`, `MobileBottomTabBar.tsx`
- [ ] `frontend/src/i18n/locales/en.json` — add `shell.*` namespace per UI-SPEC §Copywriting Contract
- [ ] `frontend/src/i18n/locales/ar.json` — add `shell.*` Arabic (Tajawal-compatible)

---

## Manual-Only Verifications

| Behavior                                                                                                                            | Requirement | Why Manual                                                                                                                          | Test Instructions                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Classification chip visual fidelity vs handoff PNG (chancery marginalia line-up, situation ribbon exact height, chip corner radius) | SHELL-03    | Pixel-perfect match requires human eye — automated `toMatchSnapshot()` is too strict for sub-pixel rendering across CI environments | 1) Run `pnpm dev`; 2) Toggle each direction via bootstrap.js + TweaksDrawer; 3) Compare against `/tmp/inteldossier-handoff/inteldossier/project/reference/*.png` at 100% zoom in both light/dark |
| 320px phone breakpoint real-device touch target feel                                                                                | SHELL-04    | Touch-target minimums are testable in Playwright but "comfortable tap" is subjective                                                | 1) Open app on 320px-width emulator (Chrome DevTools); 2) Drag-open hamburger drawer; 3) Tap every nav item; all must hit 44×44 comfortably                                                      |
| `GASTAT_LOGO.svg` visual parity after currentColor conversion                                                                       | SHELL-05    | Detecting missed `fill="#hex"` attributes requires side-by-side eye comparison                                                      | 1) Render `<GastatLogo size={128} className="text-blue-500" />` in Storybook or dev route; 2) Screenshot; 3) Compare with `<img src="/tmp/.../GASTAT_LOGO.svg">` at same size                    |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify commands or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all ❌ references (11 files listed above)
- [ ] No watch-mode flags in any automated command
- [ ] Feedback latency < 20s (quick) / < 180s (full)
- [ ] `nyquist_compliant: true` set in frontmatter after all tests written

**Approval:** pending
