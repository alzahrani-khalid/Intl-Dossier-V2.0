/**
 * StakeholderAnnotationDialog Component
 *
 * Dialog for creating annotations on timeline events:
 * - Annotation type selection (note, marker, milestone, turning point, etc.)
 * - Color selection
 * - Visibility settings (private/team/public)
 * - Key moment and turning point flags
 * - Bilingual content (English/Arabic)
 * - Mobile-first responsive design
 * - RTL support
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MessageSquare,
  Flag,
  Star,
  Activity,
  AlertTriangle,
  Globe,
  Users,
  Lock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type {
  CreateAnnotationRequest,
  StakeholderTimelineEvent,
  TimelineAnnotationType,
  AnnotationColor,
  AnnotationVisibility,
} from '@/types/stakeholder-interaction.types'

interface StakeholderAnnotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateAnnotationRequest) => void
  event: StakeholderTimelineEvent | null
  isLoading?: boolean
}

// Annotation type configuration
const annotationTypes: Array<{
  type: TimelineAnnotationType
  icon: React.ElementType
  label_en: string
  label_ar: string
  description_en: string
  description_ar: string
}> = [
  {
    type: 'note',
    icon: MessageSquare,
    label_en: 'Note',
    label_ar: 'ملاحظة',
    description_en: 'Add a simple note to this event',
    description_ar: 'أضف ملاحظة بسيطة لهذا الحدث',
  },
  {
    type: 'marker',
    icon: Flag,
    label_en: 'Marker',
    label_ar: 'علامة',
    description_en: 'Mark this event for reference',
    description_ar: 'ضع علامة على هذا الحدث للرجوع إليه',
  },
  {
    type: 'milestone',
    icon: Star,
    label_en: 'Milestone',
    label_ar: 'معلم',
    description_en: 'Mark as a significant achievement',
    description_ar: 'ضع علامة كإنجاز مهم',
  },
  {
    type: 'turning_point',
    icon: Activity,
    label_en: 'Turning Point',
    label_ar: 'نقطة تحول',
    description_en: 'Mark as a critical change in direction',
    description_ar: 'ضع علامة كتغيير حاسم في الاتجاه',
  },
  {
    type: 'breakthrough',
    icon: Star,
    label_en: 'Breakthrough',
    label_ar: 'اختراق',
    description_en: 'Mark as a significant breakthrough',
    description_ar: 'ضع علامة كاختراق مهم',
  },
  {
    type: 'concern',
    icon: AlertTriangle,
    label_en: 'Concern',
    label_ar: 'قلق',
    description_en: 'Flag a concern or issue',
    description_ar: 'ضع علامة على قلق أو مشكلة',
  },
]

// Color options
const colorOptions: Array<{
  color: AnnotationColor
  class: string
  label_en: string
  label_ar: string
}> = [
  { color: 'blue', class: 'bg-blue-500', label_en: 'Blue', label_ar: 'أزرق' },
  { color: 'green', class: 'bg-green-500', label_en: 'Green', label_ar: 'أخضر' },
  { color: 'yellow', class: 'bg-yellow-500', label_en: 'Yellow', label_ar: 'أصفر' },
  { color: 'red', class: 'bg-red-500', label_en: 'Red', label_ar: 'أحمر' },
  { color: 'purple', class: 'bg-purple-500', label_en: 'Purple', label_ar: 'بنفسجي' },
  { color: 'orange', class: 'bg-orange-500', label_en: 'Orange', label_ar: 'برتقالي' },
]

// Visibility options
const visibilityOptions: Array<{
  visibility: AnnotationVisibility
  icon: React.ElementType
  label_en: string
  label_ar: string
  description_en: string
  description_ar: string
}> = [
  {
    visibility: 'private',
    icon: Lock,
    label_en: 'Private',
    label_ar: 'خاص',
    description_en: 'Only you can see this annotation',
    description_ar: 'أنت فقط يمكنك رؤية هذا التعليق',
  },
  {
    visibility: 'team',
    icon: Users,
    label_en: 'Team',
    label_ar: 'الفريق',
    description_en: 'Visible to your team members',
    description_ar: 'مرئي لأعضاء فريقك',
  },
  {
    visibility: 'public',
    icon: Globe,
    label_en: 'Public',
    label_ar: 'عام',
    description_en: 'Visible to all users in the organization',
    description_ar: 'مرئي لجميع المستخدمين في المنظمة',
  },
]

export function StakeholderAnnotationDialog({
  open,
  onOpenChange,
  onSubmit,
  event,
  isLoading = false,
}: StakeholderAnnotationDialogProps) {
  const { t, i18n } = useTranslation('stakeholder-interactions')
  const isRTL = i18n.language === 'ar'

  // Form state
  const [annotationType, setAnnotationType] = useState<TimelineAnnotationType>('note')
  const [contentEn, setContentEn] = useState('')
  const [contentAr, setContentAr] = useState('')
  const [color, setColor] = useState<AnnotationColor>('blue')
  const [visibility, setVisibility] = useState<AnnotationVisibility>('private')
  const [isKeyMoment, setIsKeyMoment] = useState(false)
  const [isTurningPoint, setIsTurningPoint] = useState(false)
  const [importanceScore, setImportanceScore] = useState(3)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setAnnotationType('note')
      setContentEn('')
      setContentAr('')
      setColor('blue')
      setVisibility('private')
      setIsKeyMoment(false)
      setIsTurningPoint(false)
      setImportanceScore(3)
    }
  }, [open])

  const handleSubmit = () => {
    if (!contentEn.trim() || !event) return

    onSubmit({
      event_type: event.source_table,
      event_id: event.source_id,
      annotation_type: annotationType,
      content_en: contentEn,
      content_ar: contentAr || undefined,
      color,
      visibility,
      is_key_moment: isKeyMoment,
      is_turning_point: isTurningPoint,
      importance_score: importanceScore,
    })
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-start">{t('annotation.create_title')}</DialogTitle>
          <DialogDescription className="text-start">
            {t('annotation.create_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event reference */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground text-start">{t('annotation.annotating')}</p>
            <p className="font-medium text-start">
              {isRTL && event.title_ar ? event.title_ar : event.title_en}
            </p>
          </div>

          {/* Annotation Type Selection */}
          <div className="space-y-3">
            <Label className="text-start block font-medium">{t('annotation.type')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {annotationTypes.map(({ type: t, icon: Icon, label_en, label_ar }) => (
                <Button
                  key={t}
                  type="button"
                  variant={annotationType === t ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3 min-h-16"
                  onClick={() => setAnnotationType(t)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{isRTL ? label_ar : label_en}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Content - English */}
          <div className="space-y-2">
            <Label htmlFor="content-en" className="text-start block">
              {t('annotation.content_en')}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Textarea
              id="content-en"
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              placeholder={t('annotation.content_en_placeholder')}
              className="min-h-20 resize-none"
              dir="ltr"
            />
          </div>

          {/* Content - Arabic */}
          <div className="space-y-2">
            <Label htmlFor="content-ar" className="text-start block">
              {t('annotation.content_ar')}
            </Label>
            <Textarea
              id="content-ar"
              value={contentAr}
              onChange={(e) => setContentAr(e.target.value)}
              placeholder={t('annotation.content_ar_placeholder')}
              className="min-h-20 resize-none"
              dir="rtl"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-start block">{t('annotation.color')}</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(({ color: c, class: colorClass }) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all duration-200',
                    colorClass,
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105',
                  )}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Visibility Selection */}
          <div className="space-y-3">
            <Label className="text-start block">{t('annotation.visibility')}</Label>
            <RadioGroup
              value={visibility}
              onValueChange={(v) => setVisibility(v as AnnotationVisibility)}
              className="space-y-2"
            >
              {visibilityOptions.map(
                ({
                  visibility: v,
                  icon: Icon,
                  label_en,
                  label_ar,
                  description_en,
                  description_ar,
                }) => (
                  <label
                    key={v}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      visibility === v ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                    )}
                  >
                    <RadioGroupItem value={v} id={v} className="sr-only" />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-start">
                        {isRTL ? label_ar : label_en}
                      </p>
                      <p className="text-xs text-muted-foreground text-start">
                        {isRTL ? description_ar : description_en}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 transition-colors',
                        visibility === v ? 'border-primary bg-primary' : 'border-muted-foreground',
                      )}
                    />
                  </label>
                ),
              )}
            </RadioGroup>
          </div>

          {/* Key Moment & Turning Point Flags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-start block">{t('annotation.is_key_moment')}</Label>
                <p className="text-xs text-muted-foreground text-start">
                  {t('annotation.is_key_moment_hint')}
                </p>
              </div>
              <Switch checked={isKeyMoment} onCheckedChange={setIsKeyMoment} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-start block">{t('annotation.is_turning_point')}</Label>
                <p className="text-xs text-muted-foreground text-start">
                  {t('annotation.is_turning_point_hint')}
                </p>
              </div>
              <Switch checked={isTurningPoint} onCheckedChange={setIsTurningPoint} />
            </div>
          </div>

          {/* Importance Score */}
          <div className="space-y-2">
            <Label className="text-start block">{t('annotation.importance_score')}</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <Button
                  key={score}
                  type="button"
                  variant={importanceScore === score ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportanceScore(score)}
                  className="min-h-11 min-w-11 sm:min-h-10 sm:min-w-10"
                >
                  {score}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-start">
              {t('annotation.importance_score_hint')}
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-11 sm:min-h-10"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!contentEn.trim() || isLoading}
            className="min-h-11 sm:min-h-10"
          >
            {isLoading ? t('common.saving') : t('annotation.add_annotation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
