import type { WizardConfig } from './types'
import type { TopicFormData } from '../schemas/topic.schema'
import { topicSchema } from '../schemas/topic.schema'
import { getDefaultsForType } from '../defaults'

export const topicWizardConfig: WizardConfig<TopicFormData> = {
  type: 'topic',
  schema: topicSchema,
  defaultValues: getDefaultsForType<TopicFormData>('topic'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
    },
  ],
  filterExtensionData: (data: TopicFormData) => ({
    theme_category: data.theme_category,
  }),
}
