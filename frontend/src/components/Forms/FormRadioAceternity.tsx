import { useTranslation } from 'react-i18next'
import type { UseFormRegister, FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface RadioOption {
  value: string
  label: string
  description?: string
}

interface FormRadioAceternityProps {
  label: string
  name: string
  options: RadioOption[]
  register?: UseFormRegister<any>
  error?: FieldError
  required?: boolean
  helpText?: string
  variant?: 'default' | 'aceternity' // aceternity = enhanced styling with animations
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  layout?: 'vertical' | 'horizontal' // Layout direction for options
}

export function FormRadioAceternity({
  label,
  name,
  options,
  register,
  error,
  required = false,
  helpText,
  variant = 'default',
  value,
  onValueChange,
  disabled = false,
  layout = 'vertical',
}: FormRadioAceternityProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const radioGroupClasses = cn(
    // Base layout
    layout === 'vertical' ? 'flex flex-col' : 'flex flex-wrap',
    layout === 'vertical' ? 'gap-3 sm:gap-4' : 'gap-4 sm:gap-6',
    // RTL support
    isRTL && layout === 'horizontal' && 'flex-row-reverse'
  )

  const radioItemContainerClasses = cn(
    // Base flex layout
    'flex items-start gap-3',
    // Mobile-first spacing
    'py-2 px-3 rounded-lg',
    // Transitions
    'transition-all duration-200',
    // RTL direction
    isRTL && 'flex-row-reverse',
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed'
  )

  const aceternityRadioItemClasses = (optionValue: string) => cn(
    radioItemContainerClasses,
    // Aceternity enhancements
    'border border-gray-200 dark:border-gray-700',
    'hover:bg-gray-50 dark:hover:bg-zinc-800',
    hoveredOption === optionValue && 'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1)]',
    value === optionValue && 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
  )

  return (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Group label */}
      <motion.label
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

      {/* Radio group */}
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        className={radioGroupClasses}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${name}-error` : helpText ? `${name}-help` : undefined
        }
        {...(register ? register(name) : {})}
      >
        {options.map((option, index) => (
          <motion.div
            key={option.value}
            className={
              variant === 'aceternity'
                ? aceternityRadioItemClasses(option.value)
                : radioItemContainerClasses
            }
            initial={variant === 'aceternity' ? { opacity: 0, x: isRTL ? 10 : -10 } : undefined}
            animate={variant === 'aceternity' ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            onMouseEnter={() => setHoveredOption(option.value)}
            onMouseLeave={() => setHoveredOption(null)}
          >
            {/* Radio button */}
            <RadioGroupItem
              value={option.value}
              id={`${name}-${option.value}`}
              className={cn(
                'mt-0.5',
                variant === 'aceternity' && 'h-5 w-5 sm:h-4 sm:w-4'
              )}
            />

            {/* Label and description */}
            <div className="flex-1">
              <Label
                htmlFor={`${name}-${option.value}`}
                className={cn(
                  'cursor-pointer text-start',
                  'text-sm sm:text-base',
                  'text-gray-700 dark:text-gray-300',
                  disabled && 'cursor-not-allowed'
                )}
              >
                {option.label}
              </Label>
              {option.description && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 text-start">
                  {option.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </RadioGroup>

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
