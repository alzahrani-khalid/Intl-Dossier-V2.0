# Phase 50: Test Infrastructure Repair - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 50-test-infrastructure-repair
**Areas discussed:** Audit scope + backend handling, Mock factory strategy, Wizard fix-up depth, CI gate + docs depth

---

## Audit scope + backend handling

### Question 1: FE audit ambition after mock fix

| Option                                    | Description                                                                                      | Selected |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| Module-eval only                          | Fix or queue any test file that crashes at import; runtime/assertion drift queued                |          |
| Module-eval + setup cascade (Recommended) | Module-eval + anything still red after the mock fix tracing to a setup gap; product drift queued |          |
| Full green                                | All 218 frontend failures triaged to green or queued with rationale; largest scope               | ✓        |

**User's choice:** Full green
**Notes:** User pushed past the recommended option, accepting the larger scope. Drives D-01.

### Question 2: Backend handling

| Option                                     | Description                                                                                   | Selected |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- | -------- |
| Audit + global supabase mock (Recommended) | Mock `supabaseAdmin` globally; fix module-eval + connection cascade; integration tests opt-in |          |
| Audit + skip-marker queue                  | Inventory all; `.skip` connection-dependent tests; module-eval only fixed                     |          |
| Audit-only, queue all fixes                | Inventory only; backend stays red; all fixes deferred to v6.4                                 |          |
| Full green backend too                     | Mirror frontend full-green; mock + fix every backend failure                                  | ✓        |

**User's choice:** Full green backend too
**Notes:** User again pushed past the recommended option. Consistency with FE decision. Drives D-02.

### Question 3: Integration tests fit

| Option                                                     | Description                                                   | Selected |
| ---------------------------------------------------------- | ------------------------------------------------------------- | -------- |
| Split runner: unit green, integration opt-in (Recommended) | `pnpm test` = unit (mocked); `pnpm test:integration` = opt-in | ✓        |
| Stay in default runner, skip when service absent           | Auto-skip when dependency unreachable                         |          |
| Bring real services up in test boot                        | Docker Compose + real services before `pnpm test`             |          |

**User's choice:** Split runner: unit green, integration opt-in (Recommended)
**Notes:** Drives D-03.

### Question 4: Audit inventory form

| Option                                             | Description                                                 | Selected |
| -------------------------------------------------- | ----------------------------------------------------------- | -------- |
| TEST-AUDIT.md committed to phase dir (Recommended) | Single `50-TEST-AUDIT.md` with classification + disposition | ✓        |
| Inline in 50-SUMMARY.md                            | Audit section inside final SUMMARY                          |          |
| Per-plan inventories                               | Each plan owns inventory for its slice                      |          |

**User's choice:** TEST-AUDIT.md committed to phase dir (Recommended)
**Notes:** Drives D-04.

---

## Mock factory strategy

### Question 1: FE react-i18next mock shape

| Option                                                 | Description                                                | Selected |
| ------------------------------------------------------ | ---------------------------------------------------------- | -------- |
| importActual spread + selective override (Recommended) | `vi.importActual`, spread, override useTranslation + Trans | ✓        |
| Hand-rolled mock, add exports as discovered            | Add `initReactI18next` now, patch ad hoc                   |          |
| Drop global mock, use real i18n                        | Call `i18n.init()` in setup.ts                             |          |

**User's choice:** importActual spread + selective override (Recommended)
**Notes:** Drives D-05. Future-proof: any future consumer of any `react-i18next` export works without setup edits.

### Question 2: t() unknown-key behavior

| Option                                          | Description                                                                | Selected |
| ----------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| Return key as English text (Recommended)        | Preserve after-action translations map; unknown keys return the key string | ✓        |
| Drop the per-key map, return key always         | Tests update to assert on keys                                             |          |
| Load full English bundle from frontend/src/i18n | Real translations; key-based assertions break                              |          |

**User's choice:** Return key as English text (Recommended)
**Notes:** Drives D-06. Avoids mass test-assertion rewrite.

### Question 3: BE supabaseAdmin mock

| Option                                                  | Description                                                                  | Selected |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| Manual stub object with chainable .from() (Recommended) | Hand-rolled chainable returning `{data:null,error:null}`; per-test overrides | ✓        |
| msw-style query interceptor                             | MSW for Supabase REST URLs                                                   |          |
| Lightweight in-memory fake (library)                    | External dep e.g. `mock-supabase`                                            |          |

**User's choice:** Manual stub object with chainable .from() (Recommended)
**Notes:** Drives D-07. Mirrors the proven react-i18next pattern.

### Question 4: BE other deps (Redis, BullMQ, LLM)

| Option                                             | Description                                                     | Selected |
| -------------------------------------------------- | --------------------------------------------------------------- | -------- |
| Yes, mock all external deps globally (Recommended) | Global stubs for ioredis, BullMQ, LLM in backend/tests/setup.ts | ✓        |
| Mock only Supabase; tests own Redis/LLM            | Per-test setup; more boilerplate                                |          |
| Real Redis via docker-compose                      | Heavier dev-env requirement                                     |          |

**User's choice:** Yes, mock all external deps globally (Recommended)
**Notes:** Drives D-08. Unit suite has zero outbound network calls post-Phase-50.

---

## Wizard fix-up depth

### Question 1: Assertion-drift inclusion

| Option                                                          | Description                                          | Selected |
| --------------------------------------------------------------- | ---------------------------------------------------- | -------- |
| Yes — 'full green' includes assertion drift fixes (Recommended) | Phase 50 owns root-cause for any wizard test failure | ✓        |
| Mock-cascade only; queue product drift as v6.4                  | Tight scope; conflicts with area-1 full-green        |          |
| Fix wizards only; queue non-wizard product drift                | Hybrid policy                                        |          |

**User's choice:** Yes — 'full green' includes assertion drift fixes (Recommended)
**Notes:** Drives D-09. Consistent with full-green decision in area 1.

### Question 2: Drift fix direction

| Option                                                       | Description                                       | Selected |
| ------------------------------------------------------------ | ------------------------------------------------- | -------- |
| Investigate per case; fix wherever truth lives (Recommended) | git blame both sides; fix the side that regressed | ✓        |
| Always fix the test to match current behavior                | Fast; risks rubber-stamping regressions           |          |
| Always fix the code to match the test                        | Slow; high blast radius                           |          |

**User's choice:** Investigate per case; fix wherever truth lives (Recommended)
**Notes:** Drives D-10. Test name treated as contract spec.

### Question 3: Test text contract (key vs English)

| Option                                                 | Description                                    | Selected |
| ------------------------------------------------------ | ---------------------------------------------- | -------- |
| Mixed allowed; convert opportunistically (Recommended) | Existing tests stay; new ones prefer key-based | ✓        |
| Standardize on key-based assertions                    | Mass rewrite                                   |          |
| Standardize on English text via real bundle            | Conflicts with D-06                            |          |

**User's choice:** Mixed allowed; convert opportunistically (Recommended)
**Notes:** Drives D-11.

### Question 4: Playwright visual baselines in scope

| Option                                            | Description                                                                               | Selected |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| Vitest only; Playwright stays as-is (Recommended) | Phase 50 = `pnpm test` only; Playwright owned by Phase 52 baselines + future visual phase | ✓        |
| Vitest + Playwright run green                     | Larger scope; needs baseline-regen review                                                 |          |
| Vitest + audit Playwright (no fixes)              | Inventory only                                                                            |          |

**User's choice:** Vitest only; Playwright stays as-is (Recommended)
**Notes:** Drives D-12.

---

## CI gate + docs depth

### Question 1: Vitest as PR-blocking context?

| Option                                              | Description                                            | Selected |
| --------------------------------------------------- | ------------------------------------------------------ | -------- |
| Yes — PR-blocking on `Tests (vitest)` (Recommended) | Required status check post-green; mirrors v6.2 pattern | ✓        |
| Advisory only                                       | Tests run on PR but don't block                        |          |
| Defer to Phase 51 or later                          | Ship green tests; defer gate                           |          |

**User's choice:** Yes — PR-blocking on `Tests (vitest)` (Recommended)
**Notes:** Drives D-13 first half.

### Question 2: Gate granularity

| Option                                                    | Description                                                        | Selected |
| --------------------------------------------------------- | ------------------------------------------------------------------ | -------- |
| Two: `Tests (frontend)` + `Tests (backend)` (Recommended) | Per-workspace checks; parallel CI; matches type-check/lint pattern | ✓        |
| One: `Tests (vitest)` runs both                           | Single check; mixed failure surface                                |          |
| Three: FE unit + BE unit + integration (advisory)         | Integration advisory-only                                          |          |

**User's choice:** Two: `Tests (frontend)` + `Tests (backend)` (Recommended)
**Notes:** Drives D-13 second half. Integration runner stays advisory (covered in D-13 commentary).

### Question 3: test-setup.md depth

| Option                                                                                       | Description                         | Selected |
| -------------------------------------------------------------------------------------------- | ----------------------------------- | -------- |
| Full setup contract — mock factories, pitfalls, fixture patterns, runner split (Recommended) | Comprehensive contributor reference | ✓        |
| Short reference — i18n mock contract only                                                    | Minimum for TEST-04                 |          |
| Split: frontend + backend docs                                                               | Per-workspace ownership             |          |

**User's choice:** Full setup contract — mock factories, pitfalls, fixture patterns, runner split (Recommended)
**Notes:** Drives D-14. Backend gets a short pointer-doc; FE doc is the canonical reference.

### Question 4: Beyond-CI enforcement

| Option                                                   | Description                             | Selected |
| -------------------------------------------------------- | --------------------------------------- | -------- |
| Add `vi-mock-exports-required` ESLint rule (Recommended) | Lint-time catch of factory-omits-export | ✓        |
| Pre-commit hook runs vitest on changed test files        | Slower commits; local catch             |          |
| Docs + CI gate only                                      | Trust gate + docs                       |          |

**User's choice:** Add `vi-mock-exports-required` ESLint rule (Recommended)
**Notes:** Drives D-15. Rides on the existing Lint PR-blocking gate; no new CI context needed.

---

## Claude's Discretion

- Plan slicing (number of plans, scope per plan) — planner.
- Order of workspaces (FE-first vs BE-first) — executor wave layout decision.
- Naming of the integration runner command (`pnpm test:integration` vs alternatives) — planner; document in `frontend/docs/test-setup.md`.
- Whether D-15 lands as a local ESLint plugin under `tools/eslint-plugin-intl-dossier/` or inline in `eslint.config.mjs` — planner.
- Per-failure commit granularity inside a plan — executor.

## Deferred Ideas

- Real Supabase / Redis / LLM in default `pnpm test` — split-runner instead (D-03). Promotion to default needs its own phase.
- 80%+ coverage uplift — out of scope; hold current thresholds.
- Backend integration rewrite around a shadow DB — future hardening milestone.
- Snapshot test policy review — queue under audit doc rows if relevant.
- Pre-commit `vitest related` hook — rejected in favor of D-13 + D-15.
- `Tests (integration)` promotion to PR-blocking — advisory-only per D-13; re-evaluate once integration suite proves stable.
