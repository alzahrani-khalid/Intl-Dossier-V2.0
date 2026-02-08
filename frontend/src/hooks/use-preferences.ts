import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/auth.context'
import { useTheme } from '../components/theme-provider/theme-provider'
import { useLanguage } from '../components/language-provider/language-provider'
import { PreferencePersistenceService, UserPreferences } from '../services/preference-persistence'
import { supabase } from '../lib/supabase'

/**
 * Map from PreferencePersistenceService theme names to ThemeProvider theme names.
 * The persistence layer stores 'gastat' | 'blueSky' but the ThemeProvider only supports 'canvas'.
 */
function toProviderTheme(_persistedTheme: UserPreferences['theme']): 'canvas' {
  // All persisted themes map to the single available provider theme for now
  return 'canvas'
}

/**
 * Map from ThemeProvider theme name back to the persisted theme name.
 */
function toPersistedTheme(_providerTheme: string): UserPreferences['theme'] {
  return 'gastat'
}

export function usePreferences() {
  const { user } = useAuth()
  const { theme, colorMode, setTheme, setColorMode } = useTheme()
  const { language, setLanguage } = useLanguage()
  const serviceRef = useRef<PreferencePersistenceService | undefined>(undefined)

  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new PreferencePersistenceService(supabase)
    }

    const loadPreferences = async () => {
      const preferences = await serviceRef.current!.loadPreferences(user?.id)
      if (preferences) {
        setTheme(toProviderTheme(preferences.theme))
        setColorMode(preferences.colorMode)
        setLanguage(preferences.language)
      }
    }

    loadPreferences()

    const unsubscribe = serviceRef.current.subscribeToChanges((prefs) => {
      setTheme(toProviderTheme(prefs.theme))
      setColorMode(prefs.colorMode)
      setLanguage(prefs.language)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id, setTheme, setColorMode, setLanguage])

  useEffect(() => {
    if (!serviceRef.current) return

    const preferences: UserPreferences = {
      theme: toPersistedTheme(theme),
      colorMode,
      language,
    }

    serviceRef.current.savePreferences(preferences, user?.id)
  }, [theme, colorMode, language, user?.id])

  return {
    theme,
    colorMode,
    language,
    setTheme,
    setColorMode,
    setLanguage,
  }
}
