import { supabaseAdmin } from '../config/supabase'
import { cacheHelpers } from '../config/redis'
import { logInfo, logError } from '../utils/logger'
import { Cacheable, CacheInvalidate, CachePut } from '../decorators/cache.decorators'
import { CACHE_TTL, CACHE_TAGS } from '../config/cache-ttl.config'

interface Organization {
  id: string
  name_en: string
  name_ar: string
  abbreviation?: string
  type: 'international' | 'regional' | 'governmental' | 'ngo' | 'private' | 'academic'
  scope: 'global' | 'regional' | 'bilateral'
  founded_date?: Date
  headquarters_country_id?: string
  member_countries?: string[]
  gastat_membership_status: 'member' | 'observer' | 'partner' | 'none'
  gastat_joined_date?: Date
  gastat_focal_point_id?: string
  website?: string
  email?: string
  phone?: string
  address?: string
  description_en?: string
  description_ar?: string
  objectives?: string[]
  working_areas?: string[]
  parent_organization_id?: string
  metadata?: Record<string, any>
  is_active: boolean
  created_at: Date
  updated_at: Date
}

interface OrganizationSearchParams {
  query?: string
  type?: Organization['type']
  scope?: Organization['scope']
  membership_status?: Organization['gastat_membership_status']
  is_active?: boolean
  parent_id?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

interface OrganizationStats {
  total_members: number
  total_mous: number
  active_mous: number
  total_events: number
  upcoming_events: number
  total_documents: number
  total_contacts: number
}

const ORGANIZATION_COLUMNS = 'id, org_code, org_type, headquarters_country_id, parent_org_id, website, email, phone, address_en, address_ar, logo_url, established_date';

export class OrganizationService {
  private readonly cachePrefix = 'org:'
  private readonly cacheTTL = CACHE_TTL.organization // 5 minutes (from centralized config)

  /**
   * Get all organizations with filters
   */
  async getOrganizations(params: OrganizationSearchParams = {}): Promise<{
    data: Organization[]
    total: number
    page: number
    pages: number
  }> {
    try {
      const {
        query,
        type,
        scope,
        membership_status,
        is_active = true,
        parent_id,
        page = 1,
        limit = 50,
        sort_by = 'name_en',
        sort_order = 'asc',
      } = params

      // Check cache
      const cacheKey = `${this.cachePrefix}list:${JSON.stringify(params)}`
      const cached = await cacheHelpers.get(cacheKey)
      if (cached) {
        return cached as any
      }

      // Build query
      let queryBuilder = supabaseAdmin.from('organizations').select(ORGANIZATION_COLUMNS, { count: 'exact' })

      // Apply filters
      if (query) {
        queryBuilder = queryBuilder.or(
          `name_en.ilike.%${query}%,name_ar.ilike.%${query}%,abbreviation.ilike.%${query}%`,
        )
      }

      if (type) {
        queryBuilder = queryBuilder.eq('type', type)
      }

      if (scope) {
        queryBuilder = queryBuilder.eq('scope', scope)
      }

      if (membership_status) {
        queryBuilder = queryBuilder.eq('gastat_membership_status', membership_status)
      }

      if (is_active !== undefined) {
        queryBuilder = queryBuilder.eq('is_active', is_active)
      }

      if (parent_id) {
        queryBuilder = queryBuilder.eq('parent_organization_id', parent_id)
      }

      // Apply sorting
      queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' })

      // Apply pagination
      const offset = (page - 1) * limit
      queryBuilder = queryBuilder.range(offset, offset + limit - 1)

      // Execute query
      const { data, error, count } = await queryBuilder

      if (error) {
        throw error
      }

      const result = {
        data: data || [],
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit),
      }

      // Cache result
      await cacheHelpers.set(cacheKey, result, this.cacheTTL)

      logInfo(`Retrieved ${data?.length || 0} organizations`)
      return result
    } catch (error) {
      logError('Error fetching organizations', error as Error)
      throw error
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      // Check cache
      const cacheKey = `${this.cachePrefix}${id}`
      const cached = await cacheHelpers.get<Organization>(cacheKey)
      if (cached) {
        return cached
      }

      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select(ORGANIZATION_COLUMNS)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      // Cache result
      if (data) {
        await cacheHelpers.set(cacheKey, data, this.cacheTTL)
      }

      return data
    } catch (error) {
      logError(`Error fetching organization ${id}`, error as Error)
      throw error
    }
  }

  /**
   * Create organization
   */
  async createOrganization(organizationData: Partial<Organization>): Promise<Organization> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .insert({
          ...organizationData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(ORGANIZATION_COLUMNS)
        .single()

      if (error) {
        throw error
      }

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}list:*`)

      logInfo('Organization created', { organizationId: data.id })
      return data
    } catch (error) {
      logError('Error creating organization', error as Error)
      throw error
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(ORGANIZATION_COLUMNS)
        .single()

      if (error) {
        throw error
      }

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}${id}`)
      await cacheHelpers.del(`${this.cachePrefix}list:*`)

      logInfo('Organization updated', { organizationId: id })
      return data
    } catch (error) {
      logError(`Error updating organization ${id}`, error as Error)
      throw error
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.from('organizations').delete().eq('id', id)

      if (error) {
        throw error
      }

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}${id}`)
      await cacheHelpers.del(`${this.cachePrefix}list:*`)

      logInfo('Organization deleted', { organizationId: id })
      return true
    } catch (error) {
      logError(`Error deleting organization ${id}`, error as Error)
      throw error
    }
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(id: string): Promise<OrganizationStats> {
    try {
      // Check cache
      const cacheKey = `${this.cachePrefix}stats:${id}`
      const cached = await cacheHelpers.get<OrganizationStats>(cacheKey)
      if (cached) {
        return cached
      }

      // Fetch all stats in parallel
      const [membersResult, mousResult, activeMousResult, eventsResult, upcomingEventsResult, documentsResult, contactsResult] = await Promise.all([
        supabaseAdmin
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', id),
        supabaseAdmin
          .from('mous')
          .select('id', { count: 'exact', head: true })
          .or(`primary_party_id.eq.${id},secondary_party_id.eq.${id}`),
        supabaseAdmin
          .from('mous')
          .select('id', { count: 'exact', head: true })
          .or(`primary_party_id.eq.${id},secondary_party_id.eq.${id}`)
          .eq('workflow_state', 'active'),
        supabaseAdmin
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('organizer_id', id),
        supabaseAdmin
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('organizer_id', id)
          .gte('start_datetime', new Date().toISOString()),
        supabaseAdmin
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('entity_type', 'organization')
          .eq('entity_id', id),
        supabaseAdmin
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', id),
      ])

      const stats: OrganizationStats = {
        total_members: membersResult.count || 0,
        total_mous: mousResult.count || 0,
        active_mous: activeMousResult.count || 0,
        total_events: eventsResult.count || 0,
        upcoming_events: upcomingEventsResult.count || 0,
        total_documents: documentsResult.count || 0,
        total_contacts: contactsResult.count || 0,
      }

      // Cache result
      await cacheHelpers.set(cacheKey, stats, this.cacheTTL)

      return stats
    } catch (error) {
      logError(`Error fetching stats for organization ${id}`, error as Error)
      throw error
    }
  }

  /**
   * Get members of organization
   */
  async getMembers(organizationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organization_members')
        .select('id, user_id, role, joined_date, left_date, is_active')
        .eq('organization_id', organizationId)
        .order('joined_date', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      logError(`Error fetching members for organization ${organizationId}`, error as Error)
      throw error
    }
  }

  /**
   * Add member to organization
   */
  async addMember(organizationId: string, memberData: any): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          ...memberData,
          joined_date: new Date().toISOString(),
        })
        .select('id, user_id, role, joined_date, left_date, is_active')
        .single()

      if (error) {
        throw error
      }

      // Invalidate stats cache
      await cacheHelpers.del(`${this.cachePrefix}stats:${organizationId}`)

      logInfo('Member added to organization', { organizationId, memberId: data.id })
      return data
    } catch (error) {
      logError('Error adding member to organization', error as Error)
      throw error
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, memberId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('organization_members')
        .update({
          left_date: new Date().toISOString(),
          is_active: false,
        })
        .eq('organization_id', organizationId)
        .eq('id', memberId)

      if (error) {
        throw error
      }

      // Invalidate stats cache
      await cacheHelpers.del(`${this.cachePrefix}stats:${organizationId}`)

      logInfo('Member removed from organization', { organizationId, memberId })
      return true
    } catch (error) {
      logError('Error removing member from organization', error as Error)
      throw error
    }
  }

  // Methods for API compatibility
  async findAll(params?: OrganizationSearchParams) {
    return this.getOrganizations(params)
  }

  async findById(id: string) {
    return this.getOrganizationById(id)
  }

  async create(organization: Partial<Organization>) {
    return this.createOrganization(organization)
  }

  async update(id: string, updates: Partial<Organization>) {
    return this.updateOrganization(id, updates)
  }

  async delete(id: string) {
    return this.deleteOrganization(id)
  }

  async getStatistics(id: string) {
    return this.getOrganizationStats(id)
  }
}

export default OrganizationService
