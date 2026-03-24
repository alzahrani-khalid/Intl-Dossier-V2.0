/**
 * Supabase Authentication Middleware - Backward Compatibility Layer
 *
 * This file re-exports from the unified auth middleware.
 * The hardcoded DEFAULT_ORGANIZATION_ID has been eliminated.
 * Organization ID is now always fetched from the profiles table.
 */

// Re-export from unified auth middleware for backward compatibility
export { authenticateToken as supabaseAuth } from './auth'
export { optionalAuth as optionalSupabaseAuth } from './auth'
