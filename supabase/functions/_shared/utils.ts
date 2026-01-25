// Shared utilities for Edge Functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

export interface SuccessResponse<T = any> {
  data?: T;
  message?: string;
  metadata?: any;
}

/**
 * CORS headers for mobile clients
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Format error response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string,
  details?: any
): Response {
  const body: ErrorResponse = {
    error: message,
    ...(code && { code }),
    ...(details && { details }),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Format success response
 */
export function successResponse<T>(
  data?: T,
  status: number = 200,
  message?: string,
  metadata?: any
): Response {
  const body: SuccessResponse<T> = {
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(metadata && { metadata }),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Parse request body as JSON
 */
export async function parseBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(body: Record<string, any>, fields: string[]): void {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Rate limiting check (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || record.resetAt < now) {
    requestCounts.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Logger utility
 */
export function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };

  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

/**
 * Check if running in development environment
 */
function isDevelopment(): boolean {
  const env = Deno.env.get('ENVIRONMENT') || Deno.env.get('DENO_ENV') || 'production';
  return env === 'development' || env === 'dev' || env === 'local';
}

/**
 * Wrap handler with error handling and CORS
 */
export function createHandler(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return handleOptions();
    }

    try {
      return await handler(req);
    } catch (error) {
      const correlationId = crypto.randomUUID();

      // Always log full error details server-side for debugging
      log('error', 'Unhandled error in handler', {
        correlationId,
        error: error.message,
        stack: error.stack,
      });

      // SECURITY FIX: Only expose error details in development
      // In production, return generic error with correlation ID for support
      if (isDevelopment()) {
        return errorResponse(error.message || 'Internal server error', 500, 'INTERNAL_ERROR', {
          error: error.message,
          stack: error.stack,
        });
      }

      // Production: Generic error message with correlation ID
      return errorResponse('Internal server error', 500, 'INTERNAL_ERROR', { correlationId });
    }
  };
}
