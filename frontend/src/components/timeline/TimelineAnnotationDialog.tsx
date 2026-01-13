/**
 * TimelineAnnotationDialog Component
 *
 * Dialog for creating and editing timeline annotations:
 * - Note/marker/highlight/milestone types
 * - Color selection
 * - Visibility settings (private/team/public)
 * - Bilingual content (English/Arabic)
 * - Mobile-first responsive design
 * - RTL support
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Flag, Highlighter, Milestone, Globe, Users, Lock, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  TimelineAnnotation,
  AnnotationType,
  AnnotationColor,
  AnnotationVisibility,
  CreateAnnotationRequest,
  UpdateAnnotationRequest,
} from '@/types/timeline-annotation.types'

interface TimelineAnnotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateAnnotationRequest | UpdateAnnotationRequest) => void
  annotation?: TimelineAnnotation // If editing
  eventId?: string // Required for create
  isLoading?: boolean
}

/**
 * Annotation type configuration
 */
const annotationTypes: Array<{
  type: AnnotationType
  icon: React.ElementType
  label_en: string
  label_ar: string
}> = [
  { type: 'note', icon: MessageSquare, label_en: 'Note', label_ar: 'ملاحظة' },
  { type: 'marker', icon: Flag, label_en: 'Marker', label_ar: 'علامة' },
  { type: 'highlight', icon: Highlighter, label_en: 'Highlight', label_ar: 'تمييز' },
  { type: 'milestone', icon: Milestone, label_en: 'Milestone', label_ar: 'معلم' },
]

/**
 * Color options
 */
const colorOptions: Array<{ color: AnnotationColor; class: string }> = [
  { color: 'blue', class: 'bg-blue-500' },
  { color: 'green', class: 'bg-green-500' },
  { color: 'yellow', class: 'bg-yellow-500' },
  { color: 'red', class: 'bg-red-500' },
  { color: 'purple', class: 'bg-purple-500' },
  { color: 'orange', class: 'bg-orange-500' },
]

/**
 * Visibility options
 */
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
    description_en: 'Only you can see this',
    description_ar: 'أنت فقط يمكنك رؤية هذا',
  },
  {
    visibility: 'team',
    icon: Users,
    label_en: 'Team',
    label_ar: 'الفريق',
    description_en: 'Visible to your team',
    description_ar: 'مرئي لفريقك',
  },
  {
    visibility: 'public',
    icon: Globe,
    label_en: 'Public',
    label_ar: 'عام',
    description_en: 'Visible to all users',
    description_ar: 'مرئي لجميع المستخدمين',
  },
]

export function TimelineAnnotationDialog({
  open,
  onOpenChange,
  onSubmit,
  annotation,
  eventId,
  isLoading = false,
}: TimelineAnnotationDialogProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const isEditing = !!annotation

  // Form state
  const [type, setType] = useState<AnnotationType>(annotation?.type || 'note')
  const [contentEn, setContentEn] = useState(annotation?.content_en || '')
  const [contentAr, setContentAr] = useState(annotation?.content_ar || '')
  const [color, setColor] = useState<AnnotationColor>(annotation?.color || 'blue')
  const [visibility, setVisibility] = useState<AnnotationVisibility>(
    annotation?.visibility || 'private',
  )

  // Reset form when dialog opens/closes or annotation changes
  useEffect(() => {
    if (open) {
      setType(annotation?.type || 'note')
      setContentEn(annotation?.content_en || '')
      setContentAr(annotation?.content_ar || '')
      setColor(annotation?.color || 'blue')
      setVisibility(annotation?.visibility || 'private')
    }
  }, [open, annotation])

  const handleSubmit = () => {
    if (!contentEn.trim()) return

    if (isEditing) {
      onSubmit({
        content_en: contentEn,
        content_ar: contentAr || undefined,
        color,
        visibility,
      } as UpdateAnnotationRequest)
    } else if (eventId) {
      onSubmit({
        event_id: eventId,
        type,
        content_en: contentEn,
        content_ar: contentAr || undefined,
        color,
        visibility,
      } as CreateAnnotationRequest)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-start">
            {isEditing
              ? t('timeline.annotations.edit_title')
              : t('timeline.annotations.create_title')}
          </DialogTitle>
          <DialogDescription className="text-start">
            {isEditing
              ? t('timeline.annotations.edit_description')
              : t('timeline.annotations.create_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Annotation Type Selection (only for create) */}
          {!isEditing && (
            <div className="space-y-3">
              <Label className="text-start block">{t('timeline.annotations.type')}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {annotationTypes.map(({ type: t, icon: Icon, label_en, label_ar }) => (
                  <Button
                    key={t}
                    type="button"
                    variant={type === t ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-1 h-auto py-3 min-h-16"
                    onClick={() => setType(t)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{isRTL ? label_ar : label_en}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Content - English */}
          <div className="space-y-2">
            <Label htmlFor="content-en" className="text-start block">
              {t('timeline.annotations.content_en')}
              <span className="text-destructive ms-1">*</span>
            </Label>
            <Textarea
              id="content-en"
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              placeholder={t('timeline.annotations.content_placeholder_en')}
              className="min-h-20 resize-none"
              dir="ltr"
            />
          </div>

          {/* Content - Arabic */}
          <div className="space-y-2">
            <Label htmlFor="content-ar" className="text-start block">
              {t('timeline.annotations.content_ar')}
            </Label>
            <Textarea
              id="content-ar"
              value={contentAr}
              onChange={(e) => setContentAr(e.target.value)}
              placeholder={t('timeline.annotations.content_placeholder_ar')}
              className="min-h-20 resize-none"
              dir="rtl"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-start block">{t('timeline.annotations.color')}</Label>
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
            <Label className="text-start block">{t('timeline.annotations.visibility')}</Label>
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
            {isLoading
              ? t('common.saving')
              : isEditing
                ? t('common.save')
                : t('timeline.annotations.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Annotation Badge Component
 * Compact display for annotations on timeline events
 */
export function TimelineAnnotationBadge({
  annotation,
  onClick,
  onDelete,
  className,
}: {
  annotation: TimelineAnnotation
  onClick?: () => void
  onDelete?: () => void
  className?: string
}) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const TypeIcon = annotationTypes.find((t) => t.type === annotation.type)?.icon || MessageSquare

  const colorClass = colorOptions.find((c) => c.color === annotation.color)?.class || 'bg-blue-500'

  return (
    <Badge
      variant="outline"
      className={cn(
        'group inline-flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 transition-colors',
        className,
      )}
      onClick={onClick}
    >
      <span className={cn('w-2 h-2 rounded-full', colorClass)} />
      <TypeIcon className="h-3 w-3" />
      <span className="max-w-24 truncate text-xs">
        {isRTL && annotation.content_ar ? annotation.content_ar : annotation.content_en}
      </span>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
      )}
    </Badge>
  )
}
