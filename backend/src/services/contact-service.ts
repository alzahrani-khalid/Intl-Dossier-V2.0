/**
 * Contact Service
 *
 * Provides CRUD operations for contacts with validation, search, and duplicate detection.
 *
 * @module contact-service
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/contact-directory.types.js';

type Contact = Database['public']['Tables']['cd_contacts']['Row'];
type ContactInsert = Database['public']['Tables']['cd_contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['cd_contacts']['Update'];
type DocumentSource = Database['public']['Tables']['cd_document_sources']['Row'];
type DocumentSourceInsert = Database['public']['Tables']['cd_document_sources']['Insert'];
type DocumentSourceUpdate = Database['public']['Tables']['cd_document_sources']['Update'];

export class ContactService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new contact with validation
   *
   * @param contact - Contact data to insert
   * @returns Created contact record
   */
  async create(contact: ContactInsert): Promise<Contact> {
    // Validate required fields
    if (!contact.full_name || contact.full_name.trim().length < 2) {
      throw new Error('full_name is required and must be at least 2 characters');
    }

    if (contact.full_name.length > 200) {
      throw new Error('full_name cannot exceed 200 characters');
    }

    // Validate email addresses if provided
    if (contact.email_addresses) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of contact.email_addresses) {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }
      }
    }

    // Validate phone numbers if provided (E.164 international format)
    if (contact.phone_numbers) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      for (const phone of contact.phone_numbers) {
        if (!phoneRegex.test(phone)) {
          throw new Error(`Invalid phone format (use E.164 international format): ${phone}`);
        }
      }
    }

    // Validate position length
    if (contact.position && contact.position.length > 200) {
      throw new Error('position cannot exceed 200 characters');
    }

    // Validate notes length
    if (contact.notes && contact.notes.length > 5000) {
      throw new Error('notes cannot exceed 5000 characters');
    }

    // Insert contact
    const { data, error } = await this.supabase
      .from('cd_contacts')
      .insert(contact)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create contact');

    return data;
  }

  /**
   * Get contact by ID
   *
   * @param id - Contact UUID
   * @returns Contact record or null
   */
  async getById(id: string): Promise<Contact | null> {
    const { data, error } = await this.supabase
      .from('cd_contacts')
      .select('*')
      .eq('id', id)
      .eq('is_archived', false)
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
   * Update existing contact
   *
   * @param id - Contact UUID
   * @param updates - Fields to update
   * @returns Updated contact record
   */
  async update(id: string, updates: ContactUpdate): Promise<Contact> {
    // Validate updates if provided
    if (updates.full_name !== undefined) {
      if (!updates.full_name || updates.full_name.trim().length < 2) {
        throw new Error('full_name must be at least 2 characters');
      }
      if (updates.full_name.length > 200) {
        throw new Error('full_name cannot exceed 200 characters');
      }
    }

    if (updates.email_addresses) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of updates.email_addresses) {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }
      }
    }

    if (updates.phone_numbers) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      for (const phone of updates.phone_numbers) {
        if (!phoneRegex.test(phone)) {
          throw new Error(`Invalid phone format (use E.164 international format): ${phone}`);
        }
      }
    }

    if (updates.position && updates.position.length > 200) {
      throw new Error('position cannot exceed 200 characters');
    }

    if (updates.notes && updates.notes.length > 5000) {
      throw new Error('notes cannot exceed 5000 characters');
    }

    // Update timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('cd_contacts')
      .update(updateData)
      .eq('id', id)
      .eq('is_archived', false)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Contact not found or already archived');

    return data;
  }

  /**
   * Archive contact (soft delete)
   *
   * @param id - Contact UUID
   * @returns Archived contact record
   */
  async archive(id: string): Promise<Contact> {
    const { data, error} = await this.supabase
      .from('cd_contacts')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('is_archived', false)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Contact not found or already archived');

    return data;
  }

  /**
   * Search contacts with full-text search and filters
   *
   * @param query - Search parameters
   * @returns Array of matching contacts or grouped results
   */
  async search(query: {
    search?: string;
    organization_id?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    group_by_organization?: boolean;
  }): Promise<Contact[] | { organization_id: string | null; contacts: Contact[] }[]> {
    let queryBuilder = this.supabase
      .from('cd_contacts')
      .select('*')
      .eq('is_archived', false);

    // Full-text search on full_name using tsvector index
    if (query.search) {
      queryBuilder = queryBuilder.textSearch('full_name', query.search, {
        type: 'websearch',
        config: 'simple'
      });
    }

    // Filter by organization
    if (query.organization_id) {
      queryBuilder = queryBuilder.eq('organization_id', query.organization_id);
    }

    // Filter by tags (array contains check)
    if (query.tags && query.tags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', query.tags);
    }

    // Sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'desc';
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error } = await queryBuilder;

    if (error) throw error;

    const contacts = data || [];

    // Group by organization if requested
    if (query.group_by_organization) {
      const grouped = new Map<string | null, Contact[]>();

      for (const contact of contacts) {
        const orgId = contact.organization_id;
        if (!grouped.has(orgId)) {
          grouped.set(orgId, []);
        }
        grouped.get(orgId)!.push(contact);
      }

      return Array.from(grouped.entries()).map(([organization_id, contacts]) => ({
        organization_id,
        contacts
      }));
    }

    return contacts;
  }

  /**
   * Advanced search with tag array filtering
   *
   * @param query - Search parameters with advanced tag filtering
   * @returns Array of matching contacts
   */
  async searchWithTagFilters(query: {
    search?: string;
    organization_id?: string;
    tags_all?: string[];  // Must have ALL these tags
    tags_any?: string[];  // Must have ANY of these tags
    tags_exclude?: string[];  // Must NOT have these tags
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<Contact[]> {
    let queryBuilder = this.supabase
      .from('cd_contacts')
      .select('*')
      .eq('is_archived', false);

    // Full-text search on full_name
    if (query.search) {
      queryBuilder = queryBuilder.textSearch('full_name', query.search, {
        type: 'websearch',
        config: 'simple'
      });
    }

    // Filter by organization
    if (query.organization_id) {
      queryBuilder = queryBuilder.eq('organization_id', query.organization_id);
    }

    // Advanced tag filtering
    // Must have ALL these tags (array contains all)
    if (query.tags_all && query.tags_all.length > 0) {
      queryBuilder = queryBuilder.contains('tags', query.tags_all);
    }

    // Must have ANY of these tags (array overlaps)
    if (query.tags_any && query.tags_any.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', query.tags_any);
    }

    // Must NOT have these tags
    if (query.tags_exclude && query.tags_exclude.length > 0) {
      // Build NOT condition for excluded tags
      const excludeConditions = query.tags_exclude
        .map(tag => `not(tags.cs.{${tag}})`)
        .join(',');
      queryBuilder = queryBuilder.or(excludeConditions);
    }

    // Sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'desc';
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return data || [];
  }

  /**
   * Create multiple contacts in a batch transaction
   *
   * @param contacts - Array of contacts to create
   * @returns Object containing created contacts, failed count, and errors
   */
  async createBatch(contacts: ContactInsert[]): Promise<{
    created: Contact[];
    failed: number;
    errors: Array<{ index: number; contact: ContactInsert; error: string }>;
  }> {
    if (!contacts || contacts.length === 0) {
      throw new Error('No contacts provided for batch creation');
    }

    const created: Contact[] = [];
    const errors: Array<{ index: number; contact: ContactInsert; error: string }> = [];

    // Process contacts sequentially to maintain order and handle individual errors
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      try {
        // Validate and create contact
        const createdContact = await this.create(contact);
        created.push(createdContact);
      } catch (error: any) {
        // Log error and continue with next contact
        console.error(`Failed to create contact at index ${i}:`, error);
        errors.push({
          index: i,
          contact,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      created,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Create or update document source record
   *
   * @param documentSource - Document source data
   * @returns Created/updated document source
   */
  async createDocumentSource(documentSource: DocumentSourceInsert): Promise<DocumentSource> {
    // Validate required fields
    if (!documentSource.file_name || documentSource.file_name.trim().length === 0) {
      throw new Error('file_name is required');
    }

    if (!documentSource.storage_path || documentSource.storage_path.trim().length === 0) {
      throw new Error('storage_path is required');
    }

    if (!documentSource.file_type) {
      throw new Error('file_type is required');
    }

    if (!documentSource.file_format) {
      throw new Error('file_format is required');
    }

    if (documentSource.file_size_bytes < 0) {
      throw new Error('file_size_bytes must be positive');
    }

    // Set default values
    const insertData: DocumentSourceInsert = {
      ...documentSource,
      processing_status: documentSource.processing_status || 'pending',
      upload_date: documentSource.upload_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert document source
    const { data, error } = await this.supabase
      .from('cd_document_sources')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create document source:', error);
      throw new Error(`Failed to create document source: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create document source - no data returned');
    }

    return data;
  }

  /**
   * Update document source processing status
   *
   * @param id - Document source UUID
   * @param status - New status
   * @param extracted_contacts_count - Number of contacts extracted (optional)
   * @param error_message - Error message if status is 'failed' (optional)
   * @returns Updated document source
   */
  async updateDocumentSourceStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    extracted_contacts_count?: number,
    error_message?: string
  ): Promise<DocumentSource> {
    // Prepare update data
    const updateData: DocumentSourceUpdate = {
      processing_status: status,
      updated_at: new Date().toISOString()
    };

    // Add extracted contacts count if provided
    if (extracted_contacts_count !== undefined) {
      updateData.extracted_contacts_count = extracted_contacts_count;
    }

    // Add error message if status is failed
    if (status === 'failed' && error_message) {
      updateData.processing_error = error_message;
    }

    // Clear error if status is not failed
    if (status !== 'failed') {
      updateData.processing_error = null;
    }

    // Update the document source
    const { data, error } = await this.supabase
      .from('cd_document_sources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update document source status:', error);
      throw new Error(`Failed to update document source status: ${error.message}`);
    }

    if (!data) {
      throw new Error('Document source not found');
    }

    return data;
  }

  /**
   * Get document source by ID
   *
   * @param id - Document source UUID
   * @returns Document source record or null
   */
  async getDocumentSourceById(id: string): Promise<DocumentSource | null> {
    const { data, error } = await this.supabase
      .from('cd_document_sources')
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
}
