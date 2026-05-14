---
phase: 51
plan: 03
plan_id: 51-03
type: execute
wave: 2
depends_on: [51-01]
files_modified:
  - .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md
  - frontend/src/routes/_protected/admin/system.tsx
  - frontend/src/routes/_protected/admin/data-retention.tsx
  - frontend/src/pages/MyAssignments.tsx
  - frontend/src/components/forms/FormErrorDisplay.tsx
  - frontend/src/components/forms/FormCompletionProgress.tsx
  - frontend/src/components/duplicate-comparison/DuplicateComparison.tsx
  - frontend/src/components/dossier/DossierTypeGuide.tsx
  - frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx
  - 'frontend/src/**/*.{ts,tsx} (~80-120 mechanical-swap files surfaced by sweep — full list enumerated in Task 1 audit step; commit-time set frozen after histogram)'
autonomous: true
requirements: [DESIGN-03]
requirements_addressed: [DESIGN-03]
tags: [tier-a, design-tokens, mechanical-sweep, audit]
objective: >-
  Tier-A mechanical sweep of ~80-120 files surfaced by the rg histogram — every file with
  ≤5 palette literals AND a clean status/badge/alert semantic mapping per the cookbook,
  plus mechanically-clean larger files like `FormCompletionProgress.tsx` (36 hits all in
  progress-state colors). Files with complex / mixed semantics (>20 literals, chart-like
  content, or no clean token map) are punted to Plan 51-04 as Tier-C audit rows with
  per-Literal eslint-disable annotations. This plan's exit state: every Tier-A file passes
  `pnpm exec eslint -c eslint.config.mjs <file>` with zero D-05 warnings.
user_setup: []
must_haves:
  truths:
    - 'The Tier-A file list (frozen after Task 1 histogram) is enumerated in 51-DESIGN-AUDIT.md §Tier-A Worklist.'
    - 'Every file in the Tier-A list passes `pnpm exec eslint -c eslint.config.mjs <file>` with zero D-05 warnings.'
    - "The Tier-A list does NOT include any file already enumerated in Plan 51-01's Tier-B carve-out (no over-match)."
    - 'The Tier-A list does NOT include WorldMapVisualization.tsx or PositionEditor.tsx (Plan 51-02 owns those).'
    - 'Bureau-light visual parity holds on a random sample of 5+ Tier-A files (status badges keep their hue family, success/warning/danger/info semantic intent preserved).'
    - '`pnpm typecheck` exits 0 after the sweep — no TS regressions introduced by mechanical swaps.'
    - 'Karpathy §3 surgical-change posture: `git diff --stat` shows ONLY className changes; no JSX-structure edits, no import re-orderings, no adjacent code refactoring.'
  artifacts:
    - path: '.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md'
      provides: 'Initial scaffold with Tier-A worklist + Tier-C disposition table (Tier-C rows populated by Plan 51-04 Task 1)'
      contains: 'Tier-A Worklist'
    - path: 'frontend/src/routes/_protected/admin/system.tsx'
      provides: '23 mechanical palette swaps (status badges)'
      contains: "text-danger\\|text-warning\\|text-success\\|text-info"
    - path: 'frontend/src/components/forms/FormCompletionProgress.tsx'
      provides: '36 mechanical palette swaps (progress states)'
      contains: "bg-success\\|bg-warning\\|bg-danger"
  key_links:
    - from: 'rg histogram (Task 1)'
      to: 'Tier-A worklist enumerated in 51-DESIGN-AUDIT.md'
      via: 'classification heuristic per RESEARCH §2 (≤5 hits + status/badge/alert OR ≤20 hits + ≤3 semantic categories AND mechanical → Tier-A; otherwise → Tier-C)'
      pattern: 'Tier-A Worklist'
    - from: "each Tier-A file's banned palette literals"
      to: 'frontend/src/index.css @theme token utilities (`text-danger`, `text-warning`, `text-success`, `text-info`, `text-accent`, `text-ink-mute`, `bg-muted`, `border-line`, etc.)'
      via: 'Token-replacement contract in 51-UI-SPEC.md §Token-replacement contract'
      pattern: '(text|bg|border|ring)-(danger|warning|success|info|accent|ink|muted|line)'
---

<objective>
Land the bulk of the DESIGN-03 ROADMAP success criterion 3 work: ~80-120 mechanical-swap
files representing ~600-900 className edits. Every file's palette literals map cleanly
onto the Token-replacement contract in 51-UI-SPEC.md without inventing new tokens.

This plan does NOT touch the chart / graph / report-preview Tier-B subtrees (Plan 51-01
carved them out at the config level). It does NOT touch the two ROADMAP named anchors
(Plan 51-02 owns those). It does NOT add Tier-C disables (Plan 51-04 owns those).

The classification step is critical: the executor produces the Tier-A vs Tier-C cut from
the live rg histogram BEFORE swapping. Files with complex semantics (>20 literals + mixed
families, chart-like content not in Tier-B carve-out, no clean cookbook mapping) are
queued for Plan 51-04 as Tier-C rows, NOT silently swapped.

Purpose: clear the mechanical bulk of the surfaced violations so that Plan 51-04's Tier-C
audit covers ONLY the files that genuinely need deferral, keeping the audit shape small
and reviewable.

Output: ~80-120 Tier-A-clean files; an initialized `51-DESIGN-AUDIT.md` with Tier-A
worklist + scaffold for Plan 51-04 to populate Tier-C rows.

**Parallel-safe with Plan 51-02** — disjoint file sets (Plan 51-02 owns the two named
anchors; Plan 51-03 owns the sweep targets). Both depend on Plan 51-01.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/51-design-token-compliance-gate/51-CONTEXT.md
@.planning/phases/51-design-token-compliance-gate/51-RESEARCH.md
@.planning/phases/51-design-token-compliance-gate/51-PATTERNS.md
@.planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md
@.planning/phases/51-design-token-compliance-gate/51-VALIDATION.md
@CLAUDE.md
@frontend/src/index.css
@frontend/src/lib/semantic-colors.ts

<interfaces>
<!-- Sweep command (verbatim from RESEARCH §2 + PATTERNS.md §Tier-A mechanical-swap files): -->

Per-file palette histogram with Tier-B exclusions:

```
PALETTE='(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\d{2,3}\b'

rg -c "$PALETTE" --type-add 'tsxts:*.{ts,tsx}' -ttsxts frontend/src/ 2>/dev/null \
  | grep -vE '/components/ui/|/signature-visuals/flags/|/analytics/.*Chart\.tsx|AnalyticsPreviewOverlay\.tsx|ChartWidget\.tsx|SLAComplianceChart\.tsx|InfluenceMetricsPanel\.tsx|InfluenceReport\.tsx|RelationshipGraph\.tsx|MiniRelationshipGraph\.tsx|ReportPreview\.tsx|semantic-colors\.ts|directions\.ts|tests/|__tests__|/index\.css|/modern-nav-tokens\.css|analytics/sample-data\.ts|position-editor/PositionEditor|geographic-visualization/WorldMapVisualization' \
  | sort -t: -k2 -rn
```

Classification heuristic (RESEARCH §2 Table):
| Condition | Disposition |
| File has ≤5 hits AND all are status/error/badge/alert | Tier-A (mechanical) |
| File has 6-20 hits AND all hits map to ≤3 semantic categories | Tier-A (mechanical, more work but still mappable; PositionEditor at 19 is the canonical analog) |
| File has >5 distinct palette-color FAMILIES (red+blue+green+amber+purple+…) | Tier-C (chart/graph-like) |
| File has >20 hits AND mixed semantics requiring per-line judgment | Tier-C with proposed_token_map column populated |

Top-10 anchor files for Tier-A worklist seeding (RESEARCH §2):
| File | Palette hits | Disposition | Reasoning |
| `routes/_protected/admin/system.tsx` | 23 | Tier-A | Status badges; mechanical |
| `routes/_protected/admin/data-retention.tsx` | 19 | Tier-A | Admin status panels |
| `pages/MyAssignments.tsx` | 17 | Tier-A | Status/priority chips |
| `components/forms/FormErrorDisplay.tsx` | 20 | Tier-A | Error/warning/info states |
| `components/forms/FormCompletionProgress.tsx` | 36 | Tier-A | Progress states; green/red/amber |
| `components/duplicate-comparison/DuplicateComparison.tsx` | 39 | Tier-A or split | Diff highlights — verify before commit |
| `components/dossier/DossierTypeGuide.tsx` | 26 | Tier-A | Type-color showcase; cross-check vs `semantic-colors.ts.dossierTypeColors` |
| `components/dossier/dossier-overview/sections/WorkItemsSection.tsx` | 18 | Tier-A | Work-item status chips |

Token-mapping cookbook (FULL TABLE — apply to every Tier-A swap):
| Banned palette | Token utility |
| `text-red-*`, `text-rose-*` | `text-danger` |
| `bg-red-*` (status bg) | `bg-danger/10` or `bg-danger/5` |
| `border-red-*` | `border-danger/30` or `border-danger` |
| `text-amber-*`, `text-yellow-*` | `text-warning` |
| `bg-amber-*`, `bg-yellow-*` | `bg-warning/10` |
| `text-green-*`, `text-emerald-*` | `text-success` |
| `bg-green-*`, `bg-emerald-*` | `bg-success/10` |
| `text-blue-*` (link semantic) | `text-accent` |
| `text-blue-*` (informational badge) | `text-info` |
| `bg-blue-*` (info bg) | `bg-info/10` |
| `text-gray/slate/zinc/neutral/stone-*` (body text) | `text-muted-foreground` or `text-ink-mute` or `text-ink-faint` |
| `bg-gray/slate/zinc/neutral/stone-*` (subtle bg) | `bg-muted` or `bg-line-soft` |
| `border-gray/slate/zinc/neutral/stone-*` | `border-line` or `border-input` |
| Variant chain | Preserved: `dark:text-accent`, `md:hover:bg-danger`, `focus:ring-accent` |
| `text-purple/violet/fuchsia/pink/indigo-*` | NO clean target → Tier-C |

Audit-file scaffold shape (51-PATTERNS.md §`.planning/phases/.../51-DESIGN-AUDIT.md`):

```
# Phase 51: Design-Token Compliance Gate — Audit

**Generated:** <date>
**Total Tier-A files:** <count>
**Total Tier-C files:** <count, populated by Plan 51-04>

## Tier-A Worklist (this plan)

| file | palette_literal_count | dominant_semantic | swap_summary |
|------|----------------------:|--------------------|--------------|

## Tier-C Disposition Table (populated by Plan 51-04)

| file | raw_hex_count | palette_literal_count | proposed_token_map | disposition | follow_up_phase |
|------|--------------:|----------------------:|--------------------|-------------|-----------------|

## Slug index (for `# 51-DESIGN-AUDIT.md#<slug>` back-references)
```

</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                                              | Description                                                                                                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| rg sweep histogram → Tier-A vs Tier-C classification  | the classification step is judgment-driven; misclassification yields either silent Tier-C drift (false Tier-A) or unnecessary deferral (false Tier-C) |
| Mechanical token swap → Bureau-light visual rendering | the swap routes through `@theme` → `var(--*)` → OKLCH; visual parity holds only if the cookbook mapping is semantically correct                       |
| Tier-A file commit → workspace lint zero-state        | each Tier-A file must pass eslint individually before counting toward DESIGN-04                                                                       |

## STRIDE Threat Register

| Threat ID | Category               | Component                                        | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                                                              |
| --------- | ---------------------- | ------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| T-51-11   | Tampering              | Mass mechanical swap across 80-120 files         | mitigate    | Per-file eslint verification gate before commit (`pnpm exec eslint <file>` exits 0 with zero D-05 warnings). Spot-check 5+ random Tier-A files visually on Bureau-light at 1280px (UI-SPEC §Visual Fidelity Guarantee item 1).                                                                                                                                                               |
| T-51-12   | Information Disclosure | DossierTypeGuide.tsx → semantic-colors.ts drift  | mitigate    | DossierTypeGuide is a token showcase — cross-check `dossierTypeColors` in `frontend/src/lib/semantic-colors.ts` BEFORE swap. If the showcase displays the literal palette colors (intentional reference), it belongs in Tier-B carve-out (escalate); if it displays Bureau token colors via the existing map, mechanical swap stands.                                                        |
| T-51-13   | Denial of Service      | DuplicateComparison.tsx diff-highlight colors    | mitigate    | This file has 39 hits with potentially context-dependent diff highlights (added/removed/changed). Pre-classify by reading the file: if highlight semantics map cleanly to `bg-success/10` (added) + `bg-danger/10` (removed) + `bg-warning/10` (changed), it's Tier-A. If diff colors are intentional Tailwind palette references for git-diff visual parity, push to Tier-C with rationale. |
| T-51-14   | Elevation of Privilege | Karpathy §3 boundary drift                       | mitigate    | Per-file `git diff --stat` review: line delta should equal palette literal count ±2. Larger deltas indicate adjacent-code refactoring crept in. Reject the commit and isolate the swap.                                                                                                                                                                                                      |
| T-51-15   | Repudiation            | Workspace name drift on `pnpm --filter ... test` | mitigate    | STATE.md flags workspace name as `intake-frontend`, NOT `frontend` (Phase 39 Rule-3 deviation). Verify via `cat package.json                                                                                                                                                                                                                                                                 | jq '.workspaces'`or`grep '"name":' frontend/package.json` before running tests. |

All threats scored low or mitigated.
</threat_model>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Run sweep histogram and produce frozen Tier-A worklist in 51-DESIGN-AUDIT.md scaffold</name>
  <files>.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md</files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-RESEARCH.md §"Implementation Approach §2. Tier-A worklist sizing" (the verbatim sweep command + classification heuristic)
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"Tier-A mechanical-swap files" anchor table + §"`.planning/phases/.../51-DESIGN-AUDIT.md` (create)" pattern assignment
    - frontend/src/lib/semantic-colors.ts (full file — 442 lines — to cross-check DossierTypeGuide.tsx + WorkItemsSection.tsx mappings before classification)
  </read_first>
  <action>
    Step 1a — Run the sweep histogram verbatim from RESEARCH §2:
      PALETTE='(?:[a-z-]+:)*(text|bg|border|ring|fill|stroke|from|to|via)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\d{2,3}\b'
      rg -c "$PALETTE" --type-add 'tsxts:*.{ts,tsx}' -ttsxts frontend/src/ 2>/dev/null \
        | grep -vE '/components/ui/|/signature-visuals/flags/|/analytics/.*Chart\.tsx|AnalyticsPreviewOverlay\.tsx|ChartWidget\.tsx|SLAComplianceChart\.tsx|InfluenceMetricsPanel\.tsx|InfluenceReport\.tsx|RelationshipGraph\.tsx|MiniRelationshipGraph\.tsx|ReportPreview\.tsx|semantic-colors\.ts|directions\.ts|tests/|__tests__|/index\.css|/modern-nav-tokens\.css|analytics/sample-data\.ts|position-editor/PositionEditor|geographic-visualization/WorldMapVisualization' \
        | sort -t: -k2 -rn \
        > /tmp/51-palette-histogram.txt

    Also run the raw-hex histogram:
      rg -c '#[0-9a-fA-F]{3,8}\b' --type-add 'tsxts:*.{ts,tsx}' -ttsxts frontend/src/ 2>/dev/null \
        | grep -vE '/components/ui/|/signature-visuals/flags/|/analytics/|/types/.*\.types\.ts|/lib/semantic-colors\.ts|directions\.ts|/dashboard-widgets/|/sla-monitoring/|/stakeholder-influence/|/relationships/RelationshipGraph|MiniRelationshipGraph|ReportPreview|geographic-visualization/WorldMapVisualization' \
        > /tmp/51-hex-histogram.txt

    Step 1b — Classify each file per the RESEARCH §2 heuristic:
      - ≤5 hits AND status/badge/alert semantics → Tier-A
      - 6-20 hits AND ≤3 semantic categories → Tier-A
      - >5 distinct color families OR >20 hits with mixed semantics OR no clean cookbook mapping → Tier-C

    For ambiguous files (DuplicateComparison.tsx at 39 hits, DossierTypeGuide.tsx at 26), spend 5-10 minutes reading each to classify. Default behavior: when in doubt, Tier-C (Plan 51-04 owns those rows).

    Step 1c — Create `.planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md` with the scaffold shape from PATTERNS.md. Sections:
      - Front matter: `# Phase 51: Design-Token Compliance Gate — Audit`, `**Generated:** <date>`, `**Total Tier-A files:** <count>`, `**Total Tier-C files:** populated by Plan 51-04`.
      - `## Tier-A Worklist` table with columns `file | palette_literal_count | dominant_semantic | swap_summary`. ENUMERATE every Tier-A file with the post-classification line counts. Add a `## Histogram source` section pasting the relevant `/tmp/51-palette-histogram.txt` + `/tmp/51-hex-histogram.txt` outputs (truncated to Tier-A relevant rows) so downstream auditors can re-derive the classification.
      - `## Tier-C Disposition Table` empty placeholder with the columns from RESEARCH §"Verified Pattern: 51-DESIGN-AUDIT.md row shape": `file | raw_hex_count | palette_literal_count | proposed_token_map | disposition | follow_up_phase`. Document that Plan 51-04 Task 1 populates this.
      - `## Slug index` empty placeholder. Plan 51-04 populates.

    Step 1d — Freeze the Tier-A worklist. From this point in the plan execution, the file set is locked. Any new violation surfaced by a re-sweep (e.g., a rebase landing) is added to a DEVIATION row in 51-03-SUMMARY.md, not to this audit file in-flight.

    DO NOT swap any source files in this task. Only the audit-scaffold file is created.

  </action>
  <verify>
    <automated>test -f .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md &amp;&amp; grep -q "Tier-A Worklist" .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md &amp;&amp; grep -q "Tier-C Disposition Table" .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md &amp;&amp; awk '/Tier-A Worklist/,/Tier-C Disposition Table/' .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md | grep -cE '^\|.*\|.*\|.*\|' | awk '{ if ($1 > 30) exit 0; else exit 1 }'</automated>
  </verify>
  <done>
    `51-DESIGN-AUDIT.md` exists with both the Tier-A Worklist and Tier-C Disposition Table sections.
    Tier-A Worklist contains at least 30 enumerated file rows (the expected 80-120-file range; final count depends on the live histogram and classification — anything >30 is acceptable, anything below suggests under-classification).
    The Tier-C Disposition Table is an empty placeholder with the header row only (Plan 51-04 Task 1 populates rows).
    `/tmp/51-palette-histogram.txt` and `/tmp/51-hex-histogram.txt` exist; their contents are referenced or pasted into the audit doc.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Mechanical token-swap pass across all Tier-A files</name>
  <files>~80-120 files enumerated in 51-DESIGN-AUDIT.md §Tier-A Worklist (post-Task 1 frozen list)</files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md §Tier-A Worklist (the frozen file enumeration from Task 1)
    - .planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md §"Token-replacement contract — Tailwind palette literal → token-mapped utility" (the verbatim cookbook table)
    - .planning/phases/51-design-token-compliance-gate/51-PATTERNS.md §"Tier-A mechanical-swap files (~80-120 files)" — verbatim cookbook + surgical-change boundary
    - .planning/phases/51-design-token-compliance-gate/51-RESEARCH.md §"5. Token-mapping cookbook"
    - frontend/src/index.css (full file — for token-utility name verification before swap)
    - frontend/src/lib/semantic-colors.ts (full file — D-11 canonical migration anchor; check `dossierTypeColors`, `statusColors`, `priorityColors` before swapping any dossier-type or status chip in Tier-A files)
    - For each individual Tier-A file: read the full file before swapping. Do NOT swap blind.
  </read_first>
  <action>
    Process the Tier-A file list in batches of 5-10 files per commit. For each file:

    Step 2a — Read the file fully (no `head`/`tail` shortcuts).

    Step 2b — Run `pnpm exec eslint -c eslint.config.mjs <file> 2>&amp;1 | grep -E "^\s*[0-9]+:[0-9]+"` to enumerate every D-05 warning's line:col with the offending utility.

    Step 2c — For each surfaced warning, apply the cookbook mapping from 51-UI-SPEC.md §Token-replacement contract:
      - `text-red-*`, `text-rose-*` → `text-danger`
      - `bg-red-*` → `bg-danger/10` (status bg) or `bg-danger` (solid)
      - `border-red-*` → `border-danger/30` (subtle) or `border-danger` (solid)
      - `text-amber-*`, `text-yellow-*` → `text-warning`
      - `bg-amber-*`, `bg-yellow-*` → `bg-warning/10`
      - `text-green-*`, `text-emerald-*` → `text-success`
      - `bg-green-*`, `bg-emerald-*` → `bg-success/10`
      - `text-blue-*` for LINKS (anchor `<a>` or navigation) → `text-accent`
      - `text-blue-*` for INFO badges → `text-info`
      - `bg-blue-*` (info bg) → `bg-info/10`
      - `text-gray/slate/zinc/neutral/stone-*` (body text) → `text-muted-foreground` (legacy semantic) OR `text-ink-mute` (direct) OR `text-ink-faint` (lowest contrast). Default: `text-muted-foreground` because it's the most widely-used existing token in the codebase.
      - `bg-gray/slate/zinc/neutral/stone-*` (chrome) → `bg-muted` (default) OR `bg-line-soft` (inline separators)
      - `border-gray/slate/zinc/neutral/stone-*` → `border-line` (default) OR `border-input` (form inputs)
      - `focus:ring-blue-500` (or any `focus:ring-{palette}-{n}`) → `focus:ring-accent`. Variant prefix preserved automatically.
      - Variant chain (`dark:`, `hover:`, `md:`, `aria-*:`, compound chains) → preserve verbatim; only the trailing `<palette>-<n>` portion changes.
      - `text-purple/violet/fuchsia/pink/indigo-*` (data-viz) → NO clean target. STOP. Move file to Tier-C (escalate the classification).

    Step 2d — If a file's mappings hit the "no clean target" case anywhere, ABORT the swap for that file, remove it from the Tier-A list in 51-DESIGN-AUDIT.md, add it to a new `## Tier-C reclassifications` section with the reason, and continue with the next file. Do NOT invent new tokens.

    Step 2e — After swapping, run `pnpm exec eslint -c eslint.config.mjs <file>` and confirm 0 D-05 warnings. If non-zero, return to Step 2c.

    Step 2f — Verify the surgical-change posture: `git diff --stat <file>` should show line delta ≤ (palette literal count + 1 or 2 for re-flow). Larger deltas mean adjacent code was touched — revert and isolate.

    Karpathy §3 surgical-change boundary (applies to EVERY Tier-A file):
    - ONLY change className strings (and the tiptap-style `class:` strings inside object literals).
    - Do NOT reflow JSX, rename props, refactor component logic.
    - Do NOT add new imports, hooks, components.
    - Do NOT introduce new font-family or textAlign declarations (RTL rule).
    - Match existing style: single quotes (per Prettier config), no semicolon (per Prettier config), trailing commas.

    Commit cadence: 5-10 files per commit with message `refactor(51-03): tier-a token swap — <subdir or feature name>`. Each commit message lists the swapped files.

    DO NOT commit any file whose post-swap eslint output shows non-zero D-05 warnings.

  </action>
  <verify>
    <automated>pnpm exec eslint -c eslint.config.mjs $(awk -F'|' '/^\|.*\.(tsx?|ts)\s*\|/{gsub(/^[[:space:]]*|[[:space:]]*$/,"",$2); print "frontend/src/"$2}' .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md 2>/dev/null | grep -v Worklist | head -120) 2>&amp;1 | grep -cE "no-restricted-syntax" | grep -qx 0</automated>
  </verify>
  <done>
    Every file in the Tier-A worklist passes `pnpm exec eslint -c eslint.config.mjs <file>` with 0 D-05 warnings.
    `git diff --stat phase-51-base..HEAD frontend/src/` shows ONLY className-line edits across the Tier-A files — line delta per file ≤ (palette literal count + 2).
    No new files created under `frontend/src/` (no new components, no new hooks).
    No new imports added in any Tier-A file (verify via `git diff phase-51-base..HEAD -- frontend/src/ | grep -E '^\+import' | wc -l` returns 0 for the Plan 51-03 commit range, OR each new import is explicitly justified in a DEVIATION row).
    `51-DESIGN-AUDIT.md §Tier-A Worklist` is consistent with the actual swapped file set — any reclassifications recorded in §Tier-C reclassifications subsection.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Visual-parity spot-check + workspace lint + typecheck</name>
  <files>(none — verification + spot-check + 51-03-SUMMARY.md update)</files>
  <read_first>
    - .planning/phases/51-design-token-compliance-gate/51-UI-SPEC.md §"Visual Fidelity Guarantee"
    - .planning/phases/51-design-token-compliance-gate/51-VALIDATION.md §"Sampling Rate" + §"Per-Task Verification Map"
    - .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md §Tier-A Worklist (for the random-sample candidate list)
  </read_first>
  <action>
    Step 3a — Workspace lint zero-state verification:
      `pnpm lint` — must exit 0. The warning count should drop materially from the Plan 51-01 baseline (each Tier-A swap removes 1-39 warnings depending on the file's literal count).

    Step 3b — Per-Tier-A-file eslint verification (aggregate):
      `for f in $(awk -F'|' '/^\|.*\.(tsx?|ts)\s*\|/{gsub(/^[[:space:]]*|[[:space:]]*$/,"",$2); print $2}' .planning/phases/51-design-token-compliance-gate/51-DESIGN-AUDIT.md); do pnpm exec eslint -c eslint.config.mjs "$f" 2>&amp;1 | grep -cE "no-restricted-syntax" | head -1; done | sort -u`
      The output set must contain ONLY `0` (every Tier-A file is D-05-clean).

    Step 3c — `pnpm typecheck` — must exit 0. No TS regressions introduced by mass mechanical swaps. TS does not type-check className strings, but the swap may accidentally touch an adjacent type-related line — `pnpm typecheck` catches it.

    Step 3d — Visual-parity spot-check on 5 random Tier-A files (UI-SPEC §Visual Fidelity Guarantee). Sample selection:
      - Pick 1 from `routes/_protected/admin/` (status panel).
      - Pick 1 from `components/forms/` (FormErrorDisplay or FormCompletionProgress).
      - Pick 1 from `pages/` (e.g., MyAssignments).
      - Pick 1 from `components/dossier/` (DossierTypeGuide or WorkItemsSection).
      - Pick 1 random from the remaining 50+ enumerated Tier-A files.
    For each: render the page or component in the dev environment (or via Storybook if available, or via existing Playwright spec), screenshot at Bureau-light 1280px, compare against a pre-swap baseline (capture from a `git stash`'d revert if needed). Record findings in `51-03-SUMMARY.md`:
      - Status colors (danger/warning/success/info) keep their hue family.
      - Body text (`text-ink*`) keeps its grayscale ramp.
      - Chrome surfaces (`bg-bg`, `bg-surface`, `bg-muted`) keep their neutral tone.
      - MINOR diffs (blue 217° → Bureau accent 32° for links) are intentional per UI-SPEC.

    Step 3e — RTL Tajawal spot-check on 2 of the 5 sampled files: render with `<html dir="rtl" lang="ar">`. Verify no new `textAlign: 'right'` or font-family declarations appeared. Tajawal cascade unchanged.

    DO NOT proceed to Plan 51-04 if any of 3a/3b/3c/3d/3e fails. Capture findings in 51-03-SUMMARY.md and return to Task 2 for affected files.

  </action>
  <verify>
    <automated>pnpm lint 2>&amp;1 | grep -qE "(no problems|0 errors)" &amp;&amp; pnpm typecheck 2>&amp;1 | grep -qiE "(success|exit code 0|^$)" || (pnpm lint 2>&amp;1 | tail -3 | grep -q "0 errors" &amp;&amp; pnpm typecheck 2>&amp;1 | tail -3 | grep -qiE "(0 errors|✓|success)")</automated>
  </verify>
  <done>
    `pnpm lint` exits 0 workspace-wide with a measurable warning-count drop (recorded in 51-03-SUMMARY.md as `<plan-01-warning-count>` → `<post-51-03-warning-count>`).
    `pnpm typecheck` exits 0; no new TS errors.
    Every Tier-A file's per-file eslint run reports 0 D-05 warnings.
    5 visual-parity spot-checks pass per UI-SPEC §Visual Fidelity Guarantee (Bureau-light, RTL Tajawal, dark-mode passthrough on at least 1 sample).
    51-03-SUMMARY.md records the spot-check evidence (screenshots / observations) + the Tier-A file count + the warning-count delta.
  </done>
</task>

</tasks>

<verification>
After all three tasks complete:

- `51-DESIGN-AUDIT.md` exists with a populated Tier-A Worklist (≥30 files) and an empty Tier-C placeholder table ready for Plan 51-04.
- Every Tier-A file is D-05-clean (`pnpm exec eslint -c eslint.config.mjs <file>` reports 0 warnings).
- `pnpm lint` exits 0 workspace-wide; warning count materially reduced from Plan 51-01 baseline.
- `pnpm typecheck` exits 0.
- Visual-parity verified on 5 random Tier-A files at Bureau-light 1280px + 2 RTL Tajawal samples.
- Karpathy §3 surgical-change posture: `git diff` shows ONLY className edits; no new files, no new imports outside justified DEVIATION rows.
- No file overlap with Plan 51-02's two named anchors.
- No file overlap with Plan 51-01's Tier-B carve-out.
  </verification>

<success_criteria>

- DESIGN-03 bulk of the ROADMAP success criterion 3 ("plus any others surfaced by sweep") landed.
- Plan 51-04 receives a Tier-C-ready audit doc to populate.
- The phase is now ~80-95% of the way to `pnpm lint` exits 0 with the rule at `error` severity — only Tier-C disables and the severity flip remain for Plan 51-04.
  </success_criteria>

<output>
After completion, create `.planning/phases/51-design-token-compliance-gate/51-03-SUMMARY.md` capturing:
- Final Tier-A file count (post-classification) + commit SHAs (range of refactor commits).
- Pre/post `pnpm lint` warning count delta.
- `pnpm typecheck` exit code.
- 5 visual-parity spot-check observations.
- Any Tier-C reclassifications (files moved from Tier-A → Tier-C during sweep).
- Workspace name confirmation (`intake-frontend` vs `frontend` per STATE.md Phase 39 note).
- `51-DESIGN-AUDIT.md` Tier-A Worklist count vs Plan-01 sweep-delta estimate (sanity check on classification fidelity).
</output>
