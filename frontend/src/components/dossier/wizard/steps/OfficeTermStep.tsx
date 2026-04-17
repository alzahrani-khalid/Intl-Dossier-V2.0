/**
 * OfficeTermStep — Phase 30 D-06
 *
 * STUB: Full implementation provided by plan 30-02.
 * This file exists only to satisfy TypeScript imports in create.tsx
 * until plan 30-02's commit is merged.
 */
import type { ReactElement } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { PersonFormData } from '../schemas/person.schema'

interface OfficeTermStepProps {
  form: UseFormReturn<PersonFormData>
}

export function OfficeTermStep({ form: _form }: OfficeTermStepProps): ReactElement {
  return <div data-step="office-term" />
}
