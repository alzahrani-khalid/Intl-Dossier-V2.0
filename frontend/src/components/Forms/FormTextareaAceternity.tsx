import { useTranslation } from 'react-i18next'
import type { UseFormRegister, FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
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
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
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
    error
      ? 'border-red-500 dark:border-red-400'
      : 'border-input dark:border-gray-600',
    'border rounded-lg',
    // Focus states
    'focus:ring-2 focus:border-transparent',
    error
      ? 'focus:ring-red-500'
      : 'focus:ring-primary-500',
    // Dark mode
    'dark:bg-gray-700 dark:text-white',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Transitions
    'transition-all duration-200',
    // Text direction
    'text-start'
  )

  const aceternityClasses = cn(
    textareaBaseClasses,
    // Aceternity enhancements
    'bg-white dark:bg-zinc-800',
    'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)]',
    'focus:shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),_0px_1px_0px_0px_rgba(25,28,33,0.04),_0px_0px_0px_2px_rgba(var(--primary),0.3)]',
    isFocused && 'bg-gray-50 dark:bg-zinc-700'
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
    <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Label and char count */}
      <div className="flex items-center justify-between">
        <motion.label
          htmlFor={name}
          className={cn(
            'block font-medium text-start',
            'text-sm sm:text-base',
            'text-gray-700 dark:text-gray-300'
          )}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {required && (
            <span className="text-red-500 ms-1" aria-label={t('validation.required')}>
              *
            </span>
          )}
        </motion.label>

        {/* Character count */}
        {showCharCount && maxLength && (
          <motion.span
            className={cn(
              'text-xs text-gray-500 dark:text-gray-400',
              charCount > maxLength && 'text-red-500 dark:text-red-400'
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {charCount}/{maxLength}
          </motion.span>
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
          aria-describedby={
            error ? `${name}-error` : helpText ? `${name}-help` : undefined
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleChange}
          {...rest}
        />

        {/* Focus ring indicator (aceternity variant) */}
        {variant === 'aceternity' && isFocused && (
          <motion.div
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
        <motion.p
          id={`${name}-help`}
          className="text-sm text-gray-600 dark:text-gray-400 text-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          {helpText}
        </motion.p>
      )}

      {/* Error message with animation */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${name}-error`}
            className="text-sm text-red-600 dark:text-red-400 text-start"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {t(error.message || 'validation.required')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
