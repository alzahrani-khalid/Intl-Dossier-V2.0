import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Theme type - extensible for future themes
type Theme = 'canvas' // Add 'ocean' | 'sunset' etc. when needed
type ColorMode = 'light' | 'dark'

// Available themes for validation and UI
export const AVAILABLE_THEMES = ['canvas'] as const

interface ThemeContextValue {
  theme: Theme
  colorMode: ColorMode
  setTheme: (theme: Theme) => void
  setColorMode: (mode: ColorMode) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: Theme
  initialColorMode?: ColorMode
}

export function ThemeProvider({
  children,
  initialTheme = 'canvas',
  initialColorMode = 'light',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize theme from localStorage if available
    const stored = localStorage.getItem('user-preferences')
    if (stored) {
      try {
        const prefs = JSON.parse(stored)
        if (prefs.theme && AVAILABLE_THEMES.includes(prefs.theme)) {
          return prefs.theme
        }
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
        if (prefs.colorMode && (prefs.colorMode === 'light' || prefs.colorMode === 'dark')) {
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

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement

    // Set theme palette via data-theme attribute (scalable architecture)
    root.setAttribute('data-theme', theme)

    // Set color mode via .dark class (shadcn pattern)
    if (colorMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme, colorMode])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (!AVAILABLE_THEMES.includes(newTheme)) {
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
          if (prefs.theme && AVAILABLE_THEMES.includes(prefs.theme)) {
            setThemeState(prefs.theme)
          }
          if (prefs.colorMode && (prefs.colorMode === 'light' || prefs.colorMode === 'dark')) {
            setColorModeState(prefs.colorMode)
          }
        } catch (err) {
          console.warn('Failed to parse preference update:', err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const value: ThemeContextValue = {
    theme,
    colorMode,
    setTheme,
    setColorMode,
    isDark: colorMode === 'dark',
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
