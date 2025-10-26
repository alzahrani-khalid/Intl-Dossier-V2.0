/**
 * Interaction Note Service
 *
 * Provides CRUD operations for contact interaction notes with validation and search capabilities.
 *
 * @module interaction-note-service
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/contact-directory.types.js';

type InteractionNote = Database['public']['Tables']['cd_interaction_notes']['Row'];
type InteractionNoteInsert = Database['public']['Tables']['cd_interaction_notes']['Insert'];
type InteractionNoteUpdate = Database['public']['Tables']['cd_interaction_notes']['Update'];

// Valid interaction types
const INTERACTION_TYPES = ['meeting', 'email', 'call', 'conference', 'other'] as const;
type InteractionType = typeof INTERACTION_TYPES[number];

export class InteractionNoteService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new interaction note with validation
   *
   * @param note - Interaction note data to insert
   * @returns Created interaction note record
   */
  async create(note: InteractionNoteInsert): Promise<InteractionNote> {
    // Validate required fields
    if (!note.contact_id) {
      throw new Error('contact_id is required');
    }

    if (!note.date) {
      throw new Error('date is required');
    }

    // Validate date is not in future
    const noteDate = new Date(note.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (noteDate > today) {
      throw new Error('Interaction date cannot be in the future');
    }

    // Validate details
    if (!note.details || note.details.trim().length < 10) {
      throw new Error('details is required and must be at least 10 characters');
    }

    if (note.details.length > 10000) {
      throw new Error('details cannot exceed 10,000 characters');
    }

    // Validate interaction type
    if (!note.type || !INTERACTION_TYPES.includes(note.type as InteractionType)) {
      throw new Error(`type must be one of: ${INTERACTION_TYPES.join(', ')}`);
    }

    // Validate attachments if provided (ensure they are file paths/keys)
    if (note.attachments) {
      if (!Array.isArray(note.attachments)) {
        throw new Error('attachments must be an array of file paths');
      }
      for (const attachment of note.attachments) {
        if (typeof attachment !== 'string' || attachment.trim().length === 0) {
          throw new Error('Each attachment must be a non-empty string (file path)');
        }
        // Validate that attachment paths don't contain dangerous characters
        if (attachment.includes('..') || attachment.includes('~')) {
          throw new Error('Invalid attachment path detected');
        }
      }
    }

    // Validate attendees if provided (should be contact IDs or names)
    if (note.attendees) {
      if (!Array.isArray(note.attendees)) {
        throw new Error('attendees must be an array');
      }
      for (const attendee of note.attendees) {
        if (typeof attendee !== 'string' || attendee.trim().length === 0) {
          throw new Error('Each attendee must be a non-empty string');
        }
      }
    }

    // Check if contact exists
    const { data: contact, error: contactError } = await this.supabase
      .from('cd_contacts')
      .select('id')
      .eq('id', note.contact_id)
      .eq('is_archived', false)
      .single();

    if (contactError || !contact) {
      throw new Error('Contact not found or is archived');
    }

    // Insert interaction note
    const { data, error } = await this.supabase
      .from('cd_interaction_notes')
      .insert(note)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create interaction note');

    return data;
  }

  /**
   * Get interaction notes for a specific contact
   *
   * @param contactId - Contact UUID
   * @param options - Optional query parameters
   * @returns Array of interaction notes sorted by date DESC
   */
  async getForContact(
    contactId: string,
    options: {
      limit?: number;
      offset?: number;
      dateFrom?: string;
      dateTo?: string;
      type?: InteractionType;
    } = {}
  ): Promise<InteractionNote[]> {
    let query = this.supabase
      .from('cd_interaction_notes')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false });

    // Apply date filters if provided
    if (options.dateFrom) {
      query = query.gte('date', options.dateFrom);
    }
    if (options.dateTo) {
      query = query.lte('date', options.dateTo);
    }

    // Filter by type if provided
    if (options.type) {
      if (!INTERACTION_TYPES.includes(options.type)) {
        throw new Error(`Invalid type: ${options.type}. Must be one of: ${INTERACTION_TYPES.join(', ')}`);
      }
      query = query.eq('type', options.type);
    }

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Search interaction notes across all contacts
   *
   * @param searchParams - Search parameters
   * @returns Array of matching interaction notes
   */
  async search(searchParams: {
    query?: string;
    dateFrom?: string;
    dateTo?: string;
    types?: InteractionType[];
    contactIds?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'date' | 'created_at';
    sortOrder?: 'asc' | 'desc';
  }): Promise<InteractionNote[]> {
    let queryBuilder = this.supabase
      .from('cd_interaction_notes')
      .select('*');

    // Full-text search on details field
    if (searchParams.query && searchParams.query.trim().length > 0) {
      // Use textSearch for full-text search on details
      queryBuilder = queryBuilder.textSearch('details', searchParams.query, {
        type: 'websearch',
        config: 'simple'
      });
    }

    // Filter by date range
    if (searchParams.dateFrom) {
      queryBuilder = queryBuilder.gte('date', searchParams.dateFrom);
    }
    if (searchParams.dateTo) {
      queryBuilder = queryBuilder.lte('date', searchParams.dateTo);
    }

    // Filter by types (multiple)
    if (searchParams.types && searchParams.types.length > 0) {
      // Validate all types
      for (const type of searchParams.types) {
        if (!INTERACTION_TYPES.includes(type)) {
          throw new Error(`Invalid type: ${type}. Must be one of: ${INTERACTION_TYPES.join(', ')}`);
        }
      }
      queryBuilder = queryBuilder.in('type', searchParams.types);
    }

    // Filter by contact IDs if provided
    if (searchParams.contactIds && searchParams.contactIds.length > 0) {
      queryBuilder = queryBuilder.in('contact_id', searchParams.contactIds);
    }

    // Sorting
    const sortBy = searchParams.sortBy || 'date';
    const sortOrder = searchParams.sortOrder || 'desc';
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const limit = searchParams.limit || 50;
    const offset = searchParams.offset || 0;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return data || [];
  }

  /**
   * Update an existing interaction note
   *
   * @param id - Interaction note UUID
   * @param updates - Fields to update
   * @returns Updated interaction note
   */
  async update(id: string, updates: InteractionNoteUpdate): Promise<InteractionNote> {
    // Validate updates if provided
    if (updates.date !== undefined) {
      const noteDate = new Date(updates.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (noteDate > today) {
        throw new Error('Interaction date cannot be in the future');
      }
    }

    if (updates.details !== undefined) {
      if (!updates.details || updates.details.trim().length < 10) {
        throw new Error('details must be at least 10 characters');
      }
      if (updates.details.length > 10000) {
        throw new Error('details cannot exceed 10,000 characters');
      }
    }

    if (updates.type !== undefined) {
      if (!INTERACTION_TYPES.includes(updates.type as InteractionType)) {
        throw new Error(`type must be one of: ${INTERACTION_TYPES.join(', ')}`);
      }
    }

    if (updates.attachments !== undefined && updates.attachments !== null) {
      if (!Array.isArray(updates.attachments)) {
        throw new Error('attachments must be an array of file paths');
      }
      for (const attachment of updates.attachments) {
        if (typeof attachment !== 'string' || attachment.trim().length === 0) {
          throw new Error('Each attachment must be a non-empty string (file path)');
        }
        if (attachment.includes('..') || attachment.includes('~')) {
          throw new Error('Invalid attachment path detected');
        }
      }
    }

    // Update timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('cd_interaction_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Interaction note not found');

    return data;
  }

  /**
   * Delete an interaction note
   *
   * @param id - Interaction note UUID
   * @returns Deleted interaction note
   */
  async delete(id: string): Promise<InteractionNote> {
    const { data, error } = await this.supabase
      .from('cd_interaction_notes')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Interaction note not found');

    return data;
  }

  /**
   * Get statistics for interaction notes
   *
   * @param contactId - Optional contact ID to filter by
   * @param dateFrom - Optional start date
   * @param dateTo - Optional end date
   * @returns Statistics object
   */
  async getStatistics(
    contactId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalNotes: number;
    byType: Record<InteractionType, number>;
    mostRecentDate: string | null;
    averageNotesPerMonth: number;
  }> {
    let query = this.supabase
      .from('cd_interaction_notes')
      .select('id, type, date');

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    const notes = data || [];

    // Calculate statistics
    const byType: Record<InteractionType, number> = {
      meeting: 0,
      email: 0,
      call: 0,
      conference: 0,
      other: 0,
    };

    let mostRecentDate: string | null = null;

    for (const note of notes) {
      byType[note.type as InteractionType]++;
      if (!mostRecentDate || note.date > mostRecentDate) {
        mostRecentDate = note.date;
      }
    }

    // Calculate average notes per month
    let averageNotesPerMonth = 0;
    if (notes.length > 0 && dateFrom) {
      const startDate = new Date(dateFrom);
      const endDate = dateTo ? new Date(dateTo) : new Date();
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                         (endDate.getMonth() - startDate.getMonth()) + 1;
      averageNotesPerMonth = notes.length / Math.max(monthsDiff, 1);
    }

    return {
      totalNotes: notes.length,
      byType,
      mostRecentDate,
      averageNotesPerMonth: Math.round(averageNotesPerMonth * 10) / 10,
    };
  }

  /**
   * Upload attachment for an interaction note
   *
   * @param noteId - Interaction note UUID
   * @param file - File data
   * @param fileName - File name
   * @returns Storage path of uploaded file
   */
  async uploadAttachment(
    noteId: string,
    file: ArrayBuffer | Blob,
    fileName: string
  ): Promise<string> {
    // Validate file name
    if (!fileName || fileName.trim().length === 0) {
      throw new Error('File name is required');
    }

    // Sanitize file name
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Generate unique file path
    const timestamp = Date.now();
    const storagePath = `interaction-notes/${noteId}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await this.supabase.storage
      .from('contact-attachments')
      .upload(storagePath, file, {
        upsert: false,
        contentType: this.getContentType(fileName),
      });

    if (error) {
      console.error('Failed to upload attachment:', error);
      throw new Error(`Failed to upload attachment: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to upload attachment - no data returned');
    }

    // Update interaction note with new attachment
    const { data: note } = await this.supabase
      .from('cd_interaction_notes')
      .select('attachments')
      .eq('id', noteId)
      .single();

    if (note) {
      const currentAttachments = note.attachments || [];
      await this.supabase
        .from('cd_interaction_notes')
        .update({
          attachments: [...currentAttachments, storagePath],
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId);
    }

    return storagePath;
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      txt: 'text/plain',
      csv: 'text/csv',
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }
}