# Phase 75 — AUDIT-01 Component Classification

**Artifact:** AUDIT-01 (classification of `frontend/src/components/**`)
**Produced by:** plan 75-01 (header + evidence baseline + per-directory tier), plan 75-04 (per-file tier for `ui/` + `forms/` + coverage reconciliation)
**Consumed by:** Phase 76 (RTL bridge surface), Phase 77 (TOKEN-06 re-skin scope)
**Evidence date:** 2026-07-02
**Scope:** documentation only — no production code changes.

---

## 1. Header / rulebook

These rules are fixed. Both classification tiers (per-directory below, and the per-file
`ui/`+`forms/` tier added by plan 75-04) obey them verbatim.

### (a) Taxonomy — exactly three labels

Every surface carries exactly one of these three labels. The taxonomy is never extended:

1. `replace-with-shadcn-primitive` — a generic interactive primitive with no domain behavior;
   a shadcn/Radix/HeroUI primitive can stand in behind the design tokens.
2. `keep-custom (domain-specific)` — encodes domain behavior (clearance, RTL direction,
   flags/glyphs, dossier-type logic) or has no generic analog; kept and re-skinned in place.
3. `replace-with-shadcn-block` — a larger composition (dashboard, shell, nav, data-table,
   empty-state) that maps to a shadcn **block**. When a domain signal hits, the label carries
   the `+ domain-wrapper` qualifier (`replace-with-shadcn-block + domain-wrapper`) and the
   Behaviors cell names what the wrapper must preserve.

### (b) Downgrade rule

Any `replace-with-shadcn-primitive` row whose "Behaviors the primitive must preserve" cell is
**empty is invalid** and is **downgraded to `keep-custom (domain-specific)`**. A primitive that
must preserve nothing generic enough to be nameable is not a primitive — it is domain surface.

### (c) Criterion-5 default — domain signals force keep-custom / block-with-wrapper

A surface that touches **clearance**, **RTL directionality**, **flags/glyphs**, or
**dossier-type logic** defaults to `keep-custom (domain-specific)` or
`replace-with-shadcn-block + domain-wrapper` — **never** `replace-with-shadcn-primitive`. The
pre-computed domain-signal file lists in Section 4 drive this default; a directory (or file) on
any of those lists cannot be a bare primitive-replace.

### (d) RTL operationalization — the NARROW direction-owner reading

"Touching RTL directionality" is read **narrowly**: a component touches RTL directionality only
when it **owns direction** —

- it sets a `dir=` attribute (94 files repo-wide), **or**
- it implements direction-conditional positioning / animation / portal logic, **or**
- it is RTL infrastructure (`rtl-wrapper/`, `ui/ltr-isolate.tsx`, `modern-nav/` direction logic).

Mere `isRTL` consumption for icon flips or logical spacing (the other ~300 files that match
`isRTL|dir={|getDocDir|i18n.dir`) does **NOT** force keep-custom. That consumed-RTL behavior is
recorded in the "Behaviors the primitive must preserve" cell instead of collapsing the row to
keep-custom.

This narrow direction-owner reading is a **planner decision that resolves RESEARCH Open
Question 2** ("RTL keep-custom trigger breadth"). It is stated here so the criterion-5 audit
trail is honest: a literal reading would default 397/799 files to keep-custom and tell Phases
76/77 nothing; the narrow reading preserves criterion-5's safety intent (direction-owners stay
protected) without erasing the audit's information value.

### (e) Classify by imports and rendered output — never by filename or docstring

Classification keys on what a file **imports and renders**, never on its name or its comments.
The `heroui-chip.tsx` lookalike trap is the canonical example: it claims "Real @heroui/react
Chip primitive" in its docstring but is CVA + `@radix-ui/react-slot` with no HeroUI import.
Names and docstrings are orientation, never evidence.

---

## 2. Row schema (fixed — both tiers)

One fixed six-column format is used by every classification row in this artifact:

```markdown
| Surface | Classification | Domain signals (clearance/RTL/flags/dossier-type) | Behaviors the primitive must preserve | Evidence | Notes |
```

- **Surface** — repo-relative path. Directory rows end in `/` (e.g. `components/dossier/`);
  file rows are full paths (e.g. `components/ui/badge.tsx`).
- **Classification** — one of the three fixed labels from rule (a).
- **Domain signals** — which of clearance / RTL-direction / flags-glyphs / dossier-type hit the
  surface, citing the triggering list from Section 4 (`none` if clean).
- **Behaviors the primitive must preserve** — required non-empty for any
  `replace-with-shadcn-primitive` row (rule b); for keep-custom rows it records the domain /
  consumed-RTL behavior that any reskin must not regress.
- **Evidence** — a concrete check: a grep hit from a Section-4 list, a named representative
  file, or `dir listing + STRUCTURE.md`.
- **Notes** — advisory only. Advisory labels such as `dead — delete candidate` live **here**;
  the taxonomy itself is never extended (this resolves RESEARCH Open Question 3).

---

## 3. Evidence baseline (dated raw output)

Commands run from the repo root against the working tree, **2026-07-02**. These are the
AUDIT-01 evidence commands from RESEARCH "Code Examples", plus the top-level directory count.
If any number drifts on a later re-run, the fresh output wins over the research figure.

```bash
cd frontend/src/components
find . -type f \( -name "*.tsx" -o -name "*.ts" \) | wc -l                         # total files
find . \( -name "*.test.tsx" -o -name "*.test.ts" \) | wc -l                       # test files
grep -rl "clearance" --include="*.tsx" .                                           # clearance list
grep -rlE "DossierGlyph|FlagCodes|flags/" --include="*.tsx" .                      # flags/glyphs list
grep -rlE "DossierType|dossier_type|getDossierRouteSegment" --include="*.tsx" . | wc -l   # dossier-type
grep -rlE 'dir=\{|dir="rtl"|dir="ltr"' --include="*.tsx" . | wc -l                 # dir-owners
# from repo root:
ls -d frontend/src/components/*/ | wc -l                                           # top-level dirs
```

Raw output (2026-07-02):

```text
total files:        799
test files:          99
clearance files:     10
flags/glyphs files:  13
dossier-type files:  62
dir-owner files:     94
top-level dirs:     116
```

All seven figures match the RESEARCH baseline exactly (no drift as of 2026-07-02).

---

## 4. Domain-signal file lists (criterion-5 drivers)

These lists are the pre-computed keep-custom / block-with-wrapper drivers for rule (c). A
directory or file appearing on any list cannot classify `replace-with-shadcn-primitive`.

### 4.1 Clearance (10 files)

```text
calendar/CalendarEntryForm.tsx
copilot/CopilotSurface.tsx
dossier/tabs/DossierSignalsTab.tsx
entity-links/EntityLinkManager.tsx
intelligence/GenerateDigestButton.tsx
positions/__tests__/EngagementPositionsTab.test.tsx
relationships/__tests__/AnalyticResultView.test.tsx
signals/CaptureSignalForm.tsx
signals/EscalateSignalDialog.tsx
signals/SignalsQueue.tsx
```

### 4.2 Flags / glyphs (13 files, incl. tests)

```text
calendar/CalendarEventPill.tsx
dossier/DossierDrawer/RecentActivitySection.tsx
dossier/ExpandableDossierCard.tsx
intelligence/AlertRuleRow.tsx
intelligence/DigestCard.tsx
intelligence/DigestsTab.tsx
list-page/DossierTable.tsx
signature-visuals/DossierGlyph.tsx
signature-visuals/__tests__/DossierGlyph.flags.test.tsx
signature-visuals/__tests__/DossierGlyph.hairline.test.tsx
signature-visuals/__tests__/DossierGlyph.initials.test.tsx
signature-visuals/__tests__/DossierGlyph.sanitized.test.tsx
signature-visuals/__tests__/DossierGlyph.symbols.test.tsx
```

### 4.3 Dossier-type logic (62 files)

Recorded via `grep -rlE "DossierType|dossier_type|getDossierRouteSegment" --include="*.tsx" .`
(2026-07-02):

```text
analytics/DossierAnalyticsCard.tsx
briefing-books/BriefingBookBuilder.tsx
dossier-recommendations/DossierRecommendationCard.tsx
dossier/AIFieldAssist.tsx
dossier/AddToDossierMenu.tsx
dossier/DossierContextBadge.tsx
dossier/DossierContextIndicator.tsx
dossier/DossierLinksWidget.tsx
dossier/DossierSelector.tsx
dossier/DossierShell.tsx
dossier/DossierTabNav.tsx
dossier/DossierTypeGuide.tsx
dossier/DossierTypeIcon.tsx
dossier/DossierTypeSelector.tsx
dossier/DossierTypeStatsCard.tsx
dossier/ExpandableDossierCard.tsx
dossier/MiniRelationshipGraph.tsx
dossier/UniversalDossierCard.tsx
dossier/dossier-overview/DossierOverview.tsx
dossier/dossier-overview/sections/RelatedDossiersSection.tsx
dossier/tabs/DossierDocumentsTab.tsx
dossier/tabs/DossierEngagementsTab.tsx
dossier/tabs/__tests__/DossierEngagementsTab.test.tsx
dossier/wizard/SharedBasicInfoStep.tsx
dossier/wizard/steps/EngagementParticipantsStep.tsx
dossier/wizard/steps/ForumDetailsStep.tsx
dossier/wizard/steps/OfficeTermStep.tsx
dossier/wizard/steps/PersonBasicInfoStep.tsx
dossier/wizard/steps/WorkingGroupDetailsStep.tsx
dossier/wizard/steps/__tests__/EngagementParticipantsStep.test.tsx
dossier/wizard/steps/__tests__/ForumDetailsStep.test.tsx
dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx
dossier/wizard/steps/__tests__/PersonBasicInfoStep.test.tsx
dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx
empty-states/TourableEmptyState.tsx
entity-comparison/EntityComparisonSelector.tsx
entity-links/EntitySearchDialog.tsx
intake-form/IntakeForm.tsx
intelligence/AlertRuleForm.tsx
intelligence/AlertRuleRow.tsx
intelligence/AlertsTab.tsx
intelligence/DigestCard.tsx
intelligence/DigestSubscribeDrawer.tsx
intelligence/DigestsTab.tsx
keyboard-shortcuts/CommandPalette.tsx
milestone-planning/AddMilestoneDialog.tsx
milestone-planning/MilestonePlannerEmptyState.tsx
positions/DossierPositionsTab.tsx
positions/__tests__/NewPositionDialog.test.tsx
progressive-disclosure/ProgressiveEmptyState.tsx
search/DossierFirstSearchResults.tsx
search/DossierSearchFilters.tsx
signals/CaptureSignalForm.tsx
signature-visuals/DossierGlyph.tsx
signature-visuals/__tests__/DossierGlyph.initials.test.tsx
stakeholder-influence/InfluenceMetricsPanel.tsx
stakeholder-influence/InfluenceReport.tsx
work-creation/DossierPicker.tsx
work-creation/__tests__/DossierPicker.test.tsx
work-creation/forms/CommitmentQuickForm.tsx
work-creation/forms/IntakeQuickForm.tsx
work-creation/forms/TaskQuickForm.tsx
```

**Direction-owner set (RTL, criterion-5 rule d):** 94 files set a `dir=` attribute repo-wide.
The top-level directories that own direction (used by the per-directory tier below) are:
`dossier`, `ui`, `intelligence`, `copilot`, `signals`, `workspace`, `waiting-queue`, `tasks`,
`stakeholder-timeline`, `settings`, `list-page`, `engagements`, `dashboard-widgets`,
`after-actions`, `workflow-automation`, `work-creation`, `version-comparison`, `tweaks`,
`timeline`, `tags`, `sla-monitoring`, `scheduled-reports`, `scenario-sandbox`, `rtl-wrapper`,
`report-builder`, `positions`, `position-editor`, `notifications`, `multilingual`,
`milestone-planning`, `legislation`, `layout`, `intake-form`, `forums`, `contacts`,
`commitments`, `calendar`, `bulk-actions`, `availability-polling`, `analytics`, `activity-feed`,
`FirstRun`. Plus RTL infrastructure `modern-nav/` (direction logic, no literal `dir=` attribute).

---

## 5. Per-directory classification

_One row per top-level directory under `frontend/src/components/` except `ui/` and `forms/`
(those get per-file rows in plan 75-04). Filled by plan 75-01 Task 2._

<!-- prettier-ignore -->
| Surface | Classification | Domain signals (clearance/RTL/flags/dossier-type) | Behaviors the primitive must preserve | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| components/FirstRun/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; FirstRun/FirstRunModal.tsx | — |
| components/__tests__/ | keep-custom (domain-specific) | none | — | dir listing (test-only) | test-only directory — out of migration scope |
| components/actionable-errors/ | keep-custom (domain-specific) | none | — | actionable-errors/FieldErrorHighlight.tsx + STRUCTURE.md | — |
| components/active-filters/ | keep-custom (domain-specific) | none | — | active-filters/ActiveFiltersBar.tsx + STRUCTURE.md | — |
| components/activity-feed/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; activity-feed/EnhancedActivityFeed.tsx | — |
| components/advanced-search/ | keep-custom (domain-specific) | none | — | advanced-search/SavedSearchTemplates.tsx + STRUCTURE.md | — |
| components/after-action-form/ | keep-custom (domain-specific) | none | — | after-action-form/AfterActionForm.tsx + STRUCTURE.md | — |
| components/after-actions/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; after-actions/AfterActionsTable.tsx | — |
| components/ai-extraction-button/ | keep-custom (domain-specific) | none | — | ai-extraction-button/AIExtractionButton.tsx + STRUCTURE.md | — |
| components/ai/ | keep-custom (domain-specific) | none | — | ai/BriefGenerationPanel.tsx + STRUCTURE.md | — |
| components/analytics/ | keep-custom (domain-specific) | dossier-type: analytics/DossierAnalyticsCard.tsx; RTL: direction-owner (dir=) | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | analytics/DossierAnalyticsCard.tsx | — |
| components/app-error-boundary/ | keep-custom (domain-specific) | none | — | app-error-boundary/ErrorBoundary.tsx + STRUCTURE.md | — |
| components/approval-chain/ | keep-custom (domain-specific) | none | — | approval-chain/ApprovalChain.tsx + STRUCTURE.md | — |
| components/assignments/ | keep-custom (domain-specific) | none | — | assignments/KanbanTaskCard.tsx + STRUCTURE.md | — |
| components/attachment-uploader/ | keep-custom (domain-specific) | none | — | attachment-uploader/AttachmentUploader.tsx + STRUCTURE.md | — |
| components/audit-logs/ | keep-custom (domain-specific) | none | — | audit-logs/AuditLogFilters.tsx + STRUCTURE.md | — |
| components/auth/ | keep-custom (domain-specific) | none | — | auth/AuthListenerManager.tsx + STRUCTURE.md | — |
| components/availability-polling/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; availability-polling/AvailabilityPollResults.tsx | — |
| components/brand/ | keep-custom (domain-specific) | none | — | brand/GastatLogo.tsx + STRUCTURE.md | — |
| components/briefing-books/ | keep-custom (domain-specific) | dossier-type: briefing-books/BriefingBookBuilder.tsx | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | briefing-books/BriefingBookBuilder.tsx | — |
| components/bulk-actions/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; bulk-actions/BulkActionConfirmDialog.tsx | — |
| components/calendar/ | keep-custom (domain-specific) | clearance: calendar/CalendarEntryForm.tsx; flags/glyphs: calendar/CalendarEventPill.tsx; RTL: direction-owner (dir=) | clearance-gated rendering (sensitivity_level vs clearance) must survive reskin | calendar/CalendarEntryForm.tsx | — |
| components/collaboration/ | keep-custom (domain-specific) | none | — | collaboration/ConflictResolutionDialog.tsx + STRUCTURE.md | — |
| components/comments/ | keep-custom (domain-specific) | none | — | comments/ReactionPicker.tsx + STRUCTURE.md | — |
| components/commitment-editor/ | keep-custom (domain-specific) | none | — | commitment-editor/CommitmentEditor.tsx + STRUCTURE.md | — |
| components/commitments/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; commitments/CommitmentForm.tsx | — |
| components/compliance/ | keep-custom (domain-specific) | none | — | compliance/ComplianceViolationAlert.tsx + STRUCTURE.md | — |
| components/consistency-panel/ | keep-custom (domain-specific) | none | — | consistency-panel/ConsistencyPanel.tsx + STRUCTURE.md | — |
| components/contacts/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; contacts/BatchContactReview.tsx | — |
| components/copilot/ | keep-custom (domain-specific) | clearance: copilot/CopilotSurface.tsx; RTL: direction-owner (dir=) | clearance-gated rendering (sensitivity_level vs clearance) must survive reskin | copilot/CopilotSurface.tsx | — |
| components/dashboard-widgets/ | replace-with-shadcn-block + domain-wrapper | RTL: direction-owner (dir=) | KPI widgets bound to real domain hooks (no mock data); direction-aware layout; token sparkline/donut | dir= grep hit; dashboard-widgets/WidgetSettingsDialog.tsx | shadcn block candidate (Phase 77); wrapper preserves listed behavior |
| components/decision-list/ | keep-custom (domain-specific) | none | — | decision-list/DecisionList.tsx + STRUCTURE.md | — |
| components/delegation/ | keep-custom (domain-specific) | none | — | delegation/CreateDelegationDialog.tsx + STRUCTURE.md | — |
| components/dossier-recommendations/ | keep-custom (domain-specific) | dossier-type: dossier-recommendations/DossierRecommendationCard.tsx | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | dossier-recommendations/DossierRecommendationCard.tsx | — |
| components/dossier/ | keep-custom (domain-specific) | clearance: dossier/tabs/DossierSignalsTab.tsx; flags/glyphs: dossier/ExpandableDossierCard.tsx, DossierDrawer/RecentActivitySection.tsx; dossier-type: dossier/DossierTypeSelector.tsx (+ dossier-type logic across dir); RTL: direction-owner (dir=) | clearance-gated rendering (sensitivity_level vs clearance) must survive reskin | dossier/tabs/DossierSignalsTab.tsx | — |
| components/dossiers/ | keep-custom (domain-specific) | none | — | dossiers/RelationshipGraph.tsx + STRUCTURE.md | — |
| components/duplicate-comparison/ | keep-custom (domain-specific) | none | — | duplicate-comparison/DuplicateComparison.tsx + STRUCTURE.md | — |
| components/duplicate-detection/ | keep-custom (domain-specific) | none | — | duplicate-detection/DuplicateCandidateCard.tsx + STRUCTURE.md | — |
| components/edit-approval-flow/ | keep-custom (domain-specific) | none | — | edit-approval-flow/EditApprovalFlow.tsx + STRUCTURE.md | — |
| components/editor/ | keep-custom (domain-specific) | none | — | dir listing (only .disabled file) | disabled file only; dead — delete candidate |
| components/elected-officials/ | keep-custom (domain-specific) | none | — | elected-officials/ElectedOfficialListTable.tsx + STRUCTURE.md | — |
| components/email/ | keep-custom (domain-specific) | none | — | email/EmailDigestSettings.tsx + STRUCTURE.md | — |
| components/empty-states/ | replace-with-shadcn-block + domain-wrapper | dossier-type: empty-states/TourableEmptyState.tsx | dossier-type-aware copy/icon; guided-tour trigger wiring | empty-states/TourableEmptyState.tsx | shadcn block candidate (Phase 77); wrapper preserves listed behavior |
| components/engagement-recommendations/ | keep-custom (domain-specific) | none | — | engagement-recommendations/RecommendationsPanel.tsx + STRUCTURE.md | — |
| components/engagements/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; engagements/IntakePromotionDialog.tsx | — |
| components/entity-comparison/ | keep-custom (domain-specific) | dossier-type: entity-comparison/EntityComparisonSelector.tsx | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | entity-comparison/EntityComparisonSelector.tsx | — |
| components/entity-links/ | keep-custom (domain-specific) | clearance: entity-links/EntityLinkManager.tsx; dossier-type: entity-links/EntitySearchDialog.tsx | clearance-gated rendering (sensitivity_level vs clearance) must survive reskin | entity-links/EntityLinkManager.tsx | — |
| components/entity-templates/ | keep-custom (domain-specific) | none | — | entity-templates/QuickEntryDialog.tsx + STRUCTURE.md | — |
| components/error-boundary/ | keep-custom (domain-specific) | none | — | error-boundary/ApiErrorBoundary.tsx + STRUCTURE.md | — |
| components/export-import/ | keep-custom (domain-specific) | none | — | export-import/ExportDialog.tsx + STRUCTURE.md | — |
| components/field-history/ | keep-custom (domain-specific) | none | — | field-history/FieldHistoryTimeline.tsx + STRUCTURE.md | — |
| components/follow-up-list/ | keep-custom (domain-specific) | none | — | follow-up-list/FollowUpList.tsx + STRUCTURE.md | — |
| components/form-auto-save/ | keep-custom (domain-specific) | none | — | form-auto-save/FormProgressIndicator.tsx + STRUCTURE.md | — |
| components/forums/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; forums/ForumDetailsDialog.tsx | — |
| components/geographic-visualization/ | keep-custom (domain-specific) | none | — | geographic-visualization/WorldMapVisualization.tsx + STRUCTURE.md | — |
| components/graph/ | keep-custom (domain-specific) | none | — | graph/FullScreenGraphModal.tsx + STRUCTURE.md | — |
| components/guided-tours/ | keep-custom (domain-specific) | none | — | guided-tours/OnboardingTourTrigger.tsx + STRUCTURE.md | — |
| components/input-dialog/ | keep-custom (domain-specific) | none | — | input-dialog/InputDialog.tsx + STRUCTURE.md | — |
| components/intake-form/ | keep-custom (domain-specific) | dossier-type: intake-form/IntakeForm.tsx; RTL: direction-owner (dir=) | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | intake-form/IntakeForm.tsx | — |
| components/intelligence/ | keep-custom (domain-specific) | clearance: intelligence/GenerateDigestButton.tsx; flags/glyphs: intelligence/AlertRuleRow.tsx, DigestCard.tsx, DigestsTab.tsx; dossier-type: intelligence/AlertRuleForm.tsx, AlertsTab.tsx; RTL: direction-owner (dir=) | clearance-gated rendering (sensitivity_level vs clearance) must survive reskin | intelligence/GenerateDigestButton.tsx | — |
| components/kanban/ | keep-custom (domain-specific) | none | — | kanban/KanbanCard.tsx + STRUCTURE.md | — |
| components/keyboard-shortcuts/ | keep-custom (domain-specific) | dossier-type: keyboard-shortcuts/CommandPalette.tsx | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | keyboard-shortcuts/CommandPalette.tsx | — |
| components/language-provider/ | keep-custom (domain-specific) | none | — | language-provider/language-provider.tsx + STRUCTURE.md | — |
| components/layout/ | replace-with-shadcn-block + domain-wrapper | RTL: direction-owner (dir=) | AppShell HeroUI v3 Drawer + useOverlayState; direction-aware Topbar/sidebar; classification ribbon | dir= grep hit; layout/QuickNavigationMenu.tsx | shadcn block candidate (Phase 77); wrapper preserves listed behavior |
| components/legislation/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; legislation/LegislationForm.tsx | — |
| components/list-page/ | keep-custom (domain-specific) | flags/glyphs: list-page/DossierTable.tsx; RTL: direction-owner (dir=) | DossierGlyph / flag-code rendering must survive reskin | list-page/DossierTable.tsx | — |
| components/meeting-minutes/ | keep-custom (domain-specific) | none | — | meeting-minutes/ActionItemsList.tsx + STRUCTURE.md | — |
| components/milestone-planning/ | keep-custom (domain-specific) | dossier-type: milestone-planning/AddMilestoneDialog.tsx; RTL: direction-owner (dir=) | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | milestone-planning/AddMilestoneDialog.tsx | — |
| components/modern-nav/ | replace-with-shadcn-block + domain-wrapper | RTL: infrastructure | direction-aware nav; RTL chevron/animation; active-route logic | dir= grep hit; modern-nav/navigationData.ts | shadcn block candidate (Phase 77); wrapper preserves listed behavior |
| components/multilingual/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; multilingual/ContentLanguageSelector.tsx | — |
| components/notifications/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; notifications/NotificationBadge.tsx | — |
| components/offline-indicator/ | keep-custom (domain-specific) | none | — | offline-indicator/OfflineIndicator.tsx + STRUCTURE.md | — |
| components/onboarding/ | keep-custom (domain-specific) | none | — | onboarding/OnboardingEmptyState.tsx + STRUCTURE.md | — |
| components/pdf-generator-button/ | keep-custom (domain-specific) | none | — | pdf-generator-button/PDFGeneratorButton.tsx + STRUCTURE.md | — |
| components/position-editor/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; position-editor/PositionEditor.tsx | — |
| components/positions/ | keep-custom (domain-specific) | clearance: positions/__tests__/EngagementPositionsTab.test.tsx; dossier-type: positions/DossierPositionsTab.tsx; RTL: direction-owner (dir=) | clearance-gated rendering (sensitivity_level vs clearance) must survive reskin | positions/__tests__/EngagementPositionsTab.test.tsx | — |
| components/progressive-disclosure/ | keep-custom (domain-specific) | dossier-type: progressive-disclosure/ProgressiveEmptyState.tsx | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | progressive-disclosure/ProgressiveEmptyState.tsx | — |
| components/query-error-boundary/ | keep-custom (domain-specific) | none | — | query-error-boundary/QueryErrorBoundary.tsx + STRUCTURE.md | — |
| components/realtime-status/ | keep-custom (domain-specific) | none | — | realtime-status/RealtimeStatus.tsx + STRUCTURE.md | — |
| components/relationships/ | keep-custom (domain-specific) | clearance: relationships/__tests__/AnalyticResultView.test.tsx | clearance-gated rendering (sensitivity_level vs clearance) must survive reskin | relationships/__tests__/AnalyticResultView.test.tsx | — |
| components/report-builder/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; report-builder/SaveReportDialog.tsx | — |
| components/responsive/ | keep-custom (domain-specific) | none | — | responsive/responsive-nav.tsx + STRUCTURE.md | — |
| components/risk-list/ | keep-custom (domain-specific) | none | — | risk-list/RiskList.tsx + STRUCTURE.md | — |
| components/rtl-wrapper/ | keep-custom (domain-specific) | RTL: infrastructure | direction source / LTR-isolate boundary must survive reskin | dir= grep hit; rtl-wrapper/RTLWrapper.tsx | — |
| components/sample-data/ | keep-custom (domain-specific) | none | — | sample-data/SampleDataBanner.tsx + STRUCTURE.md | — |
| components/scenario-sandbox/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; scenario-sandbox/OutcomeList.tsx | — |
| components/scheduled-reports/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; scheduled-reports/ConditionsManager.tsx | — |
| components/search/ | keep-custom (domain-specific) | dossier-type: search/DossierFirstSearchResults.tsx, DossierSearchFilters.tsx | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | search/DossierFirstSearchResults.tsx, DossierSearchFilters.tsx | — |
| components/settings/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; settings/SettingsSectionCard.tsx | — |
| components/signals/ | keep-custom (domain-specific) | clearance: signals/SignalsQueue.tsx, EscalateSignalDialog.tsx, CaptureSignalForm.tsx; dossier-type: signals/CaptureSignalForm.tsx; RTL: direction-owner (dir=) | clearance-gated rendering (sensitivity_level vs clearance) must survive reskin | signals/SignalsQueue.tsx, EscalateSignalDialog.tsx, CaptureSignalForm.tsx | — |
| components/signature-visuals/ | keep-custom (domain-specific) | flags/glyphs: signature-visuals/DossierGlyph.tsx (+5 tests); dossier-type: signature-visuals/DossierGlyph.tsx | DossierGlyph / flag-code rendering must survive reskin | signature-visuals/DossierGlyph.tsx (+5 tests) | — |
| components/sla-countdown/ | keep-custom (domain-specific) | none | — | sla-countdown/SLACountdown.tsx + STRUCTURE.md | — |
| components/sla-monitoring/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; sla-monitoring/SLAPolicyForm.tsx | — |
| components/stakeholder-influence/ | keep-custom (domain-specific) | dossier-type: stakeholder-influence/InfluenceMetricsPanel.tsx | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | stakeholder-influence/InfluenceMetricsPanel.tsx | — |
| components/stakeholder-timeline/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; stakeholder-timeline/StakeholderAnnotationDialog.tsx | — |
| components/step-up-mfa/ | keep-custom (domain-specific) | none | — | step-up-mfa/StepUpMFA.tsx + STRUCTURE.md | — |
| components/table/ | replace-with-shadcn-block | none | sort/selection state; RTL column alignment; row-height density token (--row-h) | table/DataTable.tsx + STRUCTURE.md | shadcn block candidate (Phase 77); wrapper preserves listed behavior |
| components/tags/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; tags/TagAnalytics.tsx | — |
| components/tasks/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; tasks/TaskEditDialog.tsx | — |
| components/theme-error-boundary/ | keep-custom (domain-specific) | none | — | theme-error-boundary/ThemeErrorBoundary.tsx + STRUCTURE.md | — |
| components/timeline/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; timeline/UnifiedVerticalTimeline.tsx | — |
| components/triage-panel/ | keep-custom (domain-specific) | none | — | triage-panel/TriagePanel.tsx + STRUCTURE.md | — |
| components/tweaks/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; tweaks/TweaksDrawer.tsx | — |
| components/type-specific-fields/ | keep-custom (domain-specific) | none | — | type-specific-fields/TypeSpecificFields.tsx + STRUCTURE.md | — |
| components/unified-kanban/ | keep-custom (domain-specific) | none | — | unified-kanban/index.ts + STRUCTURE.md | — |
| components/validation/ | keep-custom (domain-specific) | none | — | validation/validation-badge.tsx + STRUCTURE.md | — |
| components/version-comparison/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; version-comparison/VersionComparison.tsx | — |
| components/version-history-viewer/ | keep-custom (domain-specific) | none | — | version-history-viewer/VersionHistoryViewer.tsx + STRUCTURE.md | — |
| components/view-preferences/ | keep-custom (domain-specific) | none | — | view-preferences/SavedViewsManager.tsx + STRUCTURE.md | — |
| components/waiting-queue/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; waiting-queue/AssigneeFilter.tsx | — |
| components/work-creation/ | keep-custom (domain-specific) | dossier-type: work-creation/DossierPicker.tsx, forms/TaskQuickForm.tsx; RTL: direction-owner (dir=) | dossier-type routing/branching (getDossierRouteSegment) must survive reskin | work-creation/DossierPicker.tsx, forms/TaskQuickForm.tsx | — |
| components/workflow-automation/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; workflow-automation/WorkflowRuleCard.tsx | — |
| components/working-groups/ | keep-custom (domain-specific) | none | — | working-groups/WGMemberSuggestions.tsx + STRUCTURE.md | — |
| components/workspace/ | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional layout (dir=) must survive reskin | dir= grep hit; workspace/TabSkeleton.tsx | — |

**Tier-1 summary for Phase 76/77.** Phase 76 (`migrate rtl` + portal bridging) must preserve the direction source in every top-level directory that owns direction — the 42 dirs in Section 4's direction-owner set that set a `dir=` attribute, headlined by `dossier/` (22 dir-owner files), `intelligence/` (8), `copilot/` (4), `signals/` (3), plus `layout/`, `list-page/`, `workspace/`, `settings/`, and RTL infrastructure `rtl-wrapper/` and `modern-nav/`. Every one of these classifies keep-custom or replace-with-shadcn-block + domain-wrapper, so no direction-owning surface can collapse to a bare primitive. At directory granularity exactly one bare `replace-with-shadcn-block` appears (`table/`, no domain signal); the other four block rows (`layout/`, `modern-nav/`, `dashboard-widgets/`, `empty-states/`) carry the `+ domain-wrapper` qualifier. No directory row carries a bare `replace-with-shadcn-primitive` — primitive-replaceable surfaces live in the `ui/` + `forms/` per-file tier, and the TOKEN-06 (Phase 77) re-skin scope detail for `ui/` lands there in plan 75-04.

---

## 6. Per-file classification: components/ui/ and components/forms/

_Per-file rows for the two primitive-plausible directories. Filled by plan 75-04._

### 6.0 Evidence appendix — Aceternity-derived `ui/` primitive liveness (dated)

Aceternity-derived-liveness loop from RESEARCH "Code Examples", run verbatim from
`frontend/src`, **2026-07-02**:

```bash
for c in animated-tooltip background-boxes moving-border floating-dock layout-grid \
         placeholders-and-vanish-input text-generate-effect world-map expandable-card; do
  echo -n "$c: "; grep -rl "ui/$c" --include="*.tsx" --include="*.ts" . | grep -v "components/ui/$c" | wc -l | tr -d ' '
done
```

Raw output (2026-07-02):

```text
animated-tooltip: 0
background-boxes: 0
moving-border: 0
floating-dock: 0
layout-grid: 0
placeholders-and-vanish-input: 0
text-generate-effect: 0
world-map: 1
expandable-card: 0
world-map importer: components/geographic-visualization/WorldMapVisualization.tsx
```

Interpretation: 8 of the 9 Aceternity-derived `ui/` primitives have **0 importers** →
classified keep-custom with the `dead — delete candidate` Notes advisory (taxonomy never
extended; RESEARCH Open Question 3). `world-map.tsx` has **1** importer
(`geographic-visualization/WorldMapVisualization.tsx`) → keep-custom, not a delete candidate.

### 6.1 components/ui/ (73 files)

Sorted per `find frontend/src/components/ui -type f \( -name '*.tsx' -o -name '*.ts' \) ! -name '*.test.*' | sort`.
Classification keys on imports and rendered output, never on the `heroui-`/`ui/` filename or docstring
(rulebook e). Direction-owner files (set `dir=`) are keep-custom (rulebook d).

<!-- prettier-ignore -->
| Surface | Classification | Domain signals (clearance/RTL/flags/dossier-type) | Behaviors the primitive must preserve | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| components/ui/accordion.tsx | keep-custom (domain-specific) | RTL: direction-owner (dir=) | Radix dir wiring (dir={dir ?? getDocDir()}) must survive reskin | dir= at accordion.tsx:7; @radix-ui/react-accordion | — |
| components/ui/adaptive-dialog.tsx | keep-custom (domain-specific) | RTL: direction-owner (dir=) | direction-conditional dialog/sheet switch (dir={isRTL?...}) must survive reskin | dir= at adaptive-dialog.tsx:107; useTranslation isRTL; 7 importers | responsive dialog↔sheet composition |
| components/ui/alert-dialog.tsx | replace-with-shadcn-primitive | none | Radix AlertDialog a11y (role=alertdialog, focus trap, Escape); portal; token overlay/surface | @radix-ui/react-alert-dialog | — |
| components/ui/alert.tsx | replace-with-shadcn-primitive | none | cva status variants bound to --danger/--warn/--info tokens; role=alert; icon slot | cva import; var()=3 | — |
| components/ui/animated-tooltip.tsx | keep-custom (domain-specific) | none | — | Aceternity liveness loop 2026-07-02: 0 importers | dead — delete candidate (0 importers; Phase 79/77 input) |
| components/ui/avatar.tsx | replace-with-shadcn-primitive | none | Radix image/fallback load states; token ring/size variants; radius token | @radix-ui/react-avatar + cva | — |
| components/ui/background-boxes.tsx | keep-custom (domain-specific) | none | — | Aceternity liveness loop 2026-07-02: 0 importers | dead — delete candidate (0 importers; Phase 79/77 input) |
| components/ui/badge.tsx | replace-with-shadcn-primitive | none | cva status palette bound to --danger/--warn/--ok/--info @theme utilities; asChild (Slot); badgeVariants export | re-export of HeroUIChip from ./heroui-chip | shim → heroui-chip.tsx (CVA lookalike, no HeroUI) |
| components/ui/bottom-sheet.tsx | keep-custom (domain-specific) | RTL: consumer (useDirection) | direction-aware drag/position; token surface (var(--*)) must survive reskin | useDirection import; var()=8; 3 importers | mobile sheet composition; no generic HeroUI analog |
| components/ui/button.tsx | keep-custom (domain-specific) | none | HeroUI v3 Button API + buttonVariants (250+ consumers) — Phase 78 bump target | re-export of HeroUIButton from ./heroui-button | shim → heroui-button.tsx (HeroUI v3 wrapper); Phase 78 surface, not a shadcn target |
| components/ui/calendar.tsx | replace-with-shadcn-primitive | none | DayPicker month nav; RTL chevron direction; token day/selected states | react-day-picker DayPicker import | — |
| components/ui/card.tsx | keep-custom (domain-specific) | none | HeroUI v3 Card compound API (Header/Title/Content/Footer) — Phase 78 bump target | re-export from ./heroui-card | shim → heroui-card.tsx (HeroUI v3 wrapper); Phase 78 surface, not a shadcn target |
| components/ui/chart.tsx | keep-custom (domain-specific) | none | recharts token CSS-var injection (theming layer) must survive reskin | recharts import; ChartContainer/ChartTooltip; 0 importers | token-theming layer; no generic swap target |
| components/ui/checkbox.tsx | replace-with-shadcn-primitive | none | Radix checked/indeterminate a11y; focus-visible ring token; --accent check color | @radix-ui/react-checkbox; focus-visible + aria | — |
| components/ui/collapsible.tsx | replace-with-shadcn-primitive | none | Radix open/close a11y + animation state; token | @radix-ui/react-collapsible | — |
| components/ui/command.tsx | replace-with-shadcn-primitive | none | cmdk keyboard filtering/nav; Radix dialog portal a11y; token surface | @radix-ui/react-dialog + VisuallyHidden | domain CommandPalette lives in keyboard-shortcuts/ (kept there) |
| components/ui/confirm-remove-button.tsx | keep-custom (domain-specific) | none | AlertDialog confirm flow + i18n copy | imports AlertDialog* from ./alert-dialog; 4 importers | composed confirm pattern; no generic analog |
| components/ui/content-skeletons.tsx | keep-custom (domain-specific) | none | content-aware skeleton shapes | docstring Content-Aware Skeletons; 2 importers | Skeleton composition; no generic analog |
| components/ui/context-aware-fab.tsx | keep-custom (domain-specific) | RTL: consumer (useDirection) | direction-aware speed-dial positioning must survive reskin | useDirection import; 1 importer | FAB + speed-dial composition |
| components/ui/context-menu.tsx | keep-custom (domain-specific) | RTL: direction-owner (dir=) | Radix dir wiring (dir={dir}) must survive reskin | dir= at context-menu.tsx:134; @radix-ui/react-context-menu | — |
| components/ui/dialog.tsx | replace-with-shadcn-primitive | RTL: consumer (useTranslation) | Radix dialog focus-trap/Escape/portal a11y; RTL close-button side (logical); token overlay | @radix-ui/react-dialog; useTranslation | — |
| components/ui/drawer.tsx | replace-with-shadcn-primitive | none | vaul drag-dismiss + snap points; portal a11y; token surface | vaul Drawer import; var()=2 | — |
| components/ui/dropdown-menu.tsx | keep-custom (domain-specific) | RTL: direction-owner (dir=) | Radix dir wiring (dir={dir ?? getDocDir()}) must survive reskin | dir= at dropdown-menu.tsx:9 | — |
| components/ui/enhanced-progress.tsx | keep-custom (domain-specific) | none | labeled/multi-step progress presentation | docstring Enhanced Progress; 0 importers | composition; no generic analog |
| components/ui/expandable-card.tsx | keep-custom (domain-specific) | none | — | Aceternity liveness loop 2026-07-02: 0 importers | dead — delete candidate (0 importers; Phase 79/77 input) |
| components/ui/file-upload.tsx | keep-custom (domain-specific) | none | drag-drop upload + preview state | motion/react import; 0 importers | upload composition; no generic analog |
| components/ui/floating-action-button.tsx | keep-custom (domain-specific) | RTL: consumer (useDirection) | direction-aware FAB placement must survive reskin | useDirection import; 1 importer | FAB composition |
| components/ui/floating-dock.tsx | keep-custom (domain-specific) | none | — | Aceternity liveness loop 2026-07-02: 0 importers | dead — delete candidate (0 importers; Phase 79/77 input) |
| components/ui/form-wizard.tsx | keep-custom (domain-specific) | dossier field: sensitivity_level; RTL: consumer (useDirection) | sensitivity_level field branching + direction-aware step nav must survive reskin | sensitivity_level at form-wizard.tsx:469,564; 31 importers | domain field handling (sensitivity_level) |
| components/ui/form.tsx | replace-with-shadcn-primitive | none | RHF Controller context; aria-describedby/aria-invalid wiring; FormMessage error announce | @radix-ui/react-label + react-hook-form; aria=3 | shadcn Form primitive |
| components/ui/heroui-button.tsx | keep-custom (domain-specific) | none | HeroUI v3 Button primitive + cva variant/size/asChild API — Phase 78 bump target | @heroui/react Button import | HeroUI v3 wrapper — Phase 78 surface, not a shadcn target |
| components/ui/heroui-card.tsx | keep-custom (domain-specific) | none | HeroUI v3 Card primitive — Phase 78 bump target | @heroui/react Card import | HeroUI v3 wrapper — Phase 78 surface, not a shadcn target |
| components/ui/heroui-chip.tsx | replace-with-shadcn-primitive | none | cva status palette bound to --danger/--warn/--ok/--info @theme utilities; asChild (Slot); badgeVariants API | cva + @radix-ui/react-slot; NO @heroui import | lookalike — stale docstring claims Real @heroui/react Chip; actually CVA+Slot (Phase 78 docstring cleanup) |
| components/ui/heroui-forms.tsx | keep-custom (domain-specific) | RTL: consumer | HeroUI v3 compound fields (TextField/Input/Checkbox.Control/Switch.Thumb) — Phase 78 bump target | @heroui/react import (TextField/Input/Select/Checkbox/Switch) | HeroUI v3 wrapper — Phase 78 surface, not a shadcn target |
| components/ui/heroui-modal.tsx | keep-custom (domain-specific) | RTL: consumer | HeroUI v3 Modal compound (Backdrop/Container/Dialog/Header/Body/Footer) + useOverlayState — Phase 78 bump target | @heroui/react Modal import | HeroUI v3 wrapper — Phase 78 surface, not a shadcn target |
| components/ui/heroui-skeleton.tsx | keep-custom (domain-specific) | none | HeroUI v3 Skeleton primitive + preset compositions — Phase 78 bump target | @heroui/react Skeleton import | HeroUI v3 wrapper — Phase 78 surface, not a shadcn target |
| components/ui/heroui-switch.tsx | replace-with-shadcn-primitive | RTL: consumer (logical margins) | checked/onCheckedChange controlled API (51 consumers); RTL-aware thumb positioning (ms- logical margins); token track/thumb colors (var(--*)) | plain button+span; NO @heroui import; var()=4 | lookalike — docstring notes "no @heroui/react dependency" |

<!-- UI ROWS 38-73 + FORMS TIER: PLAN 75-04 TASK 2 -->

---

## 7. Coverage reconciliation

_Reconciles per-directory + per-file row coverage against the live tree file count. Filled by
plan 75-04._

<!-- FILLED BY PLAN 75-04 -->
