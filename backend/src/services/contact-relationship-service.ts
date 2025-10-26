/**
 * Contact Relationship Service
 *
 * Manages contact-to-contact relationships with validation.
 *
 * @module contact-relationship-service
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/contact-directory.types.js';

type ContactRelationship = Database['public']['Tables']['cd_contact_relationships']['Row'];
type ContactRelationshipInsert = Database['public']['Tables']['cd_contact_relationships']['Insert'];
type ContactRelationshipUpdate = Database['public']['Tables']['cd_contact_relationships']['Update'];

export class ContactRelationshipService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new relationship with validation
   *
   * @param relationship - Relationship data to insert
   * @returns Created relationship record
   */
  async create(relationship: ContactRelationshipInsert): Promise<ContactRelationship> {
    // Validate required fields
    if (!relationship.from_contact_id) {
      throw new Error('from_contact_id is required');
    }

    if (!relationship.to_contact_id) {
      throw new Error('to_contact_id is required');
    }

    if (!relationship.relationship_type) {
      throw new Error('relationship_type is required');
    }

    // Prevent self-relationships
    if (relationship.from_contact_id === relationship.to_contact_id) {
      throw new Error('Cannot create a relationship from a contact to itself');
    }

    // Validate relationship type
    const allowedTypes = [
      'reports_to',
      'manages',
      'colleague',
      'partner',
      'client',
      'vendor',
      'advisor',
      'board_member',
      'family',
      'friend',
      'other'
    ];

    if (!allowedTypes.includes(relationship.relationship_type)) {
      throw new Error(`relationship_type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Check if the relationship already exists (prevent duplicates)
    const { data: existing } = await this.supabase
      .from('cd_contact_relationships')
      .select('id')
      .eq('from_contact_id', relationship.from_contact_id)
      .eq('to_contact_id', relationship.to_contact_id)
      .eq('relationship_type', relationship.relationship_type)
      .maybeSingle();

    if (existing) {
      throw new Error('This relationship already exists');
    }

    // Validate dates if provided
    if (relationship.start_date && relationship.end_date) {
      const startDate = new Date(relationship.start_date);
      const endDate = new Date(relationship.end_date);
      if (endDate < startDate) {
        throw new Error('end_date cannot be before start_date');
      }
    }

    // Validate notes length
    if (relationship.notes && relationship.notes.length > 1000) {
      throw new Error('notes cannot exceed 1000 characters');
    }

    // Verify both contacts exist
    const { data: fromContact } = await this.supabase
      .from('cd_contacts')
      .select('id')
      .eq('id', relationship.from_contact_id)
      .single();

    if (!fromContact) {
      throw new Error('from_contact_id does not exist');
    }

    const { data: toContact } = await this.supabase
      .from('cd_contacts')
      .select('id')
      .eq('id', relationship.to_contact_id)
      .single();

    if (!toContact) {
      throw new Error('to_contact_id does not exist');
    }

    // Insert relationship
    const { data, error } = await this.supabase
      .from('cd_contact_relationships')
      .insert(relationship)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create relationship');

    return data;
  }

  /**
   * Get relationships for a contact (both incoming and outgoing)
   *
   * @param contactId - Contact UUID
   * @returns Object containing incoming and outgoing relationships
   */
  async getForContact(contactId: string): Promise<{
    incoming: ContactRelationship[];
    outgoing: ContactRelationship[];
  }> {
    // Get outgoing relationships (where contact is from_contact_id)
    const { data: outgoing, error: outgoingError } = await this.supabase
      .from('cd_contact_relationships')
      .select('*')
      .eq('from_contact_id', contactId)
      .order('created_at', { ascending: false });

    if (outgoingError) throw outgoingError;

    // Get incoming relationships (where contact is to_contact_id)
    const { data: incoming, error: incomingError } = await this.supabase
      .from('cd_contact_relationships')
      .select('*')
      .eq('to_contact_id', contactId)
      .order('created_at', { ascending: false });

    if (incomingError) throw incomingError;

    return {
      incoming: incoming || [],
      outgoing: outgoing || []
    };
  }

  /**
   * Get all relationships with optional filters
   *
   * @param query - Query parameters
   * @returns Array of relationships
   */
  async getAll(query: {
    relationship_type?: string;
    active_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<ContactRelationship[]> {
    let queryBuilder = this.supabase
      .from('cd_contact_relationships')
      .select('*');

    // Filter by relationship type
    if (query.relationship_type) {
      queryBuilder = queryBuilder.eq('relationship_type', query.relationship_type);
    }

    // Filter for active relationships only (no end_date or end_date in future)
    if (query.active_only) {
      const now = new Date().toISOString();
      queryBuilder = queryBuilder.or(`end_date.is.null,end_date.gt.${now}`);
    }

    // Order by creation date
    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    // Pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return data || [];
  }

  /**
   * Update existing relationship
   *
   * @param id - Relationship UUID
   * @param updates - Fields to update
   * @returns Updated relationship record
   */
  async update(id: string, updates: ContactRelationshipUpdate): Promise<ContactRelationship> {
    // Validate updates if provided
    if (updates.relationship_type !== undefined) {
      const allowedTypes = [
        'reports_to',
        'manages',
        'colleague',
        'partner',
        'client',
        'vendor',
        'advisor',
        'board_member',
        'family',
        'friend',
        'other'
      ];

      if (!allowedTypes.includes(updates.relationship_type)) {
        throw new Error(`relationship_type must be one of: ${allowedTypes.join(', ')}`);
      }
    }

    // Validate dates if provided
    if (updates.start_date !== undefined && updates.end_date !== undefined) {
      if (updates.start_date && updates.end_date) {
        const startDate = new Date(updates.start_date);
        const endDate = new Date(updates.end_date);
        if (endDate < startDate) {
          throw new Error('end_date cannot be before start_date');
        }
      }
    }

    // Validate notes length
    if (updates.notes !== undefined && updates.notes && updates.notes.length > 1000) {
      throw new Error('notes cannot exceed 1000 characters');
    }

    // Prevent updating from/to contact IDs
    if ('from_contact_id' in updates || 'to_contact_id' in updates) {
      throw new Error('Cannot update from_contact_id or to_contact_id. Delete and recreate the relationship instead.');
    }

    const { data, error } = await this.supabase
      .from('cd_contact_relationships')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Relationship not found');

    return data;
  }

  /**
   * Delete a relationship
   *
   * @param id - Relationship UUID
   * @returns Deleted relationship record
   */
  async delete(id: string): Promise<ContactRelationship> {
    const { data, error } = await this.supabase
      .from('cd_contact_relationships')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Relationship not found');

    return data;
  }

  /**
   * Check if a specific relationship exists between two contacts
   *
   * @param from_contact_id - Source contact UUID
   * @param to_contact_id - Target contact UUID
   * @param relationship_type - Type of relationship
   * @returns Boolean indicating if relationship exists
   */
  async exists(
    from_contact_id: string,
    to_contact_id: string,
    relationship_type: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('cd_contact_relationships')
      .select('id')
      .eq('from_contact_id', from_contact_id)
      .eq('to_contact_id', to_contact_id)
      .eq('relationship_type', relationship_type)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  }
}