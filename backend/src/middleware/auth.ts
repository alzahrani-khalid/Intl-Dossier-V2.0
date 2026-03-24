import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabase'
import { UnauthorizedError, ForbiddenError } from '../utils/validation'
import { logInfo, logError } from '../utils/logger'

// Type declaration is in backend/src/types/express.d.ts -- do NOT redeclare here

/**
 * Decoded custom JWT payload structure (legacy fallback)
 */
interface DecodedJWT {
  userId: string
  email?: string
  role?: string
  iat?: number
  exp?: number
}

/**
 * Type guard to validate decoded JWT has required fields
 */
function isValidDecodedJWT(decoded: unknown): decoded is DecodedJWT {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    'userId' in decoded &&
    typeof (decoded as DecodedJWT).userId === 'string'
  )
}

// JWT_SECRET for legacy custom JWT fallback
const JWT_SECRET = process.env.JWT_SECRET || ''

/**
 * Fetch user profile data from users + profiles tables.
 * Returns a populated req.user shape or throws UnauthorizedError.
 */
async function fetchUserContext(userId: string): Promise<NonNullable<Express.Request['user']>> {
  // Fetch from users table
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, role, full_name, department, is_active, permissions')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new UnauthorizedError('User not found')
  }

  if (!user.is_active) {
    throw new UnauthorizedError('Account is inactive')
  }

  // Fetch organization_id and clearance_level from profiles table (per D-02)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('organization_id, clearance_level, role')
    .eq('user_id', userId)
    .single()

  // Use profile data when available, fall back to users table
  const role = (profile?.role || user.role || 'viewer') as NonNullable<Express.Request['user']>['role']
  const organizationId = profile?.organization_id
  const clearanceLevel = profile?.clearance_level ?? 1

  if (!organizationId) {
    logError('User has no organization_id in profiles table', undefined, {
      userId,
      email: user.email,
    })
    throw new UnauthorizedError('User profile incomplete - no organization assigned')
  }

  return {
    id: user.id,
    email: user.email,
    role,
    organization_id: organizationId,
    clearance_level: clearanceLevel,
    permissions: user.permissions || [],
    fullName: user.full_name || undefined,
    department: user.department || undefined,
  }
}

/**
 * Unified auth middleware: Supabase Auth first, custom JWT fallback.
 *
 * 1. Extract Bearer token from Authorization header
 * 2. Try Supabase Auth (server-side token validation)
 * 3. If Supabase fails, try custom JWT verification (backward compat)
 * 4. Fetch user + profile data from DB
 * 5. Populate req.user with unified type
 */
export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1] // Bearer TOKEN

    if (!token) {
      throw new UnauthorizedError('No token provided')
    }

    let userId: string | null = null

    // Strategy 1: Supabase Auth (primary)
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (!authError && authData?.user) {
      userId = authData.user.id
    }

    // Strategy 2: Custom JWT fallback (legacy compatibility)
    if (!userId && JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        if (isValidDecodedJWT(decoded)) {
          userId = decoded.userId
        }
      } catch (jwtError) {
        if (jwtError instanceof jwt.TokenExpiredError) {
          throw new UnauthorizedError('Token expired')
        }
        // If both strategies fail, the token is invalid
        if (authError) {
          throw new UnauthorizedError('Invalid or expired token')
        }
      }
    }

    if (!userId) {
      throw new UnauthorizedError('Invalid or expired token')
    }

    // Fetch full user context from DB (users + profiles tables)
    req.user = await fetchUserContext(userId)

    logInfo('User authenticated', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      organization_id: req.user.organization_id,
    })

    next()
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error)
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'))
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid or expired token'))
    } else {
      next(error)
    }
  }
}

/**
 * Check if user has required role (legacy -- prefer rbac.ts requireMinRole)
 */
export const requireRole = (roles: string[]): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
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
export const requirePermission = (permissions: string[]): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
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
 * Optional authentication - doesn't fail if no token.
 * Uses the same Supabase-first strategy.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return next()
    }

    let userId: string | null = null

    // Try Supabase Auth first
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (!authError && authData?.user) {
      userId = authData.user.id
    }

    // Try custom JWT fallback
    if (!userId && JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        if (isValidDecodedJWT(decoded)) {
          userId = decoded.userId
        }
      } catch {
        // Silently continue without auth
      }
    }

    if (userId) {
      try {
        req.user = await fetchUserContext(userId)
      } catch {
        // User lookup failed, continue without auth
      }
    }

    next()
  } catch (error) {
    logError('Optional auth failed', error as Error)
    next()
  }
}

/**
 * Verify user owns the resource or is admin/super_admin
 */
export const requireOwnershipOrAdmin = (
  getResourceOwnerId: (req: Request) => Promise<string>,
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError())
      }

      // Admins and super_admins can access everything
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
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
