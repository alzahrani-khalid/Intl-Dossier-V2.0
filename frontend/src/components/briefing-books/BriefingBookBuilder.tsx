/**
 * BriefingBookBuilder Component
 * Feature: briefing-book-generator
 *
 * Multi-step wizard for configuring and generating briefing books.
 * Supports entity selection, section configuration, and export options.
 *
 * Mobile-first with RTL support.
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  GripVertical,
  Plus,
  Trash2,
  Building2,
  Globe,
  Users,
  Palette,
  Calendar,
  Search,
} from 'lucide-react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { useBriefingBooks, useBriefingBookTemplates } from '@/hooks/useBriefingBooks'
import { useDossiers } from '@/hooks/useDossiers'
import type {
  BriefingBookConfig,
  BriefingBookEntity,
  BriefingBookFormat,
  BriefingBookSection,
  BriefingBookTopic,
  DEFAULT_SECTIONS,
  BRIEFING_TOPICS,
} from '@/types/briefing-book.types'
import type { DossierType } from '@/types/dossier'

interface BriefingBookBuilderProps {
  onSuccess?: () => void
  onCancel?: () => void
}

// Step indicator
const STEPS = ['entities', 'sections', 'options', 'review'] as const
type Step = (typeof STEPS)[number]

// Entity type icons
const entityIcons: Record<DossierType, typeof Globe> = {
  country: Globe,
  organization: Building2,
  forum: Users,
  theme: Palette,
}

// Sortable section item component
function SortableSectionItem({
  section,
  onToggle,
  language,
}: {
  section: BriefingBookSection
  onToggle: (type: string) => void
  language: 'en' | 'ar'
}) {
  const { t } = useTranslation('briefing-books')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.type,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-background p-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{t(`builder.sections.sectionTypes.${section.type}`)}</p>
        <p className="truncate text-sm text-muted-foreground">
          {language === 'ar' ? section.title_ar : section.title_en}
        </p>
      </div>
      <Switch checked={section.enabled} onCheckedChange={() => onToggle(section.type)} />
    </div>
  )
}

export function BriefingBookBuilder({ onSuccess, onCancel }: BriefingBookBuilderProps) {
  const { t, i18n } = useTranslation('briefing-books')
  const isRTL = i18n.language === 'ar'

  // Hooks
  const { createBriefingBook, isGenerating, progress } = useBriefingBooks({
    onCreateSuccess: () => {
      onSuccess?.()
    },
  })
  const { data: templates } = useBriefingBookTemplates()
  const { data: dossiersList } = useDossiers({})

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>('entities')
  const [searchQuery, setSearchQuery] = useState('')

  // Config state
  const [config, setConfig] = useState<Partial<BriefingBookConfig>>({
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    entities: [],
    sections: [
      {
        type: 'executive_summary',
        title_en: 'Executive Summary',
        title_ar: 'الملخص التنفيذي',
        enabled: true,
        order: 1,
      },
      {
        type: 'entity_overview',
        title_en: 'Entity Overview',
        title_ar: 'نظرة عامة على الجهة',
        enabled: true,
        order: 2,
      },
      {
        type: 'key_contacts',
        title_en: 'Key Contacts',
        title_ar: 'جهات الاتصال الرئيسية',
        enabled: true,
        order: 3,
      },
      {
        type: 'recent_engagements',
        title_en: 'Recent Engagements',
        title_ar: 'التعاملات الأخيرة',
        enabled: true,
        order: 4,
      },
      {
        type: 'positions',
        title_en: 'Positions & Talking Points',
        title_ar: 'المواقف ونقاط النقاش',
        enabled: true,
        order: 5,
      },
      {
        type: 'mou_agreements',
        title_en: 'MoU Agreements',
        title_ar: 'مذكرات التفاهم',
        enabled: true,
        order: 6,
      },
      {
        type: 'commitments',
        title_en: 'Commitments & Deliverables',
        title_ar: 'الالتزامات والمخرجات',
        enabled: true,
        order: 7,
      },
      {
        type: 'timeline',
        title_en: 'Timeline',
        title_ar: 'الجدول الزمني',
        enabled: false,
        order: 8,
      },
      {
        type: 'documents',
        title_en: 'Related Documents',
        title_ar: 'المستندات ذات الصلة',
        enabled: false,
        order: 9,
      },
      {
        type: 'relationship_map',
        title_en: 'Relationship Map',
        title_ar: 'خريطة العلاقات',
        enabled: false,
        order: 10,
      },
      {
        type: 'intelligence',
        title_en: 'Intelligence & Signals',
        title_ar: 'المعلومات والإشارات',
        enabled: false,
        order: 11,
      },
    ],
    topics: [],
    format: 'pdf',
    primaryLanguage: 'en',
    includeBilingual: true,
    includeTableOfContents: true,
    includePageNumbers: true,
    includeBookmarks: true,
    includeCoverPage: true,
    includeExecutiveSummary: true,
    maxSensitivityLevel: 'high',
  })

  // Date range state
  const [dateRangePreset, setDateRangePreset] = useState<string>('last90days')
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    const now = new Date()
    let start: Date

    switch (dateRangePreset) {
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last90days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'last6months':
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case 'lastYear':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          return {
            startDate: customDateRange.start,
            endDate: customDateRange.end,
          }
        }
        return undefined
      default:
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    }
  }, [dateRangePreset, customDateRange])

  // Filtered dossiers for search
  const filteredDossiers = useMemo(() => {
    if (!dossiersList?.data) return []
    const query = searchQuery.toLowerCase()
    return dossiersList.data.filter(
      (d) =>
        d.name_en.toLowerCase().includes(query) ||
        d.name_ar.includes(query) ||
        d.type.toLowerCase().includes(query),
    )
  }, [dossiersList, searchQuery])

  // Selected entity IDs
  const selectedEntityIds = useMemo(
    () => new Set(config.entities?.map((e) => e.id) ?? []),
    [config.entities],
  )

  // Handlers
  const toggleEntity = useCallback(
    (dossier: { id: string; name_en: string; name_ar: string; type: DossierType }) => {
      setConfig((prev) => {
        const entities = prev.entities ?? []
        const exists = entities.find((e) => e.id === dossier.id)

        if (exists) {
          return {
            ...prev,
            entities: entities.filter((e) => e.id !== dossier.id),
          }
        }

        return {
          ...prev,
          entities: [
            ...entities,
            {
              id: dossier.id,
              type: dossier.type,
              name_en: dossier.name_en,
              name_ar: dossier.name_ar,
              includedSections: prev.sections?.filter((s) => s.enabled).map((s) => s.type) ?? [],
            },
          ],
        }
      })
    },
    [],
  )

  const toggleSection = useCallback((sectionType: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections?.map((s) =>
        s.type === sectionType ? { ...s, enabled: !s.enabled } : s,
      ),
    }))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setConfig((prev) => {
      const sections = prev.sections ?? []
      const oldIndex = sections.findIndex((s) => s.type === active.id)
      const newIndex = sections.findIndex((s) => s.type === over.id)
      const newSections = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        order: idx + 1,
      }))
      return { ...prev, sections: newSections }
    })
  }, [])

  const toggleTopic = useCallback((topic: BriefingBookTopic) => {
    setConfig((prev) => {
      const topics = prev.topics ?? []
      const exists = topics.includes(topic)
      return {
        ...prev,
        topics: exists ? topics.filter((t) => t !== topic) : [...topics, topic],
      }
    })
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!config.entities?.length) return

    await createBriefingBook({
      config: {
        title_en: config.title_en || 'Briefing Book',
        title_ar: config.title_ar || 'كتاب الإحاطة',
        description_en: config.description_en,
        description_ar: config.description_ar,
        entities: config.entities as BriefingBookEntity[],
        dateRange,
        topics: config.topics as BriefingBookTopic[],
        sections: config.sections as BriefingBookSection[],
        format: config.format as BriefingBookFormat,
        primaryLanguage: config.primaryLanguage as 'en' | 'ar',
        includeBilingual: config.includeBilingual ?? true,
        includeTableOfContents: config.includeTableOfContents ?? true,
        includePageNumbers: config.includePageNumbers ?? true,
        includeBookmarks: config.includeBookmarks ?? true,
        includeCoverPage: config.includeCoverPage ?? true,
        includeExecutiveSummary: config.includeExecutiveSummary ?? true,
        maxSensitivityLevel: config.maxSensitivityLevel,
        headerText: config.headerText,
        footerText: config.footerText,
      },
    })
  }, [config, dateRange, createBriefingBook])

  // Navigation
  const currentStepIndex = STEPS.indexOf(currentStep)
  const canGoBack = currentStepIndex > 0
  const canGoNext = currentStepIndex < STEPS.length - 1

  const goBack = () => {
    if (canGoBack) {
      setCurrentStep(STEPS[currentStepIndex - 1])
    }
  }

  const goNext = () => {
    if (canGoNext) {
      setCurrentStep(STEPS[currentStepIndex + 1])
    }
  }

  // Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'entities':
        return (config.entities?.length ?? 0) > 0
      case 'sections':
        return config.sections?.some((s) => s.enabled) ?? false
      case 'options':
        return true
      case 'review':
        return true
      default:
        return false
    }
  }, [currentStep, config])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'entities':
        return (
          <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Title input */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('builder.configuration.title')}</Label>
              <Input
                id="title"
                placeholder={t('builder.configuration.titlePlaceholder')}
                value={isRTL ? config.title_ar : config.title_en}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    [isRTL ? 'title_ar' : 'title_en']: e.target.value,
                  }))
                }
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('builder.entities.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>

            {/* Selected entities */}
            {(config.entities?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {config.entities?.map((entity) => {
                  const Icon = entityIcons[entity.type]
                  return (
                    <Badge
                      key={entity.id}
                      variant="secondary"
                      className="cursor-pointer gap-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() =>
                        toggleEntity({
                          id: entity.id,
                          name_en: entity.name_en,
                          name_ar: entity.name_ar,
                          type: entity.type,
                        })
                      }
                    >
                      <Icon className="size-3" />
                      {isRTL ? entity.name_ar : entity.name_en}
                      <Trash2 className="ms-1 size-3" />
                    </Badge>
                  )
                })}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {t('builder.entities.selected', { count: config.entities?.length ?? 0 })}
            </p>

            {/* Entity list */}
            <ScrollArea className="h-[300px] rounded-lg border sm:h-[400px]">
              <div className="space-y-2 p-4">
                {filteredDossiers.map((dossier) => {
                  const Icon = entityIcons[dossier.type]
                  const isSelected = selectedEntityIds.has(dossier.id)

                  return (
                    <div
                      key={dossier.id}
                      className={`
                        flex min-h-touch-sm cursor-pointer items-center gap-3 rounded-lg border
                        p-3 transition-colors
                        ${isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted'}
                      `}
                      onClick={() =>
                        toggleEntity({
                          id: dossier.id,
                          name_en: dossier.name_en,
                          name_ar: dossier.name_ar,
                          type: dossier.type,
                        })
                      }
                    >
                      <Checkbox checked={isSelected} />
                      <Icon className="size-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {isRTL ? dossier.name_ar : dossier.name_en}
                        </p>
                        <p className="text-xs capitalize text-muted-foreground">{dossier.type}</p>
                      </div>
                    </div>
                  )
                })}

                {filteredDossiers.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">
                    {searchQuery ? 'No matching entities found' : 'No entities available'}
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Date range */}
            <div className="space-y-2">
              <Label>{t('builder.dateRange.title')}</Label>
              <Select value={dateRangePreset} onValueChange={setDateRangePreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last30days">
                    {t('builder.dateRange.presets.last30days')}
                  </SelectItem>
                  <SelectItem value="last90days">
                    {t('builder.dateRange.presets.last90days')}
                  </SelectItem>
                  <SelectItem value="last6months">
                    {t('builder.dateRange.presets.last6months')}
                  </SelectItem>
                  <SelectItem value="lastYear">
                    {t('builder.dateRange.presets.lastYear')}
                  </SelectItem>
                  <SelectItem value="custom">{t('builder.dateRange.presets.custom')}</SelectItem>
                </SelectContent>
              </Select>

              {dateRangePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">{t('builder.dateRange.startDate')}</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) =>
                        setCustomDateRange((prev) => ({ ...prev, start: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">{t('builder.dateRange.endDate')}</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) =>
                        setCustomDateRange((prev) => ({ ...prev, end: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'sections':
        return (
          <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold">{t('builder.sections.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('builder.sections.subtitle')}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      sections: prev.sections?.map((s) => ({ ...s, enabled: true })),
                    }))
                  }
                >
                  {t('builder.sections.enableAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      sections: prev.sections?.map((s) => ({ ...s, enabled: false })),
                    }))
                  }
                >
                  {t('builder.sections.disableAll')}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t('builder.sections.reorder')}</p>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={config.sections?.map((s) => s.type) ?? []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {config.sections
                    ?.sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <SortableSectionItem
                        key={section.type}
                        section={section}
                        onToggle={toggleSection}
                        language={isRTL ? 'ar' : 'en'}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Topics */}
            <Separator />
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">{t('builder.topics.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('builder.topics.subtitle')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'statistics',
                  'economy',
                  'trade',
                  'technology',
                  'environment',
                  'health',
                  'education',
                  'governance',
                  'cooperation',
                  'other',
                ].map((topic) => (
                  <Badge
                    key={topic}
                    variant={
                      config.topics?.includes(topic as BriefingBookTopic) ? 'default' : 'outline'
                    }
                    className="min-h-[32px] cursor-pointer px-3"
                    onClick={() => toggleTopic(topic as BriefingBookTopic)}
                  >
                    {t(`topics.${topic}`)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )

      case 'options':
        return (
          <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Format */}
            <div className="space-y-3">
              <Label>{t('builder.options.format.title')}</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(['pdf', 'docx', 'html'] as const).map((format) => (
                  <Card
                    key={format}
                    className={`cursor-pointer transition-colors ${
                      config.format === format ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setConfig((prev) => ({ ...prev, format }))}
                  >
                    <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                      <FileDown className="size-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium uppercase">{format}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`builder.options.format.${format}Desc`)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="space-y-3">
              <Label>{t('builder.options.language.title')}</Label>
              <Select
                value={config.primaryLanguage}
                onValueChange={(v) =>
                  setConfig((prev) => ({ ...prev, primaryLanguage: v as 'en' | 'ar' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('builder.options.language.en')}</SelectItem>
                  <SelectItem value="ar">{t('builder.options.language.ar')}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('builder.options.language.bilingual')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('builder.options.language.bilingualDesc')}
                  </p>
                </div>
                <Switch
                  checked={config.includeBilingual}
                  onCheckedChange={(v) => setConfig((prev) => ({ ...prev, includeBilingual: v }))}
                />
              </div>
            </div>

            {/* Layout options */}
            <div className="space-y-3">
              <Label>{t('builder.options.layout.title')}</Label>
              <div className="space-y-3">
                {[
                  {
                    key: 'includeTableOfContents',
                    label: 'tableOfContents',
                    desc: 'tableOfContentsDesc',
                  },
                  { key: 'includePageNumbers', label: 'pageNumbers', desc: null },
                  { key: 'includeBookmarks', label: 'bookmarks', desc: 'bookmarksDesc' },
                  { key: 'includeCoverPage', label: 'coverPage', desc: null },
                  {
                    key: 'includeExecutiveSummary',
                    label: 'executiveSummary',
                    desc: 'executiveSummaryDesc',
                  },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label>{t(`builder.options.layout.${label}`)}</Label>
                      {desc && (
                        <p className="text-xs text-muted-foreground">
                          {t(`builder.options.layout.${desc}`)}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={config[key as keyof typeof config] as boolean}
                      onCheckedChange={(v) => setConfig((prev) => ({ ...prev, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Sensitivity */}
            <div className="space-y-3">
              <Label>{t('builder.options.sensitivity.title')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('builder.options.sensitivity.description')}
              </p>
              <Select
                value={config.maxSensitivityLevel}
                onValueChange={(v) =>
                  setConfig((prev) => ({
                    ...prev,
                    maxSensitivityLevel: v as 'low' | 'medium' | 'high',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('builder.options.sensitivity.low')}</SelectItem>
                  <SelectItem value="medium">{t('builder.options.sensitivity.medium')}</SelectItem>
                  <SelectItem value="high">{t('builder.options.sensitivity.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branding */}
            <div className="space-y-3">
              <Label>{t('builder.options.branding.title')}</Label>
              <Input
                placeholder={t('builder.options.branding.headerPlaceholder')}
                value={config.headerText ?? ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, headerText: e.target.value }))}
              />
              <Input
                placeholder={t('builder.options.branding.footerPlaceholder')}
                value={config.footerText ?? ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, footerText: e.target.value }))}
              />
            </div>
          </div>
        )

      case 'review':
        const enabledSections = config.sections?.filter((s) => s.enabled) ?? []

        return (
          <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {isRTL ? config.title_ar || 'كتاب الإحاطة' : config.title_en || 'Briefing Book'}
                </CardTitle>
                {(config.description_en || config.description_ar) && (
                  <CardDescription>
                    {isRTL ? config.description_ar : config.description_en}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">
                      {t('builder.review.entitiesCount', { count: config.entities?.length ?? 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {t('builder.review.sectionsCount', { count: enabledSections.length })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {t('builder.review.estimatedPages', {
                        count: Math.max(
                          enabledSections.length * 2,
                          (config.entities?.length ?? 0) * 3,
                        ),
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('builder.review.formatLabel')}</span>
                    <span className="font-medium uppercase">{config.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('builder.review.languageLabel')}
                    </span>
                    <span>{config.primaryLanguage === 'ar' ? 'Arabic' : 'English'}</span>
                  </div>
                  {dateRange && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('builder.review.dateRangeLabel')}
                      </span>
                      <span>
                        {dateRange.startDate} - {dateRange.endDate}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('builder.review.topicsLabel')}</span>
                    <span>
                      {(config.topics?.length ?? 0) > 0
                        ? config.topics?.map((t) => t).join(', ')
                        : t('builder.review.noTopics')}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('builder.review.includesLabel')}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {config.includeTableOfContents && (
                      <Badge variant="outline">{t('builder.review.tableOfContents')}</Badge>
                    )}
                    {config.includeBookmarks && (
                      <Badge variant="outline">{t('builder.review.bookmarks')}</Badge>
                    )}
                    {config.includeCoverPage && (
                      <Badge variant="outline">{t('builder.review.coverPage')}</Badge>
                    )}
                    {config.includeExecutiveSummary && (
                      <Badge variant="outline">{t('builder.review.executiveSummary')}</Badge>
                    )}
                    {config.includeBilingual && (
                      <Badge variant="outline">{t('builder.review.bilingualContent')}</Badge>
                    )}
                  </div>
                </div>

                {/* Entities preview */}
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Entities:</p>
                  <div className="flex flex-wrap gap-2">
                    {config.entities?.map((entity) => {
                      const Icon = entityIcons[entity.type]
                      return (
                        <Badge key={entity.id} variant="secondary" className="gap-1">
                          <Icon className="size-3" />
                          {isRTL ? entity.name_ar : entity.name_en}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {/* Sections preview */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sections:</p>
                  <ol className="list-inside list-decimal text-sm text-muted-foreground">
                    {enabledSections
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                        <li key={section.type}>{isRTL ? section.title_ar : section.title_en}</li>
                      ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  // Generation progress overlay
  if (isGenerating && progress) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              {t('generation.title')}
            </CardTitle>
            <CardDescription>{t('generation.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress.progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {isRTL ? progress.message_ar : progress.message_en}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{t('builder.title')}</h2>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, idx) => {
          const isActive = step === currentStep
          const isCompleted = idx < currentStepIndex
          const stepNumber = idx + 1

          return (
            <button
              key={step}
              type="button"
              className={`
                flex min-h-touch-sm flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3
                py-2 text-sm transition-colors
                ${isActive ? 'bg-primary text-primary-foreground' : ''}
                ${isCompleted ? 'bg-primary/10 text-primary' : ''}
                ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
              `}
              onClick={() => idx <= currentStepIndex && setCurrentStep(step)}
              disabled={idx > currentStepIndex}
            >
              <span
                className={`
                  flex size-6 items-center justify-center rounded-full text-xs font-medium
                  ${isActive ? 'bg-primary-foreground text-primary' : ''}
                  ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                  ${!isActive && !isCompleted ? 'bg-muted-foreground/20' : ''}
                `}
              >
                {isCompleted ? <Check className="size-3" /> : stepNumber}
              </span>
              <span className="hidden sm:inline">{t(`builder.step${stepNumber}`)}</span>
            </button>
          )
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-4 sm:flex-row">
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="min-h-touch-sm">
              {t('actions.cancel')}
            </Button>
          )}
          {canGoBack && (
            <Button variant="outline" onClick={goBack} className="min-h-touch-sm">
              {isRTL ? (
                <ChevronRight className="me-2 size-4" />
              ) : (
                <ChevronLeft className="me-2 size-4" />
              )}
              {t('actions.back')}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {canGoNext ? (
            <Button
              onClick={goNext}
              disabled={!canProceed}
              className="min-h-touch-sm flex-1 sm:flex-none"
            >
              {t('actions.next')}
              {isRTL ? (
                <ChevronLeft className="ms-2 size-4" />
              ) : (
                <ChevronRight className="ms-2 size-4" />
              )}
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!canProceed || isGenerating}
              className="min-h-touch-sm flex-1 sm:flex-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {t('actions.generating')}
                </>
              ) : (
                <>
                  <FileText className="me-2 size-4" />
                  {t('actions.generate')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BriefingBookBuilder
