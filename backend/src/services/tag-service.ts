/**
 * Tag Service
 *
 * Manages tags for contacts with unique name validation.
 *
 * @module tag-service
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/contact-directory.types.js';

type Tag = Database['public']['Tables']['cd_tags']['Row'];
type TagInsert = Database['public']['Tables']['cd_tags']['Insert'];
type TagUpdate = Database['public']['Tables']['cd_tags']['Update'];

export class TagService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new tag with unique name validation
   *
   * @param tag - Tag data to insert
   * @returns Created tag record
   */
  async create(tag: TagInsert): Promise<Tag> {
    // Validate required fields
    if (!tag.name || tag.name.trim().length < 2) {
      throw new Error('name is required and must be at least 2 characters');
    }

    if (tag.name.length > 100) {
      throw new Error('name cannot exceed 100 characters');
    }

    if (!tag.category) {
      throw new Error('category is required');
    }

    // Validate category
    const allowedCategories = [
      'skill',
      'department',
      'project',
      'location',
      'language',
      'certification',
      'industry',
      'interest',
      'other'
    ];

    if (!allowedCategories.includes(tag.category)) {
      throw new Error(`category must be one of: ${allowedCategories.join(', ')}`);
    }

    // Validate color if provided (hex color format)
    if (tag.color) {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(tag.color)) {
        throw new Error('color must be a valid hex color (e.g., #FF5733 or #F53)');
      }
    }

    // Check for unique name within category
    const { data: existing } = await this.supabase
      .from('cd_tags')
      .select('id')
      .eq('name', tag.name)
      .eq('category', tag.category)
      .maybeSingle();

    if (existing) {
      throw new Error(`Tag with name "${tag.name}" already exists in category "${tag.category}"`);
    }

    // Validate icon if provided (emoji or icon name)
    if (tag.icon) {
      // Check if it's an emoji (Unicode emoji pattern)
      const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u;
      // Or check if it's an icon name (alphanumeric with dashes)
      const iconNameRegex = /^[a-z0-9-]+$/;

      if (!emojiRegex.test(tag.icon) && !iconNameRegex.test(tag.icon)) {
        throw new Error('icon must be either an emoji or a lowercase icon name (e.g., "user-circle")');
      }
    }

    // Insert tag
    const { data, error } = await this.supabase
      .from('cd_tags')
      .insert(tag)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error(`Tag with name "${tag.name}" already exists`);
      }
      throw error;
    }

    if (!data) throw new Error('Failed to create tag');

    return data;
  }

  /**
   * Get all tags with optional category filtering
   *
   * @param query - Query parameters
   * @returns Array of tags
   */
  async getAll(query: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: Tag[]; count: number }> {
    let queryBuilder = this.supabase
      .from('cd_tags')
      .select('*', { count: 'exact' });

    // Filter by category
    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }

    // Search filter (name contains)
    if (query.search) {
      queryBuilder = queryBuilder.ilike('name', `%${query.search}%`);
    }

    // Order by category and then name
    queryBuilder = queryBuilder
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    // Pagination
    const limit = query.limit || 100;
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
   * Get tag by ID
   *
   * @param id - Tag UUID
   * @returns Tag record or null
   */
  async getById(id: string): Promise<Tag | null> {
    const { data, error } = await this.supabase
      .from('cd_tags')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Return null if not found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get tags by names (for bulk operations)
   *
   * @param names - Array of tag names
   * @param category - Optional category filter
   * @returns Array of matching tags
   */
  async getByNames(names: string[], category?: string): Promise<Tag[]> {
    if (names.length === 0) {
      return [];
    }

    let queryBuilder = this.supabase
      .from('cd_tags')
      .select('*')
      .in('name', names);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return data || [];
  }

  /**
   * Update existing tag
   *
   * @param id - Tag UUID
   * @param updates - Fields to update
   * @returns Updated tag record
   */
  async update(id: string, updates: TagUpdate): Promise<Tag> {
    // Validate updates if provided
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length < 2) {
        throw new Error('name must be at least 2 characters');
      }
      if (updates.name.length > 100) {
        throw new Error('name cannot exceed 100 characters');
      }

      // Check for unique name if changing
      const { data: existing } = await this.supabase
        .from('cd_tags')
        .select('id, category')
        .eq('id', id)
        .single();

      if (existing) {
        const { data: duplicate } = await this.supabase
          .from('cd_tags')
          .select('id')
          .eq('name', updates.name)
          .eq('category', updates.category || existing.category)
          .neq('id', id)
          .maybeSingle();

        if (duplicate) {
          throw new Error(`Tag with name "${updates.name}" already exists in this category`);
        }
      }
    }

    if (updates.category !== undefined) {
      const allowedCategories = [
        'skill',
        'department',
        'project',
        'location',
        'language',
        'certification',
        'industry',
        'interest',
        'other'
      ];

      if (!allowedCategories.includes(updates.category)) {
        throw new Error(`category must be one of: ${allowedCategories.join(', ')}`);
      }
    }

    if (updates.color !== undefined && updates.color !== null) {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(updates.color)) {
        throw new Error('color must be a valid hex color');
      }
    }

    if (updates.icon !== undefined && updates.icon !== null) {
      const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u;
      const iconNameRegex = /^[a-z0-9-]+$/;

      if (!emojiRegex.test(updates.icon) && !iconNameRegex.test(updates.icon)) {
        throw new Error('icon must be either an emoji or a lowercase icon name');
      }
    }

    const { data, error } = await this.supabase
      .from('cd_tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error(`Tag with name "${updates.name}" already exists`);
      }
      throw error;
    }

    if (!data) throw new Error('Tag not found');

    return data;
  }

  /**
   * Delete a tag
   *
   * @param id - Tag UUID
   * @returns Deleted tag record
   */
  async delete(id: string): Promise<Tag> {
    const { data, error } = await this.supabase
      .from('cd_tags')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Tag not found');

    return data;
  }

  /**
   * Get all available categories
   *
   * @returns Array of category names
   */
  async getCategories(): Promise<string[]> {
    return [
      'skill',
      'department',
      'project',
      'location',
      'language',
      'certification',
      'industry',
      'interest',
      'other'
    ];
  }

  /**
   * Create multiple tags (bulk operation)
   *
   * @param tags - Array of tags to create
   * @returns Array of created tags
   */
  async createBulk(tags: TagInsert[]): Promise<Tag[]> {
    // Validate all tags first
    const validationErrors: string[] = [];

    tags.forEach((tag, index) => {
      if (!tag.name || tag.name.trim().length < 2) {
        validationErrors.push(`Tag ${index + 1}: name is required and must be at least 2 characters`);
      }
      if (!tag.category) {
        validationErrors.push(`Tag ${index + 1}: category is required`);
      }
    });

    if (validationErrors.length > 0) {
      throw new Error(`Validation errors:\n${validationErrors.join('\n')}`);
    }

    // Check for duplicates within the batch
    const nameSet = new Set<string>();
    tags.forEach((tag) => {
      const key = `${tag.category}:${tag.name}`;
      if (nameSet.has(key)) {
        throw new Error(`Duplicate tag in batch: "${tag.name}" in category "${tag.category}"`);
      }
      nameSet.add(key);
    });

    // Insert all tags
    const { data, error } = await this.supabase
      .from('cd_tags')
      .insert(tags)
      .select();

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        throw new Error('One or more tags already exist');
      }
      throw error;
    }

    return data || [];
  }
}