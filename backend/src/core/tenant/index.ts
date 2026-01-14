/**
 * Tenant Isolation Module
 *
 * Provides complete tenant isolation at the application level.
 * Works with database RLS policies to ensure data security.
 *
 * @module tenant
 */

export {
  TenantContext,
  TenantContextOptions,
  TenantValidationResult,
  TenantContextManager,
  createTenantContextManager,
  withTenantIsolation,
} from './tenant-context'

export {
  TenantService,
  TenantResolutionResult,
  TenantMembership,
  OrganizationMember,
  createTenantService,
} from './tenant.service'
