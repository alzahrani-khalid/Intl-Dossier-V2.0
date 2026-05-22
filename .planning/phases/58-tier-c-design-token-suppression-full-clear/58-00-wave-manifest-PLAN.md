---
phase: 58-tier-c-design-token-suppression-full-clear
plan: 00
type: execute
wave: 0
depends_on: []
files_modified:
  - .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md
autonomous: true
requirements:
  - TOKEN-01
  - TOKEN-02
must_haves:
  truths:
    - '58-WAVE-MANIFEST.md exists and lists EVERY file in frontend/src/ that contains the literal string `Phase 51 Tier-C`'
    - 'Each manifest row maps to EXACTLY ONE wave in {1, 2, 3, 4, 5, 6} — no orphans, no cross-wave claims'
    - 'Per-row override columns (blue_purple_collision, dark_variant_present, multi_literal_line, regen_targets, test_grep_hits) are populated deterministically'
    - 'All downstream wave plans (58-01..58-06) can read the manifest as their authoritative file→wave assignment source'
  artifacts:
    - path: '.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md'
      provides: 'Deterministic file→wave assignment table for the 268 Tier-C source files'
      contains: 'audit_slug, file_path, wave, surface, palette_literal_count, blue_purple_collision, dark_variant_present, multi_literal_line, regen_targets, test_grep_hits, override_notes'
  key_links:
    - from: '.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md'
      to: '.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md'
      via: 'audit_slug column anchors each row to the Tier-C Disposition Table'
      pattern: 'audit_slug.*51-DESIGN-AUDIT.md#'
    - from: '.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md'
      to: 'frontend/src/**/*.{ts,tsx}'
      via: 'file_path column lists every Tier-C-annotated source file (relative to repo root)'
      pattern: "frontend/src/.*\\.(ts|tsx)"
---

<objective>
Produce `58-WAVE-MANIFEST.md` — the deterministic file→wave allocation table that downstream wave plans (58-01..58-06) consume as their authoritative source. Without the manifest, the per-wave plans cannot enumerate their files, cannot apply the D-07 blue+purple collision override, and cannot identify the 3 test-grep-hit files that need same-PR test updates per D-14.

Purpose: Ship Wave 0 FIRST (per D-03) so every subsequent wave PR has a single source of truth for which files it owns. The manifest is the contract that prevents cross-wave file claims (D-04 atomic-per-file precondition).

Output: One new markdown artifact at `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md`, committed with the convention `chore(58): commit Phase 58 wave manifest (271 files, 2336 nodes mapped to 6 surfaces)` per CONTEXT.md §"Specific Ideas" line 187.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-CONTEXT.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-RESEARCH.md
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-VALIDATION.md
@.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Generate and commit 58-WAVE-MANIFEST.md</name>
  <files>.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md</files>
  <read_first>
    - `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-CONTEXT.md` §"Specific Ideas" line 186 (manifest column list) and line 187 (single Wave-0 commit message convention)
    - `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-RESEARCH.md` §"Wave-Boundary Detection (Wave 0 manifest builder logic)" lines 411-436 (bash bucketing script), §"Per-Wave File Counts (Live Bucketing)" lines 497-506, §"Blue+Purple Collision Files (79 candidates for D-07 treatment)", §"Test-Grep Hits (3 files)", §"Per-Wave `regen_targets` Recommendations"
    - `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-PATTERNS.md` §"Wave 0: 58-WAVE-MANIFEST.md (planning artifact)" — the convention template at lines 38-48
    - `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` §"Tier-C Disposition Table" — source of `audit_slug`, `file_path`, `raw_hex_count`, `palette_literal_count`, `proposed_token_map` for each row
    - `.planning/phases/51-design-token-compliance-gate/51-VERIFICATION.md` §D-12 — the 2336 AST nodes vs 2245 source lines vs 2227 disable lines reconciliation (Assumption A6 in 58-RESEARCH.md); manifest must NOT attempt to "fix" these
  </read_first>
  <action>
Generate `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md` deterministically as a markdown table with one row per Tier-C source file plus a single header row. Columns (exact order): `audit_slug | file_path | wave | surface | raw_hex_count | palette_literal_count | blue_purple_collision | dark_variant_present | multi_literal_line | regen_targets | test_grep_hits | override_notes`.

Step 1 — Enumerate the file set. Run `grep -rln "Phase 51 Tier-C" frontend/src | sort -u` from the repo root. Expected count: 268 unique files (canonical live-grep baseline at `phase-57-base` per 58-RESEARCH.md §Summary). If the count differs, document the delta in the manifest's preamble.

Step 2 — Bucket each file to a wave using the exact precedence rules from 58-RESEARCH.md §"Wave-Boundary Detection". Precedence (first-match-wins):

- Wave 1 (forms): file_path matches `^components/(forms|empty-states|advanced-search|duplicate-detection|duplicate-comparison|form-auto-save|actionable-errors|active-filters|validation)/` AND basename does NOT match `(Drawer|Dialog|Modal)\.tsx$`
- Wave 3 (drawers-dialogs): basename matches `(Drawer|Dialog|Modal)\.tsx$` regardless of directory (filename pattern wins per RESEARCH §"Critical surfacing for the planner" — applies to `bulk-actions/BulkActionPreviewDialog.tsx`, `bulk-actions/BulkActionConfirmDialog.tsx`, `duplicate-detection/MergeDialog.tsx`, `scheduled-reports/ExecutionHistoryDialog.tsx`)
- Wave 2 (tables): file_path matches `^components/(audit-logs|bulk-actions|elected-officials|entity-comparison|scheduled-reports|version-history-viewer|version-comparison|risk-list|triage-panel|working-groups|assignments)/` AND basename does NOT match drawer/dialog/modal pattern
- Wave 4 (dossier-rail): file_path matches `^components/(dossier|dossier-recommendations|dossier-timeline|dossiers)/` OR `^pages/dossiers/`, AND basename does NOT match drawer/dialog/modal pattern
- Wave 5 (charts-residue): file_path matches `^components/(analytics|sla-monitoring|sla-countdown|dashboard-widgets|realtime-status|offline-indicator|scenario-sandbox|signature-visuals)/`, AND the file is NOT in the Tier-B carve-out at `eslint.config.mjs:247-270`, AND basename does NOT match drawer/dialog/modal pattern
- Wave 6 (pages-routes-misc): catch-all — every file not claimed by Waves 1-5

Step 3 — For each row, populate columns:

- `audit_slug`: copy the basename slug from 51-DESIGN-AUDIT.md's slug index (each anchor in `51-DESIGN-AUDIT.md#<basename>`)
- `file_path`: relative to repo root (e.g., `components/forms/FormInput.tsx`)
- `wave`: 1..6 per the precedence rules above
- `surface`: matching surface label (`forms`, `tables`, `drawers-dialogs`, `dossier-rail`, `charts-residue`, `pages-routes-misc`)
- `raw_hex_count`: copy from 51-DESIGN-AUDIT.md row
- `palette_literal_count`: copy from 51-DESIGN-AUDIT.md row (this is the AST-Literal-node count for the file)
- `blue_purple_collision`: `yes` if file contains BOTH a blue-family literal (`(text|bg|border)-(blue|sky|cyan|teal|indigo)-`) AND a purple-family literal (`(text|bg|border)-(purple|violet|fuchsia|pink)-`). Detect via `grep -E` against the file's current contents at `phase-57-base`. Note A2 in 58-RESEARCH: this is a superset and is later verified per-file by the wave executor before applying D-07 override (purple → `bg-secondary` / `text-secondary-foreground` / `border-secondary`)
- `dark_variant_present`: `yes` if file contains any `dark:(text|bg|border)-` literal that is also gated by a Tier-C disable line. Detect via `grep -c "dark:"` on lines immediately following `Phase 51 Tier-C:` annotations
- `multi_literal_line`: `yes` if any source line contains 2+ palette-literal substrings inside distinct string literals (heuristic: source line contains 2+ matches of the palette regex). This is a SUPERSET of the canonical 91-delta from 51-VERIFICATION D-12; per-file lint check is the safety net per RESEARCH Pitfall 1
- `regen_targets`: comma-separated list of visual spec names from `frontend/tests/e2e/*-visual.spec.ts` whose surface this file touches. Defaults from 58-RESEARCH.md §"Per-Wave `regen_targets` Recommendations":
  - Wave 1 → `after-actions-page-visual,tailwind-remap-visual` (drop `tailwind-remap-visual` if `ls frontend/tests/e2e/tailwind-remap-visual.spec.ts` returns no match and record the omission in `override_notes`)
  - Wave 2 → `list-pages-visual,tailwind-remap-visual` (same drop rule)
  - Wave 3 → `dossier-drawer-visual,calendar-visual,kanban-visual,tasks-page-visual`
  - Wave 4 → `dossier-drawer-visual,dashboard-visual`
  - Wave 5 → `dashboard-visual,dashboard-widgets-visual`
  - Wave 6 → `activity-page-visual,briefs-page-visual,list-pages-visual,settings-page-visual,tasks-tab-visual`
- `test_grep_hits`: name of any unit-test file under `frontend/tests/unit/**` or `frontend/src/**/__tests__/**` that imports or asserts against this source file's palette literal. Per 58-RESEARCH §"Test-Grep Hits", only 3 are known:
  - `components/forms/FormInput.tsx` → `frontend/tests/unit/FormInput.test.tsx`
  - `components/signature-visuals/Sparkline.tsx` → `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` (but Sparkline is in Tier-B carve-out — see override_notes)
  - `frontend/src/styles/list-pages.css` → `frontend/tests/unit/design-system/handoff-css-contract.test.ts` (out of Phase 58 scope — CSS bridge)
- `override_notes`: free-text per-row exception capture. Required entries:
  - `components/dossiers/CustomNodes.tsx` → "68 disables; React-Flow node renderer; verified NOT in Tier-B carve-out at eslint.config.mjs:247-270 — stays in Phase 58 scope per RESEARCH Open Question 1; flag for chromatic regression watching"
  - `components/signature-visuals/Sparkline.tsx` → "Tier-B carve-out per eslint.config.mjs — NO source swap; test file Sparkline.test.tsx asserts pass-through behavior, NO test update needed"
  - `components/forms/FormInput.tsx` → "Wave 1 swap target; FormInput.test.tsx D-14 same-PR update: toHaveClass('border-red-500') → toHaveClass('border-danger'); toHaveClass('border-gray-300') → toHaveClass('border-line')"
  - Any file where `tailwind-remap-visual.spec.ts` was listed but doesn't exist at planning baseline: record "tailwind-remap-visual.spec.ts absent at phase-57-base; dropped from regen_targets per RESEARCH Open Question 2"

Step 4 — Add a preamble section above the table with:

- Generation timestamp and base commit SHA (`git rev-parse phase-57-base`)
- Total file count (expected 268), AST-node count (2336 per 51-VERIFICATION), disable-line count (2227 per RESEARCH §Summary), reconciliation reference to 51-VERIFICATION D-12 (do NOT attempt to fix the 2336/2245/91-delta)
- Per-wave summary line: `Wave N: <file_count> files, <annotation_count> annotations`
- A "How to use this manifest" note: each wave's PLAN.md derives its task list from the rows where `wave == N`; wave executors apply the swap mapping per CONTEXT D-05..D-10 with the per-row overrides from `blue_purple_collision`, `dark_variant_present`, `multi_literal_line`, `test_grep_hits`, and `override_notes`

Step 5 — Commit the manifest. Use the exact commit message from CONTEXT.md line 187: `chore(58): commit Phase 58 wave manifest (271 files, 2336 nodes mapped to 6 surfaces)`. The "271 files" headline figure is preserved from CONTEXT (sourced from 51-DESIGN-AUDIT.md) even though the live grep yields 268; the manifest's preamble explains the 3-file delta (per RESEARCH §Summary: KanbanTaskCard.tsx, KanbanBoard.tsx, pages/engagements/workspace/TasksTab.tsx already swept by Phases 52/57). Commit with `--signoff` per repo convention; no `--no-verify`.

Step 6 — Open a manifest PR titled `phase-58/wave-0-manifest: commit Phase 58 wave manifest (268 files mapped to 6 surfaces)`. Branch name: `phase-58/wave-0-manifest`. Base off `phase-57-base` (or `main` if `main` is past `phase-57-base`). PR body must list per-wave file counts and link to 58-CONTEXT.md, 58-RESEARCH.md, and 58-VALIDATION.md. Merge to main only after the manifest renders correctly in PR preview (no malformed table rows).
</action>
<verify>
<automated>test -f .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md && [ "$(grep -c '^|' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md)" -ge 270 ] && grep -qE '^\| audit_slug \| file_path \| wave \| surface' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md && [ "$(grep -E '^\| [A-Za-z]' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | awk -F'|' '{print $4}' | sort -u | tr -d ' ' | sort)" = "$(printf '1\n2\n3\n4\n5\n6\n')" ]</automated>
</verify>
<acceptance_criteria> - File `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md` exists - Manifest contains a markdown table with the exact 12 columns specified - Row count (excluding header + alignment row) equals the live `grep -rln "Phase 51 Tier-C" frontend/src | wc -l` count at the manifest's recorded base SHA (expected 268) - Every row has `wave ∈ {1, 2, 3, 4, 5, 6}` — no row has `wave = 0` (Wave 0 is this manifest itself, not a source file) - Uniqueness check: `awk -F'|' '{print $3}'` on the file_path column yields no duplicates (no file claimed by two waves) - Per-wave file counts in the preamble match the actual row counts: `grep -c "^| .* | <surface> |"` equals the preamble's stated count for each surface - Required `override_notes` entries are present for `components/dossiers/CustomNodes.tsx`, `components/signature-visuals/Sparkline.tsx`, `components/forms/FormInput.tsx`, and any file with `tailwind-remap-visual.spec.ts` absent - The 3 known `test_grep_hits` entries are correctly populated (FormInput, Sparkline, handoff-css-contract) - Commit message reads exactly `chore(58): commit Phase 58 wave manifest (271 files, 2336 nodes mapped to 6 surfaces)` - PR opened on branch `phase-58/wave-0-manifest` with title `phase-58/wave-0-manifest: commit Phase 58 wave manifest (268 files mapped to 6 surfaces)` - `pnpm lint` exits 0 (manifest is markdown only; should not affect lint, but verify no incidental changes broke lint)
</acceptance_criteria>
<done>
58-WAVE-MANIFEST.md committed with deterministic file→wave assignment for all 268 Tier-C source files; per-row override columns populated; downstream wave plans 58-01..58-06 can read the manifest as their authoritative source; manifest PR opened and ready to merge before Wave 1 starts.
</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                     | Description                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| dev machine → repo           | Markdown artifact creation; no code execution risk                                                                  |
| repo → downstream wave plans | Manifest is parsed by humans + downstream executors as authoritative file→wave map; mis-bucketing propagates errors |

## STRIDE Threat Register

| Threat ID  | Category               | Component                    | Disposition | Mitigation Plan                                                                                                                                          |
| ---------- | ---------------------- | ---------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-58-00-01 | Tampering              | 58-WAVE-MANIFEST.md row data | mitigate    | Deterministic generation script in <action>; row count + uniqueness checks in <verify>; manifest preamble cites base SHA so future regen is reproducible |
| T-58-00-02 | Information Disclosure | manifest column values       | accept      | All data is public (file paths, palette literal counts); no PII or secrets                                                                               |
| T-58-00-03 | Repudiation            | manifest commit attribution  | mitigate    | Commit signed via SSH key per CLAUDE.md tag-signing setup; `--signoff` flag honors repo convention                                                       |

</threat_model>

<verification>
- `grep -c "^|" 58-WAVE-MANIFEST.md` ≥ 270 (header + alignment row + ≥268 data rows)
- `awk -F'|' '{print $3}' 58-WAVE-MANIFEST.md | sort | uniq -d` returns empty (no duplicate file_path rows)
- Per-wave sum of files in manifest == `grep -rln "Phase 51 Tier-C" frontend/src | wc -l` at base SHA
- Manifest preamble cites `phase-57-base` SHA `f16c3b63` (or current `phase-57-base` SHA if different) per RESEARCH §Summary
- PR open on `phase-58/wave-0-manifest` branch; no merge to main yet (gate for Wave 1)
</verification>

<success_criteria>
Wave 0 complete when `58-WAVE-MANIFEST.md` is committed with the deterministic file→wave mapping for all 268 Tier-C source files, the file is the single source of truth that Waves 1-6 read for their per-file work, and the manifest PR is open (merge happens before Wave 1 PR opens).
</success_criteria>

<output>
Create `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-00-SUMMARY.md` after the manifest PR merges. SUMMARY captures: manifest row count vs expected, per-wave file count breakdown, any deviations from the precedence rules, and links to the manifest PR + commit SHA.
</output>
