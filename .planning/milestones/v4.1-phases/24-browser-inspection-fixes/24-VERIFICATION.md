---
phase: 24-browser-inspection-fixes
verified: 2026-04-09T00:00:00Z
status: gaps_found
score: 2/3 must-haves verified
overrides_applied: 0
gaps:
  - truth: 'Dashboard Supabase Edge Function calls (notifications-center, analytics-dashboard) go through the backend proxy instead of direct browser-to-Supabase calls, eliminating ERR_NAME_NOT_RESOLVED errors'
    status: partial
    reason: "analytics-dashboard calls are now routed through Express with baseUrl:'express', but notifications-center still calls supabase.functions.invoke() directly (line 97 of useNotificationCenter.ts). SC-3 explicitly names both. The SUMMARY claimed the existing fallback was sufficient, but the success criterion requires routing through the backend proxy, not graceful degradation from a direct call."
    artifacts:
      - path: 'frontend/src/hooks/useNotificationCenter.ts'
        issue: "Still calls supabase.functions.invoke('notifications-center') directly — direct browser-to-Supabase Edge Function call, not routed through Express proxy"
    missing:
      - "Route notifications-center call through Express backend proxy (or add try/catch with baseUrl:'express' pattern matching analytics fix) to eliminate the direct Edge Function DNS call"
---

# Phase 24: Browser Inspection Fixes — Verification Report

**Phase Goal:** Fix three browser-visible runtime issues discovered during post-v4.0 deployment inspection: calendar i18n keys showing raw strings, settings page 406 PostgREST errors, and dashboard Edge Function DNS failures.
**Verified:** 2026-04-09T00:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| #   | Truth                                                                                                                                                       | Status   | Evidence                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Calendar page shows translated labels (not raw i18n keys) in both English and Arabic                                                                        | VERIFIED | `useTranslation('calendar')` confirmed in calendar.tsx:20; all keys used (`page.title`, `page.description`, `view.month/week/day`, `form.create_event`) exist in both en/calendar.json and ar/calendar.json                                                                                                               |
| 2   | Settings page loads without 406 errors on the users Supabase query                                                                                          | VERIFIED | `.maybeSingle()` on line 95 of SettingsPage.tsx; null guard returning `defaultUserSettings` on lines 100-101; `.upsert({id: user.id, ...})` on line 167 for write path                                                                                                                                                    |
| 3   | Dashboard Supabase Edge Function calls (notifications-center, analytics-dashboard) go through the backend proxy instead of direct browser-to-Supabase calls | FAILED   | analytics.repository.ts uses `{ baseUrl: 'express' }` — analytics-dashboard calls no longer hit Supabase directly. However, `useNotificationCenter.ts:97` still calls `supabase.functions.invoke('notifications-center')` — a direct browser-to-Supabase Edge Function call that will still produce ERR_NAME_NOT_RESOLVED |

**Score:** 2/3 truths verified

### Required Artifacts

| Artifact                                                              | Status   | Details                                                                                    |
| --------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `frontend/src/routes/_protected/calendar.tsx`                         | VERIFIED | Namespace corrected to `'calendar'`; all key paths updated                                 |
| `frontend/src/i18n/en/calendar.json`                                  | VERIFIED | `page.title`, `page.description`, `view.*`, `form.create_event` all present                |
| `frontend/src/i18n/ar/calendar.json`                                  | VERIFIED | Arabic equivalents confirmed present (sampled first 30 lines, form section confirmed)      |
| `frontend/src/pages/settings/SettingsPage.tsx`                        | VERIFIED | `maybeSingle()`, null guard, and `upsert()` all in place                                   |
| `frontend/src/domains/analytics/repositories/analytics.repository.ts` | VERIFIED | All three functions use `{ baseUrl: 'express' }` with try/catch fallback                   |
| `frontend/src/hooks/useNotificationCenter.ts`                         | FAILED   | Still uses `supabase.functions.invoke('notifications-center')` — direct Edge Function call |

### Key Link Verification

| From                     | To                     | Via                                                 | Status                  | Details                                                                                |
| ------------------------ | ---------------------- | --------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| calendar.tsx             | en/ar calendar.json    | `useTranslation('calendar')` + key paths            | WIRED                   | Namespace and keys aligned                                                             |
| SettingsPage.tsx         | Supabase users table   | `.maybeSingle()` read + `.upsert()` write           | WIRED                   | Both read and write paths handle missing rows                                          |
| analytics.repository.ts  | Express backend        | `apiGet(..., { baseUrl: 'express' })`               | PARTIAL                 | Routing correct but Express routes don't exist; calls silently return `{ data: null }` |
| useNotificationCenter.ts | Supabase Edge Function | `supabase.functions.invoke('notifications-center')` | NOT_WIRED through proxy | Direct call still in place — this is what SC-3 requires to be fixed                    |

### Data-Flow Trace (Level 4)

| Artifact                | Data Variable            | Source                        | Produces Real Data                   | Status                                                                                             |
| ----------------------- | ------------------------ | ----------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| analytics.repository.ts | analytics dashboard data | Express routes (non-existent) | No — always returns `{ data: null }` | HOLLOW — wired to proxy but data is never returned; acceptable as intentional deferral per SUMMARY |

### Behavioral Spot-Checks

Step 7b: Skipped — changes are frontend React components and repository modules; no standalone runnable entry points to test without a running server.

### Requirements Coverage

| Requirement | Description                            | Status    | Evidence                                                            |
| ----------- | -------------------------------------- | --------- | ------------------------------------------------------------------- |
| FIX-01      | Calendar i18n keys showing raw strings | SATISFIED | Namespace fix + key additions verified in source                    |
| FIX-02      | Settings page 406 PostgREST errors     | SATISFIED | maybeSingle + upsert pattern verified in source                     |
| FIX-03      | Dashboard Edge Function DNS failures   | PARTIAL   | analytics-dashboard fixed; notifications-center direct call remains |

### Anti-Patterns Found

| File                    | Line       | Pattern                                                                          | Severity | Impact                                                                                                                 |
| ----------------------- | ---------- | -------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| SettingsPage.tsx        | 268-272    | Floating promise: `form.handleSubmit(...)()` not awaited and not `void`-prefixed | Warning  | Will fail `pnpm typecheck` per project ESLint rule `no-floating-promises: error` (documented in 24-REVIEW.md as WR-01) |
| analytics.repository.ts | 13, 22, 31 | All errors silently swallowed — catches all exceptions not just network failures | Warning  | Logic errors masked; documented in 24-REVIEW.md as WR-02                                                               |

### Human Verification Required

None — all checks are verifiable from source code.

### Gaps Summary

One gap blocks goal achievement.

SC-3 requires that both `notifications-center` AND `analytics-dashboard` Edge Function calls go through the backend proxy instead of direct browser-to-Supabase calls. The analytics side was fixed. The notifications side was explicitly left unchanged in the SUMMARY ("left untouched as its existing fallback already works correctly"), but `useNotificationCenter.ts` line 97 still calls `supabase.functions.invoke('notifications-center')` directly. On a deployment where the Supabase Edge Function DNS is not resolving in the browser, this call will still produce ERR_NAME_NOT_RESOLVED. The "existing fallback" is a catch block — it still makes the direct DNS call first.

The fix mirrors what was done for analytics: wrap the existing `supabase.functions.invoke` call in a try/catch (or replace with a proxied call through Express) so the direct Edge Function DNS lookup never originates from the browser.

**Two code review warnings from 24-REVIEW.md are also present** (floating promise in `handleSave`, broad error swallowing in analytics repository) but these do not block the phase goal — they are code quality issues to address in a follow-on fix.

---

_Verified: 2026-04-09T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
