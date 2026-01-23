/**
 * Sentry Error Tracking Configuration for Frontend
 *
 * Features:
 * - Error tracking with source maps
 * - User context (role, tenant)
 * - Environment-based sampling
 * - Performance monitoring
 * - Custom breadcrumbs for debugging
 */

import * as Sentry from '@sentry/react'

interface SentryUserContext {
  id: string
  email?: string
  role?: string
  tenant?: string
}

/**
 * Initialize Sentry for the frontend application
 * Must be called at application startup, before rendering
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE
  const release =
    import.meta.env.VITE_SENTRY_RELEASE ||
    `intl-dossier-frontend@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`

  // Don't initialize if no DSN configured
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] No DSN configured, error tracking disabled')
    }
    return
  }

  Sentry.init({
    dsn,
    environment,
    release,

    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session replay (optional, uncomment if needed)
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      // Browser tracing for performance
      Sentry.browserTracingIntegration(),
      // HTTP client errors
      Sentry.httpClientIntegration(),
      // Capture console errors
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],

    // Trace propagation targets for API calls
    tracePropagationTargets: ['localhost', /^https:\/\/.*\.supabase\.co/, /^https:\/\/api\./],

    // Filter out sensitive data before sending
    beforeSend(event, _hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['authorization']
        delete event.request.headers['Cookie']
        delete event.request.headers['cookie']
      }

      // Remove sensitive query parameters
      if (event.request?.query_string) {
        const params = new URLSearchParams(event.request.query_string)
        const sensitiveParams = ['token', 'apiKey', 'api_key', 'password', 'secret']
        sensitiveParams.forEach((param) => params.delete(param))
        event.request.query_string = params.toString()
      }

      // In development, log instead of sending
      if (import.meta.env.DEV) {
        console.log('[Sentry] Would send event:', event)
        return null // Don't send in development
      }

      return event
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null
      }
      return breadcrumb
    },

    // Error sampling in production
    sampleRate: environment === 'production' ? 1.0 : 1.0,

    // Attach stack trace to all messages
    attachStacktrace: true,

    // Enable debug mode in development/staging
    debug: import.meta.env.DEV,
  })

  console.log(`[Sentry] Initialized for ${environment} environment`)
}

/**
 * Set user context for error tracking
 * Call this after user authentication
 */
export function setSentryUser(user: SentryUserContext): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
    tenant: user.tenant,
  })

  // Also set as tags for easier filtering
  if (user.role) {
    Sentry.setTag('user.role', user.role)
  }
  if (user.tenant) {
    Sentry.setTag('user.tenant', user.tenant)
  }
}

/**
 * Clear user context (call on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null)
  Sentry.setTag('user.role', undefined)
  Sentry.setTag('user.tenant', undefined)
}

/**
 * Add breadcrumb for tracking user actions
 * Useful for debugging error context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Set custom context for error tracking
 * Use for page-specific or feature-specific context
 */
export function setContext(key: string, context: Record<string, unknown>): void {
  Sentry.setContext(key, context)
}

/**
 * Capture an exception with optional context
 */
export function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
  },
): string {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
  })
}

/**
 * Capture a message with severity level
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>,
): string {
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string,
): ReturnType<typeof Sentry.startInactiveSpan> {
  return Sentry.startInactiveSpan({
    name,
    op,
  })
}

/**
 * React Error Boundary wrapper from Sentry
 * Use this instead of a custom error boundary for automatic Sentry integration
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary

/**
 * Sentry React profiler for performance monitoring
 */
export const SentryProfiler = Sentry.withProfiler

// Re-export commonly used Sentry functions
export { Sentry }
