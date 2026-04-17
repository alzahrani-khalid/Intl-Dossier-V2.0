---
phase: 32-person-native-basic-info
type: spec
created: 2026-04-18
ambiguity_score: 0.173
requirements_locked: 7
dimensions:
  goal: 0.90
  boundary: 0.85
  constraint: 0.75
  acceptance: 0.75
tags: [v5.0, wizard, person, elected-official, identity-fields, schema-migration]
---

# Phase 32: Person-Native Basic Info — Specification

**Created:** 2026-04-18
**Ambiguity score:** 0.173 (gate: ≤ 0.20) ✅
**Requirements:** 7 locked

## Goal

Replace `SharedBasicInfoStep` with a purpose-built `PersonBasicInfoStep` on the Person and Elected Official wizards so the first-step form captures identity-shaped fields (honorific, split first/last name, known-as, photo URL, nationality, DOB, gender, summary) instead of institution-shaped fields (abbreviation, "WHO/SDGS" placeholder, manual status) that leak from the org/country/forum wizards.

## Background

**Current state (staging `zkrcjzdemdmwhearhfgg`):**

- `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` renders 7 fields unconditionally (name_en, name_ar, abbreviation, description_en, description_ar, tags, status, sensitivity_level) for every dossier type.
- `personWizardConfig` and `electedOfficialWizardConfig` both use `SharedBasicInfoStep` as step 1 (Phase 28 + Phase 30).
- The `abbreviation` field's placeholder is `"E.G., WDF, WHO, SDGS"` and helper text is `"Short code or acronym (max 20 characters)"` — org-centric copy that makes no sense on a person dossier (observed in UAT 2026-04-18).
- The `persons` extension table already has `title_en/ar` (job title: "Ambassador", "Minister"), `nationality_country_id`, `email`, `phone`, `biography_en/ar`, `photo_url`, `linkedin_url`, `twitter_url`, `expertise_areas`, `languages`.
- `persons` table does NOT yet have: `honorific_en/ar`, `first_name_en/ar`, `last_name_en/ar`, `known_as_en/ar`, `date_of_birth`, `gender`.
- Existing person dossiers in prod store the full name as a single string in `dossiers.name_en` / `dossiers.name_ar`.
- `supabase/functions/dossiers-create/index.ts` accepts a fixed set of fields (`name_en/ar`, `description_en/ar`, `type`, `status`, `sensitivity_level`, `tags`, `metadata`) and inserts the dossier row, then the client-side `postCreate` hook writes to the extension table.
- Persons list and Elected Officials list pages render `name_en/ar` as the primary label with no honorific and no nationality flag.

**Gap:** the wizard's Step 1 is generic, the data model can't distinguish "Sen." from "Senator" (both end up concatenated in `name_en`), and list pages can't render a typed identity because the typed data doesn't exist.

**Trigger:** UAT for Phase 30 (elected-official wizard) surfaced the leaky copy on Step 1. User confirmed (2026-04-18) the deeper fix is a person-shaped Step 1 with typed identity columns, not label-only edits.

## Requirements

1. **PBI-01 · PersonBasicInfoStep component**: A new React component `PersonBasicInfoStep` exists at `frontend/src/components/dossier/wizard/steps/PersonBasicInfoStep.tsx` and replaces `SharedBasicInfoStep` at step 1 of both `personWizardConfig` and `electedOfficialWizardConfig`.
   - Current: both configs use `SharedBasicInfoStep` at step 1, which unconditionally renders `abbreviation` and a generic `status` field.
   - Target: both configs import and render `PersonBasicInfoStep`; `abbreviation` and manual `status` fields are absent from the person and elected-official wizard flows.
   - Acceptance: `grep -n 'SharedBasicInfoStep' frontend/src/routes/_protected/dossiers/persons/create.tsx frontend/src/routes/_protected/dossiers/elected-officials/create.tsx` returns zero matches. `grep -n 'abbreviation' frontend/src/components/dossier/wizard/steps/PersonBasicInfoStep.tsx` returns zero matches.

2. **PBI-02 · Identity fields rendered**: The new step renders honorific, split first/last name (EN+AR), known-as (EN+AR), and photo_url as identity fields.
   - Current: none of honorific, first_name_en/ar, last_name_en/ar, or known_as_en/ar are rendered anywhere in the wizard. `photo_url` is editable only in PersonDetailsStep (step 2).
   - Target: `PersonBasicInfoStep` renders: honorific dropdown (curated list below + "Other" free-text escape), `first_name_en`, `last_name_en`, `first_name_ar`, `last_name_ar` (all required), `known_as_en`, `known_as_ar` (both optional), `photo_url` (text URL input, optional).
   - Acceptance: Playwright spec opens `/dossiers/elected-officials/create`, confirms `getByLabel(/honorific|اللقب/i)`, `getByLabel(/first name.*english|الاسم الأول.*الإنجليزي/i)`, `getByLabel(/last name.*english|الاسم الأخير.*الإنجليزي/i)`, `getByLabel(/known as|معروف باسم/i)` all resolve to exactly one input each. Honorific dropdown values include at minimum: `H.E., Dr., Prof., Sen., Hon., Rep., Sheikh, Amb., Mr., Ms., Mrs., Eng., Other`.

3. **PBI-03 · Attribution fields rendered**: The new step renders nationality (required DossierPicker filtered to `country`), date of birth (optional), and gender (optional Female/Male).
   - Current: `nationality_country_id` exists on `persons` table but is not editable in the wizard. `date_of_birth` and `gender` columns do not exist.
   - Target: `PersonBasicInfoStep` renders: `nationality_id` as a `DossierPicker` with `filterByDossierType="country"` and `required=true`; `date_of_birth` as an `<input type="date">`, optional; `gender` as a two-option select (`female`, `male`), optional, with no "prefer not to say" option.
   - Acceptance: Zod schema `personBasicInfoSchema` rejects submission when `nationality_id` is empty (returns `{ path: ['nationality_id'], message: 'nationality_required' }`). Schema accepts submission when `date_of_birth` is empty or `gender` is undefined. Schema rejects `gender` values other than `'female'` or `'male'`.

4. **PBI-04 · Non-breaking DB migration + name backfill**: A single forward migration adds the new columns as nullable and backfills `first_name_en/ar` + `last_name_en/ar` from existing `dossiers.name_en/ar` by splitting on the last space.
   - Current: `persons.honorific_en/ar`, `persons.first_name_en/ar`, `persons.last_name_en/ar`, `persons.known_as_en/ar`, `persons.date_of_birth`, `persons.gender` do not exist. Existing person rows have single-string `name_en/ar` only.
   - Target: migration `2026041800000X_person_identity_fields.sql` adds the 11 new columns (nullable), backfills `first_name_en/last_name_en` via `split_part(reverse(name_en), ' ', 1)` reversed + prefix, and analogously for `name_ar`. Migration registers in `supabase_migrations.schema_migrations`. Existing `dossiers.name_en/ar` columns are unchanged (authoritative for search until Phase 33 or later).
   - Acceptance: `supabase db query "SELECT column_name FROM information_schema.columns WHERE table_name = 'persons' AND column_name IN ('honorific_en','honorific_ar','first_name_en','first_name_ar','last_name_en','last_name_ar','known_as_en','known_as_ar','date_of_birth','gender')" --linked` returns exactly 10 rows. `SELECT COUNT(*) FROM persons WHERE first_name_en IS NOT NULL AND last_name_en IS NOT NULL` returns a count equal to `SELECT COUNT(*) FROM persons p JOIN dossiers d ON d.id = p.id WHERE d.name_en LIKE '% %'` (every pre-existing person with a space in their English name has both parts populated).

5. **PBI-05 · Edge Function passes through new fields**: `supabase/functions/dossiers-create/index.ts` accepts the new fields inside `extensionData` and inserts them into the `persons` extension row.
   - Current: the Edge Function inserts the `dossiers` row but only handles a fixed set of fields; new identity columns are ignored silently if posted.
   - Target: the Edge Function's `persons` insert path includes `honorific_en/ar`, `first_name_en/ar`, `last_name_en/ar`, `known_as_en/ar`, `nationality_country_id`, `date_of_birth`, `gender` read from the incoming `extensionData`. Old clients that don't post these fields continue to succeed (additive change; all new columns nullable or have defaults).
   - Acceptance: Playwright spec submits a wizard payload including `honorific_en: 'H.E.'`, `first_name_en: 'Test'`, `last_name_en: 'Person'`, `nationality_id: '<saudi-uuid>'`, `gender: 'male'` and asserts `200 OK`. A `SELECT honorific_en, first_name_en, last_name_en, nationality_country_id, gender FROM persons WHERE id = :created_id` returns the submitted values. A control submission posting only the legacy fields (no new identity fields) returns `200 OK` and creates a person row with new columns NULL.

6. **PBI-06 · List pages render new fields**: Persons and Elected Officials list pages show honorific + last name as the primary label and render a nationality flag/badge when `nationality_country_id` is populated.
   - Current: both lists render `dossiers.name_en` as the primary label with no honorific, no flag.
   - Target: each list row's primary label is rendered as `[honorific_en]? [first_name_en] [last_name_en]` (falling back to `name_en` when first/last are null). Each row includes a badge chip showing the nationality country's ISO-2 flag or country code (via a lookup on `nationality_country_id`).
   - Acceptance: Playwright spec navigates to `/dossiers/persons` after PBI-05's seeded row exists, confirms the row text matches `/H\.E\. Test Person/`, and confirms a badge element with text containing the country code (e.g. `SA`) is visible within the same row. Same assertion on `/dossiers/elected-officials`. Legacy rows (no first/last) still render correctly using `name_en` fallback.

7. **PBI-07 · PersonReviewStep renders new fields**: Step 4 (Review) of the elected-official wizard and Step 3 (Review) of the person wizard both render a new "Identity" card that shows the populated new fields before submit.
   - Current: `PersonReviewStep` renders Basic Information (name_en, name_ar, description_en, description_ar, tags), Person Details, and (conditionally) Office & Term cards.
   - Target: `PersonReviewStep` renders an "Identity" card with honorific, first/last name pairs, known-as pair, nationality (resolved to country dossier name), date of birth (or "—"), gender (localized), photo URL preview. The existing Basic Information card no longer shows `abbreviation` for persons (absent from the wizard data).
   - Acceptance: Unit test on `PersonReviewStep` renders with all 11 new identity values populated and asserts each appears exactly once in the rendered DOM. Clicking "Edit" on the Identity card calls `onEditStep(0)` (returning to Step 1). Review still renders correctly for legacy drafts missing the new fields (fields display "—" placeholder).

## Boundaries

**In scope:**
- New `PersonBasicInfoStep.tsx` component with all identity fields listed above
- Zod schema extension (`personBasicInfoSchema`) with superRefine rules for required nationality + curated honorific values + gender enum
- Rewiring both `personWizardConfig` and `electedOfficialWizardConfig` to use the new step at position 0
- Supabase migration adding 11 columns to `persons` table with backfill
- `dossiers-create` Edge Function update to accept and persist the new fields
- `PersonReviewStep.tsx` extension with the new "Identity" card
- Persons list page update (`/dossiers/persons/index.tsx`) with honorific + last name + nationality badge
- Elected Officials list page update (`/dossiers/elected-officials/index.tsx`) with honorific + last name + nationality badge
- i18n keys (EN + AR) for all new field labels, placeholders, helper text, validation messages
- Vitest unit tests for the new component + schema
- Playwright E2E spec covering the new wizard flow end-to-end (create + read-back + list assertion)

**Out of scope:**
- **Photo uploader / Supabase Storage bucket** — only the existing `photo_url` column is wired as a URL text input. Drag-drop upload, cropping, and storage integration are deferred to a later phase.
- **Renaming or repurposing `persons.title_en/ar`** — these stay as job-title fields in `PersonDetailsStep` (step 2). `honorific_en/ar` is additive, not a rename.
- **Backfilling existing `metadata` JSONB into typed columns** — no data munging beyond the name split.
- **Retiring the institution-shaped `SharedBasicInfoStep`** — other dossier types (country, organization, topic, forum, engagement, working_group) continue to use it unchanged.
- **Changes to `dossiers.name_en/ar`** — these remain the authoritative legal-name column for search until a future phase decides otherwise. They are NOT converted to generated columns; they remain plain text columns that the wizard also populates (first_name + ' ' + last_name on submit).
- **Gender values beyond Female/Male** — no "prefer not to say" option, no other values. The product decision is a two-option select.
- **Required nationality enforcement at DB level** — the column is added nullable so existing rows don't break; required-ness is enforced only at the wizard schema layer. Moving to `NOT NULL` is a later phase once all rows have been backfilled or manually fixed.
- **Changes to Persons and Elected Officials DETAIL pages** — only the LIST pages gain the new display. Detail pages are a separate phase.

## Constraints

- **Non-breaking migration**: every new column must be nullable or have a default; no existing row insertion or update breaks. Forward-only migration — no down-migration SQL required.
- **Edge Function backwards compatibility**: old payloads that don't post the new fields must continue to succeed with a 200 and create a person row with NULL new columns.
- **Bilingual**: every new label, placeholder, helper text, and validation message must exist in both `frontend/src/i18n/en/form-wizard.json` and `frontend/src/i18n/ar/form-wizard.json`. Arabic text inputs use `writingDirection: "rtl"` and `dir={direction}` via `useDirection()`; never `textAlign: "right"` (flipped by `forceRTL`).
- **RTL layout**: all logical Tailwind properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`). No `ml-*`/`mr-*`/`pl-*`/`pr-*`/`text-left`/`text-right`.
- **Touch targets**: all interactive elements (`min-h-11`, `min-w-11`) for 44×44 px minimum.
- **HeroUI v3 + shadcn wrapper pattern**: use existing `frontend/src/components/ui/*` wrappers (not HeroUI primitives directly) to preserve `React.HTMLAttributes` compatibility.
- **No existing RLS policy regressions**: INSERT into `persons` must still succeed under the current `auth.uid()` + clearance policy; no new RLS policies introduced by Phase 32 unless required to allow writes to the new columns (which should not be needed since they're part of the same row).

## Acceptance Criteria

- [ ] `grep -n 'SharedBasicInfoStep' frontend/src/routes/_protected/dossiers/persons/create.tsx frontend/src/routes/_protected/dossiers/elected-officials/create.tsx` returns zero matches (PBI-01)
- [ ] `PersonBasicInfoStep.tsx` exists and renders 11 typed identity inputs + helper copy (PBI-02, PBI-03)
- [ ] Honorific dropdown shows at minimum: H.E., Dr., Prof., Sen., Hon., Rep., Sheikh, Amb., Mr., Ms., Mrs., Eng., Other (PBI-02)
- [ ] Selecting "Other" reveals a free-text input; the value entered is persisted to `honorific_en` / `honorific_ar` (PBI-02)
- [ ] Zod schema rejects submission when `nationality_id` is empty (PBI-03)
- [ ] Zod schema rejects `gender` values outside `{ 'female', 'male' }` (PBI-03)
- [ ] Migration `2026041800000X_person_identity_fields.sql` adds 11 new columns, all nullable, and registers in `supabase_migrations.schema_migrations` on staging (PBI-04)
- [ ] Post-migration, every pre-existing person with a space in `dossiers.name_en` has both `first_name_en` and `last_name_en` populated in `persons` (PBI-04)
- [ ] `dossiers-create` Edge Function submits with new fields → `persons` row has the new columns populated (PBI-05)
- [ ] `dossiers-create` Edge Function submits without new fields → `200 OK`, `persons` row has new columns NULL (PBI-05)
- [ ] Persons list row primary label shows `[honorific] [first] [last]` when populated, falls back to `name_en` otherwise (PBI-06)
- [ ] Elected Officials list row shows nationality flag/code badge when `nationality_country_id` is set (PBI-06)
- [ ] `PersonReviewStep` renders a new "Identity" card with all 11 identity fields or "—" placeholder (PBI-07)
- [ ] Clicking "Edit" on the Identity card calls `onEditStep(0)` (PBI-07)
- [ ] Vitest unit tests for `PersonBasicInfoStep` + `personBasicInfoSchema` all pass (7 tests minimum covering the must-haves above)
- [ ] Playwright E2E spec `tests/e2e/person-identity-fields.spec.ts` passes end-to-end: fill all identity fields → submit → assert 200 → verify row in DB → assert list page renders the new format

## Ambiguity Report

Final scoring (end of Round 2 + single gate question):

| Dimension | Score | Minimum | Status |
|---|---|---|---|
| Goal Clarity | 0.90 | 0.75 | ✓ |
| Boundary Clarity | 0.85 | 0.70 | ✓ |
| Constraint Clarity | 0.75 | 0.65 | ✓ |
| Acceptance Criteria | 0.75 | 0.70 | ✓ |

**Final ambiguity:** 0.173 (gate: ≤ 0.20) ✅

**Residual ambiguity accepted by user (flagged for planner to decide):**
- "Prominently" in PBI-06 — the user declined to tighten this. Planner should choose a concrete rendering (e.g. primary label in the existing list row's heading slot, 16px font-weight-semibold, nationality badge as a shadcn `Badge` next to the name) and document in the plan.

## Downstream consumers

- `/gsd-discuss-phase 32` — will detect this SPEC.md and focus on implementation decisions (component layout, which i18n keys to add under what namespace, edge function code shape, migration SQL shape) rather than re-asking "what/why."
- `gsd-planner` — will constrain plan scope to the 7 requirements above; out-of-scope items (photo uploader, detail pages) are hard-rejected.
- `gsd-verifier` — will use the Acceptance Criteria checkboxes as explicit pass/fail gates.
