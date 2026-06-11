# Dossier Workflows Round 12 Inspection - 2026-06-10

Static code-trace only. No source code was modified. Prior-coverage guard: round 11 already recorded 22/26 UAT passes, 0 regressions, fixed F1/F2/F4/F5, seeded the elected-official person dossier `19a22b0d-0577-4869-a38f-283a1ef9359d`, and left known B/data-blocked items in `reports/fanout-loop-state.json:3` and `reports/fanout-loop-state.json:155-164`; the UAT report says only F3 remained a by-design B observation at `reports/dossier-uat-round11-2026-06-10.md:12-16`. Findings below are limited to fresh evidence from the eight requested workflows.

## Findings Summary

| ID     | Severity | Bucket | Workflow                    | Finding                                                                                                                                                                     |
| ------ | -------- | ------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R12-01 | LOW      | A      | country positions           | Link-type filter strings bypass existing EN/AR keys and leak English in Arabic.                                                                                             |
| R12-02 | MEDIUM   | A      | organization MoUs           | MoU rows are styled/clickable but the row action is a TODO and no routed detail target exists.                                                                              |
| R12-03 | HIGH     | B      | forum schedule event        | Write side matches `calendar_entries.dossier_id`, but the Engagements tab only renders past events, so a newly scheduled future event is not visible there. VERIFY vs live. |
| R12-04 | MEDIUM   | A      | forum schedule event        | Calendar create invalidates `['calendar-events']` only, leaving dossier Engagements tab and overview Upcoming Events KPI stale.                                             |
| R12-05 | CRITICAL | B      | engagement after-action     | Header path enters the unified engagement-dossier workspace, but after-action create still validates legacy `engagements.id`. VERIFY vs live.                               |
| R12-06 | HIGH     | A      | topic positions             | Positions attach dialog still closes without persisting selected IDs or invalidating the tab reader.                                                                        |
| R12-07 | MEDIUM   | B      | person documents            | Generic person Docs tab exposes MoUs even though the MoU signatory contract is country/organization only. VERIFY vs live.                                                   |
| R12-08 | LOW      | A      | elected-official committees | Committee role JSONB accepts arbitrary strings while tab i18n only covers three roles, causing raw role tokens in AR for wider committee roles.                             |

## 1. Country - Positions Tab Journey

Trace: `/dossiers/countries/$id/positions` lazy-loads `DossierPositionsTab` at `frontend/src/routes/_protected/dossiers/countries/$id/positions.tsx:17-25`. The tab reads `position_dossier_links` with embedded `positions` via `useDossierPositionLinks` at `frontend/src/components/positions/DossierPositionsTab.tsx:39-44` and `frontend/src/hooks/useDossierPositionLinks.ts:120-158`. The attach affordance opens `AttachPositionDialog` at `frontend/src/components/positions/DossierPositionsTab.tsx:74-80` and `frontend/src/components/positions/DossierPositionsTab.tsx:180-187`.

R12-01 - LOW - bucket A  
Evidence: `DossierPositionsTab` hard-codes the link-type aria label, placeholder, and option labels at `frontend/src/components/positions/DossierPositionsTab.tsx:100-114`. Existing localized keys for the same contract are present at `frontend/src/i18n/en/positions.json:62-76` and `frontend/src/i18n/ar/positions.json:62-76`; the rest of the tab uses colon-form namespaced keys at `frontend/src/components/positions/DossierPositionsTab.tsx:67-79` and `frontend/src/components/positions/DossierPositionsTab.tsx:124-133`.  
Broken contract: `positions:position_dossier_links.link_type` and `positions:position_dossier_links.types.primary|related|reference` are not used; there is no localized key used for "All Link Types".  
Failure signature: Arabic `/dossiers/countries/$id/positions` shows "All Link Types", "Primary", "Related", "Reference", and English `aria-label="Filter by link type"` while nearby status/search controls localize.  
Fix class: small i18n repair; use existing keys and add/use a mirrored `all_link_types` key.

## 2. Organization - MoUs Tab Journey

Trace: `/dossiers/organizations/$id/mous` lazy-loads `DossierMoUsTab` at `frontend/src/routes/_protected/dossiers/organizations/$id/mous.tsx:17-25`. The tab queries `mous` where `signatory_1_dossier_id` or `signatory_2_dossier_id` equals the dossier id at `frontend/src/components/dossiers/DossierMoUsTab.tsx:57-69`; generated types confirm those columns and `lifecycle_state` at `frontend/src/types/database.types.ts:19505-19547`. Status labels use `mous.status.${lifecycle_state}` at `frontend/src/components/dossiers/DossierMoUsTab.tsx:216-222`, with EN/AR keys at `frontend/src/i18n/en/dossiers.json:491-518` and `frontend/src/i18n/ar/dossiers.json:278-297`. RTL title selection is handled at `frontend/src/components/dossiers/DossierMoUsTab.tsx:51` and `frontend/src/components/dossiers/DossierMoUsTab.tsx:160-162`.

R12-02 - MEDIUM - bucket A  
Evidence: each MoU card has `cursor-pointer hover:shadow-lg` and an `onClick` handler, but the handler only contains a TODO at `frontend/src/components/dossiers/DossierMoUsTab.tsx:147-153`. The generated route tree registers only the global `/mous` route and the organization dossier `/dossiers/organizations/$id/mous` tab for MoU paths at `frontend/src/routeTree.gen.ts:1414` and `frontend/src/routeTree.gen.ts:1547`.  
Broken contract: row action destination/modal handler is missing; the inspected row has no wired `to` route, dialog open state, or detail loader for the clicked `mou.id`.  
Failure signature: MoU rows visibly invite click/hover but clicking a row does nothing.  
Fix class: remove the interactive styling/handler until a detail route or modal exists, or wire the row to an existing MoU detail contract.

## 3. Forum - Schedule Event End-to-End

Trace: Add-to-Dossier exposes the `event` action in the planning group at `frontend/src/components/dossier/AddToDossierMenu.tsx:137-141` and `frontend/src/components/dossier/AddToDossierMenu.tsx:167-175`; the handler opens the event dialog at `frontend/src/hooks/useAddToDossierActions.tsx:172-175`. `EventDialog` posts `entry_type`, `title_en`, `start_datetime`, `linked_item_type: 'dossier'`, and `linked_item_id: dossierContext.dossier_id` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:722-739`. The edge function treats non-allowed linked types with a `linked_item_id` as `dossier_id` at `supabase/functions/calendar-create/index.ts:98-109` and inserts into `calendar_entries` with `dossier_id`, `entry_type`, `event_date`, and `event_time` at `supabase/functions/calendar-create/index.ts:115-136`. The reader is aligned to `calendar_entries.dossier_id` and `event_date` at `frontend/src/services/dossier-overview.service.ts:805-815`. EN/AR dialog entry-type keys exist at `frontend/src/i18n/en/dossier.json:948-956` and `frontend/src/i18n/ar/dossier.json:948-956`; event badges have EN/AR parity at `frontend/src/i18n/en/dossier-overview.json:181-193` and `frontend/src/i18n/ar/dossier-overview.json:181-193`.

R12-03 - HIGH - bucket B - VERIFY vs live  
Evidence: the write side now writes the expected `calendar_entries.dossier_id` path at `supabase/functions/calendar-create/index.ts:98-136`, and the overview reader filters that same column at `frontend/src/services/dossier-overview.service.ts:805-815`. However, `DossierEngagementsTab` reads `calendar_events.past` only at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:53-66`; upcoming/today events are not included in the entries array. The overview KPI reads `stats.upcoming_events_count` at `frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx:31-48`.  
Broken contract: "Schedule Event" creates a future calendar entry that can feed `calendar_events.upcoming` / `stats.upcoming_events_count`, but the forum Engagements tab ignores `calendar_events.upcoming` and `calendar_events.today`.  
Failure signature: after scheduling a future event from a forum dossier, the created event can count as an Upcoming Events KPI after refetch, but no event row appears in the Engagements tab until the event becomes past.  
Fix class: product decision/live verification needed: either Engagements is history-only and the expectation should move to a Calendar/Upcoming surface, or include upcoming/today calendar entries in this tab.

R12-04 - MEDIUM - bucket A  
Evidence: `useCreateCalendarEvent` invalidates only `['calendar-events']` at `frontend/src/domains/calendar/hooks/useCreateCalendarEvent.ts:15-24`. The forum Engagements tab uses `['dossier-tab', 'engagements', dossierId]` at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:39-46`; the shared overview KPI uses `dossierOverviewKeys.detailWithOptions(...)` at `frontend/src/hooks/useDossierOverview.ts:49-56` and stays fresh for `STALE_TIME.NORMAL` at `frontend/src/hooks/useDossierOverview.ts:71-73`. `EventDialog` already has `dossierContext.dossier_id` when it calls the mutation at `frontend/src/components/dossier/AddToDossierDialogs.tsx:725-739`.  
Broken contract: event create does not invalidate the dossier-specific readers that show the newly linked event.  
Failure signature: success toast/dialog close can leave the forum Engagements tab and overview Upcoming Events KPI unchanged until manual reload, focus refetch, or the 5-minute stale window.  
Fix class: after event create, invalidate `['dossier-tab', 'engagements', dossierContext.dossier_id]` and `dossierOverviewKeys.detail(dossierContext.dossier_id)` (prefix) from the dialog or pass dossier context into the mutation.

## 4. Engagement - Log After-Action Journey

Trace: the workspace header button links to `/engagements/$engagementId/after-action` at `frontend/src/components/workspace/WorkspaceShell.tsx:100-108`. The workspace data path uses the unified engagement-dossier repository `/engagement-dossiers/:id` at `frontend/src/domains/engagements/hooks/useEngagements.ts:64-77` and `frontend/src/domains/engagements/repositories/engagements.repository.ts:77-79`, backed by `get_engagement_full(p_engagement_id)` at `supabase/functions/engagement-dossiers/index.ts:384-399`. Header EN/AR keys exist at `frontend/src/i18n/en/workspace.json:21-29` and `frontend/src/i18n/ar/workspace.json:25-33`; after-action form EN/AR keys exist at `frontend/src/i18n/en/common.json:566-572` and `frontend/src/i18n/ar/common.json:566-572`.

R12-05 - CRITICAL - bucket B - VERIFY vs live  
Evidence: the after-action route imports the legacy `@/hooks/useEngagement` at `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx:1-4`; that hook queries `dossiers` joined to `engagements!inner` and filters `.eq('id', engagementId).eq('type','engagement')` at `frontend/src/hooks/useEngagement.ts:35-64`. The same route sends `engagement_id`, `dossier_id`, and `publication_status` into `useCreateAfterAction` at `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx:55-66`, but the frontend request type only declares `engagement_id`, `is_confidential`, `attendees`, `notes`, `decisions`, `commitments`, `risks`, and `follow_up_actions` at `frontend/src/hooks/useAfterAction.ts:143-152`; the edge request interface matches that narrower shape at `supabase/functions/after-actions-create/index.ts:39-48`. The edge validates by reading legacy `.from('engagements').select('dossier_id').eq('id', body.engagement_id)` at `supabase/functions/after-actions-create/index.ts:79-84`, then inserts `after_action_records.engagement_id = body.engagement_id` and `dossier_id = engagement.dossier_id` at `supabase/functions/after-actions-create/index.ts:116-128`. Generated types show the unified `engagement_dossiers.id` table separately at `frontend/src/types/database.types.ts:10521-10550`.  
Broken contract: the header journey starts with a unified engagement-dossier id, but the after-action page/edge treats the route param as a legacy `engagements.id`; `dossier_id` and `publication_status` supplied by the page are not part of the accepted create contract and are ignored by the edge.  
Failure signature: clicking "Log After-Action" from the engagement workspace can land on an "engagement not found" page or save draft with a 404 `Engagement not found` / 403 `Forbidden: No access to dossier` if the route param is an `engagement_dossiers.id`.  
Fix class: live verification and backend/edge decision required: either bridge unified engagement ids to legacy `engagements` ids before create, or migrate `after-actions-create` to the unified engagement-dossier contract.

## 5. Topic - Positions Attach Flow

Trace: `/dossiers/topics/$id/positions` reuses the same `DossierPositionsTab` at `frontend/src/routes/_protected/dossiers/topics/$id/positions.tsx:17-25`. `AttachPositionDialog` passes selected position IDs to `onAttach(selectedIds)` at `frontend/src/components/positions/AttachPositionDialog.tsx:113-123`, and its button triggers that handler at `frontend/src/components/positions/AttachPositionDialog.tsx:365-380`.

R12-06 - HIGH - bucket A  
Evidence: the topic/country shared tab passes an `onAttach` implementation that ignores the selected IDs and only closes the dialog at `frontend/src/components/positions/DossierPositionsTab.tsx:180-187`. The existing write contract is available: `createPositionDossierLink(positionId, input)` posts to `/positions-dossiers-create?positionId=${positionId}` at `frontend/src/domains/positions/repositories/positions.repository.ts:160-168`, with input `{ dossier_id, link_type?, notes? }` at `frontend/src/domains/positions/types/index.ts:136-140`; the edge requires `dossier_id` at `supabase/functions/positions-dossiers-create/index.ts:35-44` and inserts `position_id`, `dossier_id`, `link_type`, `notes`, and `created_by` into `position_dossier_links` at `supabase/functions/positions-dossiers-create/index.ts:79-96`. The available hook invalidates `['position-dossier-links', positionId]` only at `frontend/src/domains/positions/hooks/useCreatePositionDossierLink.ts:13-23`, while the tab reader key is `['dossier-position-links', dossierId, filters]` at `frontend/src/hooks/useDossierPositionLinks.ts:120-122`.  
Broken contract: selected IDs from `AttachPositionDialog` never persist to `position_dossier_links`, and the existing mutation hook invalidates the inverse position-detail key, not the dossier tab key.  
Failure signature: on `/dossiers/topics/$id/positions`, selecting positions and clicking "Attach selected" closes the dialog, but no rows are added to the Positions tab; manual refresh still shows unchanged data because no insert occurred.  
Fix class: small data-contract repair; call `createPositionDossierLink` for each selected position with `dossier_id`, then invalidate `['dossier-position-links', dossierId]`/current filters as well as any position-detail link keys.

## 6. Working Group - Tasks Tab New Task Journey

No new finding. Trace: `/dossiers/working_groups/$id/tasks` lazy-loads `DossierWorkItemsTab` at `frontend/src/routes/_protected/dossiers/working_groups/$id/tasks.tsx:17-25`. The tab reads work items under `['dossier-tab', 'work_items', dossierId]` at `frontend/src/components/dossier/tabs/DossierWorkItemsTab.tsx:26-39`, and `fetchWorkItems` reads `work_item_dossiers.dossier_id` at `frontend/src/services/dossier-overview.service.ts:605-611`. `TaskDialog` sends `title`, `description`, `assignee_id`, and `priority` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:345-354`; the frontend task request marks `workflow_stage` and `sla_deadline` optional at `frontend/src/services/tasks-api.ts:26-37`. The `tasks-create` edge writes `workflow_stage: body.workflow_stage || 'todo'` and `sla_deadline: body.sla_deadline || null` at `supabase/functions/tasks-create/index.ts:184-193`, then inserts into `tasks` at `supabase/functions/tasks-create/index.ts:207-212`. The dialog links via `work-item-dossiers` and invalidates the work-items tab/timeline keys at `frontend/src/components/dossier/AddToDossierDialogs.tsx:356-363`; the edge inserts `work_item_type`, `work_item_id`, `dossier_id`, `inheritance_source`, and `is_primary` into `work_item_dossiers` at `supabase/functions/work-item-dossiers/index.ts:240-255`. This matches CommitmentDialog invalidation parity at `frontend/src/components/dossier/AddToDossierDialogs.tsx:497-506`. EN/AR task form keys are present at `frontend/src/i18n/en/dossier.json:906-927` and `frontend/src/i18n/ar/dossier.json:906-927`; the tab sets RTL direction at `frontend/src/components/dossier/tabs/DossierWorkItemsTab.tsx:23-39`.

## 7. Person - Documents Tab Journey

Trace: `/dossiers/persons/$id/docs` lazy-loads `DossierDocumentsTab` at `frontend/src/routes/_protected/dossiers/persons/$id/docs.tsx:17-25`. The tab fetches only `documents` at `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:26-30` and passes RTL to `DocumentsSection` at `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:45-52`. Post-round-11, briefs remain an intentionally empty group after the dead sub-fetch removal at `frontend/src/services/dossier-overview.service.ts:517-523`.

R12-07 - MEDIUM - bucket B - VERIFY vs live  
Evidence: `fetchDocuments` reads positions through `position_dossier_links.dossier_id` at `frontend/src/services/dossier-overview.service.ts:464-485`; the migration explicitly says position links can target any dossier type, including person, at `supabase/migrations/20251022000009_update_polymorphic_refs.sql:49-52`. The same generic documents reader also queries MoUs via `mous.signatory_1_dossier_id` and `mous.signatory_2_dossier_id` at `frontend/src/services/dossier-overview.service.ts:487-515`, but the migration comments define those signatories as country or organization at `supabase/migrations/20251022000009_update_polymorphic_refs.sql:74-76`. `DocumentsSection` always includes the MoUs tab when total documents are nonzero at `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:221-253`; EN/AR tab labels exist at `frontend/src/i18n/en/dossier-overview.json:113-128` and `frontend/src/i18n/ar/dossier-overview.json:113-128`.  
Broken contract: person dossiers can honestly show position documents, but the same person Docs surface advertises MoUs via `mous.signatory_*_dossier_id` even though that signatory contract is documented as country/organization.  
Failure signature: a person dossier with any position document renders a "MoUs (0)" sub-tab and "No MOUs found" empty state, implying person-linked MoUs are supported; if staging contains person IDs in `mous.signatory_*_dossier_id`, that would contradict the migration contract and must be checked before hiding.  
Fix class: live SQL verification/product decision needed; if no person signatories exist and the contract is country/organization only, hide or omit the MoUs sub-tab for person dossiers.

## 8. Elected Official - Committees Tab

Trace: `/dossiers/elected-officials/$id/committees` reads `committee_assignments` JSONB from the elected-official person record via `useElectedOfficial(id)` at `frontend/src/routes/_protected/dossiers/elected-officials/$id/committees.tsx:24-44`. The hook calls `/api/elected-officials/:id` and unwraps `{ data }` at `frontend/src/domains/elected-officials/hooks/useElectedOfficials.ts:66-77`; the backend calls `get_person_full(p_person_id)`, unwraps `profile.person`, verifies `person_subtype === 'elected_official'`, and returns `person` at `backend/src/api/elected-officials.ts:178-220`. The column is JSONB on `persons` at `supabase/migrations/20260202000001_merge_elected_official_into_person.sql:34-40`. The tab uses RTL-safe names and `text-start` at `frontend/src/routes/_protected/dossiers/elected-officials/$id/committees.tsx:31-77` and `frontend/src/routes/_protected/dossiers/elected-officials/$id/committees.tsx:98-121`.

R12-08 - LOW - bucket A  
Evidence: the routed tab translates role labels through `t('committees.roles.${committee.role}', { defaultValue: committee.role })` at `frontend/src/routes/_protected/dossiers/elected-officials/$id/committees.tsx:75-77` and `frontend/src/routes/_protected/dossiers/elected-officials/$id/committees.tsx:119-120`. EN/AR keys cover only `chair`, `vice_chair`, and `member` at `frontend/src/i18n/en/elected-officials.json:63-75` and `frontend/src/i18n/ar/elected-officials.json:63-75`. The frontend elected-official type also narrows roles to those three at `frontend/src/domains/elected-officials/types/elected-official.types.ts:36-40`, but the backend create/update schema accepts `role: z.string()` inside `committee_assignments` at `backend/src/api/elected-officials.ts:89-98`; the canonical committee membership table recognizes wider roles including `alternate`, `observer`, `secretary`, and `rapporteur` at `supabase/migrations/20260206120008_committees.sql:188-193`.  
Broken contract: JSONB role ingestion is wider than the tab/type/i18n contract, and missing role keys fall back to raw stored tokens.  
Failure signature: an elected official with `committee_assignments[].role = 'observer'`, `alternate`, `secretary`, or `rapporteur` displays that raw English/underscore token in Arabic instead of a localized role label. No claim is made here about the seeded Sen. Maria Vergara row's current role values; verifying that row requires live staging.  
Fix class: add mirrored `elected-officials:committees.roles.alternate|observer|secretary|rapporteur` keys and align the local `CommitteeAssignment.role` type/schema with the accepted role set, or constrain backend JSONB input to the three currently supported values.

---

## Round-12 Fix & Live-Verification Outcomes (Claude, 2026-06-10)

Servers run live (frontend :5173 → staging, backend :5001 with `.env.test`).
Bucket-A findings fixed; the topic/country positions-attach workflow was
traced end-to-end in a real browser, which uncovered a 4-bug stack (R12-06
plus three NEW backend findings R12-09/10/11) that made attach 100% broken.

### Bucket-A fixes (committed)

- **R12-06** FIXED + live-verified. `DossierPositionsTab.onAttach` now calls
  `createPositionDossierLink` per selected id and invalidates
  `['dossier-position-links', dossierId]`; success/partial toasts (EN+AR).
  Proven: attaching a position to the Vision 2030 topic now persists and the
  tab shows "1 position attached" with the position title.
- **R12-04** FIXED. `EventDialog` invalidates `['dossier-tab','engagements',id]`
  and `dossierOverviewKeys.detail(id)` after create.
- **R12-01** FIXED. Link-type filter localized (existing
  `positions:position_dossier_links.types.*` + new `dossier_tab.all_link_types`
  EN+AR). NOTE: the filter VALUES (primary/related/reference) are themselves
  wrong vs live — see R12-11b.
- **R12-08** FIXED. Committee role keys alternate/observer/secretary/rapporteur
  added EN+AR.
- **R12-02** FIXED. Dead MoU row click (cursor-pointer + TODO onClick) removed.

### NEW findings surfaced by live verification (the attach 4-bug stack)

- **R12-09 — CRITICAL — bucket A (FIXED+deployed v10).** The post-insert SELECT
  in `positions-dossiers-create` embedded `dossiers(... reference_type ...)`;
  live dossiers has `type`, not `reference_type`, so every attach 42703'd → 500
  and rolled back. Round-10 fixed the INSERT (`linked_by`→`created_by`) but
  missed this SELECT. Changed `reference_type`→`type`.
- **R12-10 — CRITICAL — bucket B→FIXED (migration 20260610000002).** The
  `position_dossier_links` INSERT/SELECT RLS resolved the user's clearance with
  a correlated subquery keyed `dossiers.id = auth.uid()` (dossier UUID vs user
  UUID — never matches) → COALESCE to 1 → gate collapsed to
  `sensitivity_level <= 1` for ALL users. Blocked linking/viewing on 20 of 35
  staging dossiers (sensitivity ≥ 2). DELETE had the same typo
  (`position_dossier_links.id = auth.uid()`). Corrected to
  `profiles.user_id = auth.uid()`; restores the intended clearance gate.
- **R12-11 — CRITICAL — bucket A (FIXED+deployed v11).** The edge defaulted
  `link_type` to `'related'`, but the live CHECK only allows
  `applies_to | related_to | endorsed_by | opposed_by`, so every default attach
  violated the constraint → 500. Changed default to `'related_to'`.
  Live-verified: attach now returns 201 and the row persists.
- **R12-11b — MEDIUM — bucket B (documented).** The whole frontend link_type
  vocabulary (`'primary' | 'related' | 'reference'` in the type union, filter
  values, and i18n keys) is wrong vs the live CHECK
  (`applies_to/related_to/endorsed_by/opposed_by`). The link-type FILTER is
  therefore non-functional against real rows (default 'all' hides this). Needs
  a coordinated realign of the type union, `DossierPositionsTab` filter values,
  `useDossierPositionLinks`, and the i18n keys. Not done this round.

### Bucket-B live-verification results

- **R12-03** (forum Engagements tab ignores upcoming/today calendar entries):
  CONFIRMED by code (`DossierEngagementsTab` reads `calendar_events.past` only).
  Product decision stands (history-only tab vs include upcoming). Not changed.
- **R12-05** (after-action uses legacy `engagements.id`): LATENT, NOT
  reproducing. `engagement_dossiers.id` mirrors `engagements.id` 1:1 (all 3
  rows), so the route loads the full After-Action form with no 404/403. Risk
  only materializes if an unmirrored unified id is ever created. Downgraded
  from CRITICAL-repro to latent-risk.
- **R12-07** (person Docs advertises MoUs): LATENT. `mous` is empty (0 rows),
  0 person signatories, and the person has no documents, so the MoU sub-tab
  doesn't render. Honesty concern stands for the data-present case; no live
  repro.

### Deploys this round

- `positions-dossiers-create` v9→v11 (reference_type→type, default
  related→related_to) — LIVE on staging.
- Migration `20260610000002_fix_position_dossier_links_rls_clearance_subquery`
  — applied to staging.

### Seeds left in place

- 2 positions (`44c105d3…`, `4baf9c95…`, author = admin, published).
- 1 position_dossier_link (`4baf9c95…` → Vision 2030 topic, `related_to`).
