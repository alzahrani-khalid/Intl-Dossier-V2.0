---
phase: 50-test-infrastructure-repair
plan: 03
status: complete
completed_at: 2026-05-14 09:34:35 +0300
requirements:
  - TEST-01
  - TEST-02
---

# Plan 50-03 Summary - Backend Runner Split and Global Mocks

## Outcome

Complete. The default backend runner is narrowed to the mocked unit/service/root suite and exits 0.

Final proof:

- `pnpm --filter intake-backend test --run --reporter=verbose`
  - Exit: 0
  - Result: `Test Files 15 passed (15)`, `Tests 214 passed (214)`
- `pnpm --filter intake-backend lint`
  - Exit: 0

Integration-runner smoke:

- `pnpm --filter intake-backend exec vitest --config ./vitest.integration.config.ts --run --reporter=verbose tests/integration/rls-policies.test.ts`
  - Exit: 1
  - Result: integration config now collects `tests/integration/**`; the selected file fails on the pre-existing missing `createTestServer` helper, which is outside the default-runner contract and should be handled by Plan 50-04 audit/integration follow-up.

## Runner Changes

- Added `backend/vitest.integration.config.ts`.
- Added `backend/package.json` script `test:integration`.
- Narrowed `backend/vitest.config.ts` default includes to unit/services/root tests and excluded contract/integration/performance directories.
- Rewrote `backend/tests/setup.ts` with global mocks for `@/config/supabase`, `ioredis`, `bullmq`, `@anthropic-ai/sdk`, `openai`, and `@xenova/transformers`.
- Fixed integration config `mergeConfig` behavior by overriding `test.exclude` after merge so integration directories are not inherited from the default-runner excludes.

## Per-File Dispositions

| File                                                                                              | Class                      | Disposition          | Rationale                                                                                                                  |
| ------------------------------------------------------------------------------------------------- | -------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `backend/tests/security/rls-policies.test.ts` -> `backend/tests/integration/rls-policies.test.ts` | class-H / integration-only | split-to-integration | Server/RLS policy coverage depends on a test-server helper and request-level behavior, not the default mocked unit runner. |
| `backend/tests/unit/database.test.ts` -> `backend/tests/integration/database.test.ts`             | integration-only           | split-to-integration | Exercises Supabase RLS/helper functions and TODO role tokens against a real database.                                      |
| `backend/src/services/interaction-note-service.ts`                                                | class-A                    | fixed-green          | Invalid type filters now validate before opening a Supabase query.                                                         |
| `backend/tests/unit/auth.service.test.ts`                                                         | class-M                    | fixed-green          | Updated renamed import path from deleted `AuthService` module to current `auth.service`.                                   |
| `backend/tests/unit/rate-limit.service.test.ts`                                                   | class-A                    | fixed-green          | Replaced stale counter API assertions with current token-bucket/policy API coverage.                                       |
| `backend/tests/unit/reporting.service.test.ts`                                                    | class-A                    | fixed-green          | Replaced stale constructor/export assertions with current reporting API coverage.                                          |
| `backend/tests/unit/search.service.test.ts`                                                       | class-A                    | fixed-green          | Replaced stale search response assertions with current `SearchResult` contract coverage.                                   |
| `backend/tests/unit/vector.service.test.ts`                                                       | class-A                    | fixed-green          | Replaced stale RPC embedding assertions with current vector embedding/search API coverage.                                 |

Deleted-dead files: none.

Queued-with-rationale rows: none for the backend default runner.

## Handoff

Split-to-integration files for Plan 50-04 audit:

- `backend/tests/integration/rls-policies.test.ts`
- `backend/tests/integration/database.test.ts`

Known integration follow-up:

- Many integration/contract files import `createTestServer` from `../setup`, but `backend/tests/setup.ts` is now the default-runner global mock setup and does not export that helper. The integration runner includes those files correctly after this plan; restoring or replacing the test-server helper belongs to the integration audit/follow-up, not the default backend runner repair.

Commit count: 1 backend repair commit for Plan 50-03.
