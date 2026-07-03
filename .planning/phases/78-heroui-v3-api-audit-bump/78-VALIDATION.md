---
phase: 78
slug: heroui-v3-api-audit-bump
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-03
---

# Phase 78 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `78-RESEARCH.md` → "Validation Architecture". This is a light,
> no-visual-change dependency bump: the real regression oracle is the toggle
> composition change (v3.2.0 `*.Content`) in `heroui-forms.tsx`, plus Drawer
> behaviour on the externalized react-aria, NOT tsc alone.

---

## Test Infrastructure

| Property               | Value                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (unit, jsdom) + Playwright (E2E) + `size-limit` (bundle budgets)                                                                                  |
| **Config file**        | `frontend/vitest.*.config.ts`, `frontend/playwright.config.ts`, `frontend/.size-limit.json`                                                              |
| **Quick run command**  | `pnpm --dir frontend type-check`                                                                                                                         |
| **Full suite command** | `pnpm --dir frontend type-check && pnpm --dir frontend build && pnpm --dir frontend size && pnpm --dir frontend test run ConcurrentDrawers heroui-forms` |
| **Estimated runtime**  | ~90–150 seconds (build dominates)                                                                                                                        |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --dir frontend type-check` (the pre-commit hook additionally builds)
- **After every plan wave:** Run the quick vitest oracle (`ConcurrentDrawers`, migrated-toggles test) + the Phase 75 protocol re-run and diff vs `75-AUDIT-heroui-confirmation.md`
- **Before `/gsd:verify-work`:** Full suite green (type-check + build + size-limit) AND EN/AR drawer smoke recorded
- **Max feedback latency:** ~150 seconds

---

## Per-Task Verification Map

Task IDs are assigned during planning; rows below bind each phase behaviour to its
automated oracle so the planner can attach the matching `<automated>` verify to the
task that delivers it.

| Behaviour                                                                            | Plan (expected) | Requirement | Threat Ref                                                          | Secure Behavior                                                 | Test Type | Automated Command                                                                           | File Exists               | Status     |
| ------------------------------------------------------------------------------------ | --------------- | ----------- | ------------------------------------------------------------------- | --------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------- | ------------------------- | ---------- |
| Lockfile resolves BOTH `@heroui/react` + `@heroui/styles` to 3.2.1, no 3.0.5 remnant | 01 (bump)       | HEROUI-01   | T-78-01 (supply-chain: pinned coupled versions, lockfile integrity) | Only audited 3.2.1 resolves; no unexpected transitive downgrade | script    | `grep -E "@heroui/(react\|styles)@" frontend/pnpm-lock.yaml` → only `@3.2.1`                | ✅ (lockfile)             | ⬜ pending |
| Tree compiles against 3.2.1 typings                                                  | 01 (bump)       | HEROUI-01   | —                                                                   | N/A                                                             | type      | `pnpm --dir frontend type-check` → exit 0                                                   | ✅                        | ⬜ pending |
| Bundle budgets hold after chunk movement                                             | 01 (bump)       | HEROUI-01   | —                                                                   | N/A                                                             | build     | `pnpm --dir frontend build && pnpm --dir frontend size` → green                             | ✅ (`.size-limit.json`)   | ⬜ pending |
| Drawers mount + focus containment on externalized react-aria                         | 01 (bump)       | HEROUI-01   | —                                                                   | N/A                                                             | unit      | `pnpm --dir frontend test run ConcurrentDrawers`                                            | ✅                        | ⬜ pending |
| Migrated toggles: label-click toggles selection; `*.Content` DOM present             | 02 (toggles)    | HEROUI-02   | —                                                                   | N/A                                                             | unit      | `pnpm --dir frontend test run heroui-forms`                                                 | ❌ W0                     | ⬜ pending |
| Phase 75 protocol re-run output matches records (modulo expected deltas)             | 03 (protocol)   | HEROUI-02   | —                                                                   | N/A                                                             | script    | 4 protocol commands, diff vs `75-AUDIT-heroui-confirmation.md`                              | ✅ (commands recorded)    | ⬜ pending |
| Key HeroUI routes render, EN + AR, zero console errors                               | 04 (sweep)      | HEROUI-01   | —                                                                   | N/A                                                             | smoke     | browser-harness headless Chrome: dashboard + AppShell drawer + TweaksDrawer, then `?lng=ar` | ❌ W0 (session procedure) | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/ui/heroui-forms.test.tsx` (or colocated) — renders migrated `HeroUIFormCheckbox` / `HeroUIFormSwitch`, asserts label-click toggles selection and the `*.Content` composition DOM is present. This is HEROUI-02's real oracle (tsc is blind to it).
- [ ] EN/AR drawer smoke procedure (browser-harness headless Chrome) — no committed spec required for a light phase; record output in the verification artifact.
- [ ] Existing infrastructure (`ConcurrentDrawers.test.tsx`, `type-check`, `build`, `size`) covers the remaining phase behaviours — no new framework install needed.

---

## Manual-Only Verifications

| Behavior                                        | Requirement | Why Manual                                                                                              | Test Instructions                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EN + AR route render sweep, zero console errors | HEROUI-01   | Visual/console smoke across live routes; full formal re-compare is Phase 80's job, not this light phase | browser-harness dedicated headless Chrome (:9222 pattern per MEMORY): load dashboard + a route mounting AppShell drawer + TweaksDrawer in EN; re-check with `?lng=ar`; assert no console errors and Tajawal applies in AR. Pre-record the expected Drawer thin-scrollbar delta (styles 3.2.1) so it is NOT flagged as a regression. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`heroui-forms.test.tsx`, EN/AR smoke procedure)
- [ ] No watch-mode flags
- [ ] Feedback latency < 150s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
