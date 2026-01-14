/**
 * Scope Middleware
 *
 * Express middleware for managing DI scopes per request.
 * Automatically creates request-scoped containers and handles disposal.
 *
 * @module container/scope-middleware
 */

import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'
import { IServiceScope } from './interfaces'
import { ServiceProvider, getServiceProvider } from './service-provider'

// Extended request type for internal use
interface ExtendedRequest extends Request {
  tenantContext?: {
    getContext(): { tenantId?: string } | null
  }
  user?: {
    id?: string
    organization_id?: string
    [key: string]: unknown
  }
}

/**
 * Extend Express Request type for DI scope
 */
declare global {
  namespace Express {
    interface Request {
      /** The DI scope for this request */
      scope?: IServiceScope
      /** Request ID for tracing */
      requestId?: string
    }
  }
}

/**
 * Options for scope middleware
 */
export interface ScopeMiddlewareOptions {
  /** Custom service provider (uses global if not provided) */
  provider?: ServiceProvider
  /** Function to extract tenant ID from request */
  getTenantId?: (req: Request) => string | undefined
  /** Function to extract user ID from request */
  getUserId?: (req: Request) => string | undefined
  /** Header name for request ID */
  requestIdHeader?: string
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Default tenant ID extractor
 */
function defaultGetTenantId(req: Request): string | undefined {
  const extReq = req as ExtendedRequest

  // Try tenant context first
  const tenantContext = extReq.tenantContext?.getContext()
  if (tenantContext?.tenantId) {
    return tenantContext.tenantId
  }

  // Try user object
  if (extReq.user?.organization_id) {
    return extReq.user.organization_id
  }

  // Try header
  return req.headers['x-tenant-id'] as string | undefined
}

/**
 * Default user ID extractor
 */
function defaultGetUserId(req: Request): string | undefined {
  const extReq = req as ExtendedRequest
  return extReq.user?.id
}

/**
 * Creates the scope middleware
 *
 * This middleware:
 * 1. Creates a request-scoped DI container
 * 2. Optionally uses tenant-level scope as parent
 * 3. Attaches scope to request
 * 4. Automatically disposes scope on response finish
 */
export function createScopeMiddleware(
  options: ScopeMiddlewareOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    provider,
    getTenantId = defaultGetTenantId,
    getUserId = defaultGetUserId,
    requestIdHeader = 'x-request-id',
    debug = false,
  } = options

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const serviceProvider = provider ?? getServiceProvider()

      // Get or generate request ID
      const requestId = (req.headers[requestIdHeader] as string) ?? randomUUID()
      req.requestId = requestId

      // Set response header for request ID
      res.setHeader('x-request-id', requestId)

      // Get tenant and user IDs
      const tenantId = getTenantId(req)
      const userId = getUserId(req)

      // Determine parent scope
      let parentScope: IServiceScope

      if (tenantId) {
        // Use tenant-level scope as parent
        parentScope = serviceProvider.createTenantScope(tenantId)

        if (debug) {
          console.log(`[DI] Created/retrieved tenant scope: ${tenantId} for request ${requestId}`)
        }
      } else {
        // Use root scope as parent
        parentScope = serviceProvider.getRootScope()

        if (debug) {
          console.log(`[DI] Using root scope for request ${requestId}`)
        }
      }

      // Create request scope
      const requestScope = serviceProvider.createRequestScope(parentScope, requestId, userId)

      req.scope = requestScope

      if (debug) {
        console.log(
          `[DI] Created request scope: ${requestScope.id} (tenant: ${tenantId ?? 'none'}, user: ${userId ?? 'anonymous'})`,
        )
      }

      // Handle scope disposal on response finish
      const cleanup = async () => {
        try {
          if (req.scope) {
            await req.scope.dispose()

            if (debug) {
              console.log(`[DI] Disposed request scope: ${requestScope.id}`)
            }
          }
        } catch (error) {
          console.error('[DI] Error disposing request scope:', error)
        }
      }

      // Listen for response finish/close
      res.on('finish', cleanup)
      res.on('close', cleanup)

      next()
    } catch (error) {
      console.error('[DI] Scope middleware error:', error)
      next(error)
    }
  }
}

/**
 * Default scope middleware instance
 */
export const scopeMiddleware = createScopeMiddleware()

/**
 * Helper to get the request scope
 */
export function getRequestScope(req: Request): IServiceScope {
  if (!req.scope) {
    throw new Error('Request scope not available. Ensure scopeMiddleware is applied.')
  }
  return req.scope
}

/**
 * Helper to resolve a service from request scope
 */
export function resolveFromRequest<T>(req: Request, token: symbol): T {
  return getRequestScope(req).resolve<T>(token)
}

/**
 * Helper to try resolving a service from request scope
 */
export function tryResolveFromRequest<T>(req: Request, token: symbol): T | undefined {
  if (!req.scope) {
    return undefined
  }
  return req.scope.tryResolve<T>(token)
}

/**
 * Decorator factory for request-scoped resolution
 * Use with controller methods
 */
export function InjectFromScope<T>(token: symbol) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = function (req: Request, res: Response, ...args: unknown[]) {
      const service = resolveFromRequest<T>(req, token)
      return originalMethod.call(this, req, res, service, ...args)
    }

    return descriptor
  }
}
