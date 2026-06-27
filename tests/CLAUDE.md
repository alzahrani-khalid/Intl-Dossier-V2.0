# Testing guidance

Directory-specific notes for the repo's test suites. The root `/CLAUDE.md`
covers project-wide conventions; this file maps where tests live, which runner
owns which files, and the traps that make a green test misleading. Read the root
file first.

## Runners and where each suite lives

The repo mixes **Vitest** (unit/integration/component) and **Playwright** (E2E,
plus some a11y). The split is by file extension and directory, not by one global
config.

| Location                                                                             | Runner     | What                                                                |
| ------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------- |
| `backend/tests/**`                                                                   | Vitest     | backend unit + integration (`.integration.test.ts` is its own tier) |
| `frontend/src/**/__tests__/`                                                         | Vitest     | colocated component/hook tests (~48 `__tests__` dirs)               |
| `frontend/tests/component/`, `frontend/tests/unit/`                                  | Vitest     | component tests kept outside `src`                                  |
| `frontend/tests/e2e/**/*.spec.ts`                                                    | Playwright | the main E2E suite (bulk of E2E)                                    |
| `frontend/tests/a11y/**/*.spec.ts`                                                   | Playwright | a11y E2E (`wcag-compliance.test.tsx` is the one Vitest file there)  |
| top-level `tests/e2e/**/*.spec.ts`                                                   | Playwright | legacy E2E tree (login, engagement lifecycle, …)                    |
| top-level `tests/{unit,contract,integration,security,visual,performance,a11y,load}/` | Vitest     | cross-cutting suites                                                |
| top-level `tests/regression/`                                                        | —          | markdown summaries only, no specs                                   |

Rule of thumb in the frontend: **`.spec.ts` = Playwright, `.test.ts(x)` =
Vitest.** `frontend/vitest.config.ts` excludes `**/*.spec.*`, so a Playwright
spec will never run under Vitest.

## Vitest configs (separate unit vs integration in the backend)

- `backend/vitest.config.ts` — **unit**, the required CI job. `environment:
'node'`, `pool: 'forks'`, `setupFiles: ['backend/tests/setup.ts']`. `include`
  covers `tests/unit`, `tests/services`, `tests/security`, `tests/intelligence`.
  Coverage thresholds: 80 (branches 75). Crucially it **excludes**
  `tests/**/*.integration.test.ts` and `tests/contract`, `tests/integration`,
  `tests/performance`.
- `backend/vitest.integration.config.ts` — **integration**, the non-required job.
  `mergeConfig` over the unit config; `include` is `tests/contract`,
  `tests/integration`, `tests/performance`; longer 60s timeouts.
- `frontend/vitest.config.ts` — the **only** frontend Vitest config. `react()`
  plugin, `environment: 'jsdom'`, `setupFiles: ['./tests/setup.ts']`,
  `include: ['**/*.test.{ts,tsx}']`, excludes `**/*.spec.*`. No coverage
  thresholds set.
- A root `/vitest.config.ts` exists but is largely legacy; active work runs
  per-workspace via Turbo.

The **backend integration suffix matters**: name real-service tests
`*.integration.test.ts` so they route to the non-required integration job instead
of breaking the required unit job (e.g.
`backend/tests/intelligence/alert-fanout.integration.test.ts`). Three
`backend/src/**/*.test.ts` files are colocated but **not in any `include` glob**,
so they never run — do not put new backend tests in `src`.

## Playwright (two configs, two auth mechanisms)

- `playwright.config.ts` (root) — `testDir: './tests/e2e'`. Projects: `setup`,
  `chromium-en`, `chromium-ar-smoke` (`ar-SA`), `chromium-mobile` (Pixel 7,
  `@mobile`). Auth via `tests/e2e/support/auth.setup.ts`, which logs in **three
  roles** from `E2E_<ROLE>_EMAIL` / `_PASSWORD` and writes per-role
  `tests/e2e/support/storage/<role>.json`.
- `frontend/playwright.config.ts` — `testDir: frontend/tests`, `testMatch:
['e2e/**/*.spec.ts', 'accessibility/**/*.spec.ts']`. A `globalSetup` logs in
  **once** with `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` and persists
  `frontend/tests/e2e/.auth/storageState.json` (gitignored). Visual projects use
  tight diff rules (`maxDiffPixelRatio: 0.01`, `animations: 'disabled'`).

Both read `baseURL` from **`E2E_BASE_URL`** (defaults to `http://localhost:5173`).
When `E2E_BASE_URL` is unset the root config spins up `pnpm dev`; when set it
targets that URL — so E2E can run against **localhost or the deployed staging
app** depending on the env var. The E2E CI workflow tests the deployed app, so a
stale `E2E_*_PASSWORD` masks deeper failures as a login wall.

## Test credentials — env only, never hardcoded

Tests read credentials from `process.env`. `.env.test` is gitignored; only the
`.env.test.example` files are tracked. For local runs, set values in `.env.test`
(root, and `backend/.env.test` for backend integration).

Variables that exist (names only):

- Single-user (legacy, still used by the frontend Playwright setup):
  `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.
- Role-scoped (root Playwright setup): `E2E_ADMIN_EMAIL/PASSWORD`,
  `E2E_ANALYST_EMAIL/PASSWORD`, `E2E_INTAKE_EMAIL/PASSWORD`.
- `E2E_BASE_URL`; Supabase keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — service-role used by the e2e cleanup helper).
- Backend integration also needs `REDIS_*` and `ANYTHINGLLM_*`.

Both Playwright setups **throw** if their required credential vars are missing, so
a misconfigured `.env.test` fails fast rather than running anonymously.

## i18n in component tests is a hardcoded mock — do not trust it for translations

Frontend component/unit tests do **not** load the real i18n bundles from
`frontend/src/i18n/`. `frontend/tests/setup.ts` (the global Vitest setup) mocks
`react-i18next` so `useTranslation().t` resolves against a hardcoded, ~220-entry,
**English-only** key→string map. Its resolution order is:

```
hardcoded map[key] ?? hardcoded map[key-with-':'→'.'] ?? caller defaultValue ?? raw key
```

On top of that, ~71 files under `frontend/src/**` declare their own top-of-file
`vi.mock('react-i18next', …)` that overrides the global mock with a pure identity
/ `defaultValue` stub (no dictionary at all).

Consequence: a missing or untranslated key **silently passes** (it falls through
to the raw key or a default), and Arabic is never exercised. These tests cannot
catch i18n bundle gaps or RTL regressions. Real-bundle i18n behavior is only
validated by the **Playwright E2E layer** (which runs the actual app with the real
bundles). When you add or rename translation keys, verify them via E2E or by
running the app — not via component tests.

## Commands

- All workspaces: `pnpm test` (Turbo fans out to each `test` script).
- Backend unit: `pnpm -C backend test`. Backend integration:
  `pnpm -C backend test:integration`.
- Frontend component/unit: `pnpm -C frontend test`.
- Frontend E2E (main suite): `pnpm -C frontend test:e2e`. Legacy E2E (en +
  ar-smoke): root `pnpm test:e2e:ci`.
- Coverage: `pnpm -C backend test:coverage` / `turbo run test:coverage`.

Known broken script: `frontend`'s `test:a11y` points at a `vitest.a11y.config.ts`
that does not exist. Real a11y runs through the Playwright `frontend/tests/a11y/`
specs and the `qa-sweep-axe` sweep (`pnpm -C frontend test:qa-sweep`).

## Writing tests here

- Follow AAA (Arrange-Act-Assert) and descriptive `test('...')` names per the
  root testing rules. Backend coverage target is 80% (branches 75%).
- New backend tests go under `backend/tests/`, not `backend/src/`. Suffix
  real-service tests `*.integration.test.ts`.
- New frontend component tests go in a colocated `__tests__/` dir next to the
  component. Use `.test.tsx`. Assume the i18n mock above — assert on stable text
  or roles, and do not rely on real translations.
- New E2E specs go under `frontend/tests/e2e/` as `*.spec.ts` and reuse the shared
  `storageState`; add `tests/e2e/...` only when extending the legacy suite.
