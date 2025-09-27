import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

interface Organization {
  id: string;
  name_en: string;
  name_ar: string;
  abbreviation?: string;
  type: 'international' | 'regional' | 'governmental' | 'ngo' | 'private' | 'academic';
  scope: 'global' | 'regional' | 'bilateral';
  founded_date?: Date;
  headquarters_country_id?: string;
  member_countries?: string[];
  gastat_membership_status: 'member' | 'observer' | 'partner' | 'none';
  gastat_joined_date?: Date;
  gastat_focal_point_id?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  description_en?: string;
  description_ar?: string;
  objectives?: string[];
  working_areas?: string[];
  parent_organization_id?: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface OrganizationSearchParams {
  query?: string;
  type?: Organization['type'];
  scope?: Organization['scope'];
  membership_status?: Organization['gastat_membership_status'];
  is_active?: boolean;
  parent_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface OrganizationStats {
  total_members: number;
  total_mous: number;
  active_mous: number;
  total_events: number;
  upcoming_events: number;
  total_documents: number;
  total_contacts: number;
}

export class OrganizationService {
  private readonly cachePrefix = 'organization:';
  private readonly cacheTTL = 3600; // 1 hour

  /**
   * Get all organizations with filters
   */
  async getOrganizations(params: OrganizationSearchParams = {}): Promise<{
    data: Organization[];
    total: number;
    page: number;
    pages: number;
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
        sort_order = 'asc'
      } = params;

      // Check cache
      const cacheKey = `${this.cachePrefix}list:${JSON.stringify(params)}`;
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) {
        return cached as any;
      }

      // Build query
      let queryBuilder = supabaseAdmin
        .from('organizations')
        .select('*', { count: 'exact' });

      // Apply filters
      if (query) {
        queryBuilder = queryBuilder.or(
          `name_en.ilike.%${query}%,name_ar.ilike.%${query}%,abbreviation.ilike.%${query}%`
        );
      }

      if (type) {
        queryBuilder = queryBuilder.eq('type', type);
      }

      if (scope) {
        queryBuilder = queryBuilder.eq('scope', scope);
      }

      if (membership_status) {
        queryBuilder = queryBuilder.eq('gastat_membership_status', membership_status);
      }

      if (is_active !== undefined) {
        queryBuilder = queryBuilder.eq('is_active', is_active);
      }

      if (parent_id) {
        queryBuilder = queryBuilder.eq('parent_organization_id', parent_id);
      }

      // Apply sorting
      queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await queryBuilder;

      if (error) {
        throw error;
      }

      const result = {
        data: data || [],
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit)
      };

      // Cache result
      await cacheHelpers.set(cacheKey, result, this.cacheTTL);

      logInfo(`Retrieved ${data?.length || 0} organizations`);
      return result;
    } catch (error) {
      logError('Error fetching organizations', error as Error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      // Check cache
      const cacheKey = `${this.cachePrefix}${id}`;
      const cached = await cacheHelpers.get<Organization>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      // Cache result
      if (data) {
        await cacheHelpers.set(cacheKey, data, this.cacheTTL);
      }

      return data;
    } catch (error) {
      logError(`Error fetching organization ${id}`, error as Error);
      throw error;
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
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Clear cache
      await this.clearOrganizationCache();

      logInfo(`Created organization: ${data.name_en}`);
      return data;
    } catch (error) {
      logError('Error creating organization', error as Error);
      throw error;
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
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Clear cache
      await cacheHelpers.del(`${this.cachePrefix}${id}`);
      await this.clearOrganizationCache();

      logInfo(`Updated organization: ${data.name_en}`);
      return data;
    } catch (error) {
      logError(`Error updating organization ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Clear cache
      await cacheHelpers.del(`${this.cachePrefix}${id}`);
      await this.clearOrganizationCache();

      logInfo(`Deleted organization: ${id}`);
      return true;
    } catch (error) {
      logError(`Error deleting organization ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Get organization hierarchy (parent and children)
   */
  async getOrganizationHierarchy(id: string): Promise<{
    organization: Organization;
    parent?: Organization;
    children: Organization[];
  }> {
    try {
      const cacheKey = `${this.cachePrefix}hierarchy:${id}`;
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) {
        return cached as any;
      }

      // Get organization
      const organization = await this.getOrganizationById(id);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Get parent if exists
      let parent: Organization | undefined;
      if (organization.parent_organization_id) {
        const parentResult = await this.getOrganizationById(organization.parent_organization_id);
        if (parentResult) {
          parent = parentResult;
        }
      }

      // Get children
      const { data: children } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('parent_organization_id', id)
        .eq('is_active', true)
        .order('name_en');

      const result = {
        organization,
        parent,
        children: children || []
      };

      // Cache result
      await cacheHelpers.set(cacheKey, result, this.cacheTTL);

      return result;
    } catch (error) {
      logError(`Error fetching hierarchy for organization ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Get organization members (countries)
   */
  async getOrganizationMembers(id: string): Promise<any[]> {
    try {
      const cacheKey = `${this.cachePrefix}members:${id}`;
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) {
        return cached as any[];
      }

      // Get organization
      const organization = await this.getOrganizationById(id);
      if (!organization || !organization.member_countries) {
        return [];
      }

      // Get member countries
      const { data, error } = await supabaseAdmin
        .from('countries')
        .select('id, code, name_en, name_ar, flag_url')
        .in('id', organization.member_countries);

      if (error) {
        throw error;
      }

      // Cache result
      if (data) {
        await cacheHelpers.set(cacheKey, data, this.cacheTTL);
      }

      return data || [];
    } catch (error) {
      logError(`Error fetching members for organization ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Add member country to organization
   */
  async addMemberCountry(organizationId: string, countryId: string): Promise<boolean> {
    try {
      // Get current members
      const organization = await this.getOrganizationById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      const currentMembers = organization.member_countries || [];
      if (currentMembers.includes(countryId)) {
        return true; // Already a member
      }

      // Update members
      const updatedMembers = [...currentMembers, countryId];
      await this.updateOrganization(organizationId, {
        member_countries: updatedMembers
      });

      // Clear cache
      await cacheHelpers.del(`${this.cachePrefix}members:${organizationId}`);

      logInfo(`Added country ${countryId} to organization ${organizationId}`);
      return true;
    } catch (error) {
      logError('Error adding member country', error as Error);
      throw error;
    }
  }

  /**
   * Remove member country from organization
   */
  async removeMemberCountry(organizationId: string, countryId: string): Promise<boolean> {
    try {
      // Get current members
      const organization = await this.getOrganizationById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      const currentMembers = organization.member_countries || [];
      const updatedMembers = currentMembers.filter(id => id !== countryId);

      if (currentMembers.length === updatedMembers.length) {
        return true; // Country was not a member
      }

      // Update members
      await this.updateOrganization(organizationId, {
        member_countries: updatedMembers
      });

      // Clear cache
      await cacheHelpers.del(`${this.cachePrefix}members:${organizationId}`);

      logInfo(`Removed country ${countryId} from organization ${organizationId}`);
      return true;
    } catch (error) {
      logError('Error removing member country', error as Error);
      throw error;
    }
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStatistics(organizationId: string): Promise<OrganizationStats> {
    try {
      const cacheKey = `${this.cachePrefix}stats:${organizationId}`;
      const cached = await cacheHelpers.get<OrganizationStats>(cacheKey);
      if (cached) {
        return cached;
      }

      // Get organization
      const organization = await this.getOrganizationById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Fetch statistics
      const [mous, events, documents, contacts] = await Promise.all([
        supabaseAdmin
          .from('mous')
          .select('id, status')
          .contains('parties', [{ organization_id: organizationId }]),

        supabaseAdmin
          .from('events')
          .select('id, start_date')
          .eq('organization_id', organizationId),

        supabaseAdmin
          .from('documents')
          .select('id')
          .eq('organization_id', organizationId),

        supabaseAdmin
          .from('contacts')
          .select('id')
          .eq('organization_id', organizationId)
      ]);

      const now = new Date();
      const stats: OrganizationStats = {
        total_members: organization.member_countries?.length || 0,
        total_mous: mous.data?.length || 0,
        active_mous: mous.data?.filter(m => m.status === 'active').length || 0,
        total_events: events.data?.length || 0,
        upcoming_events: events.data?.filter(e => new Date(e.start_date) > now).length || 0,
        total_documents: documents.data?.length || 0,
        total_contacts: contacts.data?.length || 0
      };

      // Cache result
      await cacheHelpers.set(cacheKey, stats, 1800); // 30 minutes

      return stats;
    } catch (error) {
      logError(`Error fetching statistics for organization ${organizationId}`, error as Error);
      throw error;
    }
  }

  /**
   * Search organizations
   */
  async searchOrganizations(searchTerm: string, limit: number = 10): Promise<Organization[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .or(
          `name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%,` +
          `abbreviation.ilike.%${searchTerm}%,description_en.ilike.%${searchTerm}%`
        )
        .eq('is_active', true)
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logError('Error searching organizations', error as Error);
      throw error;
    }
  }

  /**
   * Get organizations by type
   */
  async getOrganizationsByType(type: Organization['type']): Promise<Organization[]> {
    try {
      const cacheKey = `${this.cachePrefix}type:${type}`;
      const cached = await cacheHelpers.get<Organization[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('name_en');

      if (error) {
        throw error;
      }

      if (data) {
        await cacheHelpers.set(cacheKey, data, this.cacheTTL);
      }

      return data || [];
    } catch (error) {
      logError(`Error fetching organizations by type ${type}`, error as Error);
      throw error;
    }
  }

  /**
   * Clear organization cache
   */
  private async clearOrganizationCache(): Promise<void> {
    await cacheHelpers.clearPattern(`${this.cachePrefix}list:*`);
  }

  // Missing methods for API endpoints
  async findAll(filters?: any) {
    return this.searchOrganizations(filters || {});
  }

  async findById(id: string) {
    return this.getOrganizationById(id);
  }

  async create(organization: any) {
    return this.createOrganization(organization);
  }

  async update(id: string, updates: any) {
    return this.updateOrganization(id, updates);
  }

  async delete(id: string) {
    return this.deleteOrganization(id);
  }
}

export default OrganizationService;