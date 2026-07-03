---
phase: 79
slug: aceternity-removal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-03
---

# Phase 79 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `79-RESEARCH.md` § Validation Architecture (research date 2026-07-03).

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 4.1.7 (jsdom) + jest-axe 10 + @testing-library/react 16 / user-event 14; Playwright 1.60 + @axe-core/playwright 4.11 (optional real-browser layer, non-gating) |
| **Config file**        | `frontend/vitest.config.ts` (setup `frontend/tests/setup.ts`); `frontend/playwright.config.ts`                                                                        |
| **Quick run command**  | `pnpm --dir frontend vitest run src/components/forms/__tests__/SearchableSelect.a11y.test.tsx`                                                                        |
| **Full suite command** | `pnpm --dir frontend vitest run && pnpm --dir frontend lint --max-warnings 0 && pnpm --dir frontend exec tsc --noEmit`                                                |
| **Estimated runtime**  | ~20 s (targeted a11y file) / ~2–4 min (full suite)                                                                                                                    |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --dir frontend vitest run src/components/forms/__tests__/SearchableSelect.a11y.test.tsx` + `pnpm --dir frontend exec tsc --noEmit`
- **After every plan wave:** Run full vitest suite + whole-repo `lint --max-warnings 0` + the ACET-02 grep battery
- **Before `/gsd:verify-work`:** Full suite green **and** `cd frontend && pnpm build && pnpm exec size-limit` green (Bundle Size Check is a REQUIRED CI gate — expected to shrink, must not regress)
- **Max feedback latency:** ~20 seconds (targeted a11y file)

---

## Per-Task Verification Map

> Task IDs bind to these rows at plan time (planner assigns `79-NN-MM`). Rows are keyed by requirement/criterion from `79-RESEARCH.md` § Phase Requirements → Test Map.

| Criterion | Req       | Behavior                                                                                                                                         | Threat Ref                   | Test Type                                              | Automated Command                                                                                                      | File Exists           |
| --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------- |
| C1        | ACET-01   | Rebuilt SearchableSelect announces errors via `role="alert"` in EN **and** AR (resolved-string `error` prop; AR literal + `dir="rtl"`)           | —                            | unit (jsdom, en/ar `it.each`)                          | `… vitest run …/SearchableSelect.a11y.test.tsx -t 'role="alert"'`                                                      | ❌ W0                 |
| C2a       | ACET-01   | Keyboard focus order preserved: open → search input focused → arrows → Enter selects → Escape returns focus to trigger                           | —                            | unit (real cmdk/Popover + user-event, jsdom polyfills) | `… vitest run …/SearchableSelect.a11y.test.tsx -t 'keyboard'`                                                          | ❌ W0                 |
| C2b       | ACET-01   | Full 12-attribute ARIA contract incl. `aria-invalid`/`aria-describedby`; zero serious/critical axe violations (closed/open/error/selected)       | T-79-01 (nested-interactive) | unit (jest-axe + explicit attribute assertions)        | `… vitest run …/SearchableSelect.a11y.test.tsx -t 'axe'`                                                               | ❌ W0                 |
| —         | ACET-01   | 7 dead components + barrel entries + orphan `useFieldValidation` deleted; no external importer breaks                                            | —                            | typecheck + whole-repo lint + full unit suite          | `pnpm --dir frontend exec tsc --noEmit && pnpm --dir frontend lint --max-warnings 0 && pnpm --dir frontend vitest run` | ✅ existing           |
| —         | ACET-01   | `UserPicker` public API + module path unchanged                                                                                                  | —                            | unit (existing `CreateTaskCtas.test.tsx`)              | `… vitest run src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx`                                       | ✅                    |
| —         | ACET-02   | `@aceternity-pro` registry entry removed; inverted `no-restricted-imports` ban green; 0 repo-wide `aceternity`/`variant="aceternity"` references | —                            | grep battery + `lint --max-warnings 0`                 | ACET-02 grep script (inline in RESEARCH § Fully-gone)                                                                  | ✅ inline             |
| —         | cross-cut | Bundle size-limit budgets not regressed (expected reduced)                                                                                       | —                            | build + size-limit                                     | `cd frontend && pnpm build && pnpm exec size-limit`                                                                    | ✅ `.size-limit.json` |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/forms/__tests__/SearchableSelect.a11y.test.tsx` — covers ACET-01 criteria C1, C2a, C2b (skeleton + jsdom polyfills in RESEARCH § Code Examples). **Sequencing:** write it against the CURRENT component first (should already pass except possibly the axe nested-interactive case), THEN perform the rebuild and keep it green — this proves _preserved_, not merely _present_.
- [ ] No framework install needed. No fixtures beyond inline option arrays (+ a `@/lib/supabase` module mock only if the optional thin UserPicker facade test is added).

---

## Manual-Only Verifications

| Behavior                                          | Requirement | Why Manual                                                                                                               | Test Instructions                                                                                                                                                                                                                                 |
| ------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Escape-returns-focus-to-trigger in a real browser | ACET-01 C2a | cmdk keyboard flow in jsdom is new to this repo (research A3, MEDIUM-HIGH); real-browser confirmation is higher-fidelity | Optional Playwright smoke: TaskEditDialog assignee picker keyboard pass + `@axe-core/playwright` scan, following `qa-sweep-axe.spec.ts`. **Non-gating** — the e2e workflow is non-required and targets a running app; it must NOT be the CI gate. |

_All CI-gating phase behaviors have automated (vitest/jest-axe/lint/size-limit) verification._

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (the a11y test file)
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
