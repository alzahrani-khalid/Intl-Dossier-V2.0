---
phase: quick
plan: 260412-kot
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/api/notifications.ts
  - frontend/src/domains/notifications/hooks/useNotificationCenter.ts
autonomous: true
requirements: [SC-3]
must_haves:
  truths:
    - 'useNotificationCounts fetches counts via Express proxy, not direct Supabase RPC'
    - 'useMarkAsRead sends mutations via Express proxy, not direct Supabase RPC'
    - 'Both hooks fall back to direct Supabase calls if Express proxy fails'
  artifacts:
    - path: 'backend/src/api/notifications.ts'
      provides: 'GET /counts and POST /mark-read proxy endpoints'
      exports: ['router']
    - path: 'frontend/src/domains/notifications/hooks/useNotificationCenter.ts'
      provides: 'Express-first notification hooks with Supabase fallback'
  key_links:
    - from: 'frontend useNotificationCounts'
      to: 'GET /api/notifications/counts'
      via: "apiGet with baseUrl: 'express'"
      pattern: 'apiGet.*notifications/counts.*express'
    - from: 'frontend useMarkAsRead'
      to: 'POST /api/notifications/mark-read'
      via: "apiPost with baseUrl: 'express'"
      pattern: 'apiPost.*notifications/mark-read.*express'
---

<objective>
Route remaining notifications-center Supabase RPC calls through Express proxy to close Phase 24 verification gap SC-3.

Purpose: The `useNotifications` hook already uses Express proxy, but `useNotificationCounts` and `useMarkAsRead` still call Supabase RPCs directly from the browser. This violates the SC-3 security criterion requiring all Edge Function calls to go through the backend proxy.

Output: Two Express endpoints + updated frontend hooks with Express-first, Supabase-fallback pattern (matching analytics.repository.ts pattern).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@backend/src/api/notifications.ts
@backend/src/api/index.ts
@frontend/src/domains/notifications/hooks/useNotificationCenter.ts
@frontend/src/domains/analytics/repositories/analytics.repository.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Express proxy endpoints for notification counts and mark-read</name>
  <files>backend/src/api/notifications.ts</files>
  <action>
Add two new endpoints to the existing notifications router in `backend/src/api/notifications.ts`:

1. **GET /counts** — Proxies `get_notification_counts` RPC:
   - Extract `user.id` from `req.user` (set by `authenticateToken` middleware)
   - Call `supabase.rpc('get_notification_counts', { p_user_id: user.id })`
   - Return the counts object as JSON
   - Wrap in try/catch, return 500 on failure with error message

2. **POST /mark-read** — Proxies `mark_category_as_read` RPC + direct updates:
   - Accept body: `{ category: string, notificationIds?: string[] }`
   - If `notificationIds` provided: update `notifications` table directly setting `read = true` for those IDs (filtered by user_id for security)
   - Also call `supabase.rpc('mark_category_as_read', { p_user_id: user.id, p_category: category })`
   - Return success/failure JSON
   - Wrap in try/catch, return 500 on failure

Both endpoints must use `authenticateToken` middleware (already applied at router level in `api/index.ts`). Follow the existing pattern in the file — use the same `supabase` client import. Do NOT add any new dependencies.
</action>
<verify>
<automated>cd "/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0" && npx tsc --noEmit --project backend/tsconfig.json 2>&1 | head -20</automated>
</verify>
<done>GET /api/notifications/counts and POST /api/notifications/mark-read endpoints exist, compile without errors, and proxy the Supabase RPCs server-side.</done>
</task>

<task type="auto">
  <name>Task 2: Update frontend hooks to use Express proxy with Supabase fallback</name>
  <files>frontend/src/domains/notifications/hooks/useNotificationCenter.ts</files>
  <action>
Update two hooks in `useNotificationCenter.ts` to follow the Express-first pattern already used by `useNotifications` (line ~99) and `analytics.repository.ts`:

1. **useNotificationCounts** (around line 161):
   - Import `apiGet` if not already imported
   - In the queryFn, try Express first: `apiGet('/notifications/counts', { baseUrl: 'express' })`
   - Catch and fall back to existing `supabase.rpc('get_notification_counts', { p_user_id: user.id })` call
   - Keep the same return shape and TanStack Query config

2. **useMarkAsRead** (around line 214):
   - Import `apiPost` if not already imported
   - In the mutationFn, try Express first: `apiPost('/notifications/mark-read', { category, notificationIds }, { baseUrl: 'express' })`
   - Catch and fall back to existing direct Supabase calls (the RPC + direct update logic)
   - Keep the same optimistic update and invalidation logic unchanged

Pattern to follow (from the existing `useNotifications` in same file):

```typescript
try {
  const data = await apiGet('/notifications/counts', { baseUrl: 'express' })
  return data
} catch {
  // Existing Supabase fallback
  const { data, error } = await supabase.rpc(...)
  ...
}
```

Do NOT change `useNotifications` — it is already fixed. Do NOT alter any query keys, stale times, or invalidation logic.
</action>
<verify>
<automated>cd "/Users/khalidalzahrani/Desktop/Coding Space/Intl-Dossier-V2.0" && npx tsc --noEmit --project frontend/tsconfig.json 2>&1 | head -20</automated>
</verify>
<done>useNotificationCounts and useMarkAsRead both attempt Express proxy first and fall back to direct Supabase on failure. No direct-only Supabase RPC calls remain in the notification hooks.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary               | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| browser -> Express API | Auth token validated by authenticateToken middleware     |
| Express -> Supabase    | Server-side service role key, user scoped by JWT user.id |

## STRIDE Threat Register

| Threat ID | Category  | Component       | Disposition | Mitigation Plan                                                                             |
| --------- | --------- | --------------- | ----------- | ------------------------------------------------------------------------------------------- |
| T-kot-01  | Spoofing  | GET /counts     | mitigate    | Use req.user.id from JWT (not query param) to prevent fetching other users' counts          |
| T-kot-02  | Tampering | POST /mark-read | mitigate    | Filter notification updates by user_id server-side to prevent marking others' notifications |
| T-kot-03  | Elevation | POST /mark-read | mitigate    | Validate category is a known enum value before passing to RPC                               |

</threat_model>

<verification>
1. `npx tsc --noEmit` passes for both backend and frontend
2. Grep confirms no remaining direct `supabase.rpc('get_notification_counts')` or `supabase.rpc('mark_category_as_read')` calls without Express-first wrapper
3. App loads notification bell without errors (manual spot check)
</verification>

<success_criteria>

- All three notification hooks (useNotifications, useNotificationCounts, useMarkAsRead) route through Express proxy first
- Supabase fallback preserved for resilience
- SC-3 verification criterion fully satisfied
- No TypeScript compilation errors
  </success_criteria>

<output>
After completion, create `.planning/quick/260412-kot-route-notifications-center-through-expre/260412-kot-SUMMARY.md`
</output>
