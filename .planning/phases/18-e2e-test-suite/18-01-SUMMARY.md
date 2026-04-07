---
phase: 18-e2e-test-suite
plan: 01
subsystem: testing
tags: [e2e, playwright, infrastructure, pom]
requires: []
provides:
  - single root playwright.config.ts with setup + chromium-en + chromium-ar-smoke + chromium-mobile projects
  - auth.setup.ts producing per-role storageState JSON
  - fixtures.ts with adminPage/analystPage/intakePage + cleanup afterEach
  - 10 POM stubs ready for Wave 2/3 spec authoring
  - nanoid-backed e2eId helper for unique test entities
affects:
  - playwright.config.ts (reconciled)
  - frontend/playwright.config.ts (deleted)
  - .env.test.example (expanded)
  - .gitignore (storageState exclusion)
tech-stack:
  added: [nanoid@5.1.7]
  patterns:
    [Playwright storageState, POM with getByRole-first, service-role cleanup with e2e-% scoping]
key-files:
  created:
    - tests/e2e/support/auth.setup.ts
    - tests/e2e/support/fixtures.ts
    - tests/e2e/support/helpers/unique-id.ts
    - tests/e2e/support/helpers/supabase-admin.ts
    - tests/e2e/support/helpers/language.ts
    - tests/e2e/support/pages/LoginPage.ts
    - tests/e2e/support/pages/DossierListPage.ts
    - tests/e2e/support/pages/DossierDetailPage.ts
    - tests/e2e/support/pages/WorkItemKanbanPage.ts
    - tests/e2e/support/pages/OperationsHubPage.ts
    - tests/e2e/support/pages/CommandPalettePage.ts
    - tests/e2e/support/pages/NotificationsPage.ts
    - tests/e2e/support/pages/CalendarPage.ts
    - tests/e2e/support/pages/EngagementPage.ts
    - tests/e2e/support/pages/BriefingPage.ts
    - tests/e2e/support/storage/.gitkeep
  modified:
    - playwright.config.ts
    - .env.test.example
    - .gitignore
    - package.json (nanoid devDep only)
  deleted:
    - frontend/playwright.config.ts
decisions:
  - storageState one-file-per-role (D-02)
  - AR smoke as its own Playwright project, not tag (D-03)
  - Sharding via CI matrix in Wave 4, not inside config
  - Cleanup scoped strictly to name/title LIKE 'e2e-%' with prod-host refusal guard
metrics:
  tasks: 3
  files_created: 16
  files_modified: 4
  files_deleted: 1
  duration_minutes: ~20
  completed: 2026-04-07
---

# Phase 18 Plan 01: E2E Infrastructure Foundation Summary

Consolidated dual Playwright configs into a single root `playwright.config.ts` with four projects (`setup`, `chromium-en`, `chromium-ar-smoke`, `chromium-mobile`), installed `nanoid`, and scaffolded the full `tests/e2e/support/` tree (auth setup, fixtures with per-role pages and afterEach cleanup, helpers, and 10 typed POM stubs) so Wave 2/3 spec plans can ship against a stable foundation.

## Tasks Completed

| #   | Task                                           | Commit     |
| --- | ---------------------------------------------- | ---------- |
| 1   | Consolidate Playwright config + install nanoid | `de2185bf` |
| 2   | Build auth setup + fixtures + helpers          | `86d66fd8` |
| 3   | POM scaffolding for all 10 surfaces            | `4cb5c605` |

## What Was Built

### Playwright config (`playwright.config.ts`)

Single source of truth at repo root. Projects: `setup` (runs `*.setup.ts`), `chromium-en` (desktop Chrome with admin storageState, ignores AR smoke), `chromium-ar-smoke` (same but locale `ar-SA`, matches `**/ar-smoke/**`), `chromium-mobile` (Pixel 7 device, `@mobile` grep). All non-setup projects declare `dependencies: ['setup']`. `trace: retain-on-failure`, `screenshot: only-on-failure`, `video: retain-on-failure`. `webServer` starts `pnpm dev` unless `E2E_BASE_URL` is set. `dotenv.config({ path: '.env.test' })` loads role credentials.

### Auth setup (`tests/e2e/support/auth.setup.ts`)

Three setup tests (`authenticate as admin|analyst|intake`) that log in each role via email+password and persist `tests/e2e/support/storage/<role>.json`. Throws a clear error if the corresponding `E2E_<ROLE>_EMAIL` / `_PASSWORD` env vars are missing.

### Fixtures (`tests/e2e/support/fixtures.ts`)

Extends `@playwright/test` with:

- `adminPage` / `analystPage` / `intakePage` — role-scoped pages built from each storageState file, cleaned up per test
- `uniqueId` — injects `e2eId(prefix)` for spec-local unique naming
- `afterEach` — calls `cleanupE2eEntities('e2e-')` (best-effort, logs warnings, never throws)

### Helpers

- `unique-id.ts` — `e2eId(prefix) → e2e-${prefix}-${nanoid(10)}`
- `supabase-admin.ts` — lazy service-role client, `cleanupE2eEntities` scoped to `LIKE 'e2e-%'` across `dossiers`, `work_items`, `engagements`, `calendar_events`, `notifications`; refuses to run if `SUPABASE_URL` contains `prod`/`production`
- `language.ts` — `switchLanguage(page, 'en'|'ar')` via `?lang=` query param with UI-click fallback and `html[dir]` assertion

### POM stubs (10 surfaces)

Each class follows: `constructor(public readonly page: Page)`, `readonly` locator getters preferring `getByRole`, async actions with explicit `Promise<void>` return types, no `expect` imports (assertions live in specs). Notable stubs:

- **WorkItemKanbanPage.dragCardToColumn** — intentionally throws; Wave 3 implements via manual mouse sequence because @dnd-kit ignores `locator.dragTo()`
- **BriefingPage.waitForBriefingReady** — Wave 3 will back with `page.route()` mocks to avoid AnythingLLM flake
- **CommandPalettePage.open** — platform-aware `Meta+K` (darwin) / `Control+K` accelerator

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 — Blocking]** Plan requested new npm scripts (`test:e2e:headed`, `test:e2e:ui`, `test:e2e:ar`) in root `package.json`. The working tree had pre-existing uncommitted modifications to `package.json` that the executor was explicitly instructed to leave alone. Only the `nanoid` devDep line was staged via `git add -p`; the script additions are **deferred** to a follow-up once the unrelated pre-existing changes land. `pnpm exec playwright test ...` still works directly. Tracked for Wave 4 CI plan.
2. **[Rule 3 — Blocking]** `pnpm-lock.yaml` already had pre-existing modifications. `pnpm add -D -w nanoid` updated it further; the lockfile was **not staged** (per the "leave pre-existing modifications alone" rule). This means `nanoid` is declared in committed `package.json` but not in the committed lockfile until the pre-existing work is resolved. Flagged as deferred.
3. **[Rule 2 — Scoped cleanup safety]** Added `assertSafeTarget()` to `supabase-admin.ts` that refuses to run cleanup when `SUPABASE_URL` contains `prod` / `production`. Not in plan verbatim but implied by threat T-18-04 (`mitigate` disposition requiring cleanup only against non-prod hosts).

### Authentication Gates

None encountered — no secrets required during scaffolding.

## Verification

- `pnpm exec tsc --noEmit --strict ...` over `tests/e2e/support/**/*.ts` passes with no errors
- Single `playwright.config.ts` exists at repo root; `frontend/playwright.config.ts` deleted
- `nanoid@5.1.7` present in root `package.json` devDependencies
- `.env.test.example` documents all required vars including `SUPABASE_SERVICE_ROLE_KEY` and role-scoped credentials
- `.gitignore` excludes `tests/e2e/support/storage/*.json` while keeping `.gitkeep`

## Deferred Items

| Item                                                            | Owner          | Notes                                                               |
| --------------------------------------------------------------- | -------------- | ------------------------------------------------------------------- |
| Add `test:e2e:headed`, `test:e2e:ui`, `test:e2e:ar` npm scripts | Wave 4 CI plan | Blocked on pre-existing `package.json` changes being resolved first |
| Stage `pnpm-lock.yaml` nanoid entry                             | Wave 4 CI plan | Same blocker                                                        |
| Seed E2E admin/analyst/intake accounts in Phase 17 seed script  | Phase 17 owner | Required before first real `auth.setup.ts` run against staging      |
| Implement `dragCardToColumn` with manual mouse sequence         | Wave 3         | Plan 18-03                                                          |
| Implement `waitForBriefingReady` with `page.route()` mock       | Wave 3         | Plan 18-03                                                          |

## Self-Check: PASSED

- All 16 created files exist on disk ✓
- All 3 commits present in `git log` (`de2185bf`, `86d66fd8`, `4cb5c605`) ✓
- TypeScript strict compile over support tree passes ✓
- `frontend/playwright.config.ts` confirmed deleted ✓
