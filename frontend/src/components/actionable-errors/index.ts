/**
 * Actionable Errors Components
 * Export all components for actionable error handling
 */

export { ActionableErrorMessage } from './ActionableErrorMessage'
export { ActionableErrorSummary } from './ActionableErrorSummary'
export { FieldErrorHighlight } from './FieldErrorHighlight'

// Re-export types for convenience
export type {
  ActionableError,
  ErrorAction,
  ErrorActionType,
  FieldHighlight,
  ActionableErrorMessageProps,
  ActionableErrorSummaryProps,
  FieldErrorHighlightProps,
  UseActionableErrorsReturn,
} from '@/types/actionable-error.types'

// Re-export hook
export { useActionableErrors, createApiActionableError } from '@/hooks/useActionableErrors'
