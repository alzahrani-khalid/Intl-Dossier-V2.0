---

phase: 58-tier-c-design-token-suppression-full-clear
plan: 02
subsystem: design-system
wave: 2
surface: tables
tags: [tier-c, design-tokens, tables, suppression-clear]

requires:

- phase: 58 wave 1 (forms)
  provides: Token vocabulary precedent + 3 deviation patterns (overlay scrim, opacity-step palette, lucide-for-emoji)
- phase: 58 wave 0 (manifest)
  provides: File-to-wave assignment confirming the 15 tables-surface files

provides:

- Token-bound tables surface across 15 files / 137 cleared suppressions
- Three-tier confidence palette in TriagePanel.tsx (success/warning/danger/ink-faint) — preserves the high/medium/low/unknown distinction the original orange-vs-yellow encoded
- 4-tier severity palette in RiskList.tsx using /80 opacity step on danger for high vs critical (same Wave-1 opacity-step precedent)
- 5-way diff-type palette in EntityComparisonTable.tsx — one-to-one mapping onto success/danger/info/warning/accent
- Inverse-tone toast pattern in UndoToast.tsx using bg-foreground / text-background tokens (no literal grays)
- AlertTriangle + Bot lucide-react replacements for ⚠️ and 🤖 in TriagePanel.tsx

affects: [58-03, 58-04, 58-05, 58-06]

tech-stack:
added: - 'lucide-react: AlertTriangle, Bot imported in TriagePanel.tsx (replaces ⚠️ and 🤖)'
patterns: - '4-tier-on-3-token severity palette: when severity has 4 stops (low/medium/high/critical) and only 3 status tokens (success/warning/danger) exist, apply the Wave-1 opacity-step precedent — high = danger/80, critical = danger. Encoded in RiskList.tsx.' - 'Inverse-tone toast: bg-foreground / text-background tokens swap correctly across themes — cleaner than dark: chains' - 'Multi-emoji replacement in a single file: when a file has 2+ emoji, batch the lucide-react import and call out each replacement in the commit body (TriagePanel.tsx: ⚠️→AlertTriangle, 🤖→Bot)' - 'Severity-context-discrimination: orange-600 means low-confidence (→danger) in TriagePanel but max-reached (→warning) in SelectableDataTable. The token mapping is semantic-context, not literal-color. Executor honored this — D-58-02-01 was correctly scoped to TriagePanel only.'

key-files:
created: - .planning/phases/58-tier-c-design-token-suppression-full-clear/58-02-PLAN.md - .planning/phases/58-tier-c-design-token-suppression-full-clear/58-02-SUMMARY.md
modified: - frontend/src/components/assignments/EscalationDashboard.tsx - frontend/src/components/audit-logs/AuditLogFilters.tsx - frontend/src/components/audit-logs/AuditLogStatistics.tsx - frontend/src/components/audit-logs/AuditLogTable.tsx - frontend/src/components/bulk-actions/BulkActionProgressIndicator.tsx - frontend/src/components/bulk-actions/BulkActionsToolbar.tsx - frontend/src/components/bulk-actions/SelectableDataTable.tsx - frontend/src/components/bulk-actions/UndoToast.tsx - frontend/src/components/elected-officials/ElectedOfficialListTable.tsx - frontend/src/components/entity-comparison/EntityComparisonSelector.tsx - frontend/src/components/entity-comparison/EntityComparisonTable.tsx - frontend/src/components/risk-list/RiskList.tsx - frontend/src/components/triage-panel/TriagePanel.tsx - frontend/src/components/version-history-viewer/VersionHistoryViewer.tsx - frontend/src/components/working-groups/WGMemberSuggestions.tsx

key-decisions:

- 'Confidence tiers (D-58-02-01): low (<0.6) → text-danger, medium (0.6-0.8) → text-warning, high (0.8+) → text-success, unknown → text-ink-faint. Preserves three-tier visual distinction. Inline comment in TriagePanel.tsx#L104-L106 references this plan.'
- 'Emoji replacements (D-58-02-02 + D-58-02-EXTRA-01): ⚠️ → AlertTriangle, 🤖 → Bot, both as lucide-react named imports with aria-hidden=true. Executor proactively replaced 🤖 (not in original plan deviation list) per CLAUDE.md no-emoji rule — accepted as documented deviation.'
- 'RiskList 4-tier-on-3-token severity: high uses bg-danger/80, critical uses bg-danger. Same opacity-step precedent as Wave-1 NotificationPreviewTimeline. Border accents (border-s-_) migrated alongside the bg-_/text-\* swaps for full file cleanup.'
- 'Context-aware orange-600 mapping: TriagePanel low-confidence → text-danger (D-58-02-01), but SelectableDataTable + EntityComparisonSelector max-reached states → text-warning. The semantic context of each occurrence is what determines the token, not the literal color.'
- 'WGMemberSuggestions purple → accent: same Wave-1 precedent. No purple token in design system; accent is the closest semantic fit for person-type avatars.'
- 'EntityComparisonTable 5-way diff palette: same/different/added/removed/modified → success/danger/info/warning/accent. 5 tokens for 5 diff types — no collapse needed.'
- 'UndoToast inverse-tone: bg-foreground / text-background. Cleaner than dark: chains; tokens handle theme switching at the CSS-custom-property level.'

patterns-established:

- 'Atomic per-file commit cadence (1 commit per file) gives reviewers a per-file diff context — the Wave-2 commit log reads as a file-by-file walkthrough of the suppression clearance'
- 'Inline deviation references (e.g., `// D-58-02-01: confidence-tier mapping ...`) in source files create a forward link from code → plan, so future readers can find the rationale without scanning PRs'
- 'Executor proactivity within scope: when a file has additional same-class violations beyond the listed annotations (e.g., the 🤖 emoji in TriagePanel or the `border-s-{color}-N` lines in RiskList that did not lint-match the palette regex), the executor cleared them in-file rather than leaving latent violations for a future pass. This is within the file-scope rule.'

verification:
commands_run: - 'pnpm lint --max-warnings 0 → 0 errors, 0 warnings' - 'pnpm type-check (tsc --noEmit) → 0 diagnostics' - 'pnpm vitest run → 163 test files passed (4 skipped), 1241 tests passed (25 todo), 19.26s'
evidence: - '0 grep hits for `Phase 51 Tier-C` across the 15 Wave-2 source files (verified targeted grep)' - '0 grep hits for raw Tailwind palette literals (text-/bg-/border-{red,blue,green,yellow,orange,purple,teal,amber,gray}-N) across the 15 Wave-2 files' - '0 grep hits for `dark:(bg|text|border|hover)` variants in the heaviest files (TriagePanel, EntityComparisonTable, WGMemberSuggestions, UndoToast, BulkActionProgressIndicator) — token-based @theme resolves theme switching' - 'All 15 atomic commits land between 432e7098 (PLAN) and 4e5f7142 (final), with branch phase-58/wave-2-tables stacking cleanly on phase-58/wave-1-forms'

deviations:

- id: 'D-58-02-01'
  summary: 'TriagePanel confidence-tier mapping: low → text-danger (not text-warning)'
  status: 'planned + executed'
  follow_up: 'None. Inline comment at TriagePanel.tsx#L104-L106 cross-references this plan.'
- id: 'D-58-02-02'
  summary: '⚠️ replaced with AlertTriangle lucide icon in TriagePanel AI-unavailable banner'
  status: 'planned + executed'
  follow_up: 'None.'
- id: 'D-58-02-EXTRA-01'
  summary: 'TriagePanel AI status banner: 🤖 (bot face emoji) replaced with Bot lucide icon — not in original plan deviation list'
  status: 'discovered during execution, applied per CLAUDE.md no-emoji rule, documented retroactively'
  follow_up: 'None. Pattern (multi-emoji file → batch lucide imports + per-replacement inline comment) captured in patterns-established.'
- id: 'D-58-02-EXTRA-02'
  summary: 'RiskList border-s-{color}-N latent palette literals (lines 96-100) cleaned up alongside the suppression-annotated literals'
  status: 'executor scope-judgment, accepted'
  follow_up: 'None. Within file scope; full-file cleanup is the better outcome than leaving same-class violations for a future pass.'
- id: 'D-58-02-EXTRA-03'
  summary: 'orange-600 → text-warning (not text-danger) in SelectableDataTable + EntityComparisonSelector — max-reached state, not low-confidence semantics'
  status: 'context-scoped per-file decision, consistent with D-58-02-01 only applying to TriagePanel'
  follow_up: 'None. The lesson — token mapping is semantic-context, not literal-color — is captured in patterns-established.'

planning-observations:

- id: 'OBS-58-02-01'
  finding: 'The verification grep in 58-02-PLAN.md recurses `frontend/src/components/bulk-actions/` rather than listing the 4 Wave-2 files inside it. The recursive grep surfaces ~30 residual `Phase 51 Tier-C` suppressions in BulkActionConfirmDialog.tsx + BulkActionPreviewDialog.tsx, which the manifest correctly assigns to Wave 3 (drawers-dialogs).'
  impact: 'Cosmetic only — Wave 2 file-scope grep returns 0 as required. Wave 3 will clear the dialog files as planned.'
  fix_for_future_waves: 'Future wave PLANs should list explicit file paths in the verification grep, not directory recursion, to match the files_modified list exactly.'

requirements-completed: [TOKEN-01, TOKEN-02]

commits:
plan: '432e7098 — docs(58/wave-2): add Wave 2 PLAN'
execution: - '0046d030 — EscalationDashboard.tsx (3)' - '9e3f57a3 — AuditLogFilters.tsx (3)' - 'b9f63af1 — SelectableDataTable.tsx (3)' - '48c4a4a5 — ElectedOfficialListTable.tsx (2)' - '61cd8599 — EntityComparisonSelector.tsx (2)' - '48b28007 — AuditLogStatistics.tsx (4)' - '39b30b1a — RiskList.tsx (4)' - 'ac04422f — UndoToast.tsx (6)' - '86e680bf — VersionHistoryViewer.tsx (7)' - '80805e31 — AuditLogTable.tsx (10)' - '2db3ec15 — BulkActionsToolbar.tsx (8)' - 'ee5c07b0 — BulkActionProgressIndicator.tsx (13)' - 'a6b5a06a — WGMemberSuggestions.tsx (6)' - '2204076d — EntityComparisonTable.tsx (13)' - '4e5f7142 — TriagePanel.tsx (53)'
summary: 'TBD — this file'
total: 17 (1 PLAN + 15 file commits + 1 SUMMARY)

duration: ~17min executor wall-clock (foreground dispatch, sequential mode on main working tree, pre-commit hooks ran per commit)
completed: 2026-05-20
