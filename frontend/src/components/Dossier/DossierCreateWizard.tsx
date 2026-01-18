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

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
} from 'lucide-react'
import { toast } from 'sonner'

import {
  FormWizard,
  FormWizardStep,
  useFormDraft,
  ConditionalField,
} from '@/components/ui/form-wizard'
import { DossierTypeSelector } from '@/components/Dossier/DossierTypeSelector'
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
import { cn } from '@/lib/utils'
import { getDossierDetailPath } from '@/lib/dossier-routes'

import { useCreateDossier } from '@/hooks/useDossier'
import type { DossierType, CreateDossierRequest } from '@/services/dossier-api'

// Draft key for localStorage
const DRAFT_KEY = 'dossier-create-draft'

// Form schema
const dossierSchema = z.object({
  type: z
    .enum([
      'country',
      'organization',
      'forum',
      'engagement',
      'topic',
      'theme',
      'working_group',
      'person',
    ])
    .optional(),
  name_en: z.string().min(2, { message: 'English name must be at least 2 characters' }),
  name_ar: z.string().min(2, { message: 'Arabic name must be at least 2 characters' }),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived', 'deleted']).default('active'),
  sensitivity_level: z.number().min(0).max(5).default(0),
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
    })
    .optional(),
})

type DossierFormData = z.infer<typeof dossierSchema>

// Default form values
const defaultValues: DossierFormData = {
  type: undefined,
  name_en: '',
  name_ar: '',
  description_en: '',
  description_ar: '',
  status: 'active',
  sensitivity_level: 0,
  tags: [],
  extension_data: {},
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

import type { TemplateSection } from '@/types/dossier-template.types'

interface DossierCreateWizardProps {
  onSuccess?: (dossierId: string, dossierType?: DossierType) => void
  onCancel?: () => void
  className?: string
  /** Initial dossier type (when using a template) */
  initialType?: DossierType
  /** Template sections for guidance (when using a template) */
  templateSections?: TemplateSection[]
  /** Recommended tags from template */
  recommendedTags?: string[]
}

export function DossierCreateWizard({
  onSuccess,
  onCancel,
  className,
  initialType,
  templateSections,
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
  const form = useForm<DossierFormData>({
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

  // Wizard step state - skip type selection if initialType is provided
  const [currentStep, setCurrentStep] = useState(() => {
    // If initial type from template, skip to basic info step
    if (initialType) return 1
    // If draft has type selected, start at step 1
    if (draft.type) return 1
    return 0
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
        isOptional: true,
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
    try {
      const values = form.getValues()
      if (!values.type) {
        toast.error(t('dossier:create.error'))
        return
      }

      const createData: CreateDossierRequest = {
        type: values.type as DossierType,
        name_en: values.name_en,
        name_ar: values.name_ar,
        description_en: values.description_en || undefined,
        description_ar: values.description_ar || undefined,
        status: values.status,
        sensitivity_level: values.sensitivity_level,
        tags: values.tags || [],
        extensionData: values.extension_data,
      }

      const newDossier = await createMutation.mutateAsync(createData)
      clearDraft() // Clear draft on success
      toast.success(t('dossier:create.success'))

      if (onSuccess) {
        onSuccess(newDossier.id, newDossier.type)
      } else {
        navigate({ to: getDossierDetailPath(newDossier.id, newDossier.type) })
      }
    } catch (error: any) {
      toast.error(error?.message || t('dossier:create.error'))
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
                        {[0, 1, 2, 3, 4, 5].map((level) => (
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
                        <FormLabel>ISO Code (2)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="SA"
                            maxLength={2}
                            className="min-h-11 uppercase"
                          />
                        </FormControl>
                        <FormDescription>2-letter country code</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extension_data.iso_code_3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ISO Code (3)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="SAU"
                            maxLength={3}
                            className="min-h-11 uppercase"
                          />
                        </FormControl>
                        <FormDescription>3-letter country code</FormDescription>
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
                        <FormLabel>Organization Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-h-11">
                              <SelectValue placeholder="Select type" />
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
                        <FormLabel>Engagement Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-h-11">
                              <SelectValue placeholder="Select type" />
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
                        <FormLabel>Category</FormLabel>
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

            {/* Placeholder for other types */}
            <ConditionalField
              show={
                !['person', 'country', 'organization', 'engagement'].includes(selectedType || '')
              }
            >
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  {t('dossier:form.typeSpecificFieldsPlaceholder', {
                    type: selectedType ? t(`dossier:type.${selectedType}`) : '',
                  })}
                </p>
                <p className="text-sm mt-2">{t('form-wizard:optional')}</p>
              </div>
            </ConditionalField>
          </FormWizardStep>
        )

      case 4: // Review
        return (
          <FormWizardStep stepId="review" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {selectedType &&
                    (() => {
                      const Icon = typeIcons[selectedType as DossierType]
                      return Icon ? <Icon className="h-5 w-5 text-primary" /> : null
                    })()}
                  <CardTitle className="text-lg">
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
                          {formValues.extension_data.iso_code_2}
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
                !!selectedType && formValues.name_en.length >= 2 && formValues.name_ar.length >= 2
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
    </div>
  )
}

export default DossierCreateWizard
