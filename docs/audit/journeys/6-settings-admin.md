# Journey 6 — Settings & Admin

**Date:** 2026-04-10
**Status:** Code audit complete, browser verification pending
**Agents:** Data Flow, Component, RTL/i18n

## Summary

- **Critical:** 0
- **Warning:** 4
- **Info:** 3

Note: 1 known J0 issue re-confirmed (N-02 missing /admin index) — not counted again.

---

## Findings

### [WARNING] R-60: Hardcoded AI model/provider labels not translated

- **File:** frontend/src/routes/\_protected/admin/ai-settings.tsx:127-139
- **Agent:** rtl-i18n-auditor
- **Journey:** 6-settings-admin
- **Issue:** PROVIDERS and MODELS constants contain hardcoded English labels ("Anthropic", "Claude Sonnet 4", "GPT-4o", etc.) in dropdown SelectItems. Not translated for Arabic users.
- **Expected:** Use t() translation function for all user-facing labels
- **Fix:** Replace hardcoded labels with t('models.providerName') pattern, add to translation files
- **Affects:** [6-settings-admin, admin AI settings in Arabic]

### [WARNING] R-61: SelectItem children not translated (11 instances)

- **File:** frontend/src/routes/\_protected/admin/ai-settings.tsx (multiple)
- **Agent:** rtl-i18n-auditor
- **Journey:** 6-settings-admin
- **Issue:** SelectItem components render hardcoded provider/model names without t() wrapper
- **Expected:** Wrap text: <SelectItem>{t('models.' + key)}</SelectItem>
- **Fix:** Extract all dropdown option text to translation namespace
- **Affects:** [6-settings-admin, form accessibility in Arabic]

### [WARNING] D-60: Permission denied error not user-friendly

- **File:** frontend/src/routes/\_protected/admin/field-permissions.tsx:95-100
- **Agent:** data-flow-auditor
- **Journey:** 6-settings-admin
- **Issue:** beforeLoad throws generic Error('Admin access required') — no translated error UI
- **Expected:** Translated error message in context-aware error boundary
- **Fix:** Use actionable error type with i18n key, catch in error boundary
- **Affects:** [6-settings-admin, non-admin UX]

### [WARNING] D-61: AI settings error toast shows raw API errors

- **File:** frontend/src/routes/\_protected/admin/ai-settings.tsx:193-202
- **Agent:** data-flow-auditor
- **Journey:** 6-settings-admin
- **Issue:** onError handler uses error.message directly (English from API). Success toast correctly uses t().
- **Expected:** Consistent translated error messages
- **Fix:** Use t('errors.' + error.code || 'genericError') pattern
- **Affects:** [6-settings-admin, error UX]

### [INFO] R-62: Field permissions table headers may be hardcoded English

- **Agent:** rtl-i18n-auditor
- **Journey:** 6-settings-admin
- **Issue:** Table column headers in field-permissions likely hardcoded. Needs verification.
- **Fix:** Extract headers to translation namespace 'field-permissions'

### [INFO] R-63: Settings container missing explicit dir attribute

- **File:** frontend/src/components/settings/SettingsLayout.tsx:47
- **Agent:** rtl-i18n-auditor
- **Journey:** 6-settings-admin
- **Issue:** Root container has no dynamic dir attribute. Uses logical CSS (text-start) which works, but screen readers may miss directionality.
- **Fix:** Add dir={isRTL ? 'rtl' : 'ltr'} to container

### [INFO] N-60: Admin index route missing (known from J0 N-02)

- **Agent:** navigation-auditor
- **Journey:** 6-settings-admin
- **Issue:** Re-confirmed — /admin has no index route. Already tracked as N-02.

---

## Re-confirmed J0 Issues (still present)

- N-02: Missing /admin index route
