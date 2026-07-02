import { describe, expect, it } from 'vitest'

import { buildTokens } from '@/design-system/tokens/buildTokens'
import { FONTS, PALETTES } from '@/design-system/tokens/directions'
import type { Density, Mode } from '@/design-system/tokens/types'

/**
 * Phase 77 (linear-token-system) — buildTokens is single-direction (Linear) and
 * hue-free after 77-07. The canonical matrix is now:
 *   1 direction (linear) × 2 modes × 3 densities = 6 cases.
 *
 * Every family reads palette LITERALS unconditionally — there is no OKLCH/hue
 * math left to exercise, so the old hue-sample / OKLCH-flip / legacy-direction
 * cases are gone. These tests assert the full var set plus literal fidelity.
 */
const MODES: readonly Mode[] = ['light', 'dark'] as const
const DENSITIES: readonly Density[] = ['comfortable', 'compact', 'dense'] as const

const REQUIRED_KEYS = [
  // Surfaces / ink / lines
  '--bg',
  '--surface',
  '--surface-raised',
  '--ink',
  '--ink-mute',
  '--ink-faint',
  '--line',
  '--line-soft',
  '--sidebar-bg',
  '--sidebar-ink',
  // Linear extended tiers
  '--surface-3',
  '--surface-4',
  '--ink-tertiary',
  '--line-strong',
  // Accent family
  '--accent',
  '--accent-hover',
  '--accent-fg',
  '--accent-ink',
  '--accent-soft',
  // Semantic
  '--danger',
  '--danger-soft',
  '--warn',
  '--warn-soft',
  '--ok',
  '--ok-soft',
  '--info',
  '--info-soft',
  // SLA
  '--sla-ok',
  '--sla-ok-soft',
  '--sla-risk',
  '--sla-risk-soft',
  '--sla-bad',
  '--sla-bad-soft',
  // Status-tag palette
  '--status-1',
  '--status-1-soft',
  '--status-2',
  '--status-2-soft',
  '--status-3',
  '--status-3-soft',
  '--status-4',
  '--status-4-soft',
  '--status-5',
  '--status-5-soft',
  '--status-6',
  '--status-6-soft',
  // Density
  '--row-h',
  '--pad-inline',
  '--pad-block',
  '--gap',
  '--pad',
  // Shape
  '--radius-sm',
  '--radius',
  '--radius-lg',
  // Derived
  '--field-radius',
  '--focus-ring',
  '--shadow-drawer',
  '--shadow-card',
  // Fonts
  '--font-display',
  '--font-body',
  '--font-mono',
] as const

const ROW_H_BY_DENSITY: Record<Density, string> = {
  comfortable: '52px',
  compact: '40px',
  dense: '32px',
}

const PAD_INLINE_BY_DENSITY: Record<Density, string> = {
  comfortable: '20px',
  compact: '14px',
  dense: '10px',
}

const PAD_BLOCK_BY_DENSITY: Record<Density, string> = {
  comfortable: '16px',
  compact: '12px',
  dense: '8px',
}

const GAP_BY_DENSITY: Record<Density, string> = {
  comfortable: '16px',
  compact: '12px',
  dense: '8px',
}

describe('buildTokens — 6-case matrix (linear × 2 modes × 3 densities)', () => {
  for (const mode of MODES) {
    for (const density of DENSITIES) {
      it(`produces the full token set for linear/${mode}/${density}`, () => {
        const tokens = buildTokens({ direction: 'linear', mode, density })

        // All required keys present.
        for (const key of REQUIRED_KEYS) {
          expect(tokens[key], `missing ${key} for linear/${mode}/${density}`).toBeDefined()
        }

        // Accent is the verbatim Linear brand literal (hex, never OKLCH/hue math).
        expect(tokens['--accent']).toBe('#5e6ad2')
        expect(tokens['--accent']).not.toContain('oklch')

        // Density row-h + logical-property paddings + gap match the scale.
        expect(tokens['--row-h']).toBe(ROW_H_BY_DENSITY[density])
        expect(tokens['--pad-inline']).toBe(PAD_INLINE_BY_DENSITY[density])
        expect(tokens['--pad-block']).toBe(PAD_BLOCK_BY_DENSITY[density])
        expect(tokens['--gap']).toBe(GAP_BY_DENSITY[density])

        // Surface is a direction-driven hex literal.
        expect(tokens['--bg']).toMatch(/^#[0-9a-f]{6}$/i)
        expect(tokens['--surface']).toMatch(/^#[0-9a-f]{6}$/i)
      })
    }
  }
})

describe('buildTokens — Linear palette-literal fidelity (TOKEN-01/03)', () => {
  for (const mode of MODES) {
    describe(`linear/${mode}`, () => {
      const tokens = buildTokens({ direction: 'linear', mode, density: 'comfortable' })
      const p = PALETTES.linear[mode]

      it('core surface/ink/line vars equal the palette literals', () => {
        expect(tokens['--bg']).toBe(p.bg)
        expect(tokens['--surface']).toBe(p.surface)
        expect(tokens['--surface-raised']).toBe(p.surfaceRaised)
        expect(tokens['--ink']).toBe(p.ink)
        expect(tokens['--ink-mute']).toBe(p.inkMute)
        expect(tokens['--ink-faint']).toBe(p.inkFaint)
        expect(tokens['--line']).toBe(p.line)
        expect(tokens['--line-soft']).toBe(p.lineSoft)
        expect(tokens['--sidebar-bg']).toBe(p.sidebar)
        expect(tokens['--sidebar-ink']).toBe(p.sidebarInk)
      })

      it('emits the extended tiers (surface-3/4, ink-tertiary, line-strong)', () => {
        expect(tokens['--surface-3']).toBe(p.surface3)
        expect(tokens['--surface-4']).toBe(p.surface4)
        expect(tokens['--ink-tertiary']).toBe(p.inkTertiary)
        expect(tokens['--line-strong']).toBe(p.lineStrong)
      })

      it('emits the accent family from the palette literals', () => {
        expect(tokens['--accent']).toBe(p.accent.base)
        expect(tokens['--accent-hover']).toBe(p.accent.hover)
        expect(tokens['--accent-fg']).toBe(p.accent.fg)
        expect(tokens['--accent-ink']).toBe(p.accent.ink)
        expect(tokens['--accent-soft']).toBe(p.accent.soft)
      })

      it('emits the semantic family from the palette literals', () => {
        expect(tokens['--danger']).toBe(p.semantic.danger)
        expect(tokens['--danger-soft']).toBe(p.semantic.dangerSoft)
        expect(tokens['--warn']).toBe(p.semantic.warn)
        expect(tokens['--warn-soft']).toBe(p.semantic.warnSoft)
        expect(tokens['--ok']).toBe(p.semantic.ok)
        expect(tokens['--ok-soft']).toBe(p.semantic.okSoft)
        expect(tokens['--info']).toBe(p.semantic.info)
        expect(tokens['--info-soft']).toBe(p.semantic.infoSoft)
      })

      it('emits the SLA family from the palette literals', () => {
        expect(tokens['--sla-ok']).toBe(p.sla.ok)
        expect(tokens['--sla-ok-soft']).toBe(p.sla.okSoft)
        expect(tokens['--sla-risk']).toBe(p.sla.risk)
        expect(tokens['--sla-risk-soft']).toBe(p.sla.riskSoft)
        expect(tokens['--sla-bad']).toBe(p.sla.bad)
        expect(tokens['--sla-bad-soft']).toBe(p.sla.badSoft)
      })

      it('emits all 12 status-tag vars from the six pairs', () => {
        for (let i = 1; i <= 6; i += 1) {
          expect(tokens[`--status-${i}`]).toBe(p.status[i - 1]?.fg)
          expect(tokens[`--status-${i}-soft`]).toBe(p.status[i - 1]?.soft)
        }
      })

      it('emits the radius triplet 6/8/12 + derived field-radius', () => {
        expect(tokens['--radius-sm']).toBe('6px')
        expect(tokens['--radius']).toBe('8px')
        expect(tokens['--radius-lg']).toBe('12px')
        expect(tokens['--field-radius']).toBe('calc(8px * 1.5)')
      })

      it('emits the 3-family Linear font triplet (Inter/JetBrains Mono variable)', () => {
        expect(tokens['--font-display']).toBe(FONTS.linear.display)
        expect(tokens['--font-body']).toBe(FONTS.linear.body)
        expect(tokens['--font-mono']).toBe(FONTS.linear.mono)
        expect(tokens['--font-body']).toContain('Inter Variable')
        expect(tokens['--font-mono']).toContain('JetBrains Mono Variable')
      })

      it('--shadow-card is none (Q2 — Linear has no card shadows)', () => {
        expect(tokens['--shadow-card']).toBe('none')
      })
    })
  }
})

describe('buildTokens — derived tokens', () => {
  it('emits focus-ring + shadow-drawer with fixed literals', () => {
    const tokens = buildTokens({ direction: 'linear', mode: 'dark', density: 'compact' })
    expect(tokens['--focus-ring']).toBe(
      '0 0 0 3px color-mix(in oklch, var(--accent) 40%, transparent)',
    )
    expect(tokens['--shadow-drawer']).toBe('-24px 0 60px rgba(0,0,0,.25)')
  })
})

describe('buildTokens — font triplet is mode/density invariant', () => {
  it('renders the same fonts across modes + densities', () => {
    const a = buildTokens({ direction: 'linear', mode: 'light', density: 'comfortable' })
    const b = buildTokens({ direction: 'linear', mode: 'dark', density: 'dense' })
    expect(a['--font-display']).toBe(b['--font-display'])
    expect(a['--font-body']).toBe(b['--font-body'])
    expect(a['--font-mono']).toBe(b['--font-mono'])
  })
})

describe('buildTokens — purity', () => {
  it('is deterministic — identical inputs produce identical outputs', () => {
    const input = {
      direction: 'linear' as const,
      mode: 'light' as const,
      density: 'comfortable' as const,
    }
    expect(buildTokens(input)).toEqual(buildTokens(input))
  })

  it('does not mutate inputs across calls', () => {
    const inputA = {
      direction: 'linear' as const,
      mode: 'light' as const,
      density: 'comfortable' as const,
    }
    const inputB = {
      direction: 'linear' as const,
      mode: 'dark' as const,
      density: 'dense' as const,
    }
    const snapshotA = { ...inputA }
    const snapshotB = { ...inputB }
    buildTokens(inputA)
    buildTokens(inputB)
    expect(inputA).toEqual(snapshotA)
    expect(inputB).toEqual(snapshotB)
  })
})
