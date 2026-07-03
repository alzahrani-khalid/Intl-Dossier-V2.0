/**
 * Forms Components
 * Export all form-related components from this barrel file
 *
 * This module provides a comprehensive set of form components that reduce
 * data entry friction through:
 * - Consistent patterns for common form scenarios
 * - Built-in validation and error handling
 * - Mobile-first, RTL-compatible design
 * - Auto-save and draft management
 */

// Base form components
export { FormInput } from './FormInput'
export { FormSelect } from './FormSelect'

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

// Searchable select for large option lists
export {
  SearchableSelect,
  type SearchableSelectProps,
  type SelectOption,
  type OptionGroup,
} from './SearchableSelect'

// Array field management (emails, phones, etc.)
export {
  ArrayFieldManager,
  EmailArrayField,
  PhoneArrayField,
  UrlArrayField,
  type ArrayFieldManagerProps,
  type ArrayFieldItem,
} from './ArrayFieldManager'

// Unified file upload
export {
  UnifiedFileUpload,
  DocumentUpload,
  ImageUpload,
  EvidenceUpload,
  SingleFileUpload,
  type UnifiedFileUploadProps,
  type UploadedFile,
  type FileUploadConfig,
} from './UnifiedFileUpload'

// Form layout and sections
export { FormSection, FormSections, FieldRow, useFormSection } from './FormSection'

// Error display
export {
  InlineError,
  ErrorWithSuggestion,
  ErrorSummary,
  FieldErrorList,
  ToastError,
  type FormError,
  type ErrorSeverity,
} from './FormErrorDisplay'

// Auto-save wrapper
export { AutoSaveFormWrapper, useAutoSaveFormContext } from './AutoSaveFormWrapper'

// Progress and completion
export { FormCompletionProgress } from './FormCompletionProgress'
export { FormFieldGroup } from './FormFieldGroup'
export { ProgressiveFormField } from './ProgressiveFormField'
