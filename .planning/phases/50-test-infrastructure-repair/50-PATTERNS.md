# Phase 50: Test Infrastructure Repair — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 14 (7 MODIFY + 5 CREATE + 2 ANCILLARY)
**Analogs found:** 12 / 14 (2 are partly novel — planner decides shape)

---

## File Classification

| New/Modified File                                                                   | Action | Role              | Data Flow        | Closest Analog                                                                         | Match Quality          |
| ----------------------------------------------------------------------------------- | ------ | ----------------- | ---------------- | -------------------------------------------------------------------------------------- | ---------------------- |
| `frontend/tests/setup.ts`                                                           | MODIFY | test-setup        | module-init      | `frontend/tests/component/CommitmentList.test.tsx:451-462`                             | exact (verbatim shape) |
| `backend/tests/setup.ts`                                                            | MODIFY | test-setup        | module-init      | `frontend/tests/setup.ts` (post-D-05) + RESEARCH §Mock Factory Specs                   | role-match             |
| `frontend/vitest.config.ts`                                                         | MODIFY | config            | build/test       | `backend/vitest.config.ts` (already has `include`)                                     | exact (sibling config) |
| `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts`                | MODIFY | hook (product)    | request-response | self (lines 50-69) — defensive-null-guard hardening only                               | self-reference         |
| `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts` | MODIFY | test              | mock-fixture     | `frontend/tests/component/CommitmentList.test.tsx` (vi.mock + renderHook pattern)      | role-match             |
| `eslint.config.mjs` (root)                                                          | MODIFY | config            | lint-AST         | self lines 148-198 (existing `no-restricted-syntax` block for RTL physical CSS)        | exact (extends block)  |
| `package.json` (backend)                                                            | MODIFY | config            | script-registry  | `backend/package.json:11-12` (existing `test` + `test:coverage`)                       | exact                  |
| `.github/workflows/ci.yml`                                                          | MODIFY | CI workflow       | job-dispatch     | `.github/workflows/ci.yml:65-88` (`type-check` job — per-workspace `pnpm --filter`)    | exact (mirror shape)   |
| `backend/vitest.integration.config.ts`                                              | CREATE | config            | build/test       | `backend/vitest.config.ts` + vitest `mergeConfig` pattern                              | role-match             |
| `frontend/docs/test-setup.md`                                                       | CREATE | doc (contributor) | reference        | `frontend/docs/bundle-budget.md`                                                       | role-match             |
| `backend/docs/test-setup.md`                                                        | CREATE | doc (contributor) | reference        | `frontend/docs/test-setup.md` (once written) + `frontend/docs/bundle-budget.md`        | role-match             |
| `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md`                   | CREATE | audit artifact    | classification   | `.planning/milestones/v6.2-MILESTONE-AUDIT.md` (frontmatter + table-of-failures shape) | role-match (audit doc) |
| `tools/eslint-plugin-intl-dossier/` (only if D-15 Option 2)                         | CREATE | tooling (eslint)  | lint-AST         | **NOVEL — no existing `tools/` directory in repo**                                     | none                   |
| `tools/eslint-fixtures/bad-vi-mock.ts` (optional D-15 fixture)                      | CREATE | test fixture      | static-analysis  | **NOVEL — no `tools/eslint-fixtures/` precedent**                                      | none                   |

**Verified absence:** `tools/` directory does **not** exist at repo root (Bash `ls tools/` returned exit 1). Both `tools/eslint-plugin-intl-dossier/` and `tools/eslint-fixtures/` would be greenfield paths. RESEARCH §ESLint Rule Implementation Choice recommends **Option 1 (`no-restricted-syntax` inline in `eslint.config.mjs`)** as the cheapest viable path — this AVOIDS creating either tools/ path. Plan should default to Option 1 and only create `tools/` if Option 2 is chosen.

**Verified absence:** `frontend/docs/test-setup.md` and `backend/docs/test-setup.md` do not exist (Bash listing of `frontend/docs/` returned only `bundle-budget.md`; `backend/docs/` returned empty/no-exit-0).

**Note on root `vitest.config.ts`:** A third vitest config exists at `/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/vitest.config.ts` (root level, 41 lines, jsdom env, coverage thresholds 80/80/80/80). Not referenced by any workspace `pnpm test` script (FE and BE both use their own config paths). Likely a legacy stray; planner should flag in audit (`disposition: queued-out-of-scope` or `deleted-dead`) but Phase 50 doesn't need to edit it.

---

## Pattern Assignments

### `frontend/tests/setup.ts` (test-setup, module-init) — MODIFY

**Action:** Rewrite the `vi.mock('react-i18next')` factory per D-05 (`importActual + spread + override`).

**Verbatim lines that change:** `frontend/tests/setup.ts:6-81` (the 76-line factory block ending at the closing `}));`).

**Closest analog — same-file precedent already in repo (verbatim):**

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

**Second precedent — typed spread (verbatim):**

```typescript
// frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx:18-22
vi.mock('../ensureWorld', async () => {
  const d3Real = await vi.importActual<typeof import('d3-geo')>('d3-geo')
  const shim: typeof import('d3-geo') = {
    ...d3Real,
    geoOrthographic: (): ReturnType<typeof d3Real.geoOrthographic> => {
```

**Current broken shape (verbatim, will be replaced):**

```typescript
// frontend/tests/setup.ts:6-81
vi.mock('react-i18next', () => ({
  // ← synchronous factory; no importActual
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'afterActions.decisions.title': 'Decisions',
        // ... 60 keys ...
        'common.selectDate': 'Select date',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: any) => children,
})) // ← misses initReactI18next, I18nextProvider, withTranslation, Translation, etc.
```

**Target shape (D-05 + D-06 preserve translation map):**

```typescript
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: any) => {
        const translations: Record<string, string> = {
          // existing 60-key map preserved VERBATIM (D-06) — lines 11-72 of current setup.ts
        }
        return translations[key] ?? key
      },
      i18n: { language: 'en' },
    }),
    Trans: ({ children }: any) => children,
  }
})
```

**Preserve verbatim (lines 1-3, 83-93 unchanged):**

```typescript
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// ... factory ...

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())
```

**Gotchas:**

- D-05 factory MUST be `async () => { ... }`, not `() => ({ ... })`. Sync factories cannot `await vi.importActual`.
- `vi.importActual<typeof import('react-i18next')>('react-i18next')` — keep the typed-generic for editor autocomplete. The precedent at `GlobeLoader.reducedMotion.test.tsx:19` uses the typed form; copy that.
- Existing setup uses semicolons + double-quotes (lines 1-3 are post-Prettier; current Prettier config in the repo is `semi: false` + `singleQuote: true` per CLAUDE.md). Plan should NOT reformat the existing semicolon style; treat the file as locally formatted and only diff the factory block. Resists noise diffs.
- The 60-key `translations` map (lines 11-72) MUST be preserved verbatim per D-06; mass-rewrite is forbidden.

---

### `backend/tests/setup.ts` (test-setup, module-init) — MODIFY

**Action:** Add global `vi.mock(...)` factories for `@/config/supabase`, `ioredis`, `bullmq`, `@anthropic-ai/sdk`, `openai`, `@xenova/transformers` (D-07 + D-08).

**Verbatim lines that change:** `backend/tests/setup.ts:1-46` — full rewrite. Current file has ZERO global mocks (only env-var loading + warning).

**Current shape (verbatim, 46 lines — to be extended):**

```typescript
// backend/tests/setup.ts:1-46
import { beforeAll, afterAll, afterEach } from 'vitest'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '../../.env') })
config({ path: path.resolve(__dirname, '../.env.test') })

process.env.NODE_ENV = 'test'

beforeAll(async () => {
  console.log('🧪 Setting up test environment...')
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY']
  const missing = requiredEnvVars.filter((varName) => !process.env[varName])
  if (missing.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missing.join(', ')}\n   Some tests may fail. Create a .env.test file with test database credentials.`,
    )
  }
  console.log('✅ Test environment ready')
})
afterAll(async () => {
  console.log('✅ Test environment cleaned up')
})
afterEach(async () => {
  /* no-op */
})
```

**Closest analog — the rewritten FE `frontend/tests/setup.ts` (post-D-05) for the shape "global vi.mock + spread + override".** Backend has no in-repo precedent for global mocks; planner uses RESEARCH §Mock Factory Specs verbatim as the analog (lines 274-414 of `50-RESEARCH.md`).

**Module paths to mock (verified by RESEARCH §Mock Factory Specs):**

| Module                 | Import in backend src                                                                                | Mock shape recipe                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `@/config/supabase`    | `backend/src/config/supabase.ts:15` (exports `supabaseAdmin`, `supabaseAnon`)                        | Chainable `from()` builder + `rpc` + `auth` + `storage`            |
| `ioredis`              | `backend/src/config/redis.ts:1` (`import Redis from 'ioredis'` — default import)                     | `default` + named `Redis` — Map-backed stub                        |
| `bullmq`               | `backend/src/queues/notification.queue.ts:1` (named: `Queue`, `Worker`, `QueueEvents`)               | All three as `vi.fn().mockImplementation`                          |
| `@anthropic-ai/sdk`    | `backend/src/ai/llm-router.ts`, `agents/brief-generator.ts`, `chat-assistant.ts`, `intake-linker.ts` | `default` class with `messages.create` returning canned text       |
| `openai`               | `backend/src/ai/embeddings-service.ts`, `backend/src/ai/config.ts`                                   | `default` class with `embeddings.create` returning 1536-dim vector |
| `@xenova/transformers` | `backend/src/ai/embeddings-service.ts` (pipeline)                                                    | `pipeline()` returning async embed function                        |

**Path resolution gotcha (verified):**

- `backend/vitest.config.ts:36` declares `resolve.alias.@: ./src`, so `vi.mock('@/config/supabase', ...)` resolves cleanly. **No `import.meta.resolve` needed.**
- `backend/vitest.config.ts:9` uses `pool: 'forks'` — each test file is its own process; in-memory Map state does NOT leak between files (this is the right setting; see Pitfall 7 in RESEARCH).
- `ioredis` is CJS exposed as both `default` + named `Redis` — mock MUST return `{ default: Redis, Redis }`. Verified by `backend/src/config/redis.ts:1` using `import Redis from 'ioredis'`.
- `bullmq` is ESM with named exports — mock returns named bindings only, no `default`.

**ESM/CJS interop notes:**

- `backend/package.json:4` declares `"type": "module"` — backend src is pure ESM.
- `vi.mock` is hoisted by vitest's transform regardless of ESM/CJS; factories are evaluated lazily.
- The `dotenv` calls at lines 5-6 of current setup MUST remain BEFORE the new `vi.mock` calls (env-vars feed Supabase URL/Key construction in real modules — for the mocks, env is moot, but ordering preserves the original "env loaded first" contract).

**Recipe to copy verbatim:** RESEARCH `50-RESEARCH.md:274-414` (full `backend/tests/setup.ts` rewrite shape). Planner consumes that block as-is.

---

### `frontend/vitest.config.ts` (config, build/test) — MODIFY

**Action:** Add `include: ['**/*.test.{ts,tsx}']` (or `exclude: ['**/*.spec.*']`) to drop 175 Playwright misglobbed files (RESEARCH §Failure Inventory G1).

**Verbatim lines that change:** Add 1-2 lines inside the `test: { ... }` block (currently `frontend/vitest.config.ts:7-24`).

**Closest analog — the sibling `backend/vitest.config.ts:29-30` (verbatim):**

```typescript
// backend/vitest.config.ts:29-30
include: ['tests/**/*.test.ts'],
exclude: ['node_modules/', 'dist/'],
```

**Current FE config (verbatim, 31 lines):**

```typescript
// frontend/vitest.config.ts
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

**Target shape (add 1 line inside `test:`):**

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./tests/setup.ts'],
  css: true,
  include: ['**/*.test.{ts,tsx}'],              // ← NEW (RESEARCH G1 cascade)
  exclude: ['node_modules/', 'dist/', 'build/', '**/*.spec.*'],  // ← NEW (defensive)
  coverage: { ... unchanged ... }
}
```

**Gotchas:**

- Vitest default `include` is `**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}` — picks up Playwright's `.spec.ts` files. The single-line `include: ['**/*.test.{ts,tsx}']` overrides default and clears 175 failures.
- Coverage `exclude` already has `tests/` (line 17). Don't touch.
- Aliases `@` and `@tests` (lines 26-29) are referenced by EVERY test file — preserve verbatim.
- The CONTEXT.md claim of "80% line/function/75% branch thresholds in frontend/vitest.config.ts" is **incorrect per RESEARCH §Coverage Threshold Impact** — the FE config has NO thresholds. Planner audit should note this drift but Phase 50 doesn't need to ADD thresholds (deferred per CONTEXT §80%+ coverage push).

---

### `frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts` (hook, request-response) — MODIFY

**Action:** Add defensive `match.cca2 != null` / `match.cca3 != null` null-guards (D-09 product hardening). Today only checks `!== ''`, so `undefined` slips through.

**Verbatim lines that change:** `useCountryAutoFill.ts:55-66` (the four `if (current.X === '' && match.Y !== '')` blocks).

**Self-reference analog (verbatim current shape):**

```typescript
// frontend/src/components/dossier/wizard/hooks/useCountryAutoFill.ts:50-69
useEffect(() => {
  if (match == null) return

  const current = form.getValues()

  if (current.iso_code_2 === '' && match.cca2 !== '') {
    // ← only checks empty-string, not undefined
    form.setValue('iso_code_2', match.cca2)
  }
  if (current.iso_code_3 === '' && match.cca3 !== '') {
    form.setValue('iso_code_3', match.cca3)
  }
  if (current.region === '' && match.region !== '') {
    const mapped = REGION_MAP[match.region] ?? ''
    if (mapped !== '') {
      form.setValue('region', mapped)
    }
  }
  if (current.capital_en === '' && match.capital != null && match.capital.length > 0) {
    form.setValue('capital_en', match.capital[0]) // ← capital ALREADY has != null guard — copy this idiom
  }
}, [match, form])
```

**Target shape (extend `!= null` idiom from line 67 to lines 55-65):**

```typescript
if (current.iso_code_2 === '' && match.cca2 != null && match.cca2 !== '') {
  form.setValue('iso_code_2', match.cca2)
}
if (current.iso_code_3 === '' && match.cca3 != null && match.cca3 !== '') {
  form.setValue('iso_code_3', match.cca3)
}
if (current.region === '' && match.region != null && match.region !== '') {
  // ...
}
```

**Gotchas:**

- `RestCountryResult` interface (lines 6-11) declares `cca2: string` etc. as non-optional — TS won't help here because `data[0] as RestCountryResult` (line 32) is an unchecked cast over `unknown`. The null-guard is a runtime defense, not a type-system fix.
- Type signature stays unchanged — don't widen `cca2: string` to `cca2?: string`; that would cascade through the codebase. Keep the runtime guard local.
- The `match.capital != null` guard at line 67 IS the in-file precedent — copy that exact idiom for `cca2`/`cca3`/`region`.

---

### `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts` (test, mock-fixture) — MODIFY

**Action:** Fix the test mock-shape regression (D-10) — change `code`/`code3`/`region: 'Asia'` to REST Countries `cca2`/`cca3`/`region: 'Asia'` + assertion `region: 'asia'` (post-`REGION_MAP` mapping).

**Verbatim lines that change:** `useCountryAutoFill.test.ts:60-66, 79, 83-89, 106` (the `mockMatch` literal in two `it` blocks + assertion on line 79).

**Current broken shape (verbatim):**

```typescript
// useCountryAutoFill.test.ts:60-66, 79
const mockMatch = {
  code: 'SA', // ← WRONG — REST Countries uses cca2
  code3: 'SAU', // ← WRONG — REST Countries uses cca3
  name_en: 'Saudi Arabia',
  name_ar: 'المملكة العربية السعودية',
  region: 'Asia',
}
// ...
expect(form.setValue).toHaveBeenCalledWith('region', 'Asia') // ← WRONG — impl maps 'Asia' → 'asia' via REGION_MAP
```

**Target shape (REST Countries v3.1 contract):**

```typescript
const mockMatch = {
  cca2: 'SA',
  cca3: 'SAU',
  region: 'Asia', // impl maps to 'asia'
  capital: ['Riyadh'],
}
// ...
expect(form.setValue).toHaveBeenCalledWith('region', 'asia') // post-REGION_MAP
expect(form.setValue).toHaveBeenCalledWith('capital_en', 'Riyadh')
```

**Closest analog — same-file second `it` block uses identical mock shape (verbatim lines 83-89, also needs same fix).**

**Gotchas:**

- Both `it` blocks (`auto-fills empty form fields when reference match found` line 59 and `does not overwrite user-entered values` line 82) use the same wrong `mockMatch` shape — fix BOTH.
- The `code`/`code3` field-shape regression has been silent since commit `7943ad20` (2026-04-15) per RESEARCH archaeology. There is no impl history to preserve — the test was wrong from day 1.
- `vi.mock('@tanstack/react-query', ...)` at line 7-9 returns `useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false })` — keep verbatim. Per-test override at line 68 uses `vi.mocked(useQuery).mockReturnValue(...)` — this is the right pattern; don't touch.
- After this fix, the test's `it('does not overwrite user-entered values')` block (line 82) still needs the assertion `expect(form.setValue).not.toHaveBeenCalledWith('region', 'asia')` — the wrong field name AND the wrong region-mapped value both need correcting in tandem.

---

### `eslint.config.mjs` (root, lint-AST) — MODIFY

**Action:** Add D-15 `vi-mock-exports-required` rule. Per RESEARCH §ESLint Rule Implementation Choice recommendation = **Option 1 (`no-restricted-syntax` selector, ~10 lines)** inline in this file. Do NOT create `tools/eslint-plugin-intl-dossier/`.

**Verbatim insertion point:** A new top-level block before the existing frontend override (line 70) OR inside the test-file-specific files glob. RESEARCH §Code Examples lines 1158-1172 recommend a dedicated block scoped to test files only.

**Closest analog — same-file existing `no-restricted-syntax` block (verbatim, lines 148-198):**

```javascript
// eslint.config.mjs:148-198 (existing RTL physical-CSS bans)
'no-restricted-syntax': [
  'error',
  {
    selector: 'Literal[value=/\\bml-/]',
    message: 'Use ms-* (margin-start) instead of ml-* for RTL support.',
  },
  {
    selector: 'Literal[value=/\\bmr-/]',
    message: 'Use me-* (margin-end) instead of mr-* for RTL support.',
  },
  // ... 11 more selectors for pl-/pr-/text-left/text-right/left-/right-/rounded-l-/rounded-r-/border-l-/border-r-
],
```

**Target shape (D-15 rule added in a new files-scoped block):**

```javascript
// Add new top-level block (between line 200 and line 202 "UI library exception")
// — scoped to test files only so we don't lint product code
{
  files: ['**/tests/**/*.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        // D-15: force vi.mock(...) factories to use importActual + spread
        // Flags any `vi.mock(<id>, () => ({...}))` whose returned ObjectExpression has no SpreadElement.
        selector: "CallExpression[callee.object.name='vi'][callee.property.name='mock'] ArrowFunctionExpression > ObjectExpression:not(:has(SpreadElement))",
        message: 'vi.mock(...) factory must spread vi.importActual(<id>). Pattern: `async () => ({ ...(await vi.importActual<typeof import("mod")>("mod")), override: ... })`. See frontend/docs/test-setup.md §react-i18next-precedent.',
      },
    ],
  },
},
```

**Gotchas:**

- The existing frontend block (lines 71-200) ALREADY uses `no-restricted-syntax` for RTL physical-CSS bans. ESLint flat config does NOT merge two `no-restricted-syntax` arrays automatically — the second block REPLACES the first for files matching its glob. **The test-file block must NOT conflict with product-code globs.** The two globs intersect on test files inside `frontend/**/*.test.{ts,tsx}` — for those files, the test-rule block REPLACES the RTL block. **Acceptable** because (a) tests rarely use Tailwind class literals, and (b) D-15's value is on tests specifically.
- Alternative if conflict-avoidance becomes important: merge into the existing frontend block with both arrays of selectors in one `no-restricted-syntax` rule. Planner picks; RESEARCH recommends the scoped-block approach for cleaner intent signaling.
- **Pitfall 5 (RESEARCH:1003-1006):** Verify the AST selector PASSES on the rewritten `frontend/tests/setup.ts` AND on the existing precedents at `CommitmentList.test.tsx:451` and `GlobeLoader.reducedMotion.test.tsx:18` BEFORE landing. Selector should match only the BAD pattern (object literal without `SpreadElement`).
- Backend block (lines 226-242) sets `unused-imports/no-unused-imports: error` only — does NOT use `no-restricted-syntax`. The D-15 block is test-file-scoped and covers backend tests via `**/__tests__/**` glob — no conflict.

---

### `package.json` (backend workspace, script-registry) — MODIFY

**Action:** Add `"test:integration": "vitest --config ./vitest.integration.config.ts --run"` script (D-03 + RESEARCH §Integration Runner Choice Option B).

**Verbatim lines that change:** `backend/package.json:11-12` — extend the `scripts` block.

**Current shape (verbatim):**

```json
// backend/package.json:6-21
"scripts": {
  "dev": "NODE_ENV=development tsx watch src/index.ts",
  "build": "node build.mjs",
  "build:tsc": "tsc --project tsconfig.build.json",
  "start": "node dist/index.js",
  "test": "vitest --config ./vitest.config.ts",
  "test:coverage": "vitest --coverage --config ./vitest.config.ts",
  "lint": "cd .. && eslint -c eslint.config.mjs --max-warnings 0 'backend/src/**/*.ts'",
  ...
}
```

**Closest analog — the existing `test` + `test:coverage` lines** are the literal sibling pattern. Add a third `test:integration` line in the same block.

**Target shape:**

```json
"test": "vitest --config ./vitest.config.ts",
"test:integration": "vitest --config ./vitest.integration.config.ts --run",
"test:coverage": "vitest --coverage --config ./vitest.config.ts",
```

**Gotchas:**

- The new script MUST use `--run` (non-watch). The existing `test` script is missing `--run` (watch mode by default in CLI), so CI ends up passing `--run` separately via `pnpm --filter intake-backend test --run`. Pattern of "explicit `--run` for one-shot, default-watch for dev" continues.
- Frontend `package.json:12` (`"test": "vitest"`) follows the same convention — no `--run` baked in. Don't add `--run` to `test` — only to `test:integration`.
- No equivalent script needed in root `package.json` (Turbo's `turbo run test` will pick up new scripts automatically if added to `turbo.json`; check that file separately. Default behavior — Turbo only runs scripts named in `pipeline`).
- Frontend package.json may not need any change at all per RESEARCH §Integration Runner Choice ("FE may not need a separate integration runner after class-D dead-file cleanup"). Plan decides post-audit.

---

### `.github/workflows/ci.yml` (CI workflow, job-dispatch) — MODIFY

**Action:** Add three new jobs — `Tests (frontend)`, `Tests (backend)`, `Tests (integration)` (advisory) — per D-13. PATCH `main` branch protection separately to add the first two as required contexts.

**Verbatim insertion point:** Add jobs after the existing `test-unit` job (line 117) and before `test-e2e` (line 119).

**Closest analog — existing `type-check` job in same file (verbatim, lines 65-88):**

```yaml
# .github/workflows/ci.yml:65-88
type-check:
  name: type-check
  runs-on: ubuntu-latest
  needs: [repo-policy]
  steps:
    - uses: actions/checkout@v4

    - name: Setup pnpm
      uses: pnpm/action-setup@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Type-check frontend
      run: pnpm --filter intake-frontend type-check

    - name: Type-check backend
      run: pnpm --filter intake-backend type-check
```

**Two existing PR-blocking contexts to mirror:**

- `lint` job (lines 43-63) — `name: Lint` → context `Lint`
- `type-check` job (lines 65-88) — `name: type-check` → context `type-check`
- `bundle-size-check` job (lines 270-296) — `name: Bundle Size Check (size-limit)` → context `Bundle Size Check (size-limit)`

**Target shape — three new jobs (one per workspace + advisory integration):**

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
  continue-on-error: true                    # ← advisory-only per D-13
  steps:
    - uses: actions/checkout@v4
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with: { node-version: ${{ env.NODE_VERSION }}, cache: 'pnpm' }
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Run integration tests
      run: pnpm --filter intake-backend test:integration
```

**Branch-protection PATCH (separate from YAML — runs after YAML lands):**

Current required contexts (verified live by RESEARCH §CI Gate Registration Mechanism):

```
["type-check", "Security Scan", "Lint", "Bundle Size Check (size-limit)"]
```

Add `Tests (frontend)` + `Tests (backend)` (NOT `Tests (integration)`):

```bash
gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "type-check", "Security Scan", "Lint", "Bundle Size Check (size-limit)",
      "Tests (frontend)", "Tests (backend)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

**Gotchas:**

- Existing `test-unit` job (line 90-117) runs `pnpm run test -- --coverage` at REPO ROOT → Turbo runs both FE + BE in parallel → no per-workspace gate. The new jobs replace its functional role; per RESEARCH the old `test-unit` job is "wrong shape" and can be DELETED or left as a non-required workflow run. Planner decides; recommend DELETE to avoid duplicate test execution time.
- Required-context name convention: **YAML `name:` value is what becomes the GitHub status context.** `name: Tests (frontend)` → context `Tests (frontend)`. NOT the job key (`test-frontend`).
- `continue-on-error: true` on `test-integration` makes the job non-blocking. Combined with NOT adding it to `required_status_checks.contexts`, it stays advisory.
- The full PATCH must include `required_pull_request_reviews` and `restrictions` (both `null` here per current state) — omitting them in a PUT call will CLEAR them. Use the live `gh api repos/.../branches/main/protection` output as the baseline and merge new contexts in.
- Branch-protection PATCH MUST happen AFTER both new jobs go green on at least one commit (else first push to a feature branch will fail). Plan 50-05 ordering: (1) Merge YAML, (2) Wait for one green CI run, (3) PATCH branch protection.

---

### `backend/vitest.integration.config.ts` (config, build/test) — CREATE

**Action:** New file extending base `backend/vitest.config.ts` via `mergeConfig`, narrowing `include` to `tests/{contract,contracts,integration,performance}/**/*.test.ts` with `testTimeout: 60000`.

**Closest analog — sibling `backend/vitest.config.ts` (verbatim, 40 lines):**

```typescript
// backend/vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    setupFiles: [path.resolve(__dirname, './tests/setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/mockData.ts'],
      include: ['src/**/*.ts'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
})
```

**Also in repo — `backend/tests/contracts/vitest.config.ts` (40 lines, NOT used by current scripts but shows the "narrow-include + custom timeout" shape — verbatim already loaded above).** This second config is dead code from a prior attempt; planner can either consume its shape OR delete it. Recommend deletion as part of Phase 50 cleanup (note in `50-TEST-AUDIT.md`).

**Target shape using `mergeConfig` (RESEARCH §Integration Runner Choice Option B):**

```typescript
// backend/vitest.integration.config.ts
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
      exclude: ['node_modules/', 'dist/'],
      testTimeout: 60000, // ← 2× base for real-service latency
      hookTimeout: 60000,
    },
  }),
)
```

**Companion edit required in `backend/vitest.config.ts` (the BASE file):**

Per RESEARCH §Integration Runner Choice (lines 488-498), the base config's `include` must be narrowed to exclude integration paths:

```diff
- include: ['tests/**/*.test.ts'],
+ include: [
+   'tests/unit/**/*.test.ts',
+   'tests/services/**/*.test.ts',
+   'tests/security/**/*.test.ts',
+   'tests/{deadline-checker,digest-scheduler,email-notifications,notification-queue,push-notifications}.test.ts',
+ ],
+ exclude: [
+   'node_modules/', 'dist/',
+   'tests/contract/**', 'tests/contracts/**',
+   'tests/integration/**', 'tests/performance/**',
+ ],
```

This narrowing classifies `backend/vitest.config.ts` as an additional MODIFY file in this phase.

**Gotchas:**

- `mergeConfig` is a vitest built-in (`import { mergeConfig } from 'vitest/config'`). No new dependency.
- `mergeConfig` deep-merges arrays — the integration config's `include` REPLACES base's `include`, not appends. Verify by running `vitest --config ./vitest.integration.config.ts --run` and confirming only `tests/{contract,contracts,integration,performance}/**` files are picked up.
- `setupFiles` from base (`tests/setup.ts`) IS inherited — integration tests get the same global mocks. **Counter-intuitive for "integration" — these tests likely WANT real Supabase/Redis.** Planner may need to wire a SECOND setup file (e.g., `tests/setup.integration.ts` that explicitly `vi.unmock()`s supabase/ioredis/bullmq). Recommend: integration runner uses `setupFiles: ['./tests/setup.integration.ts']` that does NOT re-import the global mocks.
- Aliases (`@` + `@tests`) are inherited — no duplication needed.
- The four `backend/tests/{deadline-checker,...,push-notifications}.test.ts` root-level files (RESEARCH §Backend test-folder structure) need per-file disposition — MAY be unit OR integration depending on mock coverage. Plan should audit each; the include glob `tests/{a,b,c,d,e}.test.ts` is a guess until audit confirms.

---

### `frontend/docs/test-setup.md` (doc, reference) — CREATE

**Action:** Comprehensive contributor reference per D-14 — 6 sections: (1) test runner architecture, (2) react-i18next mock contract + `importActual + spread` precedent, (3) supabase/Redis/BullMQ/LLM mock recipes, (4) unit-vs-integration runner split, (5) common pitfalls, (6) fixture patterns.

**Closest analog — `frontend/docs/bundle-budget.md` (verbatim header + structure, lines 1-15):**

```markdown
# Frontend bundle budget

Last audited: 2026-05-12 (Plan 02 close)
Audit artifact: `.planning/phases/49-bundle-budget-reset/49-BUNDLE-AUDIT.md`

This document records the rationale for every chunk over 100 KB gzipped in
the production build. Sibling to `frontend/.size-limit.json` per Phase 49 D-09.

## Ceilings

| Chunk                | gz size   | Ceiling | Rationale                                                            | Last audited |
| -------------------- | --------- | ------- | -------------------------------------------------------------------- | ------------ |
| Initial JS (`app-*`) | 412.06 kB | 450 kB  | Entry route — TanStack Router shell + provider tree + i18n init. ... | 2026-05-12   |
```

**Structure to mirror (from bundle-budget.md):**

- Single H1 with concise title
- Two-line "Last audited" + "Audit artifact" header
- Short prose intro (1-2 paragraphs) describing what the doc is for
- Sections as H2 with tables and code blocks
- Code blocks fenced with explicit language (`typescript`, `bash`, `yaml`)

**Target outline (D-14 + RESEARCH §Common Pitfalls + Mock Factory Specs):**

```markdown
# Frontend test setup

Last reviewed: 2026-05-13 (Phase 50)
Phase artifact: `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md`

This document is the contract for the frontend test runner ...

## 1. Test runner architecture

[vitest config + jsdom env + MSW + setupFiles]

## 2. react-i18next mock contract

[D-05 importActual + spread; the initReactI18next precedent]
[Why this pattern beats list-every-export]

## 3. Mocking external dependencies (canonical recipes)

[Supabase, Redis, BullMQ, LLM SDK — copied from RESEARCH §Mock Factory Specs]

## 4. Unit vs integration runner

[`pnpm test` vs `pnpm test:integration` semantics; D-03 explained]

## 5. Common pitfalls

[Copy 7 pitfalls from RESEARCH §Common Pitfalls]

## 6. Fixture patterns

[Co-located __tests__/, factory functions, vi.mocked() per-test override]

## 7. Custom ESLint rule: vi-mock-exports-required

[D-15 rule explanation, what it catches, how to write a passing factory]
```

**Gotchas:**

- The doc must include AT LEAST 5 references to `vi.importActual`, `initReactI18next`, or `integration runner` per VALIDATION §Phase Requirements → Test Map row (TEST-04 check is `grep -c "vi.importActual\|initReactI18next\|integration runner" frontend/docs/test-setup.md` ≥5).
- Bundle-budget uses pipe-aligned markdown tables. Test-setup can use the same (rendering on GitHub is consistent).
- DO NOT use emoji in copy per CLAUDE.md §Design rules ("No emoji in user-visible copy"). Frontend docs are user-visible to contributors. The current `setup.ts` has emoji in console.log strings — those don't render to user docs.
- Avoid marketing voice per CLAUDE.md. Title case for H2 headers; sentence case for prose.

---

### `backend/docs/test-setup.md` (doc, reference) — CREATE

**Action:** Short BE-specific pointer per D-14 — refers back to FE doc for shared concepts (vitest architecture, importActual pattern, runner split), documents BE-specific recipes only (supabaseAdmin chain, BullMQ Queue/Worker, env-var contract).

**Closest analog — `frontend/docs/test-setup.md` (created in same phase, see above).** Once FE doc is written, BE doc is a short companion.

**No existing analog** for backend docs — `backend/docs/` is empty per Bash listing. **Mark as NOVEL — planner decides shape.**

**Target outline:**

```markdown
# Backend test setup

Last reviewed: 2026-05-13 (Phase 50)
Sibling doc: `frontend/docs/test-setup.md` (shared concepts)

## 1. What's different about backend

[Node env + pool: 'forks' + no JSDOM]

## 2. Global mocks in tests/setup.ts (D-07/D-08)

[Recipes for supabaseAdmin, ioredis, bullmq, anthropic, openai]
[Per-test override: vi.mocked(...).mockReturnValue()]

## 3. Env-var contract

[NODE_ENV=test + .env loading order + .env.test override]
[Why .env contents are mostly moot under global mocks]

## 4. Integration runner

[`pnpm test:integration` invokes vitest.integration.config.ts]
[Real Supabase/Redis needed; advisory CI context only]

## 5. See also

- `frontend/docs/test-setup.md` for shared mock patterns
- `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md` for failing-test inventory
```

**Gotchas:**

- Shorter than FE doc (target ~150 lines). Cross-reference rather than duplicate.
- TEST-04 grep check is FE-doc-specific per VALIDATION §Phase Requirements. BE doc has no minimum-grep target but should still demonstrate the recipes for self-containment.
- Per CLAUDE.md, do not create README files unless explicitly requested. D-14 explicitly requests `backend/docs/test-setup.md` — this is the permission.

---

### `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md` (audit artifact, classification) — CREATE

**Action:** Single classified audit artifact per D-04 — every failing test at phase start with columns `workspace, file_path, failure_class, disposition, rationale`.

**Closest analog — `.planning/milestones/v6.2-MILESTONE-AUDIT.md` (frontmatter + table-of-failures style, verbatim header lines 1-50):**

```markdown
---
milestone: v6.2
milestone_name: Type-Check, Lint & Bundle Reset
audited: 2026-05-13T11:00:00Z
status: passed
re_audit: true
prior_audit: 2026-05-13T06:34:55Z (gaps_found → paperwork-only; closed by commits ...)
scores:
  requirements: 12/12 satisfied (3-source matrix)
  phases: 3/3 shipped, 3/3 verified
  ...
tech_debt:
  - phase: 47-type-check-zero
    items:
      - 'CLAUDE.md Node note still reads ...'
      - '`StakeholderInteractionMutationsShim` retained ...'
  ...
---

# Milestone v6.2 Audit Report — Type-Check, Lint & Bundle Reset

**Verdict:** ✓ PASSED
**Audited:** 2026-05-13 11:00 UTC
**HEAD:** c37c1901 — ...

This is a **re-audit** of v6.2. ...

## 1. Milestone Scope

...
```

**Structure to mirror (from v6.2-MILESTONE-AUDIT.md):**

- YAML frontmatter with `audited`, `status`, `scores`, `gaps`, `tech_debt`
- H1 title with verdict
- Two-line "Audited / HEAD" header
- H2 sections: Scope, Verification Summary, Findings, Final State

**Target outline (D-04 explicit columns):**

```markdown
---
phase: 50-test-infrastructure-repair
audited: 2026-05-13T<TBD>Z
status: in_progress | passed
scores:
  frontend_tests: <green-count>/<total>
  backend_tests: <green-count>/<total>
  audit_rows: 218 + 207 = 425
  dispositions:
    { fixed-in-phase: X, split-to-integration: Y, queued-with-rationale: Z, deleted-dead: W }
---

# Phase 50 Test Audit — Test Infrastructure Repair

**Audited:** ...
**Phase-start HEAD:** <sha>
**Phase-exit HEAD:** <sha>

## Summary by failure class

| Workspace | Class                       | Count | Disposition                |
| --------- | --------------------------- | ----: | -------------------------- |
| frontend  | playwright-misglobbed       |   175 | fixed-in-phase (G1 config) |
| frontend  | module-eval (initReactI18n) |    20 | fixed-in-phase (G2 D-05)   |
| frontend  | dead-import                 |    11 | deleted-dead               |
| frontend  | product-regression          |     5 | fixed-in-phase (G5)        |
| backend   | integration (real-service)  |   202 | split-to-integration       |
| backend   | mock-gap (supabase env)     |   104 | fixed-in-phase (D-07)      |
| backend   | helper-missing              |    24 | per-file audit             |

...

## Frontend failures (218 rows)

| File                                                                              | Class                 | Disposition    | Rationale / Commit Ref             |
| --------------------------------------------------------------------------------- | --------------------- | -------------- | ---------------------------------- |
| frontend/tests/e2e/sla-tracking.spec.ts                                           | playwright-misglobbed | fixed-in-phase | Commit <sha> (G1: config exclude)  |
| frontend/src/components/dossier/wizard/**tests**/CreateWizardShell.test.tsx       | module-eval           | fixed-in-phase | Commit <sha> (G2: D-05 setup.ts)   |
| frontend/src/components/dossier/wizard/hooks/**tests**/useCountryAutoFill.test.ts | product-regression    | fixed-in-phase | Commit <sha> (test-mock-shape fix) |

... (218 rows)

## Backend failures (207 rows)

| File                                  | Class       | Disposition          | Rationale / Commit Ref |
| ------------------------------------- | ----------- | -------------------- | ---------------------- |
| backend/tests/contract/.../X.test.ts  | integration | split-to-integration | (D-03 runner)          |
| backend/tests/unit/services/Y.test.ts | mock-gap    | fixed-in-phase       | Commit <sha>           |

... (207 rows)

## Phase-exit state

| Workspace | `pnpm test` exit code | Timestamp | Notes |
| --------- | --------------------- | --------- | ----- |
| frontend  | 0                     | <iso>     | ...   |
| backend   | 0                     | <iso>     | ...   |

## Queued tech debt (out of Phase 50 scope)

| Item                              | Workspace | Linked phase / ticket |
| --------------------------------- | --------- | --------------------- |
| Playwright visual baselines regen | frontend  | Phase 52 KANBAN-04    |
| ...                               | ...       | ...                   |
```

**Gotchas:**

- VALIDATION row TEST-03 requires `wc -l < 50-TEST-AUDIT.md ≥218` rows + grep for "## Frontend" + "## Backend" + "disposition". Structure the H2 headers verbatim.
- Per RESEARCH §Validation evidence checklist, the audit MUST include phase-start AND phase-exit `pnpm --filter ... test` exit codes with timestamps. This is the "Final phase-exit state" section.
- The audit rolls up dispositions from Plans 50-01, 50-02, 50-03. Plan 50-04 owns this file; consumed sections from earlier plans are by reference.
- 425+ rows is a wall of text. Group by failure class within each H2 (Frontend → Playwright-misglobbed subsection → 175 rows; Frontend → module-eval subsection → 20 rows; etc.) to make the diff reviewable.

---

### `tools/eslint-plugin-intl-dossier/` (lint plugin) — CREATE (CONDITIONAL)

**Action:** Only create if planner selects D-15 **Option 2** (local ESLint plugin with module-resolution-aware AST visit). RESEARCH recommends **Option 1** (inline `no-restricted-syntax`) — so this path is likely NOT taken.

**Closest analog — NONE in repo.** `tools/` directory does not exist (verified via Bash). Mark as **NOVEL — planner decides shape if chosen**.

**If chosen, recommended scaffold (from RESEARCH §ESLint Rule Implementation Choice Option 2):**

```
tools/eslint-plugin-intl-dossier/
├── package.json                        # name, main, version
├── index.js                            # exports { rules: { 'vi-mock-exports-required': rule } }
├── rules/
│   └── vi-mock-exports-required.js    # rule definition (~80-120 lines)
└── README.md                           # rule rationale, examples
```

**External analog (ESLint plugin convention, not in this repo):** The standard `eslint-plugin-<name>` package layout — see `eslint-plugin-rtl-friendly` already in `node_modules` (referenced at `eslint.config.mjs:7`).

**Gotchas:**

- This path requires adding to `pnpm-workspace.yaml` (or `workspaces` field in root `package.json:13-17`). Currently workspaces are `["backend", "frontend", "shared"]` — adding `tools/eslint-plugin-intl-dossier` extends the monorepo.
- Lint-time `import()` of resolved module to enumerate exports is fragile per RESEARCH (TS path aliases, JSX, ~500ms per-file slowdown). Option 1 avoids this entirely.
- If chosen, the `tools/` directory needs git provenance — first commit creates the path.

**Recommendation per RESEARCH: SKIP Option 2. Use Option 1 inline.** This entry is documented for completeness only.

---

### `tools/eslint-fixtures/bad-vi-mock.ts` (lint regression target) — CREATE (CONDITIONAL)

**Action:** Tiny fixture file containing a deliberately bad `vi.mock(...)` factory (no spread, missing exports). Used by Plan 50-05's smoke test to verify the rule fires.

**Closest analog — NONE in repo.** `tools/eslint-fixtures/` does not exist. Mark as **NOVEL**.

**If chosen, recommended shape (~15 lines):**

```typescript
// tools/eslint-fixtures/bad-vi-mock.ts
// Regression fixture for vi-mock-exports-required rule (D-15)
// Lint MUST flag this file. Running `pnpm lint tools/eslint-fixtures/bad-vi-mock.ts`
// should exit ≠0.
import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  // Intentionally bad — no spread of importActual, missing initReactI18next
  useTranslation: () => ({ t: (key: string) => key }),
}))
```

**Gotchas:**

- The fixture file MUST be excluded from production builds (sits under `tools/` which is outside `src/` globs). Confirm `eslint.config.mjs` ignore globs do not catch `tools/` — currently they don't (line 12-25 ignores list does not mention `tools/`).
- TEST-04 / VALIDATION row `(rule)` requires this file to exit ≠0 under lint, AND `eslint.config.mjs`'s canonical `frontend/tests/setup.ts` (after D-05 rewrite) to exit 0. Verify both BEFORE landing the rule.
- If Option 1 (`no-restricted-syntax`) is used, the fixture can live ANYWHERE — `tools/eslint-fixtures/bad-vi-mock.ts` is just a clean convention. Alternative: an inline test under `frontend/tests/__tests__/lint-rule-fixture/`.
- File doesn't need to be a real test (doesn't need `.test.ts` extension). Confirms-rule-fires fixture only.

---

## Shared Patterns

### vitest global-mock pattern

**Source:** `frontend/tests/component/CommitmentList.test.tsx:451-462` + `frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx:18-22`

**Apply to:** Both `frontend/tests/setup.ts` (D-05) and `backend/tests/setup.ts` (D-07/D-08)

```typescript
vi.mock('<module-id>', async () => {
  const actual = await vi.importActual<typeof import('<module-id>')>('<module-id>')
  return {
    ...actual,
    onlyOverrideExportsYouNeed: customStub,
  }
})
```

### vitest `pool: 'forks'` per-test isolation

**Source:** `backend/vitest.config.ts:9`

**Apply to:** Backend setup (D-07/D-08) — each test file is its own process; in-memory stubs (Redis Map, etc.) reset between files automatically. No `beforeEach` cleanup needed for cross-file state.

### Path-alias `@` and `@tests` resolution

**Source:** `frontend/vitest.config.ts:26-29` and `backend/vitest.config.ts:34-39`

**Apply to:** Both `backend/vitest.integration.config.ts` (inherited via mergeConfig) and any new mock module paths (`vi.mock('@/config/supabase', ...)` resolves via alias).

### ESLint flat config block-scoping by `files:` glob

**Source:** `eslint.config.mjs:71-200` (frontend block), `eslint.config.mjs:215-220` (UI library exception), `eslint.config.mjs:226-242` (backend block)

**Apply to:** D-15 rule — add new top-level block scoped to `files: ['**/tests/**/*.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}']`. Mirror the per-glob block convention; do NOT shove into the global rules block.

### CI per-workspace job pattern

**Source:** `.github/workflows/ci.yml:65-88` (`type-check` job)

**Apply to:** New `Tests (frontend)` and `Tests (backend)` jobs in `.github/workflows/ci.yml`. Mirror EXACT setup steps (checkout → pnpm action-setup → setup-node with NODE_VERSION + pnpm cache → frozen-lockfile install → workspace-filtered test command).

### Branch-protection PATCH via `gh api`

**Source:** Verified live by RESEARCH §CI Gate Registration. Current contexts on `main`: `["type-check", "Security Scan", "Lint", "Bundle Size Check (size-limit)"]`. Mechanism: `gh api -X PUT repos/.../branches/main/protection --input -` with full payload.

**Apply to:** D-13 step in Plan 50-05 — append `"Tests (frontend)"` and `"Tests (backend)"` (NOT `"Tests (integration)"`) to `required_status_checks.contexts`. PATCH must include `enforce_admins: true` to preserve current setting.

### Vitest `mergeConfig` for runner split

**Source:** vitest built-in (`import { mergeConfig } from 'vitest/config'`); recipe verbatim in RESEARCH §Integration Runner Choice Option B.

**Apply to:** `backend/vitest.integration.config.ts` (CREATE).

---

## No Analog Found / Novel

Files where the planner must invent the shape (no in-repo precedent):

| File                                   | Role            | Why no analog                                                        | Recommended approach                                                                                                                        |
| -------------------------------------- | --------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools/eslint-plugin-intl-dossier/`    | local plugin    | `tools/` directory does not exist; no prior ESLint plugin convention | **Skip — use D-15 Option 1 inline in `eslint.config.mjs`**                                                                                  |
| `tools/eslint-fixtures/bad-vi-mock.ts` | lint fixture    | No `tools/eslint-fixtures/` precedent                                | Create minimal 15-line file under `tools/eslint-fixtures/`; OR inline in `frontend/tests/__tests__/lint-rule-fixture/` if avoiding `tools/` |
| `backend/docs/test-setup.md`           | contributor doc | `backend/docs/` empty                                                | Mirror `frontend/docs/test-setup.md` (sibling — created in same phase). Cross-reference for shared concepts.                                |

---

## Metadata

**Analog search scope:**

- `frontend/tests/**` (setup.ts + component/, integration/, mocks/)
- `frontend/src/**/__tests__/**` (co-located component tests)
- `backend/tests/**` (setup.ts + contract/, contracts/, integration/, performance/, unit/, services/, security/)
- `.github/workflows/` (CI YAML jobs)
- `eslint.config.mjs` (root flat config)
- `.planning/milestones/v6.0..v6.2-MILESTONE-AUDIT.md` (audit doc shape)
- `frontend/docs/`, `backend/docs/`, `docs/` (contributor docs)
- `tools/` (verified ABSENT)

**Files scanned:** ~25 (test setup files, vitest configs, ESLint config, CI workflow, package.json × 3, milestone audit, prior phase audit candidates, wizard test files, useCountryAutoFill hook + test, MSW server, prior bundle-budget doc)

**Pattern extraction date:** 2026-05-13

**Key patterns identified:**

1. **`vi.importActual + spread` is already proven in repo** at two precedent sites (`CommitmentList.test.tsx:451`, `GlobeLoader.reducedMotion.test.tsx:18`). D-05 is a verbatim copy of an existing pattern — zero novelty risk.
2. **Per-workspace CI jobs follow the `pnpm --filter <workspace> <script>` convention** (existing `type-check` job uses this; `Tests (frontend)` / `Tests (backend)` mirror exactly).
3. **ESLint flat config uses file-glob-scoped blocks** (not global rule mutation); the frontend `no-restricted-syntax` block precedent at lines 148-198 is the template for the D-15 rule block.
4. **`backend/vitest.config.ts` has `pool: 'forks'` + 30s timeout + path aliases** that all carry to the integration config via `mergeConfig`. No config drift risk.
5. **Branch-protection PATCH pattern is established** (v6.2 phases 47/48/49 used the identical `gh api PUT` shape).
6. **The audit-artifact frontmatter shape comes from milestone audits** (`v6.2-MILESTONE-AUDIT.md`); phase-level audits don't have a prior precedent — `50-TEST-AUDIT.md` borrows the milestone shape for phase scope.
