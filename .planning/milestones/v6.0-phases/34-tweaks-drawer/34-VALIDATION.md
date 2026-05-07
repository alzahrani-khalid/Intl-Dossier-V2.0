---
phase: 34
slug: tweaks-drawer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `.planning/phases/34-tweaks-drawer/34-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property               | Value                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| **Framework**          | Vitest 1.x (unit/integration) + Playwright 1.x (E2E)                      |
| **Config file**        | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`              |
| **Quick run command**  | `pnpm --filter frontend test -- tweaks bootstrap design-system/direction` |
| **Full suite command** | `pnpm test` (Turbo) + `pnpm --filter frontend playwright test`            |
| **Estimated runtime**  | ~60s unit/integration, ~90s E2E (focus-trap + redirect)                   |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- tweaks bootstrap design-system/direction`
- **After every plan wave:** Run `pnpm test` (Turbo full suite)
- **Before `/gsd-verify-work`:** Full Vitest suite green + Playwright E2E (focus-trap LTR+RTL, redirect) green
- **Max feedback latency:** 60 seconds (unit) / 90 seconds (E2E)

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement             | Threat Ref                     | Secure Behavior                                                                                                              | Test Type     | Automated Command                                               | File Exists | Status     |
| -------- | ---- | ---- | ----------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------- | ----------- | ---------- |
| 34-01-\* | 01   | 0    | Wave 0 — test scaffolds | —                              | N/A                                                                                                                          | scaffold      | `pnpm --filter frontend test -- tweaks --run` (stubs pass)      | ❌ W0       | ⬜ pending |
| 34-02-\* | 02   | 1    | THEME-01                | —                              | Labels render in EN+AR with no missing keys                                                                                  | integration   | `vitest tweaks/TweaksDrawer.test.tsx -t "renders 6 sections"`   | ❌ W0       | ⬜ pending |
| 34-03-\* | 03   | 1    | THEME-03                | —                              | Direction click writes mode+hue defaults atomically                                                                          | unit          | `vitest design-system/directionDefaults.test.ts`                | ❌ W0       | ⬜ pending |
| 34-04-\* | 04   | 1    | THEME-02                | T5-V5 (input sanitization)     | All 6 `id.*` keys round-trip; garbage values fall back to defaults                                                           | integration   | `vitest tweaks/persistence.test.tsx`                            | ❌ W0       | ⬜ pending |
| 34-05-\* | 05   | 2    | THEME-02                | T11-V11 (migrator idempotency) | `i18nextLng → id.locale` migrator runs ONCE; never overwrites existing `id.locale`                                           | unit          | `vitest bootstrap/migrator.test.ts`                             | ❌ W0       | ⬜ pending |
| 34-06-\* | 06   | 2    | SC-4                    | —                              | Focus trap active inside drawer; ESC closes; focus returns to trigger                                                        | E2E           | `playwright test tweaks/focus-trap.spec.ts` (2 cases: LTR, RTL) | ❌ W0       | ⬜ pending |
| 34-07-\* | 07   | 3    | THEME-04                | —                              | `/themes` → `/` via `beforeLoad` throw; no render flash                                                                      | E2E           | `playwright test tweaks/redirect.spec.ts`                       | ❌ W0       | ⬜ pending |
| 34-08-\* | 08   | 3    | THEME-04                | —                              | Zero references to deleted components (`LanguageToggle`, `LanguageSwitcher`, `Themes.tsx`, `useTheme` shim, `ThemeSelector`) | static (grep) | `./scripts/check-deleted-components.sh`                         | ❌ W0       | ⬜ pending |
| 34-09-\* | 09   | 3    | N/A (parity)            | —                              | Every `tweaks.*` key in `en/common.json` exists in `ar/common.json`                                                          | unit          | `vitest i18n/label-parity.test.ts`                              | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_
_Task IDs are placeholders — planner assigns final IDs when PLAN.md files are created; map updates during planning._

---

## Wave 0 Requirements

Wave 0 MUST create the following test scaffolds BEFORE any implementation task runs. The planner's first plan (01-\*) is dedicated to Wave 0.

- [ ] `frontend/src/components/tweaks/TweaksDrawer.test.tsx` — stubs for THEME-01 (renders 6 sections, EN+AR labels)
- [ ] `frontend/src/components/tweaks/persistence.test.tsx` — stubs for THEME-02 (localStorage round-trip for all 6 `id.*` keys + garbage-value fallback)
- [ ] `frontend/tests/bootstrap/migrator.test.ts` — stubs for `i18nextLng → id.locale` one-time migrator (jsdom harness for vanilla JS)
- [ ] `frontend/src/design-system/directionDefaults.test.ts` — stubs for THEME-03 (direction click writes mode+hue defaults per D-16 map)
- [ ] `frontend/tests/e2e/tweaks/focus-trap.spec.ts` — stubs for SC-4 (focus trap + ESC in LTR and RTL)
- [ ] `frontend/tests/e2e/tweaks/redirect.spec.ts` — stubs for THEME-04 (`/themes` → `/`)
- [ ] `frontend/src/i18n/label-parity.test.ts` — stubs for Arabic/English label parity
- [ ] `scripts/check-deleted-components.sh` — grep-based CI gate asserting zero references to deleted components/routes/shims

---

## Manual-Only Verifications

| Behavior                                                                       | Requirement | Why Manual                                                                                                                                               | Test Instructions                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hue slider thumb visually reverses correctly under `dir="rtl"`                 | D-06 / SC-4 | React Aria + HeroUI v3 Slider RTL thumb behavior not guaranteed via snapshot; requires visual confirmation                                               | 1. Open Tweaks drawer in Arabic locale. 2. Drag hue slider. 3. Confirm thumb moves from inline-start to inline-end in reading direction. 4. Confirm swatches row follows Arabic reading order (first swatch at right). |
| Drawer opens from the correct physical edge in both locales                    | SC-4        | HeroUI v3 `placement` is PHYSICAL (per RESEARCH.md Pattern 1) — needs dynamic `isRTL ? 'left' : 'right'` wiring; visual confirmation prevents regression | 1. EN: confirm drawer slides from right (physical). 2. AR: confirm drawer slides from left (physical = inline-end in RTL). 3. Confirm both locales' drawer is anchored to inline-end.                                  |
| No visible flash of wrong direction/theme/classification chrome on first paint | D-14        | Bootstrap runs pre-paint but visual confirmation matters                                                                                                 | 1. Hard-reload app with `id.dir=situation, id.theme=dark, id.classif=true`. 2. Confirm no flash of light/chancery paint or missing classification chrome.                                                              |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (8 scaffold files listed above)
- [ ] No watch-mode flags in automated commands
- [ ] Feedback latency < 90s (E2E upper bound)
- [ ] `nyquist_compliant: true` set in frontmatter once all scaffolds exist and sign-off is complete

**Approval:** pending
