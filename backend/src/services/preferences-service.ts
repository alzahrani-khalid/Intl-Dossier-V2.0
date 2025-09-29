import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  UserPreference,
  UserPreferenceUpdate,
  UserPreferenceSchema,
  UserPreferenceUpdateSchema,
  USER_PREFERENCES_TABLE,
  DEFAULT_PREFERENCES,
  mapDatabaseToUserPreference,
  mapUserPreferenceToDatabase,
  validateUserId
} from '../models/user-preference';

/**
 * Service for managing user preferences
 */
export class PreferencesService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('Supabase URL and service key are required');
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Get user preferences by user ID
   * Returns default preferences if none exist
   */
  async getPreferences(userId: string): Promise<UserPreference & { isDefault?: boolean }> {
    // Validate user ID
    if (!validateUserId(userId)) {
      throw new Error('Invalid user ID format');
    }

    try {
      const { data, error } = await this.supabase
        .from(USER_PREFERENCES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If preferences not found, return defaults
        if (error.code === 'PGRST116') {
          return {
            ...DEFAULT_PREFERENCES,
            userId,
            isDefault: true
          } as UserPreference & { isDefault: boolean };
        }
        throw error;
      }

      return mapDatabaseToUserPreference(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  }

  /**
   * Create or update user preferences
   */
  async upsertPreferences(
    userId: string,
    preferences: UserPreferenceUpdate
  ): Promise<UserPreference> {
    // Validate user ID
    if (!validateUserId(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Validate preferences
    const validationResult = UserPreferenceUpdateSchema.safeParse(preferences);
    if (!validationResult.success) {
      throw new Error(`Invalid preferences: ${validationResult.error.message}`);
    }

    try {
      // Check if preferences exist
      const { data: existing } = await this.supabase
        .from(USER_PREFERENCES_TABLE)
        .select('id')
        .eq('user_id', userId)
        .single();

      let result;

      if (existing) {
        // Update existing preferences
        const updateData = mapUserPreferenceToDatabase(preferences);
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await this.supabase
          .from(USER_PREFERENCES_TABLE)
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new preferences
        const insertData = mapUserPreferenceToDatabase({
          ...DEFAULT_PREFERENCES,
          ...preferences,
          userId
        });

        const { data, error } = await this.supabase
          .from(USER_PREFERENCES_TABLE)
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return mapDatabaseToUserPreference(result);
    } catch (error) {
      console.error('Error upserting preferences:', error);
      throw error;
    }
  }

  /**
   * Delete user preferences
   */
  async deletePreferences(userId: string): Promise<void> {
    // Validate user ID
    if (!validateUserId(userId)) {
      throw new Error('Invalid user ID format');
    }

    try {
      const { error } = await this.supabase
        .from(USER_PREFERENCES_TABLE)
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting preferences:', error);
      throw error;
    }
  }

  /**
   * Get preferences for multiple users
   */
  async getBulkPreferences(userIds: string[]): Promise<UserPreference[]> {
    // Validate all user IDs
    const invalidIds = userIds.filter(id => !validateUserId(id));
    if (invalidIds.length > 0) {
      throw new Error(`Invalid user IDs: ${invalidIds.join(', ')}`);
    }

    try {
      const { data, error } = await this.supabase
        .from(USER_PREFERENCES_TABLE)
        .select('*')
        .in('user_id', userIds);

      if (error) throw error;

      const preferences = (data || []).map(mapDatabaseToUserPreference);

      // Add defaults for missing users
      const foundUserIds = new Set(preferences.map(p => p.userId));
      const missingUsers = userIds.filter(id => !foundUserIds.has(id));

      for (const userId of missingUsers) {
        preferences.push({
          ...DEFAULT_PREFERENCES,
          userId,
          isDefault: true
        } as UserPreference);
      }

      return preferences;
    } catch (error) {
      console.error('Error fetching bulk preferences:', error);
      throw error;
    }
  }

  /**
   * Validate preferences without saving
   */
  validatePreferences(preferences: any): { valid: boolean; errors?: string[] } {
    const result = UserPreferenceUpdateSchema.safeParse(preferences);
    
    if (result.success) {
      return { valid: true };
    }

    const errors = result.error.errors.map(err => {
      return `${err.path.join('.')}: ${err.message}`;
    });

    return { valid: false, errors };
  }

  /**
   * Get available theme options
   */
  getAvailableThemes(): string[] {
    return ['gastat', 'blue-sky'];
  }

  /**
   * Get available color modes
   */
  getAvailableColorModes(): string[] {
    return ['light', 'dark'];
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): string[] {
    return ['en', 'ar'];
  }
}