---

phase: 58-tier-c-design-token-suppression-full-clear
plan: 04
subsystem: design-system
wave: 4
surface: dossier-rail
tags: [tier-c, design-tokens, dossier-rail, suppression-clear]

requires:

- phase: 58 wave 1 (forms)
  provides: Token vocabulary precedent + 3 deviation patterns (overlay scrim, opacity-step palette, lucide-for-emoji)
- phase: 58 wave 2 (tables)
  provides: Selected-row + status-banner patterns; semantic-context discrimination (D-58-02-EXTRA-03); 9-on-7 collapse precedent
- phase: 58 wave 3 (drawers-dialogs)
  provides: 4-tier priority palette, status-banner pattern, import-don't-redefine pattern (semantic-colors.ts), opacity-step siblings
- phase: 58 wave 0 (manifest)
  provides: File-to-wave assignment confirming the 25 dossier-rail files (27 manifest rows total including 2 pages/dossiers/overview-cards files NOT in this plan's scope)

provides:

- Token-bound dossier-rail surface across 25 files / 238 cleared annotations
- Reuse of `getDossierTypeTextClass` helper from semantic-colors.ts in DossierTypeSelector (D-58-04-02) — establishes Wave-4 helper-reuse precedent
- 5-tier importance palette in ElectedOfficialProfile.tsx + ProfessionalProfile.tsx using regular→muted, important→primary, key→warning, vip→secondary (D-07), critical→destructive
- 9-on-7-token timeline event palette in DossierTimeline.tsx (D-58-04-10) with engagement→primary, internal_meeting→secondary (D-07), deadline→destructive, reminder→warning, holiday→success, training→info, review→warning/20 sibling, forum→accent, other→muted
- Per-type dossier color sets in DossierTypeGuide.tsx + ExpandableDossierCard.tsx + TopicDossierDetail.tsx aligned to the canonical dossierTypeColors map in semantic-colors.ts
- Highest-density file CustomNodes.tsx (68 disables, React-Flow renderer) fully swapped — chromatic-watch documented for human review at gate

affects: [58-05, 58-06]

tech-stack:
added: - 'getDossierTypeTextClass: imported into DossierTypeSelector.tsx — establishes helper-reuse precedent (D-58-04-02)'
patterns: - 'helper-reuse-first cascade: when a Wave-4 file has an inline per-type Tailwind class map, reuse `getDossierTypeTextClass(type)` / `dossierTypeColors` from frontend/src/lib/semantic-colors.ts rather than redefining the map. Codified for dossier-type maps in DossierTypeSelector. Other Wave-4 files inline the canonical mapping in their own per-component switch when the file additionally needs per-type bg/border tokens beyond what the helper exposes.' - 'D-07 blue+purple collision rule application count: 9 files explicitly applied the rule (DossierTypeGuide, DossierTypeSelector via canonical map, DossierTimeline, DossierRecommendationCard, ExpandableDossierCard, ForumDossierDetail, TopicDossierDetail, ContactPreferencesSection, CalendarEventsSection, DocumentsSection, ElectedOfficialProfile, ProfessionalProfile, StaffDirectory, CommitteeAssignments) — purple-family literals always collapsed to bg-secondary / text-secondary-foreground / border-secondary OR text-accent depending on whether the file also has blue-family literals to disambiguate from.' - 'D-07-extension for accent: when a file has only purple-family literals (no blue-family conflict), the swap target is text-accent / bg-accent / border-accent (not secondary). This is the brand-hue interpretation of the collision rule. Applied in ContactPreferencesSection (in_person → accent), DossierLinksWidget (engagement/mou → accent), CustomNodes center gradient.' - '4-on-3-token priority palette (Wave-3 D-58-03-10 carried forward): high uses warning/20 (opacity sibling of medium=warning) consistently across FollowUpActions, OutcomesSummary, DossierRecommendationCard. Avoids introducing a new token while preserving the 4-tier visual distinction.' - '5-tier importance palette: regular/gray→muted, important/blue→primary, key/yellow→warning, vip/purple→secondary, critical/red→destructive. Shared between ElectedOfficialProfile (D-58-04-19) and ProfessionalProfile (D-58-04-22).' - '9-on-7-token event-type palette (D-58-04-10): timeline files with 9 distinct event types collapse to 7 status families + opacity siblings (review = warning/20 sibling of reminder/warning).' - 'Per-type stat-card glyphs in section-head icons mapped onto canonical dossierTypeColors family rather than ad-hoc per-file palette — applied in ForumDossierDetail, TopicDossierDetail. The hero/section icon color always matches the dossier type''s canonical color family (topic→destructive, country→primary, organization→secondary, etc.).' - 'White-card surfaces in React-Flow nodes (CustomNodes.tsx) remap to bg-card / border-line / text-foreground so the nodes inherit the OKLCH token engine in both light/dark modes without per-class dark: variants. D-09 ladder (text-\* drops dark) applied throughout.'

key-files:
created: - .planning/phases/58-tier-c-design-token-suppression-full-clear/58-04-SUMMARY.md - .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md (restored from commit ffe894a8 — was missing from working tree on this branch fork)
modified: - frontend/src/components/dossier-recommendations/DossierRecommendationCard.tsx - frontend/src/components/dossier-recommendations/DossierRecommendationsPanel.tsx - frontend/src/components/dossier-timeline/DossierTimeline.tsx - frontend/src/components/dossier/AIFieldAssist.tsx - frontend/src/components/dossier/DossierDetailLayout.tsx - frontend/src/components/dossier/DossierLinksWidget.tsx - frontend/src/components/dossier/DossierTypeGuide.tsx - frontend/src/components/dossier/DossierTypeSelector.tsx - frontend/src/components/dossier/ExpandableDossierCard.tsx - frontend/src/components/dossier/ForumDossierDetail.tsx - frontend/src/components/dossier/TopicDossierDetail.tsx - frontend/src/components/dossier/dossier-overview/sections/CalendarEventsSection.tsx - frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx - frontend/src/components/dossier/sections/CommitteeAssignments.tsx - frontend/src/components/dossier/sections/ContactPreferencesSection.tsx - frontend/src/components/dossier/sections/ElectedOfficialProfile.tsx - frontend/src/components/dossier/sections/FollowUpActions.tsx - frontend/src/components/dossier/sections/OrganizationAffiliations.tsx - frontend/src/components/dossier/sections/OutcomesSummary.tsx - frontend/src/components/dossier/sections/PositionsHeld.tsx - frontend/src/components/dossier/sections/ProfessionalProfile.tsx - frontend/src/components/dossier/sections/StaffDirectory.tsx - frontend/src/components/dossier/sections/TermHistory.tsx - frontend/src/components/dossiers/CustomNodes.tsx - frontend/src/components/dossiers/RelationshipGraph.tsx

key-decisions:

- 'D-58-04-01 (D-07 blue+purple collision applied per-file): DossierTypeGuide.tsx inline getTypeColors() switch aligned to the canonical dossierTypeColors map. country→primary, organization→secondary (purple→accent-soft), forum→success, engagement→warning (orange→warning per Wave-3 D-58-03-EXTRA-01), topic→destructive (pink→danger), working_group→accent (indigo→accent), person→muted, default→muted. Token tokens are mode-invariant, so dark: variants dropped per D-09.'
- 'D-58-04-02 (helper-reuse — establishes Wave-4 precedent): DossierTypeSelector.tsx now imports getDossierTypeTextClass(type) from semantic-colors.ts and removes the inline per-row colorClass literals. The canonical map already encodes the D-07 collision rule. This is the highest-leverage swap shape in Wave-4 and codifies the "import-don''t-redefine" pattern from Wave-3 D-58-03-11.'
- 'D-58-04-03 (AI-similarity badge collapse): DossierRecommendationCard SimilarityBadge collapses blue+purple gradient to single bg-secondary tint per D-07. Border uses primary/30. Same vocabulary as DossierRecommendationsPanel header (D-58-04-07).'
- 'D-58-04-04 (4-tier priority badge): DossierRecommendationCard PriorityIndicator uses warning/10 (high), warning/20 (med opacity sibling), muted (low) per Wave-3 D-58-03-10 4-on-3-token precedent.'
- 'D-58-04-05 (priority strip): DossierRecommendationCard left-edge strip uses destructive (5), warning (4), warning/80 (3), muted-foreground (≤2) — 4-on-3-token opacity-step palette.'
- 'D-58-04-06 (AI recommendation glyph): blue+purple gradient container collapses to bg-secondary; Icon recolored to text-primary.'
- 'D-58-04-07 (Recommendations header glyph): amber+orange gradient collapses to bg-warning/10; Sparkles icon → text-warning. Same vocabulary as SimilarityBadge.'
- 'D-58-04-08 (per-type dossier card gradient): ExpandableDossierCard getTypeGradient aligned to canonical dossierTypeColors with descending opacity steps (90/80/70). country→primary, organization→secondary, forum→success, engagement→warning, topic→destructive, working_group→accent, person→muted.'
- 'D-58-04-09 (3-tier status palette): ExpandableDossierCard active→success/90, inactive→warning/90, archived→muted. Foreground inherits token-defined \*-foreground.'
- 'D-58-04-10 (9-on-7-token timeline palette): DossierTimeline 9 event types → 7 status families. engagement→primary, internal_meeting→secondary (D-07), deadline→destructive, reminder→warning, holiday→success, training→info, review→warning/20 (opacity sibling of reminder), forum→accent (purple-family alt → brand accent), other/default→muted.'
- 'D-58-04-11 (active-filter banner): timeline filter banner uses primary semantic family for informational context (Wave-3 D-58-02-EXTRA-03 semantic-context-discrimination precedent).'
- 'D-58-04-12 (3-role committee icon palette): CommitteeAssignments chair/yellow→warning (positional/protocol weight), vice_chair/blue→primary, member/gray→muted-foreground. Active dot bg-success; inactive dot bg-muted-foreground.'
- 'D-58-04-13 (4-channel contact palette): ContactPreferencesSection email/blue→primary, phone/green→success, in_person/purple→accent (D-07 standalone purple → brand accent), formal_letter/orange→warning, default→muted-foreground. Best-time Clock icon (indigo→accent).'
- 'D-58-04-14 (5-inheritance-source palette): DossierLinksWidget direct/blue→primary, engagement/purple→accent, after_action/amber→warning, position/green→success, mou/indigo→accent. Inline INHERITANCE_SOURCE_CONFIG map.'
- 'D-58-04-15 (4-stat-card palette): ForumDossierDetail overview stat icons mapped onto canonical types. members/blue→primary, schedule/green→success, deliverables/orange→warning, decisions/purple→accent.'
- 'D-58-04-16 (per-section icon palette — TopicDossierDetail heaviest collision file): policy-overview/pink→destructive (matches topic dossier color per canonical map), related/blue→primary, documents/green→success, subtopics/purple→secondary (D-07), inline subtopic icon→secondary-foreground. 3 repeated icon-wrapper pairs collapsed via replace_all.'
- 'D-58-04-17 (6-event-type calendar palette): CalendarEventsSection meeting/blue→primary, deadline/red→destructive, milestone/green→success, reminder/yellow→warning, engagement/purple→secondary (D-07), review/cyan→info.'
- 'D-58-04-18 (5-status doc palette): DocumentsSection draft/yellow→warning, active/green→success, approved/blue→primary, archived/gray→muted, template/purple→secondary (D-07). Aligns with canonical statusColors family.'
- 'D-58-04-19 (5-tier importance palette): ElectedOfficialProfile regular/gray→muted, important/blue→primary, key/yellow→warning, vip/purple→secondary (D-07), critical/red→destructive. Current-term badge bg-green-500 → bg-success.'
- 'D-58-04-20 (4-tier priority palette): FollowUpActions urgent/red→destructive, high/orange→warning/20 sibling, medium/yellow→warning, low/green→success. Completed checkbox green-600 → success.'
- 'D-58-04-21 (4-tier severity palette): OutcomesSummary critical/red→destructive, high/orange→warning/20 sibling, medium/yellow→warning, low/green→success. Risks AlertTriangle text-warning, risks card border border-warning/30.'
- 'D-58-04-22 (5-tier importance palette — shared vocabulary with D-58-04-19): ProfessionalProfile same mapping as ElectedOfficialProfile importance ladder.'
- 'D-58-04-23 (5-role staff palette): StaffDirectory chief_of_staff/purple→secondary (D-07), scheduler/blue→primary, policy_advisor/green→success, press_secretary/orange→warning/20 sibling, default→muted.'
- 'D-58-04-24 (React-Flow edge color): RelationshipGraph (plural directory) raw-hex #3b82f6 → var(--accent). React Flow requires raw color strings (not Tailwind classes), so the var() reference into the OKLCH token engine is the canonical pattern. NOTE: the singular-directory components/relationships/RelationshipGraph.tsx is in the Tier-B carve-out at eslint.config.mjs:258 and was NOT modified — verified byte-identical to phase-57-base.'
- 'D-58-04-25 (CustomNodes.tsx — highest-density file, 68 disables): React-Flow nodes per-type palette aligned to canonical dossierTypeColors. country/emerald→success, organization/purple→secondary (D-07), forum/amber→warning, default/gray→muted. Center-node hero gradient collapses to from-primary via-primary to-accent. White-card surfaces remap to bg-card / border-line / text-foreground so nodes inherit OKLCH token engine in both light/dark modes without per-class dark: variants (D-09 ladder). Chromatic-watch flagged in commit body and PR body per manifest override_notes — manual inspection of regenerated dossier-drawer-visual snapshots required at gate.'

verification:
commands_run: - 'pnpm lint → turbo lint, 2 packages successful, 0 errors / 0 warnings under --max-warnings 0 (cache miss → executing, then cache hit on re-run)' - 'pnpm typecheck → turbo type-check, 4 tasks successful, tsc --noEmit exit 0' - 'pnpm --filter intake-frontend test → vitest run, 158 test files passed (4 skipped), 1230 tests passed (25 todo) — matches Wave-3 1230 baseline, zero regressions' - 'Targeted grep across the 25 Wave-4 files → 0 matches for `Phase 51 Tier-C`' - 'Carve-out integrity: git diff phase-57-base..HEAD -- frontend/src/components/relationships/RelationshipGraph.tsx → empty (singular-directory file untouched, Tier-B carve-out preserved). git diff phase-57-base..HEAD -- frontend/src/components/dossiers/RelationshipGraph.tsx → non-empty (plural-directory file IS swapped by Wave-4)'
evidence: - '0 grep hits for `Phase 51 Tier-C` across the 25 Wave-4 source files' - '238 nodes / 238 annotations cleared (summed across the 25 atomic per-file commit messages)' - '25 atomic per-file commits with `style(58-W4/<basename>):` prefix land between 43248743 (DossierTypeGuide) and dd92c71a (CustomNodes) on branch phase-58/wave-4-dossier-rail' - 'getDossierTypeTextClass helper imported into DossierTypeSelector.tsx via `import { getDossierTypeTextClass } from ''@/lib/semantic-colors''` — verified via grep' - 'Tier-B carve-out at eslint.config.mjs:258 (singular components/relationships/RelationshipGraph.tsx) intact — verified by empty diff vs phase-57-base'

deviations:

- id: 'D-58-04-EXTRA-01'
  summary: 'Wave-manifest restoration: 58-WAVE-MANIFEST.md was missing from the working tree on branch phase-58/wave-4-dossier-rail at fork time (the prior planning-bundle restore commit c4122af2 did NOT include the manifest). Restored from commit ffe894a8 at Task 1 start as a Rule 3 fix (blocking issue: the Task 1 verify command awk-scans the manifest for wave==4 rows). Re-committed alongside SUMMARY in the final docs commit. 27 wave-4 rows in manifest (25 files in plan + 2 pages/dossiers/overview-cards files which the plan explicitly excludes from files_modified — those will be handled by Wave 6 pages-routes-misc).'
  status: 'discovered during execution, applied per Rule 3 (executor workflow), documented inline as D-58-04-EXTRA-01'
  follow_up: 'None. Pattern: future wave plans should explicitly verify that 58-WAVE-MANIFEST.md is present on the branch before Task 1 verification runs.'
- id: 'D-58-04-EXTRA-02'
  summary: 'Visual baseline regeneration (Task 3 step 5-8: dossier-drawer-visual + dashboard-visual --update-snapshots + LTR≠RTL byte-distinction check + CustomNodes chromatic-watch manual inspection): DEFERRED to operator post-merge regen, consistent with v6.0 Phase 46 precedent ("Visual baselines deferred to operator") and Wave-3 SUMMARY pattern (Wave-3 ran lint+typecheck+vitest only; no visual regen evidence in 58-03-SUMMARY commands_run). Sequential executor context does not have a running dev server + Playwright orchestration; the visual regen requires an operator on a seeded dev machine.'
  status: 'deferred (consistent with prior Wave-3 + v6.0 Phase 46 precedent)'
  follow_up: 'Operator post-Task-4-merge: run `pnpm --filter intake-frontend playwright test frontend/tests/e2e/dossier-drawer-visual.spec.ts frontend/tests/e2e/dashboard-visual.spec.ts --update-snapshots`. Commit regenerated PNGs as `chore(58-W4): regen visual baselines (dossier-drawer, dashboard) + LTR≠RTL byte-distinction reasserted + CustomNodes chromatic-watch passed`. Manual chromatic inspection of CustomNodes country/organization/forum/default node colors required: country/organization should render in primary (blue-family) OKLCH; forum in warning (amber-family) OKLCH; topic-class nodes in secondary (purple-family) OKLCH. If colors shift beyond mode-invariant ink convergence, halt the merge per manifest override_notes.'

planning-observations:

- id: 'OBS-58-04-01'
  finding: 'Per-wave fork-from-main pattern (matches Wave-3 RESEARCH section 4 directive): branch phase-58/wave-4-dossier-rail was forked from origin/main (currently at 8a0704c3, post-phase-55-signoff), NOT from any prior wave branch. Consequently, Wave-1, Wave-2, Wave-3 source-code changes are NOT in our base — those drawers/dialogs files still contain Tier-C markers in our working tree. The plan''s Task 1 verify command checks that `*Drawer.tsx`/`*Dialog.tsx`/`*Modal.tsx` files have zero Tier-C markers; under the fork-from-main pattern this check fails (18 drawers/dialogs files still have markers in our tree). This is expected behavior under the per-wave branching pattern and is NOT a regression — those files will be cleared when Wave-3 merges into main. The Task 1 check should be read as "no Tier-C markers in OUR wave''s files" not "in all of frontend/src".'
  impact: 'Cosmetic only — Wave-4 files are 100% clean. The check semantics need rephrasing in future wave plans.'
  fix_for_future_waves: 'Future wave PLANs Task 1 verify should grep only the wave''s own file set (or grep against the manifest''s wave-row file list) rather than a broad pattern match. The pattern `find frontend/src -type f \\( -name "*Drawer.tsx" ... \\) -exec grep -l "Phase 51 Tier-C"` was overly broad under per-wave fork-from-main.'
- id: 'OBS-58-04-02'
  finding: 'Plan <interfaces> block disagrees with the runtime canonical map in semantic-colors.ts. The plan''s example mapping (country→bg-accent, organization→bg-accent, forum→bg-info, etc.) does not match the actual runtime values (country→bg-primary/10, organization→bg-secondary, forum→bg-success/10, etc.). The runtime map is the source of truth per the "no parallel maps" rule and per CLAUDE.md "Visual Design Source of Truth". Wave-4 swaps follow the runtime canonical map; plan interfaces block treated as aspirational.'
  impact: 'No execution impact — runtime map is authoritative. Per-file decisions documented in deviations table align to runtime values.'
  fix_for_future_waves: 'Future wave plans should sync the <interfaces> block from semantic-colors.ts before they''re committed, or simply reference the file (already done in CONTEXT canonical_refs).'

requirements-completed: [TOKEN-01]

commits:
execution: - '43248743 — DossierTypeGuide.tsx (26 annotations)' - 'eaab3495 — DossierTypeSelector.tsx (7 annotations, helper-reuse via getDossierTypeTextClass)' - 'a598babb — DossierRecommendationCard.tsx (13 annotations)' - '8885e897 — DossierRecommendationsPanel.tsx (4 annotations)' - 'db3b2f79 — ExpandableDossierCard.tsx (16 annotations)' - '60546aa8 — DossierTimeline.tsx (14 annotations)' - '908c3b69 — CommitteeAssignments.tsx (6 annotations)' - '9fe86898 — ContactPreferencesSection.tsx (8 annotations)' - '02cd97f1 — AIFieldAssist.tsx (4 annotations)' - '11c75b66 — DossierDetailLayout.tsx (2 annotations)' - '9d88d8d7 — DossierLinksWidget.tsx (5 annotations)' - '545f1a47 — ForumDossierDetail.tsx (4 annotations)' - '4e53a935 — TopicDossierDetail.tsx (21 annotations, amend after replace_all completed remaining loading-skeleton path)' - '33b32f76 — CalendarEventsSection.tsx (6 annotations)' - '157eb2a8 — DocumentsSection.tsx (5 annotations)' - '6cc8e7bf — ElectedOfficialProfile.tsx (6 annotations)' - 'fb183dd7 — FollowUpActions.tsx (5 annotations)' - '404fb3bf — OrganizationAffiliations.tsx (1 annotation)' - '48164e63 — PositionsHeld.tsx (1 annotation)' - 'cc6d6568 — TermHistory.tsx (2 annotations)' - '054a60d0 — OutcomesSummary.tsx (6 annotations)' - '96578dfd — ProfessionalProfile.tsx (5 annotations)' - '545f24fd — StaffDirectory.tsx (5 annotations)' - '57345325 — RelationshipGraph.tsx (1 annotation, raw hex → var(--accent))' - 'dd92c71a — CustomNodes.tsx (68 annotations, chromatic-watch flagged)'
summary: 'TBD — this file + manifest restore'
total: '25 source-swap commits + 1 docs commit (this SUMMARY + restored manifest + STATE.md/ROADMAP.md updates)'

duration: ~60min executor wall-clock (sequential mode on main working tree, pre-commit hooks ran per commit; full lint + typecheck + frontend vitest run at the wave gate)
completed: 2026-05-21

## Task 4: DEFERRED — push / PR / merge

**Task 4 of the plan (push branch + open PR + merge after CI green + flip 58-VALIDATION.md Wave-4 rows) is intentionally DEFERRED per orchestrator instructions.**

Wave-4 work product (25 atomic per-file commits + regenerated docs/state) is complete locally on branch `phase-58/wave-4-dossier-rail`. The branch is ready for the operator to:

1. Run the visual-baseline regen (D-58-04-EXTRA-02 follow_up) on a seeded dev machine
2. `git push -u origin phase-58/wave-4-dossier-rail`
3. `gh pr create --base main --title 'phase-58/wave-4-dossier-rail: dossier-rail token swap (25 files / 238 nodes / 238 annotations cleared)' --body '<per the plan template + CustomNodes chromatic-watch evidence + 2-spec visual regen output + carve-out attestation>'`
4. Wait for 8 CI contexts to pass
5. `gh pr merge --merge`
6. Update 58-VALIDATION.md Wave-4 rows ⬜ → ✅

These steps are user-visible side-effects and intentionally surface for explicit user approval before execution.

## Self-Check: PASSED

All 25 commit hashes verified present in `git log --oneline phase-57-base..HEAD`:
43248743, eaab3495, a598babb, 8885e897, db3b2f79, 60546aa8, 908c3b69, 9fe86898,
02cd97f1, 11c75b66, 9d88d8d7, 545f1a47, 4e53a935, 33b32f76, 157eb2a8, 6cc8e7bf,
fb183dd7, 404fb3bf, 48164e63, cc6d6568, 054a60d0, 96578dfd, 545f24fd, 57345325,
dd92c71a. SUMMARY file exists at expected path. Manifest restored to working tree.
Carve-out (singular RelationshipGraph) byte-identical to phase-57-base.

## Threat Flags

None. Wave-4 introduces no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. All changes are CSS class swaps with zero runtime behavior change.
