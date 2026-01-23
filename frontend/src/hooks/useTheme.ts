import { useEffect, useState, useCallback } from 'react'
import {
  useTheme as useThemeFromProvider,
  AVAILABLE_THEMES,
} from '../components/theme-provider/theme-provider'
import { useLanguage } from './use-language'

/**
 * Re-export the ThemeProvider hook so feature code can keep importing from hooks/
 */
export const useTheme = useThemeFromProvider

/**
 * Re-export available themes for UI components
 */
export { AVAILABLE_THEMES }

/**
 * Hook to get just the current theme without setters
 * Useful for components that only need to read theme state
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

export const useTextDirection = useThemeRtl

/**
 * Hook for RTL/LTR support with theme integration
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
 */
export function useThemeWithRTL() {
  const theme = useTheme()
  const direction = useDirection()

  return {
    ...theme,
    ...direction,
  }
}
