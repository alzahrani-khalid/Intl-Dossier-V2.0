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
} as const satisfies Record<Direction, { mode: Mode; hue: Hue }>

export function getDirectionDefaults(dir: Direction): { mode: Mode; hue: Hue } {
  return DIRECTION_DEFAULTS[dir]
}
