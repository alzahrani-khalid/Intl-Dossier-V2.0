# Phase 17: Seed Data & First Run - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship a realistic GASTAT-flavored diplomatic seed dataset and a first-run experience that detects an empty database and offers admins one-click population. Scope ends at: data loaded, dashboard refreshed, user sees populated app. Out of scope: guided product tours, onboarding wizards, multi-tenant seed variants.

</domain>

<decisions>
## Implementation Decisions

### Seed Scenario Design

- **D-01:** Scale — 10 countries, 10 organizations, 10 forums, 10 engagements (rich showcase, exceeds SEED-01 lower bound).
- **D-02:** Narrative — GASTAT-realistic Saudi statistical diplomacy. Real partner orgs (UN Statistics Division, GCC-Stat, OECD, IMF, World Bank) and real partner countries Saudi Arabia engages with statistically.
- **D-03:** Bilingual — Full AR + EN for every name, title, and description on every seeded entity. No EN-only fallbacks.
- **D-04:** Work-item state mix — Stress-test distribution covering all statuses (pending, in_progress, review, completed, cancelled), all priorities (incl. urgent + overdue), varied assignees, and all three sources (task, commitment, intake) and tracking types (delivery, follow_up, sla). Goal: exercise filters, Kanban columns, dashboard counts, and SLA timers in one dataset.
- **D-05:** Cross-tier dossier relationships required (strategic / operational / informational) per SEED-02 — link work items to dossiers via `work_item_dossiers` with varied `inheritance_source` values.

### Seed Delivery Mechanism

- **D-06:** **Hybrid SQL migration + SECURITY DEFINER RPC.** A versioned Supabase migration in `supabase/migrations/` defines a Postgres function `populate_diplomatic_seed()` containing all fixtures. The function is idempotent (`ON CONFLICT DO NOTHING`) and returns a summary count. The first-run UI invokes it via `supabase.rpc('populate_diplomatic_seed')`. _Claude's discretion — user delegated mechanism choice._
- **D-07:** Single ordered file — one migration `17XXXX_seed_diplomatic.sql` containing the function definition with sectioned inserts (countries → orgs → forums → engagements → dossiers → work_items → relationships). No per-entity split.
- **D-08:** Lives in `supabase/migrations/` (versioned) so MCP-applied migrations propagate to staging and the DigitalOcean droplet automatically. Existing `supabase/seed.sql` and `seed-assignment-test-data.sql` are NOT touched in this phase.

### First-Run UX

- **D-09:** Empty-DB detection via lightweight RPC `check_first_run()` called once after auth on dashboard mount. Returns `{ is_empty: bool, can_seed: bool }`. TanStack Query caches the result.
- **D-10:** Surface — HeroUI v3 Modal (`Modal.*` compound API) on first dashboard load when `is_empty=true`. Centered, dismissible, bilingual copy. Two primary actions: **Populate sample data** (admin only, enabled when `can_seed=true`) and **Start empty**.
- **D-11:** Access — Admin role only. RPC checks `auth.uid()` against admin role; non-admins see a role-aware modal variant ("Ask an administrator to populate sample data") instead of the populate button.
- **D-12:** Post-seed behavior — On RPC success, invalidate all relevant TanStack Query keys (dossiers, work items, dashboard counts), close modal, show success toast in active language. No reload, no navigation.

### Reset & Re-Seed Safety

- **D-13:** RPC is **idempotent on empty only**. If any `is_seed_data=true` rows exist on the canonical seeded tables, RPC returns `{ status: 'already_seeded' }` and inserts nothing. No re-seed, no top-up, no wipe.
- **D-14:** Tagging strategy — Fixed/deterministic UUIDs for all seeded rows + a new `is_seed_data BOOLEAN NOT NULL DEFAULT false` column on every seeded table. Researcher must enumerate the affected tables (countries, organizations, forums, engagements, dossiers, work_items, work_item_dossiers, etc.) and produce the column-add migration as a prerequisite.
- **D-15:** Production guard — RPC enabled in **all environments**. Safety comes from (a) admin-role gate, (b) idempotency check, (c) deterministic UUIDs preventing collisions on re-runs. No env flag, no SEED_ENABLED toggle, no confirmation token.

### Claude's Discretion

- Exact GASTAT partner country/org list — pick 10 plausible, politically neutral choices (e.g., UAE, Bahrain, Kuwait, Qatar, Oman, Egypt, Jordan, Morocco, Indonesia, Pakistan).
- Exact AR translations — use natural, professional Arabic suitable for diplomatic context.
- RPC return shape (beyond `is_empty`/`can_seed`/`status`) — include counts of inserted entities for the success toast.
- Modal copy and microinteractions — within HeroUI v3 + i18next conventions.
- Whether `check_first_run()` is one RPC or two (`is_empty` + `am_admin`) — researcher to decide based on RLS perf.

### Folded Todos

None — no pending todos matched Phase 17 scope.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements

- `.planning/ROADMAP.md` §"Phase 17: Seed Data & First Run" — goal, success criteria, requirements list
- `.planning/REQUIREMENTS.md` SEED-01, SEED-02, SEED-03 — acceptance criteria
- `.planning/PROJECT.md` — vision, bilingual + RTL non-negotiables, dossier-centric principle

### Existing Seed Assets (reference, not modified)

- `supabase/seed.sql` — current minimal seed (97 lines, extensions + bootstrap only)
- `supabase/seed-assignment-test-data.sql` — assignment fixtures (265 lines, test-only)

### Architecture Docs

- `docs/DOSSIER_CENTRIC_ARCHITECTURE.md` §2 (Dossier Connections Map), §5 (work_item_dossiers linking pattern) — how to wire seed work items to dossiers across tiers
- `CLAUDE.md` §"Work Management Terminology" — canonical enum values for status / priority / source / tracking_type used in seeded work items
- `CLAUDE.md` §"Dossier Types" — the 8 dossier types that must be represented in seed (country, organization, forum, engagement, topic, working_group, person, elected_official)

### Stack & Conventions

- `CLAUDE.md` §"HeroUI v3 Component Strategy" — Modal compound component API for the first-run modal
- `CLAUDE.md` §"Arabic RTL Support Guidelines" — logical properties + dir attribute for modal layout

### Prior Phase Context (for consistency)

- `.planning/phases/15-notification-backend-in-app/15-CONTEXT.md` — RPC + RLS patterns established for notification triggers
- `.planning/phases/16-email-push-channels/16-CONTEXT.md` — most recent migration conventions

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **HeroUI v3 Modal** (`frontend/src/components/ui/heroui-modal.tsx`) — wrapper with shadcn-compatible Dialog API; use for first-run modal.
- **i18next + react-i18next** — bilingual copy infrastructure already in place; add a new namespace `first-run` or extend `unified-kanban`.
- **TanStack Query invalidation patterns** — established across dossier hooks; reuse for post-seed cache refresh.
- **Supabase MCP** — apply migrations via MCP per CLAUDE.md global rule (no manual SQL execution).

### Established Patterns

- Migrations are versioned in `supabase/migrations/` and applied via Supabase MCP → all envs stay in sync.
- RPC functions use `SECURITY DEFINER` with explicit role checks at the function top.
- `auth.uid()` + role lookup via existing `is_admin()` helper (researcher to confirm helper name in current schema).
- Dossier-centric: every work item links to ≥1 dossier via `work_item_dossiers`.

### Integration Points

- First-run modal mounts on the protected dashboard route (likely `frontend/src/routes/_protected/dashboard/index.tsx` — researcher to confirm exact path).
- New `check_first_run()` and `populate_diplomatic_seed()` RPCs expose to the frontend via the generated supabase-js types — regenerate types after migration.
- `is_seed_data` column additions touch 8+ tables; coordinate column-add migration BEFORE the seed-function migration.

</code_context>

<specifics>
## Specific Ideas

- Keep the modal copy short and welcoming — emphasize "explore the app with realistic data" not "run a script".
- Toast on success should report counts: "Created 10 countries, 10 organizations, 47 work items…"
- Deterministic UUIDs: prefer namespaced uuid_generate_v5 from a fixed `seed.gastat.diplomatic` namespace so rows are stable across re-runs.

</specifics>

<deferred>
## Deferred Ideas

- **Guided product tour after seed** — out of scope (Phase 17 ends at populated dashboard). Candidate for a future onboarding phase.
- **Multi-scenario seed packs** (small/medium/large) — single rich scenario for now; tiered packs can come later if needed.
- **Wipe-and-replace re-seed for staging** — explicitly excluded by D-13. If staging needs reset, use `supabase db reset` outside this phase's flow.
- **SEED_ENABLED env var** — rejected in D-15; revisit only if a customer prod deployment requires hard disable.
- **Per-user "demo mode" toggle** — not in scope.

</deferred>

---

_Phase: 17-seed-data-first-run_
_Context gathered: 2026-04-07_
