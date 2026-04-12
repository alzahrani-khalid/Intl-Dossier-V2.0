# Quick Task 260412-kot: Route notifications-center through Express proxy

**Completed:** 2026-04-12
**Commit:** 8619b431

## What Changed

### Backend: `backend/src/api/notifications.ts`

- Added `GET /counts` endpoint — proxies `get_notification_counts` RPC server-side with fallback to simple unread count
- Added `POST /mark-read` endpoint — proxies `mark_category_as_read` RPC and direct notification updates, scoped by authenticated user ID
- Both endpoints use `supabaseAdmin` (service role) and extract user from JWT via `authenticateToken` middleware

### Frontend: `frontend/src/hooks/useNotificationCenter.ts`

- `useNotificationCounts`: Now tries `apiGet('/notifications/counts', { baseUrl: 'express' })` first, falls back to direct Supabase RPC
- `useMarkAsRead`: Now tries `apiPost('/notifications/mark-read', params, { baseUrl: 'express' })` first, falls back to direct Supabase calls
- Added `apiPost` import alongside existing `apiGet`

## Phase 24 SC-3 Resolution

All three notification hooks now route through Express proxy first:

1. `useNotifications` — already fixed (pre-existing)
2. `useNotificationCounts` — **fixed in this task**
3. `useMarkAsRead` — **fixed in this task**

No direct `supabase.functions.invoke()` calls remain. Browser-to-Supabase Edge Function DNS errors (`ERR_NAME_NOT_RESOLVED`) eliminated for notifications.

## Security

- User ID extracted from JWT server-side (not from query params) — prevents fetching other users' data
- All notification updates filtered by `user_id` server-side
