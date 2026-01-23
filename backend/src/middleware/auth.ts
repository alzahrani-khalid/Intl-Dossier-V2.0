import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabase'
import { UnauthorizedError, ForbiddenError } from '../utils/validation'
import { logInfo, logError } from '../utils/logger'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        tenantId: string
        permissions: string[]
      }
    }
  }
}

// Require JWT_SECRET - fail fast if not configured
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. Application cannot start without it.',
  )
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      throw new UnauthorizedError('No token provided')
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Verify user still exists and is active
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, tenant_id, is_active, permissions')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      throw new UnauthorizedError('Invalid token')
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is inactive')
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      permissions: user.permissions || [],
    }

    logInfo('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'))
    } else {
      next(error)
    }
  }
}

/**
 * Check if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError())
    }

    if (!roles.includes(req.user.role)) {
      logInfo('Access denied - insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
      })
      return next(new ForbiddenError('Insufficient role privileges'))
    }

    next()
  }
}

/**
 * Check if user has required permissions
 */
export const requirePermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError())
    }

    const hasPermission = permissions.some((permission) =>
      req.user!.permissions.includes(permission),
    )

    if (!hasPermission) {
      logInfo('Access denied - insufficient permissions', {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermissions: permissions,
      })
      return next(new ForbiddenError('Insufficient permissions'))
    }

    next()
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next() // Continue without authentication
    }

    // Try to verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Try to get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, role, tenant_id, permissions, is_active')
      .eq('id', decoded.userId)
      .single()

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        permissions: user.permissions || [],
      }
    }

    next()
  } catch (error) {
    // Log error but continue without authentication
    logError('Optional auth failed', error as Error)
    next()
  }
}

/**
 * Verify user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (getResourceOwnerId: (req: Request) => Promise<string>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError())
      }

      // Admins can access everything
      if (req.user.role === 'admin') {
        return next()
      }

      const ownerId = await getResourceOwnerId(req)

      if (ownerId !== req.user.id) {
        return next(new ForbiddenError('Access denied to this resource'))
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Export aliases for compatibility
export const authenticate = authenticateToken
