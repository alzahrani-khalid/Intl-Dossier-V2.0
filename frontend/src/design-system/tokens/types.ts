/**
 * Token engine public types.
 *
 * Part of Phase 33 (token-engine). No runtime dependencies; pure type definitions.
 * Consumed by:
 *   - buildTokens.ts (pure mapper)
 *   - applyTokens.ts (DOM writer)
 *   - 33-02 DesignProvider (wiring layer)
 *   - 33-03 bootstrap (SSR-safe pre-hydration application)
 */

export type Direction = 'chancery' | 'situation' | 'ministerial' | 'bureau'

export type Mode = 'light' | 'dark'

/**
 * Hue in OKLCH (0..360, inclusive). Caller is responsible for clamping /
 * normalising; the engine passes the value through unchanged (SLA math wraps
 * with `% 360`).
 */
export type Hue = number

export type Density = 'comfortable' | 'compact' | 'dense'

/** Flat mapping of CSS custom-property name → CSS value. */
export type TokenSet = Record<string, string>

export interface BuildInput {
  direction: Direction
  mode: Mode
  hue: Hue
  density: Density
}

export interface DirectionModePalette {
  bg: string
  surface: string
  surfaceRaised: string
  ink: string
  inkMute: string
  inkFaint: string
  line: string
  lineSoft: string
  sidebar: string
  sidebarInk: string
  radius: { sm: string; base: string; lg: string }
}

export interface DirectionPalette {
  light: DirectionModePalette
  dark: DirectionModePalette
}

export interface DensityValues {
  rowH: string
  padInline: string
  padBlock: string
  gap: string
}

/** Phase 35 — per-direction font triplet. Direction-invariant across modes/hues/densities. */
export interface DirectionFonts {
  display: string
  body: string
  mono: string
}
