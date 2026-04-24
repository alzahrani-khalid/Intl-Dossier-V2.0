/**
 * Phase 37 — `useReducedMotion()` hook.
 *
 * React 19 primitive for subscribing to the `prefers-reduced-motion: reduce` media query.
 * - Concurrent-rendering safe (uses `useSyncExternalStore`).
 * - SSR-safe (`getServerSnapshot` returns `false` by default — no animation is the safer default).
 * - Companion to the CSS `@media (prefers-reduced-motion: reduce)` block in `globe-loader.css`
 *   (D-16 dual-layer defense: CSS covers keyframe animations, JS covers rAF loops).
 *
 * Canonical consumers: `<GlobeLoader>` (cancels rAF + pins λ=0 when true per D-14).
 * Sibling hooks follow the same minimal shape — see `useDesignDirection.ts`.
 */

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return (): void => {
    mql.removeEventListener('change', onChange)
  }
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
