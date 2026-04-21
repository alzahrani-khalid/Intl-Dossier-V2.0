/**
 * TweaksDrawer live tests (THEME-01, Plan 34-04).
 *
 * NOTE ON MOCKING:
 * The project's global `tests/setup.ts` stubs `react-i18next` with a translation
 * lookup table that doesn't include `tweaks.*` keys and omits `initReactI18next`,
 * `I18nextProvider`, and `Trans`. That stub is fine for most tests, but here we
 * need the real `t()` to resolve our EN/AR strings so we can assert rendered
 * labels. The `vi.mock(..., async (importOriginal) => ...)` call below restores
 * the full `react-i18next` surface for this test file only.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Must be declared BEFORE any `import` that transitively pulls react-i18next.
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return actual
})

import type { ReactElement, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'

import i18n from '@/i18n'
import { DesignProvider } from '@/design-system/DesignProvider'
import { TweaksDisclosureProvider } from './TweaksDisclosureProvider'
import { TweaksDrawer } from './TweaksDrawer'
import { useTweaksOpen } from './use-tweaks-open'

function Harness({ children }: { children: ReactNode }): ReactElement {
  return (
    <I18nextProvider i18n={i18n}>
      <DesignProvider>
        <TweaksDisclosureProvider>{children}</TweaksDisclosureProvider>
      </DesignProvider>
    </I18nextProvider>
  )
}

function OpenButton(): ReactElement {
  const { open } = useTweaksOpen()
  return (
    <button type="button" onClick={open}>
      open
    </button>
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

describe('TweaksDrawer (THEME-01)', () => {
  it('renders 6 section headings in English once opened', async () => {
    const user = userEvent.setup()
    render(
      <Harness>
        <OpenButton />
        <TweaksDrawer />
      </Harness>,
    )
    await user.click(screen.getByText('open'))
    // `findByText`/`getByText` throw if no match; asserting truthy is enough
    // in a repo without @testing-library/jest-dom installed.
    expect(await screen.findByText('Direction')).toBeTruthy()
    expect(screen.getByText('Mode')).toBeTruthy()
    expect(screen.getByText('Hue')).toBeTruthy()
    expect(screen.getByText('Density')).toBeTruthy()
    expect(screen.getByText('Classification')).toBeTruthy()
    expect(screen.getByText('Locale')).toBeTruthy()
  })

  it('renders 6 section headings in Arabic once opened', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    render(
      <Harness>
        <OpenButton />
        <TweaksDrawer />
      </Harness>,
    )
    await user.click(screen.getByText('open'))
    expect(await screen.findByText('الاتجاه')).toBeTruthy()
    expect(screen.getByText('المظهر')).toBeTruthy()
    expect(screen.getByText('الدرجة')).toBeTruthy()
    expect(screen.getByText('الكثافة')).toBeTruthy()
    expect(screen.getByText('التصنيف')).toBeTruthy()
    expect(screen.getByText('اللغة')).toBeTruthy()
  })
})
