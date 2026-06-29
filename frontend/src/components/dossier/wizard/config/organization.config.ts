import type { WizardConfig } from './types'
import type { OrganizationFormData } from '../schemas/organization.schema'
import { organizationSchema } from '../schemas/organization.schema'
import { getDefaultsForType } from '../defaults'

export const organizationWizardConfig: WizardConfig<OrganizationFormData> = {
  type: 'organization',
  schema: organizationSchema,
  defaultValues: getDefaultsForType<OrganizationFormData>('organization'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
      guidanceKey: 'organization-wizard:wizard.steps.basic.guidance',
    },
    {
      id: 'org-details',
      title: 'form-wizard:steps.orgDetails',
      description: 'form-wizard:steps.orgDetailsDesc',
      guidanceKey: 'organization-wizard:wizard.steps.org-details.guidance',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
      guidanceKey: 'organization-wizard:wizard.steps.review.guidance',
    },
  ],
  filterExtensionData: (data: OrganizationFormData) => {
    // Compose one focal-point officer from its flat fields, dropping empties.
    // Returns undefined when the officer has no data at all (omit-empty).
    const buildFocal = (
      nameEn: string | undefined,
      nameAr: string | undefined,
      userId: string | undefined,
    ): { name_en?: string; name_ar?: string; user_id?: string } | undefined => {
      const en = nameEn !== undefined && nameEn !== '' ? nameEn : undefined
      const ar = nameAr !== undefined && nameAr !== '' ? nameAr : undefined
      const uid = userId !== undefined && userId !== '' ? userId : undefined
      if (en === undefined && ar === undefined && uid === undefined) return undefined
      return {
        ...(en !== undefined ? { name_en: en } : {}),
        ...(ar !== undefined ? { name_ar: ar } : {}),
        ...(uid !== undefined ? { user_id: uid } : {}),
      }
    }

    const responsible = buildFocal(
      data.responsible_name_en,
      data.responsible_name_ar,
      data.responsible_user_id,
    )
    const alternate = buildFocal(
      data.alternate_name_en,
      data.alternate_name_ar,
      data.alternate_user_id,
    )
    const support = buildFocal(data.support_name_en, data.support_name_ar, data.support_user_id)

    const focalPoints =
      responsible !== undefined || alternate !== undefined || support !== undefined
        ? {
            ...(responsible !== undefined ? { responsible } : {}),
            ...(alternate !== undefined ? { alternate } : {}),
            ...(support !== undefined ? { support } : {}),
          }
        : undefined

    return {
      org_type: data.org_type,
      org_code: data.org_code !== '' ? data.org_code : undefined,
      website: data.website !== '' ? data.website : undefined,
      address_en: data.headquarters_en !== '' ? data.headquarters_en : undefined,
      address_ar: data.headquarters_ar !== '' ? data.headquarters_ar : undefined,
      established_date: data.founding_date !== '' ? data.founding_date : undefined,
      membership_type: data.membership_type !== '' ? data.membership_type : undefined,
      importance: data.importance !== '' ? data.importance : undefined,
      representation_level:
        data.representation_level !== '' ? data.representation_level : undefined,
      ...(focalPoints !== undefined ? { gastat_focal_points: focalPoints } : {}),
    }
  },
}
