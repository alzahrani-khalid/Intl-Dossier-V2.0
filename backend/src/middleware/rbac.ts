import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError, ForbiddenError } from '../utils/validation'
import { logInfo } from '../utils/logger'

/**
 * Hierarchical role levels for RBAC.
 * Higher number = more privileges.
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  admin: 80,
  manager: 60,
  editor: 40,
  viewer: 20,
}

/**
 * Require a minimum role level in the hierarchy.
 * E.g., requireMinRole('editor') allows editor, manager, admin, super_admin.
 */
export const requireMinRole = (
  minRole: keyof typeof ROLE_HIERARCHY,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0

    if (userLevel < requiredLevel) {
      logInfo('Access denied - insufficient role level', {
        userId: req.user.id,
        userRole: req.user.role,
        userLevel,
        requiredRole: minRole,
        requiredLevel,
      })
      return next(new ForbiddenError(`Requires minimum role: ${minRole}`))
    }

    next()
  }
}

/**
 * Require at least one of the specified permissions.
 */
export const requirePermission = (
  permissions: string[],
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    const hasPermission = permissions.some((p) => req.user!.permissions.includes(p))

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
 * Require a minimum clearance level (1-5).
 */
export const requireClearance = (
  minLevel: number,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'))
    }

    if ((req.user.clearance_level ?? 0) < minLevel) {
      logInfo('Access denied - insufficient clearance', {
        userId: req.user.id,
        userClearance: req.user.clearance_level,
        requiredClearance: minLevel,
      })
      return next(new ForbiddenError(`Requires clearance level ${minLevel} or higher`))
    }

    next()
  }
}
