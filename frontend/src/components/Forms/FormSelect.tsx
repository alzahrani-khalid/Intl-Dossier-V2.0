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
 <label
 htmlFor={name}
 className="block text-sm font-medium text-gray-700 dark:text-gray-300"
 >
 {label}
 {required && (
 <span className="text-red-500 ms-1" aria-label={t('validation.required')}>
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
 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
 rounded-lg
 focus:ring-2 focus:ring-primary-500 focus:border-transparent
 dark:bg-gray-700 dark:text-white
 disabled:opacity-50 disabled:cursor-not-allowed
 transition-colors
 `}
 aria-invalid={!!error}
 aria-describedby={
 error ? `${name}-error` : helpText ? `${name}-help` : undefined
 }
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
 className={`absolute ${isRTL ? 'start-3' : 'end-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none`}
 />
 </div>

 {/* Help text */}
 {helpText && !error && (
 <p id={`${name}-help`} className="text-sm text-gray-600 dark:text-gray-400">
 {helpText}
 </p>
 )}

 {/* Error message */}
 {error && (
 <p id={`${name}-error`} className="text-sm text-red-600 dark:text-red-400">
 {t(error.message || 'validation.required')}
 </p>
 )}
 </div>
 )
}