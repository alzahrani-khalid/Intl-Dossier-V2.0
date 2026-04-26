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
result: [pending]

### 10. E2E suite green on CI

expected: `pnpm playwright test list-pages-render list-pages-rtl list-pages-engagements list-pages-a11y list-pages-touch-targets list-pages-visual` — all 65+ tests pass on a running dev server with `.env.test` credentials
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0
blocked: 0

## Gaps

(none yet — items will be recorded here when the user runs through the visual review)

## Notes

- Run `pnpm dev` first to spin up the frontend
- Use `$TEST_USER_EMAIL` / `$TEST_USER_PASSWORD` from `.env.test` for authenticated routes
- Reference handoff PNGs: see `.planning/phases/40-list-pages/40-CONTEXT.md` for the source-of-truth list
- After all 10 items pass, update VERIFICATION.md `status: PASS-WITH-DEVIATION` → `status: PASS` and re-commit
