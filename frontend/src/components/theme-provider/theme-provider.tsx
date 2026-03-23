import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Theme type - extensible for future themes
type Theme = 'canvas' | 'azure' | 'lavender' | 'bluesky'
type ColorMode = 'light' | 'dark' | 'system'

// Available themes for validation and UI
export const AVAILABLE_THEMES = ['canvas', 'azure', 'lavender', 'bluesky'] as const

// Available color modes for UI toggles
const AVAILABLE_COLOR_MODES: ColorMode[] = ['light', 'dark', 'system'] as const

type ThemePreset = 'default' | 'underground' | 'rose-garden' | 'ocean-breeze'

const THEME_TO_PRESET: Record<Theme, ThemePreset> = {
  canvas: 'default',
  azure: 'underground',
  lavender: 'rose-garden',
  bluesky: 'ocean-breeze',
}

function isTheme(value: unknown): value is Theme {
  return value === 'canvas' || value === 'azure' || value === 'lavender' || value === 'bluesky'
}

function normalizeTheme(value: unknown, fallback: Theme): Theme {
  return isTheme(value) ? value : fallback
}

interface ThemeContextValue {
  theme: Theme
  colorMode: ColorMode
  /** The actual resolved color mode (system resolves to light or dark) */
  resolvedColorMode: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  setColorMode: (mode: ColorMode) => void
  /** Toggle between light and dark */
  toggleColorMode: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: Theme
  initialColorMode?: string
}

export function ThemeProvider({
  children,
  initialTheme = 'canvas',
  initialColorMode: _initialColorMode = 'light',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize theme from localStorage if available
    const stored = localStorage.getItem('user-preferences')
    if (stored) {
      try {
        const prefs = JSON.parse(stored)
        return normalizeTheme(prefs.theme, initialTheme)
      } catch (e) {
        console.warn('Failed to parse user preferences:', e)
      }
    }
    return initialTheme
  })

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    // Initialize color mode from localStorage or system preference
    const stored = localStorage.getItem('user-preferences')
    if (stored) {
      try {
        const prefs = JSON.parse(stored)
        if (
          prefs.colorMode &&
          (prefs.colorMode === 'light' ||
            prefs.colorMode === 'dark' ||
            prefs.colorMode === 'system')
        ) {
          return prefs.colorMode
        }
      } catch (e) {
        console.warn('Failed to parse user preferences:', e)
      }
    }
    // Check system preference for color mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  // Resolve color mode for applying to DOM
  const effectiveColorMode: 'light' | 'dark' =
    colorMode === 'system'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : colorMode

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    // Set theme palette via data-theme attribute (scalable architecture)
    root.setAttribute('data-theme', theme)
    body.setAttribute('data-theme-preset', THEME_TO_PRESET[theme])
    body.setAttribute('data-theme-radius', 'md')
    body.setAttribute('data-theme-scale', 'none')
    body.setAttribute('data-theme-content-layout', 'full')

    // Set color mode via .dark class (shadcn pattern)
    if (effectiveColorMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme, effectiveColorMode])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (!isTheme(newTheme)) {
        console.error(`Invalid theme: ${newTheme}`)
        return
      }

      setThemeState(newTheme)

      // Save to localStorage
      const stored = localStorage.getItem('user-preferences')
      let prefs = {
        theme: newTheme,
        colorMode,
        language: 'en',
        updatedAt: new Date().toISOString(),
      }
      if (stored) {
        try {
          const existing = JSON.parse(stored)
          prefs = { ...existing, theme: newTheme, updatedAt: new Date().toISOString() }
        } catch (e) {
          // Use defaults
        }
      }
      localStorage.setItem('user-preferences', JSON.stringify(prefs))

      // Dispatch custom event for cross-component sync
      window.dispatchEvent(
        new CustomEvent('themeChange', {
          detail: { theme: newTheme, colorMode },
        }),
      )

      // Dispatch for cross-tab sync
      window.dispatchEvent(
        new CustomEvent('preferenceChange', {
          detail: { theme: newTheme },
        }),
      )
    },
    [colorMode],
  )

  const setColorMode = useCallback(
    (newMode: ColorMode) => {
      setColorModeState(newMode)

      // Save to localStorage
      const stored = localStorage.getItem('user-preferences')
      let prefs = { theme, colorMode: newMode, language: 'en', updatedAt: new Date().toISOString() }
      if (stored) {
        try {
          const existing = JSON.parse(stored)
          prefs = { ...existing, colorMode: newMode, updatedAt: new Date().toISOString() }
        } catch (e) {
          // Use defaults
        }
      }
      localStorage.setItem('user-preferences', JSON.stringify(prefs))

      // Dispatch custom event
      window.dispatchEvent(
        new CustomEvent('themeChange', {
          detail: { theme, colorMode: newMode },
        }),
      )

      // Dispatch for cross-tab sync
      window.dispatchEvent(
        new CustomEvent('preferenceChange', {
          detail: { colorMode: newMode },
        }),
      )
    },
    [theme],
  )

  // Listen for theme changes from other components or tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user-preferences' && e.newValue) {
        try {
          const prefs = JSON.parse(e.newValue)
          if (prefs.theme) {
            setThemeState(normalizeTheme(prefs.theme, initialTheme))
          }
          if (
            prefs.colorMode &&
            (prefs.colorMode === 'light' ||
              prefs.colorMode === 'dark' ||
              prefs.colorMode === 'system')
          ) {
            setColorModeState(prefs.colorMode)
          }
        } catch (err) {
          console.warn('Failed to parse preference update:', err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [initialTheme])

  // Resolve 'system' to actual light/dark
  const resolvedColorMode: 'light' | 'dark' =
    colorMode === 'system'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : colorMode

  const toggleColorMode = useCallback(() => {
    setColorMode(resolvedColorMode === 'light' ? 'dark' : 'light')
  }, [resolvedColorMode, setColorMode])

  const value: ThemeContextValue = {
    theme,
    colorMode,
    resolvedColorMode,
    setTheme,
    setColorMode,
    toggleColorMode,
    isDark: resolvedColorMode === 'dark',
  }

  return (
    <ThemeContext.Provider value={value}>
      <div data-testid="theme-provider">{children}</div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
