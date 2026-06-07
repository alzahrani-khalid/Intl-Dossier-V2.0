/**
 * DossierGlyph XSS / injection tests (Phase 37 T-37-01, Plan 05 Task 05-2 — RED).
 *
 * Locks the T-37-01 mitigation from the plan's threat register:
 *   - Flag asset URL is gated by the in-repo FLAG_CODES allowlist — only known
 *     ISO codes reach /assets/flags/{iso}.svg (no traversal/injection input)
 *   - `name` prop flows through a React text node (auto-escaped)
 *   - No `<script>` tag survives rendering (belt-and-braces)
 *   - SVG `<image href>` (not `xlink:href`) — no `xlink:href` external refs present
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DossierGlyph } from '../DossierGlyph'

describe('DossierGlyph — T-37-01 sanitized output', (): void => {
  it('never emits a <script> tag or xlink:href in any country flag render', (): void => {
    const { container } = render(<DossierGlyph type="country" iso="sa" />)
    expect(container.innerHTML).not.toMatch(/<script/i)
    expect(container.innerHTML).not.toMatch(/xlink:href/i)
  })

  it('escapes a hostile `name` prop (no live <script> element injected)', (): void => {
    const hostile = '<script>alert(1)</script>'
    const { container } = render(
      <DossierGlyph type="country" iso="xx" name={hostile} />,
    )
    // React auto-escapes text children — `<script>` must never become a real node.
    expect(container.querySelector('script')).toBeNull()
    expect(container.innerHTML).not.toMatch(/<script\b/i)
  })
})
