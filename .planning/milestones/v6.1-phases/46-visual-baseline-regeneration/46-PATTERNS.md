# Phase 46: Visual Baseline Regeneration - Pattern Map

**Generated:** 2026-05-08
**Status:** Ready for planning

## Scope Extracted

| Target                                                              | Role                            | Closest analog                                                                                                                                       |
| ------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/tests/e2e/dashboard-widgets-visual.spec.ts`               | New widget-level visual spec    | `frontend/tests/e2e/list-pages-visual.spec.ts` for determinism stack; `frontend/tests/e2e/dashboard-visual.spec.ts` for dashboard login/theme freeze |
| `frontend/playwright.config.ts`                                     | Visual project/path config      | Existing `chromium` project plus Playwright 1.58 `expect.toHaveScreenshot.pathTemplate`                                                              |
| Dashboard widget roots                                              | Stable screenshot locators      | Existing region IDs and `data-testid` patterns in `OverdueCommitments`, `RecentDossiers`, `ForumsStrip`                                              |
| `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/*.png`      | Existing list baselines         | Current Phase 40 snapshot folder                                                                                                                     |
| `frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/*.png`  | Existing drawer baseline folder | Current Playwright default snapshot convention                                                                                                       |
| `.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md` | Human evidence log              | Phase 40/41 `VALIDATION.md` manual-only rows plus Phase 45 `STAGING-VERIFY.md` command evidence                                                      |
| `.github/workflows/e2e.yml`                                         | Focused CI visual replay        | Existing `qa-sweep` frontend job shape                                                                                                               |

## Concrete Patterns

### Playwright Visual Determinism

Use the existing Phase 40 stack:

```ts
await page.clock.install({ time: new Date('2026-04-26T12:00:00Z') })
await page.addInitScript((css) => {
  /* transition suppression */
}, css)
await page.waitForFunction(() => document.fonts.ready)
await page.clock.runFor(100)
```

The dashboard widget spec should also seed RecentDossiers localStorage through:

```ts
import { seedRecentDossierStore } from './support/dossier-drawer-fixture'
```

### Dashboard Widget Locators

Add stable root selectors:

| Widget             | Selector                                             |
| ------------------ | ---------------------------------------------------- |
| KpiStrip           | `data-testid="dashboard-widget-kpi-strip"`           |
| WeekAhead          | `data-testid="dashboard-widget-week-ahead"`          |
| OverdueCommitments | `data-testid="dashboard-widget-overdue-commitments"` |
| Digest             | `data-testid="dashboard-widget-digest"`              |
| SlaHealth          | `data-testid="dashboard-widget-sla-health"`          |
| VipVisits          | `data-testid="dashboard-widget-vip-visits"`          |
| MyTasks            | `data-testid="dashboard-widget-my-tasks"`            |
| RecentDossiers     | `data-testid="dashboard-widget-recent-dossiers"`     |

Do not add a selector to `ForumsStrip` for VIS-01 because the requirement names
eight widgets and excludes ForumsStrip.

### Dashboard Snapshot Path

Use a dedicated Playwright project for dashboard widgets so only that spec uses:

```ts
expect: {
  toHaveScreenshot: {
    pathTemplate: '{testDir}/__snapshots__/dashboard-widgets/{arg}{ext}',
  },
},
```

This satisfies the explicit VIS-01 folder requirement without moving existing
list-page or drawer snapshot folders.

### Operator Commands

Use `pnpm -C frontend`:

```bash
doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets --update-snapshots
doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts --project=chromium --update-snapshots
doppler run -- pnpm -C frontend exec playwright test dossier-drawer-visual.spec.ts --project=chromium --update-snapshots
```

Then run the same commands without `--update-snapshots`.

## Landmines

- `pnpm --filter frontend` is not the package name; use `pnpm -C frontend`.
- The new dashboard widget project should not make the default `chromium`
  project also run the same dashboard widget spec.
- Do not run broad `--update-snapshots` across `frontend/tests/e2e`.
- Do not commit `.auth/storageState.json` or Playwright reports.
- Existing unrelated deleted planning files are present in the worktree; do not
  restore, stage, or commit them.
