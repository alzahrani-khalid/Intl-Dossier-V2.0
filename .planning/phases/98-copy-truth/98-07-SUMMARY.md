---
phase: 98-copy-truth
plan: 07
wave: 4
seat: p98-exec-07
type: execute
requirements: [COPY-05]
commits: [e686c9fca, 83c820d9e]
observed_at_head: 19f0ecde6
locales: [en, ar]
role: admin
---

# 98-07 — criterion 5: one date language, one relative-time helper

## 0. Headline

Criterion 5's routing sweep executed under four rulings that arrived DURING execution
(`RULING-P98A2-06`, `-17`, `-18`, `-19`), each of which changed the population or the
repair form. **85 files in `e686c9fca`, zero exogenous paths, all gates green.** One
follow-up commit `83c820d9e` is EMPTY and is reported as a discipline incident in §11.

---

## 1. The population, its exclusions, and its casing rule

**IN — criterion 5's relative-time subject** (restated by `RULING-P98A2-06`, refined by
`-19`): _every code path that RENDERS, on a user-facing surface, a phrase or token whose
content is computed from the difference between a timestamp and NOW_ — the rendered string
changes with the passage of time while the underlying datum does not. **Implementation is
irrelevant.**

`RULING-P98A2-19` then narrowed the OFFENCE inside that population to **hand-rolled
relative-string ASSEMBLY**. Two forms are compliant:

1. the shared localized helper `lib/format-date.ts`;
2. a **verb-bearing interpolated i18n key PAIR** — localized in both locales, no
   `defaultValue` mask, only the COUNT computed locally.

**OUTSIDE the population, and why:**

| excluded                                  | reason                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| now-differences that never reach a string | sort keys, query windows, throttles, colour thresholds (`KanbanTaskCard`, `EscalationDashboard`, `BriefingBookBuilder`, `StakeholderTimelineFilters`, `useWidgetDashboard`, `local-storage`, `preference-broadcast`, `useTouchGraphControls`, `AISuggestionPanel`) |
| durations between two FIXED points        | `Executed in {{time}}ms`, `Search completed in {{ms}}ms` — no now term, so the string does not change with time                                                                                                                                                    |
| `MMMM yyyy` month-nav headers             | D-25 named exemption, carried forward                                                                                                                                                                                                                              |
| `T−3` / `T+2` SLA-window tokens           | `RULING-P98A2-17` §1(b): project law (`CLAUDE.md`) mandates the exact shape; locale-neutral Latin                                                                                                                                                                  |
| labelled integer counters                 | `RULING-P98A2-17` §1(c): a number in a labelled column is a metric, not a date-replacing phrase                                                                                                                                                                    |
| i18n keys with ZERO live consumers        | a key renders nothing (latent re-entry, not a member)                                                                                                                                                                                                              |

### Casing rule — DERIVED FROM SEMANTICS (`RULING-P98A2-14`). The population splits in two.

- **Code half** (API names and declarations: `formatDistanceToNow`, `Intl.RelativeTimeFormat`,
  `formatRelativeTime`, `formatRelativeDate`, `getRelativeTime`): **CASE-SENSITIVE.** A
  JavaScript identifier _is_ its casing — a differently-cased spelling is a different symbol
  that does not resolve and cannot render. Case-insensitivity here adds only false positives;
  it cannot add a member. **The B5 dimension does not apply in this direction, and that is
  stated rather than assumed.**
- **Copy half** (rendered phrases: `ago`, `Yesterday`, `Tomorrow`, `Just now`, `منذ`, `أمس`):
  **CASE-INSENSITIVE.** Natural-language copy occurs sentence-initial and mid-sentence, so
  case carries no membership information — B5 exactly.
- **The `fillMock` affordance string:** **CASE-INSENSITIVE**, and the plan derived this itself
  — `Fill with Mock Data` (the JSON value) vs `Fill with mock data` (the inlined literal).

### The six dimensions, each tested. ALL SIX APPLIED — none was inapplicable.

| dimension                           | what it found                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| file type                           | i18n JSON produces relative time via `t()`, invisible to any code-token scan                                                                     |
| shape                               | `Intl.RelativeTimeFormat` (4 files) and bare now-arithmetic, both invisible to check 5                                                           |
| token                               | the ruled five locals were enumerated by the _name_ `formatRelativeTime`; siblings use `formatRelativeDate`, `getRelativeTime`, `formatDeadline` |
| casing                              | applies asymmetrically — sensitive on the code half, insensitive on the copy half (above)                                                        |
| search space                        | 2 edge functions produce bilingual now-relative copy outside `frontend/src`                                                                      |
| **completeness of the enumeration** | **the load-bearing one — see §2**                                                                                                                |

---

## 2. The blocker that defeated the plan on its own terms — the graded six was wrong

Filed BEFORE acting (`P98A2-EXEC-W4-ESCALATION-98-07.md`), tree clean, nothing committed.

- **`components/activity-feed/EnhancedActivityFeed.tsx` has ZERO references** anywhere in
  `frontend/src`, `tests/`, `e2e/` except its own `export function` line and a comment in
  `98-copy05-dates.spec.ts:22`. No importer, no barrel, no lazy import. **Dead code.**
  Instrument-controlled: the identical command shape returns 2 / 7 / 2 / 2 / 1 importers for
  the other five sanctioned feeds.
- **`/activity` is rendered by `pages/activity/ActivityPage.tsx:85` → `ActivityList.tsx`**,
  whose own header calls `EnhancedActivityFeed` the _"legacy … (replaced by ActivityList)"_.
- **`ActivityList.tsx:77` was the true producer of wave 1's witnessed `/activity [ar]` RED.**
  It emitted `` `${diffD}d` `` (en) / `` `${diffD}ي` `` (ar). The spec's `ARABIC_RELATIVE`
  alternation contains no bare `ي`, which is exactly why that leg was RED.

Executing Task 1 verbatim would have repaired a component nobody renders and left the observed
RED on screen — the outcome `RULING-P98A2-06` §4 refused Option C to prevent.

`RULING-P98A2-17` corrected the graded six by ruling: **`ActivityList` replaces
`EnhancedActivityFeed`; count stays six; the dead file stays untouched.**

### Two factual corrections to the ruling record, both token-derived matches never re-read in context

1. **`RULING-P98A2-06` §1 named `DrawerMetaStrip.tsx` a `formatRelativeTimeShort` CONSUMER.
   It is not one.** Its only occurrence of that identifier is `DrawerMetaStrip.tsx:12`, a
   doc-comment saying its semantics _differ_. The helper had exactly **one** consumer:
   `DossierDrawer/RecentActivitySection.tsx:94`.
2. **The `/activity [ar]` RED cannot have come from `formatRelativeTimeShort`** — its `Nd`
   branch is capped at `days >= 2 && days <= 7`, so it can never emit `109d`.

(The orchestrator added a third: both paths in `RULING-P98A2-06` were wrong —
`components/dossier/DossierDrawer/`, not `components/DossierDrawer/`.)

---

## 3. Four more escaping shapes the enumeration missed

| #   | shape                                                                           | members                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B-1 | `Intl.RelativeTimeFormat` — not date-fns, so check 5 blind by construction      | `TaskListWidget:119,121,123`, `EventsWidget:99`, `FieldHistoryTimeline:124`, `NotificationsWidget:107`                                                                                                 |
| B-2 | local declarations the NAME-keyed enumeration missed                            | `EventsWidget:92` `formatRelativeDate`, `FieldHistoryTimeline:119` `getRelativeTime`, `OverviewTab:65` `formatRelativeDate`, `TaskListWidget:112` `formatDeadline`, `WorkItemCard:94` `formatDeadline` |
| B-3 | relative time from i18n JSON + `t()` — the FILE-TYPE shape (B1/B4) landing here | `pull-to-refresh-indicator:70-74,262-264`, `AutoSaveFormWrapper:141-147`, `DelegationCard:57-63`, `PDFGeneratorButton:127`                                                                             |
| B-4 | hardcoded bilingual relative phrases in TSX — B1's literal shape                | `KeyContactsSection:50-56`, `useOptimisticLocking.ts:84`, `ActivityTimelineSection:113-116`                                                                                                            |

**Arithmetic, re-derived and corrected against the orchestrator's count:** B-1 ∩ B-2 is
**three** files (`EventsWidget`, `NotificationsWidget`, `FieldHistoryTimeline` — `comm -12` on
sorted inputs), and the union BEYOND `RULING-P98A2-06`'s enumeration is **four**
(`EventsWidget`, `TaskListWidget`, `FieldHistoryTimeline`, `OverviewTab`). `TaskListWidget` is
B-1-only because its producer is named `formatDeadline` and **no name-keyed finder sees it** —
the token dimension one level down. `ActivityFeedItem` appeared in my B-2 finder only as a
**detector artifact**: `:52` is `const relativeTime = formatDistanceToNow(...)`, an assignment,
not a declaration; re-read in context it was already a sanctioned member.

### Search space — B6 replicated. Two edge functions, filed not repaired.

- `supabase/functions/contextual-suggestions/index.ts:605-606` (`… was due ${daysOverdue} days
ago …` / `… متأخر منذ ${daysOverdue} يوم …`) and `:616-617` (`badge_text_en`/`_ar`)
- `supabase/functions/relationship-health/index.ts:226-227`

Outside `frontend/src`, outside the guard's tree, outside every Phase 98 plan's file scope.
**Amended onto `EDGECOPY-01`, owner Phase 102** (`RULING-P98A2-17` §2 Option C). NOT touched.

---

## 4. Criteria-vs-prose collisions, recorded as plan defects (`RULING-P98A2-07` — mechanical, not escalated)

1. **Task 3 orders a triage of each `Intl.DateTimeFormat` ROW.** There are **zero such rows** —
   the guard has no `Intl.DateTimeFormat` check, so none was ever enumerated. The acceptance
   criterion ("allowlist rows are ZERO") is satisfied trivially for that class. The 8 live
   `Intl.DateTimeFormat` sites were triaged anyway (§5).
2. **Task 3's `<files>` names 6 files but its `<action>` orders the whole skeleton / 12-hour /
   `Intl.DateTimeFormat` classes.** The frontmatter's own parenthetical — _"plus derived
   skeleton/12h/Intl.DateTimeFormat sites, resolved at execution"_ — plus D-04 grant derived-set
   authority, so the 29-file skeleton sweep is inside the work order and is not a widening.
3. **`WorkItemCard` is listed MIGRATE while `RULING-P98A2-17` §1(a) rules countdowns route with
   their semantic kept.** Proceeded under the criterion: the copy05 spec asserts `/my-work`
   renders no relative phrase, and `RULING-P98A2-17` defers to _"the plan's feed/status
   enumeration"_, which says MIGRATE. Same for `ScheduledReportsManager:323`. Both went absolute.

---

## 5. The `Intl.DateTimeFormat` triage (Task 3's required table)

| site                                           | verdict                                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `report-builder/ScheduleReportDialog.tsx:121`  | **OUT** — `.resolvedOptions().timeZone`, a timezone-ID probe; renders no date                                  |
| `scheduled-reports/ScheduleFormDialog.tsx:102` | **OUT** — same                                                                                                 |
| `engagements/workspace/OverviewTab.tsx:55`     | **MIGRATED** → `formatDayFirstYear` (rendered month-first)                                                     |
| `engagements/workspace/CalendarTab.tsx:76`     | **NOT MIGRATED** — outside `files_modified`, no burn-down row, no ruling. **Named, not dropped** (§9)          |
| `engagements/workspace/CalendarTab.tsx:91`     | **NOT MIGRATED** — already emits day-first `Tue 28 Apr`; a second implementation of the same shape. Named (§9) |
| `CalendarTab.tsx:362,417`                      | type annotations only, not renders                                                                             |
| `Dashboard/components/DashboardHero.tsx:30`    | a COMMENT describing a prior removed usage — not a site                                                        |

---

## 6. The one-helper invariant, PROVEN

**No surviving parallel helper.** `frontend/src/lib/i18n/relativeTime.ts` and its
`__tests__/relativeTime.test.ts` are `git rm`'d in `e686c9fca` (the `lib/i18n/` directory is
gone entirely). Its ONE production consumer, `RecentActivitySection.tsx:94`, is re-pointed at
`formatRelativeTime`.

Derivation at the committed HEAD, with the instrument shown non-zero on a known-present control
BEFORE any post-repair zero is believed:

```
# CONTROL (known-present token, same command, same tree)
command grep -rn 'formatDistanceToNow' frontend/src --include='*.ts' --include='*.tsx' \
  | grep -v '.understand-anything' | wc -l                 -> 46 pre-repair
# SUBJECT: date-fns relative APIs outside the formatter module
command grep -rln 'formatDistanceToNow\|formatDistance(' frontend/src --include='*.ts' \
  --include='*.tsx' | grep -v __tests__ | grep -v 'lib/format-date.ts'   -> 1 (the dead
                                                    EnhancedActivityFeed, exempt, §7)
# SUBJECT: parallel helper module + its symbol
command grep -rn 'i18n/relativeTime\|formatRelativeTimeShort' frontend/src tests e2e -> 0
# SUBJECT: local relative-time function DECLARATIONS outside lib/format-date.ts
grep -rnE 'function[[:space:]]+[A-Za-z_$]*[Rr]elative[A-Za-z_$]*[[:space:]]*[(<]|(const|let|var)[[:space:]]+[A-Za-z_$]*[Rr]elative[A-Za-z_$]*[[:space:]]*(:[^=]+)?=[[:space:]]*(async[[:space:]]+)?(function|\(|<)' \
  frontend/src --include='*.ts' --include='*.tsx' | grep -v __tests__
  -> exactly ONE line: frontend/src/lib/format-date.ts:107 (the sanctioned home)
# SUBJECT: Intl.RelativeTimeFormat in code (comment lines excluded by the guard)
-> 0 executable sites; 3 remaining hits are this phase's own rationale comments
```

**Also derived and controlled — the LATENT gap, stated because it is not live:**
`formatDistanceToNowStrict` / `formatDistanceStrict` / `intlFormatDistance` / `formatRelative`
return **0** in `frontend/src` while the identical command returns **46** for
`formatDistanceToNow` — so the zero is real, not an instrument failure. `date-fns` does export
`formatDistanceToNowStrict` (`node_modules/date-fns/formatDistanceToNowStrict.js` exists), so
one import re-opens the gap; check 9b narrows it, and the negative-scope line says so.

## 7. Feed-vs-absolute verdict per site (derived from the COMMITTED diff, not from memory)

RELATIVE KEPT via `formatRelativeTime` — the graded feed six (as corrected by
`RULING-P98A2-17`), plus the recency/countdown surfaces the ruling routed:

| surface                                                                    | role                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `components/activity-feed/ActivityList.tsx`                                | **graded six** (replaces dead `EnhancedActivityFeed`) — `/activity`                                                |
| `pages/Dashboard/components/ActivityFeedItem.tsx`                          | graded six — `/dashboard` activity zone                                                                            |
| `pages/dossiers/overview-cards/SharedRecentActivityCard.tsx`               | graded six — dossier overview cards                                                                                |
| `components/comments/CommentItem.tsx`                                      | graded six — comment threads                                                                                       |
| `components/notifications/NotificationItem.tsx`                            | graded six — `/notifications`                                                                                      |
| `pages/Dashboard/widgets/RecentDossiers.tsx`                               | graded six — `/dashboard` recency widget                                                                           |
| `components/dossier/ActivityTimelineItem.tsx`                              | ruled local, timeline recency                                                                                      |
| `components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx` | ruled local, timeline recency                                                                                      |
| `components/dossier/ExpandableDossierCard.tsx`                             | ruled local, card recency                                                                                          |
| `components/dashboard-widgets/NotificationsWidget.tsx`                     | ruled local + `Intl.RelativeTimeFormat`                                                                            |
| `components/dossier/DossierDrawer/RecentActivitySection.tsx`               | the retired helper's one consumer                                                                                  |
| `components/dashboard-widgets/EventsWidget.tsx`                            | **countdown semantic KEPT** (`RULING-P98A2-17` §1(a)) — within ±7d relative, same-day a time, beyond a week a date |
| `components/dashboard-widgets/TaskListWidget.tsx`                          | **countdown semantic KEPT** — ≤7d relative, beyond a date                                                          |
| `components/field-history/FieldHistoryTimeline.tsx`                        | field-history timeline recency                                                                                     |
| `pages/engagements/workspace/OverviewTab.tsx`                              | lifecycle-transition recency                                                                                       |
| `components/ui/pull-to-refresh-indicator.tsx`                              | last-sync recency (B-3)                                                                                            |
| `components/forms/AutoSaveFormWrapper.tsx`                                 | draft-age recency (B-3)                                                                                            |
| `components/dossier/dossier-overview/sections/KeyContactsSection.tsx`      | last-interaction recency <30d (B-4)                                                                                |
| `hooks/useOptimisticLocking.ts`                                            | conflict recency in a toast (B-4)                                                                                  |

**ABSOLUTE** — every other site. Per-file export table, derived from the committed blobs:

| file                                                                        | export(s)                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------ |
| `components/activity-feed/ActivityList.tsx`                                 | formatRelativeTime                               |
| `components/audit-logs/AuditLogTable.tsx`                                   | formatDateTime                                   |
| `components/availability-polling/AvailabilityPollResults.tsx`               | formatDayFirst/formatTime                        |
| `components/availability-polling/AvailabilityPollVoter.tsx`                 | formatDateTime/formatDayFirst/formatTime         |
| `components/briefing-books/BriefingBooksList.tsx`                           | formatDayFirstYear                               |
| `components/calendar/UnifiedCalendar.tsx`                                   | formatDateTime                                   |
| `components/collaboration/ConflictResolutionDialog.tsx`                     | formatDateTime                                   |
| `components/comments/CommentItem.tsx`                                       | formatRelativeTime                               |
| `components/commitments/CommitmentFilterDrawer.tsx`                         | formatDayFirstYear                               |
| `components/commitments/CommitmentForm.tsx`                                 | formatDayFirstYear                               |
| `components/commitments/StatusTimeline.tsx`                                 | formatDateTime                                   |
| `components/contacts/InteractionNoteForm.tsx`                               | formatDayFirstYear                               |
| `components/contacts/InteractionTimeline.tsx`                               | formatDayFirstYear                               |
| `components/dashboard-widgets/EventsWidget.tsx`                             | formatDayFirst/formatRelativeTime/formatTime     |
| `components/dashboard-widgets/NotificationsWidget.tsx`                      | formatRelativeTime                               |
| `components/dashboard-widgets/TaskListWidget.tsx`                           | formatDayFirst/formatRelativeTime                |
| `components/delegation/CreateDelegationDialog.tsx`                          | formatDayFirstYear                               |
| `components/delegation/DelegationCard.tsx`                                  | formatDayFirstYear                               |
| `components/dossier/ActivityTimelineItem.tsx`                               | formatDayFirstYear/formatRelativeTime            |
| `components/dossier/DossierDrawer/RecentActivitySection.tsx`                | formatRelativeTime                               |
| `components/dossier/DossierDrawer/__tests__/RecentActivitySection.test.tsx` | formatRelativeTime                               |
| `components/dossier/ExpandableDossierCard.tsx`                              | formatDayFirstYear/formatRelativeTime            |
| `components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx`  | formatRelativeTime                               |
| `components/dossier/dossier-overview/sections/KeyContactsSection.tsx`       | formatDayFirstYear/formatRelativeTime            |
| `components/duplicate-detection/DuplicateCandidateCard.tsx`                 | formatDateTime                                   |
| `components/edit-approval-flow/EditApprovalFlow.tsx`                        | formatDateTime                                   |
| `components/field-history/FieldHistoryTimeline.tsx`                         | formatDateTime/formatRelativeTime                |
| `components/form-auto-save/AutoSaveIndicator.tsx`                           | formatTime                                       |
| `components/form-auto-save/FormDraftBanner.tsx`                             | formatDateTime                                   |
| `components/forms/AutoSaveFormWrapper.tsx`                                  | formatRelativeTime                               |
| `components/intelligence/BilateralOpportunities.tsx`                        | formatDateTime                                   |
| `components/intelligence/EconomicDashboard.tsx`                             | formatDateTime                                   |
| `components/intelligence/PoliticalAnalysis.tsx`                             | formatDateTime                                   |
| `components/intelligence/SecurityAssessment.tsx`                            | formatDateTime                                   |
| `components/notifications/NotificationItem.tsx`                             | formatRelativeTime                               |
| `components/positions/AttachPositionDialog.tsx`                             | formatDayFirstYear                               |
| `components/positions/PositionAnalyticsCard.tsx`                            | formatDayFirstYear                               |
| `components/positions/PositionCard.tsx`                                     | formatDayFirstYear                               |
| `components/report-builder/FilterBuilder.tsx`                               | formatDayFirstYear                               |
| `components/report-builder/SavedReportsList.tsx`                            | formatDateTime                                   |
| `components/scenario-sandbox/ScenarioCard.tsx`                              | formatDayFirst                                   |
| `components/scheduled-reports/ExecutionHistoryDialog.tsx`                   | formatDateTime                                   |
| `components/scheduled-reports/ScheduledReportsManager.tsx`                  | formatDateTime                                   |
| `components/tasks/TaskEditDialog.tsx`                                       | formatDayFirstYear                               |
| `components/ui/pull-to-refresh-indicator.tsx`                               | formatDateTime/formatRelativeTime/formatTime     |
| `components/version-history-viewer/VersionHistoryViewer.tsx`                | formatDateTime                                   |
| `components/waiting-queue/AssignmentDetailsModal.tsx`                       | formatDateTime                                   |
| `components/work-creation/forms/CommitmentQuickForm.tsx`                    | formatDayFirstYear                               |
| `components/work-creation/forms/TaskQuickForm.tsx`                          | formatDayFirstYear                               |
| `components/workflow-automation/WorkflowExecutionsList.tsx`                 | formatDateTime                                   |
| `components/workflow-automation/WorkflowRuleCard.tsx`                       | formatDateTime                                   |
| `frontend/tests/component/AssignmentDetailsModal.test.tsx`                  | formatDateTime                                   |
| `hooks/useOptimisticLocking.ts`                                             | formatRelativeTime                               |
| `pages/Dashboard/components/ActivityFeedItem.tsx`                           | formatRelativeTime                               |
| `pages/Dashboard/widgets/RecentDossiers.tsx`                                | formatRelativeTime                               |
| `pages/MyAssignments.tsx`                                                   | formatDateTime                                   |
| `pages/availability-polling/AvailabilityPollingPage.tsx`                    | formatDayFirstYear                               |
| `pages/dossiers/overview-cards/BilateralSummaryCard.tsx`                    | formatDayFirstYear                               |
| `pages/dossiers/overview-cards/ElectedOfficialOfficeCard.tsx`               | formatDayFirstYear                               |
| `pages/dossiers/overview-cards/EngagementHistoryCard.tsx`                   | formatDayFirstYear                               |
| `pages/dossiers/overview-cards/ForumSessionsCard.tsx`                       | formatDayFirstYear                               |
| `pages/dossiers/overview-cards/MeetingScheduleCard.tsx`                     | formatDayFirstYear                               |
| `pages/dossiers/overview-cards/PersonMetadataCard.tsx`                      | formatDayFirstYear                               |
| `pages/dossiers/overview-cards/SharedRecentActivityCard.tsx`                | formatRelativeTime                               |
| `pages/engagements/workspace/OverviewTab.tsx`                               | formatDayFirstYear/formatRelativeTime            |
| `pages/my-work/components/WorkItemCard.tsx`                                 | formatDayFirst                                   |
| `pages/webhooks/WebhooksPage.tsx`                                           | formatDateTime/formatDayFirstYear                |
| `routes/_protected/after-actions/$afterActionId.tsx`                        | formatDateTime/formatDayFirst/formatDayFirstYear |
| `routes/_protected/positions/$id/approvals.tsx`                             | formatDateTime                                   |
| `routes/_protected/positions/$id/versions.tsx`                              | formatDateTime                                   |
| `routes/_protected/tags.tsx`                                                | formatDateTime                                   |
| `scripts/date-format-fixtures/relative-production-noimport.fixture.ts`      | formatRelativeTime                               |

---

## 8. Run record — BOTH POLARITIES, executed, not asserted in prose

### 8.1 Observed RED before repair (clause 1)

**`98-copy05-dates.spec.ts` at HEAD `c1351090c`**, project `chromium-en`, role **admin**
(`TEST_USER_EMAIL`), both locale legs by `?lng=`, `--no-deps --workers=1`:
**2 failed / 2 passed.**

| leg                           | the text that attributes the RED                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/audit-logs` **[en]**, admin | `renders relative time outside the D-25 enumeration` — the page rendered `about 2 hours ago`                                             |
| `/activity` **[ar]**, admin   | `renders no localized relative-time phrase — the D-25 shared localized helper is absent and the feed emits a bare compact token instead` |

**D-26 bundle RED, observed pre-repair on the build at `19f0ecde6`:** `dist/assets/app-*.js`
carried the EN JSON value `Fill with Mock Data` **and** the AR value `تعبئة بيانات وهمية`
(case-insensitive dist hits excluding `.map` = **1**), while the lowercase dev-literal form was
**0**. That is what makes **key deletion** the closer, and it answers assumption **A2 before it
is asked**.

### 8.2 The guard drill — BOTH witnessed escape shapes planted, RED shown at RUN TIME

```
RED    node scripts/check-date-formatting.mjs scripts/date-format-fixtures   -> RC=1
```

| fixture                                    | replicates                                                                                                                                                                              | checks that fired                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `relative-production-noimport.fixture.ts`  | **shape #1 — the no-import local**: five components hand-rolled `formatRelativeTime` from `Date.now()` arithmetic importing NOTHING from date-fns, so check 5 was blind by construction | `:14` local-relative-decl (9b); `:16`, `:18` short-relative (9c) — the `${diffSec}ث` / `${diffD}d` tokens `/activity` actually rendered |
| `relative-production-importing.fixture.ts` | **shape #2 — the importing-but-escaping parallel helper**: `lib/i18n/relativeTime.ts` DID import date-fns and check 5 still missed it                                                   | `:17` local-relative-decl (9b); `:19` intl-relative (9a)                                                                                |

```
GREEN  node scripts/check-date-formatting.mjs frontend/src/design-system   -> RC=0
       "Named debt NOT applied (explicit-directory run) — this green is unexcused."
DEFAULT node scripts/check-date-formatting.mjs                            -> RC=0
       "Named debt: 0 row(s) excusing 0 site(s)"   <- the burn-down is EMPTY; the guard is STRICT
```

### 8.3 The dead-file EXEMPTION drilled BOTH ways — the exemption is not a hiding place

The exemption keys on the exact repo-relative path. Pointing the guard at a **copy of the same
file at a path the exemption does not name**:

```
node scripts/check-date-formatting.mjs <scratch>/exempt-drill   -> RC=1, 3 offenders:
  EnhancedActivityFeed.tsx:13  date-fns relative time outside lib/format-date.ts
  EnhancedActivityFeed.tsx:200 date-fns relative time outside lib/format-date.ts
  EnhancedActivityFeed.tsx:205 date-fns localized skeleton literal 'PPpp'
node scripts/check-date-formatting.mjs frontend/src/components/activity-feed -> RC=0
```

**Same bytes, opposite verdicts.** The rows are GENUINE offenders; only the exemption holds them
green — exactly what `RULING-P98A2-18` required be provable rather than asserted.

### 8.4 The `98-copy05` spec post-repair — 4/4 GREEN, and the `ar` leg proven NON-VACUOUS

```
pnpm exec playwright test tests/e2e/98-copy05-dates.spec.ts --project=chromium-en \
  --no-deps --workers=1                                     -> 4 passed
```

(One spec path, so the ≥2-paths filter trap cannot apply; existence asserted before the run.)

A green on `ARABIC_RELATIVE` could come from ambient Arabic chrome. Driven directly and read
out of the feed's **own** `.act-t` cells:

| leg / role                | `.act-t` cells (n=8) | `ARABIC_RELATIVE` inside the cells | Indic digits                |
| ------------------------- | -------------------- | ---------------------------------- | --------------------------- |
| `/activity?lng=ar`, admin | `منذ 4 أشهر` ×8      | matches `منذ`                      | none — Latin `4` (Policy D) |
| `/activity?lng=en`, admin | `4 months ago` ×8    | **NO MATCH anywhere in `main`**    | none                        |

The `en` leg finding no Arabic token anywhere in `main` is what makes the `ar` green
discriminating rather than an artifact. At HEAD these cells read `109d` / `109ي`.

### 8.5 The D-26 bundle oracle — all controls in ONE post-build run

| clause                                                                                                            | result                                                                                         |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **NEGATIVE control** — the case-insensitive pattern fires on the known-present source literal in `IntakeForm.tsx` | **1** (≥1 required) — a pattern that cannot find the string where it provably exists never ran |
| **SUBJECT** — emitted `js`/`css`, `--exclude='*.map'`, case-insensitive                                           | **0**                                                                                          |
| **POSITIVE control** — `Changes saved` in the SAME artifacts dir                                                  | **1** (≥1 required) — proves the build produced output and the instrument reads it             |
| **IN-BLOCK DCE control** — `New Partnership with ExampleCorp`, a string living ONLY inside the DEV block          | source **1**, dist-without-`.map` **0**, dist-with-`.map` **1**                                |
| **the deleted JSON values** in the emitted bundle                                                                 | `Fill with Mock Data` **0**; `تعبئة بيانات وهمية` **0**                                        |
| **the excluded population, stated not hidden**                                                                    | including `.map`: **1** — `CLIENTSEC-02`, owner Phase 100                                      |

Asset counts: **481** non-map assets, **305** `.map` files.

The in-block DCE control is **stronger than the plan's stated corroboration** (`FullscreenLoader`):
it proves Vite strips _this exact block_, in _this exact file_, and it proves sourcemaps embed
sources verbatim — both from artifacts, not from reasoning.

### 8.6 Resolution, not existence (`RULING-P98A2-12` c3) — every key this plan touched, both locales

Real `i18next`, real bundles, `translation` aliased to `common`, asked through the namespace the
component is **BOUND** to, **`fallbackLng` DISABLED** so an `ar` miss cannot borrow English.
16 lookups, **0 failures**, both harness polarities firing:

| key                                      | ns               | en           | ar                            |
| ---------------------------------------- | ---------------- | ------------ | ----------------------------- |
| `deadline.today` (mask removed)          | `my-work`        | `Today`      | `اليوم`                       |
| `deadline.tomorrow` (mask removed)       | `my-work`        | `Tomorrow`   | `غداً`                        |
| `actions.reset` (surviving sibling)      | `intake`         | `Reset Form` | `إعادة تعيين النموذج`         |
| `minutesAgo` / `secondsAgo`              | `collaboration`  | resolve      | resolve                       |
| `indicator.recently` / `banner.recently` | `form-auto-save` | resolve      | `مؤخراً`                      |
| **`actions.fillMock`**                   | `intake`         | **MISSES**   | **MISSES** — as D-26 requires |

Controls: negative `t('deadline.__not_a_real_member__')` → detected-as-miss **true**; positive
`t('deadline.today')` → detected-as-miss **false**.

### 8.7 Static gates

| gate                                     | result                                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `cd frontend && pnpm type-check`         | **RC 0**                                                                                            |
| `cd frontend && pnpm lint`               | **RC 0** end-to-end (eslint + i18n-namespaces + duplicate-rtl + bootstrap-parity + date-formatting) |
| `cd frontend && pnpm build`              | **RC 0**                                                                                            |
| `node scripts/check-date-formatting.mjs` | **RC 0**, burn-down **0 rows**                                                                      |

### 8.8 Unit suite — measured against a BASELINE, not against hope

`format-date.ts` imports the i18n singleton, so routing components onto it **grew its import
reach**; a targeted run cannot see a transitive break. Full `frontend` suite run twice:

| run                                                                         | failing files | failing tests |
| --------------------------------------------------------------------------- | ------------- | ------------- |
| **BASELINE** — HEAD `19f0ecde6` in a detached worktree, same `node_modules` | 22            | 41            |
| **AFTER** — this wave's tree                                                | 22            | 41            |

**`comm -13 baseline mine` is EMPTY: zero new failures.** Two regressions WERE introduced and
were repaired before the commit:

- 6 suites partially mock `react-i18next` without `initReactI18next`; the singleton's
  `.use(initReactI18next)` then fails the suite **at import time**, not at an assertion. Each
  mock gained the export with a comment naming the cause.
- 2 tests **pinned the retired behaviour**: `ActivityList` Test 5 asserted `/5د/` (the deleted
  short-suffix), `AssignmentDetailsModal` asserted `/Jan.*10.*2024/i` (the `'PPP p'` month-first
  render criterion 5 removes). Both rewritten to the ruled behaviour — the `ActivityList` one now
  drives **both locales through the singleton** and asserts `منذ`, the same token the e2e oracle
  looks for; the modal one is scoped to `data-testid="last-reminder-sent"` because the modal
  renders two dates and a bare text query matched both.

---

## 9. The `RULING-P98A2-19` form-(2) triage — ZERO reverts, and here is why, per file

`RULING-P98A2-19` landed **after** ~35 files were already routed and superseded every "route
onto the helper" instruction in flight. Form (2) — a **verb-bearing interpolated i18n key PAIR,
localized in both locales, no `defaultValue` mask, only the COUNT computed locally** — is
COMPLIANT, so any routing of a pre-edit form-(2) site would have been a **regression that looks
like compliance and leaves no trace in the diff**.

Every routed file was re-triaged against its PRE-EDIT state before the commit. **No file was
reverted**, and the reason is stated per class so the verdicts can be re-run:

| pre-edit state                                                                                                                   | files                                                                                                                                                                                                       | verdict                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| direct `formatDistanceToNow(...)` — a competing formatter CALL, not an i18n pair                                                 | the graded six (5 of them), the 15 date-of-record migrations                                                                                                                                                | **not form (2) → routing STANDS**                                                                                                                                                                                                                                                                                                                                                                                                              |
| hand-rolled template-literal ASSEMBLY                                                                                            | `ActivityList` (`${diffD}d`/`${diffD}ي`), `ActivityTimelineSection` (`منذ ${diffMins} دقيقة`), `KeyContactsSection` (`${diffDays} days ago`), `useOptimisticLocking` (`${secondsAgo} seconds ago`)          | **assembly → STANDS**                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `Intl.RelativeTimeFormat` wrapper inside a local `formatX`                                                                       | `NotificationsWidget`, `EventsWidget`, `TaskListWidget`, `FieldHistoryTimeline`                                                                                                                             | **wrapper → STANDS**                                                                                                                                                                                                                                                                                                                                                                                                                           |
| local `formatX` selecting units + a hardcoded bilingual ternary                                                                  | `OverviewTab` (`locale === 'ar' ? 'اليوم' : 'Today'`)                                                                                                                                                       | **assembly → STANDS**                                                                                                                                                                                                                                                                                                                                                                                                                          |
| i18n `t()` **WITH a `defaultValue` mask**                                                                                        | `ActivityTimelineItem` (`t('timeline.minutesAgo','{{count}} min ago',…)`), `pull-to-refresh-indicator` (`t('pullToRefresh.minutesAgo','{{count}}m ago',…)`), `WorkItemCard` (`t('deadline.today','Today')`) | **mask present → not form (2) → STANDS**                                                                                                                                                                                                                                                                                                                                                                                                       |
| i18n `t()`, no mask, but inside a local `formatX` that selects the unit, and the values carry **NO VERB** (`{{count}} days ago`) | `ExpandableDossierCard` (`time.daysAgo`/`weeksAgo`/`monthsAgo`/`yearsAgo`)                                                                                                                                  | **not verb-bearing + local formatX → STANDS**                                                                                                                                                                                                                                                                                                                                                                                                  |
| i18n `t()`, no mask, keys **DO NOT EXIST IN EITHER LOCALE**                                                                      | `AutoSaveFormWrapper` (`forms.time_ago_days`/`_hours`/`_minutes`)                                                                                                                                           | **STANDS — and it was worse than a form-(2) question.** Derived with a control: `common.json` has no top-level `forms` key and no nested `common.forms` in **either** locale, and the string `time_ago` appears **zero** times anywhere in either file, while the control `calendar.sun` resolves to `Sun`/`الأحد`. It was rendering the **raw dotted key in both locales** — a criterion-2 leak this criterion-5 routing incidentally closes. |
| parallel helper module                                                                                                           | `RecentActivitySection` (`formatRelativeTimeShort`)                                                                                                                                                         | **retired by ruling → STANDS**                                                                                                                                                                                                                                                                                                                                                                                                                 |

**Files HELD and NOT touched pending the ruling, then ruled compliant — recorded as COMPLIANT
MEMBERS, not exemptions** (`RULING-P98A2-19` draws that distinction and only the second survives
an audit with the JSON open):

| file                                                            | why it is form (2)                                                                                                                                                                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/delegation/DelegationCard.tsx:57-63`                | `delegation.json` `card.expiresIn` = `Expires in {{days}} days` / `ينتهي خلال {{days}} أيام`, `card.expired` = `Expired {{days}} days ago` / `انتهى منذ {{days}} أيام` — **verb-bearing**, both locales, no mask, count-only local |
| `components/dossier/DossierDrawer/DrawerMetaStrip.tsx:53-57`    | `dossier-drawer.json` `meta.last_touched_relative` = `Last touched {{n}}d ago` / `آخر تحديث منذ {{n}} يوم` — **verb-bearing**, both locales, no mask, count-only local                                                             |
| `components/collaboration/ConflictResolutionDialog.tsx:183-184` | `collaboration.json` `minutesAgo`/`secondsAgo` resolve in both locales with no mask; the delta is between two FIXED timestamps, so it is outside the population anyway                                                             |

**I read `DrawerMetaStrip` OUT and the orchestrator overturned me, correctly:** I classified by
the KEY'S SHAPE (a labelled `last_touched_*` ladder → §5(c)) instead of by **what the VALUE
says** — and the value is a sentence containing `ago`/`منذ` that replaces a date. That is the
implementation-vs-behaviour split, drawn by me, in my own favour. It is recorded because naming
the member is what made the ruling possible.

### The one member my premise got WRONG, corrected by the orchestrator

`components/pdf-generator-button/PDFGeneratorButton.tsx:127` — **NOT touched.** I argued it was
already-localized form (2). It is not: `:36` is a **bare `useTranslation()`** so it binds to
`common`, and `common.json` has a top-level `afterActions` dict in both locales with eight keys
and **no `pdf` sub-key** (nested-common control run — not there either). `t('afterActions.pdf.expiresIn')`
**MISSES in both locales and renders the raw dotted key.** It is a **criterion-2 leak that
happens to be a countdown**, at hour/minute granularity the helper cannot express. Routing it
would have swapped a raw-key leak for a less-precise phrase and called that a criterion-5 green.
**I reasoned from the keys being real without asking whether they RESOLVE through the namespace
the component BINDS to** — `RULING-P98A2-12` c3 is not only a post-repair gate. Repair form ruled
CRITERION 2, key pair authored under the bound namespace with the precision kept; **not this
plan's diff.**

---

## 10. The guard's NEGATIVE SCOPE line (`RULING-P98A2-13` Law 1)

Written into `scripts/check-date-formatting.mjs`'s own header so `98-09` consolidates rather
than reconstructs. Six blind spots, each with its covering instrument **or "nothing does" said
plainly**:

| #   | what the guard CANNOT see                                                                                                                 | covered by                                                                                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **any tree outside `frontend/src`** — `walkSourceFiles` starts there and nothing re-points it                                             | **NOTHING automated.** Two edge functions ship bilingual now-relative copy today; filed as `EDGECOPY-01`, owner P102                                                                                                                                                                                                          |
| 2   | **i18n JSON** — the walker admits only `.ts`/`.tsx`, so a phrase authored in a bundle and rendered via `t()` is invisible BY CONSTRUCTION | the criterion-2 resolution instruments, and only on the surfaces they drive                                                                                                                                                                                                                                                   |
| 3   | **hardcoded full-word relative phrases in code** — 9c catches only the short-suffix shape                                                 | **NOTHING.** A broad literal check cannot separate a relative render from a date-RANGE FILTER LABEL (`AuditLogFilters`, `ActivityFeedFilters`, `DateRangeFilter` all legitimately carry `'Yesterday'`/`'أمس'`). Known live residue named in the header: `NotificationList.tsx:125-126`, `NotificationPreviewTimeline.tsx:306` |
| 4   | **runtime resolution** — a syntactically perfect `t()` proves nothing about the bound namespace                                           | `INSTRUMENTS-P98/resolve-check.mjs` + its `neg-taskcard.mjs` control                                                                                                                                                                                                                                                          |
| 5   | **reachability** — dead code is scanned exactly like live code                                                                            | the importer census and the rendered `98-copy05` oracle. **This is the blind spot that produced §2's blocker**, and it is why `EnhancedActivityFeed` needed an exemption rather than a repair                                                                                                                                 |
| 6   | **date-fns relative APIs check 5 does not name** (`…Strict`, `intlFormatDistance`, `formatRelative`)                                      | LATENT, not live — 0 today with the control at 46. 9b narrows it; nothing closes it                                                                                                                                                                                                                                           |

**Ownership:** the instrument file is `98-02`'s COMPLETED scope. This is a ruled extension
(`RULING-P98A2-06` §3). **`98-02` is NOT re-opened and owes no redo.**

### Every burn-down row's exit — by REPAIR or by NAMED EXEMPTION, never silently

**60 rows in, 0 rows out.** 54 left by **REPAIR**. 6 left by **NAMED PERMANENT EXEMPTION**, each
carrying its reason in the script:

| exemption                                                                   | reason                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EnhancedActivityFeed.tsx` (relative-time + skeleton)                       | **`RULING-P98A2-18` template, filled from my own derivation**: 0 importers at `19f0ecde6…`, by the command written into the exemption, live control `SharedRecentActivityCard` = 25. The rows are **GENUINE offenders left unrepaired BECAUSE NOTHING RENDERS THEM.** **VOID CONDITION: if this file gains an importer the exemption is void and both rows RETURN.** A dead-code exemption, **NOT a correctness claim.** Drilled both ways in §8.3 |
| `sla.types.ts`, `LifecycleStepperBar`, `LifecycleTimeline` (short-relative) | duration display, OUT per `RULING-P98A2-17` §1(b)+(c)                                                                                                                                                                                                                                                                                                                                                                                              |
| `SLACountdown` (short-relative)                                             | the `T−N`/`T+N` shape `CLAUDE.md` mandates, OUT per §1(b)                                                                                                                                                                                                                                                                                                                                                                                          |
| `OverdueCommitments` (short-relative)                                       | labelled overdue counter, OUT per §1(c)                                                                                                                                                                                                                                                                                                                                                                                                            |

---

## 11. Commits, and a self-reported no-op

| commit          | contents                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **`e686c9fca`** | the wave's work — **85 files**, pathspec built from my own edit table, `git commit -F <msgfile> -- <every path spelled out>` |
| **`83c820d9e`** | **EMPTY. Zero files, zero diff lines against its parent.** Self-reported below                                               |

**`git show --stat HEAD` verification, read not skimmed:**

- **Clause 5 — ZERO exogenous paths.** No `CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`,
  `.agents/skills/*`, `.claude/skills/*`, `_archive-98-attempt1-260818/`.
- **`comm -23 committed mine` is EMPTY** — no file landed that my table did not name.
- **`comm -13 committed mine` is EMPTY** — no file my table named failed to land.
- Gates re-verified **AT** that HEAD: guard RC 0, type-check RC 0.

### The no-op, its cause, and why it stays

I believed the pre-commit hook had left prettier residue AFTER the snapshot. **That belief was
wrong** — the hook formatted the STAGED copies, so `e686c9fca` already contains the formatted
content (`git show HEAD:…/tags.tsx` line 126 is the one-line form); the working-tree diff I saw
was the REVERSE, my unformatted leftovers against the formatted index.

Chasing that phantom: my first attempt used `git commit -- <paths>` against an EMPTY index, so
lint-staged reported _"could not find any staged files"_ and it failed RC 1 — **leaving paths
staged.** I then ran `git add -- <paths>` **without reading the index first**, and printed the
index only AFTER staging. It held `.planning/REQUIREMENTS.md` — **the OVERSEER's file, not
mine**, trapped in the shared index by a stray bare `git add` after its own `RULING-13` commit.
By commit time its content already matched HEAD, so `83c820d9e` came out empty.

**Verified, not assumed:** `REQUIREMENTS.md` is in **NEITHER** of my commits (grep count 0 on
both) and `git log -1 --` names `19f0ecde6` — the overseer's own commit — as its last toucher.
Nothing of theirs was swept in and nothing was lost. **That is luck, not discipline**, which is
why it is written here rather than left out of a clean-looking log.

**The mechanism, not the symptom:** the brief mandated building the pathspec from my own edit
table and reading `git show --stat` AFTER. It said nothing about **reading the index BEFORE
staging** — and on a shared tree with a concurrent writer, that is where a sibling's file is
inherited silently. **Adopted as standing practice, strengthened by the orchestrator:**
(a) use `git commit -F <msgfile> -- <paths>` **exclusively**, because that form never consults
or mutates the index and the failure mode cannot occur; (b) where staging is unavoidable (my
`git rm` of `relativeTime.ts`), assert `git diff --cached --name-only` is EMPTY before the first
stage and EQUAL to the intended set immediately before committing; (c) `git show --stat` after.

**`83c820d9e` is NOT amended and NOT reset**, on the orchestrator's word and the `ca5ade52f`
precedent: rewriting a shared milestone branch to tidy a cosmetic defect trades it for a real
risk, and a log that says what happened is worth more than one that looks clean.

---

## 12. Derived members NAMED but NOT repaired — none silently dropped

| member                                                                                                                                 | why it is not in this diff                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase/functions/contextual-suggestions/index.ts:605-606,616-617`                                                                   | `EDGECOPY-01`, owner **P102** (`RULING-P98A2-17` §2 Option C)                                                                                    |
| `supabase/functions/relationship-health/index.ts:226-227`                                                                              | same                                                                                                                                             |
| `components/pdf-generator-button/PDFGeneratorButton.tsx:127`                                                                           | ruled **CRITERION 2**, not routing — the key MISSES in both locales                                                                              |
| `components/notifications/NotificationList.tsx:125-126`                                                                                | hardcoded bilingual today/yesterday group headers — the class in negative-scope row 3. **No instrument covers it.** Found by me, ruled by nobody |
| `components/empty-states/NotificationPreviewTimeline.tsx:306`                                                                          | `{notification.timeAgo} {t('preview.ago')}` — assembly across a component boundary. Same class, same absence of cover                            |
| `pages/engagements/workspace/CalendarTab.tsx:76,91`                                                                                    | `Intl.DateTimeFormat` renders: `:76` month-first, `:91` a SECOND day-first implementation. Outside `files_modified`, no burn-down row, no ruling |
| `components/dossier/DossierDrawer/DrawerMetaStrip.tsx`, `components/delegation/DelegationCard.tsx`, `ConflictResolutionDialog:183-184` | **COMPLIANT MEMBERS** under form (2), not exemptions (§9)                                                                                        |
| `SLACountdown`, `sla.types.ts`, `LifecycleStepperBar`, `LifecycleTimeline`, `OverdueCommitments`                                       | ruled OUT by `RULING-P98A2-17` §1(b)/(c); carried as named guard exemptions so 9c's breadth is honest                                            |

Operator parks untouched: Arabic naturalness (AR-02 → P99), pixel RTL, `/calendar` baseline,
`E2ECRED-01`.

---

## 13. My own weakest point, named by me

**Not the population — the SEMANTIC BOUNDARY inside it, and I got it wrong once in my own
favour.**

The derivation held up: every dimension I tested returned a real finding, and the two record
corrections and the arithmetic correction survived independent re-derivation. What did **not**
hold was my §5 boundary work. I proposed three sub-classes as OUT — SLA tokens, labelled
counters, and (arguably) countdowns — and drew each from "the criterion's substance." Two were
ratified. **`DrawerMetaStrip` I read OUT by the KEY'S SHAPE rather than by what the VALUE says**,
which is the exact implementation-vs-behaviour error this leg has now filed seven times, drawn
by the seat whose brief was three pages of warnings about it. And I asserted `PDFGeneratorButton`
was already-localized **from key existence, without a resolution check** — inside a wave whose
own governing ruling is that existence is not resolution.

Both errors point the same way: **when I was the one proposing a boundary, I stopped testing it
one step early, and both times the untested step was the one that would have cost me scope.** The
guard I built has the same shape — its 9b/9c keys are mine, drilled on fixtures I also wrote, so
the drill proves they catch _what I thought of_. Negative-scope row 3 is where I expect the next
escape, and I have said plainly that nothing covers it.

What kept both errors cheap was structural, not personal: I named the members I was reading OUT
instead of dropping them, and I held every disputed file until a ruling. **The naming is what
made the corrections possible** — an unnamed member I had reasoned out of scope would have left
no trace in the diff at all.

SUMMARY-END
