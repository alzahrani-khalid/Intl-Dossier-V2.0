---
phase: 58-tier-c-design-token-suppression-full-clear
plan: 05
type: execute
wave: 5
depends_on:
  - 58-04
files_modified:
  - frontend/src/components/analytics/SummaryCard.tsx
  - frontend/src/components/dashboard-widgets/EventsWidget.tsx
  - frontend/src/components/dashboard-widgets/KpiWidget.tsx
  - frontend/src/components/dashboard-widgets/NotificationsWidget.tsx
  - frontend/src/components/dashboard-widgets/QuickActionsWidget.tsx
  - frontend/src/components/dashboard-widgets/TaskListWidget.tsx
  - frontend/src/components/realtime-status/RealtimeStatus.tsx
  - frontend/src/components/scenario-sandbox/OutcomeList.tsx
  - frontend/src/components/scenario-sandbox/ScenarioCard.tsx
  - frontend/src/components/sla-countdown/SLACountdown.tsx
  - frontend/src/components/sla-monitoring/SLAAtRiskList.tsx
  - frontend/src/components/sla-monitoring/SLAComplianceTable.tsx
  - frontend/src/components/sla-monitoring/SLAEscalationsList.tsx
  - frontend/src/components/sla-monitoring/SLAPolicyForm.tsx
autonomous: true
requirements:
  - TOKEN-01
must_haves:
  truths:
    - 'Every Wave-5 file (per 58-WAVE-MANIFEST.md `wave == 5` — chart-adjacent residue NOT in Tier-B carve-out) contains zero `Phase 51 Tier-C:` annotations after swap'
    - 'Tier-B carve-out at eslint.config.mjs:247-270 is UNTOUCHED — chart graphics (Sparkline, Donut, etc.) and signature-visuals remain raw-literal-allowed'
    - 'frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx is NOT modified (test asserts pass-through behavior; Sparkline source is carved out)'
    - 'Wave-5 visual baselines (dashboard, dashboard-widgets) regenerate cleanly and LTR PNG ≠ RTL PNG byte-for-byte per D-12'
    - 'pnpm lint exits 0; pnpm type-check exits 0; pnpm test:unit green'
  artifacts:
    - path: 'frontend/src/components/sla-monitoring/SLAOverviewCards.tsx'
      provides: 'Wave-5 precedent (already-clean per PATTERNS §Wave 5) — KPI/card pattern reference'
    - path: 'frontend/src/components/dashboard-widgets/KpiWidget.tsx'
      provides: 'KPI widget with semantic-token tints (D-08 alpha)'
  key_links:
    - from: 'Wave-5 dashboard-widgets / sla-* files'
      to: 'frontend/src/index.css @theme block'
      via: 'Status/SLA-state tints on semantic tokens'
      pattern: '(text|bg|border)-(danger|warning|success|info|accent|muted|muted-foreground|line)'
    - from: 'Wave-5 file set'
      to: 'eslint.config.mjs:247-270 Tier-B carve-out'
      via: 'NO INTERSECTION — Wave-5 files are explicitly NOT in carve-out; carve-out files (signature-visuals/Sparkline.tsx, etc.) stay out of Phase 58 scope'
      pattern: 'components/(signature-visuals|relationships)/'
---

<objective>
Swap every `Phase 51 Tier-C:` palette-literal suppression in the Wave 5 (charts-residue) surface to semantic-token utilities per CONTEXT D-05..D-10. Wave 5 is the SMALLEST wave (~14 files) and consists of chart-adjacent leaves that are NOT in the Tier-B carve-out: dashboard widgets, SLA monitoring chrome, scenario-sandbox cards, realtime-status indicators.

The critical Wave-5 boundary is the Tier-B carve-out at `eslint.config.mjs:247-270`. Files in the carve-out (notably `components/signature-visuals/Sparkline.tsx`, `components/signature-visuals/Donut.tsx`, and the chart-graphics files) are OUT OF SCOPE per CONTEXT D-13 and v6.4 OOS clause — they retain raw palette literals legitimately. Wave 5 swaps ONLY the chart-ADJACENT leaves (widgets that surround charts, KPI cards that display chart data, list components that drive scenario charts).

`components/signature-visuals/__tests__/Sparkline.test.tsx` lines 111-115 pass a `className="text-emerald-500"` literal as a test fixture and assert pass-through — this is testing INPUT pass-through, not output styling. Manifest `override_notes` documents: "Sparkline source carved out; test asserts pass-through; NO source swap, NO test update."

Output: PR `phase-58/wave-5-charts-residue: chart-adjacent residue token swap (N files / M nodes / K annotations cleared)` on branch `phase-58/wave-5-charts-residue`, ~14 atomic commits.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-CONTEXT.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-PATTERNS.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-VALIDATION.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-04-SUMMARY.md
@eslint.config.mjs
@frontend/src/index.css
@frontend/src/lib/semantic-colors.ts
@frontend/src/components/sla-monitoring/SLAOverviewCards.tsx

<interfaces>
<!-- Wave-5 precedent shape — Tier-A SLAOverviewCards.tsx (sibling of Wave-5 files in same directory) -->
<!-- All swap-target utilities exist; no new tokens; KPI/card pattern is the dominant shape -->

Tier-B carve-out paths (eslint.config.mjs:247-270) — DO NOT MODIFY:

- components/relationships/RelationshipGraph.tsx (graph viz)
- components/dossier/MiniRelationshipGraph.tsx (graph viz)
- components/signature-visuals/Sparkline.tsx (chart graphic)
- components/signature-visuals/Donut.tsx (chart graphic)
- components/signature-visuals/\* (most signature-visuals files; verify per-file)
- (Full list is in eslint.config.mjs — read the carve-out before editing if uncertain)

Wave-5 files are chart-ADJACENT, NOT chart graphics:

- dashboard-widgets/KpiWidget.tsx — KPI card displaying chart values
- dashboard-widgets/EventsWidget.tsx — list of events surrounding a chart
- sla-monitoring/SLAComplianceTable.tsx — table of SLA states
- analytics/SummaryCard.tsx — summary card wrapping a metric
- scenario-sandbox/ScenarioCard.tsx — card displaying scenario outcome
  </interfaces>
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Read Wave-5 manifest rows + Tier-B carve-out boundary; branch off main</name>
  <files>(no source edits)</files>
  <read_first>
    - `58-WAVE-MANIFEST.md` rows where `wave == 5` (authoritative file list ~14 files; `override_notes` flags Sparkline.test.tsx as "NO source swap, NO test update")
    - `58-04-SUMMARY.md` for Wave-4 lessons learned
    - `eslint.config.mjs` lines 247-270 — Tier-B carve-out (READ IN FULL to internalize which paths are EXCLUDED from Phase 58 scope)
    - `frontend/src/components/sla-monitoring/SLAOverviewCards.tsx` (Tier-A precedent — sibling shape for Wave-5 KPI cards)
    - `58-PATTERNS.md` §"Wave 5: charts-residue" (lines 474-540 — precedent code shapes)
  </read_first>
  <action>
Extract every row where `wave == 5` from 58-WAVE-MANIFEST.md (expected ~14 files matching `files_modified`).

Read `eslint.config.mjs` lines 247-270 IN FULL. Note the exact path patterns in the Tier-B carve-out. Verify NONE of the Wave-5 files in `files_modified` match these patterns. Specifically confirm:

- `components/signature-visuals/Sparkline.tsx` NOT in Wave-5 files_modified (it's in carve-out)
- `components/signature-visuals/Donut.tsx` NOT in Wave-5 files_modified (carve-out)
- `components/signature-visuals/__tests__/Sparkline.test.tsx` NOT in Wave-5 files_modified (carved-out source; test stays as-is)

Read `SLAOverviewCards.tsx` for the canonical Wave-5 KPI/card shape. If the file uses `getStatusBadgeClass` or inline `text-success`/`text-warning`/`text-danger` for SLA state badges, Wave-5 files should follow the same shape.

Create branch: `git checkout -b phase-58/wave-5-charts-residue main` (Wave 4 has merged). Confirm Wave 4 complete: `! grep -rn 'Phase 51 Tier-C' frontend/src/components/dossier`. Do NOT edit source files.
</action>
<verify>
<automated>git rev-parse --abbrev-ref HEAD | grep -qx 'phase-58/wave-5-charts-residue' && [ "$(awk -F'|' '$4 ~ /^[[:space:]]*5[[:space:]]*$/ {print}' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | wc -l)" -ge 10 ] && grep -q 'signature-visuals' eslint.config.mjs && ! grep -rn 'Phase 51 Tier-C' frontend/src/components/dossier</automated>
</verify>
<acceptance_criteria> - On branch `phase-58/wave-5-charts-residue` - Wave-5 file list (~14 files) extracted; carve-out paths confirmed NOT in list - Tier-B carve-out at `eslint.config.mjs:247-270` read; `signature-visuals/*`, `relationships/RelationshipGraph.tsx`, `dossier/MiniRelationshipGraph.tsx` path patterns internalized - `SLAOverviewCards.tsx` Wave-5 precedent shape read - Wave 4 confirmed merged - No source files modified
</acceptance_criteria>
<done>Executor oriented; Tier-B boundary internalized; branch ready.</done>
</task>

<task type="auto">
  <name>Task 2: Atomic per-file swaps — Wave 5 charts-residue (1 commit per file)</name>
  <files>
    frontend/src/components/analytics/SummaryCard.tsx,
    frontend/src/components/dashboard-widgets/EventsWidget.tsx,
    frontend/src/components/dashboard-widgets/KpiWidget.tsx,
    frontend/src/components/dashboard-widgets/NotificationsWidget.tsx,
    frontend/src/components/dashboard-widgets/QuickActionsWidget.tsx,
    frontend/src/components/dashboard-widgets/TaskListWidget.tsx,
    frontend/src/components/realtime-status/RealtimeStatus.tsx,
    frontend/src/components/scenario-sandbox/OutcomeList.tsx,
    frontend/src/components/scenario-sandbox/ScenarioCard.tsx,
    frontend/src/components/sla-countdown/SLACountdown.tsx,
    frontend/src/components/sla-monitoring/SLAAtRiskList.tsx,
    frontend/src/components/sla-monitoring/SLAComplianceTable.tsx,
    frontend/src/components/sla-monitoring/SLAEscalationsList.tsx,
    frontend/src/components/sla-monitoring/SLAPolicyForm.tsx
  </files>
  <read_first>For each file: file itself + its manifest row. `SLAOverviewCards.tsx` precedent in working memory from Task 1.</read_first>
  <action>
Execute one atomic commit per file (~14 commits). Internal ordering: SLA family first (5 files — coherent semantic family; SLA states map cleanly to danger/warning/success/info), then dashboard-widgets (5 files), then scenario-sandbox (2 files), realtime-status, analytics.

For each file, apply canonical swap pattern per CONTEXT D-05..D-10. Wave-5-specific emphasis:

1. **Verify the file is NOT in Tier-B carve-out**. Before editing, run `grep -n "$(basename $file)" eslint.config.mjs` — if non-zero matches in lines 247-270, STOP and verify scope. Should return zero or only matches in non-carve-out sections.

2. **SLA state mappings** (D-05 strict):
   - SLA breaching / overdue → `text-danger` / `bg-danger/N` / `border-danger/N`
   - SLA at-risk / warning → `text-warning` / `bg-warning/N` / `border-warning/N`
   - SLA on-track / met → `text-success` / `bg-success/N` / `border-success/N`
   - SLA upcoming / info → `text-info` / `bg-info/N` / `border-info/N`
   - Reuse `getStatusBadgeClass` from `@/lib/semantic-colors` if SLA-state maps to `WorkStatus` values

3. **Dashboard widget tints**: KPI/Events/Task widgets often have positive (green) / negative (red) / neutral (gray) trend indicators. D-05 mapping. Manifest `blue_purple_collision` flagged 3 dashboard-widget files (`EventsWidget.tsx`, `NotificationsWidget.tsx`, `TaskListWidget.tsx`) per RESEARCH §"Blue+Purple Collision Files" — apply D-07.

4. D-08/D-09/D-10 dark-variant rules as usual.

5. `multi_literal_line == yes` — swap both literals.

6. Delete every Tier-C annotation; `pnpm lint frontend/src/<file>` exit 0.

7. Commit message: `style(58-W5/<basename>): swap Tier-C palette literals to <semantic-family> tokens (N nodes, M annotations cleared)`.

8. **Sparkline.test.tsx special case** (per manifest `override_notes`): the file `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` is NOT in Wave-5 files_modified. Do NOT modify it. The test passes `className="text-emerald-500"` as a fixture INPUT and asserts the rendered SVG contains the literal — this tests pass-through, not styling. Source `Sparkline.tsx` is in Tier-B carve-out and stays raw-literal. No action needed.

9. No other test-grep hits in Wave 5 per RESEARCH §"Test-Grep Hits".
   </action>
   <verify>
   <automated>WAVE5="frontend/src/components/analytics/SummaryCard.tsx frontend/src/components/dashboard-widgets/EventsWidget.tsx frontend/src/components/dashboard-widgets/KpiWidget.tsx frontend/src/components/dashboard-widgets/NotificationsWidget.tsx frontend/src/components/dashboard-widgets/QuickActionsWidget.tsx frontend/src/components/dashboard-widgets/TaskListWidget.tsx frontend/src/components/realtime-status/RealtimeStatus.tsx frontend/src/components/scenario-sandbox/OutcomeList.tsx frontend/src/components/scenario-sandbox/ScenarioCard.tsx frontend/src/components/sla-countdown/SLACountdown.tsx frontend/src/components/sla-monitoring/SLAAtRiskList.tsx frontend/src/components/sla-monitoring/SLAComplianceTable.tsx frontend/src/components/sla-monitoring/SLAEscalationsList.tsx frontend/src/components/sla-monitoring/SLAPolicyForm.tsx"; for f in $WAVE5; do if grep -nq 'Phase 51 Tier-C' "$f"; then echo "FAIL: $f"; exit 1; fi; done && pnpm lint $WAVE5 && [ "$(git diff main..HEAD --name-only | grep -E '(Sparkline|signature-visuals|relationships/RelationshipGraph|MiniRelationshipGraph)' | wc -l)" -eq 0 ] && [ "$(git diff main..HEAD --name-only eslint.config.mjs | wc -l)" -eq 0 ]</automated>
   </verify>
   <acceptance_criteria> - Every Wave-5 file has zero `Phase 51 Tier-C` markers - SLA-state literals use semantic-token utilities consistent with `getStatusBadgeClass` shape - Blue+purple collision dashboard-widget files use `bg-secondary` / `text-secondary-foreground` for purple - D-08/D-09/D-10 ladder applied - `pnpm lint` on Wave-5 file set exits 0 - ~14 atomic per-file commits - `git diff main..HEAD --name-only` shows NO files from carve-out paths (`signature-visuals/*`, `relationships/RelationshipGraph`, `MiniRelationshipGraph`) - `eslint.config.mjs` UNTOUCHED (verify via `git diff main..HEAD eslint.config.mjs` shows empty) - `Sparkline.test.tsx` UNTOUCHED - No `--no-verify`; no `--force` push
   </acceptance_criteria>
   <done>All Wave-5 chart-adjacent files swapped; Tier-B carve-out preserved; per-file lint clean; ready for wave-gate.</done>
   </task>

<task type="auto">
  <name>Task 3: Wave-5 gate — full lint/type-check/unit + visual baseline regen (dashboard, dashboard-widgets)</name>
  <files>
    frontend/tests/e2e/dashboard-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/dashboard-widgets-visual.spec.ts-snapshots/**
  </files>
  <read_first>
    - `58-VALIDATION.md` §"Per-Task Verification Map" rows 58-{1..6}-ZZ-01..03
    - `58-RESEARCH.md` §"D-12 LTR≠RTL Byte-Distinction Check"
    - `58-WAVE-MANIFEST.md` Wave-5 rows' `regen_targets` (expected: `dashboard-visual`, `dashboard-widgets-visual`)
  </read_first>
  <action>
Run the Wave-5 full gate per CONTEXT D-11:

1. `pnpm lint` exit 0 workspace-wide
2. `pnpm type-check` exit 0
3. `pnpm test:unit` green (specifically including `Sparkline.test.tsx` — must still pass since neither source nor test was modified)
4. Wave-5-scoped grep: `! grep -rn 'Phase 51 Tier-C' frontend/src/components/{analytics,dashboard-widgets,realtime-status,scenario-sandbox,sla-countdown,sla-monitoring}` returns no matches
5. **Tier-B carve-out integrity check**: `git diff main..HEAD eslint.config.mjs` returns empty (no edits to carve-out)

Visual baseline regen per D-12. Wave-5 specs: `dashboard-visual`, `dashboard-widgets-visual`:

6. `pnpm --filter frontend playwright test frontend/tests/e2e/dashboard-visual.spec.ts frontend/tests/e2e/dashboard-widgets-visual.spec.ts --update-snapshots`
7. LTR≠RTL byte-distinction check:
   ```
   for snap_dir in frontend/tests/e2e/dashboard-visual.spec.ts-snapshots/ frontend/tests/e2e/dashboard-widgets-visual.spec.ts-snapshots/; do
     for variant in 1280 768; do
       ltr=$(ls "$snap_dir"*ltr*"$variant"*chromium*.png 2>/dev/null | head -1)
       rtl=$(ls "$snap_dir"*rtl*"$variant"*chromium*.png 2>/dev/null | head -1)
       if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then echo "FAIL byte-identical"; exit 1; fi
     done
   done
   ```
8. Commit regenerated snapshots: `chore(58-W5): regen visual baselines (dashboard, dashboard-widgets) + LTR≠RTL byte-distinction reasserted`.
   </action>
   <verify>
   <automated>pnpm lint && pnpm type-check && pnpm --filter frontend test:unit && for sdir in frontend/tests/e2e/dashboard-visual.spec.ts-snapshots/ frontend/tests/e2e/dashboard-widgets-visual.spec.ts-snapshots/; do for variant in 1280 768; do ltr=$(ls "$sdir"_ltr_"$variant"*chromium*.png 2>/dev/null | head -1); rtl=$(ls "$sdir"*rtl*"$variant"_chromium_.png 2>/dev/null | head -1); if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then echo "FAIL LTR=RTL in $sdir"; exit 1; fi; done; done && ! grep -rn 'Phase 51 Tier-C' frontend/src/components/analytics frontend/src/components/dashboard-widgets frontend/src/components/realtime-status frontend/src/components/scenario-sandbox frontend/src/components/sla-countdown frontend/src/components/sla-monitoring && [ -z "$(git diff main..HEAD eslint.config.mjs)" ]</automated>
   </verify>
   <acceptance_criteria> - `pnpm lint` / `pnpm type-check` / `pnpm test:unit` exit 0 - Wave-5 file set has zero `Phase 51 Tier-C` markers - 2 visual baselines regenerated and committed in same PR - LTR≠RTL byte-distinction preserved - `eslint.config.mjs` Tier-B carve-out UNTOUCHED - `Sparkline.test.tsx` still passes (unmodified)
   </acceptance_criteria>
   <done>Wave-5 D-11 full gate passes; ready for PR.</done>
   </task>

<task type="auto">
  <name>Task 4: Open Wave-5 PR and merge after CI green</name>
  <files>(PR creation)</files>
  <read_first>`58-CONTEXT.md` §"Specifics" line 188 (PR title convention); Phase 55 D-13 (8 required CI contexts)</read_first>
  <action>
Push: `git push -u origin phase-58/wave-5-charts-residue`. Open PR via `gh pr create`:
- Title: `phase-58/wave-5-charts-residue: chart-adjacent residue token swap (<N> files / <M> nodes / <K> annotations cleared)`
- Base: `main`
- Body: per-file commit log, Tier-B carve-out attestation (signature-visuals/*, relationships/*, eslint.config.mjs:247-270 all untouched; Sparkline.test.tsx unmodified), SLA state-mapping summary, 2-spec visual regen output

Wait for 8 CI contexts. Merge via `gh pr merge --merge`. Update 58-VALIDATION.md Wave-5 rows ⬜ → ✅.
</action>
<verify>
<automated>gh pr list --state merged --head phase-58/wave-5-charts-residue --json number,title,mergedAt | grep -q 'wave-5-charts-residue'</automated>
</verify>
<acceptance_criteria> - PR opened with correct title; 8 CI contexts pass; merged with `--merge`; 58-VALIDATION.md updated
</acceptance_criteria>
<done>Wave-5 merged; Wave 6 may branch off latest main (the final wave).</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                            | Description                                                          |
| ----------------------------------- | -------------------------------------------------------------------- |
| dev machine → chart-adjacent leaves | Carve-out boundary is non-trivial; Tier-B paths must not be modified |
| dev machine → main branch           | PR-only; 8 CI contexts                                               |

## STRIDE Threat Register

| Threat ID  | Category  | Component                                          | Disposition | Mitigation Plan                                                                                                                     |
| ---------- | --------- | -------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| T-58-05-01 | Tampering | Tier-B carve-out at eslint.config.mjs:247-270      | mitigate    | Acceptance criteria assert `git diff main..HEAD eslint.config.mjs` is empty; reviewer inspection                                    |
| T-58-05-02 | Tampering | Sparkline.test.tsx (pass-through test)             | mitigate    | Acceptance criteria assert no diff for `signature-visuals/__tests__/Sparkline.test.tsx`; manifest override_notes documents the rule |
| T-58-05-03 | Tampering | Chart-graphics source files (signature-visuals/\*) | mitigate    | Acceptance criteria assert no diff for carve-out paths; lint would catch new violations otherwise                                   |
| T-58-05-04 | Tampering | Visual baselines (dashboard, dashboard-widgets)    | mitigate    | LTR≠RTL byte-distinction check                                                                                                      |

</threat_model>

<verification>
- TOKEN-01: zero `Phase 51 Tier-C` markers in Wave-5 file set
- D-04: ~14 atomic per-file commits
- D-12: 2 visual baselines regenerated; LTR≠RTL preserved
- D-13: Tier-B carve-out untouched (`eslint.config.mjs` diff empty)
- Sparkline.test.tsx unmodified
- No NET-NEW dark variants
</verification>

<success_criteria>
Wave 5 complete when: PR merged with ~14 atomic per-file commits; chart-adjacent surface (`analytics`, `dashboard-widgets`, `realtime-status`, `scenario-sandbox`, `sla-*`) has zero `Phase 51 Tier-C`; `pnpm lint && pnpm type-check && pnpm test:unit` exit 0; dashboard + dashboard-widgets baselines regenerated with LTR≠RTL preserved; Tier-B carve-out byte-identical to main.
</success_criteria>

<output>
Create `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-05-SUMMARY.md` after merge. SUMMARY captures: files swapped, SLA-state mappings applied, D-07 collision count (3 dashboard-widget files expected), Tier-B carve-out attestation evidence, visual regen evidence, links to PR + merge commit, Wave 5 → Wave 6 handoff (Wave 6 is the catch-all + closure wave).
</output>
