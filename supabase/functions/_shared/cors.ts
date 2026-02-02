/**
 * CORS Headers Configuration
 *
 * For production security, use getCorsHeaders(request) which validates origins.
 * The static corsHeaders is kept for backwards compatibility but should be migrated.
 */

/**
 * List of allowed origins for CORS
 * In production, this comes from ALLOWED_ORIGINS env var
 */
function getAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim());
  }
  // Default allowed origins for development
  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];
}

/**
 * Check if an origin is allowed
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // In development, allow all origins
  if (Deno.env.get('ENVIRONMENT') === 'development') {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Get secure CORS headers based on request origin
 * This should be used instead of static corsHeaders
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');

  if (isAllowedOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin || '',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
  }

  // Reject unknown origins with restrictive headers
  return {
    'Access-Control-Allow-Origin': 'null',
    'Access-Control-Allow-Methods': 'OPTIONS',
    'Access-Control-Allow-Headers': 'authorization',
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

/**
 * @deprecated Use getCorsHeaders(request) for proper origin validation
 * This static version with wildcard origin is kept for backwards compatibility
 * but should be migrated to getCorsHeaders() in all Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};
