/**
 * Shared types and constants for DossierCreateWizard step components.
 *
 * All wizard step components receive their form state via StepProps,
 * keeping form state lifted in the orchestrator to prevent loss on step transitions.
 */

import type { UseFormReturn } from 'react-hook-form'
import type { DossierType } from '@/services/dossier-api'
import type { GeneratedFields } from '@/hooks/useAIFieldAssist'
import * as z from 'zod'

// Form schema — single source of truth for validation
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
  extension_data: z
    .object({
      // Person fields
      title_en: z.string().optional(),
      title_ar: z.string().optional(),
      biography_en: z.string().optional(),
      biography_ar: z.string().optional(),
      photo_url: z.string().url().optional().or(z.literal('')),
      // Country fields
      iso_code_2: z.string().length(2).optional().or(z.literal('')),
      iso_code_3: z.string().length(3).optional().or(z.literal('')),
      capital_en: z.string().optional(),
      capital_ar: z.string().optional(),
      region: z.string().optional(),
      // Organization fields
      org_code: z.string().optional(),
      org_type: z.enum(['government', 'ngo', 'private', 'international', 'academic']).optional(),
      website: z.string().url().optional().or(z.literal('')),
      // Engagement fields
      engagement_type: z
        .enum([
          'meeting',
          'consultation',
          'coordination',
          'workshop',
          'conference',
          'site_visit',
          'ceremony',
        ])
        .optional(),
      engagement_category: z.enum(['bilateral', 'multilateral', 'regional', 'internal']).optional(),
      location_en: z.string().optional(),
      location_ar: z.string().optional(),
      // Forum fields
      organizing_body_id: z.string().uuid().optional().or(z.literal('')),
      // Topic fields (column names are theme_* for backward compatibility)
      theme_category: z.enum(['policy', 'technical', 'strategic', 'operational']).optional(),
      // Working Group fields
      mandate_en: z.string().optional(),
      mandate_ar: z.string().optional(),
      wg_status: z.enum(['active', 'suspended', 'disbanded']).optional(),
      established_date: z.string().optional(),
    })
    .optional(),
})

export type DossierFormData = z.infer<typeof dossierSchema>

/** Default form values for a new dossier */
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
    title_en: '',
    title_ar: '',
    biography_en: '',
    biography_ar: '',
    photo_url: '',
    iso_code_2: '',
    iso_code_3: '',
    capital_en: '',
    capital_ar: '',
    region: '',
    org_code: '',
    org_type: undefined,
    website: '',
    engagement_type: undefined,
    engagement_category: undefined,
    location_en: '',
    location_ar: '',
    organizing_body_id: '',
    theme_category: undefined,
    mandate_en: '',
    mandate_ar: '',
    wg_status: undefined,
    established_date: '',
  },
}

/** Props shared by all wizard step components */
export interface StepProps {
  form: UseFormReturn<DossierFormData, unknown, DossierFormData>
  formValues: DossierFormData
  selectedType: DossierFormData['type']
  direction: 'ltr' | 'rtl'
  isRTL: boolean
  updateDraft: (values: Partial<DossierFormData>) => void
}

/** Props specific to TypeSelectionStep */
export interface TypeSelectionStepProps {
  selectedType: DossierFormData['type']
  onTypeSelect: (type: DossierType) => void
}

/** Props specific to BasicInfoStep */
export interface BasicInfoStepProps extends StepProps {
  onAIGenerate: (fields: GeneratedFields) => void
  currentStep: number
}

/** Props specific to TypeSpecificStep (includes forum quick-add state) */
export interface TypeSpecificStepProps extends StepProps {
  organizingBodyName: string
  setOrganizingBodyName: (name: string) => void
  onQuickAddOrg: (name: string) => void
}

/** Props for per-type extension field sub-components */
export interface ExtensionFieldProps {
  form: UseFormReturn<DossierFormData, unknown, DossierFormData>
  direction: 'ltr' | 'rtl'
  isRTL: boolean
}

/** Props for forum extension fields (needs extra state for organizing body) */
export interface ForumFieldProps extends ExtensionFieldProps {
  organizingBodyName: string
  setOrganizingBodyName: (name: string) => void
  onQuickAddOrg: (name: string) => void
}

/** Props specific to ReviewStep */
export interface ReviewStepProps extends StepProps {
  organizingBodyName: string
}

import type { DossierExtensionData } from '@/services/dossier-api'
import {
  Globe,
  Building2,
  Users,
  Calendar,
  UserCircle,
  Briefcase,
  FileText,
  Shield,
  CheckCircle2,
} from 'lucide-react'
import type { TFunction } from 'i18next'

/** Type icons mapping for display purposes */
export const typeIcons: Partial<Record<DossierType, typeof Globe>> = {
  country: Globe,
  organization: Building2,
  forum: Users,
  engagement: Calendar,
  topic: FileText,
  working_group: Briefcase,
  person: UserCircle,
}

/**
 * Filter extension data to only include fields for the selected dossier type.
 * Strips empty strings and undefined values.
 */
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
    case 'person':
      return filterEmpty({
        title_en: extensionData.title_en,
        title_ar: extensionData.title_ar,
        biography_en: extensionData.biography_en,
        biography_ar: extensionData.biography_ar,
        photo_url: extensionData.photo_url,
      })
    case 'country':
      return filterEmpty({
        iso_code_2: extensionData.iso_code_2,
        iso_code_3: extensionData.iso_code_3,
        capital_en: extensionData.capital_en,
        capital_ar: extensionData.capital_ar,
        region: extensionData.region,
      })
    case 'organization':
      return filterEmpty({
        org_code: extensionData.org_code,
        org_type: extensionData.org_type,
        website: extensionData.website,
      })
    case 'engagement':
      return filterEmpty({
        engagement_type: extensionData.engagement_type,
        engagement_category: extensionData.engagement_category,
        location_en: extensionData.location_en,
        location_ar: extensionData.location_ar,
      })
    case 'forum':
      return filterEmpty({ organizing_body_id: extensionData.organizing_body_id })
    case 'topic':
      return filterEmpty({ theme_category: extensionData.theme_category })
    case 'working_group':
      return filterEmpty({
        mandate_en: extensionData.mandate_en,
        mandate_ar: extensionData.mandate_ar,
        wg_status: extensionData.wg_status,
        established_date: extensionData.established_date,
      })
    default:
      return undefined
  }
}

/** Types that require extension fields to be filled. */
const REQUIRED_EXT_TYPES = ['country', 'organization', 'engagement', 'topic']

/** Build the wizard step configuration array. */
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
    {
      id: 'basic',
      title: t('dossier:form.basicInformation'),
      description: t('dossier:create.basicInfoDescription'),
      icon: FileText,
      validate: (): boolean => {
        const { name_en, name_ar } = form.getValues()
        return name_en.length >= 2 && name_ar.length >= 2
      },
    },
    {
      id: 'classification',
      title: t('dossier:create.classificationTitle'),
      description: t('dossier:create.classificationDescription'),
      icon: Shield,
    },
    {
      id: 'type-specific',
      title: selectedType
        ? t(`dossier:form.${selectedType}Fields`)
        : t('dossier:create.typeDetailsTitle'),
      description: t('dossier:create.typeDetailsDescription'),
      icon: typeIcons[selectedType as DossierType] || FileText,
      isOptional: !REQUIRED_EXT_TYPES.includes(selectedType || ''),
      validate: (): boolean => {
        const ext = form.getValues('extension_data')
        if (!ext) return !REQUIRED_EXT_TYPES.includes(selectedType || '')
        switch (selectedType) {
          case 'country':
            return !!(ext.iso_code_2?.length === 2 && ext.iso_code_3?.length === 3)
          case 'organization':
            return !!ext.org_type
          case 'engagement':
            return !!(ext.engagement_type && ext.engagement_category)
          case 'topic':
            return !!ext.theme_category
          default:
            return true
        }
      },
    },
    {
      id: 'review',
      title: t('dossier:create.reviewTitle'),
      description: t('dossier:create.reviewDescription'),
      icon: CheckCircle2,
    },
  ]
}
