---
phase: 46-visual-baseline-regeneration
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/playwright.config.ts
  - frontend/tests/e2e/dashboard-widgets-visual.spec.ts
  - frontend/src/pages/Dashboard/widgets/KpiStrip.tsx
  - frontend/src/pages/Dashboard/widgets/WeekAhead.tsx
  - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
  - frontend/src/pages/Dashboard/widgets/Digest.tsx
  - frontend/src/pages/Dashboard/widgets/SlaHealth.tsx
  - frontend/src/pages/Dashboard/widgets/VipVisits.tsx
  - frontend/src/pages/Dashboard/widgets/MyTasks.tsx
  - frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx
  - frontend/tests/e2e/__snapshots__/dashboard-widgets/*.png
  - .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
autonomous: false
requirements: [VIS-01, VIS-04]
must_haves:
  truths:
    - 'VIS-01 requires eight widget-level baselines, not the existing page-level dashboard matrix.'
    - 'Dashboard widget baselines must be committed under frontend/tests/e2e/__snapshots__/dashboard-widgets/.'
    - 'Use pnpm -C frontend or --filter intake-frontend; --filter frontend is not a valid package selector in this repo.'
    - 'Use Phase 45 seeded staging data through Doppler; do not add mock dashboard data.'
    - 'VIS-04 evidence starts here: each generated dashboard baseline path must be recorded in 46-VALIDATION.md.'
  artifacts:
    - path: 'frontend/tests/e2e/dashboard-widgets-visual.spec.ts'
      provides: 'dashboard-widgets Playwright visual job with eight widget-level screenshots'
    - path: 'frontend/tests/e2e/__snapshots__/dashboard-widgets/'
      provides: 'eight committed dashboard widget baseline PNGs'
    - path: '.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md'
      provides: 'human review rows for dashboard widget baselines'
  key_links:
    - from: 'frontend/src/pages/Dashboard/widgets/*'
      to: 'frontend/tests/e2e/dashboard-widgets-visual.spec.ts'
      via: 'data-testid root selectors'
    - from: 'frontend/playwright.config.ts'
      to: 'frontend/tests/e2e/__snapshots__/dashboard-widgets/'
      via: 'chromium-dashboard-widgets screenshot path template'
---

# Plan 46-01: Dashboard Widget Baselines

**Phase:** 46 (visual-baseline-regeneration)
**Wave:** 1
**Depends on:** none
**Type:** implementation + visual baseline capture
**TDD:** false (Playwright visual baseline generation)
**Estimated effort:** M (2-4 h with staging credentials)

## Goal

Create the missing `dashboard-widgets` visual-regression target, regenerate the
eight Phase 38 widget baselines against the Phase 45 seeded staging database,
verify the same job without `--update-snapshots`, and record the dashboard
human-review rows in `46-VALIDATION.md`.

<execution_context>
@$HOME/.codex/get-shit-done/workflows/execute-plan.md
@$HOME/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/46-visual-baseline-regeneration/46-RESEARCH.md
@.planning/phases/46-visual-baseline-regeneration/46-UI-SPEC.md
@.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
@.planning/phases/46-visual-baseline-regeneration/46-PATTERNS.md
@frontend/playwright.config.ts
@frontend/tests/e2e/list-pages-visual.spec.ts
@frontend/tests/e2e/dashboard-visual.spec.ts
@frontend/tests/e2e/support/list-pages-auth.ts
@frontend/tests/e2e/support/dossier-drawer-fixture.ts
@frontend/design-system/inteldossier_handoff_design/reference/dashboard.png
</context>

<threat_model>
T-46-01 false baseline target: mitigated by adding widget-root locators and
capturing one screenshot per VIS-01 widget name.
T-46-02 stale or empty widget data: mitigated by running through Doppler
against the Phase 45 seeded staging database and seeding RecentDossiers
localStorage for the widget that is client-state backed.
T-46-03 snapshot path drift: mitigated by a dedicated Playwright project with
`expect.toHaveScreenshot.pathTemplate` set to the required dashboard folder.
Block on high severity: if any widget snapshot is empty, missing, generated
outside the required folder, or fails no-update replay, stop and do not mark
VIS-01 complete.
</threat_model>

## Files to create / modify

| Path                                                                                                                                 | Action | Notes                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------- |
| `frontend/playwright.config.ts`                                                                                                      | modify | Add `chromium-dashboard-widgets` project and keep default `chromium` from double-running the new spec |
| `frontend/tests/e2e/dashboard-widgets-visual.spec.ts`                                                                                | create | Eight widget screenshots with deterministic waits                                                     |
| `frontend/src/pages/Dashboard/widgets/{KpiStrip,WeekAhead,OverdueCommitments,Digest,SlaHealth,VipVisits,MyTasks,RecentDossiers}.tsx` | modify | Add test-only `data-testid` roots                                                                     |
| `frontend/tests/e2e/__snapshots__/dashboard-widgets/*.png`                                                                           | create | Eight widget baseline PNGs                                                                            |
| `.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md`                                                                  | modify | Mark dashboard rows with exact generated files and review status                                      |

<tasks>
<task id="46-01-01" type="execute">
<name>Add dashboard widget visual target</name>
<read_first>
- .planning/phases/46-visual-baseline-regeneration/46-PATTERNS.md
- frontend/playwright.config.ts
- frontend/tests/e2e/list-pages-visual.spec.ts
- frontend/tests/e2e/support/list-pages-auth.ts
- frontend/tests/e2e/support/dossier-drawer-fixture.ts
- frontend/src/pages/Dashboard/widgets/KpiStrip.tsx
- frontend/src/pages/Dashboard/widgets/WeekAhead.tsx
- frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
- frontend/src/pages/Dashboard/widgets/Digest.tsx
- frontend/src/pages/Dashboard/widgets/SlaHealth.tsx
- frontend/src/pages/Dashboard/widgets/VipVisits.tsx
- frontend/src/pages/Dashboard/widgets/MyTasks.tsx
- frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx
</read_first>
<files>
- modify: frontend/playwright.config.ts
- create: frontend/tests/e2e/dashboard-widgets-visual.spec.ts
- modify: frontend/src/pages/Dashboard/widgets/KpiStrip.tsx
- modify: frontend/src/pages/Dashboard/widgets/WeekAhead.tsx
- modify: frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
- modify: frontend/src/pages/Dashboard/widgets/Digest.tsx
- modify: frontend/src/pages/Dashboard/widgets/SlaHealth.tsx
- modify: frontend/src/pages/Dashboard/widgets/VipVisits.tsx
- modify: frontend/src/pages/Dashboard/widgets/MyTasks.tsx
- modify: frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx
</files>
<action>
Add these exact root selectors to the existing widget root element in each file:

```tsx
data-testid="dashboard-widget-kpi-strip"
data-testid="dashboard-widget-week-ahead"
data-testid="dashboard-widget-overdue-commitments"
data-testid="dashboard-widget-digest"
data-testid="dashboard-widget-sla-health"
data-testid="dashboard-widget-vip-visits"
data-testid="dashboard-widget-my-tasks"
data-testid="dashboard-widget-recent-dossiers"
```

Do not change user-visible text, layout classes, token names, or data hooks.

In `frontend/playwright.config.ts`, add a dedicated project:

```ts
{
  name: 'chromium-dashboard-widgets',
  testMatch: /dashboard-widgets-visual\.spec\.ts$/,
  use: { ...devices['Desktop Chrome'] },
  expect: {
    toHaveScreenshot: {
      pathTemplate: '{testDir}/__snapshots__/dashboard-widgets/{arg}{ext}',
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixels: 100,
    },
  },
}
```

Prevent the default `chromium` project from also running
`dashboard-widgets-visual.spec.ts` by adding a `testIgnore` entry for that file
to the existing `chromium` project.

Create `frontend/tests/e2e/dashboard-widgets-visual.spec.ts` with:

- imports from `@playwright/test`
- `loginForListPages` from `./support/list-pages-auth`
- `seedRecentDossierStore` from `./support/dossier-drawer-fixture`
- a frozen clock at `2026-04-26T12:00:00Z`
- transition/animation/caret suppression copied from `list-pages-visual.spec.ts`
- `page.setViewportSize({ width: 1280, height: 1000 })`
- `await seedRecentDossierStore(page)` before login
- `await loginForListPages(page, 'en')`
- `await page.goto('/dashboard')`
- `await page.waitForSelector('.dash-root')`
- `await page.waitForFunction(() => document.fonts.ready)`
- `await page.clock.runFor(100)`

Define this exact widget matrix:

```ts
const WIDGETS = [
  ['dashboard-widget-kpi-strip', 'kpi-strip'],
  ['dashboard-widget-week-ahead', 'week-ahead'],
  ['dashboard-widget-overdue-commitments', 'overdue-commitments'],
  ['dashboard-widget-digest', 'digest'],
  ['dashboard-widget-sla-health', 'sla-health'],
  ['dashboard-widget-vip-visits', 'vip-visits'],
  ['dashboard-widget-my-tasks', 'my-tasks'],
  ['dashboard-widget-recent-dossiers', 'recent-dossiers'],
] as const
```

For each entry, wait for `[data-testid="<selector>"]`, assert it is visible,
and call:

```ts
await expect(page.getByTestId(selector)).toHaveScreenshot(`${name}.png`, {
  animations: 'disabled',
  maxDiffPixelRatio: 0.02,
})
```

</action>
<verify>
rg "chromium-dashboard-widgets|__snapshots__/dashboard-widgets|dashboard-widgets-visual\\.spec\\.ts" frontend/playwright.config.ts
rg "dashboard-widget-kpi-strip|dashboard-widget-week-ahead|dashboard-widget-overdue-commitments|dashboard-widget-digest|dashboard-widget-sla-health|dashboard-widget-vip-visits|dashboard-widget-my-tasks|dashboard-widget-recent-dossiers" frontend/src/pages/Dashboard/widgets frontend/tests/e2e/dashboard-widgets-visual.spec.ts
pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets --list
</verify>
<acceptance_criteria>
- `frontend/playwright.config.ts` contains `chromium-dashboard-widgets`.
- `frontend/playwright.config.ts` contains `__snapshots__/dashboard-widgets`.
- `frontend/tests/e2e/dashboard-widgets-visual.spec.ts` exists.
- The new spec contains all eight snapshot names: `kpi-strip`, `week-ahead`, `overdue-commitments`, `digest`, `sla-health`, `vip-visits`, `my-tasks`, `recent-dossiers`.
- The eight widget source files contain their assigned `data-testid` values.
- `pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets --list` lists 8 tests.
</acceptance_criteria>
</task>

<task id="46-01-02" type="execute">
<name>Generate and verify eight dashboard widget baselines</name>
<read_first>
- frontend/tests/e2e/dashboard-widgets-visual.spec.ts
- frontend/playwright.config.ts
- .planning/phases/45-schema-seed-closure/45-VERIFICATION.md
- .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</read_first>
<files>
- create: frontend/tests/e2e/__snapshots__/dashboard-widgets/kpi-strip.png
- create: frontend/tests/e2e/__snapshots__/dashboard-widgets/week-ahead.png
- create: frontend/tests/e2e/__snapshots__/dashboard-widgets/overdue-commitments.png
- create: frontend/tests/e2e/__snapshots__/dashboard-widgets/digest.png
- create: frontend/tests/e2e/__snapshots__/dashboard-widgets/sla-health.png
- create: frontend/tests/e2e/__snapshots__/dashboard-widgets/vip-visits.png
- create: frontend/tests/e2e/__snapshots__/dashboard-widgets/my-tasks.png
- create: frontend/tests/e2e/__snapshots__/dashboard-widgets/recent-dossiers.png
- modify: .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</files>
<action>
Run the dashboard widget update command from the repository root:

```bash
doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets --update-snapshots
```

Then run the same target without snapshot updates:

```bash
doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets
```

If Doppler or staging credentials are unavailable, stop and record the blocker
in the plan summary. Do not create fake or placeholder screenshots.

After the no-update command passes, verify exactly eight dashboard PNG files:

```bash
find frontend/tests/e2e/__snapshots__/dashboard-widgets -maxdepth 1 -type f -name '*.png' | sort
```

Update the VIS-01 rows in `46-VALIDATION.md` with the exact generated file
paths. Mark `Result` as `PASS` only after a human reviewer confirms each
widget matches `frontend/design-system/inteldossier_handoff_design/reference/dashboard.png`.
If review is not yet performed, leave `Result` as `pending` and add the
generated path.
</action>
<verify>
test -f frontend/tests/e2e/**snapshots**/dashboard-widgets/kpi-strip.png
test -f frontend/tests/e2e/**snapshots**/dashboard-widgets/week-ahead.png
test -f frontend/tests/e2e/**snapshots**/dashboard-widgets/overdue-commitments.png
test -f frontend/tests/e2e/**snapshots**/dashboard-widgets/digest.png
test -f frontend/tests/e2e/**snapshots**/dashboard-widgets/sla-health.png
test -f frontend/tests/e2e/**snapshots**/dashboard-widgets/vip-visits.png
test -f frontend/tests/e2e/**snapshots**/dashboard-widgets/my-tasks.png
test -f frontend/tests/e2e/**snapshots**/dashboard-widgets/recent-dossiers.png
doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets
rg "frontend/tests/e2e/**snapshots**/dashboard-widgets/(kpi-strip|week-ahead|overdue-commitments|digest|sla-health|vip-visits|my-tasks|recent-dossiers)\\.png" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</verify>
<acceptance_criteria>

- `find frontend/tests/e2e/__snapshots__/dashboard-widgets -maxdepth 1 -type f -name '*.png' | wc -l` prints `8`.
- The no-update dashboard command exits 0.
- `46-VALIDATION.md` names all eight dashboard baseline paths.
- `git status --short frontend/tests/e2e/__snapshots__/dashboard-widgets` shows the eight PNGs as tracked or staged changes, not ignored files.
- No files under `frontend/tests/e2e/*-snapshots/` outside dashboard-widgets are modified by this plan.
  </acceptance_criteria>
  </task>
  </tasks>

<verification>
Run:

```bash
pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets --list
doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets
find frontend/tests/e2e/__snapshots__/dashboard-widgets -maxdepth 1 -type f -name '*.png' | wc -l
rg "VIS-01|dashboard-widgets" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
```

</verification>

<success_criteria>

- VIS-01 has a concrete `dashboard-widgets` Playwright target.
- Eight widget-level dashboard PNGs are committed under the required folder.
- The no-update dashboard visual replay exits 0.
- `46-VALIDATION.md` carries review rows for the eight dashboard baselines.
  </success_criteria>
