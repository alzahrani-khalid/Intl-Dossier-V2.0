# tests — Vitest + Playwright + axe-core

Pyramid: unit (Vitest) → integration (Vitest + local Supabase) → E2E (Playwright + axe-core).

## Conventions

- **AAA structure.** Arrange / Act / Assert blocks, named explicitly when non-trivial.
- **Every new UI component test covers both EN (LTR) and AR (RTL)** — render twice with the appropriate `dir` and `i18n.language`.
- **Coverage target: 80% minimum** for new code (project-wide rule).
- **Test names describe behavior**, not implementation: `returns empty array when no matches` ✅, not `test getById()` ❌.
- **No floating promises in tests either** — `await` every `expect(...).resolves` / Playwright assertion.

## Scoped commands (the AI Layer's `scoped-tests` skill enforces this)

| What you changed                                                  | Run                                              |
| ----------------------------------------------------------------- | ------------------------------------------------ |
| `frontend/src/components/<x>/**`                                  | `pnpm --filter frontend test src/components/<x>` |
| `frontend/src/domains/<x>/**`                                     | `pnpm --filter frontend test src/domains/<x>`    |
| `backend/src/api/<feat>/**`                                       | `pnpm --filter backend test src/api/<feat>`      |
| `supabase/migrations/**`                                          | `pnpm test:integration`                          |
| `backend/src/core/domain/**` or `shared/**`                       | `pnpm test` (FULL — repo-wide imports)           |
| `frontend/src/design-system/**` or `frontend/public/bootstrap.js` | full frontend suite + visual regression          |

## Tests for tests

```bash
pnpm test                    # full
pnpm test:e2e                # Playwright only
pnpm test:a11y               # axe-core
```

## Gotchas

- **Vitest watch mode + Supabase Realtime subscriptions leak across tests.** Use `vi.useFakeTimers()` and `afterEach(cleanup)` religiously.
- **Playwright tests must run with the dev server up.** `pnpm dev` in another shell, or rely on the global setup.
