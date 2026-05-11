# Phase 26: Shared Wizard Infrastructure - Pattern Map

**Mapped:** 2026-04-15
**Files analyzed:** 15 new/modified files
**Analogs found:** 15 / 15

## File Classification

| New/Modified File                                                           | Role      | Data Flow        | Closest Analog                                                   | Match Quality |
| --------------------------------------------------------------------------- | --------- | ---------------- | ---------------------------------------------------------------- | ------------- |
| `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts`    | hook      | request-response | `frontend/src/components/dossier/DossierCreateWizard.tsx`        | exact         |
| `frontend/src/components/dossier/wizard/hooks/useDraftMigration.ts`         | hook      | transform        | `frontend/src/components/ui/form-wizard.tsx` (useFormDraft)      | role-match    |
| `frontend/src/components/dossier/wizard/CreateWizardShell.tsx`              | component | request-response | `frontend/src/components/dossier/DossierCreateWizard.tsx`        | exact         |
| `frontend/src/components/dossier/wizard/SharedBasicInfoStep.tsx`            | component | CRUD             | `frontend/src/components/dossier/wizard-steps/BasicInfoStep.tsx` | exact         |
| `frontend/src/components/dossier/wizard/schemas/base.schema.ts`             | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/schemas/country.schema.ts`          | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/schemas/organization.schema.ts`     | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/schemas/topic.schema.ts`            | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/schemas/person.schema.ts`           | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/schemas/forum.schema.ts`            | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/schemas/working-group.schema.ts`    | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/schemas/engagement.schema.ts`       | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/schemas/elected-official.schema.ts` | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/defaults/index.ts`                  | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |
| `frontend/src/components/dossier/wizard/config/types.ts`                    | utility   | transform        | `frontend/src/components/dossier/wizard-steps/Shared.ts`         | exact         |

## Pattern Assignments

### `wizard/hooks/useCreateDossierWizard.ts` (hook, request-response)

**Analog:** `frontend/src/components/dossier/DossierCreateWizard.tsx`

**Imports pattern** (lines 1-22):

```typescript
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@/lib/form-resolver'
import { toast } from 'sonner'

import { useFormDraft } from '@/components/ui/form-wizard'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { useCreateDossier } from '@/hooks/useDossier'
import { useDirection } from '@/hooks/useDirection'
import type { DossierType, CreateDossierRequest } from '@/services/dossier-api'
import type { GeneratedFields } from '@/hooks/useAIFieldAssist'
```

**Form + draft initialization pattern** (lines 60-77):

```typescript
// Draft management
const draftKey = initialType ? `${DRAFT_KEY}-${initialType}` : DRAFT_KEY
const { draft, setDraft, saveDraft, clearDraft, hasDraft, isDraftSaving } =
  useFormDraft<DossierFormData>(draftKey, {
    ...defaultValues,
    type: initialType,
    tags: recommendedTags || [],
  })

const form = useForm<DossierFormData, unknown, DossierFormData>({
  resolver: zodResolver(dossierSchema),
  defaultValues: {
    ...draft,
    type: initialType || draft.type,
    tags: recommendedTags || draft.tags || [],
  },
  mode: 'onChange',
})
```

**Submission pattern** (lines 175-206):

```typescript
const handleComplete = async (): Promise<void> => {
  if (createMutation.isPending) return
  try {
    const values = form.getValues()
    if (!values.type) {
      toast.error(t('dossier:create.error'))
      return
    }
    const createData: CreateDossierRequest = {
      type: values.type as DossierType,
      name_en: values.name_en,
      name_ar: values.name_ar,
      abbreviation: values.abbreviation || undefined,
      description_en: values.description_en || undefined,
      description_ar: values.description_ar || undefined,
      status: values.status,
      sensitivity_level: values.sensitivity_level,
      tags: values.tags || [],
      extensionData: filterExtensionDataByType(values.type as DossierType, values.extension_data),
    }
    const newDossier = await createMutation.mutateAsync(createData)
    clearDraft()
    toast.success(t('dossier:create.success'))
    if (onSuccess) {
      onSuccess(newDossier.id, newDossier.type as DossierType)
    } else {
      void navigate({ to: getDossierDetailPath(newDossier.id, newDossier.type as DossierType) })
    }
  } catch {
    /* Error toast handled by useCreateDossier onError */
  }
}
```

**Draft save pattern** (lines 216-220):

```typescript
const handleSaveDraft = (): void => {
  updateDraft(form.getValues())
  saveDraft()
  toast.success(t('form-wizard:draftSaved'))
}
```

---

### `wizard/hooks/useDraftMigration.ts` (hook, transform)

**Analog:** `frontend/src/components/ui/form-wizard.tsx` (useFormDraft, lines 430-591)

**localStorage access pattern** (lines 451-512):

```typescript
// Initialize state from localStorage or default
const [draft, setDraft] = React.useState<T>(() => {
  if (typeof window === 'undefined') return defaultValue

  try {
    const stored = localStorage.getItem(draftKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      // ... meaningful content detection, deep merge
    }
  } catch (error) {
    console.error('Failed to load draft:', error)
  }
  return defaultValue
})
```

**Key convention:** Silent try/catch with `console.error` for localStorage failures. No user-facing errors.

---

### `wizard/CreateWizardShell.tsx` (component, request-response)

**Analog:** `frontend/src/components/dossier/DossierCreateWizard.tsx` (lines 253-283)

**FormWizard wrapping pattern** (lines 253-283):

```typescript
return (
  <div className={cn('w-full max-w-4xl mx-auto', className)}>
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <FormWizard
            steps={steps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onComplete={handleComplete}
            onCancel={handleCancel}
            onSaveDraft={handleSaveDraft}
            isLoading={createMutation.isPending}
            isDraftSaving={isDraftSaving}
            hasDraft={hasDraft}
            canComplete={
              !!selectedType &&
              (formValues.name_en?.length ?? 0) >= 2 &&
              (formValues.name_ar?.length ?? 0) >= 2
            }
            completeButtonText={t('dossier:form.create')}
            allowStepNavigation={true}
            namespace="form-wizard"
            actionBarMode="auto"
          >
            {renderStep()}
          </FormWizard>
        </form>
      </Form>
    </FormProvider>
  </div>
)
```

**Key props for FormWizard** (from `form-wizard.tsx` lines 39-66):

```typescript
interface FormWizardProps {
  steps: WizardStep[]
  children: React.ReactNode
  currentStep: number
  onStepChange: (step: number) => void
  onComplete: () => void | Promise<void>
  onCancel?: () => void
  onSaveDraft?: () => void
  isLoading?: boolean
  isDraftSaving?: boolean
  hasDraft?: boolean
  canComplete?: boolean
  className?: string
  showProgress?: boolean
  showStepNumbers?: boolean
  allowStepNavigation?: boolean
  completeButtonText?: string
  completeButtonTextAr?: string
  namespace?: string
  actionBarMode?: 'inline' | 'sticky' | 'auto'
}
```

---

### `wizard/SharedBasicInfoStep.tsx` (component, CRUD)

**Analog:** `frontend/src/components/dossier/wizard-steps/BasicInfoStep.tsx`

**Imports pattern** (lines 1-23):

```typescript
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'

import { FormWizardStep } from '@/components/ui/form-wizard'
import { AIFieldAssist } from '@/components/dossier/AIFieldAssist'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { FieldLabelWithHelp } from '@/components/forms/ContextualHelp'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
```

**Bilingual field pair pattern** (lines 60-131):

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* English Name */}
  <FormField
    control={form.control}
    name="name_en"
    render={({ field }) => (
      <FormItem>
        <FieldLabelWithHelp
          label={t('dossier:form.nameEn')}
          required
          helpProps={{
            tooltip: t('contextual-help:dossier.nameEn.tooltip'),
            title: t('contextual-help:dossier.nameEn.title'),
            description: t('contextual-help:dossier.nameEn.description'),
            formatRequirements: t('contextual-help:dossier.nameEn.formatRequirements', {
              returnObjects: true,
            }) as string[],
            mode: 'both',
          }}
        />
        <FormControl>
          <Input
            {...field}
            placeholder={t('dossier:form.nameEnPlaceholder')}
            className="min-h-11"
            onChange={(e) => {
              field.onChange(e)
              updateDraft({ name_en: e.target.value })
            }}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  {/* Arabic Name -- same pattern with dir={direction} */}
</div>
```

**Classification fields pattern** (from `ClassificationStep.tsx` lines 33-112):

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* Status */}
  <FormField
    control={form.control}
    name="status"
    render={({ field }) => (
      <FormItem>
        <FieldLabelWithHelp
          label={t('dossier:form.status')}
          helpProps={{
            tooltip: t('contextual-help:dossier.status.tooltip'),
            title: t('contextual-help:dossier.status.title'),
            description: t('contextual-help:dossier.status.description'),
            mode: 'both',
          }}
        />
        <Select
          onValueChange={(value) => {
            field.onChange(value)
            updateDraft({ status: value as 'active' | 'inactive' | 'archived' | 'deleted' })
          }}
          defaultValue={field.value}
        >
          <FormControl>
            <SelectTrigger className="min-h-11">
              <SelectValue placeholder={t('dossier:form.selectStatus')} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="active">{t('dossier:status.active')}</SelectItem>
            <SelectItem value="inactive">{t('dossier:status.inactive')}</SelectItem>
            <SelectItem value="archived">{t('dossier:status.archived')}</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
  {/* Sensitivity Level -- same pattern with numeric conversion */}
</div>
```

---

### `wizard/schemas/base.schema.ts` (utility, transform)

**Analog:** `frontend/src/components/dossier/wizard-steps/Shared.ts` (lines 14-76)

**Schema definition pattern** (lines 14-74):

```typescript
import * as z from 'zod'

export const dossierSchema = z.object({
  type: z
    .enum(['country', 'organization', 'forum', 'engagement', 'topic', 'working_group', 'person'])
    .optional(),
  name_en: z.string().min(2, { message: 'English name must be at least 2 characters' }),
  name_ar: z.string().min(2, { message: 'Arabic name must be at least 2 characters' }),
  abbreviation: z
    .string()
    .max(20, { message: 'Abbreviation must be at most 20 characters' })
    .optional()
    .or(z.literal('')),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived', 'deleted']).default('active'),
  sensitivity_level: z.number().min(1).max(4).default(1),
  tags: z.array(z.string()).optional(),
})

export type DossierFormData = z.infer<typeof dossierSchema>
```

**Per-type extension pattern** (extract from lines 31-73, split per type):

```typescript
// Per-type schema uses .merge() on baseDossierSchema
// Example: country fields extracted from extension_data
const countryFields = z.object({
  iso_code_2: z.string().length(2).optional().or(z.literal('')),
  iso_code_3: z.string().length(3).optional().or(z.literal('')),
  capital_en: z.string().optional(),
  capital_ar: z.string().optional(),
  region: z.string().optional(),
})
export const countrySchema = baseDossierSchema.merge(countryFields)
export type CountryFormData = z.infer<typeof countrySchema>
```

---

### `wizard/defaults/index.ts` (utility, transform)

**Analog:** `frontend/src/components/dossier/wizard-steps/Shared.ts` (lines 79-114)

**Default values pattern** (lines 79-114):

```typescript
export const defaultValues: DossierFormData = {
  type: undefined,
  name_en: '',
  name_ar: '',
  abbreviation: '',
  description_en: '',
  description_ar: '',
  status: 'active',
  sensitivity_level: 1,
  tags: [],
  extension_data: {
    // All type-specific fields initialized to '' or undefined
  },
}
```

---

### `wizard/config/types.ts` (utility, transform)

**Analog:** `frontend/src/components/dossier/wizard-steps/Shared.ts` (lines 117-163)

**Step props interface pattern** (lines 117-163):

```typescript
import type { UseFormReturn } from 'react-hook-form'
import type { DossierType } from '@/services/dossier-api'

export interface StepProps {
  form: UseFormReturn<DossierFormData, unknown, DossierFormData>
  formValues: DossierFormData
  selectedType: DossierFormData['type']
  direction: 'ltr' | 'rtl'
  isRTL: boolean
  updateDraft: (values: Partial<DossierFormData>) => void
}
```

**Step config builder pattern** (lines 256-324):

```typescript
export function buildWizardSteps(
  t: TFunction,
  selectedType: DossierFormData['type'],
  form: UseFormReturn<DossierFormData, unknown, DossierFormData>,
): Array<{
  id: string
  title: string
  description: string
  icon: typeof Globe
  isOptional?: boolean
  validate?: () => boolean
}> {
  return [
    {
      id: 'type',
      title: t('dossier:create.step1'),
      description: t('dossier:create.selectTypeDescription'),
      icon: FileText,
      validate: (): boolean => !!selectedType,
    },
    // ... more steps
  ]
}
```

**filterExtensionDataByType pattern** (lines 193-250):

```typescript
export function filterExtensionDataByType(
  type: DossierType,
  extensionData: DossierFormData['extension_data'],
): DossierExtensionData | undefined {
  if (!extensionData) return undefined
  const isMeaningful = (value: unknown): boolean =>
    value !== undefined && value !== null && value !== ''
  const filterEmpty = <T extends Record<string, unknown>>(obj: T): T | undefined => {
    const filtered = Object.fromEntries(
      Object.entries(obj).filter(([, value]) => isMeaningful(value)),
    )
    return Object.keys(filtered).length > 0 ? (filtered as T) : undefined
  }
  switch (type) {
    case 'country':
      return filterEmpty({
        iso_code_2: extensionData.iso_code_2,
        // ...
      })
    // ... per-type cases
  }
}
```

---

## Shared Patterns

### Form Resolver

**Source:** `frontend/src/lib/form-resolver.ts` (lines 1-13)
**Apply to:** `useCreateDossierWizard.ts`, all schema files

```typescript
import { zodResolver as baseZodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'

export function zodResolver(schema: any, ...args: any[]): Resolver<any> {
  return baseZodResolver(schema, ...args) as Resolver<any>
}
```

**Critical:** Always use `@/lib/form-resolver` instead of direct `@hookform/resolvers/zod` import. The wrapper handles Zod 4 type mismatch with `.default()` and `.merge()`.

### RTL Direction

**Source:** `frontend/src/hooks/useDirection.ts` (used in DossierCreateWizard line 57)
**Apply to:** `CreateWizardShell.tsx`, `SharedBasicInfoStep.tsx`

```typescript
const { direction, isRTL } = useDirection()
// Arabic inputs get dir={direction}
// Never prop-drill direction -- always call the hook
```

### i18n Namespaces

**Source:** `DossierCreateWizard.tsx` line 55
**Apply to:** All wizard components

```typescript
const { t } = useTranslation(['dossier', 'form-wizard', 'contextual-help'])
// 'dossier' -- field labels, types, status values
// 'form-wizard' -- step navigation, draft messages
// 'contextual-help' -- field help tooltips
```

### FormWizardStep Wrapper

**Source:** `frontend/src/components/ui/form-wizard.tsx` (lines 421-427)
**Apply to:** `SharedBasicInfoStep.tsx`, all step components

```typescript
// Every step component wraps content in FormWizardStep
<FormWizardStep stepId="basic" className="space-y-4">
  {/* Step content */}
</FormWizardStep>
```

### Touch-Friendly Targets

**Source:** `ClassificationStep.tsx` line 56, `BasicInfoStep.tsx` line 84
**Apply to:** All form fields in wizard components

```typescript
// All interactive elements: min-h-11 (44px)
<Input className="min-h-11" />
<SelectTrigger className="min-h-11" />
```

### Duplicate Detection

**Source:** `frontend/src/components/dossier/wizard-steps/BasicInfoStep.tsx` (lines 37-47)
**Apply to:** `SharedBasicInfoStep.tsx`, `useCreateDossierWizard.ts`

```typescript
import { useDossierNameSimilarity } from '@/hooks/useDossierNameSimilarity'

const {
  similarDossiers,
  isChecking: isCheckingDuplicates,
  hasHighSimilarity,
  hasMediumSimilarity,
  highestMatch,
} = useDossierNameSimilarity(formValues.name_en || '', formValues.name_ar, {
  type: selectedType as DossierType | undefined,
  threshold: 0.4,
  enabled: currentStep === 1 && (formValues.name_en?.length || 0) >= 3,
})
```

### Test Structure

**Source:** `frontend/src/hooks/useFirstRunCheck.test.ts` (lines 1-91)
**Apply to:** All test files for this phase

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'

// Mock pattern for modules
vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}))

// QueryClient wrapper factory
const makeWrapper = (): {
  wrapper: (props: { children: ReactNode }) => ReactNode
  queryClient: QueryClient
} => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { wrapper, queryClient }
}

// Explicit return types on all functions (ESLint rule)
describe('hookName', () => {
  beforeEach((): void => {
    mockFn.mockReset()
  })

  it('description', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useHook(), { wrapper })
    await waitFor((): void => {
      expect(result.current.data).toEqual(expected)
    })
  })
})
```

**Key conventions:**

- Explicit `(): void` return types on all callbacks (ESLint `explicit-function-return-type`)
- `createElement` instead of JSX in test wrappers
- `vi.mock` at module level
- `beforeEach` with `mockReset()`
- `waitFor` for async hook results

## No Analog Found

| File   | Role | Data Flow | Reason                                                              |
| ------ | ---- | --------- | ------------------------------------------------------------------- |
| (none) | --   | --        | All files have direct analogs in the existing wizard implementation |

## Metadata

**Analog search scope:** `frontend/src/components/dossier/`, `frontend/src/components/ui/`, `frontend/src/hooks/`, `frontend/src/lib/`
**Files scanned:** 25+
**Pattern extraction date:** 2026-04-15
