---
status: partial
phase: 43-rtl-a11y-responsive-sweep
source: [43-VERIFICATION.md]
started: 2026-05-04T00:00:00Z
updated: 2026-05-04T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Run live qa-sweep against env with VITE*SUPABASE*\* configured

expected: All 4 sweeps (axe, responsive, keyboard, focus-outline) green. Run `pnpm -C frontend test:qa-sweep` on CI or staging with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set. Verifies QA-02 + QA-03 runtime gates that worktrees could not exercise.
result: [pending]

### 2. Manual EN↔AR locale toggle on each v6.0 route — directional icon flip

expected: Switch language Arabic ↔ English on Dashboard, Kanban, Calendar, all 7 list pages, Dossier drawer, Briefs, After-actions, Tasks, Activity, Settings. Confirm `arrow-right`, `arrow-up-right`, `chevron-right`, `chevron-left`, `.icon-flip` glyphs flip via `scaleX(-1)`. Sparkline polylines also flip. Confirms QA-04 visual outcome.
result: [pending]

### 3. Screen-reader audit on icon-only buttons

expected: Run VoiceOver / NVDA on the v6.0 surface. Verify icon-only HeroUI Buttons announce their `aria-label` translation correctly: sidebar PanelLeft toggle, modal close button, brand mark (`shell.brand.mark`), DrawerCtaRow / VipVisits / OverdueCommitments toggle controls. No raw key strings, no doubled announcements. Confirms QA-02 a11y outcome end-to-end.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
