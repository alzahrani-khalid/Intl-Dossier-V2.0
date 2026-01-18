/**
 * DossierCreatePage Component
 * Part of: 026-unified-dossier-architecture implementation (User Story 1 - T058)
 *
 * Page for creating new dossiers using the multi-step wizard.
 * Now includes a template gallery for guided dossier creation.
 * Mobile-first, RTL-compatible, with step-by-step creation flow.
 *
 * Features:
 * - Template gallery with pre-configured dossier templates
 * - Template preview dialog showing full structure
 * - AI-assisted policy brief creation wizard
 * - Responsive layout (320px mobile → desktop)
 * - RTL support via logical properties
 * - Multi-step wizard with progress indicator
 * - Draft saving to localStorage
 * - Conditional field visibility
 * - Form validation and error handling
 * - Success redirect to detail page
 * - Touch-friendly UI (44x44px min)
 * - Accessibility compliant (WCAG AA)
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, LayoutTemplate, FileText, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DossierCreateWizard } from '@/components/Dossier/DossierCreateWizard'
import { DossierTemplateGallery } from '@/components/Dossier/DossierTemplateGallery'
import { TemplatePreviewDialog } from '@/components/Dossier/TemplatePreviewDialog'
import { AIPolicyBriefWizard } from '@/components/Dossier/AIPolicyBriefWizard'
import { cn } from '@/lib/utils'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import type { DossierTemplate, TemplateSection } from '@/types/dossier-template.types'
import type { DossierType } from '@/services/dossier-api'
import type { GeneratedOutline } from '@/hooks/useAIPolicyBriefOutline'

type CreateMode = 'gallery' | 'wizard' | 'ai-wizard'

export function DossierCreatePage() {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  // State for create mode and template selection
  const [createMode, setCreateMode] = useState<CreateMode>('gallery')
  const [selectedTemplate, setSelectedTemplate] = useState<DossierTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [initialDossierType, setInitialDossierType] = useState<DossierType | undefined>(undefined)
  const [aiGeneratedSections, setAiGeneratedSections] = useState<TemplateSection[] | undefined>(
    undefined,
  )

  const handleBack = () => {
    if (createMode === 'wizard' || createMode === 'ai-wizard') {
      // Go back to gallery if in wizard or ai-wizard mode
      setCreateMode('gallery')
      setSelectedTemplate(null)
      setInitialDossierType(undefined)
      setAiGeneratedSections(undefined)
    } else {
      navigate({ to: '/dossiers' })
    }
  }

  const handleSuccess = (dossierId: string, dossierType?: DossierType) => {
    navigate({ to: getDossierDetailPath(dossierId, dossierType) })
  }

  // Handle template selection - show preview
  const handleSelectTemplate = useCallback((template: DossierTemplate) => {
    setSelectedTemplate(template)
    setPreviewOpen(true)
  }, [])

  // Handle using a template after preview
  const handleUseTemplate = useCallback((template: DossierTemplate) => {
    setSelectedTemplate(template)
    setInitialDossierType(template.dossier_type as DossierType)
    setCreateMode('wizard')
    setPreviewOpen(false)
  }, [])

  // Handle starting from scratch
  const handleStartFromScratch = useCallback(() => {
    setSelectedTemplate(null)
    setInitialDossierType(undefined)
    setAiGeneratedSections(undefined)
    setCreateMode('wizard')
  }, [])

  // Handle AI-assisted creation
  const handleStartAIWizard = useCallback(() => {
    setSelectedTemplate(null)
    setInitialDossierType(undefined)
    setAiGeneratedSections(undefined)
    setCreateMode('ai-wizard')
  }, [])

  // Handle AI outline completion - convert to template sections and go to wizard
  const handleAIOutlineComplete = useCallback((outline: GeneratedOutline) => {
    // Convert AI-generated outline sections to TemplateSection format
    const templateSections: TemplateSection[] = outline.sections.map((section) => ({
      id: section.id,
      title_en: section.title_en,
      title_ar: section.title_ar,
      description_en: section.placeholder_en,
      description_ar: section.placeholder_ar,
      icon: undefined,
      required: section.required,
    }))

    setAiGeneratedSections(templateSections)
    setInitialDossierType('theme') // Policy briefs are typically theme dossiers
    setCreateMode('wizard')
  }, [])

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start">
            {t('create.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-start mt-1 sm:mt-2">
            {createMode === 'gallery'
              ? t('templates.subtitle')
              : createMode === 'ai-wizard'
                ? isRTL
                  ? 'مساعد إنشاء الموجز السياسي بالذكاء الاصطناعي'
                  : 'AI Policy Brief Creation Assistant'
                : selectedTemplate
                  ? `${isRTL ? selectedTemplate.name_ar : selectedTemplate.name_en} - ${t('create.subtitleFillForm', { type: t(`type.${selectedTemplate.dossier_type}`) })}`
                  : aiGeneratedSections
                    ? isRTL
                      ? 'موجز سياسي مولد بالذكاء الاصطناعي'
                      : 'AI-Generated Policy Brief'
                    : t('create.subtitleSelectType')}
          </p>
        </div>
        <Button
          onClick={handleBack}
          variant="ghost"
          size="sm"
          className="self-start sm:self-center min-h-11"
        >
          <ArrowLeft className={cn('h-4 w-4', isRTL ? 'ms-2 rotate-180' : 'me-2')} />
          {createMode === 'wizard' || createMode === 'ai-wizard'
            ? t('action.back')
            : t('create.cancel')}
        </Button>
      </div>

      {/* Main Content */}
      {createMode === 'gallery' ? (
        // Template Gallery View with AI Option
        <div className="max-w-5xl mx-auto space-y-6">
          {/* AI-Assisted Creation Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl text-start flex items-center gap-2">
                    {isRTL
                      ? 'إنشاء موجز سياسي بمساعدة الذكاء الاصطناعي'
                      : 'AI-Assisted Policy Brief Creation'}
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-normal">
                      {isRTL ? 'جديد' : 'New'}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-start mt-1">
                    {isRTL
                      ? 'أجب على 3-4 أسئلة بسيطة واحصل على مخطط موجز سياسي منظم مع أقسام مقترحة ومحتوى قابل للتعديل'
                      : 'Answer 3-4 simple questions and get a structured policy brief outline with suggested sections and editable content'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <Button onClick={handleStartAIWizard} className="w-full sm:w-auto min-h-11" size="lg">
                <Wand2 className="h-4 w-4 me-2" />
                {isRTL ? 'ابدأ مع مساعد الذكاء الاصطناعي' : 'Start with AI Assistant'}
              </Button>
            </CardContent>
          </Card>

          {/* Standard Template Gallery */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg sm:text-xl text-start">
                  {t('templates.gallery.title')}
                </CardTitle>
              </div>
              <CardDescription className="text-sm sm:text-base text-start">
                {t('templates.gallery.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <DossierTemplateGallery
                onSelectTemplate={handleSelectTemplate}
                onStartFromScratch={handleStartFromScratch}
              />
            </CardContent>
          </Card>
        </div>
      ) : createMode === 'ai-wizard' ? (
        // AI Wizard View
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-4 sm:p-6">
            <AIPolicyBriefWizard onComplete={handleAIOutlineComplete} onCancel={handleBack} />
          </CardContent>
        </Card>
      ) : (
        // Standard Wizard View
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              {aiGeneratedSections ? (
                <Sparkles className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
              <CardTitle className="text-lg sm:text-xl text-start">
                {selectedTemplate
                  ? isRTL
                    ? selectedTemplate.name_ar
                    : selectedTemplate.name_en
                  : aiGeneratedSections
                    ? isRTL
                      ? 'موجز سياسي مولد بالذكاء الاصطناعي'
                      : 'AI-Generated Policy Brief'
                    : t('create.selectTypeTitle')}
              </CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base text-start">
              {selectedTemplate
                ? isRTL
                  ? selectedTemplate.description_ar
                  : selectedTemplate.description_en
                : aiGeneratedSections
                  ? isRTL
                    ? 'راجع الأقسام المولدة وأكمل معلومات الملف'
                    : 'Review the generated sections and complete the dossier information'
                  : t('create.selectTypeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <DossierCreateWizard
              onSuccess={handleSuccess}
              onCancel={handleBack}
              initialType={initialDossierType}
              templateSections={selectedTemplate?.sections || aiGeneratedSections}
              recommendedTags={selectedTemplate?.recommended_tags}
            />
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="max-w-5xl mx-auto mt-4 sm:mt-6 p-4 bg-muted rounded-lg">
        <p className="text-xs sm:text-sm text-muted-foreground text-start">
          <strong>{t('create.helpTitle')}:</strong>{' '}
          {createMode === 'gallery' ? t('templates.gallery.description') : t('create.helpText')}
        </p>
      </div>

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        template={selectedTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  )
}
