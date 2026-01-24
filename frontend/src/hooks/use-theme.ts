/**
 * Theme Hooks
 * @module hooks/use-theme
 * @feature 034-dossier-ui-polish
 *
 * React hooks for theme management, color modes, and RTL/LTR direction support.
 *
 * @description
 * This module provides a comprehensive set of React hooks for managing application theming:
 * - Theme value access with read-only state
 * - Color mode toggling (light/dark)
 * - RTL/LTR direction management with language integration
 * - Combined theme + direction utilities
 * - DOM direction synchronization
 *
 * All hooks support mobile-first design and Arabic RTL layouts.
 *
 * @example
 * // Get current theme value
 * const { theme, colorMode, isDark } = useThemeValue();
 *
 * @example
 * // Toggle color mode
 * const { toggleColorMode, isDark } = useColorModeToggle();
 *
 * @example
 * // RTL support
 * const { isRtl, toggleDirection } = useThemeRtl();
 *
 * @example
 * // Combined theme + RTL
 * const { theme, colorMode, isRTL, toggleDirection } = useThemeWithRTL();
 */

import { useEffect, useState, useCallback } from 'react'
import {
  useTheme as useThemeFromProvider,
  AVAILABLE_THEMES,
} from '../components/theme-provider/theme-provider'
import { useLanguage } from './use-language'

/**
 * Re-export the ThemeProvider hook so feature code can keep importing from hooks/
 *
 * @description
 * Core theme hook from ThemeProvider context. Provides access to current theme,
 * color mode, setters, and theme configuration.
 *
 * @example
 * const { theme, colorMode, setTheme, setColorMode } = useTheme();
 */
export const useTheme = useThemeFromProvider

/**
 * Re-export available themes for UI components
 *
 * @description
 * Array of available theme names for theme selection UI.
 */
export { AVAILABLE_THEMES }

/**
 * Hook to get just the current theme without setters
 *
 * @description
 * Provides read-only access to theme state. Useful for components that only need
 * to read theme values without modifying them, reducing unnecessary re-renders.
 *
 * @returns Object containing theme, colorMode, isDark, and isLight flags
 *
 * @example
 * // Read-only theme access
 * const { theme, colorMode, isDark, isLight } = useThemeValue();
 * if (isDark) {
 *   // Apply dark mode specific styles
 * }
 */
export function useThemeValue() {
  const { theme, colorMode, isDark } = useTheme()

  return {
    theme,
    colorMode,
    isDark,
    isLight: colorMode === 'light',
  }
}

/**
 * Hook to toggle between light and dark modes
 *
 * @description
 * Provides a simple toggle function for switching between light and dark color modes.
 * Useful for theme toggle buttons and menu items.
 *
 * @returns Object containing colorMode, toggleColorMode function, and isDark flag
 *
 * @example
 * // Basic usage
 * const { toggleColorMode, isDark } = useColorModeToggle();
 *
 * return (
 *   <button onClick={toggleColorMode}>
 *     {isDark ? 'Light Mode' : 'Dark Mode'}
 *   </button>
 * );
 */
export function useColorModeToggle() {
  const { colorMode, setColorMode, isDark } = useTheme()

  const toggleColorMode = () => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light')
  }

  return {
    colorMode,
    toggleColorMode,
    isDark,
  }
}

/**
 * RTL/LTR helpers wired into the theme layer for convenience
 *
 * @description
 * Provides RTL/LTR direction management integrated with language settings.
 * Automatically syncs direction with language (ar = RTL, en = LTR).
 * Required for proper Arabic layout support.
 *
 * @returns Object containing direction, language, isRtl/isLtr flags, and toggle/set functions
 *
 * @example
 * // Basic RTL detection
 * const { isRtl } = useThemeRtl();
 *
 * return (
 *   <div className={isRtl ? 'text-end' : 'text-start'}>
 *     {/* Content */}
 *   </div>
 * );
 *
 * @example
 * // Toggle direction/language
 * const { toggleDirection, direction } = useThemeRtl();
 *
 * <button onClick={toggleDirection}>
 *   Switch to {direction === 'rtl' ? 'LTR' : 'RTL'}
 * </button>
 */
export function useThemeRtl() {
  const { direction, language, setLanguage } = useLanguage()

  const isRtl = direction === 'rtl'
  const setDirection = (dir: 'ltr' | 'rtl') => setLanguage(dir === 'rtl' ? 'ar' : 'en')
  const toggleDirection = () => setDirection(isRtl ? 'ltr' : 'rtl')

  return {
    direction,
    language,
    isRtl,
    isLtr: !isRtl,
    setDirection,
    toggleDirection,
  }
}

/**
 * Alias for useThemeRtl for semantic clarity
 *
 * @description
 * Provides the same functionality as useThemeRtl with a more descriptive name
 * for components focused on text direction.
 */
export const useTextDirection = useThemeRtl

/**
 * Hook for RTL/LTR support with DOM synchronization
 *
 * @description
 * Provides low-level direction management that directly observes and modifies
 * the document.documentElement.dir attribute. Includes MutationObserver to
 * stay in sync with external changes.
 *
 * Unlike useThemeRtl, this hook does NOT sync with language settings and works
 * directly with the DOM. Use useThemeRtl for language-integrated direction.
 *
 * @returns Object containing direction, isRTL/isLTR flags, toggleDirection, and setDirection
 *
 * @example
 * // Direct DOM direction control
 * const { isRTL, setDirection } = useDirection();
 *
 * // Force RTL mode (without changing language)
 * setDirection('rtl');
 *
 * @example
 * // Observe external direction changes
 * const { direction } = useDirection();
 *
 * useEffect(() => {
 *   console.log('Direction changed:', direction);
 * }, [direction]);
 */
export function useDirection() {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(() => {
    if (typeof window === 'undefined') return 'ltr'
    return (document.documentElement.dir as 'ltr' | 'rtl') || 'ltr'
  })

  useEffect(() => {
    const htmlElement = document.documentElement
    const observer = new MutationObserver(() => {
      const newDir = (htmlElement.dir as 'ltr' | 'rtl') || 'ltr'
      setDirection(newDir)
    })

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['dir'],
    })

    return () => observer.disconnect()
  }, [])

  const toggleDirection = useCallback(() => {
    const newDirection = direction === 'ltr' ? 'rtl' : 'ltr'
    document.documentElement.dir = newDirection
    setDirection(newDirection)
  }, [direction])

  const setDirectionValue = useCallback((value: 'ltr' | 'rtl') => {
    document.documentElement.dir = value
    setDirection(value)
  }, [])

  return {
    direction,
    isRTL: direction === 'rtl',
    isLTR: direction === 'ltr',
    toggleDirection,
    setDirection: setDirectionValue,
  }
}

/**
 * Combined hook for theme with RTL support
 *
 * @description
 * Convenience hook that combines useTheme and useDirection into a single object.
 * Provides access to all theme and direction properties without needing separate hook calls.
 * Useful for components that need both theme and direction context.
 *
 * @returns Object containing all theme properties (theme, colorMode, setters) and direction properties (direction, isRTL, isLTR, toggleDirection, setDirection)
 *
 * @example
 * // Access both theme and direction
 * const { theme, colorMode, isDark, isRTL, toggleDirection } = useThemeWithRTL();
 *
 * return (
 *   <div className={`theme-${theme} ${isRTL ? 'rtl' : 'ltr'}`}>
 *     <button onClick={toggleDirection}>Toggle Direction</button>
 *     {isDark ? <MoonIcon /> : <SunIcon />}
 *   </div>
 * );
 */
export function useThemeWithRTL() {
  const theme = useTheme()
  const direction = useDirection()

  return {
    ...theme,
    ...direction,
  }
}
