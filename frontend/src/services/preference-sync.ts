import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import { supabase } from '../lib/supabase'
import { COLUMNS } from '../lib/query-columns'
import { preferenceStorage, type StoredPreferences } from '../utils/storage/preference-storage'

interface UserPreference {
  id?: string
  user_id: string
  // `theme` widened to string: row may hold legacy names (canvas/azure/…) or
  // new Direction values (chancery/situation/ministerial/bureau). Phase 33
  // D-10 wipe runs on DesignProvider mount; design-system layer owns parsing.
  theme: string
  color_mode: 'light' | 'dark'
  language: 'en' | 'ar'
  created_at?: string
  updated_at?: string
}

/**
 * Hook to sync preferences with Supabase
 */
export function usePreferenceSync(userId?: string) {
  const queryClient = useQueryClient()

  // Fetch remote preferences
  const { data: remotePreferences, isLoading } = useQuery({
    queryKey: ['preferences', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('user_preferences')
        .select(COLUMNS.USER_PREFERENCES.ALL)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error)
        throw error
      }

      if (data) {
        // Convert from database format
        return {
          theme: data.theme,
          colorMode: data.color_mode,
          language: data.language,
          updatedAt: data.updated_at,
        } as StoredPreferences
      }

      return null
    },
    enabled: !!userId,
    staleTime: STALE_TIME.NORMAL,
  })

  // Mutation to save preferences
  const syncMutation = useMutation({
    mutationFn: async (preferences: StoredPreferences) => {
      if (!userId) {
        // Save locally only
        preferenceStorage.save(preferences)
        return preferences
      }

      // Save locally first
      preferenceStorage.save(preferences)

      // Then sync to Supabase
      const upsertData: Partial<UserPreference> = {
        user_id: userId,
        theme: preferences.theme || 'chancery',
        color_mode: preferences.colorMode || 'light',
        language: preferences.language || 'en',
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(upsertData, {
          onConflict: 'user_id',
        })
        .select()
        .single()

      if (error) {
        console.error('Error syncing preferences:', error)
        // Don't throw - preferences are saved locally
        return preferences
      }

      return {
        theme: data.theme,
        colorMode: data.color_mode,
        language: data.language,
        updatedAt: data.updated_at,
      } as StoredPreferences
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', userId] })
    },
  })

  // Merge local and remote preferences
  const mergePreferences = () => {
    const localPreferences = preferenceStorage.get()

    if (!remotePreferences && !localPreferences) {
      return null
    }

    if (!remotePreferences) {
      return localPreferences
    }

    if (!localPreferences) {
      preferenceStorage.save(remotePreferences)
      return remotePreferences
    }

    // Use preferenceStorage's merge logic
    return preferenceStorage.merge(remotePreferences)
  }

  const syncPreferences = (preferences: StoredPreferences) => {
    // Debounce sync to avoid too many requests
    if (syncMutation.isPending) {
      return
    }
    syncMutation.mutate(preferences)
  }

  return {
    syncPreferences,
    isSyncing: syncMutation.isPending,
    lastSyncedAt: remotePreferences?.updatedAt,
    mergedPreferences: mergePreferences(),
    isLoading,
    fetchRemotePreferences: () => remotePreferences,
  }
}

