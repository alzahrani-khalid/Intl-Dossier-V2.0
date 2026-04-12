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

import { Globe, Building2, Users, Calendar, UserCircle, Briefcase, FileText } from 'lucide-react'

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
