---
phase: 18-e2e-test-suite
plan: 03
subsystem: testing
tags: [e2e, playwright, specs, wave-3, rtl, arabic]
requires: [18-01, 18-02]
provides:
  - TEST-05 in-app notifications + bell badge + preferences
  - TEST-06 work-item kanban drag across all columns (@dnd-kit manual pointer)
  - TEST-08 dossier CSV export + re-import round-trip
  - TEST-09 AI briefing generation (stubbed AnythingLLM via page.route)
  - TEST-10 Operations Hub zones, role-scoped visibility, item click-through
  - TEST-01/03/04 Arabic RTL smoke pack (dir=rtl asserted)
affects:
  - tests/e2e/ (5 new wave-3 specs + 3 AR smoke specs, 2 legacy specs deleted)
  - tests/e2e/support/pages/WorkItemKanbanPage.ts (dragCardToColumn implemented)
  - tests/e2e/support/pages/LoginPage.ts (bilingual selectors)
tech-stack:
  added: []
  patterns:
    - Manual pointer sequence for @dnd-kit drag (mouse.down → nudge → stepped move → up)
    - page.route() stubs for LLM endpoints to keep CI deterministic
    - page.request for same-session API calls (cookie/JWT auto-attached)
    - fs.mkdtempSync + download.saveAs for download round-trip tests
    - storageState re-login (not in-app toggle) for role-scoped zone assertions
    - Language-agnostic POMs with bilingual regex selectors (EN|AR)
key-files:
  created:
    - tests/e2e/05-notifications.spec.ts
    - tests/e2e/06-work-item-crud.spec.ts
    - tests/e2e/08-export-import.spec.ts
    - tests/e2e/09-briefing-generation.spec.ts
    - tests/e2e/10-operations-hub.spec.ts
    - tests/e2e/ar-smoke/login.ar.spec.ts
    - tests/e2e/ar-smoke/dossier-navigation.ar.spec.ts
    - tests/e2e/ar-smoke/command-palette.ar.spec.ts
    - .planning/phases/18-e2e-test-suite/18-03-SUMMARY.md
  modified:
    - tests/e2e/support/pages/WorkItemKanbanPage.ts
    - tests/e2e/support/pages/LoginPage.ts
  deleted:
    - tests/e2e/intake-officer-processing.spec.ts
    - tests/e2e/staff-assignments-context.spec.ts
decisions:
  - locator.dragTo() abandoned for @dnd-kit — uses manual mouse sequence with 10px activation nudge and 20-step drop path
  - TEST-09 always stubs BOTH /api/briefings/** and /api/anythingllm/** so no real LLM traffic is observable in CI (T-18-11 accept)
  - TEST-10 role switching uses storageState re-login (JWT-claim driven) rather than an in-app role toggle — exercises the real authorization path
  - Bilingual POM selectors (EN|AR regex alternation) so the same POM powers both chromium-en and chromium-ar-smoke projects
  - Legacy specs staff-assignments-context and intake-officer-processing deleted outright per D-18 — coverage either folded into 06-work-item-crud or explicitly out of TEST-01..11 scope
metrics:
  tasks: 3
  files_created: 8
  files_modified: 2
  files_deleted: 2
  completed: 2026-04-07
---

# Phase 18 Plan 03: Wave 3 Advanced Flows + Arabic Smoke Summary

Shipped five advanced e2e specs (notifications, kanban drag-drop, export/import, stubbed AI briefing, operations hub) plus a three-spec Arabic RTL smoke pack, completing the TEST-01..10 matrix for plan 18 and folding the last two legacy D-18 specs into the POM-driven suite.

## Tasks Completed

| #   | Task                                                                        | Commit     |
| --- | --------------------------------------------------------------------------- | ---------- |
| 1   | TEST-05 notifications + TEST-06 kanban drag + delete 2 legacy specs         | `eabaf870` |
| 2   | TEST-08 export/import + TEST-09 briefing (stubbed) + TEST-10 operations hub | `04fe4847` |
| 3   | Arabic RTL smoke pack (TEST-01/03/04 in AR) + bilingual LoginPage selectors | `e2dee0c7` |

## What Was Built

### `06-work-item-crud.spec.ts` (TEST-06) + `WorkItemKanbanPage.dragCardToColumn`

Single `@mobile`-tagged journey: `analystPage` → `kanban.goto()` → `createTask({ title: uniqueId('task'), priority: 'high' })` → assert card visible in `todo` → drag to `in_progress` → `review` → `done`, asserting presence in each destination column.

The drag helper is the marquee piece of this plan. `locator.dragTo()` does not work against `@dnd-kit` (which listens for `pointermove` with an 8px activation distance, not HTML5 drag events). The implementation performs a manual pointer sequence: `mouse.move(startCenter)` → `mouse.down()` → 10px diagonal nudge in 5 steps (to cross activation distance) → 20-step smooth move to the target column center → `mouse.up()` → 200ms wait for `@dnd-kit`'s drop animation. A helpful error is thrown if either bounding box is missing.

### `05-notifications.spec.ts` (TEST-05)

Three tests under `adminPage`:

- **Bell badge increments** — captures `before` unread count, POSTs to `/api/notifications/test-trigger` using `adminPage.request` (same cookie context as the page), polls `getUnreadCount()` until it exceeds `before`, opens the bell, asserts the triggered title is visible.
- **Mark all read** — triggers two notifications, opens the bell, calls `markAllRead()`, polls until the unread count reaches zero.
- **Preference persists across reload** — opens `/settings/notifications`, toggles `work_item` × `email` off, reloads, asserts `aria-checked="false"` still present.

If the test-trigger endpoint is unavailable (404 / 501), the spec calls `test.skip` with a clear reason rather than hard-failing, so the suite lands before the trigger endpoint is wired.

### `08-export-import.spec.ts` (TEST-08)

`adminPage` → `/dossiers` → `DossierListPage.exportCsv()` (POM handles the `waitForEvent('download')` + click race) → `download.saveAs(tmpDir/export.csv)`. Asserts the file exists, the first line matches `/name/i`, and the CSV body contains the seed dossier name (`E2E_SEED_DOSSIER_NAME` default `Saudi Arabia`). Rewrites the first data row with a unique `e2e-imp-…` name into `import.csv`, calls `DossierListPage.importCsv(importPath)` (`setInputFiles` on the hidden input), and asserts the success toast. Temp dir is created via `fs.mkdtempSync(os.tmpdir(), 'e2e-dossier-csv-')` and is OS-cleaned; imported rows are picked up by `cleanupE2eEntities('e2e-')` in the shared `afterEach`.

### `09-briefing-generation.spec.ts` (TEST-09)

Stubs BOTH endpoints before any navigation:

```ts
await page.route('**/api/briefings/**', (route) =>
  route.fulfill({ status: 200, body: JSON.stringify(stubBriefing) }),
)
await page.route('**/api/anythingllm/**', (route) =>
  route.fulfill({ status: 200, body: JSON.stringify({ textResponse: '…' }) }),
)
```

Then drives `BriefingPage` through `gotoForDossier → openDocsTab → clickGenerateBriefing → waitForBriefingReady` and asserts the stub body text renders. `test.skip` kicks in when `E2E_SEED_DOSSIER_ID` is unset. No real LLM traffic is ever dispatched — `page.route` captures both the app API and any direct AnythingLLM call.

### `10-operations-hub.spec.ts` (TEST-10)

Three tests:

- **All zones visible to admin** — iterates `['intake', 'queue', 'in-progress', 'review', 'completed']` and asserts each via `hub.expectZoneVisible(zone)`.
- **Role scoping** — uses `analystPage` fixture (different storageState, different JWT claims) and asserts `in-progress` is visible while `intake` is hidden. Role switching is done via storageState re-login, not an in-app toggle, because the Ops Hub zone composition is driven by JWT claims server-side.
- **Click-through navigation** — clicks the first `link` inside the `queue` zone and asserts the URL moves to `/(work-items|dossiers|engagements|intake)/<uuid>`. Skips cleanly if the queue is empty.

### Arabic RTL Smoke Pack (`tests/e2e/ar-smoke/*.ar.spec.ts`)

Three specs built to run under the `chromium-ar-smoke` Playwright project (configured in Wave 1):

- **`login.ar.spec.ts`** (TEST-01 in AR) — uses vanilla `base` (no storageState), visits `/login?lang=ar`, asserts `<html dir="rtl">`, uses the now-bilingual `LoginPage.submitButton` which matches `/sign in|login|تسجيل الدخول|دخول/i`, signs in, asserts the dashboard URL, and re-asserts `dir=rtl` survived navigation. Skips when admin credentials are unset.
- **`dossier-navigation.ar.spec.ts`** (TEST-03 in AR) — `analystPage`, `switchLanguage(page, 'ar')`, runs the same list → search → detail → 5-tab iteration as the EN sibling, re-asserting `dir=rtl` at key points (after navigation, after all tab switches).
- **`command-palette.ar.spec.ts`** (TEST-04 in AR) — `adminPage`, `switchLanguage(page, 'ar')`, opens Cmd+K, asserts `dir=rtl` on the overlay (inherited from `<html>`), searches with an English seed dossier name (names are bilingual so the English query still matches), presses Enter, asserts the detail URL + `dir=rtl` preserved.

No new POMs were needed for the AR pack — the same POMs drive both languages.

### POM bilingual update

`LoginPage.ts` email/password labels and submit/sign-out buttons now use bilingual regex selectors (`/email|البريد/i`, `/sign in|login|تسجيل الدخول|دخول/i`, etc.) so the language-agnostic POM hypothesis holds end-to-end. Other POMs were already bilingual from Wave 1/2.

### Legacy spec removal (D-18)

`tests/e2e/intake-officer-processing.spec.ts` and `tests/e2e/staff-assignments-context.spec.ts` deleted. The kanban drag journey from `staff-assignments-context` is now fully covered by `06-work-item-crud.spec.ts`. `intake-officer-processing` covered intake → dossier promotion which is not in the TEST-01..11 matrix and is owned by a future intake-phase spec — it was deleted with the note in the commit body.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 — Blocking]** Most POMs (`NotificationsPage`, `DossierListPage`, `BriefingPage`, `OperationsHubPage`) already had fully-implemented method bodies from Wave 1 — the plan asked me to "fill in" several of these but only `WorkItemKanbanPage.dragCardToColumn` was an actual stub throwing `Error('not implemented')`. I implemented that one method and left the rest untouched.
2. **[Rule 2 — Robustness]** `05-notifications.spec.ts` wraps the backend test-trigger POST in a `failOnStatusCode: false` guard and calls `test.skip` when the endpoint returns non-2xx, so the spec lands cleanly even if `/api/notifications/test-trigger` is not yet wired. This matches the env-gated skip pattern used in Wave 2 for seed-ID gated specs.
3. **[Rule 2 — Bilingual selectors]** `LoginPage.ts` selectors were English-only. The AR smoke pack needs them to resolve in Arabic, so I updated email/password labels and submit/sign-out button regexes to bilingual alternation. This is strictly additive — existing EN specs still match.
4. **[Rule 1 — Stub completeness]** For TEST-09 I stubbed BOTH `/api/briefings/**` AND `/api/anythingllm/**` rather than only the briefings endpoint the plan mentioned. The app may hit AnythingLLM directly in some code paths; belt-and-braces stubbing guarantees no real LLM traffic regardless of which path the UI takes.

### Authentication Gates

None. No secrets were required during spec authoring. Running the suite against staging still requires `E2E_ADMIN_*/ANALYST_*/INTAKE_*` env vars (documented in `.env.test.example` since Wave 1) plus the Phase 17 E2E seed accounts (deferred item from 18-01/18-02).

## Verification

- `pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck --types node tests/e2e/0{5,6,8,9}-*.spec.ts tests/e2e/10-operations-hub.spec.ts tests/e2e/ar-smoke/*.ar.spec.ts tests/e2e/support/pages/{WorkItemKanbanPage,LoginPage}.ts` → **PASSED** (clean, zero errors) for all 10 files.
- All 5 wave-3 specs + 3 AR smoke specs + 2 modified POMs compile under strict mode.
- Every spec imports from `./support/fixtures` (not raw `@playwright/test`) except `login.ar.spec.ts` which correctly uses vanilla `base` for the pre-auth flow, matching the Wave 2 `01-login.spec.ts` pattern.
- `06-work-item-crud.spec.ts` carries the `@mobile` tag.
- `09-briefing-generation.spec.ts` uses `page.route` for both briefing and AnythingLLM endpoints — pattern `page\.route` matches.
- `06-work-item-crud.spec.ts` / `WorkItemKanbanPage.ts` uses manual pointer sequence — pattern `mouse\.(down|move|up)` matches.
- No live suite run was performed — staging execution is gated on Phase 17 E2E seed accounts + test-trigger endpoint availability and remains Wave 4's responsibility.

## Deferred Items

| Item                                                      | Owner             | Notes                                                                                                    |
| --------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| Live suite run against staging                            | Wave 4 CI plan    | Same blocker as 18-01/18-02: Phase 17 E2E seed accounts not yet provisioned                              |
| `/api/notifications/test-trigger` endpoint implementation | Backend follow-up | Spec skips cleanly when missing; needed for TEST-05 to run green                                         |
| `E2E_SEED_DOSSIER_ID` population                          | Wave 4 CI plan    | TEST-09 briefing spec skips without it                                                                   |
| Hardening `OperationsHubPage.zone()` testids              | Wave 4 polish     | Spec assumes `ops-zone-<name>` data-testid naming — will be validated against the live app during Wave 4 |

## Self-Check: PASSED

- All 8 new spec files exist on disk (5 wave-3 + 3 AR smoke) ✓
- 2 legacy specs deleted (`intake-officer-processing`, `staff-assignments-context`) ✓
- 3 commits present in `git log --oneline`: `eabaf870`, `04fe4847`, `e2dee0c7` ✓
- TypeScript strict compile over all 10 touched files passes clean ✓
- `WorkItemKanbanPage.dragCardToColumn` uses manual mouse sequence (grep `mouse\.(down|move|up)` in file) ✓
- `09-briefing-generation.spec.ts` uses `page.route` (grep `page\.route` in file) ✓
- `@mobile` tag present in ≥1 new spec (`06-work-item-crud.spec.ts`) ✓
- LoginPage bilingual selectors in place for AR smoke pack ✓
