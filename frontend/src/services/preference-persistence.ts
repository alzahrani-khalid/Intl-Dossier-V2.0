import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserPreferences {
  theme: 'gastat' | 'blueSky';
  colorMode: 'light' | 'dark' | 'system';
  language: 'en' | 'ar';
}

export interface StoredPreferences extends UserPreferences {
  timestamp: number;
}

export class PreferencePersistenceService {
  private supabase: SupabaseClient;
  private storageKey = 'theme-preference';
  private syncDebounceTimer: NodeJS.Timeout | null = null;
  private localSaveDebounceTimer: NodeJS.Timeout | null = null;
  private readonly SYNC_DELAY = 1000; // 1 second for remote sync
  private readonly LOCAL_SAVE_DELAY = 100; // 100ms for local storage
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private pendingPreferences: UserPreferences | null = null;

  constructor(supabaseClient: SupabaseClient = supabase) {
    this.supabase = supabaseClient;
  }

  async loadPreferences(userId?: string): Promise<UserPreferences | null> {
    const localPrefs = this.loadLocalPreferences();
    
    if (localPrefs && this.isLocalCacheValid(localPrefs)) {
      return localPrefs;
    }

    const systemPrefs = this.detectSystemPreferences();
    
    if (!userId || !this.supabase) {
      return systemPrefs;
    }

    try {
      const remotePrefs = await this.loadRemotePreferences(userId);
      if (remotePrefs) {
        this.saveLocalPreferences(remotePrefs);
        return remotePrefs;
      }
    } catch (error) {
      console.error('Failed to load remote preferences:', error);
    }

    return localPrefs || systemPrefs;
  }

  savePreferences(preferences: UserPreferences, userId?: string): void {
    // Store pending preferences for debounced save
    this.pendingPreferences = preferences;
    
    // Debounce local storage save
    if (this.localSaveDebounceTimer) {
      clearTimeout(this.localSaveDebounceTimer);
    }
    
    this.localSaveDebounceTimer = setTimeout(() => {
      if (this.pendingPreferences) {
        this.saveLocalPreferences(this.pendingPreferences);
      }
    }, this.LOCAL_SAVE_DELAY);
    
    // Debounce remote sync with longer delay
    if (userId && this.supabase) {
      if (this.syncDebounceTimer) {
        clearTimeout(this.syncDebounceTimer);
      }
      
      this.syncDebounceTimer = setTimeout(() => {
        if (this.pendingPreferences) {
          this.syncRemotePreferences(userId, this.pendingPreferences);
        }
      }, this.SYNC_DELAY);
    }
  }

  private loadLocalPreferences(): UserPreferences | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored) as StoredPreferences;
      return {
        theme: parsed.theme || 'gastat',
        colorMode: parsed.colorMode || 'light',
        language: parsed.language || 'en',
      };
    } catch (error) {
      console.error('Failed to load local preferences:', error);
      return null;
    }
  }

  private saveLocalPreferences(preferences: UserPreferences): void {
    try {
      const stored: StoredPreferences = {
        ...preferences,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to save local preferences:', error);
    }
  }

  private isLocalCacheValid(preferences: StoredPreferences): boolean {
    if (!preferences.timestamp) return false;
    return Date.now() - preferences.timestamp < this.CACHE_DURATION;
  }

  private detectSystemPreferences(): UserPreferences {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const browserLang = navigator.language.toLowerCase();
    const language = browserLang.startsWith('ar') ? 'ar' : 'en';
    
    return {
      theme: 'gastat',
      colorMode: prefersDark ? 'system' : 'light',
      language,
    };
  }

  private async loadRemotePreferences(userId: string): Promise<UserPreferences | null> {
    if (!this.supabase) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('theme, color_mode, language')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) return null;
      
      return {
        theme: data.theme,
        colorMode: data.color_mode,
        language: data.language,
      };
    } catch (error) {
      console.error('Failed to load remote preferences:', error);
      return null;
    }
  }

  private async syncRemotePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    if (!this.supabase) return;
    
    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          theme: preferences.theme,
          color_mode: preferences.colorMode,
          language: preferences.language,
        }, {
          onConflict: 'user_id',
        });
      
      if (error) {
        console.error('Failed to sync remote preferences:', error);
      }
    } catch (error) {
      console.error('Failed to sync remote preferences:', error);
    }
  }
  
  // Clean up method to cancel pending operations
  cleanup(): void {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
    if (this.localSaveDebounceTimer) {
      clearTimeout(this.localSaveDebounceTimer);
      this.localSaveDebounceTimer = null;
    }
    // Save any pending changes immediately
    if (this.pendingPreferences) {
      this.saveLocalPreferences(this.pendingPreferences);
      this.pendingPreferences = null;
    }
  }

  subscribeToChanges(callback: (preferences: UserPreferences) => void): () => void {
    const handleStorageChange = (event: StorageEvent): void => {
      if (event.key !== this.storageKey || !event.newValue) return;
      
      try {
        const parsed = JSON.parse(event.newValue) as StoredPreferences;
        callback({
          theme: parsed.theme,
          colorMode: parsed.colorMode,
          language: parsed.language,
        });
      } catch (error) {
        console.error('Failed to parse storage change:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}