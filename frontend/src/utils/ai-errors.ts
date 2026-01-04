/**
 * AI Error Handling Utilities
 * Feature: 033-ai-brief-generation
 * Task: T063
 *
 * User-friendly error messages with i18n support
 */

import { TFunction } from 'i18next'

export interface AIError {
  code: string
  message: string
  details?: string
  retryable: boolean
  retryAfter?: number // seconds
}

export type AIErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'SPEND_CAP_REACHED'
  | 'PROVIDER_UNAVAILABLE'
  | 'MODEL_UNAVAILABLE'
  | 'GENERATION_FAILED'
  | 'CONTEXT_TOO_LONG'
  | 'CONTENT_FILTERED'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FEATURE_DISABLED'
  | 'NETWORK_ERROR'
  | 'CANCELLED'
  | 'BRIEF_FETCH_FAILED'
  | 'UNKNOWN_ERROR'

/**
 * Parse API error response into AIError
 */
export function parseAIError(error: unknown): AIError {
  // Handle API response errors
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>

    if (err.code && typeof err.code === 'string') {
      return {
        code: err.code,
        message: (err.message as string) || 'An error occurred',
        details: err.details as string | undefined,
        retryable: isRetryableError(err.code),
        retryAfter: err.retryAfter as number | undefined,
      }
    }

    // Handle fetch errors
    if (err.name === 'TypeError' || err.message?.toString().includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error',
        retryable: true,
      }
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    const code = detectErrorCode(error.message)
    return {
      code,
      message: error.message,
      retryable: isRetryableError(code),
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    retryable: false,
  }
}

/**
 * Detect error code from error message
 */
function detectErrorCode(message: string): AIErrorCode {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
    return 'RATE_LIMIT_EXCEEDED'
  }
  if (lowerMessage.includes('spend') || lowerMessage.includes('cap')) {
    return 'SPEND_CAP_REACHED'
  }
  if (lowerMessage.includes('provider') || lowerMessage.includes('unavailable')) {
    return 'PROVIDER_UNAVAILABLE'
  }
  if (lowerMessage.includes('model')) {
    return 'MODEL_UNAVAILABLE'
  }
  if (lowerMessage.includes('context') || lowerMessage.includes('too long')) {
    return 'CONTEXT_TOO_LONG'
  }
  if (lowerMessage.includes('filter') || lowerMessage.includes('content policy')) {
    return 'CONTENT_FILTERED'
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'TIMEOUT'
  }
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
    return 'UNAUTHORIZED'
  }
  if (lowerMessage.includes('disabled') || lowerMessage.includes('not enabled')) {
    return 'FEATURE_DISABLED'
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch failed')) {
    return 'NETWORK_ERROR'
  }
  if (
    lowerMessage.includes('cancelled') ||
    lowerMessage.includes('canceled') ||
    lowerMessage.includes('abort')
  ) {
    return 'CANCELLED'
  }
  if (lowerMessage.includes('brief_fetch') || lowerMessage.includes('fetch brief')) {
    return 'BRIEF_FETCH_FAILED'
  }

  return 'UNKNOWN_ERROR'
}

/**
 * Check if error is retryable
 */
function isRetryableError(code: string): boolean {
  const retryableCodes: AIErrorCode[] = [
    'RATE_LIMIT_EXCEEDED',
    'PROVIDER_UNAVAILABLE',
    'TIMEOUT',
    'NETWORK_ERROR',
    'BRIEF_FETCH_FAILED',
  ]
  return retryableCodes.includes(code as AIErrorCode)
}

/**
 * Get user-friendly error message with i18n
 */
export function getErrorMessage(error: AIError, t: TFunction): string {
  const messages: Record<AIErrorCode, string> = {
    RATE_LIMIT_EXCEEDED: t(
      'ai.errors.rateLimitExceeded',
      'Too many requests. Please wait a moment and try again.',
    ),
    SPEND_CAP_REACHED: t(
      'ai.errors.spendCapReached',
      'AI usage limit reached. Please contact your administrator.',
    ),
    PROVIDER_UNAVAILABLE: t(
      'ai.errors.providerUnavailable',
      'AI service is temporarily unavailable. Please try again later.',
    ),
    MODEL_UNAVAILABLE: t(
      'ai.errors.modelUnavailable',
      'The AI model is not available. Please try a different request.',
    ),
    GENERATION_FAILED: t(
      'ai.errors.generationFailed',
      'Failed to generate content. Please try again.',
    ),
    CONTEXT_TOO_LONG: t(
      'ai.errors.contextTooLong',
      'The input is too long. Please shorten your request.',
    ),
    CONTENT_FILTERED: t(
      'ai.errors.contentFiltered',
      'The request was filtered due to content policy. Please revise your input.',
    ),
    TIMEOUT: t('ai.errors.timeout', 'The request timed out. Please try again.'),
    UNAUTHORIZED: t(
      'ai.errors.unauthorized',
      'You are not authorized to use this feature. Please log in again.',
    ),
    FEATURE_DISABLED: t(
      'ai.errors.featureDisabled',
      'This AI feature is currently disabled for your organization.',
    ),
    NETWORK_ERROR: t(
      'ai.errors.networkError',
      'Network error. Please check your connection and try again.',
    ),
    CANCELLED: t('ai.errors.cancelled', 'Generation was cancelled.'),
    BRIEF_FETCH_FAILED: t(
      'ai.errors.briefFetchFailed',
      'Brief was generated but could not be retrieved. Please try again.',
    ),
    UNKNOWN_ERROR: t('ai.errors.unknown', 'An unexpected error occurred. Please try again.'),
  }

  return messages[error.code as AIErrorCode] || messages.UNKNOWN_ERROR
}

/**
 * Get error action suggestion
 */
export function getErrorAction(error: AIError, t: TFunction): string | null {
  if (error.retryable) {
    if (error.retryAfter) {
      return t('ai.errors.retryAfter', 'Try again in {{seconds}} seconds', {
        seconds: error.retryAfter,
      })
    }
    return t('ai.errors.retryNow', 'Click to retry')
  }

  if (error.code === 'SPEND_CAP_REACHED') {
    return t('ai.errors.contactAdmin', 'Contact your administrator to increase the limit')
  }

  if (error.code === 'UNAUTHORIZED') {
    return t('ai.errors.loginAgain', 'Please log in again')
  }

  if (error.code === 'CONTEXT_TOO_LONG') {
    return t('ai.errors.shortenInput', 'Try with a shorter input')
  }

  return null
}

/**
 * Format error for display
 */
export function formatAIError(
  error: unknown,
  t: TFunction,
): {
  title: string
  message: string
  action: string | null
  retryable: boolean
} {
  const parsedError = parseAIError(error)

  return {
    title: t('ai.errors.title', 'AI Error'),
    message: getErrorMessage(parsedError, t),
    action: getErrorAction(parsedError, t),
    retryable: parsedError.retryable,
  }
}

export default {
  parseAIError,
  getErrorMessage,
  getErrorAction,
  formatAIError,
}
