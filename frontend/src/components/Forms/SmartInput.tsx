/**
 * SmartInput Component
 * Optimized mobile keyboards based on field type with input masking
 * Mobile-first and RTL-compatible
 */

import { useTranslation } from 'react-i18next'
import {
  forwardRef,
  useCallback,
  useState,
  useId,
  useMemo,
  type InputHTMLAttributes,
  type ChangeEvent,
  type FocusEvent,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Phone, Mail, Globe, Calendar, Hash, CreditCard, DollarSign, Lock } from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

export type SmartInputType =
  | 'text'
  | 'email'
  | 'phone'
  | 'tel'
  | 'url'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'password'
  | 'search'
  | 'creditcard'
  | 'otp'

export interface InputMaskConfig {
  /** Pattern for display formatting (e.g., "(###) ###-####") */
  pattern?: string
  /** Character to use for unfilled positions */
  placeholder?: string
  /** Allowed characters regex */
  allowedChars?: RegExp
  /** Auto-format on blur */
  formatOnBlur?: boolean
  /** Prefix to display (e.g., "$", "+") */
  prefix?: string
  /** Suffix to display (e.g., "%", "kg") */
  suffix?: string
}

export interface SmartInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /** Smart input type - determines keyboard and masking */
  type?: SmartInputType
  /** Label for the input */
  label?: string
  /** Help text displayed below input */
  helpText?: string
  /** Error message */
  error?: string
  /** Show icon based on input type */
  showIcon?: boolean
  /** Custom input mask configuration */
  mask?: InputMaskConfig
  /** Country code for phone inputs */
  countryCode?: string
  /** Currency code for currency inputs */
  currencyCode?: string
  /** Number of OTP digits */
  otpLength?: number
  /** Callback when value changes */
  onChange?: (value: string, rawValue: string) => void
  /** Callback when input is blurred */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  /** Visual variant */
  variant?: 'default' | 'aceternity'
  /** Additional container classes */
  containerClassName?: string
}

// =============================================================================
// KEYBOARD & INPUT MODE MAPPINGS
// =============================================================================

/**
 * Maps smart input types to HTML input types and inputMode attributes
 * for optimal mobile keyboard experience
 */
const INPUT_TYPE_CONFIG: Record<
  SmartInputType,
  {
    htmlType: string
    inputMode: InputHTMLAttributes<HTMLInputElement>['inputMode']
    autoComplete?: string
    pattern?: string
  }
> = {
  text: {
    htmlType: 'text',
    inputMode: 'text',
  },
  email: {
    htmlType: 'email',
    inputMode: 'email',
    autoComplete: 'email',
  },
  phone: {
    htmlType: 'tel',
    inputMode: 'tel',
    autoComplete: 'tel',
  },
  tel: {
    htmlType: 'tel',
    inputMode: 'tel',
    autoComplete: 'tel',
  },
  url: {
    htmlType: 'url',
    inputMode: 'url',
    autoComplete: 'url',
  },
  number: {
    htmlType: 'text', // Use text to avoid browser number input issues
    inputMode: 'numeric',
    pattern: '[0-9]*',
  },
  currency: {
    htmlType: 'text',
    inputMode: 'decimal',
    pattern: '[0-9.]*',
  },
  date: {
    htmlType: 'date',
    inputMode: 'numeric',
  },
  time: {
    htmlType: 'time',
    inputMode: 'numeric',
  },
  'datetime-local': {
    htmlType: 'datetime-local',
    inputMode: 'numeric',
  },
  password: {
    htmlType: 'password',
    inputMode: 'text',
    autoComplete: 'current-password',
  },
  search: {
    htmlType: 'search',
    inputMode: 'search',
  },
  creditcard: {
    htmlType: 'text',
    inputMode: 'numeric',
    autoComplete: 'cc-number',
    pattern: '[0-9 ]*',
  },
  otp: {
    htmlType: 'text',
    inputMode: 'numeric',
    autoComplete: 'one-time-code',
    pattern: '[0-9]*',
  },
}

// =============================================================================
// DEFAULT MASKS
// =============================================================================

const DEFAULT_MASKS: Partial<Record<SmartInputType, InputMaskConfig>> = {
  phone: {
    pattern: '+# (###) ###-####',
    placeholder: '_',
    allowedChars: /[0-9]/,
    formatOnBlur: true,
  },
  creditcard: {
    pattern: '#### #### #### ####',
    placeholder: '_',
    allowedChars: /[0-9]/,
    formatOnBlur: true,
  },
  date: {
    pattern: '####-##-##',
    placeholder: '_',
    allowedChars: /[0-9]/,
    formatOnBlur: true,
  },
}

// =============================================================================
// ICONS
// =============================================================================

const TYPE_ICONS: Partial<Record<SmartInputType, React.ComponentType<{ className?: string }>>> = {
  email: Mail,
  phone: Phone,
  tel: Phone,
  url: Globe,
  date: Calendar,
  time: Calendar,
  'datetime-local': Calendar,
  number: Hash,
  currency: DollarSign,
  creditcard: CreditCard,
  password: Lock,
}

// =============================================================================
// MASKING UTILITIES
// =============================================================================

/**
 * Applies a mask pattern to a value
 */
function applyMask(value: string, mask: InputMaskConfig): string {
  if (!mask.pattern) return value

  const { pattern, placeholder = '_', allowedChars } = mask
  let result = ''
  let valueIndex = 0

  // Filter value to only allowed characters
  const cleanValue = allowedChars
    ? value
        .split('')
        .filter((char) => allowedChars.test(char))
        .join('')
    : value

  for (let i = 0; i < pattern.length && valueIndex < cleanValue.length; i++) {
    const patternChar = pattern[i]

    if (patternChar === '#') {
      result += cleanValue[valueIndex] || placeholder
      valueIndex++
    } else {
      result += patternChar
      // Skip if user typed the separator
      if (cleanValue[valueIndex] === patternChar) {
        valueIndex++
      }
    }
  }

  return result
}

/**
 * Removes mask formatting to get raw value
 */
function removeMask(value: string, mask: InputMaskConfig): string {
  if (!mask.allowedChars) return value
  return value
    .split('')
    .filter((char) => mask.allowedChars!.test(char))
    .join('')
}

/**
 * Formats phone number with international format
 */
function formatPhoneNumber(value: string, countryCode?: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 0) return ''

  // Handle different phone number lengths
  if (digits.length <= 3) {
    return digits
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  } else {
    // International format
    const prefix = countryCode || '+' + digits.slice(0, digits.length - 10)
    const rest = digits.slice(-10)
    return `${prefix} (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`
  }
}

/**
 * Formats credit card number with spaces
 */
function formatCreditCard(value: string): string {
  const digits = value.replace(/\D/g, '')
  const groups = digits.match(/.{1,4}/g)
  return groups ? groups.join(' ') : digits
}

/**
 * Formats currency with proper decimal handling
 */
function formatCurrency(value: string, currencyCode?: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')

  // Only allow one decimal point
  if (parts.length > 2) {
    return formatCurrency(parts[0] + '.' + parts.slice(1).join(''), currencyCode)
  }

  // Format with thousand separators
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const decPart = parts[1] ? '.' + parts[1].slice(0, 2) : ''

  const formatted = intPart + decPart
  return currencyCode ? `${currencyCode} ${formatted}` : formatted
}

// =============================================================================
// COMPONENT
// =============================================================================

export const SmartInput = forwardRef<HTMLInputElement, SmartInputProps>(
  (
    {
      type = 'text',
      label,
      helpText,
      error,
      showIcon = true,
      mask,
      countryCode,
      currencyCode,
      otpLength = 6,
      onChange,
      onBlur,
      variant = 'default',
      containerClassName,
      className,
      disabled,
      required,
      placeholder,
      value: controlledValue,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const { t, i18n } = useTranslation(['validation', 'common'])
    const isRTL = i18n.language === 'ar'
    const uniqueId = useId()

    // Local state for uncontrolled usage
    const [internalValue, setInternalValue] = useState<string>((defaultValue as string) || '')
    const [isFocused, setIsFocused] = useState(false)

    // Determine if controlled or uncontrolled
    const isControlled = controlledValue !== undefined
    const displayValue = isControlled ? (controlledValue as string) : internalValue

    // Get input configuration
    const inputConfig = INPUT_TYPE_CONFIG[type]
    const activeMask = mask || DEFAULT_MASKS[type]
    const Icon = showIcon ? TYPE_ICONS[type] : null

    // Generate IDs for accessibility
    const inputId = props.id || `smart-input-${uniqueId}`
    const errorId = `${inputId}-error`
    const helpId = `${inputId}-help`

    // Format value based on type
    const formattedValue = useMemo(() => {
      if (!displayValue) return ''

      switch (type) {
        case 'phone':
        case 'tel':
          return formatPhoneNumber(displayValue, countryCode)
        case 'creditcard':
          return formatCreditCard(displayValue)
        case 'currency':
          return formatCurrency(displayValue, currencyCode)
        default:
          if (activeMask) {
            return applyMask(displayValue, activeMask)
          }
          return displayValue
      }
    }, [displayValue, type, countryCode, currencyCode, activeMask])

    // Handle value change
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value
        let rawValue = newValue

        // Apply mask if configured
        if (activeMask) {
          rawValue = removeMask(newValue, activeMask)
        } else {
          // Extract raw digits for phone/creditcard
          if (type === 'phone' || type === 'tel') {
            rawValue = newValue.replace(/\D/g, '')
          } else if (type === 'creditcard') {
            rawValue = newValue.replace(/\D/g, '')
          } else if (type === 'currency') {
            rawValue = newValue.replace(/[^0-9.]/g, '')
          } else if (type === 'number' || type === 'otp') {
            rawValue = newValue.replace(/\D/g, '')
            // Limit OTP length
            if (type === 'otp' && rawValue.length > otpLength) {
              rawValue = rawValue.slice(0, otpLength)
            }
          }
        }

        if (!isControlled) {
          setInternalValue(rawValue)
        }

        onChange?.(newValue, rawValue)
      },
      [activeMask, type, otpLength, isControlled, onChange],
    )

    // Handle blur with optional formatting
    const handleBlur = useCallback(
      (e: FocusEvent<HTMLInputElement>) => {
        setIsFocused(false)

        // Auto-format on blur if configured
        if (activeMask?.formatOnBlur && displayValue) {
          const formatted = applyMask(displayValue, activeMask)
          if (!isControlled) {
            setInternalValue(displayValue)
          }
          // Trigger change with formatted value
          onChange?.(formatted, displayValue)
        }

        onBlur?.(e)
      },
      [activeMask, displayValue, isControlled, onChange, onBlur],
    )

    // Handle focus
    const handleFocus = useCallback(() => {
      setIsFocused(true)
    }, [])

    // Build aria-describedby
    const describedBy = [error ? errorId : null, helpText ? helpId : null].filter(Boolean).join(' ')

    // Base input classes
    const inputBaseClasses = cn(
      // Base styles
      'w-full px-4 py-2',
      // Mobile-first touch targets
      'min-h-11 sm:min-h-10 md:min-h-12',
      // Responsive text
      'text-sm sm:text-base',
      // RTL-safe spacing with icons
      Icon && (isRTL ? 'pe-4 ps-12' : 'ps-12 pe-4'),
      !Icon && 'px-4',
      // Borders and colors
      error
        ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
        : 'border-input dark:border-gray-600 focus:ring-primary-500',
      'border rounded-lg',
      // Focus states
      'focus:ring-2 focus:border-transparent focus:outline-none',
      // Dark mode
      'bg-white dark:bg-gray-700 dark:text-white',
      // Disabled state
      'disabled:opacity-50 disabled:cursor-not-allowed',
      // Transitions
      'transition-all duration-200',
      // Touch manipulation for better mobile UX
      'touch-manipulation',
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

    // OTP specific styles
    const otpClasses =
      type === 'otp'
        ? cn('text-center tracking-[0.5em] font-mono text-lg', 'placeholder:tracking-normal')
        : ''

    return (
      <div className={cn('space-y-2', containerClassName)} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Label */}
        {label && (
          <motion.label
            htmlFor={inputId}
            className={cn(
              'block font-medium text-start',
              'text-sm sm:text-base',
              'text-gray-700 dark:text-gray-300',
              error && 'text-red-700 dark:text-red-400',
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
        )}

        {/* Input container */}
        <div className="relative">
          {/* Leading icon */}
          {Icon && (
            <motion.div
              className={cn(
                'absolute top-1/2 -translate-y-1/2',
                'text-gray-400 dark:text-gray-500',
                'pointer-events-none',
                isRTL ? 'end-3' : 'start-3',
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={inputConfig.htmlType}
            inputMode={inputConfig.inputMode}
            autoComplete={inputConfig.autoComplete}
            pattern={inputConfig.pattern}
            value={formattedValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={describedBy || undefined}
            aria-required={required}
            className={cn(inputClasses, otpClasses, className)}
            {...props}
          />
        </div>

        {/* Help text */}
        <AnimatePresence mode="wait">
          {helpText && !error && (
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

          {/* Error message */}
          {error && (
            <motion.p
              id={errorId}
              key="error"
              className="text-sm text-red-600 dark:text-red-400 text-start"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              role="alert"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  },
)

SmartInput.displayName = 'SmartInput'

export default SmartInput
