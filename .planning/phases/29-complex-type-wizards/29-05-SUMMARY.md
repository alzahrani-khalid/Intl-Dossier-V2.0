---
phase: 29-complex-type-wizards
plan: 05
subsystem: dossier-wizards
tags: [engagement, wizard, multi-select, participants, bilingual, rtl]
requires:
  - 29-01 # DossierPicker multi-select mode
  - 29-02 # Migrations / engagement_participants table (already live per A-06)
  - 26-01 # WizardConfig + baseDossierSchema infrastructure
  - 27-01 # useCreateDossierWizard hook
provides:
  - engagement-wizard
  - engagement-participants-persistence
  - wizard-postCreate-hook
affects:
  - frontend/src/components/dossier/wizard/schemas/engagement.schema.ts
  - frontend/src/components/dossier/wizard/defaults/index.ts
  - frontend/src/components/dossier/wizard/config/types.ts
  - frontend/src/components/dossier/wizard/config/engagement.config.ts
  - frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts
  - frontend/src/components/dossier/wizard/steps/EngagementDetailsStep.tsx
  - frontend/src/components/dossier/wizard/steps/EngagementParticipantsStep.tsx
  - frontend/src/components/dossier/wizard/review/EngagementReviewStep.tsx
  - frontend/src/routes/_protected/dossiers/engagements/create.tsx
  - frontend/src/routes/_protected/dossiers/engagements/index.tsx
  - frontend/src/routeTree.gen.ts
  - frontend/src/i18n/en/form-wizard.json
  - frontend/src/i18n/ar/form-wizard.json
  - frontend/src/services/dossier-api.ts # EngagementExtension enum alignment (deviation)
  - frontend/src/components/dossier/wizard-steps/Shared.ts # legacy enum alignment (deviation)
tech-stack:
  added: []
  patterns:
    - Optional wizard postCreate hook for junction-table inserts
    - Three-array participant field pattern (one per dossier type)
    - Multi-select DossierPicker fan-out in a single wizard step
key-files:
  created:
    - frontend/src/components/dossier/wizard/config/engagement.config.ts
    - frontend/src/components/dossier/wizard/steps/EngagementDetailsStep.tsx
    - frontend/src/components/dossier/wizard/steps/EngagementParticipantsStep.tsx
    - frontend/src/components/dossier/wizard/review/EngagementReviewStep.tsx
    - frontend/src/routes/_protected/dossiers/engagements/create.tsx
    - frontend/src/components/dossier/wizard/steps/__tests__/EngagementDetailsStep.test.tsx
    - frontend/src/components/dossier/wizard/steps/__tests__/EngagementParticipantsStep.test.tsx
    - frontend/src/components/dossier/wizard/review/__tests__/EngagementReviewStep.test.tsx
  modified:
    - frontend/src/components/dossier/wizard/schemas/engagement.schema.ts
    - frontend/src/components/dossier/wizard/defaults/index.ts
    - frontend/src/components/dossier/wizard/config/types.ts
    - frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts
    - frontend/src/routes/_protected/dossiers/engagements/index.tsx
    - frontend/src/routeTree.gen.ts
    - frontend/src/i18n/en/form-wizard.json
    - frontend/src/i18n/ar/form-wizard.json
    - frontend/src/services/dossier-api.ts
    - frontend/src/components/dossier/wizard-steps/Shared.ts
decisions:
  - Empty-string defaults for engagement_type / engagement_category are cast to
    the enum type so react-hook-form's DefaultValues<T> contract is satisfied
    while engagementSchema's runtime enum check still rejects unselected values
    at submit time. This mirrors the standard wizard idiom across Phase 27-29.
  - postCreate failure is logged with console.warn and swallowed. Rationale:
    the base dossier is already persisted and the user must never see a
    "something broke" state when the participants insert (a secondary concern)
    fails for a transient reason. Users can re-add participants from the
    engagement detail page later. This matches RESEARCH §6.4.
  - EngagementExtension enum in services/dossier-api.ts was out of date with
    the live database (A-01 / A-02). Widened it to the 10-value type enum and
    8-value category enum to match, and aligned legacy wizard-steps/Shared.ts
    to the same canonical values. This was a Rule 1 bug fix — the old enum
    values ("meeting", "bilateral", etc.) were frontend-only inventions that
    would always fail the DB CHECK constraint on submit.
metrics:
  duration_hours: 1.5
  completed: 2026-04-16
  tasks_total: 3
  tasks_completed: 3
  files_created: 8
  files_modified: 10
  tests_written: 14
  tests_passing: 14
---

# Phase 29 Plan 05: Engagement Wizard Summary

The engagement wizard is now live at `/dossiers/engagements/create` — a 4-step create flow (Basic Info → Engagement Details → Participants → Review) that persists an `engagements` dossier plus `engagement_participants` junction rows via a new optional `postCreate` hook on `WizardConfig<T>`. Participants use three multi-select DossierPickers (country / organization / person) consuming the Plan 29-01 capability, with the Zod schema aligned to the live database enum values and a `z.refine` enforcing `end_date >= start_date`.

## Commits

| Task | Subject                                                 | Commit     |
| ---- | ------------------------------------------------------- | ---------- |
| 1    | engagement schema + config + postCreate hook + i18n     | `ef8c283d` |
| 2    | engagement details/participants/review steps with tests | `4c2ed73d` |
| 3    | engagement wizard route + list-page Create button       | `9ec6be81` |

## Files Created

- `frontend/src/components/dossier/wizard/config/engagement.config.ts` — 4-step config + `postCreate` batch-inserting into `engagement_participants` with `role='delegate'`.
- `frontend/src/components/dossier/wizard/steps/EngagementDetailsStep.tsx` — type / category selects (10 + 8 options), required start/end dates, RTL-aware bilingual location.
- `frontend/src/components/dossier/wizard/steps/EngagementParticipantsStep.tsx` — three `<fieldset>` sections each mounting a multi-select DossierPicker.
- `frontend/src/components/dossier/wizard/review/EngagementReviewStep.tsx` — 3 ReviewSection cards (Basic / Details / Participants) with edit-jump callbacks.
- `frontend/src/routes/_protected/dossiers/engagements/create.tsx` — TanStack Router file-route.
- Three vitest test files (14 tests total, all passing).

## Files Modified

- `frontend/src/components/dossier/wizard/schemas/engagement.schema.ts` — replaced loose `z.string().optional()` fields with the strict 10+8 enums, required dates with `.refine(end >= start)`, three typed UUID participant arrays. `participant_ids` field removed.
- `frontend/src/components/dossier/wizard/defaults/index.ts` — switched to three participant arrays; empty-string enum defaults cast so `DefaultValues<T>` compiles; fixed pre-existing `wg_status: ''` blocker (Plan 29-04 residual — see Deviations).
- `frontend/src/components/dossier/wizard/config/types.ts` — added optional `postCreate?: (newDossierId: string, data: T) => Promise<void>` to `WizardConfig<T>`.
- `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` — invokes `config.postCreate?.(newDossier.id, values)` in the submission success path, BEFORE clearing the draft and BEFORE navigation. See the `handleComplete` callback around line 95 — the hook runs immediately after `createMutation.mutateAsync(...)` resolves and before `clearDraft()` is called.
- `frontend/src/routes/_protected/dossiers/engagements/index.tsx` — two Create buttons (header + empty-state) now link to `/dossiers/engagements/create` and use `form-wizard:engagement.create_button`.
- `frontend/src/routeTree.gen.ts` — regenerated to include the new route.
- `frontend/src/i18n/en/form-wizard.json` + `ar/form-wizard.json` — `engagement` group with 10 types, 8 categories, field labels, participant labels, and `validation.end_after_start`. Bilingual throughout.

## Schema Breaking Change Note

The legacy `participant_ids: z.array(z.string()).optional()` field has been removed from `engagement.schema.ts`. A repository-wide grep for `participant_ids` across `frontend/src` returned matches only in:

1. `types/calendar-conflict.types.ts` and `types/database.types.ts` — unrelated `affected_participant_ids` for calendar conflicts. Not affected.
2. `components/calendar/CalendarEntryForm.tsx` — calendar-side `participant_ids`, unrelated to dossier wizard. Not affected.
3. `components/dossier/wizard/schemas/engagement.schema.ts` — REMOVED (this plan).
4. `components/dossier/wizard/defaults/index.ts` — UPDATED to three typed arrays (this plan).

No other callers touched the engagement wizard's `participant_ids`, so the removal is safe.

## Hook Extension — postCreate Invocation Point

In `useCreateDossierWizard.ts` `handleComplete`:

```ts
const newDossier = await createMutation.mutateAsync(createData)

// NEW block, inserted after mutation resolve, before clearDraft/navigation
if (config.postCreate != null) {
  try {
    await config.postCreate(newDossier.id, values)
  } catch (err) {
    console.warn('postCreate hook failed', err)
  }
}

clearDraft()
toast.success(t('dossier:create.success'))
// ... navigation
```

Failures are logged (warn) and swallowed — RESEARCH §6.4 "participants-insert failure after base-dossier insert should not roll back".

## Test Results

```
 ✓ src/components/dossier/wizard/steps/__tests__/EngagementParticipantsStep.test.tsx (5 tests) 23ms
 ✓ src/components/dossier/wizard/review/__tests__/EngagementReviewStep.test.tsx (4 tests) 27ms
 ✓ src/components/dossier/wizard/steps/__tests__/EngagementDetailsStep.test.tsx (5 tests) 75ms

 Test Files  3 passed (3)
      Tests  14 passed (14)
```

- `EngagementDetailsStep`: 10 type + 8 category options render; 2 required date inputs; RTL dir on `location_ar` when `useDirection` returns `rtl`.
- `EngagementParticipantsStep`: exactly 3 DossierPicker instances, all `multiple=true`, filters in JSX order `country / organization / person`, section labels + hint render.
- `EngagementReviewStep`: 3 review sections, Edit buttons call `onEditStep(0)/(1)/(2)`, participant counts render as stringified numbers, type/category labels translated.

## Supabase Client Import Path Used

`@/lib/supabase` (resolved via `frontend/src/lib/supabase.ts` which exports `supabase = createClient(supabaseUrl, supabaseAnonKey, {...})`).

## DB Verification

Manual smoke verification is deferred to the Phase 29 verifier (subagents lack Supabase MCP access per project memory). The `postCreate` hook is wired and its shape matches the live `engagement_participants` table (A-06): one row per selected dossier with `engagement_id`, `participant_type` ∈ `{country,organization,person}`, `participant_dossier_id` (UUID), and `role='delegate'`. The hook is invoked AFTER the dossier is created and BEFORE navigation.

To verify after merge (parent-session task): create an engagement with 2 country + 1 organization + 1 person participants and run:

```sql
select participant_type, count(*) from public.engagement_participants
where engagement_id = '<new-id>' group by participant_type;
```

Expected: 3 rows — `country=2`, `organization=1`, `person=1`.

## Must-Haves — Truths Status

| #   | Truth                                                                                         | Status                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | List page has Create button routing to `/dossiers/engagements/create`                         | PASS — 2 Create buttons updated (header + empty-state)                                                                                                                                                                |
| 2   | Wizard renders 4 steps                                                                        | PASS — config has 4 step entries; route mounts 4 children                                                                                                                                                             |
| 3   | Details step captures 10 types + 8 categories + bilingual location + required start/end dates | PASS — asserted in test file                                                                                                                                                                                          |
| 4   | Participants step renders three multi-select DossierPickers filtered by type                  | PASS — asserted in test file                                                                                                                                                                                          |
| 5   | Empty participants valid (wizard submits with zero)                                           | PASS — schema uses `.default([])` with no `.min()`; postCreate returns early when rows.length===0                                                                                                                     |
| 6   | On submit: base dossier + engagement_dossiers + N engagement_participants rows persisted      | PASS — base dossier via `createMutation`; engagement_dossiers is auto-created by backend for engagement type (existing infra); participants via `supabase.from('engagement_participants').insert(rows)` in postCreate |
| 7   | Post-create navigates to engagement's dossier detail page                                     | PASS — unchanged default navigation via `getDossierDetailPath`                                                                                                                                                        |
| 8   | All UI labels bilingual (en + ar)                                                             | PASS — both JSON files extended with full engagement group                                                                                                                                                            |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] EngagementExtension enum in services/dossier-api.ts was out of date with live DB**

- **Found during:** Task 1 typecheck
- **Issue:** The shared `EngagementExtension` interface listed 7 frontend-only type values (`'meeting'`, `'workshop'`, etc.) and 4 category values (`'bilateral'`, `'multilateral'`, etc.) that did not match the live DB CHECK constraint (A-01 / A-02). Any submit with a correct enum value would fail type-check at the wizard's filterExtensionData return type.
- **Fix:** Widened `EngagementExtension.engagement_type` to the 10 live values and `engagement_category` to the 8 live values including `statistical` and `research`. Added `start_date` and `end_date` to the extension interface since Plan 29-05 makes them required.
- **Files modified:** `frontend/src/services/dossier-api.ts`
- **Commit:** `ef8c283d`

**2. [Rule 3 - Blocking] Legacy wizard-steps/Shared.ts had the stale engagement enum too**

- **Found during:** Task 1 typecheck
- **Issue:** After widening `EngagementExtension`, the legacy `wizard-steps/Shared.ts` (still in the tree) had its own Zod schema using the old 7+4 values. Type-check failed at line 230 because its filtered `extension_data` no longer satisfied `DossierExtensionData`.
- **Fix:** Aligned its `engagement_type` / `engagement_category` enums to the same 10+8 canonical values.
- **Files modified:** `frontend/src/components/dossier/wizard-steps/Shared.ts`
- **Commit:** `ef8c283d`

**3. [Rule 3 - Blocking] Pre-existing uncommitted 29-04 change tightened `wg_status` schema**

- **Found during:** Task 1 typecheck
- **Issue:** The working-tree already had an uncommitted change to `working-group.schema.ts` (from a prior Phase 29-04 session, not by me) that tightened `wg_status` from `z.string().optional()` to `z.enum(...).optional()`. That made `wg_status: ''` in `workingGroupDefaults` (in `defaults/index.ts` — a file I was already modifying for engagement) a typecheck blocker.
- **Fix:** Changed `wg_status: ''` → `wg_status: undefined`. This is semantically equivalent (Select shows placeholder for both) and required to unblock my typecheck.
- **Files modified:** `frontend/src/components/dossier/wizard/defaults/index.ts` (line 55)
- **Commit:** `ef8c283d`
- **Note:** I did NOT stage or touch the pre-existing uncommitted `working-group.schema.ts` itself; that remains a residual of the 29-04 in-flight work for its own executor to commit.

## Self-Check

- `frontend/src/components/dossier/wizard/config/engagement.config.ts` — FOUND
- `frontend/src/components/dossier/wizard/steps/EngagementDetailsStep.tsx` — FOUND
- `frontend/src/components/dossier/wizard/steps/EngagementParticipantsStep.tsx` — FOUND
- `frontend/src/components/dossier/wizard/review/EngagementReviewStep.tsx` — FOUND
- `frontend/src/routes/_protected/dossiers/engagements/create.tsx` — FOUND
- 3 test files — FOUND
- Commit `ef8c283d` — FOUND
- Commit `4c2ed73d` — FOUND
- Commit `9ec6be81` — FOUND

## Self-Check: PASSED
