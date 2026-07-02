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

  // Phase 77 (linear-token-system) — palette LITERALS win when present; the four
  // legacy directions carry no extended fields, so they keep the exact hue-math /
  // mode-branched output below (byte-identical — the existing suite is the net).

  // Accent family — literal (linear) vs legacy hue-math. The legacy branch emits
  // NO --accent-hover; the literal branch adds it (Linear primary-hover).
  const accentVars: TokenSet =
    palette.accent !== undefined
      ? {
          '--accent': palette.accent.base,
          '--accent-ink': palette.accent.ink,
          '--accent-soft': palette.accent.soft,
          '--accent-fg': palette.accent.fg,
          '--accent-hover': palette.accent.hover,
        }
      : {
          '--accent': `oklch(58% 0.14 ${h})`,
          '--accent-ink': isDark ? `oklch(72% 0.12 ${h})` : `oklch(42% 0.15 ${h})`,
          '--accent-soft': isDark ? `oklch(25% 0.08 ${h})` : `oklch(92% 0.05 ${h})`,
          // Phase 42-11: bumped from oklch(99% 0.01 h) (#fff9f8 at hue 25) to pure
          // white. The tinted near-white gave .btn-primary "New brief" text a
          // 4.38:1 ratio on the bureau-light accent #bf5542 — just below WCAG AA.
          // Pure white is 5.28:1. The 0.01 chroma tint was a design polish that's
          // imperceptible at L=99% anyway.
          '--accent-fg': `oklch(100% 0 0)`,
        }

  // Semantic palette — literal (linear TOKEN-03) vs legacy mode-branched OKLCH.
  const semanticVars: TokenSet =
    palette.semantic !== undefined
      ? {
          '--danger': palette.semantic.danger,
          '--danger-soft': palette.semantic.dangerSoft,
          '--warn': palette.semantic.warn,
          '--warn-soft': palette.semantic.warnSoft,
          '--ok': palette.semantic.ok,
          '--ok-soft': palette.semantic.okSoft,
          '--info': palette.semantic.info,
          '--info-soft': palette.semantic.infoSoft,
        }
      : {
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
        }

  // SLA palette — literal (linear) vs legacy hue-tracking (+55° risk, red-locked bad).
  const slaVars: TokenSet =
    palette.sla !== undefined
      ? {
          '--sla-ok': palette.sla.ok,
          '--sla-ok-soft': palette.sla.okSoft,
          '--sla-risk': palette.sla.risk,
          '--sla-risk-soft': palette.sla.riskSoft,
          '--sla-bad': palette.sla.bad,
          '--sla-bad-soft': palette.sla.badSoft,
        }
      : {
          '--sla-ok': `oklch(58% 0.14 ${h})`,
          '--sla-ok-soft': isDark ? `oklch(28% 0.08 ${h})` : `oklch(94% 0.05 ${h})`,
          '--sla-risk': `oklch(${isDark ? 74 : 60}% 0.13 ${hRisk})`,
          '--sla-risk-soft': isDark ? `oklch(26% 0.08 ${hRisk})` : `oklch(95% 0.05 ${hRisk})`,
          // Plan 41-09 (G3/G4): light branch darkened to 46%/0.18 for WCAG AA
          // (see frontend/src/index.css line 158 comment for full rationale).
          // Dark branch unchanged.
          '--sla-bad': isDark ? 'oklch(68% 0.18 25)' : 'oklch(46% 0.18 25)',
          '--sla-bad-soft': isDark ? 'oklch(27% 0.09 25)' : 'oklch(95% 0.05 25)',
        }

  // New tiers — emitted only when the palette provides them (linear).
  const tierVars: TokenSet = {}
  if (palette.surface3 !== undefined) tierVars['--surface-3'] = palette.surface3
  if (palette.surface4 !== undefined) tierVars['--surface-4'] = palette.surface4
  if (palette.inkTertiary !== undefined) tierVars['--ink-tertiary'] = palette.inkTertiary
  if (palette.lineStrong !== undefined) tierVars['--line-strong'] = palette.lineStrong

  // Status-tag palette — 6 {fg,soft} pairs → --status-1..6 + --status-1-soft..6-soft.
  const statusVars: TokenSet = {}
  if (palette.status !== undefined) {
    palette.status.forEach((s, i) => {
      statusVars[`--status-${i + 1}`] = s.fg
      statusVars[`--status-${i + 1}-soft`] = s.soft
    })
  }

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

    // New Linear tiers (surface-3/4, ink-tertiary, line-strong) — linear only
    ...tierVars,

    // Accent / semantic / SLA — palette literals (linear) or legacy math
    ...accentVars,
    ...semanticVars,
    ...slaVars,

    // Status-tag palette (--status-1..6 + softs) — linear only
    ...statusVars,

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
    // Phase 77 Q2 — Linear has no card shadows; keep the token, value 'none'.
    '--shadow-card':
      direction === 'linear' ? 'none' : '0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)',

    // Phase 35 — D-01: font-family triplet (direction-driven, mode/hue/density-invariant)
    '--font-display': fonts.display,
    '--font-body': fonts.body,
    '--font-mono': fonts.mono,
  }
}
