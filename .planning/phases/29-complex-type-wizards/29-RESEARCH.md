# Phase 29: Complex Type Wizards — Research

**Researched:** 2026-04-16
**Domain:** React 19 + TanStack Router/Query wizards over Supabase Postgres; RTL-first bilingual UX
**Confidence:** HIGH on schema facts, HIGH on wizard-infrastructure reuse, MEDIUM on exact list-page Create-button placement (Phase 28 precedent must be mirrored but not copy-pasted here).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Multi-Select DossierPicker (Area 1)**

- **D-01**: Extend `frontend/src/components/work-creation/DossierPicker.tsx` in place with optional `multiple?: boolean` + `values?: string[]` + `onValuesChange?: (ids: string[]) => void`. Single-select path unchanged when `multiple` is absent.
- **D-02**: Selected-dossier chips render as an inline row beneath the combobox input with name + type icon + remove (×). Horizontal scroll on mobile.
- **D-03**: Widen `filterByDossierType` to accept `DossierType | DossierType[]`. Backwards compatible.
- **D-04**: No hard cap on selections.

**Engagement Participants Step (Area 2)**

- **D-05**: Three labeled sections — Countries / Organizations / Persons — one multi-select DossierPicker per type.
- **D-06**: No required minimum participants — all three may be empty.
- **D-07**: Disjoint types → no dedupe logic.
- **D-08**: Per-section chip horizontal scroll; RTL auto-flip.

**Forum / WG Link Persistence (Area 3)**

- **D-09**: Dedicated FK on the entity's own table. Forum → existing `forums.organizing_body`. WG → NEW migration to add `working_groups.parent_body_id`. Do NOT write to `dossier_relationships` junction.
- **D-10**: Forum organizing body optional.
- **D-11**: WG parent body optional.
- **D-12**: WG parent-body filter: `organization` only.

**Type-Specific Field Shapes (Area 4)**

- **D-13**: Engagement `type` from live `engagement_dossiers_engagement_type_check` (must include `forum_session`). Bilingual single-select dropdown.
- **D-14**: Engagement `category` = curated list: `diplomatic`, `economic`, `security`, `cultural`, `technical`, `humanitarian`, `other`.
- **D-15**: Location = single bilingual pair `location_en` + `location_ar`. Free text only.
- **D-16**: WG mandate = SharedBasicInfo's stacked EN→AR pattern with `writingDirection: 'rtl'` on Arabic textarea.

**Step Structure**

- **D-17..D-19**: Forum 3 steps; WG 3 steps; Engagement 4 steps (with Participants as step 3).
- **D-20**: Review steps follow Phase 27 D-05 grouped-summary-cards pattern with per-section Edit jumps.

**List Page Integration & Routes**

- **D-21**: Phase 28 D-10 Create-button pattern replicated on Forums, WG, Engagements list pages.
- **D-22**: Routes `/_protected/dossiers/{forums,working_groups,engagements}/create`.
- **D-23**: Post-create → `getDossierDetailPath()`.

**Validation & Drafts**

- **D-24**: localStorage keys `dossier-create-forum`, `dossier-create-working_group`, `dossier-create-engagement`.
- **D-25**: No AI auto-fill.
- **D-26**: Step-level validation only; all link fields may be empty.

### Claude's Discretion

- WG status enum: `active`, `inactive`, `forming`, `dissolved` — subject to live-constraint reconciliation (see finding §2).
- Engagement `scheduled_date` picker: only if `engagement_dossiers` already exposes a scheduled/start column (it does — `start_date`, see §2).
- i18n bilingual labels under `wizard.forum.*`, `wizard.working_group.*`, `wizard.engagement.*` in `form-wizard.json`.
- DossierPicker multi-select test coverage.

### Deferred Ideas (OUT OF SCOPE)

- CreateDossierHub at `/dossiers/create` (UX-01) — Phase 31.
- Contextual guidance/hints per step (UX-02) — Phase 31.
- Legacy monolithic `DossierCreateWizard.tsx` removal — Phase 31.
- Elected Official wizard (ELOF-01..04) — Phase 30.
- Structured location / map picker for engagements.
- `dossier_relationships` junction writes from the wizard.
- Participants minimum validation.
- DossierPicker selection hard cap.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                | Research Support                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FORUM-01 | 3-step wizard (Basic Info → Forum Details → Review)                                        | §5 Forum config; existing wizard infra (Phase 26) + Phase 27/28 precedent                                                                                                       |
| FORUM-02 | Forum Details includes DossierPicker for organizing body (organization)                    | §2 `forums.organizing_body` FK already exists to `organizations(id)`; §4 DossierPicker single-select path unchanged                                                             |
| FORUM-03 | Accessible from Forums list page                                                           | §5 list-route Create-button integration                                                                                                                                         |
| WG-01    | 3-step wizard (Basic Info → WG Details → Review)                                           | §5 WG config                                                                                                                                                                    |
| WG-02    | WG Details captures status, established_date, mandate_en/ar, parent body via DossierPicker | §2 `working_groups` has status enum (`active`/`inactive`/`pending`/`suspended`); must ADD `parent_body_id`; `established_date` exists on base dossier OR must be added — see §3 |
| WG-03    | Accessible from Working Groups list page                                                   | §5 list-route Create-button                                                                                                                                                     |
| ENGM-01  | 4-step wizard (Basic Info → Engagement Details → Participants → Review)                    | §5 Engagement config                                                                                                                                                            |
| ENGM-02  | Engagement Details captures type, category, location (bilingual)                           | §2 `engagement_dossiers.engagement_type` + `engagement_category` + `location_en/ar` all exist; live engagement_type enum locked in §2                                           |
| ENGM-03  | Participants step multi-selects countries, organizations, persons                          | §4 DossierPicker multi-select; §6 persist into `engagement_participants`                                                                                                        |
| ENGM-04  | Multi-select variant supports filtering by dossier type                                    | §4 extend `filterByDossierType` to `DossierType \| DossierType[]` (D-03)                                                                                                        |
| ENGM-05  | Accessible from Engagements list page                                                      | §5 list-route Create-button                                                                                                                                                     |

</phase_requirements>

## Executive Summary

Phase 29 ships three type-specific dossier-creation wizards (Forum, Working Group, Engagement) plus the multi-select variant of the existing `DossierPicker`. The wizard infrastructure (Phase 26), the review pattern (Phase 27), and the config-driven per-type shape (Phase 28) are all in place and reused verbatim — this phase is 80% composition / 15% new UI (the Participants step + multi-select chips) / 5% schema (one `ALTER TABLE` on `working_groups`).

**Primary recommendation:** Add `working_groups.parent_body_id UUID NULL` FK to `dossiers(id)` in a new migration; extend `DossierPicker` in place with `multiple`/`values`/`onValuesChange` and widen `filterByDossierType` to accept arrays; create three configs under `config/`, three detail steps under `steps/`, three review steps under `review/`, and three `create.tsx` routes under `_protected/dossiers/{type}/create`. Persist engagement participants by inserting one row per selected dossier into the existing `engagement_participants` table with `participant_type` = `country|organization|person` and `role='delegate'` (or `'other'`).

**Risks:** (1) `forums.organizing_body` column ships in an alternate migration path that differs from the column-set in `006_create_forums.sql` — we must confirm which schema is live in staging. (2) `working_groups.status` check-constraint values (`active`, `inactive`, `pending`, `suspended`) do NOT match the discretion-default `active`/`inactive`/`forming`/`dissolved` — the planner MUST reconcile. (3) `form-wizard.json` currently has **zero** `wizard.*` keys — the shared wizards use flat keys; researcher must decide whether Phase 29 adds the `wizard.{type}.*` nesting or follows the existing flat-key convention.

## Architectural Responsibility Map

| Capability                                    | Primary Tier                       | Secondary Tier                                        | Rationale                                                 |
| --------------------------------------------- | ---------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Wizard form state + validation                | Browser / Client                   | —                                                     | React Hook Form + Zod; no server involvement until submit |
| Draft persistence                             | Browser / Client (localStorage)    | —                                                     | `useFormDraft` already solves this                        |
| Dossier autocomplete / search (DossierPicker) | API / Backend                      | Browser / Client (debounce + recents in localStorage) | Uses `autocompleteDossiers` API                           |
| Wizard submission                             | API / Backend (Supabase)           | Database / Storage                                    | `useCreateDossier` mutation; base + extension row insert  |
| Engagement participants write                 | API / Backend                      | Database / Storage                                    | Insert N rows into `engagement_participants` table        |
| Forum/WG link FK write                        | Database / Storage                 | API / Backend                                         | Single column on extension table, set during create       |
| Post-create navigation                        | Browser / Client (TanStack Router) | —                                                     | `getDossierDetailPath()`                                  |
| Bilingual i18n                                | Browser / Client                   | —                                                     | i18next `form-wizard` namespace                           |

## Project Constraints (from CLAUDE.md)

- **RTL-first**: `forceRTL(true)` (mobile) / `dir={isRTL ? 'rtl' : 'ltr'}` (web). JSX order in `flex-row` = Arabic reading order. `alignItems: 'flex-start'` for column right-alignment. NEVER `textAlign: 'right'`. `writingDirection: 'rtl'` on Arabic text fields only.
- **Logical properties**: `ms-*` / `me-*` / `ps-*` / `pe-*` / `text-start` / `text-end` / `rounded-s-*` / `rounded-e-*`. NEVER `ml-*`/`mr-*`/`pl-*`/`pr-*`/`text-left`/`text-right`.
- **Mobile-first**: base (0-640) → sm (640+) → md (768+) → lg (1024+); min touch target `min-h-11 min-w-11` (44×44).
- **HeroUI v3 first**, then Aceternity → Kibo-UI → shadcn. HeroUI compound components: `Card.Header`, `Modal.Body`. Tailwind v4.
- **Dossier-centric**: use `getDossierRouteSegment`, `isValidDossierType` utilities; the 8-type dossier list (country, organization, forum, engagement, topic, working_group, person, elected_official) is the canonical enum.
- **TypeScript**: strict mode, explicit return types, no `any`, no floating promises. Single-quote, no semi, 2-space, 100-col.
- **Testing**: Vitest (unit/integration), Playwright (E2E), @testing-library/react, axe-core. Existing wizard tests live under `frontend/src/components/dossier/wizard/**/__tests__/`.
- **Supabase**: migrations applied via Supabase MCP against project `zkrcjzdemdmwhearhfgg` (Intl-Dossier staging).

## 1. Confirmed DB Schema State

### 1.1 `engagement_dossiers` — ALL required columns already exist

From `supabase/migrations/20260110000006_create_engagement_dossiers.sql`:

| Column                                                           | Type                                  | Notes                                                  |
| ---------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| `id`                                                             | UUID PK                               | FK → `dossiers(id)` ON DELETE CASCADE                  |
| `engagement_type`                                                | TEXT NOT NULL                         | CHECK list — see §1.2                                  |
| `engagement_category`                                            | TEXT NOT NULL                         | CHECK list — see §1.3                                  |
| `start_date`                                                     | TIMESTAMPTZ **NOT NULL**              | **⚠ NOT-NULL** — wizard MUST supply or drop constraint |
| `end_date`                                                       | TIMESTAMPTZ **NOT NULL**              | **⚠ NOT-NULL** — same                                  |
| `timezone`                                                       | TEXT NOT NULL DEFAULT `'Asia/Riyadh'` | Safe default                                           |
| `location_en`                                                    | TEXT NULL                             |                                                        |
| `location_ar`                                                    | TEXT NULL                             |                                                        |
| `venue_en/ar`, `is_virtual`, `virtual_link`                      | nullable                              | Not used by wizard                                     |
| `host_country_id`                                                | UUID NULL → `dossiers(id)`            | Not written by wizard                                  |
| `host_organization_id`                                           | UUID NULL → `dossiers(id)`            | Not written by wizard                                  |
| `delegation_size/level`, `objectives_*`, `outcomes_*`, `notes_*` | nullable                              | Not used by wizard                                     |
| `engagement_status`                                              | TEXT NOT NULL DEFAULT `'planned'`     | Safe default                                           |

**⚠ Blocker — planner must address:** `start_date` / `end_date` are NOT NULL. The Claude's-discretion "optional scheduled_date picker" cannot ship as-is without either (a) adding an `EngagementDetailsStep` pair of date pickers that are required for submission, or (b) a migration that makes `start_date`/`end_date` nullable. **Recommendation:** add `start_date` + `end_date` as required date-time fields on the Engagement Details step (matches existing CHECK on `start_date <= end_date` if one exists) — this keeps the live DB schema intact and gives users a realistic engagement record.

### 1.2 `engagement_type` CHECK constraint — LIVE VALUES (confirmed)

From `supabase/migrations/20260329000002_add_forum_session_support.sql` (most recent constraint replacement):

```
'bilateral_meeting','mission','delegation','summit','working_group',
'roundtable','official_visit','consultation','forum_session','other'
```

**10 values.** i18n label suggestions (EN / AR):

| key               | EN                | AR            |
| ----------------- | ----------------- | ------------- |
| bilateral_meeting | Bilateral Meeting | لقاء ثنائي    |
| mission           | Mission           | بعثة          |
| delegation        | Delegation        | وفد           |
| summit            | Summit            | قمة           |
| working_group     | Working Group     | فريق عمل      |
| roundtable        | Roundtable        | طاولة مستديرة |
| official_visit    | Official Visit    | زيارة رسمية   |
| consultation      | Consultation      | مشاورات       |
| forum_session     | Forum Session     | جلسة منتدى    |
| other             | Other             | أخرى          |

### 1.3 `engagement_category` CHECK — LIVE VALUES (confirmed)

```
'diplomatic','statistical','technical','economic','cultural',
'educational','research','other'
```

**⚠ Mismatch with D-14:** CONTEXT.md D-14 specifies `diplomatic`, `economic`, `security`, `cultural`, `technical`, `humanitarian`, `other`. The LIVE constraint has `statistical`/`educational`/`research` but NOT `security`/`humanitarian`. **Planner MUST choose:** (a) migrate the CHECK to the D-14 list, or (b) keep the live list and amend D-14. Recommend option (b) — the existing list is already populated via `20260407000002_populate_diplomatic_seed.sql`, so migrating the CHECK risks orphaning rows. **Flag this back to the user during plan-checker.**

### 1.4 `working_groups` — current schema

From `supabase/migrations/20260110000006_working_groups_entity.sql`:

- `status` CHECK: `'active'`, `'inactive'`, `'pending'`, `'suspended'` — NOT `forming`/`dissolved`. **⚠ Planner must amend discretion default to match live values** (use `active`, `inactive`, `pending`, `suspended`).
- `parent_forum_id UUID NULL → forums(id)` already exists.
- **`parent_body_id` does NOT exist.** D-09 requires a NEW migration: `ADD COLUMN parent_body_id UUID NULL REFERENCES dossiers(id) ON DELETE SET NULL`.
- `established_date` is NOT on `working_groups` — base `dossiers` table owns any such field. Planner MUST confirm base schema before wiring; otherwise add `established_date DATE NULL` to `working_groups` in the same migration as `parent_body_id`.
- `wg_type`, `meeting_frequency`, `description_en/ar` all already exist — not used by the lightweight wizard.

### 1.5 `forums` — schema divergence

Two migrations exist:

- `006_create_forums.sql` — creates `forums` with `forum_type` / `agenda` / `speakers` / `capacity` / `registration_*`. **No `organizing_body` column.**
- `033_update_forum_details_view.sql` line 25: `LEFT JOIN public.organizations org ON f.organizing_body = org.id` — assumes `forums.organizing_body UUID → organizations(id)` exists.
- `20251022000002_create_extension_tables.sql` line 62 also creates `forums` (alternate schema).

**⚠ Investigation required:** Planner/executor must run `SELECT column_name FROM information_schema.columns WHERE table_name = 'forums'` against staging via Supabase MCP to confirm whether `organizing_body` is present. If present → D-09 stands (no migration). If absent → Phase 29 must add it: `ALTER TABLE forums ADD COLUMN organizing_body UUID NULL REFERENCES organizations(id) ON DELETE SET NULL;`.

### 1.6 `engagement_participants` — already exists, ready to accept wizard writes

From same migration:

| Column                   | Role in wizard                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `id`                     | gen_random_uuid() default                                                             |
| `engagement_id`          | FK → `engagement_dossiers(id)` ON DELETE CASCADE — the new dossier's id               |
| `participant_type`       | `'country'` / `'organization'` / `'person'` — maps to the three multi-select sections |
| `participant_dossier_id` | FK → `dossiers(id)` ON DELETE CASCADE — the selected dossier's id                     |
| `external_*`             | NULL (wizard only uses dossier refs)                                                  |
| `role`                   | Required — use `'delegate'` default (or a new neutral value)                          |
| `attendance_status`      | Default `'expected'` — fine                                                           |

Insert pattern per selected dossier:

```sql
INSERT INTO engagement_participants
  (engagement_id, participant_type, participant_dossier_id, role)
VALUES
  ($1, 'country'|'organization'|'person', $2, 'delegate');
```

## 2. Required Migrations

### Migration A — Working Group parent body FK (D-09)

**File name (suggested):** `YYYYMMDDHHMMSS_phase29_wg_parent_body.sql`

```sql
-- Phase 29: Working Group parent body link
ALTER TABLE working_groups
  ADD COLUMN IF NOT EXISTS parent_body_id UUID NULL
    REFERENCES dossiers(id) ON DELETE SET NULL;

COMMENT ON COLUMN working_groups.parent_body_id IS
  'Organization dossier that owns/hosts this working group (Phase 29)';

CREATE INDEX IF NOT EXISTS idx_working_groups_parent_body_id
  ON working_groups(parent_body_id)
  WHERE parent_body_id IS NOT NULL;
```

ON DELETE SET NULL matches D-09 preference (nullable link that survives parent deletion).

### Migration B — Conditional `forums.organizing_body` (only if §1.5 check says missing)

```sql
-- Phase 29: Forum organizing body link (ONLY IF NOT ALREADY PRESENT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forums' AND column_name = 'organizing_body'
  ) THEN
    ALTER TABLE forums
      ADD COLUMN organizing_body UUID NULL
        REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;
```

### Migration C (optional) — WG `established_date`

Only if base `dossiers` table doesn't have a fitting date column. Planner to confirm:

```sql
ALTER TABLE working_groups
  ADD COLUMN IF NOT EXISTS established_date DATE NULL;
```

## 3. DossierPicker Multi-Select Extension

### 3.1 Current state (from `frontend/src/components/work-creation/DossierPicker.tsx`)

- **Props:** `value?: string`, `onChange: (id|null, dossier?) => void`, `disabled`, `placeholder`, `className`, `selectedDossier?`, `filterByDossierType?: DossierType`, `allowQuickAdd?`, `onQuickAdd?`.
- **Primitives:** `Popover` + `Command`/`CommandInput`/`CommandList`/`CommandGroup`/`CommandItem` + `Badge` + `Button` (shadcn re-exports, which wrap HeroUI v3 under the hood).
- **Search:** `autocompleteDossiers({ query, limit: 10, dossierType: filterByDossierType })` with 300 ms debounce, min 2 chars.
- **Recents:** localStorage key `recent_dossiers_for_work_creation`, max 5, filtered by `filterByDossierType`.
- **i18n namespace:** `work-creation`.
- **RTL:** uses `useDirection()` hook; chevrons `isRTL && rotate-180`; `ms-*`/`me-*` logical props throughout.

### 3.2 Extension plan (backwards compatible)

**New props (all optional):**

```ts
multiple?: boolean
values?: string[]
onValuesChange?: (ids: string[], dossiers: DossierOption[]) => void
selectedDossiers?: DossierOption[]   // like selectedDossier, plural
```

**Widen existing prop:**

```ts
filterByDossierType?: DossierType | DossierType[]
```

**Behavior contract:**

- `multiple` absent/false → existing single-select behavior, verbatim.
- `multiple` true:
  - Top "selected" card (`p-3 mb-2 rounded-lg border bg-muted/50`) is replaced by an **inline chip row** below the combobox `Button`: `flex flex-row flex-nowrap gap-2 overflow-x-auto py-2`. Chips = `Badge` with icon + name + `X` button (touch target `min-h-8`).
  - `handleSelect` pushes onto `values` (dedup by id), calls `onValuesChange`, keeps popover open for rapid multi-pick.
  - `Check` icon in `CommandItem` lights up when `values.includes(dossier.id)`.
  - `handleClear` per chip removes from array; "Clear all" button right-aligned above chip row.
- `filterByDossierType` array → pass `dossierType` as comma-joined or new `dossierTypes` param to `autocompleteDossiers`; filter `recentDossiers` with `.filter((d) => types.includes(d.type))`. **Planner must confirm** whether the autocomplete API already accepts an array; if not, wrap with `Array.isArray(x) ? x[0] : x` for the single most-common type while Phase 29 ships (Engagement uses three separate pickers each with a single type, so array-form is theoretical for this phase).

**State additions:**

```ts
const isMulti = Boolean(multiple)
const displayValues = externalValues ?? [] // source of truth when controlled
```

**Files touched:**

- `frontend/src/components/work-creation/DossierPicker.tsx` — in-place edit.
- `frontend/src/services/dossier-api.ts` — type expansion if `autocompleteDossiers` gets array-form.
- `frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx` — add multi-select test cases (or create if absent).

**Validation signal:** After edit, `grep "filterByDossierType" frontend/src` should return zero type errors; `pnpm typecheck` in monorepo must pass.

## 4. Wizard Implementation Plan

### 4.1 Forum wizard (FORUM-01..03)

| Artifact     | Path                                                                |
| ------------ | ------------------------------------------------------------------- |
| Config       | `frontend/src/components/dossier/wizard/config/forum.config.ts`     |
| Details step | `frontend/src/components/dossier/wizard/steps/ForumDetailsStep.tsx` |
| Review step  | `frontend/src/components/dossier/wizard/review/ForumReviewStep.tsx` |
| Route        | `frontend/src/routes/_protected/dossiers/forums/create.tsx`         |

**Schema extension** (`schemas/forum.schema.ts` — currently only has `forum_type`, `organizing_body_id`):

```ts
// Already present — keep.
const forumFields = z.object({
  forum_type: z.string().optional(),
  organizing_body_id: z.string().uuid().optional().or(z.literal('')),
})
```

No additions needed if `forum_type` is exposed (or drop it if D-17 keeps Forum Details minimal).

**Step fields (ForumDetailsStep):**

- `forum_type` — optional single-select (values from `forum_type` enum: `conference`, `seminar`, `workshop`, `summit`). Bilingual labels.
- `organizing_body_id` — single-select `DossierPicker` with `filterByDossierType="organization"`, `allowQuickAdd={false}`, optional.

**Config skeleton (replicate `country.config.ts`):**

```ts
export const forumWizardConfig: WizardConfig<ForumFormData> = {
  type: 'forum',
  schema: forumSchema,
  defaultValues: getDefaultsForType<ForumFormData>('forum'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
    },
    {
      id: 'forum-details',
      title: 'form-wizard:steps.forumDetails',
      description: 'form-wizard:steps.forumDetailsDesc',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
    },
  ],
  filterExtensionData: (data) => ({
    forum_type: data.forum_type || undefined,
    organizing_body: data.organizing_body_id || undefined, // map to DB column name
  }),
}
```

### 4.2 Working Group wizard (WG-01..03)

| Artifact     | Path                                                   |
| ------------ | ------------------------------------------------------ |
| Config       | `config/working-group.config.ts`                       |
| Details step | `steps/WorkingGroupDetailsStep.tsx`                    |
| Review step  | `review/WorkingGroupReviewStep.tsx`                    |
| Route        | `routes/_protected/dossiers/working_groups/create.tsx` |

**Schema extension** (already scaffolded, needs alignment):

```ts
const workingGroupFields = z.object({
  wg_status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(), // ⚠ LIVE values, not D-79 discretion
  established_date: z.string().optional().or(z.literal('')),
  mandate_en: z.string().optional(),
  mandate_ar: z.string().optional(),
  parent_body_id: z.string().uuid().optional().or(z.literal('')),
})
```

**Step fields (WorkingGroupDetailsStep):**

- `wg_status` — HeroUI `Select` dropdown (bilingual), default `active`.
- `established_date` — HTML `<input type="date">` (or HeroUI `DatePicker`), optional.
- `mandate_en` / `mandate_ar` — stacked textareas matching SharedBasicInfo pattern; Arabic has `writingDirection: 'rtl'` and no `textAlign: 'right'`.
- `parent_body_id` — single-select `DossierPicker` with `filterByDossierType="organization"`, optional.

### 4.3 Engagement wizard (ENGM-01..05)

| Artifact          | Path                                                |
| ----------------- | --------------------------------------------------- |
| Config            | `config/engagement.config.ts`                       |
| Details step      | `steps/EngagementDetailsStep.tsx`                   |
| Participants step | `steps/EngagementParticipantsStep.tsx`              |
| Review step       | `review/EngagementReviewStep.tsx`                   |
| Route             | `routes/_protected/dossiers/engagements/create.tsx` |

**Schema extension** (current is slim; rewrite to match live DB):

```ts
const engagementFields = z.object({
  engagement_type: z.enum([
    'bilateral_meeting',
    'mission',
    'delegation',
    'summit',
    'working_group',
    'roundtable',
    'official_visit',
    'consultation',
    'forum_session',
    'other',
  ]),
  engagement_category: z.enum([
    'diplomatic',
    'statistical',
    'technical',
    'economic',
    'cultural',
    'educational',
    'research',
    'other', // ⚠ LIVE list — reconcile with D-14
  ]),
  location_en: z.string().optional(),
  location_ar: z.string().optional(),
  start_date: z.string().min(1), // ⚠ NOT-NULL in DB
  end_date: z.string().min(1), // ⚠ NOT-NULL in DB
  participant_country_ids: z.array(z.string().uuid()).default([]),
  participant_organization_ids: z.array(z.string().uuid()).default([]),
  participant_person_ids: z.array(z.string().uuid()).default([]),
})
```

**Participants step (EngagementParticipantsStep):**

- Three sections, each a `<fieldset>` with `<legend>` bound to i18n:
  - Countries: `<DossierPicker multiple values={participant_country_ids} onValuesChange={...} filterByDossierType="country" />`
  - Organizations: same with `"organization"`
  - Persons: same with `"person"`
- Chip lists scroll horizontally per section (`overflow-x-auto`), RTL-aware.
- No validation — all three may be empty (D-06).

## 5. List-Page Create Button Integration (FORUM-03 / WG-03 / ENGM-05)

Three existing list routes exist and are canonical:

- `frontend/src/routes/_protected/dossiers/forums/index.tsx`
- `frontend/src/routes/_protected/dossiers/working_groups/index.tsx`
- `frontend/src/routes/_protected/dossiers/engagements/index.tsx`

**Action:** Replicate the Phase 28 D-10 Create-button pattern. The planner MUST:

1. Read one of the Phase 28 shipped list pages (Countries / Organizations / Topics / Persons index) to extract the exact JSX snippet used.
2. Apply the same snippet verbatim to the three Phase 29 index files, only changing the target route (`to="/_protected/dossiers/forums/create"` etc.) and the i18n button label.
3. Route-tree regeneration: Phase 28 precedent says run `pnpm -C frontend codegen:router` (or equivalent) after adding `create.tsx` files.

## 6. Participants Persistence Strategy (ENGM-03)

**Table:** existing `engagement_participants` (already RLS'd via same migration).

**Flow in `useCreateDossierWizard` submission handler for engagement:**

1. `useCreateDossier` inserts the base `dossiers` row and the `engagement_dossiers` extension row (via `filterExtensionData` mapping `engagement_type`, `engagement_category`, `location_en/ar`, `start_date`, `end_date`) — returns `newDossierId`.
2. Concatenate the three selected arrays into a single batch insert:
   ```ts
   const rows = [
     ...countryIds.map((id) => ({
       engagement_id: newDossierId,
       participant_type: 'country',
       participant_dossier_id: id,
       role: 'delegate',
     })),
     ...orgIds.map((id) => ({
       engagement_id: newDossierId,
       participant_type: 'organization',
       participant_dossier_id: id,
       role: 'delegate',
     })),
     ...personIds.map((id) => ({
       engagement_id: newDossierId,
       participant_type: 'person',
       participant_dossier_id: id,
       role: 'delegate',
     })),
   ]
   await supabase.from('engagement_participants').insert(rows)
   ```
3. On success → clear draft, navigate via `getDossierDetailPath('engagement', newDossierId)`.
4. On participants-insert failure after dossier insert: log warning, do NOT roll back (engagement is valid without participants per D-06). Surface a toast: "Dossier created but some participants could not be linked."

**RLS:** the existing `engagement_participants` RLS policies (from same migration) gate by engagement ownership — the creating user is the `created_by` of the parent dossier and will have INSERT rights.

## 7. i18n Additions

**Critical finding:** `frontend/src/i18n/en/form-wizard.json` currently contains **zero** keys matching `wizard` (grep count = 0). The shared wizards use flat keys under `steps.*`, `form.*`, etc. at the root of the `form-wizard` namespace.

**Recommendation:** Follow the existing flat convention and add per-type step labels at `steps.{type}.{stepId}` AND per-field labels at `{type}.{fieldName}` under the `form-wizard` namespace root. DO NOT introduce a new `wizard.*` wrapper — it contradicts the shipped Phase 27/28 pattern.

**Minimum keys to add (EN — mirror in `ar/form-wizard.json`):**

```json
{
  "steps": {
    "forumDetails": "Forum Details",
    "forumDetailsDesc": "Set the forum type and organizing body",
    "workingGroupDetails": "Working Group Details",
    "workingGroupDetailsDesc": "Status, mandate, and parent body",
    "engagementDetails": "Engagement Details",
    "engagementDetailsDesc": "Type, category, location, and dates",
    "participants": "Participants",
    "participantsDesc": "Link countries, organizations, and persons"
  },
  "forum": {
    "forumType": "Forum Type",
    "organizingBody": "Organizing Body",
    "organizingBodyHint": "Optional — can be set later",
    "types": {
      "conference": "Conference",
      "seminar": "Seminar",
      "workshop": "Workshop",
      "summit": "Summit"
    }
  },
  "workingGroup": {
    "status": "Status",
    "establishedDate": "Established Date",
    "mandateEn": "Mandate (English)",
    "mandateAr": "Mandate (Arabic)",
    "parentBody": "Parent Body",
    "statuses": {
      "active": "Active",
      "inactive": "Inactive",
      "pending": "Pending",
      "suspended": "Suspended"
    }
  },
  "engagement": {
    "engagementType": "Engagement Type",
    "category": "Category",
    "locationEn": "Location (English)",
    "locationAr": "Location (Arabic)",
    "startDate": "Start Date",
    "endDate": "End Date",
    "types": {
      /* 10 entries from §1.2 */
    },
    "categories": {
      /* live enum from §1.3 */
    },
    "participants": {
      "countries": "Participating Countries",
      "organizations": "Participating Organizations",
      "persons": "Participating Persons",
      "sectionHint": "Optional — add more later from the engagement detail page"
    }
  }
}
```

Arabic mirror uses RTL-proper script: no MS-LATIN characters, use Unicode Arabic.

## 8. Validation Architecture

Nyquist validation is enabled for this project. Phase 29 surfaces are observable through the browser, the API, and the DB — all three tiers have testing harnesses already in place.

### 8.1 Test Framework

| Property         | Value                                               |
| ---------------- | --------------------------------------------------- |
| Unit/integration | Vitest + @testing-library/react                     |
| E2E              | Playwright (existing suite under `tests/e2e/`)      |
| A11y             | axe-core via @testing-library/jest-dom integration  |
| Config files     | `frontend/vitest.config.ts`, `playwright.config.ts` |
| Quick run        | `pnpm -C frontend test`                             |
| Full suite       | `pnpm test` (monorepo)                              |

### 8.2 Observable surfaces

| Surface                                      | Harness                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| Wizard step navigation + validation          | Vitest + @testing-library/react (`render`, `screen.getByRole`, `fireEvent`)    |
| DossierPicker multi-select behavior          | Vitest component tests with mocked `autocompleteDossiers`                      |
| TanStack Query cache invalidation on submit  | Vitest + `QueryClientProvider` wrapper                                         |
| Supabase INSERT on `engagement_participants` | Integration test with real Supabase local OR mocked `supabase.from().insert()` |
| Route /dossiers/{type}/create mounts wizard  | Playwright E2E                                                                 |
| Post-create navigation to detail page        | Playwright E2E                                                                 |
| RTL layout (Arabic)                          | Vitest snapshot + Playwright screenshot comparison                             |
| Mobile viewport (320/375/768)                | Playwright viewport emulation                                                  |
| i18n keys loaded & bilingual labels rendered | Vitest with `i18n.changeLanguage('ar')`                                        |

### 8.3 Coverage dimensions

- **Languages:** EN and AR, every wizard walked-through in both (already standard in Phase 27/28 tests).
- **Viewports:** 320 px (mobile-min), 768 px (tablet), 1280 px (desktop).
- **A11y:** axe run on each step's mounted DOM — zero violations required.
- **Optional-field behavior:** submit with `organizing_body_id` / `parent_body_id` / all three participant arrays empty — must succeed.
- **Required-field behavior:** engagement `start_date`/`end_date`/`engagement_type`/`engagement_category` missing → step-level validation blocks `Next`.
- **Route integration:** click Create button on each list page → wizard route opens → 3/3/4 steps rendered → submit → detail page loaded.

### 8.4 Per-requirement signal contracts

| Req      | Verifiable signal                                                                                                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FORUM-01 | Playwright: navigate to `/dossiers/forums/create`, assert 3 `role="tab"` or stepper items; fill each, submit, expect URL match `/dossiers/{id}`                                                                               |
| FORUM-02 | Vitest on `ForumDetailsStep`: render, assert `DossierPicker` with `filterByDossierType="organization"` present; select org; assert `organizing_body_id` in form state; DB INSERT assertion                                    |
| FORUM-03 | Playwright: open `/dossiers/forums`, assert Create button → click → URL becomes `/dossiers/forums/create`                                                                                                                     |
| WG-01    | Same as FORUM-01 with `working_groups/create` and 3 steps                                                                                                                                                                     |
| WG-02    | Vitest on `WorkingGroupDetailsStep`: assert presence of status select, date input, two mandate textareas (EN + AR with `writingDirection: 'rtl'`), parent DossierPicker                                                       |
| WG-03    | Playwright list-page flow                                                                                                                                                                                                     |
| ENGM-01  | Playwright: `engagements/create` has **4** stepper items                                                                                                                                                                      |
| ENGM-02  | Vitest on `EngagementDetailsStep`: assert type select with 10 options, category select, `location_en`+`location_ar` inputs, start/end date inputs                                                                             |
| ENGM-03  | Vitest on `EngagementParticipantsStep`: three DossierPicker sections with `multiple` + `filterByDossierType` correctly set per section; Supabase insert assertion receives rows with three distinct `participant_type` values |
| ENGM-04  | Vitest on `DossierPicker`: `multiple=true` + `values=[a,b,c]` renders three chips; `onValuesChange` called on chip `×` click; `filterByDossierType` accepts array without type error                                          |
| ENGM-05  | Playwright list-page flow                                                                                                                                                                                                     |

### 8.5 Sampling rate

- Per task commit: `pnpm -C frontend test path/to/test.test.tsx -u=false` (quick).
- Per wave merge: `pnpm -C frontend test` + `pnpm -C frontend lint` + `pnpm -C frontend typecheck`.
- Phase gate: full monorepo `pnpm test` + Playwright smoke run before `/gsd-verify-work`.

### 8.6 Wave 0 Gaps

- [ ] `frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx` — confirm exists; if not, create with single + multi coverage.
- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/ForumDetailsStep.test.tsx` — new.
- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/WorkingGroupDetailsStep.test.tsx` — new.
- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/EngagementDetailsStep.test.tsx` — new.
- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/EngagementParticipantsStep.test.tsx` — new.
- [ ] `frontend/src/components/dossier/wizard/review/__tests__/ForumReviewStep.test.tsx` — new.
- [ ] `frontend/src/components/dossier/wizard/review/__tests__/WorkingGroupReviewStep.test.tsx` — new.
- [ ] `frontend/src/components/dossier/wizard/review/__tests__/EngagementReviewStep.test.tsx` — new.
- [ ] Playwright: `tests/e2e/wizards/forum.spec.ts`, `working-group.spec.ts`, `engagement.spec.ts` — three new suites, one per requirement trio.

## 9. Assumptions Log

| #   | Claim                                                                                                                                         | Section | Risk if Wrong                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| A1  | `forums.organizing_body` exists in live staging (view 033 references it) `[ASSUMED]`                                                          | §1.5    | Low — migration B handles both cases idempotently                                               |
| A2  | `useCreateDossier` mutation accepts extension-table columns via `filterExtensionData` `[CITED: Phase 26 CONTEXT + country.config.ts pattern]` | §6      | Medium — if API path for engagement is different, planner must detect                           |
| A3  | `autocompleteDossiers` search API accepts a single `dossierType` only today `[VERIFIED: DossierPicker.tsx line 161]`                          | §3      | Low — Phase 29 uses single-type-per-picker anyway                                               |
| A4  | Existing `engagement_participants` RLS permits the creator to INSERT `[ASSUMED]`                                                              | §6      | Medium — if RLS blocks, wizard fails silently on participants; need to verify via `pg_policies` |
| A5  | Phase 28 Create-button pattern is a drop-in for list pages `[CITED: D-21 / Phase 28 D-10]`                                                    | §5      | Low                                                                                             |
| A6  | Project has no `wizard.*` i18n wrapper today `[VERIFIED: grep "wizard" form-wizard.json == 0]`                                                | §7      | None — recommendation adjusts to flat convention                                                |

## 10. Open Questions / Risks and Unknowns

1. **Forum organizing_body column existence in live staging** — MUST be confirmed via Supabase MCP `SELECT column_name FROM information_schema.columns WHERE table_name='forums'` before planning the migration wave.
2. **Engagement category enum mismatch (D-14 vs live)** — planner must decide whether to migrate the CHECK constraint or amend the wizard enum to the live values. Recommend live values (option b).
3. **Engagement `start_date`/`end_date` NOT NULL** — the discretion "optional scheduled_date" CANNOT satisfy the constraint; EngagementDetailsStep must capture both dates as required. Escalate to user in plan-checker.
4. **Working group `status` enum mismatch (D-79 discretion vs live)** — adopt live values `active|inactive|pending|suspended`. Update i18n accordingly.
5. **`parent_body_id` FK target** — D-09 says "dossiers(id) or organizations(id) — planner to confirm". Recommend `dossiers(id)` because the picker returns a dossier row and all 8 dossier types share the `dossiers` PK. If a strict RI with `organizations` is preferred later, a CHECK + trigger can be added.
6. **`established_date` column location** — if not on `working_groups`, ADD it in Migration A.
7. **`useCreateDossier` mutation signature** — planner must read the current hook signature to know whether `engagement_participants` rows are handled inline or need a separate follow-up mutation. Simplest fix: add a `postCreate?: (id) => Promise<void>` hook to `useCreateDossierWizard` that the engagement config implements.
8. **Route-tree regeneration command** — Phase 28 used `@tanstack/router-plugin` auto-gen. Planner must ensure Vite restarts or the codegen runs after the three `create.tsx` files land.
9. **HeroUI v3 DatePicker availability** — `established_date`, `start_date`, `end_date` need a date input. Planner should verify HeroUI v3 has a stable DatePicker; if not, fall back to a native `<input type="date">` with RTL-safe wrapping.

## Sources

### Primary (HIGH confidence — VERIFIED from repo)

- `supabase/migrations/20260110000006_create_engagement_dossiers.sql` — engagement_dossiers schema + engagement_participants
- `supabase/migrations/20260110000006_working_groups_entity.sql` — working_groups alterations
- `supabase/migrations/20260329000002_add_forum_session_support.sql` — live engagement_type CHECK values (10 entries)
- `supabase/migrations/033_update_forum_details_view.sql` — proves `forums.organizing_body → organizations(id)` join
- `supabase/migrations/006_create_forums.sql` — base forums schema
- `frontend/src/components/work-creation/DossierPicker.tsx` — current single-select contract
- `frontend/src/components/dossier/wizard/config/country.config.ts` — wizard config template
- `frontend/src/components/dossier/wizard/config/types.ts` — `WizardConfig<T>` type
- `frontend/src/components/dossier/wizard/schemas/{forum,working-group,engagement}.schema.ts` — scaffolded schemas
- `.planning/REQUIREMENTS.md` lines 52-69 — FORUM/WG/ENGM requirement contracts
- `.planning/phases/29-complex-type-wizards/29-CONTEXT.md` — locked decisions D-01..D-26

### Secondary (MEDIUM — inferred from repo patterns)

- Phase 28 list-page Create-button pattern — read one of Countries/Organizations/Topics/Persons index.tsx files during planning to extract exact snippet.
- `useCreateDossierWizard.ts` submission flow — planner to read to confirm `postCreate` hook viability.

### Tertiary (LOW — framework conventions)

- HeroUI v3 DatePicker — confirm availability via `mcp__heroui-react__list_components` during planning.

## Metadata

**Confidence breakdown:**

- DB schema state: HIGH — grep evidence across migrations files
- Wizard infrastructure reuse: HIGH — Phases 26-28 shipped and merged
- DossierPicker extension: HIGH — full file read
- i18n convention: HIGH — grep confirms no `wizard.*` wrapper today
- Engagement category enum reconciliation: MEDIUM — must escalate
- Forum organizing_body presence in staging: MEDIUM — requires live MCP check

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable — wizard infra locked; only risk is ambient schema drift in staging)

## RESEARCH COMPLETE
