---
phase: 64-new-position-from-dossier
verified: 2026-06-12T15:08:00Z
status: human_needed
score: 3/3 must-haves verified
overrides_applied: 0
human_verification:
  - test: 'Open the New Position dialog from both entry points (Positions tab and Add-to-Dossier menu) and verify the position-type picker, bilingual title fields, and audience multi-select all render correctly in both EN and AR locale'
    expected: 'Type picker shows lookup rows (Standard Position / Critical Position), both title fields present with correct dir attributes (title_ar = rtl, title_en = ltr), audience checkboxes render all groups with bilingual labels, submit is disabled until all required fields are filled'
    why_human: 'Visual form rendering and real-time validation state cannot be verified programmatically; the six unit tests cover the behavior contract but not the visual rendering or accessibility of the live form'
  - test: 'In AR locale, open the New Position dialog and verify AR labels display (نوع الموقف, العنوان (إنجليزي|عربي), مجموعات الجمهور), Tajawal font applies, and Arabic validation messages appear on blur of empty required fields'
    expected: 'Full bilingual contract holds: AR labels from positions.json ar block, dir=rtl on the container, title_en field still dir=ltr, validation message العنوان العربي مطلوب visible on touched-empty title_ar'
    why_human: 'Visual/RTL verification of font rendering and dir attributes requires a live browser — the live evidence in 64-06-SUMMARY.md covers this but was captured by the executor, not an independent verification agent'
---

# Phase 64: New Position from Dossier — Verification Report

**Phase Goal:** Creating a position from any dossier persists a valid position and its dossier link
**Verified:** 2026-06-12T15:08:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                                                                                                   | Status                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The New Position dialog offers a real position-type picker, bilingual title fields, and audience-group selection whose submission satisfies positions-create validation (no position_type_id = dossier_id, no blank title_ar, no empty audience_groups) | ✓ VERIFIED                 | Zod schema (lines 80-93 of NewPositionDialog.tsx) enforces `position_type_id.min(1)`, `title_en.min(1)`, `title_ar.min(1)`, `audience_groups.min(1)`; name-match defaults (STANDARD_TYPE_NAME / ALL_STAFF_NAME with first-row fallback) at lines 194-208; submit `disabled={!form.formState.isValid \|\| submitting}` at line 574; unit tests a (D-04), b (D-05/D-06), c (D-07) all GREEN (6/6 suite pass) |
| 2   | After create, the position_dossier_links row exists for the originating dossier (DB-verified on staging)                                                                                                                                                | ✓ VERIFIED (live evidence) | 64-06-SUMMARY.md entry-point matrix: both positions have `link_type = applies_to`, `dossier_id = 9b9a04af-50b0-408c-878d-9d07f77a74ab`; code path: `linkToDossier()` at line 241 passes `link_type: 'applies_to'` explicitly; unit test d (POSNEW-02, D-09/D-10) GREEN                                                                                                                                     |
| 3   | The new position appears on the dossier's Positions tab without a manual refresh                                                                                                                                                                        | ✓ VERIFIED (live evidence) | 64-06-SUMMARY.md: "count 0→1, card rendered in same SPA session"; code path: `finishSuccess()` at line 218 invalidates `['dossier-position-links', dossier_id]` (the DossierPositionsTab query key) and `dossierOverviewKeys.detail(dossierId)`; unit test e (POSNEW-02, D-12) GREEN                                                                                                                       |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact                                                                 | Expected                                                                                       | Status     | Details                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260612120000_restore_positions_insert_policy.sql` | Idempotent RLS restore for positions INSERT with forensic header                               | ✓ VERIFIED | 29 lines, contains `DROP POLICY IF EXISTS "drafters_insert_positions"` + `CREATE POLICY "drafters_insert_positions" … WITH CHECK (auth.uid() = author_id AND status = 'draft')`, zero `WITH CHECK (true)`, scope limited to one INSERT policy on positions                                  |
| `frontend/src/domains/positions/hooks/usePositionTypes.ts`               | Lookup query hook for position_types                                                           | ✓ VERIFIED | 58 lines, `queryKey: ['position-types']`, `staleTime: 30 * 60 * 1000`, `from('position_types').select(…).order('name_en')`, throws on error                                                                                                                                                 |
| `frontend/src/domains/positions/hooks/useAudienceGroups.ts`              | Lookup query hook for audience_groups                                                          | ✓ VERIFIED | 56 lines, `queryKey: ['audience-groups']`, `staleTime: 30 * 60 * 1000`, `from('audience_groups').select(…).order('name_en')`, throws on error                                                                                                                                               |
| `frontend/src/domains/positions/repositories/positions.repository.ts`    | translateContent edge wrapper                                                                  | ✓ VERIFIED | `translateContent(input: TranslateContentInput): Promise<TranslateContentResponse>` at line 101, posts to `/translate-content` via `apiPost`, contract comment documenting 503/AI-down behavior                                                                                             |
| `frontend/src/i18n/en/positions.json`                                    | create_dialog + validation key blocks                                                          | ✓ VERIFIED | All 16 `create_dialog` keys and 5 `validation` keys present; `dossier_tab.create_position = "Create position"` and `dossier_tab.attach_existing` present                                                                                                                                    |
| `frontend/src/i18n/ar/positions.json`                                    | Arabic twin of create_dialog + validation blocks                                               | ✓ VERIFIED | All required keys present; `dossier_tab.create_position = "إنشاء موقف"`, `dossier_tab.attach_existing = "إرفاق موقف موجود"`                                                                                                                                                                 |
| `frontend/src/components/positions/NewPositionDialog.tsx`                | Extracted quick-create dialog: RHF+Zod form, lookups, defaults, translate assists, submit flow | ✓ VERIFIED | 611 lines, contains `zodResolver`, `usePositionTypes`, `useAudienceGroups`, `translateContent`, `link_type: 'applies_to'`, `mutateAsync`, `dossierOverviewKeys`, `toast.warning` for partial failure, `toast.success` for full success, `dir="rtl"` on AR fields, `dir="ltr"` on EN fields  |
| `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` | Six-case unit test file, all active                                                            | ✓ VERIFIED | 317 lines, zero `it.skip`, 6/6 tests GREEN (confirmed by `pnpm exec vitest run` output)                                                                                                                                                                                                     |
| `frontend/src/components/dossier/AddToDossierDialogs.tsx`                | PositionDialog as thin NewPositionDialog wrapper                                               | ✓ VERIFIED | `PositionDialog` function body replaced with `return <NewPositionDialog isOpen onClose dossierContext isRTL />`; broken payload (`position_type_id: dossierContext.dossier_id`, position `title_ar: ''`, `audience_groups: []`) eliminated; `@/hooks/useCreatePosition` shim import removed |
| `frontend/src/components/positions/DossierPositionsTab.tsx`              | D-13 rewire — primary creates, secondary attaches                                              | ✓ VERIFIED | Contains `NewPositionDialog`, `attach_existing`, `inheritance_source: 'direct'`, `Promise.allSettled` (attach flow preserved), `useDossier` for cache-hit context                                                                                                                           |

### Key Link Verification

| From                                                                     | To                               | Via                                                              | Status                  | Details                                                                                                                                                                                      |
| ------------------------------------------------------------------------ | -------------------------------- | ---------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NewPositionDialog.tsx`                                                  | position_types / audience_groups | `usePositionTypes()` / `useAudienceGroups()`                     | ✓ WIRED                 | Hooks called at lines 160-161; both imported at lines 53-54                                                                                                                                  |
| `NewPositionDialog.tsx`                                                  | translate-content edge           | `translateContent` repository wrapper                            | ✓ WIRED                 | `translateContent` called in `handleTranslate` at line 315; imported at line 58                                                                                                              |
| `NewPositionDialog.tsx`                                                  | positions-create edge            | `useCreatePosition.mutateAsync`                                  | ✓ WIRED                 | `createPosition.mutateAsync(values)` at line 280; hook imported at line 55                                                                                                                   |
| `NewPositionDialog.tsx`                                                  | position_dossier_links           | `createPositionDossierLink(…, { link_type: 'applies_to' })`      | ✓ WIRED                 | `linkToDossier()` helper at line 241; `createPositionDossierLink` imported at line 57                                                                                                        |
| `NewPositionDialog.tsx`                                                  | dossier-scoped query cache       | `queryClient.invalidateQueries(['dossier-position-links', id])`  | ✓ WIRED                 | `finishSuccess()` at lines 219-227 invalidates both tab key and `dossierOverviewKeys.detail`                                                                                                 |
| `AddToDossierDialogs.tsx`                                                | `NewPositionDialog`              | PositionDialog thin wrapper                                      | ✓ WIRED                 | `NewPositionDialog` imported at line 66, rendered at lines 617-623                                                                                                                           |
| `DossierPositionsTab.tsx`                                                | `NewPositionDialog`              | Primary "Create position" button → `showNewPositionDialog` state | ✓ WIRED                 | `NewPositionDialog` imported at line 18, rendered at lines 270-274 with `dossierContext` built from `useDossier(dossierId)`                                                                  |
| `DossierPositionsTab.tsx`                                                | cached dossier detail            | `useDossier(dossierId)` cache hit                                | ✓ WIRED                 | `useDossier` imported at line 15, called at line 47; `inheritance_source: 'direct'` at line 66                                                                                               |
| `supabase/migrations/20260612120000_restore_positions_insert_policy.sql` | staging positions table          | `mcp__supabase__apply_migration` (recorded in 64-01-SUMMARY.md)  | ✓ WIRED (live evidence) | 64-01-SUMMARY.md records apply_migration success; after-state diagnostic shows `drafters_insert_positions` — polcmd `a`, permissive, check `(auth.uid() = author_id) AND (status = 'draft')` |

### Data-Flow Trace (Level 4)

| Artifact                                      | Data Variable                          | Source                                                             | Produces Real Data                                            | Status    |
| --------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- | --------- |
| `NewPositionDialog.tsx` — type picker         | `typesQuery.data`                      | `usePositionTypes` → `supabase.from('position_types').select(…)`   | Yes — live PostgREST read from reference table                | ✓ FLOWING |
| `NewPositionDialog.tsx` — audience checkboxes | `groupsQuery.data`                     | `useAudienceGroups` → `supabase.from('audience_groups').select(…)` | Yes — live PostgREST read from reference table                | ✓ FLOWING |
| `NewPositionDialog.tsx` — submit              | `createPosition.mutateAsync(values)`   | `positions-create` edge function                                   | Yes — creates real DB row (live-verified 201 in 64-01, 64-06) | ✓ FLOWING |
| `DossierPositionsTab.tsx` — dossier context   | `dossier` from `useDossier(dossierId)` | `dossierKeys.detail` cache (RLS-filtered SELECT)                   | Yes — populated by the shell's prior load; cache hit          | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior                                        | Command                                                                              | Result                               | Status |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ | ------ |
| 6/6 dialog unit tests pass                      | `pnpm exec vitest run src/components/positions/__tests__/NewPositionDialog.test.tsx` | `6 passed (6)` — 1.72s               | ✓ PASS |
| Zero `it.skip` in test file                     | `grep -c 'it\.skip'`                                                                 | 0 matches                            | ✓ PASS |
| Migration has correct predicate (no over-grant) | `grep -q 'WITH CHECK (true)'`                                                        | Not found                            | ✓ PASS |
| No broken payload in AddToDossierDialogs        | `grep 'position_type_id: dossierContext.dossier_id'`                                 | Not found in position dialog section | ✓ PASS |
| RTL: no physical Tailwind utilities in dialog   | `grep 'ml-\|mr-\|text-left\|text-right'`                                             | Not found in NewPositionDialog.tsx   | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED (no probe scripts present in `scripts/*/tests/probe-*.sh` for this phase; live verification was performed via agent-browser + Supabase MCP and recorded in 64-06-SUMMARY.md; the instructions specify treating that recorded evidence as the source of truth).

### Requirements Coverage

| Requirement | Source Plan                | Description                                                                                                                                                  | Status      | Evidence                                                                                                                                                                                                                                                              |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POSNEW-01   | 64-02, 64-03, 64-04        | User creating a position from a dossier gets a real position-type picker, bilingual title fields, and audience-group selection that satisfy positions-create | ✓ SATISFIED | NewPositionDialog Zod schema enforces type/title_en/title_ar/audience requirements; lookup hooks read real reference tables; unit tests a/b/c verify picker defaults and validation behavior; test d verifies real type id and audience ids reach the edge            |
| POSNEW-02   | 64-01, 64-04, 64-05, 64-06 | After create, the position_dossier_links row is written and the new position appears on the dossier's Positions tab (live-verified)                          | ✓ SATISFIED | `linkToDossier()` calls `createPositionDossierLink` with `link_type: 'applies_to'` (unit test d); dossier-scoped invalidation in `finishSuccess()` drives tab refresh (unit test e); live evidence in 64-06-SUMMARY.md shows DB rows and tab count 0→1 without reload |

### Anti-Patterns Found

| File                      | Line | Pattern        | Severity | Impact                                                                                                                                                                                                                                                          |
| ------------------------- | ---- | -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AddToDossierDialogs.tsx` | 666  | `title_ar: ''` | ℹ️ Info  | This is the **EventDialog** calendar-entry payload (not the position dialog). The EventDialog legitimately uses an empty AR title for calendar entries; it is a sibling dialog and was explicitly excluded from modification. Not a stub for the position path. |

No TBD, FIXME, or XXX markers found in any phase-modified file. No unreferenced debt markers.

### Human Verification Required

The automated checks all passed. Two items require human testing to close out the bilingual/RTL visual contract:

#### 1. EN-locale visual form rendering

**Test:** Open the New Position dialog from both the Positions tab and the Add-to-Dossier menu on a country dossier (e.g., Saudi Arabia at `/dossiers/countries/9b9a04af-50b0-408c-878d-9d07f77a74ab`). In EN locale, verify the form renders: a position-type Select picker showing "Standard Position" preselected, both title fields present (title_ar renders RTL text flow with Tajawal font even in EN locale), audience checkboxes showing all 4 groups with All Staff pre-checked, submit button initially disabled.
**Expected:** The form renders as described in 64-UI-SPEC and was observed live in 64-06 Task 2. Submit becomes enabled only after both title fields are filled.
**Why human:** Visual rendering of the type picker options, per-field direction, font appearance, and checkbox layout cannot be confirmed programmatically. The 64-06-SUMMARY.md records this was observed by the executor (screenshots at `/tmp/uat64-*.png`), but an independent verifier has not confirmed it.

#### 2. AR-locale labels, RTL layout, and bilingual validation messages

**Test:** Switch to Arabic locale (topbar ع button; persists under `localStorage id.locale`). Open the New Position dialog. Verify Arabic labels (نوع الموقف, العنوان (إنجليزي), العنوان (عربي), مجموعات الجمهور, إنشاء موقف for submit), Tajawal body font, `document.dir=rtl`. The title_en field must still render `dir=ltr`. Blur the title_ar field while empty and confirm the Arabic validation message العنوان العربي مطلوب appears.
**Expected:** Bilingual contract holds as specified in 64-UI-SPEC §Bilingual & RTL Contract; observed live in 64-06 Task 2 (screenshot `/tmp/uat64-9-ar-dialog.png`).
**Why human:** Locale-specific font rendering, RTL layout direction, and Arabic validation message appearance require visual browser verification. The unit tests use mocked i18n and cannot verify the actual Arabic string rendering or Tajawal font application.

### Gaps Summary

No gaps. All three roadmap success criteria are verified:

1. **SC1** (real picker, bilingual titles, audience selection satisfying validation): fully implemented in code and proven by 6/6 unit tests.
2. **SC2** (position_dossier_links row DB-verified): code path implements `link_type: 'applies_to'` explicitly; live SQL evidence in 64-06-SUMMARY.md confirms rows with correct `dossier_id` and `link_type`.
3. **SC3** (tab renders without manual refresh): `finishSuccess()` invalidates the dossier-scoped query key; live evidence in 64-06-SUMMARY.md confirms count 0→1 in same SPA session.

The two human verification items are visual/RTL quality checks — the code contract is sound. They do not represent missing implementation; they represent independent confirmation of what the executor observed during live UAT.

---

_Verified: 2026-06-12T15:08:00Z_
_Verifier: Claude (gsd-verifier)_
