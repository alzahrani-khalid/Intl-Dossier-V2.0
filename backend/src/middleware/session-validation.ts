/**
 * Session Validation Middleware
 *
 * Validates user sessions against Redis whitelist for enhanced security.
 * Implements session whitelisting to allow immediate session termination
 * on role changes or security events.
 *
 * Feature: 019-user-management-access
 * Task: T017
 *
 * @module middleware/session-validation
 */

import { Request, Response, NextFunction } from 'express';
import { validateSession, refreshSession } from '../config/redis';
import { logWarn, logError } from '../utils/logger';

/**
 * Extended Express Request with session data
 */
export interface SessionRequest extends Request {
  sessionData?: {
    userId: string;
    sessionId: string;
    createdAt: string;
    [key: string]: unknown;
  };
}

/**
 * Session validation middleware
 *
 * Validates that the session exists in Redis whitelist and is not expired.
 * Automatically refreshes session TTL on successful validation.
 *
 * Usage:
 * ```typescript
 * app.use('/api/protected', validateSessionMiddleware);
 * ```
 */
export async function validateSessionMiddleware(
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract session ID from Authorization header or cookie
    const sessionId = extractSessionId(req);

    if (!sessionId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No session token provided',
      });
      return;
    }

    // Validate session against Redis whitelist
    const sessionData = await validateSession(sessionId);

    if (!sessionData) {
      logWarn('Session validation failed', { sessionId });
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session',
      });
      return;
    }

    // Attach session data to request
    req.sessionData = {
      userId: sessionData.userId as string,
      sessionId,
      createdAt: sessionData.createdAt as string,
      ...sessionData,
    };

    // Refresh session TTL (extend session lifetime)
    await refreshSession(sessionId);

    next();
  } catch (error) {
    logError('Session validation error', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Session validation failed',
    });
  }
}

/**
 * Extract session ID from request
 *
 * Supports multiple methods:
 * 1. Authorization header: Bearer <sessionId>
 * 2. Cookie: sessionId=<sessionId>
 * 3. Custom header: X-Session-ID
 *
 * @param req - Express request
 * @returns Session ID or null
 */
function extractSessionId(req: Request): string | null {
  // Method 1: Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Method 2: Cookie
  const cookieSessionId = req.cookies?.sessionId;
  if (cookieSessionId) {
    return cookieSessionId;
  }

  // Method 3: Custom header
  const customHeader = req.headers['x-session-id'];
  if (customHeader && typeof customHeader === 'string') {
    return customHeader;
  }

  return null;
}

/**
 * Optional session validation middleware
 *
 * Similar to validateSessionMiddleware but doesn't fail if no session is present.
 * Useful for endpoints that work for both authenticated and anonymous users.
 *
 * Usage:
 * ```typescript
 * app.use('/api/public', optionalSessionMiddleware);
 * ```
 */
export async function optionalSessionMiddleware(
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = extractSessionId(req);

    if (!sessionId) {
      // No session provided, continue without session data
      next();
      return;
    }

    // Validate session if provided
    const sessionData = await validateSession(sessionId);

    if (sessionData) {
      req.sessionData = {
        userId: sessionData.userId as string,
        sessionId,
        createdAt: sessionData.createdAt as string,
        ...sessionData,
      };

      // Refresh session TTL
      await refreshSession(sessionId);
    }

    next();
  } catch (error) {
    logError('Optional session validation error', error);
    // Don't fail the request, just continue without session
    next();
  }
}

/**
 * Role-based access control middleware factory
 *
 * Creates middleware that checks if user has required role(s).
 * Must be used after validateSessionMiddleware.
 *
 * @param allowedRoles - Array of allowed roles
 * @returns Express middleware
 *
 * Usage:
 * ```typescript
 * app.use('/api/admin', validateSessionMiddleware, requireRole(['admin', 'super_admin']));
 * ```
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: SessionRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.sessionData?.userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Session required',
        });
        return;
      }

      // Fetch user role from database or session data
      const userRole = req.sessionData.role as string;

      if (!userRole || !allowedRoles.includes(userRole)) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          requiredRoles: allowedRoles,
        });
        return;
      }

      next();
    } catch (error) {
      logError('Role validation error', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Role validation failed',
      });
    }
  };
}
