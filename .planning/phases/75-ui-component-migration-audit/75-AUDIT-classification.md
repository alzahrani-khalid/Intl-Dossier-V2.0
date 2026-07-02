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

<!-- FILLED BY TASK 2 -->

---

## 6. Per-file classification: components/ui/ and components/forms/

_Per-file rows for the two primitive-plausible directories. Filled by plan 75-04._

<!-- FILLED BY PLAN 75-04 -->

---

## 7. Coverage reconciliation

_Reconciles per-directory + per-file row coverage against the live tree file count. Filled by
plan 75-04._

<!-- FILLED BY PLAN 75-04 -->
