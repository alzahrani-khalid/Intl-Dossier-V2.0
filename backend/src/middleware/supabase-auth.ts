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

// Default organization ID for single-tenant setup (existing org from database)
const DEFAULT_ORGANIZATION_ID = '4d931519-07f6-4568-8043-7af6fde581a6'

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
      // User exists in Supabase Auth but not in users table - allow with minimal info
      logger.info('User profile not found in users table, using auth data', { userId: user.id })
      req.user = {
        id: user.id,
        email: user.email || '',
        role: 'user',
        organization_id: DEFAULT_ORGANIZATION_ID,
        tenantId: DEFAULT_ORGANIZATION_ID,
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

    // Populate req.user
    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role || 'user',
      organization_id: DEFAULT_ORGANIZATION_ID,
      tenantId: DEFAULT_ORGANIZATION_ID,
      fullName: userProfile.full_name,
      department: userProfile.department,
      permissions: [],
    }

    logger.info('Supabase user authenticated', {
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
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
      req.user = {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role || 'user',
        organization_id: DEFAULT_ORGANIZATION_ID,
        tenantId: DEFAULT_ORGANIZATION_ID,
        fullName: userProfile.full_name,
        department: userProfile.department,
        permissions: [],
      }
    } else if (user) {
      // User exists in auth but not in users table - use minimal info
      req.user = {
        id: user.id,
        email: user.email || '',
        role: 'user',
        organization_id: DEFAULT_ORGANIZATION_ID,
        tenantId: DEFAULT_ORGANIZATION_ID,
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
