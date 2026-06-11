---
phase: 58-tier-c-design-token-suppression-full-clear
plan: 02
type: execute
wave: 2
depends_on:
  - 58-01
files_modified:
  - frontend/src/components/assignments/EscalationDashboard.tsx
  - frontend/src/components/audit-logs/AuditLogFilters.tsx
  - frontend/src/components/audit-logs/AuditLogStatistics.tsx
  - frontend/src/components/audit-logs/AuditLogTable.tsx
  - frontend/src/components/bulk-actions/BulkActionProgressIndicator.tsx
  - frontend/src/components/bulk-actions/BulkActionsToolbar.tsx
  - frontend/src/components/bulk-actions/SelectableDataTable.tsx
  - frontend/src/components/bulk-actions/UndoToast.tsx
  - frontend/src/components/elected-officials/ElectedOfficialListTable.tsx
  - frontend/src/components/entity-comparison/EntityComparisonSelector.tsx
  - frontend/src/components/entity-comparison/EntityComparisonTable.tsx
  - frontend/src/components/risk-list/RiskList.tsx
  - frontend/src/components/triage-panel/TriagePanel.tsx
  - frontend/src/components/version-history-viewer/VersionHistoryViewer.tsx
  - frontend/src/components/working-groups/WGMemberSuggestions.tsx
autonomous: true
requirements:
  - TOKEN-01
must_haves:
  truths:
    - 'Every Wave-2 file (per 58-WAVE-MANIFEST.md `wave == 2`) contains zero `Phase 51 Tier-C:` annotations after swap'
    - 'Status/priority/row-state literals use semantic-token utilities (D-05) or canonical helpers from semantic-colors.ts'
    - 'Wave-2 visual baselines (list-pages, tailwind-remap if present) regenerate cleanly and LTR PNG ≠ RTL PNG byte-for-byte per D-12'
    - 'pnpm lint exits 0 workspace-wide; pnpm type-check exits 0; pnpm test:unit green'
    - 'bulk-action *Dialog.tsx files are deferred to Wave 3 (filename pattern wins per RESEARCH §Critical surfacing) — NOT touched in Wave 2'
  artifacts:
    - path: 'frontend/src/components/triage-panel/TriagePanel.tsx'
      provides: 'Highest-density Wave-2 file (53 disables) — fully swapped to semantic tokens'
    - path: 'frontend/src/components/bulk-actions/SelectableDataTable.tsx'
      provides: 'Table-row + checkbox state chrome on semantic tokens'
  key_links:
    - from: 'Wave-2 source files'
      to: 'frontend/src/lib/semantic-colors.ts'
      via: 'Reuse `getStatusBadgeClass`/`getPriorityBadgeClass`/`getDossierTypeBadgeClass` for row badges'
      pattern: 'getStatusBadgeClass|getPriorityBadgeClass|getDossierTypeBadgeClass'
---

<objective>
Swap every `Phase 51 Tier-C:` palette-literal suppression in the Wave 2 (tables) surface to semantic-token utilities per CONTEXT D-05..D-10. Tables are the second-lowest-risk surface — table-row state colors are highly mechanical (red/amber/green → danger/warning/success) and well-covered by `semantic-colors.ts` helpers.

Note: `BulkActionConfirmDialog.tsx`, `BulkActionPreviewDialog.tsx`, `ExecutionHistoryDialog.tsx` are intentionally EXCLUDED — filename pattern routes them to Wave 3 per RESEARCH §"Critical surfacing".

Output: PR `phase-58/wave-2-tables: tables token swap (N files / M nodes / K annotations cleared)` on branch `phase-58/wave-2-tables`, ~15 atomic commits.
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
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-01-SUMMARY.md
@frontend/src/index.css
@frontend/src/lib/semantic-colors.ts
@frontend/src/components/availability-polling/AvailabilityPollResults.tsx
@frontend/src/components/collaboration/EditingLockIndicator.tsx

<interfaces>
<!-- Tier-A table precedent shapes (from 58-PATTERNS.md §Wave 2: tables): -->

Status-driven row color (D-09 — text-\* with NO dark variant):
AvailabilityPollResults.tsx:156-169 — `responseStats.canClose ? 'text-success' : 'text-warning'`

Badge variant — outline ring + colored text (D-09):
AvailabilityPollResults.tsx:222-229 — `<Badge variant="outline" className="text-success border-success">`

Rank-badge with conditional tint (D-08 alpha + D-09 text):
AvailabilityPollResults.tsx:206-214 — `isFirst ? 'bg-warning/10 text-warning dark:bg-warning/30' : 'bg-muted text-muted-foreground'`

Composite-chrome banner:
EditingLockIndicator.tsx:114-150 — `'bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning'`

Helper-reuse candidates per RESEARCH §"Don't Hand-Roll":

- AuditLogStatistics.tsx, RiskList.tsx, TriagePanel.tsx → `getStatusBadgeClass` / `getPriorityBadgeClass`
- ElectedOfficialListTable.tsx → `getDossierTypeBadgeClass`
  </interfaces>
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Read Wave-2 manifest rows + Tier-A table precedents; branch off main</name>
  <files>(no source edits)</files>
  <read_first>
    - `58-WAVE-MANIFEST.md` rows where `wave == 2` (authoritative file list + per-row override columns)
    - `58-01-SUMMARY.md` for Wave-1 lessons learned
    - `frontend/src/components/availability-polling/AvailabilityPollResults.tsx` (Tier-A table precedent)
    - `frontend/src/components/collaboration/EditingLockIndicator.tsx` (Tier-A banner/badge precedent)
    - `frontend/src/lib/semantic-colors.ts` (canonical helpers)
    - `58-PATTERNS.md` §"Wave 2: tables" lines 183-292 (precedent code shapes)
  </read_first>
  <action>
Extract every row where `wave == 2` from 58-WAVE-MANIFEST.md (expected ~15 files matching `files_modified`). Confirm bulk-actions/BulkActionConfirmDialog.tsx, bulk-actions/BulkActionPreviewDialog.tsx, scheduled-reports/ExecutionHistoryDialog.tsx are NOT in the Wave-2 list (they belong to Wave 3 per filename pattern).

Read Tier-A precedents and `semantic-colors.ts`. Identify Wave-2 files that map to known helpers:

- AuditLogStatistics.tsx → likely `getStatusBadgeClass` candidate
- RiskList.tsx → likely `getPriorityBadgeClass` candidate
- TriagePanel.tsx (53 disables — highest-density Wave-2 file) → read in full; mark which literals encode status/priority semantics vs one-off tints
- ElectedOfficialListTable.tsx → if dossier-type badges appear, use `getDossierTypeBadgeClass`

Create branch: `git checkout -b phase-58/wave-2-tables main`. Confirm Wave 1 is merged: `! grep -rn 'Phase 51 Tier-C' frontend/src/components/forms frontend/src/components/empty-states frontend/src/components/advanced-search`. Do NOT edit source files in this task.
</action>
<verify>
<automated>git rev-parse --abbrev-ref HEAD | grep -qx 'phase-58/wave-2-tables' && [ "$(awk -F'|' '$4 ~ /^[[:space:]]*2[[:space:]]*$/ {print}' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | wc -l)" -ge 12 ] && ! grep -rn 'Phase 51 Tier-C' frontend/src/components/forms frontend/src/components/empty-states</automated>
</verify>
<acceptance_criteria> - On branch `phase-58/wave-2-tables` - Wave-2 file list (~15 files) extracted; bulk-action Dialog files NOT included - Tier-A precedents (AvailabilityPollResults, EditingLockIndicator) and `semantic-colors.ts` read - Helper-reuse candidates identified for high-density files - Wave 1 confirmed merged (forms/empty-states/advanced-search clean) - No source files modified
</acceptance_criteria>
<done>Executor oriented; helper-reuse candidates marked; branch ready.</done>
</task>

<task type="auto">
  <name>Task 2: Atomic per-file swaps — Wave 2 tables surface (1 commit per file)</name>
  <files>
    frontend/src/components/assignments/EscalationDashboard.tsx,
    frontend/src/components/audit-logs/AuditLogFilters.tsx,
    frontend/src/components/audit-logs/AuditLogStatistics.tsx,
    frontend/src/components/audit-logs/AuditLogTable.tsx,
    frontend/src/components/bulk-actions/BulkActionProgressIndicator.tsx,
    frontend/src/components/bulk-actions/BulkActionsToolbar.tsx,
    frontend/src/components/bulk-actions/SelectableDataTable.tsx,
    frontend/src/components/bulk-actions/UndoToast.tsx,
    frontend/src/components/elected-officials/ElectedOfficialListTable.tsx,
    frontend/src/components/entity-comparison/EntityComparisonSelector.tsx,
    frontend/src/components/entity-comparison/EntityComparisonTable.tsx,
    frontend/src/components/risk-list/RiskList.tsx,
    frontend/src/components/triage-panel/TriagePanel.tsx,
    frontend/src/components/version-history-viewer/VersionHistoryViewer.tsx,
    frontend/src/components/working-groups/WGMemberSuggestions.tsx
  </files>
  <read_first>For each file: the file itself + its manifest row + `semantic-colors.ts` if the manifest indicates a known semantic family. Tier-A precedents already in working memory from Task 1.</read_first>
  <action>
Execute one atomic commit per file (~15 commits). Internal ordering: TriagePanel.tsx (53 disables) first to validate the helper-reuse pattern on the highest-density Wave-2 file, then bulk-actions/* (4 leaves; Dialog files deferred to W3), audit-logs/*, then remainder alphabetically by directory.

For each file, apply the canonical swap pattern per CONTEXT D-05..D-10 (identical algorithm to Wave 1):

1. Identify every `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:` annotation and the literal it suppresses.

2. Apply D-05 color-family mapping: red/rose → `text-danger`/`bg-danger/N`/`border-danger/N`; amber/yellow/orange → `text-warning`; green/emerald/lime → `text-success`; sky/cyan/teal → `text-info`; blue → `text-accent` (links/CTAs) or `text-info` (badges) per audit row's `proposed_token_map`; gray/slate/zinc/neutral/stone → `text-muted-foreground` / `bg-muted` / `border-line`; purple-family → `text-accent` (D-06) UNLESS manifest `blue_purple_collision == yes`, then purple → `bg-secondary` / `text-secondary-foreground` / `border-secondary` (D-07).

3. D-08 alpha ladder (bg/border preserve dark): source 100→/10, 200→/20, …, 900→/90; dark-variant alpha bumps one tier above source.

4. D-09 drop text-\* dark variant: `text-X-700 dark:text-X-300` → `text-{semantic}`; no `dark:text-{semantic}` introduced.

5. D-10: no NET-NEW dark variants where source had none.

6. Helper-reuse (MANDATORY where applicable per RESEARCH §"Don't Hand-Roll"):
   - AuditLogStatistics.tsx: replace inline status-color maps with `getStatusBadgeClass` import from `@/lib/semantic-colors`
   - RiskList.tsx: same with `getPriorityBadgeClass`
   - ElectedOfficialListTable.tsx: if dossier-type badges, use `getDossierTypeBadgeClass`
   - TriagePanel.tsx: identify status/priority semantics first, reuse helpers; remaining literals get D-05 inline swap
   - Do NOT extend `semantic-colors.ts` with new maps (out of scope per OOS clause)

7. Handle `multi_literal_line == yes` cases by swapping BOTH literals and deleting the single annotation line in the same edit.

8. Delete every Tier-C annotation; verify `! grep -n 'Phase 51 Tier-C' frontend/src/<file>` returns no matches.

9. `pnpm lint frontend/src/<file>` — must exit 0. `Unused eslint-disable directive` indicates a dangling annotation: fix and amend the commit (per-file atomic, D-04).

10. Commit message: `style(58-W2/<basename>): swap Tier-C palette literals to <semantic-family> tokens (N nodes, M annotations cleared)`.

11. Wave 2 has NO test-grep hits per RESEARCH §"Test-Grep Hits" — no `tests/unit/*` updates needed.
    </action>
    <verify>
    <automated>WAVE2_FILES="frontend/src/components/assignments/EscalationDashboard.tsx frontend/src/components/audit-logs/AuditLogFilters.tsx frontend/src/components/audit-logs/AuditLogStatistics.tsx frontend/src/components/audit-logs/AuditLogTable.tsx frontend/src/components/bulk-actions/BulkActionProgressIndicator.tsx frontend/src/components/bulk-actions/BulkActionsToolbar.tsx frontend/src/components/bulk-actions/SelectableDataTable.tsx frontend/src/components/bulk-actions/UndoToast.tsx frontend/src/components/elected-officials/ElectedOfficialListTable.tsx frontend/src/components/entity-comparison/EntityComparisonSelector.tsx frontend/src/components/entity-comparison/EntityComparisonTable.tsx frontend/src/components/risk-list/RiskList.tsx frontend/src/components/triage-panel/TriagePanel.tsx frontend/src/components/version-history-viewer/VersionHistoryViewer.tsx frontend/src/components/working-groups/WGMemberSuggestions.tsx"; for f in $WAVE2_FILES; do if grep -nq 'Phase 51 Tier-C' "$f"; then echo "FAIL: $f"; exit 1; fi; done && pnpm lint $WAVE2_FILES && grep -q 'Phase 51 Tier-C' frontend/src/components/bulk-actions/BulkActionConfirmDialog.tsx && grep -q 'Phase 51 Tier-C' frontend/src/components/bulk-actions/BulkActionPreviewDialog.tsx</automated>
    </verify>
    <acceptance_criteria> - Every Wave-2 file has zero `Phase 51 Tier-C` markers - No new `dark:text-{semantic}` introduced (D-09) - No NET-NEW dark variants (D-10) - `pnpm lint` on Wave-2 file set exits 0 - Each file is a separate atomic commit with `style(58-W2/<basename>):` prefix (D-04 bisectability) - Blue+purple collision files use `bg-secondary` / `text-secondary-foreground` / `border-secondary` for purple-family (D-07) - `multi_literal_line` cases: both literals swapped, single annotation deleted - `bulk-actions/BulkAction{Confirm,Preview}Dialog.tsx` STILL contain `Phase 51 Tier-C` markers (deferred to Wave 3 — must NOT be touched in Wave 2) - Helper-reuse applied where applicable (AuditLogStatistics, RiskList, ElectedOfficialListTable, TriagePanel) - No edits to `eslint.config.mjs`, `list-pages.css`, `bad-design-token.tsx` - No commit uses `--no-verify`; no `git push --force`
    </acceptance_criteria>
    <done>All Wave-2 source files swapped; per-file lint clean; ready for wave-gate.</done>
    </task>

<task type="auto">
  <name>Task 3: Wave-2 gate — full lint/type-check/unit + visual baseline regen with LTR≠RTL byte check</name>
  <files>
    frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/tailwind-remap-visual.spec.ts-snapshots/** (if spec exists)
  </files>
  <read_first>
    - `58-VALIDATION.md` §"Per-Task Verification Map" rows 58-{1..6}-ZZ-01..03 (wave-gate criteria)
    - `58-RESEARCH.md` §"D-12 LTR≠RTL Byte-Distinction Check" lines 440-456 (exact bash check)
    - `58-WAVE-MANIFEST.md` Wave-2 rows' `regen_targets` column (authoritative spec list)
  </read_first>
  <action>
Run the Wave-2 full gate per CONTEXT D-11:

1. `pnpm lint` exit 0 workspace-wide
2. `pnpm type-check` exit 0
3. `pnpm test:unit` green
4. Wave-2-scoped grep: `! grep -rn 'Phase 51 Tier-C' frontend/src/components/{assignments,audit-logs,elected-officials,entity-comparison,risk-list,triage-panel,version-history-viewer,working-groups}` returns no matches; for bulk-actions/ — only `BulkActionConfirmDialog.tsx` and `BulkActionPreviewDialog.tsx` may still contain the marker (deferred to W3); confirm `grep -rln 'Phase 51 Tier-C' frontend/src/components/bulk-actions` lists ONLY those two Dialog files

Visual baseline regen per D-12. Read Wave-2 `regen_targets` from manifest (expected: `list-pages-visual`, plus `tailwind-remap-visual` if present per RESEARCH Open Question 2 — manifest tells the truth):

5. For each spec: `pnpm --filter frontend playwright test frontend/tests/e2e/<spec>.spec.ts --update-snapshots`
6. Run LTR≠RTL byte-distinction check per RESEARCH §"D-12 LTR≠RTL Byte-Distinction Check":
   ```
   for snap_dir in frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/; do
     for variant in 1280 768; do
       ltr=$(ls "$snap_dir"*ltr*"$variant"*chromium*.png 2>/dev/null | head -1)
       rtl=$(ls "$snap_dir"*rtl*"$variant"*chromium*.png 2>/dev/null | head -1)
       if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then
         echo "FAIL: $ltr and $rtl are byte-identical (D-22 violation)"
         exit 1
       fi
     done
   done
   ```
   If any pair is byte-identical: STOP, revert the last commit, investigate per RESEARCH Pitfall 5.
7. Commit regenerated snapshots in same PR. Message: `chore(58-W2): regen visual baselines (list-pages-visual[, tailwind-remap-visual]) + LTR≠RTL byte-distinction reasserted`.
   </action>
   <verify>
   <automated>pnpm lint && pnpm type-check && pnpm --filter frontend test:unit && for snap*dir in frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/; do for variant in 1280 768; do ltr=$(ls "$snap_dir"\_ltr*"$variant"*chromium*.png 2>/dev/null | head -1); rtl=$(ls "$snap_dir"*rtl*"$variant"_chromium_.png 2>/dev/null | head -1); if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then echo "FAIL LTR=RTL"; exit 1; fi; done; done && ! grep -rn 'Phase 51 Tier-C' frontend/src/components/assignments frontend/src/components/audit-logs frontend/src/components/elected-officials frontend/src/components/entity-comparison frontend/src/components/risk-list frontend/src/components/triage-panel frontend/src/components/version-history-viewer frontend/src/components/working-groups</automated>
   </verify>
   <acceptance_criteria> - `pnpm lint` exits 0 workspace-wide - `pnpm type-check` exits 0 - `pnpm test:unit` exits 0 - Wave-2 file set has zero `Phase 51 Tier-C` markers - Visual baselines for `list-pages-visual.spec.ts` (+ `tailwind-remap-visual` if present) regenerated and committed in same PR - LTR vs RTL byte-distinction preserved on all regenerated pairs across viewports (1280, 768) - Snapshot regen commit message matches `chore(58-W2): regen visual baselines (...)`
   </acceptance_criteria>
   <done>Wave-2 D-11 full gate passes; ready for PR.</done>
   </task>

<task type="auto">
  <name>Task 4: Open Wave-2 PR and merge after CI green</name>
  <files>(PR creation; no source edits)</files>
  <read_first>`58-CONTEXT.md` §"Specifics" line 188 (PR title convention); Phase 55 D-13 (8 required CI contexts)</read_first>
  <action>
Push: `git push -u origin phase-58/wave-2-tables`. Open PR via `gh pr create`:
- Title: `phase-58/wave-2-tables: tables token swap (<N> files / <M> nodes / <K> annotations cleared)` (substitute actual counts)
- Base: `main`
- Body: per-file commit log, verification evidence (`pnpm lint`, `pnpm type-check`, `pnpm test:unit`, LTR/RTL byte-distinction check output), visual-baseline regen note, no-touch attestation (`eslint.config.mjs:247-270`, `list-pages.css`, `bad-design-token.tsx`)

Wait for 8 CI contexts to pass per Phase 55 D-13. No `--admin`, no `--no-verify`. Merge with `gh pr merge --merge` (NOT `--squash`, NOT `--rebase` — preserve atomic per-file commits per D-04).

Update 58-VALIDATION.md Wave-2 task rows from ⬜ to ✅.
</action>
<verify>
<automated>gh pr list --state merged --head phase-58/wave-2-tables --json number,title,mergedAt | grep -q 'wave-2-tables' && git fetch origin main && git log --oneline origin/main | head -5 | grep -qiE 'wave-2-tables|58-W2'</automated>
</verify>
<acceptance_criteria> - PR `phase-58/wave-2-tables` → `main` opened with correct title - All 8 required CI contexts pass - Merged via `gh pr merge --merge` (preserves atomic per-file commits) - 58-VALIDATION.md Wave-2 rows updated to ✅
</acceptance_criteria>
<done>Wave-2 merged to main; Wave 3 may branch off latest main.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                                | Description                                        |
| ------------------------------------------------------- | -------------------------------------------------- |
| dev machine → frontend/src/components/{tables surfaces} | Source edits; lint + visual specs gate regressions |
| dev machine → main branch                               | PR-only; 8 CI contexts; no admin bypass            |

## STRIDE Threat Register

| Threat ID  | Category  | Component                                 | Disposition | Mitigation Plan                                                                                                                                                      |
| ---------- | --------- | ----------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-58-02-01 | Tampering | Wave-2 source swaps                       | mitigate    | Per-file `pnpm lint <file>` exit 0 (D-04); atomic commits; manifest-driven file list                                                                                 |
| T-58-02-02 | Tampering | Bulk-action Dialog files (deferred to W3) | mitigate    | Wave-2 acceptance criteria explicitly assert BulkActionConfirmDialog/PreviewDialog still have markers; cross-wave file claim violation caught by manifest uniqueness |
| T-58-02-03 | Tampering | Visual baseline PNGs                      | mitigate    | LTR≠RTL byte-distinction check per D-12                                                                                                                              |
| T-58-02-04 | Tampering | Tier-B carve-out and CSS bridge           | mitigate    | No-touch attestation in PR body; reviewer inspection                                                                                                                 |

</threat_model>

<verification>
- TOKEN-01: zero `Phase 51 Tier-C` markers in Wave-2 file set
- D-04: ~15 atomic per-file commits
- D-08/D-09/D-10: dark-variant ladder correctly applied
- D-12: visual baselines regenerated in same PR with LTR≠RTL byte-distinction
- No edits to `eslint.config.mjs`, `list-pages.css`, `bad-design-token.tsx`
- bulk-actions Dialog files NOT touched (deferred to Wave 3)
</verification>

<success_criteria>
Wave 2 complete when: PR merged to `main` with ~15 atomic per-file commits; Wave-2 file set has zero `Phase 51 Tier-C` markers; `pnpm lint && pnpm type-check && pnpm test:unit` exit 0; `list-pages-visual.spec.ts-snapshots/` regenerated with LTR≠RTL byte-distinction preserved.
</success_criteria>

<output>
Create `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-02-SUMMARY.md` after merge. SUMMARY captures: files swapped, annotations cleared, helper-reuse adoption (how many files reused `getStatusBadgeClass`/etc.), per-file commit SHAs, visual baselines regenerated, links to PR + merge commit, Wave 2 → Wave 3 handoff notes (the 3 deferred Dialog files).
</output>
