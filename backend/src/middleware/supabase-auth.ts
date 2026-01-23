/**
 * Supabase Authentication Middleware
 * Feature: 033-ai-brief-generation
 *
 * Verifies Supabase JWT tokens and populates req.user
 * Used for AI routes that receive tokens from frontend Supabase auth
 */

import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../config/supabase.js'
import logger from '../utils/logger.js'

// Extend Express Request type for Supabase user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        organization_id: string
        tenantId?: string
        fullName?: string
        department?: string
        permissions?: string[]
      }
    }
  }
}

/**
 * Resolve user's organization from database
 * Returns the user's default organization or first active membership
 * Returns null if user has no organization memberships
 *
 * @param userId - User ID to resolve organization for
 * @returns Organization ID or null
 */
async function resolveUserOrganization(userId: string): Promise<string | null> {
  try {
    // Get user's active organization memberships
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, joined_at')
      .eq('user_id', userId)
      .is('left_at', null)
      .order('joined_at', { ascending: true })

    if (membershipError) {
      logger.error('Failed to fetch user organization memberships', {
        userId,
        error: membershipError.message,
      })
      return null
    }

    if (!memberships || memberships.length === 0) {
      logger.warn('User has no active organization memberships', { userId })
      return null
    }

    // Get user's default organization preference
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('default_organization_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      logger.warn('Failed to fetch user default organization', {
        userId,
        error: profileError.message,
      })
      // Fall back to first membership if we can't get default
      return memberships[0].organization_id
    }

    // Check if default organization is in active memberships
    const defaultOrgId = userProfile?.default_organization_id
    if (defaultOrgId) {
      const hasDefaultMembership = memberships.some(
        (m) => m.organization_id === defaultOrgId,
      )
      if (hasDefaultMembership) {
        return defaultOrgId
      }
      logger.info('User default organization not in active memberships, using first membership', {
        userId,
        defaultOrgId,
      })
    }

    // Fall back to first joined organization
    return memberships[0].organization_id
  } catch (error) {
    logger.error('Error resolving user organization', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

/**
 * Middleware to verify Supabase JWT tokens
 * Extracts user info from the token and populates req.user
 */
export const supabaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      })
      return
    }

    // Verify the token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      logger.warn('Supabase auth failed', { error: authError?.message })
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      })
      return
    }

    // Get additional user info from the users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, full_name, department, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      // User exists in Supabase Auth but not in users table
      logger.info('User profile not found in users table, resolving organization', { userId: user.id })

      // Resolve user's organization from memberships
      const organizationId = await resolveUserOrganization(user.id)

      if (!organizationId) {
        logger.warn('Security: User has no organization membership', {
          userId: user.id,
          email: user.email,
        })
        res.status(403).json({
          error: 'Forbidden',
          message: 'User is not a member of any organization',
        })
        return
      }

      req.user = {
        id: user.id,
        email: user.email || '',
        role: 'user',
        organization_id: organizationId,
        tenantId: organizationId,
        permissions: [],
      }
      next()
      return
    }

    if (!userProfile.is_active) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Account is inactive',
      })
      return
    }

    // Resolve user's organization from memberships
    const organizationId = await resolveUserOrganization(userProfile.id)

    if (!organizationId) {
      logger.warn('Security: User has no organization membership', {
        userId: userProfile.id,
        email: userProfile.email,
      })
      res.status(403).json({
        error: 'Forbidden',
        message: 'User is not a member of any organization',
      })
      return
    }

    // Populate req.user
    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role || 'user',
      organization_id: organizationId,
      tenantId: organizationId,
      fullName: userProfile.full_name,
      department: userProfile.department,
      permissions: [],
    }

    logger.info('Supabase user authenticated', {
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      organizationId,
    })

    next()
  } catch (error) {
    logger.error('Supabase auth middleware error', { error })
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    })
  }
}

/**
 * Optional Supabase auth - doesn't fail if no token
 */
export const optionalSupabaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return next()
    }

    // Try to verify the token
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return next() // Continue without auth
    }

    // Get user profile
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('id, email, role, full_name, department, is_active')
      .eq('id', user.id)
      .single()

    if (userProfile && userProfile.is_active) {
      // Resolve user's organization from memberships
      const organizationId = await resolveUserOrganization(userProfile.id)

      if (!organizationId) {
        logger.warn('Optional auth: User has no organization membership, continuing without auth', {
          userId: userProfile.id,
          email: userProfile.email,
        })
        return next() // Continue without auth if no organization
      }

      req.user = {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role || 'user',
        organization_id: organizationId,
        tenantId: organizationId,
        fullName: userProfile.full_name,
        department: userProfile.department,
        permissions: [],
      }
    } else if (user) {
      // User exists in auth but not in users table - resolve organization
      const organizationId = await resolveUserOrganization(user.id)

      if (!organizationId) {
        logger.warn('Optional auth: User has no organization membership, continuing without auth', {
          userId: user.id,
          email: user.email,
        })
        return next() // Continue without auth if no organization
      }

      req.user = {
        id: user.id,
        email: user.email || '',
        role: 'user',
        organization_id: organizationId,
        tenantId: organizationId,
        permissions: [],
      }
    }

    next()
  } catch (error) {
    logger.error('Optional supabase auth error', { error })
    next() // Continue without auth on error
  }
}

export default supabaseAuth
