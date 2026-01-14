/**
 * Tenant Context Middleware
 *
 * Resolves and sets the tenant context for each request based on user
 * membership and request parameters.
 *
 * @module tenant-context-middleware
 */

import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import logger from '../utils/logger.js'
import {
  TenantContextManager,
  TenantService,
  TenantContext,
  createTenantContextManager,
  createTenantService,
} from '../core/tenant/index.js'

// Extend Express Request type for tenant context
declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContextManager
      tenantService?: TenantService
    }
  }
}

/**
 * Options for tenant context middleware
 */
export interface TenantContextMiddlewareOptions {
  /** Require tenant context (fail if not resolvable) */
  required?: boolean
  /** Enable strict mode (single tenant access) */
  strictMode?: boolean
  /** Header name for tenant override */
  tenantHeader?: string
}

/**
 * Creates the tenant context middleware
 */
export function createTenantContextMiddleware(
  options: TenantContextMiddlewareOptions = {},
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const { required = true, strictMode = false, tenantHeader = 'x-tenant-id' } = options

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip if no user (let auth middleware handle this)
      if (!req.user?.id) {
        if (required) {
          res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required for tenant context',
          })
          return
        }
        return next()
      }

      // Create services
      const tenantService = createTenantService(supabaseAdmin)
      const tenantContextManager = createTenantContextManager()

      // Check for tenant override in header
      const overrideTenantId = req.headers[tenantHeader] as string | undefined

      // Resolve tenant context
      const result = await tenantService.resolveTenantContext(req.user.id, req.user.role, {
        strictMode,
        overrideTenantId,
      })

      if (!result.success) {
        if (required) {
          logger.warn('Failed to resolve tenant context', {
            userId: req.user.id,
            error: result.error,
          })

          res.status(403).json({
            error: 'Forbidden',
            message: result.error || 'Unable to resolve tenant context',
          })
          return
        }

        // Continue without tenant context if not required
        return next()
      }

      // Initialize the context manager
      tenantContextManager.initialize(result.context as TenantContext)

      // Attach to request
      req.tenantContext = tenantContextManager
      req.tenantService = tenantService

      // Also update req.user with resolved tenant info
      req.user.organization_id = result.context!.tenantId
      req.user.tenantId = result.context!.tenantId

      logger.debug('Tenant context resolved', {
        userId: req.user.id,
        tenantId: result.context!.tenantId,
        accessibleTenants: result.context!.accessibleTenants.length,
        strictMode: result.context!.strictMode,
      })

      next()
    } catch (error) {
      logger.error('Tenant context middleware error', { error })

      if (required) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to resolve tenant context',
        })
        return
      }

      next()
    }
  }
}

/**
 * Default tenant context middleware (required, non-strict mode)
 */
export const tenantContextMiddleware = createTenantContextMiddleware({
  required: true,
  strictMode: false,
})

/**
 * Optional tenant context middleware
 */
export const optionalTenantContextMiddleware = createTenantContextMiddleware({
  required: false,
  strictMode: false,
})

/**
 * Strict tenant context middleware (single tenant access)
 */
export const strictTenantContextMiddleware = createTenantContextMiddleware({
  required: true,
  strictMode: true,
})

/**
 * Middleware to require tenant context on a route
 * Use after authentication middleware
 */
export function requireTenantContext(req: Request, res: Response, next: NextFunction): void {
  if (!req.tenantContext?.getContext()) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Tenant context required for this operation',
    })
    return
  }
  next()
}

/**
 * Middleware to validate tenant access for a specific entity
 */
export function validateTenantAccess(entityTenantIdParam: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = req.tenantContext?.getContext()

      if (!context) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Tenant context required',
        })
        return
      }

      // Get entity tenant ID from params or body
      const entityTenantId = req.params[entityTenantIdParam] || req.body[entityTenantIdParam]

      if (!entityTenantId) {
        res.status(400).json({
          error: 'Bad Request',
          message: `${entityTenantIdParam} is required`,
        })
        return
      }

      // Validate access
      const validation = req.tenantContext!.validateTenantAccess(entityTenantId)

      if (!validation.valid) {
        logger.warn('Tenant access validation failed', {
          userId: context.userId,
          entityTenantId,
          userTenants: context.accessibleTenants,
          error: validation.error,
        })

        // Log access violation
        await req.tenantService?.logAccessViolation(
          context.userId,
          entityTenantId,
          req.path,
          req.method,
        )

        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this resource',
        })
        return
      }

      next()
    } catch (error) {
      logger.error('Tenant access validation error', { error })
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate tenant access',
      })
    }
  }
}

/**
 * Helper to get tenant ID from request
 */
export function getTenantId(req: Request): string | null {
  return req.tenantContext?.getContext()?.tenantId ?? null
}

/**
 * Helper to get all accessible tenant IDs from request
 */
export function getAccessibleTenants(req: Request): string[] {
  return req.tenantContext?.getContext()?.accessibleTenants ?? []
}

/**
 * Helper to check if request has tenant context
 */
export function hasTenantContext(req: Request): boolean {
  return !!req.tenantContext?.getContext()
}

export default tenantContextMiddleware
