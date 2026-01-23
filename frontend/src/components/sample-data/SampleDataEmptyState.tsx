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
          text-center py-12 sm:py-16 px-4 sm:px-6
          rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10
          border border-dashed border-muted-foreground/20
          ${className}
        `}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Icon */}
        <div className="relative mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          {/* Decorative dots */}
          <div className="absolute -top-1 -end-1 h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
          <div className="absolute -bottom-1 -start-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse delay-300" />
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          {t('emptyState.title')}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">
          {t('emptyState.description')}
        </p>

        {/* Hint */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-6 bg-muted/50 px-3 py-2 rounded-full">
          <Lightbulb className="h-4 w-4 flex-shrink-0" />
          <span>{t('emptyState.hint')}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto min-h-11 px-6"
            onClick={() => setShowTemplateSelector(true)}
            disabled={isPopulating}
          >
            <Sparkles className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('emptyState.buttonText')}
          </Button>

          {onCreateNew && (
            <>
              <span className="text-sm text-muted-foreground">{t('emptyState.orCreateOwn')}</span>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-h-11"
                onClick={onCreateNew}
              >
                <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
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
