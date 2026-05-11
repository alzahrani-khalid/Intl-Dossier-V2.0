---
phase: 44-documentation-toolchain-anti-patterns
plan: 05
type: execute
wave: 2
depends_on: ['44-04']
files_modified:
  - frontend/tests/e2e/phase-44-antipatterns.spec.ts
autonomous: true
requirements: [LINT-02, LINT-04, LINT-05]
tags: [frontend, playwright, axe, a11y]
must_haves:
  truths:
    - 'D-12: browser verification covers dashboard, drawer, and tasks routes in EN and AR'
    - 'D-13: this plan does not update visual baselines'
    - 'Phase 44 label-in-name verification uses axe rule label-content-name-mismatch'
  artifacts:
    - path: frontend/tests/e2e/phase-44-antipatterns.spec.ts
      provides: EN/AR browser proof for the audit-listed label-in-name closure
---

<objective>
Add phase-scoped browser verification proving the WR-03/WR-05 label-in-name
closures on dashboard, drawer, and tasks routes in English and Arabic.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Create phase-44 axe rule-specific Playwright spec</name>
  <files>frontend/tests/e2e/phase-44-antipatterns.spec.ts</files>
  <read_first>
    - frontend/tests/e2e/qa-sweep-axe.spec.ts
    - frontend/tests/e2e/helpers/qa-sweep.ts
    - frontend/tests/e2e/support/list-pages-auth.ts
    - frontend/tests/e2e/support/dossier-drawer-fixture.ts
    - frontend/tests/e2e/dossier-drawer-axe.spec.ts
    - frontend/tests/e2e/helpers/v6-routes.ts
  </read_first>
  <action>
Create `frontend/tests/e2e/phase-44-antipatterns.spec.ts`.

The spec must import:

```ts
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { loginForListPages } from './support/list-pages-auth'
import { settlePage, waitForRouteReady } from './helpers/qa-sweep'
import { openDrawerForFixtureDossier, FIXTURE_DOSSIER_ID } from './support/dossier-drawer-fixture'
```

Add a helper:

```ts
async function expectNoLabelInNameViolations(page: Page, include: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(include)
    .withRules(['label-content-name-mismatch'])
    .analyze()
  expect(results.violations).toEqual([])
}
```

Generate six tests:

- dashboard EN at `/dashboard`, include `main`
- dashboard AR at `/dashboard`, include `main`
- drawer EN opened with `openDrawerForFixtureDossier`, include `.drawer`
- drawer AR opened with `openDrawerForFixtureDossier`, include `.drawer`
- tasks EN at `/tasks`, include `main`
- tasks AR at `/tasks`, include `main`

For each route, call `loginForListPages(page, locale)`, navigate/open, call
`settlePage(page)` and `waitForRouteReady(page)` where applicable, then run the
rule-specific helper.

Do not update snapshots, screenshots, visual baselines, or broad route registry.
</action>
<verify>
<automated>pnpm -C frontend exec playwright test phase-44-antipatterns.spec.ts --list</automated>
</verify>
<acceptance_criteria> - Spec file imports `AxeBuilder` - Spec file uses `label-content-name-mismatch` - `playwright test phase-44-antipatterns.spec.ts --list` shows 6 tests - Spec references `/dashboard`, `/tasks`, and `openDrawerForFixtureDossier`
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Run phase-scoped browser verification when env is available</name>
  <files>frontend/tests/e2e/phase-44-antipatterns.spec.ts</files>
  <read_first>
    - frontend/tests/e2e/support/list-pages-auth.ts
    - frontend/tests/e2e/support/dossier-drawer-fixture.ts
  </read_first>
  <action>
Run:

```bash
pnpm -C frontend exec playwright test phase-44-antipatterns.spec.ts --project=chromium
```

If required auth, Supabase, or seeded drawer fixture environment is unavailable,
do not weaken the spec. Record the blocker in the summary and at minimum keep
the `--list` proof that all 6 tests are registered. If the environment is
available, all 6 tests must pass.
</action>
<verify>
<automated>pnpm -C frontend exec playwright test phase-44-antipatterns.spec.ts --list</automated>
</verify>
<acceptance_criteria> - `--list` enumerates 6 tests - If browser env is available, the chromium run exits 0 - If browser env is unavailable, the summary names the missing env/seed and leaves the spec unchanged
</acceptance_criteria>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Mitigation |
|-----------|----------|-----------|------------|
| T-44-09 | Information disclosure | Browser fixture auth | Reuse existing `loginForListPages`; do not add credentials or env values |
| T-44-10 | Repudiation | A11y proof | Use exact axe rule `label-content-name-mismatch` and six named tests |
| T-44-11 | Tampering | Visual baselines | Do not run `--update-snapshots` or commit screenshots |
</threat_model>

<verification>
1. `pnpm -C frontend exec playwright test phase-44-antipatterns.spec.ts --list`
2. `pnpm -C frontend exec playwright test phase-44-antipatterns.spec.ts --project=chromium` when env is available.
</verification>

<success_criteria>

- Six EN/AR route-scoped label-in-name tests exist.
- No visual baselines are changed.
- Browser proof passes or the environment blocker is explicitly recorded.
  </success_criteria>
