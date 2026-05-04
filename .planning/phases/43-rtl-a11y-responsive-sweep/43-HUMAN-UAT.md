---
status: failed
phase: 43-rtl-a11y-responsive-sweep
source: [43-VERIFICATION.md]
started: 2026-05-04T00:00:00Z
updated: 2026-05-04T13:38:00Z
---

## Current Test

[UAT executed — 1 pass, 1 fail, 1 deferred]

## Tests

### 1. Run live qa-sweep against env with VITE*SUPABASE*\* configured

expected: All 4 sweeps (axe, responsive, keyboard, focus-outline) green. Run `pnpm -C frontend test:qa-sweep` on CI or staging with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set. Verifies QA-02 + QA-03 runtime gates.
result: **failed** — 72 failed, 26 passed. Three real issue classes surfaced. Detail in Gaps.

### 2. Manual EN↔AR locale toggle on each v6.0 route — directional icon flip

expected: Switch language Arabic ↔ English on Dashboard, Kanban, Calendar, all 7 list pages, Dossier drawer, Briefs, After-actions, Tasks, Activity, Settings. Confirm `arrow-right`, `arrow-up-right`, `chevron-right`, `chevron-left`, `.icon-flip` glyphs flip via `scaleX(-1)`. Sparkline polylines also flip.
result: **deferred** — qa-sweep failures take priority. Per-route browser audit blocked until Gap-1, Gap-2, Gap-3 resolved.

### 3. Screen-reader audit on icon-only buttons

expected: Run VoiceOver / NVDA on the v6.0 surface. Verify icon-only HeroUI Buttons announce their `aria-label` translation correctly: sidebar PanelLeft toggle, modal close button, brand mark (`shell.brand.mark`), DrawerCtaRow / VipVisits / OverdueCommitments toggle controls. No raw key strings, no doubled announcements.
result: **passed (static)** — all aria-label keys resolve to real EN+AR translations:

| Control                   | Key                            | EN                      | AR           |
| ------------------------- | ------------------------------ | ----------------------- | ------------ |
| Sidebar PanelLeft toggle  | `common.actions.openMenu`      | Open menu               | فتح القائمة  |
| Modal close               | `common.actions.closeDialog`   | Close dialog            | إغلاق الحوار |
| Brand mark                | `shell.brand.mark`             | IntelDossier brand mark | شعار دوسييه  |
| DrawerCtaRow              | `common.actions.viewMore`      | View more               | عرض المزيد   |
| VipVisits                 | `common.actions.viewMore`      | View more               | عرض المزيد   |
| OverdueCommitments toggle | `common.actions.toggleSection` | Toggle section          | تبديل القسم  |

Live SR audit (VoiceOver/NVDA) still required by human; static gate passes.

## Summary

total: 3
passed: 1
issues: 1
pending: 0
deferred: 1
skipped: 0
blocked: 0

## Gaps

### Gap-1: Touch-target ≥44px gate broader than 43-08 plan scope (responsive sweep — 30 fails)

source: 43-HUMAN-UAT.md Test 1
status: failed
severity: high
detail: 43-08 surgically wrapped specific HeroUI Buttons (Topbar dir-btn, Calendar nav, MyTasks Checkbox, AdvSearchFilters Checkbox, EngagementStage chevron) but did NOT cover `<a class="btn">` / `<a class="btn btn-primary">` quick-action anchors on Dashboard widgets. Example failure on dashboard@320px:

```
[dashboard][en][320] touch targets <44px: [
  {"tag":"a","w":129,"h":38,"html":"<a href=\"/intake\" class=\"btn\">..."},
  {"tag":"a","w":159,"h":38,"html":"<a href=\"/engagements\" class=\"btn btn-primary\">..."}
]
```

Replicates across all 15 routes × 2 locales = 30 failures.
fix: Audit `.btn` class definition or wrap call sites with `.touch-44` (or raise `.btn` min-height to 44px). Recommend latter: edit `frontend/src/index.css` `.btn` rule to enforce `min-height: 2.75rem` (44px).

### Gap-2: aria-required-children on `<button role="row">` dossier list rows (axe sweep — 4 fails)

source: 43-HUMAN-UAT.md Test 1
status: failed
severity: critical
detail: Dossier list rows on `/countries` + `/organizations` use `<button type="button" role="row" class="dossier-row">` without required ARIA grid children (cell, columnheader, gridcell, rowheader). Pre-existing pattern from earlier list-pages phase (40 or 42), surfaced now because 43-09's labeling work brought the page out of axe blockers but exposed this layer.

```
"id": "aria-required-children",
"impact": "critical",
"html": "<button type=\"button\" role=\"row\" class=\"dossier-row w-full m...\">"
```

fix: Either remove `role="row"` (revert to plain button + visually grouped row layout) OR wrap rows in proper `role="grid"` + add `role="gridcell"` to inner segments. Drop role="row" likely simplest — list rendering doesn't need ARIA grid semantics if the container isn't `role="grid"` / `role="rowgroup"`.

### Gap-3: Tab-walk membership mismatch on every route (keyboard sweep — 30 fails)

source: 43-HUMAN-UAT.md Test 1
status: failed
severity: high
detail: Spec scopes `MAIN_INTERACTIVE_SELECTOR` to `main button/a/input/[role=button]/[tabindex]:visible`. On every route, `visibleCount=0` but `reached.size=1`. Suggests Playwright `:visible` filter scoped under `main` returns zero matches at the moment of the count even though page snapshot shows interactives present. Possible causes:

- 43-11 added `tabIndex={0}` to `<main>` — Tab from `main.focus()` jumps to next focusable, may exit main on first press
- `waitForRouteReady` settles before route paint completes
- selector composition issue with Playwright's `:visible` chained after `main`
  fix: Investigate selector + waitForRouteReady ordering. Likely 1 small spec edit; not a 43-11 production code rollback.

### Gap-4: Focus-outline visual baselines stale (focus-outline sweep — 8 fails)

source: 43-HUMAN-UAT.md Test 1
status: failed
severity: medium
detail: All 8 baselines (Settings × 4 directions × 2 modes) fail snapshot diff. 43-08's `.touch-44` wrapping shifted layout; baselines were captured before 43-08/09/10/11 landed.
fix: Regenerate baselines once Gap-1, Gap-2, Gap-3 are resolved: `pnpm -C frontend exec playwright test qa-sweep-focus-outline.spec.ts --update-snapshots`. Re-commit `frontend/tests/e2e/qa-sweep-focus-outline.spec.ts-snapshots/`.
