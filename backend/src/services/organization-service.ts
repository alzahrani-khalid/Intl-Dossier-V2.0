/**
 * Organization Service
 *
 * Provides CRUD operations for organizations with validation.
 *
 * @module organization-service
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/contact-directory.types.js';

type Organization = Database['public']['Tables']['cd_organizations']['Row'];
type OrganizationInsert = Database['public']['Tables']['cd_organizations']['Insert'];
type OrganizationUpdate = Database['public']['Tables']['cd_organizations']['Update'];

export class OrganizationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new organization with validation
   *
   * @param organization - Organization data to insert
   * @returns Created organization record
   */
  async create(organization: OrganizationInsert): Promise<Organization> {
    // Validate required fields
    if (!organization.name || organization.name.trim().length < 2) {
      throw new Error('name is required and must be at least 2 characters');
    }

    if (organization.name.length > 200) {
      throw new Error('name cannot exceed 200 characters');
    }

    if (!organization.type) {
      throw new Error('type is required');
    }

    // Validate type against allowed values
    const allowedTypes = ['government', 'ngo', 'company', 'academic', 'other'];
    if (!allowedTypes.includes(organization.type)) {
      throw new Error(`type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Validate country if provided (2-letter ISO code)
    if (organization.country) {
      const countryRegex = /^[A-Z]{2}$/;
      if (!countryRegex.test(organization.country)) {
        throw new Error('country must be a 2-letter ISO country code (e.g., SA, US)');
      }
    }

    // Validate website URL if provided
    if (organization.website) {
      try {
        new URL(organization.website);
      } catch {
        throw new Error('website must be a valid URL');
      }
    }

    // Validate primary_address structure if provided
    if (organization.primary_address) {
      const address = organization.primary_address as any;
      if (typeof address !== 'object') {
        throw new Error('primary_address must be an object');
      }
      // Validate address fields if present
      if (address.street && typeof address.street !== 'string') {
        throw new Error('primary_address.street must be a string');
      }
      if (address.city && typeof address.city !== 'string') {
        throw new Error('primary_address.city must be a string');
      }
      if (address.postal_code && typeof address.postal_code !== 'string') {
        throw new Error('primary_address.postal_code must be a string');
      }
      if (address.country && typeof address.country !== 'string') {
        throw new Error('primary_address.country must be a string');
      }
    }

    // Insert organization
    const { data, error } = await this.supabase
      .from('cd_organizations')
      .insert(organization)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create organization');

    return data;
  }

  /**
   * Get all organizations with filtering and pagination
   *
   * @param query - Query parameters
   * @returns Array of organizations
   */
  async getAll(query: {
    search?: string;
    type?: string;
    country?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<{ data: Organization[]; count: number }> {
    let queryBuilder = this.supabase
      .from('cd_organizations')
      .select('*', { count: 'exact' });

    // Search filter (name contains)
    if (query.search) {
      queryBuilder = queryBuilder.ilike('name', `%${query.search}%`);
    }

    // Type filter
    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }

    // Country filter
    if (query.country) {
      queryBuilder = queryBuilder.eq('country', query.country);
    }

    // Sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'desc';
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0
    };
  }

  /**
   * Get organization by ID
   *
   * @param id - Organization UUID
   * @returns Organization record or null
   */
  async getById(id: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('cd_organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Return null if not found (not an error condition)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Update existing organization
   *
   * @param id - Organization UUID
   * @param updates - Fields to update
   * @returns Updated organization record
   */
  async update(id: string, updates: OrganizationUpdate): Promise<Organization> {
    // Validate updates if provided
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length < 2) {
        throw new Error('name must be at least 2 characters');
      }
      if (updates.name.length > 200) {
        throw new Error('name cannot exceed 200 characters');
      }
    }

    if (updates.type !== undefined) {
      const allowedTypes = ['government', 'ngo', 'company', 'academic', 'other'];
      if (!allowedTypes.includes(updates.type)) {
        throw new Error(`type must be one of: ${allowedTypes.join(', ')}`);
      }
    }

    if (updates.country !== undefined && updates.country !== null) {
      const countryRegex = /^[A-Z]{2}$/;
      if (!countryRegex.test(updates.country)) {
        throw new Error('country must be a 2-letter ISO country code');
      }
    }

    if (updates.website !== undefined && updates.website !== null) {
      try {
        new URL(updates.website);
      } catch {
        throw new Error('website must be a valid URL');
      }
    }

    // Update timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('cd_organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Organization not found');

    return data;
  }

  /**
   * Delete organization
   *
   * @param id - Organization UUID
   * @returns Deleted organization record
   */
  async delete(id: string): Promise<Organization> {
    const { data, error } = await this.supabase
      .from('cd_organizations')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Organization not found');

    return data;
  }
}