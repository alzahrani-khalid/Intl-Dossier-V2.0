import { useTranslation } from 'react-i18next'
import type { UseFormRegister, FieldError } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  name: string
  options: { value: string; label: string }[]
  register?: UseFormRegister<any>
  error?: FieldError
  required?: boolean
  helpText?: string
  placeholder?: string
}

export function FormSelect({
  label,
  name,
  options,
  register,
  error,
  required = false,
  helpText,
  placeholder,
  ...rest
}: FormSelectProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  return (
    <div className="space-y-1">
      {/* Label */}
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="text-danger ms-1" aria-label={t('validation.required')}>
            *
          </span>
        )}
      </label>

      {/* Select field */}
      <div className="relative">
        <select
          id={name}
          {...(register ? register(name) : {})}
          className={`
            w-full px-4 py-2 pe-10
            appearance-none
            border ${error ? 'border-danger' : 'border-line'}
            rounded-lg
            focus:ring-2 focus:ring-primary focus:border-transparent
            bg-background text-ink
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
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
        <ChevronDown
          className={`absolute ${isRTL ? 'start-3' : 'end-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint pointer-events-none`}
        />
      </div>

      {/* Help text */}
      {helpText && !error && (
        <p id={`${name}-help`} className="text-sm text-ink-mute">
          {helpText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p id={`${name}-error`} className="text-sm text-danger">
          {t(error.message || 'validation.required')}
        </p>
      )}
    </div>
  )
}
