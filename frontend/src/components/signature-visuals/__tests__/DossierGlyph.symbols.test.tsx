/**
 * DossierGlyph symbol-fallback tests (Phase 37 VIZ-04, Plan 05 Task 05-2 — RED).
 *
 * Validates row 37-05-02 in .planning/phases/37-signature-visuals/37-VALIDATION.md:
 * non-country types {forum, person, topic, organization} render a Unicode symbol
 * glyph in a soft-tinted circle (D-10 — `color-mix(in srgb, ...)` tint).
 *
 * Symbol map per handoff glyph.jsx lines 234-254:
 *   forum        → \u25C7 (◇)
 *   person       → \u25CF (●)
 *   topic        → \u25C6 (◆)
 *   organization → \u25B2 (▲)
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DossierGlyph } from '../DossierGlyph'

describe('DossierGlyph — symbol fallbacks for non-country types', (): void => {
  it('renders the forum diamond symbol \u25C7', (): void => {
    const { container } = render(<DossierGlyph type="forum" />)
    expect(container.textContent).toContain('\u25C7')
  })

  it('renders the person disc symbol \u25CF', (): void => {
    const { container } = render(<DossierGlyph type="person" />)
    expect(container.textContent).toContain('\u25CF')
  })

  it('renders the topic solid-diamond symbol \u25C6', (): void => {
    const { container } = render(<DossierGlyph type="topic" />)
    expect(container.textContent).toContain('\u25C6')
  })

  it('renders the organization triangle symbol \u25B2', (): void => {
    const { container } = render(<DossierGlyph type="organization" />)
    expect(container.textContent).toContain('\u25B2')
  })

  it('applies a color-mix soft tint to the symbol background (D-10)', (): void => {
    const { container } = render(<DossierGlyph type="forum" />)
    const span = container.querySelector('span')
    expect(span).not.toBeNull()
    // JSDOM preserves inline style strings verbatim.
    expect(span!.getAttribute('style') ?? '').toContain('color-mix(in srgb,')
  })
})
