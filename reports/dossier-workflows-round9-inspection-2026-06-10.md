# Dossier Workflows Round 9 Inspection - 2026-06-10

Scope: static inspection of per-type overview-card data flow for React 19, TanStack Router/Query, Supabase edge functions, migrations, generated database types, and i18n. I read `reports/fanout-loop-state.json` and `reports/dossier-workflows-round8-inspection-2026-06-10.md` first, then avoided re-inspecting or re-reporting the already escalated B-bucket items listed there and in the prompt.

No source files were modified.

## Prior-Coverage Guard

Excluded from new findings in this report:

- Generic overview-card relationship/calendar source contracts already escalated from round 1.
- `key_contacts` schema drift from R6-02.
- `calendar_entries` versus `calendar_events` split from R6-04/R7-04.
- Work-item fetched-window/count contract from R7-06.
- Dossier overview cache-key behavior, which round 8 state records as fixed and current `useDossierOverview` confirms via `detailWithOptions`.
- Round 8 sidebar/quick-look/timeline findings.

## Findings Summary

| ID    | Class | Type(s)                                                                | Component(s)                                                              | Finding                                                                                                                                                                                                             |
| ----- | ----- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R9-01 | A     | country                                                                | `BilateralSummaryCard`                                                    | Numeric card values are rendered with `String(...)`, so Arabic renders Latin digits for relationship and MoU counts.                                                                                                |
| R9-02 | B     | organization, forum, topic, and any relationship-derived overview card | `MembershipStructureCard`, `ForumMetadataCard`, `ConnectedAnchorsCard`    | `fetchRelatedDossiers` logs Supabase relationship-query failures and returns empty arrays, so cards can show valid-looking zero/empty states for failed section data. This needs a section-error contract decision. |
| R9-03 | A     | engagement                                                             | engagement workspace `OverviewTab`                                        | Overview metrics render raw numbers and percent strings for days-in-stage, progress, and done/total counts; Arabic number formatting is not applied.                                                                |
| R9-04 | A     | working_group                                                          | `MemberListCard`                                                          | The overflow row is styled as a clickable "View all members" affordance but has no link, button, route, or handler.                                                                                                 |
| R9-05 | A     | person                                                                 | `SharedSummaryStatsCard`                                                  | Summary stat values are raw numbers, so Arabic renders Latin digits for relationship, work-item, event, and activity counts.                                                                                        |
| R9-06 | A     | elected_official                                                       | `ElectedOfficialOverviewTab` composition, via `ElectedOfficialOfficeCard` | Empty office data uses the list-level `list.empty` translation, and `term_number` renders as a raw number.                                                                                                          |

## Country

Selected card: `BilateralSummaryCard`.

Trace:

- Route mount: `frontend/src/routes/_protected/dossiers/countries/$id/overview.tsx:11-26` lazy-loads `CountryOverviewTab`.
- Composition: `frontend/src/pages/dossiers/CountryOverviewTab.tsx` renders `BilateralSummaryCard` with the country dossier id.
- Hook/sections: `frontend/src/pages/dossiers/overview-cards/BilateralSummaryCard.tsx:24-25` calls `useDossierOverview(dossierId, { includeSections: ['related_dossiers', 'documents', 'calendar_events'] })`.
- Query key: `frontend/src/hooks/useDossierOverview.ts:50` uses `dossierOverviewKeys.detailWithOptions(...)`; current state includes normalized options.
- Service queries:
  - `fetchRelatedDossiers` reads `dossier_relationships` in both directions at `frontend/src/services/dossier-overview.service.ts:329-365`.
  - `fetchDocuments` reads `position_dossier_links`, `mous`, and `briefs` at `frontend/src/services/dossier-overview.service.ts:468-506`.
  - `fetchCalendarEvents` reads `calendar_events` at `frontend/src/services/dossier-overview.service.ts:806-810`. The canonical `calendar_entries` operational-calendar split is already escalated in R6/R7 and is not re-reported here.
- DB tables:
  - Country extension: `countries`, created by `supabase/migrations/002_create_countries.sql:9` and `supabase/migrations/002_countries.sql:4`; generated type starts at `frontend/src/types/database.types.ts:6702`.
  - Core dossier: `dossiers`, created by `supabase/migrations/20251022000001_create_unified_dossiers.sql:10`; generated type starts at `frontend/src/types/database.types.ts:9612`.
  - Relationships: `dossier_relationships`, created by `supabase/migrations/20251022000003_create_relationships.sql:7`; generated type starts at `frontend/src/types/database.types.ts:9367`.
  - Calendar and document tables: `calendar_events` generated type starts at `frontend/src/types/database.types.ts:4815`; `mous` at `19505`; `briefs` at `4444`; `position_dossier_links` at `22094`.
- i18n: `frontend/src/i18n/en/dossier.json:1054-1174` and `frontend/src/i18n/ar/dossier.json:1054-1174` include the `dossier:overview.bilateral.*` keys used by colon-namespace calls.

Finding R9-01 (A): `BilateralSummaryCard` formats counts with `String(bilateralRelations.length)` and `String(mouCount)` at `frontend/src/pages/dossiers/overview-cards/BilateralSummaryCard.tsx:50-55`. Dates are locale-aware through date-fns, but the numeric values are not. This is safe to auto-fix with `Intl.NumberFormat(i18n.language).format(...)`.

## Organization

Selected card: `MembershipStructureCard`.

Trace:

- Route mount: `frontend/src/routes/_protected/dossiers/organizations/$id/overview.tsx:11-26` lazy-loads `OrganizationOverviewTab`.
- Composition: `frontend/src/pages/dossiers/OrganizationOverviewTab.tsx` renders `MembershipStructureCard`.
- Hook/sections: `frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx:24-25` calls `useDossierOverview` with `includeSections: ['related_dossiers']`.
- Service query: `fetchRelatedDossiers` reads active relationship rows in both directions and embeds `dossiers` at `frontend/src/services/dossier-overview.service.ts:329-365`.
- DB tables:
  - Core organization overview path is dossier-backed through `dossiers`; generated type starts at `frontend/src/types/database.types.ts:9612`.
  - Relationship graph is `dossier_relationships`, created at `supabase/migrations/20251022000003_create_relationships.sql:7`; generated type starts at `frontend/src/types/database.types.ts:9367`.
- i18n: `dossier:overview.membership.*` exists in both `frontend/src/i18n/en/dossier.json:1094-1102` and `frontend/src/i18n/ar/dossier.json:1094-1102`.

Finding R9-02 (B): relationship-query errors are swallowed in the shared service. `fetchRelatedDossiers` logs `outError || inError` and returns the empty section shape at `frontend/src/services/dossier-overview.service.ts:365`, while `MembershipStructureCard` only consumes `data`/`isLoading`. The UI can therefore show "No membership data available" for a failed relationship section. This is not a card-only bug; it needs a planned decision on whether an overview section failure should fail the whole `useDossierOverview` query or surface section-level errors for cards.

## Forum

Selected card: `ForumMetadataCard`.

Trace:

- Route mount: `frontend/src/routes/_protected/dossiers/forums/$id/overview.tsx:11-26` lazy-loads `ForumOverviewTab`.
- Composition: `frontend/src/pages/dossiers/ForumOverviewTab.tsx` renders `ForumMetadataCard`.
- Hook/sections: `frontend/src/pages/dossiers/overview-cards/ForumMetadataCard.tsx:29-30` calls `useDossierOverview` with `includeSections: ['related_dossiers']`.
- Service query: `fetchRelatedDossiers` reads `dossier_relationships` and embedded `dossiers`.
- DB tables:
  - Core forum overview path is dossier-backed through `dossiers`, generated type at `frontend/src/types/database.types.ts:9612`.
  - Relationship graph is `dossier_relationships`, generated type at `frontend/src/types/database.types.ts:9367`.
- i18n: `dossier:overview.forum.*` exists in both `frontend/src/i18n/en/dossier.json:1117-1123` and `frontend/src/i18n/ar/dossier.json:1117-1123`.

Finding: no new forum-specific defect beyond R9-02. Prior forum metadata/source-model concerns are already covered by earlier B-bucket reports and are intentionally not repeated here.

## Engagement

Selected component: engagement workspace `OverviewTab`.

Trace:

- Dossier route bridge: `frontend/src/routes/_protected/dossiers/engagements/$id.tsx` redirects engagement dossiers to the engagement workspace.
- Workspace mount: `frontend/src/routes/_protected/engagements/$engagementId/overview.tsx:10-21` lazy-loads `frontend/src/pages/engagements/workspace/OverviewTab.tsx`.
- Hooks:
  - `useEngagement(engagementId)` at `frontend/src/pages/engagements/workspace/OverviewTab.tsx:108`.
  - `useEngagementParticipants(engagementId)` at `frontend/src/pages/engagements/workspace/OverviewTab.tsx:109-110`.
  - `useEngagementKanban(engagementId)` at `frontend/src/pages/engagements/workspace/OverviewTab.tsx:111`.
  - `useLifecycleHistory(engagementId)` at `frontend/src/pages/engagements/workspace/OverviewTab.tsx:112`.
- Repository/API:
  - `getEngagement` calls `/engagement-dossiers/:id` at `frontend/src/domains/engagements/repositories/engagements.repository.ts:77-78`.
  - `getParticipants` calls `/engagement-dossiers/:id/participants` at `frontend/src/domains/engagements/repositories/engagements.repository.ts:112-116`.
  - `getEngagementKanban` calls `/engagements-kanban-get` at `frontend/src/domains/engagements/repositories/engagements.repository.ts:206-211`; existing backend/table contract concerns for this path were already escalated and are not repeated.
  - `getLifecycleHistory` calls `/engagement-dossiers/:id/lifecycle` at `frontend/src/domains/engagements/repositories/engagements.repository.ts:412-416`.
- Supabase functions:
  - `supabase/functions/engagement-dossiers/index.ts:384` handles detail reads.
  - `supabase/functions/engagement-dossiers/index.ts:661-736` handles participants.
  - `supabase/functions/engagement-dossiers/index.ts:961` handles lifecycle history.
  - `supabase/functions/engagements-kanban-get/index.ts` handles kanban stats.
- DB tables:
  - Engagement extension: `engagement_dossiers`, created at `supabase/migrations/20260110000006_create_engagement_dossiers.sql:18`; generated type starts at `frontend/src/types/database.types.ts:10521`.
  - Participants: `engagement_participants`, created at `supabase/migrations/20260110000006_create_engagement_dossiers.sql:103`; generated type starts at `frontend/src/types/database.types.ts:10836`.
- i18n: `workspace:overview.*` and `workspace:actions.*` exist in `frontend/src/i18n/en/workspace.json:21-68` and `frontend/src/i18n/ar/workspace.json:25-72`.

Finding R9-03 (A): metric values are not locale-aware. `daysInStage`, `stats.progressPercentage`, and `stats.done}/{stats.total` render directly at `frontend/src/pages/engagements/workspace/OverviewTab.tsx:171-191`. This is safe to auto-fix with `Intl.NumberFormat(i18n.language)` and a localized percent formatter.

## Topic

Selected card: `ConnectedAnchorsCard`.

Trace:

- Route mount: `frontend/src/routes/_protected/dossiers/topics/$id/overview.tsx:11-26` lazy-loads `TopicOverviewTab`.
- Composition: `frontend/src/pages/dossiers/TopicOverviewTab.tsx` renders `ConnectedAnchorsCard`.
- Hook/sections: `frontend/src/pages/dossiers/overview-cards/ConnectedAnchorsCard.tsx:42-44` calls `useDossierOverview` with `includeSections: ['related_dossiers']`.
- Service query: `fetchRelatedDossiers` reads `dossier_relationships` and embedded `dossiers`.
- DB tables:
  - Core topic overview path is dossier-backed through `dossiers`, generated type at `frontend/src/types/database.types.ts:9612`.
  - Relationship graph is `dossier_relationships`, generated type at `frontend/src/types/database.types.ts:9367`.
- i18n: `dossier:overview.anchors.*` exists in both `frontend/src/i18n/en/dossier.json:1138-1142` and `frontend/src/i18n/ar/dossier.json:1138-1142`.
- Routing affordance: individual anchor links build dossier-type route segments in `frontend/src/pages/dossiers/overview-cards/ConnectedAnchorsCard.tsx:85-103`; the "View all in sidebar" text at `:107-112` is static, not styled as a fake button.

Finding: no topic-specific new defect beyond R9-02. Prior topic/position-contract issues are not repeated.

## Working Group

Selected card: `MemberListCard`.

Trace:

- Route mount: `frontend/src/routes/_protected/dossiers/working_groups/$id/overview.tsx:11-26` lazy-loads `WorkingGroupOverviewTab`.
- Composition: `frontend/src/pages/dossiers/WorkingGroupOverviewTab.tsx` renders `MemberListCard`.
- Hook/sections: `frontend/src/pages/dossiers/overview-cards/MemberListCard.tsx:30-31` calls `useDossierOverview` with `includeSections: ['related_dossiers']`.
- Service query: `fetchRelatedDossiers` reads `dossier_relationships`; the previous working-group entity-table source-contract finding is already escalated and is not repeated.
- DB tables:
  - Dedicated working-group tables exist: `working_group_members` at `supabase/migrations/20260110000006_working_groups_entity.sql:37`, `working_group_deliverables` at `:90`, and `working_group_meetings` at `:146`.
  - Generated types start at `frontend/src/types/database.types.ts:30743`, `30445`, and `30558` respectively.
  - The inspected card currently consumes relationship graph data from `dossier_relationships`, generated type at `frontend/src/types/database.types.ts:9367`.
- i18n: `dossier:overview.members.*` exists in both `frontend/src/i18n/en/dossier.json:1143-1149` and `frontend/src/i18n/ar/dossier.json:1143-1149`.

Finding R9-04 (A): the overflow line is a fake affordance. `MemberListCard` renders "View all {{count}} members" as a `<p>` with `text-primary cursor-pointer hover:underline` at `frontend/src/pages/dossiers/overview-cards/MemberListCard.tsx:90-96`, but it has no route, link, button role, or click handler. Safe fix: remove interactive styling and present it as static helper/count text until a real members destination exists.

## Person

Selected card: `SharedSummaryStatsCard`.

Trace:

- Route mount: `frontend/src/routes/_protected/dossiers/persons/$id/overview.tsx:11-26` lazy-loads `PersonOverviewTab`.
- Composition: `frontend/src/pages/dossiers/PersonOverviewTab.tsx` renders `SharedSummaryStatsCard`.
- Hook/sections: `frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx:33-35` calls `useDossierOverview` with `includeSections: ['related_dossiers', 'work_items', 'calendar_events', 'activity_timeline']`.
- Service queries:
  - Relationships: `fetchRelatedDossiers`, backed by `dossier_relationships`.
  - Work items: current overview service uses `aa_commitments`; the known fetched-window/count finding remains R7-06 and is not repeated.
  - Calendar/events and activity timeline are read through the shared overview service.
- DB tables:
  - Persons are backed by `persons`, generated type starts at `frontend/src/types/database.types.ts:21167`.
  - Elected officials are subtype persons, but this section is the regular person route/card.
  - `aa_commitments` generated type starts at `frontend/src/types/database.types.ts:187`; `calendar_events` at `4815`; `dossier_relationships` at `9367`.
- i18n: `dossier:overview.summary.*`, `dossier:overview.stats.*`, and `dossier:overview.noData` exist in both `frontend/src/i18n/en/dossier.json:1054-1064` and `frontend/src/i18n/ar/dossier.json:1054-1064`.

Finding R9-05 (A): summary stat values render raw numbers. `SharedSummaryStatsCard` builds numeric `value` fields and renders them directly at `frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx:37-56` and `:96`. Arabic users will see Latin digits. Safe fix: format all four stat values with `Intl.NumberFormat(i18n.language)`.

## Elected Official

Selected component: `ElectedOfficialOverviewTab` composition, with the office card as the rendered child under inspection.

Trace:

- Route mount: `frontend/src/routes/_protected/dossiers/elected-officials/$id/overview.tsx:11-26` lazy-loads `ElectedOfficialOverviewTab`.
- Composition: `frontend/src/pages/dossiers/ElectedOfficialOverviewTab.tsx` renders elected-official office and committee overview cards.
- Hook: `frontend/src/pages/dossiers/overview-cards/ElectedOfficialOfficeCard.tsx:28` calls `useElectedOfficial(dossierId)`.
- API: `frontend/src/domains/elected-officials/hooks/useElectedOfficials.ts:66-77` calls `/api/elected-officials/:id` and unwraps `{ data }`.
- Backend: `backend/src/api/elected-officials.ts:174` defines `GET /api/elected-officials/:id`.
- DB tables:
  - Current storage model is `persons` with `person_subtype = 'elected_official'`.
  - `supabase/migrations/20260202000001_merge_elected_official_into_person.sql:14-38` adds `person_subtype` and `term_number`.
  - Generated `persons` type starts at `frontend/src/types/database.types.ts:21167`.
- i18n:
  - `frontend/src/i18n/en/elected-officials.json:25-27` and `frontend/src/i18n/ar/elected-officials.json:25-27` include `detail.officeInfo`.
  - `frontend/src/i18n/en/elected-officials.json:18` and `frontend/src/i18n/ar/elected-officials.json:18` include `columns.termNumber`.
  - `frontend/src/i18n/en/elected-officials.json:4` and `frontend/src/i18n/ar/elected-officials.json:4` include `list.empty`, but that is list-level copy.

Finding R9-06 (A): `ElectedOfficialOfficeCard` uses `t('list.empty', { defaultValue: 'No office data available' })` at `frontend/src/pages/dossiers/overview-cards/ElectedOfficialOfficeCard.tsx:108`. Since `list.empty` exists in both locales, the office card renders list-level empty copy rather than office-specific empty copy. The same card renders `official.term_number` directly at `frontend/src/pages/dossiers/overview-cards/ElectedOfficialOfficeCard.tsx:118-123`. Safe fix: add a dedicated office empty-state key under `detail` or `office`, and format `term_number` with `Intl.NumberFormat(i18n.language)`.

## Design, RTL, and i18n Sweep

- No raw hex colors, obvious Tailwind color literals, card-shadow literals, or physical RTL spacing classes were found in the inspected card/workspace files with the search pattern for `#...`, `shadow`, `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`, and common literal Tailwind color prefixes.
- The inspected dossier card i18n keys exist in both English and Arabic JSON files. The elected-official empty-state issue is not a missing key; it is the wrong existing key.
- Date rendering in the inspected dossier cards uses locale-aware helpers where present. The remaining safe issues are number formatting.

## A-Bucket Fix List

1. `BilateralSummaryCard`: introduce a local number formatter from `i18n.language` and format relationship/MoU counts before rendering.
2. Engagement workspace `OverviewTab`: format days-in-stage, progress percentage, and done/total counts with locale-aware number/percent formatting.
3. `MemberListCard`: remove interactive styling from the overflow "View all members" row until it is wired to a real route/action.
4. `SharedSummaryStatsCard`: format all summary stat values with `Intl.NumberFormat(i18n.language)`.
5. `ElectedOfficialOfficeCard`: add/use an office-specific empty-state i18n key in `elected-officials.json` for en/ar, and format `term_number`.

## B-Bucket Planning Item

R9-02 needs a shared overview-section error contract. The implementation should decide whether subquery failures in `fetchRelatedDossiers`, `fetchDocuments`, `fetchCalendarEvents`, and similar section fetchers should:

1. Throw and fail the whole `useDossierOverview` query.
2. Return partial data plus section-level error metadata for cards to render.
3. Continue logging only, but expose an explicit "unknown" state so cards do not present failures as trustworthy zero counts.

This is classified as B because it affects shared service behavior and multiple card contracts rather than one isolated presentational component.
