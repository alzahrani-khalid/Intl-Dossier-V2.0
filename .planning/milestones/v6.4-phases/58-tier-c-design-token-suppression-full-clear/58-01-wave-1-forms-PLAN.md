---
phase: 58-tier-c-design-token-suppression-full-clear
plan: 01
type: execute
wave: 1
depends_on:
  - 58-00
files_modified:
  - frontend/src/components/forms/FormInput.tsx
  - frontend/src/components/forms/FormSelect.tsx
  - frontend/src/components/forms/SearchableSelect.tsx
  - frontend/src/components/forms/FormCheckboxAceternity.tsx
  - frontend/src/components/empty-states/FilterPresetsSection.tsx
  - frontend/src/components/empty-states/IntakeRoleEmptyState.tsx
  - frontend/src/components/empty-states/IntelligentSearchSuggestions.tsx
  - frontend/src/components/empty-states/NotificationPreviewTimeline.tsx
  - frontend/src/components/advanced-search/AdaptiveFilters.tsx
  - frontend/src/components/advanced-search/DateRangeFilter.tsx
  - frontend/src/components/advanced-search/EnhancedSearchInput.tsx
  - frontend/src/components/duplicate-detection/DuplicateCandidateCard.tsx
  - frontend/src/components/duplicate-detection/DuplicateCandidatesList.tsx
  - frontend/src/components/duplicate-comparison/DuplicateComparison.tsx
  - frontend/src/components/form-auto-save/AutoSaveIndicator.tsx
  - frontend/src/components/form-auto-save/FormProgressIndicator.tsx
  - frontend/src/components/validation/validation-badge.tsx
  - frontend/tests/unit/FormInput.test.tsx
autonomous: true
requirements:
  - TOKEN-01
must_haves:
  truths:
    - 'Every Wave-1 file (per 58-WAVE-MANIFEST.md `wave == 1`) contains zero `Phase 51 Tier-C:` annotations after swap'
    - "Every Wave-1 file's palette-color literals are replaced with semantic-token utilities per D-05 (and D-06/D-07 for purple-family)"
    - 'FormInput.test.tsx assertions match the new semantic-token class names in the SAME wave PR per D-14'
    - 'Wave-1 visual baselines (after-actions-page, tailwind-remap if present) regenerate cleanly and LTR PNG ≠ RTL PNG byte-for-byte per D-12'
    - 'pnpm lint exits 0 workspace-wide after Wave 1 merges; pnpm type-check exits 0; pnpm test:unit green'
  artifacts:
    - path: 'frontend/src/components/forms/FormInput.tsx'
      provides: 'Form input chrome with `text-danger`/`border-danger`/`border-line` (no `text-red-600`/`border-red-500`/`border-gray-300`)'
      contains: 'border-danger'
    - path: 'frontend/tests/unit/FormInput.test.tsx'
      provides: 'Test assertions updated to new class names (per D-14 same-PR rule)'
      contains: "toHaveClass('border-danger')"
  key_links:
    - from: 'Wave-1 source files'
      to: 'frontend/src/index.css @theme block (lines 43-118)'
      via: 'Semantic Tailwind utilities (text-danger, bg-warning/10, border-line, text-secondary-foreground, etc.) — no new tokens added'
      pattern: '(text|bg|border)-(danger|warning|success|info|accent|muted|muted-foreground|line|secondary|secondary-foreground)'
    - from: 'Wave-1 source files'
      to: 'frontend/src/lib/semantic-colors.ts'
      via: "Reuse `getStatusBadgeClass`/`getPriorityBadgeClass`/`getInteractionTypeBadgeClass` when the file's literal corresponds to a known semantic family"
      pattern: "import .* from '@/lib/semantic-colors'"
---

<objective>
Swap every `Phase 51 Tier-C:` palette-literal suppression in the Wave 1 (forms) surface to a semantic-token utility per CONTEXT D-05..D-10. Wave 1 is the lowest-risk wave (leaf-most form components, least cross-coupled) and validates the swap pattern before the higher-risk dossier-rail and pages waves.

Purpose: First surface wave establishes the canonical swap shape (D-04 atomic-per-file + per-commit `pnpm lint` exit 0) using two pre-cleared Tier-A precedents (`FormCompletionProgress.tsx`, `UnifiedFileUpload.tsx`) as the reference. Also closes the D-14 test-coupling debt for `FormInput.test.tsx` in the same PR as the source swap.

Output: One PR titled `phase-58/wave-1-forms: forms token swap (N files / M nodes)` on branch `phase-58/wave-1-forms`, ~18 atomic commits (1 per file + 1 for FormInput.test.tsx + 1 closure commit for visual-baseline regen).
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
@frontend/src/index.css
@frontend/src/lib/semantic-colors.ts
@frontend/src/components/forms/FormCompletionProgress.tsx
@frontend/src/components/forms/UnifiedFileUpload.tsx

<interfaces>
<!-- Semantic Tailwind utilities available in @theme block, from frontend/src/index.css lines 43-118 -->
<!-- Use these directly — no new tokens, no parallel maps -->

Token utilities (light + dark mode-invariant for text-\*, mode-variant for bg/border):

- text-danger, bg-danger/N, border-danger/N (red/rose-family → danger)
- text-warning, bg-warning/N, border-warning/N (amber/yellow/orange → warning)
- text-success, bg-success/N, border-success/N (green/emerald/lime → success)
- text-info, bg-info/N, border-info/N (sky/cyan/teal → info)
- text-accent, bg-accent/N, border-accent/N (blue → accent for links/CTAs; D-05)
- text-muted-foreground, bg-muted, border-line (gray/slate/zinc/neutral/stone)
- text-secondary-foreground, bg-secondary, border-secondary (purple+blue collision per D-07)

From frontend/src/lib/semantic-colors.ts (canonical helpers — DO NOT duplicate):

- getStatusBadgeClass(status: WorkStatus): string
- getPriorityBadgeClass(priority: Priority): string
- getDossierTypeBadgeClass(type: DossierType): string
- getActivityTypeBadgeClass(activityType: string): string
- getInteractionTypeBadgeClass(interactionType: string): string

Alpha ladder (D-08 for bg/border):

- 100 → /10, 200 → /20, 300 → /30, 400 → /40, 500 → /50, 600 → /60, 700 → /70, 800 → /80, 900 → /90
- dark-variant alpha bumps one tier above source (source `dark:bg-X-900/30` → `dark:bg-{semantic}/30`)
- text-\* drops dark variant entirely (D-09): `text-X-700 dark:text-X-300` → `text-{semantic}`
  </interfaces>
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Read Wave-1 precedents and 58-WAVE-MANIFEST.md rows; branch off main</name>
  <files>(no source edits in this task)</files>
  <read_first>
    - `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md` — filter rows where `wave == 1`; this is the authoritative file list (the 18 files in `files_modified` above are derived from the live grep, but the manifest overrides if there is any drift)
    - `frontend/src/components/forms/FormCompletionProgress.tsx` lines 56-280 — canonical D-09 text-state + D-08 bg-with-dark-variant shape
    - `frontend/src/components/forms/UnifiedFileUpload.tsx` lines 181-191 and lines 464-488 — composite chrome with conditional state classes
    - `frontend/src/index.css` lines 43-118 — `@theme` block confirming all swap-target utilities exist
    - `frontend/src/lib/semantic-colors.ts` — canonical color-map helpers; reuse where the swap matches a known semantic
    - `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-PATTERNS.md` §"Wave 1: forms" (lines 59-180) — precedent code shapes with explicit BEFORE/AFTER mappings
  </read_first>
  <action>
Open the Wave-0 manifest at `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md` and extract every row where the `wave` column equals `1`. The result is the authoritative Wave-1 file list (expected ~18 files matching the `files_modified` frontmatter). For each row, note the `blue_purple_collision`, `dark_variant_present`, `multi_literal_line`, `regen_targets`, and `override_notes` columns — these per-row overrides drive the swap decisions in Task 2's per-file commits.

Read the two Tier-A precedents in full (`FormCompletionProgress.tsx`, `UnifiedFileUpload.tsx`) and the `@theme` block of `frontend/src/index.css` to confirm the swap-target utilities (`text-danger`, `bg-warning/10`, etc.) are all present. Read `semantic-colors.ts` to identify which Wave-1 files can reuse `getStatusBadgeClass` / `getPriorityBadgeClass` rather than inlining literals.

Create the branch: `git checkout -b phase-58/wave-1-forms phase-58/wave-0-manifest` (branch off the merge of Wave 0 if Wave 0 has already merged to main, otherwise branch off the wave-0 manifest branch directly per CONTEXT §"Integration Points"). Verify `git log --oneline phase-57-base..HEAD` shows only the manifest commit at the head.

Run the per-file dry-run for `FormInput.tsx` only: open the file, identify every `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:` line and the literal it suppresses (expected 5 annotations on lines 31, 35, 46, 57, 77 per 58-PATTERNS.md §"Wave 1: forms" line 27). Mentally map each literal to its D-05 swap target. Do NOT edit yet — Task 2 produces the atomic per-file commits.
</action>
<verify>
<automated>git rev-parse --abbrev-ref HEAD | grep -qx 'phase-58/wave-1-forms' && [ "$(awk -F'|' '$4 ~ /^[[:space:]]*1[[:space:]]*$/ {print}' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | wc -l)" -ge 15 ] && grep -q 'text-danger\|text-success\|text-warning' frontend/src/components/forms/FormCompletionProgress.tsx</automated>
</verify>
<acceptance_criteria> - Current branch is `phase-58/wave-1-forms` - Wave-1 file list extracted from 58-WAVE-MANIFEST.md; row count matches expected (~18 files) - Tier-A precedent files (`FormCompletionProgress.tsx`, `UnifiedFileUpload.tsx`) read in full; D-08/D-09 patterns understood - `frontend/src/index.css` `@theme` block confirmed to contain every target utility used by Wave 1 (text-danger, bg-warning, border-line, text-info, etc.) - `semantic-colors.ts` helpers identified for files that match a known semantic family (validation-badge.tsx, AutoSaveIndicator.tsx likely candidates) - No source files modified in this task (read-only orientation)
</acceptance_criteria>
<done>
Executor is oriented to the Wave-1 file list, swap-target utilities, and precedent shapes; branch ready for per-file atomic commits in Task 2.
</done>
</task>

<task type="auto">
  <name>Task 2: Atomic per-file swaps — Wave 1 forms surface (1 commit per file)</name>
  <files>
    frontend/src/components/forms/FormInput.tsx,
    frontend/src/components/forms/FormSelect.tsx,
    frontend/src/components/forms/SearchableSelect.tsx,
    frontend/src/components/forms/FormCheckboxAceternity.tsx,
    frontend/src/components/empty-states/FilterPresetsSection.tsx,
    frontend/src/components/empty-states/IntakeRoleEmptyState.tsx,
    frontend/src/components/empty-states/IntelligentSearchSuggestions.tsx,
    frontend/src/components/empty-states/NotificationPreviewTimeline.tsx,
    frontend/src/components/advanced-search/AdaptiveFilters.tsx,
    frontend/src/components/advanced-search/DateRangeFilter.tsx,
    frontend/src/components/advanced-search/EnhancedSearchInput.tsx,
    frontend/src/components/duplicate-detection/DuplicateCandidateCard.tsx,
    frontend/src/components/duplicate-detection/DuplicateCandidatesList.tsx,
    frontend/src/components/duplicate-comparison/DuplicateComparison.tsx,
    frontend/src/components/form-auto-save/AutoSaveIndicator.tsx,
    frontend/src/components/form-auto-save/FormProgressIndicator.tsx,
    frontend/src/components/validation/validation-badge.tsx,
    frontend/tests/unit/FormInput.test.tsx
  </files>
  <read_first>
    For EACH file in the Wave-1 list, before editing:
    - The target file itself (current state at `phase-58/wave-1-forms` HEAD; do NOT assume content from this plan)
    - The manifest row for that file (override columns drive the swap decisions)
    - `frontend/src/components/forms/FormCompletionProgress.tsx` (precedent shape for status icons / progress badges)
    - `frontend/src/components/forms/UnifiedFileUpload.tsx` (precedent shape for composite chrome / drag-zone states)
    - `frontend/src/lib/semantic-colors.ts` IF the manifest row indicates a known semantic family (status/priority/activity/interaction)
    Skip the precedent re-read on commits after the first — they only need to be in the executor's working memory; do not duplicate-read files within the same session.
  </read_first>
  <action>
Execute one atomic commit per file in the Wave-1 list (~18 commits). Internal commit ordering — process the forms/ directory first (FormInput.tsx leads because of D-14 test coupling), then empty-states/, advanced-search/, duplicate-detection/, duplicate-comparison/, form-auto-save/, validation/. For each commit:

1. Open the file. Identify every `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<basename>` annotation (single-line form) and every `/* eslint-disable no-restricted-syntax -- Phase 51 Tier-C: ... */` / `/* eslint-enable */` pair (block form, rare).

2. For each annotation's suppressed literal, apply the swap per CONTEXT D-05..D-10:
   - red/rose → `text-danger` (text-\*) or `bg-danger/N`/`border-danger/N` (bg/border with D-08 alpha ladder)
   - amber/yellow/orange → `text-warning` / `bg-warning/N` / `border-warning/N`
   - green/emerald/lime → `text-success` / `bg-success/N` / `border-success/N`
   - sky/cyan/teal → `text-info` / `bg-info/N` / `border-info/N`
   - blue → `text-accent` (links/CTAs) or `text-info` (badges/informational) per the audit row's `proposed_token_map` (51-DESIGN-AUDIT.md); when ambiguous, prefer `text-accent` (D-05)
   - gray/slate/zinc/neutral/stone → `text-muted-foreground` / `bg-muted` / `border-line`
   - purple/violet/fuchsia/pink/indigo → `text-accent` (D-06) UNLESS manifest row's `blue_purple_collision == yes`, in which case purple-family literals override to `bg-secondary` / `text-secondary-foreground` / `border-secondary` (D-07); blue-family stays on `text-accent`/`bg-accent`/`border-accent`

3. Dark-variant handling per D-08/D-09/D-10:
   - bg/border with explicit `dark:` variant: PRESERVE the dark variant and bump alpha one tier up from source (e.g., `bg-amber-100 dark:bg-amber-900/30` → `bg-warning/10 dark:bg-warning/30`; `border-amber-200 dark:border-amber-800` → `border-warning/20 dark:border-warning/80`)
   - text-\* with explicit `dark:` variant: DROP the dark variant entirely (e.g., `text-amber-700 dark:text-amber-300` → `text-warning`). Per RESEARCH §"Pattern 1" line 255, the canonical Tier-A files (`FormCompletionProgress.tsx`) sometimes kept a redundant `dark:text-success` mirror — Wave 1 commits drop it; do NOT chase pre-existing Tier-A mirrors in OTHER files (out of swap scope)
   - Source has NO dark variant: do NOT introduce one (D-10)

4. For files where `multi_literal_line == yes` in the manifest: a single Tier-C annotation covers two distinct string-literal nodes on the next line (per 51-VERIFICATION D-12 91-delta). Swap BOTH literals and delete the single annotation line in the same edit.

5. For `validation/validation-badge.tsx` and `form-auto-save/AutoSaveIndicator.tsx`: check manifest `override_notes` — if these files map to a known semantic family (status/priority), prefer `getStatusBadgeClass(status)` / `getPriorityBadgeClass(priority)` from `@/lib/semantic-colors` over inline literals (RESEARCH Pitfall 6 — no parallel maps).

6. Delete every Tier-C annotation line in the file. Verify zero remain: `! grep -n 'Phase 51 Tier-C' frontend/src/<file>` returns no matches.

7. Run `pnpm lint frontend/src/<file>` from the repo root. Must exit 0. If the lint emits `Unused eslint-disable directive`, that means a dangling annotation slipped through — fix in the same commit.

8. Commit with message: `style(58-W1/<basename>): swap Tier-C palette literals to <semantic-family> tokens (N nodes, M annotations cleared)` (per CONTEXT §"Specifics" line 188). Examples:
   - `style(58-W1/FormInput): swap Tier-C palette literals to danger/line tokens (5 nodes, 5 annotations cleared)`
   - `style(58-W1/AdaptiveFilters): swap Tier-C palette literals to accent/muted tokens (8 nodes, 6 annotations cleared)`

9. D-14 SAME-PR test update — when committing `components/forms/FormInput.tsx`, the SAME commit (or the NEXT commit, immediately following) updates `frontend/tests/unit/FormInput.test.tsx` lines 111 and 119:
   - `expect(input).toHaveClass('border-red-500')` → `expect(input).toHaveClass('border-danger')`
   - `expect(input).toHaveClass('border-gray-300')` → `expect(input).toHaveClass('border-line')`
     Commit message: `test(58-W1/FormInput): update class assertions to semantic-token names (D-14 same-PR coupling)`. Verify with `pnpm test:unit frontend/tests/unit/FormInput.test.tsx`; must exit 0.

10. Per-file commit gate (D-04 atomic precondition): after EACH commit, `pnpm lint frontend/src/<file>` exits 0 AND `! grep -n 'Phase 51 Tier-C' frontend/src/<file>` returns no matches. If either fails, AMEND the commit (this is a per-file atomic — amending is correct), do NOT pile a fix into the next commit.
    </action>
    <verify>
    <automated>for f in frontend/src/components/forms/FormInput.tsx frontend/src/components/forms/FormSelect.tsx frontend/src/components/forms/SearchableSelect.tsx frontend/src/components/forms/FormCheckboxAceternity.tsx frontend/src/components/empty-states/FilterPresetsSection.tsx frontend/src/components/empty-states/IntakeRoleEmptyState.tsx frontend/src/components/empty-states/IntelligentSearchSuggestions.tsx frontend/src/components/empty-states/NotificationPreviewTimeline.tsx frontend/src/components/advanced-search/AdaptiveFilters.tsx frontend/src/components/advanced-search/DateRangeFilter.tsx frontend/src/components/advanced-search/EnhancedSearchInput.tsx frontend/src/components/duplicate-detection/DuplicateCandidateCard.tsx frontend/src/components/duplicate-detection/DuplicateCandidatesList.tsx frontend/src/components/duplicate-comparison/DuplicateComparison.tsx frontend/src/components/form-auto-save/AutoSaveIndicator.tsx frontend/src/components/form-auto-save/FormProgressIndicator.tsx frontend/src/components/validation/validation-badge.tsx; do if grep -nq 'Phase 51 Tier-C' "$f"; then echo "FAIL: $f still has Tier-C annotation"; exit 1; fi; done; pnpm lint frontend/src/components/forms frontend/src/components/empty-states frontend/src/components/advanced-search frontend/src/components/duplicate-detection frontend/src/components/duplicate-comparison frontend/src/components/form-auto-save frontend/src/components/validation && pnpm test:unit frontend/tests/unit/FormInput.test.tsx</automated>
    </verify>
    <acceptance_criteria> - Every Wave-1 file listed in `files_modified` has zero `Phase 51 Tier-C` markers (`! grep -n 'Phase 51 Tier-C' <file>` returns no matches) - No new `dark:text-{semantic}` introduced beyond D-09 rule (text-\* drops dark variant); verify by `grep -n 'dark:text-' <changed-files>` not increasing over baseline - No NET-NEW dark variants on bg/border where source had none (D-10) - `pnpm lint frontend/src/components/{forms,empty-states,advanced-search,duplicate-detection,duplicate-comparison,form-auto-save,validation}` exits 0 - `pnpm test:unit frontend/tests/unit/FormInput.test.tsx` exits 0 with the updated class assertions - No commit uses `--no-verify`; no `git push --force` to main - Each file's swap is a SEPARATE atomic commit (D-04); `git log --oneline phase-58/wave-1-forms ^main` shows ~17-18 commits with `style(58-W1/<basename>):` or `test(58-W1/FormInput):` prefix - Blue+purple collision files (per manifest `blue_purple_collision == yes`): purple-family literals swapped to `bg-secondary` / `text-secondary-foreground` / `border-secondary`, NOT `text-accent` - Files with `multi_literal_line == yes`: both literals on flagged lines were swapped (lint exit 0 catches missed swaps via Unused eslint-disable directive) - No file outside Wave-1 list was modified; `git diff --name-only main..HEAD` shows only Wave-1 files + the test file - No edits to `eslint.config.mjs` (Tier-B carve-out at lines 247-270 untouched per CONTEXT D-13) - No edits to `frontend/src/styles/list-pages.css` (legacy bridge per RESEARCH Pitfall 3) - No edits to `tools/eslint-fixtures/bad-design-token.tsx` (positive-failure fixture per RESEARCH Pitfall 4)
    </acceptance_criteria>
    <done>
    All Wave-1 source files swapped to semantic tokens; FormInput.test.tsx updated in the same PR; per-file lint clean; ready for wave-gate task.
    </done>
    </task>

<task type="auto">
  <name>Task 3: Wave-1 gate — full lint, type-check, unit tests, visual baseline regen with LTR≠RTL byte check</name>
  <files>
    frontend/tests/e2e/after-actions-page-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/tailwind-remap-visual.spec.ts-snapshots/** (if spec exists)
  </files>
  <read_first>
    - `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-VALIDATION.md` §"Per-Task Verification Map" rows 58-{1..6}-ZZ-01..03 — wave-gate criteria
    - `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-RESEARCH.md` §"D-12 LTR≠RTL Byte-Distinction Check" lines 440-456 — exact bash check
    - `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md` — Wave-1 rows' `regen_targets` column for the authoritative list of specs to regenerate
  </read_first>
  <action>
Run the Wave-1 full gate per CONTEXT D-11. From the repo root:

1. `pnpm lint` — must exit 0 (workspace-wide; D-05 selectors at error severity per CONTEXT D-11)
2. `pnpm type-check` — must exit 0
3. `pnpm test:unit` — must pass (FormInput.test.tsx and any other Vitest specs)
4. Verify zero `Phase 51 Tier-C` markers in Wave-1 file set: `for f in <wave-1-files>; do grep -n 'Phase 51 Tier-C' $f && echo "FAIL: $f"; done` — no matches printed
5. Verify the global `grep -rn "Phase 51 Tier-C" frontend/src` STILL has matches (Waves 2-6 haven't shipped yet); the wave-scoped check is the gate, not the global

Visual baseline regen per D-12. Read the Wave-1 `regen_targets` from 58-WAVE-MANIFEST.md (expected: `after-actions-page-visual`, plus `tailwind-remap-visual` if it exists at `phase-57-base` — drop if absent per RESEARCH Open Question 2). For each spec in the list:

6. `pnpm playwright test frontend/tests/e2e/<spec>.spec.ts --update-snapshots` from the `frontend/` workspace (or use `pnpm --filter frontend playwright test` from repo root)
7. After regen, run the LTR≠RTL byte-distinction check per RESEARCH §"D-12 LTR≠RTL Byte-Distinction Check":
   ```
   for snap_dir in frontend/tests/e2e/<spec>.spec.ts-snapshots/; do
     for variant in 1280 768; do
       ltr=$(ls "$snap_dir"*ltr*"$variant"*chromium*.png 2>/dev/null | head -1)
       rtl=$(ls "$snap_dir"*rtl*"$variant"*chromium*.png 2>/dev/null | head -1)
       if [[ -f "$ltr" && -f "$rtl" ]]; then
         if cmp -s "$ltr" "$rtl"; then
           echo "FAIL: $ltr and $rtl are byte-identical (D-22 violation)"
           exit 1
         fi
       fi
     done
   done
   ```
   If ANY pair is byte-identical: STOP, revert the last commit, investigate (likely a `ms-*`/`me-*` mispairing or `text-start` swapped to `text-left` per RESEARCH Pitfall 5). Do NOT proceed.
8. Commit the regenerated snapshots in the SAME wave PR (D-12 mandates same-PR regen — no separate baseline-regen PR per CONTEXT). Commit message: `chore(58-W1): regen visual baselines (after-actions-page-visual[, tailwind-remap-visual]) + LTR≠RTL byte-distinction reasserted`.
   </action>
   <verify>
   <automated>pnpm lint && pnpm type-check && pnpm --filter frontend test:unit && for snap*dir in frontend/tests/e2e/after-actions-page-visual.spec.ts-snapshots/; do for variant in 1280 768; do ltr=$(ls "$snap_dir"\_ltr*"$variant"*chromium*.png 2>/dev/null | head -1); rtl=$(ls "$snap_dir"*rtl*"$variant"_chromium_.png 2>/dev/null | head -1); if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then echo "FAIL LTR=RTL"; exit 1; fi; done; done; ! grep -rn 'Phase 51 Tier-C' frontend/src/components/forms frontend/src/components/empty-states frontend/src/components/advanced-search frontend/src/components/duplicate-detection frontend/src/components/duplicate-comparison frontend/src/components/form-auto-save frontend/src/components/validation</automated>
   </verify>
   <acceptance_criteria> - `pnpm lint` exits 0 workspace-wide - `pnpm type-check` exits 0 - `pnpm test:unit` exits 0 (including FormInput.test.tsx) - Wave-1 file set has zero `Phase 51 Tier-C` markers - Visual baselines for `after-actions-page-visual.spec.ts` (and `tailwind-remap-visual.spec.ts` if present) regenerated; PNGs committed to the same PR - LTR vs RTL byte-distinction check passes (per the bash check in <action> step 7) for every regenerated pair across all viewports (1280, 768) - Snapshot regen commit follows the convention `chore(58-W1): regen visual baselines (<spec-list>) + LTR≠RTL byte-distinction reasserted`
   </acceptance_criteria>
   <done>
   Wave-1 D-11 full gate passes; visual baselines regenerated with LTR≠RTL byte-distinction preserved; ready for PR open + merge.
   </done>
   </task>

<task type="auto">
  <name>Task 4: Open Wave-1 PR and merge after CI green</name>
  <files>(PR creation; no source edits)</files>
  <read_first>
    - `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-CONTEXT.md` §D-15..D-16 + §"Specifics" line 188 — PR title convention
    - Phase 55 D-13 — 8 required CI contexts must pass on protected `main`
  </read_first>
  <action>
Push the branch: `git push -u origin phase-58/wave-1-forms`. Open a PR via `gh pr create` with:
- Title: `phase-58/wave-1-forms: forms token swap (<N> files / <M> nodes / <K> annotations cleared)` — substitute the actual counts from the per-commit log
- Base: `main`
- Body sections:
  - Summary: links to 58-CONTEXT.md (D-01..D-10) and 58-WAVE-MANIFEST.md (Wave-1 rows)
  - Per-file commit log (`git log --oneline main..HEAD`)
  - Verification evidence: paste the output of the wave-gate commands (`pnpm lint`, `pnpm type-check`, `pnpm test:unit`, LTR/RTL byte-distinction check)
  - Visual baseline regen note: which specs regenerated, viewport counts
  - D-14 same-PR test update note: link to `tests/unit/FormInput.test.tsx` commit
  - "No-touch" attestation: `eslint.config.mjs:247-270` untouched, `list-pages.css` untouched, `bad-design-token.tsx` untouched

Wait for the 8 required CI contexts to pass per Phase 55 D-13. If any fail: read the CI output, fix in a new commit (do NOT amend a merged commit), push, re-check. Do NOT bypass with `--admin` or `--no-verify`. Once CI green, merge via `gh pr merge --squash` is FORBIDDEN — use `gh pr merge --merge` to preserve the per-file atomic commits (D-04 bisectability).

After merge: update the Wave-1 status in `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-VALIDATION.md` task-status column from ⬜ to ✅ for Wave-1 task rows.
</action>
<verify>
<automated>gh pr list --state merged --head phase-58/wave-1-forms --json number,title,mergedAt | grep -q 'wave-1-forms' && git fetch origin main && git log --oneline origin/main | head -5 | grep -qiE 'wave-1-forms|58-W1'</automated>
</verify>
<acceptance_criteria> - PR opened with branch `phase-58/wave-1-forms` → `main` - PR title matches the convention `phase-58/wave-1-forms: forms token swap (...)` - All 8 required CI contexts pass (lint, type-check, unit, e2e-visual, etc. per Phase 55 D-13) - PR merged via `gh pr merge --merge` (NOT `--squash`, NOT `--rebase` — preserve per-file commits) - `git log origin/main --oneline | head` shows the merge commit with the wave-1 atomic commits intact (D-04 bisectability) - No use of `--admin`, `--no-verify`, or `git push --force` - 58-VALIDATION.md Wave-1 task rows updated to ✅
</acceptance_criteria>
<done>
Wave-1 PR merged to main; per-file atomic commits preserved; Wave 2 may now branch off the latest main.
</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                    | Description                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| dev machine → frontend/src/ | Source-code edits; lint/type-check/unit-test/playwright gates catch regressions |
| dev machine → main branch   | PR-based merges only; protected branch enforces 8 CI contexts                   |

## STRIDE Threat Register

| Threat ID  | Category               | Component                                     | Disposition | Mitigation Plan                                                                                                                      |
| ---------- | ---------------------- | --------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| T-58-01-01 | Tampering              | Wave-1 source file swaps                      | mitigate    | Per-file `pnpm lint <file>` exit 0 gate (D-04); atomic-per-file commits (D-04); manifest-driven file list prevents cross-wave claims |
| T-58-01-02 | Spoofing               | Wave-1 PR identity                            | mitigate    | Branch protection + signed commits per repo convention; no `--no-verify`                                                             |
| T-58-01-03 | Tampering              | Visual baseline PNGs                          | mitigate    | LTR≠RTL byte-distinction check per D-12 (RESEARCH Pitfall 5); regen commits same-PR per D-12                                         |
| T-58-01-04 | Information Disclosure | Source edits                                  | accept      | No PII or secrets in palette literals; public file paths only                                                                        |
| T-58-01-05 | Tampering              | Tier-B carve-out at eslint.config.mjs:247-270 | mitigate    | <acceptance_criteria> attests no edits to eslint.config.mjs; PR diff inspection by reviewer                                          |
| T-58-01-06 | Tampering              | bad-design-token.tsx fixture                  | mitigate    | Out of `frontend/src/` scope by file path; per-file lint won't reach it                                                              |

</threat_model>

<verification>
- Phase requirement TOKEN-01: zero `Phase 51 Tier-C` markers in Wave-1 file set (Wave-1 scope)
- D-04: 1 atomic commit per file (verified by `git log --oneline main..HEAD` showing ~17-18 distinct commits)
- D-08/D-09/D-10: dark-variant ladder correctly applied (no NET-NEW dark variants; text-* dropped dark variant; bg/border preserved + alpha-bumped where source had dark variant)
- D-12: visual baselines regenerated in same PR; LTR≠RTL byte-distinct
- D-14: FormInput.test.tsx updated in same PR
- D-15: no edits to `eslint.config.mjs`, `list-pages.css`, `bad-design-token.tsx`
</verification>

<success_criteria>
Wave 1 complete when: Wave-1 PR merged to `main` with all ~17-18 atomic per-file commits preserved; `! grep -rn "Phase 51 Tier-C" frontend/src/components/{forms,empty-states,advanced-search,duplicate-detection,duplicate-comparison,form-auto-save,validation}` returns zero matches; `pnpm lint && pnpm type-check && pnpm test:unit` all exit 0; `frontend/tests/e2e/after-actions-page-visual.spec.ts-snapshots/` regenerated with LTR≠RTL byte-distinction preserved.
</success_criteria>

<output>
Create `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-01-SUMMARY.md` after Wave-1 PR merges. SUMMARY captures: list of files swapped, total annotations cleared, total nodes swapped, per-file commit SHAs, visual baselines regenerated, links to Wave-1 PR + merge commit, any per-row overrides applied (blue+purple collision count, multi-literal-line cases), Wave 1 → Wave 2 handoff notes.
</output>
