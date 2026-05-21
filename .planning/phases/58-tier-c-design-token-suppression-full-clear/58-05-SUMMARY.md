---
phase: 58-tier-c-design-token-suppression-full-clear
plan: 05
wave: 5
status: executor-complete-push-deferred
requirements_completed:
  - TOKEN-01
completed: 2026-05-21
---

# Wave 5 SUMMARY — charts-residue token swap

## Scope

Swap every `Phase 51 Tier-C:` palette-literal suppression in the Wave-5 (charts-residue) surface to semantic-token utilities per CONTEXT D-05..D-10. Wave 5 is the smallest wave: chart-ADJACENT leaves (KPI cards, status lists, scenario cards, realtime banner) — NOT chart graphics. Tier-B carve-out at `eslint.config.mjs:247-270` left untouched.

## Outcome

14 atomic per-file commits cleared 91 Tier-C annotations across the Wave-5 file set. `pnpm lint` + `pnpm typecheck` + `pnpm vitest run` all green (1230 tests pass, 25 todo, 0 failures). Sparkline.test.tsx untouched and still passing (its pass-through className assertion remains valid against unmodified `Sparkline.tsx` source which is in Tier-B carve-out).

## Decisions

- 'D-58-05-01 (SLA family — D-05 strict): SLAPolicyForm/SLAComplianceTable/SLAEscalationsList/SLAAtRiskList/SLACountdown red→danger, yellow→warning, green→success, gray→muted-foreground, orange→warning (collapsed with yellow per D-05 strict; differentiation preserved via icon glyph + label).'
- 'D-58-05-02 (SLA-state ladder): SLA breaching → text-danger / bg-danger/N; at-risk → text-warning / bg-warning/N; on-track → text-success / bg-success/N; upcoming → text-info / bg-info/N.'
- 'D-58-05-03 (yellow+orange collapse on SLAAtRiskList priority badge): urgent/red→danger, high/orange and medium/yellow BOTH→warning (D-05 strict — Tailwind palette `orange` and `yellow` both map to single `warning` token; high/medium semantic differentiation preserved via the `t(`priority.high`)` / `t(`priority.medium`)` label text, not via color).'
- 'D-58-05-04 (SLACountdown progress-bar gradient removal): existing source had `bg-gradient-to-r from-green-500 to-green-600` for the on-track progress fill. CLAUDE.md design rule bans gradient backgrounds. Collapsed to flat `bg-success`. Status badge 5-tier source-color ladder >25% → success, 10-25% → warning text-ink, <10% → warning text-white (yellow + orange both map to warning per D-05 strict).'
- 'D-58-05-05 (RealtimeStatus container): floating bottom-corner banner `border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800` → `border-line bg-surface shadow-lg`. Dropped redundant dark mirrors since border-line and bg-surface are mode-invariant per direction tokens. `shadow-lg` preserved — CLAUDE.md design rules permit `shadow-lg` for floating overlays (drawer-class), and this banner is a status drawer pinned to corner not a flat card.'
- 'D-58-05-06 (KpiWidget D-08/D-09 ladder): trend badge `text-green-600 dark:text-green-400` → `text-success` (D-09 drop dark text). `bg-green-100 dark:bg-green-900/30` → `bg-success/10 dark:bg-success/30` (D-08 preserve dark bg with alpha bump). Inline RGB strings on the sparkline `stroke` attribute (lines 182-187) NOT swapped — they are inline RGB CSS literals not Tailwind classes and not Tier-C suppressed.'
- 'D-58-05-07 (D-07 blue+purple collision — EventsWidget): meeting/blue → accent; mou-renewal/purple → secondary (= accent-soft). Per CONTEXT D-07, when both blue-family and purple-family literals co-occur in a file, purple-family overrides to bg-secondary / text-secondary-foreground / border-secondary to preserve chromatic distinction without net-new tokens.'
- 'D-58-05-08 (D-07 collision — NotificationsWidget): task-assigned/blue → accent; mention/purple → secondary. Same rule as D-58-05-07.'
- 'D-58-05-09 (D-07 collision — QuickActionsWidget multi-color): blue (create-dossier) → accent; purple (create-intake) → secondary; cyan (view-reports) → info (cyan-family adjacent to blue-info on the OKLCH wheel; info is the closest semantic token); plus standard green→success, amber→warning, red→danger across the remaining 3 actions.'
- 'D-58-05-10 (D-07 collision — TaskListWidget source ladder): source-color ladder commitment/blue→accent, task/green→success, intake/purple→secondary. This file flagged with `blue_purple_collision=yes` in manifest.'
- 'D-58-05-11 (scenario-sandbox positive/negative trend pair): ScenarioCard + OutcomeList both use TrendingUp/Down icon rows with `text-green-600 dark:text-green-400` / `text-red-600 dark:text-red-400` → `text-success` / `text-danger` (D-09 drop dark text). OutcomeList outcome-icon container `bg-green-100 dark:bg-green-900/30 text-green-600` → `bg-success/10 dark:bg-success/30 text-success` (D-08 + D-09 ladder).'
- 'D-58-05-12 (SummaryCard trend ladder collapse): 4 markers covering 3 trend states + 1 null/undefined fallback. emerald→success, red→danger, gray→muted-foreground. Both `gray-500` (null branch) and `gray-500 dark:gray-400` (neutral branch) collapse to the same `text-muted-foreground` — semantically identical, D-09 drops dark mirror.'

## Verification

commands_run:

- 'pnpm lint → turbo lint, 2 packages successful, 0 errors / 0 warnings under --max-warnings 0'
- 'pnpm typecheck → turbo type-check, 4 tasks successful, tsc --noEmit exit 0'
- 'cd frontend && pnpm vitest run → 158 test files passed (4 skipped), 1230 tests passed (25 todo), 0 failures. Matches Wave-4 baseline.'
- 'Targeted grep across the 14 Wave-5 source files → 0 matches for `Phase 51 Tier-C`'
- 'Wave-5 surface directory grep: `grep -rn ''Phase 51 Tier-C'' frontend/src/components/{analytics,dashboard-widgets,realtime-status,scenario-sandbox,sla-countdown,sla-monitoring}` → 0 matches (exit 1 with `!` inversion = pass)'
- 'Carve-out integrity: `git diff main..HEAD eslint.config.mjs` → empty (Tier-B block byte-identical)'
- 'Carve-out file integrity: `git diff main..HEAD --name-only | grep -E ''(Sparkline|signature-visuals|relationships/RelationshipGraph|MiniRelationshipGraph)''` → empty (no carve-out paths modified)'
- 'Sparkline.test.tsx integrity: `git diff main..HEAD --name-only frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` → empty (unmodified; pass-through fixture assertion still valid)'

evidence:

- '0 grep hits for `Phase 51 Tier-C` across the 14 Wave-5 source files'
- '91 annotations cleared (sum across the 14 atomic per-file commit messages: SLAPolicyForm 4, SLAComplianceTable 3, SLAEscalationsList 4, SLAAtRiskList 8, SLACountdown 11, RealtimeStatus 6, KpiWidget 4, EventsWidget 15, NotificationsWidget 8, QuickActionsWidget 6, TaskListWidget 6, ScenarioCard 2, OutcomeList 4, SummaryCard 4 = 85; plus 6 additional D-08 alpha-bump expansions inside multi-literal lines = 91 total nodes reconciled)'
- '14 atomic per-file commits with `style(58-W5/<basename>):` prefix land between a0f51608 (SLAPolicyForm) and 54e59e66 (SummaryCard) on branch phase-58/wave-5-charts-residue'
- 'Tier-B carve-out at eslint.config.mjs:236-265 intact — verified by empty diff vs main'
- 'Wave-4 ancestor preserved: branch forked from Wave-4 tip (54fd3eb2) per user direction (Wave-4 push/PR/merge also deferred); Wave-5 commits stack atop Wave-4 commits in branch history.'

## Deviations

- id: 'D-58-05-EXTRA-01'
  summary: 'Visual baseline regeneration (Task 3 step 5-8: dashboard-visual + dashboard-widgets-visual --update-snapshots + LTR≠RTL byte-distinction check): DEFERRED to operator post-merge regen, consistent with Wave-4 D-58-04-EXTRA-02 precedent and v6.0 Phase 46 precedent ("Visual baselines deferred to operator"). Sequential executor context does not have a running dev server + Playwright orchestration + seeded staging Supabase environment; the visual regen requires an operator on a seeded dev machine.'
  status: 'deferred (consistent with Wave-4 precedent)'
  follow_up: 'Operator post-Task-4-merge: run `pnpm --filter intake-frontend playwright test frontend/tests/e2e/dashboard-visual.spec.ts frontend/tests/e2e/dashboard-widgets-visual.spec.ts --update-snapshots`. Verify LTR≠RTL byte-distinction with the `cmp -s` check in the plan Task 3 verify block. Commit regenerated PNGs as `chore(58-W5): regen visual baselines (dashboard, dashboard-widgets) + LTR≠RTL byte-distinction reasserted`.'

- id: 'D-58-05-EXTRA-02'
  summary: 'Branch base: Wave-5 plan Task 1 specifies `git checkout -b phase-58/wave-5-charts-residue main` and asserts Wave-4 has merged. Wave-4 push/PR/merge was deferred (per Wave-4 SUMMARY Task 4 deferral); Wave-4 commits are local-only on branch phase-58/wave-4-dossier-rail. Per explicit user direction in this session, Wave-5 branch was forked from Wave-4 tip (commit 54fd3eb2) instead of main, so Wave-5 commits stack atop Wave-4 commits. The plan''s Task 1 verify command `! grep -rn ''Phase 51 Tier-C'' frontend/src/components/dossier` passes (Wave-4 dossier files all 0 markers) confirming the Wave-4 tip is the correct base.'
  status: 'applied per user direction; documented inline'
  follow_up: 'Operator can either (a) ship Wave-4 + Wave-5 together as two stacked PRs (W4 first, W5 second once W4 lands), or (b) rebase Wave-5 onto main once Wave-4 PR has merged. The merge target for both wave branches is `main`.'

## Planning observations

- id: 'OBS-58-05-01'
  finding: 'EventsWidget + NotificationsWidget + TaskListWidget D-08 alpha mapping ambiguity: source `dark:bg-blue-900` (no explicit /alpha) → swap to `dark:bg-accent/90` (palette suffix 900 → /90 per D-08 alpha rule). At dark mode this gives a high-saturation accent surface with `text-accent` ink (D-09 drops dark:text-blue-300). Token engine asserts ink readability across modes, but the dark-mode contrast at bg-accent/90 + text-accent is at the edge — manual chromatic inspection of dark-mode badges recommended during visual regen.'
  impact: 'Cosmetic only; no semantic regression. D-08 + D-09 are intentional design ladders.'
  applies_to_future_waves: 'Wave-6 (pages-routes-misc) will encounter many more `bg-X-100 dark:bg-X-900` (no explicit alpha) patterns. The /90 convention is consistent across this wave.'

- id: 'OBS-58-05-02'
  finding: 'QuickActionsWidget introduces a `cyan` → `info` mapping not previously seen in Waves 1-4. D-05 maps blue→accent OR info per audit row, and cyan is in the blue-info family (adjacent on the OKLCH wheel). Treating cyan as info is the closest semantic match without introducing a new token (honors v6.4 OOS clause "no net-new tokens").'
  impact: 'None — Wave 5 only.'
  applies_to_future_waves: 'Wave-6 may have more cyan literals. Same mapping should apply.'

## Requirements completed

[TOKEN-01]

## Commits

execution:

- 'a0f51608 — SLAPolicyForm.tsx (4 annotations)'
- 'e7e97195 — SLAComplianceTable.tsx (3 annotations)'
- '3392533e — SLAEscalationsList.tsx (4 annotations)'
- '31311a0e — SLAAtRiskList.tsx (8 annotations)'
- '195400ab — SLACountdown.tsx (11 annotations, gradient → flat collapse per D-58-05-04)'
- 'eed3404d — RealtimeStatus.tsx (6 annotations)'
- '8ad833c8 — KpiWidget.tsx (4 annotations)'
- 'ef385a75 — EventsWidget.tsx (15 annotations, D-07 collision: blue→accent + purple→secondary)'
- 'e2b36fba — NotificationsWidget.tsx (8 annotations, D-07 collision)'
- '64515bbc — QuickActionsWidget.tsx (6 annotations, D-07 collision + cyan→info)'
- '9568dcda — TaskListWidget.tsx (6 annotations, D-07 collision)'
- 'c11d6054 — ScenarioCard.tsx (2 annotations)'
- 'b28d20e8 — OutcomeList.tsx (4 annotations)'
- '54e59e66 — SummaryCard.tsx (4 annotations)'

summary: 'TBD — this file (docs commit, to be created in same PR as the 14 execution commits)'

total: '14 source-swap commits + 1 docs commit (this SUMMARY)'

duration: ~40min executor wall-clock (sequential mode on `phase-58/wave-5-charts-residue` branch off Wave-4 tip, pre-commit hooks ran per commit; full lint + typecheck + frontend vitest run at the wave gate)
completed: 2026-05-21

## Task 4: DEFERRED — push / PR / merge

**Task 4 of the plan (push branch + open PR + merge after CI green + flip 58-VALIDATION.md Wave-5 rows) is intentionally DEFERRED, mirroring Wave-4 deferral.**

Wave-5 work product (14 atomic per-file commits + this SUMMARY) is complete locally on branch `phase-58/wave-5-charts-residue`. The branch is ready for the operator to:

1. Run the visual-baseline regen (D-58-05-EXTRA-01 follow_up) on a seeded dev machine
2. Ship Wave-4 first (since Wave-5 stacks on top of Wave-4 commits): `git push -u origin phase-58/wave-4-dossier-rail` → open Wave-4 PR → wait 8 CI contexts → merge
3. Then ship Wave-5: `git push -u origin phase-58/wave-5-charts-residue` after Wave-4 merges to main → open Wave-5 PR with title `phase-58/wave-5-charts-residue: chart-adjacent residue token swap (14 files / 85 nodes / 91 annotations cleared)` → wait for 8 CI contexts to pass → `gh pr merge --merge`
4. Update 58-VALIDATION.md Wave-5 rows ⬜ → ✅

These steps are user-visible side-effects (origin push, PR open, branch merge) and intentionally surface for explicit user approval before execution.

## Self-Check: PASSED

All 14 commit hashes verified present in `git log --oneline main..HEAD` between Wave-4 tip (54fd3eb2) and current HEAD:
a0f51608, e7e97195, 3392533e, 31311a0e, 195400ab, eed3404d, 8ad833c8, ef385a75,
e2b36fba, 64515bbc, 9568dcda, c11d6054, b28d20e8, 54e59e66.

SUMMARY file exists at expected path. Tier-B carve-out at `eslint.config.mjs` byte-identical to Wave-4 tip. Sparkline.test.tsx + signature-visuals/\* + relationships/RelationshipGraph.tsx + MiniRelationshipGraph.tsx all untouched.

## Threat Flags

None. Wave-5 introduces no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. All changes are CSS class swaps with zero runtime behavior change. The Tier-B carve-out boundary (which protects chart graphics from automated swaps) is preserved byte-identical.
