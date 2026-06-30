---
phase: quick-260629-jkn
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [260629-jkn]
files_modified:
  - supabase/migrations/20260629000000_organizations_membership_representation.sql
  - frontend/src/services/dossier-api.ts
  - frontend/src/components/dossier/wizard/schemas/organization.schema.ts
  - frontend/src/components/dossier/wizard/defaults/index.ts
  - frontend/src/components/dossier/wizard/config/organization.config.ts
  - frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx
  - frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx
  - frontend/src/components/dossier/wizard/edit/build-edit-initial-values.ts
  - frontend/src/i18n/en/form-wizard.json
  - frontend/src/i18n/ar/form-wizard.json
  - frontend/src/types/dossier-overview.types.ts
  - frontend/src/services/dossier-overview.service.ts
  - frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx
  - frontend/src/pages/dossiers/overview-cards/GastatFocalPointsCard.tsx
  - frontend/src/pages/dossiers/OrganizationOverviewTab.tsx
  - frontend/src/i18n/en/dossier.json
  - frontend/src/i18n/ar/dossier.json

must_haves:
  truths:
    - 'Creating an org in the wizard captures membership type, importance, representation level, and 3 focal-point officers (responsible/alternate/support, each with EN+AR name + optional linked user)'
    - 'Those values persist to the organizations extension row and survive a page refresh'
    - 'Editing an existing org pre-fills the new fields and saves changes to them'
    - 'The org overview shows membership type + importance + representation level'
    - 'The org overview shows the 3 GASTAT focal points with their names'
    - 'Existing orgs (the 4 seed dossiers) still load with no regression; unset fields render empty, not broken'
    - 'Arabic UI renders the new labels and enum values in Arabic (no English fallback)'
  artifacts:
    - path: 'supabase/migrations/20260629000000_organizations_membership_representation.sql'
      provides: 'Additive nullable columns membership_type, importance, representation_level (text + NULL-tolerant CHECK) and gastat_focal_points (jsonb) on organizations'
      contains: 'ADD COLUMN IF NOT EXISTS gastat_focal_points'
    - path: 'frontend/src/components/dossier/wizard/config/organization.config.ts'
      provides: 'filterExtensionData composes the 3 enums + gastat_focal_points jsonb into extensionData'
      contains: 'gastat_focal_points'
    - path: 'frontend/src/services/dossier-overview.service.ts'
      provides: 'fetchOrganizationProfile section fetcher reading the organizations extension row'
      contains: 'organization_profile'
    - path: 'frontend/src/pages/dossiers/overview-cards/GastatFocalPointsCard.tsx'
      provides: 'Overview card rendering the 3 focal-point officers'
      min_lines: 40
  key_links:
    - from: 'OrgDetailsStep.tsx form fields'
      to: 'organizations extension columns'
      via: 'filterExtensionData -> extensionData -> dossiers-create generic insert / update_dossier_with_extension generic RPC'
      pattern: 'gastat_focal_points'
    - from: 'dossier-overview.service.ts fetchOrganizationProfile'
      to: 'MembershipStructureCard + GastatFocalPointsCard'
      via: 'data.organization_profile via useDossierOverview includeSections'
      pattern: 'organization_profile'
---

<objective>
Add an Organization "membership & representation" profile so the legacy GASTAT
organizations directory (~70 orgs) can import with full fidelity and the
existing-but-hollow org overview cards become meaningful.

Four additive fields land on the `organizations` extension table:
`membership_type`, `importance`, `representation_level` (text + NULL-tolerant
CHECK) and `gastat_focal_points` (jsonb holding responsible / alternate /
support officers). They are captured in the org create + edit wizard and
surfaced on the organization overview tab.

Purpose: unblock loading a UK/ONS data slice next by giving organizations a
real engagement profile instead of empty cards.

Output: one idempotent migration (applied to staging + committed) plus the
frontend write path (wizard, types, edit pre-fill) and read path (overview
service + cards), all bilingual.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md

Branch: `feat/260629-org-membership-representation` (already checked out). NO
worktree isolation — run all three tasks sequentially in this working tree.
Staging Supabase project: `zkrcjzdemdmwhearhfgg`.
</execution_context>

<context>
@CLAUDE.md
@frontend/CLAUDE.md
@supabase/CLAUDE.md

# Write path (verified — do NOT re-explore):

@frontend/src/components/dossier/wizard/config/organization.config.ts
@frontend/src/components/dossier/wizard/schemas/organization.schema.ts
@frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx
@frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx
@frontend/src/components/dossier/wizard/edit/build-edit-initial-values.ts
@frontend/src/components/forms/UserPicker.tsx

# Read path (verified):

@frontend/src/services/dossier-overview.service.ts
@frontend/src/types/dossier-overview.types.ts
@frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx
@frontend/src/pages/dossiers/overview-cards/KeyRepresentativesCard.tsx
@frontend/src/pages/dossiers/OrganizationOverviewTab.tsx

<architecture_facts>
VERIFIED data flow — the executor MUST rely on these and not modify the dead path:

1. CREATE: route create.tsx -> useCreateDossierWizard(organizationWizardConfig)
   -> useCreateDossier -> createDossier() -> POST dossiers-create edge fn, which
   does a GENERIC `.from('organizations').insert({ id, ...body.extensionData })`.
   => Adding keys to filterExtensionData is sufficient; the create edge fn needs
   NO change.

2. UPDATE: DossierEditWizard -> useEditDossierWizard -> updateDossier() -> POST
   dossiers-update edge fn -> update_dossier_with_extension(p_id, p_base,
   p_extension) RPC. That RPC is FULLY GENERIC: it builds the column list from
   jsonb_object_keys(p_extension) and writes via
   jsonb_populate_record(NULL::public.organizations, $1), which casts each value
   to the real column type (text/jsonb). => The RPC needs NO change.

3. OVERVIEW: useDossierOverview -> fetchDossierOverview (CLIENT-SIDE service in
   dossier-overview.service.ts, NOT an edge fn). It composes sections via direct
   supabase queries; fetchDossierCore reads `dossiers` only and never touches the
   organizations extension. => A new section fetcher is required.

4. DO NOT TOUCH supabase/functions/organizations-create (it reads a different,
   legacy `cd_organizations` table and is NOT on the wizard path).

So the ONLY backend change is the migration. New columns flow through both the
generic create insert and the generic update RPC automatically.
</architecture_facts>

<interfaces>
<!-- Contracts the executor implements against. Use these verbatim. -->

organizations extension table — existing columns (keyed by dossier id):
id, org_code, org_type, headquarters_country_id, parent_org_id, website,
email, phone, address_en, address_ar, logo_url, established_date, is_seed_data

NEW columns to add (all additive, nullable):
membership_type text CHECK (NULL OR IN board_of_directors|member|participant|counterpart_agency)
importance text CHECK (NULL OR IN high|medium|low)
representation_level text CHECK (NULL OR IN president|specialist)
gastat_focal_points jsonb -- { responsible?: Focal, alternate?: Focal, support?: Focal }
-- Focal = { name_en?: string, name_ar?: string, user_id?: uuid }

Frontend OrganizationExtension (dossier-api.ts) gains:
membership_type?: 'board_of_directors' | 'member' | 'participant' | 'counterpart_agency'
importance?: 'high' | 'medium' | 'low'
representation_level?: 'president' | 'specialist'
gastat_focal_points?: {
responsible?: { name_en?: string; name_ar?: string; user_id?: string }
alternate?: { name_en?: string; name_ar?: string; user_id?: string }
support?: { name_en?: string; name_ar?: string; user_id?: string }
}

Wizard form fields (flat — schema + defaults + reverse-map all use these):
membership_type, importance, representation_level (optional string enums, '' default)
responsible_name_en, responsible_name_ar, responsible_user_id
alternate_name_en, alternate_name_ar, alternate_user_id
support_name_en, support_name_ar, support_user_id (all string, '' default)

Overview response addition (dossier-overview.types.ts):
type OrganizationFocalPoint = { name_en: string | null; name_ar: string | null; user_id: string | null }
interface OrganizationProfileSection {
membership_type: 'board_of_directors'|'member'|'participant'|'counterpart_agency'|null
importance: 'high'|'medium'|'low'|null
representation_level: 'president'|'specialist'|null
focal_points: {
responsible: OrganizationFocalPoint | null
alternate: OrganizationFocalPoint | null
support: OrganizationFocalPoint | null
}
}
// add 'organization_profile' to DossierOverviewSection union
// add `organization_profile: OrganizationProfileSection | null` to DossierOverviewResponse
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migration — add membership & representation columns to organizations</name>
  <files>supabase/migrations/20260629000000_organizations_membership_representation.sql</files>
  <action>
Create the migration file adding four additive, nullable columns to
`public.organizations` (the dossier extension table keyed by dossier id), then
apply it to staging `zkrcjzdemdmwhearhfgg` via the Supabase MCP
(`mcp__supabase__apply_migration`) per the house rule, and keep the repo file.

Columns (use `ADD COLUMN IF NOT EXISTS` for idempotency):

- `membership_type text`
- `importance text`
- `representation_level text`
- `gastat_focal_points jsonb`

Add three NULL-tolerant CHECK constraints, each guarded inside a `DO $$ ... $$`
block that first checks `pg_constraint` by name so re-running is safe:

- `organizations_membership_type_check`: `membership_type IS NULL OR membership_type IN ('board_of_directors','member','participant','counterpart_agency')`
- `organizations_importance_check`: `importance IS NULL OR importance IN ('high','medium','low')`
- `organizations_representation_level_check`: `representation_level IS NULL OR representation_level IN ('president','specialist')`

Add `COMMENT ON COLUMN` for each new column describing intent (esp. the
`gastat_focal_points` shape `{responsible,alternate,support}` of
`{name_en,name_ar,user_id?}`).

No RLS policy work: these are columns on the already-RLS'd `organizations` row
and inherit its policy. Do NOT add a new policy. Do NOT alter any edge function
or the `update_dossier_with_extension` RPC — both write paths are generic and
pick up new columns automatically (see architecture*facts). Do NOT touch the
legacy `organizations-create` / `cd_organizations` function.
</action>
<verify>
<automated>Via Supabase MCP execute_sql, confirm all four columns exist: `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name IN ('membership_type','importance','representation_level','gastat_focal_points');` returns 4 rows. Then confirm the three CHECK constraints exist: `SELECT conname FROM pg_constraint WHERE conrelid='public.organizations'::regclass AND conname LIKE 'organizations*%\_check';` includes the membership_type/importance/representation_level checks.</automated>
</verify>
<done>Four nullable columns present on organizations with NULL-tolerant CHECKs; migration is idempotent (re-run is a no-op); existing org dossier reads are unaffected (additive only); repo migration file committed alongside the applied change.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Wizard write path + edit pre-fill + types + wizard i18n</name>
  <files>frontend/src/services/dossier-api.ts, frontend/src/components/dossier/wizard/schemas/organization.schema.ts, frontend/src/components/dossier/wizard/defaults/index.ts, frontend/src/components/dossier/wizard/config/organization.config.ts, frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx, frontend/src/components/dossier/wizard/review/OrganizationReviewStep.tsx, frontend/src/components/dossier/wizard/edit/build-edit-initial-values.ts, frontend/src/i18n/en/form-wizard.json, frontend/src/i18n/ar/form-wizard.json</files>
  <action>
Wire the new profile through the org create + edit wizard. Follow the existing
flat-field + filterExtensionData pattern exactly (org_code/website all use the
`value !== '' ? value : undefined` omit-empty idiom).

1. dossier-api.ts: extend the `OrganizationExtension` interface with the four
   typed fields from the interfaces block (the 3 string-literal enums + the
   `gastat_focal_points` nested shape).

2. organization.schema.ts: add to `organizationFields` — `membership_type`,
   `importance`, `representation_level` as optional string-literal `z.enum`s that
   also accept `''` (mirror the `org_type ... .or(z.literal(''))` style but
   keep them OPTIONAL), and the nine flat officer string fields
   (`responsible_name_en/_ar/_user_id`, `alternate_*`, `support_*`) as
   `z.string().optional()`.

3. defaults/index.ts: add all twelve new fields to `organizationDefaults` with
   `''` defaults (enums as `'' as OrganizationFormData['membership_type']` to
   match the existing `org_type` cast) so every input is controlled.

4. organization.config.ts `filterExtensionData`: add `membership_type`,
   `importance`, `representation_level` using the omit-empty idiom. Compose
   `gastat_focal_points` from the flat officer fields: build a role object
   (`responsible`/`alternate`/`support`) only when that role has at least one
   non-empty sub-field, each value `{ name_en, name_ar, ...(user_id ? {user_id} : {}) }`
   with empties dropped; include the `gastat_focal_points` key only when at least
   one role object is present (omit-empty, consistent with the other fields).

5. OrgDetailsStep.tsx: append an "Engagement profile" section after the founding
   date. Three `Select`s (membership type, importance, representation level)
   mirroring the existing `org_type` Select pattern, each option label from
   `form-wizard:organization.<group>.<value>`. Then a "GASTAT focal points"
   subsection with three officer groups (responsible/alternate/support); each
   group = an EN name `Input`, an AR name `Input` (`dir={direction}` like
   `headquarters_ar`), and an OPTIONAL `UserPicker` (import from
   `@/components/forms/UserPicker`) bound to the `*_user_id` field
   (`onChange={(id) => field.onChange(id ?? '')}`). Use a
   `grid grid-cols-1 sm:grid-cols-2 gap-4` for the name pair. Logical properties
   only; no textAlign:right; min-h-11 on inputs.

6. OrganizationReviewStep.tsx: add a third `ReviewSection` ("Engagement profile",
   onEdit -> step 1) with `ReviewField`s for the three enums (translated values)
   and the three officer names (show AR name when present else EN, or both).

7. build-edit-initial-values.ts `buildExtensionValues` case `'organization'`:
   reverse-map the new columns back to the flat form fields — the 3 enums from
   `ext.membership_type/importance/representation_level` (`?? ''`), and decompose
   `ext.gastat_focal_points` into the nine `*_name_en/_name_ar/_user_id` strings
   (guard for missing roles; use the existing `str()` helper).

8. i18n form-wizard.json (EN + AR, mirror the existing `organization.*` block in
   BOTH files): add `engagement_profile` section heading; `membership_type` +
   `membership_type_ph` + `membership_types.{board_of_directors,member,participant,counterpart_agency}`;
   `importance` + `importance_ph` + `importances.{high,medium,low}`;
   `representation_level` + `representation_level_ph` +
   `representation_levels.{president,specialist}`; `focal_points` heading +
   `focal_responsible`/`focal_alternate`/`focal_support` labels +
   `focal_name_en_ph`/`focal_name_ar_ph`/`focal_user_ph` placeholders. Sentence
   case, no emoji, no marketing voice. AR values must be real Arabic (an
   unregistered/missing key silently falls back to English).
   </action>
   <verify>
   <automated>pnpm --filter frontend type-check</automated>
   <automated>pnpm --filter frontend lint</automated>
   </verify>
   <done>Org create wizard renders the Engagement-profile section (3 selects + 3 officer groups with optional UserPicker); submitting persists the enums + gastat_focal_points to the organizations row; the edit wizard pre-fills them; the review step shows them; EN+AR keys exist in both form-wizard.json files; type-check and lint (incl. check-i18n-namespaces) pass.</done>
   </task>

<task type="auto" tdd="false">
  <name>Task 3: Overview read path + cards + overview i18n</name>
  <files>frontend/src/types/dossier-overview.types.ts, frontend/src/services/dossier-overview.service.ts, frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx, frontend/src/pages/dossiers/overview-cards/GastatFocalPointsCard.tsx, frontend/src/pages/dossiers/OrganizationOverviewTab.tsx, frontend/src/i18n/en/dossier.json, frontend/src/i18n/ar/dossier.json</files>
  <action>
Surface the new org fields on the organization overview. The overview is
composed client-side (no edge fn) — add a new section fetcher.

1. dossier-overview.types.ts: add `OrganizationFocalPoint` and
   `OrganizationProfileSection` (shapes in the interfaces block); add
   `'organization_profile'` to the `DossierOverviewSection` union; add
   `organization_profile: OrganizationProfileSection | null` to
   `DossierOverviewResponse`.

2. dossier-overview.service.ts: add a raw row interface + a
   `fetchOrganizationProfile(dossierId)` that does
   `supabase.from('organizations').select('membership_type, importance, representation_level, gastat_focal_points').eq('id', dossierId).maybeSingle()`,
   throwing `DossierOverviewAPIError` on a real PostgREST error (mirror the other
   fetchers' OVRERR-01 contract) and returning `null` when there is no row.
   Normalize `gastat_focal_points` jsonb into `focal_points` with each role
   `null` when absent (sub-fields default to `null`). In `fetchDossierOverview`,
   gate it on `include_sections.includes('organization_profile')` (resolve to
   `null` otherwise) and add it to the returned object. Do NOT add
   `'organization_profile'` to the DEFAULT include list — only the org cards opt
   in, so other dossier types never query the table.

3. MembershipStructureCard.tsx: add `'organization_profile'` to `includeSections`
   alongside `'related_dossiers'`. Above (or below) the existing relationship
   counts, render a compact profile block: rows for membership type, importance,
   and representation level, each value translated via
   `dossier:overview.membership.membershipTypes.<v>` /
   `importances.<v>` / `representationLevels.<v>`. Render a row only when its
   value is non-null; if the whole `organization_profile` is null/empty, keep the
   existing empty behavior. Reuse the existing token classes; no raw hex.

4. GastatFocalPointsCard.tsx (NEW, PascalCase to match the directory): a small
   card following the MembershipStructureCard/KeyRepresentativesCard skeleton
   (same loading Skeleton, the `isError && data === null` alert block, the
   `bg-card rounded-lg border p-4 sm:p-6` shell, `dir`/isRTL). Call
   `useDossierOverview(dossierId, { includeSections: ['organization_profile'] })`.
   Render the three roles (responsible/alternate/support) in order; for each
   present officer show the name (`isRTL && name_ar ? name_ar : (name_en ?? name_ar)`)
   with a muted role label from `dossier:overview.focalPoints.<role>`. Title from
   `dossier:overview.focalPoints.title`; empty state
   `dossier:overview.focalPoints.empty` when no officers. Explicit `React.ReactElement`
   return type, no `any`.

5. OrganizationOverviewTab.tsx: import and mount `<GastatFocalPointsCard
dossierId={dossierId} />` after `<KeyRepresentativesCard />` in the grid.

6. i18n dossier.json (EN + AR, both files): under `overview.membership` add
   `membershipType`, `importance`, `representationLevel` labels and the three
   value maps `membershipTypes`/`importances`/`representationLevels`; add a new
   `overview.focalPoints` block with `title`, `responsible`, `alternate`,
   `support`, `empty`. Real Arabic in the AR file. Sentence case, no emoji.
   </action>
   <verify>
   <automated>pnpm --filter frontend type-check</automated>
   <automated>pnpm --filter frontend lint</automated>
   <automated>pnpm --filter frontend build</automated>
   </verify>
   <done>The organization overview tab shows membership type + importance + representation level on the Membership card and the three GASTAT focal points on a new card; non-org dossiers never query the organizations table; EN+AR keys exist in both dossier.json files; type-check, lint, and build pass.</done>
   </task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                                                  | Description                                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| wizard client → dossiers-create / dossiers-update edge fn | User-supplied enum + jsonb officer data crosses here (JWT-scoped, RLS-enforced). |
| edge fn → organizations row (RLS)                         | Writes run as the caller under the existing organizations RLS policy.            |

## STRIDE Threat Register

| Threat ID | Category               | Component                                                        | Disposition | Mitigation Plan                                                                                                                                                   |
| --------- | ---------------------- | ---------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-jkn-01  | Tampering              | membership_type / importance / representation_level text columns | mitigate    | NULL-tolerant CHECK constraints reject any out-of-set value at the DB; the generic RPC casts via jsonb_populate_record so types are enforced.                     |
| T-jkn-02  | Tampering              | gastat_focal_points jsonb                                        | accept      | Free-form name strings + optional user_id; jsonb_populate_record casts the column; no executable content, rendered as text only (no dangerouslySetInnerHTML).     |
| T-jkn-03  | Information disclosure | new columns on organizations                                     | accept      | Columns inherit the existing organizations RLS row policy; no new policy, no new read surface, no PII beyond officer names (already org-directory data).          |
| T-jkn-04  | Elevation of privilege | update_dossier_with_extension RPC                                | accept      | Unchanged; SECURITY INVOKER keeps caller RLS in force on the new columns exactly as for existing ones. No package installs in this plan (no supply-chain vector). |

</threat_model>

<verification>
After all three tasks (executor runs in the feat branch working tree):

1. `pnpm --filter frontend type-check` — clean.
2. `pnpm --filter frontend lint` — clean (includes ESLint RTL/token rules + check-i18n-namespaces.mjs).
3. `pnpm --filter frontend build` — succeeds.
4. Migration columns + CHECKs present on staging (Task 1 SQL checks).
5. Manual (optional, not gating): create an org with profile + officers → refresh → values persist and show on the overview tab; edit the org → fields pre-filled; flip to Arabic (topbar ع) → new labels/values render in Arabic.
   </verification>

<success_criteria>

- organizations has membership_type, importance, representation_level (NULL-tolerant CHECK) + gastat_focal_points (jsonb), applied to staging and committed as a repo migration.
- Org create + edit wizard captures and persists all four via the existing generic write paths (no edge-fn or RPC change).
- Organization overview shows membership type + importance + representation level and the three GASTAT focal points.
- No regression for the 4 existing seed org dossiers; bilingual (EN + AR) with no English fallback for the new strings.
- type-check, lint, and build all pass.
  </success_criteria>

<output>
Create `.planning/quick/260629-jkn-org-membership-representation/260629-jkn-SUMMARY.md` when done.
</output>
