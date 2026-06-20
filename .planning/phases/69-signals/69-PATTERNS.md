# Phase 69: Signals — Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 16 new/modified files
**Analogs found:** 14 / 16 (2 net-new — flagged below)

---

## File Classification

| New/Modified File                                               | Role      | Data Flow              | Closest Analog                                                                            | Match Quality |
| --------------------------------------------------------------- | --------- | ---------------------- | ----------------------------------------------------------------------------------------- | ------------- |
| `supabase/migrations/20260614_phase69_signals_extend.sql`       | migration | batch/DDL              | `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql`            | exact         |
| `frontend/src/domains/signals/types/signal.types.ts`            | type      | —                      | `frontend/src/types/dossier-context.types.ts` (interface + discriminated-union shape)     | role-match    |
| `frontend/src/domains/signals/hooks/useSignals.ts`              | hook      | request-response / RPC | `frontend/src/hooks/useCreateWorkItemDossierLinks.ts`                                     | role-match    |
| `frontend/src/domains/signals/hooks/useSignalMutations.ts`      | hook      | CRUD                   | `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts`                             | exact         |
| `frontend/src/domains/signals/hooks/useSignalEscalate.ts`       | hook      | CRUD / orchestration   | `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts` (useEscalationAction)       | role-match    |
| `frontend/src/domains/signals/index.ts`                         | barrel    | —                      | `frontend/src/domains/intake/index.ts`                                                    | exact         |
| `frontend/src/components/signals/SignalsQueue.tsx`              | component | request-response       | `frontend/src/pages/IntakeQueue.tsx`                                                      | role-match    |
| `frontend/src/components/signals/SignalRow.tsx`                 | component | transform              | `frontend/src/pages/IntakeQueue.tsx` (ticket Card block, lines 457–568)                   | role-match    |
| `frontend/src/hooks/useSignalKeyboardTriage.ts`                 | hook      | event-driven           | **NO ANALOG** — keyboard inbox pattern is net-new                                         | none          |
| `frontend/src/components/signals/CaptureSignalForm.tsx`         | component | CRUD                   | `frontend/src/components/positions/DossierPositionsTab.tsx` (drawer + form structure)     | partial-match |
| `frontend/src/components/signals/EscalateSignalDialog.tsx`      | component | request-response       | `frontend/src/components/waiting-queue/EscalationDialog.tsx`                              | exact         |
| `frontend/src/components/signals/SignalStatusBadge.tsx`         | component | transform              | `frontend/src/pages/intelligence/IntelligencePage.tsx` (ClassificationBadge, lines 42–64) | role-match    |
| `frontend/src/components/dossier/tabs/DossierSignalsTab.tsx`    | component | request-response       | `frontend/src/components/positions/DossierPositionsTab.tsx`                               | exact         |
| `frontend/src/pages/intelligence/IntelligencePage.tsx` (MODIFY) | component | request-response       | itself — tab switcher pattern from `IntelligencePage.tsx` lines 145–152, 386–394          | self-extend   |
| `frontend/src/i18n/en/intelligence-signals.json`                | i18n      | —                      | `frontend/src/i18n/en/tasks-page.json` (any recent phase-scoped namespace file)           | exact         |
| `frontend/src/i18n/ar/intelligence-signals.json`                | i18n      | —                      | `frontend/src/i18n/ar/tasks-page.json`                                                    | exact         |
| `frontend/src/i18n/index.ts` (MODIFY)                           | config    | —                      | itself — lines 245–252 (Phase 42 Wave 0 block) + lines 364–376 (Quick 260605-u2z block)   | self-extend   |

---

## Pattern Assignments

### `supabase/migrations/20260614_phase69_signals_extend.sql` (migration, batch/DDL)

**Analog:** `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql`

**Migration header pattern** (lines 1–15 of analog):

```sql
-- Phase 69: Extend intelligence_event for structured signals
-- Apply via Supabase MCP to project zkrcjzdemdmwhearhfgg
-- Requirements: SIGNAL-01..06
-- Decisions:
--   D-06 — extend intelligence_event in place (NOT a new curated table)
--   D-03 — add status column (new/acknowledged/dismissed/escalated)
--   D-05 — LOOSEN RLS from admin/editor-only to any-cleared-user
--   D-14 — SECURITY INVOKER read_signals RPC
```

**ALTER TABLE + index pattern** (lines 34–56 of analog — CREATE TABLE equivalent for ALTER):

```sql
-- Pattern: idempotent ADD COLUMN IF NOT EXISTS + partial indexes
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

CREATE INDEX IF NOT EXISTS idx_intelligence_event_status
  ON public.intelligence_event (organization_id, status, occurred_at DESC);
```

**RLS policy replacement pattern** (lines 60–85 of analog — DROP then CREATE):

```sql
-- Pattern: DROP IF EXISTS first, then CREATE (never ALTER POLICY)
DROP POLICY IF EXISTS intelligence_event_select_org ON public.intelligence_event;
DROP POLICY IF EXISTS intelligence_event_insert_editor ON public.intelligence_event;

CREATE POLICY intelligence_event_select_clearance
  ON public.intelligence_event FOR SELECT TO authenticated
  USING (
    tenant_isolation.rls_select_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
  );
```

**Canonical clearance comparison** (from `20251022000009_update_polymorphic_refs.sql` lines 102/119):

```sql
-- THE canonical expression — copy verbatim, never vary it:
sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
```

**SECURITY INVOKER RPC pattern** (net-new in P69 — no prior analog; use the full spec from RESEARCH.md RF-5):

```sql
CREATE OR REPLACE FUNCTION public.read_signals(...)
RETURNS TABLE (...)
LANGUAGE SQL
SECURITY INVOKER   -- CRITICAL: never SECURITY DEFINER
STABLE
AS $$ ... $$;

GRANT EXECUTE ON FUNCTION public.read_signals TO authenticated;
COMMENT ON FUNCTION public.read_signals IS '...';
```

**Deltas vs. analog:** Phase 54 migration CREATEs new tables; this migration ALTERs an existing table and replaces 4 RLS policies. The DROP + CREATE policy pattern is identical. The 42804 trap requires `source_type::text` cast in the RETURNS TABLE body.

---

### `frontend/src/domains/signals/types/signal.types.ts` (type, —)

**Analog:** `frontend/src/hooks/useCreateWorkItemDossierLinks.ts` (lines 22–36 — interface block + `WorkItemType` union) and `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts` (lines 47–57, 116–127 — typed request/response interfaces)

**Interface + union pattern** (lines 22–36 of `useCreateWorkItemDossierLinks.ts`):

```typescript
// Pattern: named interface for request/response + const-assertion union for enums
export interface CreateWorkItemDossierLinksRequest {
  work_item_type: WorkItemType
  work_item_id: string
  dossier_ids: string[]
  inheritance_source: InheritanceSource
}
```

**Apply to signals:**

```typescript
export type SignalStatus = 'new' | 'acknowledged' | 'dismissed' | 'escalated'
export type SignalCategory = 'political' | 'economic' | 'security' | 'diplomatic' | 'other'
export type SignalSeverity = 'low' | 'medium' | 'high' | 'urgent'
export type SignalSourceType = 'human_entered' | 'ai_generated' | 'publication' | 'feed'

export interface Signal {
  id: string
  title: string
  content: string
  sensitivity_level: number // 1–4
  severity: SignalSeverity
  category: SignalCategory | null
  source_type: SignalSourceType
  source_ref: string | null
  ai_confidence: number | null // 0.00–1.00; null for human_entered
  status: SignalStatus
  occurred_at: string
  created_at: string
  created_by: string
  escalated_task_id: string | null
  organization_id: string
}

export interface SignalFilters {
  dossierId?: string
  status?: SignalStatus
  since?: string
  limit?: number
}

export type CreateSignalInput = {
  title: string
  body: string
  severity: SignalSeverity
  category: SignalCategory
  sensitivityLevel: number
  dossierIds: string[]
  dossierType?: string // used per-junction-row when multi-dossier
}
```

**Deltas vs. analog:** No repository pattern here — signals use direct Supabase client + RPC. The type file is purely types, no logic.

---

### `frontend/src/domains/signals/hooks/useSignals.ts` (hook, request-response / RPC)

**Analog:** `frontend/src/hooks/useCreateWorkItemDossierLinks.ts` (lines 67–73 — queryKeys factory) + `frontend/src/pages/IntakeQueue.tsx` (lines 128–161 — useQuery with filters in queryKey)

**Query key factory pattern** (lines 67–73 of `useCreateWorkItemDossierLinks.ts`):

```typescript
export const workItemDossierKeys = {
  all: ['work-item-dossiers'] as const,
  lists: () => [...workItemDossierKeys.all, 'list'] as const,
  list: (workItemType: string, workItemId: string) =>
    [...workItemDossierKeys.lists(), workItemType, workItemId] as const,
}
```

**Apply to signals:**

```typescript
export const signalKeys = {
  all: ['signals'] as const,
  lists: () => [...signalKeys.all, 'list'] as const,
  list: (filters: SignalFilters) => [...signalKeys.lists(), filters] as const,
}
```

**useQuery with RPC pattern** (lines 128–161 of `IntakeQueue.tsx`, adapted):

```typescript
export function useSignals(filters: SignalFilters = {}): UseQueryResult<Signal[]> {
  return useQuery({
    queryKey: signalKeys.list(filters),
    queryFn: async (): Promise<Signal[]> => {
      const { data, error } = await supabase.rpc('read_signals', {
        p_dossier_id: filters.dossierId ?? null,
        p_status: filters.status ?? null,
        p_since: filters.since ?? null,
        p_limit: filters.limit ?? 50,
      })
      if (error) throw error
      return (data as Signal[]) ?? []
    },
    staleTime: 60_000,
  })
}
```

**Key difference vs. IntakeQueue.tsx:** Uses `supabase.rpc()` (INVOKER RPC) instead of `supabase.from().select()`. The `staleTime: 60_000` mirrors the `1 * 60 * 1000` in IntakeQueue line 161. Explicit return type on `queryFn` is required by the ESLint `explicit-function-return-type` rule.

---

### `frontend/src/domains/signals/hooks/useSignalMutations.ts` (hook, CRUD)

**Analog:** `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts` — the mutation factory pattern (lines 59–70 for `useReminderAction`, lines 132–145 for `useEscalationAction`)

**useMutation pattern** (lines 59–70 and 132–145 of `useWaitingQueueActions.ts`):

```typescript
export function useReminderAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>): Promise<SendReminderResponse> => {
      return sendReminderApi(data) as Promise<SendReminderResponse>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['waiting-queue'] })
    },
  })
}
```

**Apply to signals — three mutations in this file:**

```typescript
// 1. Create signal (insert + junction rows)
export function useCreateSignal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSignalInput): Promise<Signal> => {
      const { data: ie, error } = await supabase
        .from('intelligence_event')
        .insert({
          organization_id: userOrgId,
          source_type: 'human_entered',
          title: input.title,
          content: input.body,
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
      // link junction rows...
      return ie as Signal
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: signalKeys.lists() }),
  })
}

// 2. Update status (acknowledge / dismiss / restore)
export function useUpdateSignalStatus() { ... }

// 3. Direct Supabase update — no RPC needed (RF-5 note from RESEARCH.md)
```

**Key difference vs. analog:** The analog delegates to an API repository. Signals use direct `supabase.from()` client calls under the caller's JWT (UPDATE RLS handles auth). Do NOT introduce a repository layer for signals — the direct client is simpler and correct here.

---

### `frontend/src/domains/signals/hooks/useSignalEscalate.ts` (hook, CRUD / orchestration)

**Analog:** `frontend/src/hooks/useCreateWorkItemDossierLinks.ts` (lines 115–146 — `useCreateWorkItemDossierLinks` mutation with multi-step `onSuccess`) + `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts` (lines 132–145 — escalation mutation shape)

**Multi-step orchestration pattern** (lines 115–146 of `useCreateWorkItemDossierLinks.ts`):

```typescript
export function useCreateWorkItemDossierLinks(options: UseCreateWorkItemDossierLinksOptions = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createWorkItemDossierLinks,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workItemDossierKeys.list(...) })
      variables.dossier_ids.forEach((dossierId) => {
        queryClient.invalidateQueries({ queryKey: workItemDossierKeys.timeline(dossierId) })
      })
      onSuccess?.(data)
    },
    onError: (error: Error) => {
      console.error('Failed to create work item dossier links:', error)
      onError?.(error)
    },
  })
}
```

**Apply to signal escalation — 3-step sequence:**

```typescript
// useSignalEscalate.ts orchestrates:
// Step 1: supabase.functions.invoke('tasks-create', { body: taskPayload })
// Step 2: supabase.functions.invoke('work-item-dossiers', { body: { work_item_type: 'task', ... } })
// Step 3: supabase.from('intelligence_event').update({ status: 'escalated', escalated_task_id: task.id })
//         .eq('id', signalId)
// All under the caller's JWT — do NOT use supabaseAdmin.
```

**`tasks-create` invocation pattern** (from `frontend/src/hooks/useCreateWorkItemDossierLinks.ts` lines 44–60 — `supabase.functions.invoke` shape):

```typescript
const { data, error } = await supabase.functions.invoke<CreateWorkItemDossierLinksResponse>(
  'work-item-dossiers',
  { body: request },
)
if (error) throw new Error(error.message || 'Failed to create dossier links')
if (!data) throw new Error('No data returned')
```

**Pitfall to avoid:** `work_item_type` MUST be `'task'` when calling `work-item-dossiers`. Any other value silently fails the INSERT RLS (returns empty 200) and dossier links are never created. Add a compile-time assertion: `const workItemType = 'task' as const`.

---

### `frontend/src/components/signals/SignalsQueue.tsx` (component, request-response)

**Analog:** `frontend/src/pages/IntakeQueue.tsx`

**Import + state setup pattern** (lines 21–53 of `IntakeQueue.tsx`):

```typescript
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { useDirection } from '@/hooks/useDirection'
```

**Filter state pattern** (lines 107–125 of `IntakeQueue.tsx`):

```typescript
const [filters, setFilters] = useState<QueueFilters>({ statusCategory: 'pending' })
```

Apply as:

```typescript
const [filters, setFilters] = useState<SignalFilters>({ status: 'new' })
```

**Loading skeleton pattern** (lines 406–416 of `IntakeQueue.tsx`):

```typescript
{isLoading && (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="animate-pulse p-4">
        <div className="mb-3 h-6 w-3/4 rounded bg-muted" />
        <div className="mb-2 h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </Card>
    ))}
  </div>
)}
```

**Error state pattern** (lines 419–423 of `IntakeQueue.tsx`):

```typescript
{!isLoading && isError && (
  <Card className="p-4 sm:p-8 text-center" role="alert">
    <p className="text-sm text-destructive">{t('queue.error', { ns: 'intake' })}</p>
  </Card>
)}
```

Apply with `t('queue.errorState', { ns: 'intelligence-signals' })` — indistinguishable-empty copy.

**RTL dropdown alignment** (line 311 of `IntakeQueue.tsx` — copy verbatim):

```typescript
<DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
```

**Key DELTAS vs. IntakeQueue.tsx:**

1. Queue renders a `<ul role="list">` of `<SignalRow>` components, NOT Card-per-ticket with nested click handlers.
2. Keyboard event listener attaches to the `<ul>` container via `useSignalKeyboardTriage` hook (see net-new flag below).
3. `dossierId` prop controls global vs. per-dossier mode — when present, passes through to `useSignals({ dossierId })`.
4. Filter pills are status-based tabs (All / New / Acknowledged / Dismissed / Escalated), NOT a dropdown.
5. No `usePullToRefresh` — desktop-primary surface.
6. Namespace is `'intelligence-signals'`, NOT `'intake'`.

---

### `frontend/src/components/signals/SignalRow.tsx` (component, transform)

**Analog:** `frontend/src/pages/IntakeQueue.tsx` — the ticket Card block (lines 457–568)

**Row content pattern** (lines 480–537 of `IntakeQueue.tsx`):

```typescript
<div className="flex flex-1 items-start gap-3">
  {/* Content block */}
  <div className="flex-1 space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-base font-semibold text-foreground">{displayTitle}</h3>
      <Badge variant={getPriorityColor(ticket.priority)}>...</Badge>
      <Badge variant={getStatusVariant(ticket.status)} className="text-xs">...</Badge>
    </div>
    <p className="line-clamp-2 text-sm text-muted-foreground">{displayDescription}</p>
    {/* AI suggestion block — copy for ai_confidence */}
    {ticket.ai_suggestion && (
      <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">...</div>
    )}
    {/* Metadata */}
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span>{ticket.source}</span>
      <span>•</span>
      <span>{new Date(ticket.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
    </div>
  </div>
</div>
```

**Key DELTAS vs. IntakeQueue.tsx ticket Card:**

1. Renders as `<li>` inside `<ul role="list">`, NOT a `<Card>` with click handler.
2. Signal title wrapped in `<bdi className="...">` — mandatory per D-09 and UI-SPEC.
3. Height driven by `var(--row-h)`, horizontal padding `var(--pad)`, vertical `var(--space-3)`.
4. Focused row (keyboard): `outline: 2px solid var(--accent); outline-offset: -2px; background: var(--accent-soft)` — via `aria-selected="true"` + CSS selector on the `<li>`.
5. Date format: `format(new Date(signal.occurred_at), 'EEE dd MMM')` → `"Tue 28 Apr"` (not `toLocaleDateString`).
6. Severity badge colors from the severity→color map in UI-SPEC (design tokens, NOT `Badge variant="destructive"`).
7. AI confidence badge rendered only when `signal.source_type === 'ai_generated' && signal.ai_confidence !== null`.
8. Sensitivity badge: mono small, neutral `bg-line-soft`, format `L{N}` (EN) / `م{N}` (AR).
9. No checkbox, no `selectedTickets` state — single-item keyboard actions only.

---

### `frontend/src/hooks/useSignalKeyboardTriage.ts` (hook, event-driven)

**NO ANALOG — NET-NEW.**

`IntakeQueue.tsx` is click-only and has no keyboard navigation. The `j`/`k`/`a`/`d`/`e` inbox pattern must be built from scratch.

**Standard DOM pattern to use (from RESEARCH.md Pattern 1):**

```typescript
// useSignalKeyboardTriage.ts
export function useSignalKeyboardTriage({
  signals,
  onAcknowledge,
  onDismiss,
  onEscalate,
  containerRef,
}: UseSignalKeyboardTriageOptions): UseSignalKeyboardTriageResult {
  const [focusedIndex, setFocusedIndex] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handler = (e: KeyboardEvent): void => {
      // Ignore when focus is inside a dialog or form element
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'j') setFocusedIndex((i) => Math.min(i + 1, signals.length - 1))
      else if (e.key === 'k') setFocusedIndex((i) => Math.max(i - 1, 0))
      else if (e.key === 'a') onAcknowledge(signals[focusedIndex]?.id ?? '')
      else if (e.key === 'd') onDismiss(signals[focusedIndex]?.id ?? '')
      else if (e.key === 'e') onEscalate(signals[focusedIndex] ?? null)
    }

    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [focusedIndex, signals, onAcknowledge, onDismiss, onEscalate, containerRef])

  return { focusedIndex, setFocusedIndex }
}
```

**Important RTL note:** `j`/`k` are logical list navigation (down/up), not physical direction. No RTL flip needed. Event listener attaches to the container `<ul>` element, NOT `window`, to prevent cross-page key leakage.

**Planner budget note:** ~80 lines including types. No library needed — pure DOM + React.

---

### `frontend/src/components/signals/CaptureSignalForm.tsx` (component, CRUD)

**Analog:** `frontend/src/components/positions/DossierPositionsTab.tsx` (lines 27–40 — prop interface + filter state shape) — partial structural match. The drawer pattern is not directly available as a single analog; combine with `EscalationDialog.tsx` for drawer/dialog shell.

**Prop interface pattern** (lines 27–30 of `DossierPositionsTab.tsx`):

```typescript
interface DossierPositionsTabProps {
  dossierId: string
}

export function DossierPositionsTab({ dossierId }: DossierPositionsTabProps) {
  const { t, i18n } = useTranslation(['positions', 'common'])
  const isRTL = i18n.language === 'ar'
```

**Apply to capture form:**

```typescript
interface CaptureSignalFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (signal: Signal) => void
  defaultDossierId?: string
}

export function CaptureSignalForm({ isOpen, onClose, onSuccess, defaultDossierId }: CaptureSignalFormProps) {
  const { t } = useTranslation('intelligence-signals')
  const { isRTL } = useDirection()
```

**Form field validation pattern** (lines 100–113 of `DossierPositionsTab.tsx` — disabled guard + aria pattern):

```typescript
<Button
  onClick={handleCreatePosition}
  disabled={dossierContext === null}
  aria-label={t('positions:dossier_tab.create_position')}
>
```

**Key DELTAS:** CaptureSignalForm is a right-side drawer (max-width 480px, `var(--shadow-lg)`), not a tab section. Fields: title (text, required), body (textarea, optional, `resize: none`), severity (select), category (select), sensitivity_level (select, integers 1–4), dossier links (multi-select). Inline field-level error messages below each required field, not toast. Submit button disabled until required fields filled.

---

### `frontend/src/components/signals/EscalateSignalDialog.tsx` (component, request-response)

**Analog:** `frontend/src/components/waiting-queue/EscalationDialog.tsx` — exact copy base

**Props interface pattern** (lines 43–80 of `EscalationDialog.tsx`):

```typescript
export interface EscalationDialogProps {
  assignmentId?: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  isLoading?: boolean
}
```

**RTL dialog shell** (lines 188–207 of `EscalationDialog.tsx` — copy verbatim):

```typescript
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent
    className="ps-4 pe-4 sm:ps-6 sm:pe-6 max-w-md sm:max-w-lg md:max-w-xl"
    dir={isRTL ? 'rtl' : 'ltr'}
  >
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
        ...
      </DialogTitle>
      <DialogDescription className="text-sm text-start">
        ...
      </DialogDescription>
    </DialogHeader>
```

**Footer button pattern** (lines 335–369 of `EscalationDialog.tsx` — copy verbatim):

```typescript
<DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
  <Button
    type="button"
    variant="outline"
    onClick={onClose}
    disabled={isLoading}
    className="h-11 min-w-11 ps-4 pe-4 sm:ps-6 sm:pe-6 w-full sm:w-auto"
  >
    {t('dialog.cancelEscalation')}   {/* "Cancel escalation" — NOT "Cancel" */}
  </Button>
  <Button
    type="button"
    onClick={handleEscalate}
    disabled={isLoading || !title.trim()}
    className="h-11 min-w-11 ps-4 pe-4 sm:ps-6 sm:pe-6 w-full sm:w-auto"
  >
    {isLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
    {t('actions.escalate')}
  </Button>
</DialogFooter>
```

**Reason field pattern** (lines 300–324 of `EscalationDialog.tsx` — adapt for body textarea):

```typescript
<Textarea
  value={body}
  onChange={(e) => setBody(e.target.value.slice(0, 500))}
  className="min-h-24 text-start resize-none"
  maxLength={500}
  disabled={isLoading}
/>
<div className="flex justify-between items-center text-xs text-muted-foreground">
  <span className="text-start">{/* hint */}</span>
  <span>{body.length}/500</span>
</div>
```

**Key DELTAS vs. analog:**

1. Remove: recipient select, organizational hierarchy fetch, days-waiting badge, `useEscalationAction` hook.
2. Add: pre-filled title input (editable), pre-filled body from `signal.content` (editable, 500 char), pre-filled priority select from `signal.severity` (editable), optional assignee select, optional deadline date input.
3. Submit calls `useSignalEscalate` (3-step sequence) instead of `escalateAssignmentApi`.
4. Guard: `disabled={isLoading || !title.trim()}` (NOT `!reason.trim()` — no reason field).
5. Cancel label: `t('dialog.cancelEscalation')` → `"Cancel escalation"` — matches UI-SPEC copywriting contract.
6. Success toast: `t('toast.escalateSuccess')` → `"Signal escalated. Work item created."`.

---

### `frontend/src/components/signals/SignalStatusBadge.tsx` (component, transform)

**Analog:** `frontend/src/pages/intelligence/IntelligencePage.tsx` — `ClassificationBadge` component (lines 42–64)

**Badge config pattern** (lines 43–64 of `IntelligencePage.tsx`):

```typescript
function ClassificationBadge({ classification, t }: { ... }) {
  const configs = {
    public: { color: 'text-success', bgColor: 'bg-success/10' },
    internal: { color: 'text-accent', bgColor: 'bg-accent/10' },
    confidential: { color: 'text-warning', bgColor: 'bg-warning/10' },
    restricted: { color: 'text-danger', bgColor: 'bg-danger/10' },
  }
  const config = configs[classification as keyof typeof configs]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      {t(`intelligence.classification.${classification}`)}
    </span>
  )
}
```

**Apply — status config map (from UI-SPEC):**

```typescript
const STATUS_CONFIGS: Record<SignalStatus, { color: string; bgColor: string }> = {
  new: { color: 'text-info', bgColor: 'bg-info-soft' },
  acknowledged: { color: 'text-ink-mute', bgColor: 'bg-line-soft' },
  dismissed: { color: 'text-ink-faint', bgColor: 'bg-line-soft' },
  escalated: { color: 'text-accent-ink', bgColor: 'bg-accent-soft' },
}
```

**Deltas:** Use `var(--*)` token class names from the design system, NOT arbitrary `/10` Tailwind opacity utilities. No raw hex. Accepts `status: SignalStatus` prop + optional `t` or uses `useTranslation('intelligence-signals')` internally.

---

### `frontend/src/components/dossier/tabs/DossierSignalsTab.tsx` (component, request-response)

**Analog:** `frontend/src/components/positions/DossierPositionsTab.tsx` — exact structural match (dossier-scoped tab receiving `dossierId` prop, rendering a filtered list)

**Prop + hook pattern** (lines 27–57 of `DossierPositionsTab.tsx`):

```typescript
interface DossierPositionsTabProps {
  dossierId: string
}

export function DossierPositionsTab({ dossierId }: DossierPositionsTabProps) {
  const { t, i18n } = useTranslation(['positions', 'common'])
  const isRTL = i18n.language === 'ar'
  const [searchQuery, setSearchQuery] = useState('')
  const { positions, isLoading, error } = useDossierPositionLinks(dossierId, { ... })
```

**Apply to signals:**

```typescript
interface DossierSignalsTabProps {
  dossierId: string
}

export function DossierSignalsTab({ dossierId }: DossierSignalsTabProps) {
  const { t } = useTranslation('intelligence-signals')
  const { isRTL } = useDirection()
  // Delegates to SignalsQueue with dossierId prop — one component path (D-01)
  return <SignalsQueue dossierId={dossierId} />
}
```

**Error state pattern** (lines 205–213 of `DossierPositionsTab.tsx`):

```typescript
{error ? (
  <div className="bg-danger/5 border border-danger/20 rounded-lg p-6 text-center" role="alert">
    <p className="text-sm text-danger">
      {error instanceof Error ? error.message : t('positions:dossier_tab.error_loading')}
    </p>
  </div>
) : (
  <PositionList ... />
)}
```

**Key DELTAS:** `DossierSignalsTab` is a thin wrapper. The heavy lifting (query, keyboard nav, filter pills) is in `SignalsQueue`. This tab just passes `dossierId` down — keeps the one-component-path D-01 decision.

---

### `frontend/src/pages/intelligence/IntelligencePage.tsx` (MODIFY — add Signals tab)

**Analog:** itself — existing tab-like filter pattern (lines 145–152, 383–394) + `frontend/src/pages/IntakeQueue.tsx` (filter button group pattern lines 302–361)

**Existing dir + isRTL pattern to preserve** (lines 145–151, 387 of `IntelligencePage.tsx`):

```typescript
export function IntelligencePage() {
  const { t } = useTranslation()          // KEEP — existing reports use defaultNS
  const [searchTerm, setSearchTerm] = useState('')
  const { isRTL } = useDirection()

  // ...

  return (
    <div className="container mx-auto py-6" dir={isRTL ? 'rtl' : 'ltr'}>
```

**Add tab state** (insert after line 151):

```typescript
const [activeTab, setActiveTab] = useState<'reports' | 'signals'>('reports')
```

**Tab switcher pattern** (mirrors filter button group at lines 476–516 of `IntelligencePage.tsx`):

```typescript
<div className="flex gap-2 mb-4">
  <Button
    variant={activeTab === 'reports' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setActiveTab('reports')}
  >
    {t('intelligence.tabs.reports')}
  </Button>
  <Button
    variant={activeTab === 'signals' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setActiveTab('signals')}
  >
    {tSignals('tab.label')}   {/* separate hook: useTranslation('intelligence-signals') */}
  </Button>
</div>
{activeTab === 'reports' && <>{/* existing reports content */}</>}
{activeTab === 'signals' && <SignalsQueue />}
```

**Key DELTAS:**

1. The existing `useTranslation()` call (no namespace) must NOT be changed — existing reports use the default common namespace. Add a SECOND `useTranslation('intelligence-signals')` call aliased as `tSignals` for the Signals tab labels.
2. Wrap the entire existing DataTable + search + filter cards in `{activeTab === 'reports' && ...}`.
3. Import `SignalsQueue` from `@/components/signals/SignalsQueue`.

---

### `frontend/src/i18n/en/intelligence-signals.json` and `frontend/src/i18n/ar/intelligence-signals.json` (i18n)

**Analog:** Any recent phase-scoped namespace JSON in `frontend/src/i18n/en/` — e.g. `tasks-page.json` (Phase 42) or `ai-brief.json` (Quick 260605-u2z). Flat key structure with dot-separated sub-keys.

**Namespace key structure to use (from UI-SPEC copywriting contract):**

```json
{
  "tab": { "label": "Signals" },
  "queue": {
    "emptyState": {
      "heading": "No signals.",
      "body": "Capture a signal or wait for AI-surfaced items."
    },
    "emptyDossier": "No signals for this dossier.",
    "emptyDismissed": "No dismissed signals.",
    "emptyEscalated": "No escalated signals.",
    "errorState": "Signals could not be loaded. Refresh to try again.",
    "loading": "Loading signals…",
    "count_one": "{{count}} signal",
    "count_other": "{{count}} signals"
  },
  "actions": {
    "capture": "Capture signal",
    "acknowledge": "Acknowledge",
    "dismiss": "Dismiss",
    "escalate": "Escalate",
    "restore": "Restore",
    "viewWorkItem": "View work item"
  },
  "status": {
    "new": "New",
    "acknowledged": "Acknowledged",
    "dismissed": "Dismissed",
    "escalated": "Escalated"
  },
  "category": {
    "political": "Political",
    "economic": "Economic",
    "security": "Security",
    "diplomatic": "Diplomatic",
    "other": "Other"
  },
  "toast": {
    "dismissed": "Signal dismissed.",
    "restoreAction": "Signal dismissed. Restore?",
    "restored": "Signal restored.",
    "escalateSuccess": "Signal escalated. Work item created."
  },
  "dialog": {
    "escalateTitle": "Escalate signal",
    "escalateDesc": "Create a work item from this signal",
    "cancelEscalation": "Cancel escalation",
    "captureTitle": "Capture signal",
    "discardSignal": "Discard signal"
  },
  "form": {
    "titleLabel": "Title",
    "titlePlaceholder": "Signal title",
    "bodyLabel": "Body",
    "bodyPlaceholder": "Describe the signal…",
    "severityLabel": "Severity",
    "categoryLabel": "Category",
    "sensitivityLabel": "Sensitivity level",
    "dossiersLabel": "Linked dossiers"
  },
  "badge": {
    "aiConfidence": "AI · {{n}}%",
    "sensitivity": "L{{n}}"
  },
  "keyboard": {
    "hint": "J/K navigate · A acknowledge · D dismiss · E escalate"
  },
  "columns": {
    "severity": "SEVERITY",
    "category": "CATEGORY",
    "status": "STATUS",
    "date": "DATE"
  }
}
```

**AR file:** Same key structure, Arabic values from UI-SPEC copywriting table. `badge.sensitivity` → `"م{{n}}"`. `keyboard.hint` → `"ي/ك للتنقل · أ للإقرار · م للرفض · ت للتصعيد"`.

**Critical: NO dot-form namespace use.** Components call `useTranslation('intelligence-signals')` (colon form), then `t('queue.emptyState.heading')`. Never `useTranslation('intelligence.signals')` — that resolves against the common bundle and silently misses all keys (documented MEMORY trap).

---

### `frontend/src/i18n/index.ts` (MODIFY — register new namespace)

**Analog:** itself — the Phase 42 Wave 0 registration block (lines 216–222) and the Quick 260605-u2z block (lines 222–234)

**Registration pattern to copy** (lines 216–222 of `i18n/index.ts`):

```typescript
// Phase 42 Wave 0: page-scoped namespaces for Briefs / After-actions / Tasks reskins
import enBriefsPage from './en/briefs-page.json'
import arBriefsPage from './ar/briefs-page.json'
import enAfterActionsPage from './en/after-actions-page.json'
import arAfterActionsPage from './ar/after-actions-page.json'
import enTasksPage from './en/tasks-page.json'
import arTasksPage from './ar/tasks-page.json'
```

**Apply (add after the last import block, before `const supportedLanguages`):**

```typescript
// Phase 69: intelligence-signals namespace
import enIntelligenceSignals from './en/intelligence-signals.json'
import arIntelligenceSignals from './ar/intelligence-signals.json'
```

**Resources block pattern** (lines 364–368 of `i18n/index.ts`):

```typescript
// Quick 260605-u2z: 11 previously-unregistered namespaces
admin: enAdmin,
'ai-admin': enAiAdmin,
```

**Apply (add to BOTH `en: {}` block at ~line 383 AND `ar: {}` block at ~line 384 in parallel):**

```typescript
// Phase 69
'intelligence-signals': enIntelligenceSignals,
```

**CRITICAL:** Add to BOTH blocks. Missing from `ar` block → Arabic silently stays English. The CI guard (REMED-06 from P68) will catch a missing import but NOT a missing `resources.ar` entry — that path is still silent.

---

## Shared Patterns

### Authentication / Clearance — Applied to ALL signal reads and writes

**Source:** `supabase/migrations/20251022000009_update_polymorphic_refs.sql` (lines 102, 119) + RESEARCH.md RF-2

**Canonical expression (copy verbatim — never vary):**

```sql
sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
```

**Apply to:** All 4 RLS policies on `intelligence_event`, all 3 RLS policies on `intelligence_event_dossiers`, the `read_signals` INVOKER RPC (implicit via caller JWT → RLS). Never in frontend code — clearance is enforced at the DB layer only.

### Caller-JWT pattern — Applied to ALL signal writes

**Source:** `frontend/src/hooks/useCreateWorkItemDossierLinks.ts` (lines 44–60) + `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts`

**Never use `supabaseAdmin`** for signal operations. All mutations use the regular `supabase` client (imported from `@/lib/supabase`) with the user's active JWT session. The Supabase JS client automatically passes the session token.

### RTL + `<bdi>` — Applied to ALL signal text rendering

**Source:** `frontend/src/pages/IntakeQueue.tsx` (line 454 `displayTitle`, line 455 `displayDescription`) + `frontend/src/components/waiting-queue/EscalationDialog.tsx` (line 191 `dir={isRTL ? 'rtl' : 'ltr'}`)

**Pattern (copy for every signal title/body render):**

```tsx
// CORRECT — bidirectional isolation for free-text content (D-09)
<bdi className="[font-size:var(--t-body)]">{signal.title}</bdi>

// WRONG — never this:
<span style={{ textAlign: 'right' }}>{signal.title}</span>
```

**Containers:** `dir={isRTL ? 'rtl' : 'ltr'}` on `DialogContent` (EscalationDialog.tsx line 191) and the `<ul>` queue container. All spacing uses `ms-*`/`me-*`/`ps-*`/`pe-*` — never `ml-*`/`mr-*`/`pl-*`/`pr-*`.

### Error handling — Applied to ALL hooks

**Source:** `frontend/src/hooks/useCreateWorkItemDossierLinks.ts` (lines 140–144) + `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts` (lines 66–69)

```typescript
// Pattern: throw Error with message; never swallow; onError callback for UI
onError: (error: Error) => {
  console.error('Failed to create work item dossier links:', error)
  onError?.(error)
},
```

**For signal mutations:** `console.warn()` or `console.error()` only (ESLint allows these; `console.log` is banned). Errors surface via toast via `useToast()` — same import as `EscalationDialog.tsx` line 41.

### Query invalidation — Applied to ALL mutations

**Source:** `frontend/src/domains/intake/hooks/useWaitingQueueActions.ts` (line 68) + `frontend/src/hooks/useCreateWorkItemDossierLinks.ts` (lines 122–138)

```typescript
// Pattern: invalidate the list key (not the detail key) after any write
onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: signalKeys.lists() })
},
```

**Note:** The `void` prefix on `invalidateQueries` is required by the `@typescript-eslint/no-floating-promises: error` rule — as shown at line 68 of `useWaitingQueueActions.ts`.

---

## No Analog Found

| File                                            | Role | Data Flow    | Reason                                                                                                                                                                                  |
| ----------------------------------------------- | ---- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/hooks/useSignalKeyboardTriage.ts` | hook | event-driven | No keyboard-inbox pattern exists in the codebase. `IntakeQueue.tsx` is click-only. Build fresh from DOM `addEventListener('keydown')` + `useRef` + `useState(focusedIndex)`. ~80 lines. |

---

## Metadata

**Analog search scope:** `frontend/src/pages/`, `frontend/src/components/waiting-queue/`, `frontend/src/components/positions/`, `frontend/src/domains/intake/hooks/`, `frontend/src/hooks/`, `frontend/src/i18n/`, `supabase/migrations/`

**Files scanned:** 12 source files read in full (IntakeQueue.tsx, EscalationDialog.tsx, IntelligencePage.tsx, useWaitingQueueActions.ts, useCreateWorkItemDossierLinks.ts, DossierPositionsTab.tsx, i18n/index.ts ×3 ranges, intelligence.tsx route, 20260516000002 migration, 20251022000009 migration)

**Pattern extraction date:** 2026-06-14
