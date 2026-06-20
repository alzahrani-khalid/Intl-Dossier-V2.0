# Feature Research — v7.0 Intelligence Engine

**Domain:** On-prem agentic intelligence layer for diplomatic-operations analysts
**Researched:** 2026-06-13
**Confidence:** HIGH — grounded in the approved design spec, architecture research, and verified Context7 docs
**Scope note:** Covers ONLY v7.0 net-new features (Phases 69–74). The AI foundations remediation (Phase 68) is infrastructure, not a user-facing feature; its behavioral requirements are prerequisites listed under dependencies below.

---

## Feature Area 1 — Intelligence Signal Capture + Triage (P69)

### What diplomatic-ops analysts actually triage

Diplomatic analysts do not triage raw information feeds — they triage **assessed events with provenance**. A "signal" in this domain is a structured diplomatic event with: who generated it (a human analyst or an AI correlation), what it refers to (one or more dossiers at a specific classification level), when it occurred, how confident the source is, and what action state it is in (new, acknowledged, dismissed, escalated). Concrete examples:

- A bilateral meeting has occurred that was not on the official calendar (human-entered, high sensitivity)
- An AI run detected that Country X's delegation rhetoric shifted in two recent engagements (ai_generated, links to 3 dossiers)
- A commitment deadline was missed and correlates with a known negotiating pattern (ai_generated + work_item correlation)
- A publication surfaced a person's public statement relevant to an active topic dossier (publication source, manual paste for v7.0; feed pull deferred to v7.1)

### Signal lifecycle / states

```
new → acknowledged → (dismissed | escalated | linked-to-work-item)
          ↑
    may be re-surfaced by a digest run
```

- `new` — captured, not yet seen by the responsible analyst
- `acknowledged` — seen, awaiting triage decision
- `dismissed` — analyst judged non-actionable; preserved for audit
- `escalated` — promoted to a work item or flagged for cross-dossier review
- Signals are never deleted; they are dismissed. The audit trail is permanent.

### Signal → dossier linking

Each signal links to one or more dossiers via the polymorphic `intelligence_signal_dossiers` junction (mirrors `work_item_dossiers` + partial-unique index pattern). A signal may be relevant to a country dossier AND two person dossiers AND one topic dossier simultaneously. Clearance-RLS on the junction enforces: a user with clearance level 2 cannot see a signal that only links to dossiers at sensitivity level 3.

### Triage surface behavior

The triage surface is a **scannable, keyboard-driven list**, not a Kanban board. Kanban is for workflow tasks with stages; signals have a triage verdict (dismiss/escalate), not a multi-step flow.

- **Column layout:** classification badge (color by sensitivity) | timestamp (day-first `Tue 28 Apr` format) | signal title in active language | source type pill (`AI` / `Human` / `Publication`) | linked dossier count | status badge
- **RTL layout:** In Arabic, the classification badge renders on the far right (first JSX child in flexDirection row), the timestamp and title in the middle, and the dismiss/escalate actions on the far left. No `.reverse()` — `forceRTL` handles it.
- **Keyboard nav:** `j`/`k` or arrow keys to move selection; `e` to escalate; `d` to dismiss; `Enter` to open detail drawer; `Cmd+K` to surface signal search
- **Bulk triage:** checkbox selection + bulk dismiss for low-priority batches
- **Filters:** by dossier type, by source type, by sensitivity level (only within the user's clearance), by date range
- **Detail drawer:** full signal body, all linked dossiers as `DossierContextBadge` components, provenance chain, dismissal/escalation history

### Table Stakes — Signals

| Feature                                        | Why Expected                                                                            | Complexity | Notes                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `intelligence_signal` table with clearance-RLS | Users expect their clearance to be enforced — over-classified signals must never appear | MEDIUM     | Needs canonical clearance scale (P68 prereq)                                      |
| Manual signal capture (create form)            | Analysts must be able to enter what they observe; no feed ingestion in v7.0             | LOW        | Reuse existing dossier form patterns; `signal_source_type = human_entered`        |
| Signal → dossier polymorphic links             | Every signal must be anchored to at least one dossier; unlinked signals are not useful  | LOW        | Mirror `work_item_dossiers` junction + partial-unique index                       |
| Signals triage list (keyboard-driven)          | The primary work surface; analysts triage dozens of signals in a session                | MEDIUM     | Dedicated `/signals` route + `--row-h` density tokens                             |
| Dismiss + escalate actions                     | The two atomic triage decisions; required for actionability                             | LOW        | `dismissed_at` + optional `work_item_id` FK on signal row                         |
| Signal visibility on dossier detail            | Analysts viewing a dossier must see its signals in the activity timeline                | MEDIUM     | Extend `DossierShell` timeline tab; reuse `SharedRecentActivityCard` pattern      |
| RTL-safe layout (Arabic triage)                | Arabic-first app; the triage surface is the most data-dense screen                      | MEDIUM     | Logical properties; no `textAlign: right`; `writingDirection: rtl` on signal text |
| AI-surfaced signal capture                     | Agent can call `read_signals` and create signals from correlation results               | MEDIUM     | `signal_source_type = ai_generated`; agent creates via its JWT (no service-role)  |

### Differentiators — Signals

| Feature                               | Value Proposition                                                                                       | Complexity | Notes                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| Cross-dossier signal correlation view | Analyst sees "these 3 signals all relate to the same underlying pattern"                                | HIGH       | Requires P71 graph queries + P72 agent; surface in triage detail                  |
| Confidence score display              | AI-generated signals carry a `confidence_score` (0–1); analysts weight their triage accordingly         | LOW        | Numeric field on signal table; color-coded pill in triage list                    |
| Signal-to-work-item escalation        | One click: signal becomes a linked work item with the signal as provenance                              | MEDIUM     | Reuses unified work item creation; `work_item_dossiers` junction handles the link |
| Bilingual signal text                 | AI-generated signals are authored in the analyst's active language; human signals are stored as-entered | MEDIUM     | `body_en` + `body_ar` columns or agent generates in both                          |

### Anti-Features — Signals

| Anti-Feature                                 | Why Avoid                                                                                 | What to Do Instead                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| External feed ingestion (RSS/APIs)           | Untrusted content / indirect-injection surface; scoped to v7.1                            | Manual paste + AI-surfaced only in v7.0                                       |
| Signal "severity levels" as a separate field | Redundant with `sensitivity_level` + `confidence_score`; analysts don't need a third axis | Use `sensitivity_level` (clearance-gated) + `confidence_score` (AI certainty) |
| Kanban-style signal workflow                 | Signals have a binary triage verdict, not a multi-stage flow; Kanban adds friction        | Keep triage as list + dismiss/escalate actions                                |
| Real-time push for every new signal          | Alert fatigue; analysts can't context-switch per signal                                   | Batch via digest cadence; use threshold alerts only for critical conditions   |
| Signal comments / threaded discussion        | Out of scope; operations chat is a cancelled feature                                      | Link signals to existing work items, which already have activity timelines    |

### Dependencies — Signals

- P68: Canonical clearance scale (required before RLS can be written correctly)
- P68: `supabaseAdmin` retired from agent path (required for correct JWT-bound signal creation)
- Existing: `signal_source_type` enum (`publication/feed/human_entered/ai_generated`) already on staging
- Existing: `intelligence_event` table + `intelligence_event_dossiers` junction (v6.3 groundwork; rename/extend to `intelligence_signal` per spec)
- Existing: `work_item_dossiers` polymorphic pattern — reuse for signal→dossier links
- P72 (later): `read_signals` agent tool consumes the signals table

---

## Feature Area 2 — Recurring Digests + Threshold Alerts (P70)

### How digests work in diplomatic-ops

A digest is a scheduled, scoped briefing sent to a defined subscriber list. In diplomatic-ops, digests serve two needs: **standing situational awareness** (e.g., "every Monday, send me a brief on all activity in the Gulf Cooperation Council topic dossier") and **cross-dossier synthesis** (e.g., "weekly digest of all signals across the 5 dossiers in the G20 engagement track").

The digest is not a notification — it is a generated artifact (like an existing AI briefing) with a delivery mechanism. The distinction matters for the data model: a digest is stored as a generated document with a `delivered_at` timestamp and a list of subscribers.

### Digest cadence and scope

- **Per-dossier digest:** the most common; scoped to one dossier's signals + work items + recent activity
- **Per-topic digest:** scoped to all dossiers tagged under a topic dossier
- **Cross-dossier digest:** analyst-curated list of dossiers (e.g., all bilateral relations with a specific country)
- **Cadences supported:** daily, weekly (default), monthly; custom CRON expressions are an anti-feature (see below)
- **Timezone:** analyst's profile timezone; displayed as `14:30 GST` format

### Threshold alerts

An alert fires when a specific condition is met, not on a schedule. Alert conditions in this domain:

- A new signal is created on a dossier the analyst explicitly tracks
- A signal is AI-generated with `confidence_score >= 0.85` on a high-sensitivity dossier
- A work item SLA (deadline) breach is detected and there is a correlated signal in the same dossier
- A VIP person dossier receives a signal within 72 hours of a calendar engagement involving that person
- A digest generation fails for a subscriber (operational alert to the admin)

Alerts must be **atomic** (one condition = one alert event, not a batched summary) and delivered as close to real-time as the channel permits.

### Subscriber model

- Any analyst with at least read clearance on a dossier can subscribe to its digest
- Subscription is per-analyst per-dossier-scope (not role-global)
- Subscriptions have a `channel` field: `in_app`, `email`, `external`
- An analyst can subscribe to the same digest on multiple channels
- An admin can configure organization-level defaults (e.g., all analysts auto-subscribed to the national-interest topic digest)
- Unsubscribe is self-service; subscription state is preserved through dossier renames

### Multi-channel delivery behavior

All three channels are supported in v7.0 via **pluggable channel adapters**:

**In-app channel:**

- Delivers to the existing notification center (bell icon, Operations Hub attention zone)
- Digest renders as a structured notification with a "View full digest" deep-link
- Alert renders as an urgent notification with direct link to the triggering signal/work-item
- Uses existing `BullMQ` queue + Supabase Realtime

**Email channel:**

- On-prem SMTP relay (not Resend cloud API); sovereignty requirement
- Bilingual HTML email template (same Tajawal font stack, same design tokens for heading/body, Arabic-first layout when `language=ar`)
- Digest email includes: subject in active language, classification banner at top and bottom (UPPERCASE mono), linked dossier names, signal summaries, work-item SLA table
- Alert email: subject contains the dossier name and alert type; body is single-focus, no digest padding
- Resend remains available as a configurable adapter for non-sovereign deployments

**External channel (webhook/Teams):**

- Outbound webhook to a government-approved endpoint (configured per-deployment, not per-user)
- Payload: JSON with digest/alert metadata + a deep-link URL; no classified content in the payload body (the recipient clicks through and authenticates)
- Teams adapter: Microsoft Teams incoming webhook format; sends a card with title, classification level, deep-link button
- The external endpoint is a Supabase-stored `external_channel_config`; changing it requires admin role

### Table Stakes — Digests + Alerts

| Feature                                | Why Expected                                                                     | Complexity | Notes                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Per-dossier weekly digest subscription | The minimum analysts expect from an "intelligence" system                        | MEDIUM     | Cron workflow (Mastra `createWorkflow` with `cron: '0 9 * * 1'`); service-role with explicit authz |
| New-signal alert on tracked dossiers   | Analysts must know immediately when something relevant is added                  | MEDIUM     | Supabase DB trigger → BullMQ queue → channel adapters                                              |
| In-app delivery channel                | All notifications already land in the bell; digest/alerts must too               | LOW        | Extend existing notification system + BullMQ                                                       |
| Email delivery channel                 | Analysts expect email for digests; it is how diplomatic institutions communicate | MEDIUM     | On-prem SMTP adapter; bilingual templates                                                          |
| Subscription self-service UI           | Analysts manage their own subscriptions                                          | LOW        | Settings page extension + per-dossier "Subscribe" action                                           |
| Digests/Alerts list UI                 | Analysts need to review past digests and alert history                           | MEDIUM     | Dedicated `/digests` route; table with status, channel, dossier, delivered-at                      |
| Clearance-gated digest content         | The generated digest must only contain signals the subscriber can see            | HIGH       | Digest cron runs under subscriber JWT or filters by subscriber's clearance at generation time      |

### Differentiators — Digests + Alerts

| Feature                                            | Value Proposition                                                                                   | Complexity | Notes                                                                            |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| Cross-dossier synthesis digest                     | "All activity across the Gulf engagement track this week" — not available in any generic system     | HIGH       | Requires P71 graph RPCs to determine which dossiers are related                  |
| VIP conflict alert (signal + calendar correlation) | Proactive warning before a diplomatic engagement, not after                                         | HIGH       | Requires signal table + calendar entries + engagement_participants; complex join |
| SLA correlation alert                              | Connects a missed deadline to a pattern of related signals                                          | HIGH       | Requires `work_item_dossiers` join + signal scan; P71 graph context helps        |
| External webhook/Teams adapter                     | Diplomatic institutions use Teams; meeting analysts where they work                                 | MEDIUM     | JSON payload + Teams card format; no classified content leaves the building      |
| Digest as a navigable document                     | Analysts can navigate from digest summary → each signal/work-item → dossier without leaving the app | MEDIUM     | Deep-links in digest body; `DossierContextBadge` in rendered digest              |

### Anti-Features — Digests + Alerts

| Anti-Feature                                   | Why Avoid                                                                           | What to Do Instead                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Custom CRON expressions per-user               | Security/operational risk; analysts are not cron administrators                     | Offer daily / weekly / monthly presets with timezone selection          |
| Classified content in external webhook payload | Data egress control; a Teams channel is outside the sovereign boundary              | Send deep-links only; recipient authenticates to view content           |
| Alert batching / digest-mode for alerts        | Defeats the purpose; alerts are time-critical by definition                         | Keep alerts atomic and immediate; the digest handles periodic summaries |
| Push notifications for digests                 | Push is appropriate for alerts; a weekly digest as a push notification is noise     | Push only for threshold alerts; digest delivery is in-app + email       |
| Digest "reply" or feedback mechanism           | Out of scope; in-app actions (escalate signal, assign work item) cover the workflow | Deep-link from digest to the relevant signal/work-item action           |

### Dependencies — Digests + Alerts

- P69: Signal table (digests aggregate signals; alerts fire on signal events)
- P68: Clearance scale (digest generation must filter by subscriber clearance)
- Existing: `intelligence_digest` table on staging (v6.3 groundwork; schema may need subscriber + channel columns)
- Existing: BullMQ queue (already used for notification delivery in v4.0)
- Existing: Resend email integration (repurposed as SMTP-adapter fallback)
- Existing: Notification preferences tables (extend for digest subscription channel preferences)
- P71 (later): Cross-dossier digest needs graph RPCs for scope resolution
- `generate_digest` and `dismiss_signal` agent tools (delivered in P70 for HITL use in P73)

---

## Feature Area 3 — Analytic Graph Queries (P71)

### What first-class analytic graph queries mean

The existing React Flow network graph is a **static visualization** — it renders dossier relationships that already exist in the relational schema. P71 adds **queries over that graph**: pattern-matching across the relationship layer to surface non-obvious connections.

Diplomatically meaningful queries:

- "Who sits on which forum?" → `person_dossiers JOIN forum_dossiers` through the working-group dimension
- "Which organizations share committee membership with Organization X?" → multi-hop traversal through forum → working_group → organization
- "Show all engagements involving Country A and Country B that span more than 30 days" → engagement chains with time-delta predicates
- "Which persons appear across both the GCC and the Arab League topic dossiers?" → set intersection over person→dossier links
- "Which signals are connected to dossiers that share a forum?" → graph-to-intelligence layer join

These are not simple FK lookups — they are recursive/multi-hop traversals that benefit from purpose-built `SECURITY INVOKER` RPCs with clearance predicates baked in.

### Surfacing in the Network panel

The existing React Flow visualization gains a **query palette**:

- A dropdown of pre-defined query templates (the 5 above + user-defined)
- Query parameters (e.g., the specific forum, the N-day threshold)
- The result is rendered as a filtered/highlighted subgraph on the existing canvas
- "Export this subgraph" → adds to the briefing export pack (ties to P62 export functionality)
- In RTL, the query palette renders on the right edge of the canvas (first JSX child)

### Surfacing in Cmd+K

Cmd+K gains an "Analyze" intent category:

- "Who connects Country X and Forum Y?" → fires the shared-committee RPC and renders results as a list of `UniversalDossierCard` components
- "Show engagement chains longer than 30 days involving [person]" → fires the engagement-chain RPC
- Results include deep-links into dossier detail pages and a "View in graph" action
- All Cmd+K graph results are clearance-gated (the RPC enforces it)

### `query_graph` agent tool

The agent tool wraps the same INVOKER RPCs. The agent can call `query_graph({ type: 'shared_committees', organizationId: '...', clearance: jwt.clearance })` and receive structured results. The tool never calls a `SECURITY DEFINER` function — clearance is enforced at the DB level by the user's JWT.

### Table Stakes — Analytic Graph

| Feature                                                                                          | Why Expected                                                                              | Complexity | Notes                                                                                                    |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `SECURITY INVOKER` analytic RPCs (who-sits-on-which-forum, shared committees, engagement chains) | The "network graph" is a core product promise; analytic queries are the logical next step | HIGH       | PostgreSQL recursive CTEs + clearance predicate; `SECURITY INVOKER` is non-negotiable                    |
| Clearance-RLS enforcement at RPC level                                                           | Analyst must not see above-clearance nodes even in graph traversal                        | HIGH       | `WHERE d.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())` in every RPC |
| Network panel query palette                                                                      | Visual surface for graph queries; the existing React Flow canvas is the host              | MEDIUM     | Extends `frontend/src/routes/_protected/graph.tsx`                                                       |
| Cmd+K "Analyze" intent                                                                           | Analysts already use Cmd+K as the command surface; graph queries belong there             | MEDIUM     | New `analyze` intent category in the Cmd+K registry                                                      |
| `query_graph` agent tool                                                                         | The agent must be able to answer "who connects to whom" questions                         | MEDIUM     | Mastra `createTool` wrapping the INVOKER RPCs; runs under user JWT                                       |

### Differentiators — Analytic Graph

| Feature                          | Value Proposition                                                                                        | Complexity | Notes                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| Signal-correlated graph view     | "Show me dossiers connected to this signal's actors" — the intelligence layer + the graph layer together | HIGH       | Requires P69 signals + P71 graph RPCs; surface in signal detail drawer |
| User-defined saved queries       | Analysts save frequently-used graph queries with custom names                                            | MEDIUM     | `saved_graph_queries` table; load from Cmd+K or Network panel          |
| Graph result → digest trigger    | "Monitor this graph query weekly" → creates a cross-dossier digest subscription                          | HIGH       | Connects P70 digest + P71 graph; complex orchestration                 |
| Engagement chain timeline export | Export an engagement chain as a chronological PDF for briefing packs                                     | MEDIUM     | Extends P62 export pack; uses existing PDF generation                  |

### Anti-Features — Analytic Graph

| Anti-Feature                                                             | Why Avoid                                                                                     | What to Do Instead                                                                                         |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `SECURITY DEFINER` analytic RPCs                                         | Bypasses clearance — the exact failure mode we are fixing in P68                              | All analytic RPCs use `SECURITY INVOKER`                                                                   |
| Arbitrary `execute_sql` agent tool                                       | Allows the agent to run any query; catastrophic if prompt-injected                            | Narrow typed tools only; `query_graph` is the only graph-access tool                                       |
| Graph layout algorithms (force-directed, hierarchical) as a v7.0 feature | React Flow already handles layout; algorithm customization is a cosmetic concern              | Keep existing React Flow layout; v7.0 adds query overlays, not layout changes                              |
| External graph database (Neo4j, Dgraph)                                  | Adds a second datastore, a second clearance model to sync, and operational complexity         | All graph traversal stays in PostgreSQL recursive CTEs on the existing pgvector-extended Supabase instance |
| Real-time graph updates (live SSE graph)                                 | At current scale, polling on query result is sufficient; live graph adds WebSocket complexity | Refresh on query execution; Supabase Realtime triggers can refresh on dossier_relationships table changes  |

### Dependencies — Analytic Graph

- Existing: `dossier_relationships` table (hub-and-spoke from v3.0)
- Existing: `engagement_dossiers`, `engagement_participants` (v6.6 wired to canonical tables)
- Existing: `position_dossier_links` (v6.6 Phase 65)
- Existing: React Flow network graph route (`frontend/src/routes/_protected/graph.tsx`, Phase 63)
- P68: Clearance scale (RPC predicate must compare on a canonical type)
- P72 (later): `query_graph` agent tool consumes these RPCs

---

## Feature Area 4 — Agentic Copilot UX (P72 reads + P73 writes + generative UI)

### What the copilot does

The copilot is the analyst's peer — it can read and act on everything the analyst can see (and nothing more). It is the **primary conversational surface** for intelligence questions ("What signals did we receive about Country X this week?", "Who connects the GCC and the Arab League?", "Generate a briefing for this engagement"), and it can **drive dossier actions** with the analyst confirming each state change.

### Entry points

- **Cmd+K as the primary conversational surface:** the existing Cmd+K palette gains a "Ask" mode that routes to the agent. The analyst types a natural-language question; the agent returns results as inline generative UI cards, not raw text. This is the main discovery path.
- **Per-dossier in-context copilot:** a floating "Ask about this dossier" affordance on the `DossierShell` renders the copilot scoped to the current dossier's context (via `useCopilotReadable` injecting the dossier metadata as context)
- **Signals triage assist:** in the signal triage list, a "Explain this signal" action opens the copilot scoped to the selected signal
- **Dedicated copilot route:** a full-panel `/copilot` route for extended conversations

### AG-UI event stream → generative UI rendering

The copilot renders **token-bound bilingual cards**, not generic chat bubbles. This is the hard behavioral requirement:

- When the agent returns a list of dossiers, it renders `UniversalDossierCard` components (not plain text)
- When the agent returns a signal, it renders a signal-summary card with linked dossier badges (`DossierContextBadge`)
- When the agent returns a work item, it renders the existing work-item card variant
- When the agent proposes a HITL action (create work item, publish digest, dismiss signal), it renders a bilingual confirmation card with Approve / Reject buttons
- All cards use `var(--*)` tokens, `1px solid var(--line)`, `var(--row-h)`, no raw hex, no card shadows
- In Arabic, the confirmation card's primary action (Approve) renders on the right (`flex-start` in RTL = right edge)

### Human-in-the-loop behavioral contract

Every state-changing action uses Mastra's `suspend()`/`resume()` pattern surfaced through CopilotKit's `renderAndWaitForResponse`. The flow:

1. Agent proposes an action (e.g., "Create a work item linked to this signal: [summary]")
2. A bilingual confirmation card renders in the chat surface with the proposed action details
3. The card has two buttons: Approve (رفع / Approve) and Reject (رفض / Reject)
4. The card **stays rendered** until the analyst responds (`respond()` is called)
5. On Approve: the write tool executes under the analyst's JWT (RLS applies); the result is confirmed in the chat
6. On Reject: the action is discarded; the agent continues without executing
7. No write ever commits without analyst approval — this is enforced by the architecture (HITL wraps every write tool)

### Bilingual agent response behavior

- Agent answers in `i18n.language` (the analyst's active language, passed in `forwardedProps`)
- Arabic responses use Tajawal font; the chat container sets `dir="rtl"` when Arabic
- Code snippets, dossier names in Latin script, and external identifiers are wrapped in `dir="ltr"` isolation
- The system prompt is bilingual — the agent is instructed to reason in Arabic when `language=ar`, not translate from English
- `chat-assistant.ts` already has a `language?: 'en' | 'ar'` field (line 41); this is the wire

### Table Stakes — Copilot

| Feature                                                     | Why Expected                                                                    | Complexity | Notes                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| JWT-propagation keystone (agent never uses service-role)    | The entire security model depends on this; without it, clearance is meaningless | HIGH       | P68 prereq; retire `supabaseAdmin` in `chat-assistant.ts` before P72 lands                  |
| Read tools over signals, digests, graph (P69–71 data)       | The copilot is only as good as the data it can read                             | MEDIUM     | `read_signals`, `query_graph`, `get_digest` Mastra tools                                    |
| Cmd+K "Ask" mode                                            | The existing Cmd+K is the analyst's fastest entry point                         | MEDIUM     | New `ask` intent category; routes to agent runtime                                          |
| Generative UI — token-bound cards                           | Generic chat bubbles do not meet the design contract                            | HIGH       | `renderAndWaitForResponse` + `useCopilotAction` for each card type                          |
| Arabic response generation                                  | Arabic-first app; the copilot must answer in Arabic                             | HIGH       | System prompt instructs Arabic reasoning; Gemma 4 12B or Qwen3.5 as brain; eval gate in P74 |
| RTL-safe chat surface                                       | Arabic chat must flow right-to-left with Tajawal                                | MEDIUM     | `dir="rtl"` on chat container; logical properties; `LtrIsolate` for code/identifiers        |
| In-app session isolation (per-analyst JWT)                  | Two analysts must not see each other's agent context                            | MEDIUM     | `persistSession: false, autoRefreshToken: false` on per-request Supabase clients            |
| Option-C thin-slice spike (validates AG-UI loop before GPU) | De-risks the entire P72 before committing to vLLM + re-embed                    | MEDIUM     | Custom AI-SDK + Ollama + AG-UI bridge; converges to Mastra/Option A config-level            |

### Differentiators — Copilot

| Feature                                                                        | Value Proposition                                                                                 | Complexity | Notes                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| Per-dossier in-context copilot                                                 | The agent knows which dossier the analyst is on without being asked                               | MEDIUM     | `useCopilotReadable` injects dossier metadata as hierarchical context                  |
| Generative UI deep-links into dossiers                                         | Agent responses that cite dossiers are clickable, navigating the analyst directly to that dossier | MEDIUM     | TanStack Router link generation in the card component                                  |
| Signal triage assist                                                           | "Explain why this signal matters" — contextual help during the highest-stakes analyst workflow    | MEDIUM     | Scoped copilot invocation with signal ID in context                                    |
| Write tools with HITL (create/link work items, generate brief, publish digest) | The agent can act, not just answer; the analyst retains control                                   | HIGH       | Mastra `suspend()`/`resume()` + `renderAndWaitForResponse`; every write under user JWT |
| `STATE_DELTA` → TanStack Query cache sync                                      | Conventional screens and the copilot stay consistent; no manual refresh                           | MEDIUM     | AG-UI `STATE_DELTA` JSON-Patch events reconciled into TanStack Query cache             |

### Anti-Features — Copilot

| Anti-Feature                                                       | Why Avoid                                                                                  | What to Do Instead                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Generic `execute_sql` agent tool                                   | A prompt-injected SQL tool can exfiltrate any data; catastrophic                           | Narrow typed tools only; each does one scoped DB op                              |
| Service-role in any interactive agent path                         | Bypasses RLS; the anti-pattern being retired from `chat-assistant.ts`                      | JWT-bound per-request Supabase client on every tool                              |
| Agent writing without HITL                                         | No autonomous writes; every state change requires analyst approval                         | `renderAndWaitForResponse` wraps every write tool                                |
| CopilotKit's built-in `CopilotSidebar`/`CopilotChat` chrome        | Shadcn-flavored, not RTL-documented, not token-bound                                       | Headless AG-UI client rendering our own token-bound components                   |
| Streaming raw markdown in the chat                                 | Markdown rendering in RTL is inconsistent; raw text does not meet design standards         | Structured generative UI cards for data; plain `text-ink` prose for explanations |
| Multi-agent orchestration (agent spawning sub-agents autonomously) | Adds concurrency/observability complexity without analyst-visible value in v7.0            | Single agent with multiple tools; multi-agent can be a v7.1 concern              |
| Persistent agent memory across analysts                            | Memory across users creates cross-contamination risk; each analyst's thread is independent | Per-analyst Mastra threads keyed by `auth.uid()`; no shared memory state         |

### Dependencies — Copilot

- P68: JWT keystone + `supabaseAdmin` retirement + bilingual eval harness scaffolding
- P69: `intelligence_signal` table + `read_signals` tool
- P70: Digest pipeline + `generate_digest`/`dismiss_signal` tools
- P71: Analytic RPCs + `query_graph` tool
- P72: `agent-runtime` Turborepo workspace + vLLM + Gemma 4 12B + TEI + bge-m3 1024-dim re-embed
- P73: Write tools + `renderAndWaitForResponse` HITL + generative UI rendering
- Existing: Cmd+K palette (`frontend/src/components/CommandPalette`)
- Existing: `DossierContextBadge`, `UniversalDossierCard`, `DossierShell` (used as generative UI card components)
- Existing: `mastra-config.ts` (`defineAgent`/`createAgentTools`) — lift into `agent-runtime` workspace
- Existing: `src/i18n/index.ts` static bundle — any new i18n namespace for copilot strings must be registered here

---

## Feature Area 5 — Bilingual LLM Eval Harness (P74)

### What the eval harness does

The eval harness is a **CI regression gate** — it fails a PR if the LLM's Arabic quality, briefing accuracy, or signal correlation accuracy drops below a threshold. It is not a dashboard (that is Langfuse/Phoenix); it is a `vitest` job that runs in CI on a pre-seeded test dataset.

### Eval rubrics — behavioral specification

**Briefing quality rubric (EN + AR):**

- Given a dossier with known signals and work items, the agent generates a briefing
- Rubric scores: factual accuracy (does the briefing contain only information from within the clearance-gated data?), completeness (does it cover all high-confidence signals?), conciseness (under 500 words per section?), and language appropriateness (EN briefings must not contain Arabic; AR briefings must use formal Modern Standard Arabic, not colloquial)
- Implemented via Mastra's `@mastra/evals` scorer pattern (`createNoiseSensitivityScorerLLM` or a custom LLM-graded scorer using Phoenix as the judge)
- CI threshold: briefing quality score `>= 0.80` for both EN and AR; PR fails if either drops

**Correlation accuracy rubric:**

- Given a set of signals linked to known dossiers, the agent's correlation tool is asked to identify which signals are related
- Ground truth: a hand-labeled test dataset of signal→dossier relationships
- Metric: precision + recall on the identified relationships
- CI threshold: `precision >= 0.75` and `recall >= 0.70`

**Arabic quality rubric:**

- Given a set of diplomatic-domain prompts in Arabic, the agent responds in Arabic
- Rubric scores: grammar (is the Arabic grammatically correct MSA?), register (formal diplomatic register, not casual), transliteration avoidance (no Latin script for Arabic-origin words), and diacritics/RTL rendering (no broken Arabic text)
- Implemented as an LLM-graded eval using a reference judge (Fanar-2 or a curated GPT-4 response set)
- CI threshold: Arabic quality score `>= 0.75`; PR fails if below

### AnythingLLM retirement

The eval gate lands concurrently with AnythingLLM decommission. The retirement sequence:

1. Feature-flag the Mastra-backed paths for: search suggestions, dashboard digest, AI assistant
2. Flip each flag in staging; run the eval harness and smoke test
3. Remove the AnythingLLM provider, MCP server entry (`.mcp.json`), and Docker Compose service
4. CI gate confirms zero AnythingLLM calls on the critical path (grep on network traces or module import audit)

### Table Stakes — Eval Harness

| Feature                                           | Why Expected                                                                                                 | Complexity | Notes                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------- |
| Briefing quality rubric (EN + AR) wired as CI job | Without a gate, Arabic quality can regress silently with every model update                                  | HIGH       | Vitest job; Arize Phoenix as judge; runs on pre-seeded staging data    |
| Correlation accuracy rubric wired as CI job       | Signal correlation is a core product capability; silent regression = analysts trust wrong data               | HIGH       | Precision/recall on hand-labeled ground-truth dataset                  |
| Arabic quality rubric wired as CI job             | Arabic-first app; Arabic regressions are invisible to EN-only developers                                     | HIGH       | LLM-graded MSA quality + register + transliteration avoidance          |
| Langfuse self-host (tracing + prompt registry)    | Satisfies the "prompt registry + audit trail" requirement; tracks which prompt version fired on each request | MEDIUM     | Adds ClickHouse to the Docker Compose footprint; zero telemetry egress |
| Arize Phoenix self-host (offline eval)            | Provides the eval judge and visualization for human review of rubric failures                                | MEDIUM     | Complementary to Langfuse; feeds from OTel                             |
| AnythingLLM retirement                            | Clears the critical path; one fewer service to maintain                                                      | MEDIUM     | Feature-flag each surface; retire service after each flag flips green  |

### Differentiators — Eval Harness

| Feature                            | Value Proposition                                                                                                        | Complexity | Notes                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------- |
| Model swap CI test                 | When a new model version (Gemma 4 12B → Qwen3.5 → Fanar-2) is tested, the eval harness compares quality before promoting | MEDIUM     | Mastra model comparison pattern; parameterize the model in the CI job |
| Eval-driven model selection        | The harness decides which model serves Arabic vs English tasks based on measured quality, not assumptions                | HIGH       | Requires running the full eval set against each candidate model       |
| Prompt version tracking (Langfuse) | Every prompt change is versioned; a regression is traceable to the exact prompt commit                                   | MEDIUM     | Langfuse prompt registry + OTel trace linking                         |

### Anti-Features — Eval Harness

| Anti-Feature                                       | Why Avoid                                                                    | What to Do Instead                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Live production data in eval runs                  | Privacy/clearance violation; live data must not enter the CI environment     | Pre-seeded, sanitized staging dataset only                                                   |
| Human review as the only quality gate              | Human review does not scale; CI is the sustainable gate                      | CI gate as the mandatory gate; human review is supplementary via Langfuse/Phoenix dashboards |
| External telemetry egress (cloud Langfuse/Phoenix) | Data sovereignty; all AI traces stay on-prem                                 | Self-host both; ClickHouse for Langfuse is the accepted cost                                 |
| Eval rubrics in a foreign language only            | Arabic-only rubrics miss EN regressions; EN-only rubrics miss AR regressions | Separate rubric runs per language with per-language thresholds                               |

### Dependencies — Eval Harness

- P68: `mastra-config.ts` + OTel scaffolding (Langfuse/Phoenix wiring starts here)
- P72: vLLM + Gemma 4 12B serving (the model under test must be running)
- P73: Write tools + HITL (the full agent capability is what the eval tests)
- Existing: Vitest (unit/integration test runner already in use)
- Existing: Staging environment (`zkrcjzdemdmwhearhfgg`) + seed data

---

## Feature Dependencies (Cross-Area)

```
P68 AI Foundations Remediation
    ├── canonical clearance scale ──────────────────────────────┐
    ├── embedding integrity (bge-m3 1024-dim, no pad/truncate) ─┤
    ├── JWT keystone (retire supabaseAdmin) ────────────────────┤
    └── eval harness scaffolding (Langfuse + Phoenix OTel) ─────┤
                                                                 ↓
P69 Signals ──────────────────────────────────────────── requires P68 clearance scale
    ├── intelligence_signal table + clearance-RLS
    ├── signal→dossier polymorphic junction
    ├── manual + AI-surfaced capture
    └── read_signals agent tool ──────────────────────────── consumed by P72 agent
                                                                 ↓
P70 Digests + Alerts ──────────────────────────────────── requires P69 (signals to aggregate)
    ├── digest pipeline (cron, service-role + explicit authz)
    ├── alert threshold engine
    ├── subscriber model
    ├── channel adapters (in-app, SMTP, webhook/Teams)
    └── generate_digest / dismiss_signal agent tools ──────── consumed by P73 writes
                                                                 ↓
P71 Analytic Graph ───────────────────────────────────── requires P68 clearance scale
    ├── SECURITY INVOKER clearance-aware analytic RPCs
    ├── Network panel query palette
    ├── Cmd+K Analyze intent
    └── query_graph agent tool ────────────────────────────── consumed by P72 agent
                                                                 ↓
P72 Agent Platform: Reads ────────────────────────────── requires P69 + P70 + P71 data layer
    ├── agent-runtime workspace (Mastra + CopilotKit)
    ├── vLLM + Gemma 4 12B + TEI (parallel infra track)
    ├── bge-m3 1024-dim re-embed
    ├── JWT-propagation read tools
    └── Option-C spike → converge to Mastra/Option A
                                                                 ↓
P73 Agent Platform: Writes + Generative UI ──────────── requires P72
    ├── HITL write tools (suspend/resume under user JWT)
    └── generative UI (token-bound bilingual cards + deep-links)
                                                                 ↓
P74 Eval Gate + AnythingLLM Retirement ──────────────── requires P72 + P73 (tests the full agent)
    ├── EN/AR eval rubrics as CI vitest jobs
    └── AnythingLLM decommission (feature-flag → flip → retire)
```

**Key dependency note:** P69, P70, and P71 are data-layer features that can be built in parallel with the P72 infra track (vLLM + TEI stand-up). The agent is only as good as the data it reads; build the data layer first so P72's first-run agent has real substance.

---

## Phase-to-Feature Mapping

| Phase | REQ-ID prefix | Feature area                       | Table stakes delivered                                                                                         | Differentiators unlocked                                                                |
| ----- | ------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| P69   | SIG-0x        | Signal capture + triage            | Manual capture, polymorphic links, clearance-RLS, triage list, dossier timeline integration                    | Confidence score, signal-to-work-item escalation, `read_signals` tool                   |
| P70   | DIG-0x        | Digests + Alerts                   | Per-dossier digest, new-signal alert, in-app + email delivery, subscription UI                                 | Cross-dossier digest, VIP conflict alert, SLA correlation alert, external webhook/Teams |
| P71   | GRAPH-0x      | Analytic graph queries             | 3 clearance-aware INVOKER RPCs, Network panel query palette, Cmd+K Analyze, `query_graph` tool                 | Signal-correlated graph view, saved queries, engagement chain export                    |
| P72   | AGENT-R-0x    | Agent reads                        | JWT keystone, read tools, Cmd+K Ask mode, RTL copilot surface, Option-C spike                                  | Per-dossier in-context copilot, signal triage assist                                    |
| P73   | AGENT-W-0x    | Agent writes + generative UI       | HITL write tools, token-bound bilingual cards, deep-links, `STATE_DELTA` cache sync                            | Write-to-digest, write-to-work-item, dossier-briefing generation via agent              |
| P74   | EVAL-0x       | Eval gate + AnythingLLM retirement | Briefing quality rubric CI, correlation accuracy rubric CI, Arabic quality rubric CI, AnythingLLM decommission | Model swap CI test, eval-driven model selection, prompt version tracking                |

---

## Prioritization Matrix

| Feature                                                  | User Value | Implementation Cost | Phase | Priority                |
| -------------------------------------------------------- | ---------- | ------------------- | ----- | ----------------------- |
| Canonical clearance scale (P68 prereq)                   | HIGH       | MEDIUM              | 68    | P0 — gates all RLS      |
| JWT keystone / retire supabaseAdmin                      | HIGH       | MEDIUM              | 68    | P0 — live security hole |
| Signal capture (manual)                                  | HIGH       | LOW                 | 69    | P1                      |
| Signal triage list (keyboard, RTL)                       | HIGH       | MEDIUM              | 69    | P1                      |
| Signal → dossier polymorphic links + clearance-RLS       | HIGH       | MEDIUM              | 69    | P1                      |
| Per-dossier digest (weekly, email)                       | HIGH       | MEDIUM              | 70    | P1                      |
| New-signal alert (in-app + email)                        | HIGH       | MEDIUM              | 70    | P1                      |
| Clearance-aware analytic RPCs                            | HIGH       | HIGH                | 71    | P1                      |
| Agent read tools (read_signals, query_graph, get_digest) | HIGH       | MEDIUM              | 72    | P1                      |
| Cmd+K Ask mode                                           | HIGH       | MEDIUM              | 72    | P1                      |
| Arabic response generation (agent)                       | HIGH       | HIGH                | 72    | P1                      |
| HITL write tools                                         | HIGH       | HIGH                | 73    | P1                      |
| Generative UI token-bound cards                          | HIGH       | HIGH                | 73    | P1                      |
| Arabic quality eval rubric (CI gate)                     | HIGH       | HIGH                | 74    | P1                      |
| Cross-dossier digest                                     | MEDIUM     | HIGH                | 70    | P2                      |
| VIP conflict alert                                       | MEDIUM     | HIGH                | 70    | P2                      |
| Network panel query palette                              | MEDIUM     | MEDIUM              | 71    | P2                      |
| Per-dossier in-context copilot                           | MEDIUM     | MEDIUM              | 72    | P2                      |
| External webhook/Teams adapter                           | MEDIUM     | MEDIUM              | 70    | P2                      |
| Correlation accuracy eval rubric                         | MEDIUM     | HIGH                | 74    | P2                      |
| Signal-correlated graph view                             | LOW        | HIGH                | 71    | P3                      |
| Graph result → digest trigger                            | LOW        | HIGH                | 70+71 | P3                      |
| Saved graph queries                                      | LOW        | MEDIUM              | 71    | P3                      |
| Model swap CI test                                       | LOW        | MEDIUM              | 74    | P3                      |

---

## Sources

- `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` — locked decisions (§1–§4), deferred scope (§6)
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md` — architecture research (§2.1–§2.5, §4.3)
- `.planning/seeds/v7.0-intelligence-engine.md` — original feature seed + open questions
- `.planning/PROJECT.md` — existing capabilities (do not re-research); constraints
- Context7 / Mastra docs — `createTool`, `suspend()`/`resume()`, `createWorkflow` with cron, `sendSignal`, `@mastra/evals` scorer patterns
- Context7 / CopilotKit docs — `useCopilotReadable`, `useCopilotAction`, `renderAndWaitForResponse`, HITL contract
- Context7 / CopilotKit docs — `useHumanInTheLoop` hook behavioral spec
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md §2.5` — JWT propagation pattern + per-request Supabase client idiom

---

_Feature research for: v7.0 Intelligence Engine — diplomatic-operations agentic intelligence layer_
_Researched: 2026-06-13_
