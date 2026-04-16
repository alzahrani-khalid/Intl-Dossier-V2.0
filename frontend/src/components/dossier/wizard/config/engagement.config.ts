import type { WizardConfig } from './types'
import type { EngagementFormData } from '../schemas/engagement.schema'
import { engagementSchema } from '../schemas/engagement.schema'
import { getDefaultsForType } from '../defaults'
import { supabase } from '@/lib/supabase'

type ParticipantType = 'country' | 'organization' | 'person'

interface EngagementParticipantRow {
  engagement_id: string
  participant_type: ParticipantType
  participant_dossier_id: string
  role: 'delegate'
}

function buildParticipantRows(
  engagementId: string,
  data: EngagementFormData,
): EngagementParticipantRow[] {
  const toRows = (ids: string[], type: ParticipantType): EngagementParticipantRow[] =>
    ids.map((id) => ({
      engagement_id: engagementId,
      participant_type: type,
      participant_dossier_id: id,
      role: 'delegate',
    }))

  return [
    ...toRows(data.participant_country_ids ?? [], 'country'),
    ...toRows(data.participant_organization_ids ?? [], 'organization'),
    ...toRows(data.participant_person_ids ?? [], 'person'),
  ]
}

export const engagementWizardConfig: WizardConfig<EngagementFormData> = {
  type: 'engagement',
  schema: engagementSchema,
  defaultValues: getDefaultsForType<EngagementFormData>('engagement'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
    },
    {
      id: 'engagement-details',
      title: 'form-wizard:steps.engagementDetails',
      description: 'form-wizard:steps.engagementDetailsDesc',
    },
    {
      id: 'engagement-participants',
      title: 'form-wizard:steps.participants',
      description: 'form-wizard:steps.participantsDesc',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
    },
  ],
  filterExtensionData: (data: EngagementFormData) => ({
    engagement_type: data.engagement_type,
    engagement_category: data.engagement_category,
    location_en: data.location_en !== '' ? data.location_en : undefined,
    location_ar: data.location_ar !== '' ? data.location_ar : undefined,
    start_date: data.start_date,
    end_date: data.end_date,
  }),
  postCreate: async (newDossierId, data) => {
    const rows = buildParticipantRows(newDossierId, data)
    if (rows.length === 0) return
    const { error } = await supabase.from('engagement_participants').insert(rows)
    if (error) {
      console.warn('Failed to insert engagement_participants rows', error, {
        engagementId: newDossierId,
        rows,
      })
    }
  },
}
