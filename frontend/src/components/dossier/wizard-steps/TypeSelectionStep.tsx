/**
 * TypeSelectionStep — Step 0 of the DossierCreateWizard.
 * Renders a dossier-type picker grid.
 */

import type { ReactElement } from 'react'
import { FormWizardStep } from '@/components/ui/form-wizard'
import { DossierTypeSelector } from '@/components/dossier/DossierTypeSelector'
import type { DossierType } from '@/services/dossier-api'
import type { TypeSelectionStepProps } from './shared'

export default function TypeSelectionStep({
  selectedType,
  onTypeSelect,
}: TypeSelectionStepProps): ReactElement {
  return (
    <FormWizardStep stepId="type" className="space-y-4">
      <DossierTypeSelector
        selectedType={selectedType as DossierType}
        onChange={onTypeSelect}
      />
    </FormWizardStep>
  )
}
