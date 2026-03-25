/**
 * HeroUI Form Components
 *
 * Provides HeroUI v3 form components with convenient wrappers.
 * Mobile-first, RTL-compatible, with proper touch targets.
 *
 * Usage:
 * - For new forms, use these HeroUI components
 * - For migration, gradually replace shadcn imports
 */
import {
  TextField as HeroUITextField,
  Input as HeroUIInput,
  TextArea as HeroUITextArea,
  Label as HeroUILabel,
  Description as HeroUIDescription,
  FieldError as HeroUIFieldError,
  Select as HeroUISelect,
  Checkbox as HeroUICheckbox,
  Switch as HeroUISwitch,
} from '@heroui/react'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'

// ============================================================================
// HeroUITextField - Full form field with label, input, description, error
// ============================================================================
export interface HeroUITextFieldProps {
  /** Field name for form submission */
  name: string
  /** Field label */
  label: string
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  /** Placeholder text */
  placeholder?: string
  /** Helper description */
  description?: string
  /** Error message */
  error?: string
  /** Controlled value */
  value?: string
  /** Default value for uncontrolled */
  defaultValue?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Whether field is required */
  isRequired?: boolean
  /** Whether field is disabled */
  isDisabled?: boolean
  /** Whether field is read-only */
  isReadOnly?: boolean
  /** Additional class names */
  className?: string
  /** Input class names */
  inputClassName?: string
}

export function HeroUIFormTextField({
  name,
  label,
  type = 'text',
  placeholder,
  description,
  error,
  value,
  defaultValue,
  onChange,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  className,
  inputClassName,
}: HeroUITextFieldProps) {
const { isRTL } = useDirection()
return (
    <HeroUITextField
      name={name}
      type={type}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isInvalid={!!error}
      className={cn('w-full', className)}
    >
      <HeroUILabel className={cn(isRTL && 'text-right')}>{label}</HeroUILabel>
      <HeroUIInput
        placeholder={placeholder}
        className={cn(
          // Mobile-first touch targets
          'min-h-11 sm:min-h-10',
          // RTL support
          isRTL && 'text-right',
          inputClassName,
        )}
      />
      {error ? (
        <HeroUIFieldError>{error}</HeroUIFieldError>
      ) : description ? (
        <HeroUIDescription className={cn(isRTL && 'text-right')}>{description}</HeroUIDescription>
      ) : null}
    </HeroUITextField>
  )
}

// ============================================================================
// HeroUITextAreaField - Multiline text field
// ============================================================================
export interface HeroUITextAreaFieldProps extends Omit<HeroUITextFieldProps, 'type'> {
  /** Number of visible rows */
  rows?: number
}

export function HeroUIFormTextArea({
  name,
  label,
  placeholder,
  description,
  error,
  value,
  defaultValue,
  onChange,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  className,
  inputClassName,
  rows = 4,
}: HeroUITextAreaFieldProps) {
const { isRTL } = useDirection()

  return (
    <HeroUITextField
      name={name}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isInvalid={!!error}
      className={cn('w-full', className)}
    >
      <HeroUILabel className={cn(isRTL && 'text-right')}>{label}</HeroUILabel>
      <HeroUITextArea
        placeholder={placeholder}
        rows={rows}
        className={cn(
          // Mobile-first
          'min-h-[100px]',
          // RTL support
          isRTL && 'text-right',
          inputClassName,
        )}
      />
      {error ? (
        <HeroUIFieldError>{error}</HeroUIFieldError>
      ) : description ? (
        <HeroUIDescription className={cn(isRTL && 'text-right')}>{description}</HeroUIDescription>
      ) : null}
    </HeroUITextField>
  )
}

// ============================================================================
// HeroUICheckboxField - Checkbox with label
// ============================================================================
export interface HeroUICheckboxFieldProps {
  /** Field name for form submission */
  name: string
  /** Checkbox label */
  label: string
  /** Description text */
  description?: string
  /** Controlled checked state */
  isSelected?: boolean
  /** Default checked state */
  defaultSelected?: boolean
  /** Change handler */
  onChange?: (isSelected: boolean) => void
  /** Whether checkbox is required */
  isRequired?: boolean
  /** Whether checkbox is disabled */
  isDisabled?: boolean
  /** Whether checkbox is in indeterminate state */
  isIndeterminate?: boolean
  /** Additional class names */
  className?: string
}

export function HeroUIFormCheckbox({
  name,
  label,
  description,
  isSelected,
  defaultSelected,
  onChange,
  isRequired = false,
  isDisabled = false,
  isIndeterminate = false,
  className,
}: HeroUICheckboxFieldProps) {
const { isRTL } = useDirection()

  return (
    <HeroUICheckbox
      name={name}
      isSelected={isSelected}
      defaultSelected={defaultSelected}
      onChange={onChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isIndeterminate={isIndeterminate}
      className={cn(
        'flex items-start gap-3',
        // Mobile-first touch targets
        'min-h-11 sm:min-h-10',
        // RTL support
        isRTL && 'flex-row-reverse',
        className,
      )}
    >
      <HeroUICheckbox.Control className="mt-0.5">
        <HeroUICheckbox.Indicator />
      </HeroUICheckbox.Control>
      <div className={cn('flex flex-col', isRTL && 'text-right')}>
        <HeroUILabel>{label}</HeroUILabel>
        {description && <HeroUIDescription className="text-xs">{description}</HeroUIDescription>}
      </div>
    </HeroUICheckbox>
  )
}

// ============================================================================
// HeroUISwitchField - Toggle switch with label
// ============================================================================
export interface HeroUISwitchFieldProps {
  /** Field name for form submission */
  name: string
  /** Switch label */
  label: string
  /** Description text */
  description?: string
  /** Controlled selected state */
  isSelected?: boolean
  /** Default selected state */
  defaultSelected?: boolean
  /** Change handler */
  onChange?: (isSelected: boolean) => void
  /** Whether switch is disabled */
  isDisabled?: boolean
  /** Additional class names */
  className?: string
}

export function HeroUIFormSwitch({
  name,
  label,
  description,
  isSelected,
  defaultSelected,
  onChange,
  isDisabled = false,
  className,
}: HeroUISwitchFieldProps) {
const { isRTL } = useDirection()

  return (
    <HeroUISwitch
      name={name}
      isSelected={isSelected}
      defaultSelected={defaultSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      className={cn(
        'flex items-center justify-between gap-3',
        // Mobile-first touch targets
        'min-h-11 sm:min-h-10',
        // RTL support
        isRTL && 'flex-row-reverse',
        className,
      )}
    >
      <div className={cn('flex flex-col', isRTL && 'text-right items-end')}>
        <HeroUILabel>{label}</HeroUILabel>
        {description && <HeroUIDescription className="text-xs">{description}</HeroUIDescription>}
      </div>
      <HeroUISwitch.Control>
        <HeroUISwitch.Thumb />
      </HeroUISwitch.Control>
    </HeroUISwitch>
  )
}

// ============================================================================
// Re-exports for direct usage
// ============================================================================

// Primitives
export {
  HeroUITextField,
  HeroUIInput,
  HeroUITextArea,
  HeroUILabel,
  HeroUIDescription,
  HeroUIFieldError,
  HeroUISelect,
  HeroUICheckbox,
  HeroUISwitch,
}

// Type exports
export type { HeroUITextFieldProps as TextFieldProps }
export type { HeroUITextAreaFieldProps as TextAreaFieldProps }
export type { HeroUICheckboxFieldProps as CheckboxFieldProps }
export type { HeroUISwitchFieldProps as SwitchFieldProps }
