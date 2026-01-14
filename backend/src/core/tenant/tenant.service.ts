/**
 * Tenant Service
 *
 * Handles tenant resolution and membership verification using the database
 * tenant isolation layer functions.
 *
 * @module tenant-service
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { TenantContext, TenantContextOptions } from './tenant-context'

/**
 * Organization member data
 */
export interface OrganizationMember {
  organization_id: string
  user_id: string
  role: string
  joined_at: string
  left_at: string | null
}

/**
 * Tenant resolution result
 */
export interface TenantResolutionResult {
  success: boolean
  context?: TenantContext
  error?: string
}

/**
 * Tenant membership info
 */
export interface TenantMembership {
  tenantId: string
  role: string
  isPrimary: boolean
}

/**
 * TenantService handles tenant resolution and membership verification
 * using the database tenant isolation functions.
 */
export class TenantService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Resolve tenant context for a user
   */
  async resolveTenantContext(
    userId: string,
    userRole: string,
    options: TenantContextOptions = {},
  ): Promise<TenantResolutionResult> {
    try {
      // Get all tenant memberships for the user
      const memberships = await this.getUserMemberships(userId)

      if (memberships.length === 0) {
        return {
          success: false,
          error: 'User is not a member of any organization',
        }
      }

      // Determine the active tenant
      let activeTenantId: string

      if (options.overrideTenantId) {
        // Verify user has access to the override tenant
        const hasAccess = memberships.some((m) => m.tenantId === options.overrideTenantId)

        if (!hasAccess && userRole !== 'admin') {
          return {
            success: false,
            error: 'User does not have access to the specified tenant',
          }
        }

        activeTenantId = options.overrideTenantId
      } else {
        // Use primary tenant or first available
        const primary = memberships.find((m) => m.isPrimary)
        activeTenantId = primary?.tenantId ?? memberships[0].tenantId
      }

      // Set tenant context in database session
      await this.setDatabaseTenantContext(activeTenantId, userId)

      return {
        success: true,
        context: {
          tenantId: activeTenantId,
          userId,
          role: userRole,
          accessibleTenants: memberships.map((m) => m.tenantId),
          strictMode: options.strictMode ?? false,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve tenant context',
      }
    }
  }

  /**
   * Get all tenant memberships for a user
   */
  async getUserMemberships(userId: string): Promise<TenantMembership[]> {
    // Get memberships from organization_members table
    const { data: memberships, error } = await this.supabase
      .from('organization_members')
      .select('organization_id, role, joined_at')
      .eq('user_id', userId)
      .is('left_at', null)
      .order('joined_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch user memberships: ${error.message}`)
    }

    if (!memberships || memberships.length === 0) {
      return []
    }

    // Get user's default organization
    const { data: user } = await this.supabase
      .from('users')
      .select('default_organization_id')
      .eq('id', userId)
      .single()

    const defaultOrgId = user?.default_organization_id

    return memberships.map((m, index) => ({
      tenantId: m.organization_id,
      role: m.role || 'member',
      isPrimary: m.organization_id === defaultOrgId || (index === 0 && !defaultOrgId),
    }))
  }

  /**
   * Check if user is a member of a specific tenant
   */
  async isTenantMember(userId: string, tenantId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('tenant_isolation.is_tenant_member', {
      p_tenant_id: tenantId,
      p_user_id: userId,
    })

    if (error) {
      // Fall back to direct query if RPC fails
      const { data: membership } = await this.supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', tenantId)
        .is('left_at', null)
        .single()

      return !!membership
    }

    return data === true
  }

  /**
   * Set tenant context in the database session
   */
  async setDatabaseTenantContext(tenantId: string, userId: string): Promise<void> {
    try {
      await this.supabase.rpc('tenant_isolation.set_tenant_context', {
        p_tenant_id: tenantId,
        p_user_id: userId,
      })
    } catch {
      // RPC might not be available yet, continue without it
      // The RLS policies will still enforce tenant isolation
    }
  }

  /**
   * Clear tenant context in the database session
   */
  async clearDatabaseTenantContext(): Promise<void> {
    try {
      await this.supabase.rpc('tenant_isolation.clear_tenant_context')
    } catch {
      // RPC might not be available yet
    }
  }

  /**
   * Get tenant IDs that a user can access
   */
  async getAccessibleTenants(userId: string): Promise<string[]> {
    const memberships = await this.getUserMemberships(userId)
    return memberships.map((m) => m.tenantId)
  }

  /**
   * Validate tenant access for an entity
   */
  async validateEntityTenantAccess(
    userId: string,
    entityTenantId: string,
    userRole: string,
  ): Promise<{ valid: boolean; error?: string }> {
    // Admins can access all tenants
    if (userRole === 'admin') {
      return { valid: true }
    }

    const hasAccess = await this.isTenantMember(userId, entityTenantId)

    if (!hasAccess) {
      return {
        valid: false,
        error: 'User does not have access to this tenant',
      }
    }

    return { valid: true }
  }

  /**
   * Log a cross-tenant access attempt
   */
  async logAccessViolation(
    userId: string,
    attemptedTenantId: string,
    tableName: string,
    operation: string,
  ): Promise<void> {
    try {
      await this.supabase.rpc('tenant_isolation.log_access_violation', {
        p_user_id: userId,
        p_attempted_tenant_id: attemptedTenantId,
        p_table_name: tableName,
        p_operation: operation,
      })
    } catch {
      // Logging failure should not block the operation
      console.error('Failed to log access violation', {
        userId,
        attemptedTenantId,
        tableName,
        operation,
      })
    }
  }
}

/**
 * Factory function to create a TenantService instance
 */
export function createTenantService(supabase: SupabaseClient): TenantService {
  return new TenantService(supabase)
}
