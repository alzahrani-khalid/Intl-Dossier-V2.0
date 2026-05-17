# Frontend test setup

Last reviewed: 2026-05-14 (Phase 50)
Phase artifact: `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md`

This document is the contract for the frontend Vitest runner. It is for contributors who add or update frontend tests and need to preserve the Phase 50 test-infrastructure guarantees.

## 1. Test runner architecture

The canonical command is:

```bash
pnpm --filter intake-frontend test --run
```

The runner is defined in `frontend/vitest.config.ts`:

| Setting       | Contract                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `environment` | `jsdom` for React component and hook tests.                                                         |
| `setupFiles`  | `./tests/setup.ts` registers jest-dom, MSW, browser polyfills, env stubs, and the global i18n mock. |
| `include`     | `**/*.test.{ts,tsx}`; Playwright `.spec.*` files are not part of the default Vitest runner.         |
| `exclude`     | `node_modules/`, build outputs, `**/*.spec.*`, and the explicit integration/performance split rows. |
| aliases       | `@` maps to `frontend/src`; `@tests` maps to `frontend/tests`.                                      |

MSW handlers live under `frontend/tests/mocks/server.ts` and are reset after each test in `frontend/tests/setup.ts`. The current frontend config does not enforce coverage thresholds; the earlier CONTEXT note claiming FE thresholds existed was incorrect and is logged in the audit.

### Runner checklist

Before changing the runner config, answer these checks in the commit or summary:

| Check                                                          | Expected answer                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Does the file belong to Vitest?                                | It should end in `.test.ts` or `.test.tsx`.                                                 |
| Does the file belong to Playwright?                            | It should end in `.spec.ts` or `.spec.tsx` and stay outside Vitest.                         |
| Does the file require a real browser?                          | Keep it in Playwright or a future integration runner.                                       |
| Does the file require Supabase, Redis, or an HTTP server?      | Mock it for the default runner or move it to an explicit integration runner.                |
| Does the test depend on a global browser API missing in jsdom? | Add a guarded polyfill in `frontend/tests/setup.ts` only when several tests share the need. |

Do not widen `include` to catch all test-like names. Phase 50 fixed the failure mode where Vitest collected Playwright files and reported misleading module errors. Keep the default runner boring: React unit tests, component tests, hook tests, and utility tests only.

### MSW handler checklist

Use MSW for frontend HTTP behavior when the component calls `fetch`, `apiClient`, or a repository wrapper. Keep handlers close to the test when the behavior is unique, and move them to `frontend/tests/mocks` only when several suites share the same endpoint.

| Handler concern   | Expected pattern                                                                |
| ----------------- | ------------------------------------------------------------------------------- |
| Success response  | Return the smallest JSON body the component reads.                              |
| Error response    | Return the actual status code and error shape the component handles.            |
| Per-test override | Use `server.use(...)` in the test and let setup reset handlers after each case. |
| Unhandled request | Treat it as a test failure; add an explicit handler or mock the repository.     |
| Shared fixtures   | Build them with deterministic defaults and per-test overrides.                  |

## 2. The react-i18next mock contract

Frontend modules can transitively import `frontend/src/i18n/index.ts`, which calls `i18n.use(initReactI18next).init(...)` during module evaluation. The global `react-i18next` mock must surface `initReactI18next` and every other real package export, otherwise tests fail before assertions run.

The canonical pattern is `vi.importActual` plus spread plus local overrides:

```ts
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, paramsOrDefault?: any, options?: any) => {
        const translations: Record<string, string> = {
          'afterActions.decisions.title': 'Decisions',
          'common.cancel': 'Cancel',
        }
        return translations[key] ?? key
      },
      i18n: { language: 'en', dir: () => 'ltr' },
    }),
    Trans: ({ children }: any) => children,
  }
})
```

The important part is `vi.importActual` and `...actual`. Do not list package exports by hand. Missing exports break at module-eval time, far away from the test that introduced the mock. The same `vi.importActual` precedent appears in `frontend/tests/component/CommitmentList.test.tsx` and in the typed-spread pattern used by `frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx`.

The `t()` function intentionally falls back to `translations[key] ?? key`. Tests may assert translated English text or the i18n key when a key is intentionally outside the local map; keep that mixed assertion model until a test owns the missing key.

### Mock review checklist

Use this checklist when adding a new `vi.mock(...)` factory:

| Question                                               | Required action                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Is this a partial module mock?                         | Use `vi.importActual` and spread the real module first.                   |
| Does production import named exports from the module?  | Preserve all real named exports through `...actual`.                      |
| Is only one hook/function under test-specific control? | Override only that hook/function after the spread.                        |
| Does the factory return a chain object?                | Return a stable chain object, not a newly-created object per method call. |
| Does the mock need async setup?                        | Make the factory `async` and await `vi.importActual`.                     |

Prefer local per-test overrides over adding special cases to the global setup file. Global setup is for cross-suite infrastructure: browser gaps, MSW lifecycle, env stubs, and mocks that must be present before module evaluation.

### Translation key policy

The translation map in `frontend/tests/setup.ts` is intentionally small and test-oriented. Add keys when a test asserts user-visible copy from a component that already relies on the global i18n mock. Do not paste full locale files into setup. If a test needs broad locale coverage, use the real i18n provider in that test or promote the coverage to an integration-style test.

When adding keys:

1. Keep the namespace grouped with related keys.
2. Prefer the current product copy from the component or locale file.
3. Preserve interpolation placeholders such as `{{count}}` or `{{value}}`.
4. Run the specific test and the containing folder before committing.
5. Record any shared setup change in the plan summary.

## 3. Mocking external dependencies

Use global setup for dependencies used across many tests, then refine behavior per test with `vi.mocked(...)`. Keep factories stable so each test can override only the behavior it needs.

Supabase-style chain mock:

```ts
const chain = {
  select: vi.fn(() => chain),
  eq: vi.fn(() => chain),
  single: vi.fn(async () => ({ data: null, error: null })),
}

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn(() => chain) },
}))
```

Redis-style state mock for backend-like tests:

```ts
const store = new Map<string, string>()
const redis = {
  get: vi.fn(async (key: string) => store.get(key) ?? null),
  set: vi.fn(async (key: string, value: string) => {
    store.set(key, value)
    return 'OK'
  }),
  del: vi.fn(async (key: string) => Number(store.delete(key))),
}
```

BullMQ-style constructor mock:

```ts
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({ add: vi.fn(), close: vi.fn(async () => undefined) })),
  Worker: vi.fn().mockImplementation(() => ({ close: vi.fn(async () => undefined) })),
  QueueEvents: vi.fn().mockImplementation(() => ({ close: vi.fn(async () => undefined) })),
}))
```

LLM SDK mock:

```ts
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(async () => ({ content: [{ type: 'text', text: '{"mock":true}' }] })),
    },
  })),
}))
```

Backend-specific full recipes live in `backend/docs/test-setup.md`.

## 4. Unit vs integration runner

The default runner is mocked-only. It must pass in a clean checkout without Supabase, Redis, a local Express server, or external AI credentials. This keeps CI deterministic and makes unit/component failures local to code changes.

The integration runner is the opt-in real-service suite. Backend owns an integration runner today through `pnpm --filter intake-backend test:integration`; frontend does not currently need a separate integration runner after Phase 50 deleted dead integration-style files and kept Playwright under `.spec.*`.

If frontend adds an integration runner later, mirror the backend `mergeConfig` pattern and keep the default `pnpm --filter intake-frontend test --run` mocked-only. Document any new integration runner in this file and in the Phase audit.

### Integration promotion checklist

Move a frontend test out of the default runner only when at least one of these is true:

| Signal                                                     | Route                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Needs browser APIs beyond stable jsdom polyfills           | Playwright or browser integration runner                                  |
| Needs a real Supabase project or live auth session         | Integration runner                                                        |
| Needs network timing, websocket behavior, or multiple tabs | Playwright                                                                |
| Tests visual layout or screenshots                         | Playwright visual suite                                                   |
| Fails because product behavior changed                     | Keep in default runner and fix test or implementation through D-10 triage |

Every promotion needs two traces: a config change that removes the file from the default runner, and an audit or summary row explaining why the file is not a unit/component test.

## 5. Common pitfalls

| Pitfall                                               | What goes wrong                                                                 | How to avoid it                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Missing `await` on `vi.importActual`                  | The factory spreads a Promise instead of module exports.                        | Use an async factory and await `vi.importActual`.                                  |
| Chain mocks return new objects                        | Per-test refinements modify one chain while the component receives another.     | Return the same chain object from each chain method.                               |
| `vi.clearAllMocks()` wipes implementations by mistake | Tests lose factory behavior after setup.                                        | Use clear for call history; use reset only when the test restores implementations. |
| Playwright `.spec.ts` files enter Vitest              | Vitest executes Playwright APIs and fails before assertions.                    | Keep `include: ['**/*.test.{ts,tsx}']` and `**/*.spec.*` excluded.                 |
| ESLint flags canonical setup                          | A rule rejects `frontend/tests/setup.ts` even though it spreads actual exports. | The D-15 rule must allow a `SpreadElement` created from `vi.importActual`.         |
| BullMQ close is missing                               | Shutdown code awaits `close()` and fails.                                       | Mock `close` as `vi.fn(async () => undefined)`.                                    |
| Backend fork pool hides state sharing                 | In-memory mocks do not persist across files.                                    | Treat each file as isolated; set up needed state in that file.                     |

## 6. Fixture patterns

Prefer small fixture factories with deterministic defaults and an override object:

```ts
function createMockCountry(overrides: Partial<Country> = {}): Country {
  return {
    id: 'country-1',
    name: 'Kuwait',
    iso_code_2: 'KW',
    region: 'asia',
    ...overrides,
  }
}
```

For hooks, set a default global mock and override per test:

```ts
vi.mocked(useQuery).mockReturnValue({ data: createMockCountry(), isLoading: false } as any)
```

Keep fixtures near the test when they are test-specific. Move them to `frontend/tests/utils` only when at least two suites need the same shape.

## 7. Custom ESLint rule: vi-mock-exports-required (D-15)

The D-15 lint rule flags `vi.mock(<id>, factory)` factories whose returned object lacks a spread. The intent is to force `vi.importActual` plus spread as the safe default for partial module mocks.

Bad:

```ts
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
```

Good:

```ts
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return { ...actual, useTranslation: () => ({ t: (key: string) => key }) }
})
```

The rule lives in `eslint.config.mjs` and is scoped to test-file globs. Its message points back to this section.

### Commit checklist

Before committing frontend test-infrastructure changes:

1. Run the narrow file or folder that changed.
2. Run `pnpm --filter intake-frontend test --run` when shared setup changed.
3. Confirm no Playwright `.spec.*` file was added to the Vitest include path.
4. Confirm any new `vi.mock(...)` partial factory spreads `vi.importActual`.
5. Update this document when a new shared pattern becomes canonical.
