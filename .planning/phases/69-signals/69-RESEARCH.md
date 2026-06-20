# Phase 69: Signals - Research

**Researched:** 2026-06-14
**Domain:** Intelligence signals — clearance-gated data layer, keyboard triage queue, escalate-to-task, `read_signals` INVOKER RPC
**Confidence:** HIGH (all five RF items resolved against live staging `zkrcjzdemdmwhearhfgg`)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** One global triage queue under `/intelligence` (not a new `/signals` route); per-dossier Signals tab = same data filtered.
- **D-02:** Email-style keyboard triage (`j`/`k` move, `a` = acknowledge, `d` = dismiss, `e` = escalate). Mirror `IntakeQueue.tsx` + `useWaitingQueueActions.ts`.
- **D-03:** Status lifecycle: `new → acknowledged | dismissed | escalated`. Add a `status` column (none exists today).
- **D-04:** Dismiss is reversible. Status-based, nothing hard-deleted. Planner decides mechanism.
- **D-05:** Capture + triage = any cleared user (role-agnostic, NOT admin/editor only). LOOSENS existing RLS.
- **D-06:** Extend with `title`, `sensitivity_level` (integer 1–4), `status`. Reuse `content`, `severity`, `source_type`, `source_ref`, `occurred_at`, `created_by`. Extend `intelligence_event` vs. curated table = researcher's call (RF-1 below).
- **D-07:** Fixed category enum — proposed: `political / economic / security / diplomatic / other`. Exact values finalized in planning.
- **D-08:** AI-confidence field for `ai_generated` signals (badge); `null` for manual. Type/range = researcher's call.
- **D-09:** Single-language free-text (store as entered). UI chrome fully bilingual. Auto-`dir` / `<bdi>` for mixed-direction.
- **D-10:** Compact escalate dialog pre-filled from signal; confirm to create. Mirror `EscalationDialog.tsx`.
- **D-11:** Escalation creates a `task` (`workflow_stage = todo`); dossier links copy to task via `work_item_dossiers`. Bidirectional signal↔task link.
- **D-12:** After escalation, `status → escalated`; viewable under 'Escalated' filter with link to task.
- **D-13:** AI-surfaced signals = `ai_generated` write path only in P69. No real correlation engine.
- **D-14:** `read_signals` = SECURITY INVOKER RPC; per-dossier query; tested by direct invocation; agent wraps in P72.

### Claude's Discretion

- Category enum values (D-07) — finalized during planning.
- Confidence field type/range (D-08) — researcher's call (see RF-1 recommendation: `NUMERIC(3,2)` 0.00–1.00).
- Reversible-dismiss mechanism (D-04) — planner's call (recommendation: `status` value only, no `dismissed_at`).

### Deferred Ideas (OUT OF SCOPE)

- Real AI correlation/surfacing engine — later phase.
- `feed` ingestion — v7.1.
- Digests/alerts — Phase 70.
- Analytic graph — Phase 71.
- Mastra/CopilotKit/agent-runtime/vLLM — Phase 72.
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                              | Research Support                                                                              |
| --------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| SIGNAL-01 | User manually captures a signal and links to one or more dossiers                        | RF-1 data-layer decision; RF-3 junction ALTER; frontend `useCreateSignal` mutation pattern    |
| SIGNAL-02 | System records AI-surfaced signal linked to relevant dossier(s)                          | RF-1 `source_type = 'ai_generated'` write path; `ai_confidence` column; RF-2 clearance gating |
| SIGNAL-03 | User triages signal (acknowledge/dismiss/escalate) from keyboard-driven RTL-safe surface | Frontend patterns section; `IntakeQueue.tsx` keyboard model; RTL `useDirection` pattern       |
| SIGNAL-04 | User sees dossier's signals in dossier context, clearance-gated                          | RF-3 junction query; RF-5 `read_signals` RPC; per-dossier tab data filtering                  |
| SIGNAL-05 | User escalates signal into tracked work item                                             | RF-4 task create path; `work_item_dossiers` copy semantics; bidirectional link column         |
| SIGNAL-06 | Agent reads signals via clearance-gated `read_signals` tool                              | RF-5 RPC signature; INVOKER rule; `intelligence_event_dossiers` join for per-dossier          |

</phase_requirements>

---

## Summary

Phase 69 delivers intelligence signals as both an analyst inbox (keyboard triage, RTL-safe, per-dossier tab) and an agent tool (`read_signals`). The Phase 54 groundwork left two separate tables in an incompatible state: `intelligence_event` (raw-ingest shell, 0 rows, no title/sensitivity/status, admin/editor-only RLS) and an older `intelligence_signals` (0 rows, bilingual title/content, single `dossier_id` FK, no polymorphic junction, broken RLS — no SELECT policy). Neither table is in production use.

**The right path is to extend `intelligence_event` in place** (add `title`, `sensitivity_level`, `status`, `category`, `ai_confidence`) and retire/ignore `intelligence_signals`. `intelligence_event_dossiers` is the correct polymorphic junction and already covers all 7 live dossier types.

The clearance model (`profiles.clearance_level` integer 1–4, default 1) is confirmed live: 381 users at L1, 1 at L2, 11 at L3. The canonical comparison `sensitivity_level <= clearance_level` from migration `20251022000009` applies directly. Escalation uses the existing `tasks-create` edge function (caller JWT, RLS-enforced, `workflow_stage='todo'`, `sla_deadline`) followed by `work-item-dossiers` edge function to copy dossier links. `work_item_dossiers` INSERT policy currently gates on `work_item_type IN ('task','commitment','intake')` — signals need to be added or the escalation path must create the links under `type='task'` only (which it will, since it creates a task).

**Primary recommendation:** Extend `intelligence_event` in place via a single forward migration; keep `intelligence_event_dossiers` junction (add `elected_official` is not needed — live dossiers table only has 7 types, matching the junction exactly); new clearance-gated SELECT/INSERT/UPDATE policies replacing the current role-locked ones; `read_signals` as a SECURITY INVOKER function.

## Architectural Responsibility Map

| Capability                     | Primary Tier                                          | Secondary Tier       | Rationale                                                                                     |
| ------------------------------ | ----------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| Signal storage + clearance RLS | Database (Postgres + RLS)                             | —                    | All security enforcement is at the DB layer; clearance model lives there                      |
| Manual signal capture          | API / Edge Function                                   | Frontend form        | `tasks-create` pattern — edge fn under caller JWT for auth, RLS enforces tenant+clearance     |
| AI signal write path           | Edge Function (`signals-ingest` new)                  | Backend worker (P72) | Caller JWT required by INVOKER rule; background agents need explicit authz (out of P69 scope) |
| Triage queue (global)          | Browser / Client                                      | Frontend Server      | Pure client-side query + keyboard UX; no SSR needed for this surface                          |
| Per-dossier Signals tab        | Browser / Client                                      | —                    | Same query filtered by `dossier_id`; folded into existing dossier tab shell                   |
| Escalate → task                | Edge Function (`tasks-create`) + `work-item-dossiers` | —                    | Reuse existing canonical paths; caller JWT throughout                                         |
| `read_signals` RPC             | Database (INVOKER RPC)                                | —                    | SECURITY INVOKER: caller JWT propagates into RLS on `intelligence_event`                      |
| i18n chrome                    | Browser / Client                                      | —                    | Static-bundled; new `signals` namespace registration required                                 |

---

## RF-1: Signals Data-Layer Shape — DECISION

### What was found on live staging

**Query run:** `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('intelligence_signals','intelligence_event','intelligence_event_dossiers')`

**Result:** All three tables exist. Row counts: `intelligence_event = 0`, `intelligence_signals = 0`.

**`intelligence_signals` live schema (VERIFIED against staging):**

| Column                          | Type                       | Notes                       |
| ------------------------------- | -------------------------- | --------------------------- |
| `id`                            | uuid                       | PK                          |
| `dossier_id`                    | uuid NOT NULL              | Single FK — NOT polymorphic |
| `signal_type`                   | text NOT NULL              | Free text, no enum          |
| `source`                        | text NOT NULL              | Free text                   |
| `source_reliability`            | integer                    | Nullable                    |
| `source_url`                    | text                       | Nullable                    |
| `title_en`                      | text NOT NULL              | Bilingual pair              |
| `title_ar`                      | text                       | Nullable                    |
| `content_en`                    | text NOT NULL              | Bilingual pair              |
| `content_ar`                    | text                       | Nullable                    |
| `confidence_level`              | text DEFAULT 'unconfirmed' | Not an enum                 |
| `logged_at`                     | timestamptz                |                             |
| `logged_by`                     | uuid NOT NULL              |                             |
| `validated_at` / `validated_by` | timestamptz / uuid         |                             |
| `tags`                          | text[] DEFAULT '{}'        |                             |
| `impact_assessment`             | text                       |                             |
| `search_vector`                 | tsvector                   |                             |

**`intelligence_signals` RLS state (VERIFIED):** RLS enabled, but **NO SELECT policy** — authenticated users cannot read the table at all. INSERT policy: `logged_by = auth.uid()`. UPDATE: `logged_by = auth.uid() OR jwt->'role' = 'validator'`. This table is broken/incomplete and was never connected to a polymorphic junction.

**`intelligence_event` live schema (VERIFIED):** As per migration `20260516000002`. Columns: `id`, `organization_id`, `source_type` (USER-DEFINED = `signal_source_type` enum), `source_ref`, `content`, `occurred_at`, `ingested_at`, `severity` (text, CHECK low/medium/high/urgent), `created_by`, `created_at`. **No** `title`, `sensitivity_level`, `status`, `category`, `ai_confidence`.

### Decision: EXTEND `intelligence_event` IN PLACE

**Rationale:**

1. `intelligence_event` already has the `signal_source_type` enum (`human_entered`, `ai_generated`, `publication`, `feed`) — exact match to D-06/D-13.
2. `intelligence_event` already has `severity` (low/medium/high/urgent) — maps 1:1 to task `priority` for RF-4.
3. `intelligence_event_dossiers` is the correct polymorphic junction; built to link to `intelligence_event`.
4. `intelligence_signals` is architecturally incompatible (single `dossier_id`, bilingual title/content violating D-09, no severity, no source_type enum, no polymorphic junction, broken RLS). Both tables have 0 rows.
5. Extending in place avoids a cross-table join on every query and keeps the RPC simple.

**Columns to ADD via migration:**

```sql
ALTER TABLE public.intelligence_event
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sensitivity_level INTEGER NOT NULL DEFAULT 1
    CHECK (sensitivity_level BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'acknowledged', 'dismissed', 'escalated')),
  ADD COLUMN IF NOT EXISTS category TEXT
    CHECK (category IN ('political', 'economic', 'security', 'diplomatic', 'other')),
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2)
    CHECK (ai_confidence IS NULL OR (ai_confidence >= 0.00 AND ai_confidence <= 1.00)),
  ADD COLUMN IF NOT EXISTS escalated_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
```

**`title` default '' issue:** The NOT NULL + DEFAULT '' allows backfill of the 0 existing rows. Post-migration, all INSERT paths must supply a non-empty title.

**`ai_confidence`:** `NUMERIC(3,2)` gives range 0.00–1.00 with two decimal places (e.g. 0.85 for 85%). `NULL` for `human_entered` signals; required for `ai_generated`. The precision is enough for display as a badge percentage without floating-point noise. [ASSUMED — no prior standard in this codebase for AI confidence representation]

**`escalated_task_id`:** Bidirectional signal↔task link (D-11, D-12). Nullable FK to `tasks`. Set when status transitions to `escalated`. `ON DELETE SET NULL` preserves the signal if the task is deleted.

**Indexes to add:**

```sql
CREATE INDEX IF NOT EXISTS idx_intelligence_event_status
  ON public.intelligence_event (organization_id, status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_sensitivity
  ON public.intelligence_event (organization_id, sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_category
  ON public.intelligence_event (organization_id, category)
  WHERE category IS NOT NULL;
```

**`intelligence_signals` fate:** Leave in place (0 rows, no migration needed to drop it). The P69 migration does not touch it. A separate cleanup migration can drop it post-P69 if desired — out of scope.

---

## RF-2: Clearance Gating + Loosened Writes — DECISION

### Live state (VERIFIED via staging queries)

**Current `intelligence_event` RLS policies:**

- SELECT: `tenant_isolation.rls_select_policy(organization_id)` — org-scoped only, NO clearance gating.
- INSERT: `tenant_isolation.rls_insert_policy(organization_id) AND auth_has_any_role(['admin','editor'])` — role-locked.
- UPDATE: same role lock.
- DELETE: tenant-only (no role restriction).

**`profiles.clearance_level`:** INTEGER, DEFAULT 1, confirmed live. Distribution: 381 users at L1, 1 at L2, 11 at L3 (no L4 yet — reserved).

### Required policy changes (D-05)

**Drop all four existing policies** and replace with clearance-keyed versions. The canonical comparison from `20251022000009_update_polymorphic_refs.sql` L102 is:

```sql
sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
```

**New policies for `intelligence_event`:**

```sql
-- DROP existing
DROP POLICY IF EXISTS intelligence_event_select_org ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_insert_editor ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_update_editor ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_delete_admin ON public.intelligence_event;

-- SELECT: tenant-scoped + clearance-gated (indistinguishable empty on denial)
CREATE POLICY intelligence_event_select_clearance
  ON public.intelligence_event FOR SELECT
  TO authenticated
  USING (
    tenant_isolation.rls_select_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  );

-- INSERT: any cleared user (D-05) — can create signals at/below their clearance
CREATE POLICY intelligence_event_insert_cleared
  ON public.intelligence_event FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_isolation.rls_insert_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- UPDATE: owner or same-clearance triage (status/category changes)
CREATE POLICY intelligence_event_update_cleared
  ON public.intelligence_event FOR UPDATE
  TO authenticated
  USING (
    tenant_isolation.rls_update_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_isolation.rls_update_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  );

-- DELETE: admin-only (unchanged from prior intent — no need to loosen deletes)
CREATE POLICY intelligence_event_delete_admin
  ON public.intelligence_event FOR DELETE
  TO authenticated
  USING (tenant_isolation.rls_delete_policy(organization_id));
```

**`intelligence_event_dossiers` policy updates:** The junction INSERT/UPDATE currently uses `auth_has_any_role(['admin','editor'])`. This must be loosened to match the parent:

```sql
DROP POLICY IF EXISTS intelligence_event_dossiers_insert ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_insert
  ON public.intelligence_event_dossiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_insert_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS intelligence_event_dossiers_update ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_update
  ON public.intelligence_event_dossiers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  );
```

**SELECT on junction:** The current SELECT policy (`EXISTS` on parent's `rls_select_policy`) already inherits tenant scoping. After the parent SELECT policy adds clearance gating, the junction SELECT does NOT automatically inherit the clearance check — the parent join is only for tenancy. The junction SELECT must also be updated to add clearance on the parent:

```sql
DROP POLICY IF EXISTS intelligence_event_dossiers_select ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_select
  ON public.intelligence_event_dossiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_select_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  );
```

**Breakage risk:** Zero users are currently reading `intelligence_event` (0 rows). No existing INSERT/UPDATE callers since the admin/editor gate previously blocked all but privileged users. The policy rewrite is safe on an empty table.

---

## RF-3: Junction Reuse + Dossier Types — DECISION

### Live state (VERIFIED)

**`intelligence_event_dossiers` CHECK constraint (live staging):**

```
CHECK (dossier_type = ANY (ARRAY['country','organization','forum','engagement',
  'topic','working_group','person']))
```

**Live `dossiers.type` CHECK (VERIFIED):**

```
CHECK (type = ANY (ARRAY['country','organization','forum','engagement',
  'topic','working_group','person']))
```

**Live `dossiers` distinct types (VERIFIED):** country, engagement, forum, organization, person, topic, working_group — exactly 7, matching the junction CHECK.

**`elected_official` status:** The live `dossiers.type` CHECK does NOT include `elected_official` — it is stored as `type = 'person'` with a person subtype flag. This matches the CLAUDE.md note "EO=person_subtype". The CONTEXT.md concern about a type-set mismatch was about `intelligence_digest` (which has a different 7-type set excluding `engagement`) — the **junction table is correctly aligned** with all 7 live types.

### Decision: NO ALTER needed on `intelligence_event_dossiers`

The junction already covers all 8 "nominal" dossier types — the 8th (`elected_official`) resolves to `person` in the database. No schema change required for RF-3.

**Confirm signals must link to at least one dossier:** D-06 says signals link to one or more dossiers. The junction allows 0-n links per event — the application layer must enforce the "at least one" rule on create (NOT a DB CHECK; signals from AI ingestion might have 0 links initially, per D-13 scope).

---

## RF-4: Escalate Write Path — DECISION

### Live state (VERIFIED)

**Task create path (VERIFIED):** Edge function `tasks-create` at `supabase/functions/tasks-create/index.ts`. Accepts the caller's JWT (`Authorization` header → `createClient` with anon key + user JWT). Inserts directly to `tasks` table under the caller's JWT. RLS on `tasks`: INSERT policy ("Users can create tasks") allows any authenticated user to create tasks (no role check — [VERIFIED against live `pg_policies`]).

**`tasks` key columns (VERIFIED live):** `workflow_stage` (text), `sla_deadline` (timestamptz), `priority` (USER-DEFINED enum `task_priority`: `urgent,high,medium,low`), `assignee_id` (uuid), `source` (jsonb), `tenant_id` (uuid).

**Dossier link copy path (VERIFIED):** Edge function `work-item-dossiers` (invoked via `supabase.functions.invoke('work-item-dossiers', { body: request })`). The `work_item_dossiers_insert` policy gates on `work_item_type IN ('task','commitment','intake')` with the caller being `created_by`. Since escalation creates a `task`, then calls the dossier-link function with `work_item_type: 'task'` and the new task's ID, the RLS gate passes naturally.

**`severity` → `priority` mapping (VERIFIED):** Both use the same vocabulary: `low / medium / high / urgent`. It is a clean 1:1 mapping. `intelligence_event.severity` CHECK and `tasks.priority` enum both carry the same four values.

### Escalation write sequence

```
1. User presses 'e' → SignalEscalateDialog opens, pre-filled:
   title = signal.title
   description = signal.content (truncated to description field)
   priority = signal.severity (direct 1:1 map)
   assignee_id = current user (pre-filled, changeable)
   sla_deadline = optional

2. User confirms → frontend calls:
   a. POST tasks-create edge fn (caller JWT):
      { title, description, priority, workflow_stage: 'todo', assignee_id, sla_deadline? }
      → returns { task }

   b. POST work-item-dossiers edge fn (caller JWT):
      { work_item_type: 'task', work_item_id: task.id,
        dossier_ids: [signal_dossier_ids], inheritance_source: 'direct' }
      → creates dossier links on the task

   c. PATCH intelligence_event SET status='escalated', escalated_task_id=task.id
      WHERE id=signal.id (Supabase JS client, caller JWT — UPDATE policy allows if cleared)

3. UI: signal moves to 'Escalated' filter; task appears in Kanban
```

**Key constraint:** `tasks-create` requires `assignee_id` (NOT NULL in the edge fn validation, line 88). The escalate dialog must pre-fill the current user's ID and allow the analyst to change it. Unlike the full task-create form, this is the compact dialog pattern (D-10) — keep it to: title (editable), priority (pre-filled from severity), assignee (pre-filled as self), optional deadline.

**`work_item_dossiers` INSERT policy note:** The current policy also checks `tasks.created_by = auth.uid()` — so the dossier-link insert must happen immediately after task creation, before any other user could claim ownership. Sequential calls in the same request flow handle this correctly.

---

## RF-5: `read_signals` RPC Signature — DECISION

### Design

```sql
CREATE OR REPLACE FUNCTION public.read_signals(
  p_dossier_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_since TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  sensitivity_level INTEGER,
  severity TEXT,
  category TEXT,
  source_type TEXT,      -- cast from enum::text to avoid caller needing the enum type
  source_ref TEXT,
  ai_confidence NUMERIC,
  status TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  created_by UUID,
  escalated_task_id UUID,
  organization_id UUID
)
LANGUAGE SQL
SECURITY INVOKER
STABLE
AS $$
  SELECT
    ie.id,
    ie.title,
    ie.content,
    ie.sensitivity_level,
    ie.severity,
    ie.category,
    ie.source_type::text,    -- cast: avoid caller needing the signal_source_type enum
    ie.source_ref,
    ie.ai_confidence,
    ie.status,
    ie.occurred_at,
    ie.created_at,
    ie.created_by,
    ie.escalated_task_id,
    ie.organization_id
  FROM public.intelligence_event ie
  WHERE
    (p_dossier_id IS NULL OR EXISTS (
      SELECT 1 FROM public.intelligence_event_dossiers ied
      WHERE ied.event_id = ie.id AND ied.dossier_id = p_dossier_id
    ))
    AND (p_status IS NULL OR ie.status = p_status)
    AND (p_since IS NULL OR ie.occurred_at >= p_since)
  ORDER BY ie.occurred_at DESC
  LIMIT p_limit;
$$;
```

**Why SECURITY INVOKER:** The caller's JWT is used for all RLS checks. The `intelligence_event_select_clearance` policy applies automatically. A non-cleared user calling `read_signals` with `p_dossier_id` set to a dossier that has above-clearance signals receives an empty result — indistinguishable from a dossier with no signals (D-09 / Phase 68 D-09 inherited).

**42804 trap avoidance:** `source_type` is `USER-DEFINED` (the `signal_source_type` enum). Cast it to `::text` in the RETURNS TABLE output. The recurring `RETURNS TABLE text vs varchar(255)` 42804 trap (documented in MEMORY.md) applies here if any column derives from `auth.users.email` — this function does NOT join `auth.users` so no varchar trap applies. However, `source_type::text` cast is still required to avoid callers needing the enum definition.

**Per-dossier query (success criterion #5):** Pass `p_dossier_id` to get signals for a specific dossier. The `intelligence_event_dossiers` EXISTS subquery handles the polymorphic junction lookup.

**Triage RPC for status updates:** The `read_signals` RPC is read-only. Triage actions (acknowledge/dismiss) should use the Supabase JS client directly (`supabase.from('intelligence_event').update({status}).eq('id', id)`) under the caller's JWT, not a separate RPC — simpler and the UPDATE policy handles authorization.

---

## Standard Stack

### Core (already in repo — no new installs)

| Library                  | Purpose                           | Notes                                            |
| ------------------------ | --------------------------------- | ------------------------------------------------ |
| `@supabase/supabase-js`  | DB client + edge fn invocation    | Caller-JWT pattern established                   |
| `@tanstack/react-query`  | Server state + cache invalidation | Existing `queryClient.invalidateQueries` pattern |
| `@tanstack/react-router` | Route params for per-dossier tab  | Existing route tree                              |
| `react-i18next`          | Bilingual UI chrome               | New `signals` namespace required                 |
| Lucide React             | Icons for triage actions          | Already in repo                                  |

### No new packages needed

Phase 69 reuses 100% of the existing stack. The keyboard triage pattern, escalation dialog, and Supabase client are all established precedents.

## Package Legitimacy Audit

> No new external packages are installed in this phase. All dependencies are pre-existing in the repo.

**Packages removed due to slopcheck:** None
**Packages flagged as suspicious:** None

---

## Architecture Patterns

### System Architecture Diagram

```
User (Arabic/English)
        │
        ▼
/intelligence route (IntelligencePage.tsx)
   ├── [Reports tab — existing]
   └── [Signals tab — NEW]
              │
              ├── SignalsQueue (global, all dossiers)
              │      │
              │      ├── keyboard: j/k focus, a/d/e action
              │      └── SignalEscalateDialog (compact, pre-filled)
              │
              └── filter by dossier_id → same component
                     │
                     └── also rendered in DossierDetail Signals tab

All reads:
  supabase.rpc('read_signals', { p_dossier_id?, p_status?, p_since?, p_limit })
  ↓
  intelligence_event (SECURITY INVOKER → RLS clearance gate)
  + intelligence_event_dossiers (per-dossier filter)

All writes:
  supabase.from('intelligence_event').insert(...)   ← manual capture
  supabase.from('intelligence_event').update(...)   ← status change (triage)
  supabase.functions.invoke('tasks-create', ...)    ← escalate step 1
  supabase.functions.invoke('work-item-dossiers')   ← escalate step 2 (dossier link copy)
  supabase.from('intelligence_event').update({status:'escalated', escalated_task_id}) ← escalate step 3
  supabase.from('intelligence_event_dossiers').insert(...) ← link signal to dossier(s)
```

### Recommended Project Structure

```
frontend/src/
├── domains/signals/
│   ├── hooks/
│   │   ├── useSignals.ts          # read_signals RPC + TanStack Query
│   │   ├── useSignalMutations.ts  # insert/update/triage actions
│   │   └── useSignalEscalate.ts   # orchestrates 3-step escalate sequence
│   ├── types/
│   │   └── signal.types.ts        # Signal interface, status enum, category enum
│   └── index.ts
├── components/signals/
│   ├── SignalsQueue.tsx            # keyboard-driven triage list (mirrors IntakeQueue concept)
│   ├── SignalRow.tsx               # single row; receives focus via aria-selected
│   ├── SignalCaptureDialog.tsx     # manual create dialog
│   ├── SignalEscalateDialog.tsx    # compact escalate (mirrors EscalationDialog.tsx)
│   └── SignalStatusBadge.tsx       # new/acknowledged/dismissed/escalated badge
├── pages/intelligence/
│   └── IntelligencePage.tsx       # EXTEND: add Signals tab section
└── i18n/
    ├── en/signals.json            # NEW namespace
    └── ar/signals.json            # NEW namespace (full Arabic translation)

supabase/
├── migrations/
│   └── 20260614_phase69_signals_extend.sql  ← single forward migration
└── functions/
    └── (no new edge fns needed — reuse tasks-create + work-item-dossiers)
```

### Pattern 1: Keyboard Triage (mirror IntakeQueue.tsx)

**What:** `j`/`k` navigate focus between signal rows; `a`/`d`/`e` act on the focused signal. RTL-safe via logical arrow semantics (no physical left/right, only `j`/`k` for up/down in the list).

**IntakeQueue.tsx does NOT have keyboard navigation** — it uses click-only interactions. The existing `IntakeQueue.tsx` is the visual/data-loading template (filter state, query pattern, empty state handling), but the keyboard-inbox pattern must be built fresh, taking cues from the email-inbox mental model. The planner must implement `useEffect` + `keydown` listener with `useRef` for focused index.

```tsx
// Pseudocode: keyboard hook for SignalsQueue
const [focusedIndex, setFocusedIndex] = useState(0)

useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'j') setFocusedIndex((i) => Math.min(i + 1, signals.length - 1))
    if (e.key === 'k') setFocusedIndex((i) => Math.max(i - 1, 0))
    if (e.key === 'a') acknowledgeSignal(signals[focusedIndex]?.id)
    if (e.key === 'd') dismissSignal(signals[focusedIndex]?.id)
    if (e.key === 'e') openEscalateDialog(signals[focusedIndex])
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [focusedIndex, signals])
```

**RTL note:** `j`/`k` are LOGICAL (down/up in the list). They do not correspond to physical left/right — no `forceRTL` flip concern. The visual list flows top-to-bottom in both LTR and RTL.

### Pattern 2: Signal Capture (Supabase client direct insert)

```ts
// useSignalMutations.ts
const createSignal = useMutation({
  mutationFn: async (input: CreateSignalInput) => {
    const { data: ie, error } = await supabase
      .from('intelligence_event')
      .insert({
        organization_id: userOrgId,
        source_type: 'human_entered',
        content: input.body,
        title: input.title,
        occurred_at: new Date().toISOString(),
        severity: input.severity,
        sensitivity_level: input.sensitivityLevel,
        category: input.category,
        status: 'new',
        created_by: userId,
      })
      .select('id')
      .single()
    if (error) throw error

    // Link to dossiers
    if (input.dossierIds.length > 0) {
      const { error: junctionError } = await supabase.from('intelligence_event_dossiers').insert(
        input.dossierIds.map((did) => ({
          event_id: ie.id,
          dossier_type: input.dossierType, // must be known for each dossier
          dossier_id: did,
        })),
      )
      if (junctionError) throw junctionError
    }
    return ie
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: signalKeys.lists() }),
})
```

**Dossier type for junction insert:** The junction requires `dossier_type`. The capture UI must resolve this from the dossier record (from `dossiers.type`). When linking multiple dossiers, each may have a different type — the insert must supply the correct type per row.

### Pattern 3: `read_signals` hook

```ts
// useSignals.ts
export function useSignals(filters: SignalFilters = {}) {
  return useQuery({
    queryKey: signalKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('read_signals', {
        p_dossier_id: filters.dossierId ?? null,
        p_status: filters.status ?? null,
        p_since: filters.since ?? null,
        p_limit: filters.limit ?? 50,
      })
      if (error) throw error
      return data as Signal[]
    },
    staleTime: 60_000,
  })
}
```

### Pattern 4: IntelligencePage Tab Extension

The existing `IntelligencePage.tsx` renders a reports DataTable under a single surface with no tab structure. P69 must add a Signals tab/section. The simplest approach (respecting KISS) is to add a tab switcher at the top and render either the reports table or the signals queue based on active tab. This avoids a new route; D-01 specifies the signals queue folds into `/intelligence`, not a parallel route.

```tsx
// IntelligencePage.tsx — extend with tab state
const [activeTab, setActiveTab] = useState<'reports' | 'signals'>('reports')

return (
  <div>
    <TabBar>
      <Tab value="reports" active={activeTab === 'reports'} ... />
      <Tab value="signals" active={activeTab === 'signals'} ... />
    </TabBar>
    {activeTab === 'reports' && <ReportsSection />}
    {activeTab === 'signals' && <SignalsQueue />}
  </div>
)
```

Use the design system's tab pattern from `handoff/app.css` — not shadcn defaults.

### Anti-Patterns to Avoid

- **Do NOT add `textAlign: "right"` to Arabic text** — `forceRTL` flips it to LEFT. Use `writingDirection: 'rtl'` only, or `<bdi>` for inline mixed-direction signal body text.
- **Do NOT call `read_signals` as SECURITY DEFINER** — the entire clearance model relies on INVOKER.
- **Do NOT expose "filtered by clearance" in UI copy** — indistinguishable empty is the required posture.
- **Do NOT skip `::text` cast on `source_type` in the RPC** — it's a USER-DEFINED enum; callers will get a 42804 if the return type doesn't match.
- **Do NOT use `intelligence_signals` (the legacy table)** — it is architecturally dead.

---

## Don't Hand-Roll

| Problem                       | Don't Build                     | Use Instead                                                                                                        |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Clearance RLS                 | Custom clearance check function | `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())` inline per established pattern |
| Task creation                 | Custom task INSERT              | `tasks-create` edge function (caller JWT, validation, RLS)                                                         |
| Dossier link copy on escalate | Custom junction INSERT          | `work-item-dossiers` edge function via `useCreateWorkItemDossierLinks`                                             |
| Signal status update          | Custom RPC                      | Direct Supabase JS `supabase.from('intelligence_event').update()` under caller JWT                                 |
| Keyboard focus management     | Custom focus trap               | Standard DOM `addEventListener('keydown', ...)` + `useRef` for focused index                                       |

---

## Frontend Patterns to Mirror

### IntakeQueue.tsx

- **Filter state pattern** (`useState<Filters>` + `useQuery` keyed on filters) — mirror for `SignalFilters` (status category, severity, category).
- **Empty state** (`role="alert"` Card with `IntakeRoleEmptyState`-equivalent) — must be RTL-safe; for signals the empty state must NOT hint at clearance filtering.
- **Loading skeleton** (three `Card` with `animate-pulse`) — mirror exactly.
- **The queue does NOT have keyboard navigation** in `IntakeQueue.tsx` — that must be built fresh (see Pattern 1 above).
- **RTL dropdown alignment:** `align={isRTL ? 'start' : 'end'}` (line 311 of IntakeQueue.tsx) — copy this pattern for any dropdowns in `SignalsQueue`.

### EscalationDialog.tsx

Key points for `SignalEscalateDialog.tsx`:

- `dir={isRTL ? 'rtl' : 'ltr'}` on `DialogContent` (line 191).
- `ps-4 pe-4` logical padding (line 190) — never `pl`/`pr`.
- `DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3"` — button order in footer.
- `disabled={isLoading || !reason.trim()}` — guard against empty submit.
- The signal escalate dialog is simpler than the assignment escalation: no recipient hierarchy, just title + priority (pre-filled) + optional assignee + optional deadline + confirm. Omit the reason field (not required for signal escalation per D-10).

### IntelligencePage.tsx

- Uses `useTranslation()` with no explicit namespace (defaults to `translation`/`common`). The new Signals section must use `useTranslation('signals')` — registered namespace.
- The page uses `useDirection()` hook for `isRTL` — import the same hook.
- Current page has a `dir` on the outermost div (line 387) — the tab extension must preserve this.

### i18n Namespace Registration

**CRITICAL:** The new `signals` namespace must be registered in `frontend/src/i18n/index.ts` in BOTH the `en` and `ar` resource blocks. Unregistered namespaces silently fall back to English in BOTH languages — Arabic UI stays in English. This was the root cause of multiple prior bugs (documented in MEMORY.md).

Pattern (lines 256–512 of `i18n/index.ts`):

```ts
// Wave 0: add at top of file
import enSignals from './en/signals.json'
import arSignals from './ar/signals.json'

// In resources.en:
signals: enSignals,

// In resources.ar:
signals: arSignals,
```

The P68 CI guard (REMED-06) now catches missing registrations — the build will fail if the import is missing.

---

## Data Layer: Complete Migration Spec

**Migration file:** `supabase/migrations/20260614_phase69_signals_extend.sql`

```sql
-- Phase 69: Extend intelligence_event for structured signals
-- Apply via Supabase MCP to project zkrcjzdemdmwhearhfgg

-- 1. Add columns to intelligence_event
ALTER TABLE public.intelligence_event
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sensitivity_level INTEGER NOT NULL DEFAULT 1
    CHECK (sensitivity_level BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'acknowledged', 'dismissed', 'escalated')),
  ADD COLUMN IF NOT EXISTS category TEXT
    CHECK (category IN ('political', 'economic', 'security', 'diplomatic', 'other')),
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2)
    CHECK (ai_confidence IS NULL OR (ai_confidence >= 0.00 AND ai_confidence <= 1.00)),
  ADD COLUMN IF NOT EXISTS escalated_task_id UUID
    REFERENCES public.tasks(id) ON DELETE SET NULL;

-- 2. Indexes for triage queue performance
CREATE INDEX IF NOT EXISTS idx_intelligence_event_status
  ON public.intelligence_event (organization_id, status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_sensitivity
  ON public.intelligence_event (organization_id, sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_category
  ON public.intelligence_event (organization_id, category)
  WHERE category IS NOT NULL;

-- 3. RLS: replace role-locked policies with clearance-keyed policies (RF-2)

-- intelligence_event
DROP POLICY IF EXISTS intelligence_event_select_org ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_insert_editor ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_update_editor ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_delete_admin ON public.intelligence_event;

CREATE POLICY intelligence_event_select_clearance
  ON public.intelligence_event FOR SELECT TO authenticated
  USING (
    tenant_isolation.rls_select_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY intelligence_event_insert_cleared
  ON public.intelligence_event FOR INSERT TO authenticated
  WITH CHECK (
    tenant_isolation.rls_insert_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY intelligence_event_update_cleared
  ON public.intelligence_event FOR UPDATE TO authenticated
  USING (
    tenant_isolation.rls_update_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_isolation.rls_update_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY intelligence_event_delete_admin
  ON public.intelligence_event FOR DELETE TO authenticated
  USING (tenant_isolation.rls_delete_policy(organization_id));

-- intelligence_event_dossiers: loosen from role-locked to clearance-keyed
DROP POLICY IF EXISTS intelligence_event_dossiers_select ON public.intelligence_event_dossiers;
DROP POLICY IF EXISTS intelligence_event_dossiers_insert ON public.intelligence_event_dossiers;
DROP POLICY IF EXISTS intelligence_event_dossiers_update ON public.intelligence_event_dossiers;

CREATE POLICY intelligence_event_dossiers_select
  ON public.intelligence_event_dossiers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_select_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY intelligence_event_dossiers_insert
  ON public.intelligence_event_dossiers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_insert_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY intelligence_event_dossiers_update
  ON public.intelligence_event_dossiers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND ie.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
    )
  );

-- 4. read_signals SECURITY INVOKER RPC (RF-5)
CREATE OR REPLACE FUNCTION public.read_signals(
  p_dossier_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_since TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  sensitivity_level INTEGER,
  severity TEXT,
  category TEXT,
  source_type TEXT,
  source_ref TEXT,
  ai_confidence NUMERIC,
  status TEXT,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  created_by UUID,
  escalated_task_id UUID,
  organization_id UUID
)
LANGUAGE SQL
SECURITY INVOKER
STABLE
AS $$
  SELECT
    ie.id,
    ie.title,
    ie.content,
    ie.sensitivity_level,
    ie.severity,
    ie.category,
    ie.source_type::text,
    ie.source_ref,
    ie.ai_confidence,
    ie.status,
    ie.occurred_at,
    ie.created_at,
    ie.created_by,
    ie.escalated_task_id,
    ie.organization_id
  FROM public.intelligence_event ie
  WHERE
    (p_dossier_id IS NULL OR EXISTS (
      SELECT 1 FROM public.intelligence_event_dossiers ied
      WHERE ied.event_id = ie.id AND ied.dossier_id = p_dossier_id
    ))
    AND (p_status IS NULL OR ie.status = p_status)
    AND (p_since IS NULL OR ie.occurred_at >= p_since)
  ORDER BY ie.occurred_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.read_signals TO authenticated;

COMMENT ON FUNCTION public.read_signals IS
  'Phase 69: Clearance-gated signal read tool. SECURITY INVOKER — RLS on
   intelligence_event enforces sensitivity_level <= caller clearance_level.
   p_dossier_id: filter to one dossier via intelligence_event_dossiers junction.
   Returns empty (indistinguishable) when no signals meet clearance threshold.';
```

---

## Validation Architecture

### Test Framework

| Property    | Value                                           |
| ----------- | ----------------------------------------------- |
| Framework   | Vitest (unit/integration), Playwright (E2E/UAT) |
| Config file | `vitest.config.ts` (frontend)                   |
| Quick run   | `pnpm --filter frontend test --run`             |
| Full suite  | `pnpm test` (monorepo)                          |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                               | Test Type                         | Automated Command              | Notes                                                     |
| --------- | ---------------------------------------------------------------------- | --------------------------------- | ------------------------------ | --------------------------------------------------------- |
| SIGNAL-01 | Manual signal creates in `intelligence_event` + junction row           | Live UAT seed + observe           | Manual on staging              | 0-row table; seed then assert presence                    |
| SIGNAL-01 | Signal appears on per-dossier Signals tab                              | Live UAT                          | Manual on staging              | Verify dossier filter works                               |
| SIGNAL-02 | `ai_generated` signal with `ai_confidence` value appears in queue      | Live UAT seed                     | Manual on staging              | Seed via Supabase MCP INSERT                              |
| SIGNAL-02 | Above-clearance `ai_generated` signal hidden from lower-clearance user | CDP forced-error / role-flip test | Manual on staging              | Use second account at clearance 1                         |
| SIGNAL-03 | `j`/`k` navigation + `a`/`d`/`e` actions — keyboard only, Arabic mode  | Manual UAT (AR locale)            | Manual                         | Switch locale to AR, verify `dir=rtl`, verify j/k work    |
| SIGNAL-04 | Clearance gate: L1 user cannot see L3 signal (empty result, no hint)   | CDP forced-error protocol         | Manual                         | RLS denial → empty 200, assert `role="alert"` absent      |
| SIGNAL-05 | Escalate signal → task in Kanban + dossier links copied                | Live UAT                          | Manual                         | seed → e → confirm → check /kanban                        |
| SIGNAL-06 | `read_signals({ p_dossier_id })` returns only caller-clearance signals | Direct RPC invocation             | Manual via Supabase SQL editor | Seed L1 and L3 signals, call as L1 user, verify L3 absent |

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend typecheck && pnpm --filter frontend lint`
- **Per wave merge:** `pnpm --filter frontend test --run`
- **Phase gate:** Full suite green + all 6 UAT scenarios manually verified on staging (EN + AR) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/i18n/en/signals.json` — create with all keys before any component uses the namespace
- [ ] `frontend/src/i18n/ar/signals.json` — full Arabic translation before Wave 1 UAT
- [ ] `supabase/migrations/20260614_phase69_signals_extend.sql` — apply via Supabase MCP before any frontend code references the new columns
- [ ] `frontend/src/domains/signals/types/signal.types.ts` — base type definitions for all hooks

---

## Common Pitfalls / Landmines

### Pitfall 1: `source_type::text` cast in RPC (42804 trap)

**What goes wrong:** `RETURNS TABLE` column `source_type TEXT` — but the actual column is `USER-DEFINED` (`signal_source_type` enum). Without an explicit `::text` cast in the SELECT, Postgres raises error 42804 (type mismatch) at runtime. The function compiles but fails on first call.

**Why it happens:** Postgres enforces strict return type matching in `RETURNS TABLE`. Enum types are not implicitly castable to text in return position.

**How to avoid:** Always cast: `ie.source_type::text` in the function body. Already included in the migration spec above.

**Warning signs:** Error `ERROR: 42804: column "source_type" is of type signal_source_type but expression is of type text`. Documented in MEMORY.md as a recurring pattern on this codebase.

### Pitfall 2: i18n Namespace Not Registered

**What goes wrong:** New `signals` namespace used in components but not added to `frontend/src/i18n/index.ts`. The CI REMED-06 guard now fails the build. But if the import file exists but isn't registered in `resources`, the CI guard may still pass while runtime silently falls back to English for Arabic users.

**How to avoid:** Register in BOTH `resources.en` and `resources.ar` blocks in `i18n/index.ts`. Create both `en/signals.json` and `ar/signals.json` in Wave 0. Verify in Arabic locale that labels are Arabic (not English).

### Pitfall 3: Indistinguishable Empty — No "Filtered by Clearance" Copy

**What goes wrong:** Developer adds a helpful message like "Some signals may be hidden based on your clearance level." This violates the locked Phase 68 D-09 posture: a non-cleared user must NOT learn above-clearance content exists.

**How to avoid:** Empty state for signals queue must use generic copy ("No signals found" / "لا توجد إشارات"). No mention of clearance, filtering, or access levels in any user-visible string.

### Pitfall 4: `work_item_dossiers` INSERT Policy Type Gate

**What goes wrong:** The `work_item_dossiers_insert` policy checks `work_item_type IN ('task','commitment','intake')`. If the escalation accidentally sends a different `work_item_type` string (e.g. `'signal'`), the INSERT silently fails (RLS returns empty 200 — not a permission error). The dossier links are never created but no error surfaces.

**How to avoid:** Always pass `work_item_type: 'task'` when calling `work-item-dossiers` from the escalation path. The task was just created, so `work_item_type = 'task'` is correct. Validate the `work_item_type` value in `useSignalEscalate.ts` before calling the edge function.

### Pitfall 5: Junction `dossier_type` Must Match Live `dossiers.type`

**What goes wrong:** A signal is linked to a dossier whose type is fetched from `dossiers.type`. If the fetch returns a value not in the junction's CHECK constraint, the INSERT fails with a CHECK constraint violation. The live CHECK covers: `country, organization, forum, engagement, topic, working_group, person`. `elected_official` is stored as `person` — never appear as a raw dossier type.

**How to avoid:** When building the dossier multi-select for signal capture, always use `dossier.type` directly from the `dossiers` table (not a display label). The junction CHECK and the dossier table CHECK are aligned on the same 7 values.

### Pitfall 6: `escalated_task_id` FK + Tasks RLS

**What goes wrong:** Setting `escalated_task_id = task.id` requires the `intelligence_event` UPDATE to succeed. But the signal UPDATE policy checks clearance on `intelligence_event` — not on `tasks`. The FK reference to a task the user just created will succeed if the signal is within the user's clearance (which it must be, since they saw it in the queue). No circular dependency.

**Watch out for:** If `tasks` is later soft-deleted (`is_deleted = true`) but the FK is to `id` (not deleted), the `ON DELETE SET NULL` only fires on hard deletes. Soft-deleted tasks leave `escalated_task_id` pointing to a logically-deleted task. The Signals tab should handle this with a null-check on the task link display.

### Pitfall 7: `intelligence_signals` Legacy Table — Do Not Use

**What goes wrong:** A developer imports from or writes to `intelligence_signals` (the old table) because the name looks right. `intelligence_signals` has no SELECT policy — all reads silently return nothing. Inserts work (no role gate on INSERT) but are inaccessible to readers.

**How to avoid:** The P69 data layer is entirely on `intelligence_event` + `intelligence_event_dossiers`. Delete or comment any import of `intelligence_signals` if found in the codebase.

---

## State of the Art

| Old Approach                                              | Current Approach                                      | Impact                                        |
| --------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `intelligence_event` with admin/editor-only INSERT/UPDATE | Any-cleared-user INSERT/UPDATE (D-05)                 | Unlocks analyst self-service capture          |
| No `title`/`status`/`sensitivity_level` on events         | Columns added via forward migration                   | Enables triage lifecycle and clearance gating |
| `intelligence_signals` (old, bilingual, broken)           | Retire in place; use `intelligence_event`             | Eliminates split data layer confusion         |
| Tasks create via direct Supabase insert (some older code) | `tasks-create` edge function (caller JWT, validation) | Consistent auth + validation path             |
| Separate table per signal "type" in v6.x                  | Polymorphic junction (`intelligence_event_dossiers`)  | Links one signal to multiple dossier types    |

---

## Environment Availability

| Dependency                   | Required By                      | Available | Version                | Fallback |
| ---------------------------- | -------------------------------- | --------- | ---------------------- | -------- |
| Supabase staging             | All DB writes + RPC              | ✓         | PostgreSQL 17.6.1.008  | —        |
| `tasks-create` edge fn       | SIGNAL-05 escalation             | ✓         | Deployed               | —        |
| `work-item-dossiers` edge fn | SIGNAL-05 dossier link copy      | ✓         | Deployed               | —        |
| `profiles.clearance_level`   | All clearance gating             | ✓         | INTEGER, default 1     | —        |
| `signal_source_type` enum    | `intelligence_event.source_type` | ✓         | Confirmed live         | —        |
| `task_priority` enum         | tasks.priority                   | ✓         | low/medium/high/urgent | —        |

**Missing dependencies with no fallback:** None.

---

## Assumptions Log

| #   | Claim                                                                                                                                | Section            | Risk if Wrong                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `ai_confidence NUMERIC(3,2)` range 0.00–1.00 is the right type for AI confidence scores                                              | RF-1 data layer    | Could use `SMALLINT` (0-100) or `REAL` instead; impact is minor — schema change before any data exists is trivial                           |
| A2  | The `EscalationDialog.tsx` "reason" field is NOT needed in `SignalEscalateDialog` (D-10 says "compact")                              | RF-4 escalate path | If PM later wants a reason field, it's an additive change                                                                                   |
| A3  | `elected_official` dossiers are stored as `type='person'` in live `dossiers` table (based on CLAUDE.md + live query showing 7 types) | RF-3 junction      | If `elected_official` type is somehow added to `dossiers` post-P69, the junction CHECK would reject it — but this is a future-phase concern |

**All RF claims (RF-1 through RF-5) were verified against live staging via `supabase db query --linked` — tagged `[VERIFIED]`.**

---

## Open Questions

1. **Signal capture: single dossier vs. multi-dossier UI**
   - What we know: D-06 says "one or more dossiers"; junction supports N links.
   - What's unclear: Should the capture dialog use a multi-select dossier picker, or allow adding dossiers after creation?
   - Recommendation: Planner decides. A single optional primary dossier on create + "add more" post-create keeps Wave 1 scope tight.

2. **`status` filter tab labels in Arabic**
   - What we know: "New / Acknowledged / Dismissed / Escalated" in English.
   - What's unclear: Final Arabic translations for `new`/`acknowledged`/`dismissed`/`escalated` in analyst context.
   - Recommendation: Include in Wave 0 `ar/signals.json`. Draft: جديدة / مُستلمة / مُهملة / مُصعَّدة.

3. **Category enum finalization (D-07)**
   - What we know: Proposed set: `political / economic / security / diplomatic / other`.
   - What's unclear: User has not confirmed final set.
   - Recommendation: Planner uses the proposed set; mark it as pending user confirmation in the plan or carry it to the UI-SPEC as already resolved (69-UI-SPEC.md may have finalized it).

---

## Sources

### Primary (HIGH confidence — verified against live staging)

- Live staging DB `zkrcjzdemdmwhearhfgg` — `supabase db query --linked` queries (RF-1 through RF-5 all verified)
- `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql` — `intelligence_event` schema baseline
- `supabase/migrations/20260516000003_phase54_intelligence_event_dossiers.sql` — junction baseline
- `supabase/migrations/20251022000009_update_polymorphic_refs.sql` (L90–132) — canonical clearance RLS pattern
- `frontend/src/services/tasks-api.ts` (L26–50) — `CreateTaskRequest` shape
- `supabase/functions/tasks-create/index.ts` — task create edge function; confirmed caller-JWT

### Secondary (MEDIUM confidence — verified via code)

- `frontend/src/hooks/useCreateWorkItemDossierLinks.ts` — dossier link edge function invocation pattern
- `frontend/src/components/waiting-queue/EscalationDialog.tsx` — RTL dialog precedent
- `frontend/src/pages/IntakeQueue.tsx` — filter/query/loading pattern to mirror
- `frontend/src/pages/intelligence/IntelligencePage.tsx` — existing tab host to extend
- `frontend/src/i18n/index.ts` — namespace registration requirement + static-bundle pattern

### Tertiary

- `.planning/phases/68-ai-foundations-remediation/68-CONTEXT.md` — clearance model decisions (D-01 through D-09) [CITED: project file]
- `.planning/phases/69-signals/69-CONTEXT.md` — decisions D-01 through D-14 [CITED: project file]

---

## Metadata

**Confidence breakdown:**

- RF-1 (data layer shape): HIGH — verified via live staging table catalog + column inspection
- RF-2 (clearance RLS): HIGH — verified live policies + profiles.clearance_level distribution
- RF-3 (junction types): HIGH — verified live CHECK constraint vs. live dossiers.type values
- RF-4 (escalate write path): HIGH — verified tasks-create edge fn code + live tasks RLS + work_item_dossiers INSERT policy
- RF-5 (read_signals RPC): HIGH — derived from verified schema; no prior RPC to compare against
- Frontend patterns: HIGH — read actual source files
- i18n registration: HIGH — confirmed live pattern in i18n/index.ts

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable schema; expires sooner if Phase 70 migrations alter intelligence tables)
