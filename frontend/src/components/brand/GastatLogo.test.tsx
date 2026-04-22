/**
 * GastatLogo unit tests (Phase 36 SHELL-05, Wave 0).
 *
 * Per VALIDATION.md 36-00-02 / 36-00-03 the exact test titles below are
 * referenced by Wave 2 `--grep` commands. Do not rename them without updating
 * the validation matrix.
 */

import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { GastatLogo } from './GastatLogo'

describe('GastatLogo', () => {
  it('renders an svg with the handoff viewBox', () => {
    const { container } = render(<GastatLogo />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('viewBox')).toBe('0 0 162.98 233.12')
  })

  it('renders at the provided size, defaulting to 22', () => {
    const { container, rerender } = render(<GastatLogo />)
    let svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('22')
    expect(svg.getAttribute('height')).toBe('22')
    rerender(<GastatLogo size={128} />)
    svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('128')
    expect(svg.getAttribute('height')).toBe('128')
  })

  it('accent tint — declares fill="currentColor" on the outer svg', () => {
    const { container } = render(<GastatLogo />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('fill')).toBe('currentColor')
  })

  it('has aria-hidden so the parent wrapper owns the a11y label', () => {
    const { container } = render(<GastatLogo />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
  })

  it('strips class="cls-*" attributes (Pitfall 1 — no stylesheet to bind them)', () => {
    const { container } = render(<GastatLogo />)
    const elementsWithClsClass = container.querySelectorAll('[class*="cls-"]')
    expect(elementsWithClsClass.length).toBe(0)
  })

  it('renders at least 30 child vector elements (paths/polygons/rects)', () => {
    const { container } = render(<GastatLogo />)
    const vectors = container.querySelectorAll('svg path, svg polygon, svg rect')
    expect(vectors.length).toBeGreaterThanOrEqual(30)
  })
})
