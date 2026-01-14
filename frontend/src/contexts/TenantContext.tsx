/**
 * Tenant Context Provider
 *
 * Provides tenant isolation context for the frontend application.
 * Works with the backend tenant isolation layer to ensure data security.
 *
 * @module TenantContext
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Organization membership information
 */
export interface OrganizationMembership {
  organizationId: string
  organizationName: string
  role: string
  isPrimary: boolean
  joinedAt: string
}

/**
 * Tenant context state
 */
export interface TenantContextState {
  /** Current active tenant (organization) ID */
  currentTenantId: string | null
  /** Current tenant name */
  currentTenantName: string | null
  /** All organizations the user has access to */
  memberships: OrganizationMembership[]
  /** Whether the tenant context is loading */
  isLoading: boolean
  /** Error message if any */
  error: string | null
  /** Whether user has multiple tenants */
  hasMultipleTenants: boolean
}

/**
 * Tenant context actions
 */
export interface TenantContextActions {
  /** Switch to a different tenant */
  switchTenant: (tenantId: string) => Promise<void>
  /** Refresh tenant memberships */
  refreshMemberships: () => Promise<void>
  /** Check if user can access a specific tenant */
  canAccessTenant: (tenantId: string) => boolean
  /** Get the tenant filter for API calls */
  getTenantFilter: () => string | null
}

/**
 * Combined tenant context
 */
export type TenantContextType = TenantContextState & TenantContextActions

/**
 * Default context state
 */
const defaultContextState: TenantContextState = {
  currentTenantId: null,
  currentTenantName: null,
  memberships: [],
  isLoading: true,
  error: null,
  hasMultipleTenants: false,
}

/**
 * Tenant context
 */
const TenantContext = createContext<TenantContextType | null>(null)

/**
 * Storage key for persisted tenant selection
 */
const TENANT_STORAGE_KEY = 'intl-dossier-current-tenant'

/**
 * Fetch user's organization memberships
 */
async function fetchMemberships(userId: string): Promise<OrganizationMembership[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
      organization_id,
      role,
      joined_at,
      organizations (
        id,
        name_en,
        name_ar
      )
    `,
    )
    .eq('user_id', userId)
    .is('left_at', null)
    .order('joined_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch memberships: ${error.message}`)
  }

  // Get user's default organization
  const { data: userData } = await supabase
    .from('users')
    .select('default_organization_id')
    .eq('id', userId)
    .single()

  const defaultOrgId = userData?.default_organization_id

  return (data || []).map((m, index) => ({
    organizationId: m.organization_id,
    organizationName: (m.organizations as { name_en?: string })?.name_en || 'Unknown',
    role: m.role || 'member',
    isPrimary: m.organization_id === defaultOrgId || (index === 0 && !defaultOrgId),
    joinedAt: m.joined_at,
  }))
}

/**
 * Provider props
 */
interface TenantProviderProps {
  children: ReactNode
  userId: string | null
}

/**
 * Tenant Context Provider Component
 */
export function TenantProvider({ children, userId }: TenantProviderProps) {
  const queryClient = useQueryClient()
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null)

  // Fetch memberships
  const {
    data: memberships = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tenant-memberships', userId],
    queryFn: () => fetchMemberships(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // Get current tenant name
  const currentTenantName = useMemo(() => {
    if (!currentTenantId) return null
    const membership = memberships.find((m) => m.organizationId === currentTenantId)
    return membership?.organizationName ?? null
  }, [currentTenantId, memberships])

  // Initialize tenant from storage or default
  useEffect(() => {
    if (memberships.length === 0) return

    // Try to get from storage
    const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY)

    if (storedTenantId && memberships.some((m) => m.organizationId === storedTenantId)) {
      setCurrentTenantId(storedTenantId)
      return
    }

    // Fall back to primary or first membership
    const primaryMembership = memberships.find((m) => m.isPrimary)
    const defaultTenantId = primaryMembership?.organizationId ?? memberships[0]?.organizationId

    if (defaultTenantId) {
      setCurrentTenantId(defaultTenantId)
      localStorage.setItem(TENANT_STORAGE_KEY, defaultTenantId)
    }
  }, [memberships])

  // Switch tenant
  const switchTenant = useCallback(
    async (tenantId: string) => {
      // Verify access
      if (!memberships.some((m) => m.organizationId === tenantId)) {
        throw new Error('You do not have access to this organization')
      }

      // Update state
      setCurrentTenantId(tenantId)
      localStorage.setItem(TENANT_STORAGE_KEY, tenantId)

      // Invalidate all queries to refetch with new tenant context
      await queryClient.invalidateQueries()
    },
    [memberships, queryClient],
  )

  // Refresh memberships
  const refreshMemberships = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Check tenant access
  const canAccessTenant = useCallback(
    (tenantId: string) => {
      return memberships.some((m) => m.organizationId === tenantId)
    },
    [memberships],
  )

  // Get tenant filter for API calls
  const getTenantFilter = useCallback(() => {
    return currentTenantId
  }, [currentTenantId])

  // Build context value
  const contextValue: TenantContextType = useMemo(
    () => ({
      currentTenantId,
      currentTenantName,
      memberships,
      isLoading,
      error: error?.message ?? null,
      hasMultipleTenants: memberships.length > 1,
      switchTenant,
      refreshMemberships,
      canAccessTenant,
      getTenantFilter,
    }),
    [
      currentTenantId,
      currentTenantName,
      memberships,
      isLoading,
      error,
      switchTenant,
      refreshMemberships,
      canAccessTenant,
      getTenantFilter,
    ],
  )

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>
}

/**
 * Hook to access tenant context
 */
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext)

  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }

  return context
}

/**
 * Hook to get current tenant ID (convenience)
 */
export function useCurrentTenantId(): string | null {
  const { currentTenantId } = useTenant()
  return currentTenantId
}

/**
 * Hook to check if user has multiple tenants
 */
export function useHasMultipleTenants(): boolean {
  const { hasMultipleTenants } = useTenant()
  return hasMultipleTenants
}

/**
 * HOC to require tenant context
 */
export function withTenantContext<P extends object>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> {
  return function WithTenantContext(props: P) {
    const { isLoading, error, currentTenantId } = useTenant()

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading organization context...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-destructive">
            <p className="font-semibold">Failed to load organization</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      )
    }

    if (!currentTenantId) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="font-semibold">No Organization Access</p>
            <p className="text-sm text-muted-foreground mt-2">
              You are not a member of any organization.
            </p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

export default TenantContext
