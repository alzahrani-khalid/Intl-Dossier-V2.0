# Phase 80: Full-Route Visual + A11y Verification & Smoke Suite - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 11 new/modified files
**Analogs found:** 10 / 11 (1 partial — per-failure `frontend/src` a11y fixes have per-component analogs, resolvable only after characterization)

This is a verification/test-infrastructure phase: every deliverable is a Playwright spec, a CI job, or an evidence ledger. Zero new npm packages; zero new test machinery — everything mirrors proven in-repo patterns from Phases 40–77.

## File Classification

| New/Modified File                                                                  | New? | Role                 | Data Flow                                      | Closest Analog                                                      | Match Quality          |
| ---------------------------------------------------------------------------------- | ---- | -------------------- | ---------------------------------------------- | ------------------------------------------------------------------- | ---------------------- |
| `frontend/tests/e2e/rtl-component-smokes.spec.ts`                                  | NEW  | test (e2e RTL smoke) | DOM/computed-style assertion                   | `frontend/tests/e2e/direction-portals.spec.ts`                      | exact                  |
| `frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts` (or extend `qa-sweep-axe.spec.ts`) | NEW  | test (a11y sweep)    | route-loop → axe scan                          | `frontend/tests/e2e/qa-sweep-axe.spec.ts`                           | exact (self-extension) |
| `.github/workflows/ci.yml` → new `test-rtl-smokes` job                             | MOD  | config (CI job)      | checkout → install → playwright run → artifact | `test-a11y` job, `.github/workflows/ci.yml:334-372`                 | exact                  |
| `frontend/tests/e2e/calendar-rtl.spec.ts` (clock-freeze CI-proofing)               | MOD  | test (e2e RTL smoke) | DOM assertion                                  | self + clock pattern from `dashboard-widgets-visual.spec.ts:59`     | exact                  |
| `frontend/tests/e2e/dashboard-widgets-visual.spec.ts` (FROZEN_TIME realign)        | MOD  | test (visual)        | screenshot compare                             | self-edit (`:11` one constant)                                      | exact                  |
| `frontend/tests/a11y/*.spec.ts` (fix-vs-record edits)                              | MOD  | test (a11y gate)     | axe scan / DOM-structural                      | `frontend/tests/a11y/intake-accessibility.spec.ts` fixme precedent  | exact                  |
| `frontend/src/**` per-failure a11y fixes (IF any `fix` verdicts)                   | MOD  | component            | n/a (aria attrs)                               | per-component, unknown until characterization                       | partial                |
| `frontend/tests/e2e/*-snapshots/` PNG recapture                                    | MOD  | test asset           | screenshot baseline                            | 77-01 replay→approve→update flow (process, not code)                | exact                  |
| `.planning/phases/80-…/80-VISUAL-RECOMPARE.md`                                     | NEW  | evidence ledger      | human-triage record                            | `.planning/phases/77-linear-token-system/77-BASELINE-VALIDATION.md` | role-match             |
| `.planning/phases/80-…/80-A11Y-BASELINE.md`                                        | NEW  | evidence ledger      | A/B violation-set record                       | `77-BASELINE-VALIDATION.md` (structure)                             | role-match             |
| `frontend/package.json` (dead `test:a11y` script, line 16)                         | MOD  | config               | n/a                                            | trivial delete/repoint — no analog needed                           | exact                  |

## Pattern Assignments

### `frontend/tests/e2e/rtl-component-smokes.spec.ts` (test, DOM/computed-style assertion) — NEW

**Analog:** `frontend/tests/e2e/direction-portals.spec.ts` (Phase 76, proven green; the exact pattern family FOUC-02 extends). Covers the 3 gaps: Popover, Pagination, Sidebar. **DOM/computed-style assertions ONLY — no `toHaveScreenshot`** (committed baselines are `-darwin`-named; this spec must run identically on ubuntu CI).

**Imports pattern** (`direction-portals.spec.ts:16-18`):

```ts
import { test, expect, type Page } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { openDrawerForFixtureDossier, FIXTURE_DOSSIER_ID } from './support/dossier-drawer-fixture'
```

**Spec-level setup pattern** (`direction-portals.spec.ts:20, 79-81`):

```ts
test.describe.configure({ retries: 1 })
// ...
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
})
```

**AR login + navigate pattern** (`direction-portals.spec.ts:121-122`):

```ts
await loginForListPages(page, 'ar')
await page.goto(FIXTURE_DETAIL_ROUTE)
```

**Core RTL portal-direction assertion** (`direction-portals.spec.ts:125-131` — mirror for Popover, swapping `dropdown-menu` slots for `popover` slots):

```ts
const trigger = page.locator('[data-slot="dropdown-menu-trigger"]').first()
await trigger.waitFor({ state: 'visible', timeout: 15_000 })
await trigger.click()
const content = page.locator('[data-slot="dropdown-menu-content"]').first()
await expect(content).toBeVisible()
const contentDir = await content.evaluate((el) => getComputedStyle(el as HTMLElement).direction)
expect(contentDir).toBe('rtl')
```

**The RTL edge assertion — the load-bearing pattern** (`direction-portals.spec.ts:134-149`, verbatim; reuse the shape for the sidebar-edge check):

```ts
// The Sheet side="right" drawer anchors via inset-inline-end: 0 → under RTL
// that logical edge resolves to the physical LEFT, so rect.left === 0.
await openDrawerForFixtureDossier(page, { id: FIXTURE_DOSSIER_ID, type: 'country' })
await page.evaluate(() => document.fonts.ready)
const styles = await page.locator('.drawer').evaluate((el) => {
  const computed = getComputedStyle(el as HTMLElement)
  const rect = el.getBoundingClientRect()
  return {
    insetInlineEnd: computed.insetInlineEnd,
    rectLeft: rect.left,
    dir: computed.direction,
  }
})
expect(styles.dir).toBe('rtl')
expect(styles.insetInlineEnd).toBe('0px')
expect(Math.round(styles.rectLeft)).toBe(0)
```

**Target selectors for the 3 new tests (verified in live source):**

| Smoke          | Surface                                                                                                                                    | Stable selector                                                                                                               | Assertion                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popover RTL    | Any `ui/popover.tsx` consumer (SearchableSelect in forms, `waiting-queue/FilterPanel`, `audit-logs/AuditLogFilters`, date-picker popovers) | `[data-slot="popover-trigger"]` / `[data-slot="popover-content"]` (`frontend/src/components/ui/popover.tsx:11,31`)            | computed `direction === 'rtl'` + content box positioned sanely vs trigger box                                                                           |
| Pagination RTL | `/users` (**admin-gated — needs `E2E_ADMIN_*` creds in CI**; sole live consumer per 76-SRTL02-VERIFICATION §2)                             | `a[aria-label="Go to previous page"]` / `a[aria-label="Go to next page"]` (`frontend/src/components/ui/pagination.tsx:54,66`) | chevron `svg` carries `rtl:rotate-180` → assert computed `transform` is the 180° matrix (`matrix(-1, 0, 0, -1, 0, 0)`) in AR, and prev/next order flips |
| Sidebar RTL    | Any authed route in AR                                                                                                                     | `aside.sidebar` — `<aside role="navigation" className="sidebar sb …">` (`frontend/src/components/layout/Sidebar.tsx:74-81`)   | rail sits at inline-start = physical RIGHT: `const box = await aside.boundingBox()` → `Math.round(box.x + box.width) === viewportWidth (1280)`          |

**Error-handling/flake pattern:** no try/catch — Playwright assertions throw; determinism comes from `waitFor({ state: 'visible' })` before interaction, `document.fonts.ready` before geometry reads, and `retries: 1` at describe level. Never `waitForTimeout` for readiness (user testing rules: deterministic waits).

---

### `frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts` (test, route-loop axe sweep) — NEW (or in-place extension)

**Analog:** `frontend/tests/e2e/qa-sweep-axe.spec.ts` (entire file, 39 lines) + theme-pin from `dashboard-widgets-visual.spec.ts:52-58`. VERIFY-02 requires all 4 axes: today's sweep is theme-implicit (dark-only post-77); add the theme dimension = 15 routes × {en, ar} × {light, dark} = 60 scans. This is the **explicit, called-out** coverage extension.

**Core loop pattern** (`qa-sweep-axe.spec.ts:24-39` — add one `theme` loop dimension):

```ts
import { test } from '@playwright/test'

import { V6_ROUTES } from './helpers/v6-routes'
import { runAxe, settlePage, waitForRouteReady } from './helpers/qa-sweep'
import { loginForListPages } from './support/list-pages-auth'

test.describe('Phase 43 — qa-sweep-axe', () => {
  for (const route of V6_ROUTES) {
    for (const locale of route.locales) {
      test(`${route.name} [${locale}] — zero serious/critical axe violations`, async ({ page }) => {
        await loginForListPages(page, locale)
        await page.goto(route.path)
        await settlePage(page)
        // Plan 43-12: gate axe on <main> readiness AND scope it to <main>.
        await waitForRouteReady(page)
        await runAxe(page, { include: 'main' })
      })
    }
  }
})
```

**Theme-pin pattern to add per axis** (`dashboard-widgets-visual.spec.ts:52-58` — runs before bootstrap.js reads `id.theme`):

```ts
await page.addInitScript((theme) => {
  try {
    window.localStorage.setItem('id.theme', theme)
  } catch {
    /* storage may be denied in some configs */
  }
}, theme)
```

(Alternative in-repo hatch: `window.__design.setMode` — DEV/test-gated at `DesignProvider.tsx:317`, used by `qa-sweep-focus-outline`. The `addInitScript` localStorage pin is the first-paint-safe option; prefer it.)

**The gate helper — DO NOT re-implement inline** (`frontend/tests/e2e/helpers/qa-sweep.ts:39-52`; the qa-sweep-axe spec header at lines 8-10 explicitly forbids inlining):

```ts
export async function runAxe(page: Page, options?: { include?: string }): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  if (options?.include) {
    builder = builder.include(options.include)
  }
  const results = await builder.analyze()
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(
    blocking,
    `serious/critical a11y violations:\n${JSON.stringify(blocking, null, 2)}`,
  ).toEqual([])
}
```

**Route registry — single source of truth** (`frontend/tests/e2e/helpers/v6-routes.ts:16-24`; 15 routes, each with `locales: ['en','ar']`):

```ts
export interface V6Route {
  readonly name: string
  readonly path: string
  readonly requiresAuth: boolean
  readonly locales: readonly ('en' | 'ar')[]
  readonly hasMobileVariant: boolean
}
export const V6_ROUTES: readonly V6Route[] = [
  {
    name: 'dashboard',
    path: '/dashboard',
    requiresAuth: true,
    locales: ['en', 'ar'] as const,
    hasMobileVariant: true,
  },
  // ... 14 more
]
```

**Note:** if built as a sibling spec, it is auto-discovered by the `chromium` project (`playwright.config.ts:35` testMatch `e2e/**/*.spec.ts`). Keep the sweep out of the new CI smoke job unless runtime budget allows (60 scans); the baseline A/B run is local either way.

---

### `.github/workflows/ci.yml` — new `test-rtl-smokes` job (config, CI) — MOD

**Analog:** the `test-a11y` job (`.github/workflows/ci.yml:334-372`) — the **local-dev-server + staging-Supabase pattern proven working in CI today** (97 tests execute; its redness is assertion-level, not infra-level). Do NOT mirror `e2e.yml` (deployed-app `E2E_BASE_URL` — the issue-#31 red class).

**Job YAML analog (verbatim, `.github/workflows/ci.yml:334-372`):**

```yaml
test-a11y:
  name: Accessibility Tests (RTL + WCAG AA)
  runs-on: ubuntu-latest
  needs: [lint, type-check]
  env:
    # See E2E Tests job — local dev server authenticates against staging Supabase.
    TEST_USER_EMAIL: ${{ secrets.E2E_ANALYST_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.E2E_ANALYST_PASSWORD }}
    VITE_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
  steps:
    - uses: actions/checkout@v4

    - name: Setup pnpm
      uses: pnpm/action-setup@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Install Playwright Browsers
      run: pnpm exec playwright install --with-deps chromium

    - name: Run Accessibility tests
      run: pnpm exec playwright test --project=a11y --reporter=html
      working-directory: ./frontend

    - name: Upload Accessibility test report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: a11y-report
        path: frontend/playwright-report/
        retention-days: 30
```

**Deltas for the new job (from RESEARCH FOUC-02 §3):**

- Name: `RTL Portal + Component Smokes` (this exact string becomes the required status context)
- Creds: `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` instead of `E2E_ANALYST_*` (the pagination smoke's `/users` route is admin-gated; secrets already exist — consumed by e2e.yml)
- Run step: `pnpm exec playwright test direction-portals.spec.ts calendar-rtl.spec.ts rtl-component-smokes.spec.ts --project=chromium --reporter=html`
- Artifact name: distinct (e.g. `rtl-smokes-report`)
- Workflow header already provides `NODE_VERSION: '22.22.0'` / `PNPM_VERSION: '10.29.1'` (`ci.yml:10-16`) — do not redefine

**Gating:** a green job is advisory until its context joins branch protection (current 8 required contexts verified via `gh api`). The addition is a repo-admin human checkpoint — the file pattern above only creates the job.

---

### `frontend/tests/e2e/calendar-rtl.spec.ts` (test, DOM assertion) — MOD (CI-proofing)

**Analog:** itself (32 lines, keep assertions byte-similar) + the clock-freeze pattern from `dashboard-widgets-visual.spec.ts`. Problem: `/calendar` renders `CalendarEmptyWizard` when the CURRENT month has zero `calendar_entries`; today it survives on July-2026 seed rows → **goes red 2026-08-01** unless frozen.

**Existing locale-pin + assertions to preserve** (`calendar-rtl.spec.ts:7-30`):

```ts
await page.addInitScript(() => {
  try {
    localStorage.setItem('id.locale', 'ar')
  } catch {
    // ignore — non-browser context
  }
})
await page.goto('/calendar')
await page.waitForLoadState('networkidle')

const dow = page.locator('.cal-dow')
await expect(dow).toHaveCount(7)
const labels = await dow.allTextContents()
const hasArabicDow = labels.some((s) => /أحد|إثن|ثلا|أرب|خمي|جمع|سبت/.test(s))
expect(hasArabicDow).toBe(true)

const dayCells = page.locator('.cal-d')
// ... Arabic-Indic digits present, zero Western digits
expect(/[٠-٩]/.test(allDayText)).toBe(true)
expect(/[0-9]/.test(allDayText)).toBe(false)
```

**Clock-freeze pattern to add** (`dashboard-widgets-visual.spec.ts:11,59` — pin to the month the seed rows live in):

```ts
const FROZEN_TIME = new Date('2026-07-02T12:00:00Z')
// ...
await page.clock.install({ time: FROZEN_TIME })
```

Pair with a month-pinned seed (the 3 `SRTL-02 regression seed` rows, 76-SRTL02-VERIFICATION §1) or an evergreen seed — seed changes go through Supabase MCP (orchestrator-only).

---

### `frontend/tests/e2e/dashboard-widgets-visual.spec.ts` (test, visual) — MOD (FROZEN_TIME realign)

**Analog:** self-edit. One constant (`:11`) must track the recapture date, coupled to the same-day staging seed re-refresh:

```ts
// Phase 77-01 (VERIFY-01): the frozen clock MUST align with the today-anchored
// staging seed (b0000002-* engagement_dossiers refreshed to today-relative). ...
const FROZEN_TIME = new Date('2026-07-02T12:00:00Z')
```

Seed SQL is verbatim in `77-BASELINE-VALIDATION.md` §2 (applied via Supabase MCP — orchestrator, not executor). Without both halves, WeekAhead/VipVisits render empty → `.week-row` never appears → capture crashes (proven 46-era + 77-01).

---

### `frontend/tests/a11y/*.spec.ts` fix-vs-record edits (test, a11y gate) — MOD

**Analog:** `frontend/tests/a11y/intake-accessibility.spec.ts` — the in-repo honest-recording convention (10 existing instances across intake + positions specs; there is NO separate allowlist file; do not invent one).

**The record-as-baseline pattern** (`intake-accessibility.spec.ts:33-38`, verbatim):

```ts
// TRACKED APP A11Y DEBT (not a stale test): the intake form/list/queue
// report serious/critical axe violations — button-name (icon/request-type
// buttons without accessible names), aria-prohibited-attr, and target-size
// (WCAG 2.2 touch targets < 24px). Real form/component debt; remove this
// fixme once the intake surface is remediated.
test.fixme(
  true,
  'Intake form/list/queue a11y debt (button-name, aria-prohibited-attr, target-size)',
)
```

Phase-80 records should carry the phase marker in the reason string, e.g. `test.fixme(true, '80: recorded pre-migration baseline — <root cause>')`, plus the `TRACKED APP A11Y DEBT` comment and a matching row in `80-A11Y-BASELINE.md`. A fixme without a root-cause rationale = laundering (locked decision).

**The assertions under adjudication** (`frontend/tests/a11y/dossiers-rtl-a11y.spec.ts:227-286`, the `T074-*-aria` failures — DOM-structural, scanned against real staging dossier IDs from `frontend/tests/fixtures/dossier-fixtures.ts`):

```ts
// Should have main landmark
expect(landmarks.hasMain).toBe(true)
// ... unlabeled buttons/links collected via textContent/aria-label/aria-labelledby/title checks ...
// Allow some unlabeled elements but not too many
expect(missingLabels.length).toBeLessThan(5)
```

Data-drift caveat: verify the 6 `testDossierIds` staging rows still resolve BEFORE classifying — a missing row turns the scan into a 404-page scan that mimics an a11y failure.

**The keyboard-nav failure shape** (`intake-accessibility.spec.ts:54-70` — same assertion also failing in `positions-a11y-en.spec.ts:74` / `positions-a11y-ar.spec.ts:75`):

```ts
await page.keyboard.press('Tab')
const focusedInteractive = await page.evaluate(() => {
  const el = document.activeElement
  if (!el || el === document.body) return false
  const tag = el.tagName.toLowerCase()
  return (
    ['a', 'button', 'input', 'select', 'textarea'].includes(tag) ||
    el.getAttribute('role') === 'button' ||
    el.getAttribute('tabindex') === '0'
  )
})
expect(focusedInteractive).toBe(true)
```

**Do NOT touch the 8 quarantined specs** (`playwright.config.ts:118-131` comment) — their quarantine IS the recorded disposition.

---

### `frontend/src/**` per-failure a11y fixes (component) — MOD, conditional

**No fixed analog** — which files get touched depends on the local characterization run. Likely class per research: icon-button `aria-label` gaps (genuine, small). When fixing, the binding patterns are:

- Match the component's existing `aria-label` usage (e.g. `Sidebar.tsx:76` `aria-label={t('shell.menu.open')}` — i18n-keyed, never hardcoded English)
- All CLAUDE.md rules apply: `var(--*)` tokens only, logical properties only (`ms-*`/`ps-*`/`text-start` — ESLint errors on physical), i18n strings registered in `src/i18n/index.ts` (unregistered namespaces silently fall back to EN in BOTH languages)
- Any src change re-triggers the full required-check gauntlet incl. Bundle Size Check — keep fixes surgical

**HeroUI v3 gotcha carried from Phase 79:** HeroUI `Button` drops `role`/`aria-invalid`/`aria-required` via `filterDOMProps` — if a fix needs those attrs on a HeroUI Button, use `asChild`→plain `button` (proven fix, Phase 79).

---

### `.planning/phases/80-…/80-VISUAL-RECOMPARE.md` + `80-A11Y-BASELINE.md` (evidence ledgers) — NEW

**Analog:** `.planning/phases/77-linear-token-system/77-BASELINE-VALIDATION.md` — the human-checkpoint evidence-doc structure (verified headers):

```markdown
# Phase 77-01 — VERIFY-01 Pre-Swap Visual Baseline Validation

## 1. Pin-state audit (all 12 `tests/e2e/*-visual.spec.ts`)

## 2. Staging seed refresh (Task 2a)

## 3. Regenerated-PNG inventory (Task 2b)

## 4. Replay proof — reproducible, NOT laundered (Task 2c)

## 5. Coverage statement — EXPLICIT, no silent expansion (VERIFY-01)

## 6. Deviations from plan (for human ratification at the checkpoint)

## 7. Files pending the Task-3 baseline commit (UNCOMMITTED — awaiting approval)
```

- `80-VISUAL-RECOMPARE.md`: per-shot verdict table for all 43 surfaces — verdict ∈ {`intended-Linear`, `regression`, `dynamic content, not theme`} (the third class is the 77-01 §1 discipline for widget date strings) + env/date + coverage statement + the human-approval record.
- `80-A11Y-BASELINE.md`: violation-set A (pre-token worktree `14191cb85`) vs B (HEAD), per test/route/axis; "no new violations" = B ⊆ A; per-failure fix-vs-record decision rows with root cause; reference env stated (local seeded dev).
- Pre-commit hook note: lint-staged prettier churns `.planning` md tables — use prettier-ignore fences around wide tables if needed.

---

### `frontend/package.json` `test:a11y` script (config hygiene) — MOD

Verified dead at `frontend/package.json:16`: `"test:a11y": "vitest run --config vitest.a11y.config.ts"` — `vitest.a11y.config.ts` does not exist. Fix = delete or repoint to the real gate (`playwright test --project=a11y`). Trivial; no analog needed.

---

### Visual baseline PNG recapture (test assets) — MOD, process-bound

Not a code pattern — an ordered process from 77-01 (the order IS the anti-laundering control):

1. Replay the 10 specs with `--retries=0`, NO `--update-snapshots` (diff artifacts under `frontend/test-results/` + HTML report)
2. Human triage (`autonomous:false` — locked decision)
3. Fix `regression` verdicts
4. `--update-snapshots` recapture + clean replay proof (`--retries=2`), commit
   Baseline lineage preserved at commit `14191cb85` (verified present). Recapture must happen on darwin (this Mac) — default-path PNGs are `-chromium-darwin`-named; the dashboard-widgets set uses the bare-name `pathTemplate` (`playwright.config.ts:92`) — deliberately, do not "fix".

## Shared Patterns

### Authentication (all new/modified specs)

**Source:** `frontend/tests/e2e/support/list-pages-auth.ts:20-36` + `playwright.config.ts:39,71` (global-setup storageState)

```ts
export async function loginForListPages(page: Page, locale: 'en' | 'ar' = 'en'): Promise<void> {
  if (TEST_EMAIL === '' || TEST_PASSWORD === '') {
    throw new Error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD. ...')
  }
  await page.goto('/login')
  await page.fill('#email', TEST_EMAIL)
  await page.fill('#password', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|operations|home|my-work|engagements|dossiers)/, {
    timeout: 15_000,
  })
  // locale === 'ar' → seeds id.locale + waits for <html dir="rtl" lang="ar">, then
  // pre-dismisses guided-tour overlays (lines 38-76)
}
```

Never write a new login flow. Creds via env only (throws on missing — never hardcode).

### Determinism stack (visual + smoke specs)

**Source:** `dashboard-widgets-visual.spec.ts:47-80`

- `page.addInitScript` pins `id.theme` / `id.locale` BEFORE `bootstrap.js` first paint
- `page.clock.install({ time: FROZEN_TIME })` for date-rendering surfaces
- `SUPPRESS_TRANSITIONS_CSS` injected via `addInitScript` (`:13-23` — kills transitions/animations/caret)
- `await page.evaluate(() => document.fonts.ready)` before geometry/screenshot reads
- `settlePage` / `waitForRouteReady` from `helpers/qa-sweep.ts:137-170` for route readiness (`data-loading` markers + `<main>` visible)

### Axe gate

**Source:** `frontend/tests/e2e/helpers/qa-sweep.ts:39-52` (`runAxe`)
**Apply to:** the 4-axis sweep and any new axe usage. serious/critical filter + wcag2a/2aa/21a/21aa tags is the established gate; the qa-sweep-axe header forbids inline re-implementation. Note: `dossiers-rtl-a11y` additionally uses the `best-practice` tag — record per-spec deltas as-is, don't unify.

### A11y debt recording

**Source:** `frontend/tests/a11y/intake-accessibility.spec.ts:33-38, 109-112`
**Apply to:** every `record` verdict — `test.fixme(true, 'reason with root cause')` + `// TRACKED APP A11Y DEBT: …` comment + ledger row. No new allowlist machinery.

### RTL edge assertion (screenshot-free)

**Source:** `direction-portals.spec.ts:138-149`
**Apply to:** all new RTL smokes — computed `direction`, `insetInlineEnd`, `getBoundingClientRect()` against viewport edges. Platform-independent → safe on ubuntu CI.

### CI job shape (local dev server)

**Source:** `.github/workflows/ci.yml:334-372` (`test-a11y`)
**Apply to:** the new smoke job. Playwright auto-starts `pnpm dev` on :5173 (`playwright.config.ts:144-151` webServer, active because CI leaves `E2E_BASE_URL` unset). Never copy anything from `e2e.yml`.

## No Analog Found

| File                                          | Role      | Reason                                                                                 | Fallback                                                                                                                                                           |
| --------------------------------------------- | --------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/**` a11y fixes (specific files) | component | Touched set unknown until the local characterization run produces the per-failure list | Per-component: mirror that component's existing aria/i18n patterns; CLAUDE.md token + logical-property rules bind; Phase-79 HeroUI `filterDOMProps` gotcha applies |

Everything else has a strong, verified in-repo analog. The branch-protection required-context addition is a `gh api`/Settings action (human checkpoint), not a file.

## Metadata

**Analog search scope:** `frontend/tests/e2e/`, `frontend/tests/a11y/`, `frontend/tests/e2e/helpers/`, `frontend/tests/e2e/support/`, `frontend/src/components/{ui,layout}/`, `.github/workflows/`, `.planning/phases/77-linear-token-system/`
**Files scanned:** 18 read/excerpted, all paths verified on disk; baseline commit `14191cb85` verified in git
**Pattern extraction date:** 2026-07-03
