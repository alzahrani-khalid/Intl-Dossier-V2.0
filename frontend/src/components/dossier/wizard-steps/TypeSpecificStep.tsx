/** TypeSpecificStep — Step 3: dispatches to per-type extension field components. */
import type { ReactElement } from 'react'
import { FormWizardStep, ConditionalField } from '@/components/ui/form-wizard'
import type { TypeSpecificStepProps } from './Shared'
import PersonFields from './fields/PersonFields'
import CountryFields from './fields/CountryFields'
import OrganizationFields from './fields/OrganizationFields'
import EngagementFields from './fields/EngagementFields'
import ForumFields from './fields/ForumFields'
import TopicFields from './fields/TopicFields'
import WorkingGroupFields from './fields/WorkingGroupFields'

export default function TypeSpecificStep({
  form,
  selectedType,
  direction,
  isRTL,
  organizingBodyName,
  setOrganizingBodyName,
  onQuickAddOrg,
}: TypeSpecificStepProps): ReactElement {
  const fieldProps = { form, direction, isRTL }

  return (
    <FormWizardStep stepId="type-specific" className="space-y-4">
      <ConditionalField show={selectedType === 'person'}>
        <PersonFields {...fieldProps} />
      </ConditionalField>
      <ConditionalField show={selectedType === 'country'}>
        <CountryFields {...fieldProps} />
      </ConditionalField>
      <ConditionalField show={selectedType === 'organization'}>
        <OrganizationFields {...fieldProps} />
      </ConditionalField>
      <ConditionalField show={selectedType === 'engagement'}>
        <EngagementFields {...fieldProps} />
      </ConditionalField>
      <ConditionalField show={selectedType === 'forum'}>
        <ForumFields
          {...fieldProps}
          organizingBodyName={organizingBodyName}
          setOrganizingBodyName={setOrganizingBodyName}
          onQuickAddOrg={onQuickAddOrg}
        />
      </ConditionalField>
      <ConditionalField show={selectedType === 'topic'}>
        <TopicFields {...fieldProps} />
      </ConditionalField>
      <ConditionalField show={selectedType === 'working_group'}>
        <WorkingGroupFields {...fieldProps} />
      </ConditionalField>
    </FormWizardStep>
  )
}
