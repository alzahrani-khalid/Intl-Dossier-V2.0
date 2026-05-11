/**
 * Real-time Validation Rules and Utilities
 * Provides contextual error messages with recovery suggestions
 */

// =============================================================================
// VALIDATION ERROR TYPES
// =============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationResult {
  isValid: boolean
  severity: ValidationSeverity
  messageKey: string
  suggestion?: string
  suggestionKey?: string
  details?: Record<string, string | number>
}

export interface FieldValidationConfig {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  patternName?: string
  custom?: (value: string) => ValidationResult | null
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates a single field value with contextual feedback
 */
export function validateField(value: string, config: FieldValidationConfig): ValidationResult {
  // Trim the value for validation
  const trimmedValue = value.trim()

  // Required check
  if (config.required && !trimmedValue) {
    return {
      isValid: false,
      severity: 'error',
      messageKey: 'validation.required',
      suggestionKey: 'validation.required.suggestion',
    }
  }

  // Empty but not required is valid
  if (!trimmedValue && !config.required) {
    return { isValid: true, severity: 'info', messageKey: '' }
  }

  // Min length check with character count
  if (config.minLength && trimmedValue.length < config.minLength) {
    const remaining = config.minLength - trimmedValue.length
    return {
      isValid: false,
      severity: 'error',
      messageKey: 'validation.minLength',
      suggestionKey: 'validation.minLength.suggestion',
      details: {
        min: config.minLength,
        current: trimmedValue.length,
        remaining,
      },
    }
  }

  // Max length check with warning at 90%
  if (config.maxLength) {
    const percentage = (trimmedValue.length / config.maxLength) * 100

    if (trimmedValue.length > config.maxLength) {
      const excess = trimmedValue.length - config.maxLength
      return {
        isValid: false,
        severity: 'error',
        messageKey: 'validation.maxLength',
        suggestionKey: 'validation.maxLength.suggestion',
        details: {
          max: config.maxLength,
          current: trimmedValue.length,
          excess,
        },
      }
    }

    // Warning when approaching limit
    if (percentage >= 90) {
      return {
        isValid: true,
        severity: 'warning',
        messageKey: 'validation.maxLength.approaching',
        details: {
          max: config.maxLength,
          current: trimmedValue.length,
          remaining: config.maxLength - trimmedValue.length,
        },
      }
    }
  }

  // Pattern check
  if (config.pattern && !config.pattern.test(trimmedValue)) {
    const patternKey = config.patternName || 'generic'
    return {
      isValid: false,
      severity: 'error',
      messageKey: `validation.${patternKey}.invalid`,
      suggestionKey: `validation.${patternKey}.suggestion`,
    }
  }

  // Custom validation
  if (config.custom) {
    const customResult = config.custom(trimmedValue)
    if (customResult) {
      return customResult
    }
  }

  // All checks passed
  return { isValid: true, severity: 'info', messageKey: '' }
}

// =============================================================================
// CONTEXTUAL ERROR GENERATORS
// =============================================================================

/**
 * Generates contextual error messages based on common mistakes
 */
export function generateContextualError(value: string, fieldType: string): ValidationResult | null {
  // Email-specific contextual errors
  if (fieldType === 'email') {
    if (!value.includes('@')) {
      return {
        isValid: false,
        severity: 'error',
        messageKey: 'validation.email.missingAt',
        suggestionKey: 'validation.email.missingAt.suggestion',
      }
    }
    if (value.includes('@') && !value.includes('.')) {
      return {
        isValid: false,
        severity: 'error',
        messageKey: 'validation.email.missingDomain',
        suggestionKey: 'validation.email.missingDomain.suggestion',
      }
    }
    if (value.startsWith('@') || value.endsWith('@')) {
      return {
        isValid: false,
        severity: 'error',
        messageKey: 'validation.email.invalidPosition',
        suggestionKey: 'validation.email.invalidPosition.suggestion',
      }
    }
    if (/\s/.test(value)) {
      return {
        isValid: false,
        severity: 'error',
        messageKey: 'validation.email.hasSpaces',
        suggestionKey: 'validation.email.hasSpaces.suggestion',
      }
    }
  }

  // URL-specific contextual errors
  if (fieldType === 'url') {
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return {
        isValid: false,
        severity: 'error',
        messageKey: 'validation.url.missingProtocol',
        suggestionKey: 'validation.url.missingProtocol.suggestion',
        suggestion: value.startsWith('www.') ? `https://${value}` : `https://${value}`,
      }
    }
    if (!value.includes('.')) {
      return {
        isValid: false,
        severity: 'error',
        messageKey: 'validation.url.missingDomain',
        suggestionKey: 'validation.url.missingDomain.suggestion',
      }
    }
  }

  // Phone-specific contextual errors
  if (fieldType === 'phone') {
    if (value.length > 0 && !/\d/.test(value)) {
      return {
        isValid: false,
        severity: 'error',
        messageKey: 'validation.phone.noDigits',
        suggestionKey: 'validation.phone.noDigits.suggestion',
      }
    }
    if (value.replace(/\D/g, '').length < 7) {
      return {
        isValid: false,
        severity: 'error',
        messageKey: 'validation.phone.tooShort',
        suggestionKey: 'validation.phone.tooShort.suggestion',
        details: { minDigits: 7 },
      }
    }
  }

  return null
}

// =============================================================================
// STRENGTH INDICATORS
// =============================================================================

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

export interface StrengthResult {
  level: StrengthLevel
  score: number // 0-100
  messageKey: string
  improvements: string[]
}

/**
 * Calculates password strength with improvement suggestions
 */
export function calculatePasswordStrength(password: string): StrengthResult {
  const improvements: string[] = []
  let score = 0

  // Length checks
  if (password.length >= 8) score += 20
  else improvements.push('validation.password.addLength')

  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10

  // Character type checks
  if (/[a-z]/.test(password)) score += 10
  else improvements.push('validation.password.addLowercase')

  if (/[A-Z]/.test(password)) score += 15
  else improvements.push('validation.password.addUppercase')

  if (/\d/.test(password)) score += 15
  else improvements.push('validation.password.addNumber')

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20
  else improvements.push('validation.password.addSpecial')

  // Determine level
  let level: StrengthLevel = 'weak'
  let messageKey = 'validation.password.strength.weak'

  if (score >= 80) {
    level = 'strong'
    messageKey = 'validation.password.strength.strong'
  } else if (score >= 60) {
    level = 'good'
    messageKey = 'validation.password.strength.good'
  } else if (score >= 40) {
    level = 'fair'
    messageKey = 'validation.password.strength.fair'
  }

  return { level, score, messageKey, improvements }
}

// =============================================================================
// ZOD SCHEMA HELPERS WITH CONTEXTUAL MESSAGES
// =============================================================================

// =============================================================================
// FORM-LEVEL VALIDATION
// =============================================================================

export interface FormValidationState {
  isValid: boolean
  errors: Record<string, ValidationResult>
  warnings: Record<string, ValidationResult>
  touched: Set<string>
  dirty: Set<string>
}
