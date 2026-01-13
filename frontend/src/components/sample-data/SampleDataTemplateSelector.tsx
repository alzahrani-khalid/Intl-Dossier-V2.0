/**
 * SampleDataTemplateSelector Component
 * A modal/sheet for selecting a sample data template to populate
 * Mobile-first, RTL-compatible
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, Palette, Shield, Globe, Package, Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import type { SampleDataTemplate } from '@/types/sample-data.types'
import { templateColors, templateIconColors } from '@/types/sample-data.types'

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  palette: Palette,
  shield: Shield,
  globe: Globe,
  package: Package,
}

interface SampleDataTemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: SampleDataTemplate[]
  onSelect: (templateSlug: string) => void
  isLoading?: boolean
  isPopulating?: boolean
}

export function SampleDataTemplateSelector({
  open,
  onOpenChange,
  templates,
  onSelect,
  isLoading = false,
  isPopulating = false,
}: SampleDataTemplateSelectorProps) {
  const { t, i18n } = useTranslation('sample-data')
  const isRTL = i18n.language === 'ar'

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Use sheet on mobile, dialog on desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate)
    }
  }

  const content = (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((template) => {
            const Icon = iconMap[template.icon] || Package
            const isSelected = selectedTemplate === template.slug
            const colorClasses = templateColors[template.color] || templateColors.blue
            const iconColorClass = templateIconColors[template.color] || templateIconColors.blue

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplate(template.slug)}
                disabled={isPopulating}
                className={cn(
                  'relative flex flex-col items-start p-4 rounded-lg border-2 transition-all text-start',
                  'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'min-h-[120px] sm:min-h-[140px]',
                  isSelected
                    ? `${colorClasses} border-2`
                    : 'bg-card border-border hover:border-muted-foreground/30',
                )}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 end-2">
                    <div
                      className={cn(
                        'h-5 w-5 rounded-full flex items-center justify-center',
                        iconColorClass.replace('text-', 'bg-').replace('-600', '-500'),
                      )}
                    >
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    'p-2 rounded-lg mb-2',
                    isSelected ? 'bg-background/50' : 'bg-muted',
                  )}
                >
                  <Icon className={cn('h-5 w-5', iconColorClass)} />
                </div>

                {/* Text */}
                <h3 className="font-semibold text-sm sm:text-base mb-1">
                  {isRTL ? template.name_ar : template.name_en}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {isRTL ? template.description_ar : template.description_en}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  const footer = (
    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isPopulating}
        className="w-full sm:w-auto"
      >
        {t('dialog.populateCancel')}
      </Button>
      <Button
        onClick={handleConfirm}
        disabled={!selectedTemplate || isPopulating}
        className="w-full sm:w-auto"
      >
        {isPopulating ? (
          <>
            <Loader2 className={cn('h-4 w-4 animate-spin', isRTL ? 'ms-2' : 'me-2')} />
            {t('loading.populating')}
          </>
        ) : (
          t('dialog.populateConfirm')
        )}
      </Button>
    </div>
  )

  // Mobile: Sheet (bottom drawer)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh]" dir={isRTL ? 'rtl' : 'ltr'}>
          <SheetHeader className="text-start">
            <SheetTitle>{t('templates.title')}</SheetTitle>
            <SheetDescription>{t('templates.description')}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto flex-1">{content}</div>
          <SheetFooter className="mt-4">{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Dialog (modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className={isRTL ? 'text-end' : 'text-start'}>
          <DialogTitle>{t('templates.title')}</DialogTitle>
          <DialogDescription>{t('templates.description')}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 max-h-[400px] overflow-y-auto">{content}</div>
        <DialogFooter className="mt-4">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SampleDataTemplateSelector
