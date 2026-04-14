# Architecture Patterns: Type-Specific Dossier Creation Wizards

**Domain:** Diplomatic dossier management -- wizard refactoring
**Researched:** 2026-04-14
**Confidence:** HIGH (based on direct codebase analysis)

## Recommended Architecture

**Strategy: Compositional Wizards with Shared Infrastructure**

Keep the existing `FormWizard` shell and extract shared logic into a `useCreateDossierWizard` hook. Compose 8 type-specific wizard configurations that each declare their own steps, schema, defaults, and review sections. The type is known at route entry -- no more runtime type-selection step.

```
/dossiers/countries/create     --> CountryCreateWizard (3 steps)
/dossiers/organizations/create --> OrganizationCreateWizard (3 steps)
/dossiers/forums/create        --> ForumCreateWizard (3 steps)
/dossiers/engagements/create   --> EngagementCreateWizard (4 steps)
/dossiers/topics/create        --> TopicCreateWizard (3 steps)
/dossiers/working-groups/create --> WorkingGroupCreateWizard (3 steps)
/dossiers/persons/create       --> PersonCreateWizard (3 steps)
/dossiers/elected-officials/create --> ElectedOfficialCreateWizard (4 steps)
```

### Why Per-Type Routes (Not Search Params)

1. **TanStack Router file-based routing** -- each `create.tsx` under the type directory is natural
2. **Type is known before wizard starts** -- eliminates TypeSelectionStep entirely
3. **Direct entry from list pages** -- `<Link to="/dossiers/countries/create">` instead of `/dossiers/create?type=country`
4. **Code splitting** -- each wizard lazy-loaded only when that type's create route is visited
5. **Backward compatibility** -- keep `/dossiers/create` as a redirect hub with type cards

### Component Boundaries

| Component                | Responsibility                                                                            | Location                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `useCreateDossierWizard` | Shared hook: form setup, draft persistence, submission, AI assist, navigation             | `hooks/useCreateDossierWizard.ts`                                                        |
| `CreateWizardShell`      | Thin wrapper: renders `FormWizard` with common chrome (progress, nav, draft indicator)    | `components/dossier/create/CreateWizardShell.tsx`                                        |
| `BasicInfoStep`          | Shared step: name_en, name_ar, abbreviation, descriptions, AI assist, duplicate detection | `components/dossier/create/steps/BasicInfoStep.tsx` (reuse existing with minor refactor) |
| `ClassificationStep`     | Shared step: status + sensitivity_level                                                   | `components/dossier/create/steps/ClassificationStep.tsx` (reuse existing)                |
| `ReviewStep`             | Per-type: each wizard provides its own review section renderer                            | `components/dossier/create/steps/Review{Type}Step.tsx`                                   |
| `{Type}DetailsStep`      | Per-type: type-specific fields (replaces TypeSpecificStep dispatch)                       | `components/dossier/create/steps/{Type}DetailsStep.tsx`                                  |
| `RelationshipStep`       | Per-type (engagement, forum, working_group): relationship pickers                         | `components/dossier/create/steps/{Type}RelationshipStep.tsx`                             |
| `{Type}CreateWizard`     | Per-type orchestrator: composes steps, defines schema, provides to shell                  | `components/dossier/create/wizards/{Type}CreateWizard.tsx`                               |
| `{Type}CreatePage`       | Route page: header + wizard + help text                                                   | `pages/dossiers/{Type}CreatePage.tsx`                                                    |
| `CreateDossierHub`       | New `/dossiers/create` landing: type selector grid linking to per-type routes             | `pages/dossiers/CreateDossierHub.tsx`                                                    |

### Data Flow

```
Route (type known) --> {Type}CreatePage
  --> {Type}CreateWizard
    --> useCreateDossierWizard(type, schemaForType, defaultsForType)
      returns: { form, steps, currentStep, handlers, draftState }
    --> CreateWizardShell(steps, currentStep, handlers)
      --> BasicInfoStep (shared)
      --> {Type}DetailsStep (type-specific fields)
      --> {Type}RelationshipStep (optional, type-specific)
      --> Review{Type}Step (type-specific review)
    --> QuickAddOrgDialog (if forum/working_group)
```

## Patterns to Follow

### Pattern 1: Wizard Configuration Object

Each type-specific wizard declares a configuration object that drives the shared hook and shell.

```typescript
// types/wizard-config.types.ts
interface WizardConfig<TSchema extends z.ZodType> {
  type: DossierType
  personSubtype?: PersonSubtype // 'elected_official' for that variant
  schema: TSchema
  defaultValues: z.infer<TSchema>
  steps: WizardStepConfig[]
  filterExtensionData: (data: unknown) => DossierExtensionData | undefined
  draftKey: string
}

interface WizardStepConfig {
  id: string
  titleKey: string // i18n key
  descriptionKey: string
  icon: LucideIcon
  isOptional?: boolean
  validate?: (form: UseFormReturn) => boolean
  component: React.ComponentType<StepProps>
}
```

**Why:** Declarative configs make each wizard self-documenting. The shared hook consumes the config without knowing type details. Adding a 9th type = adding one config + one details component.

### Pattern 2: Per-Type Zod Schemas (Discriminated)

Replace the single flat `dossierSchema` with per-type schemas that share a base.

```typescript
// schemas/dossier-create.schemas.ts

const baseFields = z.object({
  name_en: z.string().min(2),
  name_ar: z.string().min(2),
  abbreviation: z.string().max(20).optional().or(z.literal('')),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived', 'deleted']).default('active'),
  sensitivity_level: z.number().min(1).max(4).default(1),
  tags: z.array(z.string()).optional(),
})

export const countryCreateSchema = baseFields.extend({
  extension_data: z.object({
    iso_code_2: z.string().length(2),
    iso_code_3: z.string().length(3),
    capital_en: z.string().optional(),
    capital_ar: z.string().optional(),
    region: z.string().optional(),
  }),
})

export const engagementCreateSchema = baseFields.extend({
  extension_data: z.object({
    engagement_type: z.enum([
      'meeting',
      'consultation',
      'coordination',
      'workshop',
      'conference',
      'site_visit',
      'ceremony',
    ]),
    engagement_category: z.enum(['bilateral', 'multilateral', 'regional', 'internal']),
    location_en: z.string().optional(),
    location_ar: z.string().optional(),
  }),
  // Relationship fields (not in extension_data, handled post-create)
  participant_ids: z.array(z.string().uuid()).optional(),
})

// ... one schema per type
```

**Why:** Per-type schemas give precise validation. No more carrying all 7 types' fields in one flat object. TypeScript inference gives exact form types per wizard. `filterExtensionDataByType()` becomes unnecessary -- each schema already contains only its fields.

### Pattern 3: Shared Hook with Generic Type Parameter

```typescript
// hooks/useCreateDossierWizard.ts
function useCreateDossierWizard<T extends z.ZodType>(
  config: WizardConfig<T>,
): {
  form: UseFormReturn<z.infer<T>>
  currentStep: number
  setCurrentStep: (step: number) => void
  steps: WizardStep[]
  handleComplete: () => Promise<void>
  handleCancel: () => void
  handleSaveDraft: () => void
  handleAIGenerate: (fields: GeneratedFields) => void
  draftState: { hasDraft: boolean; isDraftSaving: boolean }
  createMutation: UseMutationResult
  direction: 'ltr' | 'rtl'
  isRTL: boolean
}
```

**Why:** Extracts all the logic currently in `DossierCreateWizard.tsx` (lines 48-220) into a reusable hook. Each wizard component becomes ~30 LOC of step composition.

### Pattern 4: Relationship Linking at Creation

Some types need relationship pickers during creation:

| Type             | Relationship Step                       | Picker Component                      |
| ---------------- | --------------------------------------- | ------------------------------------- |
| engagement       | Participants (countries, orgs, persons) | Multi-select DossierPicker            |
| forum            | Organizing body (org)                   | Single DossierPicker (already exists) |
| working_group    | Parent body (org or forum)              | Single DossierPicker                  |
| elected_official | Country, Organization                   | Two single DossierPickers             |
| topic            | Related topics (self-ref)               | Multi-select DossierPicker (optional) |

**Implementation:** Relationship IDs are collected in the form but linked via a **post-create API call** (not in the `createDossier` request itself). The submission handler:

1. Creates the dossier
2. If relationship IDs exist, calls `linkDossierRelationships(newId, relationships)`
3. Navigates to detail page

This avoids changing the existing `dossiers-create` Edge Function.

### Pattern 5: Elected Official as Person Variant

Elected official is NOT a separate dossier type -- it is `type: 'person'` with `person_subtype: 'elected_official'`. The wizard:

1. Uses the person base schema extended with elected official fields
2. Sets `person_subtype: 'elected_official'` in the `CreateDossierRequest`
3. Has extra steps for office/term/party fields
4. Routes from `/dossiers/elected-officials/create`

```typescript
export const electedOfficialCreateSchema = baseFields.extend({
  extension_data: z.object({
    // Person base fields
    title_en: z.string().optional(),
    title_ar: z.string().optional(),
    biography_en: z.string().optional(),
    biography_ar: z.string().optional(),
    photo_url: z.string().url().optional().or(z.literal('')),
    // Elected official specific
    office_name_en: z.string().min(1),
    office_name_ar: z.string().optional(),
    office_type: z.enum([
      /* ...officeTypes */
    ]),
    party_en: z.string().optional(),
    term_start: z.string().optional(),
    is_current_term: z.boolean().default(true),
  }),
  person_subtype: z.literal('elected_official'),
})
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Single Schema with Runtime Branching

**What:** Keeping the current flat schema with all types' fields and `filterExtensionDataByType()`
**Why bad:** TypeScript cannot narrow form types; validation is coarse; unused fields bloat the form
**Instead:** Per-type schemas with a shared base, as described above

### Anti-Pattern 2: Full Component Duplication

**What:** Copy-pasting BasicInfoStep, ClassificationStep, FormWizard into each wizard
**Why bad:** 8x maintenance for shared logic (AI assist, duplicate detection, draft saving)
**Instead:** Shared hook + shared steps + per-type config/details/review

### Anti-Pattern 3: Modal Wizards

**What:** Opening creation wizards in modal dialogs from list pages
**Why bad:** Complex forms need full-page space, especially on mobile; draft persistence is awkward in modals
**Instead:** Dedicated routes with full-page layout; use QuickAddDialog pattern only for inline creation (like existing QuickAddOrgDialog)

### Anti-Pattern 4: Single Route with Dynamic Steps

**What:** `/dossiers/create?type=country` with runtime step composition
**Why bad:** No code splitting, URL doesn't reflect intent, browser back is confusing
**Instead:** Per-type routes that lazy-load only the needed wizard

### Anti-Pattern 5: Relationship Creation in Single Transaction

**What:** Extending createDossier API to also create relationships atomically
**Why bad:** Requires Edge Function changes, complex rollback, blocks wizard progress
**Instead:** Create dossier first, link relationships second (two API calls)

## Step Composition Per Type

| Type             | Step 1         | Step 2                                          | Step 3                                        | Step 4 |
| ---------------- | -------------- | ----------------------------------------------- | --------------------------------------------- | ------ |
| country          | BasicInfo + AI | Country Details (ISO, capital, region)          | Review                                        | -      |
| organization     | BasicInfo + AI | Org Details (type, code, website)               | Review                                        | -      |
| forum            | BasicInfo + AI | Forum Details (organizing body picker)          | Review                                        | -      |
| engagement       | BasicInfo + AI | Engagement Details (type, category, location)   | Participants (relationship picker)            | Review |
| topic            | BasicInfo + AI | Topic Details (category)                        | Review                                        | -      |
| working_group    | BasicInfo + AI | WG Details (mandate, status, date, parent body) | Review                                        | -      |
| person           | BasicInfo + AI | Person Details (title, bio, photo)              | Review                                        | -      |
| elected_official | BasicInfo + AI | Person Details (title, bio)                     | Office Details (office, party, term, country) | Review |

**Note:** ClassificationStep (status + sensitivity) is **merged into BasicInfo** as a collapsible "Advanced" section. Most users accept defaults (active, level 1). This reduces steps from 5 to 3-4 per type.

## File Structure

```
frontend/src/
  components/dossier/create/
    CreateWizardShell.tsx           # FormWizard wrapper with common chrome
    CreateDossierHub.tsx            # Type selector grid (replaces DossierCreatePage)
    hooks/
      useCreateDossierWizard.ts    # Shared hook: form, draft, submit, AI
    schemas/
      base.schema.ts               # Shared base Zod fields
      country.schema.ts            # Country-specific schema
      organization.schema.ts
      forum.schema.ts
      engagement.schema.ts
      topic.schema.ts
      working-group.schema.ts
      person.schema.ts
      elected-official.schema.ts
      index.ts                     # Re-exports all
    steps/
      BasicInfoStep.tsx            # Shared (refactored from existing)
      CountryDetailsStep.tsx       # From existing CountryFields
      OrganizationDetailsStep.tsx  # From existing OrganizationFields
      ForumDetailsStep.tsx         # From existing ForumFields
      EngagementDetailsStep.tsx    # From existing EngagementFields
      EngagementParticipantsStep.tsx  # NEW: relationship picker
      TopicDetailsStep.tsx         # From existing TopicFields
      WorkingGroupDetailsStep.tsx  # From existing WorkingGroupFields
      PersonDetailsStep.tsx        # From existing PersonFields
      ElectedOfficialOfficeStep.tsx # NEW: office/term/party fields
      ReviewStep.tsx               # Shared shell with per-type review sections
    reviews/
      CountryReview.tsx            # Extracted from ReviewStep type branches
      OrganizationReview.tsx
      ForumReview.tsx
      EngagementReview.tsx
      TopicReview.tsx
      WorkingGroupReview.tsx
      PersonReview.tsx
      ElectedOfficialReview.tsx
    wizards/
      CountryCreateWizard.tsx      # Config + composition (~40 LOC each)
      OrganizationCreateWizard.tsx
      ForumCreateWizard.tsx
      EngagementCreateWizard.tsx
      TopicCreateWizard.tsx
      WorkingGroupCreateWizard.tsx
      PersonCreateWizard.tsx
      ElectedOfficialCreateWizard.tsx
  pages/dossiers/
    CreateDossierHub.tsx           # Landing page with type grid
    CountryCreatePage.tsx          # Thin wrapper (~30 LOC each)
    OrganizationCreatePage.tsx
    ... (one per type)
  routes/_protected/dossiers/
    create.tsx                     # Shows CreateDossierHub (type grid)
    countries/create.tsx           # NEW route files
    organizations/create.tsx
    forums/create.tsx
    engagements/create.tsx
    topics/create.tsx
    working-groups/create.tsx
    persons/create.tsx
    elected-officials/create.tsx
```

## Migration Strategy

### Phase 1: Shared Infrastructure (build first)

1. Extract `useCreateDossierWizard` hook from `DossierCreateWizard.tsx`
2. Create `CreateWizardShell` wrapper
3. Split `dossierSchema` into `base.schema.ts` + per-type schemas
4. Refactor `BasicInfoStep` to accept type as prop (remove TypeSelectionStep dependency)

### Phase 2: First Type-Specific Wizard (country -- simplest)

1. Create `CountryCreateWizard` + `CountryCreatePage`
2. Add route `countries/create.tsx`
3. Extract `CountryReview` from `ReviewStep`
4. Update countries list page link: `/dossiers/create` --> `/dossiers/countries/create`
5. Validate: AI assist, draft persistence, duplicate detection all work

### Phase 3: Simple Types (organization, topic, person)

- Same pattern as country, parallel work possible
- Person wizard establishes the base for elected official

### Phase 4: Complex Types (engagement, forum, working_group)

- Engagement adds participant relationship step
- Forum already has DossierPicker for organizing body
- Working group adds parent body picker

### Phase 5: Elected Official Variant

- Extends person wizard with office/term/party steps
- Uses `person_subtype: 'elected_official'` in submission

### Phase 6: Hub + Cleanup

1. Convert `/dossiers/create` to `CreateDossierHub` (type grid linking to per-type routes)
2. Delete old `DossierCreateWizard.tsx`, `TypeSelectionStep.tsx`, `TypeSpecificStep.tsx`
3. Delete old flat `dossierSchema` from `Shared.ts`
4. Update all remaining links across the app

## Preserving Existing Features

| Feature             | Current Location                              | New Location                                              | Changes Needed                            |
| ------------------- | --------------------------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| AI Field Assist     | `BasicInfoStep` calls `AIFieldAssist`         | Same, no change                                           | None -- receives `dossierType` prop       |
| Draft Persistence   | `useFormDraft` in `DossierCreateWizard`       | `useCreateDossierWizard` hook                             | Draft key becomes `dossier-create-{type}` |
| Duplicate Detection | `useDossierNameSimilarity` in `BasicInfoStep` | Same, no change                                           | Type is now prop instead of watched value |
| Quick Add Org       | `QuickAddOrgDialog` in `DossierCreateWizard`  | Moves into `ForumDetailsStep` + `WorkingGroupDetailsStep` | Localize state to the step that needs it  |
| Form Validation     | `buildWizardSteps` validate functions         | Per-type config validate functions                        | More precise, type-specific validation    |
| Step Navigation     | `FormWizard` allowStepNavigation              | Same, no change                                           | None                                      |
| RTL Support         | `useDirection()` throughout                   | Same, no change                                           | None                                      |

## Sources

- Direct codebase analysis of `DossierCreateWizard.tsx` (296 LOC)
- `wizard-steps/Shared.ts` -- current schema and step builder
- `wizard-steps/TypeSpecificStep.tsx` -- current dispatch pattern
- `wizard-steps/fields/*.tsx` -- 7 existing field components
- `wizard-steps/ReviewStep.tsx` -- current review with 7 type branches
- `components/ui/form-wizard.tsx` -- FormWizard, useFormDraft, ConditionalField
- `pages/dossiers/DossierCreatePage.tsx` -- current page wrapper
- `routes/_protected/dossiers/create.tsx` -- current single route
- `domains/elected-officials/types/elected-official.types.ts` -- person subtype pattern
- `services/dossier-api.ts` -- DossierType, CreateDossierRequest
- `lib/dossier-routes.ts` -- route segment helpers
