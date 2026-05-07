# Phase 45: Schema & Seed Closure - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 45 closes the v6.0 dashboard data debt. It creates the minimal
`intelligence_digest` schema and dashboard read hook, replaces the Digest
widget's `actor_name` source compromise with publication names, enriches the
VIP Visits data path with real country ISO codes for flag glyphs, and applies
the existing dashboard demo seed to staging so the four Phase 41
BLOCKED-BY-SEED Playwright specs can run. It must not introduce the v7
intelligence engine, regenerate visual baselines, or broaden into dashboard
feature work.

</domain>

<decisions>
## Implementation Decisions

### intelligence_digest Table Boundary

- **D-01:** Build a bare dashboard feed table only. Do not introduce
  `intelligence_signal`, signal-to-dossier polymorphic links, subscriber
  models, alerting, external feed ingestion, scheduled briefings, or
  cross-dossier aggregation in Phase 45.
- **D-02:** Preserve all DATA-01 display columns:
  `id`, `headline_en`, `headline_ar`, `summary_en`, `summary_ar`,
  `source_publication`, `occurred_at`, nullable `dossier_id`, and
  `created_at`.
- **D-03:** Add the minimum ownership/security support columns needed for
  org-scoped RLS. `organization_id` is allowed even though DATA-01 does not
  name it, because nullable `dossier_id` cannot enforce org scoping by itself.
- **D-04:** RLS must follow existing Supabase patterns: authenticated users can
  read rows for their organization, while writes are role-gated to the existing
  admin/editor/supervisor-equivalent pattern. Do not loosen dossier clearance,
  organization membership, or service-role assumptions.
- **D-05:** The dashboard must use a typed `useIntelligenceDigest` hook. The
  Digest widget's rendered `source` field must come from
  `source_publication`; the widget render path should have zero dependency on
  `actor_name` or `useActivityFeed`.

### VIP ISO Enrichment Contract

- **D-06:** Prefer extending the existing `get_upcoming_events` RPC with
  nullable VIP person fields instead of adding a dashboard-only VIP RPC. This
  keeps `useVipVisits` on the operations-hub timeline source while preserving
  compatibility for other timeline consumers.
- **D-07:** Add nullable fields such as `person_id`, `person_name`,
  `person_name_ar`, `person_role`, and `person_iso` to the RPC return shape and
  `TimelineEvent` type. Existing consumers must tolerate these as optional.
- **D-08:** Source the ISO from existing person/country data:
  `persons.nationality_country_id -> countries.iso_code_2`, with
  `persons.country_id -> countries.iso_code_2` as a fallback for
  elected-official-style person rows. There is no current
  `country_iso_codes` table in the repo; do not create one unless research
  proves the live database has it.
- **D-09:** Derive VIP rows from existing engagement/person relationships
  where possible, especially `engagement_dossiers` plus
  `engagement_participants` pointing at person dossiers. Do not invent a
  `vip_visit` enum value unless research proves the current widget/test
  contract cannot be satisfied without it.
- **D-10:** Update `useVipVisits` to map from the nullable person fields when
  present, with the existing title/engagement fields as fallback. Pass
  `person_iso` to `<DossierGlyph type="country" iso={...}>` for real flags;
  retain the initials fallback when ISO is absent.

### Seed Application Path

- **D-11:** The canonical seed path is `supabase/seed/060-dashboard-demo.sql`.
  Active ROADMAP/REQUIREMENTS references to
  `frontend/seeds/060-dashboard-demo.sql` are stale and should not guide file
  selection.
- **D-12:** Apply the seed to staging through Supabase MCP against project
  `zkrcjzdemdmwhearhfgg`, per `CLAUDE.md`. Do not use direct DB edits or a
  one-off psql command.
- **D-13:** If the seed application needs a committed applied artifact, create
  a Phase 45 migration under `supabase/migrations/` carrying the idempotent
  dashboard demo seed body and referencing `supabase/seed/060-dashboard-demo.sql`
  in the header. Keep the seed idempotent with deterministic `b00000xx-*`
  fixture IDs.
- **D-14:** Expand the seed only as needed for DATA-02/DATA-03/DATA-04: add
  `intelligence_digest` fixture rows and the minimum person/VIP participant
  fixture needed for VIP flags. Do not add broad v7 intelligence-engine sample
  data.
- **D-15:** Phase 45 should unblock the four Phase 41 BLOCKED-BY-SEED drawer
  specs plus targeted Digest/VipVisits widget checks. Visual snapshot
  regeneration remains Phase 46.

### Agent Discretion

- **D-16:** The interactive question tool was unavailable in this Codex mode.
  The workflow fallback selected all three gray areas and locked conservative
  defaults. If the user later wants different behavior, update this CONTEXT.md
  before planning.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope

- `.planning/ROADMAP.md` - Active Phase 45 goal and success criteria. Note the
  stale seed path in the text.
- `.planning/REQUIREMENTS.md` - DATA-01..DATA-04 requirement definitions.
  Treat `frontend/seeds/060-dashboard-demo.sql` as stale; use
  `supabase/seed/060-dashboard-demo.sql`.
- `.planning/PROJECT.md` - v6.1 milestone boundary and "no new features"
  hardening context.
- `.planning/STATE.md` - Phase 38 compromise notes for Digest and VipVisits,
  plus Phase 40/41 seed and visual-gate history.
- `.planning/notes/v6.1-rationale.md` - Rationale for promoting schema/seed
  debt into v6.1.
- `.planning/todos/pending/v6.1-kickoff.md` - Kickoff note naming Phase 45
  schema/seed closure.
- `.planning/milestones/v6.0-MILESTONE-AUDIT.md` - Source of
  DIGEST-SOURCE-COMPROMISE, VIP ISO join deferral, and BLOCKED-BY-SEED audit
  item.
- `.planning/seeds/v7.0-intelligence-engine.md` - Explicitly deferred future
  scope; do not pull it into Phase 45.
- `CLAUDE.md` - Staging project ID and Supabase MCP deployment rule.

### Dashboard Digest

- `frontend/src/pages/Dashboard/widgets/Digest.tsx` - Current compromised
  widget mapping from `useActivityFeed` and `actor_name`.
- `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` - Current
  unit tests that must be updated for `useIntelligenceDigest`.
- `frontend/src/hooks/useActivityFeed.ts` - Current source to remove from the
  Digest widget path, not a target for broad refactor.
- `supabase/seed/060-dashboard-demo.sql` - Current activity-stream seed and
  future intelligence digest fixture source.

### VIP Visits

- `frontend/src/pages/Dashboard/widgets/VipVisits.tsx` - Current consumer of
  `useVipVisits` and `<DossierGlyph>`.
- `frontend/src/hooks/useVipVisits.ts` - Single frontend adapter to update for
  `person_iso`/person fields.
- `frontend/src/hooks/__tests__/useVipVisits.test.ts` - Existing hook tests.
- `frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx` -
  Existing widget tests.
- `frontend/src/components/signature-visuals/DossierGlyph.tsx` - Flag
  resolution behavior; only `type='country'` plus known ISO renders flags.
- `frontend/src/domains/operations-hub/repositories/operations-hub.repository.ts`
  - Supabase RPC wrapper for `get_upcoming_events`.
- `frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts` - Existing
  TanStack Query hook that `useVipVisits` wraps.
- `frontend/src/domains/operations-hub/types/operations-hub.types.ts` -
  `TimelineEvent` type to extend with nullable person fields.
- `supabase/migrations/20260330000001_operations_hub_rpcs.sql` -
  `get_upcoming_events` RPC definition.
- `supabase/migrations/20260110000006_create_engagement_dossiers.sql` -
  `engagement_dossiers` and `engagement_participants` schema.
- `supabase/migrations/20260110000003_persons_entity_management.sql` -
  persons importance/engagement/nationality schema.
- `supabase/migrations/20260418000001_person_identity_fields.sql` - Phase 32
  note that `nationality_country_id` exists before identity fields.

### Seed And E2E

- `supabase/seed/060-dashboard-demo.sql` - Canonical idempotent dashboard seed.
- `frontend/tests/e2e/support/dossier-drawer-fixture.ts` - Phase 41 drawer
  specs depend on the seed fixture ID.
- `frontend/tests/e2e/dossier-drawer-*.spec.ts` - Drawer specs unblocked by
  DATA-04.
- `frontend/tests/e2e/dashboard-*.spec.ts` - Dashboard targeted smoke/visual
  specs; visual baselines are Phase 46.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `useActivityFeed` already returns activity rows from the activity-feed Edge
  Function, but Phase 45 should stop using it for the Digest widget instead of
  reshaping it.
- `DossierGlyph` already renders flags from a hard-coded ISO alpha-2 set when
  called as `type="country"` with `iso`; it does not render flags for
  `type="person"`.
- `useVipVisits` is already the single adapter between operations-hub events
  and the dashboard widget. Keep the frontend change concentrated there.
- `usePersonIdentityEnrichment` demonstrates the existing frontend pattern for
  resolving `persons.nationality_country_id` through `countries.iso_code_2`.

### Established Patterns

- Frontend data access uses domain hooks/repositories plus TanStack Query.
  New dashboard data should follow that pattern with a typed hook.
- Supabase migrations live in `supabase/migrations/`; dashboard seed fixtures
  live in `supabase/seed/` and are idempotent with deterministic UUID prefixes.
- Supabase changes for staging must go through MCP per `CLAUDE.md`.
- Phase 44 intentionally kept v6.1 as hardening/debt closure. Phase 45 should
  be surgical and avoid v7 intelligence-engine scope.

### Integration Points

- `Digest.tsx` must swap from `useActivityFeed` to `useIntelligenceDigest`.
- `get_upcoming_events` must return optional person fields without breaking
  existing timeline consumers.
- `operations-hub.repository.ts`, `useUpcomingEvents.ts`, `TimelineEvent`, and
  `useVipVisits.ts` form the shared VIP data chain.
- `060-dashboard-demo.sql` currently states that VIP visits are not seeded
  because `vip_visit` is not allowed by current CHECK constraints. Planning
  must resolve that either by deriving VIP rows from existing participant/person
  data or by explicitly justifying any enum expansion.

</code_context>

<specifics>
## Specific Ideas

- The `source_publication` field should display real publication/source names
  such as Reuters or Al Sharq, never an internal username.
- `country_iso_codes` appears in requirements text, but current repo evidence
  points to `countries.iso_code_2`. Treat the table name as conceptual unless
  live DB research finds an actual `country_iso_codes` table.
- The seed should keep the existing `b00000xx-*` deterministic fixture style
  so Phase 41 drawer tests can continue using known IDs.

</specifics>

<deferred>
## Deferred Ideas

- Full v7 intelligence engine: `intelligence_signal`, signal-to-dossier
  polymorphic links, recurring briefings, alerting, external feed ingestion,
  and AI correlation remain deferred to `.planning/seeds/v7.0-intelligence-engine.md`.
- Visual baseline regeneration for dashboard, list pages, and dossier drawer
  remains Phase 46.

</deferred>

---

_Phase: 45-schema-seed-closure_
_Context gathered: 2026-05-07_
