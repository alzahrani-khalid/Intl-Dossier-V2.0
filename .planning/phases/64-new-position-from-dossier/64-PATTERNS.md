# Phase 64: New Position from Dossier - Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 10 new/modified files
**Analogs found:** 9 / 10 (translate-button UI has no working in-repo analog — wiring pattern composed from repository + api-client analogs)

## File Classification

| New/Modified File                                                                                    | Role                    | Data Flow                             | Closest Analog                                                                                                                     | Match Quality     |
| ---------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `frontend/src/components/positions/NewPositionDialog.tsx` (NEW)                                      | component (dialog form) | request-response (two-step edge POST) | `AddToDossierDialogs.tsx` EventDialog/TaskDialog + `TaskEditDialog.tsx` (RHF+Zod)                                                  | exact (composite) |
| `frontend/src/components/dossier/AddToDossierDialogs.tsx` (MOD)                                      | component (dialog host) | request-response                      | itself — sibling dialogs + main-export wiring L1149-1194                                                                           | exact             |
| `frontend/src/components/positions/DossierPositionsTab.tsx` (MOD)                                    | component (tab)         | CRUD read + dialog orchestration      | itself — attach flow L190-229 is the direct-repo-call + partial-failure precedent                                                  | exact             |
| `frontend/src/domains/positions/hooks/usePositionTypes.ts` (NEW)                                     | hook (lookup query)     | CRUD read (direct PostgREST)          | `frontend/src/hooks/useDossierPositionLinks.ts`                                                                                    | exact             |
| `frontend/src/domains/positions/hooks/useAudienceGroups.ts` (NEW)                                    | hook (lookup query)     | CRUD read (direct PostgREST)          | `frontend/src/hooks/useDossierPositionLinks.ts`                                                                                    | exact             |
| `frontend/src/domains/positions/hooks/useCreatePosition.ts` (MOD)                                    | hook (mutation)         | request-response                      | itself + `useCreatePositionDossierLink.ts`                                                                                         | exact             |
| `frontend/src/domains/positions/repositories/positions.repository.ts` (MOD — add `translateContent`) | repository              | request-response (edge)               | itself — `createPosition` L76-78, `createPositionDossierLink` L163-168                                                             | exact             |
| `supabase/migrations/2026…_restore_positions_insert_policy.sql` (NEW)                                | migration (RLS)         | —                                     | `20260610000002_fix_position_dossier_links_rls_clearance_subquery.sql` + original policy in `20250101011_rls_positions.sql` L48-55 | exact             |
| `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` (NEW)                       | test (RTL unit)         | —                                     | `frontend/src/components/dossier/__tests__/ExportDossierDialog.test.tsx` (Phase 62)                                                | exact             |
| `frontend/src/i18n/en/positions.json` + `ar/positions.json` (MOD)                                    | config (i18n)           | —                                     | existing `positions` ns structure (nested per-feature objects, e.g. `dossier_tab`)                                                 | exact             |

Translate-button **UI** (inside NewPositionDialog): no working analog — `MultiLanguageContentEditor`'s translate button is a dead stub ("translateField API no longer available", per RESEARCH). Visual precedent only; do NOT copy its wiring. See "No Analog Found".

---

## Pattern Assignments

### `frontend/src/components/positions/NewPositionDialog.tsx` (component, request-response)

**Primary analog:** `frontend/src/components/dossier/AddToDossierDialogs.tsx` — EventDialog (L701-833) for shell + dossier-scoped invalidation; TaskDialog (L346-373) for two-step create→link sequencing.
**Secondary analog:** `frontend/src/components/tasks/TaskEditDialog.tsx` for RHF+Zod with i18n-key messages.

**Imports pattern** — `AddToDossierDialogs.tsx` L20-72 (subset relevant to the new dialog):

```typescript
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MessageSquare, Loader2, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { dossierOverviewKeys } from '@/services/dossier-overview.service'
import { useQueryClient } from '@tanstack/react-query'
import type { DossierContextForAction } from '@/hooks/useAddToDossierActions'
```

Plus the RHF+Zod imports from `TaskEditDialog.tsx` L10-31:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
```

NOTE: import `useCreatePosition` from `@/domains/positions` — the current dialog's `@/hooks/useCreatePosition` import (L52) is a deprecated shim (RESEARCH "State of the Art").

**Dialog shell pattern** — current `PositionDialog`, `AddToDossierDialogs.tsx` L643-694 (keep this exact frame: `sm:max-w-lg`, icon title, context badge, footer with cancel + spinner submit, `min-h-11` buttons):

```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        {t('addToDossier.dialogs.position.title')}
      </DialogTitle>
      <DialogDescription>{t('addToDossier.dialogs.position.description')}</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <DossierContextBadge dossierContext={dossierContext} isRTL={isRTL} />
      {/* fields */}
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onClose} className="min-h-11">
          {t('action.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting || !title} className="min-h-11">
          {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
          {t('addToDossier.form.submit.position')}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

`DossierContextBadge` is a file-local component in `AddToDossierDialogs.tsx` L117-144 — if the dialog is extracted, either export it from there or accept the badge as a prop/duplicate the 27-line component (planner choice; it reads `t('addToDossier.context.linkedTo')` from the `dossier` ns).

**RHF+Zod validation pattern** — `TaskEditDialog.tsx` L46-55 (Zod messages are i18n KEYS, rendered via `<FormMessage />`):

```typescript
const editTaskSchema = z.object({
  title: z.string().min(1, 'validation:titleRequired').max(200, 'validation:titleMaxLength'),
  description: z.string().optional(),
  assignee_id: z.string().min(1, 'validation:assigneeRequired'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  ...
})

type EditTaskFormValues = z.infer<typeof editTaskSchema>
```

Form wiring — `TaskEditDialog.tsx` L70-80 and field render L155-171:

```tsx
const form = useForm<EditTaskFormValues>({
  resolver: zodResolver(editTaskSchema),
  defaultValues: { title: task.title, ... },
})
...
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-start">{t('tasks.title', 'Title')}</FormLabel>
      <FormControl>
        <Input {...field} className="h-11" placeholder={...} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

For D-04 "submit disabled until valid": use `form.formState.isValid` with `mode: 'onChange'` (or `'onTouched'`) in `useForm` — RESEARCH "Don't Hand-Roll" row 1. New-position schema shape (fields verified against `CreatePositionPayload`, `frontend/src/types/position.ts` L77-89):

```typescript
// CreatePositionPayload (types/position.ts L77-89) — the exact payload contract:
// position_type_id: string; title_en: string; title_ar: string;
// content_en?: string; content_ar?: string; audience_groups: string[]
const newPositionSchema = z.object({
  position_type_id: z.string().min(1, 'positions:validation.typeRequired'),
  title_en: z.string().min(1, 'positions:validation.titleEnRequired').max(200, '…'),
  title_ar: z.string().min(1, 'positions:validation.titleArRequired').max(200, '…'),
  content_en: z.string().optional(),
  content_ar: z.string().optional(),
  audience_groups: z.array(z.string()).min(1, 'positions:validation.audienceRequired'),
})
```

**Two-step submit + dossier-link sequencing** — TaskDialog, `AddToDossierDialogs.tsx` L346-373 (create → link → invalidate dossier-scoped keys → toast → reset → close, all inside one try/catch). For Phase 64 the link step needs its OWN try/catch (D-11 honest partial failure) — combine with the tab's `Promise.allSettled` failure-honesty precedent below:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!assigneeId) return
  try {
    const result = await createTask.mutateAsync({ title, description, assignee_id: assigneeId, priority })
    if (result?.id) {
      await createLinks.mutateAsync(buildDossierLinkPayload('task', result.id, dossierContext))
      await queryClient.invalidateQueries({
        queryKey: ['dossier-tab', 'work_items', dossierContext.dossier_id],
      })
      ...
    }
    toast.success(t('addToDossier.success.task'))
    resetForm()
    onClose()
  } catch {
    toast.error(t('addToDossier.error.task'))
  }
}
```

Link step calls the **repository function directly**, not the hook — `useCreatePositionDossierLink(positionId)` takes the id at hook-construction time (see `useCreatePositionDossierLink.ts` L13), which doesn't exist pre-create. Precedent: `DossierPositionsTab.tsx` L199-203 (below). Pass `link_type: 'applies_to'` explicitly — the edge defaults to `'related_to'` (RESEARCH Pitfall 2).

**Dossier-scoped invalidation (R12-04 precedent)** — EventDialog, `AddToDossierDialogs.tsx` L743-752; copy this comment style and key discipline:

```typescript
// The mutation only invalidates the global ['calendar-events'] key; the
// dossier Engagements tab and overview Upcoming-Events KPI read
// dossier-scoped keys and would otherwise stay stale until the 5-min
// window (R12-04). Invalidate both so the new event shows immediately.
await queryClient.invalidateQueries({
  queryKey: ['dossier-tab', 'engagements', dossierContext.dossier_id],
})
await queryClient.invalidateQueries({
  queryKey: dossierOverviewKeys.detail(dossierContext.dossier_id),
})
```

Phase-64 keys (mapped in RESEARCH Pitfall 5): `['dossier-position-links', dossierId]` (prefix covers all filter variants — reader at `useDossierPositionLinks.ts` L122), `dossierOverviewKeys.detail(dossierId)` (factory at `dossier-overview.service.ts` L1127-1136), `['positions', 'list']` (already done by `useCreatePosition`), optionally `['position-dossier-links', position.id]` (inverse key, `useCreatePositionDossierLink.ts` L21).

**Audience-group checkbox row** — `frontend/src/components/waiting-queue/AssigneeFilter.tsx` L41-52 (`Checkbox` + `Label` pairing, logical `text-start`):

```tsx
<Checkbox
  id="assignee-me"
  checked={isMyAssignments}
  onCheckedChange={(checked) => { onChange(checked ? currentUser?.id : undefined) }}
  disabled={disabled}
  className="h-4 w-4"
/>
<Label htmlFor="assignee-me" className="flex-1 cursor-pointer text-start text-xs">
  {t('waitingQueue.filters.myAssignments')}
</Label>
```

Primitive exists at `frontend/src/components/ui/checkbox.tsx`. Render one row per audience group; bilingual labels come from the lookup rows' `name_en`/`name_ar` (pick by `isRTL`, same as `DossierContextBadge` L132-134).

**Translate button error handling** — no working UI analog (see "No Analog Found"); the call itself is plain `apiPost` (Shared Patterns below). Hard rules from RESEARCH Pattern 4: only fill the target field on 2xx; any thrown error → small error toast, field untouched; disable button while in flight. The deployed edge returns **503** when AnythingLLM is down (currently true on staging), and `api-client` throws on any non-2xx.

---

### `frontend/src/components/dossier/AddToDossierDialogs.tsx` (component host, MOD)

**Analog:** itself.

**What changes:** `PositionDialog` (L604-695) is gutted — its broken submit posts `position_type_id: dossierContext.dossier_id`, `title_ar: ''`, `audience_groups: []` with no link write (L627-633). Replace the function body with a thin render of the extracted `NewPositionDialog` (file is 1,194 lines, over the 800-line rule — extraction is mandated by RESEARCH "Component Responsibilities").

**Wiring pattern to preserve** — main export, L1175-1179 (the dialog receives `isOpen`/`onClose` from `dialogStates`):

```tsx
<PositionDialog
  {...commonProps}
  isOpen={dialogStates.position}
  onClose={() => onClose('position')}
/>
```

`commonProps` = `{ dossier, dossierContext, isRTL }` (L1156-1160). The extracted component should accept the same `ActionDialogProps`-shaped contract (L87-93: `isOpen`, `onClose`, `dossier`, `dossierContext: DossierContextForAction`, `isRTL`) so this call site barely changes.

---

### `frontend/src/components/positions/DossierPositionsTab.tsx` (component tab, MOD — D-13)

**Analog:** itself.

**Rewire target** — L49-52 + button L77-84:

```tsx
// Handler for creating new position
const handleCreatePosition = () => {
  setShowAttachDialog(true)   // ← D-13: open NewPositionDialog instead
}
...
<Button
  onClick={handleCreatePosition}
  className="w-full sm:w-auto"
  aria-label={t('positions:dossier_tab.create_position')}
>
  {t('positions:dossier_tab.create_position')}
</Button>
```

Add a second state flag (e.g. `showNewPositionDialog`) and keep `showAttachDialog` for the demoted attach-existing secondary action. The tab uses `useTranslation(['positions', 'common'])` (L29) — colon-form keys (`positions:…`) throughout.

**Direct-repo-call + honest-partial-failure precedent (R12-06)** — L195-227, this is the in-file model for both the link step and the D-11 warning toast:

```tsx
onAttach={async (positionIds) => {
  const results = await Promise.allSettled(
    positionIds.map((positionId) =>
      createPositionDossierLink(positionId, { dossier_id: dossierId }),
    ),
  )
  const failed = results.filter((r) => r.status === 'rejected').length
  // Invalidate the dossier-scoped reader (the mutation hook only knows
  // the inverse position-detail key) so the new rows render.
  await queryClient.invalidateQueries({
    queryKey: ['dossier-position-links', dossierId],
  })
  if (failed > 0) {
    toast.error(t('positions:attach.attachPartialError', { failed, total: positionIds.length, defaultValue: '…' }))
  } else {
    toast.success(t('positions:attach.attachSuccess', { count: positionIds.length, defaultValue: '…' }))
  }
  setShowAttachDialog(false)
}}
```

NOTE: this attach flow intentionally omits `link_type` (defaults to `related_to`); the NEW dialog must pass `link_type: 'applies_to'` (D-09).

**Dossier context for the tab entry point:** the tab only has `dossierId`; build `DossierContextForAction` via `useDossier(dossierId)` from `@/domains/dossiers/hooks/useDossier` — a cache hit on `dossierKeys.detail(id)` since the shell already loaded it (RESEARCH "Don't Hand-Roll" last row).

---

### `frontend/src/domains/positions/hooks/usePositionTypes.ts` + `useAudienceGroups.ts` (hooks, NEW)

**Analog:** `frontend/src/hooks/useDossierPositionLinks.ts` — the direct-supabase-client `useQuery` pattern.

**Core pattern** — L121-126 + L218-219 (key, queryFn via `supabase.from(...)`, throw on error, staleTime):

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['dossier-position-links', dossierId, filters],
  queryFn: async () => {
    let query = supabase
      .from('position_dossier_links')
      .select(`...`)
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false })
    const { data: links, error: queryError } = await query
    if (queryError) {
      throw new Error(queryError.message)
    }
    ...
  },
  staleTime: 2 * 60 * 1000, // 2 minutes
  enabled: !!dossierId,
})
```

For the lookups: keys `['position-types']` / `['audience-groups']`, select `id, name_en, name_ar` (+ `approval_stages` for types), `order('name_en')`, long `staleTime` (e.g. 30 min — lookup data; RESEARCH "Code Examples"). RLS SELECT verified open to authenticated users (live probe #7/#8). Default resolution stays in the dialog, by name with fallback (D-05/D-06): `types.find((t) => t.name_en === 'Standard Position') ?? types[0]`.

ESLint trap (RESEARCH Pitfall 8): hooks files are camelCase with `use` prefix; explicit return types required — declare an exported interface for the hook result like `UseDossierPositionLinksResult` (L81-88 of the analog).

---

### `frontend/src/domains/positions/hooks/useCreatePosition.ts` (hook mutation, MOD)

**Analog:** itself — full current body (L16-27):

```typescript
export const useCreatePosition = (): ReturnType<
  typeof useMutation<Position, Error, CreatePositionRequest>
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePositionRequest): Promise<Position> => {
      return positionsRepo.createPosition(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] })
    },
  })
}
```

The dossier-scoped invalidations should live in the **dialog's** success path (EventDialog precedent), not here — this hook has non-dossier consumers and doesn't know the dossierId. Keep `['positions', 'list']` here; extend only if the planner opts for an options-param pattern.

---

### `frontend/src/domains/positions/repositories/positions.repository.ts` (repository, MOD)

**Analog:** itself.

**Edge POST wrapper pattern** — `createPosition` L76-78 and `createPositionDossierLink` L163-168:

```typescript
export async function createPosition(data: CreatePositionRequest): Promise<Position> {
  return apiPost<Position>('/positions-create', data)
}

export async function createPositionDossierLink(
  positionId: string,
  input: CreatePositionDossierLinkInput,
): Promise<PositionDossierLink> {
  return apiPost<PositionDossierLink>(`/positions-dossiers-create?positionId=${positionId}`, input)
}
```

`CreatePositionDossierLinkInput` (`domains/positions/types/index.ts` L142-146): `{ dossier_id: string; link_type?: PositionDossierLinkType; notes?: string }`; `PositionDossierLinkType` (L112) = `'applies_to' | 'related_to' | 'endorsed_by' | 'opposed_by'` — matches the live CHECK.

**New `translateContent` function** (this is where translate-content wiring belongs — zero frontend callers exist today):

```typescript
// Mirror createPosition's shape. Contract verified vs deployed v2 (RESEARCH):
// POST /translate-content  { text (≤10,000 chars), direction: 'en_to_ar'|'ar_to_en', content_type: 'title'|'content' }
// 2xx → { translated_text, confidence, source_language, target_language, metadata }
// 503 (AI down) → apiPost THROWS (handleResponse rejects all non-2xx) — caller treats as "unavailable"
export async function translateContent(
  input: TranslateContentInput,
): Promise<TranslateContentResponse> {
  return apiPost<TranslateContentResponse>('/translate-content', input)
}
```

---

### `supabase/migrations/2026…_restore_positions_insert_policy.sql` (migration, NEW)

**Analog 1 (the policy text to restore):** `supabase/migrations/20250101011_rls_positions.sql` L48-55:

```sql
-- Policy: Drafters can insert positions
CREATE POLICY "drafters_insert_positions"
  ON positions
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND status = 'draft'
  );
```

**Analog 2 (the migration FORM — idempotent drift-fix with forensic header):** `supabase/migrations/20260610000002_fix_position_dossier_links_rls_clearance_subquery.sql` L1-33 — the in-repo gold standard for exactly this bug class (round-12 positions-domain RLS fix):

```sql
-- Fix position_dossier_links RLS clearance subquery (R12-10, 2026-06-10)
--
-- The INSERT/SELECT policies resolved the current user's clearance with a
-- correlated subquery keyed on `dossiers.id = auth.uid()` — comparing a dossier
-- UUID to a user UUID, which never matches. [...]

DROP POLICY IF EXISTS "Users can create position links within clearance" ON position_dossier_links;
CREATE POLICY "Users can create position links within clearance"
  ON position_dossier_links
  FOR INSERT
  WITH CHECK ( ... );
```

Copy: (1) dated header explaining the live-verified failure + root cause + scope, (2) `DROP POLICY IF EXISTS` + `CREATE POLICY` pairs for idempotency, (3) minimal predicate — `WITH CHECK (auth.uid() = author_id AND status = 'draft')`, never `WITH CHECK (true)` (RESEARCH ASVS V4). Apply via Supabase MCP (user CLAUDE.md mandate). First run the `pg_policy` diagnostic from RESEARCH Open Question 1 and record results in the SUMMARY before applying.

---

### `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` (test, NEW)

**Analog:** `frontend/src/components/dossier/__tests__/ExportDossierDialog.test.tsx` — the Phase-62 dialog test (same milestone norms, decision-tagged test names).

**Mutable-test-state + module mocks pattern** — L5-13, L31-47, L56-69:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

// Mutable test state — each test sets these before rendering.
let mockLanguage = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string, opts?: { defaultValue?: string }) => string; i18n: { language: string } } => ({
    t: (k: string, opts?: { defaultValue?: string }): string => {
      if (k in enCopy) return enCopy[k]
      if (opts?.defaultValue !== undefined) return opts.defaultValue
      return k
    },
    i18n: { language: mockLanguage },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => ({
    direction: mockLanguage === 'ar' ? 'rtl' : 'ltr',
    isRTL: mockLanguage === 'ar',
  }),
}))

const exportDossierMock = vi.fn()
vi.mock('@/hooks/useDossierExport', () => ({
  useDossierExport: (): Record<string, unknown> => ({ exportDossier: exportDossierMock, ... }),
}))

import { ExportDossierDialog } from '../ExportDossierDialog'
```

**Test shape + decision-tagged names** — L81-96:

```typescript
describe('ExportDossierDialog', () => {
  beforeEach(() => {
    mockLanguage = 'en'
    exportDossierMock.mockReset()
  })

  it('renders no PDF or Word format option (EXPORT-01)', () => {
    render(<ExportDossierDialog {...baseProps} />)
    expect(screen.queryByText('PDF')).toBeNull()
  })
```

For Phase 64, mock: `useCreatePosition` (mutateAsync spy), `positions.repository` (`createPositionDossierLink` spy — make it reject for the D-11 partial-failure test), the two lookup hooks (return the staging-shaped rows: 2 types / 4 groups), `apiPost` rejection for the translate-failure test, and `sonner` (`toast.success`/`toast.warning` spies). For the invalidation assertion, render inside a real `QueryClientProvider` and spy `queryClient.invalidateQueries` (no in-repo dialog test does this yet; `FirstRunModal.test.tsx` is the only userEvent+QueryClient test if a second reference is needed). Run: `cd frontend && pnpm exec vitest run src/components/positions/__tests__/NewPositionDialog.test.tsx`.

---

### `frontend/src/i18n/en/positions.json` + `frontend/src/i18n/ar/positions.json` (i18n, MOD)

**Analog:** the existing `positions` ns structure — nested per-feature objects with snake_case keys:

```json
{
  "library": {
    "title": "Positions Library",
    "subtitle": "{{count}} positions available",
    "create_position": "Create Position",
    ...
  },
  "dossier_tab": { ... },
  "editor": { ... }
}
```

Add a new top-level block (e.g. `"new_position"` with `validation.*`, `translate.*`, `toast.*` sub-objects) in **both** `en/positions.json` and `ar/positions.json`. The ns is already registered statically — `frontend/src/i18n/index.ts` L15-16 (imports), L264 (en), L391 (ar) — so no registration work, but keys missing from `ar/` silently fall back to English (project memory). Cross-namespace lookups use colon form: `t('positions:new_position.validation.typeRequired')`; if the dialog stays single-ns `useTranslation('positions')`, plain keys are fine inside it.

---

## Shared Patterns

### Edge auth + POST (applies to: dialog submit, link step, translate calls)

**Source:** `frontend/src/lib/api-client.ts` L21-30, L59-64, L97-109

```typescript
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: ApiClientOptions,
): Promise<T> {
  const headers = await getAuthHeaders()
  const response = await fetch(resolveUrl(path, options), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return handleResponse<T>(response)
}
```

CRITICAL (RESEARCH Pitfall 3): `handleResponse` discards the body — the edge's bilingual `{ error, error_ar }` never reaches the UI through plain `apiPost`. Fallback toasts must be locally localized generic messages; do NOT modify shared `api-client` behavior this phase.

### Toast discipline in Add-to-Dossier dialogs

**Source:** `AddToDossierDialogs.tsx` — IntakeDialog L228-233 (dialog owns success+error toasts), CommitmentDialog L510-516 (when the mutation hook toasts, the dialog must NOT double-toast — comment "a second one here double-toasted"). `useCreatePosition` does NOT toast, so NewPositionDialog owns all its toasts. Sonner action-button API for D-11/D-12 (`toast.success(msg, { action: { label, onClick } })`) has no in-repo usage yet — RESEARCH Assumption A1, confirm at build time.

### RTL / design rules (applies to: dialog, tab, all new UI)

**Source:** every sibling dialog + `TaskEditDialog.tsx` — `isRTL` from `useDirection()` (passed as prop in `AddToDossierDialogs.tsx` L1155-1160); bilingual display-name pick `isRTL ? name_ar || name_en : name_en` (DossierContextBadge L132-134); logical props only (`me-2` on `Loader2` L687, `text-start` on labels TaskEditDialog L160); `min-h-11` on all dialog buttons; tokens only, no raw hex.

### Dossier-scoped invalidation key factory

**Source:** `frontend/src/services/dossier-overview.service.ts` L1127-1136

```typescript
export const dossierOverviewKeys = {
  ...
  list: () => [...dossierOverviewKeys.all, 'list'] as const,
  detail: (dossierId: string) => [...dossierOverviewKeys.all, 'detail', dossierId] as const,
  ...
}
```

The overview also reads `position_dossier_links` directly (same file L464-477), which is why `dossierOverviewKeys.detail(dossierId)` must be invalidated alongside `['dossier-position-links', dossierId]`.

---

## No Analog Found

| File / Concern                                 | Role                  | Data Flow                  | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------- | --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Translate-button UI (inside NewPositionDialog) | component sub-feature | request-response (AI edge) | Zero working frontend callers of `translate-content`. `MultiLanguageContentEditor`'s translate button is a dead stub ("translateField API no longer available") — visual precedent only, do NOT copy its wiring. Compose from: repository `apiPost` wrapper (analog: `createPosition`) + in-flight disable + catch-all "unavailable" toast per RESEARCH Pattern 4. Only fill the field on 2xx; deployed edge 503s while AnythingLLM is down. |

## Metadata

**Analog search scope:** `frontend/src/components/{dossier,positions,tasks,waiting-queue}`, `frontend/src/domains/positions/**`, `frontend/src/hooks`, `frontend/src/lib`, `frontend/src/services`, `frontend/src/i18n`, `supabase/migrations`
**Files scanned:** 18 read (12 fully, 6 targeted/grepped)
**Pattern extraction date:** 2026-06-12
