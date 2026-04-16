# Phase 29: Complex Type Wizards - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create Forum, Working Group, and Engagement dossiers through type-specific wizards launched from their respective list pages. All three reuse the shared wizard infrastructure (Phase 26) and the config-driven pattern established by Country (Phase 27) and the Simple Type Wizards (Phase 28). Forum and Working Group add relationship linking during creation via single-select DossierPicker. Engagement adds a 4th step — Participants — that multi-selects countries, organizations, and persons; this phase also ships the multi-select variant of the existing DossierPicker.

**Out of scope (handled by later phases):**

- CreateDossierHub type grid page at `/dossiers/create` — Phase 31 (UX-01)
- Type-specific contextual guidance/hints in wizard steps — Phase 31 (UX-02)
- Elected Official wizard — Phase 30 (ELOF-01..04)
- Removal of the legacy monolithic `DossierCreateWizard.tsx` — Phase 31 cleanup

</domain>

<decisions>
## Implementation Decisions

### Multi-Select DossierPicker (Area 1)

- **D-01:** Extend the existing `frontend/src/components/work-creation/DossierPicker.tsx` in place with optional `multiple?: boolean` + `values?: string[]` + `onValuesChange?: (ids: string[]) => void` props. Keep single-select behavior identical when `multiple` is absent. Single source of truth, minimal diff, proven RTL/mobile behavior preserved.
- **D-02:** Selected-dossier chips render as an inline row **beneath** the combobox input. Each chip shows dossier name + type icon + remove (×). Horizontal scroll on mobile — matches the existing Badge/Chip pattern used by `PositionDossierLinker` and `useWorkItemDossierLinks` widgets.
- **D-03:** Widen `filterByDossierType` to accept `DossierType | DossierType[]`. Backwards compatible — existing single-type callers work unchanged. Unused by Phase 29 (our Participants step uses three separate type-filtered pickers — see D-05), but the array form prevents a future rewrite if the UX evolves.
- **D-04:** No hard cap on selections — rely on horizontal-scroll chip UX to absorb large selections. Summits and multilateral engagements can legitimately have many participants.

### Engagement Participants Step (Area 2)

- **D-05:** Participants step uses **three labeled sections**, one multi-select DossierPicker per type: `Countries` / `Organizations` / `Persons`. Each picker pre-filtered to its dossier_type. Matches the requirement text almost verbatim; simplest i18n; per-type validation; disjoint types make cross-category duplicates impossible by construction.
- **D-06:** **No required minimum participants.** Engagement can be created with all three sections empty; participants can be added later from the engagement dossier detail page. Consistent with Phase 28's lightweight-wizard philosophy and with D-09/D-10 (optional link fields for Forum/WG).
- **D-07:** Cross-category dedupe is a non-issue because the three sections are pre-filtered to disjoint dossier types — no dedupe logic required in the form.
- **D-08:** Selected-participant chips scroll horizontally **within each section** on mobile (matches D-02). RTL scroll direction flips automatically.

### Forum / WG Link Persistence (Area 3)

- **D-09:** Persist the organizing-body / parent-body link via a **dedicated FK on the entity's own table**:
  - Forum → write to the existing `forums.organizing_body` column (FK already present; confirmed in `supabase/migrations/033_update_forum_details_view.sql`).
  - Working Group → add a `working_groups.parent_body_id` UUID FK via new migration, nullable, pointing at `dossiers(id)` (or `organizations(id)` — planner to confirm against existing schema).
  - Do NOT write to `dossier_relationships` junction from the wizard. Relationship views that need back-links can be derived via a left-join when rendering the organizing-body's dossier.
- **D-10:** Organizing body on the Forum wizard is **optional** — the user can submit the wizard with it blank and set it later from the forum detail page. Matches "lightweight wizard" ethos; unblocks draft-capture flows.
- **D-11:** Parent body on the Working Group wizard is **optional** — same reasoning as D-10, consistent UX across both complex types.
- **D-12:** WG parent-body DossierPicker filter is restricted to **`organization` only**. Matches the `working_group_members.member_type IN ('organization','person')` precedent in the existing schema and the typical "organization hosts working group" mental model.

### Type-Specific Field Shapes (Area 4)

- **D-13:** Engagement `type` values come from the existing `engagement_dossiers_engagement_type_check` constraint (adds 'forum_session' per `20260329000002_add_forum_session_support.sql`). The wizard exposes them as a bilingual-labeled single-select dropdown — i18n keys per enum value. Planner must read the live constraint to emit the exact allowed list in the Zod schema.
- **D-14:** Engagement `category` is a **single-select dropdown** of a curated predefined list: `diplomatic`, `economic`, `security`, `cultural`, `technical`, `humanitarian`, `other`. Same 2-tier pattern as Topic theme category (Phase 28 D-08). Bilingual labels via i18n keys.
- **D-15:** Location is captured as a **single bilingual text pair**: `location_en` + `location_ar`, matching SharedBasicInfo's name_en/name_ar pattern. Free-text entries like "Riyadh, Saudi Arabia" / "الرياض، المملكة العربية السعودية". No structured city/country fields, no map picker in this phase.
- **D-16:** Working Group `mandate` uses the **same stacked EN-field → AR-field layout** SharedBasicInfo uses for name/description. `writingDirection: 'rtl'` on the Arabic textarea. Zero UX drift vs existing wizards; no new i18n helpers.

### Step Structure

- **D-17:** Forum wizard: 3 steps — `SharedBasicInfoStep` → `ForumDetailsStep` (organizing body via DossierPicker single-select, filter `organization`) → `ForumReviewStep`.
- **D-18:** Working Group wizard: 3 steps — `SharedBasicInfoStep` → `WorkingGroupDetailsStep` (status, established_date, mandate_en, mandate_ar, parent_body via DossierPicker single-select, filter `organization`) → `WorkingGroupReviewStep`.
- **D-19:** Engagement wizard: 4 steps — `SharedBasicInfoStep` → `EngagementDetailsStep` (engagement_type, category, location_en, location_ar) → `EngagementParticipantsStep` (three sections: Countries, Organizations, Persons; each with multi-select DossierPicker) → `EngagementReviewStep`.
- **D-20:** Review steps follow the Phase 27 D-05 pattern — grouped summary cards with per-section "Edit" buttons jumping back to the relevant step. Engagement review card for Participants shows three subsections (one per type) with chip counts.

### List Page Integration & Routes

- **D-21:** Add Create button to Forums, Working Groups, and Engagements list pages using the exact Phase 28 D-10 pattern. Placement, icon, and behavior match Countries/Organizations/Topics/Persons.
- **D-22:** Route paths follow the Phase 28 convention:
  - `/_protected/dossiers/forums/create`
  - `/_protected/dossiers/working_groups/create`
  - `/_protected/dossiers/engagements/create`
  - (Route-tree regeneration required — Phase 28 precedent.)
- **D-23:** Post-creation navigates to the new dossier detail page via `getDossierDetailPath()` — same as all prior wizards.

### Validation & Drafts

- **D-24:** Each wizard persists drafts in localStorage keyed as `dossier-create-forum`, `dossier-create-working_group`, `dossier-create-engagement` (Phase 28 pattern). Draft is cleared on successful submission.
- **D-25:** No AI auto-fill for any of the three complex types — matches Phase 28 D-05/D-06 precedent. Complex types are too heterogeneous for reference-table lookup.
- **D-26:** All link fields (forum organizing body, WG parent body, engagement participants) are validated at step level only — no cross-step dependencies. Empty is valid.

### Claude's Discretion

- **WG `status` default enum:** `active`, `inactive`, `forming`, `dissolved` — exposed as a single-select dropdown with bilingual i18n labels. Planner to cross-reference against the live `working_groups.status` constraint if one exists and adjust values accordingly.
- **Engagement `scheduled_date` field:** Not in requirements; planner may add an optional ISO date picker on EngagementDetailsStep only if the live `engagement_dossiers` schema already has a scheduled/start-date column. Otherwise skip — don't introduce a new DB column in this phase.
- **i18n keys for new enum values:** Planner to author bilingual labels in `frontend/src/i18n/{en,ar}/form-wizard.json` under existing `wizard.engagement.*`, `wizard.forum.*`, `wizard.working_group.*` scopes.
- **DossierPicker test coverage:** Add unit tests for the new `multiple` / `values` / `onValuesChange` path; re-use existing single-select test setup.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Wizard Infrastructure (Phase 26)

- `.planning/phases/26-shared-wizard-infrastructure/26-CONTEXT.md` — Base schema, per-type config architecture, step-composition pattern
- `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` — Generic wizard hook (drafts, form state, submission, AI assist, duplicate detection)
- `frontend/src/components/dossier/wizard/CreateWizardShell.tsx` — Shell wrapping FormWizard with draft indicator
- `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` — Reusable BasicInfo step (bilingual names, abbreviation, description, tags, classification)
- `frontend/src/components/ui/form-wizard.tsx` — Base FormWizard stepper primitive (RTL, animations, validation, bilingual labels)

### Country + Simple Type Wizard Templates (Phases 27–28)

- `.planning/phases/27-country-wizard/27-CONTEXT.md` — Review step grouped-summary-cards pattern; auto-fill pattern (not applied in Phase 29)
- `.planning/phases/28-simple-type-wizards/28-CONTEXT.md` — Config-driven wizard per type; lightweight-wizard philosophy; localStorage draft keying; post-create navigation
- `frontend/src/components/dossier/wizard/config/country.config.ts` — Config pattern to replicate for forum / working_group / engagement
- `frontend/src/components/dossier/wizard/review/CountryReviewStep.tsx` — Review step reference implementation

### Existing Schemas (already scaffolded in Phase 26)

- `frontend/src/components/dossier/wizard/schemas/base.schema.ts` — Base schema
- `frontend/src/components/dossier/wizard/schemas/forum.schema.ts` — Extend with `organizing_body_id?: string | null`
- `frontend/src/components/dossier/wizard/schemas/working-group.schema.ts` — Extend with `status`, `established_date?: string | null`, `mandate_en`, `mandate_ar`, `parent_body_id?: string | null`
- `frontend/src/components/dossier/wizard/schemas/engagement.schema.ts` — Extend with `engagement_type`, `category`, `location_en`, `location_ar`, `participant_country_ids: string[]`, `participant_organization_ids: string[]`, `participant_person_ids: string[]`

### DossierPicker — Extending the Multi-Select Variant

- `frontend/src/components/work-creation/DossierPicker.tsx` — Single-select combobox with `filterByDossierType: DossierType`, recent-dossiers from localStorage, autocomplete via API. Extend in place per D-01 / D-02 / D-03.
- `frontend/src/components/dossier/DossierSelector.tsx` — Alternative selector used in work-item-creation; reference only, not extended.
- `frontend/src/components/positions/PositionDossierLinker.tsx` — Existing multi-dossier linker reference for chip UX patterns.

### Existing DB Schema (Read Before Planning Migrations)

- `supabase/migrations/033_update_forum_details_view.sql` — Confirms `forums.organizing_body` FK already exists.
- `supabase/migrations/006_create_forums.sql` / `006_forums.sql` — Forum table definition (planner to inspect for full column set).
- `supabase/migrations/20260110000006_working_groups_entity.sql` — Working groups table & views (status column already present); **no `parent_body_id` today — Phase 29 must add it via migration**.
- `supabase/migrations/20260110000006_create_engagement_dossiers.sql` — Engagement dossier table.
- `supabase/migrations/20260329000002_add_forum_session_support.sql` — Current `engagement_dossiers_engagement_type_check` constraint (source of truth for D-13 enum values).
- `supabase/migrations/20260115400001_working_group_member_suggestions.sql` — Shows `working_group_members` precedent for D-12 parent-body filter scope.

### List Pages (Add Create Button)

- `frontend/src/routes/_protected/dossiers/forums/index.tsx`
- `frontend/src/routes/_protected/dossiers/working_groups/index.tsx`
- `frontend/src/routes/_protected/dossiers/engagements/index.tsx`

### i18n

- `frontend/src/i18n/en/form-wizard.json` — Extend with `wizard.forum.*`, `wizard.working_group.*`, `wizard.engagement.*` keys.
- `frontend/src/i18n/ar/form-wizard.json` — Mirror EN additions with Arabic translations.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `CreateWizardShell` — wraps FormWizard with draft indicator. Reuse directly for all three wizards.
- `useCreateDossierWizard<T>` — generic hook; instantiate per type with its config.
- `SharedBasicInfoStep` — first step for all three wizards (same as Phases 27–28).
- `FormWizard` / `FormWizardStep` — base stepper primitive with RTL, validation, bilingual labels.
- `useFormDraft<T>` — localStorage draft persistence (`dossier-create-{type}` key pattern).
- `useCreateDossier` — TanStack Query mutation for the dossier-creation API.
- `getDossierDetailPath()` — post-creation navigation helper.
- `DossierPicker` (work-creation) — single-select combobox with `filterByDossierType`, recent-items, autocomplete. **Extend in place for multi-select (D-01).**

### Established Patterns

- **Config-driven wizards** — each type has a `{type}WizardConfig` with schema, defaults, steps, `filterExtensionData`.
- **react-hook-form + zodResolver** — form state + validation for all wizards.
- **i18n bilingual labels** — all step titles / descriptions live under the `form-wizard` namespace.
- **Review step** — grouped summary cards with per-section "Edit" buttons (Phase 27 D-05, Phase 28 D-09/D-11).
- **Draft persistence** — `dossier-create-{type}` localStorage key.
- **Link-field storage** — FK on the entity's own table (existing `forums.organizing_body`); do not write to `dossier_relationships` junction from wizards (D-09).

### Integration Points

- **List pages** — add Create button to Forums / Working Groups / Engagements index routes.
- **Routes** — add three `create.tsx` files under `_protected/dossiers/{forums,working_groups,engagements}/`.
- **Config directory** — add `forum.config.ts`, `working-group.config.ts`, `engagement.config.ts`.
- **Steps directory** — add `ForumDetailsStep.tsx`, `WorkingGroupDetailsStep.tsx`, `EngagementDetailsStep.tsx`, `EngagementParticipantsStep.tsx`.
- **Review directory** — add `ForumReviewStep.tsx`, `WorkingGroupReviewStep.tsx`, `EngagementReviewStep.tsx`.
- **Schemas** — extend existing `forum.schema.ts`, `working-group.schema.ts`, `engagement.schema.ts` with wizard-specific fields (D-13..D-16).
- **Migration** — add `working_groups.parent_body_id` FK (D-09).
- **DossierPicker** — in-place extension for multi-select (D-01..D-04).

</code_context>

<specifics>
## Specific Ideas

- The Participants step is modelled as three disjoint sections (not a tabbed/filter-driven picker) so bilingual labels stay simple and validation is naturally per-type.
- Forum and Working Group link fields are **optional**, keeping the wizard lightweight and draft-friendly. This matches the broader Phase 28 ethos and sidesteps ordering problems (e.g. creating a forum before its organizing org dossier exists).
- The multi-select DossierPicker is implemented as an **in-place extension** of `work-creation/DossierPicker.tsx` rather than a new sibling component — maximum reuse, minimum maintenance burden, single component governs RTL + recent-items behavior.
- Location stays as a free-text bilingual pair for v5.0 — structured address / map picker is a distinct UX improvement that can land later without blocking Phase 29.
- The wizard does not write to `dossier_relationships` — FK on the entity's own table is sufficient; back-links can be computed by a left-join when needed.

</specifics>

<deferred>
## Deferred Ideas

- **CreateDossierHub at `/dossiers/create`** (UX-01) — Phase 31 (Creation Hub and Cleanup).
- **Contextual guidance/hints per wizard step** (UX-02) — Phase 31.
- **Legacy monolithic `DossierCreateWizard.tsx` removal** — Phase 31 cleanup.
- **Elected Official wizard** (ELOF-01..04) — Phase 30.
- **Structured location (city + country FK) and map picker for engagements** — post-v5.0; revisit once engagement analytics surface a concrete need.
- **`dossier_relationships` junction writes from the wizard (belt-and-braces relationship views)** — deferred until a concrete UX requires reciprocal visibility that a simple left-join can't satisfy.
- **Participants minimum validation** — deferred; if data hygiene shows empty-participant engagements are a problem, revisit in a tech-debt phase.
- **DossierPicker hard cap** — not needed given horizontal-scroll chips; revisit if UI perf degrades with hundreds of selections.

</deferred>

---

_Phase: 29-complex-type-wizards_
_Context gathered: 2026-04-16_
