/**
 * Deprecated theme hook shim — Phase 33-07 (Wave 3).
 *
 * @deprecated Import directly from `@/design-system/hooks/useDesignDirection`
 * + `@/design-system/hooks/useMode` instead. This shim exists only so the
 * ~10 remaining `useTheme()` call sites keep working during the cutover.
 * Phase 34 deletes this file.
 */

import { useDesignDirection } from '@/design-system/hooks/useDesignDirection'
import { useMode } from '@/design-system/hooks/useMode'
import { useDomDirection } from '@/hooks/useDomDirection'
import { AVAILABLE_THEMES, useTheme as useThemeFromProvider } from '@/components/theme-provider/theme-provider'

export { AVAILABLE_THEMES }

let _warned = false
function warnOnce(): void {
  if (!_warned && typeof console !== 'undefined') {
    _warned = true
    console.warn(
      '[Phase 33 migration] `useTheme` is deprecated. Use useDesignDirection + useMode from @/design-system/hooks/* instead.',
    )
  }
}

export function useTheme(): ReturnType<typeof useThemeFromProvider> {
  warnOnce()
  return useThemeFromProvider()
}

export function useThemeRtl(): {
  direction: 'ltr' | 'rtl'
  language: string
  isRtl: boolean
  isLtr: boolean
  setDirection: (_d: 'ltr' | 'rtl') => void
  toggleDirection: () => void
} {
  warnOnce()
  const { isRTL } = useDomDirection()
  const direction: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr'
  return {
    direction,
    language: isRTL ? 'ar' : 'en',
    isRtl: isRTL,
    isLtr: !isRTL,
    setDirection: (): void => {
      /* language switching is owned by i18n; no-op here. */
    },
    toggleDirection: (): void => {
      /* language switching is owned by i18n; no-op here. */
    },
  }
}

export function useDirection(): {
  direction: 'ltr' | 'rtl'
  isRTL: boolean
  isLTR: boolean
  toggleDirection: () => void
  setDirection: (_v: 'ltr' | 'rtl') => void
} {
  const { isRTL } = useDomDirection()
  const direction: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr'
  return {
    direction,
    isRTL,
    isLTR: !isRTL,
    toggleDirection: (): void => {
      /* language switching is owned by i18n; no-op here. */
    },
    setDirection: (): void => {
      /* language switching is owned by i18n; no-op here. */
    },
  }
}

export function useThemeWithRTL(): ReturnType<typeof useTheme> & ReturnType<typeof useDirection> {
  return { ...useTheme(), ...useDirection() }
}

// Kept for edge-case imports; all three routes now pass through the single deprecation warning above.
export const useTextDirection = useThemeRtl

// Touch the design-system hooks at import time so tree-shakers don't elide them in projects
// that only consume `useTheme` through this shim.
void useDesignDirection
void useMode
