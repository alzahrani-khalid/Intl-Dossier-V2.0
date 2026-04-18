import type { WizardConfig } from './types'
import type { ForumFormData } from '../schemas/forum.schema'
import { forumSchema } from '../schemas/forum.schema'
import { getDefaultsForType } from '../defaults'

export const forumWizardConfig: WizardConfig<ForumFormData> = {
  type: 'forum',
  schema: forumSchema,
  defaultValues: getDefaultsForType<ForumFormData>('forum'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
      guidanceKey: 'forum-wizard:wizard.steps.basic.guidance',
    },
    {
      id: 'forum-details',
      title: 'form-wizard:steps.forumDetails',
      description: 'form-wizard:steps.forumDetailsDesc',
      guidanceKey: 'forum-wizard:wizard.steps.forum-details.guidance',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
      guidanceKey: 'forum-wizard:wizard.steps.review.guidance',
    },
  ],
  filterExtensionData: (data: ForumFormData) => ({
    forum_type: data.forum_type !== '' ? data.forum_type : undefined,
    organizing_body: data.organizing_body_id !== '' ? data.organizing_body_id : undefined,
  }),
}
