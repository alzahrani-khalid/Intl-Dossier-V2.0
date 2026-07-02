import type { Direction, Mode, Hue } from './tokens/types'

/**
 * Direction defaults per Phase 34 D-16 (silent reset on direction change).
 * Bureau hue is 32°, NOT 22° — verified in CONTEXT.md §D-16.
 */
export const DIRECTION_DEFAULTS = {
  chancery: { mode: 'light' as const, hue: 22 as Hue },
  situation: { mode: 'dark' as const, hue: 190 as Hue },
  ministerial: { mode: 'light' as const, hue: 158 as Hue },
  bureau: { mode: 'light' as const, hue: 32 as Hue },
  // Phase 77 — linear defaults to dark (Linear is dark-canonical). Hue 275 is
  // the accent-band anchor (#5e6ad2 ≈ oklch h275); the accent is a palette
  // literal now, so hue is only a fallback for legacy hue-math. Activation of
  // linear as the app default is Plan 77-04 — this entry just makes the map
  // exhaustive over the widened Direction union.
  linear: { mode: 'dark' as const, hue: 275 as Hue },
} as const satisfies Record<Direction, { mode: Mode; hue: Hue }>

export function getDirectionDefaults(dir: Direction): { mode: Mode; hue: Hue } {
  return DIRECTION_DEFAULTS[dir]
}
