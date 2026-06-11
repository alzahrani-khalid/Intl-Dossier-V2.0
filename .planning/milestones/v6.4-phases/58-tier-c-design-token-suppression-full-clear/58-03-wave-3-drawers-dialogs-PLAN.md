---
phase: 58-tier-c-design-token-suppression-full-clear
plan: 03
type: execute
wave: 3
depends_on:
  - 58-02
files_modified:
  - frontend/src/components/bulk-actions/BulkActionConfirmDialog.tsx
  - frontend/src/components/bulk-actions/BulkActionPreviewDialog.tsx
  - frontend/src/components/collaboration/ConflictResolutionDialog.tsx
  - frontend/src/components/commitments/CommitmentDetailDrawer.tsx
  - frontend/src/components/commitments/deliverables/AddDeliverableDialog.tsx
  - frontend/src/components/compliance/ComplianceSignoffDialog.tsx
  - frontend/src/components/delegation/CreateDelegationDialog.tsx
  - frontend/src/components/duplicate-detection/MergeDialog.tsx
  - frontend/src/components/entity-links/EntitySearchDialog.tsx
  - frontend/src/components/entity-templates/QuickEntryDialog.tsx
  - frontend/src/components/forums/ForumDetailsDialog.tsx
  - frontend/src/components/input-dialog/InputDialog.tsx
  - frontend/src/components/milestone-planning/ConvertMilestoneDialog.tsx
  - frontend/src/components/scheduled-reports/ExecutionHistoryDialog.tsx
  - frontend/src/components/stakeholder-timeline/StakeholderAnnotationDialog.tsx
  - frontend/src/components/timeline/TimelineAnnotationDialog.tsx
  - frontend/src/components/waiting-queue/EscalationDialog.tsx
  - frontend/src/components/workflow-automation/WorkflowTestDialog.tsx
autonomous: true
requirements:
  - TOKEN-01
must_haves:
  truths:
    - "Every Wave-3 file (per 58-WAVE-MANIFEST.md `wave == 3` — files matching `(Drawer|Dialog|Modal)\\.tsx$`) contains zero `Phase 51 Tier-C:` annotations after swap"
    - 'Composite-chrome literals (bg + border + text alert states) follow D-08 (bg/border preserve dark + alpha bump) and D-09 (text-* drops dark variant)'
    - 'Wave-3 visual baselines (dossier-drawer, calendar, kanban, tasks-page) regenerate cleanly and LTR PNG ≠ RTL PNG byte-for-byte per D-12'
    - 'pnpm lint exits 0 workspace-wide; pnpm type-check exits 0; pnpm test:unit green'
  artifacts:
    - path: 'frontend/src/components/commitments/CommitmentDetailDrawer.tsx'
      provides: 'Drawer chrome with semantic tokens (D-08 composite chrome pattern)'
    - path: 'frontend/src/components/entity-links/EntitySearchDialog.tsx'
      provides: 'Highest-density Wave-3 dialog (36 disables) — fully swapped'
  key_links:
    - from: 'Wave-3 dialog/drawer/modal files'
      to: 'frontend/src/index.css @theme block'
      via: 'Composite chrome state classes (bg-danger/10 + border-danger/30 + text-danger trios)'
      pattern: '(bg|border|text)-(danger|warning|success|info|accent|secondary|secondary-foreground)/?[0-9]*'
---

<objective>
Swap every `Phase 51 Tier-C:` palette-literal suppression in the Wave 3 (drawers / dialogs / modals) surface to semantic-token utilities per CONTEXT D-05..D-10. Wave 3 file selection is by FILENAME PATTERN (`(Drawer|Dialog|Modal)\.tsx$`) regardless of containing directory — this is why files from `bulk-actions/`, `duplicate-detection/`, `scheduled-reports/`, `compliance/`, `delegation/` etc. land here (RESEARCH §"Critical surfacing for the planner" — filename pattern wins on wave-boundary collisions).

Purpose: Dialogs and drawers carry the most composite chrome (alert-state backgrounds + matching borders + matching text + conditional `cn()` calls). Wave 3 is where the D-08 (bg/border with dark variant) and D-09 (text-\* without dark variant) interplay matters most. The Wave-1 and Wave-2 swaps have validated the algorithm on lower-density files; Wave 3 applies it to higher-density composite-chrome leaves.

Output: PR `phase-58/wave-3-drawers-dialogs: drawers/dialogs/modals token swap (N files / M nodes / K annotations cleared)` on branch `phase-58/wave-3-drawers-dialogs`, ~18 atomic commits.
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
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-02-SUMMARY.md
@frontend/src/index.css
@frontend/src/lib/semantic-colors.ts
@frontend/src/components/forms/UnifiedFileUpload.tsx
@frontend/src/components/collaboration/EditingLockIndicator.tsx

<interfaces>
<!-- Wave-3 precedents per 58-PATTERNS.md §"Wave 3: drawers-dialogs" (no exact Tier-A *Dialog.tsx exists; UnifiedFileUpload + EditingLockIndicator are closest composite-chrome shapes) -->

Composite chrome — upload-zone error/success states (D-08 alpha-bump + cn() conditionals):
UnifiedFileUpload.tsx:181-191 — uploadedFile.status === 'error' && 'border-danger/30 dark:border-danger bg-danger/10 dark:bg-danger/30'

Composite chrome — drag-zone with dynamic state class:
UnifiedFileUpload.tsx:464-488 — isDragAccept && 'border-success bg-success/10 dark:bg-success/20'

Banner with composite chrome:
EditingLockIndicator.tsx:114-150 (BannerLock) — 'bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning'

Outline badge for dialog header chips:
EditingLockIndicator.tsx:170-177 (BadgeLock) — 'gap-1.5 border-warning/30 dark:border-warning bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning' — Wave 3 commits drop the redundant `dark:text-warning` per D-09
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Read Wave-3 manifest rows + composite-chrome precedents; branch off main</name>
  <files>(no source edits)</files>
  <read_first>
    - `58-WAVE-MANIFEST.md` rows where `wave == 3` (authoritative — confirms BulkActionConfirmDialog/PreviewDialog from bulk-actions, MergeDialog from duplicate-detection, ExecutionHistoryDialog from scheduled-reports all land in W3 by filename pattern)
    - `58-02-SUMMARY.md` for Wave-2 lessons learned (helper-reuse adoption rate)
    - `frontend/src/components/forms/UnifiedFileUpload.tsx` (Tier-A composite-chrome precedent)
    - `frontend/src/components/collaboration/EditingLockIndicator.tsx` (Tier-A banner + outline-badge precedent)
    - `58-PATTERNS.md` §"Wave 3: drawers-dialogs" (lines 296-360 — composite-chrome patterns)
  </read_first>
  <action>
Extract every row where `wave == 3` from 58-WAVE-MANIFEST.md (expected ~18 files matching `files_modified`). Confirm the filename-pattern-wins set:
- `bulk-actions/BulkActionConfirmDialog.tsx` + `bulk-actions/BulkActionPreviewDialog.tsx` (deferred from W2)
- `duplicate-detection/MergeDialog.tsx` (deferred from W1)
- `scheduled-reports/ExecutionHistoryDialog.tsx` (deferred from W2)

Read precedents and `58-PATTERNS.md` §"Wave 3" for composite-chrome shape. Note D-09 nuance from PATTERNS line 278: Tier-A files (EditingLockIndicator BadgeLock) retained redundant `dark:text-warning` mirrors. Wave 3 commits MAY remove these on lines being actively swapped, but do NOT chase pre-existing Tier-A mirrors. Keep change-surface minimal.

Identify blue+purple collision Wave-3 files from manifest (notably `collaboration/ConflictResolutionDialog.tsx` per RESEARCH §"Blue+Purple Collision Files" — 4 blue + 1 purple hit; `bulk-actions/BulkActionPreviewDialog.tsx` — 3 blue + 1 purple). These get D-07 treatment.

Create branch: `git checkout -b phase-58/wave-3-drawers-dialogs main` (Wave 2 has merged). Confirm: `grep -rln 'Phase 51 Tier-C' frontend/src/components/bulk-actions` shows ONLY the two Dialog files (other bulk-actions/* were cleared in Wave 2). Do NOT edit source files.
</action>
<verify>
<automated>git rev-parse --abbrev-ref HEAD | grep -qx 'phase-58/wave-3-drawers-dialogs' && [ "$(awk -F'|' '$4 ~ /^[[:space:]]*3[[:space:]]_$/ {print}' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | wc -l)" -ge 15 ] && [ "$(grep -rln 'Phase 51 Tier-C' frontend/src/components/bulk-actions | wc -l)" -eq 2 ]</automated>
</verify>
<acceptance_criteria> - On branch `phase-58/wave-3-drawers-dialogs` - Wave-3 file list (~18 files) extracted; deferred files from W1 + W2 included - Composite-chrome precedents read (UnifiedFileUpload, EditingLockIndicator) - Blue+purple collision Wave-3 files identified (ConflictResolutionDialog, BulkActionPreviewDialog candidates) - Wave 2 confirmed merged (bulk-actions/_ shows only the 2 deferred Dialog files) - No source files modified
</acceptance_criteria>
<done>Executor oriented; composite-chrome patterns reviewed; collision files flagged; branch ready.</done>
</task>

<task type="auto">
  <name>Task 2: Atomic per-file swaps — Wave 3 drawers/dialogs/modals (1 commit per file)</name>
  <files>
    frontend/src/components/bulk-actions/BulkActionConfirmDialog.tsx,
    frontend/src/components/bulk-actions/BulkActionPreviewDialog.tsx,
    frontend/src/components/collaboration/ConflictResolutionDialog.tsx,
    frontend/src/components/commitments/CommitmentDetailDrawer.tsx,
    frontend/src/components/commitments/deliverables/AddDeliverableDialog.tsx,
    frontend/src/components/compliance/ComplianceSignoffDialog.tsx,
    frontend/src/components/delegation/CreateDelegationDialog.tsx,
    frontend/src/components/duplicate-detection/MergeDialog.tsx,
    frontend/src/components/entity-links/EntitySearchDialog.tsx,
    frontend/src/components/entity-templates/QuickEntryDialog.tsx,
    frontend/src/components/forums/ForumDetailsDialog.tsx,
    frontend/src/components/input-dialog/InputDialog.tsx,
    frontend/src/components/milestone-planning/ConvertMilestoneDialog.tsx,
    frontend/src/components/scheduled-reports/ExecutionHistoryDialog.tsx,
    frontend/src/components/stakeholder-timeline/StakeholderAnnotationDialog.tsx,
    frontend/src/components/timeline/TimelineAnnotationDialog.tsx,
    frontend/src/components/waiting-queue/EscalationDialog.tsx,
    frontend/src/components/workflow-automation/WorkflowTestDialog.tsx
  </files>
  <read_first>For each file: file itself + its manifest row + UnifiedFileUpload.tsx (composite-chrome precedent — already in working memory from Task 1).</read_first>
  <action>
Execute one atomic commit per file (~18 commits). Internal ordering: highest-density first — `EntitySearchDialog.tsx` (36 disables), then `BulkActionPreviewDialog.tsx` (23 disables, blue+purple collision), then remainder alphabetically by directory.

For each file, apply the canonical swap pattern per CONTEXT D-05..D-10 (identical to Waves 1-2). Wave-3-specific emphasis:

1. Identify every `Phase 51 Tier-C:` annotation; recognize composite-chrome triples: a single dialog state (e.g. "error footer") often uses 3 literals — `bg-X-100 + border-X-200 + text-X-700` with matching `dark:` variants. Swap ALL three with consistent semantic (e.g. all `danger`).

2. Apply D-05 mapping (same as Wave 1-2).

3. D-07 collision rule for Wave-3 files where `blue_purple_collision == yes`:
   - `ConflictResolutionDialog.tsx`: blue → `text-accent` / `bg-accent/N` / `border-accent/N`; purple-family literals → `bg-secondary` / `text-secondary-foreground` / `border-secondary`
   - `BulkActionPreviewDialog.tsx`: same rule

4. D-08 (bg/border preserve dark + alpha bump): apply alpha ladder strictly. In composite chrome, the bg-N, border-N, and dark-bg-N often differ — preserve the source's relative alpha relationship after swap.

5. D-09 (text-\* drops dark variant): on lines actively being swapped, remove `dark:text-{semantic}` if added by the swap. Do NOT chase pre-existing Tier-A mirrors (per PATTERNS §"Wave 2" line 278 — out of swap scope).

6. D-10: no NET-NEW dark variants.

7. Composite-chrome cn() calls: when a `cn()` expression has multiple state branches (e.g. `error && 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800'`), apply the swap to each conditional independently — each conditional is a separate semantic state. Reference UnifiedFileUpload.tsx:181-191 + 464-488 for shape.

8. Handle `multi_literal_line == yes` — swap BOTH literals, delete single annotation.

9. Delete every Tier-C annotation; verify `! grep -n 'Phase 51 Tier-C' frontend/src/<file>`.

10. `pnpm lint frontend/src/<file>` exit 0; amend on `Unused eslint-disable directive` failures.

11. Commit message: `style(58-W3/<basename>): swap Tier-C palette literals to <semantic-family> tokens (N nodes, M annotations cleared)`.

12. No test-grep hits in Wave 3 per RESEARCH §"Test-Grep Hits" — no `tests/unit/*` updates.
    </action>
    <verify>
    <automated>WAVE3="frontend/src/components/bulk-actions/BulkActionConfirmDialog.tsx frontend/src/components/bulk-actions/BulkActionPreviewDialog.tsx frontend/src/components/collaboration/ConflictResolutionDialog.tsx frontend/src/components/commitments/CommitmentDetailDrawer.tsx frontend/src/components/commitments/deliverables/AddDeliverableDialog.tsx frontend/src/components/compliance/ComplianceSignoffDialog.tsx frontend/src/components/delegation/CreateDelegationDialog.tsx frontend/src/components/duplicate-detection/MergeDialog.tsx frontend/src/components/entity-links/EntitySearchDialog.tsx frontend/src/components/entity-templates/QuickEntryDialog.tsx frontend/src/components/forums/ForumDetailsDialog.tsx frontend/src/components/input-dialog/InputDialog.tsx frontend/src/components/milestone-planning/ConvertMilestoneDialog.tsx frontend/src/components/scheduled-reports/ExecutionHistoryDialog.tsx frontend/src/components/stakeholder-timeline/StakeholderAnnotationDialog.tsx frontend/src/components/timeline/TimelineAnnotationDialog.tsx frontend/src/components/waiting-queue/EscalationDialog.tsx frontend/src/components/workflow-automation/WorkflowTestDialog.tsx"; for f in $WAVE3; do if grep -nq 'Phase 51 Tier-C' "$f"; then echo "FAIL: $f"; exit 1; fi; done && pnpm lint $WAVE3</automated>
    </verify>
    <acceptance_criteria> - Every Wave-3 file has zero `Phase 51 Tier-C` markers - Composite chrome triples (bg + border + text) use consistent semantic family per state - Blue+purple collision Wave-3 files use `bg-secondary` / `text-secondary-foreground` / `border-secondary` for purple-family (D-07) - D-08/D-09/D-10 dark-variant policy applied correctly - `pnpm lint` on Wave-3 file set exits 0 - ~18 atomic per-file commits with `style(58-W3/<basename>):` prefix (D-04) - No edits to `eslint.config.mjs`, `list-pages.css`, `bad-design-token.tsx` - No `--no-verify`; no `--force` push
    </acceptance_criteria>
    <done>All Wave-3 drawer/dialog/modal files swapped; per-file lint clean; ready for wave-gate.</done>
    </task>

<task type="auto">
  <name>Task 3: Wave-3 gate — full lint/type-check/unit + visual baseline regen (dossier-drawer, calendar, kanban, tasks-page)</name>
  <files>
    frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/calendar-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/kanban-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/tasks-page-visual.spec.ts-snapshots/**
  </files>
  <read_first>
    - `58-VALIDATION.md` §"Per-Task Verification Map" rows 58-{1..6}-ZZ-01..03
    - `58-RESEARCH.md` §"D-12 LTR≠RTL Byte-Distinction Check"
    - `58-WAVE-MANIFEST.md` Wave-3 rows' `regen_targets`
  </read_first>
  <action>
Run the Wave-3 full gate per CONTEXT D-11:

1. `pnpm lint` exit 0 workspace-wide
2. `pnpm type-check` exit 0
3. `pnpm test:unit` green
4. Wave-3-scoped grep: confirm zero `Phase 51 Tier-C` markers in any `*Drawer.tsx`, `*Dialog.tsx`, `*Modal.tsx` file across `frontend/src/`. Command: `! find frontend/src -type f \( -name '*Drawer.tsx' -o -name '*Dialog.tsx' -o -name '*Modal.tsx' \) -exec grep -l 'Phase 51 Tier-C' {} +`

Visual baseline regen per D-12. Wave-3 specs (4): `dossier-drawer-visual`, `calendar-visual`, `kanban-visual`, `tasks-page-visual`:

5. `pnpm --filter frontend playwright test frontend/tests/e2e/dossier-drawer-visual.spec.ts frontend/tests/e2e/calendar-visual.spec.ts frontend/tests/e2e/kanban-visual.spec.ts frontend/tests/e2e/tasks-page-visual.spec.ts --update-snapshots`
6. Run LTR≠RTL byte-distinction check per RESEARCH §"D-12 LTR≠RTL Byte-Distinction Check" against ALL 4 spec snapshot dirs:
   ```
   for snap_dir in frontend/tests/e2e/{dossier-drawer,calendar,kanban,tasks-page}-visual.spec.ts-snapshots/; do
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
   If any byte-identical pair: STOP, revert the last commit per RESEARCH Pitfall 5.
7. Commit regenerated snapshots in same PR: `chore(58-W3): regen visual baselines (dossier-drawer, calendar, kanban, tasks-page) + LTR≠RTL byte-distinction reasserted`.

Human-verify gate (per CONTEXT D-12): chromatically inspect the regenerated `dossier-drawer-visual` and `kanban-visual` PNGs against the pre-regen baselines. A swap that visibly shifts the brand hue beyond mode-invariant ink-token convergence (RESEARCH §"Manual-Only Verifications" line 74) must flag in PR body — but is autonomous unless flagged. If chromatic regression suspected, halt the merge and consult.
</action>
<verify>
<automated>pnpm lint && pnpm type-check && pnpm --filter frontend test:unit && for sdir in frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/ frontend/tests/e2e/calendar-visual.spec.ts-snapshots/ frontend/tests/e2e/kanban-visual.spec.ts-snapshots/ frontend/tests/e2e/tasks-page-visual.spec.ts-snapshots/; do for variant in 1280 768; do ltr=$(ls "$sdir"_ltr_"$variant"*chromium*.png 2>/dev/null | head -1); rtl=$(ls "$sdir"*rtl*"$variant"_chromium_.png 2>/dev/null | head -1); if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then echo "FAIL LTR=RTL in $sdir"; exit 1; fi; done; done && [ "$(find frontend/src -type f \( -name '*Drawer.tsx' -o -name '*Dialog.tsx' -o -name '*Modal.tsx' \) -exec grep -l 'Phase 51 Tier-C' {} + | wc -l)" -eq 0 ]</automated>
</verify>
<acceptance_criteria> - `pnpm lint` / `pnpm type-check` / `pnpm test:unit` exit 0 - Zero `Phase 51 Tier-C` markers in ANY `*Drawer.tsx`/`*Dialog.tsx`/`*Modal.tsx`file across`frontend/src/` - All 4 visual baselines regenerated and committed in same PR - LTR≠RTL byte-distinction preserved on all regenerated pairs across all viewports - Snapshot regen commit follows convention
</acceptance_criteria>
<done>Wave-3 D-11 full gate passes; ready for PR.</done>
</task>

<task type="auto">
  <name>Task 4: Open Wave-3 PR and merge after CI green</name>
  <files>(PR creation)</files>
  <read_first>`58-CONTEXT.md` §"Specifics" line 188 (PR title convention); Phase 55 D-13 (8 required CI contexts)</read_first>
  <action>
Push: `git push -u origin phase-58/wave-3-drawers-dialogs`. Open PR via `gh pr create`:
- Title: `phase-58/wave-3-drawers-dialogs: drawers/dialogs/modals token swap (<N> files / <M> nodes / <K> annotations cleared)`
- Base: `main`
- Body: per-file commit log, verification evidence (4-spec visual regen output), no-touch attestation, chromatic-review note for dossier-drawer + kanban

Wait for 8 CI contexts to pass. Merge via `gh pr merge --merge` (preserve atomic commits). Update 58-VALIDATION.md Wave-3 rows ⬜ → ✅.
</action>
<verify>
<automated>gh pr list --state merged --head phase-58/wave-3-drawers-dialogs --json number,title,mergedAt | grep -q 'wave-3-drawers-dialogs'</automated>
</verify>
<acceptance_criteria> - PR opened with correct title; 8 CI contexts pass; merged with `--merge`; 58-VALIDATION.md updated
</acceptance_criteria>
<done>Wave-3 merged; Wave 4 may branch off latest main.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                           | Description                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| dev machine → dialog/drawer leaves | Composite chrome swaps; 4-spec visual regen catches regressions |
| dev machine → main branch          | PR-only; 8 CI contexts                                          |

## STRIDE Threat Register

| Threat ID  | Category               | Component                                           | Disposition | Mitigation Plan                                                                |
| ---------- | ---------------------- | --------------------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| T-58-03-01 | Tampering              | Composite chrome state triples (bg + border + text) | mitigate    | Per-file lint exit 0; D-08/D-09 ladder applied per `cn()` conditional          |
| T-58-03-02 | Tampering              | D-07 collision Wave-3 files                         | mitigate    | Manifest flags collision; purple → secondary, blue → accent enforced per state |
| T-58-03-03 | Tampering              | Visual baselines (4 specs)                          | mitigate    | LTR≠RTL byte-distinction check across all 4 spec snapshot dirs                 |
| T-58-03-04 | Information Disclosure | Dialog content                                      | accept      | No PII in palette literals                                                     |

</threat_model>

<verification>
- TOKEN-01: zero `Phase 51 Tier-C` markers in Wave-3 file set (and globally in any `*Drawer.tsx`/`*Dialog.tsx`/`*Modal.tsx`)
- D-04: ~18 atomic per-file commits
- D-07: collision files use `bg-secondary`/`text-secondary-foreground`/`border-secondary` for purple
- D-12: 4 visual baselines regenerated; LTR≠RTL preserved
- No touch to `eslint.config.mjs`, `list-pages.css`, `bad-design-token.tsx`
</verification>

<success_criteria>
Wave 3 complete when: PR merged with ~18 atomic per-file commits; no `*Drawer.tsx`/`*Dialog.tsx`/`*Modal.tsx` in `frontend/src/` contains `Phase 51 Tier-C`; `pnpm lint && pnpm type-check && pnpm test:unit` exit 0; 4 visual spec baselines regenerated with LTR≠RTL byte-distinction preserved.
</success_criteria>

<output>
Create `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-03-SUMMARY.md` after merge. SUMMARY captures: files swapped, composite-chrome patterns observed, D-07 collision count, per-file commit SHAs, 4-spec visual regen evidence, chromatic-review notes, links to PR + merge commit, Wave 3 → Wave 4 handoff (dossier-drawer-visual will be regenerated AGAIN in Wave 4 to re-affirm dossier-rail swaps).
</output>
