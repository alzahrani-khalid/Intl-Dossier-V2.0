# Journey 3 — Engagement Lifecycle

**Date:** 2026-04-10
**Status:** Code audit complete, browser verification pending
**Agents:** Data Flow, Component, RTL/i18n, Navigation

## Summary

- **Critical:** 0
- **Warning:** 2
- **Info:** 8

---

## Findings

### [WARNING] D-30: After-action creation doesn't invalidate engagement queries

- **File:** frontend/src/hooks/useAfterAction.ts:211-216
- **Agent:** data-flow-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** useCreateAfterAction invalidates ['after-actions', dossier_id] but NOT engagement queries. Engagement detail won't show new after-action link without manual refresh.
- **Expected:** Also invalidate ['engagement', engagementId] on after-action creation
- **Fix:** Add queryClient.invalidateQueries({ queryKey: ['engagement', data.engagement_id] })
- **Affects:** [3-engagement-lifecycle, stale data]

### [WARNING] D-31: After-action form submit not showing loading state

- **File:** frontend/src/routes/\_protected/engagements/$engagementId/after-action.tsx:89-93
- **Agent:** data-flow-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** createAfterAction.isPending not passed to AfterActionForm. User could click submit multiple times.
- **Expected:** Pass isSubmitting={isPending} to form, disable submit during mutation
- **Fix:** Pass isPending prop down to AfterActionForm
- **Affects:** [3-engagement-lifecycle, UX]

### [INFO] D-32: Version conflict detection uses string matching

- **File:** frontend/src/hooks/useAfterAction.ts:230-236
- **Agent:** data-flow-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** Relies on error.message.includes('version'). Fragile if message format changes.
- **Fix:** Check error.status === 409 or structured error code instead

### [INFO] D-33: Type safety issue with dossier_id access

- **File:** frontend/src/routes/\_protected/engagements/$engagementId/after-action.tsx:52
- **Agent:** data-flow-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** Uses `(engagement as any).dossier_id` — bypasses TypeScript safety
- **Fix:** Add dossier_id to engagement type definition

### [INFO] C-30: Missing aria-label on back buttons

- **File:** frontend/src/routes/\_protected/engagements/$engagementId/after-action.tsx:73
- **Agent:** component-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** Back button with rotated arrow has no aria-label for screen readers
- **Fix:** Add aria-label={t('actions.back')}

### [INFO] N-30: After-action back button goes to dossier, not engagement

- **File:** frontend/src/routes/\_protected/after-actions/$afterActionId.tsx:123
- **Agent:** navigation-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** Back from after-action navigates to dossier page, not the engagement that created it. User loses engagement context.
- **Expected:** Back should go to engagement if came from engagement
- **Fix:** Store referrer or add engagement link in breadcrumb trail

### [INFO] C-31: AfterActionRecord type missing engagement details

- **File:** frontend/src/hooks/useAfterAction.ts:94-121
- **Agent:** component-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** Type has engagement_id but no engagement object. Requires extra API call for display.
- **Fix:** Add optional engagement?: {...} to type or create view type

### [INFO] R-30: RTL checks verbose but functional

- **File:** frontend/src/routes/\_protected/engagements/$engagementId/after-action.tsx:68-78
- **Agent:** rtl-i18n-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** Manual isRTL checks and rotate-180 on arrows. Works but verbose.
- **Fix:** Consider rtl: Tailwind variant instead of manual checks

### [INFO] R-31: Missing AR translations for engagement-specific terms

- **File:** frontend/public/locales/ar/translation.json
- **Agent:** rtl-i18n-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** Some engagement keys may be missing in AR. Needs translation audit.
- **Fix:** Run grep for t() calls in engagement routes, verify all keys exist in AR

### [INFO] D-34: After-action N+1 query for engagement context

- **File:** frontend/src/hooks/useAfterAction.ts:94-121
- **Agent:** data-flow-auditor
- **Journey:** 3-engagement-lifecycle
- **Issue:** After-action record doesn't include engagement details, requiring separate fetch
- **Fix:** Include engagement details in after-action API response or create joined view
