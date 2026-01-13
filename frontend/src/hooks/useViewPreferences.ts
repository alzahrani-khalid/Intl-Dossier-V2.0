/**
 * useViewPreferences Hook
 *
 * Manages user view preferences including filters, sorts, column visibility,
 * and saved custom views with persistence across sessions.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth.context'
import type {
  EntityViewType,
  ViewConfig,
  DefaultViewPreferences,
  UserViewPreference,
  SavedView,
  CreateSavedViewInput,
  UpdateSavedViewInput,
  ViewPreferencesResponse,
} from '@/types/view-preferences.types'

// Constants
const STORAGE_KEY_PREFIX = 'view-preferences-'
const DEBOUNCE_DELAY = 1000 // 1 second debounce for saving preferences

/**
 * Fetch view preferences from Edge Function
 */
async function fetchViewPreferences(entityType: EntityViewType): Promise<ViewPreferencesResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { preferences: null, saved_views: [] }
  }

  // Call the Edge Function with the entity_type as query parameter
  const { data, error } = await supabase.functions.invoke(
    `view-preferences?entity_type=${entityType}`,
    {
      method: 'GET',
    },
  )

  if (error) {
    console.error('Error fetching view preferences:', error)
    throw error
  }

  return data as ViewPreferencesResponse
}

/**
 * Local storage helpers for fallback/offline support
 */
function getLocalPreferences(entityType: EntityViewType): ViewConfig | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${entityType}`)
    if (stored) {
      return JSON.parse(stored) as ViewConfig
    }
  } catch (error) {
    console.error('Error reading local preferences:', error)
  }
  return null
}

function setLocalPreferences(entityType: EntityViewType, config: ViewConfig): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${entityType}`, JSON.stringify(config))
  } catch (error) {
    console.error('Error saving local preferences:', error)
  }
}

/**
 * Hook for managing view preferences
 */
export function useViewPreferences(entityType: EntityViewType) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Local state for current view configuration (may differ from saved)
  const [currentViewConfig, setCurrentViewConfigState] = useState<ViewConfig>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Query key for this entity type
  const queryKey = ['view-preferences', entityType, user?.id]

  // Fetch preferences from server
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchViewPreferences(entityType),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  })

  // Initialize current view config from preferences or local storage
  useEffect(() => {
    if (data) {
      // Check if there's a default saved view
      const defaultView = data.saved_views.find((v) => v.is_default)
      if (defaultView) {
        setCurrentViewConfigState(defaultView.view_config)
      } else if (data.preferences?.default_preferences) {
        setCurrentViewConfigState(data.preferences.default_preferences)
      }
      setHasUnsavedChanges(false)
    } else if (!user) {
      // Fallback to local storage for non-authenticated users
      const localPrefs = getLocalPreferences(entityType)
      if (localPrefs) {
        setCurrentViewConfigState(localPrefs)
      }
    }
  }, [data, user, entityType])

  // Mutation: Update default preferences
  const updateDefaultPreferencesMutation = useMutation({
    mutationFn: async (preferences: DefaultViewPreferences) => {
      const { data, error } = await supabase.functions.invoke('view-preferences/preferences', {
        method: 'POST',
        body: {
          entity_type: entityType,
          default_preferences: preferences,
        },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Mutation: Create saved view
  const createSavedViewMutation = useMutation({
    mutationFn: async (input: Omit<CreateSavedViewInput, 'entity_type'>) => {
      const { data, error } = await supabase.functions.invoke('view-preferences/saved-views', {
        method: 'POST',
        body: {
          entity_type: entityType,
          ...input,
        },
      })

      if (error) throw error
      return data as SavedView
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Mutation: Update saved view
  const updateSavedViewMutation = useMutation({
    mutationFn: async (input: UpdateSavedViewInput) => {
      const { id, ...updateData } = input
      const { data, error } = await supabase.functions.invoke(
        `view-preferences/saved-views/${id}`,
        {
          method: 'PUT',
          body: updateData,
        },
      )

      if (error) throw error
      return data as SavedView
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Mutation: Delete saved view
  const deleteSavedViewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke(`view-preferences/saved-views/${id}`, {
        method: 'DELETE',
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Mutation: Set default view
  const setDefaultViewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke(
        `view-preferences/saved-views/${id}/set-default`,
        {
          method: 'POST',
        },
      )

      if (error) throw error
      return data as SavedView
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Mutation: Toggle pinned status
  const togglePinnedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke(
        `view-preferences/saved-views/${id}/toggle-pin`,
        {
          method: 'POST',
        },
      )

      if (error) throw error
      return data as SavedView
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Derived data
  const preferences = data?.preferences ?? null
  const savedViews = data?.saved_views ?? []
  const defaultView = useMemo(() => savedViews.find((v) => v.is_default) ?? null, [savedViews])
  const pinnedViews = useMemo(() => savedViews.filter((v) => v.is_pinned), [savedViews])

  // Actions
  const setCurrentViewConfig = useCallback(
    (config: ViewConfig) => {
      setCurrentViewConfigState(config)
      setHasUnsavedChanges(true)
      // Also save to local storage for offline support
      setLocalPreferences(entityType, config)
    },
    [entityType],
  )

  const updateDefaultPreferences = useCallback(
    async (preferences: DefaultViewPreferences) => {
      if (!user) {
        // For non-authenticated users, just save locally
        setLocalPreferences(entityType, preferences)
        return
      }
      await updateDefaultPreferencesMutation.mutateAsync(preferences)
      setHasUnsavedChanges(false)
    },
    [user, entityType, updateDefaultPreferencesMutation],
  )

  const createSavedView = useCallback(
    async (input: Omit<CreateSavedViewInput, 'entity_type'>) => {
      if (!user) {
        throw new Error('Must be authenticated to create saved views')
      }
      const result = await createSavedViewMutation.mutateAsync(input)
      setHasUnsavedChanges(false)
      return result
    },
    [user, createSavedViewMutation],
  )

  const updateSavedView = useCallback(
    async (input: UpdateSavedViewInput) => {
      if (!user) {
        throw new Error('Must be authenticated to update saved views')
      }
      return await updateSavedViewMutation.mutateAsync(input)
    },
    [user, updateSavedViewMutation],
  )

  const deleteSavedView = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error('Must be authenticated to delete saved views')
      }
      await deleteSavedViewMutation.mutateAsync(id)
    },
    [user, deleteSavedViewMutation],
  )

  const setDefaultView = useCallback(
    async (id: string | null) => {
      if (!user) {
        throw new Error('Must be authenticated to set default view')
      }
      if (id) {
        await setDefaultViewMutation.mutateAsync(id)
      }
    },
    [user, setDefaultViewMutation],
  )

  const togglePinned = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error('Must be authenticated to toggle pinned status')
      }
      await togglePinnedMutation.mutateAsync(id)
    },
    [user, togglePinnedMutation],
  )

  const applyView = useCallback((viewConfig: ViewConfig) => {
    setCurrentViewConfigState(viewConfig)
    setHasUnsavedChanges(false)
  }, [])

  const resetToDefault = useCallback(() => {
    if (defaultView) {
      setCurrentViewConfigState(defaultView.view_config)
    } else if (preferences?.default_preferences) {
      setCurrentViewConfigState(preferences.default_preferences)
    } else {
      setCurrentViewConfigState({})
    }
    setHasUnsavedChanges(false)
  }, [defaultView, preferences])

  // Save current config as default (convenience method)
  const saveCurrentAsDefault = useCallback(async () => {
    await updateDefaultPreferences(currentViewConfig)
  }, [currentViewConfig, updateDefaultPreferences])

  // Check if any mutations are in progress
  const isUpdating =
    updateDefaultPreferencesMutation.isPending ||
    createSavedViewMutation.isPending ||
    updateSavedViewMutation.isPending ||
    deleteSavedViewMutation.isPending ||
    setDefaultViewMutation.isPending ||
    togglePinnedMutation.isPending

  return {
    // Data
    preferences,
    savedViews,
    defaultView,
    pinnedViews,

    // Loading states
    isLoading,
    isUpdating,
    error,

    // Current view state
    currentViewConfig,
    setCurrentViewConfig,
    hasUnsavedChanges,

    // Actions
    updateDefaultPreferences,
    createSavedView,
    updateSavedView,
    deleteSavedView,
    setDefaultView,
    togglePinned,
    applyView,
    resetToDefault,
    saveCurrentAsDefault,
  }
}

/**
 * Helper hook to sync view config with URL params
 * Useful for pages that want URL-based state with preference persistence
 */
export function useViewPreferencesWithUrl<T extends ViewConfig>(
  entityType: EntityViewType,
  urlConfig: T,
  setUrlConfig: (config: T) => void,
) {
  const viewPreferences = useViewPreferences(entityType)
  const [initialized, setInitialized] = useState(false)

  // On mount, apply saved preferences to URL if no URL params are set
  useEffect(() => {
    if (!initialized && !viewPreferences.isLoading) {
      const hasUrlParams = Object.keys(urlConfig).some(
        (key) => urlConfig[key as keyof T] !== undefined,
      )

      if (!hasUrlParams && viewPreferences.defaultView) {
        // Apply default view to URL
        setUrlConfig(viewPreferences.defaultView.view_config as T)
      } else if (!hasUrlParams && viewPreferences.preferences?.default_preferences) {
        // Apply default preferences to URL
        setUrlConfig(viewPreferences.preferences.default_preferences as T)
      }

      setInitialized(true)
    }
  }, [
    initialized,
    viewPreferences.isLoading,
    viewPreferences.defaultView,
    viewPreferences.preferences,
    urlConfig,
    setUrlConfig,
  ])

  // Sync URL changes to current view config
  useEffect(() => {
    if (initialized) {
      viewPreferences.setCurrentViewConfig(urlConfig)
    }
  }, [urlConfig, initialized, viewPreferences.setCurrentViewConfig])

  return {
    ...viewPreferences,
    initialized,
  }
}

export default useViewPreferences
