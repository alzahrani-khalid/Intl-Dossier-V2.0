# Phase 69: Signals - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver structured **intelligence signals** as **both** an analyst surface (manual
capture + keyboard-driven RTL triage + per-dossier Signals tab + escalate-to-work-item)
**and** an agent tool (`read_signals`) — all clearance-gated under the Phase 68 JWT
keystone. Covers requirements **SIGNAL-01..06**.

In scope:

1. **Signal data layer** — a clearance-gated signals model (title, body, sensitivity
   level, severity, category, source type, optional AI confidence, status) + polymorphic
   dossier links + clearance-RLS. Built on the v6.3 `intelligence_event` groundwork
   (SIGNAL-01, SIGNAL-02, SIGNAL-04).
2. **Manual capture** — any cleared user can create a signal and link it to one or more
   dossiers (SIGNAL-01).
3. **AI-surfaced write path** — establish the `ai_generated` source-type write path so a
   programmatically-created signal lands in the same surface, clearance-gated (SIGNAL-02).
4. **Triage surface** — a global, keyboard-driven, RTL-safe triage queue under
   `/intelligence`; the per-dossier Signals tab is the same data filtered (SIGNAL-03, SIGNAL-04).
5. **Escalate → work item** — escalate a signal into a tracked `task` visible on the
   Kanban board, with a bidirectional link (SIGNAL-05).
6. **`read_signals` agent tool** — a clearance-gated `SECURITY INVOKER` RPC defined and
   tested by direct invocation in P69; the agent wraps it in P72 (SIGNAL-06).

Out of scope (deferred — do NOT pull forward):

- The **real AI correlation / surfacing engine** (anything beyond the `ai_generated`
  write path) → later phase. P69 only establishes the source type + write path.
- **Digests + alerts** (subscriptions, cron delivery, channel adapters) → **Phase 70**.
- **Analytic graph** queries → **Phase 71**.
- **Mastra / CopilotKit / `agent-runtime` workspace / vLLM** — the agent that _calls_
  `read_signals` → **Phase 72**. P69 ships the tool/RPC only.
- **External `feed` ingestion** (the `feed` enum value stays dormant) → **v7.1** (FEED-01).

</domain>

<decisions>
## Implementation Decisions

### Triage surface & UX

- **D-01:** **One canonical signals data path.** A global triage queue is the primary
  surface, folded into the existing `/intelligence` workspace as a Signals section/tab
  (not a new top-level `/signals` route — consolidates the v7.0 intelligence surfaces;
  P70 digests/alerts and P71 graph join the same hub). The per-dossier **Signals tab**
  (SIGNAL-04) renders the **same data filtered to that dossier** — one query/component
  path, not two parallel implementations.
- **D-02:** **Email-style keyboard triage inbox.** `j`/`k` (logical, RTL-safe) move
  focus between signals; single keys act on the focused signal: `a` = acknowledge,
  `d` = dismiss, `e` = escalate. Mirror the existing `IntakeQueue.tsx` +
  `useWaitingQueueActions.ts` patterns. RTL-safe via logical navigation (no physical
  left/right assumptions).

### Triage lifecycle & permissions

- **D-03:** **Lean status lifecycle** — `new → acknowledged | dismissed | escalated`.
  Add a `status` column (none exists today). No separate `resolved`/`closed` state in P69.
- **D-04:** **Dismiss is reversible.** Dismissed signals move to a 'Dismissed' filter and
  can be restored to `new`/`acknowledged`. Status-based, nothing hard-deleted —
  auditable trail. (Implementation: status value vs. `dismissed_at` + restore — planner's call.)
- **D-05:** **Capture + triage = any cleared user (role-agnostic).** Any user who can
  _see_ a signal (within their clearance) can capture and triage it. This **LOOSENS** the
  existing `intelligence_event` admin/editor-only INSERT/UPDATE RLS to a clearance-gated
  model — the new write policies key off `sensitivity_level <= clearance_level`, not
  `auth_has_any_role`. (See RF-2.)

### Signal data model

- **D-06:** **Extend the schema** with `title`, `sensitivity_level` (integer on the
  canonical **1–4** scale), and `status` (D-03). Reuse existing columns: `content` (body),
  `severity` (low/medium/high/urgent), `source_type` (enum), `source_ref`, `occurred_at`,
  `created_by`. (Extend `intelligence_event` in place vs. a curated table layered on the
  raw event = researcher's call — RF-1.)
- **D-07:** **Fixed category enum** (small, e.g. `political / economic / security /
diplomatic / other` — exact values finalized in planning), **not** free-text tags. For
  at-a-glance scanning + queue filtering.
- **D-08:** **AI-confidence field** populated for `ai_generated` signals (shown as a
  badge), `null` for manual. Distinguishes AI suggestions from analyst-entered facts;
  supports later AI tuning. (Type/range = researcher's call.)
- **D-09:** **Single-language free-text** title/body (store **as entered** — no system
  translation, no paired `title_en`/`title_ar`, no stored language column). UI chrome
  (labels, statuses, empty states, buttons) is fully bilingual. Render mixed-direction
  free text via auto-`dir` / `<bdi>` (the language-tag storage option was declined).

### Escalation → work item

- **D-10:** **Compact escalate dialog** on `e`, pre-filled from the signal (title/body →
  task, `severity` → `priority`; assignee/deadline optional), confirm to create. Mirror
  the existing `EscalationDialog.tsx`. **Not** one-click, **not** the full task-create form.
- **D-11:** Escalation creates a work item of source **`task`** (`workflow_stage = todo`)
  so it appears on the Kanban board (success criterion #4). **Bidirectional signal↔task
  link**, and the signal's **dossier links copy to the task** via `work_item_dossiers` so
  context carries over.
- **D-12:** After escalation, signal **`status → escalated`**; it leaves the active queue
  but stays viewable under an 'Escalated' filter with a link to its work item.

### Scope confirmations (carried assumptions, accepted by user)

- **D-13:** **AI-surfaced signals in P69 = the `ai_generated` write path + source type
  only.** Verification seeds one programmatically. The real AI correlation/surfacing
  engine is a later phase (SIGNAL-02).
- **D-14:** **`read_signals` = a clearance-gated `SECURITY INVOKER` RPC/tool** defined and
  tested by **direct invocation** in P69; the Mastra agent wraps it in P72. Returns only
  signals at/below caller clearance; supports a per-dossier query (success criterion #5).

### Claude's Discretion

- **Category enum values** (D-07) — proposed set; finalize during planning.
- **Schema shape** (D-06) — extend `intelligence_event` in place vs. a curated triage
  table layered on the raw-ingest event → researcher's call (RF-1).
- **Confidence field type/range** (D-08) → researcher's call.
- **Reversible-dismiss mechanism** (D-04) → planner's call.

### Carried forward — locked from prior phases (do NOT re-litigate)

- **Clearance:** single integer `sensitivity_level <= profiles.clearance_level` (1–4);
  `profiles.clearance_level` is the sole per-user source (Phase 68 D-01/D-02).
- **Indistinguishable empty** on clearance denial — NO "filtered by clearance" messaging;
  a non-cleared account must not learn an above-clearance signal exists (Phase 68 D-09).
- **New RPCs are `SECURITY INVOKER`**, never DEFINER (v7.0 locked).
- **Polymorphic dossier linking** via the `intelligence_event_dossiers` junction pattern
  (dossier_type CHECK + EXISTS-via-parent RLS).
- **`signal_source_type` enum exists** (`publication`, `feed`, `human_entered`,
  `ai_generated`); P69 uses `human_entered` (manual) + `ai_generated`; `feed` stays dormant.
- **`severity` reuses work-item Priority vocab** (low/medium/high/urgent) — already on the
  table; maps 1:1 to task `priority` on escalation.
- **Migrations via Supabase MCP** to staging `zkrcjzdemdmwhearhfgg`, committed as forward
  migrations. **Live UAT:** seed → observe → restore, EN+AR. RLS-denial verified via
  **CDP `Network.setBlockedURLs`** forced-error protocol (RLS denial returns empty `200`s —
  assert on `role="alert"`/empty-state, not HTTP status).

</decisions>

## Open Questions for Research (resolve before/during planning)

Factual gaps the researcher must close against **live staging** (`zkrcjzdemdmwhearhfgg`):

- **RF-1 — Signals data-layer shape.** Does the curated `intelligence_signals` (plural)
  table actually exist on live staging? It is referenced only in v6.3 decision notes —
  **no `CREATE TABLE` migration was found**. Map it (if present) vs. `intelligence_event`
  (the raw-ingest shell). Decide and justify: **extend `intelligence_event` in place**
  (add title / sensitivity_level / status / category / confidence) **vs. a curated
  `intelligence_signal` triage table layered on the raw event**.
- **RF-2 — Clearance gating + loosened writes.** The existing `intelligence_event` RLS is
  **tenant + admin/editor-role only** and the table has **no `sensitivity_level` column**.
  Add `sensitivity_level` (1–4) + clearance-gated SELECT (`sensitivity_level <= clearance`),
  AND rewrite INSERT/UPDATE from admin/editor-only to **any-cleared-user** (D-05). Verify
  no existing reader/writer breaks; converge on the canonical clearance pattern in
  `20251022000009_update_polymorphic_refs.sql`.
- **RF-3 — Junction reuse + dossier types.** Confirm `intelligence_event_dossiers` fits
  signal↔dossier linking (SIGNAL-01/04). **Note a likely type-set mismatch:** the
  `intelligence_digest` CHECK lists 7 types **without `engagement`/`elected_official`** —
  verify the _junction's_ allowed `dossier_type` set covers all dossier types signals must
  link to, and that its EXISTS-via-parent RLS composes with clearance gating.
- **RF-4 — Escalate write path.** Confirm the canonical task-create path (edge fn / RPC)
  and `work_item_dossiers` insert semantics for copying dossier links **under the caller's
  JWT** (RLS-enforced). Confirm `severity → priority` is a clean 1:1 (both use
  low/medium/high/urgent).
- **RF-5 — `read_signals` RPC signature.** Define the `SECURITY INVOKER` RPC (filters:
  `dossier_id?`, `status?`, `since?`/limit) returning clearance-gated rows; confirm it
  composes with the junction for per-dossier queries (success criterion #5).

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & requirements (read first)

- `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` — locked
  decisions §2 (platform-vs-feature: BOTH), signals scope, cross-cutting guarantees §5
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md` — architecture analysis
  (§2.5 JWT keystone)
- `.planning/REQUIREMENTS.md` — **SIGNAL-01..06** + Cross-Cutting Guarantees
- `.planning/ROADMAP.md` → "### Phase 69: Signals" — goal + 5 success criteria
- `.planning/phases/68-ai-foundations-remediation/68-CONTEXT.md` — canonical clearance
  model (1–4, `profiles.clearance_level`), INVOKER-only RPC rule, indistinguishable-empty
  posture (D-09), legacy→canonical table repoint precedent (D-10)

### Signals data layer (the v6.3 groundwork to build on)

- `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql` —
  `intelligence_event` raw-ingest table (columns: `content`/`severity`/`source_type`/
  `source_ref`/`occurred_at`/`created_by`; **no title/sensitivity_level/status**) +
  `signal_source_type` enum + tenant/role RLS (the shell to extend — RF-1/RF-2)
- `supabase/migrations/20260516000003_phase54_intelligence_event_dossiers.sql` —
  polymorphic `intelligence_event_dossiers` junction (dossier_type CHECK + EXISTS-via-parent
  RLS) — the dossier-linking pattern (RF-3)
- `supabase/migrations/20251022000009_update_polymorphic_refs.sql` (≈L102/L119) — the
  canonical clearance comparison `sensitivity_level <= (SELECT clearance_level FROM
profiles WHERE id = auth.uid())` to apply to signals RLS

### UI patterns to mirror

- `frontend/src/pages/IntakeQueue.tsx` + `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts`
  — the keyboard-driven triage queue pattern (D-02)
- `frontend/src/components/waiting-queue/EscalationDialog.tsx` — the compact escalate-dialog
  precedent (D-10)
- `frontend/src/routes/_protected/intelligence.tsx` + `frontend/src/pages/intelligence/IntelligencePage.tsx`
  — the existing `/intelligence` workspace to fold the signals queue into (D-01)

### Escalation / dossier linking

- `CLAUDE.md` → "Work Management Terminology" (escalate creates a `task`, `workflow_stage`,
  `priority` vocab) + "Database Linking Pattern" (`work_item_dossiers` junction, D-11)

### Codebase maps (context)

- `.planning/codebase/CONCERNS.md`, `.planning/codebase/ARCHITECTURE.md`,
  `.planning/codebase/INTEGRATIONS.md` — AI/Supabase wiring (available; not read in full)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`intelligence_event` table + `signal_source_type` enum + `intelligence_event_dossiers`
  junction** (v6.3 Phase 54) — the foundation. `intelligence_event` is a raw-ingest shell
  (tenant + admin/editor RLS, no title/sensitivity/status); P69 extends it (or layers on
  it) and adds clearance gating.
- **`IntakeQueue.tsx` + `useWaitingQueueActions.ts`** — existing keyboard-triage queue to
  mirror for the email-style inbox (D-02).
- **`EscalationDialog.tsx`** (waiting-queue) — existing compact escalate-dialog pattern (D-10).
- **`/intelligence` route + `IntelligencePage.tsx`** — existing workspace (currently an
  intelligence-reports DataTable) to host the Signals section (D-01).
- **`work_item_dossiers` junction** — the established dossier-linking table; reuse to copy
  a signal's dossier links onto the escalated task (D-11).
- **Canonical clearance RLS pattern** (`20251022000009`) — converge signal RLS onto it (RF-2).

### Established Patterns

- **New RPCs `SECURITY INVOKER`** so retrieval honors caller RLS — `read_signals` + any
  triage RPC (locked across v7.0).
- **Polymorphic junction over per-type FKs** (`intelligence_event_dossiers`) for
  dossier links (v6.3 decision).
- **Migrations via Supabase MCP** to staging; **live UAT** seed→observe→restore EN+AR;
  **CDP forced-error** for RLS-denial verification.
- **Static-bundled i18n** — every new namespace registered in `src/i18n/index.ts`
  (unregistered → silent English fallback; CI guard added in P68).

### Integration Points

- `/intelligence` workspace — new Signals section/queue (D-01).
- Per-dossier Signals tab — filtered view of the same data (D-01, SIGNAL-04).
- Kanban / tasks — escalation target (D-11).
- `work_item_dossiers` — dossier-link propagation on escalate (D-11).
- Sidebar/Cmd+K — optional surfacing of the signals queue (planner's call).

</code_context>

<specifics>
## Specific Ideas

- **Email-style triage muscle memory** — `j`/`k` to move, `a`/`d`/`e` single-key actions.
  The triage surface should feel like an analyst inbox, not a CRUD table.
- **One data path, two views** — the global queue and the per-dossier Signals tab are the
  SAME query/component filtered, never two implementations (D-01).
- **"Indistinguishable empty" applies to signals** — a non-cleared account must not learn
  that an above-clearance signal exists on a dossier (inherited security posture, Phase 68 D-09).
- **Verification bar** (milestone cross-cutting guarantee): seed an above-clearance signal,
  prove it is hidden from a lower-clearance account via **both** the triage queue and the
  `read_signals` tool — live on staging, EN+AR; escalate → observe the task in Kanban;
  keyboard-only triage verified in Arabic mode.

</specifics>

<deferred>
## Deferred Ideas

- **Real AI correlation / surfacing engine** (beyond the `ai_generated` write path) — a
  later phase. P69 only establishes the source type + write path (D-13).
- **`feed` source ingestion** — the enum value stays dormant; external feeds are **v7.1**
  (FEED-01).

### Reviewed Todos (not folded)

- `p68-followup-supabaseadmin-background-agents.md` — "Audit supabaseAdmin in
  brief-generator.ts + intake-linker.ts (REMED-03 follow-up)". Reviewed and **kept
  separate**: a Phase 68 security follow-up about background AI agents' service-role use;
  only loosely related to Signals. Revisit as its own quick task or in P72 when the agent
  runtime + AI-surfacing path land.

</deferred>

---

_Phase: 69-Signals_
_Context gathered: 2026-06-14_
