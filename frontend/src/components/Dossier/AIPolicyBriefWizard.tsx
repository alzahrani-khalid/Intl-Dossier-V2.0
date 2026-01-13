/**
 * AIPolicyBriefWizard Component
 *
 * AI-assisted creation flow for policy briefs where users answer 3-4 simple questions
 * (topic, target audience, key message) and the system generates a starter outline
 * with suggested sections and placeholder content they can refine.
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support via logical properties
 * - AI-powered outline generation with streaming
 * - Editable generated content
 * - Touch-friendly UI (44x44px min targets)
 * - WCAG AA accessibility compliant
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  FileText,
  Users,
  Target,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Save,
  Wand2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  useAIPolicyBriefOutline,
  type GeneratedOutline,
  type OutlineSection,
} from '@/hooks/useAIPolicyBriefOutline'

// Form schema for wizard inputs
const wizardSchema = z.object({
  topic: z.string().min(10, { message: 'Topic must be at least 10 characters' }),
  targetAudience: z.enum(['policymakers', 'executives', 'technical', 'general', 'diplomatic']),
  keyMessage: z.string().min(20, { message: 'Key message must be at least 20 characters' }),
  additionalContext: z.string().optional(),
})

type WizardFormData = z.infer<typeof wizardSchema>

// Wizard step definitions
interface WizardStep {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  icon: typeof FileText
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'topic',
    title: 'What is your topic?',
    titleAr: 'ما هو موضوعك؟',
    description: 'Describe the main subject of your policy brief',
    descriptionAr: 'صف الموضوع الرئيسي لموجزك السياسي',
    icon: FileText,
  },
  {
    id: 'audience',
    title: 'Who is your audience?',
    titleAr: 'من هو جمهورك المستهدف؟',
    description: 'Select the primary audience for this brief',
    descriptionAr: 'حدد الجمهور الرئيسي لهذا الموجز',
    icon: Users,
  },
  {
    id: 'message',
    title: 'What is your key message?',
    titleAr: 'ما هي رسالتك الرئيسية؟',
    description: 'Summarize the main point you want to convey',
    descriptionAr: 'لخص النقطة الرئيسية التي تريد إيصالها',
    icon: Target,
  },
  {
    id: 'generate',
    title: 'Generate Outline',
    titleAr: 'توليد المخطط',
    description: 'AI will create a structured outline based on your inputs',
    descriptionAr: 'سيقوم الذكاء الاصطناعي بإنشاء مخطط منظم بناءً على مدخلاتك',
    icon: Sparkles,
  },
]

// Audience options
const AUDIENCE_OPTIONS = [
  {
    value: 'policymakers',
    labelEn: 'Policymakers & Government Officials',
    labelAr: 'صناع السياسات والمسؤولون الحكوميون',
  },
  { value: 'executives', labelEn: 'Executive Leadership', labelAr: 'القيادة التنفيذية' },
  { value: 'technical', labelEn: 'Technical Experts', labelAr: 'الخبراء التقنيون' },
  { value: 'general', labelEn: 'General Stakeholders', labelAr: 'أصحاب المصلحة العامون' },
  { value: 'diplomatic', labelEn: 'Diplomatic Corps', labelAr: 'السلك الدبلوماسي' },
]

interface AIPolicyBriefWizardProps {
  onComplete: (outline: GeneratedOutline, formData: WizardFormData) => void
  onCancel: () => void
  className?: string
}

export function AIPolicyBriefWizard({ onComplete, onCancel, className }: AIPolicyBriefWizardProps) {
  const { t, i18n } = useTranslation(['dossier', 'ai-policy-brief'])
  const isRTL = i18n.language === 'ar'

  // State
  const [currentStep, setCurrentStep] = useState(0)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editedSections, setEditedSections] = useState<Record<string, OutlineSection>>({})

  // AI hook
  const { generate, outline, isGenerating, progress, error, retry, reset } =
    useAIPolicyBriefOutline()

  // Form
  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      topic: '',
      targetAudience: undefined,
      keyMessage: '',
      additionalContext: '',
    },
    mode: 'onChange',
  })

  const formValues = form.watch()
  const totalSteps = WIZARD_STEPS.length
  const progressPercent = ((currentStep + 1) / totalSteps) * 100

  // Determine if current step is valid
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0:
        return formValues.topic.length >= 10
      case 1:
        return !!formValues.targetAudience
      case 2:
        return formValues.keyMessage.length >= 20
      case 3:
        return !!outline
      default:
        return false
    }
  }, [currentStep, formValues, outline])

  // Navigation handlers
  const goNext = useCallback(async () => {
    if (currentStep === 2) {
      // Trigger AI generation when moving to last step
      setCurrentStep(3)
      await generate({
        topic: formValues.topic,
        targetAudience: formValues.targetAudience,
        keyMessage: formValues.keyMessage,
        additionalContext: formValues.additionalContext,
        language: i18n.language as 'en' | 'ar',
      })
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, totalSteps, formValues, generate, i18n.language])

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // Handle section edit
  const handleSectionEdit = useCallback(
    (sectionId: string, field: 'title' | 'content', value: string) => {
      const currentOutline = outline
      if (!currentOutline) return

      const section = currentOutline.sections.find((s) => s.id === sectionId)
      if (!section) return

      setEditedSections((prev) => ({
        ...prev,
        [sectionId]: {
          ...section,
          ...prev[sectionId],
          [field === 'title'
            ? isRTL
              ? 'title_ar'
              : 'title_en'
            : isRTL
              ? 'placeholder_ar'
              : 'placeholder_en']: value,
        },
      }))
    },
    [outline, isRTL],
  )

  // Save edited section
  const saveSection = useCallback(
    (sectionId: string) => {
      setEditingSection(null)
      toast.success(t('ai-policy-brief:sectionSaved'))
    },
    [t],
  )

  // Handle completion
  const handleComplete = useCallback(() => {
    if (!outline) return

    // Merge edited sections with original outline
    const finalOutline: GeneratedOutline = {
      ...outline,
      sections: outline.sections.map((section) => editedSections[section.id] || section),
    }

    onComplete(finalOutline, formValues)
  }, [outline, editedSections, formValues, onComplete])

  // Regenerate outline
  const handleRegenerate = useCallback(() => {
    reset()
    setEditedSections({})
    generate({
      topic: formValues.topic,
      targetAudience: formValues.targetAudience,
      keyMessage: formValues.keyMessage,
      additionalContext: formValues.additionalContext,
      language: i18n.language as 'en' | 'ar',
    })
  }, [reset, generate, formValues, i18n.language])

  // Get section to display (edited or original)
  const getDisplaySection = useCallback(
    (section: OutlineSection): OutlineSection => {
      return editedSections[section.id] || section
    },
    [editedSections],
  )

  // Render step content
  const renderStepContent = () => {
    const currentStepConfig = WIZARD_STEPS[currentStep]

    switch (currentStep) {
      case 0: // Topic
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base sm:text-lg">
                    {isRTL ? 'موضوع الموجز السياسي' : 'Policy Brief Topic'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={
                        isRTL
                          ? 'مثال: تأثير الذكاء الاصطناعي على سوق العمل في المملكة العربية السعودية...'
                          : 'e.g., The impact of AI on the labor market in Saudi Arabia...'
                      }
                      className="min-h-[120px] text-base"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </FormControl>
                  <FormDescription>
                    {isRTL
                      ? 'صف بإيجاز الموضوع الذي سيتناوله الموجز السياسي'
                      : 'Briefly describe the topic your policy brief will address'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 1: // Audience
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base sm:text-lg">
                    {isRTL ? 'الجمهور المستهدف' : 'Target Audience'}
                  </FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {AUDIENCE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={cn(
                          'p-4 rounded-lg border-2 text-start transition-all min-h-11',
                          'hover:border-primary/50 hover:bg-primary/5',
                          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          field.value === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                              field.value === option.value
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground',
                            )}
                          >
                            {field.value === option.value && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-medium text-sm sm:text-base">
                            {isRTL ? option.labelAr : option.labelEn}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 2: // Key Message
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="keyMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base sm:text-lg">
                    {isRTL ? 'الرسالة الرئيسية' : 'Key Message'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={
                        isRTL
                          ? 'ما هي النقطة الرئيسية أو التوصية التي تريد إيصالها لجمهورك؟'
                          : 'What is the main point or recommendation you want to convey to your audience?'
                      }
                      className="min-h-[120px] text-base"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </FormControl>
                  <FormDescription>
                    {isRTL
                      ? 'لخص الرسالة الأساسية أو التوصية في جملتين أو ثلاث'
                      : 'Summarize the core message or recommendation in 2-3 sentences'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? 'سياق إضافي (اختياري)' : 'Additional Context (Optional)'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={
                        isRTL
                          ? 'أي معلومات إضافية قد تساعد في توليد مخطط أفضل...'
                          : 'Any additional information that might help generate a better outline...'
                      }
                      className="min-h-[80px]"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 3: // Generate & Review
        return (
          <div className="space-y-6">
            {/* Generation Status */}
            {isGenerating && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                      <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                      <Loader2 className="h-6 w-6 text-primary absolute -bottom-1 -end-1 animate-spin" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {isRTL ? 'جارٍ توليد المخطط...' : 'Generating outline...'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isRTL
                          ? 'يقوم الذكاء الاصطناعي بإنشاء هيكل موجز سياسي مخصص لك'
                          : 'AI is creating a custom policy brief structure for you'}
                      </p>
                    </div>
                    <Progress value={progress} className="w-full max-w-xs h-2" />
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && !isGenerating && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <div>
                      <p className="font-medium text-lg text-destructive">
                        {isRTL ? 'فشل التوليد' : 'Generation Failed'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isRTL
                          ? 'حدث خطأ أثناء توليد المخطط. يرجى المحاولة مرة أخرى.'
                          : 'An error occurred while generating the outline. Please try again.'}
                      </p>
                    </div>
                    <Button onClick={retry} variant="outline" className="min-h-11">
                      <RefreshCw className="h-4 w-4 me-2" />
                      {isRTL ? 'إعادة المحاولة' : 'Retry'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Outline */}
            {outline && !isGenerating && (
              <div className="space-y-4">
                {/* Success Header */}
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-700 dark:text-green-400">
                      {isRTL ? 'تم توليد المخطط بنجاح!' : 'Outline generated successfully!'}
                    </p>
                    <p className="text-sm text-green-600/80 dark:text-green-400/80">
                      {isRTL
                        ? 'راجع الأقسام أدناه وعدلها حسب الحاجة'
                        : 'Review the sections below and edit as needed'}
                    </p>
                  </div>
                  <Button onClick={handleRegenerate} variant="ghost" size="sm" className="min-h-11">
                    <RefreshCw className="h-4 w-4 me-2" />
                    {isRTL ? 'إعادة التوليد' : 'Regenerate'}
                  </Button>
                </div>

                {/* Outline Title */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {isRTL ? outline.title_ar : outline.title_en}
                    </CardTitle>
                    {outline.summary_en && (
                      <CardDescription>
                        {isRTL ? outline.summary_ar : outline.summary_en}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>

                {/* Sections */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      {isRTL ? 'الأقسام المقترحة' : 'Suggested Sections'}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {outline.sections.length} {isRTL ? 'قسم' : 'sections'}
                    </Badge>
                  </div>

                  {outline.sections.map((section, index) => {
                    const displaySection = getDisplaySection(section)
                    const isEditing = editingSection === section.id

                    return (
                      <Card key={section.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="shrink-0">
                                {index + 1}
                              </Badge>
                              {isEditing ? (
                                <Input
                                  defaultValue={
                                    isRTL ? displaySection.title_ar : displaySection.title_en
                                  }
                                  onChange={(e) =>
                                    handleSectionEdit(section.id, 'title', e.target.value)
                                  }
                                  className="font-medium"
                                  dir={isRTL ? 'rtl' : 'ltr'}
                                />
                              ) : (
                                <CardTitle className="text-base">
                                  {isRTL ? displaySection.title_ar : displaySection.title_en}
                                </CardTitle>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {section.required && (
                                <Badge variant="destructive" className="text-xs">
                                  {isRTL ? 'مطلوب' : 'Required'}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  isEditing
                                    ? saveSection(section.id)
                                    : setEditingSection(section.id)
                                }
                                className="h-8 w-8 p-0"
                              >
                                {isEditing ? (
                                  <Save className="h-4 w-4" />
                                ) : (
                                  <Pencil className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {isEditing ? (
                            <Textarea
                              defaultValue={
                                isRTL
                                  ? displaySection.placeholder_ar
                                  : displaySection.placeholder_en
                              }
                              onChange={(e) =>
                                handleSectionEdit(section.id, 'content', e.target.value)
                              }
                              className="min-h-[80px] text-sm"
                              dir={isRTL ? 'rtl' : 'ltr'}
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {isRTL
                                ? displaySection.placeholder_ar
                                : displaySection.placeholder_en}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn('space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg">
          <Wand2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">
            {isRTL ? 'مساعد إنشاء الموجز السياسي' : 'Policy Brief Assistant'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? 'أجب على بعض الأسئلة لتوليد مخطط موجز سياسي'
              : 'Answer a few questions to generate a policy brief outline'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <span>
            {isRTL
              ? `الخطوة ${currentStep + 1} من ${totalSteps}`
              : `Step ${currentStep + 1} of ${totalSteps}`}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-2">
        {WIZARD_STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isCompleted = index < currentStep

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => index < currentStep && setCurrentStep(index)}
              disabled={index > currentStep}
              className={cn(
                'flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap min-h-11 transition-all flex-1 justify-center',
                isActive && 'bg-primary text-primary-foreground shadow-md',
                isCompleted && 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer',
                !isActive &&
                  !isCompleted &&
                  'bg-muted text-muted-foreground cursor-not-allowed opacity-60',
              )}
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
                  isActive && 'bg-primary-foreground text-primary',
                  isCompleted && 'bg-primary text-primary-foreground',
                  !isActive && !isCompleted && 'bg-muted-foreground/20',
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              </span>
              <span className="hidden sm:inline truncate">{isRTL ? step.titleAr : step.title}</span>
            </button>
          )
        })}
      </div>

      {/* Current Step Description */}
      <div className="text-center sm:text-start">
        <h3 className="text-lg sm:text-xl font-semibold">
          {isRTL ? WIZARD_STEPS[currentStep].titleAr : WIZARD_STEPS[currentStep].title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isRTL ? WIZARD_STEPS[currentStep].descriptionAr : WIZARD_STEPS[currentStep].description}
        </p>
      </div>

      {/* Step Content */}
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="min-h-[250px]"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </form>
        </Form>
      </FormProvider>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
        {/* Left side */}
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isGenerating}
            className="min-h-11 w-full sm:w-auto"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isGenerating}
              className="min-h-11 w-full sm:w-auto"
            >
              {isRTL ? (
                <ChevronRight className="h-4 w-4 me-2" />
              ) : (
                <ChevronLeft className="h-4 w-4 me-2" />
              )}
              {isRTL ? 'السابق' : 'Back'}
            </Button>
          )}
        </div>

        {/* Right side */}
        <div className="flex flex-col sm:flex-row gap-2">
          {currentStep === 3 && outline ? (
            <Button type="button" onClick={handleComplete} className="min-h-11 w-full sm:w-auto">
              <CheckCircle2 className="h-4 w-4 me-2" />
              {isRTL ? 'استخدام هذا المخطط' : 'Use This Outline'}
            </Button>
          ) : currentStep < 3 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={!isStepValid || isGenerating}
              className="min-h-11 w-full sm:w-auto"
            >
              {currentStep === 2 ? (
                <>
                  <Sparkles className="h-4 w-4 me-2" />
                  {isRTL ? 'توليد المخطط' : 'Generate Outline'}
                </>
              ) : (
                <>
                  {isRTL ? 'التالي' : 'Next'}
                  {isRTL ? (
                    <ChevronLeft className="h-4 w-4 ms-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ms-2" />
                  )}
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AIPolicyBriefWizard
