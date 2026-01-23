/**
 * SampleDataEmptyState Component
 * Empty state with sample data population option
 * Mobile-first, RTL-compatible
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Plus, Lightbulb } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SampleDataTemplateSelector } from './SampleDataTemplateSelector'

import type { SampleDataTemplate } from '@/types/sample-data.types'

interface SampleDataEmptyStateProps {
  templates: SampleDataTemplate[]
  isLoadingTemplates?: boolean
  onPopulate: (templateSlug: string) => void
  isPopulating?: boolean
  onCreateNew?: () => void
  className?: string
}

export function SampleDataEmptyState({
  templates,
  isLoadingTemplates = false,
  onPopulate,
  isPopulating = false,
  onCreateNew,
  className = '',
}: SampleDataEmptyStateProps) {
  const { t, i18n } = useTranslation('sample-data')
  const isRTL = i18n.language === 'ar'

  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  const handlePopulate = (templateSlug: string) => {
    onPopulate(templateSlug)
    setShowTemplateSelector(false)
  }

  return (
    <>
      <div
        className={`
          flex flex-col items-center justify-center
          rounded-2xl border border-dashed border-muted-foreground/20 bg-gradient-to-br
          from-muted/30 to-muted/10 px-4 py-12
          text-center sm:px-6 sm:py-16
          ${className}
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Icon */}
        <div className="relative mb-6">
          <div className="rounded-full bg-primary/10 p-4">
            <Sparkles className="size-8 text-primary sm:size-10" />
          </div>
          {/* Decorative dots */}
          <div className="absolute -end-1 -top-1 size-3 animate-pulse rounded-full bg-amber-400" />
          <div className="absolute -bottom-1 -start-1 size-2 animate-pulse rounded-full bg-emerald-400 delay-300" />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">
          {t('emptyState.title')}
        </h3>

        {/* Description */}
        <p className="mb-6 max-w-md text-sm text-muted-foreground sm:text-base">
          {t('emptyState.description')}
        </p>

        {/* Hint */}
        <div className="mb-6 flex items-center gap-2 rounded-full bg-muted/50 px-3 py-2 text-xs text-muted-foreground sm:text-sm">
          <Lightbulb className="size-4 shrink-0" />
          <span>{t('emptyState.hint')}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="min-h-11 w-full px-6 sm:w-auto"
            onClick={() => setShowTemplateSelector(true)}
            disabled={isPopulating}
          >
            <Sparkles className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('emptyState.buttonText')}
          </Button>

          {onCreateNew && (
            <>
              <span className="text-sm text-muted-foreground">{t('emptyState.orCreateOwn')}</span>
              <Button
                variant="outline"
                size="lg"
                className="min-h-11 w-full sm:w-auto"
                onClick={onCreateNew}
              >
                <Plus className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {i18n.language === 'ar' ? 'إنشاء ملف جديد' : 'Create Dossier'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Template Selector */}
      <SampleDataTemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        templates={templates}
        onSelect={handlePopulate}
        isLoading={isLoadingTemplates}
        isPopulating={isPopulating}
      />
    </>
  )
}

export default SampleDataEmptyState
