import { useTranslation } from 'react-i18next'
import type { UseFormRegister, FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { m, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useDirection } from '@/hooks/useDirection'

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
  const { t } = useTranslation()
  const { isRTL } = useDirection()
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
  )

  const aceternityClasses = cn(
    selectBaseClasses,
    // Aceternity enhancements
    'bg-white dark:bg-muted',
    'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)]',
    'focus:shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),_0px_1px_0px_0px_rgba(25,28,33,0.04),_0px_0px_0px_2px_rgba(var(--primary),0.3)]',
    isFocused && 'bg-muted dark:bg-muted',
  )

  return (
    <div className="space-y-2">
      {/* Label */}
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

      {/* Select field */}
      <div className="relative">
        <select
          id={name}
          {...(register ? register(name) : {})}
          className={variant === 'aceternity' ? aceternityClasses : selectBaseClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
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
        <m.div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 pointer-events-none',
            isRTL ? 'start-3' : 'end-3',
          )}
          animate={{
            rotate: isFocused ? 180 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground',
              isRTL && 'rotate-180', // Additional flip for RTL
            )}
          />
        </m.div>
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
