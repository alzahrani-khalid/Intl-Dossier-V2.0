import { useTranslation } from 'react-i18next'
import type { UseFormRegister, FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, type InputHTMLAttributes, type ReactNode } from 'react'

interface FormInputAceternityProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  register?: UseFormRegister<any>
  error?: FieldError
  required?: boolean
  helpText?: string
  icon?: ReactNode
  variant?: 'default' | 'aceternity' // aceternity = enhanced styling with animations
  placeholders?: string[] // For rotating placeholder animation (aceternity variant)
}

export function FormInputAceternity({
  label,
  name,
  register,
  error,
  required = false,
  helpText,
  icon,
  type = 'text',
  variant = 'default',
  placeholders = [],
  placeholder,
  ...rest
}: FormInputAceternityProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
  const [isFocused, setIsFocused] = useState(false)

  // Rotating placeholder effect for aceternity variant
  useEffect(() => {
    if (variant === 'aceternity' && placeholders.length > 0) {
      const interval = setInterval(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [variant, placeholders.length])

  const inputBaseClasses = cn(
    // Base styles
    'w-full px-4 py-2',
    // Mobile-first touch targets
    'min-h-11 sm:min-h-10 md:min-h-12',
    // Responsive text
    'text-sm sm:text-base',
    // RTL-safe spacing with icons
    icon ? (isRTL ? 'pe-12' : 'ps-12') : '',
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
    'transition-all duration-200'
  )

  const aceternityClasses = cn(
    inputBaseClasses,
    // Aceternity enhancements
    'bg-white dark:bg-zinc-800',
    'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)]',
    'focus:shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),_0px_1px_0px_0px_rgba(25,28,33,0.04),_0px_0px_0px_2px_rgba(var(--primary),0.3)]',
    isFocused && 'bg-gray-50 dark:bg-zinc-700'
  )

  return (
    <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Label */}
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

      {/* Input field with optional animation */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <motion.div
            className={cn(
              'absolute top-1/2 -translate-y-1/2',
              'text-gray-400',
              isRTL ? 'end-3' : 'start-3'
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {icon}
          </motion.div>
        )}

        {/* Input */}
        <input
          id={name}
          type={type}
          {...(register ? register(name) : {})}
          className={variant === 'aceternity' ? aceternityClasses : inputBaseClasses}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${name}-error` : helpText ? `${name}-help` : undefined
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            variant === 'aceternity' && placeholders.length > 0
              ? '' // Placeholder handled by animation
              : placeholder
          }
          {...rest}
        />

        {/* Rotating placeholder animation for aceternity variant */}
        {variant === 'aceternity' && placeholders.length > 0 && !rest.value && (
          <div className="absolute inset-0 flex items-center pointer-events-none px-4 sm:px-10">
            <AnimatePresence mode="wait">
              <motion.p
                key={`placeholder-${currentPlaceholder}`}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'linear' }}
                className={cn(
                  'text-gray-400 dark:text-zinc-500',
                  'text-sm sm:text-base',
                  'truncate w-full',
                  'text-start'
                )}
              >
                {placeholders[currentPlaceholder]}
              </motion.p>
            </AnimatePresence>
          </div>
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
