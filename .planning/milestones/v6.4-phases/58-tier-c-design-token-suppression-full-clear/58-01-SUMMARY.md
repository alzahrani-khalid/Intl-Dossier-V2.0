---

phase: 58-tier-c-design-token-suppression-full-clear
plan: 01
subsystem: design-system
wave: 1
surface: forms
tags: [tier-c, design-tokens, forms, suppression-clear, retroactive]

requires:

- phase: 51-design-token-compliance-gate
  provides: Tier-C suppression registry with 51-DESIGN-AUDIT.md anchors per file
- phase: 58-tier-c-design-token-suppression-full-clear (wave 0)
  provides: 58-WAVE-MANIFEST.md mapping 268 files to 6 surfaces; Wave 1 = forms (17 files, 119 annotations)

provides:

- Token-bound forms surface: FormInput, FormSelect, FormCheckboxAceternity, SearchableSelect, AutoSaveIndicator, FormProgressIndicator, validation-badge all consume only @theme-mapped utilities
- Token-bound advanced-search filters: AdaptiveFilters, DateRangeFilter, EnhancedSearchInput
- Token-bound duplicate-detection surfaces: DuplicateCandidateCard, DuplicateCandidatesList, DuplicateComparison (with HeroUI/lucide icon migration for ⚠️/✓)
- Token-bound empty-state palette: FilterPresetsSection, IntakeRoleEmptyState, IntelligentSearchSuggestions, NotificationPreviewTimeline (with opacity-step palette to preserve 8-category distinction)
- Updated FormInput.test.tsx assertions against semantic tokens (border-danger, border-line) — pattern for future Tier-C test updates

affects: [58-02, 58-03, 58-04, 58-05, 58-06]

tech-stack:
added: - 'lucide-react: AlertTriangle, CheckCircle2 imported in DuplicateComparison.tsx (replaces ⚠️/✓ emoji)'
patterns: - 'Opacity-step differentiation: when N categories exceed the M-token palette, group by semantic family and use /10 vs /20 opacity to distinguish siblings (e.g., mentions vs deadlines share warning; workflow vs calendar share success)' - 'Retroactive PLAN.md pattern: when an external executor commits Tier-C work without GSD artifacts, the orchestrator writes a retroactive PLAN.md folding in any correctness fixes, then a closure SUMMARY.md citing both commits (initial + closure)' - 'Overlay scrim deviation pattern: bg-black/N is the codebase-wide overlay convention (alert-dialog.tsx, bottom-sheet.tsx, ExpandableDossierCard, TourOverlay); documented as D-58-01-01 pending an --overlay token or Dialog-primitive migration'

key-files:
created: - .planning/phases/58-tier-c-design-token-suppression-full-clear/58-01-PLAN.md - .planning/phases/58-tier-c-design-token-suppression-full-clear/58-01-SUMMARY.md
modified: - frontend/src/components/advanced-search/AdaptiveFilters.tsx - frontend/src/components/advanced-search/DateRangeFilter.tsx - frontend/src/components/advanced-search/EnhancedSearchInput.tsx - frontend/src/components/duplicate-comparison/DuplicateComparison.tsx - frontend/src/components/duplicate-detection/DuplicateCandidateCard.tsx - frontend/src/components/duplicate-detection/DuplicateCandidatesList.tsx - frontend/src/components/empty-states/FilterPresetsSection.tsx - frontend/src/components/empty-states/IntakeRoleEmptyState.tsx - frontend/src/components/empty-states/IntelligentSearchSuggestions.tsx - frontend/src/components/empty-states/NotificationPreviewTimeline.tsx - frontend/src/components/form-auto-save/AutoSaveIndicator.tsx - frontend/src/components/form-auto-save/FormProgressIndicator.tsx - frontend/src/components/forms/FormCheckboxAceternity.tsx - frontend/src/components/forms/FormInput.tsx - frontend/src/components/forms/FormSelect.tsx - frontend/src/components/forms/SearchableSelect.tsx - frontend/src/components/validation/validation-badge.tsx - frontend/tests/unit/FormInput.test.tsx

key-decisions:

- 'Retroactive plan + closure-fix commits over revert-and-replan: the initial 144bf880 token swap is mechanically correct for 15 of 17 files; the cheaper path is to keep that history and append a closure commit with the 3 correctness fixes (notification palette, emoji→icons, modal scrim modernization) and the GSD artifacts. Documented as provenance metadata in 58-01-PLAN.md so future readers can trace both commits.'
- 'Opacity-step palette (mentions=warning/20, deadlines=warning/10; workflow=success/20, calendar=success/10) over palette-expansion: the design system has only 4 status colors + accent + ink-mute. Expanding tokens is its own design decision and out of Phase 58 scope (suppression clearance only). Inline rationale comment placed at categoryColors definition.'
- 'bg-black/50 kept as the modal scrim and documented as deviation D-58-01-01: the existing codebase convention is bg-black/N for overlays (5+ call sites), and the proper fix (migrate to HeroUI Modal primitive OR add --color-overlay token) is bigger than Phase 58 mandates. Follow-up captured in PLAN deviations section.'
- 'lucide-react over inline emoji for status iconography: matches CLAUDE.md no-emoji rule and the codebase-wide pattern of importing from lucide-react. Adds 2 named icon imports; no new dependencies.'
- 'intake category re-mapped from text-accent bg-primary/10 to text-accent bg-accent/10: --color-primary and --color-accent resolve to the same CSS variable, so the prior mixed naming was internally inconsistent. Normalized to accent.'

patterns-established:

- 'Token swap mapping table (PLAN.md): when clearing Tier-C suppressions, document the source-literal → target-token mapping in the PLAN.md before execution so reviewers can verify each swap against a single rule table'
- 'Provenance frontmatter: retroactive PLAN.md uses provenance: { initial_commit, initial_executor, closure_commit, closure_executor } to keep the audit trail discoverable from frontmatter alone'
- 'Deviation block in PLAN.md: D-58-01-NN entries record CLAUDE.md rule, instance file, justification, and follow-up — same shape as Phase 52 D-19 closure pattern'

verification:
commands_run: - 'pnpm lint --max-warnings 0 → 0 errors, 0 warnings' - 'pnpm type-check (tsc --noEmit) → 0 diagnostics' - 'pnpm vitest run → 163 test files passed (4 skipped), 1241 tests passed (25 todo), 21.15s' - 'pnpm vitest run tests/unit/FormInput.test.tsx → 22/22 passing'
evidence: - '0 grep hits for `Phase 51 Tier-C` across the 17 Wave-1 source files (verified via grep -c)' - 'All 18 commit-touched files (17 source + 1 test) tracked under files_modified in 58-01-PLAN.md' - 'Every replacement token resolves to a CSS custom property defined in frontend/src/index.css @theme block (lines 46-98)'

deviations:

- id: 'D-58-01-01'
  summary: 'Modal backdrop in DuplicateComparison.tsx uses `bg-black/50` literal instead of a design-system overlay token'
  status: 'documented; follow-up captured'
  follow_up: 'Migrate DuplicateComparison merge dialog to HeroUI Modal primitive OR introduce a --color-overlay token to the design system and update all bg-black/N call sites project-wide'
- id: 'D-58-01-02'
  summary: 'NotificationPreviewTimeline 8-category palette uses /20 opacity steps on warning and success tokens to preserve visual distinction'
  status: 'documented; intentional'
  follow_up: 'If product team wants stronger category differentiation, expand design-system palette with additional status tokens in a dedicated phase'

requirements-completed: [TOKEN-01, TOKEN-02]

provenance:
initial_commit: '144bf880 — chore(58): resolve Phase 58 Wave 1 forms suppressions (external executor: Gemini, 2026-05-20)'
closure_commit: 'TBD — chore(58): close Wave 1 with palette + icon fixes + GSD artifacts (gsd-orchestrator: claude-opus-4-7, 2026-05-20)'

duration: ~45min (closure pass — palette analysis, three source fixes, two artifact writes, full verification suite)
completed: 2026-05-20
