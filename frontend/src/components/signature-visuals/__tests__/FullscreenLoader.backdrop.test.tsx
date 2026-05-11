/**
 * VALIDATION row 37-03-03 — backdrop computed style check.
 * jsdom does not apply `@supports` blocks; we inspect the raw inline style string
 * plus the CSS text for the `@supports not (backdrop-filter)` fallback.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../GlobeLoader', (): { GlobeLoader: () => JSX.Element } => ({
  GlobeLoader: (): JSX.Element => <div data-testid="globe-loader-stub" />,
}))

vi.mock('@/design-system/hooks', (): { useReducedMotion: () => boolean } => ({
  useReducedMotion: (): boolean => true,
}))

import { FullscreenLoader } from '../FullscreenLoader'
import { __resetGlobeLoaderSignalForTests } from '../globeLoaderSignal'

describe('FullscreenLoader — backdrop style (37-03-03)', (): void => {
  afterEach((): void => {
    __resetGlobeLoaderSignalForTests()
  })

  it('renders backdrop with color-mix + backdrop-filter inline styles', (): void => {
    const { container } = render(<FullscreenLoader open />)
    const backdrop = container.querySelector<HTMLElement>(
      '[data-testid="fullscreen-loader-backdrop"]',
    )
    expect(backdrop).not.toBeNull()
    const styleAttr = backdrop?.getAttribute('style') ?? ''
    expect(styleAttr).toContain('color-mix(in srgb, var(--bg) 82%, transparent)')
    expect(styleAttr.toLowerCase()).toContain('backdrop-filter')
    expect(styleAttr).toContain('blur(3px)')
  })

  it('emits an @supports not (backdrop-filter) fallback in globe-loader.css', (): void => {
    const cssPath = path.resolve(
      __dirname,
      '..',
      'globe-loader.css',
    )
    const css = readFileSync(cssPath, 'utf-8')
    expect(css).toMatch(/@supports not \(backdrop-filter/)
    expect(css).toContain('var(--bg) 95%')
  })
})
