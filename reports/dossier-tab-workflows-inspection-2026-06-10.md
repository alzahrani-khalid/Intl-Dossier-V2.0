# Dossier Detail Tab / Action Workflow Inspection Report

**Date:** Wed 10 Jun 2026  
**Scope:** Read-only Round 6 inspection of one routed detail-tab or detail-action workflow per dossier type: country, organization, forum, engagement, topic, working_group, person, elected_official.  
**Constraint:** No source edits. The only write is this report.  
**Prior coverage reviewed first:** `reports/fanout-loop-state.json`, the round-1 type reports, and the per-type reports for country, organization, forum, engagement, topic, working group, person, and elected official.

Prior rounds already covered dossier creation/editing, core list/detail reads, overview sections, country task creation, organization MoUs, topic positions attach, forum sessions/timeline, engagement workspace overview/tasks/docs placeholders, working-group overview/timeline, person overview/timeline, elected-official create/detail/committees, and the broad relationships/calendar/documents/AI-briefing workflows. This report therefore focuses on user-reachable detail actions and cards that were not previously traced end-to-end in these dossier contexts.

---

## Selected Workflows

| Dossier type     | Workflow inspected                                                                | Route entry                                                                                                                                    | Primary user surface                                     |
| ---------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| country          | Overview `Key Contacts` card, contact click-through, and `View all contacts` link | `frontend/src/routes/_protected/dossiers/countries/$id.tsx:17-27`                                                                              | `CountryOverviewTab` -> `KeyContactsCard`                |
| organization     | Header `Add to Dossier` -> `New Position`                                         | `frontend/src/routes/_protected/dossiers/organizations/$id.tsx:17-27`                                                                          | `DossierShell` -> `AddToDossierMenu` -> `PositionDialog` |
| forum            | Header `Add to Dossier` -> `Schedule Event`                                       | `frontend/src/routes/_protected/dossiers/forums/$id.tsx:12-22`                                                                                 | `DossierShell` -> `EventDialog`                          |
| engagement       | Workspace `Docs` tab -> `Generate Briefing`                                       | `frontend/src/routes/_protected/dossiers/engagements/$id.tsx:16-22`, `frontend/src/routes/_protected/engagements/$engagementId/docs.tsx:14-23` | `WorkspaceShell` -> `DocsTab`                            |
| topic            | Header `Add to Dossier` -> `Upload Document`                                      | `frontend/src/routes/_protected/dossiers/topics/$id.tsx:17-27`                                                                                 | `DossierShell` -> `DocumentDialog`                       |
| working_group    | Header `Add to Dossier` -> `Add Relationship`                                     | `frontend/src/routes/_protected/dossiers/working_groups/$id.tsx:12-22`                                                                         | `DossierShell` -> `RelationshipDialog`                   |
| person           | Header `Add to Dossier` -> `New Commitment`                                       | `frontend/src/routes/_protected/dossiers/persons/$id.tsx:12-22`                                                                                | `DossierShell` -> `CommitmentDialog`                     |
| elected_official | Header `Add to Dossier` -> `Add Relationship` on elected-official route           | `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:19-29`                                                                      | `DossierShell` -> `RelationshipDialog`                   |

Common shell trace for all non-engagement dossier actions: the type layout renders `DossierShell`; `DossierShell` fetches the dossier via `useDossier(dossierId)` at `frontend/src/components/dossier/DossierShell.tsx:81-83`, mounts `AddToDossierMenu` at `:242-249`, and mounts `AddToDossierDialogs` at `:285-292`. `useDossier` calls `getDossier` at `frontend/src/domains/dossiers/hooks/useDossier.ts:111-120`, which calls the `dossiers-get` edge function at `frontend/src/services/dossier-api.ts:498-506`. The edge function reads `dossiers` and extension tables including `countries`, `organizations`, `forums`, `topics`, `working_groups`, and `persons` at `supabase/functions/dossiers-get/index.ts:134-198`.

---

## Findings Summary

| ID    | Bucket | Dossier type(s)                                                     | Workflow               | Finding                                                                                                                                                                                                                                                                                                 |
| ----- | ------ | ------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R6-01 | A      | country                                                             | Key Contacts           | `View all contacts` deep-links to `?tab=contacts`, but no routed contacts tab exists and the shared tab nav only renders overview/engagements/docs/tasks/timeline/audit plus configured extras.                                                                                                         |
| R6-02 | B      | country                                                             | Key Contacts           | The contacts query selects richer columns (`name_ar`, `photo_url`, `linked_person_dossier_id`, etc.) that are absent from generated `key_contacts` types and seed shape, so contact rows can silently collapse to empty unless live DB has drifted columns.                                             |
| R6-03 | B      | organization                                                        | New Position           | The dialog sends the current dossier id as `position_type_id`, blank `title_ar`, and an empty `audience_groups` array, then never creates `position_dossier_links`; the edge function and DB constraints reject or unlink this action.                                                                  |
| R6-04 | B      | forum                                                               | Schedule Event         | The create action writes `calendar_entries`, while the dossier Engagements tab and overview cards read `calendar_events`; a scheduled dossier event can be created successfully but stay invisible on the forum detail workflow.                                                                        |
| R6-05 | A      | engagement                                                          | Generate Briefing      | Generated engagement briefs come back/list as legacy/draft-style rows, but `DocsTab` renders raw `brief.status`, hard-coded type/action labels, and uses `workspace` instead of the existing `engagement-briefs` namespace.                                                                             |
| R6-06 | B      | topic                                                               | Upload Document        | `useUploadDocument` sends multipart `FormData` with a raw file, but `documents-create` parses JSON and requires a pre-existing `storage_path`; generated `documents` table types also do not match the edge insert shape.                                                                               |
| R6-07 | B      | working_group, elected_official                                     | Add Relationship       | The dialog/hook posts `{ child_dossier_id }` to `/dossiers-relationships-create?dossierId=...`, while both relationship edge contracts and `dossier_relationships` require `source_dossier_id` and `target_dossier_id`.                                                                                 |
| R6-08 | A      | working_group, elected_official                                     | Add Relationship       | Even after the payload contract is fixed, the T064 relationship hook invalidates `['relationships', parentDossierId]`, which misses the canonical `relationshipKeys.forDossier(...)` readers.                                                                                                           |
| R6-09 | A      | person                                                              | New Commitment         | Commitment creation uses the correct `aa_commitments` table, but unlike the task dialog it does not invalidate the dossier `work_items` tab query and it double-toasts success/error.                                                                                                                   |
| R6-10 | B      | elected_official                                                    | Add Relationship       | The elected-official route intentionally uses `dossierType="elected_official"` for routing, but action context is rebuilt from the fetched `dossier.type` (`person` after subtype migration). Any future action that needs elected-official semantics needs an explicit subtype-aware context decision. |
| R6-11 | A      | organization, forum, topic, working_group, person, elected_official | Add-to-Dossier dialogs | The shared context badge renders raw `inheritance_source` (`direct`) instead of localized EN/AR labels, despite the dialogs otherwise using the `dossier` namespace.                                                                                                                                    |

---

## Country

### Workflow: Overview `Key Contacts` card

Trace:

| Layer        | Evidence                                                                                                                                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route        | Country detail renders `DossierShell` with the `country` type and a positions extra tab at `frontend/src/routes/_protected/dossiers/countries/$id.tsx:13-27`.                                                                       |
| Components   | `CountryOverviewTab` mounts `KeyContactsCard` at `frontend/src/pages/dossiers/CountryOverviewTab.tsx:31-35`.                                                                                                                        |
| Hook / query | `KeyContactsCard` calls `useDossierOverview(dossierId, { includeSections: ['key_contacts'] })` at `frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx:22-28`.                                                           |
| DB reader    | `fetchKeyContacts` reads `key_contacts` at `frontend/src/services/dossier-overview.service.ts:838-843` and maps rich contact fields at `:845-859`.                                                                                  |
| DB type      | `countries.iso_code_2` lives on the country extension table at `frontend/src/types/database.types.ts:6702-6715`; `key_contacts` generated fields are only `name`, `role`, `organization`, email/phone/notes/date at `:16302-16342`. |
| i18n         | EN/AR contact labels exist in `frontend/src/i18n/en/dossier.json:1069-1073` and `frontend/src/i18n/ar/dossier.json:1069-1073`.                                                                                                      |

Findings:

- **R6-01 [A] Dead deep-link affordance:** `KeyContactsCard` links `View all` to `/dossiers/countries/$id` with `search={{ tab: 'contacts' }}` at `frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx:109-125`. The actual `DossierTabNav` base tabs are only overview/engagements/docs/tasks/timeline/audit at `frontend/src/components/dossier/DossierTabNav.tsx:33-40`, and country only adds `positions` at `frontend/src/routes/_protected/dossiers/countries/$id.tsx:13-15`. Safe fix: remove the link until a routed contacts tab exists, or route to a real contacts/persons surface.

- **R6-02 [B] `key_contacts` schema drift risk:** `COLUMNS.KEY_CONTACTS.LIST` selects `name_ar`, `title_en`, `title_ar`, `organization_ar`, `photo_url`, and `linked_person_dossier_id` at `frontend/src/lib/query-columns.ts:89-92`, and the service maps those same fields at `frontend/src/services/dossier-overview.service.ts:845-859`. Generated database types for `key_contacts` do not include those columns at `frontend/src/types/database.types.ts:16302-16342`, and seed data inserts only the narrower shape at `supabase/migrations/20250930007_seed_test_data.sql:78-88`. Because the query ignores the returned `error`, a missing-column error can render an empty contacts card instead of an actionable failure. This needs live DB verification before deciding whether to migrate the table or narrow the frontend contract.

---

## Organization

### Workflow: Header `Add to Dossier` -> `New Position`

Trace:

| Layer         | Evidence                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route         | Organization detail renders `DossierShell` with `dossierType="organization"` and the MoUs extra tab at `frontend/src/routes/_protected/dossiers/organizations/$id.tsx:13-27`.                                                                                                                                                                                                                        |
| Components    | `DossierShell` mounts `AddToDossierMenu` at `frontend/src/components/dossier/DossierShell.tsx:242-249` and dialogs at `:285-292`. `AddToDossierMenu` exposes the `position` action at `frontend/src/components/dossier/AddToDossierMenu.tsx:131-136`.                                                                                                                                                |
| Dialog / hook | `PositionDialog` calls `useCreatePosition` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:589-618`. The hook posts `/positions-create` through the positions repo at `frontend/src/domains/positions/hooks/useCreatePosition.ts:16-25` and `frontend/src/domains/positions/repositories/positions.repository.ts:76-78`.                                                                 |
| Edge / DB     | `positions-create` requires `position_type_id`, both localized titles, and at least one audience group at `supabase/functions/positions-create/index.ts:40-69`; it validates `position_type_id` against `position_types` at `:103-118` and inserts `positions` at `:120-140`. Position dossier links are a separate table at `supabase/migrations/20251022000009_update_polymorphic_refs.sql:10-37`. |
| i18n          | The menu/dialog labels use `useTranslation('dossier')` and `t('addToDossier...')`; the shared EN/AR success/error keys exist at `frontend/src/i18n/en/dossier.json:980-990` and `frontend/src/i18n/ar/dossier.json:980-990`.                                                                                                                                                                         |

Findings:

- **R6-03 [B] Position creation contract is invalid and unlinked:** The dialog sends `position_type_id: dossierContext.dossier_id`, `title_ar: ''`, and `audience_groups: []` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:612-618`. That conflicts with the edge validations at `supabase/functions/positions-create/index.ts:40-69`, the `positions.position_type_id` FK and non-empty title constraints at `supabase/migrations/20250101003_create_positions.sql:6-48`, and the typed payload at `frontend/src/types/position.ts:76-89`. Even if a row were created, this dialog never calls `createPositionDossierLink`, which is the available linking API at `frontend/src/domains/positions/repositories/positions.repository.ts:163-168`. This needs a planned UX/data rewrite: position type picker, Arabic title policy, audience group selection or defaulting, and link creation.

- **R6-11 [A] Shared raw context badge:** Every add-to-dossier dialog displays `{dossierContext.inheritance_source}` directly at `frontend/src/components/dossier/AddToDossierDialogs.tsx:132-134`. Safe fix: add EN/AR labels under the existing `dossier:addToDossier.context` namespace and render with colon namespace form if outside a namespace hook, e.g. `t('dossier:addToDossier.context.inheritance.direct')`.

---

## Forum

### Workflow: Header `Add to Dossier` -> `Schedule Event`

Trace:

| Layer       | Evidence                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route       | Forum detail renders `DossierShell` with shared tabs only at `frontend/src/routes/_protected/dossiers/forums/$id.tsx:12-22`.                                                                                                                                                                                                              |
| Components  | `AddToDossierMenu` exposes `event` at `frontend/src/components/dossier/AddToDossierMenu.tsx:137-142`. `EventDialog` submits a dossier-linked calendar event at `frontend/src/components/dossier/AddToDossierDialogs.tsx:686-725`.                                                                                                         |
| Hook / edge | `useCreateCalendarEvent` posts through `calendar.repository.createCalendarEvent` at `frontend/src/domains/calendar/hooks/useCreateCalendarEvent.ts:15-24` and `frontend/src/domains/calendar/repositories/calendar.repository.ts:121-126`.                                                                                                |
| DB writer   | `calendar-create` explicitly writes `calendar_entries`, mapping `linked_item_type='dossier'` into `calendar_entries.dossier_id` at `supabase/functions/calendar-create/index.ts:1-6,98-136`.                                                                                                                                              |
| DB reader   | The dossier Engagements tab calls `fetchDossierOverview(... include_sections: ['related_dossiers', 'calendar_events'])` at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:39-55`. `fetchCalendarEvents` reads `calendar_events`, not `calendar_entries`, at `frontend/src/services/dossier-overview.service.ts:783-831`. |
| i18n        | Event dialog labels are read from the `dossier` namespace; the action/success/error keys are present in EN/AR at `frontend/src/i18n/en/dossier.json:982-990` and `frontend/src/i18n/ar/dossier.json:982-990`.                                                                                                                             |

Findings:

- **R6-04 [B] Created forum events are invisible to the dossier tab:** The create edge has a clear comment that `calendar_entries` is the canonical operational calendar table and `calendar_events` is a separate forum-agenda model at `supabase/functions/calendar-create/index.ts:1-6`. The dossier Engagements tab still reads `calendar_events` through `fetchCalendarEvents`. This is not just a cache issue: invalidating `['calendar-events']` at `frontend/src/domains/calendar/hooks/useCreateCalendarEvent.ts:22-24` would not refresh `['dossier-tab', 'engagements', dossierId]`, and the refreshed tab would still query the wrong table. Needs a planned reader/model alignment: either teach dossier overview tabs to read `calendar_entries` for dossier-linked events, or make this action write the same model the tab reads.

---

## Engagement

### Workflow: Workspace `Docs` tab -> `Generate Briefing`

Trace:

| Layer            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Route            | `/dossiers/engagements/$id` redirects to `/engagements/$engagementId/overview` at `frontend/src/routes/_protected/dossiers/engagements/$id.tsx:16-22`; the workspace docs route lazy-loads `DocsTab` at `frontend/src/routes/_protected/engagements/$engagementId/docs.tsx:10-23`.                                                                                                                                                                                                                                                                                                                                             |
| Component / hook | `DocsTab` calls `useEngagementBriefs` and `useGenerateEngagementBrief` at `frontend/src/pages/engagements/workspace/DocsTab.tsx:23-97`. The mutation invalidates the list on success at `frontend/src/domains/engagements/hooks/useEngagementBriefs.ts:77-92`.                                                                                                                                                                                                                                                                                                                                                                 |
| Edge / DB        | The repo posts `/engagement-briefs/:id/generate` at `frontend/src/domains/engagements/repositories/engagements.repository.ts:266-274`. The edge verifies `engagement_dossiers` at `supabase/functions/engagement-briefs/index.ts:163-184`, inserts a legacy `briefs` row with `engagement_dossier_id` at `:442-461`, and returns `brief_type: 'legacy', source: 'manual'` at `:474-480`. The view exposes `briefs.status::TEXT` and `source='legacy'` at `supabase/migrations/20260110100001_engagement_brief_linking.sql:43-70`, and `briefs.status` defaults to `draft` at `supabase/migrations/007_create_briefs.sql:5-18`. |
| i18n             | EN/AR `engagement-briefs` has brief type/status/action labels including `draft` at `frontend/src/i18n/en/engagement-briefs.json:33-56` and `frontend/src/i18n/ar/engagement-briefs.json:33-56`.                                                                                                                                                                                                                                                                                                                                                                                                                                |

Findings:

- **R6-05 [A] Generated brief card renders raw/mismatched labels:** `DocsTab` uses `useTranslation('workspace')` at `frontend/src/pages/engagements/workspace/DocsTab.tsx:82-87`, hard-codes type labels in `getBriefTypeLabel` at `:75-80`, renders raw `brief.status` at `:221-224`, and hard-codes `Citations` / `View` at `:239-263`. The generated/listed row can be `draft` because the edge leaves `briefs.status` at its default and the view returns it as text. The UI already has EN/AR `engagement-briefs.statuses.draft` and action labels, so this is a safe label/data-contract cleanup: render status/type/action labels from `engagement-briefs` using colon namespace form and widen or map `BriefStatus` beyond `completed | generating | failed` at `frontend/src/domains/engagements/types/index.ts:77-86`.

---

## Topic

### Workflow: Header `Add to Dossier` -> `Upload Document`

Trace:

| Layer       | Evidence                                                                                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route       | Topic detail renders `DossierShell` with the Positions extra tab at `frontend/src/routes/_protected/dossiers/topics/$id.tsx:13-27`.                                                                                                                                                       |
| Components  | `AddToDossierMenu` exposes `document` at `frontend/src/components/dossier/AddToDossierMenu.tsx:155-160`. `DocumentDialog` mounts a file picker and calls `useUploadDocument('dossier', dossierContext.dossier_id)` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:999-1044`. |
| Hook / edge | `useUploadDocument` builds multipart `FormData`, appends the raw `file`, and XHRs to `/functions/v1/documents-create` at `frontend/src/hooks/useUploadDocument.ts:38-100`.                                                                                                                |
| DB writer   | `documents-create` calls `await req.json()`, requires `owner_type`, `owner_id`, `document_type`, and `storage_path`, then inserts those fields into `documents` at `supabase/functions/documents-create/index.ts:16-79`.                                                                  |
| DB type     | Generated `documents` requires `title`, `type`, `file_info`, tenant/classification/version fields, not the edge's `owner_*` shape, at `frontend/src/types/database.types.ts:8955-9011`.                                                                                                   |
| i18n        | The dialog uses localized EN/AR labels for file type and success/error through `dossier:addToDossier` keys at `frontend/src/i18n/en/dossier.json:980-990` and `frontend/src/i18n/ar/dossier.json:980-990`.                                                                                |

Findings:

- **R6-06 [B] Document upload is not compatible with the edge function or generated table contract:** The frontend sends a multipart body with a `file` at `frontend/src/hooks/useUploadDocument.ts:40-57,91-100`, while the edge parses JSON and requires `storage_path` at `supabase/functions/documents-create/index.ts:25-45`. The edge then inserts fields (`owner_type`, `owner_id`, `document_type`, `storage_path`) that are not present in generated `documents` types at `frontend/src/types/database.types.ts:8955-9011`. This needs live DB/edge verification and likely a planned storage upload flow: upload to Supabase Storage first, then create a document record matching the current `documents` schema or migrate the schema/edge together.

---

## Working Group

### Workflow: Header `Add to Dossier` -> `Add Relationship`

Trace:

| Layer       | Evidence                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route       | Working-group detail renders `DossierShell` with shared tabs at `frontend/src/routes/_protected/dossiers/working_groups/$id.tsx:12-22`; `getDossierRouteSegment` maps `working_group` to `working_groups` at `frontend/src/lib/dossier-routes.ts:12-20`.                                                                                                                                                               |
| Components  | `AddToDossierMenu` exposes `relationship` at `frontend/src/components/dossier/AddToDossierMenu.tsx:143-148`. `RelationshipDialog` asks for a target dossier id and submits `child_dossier_id` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:812-917`.                                                                                                                                                    |
| Hook / edge | The T064 hook expects `child_dossier_id`, calls `createDossierRelationship(parentDossierId, input)`, and invalidates `['relationships', parentDossierId]` at `frontend/src/domains/relationships/hooks/useCreateRelationship.ts:16-43`. The repo posts `/dossiers-relationships-create?dossierId=${parentDossierId}` at `frontend/src/domains/relationships/repositories/relationships.repository.ts:35-52`.           |
| DB writer   | The available relationship edge contracts require `source_dossier_id`, `target_dossier_id`, and `relationship_type`: `supabase/functions/dossiers-relationships-create/index.ts:34-54` and canonical `supabase/functions/dossier-relationships/index.ts:335-365`. `dossier_relationships` generated insert fields are `source_dossier_id` and `target_dossier_id` at `frontend/src/types/database.types.ts:9367-9397`. |
| i18n        | Relationship form labels are localized through `dossier:addToDossier.form.relationshipTypes.*` in the dialog at `frontend/src/components/dossier/AddToDossierDialogs.tsx:883-900`.                                                                                                                                                                                                                                     |

Findings:

- **R6-07 [B] Relationship creation payload is from an obsolete contract:** The dialog sends `{ child_dossier_id, relationship_type }` at `frontend/src/components/dossier/AddToDossierDialogs.tsx:835-844`, but the edge function rejects requests without `source_dossier_id` and `target_dossier_id` at `supabase/functions/dossiers-relationships-create/index.ts:47-54`. The canonical service already models the correct request shape at `frontend/src/services/relationship-api.ts:69-84` and posts to `dossier-relationships` at `:243-255`. This needs a planned migration from the T064 hook to the canonical relationship mutation, plus a proper dossier picker instead of a raw UUID input.

- **R6-08 [A] Relationship cache invalidation misses active readers:** The obsolete hook invalidates `['relationships', parentDossierId]` at `frontend/src/domains/relationships/hooks/useCreateRelationship.ts:41-43`, while active readers use `relationshipKeys.forDossier(dossierId, page, page_size)` at `frontend/src/domains/relationships/hooks/useRelationships.ts:30-40,74-87`. Once R6-07 is fixed, use the canonical mutation behavior that invalidates source and target dossier keys at `frontend/src/domains/relationships/hooks/useRelationships.ts:120-127`.

---

## Person

### Workflow: Header `Add to Dossier` -> `New Commitment`

Trace:

| Layer      | Evidence                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| Route      | Person detail renders `DossierShell` with shared tabs at `frontend/src/routes/_protected/dossiers/persons/$id.tsx:12-22`.                                                                                                                                                                                                                                                          |
| Components | `AddToDossierMenu` exposes `commitment` at `frontend/src/components/dossier/AddToDossierMenu.tsx:125-130`. `CommitmentDialog` creates a commitment and then creates a work-item dossier link at `frontend/src/components/dossier/AddToDossierDialogs.tsx:454-502`.                                                                                                                 |
| Hook / DB  | `useCreateCommitment` delegates to `createCommitment` at `frontend/src/hooks/useCommitments.ts:164-180`; the service inserts into canonical `aa_commitments` at `frontend/src/services/commitments.service.ts:186-203`. Generated types confirm `aa_commitments.dossier_id`, `due_date`, `priority`, `status`, and title fields at `frontend/src/types/database.types.ts:187-245`. |
| Link edge  | `buildDossierLinkPayload` builds `work_item_type: 'commitment'` links at `frontend/src/components/dossier/AddToDossierDialogs.tsx:94-105`; `work-item-dossiers` accepts `task                                                                                                                                                                                                      | commitment | intake`at`supabase/functions/work-item-dossiers/index.ts:17-29`and inserts`work_item_dossiers`at`:240-255`. |
| Reader     | `DossierWorkItemsTab` reads `['dossier-tab', 'work_items', dossierId]` at `frontend/src/components/dossier/tabs/DossierWorkItemsTab.tsx:22-30`; `fetchDossierOverview` reads direct and linked commitments from `aa_commitments` at `frontend/src/services/dossier-overview.service.ts:667-721`.                                                                                   |
| i18n       | Commitment success/error keys exist in EN/AR at `frontend/src/i18n/en/dossier.json:980-990` and `frontend/src/i18n/ar/dossier.json:980-990`; the commitment domain uses `commitments` namespace for its own toasts.                                                                                                                                                                |

Findings:

- **R6-09 [A] Commitment action succeeds but leaves the current dossier work-items tab stale and duplicates toasts:** The action writes the correct table (`aa_commitments`, not legacy `commitments`) at `frontend/src/services/commitments.service.ts:186-203` and links through `work_item_dossiers`. However, `CommitmentDialog` does not invalidate `['dossier-tab', 'work_items', dossierContext.dossier_id]` after link creation, while the sibling task dialog does exactly that at `frontend/src/components/dossier/AddToDossierDialogs.tsx:350-357`. It also shows a dialog-level success/error toast at `:496-500`, while `useCreateCommitment` already toasts on success/error at `frontend/src/hooks/useCommitments.ts:168-177`. Safe fix: mirror task dialog invalidation for commitments and remove one toast layer.

---

## Elected Official

### Workflow: Header `Add to Dossier` -> `Add Relationship`

Trace:

| Layer             | Evidence                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route             | Elected-official detail renders `DossierShell` with `dossierType="elected_official"` and a Committees extra tab at `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:19-29`. The route file notes that the underlying DB record has `type='person'` at `:5-8`.                                                                                              |
| Type / DB model   | The subtype migration updates old elected-official dossiers to `type='person'` and constrains dossier types to exclude `elected_official` at `supabase/migrations/20260202000001_merge_elected_official_into_person.sql:189-204`; generated `persons` fields include `person_subtype`, office, party, and term fields at `frontend/src/types/database.types.ts:21180-21224`. |
| Components        | `DossierShell` uses the fetched dossier for add-to-dossier context at `frontend/src/components/dossier/DossierShell.tsx:81-83,109-117`. `useAddToDossierActions` rebuilds context from `dossier.type`, not the route prop, at `frontend/src/hooks/useAddToDossierActions.tsx:100-108`.                                                                                       |
| Relationship edge | Same shared relationship action trace as working groups: dialog payload at `frontend/src/components/dossier/AddToDossierDialogs.tsx:835-844`, obsolete hook at `frontend/src/domains/relationships/hooks/useCreateRelationship.ts:16-43`, and edge requirements at `supabase/functions/dossiers-relationships-create/index.ts:34-54`.                                        |
| i18n              | Relationship labels are from `dossier:addToDossier`; elected-official route labels are separate from the action context.                                                                                                                                                                                                                                                     |

Findings:

- **R6-07 [B] Relationship creation is broken here too:** The elected-official route reaches the same `RelationshipDialog` and T064 hook as working groups, so it posts `child_dossier_id` to an edge that requires `source_dossier_id` and `target_dossier_id`. See the Working Group section for the full edge/DB contract refs.

- **R6-10 [B] Elected-official action context collapses to `person`:** This may be intentional for storage, but it is not explicit at the action boundary. The route passes `dossierType="elected_official"` for routing at `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:23-27`, while `useAddToDossierActions` uses the fetched `dossier.type` at `frontend/src/hooks/useAddToDossierActions.tsx:101-108`; after the migration, that is `person`. If future relationship, commitment, brief, or export actions need elected-official-specific labeling, analytics, or policy, they need a subtype-aware context field (`dossier_subtype` from `persons.person_subtype`) rather than overloading `dossier.type`. This needs product/schema planning and live data verification.

---

## A-Bucket Fix List

These are safe unattended candidates because they are label, cache, or small UI/data-contract corrections. They should still be reviewed normally, but they do not require schema redesign.

1. **R6-01:** Remove or hide `KeyContactsCard`'s `View all contacts` link until a real contacts route/tab exists, or retarget it to an existing contacts/persons surface. Files: `frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx`, `frontend/src/components/dossier/DossierTabNav.tsx`.

2. **R6-05:** In `DocsTab`, use `engagement-briefs` namespace labels for status/type/citations/view and widen/map `BriefStatus` for `draft`/legacy rows. Use colon namespace form for cross-namespace lookups, for example `t('engagement-briefs:statuses.draft')`, not dotted namespace strings.

3. **R6-08:** After replacing the obsolete relationship create hook, invalidate `relationshipKeys.forDossier(source_dossier_id)` and `relationshipKeys.forDossier(target_dossier_id)`, matching the canonical mutation.

4. **R6-09:** In `CommitmentDialog`, invalidate `['dossier-tab', 'work_items', dossierContext.dossier_id]` and the dossier timeline after creating links, mirroring the task dialog. Remove either the dialog-level or hook-level commitment toasts to avoid duplicate notifications.

5. **R6-11:** Localize the shared `DossierContextBadge` inheritance source label (`direct`, `engagement`, `after_action`, `position`, `mou`) in EN/AR. If the component keeps `useTranslation('dossier')`, `t('addToDossier.context.inheritance.direct')` is fine; if using a cross-namespace lookup, use `t('dossier:addToDossier.context.inheritance.direct')`.

---

## B-Bucket Planning / Live-Verification Queue

1. **R6-02:** Verify live `key_contacts` columns. If the generated types are current, migrate/narrow the frontend contacts contract and handle Supabase select errors explicitly.

2. **R6-03:** Redesign the add-position action around actual `position_types`, required bilingual titles, audience groups, and `position_dossier_links`.

3. **R6-04:** Align dossier event readers/writers: decide whether dossier tabs should read `calendar_entries` or whether the add action must create `calendar_events` rows.

4. **R6-06:** Replace the document upload path with a real storage-first upload plus document-record creation, or migrate the edge/table/types as one contract.

5. **R6-07:** Remove the obsolete `child_dossier_id` relationship path and use the canonical `source_dossier_id` / `target_dossier_id` relationship service.

6. **R6-10:** Decide how elected-official subtype should travel through shared dossier actions: storage as `person` is correct per migration, but route/user semantics may need explicit `person_subtype`.

---

## Verification Notes

- Source inspection only; no live Supabase writes were attempted.
- No source files were modified.
- Known traps were observed: country ISO fields are on `countries`; commitments use `aa_commitments`; engagement brief generation correctly verifies `engagement_dossiers`; relationship and document actions still need contract alignment.
