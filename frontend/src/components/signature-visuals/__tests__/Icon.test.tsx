/**
 * Phase 42 — Plan 00 — Icon component unit tests (RED first per TDD).
 *
 * Validates row 42-00-* in .planning/phases/42-remaining-pages/42-VALIDATION.md:
 * the minimal `<Icon name="..." />` component (R-01, supersedes Phase 37 Icon
 * assumption) renders the 14 stroked glyphs needed by Wave 1 pages with
 * `currentColor` stroke, density-locked SVG attributes, and a safe fallback
 * for unknown names.
 *
 * Verbatim handoff source: frontend/design-system/inteldossier_handoff_design/src/icons.jsx
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Icon, type IconName } from '../Icon'

describe('Icon', (): void => {
  it('renders <svg> with correct stroke attributes for "check"', (): void => {
    const { container } = render(<Icon name="check" size={16} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('width')).toBe('16')
    expect(svg!.getAttribute('height')).toBe('16')
    expect(svg!.getAttribute('viewBox')).toBe('0 0 20 20')
    expect(svg!.getAttribute('fill')).toBe('none')
    expect(svg!.getAttribute('stroke')).toBe('currentColor')
    expect(svg!.getAttribute('stroke-width')).toBe('1.5')
    expect(svg!.querySelector('path')).not.toBeNull()
  })

  it('renders all 14 named glyphs distinctly', (): void => {
    const names: IconName[] = [
      'plus',
      'check',
      'chevron-right',
      'chat',
      'file',
      'link',
      'alert',
      'dot',
      'cog',
      'bell',
      'shield',
      'lock',
      'people',
      'sparkle',
    ]
    for (const name of names) {
      const { container, unmount } = render(<Icon name={name} />)
      expect(container.querySelector(`[data-testid="icon-${name}"]`)).not.toBeNull()
      unmount()
    }
  })

  it('defaults size to 18 when omitted', (): void => {
    const { container } = render(<Icon name="dot" />)
    const svg = container.querySelector('svg')
    expect(svg!.getAttribute('width')).toBe('18')
    expect(svg!.getAttribute('height')).toBe('18')
  })

  it('renders default fallback circle for unknown names', (): void => {
    // @ts-expect-error — runtime fallback for typing escapes
    const { container } = render(<Icon name="not-a-real-glyph" />)
    const circle = container.querySelector('circle[r="7"]')
    expect(circle).not.toBeNull()
  })

  it('passes style prop through to root <svg>', (): void => {
    const { container } = render(<Icon name="plus" style={{ color: 'red' }} />)
    const svg = container.querySelector('svg')
    expect(svg!.getAttribute('style')).toContain('color: red')
  })
})
