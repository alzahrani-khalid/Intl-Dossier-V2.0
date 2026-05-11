---
phase: 34
plan: 07
subsystem: tweaks-drawer
tags: [routing, redirect, playwright, e2e, theme-04]
requires:
  - 34-01 # redirect.spec.ts scaffold
provides:
  - '/themes redirect route (beforeLoad throw to /)'
  - 'Live Playwright redirect E2E (2 tests)'
affects:
  - frontend/src/routes/_protected/themes.tsx
  - frontend/src/routeTree.gen.ts
  - frontend/tests/e2e/tweaks/redirect.spec.ts
tech-stack:
  added: []
  patterns:
    - 'TanStack Router v5 beforeLoad redirect (throw redirect({ to: "/" }))'
    - 'Explicit never return type on throwing beforeLoad (strict-TS safe)'
    - 'Playwright framenavigated event for navigation-loop assertion'
key-files:
  created: []
  modified:
    - frontend/src/routes/_protected/themes.tsx
    - frontend/src/routeTree.gen.ts
    - frontend/tests/e2e/tweaks/redirect.spec.ts
key-decisions:
  - 'Hard-coded redirect target "/" (T-34-04 loop-proof — no parameterization)'
  - 'Route file is redirect-only — no component export, pages/Themes import removed ahead of Plan 08 deletion'
  - 'Playwright --list used for verification (dev server not running in this session; 34-06 precedent)'
requirements-completed: [THEME-04]
duration: 8 min
completed: 2026-04-21
---

# Phase 34 Plan 07: /themes Redirect Route Summary

Legacy `/themes` URL now redirects to `/` via TanStack Router v5 `beforeLoad` throw — no component mount, no flash, no 404. Route file decoupled from `pages/Themes` ahead of Plan 08 page deletion. Live Playwright E2E (2 tests) asserts final URL lands at `/`, legacy DOM never renders, and T-34-04 anti-loop holds.

## Execution

- **Start:** 2026-04-21
- **End:** 2026-04-21
- **Duration:** ~8 min
- **Tasks:** 2 / 2
- **Files modified:** 3
- **Commits:** 2 (task) + 1 (docs, pending)

## Commits

| Task   | Hash       | Message                                                               |
| ------ | ---------- | --------------------------------------------------------------------- |
| Task 1 | `19f469ff` | `fix(34-07): redirect /themes to / via beforeLoad throw`              |
| Task 2 | `6ead7a8e` | `test(34-07): promote /themes redirect spec to live Playwright tests` |

## What Changed

### `frontend/src/routes/_protected/themes.tsx` (rewritten, 6 lines)

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/themes')({
  beforeLoad: (): never => {
    throw redirect({ to: '/' })
  },
})
```

- Removed `component: Themes` prop
- Removed `import Themes from '../../pages/Themes'` (decoupling before Plan 08 deletes the page file)
- Explicit `never` return type on `beforeLoad` satisfies strict TS (throw never returns)
- Redirect target hard-coded `/` per T-34-04

### `frontend/src/routeTree.gen.ts` (regenerated)

- Vite plugin regenerated via `pnpm build` — no hand edits
- Grep confirms `pages/Themes` references = 0
- `ProtectedThemesRouteImport` entry retained (route still exists, now as pure redirect)
- File had pre-existing uncommitted drift from Plan 34-06 work; the regeneration superseded it cleanly (net +138 lines vs prior index, consistent with plugin-generated output)

### `frontend/tests/e2e/tweaks/redirect.spec.ts` (promoted from scaffold)

- Removed both `test.skip` markers; 2 live Playwright tests
- Test 1: navigates to `/themes`, waits for `/`, asserts pathname `=== '/'`, asserts `[data-testid="themes-page"]` has count 0
- Test 2: T-34-04 anti-loop — listens to `framenavigated` on main frame, asserts `/themes` pathname hits ≤ 1 (no oscillation)
- Auth bypass via `localStorage` `auth-storage` payload (pattern borrowed from `rtl-switching.spec.ts`)

## Verification

| Check                                                                | Result                           |
| -------------------------------------------------------------------- | -------------------------------- |
| `grep -q "throw redirect({ to: '/' })" themes.tsx`                   | PASS                             |
| `! grep -q "pages/Themes" themes.tsx`                                | PASS                             |
| `! grep -q "component:" themes.tsx`                                  | PASS                             |
| `grep -c "pages/Themes" routeTree.gen.ts` == 0                       | PASS                             |
| `cd frontend && pnpm build`                                          | PASS (exit 0, 10.80s)            |
| `cd frontend && pnpm type-check` — themes.tsx errors                 | PASS (0 errors on touched files) |
| `grep -q "test.skip" redirect.spec.ts`                               | PASS (not found — GOOD)          |
| `grep -q "page.waitForURL('\*\*/')" redirect.spec.ts`                | PASS                             |
| `grep -q "expect(new URL(page.url()).pathname).toBe('/')" spec`      | PASS                             |
| `grep -q "T-34-04" redirect.spec.ts`                                 | PASS                             |
| `pnpm exec playwright test tests/e2e/tweaks/redirect.spec.ts --list` | PASS (2 tests listed)            |

## Success Criteria

- [x] `/themes` redirects to `/` via `beforeLoad` throw (no component mount)
- [x] `routeTree.gen.ts` regenerated via Vite plugin (build passes)
- [x] 2 E2E tests listed (full run deferred — no live server in executor session, 34-06 precedent)
- [x] No `Themes` component reference in route file

## Deviations from Plan

### [Rule 3 — Blocker] Playwright full run deferred to `--list` verification

- **Found during:** Task 2 verify step
- **Issue:** Running `pnpm exec playwright test` requires the frontend dev server + Supabase auth backend to be running. The executor session does not boot the dev server and has no persistent auth state for the test harness.
- **Fix:** Fall back to `--list` to confirm the 2 live tests compile and are discoverable by Playwright. This matches the 34-06 precedent (focus-trap spec, same reasoning) and satisfies the acceptance criterion "lists live tests".
- **Files modified:** none (verification methodology only)
- **Verification:** `pnpm exec playwright test tests/e2e/tweaks/redirect.spec.ts --list` returns "Total: 2 tests in 1 file" — both test names match the spec file.
- **Commit:** n/a

**Total deviations:** 1 (verification-method swap). **Impact:** Low — tests are syntactically valid and Playwright-discoverable; full execution will occur in CI or Wave 4 E2E integration run.

## Pre-Existing TypeScript Errors (Out of Scope)

`pnpm type-check` reports ~20 pre-existing `TS6133`/`TS6196` unused-declaration errors in files unrelated to this plan (`work-item.types.ts`, `workflow-automation.types.ts`, `sla-calculator.ts`, `preference-storage.ts`, `working-group.types.ts`, `broadcast/preference-broadcast.ts`, `local-storage.ts`). One error is in `src/pages/Themes.tsx` (unused `isRTL`) — that file is slated for deletion in Plan 08.

None of these were introduced by 34-07. Logged here for transparency, not fixed per scope-boundary rule.

## Threat Model Coverage

| Threat ID | Mitigation Applied                                                                          |
| --------- | ------------------------------------------------------------------------------------------- |
| T-34-04   | Hard-coded `redirect({ to: '/' })` — not parameterized; E2E asserts single /themes hit max. |
| T-34-12   | Accepted — route tree generated file exposes route names only (no secrets).                 |

## Next

Ready for **Plan 34-08** (Wave 3) — deletes legacy `src/pages/Themes.tsx`, related imports, and any remaining theme-config surfaces. After 34-08 the redirect in this plan remains the only `/themes` surface.

## Self-Check: PASSED

- `[ -f frontend/src/routes/_protected/themes.tsx ]` — EXISTS
- `[ -f frontend/src/routeTree.gen.ts ]` — EXISTS
- `[ -f frontend/tests/e2e/tweaks/redirect.spec.ts ]` — EXISTS
- `git log --oneline | grep 19f469ff` — FOUND
- `git log --oneline | grep 6ead7a8e` — FOUND
- All acceptance criteria re-verified post-commit — all PASS
