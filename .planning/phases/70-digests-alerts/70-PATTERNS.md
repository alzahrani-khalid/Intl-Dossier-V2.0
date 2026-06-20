# Phase 70: Digests + Alerts — Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 23 new/modified files
**Analogs found:** 22 / 23

---

## File Classification

| New / Modified File                                              | Role                | Data Flow        | Closest Analog                                                | Match Quality |
| ---------------------------------------------------------------- | ------------------- | ---------------- | ------------------------------------------------------------- | ------------- |
| `supabase/migrations/20260615_phase70_digests_alerts.sql`        | migration           | CRUD             | `supabase/migrations/20260614_phase69_signals_extend.sql`     | exact         |
| `backend/src/adapters/intelligence/ChannelAdapter.ts`            | utility (interface) | event-driven     | `backend/src/queues/notification.processor.ts`                | role-match    |
| `backend/src/adapters/intelligence/in-app-adapter.ts`            | service/adapter     | event-driven     | `backend/src/services/notification.service.ts`                | exact         |
| `backend/src/adapters/intelligence/smtp-adapter.ts`              | service/adapter     | event-driven     | `backend/src/services/email-template.service.ts`              | role-match    |
| `backend/src/adapters/intelligence/webhook-adapter.ts`           | service/adapter     | event-driven     | `backend/src/queues/notification.processor.ts`                | role-match    |
| `backend/src/queues/intelligence-digest.scheduler.ts`            | queue/scheduler     | batch            | `backend/src/queues/digest-scheduler.ts`                      | exact         |
| `backend/src/queues/intelligence-alert.worker.ts`                | queue/worker        | event-driven     | `backend/src/queues/deadline-scheduler.ts`                    | role-match    |
| `backend/src/queues/notification.queue.ts`                       | queue (EXTEND)      | event-driven     | `backend/src/queues/notification.queue.ts`                    | self          |
| `backend/src/services/intelligence-digest.service.ts`            | service             | CRUD + transform | `backend/src/queues/digest-scheduler.ts`                      | role-match    |
| `backend/src/services/alerts.service.ts`                         | service (REPLACE)   | CRUD             | `backend/src/services/notification.service.ts`                | role-match    |
| `backend/src/api/intelligence-digest.ts`                         | controller          | request-response | `backend/src/api/notifications.ts`                            | exact         |
| `backend/src/api/intelligence-alerts.ts`                         | controller          | request-response | `backend/src/api/notifications.ts`                            | exact         |
| `frontend/src/components/signals/SignalsQueue.tsx`               | component (EXTEND)  | request-response | `frontend/src/components/signals/SignalsQueue.tsx`            | self          |
| `frontend/src/pages/intelligence/IntelligencePage.tsx`           | page (EXTEND)       | request-response | `frontend/src/pages/intelligence/IntelligencePage.tsx`        | self          |
| `frontend/src/components/intelligence/DigestsTab.tsx`            | component           | request-response | `frontend/src/components/signals/SignalsQueue.tsx`            | exact         |
| `frontend/src/components/intelligence/DigestCard.tsx`            | component           | request-response | `frontend/src/components/signals/SignalRow.tsx`               | exact         |
| `frontend/src/components/intelligence/DigestSubscribeDrawer.tsx` | component           | CRUD             | `frontend/src/components/notifications/NotificationPanel.tsx` | role-match    |
| `frontend/src/components/intelligence/AlertsTab.tsx`             | component           | request-response | `frontend/src/components/signals/SignalsQueue.tsx`            | role-match    |
| `frontend/src/components/intelligence/AlertRuleForm.tsx`         | component           | CRUD             | `frontend/src/components/signals/CaptureSignalForm.tsx`       | role-match    |
| `frontend/src/components/intelligence/GenerateDigestButton.tsx`  | component           | request-response | `frontend/src/components/signals/EscalateSignalDialog.tsx`    | role-match    |
| `frontend/src/domains/signals/hooks/useDigests.ts`               | hook                | request-response | `frontend/src/domains/signals/hooks/useSignals.ts`            | exact         |
| `frontend/src/domains/signals/hooks/useAlertRules.ts`            | hook                | CRUD             | `frontend/src/domains/signals/hooks/useSignals.ts`            | role-match    |
| `frontend/src/i18n/index.ts`                                     | config (EXTEND)     | —                | `frontend/src/i18n/index.ts`                                  | self          |

---

## Pattern Assignments

### `supabase/migrations/20260615_phase70_digests_alerts.sql` (migration, CRUD)

**Analog:** `supabase/migrations/20260614_phase69_signals_extend.sql`
**Also reference:** `supabase/migrations/20260516000003_phase54_intelligence_event_dossiers.sql`

**Migration header pattern** (P69 migration lines 1–16):

```sql
-- Phase 70: Digests + Alerts schema extension
-- Decision coverage: D-01..D-14
-- Applied via: Supabase MCP apply_migration to zkrcjzdemdmwhearhfgg
-- CRITICAL: profiles has NO `id` col — always use `WHERE user_id = auth.uid()`
```

**Clearance RLS pattern** (P69 migration lines 62–85 — the ONLY correct form):

```sql
AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())
```

Never `WHERE id = auth.uid()` — confirmed live bug from P69.

**SECURITY INVOKER RPC pattern** (P69 migration lines 144–199):

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
  -- ... column list with explicit TEXT casts on enum columns
  source_type TEXT,   -- MANDATORY cast: column is signal_source_type enum
  -- ...
)
LANGUAGE SQL
SECURITY INVOKER
STABLE
AS $$
  SELECT ie.id, ie.title, ..., ie.source_type::text, ...
  FROM public.intelligence_event ie
  WHERE (p_dossier_id IS NULL OR EXISTS (...))
  ORDER BY ie.occurred_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.read_signals TO authenticated;
```

Apply same shape to `generate_digest` and `publish_digest` RPCs. Key differences:

- `generate_digest` returns `JSONB` (not a TABLE); uses `LANGUAGE plpgsql`; caller clearance read via `SELECT clearance_level FROM profiles WHERE user_id = auth.uid()`
- `publish_digest` takes `p_summary TEXT` + `p_clearance_level_at_generation INTEGER`; returns `UUID`

**Polymorphic junction RLS (EXISTS-via-parent)** (P54 migration lines 31–87):

```sql
-- Owner-scoped policy (for new subscription/alert-rule tables — simpler than EXISTS-via-parent)
CREATE POLICY ids_select_owner ON public.intelligence_digest_subscriptions FOR SELECT
  TO authenticated
  USING (
    subscriber_id = auth.uid()
    AND tenant_isolation.rls_select_policy(organization_id)
  );
```

Note: new tables use `subscriber_id = auth.uid()` (ownership), not EXISTS-via-parent (that is for junction tables without an owner field).

**Unique constraint for idempotency** (RF-2 / RF-4 requirement):

```sql
UNIQUE (subscriber_id, dossier_id, frequency, period)
-- on intelligence_digest; prevents duplicate cron rows
```

**DB notify trigger pattern** (RESEARCH.md RF-5 DDL):

```sql
CREATE OR REPLACE FUNCTION public.notify_intelligence_alert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
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
      -- NEVER include title, content, or any classified field
    )::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER intelligence_event_alert_notify
  AFTER INSERT ON public.intelligence_event
  FOR EACH ROW EXECUTE FUNCTION public.notify_intelligence_alert();
```

---

### `backend/src/adapters/intelligence/ChannelAdapter.ts` (utility/interface, event-driven)

**Analog:** `backend/src/queues/notification.processor.ts` (the multi-channel dispatch model)

**Interface pattern** (derived from RESEARCH.md Pattern 1 + processor shape):

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
  deepLink: string // e.g. '/intelligence?digest=UUID'
  genericLabel: string // 'Intelligence Update' — webhook only reads this (D-10)
}

export interface ChannelAdapter {
  readonly name: 'in_app' | 'smtp' | 'webhook'
  send(payload: IntelligenceDeliveryPayload): Promise<void>
}
```

No fire-and-forget wrapping here — that lives in the worker that calls the adapters. The interface is pure: `send` returns `Promise<void>` and throws on failure so the caller can decide retry/skip.

---

### `backend/src/adapters/intelligence/in-app-adapter.ts` (adapter, event-driven)

**Analog:** `backend/src/services/notification.service.ts` lines 113–119

**enqueueNotification pattern** (lines 113–119):

```typescript
import { enqueueNotification } from '../../services/notification.service'
import type { NotificationJobData } from '../../queues/notification.queue'
import type { ChannelAdapter, IntelligenceDeliveryPayload } from './ChannelAdapter'

export const inAppAdapter: ChannelAdapter = {
  name: 'in_app',
  async send(payload: IntelligenceDeliveryPayload): Promise<void> {
    const data: NotificationJobData = {
      userId: payload.recipientId,
      type: payload.type === 'digest' ? 'intelligence_digest' : 'intelligence_alert',
      title: payload.subject,
      message: payload.bodyText.slice(0, 200), // truncate for in-app
      category: 'workflow',
      priority: payload.type === 'alert' ? 'high' : 'normal',
      actionUrl: payload.deepLink,
    }
    await enqueueNotification(data, 'send-notification')
  },
}
```

---

### `backend/src/adapters/intelligence/smtp-adapter.ts` (adapter, event-driven)

**Analog:** `backend/src/services/email-template.service.ts` (render output) + `backend/src/services/digest-template.service.ts` (bilingual pattern)

**SMTP send pattern** (RESEARCH.md RF-1 + Code Examples):

```typescript
import nodemailer from 'nodemailer'
import type { ChannelAdapter, IntelligenceDeliveryPayload } from './ChannelAdapter'

// Module-level singleton — do not re-create per send
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const smtpAdapter: ChannelAdapter = {
  name: 'smtp',
  async send(payload: IntelligenceDeliveryPayload): Promise<void> {
    if (process.env.SMTP_HOST == null) {
      // Missing config = skip silently (customer relay not yet configured)
      logInfo('SMTP adapter: SMTP_HOST not configured — skipping')
      return
    }
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

**Critical:** NEVER insert into `email_queue` here. That table routes to `email-send` edge fn (SendGrid/Resend — egress violation). This adapter calls nodemailer directly.

---

### `backend/src/adapters/intelligence/webhook-adapter.ts` (adapter, event-driven)

**Analog:** `backend/src/queues/notification.processor.ts` (fire-and-forget side channel model)

**D-10 hard-contract pattern** (RESEARCH.md Code Examples):

```typescript
import type { ChannelAdapter, IntelligenceDeliveryPayload } from './ChannelAdapter'
import { logInfo, logError } from '../../utils/logger'

export const webhookAdapter: ChannelAdapter = {
  name: 'webhook',
  async send(payload: IntelligenceDeliveryPayload): Promise<void> {
    const webhookUrl = process.env.INTELLIGENCE_WEBHOOK_URL
    if (webhookUrl == null) {
      logInfo('Webhook adapter: INTELLIGENCE_WEBHOOK_URL not configured — skipping')
      return
    }

    // D-10 hard contract: ONLY deep-link + generic label
    // TypeScript types prevent adding payload.subject / payload.bodyHtml here
    const body = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      text: payload.genericLabel, // 'Intelligence Update' — never signal title
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

---

### `backend/src/queues/intelligence-digest.scheduler.ts` (queue/scheduler, batch)

**Analog:** `backend/src/queues/digest-scheduler.ts` — EXACT structural copy; change subscription table + job names.

**Imports pattern** (digest-scheduler.ts lines 1–8):

```typescript
import { createClient } from '@supabase/supabase-js'
import { notificationQueue } from './notification.queue'
import {
  renderDailyDigestTemplate,
  renderWeeklyDigestTemplate,
} from '../services/digest-template.service'
import type { DigestContent } from '../services/digest-template.service'
import { logInfo, logError } from '../utils/logger'
```

**upsertJobScheduler idempotency pattern** (digest-scheduler.ts lines 331–347):

```typescript
export async function registerIntelligenceDigestScheduler(): Promise<void> {
  // Idempotent by scheduler id — safe across tsx-watch reloads
  await notificationQueue.upsertJobScheduler(
    'intelligence-digest-daily', // scheduler id (idempotent key)
    { every: 60 * 60 * 1000 }, // runs hourly; checks tz/hour match inside
    { name: 'process-intelligence-digests-daily' },
  )
  await notificationQueue.upsertJobScheduler(
    'intelligence-digest-weekly',
    { every: 24 * 60 * 60 * 1000 },
    { name: 'process-intelligence-digests-weekly' },
  )
  await notificationQueue.upsertJobScheduler(
    'intelligence-digest-monthly',
    { every: 24 * 60 * 60 * 1000 }, // daily; checks day-of-month match inside
    { name: 'process-intelligence-digests-monthly' },
  )
  logInfo('Intelligence digest schedulers registered')
}
```

**Per-subscriber cron body pattern** (mirror of digest-scheduler.ts lines 77–181):

```typescript
async function processIntelligenceDailyDigests(): Promise<void> {
  const currentUtcHour = new Date().getUTCHours()

  // Read from intelligence_digest_subscriptions — NOT email_notification_preferences
  const { data: subs, error } = await supabase
    .from('intelligence_digest_subscriptions')
    .select('id, subscriber_id, dossier_id, dossier_type')
    .eq('is_active', true)
    .eq('frequency', 'daily')
    .limit(BATCH_SIZE)

  for (const sub of subs ?? []) {
    try {
      // Read subscriber clearance (service-role can read profiles)
      const { data: profile } = await supabase
        .from('profiles')
        .select('clearance_level')
        .eq('user_id', sub.subscriber_id)    // profiles.user_id, NOT profiles.id
        .single()

      if (profile == null) continue           // subscriber deprovisioned — skip

      const clearanceLevel = profile.clearance_level ?? 1

      // Call generate_digest_content RPC with explicit clearance arg (RF-3)
      const { data: content, error: rpcError } = await supabase.rpc(
        'generate_digest_content',
        {
          p_dossier_id: sub.dossier_id,
          p_since: /* 24h ago */,
          p_until: /* now */,
          p_clearance_level: clearanceLevel,
        }
      )
      // ...render + insert intelligence_digest + dispatch via ChannelAdapter
    } catch (err) {
      logError(`Intelligence digest: error for subscriber ${sub.subscriber_id}`, err as Error)
      // continue — do not re-throw; one failure must not abort the whole batch
    }
  }
}
```

**Error handling pattern**: individual subscriber failures `continue` without re-throw (same as digest-scheduler.ts lines 176–178). Top-level RPC errors `logError + continue`.

---

### `backend/src/queues/intelligence-alert.worker.ts` (queue/worker, event-driven)

**Analog:** `backend/src/queues/deadline-scheduler.ts` (same queue + jobId dedup pattern)

**jobId dedup pattern** (deadline-scheduler.ts lines 67–88):

```typescript
await notificationQueue.add(
  'deadline-approaching',
  {
    /* job data */
  },
  { jobId: `deadline-24h-${task.id}` }, // dedup key
)
```

**Intelligence alert variant** (RESEARCH.md Pattern 2 + RF-5 DDL):

```typescript
import { notificationQueue } from './notification.queue'
import { logInfo, logError } from '../utils/logger'

// pg LISTEN/NOTIFY worker — uses raw pg client for LISTEN support
// (supabase-js does not expose raw LISTEN)
export async function startAlertListener(): Promise<void> {
  const { Client } = await import('pg')
  const pg = new Client({ connectionString: process.env.DATABASE_URL })
  await pg.connect()
  await pg.query('LISTEN intelligence_alert')

  pg.on('notification', async (msg) => {
    if (msg.channel !== 'intelligence_alert') return
    const payload = JSON.parse(msg.payload ?? '{}') as {
      event_id: string
      organization_id: string
      sensitivity_level: number
      severity: string
      occurred_at: string
    }

    // Enqueue with BullMQ dedup — jobId prevents burst-duplicates (D-07)
    try {
      await notificationQueue.add('intelligence-alert', payload, {
        jobId: `alert:${payload.event_id}:check`,
        removeOnComplete: { count: 500 },
      })
    } catch (err) {
      logError('Alert listener: failed to enqueue', err as Error)
    }
  })

  logInfo('Alert listener started on intelligence_alert channel')
}
```

**Clearance check in worker** (RF-5 requirement — indistinguishable empty):

```typescript
// In the BullMQ worker handler for 'intelligence-alert' jobs:
const { data: profile } = await supabase
  .from('profiles')
  .select('clearance_level')
  .eq('user_id', rule.owner_id) // profiles.user_id, NOT profiles.id
  .single()

const ownerClearance = profile?.clearance_level ?? 1
if (payload.sensitivity_level > ownerClearance) {
  // Silently skip — indistinguishable empty (P68 D-09)
  // Do NOT log "above clearance" — no observable side effect
  return
}
// Dispatch to ChannelAdapter only after clearance check passes
```

---

### `backend/src/queues/notification.queue.ts` (queue, EXTEND)

**Analog:** `backend/src/queues/notification.queue.ts` lines 31–53 (self-reference — add new job name branches)

**Worker switch pattern** (notification.queue.ts lines 33–43):

```typescript
;async (job: Job<NotificationJobData>) => {
  if (job.name === 'check-deadlines') {
    await processDeadlineCheck()
    return
  }
  if (job.name === 'process-daily-digests' || job.name === 'process-weekly-digests') {
    await processDigestJob(job.name)
    return
  }
  // ADD: intelligence job branches (keep existing branches untouched)
  if (
    job.name === 'process-intelligence-digests-daily' ||
    job.name === 'process-intelligence-digests-weekly' ||
    job.name === 'process-intelligence-digests-monthly'
  ) {
    await processIntelligenceDigestJob(job.name)
    return
  }
  if (job.name === 'intelligence-alert') {
    await processIntelligenceAlertJob(job.data)
    return
  }
  await processNotificationJob(job)
}
```

---

### `backend/src/services/intelligence-digest.service.ts` (service, CRUD + transform)

**Analog:** `backend/src/queues/digest-scheduler.ts` (supabase RPC + render + insert pattern)

**RPC call + render + insert pattern** (digest-scheduler.ts lines 112–174):

```typescript
// Step 1: call INVOKER RPC with explicit clearance
const { data: content, error: rpcError } = await supabase.rpc('generate_digest_content', {
  p_dossier_id: dossierId,
  p_since: since.toISOString(),
  p_until: until.toISOString(),
  p_clearance_level: clearanceLevel,
})
if (rpcError !== null) {
  logError(`Digest content RPC failed`, rpcError as unknown as Error)
  throw rpcError
}

// Step 2: render bilingual template (reuse existing service)
const { subject, bodyHtml, bodyText } = renderWeeklyDigestTemplate(language, dateRange, content)

// Step 3: insert intelligence_digest row (NOT email_queue)
const { error: insertError } = await supabase.from('intelligence_digest').insert({
  organization_id: orgId,
  dossier_type: dossierType,
  dossier_id: dossierId,
  period_start: since.toISOString(),
  period_end: until.toISOString(),
  period: periodKey, // e.g. 'daily-2026-06-15'
  summary: bodyText,
  subscriber_id: subscriberId,
  clearance_level_at_generation: clearanceLevel,
  frequency: frequency,
  published_at: isScheduledCron ? new Date().toISOString() : null,
  generated_by: subscriberId,
})
// Catch UNIQUE constraint violation (23505) as expected duplicate — log INFO, not ERROR
```

---

### `backend/src/services/alerts.service.ts` (service — REPLACE, NOT EXTEND)

**REPLACE ENTIRELY.** The current file is an **in-memory `Map` stub** (RESEARCH.md "State of the Art"). It has no persistence and does not survive restarts.

**Current stub to DELETE** (alerts.service.ts lines 19–75 — the entire `Map` + `AlertsService` class).

**Replacement pattern** (mirror `backend/src/api/notifications.ts` — supabaseAdmin CRUD via PostgREST):

```typescript
// New alerts.service.ts wraps intelligence_alert_rules table via supabaseAdmin
import { supabaseAdmin } from '../config/supabase'
import type { IntelligenceAlertRule, CreateAlertRuleInput } from '../types/intelligence.types'

export async function listAlertRules(ownerId: string): Promise<IntelligenceAlertRule[]> {
  const { data, error } = await supabaseAdmin
    .from('intelligence_alert_rules')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error !== null) throw error
  return (data ?? []) as IntelligenceAlertRule[]
}

export async function createAlertRule(input: CreateAlertRuleInput): Promise<IntelligenceAlertRule> {
  const { data, error } = await supabaseAdmin
    .from('intelligence_alert_rules')
    .insert(input)
    .select()
    .single()

  if (error !== null) throw error
  return data as IntelligenceAlertRule
}
// ... update, delete follow same pattern
```

---

### `backend/src/api/intelligence-digest.ts` + `backend/src/api/intelligence-alerts.ts` (controller, request-response)

**Analog:** `backend/src/api/notifications.ts` — Express Router with `supabaseAdmin` RPC calls + auth guard.

**Imports + Router pattern** (notifications.ts lines 1–4):

```typescript
import { Router } from 'express'
import type { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
```

**Auth guard pattern** (notifications.ts lines 31–35):

```typescript
const userId = (req as any).user?.id
if (!userId) {
  res.status(401).json({ error: 'Unauthorized' })
  return
}
```

**Error handling pattern** (notifications.ts lines 50–56):

```typescript
try {
  const { data, error } = await supabaseAdmin.rpc('...', { p_user_id: userId })
  if (error) {
    res.status(500).json({ error: 'Failed to ...' })
    return
  }
  res.json({ data })
} catch (err) {
  res.status(500).json({ error: 'Internal server error' })
}
```

---

### `frontend/src/pages/intelligence/IntelligencePage.tsx` (page, EXTEND)

**Analog:** `frontend/src/pages/intelligence/IntelligencePage.tsx` lines 146–175 — self; ADD two tab buttons and two tab content branches.

**Tab switching pattern** (IntelligencePage.tsx lines 149 + 401–418):

```typescript
const [activeTab, setActiveTab] = useState<'reports' | 'signals'>('reports')

// Tab bar
<div className="flex gap-2 mb-4">
  <Button
    variant={activeTab === 'reports' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setActiveTab('reports')}
  >
    {t('intelligence.tabs.reports', { defaultValue: 'Reports' })}
  </Button>
  <Button
    variant={activeTab === 'signals' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setActiveTab('signals')}
  >
    {tSignals('tab.label')}
  </Button>
  // ADD: 'digests' and 'alerts' buttons in same pattern
</div>

// Tab content
{activeTab === 'signals' && <SignalsQueue />}
// ADD:
{activeTab === 'digests' && <DigestsTab />}
{activeTab === 'alerts' && <AlertsTab />}
```

**i18n pattern for new tabs**:

```typescript
const { t: tDigests } = useTranslation('intelligence-digests')
const { t: tAlerts } = useTranslation('intelligence-alerts')
```

**dir + isRTL pattern** (IntelligencePage.tsx line 390):

```tsx
<div className="container mx-auto py-6" dir={isRTL ? 'rtl' : 'ltr'}>
```

---

### `frontend/src/components/intelligence/DigestsTab.tsx` (component, request-response)

**Analog:** `frontend/src/components/signals/SignalsQueue.tsx` lines 1–80 — exact structural copy for the list container pattern.

**Imports pattern** (SignalsQueue.tsx lines 1–30):

```typescript
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDirection } from '@/hooks/useDirection'
import { useDigests } from '@/domains/signals/hooks/useDigests'
import { DigestCard } from './DigestCard'
import { DigestSubscribeDrawer } from './DigestSubscribeDrawer'
import { GenerateDigestButton } from './GenerateDigestButton'
```

**Component shell pattern** (SignalsQueue.tsx lines 39–80):

```typescript
interface DigestsTabProps {
  dossierId?: string    // undefined = /intelligence global list; defined = per-dossier tab
}

export function DigestsTab({ dossierId }: DigestsTabProps): React.ReactElement {
  const { t } = useTranslation('intelligence-digests')
  const { isRTL } = useDirection()

  const { data: digests = [], isLoading, isError } = useDigests({ dossierId })

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* filter bar + list */}
      {/* Empty state: generic copy only — never mention clearance (P68 D-09) */}
    </div>
  )
}
```

**Empty state rule**: generic copy only — never "no results matching your clearance". Mirror SignalsQueue.tsx lines 70–79 (dossierId-conditional copy).

---

### `frontend/src/components/intelligence/DigestCard.tsx` (component, request-response)

**Analog:** `frontend/src/components/signals/SignalRow.tsx`

**Card pattern** — token-only styling (CLAUDE.md design rules):

```typescript
// All colors via var(--*) tokens only — no raw hex, no Tailwind color literals
// Borders: 1px solid var(--line); no drop-shadows on cards
// Row heights: var(--row-h)
// Logical properties: ms-*, ps-* (not ml-*, pl-*)
import { useDirection } from '@/hooks/useDirection'

export function DigestCard({ digest }: { digest: Digest }): React.ReactElement {
  const { isRTL } = useDirection()
  // ...
  return (
    <div
      className="border-b border-line flex items-start gap-3 px-4 py-3"
      style={{ minHeight: 'var(--row-h)' }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* content */}
    </div>
  )
}
```

---

### `frontend/src/components/intelligence/DigestSubscribeDrawer.tsx` (component, CRUD)

**Analog:** `frontend/src/components/notifications/NotificationPanel.tsx` lines 1–80 (Popover/drawer + Tabs pattern)

**Tabs pattern** (NotificationPanel.tsx lines 6–7):

```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
```

The drawer renders: dossier name (context), frequency selector (daily/weekly/monthly), subscribe/unsubscribe CTA. Uses `useMutation` from TanStack Query for the CRUD action. Pattern mirrors notification preference panel structure.

---

### `frontend/src/components/intelligence/AlertsTab.tsx` (component, request-response)

**Analog:** `frontend/src/components/signals/SignalsQueue.tsx` (same list container structure)

Same structural pattern as `DigestsTab.tsx`. Differences:

- `useAlertRules` instead of `useDigests`
- Renders `AlertRuleForm` for create/edit
- No "generate" button; has "Add alert rule" button
- Empty state: generic (no clearance mention)

---

### `frontend/src/components/intelligence/AlertRuleForm.tsx` (component, CRUD)

**Analog:** `frontend/src/components/signals/CaptureSignalForm.tsx`

**Form pattern** (CaptureSignalForm — React Hook Form + useMutation):

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'

const alertRuleSchema = z.object({
  dossier_id: z.string().uuid(),
  dossier_type: z.enum([
    'country',
    'organization',
    'forum',
    'engagement',
    'topic',
    'working_group',
    'person',
    'elected_official',
  ]),
  condition_type: z.literal('new_signal'),
  condition_config: z.object({ severity_filter: z.array(z.enum(['high', 'urgent'])).optional() }),
  channels: z.array(z.enum(['in_app', 'smtp', 'webhook'])).min(1),
})
```

---

### `frontend/src/components/intelligence/GenerateDigestButton.tsx` (component, request-response)

**Analog:** `frontend/src/components/signals/EscalateSignalDialog.tsx` (confirm-before-action dialog pattern)

**Dialog HITL pattern**:

```typescript
// Step 1: call generate_digest RPC → preview JSON
// Step 2: render preview card
// Step 3: user clicks Publish → call publish_digest RPC → invalidate query cache
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function GenerateDigestButton({ dossierId, period }: Props): React.ReactElement {
  const [preview, setPreview] = useState<DigestPreview | null>(null)
  const queryClient = useQueryClient()

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_digest', {
        p_dossier_id: dossierId,
        p_period: period,
      })
      if (error) throw error
      return data as DigestPreview
    },
    onSuccess: (data) => setPreview(data),
  })

  const publishMutation = useMutation({
    mutationFn: async (preview: DigestPreview) => {
      const { data, error } = await supabase.rpc('publish_digest', {
        p_dossier_id: dossierId,
        p_period: period,
        p_summary: renderSummaryText(preview),
        p_clearance_level_at_generation: preview.clearance_level,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setPreview(null)
      void queryClient.invalidateQueries({ queryKey: ['intelligence-digests'] })
    },
  })
  // ...
}
```

---

### `frontend/src/domains/signals/hooks/useDigests.ts` (hook, request-response)

**Analog:** `frontend/src/domains/signals/hooks/useSignals.ts` — EXACT copy; change RPC name + types.

**useQuery RPC pattern** (useSignals.ts lines 24–39):

```typescript
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Digest, DigestFilters } from '../types/digest.types'

export function useDigests(filters: DigestFilters = {}): UseQueryResult<Digest[]> {
  return useQuery({
    queryKey: ['intelligence-digests', filters],
    queryFn: async (): Promise<Digest[]> => {
      const { data, error } = await supabase.rpc('read_digests', {
        p_dossier_id: filters.dossierId ?? null,
        p_limit: filters.limit ?? 50,
      })
      if (error) throw error
      return (data as Digest[]) ?? []
    },
    staleTime: 60_000, // mirror useSignals.ts line 36
  })
}
```

Note: `read_digests` is a new SECURITY INVOKER RPC to be added in the migration, following the `read_signals` shape. The frontend never calls `supabaseAdmin`; clearance gating is enforced at the RPC layer under the caller's JWT.

---

### `frontend/src/domains/signals/hooks/useAlertRules.ts` (hook, CRUD)

**Analog:** `frontend/src/domains/signals/hooks/useSignals.ts` (read) + TanStack Query `useMutation` for CRUD.

```typescript
import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AlertRule, CreateAlertRuleInput } from '../types/alert-rule.types'

const QUERY_KEY = 'intelligence-alert-rules'

export function useAlertRules(dossierId?: string): UseQueryResult<AlertRule[]> {
  return useQuery({
    queryKey: [QUERY_KEY, dossierId],
    queryFn: async (): Promise<AlertRule[]> => {
      let q = supabase
        .from('intelligence_alert_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (dossierId != null) q = q.eq('dossier_id', dossierId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as AlertRule[]
    },
    staleTime: 60_000,
  })
}

export function useCreateAlertRule(): ReturnType<typeof useMutation> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateAlertRuleInput) => {
      const { data, error } = await supabase
        .from('intelligence_alert_rules')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
```

---

### `frontend/src/i18n/index.ts` (config, EXTEND)

**Analog:** `frontend/src/i18n/index.ts` lines 252–255 + 386–388 (the P69 addition is the exact template)

**Import block to add** (mirror P69 lines 253–254):

```typescript
// Phase 70: intelligence-digests and intelligence-alerts namespaces
import enIntelligenceDigests from './en/intelligence-digests.json'
import arIntelligenceDigests from './ar/intelligence-digests.json'
import enIntelligenceAlerts from './en/intelligence-alerts.json'
import arIntelligenceAlerts from './ar/intelligence-alerts.json'
```

**Resources block to extend** (mirror P69 lines 386–387 in BOTH `en:` and `ar:` objects):

```typescript
// In en: { ... }
'intelligence-digests': enIntelligenceDigests,
'intelligence-alerts': enIntelligenceAlerts,

// In ar: { ... }
'intelligence-digests': arIntelligenceDigests,
'intelligence-alerts': arIntelligenceAlerts,
```

**CI guard:** The P68 CI lint rule fails any unregistered namespace at build time (silent English fallback in Arabic is the failure mode). Both namespace keys must appear in both language objects before any component uses `useTranslation('intelligence-digests')` or `useTranslation('intelligence-alerts')`.

---

## Shared Patterns

### Clearance check — canonical form

**Source:** `supabase/migrations/20260614_phase69_signals_extend.sql` lines 62–64
**Apply to:** All SQL in the migration file (RLS policies, RPCs, trigger function)

```sql
-- In any SQL context where caller's clearance must be read:
(SELECT clearance_level FROM profiles WHERE user_id = auth.uid())
-- NEVER: WHERE id = auth.uid()  — profiles has no `id` column; silently returns NULL → blocks all reads
```

### supabase service-role client init

**Source:** `backend/src/queues/digest-scheduler.ts` lines 10–13
**Apply to:** All new backend queue/scheduler/service files

```typescript
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)
```

Use this (service-role) only in BullMQ workers and cron processors. Frontend hooks use the session-scoped `@/lib/supabase` client — never `supabaseAdmin`.

### BullMQ queue connection

**Source:** `backend/src/queues/queue-connection.ts` (full file, 15 lines)
**Apply to:** Any new BullMQ Queue or Worker instantiation

```typescript
import { queueConnection } from './queue-connection'
// ...
new Queue('notifications', { connection: queueConnection, ... })
new Worker('notifications', handler, { connection: queueConnection, ... })
```

Do NOT create a new Redis connection. Reuse `queueConnection` (it has `maxRetriesPerRequest: null` which BullMQ requires; a new connection with different settings will cause subtle failures).

### Error handling — cron batch: continue, don't throw

**Source:** `backend/src/queues/digest-scheduler.ts` lines 176–179
**Apply to:** `intelligence-digest.scheduler.ts` per-subscriber loop, `intelligence-alert.worker.ts` per-rule loop

```typescript
} catch (err) {
  logError(`error processing subscriber ${subscriberId}`, err as Error)
  // continue — do not re-throw; one failure must not abort the entire batch
}
```

### Error handling — top-level worker: re-throw so BullMQ retries

**Source:** `backend/src/queues/deadline-scheduler.ts` lines 116–121
**Apply to:** The top-level `processDeadlineCheck` equivalent in alert/digest workers

```typescript
} catch (err) {
  logError('worker failed', err as Error)
  throw err  // re-throw so BullMQ marks job failed + applies exponential backoff
}
```

### TanStack Query hook structure

**Source:** `frontend/src/domains/signals/hooks/useSignals.ts` (full file, 39 lines)
**Apply to:** `useDigests.ts`, `useAlertRules.ts`

```typescript
return useQuery({
  queryKey: signalKeys.list(filters), // use a typed key factory
  queryFn: async () => {
    const { data, error } = await supabase.rpc('rpc_name', { ...params })
    if (error) throw error
    return (data as T[]) ?? []
  },
  staleTime: 60_000,
})
```

### isRTL + dir prop pattern

**Source:** `frontend/src/pages/intelligence/IntelligencePage.tsx` line 390 + NotificationPanel.tsx line 35
**Apply to:** All new frontend components

```typescript
import { useDirection } from '@/hooks/useDirection'
const { isRTL } = useDirection()
// ...
<div dir={isRTL ? 'rtl' : 'ltr'}>
```

### Design token compliance

**Source:** CLAUDE.md "Design rules — non-negotiable"
**Apply to:** All new frontend components

- All colors: `var(--*)` tokens or `@theme`-mapped Tailwind utilities (`bg-bg`, `text-ink`, `border-line`)
- No raw hex, no `text-blue-500`
- Borders: `1px solid var(--line)`, no drop-shadows on cards
- Row heights: `var(--row-h)`
- Logical Tailwind props: `ms-*`, `ps-*`, `text-start` — never `ml-*`, `pl-*`, `text-left`
- No emoji in copy, sentence case for all labels

### Indistinguishable empty state

**Source:** `frontend/src/components/signals/SignalsQueue.tsx` lines 70–79 (P68 D-09 enforcement)
**Apply to:** All empty states in DigestsTab, AlertsTab, DigestCard loading states

```typescript
// Generic copy only — never "filtered by clearance" or "no results at your clearance level"
const emptyHeading =
  dossierId !== undefined
    ? t('queue.emptyDossier') // "No digests for this dossier"
    : t('queue.emptyState.heading') // "No digests yet"
// Never: "No digests matching your clearance level"
```

---

## Files With No Analog (planner uses RESEARCH.md patterns instead)

| File                                             | Role   | Data Flow | Reason                                                                                       |
| ------------------------------------------------ | ------ | --------- | -------------------------------------------------------------------------------------------- |
| `frontend/src/i18n/en/intelligence-digests.json` | config | —         | New translation file; no analog; create from `intelligence-signals.json` as a shape template |
| `frontend/src/i18n/ar/intelligence-digests.json` | config | —         | Same                                                                                         |
| `frontend/src/i18n/en/intelligence-alerts.json`  | config | —         | Same                                                                                         |
| `frontend/src/i18n/ar/intelligence-alerts.json`  | config | —         | Same                                                                                         |

Shape reference: `frontend/src/i18n/en/intelligence-signals.json` (P69 namespace) — copy its structure (tab label, queue states, action labels) and adapt keys for digest/alert vocabulary.

---

## Critical Anti-Patterns (BLOCK LIST)

These are patterns that exist in the codebase but MUST NOT be applied to P70 files:

1. **`email_queue` insert for intelligence emails** — routes to `email-send` edge fn (SendGrid/Resend cloud egress). Intelligence emails use `smtp-adapter.ts` → nodemailer only.
2. **`alertsService` (in-memory Map)** — `backend/src/services/alerts.service.ts` is a stub to be REPLACED entirely with the DB-backed model. Do not call or import it in new code.
3. **`WHERE id = auth.uid()` on profiles** — P69 live bug; always `WHERE user_id = auth.uid()`.
4. **`supabaseAdmin` in frontend** — never; clearance gating depends on the session JWT being the caller identity.
5. **SECURITY DEFINER on new RPCs** — all P70 RPCs are SECURITY INVOKER (exception: the trigger function `notify_intelligence_alert()` must be DEFINER to call pg_notify, which is correct).
6. **Signal title/content in pg_notify payload** — trigger payload carries `event_id`, `organization_id`, `sensitivity_level`, `severity`, `occurred_at` only.
7. **`.reverse()` on signal/digest arrays** — RTL is handled by `dir=rtl`; manual array reversal double-flips.
8. **Logging clearance denial** — `"sensitivity_level > clearance_level"` must never appear in logs.

---

## Metadata

**Analog search scope:** `backend/src/queues/`, `backend/src/services/`, `backend/src/api/`, `frontend/src/domains/signals/`, `frontend/src/components/signals/`, `frontend/src/components/notifications/`, `frontend/src/pages/intelligence/`, `supabase/migrations/`, `frontend/src/i18n/`
**Files scanned:** 19 source files read in full or targeted sections
**Pattern extraction date:** 2026-06-15
