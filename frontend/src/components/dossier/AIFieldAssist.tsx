/**
 * AIFieldAssist Component
 *
 * AI-assisted field pre-filling for dossier creation.
 * Collapsible section with textarea for user description and generate button.
 * When generated, fields (name, description, tags) are populated in the form.
 *
 * Features:
 * - Mobile-first responsive design (320px → desktop)
 * - RTL support via logical properties
 * - Collapsible/expandable section
 * - Loading state with spinner
 * - Error handling with retry
 * - Touch-friendly UI (44x44px min targets)
 * - WCAG AA accessibility compliant
 */

import { useState, useCallback } from 'react'
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  Wand2,
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAIFieldAssist, type GeneratedFields } from '@/hooks/useAIFieldAssist'
import type { DossierType } from '@/services/dossier-api'
import { useDirection } from '@/hooks/useDirection'

interface AIFieldAssistProps {
  /** The selected dossier type */
  dossierType: DossierType
  /** Callback when fields are generated */
  onGenerate: (fields: GeneratedFields) => void
  /** Whether the component is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

export function AIFieldAssist({
  dossierType,
  onGenerate,
  disabled = false,
  className,
}: AIFieldAssistProps) {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
  // State
  const [isExpanded, setIsExpanded] = useState(false)
  const [description, setDescription] = useState('')
  const [hasApplied, setHasApplied] = useState(false)

  // AI hook
  const { generate, generatedFields, isGenerating, error, retry, reset } = useAIFieldAssist()

  // Handle generate button click
  const handleGenerate = useCallback(async () => {
    if (!description.trim() || description.trim().length < 10) return

    setHasApplied(false)
    await generate({
      dossier_type: dossierType,
      description: description.trim(),
      language: isRTL ? 'ar' : 'en',
    })
  }, [description, dossierType, isRTL, generate])

  // Handle applying generated fields
  const handleApply = useCallback(() => {
    if (generatedFields) {
      onGenerate(generatedFields)
      setHasApplied(true)
    }
  }, [generatedFields, onGenerate])

  // Handle retry
  const handleRetry = useCallback(() => {
    setHasApplied(false)
    retry()
  }, [retry])

  // Handle reset/clear
  const handleReset = useCallback(() => {
    setDescription('')
    setHasApplied(false)
    reset()
  }, [reset])

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // Check if generate is possible
  const canGenerate = description.trim().length >= 10 && !isGenerating && !disabled

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-colors',
        isExpanded ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30',
        className,
      )}
    >
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={toggleExpanded}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between p-3 sm:p-4 min-h-11',
          'hover:bg-primary/5 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        aria-expanded={isExpanded}
        aria-controls="ai-field-assist-content"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn('p-1.5 sm:p-2 rounded-lg', isExpanded ? 'bg-primary/20' : 'bg-muted')}>
            <Sparkles
              className={cn(
                'h-4 w-4 sm:h-5 sm:w-5',
                isExpanded ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          </div>
          <div className="text-start">
            <p className="font-medium text-sm sm:text-base">{t('dossier:aiAssist.title')}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('dossier:aiAssist.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
            {t('dossier:aiAssist.optional')}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            id="ai-field-assist-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 pt-0 space-y-4">
              {/* Description Input */}
              <div className="space-y-2">
                <label
                  htmlFor="ai-description"
                  className="text-sm font-medium text-muted-foreground"
                >
                  {t('dossier:aiAssist.describeLabel')}
                </label>
                <Textarea
                  id="ai-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('dossier:aiAssist.placeholder')}
                  className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
                  disabled={isGenerating || disabled}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length < 10 ? (
                    <span className="text-warning">
                      {t('dossier:aiAssist.minCharsHint', { count: 10 - description.length })}
                    </span>
                  ) : (
                    <span className="text-success">{t('dossier:aiAssist.ready')}</span>
                  )}
                </p>
              </div>

              {/* Generate Button */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="min-h-11 flex-1 sm:flex-none"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {t('dossier:aiAssist.generating')}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 me-2" />
                      {t('dossier:aiAssist.generate')}
                    </>
                  )}
                </Button>
                {(generatedFields || error) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="min-h-11"
                    disabled={isGenerating}
                  >
                    {t('dossier:aiAssist.clear')}
                  </Button>
                )}
              </div>

              {/* Error State */}
              {error && !generatedFields && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between gap-2">
                    <span className="text-sm">{error}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRetry}
                      className="min-h-8 shrink-0"
                    >
                      <RefreshCw className="h-3 w-3 me-1" />
                      {t('dossier:aiAssist.retry')}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Generated Fields Preview */}
              {generatedFields && (
                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 p-3 sm:p-4 bg-background rounded-lg border border-primary/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      {t('dossier:aiAssist.generatedFields')}
                    </h4>
                    {hasApplied && (
                      <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                        {t('dossier:aiAssist.applied')}
                      </Badge>
                    )}
                  </div>

                  {/* Preview Cards */}
                  <div className="space-y-2 text-sm">
                    {/* Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('dossier:aiAssist.nameEn')}
                        </p>
                        <p className="font-medium truncate">{generatedFields.name_en}</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded" dir="rtl">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('dossier:aiAssist.nameAr')}
                        </p>
                        <p className="font-medium truncate">{generatedFields.name_ar}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {(generatedFields.description_en || generatedFields.description_ar) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2 bg-muted/50 rounded">
                          <p className="text-xs text-muted-foreground mb-1">
                            {t('dossier:aiAssist.descriptionEn')}
                          </p>
                          <p className="text-xs line-clamp-2">{generatedFields.description_en}</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded" dir="rtl">
                          <p className="text-xs text-muted-foreground mb-1">
                            {t('dossier:aiAssist.descriptionAr')}
                          </p>
                          <p className="text-xs line-clamp-2">{generatedFields.description_ar}</p>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {generatedFields.suggested_tags.length > 0 && (
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground mb-2">
                          {t('dossier:aiAssist.suggestedTags')}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {generatedFields.suggested_tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Apply Button */}
                  <Button
                    type="button"
                    onClick={handleApply}
                    disabled={hasApplied}
                    className="w-full min-h-11"
                    variant={hasApplied ? 'secondary' : 'default'}
                  >
                    {hasApplied ? (
                      <>
                        <Check className="h-4 w-4 me-2" />
                        {t('dossier:aiAssist.fieldsApplied')}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 me-2" />
                        {t('dossier:aiAssist.applyToForm')}
                      </>
                    )}
                  </Button>
                </m.div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
