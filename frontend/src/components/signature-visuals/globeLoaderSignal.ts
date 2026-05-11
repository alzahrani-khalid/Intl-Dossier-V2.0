/**
 * Phase 37 — Globe loader trigger signal.
 *
 * Bridges two trigger APIs (D-04):
 *   - Imperative: `window.__showGlobeLoader(ms)` — DEV only, gated in FullscreenLoader.tsx
 *   - Declarative: `<FullscreenLoader open ms>` — React consumer prop
 *
 * Snapshot identity rule: `getSnapshot()` must return the SAME object ref until a mutation
 * occurs, otherwise `useSyncExternalStore` will re-render on every tick.
 *
 * RESEARCH Open Question O-3: module-scoped signal chosen over zustand — <30 LOC, zero new slices.
 */

export interface GlobeLoaderState {
  open: boolean
  expiresAt: number
}

type Listener = () => void

let _state: GlobeLoaderState = { open: false, expiresAt: 0 }
const _listeners = new Set<Listener>()
let _timer: ReturnType<typeof setTimeout> | null = null

function _notify(): void {
  for (const l of _listeners) l()
}

export function showGlobeLoader(ms: number): void {
  const duration = Math.max(0, Math.floor(ms))
  if (_timer !== null) clearTimeout(_timer)
  _state = { open: true, expiresAt: Date.now() + duration }
  _notify()
  _timer = setTimeout((): void => {
    _state = { open: false, expiresAt: 0 }
    _timer = null
    _notify()
  }, duration)
}

export function subscribe(cb: Listener): () => void {
  _listeners.add(cb)
  return (): void => {
    _listeners.delete(cb)
  }
}

export function getSnapshot(): GlobeLoaderState {
  return _state
}

/**
 * SSR-safe server snapshot — matches the initial client state so React 19's
 * `useSyncExternalStore` does not warn about hydration mismatch when consumers
 * pass it as the third arg.
 */
export function getServerSnapshot(): GlobeLoaderState {
  return { open: false, expiresAt: 0 }
}

/** Test-only escape hatch to reset signal state between specs. */
export function __resetGlobeLoaderSignalForTests(): void {
  if (_timer !== null) clearTimeout(_timer)
  _timer = null
  _state = { open: false, expiresAt: 0 }
  _listeners.clear()
}
