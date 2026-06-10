# Dossier Workflows Round 13 Inspection - 2026-06-10

Static code-trace only. No source code was modified. Prior-round guard: `reports/fanout-loop-state.json:160-164` says R12-06/R12-04/R12-01/R12-08/R12-02 are fixed, `positions-dossiers-create` is live v11, and R12-11b remains the open frontend `link_type` vocabulary mismatch. Round 12 documents the live CHECK as `applies_to | related_to | endorsed_by | opposed_by` and the unfixed frontend vocabulary at `reports/dossier-workflows-round12-inspection-2026-06-10.md:139-150`; this report does not re-report fixed R12 items.

## Findings Summary

| ID     | Severity | Bucket | Workflow                    | Finding                                                                                                                                                                                                                                                   |
| ------ | -------- | ------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R13-01 | HIGH     | A      | positions link-type realign | Frontend still encodes `primary                                                                                                                                                                                                                           | related | reference`against live`position_dossier_links.link_type`; filters, create payloads, badges, and topic position grouping are wrong. VERIFY vs live: R12 live-verified the CHECK and v11 default. |
| R13-02 | HIGH     | B      | organization engagements    | Organization Engagements tab reads relationship-derived engagement dossiers plus past calendar entries, but not `engagement_dossiers.host_organization_id` rows. VERIFY vs live before choosing direct Supabase vs edge/RPC fix.                          |
| R13-03 | MEDIUM   | B      | working_group documents     | WG Docs can honestly render position-linked documents, but still exposes MoU and briefs buckets when any docs exist; MoUs are documented country/org-only, and briefs are hardcoded empty after R11. VERIFY vs live for WG MoU signatories before hiding. |

## Priority 1 - R12-11b Realign Recipe

R13-01 - HIGH - bucket A - VERIFY vs live  
Evidence: the live DB/R12 evidence says `position_dossier_links_link_type_check` allows only `applies_to | related_to | endorsed_by | opposed_by` at `reports/dossier-workflows-round12-inspection-2026-06-10.md:139-150`, and the source migration matches that at `supabase/migrations/20251022000009_update_polymorphic_refs.sql:21-26`. The edge create default is already canonical `related_to` at `supabase/functions/positions-dossiers-create/index.ts:85-88`. The stale frontend surfaces are:

1. `frontend/src/domains/positions/types/index.ts:108-139`  
   Add/export a canonical `PositionDossierLinkType = 'applies_to' | 'related_to' | 'endorsed_by' | 'opposed_by'`; use it for `PositionDossierLink.link_type`, `PositionDossierLinksFilters.link_type`, and `CreatePositionDossierLinkInput.link_type`.

2. `frontend/src/hooks/useDossierPositionLinks.ts:13-66`  
   Update docs/examples and change `DossierPositionLink.link_type` plus `UseDossierPositionLinksFilters.link_type` to the same canonical type. The query already filters the passed value at `frontend/src/hooks/useDossierPositionLinks.ts:160-162`.

3. `frontend/src/components/positions/DossierPositionsTab.tsx:35-45`  
   Change `linkTypeFilter` state from `'primary' | 'related' | 'reference' | 'all'` to canonical values plus `'all'`; the filter payload at line 45 then sends values the DB can match.

4. `frontend/src/components/positions/DossierPositionsTab.tsx:105-123`  
   Change the `onValueChange` cast and `SelectItem` values to `applies_to`, `related_to`, `endorsed_by`, `opposed_by`; use `positions:position_dossier_links.types.*` colon-form keys. Keep `positions:dossier_tab.all_link_types`.

5. `frontend/src/components/positions/PositionDossierLinker.tsx:30-49`  
   Change the add-link state/default/reset from `related` to `related_to`; otherwise this editor path posts a CHECK-violating `link_type` through `createLink.mutateAsync` at `frontend/src/components/positions/PositionDossierLinker.tsx:41-44`.

6. `frontend/src/components/positions/PositionDossierLinker.tsx:126-139` and `frontend/src/components/positions/PositionDossierLinker.tsx:197`  
   Replace old select values/labels with the four canonical keys. The dynamic display line can stay once the keys exist. This component uses `useTranslation(['positions','translation'])` at line 26, so `t('position_dossier_links.types.*')` resolves in the first namespace; no cross-namespace dot-form leak was found here.

7. `frontend/src/components/positions/PositionCard.tsx:17-18` and `frontend/src/components/positions/PositionCard.tsx:75-93`  
   Change the optional `link_type` union and badge config to the four canonical values. Prefer labels from `positions:position_dossier_links.types.*` instead of hard-coded English labels at lines 80/84/88; canonical live rows currently render an empty/undefined badge.

8. `frontend/src/pages/dossiers/overview-cards/PositionTrackerCard.tsx:22-49`  
   Change `PositionWithLink.link_type` to canonical values. Minimal bucket-A mapping: `ourPositions = link_type === 'applies_to'`; `counterpartPositions = link_type !== 'applies_to'`. Product can later split `endorsed_by` vs `opposed_by`, but the current `primary` check makes every canonical row fall into Counterpart and leaves Our Position empty.

9. `frontend/src/i18n/en/positions.json:70-74`  
   Replace `primary/related/reference` under `position_dossier_links.types` with:
   `applies_to: "Applies to"`, `related_to: "Related to"`, `endorsed_by: "Endorsed by"`, `opposed_by: "Opposed by"`.

10. `frontend/src/i18n/ar/positions.json:70-74`  
    Replace `primary/related/reference` with exact required Arabic strings:
    `applies_to: "ينطبق على"`, `related_to: "ذو صلة"`, `endorsed_by: "مؤيَّد من"`, `opposed_by: "معارَض من"`.

11. `frontend/src/domains/positions/repositories/positions.repository.ts:149-167` and `supabase/functions/positions-dossiers-get/index.ts:25-76`  
    No shape change needed; they pass `link_type` through. After the type changes, these paths will send/filter canonical values.

12. `frontend/src/types/database.types.ts:22094-22119` and `backend/src/types/database.types.ts:22094-22119`  
    Do not hand-edit generated files for this recipe; `link_type` is currently `string`, not an old enum. Regenerate only if the live generated contract later narrows this column.

Verification of old-key consumers: grep outside locale files found only `DossierPositionsTab` static keys at `frontend/src/components/positions/DossierPositionsTab.tsx:116-122`, `PositionDossierLinker` static keys at `frontend/src/components/positions/PositionDossierLinker.tsx:132-138`, and the dynamic linker display at `frontend/src/components/positions/PositionDossierLinker.tsx:197`. Other `primary/related` hits in `frontend/src/components/entity-links/*` belong to the separate intake entity-link contract, whose type is `primary | related | requested | mentioned | assigned_to` at `backend/src/types/intake-entity-links.types.ts:21-27`; leave those unchanged.

Broken contract: the UI offers and types values the live DB rejects or never matches.  
UI failure signature: Positions tab filters `Primary/Related/Reference` return zero canonical rows; the position editor link form can post a CHECK-violating old value; canonical rows show blank/undefined link badges in `PositionCard`; topic overview puts all canonical rows into Counterpart because none equal `primary`.  
Safe bucket-A: yes for the ordered mechanical realign above. It aligns frontend-only vocabulary to an already-live DB/edge contract and does not need a migration. Treat any later business split of `endorsed_by` vs `opposed_by` in topic comparison copy as a separate product/UI refinement.

## Priority 2 - Fresh Workflow Traces

### 1. Country - Timeline Tab Data Contract

No new finding. Route `/dossiers/countries/$id/timeline` lazy-loads `DossierActivityTimeline` and passes the route id at `frontend/src/routes/_protected/dossiers/countries/$id/timeline.tsx:17-26`. The component calls `useDossierActivityTimeline({ dossierId, pageSize: 20 })` at `frontend/src/components/dossier/DossierActivityTimeline.tsx:72-87` and keys rows by `activity.link_id` at `frontend/src/components/dossier/DossierActivityTimeline.tsx:201-204`.

The domain hook declares real edge fields `link_id` and `activity_timestamp` at `frontend/src/domains/dossiers/hooks/useDossierActivityTimeline.ts:19-32`, calls `dossier-activity-timeline?dossier_id=...` via GET at `frontend/src/domains/dossiers/hooks/useDossierActivityTimeline.ts:75-101`, and uses `next_cursor` directly at `frontend/src/domains/dossiers/hooks/useDossierActivityTimeline.ts:210`. The edge selects `dossier_activity_timeline`, orders/cursors by `activity_timestamp`, and returns `link_id`/`activity_timestamp` in the transformed payload at `supabase/functions/dossier-activity-timeline/index.ts:150-160` and `supabase/functions/dossier-activity-timeline/index.ts:212-235`. `ActivityTimelineItem` falls back to `activity_timestamp` for display time at `frontend/src/components/dossier/ActivityTimelineItem.tsx:239-242`.

EN/AR coverage is present in `dossier-context`: timeline titles/type/status/priority/inheritance keys at `frontend/src/i18n/en/dossier-context.json:33-92` and `frontend/src/i18n/ar/dossier-context.json:33-92`. Test coverage explicitly protects the real payload shape with `link_id + activity_timestamp, no created_at` at `frontend/src/pages/dossiers/overview-cards/__tests__/SharedRecentActivityCard.test.tsx:37-73`.

VERIFY vs live: this is a static contract pass. The DB/view existence and non-null behavior of live `dossier_activity_timeline.link_id/activity_timestamp` should be smoke-tested if a deploy touches the view, because generated DB types mark those fields nullable.

### 2. Organization - Engagements Tab

R13-02 - HIGH - bucket B - VERIFY vs live  
Evidence: `/dossiers/organizations/$id/engagements` mounts the generic tab at `frontend/src/routes/_protected/dossiers/organizations/$id/engagements.tsx:17-26`. The tab fetches only `related_dossiers` and `calendar_events` at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:39-47`, then derives engagement rows exclusively from `data.related_dossiers.by_dossier_type.engagement` and past calendar rows from `data.calendar_events.past` at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:53-71`.

`fetchRelatedDossiers` reads `dossier_relationships` outgoing/incoming relationships only at `frontend/src/services/dossier-overview.service.ts:327-360`, then groups by dossier type at `frontend/src/services/dossier-overview.service.ts:433-457`. It never reads `engagement_dossiers`. Separately, the organization list already treats `engagement_dossiers.host_organization_id` as the extension-table link from engagement rows to organization dossiers at `frontend/src/hooks/useOrganizations.ts:71-88`, and the schema migration defines `host_organization_id UUID REFERENCES dossiers(id)` at `supabase/migrations/20260110000006_create_engagement_dossiers.sql:58-60`.

The current test encodes the same limited tab contract: related engagement dossiers plus past calendar events only at `frontend/src/components/dossier/tabs/__tests__/DossierEngagementsTab.test.tsx:56-91`, and an empty state when those two lists are absent at `frontend/src/components/dossier/tabs/__tests__/DossierEngagementsTab.test.tsx:93-104`.

Broken contract: engagement dossiers linked to an organization via `engagement_dossiers.host_organization_id` are counted on the organization list, but the organization Engagements tab does not include them unless a separate `dossier_relationships` edge also exists. Calendar events are a different operational-calendar source and do not cover the extension-row contract.  
UI failure signature: an organization dossier with `engagement_dossiers.host_organization_id = organization.id` but no relationship rows and no past `calendar_entries` renders the Engagements tab empty (`empty.engagements.title`) while the organization list can show a non-zero engagement count.  
Fix class: not bucket-A unattended until live shape is checked. Either extend the overview service with an organization/country host engagement branch, or add a host-organization filter to the engagement-dossiers list contract. Note the current repository/edge only transports `host_country_id` (`frontend/src/domains/engagements/repositories/engagements.repository.ts:61-66`, `supabase/functions/engagement-dossiers/index.ts:297-355`) even though frontend types include `host_organization_id` at `frontend/src/types/engagement.types.ts:359-360`.

### 3. Topic - Tasks Tab New Task

No new finding. Route `/dossiers/topics/$id/tasks` mounts `DossierWorkItemsTab` at `frontend/src/routes/_protected/dossiers/topics/$id/tasks.tsx:17-26`. The tab reads `work_items` under `['dossier-tab','work_items',dossierId]` at `frontend/src/components/dossier/tabs/DossierWorkItemsTab.tsx:26-39`. The add menu exposes the task action in the work-items group at `frontend/src/components/dossier/AddToDossierMenu.tsx:119-124` and `frontend/src/components/dossier/AddToDossierMenu.tsx:167-171`, and the action handler opens the task dialog at `frontend/src/hooks/useAddToDossierActions.tsx:157-160`.

`TaskDialog` requires title + assignee, sends `title`, `description`, `assignee_id`, and `priority` to `useCreateTask` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:346-355`, then links the created task through `work_item_dossiers` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:357-364`. The frontend request type correctly models optional `workflow_stage` and `sla_deadline` at `frontend/src/services/tasks-api.ts:26-37`; the edge defaults `workflow_stage` to `todo` and `sla_deadline` to null at `supabase/functions/tasks-create/index.ts:184-205`, then inserts into `tasks` at `supabase/functions/tasks-create/index.ts:207-212`.

Linking parity is aligned: `buildDossierLinkPayload('task', result.id, dossierContext)` sends `work_item_type`, `work_item_id`, `dossier_ids`, `inheritance_source`, and `is_primary` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:99-110`; `work-item-dossiers` inserts those fields at `supabase/functions/work-item-dossiers/index.ts:240-255`; the tab reader fetches `work_item_dossiers.dossier_id` and then the linked `tasks` rows at `frontend/src/services/dossier-overview.service.ts:605-675`. Task invalidation mirrors commitment invalidation at `frontend/src/components/dossier/AddToDossierDialogs.tsx:357-364` and `frontend/src/components/dossier/AddToDossierDialogs.tsx:498-507`.

EN/AR task form keys are present at `frontend/src/i18n/en/dossier.json:907-922` and `frontend/src/i18n/ar/dossier.json:907-922`. VERIFY vs live: no DB/RPC break asserted here; live smoke should still confirm task insert RLS if this flow is promoted to acceptance testing.

### 4. Working Group - Documents Tab

R13-03 - MEDIUM - bucket B - VERIFY vs live  
Evidence: `/dossiers/working_groups/$id/docs` mounts `DossierDocumentsTab` at `frontend/src/routes/_protected/dossiers/working_groups/$id/docs.tsx:17-26`; the tab fetches only `documents` and passes them to `DocumentsSection` at `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:26-52`.

Post-briefs-removal behavior: `fetchDocuments` reads positions via `position_dossier_links.dossier_id` at `frontend/src/services/dossier-overview.service.ts:464-485`; that is valid for WG because the migration says `position_dossier_links` can target `working_group` at `supabase/migrations/20251022000009_update_polymorphic_refs.sql:49-52`. The same reader queries MoUs via `mous.signatory_1_dossier_id/signatory_2_dossier_id` at `frontend/src/services/dossier-overview.service.ts:487-515`, but the migration comments define those signatories as country or organization at `supabase/migrations/20251022000009_update_polymorphic_refs.sql:74-76`. Briefs are now hardcoded empty after the round-11 removal at `frontend/src/services/dossier-overview.service.ts:517-523`; attachments are also hardcoded empty at `frontend/src/services/dossier-overview.service.ts:525-527`. The section total is the sum of positions, MoUs, briefs, and attachments at `frontend/src/services/dossier-overview.service.ts:581-587`.

`DocumentsSection` shows a whole-section empty card only when `total_count === 0` at `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:172-195`. If any WG position document exists, it renders all category tabs, including MoUs, Briefs, and Attachments with zero counts at `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:220-262`. EN/AR labels and empty text exist at `frontend/src/i18n/en/dossier-overview.json:113-128` and `frontend/src/i18n/ar/dossier-overview.json:113-128`.

Broken contract: WG position docs are valid, but the same surface advertises WG MoUs despite the documented MoU signatory contract being country/organization-only. It also advertises Briefs even though the dossier briefs sub-fetch is intentionally removed and returns no data for every dossier.  
UI failure signature: a WG dossier with at least one linked position renders `Positions (N)` alongside `MOUs (0)`, `Briefs (0)`, and `Attachments (0)`; clicking MoUs or Briefs shows "No MOUs found" / "No briefs found" even though those sources are not actually supported for working groups in the current reader contract.  
Fix class: verify live `mous` first for any working-group signatory rows. If none exist and product agrees MoUs remain country/org-only, hide the MoU tab for `working_group`; hide or relabel the Briefs tab until a real dossier-to-brief contract is restored. This likely needs a small type-aware section option, not a DB migration.

---

## Round-13 Fix & Live-Verification Outcomes (Claude, 2026-06-10)

### R13-01 — FIXED + live-verified (bucket A, the R12-11b realign)

Applied the 12-step recipe. New canonical `PositionDossierLinkType =
'applies_to' | 'related_to' | 'endorsed_by' | 'opposed_by'` exported from
`domains/positions/types`, threaded through `useDossierPositionLinks`
(DossierPositionLink + filters + docstrings), `DossierPositionsTab` (filter
state + 4 SelectItem values + onValueChange cast), `PositionDossierLinker`
(state/default/reset `related`→`related_to` + 4 SelectItems),
`PositionCard` (union + badge config now i18n-labelled via
`positions:position_dossier_links.types.*` with semantic
success/destructive tokens for endorsed/opposed), `PositionTrackerCard`
(union + our/counterpart split `primary`→`applies_to`), and the i18n `types`
block in en/ar (applies_to/related_to/endorsed_by/opposed_by; AR
ينطبق على / ذو صلة / مؤيَّد من / معارَض من).
Live-verified on the Vision 2030 topic (seeded `related_to` link):

- Filter dropdown now offers Applies to / Related to / Endorsed by / Opposed by
  (was Primary/Related/Reference, which never matched live rows).
- Selecting "Related to" KEEPS the seeded position visible (1 shown) — the
  filter matches live values for the first time.
- The link badge resolves to "Related to" / "ذو صلة".
  No stale primary/related/reference link_type refs remain in the positions
  feature (intake entity-links `primary|related|...` is a separate contract,
  left untouched). Generated database.types.ts left as-is (link_type is `string`).

### R13-04 — NEW, FIXED + live-verified (bucket A, found during R13-01 verify)

`DossierPositionsTab` clear-filters button used `t('common:clear_filters')` —
a key absent from the common namespace → raw `clear_filters` leaked in the AR
(and EN) UI when a filter was active. The correct key
(`positions:dossier_tab.clear_filters`) was already used for the aria-label on
the same element. Switched the visible label to it. Verified: renders
"مسح الفلاتر" in AR, no raw key.

### R13-02 — bucket B, LIVE-CLASSIFIED LATENT

`engagement_dossiers.host_organization_id` = 0 rows set on staging (also
host_country_id = 0; 3 engagement_dossiers total). The org Engagements tab
genuinely never reads `engagement_dossiers.host_organization_id`, but nothing
is currently hidden because no engagement carries a host link. Real
architectural gap (and the edge/repo only transports host_country_id), but no
live repro. Left for a planned phase (host-organization engagement branch in
the overview service or a host filter on the engagement-dossiers contract).

### R13-03 — bucket B, LIVE-CLASSIFIED LATENT

WG MoU signatories = 0 (and `mous` is empty entirely), so the WG Docs MoU
sub-tab never renders real data. The Briefs sub-tab is a now-universal dead
affordance (briefs sub-fetch hardcoded empty for ALL dossier types since
round-11) but only surfaces when a dossier has ≥1 other document. Clean fix is
a type-aware DocumentsSection option (hide MoU for working_group; hide/relabel
Briefs until a real dossier→brief contract exists) — a coordinated change left
for a focused follow-up, not done this round.

### No-finding workflows confirmed clean

- Country Timeline tab: contract intact (link_id + activity_timestamp, GET,
  next_cursor); test guards the shape.
- Topic Tasks tab New Task: TaskDialog payload + work_item_dossiers linking +
  invalidation all aligned with the fixed CommitmentDialog parity.
