# Phase 93: Failure Visibility - Pattern Map

**Mapped:** 2026-08-15 (tree at `milestone/v10.0-trust`, HEAD `5c940ac6`)
**Files analyzed:** 24 new/modified (5 priority-mapped with excerpts, rest pointer-mapped)
**Analogs found:** 22 / 24 (2 partial — see No Analog Found)

Scope note: `93-RESEARCH.md` owns the seam diagnosis (file:line of every defect). This document
answers only "what existing code does the executor COPY when touching each file". Excerpts below are
verbatim from the tree — never retype them from memory; re-read the source file at execution time.

---

## File Classification

| New/Modified File                                                                                                        | Role          | Data Flow         | Closest Analog                                                                                                                  | Match Quality              |
| ------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `frontend/src/components/error-states/QueryErrorState.tsx` (NEW)                                                         | component     | render-state      | `pages/delegations/DelegationManagementPage.tsx:215-237` + `components/ui/alert.tsx` + `components/empty-states/EmptyState.tsx` | exact (composed)           |
| `frontend/src/components/error-states/__tests__/QueryErrorState.test.tsx` (NEW)                                          | test          | —                 | `components/empty-states/__tests__/ListEmptyState.test.tsx`                                                                     | exact                      |
| `supabase/functions/my-delegations/index.ts` (error body)                                                                | edge function | request-response  | `supabase/functions/data-retention/index.ts:274-289` (envelope minus `details`)                                                 | exact                      |
| `supabase/functions/audit-logs-viewer/index.ts` (remap + leak)                                                           | edge function | request-response  | same envelope analog; aggregate = its own `:284-300` fallback (promote, don't write)                                            | exact                      |
| `supabase/functions/data-retention/index.ts` (strip `details`)                                                           | edge function | request-response  | its own envelope, `details` line deleted                                                                                        | exact (self)               |
| `supabase/functions/engagement-dossiers/index.ts` (degraded 200)                                                         | edge function | request-response  | its own 404 branch (`:400-401`) + one follow-up `dossiers` query                                                                | role-match                 |
| `supabase/migrations/<ts>_phase93_rewrite_auth_users_policies.sql` (NEW)                                                 | migration     | DDL               | `supabase/migrations/20260627000002_sec_be_01_admin_rls_db_role.sql`                                                            | exact                      |
| `tests/e2e/93-trust02-surfaces.spec.ts` (NEW)                                                                            | test          | e2e               | `tests/e2e/92-delegations-error.spec.ts`                                                                                        | exact                      |
| `tests/e2e/93-notfound.spec.ts` (NEW)                                                                                    | test          | e2e               | same spec (inline auth + budgets; no CDP needed for absent-ID)                                                                  | role-match                 |
| `tests/e2e/93-degraded-engagement.spec.ts` (NEW)                                                                         | test          | e2e               | same spec + service-role fixture insert (`SUPABASE_SERVICE_ROLE_KEY` in `.env.test`)                                            | role-match                 |
| `frontend/src/hooks/useWidgetDashboard.ts` (site 6 + aggregation)                                                        | hook          | supabase-js query | its OWN `:589-597` (`if (error) throw error`)                                                                                   | exact (in-file)            |
| `frontend/src/domains/analytics/repositories/analytics.repository.ts`                                                    | repository    | request-response  | any thin domain repository (deletion-only; see D-01 shape in RESEARCH §Code Examples)                                           | exact                      |
| `frontend/src/domains/dossiers/hooks/useDossier.ts:683,738`                                                              | hook          | request-response  | deletion-only; transport already throws (`services/dossier-api.ts` checks `.error`)                                             | exact                      |
| `frontend/src/pages/dossiers/DossierListPage.tsx` (counts error branch)                                                  | page          | render-state      | `DelegationManagementPage.tsx:112-113` (em-dash `statFigure`) + variant B                                                       | exact                      |
| `frontend/src/pages/custom-dashboard/CustomDashboardPage.tsx`                                                            | page          | render-state      | per-widget variant B; `widgetData` gains `isError` per index                                                                    | role-match                 |
| `frontend/src/routes/_protected/admin/field-permissions.tsx`                                                             | route/page    | render-state      | `DelegationManagementPage.tsx:57-68,215-237` (isError wiring)                                                                   | exact                      |
| `frontend/src/routes/_protected/admin/data-retention.tsx`                                                                | route/page    | render-state      | same                                                                                                                            | exact                      |
| `frontend/src/domains/tags/hooks/useTagHierarchy.ts` (repoint stub)                                                      | hook          | invoke            | `hooks/useFieldPermissions.ts` (functions.invoke GET → throw on error)                                                          | role-match                 |
| `frontend/src/components/tags/TagAnalytics.tsx`                                                                          | component     | render-state      | variant B inline (`components/ui/alert.tsx` destructive)                                                                        | exact                      |
| `frontend/src/components/positions/AttachmentUploader.tsx`                                                               | component     | render-state      | variant B inline                                                                                                                | exact                      |
| `frontend/src/components/dossier/DossierShell.tsx` (notFound + error)                                                    | component     | render-state      | `routes/__root.tsx:12-72` boundary + RESEARCH §Code Examples component-throw                                                    | role-match (first thrower) |
| `frontend/src/components/workspace/WorkspaceShell.tsx` (notFound + degraded)                                             | component     | render-state      | same + Alert default variant w/ `text-warn` icon (UI-SPEC §3)                                                                   | role-match                 |
| `frontend/src/routes/_protected/reports/$reportId.tsx` (loader)                                                          | route         | loader fetch      | partial — see No Analog Found                                                                                                   | partial                    |
| `frontend/src/i18n/{en,ar}/common.json` (+ ~25 `error.message` sites, `router/index.tsx`, `lib/query-client.ts` onError) | i18n/copy     | —                 | existing `errors` object in both files (see Shared Patterns)                                                                    | exact                      |

---

## Pattern Assignments

### 1. `frontend/src/components/error-states/QueryErrorState.tsx` (NEW component, render-state)

The tree has **no** shared query-error component — that absence is the defect class. The component is
a composition of three existing patterns, and its variant A already exists inline (unshared) in the
Phase 92 delegations page. Extract THAT markup rather than inventing new markup.

**Analog A — variant A (page-level) is already written.**
`frontend/src/pages/delegations/DelegationManagementPage.tsx:215-237` — shipped in 92-03, passes the
live forced-error spec. This is the markup to lift into the shared component (icon-wash sizes, type
scale, `.btn-primary` retry — all already UI-SPEC-conformant):

```tsx
// frontend/src/pages/delegations/DelegationManagementPage.tsx:215-237
{isError ? (
  <div
    role="alert"
    className="flex flex-col items-center justify-center text-center py-10 px-4 sm:py-12 sm:px-6"
  >
    <div className="flex items-center justify-center rounded-full bg-danger/10 w-14 h-14 sm:w-16 sm:h-16 mb-4">
      <AlertTriangle className="text-danger w-7 h-7 sm:w-8 sm:h-8" />
    </div>
    <h3 className="text-ink text-base sm:text-lg md:text-xl font-semibold mb-2">
      {t('list.error.title')}
    </h3>
    <p className="text-ink-mute max-w-md text-sm sm:text-base mb-4 sm:mb-6">
      {t('list.error.description')}
    </p>
    <button
      type="button"
      onClick={() => void refetch()}
      className="btn-primary inline-flex items-center justify-center h-10 px-4 sm:px-6 text-sm"
    >
      <RefreshCw className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
      {t('list.error.retry')}
    </button>
  </div>
) : (
```

Two deltas from this analog per `93-UI-SPEC.md`: the icon is `AlertCircle` (not `AlertTriangle` —
triangle is reserved for the degraded state) and the retry button carries **no icon** ("Try again",
no `RefreshCw`, no flip case). Copy goes to `common:errors.queryFailed.*` keys, not `list.error.*`.
Add `data-testid="query-error-state"`. Once the shared component lands, 92-03's inline block is a
candidate first consumer (planner call — the 92 spec asserts its DOM shape, so swap carefully).

**Analog B — variant B (inline) composes the shipped Alert primitive verbatim.**
`frontend/src/components/ui/alert.tsx:6-27` — destructive variant is already token-correct and
carries `role="alert"` built in. Do not restyle; compose:

```tsx
// frontend/src/components/ui/alert.tsx:6-27
const alertVariants = cva(
  'relative w-full rounded-[var(--radius)] border p-4 text-[var(--ink)] [&>svg~*]:ps-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:start-4 [&>svg]:top-4',
  {
    variants: {
      variant: {
        default: 'border-[var(--line)] bg-[var(--surface)] [&>svg]:text-[var(--ink-mute)]',
        destructive:
          'border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)] [&>svg]:text-[var(--danger)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
```

Note the recipe is already logical (`start-4`, `ps-7`) — no RTL work needed. The degraded callout
(WorkspaceShell) uses the **default** variant of this same primitive with the icon overridden to
`text-warn` and wrapper `role="status"` — no new variant is added to alert.tsx.

**Analog C — file/prop/i18n shape of a state component.**
`frontend/src/components/empty-states/EmptyState.tsx:16-37,99-112` — the prop-interface idiom the new
component mirrors (JSDoc'd props, `variant`/`size` unions, `testId` default, named export function):

```tsx
// frontend/src/components/empty-states/EmptyState.tsx:16-37 (abridged to the load-bearing lines)
export interface EmptyStateProps {
  /** Icon to display (Lucide icon component) */
  icon: LucideIcon
  /** Main heading for empty state */
  title: string
  /** Supporting text explaining why section is empty */
  description: string
  ...
  /** Test ID for automated testing */
  testId?: string
}
```

and its i18n consumption idiom is in `ListEmptyState.tsx:160` — `const { t } = useTranslation('empty-states')`
with colon-free keys inside the declared namespace. QueryErrorState uses the `common` namespace the
same way (`useTranslation('common')` + `t('errors.queryFailed.title')`, or the explicit colon form
`t('common:errors.queryFailed.title')` from a multi-ns caller). CRITICAL per D-04: `common` is
already registered in `src/i18n/index.ts` for both languages — do NOT create a new namespace.

**Analog D — the component test.**
`frontend/src/components/empty-states/__tests__/ListEmptyState.test.tsx:17-37,49-57` — the exact
mock-and-assert shape (no jest-dom; plain DOM queries; `t` echoes keys so assertions target keys):

```tsx
// frontend/src/components/empty-states/__tests__/ListEmptyState.test.tsx:20-31
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false, direction: 'ltr' as const, locale: 'en' }),
}))
```

```tsx
// frontend/src/components/empty-states/__tests__/ListEmptyState.test.tsx:49-57
it('renders exactly one .btn-primary CTA labelled list.<entity>.cta when onCreate is provided', () => {
  const onCreate = vi.fn()
  const { container } = render(<ListEmptyState entityType="topic" onCreate={onCreate} />)
  const primaries = container.querySelectorAll('.btn-primary')
  expect(primaries.length).toBe(1)
  expect(primaries[0]?.textContent).toContain('list.topic.cta')
  fireEvent.click(primaries[0] as Element)
  expect(onCreate).toHaveBeenCalledTimes(1)
})
```

QueryErrorState's test asserts: `role="alert"` present, `data-testid` value per variant, exactly one
`.btn-primary` (variant A) / `.btn-ghost` (variant B) retry wired to the `onRetry` prop, and key
echoes (`errors.queryFailed.title`). Remember tests CANNOT catch missing `ar` keys (the i18n mock is
English-only per `tests/CLAUDE.md`) — the bilingual guarantee is a gate, not a test.

---

### 2. Edge-function error envelope (`my-delegations`, `audit-logs-viewer`, `data-retention`)

**Analog:** `supabase/functions/data-retention/index.ts:274-289` — the correct bilingual envelope,
whose ONLY defect is the `details: error` passthrough. Copy the envelope; delete that one line;
`console.error(error)` server-side instead:

```typescript
// supabase/functions/data-retention/index.ts:274-289
if (error) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'FETCH_ERROR',
        message_en: 'Failed to fetch policies',
        message_ar: 'فشل في جلب السياسات',
        details: error, // <-- THE LEAK. Delete this line; console.error(error) instead.
      },
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}
```

The shape to converge on everywhere (also in RESEARCH §Code Examples): `{ error: { code, message_en,
message_ar } }`, real 4xx/5xx status, diagnostics to `console.error` only. `data-retention` has ~20
of these envelopes (grep `message_ar` in the file — lines 66..657); every `details:` occurrence in
client-facing bodies goes. For `my-delegations`, the swallow is the `if (error) { console.error }
else if (data)` fall-through at ~`:197`/`:233` — replace the fall-through with an early return of
this envelope (`code: 'QUERY_FAILED'`, do NOT echo the 42P01 text or the word "delegations table").
For `audit-logs-viewer`, the same substitution at its `details: error` sites (`:167,204,239` et al.),
and its statistics replacement is its OWN fallback block at `:284-300` — promote, don't author.

---

### 3. RLS policy migration (`<ts>_phase93_rewrite_auth_users_policies.sql`)

**Analog:** `supabase/migrations/20260627000002_sec_be_01_admin_rls_db_role.sql` — the SEC-BE-01
sweep that replaced this exact defect class (self-settable metadata role reads) with the helper.
It is the precedent for: header comment documenting live-state verification, idempotent
`DROP POLICY IF EXISTS` before every `CREATE POLICY`, and the predicate form:

```sql
-- supabase/migrations/20260627000002_sec_be_01_admin_rls_db_role.sql:28-47
DROP POLICY IF EXISTS "admins_view_all" ON positions;
CREATE POLICY "admins_view_all"
  ON positions
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "admins_update_all" ON positions;
CREATE POLICY "admins_update_all"
  ON positions
  FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- approvals
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admins_full_access_approvals" ON approvals;
CREATE POLICY "admins_full_access_approvals"
  ON approvals
  FOR ALL
  USING (public.is_platform_admin(auth.uid()));
```

For FOR ALL / INSERT policies the same file shows the `WITH CHECK` form
(`:97-106` — `WITH CHECK (public.is_platform_admin(auth.uid()))` alongside `USING`). D-24 rules the
helper IS the predicate for all 4 Phase 93 policies; the exact 4-policy SQL is already drafted in
`93-RESEARCH.md` §DR-42501 (lines 505-531) — that draft follows this analog and is the text to use.
The migration header MUST carry the anti-grant refusal comment (the `HINT`-as-exploit warning), as
the research draft does. Apply via `mcp__supabase__apply_migration` only.

**Verified live precedent for the inline variant** (if a planner opts for the ruling's literal
wording on the tag policies — either satisfies D-10): `field_permissions`' policy, which evaluates
successfully through PostgREST today (the function returns 200 to an admin JWT):

```sql
-- supabase/migrations/20260115500001_field_level_permissions.sql:563-571
CREATE POLICY field_permissions_select_policy ON public.field_permissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );
```

---

### 4. supabase-js `.error` check-and-throw (`useWidgetDashboard.ts` site-6 repair)

**Analog: the same file's own convention** — four sibling fetchers already do it, with an
explanatory comment in the house voice. Copy this shape into `fetchStatsSummary`:

```typescript
// frontend/src/hooks/useWidgetDashboard.ts:589-605 (fetchEvents — siblings at :625-628, :648-656, :677-685)
const { data, error } = await supabase
  .from('calendar_entries')
  .select('id, title_en, title_ar, entry_type, start_datetime, description_en, description_ar')
  .gte('start_datetime', now.toISOString())
  .order('start_datetime', { ascending: true })
  .limit(maxItems)

// Surface the error to the query state instead of swallowing it into [].
if (error) throw error

return (data || []).map((entry) => ({
```

The defect site for contrast — four results consumed with NO error destructure, then an outer catch
that fabricates zeros (both halves must change: check-and-throw each result FIRST, then delete the
catch — deleting the catch alone changes nothing because these builders never reject):

```typescript
// frontend/src/hooks/useWidgetDashboard.ts:697-734 (abridged)
async function fetchStatsSummary() {
  try {
    ...
    const [activeDossiers, openWorkItems, completedThisMonth, overdueItems] = await Promise.all([
      supabase.from('dossiers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ...
    ])
    return {
      activeDossiers: activeDossiers.count || 0,   // count is null on a denied query -> renders 0
      ...
    }
  } catch (error) {
    console.error('Failed to fetch stats summary:', error)
    return { activeDossiers: 0, openWorkItems: 0, completedThisMonth: 0, overdueItems: 0 }
  }
}
```

The repaired shape (loop-throw over the four results, `?? 0` on the success path) is drafted in
`93-RESEARCH.md` §Code Examples "Site 6 fix shape" — it follows this file's convention. The same
`if (error) throw error` idiom is also the analog for the Tag Analytics repoint queryFn and the
report-builder by-id fetch (see `hooks/useScheduledReports.ts:224-230` for a clean by-id example:
`const { data, error } = await supabase.from('custom_reports').select(...)` → `if (error) throw error`).

---

### 5. Forced-error Playwright spec (`93-trust02-surfaces`, `93-notfound`, `93-degraded-engagement`)

**Analog:** `tests/e2e/92-delegations-error.spec.ts` — every render-state oracle in this phase is a
copy of it. Three load-bearing blocks:

**Inline auth (NOT the `setup` project) + the `--no-deps` mandate, stated in its header:**

```typescript
// tests/e2e/92-delegations-error.spec.ts:10-12 (header comment), :15-40
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Locator, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

/** Sign in inline; never echo either credential value. */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}
```

Run command shape: `pnpm exec playwright test tests/e2e/<spec>.spec.ts --project=chromium-en --no-deps`
(every invocation including `--list` counts carries `--no-deps`, D-20/C6).

**The retry-ladder timing budget (a CORRECT implementation fails the 5s default):**

```typescript
// tests/e2e/92-delegations-error.spec.ts:21-26
// TIMING (checker B-2). A CDP-blocked request surfaces as FunctionsFetchError / a plain Error with
// NO numeric `status`, so query-client.ts's 4xx short-circuit never fires and TanStack Query runs
// its full retry ladder: 4 attempts at 1s + 2s + 4s backoff. `isError` therefore arrives at ~7s,
// past Playwright's default 5s expect timeout. This budget is retry backoff, not flakiness — a
// CORRECT implementation fails the default timeout.
const RETRY_BACKOFF_TIMEOUT = 15_000
```

**The CDP block + DOM-only assertions (never a response status):**

```typescript
// tests/e2e/92-delegations-error.spec.ts:52-73
test('blocked my-delegations renders the error alert, never an empty state', async ({ page }) => {
  await signInInline(page)

  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setBlockedURLs', { urls: ['*my-delegations*'] })

  await page.goto('/delegations')

  // Every assertion below is on the DOM. None reads a response status.
  const errorAlert = page.getByRole('alert').filter({ hasText: ERROR_HEADING })
  await expect(errorAlert).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

  // A retry affordance must live inside the alert region, not floating elsewhere.
  await expect(errorAlert.getByRole('button', { name: /try again/i })).toBeVisible({
    timeout: RETRY_BACKOFF_TIMEOUT,
  })

  // The empty state must NOT be rendered — a failed load is not "no delegations".
  await expect(page.getByText(/you haven['’]t granted any delegations/i)).toHaveCount(0, {
    timeout: RETRY_BACKOFF_TIMEOUT,
  })
```

Phase 93 specs swap the blocked URL per surface (`*field-permissions*`, `*data-retention*`,
`*tag-hierarchy*`, `*/attachments*` — scoped so the position detail fetch itself isn't blocked) and
key on `[data-testid="query-error-state"]` / `"query-error-inline"` instead of copy where the
UI-SPEC testids exist. The spec's second test (`:85-117`) is the happy-path template — both halves
per surface, per the RESEARCH test map. Not-found specs need no CDP: navigate to a random-UUID route
and assert the 404 numeral; degraded spec adds a service-role fixture insert/teardown.

---

## Shared Patterns

### Page-level `isError` wiring (applies to every criterion-2 surface)

**Source:** `frontend/src/pages/delegations/DelegationManagementPage.tsx:57-68` — the shipped
destructure-and-comment idiom, and `:112-113` for count chrome:

```tsx
// frontend/src/pages/delegations/DelegationManagementPage.tsx:57-68
// Fetch delegations. `isError` drives an explicit failure state so a rejected query never
// renders as "you have no delegations". The rejection object itself is never rendered — its
// message is a supabase-js internal string, and user-facing errors carry i18n copy only.
const {
  data: delegations,
  isError,
  isLoading,
  refetch,
} = useMyDelegations({
  type: 'all',
  active_only: showActiveOnly,
})
```

```tsx
// frontend/src/pages/delegations/DelegationManagementPage.tsx:112-113
// A failed load knows nothing — the count is unknown, not zero.
const statFigure = (value: number): string => (isError ? '—' : String(value))
```

**Apply to:** `field-permissions.tsx`, `data-retention.tsx`, `DossierListPage.tsx` (counts strip),
`CustomDashboardPage.tsx` (per-widget), `AttachmentUploader.tsx`, `TagAnalytics.tsx`. The rule from
D-21: the swallow-deletion and this consumer branch land in the SAME task.

### Not-found boundary (TanStack Router)

**Source:** `frontend/src/routes/__root.tsx:12-50,72` — the boundary and page already exist; this
phase adds the FIRST throwers (D-06 correction: zero `notFound()` call sites exist today — there is
no throw to copy, only the boundary to throw INTO):

```tsx
// frontend/src/routes/__root.tsx:12-27 (abridged) and :72
function NotFoundPage() {
  const { t } = useTranslation()
  const router = useRouter()
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl sm:text-8xl font-bold text-muted-foreground/30">404</div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          {t('errors.pageNotFound', 'Page not found')}
        </h1>
        ...
// :72
notFoundComponent: NotFoundPage,
```

Do NOT restyle its legacy `text-muted-foreground` classes (surgical-change rule, UI-SPEC §2). The
throw shape for `DossierShell`/`WorkspaceShell` is drafted in `93-RESEARCH.md` §Code Examples
("Component-throw notFound"). Note `NotFoundPage` uses dot-form `t('errors.pageNotFound', …)` with a
defaultValue — that resolves inside the default `common` bundle and works; new code follows UI-SPEC's
colon form for anything outside the default namespace.

### i18n keys (D-04)

**Source:** `frontend/src/i18n/en/common.json` + `frontend/src/i18n/ar/common.json` — both already
carry an `errors` object with identical key sets (`generic`, `languageLoadFailed`, `networkError`,
`preferenceSaveFailed`, `themeLoadFailed`, `unknownError` — verified in both files 2026-08-15). New
keys (`errors.retry`, `errors.queryFailed.*`, `errors.queryFailedInline`, `errors.countUnavailable`,
`errors.incompleteRecord.*` per the UI-SPEC copywriting table) extend this object in BOTH files in
the SAME commit. No new namespace; no English-default second arguments on new `t()` calls (AR-04a).

### Live edge-function oracle

**Source:** `scripts/probe-edge-auth.sh` — prints `<fn> -> <status>` per function with a real user
JWT; never echoes credentials. Apply to: every edge-function criterion (DELEG-01, DR-42501,
AUDIT-42703, PIN-2390-01 post-deploy). Proven in Phase 92, re-run same day as CONTEXT.

### Gate authoring

**Source:** `.planning/GATE-STANDARD.md` (C1-C10) + `scripts/gate-drill.mjs`; house style for the
evidence table in `.tickmarkr/overseer/P92-EXEC-REPORT.md`. Anchor scope diffs to `phase-93-base`
(tag to be created at phase start, signed per root CLAUDE.md §Tag signing).

---

## No Analog Found

| File                                             | Role         | Data Flow         | Reason / partial analogs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes/_protected/reports/$reportId.tsx` loader | route loader | fetch-in-loader   | The tree's only `loader:` (`routes/_protected/tasks/$id.tsx:8-15`) merely echoes params — no fetch-in-loader precedent exists. Compose from three partials: loader syntax from `tasks/$id.tsx:4-15`; the by-id supabase query + throw from `hooks/useScheduledReports.ts:224-230` (`from('custom_reports').select(...)` → `if (error) throw error`); `queryClient` module singleton import from `lib/query-client.ts:88` (no router-context change needed). WRITE-06 `42P17` hazard stated in RESEARCH §Criterion 3 — a rejecting read renders the error state, which is the honest pre-Phase-94 render. |
| Anti-grant gate script (D-12/D-23)               | gate         | catalog assertion | No live-DSN gate exists in the repo (no `SUPABASE_DB_URL` in `.env.test`). Per D-23 it lands as (1) a migrations-tree regex guard (analog: any `<automated>` grep gate under `.planning/` plans — pattern `grant[[:space:]]+select[^;]*auth\.users` over `supabase/migrations` + `backend/migrations`, currently zero matches) plus (2) MCP `execute_sql` evidence recorded as `CANNOT CONSTRUCT (no DSN; MCP-only)` in the drill table.                                                                                                                                                                 |

---

## Metadata

**Analog search scope:** `frontend/src/{components,pages,hooks,domains,routes,lib,i18n}`,
`supabase/{functions,migrations}`, `tests/e2e`, `scripts` — targeted per the orchestrator's
priority list; RESEARCH.md's seam pins reused rather than re-derived.
**Files read whole:** `alert.tsx`, `EmptyState.tsx`, `ListEmptyState.tsx`, `ListEmptyState.test.tsx`,
`92-delegations-error.spec.ts`, `20260627000002_sec_be_01_admin_rls_db_role.sql`; targeted ranges of
`DelegationManagementPage.tsx`, `useWidgetDashboard.ts`, `data-retention/index.ts`, `__root.tsx`,
`20260115500001_field_level_permissions.sql`, `useScheduledReports.ts`, `tasks/$id.tsx`.
**Pattern extraction date:** 2026-08-15

PATTERNS-END
