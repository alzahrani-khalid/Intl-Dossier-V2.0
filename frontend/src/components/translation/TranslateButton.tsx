/**
 * TranslateButton Component
 * Feature: translation-service
 *
 * Button component that triggers AI-powered translation between Arabic and English.
 * Includes progress indicator and confidence display.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, Loader2, Check, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useTranslateContent, detectLanguage } from '@/hooks/useTranslateContent'
import type { TranslateButtonProps, TranslationLanguage } from '@/types/translation.types'
import { getConfidenceLevelKey, getConfidenceColorClass } from '@/types/translation.types'

export function TranslateButton({
  sourceText,
  onTranslate,
  direction = 'auto',
  contentType = 'general',
  preserveFormatting = true,
  entityType,
  entityId,
  fieldName,
  disabled = false,
  className,
  size = 'sm',
  showConfidence = true,
}: TranslateButtonProps) {
  const { t, i18n } = useTranslation('translation-service')
  const isRTL = i18n.language === 'ar'

  const [showSuccess, setShowSuccess] = useState(false)
  const [lastConfidence, setLastConfidence] = useState<number | null>(null)

  const { translate, isTranslating, error, confidence, sourceLanguage, targetLanguage, reset } =
    useTranslateContent()

  // Determine direction based on detected language or explicit setting
  const getTranslationInfo = useCallback(() => {
    if (direction === 'en_to_ar') {
      return { from: 'en' as TranslationLanguage, to: 'ar' as TranslationLanguage }
    }
    if (direction === 'ar_to_en') {
      return { from: 'ar' as TranslationLanguage, to: 'en' as TranslationLanguage }
    }
    // Auto-detect
    const detected = detectLanguage(sourceText)
    return {
      from: detected,
      to: detected === 'en' ? ('ar' as TranslationLanguage) : ('en' as TranslationLanguage),
    }
  }, [direction, sourceText])

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || isTranslating) return

    setShowSuccess(false)
    setLastConfidence(null)

    const result = await translate({
      text: sourceText,
      direction,
      contentType,
      preserveFormatting,
      entityType,
      entityId,
      fieldName,
    })

    if (result && result.translated_text) {
      onTranslate(result.translated_text)
      setLastConfidence(result.confidence)
      setShowSuccess(true)

      // Reset success state after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
        reset()
      }, 3000)
    }
  }, [
    sourceText,
    isTranslating,
    translate,
    direction,
    contentType,
    preserveFormatting,
    entityType,
    entityId,
    fieldName,
    onTranslate,
    reset,
  ])

  const translationInfo = getTranslationInfo()
  const hasText = sourceText.trim().length > 0
  const isDisabled = disabled || !hasText || isTranslating

  // Size variants
  const sizeClasses = {
    sm: 'h-8 w-8 p-0',
    default: 'h-9 px-3',
    lg: 'h-10 px-4',
  }

  const iconSize = {
    sm: 'h-4 w-4',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  // Get button label for tooltip
  const getTooltipContent = () => {
    if (isTranslating) {
      return t('translating')
    }
    if (error) {
      return t(`errors.${error}`, { defaultValue: t('errors.default') })
    }
    if (showSuccess && lastConfidence !== null) {
      const confidenceKey = getConfidenceLevelKey(lastConfidence)
      return `${t('success')} - ${t(confidenceKey)}`
    }
    if (!hasText) {
      return t('noTextToTranslate')
    }

    const fromLabel = t(`languages.${translationInfo.from}`)
    const toLabel = t(`languages.${translationInfo.to}`)
    return t('translateFromTo', { from: fromLabel, to: toLabel })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={showSuccess ? 'default' : error ? 'destructive' : 'outline'}
            size="icon"
            className={cn(
              sizeClasses[size],
              'transition-all duration-200',
              showSuccess && 'bg-green-600 hover:bg-green-700 border-green-600',
              className,
            )}
            disabled={isDisabled}
            onClick={handleTranslate}
            aria-label={getTooltipContent()}
          >
            {isTranslating ? (
              <Loader2 className={cn(iconSize[size], 'animate-spin')} />
            ) : showSuccess ? (
              <Check className={iconSize[size]} />
            ) : error ? (
              <AlertCircle className={iconSize[size]} />
            ) : (
              <div className="relative flex items-center justify-center">
                <Languages className={iconSize[size]} />
                {size !== 'sm' && (
                  <span className="ms-1.5 text-xs font-medium">
                    {translationInfo.from.toUpperCase()}
                    {isRTL ? (
                      <ArrowLeft className="inline h-3 w-3 mx-0.5" />
                    ) : (
                      <ArrowRight className="inline h-3 w-3 mx-0.5" />
                    )}
                    {translationInfo.to.toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={isRTL ? 'left' : 'right'}>
          <p>{getTooltipContent()}</p>
          {showSuccess && showConfidence && lastConfidence !== null && (
            <p className={cn('text-xs mt-1', getConfidenceColorClass(lastConfidence))}>
              {t('confidenceScore', { score: Math.round(lastConfidence * 100) })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default TranslateButton
