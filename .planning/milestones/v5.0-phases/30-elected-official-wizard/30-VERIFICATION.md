---
phase: 30-elected-official-wizard
verified: 2026-04-17T00:00:00Z
status: human_needed
score: 11/12 must-haves verified
overrides_applied: 0
human_verification:
  - test: 'Run Playwright E2E suite against a live dev server + staging Supabase'
    expected: 'All 3 tests pass: EN-only submit, AR-only submit, dual-list appearance'
    why_human: 'E2E specs require running dev server and staging DB — cannot verify statically'
  - test: 'Confirm DB migration 20260417000001 was actually applied to staging (zkrcjzdemdmwhearhfgg)'
    expected: "supabase migration list --linked shows 20260417000001 in Remote column; pg_constraint query returns def containing 'office_name_ar IS NOT NULL'"
    why_human: 'Cannot query the linked remote Supabase instance from this session without credentials/CLI context'
---

# Phase 30: Elected Official Wizard Verification Report

**Phase Goal:** Add an Elected Official wizard that creates person dossiers with person_subtype='elected_official', capturing office/term fields via a dedicated 4-step form, with a relaxed DB constraint allowing Arabic-only office names.
**Verified:** 2026-04-17
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                   | Status          | Evidence                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | DB constraint relaxed: OR logic for office_name_en/ar                                   | VERIFIED (file) | `supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql` lines 24-29: `OR office_name_en IS NOT NULL OR office_name_ar IS NOT NULL`                                                           |
| 2   | DB migration applied to staging                                                         | ? HUMAN         | File exists and is correct; remote application requires human CLI confirmation                                                                                                                                         |
| 3   | personSchema.superRefine rejects elected_official with both office names empty          | VERIFIED        | `person.schema.ts` lines 33-43: custom issue on `office_name_en` and `office_name_ar` paths with message key `office_name_required`                                                                                    |
| 4   | personSchema.superRefine rejects when country_id empty for elected_official             | VERIFIED        | `person.schema.ts` lines 46-53: custom issue on `country_id` path                                                                                                                                                      |
| 5   | personSchema.superRefine rejects when term_start empty for elected_official             | VERIFIED        | `person.schema.ts` lines 55-62: custom issue on `term_start` path                                                                                                                                                      |
| 6   | personSchema.superRefine skips rules for standard persons                               | VERIFIED        | `person.schema.ts` line 28: early return `if (data.person_subtype !== 'elected_official') return`                                                                                                                      |
| 7   | electedOfficialWizardConfig exports 4 steps: basic, person-details, office-term, review | VERIFIED        | `person.config.ts` lines 49-53: `steps: [basicStep, personDetailsStep, officeTermStep, reviewStep]`                                                                                                                    |
| 8   | getElectedOfficialDefaults() returns correct elected_official defaults                  | VERIFIED        | `defaults/index.ts` lines 47-67 + 121-127: const with all ELOF-02 fields as empty strings, `person_subtype: 'elected_official'`, `is_current_term: true`; exported helper returns it                                   |
| 9   | OfficeTermStep renders 4 sections, 2 DossierPickers, bilingual grids, date inputs       | VERIFIED        | `OfficeTermStep.tsx` 293 lines: 4 `<section>` elements with `aria-labelledby`, 2 DossierPicker instances (`filterByDossierType="country"` + `"organization"`), 4 bilingual grids, 2 `type="date"` inputs, all min-h-11 |
| 10  | /dossiers/elected-officials/create route exists and wires all 4 steps                   | VERIFIED        | `create.tsx` lines 25-51: `createFileRoute('/_protected/dossiers/elected-officials/create')`, all 4 step components present, `electedOfficialWizardConfig` used                                                        |
| 11  | Elected Officials list Create button links to /dossiers/elected-officials/create        | VERIFIED        | `index.tsx` line 39: `<Link to="/dossiers/elected-officials/create">` — old `/dossiers/create` gone                                                                                                                    |
| 12  | PersonReviewStep conditionally renders Office & Term card for elected_official          | VERIFIED        | `PersonReviewStep.tsx` lines 122-161: `{values.person_subtype === 'elected_official' && (<ReviewSection ...>)}` with `onEditStep(2)` and all 10 fields                                                                 |

**Score:** 11/12 truths verified (1 deferred to human: staging DB confirmation)

---

## Required Artifacts

| Artifact                                                                                          | Expected                                            | Status          | Details                                                                                                                              |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase/migrations/20260417000001_relax_elected_official_office_constraint.sql`                 | Relaxed CHECK constraint                            | VERIFIED        | 33 lines; idempotent DO $$ block; OR logic correct                                                                                   |
| `frontend/src/components/dossier/wizard/schemas/person.schema.ts`                                 | Extended schema + superRefine                       | VERIFIED        | 77 lines; 11 new optional fields; 4-rule superRefine block                                                                           |
| `frontend/src/components/dossier/wizard/config/person.config.ts`                                  | Both wizard configs exported                        | VERIFIED        | 94 lines; `personWizardConfig` (3 steps) + `electedOfficialWizardConfig` (4 steps)                                                   |
| `frontend/src/components/dossier/wizard/defaults/index.ts`                                        | electedOfficialDefaults + helper                    | VERIFIED        | `electedOfficialDefaults` const lines 47-67; `getElectedOfficialDefaults()` lines 121-127; DossierType map unchanged (7 keys)        |
| `frontend/src/components/dossier/wizard/steps/OfficeTermStep.tsx`                                 | 4-section step component                            | VERIFIED        | 293 lines; exports `OfficeTermStep`; all 10 form field names present                                                                 |
| `frontend/src/routes/_protected/dossiers/elected-officials/create.tsx`                            | New wizard route                                    | VERIFIED        | 51 lines; correct createFileRoute path; 4 steps composed                                                                             |
| `frontend/src/routes/_protected/dossiers/elected-officials/index.tsx`                             | Updated Create button link                          | VERIFIED        | Line 39: correct `/dossiers/elected-officials/create` target                                                                         |
| `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx`                              | Conditional Office & Term section                   | VERIFIED        | Lines 122-161; conditional on `person_subtype === 'elected_official'`; `onEditStep(2)` correct                                       |
| `frontend/src/i18n/en/form-wizard.json`                                                           | `elected_official.*` namespace + `steps.officeTerm` | VERIFIED        | `"elected_official"` key present (1 match); `"officeTerm"` key present; `"office_name_required"` + `"country_required"` keys present |
| `frontend/src/i18n/ar/form-wizard.json`                                                           | Arabic mirror of EN namespace                       | VERIFIED        | `"elected_official"` key present; `"officeTerm"` key present; `"term_end_after_start"` in Arabic present                             |
| `frontend/src/components/dossier/wizard/steps/__tests__/OfficeTermStep.test.tsx`                  | Unit tests for step component                       | VERIFIED        | 184 lines; 7 `it()` tests covering sections, DossierPickers, field names, date types, DOM order, required markers                    |
| `frontend/src/components/dossier/wizard/schemas/__tests__/person.schema.elected-official.test.ts` | Schema superRefine unit tests                       | VERIFIED        | 151 lines; 8 `it()` tests covering all 4 validation rules + standard subtype unaffected + same-day boundary                          |
| `tests/e2e/elected-official-create.spec.ts`                                                       | E2E Playwright spec                                 | VERIFIED (file) | 165 lines; 3 tests; uses `support/fixtures` (matches Phase 29 conventions); covers EN-only, AR-only, dual-list                       |

---

## Key Link Verification

| From                                     | To                                         | Via                                                      | Status       | Details                              |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------- | ------------ | ------------------------------------ |
| `OfficeTermStep.tsx`                     | `DossierPicker`                            | `import from '@/components/work-creation/DossierPicker'` | WIRED        | Line 26: exact canonical import path |
| `OfficeTermStep.tsx`                     | `PersonFormData`                           | `import from '../schemas/person.schema'`                 | WIRED        | Line 28                              |
| `create.tsx`                             | `electedOfficialWizardConfig`              | named import from `person.config`                        | WIRED        | Line 22                              |
| `create.tsx`                             | `OfficeTermStep`                           | named import + JSX usage                                 | WIRED        | Lines 20, 46                         |
| `index.tsx`                              | `/dossiers/elected-officials/create`       | `<Link to="...">`                                        | WIRED        | Line 39                              |
| `PersonReviewStep.tsx`                   | step index 2                               | `onEditStep(2)`                                          | WIRED        | Line 124                             |
| `migration SQL`                          | `persons_elected_official_requires_office` | DROP + ADD CONSTRAINT                                    | WIRED (file) | Lines 20, 24-29                      |
| `OfficeTermStep.test.tsx`                | `OfficeTermStep`                           | `vi.mock` + direct import                                | WIRED        | Lines 61-75, 79                      |
| `person.schema.elected-official.test.ts` | `personSchema`                             | `personSchema.safeParse()`                               | WIRED        | Line 12, throughout                  |

---

## Data-Flow Trace (Level 4)

| Artifact               | Data Variable               | Source                                                | Produces Real Data                                       | Status  |
| ---------------------- | --------------------------- | ----------------------------------------------------- | -------------------------------------------------------- | ------- |
| `OfficeTermStep.tsx`   | `form.control` (RHF fields) | `useCreateDossierWizard` hook upstream                | Yes — RHF form state driven by user input                | FLOWING |
| `PersonReviewStep.tsx` | `values` via `form.watch()` | Live RHF form state                                   | Yes — `watch()` is live, never stale                     | FLOWING |
| `create.tsx`           | `wizard`                    | `useCreateDossierWizard(electedOfficialWizardConfig)` | Yes — config seeds defaults, submits to persons endpoint | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED for migration SQL (no runnable entry point). Static code verification used instead.

| Behavior                             | Check                                                               | Result                  | Status |
| ------------------------------------ | ------------------------------------------------------------------- | ----------------------- | ------ |
| Migration file has OR logic          | `grep "office_name_ar IS NOT NULL" migration.sql`                   | Found at line 28        | PASS   |
| Schema has superRefine               | `grep -c "superRefine" person.schema.ts`                            | 1 match                 | PASS   |
| Config exports 4-step config         | `grep "electedOfficialWizardConfig" person.config.ts`               | Found, 4 steps in array | PASS   |
| Route imports OfficeTermStep         | `grep "OfficeTermStep" create.tsx`                                  | Found lines 20, 46      | PASS   |
| List page Create button correct      | `grep 'to="/dossiers/elected-officials/create"' index.tsx`          | Line 39                 | PASS   |
| Review conditional correct           | `grep "person_subtype === 'elected_official'" PersonReviewStep.tsx` | Line 123                | PASS   |
| No textAlign:right in OfficeTermStep | grep scan                                                           | 0 matches               | PASS   |
| E2E spec covers AR-only submit       | `grep "office name.*arabic" e2e spec`                               | Line 97                 | PASS   |

---

## Requirements Coverage

| Requirement | Source Plan  | Description                                                                                             | Status           | Evidence                                                                                            |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| ELOF-01     | 30-01, 30-03 | DB constraint relaxed; wizard route exists and navigable                                                | SATISFIED        | Migration SQL with OR logic; `create.tsx` route registered                                          |
| ELOF-02     | 30-02        | OfficeTermStep captures all office/term fields (office name, country, org, district, party, term dates) | SATISFIED        | `OfficeTermStep.tsx` 293 lines with all 10 fields, 4 sections, 2 DossierPickers                     |
| ELOF-03     | 30-01, 30-03 | Elected official stored as person_subtype='elected_official'; appears in persons list                   | SATISFIED (code) | `electedOfficialWizardConfig` uses `type: 'person'`; E2E test 3 checks both lists (needs human run) |
| ELOF-04     | 30-03, 30-04 | List page Create button routes to /create; tests cover all requirements                                 | SATISFIED        | `index.tsx` line 39 confirmed; 3 test files with 18 total tests                                     |

---

## Quality Checks

- RTL compliance: No `textAlign: "right"` in `OfficeTermStep.tsx` (0 matches). All headings use `text-start`. Arabic inputs carry `dir={direction}`. Logical margin/padding classes (`ms-1`) used throughout.
- Touch targets: `min-h-11` on all `<Input>` elements in OfficeTermStep. Create button in index.tsx has `min-h-11 min-w-11`.
- i18n parity: Both EN and AR files confirmed to have `elected_official` namespace, `officeTerm` step key, and all validation message keys including `office_name_required`, `country_required`, `term_end_after_start`.
- EN field first in JSX: All bilingual grids in OfficeTermStep render EN field before AR field (RTL Rule 1 satisfied). Unit test `'renders EN field before AR field in each bilingual pair (DOM order)'` codifies this.
- No reverse() calls: Not found in any Phase 30 file.
- Standard person wizard unaffected: `personWizardConfig` still has 3 steps; `personSchema.superRefine` early-returns for `person_subtype !== 'elected_official'`.
- Test count: 7 OfficeTermStep component tests + 8 schema superRefine tests + 3 E2E tests = 18 total.
- `getDefaultsForType` DossierType map: 7 keys only (country, organization, topic, person, forum, working_group, engagement) — `elected_official` correctly NOT added as a key.

---

## Anti-Patterns Found

| File       | Pattern | Severity | Impact |
| ---------- | ------- | -------- | ------ |
| None found | —       | —        | —      |

No TODO/FIXME/placeholder comments found. No empty implementations. No hardcoded stubs. All fields wire to real RHF state.

---

## Human Verification Required

### 1. Staging DB Migration Applied

**Test:** Run `supabase migration list --linked` from the project root. Then run: `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'persons_elected_official_requires_office';` against the staging DB.
**Expected:** `20260417000001` appears in the Remote column; constraint def contains `office_name_ar IS NOT NULL`.
**Why human:** Cannot query linked Supabase remote without CLI session and auth token.

### 2. Playwright E2E Suite

**Test:** With dev server running (`pnpm dev`) and `.env.test` populated: `pnpm exec playwright test tests/e2e/elected-official-create.spec.ts`
**Expected:** 3 tests pass — EN-only submit redirects to detail page, AR-only submit accepted (D-19 relaxed constraint), created record visible in both `/dossiers/elected-officials` and `/dossiers/persons` lists.
**Why human:** E2E tests require running dev server + live staging Supabase. Cannot execute statically.

---

## Gaps Summary

No gaps blocking goal achievement. All artifacts exist, are substantive, and are correctly wired. The one open item is operational confirmation that the migration was applied to staging — the file content is correct and idempotent. If the migration was applied as documented in the SUMMARYs, this phase is fully complete.

---

_Verified: 2026-04-17_
_Verifier: Claude (gsd-verifier)_

## Addendum — Staging DB State (orchestrator-verified 2026-04-17)

During Wave 1 merge, the orchestrator queried staging (project `zkrcjzdemdmwhearhfgg`) directly and confirmed:

**Constraint relaxed:**

```
CHECK (((person_subtype <> 'elected_official'::text)
  OR (office_name_en IS NOT NULL)
  OR (office_name_ar IS NOT NULL)))
```

**Migration registered:**

```
SELECT version FROM supabase_migrations.schema_migrations WHERE version = '20260417000001';
→ { version: "20260417000001" }
```

Human verification item #1 from the verifier report is therefore already satisfied.

## Pending UAT

- Playwright E2E: `pnpm exec playwright test tests/e2e/elected-official-create.spec.ts` — requires live dev server, deferred to UAT (matches prior phase pattern).

**Final Verdict:** PASS (with E2E run queued for UAT)
