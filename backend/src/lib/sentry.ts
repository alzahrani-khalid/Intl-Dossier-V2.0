/**
 * Sentry Error Tracking Configuration for Backend
 *
 * Features:
 * - Error tracking with source maps
 * - User context (role, tenant)
 * - Environment-based sampling
 * - Performance monitoring
 * - Express middleware integration
 * - Custom breadcrumbs for debugging
 */

import * as Sentry from '@sentry/node'
import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express'

interface SentryUserContext {
  id: string
  email?: string
  role?: string
  tenant?: string
}

/**
 * Initialize Sentry for the backend application
 * Must be called at application startup, before any other middleware
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'
  const release =
    process.env.SENTRY_RELEASE ||
    `intl-dossier-backend@${process.env.npm_package_version || '1.0.0'}`

  // Don't initialize if no DSN configured
  if (!dsn) {
    if (process.env.NODE_ENV !== 'production') {
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

    // Integrations
    integrations: [
      // Enable HTTP calls tracing
      Sentry.httpIntegration(),
      // Enable Express tracing
      Sentry.expressIntegration(),
      // Capture unhandled promise rejections
      Sentry.onUnhandledRejectionIntegration(),
      // Capture uncaught exceptions
      Sentry.onUncaughtExceptionIntegration(),
    ],

    // Filter out sensitive data before sending
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
        delete event.request.headers['x-api-key']
      }

      // Remove sensitive data from request body
      if (event.request?.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key']
        try {
          const data =
            typeof event.request.data === 'string'
              ? JSON.parse(event.request.data)
              : event.request.data

          sensitiveFields.forEach((field) => {
            if (data[field]) {
              data[field] = '[REDACTED]'
            }
          })

          event.request.data = JSON.stringify(data)
        } catch {
          // Not JSON, leave as-is
        }
      }

      return event
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null
      }
      return breadcrumb
    },

    // Error sampling in production
    sampleRate: environment === 'production' ? 1.0 : 1.0,

    // Attach stack trace to all messages
    attachStacktrace: true,

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  })

  console.log(`[Sentry] Initialized for ${environment} environment`)
}

/**
 * Express request handler middleware
 * Add this BEFORE your routes
 * In Sentry Node SDK v9+, this is handled automatically by the express integration
 */
export const sentryRequestHandler: RequestHandler = (_req, _res, next) => {
  // Request handling is now automatic with expressIntegration
  next()
}

/**
 * Express tracing handler middleware
 * Add this BEFORE your routes (after requestHandler)
 * In Sentry Node SDK v9+, this is handled automatically by the express integration
 */
export const sentryTracingHandler: RequestHandler = (_req, _res, next) => {
  // Tracing is now automatic with expressIntegration
  next()
}

/**
 * Express error handler middleware
 * Add this AFTER all your routes and before other error handlers
 */
export const sentryErrorHandler: ErrorRequestHandler = (
  error: Error & { status?: number; statusCode?: number },
  _req,
  _res,
  next,
) => {
  // Capture errors with Sentry
  const status = error.status || error.statusCode || 500
  if (status >= 400) {
    Sentry.captureException(error)
  }
  next(error)
}

/**
 * Middleware to set user context from request
 * Add this AFTER authentication middleware
 */
export function sentryUserMiddleware(
  getUserFromRequest: (req: Request) => SentryUserContext | null,
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = getUserFromRequest(req)
      if (user) {
        setSentryUser(user)
      }
    } catch (error) {
      // Don't fail the request if user extraction fails
      console.error('[Sentry] Failed to extract user context:', error)
    }
    next()
  }
}

/**
 * Set user context for error tracking
 * Call this after user authentication
 */
export function setSentryUser(user: SentryUserContext): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
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
 * Clear user context
 */
export function clearSentryUser(): void {
  Sentry.setUser(null)
  Sentry.setTag('user.role', undefined)
  Sentry.setTag('user.tenant', undefined)
}

/**
 * Add breadcrumb for tracking actions
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
    user?: SentryUserContext
  },
): string {
  if (context?.user) {
    setSentryUser(context.user)
  }

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
 * Flush all events before shutdown
 * Call this before process exit
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout)
}

// Re-export Sentry for direct access if needed
export { Sentry }
