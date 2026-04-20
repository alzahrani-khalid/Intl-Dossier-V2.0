import { densities } from './densities'
import { directions } from './directions'
import type { AccentHue, BuildTokensArgs, TokenSet } from './types'

/**
 * Accent hue catalog. Must match the handoff palette in
 * `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx` (1:1 port).
 *
 * - teal:   190  (cool, default)
 * - indigo: 262  (violet/blue)
 * - rose:   12   (warm, red-leaning)
 */
const HUE_DEG: Record<AccentHue, number> = {
  teal: 190,
  indigo: 262,
  rose: 12,
}

/**
 * Build the flat token map for a given theme configuration.
 *
 * Pure function. Zero DOM, zero React. Deterministic: identical args always
 * produce identical output. Safe to call during SSR or inside tests.
 *
 * Returns a flat `Record<string, string>` of CSS custom properties
 * (`--name` → value string). Consumers pass the result to `applyTokens`
 * which does the side-effectful DOM write.
 *
 * SLA-risk hue math: `(hue + 55) % 360` keeps the risk color perceptually
 * offset from the accent hue across the palette wheel. Tested at 350° (rose
 * at hue=12 → 67; but verified for the raw formula at hue=350 → 45).
 */
export const buildTokens = (args: BuildTokensArgs): TokenSet => {
  const { direction, mode, hue, density } = args

  const h = HUE_DEG[hue]
  const slaRiskHue = (h + 55) % 360

  const dir = directions[direction]
  const dens = densities[density]

  const isLight = mode === 'light'

  // ------- Surface + ink scale (mode-dependent, hue-tinted) ----------
  const bg = isLight ? `oklch(0.98 0.01 ${h})` : `oklch(0.18 0.02 ${h})`
  const panel = isLight ? `oklch(0.96 0.02 ${h})` : `oklch(0.22 0.02 ${h})`
  const border = isLight ? `oklch(0.88 0.02 ${h})` : `oklch(0.30 0.02 ${h})`
  const ink = isLight ? `oklch(0.22 0.02 ${h})` : `oklch(0.96 0.01 ${h})`
  const muted = isLight ? `oklch(0.50 0.02 ${h})` : `oklch(0.70 0.02 ${h})`

  // ------- Accent family (mode-shifted lightness + chroma) -----------
  const accent = isLight ? `oklch(0.62 0.14 ${h})` : `oklch(0.74 0.17 ${h})`
  const accentInk = isLight ? `oklch(0.42 0.10 ${h})` : `oklch(0.72 0.13 ${h})`
  const accentSoft = isLight ? `oklch(0.94 0.05 ${h})` : `oklch(0.22 0.08 ${h})`

  // ------- Semantic status colors (fixed hues, mode-neutral base) ----
  const danger = `oklch(0.62 0.22 25)`
  const ok = `oklch(0.70 0.16 155)`
  const warn = `oklch(0.80 0.18 85)`
  const info = `oklch(0.70 0.14 235)`

  // ------- SLA risk triad (accent-hue-derived offset) ----------------
  const slaOk = `oklch(0.78 0.17 155)`
  const slaRisk = `oklch(0.82 0.18 ${slaRiskHue})`
  const slaBad = `oklch(0.65 0.22 25)`

  // ------- Soft variants of semantic + SLA families ------------------
  // Light: high-lightness wash (L≈0.94, C=0.05). Dark: low-lightness tint
  // (L≈0.22, C=0.08). See RESEARCH Gotcha #4.
  const softL = isLight ? 0.94 : 0.22
  const softC = isLight ? 0.05 : 0.08
  const dangerSoft = `oklch(${softL} ${softC} 25)`
  const okSoft = `oklch(${softL} ${softC} 155)`
  const warnSoft = `oklch(${softL} ${softC} 85)`
  const infoSoft = `oklch(${softL} ${softC} 235)`
  const slaOkSoft = `oklch(${softL} ${softC} 155)`
  const slaRiskSoft = `oklch(${softL} ${softC} ${slaRiskHue})`
  const slaBadSoft = `oklch(${softL} ${softC} 25)`

  return {
    // --- typography + direction -------------------------------------
    '--font-sans': dir.fontFamily,
    '--dir': dir.dirAttr,
    '--lang': dir.langAttr,
    '--numerals': dir.numerals,

    // --- surfaces ----------------------------------------------------
    '--bg': bg,
    '--panel': panel,
    '--border': border,
    '--ink': ink,
    '--muted': muted,

    // --- accent family ----------------------------------------------
    '--accent': accent,
    '--accent-ink': accentInk,
    '--accent-soft': accentSoft,

    // --- status solids ----------------------------------------------
    '--danger': danger,
    '--ok': ok,
    '--warn': warn,
    '--info': info,

    // --- SLA triad --------------------------------------------------
    '--sla-ok': slaOk,
    '--sla-risk': slaRisk,
    '--sla-bad': slaBad,

    // --- soft variants (D-13 extension per plan) --------------------
    '--danger-soft': dangerSoft,
    '--ok-soft': okSoft,
    '--warn-soft': warnSoft,
    '--info-soft': infoSoft,
    '--sla-ok-soft': slaOkSoft,
    '--sla-risk-soft': slaRiskSoft,
    '--sla-bad-soft': slaBadSoft,

    // --- geometry ---------------------------------------------------
    '--radius': '10px',
    '--field-radius': 'calc(var(--radius) * 1.5)',
    '--focus-ring': '0 0 0 3px color-mix(in oklch, var(--accent) 40%, transparent)',
    '--shadow-drawer': '-24px 0 60px rgba(0,0,0,.25)',
    '--shadow-card': '0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)',

    // --- density ----------------------------------------------------
    '--row-h': dens.rowH,
    '--pad-inline': dens.padInline,
    '--control-h': dens.controlH,
  }
}
