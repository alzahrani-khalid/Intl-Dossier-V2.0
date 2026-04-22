---
phase: 36-shell-chrome
plan: 01
type: execute
status: PASS-WITH-DEVIATION
wave: 0
requirements: [SHELL-05]
completed_at: '2026-04-22T13:00:00+03:00'
commits:
  - eeeb198d · feat(36-01): inline GastatLogo component with real handoff paths (SHELL-05)
  - 65a4a926 · test(36-01): 5 vitest + 2 playwright RED scaffolds for shell (SHELL-05)
  - f980b869 · feat(36-01): shell.* i18n namespace (EN+AR) + concurrent drawer focus test (SHELL-05)
---

# 36-01 SUMMARY — Wave 0 scaffold (PASS-WITH-DEVIATION)

## Objective

Scaffold every surface Wave 1/2/3 will depend on:

- Inline `GastatLogo` component rendering the real handoff SVG paths tinted via `currentColor`.
- Seven RED test scaffolds (5 Vitest component, 1 Vitest a11y, 2 Playwright) referencing components that don't exist yet — so Wave 1/2 turns them green.
- `shell.*` i18n namespace in EN + AR so Wave 1 components can resolve strings.
- `ConcurrentDrawers.test.tsx` exercising Pitfall 3 (two concurrent HeroUI Drawers, focus isolation via React Aria `FocusScope contain`).

## Deliverables

| Artifact                         | Path                                                        | Status                          |
| -------------------------------- | ----------------------------------------------------------- | ------------------------------- |
| GastatLogo component             | `frontend/src/components/brand/GastatLogo.tsx`              | ✅ shipped                      |
| GastatLogo unit test             | `frontend/src/components/brand/GastatLogo.test.tsx`         | ✅ shipped                      |
| AppShell component test (RED)    | `frontend/src/components/layout/AppShell.test.tsx`          | ✅ RED scaffold                 |
| Sidebar component test (RED)     | `frontend/src/components/layout/Sidebar.test.tsx`           | ✅ RED scaffold                 |
| Topbar component test (RED)      | `frontend/src/components/layout/Topbar.test.tsx`            | ✅ RED scaffold                 |
| ClassificationBar test (RED)     | `frontend/src/components/layout/ClassificationBar.test.tsx` | ✅ RED scaffold                 |
| AppShell a11y test (RED)         | `frontend/src/components/layout/AppShell.a11y.test.tsx`     | ✅ RED scaffold                 |
| ConcurrentDrawers Pitfall-3 test | `frontend/src/components/layout/ConcurrentDrawers.test.tsx` | ✅ 2/3 pass, 1 doc-fail         |
| E2E shell spec (it.skip)         | `frontend/tests/e2e/phase-36-shell.spec.ts`                 | ✅ RED scaffold                 |
| E2E smoke spec (it.skip)         | `frontend/tests/e2e/phase-36-shell-smoke.spec.ts`           | ✅ RED scaffold                 |
| i18n shell.\* namespace (EN)     | `frontend/src/i18n/en/common.json`                          | ✅ 21 leaf keys                 |
| i18n shell.\* namespace (AR)     | `frontend/src/i18n/ar/common.json`                          | ✅ 21 leaf keys, parity with EN |

## Acceptance criteria — verification

| Criterion                                                                 | Result                                                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Inline `GastatLogo` renders real handoff paths tinted via `currentColor`  | ✅ 38 paths, viewBox `0 0 162.98 233.12`, `currentColor` fill, no undefined classes (Pitfall 1 avoided) |
| Two concurrent HeroUI Drawers keep focus trapped via `FocusScope contain` | ✅ mount test passes, Tab-cycle test passes, role=dialog assertion RED (documented below)               |
| 6 Vitest + axe test files exist as RED scaffolds                          | ✅ 5 layout component tests + AppShell.a11y test + GastatLogo test = 7 Vitest files on disk             |
| i18n `shell.*` has 20+ EN + 20+ AR keys                                   | ✅ 21 leaf keys per locale, EN/AR parity verified                                                       |
| 2 Playwright spec files exist with `describe`/`it.skip` blocks            | ✅ phase-36-shell.spec.ts + phase-36-shell-smoke.spec.ts exist                                          |

## Deviations (documented)

### D-01 · i18n path: `locales/{en,ar}.json` → `{en,ar}/common.json`

**Plan said:** Add `shell.*` namespace to `frontend/src/i18n/locales/en.json` and `locales/ar.json`.

**Actual repo structure:** There is no `frontend/src/i18n/locales/` directory. The i18n layout is per-namespace files (`frontend/src/i18n/en/<namespace>.json`, `ar/<namespace>.json`) registered in `frontend/src/i18n/index.ts` under the `resources` map. Shared chrome keys — including the existing `navigation.*` and `tweaks.*` — live as top-level keys inside `en/common.json` and `ar/common.json`.

**Decision:** Added `shell` as a top-level key inside `en/common.json` and `ar/common.json`, matching the existing `navigation`/`tweaks` pattern. No change to `i18n/index.ts` was needed (common.json is already registered as both `translation` and `common` resources).

**Impact:** Wave 1 components should consume via `useTranslation()` with the default namespace (or `common`) and read `t('shell.appName')` etc. No behavior change versus what the plan intended.

### D-02 · `ConcurrentDrawers.test.tsx` role=dialog assertion is RED

**Symptom:** The third assertion (`document.querySelectorAll('[role="dialog"]').length >= 2`) returns 0 even when both Drawers are mounted with `defaultOpen: true`. The first two assertions (mount-without-throw, Tab stays in last-opened drawer) pass.

**Likely cause:** HeroUI v3 Drawer's portal/role wiring is non-trivial in jsdom — role attributes may land on a different subtree, or the drawer is using `aria-modal` + a different role name.

**Decision:** Keep the assertion as a RED scaffold. The plan explicitly allowed "pass OR documented-fail with findings noted in summary." Wave 1 (36-02) lands the real Sidebar drawer — once the Sidebar uses HeroUI Drawer alongside TweaksDrawer, verify in jsdom and either fix this assertion or replace it with a more specific FocusScope selector (e.g., `[data-focus-scope]` or `data-react-aria-focus-scope`).

### D-03 · Key count: 21 leaf keys, plan referenced 20

**Plan said:** 20 EN + 20 AR keys.

**UI-SPEC Copywriting Contract table:** 21 rows (the extra is `shell.error.mount`, which was listed in a separate "Empty States / Errors" sub-table in UI-SPEC).

**Decision:** Shipped all 21 leaf keys to match UI-SPEC verbatim. EN/AR parity verified programmatically.

## Tests run (local)

- `pnpm -C frontend vitest run src/components/brand/GastatLogo.test.tsx` → passes
- `pnpm -C frontend vitest run src/components/layout/ConcurrentDrawers.test.tsx` → 2 pass / 1 RED (documented)
- Remaining `layout/*.test.tsx` files intentionally RED — they import components that Wave 1 (Sidebar, Topbar, ClassificationBar, AppShell) will create.

## Handoff to Wave 1

**36-02 (Sidebar)** can now:

- `import { GastatLogo } from '@/components/brand/GastatLogo'`
- `t('shell.appName')`, `t('shell.workspace')`, `t('shell.footer.sync')`, `t('shell.user.noRole')` resolve in both locales
- `t('navigation.operations' | 'navigation.dossiers' | 'navigation.administration')` already in common.json
- `Sidebar.test.tsx` has 3 failing `it` blocks waiting for the real component (`renders three sections`, `active accent bar`, `admin gate`)

**36-03 (Topbar)** can now:

- `t('shell.search.placeholder')`, `t('shell.search.kbd')`, `t('shell.direction.*')`, `t('shell.theme.toggle')`, `t('shell.notifications.open')`, `t('shell.tweaks')`, `t('shell.menu.open' | 'menu.close')`
- `t('shell.classification.workspace' | 'handleSecurely' | 'session')` for ClassificationBar
- `Topbar.test.tsx` + `ClassificationBar.test.tsx` have 7 failing `it` blocks waiting for the real components

**36-04 (AppShell)** can now:

- `AppShell.test.tsx` has 4 failing `it` blocks (`responsive drawer mode`, `drawer open close`, `drawer rtl flip`, `phone layout`)
- `AppShell.a11y.test.tsx` has axe-core harness ready

**36-05 (Integration)** can now:

- `phase-36-shell.spec.ts` has 3 `it.skip` blocks that will be un-skipped (`shell no remount`, `direction atomic`, `shell tab order`)
- `phase-36-shell-smoke.spec.ts` has 8 `describe('shell chrome smoke …')` blocks for the 4-direction × 2-locale screenshot matrix

## Status: PASS-WITH-DEVIATION

All Wave 0 artifacts exist and commit cleanly. Three documented deviations (i18n path, one RED scaffold assertion, key count) are captured above for Wave 1 to consume. Wave 1 is unblocked.
