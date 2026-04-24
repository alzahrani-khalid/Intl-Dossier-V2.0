/**
 * Phase 37 — `<FullscreenLoader>` overlay.
 *
 * Wraps <GlobeLoader> in a full-viewport backdrop. Can be triggered three ways:
 *   - Declaratively: <FullscreenLoader open />
 *   - With auto-close: <FullscreenLoader open ms={1600} />
 *   - Imperatively: window.__showGlobeLoader(1600)  // DEV only (T-37-02)
 *
 * All three paths converge on `globeLoaderSignal` — open=true in either prop OR signal wins.
 *
 * Backdrop: color-mix(in srgb, var(--bg) 82%, transparent) + backdrop-filter: blur(3px)
 * Fallback (D-08 Claude's Discretion): @supports not (backdrop-filter) → 95% opacity, no blur
 *
 * Security (T-37-02): `window.__showGlobeLoader` registration is wrapped in
 * `if (import.meta.env.DEV)` so Vite's compile-time replacement strips the
 * block via dead-code elimination in production bundles.
 */
import { useEffect, useSyncExternalStore, type ReactElement } from 'react'

import { GlobeLoader } from './GlobeLoader'
import {
  getServerSnapshot,
  getSnapshot,
  showGlobeLoader,
  subscribe,
  type GlobeLoaderState,
} from './globeLoaderSignal'

export interface FullscreenLoaderProps {
  /** Declarative controlled open state. OR-combined with the signal. */
  open?: boolean
  /** Optional auto-close after N ms. Routes through the signal for convergence. */
  ms?: number
  /** Accessible label (i18n-provided). Defaults to "Loading". */
  label?: string
}

// DEV-only window registration — T-37-02 mitigation.
// Vite replaces `import.meta.env.DEV` at build time; dead-code elimination
// strips this block entirely from production bundles.
if (import.meta.env.DEV) {
  ;(window as unknown as { __showGlobeLoader?: (ms: number) => void }).__showGlobeLoader = (
    ms: number,
  ): void => {
    showGlobeLoader(ms)
  }
}

export function FullscreenLoader({
  open: propOpen = false,
  ms,
  label = 'Loading',
}: FullscreenLoaderProps): ReactElement | null {
  const signalState: GlobeLoaderState = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  // Prop-driven auto-close: if `open` + `ms` → route through the signal so
  // both trigger APIs converge on a single source of truth.
  useEffect((): void => {
    if (propOpen && typeof ms === 'number' && ms > 0) {
      showGlobeLoader(ms)
    }
  }, [propOpen, ms])

  // OR-semantics: either the prop OR the signal can force the overlay open.
  // When `ms` is provided with `propOpen`, visibility is delegated to the
  // signal only (so the auto-close timer wins over the persistent prop).
  const propDrivenOpen = propOpen && !(typeof ms === 'number' && ms > 0)
  const isOpen = propDrivenOpen || signalState.open

  if (!isOpen) return null

  return (
    <div
      data-testid="fullscreen-loader"
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // ASVS V10 clickjacking mitigation — backdrop must not trap clicks
        // on underlying nav controls.
        pointerEvents: 'none',
      }}
    >
      <div
        data-testid="fullscreen-loader-backdrop"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />
      <GlobeLoader size={120} />
    </div>
  )
}
