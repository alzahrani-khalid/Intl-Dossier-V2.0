import { useTranslation } from 'react-i18next'
import type { UseFormRegister, FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { m, AnimatePresence } from 'motion/react'
import { useState } from 'react'

interface FormTextareaAceternityProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  name: string
  register?: UseFormRegister<any>
  error?: FieldError
  required?: boolean
  helpText?: string
  variant?: 'default' | 'aceternity' // aceternity = enhanced styling with animations
  maxLength?: number
  showCharCount?: boolean
}

export function FormTextareaAceternity({
  label,
  name,
  register,
  error,
  required = false,
  helpText,
  variant = 'default',
  maxLength,
  showCharCount = false,
  rows = 4,
  ...rest
}: FormTextareaAceternityProps) {
  const { t } = useTranslation()
  const [isFocused, setIsFocused] = useState(false)
  const [charCount, setCharCount] = useState(0)

  const textareaBaseClasses = cn(
    // Base styles
    'w-full px-4 py-3',
    // Mobile-first touch targets
    'min-h-24 sm:min-h-20 md:min-h-24',
    // Responsive text
    'text-sm sm:text-base',
    // Resize behavior
    'resize-y',
    // Borders and colors
    error ? 'border-danger dark:border-danger' : 'border-input dark:border-line',
    'border rounded-lg',
    // Focus states
    'focus:ring-2 focus:border-transparent',
    error ? 'focus:ring-danger/30' : 'focus:ring-primary-500',
    // Dark mode
    'dark:bg-muted dark:text-white',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Transitions
    'transition-all duration-200',
    // Text direction
    'text-start',
  )

  const aceternityClasses = cn(
    textareaBaseClasses,
    // Aceternity enhancements
    'bg-white dark:bg-muted',
    'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)]',
    'focus:shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),_0px_1px_0px_0px_rgba(25,28,33,0.04),_0px_0px_0px_2px_rgba(var(--primary),0.3)]',
    isFocused && 'bg-muted dark:bg-muted',
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (showCharCount) {
      setCharCount(e.target.value.length)
    }
    if (rest.onChange) {
      rest.onChange(e)
    }
  }

  return (
    <div className="space-y-2">
      {/* Label and char count */}
      <div className="flex items-center justify-between">
        <m.label
          htmlFor={name}
          className={cn(
            'block font-medium text-start',
            'text-sm sm:text-base',
            'text-muted-foreground dark:text-muted-foreground',
          )}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {required && (
            <span className="text-danger ms-1" aria-label={t('validation.required')}>
              *
            </span>
          )}
        </m.label>

        {/* Character count */}
        {showCharCount && maxLength && (
          <m.span
            className={cn(
              'text-xs text-muted-foreground dark:text-muted-foreground',
              charCount > maxLength && 'text-danger dark:text-danger',
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {charCount}/{maxLength}
          </m.span>
        )}
      </div>

      {/* Textarea field */}
      <div className="relative">
        <textarea
          id={name}
          rows={rows}
          maxLength={maxLength}
          {...(register ? register(name) : {})}
          className={variant === 'aceternity' ? aceternityClasses : textareaBaseClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleChange}
          {...rest}
        />

        {/* Focus ring indicator (aceternity variant) */}
        {variant === 'aceternity' && isFocused && (
          <m.div
            className="absolute inset-0 rounded-lg pointer-events-none ring-2 ring-primary-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Help text */}
      {helpText && !error && (
        <m.p
          id={`${name}-help`}
          className="text-sm text-muted-foreground dark:text-muted-foreground text-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          {helpText}
        </m.p>
      )}

      {/* Error message with animation */}
      <AnimatePresence>
        {error && (
          <m.p
            id={`${name}-error`}
            className="text-sm text-danger dark:text-danger text-start"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {t(error.message || 'validation.required')}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  )
}
