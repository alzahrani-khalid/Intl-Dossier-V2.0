# Dossier Workflows Round 8 Inspection - 2026-06-10

Scope: React 19 + TanStack Router/Query + Supabase dossier workflows in `frontend/src`, `supabase/functions`, and `supabase/migrations`.

Method: static end-to-end trace only. No source files were modified. No live DB calls were executed.

Prior coverage guard: this pass started from `reports/fanout-loop-state.json` and `reports/dossier-workflows-round7-inspection-2026-06-10.md`. I avoided the round 7 B-bucket items (`R7-01` export pack format/contract drift, `R7-04` engagement list client-side filters, `R7-06` work-item hard-limit/count), the round 6 tab findings, and previously escalated dossier-type B-bucket items such as forum session model split, working-group member/deliverable model drift, engagement after-action legacy table drift, country list engagement counts, and organization MoU/list-count findings.

## Findings Summary

| ID    | Class | Dossier type(s)  | Workflow inspected                                           | Finding                                                                                                                        |
| ----- | ----- | ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| R8-01 | A     | country          | Dashboard recent dossier -> quick-look drawer KPI strip      | Documents KPI is guaranteed to render `0` when the drawer query omits the `documents` section.                                 |
| R8-02 | A     | topic            | Topic overview cards / analytics card                        | `useDossierOverview` cache key ignores section options, so partial overview responses can satisfy analytics/summary consumers. |
| R8-03 | A     | organization     | Organization Docs tab                                        | Document card view/download icon buttons are rendered without any action or accessible label.                                  |
| R8-04 | B     | engagement       | Drawer "Log engagement" CTA -> create wizard                 | CTA opens a blank engagement wizard and drops the source dossier context; defining the link/prefill contract needs planning.   |
| R8-05 | A     | forum            | DossierShell relationships action/sidebar                    | Relationship sidebar renders raw relationship/tier labels and English remove buttons in Arabic UI.                             |
| R8-06 | A     | working_group    | DossierShell relationships sidebar collapsed/expanded states | Collapsed relationship strip and tier headers are not localized and the collapsed icon buttons have no accessible name.        |
| R8-07 | A     | person           | Mobile DossierShell relationships trigger                    | Icon-only mobile relationship trigger lacks `aria-label` below the `sm` breakpoint.                                            |
| R8-08 | A     | elected_official | Elected-official Timeline tab                                | Timeline status badges can leak raw DB enum values not present in `dossier-context` EN/AR.                                     |

## Country - Quick-Look Drawer KPI Strip

Selected still-uncovered workflow: dossier header stats/KPI zone rendering through the quick-look drawer for a country dossier.

Trace:

- Route/user entry: `frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx:52-63` renders recent dossier rows and calls `openDossier({ id: d.id, type: d.type })`.
- Search-param shell: `frontend/src/hooks/useDossierDrawer.ts:37-48` writes `dossier` and `dossierType`; `_protected` validates `country` as a drawer dossier type at `frontend/src/routes/_protected.tsx:14-38` and mounts `DossierDrawer` at `frontend/src/routes/_protected.tsx:94-99`.
- Components/hooks: `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx:42-48` calls `useDossierOverview` with `includeSections: ['work_items', 'calendar_events', 'activity_timeline']`, then renders `MiniKpiStrip` at `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx:101-109`.
- KPI mapping: `frontend/src/components/dossier/DossierDrawer/MiniKpiStrip.tsx:29-38` reads `overview.stats.documents_count`.
- Overview service: `frontend/src/services/dossier-overview.service.ts:995-1003` returns an empty documents section when `documents` is not requested; `frontend/src/services/dossier-overview.service.ts:1036-1044` calculates stats from those section objects.
- DB/types: when documents are included, `fetchDocuments` reads `position_dossier_links`, `mous`, and `briefs` at `frontend/src/services/dossier-overview.service.ts:466-588`. Country extension data itself remains on `countries`, with `iso_code_2` generated at `frontend/src/types/database.types.ts:6702-6715`.
- i18n: KPI labels exist in `frontend/src/i18n/en/dossier-drawer.json:23-28` and `frontend/src/i18n/ar/dossier-drawer.json:23-28`.

Finding:

### R8-01 [A] Documents KPI is always zero in the drawer

The drawer asks for work items, calendar events, and activity only (`DossierDrawer.tsx:42-48`) but still renders the documents KPI (`MiniKpiStrip.tsx:29-38`). The overview service turns any unrequested section into an empty section (`dossier-overview.service.ts:995-1003`), so `documents_count` becomes `0` even when the dossier has linked positions, MoUs, or briefs.

Safe fix: either include `documents` in the drawer `includeSections` array, or hide/defer the documents KPI until the documents section is loaded. This is a small data-contract fix; no schema decision is needed.

## Organization - Docs Tab

Selected still-uncovered workflow: organization Docs tab at depth.

Trace:

- Route: `frontend/src/routes/_protected/dossiers/organizations/$id/docs.tsx:17-27` lazy-loads `DossierDocumentsTab`.
- Query/component: `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:26-30` fetches `fetchDossierOverview({ dossier_id, include_sections: ['documents'] })` under a dedicated tab key and passes `data.documents` to `DocumentsSection` at `frontend/src/components/dossier/tabs/DossierDocumentsTab.tsx:45-52`.
- Documents service: `frontend/src/services/dossier-overview.service.ts:466-588` composes positions from `position_dossier_links`, MoUs from `mous`, briefs from `briefs`, and an empty direct attachments array.
- Cards/actions: `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx:113-121` renders download and view icon buttons.
- i18n: document type/status/tab/empty labels exist in `frontend/src/i18n/en/dossier-overview.json:92-128` and `frontend/src/i18n/ar/dossier-overview.json:92-128`.

Finding:

### R8-03 [A] Document view/download buttons are inert

`DocumentsSection` renders a download button when `document.file_path` is present and always renders a view button (`DocumentsSection.tsx:113-121`), but neither button has `onClick`, a link target, or an accessible label. This is not the previously escalated document-upload or attachment-model issue; it is a local rendered-affordance bug in the docs tab.

Safe fix: hide the view button until a preview/detail target exists, and wire download only for rows with a real `file_path`. Add localized `aria-label`s for both controls.

## Forum - Relationships Header/Sidebar

Selected still-uncovered workflow: header relationships action and sidebar rendering for a forum dossier.

Trace:

- Route: `frontend/src/routes/_protected/dossiers/forums/$id.tsx:12-22` mounts `DossierShell` with `dossierType="forum"`.
- Shell action: `frontend/src/components/dossier/DossierShell.tsx:252-261` renders the mobile relationships button; `frontend/src/components/dossier/DossierShell.tsx:273-281` mounts `RelationshipSidebar`.
- Hook/service/edge: `frontend/src/components/dossier/RelationshipSidebar.tsx:157-161` calls `useRelationshipsForDossier`; `frontend/src/domains/relationships/hooks/useRelationships.ts:74-87` calls the repository; `frontend/src/services/relationship-api.ts:351-370` fetches `/functions/v1/dossier-relationships/dossier/:dossierId`; `supabase/functions/dossier-relationships/index.ts:169-228` reads `dossier_relationships` and embeds source/target `dossiers`.
- DB/types: generated `dossier_relationships` row fields are at `frontend/src/types/database.types.ts:9367-9412`.
- i18n: sidebar shell keys exist in `frontend/src/i18n/en/dossier-shell.json:14-32` and `frontend/src/i18n/ar/dossier-shell.json:14-32`.

Finding:

### R8-05 [A] Relationship sidebar leaks raw labels and English action text

The sidebar has localized shell labels, but it renders tier labels from the English-only `TIER_LABELS` constant (`RelationshipSidebar.tsx:108-113`, displayed at `RelationshipSidebar.tsx:359-360`) and relationship types via `item.relationshipType.replace(/_/g, ' ')` (`RelationshipSidebar.tsx:386-389`). Remove controls also use raw English: `aria-label={`Remove ${displayName}`}` at `RelationshipSidebar.tsx:392-397`, and the confirmation buttons are literal `Cancel` / `Remove` at `RelationshipSidebar.tsx:523-540`.

Safe fix: add `dossier-shell:sidebar.tier.*`, `dossier-shell:sidebar.relationshipType.*`, `dossier-shell:sidebar.cancel`, and `dossier-shell:sidebar.remove` EN/AR keys, then use colon namespace lookups. This is a contained i18n/a11y fix.

## Engagement - Drawer Log Engagement CTA

Selected still-uncovered workflow: quick-look drawer "Log engagement" header action for an engagement dossier.

Trace:

- Entry/drawer route: recent dossier rows open the URL-driven drawer at `frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx:52-63`; `_protected` allows `engagement` at `frontend/src/routes/_protected.tsx:14-38` and mounts the drawer at `frontend/src/routes/_protected.tsx:94-99`.
- CTA component: `frontend/src/components/dossier/DossierDrawer/DrawerHead.tsx:101-108` renders `DrawerCtaRow`; `frontend/src/components/dossier/DossierDrawer/DrawerCtaRow.tsx:37-40` navigates to `/dossiers/engagements/create`.
- Create route: `frontend/src/routes/_protected/dossiers/engagements/create.tsx:22-45` creates a blank `useCreateDossierWizard(engagementWizardConfig)` instance; it does not validate or read source dossier search params.
- Create data path: `frontend/src/components/dossier/wizard/config/engagement.config.ts:65-83` maps extension data and inserts `engagement_participants`; `supabase/functions/dossiers-create/index.ts:207-226` inserts `dossiers`, and `supabase/functions/dossiers-create/index.ts:293-320` inserts the engagement extension into `engagement_dossiers`.
- DB/types: canonical engagement extension fields are generated at `frontend/src/types/database.types.ts:10521-10550`.
- i18n: drawer CTA labels exist in `frontend/src/i18n/en/dossier-drawer.json:3-10` and `frontend/src/i18n/ar/dossier-drawer.json:3-10`.

Finding:

### R8-04 [B] "Log engagement" drops source dossier context

The CTA is shown inside a specific dossier drawer, but it opens the engagement wizard with no query/search state and no prefilled participant/source relationship (`DrawerCtaRow.tsx:37-40`, `create.tsx:26-45`). The source file explicitly notes that prefill is deferred (`DrawerCtaRow.tsx:37-38`). For an analyst, "Log engagement" from a dossier reads as a context-aware action, but the created engagement can be saved without linking back to the source dossier unless the user manually reselects participants.

Why B: fixing this cleanly needs a product/data-contract decision: whether the source dossier becomes a participant, host country/organization, related dossier edge, or a wizard default only. Once that contract is chosen, implementation is likely small, but unattended auto-fix would risk writing the wrong relationship semantics.

## Topic - Overview Analytics Cards

Selected still-uncovered workflow: topic overview card/KPI zone, specifically the analytics card.

Trace:

- Route: `frontend/src/routes/_protected/dossiers/topics/$id/overview.tsx:17-27` lazy-loads `TopicOverviewTab`.
- Component: `frontend/src/pages/dossiers/TopicOverviewTab.tsx:25-34` renders `SharedSummaryStatsCard` and `DossierAnalyticsCard`.
- Analytics hook: `frontend/src/components/analytics/DossierAnalyticsCard.tsx:37-44` calls `useAnalyticsForDossier`; `frontend/src/domains/analytics/hooks/useAnalyticsForDossier.ts:160-168` calls `useDossierOverview` with `includeSections: ['related_dossiers', 'work_items', 'calendar_events', 'activity_timeline']`.
- Shared stats card: `frontend/src/pages/dossiers/overview-cards/SharedSummaryStatsCard.tsx:33-56` depends on the same selected overview sections.
- Query key: `frontend/src/hooks/useDossierOverview.ts:49-64` stores all overview requests under `dossierOverviewKeys.detail(dossierId)` only; the key factory is `['dossier-overview', 'detail', dossierId]` at `frontend/src/services/dossier-overview.service.ts:1117-1122`.
- DB path: the requested sections are resolved by `fetchDossierOverview` at `frontend/src/services/dossier-overview.service.ts:945-1055`.
- i18n: analytics labels exist in `frontend/src/i18n/en/dossier.json:1173-1188` and `frontend/src/i18n/ar/dossier.json:1173-1188`.

Finding:

### R8-02 [A] Overview cache key ignores include options

`useDossierOverview` builds the request with `includeSections`, limits, and calendar windows (`useDossierOverview.ts:54-61`) but keys the query only by dossier id (`useDossierOverview.ts:49-50`). A drawer request, a docs-tab request, and a topic overview/analytics request can therefore reuse each other's partial responses for the same dossier during the normal stale window. That can make topic analytics and summary cards show zero/empty values even when the corresponding data exists.

Safe fix: include a normalized options object in `dossierOverviewKeys.detail(...)`, or add separate key factories for partial consumers such as drawer/docs/analytics.

## Working Group - Relationships Sidebar States

Selected still-uncovered workflow: working-group header relationships sidebar, including collapsed state.

Trace:

- Route: `frontend/src/routes/_protected/dossiers/working_groups/$id.tsx:12-22` mounts `DossierShell` with `dossierType="working_group"`.
- Shell/sidebar: `frontend/src/components/dossier/DossierShell.tsx:273-281` mounts `RelationshipSidebar`.
- Data path: same relationship hook/service/edge path as the forum section: `RelationshipSidebar.tsx:157-161` -> `useRelationshipsForDossier` -> `relationship-api.ts:351-370` -> `supabase/functions/dossier-relationships/index.ts:169-228` -> `dossier_relationships`.
- Collapsed state: `frontend/src/components/dossier/RelationshipSidebar.tsx:418-441` renders type-count icon buttons when the sidebar is collapsed.
- DB/types: `dossier_relationships` generated fields are at `frontend/src/types/database.types.ts:9367-9412`.
- i18n: `dossier-shell` has generic sidebar keys but no tier/type-count labels at `frontend/src/i18n/en/dossier-shell.json:22-32` and `frontend/src/i18n/ar/dossier-shell.json:22-32`.

Finding:

### R8-06 [A] Collapsed relationship strip is not localized or screen-reader named

Collapsed icon buttons at `RelationshipSidebar.tsx:426-437` have no `aria-label`, and their tooltip text is raw `type.replace(/_/g, ' ')` (`RelationshipSidebar.tsx:439-441`). The same component also displays English-only tier headers through `TIER_LABELS` (`RelationshipSidebar.tsx:108-113`, `RelationshipSidebar.tsx:359-360`). This is a shared component defect, traced here through the working-group route; it is not the earlier working-group members/deliverables schema issue.

Safe fix: add localized dossier type/count labels and `aria-label`s for collapsed buttons, reusing the same `dossier-shell` namespace as the sidebar.

## Person - Mobile Relationships Trigger

Selected still-uncovered workflow: person dossier mobile header relationships action.

Trace:

- Route: `frontend/src/routes/_protected/dossiers/persons/$id.tsx:12-22` mounts `DossierShell` with `dossierType="person"`.
- Component: `frontend/src/components/dossier/DossierShell.tsx:252-261` renders a `lg:hidden` relationships trigger.
- Mobile sidebar: `frontend/src/components/dossier/DossierShell.tsx:273-281` passes `mobileOpen` into `RelationshipSidebar`; `frontend/src/components/dossier/RelationshipSidebar.tsx:490-506` renders the bottom sheet.
- Data path: `RelationshipSidebar.tsx:157-161` -> `useRelationshipsForDossier` -> `relationship-api.ts:351-370` -> `supabase/functions/dossier-relationships/index.ts:169-228` -> `dossier_relationships`.
- DB/types: person extension data is on `persons`, with `person_subtype` generated at `frontend/src/types/database.types.ts:21167-21215`; relationships are in `dossier_relationships` at `frontend/src/types/database.types.ts:9367-9412`.
- i18n: `header.relationships` exists in both `frontend/src/i18n/en/dossier-shell.json:14-20` and `frontend/src/i18n/ar/dossier-shell.json:14-20`.

Finding:

### R8-07 [A] Mobile relationships trigger lacks an accessible name

At mobile widths below `sm`, the trigger shows only the `Link2` icon because the text span is `hidden sm:inline` (`DossierShell.tsx:253-261`). The button has no `aria-label`, so the accessible name can collapse to an unlabeled icon button.

Safe fix: add `aria-label={t('header.relationships')}` to the button. This is a one-line a11y/i18n fix.

## Elected Official - Timeline Tab

Selected still-uncovered workflow: elected-official Timeline tab content.

Trace:

- Route: `frontend/src/routes/_protected/dossiers/elected-officials/$id/timeline.tsx:17-27` lazy-loads `DossierActivityTimeline`.
- Component/hook: `frontend/src/components/dossier/DossierActivityTimeline.tsx:62-87` calls `useDossierActivityTimeline`; the hook is re-exported from `frontend/src/hooks/useDossierActivityTimeline.ts:1-12` and implemented at `frontend/src/domains/dossiers/hooks/useDossierActivityTimeline.ts:75-113`.
- Edge function: `frontend/src/domains/dossiers/hooks/useDossierActivityTimeline.ts:96-100` invokes `dossier-activity-timeline`; `supabase/functions/dossier-activity-timeline/index.ts:150-184` reads `dossier_activity_timeline`; `supabase/functions/dossier-activity-timeline/index.ts:212-228` returns `status` and `priority`.
- DB/migration: the current view is defined at `supabase/migrations/20260608120000_fix_dossier_activity_timeline_aa_commitments.sql:19-73`, sourcing statuses from `tasks`, canonical `aa_commitments`, and `intake_tickets`. Elected officials are stored through `persons.person_subtype`, generated at `frontend/src/types/database.types.ts:21167-21215`.
- Enums: `aa_commitment_status` includes `overdue` at `frontend/src/types/database.types.ts:38310-38315`; `task_status` values are at `frontend/src/types/database.types.ts:39234-39239`; `ticket_status` includes `draft`, `submitted`, `triaged`, `assigned`, `converted`, and `merged` at `frontend/src/types/database.types.ts:39280-39288`.
- UI/i18n: `ActivityTimelineItem` renders `t(\`timeline.status.${activity.status}\`, activity.status)` and `t(\`timeline.priority.${activity.priority}\`, activity.priority)`at`frontend/src/components/dossier/ActivityTimelineItem.tsx:200-217`. EN/AR status keys exist at `frontend/src/i18n/en/dossier-context.json:65-82`and`frontend/src/i18n/ar/dossier-context.json:65-82`.

Finding:

### R8-08 [A] Timeline status i18n does not cover all returned DB statuses

The timeline edge can return intake ticket statuses such as `draft`, `submitted`, `triaged`, `assigned`, `converted`, and `merged` from the DB view (`database.types.ts:39280-39288`), and commitment status can return `overdue` (`database.types.ts:38310-38315`). The `dossier-context` status dictionary only covers `pending`, `in_progress`, `todo`, `review`, `completed`, `done`, `cancelled`, `open`, and `closed` (`dossier-context.json:65-75`). Missing statuses fall back to raw enum strings in the timeline badge (`ActivityTimelineItem.tsx:205-210`), including Arabic UI.

Safe fix: add EN/AR `timeline.status` keys for the missing status values returned by `task_status`, `aa_commitment_status`, and `ticket_status`. Priority already includes the known `critical`/`urgent` split at `dossier-context.json:76-82`.

## A-Bucket Fix List

1. Add `documents` to the quick-look drawer overview query, or hide the documents KPI until the documents section is loaded. Files: `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx`, potentially `MiniKpiStrip.tsx`.
2. Make `useDossierOverview` query keys include normalized request options, or introduce separate keys for partial consumers. Files: `frontend/src/hooks/useDossierOverview.ts`, `frontend/src/services/dossier-overview.service.ts`.
3. Remove or wire `DocumentsSection` view/download icon buttons and add localized `aria-label`s. File: `frontend/src/components/dossier/dossier-overview/sections/DocumentsSection.tsx`; namespaces: `dossier-overview` EN/AR.
4. Localize relationship sidebar tier labels, relationship type labels, remove/cancel button text, and removal aria labels. Files: `frontend/src/components/dossier/RelationshipSidebar.tsx`, `frontend/src/i18n/en/dossier-shell.json`, `frontend/src/i18n/ar/dossier-shell.json`.
5. Add accessible names and localized tooltips for collapsed relationship strip icon buttons. Files: `frontend/src/components/dossier/RelationshipSidebar.tsx`, `dossier-shell` EN/AR.
6. Add `aria-label={t('header.relationships')}` to the mobile relationships trigger. File: `frontend/src/components/dossier/DossierShell.tsx`.
7. Add missing `timeline.status.*` EN/AR keys for `draft`, `submitted`, `triaged`, `assigned`, `converted`, `merged`, and `overdue` in `dossier-context` EN/AR.

## B-Bucket Planning Item

| ID    | Dossier type | Planning/live verification needed                                                                                                                                                                                                                                                            |
| ----- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R8-04 | engagement   | Decide the semantics for the drawer "Log engagement" source dossier: participant, host country/organization, related dossier edge, default-only prefill, or a combination. Then validate the create wizard and `engagement_participants`/`engagement_dossiers` writes against a live DB row. |
