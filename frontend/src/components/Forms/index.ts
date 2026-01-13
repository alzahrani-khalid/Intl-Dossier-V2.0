/**
 * Forms Components
 * Export all form-related components from this barrel file
 */

// Base form components
export { FormInput } from './FormInput'
export { FormSelect } from './FormSelect'

// Aceternity-styled components
export { FormInputAceternity } from './FormInputAceternity'
export { FormSelectAceternity } from './FormSelectAceternity'
export { FormTextareaAceternity } from './FormTextareaAceternity'
export { FormCheckboxAceternity } from './FormCheckboxAceternity'
export { FormRadioAceternity } from './FormRadioAceternity'

// Real-time validation components
export {
  FormFieldWithValidation,
  type FormFieldWithValidationProps,
} from './FormFieldWithValidation'

// Validation indicators
export {
  ValidationIcon,
  ValidationMessage,
  ValidationHint,
  CharacterCount,
  PasswordStrength,
  ValidationSummary,
  type ValidationIconProps,
  type ValidationMessageProps,
  type ValidationHintProps,
  type CharacterCountProps,
  type PasswordStrengthProps,
  type ValidationSummaryProps,
} from './ValidationIndicator'

// Contextual help components
export {
  ContextualHelp,
  FieldLabelWithHelp,
  type ContextualHelpProps,
  type FieldLabelWithHelpProps,
  type HelpExample,
  type HelpLink,
} from './ContextualHelp'

// Smart input with optimized mobile keyboards and input masking
export {
  SmartInput,
  type SmartInputProps,
  type SmartInputType,
  type InputMaskConfig,
} from './SmartInput'

// Searchable select for large option lists
export {
  SearchableSelect,
  type SearchableSelectProps,
  type SelectOption,
  type OptionGroup,
} from './SearchableSelect'
