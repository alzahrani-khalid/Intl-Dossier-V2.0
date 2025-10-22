/**
 * Security utilities for Edge Functions
 * Provides input validation, sanitization, and XSS prevention
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_STRING_LENGTH = 5000;
const MAX_ARRAY_LENGTH = 100;

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string') return false;
  return UUID_REGEX.test(uuid);
}

/**
 * Validate and sanitize assignment ID
 */
export function validateAssignmentId(id: unknown): { valid: boolean; id?: string; error?: string } {
  if (typeof id !== 'string') {
    return { valid: false, error: 'assignment_id must be a string' };
  }

  if (!isValidUUID(id)) {
    return { valid: false, error: 'assignment_id must be a valid UUID' };
  }

  return { valid: true, id };
}

/**
 * Validate array of UUIDs
 */
export function validateUUIDArray(
  arr: unknown,
  fieldName = 'ids',
  maxLength = MAX_ARRAY_LENGTH
): { valid: boolean; ids?: string[]; error?: string } {
  if (!Array.isArray(arr)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }

  if (arr.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (arr.length > maxLength) {
    return { valid: false, error: `${fieldName} cannot exceed ${maxLength} items` };
  }

  const invalidIds = arr.filter((id) => !isValidUUID(id));
  if (invalidIds.length > 0) {
    return { valid: false, error: `${fieldName} contains invalid UUIDs` };
  }

  return { valid: true, ids: arr as string[] };
}

/**
 * Sanitize text input to prevent XSS
 * Removes HTML tags and dangerous characters
 */
export function sanitizeText(input: unknown, maxLength = MAX_STRING_LENGTH): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Limit length
  let sanitized = input.substring(0, maxLength);

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Escape dangerous characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

/**
 * Validate escalation reason (optional field)
 */
export function validateReason(reason: unknown): { valid: boolean; reason?: string; error?: string } {
  if (reason === undefined || reason === null) {
    return { valid: true, reason: undefined };
  }

  if (typeof reason !== 'string') {
    return { valid: false, error: 'reason must be a string' };
  }

  if (reason.length > 500) {
    return { valid: false, error: 'reason cannot exceed 500 characters' };
  }

  const sanitized = sanitizeText(reason, 500);
  return { valid: true, reason: sanitized };
}

/**
 * Validate resolution text (required field)
 */
export function validateResolution(resolution: unknown): { valid: boolean; resolution?: string; error?: string } {
  if (!resolution || typeof resolution !== 'string') {
    return { valid: false, error: 'resolution is required and must be a string' };
  }

  if (resolution.trim().length === 0) {
    return { valid: false, error: 'resolution cannot be empty' };
  }

  if (resolution.length > 1000) {
    return { valid: false, error: 'resolution cannot exceed 1000 characters' };
  }

  const sanitized = sanitizeText(resolution, 1000);
  return { valid: true, resolution: sanitized };
}

/**
 * Validate notes (optional field)
 */
export function validateNotes(notes: unknown): { valid: boolean; notes?: string; error?: string } {
  if (notes === undefined || notes === null) {
    return { valid: true, notes: undefined };
  }

  if (typeof notes !== 'string') {
    return { valid: false, error: 'notes must be a string' };
  }

  if (notes.length > 1000) {
    return { valid: false, error: 'notes cannot exceed 1000 characters' };
  }

  const sanitized = sanitizeText(notes, 1000);
  return { valid: true, notes: sanitized };
}

/**
 * Sanitize notification content to prevent XSS in emails/in-app notifications
 */
export function sanitizeNotificationContent(content: {
  title?: string;
  message?: string;
  reason?: string;
}): {
  title: string;
  message: string;
  reason: string;
} {
  return {
    title: sanitizeText(content.title || 'Notification', 200),
    message: sanitizeText(content.message || '', 500),
    reason: sanitizeText(content.reason || 'No reason provided', 500),
  };
}

/**
 * Create safe error response (avoid information disclosure)
 */
export function createSafeErrorResponse(
  error: unknown,
  fallbackMessage = 'An error occurred'
): { error: string; message: string } {
  // Log full error for debugging
  console.error('Error details:', error);

  // Return sanitized message to client
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
    return {
      error: 'INTERNAL_ERROR',
      message: isDevelopment ? error.message : fallbackMessage,
    };
  }

  return {
    error: 'INTERNAL_ERROR',
    message: fallbackMessage,
  };
}

/**
 * Validate CORS origin (for production security)
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',');

  // In development, allow all origins
  if (Deno.env.get('ENVIRONMENT') === 'development') {
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Get secure CORS headers
 */
export function getSecureCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');

  if (isAllowedOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey, if-none-match',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  // Default strict CORS
  return {
    'Access-Control-Allow-Origin': 'null',
    'Access-Control-Allow-Methods': 'OPTIONS',
    'Access-Control-Allow-Headers': 'authorization',
  };
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit using database query (fallback if Redis unavailable)
 */
export async function checkRateLimitDB(
  supabase: any,
  userId: string,
  action: 'reminder' | 'escalation',
  maxRequests = 100,
  windowMinutes = 5
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const tableName = action === 'reminder' ? 'followup_reminders' : 'escalation_records';
  const { data, error } = await supabase
    .from(tableName)
    .select('id', { count: 'exact', head: true })
    .eq(action === 'reminder' ? 'sent_by' : 'escalated_by', userId)
    .gte('created_at', windowStart);

  if (error) {
    console.error('Rate limit check error:', error);
    // Fail open in case of database error (allow request but log)
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowMinutes * 60 * 1000,
    };
  }

  const count = data || 0;
  const remaining = Math.max(0, maxRequests - count);

  return {
    allowed: count < maxRequests,
    remaining,
    resetTime: Date.now() + windowMinutes * 60 * 1000,
  };
}

/**
 * Validate Content-Type header
 */
export function validateContentType(req: Request): boolean {
  const contentType = req.headers.get('content-type');
  return contentType === 'application/json' || contentType?.startsWith('application/json');
}
