# Dossier Workflows Round 7 Inspection

**Date:** Wed 10 Jun 2026  
**Scope:** Read-only Round 7 inspection of one still-uncovered, user-reachable workflow per dossier type: country, organization, forum, engagement, topic, working_group, person, elected_official.  
**Constraint:** Report only. No source files modified.

## Prior Coverage Guard

I first read `reports/fanout-loop-state.json` and `reports/dossier-tab-workflows-inspection-2026-06-10.md`.

Round 6 is marked complete in `reports/fanout-loop-state.json:154-163`. It covered country Key Contacts, organization/forum/topic/working_group/person/elected_official Add-to-Dossier actions, and engagement Docs generate-brief. It also records the B-bucket items that remain open: key_contacts drift, PositionDialog contract, forum Schedule Event calendar split, document upload contract, relationship create payload, and elected-official action context collapse.

The Round 6 report states that prior rounds already covered dossier creation/editing, core list/detail reads, overview sections, country task creation, organization MoUs, topic positions attach, forum sessions/timeline, engagement workspace overview/tasks/docs placeholders, working-group overview/timeline, person overview/timeline, elected-official create/detail/committees, and broad relationships/calendar/documents/AI-briefing workflows at `reports/dossier-tab-workflows-inspection-2026-06-10.md:6-8`.

Therefore Round 7 avoids those covered workflows and focuses on remaining shared detail tabs, list behavior, header export, and visible-but-unwired tab surfaces.

## Selected Workflows

| Dossier type     | Round 7 workflow inspected                            | Route entry                                                                  | Primary surface                             |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| country          | Header Export briefing pack                           | `frontend/src/routes/_protected/dossiers/countries/$id.tsx:17-27`            | `DossierShell` -> `ExportDossierDialog`     |
| organization     | Detail Tasks tab                                      | `frontend/src/routes/_protected/dossiers/organizations/$id/tasks.tsx:17-28`  | `DossierWorkItemsTab` -> `WorkItemsSection` |
| forum            | Detail Audit tab                                      | `frontend/src/routes/_protected/dossiers/forums/$id/audit.tsx:9-23`          | Visible audit route stub                    |
| engagement       | `/dossiers/engagements` list filters/search/load-more | `frontend/src/routes/_protected/dossiers/engagements/index.tsx:11-16`        | `EngagementsListPage` -> `EngagementsList`  |
| topic            | Detail Audit tab                                      | `frontend/src/routes/_protected/dossiers/topics/$id/audit.tsx:9-23`          | Visible audit route stub                    |
| working_group    | Detail Tasks tab aggregation/counts                   | `frontend/src/routes/_protected/dossiers/working_groups/$id/tasks.tsx:17-28` | `DossierWorkItemsTab` -> `fetchWorkItems`   |
| person           | Detail Engagements tab content rendering              | `frontend/src/routes/_protected/dossiers/persons/$id/engagements.tsx:17-28`  | `DossierEngagementsTab`                     |
| elected_official | Header Export dialog label on subtype route           | `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:19-29`    | `DossierShell` -> `ExportDossierDialog`     |

## Findings Summary

| ID    | Bucket | Dossier type(s)  | Workflow                          | Finding                                                                                                                                                                                                                                                           |
| ----- | ------ | ---------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R7-01 | B      | country          | Header Export briefing pack       | The export edge function still reads stale contracts for positions, MOUs, documents, and commitments, and returns HTML even when the dialog advertises PDF/DOCX. Needs planned edge/data-contract work and live deploy verification.                              |
| R7-02 | A      | organization     | Tasks tab                         | Work-item priority rendering trusts raw values from linked rows, but UI/i18n only supports `low`, `medium`, `high`, `urgent`; generated intake priority still permits `critical` and `normal`, so deprecated rows can leak raw keys and miss urgent highlighting. |
| R7-03 | A      | forum, topic     | Audit tab                         | The shared tab nav presents Audit as a real tab, but forum/topic audit routes are placeholder text only and do not reach the existing audit hook, edge function, or DB. Hide/de-affordance until a dossier-scoped audit reader is planned.                        |
| R7-04 | B      | engagement       | List filter/search/load-more      | Engagement list filter pills are applied client-side after the infinite query. A filtered first page can show an empty state and suppress Load more even when later pages contain matches. Server-side grouped filters or a UX redesign are needed.               |
| R7-05 | A      | engagement       | List filter pills                 | The UI includes a `call` pill that no mapper/DB enum can produce, while `event` rows are mapped but no event pill is rendered. This is a safe filter affordance cleanup once R7-04 decides the server contract.                                                   |
| R7-06 | B      | working_group    | Tasks tab aggregation/counts      | `fetchWorkItems` hard-limits each source and reports the fetched array length as `total_count`; direct commitments can crowd out linked commitments, and the tab has no pagination/truncation state. Needs query/API design before unattended fix.                |
| R7-07 | A      | person           | Engagements tab content rendering | Relationship and event badges render raw enum strings even though localized `relationshipType.*` and `eventType.*` labels already exist in EN/AR.                                                                                                                 |
| R7-08 | A      | elected_official | Header Export dialog label        | The elected-official route passes `dossierType="elected_official"` into the export dialog, but `dossier-export` EN/AR type labels omit `type.elected_official`, so the dialog falls back to raw `elected_official`.                                               |

---

## Country

### Workflow: Header Export briefing pack

Trace:

| Layer           | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route           | Country detail renders `DossierShell` with `dossierType="country"` at `frontend/src/routes/_protected/dossiers/countries/$id.tsx:17-27`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Component       | `DossierShell` renders the Export button and mounts `ExportDossierDialog` at `frontend/src/components/dossier/DossierShell.tsx:220-239` and `:293-299`.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Hook/service    | The dialog calls `exportDossier(dossierId, config)` at `frontend/src/components/dossier/ExportDossierDialog.tsx:80-99`; `useDossierExport` posts `dossier_id` and config at `frontend/src/hooks/useDossierExport.ts:95-99`; the service POSTs `/functions/v1/dossier-export-pack` at `frontend/src/services/dossier-export.service.ts:61-70`.                                                                                                                                                                                                                                                                   |
| Edge function   | `dossier-export-pack` fetches the dossier and related data in `fetchDossierData` at `supabase/functions/dossier-export-pack/index.ts:925-1053`, then generates and uploads HTML at `:1207-1257`.                                                                                                                                                                                                                                                                                                                                                                                                                |
| DB tables/types | The edge reads `dossiers`, `dossier_relationships`, `positions`, `mous`, `work_item_dossiers`, `calendar_entries`, `key_contacts`, `audit_logs`, `documents`, and `commitments`. Current generated types show canonical `aa_commitments` at `frontend/src/types/database.types.ts:187-216`, `documents.related_entities` without `entity_type`/`entity_id` at `:8955-9011`, `mous.title`/`lifecycle_state` without `title_en`/`status`/`dossier_ids` at `:19505-19546`, and `positions` without `classification`/`dossier_ids` at `:22533-22566`. `position_dossier_links` is the link table at `:22094-22112`. |
| i18n            | Export labels live in `frontend/src/i18n/en/dossier-export.json:1-61` and `frontend/src/i18n/ar/dossier-export.json:1-61`. Format labels exist, but the edge does not honor PDF/DOCX output.                                                                                                                                                                                                                                                                                                                                                                                                                    |

Findings:

- **R7-01 [B] Export edge uses stale data contracts and ignores requested file format.** The UI advertises PDF and Word at `frontend/src/components/dossier/ExportDossierDialog.tsx:169-204`, but the edge always creates an HTML filename/content type at `supabase/functions/dossier-export-pack/index.ts:1207-1257`. The same edge queries stale columns/contracts: `positions.classification` and `positions.dossier_ids` at `:985-991`, `mous.title_en/status/dossier_ids` at `:993-999`, `documents.entity_type/entity_id` at `:1034-1040`, and legacy `commitments` at `:1043-1053` instead of canonical `aa_commitments`. This is not an unattended label fix; it needs an export data-source pass, live edge verification, and a real PDF/DOCX generation decision.

---

## Organization

### Workflow: Detail Tasks tab

Trace:

| Layer           | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route           | Organization Tasks tab lazy-loads `DossierWorkItemsTab` at `frontend/src/routes/_protected/dossiers/organizations/$id/tasks.tsx:17-28`.                                                                                                                                                                                                                                                                                                                                      |
| Component       | `DossierWorkItemsTab` queries `['dossier-tab', 'work_items', dossierId]` and calls `fetchDossierOverview({ include_sections: ['work_items'] })` at `frontend/src/components/dossier/tabs/DossierWorkItemsTab.tsx:22-30`.                                                                                                                                                                                                                                                     |
| Hook/service    | `fetchDossierOverview` delegates the work-items section to `fetchWorkItems`; the service reads `work_item_dossiers`, then `tasks`, `aa_commitments`, and `intake_tickets` at `frontend/src/services/dossier-overview.service.ts:594-775`.                                                                                                                                                                                                                                    |
| Edge/RPC        | No edge function/RPC is used for this tab; it is direct Supabase client reads from the frontend service.                                                                                                                                                                                                                                                                                                                                                                     |
| DB tables/types | `work_item_dossiers` links `task`, `commitment`, and `intake` rows to dossiers in `supabase/migrations/20260116500001_create_work_item_dossiers.sql:11-25`; generated `work_item_dossiers` types are at `frontend/src/types/database.types.ts:29592-29610`. `tasks.priority` uses `urgent_priority` at `:26768-26803`; `intake_tickets.priority` uses broader `priority_level` at `:15280-15320`; `priority_level` still includes `critical` and `normal` at `:39094-39100`. |
| i18n            | Work-item priority labels exist only for `low`, `medium`, `high`, and `urgent` in EN/AR at `frontend/src/i18n/en/dossier-overview.json:146-150` and `frontend/src/i18n/ar/dossier-overview.json:146-150`.                                                                                                                                                                                                                                                                    |

Findings:

- **R7-02 [A] Deprecated priority values can leak raw i18n keys and miss urgent highlighting.** `fetchWorkItems` maps intake priority directly with `priority: (i.priority || 'medium') as WorkItemPriority` at `frontend/src/services/dossier-overview.service.ts:723-752`, while `WorkItemsSection` renders `t(\`priority.${item.priority}\`)`at`frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx:143-145`and only treats`urgent`/`high`as urgent items at`frontend/src/services/dossier-overview.service.ts:766-775`. The normalization migration maps `critical -> urgent`and`normal -> medium`at`supabase/migrations/20251203000001_normalize_priority_terminology.sql:1-12,60-78`, but generated types still allow those values. Safe fix: add a small display/query normalization guard for `priority_level` values (`critical`to`urgent`, `normal`to`medium`) and keep `intake_tickets.urgency=critical` separate from work-item priority.

---

## Forum

### Workflow: Detail Audit tab

Trace:

| Layer            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route            | Forum Audit route is mounted at `frontend/src/routes/_protected/dossiers/forums/$id/audit.tsx:9-23`.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Component        | The shared `DossierTabNav` always includes `audit` in base tabs at `frontend/src/components/dossier/DossierTabNav.tsx:33-40` and links it at `:96-109`. The forum route renders only `tabs.audit` plus `emptyState.comingSoon` at `frontend/src/routes/_protected/dossiers/forums/$id/audit.tsx:13-23`.                                                                                                                                                                                                                                              |
| Hook/service     | No dossier audit hook is called by this route. The available audit hook would be `useAuditLogs` at `frontend/src/domains/audit/hooks/useAuditLogs.ts:27-54`, but it is not wired here.                                                                                                                                                                                                                                                                                                                                                               |
| Edge function/DB | No edge/DB call is reached by the forum audit tab. The standalone audit path would call `/audit-logs-viewer` at `frontend/src/domains/audit/repositories/audit.repository.ts:14-16` and read `audit_log` in `supabase/functions/audit-logs-viewer/index.ts:55-75`; generated audit types are split between `audit_log` and `audit_logs` at `frontend/src/types/database.types.ts:3105-3153`. That broader audit-table decision was already captured in the Round 5 audit report, so this Round 7 finding stays scoped to the dossier tab affordance. |
| i18n             | Audit tab labels are localized in EN/AR at `frontend/src/i18n/en/dossier-shell.json:2-12` and `frontend/src/i18n/ar/dossier-shell.json:2-12`; the placeholder uses the existing `dossier-shell` namespace.                                                                                                                                                                                                                                                                                                                                           |

Findings:

- **R7-03 [A] Forum Audit is a visible placeholder tab, not an audit workflow.** The nav presents Audit as a normal tab, but the route stops at placeholder text and never reaches a hook, edge function, or DB. Safe unattended options: hide the Audit tab for dossier types until it is real, or de-affordance the route copy so users do not interpret it as an available audit log. Do not auto-wire the existing global audit viewer here until the canonical audit trail/table decision is settled.

---

## Engagement

### Workflow: List filters/search/load-more

Trace:

| Layer           | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route           | `/dossiers/engagements` renders `EngagementsListPage` at `frontend/src/routes/_protected/dossiers/engagements/index.tsx:11-16`. The legacy `/engagements` route also renders the same page at `frontend/src/routes/_protected/engagements/index.tsx:9-14`.                                                                                                                                                                                                                      |
| Component       | `EngagementsListPage` keeps local `search` and `filter` state at `frontend/src/pages/engagements/EngagementsListPage.tsx:90-99`, maps backend engagement types to primitive filter types at `:34-52`, and applies the selected filter after flattening fetched pages at `:101-111`.                                                                                                                                                                                             |
| Hook/service    | `useEngagementsInfinite` accepts only `search` and `limit`, then calls `engagementsRepo.getEngagements({ page, limit, search })` at `frontend/src/hooks/useEngagementsInfinite.ts:21-46`; `getNextPageParam` depends on the unfiltered page length at `:47-52`. The repo can forward `engagement_type`, `engagement_category`, and `engagement_status`, but the list page never passes them at `frontend/src/domains/engagements/repositories/engagements.repository.ts:56-71`. |
| Edge/RPC        | The edge parses `engagement_type` and calls `search_engagements_advanced` at `supabase/functions/engagement-dossiers/index.ts:300-355`; its total count ignores filters at `:362-377`. The RPC supports an exact `p_engagement_type` filter at `supabase/migrations/20260503130000_seed_engagement_extensions_and_fix_search_rpc.sql:35-104`.                                                                                                                                   |
| DB tables/types | The canonical extension table is `engagement_dossiers`, not `engagements`, created at `supabase/migrations/20260110000006_create_engagement_dossiers.sql:18-32`; generated `engagement_dossiers` fields are at `frontend/src/types/database.types.ts:10521-10550`.                                                                                                                                                                                                              |
| i18n            | Filter/search/week labels exist in EN/AR at `frontend/src/i18n/en/engagements.json:18-30` and `frontend/src/i18n/ar/engagements.json:18-30`; generic empty/loading labels live in `frontend/src/i18n/en/list-pages.json:1-20` and `frontend/src/i18n/ar/list-pages.json:1-20`.                                                                                                                                                                                                  |

Findings:

- **R7-04 [B] Filter pills are client-side only and can suppress valid paginated results.** The selected filter is not part of the TanStack query key or repository params; it is applied only after already-fetched pages are flattened at `frontend/src/pages/engagements/EngagementsListPage.tsx:101-111`. If the first unfiltered page has no `travel` rows but later pages do, the component receives an empty filtered array and renders the empty state branch at `frontend/src/components/list-page/EngagementsList.tsx:121-127`, which also prevents the Load more row at `:179-199` from being shown. Fixing this correctly requires planning the server-side contract for grouped filters such as `meeting` and `travel`, because the RPC currently supports exact `engagement_type` values, not groups.

- **R7-05 [A] Filter affordances do not match reachable row types.** `EngagementRow['type']` includes `event` at `frontend/src/components/list-page/EngagementsList.tsx:9-19`, and the page maps `summit`/`forum_session` to `event` at `frontend/src/pages/engagements/EngagementsListPage.tsx:45-47`, but `FILTERS` renders only `all`, `meeting`, `call`, and `travel` at `frontend/src/components/list-page/EngagementsList.tsx:35-40`. Conversely, `call` is rendered but no mapper branch returns `call`, and `engagement_dossiers.engagement_type` has no `call` value in the table check at `supabase/migrations/20260110000006_create_engagement_dossiers.sql:22-32`. Safe fix after the R7-04 contract decision: remove or remap `call`, and add or expose the existing localized `event` label.

---

## Topic

### Workflow: Detail Audit tab

Trace:

| Layer            | Evidence                                                                                                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route            | Topic Audit route is mounted at `frontend/src/routes/_protected/dossiers/topics/$id/audit.tsx:9-23`.                                                                                                                                                                                                                 |
| Component        | The shared `DossierTabNav` includes and links `audit` for every dossier shell at `frontend/src/components/dossier/DossierTabNav.tsx:33-40,96-109`. The topic audit route renders only the localized audit title and coming-soon placeholder at `frontend/src/routes/_protected/dossiers/topics/$id/audit.tsx:13-23`. |
| Hook/service     | No dossier audit hook is called. The available global hook/edge path is the same as the Forum section, but not reached here.                                                                                                                                                                                         |
| Edge function/DB | No edge/DB call is reached by this topic audit route. The broader audit-table drift is already recorded in prior audit coverage, so this section only counts the visible dossier-tab placeholder.                                                                                                                    |
| i18n             | The route uses `dossier-shell` labels with EN/AR keys at `frontend/src/i18n/en/dossier-shell.json:2-12` and `frontend/src/i18n/ar/dossier-shell.json:2-12`.                                                                                                                                                          |

Findings:

- **R7-03 [A] Topic Audit is also a visible placeholder tab.** Same safe fix as Forum: hide/de-affordance the Audit tab for this route until there is a real dossier-scoped audit reader, instead of presenting the placeholder as a normal tab.

---

## Working Group

### Workflow: Detail Tasks tab aggregation/counts

Trace:

| Layer           | Evidence                                                                                                                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route           | Working-group Tasks tab lazy-loads `DossierWorkItemsTab` at `frontend/src/routes/_protected/dossiers/working_groups/$id/tasks.tsx:17-28`.                                                                                                                                                                                                                        |
| Component       | `DossierWorkItemsTab` calls `fetchDossierOverview` with `include_sections: ['work_items']` at `frontend/src/components/dossier/tabs/DossierWorkItemsTab.tsx:22-30`; `WorkItemsSection` displays `data.total_count`, status breakdown, urgent items, and source tabs at `frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx:360-435`. |
| Hook/service    | `fetchWorkItems(dossierId, limit = 50)` reads `work_item_dossiers`, then separately limits `tasks`, direct `aa_commitments`, linked `aa_commitments`, and intakes at `frontend/src/services/dossier-overview.service.ts:594-754`; it returns `total_count: allWorkItems.length` at `:766-775`.                                                                   |
| Edge/RPC        | No edge function/RPC is used for this tab; it is direct Supabase reads.                                                                                                                                                                                                                                                                                          |
| DB tables/types | Work item links are stored in `work_item_dossiers` with `task`, `commitment`, and `intake` item types at `supabase/migrations/20260116500001_create_work_item_dossiers.sql:11-25`; generated fields are at `frontend/src/types/database.types.ts:29592-29610`. Commitments use canonical `aa_commitments` at `frontend/src/types/database.types.ts:187-216`.     |
| i18n            | Work item tabs, empty states, source, status, and priority labels exist in `frontend/src/i18n/en/dossier-overview.json:131-178` and `frontend/src/i18n/ar/dossier-overview.json:131-178`.                                                                                                                                                                        |

Findings:

- **R7-06 [B] Tasks tab count and coverage are fetched-window counts, not full work-item totals.** The service hardcodes `limit = 50` at `frontend/src/services/dossier-overview.service.ts:594`, applies that limit per source at `:622`, `:675-689`, and `:723-729`, then reports `total_count: allWorkItems.length` at `:766-775`. Also, linked commitments are fetched only if direct commitments are fewer than the limit at `:683-690`, so a working group with 50 direct commitments can hide linked commitments from the tab. The UI has no pagination, "truncated" marker, or load-more path. This needs a planned query/API design with real counts or pagination before an unattended fix.

---

## Person

### Workflow: Detail Engagements tab content rendering

Trace:

| Layer           | Evidence                                                                                                                                                                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route           | Person Engagements route lazy-loads `DossierEngagementsTab` at `frontend/src/routes/_protected/dossiers/persons/$id/engagements.tsx:17-28`.                                                                                                                                                           |
| Component       | `DossierEngagementsTab` fetches related engagement dossiers plus past calendar events at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:35-47`, builds badge values from raw `relationship_type` and `event_type` at `:53-72`, and renders `entry.badge` directly at `:108-115`.     |
| Hook/service    | The tab calls `fetchDossierOverview` with `related_dossiers` and `calendar_events`; `fetchRelatedDossiers` reads `dossier_relationships` at `frontend/src/services/dossier-overview.service.ts:329-459`, and `fetchCalendarEvents` reads `calendar_events` at `:783-831`.                             |
| Edge/RPC        | No edge function/RPC is used for this tab; it is direct Supabase reads.                                                                                                                                                                                                                               |
| DB tables/types | Related engagement dossiers come from `dossier_relationships.relationship_type` into `RelatedDossier.relationship_type` at `frontend/src/types/dossier-overview.types.ts:42-69`. Calendar event types are modeled at `frontend/src/types/dossier-overview.types.ts:187-213`.                          |
| i18n            | Localized labels already exist for relationship types at `frontend/src/i18n/en/dossier-overview.json:64-73` and `frontend/src/i18n/ar/dossier-overview.json:64-73`, and event types at `frontend/src/i18n/en/dossier-overview.json:181-187` and `frontend/src/i18n/ar/dossier-overview.json:181-187`. |

Findings:

- **R7-07 [A] Engagements tab leaks raw enum badges.** The component imports only `useTranslation('dossier-shell')` at `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx:35-37`, but the needed labels are in `dossier-overview`. It renders raw `member_of`, `related_to`, `engagement`, etc. at `:112-115`. Safe fix: render dossier rows with `t('dossier-overview:relationshipType.${entry.badge}')` and event rows with `t('dossier-overview:eventType.${entry.badge}')`, using colon namespace form for cross-namespace lookups and preserving a fallback for unknown values.

---

## Elected Official

### Workflow: Header Export dialog label on subtype route

Trace:

| Layer            | Evidence                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route            | Elected-official detail passes `dossierType="elected_official"` to `DossierShell` at `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:23-29`; the file notes the DB record is `type='person'` at `:5-8`.                                                                                                                                                          |
| Component        | `DossierShell` passes the route prop to `ExportDossierDialog` as `dossierType={dossierType as DossierType}` at `frontend/src/components/dossier/DossierShell.tsx:293-299`; the dialog renders `t(\`type.${dossierType}\`, { defaultValue: dossierType })`at`frontend/src/components/dossier/ExportDossierDialog.tsx:127-132`.                                                       |
| Hook/service     | The export submit path is the same as country: dialog -> `useDossierExport` -> `/functions/v1/dossier-export-pack` at `frontend/src/components/dossier/ExportDossierDialog.tsx:80-99`, `frontend/src/hooks/useDossierExport.ts:95-99`, and `frontend/src/services/dossier-export.service.ts:61-70`. R7-01 covers the shared edge contract issue and is not repeated here.           |
| Edge function/DB | The shared export edge fetches by `dossier_id`; elected-official dossiers are stored as `type='person'` after `supabase/migrations/20260202000001_merge_elected_official_into_person.sql:189-204`, with `persons.person_subtype` and office fields in generated types at `frontend/src/types/database.types.ts:21180-21224`.                                                        |
| i18n             | `dossier-export` type labels include `country`, `organization`, `forum`, `engagement`, `topic`, `working_group`, and `person`, but not `elected_official`, in EN/AR at `frontend/src/i18n/en/dossier-export.json:53-61` and `frontend/src/i18n/ar/dossier-export.json:53-61`. The shared `DossierType` excludes `elected_official` at `frontend/src/services/dossier-api.ts:26-34`. |

Findings:

- **R7-08 [A] Elected-official export dialog falls back to a raw type string.** The route intentionally needs `elected_official` for routing, while storage is `person`. The export dialog receives that route type and looks up `type.elected_official`, which does not exist in either locale. Safe fix: add `dossier-export:type.elected_official` EN/AR labels or map route-only `elected_official` to the product label before rendering. Keep the actual export DB lookup by `dossier_id`; do not reintroduce `elected_official` as a stored dossier type.

---

## A-Bucket Fix List

These are safe unattended candidates because they are label, small guard, or fake-affordance cleanups. They do not require schema redesign, but they should still be reviewed normally.

1. **R7-02:** Add a display/query normalization helper for work-item priorities before rendering `WorkItemsSection`: `critical -> urgent`, `normal -> medium`, with unknown fallback. Do not map `intake_tickets.urgency=critical`; this is only for work-item priority display.

2. **R7-03:** Hide or de-affordance the visible Audit tab/route for forum and topic until a dossier-scoped audit reader exists. If hiding centrally, make it route/type aware so real future audit routes can opt back in.

3. **R7-05:** Align engagement filter pills with reachable row types. Remove/remap the dead `call` pill and expose the already-localized `event` label once the R7-04 server-filter decision is made.

4. **R7-07:** Localize `DossierEngagementsTab` badges using `dossier-overview:relationshipType.*` for related dossiers and `dossier-overview:eventType.*` for calendar rows. Use colon namespace form, not dotted namespace lookup strings.

5. **R7-08:** Add EN/AR `dossier-export:type.elected_official` or map route-only `elected_official` to an elected-official product label in `ExportDossierDialog`.

## B-Bucket Planning / Live-Verification Queue

1. **R7-01:** Rebuild `dossier-export-pack` around current generated contracts and canonical tables: `position_dossier_links`, `mous` signatory fields/state, `aa_commitments`, and the current `documents` model. Decide whether export produces real PDF/DOCX or honestly presents HTML.

2. **R7-04:** Move engagement list filters into the server query or redesign the filter UX. The current exact RPC filter cannot directly express grouped pills like `meeting` and `travel` without a mapping contract.

3. **R7-06:** Add a real work-items tab count/pagination contract, or make the current fetched-window limitation explicit in the UI. Verify live expectations for high-volume working-group dossiers before implementation.

## Verification Notes

- Source inspection only; no live Supabase reads or writes were attempted.
- No source files were modified.
- Known traps observed: country ISO fields are extension-table data, commitments use `aa_commitments`, engagement list uses `engagement_dossiers`, `calendar_entries` remains the canonical operational calendar while `calendar_events` is separate, work-item priority and intake urgency are distinct, i18n cross-namespace lookups should use colon namespace form, and elected-official storage remains `type='person'` with `person_subtype`.
