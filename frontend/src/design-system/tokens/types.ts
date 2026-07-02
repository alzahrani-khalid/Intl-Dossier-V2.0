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

// Phase 77 (linear-token-system) — the engine is single-direction. The four
// legacy directions (chancery/situation/ministerial/bureau) and the hue axis
// were deleted in 77-07; `Direction` is retained as a one-value union for API
// stability (buildTokens/PALETTES still key off it).
export type Direction = 'linear'

export type Mode = 'light' | 'dark'

export type Density = 'comfortable' | 'compact' | 'dense'

/** Flat mapping of CSS custom-property name → CSS value. */
export type TokenSet = Record<string, string>

export interface BuildInput {
  direction: Direction
  mode: Mode
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

  // Phase 77 (linear-token-system) — Linear extended tiers. The engine is
  // single-direction now (the four legacy directions were deleted in 77-07), so
  // these are REQUIRED and buildTokens reads them unconditionally.
  /** surface-3 tier (drawers/popovers in the Linear ladder). */
  surface3: string
  /** surface-4 tier (elevated overlays). */
  surface4: string
  /** Faintest ink tier (ink-tertiary). Not gated on WCAG AA — decorative/faint. */
  inkTertiary: string
  /** hairline-strong divider. Not gated on WCAG AA — a stronger line, not text. */
  lineStrong: string
  /** Accent family literals (verbatim Linear brand + a derived accent-tinted text `ink`). */
  accent: { base: string; hover: string; fg: string; ink: string; soft: string }
  /** Semantic family literals — TOKEN-03 derived error/warning + verbatim/derived ok/info, each with a soft wash. */
  semantic: {
    danger: string
    dangerSoft: string
    warn: string
    warnSoft: string
    ok: string
    okSoft: string
    info: string
    infoSoft: string
  }
  /** SLA family literals (derived in the Linear accent band). */
  sla: { ok: string; okSoft: string; risk: string; riskSoft: string; bad: string; badSoft: string }
  /** 6-value status-tag palette (TOKEN-03). Exactly 6 { fg, soft } entries; each fg passes AA on surface AND on its own soft. */
  status: { fg: string; soft: string }[]
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
