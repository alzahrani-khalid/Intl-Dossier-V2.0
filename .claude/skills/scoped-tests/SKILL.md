---
name: scoped-tests
description: >-
  Use after changing code, before claiming work is done. Picks the narrowest
  pnpm test command instead of running the full suite — saves context and time
  on single-workspace changes.
paths:
  - tests/**
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/*.spec.ts'
---

# Scoped test runner

Running the full suite on a one-workspace change wastes context and time. Pick the narrowest command that still covers the change.

## Decision table

| What you changed                                                  | Run                                                |
| ----------------------------------------------------------------- | -------------------------------------------------- |
| `frontend/src/components/<x>/**`                                  | `pnpm --filter frontend test src/components/<x>`   |
| `frontend/src/domains/<x>/**`                                     | `pnpm --filter frontend test src/domains/<x>`      |
| `frontend/src/routes/**`                                          | `pnpm --filter frontend test src/routes`           |
| `backend/src/api/<feat>/**`                                       | `pnpm --filter backend test src/api/<feat>`        |
| `backend/src/adapters/**`                                         | `pnpm --filter backend test src/adapters`          |
| `supabase/migrations/**`                                          | `pnpm test:integration`                            |
| `supabase/functions/<name>/**`                                    | `pnpm test:integration src/functions/<name>`       |
| `backend/src/core/domain/**` or `shared/**`                       | `pnpm test` (FULL — these are imported everywhere) |
| `frontend/src/design-system/**` or `frontend/public/bootstrap.js` | full frontend suite + visual regression            |

## Rules

- **Shared/core changes → full suite.** `backend/src/core/domain/` and any `shared/**` package ripple everywhere.
- **Single-workspace changes → scoped suite.** A change to `backend/src/api/dossiers` only needs `backend/src/api/dossiers` tests plus any cross-cutting integration tests in `tests/`.
- **Every new UI test covers EN (LTR) and AR (RTL).** Two `render()` calls, one per `dir`/`i18n.language`.
- **AAA structure** — Arrange / Act / Assert blocks, named when non-trivial.

## When in doubt

Run the scoped suite first. If it passes, also run `pnpm typecheck && pnpm lint` to catch anything the scoped tests miss. Only escalate to the full suite if the scoped run flags something cross-cutting.
