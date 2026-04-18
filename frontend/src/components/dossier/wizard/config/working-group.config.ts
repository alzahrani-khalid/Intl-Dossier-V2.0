import type { WizardConfig } from './types'
import type { WorkingGroupFormData } from '../schemas/working-group.schema'
import { workingGroupSchema } from '../schemas/working-group.schema'
import { getDefaultsForType } from '../defaults'

export const workingGroupWizardConfig: WizardConfig<WorkingGroupFormData> = {
  type: 'working_group',
  schema: workingGroupSchema,
  defaultValues: getDefaultsForType<WorkingGroupFormData>('working_group'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
      guidanceKey: 'working-group-wizard:wizard.steps.basic.guidance',
    },
    {
      id: 'wg-details',
      title: 'form-wizard:steps.workingGroupDetails',
      description: 'form-wizard:steps.workingGroupDetailsDesc',
      guidanceKey: 'working-group-wizard:wizard.steps.wg-details.guidance',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
      guidanceKey: 'working-group-wizard:wizard.steps.review.guidance',
    },
  ],
  filterExtensionData: (data: WorkingGroupFormData) => ({
    status: data.wg_status,
    established_date: data.established_date !== '' ? data.established_date : undefined,
    mandate_en: data.mandate_en !== '' ? data.mandate_en : undefined,
    mandate_ar: data.mandate_ar !== '' ? data.mandate_ar : undefined,
    parent_body_id: data.parent_body_id !== '' ? data.parent_body_id : undefined,
  }),
}
