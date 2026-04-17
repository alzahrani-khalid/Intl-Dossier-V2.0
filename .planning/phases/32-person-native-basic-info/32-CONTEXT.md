# Phase 32: Person-Native Basic Info - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace `SharedBasicInfoStep` with a purpose-built `PersonBasicInfoStep` as step 1 of the Person and Elected Official wizards. The new step captures identity-shaped fields (honorific, split first/last name EN+AR, known-as EN+AR, photo URL, nationality, DOB, gender) instead of institution-shaped fields (abbreviation, org-centric status copy). A non-breaking migration adds 11 typed columns to `persons` and backfills name parts from `dossiers.name_en/ar`. The `dossiers-create` Edge Function is extended additively to pass through the new fields. Persons and Elected Officials list pages render honorific + nationality badge. `PersonReviewStep` gains an "Identity" card.

Scope is bounded to the 7 requirements locked by `32-SPEC.md`. Photo upload/Storage integration, detail-page redesigns, gender values beyond Female/Male, and `dossiers.name_en/ar` becoming a generated column are explicitly out of scope per SPEC Boundaries.

</domain>

<spec_lock>

## Requirements (locked via SPEC.md)

**7 requirements are locked.** See `32-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `32-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**

- New `PersonBasicInfoStep.tsx` component with all identity fields
- Zod schema extension (`personBasicInfoSchema`) with superRefine rules for required nationality + curated honorific values + gender enum
- Rewiring both `personWizardConfig` and `electedOfficialWizardConfig` to use the new step at position 0
- Supabase migration adding 11 columns to `persons` table with backfill
- `dossiers-create` Edge Function update to accept and persist the new fields
- `PersonReviewStep.tsx` extension with the new "Identity" card
- Persons list page update with honorific + last name + nationality badge
- Elected Officials list page update with honorific + last name + nationality badge
- i18n keys (EN + AR) for all new field labels, placeholders, helper text, validation messages
- Vitest unit tests for the new component + schema
- Playwright E2E spec covering the new wizard flow end-to-end

**Out of scope (from SPEC.md):**

- Photo uploader / Supabase Storage bucket (only the existing `photo_url` text URL input is wired)
- Renaming or repurposing `persons.title_en/ar` (job-title columns stay untouched)
- Backfilling existing `metadata` JSONB into typed columns
- Retiring `SharedBasicInfoStep` (other dossier types keep using it)
- Converting `dossiers.name_en/ar` to generated columns (stays as plain text; wizard populates it)
- Gender values beyond Female/Male (no "prefer not to say" option)
- Required nationality enforcement at DB level (nullable column; enforced at schema layer only)
- Changes to Persons / Elected Officials DETAIL pages (list pages only)

</spec_lock>

<decisions>
## Implementation Decisions

### Honorific UX (Area 1)

- **D-01:** Honorific uses the plain shadcn `Select` component (re-using `@/components/ui/select` already imported in `SharedBasicInfoStep` for status/sensitivity). No Autocomplete, no radio group. Keeps visual consistency with the existing wizard step pattern.
- **D-02:** Curated values in the dropdown (in this display order): `H.E., Dr., Prof., Sen., Hon., Rep., Sheikh, Amb., Mr., Ms., Mrs., Eng., Other`. "Other" is the last option.
- **D-03:** When "Other" is selected, the dropdown reveals two text inputs below it labeled "Other (English)" and "Other (العربية)". Both are required when "Other" is active. The EN input writes to `honorific_en`, the AR input writes to `honorific_ar`. Side-by-side in the same 2-column grid pattern used elsewhere in the step.
- **D-04:** For CURATED values, the component maintains a hardcoded bilingual map that resolves the selected label to its Arabic equivalent on submit. Example entries:
  ```
  H.E.   -> honorific_en='H.E.',   honorific_ar='سعادة'
  Dr.    -> honorific_en='Dr.',    honorific_ar='د.'
  Prof.  -> honorific_en='Prof.',  honorific_ar='أ.د.'
  Sen.   -> honorific_en='Sen.',   honorific_ar='سيناتور'
  Hon.   -> honorific_en='Hon.',   honorific_ar='معالي'
  Rep.   -> honorific_en='Rep.',   honorific_ar='ممثل'
  Sheikh -> honorific_en='Sheikh', honorific_ar='الشيخ'
  Amb.   -> honorific_en='Amb.',   honorific_ar='سفير'
  Mr.    -> honorific_en='Mr.',    honorific_ar='السيد'
  Ms.    -> honorific_en='Ms.',    honorific_ar='السيدة'
  Mrs.   -> honorific_en='Mrs.',   honorific_ar='السيدة'
  Eng.   -> honorific_en='Eng.',   honorific_ar='م.'
  ```
  Planner may refine the exact AR translations but the pattern (static map in component, written at submit) is fixed.
- **D-05:** Honorific is optional (both curated selection and 'Other' inputs); an unselected honorific writes NULL to both columns.

### Name Split + name_en/ar Sync (Area 2)

- **D-06:** Migration backfill rule for multi-word names: **split on the LAST space**. `first_name = substring up to last space`, `last_name = substring after last space`. Examples: `"Mary Jane Smith"` → first=`"Mary Jane"`, last=`"Smith"`. `"Jean-Paul Sartre"` → first=`"Jean-Paul"`, last=`"Sartre"`. SQL uses `split_part(reverse(name), ' ', 1)` reversed for last, and the remainder for first.
- **D-07:** Single-word name backfill: `last_name = full string, first_name = NULL`. Example: `"Madonna"` → first=NULL, last=`"Madonna"`. Same rule for Arabic (`"زيد"` → first=NULL, last=`"زيد"`). The list page's PBI-06 fallback rule (`name_en` when first/last null) keeps legacy rows rendering correctly; single-word rows that do get backfilled render as just the last name.
- **D-08:** Wizard submit composes `dossiers.name_en/ar` from first + last. Composition happens in `person.config.ts` → `filterExtensionData` (or a sibling transform applied before the `dossiers-create` POST). Rule:
  - If `first_name_en` populated: `name_en = first_name_en + ' ' + last_name_en`
  - If only `last_name_en` populated (single-word): `name_en = last_name_en`
  - Same rule for AR (`name_ar` from `first_name_ar` + `last_name_ar`).
- **D-09:** The composed `name_en/ar` does **NOT** include the honorific. `dossiers.name_en` stays as a legal-name string ("John Smith"), not a display string ("H.E. John Smith"). Honorific is applied at display time only (list pages, review card, detail header). This keeps search/indexing predictable.
- **D-10:** Migration is non-breaking: all 11 new columns are nullable. No DB-level CHECK requiring nationality. Required-ness for nationality is enforced only at the Zod `personBasicInfoSchema` layer. This matches the Phase 30 pattern of relaxing DB constraints to allow partial data (D-19 of 30-CONTEXT).

### List Page Rendering (Area 3)

- **D-11:** Nationality badge renders as **flag emoji + ISO-2 code** with a space separator, e.g., `🇸🇦 SA`. Both segments come from the country dossier's `country_iso_2` column resolved via the `nationality_country_id` FK. Flag emoji derived from the ISO-2 code (two regional-indicator codepoints); no image asset needed.
- **D-12:** Badge placement: **inline, after the name** in the row's primary label slot. Format: `[honorific]? [first] [last] [badge]`. In RTL, the flex row's `flex-direction: row` combined with `forceRTL` renders badge at visual left-of-name, which matches Arabic reading order (qualifier follows subject).
- **D-13:** Component: **shadcn `Badge`** from `@/components/ui/badge` (the re-export of `heroui-chip.tsx`). Variant: `secondary` or `outline` (planner picks whichever reads cleaner against the list table's row background). Props: `className="text-xs"` for density.
- **D-14:** When `nationality_country_id` IS NULL on a row, render **nothing** — omit the badge entirely. No `—` placeholder, no "Unknown" label. Keeps legacy rows visually clean.
- **D-15:** Label composition rule (shared between Persons and Elected Officials lists):
  - If `first_name_en` and `last_name_en` both populated: `[honorific_en ]? first_name_en last_name_en`
  - Else if `last_name_en` populated (single-word case): `[honorific_en ]? last_name_en`
  - Else: fall back to `dossiers.name_en` (legacy rows)
  - Honorific prepended only when `honorific_en` is non-null.
  - Same logic for AR rendering using AR columns.
- **D-16:** Fetching the country ISO-2 code for the badge requires joining through `nationality_country_id` → `dossiers (type='country')` → `countries` extension table. Planner decides the join mechanism: extend the existing persons-list query with a left join, or denormalize `nationality_iso_2` onto the persons extension table at write-time. Recommendation: join (no denormalization) since the list queries already return dossier fields.

### Review Card Layout (Area 4)

- **D-17:** For `person_subtype in {'standard', 'elected_official'}`, the existing "Basic Information" card is **replaced** by a new "Identity" card. The Basic Info card is NOT rendered at all for persons.
- **D-18:** The Identity card contains two sub-sections:
  1. **Identity** (top) — honorific, first/last name pairs (EN + AR), known-as pair (EN + AR), nationality (resolved to country dossier's name with flag), date of birth (or `—`), gender (localized label), photo URL preview (small thumbnail if valid URL, else text).
  2. **Biographical summary** (below a subtle divider) — description_en, description_ar, tags.
- **D-19:** Card order in Review: **Identity first**, then PersonDetails (title + biography + socials + expertise + languages), then OfficeTerm (elected_official only), then the submit CTA. Matches wizard step order.
- **D-20:** The Identity card's "Edit" button calls `onEditStep(0)` (jumps back to Step 1). Per PBI-07 acceptance.
- **D-21:** Legacy draft compatibility: if any Identity field is missing (e.g., legacy draft restored from localStorage), render `—` placeholder rather than omitting the row. Photo URL shows "—" text, not a broken image.

### PersonBasicInfoStep Internal Layout (Area 4 cont'd)

- **D-22:** Step 1 keeps `description_en/ar` and `tags` inputs below the identity fields, preserving the SharedBasicInfoStep capture pattern. A subtle divider (`<hr>` or spacing) separates the Identity zone from the Description/Tags zone.
- **D-23:** Classification section: keep as a collapsible `<details>` at the bottom of Step 1 (same pattern as SharedBasicInfoStep line 220), but render **only** `sensitivity_level`. The manual `status` field is dropped from the person wizard flows per PBI-01 — `status='active'` is set by defaults in `person.config.ts` (`defaultValues`) or the Edge Function.
- **D-24:** Field order inside PersonBasicInfoStep (top to bottom):
  1. AI Field Assist (if applicable — re-use existing block)
  2. Honorific (Select + "Other" reveal)
  3. Bilingual name pair (EN + AR) in 2-column grid — for BOTH first_name and last_name
  4. Known-as pair (EN + AR) in 2-column grid, optional
  5. Photo URL (single text input, full width)
  6. Nationality (DossierPicker filtered to `country`, required)
  7. DOB + Gender in 2-column grid (both optional)
  8. Divider
  9. Description pair (EN + AR) in 2-column grid, optional
  10. Tags (single row)
  11. Collapsible "Classification" with sensitivity_level only

### Schema + Config Extension

- **D-25:** `person.schema.ts` is **extended in place** with the 11 new fields (consistent with Phase 30 D-15). New fields (all column-level optional; schema-level required-ness via superRefine):
  - `honorific_en`, `honorific_ar` (optional)
  - `first_name_en`, `last_name_en` (superRefine: `last_name_en` required; `first_name_en` optional — allows single-word names)
  - `first_name_ar`, `last_name_ar` (superRefine: `last_name_ar` required; `first_name_ar` optional)
  - `known_as_en`, `known_as_ar` (optional)
  - `photo_url` (already exists — stays as-is)
  - `nationality_id` (superRefine: required)
  - `date_of_birth` (optional, ISO date string)
  - `gender` (enum: `'female' | 'male'`, optional)
- **D-26:** The form field name is `nationality_id` (matches Zod + wizard naming convention). On submit, it maps to the DB column `nationality_country_id`. Mapping happens in `filterExtensionData` or via a rename in the Edge Function payload. Recommendation: rename at the `filterExtensionData` boundary so the Edge Function sees `nationality_country_id` directly.
- **D-27:** Both `personWizardConfig` and `electedOfficialWizardConfig` are updated to use `PersonBasicInfoStep` at step index 0 (replacing the shared basicStep reference). The `basicStep` constant in `person.config.ts` either renames to `identityStep` or keeps its ID but swaps the component. i18n keys update: `form-wizard:steps.identityInfo` / `form-wizard:steps.identityInfoDesc`.

### Migration Mechanism

- **D-28:** Migration is applied via **Supabase MCP** (per user's global CLAUDE.md rule: "when you need to apply migration to supabase, use the supabase mcp to do it your self"). This supersedes Phase 30 D-19's CLI choice. File lives under `supabase/migrations/2026041800000X_person_identity_fields.sql` and is applied against linked staging project `zkrcjzdemdmwhearhfgg`.
- **D-29:** Migration includes both DDL (ADD COLUMN × 11, all nullable) and a backfill UPDATE using the D-06/D-07 split rule. Backfill runs in a single transaction; if split produces zero rows, UPDATE is a no-op (safe to re-run).

### Edge Function

- **D-30:** `supabase/functions/dossiers-create/index.ts` is extended **additively** to read the 11 new fields from `extensionData` and include them in the `persons` insert payload. Old clients that don't post these fields continue to succeed (all new columns nullable; Edge Function uses spread or explicit field-by-field with `?? null`). Matches Phase 30's backwards-compatibility pattern.
- **D-31:** The Edge Function does **not** compose `name_en/ar`. Composition stays in the client (`filterExtensionData` — D-08). Edge Function receives `name_en/ar` as the composed legal-name string and inserts it into `dossiers` as today. This keeps the Edge Function behaviorally unchanged for the `dossiers` row itself.

### i18n

- **D-32:** New keys added under a new `wizard.person.*` / `wizard.person_identity.*` namespace in both `frontend/src/i18n/en/form-wizard.json` and `frontend/src/i18n/ar/form-wizard.json`. Follows the Phase 30 D-20 precedent (`wizard.elected_official.*` namespace). Suggested key paths:
  - `wizard.person_identity.honorific.label`, `.placeholder`, `.values.h_e` (etc.), `.other_en.label`, `.other_ar.label`
  - `wizard.person_identity.first_name.label_en` / `.label_ar`
  - `wizard.person_identity.last_name.label_en` / `.label_ar`
  - `wizard.person_identity.known_as.label_en` / `.label_ar` + `.helper`
  - `wizard.person_identity.photo_url.label`, `.placeholder`, `.helper`
  - `wizard.person_identity.nationality.label`, `.placeholder`
  - `wizard.person_identity.dob.label`, `.helper`
  - `wizard.person_identity.gender.label`, `.female`, `.male`
  - `wizard.person_identity.validation.nationality_required`, `.last_name_required`, `.gender_invalid`
  - `wizard.person_identity.review.card_title`, `.biographical_summary_heading`
- **D-33:** Arabic writing direction handled via `useDirection()` + `dir={direction}` on AR inputs (never `textAlign: "right"`). Matches SPEC constraint.

### Claude's Discretion

- **AR translations for curated honorifics** — D-04 lists recommended Arabic equivalents; planner/implementer may refine with a native speaker's input if available.
- **Visual density of the Review Identity card** — two sub-sections within one card vs. slightly larger card with section headings. Planner picks whichever reads best in both light and dark themes.
- **Exact border/background styling of the nationality badge** — shadcn Badge variant `secondary` vs `outline` vs `default`. Planner tests both against the table's row hover state.
- **Join shape for resolving country ISO-2 in list queries** — D-16 prefers join, but if TanStack Query hooks already have an enrichment step for country dossiers, it can piggyback on that.
- **Date input primitive for DOB** — native `<input type="date">` vs HeroUI DatePicker. Native is simpler and matches `term_start`/`term_end` in OfficeTermStep (which uses native). Default: native.
- **Photo URL preview thumbnail size** — SPEC implies a preview; planner picks 48×48 or 64×64 square, with `object-cover` and rounded corners. Lazy-load the image, show a placeholder icon on error.

### Folded Todos

None — no pending todos matched Phase 32 scope via `gsd-sdk query todo.match-phase` (tool not installed; manual scan of `.planning/todos/` returned no relevant matches).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 32 Requirements

- `.planning/phases/32-person-native-basic-info/32-SPEC.md` — **Locked requirements (PBI-01 through PBI-07). MUST read before planning.** Contains Background, Boundaries, Constraints, Acceptance Criteria, and Ambiguity Report.
- `.planning/ROADMAP.md` §"Phase 32: Person-Native Basic Info" — Goal, dependencies (Phase 30), requirements mapping, success criteria, UI hint.
- `.planning/REQUIREMENTS.md` — Domain requirements (if Phase 32 references specific REQ IDs; otherwise the SPEC supersedes).

### Phase 30 + 28 Precedents (pattern sources)

- `.planning/phases/30-elected-official-wizard/30-CONTEXT.md` — Model B (one wizard, two configs), D-15 (schema extension in place), D-19 (constraint relaxation pattern), D-20 (i18n namespace convention). Direct ancestor phase.
- `.planning/phases/28-simple-type-wizards/28-CONTEXT.md` — Compositional wizard pattern, per-type config convention, list-page Create button pattern.

### Wizard Infrastructure (Phase 26)

- `frontend/src/components/dossier/wizard/CreateWizardShell.tsx` — Shell. No changes in Phase 32.
- `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` — Shared hook. No signature changes.
- `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` — **Reference for visual pattern only.** Phase 32 does NOT modify this file; it creates a sibling `PersonBasicInfoStep` that replaces it on the Person + Elected Official wizards. Other dossier types keep using SharedBasicInfoStep.
- `frontend/src/components/dossier/wizard/schemas/base.schema.ts` — Base schema merged into person schema.
- `frontend/src/components/dossier/wizard/defaults/index.ts` — Per-type defaults. Extended with new identity-field defaults (empty strings + `status='active'`, `sensitivity_level=2`).
- `frontend/src/components/dossier/wizard/config/types.ts` — WizardConfig type.

### Person Wizard Targets (D-25, D-27 edits)

- `frontend/src/components/dossier/wizard/schemas/person.schema.ts` — **Target for D-25 extension.** Add 11 fields + superRefine rules for required last_name_en/ar, nationality_id, gender enum.
- `frontend/src/components/dossier/wizard/config/person.config.ts` — **Target for D-27 edit.** Swap step 1 from `SharedBasicInfoStep` to `PersonBasicInfoStep` in both `personWizardConfig` and `electedOfficialWizardConfig`. Extend `filterExtensionData` to: (a) compose `name_en/ar` from first+last (D-08); (b) rename `nationality_id` → `nationality_country_id`; (c) resolve curated honorific to bilingual pair via static map (D-04).
- `frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx` — Reference for bilingual grid pattern. Unchanged in Phase 32.
- `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` — **Target for D-17..D-21 edits.** Conditionally replace Basic Info card with Identity card when `person_subtype in {standard, elected_official}`.

### DossierPicker (Phase 29)

- `frontend/src/components/dossier/DossierPicker.tsx` — Reused for nationality (single-select, `filterByDossierType="country"`, `required`). No changes.

### Database Schema

- `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` — Authoritative `persons` table schema. Contains `nationality_country_id`, `title_en/ar`, `photo_url`, `biography_en/ar`, office/term columns. Phase 32 migration adds 11 more columns to this table.
- `supabase/migrations/20260202000002_drop_elected_officials_table.sql` — Confirms `persons` is the single-table source for both subtypes.
- New migration file (to be created): `supabase/migrations/2026041800000X_person_identity_fields.sql` — DDL for 11 columns + backfill UPDATE.

### Edge Function

- `supabase/functions/dossiers-create/index.ts` — **Target for D-30 additive extension.** Read new fields from `extensionData`, include in persons insert. Backwards-compatible (nullable columns).

### List Pages (PBI-06 targets)

- `frontend/src/routes/_protected/dossiers/persons/index.tsx` — Target: honorific + last_name + nationality badge in row label.
- `frontend/src/routes/_protected/dossiers/elected-officials/index.tsx` — Same target. May share a helper (`formatPersonLabel(person)` in `@/lib/person-display.ts`).
- `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` — Table component (already filters subtype); row-label rendering updates here.

### i18n (D-32)

- `frontend/src/i18n/en/form-wizard.json` — Add `wizard.person_identity.*` keys.
- `frontend/src/i18n/ar/form-wizard.json` — Mirror with Arabic translations.

### Project-Level Rules

- `CLAUDE.md` (project) — RTL-safe Tailwind rules (logical properties only), HeroUI v3 component hierarchy, touch targets 44×44, i18n namespace.
- `~/.claude/CLAUDE.md` (user global) — **"When you need to apply migration to supabase, use the supabase mcp to do it yourself."** Supersedes Phase 30 D-19's CLI choice for Phase 32 (D-28).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **shadcn `Select` primitive** (`@/components/ui/select`) — already used in `SharedBasicInfoStep` for status + sensitivity. Directly reusable for the honorific dropdown (D-01). No new primitive needed.
- **`FormField` + `FormControl` + `FormItem` + `FormMessage`** (from `@/components/ui/form`) — react-hook-form integration used throughout the wizard. PersonBasicInfoStep mirrors this pattern.
- **`FieldLabelWithHelp`** (`@/components/forms/ContextualHelp`) — Adds tooltip + expanded help. Used in SharedBasicInfoStep for name fields. Can add helpProps for each new identity field.
- **`AIFieldAssist`** (`@/components/dossier/AIFieldAssist`) — Already in SharedBasicInfoStep. PersonBasicInfoStep can keep this block at the top; planner confirms whether AI generation supports the new identity field shape.
- **`DossierPicker`** (`@/components/dossier/DossierPicker`) — Single-select with `filterByDossierType="country"` + `required=true`. Matches Phase 30 D-12 usage for `country_id`.
- **`useDirection()` hook** — Returns `direction` ('ltr' | 'rtl') and applies to AR inputs via `dir={direction}`. Used in every step.
- **`Badge` component** (`@/components/ui/badge`, re-export of `heroui-chip.tsx`) — Used for D-13 nationality badge.
- **Honorific bilingual map** — Will live as a const at the top of `PersonBasicInfoStep.tsx` or in a colocated `honorific-map.ts`. Planner decides.

### Established Patterns

- **Bilingual input pair grid:** `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">` with two `FormField`s (EN + AR). Mobile: stacked. Desktop: side-by-side. Mandatory pattern from Phase 28/30.
- **Collapsible advanced section:** `<details>` element with `summary` + `ChevronDown`. Used for classification in SharedBasicInfoStep. Reused for D-23.
- **Per-type config extension:** one schema per type, extended in place. No new `person-identity.schema.ts` — all changes go in `person.schema.ts` (D-25).
- **Wizard step component signature:** `<T extends FieldValues>({ form: UseFormReturn<T>, ...props })`. PersonBasicInfoStep follows this generic pattern.
- **Additive Edge Function changes:** Phase 30 set the precedent — add fields to the insert payload without removing existing handling. Old clients keep working.
- **Auto-derivation in `filterExtensionData`:** Phase 30 D-10 auto-derives `is_current_term` inside `filterExtensionData`. Phase 32 does the same for `name_en/ar` composition (D-08) and honorific AR mapping (D-04).
- **i18n namespace per subtype:** `wizard.{subtype}.*`. Phase 30 used `wizard.elected_official.*`. Phase 32 uses `wizard.person_identity.*` (or `wizard.person.*` — planner's call).

### Integration Points

- **Route tree regeneration:** Not needed (no new routes). Phase 32 edits existing `/dossiers/persons/index.tsx` and `/dossiers/elected-officials/index.tsx` only.
- **Supabase MCP migration application:** Must be done by the parent session (per `project_corporate_infra.md` / `phase_17_checkpoint.md` memory — subagents lack Supabase MCP). Planner flags this.
- **Country ISO-2 resolution for badge:** Requires join through `nationality_country_id` → `dossiers` → `countries`. Planner decides whether to extend the existing persons list query or add a small enrichment layer.
- **PersonReviewStep conditional branch:** The "Identity" card replaces Basic Info only when `person_subtype in {standard, elected_official}`. Other subtypes (none currently exist) keep the Basic Info card. This conditional lives inside `PersonReviewStep.tsx`.
- **Legacy draft compatibility:** users with saved drafts from before Phase 32 will have drafts missing the new identity fields. The Identity card renders `—` for missing values (D-21); the wizard's `defaultValues` populate new fields with empty strings/undefined so drafts don't crash.

</code_context>

<specifics>
## Specific Ideas

- User's UAT screenshot (2026-04-18) — the Step 1 dropdown labeled "E.G., WDF, WHO, SDGS" on a person dossier is the concrete trigger for this phase. Every HOW decision (D-01..D-33) exists to make that leak impossible by construction (there's no `abbreviation` field in `PersonBasicInfoStep` to begin with).
- "One wizard, one code path" is a recurring user preference (Phase 28, Phase 30, now Phase 32). The Identity card + `person.schema.ts` extension-in-place continues this.
- Honorific as a CURATED dropdown with an "Other" escape matches how diplomatic directories actually work — the curated list covers 95% of cases, and "Other" absorbs edge cases (tribal titles, religious titles like "Grand Mufti", non-Western state titles) without blocking creation.
- Flag emoji + ISO-2 code for nationality (D-11) matches the diplomatic-list convention of "🇸🇦 SA" that users will instantly recognize from international news tickers and UN rosters.
- The legal-name-vs-display-name distinction (D-09) is principled: `dossiers.name_en` is what you search/index/cite; the honorific is how you address the person. Keeping them separate at the data layer makes both work.

</specifics>

<deferred>
## Deferred Ideas

- **Photo uploader with Supabase Storage** — Drag-drop upload, cropping, thumbnail generation. Phase 32 wires only the `photo_url` text input. A future phase adds the Storage bucket + upload UI.
- **Detail-page identity rendering** — Phase 32 updates list pages only. Persons / Elected Officials DETAIL pages (`/dossiers/persons/:id`, `/dossiers/elected-officials/:id`) keep their current name rendering. A follow-up phase updates the detail header to show honorific + flag.
- **Gender values beyond Female/Male** — No "prefer not to say" option, no non-binary values. SPEC decision. Revisit if policy changes.
- **Moving `nationality_id` to NOT NULL at DB level** — Column is nullable in Phase 32 to avoid breaking legacy rows. A cleanup phase can tighten this once all rows are backfilled or manually reviewed.
- **Suffix fields (Jr., Sr., III, PhD)** — Not in the 11 new columns. If users request, add in a follow-up as a single `suffix_en/ar` pair.
- **Transliteration helper (auto-fill AR from EN name)** — Out of scope; user types both languages manually. Could add later as an AI-assist feature.
- **`dossiers.name_en/ar` → generated column** — SPEC explicitly out of scope. The composed name stays as a plain text column written by the client.
- **Committee assignments, expertise areas as structured typed columns** — `persons.committee_assignments JSONB` and `persons.expertise_areas text[]` exist and stay JSONB / array for now. Future structured-data phase.
- **Supabase Storage security policies for photo bucket** — Deferred with the uploader.

### Reviewed Todos (not folded)

None — no pending todos scoped to Phase 32 territory.

</deferred>

---

_Phase: 32-person-native-basic-info_
_Context gathered: 2026-04-18_
