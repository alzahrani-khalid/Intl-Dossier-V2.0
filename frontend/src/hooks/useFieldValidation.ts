/**
 * useFieldValidation Hook
 * Provides real-time field validation with debouncing and contextual feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import {
  validateField,
  generateContextualError,
  type ValidationResult,
  type FieldValidationConfig,
} from '@/lib/validation-rules'

// =============================================================================
// TYPES
// =============================================================================

export interface UseFieldValidationOptions extends FieldValidationConfig {
  /** Field type for contextual error generation */
  fieldType?: 'text' | 'email' | 'url' | 'phone' | 'password' | 'number' | 'date'
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Whether to validate on every keystroke (before debounce) for instant feedback */
  instantFeedback?: boolean
  /** Callback when validation state changes */
  onValidationChange?: (result: ValidationResult) => void
}

export interface UseFieldValidationReturn {
  /** Current validation result */
  result: ValidationResult | null
  /** Whether field is currently being validated */
  isValidating: boolean
  /** Whether field has been touched (blurred) */
  isTouched: boolean
  /** Whether field value has changed from initial */
  isDirty: boolean
  /** Validate the field value */
  validate: (value: string) => void
  /** Validate immediately without debounce */
  validateNow: (value: string) => ValidationResult
  /** Mark field as touched */
  setTouched: () => void
  /** Reset validation state */
  reset: () => void
  /** Clear current validation result */
  clear: () => void
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

// Used as initial state reference (not directly assigned to avoid redundant type)
const _defaultValidationResult: ValidationResult = {
  isValid: true,
  severity: 'info',
  messageKey: '',
}
void _defaultValidationResult // Silence unused variable warning

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useFieldValidation(
  options: UseFieldValidationOptions = {},
): UseFieldValidationReturn {
  const {
    fieldType = 'text',
    debounceMs = 300,
    instantFeedback = false,
    onValidationChange,
    ...validationConfig
  } = options

  // State
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Refs for tracking
  const initialValueRef = useRef<string>('')
  const lastValueRef = useRef<string>('')

  // Core validation function
  const performValidation = useCallback(
    (value: string): ValidationResult => {
      // First check for contextual errors (more specific)
      const contextualError = generateContextualError(value, fieldType)
      if (contextualError) {
        return contextualError
      }

      // Then perform standard validation
      return validateField(value, validationConfig)
    },
    [fieldType, validationConfig],
  )

  // Debounced validation
  const debouncedValidate = useDebouncedCallback((value: string) => {
    const validationResult = performValidation(value)
    setResult(validationResult)
    setIsValidating(false)
    onValidationChange?.(validationResult)
  }, debounceMs)

  // Public validate function
  const validate = useCallback(
    (value: string) => {
      lastValueRef.current = value

      // Track dirty state
      if (value !== initialValueRef.current) {
        setIsDirty(true)
      }

      // Show validating state
      setIsValidating(true)

      // For instant feedback, show immediate validation for critical errors
      if (instantFeedback) {
        const quickResult = performValidation(value)
        // Only show instant feedback for errors, not for "valid" state
        if (!quickResult.isValid) {
          setResult(quickResult)
          setIsValidating(false)
          onValidationChange?.(quickResult)
          return
        }
      }

      // Debounce the full validation
      debouncedValidate(value)
    },
    [debouncedValidate, instantFeedback, performValidation, onValidationChange],
  )

  // Immediate validation without debounce
  const validateNow = useCallback(
    (value: string): ValidationResult => {
      lastValueRef.current = value

      // Track dirty state
      if (value !== initialValueRef.current) {
        setIsDirty(true)
      }

      const validationResult = performValidation(value)
      setResult(validationResult)
      setIsValidating(false)
      onValidationChange?.(validationResult)

      return validationResult
    },
    [performValidation, onValidationChange],
  )

  // Mark as touched
  const setTouched = useCallback(() => {
    setIsTouched(true)
    // On blur, validate immediately if there's a value
    if (lastValueRef.current) {
      debouncedValidate.flush()
    }
  }, [debouncedValidate])

  // Reset state
  const reset = useCallback(() => {
    setResult(null)
    setIsValidating(false)
    setIsTouched(false)
    setIsDirty(false)
    lastValueRef.current = ''
    debouncedValidate.cancel()
  }, [debouncedValidate])

  // Clear result
  const clear = useCallback(() => {
    setResult(null)
    setIsValidating(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedValidate.cancel()
    }
  }, [debouncedValidate])

  return {
    result,
    isValidating,
    isTouched,
    isDirty,
    validate,
    validateNow,
    setTouched,
    reset,
    clear,
  }
}

// =============================================================================
// FORM-LEVEL HOOK
// =============================================================================

export interface UseFormValidationOptions {
  /** Field configurations keyed by field name */
  fields: Record<string, UseFieldValidationOptions>
  /** Debounce delay for all fields */
  debounceMs?: number
}

export interface UseFormValidationReturn {
  /** Individual field validation hooks */
  fieldValidations: Record<string, UseFieldValidationReturn>
  /** Whether all fields are valid */
  isFormValid: boolean
  /** Whether any field is currently validating */
  isValidating: boolean
  /** Validate all fields */
  validateAll: (values: Record<string, string>) => boolean
  /** Reset all field validations */
  resetAll: () => void
}

export function useFormValidation(options: UseFormValidationOptions): UseFormValidationReturn {
  const { fields, debounceMs = 300 } = options

  // Create individual field validations
  const fieldValidations: Record<string, UseFieldValidationReturn> = {}

  Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    fieldValidations[fieldName] = useFieldValidation({
      ...fieldConfig,
      debounceMs,
    })
  })

  // Compute form-level state
  const isFormValid = Object.values(fieldValidations).every((fv) => !fv.result || fv.result.isValid)

  const isValidating = Object.values(fieldValidations).some((fv) => fv.isValidating)

  // Validate all fields at once
  const validateAll = useCallback(
    (values: Record<string, string>): boolean => {
      let allValid = true

      Object.entries(values).forEach(([fieldName, value]) => {
        const fieldValidation = fieldValidations[fieldName]
        if (fieldValidation) {
          const result = fieldValidation.validateNow(value)
          if (!result.isValid) {
            allValid = false
          }
        }
      })

      return allValid
    },
    [fieldValidations],
  )

  // Reset all fields
  const resetAll = useCallback(() => {
    Object.values(fieldValidations).forEach((fv) => fv.reset())
  }, [fieldValidations])

  return {
    fieldValidations,
    isFormValid,
    isValidating,
    validateAll,
    resetAll,
  }
}

export default useFieldValidation
