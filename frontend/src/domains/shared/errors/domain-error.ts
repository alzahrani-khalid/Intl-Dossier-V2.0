/**
 * Shared Kernel - Domain Error Types
 *
 * Standardized error types for consistent error handling
 * across all bounded contexts.
 */

/**
 * Error codes used across the application
 */
export type DomainErrorCode =
  // Authentication & Authorization
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'PERMISSION_DENIED'
  | 'FORBIDDEN'
  // Validation
  | 'VALIDATION_ERROR'
  | 'INVALID_INPUT'
  | 'MISSING_REQUIRED_FIELD'
  // Resource errors
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'CONFLICT'
  | 'RESOURCE_LOCKED'
  // Operation errors
  | 'OPERATION_FAILED'
  | 'PRECONDITION_FAILED'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  // System errors
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'DATABASE_ERROR'
  // Context-specific (can be extended)
  | 'ENGAGEMENT_ERROR'
  | 'DOCUMENT_ERROR'
  | 'RELATIONSHIP_ERROR'

/**
 * HTTP status codes mapped to error types
 */
export const ERROR_STATUS_MAP: Record<DomainErrorCode, number> = {
  AUTH_REQUIRED: 401,
  AUTH_INVALID: 401,
  PERMISSION_DENIED: 403,
  FORBIDDEN: 403,
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  CONFLICT: 409,
  RESOURCE_LOCKED: 423,
  OPERATION_FAILED: 500,
  PRECONDITION_FAILED: 412,
  RATE_LIMITED: 429,
  TIMEOUT: 408,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  EXTERNAL_SERVICE_ERROR: 502,
  DATABASE_ERROR: 500,
  ENGAGEMENT_ERROR: 400,
  DOCUMENT_ERROR: 400,
  RELATIONSHIP_ERROR: 400,
}

/**
 * Base domain error class
 */
export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly status: number
  readonly details?: Record<string, unknown>
  readonly context?: string
  readonly timestamp: string

  constructor(
    message: string,
    code: DomainErrorCode = 'INTERNAL_ERROR',
    details?: Record<string, unknown>,
    context?: string,
  ) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.status = ERROR_STATUS_MAP[code]
    this.details = details
    this.context = context
    this.timestamp = new Date().toISOString()

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor)
  }

  /**
   * Convert to JSON for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details,
      context: this.context,
      timestamp: this.timestamp,
    }
  }

  /**
   * Create a bilingual error response
   */
  toBilingualResponse(): {
    error: {
      code: DomainErrorCode
      message_en: string
      message_ar: string
      details?: Record<string, unknown>
    }
  } {
    return {
      error: {
        code: this.code,
        message_en: this.message,
        message_ar: this.getArabicMessage(),
        details: this.details,
      },
    }
  }

  /**
   * Get Arabic error message (override in subclasses for custom messages)
   */
  protected getArabicMessage(): string {
    return ARABIC_ERROR_MESSAGES[this.code] || 'حدث خطأ'
  }
}

/**
 * Arabic error messages
 */
const ARABIC_ERROR_MESSAGES: Record<DomainErrorCode, string> = {
  AUTH_REQUIRED: 'يجب تسجيل الدخول',
  AUTH_INVALID: 'بيانات الاعتماد غير صالحة',
  PERMISSION_DENIED: 'ليس لديك صلاحية الوصول',
  FORBIDDEN: 'الوصول محظور',
  VALIDATION_ERROR: 'بيانات غير صالحة',
  INVALID_INPUT: 'إدخال غير صالح',
  MISSING_REQUIRED_FIELD: 'حقل مطلوب مفقود',
  NOT_FOUND: 'العنصر غير موجود',
  ALREADY_EXISTS: 'العنصر موجود بالفعل',
  CONFLICT: 'تعارض في البيانات',
  RESOURCE_LOCKED: 'المورد مقفل',
  OPERATION_FAILED: 'فشلت العملية',
  PRECONDITION_FAILED: 'الشروط المسبقة غير مستوفاة',
  RATE_LIMITED: 'تم تجاوز الحد المسموح',
  TIMEOUT: 'انتهت مهلة الطلب',
  INTERNAL_ERROR: 'خطأ داخلي',
  SERVICE_UNAVAILABLE: 'الخدمة غير متاحة',
  EXTERNAL_SERVICE_ERROR: 'خطأ في الخدمة الخارجية',
  DATABASE_ERROR: 'خطأ في قاعدة البيانات',
  ENGAGEMENT_ERROR: 'خطأ في التفاعل',
  DOCUMENT_ERROR: 'خطأ في المستند',
  RELATIONSHIP_ERROR: 'خطأ في العلاقة',
}

/**
 * Specific error classes for common scenarios
 */

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with ID ${id} not found` : `${resource} not found`, 'NOT_FOUND', {
      resource,
      id,
    })
    this.name = 'NotFoundError'
  }
}

export class AuthenticationError extends DomainError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_REQUIRED')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends DomainError {
  constructor(message = 'Permission denied') {
    super(message, 'PERMISSION_DENIED')
    this.name = 'AuthorizationError'
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

/**
 * Type guard for DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}

/**
 * Create a DomainError from an API response
 */
export function fromApiError(response: {
  message?: string
  code?: string
  status?: number
  details?: Record<string, unknown>
}): DomainError {
  const code = (response.code as DomainErrorCode) || 'INTERNAL_ERROR'
  return new DomainError(response.message || 'An error occurred', code, response.details)
}

/**
 * Wrap unknown errors as DomainError
 */
export function wrapError(error: unknown, context?: string): DomainError {
  if (isDomainError(error)) {
    return error
  }
  if (error instanceof Error) {
    return new DomainError(error.message, 'INTERNAL_ERROR', undefined, context)
  }
  return new DomainError(String(error), 'INTERNAL_ERROR', undefined, context)
}
