/**
 * DossierGlyph initials-fallback tests (Phase 37 VIZ-04, Plan 05 Task 05-2 — RED).
 *
 * Validates row 37-05-03 in .planning/phases/37-signature-visuals/37-VALIDATION.md:
 * unknown ISO codes, missing ISO, and unsupported DossierType members
 * (engagement, working_group — DossierType has 7 members per
 * frontend/src/types/dossier-context.types.ts; `elected_official` is a
 * person_subtype, not a top-level dossier type) fall back to 1–2 char initials
 * inside a soft-tinted circle. No throw per D-11 + RESEARCH Pitfall 6.
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DossierGlyph } from '../DossierGlyph'

describe('DossierGlyph — initials fallback', (): void => {
  it('unknown ISO with a name renders initials starting with first letter', (): void => {
    const { container } = render(<DossierGlyph type="country" iso="xx" name="Xanadu" />)
    expect(container.textContent ?? '').toMatch(/^X/i)
  })

  it('no iso + only name renders initials from the name', (): void => {
    const { container } = render(<DossierGlyph type="country" name="France" />)
    // 'France' is a single word → first two letters uppercased.
    expect(container.textContent).toBe('FR')
  })

  it('type="engagement" renders initials without crashing (Pitfall 6)', (): void => {
    expect((): void => {
      const { container } = render(
        <DossierGlyph type="engagement" name="Summit 2026" />,
      )
      expect(container.textContent).toBe('S2')
    }).not.toThrow()
  })

  it('type="working_group" renders initials without crashing (Pitfall 6)', (): void => {
    const { container } = render(
      <DossierGlyph type="working_group" name="Trade Committee" />,
    )
    expect(container.textContent).toBe('TC')
  })

  it('no name + no iso for unsupported type renders "?" placeholder', (): void => {
    expect((): void => {
      const { container } = render(<DossierGlyph type="engagement" />)
      expect(container.textContent).toBe('?')
    }).not.toThrow()
  })
})
