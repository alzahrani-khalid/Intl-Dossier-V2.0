---
phase: 52-heroui-v3-kanban-migration
plan: 04
subsystem: frontend
tags: [kanban, cleanup, eslint, dependency-removal]
requires:
  - phase: 52-heroui-v3-kanban-migration
    plan: 03
    provides: zero production consumers of @/components/kibo-ui/kanban
provides:
  - kibo-ui kanban deletion sealed
  - tunnel-rat dependency removed
  - local kibo-ui imports banned by ESLint
  - CI deletion guard wired
  - Phase 51 design-token audit row closed
requirements-completed: [KANBAN-03]
duration: 12 min
completed: 2026-05-16
---

# Phase 52 Plan 04: Cleanup and permanent guardrails Summary

**Deleted the dead kibo-ui Kanban module, removed `tunnel-rat`, widened ESLint bans, and wired regression guards so the migration cannot silently regress.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-16T08:50:00Z
- **Completed:** 2026-05-16T09:02:00Z
- **Tasks:** 4/4
- **Files deleted:** 1 tracked file (`frontend/src/components/kibo-ui/kanban/index.tsx`)
- **Files modified:** 8

## Task Commits

1. **Task 1: Delete kibo-ui kanban + remove tunnel-rat** — `a53e4452`
2. **Task 2: Ban local kibo-ui imports** — `5eb3c63c`
3. **Task 3: CI deletion guard + audit closeout** — `f0246c39`
4. **Task 4: Workspace gate** — verification-only; no mutation commit

## Deletion and Dependency Evidence

`git show --stat --oneline a53e4452`:

```text
a53e4452 chore(52-04): delete kibo kanban and tunnel-rat
 frontend/package.json                            |   1 -
 frontend/src/components/kibo-ui/kanban/index.tsx | 317 -----------------------
 pnpm-lock.yaml                                   |  14 -
 3 files changed, 332 deletions(-)
```

`tunnel-rat` removal:

- `frontend/package.json`: removed `"tunnel-rat": "^0.1.2"`.
- `pnpm-lock.yaml`: removed importer entry, package entry, and snapshot entry.
- Final checks:
  - `! grep -q "tunnel-rat" frontend/package.json` → exit `0`
  - `! grep -q "tunnel-rat" pnpm-lock.yaml` → exit `0`

Note: the plan mentioned `frontend/pnpm-lock.yaml`; this repo uses the root `pnpm-lock.yaml`.

## ESLint Ban Summary

`eslint.config.mjs` changes in `5eb3c63c`:

- Added `@/components/kibo-ui/*` to `no-restricted-imports.patterns.group`.
- Removed the obsolete Phase 48 D-02 narrowing comment block.
- Removed the `frontend/src/components/**/index.tsx` carve-out after Pitfall 7 verification found no surviving `frontend/src/components/**/index.tsx` files outside kibo-ui.
- Added a fixture-specific override for `tools/eslint-fixtures/bad-kibo-ui-import.tsx` so the regression test can lint that out-of-workspace fixture directly.

Fixture-fire evidence:

```text
/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/tools/eslint-fixtures/bad-kibo-ui-import.tsx
  7:1  error  '@/components/kibo-ui/kanban' import is restricted from being used by a pattern. Banned by CLAUDE.md primitive cascade. Use HeroUI v3 → Radix → custom. If no primitive fits, ask before installing  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)
fixture eslint exit=1
no-restricted-imports count=1
```

## CI Deletion Guard

`scripts/check-deleted-components.sh` now includes:

```bash
# Phase 52 KANBAN-03: kibo-ui kanban directory must remain deleted post-Plan-04
if [ -d "frontend/src/components/kibo-ui/kanban" ]; then
  echo "FAIL: frontend/src/components/kibo-ui/kanban/ re-introduced (banned per Phase 52 D-18)" >&2
  FAIL=1
fi
```

Verification: `bash scripts/check-deleted-components.sh` → exit `0` with `OK: zero references to deleted Phase 34 + 36 components/routes/shims`.

## Phase 51 Audit Closeout

`.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` now has a `Resolved during Phase 52 migration` section documenting:

- `TasksTab.tsx`: five Tier-C suppressions resolved by deleting `STAGE_COLORS` and moving column styling to the shared primitive (`6f20264c`).
- `KanbanTaskCard.tsx`: four Tier-C suppressions resolved by semantic SLA token swaps (`445c3574`).

`grep -c "Resolved during Phase 52" .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` → `1`.

## Workspace Gate Evidence

Actual workspace selector is `./frontend`; `--filter frontend` is a no-op in this repo because the package name is `intake-frontend`.

| Command                                                                                               |       Exit | Evidence                                 |
| ----------------------------------------------------------------------------------------------------- | ---------: | ---------------------------------------- |
| `test ! -d frontend/src/components/kibo-ui/kanban`                                                    |          0 | directory absent                         |
| `! grep -q '"kibo-ui"' frontend/package.json`                                                         |          0 | no kibo-ui package dependency            |
| `! grep -q "tunnel-rat" frontend/package.json`                                                        |          0 | dependency removed                       |
| `! grep -q "tunnel-rat" pnpm-lock.yaml`                                                               |          0 | lockfile cleaned                         |
| `grep -q "'@/components/kibo-ui/\*'" eslint.config.mjs`                                               |          0 | local-path ban present                   |
| `! grep -q "48-02 narrowing" eslint.config.mjs`                                                       |          0 | obsolete comment removed                 |
| `! grep -q "48-02 scope-expansion" eslint.config.mjs`                                                 |          0 | index.tsx carve-out removed              |
| `pnpm --filter ./frontend lint`                                                                       |          0 | ESLint completed with no errors          |
| `pnpm --filter ./frontend type-check`                                                                 |          0 | `tsc --noEmit` completed                 |
| `pnpm --filter ./frontend build`                                                                      |          0 | Vite built successfully in `11.82s`      |
| `pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-kibo-ui-import.tsx` | 1 expected | fixture produced `no-restricted-imports` |
| `cd frontend && pnpm exec vitest run src/components/kanban/__tests__/`                                |          0 | `4 passed (4)`, `11 passed (11)`         |
| `cd frontend && pnpm exec playwright test --list tests/e2e/kanban-*.spec.ts`                          |          0 | `Total: 14 tests in 8 files`             |

Build emitted the existing >500 kB chunk warning; Phase 53 owns bundle tightening.

## Plan-01 Fixture Transition

The Plan-01 `eslint-ban.test.ts` was RED before the local kibo-ui ban was wired. It is now GREEN as part of the kanban test subset:

```text
Test Files  4 passed (4)
Tests       11 passed (11)
```

## Deviations from Plan

1. **Actual lockfile path:** The plan referenced `frontend/pnpm-lock.yaml`; the repository uses root `pnpm-lock.yaml`.
2. **Actual pnpm selector:** Used `pnpm --filter ./frontend`, not `--filter frontend`, to avoid a no-op filter.
3. **Fixture lint invocation:** Used direct root ESLint invocation (`pnpm exec eslint -c eslint.config.mjs ...`) because the frontend `lint` script intentionally scopes to `frontend/src/**/*.{ts,tsx}` and ignores out-of-workspace fixture arguments.

## Next Phase Readiness

Plan 05 is unblocked. The codebase is now sealed against kibo-ui Kanban re-introduction through deletion, dependency removal, ESLint import bans, CI deletion checks, and a positive-failure fixture test.

---

_Phase: 52-heroui-v3-kanban-migration_  
_Completed: 2026-05-16_
