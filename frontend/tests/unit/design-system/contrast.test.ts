import { wcagContrast } from 'culori'
import { describe, expect, it } from 'vitest'

import { PALETTES } from '@/design-system/tokens/directions'
import type { DirectionModePalette, Mode } from '@/design-system/tokens/types'

/**
 * TOKEN-03 WCAG AA proof for the Linear direction (Plan 77-03).
 *
 * Linear ships a verbatim dark palette but NO error/warning hex and only 4 light
 * values — the rest (semantic danger/warn/info + all softs, the 6-value
 * status-tag palette, and the entire derived light set) are computed with culori
 * in the Linear surface luminance band. This test locks every DERIVED text-role
 * value at WCAG AA normal-text contrast (>= 4.5:1) so the values in
 * `tokens/directions.ts` can never drift below AA without turning this suite red
 * — the automated successor to the hand-audited WCAG-bump comments in
 * buildTokens.ts (Plans 40-15 / 41-09 / 42-11).
 *
 * NOT gated (by design): inkTertiary (faintest decorative tier) and lineStrong
 * (a divider, not text) — these are verbatim/derived non-text values.
 */

const AA = 4.5

// The four legacy directions keep the optional extended fields undefined; the
// Linear entry is the only one required to carry accent/semantic/status literals.
type LinearPalette = DirectionModePalette &
  Required<Pick<DirectionModePalette, 'accent' | 'semantic' | 'status'>>

const linearPalette = (mode: Mode): LinearPalette => {
  const p = PALETTES.linear[mode]
  if (!p.accent || !p.semantic || !p.status) {
    throw new Error(`PALETTES.linear.${mode} is missing extended accent/semantic/status fields`)
  }
  return p as LinearPalette
}

const contrast = (fg: string, bg: string): number => wcagContrast(fg, bg)

describe.each(['dark', 'light'] as const)('Linear TOKEN-03 contrast — %s mode', (mode) => {
  const p = linearPalette(mode)

  describe('ink ladder (text roles)', () => {
    it('ink clears AA on bg and surface', () => {
      expect(contrast(p.ink, p.bg)).toBeGreaterThanOrEqual(AA)
      expect(contrast(p.ink, p.surface)).toBeGreaterThanOrEqual(AA)
    })
    it('inkMute clears AA on bg and surface', () => {
      expect(contrast(p.inkMute, p.bg)).toBeGreaterThanOrEqual(AA)
      expect(contrast(p.inkMute, p.surface)).toBeGreaterThanOrEqual(AA)
    })
    it('inkFaint clears AA on surface', () => {
      expect(contrast(p.inkFaint, p.surface)).toBeGreaterThanOrEqual(AA)
    })
  })

  describe('accent', () => {
    it('accent.fg clears AA on accent.base', () => {
      expect(contrast(p.accent.fg, p.accent.base)).toBeGreaterThanOrEqual(AA)
    })
    // review M1 + H1: accent.ink is a DERIVED text role and must clear AA in BOTH
    // of its roles — as text on the plain surface AND as text on accent.soft (the
    // active-nav / secondary-button / chip background). The accent.soft pairing is
    // the exact gap that let H1 through (dark accent.ink on the old #5e69d1 soft was
    // 2.03:1); it is now a dark accent-tinted wash and must stay >= 4.5:1.
    it('accent.ink clears AA on surface', () => {
      expect(contrast(p.accent.ink, p.surface)).toBeGreaterThanOrEqual(AA)
    })
    it('accent.ink clears AA on accent.soft', () => {
      expect(contrast(p.accent.ink, p.accent.soft)).toBeGreaterThanOrEqual(AA)
    })
  })

  describe('sidebar', () => {
    // review M1: sidebarInk's directions.ts comment asserts "13.0:1 on sidebar" but
    // was never gated. Lock it so a future palette edit can't silently drop it.
    it('sidebarInk clears AA on sidebar', () => {
      expect(contrast(p.sidebarInk, p.sidebar)).toBeGreaterThanOrEqual(AA)
    })
  })

  describe('sla family (ok/risk/bad) on surface AND own soft', () => {
    // review M1: the SLA fg tokens are used as indicator/text colors but were
    // ungated. Lock each fg on the plain surface AND on its own soft wash.
    const slaPairs: Array<[string, string, string]> = [
      ['ok', p.sla.ok, p.sla.okSoft],
      ['risk', p.sla.risk, p.sla.riskSoft],
      ['bad', p.sla.bad, p.sla.badSoft],
    ]
    it.each(slaPairs)('sla.%s fg clears AA on surface', (_name, fg) => {
      expect(contrast(fg, p.surface)).toBeGreaterThanOrEqual(AA)
    })
    it.each(slaPairs)('sla.%s fg clears AA on its own soft wash', (_name, fg, soft) => {
      expect(contrast(fg, soft)).toBeGreaterThanOrEqual(AA)
    })
  })

  describe('semantic family (danger/warn/ok/info) on surface AND own soft', () => {
    const pairs: Array<[string, string, string]> = [
      ['danger', p.semantic.danger, p.semantic.dangerSoft],
      ['warn', p.semantic.warn, p.semantic.warnSoft],
      ['ok', p.semantic.ok, p.semantic.okSoft],
      ['info', p.semantic.info, p.semantic.infoSoft],
    ]
    it.each(pairs)('%s fg clears AA on surface', (_name, fg) => {
      expect(contrast(fg, p.surface)).toBeGreaterThanOrEqual(AA)
    })
    it.each(pairs)('%s fg clears AA on its own soft wash', (_name, fg, soft) => {
      expect(contrast(fg, soft)).toBeGreaterThanOrEqual(AA)
    })
  })

  describe('6-value status-tag palette on surface AND own soft', () => {
    it('has exactly 6 status entries', () => {
      expect(p.status).toHaveLength(6)
    })
    it.each(p.status.map((s, i) => [i + 1, s.fg, s.soft] as const))(
      'status %i fg clears AA on surface',
      (_i, fg) => {
        expect(contrast(fg, p.surface)).toBeGreaterThanOrEqual(AA)
      },
    )
    it.each(p.status.map((s, i) => [i + 1, s.fg, s.soft] as const))(
      'status %i fg clears AA on its own soft',
      (_i, fg, soft) => {
        expect(contrast(fg, soft)).toBeGreaterThanOrEqual(AA)
      },
    )
  })
})
