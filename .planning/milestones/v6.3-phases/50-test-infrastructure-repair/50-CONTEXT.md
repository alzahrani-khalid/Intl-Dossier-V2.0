# Phase 50: Test Infrastructure Repair - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Restore module-evaluation success and full-green status for the workspace test suites (`pnpm test` in `frontend` and `backend`) so v6.3+ phases can rely on tests as a quality gate. Includes:

- Fixing the `vi.mock('react-i18next')` factory gap in `frontend/tests/setup.ts:6` (TEST-01).
- Driving both workspaces to a green `pnpm test` (TEST-02 reframed: "4 wizard tests" was the original audit count; full-run reality is 218 frontend test files failing + 207 backend test files failing).
- Producing a single classified audit artifact covering both workspaces (TEST-03).
- Documenting the test-setup contract so this regression class can't recur (TEST-04).

**Out of phase boundary (do NOT attempt in Phase 50):**

- Playwright / visual baseline regen (owned by Phase 52 KANBAN-04 and future visual phases).
- Reintroducing real Supabase / Redis / LLM dependencies into the default `pnpm test` runner — those move to an opt-in `pnpm test:integration` runner.
- New product features beyond fixing genuine regressions surfaced while restoring green.
- ESLint design-token gate (Phase 51).
- Kanban migration (Phase 52).

</domain>

<decisions>
## Implementation Decisions

### Audit scope + workspace handling

- **D-01 (Frontend full green):** Phase 50 ends when `pnpm --filter frontend test` exits 0. All 218 currently-failing frontend test files are triaged to green or queued with rationale in `50-TEST-AUDIT.md`. Module-eval failures, setup-cascade failures, fixture drift, and product-regression failures are all in scope.
- **D-02 (Backend full green):** Phase 50 ends when `pnpm --filter backend test` exits 0. All 207 currently-failing backend test files are triaged to green or queued with rationale. `backend/tests/setup.ts` is rewritten to add global mocks for every external dependency the unit suite touches.
- **D-03 (Integration tests split out):** Tests that genuinely require a real Supabase / Redis / LLM move behind a new `pnpm test:integration` command (vitest project or filename convention — planner decides shape). Default `pnpm test` runs ONLY mocked unit/component tests and must exit 0 on a clean checkout with no services running.
- **D-04 (Audit artifact):** A single new file `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md` enumerates every failing test at phase start, with columns: workspace, file, failure class (module-eval / setup-gap / fixture-drift / product-regression / integration-only), disposition (fixed-in-phase / split-to-integration / queued-with-rationale), and (if queued) the rationale + ticket reference. This is the verification anchor for TEST-03.

### Mock factory strategy

- **D-05 (Frontend react-i18next mock):** Rewrite `frontend/tests/setup.ts:6` factory to use `await vi.importActual<typeof import('react-i18next')>('react-i18next')`, spread the real module, then override ONLY `useTranslation` and `Trans` with the existing stubs. This preserves every export (`initReactI18next`, `I18nextProvider`, `withTranslation`, `Translation`, etc.) with real semantics — future consumers won't trip the same trap.
- **D-06 (t() fallback):** `useTranslation().t` keeps today's behavior: look up the key in the existing inline after-action translations map; for any unknown key, return the key string itself (`(key) => translations[key] ?? key`). No real EN bundle import. No mass test-assertion rewrite.
- **D-07 (Backend supabaseAdmin mock):** Add a global `vi.mock('@/config/supabase', ...)` (or equivalent path) in `backend/tests/setup.ts`. Default returns a chainable `from()` builder where every terminal (`.single()`, `.maybeSingle()`, `.select()` resolution, `.insert/.update/.delete/.upsert`) resolves to `{ data: null, error: null }`. Per-test refinement uses `vi.mocked(supabaseAdmin.from).mockReturnValue(...)` or `vi.mocked(supabaseAdmin.rpc).mockResolvedValue(...)`. Real Supabase calls in unit tests are forbidden post-Phase-50.
- **D-08 (Backend other-deps mocks):** Same global-mock treatment in `backend/tests/setup.ts` for:
  - `ioredis` (in-memory Map-backed stub for `get/set/del/exists/expire/incr`),
  - `bullmq` (`Queue`, `Worker`, `QueueEvents` as `vi.fn()` factories returning chainable mocks),
  - LLM clients (`AnythingLLM`, OpenAI SDK if used) — return canned response shape sufficient for the call site.
    The contract: unit suite makes ZERO outbound network calls. If a test needs real services, it belongs in `pnpm test:integration` (per D-03).

### Wizard fix-up depth

- **D-09 (Root-cause fixes allowed):** "Full green" extends to fixing genuine product/hook regressions surfaced by tests — e.g., `useCountryAutoFill` returning `undefined` for `iso_code_2` when the reference data lookup table drifted. Plans MAY edit `frontend/src/components/dossier/wizard/hooks/*` and similar product files when the test was correct and the impl drifted.
- **D-10 (Drift policy — investigate per case):** For each test failing on an assertion mismatch, do `git log -p` on both the asserting line AND the impl under test to determine which side regressed, then fix that side. The test name is treated as the contract spec; deviate only with an explicit rationale row in `50-TEST-AUDIT.md`.
- **D-11 (Mixed assertion-text contract):** Some tests assert on i18n keys (`'wizard.country.title'`); others assert on English strings (`'Decisions'`). Both remain valid; the `t() => key` fallback (D-06) supports both. Convert a test from English-string to key-based ONLY when already editing that test file for another reason. No bulk-rewrite-for-consistency sweep.
- **D-12 (Playwright out of scope):** `playwright` and visual-baseline specs are NOT in Phase 50 scope. Any Playwright failures get noted in `50-TEST-AUDIT.md` under `disposition: queued-out-of-scope` with pointer to Phase 52 (kanban baselines) or a future visual-baseline phase. `pnpm test:visual` / Playwright commands remain untouched.

### CI gate + documentation

- **D-13 (Two PR-blocking contexts):** Once both workspaces are green, register `Tests (frontend)` and `Tests (backend)` as REQUIRED status checks on `main` via branch protection (Supabase / GitHub MCP). Mirrors the LINT-09 / TYPE-01 / BUNDLE-04 enforcement pattern from v6.2. Integration runner (`Tests (integration)`) registered as advisory-only, NOT blocking.
- **D-14 (Full setup contract docs):** `frontend/docs/test-setup.md` is a comprehensive contributor reference: (1) test runner architecture (vitest config, jsdom env, MSW), (2) the `react-i18next` mock contract + `initReactI18next` precedent + why `importActual` + override is the pattern, (3) how to mock other modules safely (the supabase/Redis/BullMQ/LLM recipes from D-07/08 included as canonical examples), (4) unit-vs-integration runner split (D-03 explained), (5) common pitfalls (factory-omits-export, lazy circular imports, fixture drift, snapshot drift), (6) fixture patterns. Backend follows-up with a short `backend/docs/test-setup.md` pointing back at the FE doc for shared concepts and documenting only backend-specific recipes (mocking `supabaseAdmin` chain, BullMQ `Queue/Worker`, env-var contract).
- **D-15 (ESLint enforcement rule):** Add a custom ESLint rule (project-local plugin or `eslint-plugin-vitest` config) named `vi-mock-exports-required` that statically analyzes any `vi.mock('<module-id>', factory)` call. If the resolved module declares exports not present in the factory's return object, flag it. Caveat: when the factory starts with `await vi.importActual(<id>)` and spreads the result, the rule exits clean (D-05 pattern passes). Rule added to the root `eslint.config.mjs` and runs under the existing `Lint` PR-blocking context (no new CI gate needed for this rule). Implementation: planner may choose the cheapest viable path — single AST rule, or stricter `vi.mock` arity check that requires `importActual` spread for any factory with 1+ explicit overrides.

### Claude's Discretion

- Plan slicing (how many plans, what each owns) — planner decides.
- Order of workspaces (FE first or BE first) — executor wave layout decision; FE blockers are smaller and may unlock backend triage faster, but planner has discretion.
- Whether to land per-failure fixes as separate commits inside a single plan or batch them — executor judgment.
- Naming of the integration runner (`pnpm test:integration` vs `pnpm test:e2e-services` vs vitest project name) — planner decides, document choice in `frontend/docs/test-setup.md` (D-14).
- Whether the custom ESLint rule (D-15) becomes a local plugin under `tools/eslint-plugin-intl-dossier/` or inline in `eslint.config.mjs` — planner decides based on rule complexity.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope + requirements

- `.planning/REQUIREMENTS.md` §Test infrastructure (TEST) — TEST-01..04 source-of-truth
- `.planning/ROADMAP.md` §Phase 50 — goal + 4 success criteria
- `.planning/milestones/v6.2-MILESTONE-AUDIT.md` §tech_debt.phase-48 — original "4 wizard tests" + `initReactI18next` finding; pre-existing test-infra debt context

### Test infrastructure files (current state — must read before editing)

- `frontend/tests/setup.ts` — site of the `vi.mock('react-i18next')` factory gap (line 6); current after-action translation map
- `frontend/tests/mocks/server.ts` — MSW server (do not delete; integration handler convention)
- `frontend/vitest.config.ts` — test runner config (jsdom env, setupFiles, coverage thresholds)
- `backend/tests/setup.ts` — NO global external-dep mocks today; expand per D-07/08
- `backend/vitest.config.ts` — node env, fork pool, 30s testTimeout

### Patterns already in repo

- `.planning/codebase/TESTING.md` — testing conventions baseline (mock setup, fixtures, coverage, test types)
- `frontend/src/i18n/index.ts` — real `initReactI18next` consumer (the export downstream consumers expect)
- `eslint.config.mjs` (root) — single source of truth for lint rules; site for D-15 `vi-mock-exports-required` rule
- `.github/workflows/*` — existing PR-blocking CI gates (type-check / lint / size-limit) — pattern to mirror for `Tests (frontend)` / `Tests (backend)` registration

### v6.2 precedent (gate registration mechanics)

- `.planning/milestones/v6.0-ROADMAP.md` (PASS-WITH-DEVIATION pattern for visual baselines) — only consult if planner needs prior context on multi-workspace test deviations
- `.planning/milestones/v6.2-ROADMAP.md` §47..49 — gate registration mechanics for type-check / lint / bundle-size (mirror for `Tests (frontend)` + `Tests (backend)`)

### Wizard hook regressions (representative)

- `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts` — implementation under test
- `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts` — failing assertions (lines 77, 78, 79, 108) — D-10 investigation target

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `vi.importActual<T>(moduleName)` — vitest built-in; pattern already used elsewhere in the monorepo (search before authoring D-05 fix).
- MSW server in `frontend/tests/mocks/server.ts` — already wired in `frontend/tests/setup.ts:84` (`server.listen({ onUnhandledRequest: 'error' })`). Existing handler conventions extend cleanly when integration tests get split out (D-03).
- Frontend test factory function `(key, params) => translations[key] ?? key` — pattern proven; keep verbatim under D-06.
- Backend `vitest.config.ts` already uses `pool: 'forks'` + 30s `testTimeout` — good fit for the global-mock approach (D-07/08); no config rewrite needed.

### Established Patterns

- Co-located `__tests__/` directories per `TESTING.md`. New tests authored in Phase 50 follow this; audit doc references existing failing paths verbatim.
- Global mock + per-test override layering — already used for `react-i18next`; D-07/08 reuse the pattern for backend external deps.
- 80% line / 80% function / 75% branch coverage thresholds in `frontend/vitest.config.ts`. Phase 50 must not regress these — `pnpm test:coverage` should stay green.
- ESLint flat config in `eslint.config.mjs` (root) with workspace-level overrides — D-15 adds rule at root level.
- PR-blocking status check naming convention: `<Capability> (<workspace>)` e.g. `Type-Check (frontend)`. Use `Tests (frontend)` + `Tests (backend)` for D-13 to match.

### Integration Points

- D-13 wiring: branch protection update on `main` via GitHub MCP (`gh api`) — same mechanism that registered LINT/TYPE/BUNDLE gates in v6.2.
- D-15 ESLint rule sits inside the existing `Lint` PR-blocking context — no new gate registration needed.
- The split runner (D-03) likely lands as a new top-level script in `package.json` (`"test:integration": "..."`) and either: (a) a separate `vitest.integration.config.ts`, or (b) a vitest `projects` array distinguishing units from integration by glob (e.g., `*.integration.test.ts`). Planner picks; document in D-14 docs.

</code_context>

<specifics>
## Specific Ideas

- The `initReactI18next` cascade is the canonical example used throughout `frontend/docs/test-setup.md` (D-14). Other mock-factory contracts (supabase/Redis/BullMQ/LLM) reference this precedent.
- `50-TEST-AUDIT.md` (D-04) is the source-of-truth for verification — verifier checks every row's `disposition` resolved correctly before TEST-03 is marked Satisfied.
- The "Phase 50 success criterion #1 names line 6" — yes, but the factory rewrite likely changes line count. Acceptance is that `frontend/tests/setup.ts` exports a `react-i18next` mock that includes a working `initReactI18next`, not that line 6 specifically holds the symbol.

</specifics>

<deferred>
## Deferred Ideas

- **Real Supabase / Redis / LLM in default `pnpm test`** — pushed to integration runner. If a future milestone wants `pnpm test` to exercise real services, it needs its own phase (Docker Compose bring-up, test-data seeding contract, parallel CI shard, etc.).
- **80%+ coverage push beyond current thresholds** — Phase 50 holds the line at current thresholds. Coverage uplift is a separate concern.
- **Backend integration test rewrite around a real local Supabase shadow DB** — discussed implicitly; out of v6.3. Belongs in a future hardening milestone if integration tests grow.
- **Snapshot test policy review** — surfacing during the audit but out of scope; queue with rationale if relevant rows appear in `50-TEST-AUDIT.md`.
- **Pre-commit hook running `vitest related <changed-files>`** — considered as an enforcement mechanism (Area 4); rejected in favor of D-15 (lint-time check) + D-13 (CI gate). Re-evaluate if D-15 proves insufficient.
- **`Tests (integration)` becomes PR-blocking** — advisory-only per D-13; promote to blocking only after the integration suite proves stable and dev-env standardized.

</deferred>

---

_Phase: 50-Test-Infrastructure-Repair_
_Context gathered: 2026-05-13_
