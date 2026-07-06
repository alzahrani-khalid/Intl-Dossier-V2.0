# Phase 86: Feature Completion - Pattern Map

**Mapped:** 2026-07-06
**Files analyzed:** 24 new/modified/deleted files
**Analogs found:** 18 / 18 (files needing one; 6 are pure deletions)

All analogs named in 86-RESEARCH.md were verified to exist and were read this session. One
research correction discovered during mapping: **`CreateUserRequest` in
`services/user-management-api.ts` (lines 12–20) does NOT include the optional `clearance`
field** that the deployed `create-user` edge fn accepts (`clearance?: number`, integer 1–4,
`supabase/functions/create-user/index.ts:29,84-92`). The type needs a one-line addition, not
just new invoke methods.

## File Classification

| #   | New/Modified File                                                       | Role                          | Data Flow                                                                                                                                  | Closest Analog                                                           | Match                  |
| --- | ----------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------------------- |
| 1   | `frontend/src/components/mous/CreateMouDialog.tsx` (NEW)                | UI component (create dialog)  | request-response: RHF+Zod form → `useCreateMou` → POST `/mous` edge fn                                                                     | `frontend/src/components/positions/NewPositionDialog.tsx`                | exact                  |
| 2   | `frontend/src/domains/mous/repositories/mous.repository.ts` (NEW)       | domain repository             | `apiPost('/mous', payload)` via `@/lib/api-client`                                                                                         | `frontend/src/domains/positions/repositories/positions.repository.ts`    | exact                  |
| 3   | `frontend/src/domains/mous/hooks/useCreateMou.ts` (NEW)                 | TanStack mutation hook        | mutationFn → repository; onSuccess invalidates `['mous']`                                                                                  | `frontend/src/domains/positions/hooks/useCreatePosition.ts`              | exact                  |
| 4   | `frontend/src/domains/mous/keys.ts` (NEW)                               | query-key factory             | key source for `['mous']` invalidation                                                                                                     | `frontend/src/domains/engagements/keys.ts`                               | exact                  |
| 5   | `frontend/src/domains/mous/index.ts` (NEW)                              | domain barrel                 | re-exports                                                                                                                                 | `frontend/src/domains/positions/index.ts`                                | exact                  |
| 6   | `frontend/src/pages/MoUs/MousPage.tsx` (MODIFY)                         | page (list)                   | reads `mous_frontend` view; surgical edit: enable button :209, mount dialog                                                                | self — surgical edit only                                                | n/a                    |
| 7   | `frontend/src/i18n/en/common.json` + `ar/common.json` (MODIFY)          | i18n                          | extend existing `mous` block (EN :290–311; AR :290) with form keys                                                                         | existing `mous.statuses.*` sub-block shape                               | exact                  |
| 8   | `frontend/src/routes/_protected/users.tsx` (MODIFY → layout)            | route (layout)                | `<Outlet/>` + `beforeLoad: requireAdmin`                                                                                                   | `frontend/src/routes/_protected/engagements.tsx`                         | exact                  |
| 9   | `frontend/src/routes/_protected/users/index.tsx` (NEW)                  | route (index)                 | mounts existing list page                                                                                                                  | `frontend/src/routes/_protected/engagements/index.tsx`                   | exact                  |
| 10  | `frontend/src/routes/_protected/users/create.tsx` (NEW)                 | route                         | mounts `UserCreatePage`                                                                                                                    | `frontend/src/routes/_protected/engagements/index.tsx` (shape)           | role-match             |
| 11  | `frontend/src/routes/_protected/users/$id.tsx` (NEW)                    | route (param)                 | `Route.useParams()` → `UserDetailPage`                                                                                                     | `frontend/src/routes/_protected/engagements/$engagementId.tsx`           | exact                  |
| 12  | `frontend/src/pages/users/UserCreatePage.tsx` (NEW)                     | page (form)                   | RHF+Zod → `createUser()` invoke → navigate to list                                                                                         | form layer: `NewPositionDialog.tsx`; invoke: `delegatePermissions`       | role-match             |
| 13  | `frontend/src/pages/users/UserDetailPage.tsx` (NEW)                     | page (detail + admin actions) | read `supabase.from('users').select(…)`; write via `assignRole`/`deactivateUser`/`reactivateUser` invokes                                  | read: `UsersListPage.tsx:86-124`; writes: `delegatePermissions`          | role-match (composite) |
| 14  | `frontend/src/services/user-management-api.ts` (MODIFY)                 | service methods               | `supabase.functions.invoke` for create-user / assign-role / deactivate-user / reactivate-user (+ `clearance` field on `CreateUserRequest`) | `delegatePermissions` in the SAME file (:258–277)                        | exact                  |
| 15  | `frontend/src/i18n/en/user-management.json` + `ar/…` (MODIFY)           | i18n                          | add missing `roles.editor` (EN+AR)                                                                                                         | existing `roles.admin` key (:42)                                         | exact                  |
| 16  | `frontend/src/components/mous/__tests__/CreateMouDialog.test.tsx` (NEW) | test                          | vitest + RTL, mocked `t` + mocked domain hooks                                                                                             | `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` | exact                  |
| 17  | `frontend/src/pages/users/__tests__/UserCreatePage.test.tsx` (NEW)      | test                          | mock `user-management-api` invokes                                                                                                         | `NewPositionDialog.test.tsx` (mock style)                                | role-match             |
| 18  | `frontend/src/pages/users/__tests__/UserDetailPage.test.tsx` (NEW)      | test                          | mock users select + invokes; assert `requires_approval` branch                                                                             | `NewPositionDialog.test.tsx` (mock style)                                | role-match             |
| 19  | `frontend/tests/e2e/mou-create.spec.ts` (NEW)                           | e2e                           | authed storageState → click Add MoU → submit → row visible                                                                                 | `frontend/tests/e2e/global-setup.ts` auth model + any list-page spec     | role-match             |
| 20  | `frontend/tests/e2e/user-management.spec.ts` (NEW)                      | e2e                           | create → list → detail → role/status                                                                                                       | same as #19                                                              | role-match             |

### FEAT-04 delete scope (no analog needed — exact locations verified this session)

| #   | File                                                                                                                                                                                                                                                                             | Action                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 21  | `frontend/src/components/consistency-panel/` (whole dir, only `ConsistencyPanel.tsx`)                                                                                                                                                                                            | DELETE                             |
| 22  | `frontend/src/components/__tests__/ConsistencyPanel.test.tsx`                                                                                                                                                                                                                    | DELETE                             |
| 23  | `frontend/src/i18n/en/positions.json` + `ar/positions.json` — `"consistency"` block, **line 85 in both files**; EN block runs :85–183 (next top-level key `emergencyCorrection` at :184)                                                                                         | DELETE block, keep EN/AR symmetric |
| 24  | `frontend/src/routes/_protected/positions/$id.tsx:212-213` — stale comment                                                                                                                                                                                                       | DELETE 2 comment lines             |
| 25  | `frontend/src/types/position.ts` — `ConsistencyCheck` interface (`:105-122`, incl. the `// Consistency check result…` comment at :104)                                                                                                                                           | DELETE                             |
| 26  | `frontend/src/domains/positions/types/index.ts` — `:12` import alias `ConsistencyCheck as ConsistencyCheckType`, `:22` re-export `ConsistencyCheck`, and `:191` `consistency_check: ConsistencyCheckType` field (leave `SubmitPositionResponse` as `{ position: PositionType }`) | EDIT                               |

**Delete-scope verification (repo grep this session):** `ConsistencyCheck\b` appears ONLY in
files 21/22/25/26. `consistency_check\b` appears only in 26 and in the generated
`types/database.types.ts` (DB schema for the retained `position_consistency_checks` table —
do NOT touch; backend assets are retained per research decision).

---

## Pattern Assignments

### 1. `components/mous/CreateMouDialog.tsx` (UI component, request-response)

**Analog:** `frontend/src/components/positions/NewPositionDialog.tsx` (647 lines, Phase 64 — the house create-dialog canon)

**Imports pattern** (analog :15–52) — same primitive set, all from `@/components/ui/*`:

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
```

For MoU add: `import { DossierPicker, type DossierOption } from '@/components/work-creation/DossierPicker'`
and `import { useCreateMou } from '@/domains/mous'`.

**Props contract** (analog :68–73) — controlled open state, parent owns visibility:

```tsx
export interface NewPositionDialogProps {
  isOpen: boolean
  onClose: () => void
  dossierContext: DossierContextForAction // MoU dialog: no context prop needed
  isRTL: boolean
}
```

**Zod schema — messages are i18n KEYS rendered back through `t()` by `<FormMessage/>`** (analog :80–95):

```tsx
const newPositionSchema = z.object({
  position_type_id: z.string().min(1, 'positions:validation.type_required'),
  title_en: z.string().min(1, 'positions:validation.title_en_required')
    .max(200, 'positions:validation.title_max_length'),
  title_ar: z.string().min(1, 'positions:validation.title_ar_required')
    .max(200, 'positions:validation.title_max_length'),
  ...
})
```

MoU schema uses the shape already drafted in 86-RESEARCH.md "Code Examples" (enum pickers for
`type`/`mou_category`/`lifecycle_state`, two `.refine()`s for signatories-differ and
expiry-after-effective, message keys under `mous.form.errors.*` in the **default `common` ns**
— MousPage already reads `t('mous.addMou')` from `common`, so these keys need NO colon prefix
when called with the default ns, and NO namespace registration).

**Form setup** (analog :177–188):

```tsx
const form = useForm<NewPositionFormValues>({
  resolver: zodResolver(newPositionSchema),
  mode: 'onTouched',
  defaultValues: { position_type_id: '', title_en: '', title_ar: '', ... },
})
```

**Arabic-input treatment** (analog :143, :479–487) — content-driven, not locale-driven:

```tsx
const ARABIC_FONT_STYLE = { fontFamily: 'var(--font-arabic)' } as const
...
<FormControl required>
  <Input {...field} dir="rtl" style={ARABIC_FONT_STYLE} className="min-h-11" maxLength={200} />
</FormControl>
```

EN field gets `dir="ltr"`. Labels always `className="text-start"`.

**Dialog scaffold + footer** (analog :372–389, :598–616):

```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>…</DialogTitle>
      <DialogDescription>…</DialogDescription>
    </DialogHeader>
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[calc(85vh-10rem)] space-y-4 overflow-y-auto"
      >
        …fields…
        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="min-h-11"
          >
            {t('…cancel')}
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isValid || submitting}
            className="min-h-11"
          >
            {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t('…submit')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

**Submit + error handling** (analog :305–338, simplified — MoU is single-write, no link step):

```tsx
const onSubmit = async (values: FormValues): Promise<void> => {
  if (submitting) return
  setSubmitting(true)
  try {
    await createMou.mutateAsync(payload)
    form.reset()
    onClose()
    toast.success(t('mous.form.toastSuccess'))
  } catch {
    // Keep dialog open with input intact; api-client strips edge error bodies —
    // show a generic localized error (analog :313-320 precedent)
    toast.error(t('mous.form.toastError'))
  } finally {
    setSubmitting(false)
  }
}
```

**Signatory pickers — DossierPicker contract** (`components/work-creation/DossierPicker.tsx:45–68`):

```tsx
export interface DossierOption {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: string
}
export interface DossierPickerProps {
  value?: string
  onChange?: (dossierId: string | null, dossier?: DossierOption) => void
  filterByDossierType?: DossierType | DossierType[]   // recommend ['country','organization']
  selectedDossier?: DossierOption
  ...
}
```

Two single-select instances. Keep the full `DossierOption` from `onChange` in local state —
the payload's `parties` array is derived from it:
`parties: [{ name_en: s1.name_en, name_ar: s1.name_ar }, { name_en: s2.name_en, name_ar: s2.name_ar }]`
(Pitfall 2: `mous_frontend` renders party names from the `parties` jsonb, not the FK columns).

**House rules for this file:** PascalCase filename under kebab-case `components/mous/` folder;
tokens only (the analog's `bg-muted/50`, `text-[var(--danger)]` usages are token-safe to copy;
never introduce hex or palette literals); `me-*`/`ms-*` logical spacing (analog :613
`me-2` on the spinner); min 44px controls via `min-h-11`; sentence-case copy, no emoji.

---

### 2. `domains/mous/repositories/mous.repository.ts` (repository, request-response)

**Analog:** `frontend/src/domains/positions/repositories/positions.repository.ts`

**Header + create function** (analog :1–9, :78–80):

```ts
/**
 * Positions Repository
 * @module domains/positions/repositories/positions.repository
 *
 * Plain function exports for all position-related API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 */
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
...
export async function createPosition(data: CreatePositionRequest): Promise<Position> {
  return apiPost<Position>('/positions-create', data)
}
```

MoU version is exactly:

```ts
import { apiPost } from '@/lib/api-client'
import type { CreateMouPayload, Mou } from '../types'

export async function createMou(payload: CreateMouPayload): Promise<Mou> {
  return apiPost<Mou>('/mous', payload)
}
```

`apiPost<T>` (`lib/api-client.ts:139`) throws `ApiError extends Error` with
`(message, status, details)` (:34–38) — the dialog's catch-all handles it.
`CreateMouPayload` mirrors the edge-fn contract extracted in 86-RESEARCH.md (title/title_ar
required; `type` = `mou_type` enum; `mou_category`; optional lifecycle_state, signatories,
dates, `parties` jsonb). Server resolves `organization_id`/`tenant_id`/`created_by`/
`reference_number` — the payload must NOT include them.

---

### 3. `domains/mous/hooks/useCreateMou.ts` (mutation hook)

**Analog:** `frontend/src/domains/positions/hooks/useCreatePosition.ts` (:16–31, whole pattern):

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type { CreatePositionRequest, Position } from '@/types/position'

export const useCreatePosition = (): ReturnType<
  typeof useMutation<Position, Error, CreatePositionRequest>
> => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreatePositionRequest): Promise<Position> => {
      return positionsRepo.createPosition(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] })
    },
  })
}
```

MoU version invalidates `{ queryKey: mouKeys.all }` — which MUST prefix-match the **inline**
key `MousPage.tsx:94` already uses: `queryKey: ['mous', searchTerm, filterState]`. So
`mouKeys.all = ['mous'] as const` invalidates every list variant. Explicit return type is
mandatory (ESLint `explicit-function-return-type`); the `ReturnType<typeof useMutation<…>>`
idiom above is the house workaround.

---

### 4. `domains/mous/keys.ts` (query-key factory)

**Analog:** `frontend/src/domains/engagements/keys.ts` (:16–26):

```ts
export const engagementKeys = {
  all: ['engagements'] as const,
  lists: () => [...engagementKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...engagementKeys.lists(), filters] as const,
  details: () => [...engagementKeys.all, 'detail'] as const,
  detail: (id: string) => [...engagementKeys.details(), id] as const,
}
```

MoU version only needs `all: ['mous'] as const` (+ `list()` if desired). Root MUST stay the
string `'mous'` to match the pre-existing inline key.

---

### 5. `domains/mous/index.ts` (barrel)

**Analog:** `frontend/src/domains/positions/index.ts` (:9–38):

```ts
// Hooks
export { useCreatePosition } from './hooks/useCreatePosition'
// Repository
export * as positionsRepo from './repositories/positions.repository'
// Types
export * from './types'
```

MoU barrel: export `useCreateMou`, `mouKeys`, repository namespace, and types.

---

### 6. `pages/MoUs/MousPage.tsx` (surgical modify)

**Current state** (:207–213) — the exact edit target:

```tsx
<div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold">{t('navigation.mous')}</h1>
  <Button disabled title={t('common.notYetAvailable')}>
    <Plus className="h-4 w-4 me-2" />
    {t('mous.addMou')}
  </Button>
</div>
```

Change: drop `disabled` + `title`, add `onClick={() => setCreateOpen(true)}`, mount
`<CreateMouDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} isRTL={isRTL} />`
(page already has `const { isRTL } = useDirection()` at :88). The list query (:89–116) reads
`mous_frontend` ordered `created_at desc` with key `['mous', searchTerm, filterState]` —
no change needed; the hook's invalidation refreshes it.

**Anti-pattern warning:** do NOT extend or copy this page's `.or(\`…ilike.%${searchTerm}%\`)`
interpolation (:101–105) — that injection class is SEC-01 (Phase 88). New code never
interpolates user input into PostgREST filter strings.

**Out of scope:** wholesale Linear re-skin of this page (research anti-pattern list). Only the
button + dialog mount change.

---

### 7. i18n `mous` keys (`en/common.json` + `ar/common.json`)

**Analog:** the existing `mous` block itself — `en/common.json:290–311` (AR mirror at :290):

```json
"mous": {
  "total": "Total MOUs",
  ...
  "addMou": "Add MOU",
  "statuses": { "draft": "Draft", "negotiation": "Negotiation", ... }
}
```

Extend with a `form` sub-block (labels, `errors.titleRequired`, `errors.titleArRequired`,
`errors.signatoriesMustDiffer`, `errors.expiryAfterEffective`, `toastSuccess`, `toastError`,
`types.*`, `categories.*`). Edit BOTH files in the same commit, keys symmetric. `common` is the
default ns — the page calls `t('mous.addMou')` bare; keep that form. No registration change
(`src/i18n/index.ts` already bundles `common`).

---

### 8. `routes/_protected/users.tsx` (flat → layout conversion)

**Current** (whole file, :1–8):

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '../../pages/users/UsersPage'
import { requireAdmin } from '@/lib/auth/require-admin'

export const Route = createFileRoute('/_protected/users')({
  component: UsersPage,
  beforeLoad: requireAdmin,
})
```

**Analog for target shape:** `routes/_protected/engagements.tsx` (:9–13):

```tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/engagements')({
  component: () => <Outlet />,
})
```

Converted `users.tsx` = engagements shape **plus** `beforeLoad: requireAdmin` (TanStack runs
parent `beforeLoad` for all children — one line gates `/users`, `/users/create`, `/users/:id`).
Note: `pages/users/UsersPage.tsx` is a one-line re-export
(`export { UsersListPage as UsersPage } from './UsersListPage'`) — the moved index route can
import either name. `routeTree.gen.ts` regenerates on dev/build; never hand-edit.

---

### 9–11. `routes/_protected/users/{index,create,$id}.tsx`

**Analog for index:** `routes/_protected/engagements/index.tsx` (:9–14):

```tsx
import { createFileRoute } from '@tanstack/react-router'
import EngagementsListPage from '@/pages/engagements/EngagementsListPage'

export const Route = createFileRoute('/_protected/engagements/')({
  component: EngagementsListPage,
})
```

`users/index.tsx` = same shape with `'/_protected/users/'` + `UsersPage`.
`users/create.tsx` = same shape with `'/_protected/users/create'` + `UserCreatePage`.

**Analog for $id:** `routes/_protected/engagements/$engagementId.tsx` (:9–25):

```tsx
import type { ReactElement } from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'

export const Route = createFileRoute('/_protected/engagements/$engagementId')({
  component: EngagementWorkspaceLayout,
})

function EngagementWorkspaceLayout(): ReactElement {
  const { engagementId } = Route.useParams()
  return (
    <WorkspaceShell engagementId={engagementId}>
      <Outlet />
    </WorkspaceShell>
  )
}
```

`users/$id.tsx` is simpler — no child outlet: `const { id } = Route.useParams()` →
`<UserDetailPage userId={id} />`. No per-child `beforeLoad` needed (parent layout gates).

---

### 12. `pages/users/UserCreatePage.tsx` (page with form)

**Composite analog:** form layer = `NewPositionDialog.tsx` (Zod-with-i18n-keys + RHF + `<Form>`
primitives, excerpts in §1); submit target = `createUser()` from §14; page shell/navigation =
plain page (not dialog) with `useNavigate()` back to `/users` on success.

**Zod schema must mirror the deployed edge validators** (`supabase/functions/create-user/index.ts`):
email regex; username `^[a-z0-9_-]{3,50}$`; full_name 2–100; role enum
**`['admin','editor','viewer']` ONLY** (never manager/staff — Pitfall 3); optional clearance
`z.number().int().min(1).max(4).optional()`. Recommend hardcoding `user_type: 'employee'`
(research Open Question 3). Handle 400 `DUPLICATE_EMAIL`/`DUPLICATE_USERNAME` as field-level
errors via `form.setError`.

Filename: PascalCase in `pages/users/` (matches sibling `UsersListPage.tsx`).

---

### 13. `pages/users/UserDetailPage.tsx` (page, read + admin actions)

**Read analog:** `pages/users/UsersListPage.tsx` (:86–97) — the house direct-select pattern:

```tsx
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['users', searchQuery, roleFilter, ...],
  queryFn: async () => {
    let query = supabase
      .from('users')
      .select(
        'id, email, username, full_name, name_en, name_ar, role, is_active, mfa_enabled, last_login_at, department, avatar_url',
        { count: 'exact' },
      )
      .is('deleted_by', null)
      .order('created_at', { ascending: false })
    ...
  },
})
```

Detail version: `queryKey: ['users', 'detail', userId]`, `.eq('id', userId).single()` with the
same column list (drop `count`). **Do NOT copy the list page's `.or(...ilike…)` search block
(:114–119)** — SEC-01 injection class.

**Write actions:** call `assignRole` / `deactivateUser` / `reactivateUser` (§14) inside
`useMutation`s that invalidate `['users']`. The role handler MUST branch on the union response
(`user-management-api.ts:39–59`):

```ts
export type AssignRoleResponse = AssignRoleImmediateResponse | AssignRoleApprovalResponse
// immediate: { success, role_changed, new_role, sessions_terminated }
// approval:  { success, requires_approval: true, approval_request_id, pending_approvals }
```

On `'requires_approval' in result` → toast `t('user-management:roles.roleRequiresApproval')`
(key exists EN+AR) and stop — no approvals UI this phase. Deactivate/reactivate flip
`is_active`; response fields `orphanedItems`/`sessionsTerminated` map to existing
`userDeactivation.*` keys. Role picker options = admin/editor/viewer only.

---

### 14. `services/user-management-api.ts` (add invoke methods + one type field)

**Analog:** `delegatePermissions` in the SAME file (:258–277) — copy this shape verbatim per fn:

```ts
export async function delegatePermissions(
  data: DelegatePermissionsRequest,
): Promise<DelegatePermissionsResponse> {
  const { data: result, error } = await supabase.functions.invoke<DelegatePermissionsResponse>(
    'delegate-permissions',
    { body: data },
  )
  if (error) throw error
  if (!result) throw new Error('No response from delegate-permissions function')
  return result
}
```

Add: `createUser` (`'create-user'`), `assignRole` (`'assign-role'`), `deactivateUser`
(`'deactivate-user'`), `reactivateUser` (`'reactivate-user'`). Request/response interfaces
already exist at :12–27 (`CreateUserRequest/Response`), :39–59 (`AssignRole*`),
:133–150 (`Deactivate*`), :152–161 (`Reactivate*`).

**Required type addition (research gap found in mapping):** `CreateUserRequest` (:12–20) lacks
`clearance?: number` — the deployed fn accepts it (`create-user/index.ts:29`, validated
integer 1–4 at :84–92). Add the optional field.

---

### 15. i18n `roles.editor` (`en/user-management.json` + `ar/…`)

`roles` block at :41 in both files currently has `admin`, `manager`, `staff`, `viewer` — no
`editor`. Add `"editor": "Editor"` / Arabic equivalent beside `admin` (:42). Do NOT remove
`manager`/`staff` (pre-existing list-filter drift, out of scope — note in summary only).
Namespace `user-management` is already registered in `src/i18n/index.ts`.

---

### 16–18. Component/page tests

**Analog:** `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx`
(colocated `__tests__` dir — exempt from filename-case lint).

**The `t`-mock pattern** (:50–63) — supports colon-form keys, returns key when unmapped
(this is what catches raw-key leaks):

```tsx
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: { defaultValue?: string }) => string
    i18n: { language: string }
  } => ({
    t: (k: string, opts?: { defaultValue?: string }): string => {
      if (k in enCopy) return enCopy[k]
      if (opts?.defaultValue !== undefined) return opts.defaultValue
      return k
    },
    i18n: { language: mockLanguage },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))
```

**Mutation-hook mock** (:115–120):

```tsx
const createMock = vi.fn()
vi.mock('@/domains/positions/hooks/useCreatePosition', () => ({
  useCreatePosition: (): { mutateAsync: typeof createMock; isPending: boolean } => ({
    mutateAsync: createMock,
    isPending: false,
  }),
}))
```

For user pages, mock `@/services/user-management-api` exports the same way and mock
`@/lib/supabase` for the detail read. Assert the CreateMouDialog submit payload includes the
derived `parties` array (the Pitfall-2 regression guard).

---

### 19–20. E2E specs (`frontend/tests/e2e/*.spec.ts`)

**Auth analog:** `frontend/tests/e2e/global-setup.ts` — login runs ONCE per Playwright run and
persists to `.auth/storageState.json`; the default project is pre-authenticated (credentials
from `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` in `.env.test`), and tour overlays are
pre-dismissed via localStorage. New specs therefore start already logged in — navigate
straight to `/mous` / `/users`. AR verification: detector reads `?lng=ar` querystring first
(house fact) — `await page.goto('/mous?lng=ar')` flips locale at first paint.

Assertion cautions from research: new users are `is_active: false` — assert with the default
"all" filter (Pitfall 7); MoU create can 400 if the test user's profile lacks
`organization_id` (Pitfall 1) — surface, don't retry.

---

## Shared Patterns

### Admin gating (apply to users.tsx layout only)

**Source:** `frontend/src/lib/auth/require-admin.ts` (:19–34)

```ts
export async function requireAdmin(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) throw new Error('Admin access required')
  const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single()
  if (!ADMIN_ROLES.has(profile?.role ?? 'viewer')) throw new Error('Admin access required')
}
```

Authz reads ONLY `public.users.role` — never `user_metadata`/`app_metadata` (documented
privilege-escalation vector in the file's header). Client guard is UX; every edge fn 403s
independently.

### Network layer split (apply to all new data code)

- **MoU create** → `apiPost` from `@/lib/api-client` (throws `ApiError(message, status, details)`, api-client.ts:34-38,139) — because a domains/\* repository exists.
- **User-mgmt fns** → `supabase.functions.invoke` inside `services/user-management-api.ts` — because that file already standardizes on it. Do not mix the two styles within a file.
- Hooks never call the network directly; repositories/services are the only network layer (frontend/CLAUDE.md domain rule).

### i18n (apply to every new surface)

- Default ns `common` for `mous.*` keys (bare form: `t('mous.form.toastSuccess')`); COLON form for other namespaces: `t('user-management:roles.editor')`. Dot-form ns keys leak raw keys.
- Both language files edited symmetrically in the same commit; `scripts/check-i18n-namespaces.mjs` runs in lint.
- No new namespace registration needed this phase (common, user-management, positions all registered).

### Linear design tokens (apply to all new UI)

- Colors only via mapped utilities/`var(--*)`; ESLint errors on hex + palette literals.
- Borders `1px solid var(--line)`; no card shadows; no gradients; radii via `--radius-sm/--radius/--radius-lg` (6/8/12).
- Buttons: `@/components/ui/button` variants (`default` ≙ `.btn-primary`, `outline`/`ghost` ≙ `.btn-ghost` recipes) — no new variants.
- Logical properties only (`ms-*`, `me-*`, `ps-*`, `text-start`); directional icons `className={isRTL ? 'rotate-180' : ''}`.
- Arabic text inputs: `dir="rtl"` + `style={{ fontFamily: 'var(--font-arabic)' }}` (NewPositionDialog :143 precedent).
- No emoji, no marketing voice, sentence case.

### Code style (all new files)

No semicolons, single quotes, explicit return types on every function, no `any`, no floating
promises (`void`-prefix fire-and-forget), 100-char width. Filename case: `components/**` and
`pages/**` PascalCase, domain `hooks/` camelCase, `routes/**` router-conventional —
CI-blocking.

## No Analog Found

| File | Role | Reason                                          | Fallback                                                                                                     |
| ---- | ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| —    | —    | Every new file has at least a role-match analog | `UserDetailPage` is a composite (list-page read + service-invoke writes); build from the two excerpts in §13 |

## Metadata

**Analog search scope:** `frontend/src/{components,domains,routes,pages,services,lib,i18n}`, `frontend/tests/e2e`, `supabase/functions/{create-user,mous}`
**Files read this session:** 20 (all excerpts verified against live file contents, line numbers current as of 2026-07-06)
**Key research corrections:** (1) `CreateUserRequest` lacks the `clearance` field (add it); (2) route file imports `UsersPage`, which is a re-export of `UsersListPage`; (3) `consistency` i18n block spans :85–183 in EN (`emergencyCorrection` starts :184)
**Pattern extraction date:** 2026-07-06
