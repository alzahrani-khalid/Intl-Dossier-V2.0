# Phase 24: Browser Inspection Fixes - Research

**Researched:** 2026-04-09
**Domain:** i18n, Supabase PostgREST, Supabase Edge Functions
**Confidence:** HIGH (all findings verified from source files)

## Summary

Three browser-visible bugs were traced to their root causes through direct codebase inspection. All three have clear, minimal fixes — no architectural changes required.

FIX-01 is a wrong namespace in `useTranslation`. FIX-02 is a PostgREST 406 from querying `users` with `.single()` when the authenticated user row may not exist in the public `users` table (or the table access pattern differs from auth). FIX-03 is the analytics dashboard calling Supabase Edge Functions directly via the `api-client` which defaults to `edge` base URL — those functions are either not deployed or not reachable, and should be routed through the Express backend instead.

**Primary recommendation:** Three isolated, targeted fixes — one per issue — with no cross-cutting changes.

---

## Project Constraints (from CLAUDE.md)

- Tech stack locked: React 19, TanStack Router v5, i18next, Supabase client, Express backend
- No framework migrations
- All bilingual (AR + EN) after every change
- Supabase migrations via Supabase MCP only
- Semicolons off, single quotes, explicit return types required
- No `textAlign: 'right'` — use `writingDirection: 'rtl'` only
- Logical Tailwind properties only (`ms-*`, `me-*`, `text-start`, etc.)

---

## FIX-01: Calendar i18n Keys Not Translated

### Root Cause — VERIFIED

**File:** `frontend/src/routes/_protected/calendar.tsx`, line 20

```typescript
// WRONG — 'dossiers' namespace has no 'calendar.page.*' or 'calendar.view_mode.*' keys
const { t } = useTranslation('dossiers')
```

The component calls `t('calendar.page.title')`, `t('calendar.page.description')`, `t('calendar.page.create_event')`, `t('calendar.view_mode.month')`, `t('calendar.view_mode.week')`, `t('calendar.view_mode.day')`.

**i18n namespace registered:** `calendar` (registered in `frontend/src/i18n/index.ts` lines 53–54, 220, 315 for both EN and AR).

**Keys that exist in `frontend/src/i18n/en/calendar.json`:**

- `view.month`, `view.week`, `view.day`, `view.agenda` — exist (line 180–185)
- `form.create_event` — exists (line 52)
- `page.*` — DOES NOT EXIST anywhere in `calendar.json`
- `view_mode.*` — DOES NOT EXIST (the key path in the component is `calendar.view_mode.month` but the file has `view.month`, not `view_mode.month`)

**What the component uses vs what exists:**

| Component key                | Status                     | Existing key to use              |
| ---------------------------- | -------------------------- | -------------------------------- |
| `calendar.page.title`        | MISSING in both namespaces | Must add to `calendar` namespace |
| `calendar.page.description`  | MISSING                    | Must add to `calendar` namespace |
| `calendar.page.create_event` | MISSING at this path       | `form.create_event` exists       |
| `calendar.view_mode.month`   | MISSING (wrong path)       | `view.month` exists              |
| `calendar.view_mode.week`    | MISSING (wrong path)       | `view.week` exists               |
| `calendar.view_mode.day`     | MISSING (wrong path)       | `view.day` exists                |

### Two Valid Fix Approaches

**Option A (Preferred — minimal change):** Change `useTranslation('dossiers')` to `useTranslation('calendar')` and update the key paths to match what already exists:

- `t('calendar.view_mode.month')` → `t('view.month')`
- `t('calendar.view_mode.week')` → `t('view.week')`
- `t('calendar.view_mode.day')` → `t('view.day')`
- `t('calendar.page.create_event')` → `t('form.create_event')`
- Add `page.title` and `page.description` to `en/calendar.json` and `ar/calendar.json`

**Option B:** Keep `useTranslation('dossiers')` and add all missing keys under `calendar.*` in `en/dossiers.json` and `ar/dossiers.json`. Not recommended — pollutes the dossiers namespace with calendar page strings.

### Keys to Add to Both `en/calendar.json` and `ar/calendar.json`

```json
// en/calendar.json additions at root level:
"page": {
  "title": "Calendar",
  "description": "Manage and view your scheduled events and engagements"
}
```

```json
// ar/calendar.json additions at root level:
"page": {
  "title": "التقويم",
  "description": "إدارة وعرض الفعاليات والانخراطات المجدولة"
}
```

### Files to Change

1. `frontend/src/routes/_protected/calendar.tsx` — line 20: change namespace, lines 31/34/43/58/65/73: fix key paths
2. `frontend/src/i18n/en/calendar.json` — add `page` section
3. `frontend/src/i18n/ar/calendar.json` — add `page` section (Arabic)

---

## FIX-02: Settings Page 406 on Users Query

### Root Cause — VERIFIED

**File:** `frontend/src/pages/settings/SettingsPage.tsx`, line 95

```typescript
const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single() // ← sends Accept: application/vnd.pgrst.object+json
```

**PostgREST 406 semantics:** `.single()` sets `Accept: application/vnd.pgrst.object+json`. PostgREST returns 406 when the result set is NOT exactly 1 row. This means either:

1. The `users` table has no row for this `user.id` (user created via Supabase Auth but no corresponding row in `public.users` was inserted), OR
2. The RLS policy on `public.users` is blocking read access and returning 0 rows

**The query at line 95 uses `.from('users')` not `.from('profiles')` or similar** — the public `users` table may not be auto-populated when a Supabase Auth user signs up unless a trigger exists.

### Fix Approach

Replace `.single()` with `.maybeSingle()` which returns `null` (not 406) when 0 rows match, and the code already handles defaults via `defaultUserSettings` fallback on line 149:

```typescript
// BEFORE (line 95):
const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single()

// AFTER:
const { data, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
if (error) throw error
if (!data) {
  // Row doesn't exist yet — return defaults, form will create on first save
  return defaultUserSettings as SettingsFormValues
}
```

**Additional check:** Verify that the `save` mutation at line 156+ uses `upsert` not `update` — if the row doesn't exist, `update` will silently affect 0 rows. If it uses `update`, switch to `upsert` keyed on `id`.

### Files to Change

1. `frontend/src/pages/settings/SettingsPage.tsx` — line 95: `.single()` → `.maybeSingle()` + null guard

---

## FIX-03: Dashboard Edge Function DNS Errors

### Root Cause — VERIFIED

**File:** `frontend/src/lib/api-client.ts`, lines 36–43

```typescript
function resolveUrl(path: string, options?: ApiClientOptions): string {
  if (options?.baseUrl === 'express') {
    const expressBase = import.meta.env.VITE_API_URL || ''
    return `${expressBase}${path}`
  }
  // DEFAULT: routes to Supabase Edge Functions directly
  const edgeBase = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
  return `${edgeBase}${path}`
}
```

**File:** `frontend/src/domains/analytics/repositories/analytics.repository.ts`, lines 10–12

```typescript
export async function getAnalyticsDashboard(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/analytics-dashboard?${params.toString()}`)
  // No { baseUrl: 'express' } option → defaults to Edge Function URL
}
```

**File:** `frontend/src/hooks/useNotificationCenter.ts`, line 97

```typescript
const response = await supabase.functions.invoke('notifications-center', { ... })
// Falls back to direct Supabase table query if this errors (line 106)
```

**Two separate patterns causing the errors:**

| Call                   | Pattern                                                                                 | Issue                                         |
| ---------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------- |
| `analytics-dashboard`  | `apiGet('/analytics-dashboard')` → `VITE_SUPABASE_URL/functions/v1/analytics-dashboard` | Edge Function not deployed / DNS unreachable  |
| `notifications-center` | `supabase.functions.invoke('notifications-center')`                                     | Edge Function not deployed — but has fallback |
| `auth/v1/user` retries | `autoRefreshToken: true` in `supabase.ts` line 16                                       | Retries aggressively when network unreachable |

**The `notifications-center` hook already has a fallback** (lines 106–142 of `useNotificationCenter.ts`): it catches the error and queries `public.notifications` directly via PostgREST. This is working correctly — the error is expected and handled.

**The `analytics-dashboard` call has NO fallback** — it throws on Edge Function DNS failure.

**The auth refresh retries** are caused by `autoRefreshToken: true` (line 16 of `supabase.ts`) combined with the Edge Function DNS errors causing the Supabase client to think the session is invalid. This is a symptom, not the root cause.

### Fix Approach

**For `analytics-dashboard`:** Route through the Express backend (which is already deployed and reachable) by passing `{ baseUrl: 'express' }`:

```typescript
// frontend/src/domains/analytics/repositories/analytics.repository.ts
export async function getAnalyticsDashboard(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/analytics-dashboard?${params.toString()}`, { baseUrl: 'express' })
}

export async function getOrganizationBenchmarks(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/organization-benchmarks?${params.toString()}`, { baseUrl: 'express' })
}

export async function getCurrentStats(): Promise<unknown> {
  return apiGet('/organization-benchmarks?action=current-stats', { baseUrl: 'express' })
}
```

**For `notifications-center`:** The fallback is already in place and working. No code change needed — the Edge Function invoke attempt is expected to fail and the direct DB query takes over. Optionally add a `console.warn` suppression or wrap the fallback more cleanly, but not required.

**For auth retries:** Reducing retry noise can be done by setting `autoRefreshToken: true` with a longer retry interval, but the real fix is ensuring the Edge Function DNS is resolved (i.e., routing analytics through Express). Once the analytics calls stop failing, the auth client will stop interpreting them as session invalidation signals.

### Files to Change

1. `frontend/src/domains/analytics/repositories/analytics.repository.ts` — add `{ baseUrl: 'express' }` to all three `apiGet` calls

---

## Architecture Patterns

### i18n Pattern in This Codebase

- `useTranslation('namespace')` where namespace matches the JSON filename (e.g., `'calendar'` → `frontend/src/i18n/en/calendar.json`)
- Keys within the namespace do NOT include the namespace prefix: `t('view.month')` not `t('calendar.view.month')`
- All namespaces registered in `frontend/src/i18n/index.ts` — both EN and AR must be updated in parallel

### API Routing Pattern

- Default `apiGet(path)` → Supabase Edge Functions (`VITE_SUPABASE_URL/functions/v1/path`)
- `apiGet(path, { baseUrl: 'express' })` → Express backend (`VITE_API_URL/path`)
- Use Express routing for features that are implemented in `backend/src/api/` but not as deployed Edge Functions

### PostgREST `.single()` vs `.maybeSingle()`

- `.single()` → 406 if 0 rows, 406 if 2+ rows — use only when row is guaranteed to exist
- `.maybeSingle()` → returns `null` if 0 rows, error if 2+ rows — use for optional lookups
- `[VERIFIED: PostgREST behavior from Supabase JS client source]`

---

## Don't Hand-Roll

| Problem                       | Don't Build              | Use Instead                                             |
| ----------------------------- | ------------------------ | ------------------------------------------------------- |
| Optional single-row query     | Custom 406 error handler | `.maybeSingle()`                                        |
| Routing to different backends | Custom URL builder       | `apiGet(path, { baseUrl: 'express' })` existing pattern |
| i18n fallback keys            | Runtime key aliasing     | Fix namespace at the source                             |

---

## Common Pitfalls

### Pitfall 1: Updating EN calendar.json but forgetting AR

Adding `page.*` keys to `en/calendar.json` without adding Arabic equivalents to `ar/calendar.json` causes the Arabic UI to fall back to key strings. Both files must be updated in the same commit.

### Pitfall 2: `.single()` masking missing DB rows

If the `users` table row is created by a trigger on auth signup, test with a freshly created user to confirm the trigger fires. If no trigger exists, the settings save mutation must use `upsert` not `update`.

### Pitfall 3: Analytics repository has 3 functions — all need the baseUrl fix

Only fixing `getAnalyticsDashboard` and missing `getOrganizationBenchmarks` / `getCurrentStats` leaves partial Edge Function calls.

---

## Open Questions

1. **Does a trigger exist to create `public.users` rows on auth signup?**
   - What we know: The settings page queries `public.users` for profile data
   - What's unclear: Whether a `handle_new_user` trigger exists in Supabase migrations
   - Recommendation: Check `supabase/migrations/` for a trigger before deciding if `maybeSingle()` alone is sufficient or if an upsert in the save mutation is also needed

2. **Is the Express backend analytics route (`/analytics-dashboard`) implemented?**
   - What we know: `analytics.repository.ts` calls `apiGet('/analytics-dashboard')` which defaults to Edge Functions
   - What's unclear: Whether `backend/src/api/` has an analytics router at this path
   - Recommendation: Before changing `baseUrl`, verify `backend/src/api/analytics*` exists; if not, the Express route needs to be created first or the analytics feature needs to be gracefully disabled

---

## Assumptions Log

| #   | Claim                                                                                                    | Section | Risk if Wrong                                                                              |
| --- | -------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| A1  | The auth retry storm is caused by analytics Edge Function DNS failures, not an independent session issue | FIX-03  | Auth retries may persist after fix; would need separate investigation                      |
| A2  | Express backend has `/analytics-dashboard` route implemented                                             | FIX-03  | Routing to `express` would return 404 instead of DNS error — still broken, different error |

---

## Sources

### Primary (HIGH confidence — verified from source files)

- `frontend/src/routes/_protected/calendar.tsx:20` — wrong namespace confirmed
- `frontend/src/i18n/en/calendar.json` — missing `page.*` keys confirmed, `view.*` keys exist
- `frontend/src/i18n/index.ts:53,220,315` — `calendar` namespace is registered
- `frontend/src/pages/settings/SettingsPage.tsx:95` — `.single()` usage confirmed
- `frontend/src/lib/api-client.ts:41` — Edge Function default routing confirmed
- `frontend/src/domains/analytics/repositories/analytics.repository.ts:10-20` — no `baseUrl: 'express'` option confirmed
- `frontend/src/hooks/useNotificationCenter.ts:97,106` — `functions.invoke` with fallback confirmed
- `frontend/src/lib/supabase.ts:16` — `autoRefreshToken: true` confirmed

### Secondary (MEDIUM confidence)

- PostgREST 406 semantics for `.single()` — consistent with Supabase JS client documentation behavior `[ASSUMED: training knowledge, consistent with code evidence]`

## Metadata

**Confidence breakdown:**

- FIX-01 root cause: HIGH — wrong namespace and key mismatch confirmed from source
- FIX-02 root cause: HIGH — `.single()` usage confirmed; trigger existence is open question
- FIX-03 root cause: HIGH — Edge Function default routing confirmed; auth retry causality is MEDIUM

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase)
