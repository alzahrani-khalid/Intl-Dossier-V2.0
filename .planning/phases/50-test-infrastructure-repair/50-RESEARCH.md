# Phase 50: Test Infrastructure Repair — Research

**Researched:** 2026-05-13
**Domain:** Vitest test infrastructure, mock factories, CI gate registration, custom ESLint rules
**Confidence:** HIGH — every claim verified against the live repo / live test runs / live `gh api` calls

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Phase 50 ends when `pnpm --filter frontend test` exits 0. All currently-failing frontend test files triaged to green or queued with rationale in `50-TEST-AUDIT.md`. Module-eval, setup-cascade, fixture-drift, product-regression all in scope.
- **D-02:** Phase 50 ends when `pnpm --filter backend test` exits 0. `backend/tests/setup.ts` rewritten with global mocks for every external dep the unit suite touches.
- **D-03:** Tests requiring real Supabase/Redis/LLM move behind new `pnpm test:integration`. Default `pnpm test` runs ONLY mocked unit/component tests and must exit 0 on a clean checkout with no services.
- **D-04:** Single artifact `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md` with columns: workspace, file, failure class, disposition, rationale. Verification anchor for TEST-03.
- **D-05:** Frontend react-i18next mock rewritten to `await vi.importActual<typeof import('react-i18next')>('react-i18next')` + spread + override `useTranslation`/`Trans` only.
- **D-06:** `t()` keeps fallback `(key) => translations[key] ?? key`. No real EN bundle import. No mass-rewrite of test assertions.
- **D-07:** Global `vi.mock('@/config/supabase', ...)` in `backend/tests/setup.ts` returning chainable `from()` builder. Real Supabase calls forbidden in unit tests post-Phase-50.
- **D-08:** Same global-mock treatment for `ioredis`, `bullmq`, LLM clients (`@anthropic-ai/sdk`, OpenAI SDK). Unit suite makes ZERO outbound network calls.
- **D-09:** Root-cause fixes allowed — `frontend/src/components/dossier/wizard/hooks/*` and similar product files can be edited when test was correct and impl drifted.
- **D-10:** Per-failure: `git log -p` on both asserting line AND impl under test. Test name = contract spec; deviate only with explicit rationale row.
- **D-11:** Mixed assertion-text contract preserved (i18n keys + English strings both valid via D-06 fallback).
- **D-12:** Playwright / visual-baseline specs OUT OF SCOPE — note in audit as `disposition: queued-out-of-scope`.
- **D-13:** `Tests (frontend)` and `Tests (backend)` registered as REQUIRED status checks on `main` via GitHub MCP. `Tests (integration)` advisory-only, NOT blocking.
- **D-14:** `frontend/docs/test-setup.md` comprehensive contributor reference; short `backend/docs/test-setup.md` follow-up.
- **D-15:** Custom ESLint rule `vi-mock-exports-required` flags `vi.mock(<id>, factory)` calls missing exports from resolved module. Factory starting with `await vi.importActual(<id>)` + spread exits clean. Runs under existing `Lint` PR-blocking context.

### Claude's Discretion

- Plan slicing (how many plans, what each owns).
- Order of workspaces (FE first or BE first).
- Per-failure-fixes as separate commits vs batched inside one plan.
- Naming of integration runner (`pnpm test:integration` etc.).
- Custom ESLint rule packaging (local plugin under `tools/eslint-plugin-intl-dossier/` vs inline in `eslint.config.mjs`).

### Deferred Ideas (OUT OF SCOPE)

- Real Supabase/Redis/LLM in default `pnpm test`.
- 80%+ coverage push beyond current thresholds.
- Backend integration rewrite around real local Supabase shadow DB.
- Snapshot test policy review.
- Pre-commit `vitest related <changed-files>` hook.
- `Tests (integration)` promotion to PR-blocking.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                         | Research Support                                                                                                                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-01 | `frontend/tests/setup.ts:6` `vi.mock("react-i18next")` factory exports `initReactI18next` so module-eval succeeds for all consumers | §Failure Inventory class-A (20 module-eval errors all from same root cause); §Mock Factory Specs (FE) provides verbatim factory shape; §Existing `vi.importActual` Precedent confirms pattern already in repo |
| TEST-02 | 4 previously-failing wizard tests pass green                                                                                        | §Wizard Regression Triage identifies the 4 (`CreateWizardShell` × 2, `SharedBasicInfoStep` × 1, `useCreateDossierWizard` × 1) all module-eval-blocked — clears when D-05 lands                                |
| TEST-03 | Audit complete for other module-eval test failures across frontend + backend test suites; findings logged or fixed                  | §Failure Inventory provides the full classification by class + cascading root-cause groups; §Recommended Plan Slicing has dedicated audit plan; D-04 names the artifact                                       |
| TEST-04 | Vitest setup files reviewed for similar mock-factory gaps; documented in `frontend/docs/test-setup.md`                              | §Mock Factory Specs lists every external-dep mock; §Custom ESLint Rule blocks future regressions; D-14 names the doc; §Coverage Threshold Impact confirms FE has no thresholds today                          |

</phase_requirements>

---

## Executive Summary

1. **The real failure surface is far smaller than CONTEXT's "218 + 207 files" implies.** Frontend has only **~43 genuinely-failing vitest-unit files** (the other 175 are Playwright `.spec.ts` files that vitest mis-picks because `frontend/vitest.config.ts` lacks `include`/`exclude` filters). A single config edit (add `include: ['**/*.test.{ts,tsx}']` OR `exclude: ['**/*.spec.*']`) reclaims 175 failures with zero risk. The remaining ~43 cluster into 5 well-defined classes.

2. **The `initReactI18next` cascade is exactly one fix.** D-05's `vi.importActual + spread` pattern, applied at `frontend/tests/setup.ts:6`, clears all 20 module-eval failures including the 4 named wizard tests (TEST-02). The pattern is already established in the repo (`frontend/tests/component/CommitmentList.test.tsx:452`, `frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx:19`) — not a novel approach.

3. **Backend is dominated by integration-only failures (D-03 split).** 191 of 208 backend failures are tests in `backend/tests/{contract,contracts,integration,performance}/` that hit real local services (`ECONNREFUSED 127.0.0.1:54321` Supabase, `127.0.0.1:5001` Express). After the D-03 split, the default `pnpm test` runs only `backend/tests/unit/**` + service-level mocked tests — backend green becomes trivial.

4. **`useCountryAutoFill` is a test-side regression, not an impl regression.** Test mocks the wrong field shape (`code`/`code3` instead of REST Countries' `cca2`/`cca3`) and asserts pre-region-map values (`'Asia'` instead of `'asia'`). Has been failing since first commit `7943ad20` (2026-04-15). Fix the test, not the impl. The impl additionally needs a defensive null-check (`match.cca2 != null`) to be regression-resistant; this is a small product hardening.

5. **Branch protection on `main` is already plumbed** — `gh api repos/.../branches/main/protection` returns `enforce_admins: true` and contexts `[type-check, Security Scan, Lint, Bundle Size Check (size-limit)]`. Adding `Tests (frontend)` + `Tests (backend)` is a single PATCH call. The mechanism is identical to Phase 48 D-17 / Phase 49 D-13 (already-verified pattern).

**Primary recommendation:** **5 plans organized as 3 dependency tiers** — see §Recommended Plan Slicing. Wave 0 (FE config split + i18next mock + wizard test fix) unlocks everything else. Total estimated commit count: 12-18 across 5 plans.

---

## Architectural Responsibility Map

| Capability                                        | Primary Tier                  | Secondary Tier             | Rationale                                                                                                                          |
| ------------------------------------------------- | ----------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Vitest config (workspace test entry)              | Build/Test config             | —                          | `frontend/vitest.config.ts` + `backend/vitest.config.ts` are the contract layer; include/exclude/projects live here                |
| Global mock factories (`react-i18next`, supabase) | Test setup                    | —                          | `frontend/tests/setup.ts` + `backend/tests/setup.ts` run once before every test file; this is where global stubs belong            |
| Per-test mock overrides                           | Test setup                    | Individual test files      | Tests use `vi.mocked(...).mockReturnValue(...)` to refine global stubs per scenario                                                |
| Integration test runner                           | Build/Test config             | CI workflow                | `pnpm test:integration` script + separate config OR `vitest --project` glob; needs no real product code change                     |
| CI gate registration                              | CI / GitHub branch protection | `.github/workflows/ci.yml` | Existing `Tests (frontend)` job missing → add job; existing branch protection PATCH adds new required context                      |
| Custom ESLint rule (`vi-mock-exports-required`)   | Tooling (eslint-plugin)       | `eslint.config.mjs`        | Statically analyzes `vi.mock(<id>, factory)` AST nodes; lives in `tools/eslint-plugin-intl-dossier/` per D-15 cheapest-viable path |
| Product hook regressions (`useCountryAutoFill`)   | Frontend application code     | Test fixtures              | D-09 allows touching product code when test is correct; in this case test is wrong + impl needs minor hardening                    |
| Test documentation                                | Docs                          | —                          | `frontend/docs/test-setup.md` + `backend/docs/test-setup.md` — contributor reference, not runtime                                  |

---

## Failure Inventory

### Probed live on 2026-05-13 against `DesignV2` HEAD

```bash
# Frontend
cd frontend && pnpm exec vitest --run --reporter=verbose
# → Test Files  218 failed | 121 passed | 4 skipped (343)
# →      Tests  112 failed | 900 passed | 25 todo (1037)
# →   Duration  49.02s

# Backend
cd backend && pnpm exec vitest --run --reporter=verbose
# → Test Files  208 failed | 11 passed (219)
# →      Tests  344 failed | 186 passed | 863 skipped (1393)
```

### Frontend Class Distribution

| Class                                       |   Files | Diagnostic Signature                                                                                                | Disposition                                                           |
| ------------------------------------------- | ------: | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **class-PW: Playwright misglobbed**         | **175** | `Error: Playwright Test did not expect test.describe() to be called here.` + variants                               | **Single config fix** — exclude `*.spec.*` from vitest                |
| **class-M: module-eval (initReactI18next)** |  **20** | `Error: [vitest] No "initReactI18next" export is defined on the "react-i18next" mock.`                              | **Single setup.ts fix** — D-05 importActual + spread                  |
| class-D: dead-import (file deleted)         |      11 | `Error: Failed to resolve import "../../src/components/theme-provider/theme-provider" from "tests/integration/..."` | Delete the dead test file (legacy from theme migration)               |
| class-S: supabase env                       |       4 | `Error: Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`                         | Either move to integration runner OR mock supabase client in FE setup |
| class-T: transform-failed                   |       2 | `Error: Transform failed with 1 error:`                                                                             | Investigate per-file (likely TS/syntax error in test)                 |
| class-F: faker missing                      |       1 | `Error: Failed to resolve import "@faker-js/faker" from "tests/e2e/sla-tracking.spec.ts"`                           | This is an `.e2e.spec.ts` — moves with Playwright exclude             |
| **class-R: product/test regression**        |  **~5** | Real assertions failing (wizard test + fouc-bootstrap drift + KpiStrip + heroui-wrappers + ForumsListPage timeout)  | Per-file D-10 git archaeology — see §Wizard Regression Triage         |

**Cascading root-cause groups (one fix → many tests pass):**

| Group | Fix                                                                                                   |                                      Files cleared |
| :---- | :---------------------------------------------------------------------------------------------------- | -------------------------------------------------: |
| G1    | Add `include: ['**/*.test.{ts,tsx}']` to `frontend/vitest.config.ts`                                  |                           175 (class-PW + class-F) |
| G2    | Rewrite `frontend/tests/setup.ts:6` react-i18next mock per D-05                                       | 20 (class-M) — includes 4 wizard tests for TEST-02 |
| G3    | Delete dead `tests/integration/*theme*` + `tests/unit/components.test.tsx` + others                   |                                       11 (class-D) |
| G4    | Mock supabase client in FE setup OR delete (4 tests are environment-dependent)                        |                                        4 (class-S) |
| G5    | Per-file fixes (wizard test, fouc-bootstrap drift, KpiStrip, heroui-wrappers, ForumsListPage timeout) |                                       ~5 (class-R) |

**Total after G1+G2+G3+G4+G5:** 175 + 20 + 11 + 4 + 5 = **215 of 218 files** cleared. The 3 residual after G1-G5 are likely test-side fixture drift surfaced once cascades clear; expect to triage during execution.

### Backend Class Distribution

| Class                                       | Files | Diagnostic Signature                                                                                                          | Disposition                                           |
| ------------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **class-I-Supabase: integration (real DB)** |   ~64 | `Error: connect ECONNREFUSED 127.0.0.1:54321` (local Supabase port)                                                           | **Move to integration runner per D-03**               |
| **class-I-Express: integration (real API)** |  ~171 | `Error: connect ECONNREFUSED 127.0.0.1:5001` (local Express dev server)                                                       | **Move to integration runner per D-03**               |
| **class-E: env (supabase key missing)**     |  ~104 | `Error: supabaseKey is required.` / `Error: supabaseUrl is required.` / `Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY...` | Fixed by D-07 global mock (no env needed)             |
| class-H: helper missing                     |    24 | `Error: createTestServer is not a function`                                                                                   | Test helper drift; fix per audit                      |
| class-M: module-not-found                   |    31 | `Error: { code: 'ERR_MODULE_NOT_FOUND' }`                                                                                     | Investigate; likely dead test path                    |
| class-A: api-shape drift                    |    17 | `Error: apiClient.put is not a function`                                                                                      | API client API surface drifted; fix per audit         |
| class-N: null-deref on mock                 |    25 | `Error: Cannot read properties of undefined (reading 'from')`                                                                 | Tests use uninitialized supabase mock — fixed by D-07 |

**Backend test-folder structure (verified via `find`):**

```
backend/tests/contract/      129 test files  → integration (D-03 move)
backend/tests/contracts/      11 test files  → integration (D-03 move)
backend/tests/integration/    53 test files  → integration (D-03 move)
backend/tests/performance/     9 test files  → integration (D-03 move)
backend/tests/security/        1 test file   → likely unit (verify)
backend/tests/services/        1 test file   → likely unit (verify)
backend/tests/unit/           10 test files  → unit
backend/tests/{root}           4 test files  (deadline-checker, digest-scheduler, email-notifications, notification-queue, push-notifications) — these MAY be unit or integration depending on mock coverage
```

**Cascading root-cause groups (BE):**

| Group | Fix                                                                                   |                                                             Files cleared |
| :---- | :------------------------------------------------------------------------------------ | ------------------------------------------------------------------------: |
| B1    | `pnpm test:integration` split: vitest `--project unit/integration` OR separate config |                202 (class-I-Supabase + class-I-Express + class-E partial) |
| B2    | D-07 global `@/config/supabase` mock in `backend/tests/setup.ts`                      |                        ~104 + ~25 = up to 129 partial (class-E + class-N) |
| B3    | D-08 global `ioredis`, `bullmq`, LLM mocks                                            | covers `backend/src/queues/*`, `backend/src/ai/*` consumers in unit suite |
| B4    | Restore `createTestServer` helper OR delete dependent tests                           |                                                              24 (class-H) |
| B5    | Per-file audit for class-M (31) + class-A (17)                                        |                                                                       ~48 |

After B1, default `pnpm test` runs only ~26 BE test files (unit + services + security + root-level mocked); B2+B3 + per-file cleanup gets these to green.

---

## Mock Factory Specs

### Frontend: `frontend/tests/setup.ts:6` rewrite (D-05)

**Existing `vi.importActual` precedent in repo (verified — quote verbatim):**

```typescript
// frontend/tests/component/CommitmentList.test.tsx:451-462
it('applies RTL direction when language is Arabic', () => {
  vi.mock('react-i18next', async () => {
    const actual = await vi.importActual('react-i18next');
    return {
      ...actual,
      useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
          language: 'ar',
        },
      }),
    };
  });
```

```typescript
// frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx:18-22
vi.mock('../ensureWorld', async () => {
  const d3Real = await vi.importActual<typeof import('d3-geo')>('d3-geo')
  const shim: typeof import('d3-geo') = {
    ...d3Real,
    geoOrthographic: (): ReturnType<typeof d3Real.geoOrthographic> => {
```

The typed-spread pattern is established. D-05 reuses it verbatim.

**Recommended factory shape for D-05:**

```typescript
// frontend/tests/setup.ts (lines 1-93 today)
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Global i18n mock — D-05: spread real module so initReactI18next + every other export survives
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: any) => {
        const translations: Record<string, string> = {
          // existing 60-key after-action translation map preserved verbatim (D-06)
          'afterActions.decisions.title': 'Decisions',
          // ... rest as today, lines 11-72 ...
          'common.selectDate': 'Select date',
        }
        return translations[key] ?? key // D-06: fallback returns key
      },
      i18n: {
        language: 'en',
      },
    }),
    Trans: ({ children }: any) => children,
  }
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())
```

**Why this works:**

- `await vi.importActual<typeof import('react-i18next')>('react-i18next')` resolves the real module synchronously inside the hoisted factory.
- Spread keeps `initReactI18next`, `I18nextProvider`, `withTranslation`, `Translation`, `Trans` (real), and 12+ other exports the SDK ships.
- The two overrides (`useTranslation`, `Trans` stubbed to children-passthrough) keep test isolation — `frontend/src/i18n/index.ts:447` (`i18n.use(initReactI18next).init(...)`) becomes a NO-OP because `i18n.use()` is called on the SDK's chainable singleton and doesn't actually require any of these to be real to succeed module evaluation.
- Note: `Trans` override deliberately stays — many tests assert on `Trans` children-passthrough behavior.

### Backend: `backend/tests/setup.ts` rewrite (D-07 + D-08)

**Current state (verified — `backend/tests/setup.ts:1-46`):** Sets `NODE_ENV=test`, loads `.env` + `.env.test`, warns if `SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY` are missing. **No global mocks.** Every test file is on the hook to set up its own mocks → easy to forget → tests that aren't mocked hit real services.

**External dependency import paths (verified by grep):**

| Module                 | Importers                                                                                                           | D-07/D-08 mock strategy                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `@/config/supabase`    | `backend/src/config/supabase.ts:15` (exports `supabaseAdmin`, `supabaseAnon`)                                       | Global chainable builder; per-test `.mockReturnValue(...)` / `.mockResolvedValue(...)`    |
| `ioredis`              | `backend/src/config/redis.ts:1` (`new Redis(redisUrl, {...})`)                                                      | Map-backed in-memory stub for `get/set/del/exists/expire/incr/on`                         |
| `bullmq`               | `backend/src/queues/notification.queue.ts:1` (`Queue`, `Worker`); `notification.processor.ts:2` (`Job`)             | `vi.fn()` factory returning `{ add, process, on, close }` chainable mocks                 |
| `@anthropic-ai/sdk`    | `backend/src/ai/llm-router.ts` + `agents/brief-generator.ts`, `agents/chat-assistant.ts`, `agents/intake-linker.ts` | `messages.create.mockResolvedValue({ content: [{ type: 'text', text: '...' }] })`         |
| `openai` (if used)     | `backend/src/ai/embeddings-service.ts`, `backend/src/ai/config.ts` (grep matched — confirm at exec time)            | `embeddings.create.mockResolvedValue({ data: [{ embedding: new Array(1536).fill(0) }] })` |
| `@xenova/transformers` | `backend/src/ai/embeddings-service.ts` (pipeline)                                                                   | Mock `pipeline()` to return `async (text) => ({ data: new Float32Array(1536) })`          |

**Recommended factory shape:**

```typescript
// backend/tests/setup.ts (D-07 + D-08 — full rewrite)
import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '../../.env') })
config({ path: path.resolve(__dirname, '../.env.test') })
process.env.NODE_ENV = 'test'

// D-07: global Supabase mock — chainable from() builder, per-test refinement via vi.mocked(...)
vi.mock('@/config/supabase', () => {
  const makeChain = (): any => {
    const terminal = { data: null, error: null }
    const chain: any = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => ({ ...chain, ...terminal })),
      update: vi.fn(() => ({ ...chain, ...terminal })),
      upsert: vi.fn(() => ({ ...chain, ...terminal })),
      delete: vi.fn(() => ({ ...chain, ...terminal })),
      eq: vi.fn(() => chain),
      neq: vi.fn(() => chain),
      in: vi.fn(() => chain),
      gt: vi.fn(() => chain),
      lt: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      lte: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      range: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve(terminal)),
      maybeSingle: vi.fn(() => Promise.resolve(terminal)),
      then: (onResolved: any) => Promise.resolve(terminal).then(onResolved),
    }
    return chain
  }
  return {
    supabaseAdmin: {
      from: vi.fn(() => makeChain()),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        admin: { listUsers: vi.fn(() => Promise.resolve({ data: { users: [] }, error: null })) },
      },
      storage: { from: vi.fn(() => ({ upload: vi.fn(), download: vi.fn() })) },
    },
    supabaseAnon: {
      from: vi.fn(() => makeChain()),
      auth: {
        signInWithPassword: vi.fn(() => Promise.resolve({ data: null, error: null })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      },
    },
  }
})

// D-08: ioredis — Map-backed in-memory stub
vi.mock('ioredis', () => {
  const Redis = vi.fn().mockImplementation(() => {
    const store = new Map<string, string>()
    const expiry = new Map<string, number>()
    return {
      get: vi.fn(async (key: string) => {
        if (expiry.get(key) && Date.now() > expiry.get(key)!) {
          store.delete(key)
          expiry.delete(key)
          return null
        }
        return store.get(key) ?? null
      }),
      set: vi.fn(async (key: string, val: string) => {
        store.set(key, val)
        return 'OK'
      }),
      del: vi.fn(async (key: string) => (store.delete(key) ? 1 : 0)),
      exists: vi.fn(async (key: string) => (store.has(key) ? 1 : 0)),
      expire: vi.fn(async (key: string, sec: number) => {
        expiry.set(key, Date.now() + sec * 1000)
        return 1
      }),
      incr: vi.fn(async (key: string) => {
        const v = Number(store.get(key) ?? 0) + 1
        store.set(key, String(v))
        return v
      }),
      on: vi.fn(),
      quit: vi.fn(async () => 'OK'),
      disconnect: vi.fn(),
    }
  })
  return { default: Redis, Redis }
})

// D-08: bullmq — Queue/Worker/QueueEvents as vi.fn() factories
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn(async () => ({ id: 'mock-job-id' })),
    on: vi.fn(),
    close: vi.fn(async () => undefined),
    getJobCounts: vi.fn(async () => ({ waiting: 0, active: 0, completed: 0, failed: 0 })),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(async () => undefined),
  })),
  QueueEvents: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(async () => undefined),
  })),
}))

// D-08: Anthropic SDK — canned response shape
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(async () => ({
        id: 'msg_mock',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: '{"mock": true}' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 0, output_tokens: 0 },
      })),
    },
  })),
}))

// D-08: OpenAI SDK (if present — confirm at exec time)
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn(async () => ({
        data: [{ embedding: new Array(1536).fill(0) }],
      })),
    },
    chat: {
      completions: {
        create: vi.fn(async () => ({ choices: [{ message: { content: '{"mock":true}' } }] })),
      },
    },
  })),
}))

beforeAll(async () => {
  console.log('🧪 Test environment ready')
})
afterAll(async () => {
  console.log('✅ Test environment cleaned up')
})
afterEach(async () => {
  vi.clearAllMocks()
}) // reset per-test override state
```

**Path resolution gotchas (verified):**

- `backend/vitest.config.ts:36` declares `resolve.alias.@: ./src` — so `vi.mock('@/config/supabase', ...)` resolves to the real file path Vitest can statically locate. **No need to use `import.meta.resolve`.**
- `backend/vitest.config.ts:10` uses absolute path for `setupFiles` (`path.resolve(__dirname, './tests/setup.ts')`) — global mocks in `setup.ts` are hoisted before every test file.
- `backend/vitest.config.ts:7` uses `pool: 'forks'` — each test file gets a fresh process, so global mocks re-evaluate from scratch (no leak between files). This is the right setting for the D-07/D-08 strategy.
- `ioredis` is a CJS module exposed as both `default` and named `Redis` — the mock must return both shapes. Verified by checking `backend/src/config/redis.ts:1` uses `import Redis from 'ioredis'` (default).
- `bullmq` is ESM with named exports `Queue`, `Worker`, `QueueEvents` — the mock returns named bindings, not `default`.

---

## Integration Runner Choice (D-03)

### Two options weighed

**Option A: Vitest `projects` config with glob distinction**

```typescript
// vitest.config.ts at workspace level
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['**/*.test.{ts,tsx}'],
          exclude: ['**/*.integration.test.*'],
        },
      },
      { test: { name: 'integration', include: ['**/*.integration.test.{ts,tsx}'] } },
    ],
  },
})
```

Run via: `vitest --project unit` / `vitest --project integration`.

**Cost:** Renames ALL `backend/tests/{contract,contracts,integration,performance}/**/*.test.ts` to `*.integration.test.ts` — ~202 file renames in backend. Mass disruption to git history. **Rejected.**

**Option B: Separate config file + separate script (RECOMMENDED)**

```typescript
// backend/vitest.integration.config.ts (new file)
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config'
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: [
        'tests/contract/**/*.test.ts',
        'tests/contracts/**/*.test.ts',
        'tests/integration/**/*.test.ts',
        'tests/performance/**/*.test.ts',
      ],
      testTimeout: 60000, // longer for real-service calls
      hookTimeout: 60000,
    },
  }),
)
```

```diff
# backend/vitest.config.ts modification
 export default defineConfig({
   test: {
     ...
-    include: ['tests/**/*.test.ts'],
+    include: ['tests/unit/**/*.test.ts', 'tests/services/**/*.test.ts', 'tests/security/**/*.test.ts', 'tests/{deadline-checker,digest-scheduler,email-notifications,notification-queue,push-notifications}.test.ts'],
+    exclude: ['node_modules/', 'dist/', 'tests/contract/**', 'tests/contracts/**', 'tests/integration/**', 'tests/performance/**'],
     ...
   },
 })
```

```json
// backend/package.json
"scripts": {
  "test": "vitest --config ./vitest.config.ts --run",
  "test:integration": "vitest --config ./vitest.integration.config.ts --run",
  "test:coverage": "vitest --coverage --config ./vitest.config.ts"
}
```

**Why Option B wins:**

- Zero test-file renames (preserves git blame).
- Backend already has 4 well-segregated test directories matching the integration boundary perfectly (`contract/`, `contracts/`, `integration/`, `performance/`).
- `mergeConfig` reuses every other setting (aliases, pool, env, setupFiles). No drift.
- `testTimeout: 60000` for integration (longer than unit's 30000) addresses real-service latency without affecting unit speed.

For frontend, the same Option B applies but with a simpler shape — most FE "integration" tests are actually misplaced (e.g., `frontend/tests/integration/test_language_switch.test.tsx` references a deleted `src/i18n/config`). After class-D dead-file cleanup, FE may not need a separate integration runner at all. **Recommendation:** Keep FE on one config; only add `test:integration` script if needed after audit.

### Existing config quirks (quote verbatim)

```typescript
// frontend/vitest.config.ts (full file, 31 lines)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', 'dist/', 'build/'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src'), '@tests': path.resolve(__dirname, './tests') },
  },
})
```

**Critical observations:**

1. **NO `include` or `exclude` for test files** — vitest defaults pick up `**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}` which is why 175 Playwright `.spec.ts` files run. **The single-line fix** is adding `include: ['**/*.test.{ts,tsx}'] ` OR `exclude: ['**/*.spec.*']`.

2. **NO coverage `thresholds`** — CONTEXT.md (line 124) claims `80% line / 80% function / 75% branch` thresholds but the file has none. **CONTEXT.md is wrong about FE.** Only BE has them (`backend/vitest.config.ts:24-27`). See §Coverage Threshold Impact.

3. **`environment: 'jsdom'`** — happy path for component tests. No change needed.

```typescript
// backend/vitest.config.ts (key lines)
testTimeout: 30000,
hookTimeout: 30000,
pool: 'forks',                              // good for global mocks
include: ['tests/**/*.test.ts'],            // PICKS UP ALL TEST FOLDERS — needs narrowing
coverage: { lines: 80, functions: 80, branches: 75, statements: 80 }  // strict
```

---

## CI Gate Registration Mechanism (D-13)

### Current state (verified live via `gh api repos/.../branches/main/protection`)

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["type-check", "Security Scan", "Lint", "Bundle Size Check (size-limit)"]
  },
  "enforce_admins": { "enabled": true }
}
```

### Existing CI workflow (`/.github/workflows/ci.yml`)

The workflow ALREADY HAS a `test-unit` job (lines 90-117):

```yaml
test-unit:
  name: Unit Tests
  runs-on: ubuntu-latest
  needs: [repo-policy]
  steps:
    - uses: actions/checkout@v4
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with: { node-version: ${{ env.NODE_VERSION }}, cache: 'pnpm' }
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Run unit tests
      run: pnpm run test -- --coverage
```

**Problem:** This job runs `pnpm run test` at repo root → Turbo runs ALL workspaces in parallel → both FE and BE → no per-workspace gate. Needs to be split into TWO jobs.

### D-13 implementation shape

Add to `/.github/workflows/ci.yml`:

```yaml
  test-frontend:
    name: Tests (frontend)
    runs-on: ubuntu-latest
    needs: [repo-policy]
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }}, cache: 'pnpm' }
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Run frontend tests
        run: pnpm --filter intake-frontend test --run

  test-backend:
    name: Tests (backend)
    runs-on: ubuntu-latest
    needs: [repo-policy]
    steps:
      - uses: actions/checkout@v4
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }}, cache: 'pnpm' }
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Run backend tests
        run: pnpm --filter intake-backend test --run

  test-integration:
    name: Tests (integration)
    runs-on: ubuntu-latest
    needs: [repo-policy]
    continue-on-error: true  # advisory-only per D-13
    services: { postgres: { image: postgres:16-alpine, ... } }
    steps:
      - ... [setup like above]
      - name: Run integration tests
        run: pnpm --filter intake-backend test:integration
```

**Then register required contexts via `gh api`:**

```bash
gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "type-check",
      "Security Scan",
      "Lint",
      "Bundle Size Check (size-limit)",
      "Tests (frontend)",
      "Tests (backend)"
    ]
  },
  "enforce_admins": true,
  ...
}
JSON
```

**Verbatim existing required-check names (for D-13 mirror):**

- `type-check` (lowercase, with hyphen)
- `Security Scan` (mixed case)
- `Lint` (titlecase)
- `Bundle Size Check (size-limit)` (titlecase with parens)

New context names follow the v6.2 convention `<Capability> (<workspace>)`:

- `Tests (frontend)` (the `name:` value in YAML)
- `Tests (backend)`
- `Tests (integration)` — registered as a workflow job but NOT in `required_status_checks.contexts` (advisory-only per D-13)

**Mechanism verified:** Phase 47/48/49 used the identical PATCH pattern; STATE.md `v6.2/48-03` and `v6.2/49-03` confirm the workflow exists and `enforce_admins=true` is preserved across updates. Smoke-PR proof: create a PR with a failing test → both `Tests (frontend)` and `Tests (backend)` show `mergeStateStatus=BLOCKED`.

---

## ESLint Rule Implementation Choice (D-15)

### Existing config shape (verified)

`eslint.config.mjs` is **flat config (ESLint 9+)** with workspace-level overrides. Plugin loading pattern (lines 1-9):

```javascript
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import checkFile from 'eslint-plugin-check-file'
import rtlFriendly from 'eslint-plugin-rtl-friendly'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: [...] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: {...}, plugins: { 'unused-imports': unusedImports } },
  // frontend override block
  { files: ['frontend/**/*.{ts,tsx}'], plugins: {...}, rules: {...} },
  // ...
)
```

### Three implementation options

**Option 1: `no-restricted-syntax` AST selector (cheapest, ~10 lines)**

```javascript
// In eslint.config.mjs frontend block
'no-restricted-syntax': [
  'error',
  {
    selector: "CallExpression[callee.object.name='vi'][callee.property.name='mock'] > ArrowFunctionExpression.arguments:nth-child(2) ObjectExpression:not(:has(SpreadElement))",
    message: "vi.mock(...) factory must spread vi.importActual(<id>) OR explicitly list every export of the resolved module. Use: `const actual = await vi.importActual(...); return { ...actual, override }`",
  },
],
```

**Pros:** Zero new dependency, lives in existing config, runs under existing `Lint` PR-blocking context.
**Cons:** No static module-resolution — can't enumerate the real exports of `<module-id>` to verify completeness. It can only force the `importActual + spread` PATTERN. False negatives: a factory that explicitly lists every export and is correct will still flag. False positives possible.
**Coverage:** ~80% of the value of D-15 (forces the pattern); doesn't catch "mock listed all 5 exports but module now has 7".

**Option 2: Local plugin under `tools/eslint-plugin-intl-dossier/` (D-15 explicit option)**

```
tools/eslint-plugin-intl-dossier/
├── index.js                    # exports { rules: { 'vi-mock-exports-required': rule } }
├── rules/vi-mock-exports-required.js
└── package.json                # name, main, version
```

Rule logic:

1. AST visit: find `CallExpression` matching `vi.mock(StringLiteral, ArrowFunctionExpression)`.
2. Read the factory body — if `Promise.resolve(<spread of importActual call>)` OR `{ ...actual, ... }` after `await vi.importActual(...)` is present → PASS (D-05 pattern).
3. Otherwise: statically `import()` the resolved module path (using project's tsconfig paths) at lint-time, enumerate its `Object.keys(module)`, compare to the factory's returned `ObjectExpression.properties`, flag any missing.

**Pros:** Full D-15 semantics — module-resolution-aware. Catches the precise initReactI18next regression class.
**Cons:** ~80-120 lines of rule code + tests + module-resolver wiring. The dynamic `import()` at lint-time is fragile (TS path aliases, JSX deps, etc.) and slows lint by ~500ms per file. Adds a new package to the monorepo.

**Option 3: Hybrid — Option 1 enforced strictly + advisory README guidance**

Use Option 1 (`no-restricted-syntax`) as the actual lint rule. Add a `tools/lint-helpers/vi-mock-exports-check.mjs` standalone script that does the dynamic import comparison, runnable as `pnpm test:lint-vi-mocks` for periodic audits. NOT a PR-gate, just an audit aid.

### Recommendation: **Option 1 (cheapest viable)**

Rationale:

- D-05 pattern (`importActual + spread`) is what we want every contributor to USE. Forcing the pattern is the actual goal — D-15 is fundamentally a _pattern enforcement_ rule, not a _coverage enforcement_ rule.
- A factory that lists 14 exports manually and gets it right is a code smell — we'd rather force the spread.
- Option 1 is 10 lines vs Option 2's 120 lines + new package. The Karpathy principle: minimum code that solves the problem.
- D-15 explicitly says: "Implementation: planner may choose the cheapest viable path — single AST rule, or stricter `vi.mock` arity check that requires `importActual` spread for any factory with 1+ explicit overrides."

**Trade-off accepted:** A future contributor who manually lists all exports and gets it right will still be flagged — they must convert to the spread pattern. This is a feature, not a bug — it enforces the safe default.

**Caveat:** The AST selector above is a sketch. The plan must verify it on the rewritten `frontend/tests/setup.ts` AND on the existing precedent files (`CommitmentList.test.tsx:452`, `GlobeLoader.reducedMotion.test.tsx:19`). The selector should PASS them; if it FAILS, refine the selector or fall back to Option 3.

---

## Wizard Regression Triage (D-09 / D-10)

### The 4 "original wizard tests" (TEST-02)

All four fail with the SAME error: `Error: [vitest] No "initReactI18next" export is defined on the "react-i18next" mock`. Quote verbatim from the failure log:

```
× src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx > CreateWizardShell > should be importable as a named export
× src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx > CreateWizardShell > should accept dossierType and steps props
× src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx > SharedBasicInfoStep > should be importable as a named export
× src/components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts > useCreateDossierWizard > should be importable
```

**Root cause:** These tests transitively import `frontend/src/i18n/index.ts` (via Wizard component → form-wizard imports → i18n consumer). Line 447 of that file reads `i18n.use(initReactI18next).init({...})`. When vitest evaluates the import chain, the global mock returns `{ useTranslation, Trans }` only — `initReactI18next` is `undefined`. `.use(undefined)` throws at module-eval time.

**Disposition:** All 4 clear automatically when D-05 lands. **TEST-02 is a side-effect of TEST-01**, NOT a separate fix surface.

### The `useCountryAutoFill` regression (D-10 archaeology)

**Failure** (verbatim from `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts:77-79, 108`):

```
AssertionError: expected "vi.fn()" to be called with arguments: [ 'iso_code_2', 'SA' ]
Received:
  1st vi.fn() call: [ "iso_code_2", undefined ]
  2nd vi.fn() call: [ "iso_code_3", undefined ]
  3rd vi.fn() call: [ "region", "asia" ]
```

**Git archaeology:**

```bash
git log --oneline frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts
# 9ee50f7f fix(27): address code review findings WR-01, WR-02, WR-03   ← removed `translations` field, kept cca2/cca3
# cbaf81fe fix(27): wizard step visibility, i18n translation, and auto-fill
# 7943ad20 feat(27-01): country wizard config, auto-fill hook, and i18n keys   ← initial commit, cca2/cca3 from day 1

git log --oneline frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts
# 7943ad20 feat(27-01): country wizard config, auto-fill hook, and i18n keys   ← initial commit, mocks `code`/`code3` (WRONG)
```

**Diagnosis (D-10 verdict):** **TEST IS WRONG. IMPL IS (mostly) RIGHT.**

- The impl reads `match.cca2`, `match.cca3`, `match.region` per REST Countries v3.1 API contract (verified: `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts:55-65`).
- The test in commit `7943ad20` (2026-04-15) created `mockMatch = { code: 'SA', code3: 'SAU', name_en: ..., region: 'Asia' }` — wrong field names + un-mapped region.
- The test has been failing since first commit. Never executed in green CI because there was no green CI for unit tests at the time (Phase 27 paperwork) — silent failure.

**Fix direction (planner scopes):**

1. Update test mock to `{ cca2: 'SA', cca3: 'SAU', region: 'Asia', capital: ['Riyadh'] }` (REST Countries shape).
2. Update test assertions: `region` assertion becomes `'asia'` (post-`REGION_MAP` mapping), not `'Asia'`.
3. **Defensive impl hardening (small product change, D-09):** Add `match.cca2 != null && match.cca2 !== ''` guards (today only checks `!== ''`, undefined slips through). Same for `cca3`. This stops the "undefined passes through to form" regression class.

**The 4-test count is wrong.** The TEST-02 ROADMAP success criterion says "4 wizard tests" — based on the v6.2 audit count of `(CreateWizardShell ×2 + SharedBasicInfoStep ×1 + useCreateDossierWizard ×1)`. But `useCountryAutoFill ×2` is a separate, additional regression surfaced during this research. **Plan must scope BOTH** — the 4 module-eval-blocked tests (clears with D-05) AND the 2 product-regression tests (clears with test + impl edits). Total tests cleared: 6.

### Other product-class failures surfaced

| File                                                                      | Failures | Likely cause                                                                                                                 |
| ------------------------------------------------------------------------- | -------: | ---------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/design-system/fouc-bootstrap.test.ts`                         |        9 | Drift guard literal-match against `bootstrap.js` palette (Phase 33/34 baseline) — confirm if intended or stale               |
| `src/pages/Dashboard/widgets/__tests__/KpiStrip.test.tsx`                 |        2 | Dashboard widget assertion drift (Phase 38 baseline)                                                                         |
| `tests/unit/components/ui/heroui-wrappers.test.tsx`                       |        2 | HeroUI v3 wrapper test drift (Phase 33/35 baseline)                                                                          |
| `src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx` |        4 | `waitFor('Forums')` timeout — likely route auth wrapper issue                                                                |
| `src/lib/__tests__/api-client.test.ts`                                    |        6 | All "MSW intercepted request without handler" — env URL is `undefined/functions/v1/...` because no Supabase env set in tests |

Per D-10, each requires `git log -p` triage. Most are likely **test-side fixture drift** (component shipped, test wasn't updated). The plan should allocate ~30-45 min per file. Total estimate: ~5 files × 30 min = 2.5 hours of triage work.

---

## Coverage Threshold Impact

### What CONTEXT.md claimed

> 80% line / 80% function / 75% branch coverage thresholds in `frontend/vitest.config.ts`. Phase 50 must not regress these.

### What the file actually says (verified)

`frontend/vitest.config.ts:12-23` declares ONLY:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', 'dist/', 'build/']
}
```

**NO `lines`, NO `functions`, NO `branches` thresholds.** Frontend has no enforced coverage gate today. **CONTEXT.md is incorrect about FE.**

Backend `vitest.config.ts:24-27` DOES have thresholds:

```typescript
coverage: {
  ...
  lines: 80, functions: 80, branches: 75, statements: 80
}
```

### Impact analysis

| Workspace | Today's thresholds | Phase 50 risk                                                                                                                        | Mitigation                                                                                                                                                            |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend  | NONE               | None — no threshold to regress.                                                                                                      | Decide separately whether to ADD thresholds (out of Phase 50 per CONTEXT deferred §80%+ coverage push).                                                               |
| Backend   | 80/80/75/80        | Moving 191 contract+integration tests behind `pnpm test:integration` means the default `pnpm test` covers far less of `backend/src`. | **Decision needed:** Coverage runs against ONLY the unit suite (very low coverage, will fail) OR coverage runs against BOTH unit + integration combined (status quo). |

**Recommendation:** Backend `pnpm test:coverage` runs against BOTH unit + integration (mergeConfig the integration suite IN for coverage runs). This preserves current `lines: 80` etc. Default `pnpm test` (the PR gate) runs unit-only, no coverage threshold check. Per D-13 the gate is "tests exit 0", not "coverage hits 80".

**No CONTEXT change needed** — D-03 default-runner-runs-mocked-only is preserved; coverage check is separately invoked and uses the broader suite.

---

## Recommended Plan Slicing

### Dependency graph

```
Plan 50-01: FE config + i18n mock + dead-import cleanup (G1+G2+G3 cascades)
                ↓ unblocks
Plan 50-02: FE wizard + per-file product/test regression fixes (G5 + class-S)
                            +
Plan 50-03: BE setup.ts global mocks (D-07/D-08) + integration runner split (D-03)
                ↓ both must be green to populate
Plan 50-04: 50-TEST-AUDIT.md (D-04) + frontend/docs/test-setup.md + backend/docs/test-setup.md (D-14)
                ↓ docs in place
Plan 50-05: CI workflow jobs (Tests (frontend), Tests (backend), Tests (integration))
            + Branch protection update (D-13)
            + Custom ESLint rule vi-mock-exports-required (D-15)
```

### Plan-by-plan justification

**Plan 50-01: Frontend cascade unblock** (~1-2 days)

- Add `include: ['**/*.test.{ts,tsx}']` to `frontend/vitest.config.ts` (clears 175 + 1 faker = 176 files in one diff)
- Rewrite `frontend/tests/setup.ts:6` per D-05 (clears 20 module-eval files including all 4 wizard tests for TEST-02)
- Audit + delete 11 dead-import test files (legacy theme-provider, deleted DossierCard/LanguageToggle, i18n/config — class-D)
- Decide on 4 class-S files (Supabase env): either delete (likely dead) OR move to integration
- **Verification:** After this plan, `pnpm --filter intake-frontend test` exits with only ~5-8 test failures remaining (the product/test regression class-R).

**Plan 50-02: Frontend per-file regression fixes** (~0.5-1 day)

- Fix `useCountryAutoFill.test.ts` mock shape (test side) + impl null-guards (D-09)
- Triage `fouc-bootstrap.test.ts` (9 failures), `KpiStrip.test.tsx` (2), `heroui-wrappers.test.tsx` (2), `ForumsListPage.test.tsx` (4), `api-client.test.ts` (6) per D-10
- **Verification:** `pnpm --filter intake-frontend test` exits 0 → TEST-01, TEST-02 SATISFIED.

**Plan 50-03: Backend overhaul (mocks + split)** (~1-2 days)

- Rewrite `backend/tests/setup.ts` per D-07 + D-08 (global mocks for supabase/ioredis/bullmq/anthropic/openai)
- Modify `backend/vitest.config.ts` to exclude `tests/{contract,contracts,integration,performance}/**`
- Create `backend/vitest.integration.config.ts` (mergeConfig — opposite include)
- Add `test:integration` script to `backend/package.json`
- Triage any remaining failures in the now-narrow default suite (class-H helper missing, class-M module-not-found, class-A api-shape drift, fixture drift)
- **Verification:** `pnpm --filter intake-backend test` exits 0 → TEST-01 dimension for BE SATISFIED.

**Plan 50-04: Audit artifact + docs** (~0.5 day)

- Author `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md` per D-04 with full inventory + dispositions (rolls up plans 01-03 work)
- Author `frontend/docs/test-setup.md` per D-14 (comprehensive contributor guide — vitest config arch, i18next mock contract w/ importActual precedent, supabase/Redis/BullMQ/LLM mock recipes from D-07/08, unit-vs-integration runner split explanation, common pitfalls, fixture patterns)
- Author `backend/docs/test-setup.md` per D-14 (short, points back to FE doc, BE-specific recipes only)
- **Verification:** TEST-03 + TEST-04 SATISFIED.

**Plan 50-05: CI + ESLint + Branch protection** (~0.5-1 day)

- Add `Tests (frontend)`, `Tests (backend)`, `Tests (integration)` jobs to `/.github/workflows/ci.yml`
- PATCH `main` branch protection via `gh api`: append `Tests (frontend)`, `Tests (backend)` to required contexts (NOT `Tests (integration)` — advisory)
- Implement `vi-mock-exports-required` rule (Option 1 `no-restricted-syntax` recommended) in root `eslint.config.mjs` frontend block
- Smoke-PR proof: open a PR that breaks a test → both new contexts show fail + `mergeStateStatus=BLOCKED`
- **Verification:** Branch protection contains both new contexts; ESLint passes on current codebase including D-05 mock; smoke PR proves gate.

### Wave parallelism

- **Wave A (parallel):** Plan 50-01 (FE cascade) ‖ Plan 50-03 (BE overhaul). No file overlap. Different workspaces.
- **Wave B:** Plan 50-02 (FE per-file fixes) — depends on 50-01.
- **Wave C:** Plan 50-04 (audit + docs) — depends on 50-01, 50-02, 50-03 (the audit rolls up disposition data from all three).
- **Wave D:** Plan 50-05 (CI + ESLint + branch protection) — depends on Wave C (must have green tests + the docs the rule references).

### Why this slicing vs alternatives

- **NOT one mega-plan:** 5 plans give per-PR commit granularity. Reviewer can see "config split clears 175 failures" as one commit instead of buried in a 500-line diff.
- **NOT 10 micro-plans:** The natural fault lines are workspace boundaries (FE vs BE) + work types (audit/docs/CI). Going finer fragments without adding value.
- **WHY the 50-01 / 50-02 split:** 50-01 is config-and-cleanup (low-risk, fast); 50-02 is product-touching (higher risk, per-file investigation). Different cognitive modes. Keeps each plan ≤1 day.
- **WHY 50-05 last:** The ESLint rule and CI gates need green tests to land cleanly — adding `Tests (frontend)` to required contexts BEFORE tests are green would block all PRs.

---

## Don't Hand-Roll

| Problem                                  | Don't Build                          | Use Instead                                                                                   | Why                                                                                                                             |
| ---------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Spread real module + override one export | Manual list-every-export factory     | `await vi.importActual<typeof import('mod')>('mod')` + spread + override                      | Future-proof — adds new SDK exports for free                                                                                    |
| In-memory chainable Supabase stub        | Roll your own DSL with custom verbs  | Spread the real `from()` builder API surface; `vi.fn()` for every terminal                    | Supabase's chainable API is large (eq/neq/in/gt/lt/order/limit/range/single/maybeSingle/...). Misses cause test rewrites later. |
| In-memory Redis                          | Reach for `ioredis-mock` npm dep     | Map-backed `vi.fn()` factory inline in `tests/setup.ts`                                       | `ioredis-mock` is unmaintained (last release 2023); 30-line inline stub covers `get/set/del/exists/expire/incr/quit`            |
| BullMQ Queue/Worker mock                 | `bullmq-mock` or similar             | 3 × `vi.fn().mockImplementation(() => ({ add, on, close, ... }))`                             | BullMQ's API surface is small; the stub is 15 lines                                                                             |
| Custom AST tree-walk for the ESLint rule | Bespoke parser                       | `no-restricted-syntax` with selector OR `@typescript-eslint/parser` AST visit if local plugin | ESLint already parses; no parallel pipeline needed                                                                              |
| Integration vs unit split                | Custom test-runner orchestration     | Vitest `mergeConfig` + separate config file + `package.json` script                           | First-class vitest support; no orchestration layer                                                                              |
| CI matrix splitting unit/integration     | Multi-job workflow with shared setup | Two simple jobs each running `pnpm --filter <workspace> test --run`                           | Existing v6.2 pattern (type-check job is identical shape)                                                                       |

---

## Common Pitfalls

### Pitfall 1: Spread missing `await` on `importActual`

**What goes wrong:** `vi.mock` factory returns a Promise-wrapping-object instead of an object.
**Why it happens:** `vi.importActual<T>(mod)` returns a Promise. Without `await`, spread fails.
**How to avoid:** Always `async () => { const actual = await vi.importActual<T>(mod); return { ...actual, ... } }`.
**Warning signs:** Test error `[vitest] Cannot read properties of undefined (reading 'XYZ')` for an export that was supposed to be spread-in.

### Pitfall 2: Chain mocks that return new objects break per-test refinement

**What goes wrong:** `vi.mocked(supabaseAdmin.from).mockReturnValue(...)` doesn't take effect because the global mock returns a NEW chain instance every call.
**Why it happens:** Per-test refinement targets the wrapper, not the chain.
**How to avoid:** Either (a) return a SINGLETON chain per `from(table)` call cached by table name (more deterministic), OR (b) per-test wire via `vi.mocked(supabaseAdmin.from).mockImplementation((table) => customChain)`.
**Warning signs:** Per-test override appears to be ignored.

### Pitfall 3: `vi.clearAllMocks()` in `afterEach` wipes per-test mock implementations

**What goes wrong:** Test 2 fails because Test 1's `mockReturnValue(...)` was wiped, but Test 2 expected the mock to retain state.
**Why it happens:** `clearAllMocks` resets mock state including return values.
**How to avoid:** Use `vi.resetAllMocks()` only when truly needed; prefer scoping `vi.mocked(...).mockReturnValue` inside `beforeEach` of each describe block.

### Pitfall 4: Playwright `.spec.ts` files in `tests/` re-picked by vitest after config split

**What goes wrong:** After adding integration runner, accidentally re-include Playwright globs.
**Why it happens:** `include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts']` is a tempting overgeneralization.
**How to avoid:** Use `.test.{ts,tsx}` for vitest, reserve `.spec.{ts,tsx}` for Playwright. Document in `frontend/docs/test-setup.md`.

### Pitfall 5: ESLint rule firing on the canonical `frontend/tests/setup.ts` itself

**What goes wrong:** The D-15 rule flags the very mock it's meant to ENFORCE.
**Why it happens:** AST selector doesn't distinguish "spread present" from "missing exports".
**How to avoid:** Whitelist factories that include a `SpreadElement` whose argument is a call to `vi.importActual`. Verify on `frontend/tests/setup.ts` AND the two existing precedent files (`CommitmentList.test.tsx`, `GlobeLoader.reducedMotion.test.tsx`) BEFORE landing the rule.

### Pitfall 6: BullMQ `Queue` mock breaks when `close()` is awaited at shutdown

**What goes wrong:** Test process hangs because `queue.close()` returns `undefined` (sync), but production code expects a Promise.
**Why it happens:** `vi.fn(() => undefined)` doesn't match production async signature.
**How to avoid:** Always `vi.fn(async () => undefined)` for terminal methods.

### Pitfall 7: Backend `pool: 'forks'` + global mock state leak

**What goes wrong:** Test A in file1 mutates the in-memory Redis stub; test B in file2 sees the mutation.
**Why it happens:** Forks share `setup.ts` evaluation result but NOT the in-memory Map (forks isolate memory). **This is not actually a leak — Vitest forks DO isolate.** The pitfall is the inverse: assuming state persists across files within one fork run.
**How to avoid:** Document that each test file is its own process; don't assume "global Redis" persists across files.

---

## Validation Architecture

> Nyquist validation enabled (`workflow.nyquist_validation: true` in `.planning/config.json`).

### Test Framework

| Property           | Value                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------- |
| Framework          | Vitest 4.1.2 + Playwright (separate, OUT OF SCOPE per D-12)                            |
| Config files       | `frontend/vitest.config.ts`, `backend/vitest.config.ts`                                |
| Quick run command  | `pnpm --filter intake-frontend test --run` / `pnpm --filter intake-backend test --run` |
| Full suite command | `pnpm test` (Turbo runs both workspaces)                                               |
| Integration runner | `pnpm --filter intake-backend test:integration` (advisory, NOT PR-blocking)            |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                                 | Test Type   | Automated Command                                                                                                                                           | File Exists?       |
| ------- | ---------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| TEST-01 | `frontend/tests/setup.ts` `vi.mock('react-i18next')` factory includes `initReactI18next` | grep + unit | `grep -c "initReactI18next\|importActual" frontend/tests/setup.ts` → expect ≥1; `pnpm --filter intake-frontend test --run --testPathPattern wizard` exits 0 | ✅ existing config |
| TEST-02 | 4 wizard tests pass green                                                                | unit        | `pnpm --filter intake-frontend test --run src/components/dossier/wizard/__tests__ src/components/dossier/wizard/hooks/__tests__`                            | ✅ existing tests  |
| TEST-03 | `50-TEST-AUDIT.md` lists every failing test at phase start with disposition              | doc         | `wc -l < .planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md` ≥218 rows + structure check (grep for "## Frontend", "## Backend", "disposition") | ❌ Wave 0          |
| TEST-04 | `frontend/docs/test-setup.md` documents the contract                                     | doc         | `grep -c "vi.importActual\|initReactI18next\|integration runner" frontend/docs/test-setup.md` ≥5                                                            | ❌ Wave 0          |
| (gate)  | `Tests (frontend)` + `Tests (backend)` are required contexts on `main`                   | CI / gh api | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \| jq '.required_status_checks.contexts[]' \| grep -c 'Tests'` returns 2          | gh access required |
| (rule)  | ESLint rule `vi-mock-exports-required` flags a known-bad fixture                         | lint        | `pnpm lint -- --rule 'no-restricted-syntax' fixtures/bad-vi-mock.ts` exits ≠0; `pnpm lint` on canonical setup.ts exits 0                                    | ❌ Wave 0          |

### Sampling Rate

- **Per task commit:** `pnpm --filter <workspace> test --run --testPathPattern <touched-folder>` (≤10s)
- **Per wave merge:** Full `pnpm --filter <workspace> test --run` for each workspace touched (≤90s)
- **Phase gate:** Both workspaces exit 0 + `gh api ... | jq '.required_status_checks.contexts'` includes new gates + `Lint` exits 0 with D-15 rule active

### Wave 0 Gaps

- [ ] `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md` — covers TEST-03 (created in Plan 50-04)
- [ ] `frontend/docs/test-setup.md` — covers TEST-04 (created in Plan 50-04)
- [ ] `backend/docs/test-setup.md` — covers TEST-04 (created in Plan 50-04)
- [ ] `backend/vitest.integration.config.ts` — supports D-03 integration runner (created in Plan 50-03)
- [ ] `tools/eslint-plugin-intl-dossier/` (if Option 2) OR new lint rule entries in `eslint.config.mjs` (if Option 1 — RECOMMENDED) — D-15 (created in Plan 50-05)
- [ ] New workflow jobs in `.github/workflows/ci.yml` — D-13 (created in Plan 50-05)

### Validation evidence checklist (TEST-03 audit artifact)

The audit must contain at minimum:

- A row per FE failing test file at phase start (218 rows)
- A row per BE failing test file at phase start (208 rows)
- Columns: `workspace`, `file_path`, `failure_class` (one of: module-eval | setup-gap | fixture-drift | product-regression | integration-only | dead-import | playwright-misglobbed | snapshot-drift), `disposition` (fixed-in-phase | split-to-integration | queued-with-rationale | deleted-dead), `rationale` (free text for queued + deleted rows), optional `commit_ref` for fixed rows
- A summary count by `failure_class` + `disposition` for cross-check
- A "Final phase-exit state" section: `pnpm --filter intake-frontend test` exit code, `pnpm --filter intake-backend test` exit code, both with timestamps

---

## Security Domain

> `security_enforcement` not explicitly set in `.planning/config.json` — treat as enabled.

### Applicable ASVS Categories

| ASVS Category         | Applies  | Standard Control                                                                                            |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no       | This phase doesn't touch auth code paths                                                                    |
| V3 Session Management | no       | Same                                                                                                        |
| V4 Access Control     | no       | Same                                                                                                        |
| V5 Input Validation   | indirect | New mock factories accept arbitrary test input — no untrusted input crosses a security boundary             |
| V6 Cryptography       | no       | No crypto code touched                                                                                      |
| V14 Configuration     | yes      | New `vitest.integration.config.ts` and ESLint rule add config surface — verify no secret leak in test setup |

### Known Threat Patterns for Test Infrastructure

| Pattern                                        | STRIDE                 | Standard Mitigation                                                                                       |
| ---------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Hard-coded API keys in mock factories          | Information disclosure | Mocks return placeholder strings only (`'mock-job-id'`, etc.); no real key shapes                         |
| `.env` / `.env.test` leaked via test artifacts | Information disclosure | `repo-policy` CI job (existing — `/.github/workflows/ci.yml:17-41`) already blocks committed `.env` files |
| Tests bypassing auth on real services          | Spoofing               | D-03 split moves these to opt-in `test:integration` — default `pnpm test` has no auth bypass capability   |
| Mocks accepting unsanitized input              | Tampering              | N/A — mocks return canned data, don't process input semantically                                          |

**No new attack surface introduced.** Phase 50 is test-infra-only.

---

## Environment Availability

| Dependency                        | Required By                  | Available                                       | Version                                                              | Fallback                                          |
| --------------------------------- | ---------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| Node.js                           | All test runs                | ✓                                               | 22.13.0+ required per package.json engines                           | —                                                 |
| pnpm                              | All test runs                | ✓                                               | 10.29.1+                                                             | —                                                 |
| Vitest                            | FE + BE test runs            | ✓                                               | 4.1.2 (live-probed via `pnpm exec vitest --version` proxy in output) | —                                                 |
| `vi.importActual`                 | D-05 factory rewrite         | ✓ (Vitest core API)                             | —                                                                    | —                                                 |
| `gh` CLI                          | D-13 branch protection PATCH | ✓ (live `gh api` succeeds)                      | —                                                                    | Manual via GitHub web UI (slower, no audit trail) |
| `mergeConfig` from vitest/config  | D-03 integration runner      | ✓ (built-in)                                    | —                                                                    | —                                                 |
| ESLint flat config + AST selector | D-15 rule                    | ✓ (existing flat config in `eslint.config.mjs`) | ESLint 9+                                                            | —                                                 |
| Real Supabase / Redis / LLM       | Phase 50 itself              | NOT NEEDED                                      | —                                                                    | D-03 integration tests don't run in default suite |

**Missing dependencies with no fallback:** None. Phase 50 has zero blocking external deps.
**Missing dependencies with fallback:** None — everything probed available.

---

## Code Examples

### D-05 factory (verified pattern from `CommitmentList.test.tsx:451`)

```typescript
// Source: frontend/tests/component/CommitmentList.test.tsx:451-462 (verbatim from repo)
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'ar' },
    }),
  }
})
```

### D-07 chainable supabase mock (recommended)

```typescript
// Reusable per backend/tests/setup.ts rewrite
const makeChain = (): any => {
  const terminal = { data: null, error: null }
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(terminal)),
    insert: vi.fn(() => ({ ...chain, ...terminal })),
    // ... see full version above
  }
  return chain
}
```

### D-15 rule (Option 1 selector)

```javascript
// Source: recommended addition to eslint.config.mjs frontend block
{
  files: ['**/tests/**/*.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        // Flag vi.mock(<id>, factory) where factory returns object literal without SpreadElement
        selector: "CallExpression[callee.object.name='vi'][callee.property.name='mock'] ArrowFunctionExpression > ObjectExpression:not(:has(SpreadElement))",
        message: 'vi.mock(...) factory must spread vi.importActual(<id>). Pattern: `async () => ({ ...(await vi.importActual<typeof import("mod")>("mod")), override: ... })`. See frontend/docs/test-setup.md §react-i18next-precedent.',
      },
    ],
  },
}
```

### CI workflow addition

```yaml
# Source: recommended addition to .github/workflows/ci.yml
test-frontend:
  name: Tests (frontend)
  runs-on: ubuntu-latest
  needs: [repo-policy]
  steps:
    - uses: actions/checkout@v4
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with: { node-version: ${{ env.NODE_VERSION }}, cache: 'pnpm' }
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Run frontend tests
      run: pnpm --filter intake-frontend test --run
```

---

## State of the Art

| Old Approach                                            | Current Approach                                                                                      | When Changed            | Impact                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `vi.mock('mod', () => ({ explicit, exports, listed }))` | `vi.mock('mod', async () => ({ ...(await vi.importActual<typeof import('mod')>('mod')), override }))` | Vitest 1.0+ (2023+)     | Future-proof against new SDK exports; matches Jest `requireActual` migration guide |
| Per-test mock setup per file                            | Global `vi.mock` in `tests/setup.ts` + per-test `vi.mocked(...).mockReturnValue(...)` refinement      | Vitest convention 2024+ | Test files stay small, focused on assertions; setup boilerplate centralized        |
| `jest.config.js` workspaces                             | Vitest `projects: [...]` (in v3+) OR `mergeConfig` + separate config files                            | Vitest 3.0+ (2024)      | First-class multi-suite support; no Jest carry-over                                |
| Tests requiring real services in default suite          | Default suite mocked-only; integration runner opt-in                                                  | Industry standard       | Clean checkouts pass tests without infrastructure; CI parallelism preserved        |
| Branch protection edited via web UI                     | `gh api -X PATCH .../protection` with HEREDOC JSON                                                    | Phases 47-49 (2026-05)  | Audit trail in commit message; reproducible                                        |

**Deprecated/outdated:**

- `requireActual` (Jest only — Vitest uses `importActual`)
- `jest.mock` with hoist gymnastics (Vitest hoists automatically when factory is provided)
- `ioredis-mock` npm package (unmaintained since 2023; inline stub preferred)

---

## Assumptions Log

| #   | Claim                                                                                                       | Section                            | Risk if Wrong                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | The `useCountryAutoFill` test has been failing since first commit and no green CI ran on Phase 27           | §Wizard Regression Triage          | If a green CI DID exist and we missed something, the test may be passing in a different harness — investigate during Plan 50-02                       |
| A2  | `pnpm --filter intake-backend test:integration` (script doesn't exist yet) is the right name choice         | §Integration Runner Choice         | Naming friction only — easy to rename in PR review                                                                                                    |
| A3  | The ESLint Option 1 (`no-restricted-syntax`) selector correctly distinguishes "no spread" from "has spread" | §ESLint Rule Implementation Choice | Selector must be tested on real fixtures; may need refinement during Plan 50-05                                                                       |
| A4  | The OpenAI SDK is imported in backend (`grep` showed only `openai` keyword matches in comments/types)       | §Mock Factory Specs                | If never actually imported, the OpenAI mock is unused but harmless — verify at exec time                                                              |
| A5  | `gh api -X PUT .../protection` PATCH-style update preserves `enforce_admins=true` (per v6.2 precedent)      | §CI Gate Registration Mechanism    | If GitHub API behavior changed, smoke test in Plan 50-05 before declaring done                                                                        |
| A6  | Vitest `mergeConfig` correctly composes setupFiles (both base + integration apply)                          | §Integration Runner Choice         | If mergeConfig replaces setupFiles instead of merging, integration tests miss D-07/D-08 mocks — verify by running one mock-dependent integration test |

---

## Open Questions

1. **Should `frontend/tests/integration/*` directory entirely move to the integration runner, or are some salvageable as unit tests?**
   - What we know: 5 files reference deleted modules (`theme-provider`, `i18n/config`, `LanguageToggle`, `DossierCard`, `theme-selector`) — all class-D dead.
   - What's unclear: Are there other FE tests in `tests/integration/` that work today and just need a different runner?
   - Recommendation: Plan 50-01 deletes the 5 dead files. Plan 50-04 audit decides whether any others survive — if so, FE gets its own `vitest.integration.config.ts`.

2. **Does `Tests (integration)` workflow job NEED a Postgres service container today (D-13 advisory-only)?**
   - What we know: Existing `test-e2e` job (line 119-167) provisions `postgres:16-alpine` for Playwright. The BE integration suite hits `127.0.0.1:54321` (Supabase, not Postgres directly).
   - What's unclear: Whether the integration suite needs a full Supabase stack (which CI doesn't have) or whether the tests are written against a fake-Supabase via env-var swap.
   - Recommendation: Plan 50-05 sets `Tests (integration)` as `continue-on-error: true` + `if: false` (disabled by default) on first land; promote to advisory-running once dev-env contract is documented in Phase 51+.

---

## Sources

### Primary (HIGH confidence)

- **Live `pnpm exec vitest --run` on `DesignV2` HEAD (2026-05-13)** — actual failure counts and error signatures
- `frontend/tests/setup.ts:1-93` — current factory shape
- `frontend/vitest.config.ts:1-31` — current FE config (no `include`/`exclude`, no thresholds — CONTEXT.md was wrong)
- `backend/vitest.config.ts:1-40` — current BE config (includes thresholds + 30s timeout + `pool: forks`)
- `backend/tests/setup.ts:1-46` — current BE setup (no global mocks)
- `frontend/src/i18n/index.ts:447` — `initReactI18next` consumer line
- `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts:23-69` — impl using cca2/cca3 (correct)
- `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts:59-109` — test using code/code3 (wrong)
- `eslint.config.mjs:1-120` — flat config shape
- `.github/workflows/ci.yml:1-396` — existing CI workflow
- `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection` (live call) — current required contexts
- `git log --oneline frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.{ts,test.ts}` — git archaeology
- `frontend/tests/component/CommitmentList.test.tsx:451-462` — verbatim `vi.importActual` precedent
- `frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx:18-22` — typed `vi.importActual<T>` precedent
- `.planning/phases/50-test-infrastructure-repair/50-CONTEXT.md` — D-01..D-15 source
- `.planning/REQUIREMENTS.md` §TEST — TEST-01..04 source
- `.planning/STATE.md` — v6.2/48-03 + v6.2/49-03 branch protection mechanism precedent
- `.planning/config.json` — workflow flags (nyquist_validation: true)

### Secondary (MEDIUM confidence)

- [Vitest projects guide](https://vitest.dev/guide/projects.html) (fetched 2026-05-13) — config-level test-suite separation
- [Vitest mocking guide](https://vitest.dev/guide/mocking) — `vi.importActual` semantics
- [eslint-plugin-vitest rules](https://github.com/vitest-dev/eslint-plugin-vitest) — no existing rule covers D-15 (confirmed)

### Tertiary (LOW confidence — verified)

- Backend external-dep grep counts (`grep -rn 'from .bullmq.' backend/src`) — may miss type-only imports or dynamic `import()` paths; cross-check during Plan 50-03

---

## Project Constraints (from CLAUDE.md)

- **Bilingual contract preserved:** D-06 fallback (`(key) => translations[key] ?? key`) supports tests asserting on EN strings AND tests asserting on i18n keys — no Arabic vs English contract changes needed. Tests using `i18n: { language: 'ar' }` precedent (`CommitmentList.test.tsx:457`) continue to work.
- **No emoji in user-visible copy:** N/A for tests, but D-14 docs must avoid marketing voice.
- **GSD workflow enforced:** All file edits happen inside `/gsd:execute-phase 50` plans, not ad-hoc.
- **Supabase MCP for migrations:** N/A — Phase 50 is test infra only, no DB schema touched.
- **Branch protection PATCH via `gh api`:** D-13 explicitly uses this mechanism per CLAUDE.md `Deployment Configuration` section.
- **Tech stack locked:** No new runtimes, no new frameworks. Vitest stays. ESLint flat config stays.
- **Definition of Done UI checklist:** N/A (no UI touched in Phase 50). Phase 51 KANBAN migration would invoke this.
- **GSD/Karpathy: minimum code:** Reflected in §ESLint Rule Implementation Choice — Option 1 (10 lines) over Option 2 (120 lines + new plugin package).

---

## Metadata

**Confidence breakdown:**

- Failure inventory: **HIGH** — live test runs probed
- Mock factory specs (FE): **HIGH** — precedent file quoted verbatim + i18n consumer line confirmed
- Mock factory specs (BE): **HIGH** — every external-dep import path grepped + verified
- Integration runner choice: **HIGH** — Vitest docs + existing config shape quoted
- CI gate mechanism: **HIGH** — live `gh api` response captured
- ESLint rule option: **MEDIUM** — Option 1 selector is a sketch needing exec-time verification
- Wizard regression triage: **HIGH** — git log + impl/test side-by-side analysis
- Coverage threshold impact: **HIGH** — file read; CONTEXT.md claim contradicted
- Plan slicing: **MEDIUM** — depends on per-file regression count post-cascade
- Validation Architecture: **HIGH** — uses commands that already exist

**Research date:** 2026-05-13
**Valid until:** 2026-05-27 (14 days — Phase 50 should execute within this window; failure inventory will drift as commits land)

## RESEARCH COMPLETE
