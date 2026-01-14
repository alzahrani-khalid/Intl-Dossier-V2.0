/**
 * Actionable Error Types
 * Types for errors that provide specific guidance and one-click fixes
 */

import type { ValidationSeverity } from '@/lib/validation-rules'

// =============================================================================
// ACTION TYPES
// =============================================================================

/**
 * Types of automatic corrections that can be applied
 */
export type ErrorActionType =
  | 'auto_fix' // Automatic value correction (e.g., add https://)
  | 'suggest_value' // Suggest a specific value to use
  | 'focus_field' // Focus on the problematic field
  | 'copy_correct' // Copy a corrected value to clipboard
  | 'open_modal' // Open a modal for more complex fixes
  | 'navigate' // Navigate to a specific page
  | 'retry' // Retry the operation
  | 'contact_support' // Link to support
  | 'dismiss' // Allow dismissing the error

/**
 * A single action that can fix or help resolve an error
 */
export interface ErrorAction {
  /** Unique identifier for this action */
  id: string
  /** Type of action to perform */
  type: ErrorActionType
  /** i18n key for the button label */
  labelKey: string
  /** Optional i18n key for tooltip */
  tooltipKey?: string
  /** Icon name from lucide-react */
  icon?: string
  /** The corrected value (for auto_fix and suggest_value) */
  value?: string
  /** Field name to focus (for focus_field) */
  fieldName?: string
  /** URL to navigate to (for navigate) */
  url?: string
  /** Whether this is the primary/recommended action */
  primary?: boolean
  /** Whether to show this action on mobile */
  showOnMobile?: boolean
}

// =============================================================================
// ACTIONABLE ERROR
// =============================================================================

/**
 * Extended error with specific guidance and fix actions
 */
export interface ActionableError {
  /** Unique error code for tracking */
  code: string
  /** Severity level */
  severity: ValidationSeverity
  /** i18n key for the error title */
  titleKey: string
  /** i18n key for the detailed message */
  messageKey: string
  /** Interpolation parameters for the message */
  params?: Record<string, string | number>
  /** Field name this error relates to */
  fieldName?: string
  /** List of specific actions to fix this error */
  actions: ErrorAction[]
  /** Whether the error can be dismissed */
  dismissible?: boolean
  /** Optional metadata for analytics */
  metadata?: Record<string, unknown>
}

/**
 * Error context for generating contextual errors
 */
export interface ErrorContext {
  /** The current field value */
  value: string
  /** The field type (email, url, phone, etc.) */
  fieldType: string
  /** The field name for display and focus */
  fieldName: string
  /** Original validation config */
  validationConfig?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  }
}

// =============================================================================
// API ERROR TYPES
// =============================================================================

/**
 * Structured API error response
 */
export interface ApiActionableError {
  /** HTTP status code */
  status: number
  /** Error code for categorization */
  code: string
  /** Human-readable message */
  message: string
  /** Detailed errors per field */
  fieldErrors?: Record<
    string,
    {
      message: string
      suggestion?: string
      autoFix?: string
    }
  >
  /** Suggested retry delay in ms */
  retryAfter?: number
  /** Whether the error is recoverable */
  recoverable?: boolean
}

// =============================================================================
// FIELD HIGHLIGHT
// =============================================================================

/**
 * Field highlight state for visual error indication
 */
export interface FieldHighlight {
  /** Field name to highlight */
  fieldName: string
  /** Highlight severity/color */
  severity: ValidationSeverity
  /** Animation type */
  animation?: 'pulse' | 'shake' | 'glow' | 'none'
  /** Duration in ms */
  duration?: number
}

// =============================================================================
// ERROR REGISTRY
// =============================================================================

/**
 * Registry of error codes to actionable error generators
 */
export type ErrorRegistry = Record<string, (context: ErrorContext) => ActionableError>

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

/**
 * Return type for useActionableErrors hook
 */
export interface UseActionableErrorsReturn {
  /** Current actionable errors */
  errors: ActionableError[]
  /** Fields currently highlighted */
  highlightedFields: FieldHighlight[]
  /** Add an error to the list */
  addError: (error: ActionableError) => void
  /** Remove an error by code */
  removeError: (code: string) => void
  /** Clear all errors */
  clearErrors: () => void
  /** Execute an error action */
  executeAction: (
    errorCode: string,
    action: ErrorAction,
    onValueChange?: (fieldName: string, value: string) => void,
  ) => void
  /** Highlight a field */
  highlightField: (highlight: FieldHighlight) => void
  /** Clear field highlights */
  clearHighlights: () => void
  /** Focus on a specific field */
  focusField: (fieldName: string) => void
  /** Generate actionable error from validation result */
  fromValidation: (fieldName: string, fieldType: string, value: string) => ActionableError | null
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for ActionableErrorMessage component
 */
export interface ActionableErrorMessageProps {
  /** The actionable error to display */
  error: ActionableError
  /** Callback when an action is clicked */
  onAction?: (action: ErrorAction) => void
  /** Callback when error is dismissed */
  onDismiss?: () => void
  /** Whether to show in compact mode */
  compact?: boolean
  /** Additional className */
  className?: string
}

/**
 * Props for ActionableErrorSummary component
 */
export interface ActionableErrorSummaryProps {
  /** List of actionable errors */
  errors: ActionableError[]
  /** Callback when an action is clicked */
  onAction?: (errorCode: string, action: ErrorAction) => void
  /** Callback to focus a field */
  onFieldFocus?: (fieldName: string) => void
  /** Callback to fix all errors */
  onFixAll?: () => void
  /** Maximum errors to show initially */
  maxVisible?: number
  /** Additional className */
  className?: string
}

/**
 * Props for FieldErrorHighlight component
 */
export interface FieldErrorHighlightProps {
  /** Whether the field has an error */
  hasError: boolean
  /** The error severity */
  severity?: ValidationSeverity
  /** Animation type */
  animation?: FieldHighlight['animation']
  /** Children to wrap */
  children: React.ReactNode
  /** Additional className */
  className?: string
}
