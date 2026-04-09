---
phase: 24-browser-inspection-fixes
source: browser-inspection
created: 2026-04-09
---

# Phase 24 Context: Browser Inspection Fixes

## Source

Issues discovered during post-v4.0 deployment browser inspection on droplet (138.197.195.242) using Playwright.

## Issues Found

### Issue 1: Calendar i18n Keys Not Translated (FIX-01)

**Severity:** Medium — visible to all users
**Page:** `/calendar`
**Symptom:** Raw i18n keys displayed instead of translated text:

- `calendar.page.title` (page heading)
- `calendar.view_mode_month`, `calendar.view_mode_week`, `calendar.view_mode_day` (tab labels)
- `calendar.page.create_event` (button text)

**Root cause:** Calendar page uses i18n keys from a `calendar` namespace that either doesn't exist or is missing these specific keys in `frontend/src/i18n/en/` and `frontend/src/i18n/ar/`.

**Decision:** Add missing translation keys to both EN and AR i18n files.

### Issue 2: Settings Page 406 on Users Query (FIX-02)

**Severity:** Medium — causes console errors on settings page
**Page:** `/settings`
**Symptom:** 4 identical 406 (Not Acceptable) errors from:

```
https://zkrcjzdemdmwhearhfgg.supabase.co/rest/v1/users?select=*&id=eq.{uuid}
```

**Root cause:** The Supabase client is making a direct REST call to the `users` table, but the request likely returns multiple rows or the `Accept` header doesn't match what PostgREST expects for a single-row response. The 406 typically means PostgREST expected `Accept: application/vnd.pgrst.object+json` for a `.single()` call but received `application/json`.

**Decision:** Fix the Supabase query to use `.single()` correctly or adjust the select/filter to guarantee a single row return.

### Issue 3: Dashboard Supabase Direct Calls DNS Failure (FIX-03)

**Severity:** Low-Medium — causes 24 console errors, retries flood the console
**Page:** `/dashboard`
**Symptom:** `ERR_NAME_NOT_RESOLVED` for:

- `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/notifications-center`
- `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1/analytics-dashboard`
- `https://zkrcjzdemdmwhearhfgg.supabase.co/auth/v1/user` (session refresh retries)

**Root cause:** The frontend makes direct browser-to-Supabase calls for Edge Functions and auth session refresh. When the browser can't resolve the Supabase hostname (network/DNS issue on the droplet or client), these fail and retry aggressively, creating 24+ errors. The data still loads because the main API calls go through the backend proxy.

**Decision:** Investigate whether these Edge Function calls can be routed through the backend proxy, and whether the auth session refresh retry loop has a backoff mechanism. The auth retry loop is the most impactful — it accounts for most of the 24 errors.

## Pages That Passed

- Dashboard (visual OK, data loads)
- Countries, Organizations, Forums (bilingual data renders correctly)
- Kanban (columns, cards, priority badges all correct)
- Engagements (empty state renders correctly)
- Arabic RTL (sidebar flips, columns flow RTL, text correct)
