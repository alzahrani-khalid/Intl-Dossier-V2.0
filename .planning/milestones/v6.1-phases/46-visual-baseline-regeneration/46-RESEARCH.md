---
phase: 46
slug: visual-baseline-regeneration
status: complete
created: 2026-05-08
research_enabled: true
---

# Phase 46 - Research

## Objective

Research how to plan Phase 46 well: regenerate the deferred Phase 38 dashboard,
Phase 40 list-page, and Phase 41 dossier-drawer Playwright visual baselines
against the seeded staging database, then document human visual approval.

## Inputs Read

- `.planning/ROADMAP.md` Phase 46 goal and success criteria.
- `.planning/REQUIREMENTS.md` VIS-01..VIS-04.
- `.planning/phases/45-schema-seed-closure/45-VERIFICATION.md`.
- `frontend/playwright.config.ts`.
- `frontend/tests/e2e/dashboard-visual.spec.ts`.
- `frontend/tests/e2e/list-pages-visual.spec.ts`.
- `frontend/tests/e2e/dossier-drawer-visual.spec.ts`.
- `frontend/tests/e2e/support/list-pages-auth.ts`.
- `frontend/tests/e2e/support/dossier-drawer-fixture.ts`.
- `frontend/design-system/inteldossier_handoff_design/README.md`.
- `frontend/design-system/inteldossier_handoff_design/reference/*`.
- `.planning/milestones/v6.0-MILESTONE-AUDIT.md`.

## Key Findings

### Phase 45 Is The Required Precondition

Phase 45 verification passed on 2026-05-08. It applied the digest schema and
seed closure, moved Digest to `source_publication`, moved VipVisits to ISO-based
country flags, and explicitly deferred all visual snapshot regeneration to
Phase 46. Phase 46 must run after that seed state is available through Doppler
and staging credentials.

### Dashboard Requirement Does Not Match Current Spec Shape

VIS-01 names a `dashboard-widgets` Playwright job and eight widget baselines:

- KpiStrip
- WeekAhead
- OverdueCommitments
- Digest
- SlaHealth
- VipVisits
- MyTasks
- RecentDossiers

The repo currently has `frontend/tests/e2e/dashboard-visual.spec.ts`, which
captures eight page-level matrix screenshots:

`[ltr, rtl] x [light, dark] x [768, 1280]`

That is useful historical coverage, but it does not satisfy the VIS-01 wording
because it does not create one baseline per named widget and it does not run via
a `dashboard-widgets` grep target. Phase 46 should add
`frontend/tests/e2e/dashboard-widgets-visual.spec.ts`, add stable `data-testid`
attributes to the eight widget roots, and configure a dedicated Playwright
project so the baselines land under:

`frontend/tests/e2e/__snapshots__/dashboard-widgets/`

Playwright 1.58.2 supports screenshot path templates through
`expect.toHaveScreenshot.pathTemplate`; the installed type docs include this
field in `node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/types/test.d.ts`.

### List-Page Visual Spec Already Has The Right Shape

`frontend/tests/e2e/list-pages-visual.spec.ts` captures 14 baselines:

- countries en/ar
- organizations en/ar
- persons en/ar
- forums en/ar
- topics en/ar
- working-groups en/ar
- engagements en/ar

The spec already includes Phase 40 determinism controls: frozen clock,
transition suppression, `data-loading="false"` wait, font readiness, reduced
motion, and a 1280 x 800 viewport. Existing snapshot files are under:

`frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/`

Phase 46 only needs to regenerate them against the seeded staging state and
verify the same spec without `--update-snapshots`.

### Drawer Visual Spec Already Has The Right Shape

`frontend/tests/e2e/dossier-drawer-visual.spec.ts` captures two baselines:

- `dossier-drawer-ltr-1280.png`
- `dossier-drawer-ar-1280.png`

It uses the Phase 41 fixture helper and waits for
`.drawer-body[data-loading="false"]`. Phase 46 must regenerate these after the
Phase 42/43 token darkening (`--accent-fg` contrast and `inkFaint` contrast)
and after Phase 45 seed closure.

### Command Landmine: Package Name

`frontend/package.json` package name is `intake-frontend`, not `frontend`.
Phase 45 verification noted that `pnpm --filter frontend` matched no package.
Plans should use either:

```bash
pnpm -C frontend exec playwright test ...
```

or:

```bash
pnpm --filter intake-frontend exec playwright test ...
```

All operator-facing commands below use `pnpm -C frontend` to avoid package-name
drift.

### CI Is Not Currently A Focused Visual Gate

`.github/workflows/e2e.yml` has a root E2E job and a frontend QA sweep job, but
no focused job for the three Phase 46 visual specs. Because existing Playwright
snapshot names include the local platform suffix for list/drawer baselines,
the safest CI addition is a macOS visual-regression job that runs the same
frontend config and verifies:

- dashboard widget baselines
- list-page visual baselines
- dossier drawer visual baselines

without `--update-snapshots`.

## Validation Architecture

Phase 46 should use three execution waves:

| Wave | Plans               | Purpose                                                                  |
| ---- | ------------------- | ------------------------------------------------------------------------ |
| 1    | 46-01, 46-02, 46-03 | Generate and verify dashboard widget, list-page, and drawer baselines    |
| 2    | 46-04               | Human-eyeball approval, CI workflow gate, and debt-closure documentation |

The validation contract is:

1. Generate snapshots only with `--update-snapshots`.
2. Immediately rerun the same spec without `--update-snapshots`.
3. Count exact baseline files: 8 dashboard + 14 list-page + 2 drawer = 24.
4. Record every baseline path and human review result in `46-VALIDATION.md`.
5. Run the no-update visual command in CI or an equivalent local `CI=true`
   replay before marking VIS-01..04 complete.

## Recommended Plan Split

1. `46-01-dashboard-widget-baselines-PLAN.md`: add the widget-level visual spec,
   stable widget locators, dedicated dashboard screenshot path template, then
   regenerate and verify eight widget baselines.
2. `46-02-list-page-baselines-PLAN.md`: regenerate and verify the existing
   14 list-page baselines.
3. `46-03-drawer-baselines-PLAN.md`: regenerate and verify the existing two
   dossier-drawer baselines.
4. `46-04-human-review-ci-closure-PLAN.md`: fill the human review log, add the
   focused CI visual job, run no-update replay, and mark Phase 46 visual debt
   closed in planning docs.

## Threats And Pitfalls

- False-positive CI: avoid any plan that only runs `--list`; actual no-update
  visual comparisons must execute.
- Snapshot churn: do not regenerate unrelated visual specs such as Phase 42
  page visuals or Phase 43 focus-outline baselines.
- Platform suffix mismatch: list/drawer default snapshots are platform-specific;
  the CI visual job should run on macOS unless the executor intentionally moves
  those specs to a cross-platform path template.
- Stale auth helper: prefer `loginForListPages` for the new dashboard widget
  spec because it uses the current `#email` and `#password` selectors.
- Missing RecentDossiers state: seed `dossier-store` with
  `seedRecentDossierStore()` before dashboard widget screenshots so the
  RecentDossiers baseline is non-empty.
- Scope creep: do not modify product layout or visual tokens in this phase
  unless a visual spec cannot stabilize without a minimal test-only hook.
