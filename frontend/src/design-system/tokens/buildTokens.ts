import { DENSITIES } from './densities'
import { PALETTES, FONTS } from './directions'
import type { BuildInput, TokenSet } from './types'

/**
 * Pure token builder — maps `{direction, mode, hue, density}` to a flat
 * `Record<string,string>` of CSS custom-property name → value pairs.
 *
 * OKLCH math + per-direction palette lookup ported 1:1 from
 * `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` `buildTokens`.
 *
 * Zero side effects. Zero DOM / React references. Deterministic: identical
 * input always produces identical output — safe to call during SSR and in
 * vitest unit tests.
 *
 * Hue-wrap contract: SLA-risk hue = `(hue + 55) % 360`. Caller passes hue in
 * 0..360°; math wraps cleanly through 360 → 0 (verified by test at hue=350).
 *
 * Mode branches (SC-2):
 *   - `--accent-ink`: 42% L (light) ↔ 72% L (dark)
 *   - `--accent-soft`: 0.05 C (light) ↔ 0.08 C (dark)
 *
 * SLA-bad is hue-locked to red (25°) regardless of accent hue — breached
 * status must always read as "danger" (SC-3).
 */
export const buildTokens = ({ direction, mode, hue, density }: BuildInput): TokenSet => {
  const palette = PALETTES[direction][mode]
  const den = DENSITIES[density]
  const fonts = FONTS[direction]
  const isDark = mode === 'dark'
  const h = hue
  const hRisk = (h + 55) % 360

  return {
    // Surfaces / ink / lines (direction-driven literals)
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

    // Accent family (hue-driven OKLCH)
    '--accent': `oklch(58% 0.14 ${h})`,
    '--accent-ink': isDark ? `oklch(72% 0.12 ${h})` : `oklch(42% 0.15 ${h})`,
    '--accent-soft': isDark ? `oklch(25% 0.08 ${h})` : `oklch(92% 0.05 ${h})`,
    '--accent-fg': `oklch(99% 0.01 ${h})`,

    // Semantic palette (mode-branching)
    '--danger': isDark ? 'oklch(70% 0.16 25)' : 'oklch(52% 0.18 25)',
    '--danger-soft': isDark ? 'oklch(25% 0.09 25)' : 'oklch(95% 0.04 25)',
    // Plan 40-15 (G2 close): light-mode L lowered (warn 62→51, ok 52→49,
    // info 50→48) so chip-warn / chip-ok / chip-info meet WCAG AA 4.5:1 over
    // their 15%-soft backgrounds. Dark-mode L unchanged — already passes.
    '--warn': isDark ? 'oklch(78% 0.14 75)' : 'oklch(51% 0.14 75)',
    '--warn-soft': isDark ? 'oklch(25% 0.08 75)' : 'oklch(95% 0.05 75)',
    '--ok': isDark ? 'oklch(72% 0.14 155)' : 'oklch(49% 0.12 155)',
    '--ok-soft': isDark ? 'oklch(22% 0.06 155)' : 'oklch(94% 0.04 155)',
    '--info': isDark ? 'oklch(72% 0.13 230)' : 'oklch(48% 0.14 230)',
    '--info-soft': isDark ? 'oklch(22% 0.07 230)' : 'oklch(94% 0.04 230)',

    // SLA palette — hue-tracking with +55° shift for risk; red-locked for bad
    '--sla-ok': `oklch(58% 0.14 ${h})`,
    '--sla-ok-soft': isDark ? `oklch(28% 0.08 ${h})` : `oklch(94% 0.05 ${h})`,
    '--sla-risk': `oklch(${isDark ? 74 : 60}% 0.13 ${hRisk})`,
    '--sla-risk-soft': isDark ? `oklch(26% 0.08 ${hRisk})` : `oklch(95% 0.05 ${hRisk})`,
    // Plan 41-09 (G3/G4): light branch darkened to 46%/0.18 for WCAG AA
    // (see frontend/src/index.css line 158 comment for full rationale).
    // Dark branch unchanged.
    '--sla-bad': isDark ? 'oklch(68% 0.18 25)' : 'oklch(46% 0.18 25)',
    '--sla-bad-soft': isDark ? 'oklch(27% 0.09 25)' : 'oklch(95% 0.05 25)',

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

    // Shape (per-direction radius triplet from palette)
    '--radius-sm': palette.radius.sm,
    '--radius': palette.radius.base,
    '--radius-lg': palette.radius.lg,

    // Derived tokens (plan D-13)
    '--field-radius': `calc(${palette.radius.base} * 1.5)`,
    '--focus-ring': '0 0 0 3px color-mix(in oklch, var(--accent) 40%, transparent)',
    '--shadow-drawer': '-24px 0 60px rgba(0,0,0,.25)',
    '--shadow-card': '0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)',

    // Phase 35 — D-01: font-family triplet (direction-driven, mode/hue/density-invariant)
    '--font-display': fonts.display,
    '--font-body': fonts.body,
    '--font-mono': fonts.mono,
  }
}
