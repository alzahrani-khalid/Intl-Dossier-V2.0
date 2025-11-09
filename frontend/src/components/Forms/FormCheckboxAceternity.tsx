import { useTranslation } from 'react-i18next'
import type { UseFormRegister, FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'

interface FormCheckboxAceternityProps {
  label: string
  name: string
  register?: UseFormRegister<any>
  error?: FieldError
  required?: boolean
  helpText?: string
  variant?: 'default' | 'aceternity' // aceternity = enhanced styling with animations
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

export function FormCheckboxAceternity({
  label,
  name,
  register,
  error,
  required = false,
  helpText,
  variant = 'default',
  checked,
  onCheckedChange,
  disabled = false,
}: FormCheckboxAceternityProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const containerClasses = cn(
    // Base flex layout
    'flex items-start gap-3',
    // Mobile-first spacing
    'py-2',
    // RTL direction
    isRTL && 'flex-row-reverse',
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed'
  )

  const labelClasses = cn(
    // Base styles
    'text-start cursor-pointer select-none',
    // Responsive text
    'text-sm sm:text-base',
    // Color
    'text-gray-700 dark:text-gray-300',
    // Disabled state
    disabled && 'cursor-not-allowed'
  )

  const aceternityCheckboxClasses = cn(
    // Enhanced sizing for better touch
    'h-5 w-5 sm:h-4 sm:w-4',
    // Aceternity shadows
    'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1)]',
    // Enhanced transitions
    'transition-all duration-200',
    // Hover and focus states
    isHovered && 'scale-110',
    isFocused && 'ring-2 ring-primary-500/30'
  )

  return (
    <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Checkbox and label */}
      <motion.div
        className={containerClasses}
        initial={variant === 'aceternity' ? { opacity: 0, x: isRTL ? 10 : -10 } : undefined}
        animate={variant === 'aceternity' ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.2 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Checkbox */}
        <Checkbox
          id={name}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={variant === 'aceternity' ? aceternityCheckboxClasses : 'h-4 w-4'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${name}-error` : helpText ? `${name}-help` : undefined
          }
          {...(register ? register(name) : {})}
        />

        {/* Label */}
        <label htmlFor={name} className={labelClasses}>
          {label}
          {required && (
            <span className="text-red-500 ms-1" aria-label={t('validation.required')}>
              *
            </span>
          )}
        </label>
      </motion.div>

      {/* Help text */}
      {helpText && !error && (
        <motion.p
          id={`${name}-help`}
          className={cn(
            'text-sm text-gray-600 dark:text-gray-400 text-start',
            isRTL ? 'me-8' : 'ms-8' // Indent to align with checkbox
          )}
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
            className={cn(
              'text-sm text-red-600 dark:text-red-400 text-start',
              isRTL ? 'me-8' : 'ms-8' // Indent to align with checkbox
            )}
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
