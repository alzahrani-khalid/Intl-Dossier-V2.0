import { describe, expect, it } from 'vitest'

import { buildTokens } from '@/design-system/tokens/buildTokens'
import type { Density, Direction, Mode } from '@/design-system/tokens/types'

/**
 * Canonical matrix per Plan 33-01 DoD:
 *   4 directions × 2 modes × 3 hues × 3 densities = 72 cases.
 *
 * Hue sample points exercise the OKLCH palette wheel:
 *   - 22°  = chancery's warm terracotta default (also the lowest-end sample)
 *   - 190° = situation's signal cyan (cool mid-wheel)
 *   - 250° = a deep-blue sample that also stress-tests `(h+55)%360` without
 *            wrapping through 360 (returns 305)
 *
 * Plus explicit edge-case: hue=350 → `(350 + 55) % 360 = 45` for SC-3 wrap.
 */
const DIRECTIONS: readonly Direction[] = ['chancery', 'situation', 'ministerial', 'bureau'] as const
const MODES: readonly Mode[] = ['light', 'dark'] as const
const SAMPLE_HUES = [22, 190, 250] as const
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
  // Accent family
  '--accent',
  '--accent-ink',
  '--accent-soft',
  '--accent-fg',
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
  // Density
  '--row-h',
  '--pad-inline',
  '--pad-block',
  '--gap',
  // Shape
  '--radius-sm',
  '--radius',
  '--radius-lg',
  // Derived
  '--field-radius',
  '--focus-ring',
  '--shadow-drawer',
  '--shadow-card',
  // Phase 35 — fonts (direction-driven, mode/hue/density-invariant)
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
  comfortable: '12px',
  compact: '8px',
  dense: '4px',
}

describe('buildTokens — 72-case matrix (4 directions × 2 modes × 3 hues × 3 densities)', () => {
  for (const direction of DIRECTIONS) {
    for (const mode of MODES) {
      for (const hue of SAMPLE_HUES) {
        for (const density of DENSITIES) {
          it(`produces full token set for ${direction}/${mode}/h${hue}/${density}`, () => {
            const tokens = buildTokens({ direction, mode, hue, density })

            // All required keys present.
            for (const key of REQUIRED_KEYS) {
              expect(
                tokens[key],
                `missing ${key} for ${direction}/${mode}/h${hue}/${density}`,
              ).toBeDefined()
            }

            // Accent contains the requested hue value as a substring.
            expect(tokens['--accent']).toContain(`${hue}`)
            expect(tokens['--accent']).toContain('oklch')

            // Density row-h + logical-property paddings + gap match the scale.
            expect(tokens['--row-h']).toBe(ROW_H_BY_DENSITY[density])
            expect(tokens['--pad-inline']).toBe(PAD_INLINE_BY_DENSITY[density])
            expect(tokens['--pad-block']).toBe(PAD_BLOCK_BY_DENSITY[density])
            expect(tokens['--gap']).toBe(GAP_BY_DENSITY[density])

            // Surface is a direction-driven hex literal, not an OKLCH expression.
            expect(tokens['--bg']).toMatch(/^#[0-9a-f]{6}$/i)
            expect(tokens['--surface']).toMatch(/^#[0-9a-f]{6}$/i)
          })
        }
      }
    }
  }
})

describe('buildTokens — SC-2: light/dark OKLCH flip (accent-ink lightness, accent-soft chroma)', () => {
  const fixedHue = 22
  const input = { direction: 'chancery' as const, hue: fixedHue, density: 'comfortable' as const }

  it('flips --accent-ink lightness from 42% (light) to 72% (dark) at the same hue', () => {
    const light = buildTokens({ ...input, mode: 'light' })
    const dark = buildTokens({ ...input, mode: 'dark' })

    expect(light['--accent-ink']).toBe(`oklch(42% 0.15 ${fixedHue})`)
    expect(dark['--accent-ink']).toBe(`oklch(72% 0.12 ${fixedHue})`)
  })

  it('flips --accent-soft chroma from 0.05 (light) to 0.08 (dark) at the same hue', () => {
    const light = buildTokens({ ...input, mode: 'light' })
    const dark = buildTokens({ ...input, mode: 'dark' })

    expect(light['--accent-soft']).toBe(`oklch(92% 0.05 ${fixedHue})`)
    expect(dark['--accent-soft']).toBe(`oklch(25% 0.08 ${fixedHue})`)
  })

  it('flips semantic palette lightness across modes (danger, warn, ok, info)', () => {
    const light = buildTokens({ ...input, mode: 'light' })
    const dark = buildTokens({ ...input, mode: 'dark' })

    expect(light['--danger']).toBe('oklch(52% 0.18 25)')
    expect(dark['--danger']).toBe('oklch(70% 0.16 25)')
    expect(light['--warn']).toBe('oklch(62% 0.14 75)')
    expect(dark['--warn']).toBe('oklch(78% 0.14 75)')
    expect(light['--ok']).toBe('oklch(52% 0.12 155)')
    expect(dark['--ok']).toBe('oklch(72% 0.14 155)')
    expect(light['--info']).toBe('oklch(50% 0.14 230)')
    expect(dark['--info']).toBe('oklch(72% 0.13 230)')
  })
})

describe('buildTokens — SC-3: hue recomputes accent family + SLA (hue+55°), sla-bad hue-locked', () => {
  it('shifts --sla-risk hue by +55° for hue=22 (→ 77)', () => {
    const tokens = buildTokens({
      direction: 'chancery',
      mode: 'light',
      hue: 22,
      density: 'comfortable',
    })
    expect(tokens['--sla-risk']).toBe('oklch(60% 0.13 77)')
  })

  it('shifts --sla-risk hue by +55° for hue=250 (→ 305, no wrap)', () => {
    const tokens = buildTokens({
      direction: 'situation',
      mode: 'dark',
      hue: 250,
      density: 'compact',
    })
    expect(tokens['--sla-risk']).toBe('oklch(74% 0.13 305)')
  })

  it('wraps --sla-risk hue through 360 for hue=350 (→ 45)', () => {
    const tokens = buildTokens({
      direction: 'ministerial',
      mode: 'light',
      hue: 350,
      density: 'dense',
    })
    expect(tokens['--sla-risk']).toBe('oklch(60% 0.13 45)')
  })

  it('keeps --sla-bad hue-locked to 25 regardless of input hue', () => {
    const hues = [22, 100, 190, 250, 350] as const
    for (const hue of hues) {
      const light = buildTokens({
        direction: 'chancery',
        mode: 'light',
        hue,
        density: 'comfortable',
      })
      const dark = buildTokens({ direction: 'chancery', mode: 'dark', hue, density: 'comfortable' })
      expect(light['--sla-bad']).toBe('oklch(54% 0.2 25)')
      expect(dark['--sla-bad']).toBe('oklch(68% 0.18 25)')
    }
  })

  it('tracks --sla-ok with the accent hue (no shift)', () => {
    const tokens = buildTokens({
      direction: 'bureau',
      mode: 'light',
      hue: 100,
      density: 'comfortable',
    })
    expect(tokens['--sla-ok']).toBe('oklch(58% 0.14 100)')
  })
})

describe('buildTokens — SC-4: density values (rowH, pad-inline, pad-block, gap)', () => {
  it('emits comfortable=52px / 20px / 16px / 12px', () => {
    const tokens = buildTokens({
      direction: 'chancery',
      mode: 'light',
      hue: 22,
      density: 'comfortable',
    })
    expect(tokens['--row-h']).toBe('52px')
    expect(tokens['--pad-inline']).toBe('20px')
    expect(tokens['--pad-block']).toBe('16px')
    expect(tokens['--gap']).toBe('12px')
  })

  it('emits compact=40px / 14px / 12px / 8px', () => {
    const tokens = buildTokens({
      direction: 'chancery',
      mode: 'light',
      hue: 22,
      density: 'compact',
    })
    expect(tokens['--row-h']).toBe('40px')
    expect(tokens['--pad-inline']).toBe('14px')
    expect(tokens['--pad-block']).toBe('12px')
    expect(tokens['--gap']).toBe('8px')
  })

  it('emits dense=32px / 10px / 8px / 4px', () => {
    const tokens = buildTokens({
      direction: 'chancery',
      mode: 'light',
      hue: 22,
      density: 'dense',
    })
    expect(tokens['--row-h']).toBe('32px')
    expect(tokens['--pad-inline']).toBe('10px')
    expect(tokens['--pad-block']).toBe('8px')
    expect(tokens['--gap']).toBe('4px')
  })
})

describe('buildTokens — per-direction radius scale', () => {
  const cases: Array<[Direction, { sm: string; base: string; lg: string }]> = [
    ['chancery', { sm: '2px', base: '2px', lg: '2px' }],
    ['situation', { sm: '2px', base: '3px', lg: '4px' }],
    ['ministerial', { sm: '6px', base: '10px', lg: '14px' }],
    ['bureau', { sm: '8px', base: '12px', lg: '16px' }],
  ]

  for (const [direction, expected] of cases) {
    it(`emits correct radius triplet for ${direction}`, () => {
      const tokens = buildTokens({ direction, mode: 'light', hue: 22, density: 'comfortable' })
      expect(tokens['--radius-sm']).toBe(expected.sm)
      expect(tokens['--radius']).toBe(expected.base)
      expect(tokens['--radius-lg']).toBe(expected.lg)
      expect(tokens['--field-radius']).toBe(`calc(${expected.base} * 1.5)`)
    })
  }
})

describe('buildTokens — derived tokens', () => {
  it('emits focus-ring with color-mix(in oklch, var(--accent) 40%, transparent)', () => {
    const tokens = buildTokens({
      direction: 'chancery',
      mode: 'light',
      hue: 22,
      density: 'comfortable',
    })
    expect(tokens['--focus-ring']).toBe(
      '0 0 0 3px color-mix(in oklch, var(--accent) 40%, transparent)',
    )
  })

  it('emits shadow-drawer + shadow-card with fixed rgba literals', () => {
    const tokens = buildTokens({
      direction: 'bureau',
      mode: 'dark',
      hue: 100,
      density: 'compact',
    })
    expect(tokens['--shadow-drawer']).toBe('-24px 0 60px rgba(0,0,0,.25)')
    expect(tokens['--shadow-card']).toBe('0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)')
  })
})

describe('buildTokens — purity', () => {
  it('is deterministic — identical inputs produce identical outputs', () => {
    const input = {
      direction: 'chancery' as const,
      mode: 'light' as const,
      hue: 22,
      density: 'comfortable' as const,
    }
    expect(buildTokens(input)).toEqual(buildTokens(input))
  })

  it('does not mutate inputs across calls', () => {
    const inputA = {
      direction: 'chancery' as const,
      mode: 'light' as const,
      hue: 22,
      density: 'comfortable' as const,
    }
    const inputB = {
      direction: 'situation' as const,
      mode: 'dark' as const,
      hue: 190,
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

describe('buildTokens — Phase 35 per-direction font triplet (TYPO-01)', () => {
  const cases: Array<[Direction, { display: string; body: string; mono: string }]> = [
    [
      'chancery',
      {
        display: "'Fraunces', serif",
        body: "'Inter', system-ui, sans-serif",
        mono: "'JetBrains Mono', ui-monospace, monospace",
      },
    ],
    [
      'situation',
      {
        display: "'Space Grotesk', system-ui, sans-serif",
        body: "'IBM Plex Sans', system-ui, sans-serif",
        mono: "'IBM Plex Mono', ui-monospace, monospace",
      },
    ],
    [
      'ministerial',
      {
        display: "'Public Sans', system-ui, sans-serif",
        body: "'Public Sans', system-ui, sans-serif",
        mono: "'JetBrains Mono', ui-monospace, monospace",
      },
    ],
    [
      'bureau',
      {
        display: "'Inter', system-ui, sans-serif",
        body: "'Inter', system-ui, sans-serif",
        mono: "'JetBrains Mono', ui-monospace, monospace",
      },
    ],
  ]

  for (const [direction, expected] of cases) {
    it(`emits correct font triplet for ${direction}`, () => {
      const tokens = buildTokens({ direction, mode: 'light', hue: 22, density: 'comfortable' })
      expect(tokens['--font-display']).toBe(expected.display)
      expect(tokens['--font-body']).toBe(expected.body)
      expect(tokens['--font-mono']).toBe(expected.mono)
    })

    it(`${direction} font triplet is mode/hue/density invariant`, () => {
      const a = buildTokens({ direction, mode: 'light', hue: 22, density: 'comfortable' })
      const b = buildTokens({ direction, mode: 'dark', hue: 190, density: 'dense' })
      expect(a['--font-display']).toBe(b['--font-display'])
      expect(a['--font-body']).toBe(b['--font-body'])
      expect(a['--font-mono']).toBe(b['--font-mono'])
    })
  }
})
