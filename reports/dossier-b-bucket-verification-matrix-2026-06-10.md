# Intl-Dossier B-Bucket Verification Matrix - 2026-06-10

Round: 10 verification round.

Scope guardrails:

- `reports/fanout-loop-state.json` was read first. The matrix below targets the escalated B-bucket items from `round6_done` through `round9_done`.
- There is no local live DB access in this run. Every live check below is a read-only `SELECT` for Claude to run against staging.
- SMALL means safe unattended alignment in app or edge code without schema migrations, broad UX redesign, or product decisions. PHASE means schema/RLS/storage/deploy/product UX work stays escalated.
- Table truths preserved: `calendar_entries` is the canonical operational calendar, engagement filters must verify `engagement_dossiers`, `countries` is the country table, and no `aa_commitments` table change is proposed here.
- For any new cross-namespace i18n reference, use colon namespace form such as `dossier:addToDossier.form.relationshipTypes.related_to`.

## R6-02 Country - key_contacts column drift

Local contract evidence:

- `frontend/src/lib/query-columns.ts:89` defines `KEY_CONTACTS_COLUMNS.LIST`.
- `frontend/src/lib/query-columns.ts:91` selects `name_ar`, `title_en`, `title_ar`, `organization_ar`, `photo_url`, and `linked_person_dossier_id`.
- `frontend/src/types/database.types.ts:16302` defines generated `key_contacts`.
- `frontend/src/types/database.types.ts:16303` through `frontend/src/types/database.types.ts:16315` only contain `created_at`, `dossier_id`, `email`, `id`, `last_interaction_date`, `name`, `notes`, `organization`, `phone`, `role`, and `updated_at`.
- `frontend/src/services/dossier-overview.service.ts:233` through `frontend/src/services/dossier-overview.service.ts:248` type the richer row.
- `frontend/src/services/dossier-overview.service.ts:849` through `frontend/src/services/dossier-overview.service.ts:870` select and map the richer fields.

Claude SQL:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'key_contacts'
ORDER BY ordinal_position;

WITH expected(column_name) AS (
  VALUES
    ('id'),
    ('name'),
    ('name_ar'),
    ('role'),
    ('title_en'),
    ('title_ar'),
    ('organization'),
    ('organization_ar'),
    ('email'),
    ('phone'),
    ('photo_url'),
    ('last_interaction_date'),
    ('notes'),
    ('linked_person_dossier_id'),
    ('dossier_id')
)
SELECT e.column_name, (c.column_name IS NOT NULL) AS exists_live
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'key_contacts'
 AND c.column_name = e.column_name
ORDER BY e.column_name;

SELECT count(*) AS key_contacts_count,
       count(*) FILTER (WHERE dossier_id IS NOT NULL) AS dossier_linked_count
FROM public.key_contacts;
```

Outcome matrix:

| Live outcome                                                                                                                                                                             | Verdict                                                                                                            | Minimal fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Class |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| All fields in `KEY_CONTACTS_COLUMNS.LIST` exist live, but generated types still match `frontend/src/types/database.types.ts:16302` through `frontend/src/types/database.types.ts:16342`. | Generated types are stale, not the runtime select.                                                                 | Regenerate/update generated Supabase types at `frontend/src/types/database.types.ts:16302`; no app behavior fix required. Optionally add explicit Supabase error handling around `frontend/src/services/dossier-overview.service.ts:850` so future column drift is visible.                                                                                                                                                                                                                                                                                                                                              | SMALL |
| Any rich field from `name_ar`, `title_en`, `title_ar`, `organization_ar`, `photo_url`, or `linked_person_dossier_id` is missing live.                                                    | Runtime select can fail or silently collapse the section because the list column contract is wider than the table. | Narrow `KEY_CONTACTS_COLUMNS.LIST` at `frontend/src/lib/query-columns.ts:89` through `frontend/src/lib/query-columns.ts:91`; narrow `KeyContactRow` at `frontend/src/services/dossier-overview.service.ts:233` through `frontend/src/services/dossier-overview.service.ts:248`; map only live fields at `frontend/src/services/dossier-overview.service.ts:856` through `frontend/src/services/dossier-overview.service.ts:870`; degrade the UI fields in `frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx:61` and `frontend/src/components/dossier/dossier-overview/sections/KeyContactsSection.tsx:57`. | SMALL |
| Rich fields are missing live, but product requires bilingual names/titles, avatars, or linked person dossiers in key contacts.                                                           | The app expectation is broader than the table model.                                                               | Keep the read path narrowed as a defensive SMALL fix if needed, but the richer product contract requires a model decision and live DB change. Do not propose that schema work as SMALL.                                                                                                                                                                                                                                                                                                                                                                                                                                  | PHASE |

## R6-03 Organization - positions-create contract

Local contract evidence:

- `frontend/src/components/dossier/AddToDossierDialogs.tsx:599` starts `PositionDialog`.
- `frontend/src/components/dossier/AddToDossierDialogs.tsx:622` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:628` submit `position_type_id: dossierContext.dossier_id`, `title_ar: ''`, and `audience_groups: []`.
- `supabase/functions/positions-create/index.ts:40` through `supabase/functions/positions-create/index.ts:69` require `position_type_id`, both `title_en` and `title_ar`, and at least one `audience_groups` item.
- `supabase/functions/positions-create/index.ts:103` through `supabase/functions/positions-create/index.ts:118` verifies `position_types`.
- `frontend/src/domains/positions/repositories/positions.repository.ts:76` through `frontend/src/domains/positions/repositories/positions.repository.ts:78` posts to `/positions-create`.
- `frontend/src/domains/positions/repositories/positions.repository.ts:163` through `frontend/src/domains/positions/repositories/positions.repository.ts:168` has the separate dossier link call.
- `supabase/functions/positions-dossiers-create/index.ts:76` through `supabase/functions/positions-dossiers-create/index.ts:85` inserts into `position_dossier_links` and currently uses `linked_by`.

Claude SQL:

```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'position_types',
    'audience_groups',
    'positions',
    'position_audience_groups',
    'position_dossier_links'
  )
ORDER BY table_name, ordinal_position;

SELECT id, name_en, name_ar, approval_stages, default_chain_config
FROM public.position_types
ORDER BY created_at NULLS LAST, name_en
LIMIT 25;

SELECT id, name_en, name_ar
FROM public.audience_groups
ORDER BY name_en
LIMIT 25;

SELECT count(*) AS position_types_count
FROM public.position_types;

SELECT count(*) AS audience_groups_count
FROM public.audience_groups;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'position_dossier_links'
  AND column_name IN ('created_by', 'linked_by', 'dossier_id', 'position_id', 'link_type', 'notes')
ORDER BY column_name;
```

Outcome matrix:

| Live outcome                                                                                                                                     | Verdict                                                                                                               | Minimal fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Class                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| At least one valid `position_types` row and one valid `audience_groups` row exist, and staging confirms one acceptable minimal default for each. | The dialog payload is wrong, but a minimal create can be wired without schema work if the default choice is explicit. | In `frontend/src/components/dossier/AddToDossierDialogs.tsx:622` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:628`, stop using `dossierContext.dossier_id` as `position_type_id`, send the confirmed default `position_type_id`, send a non-empty `title_ar` fallback if the current dialog remains English-only, and send one confirmed audience group. After the create returns, call the existing dossier link repository path at `frontend/src/domains/positions/repositories/positions.repository.ts:163` through `frontend/src/domains/positions/repositories/positions.repository.ts:168` with `dossier_id: dossierContext.dossier_id`. | SMALL only if the default rows are confirmed and accepted |
| `position_types` has no rows, `audience_groups` has no rows, or no default can be chosen without product input.                                  | The Add-to-Dossier position action lacks required live reference data.                                                | Keep escalated. The fix is seeding/configuration and likely picker UX for position type and audience group; no schema migration or seed decision is SMALL.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | PHASE                                                     |
| `position_dossier_links` live has `created_by` but not `linked_by`.                                                                              | The separate link edge will fail even after position creation succeeds.                                               | Change the insert field in `supabase/functions/positions-dossiers-create/index.ts:76` through `supabase/functions/positions-dossiers-create/index.ts:85` from `linked_by` to the live column, likely `created_by`, if Claude confirms the live column.                                                                                                                                                                                                                                                                                                                                                                                                             | SMALL                                                     |
| Live `position_dossier_links` columns differ materially from both `created_by` and `linked_by`, or the link semantics require a new UX contract. | Link creation cannot be treated as a one-field code typo.                                                             | Keep the create dialog blocked until the relationship between positions and dossiers is re-specified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | PHASE                                                     |

## R6-04 Forum - dossier-linked events split between calendar_entries and calendar_events

Local contract evidence:

- `frontend/src/components/dossier/AddToDossierDialogs.tsx:696` starts `EventDialog`.
- `frontend/src/components/dossier/AddToDossierDialogs.tsx:721` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:735` sends `linked_item_type: 'dossier'` and `linked_item_id: dossierContext.dossier_id`.
- `supabase/functions/calendar-create/index.ts:1` through `supabase/functions/calendar-create/index.ts:6` states `calendar_entries` is the canonical operational calendar and `calendar_events` is a separate forum-agenda model.
- `supabase/functions/calendar-create/index.ts:98` through `supabase/functions/calendar-create/index.ts:109` maps the dossier link to `dossier_id`.
- `supabase/functions/calendar-create/index.ts:115` through `supabase/functions/calendar-create/index.ts:138` inserts `calendar_entries`.
- `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:39` through `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:45` requests `calendar_events`.
- `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:54` and `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:65` through `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:71` read `calendar_events`.
- `frontend/src/services/dossier-overview.service.ts:794` through `frontend/src/services/dossier-overview.service.ts:843` reads `calendar_events` for the overview section.
- `frontend/src/domains/calendar/repositories/calendar.repository.ts:75` through `frontend/src/domains/calendar/repositories/calendar.repository.ts:95` already maps `calendar_entries` to calendar event UI shape.
- `frontend/src/types/database.types.ts:4652` through `frontend/src/types/database.types.ts:4735` shows `calendar_entries` includes `dossier_id`, `event_date`, `event_time`, and `entry_type`.

Claude SQL:

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('calendar_entries', 'calendar_events')
ORDER BY table_name, ordinal_position;

SELECT 'calendar_entries' AS table_name,
       count(*) AS total,
       count(*) FILTER (WHERE dossier_id IS NOT NULL) AS dossier_linked,
       count(*) FILTER (WHERE linked_item_type = 'dossier') AS linked_item_type_dossier
FROM public.calendar_entries
UNION ALL
SELECT 'calendar_events' AS table_name,
       count(*) AS total,
       count(*) FILTER (WHERE dossier_id IS NOT NULL) AS dossier_linked,
       NULL::bigint AS linked_item_type_dossier
FROM public.calendar_events;

SELECT dossier_id, count(*) AS entries
FROM public.calendar_entries
WHERE dossier_id IS NOT NULL
GROUP BY dossier_id
ORDER BY entries DESC
LIMIT 10;

SELECT dossier_id, count(*) AS events
FROM public.calendar_events
WHERE dossier_id IS NOT NULL
GROUP BY dossier_id
ORDER BY events DESC
LIMIT 10;
```

Outcome matrix:

| Live outcome                                                                                                                            | Verdict                                                                                                                                                  | Minimal fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Class |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `calendar_entries` has dossier-linked rows and `calendar_events` has zero or fewer dossier-linked rows.                                 | Confirmed reader/writer split. Created dossier events are written to the canonical operational table but dossier readers look at the forum-agenda table. | Change the dossier reader path to `calendar_entries`, not the writer. The narrow fix is `frontend/src/services/dossier-overview.service.ts:805` through `frontend/src/services/dossier-overview.service.ts:811`: read `calendar_entries`, filter `dossier_id`, date-window on `event_date`, and map `event_date` plus `event_time` using the existing approach at `frontend/src/domains/calendar/repositories/calendar.repository.ts:75` through `frontend/src/domains/calendar/repositories/calendar.repository.ts:95`. Keep `calendar_entries` canonical. | SMALL |
| Both `calendar_entries` and `calendar_events` have dossier-linked rows.                                                                 | Mixed live model exists, but Add-to-Dossier still writes operational events to `calendar_entries`.                                                       | For Add-to-Dossier visibility, still switch the operational reader at `frontend/src/services/dossier-overview.service.ts:805` to `calendar_entries`.                                                                                                                                                                                                                                                                                                                                                                                                        | SMALL |
| Product wants a combined timeline of operational entries plus forum-agenda `calendar_events`.                                           | The UI is no longer a one-table reader fix.                                                                                                              | Design a merged model and sorting/deduplication contract for `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:57` through `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:72`.                                                                                                                                                                                                                                                                                                                                               | PHASE |
| `calendar_entries` lacks `dossier_id` or the live canonical columns differ materially from `frontend/src/types/database.types.ts:4652`. | Live schema does not match the canonical operational-calendar contract.                                                                                  | Keep escalated. Do not propose a schema migration as SMALL.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | PHASE |

## R7-04 Engagement - server-side filter wiring

Local contract evidence:

- `frontend/src/pages/engagements/EngagementsListPage.tsx:34` through `frontend/src/pages/engagements/EngagementsListPage.tsx:52` maps exact `engagement_type` values into grouped UI types.
- `frontend/src/pages/engagements/EngagementsListPage.tsx:95` through `frontend/src/pages/engagements/EngagementsListPage.tsx:111` stores `filter` and filters client-side after infinite pages are fetched.
- `frontend/src/hooks/useEngagementsInfinite.ts:21` through `frontend/src/hooks/useEngagementsInfinite.ts:24` accepts only `search` and `limit`.
- `frontend/src/hooks/useEngagementsInfinite.ts:41` through `frontend/src/hooks/useEngagementsInfinite.ts:45` does not include or pass `engagement_type`.
- `frontend/src/domains/engagements/repositories/engagements.repository.ts:56` through `frontend/src/domains/engagements/repositories/engagements.repository.ts:71` already passes `engagement_type` if supplied.
- `supabase/functions/engagement-dossiers/index.ts:297` through `supabase/functions/engagement-dossiers/index.ts:300` parses `engagement_type`.
- `supabase/functions/engagement-dossiers/index.ts:344` through `supabase/functions/engagement-dossiers/index.ts:355` passes `p_engagement_type` to `search_engagements_advanced`.

Note: the SQL below verifies the live RPC and data shape. Edge-function param pass-through is source evidence unless Claude also inspects deployed edge source through Supabase MCP.

Claude SQL:

```sql
SELECT p.oid::regprocedure AS signature,
       pg_get_function_arguments(p.oid) AS arguments,
       pg_get_function_result(p.oid) AS result_type,
       p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'search_engagements_advanced'
ORDER BY p.oid::regprocedure::text;

SELECT engagement_type, count(*) AS rows
FROM public.engagement_dossiers
GROUP BY engagement_type
ORDER BY engagement_type;

SELECT count(*) AS active_engagement_dossier_rows
FROM public.engagement_dossiers ed
JOIN public.dossiers d ON d.id = ed.id
WHERE d.type = 'engagement'
  AND d.status <> 'archived';

SELECT count(*) AS stale_type_join_rows
FROM public.engagement_dossiers ed
JOIN public.dossiers d ON d.id = ed.id
WHERE d.type = 'engagement_dossier'
  AND d.status <> 'archived';
```

Outcome matrix:

| Live outcome                                                                                                                                                                                                           | Verdict                                                                                                                                           | Minimal fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Class                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `search_engagements_advanced` includes `p_engagement_type`, `active_engagement_dossier_rows` is non-zero, and `stale_type_join_rows` is zero.                                                                          | Live DB supports exact-type server filtering, and the local edge path already forwards the param. The frontend hook is the remaining gap.         | Add `engagement_type?: EngagementType` to `frontend/src/hooks/useEngagementsInfinite.ts:21` through `frontend/src/hooks/useEngagementsInfinite.ts:24`, include it in the query key at `frontend/src/hooks/useEngagementsInfinite.ts:38` through `frontend/src/hooks/useEngagementsInfinite.ts:41`, and pass it into `engagementsRepo.getEngagements` at `frontend/src/hooks/useEngagementsInfinite.ts:43` through `frontend/src/hooks/useEngagementsInfinite.ts:45`. Wire exact enum filters from `frontend/src/pages/engagements/EngagementsListPage.tsx:95` through `frontend/src/pages/engagements/EngagementsListPage.tsx:111`. | SMALL only for exact enum filters |
| The UI must keep grouped pills (`meeting`, `travel`, `event`) as currently modeled by `frontend/src/pages/engagements/EngagementsListPage.tsx:34` through `frontend/src/pages/engagements/EngagementsListPage.tsx:52`. | The RPC accepts one exact `p_engagement_type`, not a group or array. Client-side filtering after infinite pages is not a correct server-side fix. | Keep escalated for a grouped filter contract, either RPC support for arrays/groups or a product change to exact-type filter pills.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | PHASE                             |
| `search_engagements_advanced` is missing `p_engagement_type`, or rows only appear under the stale `d.type = 'engagement_dossier'` join.                                                                                | Staging DB/RPC does not match the expected engagement dossier contract.                                                                           | No frontend SMALL fix. Redeploy/fix the RPC or DB contract, using `engagement_dossiers` as the source table truth.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | PHASE                             |
| Exact filter support exists but some `engagement_type` values have zero rows.                                                                                                                                          | The filter contract exists, but UI availability may need data-aware hiding.                                                                       | If exact filters are used, hide or disable empty exact filters in `frontend/src/pages/engagements/EngagementsListPage.tsx:95` through `frontend/src/pages/engagements/EngagementsListPage.tsx:111` after counts are available.                                                                                                                                                                                                                                                                                                                                                                                                      | SMALL                             |

## R6-06 Topic - documents-create insert shape versus live documents table

Local contract evidence:

- `frontend/src/components/dossier/AddToDossierDialogs.tsx:1009` starts `DocumentDialog`.
- `frontend/src/components/dossier/AddToDossierDialogs.tsx:1021` calls `useUploadDocument('dossier', dossierContext.dossier_id)`.
- `frontend/src/components/dossier/AddToDossierDialogs.tsx:1041` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:1043` uploads `{ file, documentType }`.
- `frontend/src/hooks/useUploadDocument.ts:38` through `frontend/src/hooks/useUploadDocument.ts:57` builds multipart `FormData` with `owner_type`, `owner_id`, `file`, and `document_type`.
- `frontend/src/hooks/useUploadDocument.ts:91` through `frontend/src/hooks/useUploadDocument.ts:100` posts multipart data to `/functions/v1/documents-create`.
- `supabase/functions/documents-create/index.ts:25` through `supabase/functions/documents-create/index.ts:36` parses JSON, not multipart.
- `supabase/functions/documents-create/index.ts:38` through `supabase/functions/documents-create/index.ts:45` requires `owner_type`, `owner_id`, `document_type`, and `storage_path`.
- `supabase/functions/documents-create/index.ts:63` through `supabase/functions/documents-create/index.ts:79` inserts stale `owner_*`, `document_type`, and `storage_path` fields.
- `frontend/src/domains/documents/repositories/documents.repository.ts:17` through `frontend/src/domains/documents/repositories/documents.repository.ts:31` models the same stale owner/storage shape.
- `frontend/src/types/database.types.ts:8955` through `frontend/src/types/database.types.ts:9040` shows generated `documents` columns are `title`, `type`, `file_info`, `tenant_id`, `classification`, `language`, `created_by`, `last_modified_by`, `version`, `version_number`, etc.

Claude SQL:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'documents'
ORDER BY ordinal_position;

WITH edge_expected(column_name) AS (
  VALUES
    ('owner_type'),
    ('owner_id'),
    ('document_type'),
    ('title_en'),
    ('title_ar'),
    ('storage_path'),
    ('file_size'),
    ('mime_type'),
    ('metadata'),
    ('uploaded_by')
),
generated_expected(column_name) AS (
  VALUES
    ('title'),
    ('type'),
    ('file_info'),
    ('tenant_id'),
    ('classification'),
    ('language'),
    ('created_by'),
    ('last_modified_by'),
    ('version'),
    ('version_number'),
    ('related_entities')
)
SELECT 'edge_expected' AS expectation,
       e.column_name,
       (c.column_name IS NOT NULL) AS exists_live
FROM edge_expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'documents'
 AND c.column_name = e.column_name
UNION ALL
SELECT 'generated_expected' AS expectation,
       g.column_name,
       (c.column_name IS NOT NULL) AS exists_live
FROM generated_expected g
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'documents'
 AND c.column_name = g.column_name
ORDER BY expectation, column_name;

SELECT count(*) AS documents_count
FROM public.documents;

SELECT type, count(*) AS rows
FROM public.documents
GROUP BY type
ORDER BY type;

SELECT bucket_id, count(*) AS objects
FROM storage.objects
WHERE bucket_id IN ('documents', 'data-library', 'dossier-documents')
GROUP BY bucket_id
ORDER BY bucket_id;
```

Outcome matrix:

| Live outcome                                                                                                       | Verdict                                                                                                                                                                    | Minimal fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Class                                                           |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Live `documents` matches generated types and lacks `owner_type`, `owner_id`, `document_type`, and `storage_path`.  | The document workflow is not a simple insert typo. The hook sends multipart to an edge that expects JSON, and the edge inserts a stale shape into the live document model. | No source SMALL fix for a working upload. The minimum safe mitigation is to disable or hide the Add-to-Dossier document action in `frontend/src/components/dossier/AddToDossierDialogs.tsx:1009` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:1043` until a storage-first current `documents` contract exists.                                                                                                                                                                                               | PHASE for working upload; SMALL only for temporary disable      |
| Live `documents` unexpectedly has the stale edge columns and storage buckets contain the expected document bucket. | The table can accept the edge shape, but the frontend transport is wrong.                                                                                                  | Refactor `frontend/src/hooks/useUploadDocument.ts:38` through `frontend/src/hooks/useUploadDocument.ts:100` to upload the file to Storage first and then POST JSON with `owner_type`, `owner_id`, `document_type`, `storage_path`, `file_size`, and `mime_type` to `supabase/functions/documents-create/index.ts:25`. Also use the current Supabase session token instead of `localStorage.getItem('supabase.auth.token')` at `frontend/src/hooks/useUploadDocument.ts:94` through `frontend/src/hooks/useUploadDocument.ts:98`. | SMALL only if live table confirms the stale edge shape is valid |
| Live `documents` has mixed columns or object buckets do not identify an obvious upload target.                     | The document domain has competing contracts.                                                                                                                               | Keep escalated for a canonical document plus Storage design. Do not propose schema migrations as SMALL.                                                                                                                                                                                                                                                                                                                                                                                                                          | PHASE                                                           |

## R6-07 Working group and elected official - relationship-create payload contract

Local contract evidence:

- `frontend/src/components/dossier/AddToDossierDialogs.tsx:822` starts `RelationshipDialog`.
- `frontend/src/components/dossier/AddToDossierDialogs.tsx:830` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:833` initializes `collaborates_with` and imports the obsolete `useCreateRelationship(dossierContext.dossier_id)` path.
- `frontend/src/components/dossier/AddToDossierDialogs.tsx:845` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:854` sends `child_dossier_id` plus old relationship types.
- `frontend/src/components/dossier/AddToDossierDialogs.tsx:893` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:910` offers old types such as `collaborates_with`, `monitors`, and `hosts`.
- `frontend/src/domains/relationships/hooks/useCreateRelationship.ts:16` through `frontend/src/domains/relationships/hooks/useCreateRelationship.ts:29` defines the obsolete child payload.
- `frontend/src/domains/relationships/repositories/relationships.repository.ts:35` through `frontend/src/domains/relationships/repositories/relationships.repository.ts:52` posts to `/dossiers-relationships-create?dossierId=...`.
- `frontend/src/services/relationship-api.ts:69` through `frontend/src/services/relationship-api.ts:84` defines canonical `CreateRelationshipRequest` with `source_dossier_id`, `target_dossier_id`, and `relationship_type`.
- `frontend/src/services/relationship-api.ts:243` through `frontend/src/services/relationship-api.ts:255` posts to `/functions/v1/dossier-relationships`.
- `frontend/src/domains/relationships/hooks/useRelationships.ts:112` through `frontend/src/domains/relationships/hooks/useRelationships.ts:133` exposes the canonical create hook and invalidations.
- `frontend/src/components/dossier/RelationshipSidebar.tsx:230` through `frontend/src/components/dossier/RelationshipSidebar.tsx:238` shows the minimal canonical payload already used elsewhere.
- `supabase/functions/dossier-relationships/index.ts:25` through `supabase/functions/dossier-relationships/index.ts:35` defines canonical request fields.
- `supabase/functions/dossier-relationships/index.ts:57` through `supabase/functions/dossier-relationships/index.ts:77` defines valid relationship types.
- `supabase/functions/dossier-relationships/index.ts:335` through `supabase/functions/dossier-relationships/index.ts:463` validates and inserts canonical `source_dossier_id`, `target_dossier_id`, and `relationship_type`.

Claude SQL:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dossier_relationships'
ORDER BY ordinal_position;

SELECT conname, pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'public.dossier_relationships'::regclass
ORDER BY conname;

SELECT relationship_type, count(*) AS rows
FROM public.dossier_relationships
GROUP BY relationship_type
ORDER BY relationship_type;

WITH candidate_types(type) AS (
  VALUES
    ('member_of'),
    ('participates_in'),
    ('cooperates_with'),
    ('related_to'),
    ('partnership'),
    ('parent_of'),
    ('subsidiary_of'),
    ('hosted_by'),
    ('collaborates_with'),
    ('monitors'),
    ('is_member'),
    ('hosts')
)
SELECT ct.type,
       EXISTS (
         SELECT 1
         FROM pg_constraint c
         WHERE c.conrelid = 'public.dossier_relationships'::regclass
           AND pg_get_constraintdef(c.oid) LIKE '%' || ct.type || '%'
       ) AS appears_in_check_constraint
FROM candidate_types ct
ORDER BY ct.type;

SELECT count(*) AS active_relationships
FROM public.dossier_relationships
WHERE status = 'active';
```

Outcome matrix:

| Live outcome                                                                                                                                                                                                                       | Verdict                                                          | Minimal fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Class            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Live table has `source_dossier_id` and `target_dossier_id`, and constraints align with canonical types from `supabase/functions/dossier-relationships/index.ts:57` through `supabase/functions/dossier-relationships/index.ts:77`. | Confirmed obsolete Add-to-Dossier dialog contract.               | Replace the obsolete hook in `frontend/src/components/dossier/AddToDossierDialogs.tsx:833` with the canonical create hook from `frontend/src/domains/relationships/hooks/useRelationships.ts:112`. Change `frontend/src/components/dossier/AddToDossierDialogs.tsx:845` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:854` to send `{ source_dossier_id: dossierContext.dossier_id, target_dossier_id: targetDossierId, relationship_type }` using `frontend/src/services/relationship-api.ts:69` through `frontend/src/services/relationship-api.ts:84`. Use canonical options at `frontend/src/components/dossier/AddToDossierDialogs.tsx:893` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:910`, with new labels in colon form if new i18n keys are added, for example `dossier:addToDossier.form.relationshipTypes.related_to`. Minimal RelationshipDialog payload: user supplies `target_dossier_id` and a canonical `relationship_type`; `source_dossier_id` comes from `dossierContext.dossier_id`. | SMALL            |
| Live table has source/target columns, but constraints still accept some old values.                                                                                                                                                | Payload shape is still wrong even if some labels happen to pass. | Same SMALL payload fix as above. Map old UI values to canonical values only if product wants temporary compatibility; otherwise default to `related_to`, matching `frontend/src/components/dossier/RelationshipSidebar.tsx:230` through `frontend/src/components/dossier/RelationshipSidebar.tsx:238`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | SMALL            |
| Live table lacks `source_dossier_id` or `target_dossier_id`, or requires `child_dossier_id`.                                                                                                                                       | Staging does not match canonical source/target relationship API. | Keep escalated for deploy/schema reconciliation. Do not propose a migration as SMALL.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | PHASE            |
| Product requires a dossier picker/search instead of the raw UUID input at `frontend/src/components/dossier/AddToDossierDialogs.tsx:881` through `frontend/src/components/dossier/AddToDossierDialogs.tsx:890`.                     | Payload contract can be fixed, but UX remains incomplete.        | The raw-ID payload fix remains SMALL. A proper picker is PHASE UX work.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | PHASE for picker |

## Persons RLS - org-isolation policies for null organization rows

Local contract evidence:

- `supabase/migrations/20260609000000_fix_persons_select_rls_allow_null_org.sql:13` through `supabase/migrations/20260609000000_fix_persons_select_rls_allow_null_org.sql:16` notes sibling INSERT/UPDATE/DELETE policies still carry the NULL-blocking pattern.
- `supabase/migrations/20260609000000_fix_persons_select_rls_allow_null_org.sql:20` through `supabase/migrations/20260609000000_fix_persons_select_rls_allow_null_org.sql:27` fixes SELECT to allow `organization_id IS NULL`.
- `supabase/functions/persons/index.ts:442` through `supabase/functions/persons/index.ts:463` directly inserts into `persons` and sets `organization_id: body.organization_id`.
- `supabase/functions/persons/index.ts:577` through `supabase/functions/persons/index.ts:603` directly updates `persons`.
- `frontend/src/components/dossier/wizard/config/person.config.ts:134` through `frontend/src/components/dossier/wizard/config/person.config.ts:157` omits `organization_id` for standard person submissions.
- `frontend/src/components/dossier/wizard/config/person.config.ts:213` through `frontend/src/components/dossier/wizard/config/person.config.ts:218` sends `organization_id` for elected officials only if non-empty.
- `frontend/src/types/database.types.ts:21209`, `frontend/src/types/database.types.ts:21274`, and `frontend/src/types/database.types.ts:21339` show `organization_id` is nullable on row/insert/update types.

Claude SQL:

```sql
SELECT c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'persons';

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'persons'
ORDER BY cmd, policyname;

SELECT count(*) AS persons_total,
       count(*) FILTER (WHERE organization_id IS NULL) AS null_org_persons,
       count(*) FILTER (WHERE organization_id IS NOT NULL) AS org_scoped_persons
FROM public.persons;

SELECT p.oid::regprocedure AS signature,
       pg_get_function_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('search_persons_advanced', 'get_person_full')
ORDER BY p.proname, p.oid::regprocedure::text;

SELECT p.proname,
       p.oid::regprocedure AS signature,
       pg_get_function_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname ILIKE '%person%'
ORDER BY p.proname, p.oid::regprocedure::text;
```

Outcome matrix:

| Live outcome                                                                                                                                                       | Verdict                                                                                                      | Minimal fix                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Class                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| SELECT policy allows `organization_id IS NULL`, but INSERT/UPDATE/DELETE policies have `with_check` or `qual` requiring only `organization_id = jwt.org_id`.       | Null-org persons are visible but direct authenticated mutations can still fail for all-null-org person rows. | No frontend-only SMALL fix preserves the current global/null person model. Keep escalated for RLS/API reconciliation. If direct edge writes remain the source of truth, `supabase/functions/persons/index.ts:442` through `supabase/functions/persons/index.ts:463` and `supabase/functions/persons/index.ts:577` through `supabase/functions/persons/index.ts:603` need a policy-compatible mutation route, likely SECURITY DEFINER RPCs or adjusted policies. | PHASE                 |
| SELECT, INSERT, UPDATE, and DELETE policies all explicitly allow `organization_id IS NULL` where intended.                                                         | The RLS null-org blocker is resolved live.                                                                   | No code fix for RLS. Keep `frontend/src/components/dossier/wizard/config/person.config.ts:134` through `frontend/src/components/dossier/wizard/config/person.config.ts:157` omitting org for standard persons as valid.                                                                                                                                                                                                                                         | SMALL, no code change |
| RLS is disabled on `public.persons`.                                                                                                                               | The null-org blocker is absent, but the table is not protected by the expected policy layer.                 | Keep escalated for security hardening. Do not mark this as a workflow SMALL pass.                                                                                                                                                                                                                                                                                                                                                                               | PHASE                 |
| Live mutation path uses SECURITY DEFINER person RPCs and repo edge deployment no longer directly writes `persons`, despite local source still doing direct writes. | Staging behavior may be fixed, but repo source is drifted from deployment.                                   | Update source to match the deployed mutation path, or redeploy source and accept the PHASE RLS work. Because this depends on live deployment details and DB functions, do not classify as unattended SMALL.                                                                                                                                                                                                                                                     | PHASE                 |
| Product decides every person must belong to an org.                                                                                                                | This avoids null-org mutation failures but changes the product model.                                        | Add required organization capture in the person wizard around `frontend/src/components/dossier/wizard/config/person.config.ts:134` and elected official flow around `frontend/src/components/dossier/wizard/config/person.config.ts:213`, but treat the requirement as product/UX work, not a bug-only SMALL fix.                                                                                                                                               | PHASE                 |

## Final Summary

| Item                                               | Checks Claude should run                                                                                                                                                 | SMALL fix if                                                                                                                                                                                                                                                            | PHASE if                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| R6-02 country/key_contacts                         | `information_schema.columns` for `key_contacts`; expected-column existence; key contact counts.                                                                          | Live table is narrower and frontend can degrade to live fields, or only generated types are stale. Fix `frontend/src/lib/query-columns.ts:89`, `frontend/src/services/dossier-overview.service.ts:233`, and `frontend/src/services/dossier-overview.service.ts:849`.    | Product requires rich key contact fields that do not exist live.                                                         |
| R6-03 organization/positions                       | Columns and row counts for `position_types`, `audience_groups`, `positions`, `position_audience_groups`, `position_dossier_links`; inspect `created_by` vs `linked_by`.  | A confirmed default `position_type_id` and audience group exist, and the link insert column is a one-field mismatch. Fix `frontend/src/components/dossier/AddToDossierDialogs.tsx:622` and maybe `supabase/functions/positions-dossiers-create/index.ts:76`.            | Required reference rows/defaults are absent or picker/product semantics are needed.                                      |
| R6-04 forum/calendar                               | Columns for `calendar_entries` and `calendar_events`; counts of dossier-linked rows in both tables.                                                                      | `calendar_entries` is live canonical and readers are pointed at `calendar_events`. Fix `frontend/src/services/dossier-overview.service.ts:805` to read/map `calendar_entries`.                                                                                          | Product wants merged operational plus forum-agenda timeline, or live `calendar_entries` lacks canonical dossier columns. |
| R7-04 engagement filters                           | `pg_proc` signature for `search_engagements_advanced`; `engagement_dossiers` counts by type; `dossiers.type` join counts for `engagement` vs stale `engagement_dossier`. | Exact `p_engagement_type` is live and UI can switch to exact enum filters. Fix `frontend/src/hooks/useEngagementsInfinite.ts:21` and `frontend/src/pages/engagements/EngagementsListPage.tsx:95`.                                                                       | Grouped pills must remain, RPC is missing the param, or staging still joins stale dossier type.                          |
| R6-06 topic/documents                              | `information_schema.columns` for `documents`; expected stale-vs-generated columns; document counts by `type`; storage bucket object counts.                              | Live unexpectedly supports stale edge columns and only the multipart-vs-JSON upload transport is wrong. Fix `frontend/src/hooks/useUploadDocument.ts:38`. Temporary hide/disable is also SMALL mitigation.                                                              | Live matches generated `documents` model, storage contract is unclear, or canonical document model needs design.         |
| R6-07 working_group/elected_official relationships | Columns and constraints for `dossier_relationships`; relationship type counts; candidate type constraint membership.                                                     | Live source/target canonical contract is present. Fix `frontend/src/components/dossier/AddToDossierDialogs.tsx:833` and `frontend/src/components/dossier/AddToDossierDialogs.tsx:845` to use `frontend/src/services/relationship-api.ts:69` payload via canonical hook. | Live still uses child payload or product requires dossier picker/search.                                                 |
| Persons RLS                                        | `pg_class` RLS flags; `pg_policies` for `persons`; null-org row counts; person-related function signatures and SECURITY DEFINER flags.                                   | All policies already allow null org where intended; no fix.                                                                                                                                                                                                             | INSERT/UPDATE/DELETE still block null-org rows, RLS disabled, or mutation path depends on DB/RPC policy changes.         |
