# Backend test setup

Last reviewed: 2026-05-14 (Phase 50)
Sibling doc: `frontend/docs/test-setup.md` (shared concepts)

This document covers backend-specific test setup. Shared mock-factory rules, the `vi.importActual` precedent, and common pitfalls are documented in the sibling frontend guide.

## 1. What's different about backend

| Area              | Backend contract                                                              |
| ----------------- | ----------------------------------------------------------------------------- |
| Environment       | `node`, not jsdom.                                                            |
| Process model     | `pool: 'forks'`; every test file runs in its own process.                     |
| HTTP interception | No MSW. Backend tests mock SDK clients directly.                              |
| Module system     | Pure ESM from `backend/package.json`; Vitest hoists `vi.mock(...)` factories. |

Because the fork pool isolates each file, in-memory stores in global mocks do not leak between files. Set up data inside the file that needs it.

## 2. Global mocks in tests/setup.ts

`backend/tests/setup.ts` owns the default-runner external dependency mocks. The default runner should not contact Supabase, Redis, BullMQ, Anthropic, OpenAI, or Transformers.

Supabase chain override:

```ts
import { vi } from 'vitest'
import { supabaseAdmin } from '@/config/supabase'

const chain = {
  select: vi.fn(() => chain),
  eq: vi.fn(() => chain),
  single: vi.fn(async () => ({ data: { id: 'row-1' }, error: null })),
}

vi.mocked(supabaseAdmin.from).mockImplementation(() => chain as any)
```

Redis override:

```ts
const redis = await import('ioredis')
const client = new redis.default()
vi.mocked(client.get).mockResolvedValue('{"cached":true}')
```

BullMQ override:

```ts
import { Queue } from 'bullmq'
vi.mocked(Queue).mockImplementation(
  () =>
    ({
      add: vi.fn(async () => ({ id: 'job-1' })),
      close: vi.fn(async () => undefined),
    }) as any,
)
```

LLM SDK override:

```ts
const response = { content: [{ type: 'text', text: '{"summary":"ok"}' }] }
// Override the mocked client method in the test that needs this response.
```

Embedding override:

```ts
const embedding = new Array(1536).fill(0)
// The default OpenAI mock returns this shape for embeddings.create.
```

## 3. Env-var contract

The setup file loads `.env` first and `.env.test` second, then sets `process.env.NODE_ENV = 'test'`. Most default-runner tests do not need real Supabase values because the client is mocked before product code uses it.

Real service values are still needed for `pnpm --filter intake-backend test:integration`. The minimum integration variables are:

| Variable                    | Purpose                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `SUPABASE_URL`              | Real Supabase API URL.                                       |
| `SUPABASE_ANON_KEY`         | Client-side anon key for request paths that use anon access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin/service key for server-side integration paths.         |

Do not commit real values. Use local env files or the CI secret store.

## 4. Integration runner

Run integration tests with:

```bash
pnpm --filter intake-backend test:integration
```

The command invokes `backend/vitest.integration.config.ts`, which uses `mergeConfig` with `backend/vitest.config.ts` and narrows includes to `tests/contract/**`, `tests/contracts/**`, `tests/integration/**`, and `tests/performance/**`. The integration timeout is longer than the default runner.

The integration runner inherits `setupFiles` through `mergeConfig`. If a file needs the real `supabaseAdmin`, call `vi.unmock('@/config/supabase')` at file top before importing the code under test. A separate `tests/setup.integration.ts` can be added later if many files need real clients.

CI treats `Tests (integration)` as advisory. It should not be listed in required branch-protection contexts until real services are available in CI.

Coverage note: default `pnpm test --coverage` may under-report against backend thresholds after the default runner was narrowed. Run coverage across unit plus integration before enforcing those thresholds.

### When to use `vi.unmock(...)`

Use `vi.unmock(...)` only in integration files that intentionally cross the mocked boundary:

| Dependency          | Default-runner behavior                | Integration escape hatch                                           |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `@/config/supabase` | Mocked chain builder                   | `vi.unmock('@/config/supabase')` before importing product code     |
| `ioredis`           | Map-backed stub                        | Run against a real Redis service and unmock the package            |
| `bullmq`            | Constructor stubs with async `close()` | Use real Queue/Worker only with Redis available                    |
| Anthropic/OpenAI    | Canned response objects                | Use real credentials only in explicitly approved integration tests |

Keep the default runner free of real services. If a test cannot state why it needs a real service, it belongs in the default runner with mocks.

### Commit checklist

Before committing backend test-infrastructure changes:

1. Run the specific backend test file or folder that changed.
2. Run `pnpm --filter intake-backend test --run` when `backend/tests/setup.ts` or runner config changed.
3. Run `pnpm --filter intake-backend test:integration -- --run <file>` when an integration file or unmock path changed.
4. Document any new real-service requirement in this file and in the phase audit.
5. Do not add real credentials to examples, fixtures, or docs.

## 5. See also

- `frontend/docs/test-setup.md` for shared mock patterns and the `vi.importActual` precedent.
- `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md` for the phase-start failing-test inventory.
- `backend/vitest.config.ts` and `backend/vitest.integration.config.ts` for current runner definitions.
