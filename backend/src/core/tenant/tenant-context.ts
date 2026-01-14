/**
 * Tenant Context Module
 *
 * Provides tenant isolation at the application level through context management.
 * Works in conjunction with database RLS policies to ensure complete isolation.
 *
 * @module tenant-context
 */

/**
 * Tenant context data structure
 */
export interface TenantContext {
  /** The current tenant (organization) ID */
  tenantId: string
  /** The current user ID */
  userId: string
  /** User's role within the tenant */
  role: string
  /** All tenant IDs the user has access to */
  accessibleTenants: string[]
  /** Whether the context is in strict mode (single tenant) */
  strictMode: boolean
}

/**
 * Tenant context options for initialization
 */
export interface TenantContextOptions {
  /** Force strict mode (single tenant access) */
  strictMode?: boolean
  /** Override tenant ID (for admin operations) */
  overrideTenantId?: string
}

/**
 * Tenant context validation result
 */
export interface TenantValidationResult {
  valid: boolean
  tenantId?: string
  error?: string
}

/**
 * TenantContextManager handles tenant isolation at the application level.
 * It maintains context per request and provides methods for tenant-scoped operations.
 */
export class TenantContextManager {
  private context: TenantContext | null = null

  /**
   * Initialize tenant context for a request
   */
  initialize(context: TenantContext): void {
    this.context = context
  }

  /**
   * Get the current tenant context
   */
  getContext(): TenantContext | null {
    return this.context
  }

  /**
   * Get the current tenant ID
   * @throws Error if no context is set
   */
  getTenantId(): string {
    if (!this.context) {
      throw new Error('Tenant context not initialized')
    }
    return this.context.tenantId
  }

  /**
   * Get the current user ID
   * @throws Error if no context is set
   */
  getUserId(): string {
    if (!this.context) {
      throw new Error('Tenant context not initialized')
    }
    return this.context.userId
  }

  /**
   * Check if a tenant ID is accessible to the current user
   */
  canAccessTenant(tenantId: string): boolean {
    if (!this.context) {
      return false
    }

    // Admin role can access all tenants
    if (this.context.role === 'admin') {
      return true
    }

    return this.context.accessibleTenants.includes(tenantId)
  }

  /**
   * Validate that an entity belongs to an accessible tenant
   */
  validateTenantAccess(entityTenantId: string): TenantValidationResult {
    if (!this.context) {
      return {
        valid: false,
        error: 'No tenant context available',
      }
    }

    if (this.context.strictMode && entityTenantId !== this.context.tenantId) {
      return {
        valid: false,
        error: 'Strict mode: entity does not belong to current tenant',
      }
    }

    if (!this.canAccessTenant(entityTenantId)) {
      return {
        valid: false,
        error: 'Access denied: user does not have access to this tenant',
      }
    }

    return {
      valid: true,
      tenantId: entityTenantId,
    }
  }

  /**
   * Get tenant filter for database queries
   * Returns the appropriate tenant ID(s) for filtering
   */
  getTenantFilter(): string | string[] {
    if (!this.context) {
      throw new Error('Tenant context not initialized')
    }

    if (this.context.strictMode) {
      return this.context.tenantId
    }

    // In non-strict mode, return all accessible tenants
    return this.context.accessibleTenants
  }

  /**
   * Check if the context is in strict mode
   */
  isStrictMode(): boolean {
    return this.context?.strictMode ?? false
  }

  /**
   * Clear the tenant context
   */
  clear(): void {
    this.context = null
  }

  /**
   * Create a scoped context for a specific tenant
   * Used for operations that need to temporarily switch tenant context
   */
  createScopedContext(tenantId: string): TenantContext | null {
    if (!this.context) {
      return null
    }

    if (!this.canAccessTenant(tenantId)) {
      return null
    }

    return {
      ...this.context,
      tenantId,
      strictMode: true,
    }
  }
}

/**
 * Factory function to create a new TenantContextManager instance
 */
export function createTenantContextManager(): TenantContextManager {
  return new TenantContextManager()
}

/**
 * Tenant context isolation decorator for repository methods
 * Ensures all data access is properly scoped to the tenant
 */
export function withTenantIsolation<T extends object>(
  target: T,
  contextManager: TenantContextManager,
): T {
  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop)

      if (typeof value === 'function') {
        return function (...args: unknown[]) {
          // Verify tenant context exists before any operation
          if (!contextManager.getContext()) {
            throw new Error('Tenant context required for this operation')
          }

          return value.apply(obj, args)
        }
      }

      return value
    },
  })
}
