# Phase 70: Digests + Alerts - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver recurring **intelligence digests** and threshold **alerts** as **both** an
analyst surface AND agent tools, all clearance-gated under the Phase 68 JWT keystone.
Covers requirements **DIGEST-01..04** and **ALERT-01..04**.

In scope:

1. **Digest subscription model** — a user subscribes/unsubscribes to a recurring digest
   scoped to a single dossier (any of the 8 types, incl. `topic`) (DIGEST-01).
2. **Recurring digest pipeline** — scheduled generation + delivery under service-role with
   explicit app-layer authz; each subscriber receives only clearance-appropriate content
   (DIGEST-02). Reuses the existing BullMQ repeatable-job + `email_queue` machinery.
3. **In-app digest reading** — rendered digests viewable in the `/intelligence` hub (DIGEST-03).
4. **`generate_digest` tool + manual on-demand** — a `SECURITY INVOKER` RPC (define + test by
   direct invocation now) plus a manual analyst "Generate digest now" preview→confirm→publish
   affordance (the human-in-the-loop). The Mastra agent wraps the same tool in P72 (DIGEST-04).
5. **Threshold alert engine** — an independent alert-rule object (target dossier + condition +
   channels); v1 condition = "new signal on a tracked dossier" + optional severity filter
   (ALERT-01); immediate delivery with a coalescing guard (ALERT-02).
6. **Pluggable channel adapter** — a `ChannelAdapter` interface with in-app, on-prem SMTP, and
   external webhook (Teams-compatible) adapters (ALERT-03); external payloads carry a
   deep-link + generic label only, zero classified content (ALERT-04).

Out of scope (deferred — do NOT pull forward):

- **AI-written digest narrative** — needs the on-prem LLM (P72) / generative-UI (P73). P70
  ships a deterministic rollup + the `generate_digest` tool contract only.
- **Mastra / CopilotKit agent** that _calls_ `generate_digest` (and any alert/digest agent
  tools) + the bilingual generative-UI HITL confirmation card → **P72 / P73**.
- **Count/window threshold alerts** (N-in-M) and **non-signal event triggers** (engagement /
  commitment / relationship) → post-v1 (the rule condition is stored structured to allow it).
- **"My tracked dossiers" combined digest** and **saved-filter subscriptions** → future (new models).
- **Team/role-owned subscriptions + fan-out** → future; v1 is personal-only.
- **External `feed` ingestion** → v7.1 (FEED-01).

</domain>

<decisions>
## Implementation Decisions

### Digest content & format

- **D-01:** **Digest content = signals + dossier activity rollup.** Each digest aggregates, for
  the subscribed dossier over the period: new/updated **signals** (P69) PLUS other dossier
  activity — new **engagements** (`engagement_dossiers`), **commitments due** (`aa_commitments`),
  and relationship/status changes. **Deterministic** (no LLM this phase). Each data plane is
  independently **clearance-gated per subscriber**.
- **D-02:** **Frequency presets = daily + weekly + monthly.** Reuse the existing BullMQ scheduler
  cadence pattern (`digest-scheduler.ts`: daily checks user timezone, weekly checks day-of-week);
  add a monthly cadence. (The existing personal-notification digest only has daily/weekly.)
- **D-03:** **Subscription target = a single dossier of any of the 8 types** (incl. `topic` —
  DIGEST-01's "dossier or topic" = any dossier). One subscription = one dossier, via the
  polymorphic junction pattern. _(Claude's discretion — user said "you decide".)_
- **D-04:** **Digest body = structured rollup rendered from data** (counts by category/severity +
  linked items), **bilingual chrome**, free-text items shown **as entered** (single-language —
  mirrors P69 D-09: no system translation, no `title_en`/`title_ar` pairs). `intelligence_digest.summary`
  holds a deterministic rendered/serialized summary; exact storage shape (extra columns vs a
  child digest-items table) = researcher/planner's call (RF-2).

### Alerts — trigger, model, delivery

- **D-05:** **v1 alert trigger = "new signal on a subscribed/tracked dossier" + optional severity
  filter** (only `high`/`urgent`). The "threshold" in ALERT-01 is satisfied by the severity
  filter. Store the rule **condition as structured config** (JSON/columns) so count/window and
  other-event rules can be added later without rework. Count-thresholds (N-in-window) and
  non-signal triggers are **deferred**. _(Claude's discretion — user said "you decide best for
  the project".)_
- **D-06:** **Alert = an independent alert-rule object** (target dossier + condition + channels +
  `is_active` + owner), **separate** from digest subscriptions. You can alert without a digest and
  vice-versa (reads like ALERT-01 "define a threshold alert").
- **D-07:** **Delivery = immediate, with a coalescing guard.** Deliver per matching event
  immediately, but coalesce dupes/bursts within a short window so a seed of N signals doesn't fire
  N deliveries per channel. (Window length = planner's call.)

### Channels & external payload

- **D-08:** **A new `ChannelAdapter` interface with 3 adapters** (in*app, on-prem SMTP email,
  webhook) for the v7.0 digest/alert dispatch, **reusing** the existing `email_queue` → `email-send`
  edge fn and in-app notifications under the hood. **Isolated** from the existing v4.0
  personal-notification dispatch (no regression). Fully realizes ALERT-03's "pluggable channel
  adapter". *(Claude's discretion — user said "you decide".)\_
- **D-09:** **External format = generic JSON envelope POSTed to a configured URL + a
  Teams-compatible card formatter** (a Teams incoming-webhook is the first supported consumer).
  The endpoint URL is still **TBD with the customer** (open todo).
- **D-10:** **External payload = deep-link + generic non-identifying label ONLY** (ALERT-04). NO
  dossier name, NO signal title, NO severity, NO counts — nothing that reveals content OR tracking
  interest (diplomatic need-to-know: even a dossier name leaks). The user authenticates in-app via
  the deep-link to see anything. This is a **hard contract** — the adapter MUST NOT expose a
  verbosity knob that could leak.

### Surfaces & subscriptions

- **D-11:** **Surfaces fold into the `/intelligence` hub** — Digests + Alerts as sections/tabs
  joining the P69 Signals + Reports tabs (consistent with P69 D-01 "one intelligence hub").
  Reading digests + viewing/managing alert rules live here.
- **D-12:** **Entry point = from the dossier + a central list.** A "Subscribe to digest" / "Add
  alert" control on the dossier page (in context — matches "everything starts with a dossier" +
  the P69 per-dossier Signals tab), with the full management list in `/intelligence`.
- **D-13:** **Ownership = personal only** in v1. A subscription/alert belongs to its creating
  user; each user manages their own. (Per-subscriber clearance gating makes personal the natural
  unit.) Team/role-owned subscriptions deferred.

### generate_digest tool (DIGEST-04)

- **D-14:** **Define the tool now + manual "Generate now" affordance** (mirrors P69 D-14 for
  `read_signals`). P70 builds the on-demand **`generate_digest` `SECURITY INVOKER` RPC**
  (generate → return preview; **publishes only on approval**) AND a manual analyst "Generate
  digest now" affordance (preview → confirm → publish = the human-in-the-loop). The Mastra agent
  **wraps the same RPC in P72**; the bilingual **generative-UI confirmation card is P73**. Success
  criterion #5's "via the agent surface" is satisfied in-spirit in P70 by direct-invocation test +
  the manual HITL affordance; agent-surface verification lands with P72/P73.

### Claude's Discretion

- **Subscription target granularity** (D-03) — chose single-dossier (any type).
- **v1 alert trigger set** (D-05) — chose new-signal + severity filter, with a structured
  condition for forward-compat; count/window + other events deferred.
- **Channel adapter structure** (D-08) — chose a new 3-adapter interface isolated from the
  personal-notification dispatch.
- **Digest body storage shape** (D-04), **coalescing window length** (D-07), **monthly cadence
  implementation**, and the **per-subscriber clearance generation mechanism** = planner/researcher.

### Carried forward — locked from prior phases (do NOT re-litigate)

- **Clearance:** single integer `sensitivity_level <= profiles.clearance_level` (1–4);
  `profiles.clearance_level` is the sole per-user source (P68 D-01/D-02).
- **Indistinguishable empty** on clearance denial — NO "filtered by clearance" messaging anywhere,
  incl. digests/alerts (P68 D-09). Reinforced by D-10 (external payloads).
- **Service-role only on cron/no-user paths with explicit app-layer authz** — the DIGEST-02 cron
  generator runs under service-role but MUST generate per-subscriber filtered to that subscriber's
  `clearance_level` (cross-cutting keystone). Mechanism = researcher's call (RF-3).
- **New RPCs `SECURITY INVOKER`**, never DEFINER.
- **Polymorphic dossier linking** via the junction pattern (`dossier_type` CHECK + EXISTS-via-parent RLS).
- **Single-language free-text storage + fully bilingual UI chrome** (P69 D-09).
- **Migrations via Supabase MCP** to staging `zkrcjzdemdmwhearhfgg`, committed as forward
  migrations. **Live UAT:** seed → observe → restore, EN+AR. RLS-denial verified via **CDP
  `Network.setBlockedURLs`** forced-error protocol (assert empty-state / `role="alert"`, not HTTP status).
- **Static-bundled i18n** — every new namespace registered in `src/i18n/index.ts` (P68 CI guard).

</decisions>

## Open Questions for Research (resolve before/during planning)

Factual gaps the researcher must close against **live staging** (`zkrcjzdemdmwhearhfgg`) and the live code:

- **RF-1 — On-prem SMTP transport (ALERT-03 keystone).** Confirm the actual transport behind
  `supabase/functions/email-send/index.ts` + the `email_queue`. ALERT-03 requires **on-prem SMTP**
  (no egress). If the current send path uses a cloud provider (e.g. Resend) or any external API,
  the SMTP adapter needs an on-prem transport (e.g. backend `nodemailer` → SMTP). NOTE: `backend/package.json`
  currently has **neither `nodemailer` nor `resend`** as a dep, and the `email-service.ts` cited in
  the (2026-03-23) INTEGRATIONS.md no longer exists — map the real send path before building the adapter.
- **RF-2 — `intelligence_digest` schema fit.** The existing table (`20260516000002`) is thin
  (per-dossier `summary` TEXT; tenant-RLS + editor-insert; **no subscription/frequency/clearance
  columns**; its `dossier_type` CHECK is 7 types **missing `elected_official`**). Decide: extend it
  (columns / child-items) + add a **digest-subscription table** + an **alert-rule table**; fix the
  CHECK to cover every dossier type signals/digests can target; converge RLS onto the canonical
  clearance pattern (`20251022000009`).
- **RF-3 — Per-subscriber clearance in the cron path.** Define the mechanism for the service-role
  digest generator to produce content filtered to **each subscriber's** `clearance_level`
  (DIGEST-02 SC#4) — e.g. per-subscriber query with an explicit clearance arg, or set-local request
  context. Must compose with the multi-plane content (signals + engagements + commitments +
  relationships), each clearance-gated, and never reveal above-clearance existence.
- **RF-4 — Reuse vs. new scheduler + delivery edge cases.** Confirm reuse of the existing BullMQ
  repeatable-job pattern (`digest-scheduler.ts` `upsertJobScheduler`, idempotent across tsx-watch
  reloads) + `email_queue` for the intelligence-digest cron; add the monthly cadence; resolve the
  **subscriber-deprovisioning** + **concurrent-delivery** edge cases flagged in research. Keep the
  v4.0 personal-notification digest path intact.
- **RF-5 — Alert trigger wiring.** Define how "new signal on a tracked dossier" is detected
  (Supabase Realtime / DB trigger / queue worker polling `intelligence_event` inserts) → resolves
  matching alert rules → dispatch, under the coalescing guard (D-07). Confirm it composes with
  clearance (a subscriber must NOT be alerted to an above-clearance signal — indistinguishable-empty).
- **RF-6 — `generate_digest` RPC signature.** Define the `SECURITY INVOKER` RPC (inputs:
  `dossier_id`, `period`; behavior: build → return preview; publish on approval) returning
  clearance-gated content under the caller JWT; confirm the manual "Generate now" affordance and
  (P72) the agent wrap both call the same RPC.

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & requirements (read first)

- `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` — locked decisions §2
  (platform-vs-feature: BOTH), cross-cutting guarantees §5 (cron + service-role + app-authz;
  on-prem fidelity / no egress), roadmap §4
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md` — architecture analysis (§2.5 JWT keystone)
- `.planning/REQUIREMENTS.md` — **DIGEST-01..04, ALERT-01..04** + "## Cross-Cutting Guarantees"
- `.planning/ROADMAP.md` → "### Phase 70: Digests + Alerts" — goal + 5 success criteria
- `.planning/phases/68-ai-foundations-remediation/68-CONTEXT.md` — canonical clearance model (1–4,
  `profiles.clearance_level`), INVOKER-only rule, indistinguishable-empty (D-09),
  service-role→cron+app-authz posture (D-08)
- `.planning/phases/69-signals/69-CONTEXT.md` — signals data model + statuses + severity vocab;
  D-14 agent-tool-now / agent-wraps-later precedent; junction + clearance patterns

### Existing digest/alert/notification infrastructure (the reuse surface)

- `backend/src/queues/digest-scheduler.ts` — BullMQ repeatable daily/weekly digest cron
  (`upsertJobScheduler`, tz / day-of-week checks, `email_queue` insert) — the cron pattern to
  mirror + extend with monthly (RF-4)
- `backend/src/queues/notification.processor.ts` — channel dispatch (in_app / email via
  `email_queue` / push), preference-gated — model the `ChannelAdapter` on this (D-08)
- `backend/src/services/notification.service.ts` — notification creation/dispatch service
- `backend/src/services/digest-template.service.ts` — digest rendering/templating (reuse for the
  D-04 structured rollup)
- `backend/src/services/email-template.service.ts` — bilingual email templates
- `backend/src/services/alerts.service.ts` — **in-memory `Map` stub** to replace with a DB-backed
  alert-rule model (D-05/D-06)
- `supabase/functions/email-send/index.ts` — the actual email send edge fn (confirm transport — RF-1)
- `backend/src/queues/notification.queue.ts`, `backend/src/queues/queue-connection.ts`,
  `backend/src/queues/deadline-scheduler.ts` — BullMQ wiring + a second repeatable-job precedent

### Signals data layer (digest/alert content + the alert trigger source)

- `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql` —
  `intelligence_event` (signals, extended in P69) + the thin **`intelligence_digest`** table
  (extend — RF-2) + `signal_source_type` enum
- `supabase/migrations/20260516000003_phase54_intelligence_event_dossiers.sql` — polymorphic
  `intelligence_event_dossiers` junction (dossier_type CHECK + EXISTS-via-parent RLS) — linking pattern
- `supabase/migrations/20260614_phase69_signals_extend.sql` — P69 signal extension
  (title / sensitivity_level / status / category / confidence + clearance RLS) — the content
  digests/alerts read
- `supabase/migrations/20251022000009_update_polymorphic_refs.sql` (≈L102/L119) — canonical
  clearance comparison `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())`

### UI surfaces to extend

- `frontend/src/routes/_protected/intelligence.tsx` + `frontend/src/pages/intelligence/IntelligencePage.tsx`
  — the `/intelligence` hub to fold Digests + Alerts tabs into (D-11), joining the P69 Signals tab
- `frontend/src/components/settings/sections/NotificationsSettingsSection.tsx`,
  `frontend/src/components/email/EmailDigestSettings.tsx`,
  `frontend/src/routes/_protected/settings/notifications.tsx`,
  `frontend/src/routes/_protected/settings/email-digest.tsx` — existing subscription/preference UI
  (do NOT conflate the **personal-notification** digest with the new **intelligence** digest)
- `frontend/src/components/notifications/*` (NotificationPanel/List/Item/Badge) — in-app channel
  rendering precedent

### Cross-cutting / conventions

- `CLAUDE.md` → "Dossier-Centric Development Patterns" (junction linking), "Work Management
  Terminology", design-token + RTL rules
- `frontend/src/i18n/index.ts` — static-bundled namespace registry (register new digests/alerts
  namespaces; P68 CI guard)
- `.planning/codebase/INTEGRATIONS.md` — BullMQ / email-SMTP / Redis / webhooks (dated 2026-03-23;
  reconcile email transport vs live — RF-1)
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md` — backend layering + known
  concerns (available; not read in full)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **BullMQ repeatable-job scheduler** (`digest-scheduler.ts` `upsertJobScheduler`) — idempotent
  across reloads; mirror for the intelligence-digest cron (daily/weekly/monthly).
- **`email_queue` + `email-send` edge fn** — the existing async email send path; the SMTP adapter
  routes through it (pending RF-1 transport confirmation).
- **`notification.processor.ts` channel dispatch** (in_app / email / push, preference-gated) — the
  model for the new `ChannelAdapter`; the in_app + email adapters wrap existing paths.
- **`digest-template.service.ts` + `email-template.service.ts`** — bilingual rendering/templating to
  reuse for the structured digest body + email.
- **`intelligence_event` (+ P69 extension) + `intelligence_event_dossiers` junction** — signal
  content + dossier linking for digests/alerts.
- **`intelligence_digest` table** — the (thin) digest store to extend (RF-2).
- **`/intelligence` hub + per-dossier Signals tab (P69)** — surfaces to extend (D-11/D-12).

### Established Patterns

- Cron/scheduled work = BullMQ repeatable jobs under **service-role + explicit app-layer authz** (keystone).
- New RPCs `SECURITY INVOKER`; polymorphic junction linking; clearance via
  `sensitivity_level <= profiles.clearance_level`.
- Migrations via Supabase MCP; live UAT seed→observe→restore EN+AR; CDP forced-error for RLS denial.
- Static-bundled i18n namespaces.

### Integration Points

- `/intelligence` hub — new Digests + Alerts tabs (D-11).
- Dossier page — "Subscribe to digest" / "Add alert" controls (D-12).
- `intelligence_event` inserts — the alert trigger source (RF-5).
- `email_queue` / `email-send` + in-app notifications — channel adapter under the hood (D-08).
- BullMQ — the digest cron + the alert coalescing worker.

</code_context>

<specifics>
## Specific Ideas

- **"Everything starts with a dossier"** — subscribe / add-alert from the dossier in context (D-12).
- **One intelligence hub** — Digests + Alerts join Signals + Reports in `/intelligence` (P69 D-01 continuity).
- **External payloads are deep-link-only with a generic label** — the diplomatic need-to-know floor;
  even a dossier name must not leak (D-10).
- **Verification bar** (milestone cross-cutting guarantee): subscribe two accounts at different
  clearance to the same dossier → each digest contains only within-clearance content; seed a signal
  on a tracked dossier → alert reaches in_app + on-prem SMTP + webhook; inspect the outbound webhook
  body on a MEDIUM-sensitivity signal → only a deep-link + generic label, zero content. EN+AR, live
  on staging.

</specifics>

<deferred>
## Deferred Ideas

- **AI-written digest narrative** — requires the on-prem LLM (P72) / generative-UI (P73); P70 ships
  the deterministic rollup + the `generate_digest` tool contract.
- **Count/window threshold alerts** (N-in-M) + **non-signal event triggers**
  (engagement / commitment / relationship) — the structured rule condition (D-05) leaves room; revisit post-v1.
- **"My tracked dossiers" combined digest** + **saved-filter subscriptions** — new models; future.
- **Team/role-owned subscriptions + fan-out** — v1 is personal-only (D-13).
- **Per-endpoint configurable external verbosity** — rejected for v1 (leak risk); deep-link-only is fixed (D-10).
- **Bilingual generative-UI HITL confirmation card** for `generate_digest` — P73.
- **Mastra / CopilotKit agent** wrapping `generate_digest` (+ alert/digest agent tools) — P72.

### Reviewed Todos (not folded)

- `p68-followup-supabaseadmin-background-agents.md` — "Audit supabaseAdmin in brief-generator.ts +
  intake-linker.ts (REMED-03 follow-up)". Reviewed and kept separate (also reviewed-not-folded in
  P69): a P68 security follow-up about background AI agents' service-role use; not about
  digests/alerts. The P70 cron path uses service-role + app-authz by design (keystone). Revisit as
  its own quick task or in P72 when the agent runtime lands.

</deferred>

---

_Phase: 70-Digests + Alerts_
_Context gathered: 2026-06-15_
