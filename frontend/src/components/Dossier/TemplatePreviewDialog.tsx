/**
 * TemplatePreviewDialog Component
 *
 * Displays a full preview of a dossier template's structure.
 * Shows sections, use cases, recommended tags, and example names
 * before the user decides to use the template.
 *
 * Features:
 * - Mobile-first responsive layout
 * - RTL support via logical properties
 * - Section breakdown (required/optional)
 * - Use cases list
 * - Example dossier name
 * - One-click template application
 */

import { useTranslation } from 'react-i18next'
import {
  Globe,
  Map,
  FileText,
  Building2,
  Users,
  CheckCircle2,
  Circle,
  Tag,
  Lightbulb,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { DossierTemplate } from '@/types/dossier-template.types'

// Icon mapping
const templateIcons: Record<string, typeof Globe> = {
  Globe,
  Map,
  FileText,
  Building2,
  Users,
}

interface TemplatePreviewDialogProps {
  template: DossierTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUseTemplate: (template: DossierTemplate) => void
}

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: TemplatePreviewDialogProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  if (!template) return null

  const Icon = templateIcons[template.icon] || FileText
  const requiredSections = template.sections.filter((s) => s.required)
  const optionalSections = template.sections.filter((s) => !s.required)

  const handleUseTemplate = () => {
    onUseTemplate(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col gap-0 p-0"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header with gradient */}
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br p-4 sm:p-6',
            template.thumbnail_color,
          )}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                  <Icon className="size-6 text-white" />
                </div>
                <div>
                  <h2 className="text-start text-lg font-bold text-white sm:text-xl">
                    {isRTL ? template.name_ar : template.name_en}
                  </h2>
                  <Badge variant="secondary" className="mt-1 border-0 bg-white/20 text-white">
                    {t(`type.${template.dossier_type}`)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-white hover:bg-white/20"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
                <span className="sr-only">{t('templates.preview.close')}</span>
              </Button>
            </div>
            <p className="mt-3 text-start text-sm text-white/90">
              {isRTL ? template.description_ar : template.description_en}
            </p>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-4 sm:p-6">
            {/* Example Name */}
            {(template.example_name_en || template.example_name_ar) && (
              <div>
                <h3 className="mb-2 text-start text-sm font-medium text-muted-foreground">
                  {t('templates.preview.exampleName')}
                </h3>
                <p className="text-start text-sm font-medium">
                  {isRTL ? template.example_name_ar : template.example_name_en}
                </p>
              </div>
            )}

            {/* Required Sections */}
            {requiredSections.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-start text-sm font-medium text-muted-foreground">
                  <CheckCircle2 className="size-4 text-primary" />
                  {t('templates.preview.requiredSections')} ({requiredSections.length})
                </h3>
                <div className="space-y-2">
                  {requiredSections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-lg border border-primary/20 bg-primary/5 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        <span className="text-start text-sm font-medium">
                          {isRTL ? section.title_ar : section.title_en}
                        </span>
                      </div>
                      <p className="ms-6 mt-1 text-start text-xs text-muted-foreground">
                        {isRTL ? section.description_ar : section.description_en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Sections */}
            {optionalSections.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-start text-sm font-medium text-muted-foreground">
                  <Circle className="size-4" />
                  {t('templates.preview.optionalSections')} ({optionalSections.length})
                </h3>
                <div className="space-y-2">
                  {optionalSections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-lg border border-border bg-muted/50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Circle className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-start text-sm font-medium">
                          {isRTL ? section.title_ar : section.title_en}
                        </span>
                      </div>
                      <p className="ms-6 mt-1 text-start text-xs text-muted-foreground">
                        {isRTL ? section.description_ar : section.description_en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Use Cases */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-start text-sm font-medium text-muted-foreground">
                <Lightbulb className="size-4" />
                {t('templates.preview.useCases')}
              </h3>
              <ul className="space-y-2">
                {(isRTL ? template.use_cases_ar : template.use_cases_en).map((useCase, index) => (
                  <li key={index} className="flex items-start gap-2 text-start text-sm">
                    <span className="mt-0.5 text-primary">•</span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Tags */}
            {template.recommended_tags.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-start text-sm font-medium text-muted-foreground">
                  <Tag className="size-4" />
                  {t('templates.preview.recommendedTags')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {template.recommended_tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-11 sm:min-h-10"
            >
              {t('templates.preview.close')}
            </Button>
            <Button onClick={handleUseTemplate} className="min-h-11 sm:min-h-10">
              {t('templates.preview.useTemplate')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TemplatePreviewDialog
