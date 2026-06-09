# Dossier Create + Edit Wizard Write-Path Inspection

**Date:** 2026-06-09  
**Scope:** Create hub, per-type creation wizards, Zod/RHF validation, `useCreateDossier` / edge `dossiers-create`, edit/update path (`useUpdateDossier` / `dossiers-update`), RTL, i18n  
**Mode:** Read-only code inspection (no source edits)

---

## Executive summary

**Create (wizard) path is wired end-to-end** and is the canonical write path for all eight hub entries (including elected official as a `person` subtype):

`CreateDossierHub` → `/dossiers/{type_plural}/create` → `useCreateDossierWizard` → `useCreateDossier` → `createDossier()` → `POST /functions/v1/dossiers-create` → `dossiers` + extension table insert (with rollback on extension failure).

**Edit path is not shippable:** there is no edit wizard route, list UI navigates to a non-existent route, and the client `updateDossier()` contract does not match the `dossiers-update` edge function (HTTP method, URL shape, required `version`, field names, sensitivity type, no extension updates).

**Highest-risk create defects:** wizard completion **never runs Zod validation** (only a 2-character name gate), and **draft save does not persist current form values**. Server-side checks in `dossiers-create` partially mitigate invalid extension payloads but do not replace client validation or step gating.

---

## Create flow trace

```
CreateDossierHub (frontend/src/pages/dossiers/CreateDossierHub.tsx)
  └─ Link → /dossiers/{segment}/create  (getDossierRouteSegment)
       └─ Per-type route (e.g. countries/create.tsx)
            └─ useCreateDossierWizard(config)
                 ├─ useFormDraft (localStorage dossier-create-{type})
                 ├─ useForm + zodResolver(config.schema)
                 ├─ handleComplete → CreateDossierRequest + config.filterExtensionData()
                 ├─ optional config.postCreate() (engagement participants)
                 └─ useCreateDossier → POST dossiers-create
                      └─ INSERT dossiers → INSERT extension row → rollback dossier on extension error
```

| Type             | Config                                              | Extension table                                                  | Notes                                   |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| country          | `country.config.ts`                                 | `countries`                                                      | `iso_code_2/3` required at edge         |
| organization     | `organization.config.ts`                            | `organizations`                                                  | `org_type` required at edge             |
| forum            | `forum.config.ts`                                   | `forums`                                                         | `organizing_body` ← dossier picker UUID |
| engagement       | `engagement.config.ts`                              | `engagement_dossiers` + `postCreate` → `engagement_participants` | Required dates/types at edge            |
| topic            | `topic.config.ts`                                   | `topics`                                                         | `theme_category` NOT NULL in DB         |
| working_group    | `working-group.config.ts`                           | `working_groups`                                                 | `parent_body_id` → `dossiers(id)`       |
| person           | `person.config.ts`                                  | `persons`                                                        | Identity fields + `person_subtype`      |
| elected_official | `electedOfficialWizardConfig` in `person.config.ts` | `persons`                                                        | Same table; extra office/term columns   |

---

## Edit flow trace (broken)

```
DossierListPage.handleEditDossier → navigate('/dossiers/$id/edit')  ❌ no route
useUpdateDossier (exported) → updateDossier() → POST dossiers-update { id, ... }  ❌
dossiers-update edge → PUT only, ID from URL path, requires version, summary_* fields  ❌
```

No component under `frontend/src` calls `useUpdateDossier`. There is no edit wizard under `frontend/src/components/dossier/wizard/` or matching route in `routeTree.gen.ts`.

---

## Findings

### CRITICAL

#### 1. Wizard completion bypasses Zod / react-hook-form validation

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` (74–91, 135–137); `frontend/src/components/ui/form-wizard.tsx` (384–397); all `wizard/config/*.config.ts` (no `validate` on steps)                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Why it's a bug**  | `handleComplete` calls `form.getValues()` and submits directly without `form.trigger()`, `form.handleSubmit()`, or `schema.safeParse()`. `canComplete` only requires `name_en` and `name_ar` length ≥ 2. `FormWizard` invokes `onComplete` on button click with no validation hook. No wizard step defines `validate`, so `goNext` also skips field checks. Users can reach Review and submit with empty ISO codes, missing `org_type`, empty engagement enums/dates, missing person nationality/last names, empty `theme_category`, etc. Edge validation catches some extension gaps but not all client-side rules (e.g. person `superRefine`, engagement date ordering, URL formats). |
| **Recommended fix** | In `handleComplete`, run `const valid = await form.trigger()` (or `form.handleSubmit(onValid)()`); abort with `toast.error(t('form-wizard:validation_error'))` if false. Optionally add per-step `validate: () => form.trigger([...stepFields])` in each `WizardConfig.steps` entry. Tighten `canComplete` to reflect last-step schema validity or `form.formState.isValid`.                                                                                                                                                                                                                                                                                                            |

#### 2. Edit/update write path is non-functional end-to-end

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/pages/dossiers/DossierListPage.tsx` (414–417); `frontend/src/services/dossier-api.ts` (512–523); `frontend/src/domains/dossiers/hooks/useDossier.ts` (269–311); `supabase/functions/dossiers-update/index.ts` (24–37, 92–95, 116–120, 196–206)                                                                                                                                                         |
| **Why it's a bug**  | UI navigates to `/dossiers/$id/edit` but no such route exists. `updateDossier` sends `POST` with `{ id, ...request }` in the body; the edge function accepts **only `PUT`**, reads the dossier ID from the **URL path**, requires **`version`** (not in `UpdateDossierRequest`), maps **`summary_en/ar`** (dossiers table uses **`description_en/ar`** per generated types), expects \*\*`sensitivity_level` as `low | medium | high` strings** (create path and DB use numeric 1–4), and does not handle **`extensionData`**. `useUpdateDossier` is never used by any UI. Any future edit screen calling this hook will always fail (405 / 400 / wrong columns). |
| **Recommended fix** | Align client and edge on one contract: either update `dossiers-update` to match `UpdateDossierRequest` (POST or PUT, body `id`, `description_*`, numeric sensitivity, optional `extensionData`, fetch/pass `version`) or change the client to match a revised edge API. Add `/dossiers/$id/edit` (or type-scoped edit routes) with a wizard or form that loads dossier + extension and calls the fixed mutation.     |

---

### HIGH

#### 3. Draft save does not persist react-hook-form state

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` (38–40, 125–127); `frontend/src/components/ui/form-wizard.tsx` (431–591)                                                                                                                                                                                                                                                              |
| **Why it's a bug**  | `useFormDraft` maintains separate `draft` state; `useCreateDossierWizard` never calls `setDraft` with `form.getValues()`. `handleSaveDraft` and auto-save (debounced on `draft` changes) write `draftRef.current` to localStorage, which stays at initial/default/draft-load values while the user edits the form. Manual “Save draft” and auto-save give a false success indicator but lose in-progress work. |
| **Recommended fix** | Subscribe to form changes (`form.watch` or `useEffect` on `form.formState`) and `setDraft(form.getValues())`, or pass `form.getValues()` into `saveDraft` at click time. Ensure `clearDraft` still runs after successful create.                                                                                                                                                                               |

#### 4. Missing edit route breaks list “Edit” action

|                     |                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/pages/dossiers/DossierListPage.tsx` (414–417); `frontend/src/routeTree.gen.ts` (no `/dossiers/$id/edit`)                                           |
| **Why it's a bug**  | `handleEditDossier` navigates to `/dossiers/$id/edit`, which is not registered in TanStack Router. Users get a routing error instead of an edit experience.      |
| **Recommended fix** | Add a typed edit route (or remove/disable Edit until implemented). Prefer type-aware paths consistent with detail routes (`/dossiers/countries/$id/edit`, etc.). |

#### 5. `useCreateDossier` success/error i18n keys use wrong namespace

|                     |                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/domains/dossiers/hooks/useDossier.ts` (217–239)                                                                                                                                                                                                                                                                                                                    |
| **Why it's a bug**  | Hook uses `useTranslation()` (default `translation` namespace) with keys like `dossier.create.success`, `dossier.create.error`, `dossier.create.duplicate`. Messages live in the **`dossier`** namespace as `create.success`, `create.error` (no `create.duplicate` key exists). Users see raw keys or English fallbacks instead of `frontend/src/i18n/ar/dossier.json` strings. |
| **Recommended fix** | Use `useTranslation('dossier')` and `t('create.success')`, `t('create.error')`, and add `create.duplicate` to en/ar `dossier.json` if needed—or use `t('dossier:create.success')` with explicit namespace.                                                                                                                                                                       |

#### 6. Double success toast on wizard create

|                     |                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/domains/dossiers/hooks/useDossier.ts` (229); `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` (110)         |
| **Why it's a bug**  | Both `useCreateDossier.onSuccess` and `handleComplete` show a success toast after `mutateAsync` resolves. Users see two notifications per create. |
| **Recommended fix** | Toast in one layer only (prefer hook **or** wizard, not both).                                                                                    |

---

### MEDIUM

#### 7. Person identity validation messages missing i18n namespace

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/components/dossier/wizard/schemas/person.schema.ts` (59–97); `frontend/src/i18n/en/form-wizard.json` (279–283); `frontend/src/components/ui/form.tsx` (145–151)                                                                                                                                                                                                                                  |
| **Why it's a bug**  | `superRefine` emits bare keys `last_name_required`, `nationality_required`, `honorific_other_required`. Translations exist at `wizard.person_identity.validation.*` in `form-wizard.json`. `FormMessage` calls `t(rawBody)` on the default namespace, so Arabic users see English key literals instead of Arabic strings. Elected-official messages correctly use `form-wizard:elected_official.validation.*`. |
| **Recommended fix** | Change person schema messages to `form-wizard:wizard.person_identity.validation.last_name_required` (and matching keys for nationality / honorific_other).                                                                                                                                                                                                                                                     |

#### 8. Base dossier schema uses hardcoded English validation copy

|                     |                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Files**           | `frontend/src/components/dossier/wizard/schemas/base.schema.ts` (4–8)                                                                                                                                                    |
| **Why it's a bug**  | `name_en`, `name_ar`, and `abbreviation` errors are literal English sentences. When validation does run (e.g. if fixed), Arabic UI still shows English errors. Other schemas use `validation:*` or `form-wizard:*` keys. |
| **Recommended fix** | Replace with keys in `validation.json` or `form-wizard.json` (e.g. `validation:minLength`, `validation:abbreviationMax`) and add Arabic entries.                                                                         |

#### 9. Person wizard tags field type mismatch

|                     |                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/components/dossier/wizard/steps/PersonBasicInfoStep.tsx` (479–497); `frontend/src/components/dossier/wizard/schemas/base.schema.ts` (15); `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` (207–216)                                                                                  |
| **Why it's a bug**  | Schema defines `tags` as `string[]`. `SharedBasicInfoStep` correctly splits comma input into an array. `PersonBasicInfoStep` spreads `{...field}` into a text `Input` with `value` coerced as `string`, so typing produces a **string** in form state, not `string[]`. Submit can send malformed `tags` to the API. |
| **Recommended fix** | Reuse the same comma-split `onChange` pattern as `SharedBasicInfoStep` (or a shared `TagsInput` helper).                                                                                                                                                                                                            |

#### 10. Engagement `postCreate` participant insert fails silently

|                     |                                                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/components/dossier/wizard/config/engagement.config.ts` (73–82); `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` (101–106)                                                  |
| **Why it's a bug**  | After the dossier and `engagement_dossiers` row exist, participant rows are inserted client-side. On failure, only `console.warn` runs; the user sees success and an engagement dossier **without** participants. |
| **Recommended fix** | Surface `toast.warning` with i18n key; optionally return partial-success state or offer retry. Document that dossier is created even if participants fail.                                                        |

#### 11. Legacy parallel create paths (unreachable or divergent)

|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Files**           | `frontend/src/pages/forums/ForumsPage.tsx` + `useCreateForum` in `hooks/useForums.ts`; `frontend/src/pages/WorkingGroupsPage.tsx` + `useCreateWorkingGroup`; `frontend/src/pages/persons/PersonCreatePage.tsx` + `useCreatePerson`; route `frontend/src/routes/_protected/persons/create.tsx`                                                                                                                                                                                              |
| **Why it's a bug**  | `ForumsPage` / `WorkingGroupsPage` are not mounted by any route (forums redirect to `/dossiers/forums`). `useCreateForum` / `useCreateWorkingGroup` insert via direct Supabase client, bypassing `dossiers-create`, owner assignment, and unified validation. `/persons/create` still exposes a legacy person form with a different schema (email, phone, `importance_level`) vs the wizard `persons` row shape. Maintainers can fix the wrong path; behavior diverges from wizard writes. |
| **Recommended fix** | Remove or redirect legacy pages to wizard routes; deprecate direct-insert hooks or make them thin wrappers around `createDossier`.                                                                                                                                                                                                                                                                                                                                                         |

---

### LOW

#### 12. Dead `elected-official.schema.ts`

|                     |                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/components/dossier/wizard/schemas/elected-official.schema.ts`; `schemas/index.ts` (9–12)                                                                             |
| **Why it's a bug**  | Elected officials use `personSchema` + `electedOfficialWizardConfig`. The standalone schema is only referenced in unit tests, not in runtime wizard config—duplicate dead surface. |
| **Recommended fix** | Delete or merge into `person.schema.ts`; keep tests on `personSchema` elected branch.                                                                                              |

#### 13. Forum `filterExtensionData` targets `organizing_body` not `organizing_body_id`

|                     |                                                                                                                                                                                                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**           | `frontend/src/components/dossier/wizard/config/forum.config.ts` (30–31); `supabase/migrations/20260416120001_phase29_ensure_forums_organizing_body.sql`                                                                                                                                                                                                        |
| **Why it's a bug**  | Form field is `organizing_body_id` (dossier UUID). Insert writes `organizing_body` (FK → `organizations.id`). Under CTI, organization dossier id equals `organizations.id`, so this often works, but `organizing_body_id` (FK → `dossiers`) is the column aligned with the picker and is left null—risk for queries/views that read `organizing_body_id` only. |
| **Recommended fix** | Map to `organizing_body_id` (and optionally backfill `organizing_body` for legacy readers) in `filterExtensionData`.                                                                                                                                                                                                                                           |

---

## Verified clean (no defect filed)

| Area                                      | Result                                                                                                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RTL in wizard tree**                    | No `ml-*` / `mr-*` / `pl-*` / `pr-*` / `text-left` / `text-right` under `wizard/`; `StepGuidanceBanner` documents logical properties; person AR inputs use `dir="rtl"`. |
| **Wizard step titles / guidance i18n**    | Per-type `*-wizard` namespaces registered in `frontend/src/i18n/index.ts` (478–486); step titles use `form-wizard:steps.*` keys present in en/ar `form-wizard.json`.    |
| **Create edge extension mapping**         | `dossiers-create` maps types to correct extension tables and rolls back base row on extension insert failure (`supabase/functions/dossiers-create/index.ts` 296–348).   |
| **Engagement enum alignment**             | `engagement.schema.ts` values match DB CHECK constraints (per schema comments and `engagement_dossiers` types).                                                         |
| **Person name composition**               | `PersonBasicInfoStep` syncs `name_en` / `name_ar` from first/last for top-level dossier insert (88–100).                                                                |
| **Working group parent body**             | `parent_body_id` FK → `dossiers(id)`; picker filters organization dossiers—consistent with CTI.                                                                         |
| **Elected official office DB constraint** | At least one of `office_name_en` / `office_name_ar` enforced in DB (`20260417000001_relax_elected_official_office_constraint.sql`).                                     |

---

## Partial mitigation (not a fix)

`dossiers-create` validates required extension fields for country, organization, and engagement (`TYPES_WITH_REQUIRED_EXTENSION` in `supabase/functions/dossiers-create/index.ts` 21–25, 152–161). That reduces orphaned/invalid extension rows but does **not** enforce person identity rules, topic `theme_category`, forum UUID shape at picker, or client-only refinements—and does not help edit.

---

## Recommended priority order

1. **Gate submit on `form.trigger()`** (CRITICAL validation gap).
2. **Fix draft persistence** (HIGH data loss on save).
3. **Design and wire edit route + aligned `dossiers-update`** (CRITICAL for edit workflow).
4. **Person validation i18n + tags input** (MEDIUM Arabic UX + data shape).
5. **Toast/i18n cleanup on create** (HIGH/MEDIUM polish).
6. **Retire legacy create pages/hooks** (MEDIUM maintenance).

---

_Inspection performed against repository state on 2026-06-09. No application source files were modified._
