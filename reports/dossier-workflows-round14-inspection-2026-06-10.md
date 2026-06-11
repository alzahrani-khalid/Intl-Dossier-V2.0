# Dossier Workflows Round 14 Inspection - 2026-06-10

Static code trace plus live aggregate Supabase verification. No source code was modified. Prior-round guard: `reports/fanout-loop-state.json:154-164` marks R13-01/R13-04 fixed and R13-03 carried over; `reports/fanout-loop-state.json:166-177` marks R12-01/02/04/06/08/09/10/11 fixed. This report does not re-report those fixed items.

## Findings Summary

| ID     | Severity | Bucket | Workflow                     | Finding                                                                                                                                                                                                               |
| ------ | -------- | ------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R14-01 | HIGH     | A      | shared docs / forum docs     | `DocumentsSection` is type-blind and advertises unsupported document buckets when any supported document exists. Complete recipe below: hide Briefs everywhere, hide MoUs outside country/organization, no migration. |
| R14-02 | HIGH     | B      | engagement positions         | The engagement workspace has no routed Positions tab; the only positions section is unrouted and its attach callback is a no-op. Its reader uses legacy `engagement_positions`, not `position_dossier_links`.         |
| R14-03 | MEDIUM   | B      | elected official engagements | EO/person Engagements tab reads generic `dossier_relationships` + `calendar_entries` only; it ignores the person-specific `person_engagements` participation contract. Live data is empty, so latent.                 |

Live verification snapshot: staging has `mous=0`, `briefs=0`, `attachments=0`, `engagement_positions=0`, `person_engagements=0`; selecting `briefs.dossier_id` and `attachments.dossier_id` returns 42703. The only live `position_dossier_links` row is topic-scoped.

## Priority 1 - R13-03 Complete Change Recipe

### R14-01 - HIGH - bucket A - type-aware DocumentsSection

Evidence:

- `fetchDocuments` reads position docs through `position_dossier_links.dossier_id` at `frontend/src/services/dossier-overview.service.ts:464-485`; the migration allows position links to any dossier type at `supabase/migrations/20251022000009_update_polymorphic_refs.sql:50-52`.
- `fetchDocuments` reads MoUs through `mous.signatory_1_dossier_id/signatory_2_dossier_id` at `frontend/src/services/dossier-overview.service.ts:487-515`; migration comments constrain those signatories to country/organization at `supabase/migrations/20251022000009_update_polymorphic_refs.sql:74-76`.
- Briefs are code-guaranteed empty: `const briefs: BriefRow[] = []` at `frontend/src/services/dossier-overview.service.ts:517-523`. Live verification also returned `briefs_total=0` and `briefs.dossier_id` 42703.
- Attachments are also code-guaranteed empty at `frontend/src/services/dossier-overview.service.ts:525-527`; live verification returned `attachments_total=0` and `attachments.dossier_id` 42703.
- `DocumentsSection` currently combines every bucket at `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:172-178`, shows whole-section empty only when `data.total_count === 0` at `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:194-207`, and always renders all category tabs at `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:220-262`.
- Current tab labels are existing `dossier-overview` keys: EN `frontend/src/i18n/en/dossier-overview.json:113-128`, AR `frontend/src/i18n/ar/dossier-overview.json:113-128`. No new i18n keys are needed. Because `DocumentsSection` uses `useTranslation('dossier-overview')` at `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:170`, dot-form `t('documents.tabs.*')` is safe here.

Broken contract: the dossier documents UI presents buckets that the reader cannot populate for the current dossier type. Briefs are dead for every dossier. MoUs are only supported for country/organization, but the same tab appears for forum/working_group/person/topic/engagement/elected-official routes whenever a supported position document exists.

UI failure signature: a forum or working-group dossier with one linked position document renders `Positions (1)` beside `MOUs (0)`, `Briefs (0)`, and `Attachments (0)`; clicking MoUs or Briefs shows "No MOUs found" / "No briefs found" even though those sources are unsupported in the reader contract. On staging this is latent today because live position links are `{ topic: 1 }` and no forum/WG/person position links exist.

Bucket-A: yes. This is frontend-only type-aware tab rendering against already-live contracts. No migration is needed.

Exact minimal recipe:

1. `frontend/src/types/dossier-overview.types.ts:394-397`  
   Add a required `dossierType: DossierType` prop to `DocumentsSectionProps`. `DossierType` is already imported at `frontend/src/types/dossier-overview.types.ts:10` and excludes `elected_official`, correctly treating EO as `person`.

2. `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:18-22`  
   Import `type DossierType` from `@/services/dossier-api`, add `dossierType: DossierType` to `DossierDocumentsTabProps`, and destructure it in the component signature.

3. `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:47-52`  
   Pass `dossierType={dossierType}` into `<DocumentsSection ... />`. The tab already fetches core dossier data at `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:26-29`, but route constants are the safer minimal source because the type is known before the query resolves.

4. Route call sites at line 25 of each docs route:  
   `frontend/src/routes/_protected/dossiers/countries/$id/docs.tsx:25` -> `<DossierDocumentsTab dossierId={id} dossierType="country" />`  
   `frontend/src/routes/_protected/dossiers/organizations/$id/docs.tsx:25` -> `dossierType="organization"`  
   `frontend/src/routes/_protected/dossiers/topics/$id/docs.tsx:25` -> `dossierType="topic"`  
   `frontend/src/routes/_protected/dossiers/working_groups/$id/docs.tsx:25` -> `dossierType="working_group"`  
   `frontend/src/routes/_protected/dossiers/persons/$id/docs.tsx:25` -> `dossierType="person"`  
   `frontend/src/routes/_protected/dossiers/elected-officials/$id/docs.tsx:25` -> `dossierType="person"` because EO is a person subtype, not a DB dossier type (`frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:5-8`).  
   `frontend/src/routes/_protected/dossiers/forums/$id/docs.tsx:25` -> `dossierType="forum"`.

5. `frontend/src/components/dossier/dossier-overview/DossierOverview.tsx:245` and `frontend/src/components/dossier/dossier-overview/DossierOverview.tsx:386-388`  
   The overview already has `const { dossier, stats } = data`; pass `dossierType={dossier.type}` into its `<DocumentsSection>`.

6. `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:164-170`  
   Destructure `dossierType`. Add:
   `const canShowMous = dossierType === 'country' || dossierType === 'organization'`.

7. `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:172-178`  
   Replace the all-documents calculation with visible buckets only: positions + `(canShowMous ? data.mous : [])` + attachments. Do not include `data.briefs`. If the acceptance criterion is no dead buckets at all, also render attachments only when `data.attachments.length > 0`; live/code evidence says attachments are currently dead too.

8. `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:194-207` and `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:215-216`  
   Base the empty state and badge on the visible total (`allDocuments.length`), not raw `data.total_count`, so hidden buckets never keep the section alive.

9. `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:230-257`  
   Wrap the MoU trigger/content in `canShowMous`. Remove the Briefs trigger/content entirely until a real dossier-to-brief reader is restored. Leave the `documents.tabs.briefs` and `documents.empty.brief` i18n keys in place; deleting locale keys is unnecessary churn.

10. `frontend/src/components/dossier/tabs/__tests__/DossierDocumentsTab.test.tsx:66`  
    Update the render call to `<DossierDocumentsTab dossierId="d1" dossierType="topic" />`. Add a focused assertion if time allows: with topic/forum data containing one position and zero MoUs/briefs, `documents.tabs.mous` and `documents.tabs.briefs` are absent.

## Priority 2 - Fresh Workflow Traces

### Engagement - Positions on Engagement Workspace

R14-02 - HIGH - bucket B - VERIFY vs live

Route/reader trace:

- `/dossiers/engagements/$id` redirects to `/engagements/$engagementId/overview` at `frontend/src/routes/_protected/dossiers/engagements/$id.tsx:16-21`.
- Engagement workspace tabs are only overview/context/tasks/calendar/docs/audit at `frontend/src/components/workspace/WorkspaceTabNav.tsx:26-33`; there is no routed workspace Positions tab.
- The workspace overview route loads `OverviewTab` at `frontend/src/routes/_protected/engagements/$engagementId/overview.tsx:10-22`; `OverviewTab` renders metrics, participants, recent activity, and quick actions at `frontend/src/pages/engagements/workspace/OverviewTab.tsx:141-348`, with no positions surface.
- The only positions section is `EngagementPositionsSection`, imported by `EngagementDossierDetail` at `frontend/src/components/dossier/EngagementDossierDetail.tsx:18` and rendered at `frontend/src/components/dossier/EngagementDossierDetail.tsx:71-80`; `rg EngagementDossierDetail` finds no route/page importer, so this section is currently unrouted.
- Its reader is `useEngagementPositions`, which queries `.from('engagement_positions')` at `frontend/src/hooks/useEngagementPositions.ts:51-80`; it does not use `position_dossier_links`.
- The attach dialog gets `engagementId={engagementId}` but `onAttach={async () => { setShowAttachDialog(false) }}` at `frontend/src/components/positions/EngagementPositionsSection.tsx:161-169`, so selecting positions closes without writing.
- Existing edge functions for this legacy table also use `engagement_positions` (`supabase/functions/engagements-positions-attach/index.ts:126-148`, `supabase/functions/engagements-positions-list/index.ts:73-114`). No frontend hook calls `engagements-positions-attach`.
- EN/AR keys for the dead section exist at `frontend/src/i18n/en/positions.json:464-476` and `frontend/src/i18n/ar/positions.json:463-475`; the older dossier-section labels also exist at `frontend/src/i18n/en/dossier.json:465-469` and `frontend/src/i18n/ar/dossier.json:465-469`.

Broken contract: the engagement workspace does not expose the promised Positions tab/surface. The only implementation uses legacy `engagement_positions`, but it is not routed and its attach workflow is a no-op.

UI failure signature: on `/engagements/:id/overview`, the user cannot navigate to a Positions tab. If the dead section is routed as-is, selecting positions in the dialog will close the dialog and persist nothing.

VERIFY vs live: staging currently has `engagement_positions=0`, `position_dossier_links` to engagement dossiers `=0`, and 4 engagement dossiers. This is not hiding live rows today, but the write/read route is still absent.

Fix class: bucket B. A safe fix needs a small workspace feature slice: add a positions tab route/nav entry, decide whether engagement positions remain on legacy `engagement_positions` or migrate to canonical `position_dossier_links`, then implement attach + invalidate `['engagement-positions', engagementId, ...]`.

### Person - Tasks Tab New Task / Work Items

No new finding.

Trace:

- `/dossiers/persons/$id/tasks` mounts `DossierWorkItemsTab` at `frontend/src/routes/_protected/dossiers/persons/$id/tasks.tsx:17-26`.
- The tab fetches `fetchDossierOverview({ include_sections: ['work_items'] })` under `['dossier-tab','work_items',dossierId]` at `frontend/src/components/dossier/tabs/DossierWorkItemsTab.tsx:26-40`.
- New Task opens through the shared Add-to-Dossier action list: task action at `frontend/src/components/dossier/AddToDossierMenu.tsx:119-124`, grouped under work items at `frontend/src/components/dossier/AddToDossierMenu.tsx:167-171`, and opened by `useAddToDossierActions` at `frontend/src/hooks/useAddToDossierActions.tsx:157-160`.
- `TaskDialog` creates a task with title/description/assignee/priority at `frontend/src/components/dossier/AddToDossierDialogs.tsx:346-355`, then links it through `work_item_dossiers` and invalidates the person tab key at `frontend/src/components/dossier/AddToDossierDialogs.tsx:357-365`.
- The link payload is the same canonical `work_item_type/work_item_id/dossier_ids/inheritance_source/is_primary` helper at `frontend/src/components/dossier/AddToDossierDialogs.tsx:99-110`.
- The reader starts from `work_item_dossiers.dossier_id` at `frontend/src/services/dossier-overview.service.ts:605-623`, fetches tasks at `frontend/src/services/dossier-overview.service.ts:628-675`, and uses `sla_deadline` for deadline/overdue status at `frontend/src/services/dossier-overview.service.ts:653-668`.
- `CreateTaskRequest` models optional `workflow_stage` and `sla_deadline` at `frontend/src/services/tasks-api.ts:26-37`; the edge defaults them to `todo` and `null` at `supabase/functions/tasks-create/index.ts:184-205`.
- `work-item-dossiers` inserts the same link fields at `supabase/functions/work-item-dossiers/index.ts:240-255`.

VERIFY vs live: no DB/RPC break asserted. This path is shared with the topic task path already confirmed in round 13; person adds no type-specific branch.

### Elected Official - Engagements Tab

R14-03 - MEDIUM - bucket B - VERIFY vs live

Trace:

- EO detail route is path-typed as `elected_official` only for routing; the underlying dossier is `type='person'` at `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:5-8`.
- `/dossiers/elected-officials/$id/engagements` mounts the generic `DossierEngagementsTab` at `frontend/src/routes/_protected/dossiers/elected-officials/$id/engagements.tsx:17-26`.
- `DossierEngagementsTab` fetches only `related_dossiers` and `calendar_events` at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:39-47`, then renders `related_dossiers.by_dossier_type.engagement` plus `calendar_events.past` at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:53-72`.
- `fetchRelatedDossiers` reads generic `dossier_relationships` outgoing/incoming rows at `frontend/src/services/dossier-overview.service.ts:327-360` and groups engagement dossier types at `frontend/src/services/dossier-overview.service.ts:433-457`.
- Calendar is canonical `calendar_entries.dossier_id`, `event_date`, and `event_time` at `frontend/src/services/dossier-overview.service.ts:794-852`.
- EO/person-specific engagement participation exists separately: `person_engagements` links persons to legacy `engagements` at `supabase/migrations/20260110000003_persons_entity_management.sql:172-193`, and `get_person_full` returns `recent_engagements` from `person_engagements` at `supabase/migrations/20260110000003_persons_entity_management.sql:345-354` and `supabase/migrations/20260202000001_merge_elected_official_into_person.sql:512-520`.
- The older `InteractionHistory` component reads `usePerson(dossierId)` / `recent_engagements` at `frontend/src/components/dossier/sections/InteractionHistory.tsx:24-28` and `frontend/src/components/dossier/sections/InteractionHistory.tsx:76-123`, but that component is not what the routed EO Engagements tab uses.

Broken contract: if person/EO engagement participation is represented by `person_engagements`, the routed EO Engagements tab will show empty unless a separate `dossier_relationships` edge or `calendar_entries.dossier_id` row also exists.

UI failure signature: an EO with `person_engagements` rows renders `/dossiers/elected-officials/:id/engagements` as `empty.engagements.title` while the person-specific `recent_engagements` contract would have rows.

VERIFY vs live: seeded EO `19a22b0d-0577-4869-a38f-283a1ef9359d` is live as `dossiers.type='person'` and `persons.person_subtype='elected_official'`; live `person_engagements=0` globally and `=0` for that EO, so this is latent. Related/calendar counts for that EO are also 0.

Fix class: bucket B. Decide whether routed person/EO Engagements should remain generic relationship/calendar history or merge in `person_engagements`/`get_person_full.recent_engagements`. Do not patch blindly until a person-engagement row exists or product confirms the tab contract.

### Forum - Documents Tab

Covered by R14-01.

Trace:

- Forum shell passes `dossierType="forum"` at `frontend/src/routes/_protected/dossiers/forums/$id.tsx:16-21`.
- `/dossiers/forums/$id/docs` mounts `DossierDocumentsTab` at `frontend/src/routes/_protected/dossiers/forums/$id/docs.tsx:17-26`.
- Today the tab passes only `dossierId` to `DocumentsSection` at `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:47-52`, so `DocumentsSection` cannot know forum is non-country/non-organization.

VERIFY vs live: live `mous=0`, forum MoU signatories therefore 0; live `position_dossier_links` has no forum rows. The forum MoU/Briefs UI failure is latent until a forum gets a supported position document, but the required fix is the same bucket-A type-aware rendering recipe in R14-01.

---

## Round-14 Fix & Live-Verification Outcomes (Claude, 2026-06-10)

### R14-01 — FIXED + live-verified (bucket A, the R13-03 carryover)

Applied the 10-step recipe. `DocumentsSectionProps` gained a required
`dossierType: DossierType`; threaded from all 7 docs routes
(country/organization/topic/working_group/person/forum literals, and `person`
for the EO route since EO is a person subtype) + `DossierDocumentsTab` +
`DossierOverview` (`dossier.type`). `DocumentsSection` now computes
`canShowMous = type === 'country' || 'organization'`, hides the Briefs tab
entirely (dead for every type since the round-11 sub-fetch removal), gates the
MoU tab on `canShowMous`, gates Attachments on `length > 0`, and bases the "All"
tab + section total + empty-state on the VISIBLE buckets only (so a dead bucket
can never keep the section alive or inflate the count).
Live-verified both directions:

- Topic (non-country/org) Docs with 1 position → tabs are exactly
  **All (1) · Positions (1)** (MoUs/Briefs/Attachments gone; was
  All/Positions/MoUs(0)/Briefs(0)/Attachments(0)).
- Organization Docs with 1 seeded position → **All (1) · Positions (1) ·
  MOUs (0)** — the MoU tab correctly stays for a supported type (honest empty),
  while Briefs/Attachments stay hidden.
  Unit test updated + passing: asserts MoU and Briefs tabs absent for a topic with
  one position and zero MoUs/briefs. Frontend-only; no migration/edge.

### R14-02 — bucket B (engagement workspace Positions)

The engagement workspace has NO routed Positions tab; the only positions surface
(`EngagementPositionsSection` in the unrouted `EngagementDossierDetail`) reads
the legacy `engagement_positions` table and its attach is a no-op. Live:
`engagement_positions = 0`, no engagement-scoped `position_dossier_links`. Real
missing feature-slice (route + nav + decide legacy vs canonical
`position_dossier_links` + wire attach/invalidate). Left for a planned phase.

### R14-03 — bucket B, LATENT (EO/person Engagements)

The routed EO/person Engagements tab reads only generic `dossier_relationships`

- `calendar_entries`, ignoring the person-specific `person_engagements`
  participation contract (`get_person_full.recent_engagements`). Live:
  `person_engagements = 0` globally and for the seeded EO, so latent. Needs a
  product decision (generic history vs merge `person_engagements`) before any fix.

### Seeds left in place

- position_dossier_link `44c105d3 → org GASTAT` (`applies_to`) — proves the
  canShowMous=true branch.
