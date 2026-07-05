import { DENSITIES } from './densities'
import { PALETTES, FONTS } from './directions'
import type { BuildInput, TokenSet } from './types'

/**
 * Pure token builder — maps `{direction, mode, density}` to a flat
 * `Record<string,string>` of CSS custom-property name → value pairs.
 *
 * Phase 77 (linear-token-system): the engine is single-direction (Linear).
 * Every family reads palette LITERALS unconditionally — the legacy
 * per-direction OKLCH/mode-branch math was deleted with the four retired
 * directions in 77-07 (the accent is now a verbatim literal, not parameterized).
 * `direction` is retained for API stability (single key 'linear'); the
 * `PALETTES[direction][mode]` lookup is unchanged.
 *
 * Zero side effects. Zero DOM / React references. Deterministic: identical
 * input always produces identical output — safe to call during SSR and in
 * vitest unit tests.
 */
export const buildTokens = ({ direction, mode, density }: BuildInput): TokenSet => {
  const palette = PALETTES[direction][mode]
  const den = DENSITIES[density]
  const fonts = FONTS[direction]

  // Status-tag palette — 6 {fg,soft} pairs → --status-1..6 + --status-1-soft..6-soft.
  const statusVars: TokenSet = {}
  palette.status.forEach((s, i) => {
    statusVars[`--status-${i + 1}`] = s.fg
    statusVars[`--status-${i + 1}-soft`] = s.soft
  })

  // Chart palette (DEBT-01) — 8 categorical hexes → --chart-1..8. Mirrors statusVars.
  const chartVars: TokenSet = {}
  palette.chart.forEach((hex, i) => {
    chartVars[`--chart-${i + 1}`] = hex
  })

  return {
    // Surfaces / ink / lines
    '--bg': palette.bg,
    '--surface': palette.surface,
    '--surface-raised': palette.surfaceRaised,
    '--ink': palette.ink,
    '--ink-mute': palette.inkMute,
    '--ink-faint': palette.inkFaint,
    '--line': palette.line,
    '--line-soft': palette.lineSoft,
    '--sidebar-bg': palette.sidebar,
    '--sidebar-ink': palette.sidebarInk,

    // Linear extended tiers (surface-3/4, ink-tertiary, line-strong)
    '--surface-3': palette.surface3,
    '--surface-4': palette.surface4,
    '--ink-tertiary': palette.inkTertiary,
    '--line-strong': palette.lineStrong,

    // Accent family — verbatim Linear literals
    '--accent': palette.accent.base,
    '--accent-hover': palette.accent.hover,
    '--accent-fg': palette.accent.fg,
    '--accent-ink': palette.accent.ink,
    '--accent-soft': palette.accent.soft,

    // Semantic family (TOKEN-03 derived + verbatim)
    '--danger': palette.semantic.danger,
    '--danger-soft': palette.semantic.dangerSoft,
    '--warn': palette.semantic.warn,
    '--warn-soft': palette.semantic.warnSoft,
    '--ok': palette.semantic.ok,
    '--ok-soft': palette.semantic.okSoft,
    '--info': palette.semantic.info,
    '--info-soft': palette.semantic.infoSoft,

    // SLA family (derived in the Linear accent band)
    '--sla-ok': palette.sla.ok,
    '--sla-ok-soft': palette.sla.okSoft,
    '--sla-risk': palette.sla.risk,
    '--sla-risk-soft': palette.sla.riskSoft,
    '--sla-bad': palette.sla.bad,
    '--sla-bad-soft': palette.sla.badSoft,

    // Status-tag palette (--status-1..6 + softs)
    ...statusVars,

    // Chart palette (--chart-1..8) — categorical series colors (DEBT-01)
    ...chartVars,

    // Density (row heights + logical-property paddings + gap)
    '--row-h': den.rowH,
    '--pad-inline': den.padInline,
    '--pad-block': den.padBlock,
    '--gap': den.gap,
    // Handoff parity (themes.jsx emits a single `--pad`). Phase 33 D-04 split it
    // into inline/block; we restore the alias here so verbatim handoff CSS rules
    // (`var(--pad)` in `.page`, `.page-head`, `.kpi`, `.card`) work outside the
    // `.dash-root` local scope. Aliased to `padInline` because the handoff value
    // matches our inline dimension (20/14/10 for comfortable/compact/dense).
    '--pad': den.padInline,

    // Shape (radius triplet from palette)
    '--radius-sm': palette.radius.sm,
    '--radius': palette.radius.base,
    '--radius-lg': palette.radius.lg,

    // Derived tokens (plan D-13)
    '--field-radius': `calc(${palette.radius.base} * 1.5)`,
    '--focus-ring': '0 0 0 3px color-mix(in oklch, var(--accent) 40%, transparent)',
    '--shadow-drawer': '-24px 0 60px rgba(0,0,0,.25)',
    // Phase 77 Q2 — Linear has no card shadows; keep the token, value 'none'.
    '--shadow-card': 'none',

    // Phase 35 — D-01: font-family triplet (mode/density-invariant)
    '--font-display': fonts.display,
    '--font-body': fonts.body,
    '--font-mono': fonts.mono,
  }
}
