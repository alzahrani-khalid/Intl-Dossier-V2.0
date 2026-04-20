/**
 * DesignProvider — runtime wiring for the Phase 33 token engine.
 *
 * Responsibilities (see plan 33-02):
 *   1. Holds the four design-state primitives: direction, mode, hue, density.
 *   2. Persists each change to `localStorage` under the canonical keys
 *      `id.dir`, `id.theme`, `id.hue`, `id.density` (33-03 bootstrap reads these).
 *   3. Re-derives the full `TokenSet` via the pure `buildTokens` whenever any
 *      primitive changes, then calls `applyTokens` to flush to `:root`.
 *   4. Toggles the `.dark` class on `document.documentElement` so HeroUI v3's
 *      auto colour-mode resolution picks up the mode switch (RESEARCH Q1).
 *   5. Publishes `data-direction` and `data-density` attributes on `:root` so
 *      downstream CSS can key off `[data-direction="situation"]` if needed.
 *   6. Dispatches `designChange` CustomEvents and listens for `storage` events
 *      so multiple tabs stay in sync.
 *
 * Skeleton ported from `components/theme-provider/theme-provider.tsx` (lazy
 * `useState`, `useEffect` DOM writer, `useCallback` setters, `storage` event
 * listener, CustomEvent dispatch, `data-testid="design-provider"`). The pure
 * token math lives in `./tokens/*` (plan 33-01); this module owns wiring only.
 */

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { applyTokens } from './tokens/applyTokens'
import { buildTokens } from './tokens/buildTokens'
import type { Density, Direction, Hue, Mode, TokenSet } from './tokens/types'
import { wipeLegacyThemeKeys } from '@/utils/storage/preference-storage'

// ----------------------------------------------------------------------------
// localStorage keys — canonical, shared with 33-03 bootstrap script.
// ----------------------------------------------------------------------------
const LS_DIR = 'id.dir'
const LS_MODE = 'id.theme'
const LS_HUE = 'id.hue'
const LS_DENSITY = 'id.density'

// ----------------------------------------------------------------------------
// Narrow runtime guards (localStorage returns `string | null`).
// ----------------------------------------------------------------------------
const isDirection = (value: unknown): value is Direction =>
  value === 'chancery' || value === 'situation' || value === 'ministerial' || value === 'bureau'

const isMode = (value: unknown): value is Mode => value === 'light' || value === 'dark'

const isDensity = (value: unknown): value is Density =>
  value === 'comfortable' || value === 'compact' || value === 'dense'

const parseHue = (value: string | null): number | null => {
  if (value === null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return n
}

const safeGetItem = (key: string): string | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  } catch {
    return null
  }
}

const safeSetItem = (key: string, value: string): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value)
    }
  } catch (err) {
    console.warn('DesignProvider: failed to persist', key, err)
  }
}

// ----------------------------------------------------------------------------
// Context shape — consumed by hooks in ./hooks/use{Direction,Mode,Hue,Density,Tokens}.ts
// ----------------------------------------------------------------------------
export interface DesignContextValue {
  direction: Direction
  mode: Mode
  hue: Hue
  density: Density
  tokens: TokenSet
  setDirection: (d: Direction) => void
  setMode: (m: Mode) => void
  setHue: (h: Hue) => void
  setDensity: (d: Density) => void
}

export interface DesignProviderProps {
  children: React.ReactNode
  initialDirection?: Direction
  initialMode?: Mode
  initialHue?: Hue
  initialDensity?: Density
}

export const DesignContext = createContext<DesignContextValue | undefined>(undefined)

// ----------------------------------------------------------------------------
// Provider
// ----------------------------------------------------------------------------
export function DesignProvider({
  children,
  initialDirection = 'chancery',
  initialMode = 'light',
  initialHue = 22,
  initialDensity = 'comfortable',
}: DesignProviderProps): React.ReactElement {
  // Lazy initialisers read from localStorage once per mount, falling back to
  // the prop defaults when the stored value is missing or malformed.
  const [direction, setDirectionState] = useState<Direction>(() => {
    const stored = safeGetItem(LS_DIR)
    return isDirection(stored) ? stored : initialDirection
  })

  const [mode, setModeState] = useState<Mode>(() => {
    const stored = safeGetItem(LS_MODE)
    return isMode(stored) ? stored : initialMode
  })

  const [hue, setHueState] = useState<Hue>(() => {
    const parsed = parseHue(safeGetItem(LS_HUE))
    return parsed === null ? initialHue : parsed
  })

  const [density, setDensityState] = useState<Density>(() => {
    const stored = safeGetItem(LS_DENSITY)
    return isDensity(stored) ? stored : initialDensity
  })

  // Pure derivation — one `TokenSet` per {direction, mode, hue, density}.
  const tokens = useMemo<TokenSet>(
    () => buildTokens({ direction, mode, hue, density }),
    [direction, mode, hue, density],
  )

  // Flush tokens to :root whenever they change. Disposer restores prior values
  // on unmount (or before the next application) so React StrictMode's double-
  // invocation leaves the DOM in a consistent state.
  useEffect(() => {
    const cleanup = applyTokens(tokens)
    return cleanup
  }, [tokens])

  // Mode → `.dark` class on <html>. HeroUI v3 watches this attribute to flip
  // its internal colour scheme (RESEARCH Q1); Tailwind v4 `dark:` variants
  // also rely on it.
  useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [mode])

  // Expose direction + density on the root element so CSS selectors (e.g.
  // `[data-direction="situation"] .foo`) can reach them if needed.
  useEffect(() => {
    document.documentElement.setAttribute('data-direction', direction)
  }, [direction])

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
  }, [density])

  // Plan 33-07 D-10: once-per-browser wipe of the legacy localStorage keys
  // (`theme`, `colorMode`, `theme-preference`, `dossier.theme`) the removed
  // theme system used to write. Guarded by an internal version flag so it is
  // idempotent across reloads.
  useEffect(() => {
    wipeLegacyThemeKeys()
  }, [])

  // --------------------------------------------------------------------------
  // Setters — each updates state, persists to localStorage, and broadcasts a
  // `designChange` CustomEvent for non-React listeners (e.g. storybook).
  // --------------------------------------------------------------------------
  const setDirection = useCallback((d: Direction): void => {
    setDirectionState(d)
    safeSetItem(LS_DIR, d)
    window.dispatchEvent(new CustomEvent('designChange', { detail: { direction: d } }))
  }, [])

  const setMode = useCallback((m: Mode): void => {
    setModeState(m)
    safeSetItem(LS_MODE, m)
    window.dispatchEvent(new CustomEvent('designChange', { detail: { mode: m } }))
  }, [])

  const setHue = useCallback((h: Hue): void => {
    setHueState(h)
    safeSetItem(LS_HUE, String(h))
    window.dispatchEvent(new CustomEvent('designChange', { detail: { hue: h } }))
  }, [])

  const setDensity = useCallback((d: Density): void => {
    setDensityState(d)
    safeSetItem(LS_DENSITY, d)
    window.dispatchEvent(new CustomEvent('designChange', { detail: { density: d } }))
  }, [])

  // --------------------------------------------------------------------------
  // Cross-tab sync — mirror localStorage writes from other tabs into state.
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleStorage = (event: StorageEvent): void => {
      if (event.key === LS_DIR && isDirection(event.newValue)) {
        setDirectionState(event.newValue)
      } else if (event.key === LS_MODE && isMode(event.newValue)) {
        setModeState(event.newValue)
      } else if (event.key === LS_HUE) {
        const parsed = parseHue(event.newValue)
        if (parsed !== null) setHueState(parsed)
      } else if (event.key === LS_DENSITY && isDensity(event.newValue)) {
        setDensityState(event.newValue)
      }
    }

    window.addEventListener('storage', handleStorage)
    return (): void => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const value = useMemo<DesignContextValue>(
    () => ({
      direction,
      mode,
      hue,
      density,
      tokens,
      setDirection,
      setMode,
      setHue,
      setDensity,
    }),
    [direction, mode, hue, density, tokens, setDirection, setMode, setHue, setDensity],
  )

  return (
    <DesignContext.Provider value={value}>
      <div data-testid="design-provider">{children}</div>
    </DesignContext.Provider>
  )
}
