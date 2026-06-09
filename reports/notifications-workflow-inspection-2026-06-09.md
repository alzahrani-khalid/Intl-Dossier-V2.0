# Notifications Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + schema verification (no live browser session this pass)  
**Environment:** Frontend `http://localhost:5173`, backend `http://localhost:5001`, staging Supabase `zkrcjzdemdmwhearhfgg`  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.

---

## Executive summary

The notification center is **fully implemented** (`NotificationPanel`, `NotificationsPage`, preferences, digest settings, hooks, edge function, Express proxies, realtime) but **not wired into the production shell**. `AppShell` mounts `Topbar`, which shows a **hardcoded badge of 3** and a bell with **no click handler or popover**. The working `NotificationPanel` (with `data-testid="notification-bell"`, real unread count, mark-read, realtime) is only mounted on **`layout/Header.tsx`**, which is **not imported anywhere** in `frontend/src`.

Data-layer issues include **`sendInAppNotification` inserting a non-existent `metadata` column** (schema uses `data`) and omitting required `type`, breaking backend/E2E notification creation; **`.single()` on empty `email_notification_preferences`** in the edge function and digest UI; and **email preference upserts without `onConflict: 'user_id'`**, which fails on second save when a row already exists.

Verified carve-outs **not** flagged: empty pref tables requiring `.maybeSingle()` pattern (flagged where `.single()` is still used); digest modeled as `daily_digest_enabled` / `weekly_digest_enabled` (no `digest_frequency` column).

| Area                                       | Verdict                                                              |
| ------------------------------------------ | -------------------------------------------------------------------- |
| Topbar bell / unread badge                 | **Fail** — stub count, no panel                                      |
| Notification panel (popover)               | Pass — implemented but **unreachable** from shell                    |
| Full notifications page (`/notifications`) | Pass                                                                 |
| Mark read / mark all read                  | Pass — hooks + Express + edge + RPC fallbacks                        |
| Category preferences UI                    | Pass — direct Supabase upsert with correct `onConflict`              |
| Email / digest preferences                 | Partial — read mostly OK; upsert + `.single()` issues                |
| `notifications-center` edge function       | Partial — list/counts OK; preferences email fetch fragile            |
| Express `/api/notifications/*`             | Pass — correct when `VITE_API_URL` includes `/api`                   |
| Realtime subscription                      | Pass — INSERT/UPDATE on `notifications`                              |
| i18n (`notification-center`)               | Partial — bundles aligned; several hardcoded EN strings remain       |
| RTL (notification components)              | Pass — logical properties; no `ml`/`mr`/`pl`/`pr` in notification UI |

---

## Architecture traced

```
Shell           AppShell → Topbar                    → stub bell (NOTIFICATION_COUNT = 3), no panel
Dead path       layout/Header.tsx                    → NotificationPanel (not imported elsewhere)

Panel           NotificationPanel                    → useNotificationCenter + useNotificationRealtime
Page            /notifications → NotificationsPage  → same hooks; all 8 categories
Prefs           /settings/notifications              → NotificationPreferences → notification_category_preferences
Digest          SettingsPage → EmailDigestSettings    → email_notification_preferences (digest booleans)

Hooks           useNotificationCenter.ts
                  useNotifications     → GET edge /notifications-center?…  (fallback: notifications table)
                  useNotificationCounts  → GET express /notifications/counts (fallback: RPC get_notification_counts)
                  useMarkAsRead        → POST express /notifications/mark-read (fallback: RPC / direct update)
                  useCategoryPreferences → Supabase notification_category_preferences
                  useNotificationRealtime → postgres_changes on notifications

Email hooks     useEmailNotifications.ts             → email_notification_preferences (.maybeSingle read)

Edge            supabase/functions/notifications-center
                  GET list, counts, preferences, devices
                  POST mark-read, register device
                  PATCH category preferences

Express         backend/src/api/notifications.ts     → mounted at /api/notifications
                  GET /counts, POST /mark-read, POST /test-trigger (dev/test)

Backend create  notification.service.ts sendInAppNotification → INSERT notifications (broken column map)

Schema          notifications                        → type, title, message, data, category, read, …
                  notification_category_preferences  → per-user per-category channel toggles
                  email_notification_preferences     → digest + email toggles (UNIQUE user_id)
```

---

## Findings

### CRITICAL

#### 1. Production topbar shows fake unread count and does not open the notification center

**Location:** `frontend/src/components/layout/Topbar.tsx` lines 55–56, 157–182.

**Why it is a bug:** The live shell (`AppShell` → `Topbar`) is the only header analysts see. The bell renders a badge from `const NOTIFICATION_COUNT = 3` with a comment that Phase 42 will wire the real feed. The button has no `onClick`, no `Popover`, and does not mount `NotificationPanel`. Users cannot open the notification list, mark items read, or reach settings from the primary entry point. The badge always shows 3 regardless of database state, which is misleading and breaks the core notification workflow in production.

**Recommended fix:** Replace the stub with `NotificationPanel` (or mount it inside the bell slot), drive the badge from `useNotificationCounts().total`, and remove `NOTIFICATION_COUNT`.

---

#### 2. `NotificationPanel` is only mounted on an unused `Header` component

**Location:** `frontend/src/components/layout/Header.tsx` line 64; `frontend/src/components/layout/AppShell.tsx` (imports `Topbar`, not `Header`).

**Why it is a bug:** Grep across `frontend/src` shows no imports of `components/layout/Header` in runtime routes or shell code. All notification-center UI work (popover, `data-testid="notification-bell"`, realtime toasts, mark-all-read) is effectively dead code from the analyst’s perspective. E2E helpers that target `notification-bell` and `notification-unread-count` will not find those elements on the live topbar.

**Recommended fix:** Mount `NotificationPanel` in `Topbar` (or delete `Header.tsx` after migration). Ensure one canonical shell integration path.

---

#### 3. Backend `sendInAppNotification` uses wrong column name and omits required `type`

**Location:** `backend/src/services/notification.service.ts` lines 47–58; consumed by `backend/src/api/notifications.ts` lines 153–158 (`POST /test-trigger`).

**Why it is a bug:** The insert payload uses `metadata`, but the `notifications` table column is `data` (see `supabase/migrations/20251011214946_create_notifications.sql` and generated types at `frontend/src/types/database.types.ts` ~19335). PostgREST rejects unknown columns. The insert also omits `type`, which is `NOT NULL` in schema. Any call to `sendInAppNotification` (including the dev/test trigger used by E2E) fails at insert time, so notifications are never created through the Express backend path.

**Recommended fix:** Map `metadata` → `data`, require a valid `type` string (and `category` when applicable), and align with `create_notification()` RPC or the notification-center insert patterns used elsewhere.

---

### HIGH

#### 4. Edge function `getPreferences` uses `.single()` on `email_notification_preferences`

**Location:** `supabase/functions/notifications-center/index.ts` lines 302–306.

**Why it is a bug:** When a user has no row in `email_notification_preferences` (verified empty for all users in staging), PostgREST `.single()` returns error `PGRST116` (406). `emailError` is never checked; the handler still returns `email: emailPrefs || null`, which masks the error but violates the required read contract and can confuse clients that treat any error as failure. This is explicitly the class of bug called out in the inspection brief.

**Recommended fix:** Change to `.maybeSingle()` and handle `error` explicitly (throw or return structured error only for non-PGRST116 codes).

---

#### 5. Email preference upserts omit `onConflict: 'user_id'`

**Location:** `frontend/src/hooks/useEmailNotifications.ts` lines 140–144; `frontend/src/components/email/EmailDigestSettings.tsx` lines 156–160.

**Why it is a bug:** `email_notification_preferences` has `CONSTRAINT email_notification_preferences_user_unique UNIQUE (user_id)` (`supabase/migrations/20260110700001_email_integration.sql` line 249). Supabase `upsert` without `onConflict` targets the primary key `id` only. After the first successful insert for a user, a second save attempts another insert and hits a unique violation on `user_id`. Digest and email preference saves fail for any user who already has a row.

**Recommended fix:** Add `{ onConflict: 'user_id' }` to both upsert calls (matching the pattern already used in `useCategoryPreferences` for `user_id,category`).

---

#### 6. `EmailDigestSettings` loads preferences with `.single()` instead of `.maybeSingle()`

**Location:** `frontend/src/components/email/EmailDigestSettings.tsx` lines 90–97.

**Why it is a bug:** The query uses `.single()` and only swallows `PGRST116` in the error branch. With empty pref tables, every load produces a 406 from PostgREST before the fallback path runs. The code happens to treat that as “no row,” but this is the anti-pattern explicitly flagged in the inspection brief; `.maybeSingle()` returns `data: null` without an error and matches `useEmailPreferences` in the same codebase.

**Recommended fix:** Replace `.single()` with `.maybeSingle()` and drop the PGRST116 special case.

---

### MEDIUM

#### 7. Double toast on each realtime notification when the panel is open

**Location:** `frontend/src/hooks/useNotificationCenter.ts` lines 493–498 (`dispatchNotificationToast`); `frontend/src/components/notifications/NotificationPanel.tsx` lines 65–75 (`handleNewNotification` + `useNotificationRealtime(handleNewNotification)`).

**Why it is a bug:** On INSERT, `useNotificationRealtime` always fires a Sonner toast via `dispatchNotificationToast`, then invokes the optional callback. `NotificationPanel` passes a callback that fires a second toast through `useToast`. Users with the panel mounted (only possible via dead `Header` today, or on `/notifications` if wired similarly) see duplicate notifications for every realtime event.

**Recommended fix:** Remove either `dispatchNotificationToast` from the hook when a callback is supplied, or remove the panel’s redundant `handleNewNotification` toast.

---

#### 8. Express notification API paths missing `/api` prefix when `VITE_API_URL` is empty

**Location:** `frontend/src/hooks/useNotificationCenter.ts` lines 156–157, 227–228; `frontend/.env.development` line 3 (`VITE_API_URL=`); `frontend/vite.config.ts` proxy only `/api` (lines 94–97).

**Why it is a bug:** `apiGet('/notifications/counts', { baseUrl: 'express' })` resolves to `/notifications/counts` on the Vite origin when `VITE_API_URL` is empty. That path is not proxied to Express (which serves `/api/notifications/counts`). The empty `catch` blocks silently fall back to Supabase, so local dev never exercises Express notification routes and failures are invisible. Production with `VITE_API_URL=https://…/api` works, but the hook paths are inconsistent with other repositories that use `/api/...` explicitly.

**Recommended fix:** Use `/api/notifications/counts` and `/api/notifications/mark-read` in hooks, or document and enforce that `VITE_API_URL` must always include `/api` (and add dev proxy for `/notifications/*` if empty base is intentional).

---

#### 9. Edge `markAsRead` reports `marked: notificationIds.length` without verifying rows updated

**Location:** `supabase/functions/notifications-center/index.ts` lines 268–284.

**Why it is a bug:** For ID-based mark-read, the handler returns `marked: request.notificationIds.length` after an update with no `.select()`. IDs belonging to another user, expired rows, or non-existent UUIDs still increment the reported count. The Express route correctly returns `updatedRows?.length` (`backend/src/api/notifications.ts` lines 114–125). Clients trusting `marked` for UI feedback or analytics get wrong numbers when using the edge path.

**Recommended fix:** Add `.select('id')` to the update query and return `data?.length ?? 0`, matching the Express implementation.

---

#### 10. Hardcoded English in `NotificationBadge` aria-label

**Location:** `frontend/src/components/notifications/NotificationBadge.tsx` line 42.

**Why it is a bug:** The badge uses ``aria-label={`${count} unread notifications`}`` regardless of locale. Arabic users get an English screen-reader label while the rest of the shell uses `shell.notifications.count` from `common.json` (which has AR strings). This is an i18n/a11y defect in the notification workflow.

**Recommended fix:** Accept `ariaLabel` from parent or call `useTranslation('common')` / `notification-center` and use `t('shell.notifications.count', { count })`.

---

#### 11. Date group labels in `NotificationList` bypass i18n bundles

**Location:** `frontend/src/components/notifications/NotificationList.tsx` lines 123–126.

**Why it is a bug:** `groupByDate` hardcodes English and Arabic strings inline. Equivalent keys already exist in `frontend/src/i18n/en/notification-center.json` and `ar/notification-center.json` (`today`, `yesterday`, `thisWeek`, `older`). Future copy changes to the JSON files will not apply to the list grouping, and any third locale would require code edits.

**Recommended fix:** Pass `t` into `groupByDate` and use `t('today')`, etc., instead of inline literals.

---

#### 12. Realtime toast action label hardcoded as English `"View"`

**Location:** `frontend/src/hooks/useNotificationCenter.ts` line 463.

**Why it is a bug:** `notification-center` AR/EN bundles define `toast.view` (`عرض` / `View`), but `dispatchNotificationToast` hardcodes `label: 'View'`. Arabic users see an English action on Sonner toasts triggered by realtime inserts.

**Recommended fix:** Use i18n inside the toast helper (e.g. `i18n.t('notification-center:toast.view')`) or pass the label from the caller.

---

### LOW

#### 13. `NotificationPanel` urgent-badge logic uses non-schema `type` values

**Location:** `frontend/src/components/notifications/NotificationPanel.tsx` lines 57–62; `frontend/src/hooks/useNotificationCenter.ts` lines 471–474.

**Why it is a bug:** UI checks `type === 'assignment'`, `'deadline_overdue'`, `'deadline_approaching'`. Generated `notification_type` enum values are `commitment_assigned`, `commitment_due_soon`, `after_action_published`, `edit_approved`, `edit_rejected` (`database.types.ts` ~37693). Push opt-in banner and urgent toast variants never activate for real rows; pulse styling on the bell is effectively dead logic.

**Recommended fix:** Align checks with actual `type` / `category` / `priority` fields used at insert time, or map legacy aliases in one normalizer.

---

#### 14. `NotificationPreferences` imports unused email preference hooks

**Location:** `frontend/src/components/notifications/NotificationPreferences.tsx` lines 15, 50–55.

**Why it is a bug:** `useEmailPreferences` is imported and destructured into `_emailPrefs`, `_updateEmailPrefs`, etc., which are never used. Email/digest settings live on a separate settings section (`EmailDigestSettings`). This is dead code that suggests a half-finished merge of email toggles into the category preferences page.

**Recommended fix:** Remove the unused import and hook call, or wire email channel defaults if product requires them on the same page.

---

#### 15. Design-token violation on push opt-in banner icon

**Location:** `frontend/src/components/notifications/PushOptInBanner.tsx` line 168 (`text-primary-600`).

**Why it is a bug:** IntelDossier design rules require colors via `var(--*)` tokens or mapped utilities (`text-ink`, `text-accent`, etc.), not raw Tailwind palette literals. This is a styling contract violation on a notification-surface component.

**Recommended fix:** Replace with `text-accent` or `text-[var(--accent)]` per prototype patterns.

---

## Components verified without defect (this pass)

- **Category preferences read/write:** `useCategoryPreferences` uses array `.select()` (correct for empty tables) and upsert with `onConflict: 'user_id,category'`.
- **`useEmailPreferences` read:** Uses `.maybeSingle()` with comment explaining 406 avoidance (lines 117–124).
- **Digest schema:** `daily_digest_enabled`, `weekly_digest_enabled`, `weekly_digest_time` columns present in migrations; no erroneous `digest_frequency` usage found in frontend.
- **Mark-all-read RPC:** `mark_category_as_read` used consistently from hooks, Express, and edge function.
- **Notifications page:** `/notifications` route uses full category set, filters, mark-read, and realtime (without duplicate callback toast).
- **RTL in notification components:** No physical `left`/`right` or `ml`/`mr`/`pl`/`pr` in `frontend/src/components/notifications/**`.
- **`notification-center` i18n files:** EN/AR JSON structure appears aligned for the namespace keys used by panel and preferences.

---

## Suggested fix order

1. Wire `NotificationPanel` into `Topbar` and remove hardcoded `NOTIFICATION_COUNT` (unblocks entire workflow).
2. Fix `sendInAppNotification` insert shape (`data`, `type`, optional `category`) so backend and E2E can create rows.
3. Replace `.single()` with `.maybeSingle()` on email prefs (edge + `EmailDigestSettings`).
4. Add `onConflict: 'user_id'` to email preference upserts.
5. Clean up double toasts, i18n hardcodes, and express path prefix for dev parity.

---

_End of report._
