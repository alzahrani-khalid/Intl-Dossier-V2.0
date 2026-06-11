# Round 17 Dossier Workflow Inspection - 2026-06-10

Inspector: Codex
Branch: `quick/260608-c9b`
Mode: inspection only. No source edits.
Live target: staging `zkrcjzdemdmwhearhfgg`

I read `reports/fanout-loop-state.json` first. Top-level status says rounds 6-16 are fixed or already escalated, and specifically keeps R7-01 export format/contract drift, R6/R7 relationship traversal/create issues, R6-03 positions, R13/R14 engagement/person linkage, and legacy person/EO raw-key debt out of the safe unattended bucket (`reports/fanout-loop-state.json:3`, `:127`, `:267`, `:278`). I did not re-report those as new R17 findings.

## Findings

### R17-01 - LOW - Bucket A

Surface: Work-item -> dossier context badge (`DossierContextBadge`).

Broken contract: The badge can render live dossier links for every dossier type returned by `work_item_dossiers`, but its tooltip type label only localizes four type keys in `dossier-context`.

Evidence:

- `useWorkItemDossierLinks` reads the live `work_item_dossiers` join, including `inheritance_source` and joined `dossiers.type/name_en/name_ar`, at `frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts:32-58`, then maps the joined dossier type/name into the link model at `frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts:65-86`.
- `DossierContextBadge` uses localized dossier names and localized inheritance labels at `frontend/src/components/dossier/DossierContextBadge.tsx:104-121`, and the clickable link correctly uses `getDossierDetailPath(dossierId, dossierType)` at `frontend/src/components/dossier/DossierContextBadge.tsx:170-175`.
- The tooltip type label falls back to the raw type when `dossier-context:type.*` is missing at `frontend/src/components/dossier/DossierContextBadge.tsx:160-164`.
- EN and AR `dossier-context.type` only define `country`, `organization`, `forum`, and obsolete `theme`, not `engagement`, `topic`, `working_group`, `person`, or `elected_official`: `frontend/src/i18n/en/dossier-context.json:27-32`, `frontend/src/i18n/ar/dossier-context.json:27-32`.

Live verification:

- Staging `work_item_dossiers` currently has 16 rows: `country=8`, `organization=4`, `forum=2`, `topic=2`.
- All 16 current rows have `inheritance_source=direct`, so inherited-source localization is clean by code but not live-covered beyond `direct`.

UI failure signature: a live topic-linked task/commitment badge navigates correctly and shows the localized dossier name, but its tooltip/type text shows raw `topic` in EN/AR instead of a localized type label. The same fallback would affect engagement, working group, person, and elected official links if such work-item rows are added.

Safe fix surface: Add the missing `dossier-context.type` keys in EN/AR. Do not change badge routing or data fetching.

### R17-02 - HIGH - Bucket A

Surface: Relationship graph navigation (React Flow graph and list view).

Broken contract: Clicking a related-dossier node should navigate through the type-aware dossier route segment, but the page drops the node type and navigates to a generic `/dossiers/$id` target.

Evidence:

- The shared click handler accepts only `nodeId` and navigates to `to: '/dossiers/$id' as '/dossiers'` with only `{ id: nodeId }` at `frontend/src/pages/relationships/RelationshipGraphPage.tsx:155-161`.
- That same handler is wired to advanced, enhanced, and basic graph modes, and to the list view navigator, at `frontend/src/pages/relationships/RelationshipGraphPage.tsx:391-427`.
- The route helper for correct dossier detail paths already exists: `getDossierDetailPath()` maps type -> segment at `frontend/src/lib/dossier-routes.ts:12-21` and returns `/dossiers/${segment}/${id}` at `frontend/src/lib/dossier-routes.ts:45-47`.
- Mounted dossier detail layouts are type-specific, for example country at `frontend/src/routes/_protected/dossiers/countries/$id.tsx:17-24`, organization at `frontend/src/routes/_protected/dossiers/organizations/$id.tsx:17-24`, working group at `frontend/src/routes/_protected/dossiers/working_groups/$id.tsx:12-20`, topic at `frontend/src/routes/_protected/dossiers/topics/$id.tsx:17-24`, person at `frontend/src/routes/_protected/dossiers/persons/$id.tsx:12-20`, elected official at `frontend/src/routes/_protected/dossiers/elected-officials/$id.tsx:19-27`, forum at `frontend/src/routes/_protected/dossiers/forums/$id.tsx:12-20`, and engagement redirect at `frontend/src/routes/_protected/dossiers/engagements/$id.tsx:16-21`.
- The only generic `$id` dossier route is `/dossiers/$id/overview`, not `/dossiers/$id`, at `frontend/src/routes/_protected/dossiers/$id.overview.tsx:35-37`.

Live verification:

- Staging has a relationship row `fbac29ae-2c0f-44ce-bca3-0fedc27cb4ce`: source `working_group` "Test Working Group D - Health Cooperation" (`a0000000-0000-0000-0000-000000000404`) to target `country` "Indonesia" (`b0000001-0000-0000-0000-000000000001`), `relationship_type=cooperates_with`.

UI failure signature: in the graph/list, clicking the Indonesia node from WG-D or the WG-D node from Indonesia sends the app to a non-mounted generic route such as `/dossiers/b0000001-0000-0000-0000-000000000001` instead of `/dossiers/countries/b0000001-0000-0000-0000-000000000001` or `/dossiers/working_groups/a0000000-0000-0000-0000-000000000404`.

Safe fix surface: Keep using the existing graph data; update `handleNodeSelect` to look up the clicked node by id and call `getDossierDetailPath(node.id, node.type)`. No schema or product decision is needed.

Not a new finding: node names are localized in all three graph renderers (`frontend/src/components/relationships/GraphVisualization.tsx:67-75`, `frontend/src/components/relationships/EnhancedGraphVisualization.tsx:141-142`, `frontend/src/components/relationships/AdvancedGraphVisualization.tsx:287-288`). The incoming-only traversal miss remains the already-escalated R6/R7 graph RPC backlog (`reports/fanout-loop-state.json:127`), so I did not re-count it.

### R17-03 - MEDIUM - Bucket B

Surface: Activity/timeline cross-links.

Broken contract: Timeline rows that reference another entity either have no navigation affordance despite carrying cross-entity metadata, or generate detail URLs for routes that are not mounted. This needs a route/product contract pass, not an unattended one-line fix.

Evidence:

- The unified activity endpoint is documented to aggregate positions, events, relationships, documents, and comments at `supabase/functions/dossier-unified-activity/index.ts:7-13`.
- The type contract has relationship cross-link metadata fields (`source_dossier_id`, `source_dossier_type`, `target_dossier_id`, `target_dossier_type`) at `frontend/src/types/unified-dossier-activity.types.ts:154-162`.
- The live RPC migration emits relationship rows with source and target dossier ids, but not the source/target dossier types needed to build a type-aware route without another lookup: `supabase/migrations/20260119100002_fix_unified_dossier_activity.sql:252-292`.
- The overview activity renderer displays title, actor/action, badges, status, inheritance source, and description only; it has no link/button/navigation branch for `activity.source_id` or relationship target/source metadata at `frontend/src/components/dossier/dossier-overview/sections/ActivityTimelineSection.tsx:130-240`.
- Separately, the type-specific `unified-timeline` edge emits `metadata.navigation_url: /calendar/${event.id}` for calendar rows at `supabase/functions/unified-timeline/index.ts:156-179` and `/mous/${mou.id}` for MoU rows at `supabase/functions/unified-timeline/index.ts:345-361`.
- Timeline cards trust `metadata.navigation_url` directly (`frontend/src/components/timeline/TimelineEventCard.tsx:117-120`, `frontend/src/components/timeline/TimelineEventCard.tsx:326-337`; `frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx:194-198`, `frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx:421-431`).
- Mounted calendar routes are `/calendar` and `/calendar/new`, not `/calendar/$id`: `frontend/src/routes/_protected/calendar.tsx:17-18`, `frontend/src/routes/_protected/calendar.tsx:33-38`, `frontend/src/routes/_protected/calendar/new.tsx:9-10`, `frontend/src/routeTree.gen.ts:498-500`.
- Mounted MoU route is `/mous`, not `/mous/$id`: `frontend/src/routes/_protected/mous.tsx:1-5`, `frontend/src/routeTree.gen.ts:356-358`.

Live verification:

- `get_unified_dossier_activities` on staging returns relationship rows for Indonesia and WG-D with the WG-D/Indonesia relationship ids, and position rows for Vision topic and GASTAT.
- `unified-timeline` on staging returns real Indonesia calendar events with `navigation_url` values `/calendar/3f465d9e-3cb0-45cb-98ea-3d618d911a27` and `/calendar/b0000006-0000-0000-0000-000000000001`.
- Staging currently has `calendar_entries=6`, `position_dossier_links=2`, `dossier_relationships=1`, and `mous=0`, so the calendar dead-link path is live; the MoU detail-link path is code-proven but data-empty.

UI failure signature:

- Overview activity rows for linked relationships/positions are informational dead-ends, even when they name another dossier or position.
- Type-specific timeline "View details" on live calendar rows navigates to `/calendar/<uuid>`, which has no mounted route.

Bucket rationale: There are several plausible fixes: suppress detail buttons unless a mounted route exists, route calendar/MoU rows to list pages with filters, add detail routes, or enrich relationship metadata with source/target types and route to the counterpart dossier. That is a cross-feature route contract decision, so bucket B.

## No New Finding / Already Escalated

- Work-item dossier context badge data source: no finding. It uses the correct `work_item_dossiers` join and preserves `dossier.type`, `name_en`, `name_ar`, and `inheritance_source` (`frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts:32-86`).
- Work-item badge inheritance-source labels: no finding. The component has labels for `engagement`, `after_action`, `position`, and `mou` at `frontend/src/components/dossier/DossierContextBadge.tsx:109-121`, and R6-11 already fixed those keys.
- Work-item badge click route: no finding. It already calls `getDossierDetailPath(dossierId, dossierType)` at `frontend/src/components/dossier/DossierContextBadge.tsx:170-175`.
- Relationship graph node labels: no finding. Names use `name_ar` in RTL and `name_en` otherwise in basic/enhanced/advanced graph renderers (`frontend/src/components/relationships/GraphVisualization.tsx:67-75`, `frontend/src/components/relationships/EnhancedGraphVisualization.tsx:141-142`, `frontend/src/components/relationships/AdvancedGraphVisualization.tsx:287-288`).
- Relationship graph outgoing-only traversal: no new finding. Live incoming-only Indonesia traversal still reproduces the old blind spot, but this is already R6/R7 escalated backlog (`reports/fanout-loop-state.json:127`).
- Export dialog type labels: no finding. `ExportDossierDialog` uses `dossier-export:type.${dossierType}` at `frontend/src/components/dossier/ExportDossierDialog.tsx:127-132`, and EN/AR define all dossier type labels including country, organization, forum, engagement, topic, working group, person, and elected official at `frontend/src/i18n/en/dossier-export.json:53-62` and `frontend/src/i18n/ar/dossier-export.json:53-62`.
- Export / briefing-pack format pipeline: no new R17 finding. The UI still advertises PDF/Word at `frontend/src/components/dossier/ExportDossierDialog.tsx:168-204`, posts to `dossier-export-pack` at `frontend/src/services/dossier-export.service.ts:61-70`, and the source edge still generates `.html` with `content_type: text/html` at `supabase/functions/dossier-export-pack/index.ts:1207-1257`. That is exactly the already-escalated R7-01 B item (`reports/fanout-loop-state.json:267`). Live staging verification worsens the same backlog: `dossier-export-pack` is not deployed (`POST /functions/v1/dossier-export-pack` returned `404 NOT_FOUND`; `supabase functions list` shows `briefing-packs-list` and `briefing-packs-generate`, but no `dossier-export-pack`).

## Round Close

Safe bucket-A surface is not completely empty, but it is thin:

- A: R17-01 small i18n key fill.
- A: R17-02 type-aware graph node navigation.
- B: R17-03 timeline cross-link route contract.

The broad auto-fix surface is effectively exhausted after R17. After applying the two small A fixes, stop the loop and escalate the named B backlog to GSD phases: R7-01 export/briefing-pack contract, R17-03 timeline cross-link route contract, R6/R7 relationship traversal/create contract, R6-03 New Position contract, R14-02 engagement Positions tab, R13-02/R14-03 host-org/person_engagements, and legacy person/EO raw-key debt.

---

## Round-17 Fix Outcomes (Claude, 2026-06-11)

Both bucket-A findings FIXED (build green, lint clean). FINAL inspection round —
the broad auto-fix surface is now exhausted; the loop is being stopped and the
named B-backlog escalated to GSD phases (see
`.planning/dossier-workflow-backlog-phases-2026-06-11.md`).

- **R17-02 FIXED (HIGH)** — `RelationshipGraphPage.handleNodeSelect` navigated to
  `'/dossiers/$id'` (an unmounted route — only `/dossiers/<segment>/$id` exists
  per type) with just `{ id }`, so a graph node click dead-ended/404'd. Now
  resolves the clicked node's type from `deduplicatedNodes` and navigates via
  `getDossierDetailPath(nodeId, node.type)` — the same helper the reachable
  `MiniRelationshipGraph` already uses correctly (lines 271/351/419). NOTE: the
  full `/relationships/graph` page is itself a dormant route that redirects to
  `/dossiers` (pre-existing round-2 B-item), so the fix is build-verified and
  pattern-consistent rather than browser-reachable; the user-reachable mini-graph
  was already correct.
- **R17-01 FIXED (LOW)** — `dossier-context.type` only localized
  country/organization/forum(/theme); added engagement, topic, working_group,
  person, elected_official EN+AR so the `DossierContextBadge` tooltip no longer
  falls back to the raw type for those work-item dossier links.

R17-03 (timeline cross-link route contract) is bucket B and is included in the
escalation doc.
