/**
 * FormAutoSaveDemoPage
 *
 * Demonstrates the form auto-save feature with:
 * - Automatic saving of form progress
 * - Draft restoration banner
 * - Progress indicator with time estimate
 * - Auto-save status indicator
 *
 * @module pages/form-auto-save-demo/FormAutoSaveDemoPage
 */

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save,
  Trash2,
  Send,
  RotateCcw,
  FileText,
  Calendar,
  Users,
  MapPin,
  Clock,
} from 'lucide-react'

import { useAutoSaveForm } from '@/hooks/useAutoSaveForm'
import {
  FormProgressIndicator,
  FormDraftBanner,
  AutoSaveIndicator,
} from '@/components/form-auto-save'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Demo form schema
const demoFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  eventDate: z.string().min(1, 'Date is required'),
  location: z.string().min(1, 'Location is required'),
  eventType: z.enum(['meeting', 'conference', 'workshop', 'webinar']),
  participants: z.string().min(1, 'Participants are required'),
  objectives: z.string().min(20, 'Please provide detailed objectives'),
  notes: z.string().optional(),
})

type DemoFormData = z.infer<typeof demoFormSchema>

const REQUIRED_FIELDS = [
  'title',
  'description',
  'eventDate',
  'location',
  'eventType',
  'participants',
  'objectives',
]

const DEFAULT_VALUES: DemoFormData = {
  title: '',
  description: '',
  eventDate: '',
  location: '',
  eventType: 'meeting',
  participants: '',
  objectives: '',
  notes: '',
}

export function FormAutoSaveDemoPage() {
  const { t, i18n } = useTranslation(['form-auto-save', 'common'])
  const isRTL = i18n.language === 'ar'

  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize auto-save hook
  const { draft, updateDraft, clearDraft, status, progress, restoreDraft } =
    useAutoSaveForm<DemoFormData>({
      formKey: 'demo-engagement-form',
      debounceMs: 1000,
      requiredFields: REQUIRED_FIELDS,
      onSaveSuccess: () => {
        // Silent save - no toast for auto-save
      },
      onDraftRestored: () => {
        toast.success(t('notifications.draftRestored'))
      },
    })

  // Initialize react-hook-form
  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  // Check for existing draft on mount
  useEffect(() => {
    if (draft && draft.progress > 0 && !status.hasRestored) {
      setShowDraftBanner(true)
    }
  }, [draft, status.hasRestored])

  // Handle form field changes
  const handleFieldChange = useCallback(
    (field: keyof DemoFormData, value: string) => {
      updateDraft({ [field]: value } as Partial<DemoFormData>)
    },
    [updateDraft],
  )

  // Handle draft restoration
  const handleRestore = useCallback(async () => {
    setIsRestoring(true)
    try {
      const restoredDraft = await restoreDraft()
      if (restoredDraft) {
        // Reset form with restored values
        form.reset(restoredDraft.data as DemoFormData)
      }
      setShowDraftBanner(false)
    } catch (error) {
      console.error('Failed to restore draft:', error)
    } finally {
      setIsRestoring(false)
    }
  }, [restoreDraft, form])

  // Handle draft discard
  const handleDiscard = useCallback(async () => {
    await clearDraft()
    form.reset(DEFAULT_VALUES)
    setShowDraftBanner(false)
    toast.success(t('notifications.draftCleared'))
  }, [clearDraft, form, t])

  // Handle form submission
  const handleSubmit = useCallback(
    async (values: DemoFormData) => {
      setIsSubmitting(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))
        console.log('Form submitted:', values)

        // Clear draft on successful submission
        await clearDraft()
        form.reset(DEFAULT_VALUES)

        toast.success(isRTL ? 'تم الإرسال بنجاح!' : 'Form submitted successfully!')
      } catch (error) {
        console.error('Submission failed:', error)
        toast.error(isRTL ? 'فشل الإرسال' : 'Submission failed')
      } finally {
        setIsSubmitting(false)
      }
    },
    [clearDraft, form, isRTL],
  )

  // Handle form reset
  const handleReset = useCallback(async () => {
    await clearDraft()
    form.reset(DEFAULT_VALUES)
    toast.info(isRTL ? 'تم إعادة تعيين النموذج' : 'Form reset')
  }, [clearDraft, form, isRTL])

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start mb-2">
              {isRTL ? 'عرض الحفظ التلقائي للنموذج' : 'Form Auto-Save Demo'}
            </h1>
            <p className="text-muted-foreground text-start">
              {isRTL
                ? 'استمر من حيث توقفت - يتم حفظ تقدمك تلقائياً'
                : 'Continue where you left off - your progress is saved automatically'}
            </p>
          </div>
          <Badge variant="secondary" className="self-start">
            {isRTL ? 'الحفظ التلقائي مفعّل' : 'Auto-save enabled'}
          </Badge>
        </div>
      </motion.div>

      {/* Draft Restoration Banner */}
      {showDraftBanner && draft && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <FormDraftBanner
            draft={draft}
            onRestore={handleRestore}
            onDismiss={() => setShowDraftBanner(false)}
            onDiscard={handleDiscard}
            isRestoring={isRestoring}
          />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-start">
                    {isRTL ? 'تفاصيل المشاركة' : 'Engagement Details'}
                  </CardTitle>
                  <CardDescription className="text-start mt-1">
                    {isRTL
                      ? 'أكمل النموذج أدناه. سيتم حفظ تقدمك تلقائياً.'
                      : 'Fill out the form below. Your progress will be saved automatically.'}
                  </CardDescription>
                </div>
                <AutoSaveIndicator status={status} />
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start flex items-center gap-2">
                          <FileText className="size-4" />
                          {isRTL ? 'العنوان' : 'Title'} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={isRTL ? 'أدخل عنوان المشاركة' : 'Enter engagement title'}
                            className="min-h-11"
                            onChange={(e) => {
                              field.onChange(e)
                              handleFieldChange('title', e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start">
                          {isRTL ? 'الوصف' : 'Description'} *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={
                              isRTL ? 'صف هذه المشاركة...' : 'Describe this engagement...'
                            }
                            className="min-h-24"
                            onChange={(e) => {
                              field.onChange(e)
                              handleFieldChange('description', e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-start">
                          {isRTL
                            ? 'قدم وصفاً مختصراً (10 أحرف على الأقل)'
                            : 'Provide a brief description (at least 10 characters)'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date and Location Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-start flex items-center gap-2">
                            <Calendar className="size-4" />
                            {isRTL ? 'التاريخ' : 'Date'} *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              className="min-h-11"
                              onChange={(e) => {
                                field.onChange(e)
                                handleFieldChange('eventDate', e.target.value)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-start flex items-center gap-2">
                            <MapPin className="size-4" />
                            {isRTL ? 'الموقع' : 'Location'} *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={isRTL ? 'أدخل الموقع' : 'Enter location'}
                              className="min-h-11"
                              onChange={(e) => {
                                field.onChange(e)
                                handleFieldChange('location', e.target.value)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Event Type */}
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start flex items-center gap-2">
                          <Clock className="size-4" />
                          {isRTL ? 'نوع الحدث' : 'Event Type'} *
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            handleFieldChange('eventType', value)
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="min-h-11">
                              <SelectValue
                                placeholder={isRTL ? 'اختر نوع الحدث' : 'Select event type'}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="meeting">{isRTL ? 'اجتماع' : 'Meeting'}</SelectItem>
                            <SelectItem value="conference">
                              {isRTL ? 'مؤتمر' : 'Conference'}
                            </SelectItem>
                            <SelectItem value="workshop">
                              {isRTL ? 'ورشة عمل' : 'Workshop'}
                            </SelectItem>
                            <SelectItem value="webinar">
                              {isRTL ? 'ندوة عبر الإنترنت' : 'Webinar'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Participants */}
                  <FormField
                    control={form.control}
                    name="participants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start flex items-center gap-2">
                          <Users className="size-4" />
                          {isRTL ? 'المشاركون' : 'Participants'} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={isRTL ? 'أدخل أسماء المشاركين' : 'Enter participant names'}
                            className="min-h-11"
                            onChange={(e) => {
                              field.onChange(e)
                              handleFieldChange('participants', e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-start">
                          {isRTL ? 'افصل بين الأسماء بفاصلة' : 'Separate names with commas'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Objectives */}
                  <FormField
                    control={form.control}
                    name="objectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start">
                          {isRTL ? 'الأهداف' : 'Objectives'} *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={
                              isRTL
                                ? 'ما هي أهداف هذه المشاركة؟'
                                : 'What are the objectives of this engagement?'
                            }
                            className="min-h-32"
                            onChange={(e) => {
                              field.onChange(e)
                              handleFieldChange('objectives', e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-start">
                          {isRTL
                            ? 'قدم أهدافاً مفصلة (20 حرفاً على الأقل)'
                            : 'Provide detailed objectives (at least 20 characters)'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes (Optional) */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start">
                          {isRTL ? 'ملاحظات إضافية' : 'Additional Notes'}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={
                              isRTL ? 'أي معلومات إضافية...' : 'Any additional information...'
                            }
                            className="min-h-20"
                            onChange={(e) => {
                              field.onChange(e)
                              handleFieldChange('notes', e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={isSubmitting}
                      className="min-h-11 w-full sm:w-auto"
                    >
                      <RotateCcw className="size-4 me-2" />
                      {isRTL ? 'إعادة تعيين' : 'Reset'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => clearDraft()}
                      disabled={isSubmitting || !draft}
                      className="min-h-11 w-full sm:w-auto"
                    >
                      <Trash2 className="size-4 me-2" />
                      {isRTL ? 'مسح المسودة' : 'Clear Draft'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-h-11 w-full sm:flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Save className="size-4 me-2 animate-pulse" />
                          {isRTL ? 'جارٍ الإرسال...' : 'Submitting...'}
                        </>
                      ) : (
                        <>
                          <Send className="size-4 me-2" />
                          {isRTL ? 'إرسال' : 'Submit'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Indicator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-start">
                {isRTL ? 'تقدم النموذج' : 'Form Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormProgressIndicator
                progress={progress}
                showTimeEstimate={true}
                showSteps={false}
              />
            </CardContent>
          </Card>

          {/* Feature Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-start">
                {isRTL ? 'كيف يعمل' : 'How It Works'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">
                  1
                </Badge>
                <p className="text-sm text-muted-foreground text-start">
                  {isRTL
                    ? 'ابدأ في ملء النموذج - يتم حفظ التغييرات تلقائياً'
                    : 'Start filling the form - changes are saved automatically'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">
                  2
                </Badge>
                <p className="text-sm text-muted-foreground text-start">
                  {isRTL ? 'غادر الصفحة أو أغلق المتصفح' : 'Navigate away or close the browser'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">
                  3
                </Badge>
                <p className="text-sm text-muted-foreground text-start">
                  {isRTL
                    ? 'عد لاحقاً - سترى خيار استعادة تقدمك'
                    : "Come back later - you'll see an option to restore your progress"}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">
                  4
                </Badge>
                <p className="text-sm text-muted-foreground text-start">
                  {isRTL ? 'أكمل وأرسل النموذج' : 'Complete and submit the form'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-start">
                {isRTL ? 'حالة الحفظ' : 'Save Status'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRTL ? 'آخر حفظ:' : 'Last saved:'}</span>
                <span>
                  {status.lastSavedAt
                    ? new Date(status.lastSavedAt).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')
                    : isRTL
                      ? 'لم يتم الحفظ بعد'
                      : 'Not saved yet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isRTL ? 'تغييرات غير محفوظة:' : 'Unsaved changes:'}
                </span>
                <span>
                  {status.hasUnsavedChanges ? (isRTL ? 'نعم' : 'Yes') : isRTL ? 'لا' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRTL ? 'التخزين:' : 'Storage:'}</span>
                <span>
                  {status.isStorageAvailable
                    ? isRTL
                      ? 'متاح'
                      : 'Available'
                    : isRTL
                      ? 'غير متاح'
                      : 'Unavailable'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default FormAutoSaveDemoPage
