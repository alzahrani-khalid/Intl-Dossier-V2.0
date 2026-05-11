import type { TokenSet } from './types'

/**
 * Write every entry of the token set to `document.documentElement` as CSS
 * custom properties. Returns a cleanup function that restores the prior
 * values (or removes them if they were not set before).
 *
 * This is the ONLY module in the tokens engine allowed to touch `document`
 * (see Phase 33 definition-of-done). All other modules must stay pure.
 *
 * Usage:
 *   const cleanup = applyTokens(buildTokens({...}))
 *   // later, on unmount or theme change:
 *   cleanup()
 */
export const applyTokens = (set: TokenSet): (() => void) => {
  if (typeof document === 'undefined') {
    // SSR / non-DOM environment — no-op cleanup.
    return (): void => {}
  }

  const root = document.documentElement
  const previous = new Map<string, string | null>()

  for (const [name, value] of Object.entries(set)) {
    // Capture pre-write value so the returned cleanup can restore it.
    const prior = root.style.getPropertyValue(name)
    previous.set(name, prior === '' ? null : prior)
    root.style.setProperty(name, value)
  }

  return (): void => {
    for (const [name, prior] of previous) {
      if (prior === null) {
        root.style.removeProperty(name)
      } else {
        root.style.setProperty(name, prior)
      }
    }
  }
}
