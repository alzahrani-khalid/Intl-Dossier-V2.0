---

phase: 58-tier-c-design-token-suppression-full-clear
plan: 03
subsystem: design-system
wave: 3
surface: drawers-dialogs
tags: [tier-c, design-tokens, drawers-dialogs, suppression-clear]

requires:

- phase: 58 wave 1 (forms)
  provides: Token vocabulary precedent + 3 deviation patterns (overlay scrim, opacity-step palette, lucide-for-emoji)
- phase: 58 wave 2 (tables)
  provides: Selected-row + row-hover + status-banner patterns; semantic-context discrimination (D-58-02-EXTRA-03); latent same-class clearance precedent (D-58-02-EXTRA-02); purple → accent (Wave-2 WGMemberSuggestions)
- phase: 58 wave 0 (manifest)
  provides: File-to-wave assignment confirming the 18 drawers-dialogs files

provides:

- Token-bound drawers-dialogs surface across 18 files / 138 cleared suppressions
- 3-way diff palette in ConflictResolutionDialog.tsx — your-changes (added/local) → success, server-state (incoming) → info, manual-merge → accent; warning banner uses lucide AlertTriangle instead of inline SVG
- 7-deliverable-type palette in AddDeliverableDialog.tsx using primary/accent/success/info/warning/info-step/muted (indigo→primary, purple→accent, cyan→info/20 opacity step)
- 6-color user-selectable annotation palette in StakeholderAnnotationDialog.tsx + TimelineAnnotationDialog.tsx mapped onto 5 status tokens + accent + warning/80 opacity step for orange
- 9-status badge palette in BulkActionPreviewDialog.tsx using canonical statusColors token vocabulary; emerald→success/20 sibling opacity step; slate/neutral/gray collapsed onto bg-muted
- 4-tier priority palette in BulkActionPreviewDialog.tsx using opacity-step on warning (high uses warning/80, medium uses warning)
- Entity-type badge in EntitySearchDialog.tsx imports and honors the canonical `dossierTypeColors` map from `frontend/src/lib/semantic-colors.ts` per plan; falls back to country entry for non-dossier types
- 3-tier AI similarity-score palette in EntitySearchDialog.tsx — high→success, medium→warning, low→ink-mute (same vocabulary as Wave-2 TriagePanel confidence tiers)
- Drawer surface in CommitmentDetailDrawer.tsx — body banners use bg-success/10 + bg-warning/10 + border tokens; overdue indicator uses text-danger
- All status banners use `border border-{tone}/30 bg-{tone}/10 text-{tone}` — no dark: chains

affects: [58-04, 58-05, 58-06]

tech-stack:
added: - 'lucide-react: AlertTriangle imported in EntitySearchDialog.tsx (replaces inline warning SVG)'
patterns: - '6-on-5-token user-selectable palette: when a user-picker exposes 6 colors and only 5 status tokens exist (info/success/warning/danger/accent), apply Wave-1 D-58-01-02 opacity-step precedent — orange = warning/80 (sibling). Encoded in StakeholderAnnotationDialog and TimelineAnnotationDialog.' - '7-deliverable-type palette: when type-icon vocabulary exceeds the 5 status tokens (indigo/purple/green/blue/amber/cyan/gray for 7 types), map cyan to info/20 as opacity-step sibling of blue/info; collapse gray onto bg-muted; map indigo onto primary (selected-outline family) and purple onto accent.' - '9-status badge palette: align canonical statusColors map at /10 opacity for non-active states; emerald (approved) → success/20 sibling; slate/gray/neutral collapse onto bg-muted (3 neutrals → 1 token).' - 'Semantic-context discrimination cascade: blue/purple BP collisions are resolved per occurrence using the D-58-02-EXTRA-03 rule — link/CTA → text-accent, informational icon → text-info, selected outline → text-primary. Each per-file decision documented inline as D-58-03-NN.' - 'Import-don’t-redefine pattern: when a canonical color-mapping table exists (semantic-colors.ts dossierTypeColors), the dialog imports it rather than redefining inline. Codified in EntitySearchDialog.tsx getEntityTypeBadgeClass.'

key-files:
created: - .planning/phases/58-tier-c-design-token-suppression-full-clear/58-03-SUMMARY.md
modified: - frontend/src/components/bulk-actions/BulkActionConfirmDialog.tsx - frontend/src/components/bulk-actions/BulkActionPreviewDialog.tsx - frontend/src/components/collaboration/ConflictResolutionDialog.tsx - frontend/src/components/commitments/CommitmentDetailDrawer.tsx - frontend/src/components/commitments/deliverables/AddDeliverableDialog.tsx - frontend/src/components/compliance/ComplianceSignoffDialog.tsx - frontend/src/components/delegation/CreateDelegationDialog.tsx - frontend/src/components/duplicate-detection/MergeDialog.tsx - frontend/src/components/entity-links/EntitySearchDialog.tsx - frontend/src/components/entity-templates/QuickEntryDialog.tsx - frontend/src/components/forums/ForumDetailsDialog.tsx - frontend/src/components/input-dialog/InputDialog.tsx - frontend/src/components/milestone-planning/ConvertMilestoneDialog.tsx - frontend/src/components/scheduled-reports/ExecutionHistoryDialog.tsx - frontend/src/components/stakeholder-timeline/StakeholderAnnotationDialog.tsx - frontend/src/components/timeline/TimelineAnnotationDialog.tsx - frontend/src/components/waiting-queue/EscalationDialog.tsx - frontend/src/components/workflow-automation/WorkflowTestDialog.tsx

key-decisions:

- 'Entity-type badge map import (D-58-03-11): EntitySearchDialog imports `dossierTypeColors` from `frontend/src/lib/semantic-colors.ts` and the local `getEntityTypeBadgeClass` helper falls back to the country entry for non-dossier types (mou, position, assignment, commitment, intelligence_signal, dossier). Honors the plan directive "do not redefine the map inline" and keeps the canonical map as the single source of pixel truth.'
- '3-way conflict diff palette (D-58-03-07 / D-58-03-08): ConflictResolutionDialog now uses bg-success/10 + text-success for your-changes (added/local), bg-info/10 + text-info for server-state (incoming), bg-accent/10 + text-accent for manual-merge. Strategy buttons inherit the same vocabulary via STRATEGY_COLORS.'
- '7-deliverable-type palette (D-58-03-06): AddDeliverableDialog maps indigo→primary/10, purple→accent/10, cyan→info/20 (opacity-step sibling of blue/info), gray→muted. Preserves visual distinction across 7 types using only 5 status tokens + primary + accent + muted.'
- '6-color user-selectable annotation palette (D-58-03-05): StakeholderAnnotationDialog + TimelineAnnotationDialog share the same color picker mapping — blue→info, green→success, yellow→warning, red→danger, purple→accent, orange→warning/80 (opacity-step sibling). Wave-1 D-58-01-02 precedent.'
- '9-status badge palette (D-58-03-09): BulkActionPreviewDialog aligns with canonical statusColors at /10 opacity — emerald collapses onto success/20 sibling; slate/gray/neutral all collapse onto bg-muted text-ink-mute. The semantic loss (3 distinct grays → 1 muted) is acceptable because the badge label carries the precise status string.'
- '4-tier priority palette (D-58-03-10): BulkActionPreviewDialog uses border-only Badge outline — urgent→danger, high→warning/80 (opacity step), medium→warning, low→success. Wave-2 RiskList 4-on-3-token precedent.'
- 'Selected-row pattern carried from Wave-2: EntitySearchDialog result rows use bg-primary/10 + border-primary for selected state; bg-muted hover for unselected. BulkActionPreviewDialog row palette aligns with the same vocabulary.'
- 'Inverse-blue informational icon (D-58-03-01 / D-58-03-03 / D-58-03-12): ExecutionHistoryDialog running-clock blue-500 → text-info (informational, not link); ConvertMilestoneDialog calendar event-type icon blue-600 → text-info; EntitySearchDialog empty-state Search icon container bg-blue-100 → bg-info/10 + text-info. Consistent application of Wave-2 D-58-02-EXTRA-03 semantic-context discrimination.'
- 'Status-badge mapping in ForumDetailsDialog (D-58-03-02): scheduled (blue-100 text-blue-800) → bg-info/10 text-info; ongoing (green) → bg-success/10 text-success; completed/cancelled-default (gray) → bg-muted text-ink-mute; cancelled (red) → bg-danger/10 text-danger. Maps the 5-status forum-lifecycle palette onto canonical tokens.'
- 'Status-banner pattern: every warning / info / danger / success info-box uses `bg-{tone}/10 + border border-{tone}/30 + text-{tone}` — no dark: chains. Tokens handle theme switching at the CSS-custom-property level.'

patterns-established:

- 'Multi-emoji-free dialog file pattern: when an inline SVG warning icon exists in a dialog (EntitySearchDialog inline path), replace with lucide-react AlertTriangle to match Wave-1 DuplicateComparison + Wave-2 TriagePanel precedent. Bundle savings + accessibility + consistency.'
- 'Per-file inline deviation markers: D-58-03-NN comments at decision sites create a forward link from code to plan. Used 14 times across BP/large-palette files in Wave 3 (D-58-03-01 through D-58-03-14).'
- 'Atomic per-file commit cadence: 18 commits in ascending-density order (1 → 36 annotations) gives reviewers a per-file diff context — the Wave-3 commit log reads as a file-by-file walkthrough.'
- 'Canonical-map import-not-redefine: when the design system already exposes a per-type color mapping (semantic-colors.ts), components MUST import it rather than redefine — keeps the canonical map as the single source of pixel truth and prevents drift. Wave-3 codifies this for entity-type badges; future waves should follow.'

verification:
commands_run: - 'pnpm lint → turbo lint cache hit, 2 packages, 0 errors / 0 warnings under --max-warnings 0 (turbo run lint)' - 'pnpm typecheck → turbo type-check, 4 tasks successful, tsc --noEmit exit 0' - 'pnpm vitest run (frontend/) → 158 test files passed (4 skipped), 1230 tests passed (25 todo), 17.97s — zero regressions vs. origin/main baseline (Wave-3 forked from origin/main per RESEARCH section 4, NOT from phase-58/wave-2-tables; the Wave-2 1241-test count includes Wave-1 + Wave-2 tests not yet in main)' - 'Targeted grep across the 18 Wave-3 files → 0 matches for `gsd-design-token-tier-c-allow` and `Phase 51 Tier-C`'
evidence: - '0 grep hits for `Phase 51 Tier-C` across the 18 Wave-3 source files (verified targeted grep per verification_commands in PLAN frontmatter)' - '0 grep hits for raw Tailwind palette literals `(text|bg|border|fill)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime|white|black)-[0-9]{2,3}` across the 18 Wave-3 files' - '0 grep hits for `dark:` variants in the 8 DK files (CommitmentDetailDrawer, ExecutionHistoryDialog, ConflictResolutionDialog, AddDeliverableDialog, BulkActionConfirmDialog, BulkActionPreviewDialog, ConvertMilestoneDialog, EntitySearchDialog) — token-based @theme resolves theme switching' - 'EntitySearchDialog.tsx imports `dossierTypeColors` from semantic-colors.ts (PLAN acceptance criterion: "In EntitySearchDialog.tsx, `import .* from .*semantic-colors` resolves to the canonical map") — verified via `grep -n "from '@/lib/semantic-colors'" frontend/src/components/entity-links/EntitySearchDialog.tsx` returns line 28' - 'All 18 atomic commits land between dea6bf73 and 403ebb00 on branch phase-58/wave-3-drawers-dialogs (forked from origin/main per RESEARCH section 4)'

deviations:

- id: 'D-58-03-01'
  summary: 'ExecutionHistoryDialog running-state Clock icon: blue-500 → text-info (informational icon for running state; not a link/CTA)'
  status: 'planned + executed'
  follow_up: 'None. Inline comment cross-references this plan at ExecutionHistoryDialog.tsx:48.'
- id: 'D-58-03-02'
  summary: 'ForumDetailsDialog scheduled-status badge: blue-100/800 → bg-info/10 text-info (5-status forum lifecycle)'
  status: 'planned + executed'
  follow_up: 'None. Inline comment cross-references this plan at ForumDetailsDialog.tsx:228.'
- id: 'D-58-03-03'
  summary: 'ConvertMilestoneDialog calendar event-type icon: blue-600 → text-info (informational icon, not link/CTA)'
  status: 'planned + executed'
  follow_up: 'None. Inline comment cross-references this plan at ConvertMilestoneDialog.tsx:37.'
- id: 'D-58-03-04'
  summary: 'ConvertMilestoneDialog decision event-type icon: purple-600 → text-accent (Wave-2 WGMemberSuggestions precedent)'
  status: 'planned + executed'
  follow_up: 'None. Inline comment cross-references this plan at ConvertMilestoneDialog.tsx:53.'
- id: 'D-58-03-05'
  summary: '6-color user-selectable annotation palette in StakeholderAnnotationDialog + TimelineAnnotationDialog: blue→info, green→success, yellow→warning, red→danger, purple→accent, orange→warning/80 (opacity-step sibling). Wave-1 D-58-01-02 precedent.'
  status: 'planned + executed (twice — same mapping applied to both files for consistency)'
  follow_up: 'None. Inline comments cross-reference this plan at StakeholderAnnotationDialog.tsx:117 and TimelineAnnotationDialog.tsx:65.'
- id: 'D-58-03-06'
  summary: '7-deliverable-type palette in AddDeliverableDialog: indigo→primary/10, purple→accent/10, cyan→info/20 (opacity sibling of blue/info), gray→muted. Maps 7 types onto 5 status tokens + primary + accent + muted.'
  status: 'planned + executed'
  follow_up: 'None.'
- id: 'D-58-03-07'
  summary: 'ConflictResolutionDialog STRATEGY_COLORS palette: use_server (blue) → info, keep_local (green) → success, manual_merge (purple) → accent (Wave-2 precedent).'
  status: 'planned + executed'
  follow_up: 'None.'
- id: 'D-58-03-08'
  summary: 'ConflictResolutionDialog 3-way field-diff palette: your-changes → bg-success/10 + text-success + border-success/30; server-state → bg-info/10 + text-info + border-info/30.'
  status: 'planned + executed'
  follow_up: 'None.'
- id: 'D-58-03-09'
  summary: 'BulkActionPreviewDialog 9-status badge palette: emerald (approved) → success/20 sibling opacity step; slate/gray/neutral all collapse onto bg-muted text-ink-mute. Semantic-loss is acceptable because the badge label carries the precise status string.'
  status: 'planned + executed'
  follow_up: 'None.'
- id: 'D-58-03-10'
  summary: 'BulkActionPreviewDialog 4-tier priority palette: urgent→danger, high→warning/80 (opacity step), medium→warning, low→success. Wave-2 RiskList 4-on-3-token precedent.'
  status: 'planned + executed'
  follow_up: 'None.'
- id: 'D-58-03-11'
  summary: 'EntitySearchDialog entity-type badge: imports canonical `dossierTypeColors` from `frontend/src/lib/semantic-colors.ts` instead of redefining the map inline. Non-dossier types (mou, position, assignment, commitment, intelligence_signal, dossier) fall back to the country entry — consistent with getDossierTypeBadgeClass fallback semantics.'
  status: 'planned + executed (PLAN explicit directive)'
  follow_up: 'None. Pattern: "Import-don’t-redefine" — when a canonical color-mapping table exists, components MUST import it.'
- id: 'D-58-03-12'
  summary: 'EntitySearchDialog empty-state Search icon container: bg-blue-100 → bg-info/10 + text-info (informational empty-state, not link/CTA).'
  status: 'planned + executed'
  follow_up: 'None.'
- id: 'D-58-03-13'
  summary: 'EntitySearchDialog primary-selection radio: selected state uses success tokens (bg-success/10 + text-success + border-success/30); unselected state uses muted/ink-mute neutrals.'
  status: 'planned + executed'
  follow_up: 'None.'
- id: 'D-58-03-14'
  summary: 'EntitySearchDialog AI similarity-score palette: high (>0.7) → text-success, medium (>0.4) → text-warning, low → text-ink-mute. Matches Wave-2 TriagePanel D-58-02-01 confidence-tier precedent.'
  status: 'planned + executed'
  follow_up: 'None.'
- id: 'D-58-03-EXTRA-01'
  summary: 'EscalationDialog ArrowUp escalation indicator: orange-600 → text-warning (Wave-2 D-58-02-EXTRA-03 semantic-context precedent — orange-600 in non-confidence semantics maps to warning, not danger).'
  status: 'discovered during execution, applied per Wave-2 precedent, documented inline as D-58-03-EXTRA'
  follow_up: 'None.'
- id: 'D-58-03-EXTRA-02'
  summary: 'EntitySearchDialog replacePrimaryWarning footer banner: replaced inline `<svg>` warning icon (with hand-written `path d="..."` glyph) with `<AlertTriangle />` from lucide-react — matches Wave-1 DuplicateComparison and Wave-2 TriagePanel precedent of using lucide for status iconography. Bundle savings + accessibility + consistency. AlertTriangle was added to the existing lucide imports (no new dependency).'
  status: 'discovered during execution, applied per Wave-1/Wave-2 lucide-for-emoji precedent, documented inline as D-58-03-EXTRA'
  follow_up: 'None. Pattern: "lucide-over-inline-SVG" for status iconography in dialogs. Future waves should sweep for additional inline SVGs that match this pattern.'

planning-observations:

- id: 'OBS-58-03-01'
  finding: 'Wave 3 has no overlay scrim — verified via grep against the 18 file paths per RESEARCH section 4. None of the 18 files use `bg-black/N` inline; all dialog backdrops come from components/ui/\* Tier-B-carved primitives (Dialog, AlertDialog, AdaptiveDialog, AdaptiveDrawer) or HeroUI Modal. D-58-01-01 (DuplicateComparison scrim) is the only known overlay-scrim deviation in Phase 58; no new scrim deviations introduced in Wave 3.'
  impact: 'OQ-58-RES-01 (overlay-scrim token follow-up) is empirically retired for Wave 3 — the question does not surface.'
  fix_for_future_waves: 'Future waves should verify the no-scrim invariant via the same targeted grep before assuming additional scrim work is needed.'
- id: 'OBS-58-03-02'
  finding: 'Baseline-test-count divergence: Wave-3 forked from origin/main (per RESEARCH section 4 + explicit branching_directive), which currently has 1230 passing tests at HEAD. The Wave-2 SUMMARY referenced 1241 passing tests on its own branch — that count includes Wave-1 forms tests (FormInput.test.tsx assertions against semantic tokens) that have not yet landed on origin/main. The plan acceptance criterion "1,241+ passing" was authored assuming Wave-3 would stack on Wave-2; under the actual fork-from-main branching it should be read as "zero regressions" relative to the Wave-3 baseline (1230 → 1230, satisfied).'
  impact: 'Cosmetic only — zero regressions are confirmed. The 11-test gap closes naturally when Wave-1 + Wave-2 + Wave-3 PRs all merge into main.'
  fix_for_future_waves: 'Future wave PLANs should phrase the test-count criterion in branch-relative terms ("zero regressions vs. branch-parent baseline") rather than absolute counts that hard-code one stacking assumption.'

requirements-completed: [TOKEN-01, TOKEN-02]

commits:
execution: - 'dea6bf73 — CreateDelegationDialog.tsx (1)' - '09faa9d2 — MergeDialog.tsx (1)' - '346e3d81 — QuickEntryDialog.tsx (1)' - '51280baa — EscalationDialog.tsx (1)' - 'afe2141c — ComplianceSignoffDialog.tsx (2)' - '83d861f0 — ExecutionHistoryDialog.tsx (4)' - 'f5867bc3 — WorkflowTestDialog.tsx (4)' - 'a2d3a57d — CommitmentDetailDrawer.tsx (5)' - '0d959c1e — ForumDetailsDialog.tsx (5)' - '11e37247 — InputDialog.tsx (6)' - '87380d0f — ConvertMilestoneDialog.tsx (6)' - 'be549007 — StakeholderAnnotationDialog.tsx (6)' - '4057f844 — AddDeliverableDialog.tsx (7)' - 'e19f2d8b — BulkActionConfirmDialog.tsx (7)' - '57d1794d — TimelineAnnotationDialog.tsx (7)' - '930a16ae — ConflictResolutionDialog.tsx (16)' - '208f2025 — BulkActionPreviewDialog.tsx (23)' - '403ebb00 — EntitySearchDialog.tsx (36)'
summary: 'TBD — this file'
total: 19 (18 file commits + 1 SUMMARY)

duration: ~50min executor wall-clock (sequential mode on main working tree, pre-commit hooks ran per commit; full lint + typecheck + frontend vitest run at the wave gate)
completed: 2026-05-20

## Self-Check: PASSED

All 18 commit hashes verified present in `git log --oneline --all`:
dea6bf73, 09faa9d2, 346e3d81, 51280baa, afe2141c, 83d861f0, f5867bc3, a2d3a57d,
0d959c1e, 11e37247, 87380d0f, be549007, 4057f844, e19f2d8b, 57d1794d, 930a16ae,
208f2025, 403ebb00. SUMMARY file exists at expected path.
