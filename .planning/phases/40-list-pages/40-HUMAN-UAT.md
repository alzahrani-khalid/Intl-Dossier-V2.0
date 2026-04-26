---
status: partial
phase: 40-list-pages
source: [40-11-PLAN.md, VERIFICATION.md]
started: 2026-04-26
updated: 2026-04-26
---

## Current Test

[awaiting human visual review of 7 list pages + 14 baseline approval]

## Tests

### 1. Countries list page — visual parity (LTR)

expected: matches handoff reference PNG; DossierGlyph + EN names + engagement count + last-touch + sensitivity chip + RTL chevron all visually identical
result: [pending]

### 2. Countries list page — RTL sanity check

expected: html[dir=rtl] applied; AR names render; chevron flips via `rotate-180` or `scaleX(-1)`; layout mirror-correct
result: [pending]

### 3. Organizations list page — visual parity (LTR + AR)

expected: matches handoff reference PNG; same row anatomy as Countries
result: [pending]

### 4. Persons list page — visual parity (LTR + AR)

expected: 1/2/3-col responsive grid; 44px circular avatar (`bg-accent-soft text-accent-ink`); VIP chip when `importance_level >= 4`; role · organization meta — visually consistent with dashboard.png card aesthetic (D-04)
result: [pending]

### 5. Forums list page — visual parity (LTR + AR)

expected: matches dashboard.png row aesthetic (D-05); status chip `active→chip-ok`, `cancelled→chip-danger`
result: [pending]

### 6. Topics list page — visual parity (LTR + AR)

expected: matches handoff reference PNG; status chip `active→chip-ok`, `archived→chip-info`, `draft→chip-warn`
result: [pending]

### 7. Working groups list page — visual parity (LTR + AR)

expected: matches handoff reference PNG; status chip per plan 40-08 mapping (active→ok, completed→info, on_hold→warn)
result: [pending]

### 8. Engagements list page — visual parity (LTR + AR)

expected: search + 4 filter pills + week-list grouping (ISO 8601) + GlobeSpinner load-more; matches handoff PNG
result: [pending]

### 9. Visual baselines captured + approved

expected: `pnpm playwright test list-pages-visual --update-snapshots` captures 14 PNGs (7 pages × LTR + AR @ 1280×800); maxDiffPixelRatio 2%; commit `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/` directory
result: PARTIAL — 14/14 captured 2026-04-26; 5/14 stable across replay, 9/14 drift; `.gitignore:146` `*.png` rule keeps them gitignored (consistent with Phase 38/39); approval blocked on stabilization (animation suppression + stable timestamps + seeded data)

### 10. E2E suite green on CI

expected: `pnpm playwright test list-pages-render list-pages-rtl list-pages-engagements list-pages-a11y list-pages-touch-targets list-pages-visual` — all 65+ tests pass on a running dev server with `.env.test` credentials
result: PARTIAL — 2026-04-26 live run: dev server boots, auth works (Doppler-injected `.env.test`); ~30 specs fail with itemized findings below; spec auth wiring (`tests/e2e/support/list-pages-auth.ts` + 6 `test.beforeEach` patches) merged

## Summary

total: 10
passed: 0
issues: 7
pending: 3
skipped: 0
blocked: 0
partial: 2

## Gaps

E2E findings from 2026-04-26 live run (Doppler-injected, dev server, chromium-darwin):

### Critical / blocks visual gate

- **G1 — `list-pages-render` overflow at <1280px (12 specs).** Mobile (320×720) and tablet (768×1024) viewports show `document.documentElement.scrollWidth > clientWidth` on `countries`, `organizations`, `persons`, `forums`, `topics`, `engagements`. Likely root cause: a `min-w-0` is missing on a flex/grid child inside `ListPageShell` or `DossierTable` so a long row blows out the container. Fix candidate: audit `frontend/src/components/list-page/ListPageShell.tsx` and `DossierTable.tsx` for a wrapper that should have `min-w-0` or `overflow-x-hidden`.

- **G2 — axe-core a11y violations on all 7 pages × LTR + AR (14 specs).** Spec passes axe through `AxeBuilder().analyze()`; result not yet itemized — needs re-run with `--reporter=html` to surface each violation rule. Suspects: missing `<main>`/`<nav>` landmarks, `lang` attribute not toggled to `ar` on AR runs, chip color-contrast under restricted/confidential variants.

- **G3 — RTL chevron `scaleX(-1)` not present on `/dossiers/countries`.** Spec asserts `transform: matrix(-1, 0, 0, ...)` but primitives use Tailwind `rotate-180` which produces `transform: rotate(180deg)`. Either fix the spec assertion to accept `rotate(180deg)` (cheap), or change the primitive to use `scaleX(-1)` (matches handoff CSS convention).

### Functional / engagements page

- **G4 — Engagement filter pills `aria-pressed` toggle fails (2 specs).** Spec clicks "Confirmed" pill expecting `aria-pressed="true"`. Page uses pill labels `meeting/call/travel/event` (engagement-type taxonomy) not `Confirmed/Pending/Travel` (engagement-status taxonomy). Either align the spec to the implemented taxonomy, or split the engagement filter into status + type axes.

- **G5 — Engagement row click navigation fails (1 spec).** Spec asserts `expect(page).toHaveURL(/\/engagements\/[a-z0-9-]+\/overview/)`. Page wires `onEngagementClick` to `useNavigate()` but the click target may not bubble to the row button, or the route shape differs.

### Data / empty-state

- **G6 — `working_groups` page is empty.** Visual baseline file size 17–20 KB vs. 140 KB for other pages. The route resolves but `useWorkingGroups` returns no data — the staging Supabase project at zkrcjzdemdmwhearhfgg has no `working_group` dossiers seeded. Either seed test data, or accept the empty-state baseline as canonical.

### Visual baseline stability

- **G7 — Visual baseline drift (9/14 specs replay-fail).** Baselines captured but not deterministic across re-runs. Suspects: animations (`animate-pulse` on skeletons not fully suppressed by `animations: 'disabled'` in playwright config), date-formatted `last_touch` strings (`Apr 1, 2026` style — drifts at midnight), async list-load timing (Supabase request varies). Fix candidates: (a) freeze `Date.now()` via `page.clock.install` per Playwright 1.45+; (b) wait for a deterministic ready-marker (e.g. `[data-loading="false"]`) before screenshot; (c) suppress `transition-*` Tailwind utilities in the test environment.

### Spec authoring

- **G8 — Specs assume idealized props/taxonomies.** Several spec assertions encode the original locked plan interface, not the shipped implementation (per per-plan SUMMARY Rule-3 deviations). Reconciliation pass needed: walk each Phase 40 SUMMARY's "Deviations" section and update specs to match actual exports (e.g. `EngagementListItem` field names, `GenericListPageItem.statusChipClass` values, working_groups underscored route dir).

### Recommended close-out

- Run `/gsd-plan-phase 40 --gaps DesignV2` — generates a gap-closure plan for G1–G8 above
- Or open these as 8 individual GitHub issues if you prefer parallel work over a single phase

## Notes

- ✓ Run `pnpm dev` first to spin up the frontend — already validated
- ✓ Use `$TEST_USER_EMAIL` / `$TEST_USER_PASSWORD` from `.env.test` (Doppler-sourced) for authenticated routes — already wired
- Reference handoff PNGs: see `.planning/phases/40-list-pages/40-CONTEXT.md` for the source-of-truth list
- After G1–G8 resolve and 10/10 UAT items pass, update VERIFICATION.md `status: PASS-WITH-DEVIATION` → `status: PASS` and re-commit
