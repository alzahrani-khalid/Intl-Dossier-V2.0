import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { preferenceStorage, type StoredPreferences } from '../utils/storage/preference-storage';

interface UserPreference {
  id?: string;
  user_id: string;
  theme: 'gastat' | 'blue-sky';
  color_mode: 'light' | 'dark';
  language: 'en' | 'ar';
  created_at?: string;
  updated_at?: string;
}

/**
 * Hook to sync preferences with Supabase
 */
export function usePreferenceSync(userId?: string) {
  const queryClient = useQueryClient();

  // Fetch remote preferences
  const { data: remotePreferences, isLoading } = useQuery({
    queryKey: ['preferences', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        throw error;
      }

      if (data) {
        // Convert from database format
        return {
          theme: data.theme,
          colorMode: data.color_mode,
          language: data.language,
          updatedAt: data.updated_at,
        } as StoredPreferences;
      }

      return null;
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });

  // Mutation to save preferences
  const syncMutation = useMutation({
    mutationFn: async (preferences: StoredPreferences) => {
      if (!userId) {
        // Save locally only
        preferenceStorage.save(preferences);
        return preferences;
      }

      // Save locally first
      preferenceStorage.save(preferences);

      // Then sync to Supabase
      const upsertData: Partial<UserPreference> = {
        user_id: userId,
        theme: preferences.theme || 'gastat',
        color_mode: preferences.colorMode || 'light',
        language: preferences.language || 'en',
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(upsertData, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error syncing preferences:', error);
        // Don't throw - preferences are saved locally
        return preferences;
      }

      return {
        theme: data.theme,
        colorMode: data.color_mode,
        language: data.language,
        updatedAt: data.updated_at,
      } as StoredPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', userId] });
    },
  });

  // Merge local and remote preferences
  const mergePreferences = () => {
    const localPreferences = preferenceStorage.get();
    
    if (!remotePreferences && !localPreferences) {
      return null;
    }

    if (!remotePreferences) {
      return localPreferences;
    }

    if (!localPreferences) {
      preferenceStorage.save(remotePreferences);
      return remotePreferences;
    }

    // Use preferenceStorage's merge logic
    return preferenceStorage.merge(remotePreferences);
  };

  const syncPreferences = (preferences: StoredPreferences) => {
    // Debounce sync to avoid too many requests
    if (syncMutation.isPending) {
      return;
    }
    syncMutation.mutate(preferences);
  };

  return {
    syncPreferences,
    isSyncing: syncMutation.isPending,
    lastSyncedAt: remotePreferences?.updatedAt,
    mergedPreferences: mergePreferences(),
    isLoading,
    fetchRemotePreferences: () => remotePreferences,
  };
}

/**
 * Setup real-time subscription for preference changes
 */
export function usePreferenceSubscription(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`preferences:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['preferences', userId] });
          
          // Update local storage
          if (payload.new) {
            const newPrefs = payload.new as UserPreference;
            preferenceStorage.save({
              theme: newPrefs.theme,
              colorMode: newPrefs.color_mode,
              language: newPrefs.language,
              updatedAt: newPrefs.updated_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);
}

// Add missing import
import { useEffect } from 'react';