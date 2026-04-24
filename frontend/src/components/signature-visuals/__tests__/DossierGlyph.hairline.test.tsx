/**
 * DossierGlyph hairline tests (Phase 37 VIZ-04, Plan 05 Task 05-2 — RED).
 *
 * Validates row 37-05-04 in .planning/phases/37-signature-visuals/37-VALIDATION.md:
 * every country-flag render carries the 1px rgba(0,0,0,0.15) hairline circle
 * sitting outside the clipPath at r=15.5 per D-09..D-11.
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DossierGlyph } from '../DossierGlyph'

describe('DossierGlyph — country flag hairline', (): void => {
  it('emits a 1px rgba(0,0,0,0.15) hairline outside the clipPath at r=15.5', (): void => {
    const { container } = render(<DossierGlyph type="country" iso="sa" />)

    // The hairline circle is the one OUTSIDE `<defs>` — i.e. not inside clipPath.
    const allCircles = Array.from(container.querySelectorAll('circle'))
    const hairline = allCircles.find(
      (c): boolean => c.getAttribute('stroke') === 'rgba(0,0,0,0.15)',
    )

    expect(hairline).toBeDefined()
    expect(hairline!.getAttribute('stroke')).toBe('rgba(0,0,0,0.15)')
    expect(hairline!.getAttribute('stroke-width')).toBe('1')
    expect(hairline!.getAttribute('r')).toBe('15.5')
    expect(hairline!.getAttribute('fill')).toBe('none')
  })
})
