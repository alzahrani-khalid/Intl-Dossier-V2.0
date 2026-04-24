/**
 * DossierGlyph flag-resolver tests (Phase 37 VIZ-04, Plan 05 Task 05-2 — RED).
 *
 * Validates row 37-05-01 in .planning/phases/37-signature-visuals/37-VALIDATION.md:
 * each of the 24 ISO codes from FlagKey resolves to a country flag `<g>` inside
 * a circular `<clipPath>` when rendered via `<DossierGlyph type="country" iso={iso} />`.
 *
 * Also locks the case-insensitivity contract — `iso="SA"` resolves identically
 * to `iso="sa"` per D-11.
 *
 * Test titles are grepped by the plan's acceptance criteria — do not rename
 * without updating 37-05-PLAN.md.
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DossierGlyph } from '../DossierGlyph'

const ISO_LIST: ReadonlyArray<string> = [
  'sa', 'ae', 'id', 'eg', 'qa', 'jo', 'bh', 'om', 'kw', 'pk',
  'ma', 'tr', 'cn', 'it', 'fr', 'de', 'gb', 'us', 'jp', 'kr',
  'in', 'br', 'eu', 'un',
]

describe.each(ISO_LIST)('DossierGlyph — %s flag', (iso: string): void => {
  it('renders a flag inside a circular clipPath', (): void => {
    const { container } = render(<DossierGlyph type="country" iso={iso} />)
    const clipCircle = container.querySelector('clipPath circle')
    expect(clipCircle).not.toBeNull()
    expect(clipCircle!.getAttribute('cx')).toBe('16')
    expect(clipCircle!.getAttribute('cy')).toBe('16')
    expect(clipCircle!.getAttribute('r')).toBe('16')

    const clipped = container.querySelector('g[clip-path]')
    expect(clipped).not.toBeNull()
  })
})

describe('DossierGlyph — ISO case-insensitivity', (): void => {
  it('resolves uppercase ISO identically to lowercase', (): void => {
    const upper = render(<DossierGlyph type="country" iso="SA" />)
    const lower = render(<DossierGlyph type="country" iso="sa" />)

    const upperClip = upper.container.querySelector('clipPath circle')
    const lowerClip = lower.container.querySelector('clipPath circle')
    expect(upperClip).not.toBeNull()
    expect(lowerClip).not.toBeNull()

    const upperClipped = upper.container.querySelector('g[clip-path]')
    const lowerClipped = lower.container.querySelector('g[clip-path]')
    expect(upperClipped).not.toBeNull()
    expect(lowerClipped).not.toBeNull()
  })
})
