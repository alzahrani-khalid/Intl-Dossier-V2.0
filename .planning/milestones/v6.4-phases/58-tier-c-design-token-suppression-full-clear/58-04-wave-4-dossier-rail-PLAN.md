---
phase: 58-tier-c-design-token-suppression-full-clear
plan: 04
type: execute
wave: 4
depends_on:
  - 58-03
files_modified:
  - frontend/src/components/dossier-recommendations/DossierRecommendationCard.tsx
  - frontend/src/components/dossier-recommendations/DossierRecommendationsPanel.tsx
  - frontend/src/components/dossier-timeline/DossierTimeline.tsx
  - frontend/src/components/dossier/AIFieldAssist.tsx
  - frontend/src/components/dossier/DossierDetailLayout.tsx
  - frontend/src/components/dossier/DossierLinksWidget.tsx
  - frontend/src/components/dossier/DossierTypeGuide.tsx
  - frontend/src/components/dossier/DossierTypeSelector.tsx
  - frontend/src/components/dossier/ExpandableDossierCard.tsx
  - frontend/src/components/dossier/ForumDossierDetail.tsx
  - frontend/src/components/dossier/TopicDossierDetail.tsx
  - frontend/src/components/dossier/dossier-overview/sections/CalendarEventsSection.tsx
  - frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx
  - frontend/src/components/dossier/sections/CommitteeAssignments.tsx
  - frontend/src/components/dossier/sections/ContactPreferencesSection.tsx
  - frontend/src/components/dossier/sections/ElectedOfficialProfile.tsx
  - frontend/src/components/dossier/sections/FollowUpActions.tsx
  - frontend/src/components/dossier/sections/OrganizationAffiliations.tsx
  - frontend/src/components/dossier/sections/OutcomesSummary.tsx
  - frontend/src/components/dossier/sections/PositionsHeld.tsx
  - frontend/src/components/dossier/sections/ProfessionalProfile.tsx
  - frontend/src/components/dossier/sections/StaffDirectory.tsx
  - frontend/src/components/dossier/sections/TermHistory.tsx
  - frontend/src/components/dossiers/CustomNodes.tsx
  - frontend/src/components/dossiers/RelationshipGraph.tsx
autonomous: true
requirements:
  - TOKEN-01
must_haves:
  truths:
    - 'Every Wave-4 file (per 58-WAVE-MANIFEST.md `wave == 4` — dossier-rail surface) contains zero `Phase 51 Tier-C:` annotations after swap'
    - 'Dossier-type color set (country=blue, topic=purple, organization=blue, person=green, ...) follows D-06/D-07: purple-family → text-accent UNLESS blue+purple collision → bg-secondary/text-secondary-foreground'
    - 'components/dossiers/CustomNodes.tsx (68 disables; React-Flow node renderer) treated as IN-SCOPE per RESEARCH Open Question 1 + manifest override_notes — chromatic regression watched at wave-gate'
    - 'Wave-4 visual baselines (dossier-drawer re-affirm, dashboard) regenerate cleanly and LTR PNG ≠ RTL PNG byte-for-byte per D-12'
    - 'pnpm lint exits 0; pnpm type-check exits 0; pnpm test:unit green'
  artifacts:
    - path: 'frontend/src/components/dossiers/CustomNodes.tsx'
      provides: 'Highest-density Wave-4 file (68 disables) — React-Flow node renderer fully swapped'
    - path: 'frontend/src/components/dossier/DossierTypeGuide.tsx'
      provides: 'Blue+purple collision file (9+6 hits) — purple-family on bg-secondary/text-secondary-foreground per D-07'
  key_links:
    - from: 'Wave-4 dossier-rail files'
      to: 'frontend/src/lib/semantic-colors.ts (`getDossierTypeBadgeClass`, `getActivityTypeBadgeClass`)'
      via: 'Reuse canonical dossier-type and activity-type color maps; no parallel maps'
      pattern: 'getDossierTypeBadgeClass|getActivityTypeBadgeClass|dossierTypeColors|activityTypeColors'
    - from: 'Wave-4 dossier-rail files'
      to: 'frontend/src/components/dossier/DossierContextBadge.tsx (already-clean consumer reference)'
      via: 'Read this file for the canonical dossier-type-badge shape if unsure'
      pattern: 'DossierContextBadge'
---

<objective>
Swap every `Phase 51 Tier-C:` palette-literal suppression in the Wave 4 (dossier-rail) surface to semantic-token utilities per CONTEXT D-05..D-10. Wave 4 is the highest-user-visible wave — the dossier rail is the central organizing pattern of the app (per CLAUDE.md §"Dossier-Centric Development Patterns"), so visual baselines for `dossier-drawer-visual.spec.ts` are re-affirmed in this wave even though Wave 3 already regenerated them.

The Wave-4 surface is dominated by dossier-type color sets (`country=blue`, `topic=purple`, `organization=blue`, `person=green`, `theme=pink`, `brief=violet`, ...). These are textbook D-07 collision territory (multiple blue + purple literals per file). The pattern map identifies `semantic-colors.ts` `getDossierTypeBadgeClass` / `dossierTypeColors` as the canonical reuse target.

Special note: `components/dossiers/CustomNodes.tsx` has 68 Tier-C disables (highest in Phase 58 scope) and is a React-Flow node renderer. RESEARCH Open Question 1 verified it is NOT in the Tier-B carve-out at `eslint.config.mjs:247-270`; it stays in-scope. The manifest `override_notes` column flags it for chromatic regression watching during the wave-gate.

Output: PR `phase-58/wave-4-dossier-rail: dossier-rail token swap (N files / M nodes / K annotations cleared)` on branch `phase-58/wave-4-dossier-rail`, ~25 atomic commits.
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
@.planning/phases/58-tier-c-design-token-suppression-full-clear/58-03-SUMMARY.md
@frontend/src/index.css
@frontend/src/lib/semantic-colors.ts
@frontend/src/components/dossier/DossierContextBadge.tsx

<interfaces>
<!-- Wave-4 canonical helpers from semantic-colors.ts (use these — DO NOT create parallel maps): -->

dossierTypeColors / getDossierTypeBadgeClass:

- country → bg-accent / text-accent-foreground / border-accent (blue family → accent)
- organization → bg-accent / text-accent-foreground / border-accent (blue family)
- forum → bg-info / text-info-foreground / border-info
- engagement → bg-success / text-success-foreground / border-success
- topic → bg-secondary / text-secondary-foreground / border-secondary (purple → accent-soft per D-07)
- working_group → bg-warning / text-warning-foreground / border-warning
- person → bg-secondary / text-secondary-foreground / border-secondary
- elected_official → bg-secondary / text-secondary-foreground / border-secondary

activityTypeColors / getActivityTypeBadgeClass:

- create/update/delete → respective semantic tokens
- Read full mapping in semantic-colors.ts before swapping any activity timeline literal

D-07 collision triggers in Wave 4 (per manifest blue_purple_collision flag):

- DossierTypeGuide.tsx (9 blue + 6 purple)
- TopicDossierDetail.tsx (6 blue + 9 purple)
- DossierTimeline.tsx (6 blue + 2 purple)
- DossierTypeSelector.tsx (3 blue + 2 purple)
- (Manifest is authoritative — check column per file)
  </interfaces>
  </context>

<tasks>

<task type="auto">
  <name>Task 1: Read Wave-4 manifest rows + dossier-rail precedents; branch off main</name>
  <files>(no source edits)</files>
  <read_first>
    - `58-WAVE-MANIFEST.md` rows where `wave == 4` (authoritative file list ~25 files; `override_notes` flags for `components/dossiers/CustomNodes.tsx` and any chromatic-regression watching)
    - `58-03-SUMMARY.md` for Wave-3 lessons learned (collision-rule application count)
    - `frontend/src/lib/semantic-colors.ts` (FULL READ — `dossierTypeColors`, `getDossierTypeBadgeClass`, `activityTypeColors`, `getActivityTypeBadgeClass` are central to Wave-4)
    - `frontend/src/components/dossier/DossierContextBadge.tsx` (already-clean consumer; canonical shape reference)
    - `58-PATTERNS.md` §"Wave 4: dossier-rail" (lines 366-470 — patterns and `getDossierTypeBadgeClass` examples)
  </read_first>
  <action>
Extract every row where `wave == 4` from 58-WAVE-MANIFEST.md (expected ~25 files matching `files_modified`). The dossier-rail surface includes:
- `components/dossier/**` (20 files including sections subfolder)
- `components/dossier-recommendations/**` (2 files)
- `components/dossier-timeline/**` (1 file)
- `components/dossiers/**` (2 files — CustomNodes.tsx + RelationshipGraph.tsx; flagged in manifest `override_notes` for chromatic watch)
- `pages/dossiers/**` if any rows present (may be empty if all dossier pages are already in Wave 6)

Read `semantic-colors.ts` IN FULL to internalize the canonical dossier-type → semantic-token mapping. Read `DossierContextBadge.tsx` for the consumer shape — Wave-4 files should look structurally similar after the swap (import `getDossierTypeBadgeClass`, call with the dossier type, render).

From the manifest, identify the Wave-4 files marked `blue_purple_collision == yes` and create a mental checklist. Per RESEARCH §"Blue+Purple Collision Files" sample table: at least 4 Wave-4 files match (DossierTypeGuide, TopicDossierDetail, DossierTimeline, DossierTypeSelector — manifest verifies).

Special-case CustomNodes.tsx: open the file BEFORE branching to confirm it is NOT in any Tier-B carve-out path matched by `eslint.config.mjs:247-270`. Run `grep -n 'dossiers/CustomNodes' eslint.config.mjs` — must return zero matches. If non-zero, STOP and consult: the file may have been added to the carve-out and Phase 58 must skip it per CONTEXT D-13.

Create branch: `git checkout -b phase-58/wave-4-dossier-rail main` (Wave 3 has merged). Confirm Wave 3 complete: no `*Drawer.tsx`/`*Dialog.tsx`/`*Modal.tsx` in `frontend/src/` contains `Phase 51 Tier-C`. Do NOT edit source files in this task.
</action>
<verify>
<automated>git rev-parse --abbrev-ref HEAD | grep -qx 'phase-58/wave-4-dossier-rail' && [ "$(awk -F'|' '$4 ~ /^[[:space:]]*4[[:space:]]*$/ {print}' .planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md | wc -l)" -ge 20 ] && ! grep -n 'dossiers/CustomNodes' eslint.config.mjs && [ "$(find frontend/src -type f \( -name '*Drawer.tsx' -o -name '*Dialog.tsx' -o -name '*Modal.tsx' \) -exec grep -l 'Phase 51 Tier-C' {} + | wc -l)" -eq 0 ]</automated>
</verify>
<acceptance_criteria> - On branch `phase-58/wave-4-dossier-rail` - Wave-4 file list (~25 files) extracted - `semantic-colors.ts` `dossierTypeColors` + `activityTypeColors` mappings internalized - `DossierContextBadge.tsx` canonical shape read - `components/dossiers/CustomNodes.tsx` confirmed NOT in eslint.config.mjs Tier-B carve-out paths — stays in Wave-4 scope - Wave 3 confirmed merged - No source files modified
</acceptance_criteria>
<done>Executor oriented; helper-reuse plan set; CustomNodes.tsx scope confirmed; branch ready.</done>
</task>

<task type="auto">
  <name>Task 2: Atomic per-file swaps — Wave 4 dossier-rail (1 commit per file)</name>
  <files>
    frontend/src/components/dossier-recommendations/DossierRecommendationCard.tsx,
    frontend/src/components/dossier-recommendations/DossierRecommendationsPanel.tsx,
    frontend/src/components/dossier-timeline/DossierTimeline.tsx,
    frontend/src/components/dossier/AIFieldAssist.tsx,
    frontend/src/components/dossier/DossierDetailLayout.tsx,
    frontend/src/components/dossier/DossierLinksWidget.tsx,
    frontend/src/components/dossier/DossierTypeGuide.tsx,
    frontend/src/components/dossier/DossierTypeSelector.tsx,
    frontend/src/components/dossier/ExpandableDossierCard.tsx,
    frontend/src/components/dossier/ForumDossierDetail.tsx,
    frontend/src/components/dossier/TopicDossierDetail.tsx,
    frontend/src/components/dossier/dossier-overview/sections/CalendarEventsSection.tsx,
    frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx,
    frontend/src/components/dossier/sections/CommitteeAssignments.tsx,
    frontend/src/components/dossier/sections/ContactPreferencesSection.tsx,
    frontend/src/components/dossier/sections/ElectedOfficialProfile.tsx,
    frontend/src/components/dossier/sections/FollowUpActions.tsx,
    frontend/src/components/dossier/sections/OrganizationAffiliations.tsx,
    frontend/src/components/dossier/sections/OutcomesSummary.tsx,
    frontend/src/components/dossier/sections/PositionsHeld.tsx,
    frontend/src/components/dossier/sections/ProfessionalProfile.tsx,
    frontend/src/components/dossier/sections/StaffDirectory.tsx,
    frontend/src/components/dossier/sections/TermHistory.tsx,
    frontend/src/components/dossiers/CustomNodes.tsx,
    frontend/src/components/dossiers/RelationshipGraph.tsx
  </files>
  <read_first>
    For each file: file itself + its manifest row + `semantic-colors.ts` (already in working memory). For `CustomNodes.tsx` specifically: read in full — the 68 disables warrant careful inspection.

    For `components/dossiers/RelationshipGraph.tsx`:
    NOTE: This is `components/dossiers/RelationshipGraph.tsx` (plural directory) — a DIFFERENT file from the Tier-B carve-out's `components/relationships/RelationshipGraph.tsx` (singular directory). The singular-directory file is in the Tier-B carve-out at `eslint.config.mjs:247-270` (line 263 specifically — `'frontend/src/components/relationships/RelationshipGraph.tsx'`) and MUST NOT be modified by this wave. Only the plural-directory file (`components/dossiers/RelationshipGraph.tsx`) is in Wave-4 scope. Before swapping, sanity-check by running `grep -n "components/relationships/RelationshipGraph" eslint.config.mjs` (must return the carve-out line; confirms the OTHER file is the protected one) and `grep -c 'Phase 51 Tier-C' frontend/src/components/dossiers/RelationshipGraph.tsx` (must return ≥1; confirms THIS file has Tier-C work to do).

</read_first>
<action>
Execute one atomic commit per file (~25 commits). Internal ordering: helper-reuse candidates first to validate the dossier-type-badge swap shape, then collision files (D-07), then long-tail sections, then CustomNodes.tsx LAST (highest-density + chromatic-watch flag).

Recommended order:

1. `DossierTypeGuide.tsx` (collision; 9+6 — establish the D-07 pattern for the wave)
2. `DossierTypeSelector.tsx` (collision; 3+2)
3. `DossierRecommendationCard.tsx`, `DossierRecommendationsPanel.tsx`, `ExpandableDossierCard.tsx` (likely `getDossierTypeBadgeClass` candidates)
4. `DossierTimeline.tsx` (collision; 6+2 — likely `getActivityTypeBadgeClass`)
5. `dossier/sections/*` (12 files — section-by-section)
6. `dossier/dossier-overview/sections/*` (2 files)
7. `dossier/DossierDetailLayout.tsx`, `dossier/DossierLinksWidget.tsx`, `dossier/AIFieldAssist.tsx`
8. `dossier/ForumDossierDetail.tsx`, `dossier/TopicDossierDetail.tsx` (collision; latter has 6+9 → heaviest collision)
9. `dossiers/RelationshipGraph.tsx`
10. `dossiers/CustomNodes.tsx` LAST (68 disables; chromatic-watch)

For each file, apply canonical swap pattern per CONTEXT D-05..D-10. Wave-4-specific emphasis:

1. **Reuse helpers FIRST** (RESEARCH §"Don't Hand-Roll" — mandatory): if a file contains an inline dossier-type → color lookup, REPLACE it with `import { getDossierTypeBadgeClass } from '@/lib/semantic-colors'` + `getDossierTypeBadgeClass(type)`. Inline literal swap is fallback only.

2. **Apply D-07 collision rule** for manifest-flagged files. In dossier-type maps where `country=blue, topic=purple, organization=blue, theme=pink, brief=violet`:
   - blue-family entries (country, organization, sometimes forum) → `text-accent` / `bg-accent/N` / `border-accent/N`
   - purple-family entries (topic, theme, brief, person, elected_official) → `text-secondary-foreground` / `bg-secondary` / `border-secondary`
   - This MATCHES the canonical `dossierTypeColors` mapping in `semantic-colors.ts`. Using the helper achieves the swap automatically.

3. **CustomNodes.tsx special handling**: 68 disables across React-Flow node renderers. Each node type (country-node, organization-node, topic-node, person-node, etc.) has its own palette. Swap each node-type's literals to the matching dossier-type semantic. After swap, the React-Flow nodes should render visually identically except for the OKLCH-mode-invariant ink variants — flag any chromatic shift in the PR body per manifest `override_notes`.

4. D-05/D-08/D-09/D-10 standard rules same as Waves 1-3.

5. `multi_literal_line == yes` cases — swap both literals.

6. Delete every Tier-C annotation; `pnpm lint frontend/src/<file>` exit 0; amend on Unused eslint-disable.

7. Commit message: `style(58-W4/<basename>): swap Tier-C palette literals to <semantic-family> tokens (N nodes, M annotations cleared)`. For CustomNodes.tsx specifically, add a body line noting chromatic-watch: `Note: 68-disable file; React-Flow nodes; chromatic regression flagged in PR body per manifest override_notes.`

8. No test-grep hits in Wave 4 per RESEARCH §"Test-Grep Hits" — no test updates.
   </action>
   <verify>
   <automated>WAVE4="frontend/src/components/dossier-recommendations/DossierRecommendationCard.tsx frontend/src/components/dossier-recommendations/DossierRecommendationsPanel.tsx frontend/src/components/dossier-timeline/DossierTimeline.tsx frontend/src/components/dossier/AIFieldAssist.tsx frontend/src/components/dossier/DossierDetailLayout.tsx frontend/src/components/dossier/DossierLinksWidget.tsx frontend/src/components/dossier/DossierTypeGuide.tsx frontend/src/components/dossier/DossierTypeSelector.tsx frontend/src/components/dossier/ExpandableDossierCard.tsx frontend/src/components/dossier/ForumDossierDetail.tsx frontend/src/components/dossier/TopicDossierDetail.tsx frontend/src/components/dossier/dossier-overview/sections/CalendarEventsSection.tsx frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx frontend/src/components/dossier/sections/CommitteeAssignments.tsx frontend/src/components/dossier/sections/ContactPreferencesSection.tsx frontend/src/components/dossier/sections/ElectedOfficialProfile.tsx frontend/src/components/dossier/sections/FollowUpActions.tsx frontend/src/components/dossier/sections/OrganizationAffiliations.tsx frontend/src/components/dossier/sections/OutcomesSummary.tsx frontend/src/components/dossier/sections/PositionsHeld.tsx frontend/src/components/dossier/sections/ProfessionalProfile.tsx frontend/src/components/dossier/sections/StaffDirectory.tsx frontend/src/components/dossier/sections/TermHistory.tsx frontend/src/components/dossiers/CustomNodes.tsx frontend/src/components/dossiers/RelationshipGraph.tsx"; for f in $WAVE4; do if grep -nq 'Phase 51 Tier-C' "$f"; then echo "FAIL: $f"; exit 1; fi; done && pnpm lint $WAVE4</automated>
   </verify>
   <acceptance_criteria> - Every Wave-4 file has zero `Phase 51 Tier-C` markers - `getDossierTypeBadgeClass` / `getActivityTypeBadgeClass` reused where applicable; no parallel maps introduced - Blue+purple collision files: purple-family on `bg-secondary` / `text-secondary-foreground` / `border-secondary` (D-07) - D-08/D-09/D-10 ladder applied - `CustomNodes.tsx` swap commit body documents chromatic-watch - Carve-out preserved: `components/relationships/RelationshipGraph.tsx` (singular) byte-identical to phase-57-base; only `components/dossiers/RelationshipGraph.tsx` (plural) modified by this wave. Verify with `git diff phase-57-base..HEAD -- frontend/src/components/relationships/RelationshipGraph.tsx` returning empty AND `git diff phase-57-base..HEAD -- frontend/src/components/dossiers/RelationshipGraph.tsx` returning non-empty. - `pnpm lint` on Wave-4 file set exits 0 - ~25 atomic per-file commits with `style(58-W4/<basename>):` prefix - No edits to `eslint.config.mjs`, `list-pages.css`, `bad-design-token.tsx` - No `--no-verify`; no `--force` push
   </acceptance_criteria>
   <done>All Wave-4 source files swapped; per-file lint clean; ready for wave-gate.</done>
   </task>

<task type="auto">
  <name>Task 3: Wave-4 gate — full lint/type-check/unit + visual baseline regen (dossier-drawer re-affirm, dashboard)</name>
  <files>
    frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/**,
    frontend/tests/e2e/dashboard-visual.spec.ts-snapshots/**
  </files>
  <read_first>
    - `58-VALIDATION.md` §"Per-Task Verification Map" rows 58-{1..6}-ZZ-01..03
    - `58-RESEARCH.md` §"D-12 LTR≠RTL Byte-Distinction Check"
    - `58-WAVE-MANIFEST.md` Wave-4 rows' `regen_targets` (expected: `dossier-drawer-visual`, `dashboard-visual`)
  </read_first>
  <action>
Run the Wave-4 full gate per CONTEXT D-11:

1. `pnpm lint` exit 0 workspace-wide
2. `pnpm type-check` exit 0
3. `pnpm test:unit` green
4. Wave-4-scoped grep: `! grep -rn 'Phase 51 Tier-C' frontend/src/components/{dossier,dossier-recommendations,dossier-timeline,dossiers}` returns no matches

Visual baseline regen per D-12. Wave-4 specs: `dossier-drawer-visual` (re-affirm from Wave 3), `dashboard-visual` (dossier widgets):

5. `pnpm --filter frontend playwright test frontend/tests/e2e/dossier-drawer-visual.spec.ts frontend/tests/e2e/dashboard-visual.spec.ts --update-snapshots`
6. LTR≠RTL byte-distinction check:
   ```
   for snap_dir in frontend/tests/e2e/{dossier-drawer,dashboard}-visual.spec.ts-snapshots/; do
     for variant in 1280 768; do
       ltr=$(ls "$snap_dir"*ltr*"$variant"*chromium*.png 2>/dev/null | head -1)
       rtl=$(ls "$snap_dir"*rtl*"$variant"*chromium*.png 2>/dev/null | head -1)
       if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then
         echo "FAIL: byte-identical $ltr/$rtl"
         exit 1
       fi
     done
   done
   ```
7. **Chromatic regression check for CustomNodes.tsx** (manual-only per VALIDATION §"Manual-Only Verifications"): the dossier-drawer-visual snapshots include relationship-graph nodes. Open the regenerated PNGs and inspect node colors against pre-regen baseline. Country/Organization nodes (blue → accent) and Topic/Person nodes (purple → secondary) should render with the brand-hue OKLCH variants, NOT raw blue/purple. If colors look "wrong" beyond mode-invariant ink convergence, halt the merge and document in PR body per manifest `override_notes`.
8. Commit regenerated snapshots: `chore(58-W4): regen visual baselines (dossier-drawer, dashboard) + LTR≠RTL byte-distinction reasserted + CustomNodes chromatic-watch passed`.
   </action>
   <verify>
   <automated>pnpm lint && pnpm type-check && pnpm --filter frontend test:unit && for sdir in frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/ frontend/tests/e2e/dashboard-visual.spec.ts-snapshots/; do for variant in 1280 768; do ltr=$(ls "$sdir"_ltr_"$variant"*chromium*.png 2>/dev/null | head -1); rtl=$(ls "$sdir"*rtl*"$variant"_chromium_.png 2>/dev/null | head -1); if [ -f "$ltr" ] && [ -f "$rtl" ] && cmp -s "$ltr" "$rtl"; then echo "FAIL LTR=RTL in $sdir"; exit 1; fi; done; done && ! grep -rn 'Phase 51 Tier-C' frontend/src/components/dossier frontend/src/components/dossier-recommendations frontend/src/components/dossier-timeline frontend/src/components/dossiers</automated>
   </verify>
   <acceptance_criteria> - `pnpm lint` / `pnpm type-check` / `pnpm test:unit` exit 0 - Wave-4 file set has zero `Phase 51 Tier-C` markers - 2 visual baselines (dossier-drawer, dashboard) regenerated and committed in same PR - LTR≠RTL byte-distinction preserved - CustomNodes.tsx chromatic-watch passed (or flagged in PR body for human review) - Snapshot regen commit follows convention
   </acceptance_criteria>
   <done>Wave-4 D-11 full gate passes; ready for PR.</done>
   </task>

<task type="auto">
  <name>Task 4: Open Wave-4 PR and merge after CI green</name>
  <files>(PR creation)</files>
  <read_first>`58-CONTEXT.md` §"Specifics" line 188 (PR title convention); Phase 55 D-13 (8 required CI contexts)</read_first>
  <action>
Push: `git push -u origin phase-58/wave-4-dossier-rail`. Open PR via `gh pr create`:
- Title: `phase-58/wave-4-dossier-rail: dossier-rail token swap (<N> files / <M> nodes / <K> annotations cleared)`
- Base: `main`
- Body: per-file commit log, `getDossierTypeBadgeClass` reuse count, D-07 collision count, CustomNodes.tsx chromatic-watch evidence, 2-spec visual regen output, no-touch attestation

Wait for 8 CI contexts. Merge via `gh pr merge --merge`. Update 58-VALIDATION.md Wave-4 rows ⬜ → ✅.
</action>
<verify>
<automated>gh pr list --state merged --head phase-58/wave-4-dossier-rail --json number,title,mergedAt | grep -q 'wave-4-dossier-rail'</automated>
</verify>
<acceptance_criteria> - PR opened with correct title; 8 CI contexts pass; merged with `--merge`; 58-VALIDATION.md updated
</acceptance_criteria>
<done>Wave-4 merged; Wave 5 may branch off latest main.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                               | Description                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| dev machine → dossier rail (most user-visible surface) | High-impact swaps; chromatic-watch required for CustomNodes.tsx |
| dev machine → main branch                              | PR-only; 8 CI contexts                                          |

## STRIDE Threat Register

| Threat ID  | Category  | Component                            | Disposition | Mitigation Plan                                                                                                         |
| ---------- | --------- | ------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| T-58-04-01 | Tampering | Dossier-type color sets              | mitigate    | Use `getDossierTypeBadgeClass` from `semantic-colors.ts` (canonical); no parallel maps                                  |
| T-58-04-02 | Tampering | CustomNodes.tsx (68 disables)        | mitigate    | Chromatic-watch in dossier-drawer-visual; manual inspection of regenerated PNGs; flag in PR body if regression detected |
| T-58-04-03 | Tampering | D-07 collision files                 | mitigate    | Manifest flags collision; purple → secondary, blue → accent enforced per dossier-type                                   |
| T-58-04-04 | Tampering | dossier-drawer + dashboard baselines | mitigate    | LTR≠RTL byte-distinction check; same-PR regen                                                                           |

</threat_model>

<verification>
- TOKEN-01: zero `Phase 51 Tier-C` markers in Wave-4 file set
- D-04: ~25 atomic per-file commits
- D-06/D-07: dossier-type purple-family on `bg-secondary`/`text-secondary-foreground`/`border-secondary` (collision rule)
- D-12: 2 visual baselines regenerated; LTR≠RTL preserved
- CustomNodes.tsx chromatic-watch evidence in PR body
</verification>

<success_criteria>
Wave 4 complete when: PR merged with ~25 atomic per-file commits; dossier-rail surface (`components/dossier*`, `components/dossiers/`) has zero `Phase 51 Tier-C`; `pnpm lint && pnpm type-check && pnpm test:unit` exit 0; dossier-drawer + dashboard baselines regenerated with LTR≠RTL byte-distinction; CustomNodes.tsx chromatic-watch documented.
</success_criteria>

<output>
Create `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-04-SUMMARY.md` after merge. SUMMARY captures: files swapped, `getDossierTypeBadgeClass` reuse count, D-07 collision count, CustomNodes.tsx chromatic-watch outcome, per-file commit SHAs, visual baseline regen evidence, links to PR + merge commit, Wave 4 → Wave 5 handoff.
</output>
</output>
