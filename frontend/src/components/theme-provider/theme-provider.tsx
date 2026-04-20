/**
 * Legacy ThemeProvider shim — Phase 33-07 (Wave 3).
 *
 * The real provider is `DesignProvider` from `@/design-system/DesignProvider`
 * (wired in App.tsx by Plan 33-02). This module stays only for back-compat
 * with imports like `{ ThemeProvider, useTheme, AVAILABLE_THEMES }` that still
 * live in ~8 files; Phase 34 removes the shim when the AppearanceSection UI
 * is rebuilt against `useDesignDirection + useMode + useHue + useDensity`.
 *
 * All exports are thin adapters — the ThemeProvider renders children directly
 * (DesignProvider does the real work upstream) and `useTheme()` returns a
 * shadcn-compatible shape driven by the design-system hooks.
 */

import type { ReactNode, ReactElement } from 'react'
import { useDesignDirection } from '@/design-system/hooks/useDesignDirection'
import { useMode } from '@/design-system/hooks/useMode'

export const AVAILABLE_THEMES: readonly string[] = []
export const AVAILABLE_COLOR_MODES: readonly ['light', 'dark', 'system'] = [
  'light',
  'dark',
  'system',
] as const

export function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <div data-testid="theme-provider">{children}</div>
}

type LegacyColorMode = 'light' | 'dark' | 'system'

function resolveLegacyMode(m: LegacyColorMode): 'light' | 'dark' {
  if (m !== 'system') return m
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme(): {
  theme: string
  colorMode: LegacyColorMode
  resolvedColorMode: 'light' | 'dark'
  setTheme: (_t: string) => void
  setColorMode: (m: LegacyColorMode) => void
  toggleColorMode: () => void
  isDark: boolean
} {
  const { direction } = useDesignDirection()
  const { mode, setMode } = useMode()
  return {
    theme: direction,
    colorMode: mode,
    resolvedColorMode: mode,
    setTheme: (): void => {
      /* no-op — direction is owned by DesignProvider. */
    },
    setColorMode: (m) => setMode(resolveLegacyMode(m)),
    toggleColorMode: (): void => setMode(mode === 'light' ? 'dark' : 'light'),
    isDark: mode === 'dark',
  }
}
