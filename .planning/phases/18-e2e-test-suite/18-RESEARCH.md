# Phase 18: E2E Test Suite - Research

**Researched:** 2026-04-07
**Domain:** Playwright E2E testing for bilingual React/Supabase monorepo
**Confidence:** HIGH

## Summary

Phase 18 delivers Playwright E2E coverage for 10 critical flows (TEST-01..TEST-10) plus CI
integration with failure artifacts (TEST-11). The project already has Playwright 1.58.2
installed (root `package.json`), 5 existing specs in `tests/e2e/`, and two competing
`playwright.config.ts` files that must be consolidated (D-03). All architectural decisions
are locked in CONTEXT.md — this research confirms those decisions are current best practice
and fills in the prescriptive "how".

**Primary recommendation:** One root `playwright.config.ts` with multiple `projects` —
`setup` (auth storageState), `chromium-en` (all 10 specs), `chromium-ar-smoke` (3 flows),
`chromium-mobile` (subset tagged `@mobile`). Use Playwright fixtures for per-role auth,
nanoid-based unique entity IDs for isolation, and GitHub Actions matrix sharding (2 shards)
with trace/screenshot upload on failure.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Test Architecture**
- **D-01:** Page Object Model — one POM class per major surface (`LoginPage`,
  `DossierListPage`, `DossierDetailPage`, `WorkItemKanbanPage`, `OperationsHubPage`,
  `CommandPalettePage`, `NotificationsPage`, `CalendarPage`, `EngagementPage`,
  `BriefingPage`).
- **D-02:** Shared auth fixture using Playwright `storageState` — cache login per role,
  reuse across specs. No per-test login overhead.
- **D-03:** Consolidate to a single root `playwright.config.ts`. Existing
  `frontend/playwright.config.ts` must be reconciled or removed.
- **D-04:** Spec organization: `tests/e2e/{flow}.spec.ts` for new flows; shared utilities
  in `tests/e2e/support/` (POMs, fixtures, helpers).

**Test Data**
- **D-05:** Phase 17 seed data is the baseline. Tests assume deterministic seed entities
  exist.
- **D-06:** Per-test isolation via unique IDs — `e2e-{nanoid}` suffixes. Tests clean up
  their own entities in `afterEach` where practical.
- **D-07:** Dedicated E2E user accounts per role (admin, analyst, intake officer, etc.)
  seeded in Phase 17 or provisioned during CI setup. Auth fixture caches each role's
  `storageState`.
- **D-08:** No global DB reset between tests — relies on isolation discipline (D-06).

**Bilingual Coverage**
- **D-09:** English is the default for all 10 specs.
- **D-10:** Arabic smoke pack covers 3 RTL-critical flows: login, dossier navigation, Cmd+K.
- **D-11:** AR smoke specs use the same POMs but switch language (selector or `?lang=ar`),
  then assert `dir="rtl"` and key Arabic strings.

**CI Execution & Flake Policy**
- **D-12:** Chromium only.
- **D-13:** 2 parallel shards in CI.
- **D-14:** 2 retries on failure — log retried tests.
- **D-15:** Run on every PR + every push to main. Block merges on failure.
- **D-16:** Screenshots + Playwright traces uploaded as CI artifacts only on failure.
  GitHub Actions default retention (90 days).
- **D-17:** Headless mode in CI; `--headed` available locally via npm script.

**Existing Specs**
- **D-18:** Refactor and fold in the 5 existing specs (`calendar-event-creation`,
  `country-analyst-relationships`, `intake-officer-processing`, `policy-officer-multi-dossier`,
  `staff-assignments-context`) to use the new POM + auth fixture pattern. Map each to its
  requirement during planning.

### Claude's Discretion
- Exact POM API surface (method names, parameter shapes).
- Selector strategy (role-first, fall back to `data-testid`).
- Naming convention for E2E user accounts.
- Whether AR smoke runs as a separate Playwright project or tagged tests.
- Sharding mechanism (Playwright native `--shard` vs GitHub Actions matrix).

### Deferred Ideas (OUT OF SCOPE)
- Cross-browser coverage (Firefox, WebKit).
- Visual regression testing (Percy / Playwright snapshots).
- Load/perf testing in CI.
- Accessibility audit automation (axe-core in E2E).
- Test data factory library beyond simple unique-ID helpers.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Login flow (email/password, session persistence, logout) | `LoginPage` POM + `storageState` fixture; AR smoke variant |
| TEST-02 | Engagement creation & lifecycle transition | `EngagementPage` POM; refactor `policy-officer-multi-dossier.spec.ts` |
| TEST-03 | Dossier navigation (list → detail → tabs → RelationshipSidebar) | `DossierListPage` + `DossierDetailPage` POMs; refactor `country-analyst-relationships.spec.ts`; AR smoke variant |
| TEST-04 | Cmd+K quick switcher (search, navigate, recent items) | `CommandPalettePage` POM; `page.keyboard.press('Meta+K')` / `Control+K`; AR smoke variant |
| TEST-05 | Notifications (receive, read, mark-all-read, preferences) | `NotificationsPage` POM; trigger via backend API, assert bell badge + panel |
| TEST-06 | Work item CRUD (create task, drag kanban, complete) | `WorkItemKanbanPage` POM with `dragTo()`; refactor `staff-assignments-context.spec.ts` |
| TEST-07 | Calendar events (create, view, lifecycle dates) | `CalendarPage` POM; refactor `calendar-event-creation.spec.ts` |
| TEST-08 | Export/import from dossier list | `DossierListPage.exportCsv()` + `page.waitForEvent('download')` |
| TEST-09 | AI briefing generation from Docs tab | `BriefingPage` POM; mock/stub AnythingLLM or use fixture briefing |
| TEST-10 | Operations Hub dashboard (zones, role switching, navigation) | `OperationsHubPage` POM; role switcher via auth fixture re-login |
| TEST-11 | CI integration with screenshots + traces on failure | GitHub Actions workflow extends Phase 14 pipeline; `upload-artifact@v4` on failure |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.58.2 (installed) [VERIFIED: package.json] | E2E test runner + assertions + trace viewer | Already installed; de-facto standard for modern E2E |
| `playwright` | 1.58.2 (installed) [VERIFIED: package.json] | Browser automation driver | Peer of @playwright/test |
| `nanoid` | ^5.x [CITED: npmjs.com/package/nanoid] | Unique entity IDs for test isolation (D-06) | Tiny, URL-safe, collision-resistant |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | already in repo | Load `.env.test` for `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | Config file `require('dotenv').config({ path: '.env.test' })` |
| `@supabase/supabase-js` | already in repo | Direct DB cleanup of e2e entities in `afterEach` | Service-role client in a test-only helper |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright native `--shard` | GitHub Actions matrix with 2 jobs | Matrix is more parallelizable but needs merge-reports step (`blob` reporter + `playwright merge-reports`). Recommend matrix for faster wall time + independent job logs |
| storageState per role | Per-test login | storageState is ~50-200ms per spec vs 2-5s per login — 10-30× faster |
| Role-based selectors | data-testid attributes | Role-first is accessibility-forcing and survives i18n; use `data-testid` only where `getByRole` is ambiguous (e.g., icon-only buttons) |

**Installation:**
```bash
pnpm add -DW nanoid
# Playwright browsers (already installed, verify)
pnpm exec playwright install --with-deps chromium
```

**Version verification note:** `@playwright/test@1.58.2` is already pinned in
`package.json` devDependencies. Before planning, executor should run
`pnpm exec playwright --version` to confirm and `pnpm exec playwright install chromium`
to ensure browsers are present on CI runners. [VERIFIED: package.json line 69]

## Architecture Patterns

### Recommended Project Structure
```
tests/e2e/
├── support/
│   ├── fixtures.ts          # Extended test with auth + cleanup fixtures
│   ├── auth.setup.ts        # One-time login per role → storageState JSON
│   ├── storage/             # .gitignored .auth/*.json files
│   ├── helpers/
│   │   ├── unique-id.ts     # nanoid wrapper: e2eId(prefix)
│   │   ├── supabase-admin.ts# Service-role client for cleanup
│   │   └── language.ts      # switchLanguage(page, 'ar')
│   └── pages/
│       ├── LoginPage.ts
│       ├── DossierListPage.ts
│       ├── DossierDetailPage.ts
│       ├── WorkItemKanbanPage.ts
│       ├── OperationsHubPage.ts
│       ├── CommandPalettePage.ts
│       ├── NotificationsPage.ts
│       ├── CalendarPage.ts
│       ├── EngagementPage.ts
│       └── BriefingPage.ts
├── 01-login.spec.ts                    # TEST-01
├── 02-engagement-lifecycle.spec.ts     # TEST-02
├── 03-dossier-navigation.spec.ts       # TEST-03
├── 04-command-palette.spec.ts          # TEST-04
├── 05-notifications.spec.ts            # TEST-05
├── 06-work-item-crud.spec.ts           # TEST-06
├── 07-calendar-events.spec.ts          # TEST-07
├── 08-export-import.spec.ts            # TEST-08
├── 09-briefing-generation.spec.ts      # TEST-09
├── 10-operations-hub.spec.ts           # TEST-10
└── ar-smoke/
    ├── login.ar.spec.ts
    ├── dossier-navigation.ar.spec.ts
    └── command-palette.ar.spec.ts

playwright.config.ts         # ROOT — single source of truth (D-03)
.env.test.example            # TEST_USER_EMAIL, TEST_USER_PASSWORD, per-role creds
```

### Pattern 1: Playwright `projects` with auth setup dependency
**What:** Declare a `setup` project that performs logins and writes `storageState` JSON
files; spec projects declare `dependencies: ['setup']` and `use.storageState: '...'`.
**When to use:** Always, for suites with authenticated flows.
**Example:**
```ts
// playwright.config.ts — Source: playwright.dev/docs/auth#multiple-signed-in-roles
import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,              // D-14
  workers: process.env.CI ? 2 : undefined,       // D-13 (matches shard count)
  reporter: process.env.CI
    ? [['blob'], ['github']]                     // blob → merged across shards
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',                  // D-16
    screenshot: 'only-on-failure',               // D-16
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium-en',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['setup'],
      testIgnore: /ar-smoke\/.*/,
    },
    {
      name: 'chromium-ar-smoke',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
        locale: 'ar-SA',
      },
      dependencies: ['setup'],
      testMatch: /ar-smoke\/.*\.spec\.ts/,
    },
  ],
  webServer: process.env.CI
    ? undefined                                  // CI uses pre-built static preview
    : {
        command: 'pnpm --filter frontend dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
```

### Pattern 2: Auth setup via `storageState`
```ts
// tests/e2e/support/auth.setup.ts
// Source: playwright.dev/docs/auth (official)
import { test as setup, expect } from '@playwright/test'
import path from 'node:path'

const roles = [
  { name: 'admin',  email: process.env.E2E_ADMIN_EMAIL!,  password: process.env.E2E_ADMIN_PASSWORD! },
  { name: 'analyst',email: process.env.E2E_ANALYST_EMAIL!,password: process.env.E2E_ANALYST_PASSWORD! },
]

for (const role of roles) {
  setup(`authenticate as ${role.name}`, async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(role.email)
    await page.getByLabel(/password/i).fill(role.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page).toHaveURL(/\/(dashboard|hub|$)/)
    await page.context().storageState({ path: path.join('.auth', `${role.name}.json`) })
  })
}
```

### Pattern 3: POM class (role-first selectors)
```ts
// tests/e2e/support/pages/DossierListPage.ts
import type { Page, Locator } from '@playwright/test'

export class DossierListPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly exportButton: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput  = page.getByRole('searchbox', { name: /search dossiers/i })
    this.exportButton = page.getByRole('button',    { name: /export/i })
  }

  async goto(): Promise<void> {
    await this.page.goto('/dossiers')
    await this.page.getByRole('heading', { name: /dossiers/i }).waitFor()
  }

  async openByName(name: string): Promise<void> {
    await this.page.getByRole('link', { name }).click()
  }

  async exportCsv(): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportButton.click(),
    ])
    return download.suggestedFilename()
  }
}
```

### Pattern 4: Fixtures for POMs + cleanup
```ts
// tests/e2e/support/fixtures.ts
import { test as base } from '@playwright/test'
import { DossierListPage } from './pages/DossierListPage'
import { createCleanupRegistry } from './helpers/cleanup'

type Fixtures = {
  dossierList: DossierListPage
  cleanup: ReturnType<typeof createCleanupRegistry>
}

export const test = base.extend<Fixtures>({
  dossierList: async ({ page }, use) => { await use(new DossierListPage(page)) },
  cleanup: async ({}, use) => {
    const registry = createCleanupRegistry()
    await use(registry)
    await registry.flush()                       // teardown in afterEach
  },
})
export { expect } from '@playwright/test'
```

### Pattern 5: Unique ID helper (D-06)
```ts
// tests/e2e/support/helpers/unique-id.ts
import { nanoid } from 'nanoid'
export const e2eId = (prefix: string): string => `${prefix}-e2e-${nanoid(8)}`
// Usage: const engagementTitle = e2eId('eng')  →  "eng-e2e-V1StGXR8"
```

### Pattern 6: Drag-and-drop (TEST-06 kanban)
```ts
// Source: playwright.dev/docs/input#drag-and-drop
await page.locator('[data-testid="work-item-abc"]')
  .dragTo(page.locator('[data-testid="kanban-column-in_progress"]'))
// @dnd-kit often needs a manual pointer sequence as fallback:
const source = page.getByTestId('work-item-abc')
const target = page.getByTestId('kanban-column-in_progress')
await source.hover(); await page.mouse.down()
await target.hover({ force: true }); await page.mouse.up()
```

### Anti-Patterns to Avoid
- **`page.waitForTimeout(n)`**: Flaky. Use web-first assertions (`expect(locator).toBeVisible()`) instead.
- **`page.locator('css=.some-class')` for buttons/links**: Breaks under i18n and CSS refactors. Use `getByRole` first.
- **Manual `page.goto('/login')` in every test**: Negates storageState benefit.
- **Sharing mutable state across specs**: Break `fullyParallel`. Each spec must create its own entities via `e2eId`.
- **`textAlign: 'right'` assertions**: Per CLAUDE.md, that value gets flipped by `forceRTL` on RN — on web, assert `dir="rtl"` on a containing element instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth re-use across specs | Custom login helper per test | Playwright `storageState` + `setup` project | Built-in, 10-30× faster, official docs pattern |
| Unique test IDs | Date.now() / Math.random() | `nanoid(8)` | Collision-resistant under parallel shards |
| Supabase cleanup | Direct REST calls | `@supabase/supabase-js` with service-role key in a test-only helper | Already in repo, typed |
| Download testing | Read disk paths | `page.waitForEvent('download')` | Official API, handles browser quirks |
| Network stubbing | Mock service worker | `page.route('**/api/briefing', …)` | Native Playwright, no extra dep |
| Shard report merging | Custom aggregation | `blob` reporter + `playwright merge-reports` | Official, handles flake annotations |
| CI artifact upload | Custom S3 scripts | `actions/upload-artifact@v4` with `if: failure()` | GitHub-native, 90-day retention |

**Key insight:** Playwright's batteries-included philosophy means nearly every capability
the suite needs ships with `@playwright/test`. The only external deps we need are `nanoid`
and things already in the repo. Resist the urge to write helpers for things Playwright
already does.

## Runtime State Inventory

*Not applicable — Phase 18 adds new test files and CI config; no rename/refactor/migration.*

## Common Pitfalls

### Pitfall 1: storageState expiry causes cascading failures
**What goes wrong:** Supabase JWTs expire (default 1h). If auth setup runs once and tests
run for >1h, later tests get 401s.
**Why it happens:** `storageState` is a snapshot; tokens inside it have finite life.
**How to avoid:** Run `setup` project on every invocation (Playwright does this by
default via `dependencies: ['setup']`). Don't cache `.auth/*.json` between CI jobs.
**Warning signs:** Intermittent auth failures in longer test runs.

### Pitfall 2: @dnd-kit drag tests flake with `dragTo()`
**What goes wrong:** `locator.dragTo()` uses a single pointer event that @dnd-kit's
sensor thresholds may miss.
**Why it happens:** @dnd-kit requires a minimum pointer movement before activating.
**How to avoid:** Use the manual `hover() → mouse.down() → hover(target) → mouse.up()`
sequence shown in Pattern 6. Force `activationConstraint: { distance: 0 }` in a test-only
DndContext wrapper if available.
**Warning signs:** TEST-06 passes in headed mode, fails in headless.

### Pitfall 3: Two competing `playwright.config.ts` files cause invisible double-runs
**What goes wrong:** `pnpm test:e2e` via Turbo picks up `frontend/playwright.config.ts`
AND root config; tests run twice or wrong config wins.
**Why it happens:** Turbo `test:e2e` task in each workspace.
**How to avoid:** D-03 — delete `frontend/playwright.config.ts`, move frontend e2e
tests into root `tests/e2e/`, and scope the turbo task to root only (or make frontend's
`test:e2e` a no-op that defers to root).
**Warning signs:** Different exit codes between `pnpm test:e2e` and
`pnpm exec playwright test`.

### Pitfall 4: Arabic assertions broken by whitespace/bidi marks
**What goes wrong:** Test asserts `getByText('تسجيل الدخول')` but UI renders with an
invisible RTL mark (U+200F) or extra spaces.
**How to avoid:** Use `getByRole('button', { name: /تسجيل/ })` (regex, partial match)
or assert on `dir="rtl"` + role rather than exact text.

### Pitfall 5: Parallel tests collide on seed entities
**What goes wrong:** Two specs both mutate "Saudi Arabia" dossier → race condition.
**How to avoid:** D-06 — every mutation test creates its own entity via `e2eId('dossier')`.
Read-only tests can share seed data.

### Pitfall 6: AI briefing (TEST-09) is slow/non-deterministic
**What goes wrong:** Real AnythingLLM calls take 10-30s and return different text.
**How to avoid:** Either (a) stub via `page.route('**/api/briefings/generate', …)`
with a fixture response, or (b) assert only on structural elements
(briefing panel visible, "Generated at" timestamp present) not content.

### Pitfall 7: CI shards lose trace files without merge-reports
**What goes wrong:** Each shard uploads its own HTML report; failures are hard to find.
**How to avoid:** Use `blob` reporter in CI, upload blob artifacts per shard, then a
final job downloads all blobs and runs `playwright merge-reports --reporter html`.

## Code Examples

### CI Workflow (GitHub Actions)
```yaml
# .github/workflows/e2e.yml — extend Phase 14 pipeline
# Source: playwright.dev/docs/test-sharding
name: E2E Tests
on: [pull_request, push]
jobs:
  e2e:
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2]                            # D-13
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - name: Run E2E shard ${{ matrix.shard }}/2
        env:
          E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          E2E_ANALYST_EMAIL: ${{ secrets.E2E_ANALYST_EMAIL }}
          E2E_ANALYST_PASSWORD: ${{ secrets.E2E_ANALYST_PASSWORD }}
          SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}
        run: pnpm exec playwright test --shard=${{ matrix.shard }}/2
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
          retention-days: 30

  merge-reports:
    if: always()
    needs: e2e
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with: { path: all-blob-reports, pattern: blob-report-* }
      - run: pnpm exec playwright merge-reports --reporter html ./all-blob-reports
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 90                     # D-16
```

### Cmd+K test (TEST-04, cross-platform modifier)
```ts
// Source: playwright.dev/docs/api/class-keyboard
import { test, expect } from './support/fixtures'
test('Cmd+K opens command palette and navigates', async ({ page }) => {
  await page.goto('/')
  const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
  await page.keyboard.press(`${mod}+K`)
  await expect(page.getByRole('dialog', { name: /command/i })).toBeVisible()
  await page.getByRole('combobox').fill('engagements')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/engagements/)
})
```

### Arabic smoke with language switch (TEST-01 AR)
```ts
import { test, expect } from '../support/fixtures'
test('AR: login page renders RTL', async ({ page }) => {
  await page.goto('/login?lang=ar')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('button', { name: /تسجيل/ })).toBeVisible()
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `globalSetup` for auth | `setup` project with `dependencies` | Playwright 1.31+ [CITED: playwright.dev/docs/auth] | Cleaner, runs in parallel, visible in reports |
| `html` reporter per shard | `blob` reporter + `merge-reports` | Playwright 1.37+ | Single unified report across shards |
| `page.waitForTimeout()` | Web-first assertions (auto-retry) | Playwright 1.18+ | Eliminates most flake at source |
| Manual `dataTestId` attributes | `getByRole` + ARIA | Playwright 1.27+ | Accessibility-first, i18n-proof |

**Deprecated/outdated:**
- `page.waitForNavigation()` → use `page.waitForURL()` or assert via `expect(page).toHaveURL()`.
- `test.use({ storageState })` at file level without `setup` project → still works but lacks cache invalidation.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 17 will seed dedicated E2E user accounts per role | D-07 interpretation | If not seeded, Phase 18 needs a CI pre-step to provision users via Supabase admin API — add a task |
| A2 | The staging Supabase project (`zkrcjzdemdmwhearhfgg`) is acceptable as the E2E DB target | Test data | If humans run UAT on staging, E2E writes may pollute it. May need a dedicated `intl-dossier-e2e` Supabase project |
| A3 | Existing `frontend/playwright.config.ts` can be safely deleted (not referenced by other tooling) | D-03 | Low — planner should grep for references before deletion |
| A4 | AnythingLLM endpoint is reachable from CI runners for TEST-09 | TEST-09 | If firewalled, must stub via `page.route()` |
| A5 | @dnd-kit sensors work with Playwright's default `dragTo()` in headless Chromium | TEST-06 | Likely needs manual pointer sequence (Pattern 6) — plan both |
| A6 | GitHub Actions is the CI system (matches Phase 14 reference) | CI | If GitLab/other, workflow YAML changes but pattern holds |

## Open Questions

1. **Is there a separate E2E Supabase project, or do we reuse staging?**
   - What we know: CONTEXT says "E2E must not pollute the staging DB used by humans for UAT"
   - What's unclear: Is a dedicated E2E project already provisioned?
   - Recommendation: Planner should add a Wave 0 task to confirm; if none exists, create one via Supabase MCP

2. **Are per-role E2E user accounts part of Phase 17 seed data, or Phase 18 setup?**
   - What we know: D-07 says "seeded in Phase 17 or provisioned during CI setup"
   - Recommendation: Verify Phase 17 seed script; if not present, add a `scripts/e2e-provision-users.ts` task

3. **Does Operations Hub role-switching require logout, or is it a UI control?**
   - Impact on TEST-10 implementation (re-login vs in-app switch)

4. **Is there an existing `data-testid` convention in the codebase?**
   - If yes, inventory and reuse; if no, planner should define one

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@playwright/test` | All specs | ✓ | 1.58.2 | — |
| `playwright` browsers (chromium) | CI runs | ⚠ Needs `playwright install` | — | `pnpm exec playwright install chromium` in Wave 0 |
| Staging Supabase (zkrcjzdemdmwhearhfgg) | Test runs | ✓ | PG 17.6 | — |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | Auth fixture | ✓ (pattern documented) | — | — |
| Per-role E2E accounts | Auth fixture D-07 | ? Unknown | — | Provision via Supabase admin API in a setup script |
| AnythingLLM endpoint | TEST-09 | ? From CI | — | Stub with `page.route()` |
| GitHub Actions secrets (E2E_*) | CI workflow | ✗ Must be added | — | Planner adds a task to create secrets |
| `nanoid` | Unique IDs | ✗ Not installed | — | `pnpm add -DW nanoid` |

**Missing dependencies with no fallback:**
- GitHub Actions secrets for E2E user credentials — must be created before first CI run

**Missing dependencies with fallback:**
- AnythingLLM — can stub TEST-09 if unreachable
- Per-role accounts — can provision in CI setup if not in seed

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 (E2E) + existing Vitest for unit |
| Config file | `playwright.config.ts` (root, to be consolidated per D-03) |
| Quick run command | `pnpm exec playwright test --project=chromium-en <spec>` |
| Full suite command | `pnpm test:e2e` |
| CI command | `pnpm exec playwright test --shard=N/2` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Login/logout/session persistence | E2E | `playwright test 01-login.spec.ts` | ❌ Wave 0 |
| TEST-02 | Engagement lifecycle transition | E2E | `playwright test 02-engagement-lifecycle.spec.ts` | ❌ (refactor `policy-officer-multi-dossier.spec.ts`) |
| TEST-03 | Dossier nav list→detail→tabs→sidebar | E2E | `playwright test 03-dossier-navigation.spec.ts` | ❌ (refactor `country-analyst-relationships.spec.ts`) |
| TEST-04 | Cmd+K search + navigate + recents | E2E | `playwright test 04-command-palette.spec.ts` | ❌ Wave 0 |
| TEST-05 | Notification receive/read/mark-all/prefs | E2E | `playwright test 05-notifications.spec.ts` | ❌ Wave 0 |
| TEST-06 | Work item create/drag/complete | E2E | `playwright test 06-work-item-crud.spec.ts` | ❌ (refactor `staff-assignments-context.spec.ts`) |
| TEST-07 | Calendar create/view/lifecycle | E2E | `playwright test 07-calendar-events.spec.ts` | ❌ (refactor `calendar-event-creation.spec.ts`) |
| TEST-08 | Dossier list export/import | E2E | `playwright test 08-export-import.spec.ts` | ❌ Wave 0 |
| TEST-09 | AI briefing from Docs tab | E2E | `playwright test 09-briefing-generation.spec.ts` | ❌ Wave 0 |
| TEST-10 | Ops Hub zones + role switching | E2E | `playwright test 10-operations-hub.spec.ts` | ❌ Wave 0 |
| TEST-11 | CI artifacts on failure | Manual/CI | GitHub Actions run, inspect artifacts | ❌ Wave 0 |
| TEST-01/03/04 AR | RTL smoke | E2E | `playwright test --project=chromium-ar-smoke` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm exec playwright test <changed-spec> --project=chromium-en` (< 30s per spec)
- **Per wave merge:** `pnpm test:e2e` (full suite, ~5-10 min with 2 workers)
- **Phase gate:** Full suite green in CI (both shards) + AR smoke green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Consolidate `playwright.config.ts` — delete `frontend/playwright.config.ts`, move any frontend-only specs to root `tests/e2e/`
- [ ] `tests/e2e/support/fixtures.ts` — extended test with POM + cleanup fixtures
- [ ] `tests/e2e/support/auth.setup.ts` — per-role storageState generation
- [ ] `tests/e2e/support/helpers/unique-id.ts` — nanoid wrapper
- [ ] `tests/e2e/support/helpers/supabase-admin.ts` — service-role cleanup client
- [ ] `tests/e2e/support/helpers/language.ts` — AR switcher
- [ ] `tests/e2e/support/pages/*.ts` — 10 POM classes
- [ ] `.env.test.example` — add E2E_{role}_EMAIL / E2E_{role}_PASSWORD entries
- [ ] `.gitignore` — add `.auth/`, `playwright-report/`, `blob-report/`, `test-results/`
- [ ] `.github/workflows/e2e.yml` — matrix sharding + merge-reports
- [ ] GitHub Actions secrets — E2E_ADMIN_EMAIL, etc. (manual step, document in plan)
- [ ] `package.json` scripts — `test:e2e`, `test:e2e:headed`, `test:e2e:ar`, `test:e2e:ui`
- [ ] `pnpm add -DW nanoid`
- [ ] Verify/install chromium: `pnpm exec playwright install --with-deps chromium`

## Project Constraints (from CLAUDE.md)

- **Bilingual mandatory:** Arabic (RTL) + English (LTR) must both work — AR smoke pack (D-10) addresses this
- **Mobile-first:** Touch targets ≥ 44×44 — consider adding `chromium-mobile` project with `...devices['Pixel 5']` for TEST-03 / TEST-06 subset (optional, out of hard scope but recommended)
- **RTL-safe selectors:** Assert `dir="rtl"` on containers; prefer `getByRole` + regex over exact Arabic text match
- **HeroUI v3 + React Aria:** Components have strong ARIA roles — `getByRole` strategy works well. Dropdown placement strings are space-separated in HeroUI v3
- **Work Item terminology:** Use unified terms (`assignee`, `deadline`, `priority: urgent`, `status: in_progress`) in test names/assertions per `work-item.types.ts`
- **Dossier-centric:** TEST-03 must verify dossier → tab navigation across the 8 dossier types; RelationshipSidebar is required surface
- **Test credentials from env:** Never hardcode — use `$TEST_USER_EMAIL` / `$TEST_USER_PASSWORD` (documented in CLAUDE.md) and per-role `E2E_{ROLE}_*` variables
- **pnpm only:** All commands use `pnpm exec`, not `npx`
- **No semicolons, single quotes, trailing commas, 100-col width** (Prettier config)
- **Explicit return types required** on all functions
- **No `any`, no floating promises, no unused vars** (ESLint errors)

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | TEST-01 verifies Supabase Auth login/logout/session persistence |
| V3 Session Management | yes | storageState validates session cookies; TEST-01 covers logout invalidation |
| V4 Access Control | partial | Role-based auth fixtures verify RLS indirectly via per-role storageState |
| V5 Input Validation | no | Out of scope — handled by unit/integration tests |
| V6 Cryptography | no | Supabase manages |

### Known Threat Patterns for E2E infrastructure
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Leaking test credentials in CI logs | Information Disclosure | GitHub Secrets + `::add-mask::`; never `console.log(password)` |
| `.auth/*.json` committed to git | Information Disclosure | `.gitignore` entry for `.auth/`; CI regenerates every run |
| Service-role key used in test helper leaking to client bundle | Elevation of Privilege | `supabase-admin.ts` imported ONLY from `tests/e2e/`, never from `src/` |
| E2E entities polluting production/staging DB | Tampering | A2 above — dedicated E2E project, or e2e-prefix + cleanup |
| Flaky tests masking real regressions | Repudiation | D-14 logs retried tests; persistent flakes get fixed, not suppressed |

## Sources

### Primary (HIGH confidence)
- Playwright official docs — `playwright.dev/docs/auth` (storageState, setup projects) [CITED]
- Playwright official docs — `playwright.dev/docs/test-sharding` (blob reporter, merge-reports) [CITED]
- Playwright official docs — `playwright.dev/docs/input#drag-and-drop` [CITED]
- Playwright official docs — `playwright.dev/docs/pom` (Page Object Model) [CITED]
- `package.json` — Playwright 1.58.2 installed [VERIFIED]
- `CONTEXT.md` — all locked decisions [VERIFIED: .planning/phases/18-e2e-test-suite/18-CONTEXT.md]
- `REQUIREMENTS.md` — TEST-01..TEST-11 acceptance criteria [VERIFIED]
- `CLAUDE.md` — project conventions, bilingual/RTL rules, test credential pattern [VERIFIED]

### Secondary (MEDIUM confidence)
- GitHub Actions `upload-artifact@v4` pattern [CITED: github.com/actions/upload-artifact]
- @dnd-kit + Playwright drag workaround [ASSUMED based on common community reports]

### Tertiary (LOW confidence)
- Exact existing spec content in `tests/e2e/` — not read in this session; planner should inventory each of the 5 files before refactor task sizing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Playwright installed, docs fresh
- Architecture: HIGH — POM + storageState is official pattern
- Pitfalls: MEDIUM-HIGH — common Playwright flake patterns well-known; @dnd-kit specifics noted as assumption A5
- Existing specs: LOW — not inspected; Wave 0 task to inventory

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (Playwright minor releases roughly monthly; re-check if deferred)
