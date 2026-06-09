# Engagement Dossier Workflow Inspection

**Date:** 2026-06-09  
**Scope:** End-to-end ENGAGEMENT dossier workflow — list route and data hooks, detail shell, tabs (overview, after-action, tasks/commitments, timeline, docs), overview cards (`OutcomesSummary`, `ParticipantsList`, `FollowUpActions`), `engagement_dossiers` extension table, `after_action_records` / `aa_commitments` linkage, activity timeline  
**Method:** Static code trace against `frontend/src/types/database.types.ts`, TanStack Router routes, domain hooks/repositories, `supabase/functions/{engagement-dossiers,after-actions-list,engagements-kanban-get,dossier-activity-timeline}`, and `frontend/src/i18n/{en,ar}/*.json`. No live browser or staging API calls were executed.

---

## Workflow Map (Verified Live Path)

| Stage           | Entry                                     | Primary implementation                                                                                                             |
| --------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| List            | `/dossiers/engagements`                   | `frontend/src/routes/_protected/dossiers/engagements/index.tsx` → `EngagementsListPage`                                            |
| List data       | —                                         | `useEngagementsInfinite` → `engagementsRepo.getEngagements` → edge `engagement-dossiers` (GET) → RPC `search_engagements_advanced` |
| Row click       | —                                         | Navigates to `/engagements/$engagementId/overview`                                                                                 |
| Detail shell    | `/engagements/$engagementId`              | `WorkspaceShell` ( **not** `DossierShell` ) via `frontend/src/routes/_protected/engagements/$engagementId.tsx`                     |
| Default tab     | `/engagements/$engagementId/`             | Redirects to `overview`                                                                                                            |
| Tabs (routed)   | URL segments                              | `overview`, `context`, `tasks`, `calendar`, `docs`, `audit` — via `WorkspaceTabNav`                                                |
| After-action    | `/engagements/$engagementId/after-action` | Separate child route; tab nav hidden in shell                                                                                      |
| Legacy redirect | `/dossiers/engagements/$id`               | Redirects to `/engagements/$engagementId/overview`                                                                                 |

**Canonical extension table:** `engagement_dossiers` (dates, status, lifecycle, host refs). Dossier rows use `dossiers.type = 'engagement'` (corrected in migration `20260503130000_seed_engagement_extensions_and_fix_search_rpc.sql`).

**Superseded / unwired (not on live routes):**

- `EngagementDossierDetail.tsx` — only consumer of `OutcomesSummary`, `ParticipantsList`, `FollowUpActions`, `EngagementTimeline`
- `DossierShell` with `dossierType="engagement"` — no routed engagement detail under `/dossiers/engagements/$id` (redirect only)
- Legacy `frontend/src/hooks/useEngagement.ts` — still used by after-action route; joins deprecated `engagements` extension table

**RTL (live workspace path):** No `ml-*` / `mr-*` / `pl-*` / `pr-*` / physical `left`/`right` in `frontend/src/pages/engagements/workspace/*.tsx` or `WorkspaceShell.tsx`. Logical properties (`ms-*`, `ps-*`, `border-s-*`, `text-start`) are used.

---

## Findings

### 1. CRITICAL — After-action route cannot load engagements created via `engagement_dossiers`

**Location:**

- `frontend/src/hooks/useEngagement.ts` lines 40–64 (`engagements!inner` join on legacy `engagements` table)
- `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx` lines 3, 30, 42–52
- `supabase/functions/engagement-dossiers/index.ts` lines 472–498 (creates `engagement_dossiers` only, not `engagements`)

**Why it is a real bug:** New engagements are created with a `dossiers` row plus an `engagement_dossiers` extension row. The legacy `engagements` table is not populated on create (only seed/backfill migrations insert into it). The after-action page uses `@/hooks/useEngagement`, which requires an inner join to `engagements`. PostgREST returns no row / error for dossiers that exist in `engagement_dossiers` but not in `engagements`, so the page renders the “not found” error state even though the workspace overview loads the same ID via `domains/engagements/hooks/useEngagements` → `get_engagement_full` RPC.

**Recommended fix:** Replace `import { useEngagement } from '@/hooks/useEngagement'` with the domain hook `useEngagement` from `@/domains/engagements/hooks/useEngagements` (or delete the legacy hook and migrate all callers). Map `profile.engagement` fields into the after-action form props.

---

### 2. CRITICAL — Engagement Tasks kanban reads deprecated tables; new engagements get 404 or empty board

**Location:**

- `supabase/functions/engagements-kanban-get/index.ts` lines 57–71 (queries `assignments`), lines 141–152 (existence check on legacy `engagements`)
- `supabase/functions/tasks-create/index.ts` lines 185–212 (inserts into unified `tasks` with optional `engagement_id`)
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` lines 206–213
- `frontend/src/pages/engagements/workspace/TasksTab.tsx` lines 44, 177–181

**Why it is a real bug:** The unified tasks model (migration `20251019182300_create_unified_tasks.sql` and RPC `get_unified_work_kanban` in `20251203000002_create_kanban_rpc_function.sql`) stores engagement-scoped work in `tasks.engagement_id`. The live kanban edge function still (a) verifies the engagement against the legacy `engagements` table and (b) loads cards from `assignments`. New engagement dossiers fail the existence check (same gap as finding 1), returning HTTP 404. Even when legacy rows exist, tasks created through `tasks-create` land in `tasks` and never appear in `assignments`, so the board stays empty while overview metrics also read zero from the same hook.

**Recommended fix:** Repoint `engagements-kanban-get` to query `tasks` where `engagement_id = $id` (or call `get_unified_work_kanban('engagement', $id)`), validate against `engagement_dossiers` / `get_engagement_full`, and update drag-end to patch `tasks.workflow_stage` instead of `assignments-workflow-stage-update` assignment IDs.

---

### 3. HIGH — `after-actions-list` is GET-only; overview section components invoke it with POST body

**Location:**

- `supabase/functions/after-actions-list/index.ts` lines 18–23 (rejects non-GET with 405)
- `frontend/src/components/dossier/sections/OutcomesSummary.tsx` lines 58–60
- `frontend/src/components/dossier/sections/ParticipantsList.tsx` lines 90–92
- `frontend/src/components/dossier/sections/FollowUpActions.tsx` lines 90–92

**Why it is a real bug:** `supabase.functions.invoke('after-actions-list', { body: { dossier_id, ... } })` sends a POST-style invocation. The edge function only accepts GET and expects `dossierId` in the URL path (`/dossiers/{id}/after-actions`) plus query params (`status`, `limit`, `offset`). Invocations fail; each component catches the error and returns empty arrays, silently hiding published after-action decisions, commitments, risks, attendees, and follow-ups.

**Recommended fix:** Call via GET with path/query, e.g. `supabase.functions.invoke('after-actions-list', { method: 'GET', headers: { ... }, /* or use apiClient fetch to the function URL with dossier id in path */ })`, matching the edge contract. Alternatively extend the edge function to accept POST body filters (less ideal if other dossier types already use GET).

---

### 4. HIGH — `FollowUpActions` PostgREST embed targets nonexistent `work_items` table

**Location:** `frontend/src/components/dossier/sections/FollowUpActions.tsx` lines 45–65

**Why it is a real bug:** The query embeds `work_items!inner (...)` with columns `title`, `deadline`, `assignee_id`, and FK hint `users!work_items_assignee_id_fkey`. `database.types.ts` defines `tasks`, `assignments`, and view `unified_work_items`, but **no** `work_items` table. PostgREST returns a schema error; the catch block logs and returns `[]`, so task-based follow-ups never render. Junction table `work_item_dossiers` is polymorphic (`work_item_id` + `work_item_type`) and has no FK to a `work_items` relation.

**Recommended fix:** Query `work_item_dossiers` filtered by `dossier_id`, branch on `work_item_type === 'task'`, and join `tasks` (or use `unified_work_items` / `get_unified_work_items`) for title, `sla_deadline`, and assignee display.

---

### 5. HIGH — Engagement overview outcome cards and timeline are not on the live workspace path

**Location:**

- `frontend/src/components/dossier/EngagementDossierDetail.tsx` lines 15–17, 101–123 (only importer of the three section components)
- Grep across `frontend/src/routes`: **no route** imports `EngagementDossierDetail`
- Live overview: `frontend/src/pages/engagements/workspace/OverviewTab.tsx` (participants from `useEngagementParticipants`, lifecycle-only “recent activity”)
- Timeline: `EngagementTimeline` only referenced from dead `EngagementDossierDetail.tsx`; workspace `audit` tab uses `useLifecycleHistory` only

**Why it is a real bug:** The product-specified cards (`OutcomesSummary`, `ParticipantsList`, `FollowUpActions`) and unified timeline (`EngagementTimeline` / dossier activity timeline) are implemented but not mounted on any routed engagement detail view. Analysts using `/engagements/:id/overview` never see after-action outcomes, cross-source follow-ups, or the dossier activity timeline tab that other dossier types expose via `DossierShell`.

**Recommended fix:** Either wire `EngagementDossierDetail` sections (after fixing findings 3–4) into `OverviewTab` or add forum-style `DossierShell` tabs (`timeline`, outcomes) under the workspace; mount `DossierActivityTimeline` or `EngagementTimeline` on a dedicated tab backed by `dossier-activity-timeline`.

---

### 6. HIGH — `ParticipantsList` uses wrong data source and wrong dossier links

**Location:**

- `frontend/src/components/dossier/sections/ParticipantsList.tsx` lines 42–66 (`dossier_relationships` with ad hoc relationship types)
- Same file lines 218–224 (always links to `/dossiers/person/$dossierId`)
- Canonical source: `engagement_participants` via `engagementsRepo.getParticipants` / `useEngagementParticipants` (used correctly in live `OverviewTab`)

**Why it is a real bug:** Participants for engagement dossiers are stored in `engagement_participants` (see migration `20260110000006_create_engagement_dossiers.sql`). The section queries `dossier_relationships` for types like `engagement_participant` and `attendee`, which are not guaranteed to be written when participants are added through the workspace API. Organization/country participants are linked to `/dossiers/person/…`, producing wrong routes or 404s.

**Recommended fix:** Reuse `getParticipants(engagementId)` and link via `getDossierRouteSegment(participant.dossier.type)` (or existing dossier route helpers).

---

### 7. MEDIUM — List pagination `total` / `has_more` ignores active search filters

**Location:** `supabase/functions/engagement-dossiers/index.ts` lines 344–377

**Why it is a real bug:** `search_engagements_advanced` returns a filtered page, but `total` and `has_more` are computed from an unfiltered count of all `dossiers` where `type = 'engagement'`. With search active, `useEngagementsInfinite` may show “load more” when no further filtered rows exist, or hide it while filtered pages remain.

**Recommended fix:** Return filtered count from the RPC (window `COUNT(*) OVER()` or separate count query with the same predicates) and derive `has_more` from that.

---

### 8. MEDIUM — Hardcoded bilingual strings bypass i18n on live workspace tabs (Arabic shows English fragments)

**Location:**

- `frontend/src/pages/engagements/workspace/OverviewTab.tsx` lines 67–68, 242–243, 283–284, 293–296
- `frontend/src/pages/engagements/workspace/ContextTab.tsx` lines 178, 208, 238, 288, 304
- `frontend/src/pages/engagements/workspace/DocsTab.tsx` lines 78–79, 161, 189, 215, 224–225, 231 (and “Citations” / “View” further in file)

**Why it is a real bug:** These components call `useTranslation('workspace')` but embed inline `isRTL ? '…' : '…'` or raw English (`Upload Document`, `document/documents`, `Untitled Brief`, `AI Brief`, raw `brief.status`). In Arabic mode, mixed English UI copy appears despite full `workspace` AR/EN bundles.

**Recommended fix:** Move strings into `frontend/src/i18n/{en,ar}/workspace.json` (and brief-status labels into `engagement-briefs` if needed); use `t()` exclusively.

---

### 9. MEDIUM — `WorkspaceShell` displays raw `engagement_type` enum

**Location:** `frontend/src/components/workspace/WorkspaceShell.tsx` lines 79–82

**Why it is a real bug:** The header chip renders `engagement.engagement_type` (e.g. `bilateral_meeting`) instead of `ENGAGEMENT_TYPE_LABELS` from `frontend/src/types/engagement.types.ts` lines 446–457. Arabic users see snake_case English enum tokens.

**Recommended fix:** Map through `ENGAGEMENT_TYPE_LABELS[type][isRTL ? 'ar' : 'en']`.

---

### 10. MEDIUM — After-action optimistic-lock copy missing from AR/EN bundles

**Location:**

- `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx` lines 75–77, 105–108, 119
- `frontend/src/i18n/en/common.json` and `frontend/src/i18n/ar/common.json` — `afterActions` has no `conflict` subtree (grep confirms absence)

**Why it is a real bug:** Keys `afterActions.conflict.warning` and `afterActions.conflict.reviewChanges` rely on English `defaultValue` strings in `t()`. In Arabic locale, conflict banner and button text fall back to English.

**Recommended fix:** Add `afterActions.conflict.warning` and `afterActions.conflict.reviewChanges` to both `common.json` files.

---

### 11. MEDIUM — `OutcomesSummary` i18n keys missing under `dossier` namespace (when section is wired)

**Location:** `frontend/src/components/dossier/sections/OutcomesSummary.tsx` lines 145, 183, 197–204, 217, 233, 243, 248, 254

**Why it is a real bug:** Uses `t('sections.engagement.decisions')`, `t('sections.engagement.commitments')`, `t('sections.engagement.risks')`, `t('priority.${priority}')`, `t('commitment.internal')`, `t('status.${status}')`, `t('severity.*')`, `t('likelihood.*')`, `t('risk.mitigation')` in namespace `dossier`. `sections.engagement` in `dossier.json` defines empty/placeholder keys only — not `decisions`, `commitments`, or `risks`. Root `priority.*` for `critical`/`urgent` is absent (only `timeline.priority` has high/medium/low). Labels fall back to English defaults or raw enum strings in Arabic.

**Recommended fix:** Add the missing keys under `sections.engagement` (and shared priority/status/severity maps) in both `en/dossier.json` and `ar/dossier.json`, or reuse existing `common.afterActions.*` keys.

---

### 12. MEDIUM — “Create task” and “Advance stage” controls are non-functional on live tabs

**Location:**

- `frontend/src/pages/engagements/workspace/OverviewTab.tsx` lines 323–334 (`createTask` button has no `onClick` / `Link`)
- `frontend/src/pages/engagements/workspace/TasksTab.tsx` lines 177–181 (same)
- `frontend/src/components/workspace/WorkspaceShell.tsx` lines 90–97 (`transitionStage` button has no handler)

**Why it is a real bug:** Primary workflow actions render as buttons but perform no navigation or mutation. Users cannot create tasks or advance lifecycle from the UI surfaces that advertise those actions.

**Recommended fix:** Wire to existing flows (`WorkCreationPalette` / `TaskQuickForm` with `engagement_id`, lifecycle transition mutation used elsewhere in engagement domain).

---

### 13. LOW — `engagements-kanban-get` assignee name is a placeholder

**Location:** `supabase/functions/engagements-kanban-get/index.ts` lines 89–92

**Why it is a real bug:** When assignment rows do exist, assignee display is hard-coded `'Staff Member'` instead of joining `users` / profiles. Misleading in any non-empty legacy board.

**Recommended fix:** Join assignee profile in the edge query (same pattern as `get_unified_work_kanban`).

---

### 14. LOW — Dead code: legacy hook and dossier detail component

**Location:**

- `frontend/src/hooks/useEngagement.ts` (entire file; only consumer is after-action route)
- `frontend/src/components/dossier/EngagementDossierDetail.tsx` (no route imports)

**Why it is a real bug:** Not a runtime defect on the main overview path, but duplicate/conflicting data contracts (`engagements` vs `engagement_dossiers`) invite regressions (as in finding 1) and block removal of legacy schema.

**Recommended fix:** Delete or quarantine after migrating after-action to domain hooks; mount or delete `EngagementDossierDetail`.

---

## Summary

| Severity | Count |
| -------- | ----- |
| CRITICAL | 2     |
| HIGH     | 4     |
| MEDIUM   | 6     |
| LOW      | 2     |

**Highest-impact live-path breaks:** after-action load failure (legacy `engagements` join) and empty/broken tasks kanban (`engagements-kanban-get` vs unified `tasks`). **Highest-impact product gap:** overview outcome cards and dossier activity timeline exist in code but are not routed on the workspace analysts actually use.

**No RTL physical-property violations** were found on the verified live workspace path. **Schema note verified:** `after-actions-list` correctly embeds `decisions`, `commitments:aa_commitments`, `risks:aa_risks`, and `follow_up_actions:aa_follow_up_actions` when called with GET — the frontend invoke method is the blocker, not the SQL embed aliases.
