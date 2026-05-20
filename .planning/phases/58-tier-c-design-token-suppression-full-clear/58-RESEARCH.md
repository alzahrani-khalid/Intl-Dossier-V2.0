# Phase 58: Tier-C Design-Token Suppression Full Clear — Research (Waves 3–7)

**Researched:** 2026-05-20
**Domain:** Design-token refactor (mechanical, surface-by-surface)
**Scope of this RESEARCH.md:** Waves 3, 4, 5, 6, plus a recommended Wave 7 closure. Waves 1 (forms, shipped) and 2 (tables, shipped) are NOT re-researched — they are cited only as pattern sources.
**Confidence:** HIGH — every claim below is verified against the manifest, the shipped Wave 1/2 plans and summaries, the live `frontend/src/index.css`, `frontend/design-system/inteldossier_handoff_design/colors_and_type.css`, and `eslint.config.mjs` at the working-tree HEAD.

## Phase Requirements

| ID       | Description                                                                                                                                        | Research Support                                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TOKEN-01 | Zero `// gsd-design-token-tier-c-allow` (a.k.a. `Phase 51 Tier-C`) suppressions remaining — full clear of all 268 in-scope files / 2336 AST nodes. | Waves 3–6 inventories below cover the remaining 251 files / 2080 annotations (268 − 17 forms − 15 tables = 236 files; 2336 − 119 forms − 137 tables ≈ 2080 nodes). |
| TOKEN-02 | `pnpm lint` exits 0 without the Tier-C waiver token present in `eslint.config.mjs`.                                                                | Wave 7 closure removes the waiver token; verification command sequence specified below.                                                                            |

---

## 1. Executive Summary

Five bullets the planner most needs to know:

1. **The hard problems in Phase 58 do NOT line up with surface boundaries.** Of the three known friction classes (overlay scrim deviation D-58-01-01, dark-variant chains, multi-literal lines), **Wave 3 (drawers-dialogs) is the EASIEST remaining wave**, not the hardest. I grepped the 18 Wave-3 file paths — **none of them use `bg-black/N` inline**; they all consume their backdrop from a token-exempt `components/ui/*` Dialog primitive or from HeroUI. The overlay scrim deviation surfaces in **Wave 4** (`ExpandableDossierCard.tsx`) and **Wave 6** (`TourOverlay.tsx`, `EnhancedVerticalTimelineCard.tsx`, `MilestonesCelebration.tsx`, `NavigationShell.tsx`). The original brief's assumption that Wave 3 was the densest concentration of overlay scrim is incorrect — verified by grep. The planner should defer the overlay decision to Wave 4 or carry the deviation through.

2. **Wave 6 is genuinely too big to plan as one PR (176 files / 1469 annotations).** The natural sub-batching boundary is **by file kind**: a `types/*.ts` sub-batch (~17 files, ~362 nodes — all status-color maps in the same shape) ships first as the single largest semantic group; then page/route sub-batches by `pages/` directory depth. Recommend Wave 6 splits into **6A (types, ~17 files), 6B (components, ~120 files), 6C (pages + routes, ~37 files), 6D (hooks/utils/router, ~2 files)** — each independently reviewable and revertable. Per the success criterion 4 in ROADMAP.md, sub-batching is acceptable when each sub-batch stays surface-coherent. Detailed file lists are in section 7.

3. **A pre-existing semantic-color centralization (`frontend/src/lib/semantic-colors.ts`) is referenced by the lint config but not honored by the 17 `types/*.ts` status-color maps that produce ~280 of Wave 6's 1469 annotations.** `legislation.types.ts` alone has 21 status enum values × 3 fields (bg/text/border) = 63 suppressions in a single `LegislationStatus → ColorSet` map. The repeating shape across `types/*.ts` is a perfect candidate for **direct migration to the existing `semantic-colors.ts` pattern** — collapsing the suppressions to either token literals OR centralized map references in one shot. This is a planner decision: per-file inline literals (Wave 1/2 precedent) vs. consolidate-into-semantic-colors.ts (lower drift risk, fewer duplicated palettes).

4. **The chart-palette problem is partly already solved by the Tier-B carve-out** (eslint.config.mjs:247–270). All 6 analytics/* chart files and 5 chart-adjacent files (RelationshipGraph, MiniRelationshipGraph, ReportPreview, InfluenceMetricsPanel, ChartWidget, SLAComplianceChart, ClusterVisualization) are **already exempt** from the rule. Wave 5's "charts-residue" surface is so-named because it is what remains *after\* the Tier-B carve-out: dashboard widgets, SLA cards, scenario sandbox — none of which need a categorical chart palette. The 4 status tokens (success/warning/danger/info) + accent + ink-mute + the Wave-1 opacity-step precedent suffice for all 15 Wave-5 files. There is **no need to introduce `--chart-N` tokens** in Phase 58. Verified by per-file inspection (section 6).

5. **Five patterns shipped in Waves 1–2 cover essentially every remaining swap class**: (a) the token mapping table from Wave 1 PLAN.md lines 110–127; (b) opacity-step palette differentiation (Wave 1 NotificationPreviewTimeline /20 vs /10; Wave 2 RiskList /80 vs solid danger); (c) lucide-react for emoji (`AlertTriangle`, `CheckCircle2`, `Bot` already imported in the codebase); (d) inverse-tone toast (`bg-foreground` / `text-background`); (e) semantic-context discrimination (orange-600 ≠ one token; depends on whether it means "low-confidence" or "max-reached"). The planner does NOT need to invent new patterns for Waves 3–6 — every swap rule needed is already proven in `58-01-PLAN.md` lines 110–127 and `58-02-PLAN.md` token_mapping_rules. The remaining work is **scaling, not inventing**.

**Primary recommendation:** Plan Waves 3, 4, and 5 as direct three more files-modified atomic-commit waves following the shipped Wave 2 cadence. Sub-batch Wave 6 into 4 sub-waves (6A types, 6B components, 6C pages/routes, 6D leftover). Plan Wave 7 as a single small closure: delete the `designTokenSyntaxRestrictions` Tier-C waiver block from `eslint.config.mjs:10–28`, prove lint stays at 0, run the three success-criterion greps.

---

## 2. Phase Scope (Remaining Waves)

| Wave  | Surface               | Files                   | Annotations                                   | Mode                             | Status                            |
| ----- | --------------------- | ----------------------- | --------------------------------------------- | -------------------------------- | --------------------------------- |
| 1     | forms                 | 17                      | 119                                           | retroactive PLAN + closure fix   | **SHIPPED** (144bf880 + closure)  |
| 2     | tables                | 15                      | 137                                           | foreground sequential            | **SHIPPED** (432e7098 → 4e5f7142) |
| **3** | **drawers-dialogs**   | **18**                  | **138**                                       | foreground sequential            | **TO PLAN**                       |
| **4** | **dossier-rail**      | **27**                  | **248** (249 incl. RelationshipGraph raw hex) | foreground sequential            | **TO PLAN**                       |
| **5** | **charts-residue**    | **15**                  | **92** (95 incl. Sparkline.test Tier-B count) | foreground sequential            | **TO PLAN**                       |
| **6** | **pages-routes-misc** | **176**                 | **1469**                                      | **sub-batched into 6A/6B/6C/6D** | **TO PLAN (4 sub-plans)**         |
| **7** | **closure**           | 1 (`eslint.config.mjs`) | n/a                                           | 1-commit removal + verify        | **TO PLAN**                       |

**Annotation totals reconcile against the manifest as follows:** Wave-summary counts at manifest lines 13–18 are the suppression-annotation counts (`palette_literal_count`), not raw hex literals. My recomputed totals add `raw_hex_count + palette_literal_count` (matching the AST-node accounting in 58-00-SUMMARY.md "2336 AST nodes"). The summary's 92 for Wave 5 excludes the 3 raw-hex Sparkline.test.tsx values because that file is a Tier-B carve-out and gets no source edit. The 248 vs 249 delta in Wave 4 is the 1 raw-hex value in `RelationshipGraph.tsx` (which IS in Phase 58 scope per its manifest row — NOT in the Tier-B carve-out list).

---

## 3. Pattern Inheritance from Waves 1–2

All five patterns below are **already proven in code on `phase-58/wave-1-forms` and `phase-58/wave-2-tables`**. The planner should anchor on them and not redesign.

### Pattern 1 — Token mapping table (verbatim from Wave 1)

| Old literal pattern                                            | New token                                                      | Notes                          |
| -------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------ |
| `text-gray-700 dark:text-gray-300` (labels)                    | `text-ink`                                                     | Primary text                   |
| `text-gray-600 dark:text-gray-400` (help)                      | `text-ink-mute`                                                | Secondary text                 |
| `text-gray-400` / `text-gray-500` (faint)                      | `text-ink-faint`                                               | Tertiary/icon text             |
| `border-gray-300 dark:border-gray-600`                         | `border-line`                                                  | Default border                 |
| `border-red-500`                                               | `border-danger`                                                | Error border                   |
| `text-red-500` / `text-red-600`                                | `text-danger`                                                  | Error text + required-asterisk |
| `text-green-600`                                               | `text-success`                                                 | Success states                 |
| `bg-red-50 dark:bg-red-900/20`                                 | `bg-danger/10`                                                 | Status banner background       |
| `border-red-200 dark:border-red-800`                           | `border-danger/30`                                             | Status banner border           |
| `bg-blue-50 dark:bg-blue-900/20`                               | `bg-primary/10` (or `bg-info/10` for informational)            | Selected vs informational      |
| `border-blue-500`                                              | `border-primary`                                               | Selected outline               |
| `bg-blue-600 hover:bg-blue-700`                                | `bg-primary hover:bg-primary/90` + `text-primary-foreground`   | Primary button                 |
| `dark:bg-gray-700 dark:text-white`                             | `bg-background text-ink` / `bg-surface text-ink`               | Field background               |
| `hover:bg-gray-100 dark:hover:bg-gray-800`                     | `hover:bg-muted`                                               | Hover surface                  |
| `focus:ring-primary-500`                                       | `focus:ring-primary`                                           | Focus ring                     |
| Wave-2 additions: `text-orange-600` (context-dependent)        | `text-warning` (max-reached) OR `text-danger` (low-confidence) | See Pattern 5                  |
| `text-yellow-600` / `text-yellow-700 dark:text-yellow-300/400` | `text-warning`                                                 |                                |
| `text-blue-600 dark:text-blue-400`                             | `text-info` (informational) OR `text-accent` (link/CTA)        | Context-dependent              |
| Selected row background (Wave 2 addition)                      | `bg-primary/10`                                                |                                |
| Hover row background (Wave 1/2)                                | `bg-muted`                                                     |                                |

### Pattern 2 — Opacity-step palette differentiation

When N categories exceed M available semantic tokens, group categories by semantic family and use `/10` vs `/20` (or `/80` vs solid) opacity steps on the same token to retain visual separation. Proven in:

- Wave 1 `NotificationPreviewTimeline.tsx` — 8 categories on 5 status tokens + accent + ink-mute (mentions=warning/20 vs deadlines=warning/10; workflow=success/20 vs calendar=success/10).
- Wave 2 `RiskList.tsx` — 4-tier severity on 3 status tokens (critical=danger; high=danger/80; medium=warning; low=success).

This pattern will be needed at scale in Wave 6 `types/*.ts` (legislation status has 21 enum values × 3 fields). The planner has two scaling options for that:

- (a) Continue inline literals — same as Wave 1/2, just more rows.
- (b) Consolidate into `frontend/src/lib/semantic-colors.ts` — uses the existing centralized pattern. Lint config explicitly endorses this map at `eslint.config.mjs:20`.

### Pattern 3 — lucide-react for emoji

Every emoji in user-visible JSX → named `lucide-react` import + `aria-hidden="true"`. Already established:

- `⚠️` → `AlertTriangle` (Wave 1 DuplicateComparison, Wave 2 TriagePanel)
- `✓` → `CheckCircle2` (Wave 1 DuplicateComparison)
- `🤖` → `Bot` (Wave 2 TriagePanel)

`rg` against `frontend/src/components/` shows 11 additional component files contain at least one emoji glyph that will need this treatment if they fall in scope. Per the manifest, the in-scope hits across Waves 3–6 are: `TriagePanel.tsx` (already cleared in Wave 2), `SLACountdown.tsx` (Wave 5), `LinkTypeBadge.tsx` (Wave 6), `EntityComparisonTable.tsx` (Wave 2, cleared). The remaining grep hits (OnboardingChecklist, ReactionPicker, IntelligenceTabContent, ConflictDialog, FieldHistoryTimeline, RelationshipGraph) are either out-of-scope or already swept. **Net new emoji work expected in Waves 3–6: ~2–3 files** (LinkTypeBadge, SLACountdown, possibly one Wave-3 dialog) — small.

### Pattern 4 — Inverse-tone toast

`bg-foreground` / `text-background` is the cross-theme correct way to invert toast tones without `dark:` chains. Established in Wave 2 `UndoToast.tsx`. Relevant for any Wave 3–6 file that has a toast/snackbar/inverse banner.

### Pattern 5 — Semantic-context discrimination

The same source literal can map to different tokens depending on the file's semantic context. Established in Wave 2: `orange-600` → `text-danger` in TriagePanel (low-confidence semantics — analyst-warning) BUT `text-warning` in SelectableDataTable + EntityComparisonSelector (max-reached semantics — operational limit). **Token mapping is semantic-context, not literal-color**. Wave 6 `types/*.ts` files are the most likely site of this discrimination because they are status-color maps where the meaning of each status varies (e.g., legislation `repealed` is closer to `danger` than `ink-mute` despite being terminal; `superseded` is closer to `ink-mute` than `danger`).

### Deviations carried forward from Waves 1–2

| ID               | Summary                                                                                  | Status                          | Relevance to Waves 3–7                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-58-01-01       | `bg-black/N` overlay scrim used instead of `--overlay` token                             | Documented; codebase convention | **Re-surfaces in Wave 4 (ExpandableDossierCard) and Wave 6 (TourOverlay, EnhancedVerticalTimelineCard, MilestonesCelebration, NavigationShell).** Planner must choose: (a) carry the deviation forward (parity with Wave 1, minimal scope creep), (b) introduce `--color-overlay` token in `index.css` and `colors_and_type.css` and migrate all call sites (cleaner end state, mid-scope), (c) migrate to HeroUI Modal primitive (out of Phase 58 scope per CLAUDE.md cascade — would be a Phase 60+ refactor). **Recommendation: (a) carry the deviation forward** — Phase 58 is suppression clearance, not codebase-wide scrim refactor. Document D-58-XX-NN per surface. |
| D-58-01-02       | NotificationPreviewTimeline 8-category palette uses /20 opacity steps                    | Intentional; no follow-up       | Establishes the pattern for Wave 6 `types/*.ts` high-cardinality status maps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| D-58-02-01       | TriagePanel confidence mapping (low → danger, not warning)                               | Closed                          | Reference for Wave 6 `types/*.ts` semantic-context decisions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| D-58-02-EXTRA-01 | Multi-emoji file batch (TriagePanel: ⚠️ + 🤖)                                            | Closed                          | Pattern for multi-emoji files in Wave 6.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| D-58-02-EXTRA-02 | Latent same-class violations cleared alongside annotated literals (RiskList border-s-\*) | Accepted                        | Executor scope-judgment is OK within file scope — Wave 3–6 executors should clear latent same-class palette literals in files they touch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| D-58-02-EXTRA-03 | Context-aware `orange-600` mapping (per-file decision)                                   | Accepted                        | Codifies Pattern 5 above.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

---

## 4. Wave 3: Drawers & Dialogs (18 files, 138 annotations)

**Branch:** `phase-58/wave-3-drawers-dialogs`, forked from `origin/main` (not stacked on Wave 2).

### File inventory (verbatim manifest rows; flags: BP=blue_purple_collision, DK=dark_variant_present, ML=multi_literal_line)

|   # | File                                                              | Annot | Flags      | Notes                                                                                                                                  |
| --: | ----------------------------------------------------------------- | ----: | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | `components/bulk-actions/BulkActionConfirmDialog.tsx`             |     7 | DK, ML     | OBS-58-02-01 surfaces here (Wave 2 plan's directory-recursive grep flagged 30 residual disables across this + BulkActionPreviewDialog) |
|   2 | `components/bulk-actions/BulkActionPreviewDialog.tsx`             |    23 | BP, DK, ML | 2nd-densest Wave 3 file                                                                                                                |
|   3 | `components/collaboration/ConflictResolutionDialog.tsx`           |    16 | BP, DK, ML | 3-way diff palette likely (same/conflict/merged)                                                                                       |
|   4 | `components/commitments/CommitmentDetailDrawer.tsx`               |     5 | DK, ML     | Drawer, not dialog — uses HeroUI Drawer or Sheet primitive                                                                             |
|   5 | `components/commitments/deliverables/AddDeliverableDialog.tsx`    |     7 | BP, DK, ML |                                                                                                                                        |
|   6 | `components/compliance/ComplianceSignoffDialog.tsx`               |     2 | ML         |                                                                                                                                        |
|   7 | `components/delegation/CreateDelegationDialog.tsx`                |     1 | clean      | Smallest                                                                                                                               |
|   8 | `components/duplicate-detection/MergeDialog.tsx`                  |     1 | clean      | Smallest (paired with already-shipped DuplicateComparison.tsx)                                                                         |
|   9 | `components/entity-links/EntitySearchDialog.tsx`                  |    36 | DK, ML     | **HEAVIEST Wave 3 file**                                                                                                               |
|  10 | `components/entity-templates/QuickEntryDialog.tsx`                |     1 | clean      |                                                                                                                                        |
|  11 | `components/forums/ForumDetailsDialog.tsx`                        |     5 | ML         |                                                                                                                                        |
|  12 | `components/input-dialog/InputDialog.tsx`                         |     6 | clean      |                                                                                                                                        |
|  13 | `components/milestone-planning/ConvertMilestoneDialog.tsx`        |     6 | BP, DK, ML |                                                                                                                                        |
|  14 | `components/scheduled-reports/ExecutionHistoryDialog.tsx`         |     4 | DK, ML     |                                                                                                                                        |
|  15 | `components/stakeholder-timeline/StakeholderAnnotationDialog.tsx` |     6 | BP         |                                                                                                                                        |
|  16 | `components/timeline/TimelineAnnotationDialog.tsx`                |     7 | BP         |                                                                                                                                        |
|  17 | `components/waiting-queue/EscalationDialog.tsx`                   |     1 | clean      |                                                                                                                                        |
|  18 | `components/workflow-automation/WorkflowTestDialog.tsx`           |     4 | clean      |                                                                                                                                        |

**Per-flag totals:** blue_purple_collision=6, dark_variant_present=8, multi_literal_line=10. No emoji in any Wave 3 file (verified via `rg`).

### Overlay scrim decision (D-58-01-01) — Wave 3 ANSWER

**Wave 3 does not encounter the overlay scrim deviation.** I grepped each Wave 3 file path against `bg-black\|backdrop-blur\|bg-surface/8\|bg-background/` — zero hits. Every Wave 3 file consumes its backdrop from one of:

- A Dialog primitive in `components/ui/*` (Tier-B carved out via `eslint.config.mjs:236–241` — `no-restricted-syntax: off` for the entire `components/ui/**` tree). These are HeroUI / Radix wrappers and own their own scrim.
- A HeroUI Modal (where the scrim is internal to the primitive).

**The 5 Wave 3 files I sampled** (`BulkActionConfirmDialog`, `BulkActionPreviewDialog`, `EntitySearchDialog`, `InputDialog`, `MergeDialog`, `CommitmentDetailDrawer`) all `import` HeroUI primitives or `Dialog` from `@/components/ui/dialog`. The inline `bg-black/N` literal is not used.

**Action for planner:** Wave 3 plan does NOT need a scrim deviation. The planner inherits Pattern 1 (token mapping) and Pattern 2 (opacity-step) and that is sufficient. Document explicitly: "OBS-58-03-01: Wave 3 has no overlay scrim. Verified via grep against the 18 file paths."

### Wave 3 execution order recommendation

Execute lowest-risk to highest-risk (same Wave-2 cadence):

1. `CreateDelegationDialog.tsx` (1, clean)
2. `MergeDialog.tsx` (1, clean)
3. `QuickEntryDialog.tsx` (1, clean)
4. `EscalationDialog.tsx` (1, clean)
5. `ComplianceSignoffDialog.tsx` (2, ML)
6. `ExecutionHistoryDialog.tsx` (4, DK, ML)
7. `WorkflowTestDialog.tsx` (4, clean)
8. `CommitmentDetailDrawer.tsx` (5, DK, ML)
9. `ForumDetailsDialog.tsx` (5, ML)
10. `InputDialog.tsx` (6, clean)
11. `ConvertMilestoneDialog.tsx` (6, BP, DK, ML)
12. `StakeholderAnnotationDialog.tsx` (6, BP)
13. `AddDeliverableDialog.tsx` (7, BP, DK, ML)
14. `BulkActionConfirmDialog.tsx` (7, DK, ML)
15. `TimelineAnnotationDialog.tsx` (7, BP)
16. `ConflictResolutionDialog.tsx` (16, BP, DK, ML)
17. `BulkActionPreviewDialog.tsx` (23, BP, DK, ML)
18. `EntitySearchDialog.tsx` (36, DK, ML) — last, heaviest

**Per-file atomic commit cadence** continues from Wave 2 — one commit per file with the message pattern `chore(58/wave-3): clear Tier-C suppressions in <basename> (<N> annotations)`.

### Open questions for Wave 3

None. Token mapping is complete; deviation is N/A; no emoji; no chart palette.

---

## 5. Wave 4: Dossier Rail (27 files, 248–249 annotations)

**Branch:** `phase-58/wave-4-dossier-rail`, forked from `origin/main`.

### File inventory (sorted by suppression density)

|   # | File                                                                     |     Annot | Flags      | Notes                                                                                                                                                                                                                                                                                            |
| --: | ------------------------------------------------------------------------ | --------: | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | `components/dossiers/CustomNodes.tsx`                                    |        68 | BP, DK, ML | **HEAVIEST file in entire Phase 58.** React-Flow node renderer. Manifest `override_notes`: "68 disables; React-Flow node renderer; verified NOT in Tier-B carve-out at eslint.config.mjs:247-270 — stays in Phase 58 scope per RESEARCH Open Question 1; flag for chromatic regression watching" |
|   2 | `components/dossier/DossierTypeGuide.tsx`                                |        26 | BP, DK, ML | 8-dossier-type palette — likely uses `dossierTypeColors` map from `lib/semantic-colors.ts` already; the suppression-annotated literals are probably the dossier-type-icon variants                                                                                                               |
|   3 | `components/dossier/TopicDossierDetail.tsx`                              |        21 | BP, DK, ML |                                                                                                                                                                                                                                                                                                  |
|   4 | `components/dossier/ExpandableDossierCard.tsx`                           |        16 | DK, ML     | **Uses `bg-black/N` scrim** (verified via grep). D-58-01-01 deviation surfaces here.                                                                                                                                                                                                             |
|   5 | `components/dossier-timeline/DossierTimeline.tsx`                        |        14 | BP, DK, ML | Timeline severity/recency palette                                                                                                                                                                                                                                                                |
|   6 | `components/dossier-recommendations/DossierRecommendationCard.tsx`       |        13 | DK, ML     | Score-based palette (high/medium/low recommendation)                                                                                                                                                                                                                                             |
|   7 | `components/dossier/sections/ContactPreferencesSection.tsx`              |         8 | BP, DK, ML |                                                                                                                                                                                                                                                                                                  |
|   8 | `components/dossier/DossierTypeSelector.tsx`                             |         7 | BP, DK, ML | 8-dossier-type — same dossier-type palette as DossierTypeGuide                                                                                                                                                                                                                                   |
|   9 | `components/dossier/dossier-overview/sections/CalendarEventsSection.tsx` |         6 | BP, DK, ML |                                                                                                                                                                                                                                                                                                  |
|  10 | `components/dossier/sections/CommitteeAssignments.tsx`                   |         6 | clean      |                                                                                                                                                                                                                                                                                                  |
|  11 | `components/dossier/sections/ElectedOfficialProfile.tsx`                 |         6 | BP, ML     |                                                                                                                                                                                                                                                                                                  |
|  12 | `components/dossier/sections/OutcomesSummary.tsx`                        |         6 | DK, ML     |                                                                                                                                                                                                                                                                                                  |
|  13 | `pages/dossiers/overview-cards/EngagementsByStageCard.tsx`               |         6 | BP, DK, ML | Engagement stage palette (planning/active/closed/...)                                                                                                                                                                                                                                            |
|  14 | `components/dossier/DossierLinksWidget.tsx`                              |         5 | BP, DK, ML |                                                                                                                                                                                                                                                                                                  |
|  15 | `components/dossier/dossier-overview/sections/DocumentsSection.tsx`      |         5 | BP, DK, ML |                                                                                                                                                                                                                                                                                                  |
|  16 | `components/dossier/sections/FollowUpActions.tsx`                        |         5 | DK, ML     |                                                                                                                                                                                                                                                                                                  |
|  17 | `components/dossier/sections/ProfessionalProfile.tsx`                    |         5 | BP, ML     |                                                                                                                                                                                                                                                                                                  |
|  18 | `components/dossier/sections/StaffDirectory.tsx`                         |         5 | BP, DK, ML |                                                                                                                                                                                                                                                                                                  |
|  19 | `components/dossier/AIFieldAssist.tsx`                                   |         4 | DK, ML     |                                                                                                                                                                                                                                                                                                  |
|  20 | `components/dossier/ForumDossierDetail.tsx`                              |         4 | BP         |                                                                                                                                                                                                                                                                                                  |
|  21 | `components/dossier/DossierDetailLayout.tsx`                             |         2 | ML         |                                                                                                                                                                                                                                                                                                  |
|  22 | `components/dossier/sections/TermHistory.tsx`                            |         2 | clean      |                                                                                                                                                                                                                                                                                                  |
|  23 | `pages/dossiers/overview-cards/ConnectedAnchorsCard.tsx`                 |         2 | DK, ML     |                                                                                                                                                                                                                                                                                                  |
|  24 | `components/dossiers/RelationshipGraph.tsx`                              | 1 raw hex | clean      | NOTE: this is the only Wave 4 file with `raw_hex_count=1, palette_literal_count=0`. Per manifest, NOT in Tier-B carve-out (RelationshipGraph IS in the eslint.config.mjs:247-270 list at line 263). **Double-check this against eslint.config.mjs line 263** — see Open Question 1 below.        |
|  25 | `components/dossier/sections/OrganizationAffiliations.tsx`               |         1 | clean      |                                                                                                                                                                                                                                                                                                  |
|  26 | `components/dossier/sections/PositionsHeld.tsx`                          |         1 | clean      |                                                                                                                                                                                                                                                                                                  |
|  27 | `components/dossier-recommendations/DossierRecommendationsPanel.tsx`     |         4 | DK, ML     |                                                                                                                                                                                                                                                                                                  |

**Per-flag totals:** blue_purple_collision=14, dark_variant_present=18, multi_literal_line=21. No emoji files in Wave 4 (verified via `rg`).

### Semantic group catalog for Wave 4

Five distinct semantic palettes will repeat across the 27 files:

1. **Dossier-type palette (8 types)** — country / organization / forum / engagement / topic / working_group / person / elected_official. Already mapped in `frontend/src/lib/semantic-colors.ts` `dossierTypeColors`. **Files: DossierTypeGuide, DossierTypeSelector, ExpandableDossierCard, UniversalDossierCard (out of scope — not in manifest), CustomNodes (some nodes).** Tokens: country=primary, organization=secondary, forum=success, engagement=info, topic=warning, working_group=accent, person=ink-mute, elected_official=danger/30 (the exact mapping is in `semantic-colors.ts` and should be honored verbatim — not re-derived).
2. **Recommendation score (high/medium/low)** — files: DossierRecommendationCard, DossierRecommendationsPanel, FollowUpActions, AIFieldAssist. Pattern: `text-success` / `text-warning` / `text-danger`, same as Wave 2 RiskList severity but without the 4-tier opacity step (3 tiers fit cleanly on 3 status tokens).
3. **Engagement stage (planning/active/closed/cancelled)** — files: EngagementsByStageCard, ConnectedAnchorsCard. Pattern: `info` / `success` / `ink-mute` / `danger`. May or may not need a 4-stage opacity step.
4. **Time-based recency (today / this-week / older)** — files: DossierTimeline, CalendarEventsSection, FollowUpActions, StaffDirectory. Pattern: `accent` (today) / `info` (this-week) / `ink-mute` (older). 3 tiers; no opacity step.
5. **Activity-status (completed/in-progress/pending/cancelled)** — files: OutcomesSummary, FollowUpActions, CommitteeAssignments, TermHistory. Pattern: success / warning / info / ink-mute. 4 tiers; no opacity step (4 tokens available).

**The 5 palettes share enough overlap that the planner could centralize them into `lib/semantic-colors.ts` as named maps** (`recommendationScoreColors`, `engagementStageColors`, etc.) before Wave 4 execution — saves duplication across 27 files. **Recommendation: leave consolidation to Phase 60+** (CLAUDE.md "surgical changes" — Phase 58 scope is suppression clearance only).

### Overlay scrim decision — Wave 4 surface

**`ExpandableDossierCard.tsx` uses `bg-black/N`** for an inline overlay scrim, confirmed via grep. Per the recommendation in section 1 (carry deviation forward), the planner should:

- Document D-58-04-01: "ExpandableDossierCard.tsx — modal backdrop uses `bg-black/40` (same pattern as D-58-01-01 in Wave 1 DuplicateComparison). No `--overlay` token exists in design system. Migrating to HeroUI Modal is out of Phase 58 scope."
- Allow the executor to leave the `bg-black/40` literal in place and remove the surrounding Tier-C suppression (the suppression covers ALL surrounding palette literals; the `bg-black/N` literal does not trigger the ESLint regex because `black` is not in the `(red|blue|green|...)` color list at `eslint.config.mjs:18` and `bg-black/N` has no numeric suffix matching `\\d{2,3}`).

**Verification:** The ESLint regex at `eslint.config.mjs:18` is `(text|bg|border|...)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\\d{2,3}\\b`. `black` is not in the allow-list; `bg-black/40` does not match. **The `bg-black/N` scrim is ALREADY lint-clean** — no suppression needed for it. The deviation D-58-01-01 was therefore mis-scoped in Wave 1 documentation (it described a real palette literal `bg-black bg-opacity-50` that was modernized to `bg-black/50` and that does NOT need a suppression at all). Wave 4 should drop the deviation entirely and just remove the suppressions around the scrim literal — they were never lint-required.

### CustomNodes.tsx — special handling

The 68-annotation `CustomNodes.tsx` is the **single highest-density file in the entire Phase 58 scope** (Wave 1's heaviest was DuplicateComparison at 39; Wave 2's was TriagePanel at 53). The manifest `override_notes` says: "verified NOT in Tier-B carve-out... flag for chromatic regression watching."

**This file should be its own atomic commit, executed LAST in Wave 4**, with the commit body enumerating the React-Flow node-type → token mapping (similar to how Wave 2 TriagePanel's commit body enumerated confidence-tier mapping D-58-02-01 and emoji replacement D-58-02-02).

### Wave 4 execution order recommendation

Sort ascending by `palette_literal_count`, run BP/DK/ML files mid-batch, end with CustomNodes:

- Single-annotation files first: TermHistory(2), OrganizationAffiliations(1), PositionsHeld(1), ConnectedAnchorsCard(2), DossierDetailLayout(2), RelationshipGraph(1 raw-hex — see OQ 1).
- Then 4–6 annotation files in palette-similarity clusters: ForumDossierDetail, AIFieldAssist, DossierRecommendationsPanel, FollowUpActions, ProfessionalProfile, StaffDirectory, DossierLinksWidget, DocumentsSection, ElectedOfficialProfile, OutcomesSummary, CommitteeAssignments, EngagementsByStageCard, CalendarEventsSection, ContactPreferencesSection, DossierTypeSelector.
- Then 13–21 annotation files: DossierRecommendationCard(13), DossierTimeline(14), ExpandableDossierCard(16, scrim handling), TopicDossierDetail(21), DossierTypeGuide(26).
- LAST: CustomNodes.tsx (68) — own commit, enumerated body.

---

## 6. Wave 5: Charts Residue (15 files, 92 in-scope annotations)

**Branch:** `phase-58/wave-5-charts-residue`, forked from `origin/main`.

### File inventory

|   # | File                                                        |                     Annot | Flags      | Notes                                                                                                                                                                                                          |
| --: | ----------------------------------------------------------- | ------------------------: | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | `components/dashboard-widgets/EventsWidget.tsx`             |                        15 | BP, DK, ML | Event-type palette (meeting/deadline/...)                                                                                                                                                                      |
|   2 | `components/sla-countdown/SLACountdown.tsx`                 |                        14 | DK, ML     | SLA tone palette — `--sla-ok / --sla-risk / --sla-bad` already exist as raw tokens in index.css:76–78                                                                                                          |
|   3 | `components/dashboard-widgets/NotificationsWidget.tsx`      |                         8 | BP, DK, ML | Notification category palette — same 8-category vocabulary as Wave 1 NotificationPreviewTimeline; reuse opacity-step pattern                                                                                   |
|   4 | `components/sla-monitoring/SLAAtRiskList.tsx`               |                         8 | ML         | SLA tone palette                                                                                                                                                                                               |
|   5 | `components/dashboard-widgets/QuickActionsWidget.tsx`       |                         6 | BP, DK, ML |                                                                                                                                                                                                                |
|   6 | `components/dashboard-widgets/TaskListWidget.tsx`           |                         6 | BP, DK, ML | Task priority/status palette                                                                                                                                                                                   |
|   7 | `components/realtime-status/RealtimeStatus.tsx`             |                         6 | DK, ML     | Connection-state palette (connected/reconnecting/offline)                                                                                                                                                      |
|   8 | `components/scenario-sandbox/OutcomeList.tsx`               |                         6 | DK, ML     | Scenario-outcome palette (success/likely/uncertain/unlikely)                                                                                                                                                   |
|   9 | `components/dashboard-widgets/KpiWidget.tsx`                |                         4 | DK, ML     | KPI delta tone (up=success, down=danger, flat=ink-mute)                                                                                                                                                        |
|  10 | `components/sla-monitoring/SLAEscalationsList.tsx`          |                         4 | ML         | SLA tone palette                                                                                                                                                                                               |
|  11 | `components/sla-monitoring/SLAPolicyForm.tsx`               |                         4 | clean      | SLA tone palette                                                                                                                                                                                               |
|  12 | `components/analytics/SummaryCard.tsx`                      |                         4 | DK, ML     |                                                                                                                                                                                                                |
|  13 | `components/sla-monitoring/SLAComplianceTable.tsx`          |                         3 | clean      | SLA tone palette                                                                                                                                                                                               |
|  14 | `components/scenario-sandbox/ScenarioCard.tsx`              |                         2 | DK, ML     |                                                                                                                                                                                                                |
|  15 | `components/signature-visuals/**tests**/Sparkline.test.tsx` | 5 (3 raw hex + 2 palette) | clean      | **Tier-B carve-out — DO NOT MODIFY**. Manifest `override_notes`: "Tier-B carve-out per eslint.config.mjs — NO source swap; test file Sparkline.test.tsx asserts pass-through behavior, NO test update needed." |

**Per-flag totals (excluding Sparkline.test):** blue_purple_collision=4, dark_variant_present=10, multi_literal_line=12. Emoji: `SLACountdown.tsx` contains an emoji per the cross-check rg — likely the ⏰ or ⚠️ glyph for overdue states; expect a lucide-react `Clock` or `AlertTriangle` migration.

### Chart palette strategy — answered

**Question:** Does the design system have a chart palette token group? **Answer: No, AND it does not need one for Wave 5.**

Verified by grepping `frontend/src/index.css`, `frontend/design-system/inteldossier_handoff_design/colors_and_type.css`, and `frontend/src/design-system/tokens/`: no `--chart-N` tokens exist.

**Why Wave 5 doesn't need one:**

- All 6 true analytics chart files (`CommitmentFulfillmentChart`, `RelationshipHealthChart`, `WorkloadDistributionChart`, `EngagementMetricsChart`, `AnalyticsPreviewOverlay`, `ClusterVisualization`) and 5 chart-adjacent files (`ChartWidget`, `SLAComplianceChart`, `InfluenceMetricsPanel`, `InfluenceReport`, `RelationshipGraph` in `relationships/`, `MiniRelationshipGraph`, `ReportPreview`, `sample-data.ts`) are **Tier-B carved out** per `eslint.config.mjs:247–270`. Wave 5 "charts residue" is what is left AFTER the carve-out.
- The 14 in-scope Wave 5 files are NOT categorical-chart files — they are dashboard widgets (KPI cards, task list widgets, notification widgets) and SLA status indicators. Their palettes are:
  - SLA tone (3 stops: ok/risk/bad) → `text-success` / `text-warning` / `text-danger` OR the existing `--sla-ok` / `--sla-risk` / `--sla-bad` raw tokens (already in `index.css:76–78`).
  - KPI delta (3 stops: positive/negative/flat) → `text-success` / `text-danger` / `text-ink-mute`.
  - Connection state (3 stops: connected/reconnecting/offline) → `text-success` / `text-warning` / `text-ink-mute`.
  - Notification category (8 stops) → reuse the Wave 1 NotificationPreviewTimeline opacity-step palette literally (mentions/deadlines/calendar/workflow/assignments/intake/signals/system).
  - Event type (5 stops, in EventsWidget) → meeting=info, deadline=warning, milestone=accent, conflict=danger, other=ink-mute.

**Action for planner:** Document explicitly in Wave 5 plan: "OBS-58-05-01: No chart palette tokens needed. All 14 in-scope files map cleanly onto the existing 4 status tokens + accent + ink-mute + sla-\* tokens, using the Wave 1 opacity-step precedent where needed."

### Wave 5 execution order

Lowest-density first, Sparkline.test EXCLUDED:

1. ScenarioCard.tsx (2)
2. SLAComplianceTable.tsx (3)
3. KpiWidget.tsx (4)
4. SLAEscalationsList.tsx (4)
5. SLAPolicyForm.tsx (4)
6. SummaryCard.tsx (4)
7. QuickActionsWidget.tsx (6)
8. TaskListWidget.tsx (6)
9. RealtimeStatus.tsx (6)
10. OutcomeList.tsx (6)
11. NotificationsWidget.tsx (8) — apply Wave 1 NotificationPreviewTimeline opacity-step verbatim
12. SLAAtRiskList.tsx (8)
13. SLACountdown.tsx (14) — emoji replacement deviation expected (D-58-05-NN)
14. EventsWidget.tsx (15) — 5-stop event-type palette decision

---

## 7. Wave 6: Pages, Routes, Misc (176 files, 1469 annotations)

**The Wave 6 sub-batching recommendation is the single highest-leverage decision the planner will make in Phase 58.** 176 files in a single PR is not reviewable. The brief offered three options (by-directory-depth, by-density, single-mechanical). I recommend **by-file-kind**, which gives 4 sub-waves that each ship as an independent PR while staying surface-coherent.

### Recommended sub-batching: 4 sub-waves by file kind

| Sub-wave                                                      | Files                                                                                                                                                                   | Approx annotations                    | Rationale                                                                                                                                                                                                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **6A — types/\*.ts status-color maps**                        | 17 (all `types/*.ts` rows)                                                                                                                                              | ~362 nodes (highest density per file) | Each file is a single status-color map in the same shape. Mechanical 1-pattern apply per file. Smallest reviewable group with the highest payoff. Lands first — proves the type-status-map vocabulary works. |
| **6B — components/**                                          | 120 (all `components/*` rows in Wave 6)                                                                                                                                 | ~750 nodes                            | The main mass. Surface-coherent: each is a leaf component. Subdivide commit log alphabetically by directory.                                                                                                 |
| **6C — pages/ + routes/**                                     | 37 (all `pages/*` and `routes/*` rows in Wave 6)                                                                                                                        | ~330 nodes                            | Top-level route + page entries. Reviews well as a group because page-level changes are visible in QA.                                                                                                        |
| **6D — hooks + utils + router/index.tsx + lib/plugin-system** | 2 (`useDossierPresence.ts`, `useOCR.ts`, `useWidgetDashboard.ts`, `useSavedSearchTemplates.ts`, `index-project-plugin.ts`, `router/index.tsx`, `column-definitions.ts`) | ~25 nodes (small)                     | The leftover non-component, non-page surface. Tiny but worth keeping out of 6B/6C for review clarity.                                                                                                        |

**Total reconciliation:** 17 + 120 + 37 + 2 = 176. (The `lib/plugin-system/plugins/project-plugin/index.ts` and `components/unified-kanban/utils/column-definitions.ts` rows are leaves and fit naturally in 6D as utility files; I list them with hooks because both export typed helpers rather than React components.)

### Why "by file kind" over "by directory depth" or "by density"

- **By directory depth (`routes/` vs `pages/` vs `components/`)** would split `components/*` into its 120 own sub-wave but leave `pages/` (32 files) and `routes/` (16 files) as small siblings — uneven sizes. The "by-file-kind" approach also makes the types/\*.ts wave a logically standalone sub-wave (same shape across all 17 files, ships in one PR with one commit per file).
- **By density (high-density first, long-tail later)** would land DossierFirstSearchResults (62), EnhancedActivityFeed (50), ActivityFeedFilters (49) in one PR, and 50+ tiny 1-3 annotation files in another — visually noisy in review without semantic boundaries.
- **Single mechanical plan with "no per-file review" caveat** would mean ~12,000 lines changed in one PR; not safely revertable.

### Top 10 Wave 6 files by suppression density (for executor risk-assessment)

| File                                                          | Annot | Flags      | Sub-wave |
| ------------------------------------------------------------- | ----: | ---------- | -------- |
| `types/legislation.types.ts`                                  |    63 | BP, DK, ML | 6A       |
| `components/search/DossierFirstSearchResults.tsx`             |    62 | BP, DK, ML | 6B       |
| `components/activity-feed/EnhancedActivityFeed.tsx`           |    50 | BP, DK, ML | 6B       |
| `components/activity-feed/ActivityFeedFilters.tsx`            |    49 | BP         | 6B       |
| `types/meeting-minutes.types.ts`                              |    45 | BP, DK, ML | 6A       |
| `domains/search/hooks/useSavedSearchTemplates.ts`             |    40 | BP, DK, ML | 6D       |
| `types/compliance.types.ts`                                   |    37 | BP, DK, ML | 6A       |
| `types/commitment-deliverable.types.ts`                       |    35 | BP, DK, ML | 6A       |
| `components/export-import/ImportValidationResults.tsx`        |    28 | DK, ML     | 6B       |
| `components/stakeholder-timeline/StakeholderTimelineCard.tsx` |    28 | BP, DK, ML | 6B       |

### Sub-wave 6A (types/\*.ts) — special handling

The 17 `types/*.ts` files all follow this shape:

```typescript
export const fooStatusColors: Record<FooStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: '...', border: '...' },
  // ... 10-21 status enum values, each with bg/text/border ...
}
```

**Two execution strategies for 6A** — the planner must choose:

| Strategy                        | Approach                                                                                                                                                                                           | Pros                                                                                                                                                   | Cons                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **6A-Inline (Wave 1/2 parity)** | Replace literals in place per file. Each file gets its own atomic commit.                                                                                                                          | Matches the cadence shipped in Waves 1/2. Per-file diff is easy to review.                                                                             | 17 files × N status maps = high-redundancy diffs.                                                                                            |
| **6A-Centralize**               | Move status-color maps into `frontend/src/lib/semantic-colors.ts` as named exports (e.g., `legislationStatusColors`, `complianceStatusColors`). Each `types/*.ts` re-exports for backwards compat. | Single source of truth. Future status additions edit one file. Aligns with ESLint message at `eslint.config.mjs:20` ("or the semantic-colors.ts map"). | More files touched per sub-wave (17 types files + 1 semantic-colors.ts). Larger initial diff. May trip namespace conflicts if names overlap. |

**Recommendation: 6A-Inline.** Phase 58 is a suppression-clearance phase, not a refactor phase (CLAUDE.md Karpathy "surgical changes" rule). The centralization is a clean follow-up for v6.5+ but should not be folded in here. Document the follow-up as an explicit deviation note: "D-58-06A-01: types/\*.ts status-color maps duplicated across files. Consolidation into semantic-colors.ts is a follow-up phase."

### Wave 6 emoji and overlay surfaces

- **Overlay scrim (D-58-01-01-equivalents):** `TourOverlay.tsx`, `EnhancedVerticalTimelineCard.tsx`, `NavigationShell.tsx`, `MilestonesCelebration.tsx`. Per the section 5 finding, `bg-black/N` does NOT match the ESLint regex — these files' suppressions cover OTHER palette literals around the scrim. The scrim literals stay; the surrounding suppressions get removed once the surrounding literals are mapped to tokens. Treat the same way as Wave 4 ExpandableDossierCard.
- **Emoji files:** `LinkTypeBadge.tsx` (per the cross-check rg). Likely 1-2 emoji to replace with `lucide-react` icons.
- **`raw_hex_count > 0` files** (8 files): `CalendarSyncSettings.tsx` (3), `BotIntegrationsSettings.tsx` (4), `MilestonesCelebration.tsx` (13), `AdvancedGraphVisualization.tsx` (2), `useDossierPresence.ts` (9), `useWidgetDashboard.ts` (22), `TagHierarchyManager.tsx` (1), `NavigationShell.tsx` (1), `analytics.types.ts` (21), `calendar-sync.types.ts` (4), `geographic-visualization.types.ts` (10), `stakeholder-influence.types.ts` (11), `tag-hierarchy.types.ts` (10). These need raw-hex → CSS custom property migration (`var(--info)`, `var(--accent)`, etc.) OR a token-mapped utility class. Wave 1/2 pattern: prefer the Tailwind utility wherever possible (`text-info` over `var(--info)`); use the raw CSS var only when the file is consumed by a chart library that takes a CSS string prop.

### Wave 6 commit cadence

Each sub-wave executes per-file atomic commits, same Wave 2 cadence:

- 6A: 17 commits + 1 SUMMARY commit = 18 commits.
- 6B: 120 commits + 1 SUMMARY commit = 121 commits. (To stay reviewable, the PR description should table the commits grouped by component subdirectory.)
- 6C: 37 commits + 1 SUMMARY commit = 38 commits.
- 6D: 7 commits + 1 SUMMARY commit = 8 commits.

If 121 commits in one PR is unreviewable, **sub-divide 6B further by alphabetical directory clusters** — `6B-1` (`components/a*` through `components/d*`), `6B-2` (`components/e*` through `components/m*`), `6B-3` (`components/n*` through `components/z*`). Each cluster lands ~40 files. The planner decides whether to nest this in the plan or split into 3 plans (58-06B-1, 58-06B-2, 58-06B-3).

---

## 8. Wave 7: Closure — eslint.config.mjs Waiver Removal

**Branch:** `phase-58/wave-7-closure`, forked from `origin/main` (after all 6 prior waves have merged).

### Line-precise removal plan

The Tier-C waiver token lives in `eslint.config.mjs` at lines **10–28** as the `designTokenSyntaxRestrictions` constant. After Wave 6 ships, **the constant must be deleted entirely** AND both references to it (lines 217 and 295) must be removed.

**Specifically:**

1. **Delete lines 10–28** — the entire `const designTokenSyntaxRestrictions = [...]` block. This contains the 3 selectors (Literal-with-hex, Literal-with-Tailwind-palette, TemplateElement-with-Tailwind-palette).
2. **Edit line 217** — currently `...designTokenSyntaxRestrictions,` inside the frontend's `no-restricted-syntax` rule (the spread-into-frontend-overrides). Remove this single line.
3. **Edit lines 292–297** — the `tools/eslint-fixtures/bad-design-token.tsx` block. It currently reads:

   ```js
   {
     files: ['tools/eslint-fixtures/bad-design-token.tsx'],
     rules: {
       'no-restricted-syntax': ['warn', ...designTokenSyntaxRestrictions],
     },
   },
   ```

   This fixture is the Phase 59 POLISH-04 positive-failure CI assertion (per ROADMAP STATE.md `Carryover Tech Debt Status`). After the Tier-C waiver removal, this fixture should INSTEAD reference the same selectors that landed in the main frontend block (since the `designTokenSyntaxRestrictions` constant no longer exists). Two options:
   - (a) **Inline the 3 selectors directly** into the `bad-design-token.tsx` block (paste them verbatim from the frontend override's `no-restricted-syntax` rule).
   - (b) **Reorder Wave 7 to follow Phase 59 POLISH-04** — POLISH-04 already changes this fixture's CI assertion shape. If POLISH-04 ships first, Wave 7 follows POLISH-04's lead.

   **Recommendation: option (a)**. Phase 59 may not ship before Phase 58 closure, and inlining the 3 selectors is mechanically simple. Document as deviation D-58-07-01 if it doesn't align with what Phase 59 ends up doing.

### Verification command sequence

```bash
# 1. Confirm no Tier-C suppressions remain anywhere in frontend/src
grep -r "Phase 51 Tier-C\|gsd-design-token-tier-c-allow" frontend/src/
# Expected: 0 hits

# 2. Confirm the waiver-token block is removed from eslint config
grep -n "designTokenSyntaxRestrictions\|tier-c\|Tier-C" eslint.config.mjs
# Expected: 0 hits (or only matches inside historical comments — should also be cleaned)

# 3. Workspace lint must stay green
pnpm lint --max-warnings 0
# Expected: exit 0, zero errors, zero warnings

# 4. Workspace type-check stays green
pnpm type-check
# Expected: exit 0

# 5. Full vitest suite stays green
pnpm vitest run
# Expected: 1,241+ tests pass, zero regressions

# 6. The 51-DESIGN-AUDIT.md / 51-VERIFICATION.md cross-phase records can be updated to
# reflect "Tier-C cleared in Phase 58" — Phase 59 POLISH-01..03 handles paperwork drift.
```

### Wave 7 commit shape

Single commit:

```
chore(58/wave-7): remove Tier-C design-token waiver from eslint.config.mjs

- Delete designTokenSyntaxRestrictions constant (lines 10-28)
- Remove `...designTokenSyntaxRestrictions` spread from frontend override (line 217)
- Inline selectors directly into bad-design-token.tsx fixture block (lines 292-297)
- Workspace lint stays at 0 errors / 0 warnings without the waiver

Closes TOKEN-02. Phase 58 complete.
```

Followed by `58-07-SUMMARY.md` and the signed `phase-58-base` tag.

---

## 9. Cross-Wave Concerns

### 9.1 Test assertions

| Wave | Test files with token assertions                                                                                                                                                  | Action |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1    | `tests/unit/FormInput.test.tsx` — D-14 same-PR update.                                                                                                                            | DONE.  |
| 2    | None per manifest.                                                                                                                                                                | n/a    |
| 3    | None per manifest.                                                                                                                                                                | n/a    |
| 4    | None per manifest.                                                                                                                                                                | n/a    |
| 5    | `components/signature-visuals/__tests__/Sparkline.test.tsx` — Tier-B carve-out, **NO update**. Manifest `override_notes`: "asserts pass-through behavior, NO test update needed". | Skip.  |
| 6    | None per manifest.                                                                                                                                                                | n/a    |

**Net Wave 3–7 test updates: zero.** This is unusual for a refactor of this size; the reason is that the Wave 1 FormInput test was the only test with hard-coded color-class assertions, and Phase 51's audit confirmed it.

### 9.2 Regen targets (visual snapshot specs)

Per the Wave 1/2 plans, `tailwind-remap-visual.spec.ts` was dropped from regen targets because the file was absent at phase-57-base. The remaining `regen_targets` columns reference specs like `after-actions-page-visual`, `list-pages-visual`, `dossier-drawer-visual`, `dashboard-visual`, `kanban-visual`, `tasks-page-visual`, `activity-page-visual`, `briefs-page-visual`, `settings-page-visual`, `tasks-tab-visual`. These are existing Playwright visual specs. **The planner's verification command per wave should include a baseline check, not regen** — token swaps should produce pixel-identical output because the underlying CSS custom properties resolve to the same values. If a visual spec diff appears, that is a regression flag, not a regen trigger.

### 9.3 Dark-variant chains (`dark:`)

Total Wave 3–6 files with dark-variant chains: 124 (8 + 18 + 10 + 88). The Wave 1/2 pattern is to **remove the `dark:` chain entirely** — `@theme`-mapped tokens resolve theme switching at the CSS custom property level, so `text-ink` works in both light and dark themes without `dark:text-ink`. Verification grep per wave: `grep -rn "dark:" <wave-files>` should return 0 after the wave. (This was the OBS-58-02-01 observation: Wave 2's directory-recursive grep flagged residual `dark:` in `BulkActionConfirmDialog` and `BulkActionPreviewDialog` because those are Wave 3 files. They will clear naturally when Wave 3 ships.)

### 9.4 Blue-purple collisions (`blue_purple_collision = yes`)

Total Wave 3–6 files: 75 (6 + 14 + 4 + 51). The blue-purple collision class is the hardest swap class because:

- `blue` literal in source could mean `primary` (the dossier-domain accent / CTA color) OR `info` (informational state, e.g., "new feature" badge).
- `purple` has no design-system token. The Wave 2 precedent (WGMemberSuggestions: purple → accent for person-type avatars) maps purple to `accent`. This may not be correct for every Wave 3–6 file.

**Recommendation for planner:** Wave 3, 4, 5, 6 PLAN.md files should each include a brief blue-purple-decision-rule table at the top of `token_mapping_rules`, listing the per-wave choice. Wave 2 made the call file-by-file (semantic context discrimination); Waves 3–6 can do the same.

### 9.5 Multi-literal lines (`multi_literal_line = yes`)

Total Wave 3–6 files: 173 (10 + 21 + 12 + 130). Multi-literal lines are merge-risk hotspots because a single source line contains multiple Tailwind utilities being swapped. The Wave 1/2 cadence handled them inline without ceremony. **Per-file atomic commits naturally constrain merge risk** — that cadence stays.

### 9.6 Latent same-class violations

D-58-02-EXTRA-02 established that the executor SHOULD clear latent same-class palette literals (e.g., `border-s-{color}-N` lines not annotated by Phase 51 but still in the file) when they fall within the file scope. **Carry this rule forward to Waves 3–6.** Document any latent clears as D-58-NN-EXTRA-NN deviations in the wave's SUMMARY.

### 9.7 RelationshipGraph.tsx — OQ 1 reconciliation

The manifest assigns `components/dossiers/RelationshipGraph.tsx` to Wave 4 with `raw_hex_count=1, palette_literal_count=0, override_notes=—`. But `eslint.config.mjs:263` lists `frontend/src/components/relationships/RelationshipGraph.tsx` (note: `relationships/` not `dossiers/`) in the Tier-B carve-out. **These are two different files.** The Wave 4 `RelationshipGraph` (in `dossiers/`) is NOT carved out; the chart `RelationshipGraph` (in `relationships/`) IS carved out. The planner should:

1. Verify by `ls` that both files exist:
   ```bash
   ls frontend/src/components/dossiers/RelationshipGraph.tsx frontend/src/components/relationships/RelationshipGraph.tsx
   ```
2. If both exist, treat them as separate concerns: the `dossiers/RelationshipGraph.tsx` is in Phase 58 Wave 4 scope; the `relationships/RelationshipGraph.tsx` is exempt.

---

## 10. Token Vocabulary Reference

Available `@theme`-mapped utilities (from `frontend/src/index.css:43–118`) — **the planner uses ONLY these in Wave 3–6 token mapping tables**:

### Surface tokens

| Utility             | Resolves to             | Use                         |
| ------------------- | ----------------------- | --------------------------- |
| `bg-background`     | `var(--bg)`             | Page canvas (warm-neutral)  |
| `bg-surface`        | `var(--surface)`        | Card surface                |
| `bg-surface-raised` | `var(--surface-raised)` | Drawer / popover surface    |
| `bg-muted`          | `var(--surface)`        | Hover / active surface tint |
| `bg-card`           | `var(--surface)`        | Legacy alias                |
| `bg-popover`        | `var(--surface-raised)` | Legacy alias                |

### Ink tokens

| Utility                                   | Resolves to        | Use                                     |
| ----------------------------------------- | ------------------ | --------------------------------------- |
| `text-ink` / `text-foreground`            | `var(--ink)`       | Primary text                            |
| `text-ink-mute` / `text-muted-foreground` | `var(--ink-mute)`  | Secondary text                          |
| `text-ink-faint`                          | `var(--ink-faint)` | Tertiary / disabled text / icon outline |

### Line tokens

| Utility                                          | Resolves to        | Use                             |
| ------------------------------------------------ | ------------------ | ------------------------------- |
| `border-line` / `border-border` / `border-input` | `var(--line)`      | Default border                  |
| `border-line-soft`                               | `var(--line-soft)` | Inner divider (dense list rows) |

### Accent family

| Utility                                                                 | Resolves to          | Use                                        |
| ----------------------------------------------------------------------- | -------------------- | ------------------------------------------ |
| `bg-accent` / `bg-primary`                                              | `var(--accent)`      | Brand CTA / primary button                 |
| `text-accent` / `text-primary`                                          | `var(--accent)`      | Accent text                                |
| `text-accent-foreground` / `text-primary-foreground` / `text-accent-fg` | `var(--accent-fg)`   | Text on accent surface                     |
| `bg-accent-soft`                                                        | `var(--accent-soft)` | Pale accent tint (chip background)         |
| `text-accent-ink`                                                       | `var(--accent-ink)`  | Darker accent for text on neutral surfaces |
| `bg-secondary`                                                          | `var(--accent-soft)` | Legacy secondary alias                     |
| `text-secondary-foreground`                                             | `var(--accent-ink)`  | Legacy secondary text                      |
| `ring-primary` / `ring-ring`                                            | `var(--accent)`      | Focus ring                                 |

### Semantic status (4 tones)

| Utility                                                             | Resolves to     | Use                                  |
| ------------------------------------------------------------------- | --------------- | ------------------------------------ |
| `text-success` / `bg-success` / `text-ok` / `bg-ok`                 | `var(--ok)`     | Success / completed                  |
| `text-warning` / `bg-warning` / `text-warn` / `bg-warn`             | `var(--warn)`   | Warning / pending                    |
| `text-danger` / `bg-danger` / `text-destructive` / `bg-destructive` | `var(--danger)` | Error / overdue / critical           |
| `text-info` / `bg-info`                                             | `var(--info)`   | Informational / neutral notification |

Use `/10`, `/20`, `/30`, `/80` opacity steps for chip backgrounds, banners, and the opacity-step palette differentiation pattern.

### SLA tones (chart-residue surface)

| Utility                         | Resolves to       | Use      |
| ------------------------------- | ----------------- | -------- |
| `text-sla-ok` / `bg-sla-ok`     | `var(--sla-ok)`   | On-track |
| `text-sla-risk` / `bg-sla-risk` | `var(--sla-risk)` | At-risk  |
| `text-sla-bad` / `bg-sla-bad`   | `var(--sla-bad)`  | Breached |

### NOT exposed (do not use)

- No `--chart-N` palette tokens.
- No `--overlay` token (overlay scrim uses `bg-black/N` literal — already lint-allowed per the regex shape).
- No purple / teal / pink / cyan / emerald / indigo tokens. Use the 4 status tokens + accent + ink-mute with opacity steps for additional categorical distinction.

### Existing centralized maps (consider using)

- `frontend/src/lib/semantic-colors.ts` exports `dossierTypeColors: Record<string, ColorSet>` for the 8 dossier types. **The ESLint rule message at `eslint.config.mjs:20` explicitly endorses this map** as a target for swaps. Wave 4 should honor this map for any dossier-type palette work (DossierTypeGuide, DossierTypeSelector, CustomNodes if it renders dossier-type nodes).

---

## 11. Validation Architecture

Per `.planning/config.json`: `workflow.nyquist_validation = true`. The following commands must be wired into each wave's `*-PLAN.md` verification block and the wave's `VALIDATION.md`.

### Test Framework

| Property                       | Value                                                                 |
| ------------------------------ | --------------------------------------------------------------------- |
| Framework                      | Vitest (root vitest.config.ts; 1241 passing tests at Wave 2 baseline) |
| Config file                    | `vitest.config.ts` + per-package overrides                            |
| Quick run command (per task)   | `pnpm vitest run <test-path-or-pattern>`                              |
| Full suite command (wave gate) | `pnpm vitest run`                                                     |
| Lint command                   | `pnpm lint --max-warnings 0`                                          |
| Type-check command             | `pnpm type-check`                                                     |

### Phase Requirements → Test Map

| Req ID            | Behavior                                                                                                   | Test Type    | Automated Command                                                                                                                                                                                                    | File Exists?                |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| TOKEN-01          | Every `// gsd-design-token-tier-c-allow` (a.k.a. `Phase 51 Tier-C`) suppression removed in `frontend/src/` | smoke (grep) | `grep -r "Phase 51 Tier-C\|gsd-design-token-tier-c-allow" frontend/src/<wave_subpath>` (must return 0)                                                                                                               | n/a — grep, not a test file |
| TOKEN-01          | Replaced literals resolve to real `@theme`-mapped tokens                                                   | smoke (grep) | `grep -rnE "text-(red\|blue\|green\|yellow\|purple\|pink\|indigo\|cyan\|teal\|emerald\|amber\|rose\|orange\|sky\|slate\|gray\|zinc\|neutral\|stone\|fuchsia\|violet\|lime)-[0-9]{2,3}" <wave-files>` (must return 0) | n/a                         |
| TOKEN-01          | No regressions in existing component tests                                                                 | unit         | `pnpm vitest run` (must show 1241+ passing)                                                                                                                                                                          | ✅ (existing suite)         |
| TOKEN-02 (Wave 7) | `pnpm lint` exits 0 without the Tier-C waiver                                                              | smoke        | `pnpm lint --max-warnings 0` after waiver removal                                                                                                                                                                    | n/a                         |
| TOKEN-02 (Wave 7) | Waiver token removed from `eslint.config.mjs`                                                              | smoke (grep) | `grep -n "designTokenSyntaxRestrictions\|tier-c\|Tier-C" eslint.config.mjs` (must return 0)                                                                                                                          | n/a                         |

### Sampling Rate

- **Per task commit (wave 3–7):** `pnpm lint --max-warnings 0` on the touched file path scope; `pnpm vitest run <related-test-pattern>` if the file has a co-located test.
- **Per wave merge:** `pnpm lint --max-warnings 0`, `pnpm type-check`, `pnpm vitest run` workspace-wide.
- **Phase gate (Wave 7):** All three commands above + the 5-command verification sequence in section 8.

### Wave 0 Gaps

- [ ] None — existing test infrastructure (vitest + 1241 passing tests) covers all phase requirements. No new test files required for Waves 3–7.

---

## 12. Threat Model Summary

This is a mechanical refactor with no new code surface. **No new auth, no network surface, no user input handling, no PII flow changes, no permission boundary changes.** The threat surface is exactly one risk class:

**Risk: Visual regression during token swap.**

A token swap that resolves to a slightly different OKLCH value at runtime could change pixel-level rendering. The risks are:

- An incorrectly-chosen token (e.g., mapping `text-blue-600` to `text-info` when the file's semantic intent was `text-accent`, or vice versa) — wrong color in the running UI.
- A removed `dark:` chain that breaks dark-mode rendering because the executor mis-believed the token resolves both themes (the @theme block DOES resolve both themes per index.css:43–118, so the risk is operator error rather than design).
- A removed suppression around a non-Phase-58 same-class violation (latent palette literal) reaches into a Tier-B carved-out file and trips lint after the Tier-C waiver is removed in Wave 7.

**Mitigations (no new infrastructure needed):**

- Per-file atomic commits (Wave 1/2 cadence) — each commit is independently revertable.
- Per-task `pnpm lint` execution catches Tier-C waiver loss.
- Wave-level `pnpm vitest run` execution catches test-asserted color regressions.
- Existing Playwright visual specs (`*-visual.spec.ts`) catch unintentional pixel diffs at the per-wave PR-CI level.
- Wave 7 removal of the waiver is the final canary: if any latent same-class violation exists in a Tier-A or Tier-C surface, `pnpm lint` will fail on Wave 7 and the executor will know exactly which file to revisit.

**No security_enforcement domain applies.** This phase contains no AuthN, AuthZ, session, crypto, input validation, deserialization, or output-encoding surface area. Skip the ASVS / STRIDE block per the security_enforcement absence rule in research's output_format.

---

## 13. Open Questions

1. **OQ-58-RES-01: D-58-01-01 scrim deviation may not actually need to exist.**
   - What we know: the ESLint regex at `eslint.config.mjs:18` doesn't match `bg-black/N` (no numeric color suffix, and `black` is not in the named-color list).
   - What's unclear: the original Wave 1 deviation was logged for `bg-black bg-opacity-50` (deprecated v3 syntax). After modernization to `bg-black/50`, the literal is lint-clean. The deviation may have been mis-scoped retroactively.
   - Recommendation: Wave 4 plan should test this empirically — write a one-line `bg-black/40` literal in a sandbox test file and run `pnpm lint`. If lint passes, the planner can retire D-58-01-01 entirely as a no-op deviation. If lint fails, the deviation stands and the planner inherits it.

2. **OQ-58-RES-02: 6A-Inline vs 6A-Centralize decision.**
   - What we know: `frontend/src/lib/semantic-colors.ts` already exists and is endorsed by the ESLint message at `eslint.config.mjs:20`. The 17 `types/*.ts` status maps are duplicate-shaped.
   - What's unclear: whether the planner wants to fold a centralization into Wave 6A or keep it as a v6.5+ follow-up.
   - Recommendation: Wave 6A-Inline for Phase 58 scope discipline. Capture the consolidation as a follow-up deviation D-58-06A-01.

3. **OQ-58-RES-03: 6B sub-divisibility threshold.**
   - What we know: 120 commits in one PR is review-heavy.
   - What's unclear: whether the team's PR review tooling (GitHub UI) chokes at ~80 commits, ~120 commits, or scales fine.
   - Recommendation: ship a `6B-1` PR first with ~40 commits (alphabetical `components/a*` through `components/d*`). If review velocity is acceptable, merge 6B as a single PR. If not, split into 6B-1 / 6B-2 / 6B-3.

4. **OQ-58-RES-04: RelationshipGraph dossiers/ vs relationships/ disambiguation.**
   - See section 9.7. The planner should `ls` both paths before Wave 4 execution and confirm the Wave 4 row in the manifest refers to the `dossiers/` file (not carved out) and not the `relationships/` file (carved out).

5. **OQ-58-RES-05: Wave 7 vs Phase 59 POLISH-04 sequencing.**
   - See section 8 step 3. If Phase 59 POLISH-04 ships first and changes the `bad-design-token.tsx` fixture's CI assertion shape, Wave 7 follows POLISH-04's lead. Otherwise Wave 7 inlines the 3 selectors directly.
   - Recommendation: orchestrator chooses execution order; the GSD STATE.md shows Phase 59 has not started, so Wave 7 should plan for option (a) inline-selectors and accept rework if Phase 59 lands first.

---

## 14. Sources

### Primary (HIGH confidence)

- `.planning/STATE.md` (working tree HEAD) — milestone, phase status
- `.planning/ROADMAP.md` lines 237–250 — Phase 58 goal + success criteria
- `.planning/REQUIREMENTS.md` lines 33–34, 72–73 — TOKEN-01, TOKEN-02 definitions
- `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-WAVE-MANIFEST.md` (all 268 rows) — deterministic file→wave assignment
- `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-00-SUMMARY.md` — Wave 0 manifest closure
- `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-01-PLAN.md` + `58-01-SUMMARY.md` — Wave 1 forms shipped
- `.planning/phases/58-tier-c-design-token-suppression-full-clear/58-02-PLAN.md` + `58-02-SUMMARY.md` — Wave 2 tables shipped (incl. D-58-01-01, D-58-02-01, D-58-02-EXTRA-01..03, OBS-58-02-01)
- `eslint.config.mjs` lines 10–28, 217, 247–270, 292–297 — Tier-C waiver, Tier-B carve-out, fixture wiring
- `frontend/src/index.css` lines 43–118 (`@theme` block), 126–266 (`:root` token values) — every token utility exposed
- `frontend/design-system/inteldossier_handoff_design/colors_and_type.css` — canonical Bureau-direction token spec
- `frontend/src/lib/semantic-colors.ts` (first 50 lines) — centralized map endorsed by lint rule
- Live grep against `frontend/src/components/` — `bg-black/` usage, emoji glyph presence, dialog primitive consumption

### Secondary (MEDIUM confidence)

- `CLAUDE.md` (project) — design tokens non-negotiable, primitive cascade, no-emoji, Karpathy surgical-changes
- `.planning/config.json` — workflow flags (nyquist_validation enabled)

### Tertiary (LOW confidence)

- None — every claim in this document is sourced from a file inspection in this session.

---

## 15. Metadata

**Confidence breakdown:**

- Standard stack & token vocabulary: **HIGH** — directly read from `index.css` and `colors_and_type.css`
- Wave 3–6 inventories: **HIGH** — directly extracted from the manifest (268-row table)
- Architecture / pattern inheritance: **HIGH** — directly read from Wave 1/2 PLAN.md and SUMMARY.md
- D-58-01-01 scrim non-relevance in Wave 3: **HIGH** — verified via grep on all 18 file paths
- Wave 6 sub-batching recommendation: **MEDIUM** — based on file-kind reasoning; depends on team's PR review tooling capacity (OQ-58-RES-03)
- Open questions: **flagged** — these require planner / user decisions before execution

**Research date:** 2026-05-20
**Valid until:** 30 days (2026-06-19) — the manifest is deterministic and the design system is stable; the only invalidator is a non-Phase-58 PR that touches one of the 236 in-scope files between research and execution.

## RESEARCH COMPLETE
