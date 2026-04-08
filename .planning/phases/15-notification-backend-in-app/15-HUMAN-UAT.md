---
status: partial
phase: 15-notification-backend-in-app
source: [15-VERIFICATION.md]
started: 2026-04-06T21:00:00+03:00
updated: 2026-04-08T11:30:00Z
runner: playwright-mcp + droplet
---

## Current Test

[paused at Test 2 — realtime bug discovered during Test 1]

## Tests

### 1. Bell icon + panel (NOTIF-01)

expected: Bell icon in header with unread badge, click opens notification center with category tabs
result: pass
notes: |
Bell button present in header (aria-label="Notifications"). Click opens
popover dialog with heading "Notifications", 5 category tabs
(All / Assignments / Deadlines / Workflow / System), "Mark All as Read"
(disabled), "Notification Preferences", close + "View All" controls.
Empty state shown: "All caught up! You have no new notifications."
Unread badge NOT verifiable — test user has 0 unread notifications,
so there is nothing to render a badge for. Structural presence of
the bell + panel + category tabs is confirmed.

### 2. Task assignment toast (NOTIF-02)

expected: Creating/assigning a task triggers Sonner toast within ~5s
result: blocked
blocked_by: realtime-bug
reason: |
useNotificationCenter realtime subscription is broken on production.
Console emits "cannot add postgres_changes callbacks for
realtime:notifications-realtime after subscribe()" on every mount.
Any INSERT into public.notifications will not reach the client,
so the Sonner toast cannot be triggered. Test cannot proceed
meaningfully until the hook is fixed and redeployed.

### 3. Mark-as-read (NOTIF-07)

expected: Click notification marks read, "Mark all as read" clears all, badge updates
result: pending

### 4. Async dispatch logs (NOTIF-08)

expected: Backend logs show "Notification worker ready" and job processing
result: pending

### 5. Preference toggle respected (NOTIF-06)

expected: Disabling assignments category prevents toast; re-enabling restores it
result: blocked
blocked_by: realtime-bug
reason: Depends on Test 2 (toast delivery) which is blocked.

### 6. Arabic RTL layout

expected: Notification panel text and toasts render correctly in RTL
result: pending

## Summary

total: 6
passed: 1
issues: 0
pending: 3
skipped: 0
blocked: 2

## Gaps

- truth: "Task assignment triggers Sonner toast within ~5s via realtime"
  status: failed
  reason: |
  useNotificationCenter hook subscribes to a hard-coded channel name
  'notifications-realtime'. React Strict Mode double-effect causes
  the second mount to reuse the already-subscribed cached channel,
  throwing on .on() calls. Additionally the async setupRealtime
  race-conditions with the cleanup function.
  severity: major
  test: 2
  artifacts:
  - frontend/src/hooks/useNotificationCenter.ts:484-525
    missing:
  - unique channel name per effect instance
  - cancelled flag to coordinate async setup with cleanup
  - recommend: `notifications-realtime-${user.id}-${crypto.randomUUID()}`

- truth: "User profile fetch returns successfully from /rest/v1/users"
  status: failed
  reason: |
  PostgREST returns HTTP 406 on
  /rest/v1/users?select=id,full_name,role,... for the logged-in user.
  Typically caused by .single() expecting exactly one row but RLS
  returning zero, or Accept header / format mismatch. User profile
  column list may be out of sync with RLS policy on `users` table.
  severity: minor
  test: 1
  artifacts:
  - console-error-on-/dashboard-after-login
    missing:
  - investigate RLS policy on public.users
  - verify row exists for user id de2734cf-f962-4e05-bf62-bc9e92efff96
  - check if .single() should be .maybeSingle()
