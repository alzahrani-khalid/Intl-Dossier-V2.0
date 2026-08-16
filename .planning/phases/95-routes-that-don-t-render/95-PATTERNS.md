# Phase 95: Routes That Don't Render - Pattern Map

**Mapped:** 2026-08-16
**Files analyzed:** 26 new/modified files across 8 requirements
**Analogs found:** 24 / 26 (2 partial — see No Analog Found)

All excerpts below were read at HEAD this session. Line numbers are pinned to the working tree at
mapping time; re-derive before citing in SUMMARYs if HEAD moves (pin-a-sha rule).

## File Classification

| New/Modified File                                                                                                          | Role                 | Data Flow          | Closest Analog                                                                       | Match Quality |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------ | ------------------------------------------------------------------------------------ | ------------- |
| `frontend/src/domains/dossiers/repositories/dossiers.repository.ts` (DEAD-01 adapter)                                      | repository           | request-response   | itself, `getDossierFirstSearch` :133-156 (`apiGet` house transport)                  | exact         |
| `frontend/src/domains/dossiers/hooks/useDossierFirstSearch.ts` (DEAD-01)                                                   | hook                 | request-response   | itself + domain convention (`frontend/CLAUDE.md` §Domains)                           | exact         |
| `frontend/src/pages/DossierSearchPage.tsx` (DEAD-01 error branch)                                                 | page component       | request-response   | `frontend/src/pages/AssignmentQueue.tsx:43-51`                                       | exact         |
| `supabase/functions/search/index.ts` (DEAD-01 option 3, optional)                                                          | edge function        | request-response   | `supabase/functions/assignments-queue/index.ts:39-97` (auth/CORS)                    | role-match    |
| `frontend/src/hooks/useAssignmentQueue.ts` (DEAD-02 transport fix)                                                         | hook                 | request-response   | `dossiers.repository.ts:133-156` (URLSearchParams → `apiGet`)                        | exact         |
| `supabase/functions/assignments-queue/` (DEAD-02)                                                                          | edge function        | request-response   | deploy-only; source audited sound — pattern is `scripts/probe-edge-auth.sh` evidence | exact         |
| `frontend/src/routes/_protected/scenario-sandbox.tsx:312-323` (DEAD-03)                                                    | route component      | request-response   | `AssignmentQueue.tsx:43-51` (page) + `data-retention.tsx:439-444` (region gating)    | exact         |
| `frontend/src/i18n/{en,ar}/scenario-sandbox.json` (DEAD-03 new keys)                                                       | config (i18n)        | —                  | `frontend/src/i18n/en/common.json:244-249` (`errors.queryFailed.*`)                  | exact         |
| `frontend/vite.config.ts:130-133` (DEAD-04 delete entry)                                                                   | config               | —                  | its own proxy table :100-134                                                         | exact         |
| `backend/src/index.ts:85` (DEAD-04 remount)                                                                                | server bootstrap     | request-response   | its own `/api` mount at :93 + the dev/test guard :83-90                              | exact         |
| `frontend/src/pages/monitoring/Dashboard.tsx` (DEAD-04)                                                                    | page component       | request-response   | `frontend/src/lib/api-client.ts:64-118` (`apiGet` + express baseUrl)                 | role-match    |
| `frontend/src/routes/_protected/positions/$id.tsx` → slot layout (DEAD-08)                                                 | route (layout)       | request-response   | `frontend/src/routes/_protected/positions.tsx:39-40` (`<Outlet/>` layout)            | exact         |
| `frontend/src/routes/_protected/positions/$id/index.tsx` (NEW — editor tab)                                                | route (child)        | request-response   | `positions/index.tsx` (child renders body exported by parent file)                   | exact         |
| `frontend/src/routes/_protected/positions/$id/approvals.tsx`, `versions.tsx` (stripped to panels)                          | route (child)        | request-response   | `positions/$id.tsx:124-142` Tabs strip (the visuals to keep)                         | exact         |
| `frontend/src/routes/_protected/positions.tsx:306` (repoint)                                                               | route                | —                  | route-id `Link` form at `NewPositionDialog.tsx:239` (typed, no `as any`)             | exact         |
| `frontend/src/routes/_protected/positions/$positionId.tsx`                                                                 | route                | —                  | DELETED (named omission: sole `PositionAnalyticsCard` mount)                         | —             |
| `frontend/src/routes/_protected/legislation.tsx` → layout + `legislation/index.tsx` (NEW)                                  | route (layout+child) | request-response   | `positions.tsx:39-45` (layout keeps `validateSearch`, list body → index child)       | exact         |
| `frontend/src/routeTree.gen.ts`                                                                                            | generated            | —                  | regen via TanStackRouterVite, same commit; never hand-edit                           | exact         |
| `supabase/functions/reports/index.ts:255-286` (DEAD-09 real POST)                                                          | edge function        | file-I/O           | `supabase/functions/pdf-generate/index.ts:377-401` (storage + signed URL)            | exact         |
| `frontend/src/pages/reports/generate-entry.ts` (+ pin)                                                                     | utility              | transform          | unchanged if server returns `{url,status:'completed'}`; pin is the C9b consumer      | exact         |
| `frontend/src/pages/reports/ReportsPage.tsx:183-208` (pending/failed)                                                      | page component       | request-response   | mutation `isPending`/`isError` + `data-retention.tsx:439-444` inline error           | role-match    |
| `eslint.config.mjs` + `scripts/eslint-rules/no-bare-component-notfound.mjs` (NEW)                                          | config + lint rule   | —                  | plugin registration `eslint.config.mjs:226-232`; fixture pattern :331-348            | partial       |
| `frontend/src/domains/audit/hooks/useRetentionPolicies.ts:71,129,190,205,220,228`                                          | hook                 | request-response   | validate-or-throw unwrap (RESEARCH §Code Examples); consumer `asRows` deleted        | exact         |
| `frontend/src/routes/_protected/admin/data-retention.tsx:156-163` (delete `asRows`)                                        | route component      | request-response   | its own per-region `QueryErrorState` gating :439-444 stays                           | exact         |
| `tests/e2e/95-sandbox-error.spec.ts` (NEW)                                                                                 | test (e2e)           | event-driven (CDP) | `tests/e2e/93-tasks-queue-error.spec.ts` (whole file)                                | exact         |
| `tests/e2e/95-{search-renders,queue-renders,monitoring-mounts,slots-tabs}.spec.ts` (NEW)                                   | test (e2e)           | request-response   | `tests/e2e/93-report-notfound.spec.ts` (natural-state, inline auth)                  | exact         |
| `frontend/src/domains/audit/hooks/__tests__/useRetentionPolicies.test.ts` + `.../dossiers.repository.search.test.ts` (NEW) | test (unit)          | transform          | `frontend/src/domains/dossiers/hooks/__tests__/useQuickSwitcherSearch.test.ts`       | role-match    |

## Pattern Assignments

### DEAD-01 — `dossiers.repository.ts` adapter + `useDossierFirstSearch.ts` + `DossierSearchPage.tsx`

**Analog:** the repository's own current shape (`frontend/src/domains/dossiers/repositories/dossiers.repository.ts:133-156`) — keep this exact structure, change only the request params (`limit`/`offset`, server ignores `page`/`page_size`) and adapt the response envelope:

```typescript
export async function getDossierFirstSearch(
  query: string,
  filters: DossierSearchFilters,
  page: number,
  pageSize: number,
): Promise<DossierFirstSearchResponse> {
  const params = new URLSearchParams()
  params.set('q', query)
  // ...filters...
  return apiGet<DossierFirstSearchResponse>(`/search?${params.toString()}`)
}
```

**Real envelope to adapt** (probed, RESEARCH §Code Examples): `{data, count, limit, offset, query, took_ms, warnings, metadata:{has_more, next_offset}}` → map `data→dossiers`, `count→dossiers_total`, `metadata.has_more→has_more_dossiers`. **Never fabricate `related_work: []`** (D-03); source related work from `quickswitcher-search` (deployed, returns `{dossiers, related_work}`) or ship the server branch.

**Crash site being made unreachable** (`useDossierFirstSearch.ts:109` — do NOT guard here, fix the contract; any diff touching only this memo is the Pitfall-1 shape):

```typescript
searchQuery.data.dossiers.forEach((d) => {
  counts[d.type] = (counts[d.type] || 0) + 1
})
```

**Error branch pattern for `DossierSearchPage`** (page currently never consumes `isError`) — copy `frontend/src/pages/AssignmentQueue.tsx:43-51` verbatim:

```tsx
if (error) {
  // Diagnostics stay in the console; the rendered state is i18n copy only (D-08).
  console.error('assignment queue query failed:', error)
  return (
    <div className="container mx-auto p-6">
      <QueryErrorState variant="page" onRetry={() => void refetch()} isRetrying={isFetching} />
    </div>
  )
}
```

**Hook layering rule** (`frontend/CLAUDE.md` §Domains): repositories are plain `async function` exports over `@/lib/api-client`; hooks call the repository in `queryFn` — never `fetch`/`apiGet` directly from a hook.

### DEAD-02 — `useAssignmentQueue.ts` transport fix + `assignments-queue` deploy

**The defect being replaced** (`frontend/src/hooks/useAssignmentQueue.ts:56-59` — invoke never serializes query params; GET+body throws TypeError in browsers):

```typescript
const { data, error } = await supabase.functions.invoke('assignments-queue', {
  method: 'GET',
  ...(params.toString() && { body: Object.fromEntries(params) }),
})
```

**Replacement analog** — the URLSearchParams→`apiGet` shape from `dossiers.repository.ts:139-155`:

```typescript
return apiGet<QueueListResponse>(`/assignments-queue?${params.toString()}`)
```

`apiGet` (`frontend/src/lib/api-client.ts:111-118`) already attaches the session JWT and resolves the edge base (`VITE_SUPABASE_URL/functions/v1`, :80-81). The function reads `url.searchParams` — this is the only transport that reaches it. (House "Don't Hand-Roll" row: never `functions.invoke` for path/query-dependent fns.)

**Function source is sound — do not rewrite it.** Auth pattern at `supabase/functions/assignments-queue/index.ts:39-97` is the accepted house pattern (anon client + injected `Authorization` header + bare `getUser()`, `getCorsHeaders(req)`/`handleCorsPreflightRequest` from `_shared/cors.ts`). The missing half is deployment:

```bash
supabase functions deploy assignments-queue --project-ref zkrcjzdemdmwhearhfgg
bash scripts/probe-edge-auth.sh assignments-queue   # expect a non-404 line (D-19 evidence)
```

### DEAD-03 — `scenario-sandbox.tsx` error retrofit

**The bespoke branch being deleted** (`frontend/src/routes/_protected/scenario-sandbox.tsx:312-323` — hardcoded English "Retry" literal at :320, legacy classes):

```tsx
) : isError ? (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{t('errors.loadFailed')}</AlertTitle>
    <AlertDescription>
      {t('common:errors.queryFailed.description')}
      <Button variant="outline" size="sm" className="ms-4" onClick={() => refetch()}>
        <RefreshCw className="h-4 w-4 me-2" />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
```

**Replacement:** `QueryErrorState` (props contract at `frontend/src/components/error-states/QueryErrorState.tsx:47-60`: `variant: 'page'|'inline'`, `onRetry`, `isRetrying`, optional bilingual `message`, `testId` defaults `query-error-state`/`query-error-inline`). Page-level usage = `AssignmentQueue.tsx:48`; section-scoped (variant B) usage analog with primary-vs-region gating = `data-retention.tsx:439-444`:

```tsx
{policiesIsError ? (
  <QueryErrorState
    variant="page"
    onRetry={() => void refetchPolicies()}
    isRetrying={policiesFetching}
  />
) : ( /* regions; each broken region renders its own inline QueryErrorState */ )}
```

**Copy:** `common:errors.queryFailed.title/.description` + `errors.retry` exist in both locales (`frontend/src/i18n/en/common.json:244-249` and the `ar` mirror). Any NEW key → `src/i18n/{en,ar}/scenario-sandbox.json` same commit, colon-form only; namespace already registered (`i18n/index.ts:342,478`). Every `t()` call single-argument (an English default second arg renders English in Arabic — QueryErrorState header, :21-23).

### DEAD-04 — `vite.config.ts` + `backend/src/index.ts` + `Dashboard.tsx`

**Proxy entry to delete** (`frontend/vite.config.ts:130-133`; the generic `/api` entry at :110-113 stays and carries the moved calls):

```typescript
'/monitoring': {
  target: backendProxyTarget,
  changeOrigin: true,
},
```

**Backend remount** (`backend/src/index.ts:85` → `/api/monitoring`; the dev/test guard at :83 and its security comment :78-82 MUST survive the move):

```typescript
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  app.use('/monitoring', monitoringContractRouter)   // → app.use('/api/monitoring', ...)
  ...
}
```

**Dashboard fetch replacement** — the two bare unauthenticated fetches (`frontend/src/pages/monitoring/Dashboard.tsx:32-42`, the mechanically-enumerated population of exactly 2 per RULING-P95-01 condition 1):

```typescript
const { data: health } = useQuery<HealthResponse>({
  queryKey: ['monitoring-health'],
  queryFn: () => fetchJSON<HealthResponse>('/monitoring/health'),
  refetchInterval: 5000,
})
```

→ `apiGet(path, { baseUrl: 'express' })` (`api-client.ts:64-79`: express base = `VITE_API_URL || ''` → relative → Vite `/api` proxy in dev; prod nginx `location /api/` forwards the full path). Adds the Authorization header `/api/monitoring/alerts` requires. Add per-widget `isError` → `QueryErrorState variant="inline"` (analog `data-retention.tsx:439-444` region pattern) so the prod backend-absent case renders truthfully instead of "Loading health..." forever.

### DEAD-08 — positions/legislation slot consolidation

**Layout-with-Outlet analog** (`frontend/src/routes/_protected/positions.tsx:39-45` — the repo's own working parent/child example; `legislation.tsx` copies this shape, keeping its `validateSearch` on the layout):

```tsx
export const Route = createFileRoute('/_protected/positions')({
  component: () => <Outlet />,
  validateSearch: (search: Record<string, unknown>): PositionsSearchParams => { ... },
})
```

**Tab strip to preserve** (`positions/$id.tsx:124-142` — becomes the `$id` layout's strip; only the `value` source changes, from local `defaultValue="editor"` to the matched child route; content moves behind `<Outlet/>`):

```tsx
<Tabs defaultValue="editor" className="space-y-4">
  <TabsList>
    <TabsTrigger value="editor">
      <FileText className="me-2 h-4 w-4" />
      {t('tabs.editor', 'Editor')}
    </TabsTrigger>
    ...
```

HeroUI gotcha (A2): drive `Tabs` `value`/`onValueChange` and navigate in the handler — do NOT wrap triggers in `Link asChild` (`filterDOMProps` drops aria; verify `aria-selected` in-browser before pinning the oracle).

**The one repoint** (`positions.tsx:305-308` — the only `/positions/$positionId` route-id consumer; the fix also deletes both `as any` casts):

```tsx
navigate({
  to: '/positions/$positionId' as any,
  params: { positionId: position.id } as any,
})
```

Complete inbound-link population is enumerated in RESEARCH §DEAD-08 (param-name-agnostic template-string sites are unaffected; route-id sites: `NewPositionDialog.tsx:239`, `approvals/index.tsx:96`, the two child Back links, and `positions.tsx:306`). `$positionId.tsx` deletion is a named omission (sole `PositionAnalyticsCard` mount). `routeTree.gen.ts` regen lands in the SAME commit (Pitfall 3).

### DEAD-09 — `reports/index.ts` real POST

**The mock being replaced** (`supabase/functions/reports/index.ts:255-286` — mints `job_id`, `setTimeout(console.log)`, answers `202`; keep the `:258` type/format guard, drop the job theater, answer synchronously):

```typescript
const jobId = crypto.randomUUID();
const mockJob: ReportJob = { id: jobId, status: 'pending', progress: 0, ... };
setTimeout(async () => { console.log(`Processing report job ${jobId}`); }, 100);
return new Response(JSON.stringify({ job_id: jobId, status: 'pending', ... }), { status: 202, ... });
```

**Artifact analog — copy the deployed precedent** (`supabase/functions/pdf-generate/index.ts:380-401`; bucket `private` exists on staging):

```typescript
const filePath = `pdfs/${fileName}`
const { error: uploadError } = await supabase.storage.from('private').upload(filePath, pdfBytes, {
  contentType: 'application/pdf',
  cacheControl: '3600',
})
if (uploadError) {
  throw new Error(`PDF upload failed: ${uploadError.message}`)
}
const { data: urlData, error: urlError } = await supabase.storage
  .from('private')
  .createSignedUrl(filePath, 86400) // 24 hours
if (urlError || !urlData) {
  throw new Error(`Failed to generate signed URL: ${urlError?.message}`)
}
```

Respond `{url: urlData.signedUrl, status: 'completed'}` — a completed entry ALWAYS carries a url. Honest-format constraint: real minimal generation is CSV/JSON; restrict offered formats or return `generate.unavailable` for unsupported ones (D-08). The GET branch's own summary-data gathering in the same file is the data source. Client seam `ReportsPage.tsx:183-208` maps through `buildGeneratedReportEntry` — if the server returns `{url}`, `generate-entry.ts` may not change; its pin (`__tests__/generate-entry.test.ts`, 5/5 green) is updated in the SAME task if behavior changes, else recorded as a named non-consumer (C9b). Redeploy + probe line (D-19). The prior "Express `/report-builder/generate`" candidate DOES NOT EXIST (RESEARCH corrected seam) — do not route through it.

### NOTFOUND-COMPONENT-01 — custom rule in `eslint.config.mjs`

**Plugin-registration analog** (`eslint.config.mjs:226-232` — how a plugin binds in this flat config; the new local rule module registers the same way, e.g. `plugins: { local: localRules }`):

```javascript
{
  files: ['frontend/**/*.{ts,tsx}'],
  ignores: ['frontend/**/components/ui/**/*.{ts,tsx}'],
  plugins: {
    'rtl-friendly': rtlFriendly,
  },
  rules: {
    'rtl-friendly/no-physical-properties': 'warn',
  },
},
```

**Positive-control fixture analog** (`eslint.config.mjs:331-348` — the repo already proves a ban fires against a committed bad-example fixture; clone this shape for the synthetic bare component-`notFound()` file):

```javascript
// ── @dnd-kit/core direct-import regression fixture: prove the ban fires ────
{
  files: ['tools/eslint-fixtures/bad-direct-dndkit-import.tsx'],
  rules: {
    'no-restricted-imports': ['error', { patterns: [{ group: ['@dnd-kit/core', ...], message: '...' }] }],
  },
},
```

Rule implementation itself has NO in-repo analog (see No Analog Found) — the ~40-line walker is specified in RESEARCH §NOTFOUND (compliant = first arg ObjectExpression containing `routeId`; walk `node.parent` — ancestor Property key `loader`/`beforeLoad` = OK; else report; `{ global: true }` = non-compliant). Negative controls: the three existing sites (`DossierShell.tsx:144`, `WorkspaceShell.tsx:136` compliant throws; `reports/$reportId.tsx:54` bare loader throw) must lint clean. A pure `no-restricted-syntax` selector is proven INSUFFICIENT (esquery has no ancestor negation) — do not attempt it.

### RETENTION-CAST-01 — `useRetentionPolicies.ts` + `data-retention.tsx`

**The lying cast** (one of six, `frontend/src/domains/audit/hooks/useRetentionPolicies.ts:69-73`; the other five are :129, :190, :205, :220, :228 — re-derive the count with `command grep -n "as Promise<" <file>` before editing, D-10):

```typescript
return useQuery<RetentionPolicy[]>({
  queryKey: retentionKeys.policyList(params),
  queryFn: () => getRetentionPoliciesApi(searchParams) as Promise<RetentionPolicy[]>,
  staleTime: 5 * 60 * 1000,
})
```

**Permitted fix shape** (RESEARCH §Code Examples — validate-or-throw; `Array.isArray(x) ? x : []` is the FORBIDDEN shape, ACCEPTANCE condition 8):

```typescript
queryFn: async () => {
  const body = (await getRetentionPoliciesApi(searchParams)) as { data?: unknown }
  if (!Array.isArray(body?.data)) throw new Error('malformed retention envelope') // → error state
  return body.data as RetentionPolicy[]
}
```

**Consumer to reconcile in the SAME task** (`data-retention.tsx:156-163` — delete once the hooks return validated arrays; its comment block :148-154 documents why the coerce-to-`[]` shape is banned):

```typescript
function asRows<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value !== null && typeof value === 'object') {
    const inner = (value as { data?: unknown }).data
    if (Array.isArray(inner)) return inner as T[]
  }
  return []
}
```

The page's per-region `QueryErrorState` gating (:439-444 and the seven inline usages) stays. Only other consumer is the compat re-export `frontend/src/hooks/useRetentionPolicies.ts`. Frontend-only — no deploy.

### New e2e specs — `tests/e2e/95-*.spec.ts`

**CDP forced-error analog** (for `95-sandbox-error.spec.ts`) — clone `tests/e2e/93-tasks-queue-error.spec.ts` wholesale. Its load-bearing parts:

Inline auth + timing (:28-36, :46-54):

```typescript
const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''
// 4 attempts at 1s + 2s + 4s backoff → isError at ~7s, past Playwright's default 5s
const RETRY_BACKOFF_TIMEOUT = 15_000
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

CDP block + DOM-only assertions + internal-string regex (:42-43, :62-78):

```typescript
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase|FunctionsHttpError|FunctionsFetchError)/i
// ...
const cdp = await page.context().newCDPSession(page)
await cdp.send('Network.enable')
await cdp.send('Network.setBlockedURLs', { urls: ['*assignments-queue*'] })
await page.goto('/tasks/queue')
const errorState = page.getByTestId('query-error-state')
await expect(errorState).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
const bodyText = (await page.locator('body').innerText()) ?? ''
expect(bodyText).not.toMatch(INTERNAL_STRING)
```

**Natural-state analog** (for `95-search-renders`, `95-queue-renders`, `95-monitoring-mounts`, `95-slots-tabs`) — `tests/e2e/93-report-notfound.spec.ts`: same inline auth, `crypto.randomUUID()` for absent ids (:54, never hardcoded), and the conjunction pattern (:64-67 — the honest render visible AND the lie absent). Phase 95 "renders" oracles must NOT block the network (Pitfall 6) — they are execution-time oracles against the deployed state; label producers-before-consumers. Header convention: `// @covers <REQ-ID>` on line 1, plus a WHY block. Run with `--no-deps` always (every chromium project carries `dependencies: ['setup']`; E2ECRED-01).

Note `93-tasks-queue-error.spec.ts` is a NAMED NON-CONSUMER of the DEAD-02 deploy by its own header (:10-15) — it stays green before and after; do not touch it.

### New unit tests

**Analog:** `frontend/src/domains/dossiers/hooks/__tests__/useQuickSwitcherSearch.test.ts:10-37` — colocated `__tests__/`, `.test.ts`, plain vitest imports, factory helper + table of exact expectations:

```typescript
import { describe, it, expect } from 'vitest'
import { getWorkItemUrl } from '../useQuickSwitcherSearch'
function makeItem(overrides: Partial<QuickSwitcherWorkItem>): QuickSwitcherWorkItem { ... }
describe('getWorkItemUrl', () => {
  it('maps position/task/commitment/intake unchanged', () => {
    expect(getWorkItemUrl(makeItem({ id: 'p1', type: 'position' }))).toBe('/positions/p1')
```

Prefer testing the pure adapter/unwrap functions directly (export them) over renderHook plumbing — the repo's hook tests pin pure functions. For the retention hook: mock the repository fn, assert `{data:[…N…]}` → N rows, `{data:[]}` → empty, bare-array/malformed → throw (never `[]`). Remember `frontend/tests/setup.ts` mocks react-i18next English-only — assert roles/testids, not translations. Run: `cd frontend && pnpm exec vitest run <file>` (no `--reporter=basic`; Vitest 4 dropped it).

## Shared Patterns

### Transport — `apiGet`/`apiPost` from `@/lib/api-client`

**Source:** `frontend/src/lib/api-client.ts:111-151` (auth headers :49-58, base resolution :64-82, `ApiError` with status :34-44)
**Apply to:** DEAD-01 repository, DEAD-02 hook fix, DEAD-04 Dashboard fetches. Never raw `fetch`, never `functions.invoke` for query-param GETs. `ApiError` throws on non-2xx → TanStack Query `isError` → `QueryErrorState`.

### Error rendering — `QueryErrorState`

**Source:** `frontend/src/components/error-states/QueryErrorState.tsx` (contract :47-60; testids `query-error-state`/`query-error-inline`)
**Apply to:** DEAD-01 page branch, DEAD-03 retrofit, DEAD-04 widget errors, DEAD-09 failed state (page-level). i18n keys only; bilingual envelope is the ONE structured exception; diagnostics to `console.error`, never JSX.

### Deploy evidence

**Source:** `scripts/probe-edge-auth.sh` (stdout `fn -> status` lines; never echoes credentials)
**Apply to:** DEAD-02 (`assignments-queue`), DEAD-09 (`reports`), DEAD-01/03 IF their fn sources change. `supabase functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg` + probe line in the SUMMARY. A source edit without redeploy has not shipped.

### Edge fn auth/CORS (for any touched fn source)

**Source:** `supabase/functions/assignments-queue/index.ts:39-97` (`getCorsHeaders(req)`/`handleCorsPreflightRequest` from `_shared/cors.ts`; anon client + injected `Authorization` header + `getUser()`)
**Apply to:** DEAD-09 `reports` POST rewrite, DEAD-01 `search` if option 3 ships. Never a bare `getUser()` on a plain anon client (401s on old supabase-js).

### i18n

**Source:** `frontend/src/i18n/index.ts` (static bundle; namespaces `scenario-sandbox` :342/:478 and `report-builder` :312/:448 already registered)
**Apply to:** DEAD-03 and DEAD-09 copy. Colon-form keys only; both locale files in the same commit; `pnpm lint` runs `check-i18n-namespaces.mjs`.

### E2E harness conventions

**Source:** `tests/e2e/93-tasks-queue-error.spec.ts` + `93-report-notfound.spec.ts`
**Apply to:** all five new specs. Inline auth via `LoginPage` (`./support/pages/LoginPage`), `--no-deps` always, paths-are-filters (assert spec-file existence first, hardcode the count), 15s budgets, DOM-only assertions, `INTERNAL_STRING` regex over `body` innerText.

## No Analog Found

| File                                                            | Role                       | Data Flow | Reason                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------- | -------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/eslint-rules/no-bare-component-notfound.mjs` (NEW)     | lint rule (create/visitor) | —         | No local ESLint rule module exists anywhere in the repo — all custom enforcement is `no-restricted-syntax` selectors or npm plugins. Registration (:226-232) and fixture (:331-348) patterns exist; the rule body follows RESEARCH §NOTFOUND's pseudocode (standard `{meta, create(context)}` shape). |
| Report data serialization (CSV/JSON) in `reports/index.ts` POST | edge function internals    | transform | No existing fn serializes tabular data to CSV. The GET branch's own data gathering + `pdf-generate`'s upload pattern cover everything except the serializer itself (~15 lines of join/escape — keep it minimal, JSON first).                                                                          |

## Metadata

**Analog search scope:** `frontend/src` (lib, components/error-states, domains, hooks, pages, routes), `supabase/functions`, `backend/src`, `tests/e2e`, `eslint.config.mjs`, `frontend/vite.config.ts`
**Files read:** 22 (all targeted, non-overlapping ranges)
**Pattern extraction date:** 2026-08-16
**Instrument note:** all sweeps used `command grep` (repo `grep` is a ugrep wrapper honoring .gitignore, D-20)
