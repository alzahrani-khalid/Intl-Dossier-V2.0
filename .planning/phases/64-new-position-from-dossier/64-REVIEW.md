---
phase: 64-new-position-from-dossier
reviewed: 2026-06-12T12:11:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - frontend/src/components/dossier/AddToDossierDialogs.tsx
  - frontend/src/components/positions/DossierPositionsTab.tsx
  - frontend/src/components/positions/NewPositionDialog.tsx
  - frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx
  - frontend/src/domains/positions/hooks/useAudienceGroups.ts
  - frontend/src/domains/positions/hooks/usePositionTypes.ts
  - frontend/src/domains/positions/index.ts
  - frontend/src/domains/positions/repositories/positions.repository.ts
  - frontend/src/domains/positions/types/index.ts
  - frontend/src/i18n/ar/positions.json
  - frontend/src/i18n/en/positions.json
  - supabase/migrations/20260612120000_restore_positions_insert_policy.sql
findings:
  critical: 0
  warning: 6
  info: 8
status: issues_found
---

# Phase 64: Code Review Report

**Reviewed:** 2026-06-12T12:11:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed the New-Position-from-Dossier feature: the rebuilt `NewPositionDialog` (form layer + two-step create→link submit), its wiring into `AddToDossierDialogs` and `DossierPositionsTab`, the two new lookup hooks, repository/types additions, i18n keys (EN+AR), the RLS INSERT-policy restore migration, and the six-case test file.

Core contracts were traced and verified sound: `CreatePositionPayload` matches the form values; the `positions-create` edge returns the bare position object (so `position.id` access is correct) and inserts `status: 'draft'` / `author_id: user.id`, satisfying the restored policy's `WITH CHECK` predicate byte-for-byte against the canonical `20250101011_rls_positions.sql` source; `invalidateQueries({ queryKey: ['dossier-position-links', dossierId] })` prefix-matches the reader's 3-element key `['dossier-position-links', dossierId, filters]`; `FormMessage` runs colon-form validation keys back through `t()`, and all referenced keys exist in both EN and AR bundles; the `unique_position_dossier_link` constraint prevents retry-induced duplicate links.

No Critical findings. Six Warnings: a default-application `form.reset` that can clobber user-typed input, a catch-scope conflation in the two-step submit that can produce a permanent false "partial failure" retry loop, a silent no-op Create button while the dossier row is unloaded, a dead-end form when lookup tables are empty, duplicate JSON keys silently dropping translations in both locale files (pre-existing), and a type-erasing double cast (pre-existing). Eight Info items cover dead state, import placement, test fragility/coverage gaps, and copy/contract inconsistencies.

## Critical Issues

None found.

## Warnings

### WR-01: Defaults effect `form.reset` clobbers user-typed titles when lookups resolve after typing

**File:** `frontend/src/components/positions/NewPositionDialog.tsx:189-209`
**Severity:** WARNING
**Issue:** The D-05/D-06 defaults effect fires once both lookup queries have data and `position_type_id === ''`. It then calls `form.reset({ position_type_id: standardType.id, title_en: '', title_ar: '', content_en: '', content_ar: '', audience_groups: [allStaff.id] })`. On a cold cache (first session open, slow network), the user can already be typing into `title_en`/`title_ar` while the lookups are in flight; when they resolve, the reset wipes the typed input back to `''`. The 30-minute `staleTime` masks this on subsequent opens but not on the first one.
**Fix:** Preserve current field values instead of hard-coding empties:

```tsx
form.reset(
  {
    ...form.getValues(),
    position_type_id: standardType.id,
    audience_groups: [allStaff.id],
  },
  { keepDefaultValues: false },
)
```

### WR-02: Submit catch conflates `finishSuccess` failures with link failures — retry then loops forever on the unique constraint

**File:** `frontend/src/components/positions/NewPositionDialog.tsx:291-301` (and retry path `252-269`)
**Severity:** WARNING
**Issue:** The second try block wraps BOTH `linkToDossier(positionId)` and `finishSuccess(positionId)`. If `finishSuccess` throws after the link write succeeded (e.g. the parent `onClose` callback throws, or any post-link bookkeeping fails), the user is shown the "Position created, but linking failed" warning even though linking succeeded. Clicking Retry re-POSTs the same `applies_to` link, which now violates `unique_position_dossier_link (position_id, dossier_id, link_type)` (migration 20251022000009) — a non-2xx that `showPartialFailure` re-surfaces as another link failure, producing an unescapable false-warning loop. The same loop occurs in the legitimate lost-response case (link persisted server-side, response dropped).
**Fix:** Scope the catch to the link write only, and treat a uniqueness conflict on retry as success:

```tsx
try {
  await linkToDossier(positionId)
} catch {
  form.reset()
  onClose()
  showPartialFailure(positionId)
  return
} finally {
  setSubmitting(false)
}
await finishSuccess(positionId)
```

(Additionally, in the retry handler, treat an HTTP 409/conflict from `positions-dossiers-create` as "already linked" → call `finishSuccess`.)

### WR-03: "Create position" button is a silent no-op while the dossier row has not loaded (or errored)

**File:** `frontend/src/components/positions/DossierPositionsTab.tsx:71-73, 104-110, 269-276`
**Severity:** WARNING
**Issue:** `NewPositionDialog` is only rendered when `dossierContext` is non-null, i.e. when `useDossier(dossierId)` has data. The comment asserts a guaranteed cache hit, but `useDossier`'s key is `[...dossierKeys.detail(id), { include }]` with `include: undefined` — if the shell loaded the row under a different `include` variant, this is a fresh network request, and if it is in-flight or errored, clicking "Create position" sets `showNewPositionDialog = true` and nothing appears. No feedback, no error, and the state is already `true` so a second click also does nothing even after data arrives only because the dialog then pops unexpectedly.
**Fix:** Disable the button until the context is ready and surface the error case:

```tsx
<Button
  onClick={handleCreatePosition}
  disabled={!dossierContext}
  ...
>
```

### WR-04: Empty lookup tables produce a dead-end form with no message

**File:** `frontend/src/components/positions/NewPositionDialog.tsx:189-195, 357-393, 512-555`
**Severity:** WARNING
**Issue:** The error branches only render on `query.error != null`. If `position_types` or `audience_groups` legitimately returns zero rows (empty reference table, RLS drift — the exact incident class this phase's own migration fixes), there is no error: the defaults effect early-returns (`types.length === 0 || groups.length === 0`), the audience section renders an empty checkbox grid, `audience_groups` can never satisfy `.min(1)`, and the submit button is permanently disabled with no explanation. Unhandled empty-collection edge case.
**Fix:** Treat resolved-but-empty lookups like the error state:

```tsx
const typesUnavailable = typesQuery.error != null || (!typesQuery.isLoading && types.length === 0)
const groupsUnavailable =
  groupsQuery.error != null || (!groupsQuery.isLoading && groups.length === 0)
```

and render `create_dialog.lookup_error` for the unavailable section.

### WR-05: Duplicate JSON keys in both positions.json files silently drop translations

**File:** `frontend/src/i18n/en/positions.json:48, 388` and `frontend/src/i18n/ar/positions.json:48, 358`
**Severity:** WARNING (pre-existing — verified present at `bc154052^`, i.e. before this phase)
**Issue:** Both locale files contain duplicate object keys, and `JSON.parse` keeps only the last occurrence:

- `editor.title` is defined twice (EN lines 35 and 48). The second ("Title" / "العنوان") silently overrides the first ("Position Editor" / "محرر الموقف"), so the editor heading string is unreachable.
- `attach.selected` is defined twice (EN lines 377 and 388). The second ("Selected" / "محدد") overrides the counter string `"{{count}} of {{max}} selected"`, so any selection counter using `t('positions:attach.selected', { count, max })` renders the bare word "Selected".
  These are live i18n bugs in files modified by this phase; the new `create_dialog`/`validation`/`dossier_tab` keys themselves are duplicate-free.
  **Fix:** Rename the colliding keys (e.g. `editor.fieldTitle` for the second `editor.title`, `attach.selectedBadge` for the second `attach.selected`) in both EN and AR, and update their consumers. Consider adding a JSON-duplicate-key lint to CI.

### WR-06: Type-erasing double cast on `useCreateTicket()` bypasses the mutation contract

**File:** `frontend/src/components/dossier/AddToDossierDialogs.tsx:197-200`
**Severity:** WARNING (pre-existing in a reviewed file; not introduced by this phase)
**Issue:** `useCreateTicket() as unknown as { mutateAsync: (params: Record<string, unknown>) => Promise<{ id: string } | undefined>; isPending: boolean }` erases the hook's real types. This is exactly the unvalidated-cast bug class that previously shipped a crashing field-contract mismatch (the `TimelineActivity` incident): if `useCreateTicket`'s payload or response shape drifts, the compiler cannot catch it, and `result?.id` silently becomes `undefined`, skipping the dossier-link write without any error.
**Fix:** Fix the variance mismatch at the source — type `useCreateTicket`'s variables/return precisely (or add a thin typed adapter) and remove the `as unknown as` cast.

## Info

### IN-01: Dead `typeFilter` state in DossierPositionsTab

**File:** `frontend/src/components/positions/DossierPositionsTab.tsx:39, 84, 89`
**Issue:** `typeFilter` is declared, reset in `handleClearFilters`, and checked in `hasActiveFilters`, but no filter control renders for it and it is not passed to `useDossierPositionLinks` — it can never be anything but `'all'`.
**Fix:** Remove the state and its two references, or add the missing Type filter Select.

### IN-02: Import statement at the bottom of the repository file

**File:** `frontend/src/domains/positions/repositories/positions.repository.ts:210-211`
**Issue:** `import type { PositionDossierLink } from '../types'` sits at line 211 with a "Need to import for return type" comment instead of being merged into the existing `'../types'` type-import block at lines 16-30.
**Fix:** Move `PositionDossierLink` into the top import block and delete the trailing import.

### IN-03: `useSheetOnMobile` prop is declared but never used

**File:** `frontend/src/components/dossier/AddToDossierDialogs.tsx:82-84, 1078-1083`
**Issue:** `AddToDossierDialogsProps.useSheetOnMobile` is documented ("Use sheet (bottom drawer) on mobile") but never destructured or read — dead API surface (pre-existing).
**Fix:** Remove the prop or implement the sheet behavior.

### IN-04: Escape/overlay close bypasses the `submitting` guard that disables the Cancel button

**File:** `frontend/src/components/positions/NewPositionDialog.tsx:337, 562-571`
**Issue:** Cancel is `disabled={submitting}`, but `onOpenChange={(open) => !open && onClose()}` lets Escape or an overlay click close the dialog mid-submit, contradicting the guard's intent. The flow still completes (toasts are global), but the user loses the in-dialog state cues.
**Fix:** `onOpenChange={(open) => { if (!open && !submitting) onClose() }}`.

### IN-05: Test fragility and coverage gaps in NewPositionDialog.test.tsx

**File:** `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx:244, 278, whole file`
**Issue:** (a) `titleEn.closest('[class*="space-y-2"]')` couples the test to `FormItem`'s current Tailwind classes — a styling change breaks the suite without a behavior change. (b) `expect(linkMock).toHaveBeenCalledWith(...)` at line 278 sits outside the `waitFor`, relying on microtask flush ordering after the `createMock` assertion. (c) No test covers the total-create-failure path (toast_error fires, dialog stays open with input intact — UI-SPEC state 10) or the lookup-error rendering, both of which have dedicated i18n keys and code branches.
**Fix:** Scope via `screen.getByLabelText(...).closest('div')` chained from the rendered label, or add a `data-testid`; move the `linkMock` assertion inside a `waitFor`; add the two missing failure-path tests.

### IN-06: Attach-existing flow omits `link_type` while quick-create always pins `applies_to`

**File:** `frontend/src/components/positions/DossierPositionsTab.tsx:227-264`
**Issue:** `onAttach` calls `createPositionDossierLink(positionId, { dossier_id: dossierId })` without `link_type`; the deployed edge defaults it to `related_to` (verified in `positions-dossiers-create/index.ts:88`). The quick-create dialog deliberately always passes `applies_to` for the same tab. If this semantic split (created-from = applies_to, attached-existing = related_to) is intentional, document it at the call site; if not, pass an explicit `link_type`. The `engagementId=""` prop also remains a contract smell on `AttachPositionDialog`.
**Fix:** Add a comment documenting the intended default, or pass `link_type` explicitly.

### IN-07: AR terminology drift — "الملف" vs "دوسيه" for dossier

**File:** `frontend/src/i18n/ar/positions.json:441, 455, 468`
**Issue:** `create_dialog.toast_partial_failure` and `dossier_tab.subtitle`/`no_positions` render dossier as "الملف"/"بهذا الملف", while the rest of the namespace (`detail.dossier`, `position_dossier_links.*`) consistently uses "دوسيه". Inconsistent terminology in user-visible copy.
**Fix:** Align the three new strings on the established "دوسيه" wording (or migrate the namespace wholesale in a dedicated pass).

### IN-08: EventDialog posts `title_ar: ''` — bilingual contract gap

**File:** `frontend/src/components/dossier/AddToDossierDialogs.tsx:666-667`
**Issue:** Calendar entries created from the Event dialog persist an empty Arabic title (`title_ar: ''`), so Arabic users see blank/fallback event titles. Pre-existing; noted because the file is in review scope and the phase replaced the sibling Position dialog precisely for this bug class (blank `title_ar`).
**Fix:** Add an Arabic title field (mirroring NewPositionDialog's bilingual pair) or derive `title_ar` from the EN title with the translate assist.

---

_Reviewed: 2026-06-12T12:11:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
