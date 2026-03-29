# Phase 9: Lifecycle Engine - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a lifecycle stage system to engagements with 6 stages (intake, preparation, briefing, execution, follow_up, closed). Enable flexible transitions with audit logging, intake-to-engagement promotion, work item stage references, and forum session independent lifecycle tracking via child engagements.

</domain>

<decisions>
## Implementation Decisions

### Stage Transition UX (LIFE-01, LIFE-02)

- **D-01:** Horizontal stepper bar showing all 6 stages (intake → preparation → briefing → execution → follow_up → closed) with current stage highlighted and completed stages marked. CRM pipeline-style. Clickable to transition to any stage.
- **D-02:** System suggests the next logical stage but never blocks transitions. Users can skip forward or move backward freely.
- **D-03:** When skipping non-adjacent stages, an optional note field appears (suggested but not required). Normal sequential transitions need no note.
- **D-04:** `lifecycle_stage` is a NEW field, separate from existing `engagement_status`. Status = event status (planned/confirmed/in_progress/completed/postponed/cancelled). Stage = workflow position (intake/preparation/briefing/execution/follow_up/closed). Both serve different filtering needs and can vary independently.
- **D-05:** Hovering/tapping a completed stage on the stepper shows a tooltip with "Entered: [date]". No dates displayed directly on the bar — keeps it clean.

### Intake Promotion Flow (LIFE-03)

- **D-06:** Confirmation dialog with field preview. User clicks "Promote to Engagement" on an intake ticket. Dialog shows mapped fields (title, description→objectives, dossier links) with editable overrides. User selects engagement_type and category. New engagement starts at "intake" lifecycle stage.
- **D-07:** After promotion, the intake ticket status becomes `converted`, `convertedToId` stores the new engagement ID. Ticket becomes read-only with a banner linking to the new engagement. Existing `convertedToType`/`convertedToId` fields in IntakeTicket already support this.
- **D-08:** Only engagement-type intake tickets are promotable in Phase 9. Other request types (position, mou_action, foresight) remain as-is — promotion for those is a future phase concern.

### Forum Session Lifecycle (LIFE-05)

- **D-09:** Each forum session is modeled as a child engagement with `engagement_type: 'forum_session'` (new type value). The parent forum dossier links to all its session-engagements via a `parent_forum_id` field on the engagement extension.
- **D-10:** Each session-engagement has its own independent lifecycle stepper, participants, agenda — reusing all existing engagement infrastructure.
- **D-11:** New session creation is initiated from the forum dossier page via a "New Session" button. Pre-fills parent forum link and copies recurring details (location, sponsors). User adds session-specific dates and details.

### Work Item Stage Reference (LIFE-04)

- **D-12:** Add optional `lifecycle_stage` field to work items, enabling stage-grouped display on kanban and engagement detail views. Existing `engagement_id` field on WorkItem already provides the engagement link — the new field adds stage context.

### Audit & History (LIFE-06)

- **D-13:** Lifecycle transitions are stored in a `lifecycle_transitions` table with: `id`, `engagement_id`, `from_stage`, `to_stage`, `user_id`, `note` (optional freeform text), `timestamp`, `duration_in_stage_seconds` (computed from previous transition timestamp).
- **D-14:** History displayed as a vertical timeline in a collapsible panel/sidebar section on the engagement detail page. Shows stage name, user, date, optional note, and time spent in previous stage.
- **D-15:** Duration tracking enables future process analytics (average time in each stage, bottleneck detection).

### Claude's Discretion

- Stepper bar responsive behavior on mobile (horizontal scroll vs compact mode vs vertical stack)
- Color palette for stage indicators (semantic colors per stage or single accent progression)
- Whether the promotion dialog uses a modal or a slide-over panel
- Exact field mapping logic between intake ticket types and engagement fields
- Whether `parent_forum_id` goes on the engagement extension table or the base dossier table
- Index strategy for lifecycle_transitions table (by engagement_id, by stage, by user)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Engagement Domain

- `frontend/src/types/engagement.types.ts` — Current EngagementStatus, EngagementType, EngagementExtension, EngagementDossier types. New `lifecycle_stage` field and `forum_session` type must be added here.
- `frontend/src/domains/engagements/repositories/engagements.repository.ts` — Engagement data access layer
- `frontend/src/routes/_protected/engagements/$engagementId.tsx` — Engagement detail route (stepper bar will be added here)

### Intake Domain

- `frontend/src/types/intake.ts` — IntakeTicket with `convertedToType`/`convertedToId` fields, TicketStatus with `converted` value. Promotion flow builds on this.
- `frontend/src/domains/intake/repositories/intake.repository.ts` — Intake data access layer
- `frontend/src/routes/_protected/intake.tsx` — Intake list page
- `backend/src/api/intake-entity-links.ts` — Backend intake linking API

### Forum Domain

- `frontend/src/types/forum.types.ts` — Forum type with `number_of_sessions` in extension. Child engagement pattern adds to this.

### Work Items

- `frontend/src/types/work-item.types.ts` — WorkItem with `engagement_id` field. New `lifecycle_stage` field to be added.

### Phase 8 Context (prior decisions)

- `.planning/phases/08-navigation-route-consolidation/08-CONTEXT.md` — Engagements in both Operations and Dossiers sidebar groups (D-03). Route structure decisions.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `EngagementStatus` type and labels (6 values with bilingual labels) — pattern to follow for `LifecycleStage` type
- `AuditLogEntry` interface in intake types — pattern for lifecycle transition records
- `IntakeTicket.convertedToType`/`convertedToId` — existing promotion scaffolding
- `ENGAGEMENT_TYPE_LABELS` record pattern — reuse for lifecycle stage labels
- `ForumExtension.number_of_sessions` — existing session count tracking

### Established Patterns

- Bilingual fields (name_en/name_ar, title_en/title_ar) — all new fields must follow this
- Extension table pattern (engagement_dossiers stores engagement-specific fields) — lifecycle_stage could go on this extension
- Repository pattern (domains/{feature}/repositories/\*.repository.ts) — new lifecycle APIs should follow this
- RPC functions via Supabase — existing `get_engagement_full` RPC returns full profile, new lifecycle data should join into this

### Integration Points

- Engagement detail page route (`engagements/$engagementId.tsx`) — stepper bar component mounts here
- Intake ticket detail page — "Promote to Engagement" button triggers promotion dialog
- Forum dossier page — "New Session" button creates child engagement
- Kanban board / work item views — optional lifecycle_stage grouping
- Backend API — new transition endpoint, promotion endpoint, forum session endpoint

</code_context>

<specifics>
## Specific Ideas

- Stepper bar follows CRM deal stage pipeline pattern (HubSpot/Salesforce style) — visual progression with clickable stages
- Promotion dialog previews field mapping so user knows what carries over before confirming
- Duration tracking per stage enables future process analytics dashboards (Phase 10 Operations Hub could surface "avg days in preparation")
- Forum sessions as child engagements means they inherit ALL engagement features (participants, agenda, after-actions) without building parallel infrastructure

</specifics>

<deferred>
## Deferred Ideas

- Promotion for non-engagement intake types (position→Position, mou_action→MOU, foresight→Topic) — separate phase
- Process analytics dashboard (avg time per stage, bottleneck detection) — Phase 10 Operations Hub or later
- Automated stage suggestions based on engagement dates/events — future intelligence feature
- Batch stage transitions (move multiple engagements at once) — future workflow optimization

</deferred>

---

_Phase: 09-lifecycle-engine_
_Context gathered: 2026-03-29_
