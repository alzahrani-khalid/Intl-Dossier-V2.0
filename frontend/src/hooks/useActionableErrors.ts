/**
 * useActionableErrors Hook
 * Manages actionable errors with auto-fix capabilities and field highlighting
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import type {
  ActionableError,
  ErrorAction,
  FieldHighlight,
  UseActionableErrorsReturn,
  ErrorContext,
} from '@/types/actionable-error.types'
import type { ValidationResult } from '@/lib/validation-rules'
import { generateContextualError, validateField } from '@/lib/validation-rules'

// =============================================================================
// ERROR GENERATORS
// =============================================================================

/**
 * Generates an actionable error from a validation result
 */
function generateActionableError(
  fieldName: string,
  fieldType: string,
  value: string,
  validationResult: ValidationResult,
): ActionableError | null {
  if (validationResult.isValid && validationResult.severity !== 'warning') {
    return null
  }

  const baseError: ActionableError = {
    code: `${fieldName}_${Date.now()}`,
    severity: validationResult.severity,
    titleKey: validationResult.messageKey,
    messageKey: validationResult.suggestionKey || validationResult.messageKey,
    params: validationResult.details,
    fieldName,
    actions: [],
    dismissible: validationResult.severity === 'warning',
  }

  // Add specific actions based on error type
  const actions = generateActionsForError(fieldName, fieldType, value, validationResult)
  baseError.actions = actions

  return baseError
}

/**
 * Generates specific actions based on error type
 */
function generateActionsForError(
  fieldName: string,
  fieldType: string,
  value: string,
  result: ValidationResult,
): ErrorAction[] {
  const actions: ErrorAction[] = []

  // Always add focus action
  actions.push({
    id: `focus_${fieldName}`,
    type: 'focus_field',
    labelKey: 'actions.focusField',
    fieldName,
    showOnMobile: true,
  })

  // Email-specific actions
  if (fieldType === 'email') {
    if (result.messageKey === 'validation.email.hasSpaces') {
      const fixedValue = value.replace(/\s/g, '')
      actions.unshift({
        id: `fix_${fieldName}_spaces`,
        type: 'auto_fix',
        labelKey: 'actions.removeSpaces',
        value: fixedValue,
        fieldName,
        primary: true,
        showOnMobile: true,
      })
    }

    if (result.messageKey === 'validation.email.missingAt') {
      // Can't auto-fix missing @, but suggest common patterns
      actions.unshift({
        id: `suggest_${fieldName}_at`,
        type: 'suggest_value',
        labelKey: 'actions.addAtSymbol',
        tooltipKey: 'actions.addAtSymbol.tooltip',
        fieldName,
        primary: true,
        showOnMobile: true,
      })
    }
  }

  // URL-specific actions
  if (fieldType === 'url') {
    if (result.messageKey === 'validation.url.missingProtocol') {
      const fixedValue = value.startsWith('www.') ? `https://${value}` : `https://${value}`
      actions.unshift({
        id: `fix_${fieldName}_protocol`,
        type: 'auto_fix',
        labelKey: 'actions.addHttps',
        value: fixedValue,
        fieldName,
        primary: true,
        showOnMobile: true,
      })
    }
  }

  // Phone-specific actions
  if (fieldType === 'phone') {
    if (result.messageKey === 'validation.phone.noDigits') {
      actions.unshift({
        id: `suggest_${fieldName}_digits`,
        type: 'suggest_value',
        labelKey: 'actions.enterDigits',
        fieldName,
        primary: true,
        showOnMobile: true,
      })
    }
  }

  // Required field action
  if (result.messageKey === 'validation.required') {
    actions.unshift({
      id: `focus_${fieldName}_required`,
      type: 'focus_field',
      labelKey: 'actions.fillRequired',
      fieldName,
      primary: true,
      showOnMobile: true,
    })
  }

  // Min length action
  if (result.messageKey === 'validation.minLength') {
    const remaining = result.details?.remaining as number
    actions.unshift({
      id: `info_${fieldName}_minlength`,
      type: 'focus_field',
      labelKey: 'actions.addCharacters',
      fieldName,
      primary: true,
      showOnMobile: true,
    })
  }

  // Max length action
  if (result.messageKey === 'validation.maxLength') {
    const excess = result.details?.excess as number
    const fixedValue = value.slice(0, value.length - excess)
    actions.unshift({
      id: `fix_${fieldName}_maxlength`,
      type: 'auto_fix',
      labelKey: 'actions.trimText',
      value: fixedValue,
      fieldName,
      primary: true,
      showOnMobile: true,
    })
  }

  return actions
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

interface UseActionableErrorsOptions {
  /** Debounce delay for error generation in ms */
  debounceMs?: number
  /** Callback when an error is added */
  onErrorAdded?: (error: ActionableError) => void
  /** Callback when an error is removed */
  onErrorRemoved?: (code: string) => void
  /** Callback when an action is executed */
  onActionExecuted?: (errorCode: string, action: ErrorAction) => void
}

export function useActionableErrors(
  options: UseActionableErrorsOptions = {},
): UseActionableErrorsReturn {
  const { debounceMs = 150, onErrorAdded, onErrorRemoved, onActionExecuted } = options

  const [errors, setErrors] = useState<ActionableError[]>([])
  const [highlightedFields, setHighlightedFields] = useState<FieldHighlight[]>([])

  // Refs for field elements
  const fieldRefsMap = useRef<Map<string, HTMLElement | null>>(new Map())

  // Add an error
  const addError = useCallback(
    (error: ActionableError) => {
      setErrors((prev) => {
        // Remove existing error for same field
        const filtered = prev.filter((e) => e.fieldName !== error.fieldName)
        return [...filtered, error]
      })
      onErrorAdded?.(error)

      // Auto-highlight the field
      if (error.fieldName) {
        setHighlightedFields((prev) => {
          const filtered = prev.filter((h) => h.fieldName !== error.fieldName)
          return [
            ...filtered,
            {
              fieldName: error.fieldName!,
              severity: error.severity,
              animation: 'pulse',
              duration: 2000,
            },
          ]
        })
      }
    },
    [onErrorAdded],
  )

  // Remove an error
  const removeError = useCallback(
    (code: string) => {
      setErrors((prev) => prev.filter((e) => e.code !== code))
      onErrorRemoved?.(code)
    },
    [onErrorRemoved],
  )

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([])
    setHighlightedFields([])
  }, [])

  // Execute an action
  const executeAction = useCallback(
    (
      errorCode: string,
      action: ErrorAction,
      onValueChange?: (fieldName: string, value: string) => void,
    ) => {
      const error = errors.find((e) => e.code === errorCode)
      if (!error) return

      switch (action.type) {
        case 'auto_fix':
        case 'suggest_value':
          if (action.value && action.fieldName && onValueChange) {
            onValueChange(action.fieldName, action.value)
            // Remove error after successful fix
            removeError(errorCode)
          }
          break

        case 'focus_field':
          if (action.fieldName) {
            focusField(action.fieldName)
          }
          break

        case 'copy_correct':
          if (action.value) {
            navigator.clipboard.writeText(action.value)
          }
          break

        case 'dismiss':
          removeError(errorCode)
          break

        case 'retry':
          // Retry is handled by the calling code
          break

        case 'navigate':
          if (action.url) {
            window.location.href = action.url
          }
          break

        case 'contact_support':
          // Opens support modal or link
          break

        case 'open_modal':
          // Modal handling is done by parent
          break
      }

      onActionExecuted?.(errorCode, action)
    },
    [errors, removeError, onActionExecuted],
  )

  // Highlight a field
  const highlightField = useCallback((highlight: FieldHighlight) => {
    setHighlightedFields((prev) => {
      const filtered = prev.filter((h) => h.fieldName !== highlight.fieldName)
      return [...filtered, highlight]
    })

    // Auto-clear highlight after duration
    if (highlight.duration) {
      setTimeout(() => {
        setHighlightedFields((prev) => prev.filter((h) => h.fieldName !== highlight.fieldName))
      }, highlight.duration)
    }
  }, [])

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    setHighlightedFields([])
  }, [])

  // Focus on a field
  const focusField = useCallback((fieldName: string) => {
    // Try to find the field by name attribute
    const field = document.querySelector<HTMLElement>(
      `[name="${fieldName}"], #${fieldName}, [data-field-name="${fieldName}"]`,
    )
    if (field) {
      field.focus()
      field.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Add a temporary highlight
      setHighlightedFields((prev) => {
        const filtered = prev.filter((h) => h.fieldName !== fieldName)
        return [
          ...filtered,
          {
            fieldName,
            severity: 'error',
            animation: 'shake',
            duration: 1000,
          },
        ]
      })
    }
  }, [])

  // Generate actionable error from validation
  const debouncedFromValidation = useDebouncedCallback(
    (fieldName: string, fieldType: string, value: string) => {
      // First check for contextual errors
      const contextualError = generateContextualError(value, fieldType)
      if (contextualError) {
        const actionableError = generateActionableError(
          fieldName,
          fieldType,
          value,
          contextualError,
        )
        if (actionableError) {
          addError(actionableError)
        }
        return actionableError
      }

      // Then check standard validation
      const validationResult = validateField(value, {
        required: true,
        pattern:
          fieldType === 'email'
            ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            : fieldType === 'url'
              ? /^https?:\/\/.+\..+/
              : undefined,
        patternName: fieldType,
      })

      const actionableError = generateActionableError(fieldName, fieldType, value, validationResult)

      if (actionableError) {
        addError(actionableError)
      } else {
        // Clear errors for this field if valid
        setErrors((prev) => prev.filter((e) => e.fieldName !== fieldName))
        setHighlightedFields((prev) => prev.filter((h) => h.fieldName !== fieldName))
      }

      return actionableError
    },
    debounceMs,
  )

  const fromValidation = useCallback(
    (fieldName: string, fieldType: string, value: string): ActionableError | null => {
      return debouncedFromValidation(fieldName, fieldType, value) || null
    },
    [debouncedFromValidation],
  )

  // Get highlight for a specific field
  const getFieldHighlight = useCallback(
    (fieldName: string): FieldHighlight | undefined => {
      return highlightedFields.find((h) => h.fieldName === fieldName)
    },
    [highlightedFields],
  )

  // Get error for a specific field
  const getFieldError = useCallback(
    (fieldName: string): ActionableError | undefined => {
      return errors.find((e) => e.fieldName === fieldName)
    },
    [errors],
  )

  return {
    errors,
    highlightedFields,
    addError,
    removeError,
    clearErrors,
    executeAction,
    highlightField,
    clearHighlights,
    focusField,
    fromValidation,
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates an actionable error for API errors
 */
export function createApiActionableError(
  status: number,
  message: string,
  fieldErrors?: Record<string, { message: string; suggestion?: string; autoFix?: string }>,
): ActionableError[] {
  const errors: ActionableError[] = []

  // Field-level errors
  if (fieldErrors) {
    Object.entries(fieldErrors).forEach(([fieldName, error]) => {
      const actions: ErrorAction[] = [
        {
          id: `focus_${fieldName}`,
          type: 'focus_field',
          labelKey: 'actions.focusField',
          fieldName,
          showOnMobile: true,
        },
      ]

      if (error.autoFix) {
        actions.unshift({
          id: `fix_${fieldName}`,
          type: 'auto_fix',
          labelKey: 'actions.applyFix',
          value: error.autoFix,
          fieldName,
          primary: true,
          showOnMobile: true,
        })
      }

      errors.push({
        code: `api_${fieldName}_${Date.now()}`,
        severity: 'error',
        titleKey: 'api.fieldError',
        messageKey: error.message,
        fieldName,
        actions,
        dismissible: false,
      })
    })
  }

  // General API errors
  if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
    const isRetryable = status >= 500 || status === 408 || status === 429

    errors.push({
      code: `api_${status}_${Date.now()}`,
      severity: 'error',
      titleKey: `api.status.${status}`,
      messageKey: message,
      actions: [
        ...(isRetryable
          ? [
              {
                id: 'retry',
                type: 'retry' as const,
                labelKey: 'actions.retry',
                primary: true,
                showOnMobile: true,
              },
            ]
          : []),
        {
          id: 'support',
          type: 'contact_support' as const,
          labelKey: 'actions.contactSupport',
          showOnMobile: false,
        },
      ],
      dismissible: true,
    })
  }

  return errors
}

export default useActionableErrors
