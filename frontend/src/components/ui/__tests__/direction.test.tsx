import type { ReactElement } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useDirection } from '@radix-ui/react-direction'
import i18n from '@/i18n'
import { DirectionProvider } from '../direction'

/**
 * RTLB-01 owner contract (assumption A3 check): DirectionProvider is the single
 * runtime direction owner. It derives `dir` from `i18n.language`, writes
 * `<html dir/lang>`, and bridges the SAME value into Radix's direction context —
 * all in one React commit, so the document and every Radix portal agree before
 * the next paint. Probe renders Radix's `useDirection()` context value so the
 * test can assert the DOM write and the Radix context land together.
 */
function Probe(): ReactElement {
  const dir = useDirection()
  return <span data-testid="radix-dir">{dir}</span>
}

describe('DirectionProvider (RTLB-01 single direction owner)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('derives ltr from i18n language "en" — html dir/lang and Radix context all agree', async () => {
    await act(async () => {
      await i18n.changeLanguage('en')
    })

    const { getByTestId } = render(
      <DirectionProvider>
        <Probe />
      </DirectionProvider>,
    )

    expect(document.documentElement.dir).toBe('ltr')
    expect(document.documentElement.lang).toBe('en')
    expect(getByTestId('radix-dir').textContent).toBe('ltr')
  })

  it('flips document AND Radix context to rtl in the same commit when language → "ar"', async () => {
    const { getByTestId } = render(
      <DirectionProvider>
        <Probe />
      </DirectionProvider>,
    )

    expect(document.documentElement.dir).toBe('ltr')

    await act(async () => {
      await i18n.changeLanguage('ar')
    })

    // Same-commit: DOM write (useLayoutEffect) and Radix context (render) both landed.
    expect(document.documentElement.dir).toBe('rtl')
    expect(document.documentElement.lang).toBe('ar')
    expect(getByTestId('radix-dir').textContent).toBe('rtl')
  })

  it('round-trips back to ltr when language → "en"', async () => {
    const { getByTestId } = render(
      <DirectionProvider>
        <Probe />
      </DirectionProvider>,
    )

    await act(async () => {
      await i18n.changeLanguage('ar')
    })
    expect(document.documentElement.dir).toBe('rtl')

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    expect(document.documentElement.dir).toBe('ltr')
    expect(document.documentElement.lang).toBe('en')
    expect(getByTestId('radix-dir').textContent).toBe('ltr')
  })
})
