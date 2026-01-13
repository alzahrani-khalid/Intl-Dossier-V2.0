/**
 * FormFieldWithValidation Component
 * Enhanced form input with real-time validation, contextual errors, and recovery suggestions
 * Mobile-first and RTL-compatible
 */

import { useTranslation } from 'react-i18next'
import {
  useCallback,
  useState,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { useFieldValidation, type UseFieldValidationOptions } from '@/hooks/useFieldValidation'
import { calculatePasswordStrength } from '@/lib/validation-rules'
import {
  ValidationIcon,
  ValidationMessage,
  ValidationHint,
  CharacterCount,
  PasswordStrength,
} from './ValidationIndicator'
import type { FieldError } from 'react-hook-form'

// =============================================================================
// TYPES
// =============================================================================

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>
type BaseTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>

interface FormFieldWithValidationProps {
  /** Field name for accessibility and form handling */
  name: string
  /** Label text */
  label: string
  /** Whether field is required */
  required?: boolean
  /** Help text shown below the field */
  helpText?: string
  /** External error from react-hook-form */
  externalError?: FieldError
  /** Validation configuration */
  validation?: UseFieldValidationOptions
  /** Field type */
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'number' | 'textarea'
  /** Maximum length for character count */
  maxLength?: number
  /** Show character count */
  showCharCount?: boolean
  /** Show password strength indicator */
  showPasswordStrength?: boolean
  /** Whether to show full validation message or inline hint */
  validationDisplay?: 'message' | 'hint' | 'both'
  /** Callback when value changes */
  onChange?: (value: string) => void
  /** Callback when suggestion is applied */
  onSuggestionApply?: (suggestion: string) => void
  /** Additional class names for the container */
  className?: string
  /** Visual variant */
  variant?: 'default' | 'aceternity'
  /** Icon to display in the input */
  icon?: React.ReactNode
  /** Input props */
  inputProps?: BaseInputProps | BaseTextareaProps
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FormFieldWithValidation({
  name,
  label,
  required = false,
  helpText,
  externalError,
  validation,
  type = 'text',
  maxLength,
  showCharCount = false,
  showPasswordStrength = false,
  validationDisplay = 'message',
  onChange,
  onSuggestionApply,
  className,
  variant = 'default',
  icon,
  inputProps,
}: FormFieldWithValidationProps) {
  const { t, i18n } = useTranslation(['validation', 'common'])
  const isRTL = i18n.language === 'ar'
  const uniqueId = useId()

  // Local state
  const [value, setValue] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)

  // Field validation hook
  const fieldType = type === 'textarea' ? 'text' : type === 'tel' ? 'phone' : type
  const {
    result: validationResult,
    isValidating,
    isTouched,
    validate,
    setTouched,
    // reset - available for external use but not used internally
  } = useFieldValidation({
    ...validation,
    fieldType,
    required,
    maxLength,
    debounceMs: 300,
    instantFeedback: true,
  })

  // Password strength
  const passwordStrength =
    showPasswordStrength && type === 'password' ? calculatePasswordStrength(value) : null

  // Determine which error to show (external takes precedence)
  const hasExternalError = !!externalError
  const displayResult = hasExternalError
    ? {
        isValid: false,
        severity: 'error' as const,
        messageKey: externalError.message || 'validation.required',
      }
    : validationResult

  // Should show validation (only after touched or has external error)
  const shouldShowValidation = (isTouched && displayResult) || hasExternalError

  // Handle value change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      validate(newValue)
      onChange?.(newValue)
    },
    [onChange, validate],
  )

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false)
    setTouched()
  }, [setTouched])

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  // Handle suggestion apply
  const handleSuggestionApply = useCallback(
    (suggestion: string) => {
      setValue(suggestion)
      validate(suggestion)
      onChange?.(suggestion)
      onSuggestionApply?.(suggestion)
    },
    [onChange, onSuggestionApply, validate],
  )

  // ID references for accessibility
  const inputId = `${name}-${uniqueId}`
  const errorId = `${name}-error-${uniqueId}`
  const helpId = `${name}-help-${uniqueId}`
  const charCountId = `${name}-charcount-${uniqueId}`

  // Describe by references
  const describedBy = [
    shouldShowValidation && !displayResult?.isValid ? errorId : null,
    helpText ? helpId : null,
    showCharCount && maxLength ? charCountId : null,
  ]
    .filter(Boolean)
    .join(' ')

  // Input styling
  const inputBaseClasses = cn(
    // Base styles
    'w-full px-4 py-2',
    // Mobile-first touch targets
    'min-h-11 sm:min-h-10 md:min-h-12',
    // Responsive text
    'text-sm sm:text-base',
    // RTL-safe spacing with icons
    icon && (isRTL ? 'pe-12' : 'ps-12'),
    // Validation icon spacing
    (shouldShowValidation || isValidating) && (isRTL ? 'ps-12' : 'pe-12'),
    // Borders and colors based on validation state
    shouldShowValidation && !displayResult?.isValid
      ? 'border-red-500 dark:border-red-400'
      : shouldShowValidation && displayResult?.severity === 'warning'
        ? 'border-amber-500 dark:border-amber-400'
        : shouldShowValidation && displayResult?.isValid
          ? 'border-emerald-500 dark:border-emerald-400'
          : 'border-input dark:border-gray-600',
    'border rounded-lg',
    // Focus states
    'focus:ring-2 focus:border-transparent',
    shouldShowValidation && !displayResult?.isValid
      ? 'focus:ring-red-500'
      : shouldShowValidation && displayResult?.severity === 'warning'
        ? 'focus:ring-amber-500'
        : 'focus:ring-primary-500',
    // Dark mode
    'dark:bg-gray-700 dark:text-white',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Transitions
    'transition-all duration-200',
  )

  const aceternityClasses = cn(
    inputBaseClasses,
    // Aceternity enhancements
    'bg-white dark:bg-zinc-800',
    'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)]',
    isFocused &&
      'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),_0px_1px_0px_0px_rgba(25,28,33,0.04),_0px_0px_0px_2px_rgba(var(--primary),0.3)]',
    isFocused && 'bg-gray-50 dark:bg-zinc-700',
  )

  const inputClasses = variant === 'aceternity' ? aceternityClasses : inputBaseClasses

  return (
    <div className={cn('space-y-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <motion.label
          htmlFor={inputId}
          className={cn(
            'block font-medium text-start',
            'text-sm sm:text-base',
            'text-gray-700 dark:text-gray-300',
            shouldShowValidation && !displayResult?.isValid && 'text-red-700 dark:text-red-400',
          )}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {required && (
            <span className="text-red-500 ms-1" aria-label={t('common:validation.required')}>
              *
            </span>
          )}
        </motion.label>

        {/* Character count (shown in label row on desktop) */}
        {showCharCount && maxLength && (
          <CharacterCount current={value.length} max={maxLength} className="hidden sm:block" />
        )}
      </div>

      {/* Input container */}
      <div className="relative">
        {/* Leading icon */}
        {icon && (
          <motion.div
            className={cn(
              'absolute top-1/2 -translate-y-1/2',
              'text-gray-400',
              isRTL ? 'end-3' : 'start-3',
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {icon}
          </motion.div>
        )}

        {/* Input or Textarea */}
        {type === 'textarea' ? (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            aria-invalid={shouldShowValidation && !displayResult?.isValid}
            aria-describedby={describedBy || undefined}
            aria-required={required}
            maxLength={maxLength}
            className={cn(inputClasses, 'resize-y min-h-24')}
            {...(inputProps as BaseTextareaProps)}
          />
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            aria-invalid={shouldShowValidation && !displayResult?.isValid}
            aria-describedby={describedBy || undefined}
            aria-required={required}
            maxLength={maxLength}
            className={inputClasses}
            {...(inputProps as BaseInputProps)}
          />
        )}

        {/* Validation icon (trailing) */}
        <AnimatePresence>
          {(shouldShowValidation || isValidating) && (
            <motion.div
              className={cn('absolute top-1/2 -translate-y-1/2', isRTL ? 'start-3' : 'end-3')}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ValidationIcon result={displayResult} isValidating={isValidating} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Character count (mobile - shown below input) */}
      {showCharCount && maxLength && (
        <div id={charCountId} className="sm:hidden text-end">
          <CharacterCount current={value.length} max={maxLength} />
        </div>
      )}

      {/* Help text (only when no validation message) */}
      <AnimatePresence mode="wait">
        {helpText && !shouldShowValidation && (
          <motion.p
            id={helpId}
            key="help-text"
            className="text-sm text-gray-600 dark:text-gray-400 text-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {helpText}
          </motion.p>
        )}

        {/* Validation feedback */}
        {shouldShowValidation && displayResult && !displayResult.isValid && (
          <motion.div
            key="validation"
            id={errorId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            role="alert"
          >
            {validationDisplay === 'message' || validationDisplay === 'both' ? (
              <ValidationMessage
                result={displayResult}
                showSuggestion={true}
                onSuggestionClick={handleSuggestionApply}
              />
            ) : (
              <ValidationHint result={displayResult} />
            )}

            {validationDisplay === 'both' && (
              <div className="mt-1">
                <ValidationHint result={displayResult} />
              </div>
            )}
          </motion.div>
        )}

        {/* Warning state (when valid but has warning) */}
        {shouldShowValidation &&
          displayResult?.isValid &&
          displayResult?.severity === 'warning' && (
            <motion.div
              key="warning"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ValidationHint result={displayResult} />
            </motion.div>
          )}
      </AnimatePresence>

      {/* Password strength indicator */}
      {passwordStrength && value.length > 0 && (
        <PasswordStrength
          level={passwordStrength.level}
          score={passwordStrength.score}
          messageKey={passwordStrength.messageKey}
          improvements={passwordStrength.improvements}
          showImprovements={value.length >= 4}
        />
      )}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default FormFieldWithValidation
export type { FormFieldWithValidationProps }
