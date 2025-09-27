import { createClient } from '@supabase/supabase-js';
import { 
  UserPreference, 
  PreferenceUpdate, 
  DEFAULT_PREFERENCES,
  UserPreferenceSchema,
  PreferenceUpdateSchema 
} from '../models/user-preferences';

export class PreferencesService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getUserPreferences(userId: string): Promise<UserPreference | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      const preference = {
        id: data.id,
        userId: data.user_id,
        theme: data.theme,
        colorMode: data.color_mode,
        language: data.language,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return UserPreferenceSchema.parse(preference);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  async createUserPreferences(userId: string, preferences?: PreferenceUpdate): Promise<UserPreference> {
    try {
      const validatedPreferences = preferences 
        ? PreferenceUpdateSchema.parse(preferences)
        : {};

      const { data, error } = await this.supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          theme: validatedPreferences.theme || DEFAULT_PREFERENCES.theme,
          color_mode: validatedPreferences.colorMode || DEFAULT_PREFERENCES.colorMode,
          language: validatedPreferences.language || DEFAULT_PREFERENCES.language,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const preference = {
        id: data.id,
        userId: data.user_id,
        theme: data.theme,
        colorMode: data.color_mode,
        language: data.language,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return UserPreferenceSchema.parse(preference);
    } catch (error) {
      console.error('Error creating user preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId: string, updates: PreferenceUpdate): Promise<UserPreference> {
    try {
      const validatedUpdates = PreferenceUpdateSchema.parse(updates);
      
      const updateData: any = {};
      if (validatedUpdates.theme !== undefined) {
        updateData.theme = validatedUpdates.theme;
      }
      if (validatedUpdates.colorMode !== undefined) {
        updateData.color_mode = validatedUpdates.colorMode;
      }
      if (validatedUpdates.language !== undefined) {
        updateData.language = validatedUpdates.language;
      }

      const { data, error } = await this.supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return this.createUserPreferences(userId, updates);
        }
        throw error;
      }

      const preference = {
        id: data.id,
        userId: data.user_id,
        theme: data.theme,
        colorMode: data.color_mode,
        language: data.language,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return UserPreferenceSchema.parse(preference);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async upsertUserPreferences(userId: string, preferences: PreferenceUpdate): Promise<UserPreference> {
    const existing = await this.getUserPreferences(userId);
    
    if (existing) {
      return this.updateUserPreferences(userId, preferences);
    } else {
      return this.createUserPreferences(userId, preferences);
    }
  }
}