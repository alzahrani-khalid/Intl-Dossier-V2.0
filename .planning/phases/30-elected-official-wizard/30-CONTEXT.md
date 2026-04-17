# Phase 30: Elected Official Wizard - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create an elected official via a 4-step wizard (Basic Info → Person Details → Office/Term → Review) launched from the Elected Officials list page. The wizard is a **subtype-aware variant** of the existing Person wizard — the same shell and steps are reused, the Office/Term step is inserted conditionally when `person_subtype='elected_official'`, and the created row lives in the `persons` table alongside standard persons.

Scope is bounded to capturing the fields named in ELOF-02 plus the two direct FK columns (`country_id`, `organization_id`) that tie the office to a polity. Cross-dossier linking beyond those two FKs (forum attendance, working-group membership, MoU signatures) is explicitly out of scope — those links are created from the other entity's own wizards (forum/WG/engagement wizards, Phase 29).

</domain>

<decisions>
## Implementation Decisions

### Entry Model — Subtype-Aware Single Wizard (Model B)

- **D-01:** One Person wizard serves both `person_subtype` values. The "Add Person" button on `/dossiers/persons` launches the 3-step flow (subtype=`standard`). The "Add Elected Official" button on `/dossiers/elected-officials` launches the **same wizard** but the shell pre-sets `person_subtype='elected_official'` and inserts `OfficeTermStep` as step 3 (between `PersonDetailsStep` and `PersonReviewStep`). Matches ELOF-01's "variant" wording literally.
- **D-02:** Entry point sets subtype via route context, not via a user-facing toggle. The elected-officials route pre-seeds the form's default values with `person_subtype='elected_official'`; the persons route leaves it at `standard`. No "Is this an elected official?" radio — the choice was made when the user clicked the list page's Create button.
- **D-03:** Route: `/_protected/dossiers/elected-officials/create` (follows Phase 28 D-22 convention). Route tree regeneration required. The existing Elected Officials list page's Create button currently links to the generic `/dossiers/create` — Phase 30 updates it to the typed route.

### Office/Term Step — Essentials Only (Progressive Disclosure)

- **D-04:** Office/Term step captures only the ELOF-02 essentials plus the two relationship FKs:
  - `office_name_en` + `office_name_ar` (bilingual pair, at least one required — see D-08)
  - `district_en` + `district_ar` (bilingual pair, both optional — stored as "constituency")
  - `party_en` + `party_ar` (bilingual pair, both optional)
  - `term_start` (date, required)
  - `term_end` (date, optional — empty ⇒ ongoing term)
  - `country_id` (DossierPicker, single-select, **required** — D-11)
  - `organization_id` (DossierPicker, single-select, optional — D-12)
- **D-05:** Columns not exposed in the wizard (deferred to post-creation edit on the detail page): `office_type`, `party_abbreviation`, `party_ideology`, `term_number`, `is_current_term` (auto-derived — D-10). These can be surfaced in the detail page's edit mode but don't clutter the wizard.
- **D-06:** Step component name: `OfficeTermStep.tsx`, colocated under `frontend/src/components/dossier/wizard/steps/`. Mirrors `PersonDetailsStep` conventions (FormWizardStep, react-hook-form, bilingual grid layout, `useDirection()` for RTL).
- **D-07:** `PersonReviewStep` extended to render the office/term section **only when** `form.getValues('person_subtype') === 'elected_official'`. Non-elected-official flow shows the same review step it does today.

### Bilingual Data Entry

- **D-08:** `office_name` uses the **"at least one of EN/AR required"** pattern. Both inputs render side-by-side in a 2-column grid (matches `PersonDetailsStep` title/biography layout). Zod refinement enforces `(office_name_en || office_name_ar) !== ''` when `person_subtype='elected_official'`. DB constraint relaxed to match (see D-19).
- **D-09:** `district` and `party` bilingual pairs are **both fully optional** (either language, neither required). Reflects that constituency and party affiliation may be unknown at creation time.

### Term Handling

- **D-10:** `term_start` is required (full ISO date picker, day-level). `term_end` is optional — empty means "ongoing term". `is_current_term` is **auto-derived at insert time**: `true` if `term_end IS NULL OR term_end >= CURRENT_DATE`, else `false`. No checkbox shown to the user. The DB column remains and is populated by the submit handler (or by a `BEFORE INSERT` trigger — planner chooses the cleaner approach).
- **D-11:** Client-side validation for `term_end >= term_start` (already enforced by the `persons_valid_term_dates` CHECK constraint; client-side check gives inline feedback before submit).

### Dossier Linking at Creation (Narrow — Country + Org Only)

- **D-12:** `country_id`: single-select DossierPicker filtered to `country` dossier type (`filterByDossierType=['country']`). **Required** — every elected official is tied to a polity. The label reads "Country" (EN) / "البلد" (AR).
- **D-13:** `organization_id`: single-select DossierPicker filtered to `organization` dossier type. Optional. Label: "Organization / Body" (EN) / "المنظمة / الجهة" (AR). Used for cabinet ministers, parliamentarians tied to a specific chamber, ambassadors to an international body.
- **D-14:** DossierPicker reused as-is from Phase 29 D-01..D-05 — no new variant needed. Configuration only: `multiple=false`, `filterByDossierType` set, `required` prop honored.

### Schema Composition

- **D-15:** `person.schema.ts` **extended in place** (not a new `elected-official.schema.ts`). New optional fields added: `office_name_en`, `office_name_ar`, `district_en`, `district_ar`, `party_en`, `party_ar`, `term_start`, `term_end`, `country_id`, `organization_id`. A `.superRefine()` at the schema level enforces the elected-official-specific required-ness rules: when `person_subtype='elected_official'`, require `country_id` and at least one of `office_name_en`/`office_name_ar` and `term_start`.
- **D-16:** `person.config.ts` **extended in place** to expose a subtype-aware `steps` function: if the provided defaults set subtype to `elected_official`, return `[SharedBasicInfo, PersonDetails, OfficeTerm, PersonReview]`; otherwise return `[SharedBasicInfo, PersonDetails, PersonReview]`. The wizard shell accepts this array as-is; no change to `useCreateDossierWizard` or `CreateWizardShell` signatures.
- **D-17:** Defaults (`wizard/defaults/index.ts`) extended with an elected-official default-map variant returning `{ person_subtype: 'elected_official', is_current_term: true }` plus blank strings for bilingual pairs. The existing per-route invocation passes the variant key.

### Route + List Page Integration

- **D-18:** Update `frontend/src/routes/_protected/dossiers/elected-officials/index.tsx` — change the PageHeader Create button's `Link to` from `/dossiers/create` to `/dossiers/elected-officials/create`. Applies Phase 28 D-10 / D-22 pattern.

### Database Migration

- **D-19:** One new migration added via Supabase MCP: **relax** the `persons_elected_official_requires_office` constraint from `office_name_en IS NOT NULL` to `office_name_en IS NOT NULL OR office_name_ar IS NOT NULL`. Use `ALTER TABLE ... DROP CONSTRAINT ... / ADD CONSTRAINT ...` pattern. No data migration needed — existing elected officials already satisfy the relaxed rule. Rollback script documented alongside.

### i18n

- **D-20:** New keys added under `wizard.elected_official.*` namespace in both `frontend/src/i18n/en/form-wizard.json` and `frontend/src/i18n/ar/form-wizard.json`:
  - Step title + description
  - Field labels: office_name, district, party, term_start, term_end, country, organization
  - Validation messages (at-least-one-required, term dates order, required country)
  - Review section labels
    Follows Phase 29 D-20 key-naming precedent.

### Testing

- **D-21:** Unit tests colocated with the new `OfficeTermStep.tsx`. Cover: subtype-conditional rendering, at-least-one-EN/AR validation on `office_name`, required-country validation, auto-derivation of `is_current_term` from `term_end`, DossierPicker integration (country filter + org filter). Reuse test harnesses from PersonDetailsStep tests.
- **D-22:** E2E happy-path spec: open elected-officials list → click Create → fill 4 steps (Arabic-only office name in one run, English-only in another) → verify dossier appears in **both** Persons list and Elected Officials list (ELOF-03 success criterion). Extend existing wizard E2E harness from Phase 29-06.

### Claude's Discretion

- **Auto-derivation mechanism for `is_current_term`:** Planner may implement via client-side compute at submit OR via a `BEFORE INSERT/UPDATE` DB trigger. Trigger is more robust (handles subsequent edits automatically) but adds migration weight. Recommendation: trigger if one doesn't already exist; otherwise client-side. Cross-reference the 20260202000001 migration to confirm.
- **Office/Term step field grouping within the step:** Planner decides visual grouping (e.g., "Office" section, "Constituency" section, "Party" section, "Term" section, "Links" section) and whether to use a collapsible "More details" region. Default: single flat list with semantic spacing.
- **Exact DossierPicker prop signature** for the country/organization pickers — refer to Phase 29 D-01..D-05 usage in forum / WG / engagement wizards for the canonical form.
- **Whether to reuse `PersonReviewStep` or create `ElectedOfficialReviewStep`** — D-07 prescribes conditional rendering inside the existing component, but if the conditional branches balloon the file past ~200 lines, planner may extract a dedicated review component. Judgment call at implementation time.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 30 Requirements + Roadmap

- `.planning/ROADMAP.md` §"Phase 30: Elected Official Wizard" — Goal, depends-on (Phase 28), requirements mapping (ELOF-01..04), success criteria.
- `.planning/REQUIREMENTS.md` §"Elected Official Wizard" — Full ELOF-01..04 text.

### Wizard Infrastructure (Phase 26)

- `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts` — Shared wizard hook driving all type-specific wizards. No signature changes in Phase 30.
- `frontend/src/components/dossier/wizard/CreateWizardShell.tsx` — Shell that renders the step sequence. Consumes the `steps` array returned by per-type config.
- `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx` — Step 1 reused as-is for both standard person and elected-official flows.
- `frontend/src/components/dossier/wizard/schemas/base.schema.ts` — Base dossier schema merged into `person.schema.ts`.
- `frontend/src/components/dossier/wizard/defaults/index.ts` — Per-type defaults. Extended in D-17 with an elected-official variant.
- `frontend/src/components/dossier/wizard/config/types.ts` — Wizard config type definitions.
- `.planning/phases/26-shared-wizard-infrastructure/26-PATTERNS.md` — File Classification table; analog mappings including the (stubbed) `elected-official.schema.ts` entry.

### Person Wizard Template (Phase 28)

- `frontend/src/components/dossier/wizard/schemas/person.schema.ts` — Target for D-15 extension. Currently carries `title_en/ar`, `photo_url`, `biography_en/ar`, `person_subtype` (enum `standard | elected_official`).
- `frontend/src/components/dossier/wizard/config/person.config.ts` — Target for D-16 extension. Returns the step array for the Person wizard.
- `frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx` — Reused as-is as step 2. Bilingual-pair grid pattern that OfficeTermStep mirrors.
- `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` — Extended per D-07 to render office/term section conditionally.
- `.planning/phases/28-simple-type-wizards/28-CONTEXT.md` §D-02, D-04, D-09, D-10 — Person step structure, bilingual patterns, list-page Create button pattern.

### DossierPicker (Phase 29)

- `frontend/src/components/dossier/DossierPicker.tsx` — Component reused in D-12/D-13. Single-select config with `filterByDossierType`.
- `.planning/phases/29-complex-type-wizards/29-CONTEXT.md` §D-01..D-05 — DossierPicker usage precedents (filter-by-type, single vs multi select, required prop).

### Database Schema (Read Before Planning Migration)

- `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` — Authoritative schema for persons+elected-official columns. Contains the current `persons_elected_official_requires_office` CHECK constraint that D-19 relaxes, plus `persons_valid_term_dates`. Lists all office/party/term columns.
- `supabase/migrations/20260202000002_drop_elected_officials_table.sql` — Confirms the standalone `elected_officials` table was dropped; `persons` is now the authoritative source.
- `supabase/migrations/20260407000002_populate_diplomatic_seed.sql` §line 241..268 — Example rows showing the expected shape of elected-official persons (office_name, office_type, term_start, etc.).

### List Page Route (Target of D-18)

- `frontend/src/routes/_protected/dossiers/elected-officials/index.tsx` — Update Create button link per D-18.
- `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` — Already filters `person_subtype='elected_official'`; no changes required for ELOF-03.

### i18n (Target of D-20)

- `frontend/src/i18n/en/form-wizard.json` — Extend with `wizard.elected_official.*` keys.
- `frontend/src/i18n/ar/form-wizard.json` — Mirror EN additions with Arabic translations.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **CreateWizardShell + useCreateDossierWizard** (Phase 26) — Phase 30 needs no shell/hook changes. Subtype-aware step array comes from per-type config (D-16), which the shell consumes opaquely.
- **SharedBasicInfoStep, PersonDetailsStep, PersonReviewStep** — All three reused without modification for standard persons. PersonReviewStep gets one conditional block (D-07) for elected-official extras.
- **DossierPicker** — Single-select + `filterByDossierType` path is already used by Phase 29 wizards. No new variant.
- **FormWizardStep, FormField, Input, Textarea** — Standard form primitives used throughout the wizard.
- **useUploadStore** — Not needed for Phase 30 (no new file uploads).

### Established Patterns

- Bilingual input pair: `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">` with two `FormField`s (EN + AR), each with `writingDirection` handled via `useDirection()`. OfficeTermStep follows this pattern per D-08.
- Per-type config pattern (Phase 26): each type has `config/{type}.config.ts` returning the step array + labels. D-16 extends `person.config.ts` in place rather than adding `elected-official.config.ts` — consistent with Model B (one wizard).
- Post-creation navigation: `getDossierDetailPath()` used by every wizard to navigate to the newly created dossier's detail page. Elected officials route resolves to `/dossiers/elected-officials/:id` (which already exists per the route listing).
- List page Create button (Phase 28 D-10): `<Button asChild className="min-h-11 min-w-11 w-full sm:w-auto"><Link to="/dossiers/{type}/create">...</Link></Button>`. D-18 applies this exactly.

### Integration Points

- **Route tree regeneration** — adding `/dossiers/elected-officials/create` requires TanStack Router to regenerate (`@tanstack/router-vite-plugin` runs during `pnpm dev`). Phase 28 D-22 encountered the same requirement.
- **ElectedOfficialListTable** — already queries persons filtered by `person_subtype='elected_official'`. No changes; ELOF-03 "appears in both lists" is satisfied by existing queries on both list pages (persons list shows all; elected-officials list shows filtered).
- **Database constraint relaxation** — D-19 migration must be applied via Supabase MCP before frontend ships, or the client will produce rows the DB rejects if user fills only Arabic office_name. Coordinate rollout: migration first, then frontend deploy.
- **Auto-derivation of is_current_term** — chosen mechanism (client compute vs DB trigger) determines whether the migration in D-19 also adds a trigger. Planner flags this during planning.

</code_context>

<specifics>
## Specific Ideas

- User's framing of the entry-model question ("Add Person, and there is Add elected official .. how are we going to handle it?") led to Model B being chosen — explicitly named as the "variant" implementation that reads ELOF-01 most literally.
- User raised the partial-bilingual data reality directly: "sometimes the AR is available, sometimes EN is available". D-08 + D-19 solve this via the "at least one required" pattern and a constraint-relaxation migration, rather than forcing transliteration or blocking creation.
- User raised the broader cross-dossier linking question (forum attendance, WG membership, MoU signing) and was explicitly scope-redirected: Phase 30 links only via the two existing FK columns; unified person-to-dossier linking becomes a deferred idea.
- "One wizard, one code path" is a recurring user preference (also visible in the Phase 28 compositional wizards decision). Model B + extending `person.schema.ts`/`person.config.ts` in place honors this.

</specifics>

<deferred>
## Deferred Ideas

- **Unified person-to-dossier linking architecture** — a polymorphic `persons_linked_dossiers` junction table with a `relation_type` column (e.g., `attended_forum`, `member_of_wg`, `signed_mou`, `elected_official_of_country`) that replaces or supplements the direct FK columns. Would unify how all person relationships are modeled and queried. **New capability — belongs in its own phase.** Scope would include: migration, repository layer, detail page "Linked dossiers" section, and either deprecating or supplementing `country_id`/`organization_id`. Not blocked by Phase 30's narrow approach; Phase 30's FK-based linking coexists with future polymorphic linking.
- **Exposing `office_type`, `party_ideology`, `party_abbreviation`, `term_number` in the wizard** — these schema columns add richness but hurt progressive disclosure. Deferred to post-creation edit. If users report friction editing these after creation, revisit in a UX polish phase.
- **Cross-type wizard entry (create elected official AND link them to an existing forum / WG in one flow)** — explicitly out of scope per REQUIREMENTS.md "Out of Scope" table ("Cross-type wizard — Confusing UX, no user demand").
- **Committee assignments** (schema has `persons.committee_assignments JSONB` column) — not surfaced in any wizard. Future phase.

</deferred>

---

_Phase: 30-elected-official-wizard_
_Context gathered: 2026-04-17_
