---
phase: 18-e2e-test-suite
plan: 02
subsystem: testing
tags: [e2e, playwright, specs, wave-2]
requires: [18-01]
provides:
  - TEST-01 login + session + sign-out coverage
  - TEST-03 dossier list -> detail -> tabs -> RelationshipSidebar coverage
  - TEST-04 Cmd+K search + recent items coverage
  - TEST-02 engagement lifecycle (create + planning/active/completed) coverage
  - TEST-07 calendar event create/view + lifecycle-date badges coverage
affects:
  - tests/e2e/ (3 legacy specs removed, 5 new specs added)
tech-stack:
  added: []
  patterns:
    - fixtures-first import (`./support/fixtures`) for all new specs
    - POM instantiation in specs; assertions in specs only
    - `@mobile` tag on at least one assertion path per mobile-critical journey
    - env-gated test.skip for specs requiring seed IDs not in CI
key-files:
  created:
    - tests/e2e/01-login.spec.ts
    - tests/e2e/02-engagement-lifecycle.spec.ts
    - tests/e2e/03-dossier-navigation.spec.ts
    - tests/e2e/04-command-palette.spec.ts
    - tests/e2e/07-calendar-events.spec.ts
    - .planning/phases/18-e2e-test-suite/18-02-SUMMARY.md
  modified: []
  deleted:
    - tests/e2e/country-analyst-relationships.spec.ts
    - tests/e2e/policy-officer-multi-dossier.spec.ts
    - tests/e2e/calendar-event-creation.spec.ts
decisions:
  - D-18 applied: legacy specs deleted (not thin re-exports) — all behavior lives in new POM-driven specs
  - TEST-01 split across two describes so the raw-login test uses `base` (no storageState) while reload/sign-out use `adminPage`
  - Engagement + calendar specs env-gate via `test.skip` when seed IDs missing, so Wave 2 can land before Phase 17 E2E seed accounts exist
metrics:
  tasks: 2
  files_created: 5
  files_modified: 0
  files_deleted: 3
  completed: 2026-04-07
---

# Phase 18 Plan 02: Wave 2 Core Navigation Specs Summary

Landed 5 POM-driven e2e specs covering login, dossier navigation, command palette, engagement lifecycle, and calendar events — all against the Wave 1 fixture + POM scaffolding — and deleted 3 legacy specs (D-18) whose coverage is now fully subsumed.

## Tasks Completed

| #   | Task                                                                     | Commit     |
| --- | ------------------------------------------------------------------------ | ---------- |
| 1   | TEST-01 login + TEST-03 dossier nav + TEST-04 Cmd+K (3 specs, -1 legacy) | `9062e83d` |
| 2   | TEST-02 engagement lifecycle + TEST-07 calendar (2 specs, -2 legacy)     | `51cf89e0` |

## What Was Built

### `01-login.spec.ts` (TEST-01)

Three tests across two describes:

- **Raw login** — uses vanilla `base` (no storageState), navigates to `/login`, fills `E2E_ADMIN_EMAIL/PASSWORD`, asserts dashboard landing. `base.skip` if env vars missing.
- **Session persistence** — uses `adminPage` fixture, reloads, asserts no redirect to `/login`.
- **Sign out** — uses `adminPage`, opens `[data-testid="user-menu"]` if present, calls `LoginPage.signOut()`, asserts `/login`.

### `03-dossier-navigation.spec.ts` (TEST-03)

Single journey test with `analystPage`: opens `/dossiers`, searches seed dossier (`E2E_SEED_DOSSIER_NAME`, default `Saudi Arabia`), asserts link visible, clicks, asserts URL matches `/dossiers/<uuid>`, then iterates all 5 tabs (`overview`, `docs`, `work-items`, `calendar`, `relationships`) asserting `aria-selected="true"`, opens the RelationshipSidebar, asserts at least one `listitem` renders, closes and asserts hidden.

### `04-command-palette.spec.ts` (TEST-04)

Two tests:

- **Open → search → navigate** — `CommandPalettePage.open()` uses platform-aware `Meta+K` / `Control+K`; searches a seed dossier name, asserts option visible, presses Enter, asserts dossier detail URL.
- **Recent items** — visits two dossiers in sequence, reopens palette, asserts the recent group (`role="group"` named `/recent|الأخيرة/i`) contains both.

### `02-engagement-lifecycle.spec.ts` (TEST-02)

Refactor of the deleted `policy-officer-multi-dossier.spec.ts`. Uses `analystPage` + `uniqueId`. Creates an engagement via `EngagementPage.create({ title: uniqueId('engagement'), dossierId, type: 'consultation' })`, asserts the row renders with `planning` badge, drills into the detail view, and walks `active → completed` via `EngagementPage.transitionTo()` asserting the status badge updates each time. Env-gated with `test.skip` if `E2E_SEED_DOSSIER_ID` is unset. Tagged `@mobile`. Cleanup runs via the fixtures `afterEach` hook (`cleanupE2eEntities('e2e-')`).

### `07-calendar-events.spec.ts` (TEST-07)

Refactor of the deleted `calendar-event-creation.spec.ts`. Two tests:

- **Create + view** (`@mobile`) — uses `uniqueId('cal')`, calls `CalendarPage.createEvent`, asserts the card is visible, opens detail via `CalendarPage.viewEvent`, asserts detail panel shows title.
- **Lifecycle dates** — filters `[data-testid="calendar-event"]` by presence of `[data-testid="lifecycle-date-badge"]`, asserts at least one such linked event exists.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 — Blocking]** The plan's Task 1 instructions had me filling in `LoginPage.signIn/signOut`, `DossierListPage.searchByName/openDossier`, `DossierDetailPage.openTab/openRelationshipSidebar/closeRelationshipSidebar`, and `CommandPalettePage.open/search/selectResult/close`. **All of these POM method bodies were already implemented by Wave 1** (see 18-01-SUMMARY.md — the POM stubs include working bodies, not throws). No POM edits were needed; the specs consume the existing implementations directly.
2. **[Rule 2 — Robustness]** `01-login.spec.ts` uses `page.getByTestId('user-menu')` with an `.isVisible()` fallback before invoking `LoginPage.signOut()`, so the test doesn't hard-fail if the sign-out button is rendered directly (no user menu wrapper).
3. **[Rule 2 — Env hygiene]** Specs that depend on seed entity IDs (`SEED_DOSSIER_ID` for engagements) skip cleanly via `test.skip` when the env var is unset, so Wave 2 lands without blocking on Phase 17's E2E seed accounts (flagged as deferred in 18-01-SUMMARY.md).
4. **[Rule 1 — Bug]** First draft of `03-dossier-navigation.spec.ts` called `detail.relationshipSidebar()` as a function, but the Wave 1 POM exposes it as a `get relationshipSidebar(): Locator` property. Fixed to property access.

### Authentication Gates

None encountered — no secrets required during spec authoring. Running the suite against staging will require `E2E_ADMIN_*/ANALYST_*/INTAKE_*` env vars (documented in `.env.test.example` since Wave 1) and Phase 17 E2E seed accounts.

## Verification

- `pnpm exec tsc --noEmit --strict ... tests/e2e/0{1,2,3,4,7}-*.spec.ts` passes clean (no errors) for all 5 new spec files.
- Each spec imports from `./support/fixtures` (not `@playwright/test`) so fixtures and cleanup apply uniformly.
- Legacy specs `country-analyst-relationships.spec.ts`, `policy-officer-multi-dossier.spec.ts`, `calendar-event-creation.spec.ts` removed from disk (`git status` clean).
- 2 specs carry the `@mobile` tag (02, 07) ≥ the plan's "at least one mobile-tagged test" requirement.
- No test run against staging was performed in this plan — staging execution is gated on Phase 17 E2E seed accounts and is Wave 4's responsibility. Local dry-run is blocked on the same dependency.

## Deferred Items

| Item                                                                                  | Owner            | Notes                                                                                                                   |
| ------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Live suite run against staging                                                        | Wave 4 CI plan   | Requires Phase 17 E2E seed accounts (admin/analyst/intake) — same blocker flagged in 18-01-SUMMARY.md                   |
| Hardening of `transitionTo` selector if app uses a dropdown rather than role="button" | Wave 2 follow-up | Falls back via `getByTestId('engagement-status-button')` pattern noted in plan if the button-by-name lookup misses      |
| Populate `E2E_SEED_DOSSIER_ID` + `E2E_SEED_DOSSIER_NAME` in `.env.test.example`       | Wave 4 CI plan   | Currently read with defaults; plan 18-01 already documents role credentials, seed IDs to be added alongside seed script |

## Self-Check: PASSED

- All 5 new spec files exist on disk ✓
- 3 legacy specs deleted (`country-analyst-relationships`, `policy-officer-multi-dossier`, `calendar-event-creation`) ✓
- Both commits present in `git log` (`9062e83d`, `51cf89e0`) ✓
- TypeScript strict compile over new spec files passes ✓
- `@mobile` tag present in ≥1 spec (02 and 07) ✓
