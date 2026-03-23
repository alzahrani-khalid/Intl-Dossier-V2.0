/**
 * DossierCreateWizard Component
 *
 * Multi-step wizard for creating new dossiers with progressive disclosure.
 * Breaks down the form into logical steps with draft saving support.
 *
 * Steps:
 * 1. Select Type - Choose dossier type (country, organization, etc.)
 * 2. Basic Info - Enter name, description in both languages
 * 3. Classification - Set status and sensitivity level
 * 4. Type-Specific - Fields specific to the selected type
 * 5. Review - Review all information before submission
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support via logical properties
 * - Local storage draft persistence
 * - Conditional field visibility based on type
 * - Step validation before progression
 * - Touch-friendly UI (44x44px min targets)
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@/lib/form-resolver'
import * as z from 'zod'
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
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  FormWizard,
  FormWizardStep,
  useFormDraft,
  ConditionalField,
} from '@/components/ui/form-wizard'
import { DossierTypeSelector } from '@/components/Dossier/DossierTypeSelector'
import { DossierPicker } from '@/components/work-creation/DossierPicker'
import { AIFieldAssist } from '@/components/Dossier/AIFieldAssist'
import type { GeneratedFields } from '@/hooks/useAIFieldAssist'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { FieldLabelWithHelp } from '@/components/Forms/ContextualHelp'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { getDossierDetailPath, getDossierRouteSegment } from '@/lib/dossier-routes'

import { useCreateDossier } from '@/hooks/useDossier'
import { useDossierNameSimilarity } from '@/hooks/useDossierNameSimilarity'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { createDossier, type DossierType, type CreateDossierRequest } from '@/services/dossier-api'

// Draft key for localStorage
const DRAFT_KEY = 'dossier-create-draft'

// Form schema
const dossierSchema = z.object({
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
  // Type-specific fields
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
      established_date: z.string().optional(), // ISO date string
    })
    .optional(),
})

type DossierFormData = z.infer<typeof dossierSchema>

// Default form values
const defaultValues: DossierFormData = {
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
    // Person fields
    title_en: '',
    title_ar: '',
    biography_en: '',
    biography_ar: '',
    photo_url: '',
    // Country fields
    iso_code_2: '',
    iso_code_3: '',
    capital_en: '',
    capital_ar: '',
    region: '',
    // Organization fields
    org_code: '',
    org_type: undefined,
    website: '',
    // Engagement fields
    engagement_type: undefined,
    engagement_category: undefined,
    location_en: '',
    location_ar: '',
    // Forum fields
    organizing_body_id: '',
    // Topic fields
    theme_category: undefined,
    // Working Group fields
    mandate_en: '',
    mandate_ar: '',
    wg_status: undefined,
    established_date: '',
  },
}

// Type icons (only for types that have icons defined)
const typeIcons: Partial<Record<DossierType, typeof Globe>> = {
  country: Globe,
  organization: Building2,
  forum: Users,
  engagement: Calendar,
  topic: FileText,
  working_group: Briefcase,
  person: UserCircle,
}

import type { DossierExtensionData } from '@/services/dossier-api'

/**
 * Filter extension data to only include fields for the selected dossier type.
 * Strips empty strings and undefined values.
 * Returns undefined if no valid extension data for the type.
 */
function filterExtensionDataByType(
  type: DossierType,
  extensionData: DossierFormData['extension_data'],
): DossierExtensionData | undefined {
  if (!extensionData) return undefined

  // Helper to check if value is meaningful (not empty string, undefined, or null)
  const isMeaningful = (value: unknown): boolean =>
    value !== undefined && value !== null && value !== ''

  // Filter function to remove empty values
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
      return filterEmpty({
        organizing_body_id: extensionData.organizing_body_id,
      })

    case 'topic':
      return filterEmpty({
        theme_category: extensionData.theme_category,
      })

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

interface DossierCreateWizardProps {
  onSuccess?: (dossierId: string, dossierType?: DossierType) => void
  onCancel?: () => void
  className?: string
  /** Initial dossier type (pre-selected) */
  initialType?: DossierType
  /** Recommended tags */
  recommendedTags?: string[]
}

export function DossierCreateWizard({
  onSuccess,
  onCancel,
  className,
  initialType,
  recommendedTags,
}: DossierCreateWizardProps) {
  const { t, i18n } = useTranslation(['dossier', 'form-wizard', 'contextual-help'])
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const createMutation = useCreateDossier()

  // Draft management - use template-specific key if using a template
  const draftKey = initialType ? `${DRAFT_KEY}-${initialType}` : DRAFT_KEY
  const { draft, setDraft, saveDraft, clearDraft, hasDraft, isDraftSaving } =
    useFormDraft<DossierFormData>(draftKey, {
      ...defaultValues,
      type: initialType,
      tags: recommendedTags || [],
    })

  // Form state
  const form = useForm<DossierFormData, unknown, DossierFormData>({
    resolver: zodResolver(dossierSchema),
    defaultValues: {
      ...draft,
      type: initialType || draft.type,
      tags: recommendedTags || draft.tags || [],
    },
    mode: 'onChange',
  })

  // Watch form values for draft syncing
  const formValues = form.watch()
  const selectedType = form.watch('type')

  // Sync form with draft values when draft is restored from localStorage
  // This ensures the form's internal state matches the draft after initial mount
  useEffect(() => {
    if (hasDraft && draft.name_en && draft.name_ar) {
      form.reset({
        ...draft,
        type: initialType || draft.type,
        tags: recommendedTags || draft.tags || [],
      })
    }
    // Only run when hasDraft changes (on initial load with draft)
  }, [hasDraft])

  // Wizard step state - skip type selection if initialType is provided
  const [currentStep, setCurrentStep] = useState(() => {
    // If initial type from template, skip to basic info step
    if (initialType) return 1
    // If draft has type selected, start at step 1
    if (draft.type) return 1
    return 0
  })

  // Quick-add organization modal state
  const [showQuickAddOrg, setShowQuickAddOrg] = useState(false)
  const [quickAddOrgName, setQuickAddOrgName] = useState('')
  const [quickAddOrgType, setQuickAddOrgType] = useState<
    'government' | 'ngo' | 'private' | 'international' | 'academic'
  >('international')
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)
  const [organizingBodyName, setOrganizingBodyName] = useState('')

  // Duplicate detection - check for similar dossier names
  // NOTE: Must be placed after currentStep is defined
  const {
    similarDossiers,
    isChecking: isCheckingDuplicates,
    hasHighSimilarity,
    hasMediumSimilarity,
    highestMatch,
  } = useDossierNameSimilarity(formValues.name_en || '', formValues.name_ar, {
    type: selectedType as DossierType | undefined,
    threshold: 0.4,
    enabled: currentStep === 1 && (formValues.name_en?.length || 0) >= 3,
  })

  // Sync form changes to draft
  const updateDraft = useCallback(
    (values: Partial<DossierFormData>) => {
      setDraft((prev) => ({ ...prev, ...values }))
    },
    [setDraft],
  )

  // Handle type selection
  const handleTypeSelect = useCallback(
    (type: DossierType) => {
      form.setValue('type', type)
      updateDraft({ type })
      setCurrentStep(1) // Auto-advance to next step
    },
    [form, updateDraft],
  )

  // Handle AI-generated fields
  const handleAIGenerate = useCallback(
    (fields: GeneratedFields) => {
      // Update form fields with AI-generated values
      form.setValue('name_en', fields.name_en)
      form.setValue('name_ar', fields.name_ar)
      if (fields.description_en) {
        form.setValue('description_en', fields.description_en)
      }
      if (fields.description_ar) {
        form.setValue('description_ar', fields.description_ar)
      }
      if (fields.suggested_tags && fields.suggested_tags.length > 0) {
        form.setValue('tags', fields.suggested_tags)
      }

      // Also update draft
      updateDraft({
        name_en: fields.name_en,
        name_ar: fields.name_ar,
        description_en: fields.description_en || undefined,
        description_ar: fields.description_ar || undefined,
        tags: fields.suggested_tags || [],
      })
    },
    [form, updateDraft],
  )

  // Handle quick-add organization
  const handleQuickAddOrg = useCallback(async () => {
    if (!quickAddOrgName.trim()) return

    setIsCreatingOrg(true)
    try {
      const newOrg = await createDossier({
        type: 'organization',
        name_en: quickAddOrgName,
        name_ar: quickAddOrgName, // User can edit later
        status: 'active',
        sensitivity_level: 1,
        extensionData: {
          org_type: quickAddOrgType,
        },
      })

      // Set the newly created organization as the organizing body
      form.setValue('extension_data.organizing_body_id', newOrg.id)
      setOrganizingBodyName(quickAddOrgName)

      toast.success(
        t('dossier:form.forum.orgCreated', 'Organization "{{name}}" created successfully', {
          name: quickAddOrgName,
        }),
      )
      setShowQuickAddOrg(false)
      setQuickAddOrgName('')
      setQuickAddOrgType('international')
    } catch (error) {
      console.error('Failed to create organization:', error)
      toast.error(t('dossier:form.forum.orgCreateFailed', 'Failed to create organization'))
    } finally {
      setIsCreatingOrg(false)
    }
  }, [quickAddOrgName, quickAddOrgType, form, t])

  // Steps configuration
  const steps = useMemo(
    () => [
      {
        id: 'type',
        title: t('dossier:create.step1'),
        titleAr: 'اختيار النوع',
        description: t('dossier:create.selectTypeDescription'),
        descriptionAr: 'اختر نوع الملف الذي تريد إنشاءه',
        icon: FileText,
        validate: () => !!selectedType,
      },
      {
        id: 'basic',
        title: t('dossier:form.basicInformation'),
        titleAr: 'المعلومات الأساسية',
        description: 'Enter the basic information in both languages',
        descriptionAr: 'أدخل المعلومات الأساسية باللغتين',
        icon: FileText,
        validate: () => {
          const { name_en, name_ar } = form.getValues()
          return name_en.length >= 2 && name_ar.length >= 2
        },
      },
      {
        id: 'classification',
        title: 'Classification',
        titleAr: 'التصنيف',
        description: 'Set status and sensitivity level',
        descriptionAr: 'حدد الحالة ومستوى الحساسية',
        icon: Shield,
      },
      {
        id: 'type-specific',
        title: selectedType ? t(`dossier:form.${selectedType}Fields`) : 'Type Details',
        titleAr: selectedType ? `معلومات ${t(`dossier:type.${selectedType}`)}` : 'تفاصيل إضافية',
        description: 'Additional fields specific to this type',
        descriptionAr: 'حقول إضافية خاصة بهذا النوع',
        icon: typeIcons[selectedType as DossierType] || FileText,
        // Types with required extension fields are NOT optional
        isOptional: !['country', 'organization', 'engagement', 'topic'].includes(
          selectedType || '',
        ),
        // Validation for required extension fields
        validate: () => {
          const ext = form.getValues('extension_data')
          if (!ext)
            return !['country', 'organization', 'engagement', 'topic'].includes(selectedType || '')

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
              return true // Optional for other types
          }
        },
      },
      {
        id: 'review',
        title: 'Review',
        titleAr: 'مراجعة',
        description: 'Review your information before creating',
        descriptionAr: 'راجع المعلومات قبل الإنشاء',
        icon: CheckCircle2,
      },
    ],
    [selectedType, form, t],
  )

  // Handle form submission
  const handleComplete = async () => {
    // Prevent double-submission
    if (createMutation.isPending) return

    try {
      const values = form.getValues()
      if (!values.type) {
        toast.error(t('dossier:create.error'))
        return
      }

      // Filter extension data to only include fields for the selected type
      const filteredExtensionData = filterExtensionDataByType(
        values.type as DossierType,
        values.extension_data,
      )

      const createData: CreateDossierRequest = {
        type: values.type as DossierType,
        name_en: values.name_en,
        name_ar: values.name_ar,
        abbreviation: values.abbreviation || undefined,
        description_en: values.description_en || undefined,
        description_ar: values.description_ar || undefined,
        status: values.status,
        sensitivity_level: values.sensitivity_level,
        tags: values.tags || [],
        extensionData: filteredExtensionData,
      }

      const newDossier = await createMutation.mutateAsync(createData)
      clearDraft() // Clear draft on success
      toast.success(t('dossier:create.success'))

      if (onSuccess) {
        onSuccess(newDossier.id, newDossier.type as DossierType)
      } else {
        navigate({ to: getDossierDetailPath(newDossier.id, newDossier.type as DossierType) })
      }
    } catch {
      // Error toast is already shown by useCreateDossier's onError handler
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate({ to: '/dossiers' })
    }
  }

  // Handle draft save
  const handleSaveDraft = () => {
    updateDraft(form.getValues())
    saveDraft()
    toast.success(t('form-wizard:draftSaved'))
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Type selection
        return (
          <FormWizardStep stepId="type" className="space-y-4">
            <DossierTypeSelector
              selectedType={selectedType as DossierType}
              onChange={handleTypeSelect}
            />
          </FormWizardStep>
        )

      case 1: // Basic information
        return (
          <FormWizardStep stepId="basic" className="space-y-4">
            {/* AI Field Assist - Optional helper */}
            {selectedType && (
              <AIFieldAssist
                dossierType={selectedType as DossierType}
                onGenerate={handleAIGenerate}
                className="mb-2"
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Name */}
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabelWithHelp
                      label={t('dossier:form.nameEn')}
                      required
                      helpProps={{
                        tooltip: t('contextual-help:dossier.nameEn.tooltip'),
                        title: t('contextual-help:dossier.nameEn.title'),
                        description: t('contextual-help:dossier.nameEn.description'),
                        formatRequirements: t('contextual-help:dossier.nameEn.formatRequirements', {
                          returnObjects: true,
                        }) as string[],
                        mode: 'both',
                      }}
                    />
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('dossier:form.nameEnPlaceholder')}
                        className="min-h-11"
                        onChange={(e) => {
                          field.onChange(e)
                          updateDraft({ name_en: e.target.value })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Arabic Name */}
              <FormField
                control={form.control}
                name="name_ar"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabelWithHelp
                      label={t('dossier:form.nameAr')}
                      required
                      helpProps={{
                        tooltip: t('contextual-help:dossier.nameAr.tooltip'),
                        title: t('contextual-help:dossier.nameAr.title'),
                        description: t('contextual-help:dossier.nameAr.description'),
                        formatRequirements: t('contextual-help:dossier.nameAr.formatRequirements', {
                          returnObjects: true,
                        }) as string[],
                        mode: 'both',
                      }}
                    />
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('dossier:form.nameArPlaceholder')}
                        className="min-h-11"
                        dir="rtl"
                        onChange={(e) => {
                          field.onChange(e)
                          updateDraft({ name_ar: e.target.value })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Abbreviation Field - applies to all dossier types */}
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>{t('dossier:form.abbreviation')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('dossier:form.abbreviationPlaceholder')}
                      className="min-h-11 uppercase"
                      maxLength={20}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase()
                        field.onChange(value)
                        updateDraft({ abbreviation: value })
                      }}
                    />
                  </FormControl>
                  <FormDescription>{t('dossier:form.abbreviationDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duplicate Detection Warning */}
            {(isCheckingDuplicates || similarDossiers.length > 0) && (
              <div className="mt-4">
                {isCheckingDuplicates && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('dossier:create.checkingDuplicates', 'Checking for similar dossiers...')}
                  </div>
                )}

                {!isCheckingDuplicates && hasHighSimilarity && highestMatch && (
                  <Alert variant="destructive" className="border-destructive/50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                      {t(
                        'dossier:create.duplicateWarning.highSimilarity.title',
                        'Potential Duplicate Detected',
                      )}
                    </AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>
                        {t('dossier:create.duplicateWarning.highSimilarity.description', {
                          similarity: Math.round(highestMatch.highest_similarity * 100),
                          name: isRTL ? highestMatch.name_ar : highestMatch.name_en,
                          type: t(`dossier:type.${highestMatch.type}`),
                        }) ||
                          `A ${highestMatch.type} with ${Math.round(highestMatch.highest_similarity * 100)}% similar name already exists: "${isRTL ? highestMatch.name_ar : highestMatch.name_en}"`}
                      </p>
                      <a
                        href={`/dossiers/${getDossierRouteSegment(highestMatch.type as DossierType)}/${highestMatch.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm underline"
                      >
                        {t('dossier:create.duplicateWarning.viewExisting', 'View existing dossier')}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </AlertDescription>
                  </Alert>
                )}

                {!isCheckingDuplicates &&
                  !hasHighSimilarity &&
                  hasMediumSimilarity &&
                  similarDossiers.length > 0 && (
                    <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      <AlertTitle className="text-yellow-700 dark:text-yellow-400">
                        {t(
                          'dossier:create.duplicateWarning.mediumSimilarity.title',
                          'Similar Dossiers Found',
                        )}
                      </AlertTitle>
                      <AlertDescription className="text-yellow-600 dark:text-yellow-300">
                        <p className="mb-2">
                          {t('dossier:create.duplicateWarning.mediumSimilarity.description', {
                            count: similarDossiers.length,
                          }) ||
                            `${similarDossiers.length} dossier(s) with similar names were found. Please verify this is not a duplicate.`}
                        </p>
                        <ul className="list-disc ps-5 space-y-1 text-sm">
                          {similarDossiers.slice(0, 3).map((d) => (
                            <li key={d.id}>
                              <a
                                href={`/dossiers/${getDossierRouteSegment(d.type as DossierType)}/${d.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-yellow-800 dark:hover:text-yellow-200"
                              >
                                {isRTL ? d.name_ar : d.name_en}
                              </a>{' '}
                              ({Math.round(d.highest_similarity * 100)}%{' '}
                              {t('dossier:create.duplicateWarning.match', 'match')})
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Description */}
              <FormField
                control={form.control}
                name="description_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dossier:form.descriptionEn')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('dossier:form.descriptionEnPlaceholder')}
                        className="min-h-[88px]"
                        rows={3}
                        onChange={(e) => {
                          field.onChange(e)
                          updateDraft({ description_en: e.target.value })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Arabic Description */}
              <FormField
                control={form.control}
                name="description_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dossier:form.descriptionAr')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('dossier:form.descriptionArPlaceholder')}
                        className="min-h-[88px]"
                        dir="rtl"
                        rows={3}
                        onChange={(e) => {
                          field.onChange(e)
                          updateDraft({ description_ar: e.target.value })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormWizardStep>
        )

      case 2: // Classification
        return (
          <FormWizardStep stepId="classification" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabelWithHelp
                      label={t('dossier:form.status')}
                      helpProps={{
                        tooltip: t('contextual-help:dossier.status.tooltip'),
                        title: t('contextual-help:dossier.status.title'),
                        description: t('contextual-help:dossier.status.description'),
                        mode: 'both',
                      }}
                    />
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        updateDraft({ status: value as any })
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-11">
                          <SelectValue placeholder={t('dossier:form.selectStatus')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t('dossier:status.active')}</SelectItem>
                        <SelectItem value="inactive">{t('dossier:status.inactive')}</SelectItem>
                        <SelectItem value="archived">{t('dossier:status.archived')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sensitivity Level */}
              <FormField
                control={form.control}
                name="sensitivity_level"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabelWithHelp
                      label={t('dossier:form.sensitivityLevel')}
                      helpProps={{
                        tooltip: t('contextual-help:dossier.sensitivityLevel.tooltip'),
                        title: t('contextual-help:dossier.sensitivityLevel.title'),
                        description: t('contextual-help:dossier.sensitivityLevel.description'),
                        mode: 'both',
                      }}
                    />
                    <Select
                      onValueChange={(value) => {
                        const numValue = Number(value)
                        field.onChange(numValue)
                        updateDraft({ sensitivity_level: numValue })
                      }}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-11">
                          <SelectValue placeholder={t('dossier:form.selectSensitivity')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4].map((level) => (
                          <SelectItem key={level} value={String(level)}>
                            {t(`dossier:sensitivityLevel.${level}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t('dossier:form.sensitivityDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormWizardStep>
        )

      case 3: // Type-specific fields
        return (
          <FormWizardStep stepId="type-specific" className="space-y-4">
            {/* Person fields */}
            <ConditionalField show={selectedType === 'person'}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="extension_data.title_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dossier:form.person.titleEn')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('dossier:form.person.titleEnPlaceholder')}
                            className="min-h-11"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('dossier:form.person.titleDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.title_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dossier:form.person.titleAr')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('dossier:form.person.titleArPlaceholder')}
                            className="min-h-11"
                            dir="rtl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="extension_data.photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dossier:form.person.photoUrl')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder={t('dossier:form.person.photoUrlPlaceholder')}
                          className="min-h-11"
                        />
                      </FormControl>
                      <FormDescription>
                        {t('dossier:form.person.photoUrlDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="extension_data.biography_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dossier:form.person.biographyEn')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('dossier:form.person.biographyEnPlaceholder')}
                            className="min-h-[120px]"
                            rows={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.biography_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dossier:form.person.biographyAr')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('dossier:form.person.biographyArPlaceholder')}
                            className="min-h-[120px]"
                            dir="rtl"
                            rows={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ConditionalField>

            {/* Country fields */}
            <ConditionalField show={selectedType === 'country'}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="extension_data.iso_code_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          ISO Code (2) <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="SA"
                            maxLength={2}
                            className="min-h-11 uppercase"
                            required
                          />
                        </FormControl>
                        <FormDescription>2-letter country code (required)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.iso_code_3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          ISO Code (3) <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="SAU"
                            maxLength={3}
                            className="min-h-11 uppercase"
                            required
                          />
                        </FormControl>
                        <FormDescription>3-letter country code (required)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Middle East" className="min-h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="extension_data.capital_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capital (English)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Riyadh" className="min-h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.capital_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capital (Arabic)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="الرياض" className="min-h-11" dir="rtl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ConditionalField>

            {/* Organization fields */}
            <ConditionalField show={selectedType === 'organization'}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="extension_data.org_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ORG-001" className="min-h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.org_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Organization Type <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-h-11">
                              <SelectValue placeholder="Select type (required)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="government">Government</SelectItem>
                            <SelectItem value="ngo">NGO</SelectItem>
                            <SelectItem value="private">Private Sector</SelectItem>
                            <SelectItem value="international">International</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="extension_data.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://example.org"
                          className="min-h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ConditionalField>

            {/* Engagement fields */}
            <ConditionalField show={selectedType === 'engagement'}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="extension_data.engagement_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Engagement Type <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-h-11">
                              <SelectValue placeholder="Select type (required)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="consultation">Consultation</SelectItem>
                            <SelectItem value="coordination">Coordination</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                            <SelectItem value="conference">Conference</SelectItem>
                            <SelectItem value="site_visit">Site Visit</SelectItem>
                            <SelectItem value="ceremony">Ceremony</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.engagement_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Category <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-h-11">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bilateral">Bilateral</SelectItem>
                            <SelectItem value="multilateral">Multilateral</SelectItem>
                            <SelectItem value="regional">Regional</SelectItem>
                            <SelectItem value="internal">Internal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="extension_data.location_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (English)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Riyadh, Saudi Arabia"
                            className="min-h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.location_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Arabic)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="الرياض، المملكة العربية السعودية"
                            className="min-h-11"
                            dir="rtl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ConditionalField>

            {/* Forum fields */}
            <ConditionalField show={selectedType === 'forum'}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="extension_data.organizing_body_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dossier:form.forum.organizingBody')}</FormLabel>
                      <FormControl>
                        <DossierPicker
                          value={field.value || undefined}
                          onChange={(dossierId, dossier) => {
                            field.onChange(dossierId || '')
                            // Store the selected dossier info for display in review
                            if (dossier) {
                              form.setValue('extension_data.organizing_body_id', dossier.id)
                              // Use the appropriate language name based on current locale
                              const displayName = isRTL
                                ? dossier.name_ar || dossier.name_en
                                : dossier.name_en
                              setOrganizingBodyName(displayName)
                            } else {
                              setOrganizingBodyName('')
                            }
                          }}
                          placeholder={t('dossier:form.forum.selectOrganizingBody')}
                          filterByDossierType="organization"
                          allowQuickAdd
                          onQuickAdd={(name) => {
                            // Open the quick-add organization modal
                            setQuickAddOrgName(name)
                            setShowQuickAddOrg(true)
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('dossier:form.forum.organizingBodyDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ConditionalField>

            {/* Topic fields */}
            <ConditionalField show={selectedType === 'topic'}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="extension_data.theme_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('dossier:form.topic.category')}{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-11">
                            <SelectValue
                              placeholder={`${t('dossier:form.topic.categoryPlaceholder')} (required)`}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="policy">
                            {t('dossier:form.topic.categories.policy')}
                          </SelectItem>
                          <SelectItem value="technical">
                            {t('dossier:form.topic.categories.technical')}
                          </SelectItem>
                          <SelectItem value="strategic">
                            {t('dossier:form.topic.categories.strategic')}
                          </SelectItem>
                          <SelectItem value="operational">
                            {t('dossier:form.topic.categories.operational')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('dossier:form.topic.categoryDescription')} (required)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ConditionalField>

            {/* Working Group fields */}
            <ConditionalField show={selectedType === 'working_group'}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="extension_data.wg_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dossier:form.workingGroup.status')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-11">
                            <SelectValue
                              placeholder={t('dossier:form.workingGroup.statusPlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">
                            {t('dossier:form.workingGroup.statuses.active')}
                          </SelectItem>
                          <SelectItem value="suspended">
                            {t('dossier:form.workingGroup.statuses.suspended')}
                          </SelectItem>
                          <SelectItem value="disbanded">
                            {t('dossier:form.workingGroup.statuses.disbanded')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extension_data.established_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dossier:form.workingGroup.establishedDate')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="min-h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="extension_data.mandate_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dossier:form.workingGroup.mandateEn')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('dossier:form.workingGroup.mandateEnPlaceholder')}
                            className="min-h-[100px]"
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('dossier:form.workingGroup.mandateDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.mandate_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dossier:form.workingGroup.mandateAr')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('dossier:form.workingGroup.mandateArPlaceholder')}
                            className="min-h-[100px]"
                            dir="rtl"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ConditionalField>
          </FormWizardStep>
        )

      case 4: // Review
        return (
          <FormWizardStep stepId="review" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedType &&
                    (() => {
                      const Icon = typeIcons[selectedType as DossierType]
                      return Icon ? <Icon className="h-5 w-5 text-primary" /> : null
                    })()}
                  <CardTitle className="text-lg">
                    {formValues.abbreviation && (
                      <span className="text-muted-foreground me-2">
                        ({formValues.abbreviation})
                      </span>
                    )}
                    {isRTL ? formValues.name_ar : formValues.name_en}
                  </CardTitle>
                  <Badge variant="outline" className="ms-auto">
                    {selectedType && t(`dossier:type.${selectedType}`)}
                  </Badge>
                </div>
                {(formValues.description_en || formValues.description_ar) && (
                  <CardDescription>
                    {isRTL ? formValues.description_ar : formValues.description_en}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('dossier:form.nameEn')}</p>
                    <p className="font-medium">{formValues.name_en || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('dossier:form.nameAr')}</p>
                    <p className="font-medium" dir="rtl">
                      {formValues.name_ar || '-'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('dossier:form.status')}</p>
                    <Badge variant="outline">{t(`dossier:status.${formValues.status}`)}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('dossier:form.sensitivityLevel')}</p>
                    <Badge variant="outline">
                      {t(`dossier:sensitivityLevel.${formValues.sensitivity_level}`)}
                    </Badge>
                  </div>
                </div>

                {/* Type-specific review */}
                {selectedType === 'person' && formValues.extension_data?.title_en && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('dossier:form.person.titleEn')}</p>
                        <p className="font-medium">{formValues.extension_data.title_en}</p>
                      </div>
                      {formValues.extension_data.title_ar && (
                        <div>
                          <p className="text-muted-foreground">
                            {t('dossier:form.person.titleAr')}
                          </p>
                          <p className="font-medium" dir="rtl">
                            {formValues.extension_data.title_ar}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedType === 'country' && formValues.extension_data?.iso_code_2 && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">ISO Code</p>
                        <p className="font-medium uppercase">
                          {formValues.extension_data.iso_code_2} /{' '}
                          {formValues.extension_data.iso_code_3}
                        </p>
                      </div>
                      {formValues.extension_data.region && (
                        <div>
                          <p className="text-muted-foreground">Region</p>
                          <p className="font-medium">{formValues.extension_data.region}</p>
                        </div>
                      )}
                      {formValues.extension_data.capital_en && (
                        <div>
                          <p className="text-muted-foreground">Capital</p>
                          <p className="font-medium">{formValues.extension_data.capital_en}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Organization review */}
                {selectedType === 'organization' && formValues.extension_data?.org_type && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Organization Type</p>
                        <Badge variant="outline" className="capitalize">
                          {formValues.extension_data.org_type}
                        </Badge>
                      </div>
                      {formValues.extension_data.org_code && (
                        <div>
                          <p className="text-muted-foreground">Code</p>
                          <p className="font-medium">{formValues.extension_data.org_code}</p>
                        </div>
                      )}
                      {formValues.extension_data.website && (
                        <div>
                          <p className="text-muted-foreground">Website</p>
                          <p className="font-medium text-primary truncate">
                            {formValues.extension_data.website}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Engagement review */}
                {selectedType === 'engagement' && formValues.extension_data?.engagement_type && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Engagement Type</p>
                        <Badge variant="outline" className="capitalize">
                          {formValues.extension_data.engagement_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <Badge variant="outline" className="capitalize">
                          {formValues.extension_data.engagement_category}
                        </Badge>
                      </div>
                    </div>
                    {(formValues.extension_data.location_en ||
                      formValues.extension_data.location_ar) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                        {formValues.extension_data.location_en && (
                          <div>
                            <p className="text-muted-foreground">Location (EN)</p>
                            <p className="font-medium">{formValues.extension_data.location_en}</p>
                          </div>
                        )}
                        {formValues.extension_data.location_ar && (
                          <div>
                            <p className="text-muted-foreground">Location (AR)</p>
                            <p className="font-medium" dir="rtl">
                              {formValues.extension_data.location_ar}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Forum review */}
                {selectedType === 'forum' &&
                  formValues.extension_data?.organizing_body_id &&
                  organizingBodyName && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          {t('dossier:form.forum.organizingBody')}
                        </p>
                        <p className="font-medium">{organizingBodyName}</p>
                      </div>
                    </>
                  )}

                {/* Topic review */}
                {selectedType === 'topic' && formValues.extension_data?.theme_category && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      <p className="text-muted-foreground">{t('dossier:form.topic.category')}</p>
                      <Badge variant="outline">
                        {t(
                          `dossier:form.topic.categories.${formValues.extension_data.theme_category}`,
                        )}
                      </Badge>
                    </div>
                  </>
                )}

                {/* Working Group review */}
                {selectedType === 'working_group' && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {formValues.extension_data?.wg_status && (
                        <div>
                          <p className="text-muted-foreground">
                            {t('dossier:form.workingGroup.status')}
                          </p>
                          <Badge variant="outline" className="capitalize">
                            {t(
                              `dossier:form.workingGroup.statuses.${formValues.extension_data.wg_status}`,
                            )}
                          </Badge>
                        </div>
                      )}
                      {formValues.extension_data?.established_date && (
                        <div>
                          <p className="text-muted-foreground">
                            {t('dossier:form.workingGroup.establishedDate')}
                          </p>
                          <p className="font-medium">
                            {formValues.extension_data.established_date}
                          </p>
                        </div>
                      )}
                    </div>
                    {(formValues.extension_data?.mandate_en ||
                      formValues.extension_data?.mandate_ar) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                        {formValues.extension_data.mandate_en && (
                          <div>
                            <p className="text-muted-foreground">
                              {t('dossier:form.workingGroup.mandateEn')}
                            </p>
                            <p className="font-medium line-clamp-3">
                              {formValues.extension_data.mandate_en}
                            </p>
                          </div>
                        )}
                        {formValues.extension_data.mandate_ar && (
                          <div>
                            <p className="text-muted-foreground">
                              {t('dossier:form.workingGroup.mandateAr')}
                            </p>
                            <p className="font-medium line-clamp-3" dir="rtl">
                              {formValues.extension_data.mandate_ar}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </FormWizardStep>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <FormWizard
              steps={steps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onSaveDraft={handleSaveDraft}
              isLoading={createMutation.isPending}
              isDraftSaving={isDraftSaving}
              hasDraft={hasDraft}
              canComplete={
                !!selectedType &&
                (formValues.name_en?.length ?? 0) >= 2 &&
                (formValues.name_ar?.length ?? 0) >= 2
              }
              completeButtonText={t('dossier:form.create')}
              completeButtonTextAr="إنشاء الملف"
              allowStepNavigation={true}
              namespace="form-wizard"
              actionBarMode="auto"
            >
              {renderStepContent()}
            </FormWizard>
          </form>
        </Form>
      </FormProvider>

      {/* Quick-add Organization Dialog */}
      <Dialog open={showQuickAddOrg} onOpenChange={setShowQuickAddOrg}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {t('dossier:form.forum.quickAddOrg', 'Quick Add Organization')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'dossier:form.forum.quickAddOrgDescription',
                'Create a new organization dossier. You can add more details later.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name-en">{t('dossier:form.nameEn')}</Label>
              <Input
                id="org-name-en"
                value={quickAddOrgName}
                onChange={(e) => setQuickAddOrgName(e.target.value)}
                placeholder={t('dossier:form.nameEnPlaceholder')}
                className="min-h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-type">{t('dossier:form.organization.type')}</Label>
              <Select
                value={quickAddOrgType}
                onValueChange={(value) => setQuickAddOrgType(value as typeof quickAddOrgType)}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={t('dossier:form.organization.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="international">
                    {t('dossier:form.organization.types.international')}
                  </SelectItem>
                  <SelectItem value="government">
                    {t('dossier:form.organization.types.government')}
                  </SelectItem>
                  <SelectItem value="ngo">{t('dossier:form.organization.types.ngo')}</SelectItem>
                  <SelectItem value="academic">
                    {t('dossier:form.organization.types.academic')}
                  </SelectItem>
                  <SelectItem value="private">
                    {t('dossier:form.organization.types.private')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuickAddOrg(false)}
              disabled={isCreatingOrg}
              className="min-h-11"
            >
              {t('dossier:form.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleQuickAddOrg}
              disabled={!quickAddOrgName.trim() || isCreatingOrg}
              className="min-h-11"
            >
              {isCreatingOrg ? (
                <>
                  <Loader2 className="size-4 me-2 animate-spin" />
                  {t('dossier:form.creating', 'Creating...')}
                </>
              ) : (
                t('dossier:form.forum.createOrg', 'Create Organization')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

