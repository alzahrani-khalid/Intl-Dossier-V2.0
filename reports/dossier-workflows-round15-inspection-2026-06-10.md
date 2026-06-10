# Dossier Workflows Round 15 Inspection - 2026-06-10

Static code sweep plus read-only Supabase aggregate checks. No source code was modified.

Prior-round guard: `reports/fanout-loop-state.json` marks rounds 12-14 complete. I did not re-report the fixed positions attach chain, link-type vocabulary realign, clear-filters fix in `DossierPositionsTab`, or type-aware `DocumentsSection`.

Read-only live verification for deferred DB claims: staging currently has `engagement_dossiers_total=3`, `engagement_dossiers.host_organization_id IS NOT NULL=0`, `engagement_dossiers.host_country_id IS NOT NULL=0`, `engagement_positions=0`, `person_engagements=0`, seeded EO `person_engagements=0`, and `position_dossier_links` by linked dossier type = `{ topic: 1, organization: 1 }`.

## Findings Summary

| ID     | Severity | Bucket | Surface                  | Finding                                                                             |
| ------ | -------- | ------ | ------------------------ | ----------------------------------------------------------------------------------- |
| R15-01 | LOW      | A      | positions library        | Same-class raw clear-filters key leak remains outside the fixed dossier tab.        |
| R15-02 | MEDIUM   | A      | engagement workspace     | Multiple routed workspace action buttons are active no-ops.                         |
| R15-03 | LOW      | A      | position linked dossiers | Linker error state can render raw `errors.failed_to_load`.                          |
| R15-04 | LOW      | A      | position versions        | Compare button has an empty handler while comparison already renders automatically. |

## Bucket-A Findings

### R15-01 - LOW - positions library clear-filters key leak

Evidence: `PositionsLibraryPage` binds `useTranslation(['positions', 'common'])` at `frontend/src/routes/_protected/positions.tsx:52-53`. The active-filter button already uses the correct local aria key at `frontend/src/routes/_protected/positions.tsx:277-282`, but the visible label still calls `t('common:clear_filters')` at `frontend/src/routes/_protected/positions.tsx:283`. The correct key exists as `positions:library.clear_filters` in both locales at `frontend/src/i18n/en/positions.json:2-27` and `frontend/src/i18n/ar/positions.json:2-27`. `common:clear_filters` is absent; `common.json` only has other clear/filter shapes such as nested `clearFilters`, not this key.

Broken contract: the visible label uses a namespace/key that is not registered, while the same button's aria-label already proves the intended positions namespace key.

UI failure signature: on `/positions`, after any search/status/type filter is active, the clear button can display raw `clear_filters` instead of "Clear Filters" / "مسح الفلاتر".

Safe bucket-A fix: change the visible label to `t('positions:library.clear_filters')`. This is the exact same bug class as R13-04, but in the positions library route rather than `DossierPositionsTab`.

### R15-02 - MEDIUM - engagement workspace no-op action cluster

Evidence: the engagement workspace is routed from engagement dossier flows, and several visible buttons have no `onClick`, `asChild` link, disabled state, or submit behavior:

- Calendar empty-state Add Event: `frontend/src/pages/engagements/workspace/CalendarTab.tsx:155-169`.
- Calendar header Add Event, explicitly marked TODO: `frontend/src/pages/engagements/workspace/CalendarTab.tsx:183-198`.
- Tasks empty-state Create Task: `frontend/src/pages/engagements/workspace/TasksTab.tsx:120-132`.
- Tasks header Create Task: `frontend/src/pages/engagements/workspace/TasksTab.tsx:177-181`.
- Context empty-state Link Dossier: `frontend/src/pages/engagements/workspace/ContextTab.tsx:190-201`.
- Context footer Link Dossier: `frontend/src/pages/engagements/workspace/ContextTab.tsx:224-227`.
- Overview quick actions Transition Stage and Create Task: `frontend/src/pages/engagements/workspace/OverviewTab.tsx:326-344`.
- Docs Upload placeholder: `frontend/src/pages/engagements/workspace/DocsTab.tsx:145-154`.

Broken contract: action-styled controls promise creates, links, uploads, or transitions, but they are inert. Wired actions in the same area, such as Schedule Poll and Log After-Action, make the no-ops look real rather than intentionally unavailable.

UI failure signature: users can click Add Event, Create Task, Link Dossier, Transition Stage, or Upload document in the engagement workspace and nothing happens.

Safe bucket-A fix: hide these buttons or render them disabled with non-clickable styling until their planned workflows exist. Wiring the workflows is phase work; removing the false affordances is small and verifiable.

### R15-03 - LOW - position linked-dossiers error key leak

Evidence: `PositionDossierLinker` binds `useTranslation(['positions', 'translation'])` at `frontend/src/components/positions/PositionDossierLinker.tsx:26-27`, then renders `t('errors.failed_to_load')` in its error branch at `frontend/src/components/positions/PositionDossierLinker.tsx:77-80`. The component is mounted by the position editor's linked-dossiers section at `frontend/src/components/position-editor/PositionEditor.tsx:514-522`.

Broken contract: with this namespace array, `common.loading`, `common.cancel`, and `common.saving` fall back through `translation`, but `errors.failed_to_load` is not present under `positions` or the common/translation bundle. The missing key is only visible on query failure, so this is not a primary-path break.

UI failure signature: if the linked-dossiers query fails on a position editor page, the error card can show raw `errors.failed_to_load`.

Safe bucket-A fix: add `positions:errors.failed_to_load` in EN/AR or use an existing registered error key with an explicit namespace.

### R15-04 - LOW - redundant no-op Compare Versions button

Evidence: after two versions are selected, `/positions/$id/versions` renders a Compare Versions button with `onClick={() => {}}` at `frontend/src/routes/_protected/positions/$id/versions.tsx:92-96`. The actual comparison card renders automatically below it when `canCompare` is true at `frontend/src/routes/_protected/positions/$id/versions.tsx:143-164`.

Broken contract: the button advertises a command but performs no action. Because the comparison already appears automatically, the button is redundant rather than a needed launcher.

UI failure signature: selecting two versions shows "Compare Versions"; clicking it has no visible effect.

Safe bucket-A fix: remove the button or replace it with a real action. Removal is the safe unattended option because the comparison is already rendered.

## Deferred / Not Bucket-A

- Add-to-Dossier New Position remains R6-03/B, not a new A. `PositionDialog` sends `position_type_id: dossierContext.dossier_id`, blank `title_ar`, and empty `audience_groups` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:624-633`, while `positions-create` requires bilingual titles, at least one audience group, and a real `position_types.id` at `supabase/functions/positions-create/index.ts:40-69` and `supabase/functions/positions-create/index.ts:103-118`. Fix needs picker/default/product decisions plus `position_dossier_links`.
- Engagement Positions remains R14-02/B. Workspace tabs omit positions at `frontend/src/components/workspace/WorkspaceTabNav.tsx:26-33`; the only section still reads legacy `engagement_positions` at `frontend/src/hooks/useEngagementPositions.ts:51-60` and its attach callback discards selection at `frontend/src/components/positions/EngagementPositionsSection.tsx:161-169`. Live read: `engagement_positions=0`, and current `position_dossier_links` are only topic/org.
- Host/person engagement contracts remain B. The generic routed Engagements tab only fetches `related_dossiers` and `calendar_events` at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:39-54`; merging `engagement_dossiers.host_organization_id` or `person_engagements` is product/data-contract work. Live read: host-org engagement links and person engagement links are both 0.
- Large raw-key debt inside legacy/unrouted person/elected-official detail sections was not reported as A. Those components are part of the existing route-or-delete phase-sized backlog; adding locale keys to dead surfaces would be low-value churn.

## Negative Checks

- `supabase/functions` has no remaining dossier embed hit for `reference_type`; the only current hit is `staff-availability` using its own `reference_type: 'staff_profile'`.
- No swept dossier/positions/workspace surface still uses `Intl.NumberFormat(i18n.language)` or `Intl.NumberFormat(i18n.resolvedLanguage)` bare.
- No new DB/RPC break is asserted in the bucket-A findings above.

---

## Round-15 Fix Outcomes (Claude, 2026-06-10)

All 4 bucket-A findings FIXED (build green, lint clean). Round 15 was an honest
completeness sweep; its negative checks (no remaining reference_type embed in
edge fns, no bare Intl.NumberFormat(i18n.language) in swept surfaces) confirm
the round-12/14 same-bug-class repairs are complete.

- **R15-01 FIXED** — `positions.tsx` (library) clear-filters label switched from
  the absent `common:clear_filters` to `positions:library.clear_filters` (the
  key its own aria-label already used). Same bug class as the round-13 R13-04
  fix. Verified: no raw `clear_filters` renders.
- **R15-02 FIXED** — the 9 inert engagement-workspace action buttons (Calendar
  Add Event ×2, Tasks Create Task ×2, Context Link Dossier ×2, Overview
  Transition Stage + Create Task, Docs Upload) now carry `disabled` so they are
  visibly non-actionable instead of false affordances. The genuinely-wired
  controls in the same areas (Schedule Poll, Log After-Action, Generate
  Briefing) are untouched. Wiring the real workflows remains phase work
  (overlaps R14-02).
- **R15-03 FIXED** — added `errors.failed_to_load` to the positions namespace
  (EN "Failed to load" / AR "فشل التحميل") so `PositionDossierLinker`'s error
  branch no longer leaks the raw key on query failure.
- **R15-04 FIXED** — removed the redundant no-op "Compare Versions" button on
  `/positions/$id/versions` (the comparison already renders automatically when
  two versions are selected); dropped the now-orphaned `GitCompare` import.

Deferred (unchanged, phase-sized B): Add-to-Dossier New Position contract
(R6-03), engagement Positions tab (R14-02), host-org / person_engagements
contracts (R13-02/R14-03), and raw-key debt inside legacy/unrouted person/EO
detail sections (route-or-delete backlog).
