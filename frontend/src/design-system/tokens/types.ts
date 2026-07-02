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

export type Direction = 'chancery' | 'situation' | 'ministerial' | 'bureau' | 'linear'

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

  // Phase 77 (linear-token-system) — OPTIONAL extended tiers. Present only on the
  // `linear` direction; the four legacy directions omit them and keep their
  // hue-math / mode-branched semantic output in buildTokens. When present,
  // buildTokens prefers these palette LITERALS over the legacy math.
  /** surface-3 tier (drawers/popovers in the Linear ladder). */
  surface3?: string
  /** surface-4 tier (elevated overlays). */
  surface4?: string
  /** Faintest ink tier (ink-tertiary). Not gated on WCAG AA — decorative/faint. */
  inkTertiary?: string
  /** hairline-strong divider. Not gated on WCAG AA — a stronger line, not text. */
  lineStrong?: string
  /** Accent family literals (verbatim Linear brand + a derived accent-tinted text `ink`). */
  accent?: { base: string; hover: string; fg: string; ink: string; soft: string }
  /** Semantic family literals — TOKEN-03 derived error/warning + verbatim/derived ok/info, each with a soft wash. */
  semantic?: {
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
  sla?: { ok: string; okSoft: string; risk: string; riskSoft: string; bad: string; badSoft: string }
  /** 6-value status-tag palette (TOKEN-03). Exactly 6 { fg, soft } entries; each fg passes AA on surface AND on its own soft. */
  status?: { fg: string; soft: string }[]
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
