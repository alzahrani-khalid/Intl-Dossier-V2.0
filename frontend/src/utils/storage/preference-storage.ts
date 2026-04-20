/**
 * Local storage utility for user preferences
 * Provides immediate persistence with fallback handling
 *
 * Phase 33-07 notes:
 *   - `wipeLegacyThemeKeys()` is run once on DesignProvider mount (D-10) to
 *     clear keys written by the removed legacy theme system (`theme`,
 *     `colorMode`, `theme-preference`, `dossier.theme`). The D-16 engine
 *     writes its own canonical keys (`id.dir`, `id.theme`, `id.hue`,
 *     `id.density`) directly from DesignProvider. The `user-preferences`
 *     blob here is owned by preference-sync and is NOT touched by the wipe.
 */

const LEGACY_THEME_KEYS = ['theme', 'colorMode', 'theme-preference', 'dossier.theme'] as const
const WIPE_GUARD_KEY = 'id.legacy-wipe.v1'

/**
 * Remove legacy theme keys once per browser (guarded by a version flag so it
 * is idempotent across reloads). Safe to call on every app mount.
 */
export function wipeLegacyThemeKeys(): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (localStorage.getItem(WIPE_GUARD_KEY) === '1') return
    for (const key of LEGACY_THEME_KEYS) {
      localStorage.removeItem(key)
    }
    localStorage.setItem(WIPE_GUARD_KEY, '1')
  } catch {
    /* localStorage unavailable — no-op. */
  }
}

export interface StoredPreferences {
  // `theme` kept as plain string: legacy blobs may hold old names (canvas/azure/…);
  // new blobs hold Direction values (chancery/situation/ministerial/bureau). The
  // design-system layer owns interpretation. Phase 33 D-10 wipe (below) removes
  // the old keys on first load after deploy.
  theme: string
  colorMode: 'light' | 'dark'
  language: 'en' | 'ar'
  updatedAt: string
}

const STORAGE_KEY = 'user-preferences'

/**
 * Get preferences from localStorage
 */
export function getStoredPreferences(): StoredPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    // Validate the stored data
    if (
      typeof parsed.theme === 'string' &&
      typeof parsed.colorMode === 'string' &&
      typeof parsed.language === 'string' &&
      typeof parsed.updatedAt === 'string'
    ) {
      return parsed as StoredPreferences
    }

    return null
  } catch (error) {
    console.error('Failed to read preferences from localStorage:', error)
    return null
  }
}

/**
 * Save preferences to localStorage
 */
export function setStoredPreferences(preferences: Omit<StoredPreferences, 'updatedAt'>): boolean {
  try {
    const toStore: StoredPreferences = {
      ...preferences,
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    return true
  } catch (error) {
    // Handle quota exceeded or security errors
    console.error('Failed to save preferences to localStorage:', error)
    return false
  }
}

/**
 * Clear stored preferences
 */
export function clearStoredPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear preferences from localStorage:', error)
  }
}

/**
 * Get system color mode preference
 */
function getSystemColorMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Get system language preference
 */
function getSystemLanguage(): 'en' | 'ar' {
  if (typeof window === 'undefined') return 'en'

  const browserLang = navigator.language.toLowerCase()
  return browserLang.startsWith('ar') ? 'ar' : 'en'
}

/**
 * Watch for storage changes from other tabs
 */
function watchStorageChanges(
  callback: (preferences: StoredPreferences | null) => void,
): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      const newValue = event.newValue ? JSON.parse(event.newValue) : null
      callback(newValue)
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}

/**
 * Convenience object for preference storage operations
 */
export const preferenceStorage = {
  get: getStoredPreferences,
  save: (preferences: StoredPreferences | Omit<StoredPreferences, 'updatedAt'>) => {
    if ('updatedAt' in preferences) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
        return true
      } catch (error) {
        console.error('Failed to save preferences to localStorage:', error)
        return false
      }
    }
    return setStoredPreferences(preferences)
  },
  clear: clearStoredPreferences,
  merge: (remote: StoredPreferences): StoredPreferences => {
    const local = getStoredPreferences()
    if (!local) return remote
    // Use whichever is newer
    if (new Date(remote.updatedAt) > new Date(local.updatedAt)) {
      return remote
    }
    return local
  },
}
