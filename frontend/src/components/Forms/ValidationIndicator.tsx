/**
 * ValidationIndicator Components
 * Visual indicators for form validation states with RTL support
 */

import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  Lightbulb,
  ChevronRight,
} from 'lucide-react'
import type { ValidationResult, StrengthLevel } from '@/lib/validation-rules'

// =============================================================================
// VALIDATION ICON
// =============================================================================

interface ValidationIconProps {
  result: ValidationResult | null
  isValidating?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function ValidationIcon({
  result,
  isValidating = false,
  className,
  size = 'md',
}: ValidationIconProps) {
  const sizeClass = iconSizes[size]

  // Loading state
  if (isValidating) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, rotate: 360 }}
        transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
      >
        <Loader2 className={cn(sizeClass, 'text-muted-foreground', className)} />
      </motion.div>
    )
  }

  // No result yet
  if (!result) {
    return null
  }

  // Valid state
  if (result.isValid && result.severity !== 'warning') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <CheckCircle2 className={cn(sizeClass, 'text-emerald-500', className)} />
      </motion.div>
    )
  }

  // Warning state
  if (result.severity === 'warning') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <AlertCircle className={cn(sizeClass, 'text-amber-500', className)} />
      </motion.div>
    )
  }

  // Error state
  if (!result.isValid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <XCircle className={cn(sizeClass, 'text-red-500', className)} />
      </motion.div>
    )
  }

  // Info state
  return (
    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
      <Info className={cn(sizeClass, 'text-blue-500', className)} />
    </motion.div>
  )
}

// =============================================================================
// VALIDATION MESSAGE
// =============================================================================

interface ValidationMessageProps {
  result: ValidationResult | null
  showSuggestion?: boolean
  className?: string
  onSuggestionClick?: (suggestion: string) => void
}

export function ValidationMessage({
  result,
  showSuggestion = true,
  className,
  onSuggestionClick,
}: ValidationMessageProps) {
  const { t, i18n } = useTranslation('validation')
  const isRTL = i18n.language === 'ar'

  if (!result || (!result.messageKey && !result.suggestion)) {
    return null
  }

  // Parse message key with parameters (format: "key|param1:value1|param2:value2")
  const parseMessageKey = (key: string) => {
    const parts = key.split('|')
    const msgKey = parts[0]
    const params: Record<string, string | number> = {}

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]
      if (part) {
        const [paramKey, paramValue] = part.split(':')
        if (paramKey && paramValue !== undefined) {
          params[paramKey] = isNaN(Number(paramValue)) ? paramValue : Number(paramValue)
        }
      }
    }

    return { messageKey: msgKey, params }
  }

  const { messageKey, params } = parseMessageKey(result.messageKey)
  const allParams = { ...params, ...result.details }

  const severityStyles = {
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400',
  }

  const bgStyles = {
    error: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.messageKey}
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn('overflow-hidden', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div
          className={cn(
            'rounded-md border px-3 py-2 text-sm',
            bgStyles[result.severity],
            severityStyles[result.severity],
          )}
        >
          {/* Main message */}
          <div className="flex items-start gap-2">
            <ValidationIcon result={result} size="sm" className="mt-0.5 shrink-0" />
            <span className="text-start">{t(messageKey || 'validation.required', allParams)}</span>
          </div>

          {/* Suggestion */}
          {showSuggestion && (result.suggestionKey || result.suggestion) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 flex items-start gap-2 text-xs opacity-80"
            >
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div className="flex-1 text-start">
                {result.suggestionKey && t(result.suggestionKey, allParams)}
                {result.suggestion && onSuggestionClick && (
                  <button
                    type="button"
                    onClick={() => onSuggestionClick(result.suggestion!)}
                    className={cn(
                      'ms-2 inline-flex items-center gap-1 underline underline-offset-2',
                      'hover:opacity-80 transition-opacity',
                    )}
                  >
                    {t('suggestions.apply')}
                    <ChevronRight className={cn('h-3 w-3', isRTL && 'rotate-180')} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// =============================================================================
// INLINE VALIDATION HINT
// =============================================================================

interface ValidationHintProps {
  result: ValidationResult | null
  className?: string
}

export function ValidationHint({ result, className }: ValidationHintProps) {
  const { t, i18n } = useTranslation('validation')
  const isRTL = i18n.language === 'ar'

  if (!result || !result.messageKey) {
    return null
  }

  const parseMessageKey = (key: string) => {
    const parts = key.split('|')
    const msgKey = parts[0] || 'validation.required'
    const params: Record<string, string | number> = {}

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]
      if (part) {
        const [paramKey, paramValue] = part.split(':')
        if (paramKey && paramValue !== undefined) {
          params[paramKey] = isNaN(Number(paramValue)) ? paramValue : Number(paramValue)
        }
      }
    }

    return { messageKey: msgKey, params }
  }

  const { messageKey, params } = parseMessageKey(result.messageKey)
  const allParams = { ...params, ...result.details }

  const severityStyles = {
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-muted-foreground',
  }

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={result.messageKey}
        initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: isRTL ? 10 : -10 }}
        transition={{ duration: 0.15 }}
        className={cn('text-sm text-start', severityStyles[result.severity], className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {t(messageKey, allParams)}
      </motion.p>
    </AnimatePresence>
  )
}

// =============================================================================
// CHARACTER COUNT INDICATOR
// =============================================================================

interface CharacterCountProps {
  current: number
  max: number
  className?: string
}

export function CharacterCount({ current, max, className }: CharacterCountProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const percentage = (current / max) * 100
  const remaining = max - current

  let colorClass = 'text-muted-foreground'
  if (percentage >= 100) {
    colorClass = 'text-red-600 dark:text-red-400 font-medium'
  } else if (percentage >= 90) {
    colorClass = 'text-amber-600 dark:text-amber-400'
  }

  return (
    <motion.span
      className={cn('text-xs tabular-nums', colorClass, className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      animate={{
        scale: percentage >= 100 ? [1, 1.1, 1] : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {current}/{max}
      {remaining < 0 && <span className="ms-1">({Math.abs(remaining)} over)</span>}
    </motion.span>
  )
}

// =============================================================================
// PASSWORD STRENGTH INDICATOR
// =============================================================================

interface PasswordStrengthProps {
  level: StrengthLevel
  score: number
  messageKey: string
  improvements?: string[]
  showImprovements?: boolean
  className?: string
}

const strengthColors: Record<StrengthLevel, string> = {
  weak: 'bg-red-500',
  fair: 'bg-amber-500',
  good: 'bg-blue-500',
  strong: 'bg-emerald-500',
}

const strengthTextColors: Record<StrengthLevel, string> = {
  weak: 'text-red-600 dark:text-red-400',
  fair: 'text-amber-600 dark:text-amber-400',
  good: 'text-blue-600 dark:text-blue-400',
  strong: 'text-emerald-600 dark:text-emerald-400',
}

export function PasswordStrength({
  level,
  score,
  messageKey,
  improvements = [],
  showImprovements = true,
  className,
}: PasswordStrengthProps) {
  const { t, i18n } = useTranslation('validation')
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('space-y-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', strengthColors[level])}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <span className={cn('text-xs font-medium min-w-16 text-end', strengthTextColors[level])}>
          {t(messageKey)}
        </span>
      </div>

      {/* Improvement suggestions */}
      {showImprovements && improvements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          className="space-y-1"
        >
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            {t('password.improvements')}
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5 ps-5">
            {improvements.slice(0, 3).map((improvement) => (
              <li key={improvement} className="list-disc text-start">
                {t(improvement)}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}

// =============================================================================
// VALIDATION SUMMARY (for form-level display)
// =============================================================================

interface ValidationSummaryProps {
  errors: Record<string, ValidationResult>
  className?: string
  onFieldClick?: (fieldName: string) => void
}

export function ValidationSummary({ errors, className, onFieldClick }: ValidationSummaryProps) {
  const { t, i18n } = useTranslation('validation')
  const isRTL = i18n.language === 'ar'

  const errorEntries = Object.entries(errors).filter(([, result]) => !result.isValid)

  if (errorEntries.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-red-200 dark:border-red-800',
        'bg-red-50 dark:bg-red-950/20 p-4',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="alert"
      aria-labelledby="validation-summary-title"
    >
      <h3
        id="validation-summary-title"
        className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2"
      >
        <XCircle className="h-4 w-4" />
        {t('summary.title', { count: errorEntries.length })}
      </h3>
      <ul className="mt-2 space-y-1">
        {errorEntries.map(([fieldName, result]) => {
          const parseKey = () => {
            const parts = result.messageKey.split('|')
            const key = parts[0] || 'validation.required'
            const p: Record<string, string | number> = {}
            for (let i = 1; i < parts.length; i++) {
              const part = parts[i]
              if (part) {
                const [pk, pv] = part.split(':')
                if (pk && pv !== undefined) {
                  p[pk] = isNaN(Number(pv)) ? pv : Number(pv)
                }
              }
            }
            return { msgKey: key, params: p }
          }
          const { msgKey, params } = parseKey()

          return (
            <li key={fieldName}>
              <button
                type="button"
                onClick={() => onFieldClick?.(fieldName)}
                className={cn(
                  'text-sm text-red-700 dark:text-red-300 text-start',
                  'hover:underline underline-offset-2',
                  'flex items-center gap-2',
                )}
              >
                <span className="font-medium">{t(`fields.${fieldName}`, fieldName)}:</span>
                <span>{t(msgKey, { ...params, ...result.details })}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  type ValidationIconProps,
  type ValidationMessageProps,
  type ValidationHintProps,
  type CharacterCountProps,
  type PasswordStrengthProps,
  type ValidationSummaryProps,
}
