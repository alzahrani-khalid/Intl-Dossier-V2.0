import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Unified Express.Request.user type declaration
 *
 * Single source of truth for the authenticated user shape.
 * organization_id is ALWAYS fetched from the profiles table -- never hardcoded.
 * role uses a strict union type matching the RBAC hierarchy.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: 'super_admin' | 'admin' | 'manager' | 'editor' | 'viewer'
        organization_id: string
        clearance_level: number
        permissions: string[]
        fullName?: string
        department?: string
      }
      supabase?: SupabaseClient
      rateLimit?: {
        limit: number
        current: number
        remaining: number
        resetTime: Date
      }
    }
  }
}

export {}
