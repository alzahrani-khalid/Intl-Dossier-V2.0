import { useTranslation } from 'react-i18next'
import type { UseFormRegister, FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FormSelectAceternityProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  name: string
  options: { value: string; label: string }[]
  register?: UseFormRegister<any>
  error?: FieldError
  required?: boolean
  helpText?: string
  placeholder?: string
  variant?: 'default' | 'aceternity' // aceternity = enhanced styling with animations
}

export function FormSelectAceternity({
  label,
  name,
  options,
  register,
  error,
  required = false,
  helpText,
  placeholder,
  variant = 'default',
  ...rest
}: FormSelectAceternityProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [isFocused, setIsFocused] = useState(false)

  const selectBaseClasses = cn(
    // Base styles
    'w-full px-4 py-2 pe-10',
    // Mobile-first touch targets
    'min-h-11 sm:min-h-10 md:min-h-12',
    // Responsive text
    'text-sm sm:text-base',
    // Remove default appearance
    'appearance-none',
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
    selectBaseClasses,
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

      {/* Select field */}
      <div className="relative">
        <select
          id={name}
          {...(register ? register(name) : {})}
          className={variant === 'aceternity' ? aceternityClasses : selectBaseClasses}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${name}-error` : helpText ? `${name}-help` : undefined
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <motion.div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 pointer-events-none',
            isRTL ? 'start-3' : 'end-3'
          )}
          animate={{
            rotate: isFocused ? 180 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400',
              isRTL && 'rotate-180' // Additional flip for RTL
            )}
          />
        </motion.div>
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
