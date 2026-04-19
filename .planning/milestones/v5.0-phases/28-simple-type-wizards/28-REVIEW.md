---
phase: 28-simple-type-wizards
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - frontend/src/components/dossier/wizard/review/ReviewComponents.tsx
  - frontend/src/components/dossier/wizard/config/organization.config.ts
  - frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx
  - frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx
  - frontend/src/components/dossier/wizard/config/topic.config.ts
  - frontend/src/components/dossier/wizard/steps/TopicBasicInfoStep.tsx
  - frontend/src/components/dossier/wizard/review/TopicReviewStep.tsx
  - frontend/src/components/dossier/wizard/config/person.config.ts
  - frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx
  - frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx
  - frontend/src/routes/_protected/dossiers/organizations/create.tsx
  - frontend/src/routes/_protected/dossiers/topics/create.tsx
  - frontend/src/routes/_protected/dossiers/persons/create.tsx
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 28: Code Review Report

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 28 delivers three new type wizards (organization, topic, person) built on the shared wizard infrastructure from Phase 26/27. The code is well-structured and consistent. No critical security vulnerabilities were found. The five warnings cover: an object URL memory leak in the photo uploader, an unvalidated URL written directly to an `<img src>`, a missing `isUploading` guard that allows double-submission, RTL icon violations in all three route pages, and a `sensitivity_level` translation call that will produce a broken key when the value is undefined. The info items cover minor code duplication and a missing touch-target minimum.

---

## Warnings

### WR-01: Object URL created in `handleFileSelect` is never revoked — memory leak

**File:** `frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx:39`
**Issue:** `URL.createObjectURL(file)` creates a blob URL and stores it in `previewUrl`. The URL is never revoked with `URL.revokeObjectURL()`. Each file selection leaks a blob that persists for the lifetime of the page. In a long-running SPA session, repeated photo selections accumulate unreleased memory.
**Fix:**

```tsx
// Replace the useState cleanup — use useEffect to revoke on unmount or URL change
useEffect(() => {
  return () => {
    if (previewUrl != null) {
      URL.revokeObjectURL(previewUrl)
    }
  }
}, [previewUrl])

// Also revoke the old URL before setting a new one inside handleFileSelect:
const localUrl = URL.createObjectURL(file)
setPreviewUrl((prev) => {
  if (prev != null) URL.revokeObjectURL(prev)
  return localUrl
})
```

---

### WR-02: Unvalidated `photo_url` value rendered as `<img src>` in `PersonReviewStep`

**File:** `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx:99`
**Issue:** `values.photo_url` is taken directly from form state (a string the user or upload system can influence) and rendered as `<img src={values.photo_url}>` without any origin or format validation. While `onError` suppresses broken images in `PersonDetailsStep`, no such guard exists on the review step thumbnail. A data URI or `javascript:` URI stored in the field would execute in older WebView environments and be visible in the DOM in all.
**Fix:**

```tsx
// Add a helper that accepts only http(s) URLs and blob: from the current session
function isSafeImageUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('blob:')
}

// Gate the img render:
{values.photo_url !== undefined &&
  values.photo_url !== '' &&
  isSafeImageUrl(values.photo_url) ? (
  <img src={values.photo_url} ... />
) : (
  <ReviewField label={t('form-wizard:person.photo')} value={undefined} />
)}
```

---

### WR-03: `isUploading` state does not disable the wizard's Next/Submit button — double-submission possible

**File:** `frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx:41-60`
**Issue:** `isUploading` is local state inside `PersonDetailsStep` and is never surfaced to the parent wizard shell. A user can click "Next" while a photo upload is in flight. The form will advance (or submit) with `photo_url` still set to `''` (the empty initial value) rather than the uploaded URL, silently discarding the photo. The `onComplete` callback fires after navigation, setting the URL on a form the user has already left.
**Fix:** Expose the uploading state upward via a callback prop or a shared context so `CreateWizardShell` can disable its Next button:

```tsx
// Option A — add prop to PersonDetailsStep
interface PersonDetailsStepProps {
  form: UseFormReturn<PersonFormData>
  onUploadingChange?: (uploading: boolean) => void
}
// Call onUploadingChange(true/false) around setIsUploading calls.

// Option B — use a shared wizard context that tracks "step is busy"
```

---

### WR-04: RTL icon violation — `ChevronLeft` used as a back-navigation affordance in all three route pages

**File:** `frontend/src/routes/_protected/dossiers/organizations/create.tsx:34`
**File:** `frontend/src/routes/_protected/dossiers/topics/create.tsx:33`
**File:** `frontend/src/routes/_protected/dossiers/persons/create.tsx:33`
**Issue:** All three create routes use `<ChevronLeft className="h-4 w-4 me-1" />` for the back-to-list link. Per CLAUDE.md Rule 5 (Directional Icons): with `forceRTL(true)` active, `chevron-left` (pointing left) is the "drill in / enter" affordance. The correct icon for "go back / return" in RTL is `chevron-right`. This is the same bug fixed in Phase 27 (WR-02) for the country wizard but was not applied to the three new wizards.
**Fix:**

```tsx
// Replace in all three route files:
import { ChevronRight } from 'lucide-react'
// ...
;<ChevronRight className="h-4 w-4 me-1" />
```

This matches the RTL reading model: the arrow points right (toward the start/right edge), which visually communicates "go back" to an Arabic reader.

---

### WR-05: `sensitivity_level` translated unconditionally — produces broken i18n key when value is undefined

**File:** `frontend/src/components/dossier/wizard/review/TopicReviewStep.tsx:70`
**Issue:** The `ReviewField` for sensitivity always calls `t(`dossier:sensitivityLevel.${values.sensitivity_level}`)`, even when `values.sensitivity_level` is `undefined` (before the user selects a value or if the field is optional). This produces the literal string `"dossier:sensitivityLevel.undefined"` rendered in the UI rather than the `--` placeholder that `ReviewField` would show for an `undefined` value.
**Fix:**

```tsx
<ReviewField
  label={t('dossier:form.sensitivityLevel', 'Sensitivity')}
  value={
    values.sensitivity_level != null
      ? t(`dossier:sensitivityLevel.${values.sensitivity_level}`)
      : undefined
  }
/>
```

---

## Info

### IN-01: Description truncation logic duplicated across three review components

**File:** `frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx:42-47`
**File:** `frontend/src/components/dossier/wizard/review/TopicReviewStep.tsx:29-33`
**File:** `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx:32-44`
**Issue:** The 120-character description truncation pattern is copy-pasted three times. `PersonReviewStep` also inlines it a fourth time directly in the JSX prop (lines 68-73). This should be a shared utility.
**Fix:**

```ts
// In ReviewComponents.tsx or a shared util:
export function truncateForReview(value: string | undefined, max = 120): string | undefined {
  if (value == null || value === '') return undefined
  return value.length > max ? `${value.slice(0, max)}...` : value
}
```

---

### IN-02: Remove-photo button touch target is below the 44×44 minimum

**File:** `frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx:138-145`
**Issue:** The remove button is sized `min-h-[28px] min-w-[28px]` — well below the 44×44px minimum touch target required by CLAUDE.md. On mobile, this small overlay button on the photo thumbnail will be difficult to tap reliably.
**Fix:**

```tsx
className =
  'absolute -top-2 -end-2 rounded-full bg-destructive text-destructive-foreground p-1 min-h-11 min-w-11 flex items-center justify-center'
```

The icon can remain `h-3 w-3` while the button itself meets the minimum.

---

### IN-03: Uploading state shows bare `'...'` string rather than an i18n key

**File:** `frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx:166`
**Issue:** `{isUploading ? '...' : t('form-wizard:person.upload_photo')}` uses a hardcoded ellipsis. This is not localised and gives no accessible indication of progress.
**Fix:**

```tsx
{
  isUploading
    ? t('form-wizard:person.uploading_photo', 'Uploading...')
    : t('form-wizard:person.upload_photo')
}
```

---

### IN-04: `React` import type narrowing inconsistency in `ReviewComponents.tsx`

**File:** `frontend/src/components/dossier/wizard/review/ReviewComponents.tsx:7`
**Issue:** `import type { ReactElement } from 'react'` is used, but the `children` prop on `ReviewSectionProps` is typed as `React.ReactNode` (line 20) without importing `React`. TypeScript resolves this because `React` is in scope globally (React 19 JSX transform), but `React.ReactNode` as a type reference without an explicit import is inconsistent with the rest of the codebase which uses `import type { ReactNode } from 'react'`.
**Fix:**

```tsx
import type { ReactElement, ReactNode } from 'react'

interface ReviewSectionProps {
  title: string
  onEdit: () => void
  children: ReactNode
}
```

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
