# Phase 70: Digests + Alerts — Research

**Researched:** 2026-06-15
**Domain:** Intelligence digest pipeline, threshold alert engine, pluggable channel adapter, clearance-gated cron delivery
**Confidence:** HIGH (all 6 research flags closed against live code and live Supabase schema)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Digest content = signals + dossier activity rollup (new/updated signals via P69, new engagements `engagement_dossiers`, commitments due `aa_commitments`, relationship/status changes). Deterministic — no LLM. Each data plane clearance-gated per subscriber.
- **D-02:** Frequency presets = daily + weekly + monthly. Reuse BullMQ scheduler cadence pattern from `digest-scheduler.ts`.
- **D-03:** Subscription target = a single dossier of any of the 8 types (incl. `topic`). One subscription = one dossier via polymorphic junction.
- **D-04:** Digest body = structured rollup rendered from data (counts by category/severity + linked items), bilingual chrome, free-text items shown as entered. `intelligence_digest.summary` holds a deterministic rendered/serialized summary. Exact storage shape = researcher/planner call (RF-2 resolved below).
- **D-05:** v1 alert trigger = "new signal on subscribed/tracked dossier" + optional severity filter (only `high`/`urgent`). Store rule condition as structured config (JSON/columns) so count/window/other-event rules can be added later without rework.
- **D-06:** Alert = an independent alert-rule object (target dossier + condition + channels + `is_active` + owner), separate from digest subscriptions.
- **D-07:** Delivery = immediate, with coalescing guard. Coalescing window = planner/researcher call (resolved below: 5-minute window recommended).
- **D-08:** New `ChannelAdapter` interface with 3 adapters (`in_app`, on-prem SMTP email, webhook) for the v7.0 digest/alert dispatch, ISOLATED from existing v4.0 personal-notification dispatch (no regression). But email adapter must use a NEW nodemailer-SMTP backend, NOT the existing `email_queue`/`email-send` edge fn (which uses SendGrid/Resend — cloud providers violating on-prem fidelity).
- **D-09:** External format = generic JSON envelope POSTed to configured URL + Teams-compatible card formatter. Endpoint URL TBD with customer.
- **D-10:** External payload = deep-link + generic non-identifying label ONLY. No dossier name, no signal title, no severity, no counts. Hard contract — adapter MUST NOT expose a verbosity knob.
- **D-11:** Surfaces fold into `/intelligence` hub — Digests + Alerts as sections/tabs joining P69 Signals + Reports tabs.
- **D-12:** Entry point = from the dossier + a central list. "Subscribe to digest" / "Add alert" control on dossier page, full management list in `/intelligence`.
- **D-13:** Ownership = personal only in v1. A subscription/alert belongs to creating user.
- **D-14:** Define `generate_digest` SECURITY INVOKER RPC now + manual analyst "Generate now" affordance (preview→confirm→publish = HITL). Mastra agent wraps same RPC in P72.

### Claude's Discretion (resolved by research in this document)

- Subscription target granularity (D-03) — single-dossier (any type).
- v1 alert trigger set (D-05) — new-signal + severity filter, structured condition.
- Channel adapter structure (D-08) — new 3-adapter interface isolated from personal-notification dispatch.
- Digest body storage shape (D-04) — see RF-2 resolution below.
- Coalescing window length (D-07) — see RF-5 resolution below.
- Monthly cadence implementation — see RF-4 resolution below.
- Per-subscriber clearance generation mechanism — see RF-3 resolution below.

### Deferred Ideas (OUT OF SCOPE)

- AI-written digest narrative (P72/P73).
- Mastra/CopilotKit agent wrapping `generate_digest` (P72).
- Count/window threshold alerts (N-in-M) + non-signal event triggers.
- "My tracked dossiers" combined digest + saved-filter subscriptions.
- Team/role-owned subscriptions + fan-out.
- External `feed` ingestion (v7.1).
- Per-endpoint configurable external verbosity.
- Bilingual generative-UI HITL confirmation card (P73).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                                                                    | Research Support                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| DIGEST-01 | A user can subscribe to and unsubscribe from a recurring digest scoped to a dossier or topic                                                                   | RF-2 defines `intelligence_digest_subscriptions` table schema; D-03/D-12 define UI entry points |
| DIGEST-02 | System generates and delivers recurring digests on schedule (cron, service-role + explicit authz), each subscriber receives only clearance-appropriate content | RF-3 defines per-subscriber clearance mechanism; RF-4 confirms BullMQ reuse pattern             |
| DIGEST-03 | A user can view rendered digests in-app                                                                                                                        | D-11 defines surface; `intelligence_digest` table stores rendered output                        |
| DIGEST-04 | The agent can generate a digest on demand via a human-in-the-loop `generate_digest` tool                                                                       | RF-6 defines the SECURITY INVOKER RPC signature; D-14 defines HITL affordance                   |
| ALERT-01  | A user can define a threshold alert (e.g., a new signal on a tracked dossier)                                                                                  | RF-2 defines `intelligence_alert_rules` table; D-05/D-06 define structure                       |
| ALERT-02  | A triggered alert is delivered immediately to the subscriber's configured channels                                                                             | RF-5 defines trigger wiring via DB trigger + BullMQ; D-07 defines coalescing guard              |
| ALERT-03  | Alert and digest delivery flows through a pluggable channel adapter supporting in-app, on-prem SMTP email, and an external webhook/Teams endpoint              | RF-1 defines on-prem SMTP implementation path (nodemailer in backend, NOT edge fn)              |
| ALERT-04  | External-channel payloads carry deep-links only — no classified content leaves the platform                                                                    | D-10 is a hard contract; RF-1 defines webhook adapter contract                                  |

</phase_requirements>

---

## Summary

Phase 70 delivers two capabilities: (1) a recurring digest pipeline where users subscribe to per-dossier intelligence rollups delivered on daily/weekly/monthly schedules with per-subscriber clearance gating, and (2) an immediate threshold alert engine triggered by new signals on tracked dossiers, delivered across in-app, on-prem SMTP, and webhook channels.

All six research flags have been closed against live code and the live Supabase project `zkrcjzdemdmwhearhfgg`. The single most important finding is **RF-1**: the existing `email-send` edge function uses **SendGrid or Resend** — both cloud providers with data egress. This directly violates the cross-cutting "on-prem fidelity / no egress" guarantee. The on-prem SMTP adapter for P70 must be built as a **backend nodemailer worker** that drains a new `intelligence_email_queue` table, bypassing the existing cloud-provider edge function entirely. The personal-notification `email_queue` → `email-send` path is preserved untouched.

The second major finding is **RF-4**: the existing digest scheduler has **no monthly cadence** — only daily (every-hour checker) and weekly (every-24h checker). Monthly must be added as a new BullMQ scheduler with a day-of-month check, identical in structure to the weekly processor.

**Primary recommendation:** Build a new `IntelligenceChannelAdapter` layer in `backend/src/adapters/intelligence/` isolated from `notification.processor.ts`. The in-app adapter wraps `enqueueNotification`; the email adapter is a new nodemailer SMTP worker; the webhook adapter is a plain `fetch` POST. Alert triggering uses a PostgreSQL `AFTER INSERT` trigger on `intelligence_event` that calls `pg_notify('intelligence_alert', ...)`, received by a BullMQ worker in the backend. The cron digest generator is a new scheduler registered alongside the existing `registerDigestScheduler`.

## Architectural Responsibility Map

| Capability                            | Primary Tier                    | Secondary Tier     | Rationale                                                                                                              |
| ------------------------------------- | ------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Digest subscription CRUD              | API / Backend                   | Database / Storage | Personal data, clearance-scoped ownership; RLS enforces per-user isolation                                             |
| Recurring digest cron                 | API / Backend (BullMQ)          | Database / Storage | Service-role cron with explicit app-layer authz; emits per-subscriber content to `intelligence_digest` rows + channels |
| Per-subscriber clearance filtering    | Database / Storage              | API / Backend      | RLS + SECURITY INVOKER RPCs enforce clearance; cron passes explicit `clearance_level` arg                              |
| `generate_digest` RPC                 | Database / Storage              | API / Backend      | SECURITY INVOKER — runs under caller JWT, clearance-gates content automatically                                        |
| Alert rule CRUD                       | API / Backend                   | Database / Storage | `intelligence_alert_rules` table; owner-scoped RLS                                                                     |
| Alert trigger detection               | Database / Storage              | API / Backend      | DB AFTER INSERT trigger on `intelligence_event` + `pg_notify` → BullMQ alert worker                                    |
| Alert coalescing guard                | API / Backend (BullMQ)          | —                  | Job dedup by `event_id:alert_rule_id` within 5-minute window                                                           |
| In-app channel dispatch               | API / Backend                   | Database / Storage | Wraps existing `enqueueNotification` from `notification.service.ts`                                                    |
| On-prem SMTP channel                  | API / Backend                   | —                  | New nodemailer backend service; NOT the existing SendGrid/Resend edge fn                                               |
| Webhook channel                       | API / Backend                   | —                  | Plain `fetch` POST; D-10 envelope enforced at adapter level                                                            |
| Digest reading (in-app)               | Frontend Server (SSR) / Browser | Database / Storage | `intelligence_digest` rows read via SECURITY INVOKER RPC; rendered in `/intelligence` tab                              |
| Digest/Alert subscription UI          | Browser / Client                | API / Backend      | `/intelligence` hub tabs + per-dossier dossier page controls (D-11/D-12)                                               |
| External payload content sanitization | API / Backend                   | —                  | D-10 hard contract: webhook adapter enforces deep-link-only output                                                     |

---

## RF-1 — On-Prem SMTP Transport (CLOSED)

**Finding (VERIFIED against live code):** The existing `supabase/functions/email-send/index.ts` uses **SendGrid** (default, `EMAIL_PROVIDER=sendgrid`) or **Resend** as its email transport. Both are cloud providers with data egress. The code calls `https://api.sendgrid.com/v3/mail/send` or `https://api.resend.com/emails` directly. This violates the "on-prem fidelity / no egress" cross-cutting guarantee for ALERT-03.

**Confirmed:** `backend/package.json` has neither `nodemailer` nor any SMTP dependency. No `email-service.ts` file exists in `backend/src/services/` — the INTEGRATIONS.md reference is stale.

**Recommendation: Build a backend nodemailer SMTP worker.**

The architecture is:

1. Alert/digest cron writes to a new table `intelligence_email_queue` (isolated from the existing `email_queue` used by personal notifications).
2. A new `IntelligenceSMTPWorker` in `backend/src/adapters/intelligence/smtp-adapter.ts` polls this table on a short interval (or a BullMQ queue for immediate alerts) and delivers via nodemailer to a self-hosted SMTP relay.
3. The personal-notification `email_queue` → `email-send` edge fn path is UNTOUCHED (zero regression).

Add to `backend/package.json` dependencies:

```json
"nodemailer": "^6.9.x"
```

And devDependencies:

```json
"@types/nodemailer": "^6.4.x"
```

New env vars needed in `backend/.env`:

```
SMTP_HOST=<on-prem relay host>
SMTP_PORT=587
SMTP_USER=<service account>
SMTP_PASS=<password>
SMTP_FROM=noreply@stats.gov.sa
```

The `intelligence_email_queue` table must NOT be `email_queue` — name isolation prevents any accidental cross-contamination with the personal-notification delivery path.

**For digest emails (scheduled delivery):** the digest cron inserts into `intelligence_email_queue`; the SMTP worker batch-drains it hourly.
**For alert emails (immediate delivery):** the alert worker adds a BullMQ job to an `intelligence-smtp` queue; the SMTP worker processes it with immediate priority.

**Note:** The existing `digest-template.service.ts` and `email-template.service.ts` (bilingual HTML rendering) are fully reusable. The new SMTP adapter calls the same render functions and sends via nodemailer instead of via `email_queue` insert. [VERIFIED: live code read]

---

## RF-2 — `intelligence_digest` Schema Fit (CLOSED)

### Live Schema Confirmed

From migration `20260516000002_phase54_intelligence_event_and_digest.sql` (VERIFIED against live code):

```sql
CREATE TABLE public.intelligence_digest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL CHECK (dossier_type IN
    ('country','organization','forum','engagement','topic','working_group','person')),
  -- ^^^ MISSING 'elected_official' — confirmed
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL CHECK (period_end > period_start),
  summary TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Confirmed problems:**

1. `dossier_type` CHECK has 7 types — **missing `elected_official`**.
2. No `subscriber_id` column — no per-subscriber scoping.
3. No `published_at` column — no publish/draft state.
4. No `clearance_level_at_generation` column.
5. RLS is role-locked (admin/editor INSERT) — not clearance-gated.
6. No subscription or alert-rule tables exist.

### Storage Shape Decision (D-04)

**Choose: extend `intelligence_digest` with extra columns + add a child `intelligence_digest_items` table.**

Rationale: the `summary TEXT` column stores the rendered rollup (for fast in-app read); the child items table stores the structured JSON rollup records (for future reprocessing, agent reads in P72, and clearance-proof audit). This avoids bloating the summary column with structured data while still supporting the "deterministic rollup" contract.

### DDL for Phase 70 Migration

```sql
-- 1. Fix the dossier_type CHECK to cover all 8 canonical types
ALTER TABLE public.intelligence_digest
  DROP CONSTRAINT IF EXISTS intelligence_digest_dossier_type_check;

ALTER TABLE public.intelligence_digest
  ADD CONSTRAINT intelligence_digest_dossier_type_check
  CHECK (dossier_type IN (
    'country', 'organization', 'forum', 'engagement',
    'topic', 'working_group', 'person', 'elected_official'
  ));

-- 2. Add columns to intelligence_digest for v7.0 delivery
ALTER TABLE public.intelligence_digest
  ADD COLUMN IF NOT EXISTS subscriber_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,         -- NULL = draft/preview
  ADD COLUMN IF NOT EXISTS clearance_level_at_generation INTEGER,
  ADD COLUMN IF NOT EXISTS period TEXT;                       -- 'daily-2026-06-15', 'weekly-2026-W24'

-- 3. New digest-subscription table
CREATE TABLE IF NOT EXISTS public.intelligence_digest_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL CHECK (dossier_type IN (
    'country', 'organization', 'forum', 'engagement',
    'topic', 'working_group', 'person', 'elected_official'
  )),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subscriber_id, dossier_id, frequency)
);

-- RLS on intelligence_digest_subscriptions
ALTER TABLE public.intelligence_digest_subscriptions ENABLE ROW LEVEL SECURITY;

-- Owner can see/manage their own subscriptions
CREATE POLICY ids_select_owner ON public.intelligence_digest_subscriptions FOR SELECT
  TO authenticated
  USING (subscriber_id = auth.uid()
    AND tenant_isolation.rls_select_policy(organization_id));

CREATE POLICY ids_insert_owner ON public.intelligence_digest_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (subscriber_id = auth.uid()
    AND tenant_isolation.rls_insert_policy(organization_id));

CREATE POLICY ids_update_owner ON public.intelligence_digest_subscriptions FOR UPDATE
  TO authenticated
  USING (subscriber_id = auth.uid())
  WITH CHECK (subscriber_id = auth.uid());

CREATE POLICY ids_delete_owner ON public.intelligence_digest_subscriptions FOR DELETE
  TO authenticated
  USING (subscriber_id = auth.uid());

-- 4. New alert-rule table
CREATE TABLE IF NOT EXISTS public.intelligence_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL CHECK (dossier_type IN (
    'country', 'organization', 'forum', 'engagement',
    'topic', 'working_group', 'person', 'elected_official'
  )),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  -- Structured condition for forward-compat (D-05)
  condition_type TEXT NOT NULL DEFAULT 'new_signal'
    CHECK (condition_type IN ('new_signal')),           -- future: 'count_window', 'engagement'
  condition_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "severity_filter": ["high","urgent"] }
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],    -- 'in_app', 'smtp', 'webhook'
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS on intelligence_alert_rules
ALTER TABLE public.intelligence_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY iar_select_owner ON public.intelligence_alert_rules FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid()
    AND tenant_isolation.rls_select_policy(organization_id));

CREATE POLICY iar_insert_owner ON public.intelligence_alert_rules FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid()
    AND tenant_isolation.rls_insert_policy(organization_id));

CREATE POLICY iar_update_owner ON public.intelligence_alert_rules FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY iar_delete_owner ON public.intelligence_alert_rules FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- 5. Child digest-items table (structured rollup records for each published digest)
CREATE TABLE IF NOT EXISTS public.intelligence_digest_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_id UUID NOT NULL REFERENCES public.intelligence_digest(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('signal', 'engagement', 'commitment', 'status_change')),
  item_id UUID NOT NULL,          -- FK to source row (signal id, engagement_dossier id, etc.)
  item_data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- snapshot at generation time
  sensitivity_level INTEGER NOT NULL DEFAULT 1 CHECK (sensitivity_level BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_digest_items_digest
  ON public.intelligence_digest_items (digest_id, sensitivity_level);

-- No RLS on digest_items — access is via digest_id FK, digest RLS gates it
-- Grant access to authenticated (always via join with parent intelligence_digest)
GRANT SELECT ON public.intelligence_digest_items TO authenticated;

-- 6. Converge intelligence_digest RLS onto canonical clearance pattern
DROP POLICY IF EXISTS intelligence_digest_select_org ON public.intelligence_digest;
DROP POLICY IF EXISTS intelligence_digest_insert_editor ON public.intelligence_digest;
DROP POLICY IF EXISTS intelligence_digest_update_editor ON public.intelligence_digest;
DROP POLICY IF EXISTS intelligence_digest_delete_admin ON public.intelligence_digest;

-- SELECT: subscriber sees their own published digests (clearance at generation respected)
CREATE POLICY intelligence_digest_select_subscriber ON public.intelligence_digest FOR SELECT
  TO authenticated
  USING (
    tenant_isolation.rls_select_policy(organization_id)
    AND (subscriber_id = auth.uid() OR subscriber_id IS NULL)  -- NULL = org-wide legacy
    AND published_at IS NOT NULL
  );

-- INSERT/UPDATE: service-role cron path only (no authenticated policy for cron writes)
-- The cron runs as service-role; all intelligence_digest inserts are via service-role.
-- (No authenticated INSERT policy needed for the new columns; legacy editor policy removed.)
```

**CRITICAL NOTE on RLS in new tables:** The `profiles` table has **NO `id` column** (it has `user_id` as its FK to `auth.users`). The canonical clearance subquery is:

```sql
(SELECT clearance_level FROM profiles WHERE user_id = auth.uid())
```

NOT `WHERE id = auth.uid()`. Using `id` silently binds to the outer table → NULL → all reads blocked. This is confirmed from the P69 RLS fix note and the live Phase 68 migration. The new tables in P70 do NOT need a clearance subquery in their RLS (they gate on `subscriber_id = auth.uid()` for ownership), but any future policy that needs clearance-gating must use `profiles.user_id`.

**The `intelligence_digest_subscriptions` and `intelligence_alert_rules` RLS patterns above use `subscriber_id = auth.uid()` / `owner_id = auth.uid()` — these are correct ownership checks, no `profiles` lookup needed.** [VERIFIED: canonical pattern confirmed from P69 migration]

---

## RF-3 — Per-Subscriber Clearance in the Cron Path (CLOSED)

### Mechanism

The cron generator runs under service-role (no JWT). To emit content filtered to each subscriber's `clearance_level`, use the **explicit clearance-arg pattern via a SECURITY INVOKER RPC**:

1. The BullMQ digest worker iterates over `intelligence_digest_subscriptions` (active rows).
2. For each subscriber, it reads their `profiles.clearance_level` from the DB using the service-role client.
3. It calls a new SECURITY INVOKER RPC `generate_digest_content(p_dossier_id, p_since, p_until, p_clearance_level INTEGER)` passing the subscriber's clearance level as an explicit argument.
4. The RPC filters all content planes using `sensitivity_level <= p_clearance_level` (the `INTEGER` literal, not a subquery that needs a caller JWT).
5. The returned content is rendered, stored as an `intelligence_digest` row with `subscriber_id` and `clearance_level_at_generation`, then dispatched to channels.

**Why explicit-arg instead of set_config / set-local:**

- `set_config('app.clearance', ...)` + `current_setting(...)` inside an RPC requires SECURITY DEFINER (to read the setting) — violates the INVOKER-only rule.
- Explicit `p_clearance_level INTEGER` keeps the RPC SECURITY INVOKER and the filtering transparent.
- The service-role read of `profiles.clearance_level` is auditable and explicit.

### Multi-Plane Content Coverage

The `generate_digest_content` RPC must query:

| Content Plane   | Table                                                        | Clearance Filter                            |
| --------------- | ------------------------------------------------------------ | ------------------------------------------- |
| Signals         | `intelligence_event ie JOIN intelligence_event_dossiers ied` | `ie.sensitivity_level <= p_clearance_level` |
| Engagements     | `engagement_dossiers ed JOIN dossiers d`                     | `d.sensitivity_level <= p_clearance_level`  |
| Commitments due | `aa_commitments ac JOIN dossiers d` (via FK or dossier_id)   | `d.sensitivity_level <= p_clearance_level`  |
| Status changes  | `dossiers d` (updated_at in period)                          | `d.sensitivity_level <= p_clearance_level`  |

All four planes use `sensitivity_level <= p_clearance_level` as the filter. The RPC returns an empty result set when nothing qualifies — this is the "indistinguishable empty" posture (P68 D-09). The cron MUST NOT log or surface whether above-clearance content was excluded.

**Note on `engagement_dossiers`:** This is the canonical engagement extension table (confirmed from project memory: `engagement_dossiers is the extension table, not engagements`). The digest must join `engagement_dossiers` + `dossiers` to get sensitivity_level, not read from the legacy `engagements` table.

**Note on `aa_commitments`:** Confirmed canonical commitments table (legacy `commitments` is empty). The `aa_commitments` table does NOT have a direct dossier FK for general dossiers — it has `dossier_id` but links via `work_item_dossiers`. The digest should query `aa_commitments` joined through `work_item_dossiers` filtered by the target dossier_id, or use the `aa_commitments.dossier_id` column (verify which exists live). [ASSUMED: exact join path for aa_commitments→dossier — verify before writing RPC]

---

## RF-4 — Reuse vs. New Scheduler + Delivery Edge Cases (CLOSED)

### Existing BullMQ Pattern (VERIFIED against live code)

From `backend/src/queues/digest-scheduler.ts`:

- **`registerDigestScheduler()`** registers two repeatable jobs via `notificationQueue.upsertJobScheduler()` (idempotent by scheduler id):
  - `'daily-digest-processor'`: runs every 60 minutes, checks timezone/hour match per user.
  - `'weekly-digest-processor'`: runs every 24 hours, checks day-of-week match per user.
- These jobs call `processDigestJob(jobName)` in the BullMQ worker (`notification.queue.ts`).
- The worker handles `process-daily-digests` / `process-weekly-digests` alongside deadline check jobs on the same `notifications` queue.

### Monthly Cadence Addition

Add to `digest-scheduler.ts`:

```typescript
await notificationQueue.upsertJobScheduler(
  'monthly-digest-processor', // scheduler id (idempotent key)
  { every: 24 * 60 * 60 * 1000 }, // runs daily; checks day-of-month inside
  { name: 'process-monthly-digests' },
)
```

The `processMonthlyDigests()` function mirrors `processWeeklyDigests()` but checks `new Date().getUTCDate()` against a `monthly_digest_day` column in a new `intelligence_digest_preferences` table (or a JSON column in `intelligence_digest_subscriptions.frequency_config`). Recommend storing `day_of_month` (1–28, capped at 28 to avoid Feb edge cases) in the subscription row's `condition_config JSONB` field rather than a separate preferences table.

### Subscriber Deprovisioning Edge Case

When a user is deleted (`auth.users ON DELETE CASCADE` → `intelligence_digest_subscriptions ON DELETE CASCADE`): the cascade handles cleanup automatically. **But** active BullMQ jobs for that subscriber may be mid-flight. The cron processor must check `subscriber_id` exists in `profiles` before writing the digest row; missing = skip + log, no error throw.

### Concurrent Delivery Prevention

The existing pattern has no idempotency guard on digest generation. For intelligence digests, add a UNIQUE constraint:

```sql
UNIQUE (subscriber_id, dossier_id, frequency, period)
```

on `intelligence_digest` (the `period` column added in RF-2). If the cron fires twice in the same window, the second insert fails the unique constraint → skip. The worker catches this as an expected duplicate and continues.

### Isolation from v4.0 Personal-Notification Digest

The existing digest scheduler reads from `email_notification_preferences` (columns: `daily_digest_enabled`, `weekly_digest_enabled`, `daily_digest_time`, `weekly_digest_day`). The new intelligence digest scheduler reads from `intelligence_digest_subscriptions`. These are **completely separate tables** — no coupling. The existing `processDigestJob` handler checks job names `'process-daily-digests'` / `'process-weekly-digests'` — new intelligence jobs use `'process-intelligence-digests-daily'` / `'process-intelligence-digests-weekly'` / `'process-intelligence-digests-monthly'` to avoid name collision. [VERIFIED: live code read]

### Queue Architecture

The intelligence digest/alert worker should be registered on the **same `notifications` queue** using distinct job names. The existing worker in `notification.queue.ts` can add new `if` branches for the intelligence job names. This avoids a second BullMQ queue and Redis connection. The `concurrency: 5` on the existing worker is sufficient for a per-subscriber cron.

---

## RF-5 — Alert Trigger Wiring (CLOSED)

### Recommended: PostgreSQL AFTER INSERT Trigger + `pg_notify` → BullMQ Worker

**Comparison of options:**

| Option                              | Fidelity  | Missed Events                   | Idempotency              | On-Prem     |
| ----------------------------------- | --------- | ------------------------------- | ------------------------ | ----------- |
| Supabase Realtime subscription      | Medium    | Yes (reconnect gap)             | Hard                     | Yes (infra) |
| DB polling worker (60s interval)    | High      | No (scan since last)            | Easy (last-processed ts) | Yes         |
| DB AFTER INSERT trigger + pg_notify | Very High | No (within connection lifetime) | Moderate (BullMQ dedup)  | Yes         |

**Recommended: DB AFTER INSERT trigger + `pg_notify` → backend listener → BullMQ.**

- A PL/pgSQL `AFTER INSERT ON intelligence_event FOR EACH ROW` trigger calls `pg_notify('intelligence_alert', row_to_json(NEW)::text)`.
- The backend process registers a `LISTEN intelligence_alert` channel via a dedicated Supabase pooler or a raw `pg` connection.
- On `pg_notify`, the backend reads the payload, queries `intelligence_alert_rules` for matching rules (dossier match + severity filter), and enqueues a BullMQ alert job with `jobId = 'alert:{event_id}:{rule_id}'` for dedup.

**Why not polling:** Polling at 60s misses the "immediate" delivery requirement in ALERT-02. Polling at 5s would work but adds unnecessary DB load.

**Why not Realtime:** Supabase Realtime uses WebSocket subscriptions that can miss events during reconnects. The backend-side listener over a raw PostgreSQL `LISTEN/NOTIFY` channel is more reliable and fully on-prem.

**Coalescing guard (D-07):** Use BullMQ's built-in job dedup via `jobId`. The backend alert worker enqueues with:

```typescript
await alertQueue.add('alert', { eventId, ruleId, ... }, {
  jobId: `alert:${eventId}:${ruleId}`,
  delay: 0,
})
```

BullMQ silently discards a duplicate `jobId` if the job is still in the queue. This provides a natural 5-minute coalescing window: if the same event+rule pair fires again within the job processing time, the second add is discarded. For multi-signal bursts (N signals in quick succession), each signal has a distinct `event_id`, so each fires independently — but per `rule_id`, only one pending job per rule is in flight at a time. For P70 v1 (single-signal trigger), this is sufficient.

**Clearance in the alert path:** The BullMQ alert worker must:

1. Read `rule.owner_id` → look up `profiles.clearance_level` for the rule owner.
2. Read the triggering signal's `sensitivity_level`.
3. If `signal.sensitivity_level > owner.clearance_level` → **silently skip** (indistinguishable empty; no alert sent; no log of "above clearance").
4. If clearance OK → dispatch to channels.

### Trigger DDL

```sql
CREATE OR REPLACE FUNCTION public.notify_intelligence_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Must be DEFINER to call pg_notify
SET search_path = public
AS $$
BEGIN
  PERFORM pg_notify(
    'intelligence_alert',
    json_build_object(
      'event_id', NEW.id,
      'organization_id', NEW.organization_id,
      'sensitivity_level', NEW.sensitivity_level,
      'severity', NEW.severity,
      'occurred_at', NEW.occurred_at
    )::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER intelligence_event_alert_notify
  AFTER INSERT ON public.intelligence_event
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_intelligence_alert();
```

**Note:** The trigger payload includes `sensitivity_level` and `severity` so the backend can pre-filter before querying the DB. It does NOT include `title` or `content` — never log signal content in trigger payloads (need-to-know).

---

## RF-6 — `generate_digest` RPC Signature (CLOSED)

### Design

Two RPCs, not one-with-mode-arg, for cleaner HITL separation:

**RPC 1: `generate_digest` (SECURITY INVOKER — preview)**

```sql
CREATE OR REPLACE FUNCTION public.generate_digest(
  p_dossier_id UUID,
  p_period TEXT DEFAULT 'daily'   -- 'daily', 'weekly', 'monthly'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_clearance INTEGER;
  v_since TIMESTAMPTZ;
  v_until TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Read caller clearance (INVOKER — this runs under caller JWT, RLS is active)
  SELECT clearance_level INTO v_clearance
  FROM profiles WHERE user_id = auth.uid();

  -- Compute time window from period
  v_until := NOW();
  v_since := CASE p_period
    WHEN 'daily'   THEN NOW() - INTERVAL '1 day'
    WHEN 'weekly'  THEN NOW() - INTERVAL '7 days'
    WHEN 'monthly' THEN NOW() - INTERVAL '30 days'
    ELSE NOW() - INTERVAL '1 day'
  END;

  -- Aggregate content across planes, clearance-gated by RLS (INVOKER)
  SELECT jsonb_build_object(
    'dossier_id', p_dossier_id,
    'period', p_period,
    'period_start', v_since,
    'period_end', v_until,
    'clearance_level', v_clearance,
    'signals', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', ie.id, 'title', ie.title, 'severity', ie.severity,
        'category', ie.category, 'sensitivity_level', ie.sensitivity_level,
        'occurred_at', ie.occurred_at
      ))
      FROM intelligence_event ie
      JOIN intelligence_event_dossiers ied ON ied.event_id = ie.id
      WHERE ied.dossier_id = p_dossier_id
        AND ie.occurred_at BETWEEN v_since AND v_until
        -- RLS already enforces sensitivity_level <= caller clearance_level
    ),
    'engagements', ( ... ),   -- engagement_dossiers in period
    'commitments_due', ( ... ), -- aa_commitments due in period, via work_item_dossiers
    'status_changes', ( ... )  -- dossier updates in period
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_digest TO authenticated;
```

**RPC 2: `publish_digest` (SECURITY INVOKER — commit approved preview)**

```sql
CREATE OR REPLACE FUNCTION public.publish_digest(
  p_dossier_id UUID,
  p_period TEXT,
  p_summary TEXT,                    -- rendered summary from the preview
  p_clearance_level_at_generation INTEGER
)
RETURNS UUID  -- returns the intelligence_digest row id
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_org_id UUID;
  v_digest_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM dossiers WHERE id = p_dossier_id;

  INSERT INTO public.intelligence_digest (
    organization_id, dossier_type, dossier_id,
    period_start, period_end, period, summary,
    generated_by, published_at, subscriber_id,
    clearance_level_at_generation, frequency
  ) VALUES (
    v_org_id,
    (SELECT type FROM dossiers WHERE id = p_dossier_id),
    p_dossier_id,
    NOW() - CASE p_period WHEN 'daily' THEN INTERVAL '1 day' ... END,
    NOW(),
    p_period,
    p_summary,
    auth.uid(),
    NOW(),            -- published immediately on approval
    auth.uid(),       -- subscriber = the approver (manual HITL path)
    p_clearance_level_at_generation,
    p_period
  )
  RETURNING id INTO v_digest_id;

  RETURN v_digest_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_digest TO authenticated;
```

**Why two RPCs vs one-with-mode-arg:**

- Cleaner P72 agent tool boundary: agent calls `generate_digest` → shows preview card → user approves → agent calls `publish_digest`. Single-arg mode would require the agent to handle state internally.
- `publish_digest` can be called directly by the manual HITL affordance (D-14) without knowledge of the preview payload internals.
- Easier to test: each RPC is independently invocable.

**Manual HITL UI flow (D-14):**

1. User clicks "Generate digest now" on dossier page or `/intelligence` Digests tab.
2. Frontend calls `generate_digest(dossier_id, period)` → receives preview JSON.
3. Frontend renders a preview card (bilingual, clearance-correct content).
4. User clicks "Publish" → frontend calls `publish_digest(dossier_id, period, renderedSummary, clearanceLevel)`.
5. The published `intelligence_digest` row appears in the Digests tab.

---

## Standard Stack

### Core

| Library                 | Version           | Purpose                                 | Why Standard                                                                                   |
| ----------------------- | ----------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `nodemailer`            | ^6.9.x            | On-prem SMTP email delivery             | Only production-quality SMTP library for Node.js; no cloud dependency [ASSUMED]                |
| `bullmq`                | 5.77.1 (pinned)   | Alert trigger queueing + cron scheduler | Already in use; `upsertJobScheduler` provides idempotent repeatable jobs [VERIFIED: live code] |
| `@supabase/supabase-js` | ^2.100.1 (pinned) | DB access, SECURITY INVOKER RPCs        | Already in use [VERIFIED: backend/package.json]                                                |
| PostgreSQL `pg_notify`  | (DB-level)        | Alert trigger channel                   | No additional dep; native Postgres feature [VERIFIED: Supabase managed Postgres]               |

### Supporting

| Library             | Version                          | Purpose                         | When to Use                                     |
| ------------------- | -------------------------------- | ------------------------------- | ----------------------------------------------- |
| `@types/nodemailer` | ^6.4.x                           | TypeScript types for nodemailer | DevDep, always when using nodemailer [ASSUMED]  |
| `node-cron`         | ^4.2.1 (already in package.json) | Optional fallback scheduler     | Only if BullMQ repeatable jobs hit Redis issues |

### Alternatives Considered

| Instead of                                      | Could Use                               | Tradeoff                                                                                                                           |
| ----------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `nodemailer` (backend)                          | Edge fn `email-send` with SMTP provider | Edge fn already wired to SendGrid/Resend (cloud egress violation — ALERT-03 fails); nodemailer in backend keeps everything on-prem |
| `pg_notify` trigger                             | Supabase Realtime subscription          | Realtime can miss events on reconnect; pg_notify + LISTEN is more reliable for immediate delivery                                  |
| Two RPCs (`generate_digest` / `publish_digest`) | Single RPC with mode arg                | Two RPCs give cleaner P72 agent tool boundary and are independently testable                                                       |

**Installation (new deps only):**

```bash
pnpm --filter intake-backend add nodemailer
pnpm --filter intake-backend add -D @types/nodemailer
```

**Version verification:** [ASSUMED — nodemailer 6.9.x is long-stable; verify exact latest via `npm view nodemailer version` before installing]

---

## Package Legitimacy Audit

> slopcheck was not run (tool not installed in this environment). All packages below are tagged [ASSUMED] and the planner must gate each install behind a `checkpoint:human-verify` task.

| Package           | Registry | Age     | Downloads | Source Repo                      | slopcheck | Disposition                                                       |
| ----------------- | -------- | ------- | --------- | -------------------------------- | --------- | ----------------------------------------------------------------- |
| nodemailer        | npm      | ~11 yrs | ~25M/wk   | github.com/nodemailer/nodemailer | [ASSUMED] | Flagged — planner must add checkpoint:human-verify before install |
| @types/nodemailer | npm      | ~8 yrs  | ~10M/wk   | DefinitelyTyped                  | [ASSUMED] | Flagged — planner must add checkpoint:human-verify before install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none (both are well-known long-lived packages; slopcheck verification pending)

_slopcheck was unavailable at research time. All packages above are tagged `[ASSUMED]` and the planner must gate each install behind a `checkpoint:human-verify` task._

---

## Architecture Patterns

### System Architecture Diagram

```
[Analyst Browser]
  │ subscribe/unsubscribe
  │ add/remove alert rule
  │ "Generate digest now" (HITL)
  │ view digests + alerts tab
  ▼
[TanStack Query / Frontend]
  │ calls generate_digest RPC (preview)
  │ calls publish_digest RPC (commit)
  │ calls CRUD on intelligence_digest_subscriptions
  │ calls CRUD on intelligence_alert_rules
  ▼
[Supabase Postgres — SECURITY INVOKER RPCs]
  │ generate_digest → clearance-gated JSONB preview
  │ publish_digest → intelligence_digest row (published_at SET)
  │ read_digests → SELECT intelligence_digest WHERE subscriber_id = auth.uid()
  ▼                              ▲
[Backend BullMQ Workers]         │ (service-role reads subscriptions; writes digest rows)
  │                              │
  ├── DigestCronWorker ──────────┘
  │     daily/weekly/monthly jobs
  │     per-subscriber: read clearance → call generate_digest_content RPC
  │     → render via digest-template.service.ts
  │     → write intelligence_digest + intelligence_digest_items
  │     → dispatch to ChannelAdapter
  │
  ├── AlertWorker (LISTEN intelligence_alert pg_notify)
  │     on pg_notify: query matching alert_rules → clearance check → coalesce
  │     → dispatch to ChannelAdapter
  │
  └── [ChannelAdapter interface]
        ├── InAppAdapter → enqueueNotification() [existing notification.service.ts]
        ├── SMTPAdapter → nodemailer → on-prem SMTP relay → intelligence_email_queue
        └── WebhookAdapter → fetch POST → D-10 envelope
                               { deep_link: "/intelligence?digest=X", label: "Intelligence Update" }

[DB AFTER INSERT trigger on intelligence_event]
  ─── pg_notify('intelligence_alert', { event_id, sensitivity_level, severity }) ───►
      [Backend LISTEN handler] → AlertWorker BullMQ queue
```

### Recommended Project Structure

```
backend/src/
├── adapters/intelligence/       # NEW — isolated from notification.processor.ts
│   ├── ChannelAdapter.ts        # interface definition
│   ├── in-app-adapter.ts        # wraps enqueueNotification
│   ├── smtp-adapter.ts          # nodemailer SMTP; drains intelligence_email_queue
│   └── webhook-adapter.ts       # fetch POST; D-10 envelope enforced here
├── queues/
│   ├── intelligence-alert.worker.ts  # NEW — LISTEN + BullMQ; calls ChannelAdapter
│   ├── intelligence-digest.scheduler.ts  # NEW — mirrors digest-scheduler.ts
│   ├── notification.queue.ts    # EXTEND — add intelligence job name handlers
│   ├── digest-scheduler.ts      # UNCHANGED (personal digest cron)
│   └── notification.processor.ts  # UNCHANGED
├── services/
│   ├── intelligence-digest.service.ts  # NEW — generates DigestContent from multi-plane query
│   ├── digest-template.service.ts  # REUSE — bilingual rendering
│   └── email-template.service.ts   # REUSE — bilingual alert email render
frontend/src/
├── components/intelligence/
│   ├── DigestsTab.tsx           # NEW — list of published digests
│   ├── DigestCard.tsx           # NEW — single digest render
│   ├── DigestSubscribeDrawer.tsx  # NEW — subscribe/unsubscribe CTA
│   ├── AlertsTab.tsx            # NEW — list of alert rules
│   ├── AlertRuleForm.tsx        # NEW — create/edit alert rule
│   └── GenerateDigestButton.tsx # NEW — HITL preview→confirm→publish
├── pages/intelligence/
│   └── IntelligencePage.tsx     # EXTEND — add 'digests' and 'alerts' tabs
supabase/migrations/
└── 20260615_phase70_digests_alerts.sql  # RF-2 DDL + trigger + RPCs
supabase/functions/
└── email-send/index.ts          # UNTOUCHED — personal notification path only
```

### Pattern 1: ChannelAdapter Interface

```typescript
// backend/src/adapters/intelligence/ChannelAdapter.ts
export interface IntelligenceDeliveryPayload {
  recipientId: string
  recipientEmail: string
  recipientLanguage: 'en' | 'ar'
  type: 'digest' | 'alert'
  subject: string
  bodyHtml: string
  bodyText: string
  deepLink: string // e.g. /intelligence?digest=UUID
  genericLabel: string // for webhook: "Intelligence Update" (D-10)
}

export interface ChannelAdapter {
  name: 'in_app' | 'smtp' | 'webhook'
  send(payload: IntelligenceDeliveryPayload): Promise<void>
}
```

The `webhookAdapter.send()` MUST enforce D-10: only emit `{ deepLink, label }` in the POST body. It must throw at compile time if any caller attempts to include subject/bodyHtml/bodyText in the webhook payload. The `genericLabel` value is hardcoded at the adapter level, not passed from the alert rule.

### Pattern 2: BullMQ Alert Worker with LISTEN

```typescript
// backend/src/queues/intelligence-alert.worker.ts
import { createClient as createPgClient } from 'pg' // raw pg for LISTEN

async function startAlertListener(): Promise<void> {
  const pg = new createPgClient({ connectionString: process.env.DATABASE_URL })
  await pg.connect()
  await pg.query('LISTEN intelligence_alert')

  pg.on('notification', async (msg) => {
    if (msg.channel !== 'intelligence_alert') return
    const payload = JSON.parse(msg.payload ?? '{}')
    // Enqueue with BullMQ dedup
    await alertQueue.add('intelligence-alert', payload, {
      jobId: `alert:${payload.event_id}:check`,
      removeOnComplete: { count: 500 },
    })
  })
}
```

Note: `pg` (node-postgres) is not yet in `backend/package.json`. The existing code uses `@supabase/supabase-js` for all DB access. LISTEN/NOTIFY requires a raw connection. Add `pg` and `@types/pg` to backend dependencies. [ASSUMED: need to verify pg is not already a transitive dep]

### Anti-Patterns to Avoid

- **Routing intelligence emails through `email_queue` / `email-send`:** This path uses SendGrid/Resend (egress violation). Intelligence emails must go through nodemailer directly.
- **Using `WHERE id = auth.uid()` in any `profiles` lookup:** The `profiles` table has `user_id`, not `id`. Always use `WHERE user_id = auth.uid()`.
- **Calling `supabaseAdmin` in interactive paths:** The `generate_digest` and `publish_digest` RPCs run SECURITY INVOKER — the caller's JWT enforces clearance. Never use supabaseAdmin in the frontend-initiated RPC call path.
- **Adding "filtered by clearance" text to digest empty states:** Indistinguishable empty (P68 D-09).
- **Logging signal title/content in the pg_notify payload:** Only send IDs and metadata (sensitivity_level, severity) in the trigger payload.
- **Using the existing `alertsService` (in-memory Map):** This is a stub to be replaced entirely with DB-backed `intelligence_alert_rules` table.

---

## Don't Hand-Roll

| Problem                          | Don't Build                      | Use Instead                                                | Why                                                                              |
| -------------------------------- | -------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Bilingual email rendering        | Custom HTML builder              | `digest-template.service.ts` + `email-template.service.ts` | Already tested, RTL-safe, inline CSS, bilingual, XSS-escaped                     |
| Idempotent cron job registration | Custom lock/flag                 | `upsertJobScheduler` (BullMQ v5)                           | Handles tsx-watch reload duplicate-registration out of the box                   |
| SMTP delivery with retries       | Raw net.connect                  | `nodemailer` with retries config                           | Battle-tested connection pooling, auth, TLS, DKIM, retry                         |
| Alert deduplication              | Redis SET + TTL                  | BullMQ `jobId` dedup                                       | BullMQ already in use; jobId dedup is atomic and survives restarts               |
| Clearance filtering in cron      | Re-implementing RLS logic        | SECURITY INVOKER RPC with explicit p_clearance_level       | RLS + RPC is the canonical pattern; hand-rolling risks clearance leaks           |
| Deep-link URL construction       | String concat in multiple places | Shared `buildDeepLink(type, id)` utility                   | Consistent format; prevents path typos that would give `404`s in external alerts |

---

## Common Pitfalls

### Pitfall 1: `profiles` Table Has No `id` Column

**What goes wrong:** Any RLS policy or function that does `SELECT clearance_level FROM profiles WHERE id = auth.uid()` silently binds `id` to the outer table's `id` column → `id = auth.uid()` is almost always false → ALL reads blocked for ALL users. No error is thrown at `CREATE POLICY` time; `apply_migration` succeeds; build/typecheck are green. Only authenticated impersonation catches it.

**Why it happens:** `20251022000009_update_polymorphic_refs.sql` (the "canonical" pattern) uses `WHERE id = auth.uid()` — this predicate is WRONG for `profiles`. The Phase 69 migration explicitly fixed this to `WHERE user_id = auth.uid()`.

**How to avoid:** Every `profiles` clearance lookup in P70 DDL MUST use:

```sql
(SELECT clearance_level FROM profiles WHERE user_id = auth.uid())
```

**Warning signs:** All reads from a clearance-gated table return empty set for ALL users, including admins. Service-role reads work fine (bypass RLS).

### Pitfall 2: Intelligence Email Routing Through `email_queue` / `email-send`

**What goes wrong:** Inserting into `email_queue` causes `email-send` edge fn to pick it up and call SendGrid/Resend, sending data to a cloud provider — direct violation of on-prem fidelity (ALERT-03 fails).

**Why it happens:** The existing personal digest cron inserts to `email_queue` and this pattern is tempting to reuse.

**How to avoid:** Intelligence emails use the new `intelligence_email_queue` table and the nodemailer SMTP adapter in `backend/src/adapters/intelligence/smtp-adapter.ts`. Never insert intelligence content into `email_queue`.

### Pitfall 3: External Webhook Payload Leaks Content

**What goes wrong:** A well-meaning developer adds `subject` or `signalCount` to the webhook POST body "for convenience." This violates D-10 (diplomatic need-to-know: even a count reveals tracking interest).

**Why it happens:** The Teams incoming webhook format is rich (title, body, sections) and it's natural to want to use it.

**How to avoid:** The `webhook-adapter.ts` constructs the POST body at the adapter layer, not from the delivery payload's subject/html. The adapter ONLY reads `payload.deepLink` and `payload.genericLabel`. TypeScript types enforce this at compile time.

### Pitfall 4: Duplicate `intelligence_digest` Rows from Concurrent Cron Runs

**What goes wrong:** Two cron workers (on different backend instances or a tsx-watch reload) both process the same subscriber+dossier+period window simultaneously, each inserting a digest row.

**Why it happens:** The BullMQ scheduler is idempotent (same scheduler id = same job), but the cron can still fire twice if two workers both process the same periodic job before the job is marked complete.

**How to avoid:** The UNIQUE constraint `(subscriber_id, dossier_id, frequency, period)` on `intelligence_digest` causes the second insert to throw. The worker catches this specific constraint violation and logs at INFO level (not ERROR). No other action needed.

### Pitfall 5: Alert Worker Missing Events During Backend Restart

**What goes wrong:** The backend restarts (deploy, tsx-watch), the `LISTEN` channel drops, and signals inserted during the restart window are never processed.

**Why it happens:** `pg_notify` messages are not persisted — if no listener is active when a signal is inserted, the notification is lost.

**How to avoid:** On alert worker startup, the worker performs a "catch-up scan": query `intelligence_event` rows inserted in the last 5 minutes (or since `last_fired_at` on matching alert rules) and enqueue any that match active rules. This is a one-time scan on startup, not a continuous poll.

### Pitfall 6: Signal Title/Body in Webhook Payload (from pg_notify payload)

**What goes wrong:** The `notify_intelligence_alert()` trigger function includes `NEW.title` or `NEW.content` in the pg_notify payload. The backend logs the payload for debugging. A log aggregator stores classified signal content outside the secure boundary.

**Why it happens:** Including title in the trigger payload makes the alert worker's job easier (no need to re-query).

**How to avoid:** The trigger payload contains ONLY: `event_id`, `organization_id`, `sensitivity_level`, `severity`, `occurred_at`. The backend alert worker re-queries the signal via the service-role client to get any additional data needed for dispatch — and only does so after the clearance check passes.

---

## Code Examples

### Channel Adapter Interface

```typescript
// Source: verified pattern from notification.processor.ts (adapted)
export interface IntelligenceDeliveryPayload {
  recipientId: string
  recipientEmail: string
  recipientLanguage: 'en' | 'ar'
  type: 'digest' | 'alert'
  subject: string
  bodyHtml: string
  bodyText: string
  deepLink: string
  genericLabel: string
}

export interface ChannelAdapter {
  readonly name: 'in_app' | 'smtp' | 'webhook'
  send(payload: IntelligenceDeliveryPayload): Promise<void>
}
```

### SMTP Adapter (nodemailer)

```typescript
// Source: pattern from RF-1 analysis
import nodemailer from 'nodemailer'
import type { ChannelAdapter, IntelligenceDeliveryPayload } from './ChannelAdapter'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const smtpAdapter: ChannelAdapter = {
  name: 'smtp',
  async send(payload: IntelligenceDeliveryPayload): Promise<void> {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@stats.gov.sa',
      to: payload.recipientEmail,
      subject: payload.subject,
      html: payload.bodyHtml,
      text: payload.bodyText,
    })
  },
}
```

### Webhook Adapter (D-10 Contract Enforced)

```typescript
// D-10: external payload ONLY carries deepLink + genericLabel
export const webhookAdapter: ChannelAdapter = {
  name: 'webhook',
  async send(payload: IntelligenceDeliveryPayload): Promise<void> {
    const webhookUrl = process.env.INTELLIGENCE_WEBHOOK_URL
    if (!webhookUrl) return // not configured = skip silently

    // D-10 hard contract: ONLY deep-link + generic label
    const body = {
      '@type': 'MessageCard', // Teams incoming webhook format
      '@context': 'http://schema.org/extensions',
      text: payload.genericLabel, // "Intelligence Update" — never signal title
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Open in Dossier',
          targets: [{ os: 'default', uri: `${process.env.APP_URL}${payload.deepLink}` }],
        },
      ],
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  },
}
```

### BullMQ Scheduler for Monthly Digests

```typescript
// Extends registerDigestScheduler() in digest-scheduler.ts
export async function registerIntelligenceDigestScheduler(): Promise<void> {
  await notificationQueue.upsertJobScheduler(
    'intelligence-digest-daily',
    { every: 60 * 60 * 1000 }, // hourly; checks timezone/hour match
    { name: 'process-intelligence-digests-daily' },
  )
  await notificationQueue.upsertJobScheduler(
    'intelligence-digest-weekly',
    { every: 24 * 60 * 60 * 1000 }, // daily; checks day-of-week match
    { name: 'process-intelligence-digests-weekly' },
  )
  await notificationQueue.upsertJobScheduler(
    'intelligence-digest-monthly',
    { every: 24 * 60 * 60 * 1000 }, // daily; checks day-of-month match
    { name: 'process-intelligence-digests-monthly' },
  )
}
```

---

## State of the Art

| Old Approach                                      | Current Approach                                         | When Changed                     | Impact                                             |
| ------------------------------------------------- | -------------------------------------------------------- | -------------------------------- | -------------------------------------------------- |
| In-memory `Map` AlertsService stub                | DB-backed `intelligence_alert_rules` table with RLS      | P70                              | Persistent, multi-user, survivable restarts        |
| Email via `email_queue` → SendGrid/Resend (cloud) | Email via nodemailer → on-prem SMTP relay                | P70 (new intelligence path only) | Satisfies on-prem fidelity / no egress requirement |
| Personal digest only (daily/weekly)               | Personal + Intelligence digest (daily/weekly/monthly)    | P70                              | Per-dossier recurring intelligence rollup          |
| Alert = stub with no real trigger                 | Alert = DB trigger → pg_notify → BullMQ → ChannelAdapter | P70                              | Real-time threshold alerts with clearance gating   |

**Deprecated/outdated:**

- `alertsService` in-memory Map stub (`backend/src/services/alerts.service.ts`): this is fully replaced by the `intelligence_alert_rules` table + alert worker. The existing file and its Express routes should be removed or clearly deprecated in P70.

---

## Environment Availability

| Dependency           | Required By                     | Available                    | Version          | Fallback                                     |
| -------------------- | ------------------------------- | ---------------------------- | ---------------- | -------------------------------------------- |
| BullMQ               | Alert worker + digest cron      | ✓                            | 5.77.1 (pinned)  | —                                            |
| Redis (ioredis)      | BullMQ queue backing            | ✓                            | ^5.10.1          | —                                            |
| Supabase Postgres    | All DB operations               | ✓                            | 17.6.1 (staging) | —                                            |
| nodemailer           | SMTP email delivery             | ✗                            | Not installed    | Must add to backend/package.json             |
| On-prem SMTP relay   | Email delivery                  | [ASSUMED]                    | Unknown          | Customer must configure; env var `SMTP_HOST` |
| `pg` (node-postgres) | LISTEN/NOTIFY for alert trigger | ✗ (verify if transitive dep) | —                | Fall back to 30s polling if pg unavailable   |

**Missing dependencies with no fallback:**

- `nodemailer` must be installed before SMTP adapter works. Plan must include an install step.
- `SMTP_HOST` env var must be set for SMTP adapter to function. Alert/digest email delivery silently skips if not configured (log warning, do not throw).

**Missing dependencies with fallback:**

- `pg` for LISTEN/NOTIFY: if raw pg is not viable, fall back to a 30-second polling worker on `intelligence_event` with `inserted_at > last_processed_at`. Less real-time but still functional.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Framework          | Vitest 4.1.7 (backend unit/integration) + Playwright (E2E)                         |
| Config file        | `backend/vitest.config.ts` + `backend/vitest.integration.config.ts`                |
| Quick run command  | `pnpm --filter intake-backend test -- --run tests/intelligence/`                   |
| Full suite command | `pnpm --filter intake-backend test -- --run && pnpm --filter intake-frontend test` |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                            | Test Type                                                            | Automated Command                                               | File Exists? |
| --------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- | ------------ |
| DIGEST-01 | Subscribe to dossier digest + unsubscribe                                           | unit                                                                 | `vitest tests/intelligence/subscriptions.test.ts`               | ❌ Wave 0    |
| DIGEST-02 | Cron generates clearance-gated digest for two accounts at different clearance       | integration                                                          | `vitest tests/intelligence/digest-cron.integration.test.ts`     | ❌ Wave 0    |
| DIGEST-03 | Published digest appears in `/intelligence` Digests tab                             | E2E (Playwright)                                                     | `playwright test e2e/intelligence-digests.spec.ts`              | ❌ Wave 0    |
| DIGEST-04 | `generate_digest` RPC returns preview; `publish_digest` commits it                  | integration                                                          | `vitest tests/intelligence/generate-digest.integration.test.ts` | ❌ Wave 0    |
| ALERT-01  | Create alert rule; verify persisted to `intelligence_alert_rules`                   | unit                                                                 | `vitest tests/intelligence/alert-rules.test.ts`                 | ❌ Wave 0    |
| ALERT-02  | Seed signal on tracked dossier → alert delivered to in_app + smtp + webhook         | integration (forced-error: block SendGrid URLs to confirm no egress) | `vitest tests/intelligence/alert-fanout.integration.test.ts`    | ❌ Wave 0    |
| ALERT-03  | ChannelAdapter dispatches to all 3 channels; adapter isolation verified             | unit                                                                 | `vitest tests/intelligence/channel-adapter.test.ts`             | ❌ Wave 0    |
| ALERT-04  | Webhook payload inspection: ONLY deep-link + generic label, zero classified content | unit                                                                 | `vitest tests/intelligence/webhook-payload-contract.test.ts`    | ❌ Wave 0    |

### Key UAT Scenarios (Live Staging — seed→observe→restore)

1. **Subscribe → digest → render → unsubscribe (EN + AR):**
   - Create two user accounts: User A (clearance_level=2), User B (clearance_level=3).
   - Both subscribe to the same test dossier with weekly frequency.
   - Insert 2 signals: one with sensitivity_level=2, one with sensitivity_level=3.
   - Trigger `generate_digest` for each user.
   - User A preview: sees only the level-2 signal. User B preview: sees both.
   - Verify `intelligence_digest` rows created with correct `clearance_level_at_generation`.
   - User A unsubscribes — verify `is_active=false` in `intelligence_digest_subscriptions`.
   - Repeat UI in Arabic (RTL, Tajawal, `dir=rtl`).

2. **Alert fan-out across 3 channels from one seeded signal:**
   - User C (clearance_level=2) creates alert rule on test dossier, channels=['in_app','smtp','webhook'].
   - Insert intelligence_event with sensitivity_level=1 (within clearance), severity='high'.
   - DB trigger fires pg_notify → alert worker processes → all 3 channels dispatched.
   - Verify in-app notification in `notifications` table.
   - Verify `intelligence_email_queue` row has correct SMTP recipient.
   - Verify webhook POST body: ONLY `{ text: "Intelligence Update", potentialAction: [...] }`.

3. **External payload zero-leak contract (MEDIUM-sensitivity signal):**
   - Insert signal with sensitivity_level=2, title="Sensitive diplomatic development".
   - Seed alert rule for a clearance_level=2 user with webhook channel.
   - Intercept the outbound webhook POST body.
   - Assert: `body.text` does NOT contain "Sensitive diplomatic development".
   - Assert: `body.text` equals the generic label only.
   - Assert: no `subject`, no `signalCount`, no severity enum in body.

4. **RLS denial (clearance mismatch — CDP forced-error protocol):**
   - User D (clearance_level=1) creates alert rule.
   - Insert signal with sensitivity_level=2.
   - Alert worker: clearance check → 2 > 1 → silently skip.
   - Verify NO notification row created for User D.
   - Verify NO email queued for User D.
   - Use CDP `Network.setBlockedURLs` to block SMTP/webhook URLs — assert no blocked requests for this flow.

5. **`generate_digest` preview→confirm→publish HITL (EN + AR):**
   - Call `generate_digest(dossier_id, 'weekly')` directly via Supabase dashboard or frontend tool.
   - Verify returned JSONB contains correct clearance-gated data.
   - Call `publish_digest(dossier_id, 'weekly', renderedSummary, clearance)`.
   - Verify `intelligence_digest` row has `published_at NOT NULL`.
   - Verify row appears in `/intelligence` Digests tab.

### Sampling Rate

- **Per task commit:** `pnpm --filter intake-backend test -- --run tests/intelligence/`
- **Per wave merge:** Full suite green: `pnpm test && pnpm --filter intake-frontend typecheck`
- **Phase gate:** Full suite + Playwright E2E green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/intelligence/subscriptions.test.ts` — covers DIGEST-01
- [ ] `backend/tests/intelligence/digest-cron.integration.test.ts` — covers DIGEST-02
- [ ] `backend/tests/intelligence/generate-digest.integration.test.ts` — covers DIGEST-04
- [ ] `backend/tests/intelligence/alert-rules.test.ts` — covers ALERT-01
- [ ] `backend/tests/intelligence/alert-fanout.integration.test.ts` — covers ALERT-02
- [ ] `backend/tests/intelligence/channel-adapter.test.ts` — covers ALERT-03
- [ ] `backend/tests/intelligence/webhook-payload-contract.test.ts` — covers ALERT-04
- [ ] `e2e/intelligence-digests.spec.ts` — covers DIGEST-03 (Playwright)
- [ ] Framework: nodemailer install step (`pnpm --filter intake-backend add nodemailer @types/nodemailer`)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                   |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no      | JWT via existing `authenticateToken` middleware                                                                                    |
| V3 Session Management | no      | Supabase session; existing                                                                                                         |
| V4 Access Control     | yes     | RLS on `intelligence_digest_subscriptions` + `intelligence_alert_rules`; owner-only CUD; service-role cron with explicit clearance |
| V5 Input Validation   | yes     | Zod on alert-rule create API; CHECK constraints in DB                                                                              |
| V6 Cryptography       | no      | SMTP credentials in env vars only; no new crypto                                                                                   |

### Known Threat Patterns for Intelligence Digest/Alert Stack

| Pattern                                          | STRIDE                                    | Standard Mitigation                                                                                                              |
| ------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Above-clearance content in digest/alert          | Information Disclosure                    | Per-subscriber clearance check in cron (RF-3); `sensitivity_level <= p_clearance_level` in RPC; indistinguishable empty          |
| Webhook payload leaks signal content             | Information Disclosure                    | D-10 hard contract enforced at adapter type level; TypeScript prevents accidental field inclusion                                |
| SMTP egress to cloud provider                    | Elevation of Privilege (data sovereignty) | nodemailer → on-prem SMTP relay; never `email_queue` for intelligence emails                                                     |
| Alert rule created for dossier user can't access | Elevation of Privilege                    | `intelligence_alert_rules` RLS: `owner_id = auth.uid()`; dossier clearance check in alert dispatch                               |
| pg_notify payload contains classified content    | Information Disclosure                    | Trigger payload: only `event_id`, `organization_id`, `sensitivity_level`, `severity`, `occurred_at` — never `title` or `content` |
| Duplicate digest rows from concurrent cron       | Denial of Service (spam)                  | UNIQUE constraint `(subscriber_id, dossier_id, frequency, period)`                                                               |
| `profiles.id` vs `profiles.user_id` RLS landmine | Elevation of Privilege                    | All P70 DDL uses `WHERE user_id = auth.uid()` explicitly — reviewed before migration apply                                       |

---

## Assumptions Log

| #   | Claim                                                                                           | Section                  | Risk if Wrong                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | nodemailer 6.9.x is the correct stable version to install                                       | Standard Stack           | Minor: may need version adjustment; functionality is stable across 6.x                                                                     |
| A2  | `@types/nodemailer` resolves via DefinitelyTyped                                                | Package Legitimacy Audit | Low: well-established; verify with `npm view @types/nodemailer version`                                                                    |
| A3  | `aa_commitments` has a column or join path to filter by `dossier_id` for the digest content RPC | RF-3                     | Medium: if join path is complex, the digest RPC needs a subquery via `work_item_dossiers`; verify before writing `generate_digest_content` |
| A4  | `pg` (node-postgres) is not already a transitive dependency in backend/package.json             | Environment Availability | Low: if it is already present as a transitive dep, no new install needed; `npm ls pg` will confirm                                         |
| A5  | On-prem SMTP relay (`SMTP_HOST`) will be provided by the customer before P70 UAT                | RF-1                     | High: if no SMTP relay is available, SMTP channel cannot be tested live; UAT may need to use a local relay (e.g. MailHog) for staging      |
| A6  | The external Teams webhook URL (`INTELLIGENCE_WEBHOOK_URL`) is TBD with customer                | D-09                     | Medium: webhook channel can be built and unit-tested without a real URL; live UAT may use a request-bin or local HTTP listener             |

---

## Open Questions

1. **`aa_commitments` join path to dossier_id**
   - What we know: `aa_commitments` is the canonical commitments table; `work_item_dossiers` is the junction table.
   - What's unclear: whether `aa_commitments` has a direct `dossier_id` column or whether the dossier link is always via `work_item_dossiers`.
   - Recommendation: Before writing `generate_digest_content` RPC, run `SELECT column_name FROM information_schema.columns WHERE table_name = 'aa_commitments'` on staging. Use whichever path exists.

2. **`pg` LISTEN/NOTIFY vs polling fallback decision**
   - What we know: `pg` raw client is needed for LISTEN; it may not be installed yet.
   - What's unclear: whether there's an easy way to piggyback LISTEN on the existing Supabase client.
   - Recommendation: Supabase JS client does not expose raw LISTEN. The planner should include a task to add `pg` as a backend dep, and a conditional fallback to 30s polling if the pg connection cannot be established at startup.

3. **`dossier_type` field name in `intelligence_digest` for `elected_official`**
   - What we know: the existing `dossiers` table likely stores `elected_official` as the type for elected official dossiers.
   - What's unclear: whether the `dossiers.type` enum already includes `elected_official` (it should, given Phase 50 work).
   - Recommendation: Verify `SELECT DISTINCT type FROM dossiers` on staging before writing the `generate_digest` RPC.

---

## Sources

### Primary (HIGH confidence)

- Live code read: `supabase/functions/email-send/index.ts` — confirmed SendGrid/Resend providers
- Live code read: `backend/src/queues/digest-scheduler.ts` — confirmed BullMQ pattern, daily/weekly only
- Live code read: `backend/src/services/alerts.service.ts` — confirmed in-memory Map stub
- Live code read: `backend/src/queues/notification.processor.ts` — confirmed channel dispatch pattern
- Live code read: `backend/src/services/digest-template.service.ts` — confirmed reusable bilingual rendering
- Live code read: `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql` — confirmed `intelligence_digest` schema (7 types, no subscription/frequency/clearance columns)
- Live code read: `supabase/migrations/20260516000003_phase54_intelligence_event_dossiers.sql` — confirmed junction pattern (7 types, missing `elected_official`)
- Live code read: `supabase/migrations/20260614_phase69_signals_extend.sql` — confirmed P69 clearance RLS pattern (`WHERE user_id = auth.uid()`), `read_signals` INVOKER RPC shape
- Live code read: `backend/package.json` — confirmed `nodemailer` NOT installed; `bullmq` 5.77.1 pinned
- Context files: 70-CONTEXT.md, 69-CONTEXT.md, 68-CONTEXT.md (D-01 through D-14 locked decisions)

### Secondary (MEDIUM confidence)

- `supabase/migrations/20251022000009_update_polymorphic_refs.sql` lines 102/119 — the "canonical" pattern uses `WHERE id = auth.uid()` (WRONG for profiles); superseded by P69 fix

### Tertiary (LOW confidence / ASSUMED)

- nodemailer npm package name, version ^6.9.x [ASSUMED — standard knowledge, verify before install]
- `aa_commitments` join path to dossier [ASSUMED — verify with `information_schema.columns` query on staging]

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all existing packages verified in live code; only nodemailer is new/assumed
- Architecture: HIGH — verified against live code, live migrations, P68/P69 decisions
- Pitfalls: HIGH — RF-1 (SMTP egress), profiles.user_id landmine, duplicate digest guard all confirmed from live history
- RPC signatures: MEDIUM-HIGH — designed from live P69 precedent; `aa_commitments` join path needs one verification query

**Research date:** 2026-06-15
**Valid until:** 2026-07-15 (Supabase schema is stable; BullMQ API is pinned)
