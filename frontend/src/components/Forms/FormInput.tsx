import { useTranslation } from 'react-i18next'
import type { UseFormRegister, FieldError } from 'react-hook-form'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 label: string
 name: string
 register?: UseFormRegister<any>
 error?: FieldError
 required?: boolean
 helpText?: string
 icon?: React.ReactNode
}

export function FormInput({
 label,
 name,
 register,
 error,
 required = false,
 helpText,
 icon,
 type = 'text',
 ...rest
}: FormInputProps) {
 const { t, i18n } = useTranslation()
 const isRTL = i18n.dir() === 'rtl'

 return (
 <div className="space-y-1">
 {/* Label */}
 <label
 htmlFor={name}
 className="block text-sm font-medium text-foreground"
 >
 {label}
 {required && (
 <span className="text-destructive ms-1" aria-label={t('validation.required')}>
 *
 </span>
 )}
 </label>

 {/* Input field */}
 <div className="relative">
 {icon && (
 <div className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-1/2 -translate-y-1/2 text-muted-foreground`}>
 {icon}
 </div>
 )}
 <input
 id={name}
 type={type}
 {...(register ? register(name) : {})}
 className={`
 w-full px-4 py-2
 ${icon ? (isRTL ? 'pe-12' : 'ps-12') : ''}
 border ${error ? 'border-destructive' : 'border-input'}
 rounded-lg
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
 bg-transparent
 disabled:opacity-50 disabled:cursor-not-allowed
 transition-colors
 `}
 aria-invalid={!!error}
 aria-describedby={
 error ? `${name}-error` : helpText ? `${name}-help` : undefined
 }
 {...rest}
 />
 </div>

 {/* Help text */}
 {helpText && !error && (
 <p id={`${name}-help`} className="text-sm text-muted-foreground">
 {helpText}
 </p>
 )}

 {/* Error message */}
 {error && (
 <p id={`${name}-error`} className="text-sm text-destructive">
 {t(error.message || 'validation.required')}
 </p>
 )}
 </div>
 )
}